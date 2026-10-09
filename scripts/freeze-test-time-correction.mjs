import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='docs/teaching/llm-architecture-training/test-time-compute-scaling';
const dir=`${base}/runtime-correction`;
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const old=JSON.parse(fs.readFileSync(`${base}/runtime-inputs.json`));
const predecessors=JSON.parse(fs.readFileSync(`${dir}/predecessors.json`));
const files={},relocations=[];
for(const [file,hash] of Object.entries(old.files)) {
 if(sha(file)===hash) files[file]=hash;
 else {const prior=predecessors[file];assert.ok(prior,file);assert.equal(sha(prior.path),hash,file);files[prior.path]=hash;files[file]=sha(file);relocations.push({original:file,preserved:prior.path,sha256:hash,currentSha256:files[file]});}
}
function include(path) {if(fs.statSync(path).isDirectory()) for(const item of fs.readdirSync(path))include(`${path}/${item}`);else files[path]=sha(path);}
include(dir);
for(const file of [`${base}/runtime-inputs.json`,`${base}/runtime-review-alignment.md`,`${base}/runtime-review-alignment/inputs.json`,'scripts/correct-test-time-runtime.mjs','scripts/verify-test-time-correction.cjs','scripts/freeze-test-time-correction.mjs'])files[file]=sha(file);
for(const file of ['browser/report.json','browser-frontier/report.json'])assert.equal(JSON.parse(fs.readFileSync(`${dir}/${file}`)).passed,true);
fs.writeFileSync(`${dir}/inputs.json`,JSON.stringify({...old,status:'same-reviewer-correction-ready',files,relocations,corrections:{R1:'Unscored and excluded labels stay full contrast; marks encode state.',R2:'Actual current frontier drawn as white corner marks and named in status. First fixed-reference attempt was visibly too close to A score; its source and captures remain preserved.',R3:'Seven authored modules formatted, with equivalent compiled AST after concatenating adjacent React text children.',R4:'Topic-local compass auto-fit. Shared CSS untouched.'},evidence:'Original whole review remains. 58 bounded correction conditions/21 captures plus67 final-frontier conditions/13 captures. Root personally read initial desktop D09 and D11 and enlarged compass; reviewer to read final changed composition. Scientific and delivery observations unchanged.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(files).length,relocations:relocations.length,sha256:sha(`${dir}/inputs.json`)}));
