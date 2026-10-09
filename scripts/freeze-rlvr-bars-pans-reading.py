"""Freeze the actual prior bars/pans reading without altering any source."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
folder = topic / 'runtime-independent-preparation/paint-bars-pans'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
atlas = json.loads((folder / 'atlas-inputs.json').read_text(encoding='utf-8'))
bindings = atlas['guards'] + [{k: a[k] for k in ('path', 'sha256')} for a in atlas['atlases']]
for item in bindings:
    assert digest(root / item['path']) == item['sha256']
assert len(atlas['atlases']) == 31
assert sum(len(a['tiles']) for a in atlas['atlases']) == 111
old_css = topic / 'runtime-bar-label-closure/rlvr-flow-before-shared-grid.css'
assert digest(old_css) == '9a83b7c99c2a168d122ef4d153ddb91d358ac6b1a1dbb7edba38a1cc69cc9f1f'
extras = [folder / 'atlas-inputs.json', folder / 'review.md', topic / 'browser-bars-scroll-accepted/report.json', old_css, root / 'scripts/prepare-rlvr-bars-pans-review-atlases.py', Path(__file__).resolve()]
for path in extras:
    bindings.append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path)})
packet = {'scope': '24 defaults plus61 keyboard right-edge objects; one common-axis regression open', 'whole_runtime_accepted': False, 'read_atlases': 31, 'read_tiles': 111, 'read_objects': 85, 'files': bindings}
out = folder / 'reading-inputs.json'
assert not out.exists()
out.write_text(json.dumps(packet, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'bindings': len(bindings), 'sha256': digest(out)}))
