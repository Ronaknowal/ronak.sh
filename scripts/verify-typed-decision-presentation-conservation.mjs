import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from '@babel/parser';
const topic='docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const preserved=read(`${topic}/runtime-author-predecessor/inputs.json`);
for(const row of preserved) assert.equal(sha(row.preserved),row.sha256);
const allowed={Shared:['Check','Select'],Foundations:['DecisionMasks','DecisionSoftmax'],Probability:['DecisionProperScore','DecisionEstimatorEvidence','DecisionRecipeGraph'],Study:['DecisionCalibrationEvidence'],Native:['DecisionShiftEvidence']};
const changes={};
function clean(value) {
  if(Array.isArray(value)) return value.map(clean);
  if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).filter(([key])=>!['start','end','loc','extra','leadingComments','trailingComments','innerComments'].includes(key)).map(([key,v])=>[key,clean(v)]));
  return value;
}
for(const [part,names] of Object.entries(allowed)) {
  const current=`src/learn/components/lesson-labs/TypedDecision${part}.jsx`;
  const previous=`${topic}/runtime-author-predecessor/TypedDecision${part}.jsx`;
  const blocks=p=>parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']}).program.body;
  const a=blocks(previous),b=blocks(current);assert.equal(a.length,b.length);
  changes[part]=[];
  for(let i=0;i<a.length;i++) {
    const name=(a[i].declaration||a[i]).id?.name;
    if(JSON.stringify(clean(a[i]))!==JSON.stringify(clean(b[i]))) {
      assert.ok(names.includes(name),`${part}: unexpected changed declaration ${name}`);changes[part].push(name);
    }
  }
  assert.deepEqual(changes[part].sort(),names.sort());
}
const css='src/learn/components/lesson-labs/typed-decision-flow.css';
const beforeOpening=`${topic}/runtime-author-predecessor/typed-decision-flow.before-opening.css`;
const opening='.reader-content:has(.typed-flow) .lesson-compass .lesson-compass__sections {\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22em), 1fr));\n}\n';
assert.equal(fs.readFileSync(css,'utf8').replaceAll('\r\n','\n').replace(opening,''),fs.readFileSync(beforeOpening,'utf8').replaceAll('\r\n','\n'));
const main=read(`${topic}/browser-evidence/report-1791437452730.json`);
const mappings=Object.fromEntries(preserved.map(r=>[r.path,r.preserved]));
for(const [p,h] of Object.entries(main.after)) assert.equal(sha(mappings[p]||p),h,`main browser source ${p}`);
const closure=read(`${topic}/browser-evidence/closure-1791440291278.json`);
for(const [p,h] of Object.entries(closure.after)) assert.equal(sha(p===css?beforeOpening:p),h,`closure browser source ${p}`);
const content=read(`${topic}/content-review-acceptance.json`);
for(const [p,h] of Object.entries(content.files)) assert.equal(sha(p),h);
const report={status:'passed',scope:'Only declared presentation functions changed after whole browser campaign; every other top-level AST block is identical. Final CSS successor only changes opening section columns. No scientific execution.',changes,acceptedContentGuards:Object.keys(content.files).length,mainSourceGuards:Object.keys(main.after).length,closureSourceGuards:Object.keys(closure.after).length,preservedGuards:preserved.length,files:Object.fromEntries([...preserved.flatMap(r=>[r.path,r.preserved]),beforeOpening,'scripts/verify-typed-decision-presentation-conservation.mjs'].map(p=>[p,sha(p)]))};
fs.writeFileSync(`${topic}/runtime-presentation-conservation.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,changes,acceptedContentGuards:report.acceptedContentGuards}));
