import { dot, sum } from './recommender-flow-evidence-models.js';
import { positiveDefiniteSolve } from './recommender-flow-factor-models.js';
import { implicitAssembly } from './recommender-flow-implicit-models.js';

export function savedExplicitForward(state, rawUser, rawItem, clip=false) {
  const user=Object.hasOwn(state.userMap,rawUser)?state.userMap[rawUser]:null;
  const item=Object.hasOwn(state.itemMap,rawItem)?state.itemMap[rawItem]:null;
  const history=user===null?[]:state.histories[user];
  const totals=state.P[0].map((_,k)=>sum(history.map(id=>state.Y[id][k])));
  const contribution=totals.map(value=>history.length?value/Math.sqrt(history.length):0);
  const p=user===null?state.P[0].map(()=>0):state.P[user];
  const h=p.map((value,k)=>value+contribution[k]);
  const q=item===null?state.Q[0].map(()=>0):state.Q[item];
  const products=q.map((value,k)=>user!==null&&item!==null?value*h[k]:0);
  const bu=user===null?0:state.bu[user],bi=item===null?0:state.bi[item];
  const raw=state.mu+bu+bi+sum(products);
  return{user,item,history,totals,contribution,p,h,q,products,bu,bi,raw,score:clip?Math.min(5,Math.max(1,raw)):raw,clip};
}

export function csrConfidence(counts,alpha) {
  const indptr=[0],indices=[],data=[];
  counts.forEach(row=>{row.forEach((count,item)=>{if(count>0){indices.push(item);data.push(1+alpha*count);}});indptr.push(indices.length);});
  return{indptr,indices,data,shape:[counts.length,counts[0].length]};
}
export const alsWitness=()=>({version:'Constructed witness, not a new package fit',alpha:2,packageAlpha:1,lambda:1,
  counts:[[1,0,0],[0,0,0]],P:[[.6,0],[0,0]],Q:[[0,1],[0,1],[1,0]],oldQ:[[1,0],[1,0],[0,1]]});
export function savedImplicitForward(state,user,recalculate,candidates) {
  const csr=csrConfidence(state.counts,state.alpha),assembly=implicitAssembly(state.Q,state.counts[user],state.alpha,state.lambda);
  const p=recalculate?assembly.p:state.P[user];
  if(!assembly.available)return{available:false,reason:assembly.reason,csr,assembly};
  const rows=state.Q.map((q,item)=>({item,count:state.counts[user][item],confidence:1+state.alpha*state.counts[user][item],q,
    stored:dot(state.P[user],q),recalculated:dot(assembly.p,q),score:dot(p,q),eligible:state.counts[user][item]===0&&candidates.includes(item)}));
  const ranked=rows.filter(row=>row.eligible).sort((a,b)=>b.score-a.score||a.item-b.item);
  return{available:true,csr,assembly,p,stored:state.P[user],rows,ranked,selected:ranked.slice(0,10)};
}

export const metadataDefaults=()=>({X:[[1,0],[0,1],[1,1]],Q:[[1,0],[0,1],[2,1]],lambda:.5,feature:[1,.5],users:[[1,0],[0,1],[0,0]]});
export function metadataProjection(state,user) {
  const featureCount=state.X[0].length,dimension=state.Q[0].length;
  const gram=Array.from({length:featureCount},(_,r)=>Array.from({length:featureCount},(_,c)=>sum(state.X.map(row=>row[r]*row[c]))));
  const A=gram.map((row,r)=>row.map((value,c)=>value+(r===c?state.lambda:0)));
  const b=Array.from({length:featureCount},(_,r)=>Array.from({length:dimension},(_,k)=>sum(state.X.map((row,item)=>row[r]*state.Q[item][k]))));
  const solves=Array.from({length:dimension},(_,k)=>positiveDefiniteSolve(A,b.map(row=>row[k])));
  if(solves.some(row=>!row.available))return{available:false,gram,A,b,reason:'Metadata feature columns do not have a unique supported ridge map.'};
  const W=A.map((_,r)=>solves.map(row=>row.p[r]));
  const products=W.map((row,r)=>row.map(value=>state.feature[r]*value));
  const q=Array.from({length:dimension},(_,k)=>sum(products.map(row=>row[k])));
  const p=user===null?null:state.users[user],score=p===null?null:dot(p,q);
  return{available:true,gram,A,b,W,products,q,p,score};
}

export const servingCatalogue=()=>[
  {id:0,release:0,category:'A',q:[1,0]}, {id:1,release:10,category:'A',q:[2,0]},
  {id:2,release:30,category:'B',q:[5,0]}, {id:3,release:0,category:'A',q:[1.5,0]},
  {id:4,release:0,category:'B',q:[.5,0]}, {id:5,release:0,category:'C',q:[.25,0]}, {id:6,release:0,category:'C',q:[0,0]}];
export function servingSlate(tick,candidates,quota) {
  const history=[{id:'purchase-I0',item:0,tick:5},{id:'purchase-I4',item:4,tick:25}];
  const past=history.filter(row=>row.tick<=tick),future=history.filter(row=>row.tick>tick),p=[1,0];
  const rows=servingCatalogue().map(row=>{const reasons=[];
    if(!candidates.includes(row.id))reasons.push('outside candidates');if(row.release>tick)reasons.push('future release');
    if(past.some(event=>event.item===row.id))reasons.push('known purchase');
    return{...row,reasons,products:row.q.map((value,k)=>value*p[k]),score:dot(p,row.q)};});
  const ranked=rows.filter(row=>!row.reasons.length).sort((a,b)=>b.score-a.score||a.id-b.id);
  const categories={},issued=[],trace=[];
  ranked.forEach(row=>{const keep=issued.length<2&&(categories[row.category]??0)<quota;
    const reason=keep?'issued':issued.length>=2?'slots already filled':'category cap';
    if(keep){issued.push(row);categories[row.category]=(categories[row.category]??0)+1;}trace.push({...row,keep,reason});});
  return{history,past,future,p,rows,ranked,trace,issued,unfilled:2-issued.length};
}

export function retrievalGeometry(vector,bias,rule) {
  const p=[1,0],Q=[[2,2],vector,[0,0]],biases=[0,bias,0];
  const rows=Q.map((q,item)=>{const products=q.map((value,k)=>value*p[k]),value=sum(products),norm=Math.hypot(...q);
    const augmentedP=[...p,1],augmentedQ=[...q,biases[item]],augmented=dot(augmentedP,augmentedQ),augmentedNorm=Math.hypot(...augmentedQ);
    const cosine=norm?value/norm:null,augmentedCosine=augmentedNorm?augmented/(Math.hypot(...augmentedP)*augmentedNorm):null;
    const score=rule==='cosine'?cosine:rule==='augmented-cosine'?augmentedCosine:rule==='augmented-dot'?augmented:value;
    return{item,q,bias:biases[item],products,dot:value,norm,cosine,augmentedP,augmentedQ,augmented,augmentedCosine,score};});
  return{p,rows,ranked:rows.filter(row=>row.score!==null).sort((a,b)=>b.score-a.score||a.item-b.item)};
}

export const encoderFeatures=[[1,0],[0,1],[1,1]],encoderHistory=[{id:'H0',item:0,tick:2},{id:'H1',item:0,tick:4},{id:'H2',item:2,tick:21}];
export const encoderWeights={history:[[.5,0],[0,1]],item:[[1,.5],[0,1]],context:[[.2,-.1]]};
export function encoderForward(tick,stale=false) {
  const prefix=encoderHistory.filter(row=>row.tick<=tick),future=encoderHistory.filter(row=>row.tick>tick);
  const pooled=[0,1].map(k=>prefix.length?sum(prefix.map(row=>encoderFeatures[row.item][k]))/prefix.length:0);
  const historyProducts=encoderWeights.history.map((row,r)=>row.map(value=>value*pooled[r]));
  const p=[0,1].map(k=>sum(historyProducts.map(row=>row[k]))+encoderWeights.context[0][k]);
  const Q=encoderFeatures.map(feature=>[0,1].map(k=>sum(feature.map((value,r)=>value*encoderWeights.item[r][k]))));
  const scores=stale?null:Q.map(q=>dot(p,q));
  // A declared joint nonlinear ranker is illustrative fixed arithmetic, not a fit.
  const joint=stale?null:encoderFeatures.map((feature,item)=>{const z=pooled[0]*feature[0]+pooled[1]*feature[1]-.5;
    return{item,z,relu:Math.max(0,z),dot:scores[item],score:scores[item]+Math.max(0,z)};});
  return{available:!stale,prefix,future,pooled,historyProducts,p,Q,scores,joint,encoderVersion:'encoder-v1',cacheVersion:stale?'encoder-v0':'encoder-v1',reason:stale?'Cached item vectors belong to a different encoder version.':null};
}

export function graphPropagation(R,initial,depth) {
  const users=R.length,items=R[0].length,N=users+items;
  const edges=R.flatMap((row,user)=>row.flatMap((present,item)=>present?[{user,item,node:users+item}]:[]));
  const degrees=Array(N).fill(0);edges.forEach(edge=>{degrees[edge.user]++;degrees[edge.node]++;});
  const weighted=edges.map(edge=>({...edge,weight:1/Math.sqrt(degrees[edge.user]*degrees[edge.node])}));
  const operator=Array.from({length:N},()=>Array(N).fill(0));weighted.forEach(edge=>{operator[edge.user][edge.node]=edge.weight;operator[edge.node][edge.user]=edge.weight;});
  const layers=[initial.slice()],products=[];
  for(let stage=0;stage<depth;stage++) {const old=layers.at(-1),next=Array(N).fill(0);
    const current=weighted.map(edge=>({...edge,oldUser:old[edge.user],oldItem:old[edge.node],toUser:edge.weight*old[edge.node],toItem:edge.weight*old[edge.user]}));
    current.forEach(row=>{next[row.user]+=row.toUser;next[row.node]+=row.toItem;});products.push(current);layers.push(next);}
  const mixed=Array.from({length:N},(_,node)=>sum(layers.map(layer=>layer[node]))/layers.length);
  const scores=Array.from({length:users},(_,user)=>Array.from({length:items},(_,item)=>mixed[user]*mixed[users+item]));
  return{users,items,N,edges:weighted,degrees,operator,layers,products,mixed,scores};
}
