export const COX_ROWS = Object.freeze([
  ['A',1,true,-1],['B',2,true,0],['C',2,true,1],['D',3,false,-1],['E',4,true,0],['F',5,false,1],
].map(([id,time,event,x])=>Object.freeze({id,time,event,x})));
export const UNTIED_ROWS=COX_ROWS.map(row=>row.id==='C'?{...row,time:2.5}:row);

// A positive centered moment merge: no subtraction of large second moments.
export function mergeMoments(a,b) {
  if(!a)return b;if(!b)return a;
  const scale=Math.max(a.scale,b.scale),wa=a.mass*Math.exp(a.scale-scale),wb=b.mass*Math.exp(b.scale-scale),mass=wa+wb;
  const pa=wa/mass,pb=wb/mass,difference=b.mean-a.mean;
  return {scale,mass,mean:a.mean+pb*difference,variance:pa*a.variance+pb*b.variance+pa*pb*difference*difference};
}
export function riskMoments(rows,beta) {
  return rows.reduce((pool,row)=>mergeMoments(pool,{scale:beta*row.x,mass:1,mean:row.x,variance:0}),null);
}
export function riskCompetition(beta,time=1,rows=COX_ROWS) {
  const members=rows.filter(row=>row.time>=time),moments=riskMoments(members,beta);
  const logDenominator=moments.scale+Math.log(moments.mass);
  return {...moments,logDenominator,members:members.map(row=>({...row,score:beta*row.x,weight:Math.exp(beta*row.x),share:Math.exp(beta*row.x-logDenominator)}))};
}
export function untiedTerms(beta) {
  let score=0,information=0,objective=0;
  for(const row of UNTIED_ROWS.filter(item=>item.event)) {
    const pool=riskMoments(UNTIED_ROWS.filter(item=>item.time>=row.time),beta);
    objective+=pool.scale-beta*row.x+Math.log(pool.mass);
    score+=row.x-pool.mean;information+=pool.variance;
  }
  return {score,information,objective};
}
export function newtonTrials() {
  const beta=3,initial=untiedTerms(beta),direction=initial.score/initial.information;
  return {beta,...initial,direction,trials:[1,.5,.25].map(fraction=>{const candidate=beta+fraction*direction,result=untiedTerms(candidate),threshold=initial.objective-1e-4*fraction*initial.score*direction;return {fraction,beta:candidate,...result,threshold,accepted:result.objective<=threshold};})};
}
export const TIED_MEMBERS=COX_ROWS.filter(row=>row.time>=2).map(row=>({...row,weight:2**row.x}));
export function subsetPairs() {
  const pairs=[];for(let i=0;i<TIED_MEMBERS.length;i++)for(let j=i+1;j<TIED_MEMBERS.length;j++) {
    const a=TIED_MEMBERS[i],b=TIED_MEMBERS[j];pairs.push({ids:a.id+b.id,weight:a.weight*b.weight,sum:a.x+b.x});
  }
  const total=pairs.reduce((sum,row)=>sum+row.weight,0),mean=pairs.reduce((sum,row)=>sum+row.weight*row.sum,0)/total;
  const variance=pairs.reduce((sum,row)=>sum+row.weight*(row.sum-mean)**2,0)/total;
  return {pairs,total,mean,variance};
}
export function subsetCoefficientTrace() {
  const trace=[{id:'Before any subject',weight:0,before:[1,0,0],after:[1,0,0]}];let cells=[1,0,0];
  for(const row of TIED_MEMBERS) {const before=[...cells];for(let degree=2;degree>=1;degree--)cells[degree]+=row.weight*cells[degree-1];trace.push({id:row.id,weight:row.weight,before,after:[...cells]});}
  return trace;
}
export function baselineAt(time) { return (time>=1?1/7:0)+(time>=2?4/13:0)+(time>=4?1/3:0); }
export function baselineSteps(end=5,multiplier=1,asSurvival=false) {
  const transform=h=>asSurvival?Math.exp(-multiplier*h):multiplier*h;
  const points=[[0,transform(0)]];let previous=0;
  for(const time of[1,2,4]){points.push([time,transform(previous)]);previous=baselineAt(time);points.push([time,transform(previous)]);}
  points.push([end,transform(previous)]);return points;
}
