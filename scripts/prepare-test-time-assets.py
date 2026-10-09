"""Copy the accepted public bundle and project saved observations; no model work."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
topic = root / 'docs/teaching/llm-architecture-training/test-time-compute-scaling'
public = root / 'public/learn/examples/test-time-compute'
asset = root / 'public/learn-assets/test-time-compute'
sys.path.insert(0, str(topic / 'programs'))
from selection import canonical_answer

archive = topic / 'test-time-compute.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == '560745c3891b604f053fac52694a89455c87ba2f0a210f65b6b4b7fb7cdb5861'
public.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(archive) as z:
    for name in z.namelist():
        target = (public / name).resolve()
        assert target.is_relative_to(public.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(z.read(name))
(public / archive.name).write_bytes(archive.read_bytes())
summary = json.loads((topic / 'programs/summary.json').read_text(encoding='utf8'))
questions = json.loads((topic / 'programs/data/selected.json').read_text(encoding='utf8'))
for row in summary['detail']:
    row['candidates'] = [{key: value for key, value in candidate.items()
                          if key in ('sample', 'text', 'generated_tokens', 'cpu_seconds', 'stop')}
                         | {'answer': canonical_answer(candidate['text'])}
                         for candidate in row['candidates']]
asset.mkdir(parents=True, exist_ok=True)
(asset / 'observations.json').write_text(json.dumps({'summary': summary['summary'],
    'detail': summary['detail'], 'questions': questions}, indent=2) + '\n', encoding='utf8')
print(json.dumps({'public_members': len(z.namelist()), 'saved_comparisons': len(summary['detail']),
                  'scope': 'Projection of retained data; no generation, bootstrap or scientific replay'}))
