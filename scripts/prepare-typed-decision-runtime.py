"""Project immutable saved observations into a browser asset; never import models."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems'
BASE = ROOT / 'public/learn/examples/typed-decision-systems'
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
accepted = json.loads((TOPIC/'content-review-acceptance.json').read_text())
for path, expected in accepted['files'].items():
    assert digest(ROOT/path) == expected, path
sources = {}
def read(name):
    path = BASE/name
    sources[path.relative_to(ROOT).as_posix()] = digest(path)
    return json.loads(path.read_text(encoding='utf-8'))

data = read('results/scratch/data.json')
calibration = read('results/calibration.json')
routing = read('results/routing.json')
# D29 needs the recorded summaries, not duplicate 120-item masks at each threshold.
for methods in routing['methods'].values():
    for variant in methods.values():
        for key, record in variant.items():
            if isinstance(record, dict):
                record.pop('per_row', None)
            elif isinstance(record, list):
                for row in record:
                    row.pop('per_row', None)
payload = {
    'scope': 'Recorded frozen observations. Browser controls perform labelled finite arithmetic, never neural inference.',
    'finite': read('results/finite.json'), 'policy': read('results/report-policy.json'),
    'calibration': calibration, 'routing': routing, 'test': data['test'],
    'schema': data['train'][0]['options'], 'preparation': read('data/data-report.json'),
    'history': {str(seed): read(f'results/scratch/seed-{seed}/completed.json') for seed in [17,29,43]},
    'scratchLogits': {key: value['test'] for key,value in read('results/scratch/logits.json').items()},
    'typed': read('results/laya/typed-observations.json'),
    'nativeRuntime': read('results/laya/runtime.json'),
    'nativeShifts': read('results/laya/shift-observations.json'),
    'shifts': read('data/shifts.json'), 'replay': read('results/replay.json'),
    'artifact': read('results/artifacts/laya.json'),
    'sources': sources,
}
target = ROOT/'public/learn-assets/typed-decision-systems/observations.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(payload,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf-8')
(TOPIC/'runtime-observation-inputs.json').write_text(json.dumps({
    'status':'projected_without_model_execution','accepted_content':digest(TOPIC/'content-review-acceptance.json'),
    'inputs':sources,'output':{'path':target.relative_to(ROOT).as_posix(),'sha256':digest(target)},
    'script':digest(Path(__file__))},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'bytes':target.stat().st_size,'sources':len(sources),'sha256':digest(target)}))
