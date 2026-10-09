import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
const id='p-tuning-soft-prompt-methods', folder=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=`${folder}/runtime-review-correction-inputs.json`;
assert.equal(sha(packet),'169b921976e919f60c413f2150db883ae76c15b5675e8666f2d6f7a110ed356b');
const correction=JSON.parse(fs.readFileSync(packet));
assert.equal(sha(`${folder}/runtime-inputs.json`),'ba843a71255e56953c563f6cdd32b7fbf5940784460dccab4cf31ef916bf53f8');
const original=JSON.parse(fs.readFileSync(`${folder}/runtime-inputs.json`));
assert.equal(Object.keys(original.files).length,737);
for(const[p,h]of Object.entries(original.files))assert.equal(sha(correction.original_resolution[p]),h,p);
for(const[p,h]of Object.entries(correction.files))assert.equal(sha(p),h,p);
assert.equal(correction.science_replayed,false);
assert.equal(correction.changed.length,2);
function outside(file,name){
 const s=fs.readFileSync(file,'utf8'), ast=parse(s,{sourceType:'module',plugins:['jsx']});
 const n=ast.program.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name===name).declaration;
 return s.slice(0,n.start)+s.slice(n.end);
}
for(const[name,fn]of [['SoftPromptEvidence.jsx','SoftCache'],['SoftPromptFoundations.jsx','SoftVectors']]){
 const current=`src/learn/components/lesson-labs/${name}`, predecessor=`${folder}/runtime-review-predecessor/${name}`;
 assert.equal(outside(current,fn),outside(predecessor,fn),name);
}
const content=JSON.parse(fs.readFileSync(`${folder}/content-inputs.json`)).inputs;
assert.equal(Object.keys(content).length,250);
for(const[p,h]of Object.entries(content))assert.equal(sha(p),h,p);
const browser=JSON.parse(fs.readFileSync(`${folder}/review-correction-evidence/browser-report-1791421161445.json`));
assert.equal(browser.status,'passed');assert.equal(browser.captures.length,18);
assert.deepEqual(browser.before,browser.after);assert.deepEqual(browser.errors,[]);
const cells=JSON.parse(fs.readFileSync(`${folder}/review-correction-evidence/cache-cell-checks.json`));
assert.equal(cells.status,'passed');assert.equal(cells.cases.length,6);
for(const c of cells.cases){
 assert.equal(c.cells.length,39+c.step*(c.wrong?9:1));
 for(const [i,r] of c.cells.entries()){assert.equal(r.x,12+12*i);assert.equal(r.width,10);}
 assert.equal(c.cells.filter(r=>r.group==='virtual prefix').length,8);
 assert.equal(c.cells.filter(r=>r.group==='real prefill').length,31);
 assert.equal(c.cells.filter(r=>r.group==='newly evaluated').length,c.step);
 assert.equal(c.cells.filter(r=>r.group.startsWith('repeated')).length,c.wrong?8*c.step:0);
}
const prior=JSON.parse(fs.readFileSync(`${folder}/runtime-root-checks.json`));assert.equal(prior.conditions,1129);
const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
assert.equal(ledger.topics[id].content.status,'complete');
const files={...correction.files,...ledger.topics[id].content.files,[packet]:sha(packet)};
for(const p of ['runtime-review-correction-closure.md','runtime-review-packet.json'])files[`${folder}/${p}`]=sha(`${folder}/${p}`);
files['scripts/accept-soft-prompt-runtime.mjs']=sha('scripts/accept-soft-prompt-runtime.mjs');
for(const[p,h]of Object.entries(files))assert.equal(sha(p),h,p);
fs.writeFileSync(`${folder}/runtime-acceptance.json`,JSON.stringify({at:new Date().toISOString(),accepted:true,
 reviewer:'root; different whole runtime review and same-reviewer R1/R2 closure',topic:id,
 phase:'ready-for-production-integration',manuscript:`${folder}/lesson.jsx`,
 figures:'[data-soft-figure]',count:26,assets:'learn-code/p-tuning',files,
 review:`${folder}/runtime-review.md`,closure:`${folder}/runtime-review-correction-closure.md`,
 personallyReadSuccessorPaint:browser.captures.map(p=>({path:`${folder}/review-correction-evidence/${p}`,sha256:sha(`${folder}/review-correction-evidence/${p}`)})),
 limits:'Whole1129-condition review and34 atlases compose with bounded two-function closure and all18 successor captures. All science conserved. Native ZIP saving remains unverified; exact GET/MIME/83-member and11 native individual Python saves passed. Normal integration remains.'},null,2)+'\n',{flag:'wx'});
console.log(`P-Tuning accepted: ${Object.keys(files).length} guarded files; all737 originals and250 content inputs conserved through exactly two presentation replacements.`);
