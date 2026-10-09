"""Freeze complete current author runtime; no science or publication mutation."""
import hashlib,json,difflib
from pathlib import Path
f=Path('docs/teaching/llm-architecture-training/inference-engines-serving')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
write=lambda p,v:Path(p).write_text(json.dumps(v,indent=2)+'\n',encoding='utf8')
accept=f/'latency-terminology-correction/accepted-root.json'
accepted=json.loads(accept.read_text())
for p,h in accepted['files'].items():assert sha(p)==h,p
native=[1,2,3,17,18,19,21,22,23,32]
paint=[]
for n in native:
 ident=f'D{n:02d}';rows=[]
 for profile in ['desktop','phone','enlarged']:
  directory='runtime-native-presentation-correction/paint-r2' if n in [1,17,22,32] else ('runtime-native-paint' if profile=='desktop' else 'runtime-native-paint-r2')
  p=f/directory/f'{profile}-{ident}-default.png';assert p.exists()
  rows.append({'profile':profile,'default':p.as_posix(),'sha256':sha(p),'completePanIndex':(f/directory/'atlases/index.json').as_posix()})
 paint.append({'id':ident,'profiles':rows})
before=f/'runtime-native-presentation-correction/InferenceEngineNativeEvidence.jsx';after=Path('src/learn/components/lesson-labs/InferenceEngineNativeEvidence.jsx')
(f/'runtime-native-presentation-correction/source.diff').write_text(''.join(difflib.unified_diff(before.read_text().splitlines(True),after.read_text().splitlines(True),fromfile=before.as_posix(),tofile=after.as_posix())))
write(f/'runtime-paint-map.json',{'nativeFigures':paint,'nativeChanged':'runtime-native-paint-r2/report.json','nativeControls':'runtime-native-controls/report.json','lifecycle':'runtime-lifecycle/author-review.md','memoryMetrics':'runtime-memory/author-review.md','practice':'runtime-delivery-r2/report.json; replace only practice8 with runtime-delivery-r3/report.json','rejectedPaint':['runtime-native-presentation-correction/paint: transient preview guard overlay'],'qualifiedFailures':['runtime-native-paint: exact-label helper stopped after desktop defaults','runtime-delivery: relative request URL after all13 program copies/downloads','runtime-delivery-r2: stale practice8 detected; other15 unchanged'],'sourceRecovery':[{'oldPath':after.as_posix(),'oldSha256':sha(before),'recoverAt':before.as_posix(),'currentSha256':sha(after)}]})
files={Path(p)for p in accepted['files']};files.add(accept)
for pattern in ['InferenceEngine*.jsx','inference-engine-*.css']:files.update(Path('src/learn/components/lesson-labs').glob(pattern))
files.update(Path('src/learn/data').glob('inference-engine-*'))
for name in ['runtime-author-review.md','runtime-paint-map.json','runtime-build.json','runtime-native-model-checks.json','runtime-pieces-projection.json','runtime-pieces-check.json','lesson.jsx','renderer-receipt.json']:files.add(f/name)
for directory in f.glob('runtime-*'):
 if directory.is_dir() and directory.name!='runtime-review-root':files.update(p for p in directory.rglob('*')if p.is_file())
for p in Path('public/learn/examples/inference-engines').rglob('*'):
 if p.is_file():files.add(p)
for pattern in ['*inference-engine*.mjs','*inference-engine*.cjs','*inference-engine*.py']:files.update(Path('scripts').glob(pattern))
for p in [f/'runtime-lifecycle/author-review.md',f/'runtime-memory/author-review.md']:assert p.exists(),f'Await final author report {p}'
for report in ['runtime-build.json','runtime-native-controls/report.json','runtime-native-paint-r2/report.json','runtime-native-presentation-correction/paint-r2/report.json','runtime-delivery-r3/report.json']:assert json.loads((f/report).read_text())['passed'],report
bindings=[{'path':p.as_posix(),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(files)if p.is_file()]
write(f/'runtime-inputs.json',{'topic_id':'inference-engines-serving','status':'ready-for-different-whole-runtime-review','authors':['alignment_author','serving_author','training_author'],'authorReview':(f/'runtime-author-review.md').as_posix(),'manuscript':(f/'lesson.md').as_posix(),'manuscriptSha256':sha(f/'lesson.md'),'preparedSource':(f/'lesson.jsx').as_posix(),'publishedSHA':'2eaf60d046503c1758631cf4284d7f5c677f1205f1984a3e3a99ffd24378ac98','figureCount':32,'figureSelector':'[data-engine-figure]','assetRoots':['public/learn/examples/inference-engines'],'contentAcceptance':accept.as_posix(),'contentAcceptanceSha256':sha(accept),'privatePreview':'http://127.0.0.1:4266/learn/path/full-curriculum/inference-engines-serving?module=large-language-models','science':'All original accepted outcomes and failed conversion conserved; no scientific replay during runtime.','files':bindings})
print(json.dumps({'files':len(bindings),'sha256':sha(f/'runtime-inputs.json'),'contentGuards':len(accepted['files'])}))
