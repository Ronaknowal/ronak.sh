import {defaultEmObservations,defaultEmParameters,emExpectation,fractionalScalarUpdate} from "./gaussian-em-models.mjs";

// Bounded fixed-centre inference. The common Gaussian normalizer cancels from
// these membership ratios; these logits are not labelled absolute densities.
export function distanceMembership(query=1,variance=1,weights=[0.5,0.5]) {
  if(!Number.isFinite(query)||query<-1||query>4||!Number.isFinite(variance)||variance<0.05||variance>4||!Array.isArray(weights)||weights.length!==2||weights.some(w=>!Number.isFinite(w)||w<=0)||Math.abs(weights[0]+weights[1]-1)>1e-12) throw new RangeError('A query in[-1,4], shared variance in[.05,4] and positive unit-sum priors are required.');
  const terms=[0,3].map((mean,k)=>{const square=(query-mean)**2;return {id:['First','Second'][k],mean,square,penalty:-square/(2*variance),logPrior:Math.log(weights[k])};});
  terms.forEach(t=>t.logit=t.logPrior+t.penalty);
  const maximum=Math.max(...terms.map(t=>t.logit));terms.forEach(t=>{t.shift=t.logit-maximum;t.shiftedExponential=Math.exp(t.shift);});
  const denominator=terms[0].shiftedExponential+terms[1].shiftedExponential;terms.forEach(t=>t.share=t.shiftedExponential/denominator);
  return {query,variance,weights:[...weights],terms,maximum,denominator,logNormalizer:maximum+Math.log(denominator)};
}

// Compare one hard update with the previously taught fractional scalar update.
// Fixed coordinates/initial centres; this is neither a Lloyd trainer nor a fit.
export function hardSoftCentreUpdate() {
  const observations=defaultEmObservations(),parameters=defaultEmParameters(),soft=emExpectation(observations,parameters),update=fractionalScalarUpdate(observations,soft.rows);
  const hardRows=observations.map(row=>{const squares=parameters.means.map(m=>(row.x-m)**2),id=squares[0]<=squares[1]?0:1;return {...row,shares:[Number(id===0),Number(id===1)]};});
  const hard=[0,1].map(k=>{const count=hardRows.reduce((s,row)=>s+row.shares[k],0),numerator=hardRows.reduce((s,row)=>s+row.shares[k]*row.x,0);return {id:parameters.ids[k],count,numerator,mean:numerator/count};});
  return {observations,parameters,hardRows,hard,softRows:soft.rows,soft:update.components,tie:{query:0,hard:'Left',soft:[0.5,0.5]}};
}
