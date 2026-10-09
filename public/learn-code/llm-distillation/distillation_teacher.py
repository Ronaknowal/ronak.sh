"""Fit one declared neural teacher, then collect its candidates exactly once.

python distillation_study.py teacher --work study
python distillation_study.py corpus --work study
Requires PyTorch and the supplied TinyLM. A prospective protocol must exist.
"""
import json
from pathlib import Path
import time

import torch
import torch.nn.functional as F

from tiny_causal_lm import TinyLM
from distillation_traces import VOCABULARY, collate, check_trace
from distillation_evaluate import nll, generate
from distillation_study import checked, sha, write_json, save_checkpoint


def load_teacher(work):
    work = Path(work)
    completion = json.loads((work/'teacher/completed.json').read_text(encoding='utf8'))
    path = work/'teacher/selected.pt'
    if sha(path)!=completion['selected_sha256']:
        raise ValueError('Selected teacher identity changed')
    model = TinyLM(VOCABULARY,context=32,width=64,heads=4,layers=2)
    model.load_state_dict(torch.load(path,map_location='cpu',weights_only=True))
    return model.float().eval()


def train(work):
    work = Path(work)
    protocol = checked(work)
    folder = work/'teacher'
    folder.mkdir(exist_ok=True)
    if (folder/'completed.json').exists():
        return {'reused_completed':str(folder/'completed.json')}
    rows = protocol['records']
    torch.set_num_threads(2)
    torch.manual_seed(11)
    model = TinyLM(VOCABULARY,context=32,width=64,heads=4,layers=2).float()
    optimizer = torch.optim.AdamW(model.parameters(),lr=.003,betas=(.9,.999),eps=1e-8,weight_decay=0)
    history,step,best,best_step,elapsed = [],0,float('inf'),0,0.
    if (folder/'resume.pt').exists():
        checkpoint = torch.load(folder/'resume.pt',map_location='cpu',weights_only=False)
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        torch.set_rng_state(checkpoint['rng'])
        history,step,best,best_step,elapsed = [checkpoint[k] for k in ('history','step','best','best_step','elapsed')]
    else:
        initial = nll(model,rows['dev'])
        best = initial['nll']
        history.append({'step':0,'dev':initial})
        torch.save(model.state_dict(),folder/'selected.pt')
        save_checkpoint(folder,model,optimizer,history,0,best,0,0.)
    begin = time.perf_counter()
    targets,examples = sum(item['targets'] for item in history if 'targets' in item),sum(item['examples'] for item in history if 'examples' in item)
    segment_targets,segment_examples = 0,0
    for step_index in range(step,1200):
        group = [rows['train'][i] for i in protocol['teacher_plan'][step_index]]
        batch = collate(group)
        model.train()
        logits = model(batch['input_ids'])
        loss = F.cross_entropy(logits.reshape(-1,VOCABULARY),batch['labels'].reshape(-1),ignore_index=-100)
        if not torch.isfinite(loss):
            raise FloatingPointError('Nonfinite teacher loss; preserve this run without changing protocol')
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
        if not torch.isfinite(norm):
            raise FloatingPointError('Nonfinite teacher gradient norm')
        optimizer.step()
        segment_targets += int(batch['mask'].sum())
        segment_examples += len(group)
        current = step_index+1
        if current%300==0:
            development = nll(model,rows['dev'])
            history.append({'step':current,'last_train_loss':float(loss.detach()),'gradient_norm_before_clip':float(norm),
                            'dev':development,'targets':segment_targets,'examples':segment_examples})
            targets += segment_targets
            examples += segment_examples
            segment_targets,segment_examples = 0,0
            if development['nll'] < best:
                best,best_step = development['nll'],current
                torch.save(model.state_dict(),folder/'selected.pt')
            duration = elapsed+time.perf_counter()-begin
            save_checkpoint(folder,model,optimizer,history,current,best,best_step,duration)
            print(json.dumps({'teacher_step':current,'dev_nll':development['nll'],'selected_step':best_step}),flush=True)
    result = {'status':'complete','seed':11,'steps':1200,'selected_step':best_step,'selected_dev_nll':best,
              'selected_sha256':sha(folder/'selected.pt'),'parameters':sum(p.numel() for p in model.parameters()),
              'targets':targets,'examples':examples,'history':history,'elapsed_seconds':elapsed+time.perf_counter()-begin,
              'protocol_sha256':sha(work/'protocol.json')}
    write_json(folder/'completed.json',result)
    return result


def collect(work):
    work = Path(work)
    protocol = checked(work)
    path = work/'teacher-candidates.json'
    if path.exists():
        return {'reused_corpus':str(path),'sha256':sha(path)}
    model = load_teacher(work)
    torch.set_num_threads(2)
    candidates = []
    source = protocol['records']['train']
    lookup = {row['id']:row for row in source}
    identity = {'teacher_sha256':sha(work/'teacher/selected.pt'),
                'protocol_sha256':sha(work/'protocol.json')}
    journal = work/'corpus-batches'
    journal.mkdir(exist_ok=True)
    started = time.perf_counter()
    batch_seconds = 0.
    for policy,greedy in [('greedy',True),('sample',False)]:
        for begin in range(0,len(source),16):
            group = source[begin:begin+16]
            checkpoint = journal/f'{policy}-{begin:03d}.json'
            batch_identity = {**identity,'policy':policy,'parents':[row['id'] for row in group]}
            if checkpoint.exists():
                saved = json.loads(checkpoint.read_text(encoding='utf8'))
                if saved['identity']!=batch_identity:
                    raise ValueError('Collected batch belongs to different inputs')
            else:
                batch_started = time.perf_counter()
                generated = generate(model,group,greedy=greedy,seed=protocol['corpus_seed'],save_probabilities=True)
                for row in generated:
                    original = lookup[row['parent_id']]
                    row['id'] = f'{row["parent_id"]}/{policy}'
                    row['policy'] = policy
                    row['check'] = check_trace(row['ids'],original['a'],original['b'],original['c'])
                saved = {'identity':batch_identity,'candidates':generated,
                         'elapsed_seconds':time.perf_counter()-batch_started}
                write_json(checkpoint,saved)
            candidates.extend(saved['candidates'])
            batch_seconds += saved['elapsed_seconds']
    result = {**identity,
              'count':len(candidates),'structural':sum(row['check']['structural'] for row in candidates),
              'final_correct':sum(row['check']['final_correct'] for row in candidates),
              'all_steps_correct':sum(row['check']['all_steps_correct'] for row in candidates),
              'generated_tokens':sum(row['length'] for row in candidates),
              'elapsed_seconds':batch_seconds,'assembly_seconds':time.perf_counter()-started,
              'candidates':candidates}
    write_json(path,result)
    return {key:value for key,value in result.items() if key!='candidates'}
