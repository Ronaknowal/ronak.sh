"""Project frozen JSON into runtime data without any scientific execution."""
from pathlib import Path
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
TOPIC=ROOT/'docs/teaching/llm-architecture-training/prefix-caching-prompt-caching'
PUBLIC=ROOT/'public/learn-code/prefix-caching/saved-results'
OUT=ROOT/'public/learn-assets/prefix-caching-prompt-caching'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
release=TOPIC/'content-release-root.json'
assert sha(release)=='0211ddd31e664de1f159e1a971d6a772af8d8ba2ca74e4aee9d761329893adc5'
for p,h in json.loads(release.read_text())['files'].items():assert sha(ROOT/p)==h,p
data={'scope':'Saved once-run results. Browser actions execute no model or Python program.','sources':{}}
for stage in ['finite','tiny','native','allocator']:
    p=PUBLIC/stage/'result.json'
    data[stage]=json.loads(p.read_text())['observations']
    data['sources'][p.relative_to(ROOT).as_posix()]=sha(p)
p=PUBLIC/'allocator/events.jsonl'
data['allocator_events']=[json.loads(line) for line in p.read_text().splitlines() if 'state' in json.loads(line)]
data['sources'][p.relative_to(ROOT).as_posix()]=sha(p)
OUT.mkdir(exist_ok=True,parents=True)
target=OUT/'observations.json';target.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
(TOPIC/'runtime-data-preparation.json').write_text(json.dumps({'content_release':sha(release),'observation_sha256':sha(target),'source_hashes':data['sources'],'scientific_executions':0},indent=2)+'\n')
print(json.dumps({'bytes':target.stat().st_size,'sha256':sha(target)}))
