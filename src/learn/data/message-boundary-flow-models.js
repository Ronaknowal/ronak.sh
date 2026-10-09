import { incomingSumRound, normalizedGraph, multiplyRows } from './message-passing-flow-models.js';

const scalarRows = last => [[1],[2],[last]];
const currentEdges = include => include ? [[0,1],[1,0],[1,2],[2,1]] : [[0,1],[1,0]];

// Constructed information-access demonstrations, not fitted assessment results.
// Withheld label annotations deliberately have no parameter or feature route.
export function transductiveBoundaryTrace(last = 4, includeContext = true) {
  if (!Number.isFinite(last) || last < -4 || last > 6) throw new RangeError('Paper 2 feature must be in [−4,6].');
  if (typeof includeContext !== 'boolean') throw new TypeError('Context availability is Boolean.');
  const features = scalarRows(last), edges = currentEdges(includeContext);
  const output = incomingSumRound(features,edges).map((row,id)=> id===2 && !includeContext ? null : row[0]);
  const logits = [output[1],0];
  // Stable CE for the declared constructed fitting label class0 and two scores.
  const fittingLoss = Math.max(-logits[0],0) + Math.log1p(Math.exp(-Math.abs(logits[0])));
  return {features,edges,active:includeContext?[0,1,2]:[0,1],fitMask:[false,true,false],output,logits,fittingLabel:0,fittingLoss,donorProducts:[1,2,includeContext?last:0]};
}

export function inductiveBoundaryTrace() {
  const fittingAdjacency=[[0,1],[1,0]];
  const arrivingAdjacency=[[0,1,0],[1,0,1],[0,1,0]];
  const fitting=normalizedGraph(fittingAdjacency),arriving=normalizedGraph(arrivingAdjacency);
  const weight=1;
  return {weight,fitting:{...fitting,ids:[0,1],features:[[1],[2]],output:multiplyRows(fitting.operator,[[1],[2]])},arriving:{...arriving,ids:[0,1,2],features:scalarRows(4),output:multiplyRows(arriving.operator,scalarRows(4))},newNode:2,fittingLabelIds:[0,1],unseenFittingInputIds:[]};
}

export function temporalBoundaryTrace(cutoff = 0, futureExists = true) {
  if (![0,1].includes(cutoff) || typeof futureExists!=='boolean') throw new RangeError('Use cutoff0/1 and Boolean future observation.');
  const hasTarget = cutoff===1 && futureExists;
  const adjacency=[[0,1,0],[1,0,hasTarget?1:0],[0,hasTarget?1:0,0]];
  const degree=adjacency.map(row=>row.reduce((a,b)=>a+b,0));
  const features=degree.map(d=>[d/2]);
  const graph=normalizedGraph(adjacency),output=multiplyRows(graph.operator,features).map(row=>row[0]);
  const baselineGraph=normalizedGraph([[0,1,0],[1,0,0],[0,0,0]]);
  const staleOutput=multiplyRows(baselineGraph.operator,features).map(row=>row[0]);
  return {cutoff,hasTarget,adjacency,degree,features,...graph,output,pair:[1,2],pairScore:output[1]*output[2],staleOutput,operatorIdentity:hasTarget?'0—1—2 + own loops':'0—1; isolate2 + own loops',cacheMustChange:hasTarget};
}
