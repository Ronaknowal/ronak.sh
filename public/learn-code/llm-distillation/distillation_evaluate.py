"""Exact-length generation and evaluation for the finite neural trace study.

python distillation_evaluate.py --verify --output evaluation-contracts.json
The scientific driver opens test data only after sealing all student selections.
Native poem evaluation uses the separately supplied SFT evaluation helper.
"""
import argparse
import hashlib
import json
from pathlib import Path

import torch
import torch.nn.functional as F

from distillation_traces import PAD, EOS, VOCABULARY, collate, check_trace, response, text


def chunks(rows,size):
    for begin in range(0,len(rows),size):
        yield rows[begin:begin+size]


@torch.no_grad()
def generate(model,rows,greedy=True,seed=0,cap=12,batch_size=16,save_probabilities=False):
    """Full vocabulary generation; first EOS ends a row, without forced EOS.

    A separate per-parent generator makes sampling independent of batch size.
    Right-padding does not precede any real token in the reused causal decoder.
    Emitted PAD/BOS IDs remain real actions; lengths define validity.
    """
    model.eval()
    results = []
    for group in chunks(rows,batch_size):
        lengths = torch.tensor([len(row['prompt_ids']) for row in group])
        if int(lengths.max())+cap > model.context:
            raise ValueError('Generation would exceed the declared context; no rolling window')
        ids = torch.full((len(group),int(lengths.max())+cap),PAD,dtype=torch.long)
        streams = []
        for i,row in enumerate(group):
            ids[i,:lengths[i]] = torch.tensor(row['prompt_ids'])
            digest = hashlib.sha256(f'{seed}:{row["id"]}'.encode()).digest()
            streams.append(torch.Generator().manual_seed(int.from_bytes(digest[:8],'little')%(2**63)))
        active = [True]*len(group)
        emitted = [[] for _ in group]
        logs = [[] for _ in group]
        stopped = [False]*len(group)
        for _ in range(cap):
            logits = model(ids[:,:int(lengths.max())])
            current = logits[torch.arange(len(group)),lengths-1].log_softmax(-1)
            for i in range(len(group)):
                if not active[i]:
                    continue
                token = (int(current[i].argmax()) if greedy else
                         int(torch.multinomial(current[i].exp(),1,generator=streams[i])))
                if save_probabilities:
                    logs[i].append(current[i].tolist())
                emitted[i].append(token)
                ids[i,lengths[i]] = token
                lengths[i] += 1
                if token==EOS:
                    active[i] = False
                    stopped[i] = True
            if not any(active):
                break
        for i,row in enumerate(group):
            result = {'parent_id':row['id'],'ids':emitted[i],'text':text(emitted[i]),
                      'eos_stopped':stopped[i],'horizon':not stopped[i],'length':len(emitted[i])}
            if save_probabilities:
                result['log_probs'] = logs[i]
            results.append(result)
    return results


@torch.no_grad()
def nll(model,rows,answer_only=False,batch_size=32):
    model.eval()
    total,targets = 0.,0
    details = []
    for group in chunks(rows,batch_size):
        chosen = [{**row,'response_ids':response(row['a'],row['b'],row['c'],answer_only)} for row in group]
        batch = collate(chosen)
        logits = model(batch['input_ids'])
        terms = F.cross_entropy(logits.reshape(-1,VOCABULARY),batch['labels'].reshape(-1),
                                ignore_index=-100,reduction='none').reshape_as(batch['labels'])
        for row,value,count in zip(group,terms.double().sum(-1).tolist(),batch['mask'].sum(-1).tolist()):
            total += value
            targets += count
            details.append({'id':row['id'],'sum_nats':value,'targets':count})
    return {'sum_nats':total,'targets':targets,'nll':total/targets if targets else None,
            'target_format':'answer-only' if answer_only else 'full-trace','rows':details}


def evaluate(model,rows,answer_only=False):
    outputs = generate(model,rows,greedy=True)
    correct,structural,valid_steps,stopped = 0,0,0,0
    for source,output in zip(rows,outputs):
        check = check_trace(output['ids'],source['a'],source['b'],source['c'],answer_only)
        output['check'] = check
        output['gold'] = source['answer']
        correct += int(check['final_correct'])
        structural += int(check['structural'])
        valid_steps += int(check['all_steps_correct'] or False)
        stopped += int(output['eos_stopped'])
    count = len(rows)
    return {'records':count,'correct':correct,'accuracy':correct/count if count else None,
            'structural':structural,'invalid':count-structural,'eos_stopped':stopped,
            'full_trace_correct':None if answer_only else valid_steps,
            'mean_length':sum(row['length'] for row in outputs)/count if count else None,
            'reference':nll(model,rows,answer_only),'outputs':outputs}


def agreement(student,teacher):
    lookup = {row['parent_id']:row for row in teacher['outputs']}
    matched = sum(bool(row['check']['structural'] and lookup[row['parent_id']]['check']['structural']
                       and row['check']['answer']==lookup[row['parent_id']]['check']['answer'])
                  for row in student['outputs'])
    return {'valid_equal_answers':matched,'records':student['records'],
            'fraction':matched/student['records'] if student['records'] else None}


def verify():
    class Literal(torch.nn.Module):
        context = 32
        def forward(self,ids):
            logits = torch.full((*ids.shape,VOCABULARY),-30.)
            for i in range(ids.shape[0]):
                for j in range(ids.shape[1]):
                    logits[i,j,PAD if j==1 else EOS] = 30.
            return logits
    rows = [{'id':'a','prompt_ids':[1,4]},{'id':'b','prompt_ids':[1,4,5]}]
    generated = generate(Literal(),rows)
    assert generated[0]['ids']==[PAD,EOS]
    assert generated[1]['ids']==[EOS]
    assert all(row['eos_stopped'] for row in generated)
    return {'constructed_emitted_pad_is_real':generated,
            'mean_of_batch_means_example':{'sums':[4,9],'counts':[2,3],
                'pooled':13/5,'wrong_equal_batch_mean':(4/2+9/3)/2}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify',action='store_true')
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    result = json.dumps(verify(),indent=2)+'\n'
    if args.output:
        args.output.write_text(result,encoding='utf8')
    print(result)


if __name__ == '__main__':
    main()
