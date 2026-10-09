"""Freeze and execute the complete finite-language arithmetic study once.
Run: python reasoning_study.py --output ./reasoning-study
All settings are fixed before any fit; an existing output directory is refused.
"""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import time
import torch
from reasoning_train import (make_splits, tensors, create_policy, fit_warm,
                             continue_training, rollout, inspect_outputs, supervised_loss)
from reasoning_evaluate import summarize, paired_bootstrap


def write_json(path, value):
    with path.open('x', encoding='utf-8') as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write('\n')


@torch.no_grad()
def evaluate(model, records, seed=71, draws=16):
    generator = torch.Generator().manual_seed(seed)
    prompts, targets = tensors(records)
    model.eval()
    nll = float(supervised_loss(model, prompts, targets))
    all_rows = []
    for start in range(0, len(records), 8):
        batch = records[start:start + 8]
        repeated = [record for record in batch for _ in range(draws)]
        batch_prompts, _ = tensors(repeated)
        tokens, masks = rollout(model, batch_prompts, generator)
        inspected = inspect_outputs(repeated, tokens, masks)
        for index, record in enumerate(batch):
            attempts = inspected[index * draws:(index + 1) * draws]
            all_rows.append({'id': record['id'], 'truth': (record['a'] + record['b']) * record['c'],
                             'attempts': [{**row, 'correct': bool(row['reward'])} for row in attempts]})
    results = summarize(all_rows, 8)
    flat = [attempt for row in all_rows for attempt in row['attempts']]
    return {'completion_nll': nll, 'draws': draws, 'rows': all_rows, 'summary': results,
            'format_fraction': sum(row['format_valid'] for row in flat) / len(flat),
            'derivation_fraction': sum(row['derivation_correct'] and row['terminated'] for row in flat) / len(flat),
            'eos_fraction': sum(row['terminated'] for row in flat) / len(flat)}


def run(output):
    output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    sources = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
               for p in Path(__file__).parent.glob('*.py')}
    splits = make_splits()
    protocol = {'task': 'finite integer-token (a+b)*c with optional exposed sum',
                'seeds': [17, 29, 43], 'split_seed': 41, 'splits': splits,
                'warm_steps': 500, 'warm_batch': 32, 'warm_lr': .003,
                'arms': ['warm', 'sft', 'rl'], 'continuation_steps': 80,
                'prompt_batch': 8, 'group_size': 8, 'continuation_lr': .0003,
                'optimizer': 'AdamW betas(.9,.999), eps1e-8, weight_decay0; gradient norm cap1',
                'neural_policy': 'two pre-norm decoder blocks, width48, heads3, context16, vocabulary99; dropout0',
                'reward': 'parsed final answer correct AND actual EOS; no process reward',
                'sampler': 'temperature1, full vocabulary; scored identical softmax',
                'rl_loss': 'fresh-batch mean of sum token logp times leave-one-out advantage',
                'mask': 'completion through first EOS inclusive; cap5, no EOS yields reward0',
                'checkpoint_steps': [0, 20, 40, 60, 80],
                'heldout': 'One predeclared final campaign on saved checkpoints after all fits; no selection',
                'test_draws_per_question': 16, 'evaluation_seed': 71,
                'uncertainty': 'paired family-bootstrap, 2000 resamples seed31; average five c-values per family; all3training seeds separately',
                'parameter_selection': 'No parameter search; fixed prospectively; no improvement promise',
                'versions': {'torch': torch.__version__, 'python': platform.python_version()}, 'source_sha256': sources}
    write_json(output / 'protocol.json', protocol)
    fits = []
    started = time.perf_counter()
    for seed in protocol['seeds']:
        warm, history = fit_warm(splits['train'], seed, protocol['warm_steps'])
        seed_path = output / f'seed-{seed}'
        seed_path.mkdir()
        torch.save(warm.state_dict(), seed_path / 'warm.pt')
        write_json(seed_path / 'warm-history.json', history)
        for arm in ['sft', 'rl']:
            _, history, checkpoints = continue_training(warm, splits['train'], seed, arm)
            for step, state in checkpoints.items():
                torch.save(state, seed_path / f'{arm}-{step}.pt')
            write_json(seed_path / f'{arm}-history.json', history)
            fits.append({'seed': seed, 'arm': arm, 'steps': len(history),
                         'targets': sum(row['targets'] for row in history)})
        print(json.dumps({'seed': seed, 'stage': 'fits complete; test unopened'}), flush=True)
    write_json(output / 'fit-completion.json', {'fits': fits, 'fit_seconds': time.perf_counter() - started})
    evaluations, by_seed = [], {}
    for seed in protocol['seeds']:
        for arm, steps in [('warm', [0]), ('sft', [20, 40, 60, 80]), ('rl', [20, 40, 60, 80])]:
            for step in steps:
                model = create_policy()
                checkpoint = output / f'seed-{seed}' / ('warm.pt' if arm == 'warm' else f'{arm}-{step}.pt')
                model.load_state_dict(torch.load(checkpoint, weights_only=True))
                result = evaluate(model, splits['test'])
                name = f'evaluation-{seed}-{arm}-{step}.json'
                write_json(output / name, result)
                if step == 80 or arm == 'warm':
                    by_seed[seed, arm] = result['summary']['questions']
                evaluations.append({'seed': seed, 'arm': arm, 'step': step, 'file': name,
                                    'nll': result['completion_nll'], **result['summary']['mean'],
                                    'format': result['format_fraction'], 'derivation': result['derivation_fraction'],
                                    'eos': result['eos_fraction']})
    # Average five c-values within each held-out (a,b) family before resampling.
    # Eight families are a small uncertainty illustration, not a population guarantee.
    uncertainty = []
    for seed in protocol['seeds']:
        for arm in ('sft', 'rl'):
            left, right = by_seed[seed, 'warm'], by_seed[seed, arm]
            assert [r['id'] for r in left] == [r['id'] for r in right]
            for metric in ('pass1', 'passk'):
                means = lambda rows: [sum(r[metric] for r in rows[i:i+5])/5 for i in range(0, len(rows), 5)]
                uncertainty.append({'seed': seed, 'arm': arm, 'metric': metric,
                                    'unit': 'eight held-out families, five c-values each',
                                    **paired_bootstrap(means(left), means(right))})
    summary = {'protocol_sha256': hashlib.sha256((output / 'protocol.json').read_bytes()).hexdigest(),
               'parameters': sum(p.numel() for p in create_policy().parameters()), 'fits': fits,
               'evaluations': evaluations, 'paired_family_bootstrap': uncertainty,
               'seconds': time.perf_counter() - started}
    write_json(output / 'summary.json', summary)
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    run(parser.parse_args().output)
