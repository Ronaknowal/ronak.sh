"""Source-only supplemental identity checks and immutable review freeze, no fitting."""
from pathlib import Path
import csv, hashlib, json, re, sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
OWNER=HERE.parent
DESIGN=OWNER/'design-completion'
def sha(raw): return hashlib.sha256(raw).hexdigest()
def bind(p):
    p=Path(p)
    if not p.is_absolute(): p=ROOT/p
    raw=p.read_bytes()
    return {'path':p.relative_to(ROOT).as_posix(),'bytes':len(raw),'sha256':sha(raw)}
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(name,value):
    with (HERE/name).open('x',encoding='utf-8',newline='\n') as f: f.write(json.dumps(value,indent=2)+'\n')
checks=[]
def check(name,ok,evidence): checks.append({'name':name,'pass':bool(ok),'evidence':evidence})
identity=read(DESIGN/'source-identity.json')
observations=[]
for entry in identity['bindings']:
    actual=bind(entry['path'])
    if actual['sha256']!=entry['sha256'] or actual['bytes']!=entry['bytes']: observations.append({'expected':entry,'actual':actual})
check('117 immutable selected inputs still exact; only explicitly mutable handoff observed',len(observations)==1 and observations[0]['expected']['role']=='current-mutable-global-guidance-not-historical-conservation-claim' and observations[0]['expected']['path']=='docs/teaching/LESSON-AUTHORING-HANDOFF.md',observations)
raw=(ROOT/'src/learn/data/nmf-data.js').read_text(encoding='utf-8')
exports={name:json.loads(value) for name,value in re.findall(r'export const (\w+) = (\{.*\});',raw)}
digits=exports['NMF_DIGITS']
rows=list(csv.DictReader((ROOT/'public/learn-assets/nmf/digits-300.csv').open(encoding='utf-8',newline='')))
indexed={int(row['source_row']):row for row in rows}
check('all 300 source IDs unique',len(indexed)==300,list(indexed))
check('exact CSV row feature identities',list(rows[0])==['source_row','digit']+['pixel_'+str(i) for i in range(64)],list(rows[0]))
counts={str(i):sum(int(r['digit'])==i for r in rows) for i in range(10)}
check('30 records per digit',all(v==30 for v in counts.values()),counts)
mapped=[]
for row in digits['test']:
    original=indexed[row['sourceRow']]
    mapped.append({'sourceRow':row['sourceRow'],'digit':row['digit'],'exact':int(original['digit'])==row['digit'] and [int(original['pixel_'+str(j)]) for j in range(64)]==row['pixels']})
check('complete saved row digit pixel mapping',len(mapped)==60 and all(row['exact'] for row in mapped),mapped)
text=(ROOT/'src/learn/data/nmf-examples.js').read_text(encoding='utf-8')
examples=json.loads(text[text.index('{',text.index('export const')):].rstrip().removesuffix(';'))
native=read(ROOT/'docs/teaching/evidence/nmf-native.json')
decoded=[]
for key,item in examples.items():
    historical=native['programs'][key]
    got={'key':key,'file':item['file'],'decodedCodeSha256':sha(item['code'].encode()),'decodedStdoutSha256':sha(item['expected'].encode())}
    check('exact decoded original '+key,got['decodedCodeSha256']==historical['codeHash'] and got['decodedStdoutSha256']==historical['stdoutHash'] and item['expected']==historical['stdout'],got)
    decoded.append(got)
parsed=[]
for name in ['author-ready.json','source-identity.json','design-source-checks.json','execution-and-limitations.json','design-composition-deltas.json','design-arithmetic.json','saved-scale-arithmetic.json','practice-arithmetic.json']:
    value=read(DESIGN/name)
    parsed.append({**bind(DESIGN/name),'fullyParsedJSONKeys':list(value)})
check('seven complete effective contracts bound',len(read(DESIGN/'author-ready.json')['fullContracts'])==7,[bind(DESIGN/entry['path'].split('/')[-1]) for entry in read(DESIGN/'author-ready.json')['fullContracts']])
receipt={'status':'PASS_SOURCE_ONLY' if all(row['pass'] for row in checks) else 'FAIL_RETAINED','source':bind(Path(__file__)),'python':sys.version,'checks':checks,'completeAuthorJSONStructuralConsumption':parsed,'decodedOriginalPrograms':decoded,'fitsOrHistoricalExecutions':0,'arithmeticReplay':False}
write('source-only-checks.json',receipt)

full=[
'AGENTS.md','skills/lesson-authoring/SKILL.md','skills/lesson-authoring/references/review.md',
'src/learn/data/topics/non-negative-matrix-factorization-nmf.jsx','docs/teaching/drafts/non-negative-matrix-factorization-nmf/lesson.md','src/learn/data/curriculum/blueprints/non-negative-matrix-factorization-nmf.js',
'src/learn/data/nmf-models.js','src/learn/data/nmf-examples.js','src/learn/components/lesson-labs/NmfFigures.jsx','src/learn/components/lesson-labs/NmfLabs.jsx','src/learn/components/lesson-labs/NmfShared.jsx','public/learn-assets/nmf/data-provenance.md','public/learn-code/pca-dimensionality-reduction/centered_pca.py','docs/teaching/evidence/nmf-native.json']
full += [bind(DESIGN/name)['path'] for name in ['reading-flow-design.md','visual-and-investigation-contracts.md','programs-and-practice.md','dependencies-and-anchors.md','research-and-claim-disposition.md','author-review.md','reading-flow-revision.md','freeze-design.mjs','design-arithmetic.py','practice-arithmetic.py','saved-scale-arithmetic.py']]
full += [bind(OWNER/name)['path'] for name in ['current-assessment.md','research-reading.md','research-continuation.md','design-foundation-arithmetic.py','inspect-saved-inputs.py','saved-input-inspection.json','partial-checkpoint.json']]
scopes=[{'binding':bind(name),'scope':'Complete semantic/source body read; chunked where needed; source only, not executed'} for name in full]
for name,scope in [
('docs/teaching/LESSON-AUTHORING-HANDOFF.md','Current educational entry/scope and ICA/NMF rows selected; historical giant handoff not fully reread; mutable current observation'),
('src/learn/data/nmf-data.js','Complete NMF_DIGITS/NMF_RECORDED JSON exports decoded structurally and all values traversed; header/source roles read; no JavaScript execution'),
('public/learn-assets/nmf/digits-300.csv','All300 rows/66columns parsed; complete reserved60 row/label/pixel correspondence checked'),
('src/learn/data/topics/pca-dimensionality-reduction.jsx','Reused actual canonical section4 and row/reconstruction support from previous ICA review under same hash; selected roles only'),
('src/learn/data/topics/independent-component-analysis-ica.jsx','Canonical full source previously read during ICA review; current NMF comparison roles sections1/2, no successor acceptance inferred'),
('src/learn/data/topics/matrix-calculus-jacobians.jsx','Actual section6 shaped whole-matrix gradient lines124-143 selected'),
('src/learn/data/topics/feature-scaling-encoding-imputation.jsx','Actual heading array lines22-38 and section5 train-transform lines156-182 selected'),
('src/learn/data/topics/tensor-algebra-einsum-notation.jsx','Complete actual section4 lines80-119 unfolding/mode/rankone foundation selected'),
('src/learn/data/einsum-reading-flow-examples.js','Actual complete modes literal code/stdout selected; not executed'),
('src/learn/data/topics/complex-numbers-fourier-laplace-transforms.jsx','Complete selected sections2 lines68-89 and6 lines175-196 phasor/finiteDFT; not whole neighboring lesson'),
('scratch/survival-tools/Lib/site-packages/sklearn/decomposition/_nmf.py','Selected beta divergence lines78-191, init/CD275-519, transform1730-1760, minibatch2268-2410; source only, no import/private API dependency'),
('src/learn/components/Headings.jsx','Complete previous ICA source read reused for source-only heading slug; no browser navigation claim'),
('docs/teaching/classical-ml-reading-flow/visual-vocabulary.md','Complete previous ICA guidance read reused under identity guard'),
('docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/topic-notes.md','Complete previous ICA adjacent-topic read reused under identity guard'),
('docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/resumed-partial-checkpoint.json','Complete structural JSON consumption and all eight additive binding guards; not inferred semantic acceptance')]:
    if (ROOT/name).exists(): scopes.append({'binding':bind(name),'scope':scope})
for name in ['portfolio-adapter','topic-design','visuals-and-labs','examples-and-code','practice-and-resources']:
    scopes.append({'binding':bind('skills/lesson-authoring/references/'+name+'.md'),'scope':'Complete earlier ICA guidance read reused under current identity guard'})
for name in ['teaching','domain-playbook','workflow','handoffs-and-cleanup']:
    scopes.append({'binding':bind('skills/lesson-authoring/references/'+name+'.md'),'scope':'Applicable selected earlier ICA guidance; byte identity guard is not a complete semantic reading claim'})
consumption={'reviewer':'DIFFERENT entire proposed design reviewer; not design author','localSources':scopes,'authorJSONCompleteStructuralConsumption':parsed,'other118Inputs':'Every selected path read as bytes for identities; protected copies and historical verifier/study bodies not all semantically read or executed','remoteSources':[
{'url':'https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.NMF.html','scope':'Fresh selected current signature/init/solver/beta/shape passages; initial page navigation consumed, not whole page'},
{'url':'https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html','scope':'Fresh selected partial_fit/transform signature/input/first-custom-call mutation contract'},
{'url':'https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.nnls.html','scope':'Fresh actual signature, support, residual norm return and notes'},
{'url':'https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html','scope':'Fresh signature, norm/smooth-IDF/feature/vocabulary passages'},
{'url':'https://arxiv.org/pdf/1208.1237','scope':'Targeted text: orientation intro pages1-2; Algorithm1, complete tie/normalization/full-rank/signed-residual Assumptions1-2 passages pages3-4. Find output included later material but no full proof/experiment read claimed'},
{'url':'https://arxiv.org/pdf/1010.1763','scope':'Targeted scale/domain text pages2-4; auxiliary construction/PSD/derived updates pages6-8, Table2/Eq38-42; no full24page read/pixels/audio study'}],
'truncationRecovery':[
'Initial NMF reading-flow table output truncated; missing middle section ladder recovered in bounded source reads during review, complete seven contract bodies consumed.',
'Initial relevant review-guidance batch truncated; missing sections recovered from line70 onward, whole review.md consumed.',
'Subsequent redundant first50 reading-flow and broad rg output truncated; not used as proof of new complete reading. D51-D56 exact lines separately recovered.',
'Web NMF combined find output truncated in unrelated later portions; only actually visible selected passages recorded. Targeted primary algorithm/exponent passages separately read; no whole page/paper claim.',
'Two guessed local foundation/freeze filenames failed before exact filenames discovered by rg; source lookup failures only, no scientific execution.'
],
'limits':['No primary or historical figure pixels viewed by this reviewer; old author screenshot claims are author evidence only','No browser/native paint, novice observation, whole neighboring acceptance, performance experiment or scientific fit/main/checker replay','Prospective routes and saved JSON file are not implemented; freeze binds proposed contracts only']}
write('source-consumption.json',consumption)
execution={'finiteRun':{'command':'python '+bind(HERE/'finite-checks.py')['path'],'exitCode':0,'chunk':'152510','status':'FAIL_RETAINED','checks':205,'passed':204,'onlyFailedObservation':'Explicitly mutable global handoff bytes','result':bind(HERE/'finite-checks.json'),'source':bind(HERE/'finite-checks.py')},'sourceOnlyRun':{'command':'python '+bind(Path(__file__))['path'],'role':'Supplemental identity/payload mapping and freeze; no arithmetic replay','source':bind(Path(__file__)),'result':bind(HERE/'source-only-checks.json')},'scientificFits':0,'historicalMainsOrCheckers':0,'publicOrSharedWrites':0}
write('execution-and-limitations.json',execution)
files=[bind(p) for p in sorted(HERE.iterdir()) if p.is_file() and p.name!='review-packet.json']
packet={'decision':'REQUEST_CHANGES_R1','topic':'non-negative-matrix-factorization-nmf','reviewer':'DIFFERENT entire-design reviewer; not successor author','assignedAuthorReady':bind(DESIGN/'author-ready.json'),'effectiveContracts':read(DESIGN/'author-ready.json')['fullContracts'],'sourceIdentity':bind(DESIGN/'source-identity.json'),'predecessors':[bind(OWNER/'partial-checkpoint.json'),bind(OWNER/'resumed-partial-checkpoint.json')],'immutableTopicBindingsExact':117,'mutableGuidanceObservations':observations,'protectedPairs':28,'fullScope':{'sections':19,'visualJobs':66,'prospectiveCompleteRoutes':12,'solvedTasks':24,'outcomes':9},'outstandingFinding':{'id':'R1','file':bind(DESIGN/'programs-and-practice.md')['path'],'line':38,'reason':'Explicitly disambiguate residual norm from half-loss/MSE and supply sqrt(2L) mapping'},'files':files,'authority':'Root alone releases corrected whole design; no central phase/publication assertion'}
write('review-packet.json',packet)
print(json.dumps({'sourceOnlyStatus':receipt['status'],'sourceOnlyChecks':len(checks),'decision':packet['decision'],'report':bind(HERE/'report.md'),'packet':bind(HERE/'review-packet.json')}))
