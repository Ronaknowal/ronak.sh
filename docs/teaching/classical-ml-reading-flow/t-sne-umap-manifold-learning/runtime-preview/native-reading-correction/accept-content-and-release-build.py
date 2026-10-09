"""Compose the independently closed seven amendments and permit one isolated build."""
import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[6]
OWNER=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
def binding(p):
    b=p.read_bytes();return {'path':str(p.relative_to(ROOT)).replace('\\','/'),'bytes':len(b),'sha256':sha(b)}
freeze_path=OWNER/'author-ready-source.json';freeze=load(freeze_path)
assert sha(freeze_path.read_bytes())=='ffba1af17a352530b5fb1756f2f9e7b3a8c1bed14d74dbba750e79169bc8801d'
report=OWNER/'independent-source-review/source-closure.md'
assert sha(report.read_bytes())=='dbef69001d9faf3b317d9fe91d15b0f44692343f2e91885c0a522d1bffaee648'
navrole=ROOT/'docs/teaching/classical-ml-reading-flow/navigation-source-role-continuation/math-reading-time-root-acceptance.json'
assert sha(navrole.read_bytes())=='1a8e35e672e2ab034781c765fea5b68812b3e72d70bf10c1970679809b462180'
products=[]
for row in freeze['productBindings']+freeze['evidenceBindings']:
    p=ROOT/row['path']; b=p.read_bytes()
    assert len(b)==row['bytes'] and sha(b)==row['sha256'],row['path'];products.append(row)
amendments=load(OWNER/'matched-reading-amendments.json')
assert len(amendments['amendments'])==7 and len(amendments['specificationAdditions'])==19
ledger_path=ROOT/'docs/teaching/lesson-delivery-progress.json'
before_raw=ledger_path.read_bytes();ledger=json.loads(before_raw);before=copy.deepcopy(ledger)
id='t-sne-umap-manifold-learning';row=ledger['topics'][id]
assert row['revision']==5 and row['content']['status']=='complete' and row['implementation']['status']=='in-progress'
for p,digest in row['content']['files'].items():assert sha((ROOT/p).read_bytes())==digest,p
old_row=copy.deepcopy(row)
manuscript=OWNER/'reading-flow-manuscript.md';spec=OWNER/'visual-and-investigation-specifications.md'
assert manuscript.stat().st_size==140822 and spec.stat().st_size==50202
amended=[binding(p) for p in [manuscript,spec,OWNER/'matched-reading-amendments.json',report,
                            OWNER/'independent-source-review/source-closure-check.json']]
for item in amended:row['content']['files'][item['path']]=item['sha256']
row['content']['manuscript']=binding(manuscript)['path']
row['content']['visualSpecifications']=binding(spec)['path']
record_path=OWNER/'root-content-amendment-and-build-release.json'
assert not record_path.exists(), 'Never overwrite an earlier release.'
row['content']['amendmentRecord']=str(record_path.relative_to(ROOT)).replace('\\','/')
for topic,value in ledger['topics'].items():
    if topic!=id:assert value==before['topics'][topic]
assert row['implementation']==old_row['implementation']
assert ledger_path.read_bytes()==before_raw, 'Concurrent central writer: re-intake.'
receipt={'schema':'manifold-consolidated-native-reading-content-and-build-release/v1',
 'at':datetime.now(timezone.utc).isoformat(),'owner':'/root',
 'status':'BOUNDED_CONTENT_AMENDMENTS_ACCEPTED_ONE_PRIVATE_BUILD_RELEASED_NO_RUNTIME_ACCEPTANCE',
 'authorFreeze':binding(freeze_path),'independentReportReadCompletely':binding(report),
 'navigationRoleContinuation':binding(navrole),'sourceAndEvidenceBindings':products,
 'acceptedAmendments':amended,'matchedPairsRead':7,'additiveSpecContractsRead':19,
 'retainedContentBindings':len(old_row['content']['files']),'previousSelectedRow':old_row,
 'foreignRowsConserved':len(ledger['topics'])-1,'phaseStatusChanges':0,
 'buildPlan':{'command':'node node_modules/vite/bin/vite.js build --config docs/teaching/classical-ml-reading-flow/t-sne-umap-manifold-learning/runtime-preview/native-reading-correction/vite.config.mjs',
              'previewPort':5202,'reason':'Feature20 owns live5201; CLI override only, frozen config retained',
              'publicDir':False,'normalIntegration':False},
 'scope':'Root read the entire bounded source closure, all seven literal old/new Markdown/JSX pairs and nineteen additive visual contracts. This composes the retained whole-content/runtime reviews. No new full-lesson/native/learner-mastery acceptance or old science replay.',
 'ledgerBeforeSha256':sha(before_raw),'scientificExecutions':0,'native':False}
ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
receipt['ledgerAfterSha256']=sha(ledger_path.read_bytes())
record_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'amendedBindings':len(amended),'retainedBindings':receipt['retainedContentBindings'],
                  'foreignRows':receipt['foreignRowsConserved'],'receiptSha256':sha(record_path.read_bytes())}))
