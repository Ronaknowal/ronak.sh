from pathlib import Path
import json,hashlib,re,datetime
root=Path('.').resolve();b=Path('docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards');h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
# No changed file is silently normalized in accepted manuscript/program/science.
accepted=json.loads((b/'content-acceptance.json').read_text())['bindings'];failures=[]
for name,expected in accepted.items():
 actual=h(Path(name))
 if actual!=expected:failures.append({'path':name,'expected':expected,'actual':actual})
assert not failures,failures
# Refresh only index membership now that the D30-only receipt completed.
p=b/'runtime-paint-index.json';index=json.loads(p.read_text());known={x['base'] for x in index['additional']}
for picture in sorted((b/'browser-epoch-accepted/screenshots').glob('*.png')):
 if '.tile-' in picture.name:continue
 if picture.as_posix() in known:continue
 side=Path(str(picture)+'.tiles.json');index['additional'].append({'kind':'browser-epoch-accepted','base':picture.as_posix(),'sha256':h(picture),'tileSidecar':side.as_posix(),'tiles':json.loads(side.read_text())['tiles']})
p.write_text(json.dumps(index,indent=2))
app=['src/learn/data/rlvr-models.js','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','src/learn/components/lesson-labs/rlvr-flow.css',str(b/'lesson.jsx')]
paths={Path(x) for x in app}|{Path(x) for x in accepted}
for directory in [b,Path('public/learn/examples/rlvr'),Path('public/learn-assets/rlvr')]:
 for p in directory.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(directory).parts
  if directory==b and (rel[0].startswith('runtime-independent') or rel[0] in ['runtime-inputs.json','runtime-author-ready.json']):continue
  if '__pycache__' in rel:continue
  paths.add(p)
for name in ['project-rlvr-observations.py','render-rlvr-lesson.mjs','format-rlvr-runtime.mjs','verify-rlvr-models.mjs','verify-rlvr-browser.cjs','verify-rlvr-interactions.cjs','verify-rlvr-delivery.cjs','verify-rlvr-bars-scroll.cjs','verify-rlvr-study-corrections.cjs','verify-rlvr-ppo-pans.cjs','lib/rlvr-browser-capture.cjs']:
 paths.add(Path('scripts')/name)
bindings=[{'path':p.as_posix(),'sha256':h(p),'bytes':p.stat().st_size} for p in sorted(paths)]
manifest={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'complete author runtime; different whole review and root publication required','acceptedManuscriptSha256':h(b/'lesson.md'),'counts':{'sections':16,'drawings':39,'canonicalPrograms':13,'practiceSolutions':14,'viewAssets':24,'defaultObjects':117,'acceptedContentBindingsConserved':len(accepted)},'sourcePaths':app,'paintIndex':(b/'runtime-paint-index.json').as_posix(),'authorReview':(b/'runtime-author-review.md').as_posix(),'noScientificReplay':True,'qualifications':['Original native update comparison remains failed; own-step analytical audit and constructed fixture are distinct.','Earlier d8ba author model receipt was overwritten; exact old bytes unavailable; current successor and independent numerical evidence retained.','Prior failed browser receipts remain failed; only actual scoped successful conditions are composed.','Sole blocked external Google Fonts stylesheet is attributed; fallback font is explicit.','Native ZIP cancellation remains unresolved; exact HTTP ZIP bytes and native individual program downloads passed.'],'bindings':bindings}
(b/'runtime-inputs.json').write_text(json.dumps(manifest,indent=2))
ready={'readyForDifferentWholeReview':True,'manifestPath':(b/'runtime-inputs.json').as_posix(),'manifestSha256':h(b/'runtime-inputs.json'),'bindingCount':len(bindings),'sourceHashes':{p:h(Path(p)) for p in app},'authorReviewSha256':h(b/'runtime-author-review.md'),'paintIndexSha256':h(b/'runtime-paint-index.json'),'authorOnly':True}
(b/'runtime-author-ready.json').write_text(json.dumps(ready,indent=2));print(json.dumps(ready))
