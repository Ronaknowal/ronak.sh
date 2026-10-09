import {binaryEntropy,gaussianRateDistortion} from './rate-distortion-models.js';
export const words=Array.from({length:8},(_,i)=>i.toString(2).padStart(3,'0'));
export const lse=values=>{const m=Math.max(...values);return m===-Infinity?m:m+Math.log(values.reduce((a,v)=>a+Math.exp(v-m),0));};
export function channelFacts(source,q,costs){const joint=q.map((r,i)=>r.map(v=>v*source[i])),output=q[0].map((_,j)=>joint.reduce((a,r)=>a+r[j],0));let information=0,distortion=0;joint.forEach((r,i)=>r.forEach((v,j)=>{if(v>0)information+=v*Math.log2(q[i][j]/output[j]);distortion+=v*costs[i][j]}));return{source,q,joint,output,information,distortion};}
// Same scalar Gibbs/marginal equations as the retained model. `fixed` deliberately
// prevents early termination for L8, while L4 caches its actual bounded history.
export function baHistory({source,costs,lambda,initial=null,iterations=120,fixed=false}){
 if(!source?.length||source.some(p=>!Number.isFinite(p)||p<0)||Math.abs(source.reduce((a,p)=>a+p,0)-1)>1e-12)throw new RangeError('Normalized finite source required.');
 const columns=costs?.[0]?.length;if(!columns||costs.length!==source.length||costs.some(r=>r.length!==columns||r.some(d=>!Number.isFinite(d)||d<0)))throw new RangeError('Finite nonnegative rectangular costs required.');
 if(!Number.isFinite(lambda)||lambda<0||!Number.isInteger(iterations)||iterations<0||iterations>500)throw new RangeError('Bounded nonnegative weight and update count required.');
 const start=initial||Array(columns).fill(1/columns);if(start.length!==columns||start.some(v=>!Number.isFinite(v)||v<0)||Math.abs(start.reduce((a,v)=>a+v,0)-1)>1e-12)throw new RangeError('Normalized starting marginal required.');
 let lr=start.map(v=>v===0?-Infinity:Math.log(v));const lp=source.map(v=>v===0?-Infinity:Math.log(v)),s=lambda*Math.LN2,trace=[];let state;
 for(let iteration=0;iteration<=iterations;iteration++){
  const logits=costs.map(row=>row.map((d,j)=>lr[j]-s*d)),normalizers=logits.map(lse),logq=logits.map((r,i)=>r.map(v=>v-normalizers[i])),q=logq.map(r=>r.map(Math.exp)),lm=Array.from({length:columns},(_,j)=>lse(source.map((_,i)=>lp[i]+logq[i][j]))),output=lm.map(Math.exp);
  let information=0,distortion=0;source.forEach((p,i)=>q[i].forEach((v,j)=>{if(p*v>0){information+=p*v*(logq[i][j]-lm[j])/Math.LN2;distortion+=p*v*costs[i][j];}}));
  const logg=Array.from({length:columns},(_,j)=>lse(source.map((_,i)=>lp[i]-s*costs[i][j]-normalizers[i]))),f=-source.reduce((a,p,i)=>a+p*normalizers[i],0),lower=(f-Math.max(...logg))/Math.LN2,upper=information+lambda*distortion;
  state={iteration,source,costs,lambda,initial:start,outputGuess:lr.map(Math.exp),logOutputGuess:[...lr],logits,normalizers,logConditional:logq,conditional:q,output,information,distortion,logGradients:logg,gradients:logg.map(Math.exp),variational:f/Math.LN2,lower,upper,gap:Math.max(0,upper-lower),fixed};
  if(!fixed||iteration===iterations)trace.push(state);
  if(iteration===iterations||(!fixed&&state.gap<=1e-9))break;
  lr=lm;
 }
 return{...state,trace,updatesApplied:state.iteration};
}
export function gaussianChannel(v,D,x){if(v===0)return{rate:0,shrink:0,mean:0,conditionalVariance:0,error:0,reproductionVariance:0,unused:D,branch:'Constant source'};if(D>=v)return{rate:0,shrink:0,mean:0,conditionalVariance:0,error:v,reproductionVariance:0,unused:D-v,branch:'Constant mean'};const shrink=1-D/v;return{rate:gaussianRateDistortion(v,D),shrink,mean:shrink*x,conditionalVariance:D*shrink,error:D,reproductionVariance:v-D,unused:0,branch:D===0?'Identity':'Interior Gaussian'};}
export function fidelity(rule,prevalence=.5){const source=[.5,.5],values=[-1,1],outputs=rule==='constant'?[0]:[-1,1],q=rule==='constant'?[[1],[1]]:rule==='copy'?[[1,0],[0,1]]:[[1-prevalence,prevalence],[1-prevalence,prevalence]],costs=values.map(x=>outputs.map(y=>(x-y)**2));return{...channelFacts(source,q,costs),values,outputs,costs};}
export function encodeBits(source){if(!/^[01]{0,48}$/.test(source))throw new RangeError('Use at most 48 binary digits.');const padded=source.padEnd(Math.ceil(source.length/3)*3,'0'),blocks=[];for(let i=0;i<padded.length;i+=3){const word=padded.slice(i,i+3),index=[...word].filter(v=>v==='1').length>=2?1:0;blocks.push({word,index,output:index?'111':'000',offset:i,errors:[...word].map((b,k)=>i+k<source.length&&b!==String(index))});}const payload=blocks.map(b=>b.index).join(''),packed=payload.padEnd(Math.ceil(payload.length/8)*8,'0'),bytes=[0,0,0,source.length];for(let i=0;i<packed.length;i+=8)bytes.push(parseInt(packed.slice(i,i+8),2));const decoded=blocks.map(b=>b.output).join('').slice(0,source.length);return{source,padded,blocks,payload,packed,bytes,decoded,sourcePadding:padded.length-source.length,bytePadding:packed.length-payload.length,wrong:[...source].filter((v,i)=>v!==decoded[i]).length};}
export function decodeBits(bytes){if(bytes.length<4)throw new RangeError('Rejected: the four-byte source count is truncated.');const count=bytes.slice(0,4).reduce((a,v)=>a*256+v,0),blocks=Math.ceil(count/3);if(bytes.length!==4+Math.ceil(blocks/8))throw new RangeError('Rejected: payload byte count disagrees with the source count.');const bits=bytes.slice(4).map(v=>v.toString(2).padStart(8,'0')).join('');if(bits.slice(blocks).includes('1'))throw new RangeError('Rejected: unused payload padding must be zero.');return bits.slice(0,blocks).split('').map(v=>v.repeat(3)).join('').slice(0,count);}
export const gaussianDensity=(x,mean,variance)=>Math.exp(-((x-mean)**2)/(2*variance))/Math.sqrt(2*Math.PI*variance);
export const binaryOptimum=(p,lambda)=>Math.min(p,1-p,1/(1+2**lambda));
export {binaryEntropy};
