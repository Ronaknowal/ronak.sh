"""Copy accepted learner files and project saved observations; never execute them."""
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/kv-cache-memory-management'
PUBLIC = ROOT / 'public/learn-code/kv-cache'
ASSETS = ROOT / 'public/learn-assets/kv-cache-memory-management'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
packet = TOPIC / 'content-review-successor/inputs.json'
assert sha(packet) == '476e1c8be6d3d3bee55b706bf5fee8f57f6cbd9f2d8592da4f58aad2e4c4f609'
for row in json.loads(packet.read_text(encoding='utf8'))['files']:
    assert sha(ROOT / row['path']) == row['sha256'], row['path']
PUBLIC.mkdir(parents=True, exist_ok=True)
ASSETS.mkdir(parents=True, exist_ok=True)
copies = []
for source in sorted((TOPIC / 'programs').iterdir()):
    if not source.is_file():
        continue
    target = PUBLIC / source.name
    if target.exists():
        assert sha(target) == sha(source), f'Existing public file differs: {target}'
    else:
        shutil.copyfile(source, target)
    copies.append({'path':target.relative_to(ROOT).as_posix(), 'sha256':sha(target)})
archive = PUBLIC / 'kv-cache-programs.zip'
if archive.exists():
    assert sha(archive) == sha(TOPIC / archive.name)
else:
    shutil.copyfile(TOPIC / archive.name, archive)
study = json.loads((TOPIC / 'research/study-results.json').read_text(encoding='utf8'))
finite = json.loads((TOPIC / 'research/program-checks.json').read_text(encoding='utf8'))['outputs']
decoder = json.loads((TOPIC / 'research/cached-decoder-successor-checks.json').read_text(encoding='utf8'))
data = {'scope':'Exact saved observations, no repeated scientific execution.',
        'study':study, 'finite':finite, 'decoder':decoder,
        'sources':{name:sha(TOPIC / 'research' / name) for name in [
            'study-results.json','program-checks.json','cached-decoder-successor-checks.json']}}
target = ASSETS / 'observations.json'
target.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
(TOPIC / 'runtime-data-preparation.json').write_text(json.dumps({
    'scope':'Guarded copy/projection only; zero inference or fits', 'files':copies,
    'archive_sha256':sha(archive), 'observations_sha256':sha(target),
    'content_packet_sha256':sha(packet)},indent=2)+'\n',encoding='utf8')
print(json.dumps({'learner_files':len(copies),'observations_bytes':target.stat().st_size,
                  'timings':len(study['timings']),'cases':len(study['cases'])}))
