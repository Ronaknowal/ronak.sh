export const softmaxDirections={first:[1,0,0],mixed:[1,0,-1],common:[1,1,1]};
export function softmaxDerivativeState(direction='mixed',offset=0) {
  if(!Object.hasOwn(softmaxDirections,direction))throw new Error('Choose a displayed score direction.');
  if(!Number.isFinite(offset)||offset< -100||offset>100)throw new Error('The common score offset must be finite and between−100 and100.');
  const scores=[0,Math.log(2),Math.log(3)].map(x=>x+offset),maximum=Math.max(...scores);
  const stableWeights=scores.map(x=>Math.exp(x-maximum)),total=stableWeights.reduce((a,b)=>a+b,0),p=stableWeights.map(x=>x/total),v=softmaxDirections[direction];
  const weightedRate=p.reduce((s,x,i)=>s+x*v[i],0),rate=p.map((x,i)=>x*(v[i]-weightedRate)),jacobian=p.map((x,i)=>p.map((y,j)=>x*((i===j?1:0)-y)));
  return {direction,offset,scores,maximum,stableWeights,total,p,v,weightedRate,rate,jacobian,rateSum:rate.reduce((a,b)=>a+b,0)};
}
