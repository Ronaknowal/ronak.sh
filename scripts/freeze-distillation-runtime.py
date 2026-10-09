"""Bind accepted content plus the full reviewed local Distillation runtime."""
from pathlib import Path
import hashlib,json,datetime
p=Path('docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation')
sha=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
accepted=json.loads((p/'content-root-inputs.json').read_text())['files']
for f,h in accepted.items():
    assert sha(f)==h,f
out=p/'runtime-inputs.json'
assert not out.exists(),'Preserve existing readiness; create a successor instead.'
paths=set(accepted)
paths.update(f.as_posix() for f in p.rglob('*') if f.is_file() and '__pycache__' not in f.parts)
paths.update(f.as_posix() for f in Path('scripts').glob('*distillation*') if f.is_file())
paths.add('scripts/lib/lesson-browser-fonts.cjs')
paths.add('src/learn/data/distillation-models.js')
paths.add('public/learn-assets/llm-distillation/observations.json')
paths.add('src/learn/components/lesson-labs/distillation-flow.css')
paths.update(f'src/learn/components/lesson-labs/Distillation{x}.jsx' for x in ['Shared','Foundations','Sequences','Evidence'])
packet={'status':'author-ready-for-different-whole-runtime-review','author':'training_author','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'contentRoot':{'path':(p/'content-root-inputs.json').as_posix(),'sha256':sha(p/'content-root-inputs.json'),'count':len(accepted)},'scope':{'mechanisms':28,'sections':14,'practices':15,'programs':12,'aliases':11,'passingCaptures':468,'personallyReadAtlases':178,'personallyReadTiles':705},'limits':['Different reviewer and production publication remain root-owned.','No new scientific fits, model generation, or inference.','ZIP exact HTTP delivery checked; native ZIP save not claimed.','Atlas rendering can resize images; no learner study claimed.'],'files':{f:sha(f) for f in sorted(paths)}}
out.write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'path':out.as_posix(),'sha256':sha(out),'files':len(packet['files']),'content':len(accepted)}))
