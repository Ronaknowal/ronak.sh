"""Copy frozen learner assets and recorded observations; execute no science."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/continuous-batching-pagedattention'
PUBLIC = ROOT/'public/learn-code/continuous-batching'
ASSETS = ROOT/'public/learn-assets/continuous-batching-pagedattention'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
packet = TOPIC/'content-inputs.json'
assert sha(packet)=='d47ae34678b5252771155dda57725148cfa34c528b530ee03a5c93787c0a2385'
for row in json.loads(packet.read_text())['files']:
    assert sha(ROOT/row['path'])==row['sha256'],row['path']
PUBLIC.mkdir(parents=True,exist_ok=True)
ASSETS.mkdir(parents=True,exist_ok=True)
copied=[]
for source in [*(TOPIC/'programs').iterdir(),*(TOPIC/'bundle').iterdir()]:
    if not source.is_file():
        continue
    destination=PUBLIC/source.name
    if destination.exists():
        assert sha(destination)==sha(source),destination
    else:
        shutil.copyfile(source,destination)
    copied.append({'path':destination.relative_to(ROOT).as_posix(),'sha256':sha(destination)})
mapping={'study':'study-results.json','lifecycle':'native_lifecycle.json','simulation':'serving-simulation-results.json','decoder':'packed-decoder-results.json','attention':'paged-attention-results.json','pool':'shared-pool-results.json','capstone':'capstone-results.json'}
observations={'scope':'Recorded CPU outputs and finite fixtures. Browser selections never run Python or a language model.',
              **{key:json.loads((TOPIC/'research'/name).read_text()) for key,name in mapping.items()},
              'sources':{name:sha(TOPIC/'research'/name) for name in mapping.values()}}
out=ASSETS/'observations.json'
out.write_text(json.dumps(observations,indent=2)+'\n',encoding='utf8')
(TOPIC/'runtime-data-preparation.json').write_text(json.dumps({'content':sha(packet),'files':copied,'observations':sha(out),'no_scientific_execution':True},indent=2)+'\n',encoding='utf8')
print(json.dumps({'copied':len(copied),'observation_bytes':out.stat().st_size}))
