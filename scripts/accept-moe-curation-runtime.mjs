import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='docs/teaching/llm-architecture-training';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
const specs=[
 {id:'moe-training-expert-load-balancing',ready:'runtime-author-ready-successor.json',readySha:'5507f79e99594f16c0a6a141576386b7458be543aab17ec64bc2aa13f5a99066',review:'runtime-review-closure.md',extra:['runtime-review.md','runtime-root-probes.json','browser-root-closure/report.json'],figures:'[data-moe-figure]',count:21,assets:'learn-code/moe-training'},
 {id:'data-curation-pipelines-curator-models-quality-filtering',ready:'runtime-successor.json',readySha:'9cdac9c45554b89bb778e621d2999f65697b8ee5824ac88fff2ffb0a44f20cde',review:'runtime-review-successor.md',receipt:'runtime-review-successor.json',receiptSha:'44dc4613dfc24070c23a189ec888b2d6bfdaabffb411749a2b7a969544c2a7ed',extra:['runtime-review.md'],figures:'[data-curation-figure]',count:21,assets:'learn-code/data-curation-pipelines'}
];
for(const spec of specs){
 const folder=`${root}/${spec.id}`,readyPath=`${folder}/${spec.ready}`;
 assert.equal(sha(readyPath),spec.readySha);const ready=JSON.parse(fs.readFileSync(readyPath));
 assert.equal(ledger.topics[spec.id].content.status,'complete');
 const runtime=ready.files || ready.bindings;assert.ok(runtime && Object.keys(runtime).length>=100);
 const files={...ledger.topics[spec.id].content.files,...ready.contentBindings,...runtime};
 if(spec.receipt){const p=`${folder}/${spec.receipt}`;assert.equal(sha(p),spec.receiptSha);Object.assign(files,JSON.parse(fs.readFileSync(p)).bindings);files[p]=sha(p);}
 for(const[p,h]of Object.entries(files))assert.equal(sha(p),h,p);
 for(const name of [spec.ready,spec.review,...spec.extra])files[`${folder}/${name}`]=sha(`${folder}/${name}`);
 if(spec.id.startsWith('moe-'))for(const name of fs.readdirSync(`${folder}/browser-root-closure`)){const p=`${folder}/browser-root-closure/${name}`;files[p]=sha(p);}
 for(const p of ['src/learn/components/lesson-labs/LessonFlow.jsx','src/learn/components/lesson-labs/lesson-flow.css','src/learn/components/lesson-labs/LessonElements.jsx','src/learn/components/content/RemoteCodeBlock.jsx','src/learn/components/content/Headings.jsx','src/learn/components/content/Math.jsx','scripts/accept-moe-curation-runtime.mjs'])files[p]=sha(p);
 if(fs.existsSync(`${folder}/runtime-acceptance.json`)){
  const scope=JSON.parse(fs.readFileSync(`${root}/pretraining-alignment-scope.json`));const original=scope.topics.find(t=>t.id===spec.id);
  assert.equal(sha(original.source),original.originalSha256,'Cannot replace an already published acceptance');
  fs.copyFileSync(`${folder}/runtime-acceptance.json`,`${folder}/runtime-acceptance-preflight.json`,fs.constants.COPYFILE_EXCL);
 }
 fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,reviewer:'root',topic:spec.id,phase:'ready-for-production-integration',manuscript:`${folder}/lesson.jsx`,figures:spec.figures,count:spec.count,assets:spec.assets,review:`${folder}/${spec.review}`,files},null,2)+'\n');
 console.log(JSON.stringify({id:spec.id,bindings:Object.keys(files).length}));
}
