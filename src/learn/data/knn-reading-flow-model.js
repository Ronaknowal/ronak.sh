// Topic-scoped deterministic arithmetic. Old scientific programs are unchanged.
export const cases = [
  ['A1',1,2,'A'], ['A2',1.5,1.8,'A'], ['A3',1.2,2.5,'A'],
  ['B1',5,5,'B'], ['B2',5.5,4.8,'B'], ['B3',4.8,5.2,'B'],
  ['C1',3,3,'C'], ['C2',3.2,2.8,'C'],
].map(([id,x,y,label]) => Object.freeze({id,point:Object.freeze([x,y]),label}));
export const labels = ['A','B','C'];
export const finite = (v, lo, hi, integer=false) => typeof v === 'number' && Number.isFinite(v) && v>=lo && v<=hi && (!integer || Number.isInteger(v));
export function distance(a,b,metric='euclidean') {
  if (a.length !== b.length || !a.every(Number.isFinite) || !b.every(Number.isFinite)) throw new RangeError('Matching finite coordinates required.');
  const d=a.map((x,i)=>Math.abs(x-b[i]));
  if(metric==='euclidean')return Math.hypot(...d);
  if(metric==='manhattan')return d.reduce((s,x)=>s+x,0);
  if(metric==='maximum')return Math.max(...d);
  throw new RangeError('Unsupported norm.');
}
export function rank(query,rows=cases,metric='euclidean') {
  if (!query.every(Number.isFinite) || query.length!==2 || !Array.isArray(rows) || new Set(rows.map(r=>r.id)).size!==rows.length)throw new RangeError('Finite 2D query and distinct IDs required.');
  return rows.map(r=>({...r,distance:distance(query,r.point,metric)})).sort((a,b)=>Number(a.distance.toFixed(12))-Number(b.distance.toFixed(12)) || a.id.localeCompare(b.id));
}
export function shares(rows,weight='uniform') {
  if(!['uniform','distance'].includes(weight))throw new RangeError('Choose uniform or distance.');
  if(!rows.length)return [];
  const exact=rows.some(r=>r.distance===0), smallest=Math.min(...rows.map(r=>r.distance));
  const masses=rows.map(r=>weight==='uniform'?1:exact?Number(r.distance===0):smallest/r.distance);
  const total=masses.reduce((s,x)=>s+x,0);
  return rows.map((r,i)=>({...r,mass:masses[i],share:masses[i]/total}));
}
export function votes(rows,classes=labels) {
  if(!rows.length)return {totals:classes.map(label=>({label,value:null})),winner:null};
  const totals=classes.map(label=>({label,value:rows.filter(r=>r.label===label).reduce((s,r)=>s+r.share,0)}));
  const winner=totals.reduce((best,next)=>next.value>best.value+1e-12?next:best,totals[0]).label;
  return {totals,winner};
}
export function neighborhood(query=[3.1,2.9],k=5,metric='euclidean',weight='uniform',rows=cases) {
  if(!finite(k,1,rows.length,true))throw new RangeError('k must be an integer within available rows.');
  const ranked=rank(query,rows,metric),selected=shares(ranked.slice(0,k),weight);
  return {ranked,selected,radius:selected.at(-1).distance,...votes(selected)};
}
export function regression(query=2.5,k=3,weight='uniform') {
  if(!finite(query,-1,8)||!finite(k,1,6,true))throw new RangeError('Query −1…8; integer k1…6.');
  const ranked=Array.from({length:6},(_,x)=>({id:String(x),point:[x,0],target:x*x,distance:Math.abs(x-query)})).sort((a,b)=>a.distance-b.distance||Number(a.id)-Number(b.id));
  const selected=shares(ranked.slice(0,k),weight);
  return {ranked,selected,prediction:selected.reduce((s,r)=>s+r.share*r.target,0)};
}
export function units(query=[1.2,600],factor=1,scaled=false) {
  if(!finite(query[0],0,6)||!finite(query[1],0,1200)||!finite(factor,.1,10))throw new RangeError('Use the declared time, energy and conversion domains.');
  const rows=[['R',1,100],['S',3,1000],['T',5,1100]].map(([id,x,y])=>({id,point:[x,y*factor]}));
  const means=[0,1].map(j=>rows.reduce((s,r)=>s+r.point[j],0)/3);
  const scales=[0,1].map(j=>Math.sqrt(rows.reduce((s,r)=>s+(r.point[j]-means[j])**2,0)/3)||1);
  const converted=[query[0],query[1]*factor];
  const records=rows.map(r=>({...r,deltas:r.point.map((x,j)=>(x-converted[j])/(scaled?scales[j]:1))})).map(r=>({...r,components:r.deltas.map(x=>x*x),distance:Math.hypot(...r.deltas)}));
  records.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
  return {records,means,scales,winner:records[0].id};
}
export const affineFixtures={curved:{x:[0,1,2,3],y:[0,1,4,9]},symmetric:{x:[-1,0,1],y:[-1,2,5]},repeated:{x:[1,1,1],y:[1,2,4]}};
export function affine(query=3.5,bandwidth=1,fixture='curved') {
  if(!finite(query,-1,4)||!finite(bandwidth,.1,3)||!Object.hasOwn(affineFixtures,fixture))throw new RangeError('Query −1…4 and h .1…3 required.');
  const {x,y}=affineFixtures[fixture],centered=x.map(v=>v-query),log=centered.map(v=>-.5*(v/bandwidth)**2),shift=Math.max(...log),mass=log.map(v=>Math.exp(v-shift)),sum=mass.reduce((s,v)=>s+v,0),weight=mass.map(v=>v/sum);
  // Incremental Givens QR of sqrt-weighted [1,x-q], including its target.
  let a=0,b=0,c=0,t0=0,t1=0;
  const design=[];
  x.forEach((_,i)=>{
    let u=Math.sqrt(weight[i]),v=u*centered[i],t=u*y[i];design.push([u,v,t]);
    const length=Math.hypot(a,u),co=length?a/length:1,si=length?u/length:0;
    const nextB=co*b+si*v,remainingV=-si*b+co*v;
    const nextT=co*t0+si*t,remainingT=-si*t0+co*t;
    a=length;b=nextB;t0=nextT;v=remainingV;t=remainingT;
    const second=Math.hypot(c,v),co2=second?c/second:1,si2=second?v/second:0;
    t1=co2*t1+si2*t;c=second;
  });
  const sigmaMax=Math.sqrt((a*a+b*b+c*c+Math.hypot(a*a+b*b-c*c,2*b*c))/2);
  const sigmaMin=sigmaMax?Math.abs(a*c)/sigmaMax:0;
  const identified=sigmaMin>1e-12*sigmaMax;
  const slope=identified?t1/c:null,intercept=identified?(t0-b*slope)/a:null;
  return {x,y,centered,weight,design,R:[[a,b],[0,c]],sigmaMax,sigmaMin,rank:identified?2:1,slope,intercept,constant:weight.reduce((s,w,i)=>s+w*y[i],0)};
}
export function radius(query=[3.1,2.9],r=.2) {
  if(!finite(r,0,3))throw new RangeError('Radius0…3 required.');
  const ranked=rank(query),selected=shares(ranked.filter(row=>row.distance<=r));
  return {ranked,selected,...votes(selected)};
}
export function candidates(eligible,k=3) {
  if(!Array.isArray(eligible)||new Set(eligible).size!==eligible.length||eligible.some(id=>!cases.some(r=>r.id===id)))throw new RangeError('Distinct declared candidate IDs required.');
  const exact=neighborhood([3.1,2.9],k,'euclidean','distance'),pool=cases.filter(r=>eligible.includes(r.id));
  if(pool.length<k)return {count:pool.length,available:false,exact,selected:[],recall:null,winner:null};
  const selected=neighborhood([3.1,2.9],k,'euclidean','distance',pool);
  return {...selected,count:pool.length,available:true,exact,recall:selected.selected.filter(r=>exact.selected.some(e=>e.id===r.id)).length/k};
}
export function volume(d=2,fraction=.01) {
  if(!finite(d,1,100,true)||!finite(fraction,0,1)||fraction===0)throw new RangeError('Integer dimension1…100 and fraction(0,1] required.');
  return {side:Math.exp(Math.log(fraction)/d),expected:1000*fraction,log10ForTen:d+1};
}
export function kdBuild(rows=cases,depth=0) {
  if(!rows.length)return null;
  const axis=depth%2,sorted=[...rows].sort((a,b)=>a.point[axis]-b.point[axis]||a.id.localeCompare(b.id)),middle=Math.floor(sorted.length/2);
  return {row:sorted[middle],axis,left:kdBuild(sorted.slice(0,middle),depth+1),right:kdBuild(sorted.slice(middle+1),depth+1)};
}
export function kdSearch(query) {
  if(!query.every(v=>finite(v,0,6))||query.length!==2)throw new RangeError('Query0…6 required.');
  let best=null;const frames=[],visited=[];
  function search(node){
    if(!node)return;
    const d=distance(query,node.row.point),old=best;
    const key=Number(d.toFixed(12));
    if(!best||key<Number(best.distance.toFixed(12))||key===Number(best.distance.toFixed(12))&&node.row.id<best.id)best={...node.row,distance:d};
    visited.push(node.row.id);frames.push({kind:'visit',node:node.row.id,axis:node.axis,split:node.row.point[node.axis],distance:d,before:old,after:best});
    const delta=query[node.axis]-node.row.point[node.axis],near=delta<=0?node.left:node.right,far=delta<=0?node.right:node.left;
    search(near);
    const bound=Math.abs(delta),prune=bound>best.distance+1e-12;
    frames.push({kind:'bound',node:node.row.id,axis:node.axis,split:node.row.point[node.axis],bound,best:{...best},prune,far:far?.row.id??null});
    if(!prune)search(far);
  }
  const tree=kdBuild();search(tree);
  return {tree,frames,visited,best};
}
export function independentQueryOutcomes(eta=.8) {
  if(!finite(eta,0,1))throw new RangeError('Probability0…1 required.');
  return Array.from({length:16},(_,mask)=>{
    const bits=[0,1,2,3].map(i=>(mask>>i)&1),probability=bits.reduce((p,b)=>p*(b?eta:1-eta),1),majority=Number(bits.slice(0,3).reduce((s,b)=>s+b,0)>=2);
    return {bits,probability,majority,error:majority!==bits[3]};
  });
}
