"""Acquire one exact public Laya checkpoint for a later ordinary-tool bridge.
Downloads only; no model load, inference, fit or remote code execution.
"""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems/research'
DEST = ROOT/'scratch/typed-decision-research/laya-english'
DEST.mkdir(parents=True, exist_ok=True)
metadata = json.loads((TOPIC/'laya-model-metadata.json').read_text())
revision = '7b928d828b7b0e022f929d9bd2e44165aa270148'
assert metadata['sha'] == revision
items = {x['rfilename']: x for x in metadata['siblings']}
files = []
for name in ['rl_agent_config.json','encoder/config.json','tokenizer/tokenizer.json',
             'tokenizer/tokenizer_config.json','README.md','model.safetensors']:
    item = items[name]
    path = DEST/name
    path.parent.mkdir(parents=True,exist_ok=True)
    url = f'https://huggingface.co/convaiinnovations/laya/resolve/{revision}/{name}'
    if not path.exists():
        temporary = path.with_name(path.name+'.partial')
        with urllib.request.urlopen(url,timeout=180) as response, temporary.open('xb') as out:
            while chunk := response.read(1024*1024):out.write(chunk)
        temporary.rename(path)
    actual = hashlib.file_digest(path.open('rb'),'sha256').hexdigest()
    assert path.stat().st_size == item['size'], name
    if 'lfs' in item:assert actual == item['lfs']['sha256'],name
    files.append(dict(name=name,url=url,bytes=path.stat().st_size,sha256=actual))
    print(json.dumps(files[-1]),flush=True)
with (TOPIC/'laya-checkpoint-source.json').open('x',encoding='utf8') as out:
    json.dump(dict(model='convaiinnovations/laya',revision=revision,files=files,inference=0,fits=0),out,indent=2)
