import {retainedDisplay} from './retained-display-data.mjs';
import {EuclideanNeighbourhoods,densityPartition} from './dbscan-neighbourhood-models.mjs';
export const irisData=retainedDisplay.iris;
export const ringData=retainedDisplay.rings;
export function savedIrisRecord(eps=.5,minimum=5){
  const record=irisData.fits.find(r=>r.representation==='four standardized features'&&r.eps===eps&&r.min_samples===minimum);
  if(!record)throw new RangeError('Only the named retained standardized records are available.');
  return record;
}
export function savedRoleRows(record){
  const core=new Set(record.core_ids),border=new Set(record.border_ids);
  return irisData.observations.map(row=>({...row,label:record.labels[row.id],role:core.has(row.id)?'core':border.has(row.id)?'border':'noise'}));
}
export function spacingExample(spacing){
  if(!Number.isFinite(spacing)||spacing<.125||spacing>.9)throw new RangeError('Diffuse spacing must lie in [.125,.9].');
  const positions=[0,.125,.25,.375,.75,.875,1,1.125,5,5+spacing,5+2*spacing,5+3*spacing];
  const observations=positions.map((x,i)=>({id:String.fromCharCode(65+i),coordinates:[x]}));
  const provider=new EuclideanNeighbourhoods(observations),required=Math.max(.125,spacing),forbidden=.375;
  const result=densityPartition(provider,required,3);
  return {spacing,required,forbidden,feasible:required<forbidden,provider,partition:result,observations};
}
