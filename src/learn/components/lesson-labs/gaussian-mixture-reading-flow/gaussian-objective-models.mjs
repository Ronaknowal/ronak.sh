import { emExpectation, fractionalScalarUpdate, scalarEmTrace, defaultEmObservations, defaultEmParameters } from "./gaussian-em-models.mjs";

export const repeatedObservations=Object.freeze(['A','B','C','D'].map((id,index)=>Object.freeze({id,x:index<2?-2:2})));
const initial={ids:['Left','Right'],weights:[0.5,0.5],means:[-2,2],variances:[1,1]};
const used=emExpectation(repeatedObservations,initial);
const update=fractionalScalarUpdate(repeatedObservations,used.rows);

// Reuse the earlier allocation and centered-scatter kernel. This is one supplied
// first M-step under fixed allocations, not a new estimate of flower data.
export function repeatedRowFloor(floor) {
  if(!Number.isFinite(floor)||floor<0.05||floor>0.5) throw new RangeError('Minimum variance must be in [.05,.5].');
  return {floor,observations:repeatedObservations,initial,used,
    components:update.components.map(component=>({...component,rawVariance:component.variance,usedVariance:Math.max(component.variance,floor),usedStandardDeviation:Math.sqrt(Math.max(component.variance,floor))})),
    inactiveExample:{rawVariance:0.6,usedVariance:Math.max(0.6,floor)}};
}

// Preserved O1 printed values: recorded historical results, not reexecuted here.
export const recordedScalarObjectives=Object.freeze([-7.158187,-6.461856,-5.724278,-5.675743,-5.675742,-5.675742]);
export function objectiveTrace(observations=defaultEmObservations(),parameters=defaultEmParameters()) {
  return scalarEmTrace(observations,parameters,50);
}
export function objectiveState(trace,iteration) {
  if(!Number.isInteger(iteration)||iteration<0||iteration>=trace.states.length) throw new RangeError('Choose a stored parameter-state iteration.');
  const snapshot=trace.states[iteration],count=snapshot.observations.length;
  return {snapshot,iteration,count,rowLogs:snapshot.objective.rows.map(row=>({id:row.id,value:row.logDensity})),
    total:snapshot.objective.totalLogLikelihood,mean:snapshot.objective.meanLogLikelihood,gain:snapshot.gain,
    parameterTimestamp:iteration,usedAllocationTimestamp:snapshot.allocationIteration};
}
