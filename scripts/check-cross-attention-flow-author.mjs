import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from '@babel/parser';
import {attention,exactFixture,pullback,crossBlock,crossBlockPullback,resizeFixture} from '../src/learn/data/cross-attention-flow-models.js';
import {savedCrossForward,erf} from '../src/learn/data/cross-attention-saved-forward.js';
import {cacheBudget,gateStep,compression} from '../src/learn/data/cross-attention-models.js';
const owner='docs/teaching/deep-learning-beginner/interleaved-cross-attention-architectures',draft='docs/teaching/drafts/interleaved-cross-attention-architectures';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),r={scope:'New pure calculations against complete explicit/native fixtures; protected evidence is checked by identity without replay.',checks:[],bindings:{}};
const check=(condition,name)=>{assert(condition,name);r.checks.push(name)};
function near(actual,expected,name,tolerance=1e-10){const flatten=x=>Array.isArray(x)?x.flat(Infinity):[x],a=flatten(actual),b=flatten(expected);check(a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<tolerance),name);}
const native=JSON.parse(fs.readFileSync(owner+'/reading-flow-native-fixtures.json','utf8')),state=JSON.parse(fs.readFileSync(draft+'/cross-11-state.json','utf8'));
for(const [index,c]of native.images.entries()){
  const out=savedCrossForward(c.raw,c.question,state);
  for(const [key,expected]of Object.entries(c.explicit))if(key!=='prediction')near(out[key],expected,`${index} complete saved ${key}`,2e-10);
  near(out.probabilities,c.native_probabilities,`${index} native float32 probabilities`,1e-5);
  near(out.shares,c.native_shares,`${index} native float32 shares`,1e-5);
  check(out.prediction===c.explicit.prediction,`${index} computed class`);
}
const p=native.projection,params=Object.fromEntries(Object.entries(p.state).map(([name,v])=>[name.replace(/_(weight|bias)$/,(_,kind)=>kind==='weight'?'Weight':'Bias'),v]));
const block=crossBlock(p.readers,p.memory,params,p.heads,p.allowed),back=crossBlockPullback(block,p.credit);
near(block.output,p.output,'complete changed three-head output');near(back.dReaders,p.back.readers,'complete raw reader credit');near(back.dMemory,p.back.memory,'sum of raw K/V memory credit');
for(const [field,value]of Object.entries(p.back.parameters)){
 const name=field.replace(/^([qkvo])_(weight|bias)$/,(_,letter,kind)=>`d${letter.toUpperCase()}${kind==='weight'?'Weight':'Bias'}`);
 near(back[name],value,`complete ${field} credit`);
}
const fixture=exactFixture(),a=attention(fixture.query,fixture.key,fixture.value,fixture.allowed),b=pullback(a,[[1,-1],[0,0]]);
near(a.output,[[1.5,1.5],[1,2.5]],'exact two-reader outputs');near(b.dValue,[[.5,-.5],[.25,-.25],[.25,-.25]],'distinct V credit');near(b.dKey,[[1,0],[-1,0],[0,0]],'third K null with active V');
fixture.allowed[0][2]=false;fixture.value[2]=[100,-100];const masked=attention(fixture.query,fixture.key,fixture.value,fixture.allowed);
near(masked.output,[[4/3,4/3],[25.5,-23]],'forbidden donor null versus permitted changed row');
fixture.allowed[0].fill(false);check(attention(fixture.query,fixture.key,fixture.value,fixture.allowed).output[0]===null,'empty legal row explicitly undefined');
fixture.value[2]=[-37.25,14.875];fixture.query[1]=[-7.125,3.75];const grown=resizeFixture(fixture,4,6);near(grown.value[2],fixture.value[2],'arbitrary V edit survives resizing');near(grown.query[1],fixture.query[1],'arbitrary Q edit survives resizing');check(grown.allowed[0][2]===false&&grown.allowed[3][5]===true,'surviving and new permission bits');near(grown.query[3],[0,0],'new request zero initialization');near(grown.value[5],[0,0],'new donor zero initialization');
check(compression().identical,'mean collision');const gate=gateStep();near([gate.alphaGradient,gate.valueGradient,gate.nextAlpha],[-4,0,.4],'zero gate nonzero gate credit');
near([gate.nextOutput,gate.nextLoss],[1.7598979245104498,.7689265787394155],'gate prose arithmetic',1e-8);
near([cacheBudget().prefix/2**20,cacheBudget().cross/2**20,cacheBudget({latents:576}).cross/2**20],[72,2,18],'actual payload examples');near(erf(1),.8427007929497149,'integral erf');
const baseline=JSON.parse(fs.readFileSync(owner+'/reading-flow-baseline.json','utf8'));
check(sha(baseline.baselinePacket.path)===baseline.baselinePacket.sha256,'exact protected64-owner baseline packet');
const originals=JSON.parse(fs.readFileSync(baseline.baselinePacket.path,'utf8'));
for(const entry of originals.files)check(sha(entry.copy)===entry.sha256,`unchanged protected copy ${entry.copy}`);
for(const entry of baseline.liveProtectedOwners){check(sha(entry.path)===entry.sha256,`protected original ${entry.path}`);}
for(const key of Object.keys(baseline).filter(key=>key!=='liveProtectedOwners')){
 if(!Array.isArray(baseline[key]))continue;
 for(const entry of baseline[key])if(entry.path&&entry.sha256)check(sha(entry.path)===entry.sha256,`protected copy ${entry.path}`);
}
for(const file of fs.readdirSync('src/learn/components/lesson-labs').filter(n=>n.startsWith('CrossAttentionFlow')&&n.endsWith('.jsx'))){const p='src/learn/components/lesson-labs/'+file;parse(fs.readFileSync(p,'utf8'),{sourceType:'module',plugins:['jsx']});r.bindings[p]=sha(p);}
for(const p of ['src/learn/data/cross-attention-flow-models.js','src/learn/data/cross-attention-saved-forward.js',draft+'/reading-flow-lesson.md',owner+'/reading-flow-candidate.jsx',owner+'/reading-flow-native-fixtures.json',owner+'/reading-flow-native-author.json','scripts/check-cross-attention-flow-author.mjs'])r.bindings[p]=sha(p);
r.passed=true;r.checkedAt=new Date().toISOString();fs.writeFileSync(owner+'/reading-flow-pure-author.json',JSON.stringify(r,null,2));console.log(JSON.stringify({passed:true,checks:r.checks.length,savedCases:native.images.length}));
