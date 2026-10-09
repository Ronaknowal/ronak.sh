import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as m from '../src/learn/data/constrained-decoding-models.js';
const checks=[],eq=(name,a,b)=>{assert.deepEqual(a,b,name);checks.push(name);};
function strings(alphabet,max){let out=[''],level=[''];for(let n=1;n<=max;n++){level=level.flatMap(s=>alphabet.map(c=>s+c));out.push(...level);}return out;}
for(const s of strings(['0','3','.','x'],5)){
 const state=m.decimalTrace(s).at(-1);
 eq('decimal acceptance '+s,m.accepting(state),/^[0-9]+(?:\.[0-9]+)?$/.test(s));
 eq('decimal viability '+s,state!=='dead',/^([0-9]+(\.[0-9]*)?)?$/.test(s));
 for(let id=0;id<5;id++)eq('token '+s+'/'+id,m.tokenTrace(s,id).allowed,id===4?/^[0-9]+(?:\.[0-9]+)?$/.test(s):/^([0-9]+(\.[0-9]*)?)?$/.test(s+m.tokens[id]));
}
for(const s of strings(['[',']','1',','],5)){
 let valid=false;try{const v=JSON.parse(s);const fits=x=>Number.isInteger(x)&&x>=0&&x<=9||Array.isArray(x)&&x.length>0&&x.every(fits);valid=fits(v);}catch{}
 eq('nested full '+s,m.nestedTrace(s).at(-1).state==='complete',valid);
}
eq('depth guard',m.nestedTrace('['.repeat(9)).at(-1).error,'Depth guard reached');
eq('initial grammar mass',m.masked('').q,[0,2/3,1/3,0,0]);
eq('accepting grammar mass',m.masked('3').q,[0,4/7,2/7,0,1/7]);
eq('topk first empties',m.masked('',1,false).total,0);
eq('grammar first remains',m.masked('',1,true).q,[0,1,0,0,0]);
eq('no topk difference',m.masked('',5,true),m.masked('',5,false));
for(const a of [0,.1,.5,1])for(const b of [0,.1,.5,1]){const f=m.futureMass(a,b);eq('local conserved',f.local[0]+f.local[1]+f.failed,1);if(f.global)assert.ok(Math.abs(f.global[0]+f.global[1]-1)<1e-12);}
eq('UTF8 split',m.utf8Literal('E2').viable,true);eq('UTF8 complete',m.utf8Literal('E2 82 AC').complete,true);eq('wrong UTF8',m.utf8Literal('E2 41').wrong,1);
eq('complete withoutEOS',m.stopFixture('number',1).text,'42');eq('no EOS at cap1',m.stopFixture('number',1).eos,false);eq('partial bytes preserved',m.stopFixture('euro',1).raw,'E2');eq('no replacement character',m.stopFixture('euro',1).text,null);eq('canceled partial',m.stopFixture('euro',1,true).status,'canceled');
eq('serial vs overlap',m.overlap(8,3),{serial:12,overlapped:9});eq('zero overlap',m.overlap(0,0),{serial:1,overlapped:1});eq('no crossover',m.compileCost(12,0).cross,null);assert.ok(Math.abs(m.compileCost(12,.1).cross-108/11)<1e-10);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar/runtime-model-checks.json',JSON.stringify({passed:true,conditions:checks.length,source:sha('src/learn/data/constrained-decoding-models.js'),scope:'Finite independently enumerated languages, probability boundaries and deterministic work only; no neural or native scientific replay.'},null,2)+'\n');
console.log(checks.length);
