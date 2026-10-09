"""Prepare source/prospective data only. Never import or execute lesson programs."""

import ast
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/prefix-caching-prompt-caching'
PUBLIC = ROOT / 'public/learn-code/prefix-caching'
PRIOR = ROOT / 'public/learn-code/kv-cache'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf8')


def binding(path, root=ROOT):
    return {'path': path.relative_to(root).as_posix(), 'sha256': sha(path),
            'bytes': path.stat().st_size}


def main():
    if (TOPIC / 'program-inputs.json').exists():
        raise FileExistsError('Preserve the frozen packet before preparing a successor.')
    copied = []
    for name in ['tiny_causal_lm.py', 'cached_decoder.py', 'native_cache.py',
                 'acquire_model.py', 'alice-train.txt', 'alice-provenance.json',
                 'model-source-report.json']:
        source, destination = PRIOR / name, PUBLIC / name
        if destination.exists() and source.read_bytes() != destination.read_bytes():
            raise ValueError(f'Destination already differs: {destination}')
        shutil.copyfile(source, destination)
        copied.append({'source': binding(source), 'copy': binding(destination)})
    previous = json.loads((PRIOR / 'study-protocol.json').read_text(encoding='utf8'))
    ids = previous['token_ids']
    protocol = {
        'purpose': 'Prefix state compatibility and finite storage mechanisms; no model quality or latency claim.',
        'stages': ['finite', 'tiny', 'native', 'allocator'],
        'runs_per_stage': 1, 'threads': 2, 'device': 'cpu',
        'no_training': True, 'no_generation': True, 'no_timing': True,
        'no_warmup': True, 'no_remote_api': True, 'no_download': True,
        'stop_on_failure': True,
        'tiny': {
            'seed': 149, 'vocabulary': 32, 'context': 20, 'width': 16,
            'heads': 4, 'layers': 2, 'dtype': 'float64', 'prefix_length': 8,
            'prompts': {
                'A': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                'B': [1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 16],
                'C': [1, 2, 3, 17, 5, 6, 7, 8, 9, 10, 11, 12],
            },
            'forward_calls': 8, 'atol': 2e-12, 'rtol': 2e-12,
            'order': 'three full references A/B/C; prefix A; fork A tail; fork B tail; fresh C prefix; C tail',
            'criteria': ['all compared tail logits within fixed tolerance',
                         'A/B branch tail top1 equality', 'base snapshot unchanged',
                         'full A/B first eight rows exactly equal',
                         'full A/C first three rows exactly equal', 'parameters unchanged'],
        },
        'native': {
            'model': 'EleutherAI/pythia-14m', 'revision': previous['revision'],
            'dtype': 'float64', 'attention': 'eager',
            'token_source': binding(PRIOR / 'study-protocol.json'),
            'text_source': binding(PUBLIC / 'alice-train.txt'),
            'prefix_offsets': [[0, 8], [0, 32]], 'tail_offsets': [[40, 48], [48, 56]],
            'prefixes': [ids[:8], ids[:32]], 'tails': [ids[40:48], ids[48:56]],
            'forward_calls': 10, 'atol': 2e-9, 'rtol': 2e-9,
            'order': 'prefix length 8 then 32; each prefill once, then full reference and copied-cache suffix for tail 0 then 1',
            'criteria': ['every one of eight tail-logit rows compared',
                         'all logits within declared tolerance and top1 IDs equal',
                         'base K/V and length unchanged', 'branches have separate K/V storage',
                         'branch lengths exact', 'parameters unchanged'],
        },
        'allocator': {
            'transformers': '5.19.0', 'dtype': 'float32', 'layers': 2,
            'kv_heads': 2, 'head_dim': 4, 'page_tokens': 4,
            'allocatable_sectors': 4, 'reserved_trash_sectors': 2,
            'blocks_per_sector': 1, 'bytes_per_page': 256,
            'bytes_per_block': 512, 'backing_bytes': 3072,
            'prompts': {'A': list(range(1, 11)), 'B': list(range(1, 9)) + [11, 12]},
            'supplied_scalar': '10000*is_value + 1000*layer + 100*position + 2*token + 10*head + feature',
            'model_forwards': 0,
            'sequence': ['allocate A', 'write A both layers', 'mark two complete blocks',
                         'match/acquire B two blocks', 'allocate/write B tail both layers',
                         'observe shared backing', 'release A', 'release B',
                         'match/acquire retained C', 'release C', 'evict all inactive',
                         'return four sectors'],
            'criteria': ['exact supplied/returned K/V values', 'shared first eight physical indices/addresses',
                         'six logical blocks use four physical blocks', 'two refs on each shared block',
                         'two free plus two retained after A/B release', 'four free after eviction'],
        },
        'finite': {
            'modules': ['prefix_identity', 'prefix_work', 'prefix_store', 'prefix_workload',
                        'radix_prefix', 'prefix_routing', 'prefix_cost', 'practice'],
            'scope': 'Once per complete verify function; constructed inputs in frozen sources, no stochastic simulation.',
        },
        'failure_retention': 'Exclusive output directories; persist all completed native/Tiny operations and tensors before assertions; finite module start identifies source/operands even if verify does not return; stop without automatic retry.',
    }
    save(PUBLIC / 'study-protocol.json', protocol)
    checks = []
    for path in sorted(PUBLIC.glob('*.py')):
        module = ast.parse(path.read_text(encoding='utf8'), filename=str(path))
        checks.append({'file': binding(path), 'syntax_valid': True,
                       'top_level_functions': [n.name for n in module.body if isinstance(n, ast.FunctionDef)]})
    save(TOPIC / 'program-preparation-checks.json', {
        'scope': 'Source parsing, copying and prospective serialization only; zero program imports/model/native/finite-study execution.',
        'copies': copied, 'syntax': checks,
        'exact_fixed_ids': protocol['native']['prefixes'] + protocol['native']['tails'],
    })
    public_files = sorted(p for p in PUBLIC.iterdir() if p.is_file() and p.name != 'source-manifest.json')
    save(PUBLIC / 'source-manifest.json', {'files': [binding(path, PUBLIC) for path in public_files]})
    installed = ROOT / 'scratch/inference-serving-tools/transformers'
    dependencies = [installed / relative for relative in [
        'cache_utils.py', 'generation/continuous_batching/cache_allocators/cache_allocator.py',
        'generation/continuous_batching/cache_allocators/cache_pool.py',
        'generation/continuous_batching/cache_allocators/full_attention.py',
        'generation/continuous_batching/utils.py', 'models/gpt_neox/modeling_gpt_neox.py',
    ]]
    model = ROOT / 'scratch/sft-research/pythia-14m'
    dependencies += [model / row['name'] for row in previous['model_files']]
    selected = ['design.md', 'practice-design.md', 'research.md', 'original-assessment.md',
                'design-accepted-root.json', 'program-protocol.md', 'program-preparation-checks.json',
                'provider-source-check.md']
    files = public_files + [PUBLIC / 'source-manifest.json'] + [TOPIC / name for name in selected]
    files += [Path(__file__).resolve(), ROOT / 'scripts/execute-prefix-study.py']
    files += dependencies + [PRIOR / 'study-protocol.json']
    save(TOPIC / 'program-inputs.json', {
        'schema': 1, 'status': 'ready-for-different-prospective-review; no execution release',
        'files': [binding(path) for path in files],
        'programs': [binding(path) for path in sorted(PUBLIC.glob('*.py'))],
    })
    print(json.dumps({'packet': binding(TOPIC / 'program-inputs.json'),
                      'programs': len(checks), 'bindings': len(files)}, indent=2))


if __name__ == '__main__':
    main()
