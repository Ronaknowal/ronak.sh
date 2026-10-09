"""Finite arithmetic records, explicit token grammar, masks and independent checks.

python distillation_traces.py --output trace-contracts.json
Requires PyTorch. All arithmetic data are constructed and include exact truth;
this grammar checker does not judge arbitrary natural-language reasoning.
"""
import argparse
import hashlib
import json
from pathlib import Path

import torch


TOKENS = ['<pad>','<bos>','<eos>'] + [str(i) for i in range(109)] + [
    '(',')','+','*','=','sum',';','product','answer']
LOOKUP = {token:index for index,token in enumerate(TOKENS)}
PAD, BOS, EOS = 0, 1, 2
VOCABULARY = len(TOKENS)


def encode(tokens):
    return [LOOKUP[str(token)] for token in tokens]


def text(ids):
    return ' '.join(TOKENS[index] if 0 <= index < VOCABULARY else f'<id:{index}>' for index in ids)


def prompt(a,b,c):
    return encode(['<bos>','(',a,'+',b,')','*',c,'='])


def response(a,b,c,answer_only=False):
    result = (a+b)*c
    if answer_only:
        return encode([result,'<eos>'])
    return encode(['sum',a+b,';','product',result,';','answer',result,'<eos>'])


def records():
    families = [(a,b) for a in range(1,10) for b in range(a,10)]
    families.sort(key=lambda pair:hashlib.sha256(f'distill-v1:{pair[0]},{pair[1]}'.encode()).hexdigest())
    groups = {'train':families[:32],'dev':families[32:38],'test':families[38:],
              'shift':families[38:]}
    result = {}
    for split,pairs in groups.items():
        multipliers = (5,6) if split == 'shift' else (1,2,3,4)
        result[split] = [
            {'id':f'{a}:{b}:{c}','family':f'{a}:{b}','a':a,'b':b,'c':c,
             'prompt_ids':prompt(a,b,c),'response_ids':response(a,b,c),'answer':(a+b)*c}
            for a,b in pairs for c in multipliers]
    return result


def integer(token):
    if 3 <= token < 112:
        return token-3
    return None


def check_trace(ids,a,b,c,answer_only=False):
    """Distinguish format, final answer, and the actual arithmetic dependencies."""
    if answer_only:
        structural = len(ids)==2 and integer(ids[0]) is not None and ids[1]==EOS
        value = integer(ids[0]) if structural else None
        return {'structural':structural,'answer':value,'final_correct':structural and value==(a+b)*c,
                'sum_correct':None,'product_follows_sum':None,'answer_follows_product':None,
                'all_steps_correct':None}
    markers = {0:'sum',2:';',3:'product',5:';',6:'answer',8:'<eos>'}
    structural = (len(ids)==9 and all(ids[i]==LOOKUP[token] for i,token in markers.items())
                  and all(integer(ids[i]) is not None for i in (1,4,7)))
    if not structural:
        return {'structural':False,'answer':None,'final_correct':False,'sum_correct':False,
                'product_follows_sum':False,'answer_follows_product':False,'all_steps_correct':False}
    s,p,value = [integer(ids[i]) for i in (1,4,7)]
    return {'structural':True,'answer':value,'final_correct':value==(a+b)*c,
            'sum_correct':s==a+b,'product_follows_sum':p==s*c,
            'answer_follows_product':value==p,'all_steps_correct':s==a+b and p==s*c and value==p}


def collate(rows):
    """Right padding is safe for this causal decoder; targets use explicit lengths.

    Each row contains prompt_ids and response_ids. Predictor column boundary-1
    supplies the first response token. Actual EOS remains a target.
    """
    if not rows or any(not row['prompt_ids'] or not row['response_ids'] for row in rows):
        raise ValueError('Nonempty prompt and response required')
    width = max(len(row['prompt_ids'])+len(row['response_ids']) for row in rows)
    ids = torch.full((len(rows),width),PAD,dtype=torch.long)
    targets = torch.full_like(ids,-100)
    teacher = torch.zeros((len(rows),width-1,VOCABULARY),dtype=torch.float32)
    for index,row in enumerate(rows):
        prefix,completion = row['prompt_ids'],row['response_ids']
        boundary,total = len(prefix),len(prefix)+len(completion)
        ids[index,:total] = torch.tensor(prefix+completion)
        targets[index,boundary:total] = torch.tensor(completion)
        if 'teacher_log_probs' in row:
            values = torch.tensor(row['teacher_log_probs'],dtype=torch.float32)
            if values.shape != (len(completion),VOCABULARY):
                raise ValueError('One aligned full-vocabulary teacher row per completion token')
            teacher[index,boundary-1:total-1] = values
    labels = targets[:,1:]
    return {'input_ids':ids[:,:-1],'labels':labels,'mask':labels!=-100,'teacher_logits':teacher}


def student_rows(candidates, source, arm):
    """All non-verified arms use the exact same structurally eligible candidate IDs."""
    lookup = {row['id']:row for row in source}
    result = []
    for candidate in candidates:
        if not candidate['check']['structural']:
            continue
        if arm=='verified' and not candidate['check']['all_steps_correct']:
            continue
        original = lookup[candidate['parent_id']]
        completion = candidate['ids']
        if arm=='gold':
            completion = original['response_ids']
        elif arm=='answer':
            completion = [candidate['ids'][7],EOS]
        elif arm not in ('hard','soft','verified'):
            raise ValueError('Unknown student arm')
        row = {**original,'candidate_id':candidate['id'],'response_ids':completion}
        if arm=='soft':
            row['teacher_log_probs'] = candidate['log_probs']
        result.append(row)
    return result


def verify():
    splits = records()
    assert [len(splits[k]) for k in ('train','dev','test','shift')]==[128,24,28,14]
    sets = {k:{row['family'] for row in splits[k]} for k in ('train','dev','test')}
    assert not sets['train'] & sets['dev'] and not sets['train'] & sets['test'] and not sets['dev'] & sets['test']
    for rows in splits.values():
        for row in rows:
            assert check_trace(row['response_ids'],row['a'],row['b'],row['c'])['all_steps_correct']
    correct = response(2,3,4)
    wrong_step = correct.copy()
    wrong_step[1] = LOOKUP['6']
    wrong_coherent = encode(['sum',6,';','product',24,';','answer',24,'<eos>'])
    cases = [correct,wrong_step,wrong_coherent,correct[:-1],correct+[PAD],[PAD],[]]
    checks = [check_trace(case,2,3,4) for case in cases]
    assert checks[1]['final_correct'] and not checks[1]['all_steps_correct']
    assert checks[2]['product_follows_sum'] and not checks[2]['final_correct']
    pair = [{'prompt_ids':prompt(2,3,4),'response_ids':correct},
            {'prompt_ids':prompt(2,3,4),'response_ids':response(2,3,4,True)}]
    batch = collate(pair)
    assert batch['mask'].sum(-1).tolist()==[9,2]
    assert batch['labels'][0,8].item()==LOOKUP['sum']
    assert batch['labels'][1,9].item()==EOS
    assert batch['mask'][1,10:].sum().item()==0
    return {'vocabulary':TOKENS,'split_records':{k:len(v) for k,v in splits.items()},
            'split_families':{k:sorted(v) for k,v in sets.items()},
            'trace_fixtures':[{'text':text(case),'check':check} for case,check in zip(cases,checks)],
            'labels':batch['labels'].tolist(),'target_counts':batch['mask'].sum(-1).tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    report = json.dumps(verify(),indent=2)+'\n'
    if args.output:
        args.output.write_text(report,encoding='utf8')
    print(report)


if __name__ == '__main__':
    main()
