"""Read-only checks of retained outcomes, manuscript and learner delivery.

No model imports, forwards, random draws, optimizer updates or science replay.
"""
import ast
import hashlib
import json
from pathlib import Path
import re
import statistics
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'
ASSET = ROOT / 'public/learn-assets/speculative-decoding/observations.json'
checks = []


def check(condition, name):
    if not condition:
        raise AssertionError(name)
    checks.append(name)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


body = (TOPIC / 'lesson.md').read_text(encoding='utf8')
contracts = (TOPIC / 'visual-contracts.md').read_text(encoding='utf8')
check(len(re.findall(r'^## \d+\.', body, re.M)) == 18, '18 full reading sections')
figures = re.findall(r'<!-- (D\d+):', body)
check(len(figures) == 36 and set(figures) == {f'D{i:02}' for i in range(1, 37)}, 'all36 distinct placed contracts')
check(set(re.findall(r'\*\*(D\d+) ', contracts)) == set(figures), 'specification identities match placements')
check(body.count('<summary>Hint</summary>') == 18, '18 separate practice hints')
check(body.count('<summary>Solution</summary>') == 18, '18 complete practice solutions')
programs = re.findall(r'<!-- PROGRAM: ([\w_]+\.py) -->', body)
check(len(programs) == 12 and len(set(programs)) == 12, 'all12 whole-program placements')
for name in programs:
    ast.parse((PUBLIC / name).read_text(encoding='utf8'))
    check(f'](/learn-code/speculative-decoding/{name})' in body, 'clickable full source '+name)
for name in ['tiny_causal_lm.py', 'cached_decoder.py', 'acquire_model.py']:
    check((PUBLIC/name).read_bytes() == (ROOT/'public/learn-code/kv-cache'/name).read_bytes(), 'exact prerequisite '+name)
check(body.index('python speculative_math.py') < body.index('<!-- PROGRAM:'), 'setup precedes first whole program')
check('partial trace is not a completed continuation' in body, 'failed greedy is not promoted')
check('combined raw return was not saved' in body, 'lost original aggregate is qualified')

data = json.loads(ASSET.read_text())
practice = json.loads((PUBLIC/'evidence/practice-content-successor.json').read_text())
check(sha(PUBLIC/'practice_answers.py')==practice['current_source_sha256'], 'current changed practice source')
check(sha(PUBLIC/'evidence/executed-practice-source.txt')==practice['executed_source_sha256'], 'executed practice preserved')
check(practice['new_answer_14']['final']==['1/2','7/20','3/20'], 'new three-token exact answer')
check('0.2 + 0.45(0.2 + 0.6×7/9) = 0.5' in body, 'new changed practice walk')
for name, source in data['stage_sources'].items():
    check(sha(ROOT/source['path']) == source['sha256'], 'retained stage '+name)
    raw = json.loads((ROOT/source['path']).read_text())
    check(raw['result'] == data['stages'][name], 'exact projected stage '+name)
    check(raw['protocol_sha256'] == source['protocol_sha256'], 'actual executed protocol '+name)
native = data['stages']['native']
check(native['budget'] == {'diagnostic_attempts_total': 2, 'greedy_retries': 0, 'new_sample_calls': 1}, 'diagnostic attempt boundary')
check(not native['failed_greedy']['passed'], 'original greedy remains failed')
row = native['rows'][0]
check(row['ids'] == [313,395,253,2644,273,776,1533,10], 'actual sampled IDs in prose')
check(len(row['work']['rounds']) == 7, 'actual seven diagnostic rounds')
check(row['work']['rounds'][0]['emitted_ids'] == [313,395], 'first accepted and repaired outputs')
check(row['work']['rounds'][0]['target_cache_after_crop'] == 5, 'first round actual cache boundary')
for name, expected in [('target_calls',7),('draft_calls',15),('target_rows',25),('draft_rows',23)]:
    check(row['work'][name] == expected, 'sample diagnostic '+name)
study = data['stages']['study']
check(len(study['warmups']) == 32 and len(study['records']) == 96, 'fixed32+96 calls')
check(study['weights_before'] == study['weights_after'], 'saved before/after weights equal')
for row in study['warmups']+study['records']:
    check(0 < len(row['ids']) <= 24, 'actual bounded output')
    check(row['elapsed_ns'] > 0, 'positive recorded clock')
    check(row['ns_per_emitted_token'] == row['elapsed_ns']/len(row['ids']), 'actual emitted denominator')
for summary in data['summary']:
    rows = [r for r in study['records'] if (r['mode'],r['lookahead']) == (summary['mode'],summary['lookahead'])]
    check(len(rows) == 12, '12 measured rows per mode/arm')
    check(summary['median_elapsed_ms'] == statistics.median(r['elapsed_ns']/1e6 for r in rows), 'summary median elapsed')
    check(summary['median_ms_per_token'] == statistics.median(r['ns_per_emitted_token']/1e6 for r in rows), 'summary median rate')
    mode = 'Greedy' if summary['mode']=='greedy' else 'Sampled'
    arm = 'Target-only' if summary['lookahead']==0 else 'K = '+str(summary['lookahead'])
    speed = '—' if summary['lookahead']==0 else f"{summary['median_paired_whole_call_speedup']:.3f}"
    bounds = '—' if summary['lookahead']==0 else '–'.join(f'{x:.3f}' for x in summary['paired_whole_call_speedup_range'])
    expected_line = f"| {mode} | {arm} | {summary['median_elapsed_ms']:.2f} | {summary['median_ms_per_token']:.2f} | {speed} | {bounds} |"
    check(expected_line in body, 'exact rounded learner timing row '+mode+arm)
check(all(r['whole_call_speedup']<1 for r in study['paired']), 'all72 observed pairs slower')
check(sum(len(r['ids']) for r in study['warmups']+study['records'])==3072, 'actual3072 IDs')
check(all(r['stop']=='cap' for r in study['warmups']+study['records']), 'all actual stops cap')
check(sum(r['greedy_ids_equal'] is True for r in study['paired'])==36, 'all36 measured greedy pairs match')
for pair in study['paired']:
    selected = [r for r in study['records'] if (r['prompt_id'],r['mode'],r['repetition']) == (pair['prompt_id'],pair['mode'],pair['repetition'])]
    baseline = next(r for r in selected if r['lookahead']==0)
    speculative = next(r for r in selected if r['lookahead']==pair['lookahead'])
    check(pair['whole_call_speedup'] == baseline['elapsed_ns']/speculative['elapsed_ns'], 'retained paired time ratio')
    check(pair['greedy_ids_equal'] == (None if pair['mode']=='sample' else baseline['ids']==speculative['ids']), 'actual pair identity status')
with zipfile.ZipFile(PUBLIC/'speculative-decoding.zip') as archive:
    names = set(archive.namelist())
    expected = {p.relative_to(PUBLIC).as_posix() for p in PUBLIC.rglob('*') if p.is_file() and p.suffix!='.zip'}
    check(names == expected, 'exact archive membership')
    for name in names:
        check(archive.read(name) == (PUBLIC/name).read_bytes(), 'byte-exact archive '+name)

report = {'passed': True, 'conditions': len(checks), 'checks': checks,
          'science_replayed': False, 'script_sha256': sha(Path(__file__)),
          'manuscript_sha256': sha(TOPIC/'lesson.md'), 'asset_sha256': sha(ASSET),
          'archive_sha256': sha(PUBLIC/'speculative-decoding.zip')}
with (TOPIC/'content-author-checks-r2.json').open('x',encoding='utf8') as stream:
    json.dump(report,stream,indent=2)
    stream.write('\n')
print(json.dumps({'passed':True,'conditions':len(checks)}))
