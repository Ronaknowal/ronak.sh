import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const b='docs/teaching/llm-architecture-training/inference-cost-economics-compute-scaling';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const acceptance=`${b}/runtime-acceptance.json`;
assert.equal(sha(acceptance),'60391524962b6ca6333d3c8b28c182319782d024c3bbb4f38a352221d004a1b9');
const packet=JSON.parse(fs.readFileSync(acceptance));
assert.equal(packet.accepted,true);
for(const[p,h]of Object.entries(packet.files))assert.equal(sha(p),h,p);
const map=`${b}/runtime-review-training/canonical-ready/import-map.json`;
assert.equal(sha(map),'1d76ca058e6736ece299899e7baefc3ac555326c0bd695dfda215c2661a728f0');
const rows=JSON.parse(fs.readFileSync(map)).mappings.filter(r=>r.destination!=='src/learn/data/topics/inference-cost-economics.jsx');
assert.equal(rows.length,7);
for(const row of rows){
  assert.ok(row.destination.startsWith('src/learn/components/lesson-labs/inference-cost/')||row.destination==='src/learn/data/inference-cost-models.js');
  assert.ok(path.resolve(row.destination).startsWith(path.resolve('src/learn')+path.sep));
  assert.equal(sha(row.prepared),row.preparedSha256);
  assert.equal(packet.files[row.prepared],row.preparedSha256);
  if(fs.existsSync(row.destination))assert.equal(sha(row.destination),row.preparedSha256,'Preserve an existing conflicting file');
}
for(const row of rows){
  fs.mkdirSync(path.dirname(row.destination),{recursive:true});
  if(!fs.existsSync(row.destination))fs.copyFileSync(row.prepared,row.destination,fs.constants.COPYFILE_EXCL);
  assert.equal(sha(row.destination),row.preparedSha256);
}
fs.writeFileSync(`${b}/runtime-review-training/canonical-ready/root-installation.json`,JSON.stringify({accepted:true,acceptance,acceptanceSha256:sha(acceptance),map,mapSha256:sha(map),rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({installed:rows.length,lesson:'Separate guarded publication remains'}));
