// Root's one-shot whole-design release. No learner, scientific or runtime mutation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const owner = path.relative(root, __dirname).replaceAll('\\', '/');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const describe = p => { const b = fs.readFileSync(path.join(root, p)); return {path:p,bytes:b.length,sha256:hash(b)}; };
const guarded = new Map();
function guard(d) {
  const a = describe(d.path);
  if (a.sha256 !== d.sha256 || a.bytes !== d.bytes) throw Error('Changed selected input: '+d.path);
  if (guarded.has(a.path) && guarded.get(a.path).sha256 !== a.sha256) throw Error('Conflicting selected role');
  guarded.set(a.path,a); return a;
}
function read(p, expected) {
  const d = describe(p); if (expected && d.sha256 !== expected) throw Error('Changed review '+p);
  guard(d); return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
}
function descriptors(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.path === 'string' && typeof value.bytes === 'number' && /^[a-f0-9]{64}$/.test(value.sha256||'')) guard(value);
  else Object.values(value).forEach(descriptors);
}
const reviewPath = owner+'/independent-whole-design-review/packet.json';
const review = read(reviewPath,'527a2939fb99566d06539456dd7da47de406ba11e4327a21013a57c7d15a5972');
if (review.status !== 'ACCEPT_CORRECTED_WHOLE_PROPOSED_DESIGN_WITH_CURRENT_PREREQUISITE_DISPOSITIONS' || review.findings.length || !review.checks.pass) throw Error('Design review not closed');
descriptors(review.input); descriptors(review.artifacts);
const original = read(owner+'/proposed-design-packet.json'); original.files.forEach(guard);
const pairs = original.preservedInputs.map(d => {
  guard(d); const copy = guard({...d,path:owner+'/'+d.preserved});
  if (!fs.readFileSync(path.join(root,d.path)).equals(fs.readFileSync(path.join(root,copy.path)))) throw Error('Changed original pair');
  return {original:d,copy};
});
const correction = read(owner+'/design-api-correction/author-ready-packet.json');
descriptors(correction.effectiveComposition); descriptors(correction.correction);
const delta = read(owner+'/design-api-correction/source-delta.json');
const inverses = delta.deltas.map(d => {
  guard(d.beforeFile); guard(d.afterFile);
  const after=fs.readFileSync(path.join(root,d.afterFile.path),'utf8');
  if (after.split(d.after).length!==2) throw Error('Nonunique API inverse');
  const inverse=Buffer.from(after.replace(d.after,d.before));
  if (!inverse.equals(fs.readFileSync(path.join(root,d.beforeFile.path)))) throw Error('Incomplete API inverse');
  return {before:d.beforeFile,after:d.afterFile,wholeInverseExact:true};
});
const same = read(owner+'/independent-design-review/same-api-closure/packet.json');
if (same.status!=='PASS_SAME_R1_DESIGN_CLOSURE' || same.unresolvedRequired.length || pairs.length!==40 || inverses.length!==3) throw Error('Scope changed');
const kmeansAcceptance=describe('docs/teaching/classical-ml-reading-flow/k-means-hierarchical-clustering/publication/root-normal-integration-acceptance.json'); guard(kmeansAcceptance);
const kmeansSource=describe('src/learn/data/topics/k-means-hierarchical-clustering.jsx'); guard(kmeansSource);
const kmeansText=fs.readFileSync(path.join(root,kmeansSource.path),'utf8');
if (!kmeansText.includes('id="2-make-the-geometry-explicit"') || !kmeansText.includes('id="3-make-the-geometry-match-the-question"')) throw Error('KMeans anchors changed');
const gmmAcceptance=describe('docs/teaching/classical-ml-reading-flow/gaussian-mixture-models-gmm-em-algorithm/publication/root-private-runtime-acceptance.json'); guard(gmmAcceptance);
const draftCheckpoint=describe(owner+'/content-authoring/checkpoints/draft-checkpoint.json'); guard(draftCheckpoint);
const ledgerPath='docs/teaching/lesson-delivery-progress.json';
const ledgerBefore=describe(ledgerPath), ledger=JSON.parse(fs.readFileSync(path.join(root,ledgerPath),'utf8'));
const topicId='t-sne-umap-manifold-learning', prior=ledger.topics[topicId];
const historicalRow=read(owner+'/'+original.selectedLedger.preserved);
if (prior.revision!==4 || JSON.stringify(prior)!==JSON.stringify(historicalRow)) throw Error('Selected current row changed; reconcile instead of overwriting');
const unrelated=new Map(Object.entries(ledger.topics).filter(([id])=>id!==topicId).map(([id,e])=>[id,JSON.stringify(e)]));
const at=new Date().toISOString();
const releasePath=owner+'/design-accepted-root.json', recordPath=owner+'/reading-flow-revision.md';
const release={status:'ROOT_CORRECTED_WHOLE_DESIGN_ACCEPTED_CONTENT_WRITING_RELEASED',at,topicId,revision:5,
  independentWholeReview:describe(reviewPath),effectiveDesign:review.input.effective,sourceBindings:[...guarded.values()],protectedPairs:pairs,exactApiInverses:inverses,scope:review.scope,
  rootReading:{wholeDesign:'Complete amended design and programme/practice contract, effective assessment, research and explicit MDS amendment; whole independent design report and packet; SAME API report/packet.',
    tools:['569ad3','c14a86','21b0be','a46fa1','c2491a','91e305','6a8dc5','01eb68'],
    limit:'Source/manuscript-design reading only. No rendered diagrams, participant, scientific reproduction or best-possible claim.'},
  currentPrerequisites:{kmeans:{acceptance:kmeansAcceptance,source:kmeansSource,heading:'2-make-the-geometry-explicit',oldAlias:'3-make-the-geometry-match-the-question'},gmm:{privateAcceptance:gmmAcceptance,normal:'Pending final table readability and independent normal closure; do not present private successors as a public prerequisite.'}},
  carryforwards:['D35 must say squared length-residual stress and show the explicit amendment formula, separately from classical strain and normalized Stress-1.',
    'Keep all ten saved maps/90 metrics, the real optical-digit identities and unfavorable held-out result; preserve all original programme/stream/API qualifications.',
    'Finish the existing actual draft in content-authoring rather than create another manuscript; checkpoint is incomplete, not content accepted.',
    'Full45 actionable drawings,12 local control investigations,10 complete new explained scratch/library routes,5 retained whole programme/stream pairs and19 solved tasks require whole content review before runtime.'],
  existingDraft:draftCheckpoint,contentComplete:false,runtimeReleased:false,publication:false,scientificReplay:false,userAcceptance:false,
  retainedLimits:review.notAccepted,record:recordPath};
const record='# t-SNE, UMAP & Manifold Learning: current reading-flow revision\n\nRevision5 is in complete content preparation after Root acceptance of the entire corrected13-section design,45 mechanism jobs,12 live investigations,10 planned new complete programmes,5 retained programme/stream pairs and19 solved task contracts. [Root release](design-accepted-root.json) composes the DIFFERENT whole design assessment and SAME MDS API closure. This is not content completion or runtime acceptance.\n\nContinue the existing `content-authoring/` draft and its exact [checkpoint](content-authoring/checkpoints/draft-checkpoint.json). Finish its45 actionable visual contracts/12 taught-control investigations, setup/file/resources index, still-missing finite prose checks and whole beginner/specialist reading. Preserve passed numerical witnesses and all original scientific streams; do not replay old fits or mains. Use the five effective documents in the release, not the superseded API predecessors.\n\nKMeans geometry now has the published `2-make-the-geometry-explicit` heading and preserved old alias. GMM private acceptance does not certify its still-pending normal tables. D35 stress is the squared residual of lengths, with the explicit amendment formula. All access, version, data, output, missing-fit and optional-source qualifications remain. A DIFFERENT entire complete-content review and Root content acceptance must precede private runtime. Root alone owns shared/public/central integration.\n';
fs.writeFileSync(path.join(root,releasePath),JSON.stringify(release,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(root,recordPath),record,{flag:'wx'});
const history=[...(prior.previousRevisions||[]),Object.fromEntries(Object.entries(prior).filter(([key])=>key!=='previousRevisions'))];
ledger.topics[topicId]={revision:5,deliveryMode:'full',record:recordPath,content:{status:'in-progress',designAcceptance:releasePath,workingCheckpoint:draftCheckpoint.path},implementation:{status:'not-started'},previousRevisions:history,nextAction:'Finish the complete existing content-authoring manuscript/specifications/explained code/solved practice and full author reading under accepted whole design; DIFFERENT whole content review and Root content release precede any runtime.'};
ledger.updatedOn=at.slice(0,10); ledger.updatedAt=at;
if (describe(ledgerPath).sha256!==ledgerBefore.sha256) throw Error('Concurrent central ledger change; no overwrite');
for (const [id,e] of unrelated) if (JSON.stringify(ledger.topics[id])!==e) throw Error('Foreign row changed');
fs.writeFileSync(path.join(root,ledgerPath),JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({status:release.status,revision:5,guards:guarded.size,pairs:pairs.length,inverses:inverses.length,unrelatedRowsPreserved:unrelated.size,release:describe(releasePath),record:describe(recordPath),ledgerBefore,ledgerAfter:describe(ledgerPath)}));
