import { gaussianDetails } from "./gaussian-geometry-models.mjs";

// A supplied state, not an estimator fit. Left narrows at one observed row;
// Right retains positive density at all four observed rows.
export function collapseState(standardDeviation) {
  if (!Number.isFinite(standardDeviation) || standardDeviation < 0.001 || standardDeviation > 1) {
    throw new RangeError('Left standard deviation must be in [.001,1]');
  }
  const observations = [-2,-1,1,2].map((query,index) => {
    const left = gaussianDetails(query,-2,standardDeviation), right = gaussianDetails(query,0,2);
    const logs = [Math.log(0.5)+left.logDensity,Math.log(0.5)+right.logDensity];
    const maximum = Math.max(...logs);
    const logDensity = maximum + Math.log(Math.exp(logs[0]-maximum)+Math.exp(logs[1]-maximum));
    return {id:'ABCD'[index],query,leftHeight:0.5*left.density,rightHeight:0.5*right.density,logDensity};
  });
  return {standardDeviation,mean:-2,weight:0.5,peak:0.5/(standardDeviation*Math.sqrt(2*Math.PI)),area:0.5,
    zoomLower:-2-4*standardDeviation,zoomUpper:-2+4*standardDeviation,observations,
    totalLogLikelihood:observations.reduce((sum,row)=>sum+row.logDensity,0)};
}

// These four exact recorded N8 numbers are preserved data, not newly claimed
// experimental outcomes. collapseState is an independent supplied-state check.
export const recordedCollapseStates = Object.freeze([
  Object.freeze({standardDeviation:1,totalLogLikelihood:-8.122121376997402}),
  Object.freeze({standardDeviation:0.1,totalLogLikelihood:-6.945323529427528}),
  Object.freeze({standardDeviation:0.01,totalLogLikelihood:-4.669586146668674}),
  Object.freeze({standardDeviation:0.001,totalLogLikelihood:-2.3697258984019505}),
]);

// Fixed-allocation scalar variance objective, with parameter-independent
// constants omitted. A positive floor restricts the feasible variance domain;
// adding the floor is a different update, not its exact maximizer.
export function scalarVarianceObjective(variance,scatter,count=2) {
  if (![variance,scatter,count].every(Number.isFinite) || variance<=0 || scatter<0 || count<=0) {
    throw new RangeError('Positive variance/count and nonnegative scatter required');
  }
  const objective=-0.5*count*(Math.log(variance)+scatter/variance);
  const derivative=count*(scatter-variance)/(2*variance**2);
  if(!Number.isFinite(objective)||!Number.isFinite(derivative)) throw new RangeError('Variance arithmetic exceeds the represented range');
  return {variance,scatter,count,objective,derivative};
}

export function varianceConstraint(scatter,floor) {
  if(!Number.isFinite(scatter)||scatter<0||scatter>1||!Number.isFinite(floor)||floor<0.05||floor>0.5) {
    throw new RangeError('Scatter in [0,1] and floor in [.05,.5] required');
  }
  const exact=scalarVarianceObjective(Math.max(scatter,floor),scatter),additive=scalarVarianceObjective(scatter+floor,scatter);
  return {scatter,floor,count:2,exact,additive,stationaryVariance:scatter>0?scatter:null,active:scatter<floor};
}
