import { finiteExponentialFamily, finiteMomentFit, gaussianSummary, mergeGaussianSummaries, betaCoordinateModel, summaryComparison, SUFFICIENCY_REFERENCE } from './exponential-family-models.js';

export { finiteExponentialFamily, finiteMomentFit, gaussianSummary, mergeGaussianSummaries, betaCoordinateModel, summaryComparison, SUFFICIENCY_REFERENCE };
export const enumerateBits = (n=4) => Array.from({length:2**n},(_,index)=>Array.from({length:n},(_,bit)=>(index >> (n-bit-1))&1));
export const bitProbability = (bits,p) => p**bits.reduce((a,b)=>a+b,0)*(1-p)**(bits.length-bits.reduce((a,b)=>a+b,0));
export function conditionalAveraging(p=.2) {
  if(!Number.isFinite(p)||p<.05||p>.95)throw new RangeError('p must be in [.05,.95].');
  const rows=enumerateBits().map(bits=>({bits,count:bits.reduce((a,b)=>a+b,0),first:bits[0],mass:bitProbability(bits,p)}));
  const fibres=Array.from({length:5},(_,count)=>{const records=rows.filter(row=>row.count===count);return{count,records,mass:records.reduce((a,r)=>a+r.mass,0),prediction:count/4};});
  const first=[0,1].map(value=>({value,mass:rows.filter(r=>r.first===value).reduce((a,r)=>a+r.mass,0)}));
  const averaged=fibres.map(f=>({value:f.prediction,mass:f.mass}));
  const firstMean=first.reduce((a,r)=>a+r.value*r.mass,0),averagedMean=averaged.reduce((a,r)=>a+r.value*r.mass,0);
  const firstVariance=first.reduce((a,r)=>a+(r.value-firstMean)**2*r.mass,0),averagedVariance=averaged.reduce((a,r)=>a+(r.value-averagedMean)**2*r.mass,0);
  const residual=rows.reduce((a,r)=>a+r.mass*(r.first-r.count/4)**2,0);
  return{p,rows,fibres,first,averaged,firstMean,averagedMean,firstVariance,averagedVariance,residual};
}
export function gaussianBlocks(shift=0) {
  if(!Number.isFinite(shift)||shift< -5||shift>5)throw new RangeError('Right block shift is in [−5,5].');
  const left=[1,2,3],right=[5+shift,6+shift],a=gaussianSummary(left),b=gaussianSummary(right),whole=mergeGaussianSummaries(a,b);
  const between=(b.mean-a.mean)**2*a.count*b.count/whole.count;
  return{shift,left,right,a,b,whole,between,within:a.squaredDeviations+b.squaredDeviations};
}
export const normalDensity=(x,mean=1.5,variance=2)=>Math.exp(-((x-mean)**2)/(2*variance))/Math.sqrt(2*Math.PI*variance);
export function gaussianLogLikelihood(values,mean,variance) {
  if(!Number.isFinite(mean)||!Number.isFinite(variance)||variance<=0)throw new RangeError('Finite mean and positive finite variance required.');
  const s=gaussianSummary(values),squared=s.squaredDeviations+s.count*(s.mean-mean)**2;
  return{s,squared,logLikelihood:-s.count/2*Math.log(2*Math.PI*variance)-squared/(2*variance)};
}
export function logisticState(beta=[-.2,.7],responses=[0,1,1]) {
  if(beta.length!==2||beta.some(x=>!Number.isFinite(x))||responses.length!==3||responses.some(x=>x!==0&&x!==1))throw new RangeError('Two finite coefficients and three binary responses required.');
  const features=[[1,-1],[1,0],[1,1]],gradient=[0,0],hessian=[[0,0],[0,0]];
  let loss=0;
  const rows=features.map((x,i)=>{const eta=x[0]*beta[0]+x[1]*beta[1],p=eta>=0?1/(1+Math.exp(-eta)):Math.exp(eta)/(1+Math.exp(eta)),variance=p*(1-p),score=x.map(v=>v*(p-responses[i]));
    loss+=Math.max(eta,0)+Math.log1p(Math.exp(-Math.abs(eta)))-responses[i]*eta;
    for(let j=0;j<2;j++){gradient[j]+=score[j];for(let k=0;k<2;k++)hessian[j][k]+=variance*x[j]*x[k];}
    return{x,response:responses[i],eta,p,variance,score};});
  return{beta,responses,rows,gradient,hessian,loss,statistic:[responses.reduce((a,b)=>a+b,0),responses[2]-responses[0]]};
}
export const sampleCurve=(fn,low,high,count=160)=>Array.from({length:count+1},(_,i)=>{const x=low+(high-low)*i/count;return[x,fn(x)];});

export function finiteTeachingFamily(etaLinear,etaSquare=0) {
  if(![etaLinear,etaSquare].every(Number.isFinite))throw new RangeError('Use finite natural parameters.');
  const outcomes=[-1,0,1],logWeights=outcomes.map(x=>etaLinear*x+etaSquare*x*x);
  if(!logWeights.every(Number.isFinite))throw new RangeError('These finite inputs overflow the floating log weights. Reduce their magnitude; the last valid model remains visible.');
  const shift=Math.max(...logWeights),weights=logWeights.map(w=>Math.exp(w-shift)),total=weights.reduce((a,b)=>a+b,0),probabilities=weights.map(w=>w/total);
  const mean=[1,2].map(power=>outcomes.reduce((a,x,i)=>a+probabilities[i]*x**power,0));
  return{outcomes,logWeights,shift,relativeWeights:weights,relativeTotal:total,logPartition:shift+Math.log(total),probabilities,mean};
}
