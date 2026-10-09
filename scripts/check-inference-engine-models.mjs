import fs from 'node:fs';
import crypto from 'node:crypto';
import {qkvPermutation,reusablePrefix,composedCost,nativeRequest} from '../src/learn/data/inference-engine-models.js';
const checks=[];const check=(name,pass)=>{checks.push({name,pass});if(!pass)throw Error(name)};
for(const h of [1,2,4])for(const c of [1,2,3]){const p=qkvPermutation(h,c);check(`bijection ${h}/${c}`,new Set(p.map(x=>x.destination)).size===h*3*c);for(const x of p)check(`row ${h}/${c}/${x.source}`,x.destination===['Q','K','V'].indexOf(x.projection)*h*c+x.head*c+x.channel);}
for(let a=0;a<=10;a++)for(let b=0;b<=10;b++){const r=composedCost(a/10,b/10);check(`separate cost ${a}/${b}`,Math.abs(r.total-(2*a+8*b))<1e-12);check(`speedup ${a}/${b}`,r.total===0?r.speedup===null:Math.abs(r.speedup*r.total-100)<1e-12);}
check('prefix initial',reusablePrefix([11,12,13,14],[11,99,13,14],true)===1);check('identity mismatch',reusablePrefix([1,2],[1,2],false)===0);check('short prefix',reusablePrefix([1,2,3],[1,2],true)===2);
const data=JSON.parse(fs.readFileSync('public/learn/examples/inference-engines/evidence/observations.json'));
for(const id of ['A','B','C','D']){const r=nativeRequest(data,id);check(`native16 ${id}`,r.output_ids.length===16);check(`native terminal ${id}`,r.terminal.stop===true&&r.terminal.tokens.length===0);}
const source='src/learn/data/inference-engine-models.js';fs.writeFileSync('docs/teaching/llm-architecture-training/inference-engines-serving/runtime-native-model-checks.json',JSON.stringify({source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),checks,scope:'Finite pure runtime checks against retained native data; no scientific execution.'},null,2)+'\n');console.log(checks.length);
