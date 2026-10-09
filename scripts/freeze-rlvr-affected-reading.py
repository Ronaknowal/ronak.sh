"""Bind actual branch-paint reading and conserved source; no model execution."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
folder = topic / 'runtime-independent-preparation/paint-affected-final'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
atlas = json.loads((folder / 'atlas-inputs.json').read_text(encoding='utf-8'))
bindings = atlas['guards'] + [{k: a[k] for k in ('path', 'sha256')} for a in atlas['atlases']]
for item in bindings:
    assert digest(root / item['path']) == item['sha256']
assert len(atlas['atlases']) == 9
assert sum(len(a['tiles']) for a in atlas['atlases']) == 27
expected = {
    'src/learn/components/lesson-labs/RLVRStudyFigures.jsx': '7cc1e315c4b2f304de0cdfea3d1f1e5841bae4f6a3e7d02de45fba3b30de10af',
    'src/learn/components/lesson-labs/RLVRCoreFigures.jsx': 'f9ab9360c421f5ab9ab6f00fb52427a769c5a16ef559198dde4fbf362f06e290',
    'src/learn/components/lesson-labs/RLVRFlow.jsx': 'b0b885d50be721e2b6c9c903e6e5200fa4c5d82e32825e6d4eeea9c66077189c',
    'src/learn/data/rlvr-models.js': 'fcd364f57cc5a402de99a9650bdb24f0bef394e9baaea0453cf0b381516dfa87',
    'src/learn/components/lesson-labs/rlvr-flow.css': '9a83b7c99c2a168d122ef4d153ddb91d358ac6b1a1dbb7edba38a1cc69cc9f1f',
}
for path, sha in expected.items():
    assert digest(root / path) == sha
    bindings.append({'path': path, 'sha256': sha})
extras = [folder / 'atlas-inputs.json', folder / 'review.md', topic / 'runtime-study-corrections/browser-affected-final/browser.json', topic / 'runtime-bar-label-closure/source.json', topic / 'runtime-bar-label-closure/rlvr-flow-before.css', root / 'scripts/prepare-rlvr-affected-review-atlases.py', Path(__file__).resolve()]
for path in extras:
    bindings.append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path)})
packet = {'scope': 'F8-F10 same source/affected visible paint closure; D15 bar source closure only', 'whole_runtime_accepted': False, 'read_atlases': 9, 'read_tiles': 27, 'read_profile_objects': 12, 'files': bindings}
out = folder / 'reading-inputs.json'
assert not out.exists()
out.write_text(json.dumps(packet, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'bindings': len(bindings), 'sha256': digest(out)}))
