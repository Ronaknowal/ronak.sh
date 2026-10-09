"""Check immutable input piece projection without executing a tokenizer or model."""
import json, hashlib
from pathlib import Path
folder=Path('docs/teaching/llm-architecture-training/inference-engines-serving')
record=json.loads((folder/'runtime-pieces-projection.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(record['source'])==record['source_sha256']
assert sha(record['target'])==record['target_sha256']
source=json.loads(Path(record['source']).read_text())
target=json.loads(Path(record['target']).read_text())
assert target=={r['id']:r['tokenization']['tokens']for r in source['requests']}
(folder/'runtime-pieces-check.json').write_text(json.dumps({'passed':True,'checker':str(Path(__file__).relative_to(Path.cwd())).replace('\\','/'),'source':record['source'],'sourceSha256':sha(record['source']),'target':record['target'],'targetSha256':sha(record['target']),'rows':sum(map(len,target.values())),'scope':'Exact four-request JSON projection; no tokenizer, model, conversion or scientific replay.'},indent=2)+'\n')
print('29 exact retained piece/ID rows verified')
