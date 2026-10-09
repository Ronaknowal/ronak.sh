import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const id='rlaif-ipo-orpo-emerging-alignment-methods';
const folder=`docs/teaching/llm-architecture-training/${id}`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const oldPath=`${folder}/content-inputs.json`, newPath=`${folder}/content-successor/inputs.json`;
assert.equal(sha(oldPath),'1a55ef2ba622ffd7c8a25ef9db4649c4803522d2305ee52a72bfc36d124ff240');
assert.equal(sha(newPath),'8054f2a01f1c5a64c9b4e755057086c595eb6172a71c3e0ac17f3f7a82b08731');
const original=JSON.parse(fs.readFileSync(oldPath)), next=JSON.parse(fs.readFileSync(newPath));
const files={};
for(const[p,row]of Object.entries(next.inputs)){assert.equal(sha(p),row.sha256,p);files[p]=row.sha256;}
const changed=new Map(next.changed.map(r=>[r.path,r]));
assert.equal(changed.size,4);
let conserved=0;
for(const[p,row]of Object.entries(original.inputs)){
  const expected=typeof row==='string'?row:row.sha256;
  if(changed.has(p)){
    const predecessor=`${folder}/content-successor/predecessor/${p}`;
    assert.equal(sha(predecessor),expected,p);
    assert.equal(changed.get(p).before_sha256,expected);
    assert.equal(sha(p),changed.get(p).after_sha256);
    files[predecessor]=expected;
  }else{assert.equal(sha(p),expected,p);conserved++;}
}
assert.equal(conserved,126);
const checks=JSON.parse(fs.readFileSync(`${folder}/content-successor/checks.json`));
assert.equal(checks.status,'passed');assert.equal(checks.passed,317);assert.equal(checks.scientific_reexecution,false);
for(const p of [oldPath,newPath,`${folder}/content-review.md`,`${folder}/content-review-packet.json`,`${folder}/content-root-checks.json`,`${folder}/content-successor/independent-closure.md`])files[p]=sha(p);
const manifest=`${folder}/content-root-inputs.json`;
fs.writeFileSync(manifest,JSON.stringify({status:'accepted-different-whole-content-review-with-R1-closure',reviewer:'root',author:'multimodal_reviewer',at:new Date().toISOString(),conservedOriginalInputs:conserved,scientificReexecution:false,files},null,2)+'\n',{flag:'wx'});
execFileSync(process.execPath,['scripts/checkpoint-llm-pretraining-content.mjs',id,'lesson.md','examples/rlaif-methods',next.manuscript.sha256,manifest,sha(manifest)],{stdio:'inherit'});
