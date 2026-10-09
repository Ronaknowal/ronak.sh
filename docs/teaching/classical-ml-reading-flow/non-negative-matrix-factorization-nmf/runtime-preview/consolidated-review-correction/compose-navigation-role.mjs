import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const owner=path.dirname(fileURLToPath(import.meta.url)),root=process.cwd();
const digest=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const identity=relative=>{const raw=fs.readFileSync(path.join(root,relative));return {path:relative,bytes:raw.length,sha256:digest(raw)};};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const frozenPath=path.join(owner,'combined-author-review/author-ready-source.json');
const frozenRaw=fs.readFileSync(frozenPath),frozen=JSON.parse(frozenRaw);
assert(digest(frozenRaw)==='03620c4d159f87479c884711931ccea69309a2b9cf4fc541fae8b6e424674c56','Combined source changed');
const priorPath='docs/teaching/classical-ml-reading-flow/navigation-source-role-continuation/math-reading-time-root-acceptance.json';
const prior=JSON.parse(fs.readFileSync(path.join(root,priorPath),'utf8'));
assert(identity(priorPath).sha256==='1a8e35e672e2ab034781c765fea5b68812b3e72d70bf10c1970679809b462180','Prior role evidence changed');
const navigation=identity(prior.navigation.path);
assert(navigation.sha256===prior.navigation.sha256,'New navigation delta needs assessment');
const source=fs.readFileSync(path.join(root,navigation.path),'utf8');
const match=source.match(/export const allTopicsOrdered = (\[[^\n]*\]);/);
assert(Boolean(match),'Actual generated topic array not found');
const rows=JSON.parse(match[1]);
assert(rows.length===1461,'Topic extent changed');
const undo=structuredClone(rows);
for(const change of prior.differences){
  const row=undo.find(row=>row.id===change.topicId);
  assert(row?.[change.field]===change.after,'Expected Math reading-time field changed');
  row[change.field]=change.before;
}
const predecessor=source.replace(match[1],JSON.stringify(undo));
const originalNavigation=frozen.originalSharedBindings.find(row=>row.path===navigation.path);
assert(digest(predecessor)===originalNavigation.sha256,'The two reviewed fields do not reconstruct NMF original role');
const unchanged=frozen.originalSharedBindings.filter(row=>row.path!==navigation.path).map(row=>{
  const current=identity(row.path);assert(current.sha256===row.sha256,row.path);return current;
});
assert(unchanged.length===26,'Unexpected shared context extent');
const output=path.join(owner,'root-navigation-role-composition.json');
assert(!fs.existsSync(output),'Preserve frozen evidence');
const receipt={schema:'root-nmf-selected-navigation-role-composition/v1',at:new Date().toISOString(),owner:'/root',
  status:'SELECTED_NMF_PRIVATE_RUNTIME_CONTEXT_ACCEPTED_NO_PHASE_PROMOTION',
  selectedSourceFreeze:{path:path.relative(root,frozenPath).replaceAll('\\','/'),bytes:frozenRaw.length,sha256:digest(frozenRaw)},
  priorSevenRoleEvidence:identity(priorPath),originalNavigation,currentNavigation:navigation,
  originalNavigationReconstructedExactly:true,differences:prior.differences,orderedTopicRows:rows.length,
  unchangedSharedContext:unchanged,phaseChanges:0,centralCanonicalPublicChanges:0,scientificExecutions:0,
  scope:'Fresh current navigation identity and exact whole-source inverse show only the two reviewed unrelated Mathematics readTime fields. All ML/DL topic metadata, identities, order, dependencies, routes and non-topic exports are conserved. This separately accepts NMF context; it does not extend the earlier seven-topic receipt or certify a changed bundle/native/normal Reader.',
};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({receipt:identity(path.relative(root,output).replaceAll('\\','/')),conservedSharedFiles:unchanged.length,topicRows:rows.length,phaseChanges:0}));
