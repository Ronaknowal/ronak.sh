"""Prospective neural distillation protocol and irreversible held-out boundary.

python distillation_study.py freeze --work study
python distillation_study.py run --work study

The second command resumes incomplete stages and reuses terminal artifacts.
This driver owns the finite arithmetic campaign. The separately frozen native
pretrained route is implemented by distillation_native.py.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import traceback

import numpy as np
import torch

from distillation_traces import TOKENS, records


SCIENTIFIC_FILES = ['distillation_loss.py','distillation_traces.py','distillation_evaluate.py',
                    'distillation_teacher.py','distillation_student.py','distillation_study.py','tiny_causal_lm.py']
ARMS = ['gold','hard','soft','answer','verified']
SEEDS = [17,29,43]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path,value):
    path = Path(path)
    temporary = path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf8')
    temporary.replace(path)


def batch_plan(count,steps,seed,batch=16):
    if count<1:
        return []
    generator = torch.Generator().manual_seed(seed)
    plan = []
    while len(plan)<steps:
        permutation = torch.randperm(count,generator=generator).tolist()
        plan.extend(permutation[i:i+batch] for i in range(0,count,batch))
    return plan[:steps]


def save_checkpoint(folder,model,optimizer,history,step,best,best_step,elapsed):
    target = Path(folder)/'resume.pt'
    temporary = Path(folder)/'resume.tmp'
    torch.save({'model':model.state_dict(),'optimizer':optimizer.state_dict(),
                'rng':torch.get_rng_state(),'history':history,'step':step,'best':best,
                'best_step':best_step,'elapsed':elapsed},temporary)
    temporary.replace(target)


def contract():
    return {'sources':{name:sha(Path(__file__).parent/name) for name in SCIENTIFIC_FILES},
            'versions':{'torch':torch.__version__,'numpy':np.__version__}}


def checked(work):
    protocol = json.loads((Path(work)/'protocol.json').read_text(encoding='utf8'))
    if protocol['contract']!=contract():
        raise ValueError('Frozen scientific source or environment changed')
    if protocol['records']!=records() or protocol['vocabulary']!=TOKENS:
        raise ValueError('Frozen data or vocabulary changed')
    return protocol


def freeze(work):
    work = Path(work)
    work.mkdir(parents=True,exist_ok=True)
    if (work/'protocol.json').exists():
        raise FileExistsError('Prospective protocol already exists; do not overwrite it')
    protocol = {'frozen_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'boundary':'before first scientific teacher update and model-generated corpus',
        'contract':contract(),'records':records(),'vocabulary':TOKENS,
        'family_rule':'ascending SHA256(UTF8(distill-v1:a,b)); first32/next6/last7 families',
        'teacher':{'seed':11,'width':64,'heads':4,'layers':2,'context':32,'steps':1200,
                   'development_steps':[0,300,600,900,1200],
                   'selection':'minimum pooled gold-trace NLL; earliest tie, including0'},
        'teacher_plan':batch_plan(128,1200,11),'corpus_seed':20261008,
        'corpus':{'policies':['greedy','full-vocabulary temperature1 sampling'],'per_prompt':2,
                  'prompts':128,'cap':12,'eos':'first actual EOS; no forced EOS',
                  'sampling_rng':'separate SHA256(seed:parent_id) stream for each prompt',
                  'retention':'save all256; structural eligibility for student targets; never regenerate rejects'},
        'arms':ARMS,'seeds':SEEDS,
        'student':{'width':32,'heads':2,'layers':1,'context':32,'steps':600,
                   'development_steps':[0,200,400,600],
                   'selection':'maximum dev greedy exact final-answer accuracy; earliest tie including0',
                   'initial_state':'one shared fresh TinyLM state per seed across all arms',
                   'soft':'full teacher distribution at copied eligible prefixes, forwardKL,T1',
                   'answer':'copied final integer plusEOS; different length/conditioning recipe',
                   'verified':'all arithmetic steps and final answer correct; changed support/weights'},
        'optimizer':{'name':'AdamW','lr':.003,'betas':[.9,.999],'eps':1e-8,'weight_decay':0,
                     'clip_norm':1,'schedule':'constant'},
        'batch_size':16,'keep_short_batch':True,'device':'CPU','precision':'FP32','threads':2,
        'loss_reduction':'pooled selected response positions per minibatch; EOS included',
        'test_rule':'all15 terminal student outcomes then selection seal then once per selected model/split',
        'evaluation':'full-vocabulary greedy cap12; exact grammar/final/step measures and format-specific reference NLL',
        'display_rule':'first two test families in frozen order, all four c; first two invalid/wrong corpus IDs in sorted order',
        'failure_rule':'retain all failures/empty outcomes; no outcome-driven hyperparameter or seed changes',
        'native_route':'separate prospective protocol; not a dependency of these seven scientific files'}
    write_json(work/'protocol.json',protocol)
    return {'protocol':str(work/'protocol.json'),'sha256':sha(work/'protocol.json')}


def students(work):
    from distillation_student import train
    protocol = checked(work)
    results = []
    for seed in protocol['seeds']:
        for arm in protocol['arms']:
            try:
                results.append(train(work,arm,seed))
            except Exception as error:
                folder = Path(work)/f'{arm}-{seed}'
                folder.mkdir(exist_ok=True)
                result = {'status':'failed','arm':arm,'seed':seed,'exception':repr(error),
                          'traceback':traceback.format_exc(),'protocol_sha256':sha(Path(work)/'protocol.json')}
                write_json(folder/'completed.json',result)
                results.append(result)
                print(json.dumps({'arm':arm,'seed':seed,'failed':repr(error)}),flush=True)
    return results


def seal(work):
    work = Path(work)
    protocol = checked(work)
    rows = []
    for seed in protocol['seeds']:
        for arm in protocol['arms']:
            folder = work/f'{arm}-{seed}'
            path = folder/'completed.json'
            completed = json.loads(path.read_text(encoding='utf8'))
            if completed['status'] not in ('complete','unavailable','failed'):
                raise ValueError('Nonterminal scientific outcome')
            row = {'arm':arm,'seed':seed,'status':completed['status'],'completed_sha256':sha(path)}
            if completed['status']=='complete':
                if sha(folder/'selected.pt')!=completed['selected_sha256']:
                    raise ValueError('Selected state changed')
                if completed['corpus_sha256']!=sha(work/'teacher-candidates.json'):
                    raise ValueError('Fits used different corpus versions')
                row.update({'selected_sha256':completed['selected_sha256'],'selected_step':completed['selected_step']})
            rows.append(row)
    result = {'sealed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'protocol_sha256':sha(work/'protocol.json'),'corpus_sha256':sha(work/'teacher-candidates.json'),
              'teacher_completed_sha256':sha(work/'teacher/completed.json'),'students':rows}
    path = work/'selections-sealed.json'
    if path.exists():
        existing = json.loads(path.read_text(encoding='utf8'))
        if any(existing[key]!=result[key] for key in result if key!='sealed_at'):
            raise ValueError('Existing selection seal changed')
        return existing
    write_json(path,result)
    return result


def evaluate_all(work):
    from distillation_teacher import load_teacher
    from distillation_student import load_student
    from distillation_evaluate import evaluate, agreement
    work = Path(work)
    protocol = checked(work)
    selection = seal(work)
    torch.set_num_threads(2)
    results = {'protocol_sha256':sha(work/'protocol.json'),'seal_sha256':sha(work/'selections-sealed.json'),
               'teacher':{},'students':[]}
    teacher = None
    for split in ('test','shift'):
        path = work/f'teacher-{split}.json'
        if path.exists():
            result = json.loads(path.read_text(encoding='utf8'))
            if result['seal_sha256']!=results['seal_sha256']:
                raise ValueError('Teacher evaluation belongs to another seal')
        else:
            if teacher is None:
                teacher = load_teacher(work)
            result = evaluate(teacher,protocol['records'][split])
            result['seal_sha256'] = results['seal_sha256']
            write_json(path,result)
        results['teacher'][split] = result
    del teacher
    for selected in selection['students']:
        if selected['status']!='complete':
            results['students'].append(selected)
            continue
        arm,seed = selected['arm'],selected['seed']
        model = None
        item = {**selected,'results':{}}
        for split in ('test','shift'):
            path = work/f'{arm}-{seed}'/f'{split}.json'
            if path.exists():
                result = json.loads(path.read_text(encoding='utf8'))
                if result['selected_sha256']!=selected['selected_sha256'] or result['seal_sha256']!=results['seal_sha256']:
                    raise ValueError('Existing test result has different selected inputs')
            else:
                if model is None:
                    model = load_student(work/f'{arm}-{seed}'/'selected.pt')
                result = evaluate(model,protocol['records'][split],answer_only=arm=='answer')
                result['teacher_agreement'] = agreement(result,results['teacher'][split])
                result['selected_sha256'] = selected['selected_sha256']
                result['seal_sha256'] = results['seal_sha256']
                write_json(path,result)
            item['results'][split] = result
        results['students'].append(item)
        print(json.dumps({'evaluated':f'{arm}-{seed}','test_accuracy':item['results']['test']['accuracy'],
                          'selected_step':selected['selected_step']}),flush=True)
    path = work/'evaluation.json'
    if path.exists():
        if json.loads(path.read_text(encoding='utf8'))!=results:
            raise ValueError('Final evaluation changed')
    else:
        write_json(path,results)
    return {'evaluation':str(path),'sha256':sha(path),'outcomes':len(results['students'])}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('stage',choices=['freeze','teacher','corpus','students','seal','evaluate','run'])
    parser.add_argument('--work',type=Path,required=True)
    args = parser.parse_args()
    if args.stage=='freeze':
        result = freeze(args.work)
    else:
        from distillation_teacher import train, collect
        actions = {'teacher':train,'corpus':collect,'students':students,'seal':seal,'evaluate':evaluate_all}
        if args.stage=='run':
            result = {}
            for stage,action in actions.items():
                result[stage] = action(args.work)
        else:
            result = actions[args.stage](args.work)
    if args.stage in ('freeze','evaluate'):
        print(json.dumps(result),flush=True)


if __name__=='__main__':
    main()
