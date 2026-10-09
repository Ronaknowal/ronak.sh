// Topic-owned display adapters. The retained scientific model/programs remain their owners.
export const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
export const norm=a=>Math.hypot(...a);
export const shrink=(x,t)=>Math.sign(x)*Math.max(0,Math.abs(x)-t);
export function budgetProjectionState(budget=4,target=[4,3,-2]){
 if(!Array.isArray(target)||!target.length||!target.every(Number.isFinite))throw new RangeError('Target must be a nonempty finite coordinate array');
 if(!Number.isFinite(budget)||budget<0||budget>10)throw new RangeError('Display budget must lie in [0,10]');
 const sorted=target.map((value,index)=>({value,index})).sort((a,b)=>b.value-a.value),positive=target.map(x=>Math.max(0,x));
 let prefix=0;const rows=sorted.map((x,i)=>{prefix+=x.value;const trial=(prefix-budget)/(i+1);return {rank:i+1,index:x.index,value:x.value,prefix,trial,active:x.value>trial};});
 const inactive=positive.reduce((a,b)=>a+b,0)<=budget,last=rows.filter(r=>r.active).at(-1);
 const threshold=budget===0?Math.max(0,...target):inactive?0:last.trial;
 const weights=target.map(x=>Math.max(0,x-threshold)),gradient=weights.map((x,i)=>x-target[i]),objective=.5*gradient.reduce((s,x)=>s+x*x,0);
 const directional=[0,...gradient.map(g=>budget*g)].map(v=>v-dot(gradient,weights));
 const lower=objective+Math.min(...directional);
 return {budget,target,sorted,rows:budget===0||inactive?[]:rows,inactive,threshold,weights,gradient,objective,lower,gap:Math.max(0,objective-lower),sum:weights.reduce((a,b)=>a+b,0),branch:budget===0?'zero budget':inactive?'inactive budget':'active sorted prefix'};
}
export const lassoA=[[1,0,1],[0,1,1],[1,1,0],[2,0,1]],lassoB=[1,0,1,2],lassoL=5+Math.sqrt(10),lassoPenalty=.2;
export const fitResidual=w=>lassoA.map((row,i)=>dot(row,w)-lassoB[i]);
export const fitGradient=w=>{const r=fitResidual(w);return [0,1,2].map(j=>lassoA.reduce((s,row,i)=>s+row[j]*r[i],0));};
export const lassoObjective=w=>.5*dot(fitResidual(w),fitResidual(w))+lassoPenalty*w.reduce((s,x)=>s+Math.abs(x),0);
export function proximalStepState(iteration=0){
 if(!Number.isInteger(iteration)||iteration<0||iteration>30)throw new RangeError('Display iteration must be an integer in [0,30]');
 const step=1/lassoL,threshold=step*lassoPenalty,path=[];let w=[0,0,0];
 for(let i=0;i<=iteration;i++){
  const residual=fitResidual(w),gradient=fitGradient(w),forward=w.map((x,j)=>x-step*gradient[j]),updated=forward.map(x=>shrink(x,threshold));
  const mapping=w.map((x,j)=>(x-updated[j])/step),stationarity=w.map((x,j)=>Math.abs(x)>1e-8?Math.abs(gradient[j]+lassoPenalty*Math.sign(x)):Math.max(0,Math.abs(gradient[j])-lassoPenalty));
  path.push({iteration:i,w:w.slice(),residual,gradient,forward,updated,mapping,mappingNorm:norm(mapping),stationarity,objective:lassoObjective(w)});w=updated;
 }
 return {iteration,step,threshold,L:lassoL,penalty:lassoPenalty,path,current:path.at(-1)};
}
export const tvObserved=[.2,-.1,.1,3,3.2,2.8],tvFitted=[1/6,1/6,1/6,2.9,2.9,2.9],tvQ=[-1/9,7/9,1,2/3,-1/3];
export const differences=x=>x.slice(1).map((value,i)=>value-x[i]);
export const differenceTranspose=q=>[-q[0],...q.slice(0,-1).map((x,i)=>x-q[i+1]),q.at(-1)];
