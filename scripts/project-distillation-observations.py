"""Project immutable recorded data into browser-sized observations; no ML imports."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'public/learn-code/llm-distillation/results/arithmetic'
OUT = ROOT/'public/learn-assets/llm-distillation'
OUT.mkdir(parents=True, exist_ok=True)
def read(name):
    return json.loads((SOURCE/name).read_text())
corpus = read('teacher-candidates.json')
evaluation = read('evaluation.json')
protocol = read('protocol.json')
selected = ['1:3:1/greedy', '3:3:3/sample', '3:4:3/sample', '5:8:4/sample', '3:9:3/sample']
candidates = [{key: value for key, value in row.items() if key != 'log_probs'} for row in corpus['candidates']]
records = {row['id']: row for rows in protocol['records'].values() for row in rows}
examples = []
for candidate_id in selected:
    candidate = next(row for row in corpus['candidates'] if row['id'] == candidate_id)
    examples.append({**candidate, 'record': records[candidate['parent_id']]})
def metrics(result):
    return {key: value for key, value in result.items() if key not in ('outputs', 'reference')} | {
        'reference_nll': result['reference']['nll'], 'reference_targets': result['reference']['targets']}
out = {'scope':'Projection of frozen observations; no new model execution',
       'sources': {name: hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()
                   for name in ('teacher-candidates.json','evaluation.json','protocol.json')},
       'vocabulary': protocol['vocabulary'], 'records': protocol['records'],
       'candidates': candidates, 'examples': examples,
       'teacher': {split: metrics(result) for split, result in evaluation['teacher'].items()},
       'students': [{key:value for key,value in row.items() if key!='results'} | {
           'results': {split:metrics(result) for split,result in row['results'].items()}}
           for row in evaluation['students']],
       'corpus': {key:value for key,value in corpus.items() if key!='candidates'}}
path = OUT/'observations.json'
assert not path.exists(), 'Preserve existing projection before a successor'
path.write_text(json.dumps(out, separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'path': str(path.relative_to(ROOT)), 'bytes':path.stat().st_size,
                  'sha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'candidates':len(candidates),'examples':len(examples)}))
