"""Project completed fixed results and make the byte-exact learner bundle.

Pure report/packaging only. Does not import any lesson or neural program.
"""
import hashlib
import json
from pathlib import Path
import statistics
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'
RUN = ROOT / 'scratch/speculative-research/study-continuation'
NATIVE_RUN = ROOT / 'scratch/speculative-research/study-native-continuation'
ASSETS = ROOT / 'public/learn-assets/speculative-decoding'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, data):
    with path.open('x', encoding='utf8') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n')


protocol_path = TOPIC / 'program-protocol.json'
protocol = json.loads(protocol_path.read_text())
protocol_hash = sha(protocol_path)
for row in protocol['files']:
    assert sha(PUBLIC / row['name']) == row['sha256']

stages = {}
stage_sources = {}
mechanical_protocol_hash = sha(TOPIC / 'native-cache-correction/program-protocol.json')
for name in protocol['stages']:
    directory = NATIVE_RUN if name in ['native','study'] else RUN
    source = directory / (name + '.json')
    report = json.loads(source.read_text())
    expected_protocol = protocol_hash if directory == NATIVE_RUN else mechanical_protocol_hash
    assert report['passed'] and report['protocol_sha256'] == expected_protocol
    stages[name] = report['result']
    stage_sources[name] = {'path':source.relative_to(ROOT).as_posix(),'sha256':sha(source),
                           'protocol_sha256':report['protocol_sha256'],
                           'conserved_before_cache_config_correction':directory==RUN}

study = stages['study']
assert len(study['warmups']) == 32 and len(study['records']) == 96
assert sum(len(row['ids']) for row in study['warmups'] + study['records']) <= 3072
assert study['weights_before'] == study['weights_after']
summary = []
for mode in protocol['modes']:
    for arm in protocol['arms']:
        rows = [row for row in study['records'] if row['mode'] == mode and row['lookahead'] == arm]
        assert len(rows) == 12
        paired = [row for row in study['paired'] if row['mode'] == mode and row['lookahead'] == arm]
        summary.append({'mode': mode, 'lookahead': arm, 'calls': len(rows),
                        'emitted_tokens': sum(len(row['ids']) for row in rows),
                        'median_elapsed_ms': statistics.median(row['elapsed_ns'] / 1e6 for row in rows),
                        'median_ms_per_token': statistics.median(row['ns_per_emitted_token'] / 1e6 for row in rows),
                        'median_paired_whole_call_speedup': None if not paired else statistics.median(row['whole_call_speedup'] for row in paired),
                        'paired_whole_call_speedup_range': None if not paired else [min(row['whole_call_speedup'] for row in paired), max(row['whole_call_speedup'] for row in paired)],
                        'target_calls': sum(row['work']['target_calls'] for row in rows),
                        'draft_calls': sum(row['work']['draft_calls'] for row in rows),
                        'target_rows': sum(row['work']['target_rows'] for row in rows),
                        'draft_rows': sum(row['work']['draft_rows'] for row in rows)})

ASSETS.mkdir(parents=True, exist_ok=True)
journal_evidence = {}
for name, wanted in [('cache', {'next-logit-comparison', 'rollback-comparison'}),
                     ('tree', {'packed-tree', 'tree-path-comparison'})]:
    rows = [json.loads(line) for line in (RUN / (name + '.jsonl')).read_text().splitlines()]
    journal_evidence[name] = [dict(row, event_index=index) for index, row in enumerate(rows)
                              if row.get('event') in wanted]
save(ASSETS / 'observations.json', {'protocol_sha256': protocol_hash,
    'scope': 'Exact finite laws, random-network mechanical fixtures, two constructed head updates, two accounted native diagnostic attempts (original greedy failure and sampled continuation) and one fixed CPU study. Original finite raw-return loss is qualified. No trained-proposer quality or GPU claim.',
    'stages': stages, 'stage_sources':stage_sources, 'journal_evidence': journal_evidence, 'summary': summary})
evidence = PUBLIC / 'evidence'
evidence.mkdir(exist_ok=True)
for name in protocol['stages']:
    (evidence / (name + '.json')).write_bytes((ROOT / stage_sources[name]['path']).read_bytes())
(evidence / 'protocol.json').write_bytes(protocol_path.read_bytes())
for source, name in [
    (ROOT / 'scratch/speculative-research/study/finite.json', 'original-finite-failure.json'),
    (TOPIC / 'finite-witness-correction/sequence_law.py', 'original-sequence-law.txt'),
    (TOPIC / 'finite-witness-correction/program-protocol.json', 'original-failed-protocol.json'),
    (TOPIC / 'finite-witness-correction/diagnosis.json', 'finite-witness-diagnosis.json'),
    (RUN / 'native.json', 'original-native-failure.json'),
    (RUN / 'native-detail.jsonl', 'original-native-trace.jsonl'),
    (TOPIC / 'native-cache-correction/native_speculation.py', 'original-native-speculation.txt'),
    (TOPIC / 'native-cache-correction/program-protocol.json', 'mechanical-protocol.json'),
    (TOPIC / 'native-cache-correction/diagnosis.json', 'native-cache-diagnosis.json')]:
    (evidence / name).write_bytes(source.read_bytes())
save(evidence / 'summary.json', summary)

files = sorted(path for path in PUBLIC.rglob('*') if path.is_file() and path.suffix != '.zip')
archive = PUBLIC / 'speculative-decoding.zip'
with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in files:
        bundle.write(path, path.relative_to(PUBLIC).as_posix())
with zipfile.ZipFile(archive) as bundle:
    for path in files:
        assert bundle.read(path.relative_to(PUBLIC).as_posix()) == path.read_bytes()
save(TOPIC / 'result-projection.json', {'script': Path(__file__).relative_to(ROOT).as_posix(),
    'script_sha256': sha(Path(__file__)), 'protocol_sha256': protocol_hash,
    'raw_stages': stage_sources,
    'projected_journals': [{'path': (RUN / (name + '.jsonl')).relative_to(ROOT).as_posix(),
                           'sha256': sha(RUN / (name + '.jsonl'))} for name in ['cache','tree']],
    'asset': {'path': (ASSETS / 'observations.json').relative_to(ROOT).as_posix(), 'sha256': sha(ASSETS / 'observations.json')},
    'archive': {'path': archive.relative_to(ROOT).as_posix(), 'sha256': sha(archive), 'members': len(files)},
    'summary': summary, 'science_replayed': False})
print(json.dumps({'members': len(files), 'summary': summary}, indent=2))
