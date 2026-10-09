"""Prospectively frozen six-fit pretrained SFT experiment.

Commands (all paths are explicit):
  python sft_study.py freeze --data poems --model pythia-14m --work study
  python sft_study.py train --data poems --model pythia-14m --work study --policy response --seed 17
  python sft_study.py evaluate --data poems --model pythia-14m --work study
Run train for response/full and seeds17/29/43. Test evaluation requires all six
completed fits. Reuse complete fits; interrupted fits resume the last checkpoint.
Requires Torch and Transformers. It downloads nothing and never chooses a seed.
"""
import argparse
from collections import Counter
import datetime
import hashlib
import json
from pathlib import Path
import time

import torch
import torch.nn.functional as F
import transformers
from transformers import AutoModelForCausalLM, AutoTokenizer

from sft_data import LABELS, TEMPLATE, MODEL_REVISION, REVISION, collate, encode_record, load_source
from sft_evaluate import classification_metrics, evaluate, response_nll


SEEDS = [17, 29, 43]
POLICIES = ['response', 'full']
MODEL_SHA = '116a02532db461f91386a5b20f942ff2c8d4de7341e21b55caafc3d7b25f49a1'
PROGRAMS = ['sft_objective.py', 'sft_data.py', 'sft_batching.py', 'sft_study.py', 'sft_trl.py', 'sft_evaluate.py']


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')


def contract(data, model):
    return {'programs': {name: sha(Path(__file__).parent/name) for name in PROGRAMS},
            'data': {name: sha(data/f'{name}.tsv') for name in ['train', 'dev', 'test']},
            'model': {p.name: sha(p) for p in sorted(model.iterdir()) if p.is_file()},
            'versions': {'torch': torch.__version__, 'transformers': transformers.__version__}}


def batch_plan(seed, examples=843, steps=200, batch_size=8):
    generator = torch.Generator().manual_seed(seed)
    plan = []
    while len(plan) < steps:
        order = torch.randperm(examples, generator=generator).tolist()
        plan.extend(order[i:i+batch_size] for i in range(0, examples, batch_size))
    return plan[:steps]


def freeze(args):
    path = args.work/'protocol.json'
    if path.exists(): raise FileExistsError('The prospective protocol already exists')
    rows = load_source(args.data)
    assert sha(args.model/'model.safetensors') == MODEL_SHA
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    encoded = {split: [encode_record(row, tokenizer) for row in values] for split, values in rows.items()}
    selected = {label: [row['id'] for row in sorted(rows['test'], key=lambda row: int(row['id']))
                       if row['label'] == label][:2] for label in LABELS}
    protocol = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'stage': 'frozen before first scientific update',
                'dataset_revision': REVISION, 'model_revision': MODEL_REVISION, 'contract': contract(args.data, args.model),
                'seeds': SEEDS, 'policies': POLICIES, 'steps': 200, 'batch_size': 8, 'keep_short_batch': True,
                'optimizer': {'name': 'AdamW', 'lr': 1e-4, 'betas': [.9, .999], 'eps': 1e-8,
                              'weight_decay': 0., 'clip_norm': 1., 'schedule': 'constant'},
                'precision': 'FP32', 'device': 'CPU', 'threads': 2, 'trainable': 'all pretrained parameters',
                'serialization': {'template': TEMPLATE, 'completion': 'one leading ASCII space plus exact label plus EOS',
                                  'eos_id': 0, 'pad_storage_id': 0, 'validity': 'position-based', 'max_length': 64},
                'split_counts': {split: len(values) for split, values in encoded.items()},
                'maximum_encoded_length': max(len(row['ids']) for values in encoded.values() for row in values),
                'development_steps': [0, 50, 100, 150, 200], 'selection': 'minimum pooled response NLL; earliest on ties, including step0',
                'test': 'after all six completed fits; every selected outcome, one base and training-majority baseline',
                'generation': 'full vocabulary greedy, max8, stop first EOS; strip outer whitespace only; unmapped emitted IDs invalid',
                'candidate_rule': 'sum complete label/EOS log probabilities; no length normalization; fixed label order on ties',
                'labels': list(LABELS), 'display_test_ids': selected, 'plans': {str(seed): batch_plan(seed) for seed in SEEDS},
                'failure_rule': 'retain failure; resume incomplete checkpoint only; no changed hyperparameters or extra outcomes'}
    write_json(path, protocol)
    print(json.dumps({'frozen': str(path), 'sha256': sha(path), 'test_display_ids': selected}))


def checked_protocol(args):
    protocol = json.loads((args.work/'protocol.json').read_text(encoding='utf-8'))
    actual = contract(args.data, args.model)
    if actual != protocol['contract']: raise ValueError('Frozen program/data/model/environment contract changed')
    return protocol


def load_model(path):
    model = AutoModelForCausalLM.from_pretrained(path, local_files_only=True).float()
    if any(isinstance(layer, torch.nn.Dropout) and layer.p != 0 for layer in model.modules()):
        raise ValueError('Declared model has nonzero dropout')
    if sum(p.numel() for p in model.parameters()) != 14067712:
        raise ValueError('Pretrained architecture changed')
    return model


def train(args):
    protocol = checked_protocol(args)
    folder = args.work/f'{args.policy}-{args.seed}'
    folder.mkdir(exist_ok=True)
    done = folder/'completed.json'
    if done.exists():
        print(json.dumps({'reused_completed': str(done), 'sha256': sha(done)})); return
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    rows = load_source(args.data)
    training = [encode_record(row, tokenizer) for row in rows['train']]
    development = [encode_record(row, tokenizer) for row in rows['dev']]
    torch.manual_seed(args.seed)
    model = load_model(args.model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, betas=(.9, .999), eps=1e-8, weight_decay=0.)
    checkpoint = folder/'resume.pt'
    started = time.perf_counter()
    if checkpoint.exists():
        saved = torch.load(checkpoint, map_location='cpu', weights_only=False)
        if saved['protocol_sha'] != sha(args.work/'protocol.json'): raise ValueError('Resume belongs to another protocol')
        model.load_state_dict(saved['model']); optimizer.load_state_dict(saved['optimizer'])
        torch.set_rng_state(saved['rng'])
        step, history, updates = saved['step'], saved['history'], saved['updates']
        best, best_step = saved['best'], saved['best_step']
    else:
        step, updates = 0, []
        initial = response_nll(model, development)
        history = [{'step': 0, 'development_response': initial}]
        best, best_step = initial['nll'], 0
        model.save_pretrained(folder/'selected'); tokenizer.save_pretrained(folder/'selected')
    try:
        for step_index in range(step, 200):
            indices = protocol['plans'][str(args.seed)][step_index]
            batch = collate([training[index] for index in indices], policy=args.policy, pad_id=0)
            model.train(); optimizer.zero_grad(set_to_none=True)
            logits = model(input_ids=batch['input_ids'], attention_mask=batch['attention_mask'], use_cache=False).logits
            labels = batch['labels'][:, 1:]
            loss = F.cross_entropy(logits[:, :-1].reshape(-1, logits.shape[-1]), labels.reshape(-1), ignore_index=-100)
            loss.backward()
            norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
            optimizer.step()
            step = step_index+1
            updates.append({'step': step, 'objective_nll': float(loss.detach()), 'gradient_norm_before_clip': float(norm),
                            'records': len(indices), 'input_positions': int(batch['attention_mask'].sum()),
                            'targets': int((labels != -100).sum())})
            if step % 50 == 0:
                dev = response_nll(model, development)
                history.append({'step': step, 'development_response': dev})
                if dev['nll'] < best:
                    best, best_step = dev['nll'], step
                    model.save_pretrained(folder/'selected'); tokenizer.save_pretrained(folder/'selected')
                torch.save({'protocol_sha': sha(args.work/'protocol.json'), 'model': model.state_dict(),
                            'optimizer': optimizer.state_dict(), 'rng': torch.get_rng_state(), 'step': step,
                            'updates': updates, 'history': history, 'best': best, 'best_step': best_step}, checkpoint)
                print(json.dumps({'policy': args.policy, 'seed': args.seed, 'step': step, 'development_response_nll': dev['nll'],
                                  'selected_step': best_step}), flush=True)
        write_json(done, {'policy': args.policy, 'seed': args.seed, 'steps': step,
                          'protocol_sha': sha(args.work/'protocol.json'), 'selected_step': best_step,
                          'selected_development_nll': best, 'history': history, 'updates': updates,
                          'presentations': sum(row['records'] for row in updates),
                          'selected_targets': sum(row['targets'] for row in updates),
                          'input_positions': sum(row['input_positions'] for row in updates),
                          'this_execution_seconds': time.perf_counter()-started,
                          'selected_files': {p.name: sha(p) for p in (folder/'selected').iterdir() if p.is_file()}})
    except Exception as error:
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S')
        write_json(folder/f'failure-{timestamp}.json', {'step': step, 'error': repr(error), 'resumable_checkpoint': checkpoint.exists()})
        raise


def final_evaluation(args):
    protocol = checked_protocol(args)
    receipt = args.work/'evaluation.json'
    if receipt.exists():
        print(json.dumps({'reused_evaluation': str(receipt), 'sha256': sha(receipt)})); return
    summaries = []
    for policy in POLICIES:
        for seed in SEEDS:
            path = args.work/f'{policy}-{seed}'/'completed.json'
            if not path.exists(): raise ValueError(f'Test is gated until every fit completes: missing {path}')
            summary = json.loads(path.read_text(encoding='utf-8'))
            assert summary['protocol_sha'] == sha(args.work/'protocol.json')
            summaries.append(summary)
    rows = load_source(args.data)
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    base_path = args.work/'base-test.json'
    if not base_path.exists():
        write_json(base_path, evaluate(load_model(args.model), tokenizer, rows['test']))
    outcomes = []
    for summary in summaries:
        folder = args.work/f"{summary['policy']}-{summary['seed']}"
        for name, expected in summary['selected_files'].items():
            assert sha(folder/'selected'/name) == expected
        path = folder/'test.json'
        if not path.exists():
            write_json(path, evaluate(load_model(folder/'selected'), tokenizer, rows['test']))
        outcomes.append({**summary, 'test': json.loads(path.read_text(encoding='utf-8'))})
    counts = Counter(row['label'] for row in rows['train'])
    majority = max(LABELS, key=lambda label: counts[label])
    majority_metrics = classification_metrics([{'gold': row['label'], 'prediction': majority} for row in rows['test']])
    write_json(receipt, {'protocol_sha': sha(args.work/'protocol.json'), 'base': json.loads(base_path.read_text(encoding='utf-8')),
                         'training_majority': {'label': majority, 'counts': dict(counts), **majority_metrics},
                         'runs': outcomes, 'display_test_ids': protocol['display_test_ids']})
    print(json.dumps({'evaluation': str(receipt), 'outcomes': len(outcomes)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['freeze', 'train', 'evaluate'])
    parser.add_argument('--data', type=Path, required=True); parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--policy', choices=POLICIES); parser.add_argument('--seed', type=int, choices=SEEDS)
    args = parser.parse_args(); args.work.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(2); torch.use_deterministic_algorithms(True)
    if args.command == 'train' and (args.policy is None or args.seed is None): parser.error('train requires policy and seed')
    {'freeze': freeze, 'train': train, 'evaluate': final_evaluation}[args.command](args)
