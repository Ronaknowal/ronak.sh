"""Save exact public implementation sources for topic29 research; never execute them."""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT/'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems/research'
DEST.mkdir(parents=True,exist_ok=True)

def fetch(url):
    request = urllib.request.Request(url,headers={'User-Agent':'Portfolio-lesson-research'})
    with urllib.request.urlopen(request,timeout=90) as response:
        return response.read()

revision = json.loads(fetch('https://api.github.com/repos/NandhaKishorM/laya/commits/main'))['sha']
names = ['README.md','LICENSE','pyproject.toml','laya/common.py','laya/agent.py','laya/router.py',
         'laya/__init__.py','notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb']
def acquire(name):
    url = f'https://raw.githubusercontent.com/NandhaKishorM/laya/{revision}/{name}'
    value = fetch(url)
    path = DEST/('laya-'+name.replace('/','-'))
    with path.open('xb') as handle:handle.write(value)
    return {'path':path.relative_to(ROOT).as_posix(),'url':url,'bytes':len(value),'sha256':hashlib.sha256(value).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    files = list(pool.map(acquire,names))
model = json.loads(fetch('https://huggingface.co/api/models/convaiinnovations/laya?blobs=true'))
with (DEST/'laya-model-metadata.json').open('x',encoding='utf-8') as handle:json.dump(model,handle,indent=2)
with (DEST/'laya-sources.json').open('x',encoding='utf-8') as handle:json.dump({'revision':revision,'files':files},handle,indent=2)
print(json.dumps({'revision':revision,'sources':files,'model_sha':model.get('sha'),
 'model_files':[{k:row[k] for k in ('rfilename','size','lfs') if k in row} for row in model.get('siblings',[])]},indent=2))
