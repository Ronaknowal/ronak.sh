import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const b='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const successor=`${b}/runtime-training-correction/inputs.json`, closure=`${b}/runtime-review-training/closure-inputs.json`;
assert.equal(sha(successor),'21fe8fc726c081844e188d6fa1c27d20e2e1c78491e9934552b20dfbe0c89e8e');
assert.equal(sha(closure),'d7def414d966f1b12d21657fa0bb3431de5157886a64b9cb450e5e94ba916452');
assert.equal(read(closure).status,'same-reviewer-accepted');
assert.equal(read(closure).effectiveSuccessorSha256,sha(successor));
const files={};
for(const p of [successor,closure]){
 for(const [f,h]of Object.entries(read(p).files)){assert.equal(sha(f),h,f);files[f]=h;}
 files[p]=sha(p);
}
const review=`${b}/runtime-review-training/closure.md`, manuscript=`${b}/lesson.jsx`;
assert.equal(sha(manuscript),'d31e1929f32ef0204bcc9b72c054f20b0a401d503b8ec6aa7b79f80d182912ee');
const published=fs.readFileSync(manuscript,'utf8').replaceAll('../../../../src/learn/','../../');
files['scripts/accept-constrained-runtime-root.mjs']=sha('scripts/accept-constrained-runtime-root.mjs');
fs.writeFileSync(`${b}/runtime-acceptance.json`,JSON.stringify({accepted:true,topicId:'structured-output-constrained-decoding-outlines-xgrammar',author:'/root',reviewer:'/root/training_author',status:'private-runtime-accepted-production-pending',manuscript,review,authorReview:`${b}/runtime-author-review.md`,files,publishedSha256:createHash('sha256').update(published).digest('hex'),figures:'[data-cd-figure]',count:27,assets:'public/learn/examples/constrained-decoding',assetRoots:['public/learn/examples/constrained-decoding'],qualification:'Root consumed entire original different review and SAME closure. Different whole source/paint assessment and its bounded corrections compose original author evidence; all scientific/access/native-observation qualifications remain. Normal integration is separate.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({accepted:true,bindings:Object.keys(files).length,acceptanceSha256:sha(`${b}/runtime-acceptance.json`)}));
