import {MODEL_SELECTION_SAVED} from "./gaussian-model-selection-models.mjs";
import {covarianceFactor} from "./gaussian-covariance-family-models.mjs";
const saved=MODEL_SELECTION_SAVED.iris;
const selected=saved.candidates.find(c=>c.covariance_type===saved.selected[0]&&c.components===saved.selected[1]);
// These factors belong to one retained parameter state. A query changes neither
// the state nor its training transform, so factor once, not on each slider edit.
const factors=selected.covariances.map(covarianceFactor);
const logDeterminants=factors.map(L=>2*(Math.log(L[0][0])+Math.log(L[1][1])));
const speciesOrder=['setosa','versicolor','virginica'];
const choose2=n=>n*(n-1)/2;

export function savedPartition(renamed=false) {
  if(typeof renamed!=='boolean')throw new RangeError('Use a literal rename of the already saved partition.');
  const rows=saved.test_ids_in_order.map((id,i)=>({id,species:saved.test_labels[i],component:renamed?1-saved.test_component_labels[i]:saved.test_component_labels[i]}));
  const contingency=speciesOrder.map(species=>[0,1].map(component=>rows.filter(row=>row.species===species&&row.component===component).length));
  const speciesCounts=contingency.map(row=>row[0]+row[1]),componentCounts=[0,1].map(k=>contingency.reduce((s,row)=>s+row[k],0));
  const cells=contingency.flat().reduce((s,n)=>s+choose2(n),0),speciesPairs=speciesCounts.reduce((s,n)=>s+choose2(n),0),componentPairs=componentCounts.reduce((s,n)=>s+choose2(n),0);
  const pairs=choose2(rows.length),expected=speciesPairs*componentPairs/pairs,maximum=(speciesPairs+componentPairs)/2;
  return {rows,speciesOrder,contingency,speciesCounts,componentCounts,cells,speciesPairs,componentPairs,pairs,expected,maximum,ari:(cells-expected)/(maximum-expected),reportedARI:saved.test_ari,renamed};
}

export function savedQuery(length=5.5,width=4.2) {
  if(!Number.isFinite(length)||length<3||length>9||!Number.isFinite(width)||width<1||width>5)throw new RangeError('Query length must be in[3,9]cm and width in[1,5]cm.');
  const raw=[length,width],residual=raw.map((v,i)=>v-saved.scale_mean[i]),standardized=residual.map((v,i)=>v/saved.scale[i]);
  const terms=selected.means.map((mean,k)=>{
    const difference=standardized.map((v,i)=>v-mean[i]),L=factors[k];
    const whitened=[difference[0]/L[0][0],(difference[1]-L[1][0]*difference[0]/L[0][0])/L[1][1]];
    const square=whitened[0]**2+whitened[1]**2,logPrior=Math.log(selected.weights[k]);
    const logDensity=-Math.log(2*Math.PI)-0.5*(logDeterminants[k]+square);
    return {id:k,mean,covariance:selected.covariances[k],weight:selected.weights[k],difference,whitened,square,logDeterminant:logDeterminants[k],logPrior,logDensity,logWeightedDensity:logPrior+logDensity};
  });
  const maximum=Math.max(...terms.map(t=>t.logWeightedDensity));
  terms.forEach(t=>{t.shift=t.logWeightedDensity-maximum;t.shiftedExponential=Math.exp(t.shift);});
  const denominator=terms.reduce((s,t)=>s+t.shiftedExponential,0),logDensity=maximum+Math.log(denominator);
  terms.forEach(t=>t.share=t.shiftedExponential/denominator);
  return {raw,residual,scaleMean:saved.scale_mean,scale:saved.scale,standardized,terms,maximum,denominator,logDensity,nll:-logDensity,componentId:terms[0].share>=terms[1].share?0:1,illustrativeAction:-logDensity>10};
}

export function operationRoles() {
  const queries=[[5.5,4.2],[4.9,3.1],[6.2,2.8],[7,3.2]],results=queries.map(([a,b])=>savedQuery(a,b));
  const uniforms=[0.2,0.8,0.4,0.6],noise=[[0,0],[1,-1],[-0.5,0.5],[0,1]];
  const generated=uniforms.map((u,i)=>{
    const componentId=u<selected.weights[0]?0:1,L=factors[componentId],z=noise[i],mean=selected.means[componentId];
    const row=[mean[0]+L[0][0]*z[0],mean[1]+L[1][0]*z[0]+L[1][1]*z[1]];
    return {u,z,componentId,row};
  });
  const scores=results.map(r=>r.logDensity),shares=results.map(r=>r.terms.map(t=>t.share)),componentIds=results.map(r=>r.componentId);
  return {queries,standardized:results.map(r=>r.standardized),scores,score:scores.reduce((a,b)=>a+b,0)/scores.length,shares,componentIds,generated,weights:selected.weights,constructedRows:[[0.4,0.35,0.25],[0.35,0.4,0.25]]};
}
