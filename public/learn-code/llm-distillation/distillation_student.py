"""Matched smaller-student fits on a once-collected neural teacher corpus.

python distillation_study.py students --work study
Requires PyTorch/NumPy. Every declared arm and seed is retained, including
empty or failed outcomes. Test evaluation is a separate sealed stage.
"""
import json
from pathlib import Path
import time

import torch
import torch.nn.functional as F

from tiny_causal_lm import TinyLM
from distillation_loss import torch_divergence
from distillation_traces import VOCABULARY, collate, student_rows
from distillation_evaluate import evaluate
from distillation_study import checked, sha, write_json, save_checkpoint, batch_plan


def load_student(path):
    model = TinyLM(VOCABULARY,context=32,width=32,heads=2,layers=1)
    model.load_state_dict(torch.load(path,map_location='cpu',weights_only=True))
    return model.float().eval()


def train(work,arm,seed):
    work = Path(work)
    protocol = checked(work)
    if arm not in protocol['arms'] or seed not in protocol['seeds']:
        raise ValueError('Undeclared arm or seed')
    folder = work/f'{arm}-{seed}'
    folder.mkdir(exist_ok=True)
    if (folder/'completed.json').exists():
        return {'reused_completed':str(folder/'completed.json')}
    corpus = json.loads((work/'teacher-candidates.json').read_text(encoding='utf8'))
    if corpus['protocol_sha256']!=sha(work/'protocol.json'):
        raise ValueError('Corpus belongs to another protocol')
    rows = student_rows(corpus['candidates'],protocol['records']['train'],arm)
    if not rows:
        result = {'status':'unavailable','arm':arm,'seed':seed,'reason':'No eligible teacher rows',
                  'steps':0,'protocol_sha256':sha(work/'protocol.json'),'corpus_sha256':sha(work/'teacher-candidates.json')}
        write_json(folder/'completed.json',result)
        return result
    torch.set_num_threads(2)
    torch.manual_seed(seed)
    model = TinyLM(VOCABULARY,context=32,width=32,heads=2,layers=1).float()
    initial = work/f'initial-student-{seed}.pt'
    if initial.exists():
        stored = torch.load(initial,map_location='cpu',weights_only=True)
        assert all(torch.equal(value,stored[key]) for key,value in model.state_dict().items())
        model.load_state_dict(stored)
    else:
        torch.save(model.state_dict(),initial)
    optimizer = torch.optim.AdamW(model.parameters(),lr=.003,betas=(.9,.999),eps=1e-8,weight_decay=0)
    plan = batch_plan(len(rows),600,seed)
    manifest = {'arm':arm,'seed':seed,'initial_sha256':sha(initial),'corpus_sha256':sha(work/'teacher-candidates.json'),
                'candidate_ids':[row['candidate_id'] for row in rows],'parents':len({row['id'] for row in rows}),
                'rows':len(rows),'plan':plan,'protocol_sha256':sha(work/'protocol.json')}
    manifest_path = folder/'inputs.json'
    if manifest_path.exists():
        assert json.loads(manifest_path.read_text(encoding='utf8'))==manifest
    else:
        write_json(manifest_path,manifest)
    history,step,best,best_step,elapsed = [],0,-1.,0,0.
    if (folder/'resume.pt').exists():
        checkpoint = torch.load(folder/'resume.pt',map_location='cpu',weights_only=False)
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        torch.set_rng_state(checkpoint['rng'])
        history,step,best,best_step,elapsed = [checkpoint[k] for k in ('history','step','best','best_step','elapsed')]
    else:
        development = evaluate(model,protocol['records']['dev'],answer_only=arm=='answer')
        best = development['accuracy']
        history.append({'step':0,'dev':development})
        torch.save(model.state_dict(),folder/'selected.pt')
        save_checkpoint(folder,model,optimizer,history,0,best,0,0.)
    begin = time.perf_counter()
    targets = sum(item['targets'] for item in history if 'targets' in item)
    examples = sum(item['examples'] for item in history if 'examples' in item)
    segment_targets,segment_examples = 0,0
    for step_index in range(step,600):
        group = [rows[index] for index in plan[step_index]]
        batch = collate(group)
        model.train()
        logits = model(batch['input_ids'])
        if arm=='soft':
            loss = torch_divergence(logits,batch['teacher_logits'],batch['mask'],temperature=1.)
        else:
            loss = F.cross_entropy(logits.reshape(-1,VOCABULARY),batch['labels'].reshape(-1),ignore_index=-100)
        if not torch.isfinite(loss):
            raise FloatingPointError('Nonfinite student loss; retain outcome without changing protocol')
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
        if not torch.isfinite(norm):
            raise FloatingPointError('Nonfinite student gradient norm')
        optimizer.step()
        segment_targets += int(batch['mask'].sum())
        segment_examples += len(group)
        current = step_index+1
        if current%200==0:
            development = evaluate(model,protocol['records']['dev'],answer_only=arm=='answer')
            history.append({'step':current,'last_train_loss':float(loss.detach()),'gradient_norm_before_clip':float(norm),
                            'dev':development,'targets':segment_targets,'examples':segment_examples})
            targets += segment_targets
            examples += segment_examples
            segment_targets,segment_examples = 0,0
            if development['accuracy'] > best:
                best,best_step = development['accuracy'],current
                torch.save(model.state_dict(),folder/'selected.pt')
            duration = elapsed+time.perf_counter()-begin
            save_checkpoint(folder,model,optimizer,history,current,best,best_step,duration)
            print(json.dumps({'arm':arm,'seed':seed,'step':current,'dev_accuracy':development['accuracy'],
                              'selected_step':best_step}),flush=True)
    result = {'status':'complete','arm':arm,'seed':seed,'steps':600,'selected_step':best_step,
              'selected_dev_accuracy':best,'selected_sha256':sha(folder/'selected.pt'),
              'parameters':sum(p.numel() for p in model.parameters()),'initial_sha256':sha(initial),
              'targets':targets,'examples':examples,'unique_rows':len(rows),
              'unique_parents':len({row['id'] for row in rows}),'history':history,
              'elapsed_seconds':elapsed+time.perf_counter()-begin,
              'protocol_sha256':sha(work/'protocol.json'),'corpus_sha256':sha(work/'teacher-candidates.json')}
    write_json(folder/'completed.json',result)
    return result
