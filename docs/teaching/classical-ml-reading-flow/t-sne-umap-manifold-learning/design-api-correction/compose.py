"""Compose exact R1 design-only successors. No scientific code is imported/run."""
from pathlib import Path
import ast,hashlib,json
HERE=Path(__file__).resolve().parent
OWNER=HERE.parent
ROOT=OWNER.parents[3]
def sha(data):return hashlib.sha256(data).hexdigest()
def bind(path):
    data=path.read_bytes()
    return {'path':path.relative_to(ROOT).as_posix(),'bytes':len(data),'sha256':sha(data)}
proposal=json.loads((OWNER/'proposed-design-packet.json').read_text())
review=json.loads((OWNER/'independent-design-review/packet.json').read_text())
assert sha((OWNER/'proposed-design-packet.json').read_bytes())=='92aafa0d19b0a3f5fe2efd62d6b5f87f891a4e737a96c141c0dbb3dfac7c65c4'
assert sha((OWNER/'independent-design-review/review.md').read_bytes())=='ad229d170842fa0335f5aff496f8666ef6c1ea1fa0542e1d173a204da3b6e4f8'
assert sha((OWNER/'independent-design-review/packet.json').read_bytes())=='67d92f9af9e95a3c3c2149fe8deef235f1a0fc77a1c9eb9d2a28ab5d41e80080'
for entry in review['completeProposedFiles']:
    assert sha((ROOT/entry['path']).read_bytes())==entry['sha256']
for pair in review['protectedPairs']:
    active=(ROOT/pair['active']['path']).read_bytes()
    preserved=(ROOT/pair['preserved']['path']).read_bytes()
    assert active==preserved and sha(active)==pair['active']['sha256']

old_program="`ClassicalMDS(metric='precomputed')`; ordinary `MDS(metric=True/False, dissimilarity='precomputed', normalized_stress=...)` after inspecting the exact1.9.1 constructor. No raw-coordinate equality across rotations/signs; compare distances, centered Gram, stress/strain definitions and subspaces. Negative eigenvalues are reported, not silently certified as Euclidean. Dense teaching O(n²) storage/O(n³) eigenwork is bounded to tiny fixtures. Full new nonmetric scratch optimizer is not promised; ordinary route and disparity operation are taught."
new_program="`ClassicalMDS(n_components=1, metric='precomputed')` is the eigendecomposition route. Current iterative route uses `MDS(n_components=1, metric_mds=True, metric='precomputed', init='random', n_init=1, random_state=7, max_iter=300, eps=1e-6, normalized_stress=False, n_jobs=1)`; the metric comparison passes the same explicit initial coordinate array to scratch and `fit_transform(D, init=initial_coordinates)`. Separate nonmetric call changes `metric_mds=False, normalized_stress=True`; zero input dissimilarities mean missing there, not observed zero-distance duplicates. The [complete R1 contract](design-api-correction/mds-contract-amendment.md) specifies starts, raw/normalized stress, the duplicate example, optional classical initialization and compatibility. Old aliases remain supported with deprecation in1.9; no historical failure is claimed. Compare distances/Gram/stress/subspaces, not signed raw coordinates; preserve negative eigenvalue status. Dense O(n²) storage/O(n³) eigenwork remains tiny-fixture scope. Full nonmetric scratch optimizer is not promised; disparity and ordinary routes are explained."
old_research="* [ClassicalMDS API](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.ClassicalMDS.html), accessed 1.9.1, constructor/metric description. Teach its eigendecomposition route separately from iterative `MDS`. Its availability was inspected; no unsupported “introduced in version X” claim or numerical match has been executed here."
new_research="* [ClassicalMDS API](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.ClassicalMDS.html) and [MDS API](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.MDS.html), accessed 1.9.1: actual constructor, stress/initialization parameters and input/fit sections read. `ClassicalMDS(metric='precomputed')` is the separate eigendecomposition route. Iterative `metric_mds` chooses metric/nonmetric stress; `metric='precomputed'` supplies a square dissimilarity matrix. Explicit starts/restart count/seed/stress avoid changing defaults. Nonmetric zero input dissimilarities mean missing, unlike classical known duplicate distances. Current installed constructor/array-start/stress source was inspected without execution; [R1 amendment](design-api-correction/mds-contract-amendment.md) binds exact decisions and limits. Deprecated aliases still work in1.9; no old failure, fit or numerical parity is inferred."
old_drawing="Metric MDS matches numeric distances by stress; nonmetric uses ordered disparities; classical minimizes strain. One changed numeric dissimilarity and one monotone rank change make the distinction concrete. New scratch/library source follows these objects."
new_drawing="Metric MDS matches numeric distances by stress; nonmetric uses ordered disparities; classical minimizes strain. One changed numeric dissimilarity and one monotone rank change make the distinction concrete. Then draw A=0,B=0,C=2 with distinct A/B IDs: known A–B distance zero enters classical/metric routes, while the ordinary nonmetric API treats zero dissimilarities as missing. Different line treatments label those meanings, without a fitted coordinate claim. A shared explicit initial coordinate configuration precedes the metric scratch/library comparison; raw squared-distance stress and normalized Stress-1 have distinct labelled operands. The [complete current MDS contract](design-api-correction/mds-contract-amendment.md) fixes names, starts and reporting before new code."
edits=[('programs-and-practice.md','mds-api-programs-and-practice.md',old_program,new_program),('research.md','mds-api-research.md',old_research,new_research),('proposed-design.md','mds-api-proposed-design.md',old_drawing,new_drawing)]
deltas=[]
for source,target,before,after in edits:
    original=(OWNER/source).read_bytes();text=original.decode()
    assert text.count(before)==1
    successor=text.replace(before,after)
    assert successor.count(after)==1 and successor.replace(after,before).encode()==original
    destination=OWNER/target;assert not destination.exists();destination.write_bytes(successor.encode())
    deltas.append({'beforeFile':bind(OWNER/source),'afterFile':bind(destination),'before':before,'after':after,'inverseExact':True})
(HERE/'source-delta.json').write_text(json.dumps({'scope':'R1 current MDS design contract only','deltas':deltas},indent=2)+'\n')
mds_path=ROOT/'scratch/survival-tools/Lib/site-packages/sklearn/manifold/_mds.py'
tree=ast.parse(mds_path.read_text(encoding='utf-8'))
constructor=next(n for c in tree.body if isinstance(c,ast.ClassDef) and c.name=='MDS' for n in c.body if isinstance(n,ast.FunctionDef) and n.name=='__init__')
names=[arg.arg for arg in constructor.args.kwonlyargs]
assert all(name in names for name in ['metric_mds','metric','init','n_init','random_state','normalized_stress'])
version_source=ROOT/'scratch/survival-tools/Lib/site-packages/sklearn/__init__.py'
versions=ast.parse(version_source.read_text(encoding='utf-8'))
version=next(n.value.value for n in versions.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='__version__' for t in n.targets))
assert version=='1.9.1'
check={'status':'PASS','scope':'stdlib exact original identities/byte pairs, reversible three textual replacements and installed-source AST constructor inspection; no imports/fits','proposalGuards':len(review['completeProposedFiles']),'protectedPairs':len(review['protectedPairs']),'inverseExact':True,'sourceEvidence':[bind(mds_path),bind(version_source)],'installedVersion':version,'constructorKeywords':names,'scientificProgramsRun':0,'oldMainsOrCheckersRun':0,'browserOrBuildRun':0,'effectiveComposition':[bind(OWNER/'assessment-and-continuity.md')]+[delta['afterFile'] for delta in deltas]+[bind(HERE/'mds-contract-amendment.md')]}
(HERE/'source-check.json').write_text(json.dumps(check,indent=2)+'\n')
packet={'status':'AUTHOR_READY_R1_MDS_DESIGN_SAME_CLOSURE_REQUIRED','topic':'t-sne-umap-manifold-learning','modulePosition':17,'originalAuthor':'/root/clustering_evaluation_author','sameReviewer':'/root/survival_content_independent_review','scope':'Complete inherited proposed design + current MDS API contract; no content/runtime release','predecessor':bind(OWNER/'proposed-design-packet.json'),'differentReview':[bind(OWNER/'independent-design-review/review.md'),bind(OWNER/'independent-design-review/packet.json')],'effectiveComposition':check['effectiveComposition'],'correction':[bind(HERE/'source-delta.json'),bind(HERE/'source-check.json'),bind(HERE/'compose.py')],'inheritedConservation':'12 proposal originals, all40 topic active/preserved source pairs, five original program/stream pairs, selected historical row and actual saved scientific outcomes remain exact; no old scientific replay','currentAPIEvidence':['https://scikit-learn.org/stable/modules/generated/sklearn.manifold.MDS.html','https://scikit-learn.org/stable/modules/generated/sklearn.manifold.ClassicalMDS.html'],'limits':['Source/AST-only current-contract check, no estimator fit or old main/study/checker.','New full programs/manuscript/runtime remain uncreated until Root design release and subsequent phases.','Whole DIFFERENT design assessment inherited; author correction is not independent closure.'],'next':'Root routes one R1 successor to SAME reviewer; Root alone releases design.'}
target=HERE/'author-ready-packet.json';assert not target.exists();target.write_text(json.dumps(packet,indent=2)+'\n')
print(json.dumps({'guards':check['proposalGuards'],'protectedPairs':check['protectedPairs'],'inverseExact':True,'packet':bind(target)}))
