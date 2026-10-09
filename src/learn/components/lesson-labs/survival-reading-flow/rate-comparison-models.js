import { PUMPS } from './univariate-models.js';

export function conditionalExponential(rate, width) {
  return { area: rate * width, probability: -Math.expm1(-rate * width) };
}
export function weibullWindow(shape, age, width = 3, scale = 12) {
  const before = (age / scale) ** shape, after = ((age + width) / scale) ** shape;
  const area = after - before;
  return { area, probability: -Math.expm1(-area), conditionalSurvival: Math.exp(-area) };
}
export function exposureFit(extraDays = 0) {
  const exposure = PUMPS.reduce((sum,row) => sum + row.time,0) + extraDays;
  const events = PUMPS.filter(row => row.event).length;
  const rate = events / exposure;
  const eta = Math.log(rate);
  return { exposure, events, rate, eta, informationEta:events, informationRate:events/(rate*rate), standardErrorRate:Math.sqrt(events)/exposure,
    relativeLogLikelihood: candidate => events * (candidate-eta) - exposure * (Math.exp(candidate)-rate) };
}
export const GROUP_PUMPS = PUMPS.map((row,index)=>({...row,group:index<4?1:0}));
export const CROSSING_PUMPS = [
  ...[1,1,3,3].map((time,index)=>({id:`J${index+1}`,time,event:index<2,group:1})),
  ...[2,2,2,3].map((time,index)=>({id:`K${index+1}`,time,event:index<3,group:0})),
];
export function logrankRows(rows) {
  const times=[...new Set(rows.filter(row=>row.event).map(row=>row.time))].sort((a,b)=>a-b);
  let score=0,variance=0;
  const groups=times.map(time=>{
    const risk=rows.filter(row=>row.time>=time), events=rows.filter(row=>row.time===time&&row.event);
    const n=risk.length,n1=risk.filter(row=>row.group===1).length,d=events.length,d1=events.filter(row=>row.group===1).length;
    const expected=d*n1/n, contribution=d1-expected;
    const increment=n>1 ? d*n1/n*(1-n1/n)*(n-d)/(n-1) : 0;
    score+=contribution;variance+=increment;
    return {time,n,n1,n0:n-n1,d,d1,expected,contribution,increment,risk,events};
  });
  return {groups,score,variance,statistic:variance>0?score*score/variance:null};
}
export function twoFailureAllocations() {
  const rows=[{id:'C',group:1},{id:'D',group:1},...['E','F','G','H'].map(id=>({id,group:0}))],pairs=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)pairs.push({members:[rows[i],rows[j]],count:rows[i].group+rows[j].group});
  return pairs;
}
