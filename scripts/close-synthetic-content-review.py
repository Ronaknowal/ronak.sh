"""Same-reviewer bounded R1 closure; no historical scientific work replayed."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile
import numpy as np

root = Path(__file__).resolve().parents[1]
doc = root / 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
public = root / 'public/learn-code/synthetic-data'
sys.path.insert(0, str(public))
from synthetic_sampling import inverse_cdf
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
packet = json.loads((doc / 'cdf-correction/inputs.json').read_text())
for path, expected in packet['files'].items():
    assert sha(root / path) == expected, path
old = json.loads((doc / 'content-inputs.json').read_text())
changed = [row['path'] for row in old['files'] if sha(root / row['path']) != row['sha256']]
assert set(changed) == {str(path.relative_to(root)).replace('\\','/') for path in (
    doc / 'lesson.md', public / 'synthetic_sampling.py', public / 'download-manifest.json',
    public / 'synthetic-programs-data.zip')}
for path in changed:
    old_hash = next(row['sha256'] for row in old['files'] if row['path'] == path)
    assert sha(doc / 'cdf-correction' / Path(path).name) == old_hash
assert inverse_cdf([.1]*10+[0.], np.nextafter(1.,0.)) == 9
cases = 0
for vector in ([0,.125,0,.375,0,.5,0], [.25,0,0,.75,0], [0,0,1,0,0]):
    total = 0.
    intervals = []
    for i,p in enumerate(vector):
        if p:
            intervals.append((total,total+p,i))
            total += p
    for a,b,expected in intervals:
        for u in (a, (a+b)/2, np.nextafter(b,a)):
            assert inverse_cdf(vector,u) == expected
            cases += 1
    for padding in range(4):
        renamed = [0.]*padding + list(vector) + [0.]*(3-padding)
        for u in (0., .1, .4, .7, np.nextafter(1.,0.)):
            assert inverse_cdf(renamed,u) == inverse_cdf(vector,u) + padding
            cases += 1
with zipfile.ZipFile(public / 'synthetic-programs-data.zip') as bundle:
    for name in bundle.namelist():
        assert bundle.read(name) == (public/name).read_bytes()
result = {'reviewer': 'training_author', 'decision': 'accepted after bounded R1 closure',
          'whole_review_sha256': sha(doc/'content-review.md'),
          'original_manifest_sha256': sha(doc/'content-inputs.json'),
          'successor_manifest_sha256': sha(doc/'cdf-correction/inputs.json'),
          'manuscript_sha256': sha(doc/'lesson.md'), 'guarded_inputs': len(packet['files']),
          'conserved_original_inputs': 50, 'new_boundary_and_id_mapping_cases': cases+1,
          'fits': 0, 'neural_generations': 0,
          'reading': 'Complete repaired function, whole changed practice B and neighboring A/C, author correction and retained metadata. Whole earlier review composes unchanged. Positive-support normalization and index remapping close R1; original counterexample now returns9. No further finding.',
          'bindings': {str(path.relative_to(root)).replace('\\','/'): sha(path) for path in (
              Path(__file__),doc/'content-review.md',doc/'content-review-checks.json',
              doc/'cdf-correction/inputs.json',doc/'lesson.md',public/'synthetic_sampling.py')}}
with (doc/'content-review-acceptance.json').open('x',encoding='utf-8') as stream:
    json.dump(result,stream,indent=2);stream.write('\n')
print(json.dumps(result,indent=2))
