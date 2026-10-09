"""Three prospectively fixed small BANKING77 fits; development selects weights.

python train_decision.py prepare --data data/banking.json --output results/scratch
python train_decision.py fit --output results/scratch
Inspect and independently review protocol.json before running fit.
The six selected intents are not a 77-class benchmark. Calibration/test labels
never influence gradients, vocabulary, checkpoint selection or seed selection.
"""
import argparse
import hashlib
import json
import random
import time
from pathlib import Path

import torch
from torch.nn import functional as F

from typed_decision import TypedDecisionModel, batch_rows, make_vocabulary, lexical_logits

SEEDS=[17,29,43]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_json(path,value):
    with Path(path).open('x',encoding='utf-8') as stream:
        json.dump(value,stream,indent=2,ensure_ascii=False,allow_nan=False)


def prepare(data_file,output):
    if output.exists():
        raise ValueError('Use a fresh output folder; preserve earlier protocols')
    data=json.loads(data_file.read_text(encoding='utf-8'))
    if [len(data[k]) for k in ['train','dev','calibration','test']] != [240,60,120,120]:
        raise ValueError('Unexpected frozen cohort counts')
    output.mkdir(parents=True)
    save_json(output/'data.json',data)
    vocabulary=make_vocabulary(data['train'])
    save_json(output/'vocabulary.json',vocabulary)
    plans={}
    for seed in SEEDS:
        rng=random.Random(seed)
        steps=[]
        while len(steps)<400:
            order=list(range(len(data['train'])))
            rng.shuffle(order)
            for start in range(0,len(order),24):
                batch=[]
                for index in order[start:start+24]:
                    permutation=list(range(6));rng.shuffle(permutation)
                    batch.append({'row':index,'permutation':permutation})
                steps.append(batch)
        plans[str(seed)]=steps[:400]
    save_json(output/'plans.json',plans)
    sources=['train_decision.py','typed_decision.py']
    save_json(output/'protocol.json',{
        'status':'prospective-before-any-fit','data_sha256':digest(data_file),
        'copied_data_sha256':digest(output/'data.json'),'plans_sha256':digest(output/'plans.json'),
        'vocabulary_sha256':digest(output/'vocabulary.json'),
        'sources':{name:digest(Path(__file__).parent/name) for name in sources},
        'seeds':SEEDS,'primary_seed':17,'updates':400,'batch_size':24,
        'architecture':'exact project width32 blocks2 heads4 dropout0 max128',
        'optimizer':{'name':'AdamW','lr':.003,'weight_decay':.01,'betas':[.9,.999],'eps':1e-8,'clip':1},
        'threads':4,'dtype':'float32','selection':'earliest minimum development NLL at 0,40,...,400',
        'budget':'three fits; no adaptive seed/step/hyperparameter change',
        'evaluation':'all three fits terminal before selected logits on calibration/test; all seeds retained',
    })


def logits_for(model,rows,vocabulary):
    model.eval()
    with torch.inference_mode():
        return torch.cat([model(*batch_rows(rows[i:i+24],vocabulary)) for i in range(0,len(rows),24)])


def fit_one(output,data,vocabulary,plan,seed):
    destination=output/f'seed-{seed}'
    if destination.exists():
        raise ValueError('A seed folder already exists; do not silently repeat a fit')
    destination.mkdir()
    torch.manual_seed(seed)
    model=TypedDecisionModel(len(vocabulary))
    optimizer=torch.optim.AdamW(model.parameters(),lr=.003,weight_decay=.01,betas=(.9,.999),eps=1e-8)
    torch.save(model.state_dict(),destination/'initial.pt')
    history=[];best=float('inf');selected=None
    started=time.perf_counter()
    dev_targets=torch.tensor([row['target'] for row in data['dev']])
    for step in range(401):
        if step%40==0:
            scores=logits_for(model,data['dev'],vocabulary)
            nll=F.cross_entropy(scores,dev_targets).item()
            history.append({'step':step,'development_nll':nll,
                            'development_accuracy':(scores.argmax(-1)==dev_targets).float().mean().item()})
            if nll<best:
                best,selected=nll,step
                torch.save(model.state_dict(),destination/'selected.pt')
        if step==400:
            break
        batch=[]
        for item in plan[step]:
            original=data['train'][item['row']]
            permutation=item['permutation']
            batch.append({**original,'options':[original['options'][i] for i in permutation],
                          'target':permutation.index(original['target'])})
        model.train()
        scores=model(*batch_rows(batch,vocabulary))
        targets=torch.tensor([row['target'] for row in batch])
        loss=F.cross_entropy(scores,targets)
        if not torch.isfinite(loss):
            raise FloatingPointError('Nonfinite loss; preserve this failed seed rather than retry')
        optimizer.zero_grad(set_to_none=True);loss.backward()
        gradient=torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
        optimizer.step()
        if (step+1)%40==0:
            history[-1]['next_40th_batch_nll']=loss.item()
            history[-1]['next_40th_gradient_norm']=float(gradient)
    torch.save({'model':model.state_dict(),'optimizer':optimizer.state_dict(),
                'rng':torch.get_rng_state(),'step':400},destination/'terminal.pt')
    save_json(destination/'completed.json',{
        'status':'completed','seed':seed,'steps':400,'examples':400*24,
        'selected_step':selected,'selected_development_nll':best,'history':history,
        'parameters':sum(p.numel() for p in model.parameters()),
        'initial_sha256':digest(destination/'initial.pt'),'selected_sha256':digest(destination/'selected.pt'),
        'elapsed_seconds':time.perf_counter()-started,
    })


def fit(output):
    protocol=json.loads((output/'protocol.json').read_text())
    for name,expected in protocol['sources'].items():
        if digest(Path(__file__).parent/name)!=expected:
            raise ValueError('Program changed after protocol freeze')
    for name,key in [('data.json','copied_data_sha256'),('plans.json','plans_sha256'),('vocabulary.json','vocabulary_sha256')]:
        if digest(output/name)!=protocol[key]:
            raise ValueError(f'{name} changed after protocol freeze')
    torch.set_num_threads(4)
    data=json.loads((output/'data.json').read_text())
    vocabulary=json.loads((output/'vocabulary.json').read_text())
    plans=json.loads((output/'plans.json').read_text())
    for seed in SEEDS:
        complete=output/f'seed-{seed}/completed.json'
        if complete.exists():
            row=json.loads(complete.read_text())
            if row['status']!='completed' or digest(complete.parent/'selected.pt')!=row['selected_sha256']:
                raise ValueError('Existing result is not intact')
            continue
        try:
            fit_one(output,data,vocabulary,plans[str(seed)],seed)
        except Exception as error:
            save_json(output/f'failure-{seed}.json',{'status':'failed','error':repr(error)})
            raise
    save_json(output/'selection-seal.json',{'protocol_sha256':digest(output/'protocol.json'),
              'completed':{str(seed):digest(output/f'seed-{seed}/completed.json') for seed in SEEDS}})
    # First access to held-out model outputs comes after every selection is sealed.
    result={}
    for seed in SEEDS:
        model=TypedDecisionModel(len(vocabulary))
        model.load_state_dict(torch.load(output/f'seed-{seed}/selected.pt',weights_only=True,map_location='cpu'))
        result[f'seed-{seed}']={split:{'ids':[row['id'] for row in rows],
            'logits':logits_for(model,rows,vocabulary).tolist(),'targets':[row['target'] for row in rows]}
            for split,rows in data.items()}
    result['lexical']={split:{'ids':[row['id'] for row in rows],'logits':lexical_logits(rows).tolist(),
                       'targets':[row['target'] for row in rows]} for split,rows in data.items()}
    save_json(output/'logits.json',result)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['prepare','fit'])
    parser.add_argument('--data',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.command=='prepare':
        if args.data is None:parser.error('--data is required for prepare')
        prepare(args.data,args.output)
    else:
        fit(args.output)
