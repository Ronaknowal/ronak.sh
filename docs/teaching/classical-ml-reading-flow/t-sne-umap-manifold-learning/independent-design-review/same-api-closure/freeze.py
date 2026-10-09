"""Bounded reviewer guards and additive SAME R1 design decision; no estimators."""
from pathlib import Path
import hashlib,json
ROOT=Path.cwd()
OWNER=ROOT/'docs/teaching/classical-ml-reading-flow/t-sne-umap-manifold-learning'
OUT=Path(__file__).parent
def binding(p):
 b=p.read_bytes();return dict(path=p.relative_to(ROOT).as_posix(),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def guard(x):
 a=binding(ROOT/x['path']);assert a=={k:x[k] for k in ('path','bytes','sha256')},x['path'];return a
ready_path=OWNER/'design-api-correction/author-ready-packet.json'
ready=json.loads(ready_path.read_text())
assert binding(ready_path)['sha256'].startswith('b3d7ef24')
guards=[guard(ready['predecessor'])]
for key in ('differentReview','effectiveComposition','correction'):guards.extend(guard(x) for x in ready[key])
original=json.loads((OWNER/'proposed-design-packet.json').read_text())
guards.extend(guard(x) for x in original['files'])
pairs=[]
for x in original['preservedInputs']:
 a=guard(x);p=OWNER/x['preserved'];assert p.read_bytes()==(ROOT/x['path']).read_bytes();pairs.append(dict(active=a,preserved=binding(p)))
delta=json.loads((OWNER/'design-api-correction/source-delta.json').read_text())
inverses=[]
for d in delta['deltas']:
 a=guard(d['beforeFile']);b=guard(d['afterFile']);data=(ROOT/b['path']).read_bytes();after=d['after'].encode();before=d['before'].encode();assert data.count(after)==1
 recovered=data.replace(after,before);assert recovered==(ROOT/a['path']).read_bytes();inverses.append(dict(before=a,after=b,inverseExact=True))
evidence=json.loads((OWNER/'design-api-correction/source-check.json').read_text())
guards.extend(guard(x) for x in evidence['sourceEvidence'])
observation=dict(schemaVersion=1,status='PASS',scope='Exact source identity/conservation and three physical inverses only',guardCount=len(guards),protectedPairs=pairs,inverses=inverses,sourceEvidence=evidence['sourceEvidence'],scientificExecution=0)
(OUT/'observations.json').write_text(json.dumps(observation,indent=2)+'\n',encoding='utf8')
report='''# SAME t-SNE/UMAP17 R1 design closure

PASS for the effective proposed design, composing the retained whole DIFFERENT review ad229d17 / packet67d92f9a with this bounded SAME correction decision. R1 is closed; no required residuals. This reviewer did not author the proposal or its API correction. Root alone releases design; this is neither content nor runtime acceptance.

The complete author-ready packet, amendment, three reversible deltas and source-only check were consumed. I read the full affected classical_geometry.py programme row and its surrounding implementation requirements; complete §9/D34–D42 context; the revised research/API paragraph and its access qualifications; and the complete amendment. The entire original 13-section/45-drawing design, 12 investigations, 19 solved tasks, ten proposed new program contracts and five retained original program/stream routes remain covered by the original whole review. They were not reopened as a second whole review.

The idiomatic ordinary contract correctly separates metric_mds=True/False from metric='precomputed', supplies explicit dimension/start/count/seed/budget/tolerance/stress options, and passes the same declared array to both scratch SMACOF and ordinary fit_transform. Array starts are a single run and override random initialization. A separately named classical initializer is not smuggled into that comparison. The scratch numerical guard remains separately qualified. Source reading of the exact installed1.9.1 _mds.py constructor, input routing, initialization branches, disparity mask and final stress calculation confirms these contracts without importing or executing an estimator.

Raw metric stress is the unordered-pair squared distance residual; Stress-1 uses its square root after division by embedded squared distances. Nonmetric uses fitted disparities, with the source's normalization, rather than input metric residuals. A zero denominator remains undefined. The D35 duplicate example preserves distinct A/B identities: classical/metric known zero differs from the ordinary nonmetric zero-as-missing convention. No epsilon replacement or fitted coordinate parity is claimed. Old boolean metric/dissimilarity aliases are qualified as supported-deprecated in1.9 with planned removal in1.10; old outputs are not relabelled as failures.

Independent stdlib guards confirm all ready/effective/review/source identities, all twelve original proposal records and all forty original physical byte pairs. Three complete byte inverses recover the exact predecessor documents, so unrelated programme/practice/research/drawing text is conserved. The observations are finite identity and inverse checks, not evidence-count quality claims or a rerun of the author's verifier. Effective source identities are recorded completely in packet.json and observations.json.

Read provenance: original whole review remains immutable. This continuation's cce736 and648fb7 are untruncated affected-context/source reads.43b7f9 was truncated in unrelated following programme rows/repeated research text; the entire affected MDS row and all three deltas were already visible and previously read completely (ea90af); no coverage is inferred from the truncated tail.213a34 read the full source-only author check. Prior wrong author-ready filename lookups (370f72,05a00f) remain failed lookups; actual discovery71fe91 identified author-ready-packet.json. They do not become passing guards.

Limits: no fit, old main, historical checker, scientific study, package installation, new browser or build was run. Original partial canonical-paper/figure and metadata-only video qualifications remain unchanged. Source observation establishes the declared1.9.1 contract, not future compatibility or executed numerical parity. New manuscript, new complete programs and runtime remain future phases. No shared/public/central or learner source was changed.
'''
(OUT/'report.md').write_text(report,encoding='utf8')
packet=dict(schemaVersion=1,status='PASS_SAME_R1_DESIGN_CLOSURE',reviewer='/root/survival_content_independent_review',author=ready['originalAuthor'],scope='Bounded SAME single-R1 API closure composing original whole DIFFERENT design review',authorReady=binding(ready_path),wholeReview=ready['differentReview'],effectiveComposition=ready['effectiveComposition'],requiredFindings=[dict(id='R1',status='CLOSED')],unresolvedRequired=[],report=binding(OUT/'report.md'),observations=binding(OUT/'observations.json'),guardCount=len(guards),protectedPairs=len(pairs),exactInverses=len(inverses),limits=ready['limits']+['No new whole content/runtime acceptance; Root alone releases design.'],scientificProgramsRun=0)
(OUT/'packet.json').write_text(json.dumps(packet,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(status='PASS',report=binding(OUT/'report.md'),packet=binding(OUT/'packet.json'),observations=binding(OUT/'observations.json'),guards=len(guards),pairs=len(pairs),inverses=len(inverses)),indent=2))
