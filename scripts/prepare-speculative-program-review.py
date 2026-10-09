"""Freeze the prospective review packet using static checks only."""

import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    with path.open('x', encoding='utf8') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


protocol = json.loads((TOPIC / 'program-protocol.json').read_text(encoding='utf8'))
guards = []
for row in protocol['files']:
    path = PUBLIC / row['name']
    assert sha(path) == row['sha256'], path
    guards.append(row['name'])

programs = sorted(PUBLIC.glob('*.py'))
assert len(programs) == 12
for path in programs:
    ast.parse(path.read_text(encoding='utf8'), filename=str(path))

reuse = []
for name in ['tiny_causal_lm.py', 'cached_decoder.py', 'acquire_model.py']:
    source = ROOT / 'public/learn-code/kv-cache' / name
    assert (PUBLIC / name).read_bytes() == source.read_bytes()
    reuse.append({'name': name, 'source': source.relative_to(ROOT).as_posix(),
                  'sha256': sha(source)})

assert [len(row['ids']) for row in protocol['prompts']] == [19, 32, 32, 32]
assert protocol['study_budget']['all_calls'] == 128
assert protocol['study_budget']['maximum_emitted_tokens'] == 3072
assert protocol['diagnostic']['calls'] == 2
assert protocol['stages'] == ['finite', 'cache', 'tree', 'heads', 'native', 'study']
report = {'status': 'static-preparation-passed', 'protocol_sha256': sha(TOPIC / 'program-protocol.json'),
          'guarded_protocol_files': guards, 'parsed_programs': [p.name for p in programs],
          'exact_reuse': reuse, 'tokenizer_only_preparation': True,
          'preparation_failure': 'First static packaging invocation used the topic ID rather than the public kv-cache directory and stopped before writing any receipt. Corrected the literal source path; no lesson program or scientific operation ran.',
          'scientific_programs_executed': False,
          'limits': 'Source parsing and byte guards only. No lesson verifier, neural model, forward, optimizer, generation or timing campaign was executed.'}
write_new(TOPIC / 'program-author-checks.json', report)

files = list(PUBLIC.iterdir()) + [TOPIC / name for name in [
    'design.md', 'research.md', 'original-assessment.md', 'design-accepted-root.json',
    'design-review.md', 'program-protocol.md', 'program-protocol.json',
    'program-author-review.md', 'program-author-checks.json']]
files += [TOPIC / 'design-correction' / name for name in [
    'inputs.json', 'independent-closure.md', 'selected-prompts.json']]
files += [ROOT / 'scratch/speculative-research/sources' / name for name in [
    'installed-utils.py', 'installed-candidate_generator.py', 'installed-configuration_utils.py']]
files += [Path(__file__)] + [ROOT / row['source'] for row in reuse]
packet = {'topicId': 'speculative-decoding', 'phase': 'prospective-program-review',
          'status': 'ready-for-different-entire-review',
          'execution': 'Tokenizer-only preparation and static checks. All six scientific stages remain unstarted.',
          'files': [{'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
                     'bytes': path.stat().st_size} for path in sorted(set(files)) if path.is_file()]}
write_new(TOPIC / 'program-inputs.json', packet)
print(json.dumps({'bindings': len(packet['files']), 'packet_sha256': sha(TOPIC / 'program-inputs.json'),
                  'protocol_sha256': report['protocol_sha256'], 'science_executed': False}))
