import { kaplanMeier,survivalAt } from './univariate-models.js';
import { logrankRows } from './rate-comparison-models.js';
export const TREE_ROWS=Object.freeze([8,9,7,6,4,3,2,5].map((time,index)=>Object.freeze({id:`P${index+1}`,x:index,time,event:[true,false,true,false,true,true,true,false][index]})));
// Exact bootstrap occurrences from survival-tree-forest.recorded-stdout.txt; no browser fitting.
export const SAVED_BAGS=Object.freeze([[5,7,6,6,5,1,2,6],[6,1,2,7,4,6,4,0],[4,4,7,5,2,6,3,2],[3,1,4,5,7,4,7,7],[6,6,5,1,3,2,7,4],[6,5,1,0,7,4,2,1],[1,7,6,1,3,1,4,7]].map(row=>Object.freeze(row)));
export function treeSplit(cut=3.5) {
  const rows=TREE_ROWS.map(row=>({...row,group:row.x<=cut?1:0}));
  const left=rows.filter(row=>row.group===1),right=rows.filter(row=>row.group===0),leftCurve=kaplanMeier(left),rightCurve=kaplanMeier(right);
  return {left,right,leftCurve,rightCurve,...logrankRows(rows),querySurvival:survivalAt(4,6<=cut?leftCurve:rightCurve)};
}
export function forestAverage(repeated=1,day=3) {
  const after=day>=2,sA=after?1/(repeated+1):1,hA=after?repeated/(repeated+1):0;
  return {sA,hA,sB:1,hB:0,meanS:(sA+1)/2,meanH:hA/2,exponential:Math.exp(-hA/2)};
}
export function treePrefixState(moved) {
  const times=[2,3,4,7,8],risk=[8,7,6,3,2],weights=risk.map(n=>1/(n*n)),left=times.map(time=>TREE_ROWS.slice(0,moved).filter(row=>row.time>=time).length);
  const beforeLeft=times.map(time=>TREE_ROWS.slice(0,Math.max(0,moved-1)).filter(row=>row.time>=time).length);
  const score=TREE_ROWS.slice(0,moved).reduce((sum,row)=>sum+Number(row.event)-times.reduce((subtotal,time,j)=>subtotal+(time<=row.time?1/risk[j]:0),0),0);
  const variance=left.reduce((sum,count,j)=>sum+weights[j]*count*(risk[j]-count),0);
  return {times,risk,weights,left,beforeLeft,score,variance,oldPrefix:beforeLeft.reduce((sum,count,j)=>sum+weights[j]*count,0)};
}
export function discreteBranches(last=.25) {
  const hazards=[.1,.2,last];let survival=1;
  const rows=hazards.map((hazard,index)=>{const before=survival,mass=before*hazard;survival=before*(1-hazard);return{bin:index+1,hazard,before,mass,after:survival};});return{rows,survival};
}
export function scoreGradient(score=Math.log(2)) {
  const weights=[1,Math.exp(score),3],denominator=weights.reduce((a,b)=>a+b,0),shares=weights.map(weight=>weight/denominator);
  return {weights,denominator,shares,gradients:shares.map((share,i)=>share-(i===0?1:0)),loss:Math.log(denominator)};
}
