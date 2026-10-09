"""One bounded prose/specification repair; no scientific execution or reassembly."""
from pathlib import Path
import hashlib,json,datetime
root=Path.cwd(); topic=root/'docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation'
owner=topic/'content-preparation'; work=owner/'review-correction'; preserved=work/'reviewed-predecessor'
sha=lambda b:hashlib.sha256(b).hexdigest()
def bind(p,role=None):
    data=p.read_bytes(); r=dict(path=p.relative_to(root).as_posix(),bytes=len(data),sha256=sha(data))
    if role:r['role']=role
    return r
oldpacket=json.loads((owner/'whole-review-handoff.json').read_bytes())
assert oldpacket['manuscript']['sha256']=='ee185895e6290560d24e94b87fa3a62126f86d950d7761f6b84638abd8884f95'
assert sha((owner/'lesson.md').read_bytes())==oldpacket['manuscript']['sha256']
composition=json.loads((owner/'composition.json').read_bytes())
for b in composition['fileIndex']+composition['authorInputs']:
    assert sha((root/b['path']).read_bytes())==b['sha256'],b['path']
replacements=[
('F1-initial', ['lesson.md','sections/deeper.md'], 'Column medians initialize missing entries to 3 and 6, giving [3,6] for row 2 and [3,8] for row 3.', 'The observed a values [1,2,3,5] have median 2.5; observed b values [2,4,8,10] have median 6. These fill row 2 as [3,6] and row 3 as [2.5,8], giving the initialized matrix [[1,2],[2,4],[3,6],[2.5,8],[5,10]].'),
('F1-stale', ['lesson.md','sections/deeper.md'], 'Feeding stale initialized a=3 into this second regression', 'Feeding stale initialized a=2.5 into this second regression'),
('F1-hint', ['lesson.md','sections/practice.md'], 'Initialize medians [3,6]; after fitting a', 'Initialize medians [2.5,6]; after fitting a'),
('F1-D37', ['visual-specifications.md','visual-refinements.md'], '[3,6]. D38 first a regression uses observedrows0,1,2,4 and b[2,4,6,10],', '[2.5,6], from observed a[1,2,3,5] and b[2,4,8,10]. The initialized matrix is\n  [[1,2],[2,4],[3,6],[2.5,8],[5,10]]; row2 a=3 is observed. D38 first a regression uses observedrows0,1,2,4 and b[2,4,6,10],'),
('F2-radius', ['lesson.md','sections/core.md'], ' The predecessor finite two-dimensional radius formula did not establish a reachable clipping defect: its bound is √2/1.35×104≈108.95 pixels, below the 124-pixel cap. The successor specification nevertheless guarantees complete uncapped-radius geometry over its declared domain.', ' Keep the complete uncapped-radius geometry visible throughout the declared input domain.'),
('F2-category', ['lesson.md','sections/core.md'], 'Use a constructed vocabulary `red`, `green`, `blue`; these are category names, not instructions to paint the page green.', 'Use the constructed category vocabulary `red`, `green`, `blue`.'),
('F2-mixed', ['lesson.md','sections/core.md'], 'The complete P4 mixed successor supplies the previously requested indicator and robust extension.', 'The complete P4 preparation combines numeric coordinates, category coordinates and the original missing-value mask, with standard or robust scaling.'),
('F2-practice', ['lesson.md','sections/practice.md'], 'Attempt the question before opening its hint or solution. T2–T6 and T8 preserve original core practices 1–6; T10,T9,T24 preserve original deeper practices 7,8,9. T7 preserves the original indicator implementation extension with a complete supported successor. The mapping makes old practice identities explicit while the appended tasks exercise new inputs. A solution explains the tempting wrong route as well as the calculation.', 'Attempt each question before opening its hint or solution. The activity IDs T1–T26 identify tasks across the core and deeper branches. Use the fitted rules, source rows and saved state from the worked examples to reason through changed inputs. Each solution explains the tempting wrong route as well as the calculation.'),
]
names=sorted({n for _,ns,_,_ in replacements for n in ns})
preserve=names+['composition.json','whole-review-handoff.json']
for n in preserve:
    p=owner/n; q=preserved/n; assert not q.exists(); q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(p.read_bytes())
q=preserved/'reading-flow-revision.md';q.write_bytes((topic/'reading-flow-revision.md').read_bytes())
deltas=[]
for n in names:
    p=owner/n; before=p.read_bytes(); text=before.decode(); edits=[]
    for finding,ns,old,new in replacements:
        if n not in ns:continue
        assert text.count(old)==1,(n,finding,text.count(old))
        offset=len(text[:text.index(old)].encode());edits.append(dict(finding=finding,byteOffsetInSequentialState=offset,old=old,new=new))
        text=text.replace(old,new,1)
    after=text.encode();p.write_bytes(after)
    inverse=text
    for e in reversed(edits):
        assert inverse.count(e['new'])==1
        inverse=inverse.replace(e['new'],e['old'],1)
    assert inverse.encode()==before
    deltas.append(dict(path=p.relative_to(root).as_posix(),before=dict(bytes=len(before),sha256=sha(before)),after=bind(p),edits=edits,inverseRecoversExactBefore=True))
for b in composition['fileIndex']:
    assert sha((root/b['path']).read_bytes())==b['sha256']
lesson=(owner/'lesson.md').read_text(encoding='utf8')
assert 'missing row-2 b at a=3 becomes 6.0158266415' in lesson
assert '3.9652777778' in lesson and '[[1,2],[2,4],[3,6],[2.5,8],[5,10]]' in lesson
assert 'Feeding stale initialized a=3' not in lesson
for entry in composition['placement']['practice']:
    assert entry['exactOriginalBlock']
roles=json.loads((owner/'programs/source-roles.json').read_bytes())
for p in roles['programmes']:
    assert (root/p['source']['path']).read_text(encoding='utf8') in lesson
    if 'stdout'in p:assert (root/p['stdout']['path']).read_text(encoding='utf8') in lesson
result=dict(schema='feature20-bounded-F1-F2-delta/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),authorization='Root adopted independent F1 plus bounded F2; no code/source-stream change or replay',predecessorHandoff=bind(preserved/'whole-review-handoff.json'),independentWholeReview=bind(owner/'independent-content-review/whole-content-review.md'),changedSemanticFiles=deltas,preservedOriginalPractice='All nine exact retained blocks untouched: edits only outside original blocks and new T23 hint',unchangedLearnerFileBindings=len(composition['fileIndex']),unchangedWholeProgrammesAndStreams=True,deltaPolicy='Apply edits sequentially; reverse in reverse order. Every inverse byte check passed. Exact predecessor copies preserved.',execution='stdlib source/text/hash only; no scientific imports/mains/fits/build/native/browser')
(work/'exact-text-deltas.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
composition['status']='corrected-author-ready-awaiting-same-reviewer-F1-F2-closure'
composition['manuscript']=bind(owner/'lesson.md','whole manuscript; bounded F1/F2 successor to whole-reviewed predecessor')
composition['visuals']=bind(owner/'visual-specifications.md','whole specifications with corrected D37 initialization')
composition['authorInputs']=[bind(root/b['path'],b.get('role')) for b in composition['authorInputs']]
composition['boundedCorrection']=bind(work/'exact-text-deltas.json','exact reversible F1/F2 edits, unchanged 42 learner-file bindings')
(owner/'composition.json').write_text(json.dumps(composition,indent=2)+'\n',encoding='utf8')
packet=oldpacket.copy();packet['status']=composition['status'];packet['frozenAt']=result['at']
packet['manuscript']=composition['manuscript'];packet['visualSpecifications']=composition['visuals']
packet['fullBindingManifest']=bind(owner/'composition.json',oldpacket['fullBindingManifest']['role'])
packet['predecessorWholeReview']=result['independentWholeReview'];packet['preservedReviewedPredecessor']=result['predecessorHandoff']
packet['boundedCorrection']=composition['boundedCorrection']
packet['authorCorrectionReview']=bind(work/'author-correction-readback.md','actual affected-paragraph and D37/L13 correspondence readback; not a new whole review')
packet['reviewInstructions']=['SAME whole reviewer: bounded F1/F2 closure against preserved predecessor and exact reversible deltas. Read changed paragraphs and D37/L13 correspondence; verify initialization [2.5,6], unchanged observed row2 a=3 and predictions 3.9652777778/6.0158266415; verify original practice, learner files, code/streams and meaningful qualifications remain exact. No repeat entire review or numerical replay.']
(owner/'whole-review-handoff.json').write_text(json.dumps(packet,indent=2)+'\n',encoding='utf8')
record=(topic/'reading-flow-revision.md').read_text(encoding='utf8')
record+='\n## Bounded whole-review correction — 9 October 2026\n\nRoot adopted independent F1 and bounded F2. The median initialization now agrees with existing P14; code, outputs and all42 learner files remain exact. The reviewed predecessor and reversible text deltas are preserved in [correction evidence](content-preparation/review-correction/exact-text-deltas.json). Actual affected-span author rereading is recorded separately. The corrected whole packet awaits the SAME reviewer’s scoped closure; no repeated whole acceptance, runtime or phase promotion is claimed. Current successor manuscript SHA256 `'+packet['manuscript']['sha256']+'`; current compact handoff SHA256 `'+sha((owner/'whole-review-handoff.json').read_bytes())+'`. Root retains phase authority.\n'
(topic/'reading-flow-revision.md').write_text(record,encoding='utf8')
print(json.dumps(dict(packet=bind(owner/'whole-review-handoff.json'),lesson=packet['manuscript'],visuals=packet['visualSpecifications'],composition=packet['fullBindingManifest'],deltas=packet['boundedCorrection'],record=bind(topic/'reading-flow-revision.md'))))
