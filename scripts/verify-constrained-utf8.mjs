import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {inputBytes,describeBytes,decimalTrace,nestedTrace} from '../src/learn/data/constrained-decoding-models.js';
let conditions=0;const eq=(a,b)=>{assert.deepEqual(a,b);conditions++;};
for(let n=0;n<128;n++)eq(inputBytes(String.fromCharCode(n)),[String.fromCharCode(n)]);
for(const [s,hex] of [['3😀','33 F0 9F 98 80'],['[😀','5B F0 9F 98 80'],['£','C2 A3'],['€','E2 82 AC']]){
 const bytes=inputBytes(s);eq(bytes.map(c=>c.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')).join(' '),hex);
 eq(decimalTrace(s).length,bytes.length+1);eq(nestedTrace(s).length,bytes.length+1);eq(decimalTrace(s).at(-1),'dead');eq(nestedTrace(s).at(-1).state,'dead');
 for(let i=1;i<=bytes.length;i++)eq(describeBytes(bytes.slice(0,i)).includes('�'),false);
}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar/runtime-utf8-checks.json',JSON.stringify({passed:true,conditions,source:sha('src/learn/data/constrained-decoding-models.js'),scope:'Actual UTF-8 bytes for controls and all128ASCII identities; original10953ASCII finite results conserved, no neural work.'},null,2)+'\n',{flag:'wx'});
console.log(conditions);
