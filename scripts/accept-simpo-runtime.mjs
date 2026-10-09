import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
const id='simpo-simple-preference-optimization';
const folder=`docs/teaching/llm-architecture-training/${id}`;
const successor=`${folder}/review-successor`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=`${successor}/inputs.json`;
assert.equal(sha(packet),'8729b0f678c19561f7ba882e7b5da56f7ff371e151b11558d922eda67f604265');
const changed='src/learn/components/lesson-labs/SimPOFlow.jsx';
const original=JSON.parse(fs.readFileSync(`${folder}/runtime-inputs.json`));
const correction=JSON.parse(fs.readFileSync(packet));
const files=Object.fromEntries(original.files.map(r=>[r.path,r.sha256]));
assert.equal(sha(`${successor}/SimPOFlow.before.jsx`),files[changed]);
function outside(p){const s=fs.readFileSync(p,'utf8');const ast=parse(s,{sourceType:'module',plugins:['jsx']});const n=ast.program.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name==='TargetMasks').declaration;return s.slice(0,n.start)+s.slice(n.end);}
assert.equal(outside(changed),outside(`${successor}/SimPOFlow.before.jsx`));
for(const[p,h]of Object.entries(files))if(p!==changed)assert.equal(sha(p),h,p);
Object.assign(files,correction.inputs,{[packet]:sha(packet)});
for(const p of ['runtime-root-checks.json','runtime-review.md','runtime-review-packet.json','review-successor/independent-closure.md'])files[`${folder}/${p}`]=sha(`${folder}/${p}`);
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
assert.equal(ledger.topics[id].content.status,'complete');
Object.assign(files,ledger.topics[id].content.files);
for(const[p,h]of Object.entries(files))assert.equal(sha(p),h,p);
const browser=JSON.parse(fs.readFileSync(`${successor}/browser/report.json`));
assert.equal(browser.status,'passed');assert.equal(browser.checks.length,73);assert.equal(browser.images.length,9);
const previous=JSON.parse(fs.readFileSync(`${folder}/runtime-root-checks.json`));
assert.equal(previous.conditions,1154);assert.equal(previous.personallyReadPaint.length,80);
fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,
  reviewer:'root; different whole review and same-reviewer R1 closure',phase:'ready-for-production-integration',
  topic:id,manuscript:`${folder}/lesson.jsx`,figures:'[data-simpo-figure]',count:27,assets:'learn/examples/simpo',files,
  review:`${folder}/runtime-review.md`,closure:`${successor}/independent-closure.md`,
  limits:'Whole review composed with bounded D04 correction. All scientific evidence conserved. Native ZIP cancellation remains qualified; exact HTTP and individual downloads passed. Root personally read 80 prior and all6 successor atlases. Normal integration remains.'},null,2)+'\n',{flag:'wx'});
console.log(`SimPO accepted for production integration: ${Object.keys(files).length} bindings.`);
