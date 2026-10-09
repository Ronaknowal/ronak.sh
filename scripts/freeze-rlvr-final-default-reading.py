"""Bind only already-read final default paint; no browser/model execution."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
folder = topic / 'runtime-independent-preparation/paint-final-defaults'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
atlas = json.loads((folder / 'atlas-inputs.json').read_text(encoding='utf-8'))
checks = []
for item in atlas['guards'] + atlas['atlases']:
    path = root / item['path']
    assert digest(path) == item['sha256'], item['path']
    checks.append({'path': item['path'], 'sha256': item['sha256']})
assert len(atlas['atlases']) == 42
assert sum(len(a['tiles']) for a in atlas['atlases']) == 152
extras = [folder / 'atlas-inputs.json', folder / 'review.md', topic / 'browser-final/report.json', topic / 'runtime-browser-capture/network-attribution.json', Path(__file__).resolve()]
for path in extras:
    checks.append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path)})
packet = {'scope': 'different-reviewer actual reading of 59 default surfaces / 152 tiles / 42 pixel-preserving atlases', 'status': 'one bounded remaining F11 bar-value finding; not whole-runtime acceptance', 'files': checks, 'guard_count': len(atlas['guards']) + len(atlas['atlases']), 'read_atlases': [a['path'] for a in atlas['atlases']]}
out = folder / 'reading-inputs.json'
assert not out.exists(), 'preserve existing review packet'
out.write_text(json.dumps(packet, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'guards': packet['guard_count'], 'bindings': len(checks), 'sha256': digest(out)}))
