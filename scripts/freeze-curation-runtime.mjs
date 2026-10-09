import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const folder='docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const content=JSON.parse(fs.readFileSync(`${folder}/content-acceptance.json`)).bindings;
for(const [p,h] of Object.entries(content))assert.equal(sha(p),h,`Content changed: ${p}`);
const files=[`${folder}/lesson.jsx`,`${folder}/runtime-author-review.md`,`${folder}/runtime-model-checks.json`,`${folder}/content-acceptance.json`,
 'src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','src/learn/data/curation-pipeline-models.js','src/learn/data/curation-pipeline-recorded-study.json',
 'scripts/render-curation-pipelines.mjs','scripts/verify-curation-pipeline-runtime.mjs','scripts/verify-curation-pipeline-browser.cjs','scripts/verify-curation-pipeline-paint-closure.cjs','scripts/verify-curation-pipeline-delivery.cjs','scripts/bundle-curation-pipelines.py','scripts/freeze-curation-runtime.mjs'];
const walk=d=>{for(const name of fs.readdirSync(d)){const p=`${d}/${name}`;if(fs.statSync(p).isDirectory())walk(p);else files.push(p);}};
for(const d of ['browser-author','browser-author-responsive','browser-author-corrected','browser-author-closure','browser-author-delivery'])if(fs.existsSync(`${folder}/${d}`))walk(`${folder}/${d}`);
walk('public/learn-code/data-curation-pipelines');
const payload={author:'root',status:'ready for different entire runtime review',topic:'data-curation-pipelines-curator-models-quality-filtering',contentBindings:content,files:Object.fromEntries([...new Set(files)].map(p=>[p,sha(p)])),evidenceScope:{numerical:'72 unchanged-model/data conditions; original presentation bindings explicitly superseded',responsive:'All63 original paints personally read; affected successor/detail views and three final normal bundle views personally read',delivery:'Ten actual browser groups, eight Copy/Download pairs, Retry, exact bundle bytes',fitsReplayed:0,remaining:'Different whole runtime review, root publication/build/normal delivery/loading integration'}};
fs.writeFileSync(`${folder}/runtime-inputs.json`,JSON.stringify(payload,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(payload.files).length,content:Object.keys(content).length,sha256:sha(`${folder}/runtime-inputs.json`)}));
