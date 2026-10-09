import { sum, dot } from './recommender-flow-evidence-models.js';
import { positiveDefiniteSolve } from './recommender-flow-factor-models.js';

export const implicitDefaults=()=>({Q:[[1,0],[0,1],[1,1]],counts:[2,0,1],alpha:2,lambda:1,
  dimension:2,includeMissing:true,point:[0,0],target:2,term:0,signed:[5,-4,3]});

export function implicitAssembly(Q,counts,alpha,lambda,includeMissing=true){
  const dimension=Q[0].length;
  const targets=counts.map(count=>Number(count>0)),confidence=counts.map(count=>1+alpha*count);
  const gram=Array.from({length:dimension},(_,row)=>Array.from({length:dimension},(_,column)=>sum(Q.map(q=>q[row]*q[column]))));
  const terms=Q.map((q,item)=>({item,q,count:counts[item],target:targets[item],confidence:confidence[item],
    outer:q.map(left=>q.map(right=>left*right)),correction:q.map(left=>q.map(right=>(confidence[item]-1)*left*right)),
    right:q.map(value=>confidence[item]*targets[item]*value)}));
  const A=Array.from({length:dimension},(_,row)=>Array.from({length:dimension},(_,column)=>
    sum(terms.filter(term=>includeMissing||term.target).map(term=>term.confidence*term.outer[row][column]))+(row===column?lambda:0)));
  const b=Array.from({length:dimension},(_,coordinate)=>sum(terms.map(term=>term.right[coordinate])));
  const solved=positiveDefiniteSolve(A,b);
  return{Q,counts,alpha,lambda,includeMissing,targets,confidence,gram,terms,A,b,...solved};
}

export function implicitObjective(assembly,p){
  const terms=assembly.terms.filter(term=>assembly.includeMissing||term.target).map(term=>({...term,score:dot(p,term.q),
    weighted:term.confidence*(term.target-dot(p,term.q))**2}));
  const penalty=assembly.lambda*dot(p,p);
  return{terms,penalty,loss:sum(terms.map(term=>term.weighted))+penalty,
    gradient:assembly.A.map((row,k)=>2*(dot(row,p)-assembly.b[k]))};
}

export function implicitContourPaths(assembly,levels=[.1,.5,1]){
  if(!assembly.available||assembly.p.length<2)return[];
  // Other coordinates stay at their block minimizer. The 2×2 principal slice
  // has curvature zᵀA z; diagonalize that actual slice for exact level paths.
  const a=assembly.A[0][0],b=assembly.A[0][1],d=assembly.A[1][1];
  const discriminant=Math.hypot(a-d,2*b),eigenvalues=[(a+d+discriminant)/2,(a+d-discriminant)/2];
  if(eigenvalues[1]<=0)return[];
  const angle=.5*Math.atan2(2*b,a-d),c=Math.cos(angle),s=Math.sin(angle);
  return levels.map((level,index)=>({level,hue:index,points:Array.from({length:97},(_,position)=>{
    const t=position/96*2*Math.PI,x=Math.sqrt(level/eigenvalues[0])*Math.cos(t),y=Math.sqrt(level/eigenvalues[1])*Math.sin(t);
    return[assembly.p[0]+c*x-s*y,assembly.p[1]+s*x+c*y];
  })}));
}

export function implicitDecomposition(assembly,target){
  if(!assembly.available)return{available:false,reason:assembly.reason};
  const action=positiveDefiniteSolve(assembly.A,assembly.Q[target]);
  if(!action.available)return action;
  const contributions=assembly.terms.filter(term=>term.target).map(term=>({item:term.item,confidence:term.confidence,
    dot:dot(term.q,action.p),value:term.confidence*dot(term.q,action.p)}));
  return{available:true,v:action.p,contributions,total:sum(contributions.map(term=>term.value)),direct:dot(assembly.p,assembly.Q[target]),residual:action.residual};
}

export function signedPackageAssembly(Q,signed,lambda,storeZeroFault=false){
  const dimension=Q[0].length;
  const gram=Array.from({length:dimension},(_,row)=>Array.from({length:dimension},(_,column)=>sum(Q.map(q=>q[row]*q[column]))));
  const stored=signed.flatMap((value,item)=>value===0&&!storeZeroFault?[]:[{item,value,confidence:Math.abs(value),target:Number(value>0),q:Q[item]}]);
  const corrections=stored.map(term=>({...term,outer:term.q.map(left=>term.q.map(right=>(term.confidence-1)*left*right)),right:term.q.map(value=>term.target*term.confidence*value)}));
  const A=gram.map((row,r)=>row.map((value,c)=>value+sum(corrections.map(term=>term.outer[r][c]))+(r===c?lambda:0)));
  const b=Array.from({length:dimension},(_,coordinate)=>sum(corrections.map(term=>term.right[coordinate])));
  return{gram,stored,corrections,A,b,...positiveDefiniteSolve(A,b)};
}

export function easeWeights(X,lambda,target){
  const users=X.length,items=X[0].length;
  const gram=Array.from({length:items},(_,row)=>Array.from({length:items},(_,column)=>sum(X.map(user=>user[row]*user[column]))));
  const G=gram.map((row,r)=>row.map((value,c)=>value+(r===c?lambda:0)));
  const actions=Array.from({length:items},(_,column)=>positiveDefiniteSolve(G,Array.from({length:items},(_,row)=>Number(row===column))));
  if(actions.some(action=>!action.available))return{available:false,gram,G,reason:'The full EASE Gram has no numerically unique positive-curvature solve.'};
  const P=Array.from({length:items},(_,row)=>actions.map(action=>action.p[row]));
  const B=P.map((row,r)=>row.map((value,c)=>r===c?0:-value/P[c][c]));
  const others=Array.from({length:items},(_,item)=>item).filter(item=>item!==target);
  const Z=X.map(row=>others.map(item=>row[item])),y=X.map(row=>row[target]);
  const A=others.map((left,r)=>others.map((right,c)=>gram[left][right]+(r===c?lambda:0)));
  const b=others.map(item=>gram[item][target]);
  const excluded=others.length?positiveDefiniteSolve(A,b):{available:true,p:[],residual:[]};
  if(!excluded.available)return{available:false,gram,G,reason:'The excluded-column direct solve is numerically unavailable at its own matrix scale.'};
  const column=Array(items).fill(0);others.forEach((item,k)=>column[item]=excluded.p?.[k]??null);
  const scores=X.map(row=>Array.from({length:items},(_,item)=>sum(row.map((value,input)=>value*B[input][item]))));
  const gamma=1/P[target][target]-lambda;
  const constraintResidual=G.map((row,k)=>dot(row,B.map(values=>values[target]))-gram[k][target]+gamma*Number(k===target));
  return{available:true,users,items,gram,G,P,B,scores,others,Z,y,A,b,excluded,column,gamma,constraintResidual};
}

export function historyStructure(events,users,items){
  const histories=Array.from({length:users},()=>new Set()),nu=Array(users).fill(0),ni=Array(items).fill(0),tj=Array(items).fill(0);
  for(const event of events){histories[event.user].add(event.item);nu[event.user]++;ni[event.item]++;}
  const unique=histories.map(set=>[...set].sort((a,b)=>a-b));
  unique.forEach((history,user)=>history.forEach(item=>tj[item]+=nu[user]));
  return{histories:unique,nu,ni,tj};
}

export function historyRepresentation(state,user,occurrences){
  const history=occurrences??state.structure.histories[user];
  const totals=state.P[user].map((_,coordinate)=>sum(history.map(item=>state.Y[item][coordinate])));
  const contribution=totals.map(value=>history.length?value/Math.sqrt(history.length):0);
  return{history,totals,contribution,h:state.P[user].map((value,k)=>value+contribution[k])};
}

export function historyScore(state,user,item,occurrences){
  const representation=historyRepresentation(state,user,occurrences);
  return{...representation,score:state.mu+state.bu[user]+state.bi[item]+dot(state.Q[item],representation.h)};
}

export function historyObjective(state,events,lambda){
  const residual=sum(events.map(event=>(event.rating-historyScore(state,event.user,event.item).score)**2))/2;
  const norm=sum([...state.P,...state.Q,...state.Y].map(row=>dot(row,row)))+dot(state.bu,state.bu)+dot(state.bi,state.bi);
  return{residual,penalty:lambda*norm/2,loss:residual+lambda*norm/2};
}

export function historyStep(state,event,eta,lambda){
  const {user,item,rating}=event;
  const old=historyScore(state,user,item),p=state.P[user],q=state.Q[item],history=old.history;
  if(!state.structure.nu[user]||!state.structure.ni[item]||!history.includes(item))return{available:false,reason:'The selected event is outside this declared training population.'};
  const error=rating-old.score;
  const gp=p.map((value,k)=>-error*q[k]+lambda/state.structure.nu[user]*value);
  const gq=q.map((value,k)=>-error*old.h[k]+lambda/state.structure.ni[item]*value);
  const gy=history.map(j=>state.Y[j].map((value,k)=>-error*q[k]/Math.sqrt(history.length)+lambda/state.structure.tj[j]*value));
  const gbu=-error+lambda/state.structure.nu[user]*state.bu[user],gbi=-error+lambda/state.structure.ni[item]*state.bi[item];
  const next={...state,P:state.P.map(row=>[...row]),Q:state.Q.map(row=>[...row]),Y:state.Y.map(row=>[...row]),bu:[...state.bu],bi:[...state.bi]};
  next.P[user]=p.map((value,k)=>value-eta*gp[k]);next.Q[item]=q.map((value,k)=>value-eta*gq[k]);
  history.forEach((j,position)=>next.Y[j]=state.Y[j].map((value,k)=>value-eta*gy[position][k]));
  next.bu[user]-=eta*gbu;next.bi[item]-=eta*gbi;
  if(lambda>0){next.P.forEach((row,u)=>{if(!state.structure.nu[u]){next.P[u]=row.map(()=>0);next.bu[u]=0;}});
    next.Q.forEach((row,i)=>{if(!state.structure.ni[i]){next.Q[i]=row.map(()=>0);next.bi[i]=0;}if(!state.structure.tj[i])next.Y[i]=row.map(()=>0);});}
  const valid=[...next.P.flat(),...next.Q.flat(),...next.Y.flat(),...next.bu,...next.bi].every(value=>Number.isFinite(value)&&Math.abs(value)<=1e4);
  return{available:valid,old,error,gp,gq,gy,gbu,gbi,next:valid?next:null,reason:valid?null:'The proposed history parameter leaves the finite ±10000 context; last valid buffers remain.'};
}

export function historyTrace(initial,events,eta,lambda,epochs){
  const states=[{epoch:0,state:initial,...historyObjective(initial,events,lambda)}];
  let unavailable=null;
  for(let epoch=1;epoch<=epochs;epoch++){
    let state=states.at(-1).state;
    if(lambda>0){state={...state,P:state.P.map((row,user)=>state.structure.nu[user]?row:[...row].fill(0)),
      Q:state.Q.map((row,item)=>state.structure.ni[item]?row:[...row].fill(0)),Y:state.Y.map((row,item)=>state.structure.tj[item]?row:[...row].fill(0)),
      bu:state.bu.map((value,user)=>state.structure.nu[user]?value:0),bi:state.bi.map((value,item)=>state.structure.ni[item]?value:0)};}
    for(const event of events){const step=historyStep(state,event,eta,lambda);if(!step.available){unavailable={epoch,event:event.id,reason:step.reason,lastValidState:state,lastValidObjective:historyObjective(state,events,lambda)};break;}state=step.next;}
    if(unavailable)break;states.push({epoch,state,...historyObjective(state,events,lambda)});
  }
  return{states,unavailable,order:'Declared supplied occurrence order; no shuffle or new scientific fit.'};
}
