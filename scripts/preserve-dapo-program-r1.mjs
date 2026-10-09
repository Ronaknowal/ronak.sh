import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const folder='docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packet=JSON.parse(fs.readFileSync(`${folder}/program-inputs.json`));
const archive=`${folder}/program-r1-predecessor`;fs.mkdirSync(archive,{recursive:false});
const retained={};
for(const[p,h]of Object.entries(packet.files)){
 if(sha(p)!==h)throw Error(p);
 const destination=`${archive}/${p}`;fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(p,destination);retained[destination]=sha(destination);
}
for(const name of ['program-inputs.json','program-review.md','program-review-inputs.json','program-review-checks.json']){
 const to=`${archive}/${name}`;fs.copyFileSync(`${folder}/${name}`,to);retained[to]=sha(to);
}
fs.writeFileSync(`${archive}/retained.json`,JSON.stringify(retained,null,2)+'\n');
fs.copyFileSync('public/learn/examples/rlvr/scientific_journal.py','public/learn-code/dapo/scientific_journal.py');
console.log({retained:Object.keys(retained).length,journal:sha('public/learn-code/dapo/scientific_journal.py')});
