"""Bounded independent design identities and byte conservation; no science imports."""
from pathlib import Path
import hashlib, json, sys
sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).resolve().parent
OWNER=HERE.parent
ROOT=OWNER.parents[3]
sha=lambda b: hashlib.sha256(b).hexdigest()
def ident(p):
    b=p.read_bytes()
    return dict(path=p.relative_to(ROOT).as_posix(), bytes=len(b), sha256=sha(b))
ready=OWNER/'proposed-design-packet.json'
assert sha(ready.read_bytes())=='92aafa0d19b0a3f5fe2efd62d6b5f87f891a4e737a96c141c0dbb3dfac7c65c4'
p=json.loads(ready.read_text(encoding='utf-8'))
bindings=[]
for old in p['files']:
    current=ident(ROOT/old['path'])
    assert current==old, (old,current)
    bindings.append(current)
conservation=[]
for old in p['preservedInputs']:
    active=ident(ROOT/old['path'])
    copy=ident(OWNER/old['preserved'])
    assert active['sha256']==copy['sha256']==old['sha256']
    assert active['bytes']==copy['bytes']==old['bytes']
    conservation.append(dict(active=active,preserved=copy))
ledger=ROOT/'docs/teaching/lesson-delivery-progress.json'
text=ledger.read_text(encoding='utf-8')
key='"t-sne-umap-manifold-learning":'
start=text.index(key)+len(key)
while text[start].isspace():start+=1
_,length=json.JSONDecoder().raw_decode(text[start:])
row=text[start:start+length].encode('utf-8')
assert sha(row)==p['selectedLedger']['selectedRowSha256']
assert row==(OWNER/p['selectedLedger']['preserved']).read_bytes()
guidance=[]
for name in ['AGENTS.md','skills/lesson-authoring/SKILL.md','skills/lesson-authoring/references/topic-design.md','skills/lesson-authoring/references/review.md','skills/lesson-authoring/references/visuals-and-labs.md','skills/lesson-authoring/references/examples-and-code.md','skills/lesson-authoring/references/teaching.md','skills/lesson-authoring/references/domain-playbook.md','skills/lesson-authoring/references/practice-and-resources.md','skills/lesson-authoring/references/research-updates.md']:
    guidance.append(ident(ROOT/name))
out=dict(schemaVersion=1,topicId=p['topicId'],modulePosition=17,
    status='WITHHELD_REQUIRED_R1_DESIGN_API_CONTRACT',reviewKind='DIFFERENT_ENTIRE_PROPOSED_DESIGN',
    reviewer='/root/survival_content_independent_review',originalDesignAuthor='/root/clustering_evaluation_author',
    proposedPacket=ident(ready),review=ident(HERE/'review.md'),checker=ident(Path(__file__)),
    completeProposedFiles=bindings,protectedPairs=conservation,
    selectedLedgerRow=dict(bytes=len(row),sha256=sha(row),unchanged=True),guidance=guidance,
    readScope=dict(entire=['assessment-and-continuity.md','research.md','proposed-design.md','programs-and-practice.md','all eight other bound proposal files','current canonical lesson','five retained full learner programs'],
       complementary='Current official MDS/ClassicalMDS API and UMAP transform source, retained model/data/source roles and meaningful old coverage; no scientific replay',
       partialHistorical='Figure/lab/spec migration and headings, scientific/technical receipts; not all obsolete history or historical browser pixels'),
    requiredFindings=[dict(id='R1',severity='P2',location='programs-and-practice.md:27',issue='Deprecated MDS metric boolean/dissimilarity contract instead of current metric_mds and distance metric',
       fix="MDS(metric_mds=..., metric='precomputed', normalized_stress=...), explicit meaningful init/n_init/seed/stress convention and nonmetric zero-as-missing boundary; preserve historical outputs",
       evidence=['https://scikit-learn.org/stable/modules/generated/sklearn.manifold.MDS.html','https://scikit-learn.org/stable/modules/generated/sklearn.manifold.ClassicalMDS.html'])],
    otherRequiredFindings=[],execution=dict(scope='stdlib current identities and protected byte pairs only',scientificProgramsRun=False,arithmeticRun=False,browserRun=False,buildRun=False),
    failedObservations=['A PowerShell rg brace expansion was rejected by its parser; corrected explicit paths were read','Some combined read outputs were truncated; all current proposal documents and current canonical manuscript were consumed in complete bounded reads separately'],
    primarySourceObservation=dict(date='2026-10-08',mdsHeader='1.9.1',umapSourceHeader='0.5.8',scope='Exact parameter names/deprecations and cached-return versus novel-data densMAP transform; no fitted execution'),
    retainedAuthorLimits=p['reviewLimits'],limits=['Design only; no unwritten manuscript acceptance','No rendered paper/native/historical capture or observed-learner claim','No broad 2026 research census or new scientific result','No phase promotion or learner/shared/public/central writes'],
    nextAction='Original author one bounded R1 proposal correction, then SAME reviewer closure composing this entire review; Root alone releases design')
destination=HERE/'packet.json'
with destination.open('x',encoding='utf-8',newline='\n') as f:f.write(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(packet=ident(destination),review=ident(HERE/'review.md'),proposedFiles=len(bindings),protectedPairs=len(conservation),selectedRowUnchanged=True),indent=2))
