"""A complete scratch grouped update around a pretrained causal LM backbone.

Run: python online_preferences.py --model ./response-17/selected --data ./data \
  --method grpo --output ./scratch-grpo
The model/attention implementation and autograd are delegated to Transformers
and PyTorch. Sampling, group statistics, masks, objective and updates are local.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from group_losses import group_advantages, grpo_loss, response_logps, rloo_loss, rloo_reward
from sft_data import LABELS, collate, encode_record, load_source
from sft_evaluate import evaluate


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_policy(path):
    tokenizer = AutoTokenizer.from_pretrained(path, local_files_only=True)
    tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(path, local_files_only=True).float()
    model.config.use_cache = False
    for layer in model.modules():
        if isinstance(layer, torch.nn.Dropout):
            layer.p = 0.
    model.eval()
    return model, tokenizer


def classify_ids(tokenizer, ids):
    unmapped = [token for token in ids if token >= len(tokenizer)]
    text = None if unmapped else tokenizer.decode(ids, skip_special_tokens=True)
    normalized = text.strip() if text is not None else None
    return {'text':text, 'prediction':normalized if normalized in LABELS else 'invalid',
            'unmapped_ids':unmapped,
            'eos_stopped':bool(ids and ids[-1] == tokenizer.eos_token_id)}


@torch.no_grad()
def sample_responses(model, tokenizer, prompt_rows, group_size=4, cap=8):
    """T=1, full vocabulary, no top-k/p filtering and no forced EOS.

    Prompt rows are repeated consecutively. The next-logit row is each actual
    final valid position; stopped rows never acquire another sampled action.
    """
    rows = [row for row in prompt_rows for _ in range(group_size)]
    lengths = torch.tensor([len(row['prompt_ids']) for row in rows])
    capacity = int(lengths.max())+cap
    ids = torch.full((len(rows),capacity),tokenizer.eos_token_id,dtype=torch.long)
    for index,row in enumerate(rows):
        ids[index,:lengths[index]] = torch.tensor(row['prompt_ids'])
    active = torch.ones(len(rows),dtype=torch.bool)
    generated = [[] for _ in rows]
    sampled_logps = [[] for _ in rows]
    model.eval()
    for _ in range(cap):
        width = int(lengths.max())
        valid = torch.arange(width)[None,:] < lengths[:,None]
        logits = model(input_ids=ids[:,:width],attention_mask=valid.long(),use_cache=False).logits
        next_logits = logits[torch.arange(len(rows)),lengths-1]
        logps = next_logits.log_softmax(-1)
        next_ids = torch.multinomial(logps.exp(),1).squeeze(-1)
        for index in range(len(rows)):
            if not bool(active[index]):
                continue
            token = int(next_ids[index])
            generated[index].append(token)
            sampled_logps[index].append(float(logps[index,token]))
            ids[index,lengths[index]] = token
            lengths[index] += 1
            if token == tokenizer.eos_token_id:
                active[index] = False
        if not bool(active.any()):
            break
    output = []
    for row,emitted,logps in zip(rows,generated,sampled_logps):
        result = classify_ids(tokenizer,emitted)
        output.append({**row, **result, 'ids':row['prompt_ids']+emitted,
                       'boundary':len(row['prompt_ids']),'completion_ids':emitted,
                       'sampled_logps':logps,'reward':float(result['prediction']==row['label'])})
    return output


def rollout_batch(rows, pad_id):
    batch = collate(rows,policy='response',pad_id=pad_id)
    return {'input_ids':batch['input_ids'],'attention_mask':batch['attention_mask'],
            'response_mask':batch['labels'] != -100}


def loss_for_batch(model, batch, old_logps, reference_logps, rewards, method, group_size=4):
    logps,mask = response_logps(model,**batch)
    if method == 'grpo':
        advantages,counts = group_advantages(rewards,group_size,'standardized')
        loss,details = grpo_loss(logps,old_logps,reference_logps,mask,advantages,
                                 beta=.01,epsilon=.2,reduction='response',
                                 importance='token',bias_correction_kl=False)
        shaped = rewards.detach()
    elif method == 'rloo':
        shaped,sampled_kl = rloo_reward(rewards,old_logps,reference_logps,mask,beta=.01)
        advantages,counts = group_advantages(shaped,group_size,'loo')
        loss,details = rloo_loss(logps,old_logps,mask,advantages,epsilon=.2)
        details['reward_side_log_ratio'] = sampled_kl
    else:
        raise ValueError('Use grpo or rloo.')
    return loss, {'advantages':advantages,'valid_counts':counts,'shaped_rewards':shaped,
                  'logps':logps,'mask':mask,**details}


def parameter_change(model, reference):
    squared = 0.
    maximum = 0.
    changed = 0
    for current,initial in zip(model.parameters(),reference.parameters(),strict=True):
        difference = current.detach().double()-initial.detach().double()
        squared += float(difference.square().sum())
        maximum = max(maximum,float(difference.abs().max()))
        changed += int(torch.count_nonzero(difference))
    return {'l2':squared**.5,'maximum_absolute':maximum,'changed_elements':changed}


def run(model_path, data_path, method, output, seed=73, steps=2, evaluate_model=True):
    output = Path(output)
    if output.exists():
        raise FileExistsError('Use a new output directory; do not overwrite a completed or failed run.')
    output.mkdir(parents=True)
    torch.set_num_threads(2)
    torch.manual_seed(seed)
    model,tokenizer = load_policy(model_path)
    reference = copy.deepcopy(model).requires_grad_(False).eval()
    source = load_source(data_path)
    pool = sorted(source['train'],key=lambda row:row['id'])[:16]
    test = sorted(source['test'],key=lambda row:row['id'])[:32]
    encoded = [encode_record(row,tokenizer) for row in pool]
    order = torch.randperm(len(encoded)).tolist()
    optimizer = torch.optim.SGD(model.parameters(),lr=1e-5)
    records = []
    before = evaluate(model,tokenizer,test) if evaluate_model else None
    for step in range(steps):
        rows = sample_responses(model,tokenizer,[encoded[order[step % len(order)]]])
        batch = rollout_batch(rows,tokenizer.eos_token_id)
        rewards = torch.tensor([row['reward'] for row in rows])
        with torch.no_grad():
            old_logps,mask = response_logps(model,**batch)
            reference_logps,_ = response_logps(reference,**batch)
        sampling_errors = []
        for index,row in enumerate(rows):
            expected = torch.tensor(row['sampled_logps'])
            observed = old_logps[index][mask[index]]
            torch.testing.assert_close(observed,expected,atol=2e-5,rtol=2e-5)
            sampling_errors.append(float((observed-expected).abs().max()))
        optimizer.zero_grad(set_to_none=True)
        loss,details = loss_for_batch(model,batch,old_logps,reference_logps,rewards,method)
        loss.backward()
        gradient_norm = sum(float(p.grad.detach().double().square().sum())
                            for p in model.parameters() if p.grad is not None)**.5
        optimizer.step()
        record = {'step':step+1,'loss':float(loss.detach()),'gradient_l2':gradient_norm,
                  'responses':rows,'sampling_logp_max_error':sampling_errors,
                  'details':{name:value.detach().tolist() for name,value in details.items()}}
        records.append(record)
        # Retain the exact observed batch if a later step fails.
        (output/f'step-{step+1}.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    saved = output/'selected'
    model.save_pretrained(saved)
    tokenizer.save_pretrained(saved)
    after = evaluate(model,tokenizer,test) if evaluate_model else None
    reloaded,_ = load_policy(saved)
    check_batch = rollout_batch([encode_record(test[0],tokenizer)],tokenizer.eos_token_id)
    with torch.no_grad():
        original_scores,_ = response_logps(model,**check_batch)
        restored_scores,_ = response_logps(reloaded,**check_batch)
    torch.testing.assert_close(original_scores,restored_scores,atol=0,rtol=0)
    report = {'method':method,'seed':seed,'steps':steps,'initial_model':str(model_path),
              'initial_weights_sha256':sha256(Path(model_path)/'model.safetensors'),
              'source_ids':{'train_pool':[r['id'] for r in pool],'test':[r['id'] for r in test]},
              'observations':records,'before':before,'after':after,
              'parameter_change':parameter_change(model,reference),'reload_exact':True,
              'config':{'group_size':4,'generation_cap':8,'temperature':1.,'top_p':1.,'top_k':0,
                        'beta':.01,'epsilon':.2,'learning_rate':1e-5,'optimizer':'SGD',
                        'disable_dropout':True,'use_bias_correction_kl':False}}
    (output/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--method',choices=['grpo','rloo'],required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--seed',type=int,default=73)
    parser.add_argument('--steps',type=int,default=2)
    parser.add_argument('--skip-evaluation',action='store_true')
    args = parser.parse_args()
    report = run(args.model,args.data,args.method,args.output,args.seed,args.steps,not args.skip_evaluation)
    print(json.dumps({'method':report['method'],'steps':report['steps'],
                      'parameter_change':report['parameter_change'],'reload_exact':report['reload_exact']}))


if __name__ == '__main__':
    main()
