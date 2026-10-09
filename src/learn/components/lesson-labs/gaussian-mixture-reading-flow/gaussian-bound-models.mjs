import { createEmSnapshot, advanceEmHalfStep } from "./gaussian-em-models.mjs";

// Finite-state decomposition only. A zero trial mass contributes its limit0;
// positive trial mass on a zero joint contribution has an infinite support gap.
export function trialBound(leftShare=0.5,joint=[0.3,0.1]) {
  if(!Number.isFinite(leftShare)||leftShare<0||leftShare>1||!Array.isArray(joint)||joint.length!==2||joint.some(v=>!Number.isFinite(v)||v<0)||joint.every(v=>v===0)) throw new RangeError('A unit trial share and two nonnegative joint terms with positive total are required.');
  const q=[leftShare,1-leftShare],density=joint[0]+joint[1],ell=Math.log(density);
  const terms=q.map((share,k)=>({id:['Left','Right'][k],share,joint:joint[k],logJoint:Math.log(joint[k]),expectedJoint:share===0?0:share*Math.log(joint[k]),entropy:share===0?0:-share*Math.log(share),posterior:joint[k]/density}));
  const Q=terms.reduce((s,t)=>s+t.expectedJoint,0),H=terms.reduce((s,t)=>s+t.entropy,0),F=Q+H;
  return {q,joint:[...joint],terms,density,ell,Q,H,F,gap:ell-F,status:Number.isFinite(F)?'finite':'unsupported trial mass'};
}

function cycleParts(objective,usedRows) {
  let Q=0,H=0;
  objective.rows.forEach((row,n)=>row.components.forEach((component,k)=>{
    const q=usedRows[n].components[k].share;
    if(q>0) {Q+=q*component.logWeightedDensity;H-=q*Math.log(q);}
  }));
  return {Q,H,F:Q+H,ell:objective.totalLogLikelihood};
}

// One supplied E/M cycle reuses the existing centered update. No fitted study.
export function touchingCycle() {
  const initial=createEmSnapshot(),allocated=advanceEmHalfStep(initial),updated=advanceEmHalfStep(allocated),refreshed=advanceEmHalfStep(updated);
  const old=cycleParts(initial.objective,allocated.usedAllocations),afterM=cycleParts(updated.objective,allocated.usedAllocations),afterE=cycleParts(refreshed.objective,refreshed.usedAllocations);
  return {old,afterM,afterE,boundGain:afterM.F-old.F,likelihoodGain:afterM.ell-old.ell,gap:afterM.ell-afterM.F};
}

export function jensenWitness() {
  const joint=[0.3,0.1],q=[0.5,0.5],ratios=joint.map((v,k)=>v/q[k]),coordinate=ratios.reduce((s,v,k)=>s+q[k]*v,0),weightedLogs=ratios.reduce((s,v,k)=>s+q[k]*Math.log(v),0);
  return {joint,q,ratios,coordinate,weightedLogs,logAverage:Math.log(coordinate),gap:Math.log(coordinate)-weightedLogs,posteriorRatios:[0.4,0.4]};
}
