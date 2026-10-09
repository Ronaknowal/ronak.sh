import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const b='docs/teaching/llm-architecture-training/speculative-decoding';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const input=`${b}/runtime-inputs.json`;
assert.equal(sha(input),'91a79c9943789f2b27eb88dceefdfd8761dd0085687f5084e7a5b8c4f3805f80');
const packet=JSON.parse(fs.readFileSync(input)),files={};
for(const row of packet.files){assert.equal(sha(row.path),row.sha256,row.path);files[row.path]=row.sha256;}
const review=`${b}/runtime-review-root.md`,manuscript=`${b}/lesson.jsx`;
for(const p of [input,review,`${b}/runtime-review-root-checks.json`,`${b}/runtime-review-root-paint.json`,'scripts/review-speculative-runtime-root.mjs','scripts/accept-speculative-runtime-root.mjs'])files[p]=sha(p);
const mapped=fs.readFileSync(manuscript,'utf8').replaceAll('../../../../src/learn/','../../');
fs.writeFileSync(`${b}/runtime-acceptance.json`,JSON.stringify({accepted:true,topicId:'speculative-decoding',author:'/root/alignment_author',reviewer:'/root',status:'private-runtime-accepted-production-pending',manuscript,review,authorReview:`${b}/runtime-author-review.md`,files,publishedSha256:createHash('sha256').update(mapped).digest('hex'),figures:'[data-speculative-figure]',count:36,assets:'public/learn-code/speculative-decoding',assetRoots:['public/learn-code/speculative-decoding','public/learn-assets/speculative-decoding'],qualification:'Complete independent source/learning review and personally read exact paint selection; attributed broader author evidence. No scientific replay. Normal integration separate.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({accepted:true,bindings:Object.keys(files).length,sha256:sha(`${b}/runtime-acceptance.json`)}));
