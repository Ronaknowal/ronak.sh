// Small live mechanism calculations. No historical estimator fit or model replay.
export const REF=[0,1,2,20,24,28];
export const c=m=>m<2?0:2*Array.from({length:m-1},(_,i)=>1/(i+1)).reduce((a,b)=>a+b,0)-2*(m-1)/m;
export const fmt=(x,d=6)=>x===null||!Number.isFinite(x)?'undefined':Math.abs(x)>1e6||Math.abs(x)>0&&Math.abs(x)<1e-5?x.toExponential(5):Number(x.toFixed(d)).toString();
export function higher(values,q){if(!values.length||!Number.isFinite(q)||q<0||q>1)throw Error('A nonempty finite calibration and q in [0,1] are required.');return [...values].sort((a,b)=>a-b)[Math.ceil(q*(values.length-1))];}
export const selected=(scores,tau)=>scores.map((s,i)=>s>tau?i:null).filter(i=>i!==null);
export function meanFinite(values){const scale=Math.max(...values);if(!(scale>0)||!Number.isFinite(scale))throw Error('A positive finite reach is required.');const mean=scale*(values.reduce((s,v)=>s+v/scale,0)/values.length);if(!(mean>0)||!Number.isFinite(mean))throw Error('Mean reach is not representable.');return mean;}
export function neighbors(x,values,k,exclude=null){return values.map((v,id)=>({id,d:Math.abs(v-x)})).filter(o=>o.id!==exclude).sort((a,b)=>a.d-b.d||a.id-b.id).slice(0,k);}
export function lofState(values=REF,k=2,epsilon=0){
 if(values.some(x=>!Number.isFinite(x))||!Number.isInteger(k)||k<1||k>=values.length||epsilon<0||!Number.isFinite(epsilon))throw Error('Finite references, 1 ≤ k < n, and finite nonnegative ε are required.');
 const lists=values.map((v,i)=>neighbors(v,values,k,i)),r=lists.map(a=>a.at(-1).d),reach=lists.map(a=>a.map(o=>Math.max(o.d,r[o.id])));
 const lrd=reach.map(a=>{const m=Math.max(...a)===0?0:meanFinite(a),v=1/(m+epsilon);return Number.isFinite(v)&&v>0?v:null;});
 const factor=(a,q)=>q===null||a.some(o=>lrd[o.id]===null)?null:a.reduce((s,o)=>s+lrd[o.id]/q,0)/k;
 const training=lists.map((a,i)=>factor(a,lrd[i]));
 function query(x){if(!Number.isFinite(x))throw Error('Q must be finite.');const a=neighbors(x,values,k),reaches=a.map(o=>Math.max(o.d,r[o.id]));if(reaches.some(v=>!Number.isFinite(v)))throw Error('A query distance is not finite.');const m=Math.max(...reaches)===0?0:meanFinite(reaches),density=1/(m+epsilon);const d=Number.isFinite(density)&&density>0?density:null;const score=factor(a,d);return {neighbors:a,reach:reaches,mean:m,lrd:d,lof:Number.isFinite(score)?score:null};}
 return {values,k,epsilon,lists,r,reach,lrd,training,query};
}
export function expectedPaths(values,cap=3){
 // Exact gap-weighted expectation of axis-uniform cuts on this finite 1D fixture.
 const walk=(ids,depth)=>{if(ids.length<2||depth>=cap||values[ids[0]]===values[ids.at(-1)])return Object.fromEntries(ids.map(i=>[i,depth+c(ids.length)]));
 const span=values[ids.at(-1)]-values[ids[0]],out=Object.fromEntries(ids.map(i=>[i,0]));
 for(let j=1;j<ids.length;j++){const gap=values[ids[j]]-values[ids[j-1]];if(!gap)continue;const paths={...walk(ids.slice(0,j),depth+1),...walk(ids.slice(j),depth+1)};for(const i of ids)out[i]+=gap/span*paths[i];}return out;};
 const ids=values.map((_,i)=>i).sort((a,b)=>values[a]-values[b]||a-b);return walk(ids,0);
}
export const rbf=(x,y,g=1)=>Math.exp(-g*(x-y)**2);
export function twoAnchor(q,g=1,a=1){const pieces=[.5*rbf(q,-a,g),.5*rbf(q,a,g)],rho=.5*(1+rbf(-a,a,g));return {pieces,raw:pieces[0]+pieces[1],rho,g:pieces[0]+pieces[1]-rho};}
export function episodes(rows,gap=1){return rows.reduce((out,r)=>{const last=out.at(-1);if(last&&r-last.at(-1)<=gap)last.push(r);else out.push([r]);return out;},[]);}
export function episodeMatches(groups,windows){return groups.map(g=>{const i=windows.findIndex(([lo,hi])=>g.some(r=>r>=lo&&r<=hi));return i<0?null:i;});}
export function precision(N,p,t,f){const targets=N*p,trueAlerts=targets*t,others=(N-targets)*f,total=trueAlerts+others;return {targets,trueAlerts,others,total,precision:total?trueAlerts/total:null};}
export function gaussianShares(q){const p=[-1,1].map(m=>.5*Math.exp(-((q-m)**2)/2)/Math.sqrt(2*Math.PI)),total=p[0]+p[1];return {p,total,shares:total?p.map(v=>v/total):[null,null]};}
export function pairUpdate(alpha,K,C,i,j,requested=null){
 const raw=K.map(row=>row.reduce((s,v,k)=>s+v*alpha[k],0)),lo=Math.max(-alpha[i],alpha[j]-C),hi=Math.min(C-alpha[i],alpha[j]),eta=K[i][i]+K[j][j]-2*K[i][j];
 let delta=requested;if(delta===null){if(eta>0)delta=Math.max(lo,Math.min(hi,(raw[j]-raw[i])/eta));else {const change=d=>(raw[i]-raw[j])*d+.5*eta*d*d;delta=[lo,0,hi].reduce((best,d)=>change(d)<change(best)?d:best,0);}}
 if(!Number.isFinite(delta)||delta<lo-1e-12||delta>hi+1e-12)throw Error(`Feasible pair delta must lie in [${fmt(lo)}, ${fmt(hi)}].`);
 const next=[...alpha];next[i]+=delta;next[j]-=delta;const objective=.5*alpha.reduce((s,a,k)=>s+a*raw[k],0),newRaw=K.map(row=>row.reduce((s,v,k)=>s+v*next[k],0)),newObjective=.5*next.reduce((s,a,k)=>s+a*newRaw[k],0);return {alpha:next,raw:newRaw,lo,hi,eta,delta,before:objective,after:newObjective};
}
export function certificate(alpha,K,C,tol=1e-8){const raw=K.map(row=>row.reduce((s,v,j)=>s+v*alpha[j],0)),free=alpha.map((a,i)=>a>1e-10&&a<C-1e-10?i:null).filter(i=>i!==null),capped=alpha.map((a,i)=>a>=C-1e-10?i:null).filter(i=>i!==null),zero=alpha.map((a,i)=>a<=1e-10?i:null).filter(i=>i!==null);let rho,kind,interval;
 if(free.length){rho=free.reduce((s,i)=>s+raw[i],0)/free.length;kind='Free-support mean';interval=[rho,rho];}else if(zero.length){const lo=Math.max(...capped.map(i=>raw[i])),hi=Math.min(...zero.map(i=>raw[i]));interval=[lo,hi];rho=(lo+hi)/2;kind=lo<=hi+1e-10?'No-free KKT interval':'Invalid no-free interval';}else {rho=Math.max(...raw);interval=[rho,rho];kind='ν=1 all-capped convention';}
 const Q=.5*alpha.reduce((s,a,i)=>s+a*raw[i],0),slack=raw.map(v=>Math.max(0,rho-v)),P=Q+C*slack.reduce((s,v)=>s+v,0)-rho,D=-Q,gap=P-D;return {raw,rho,kind,interval,Q,P,D,gap,slack,converged:gap>=-1e-10&&gap<=tol*Math.max(1,Math.abs(P))};
}
export function smallOneClass(values=[-1,0,1],gamma=1,nu=.5,budget=20){if(!Number.isFinite(gamma)||gamma<=0||!Number.isFinite(nu)||nu<=0||nu>1||!Number.isInteger(budget)||budget<0||budget>50)throw Error('Positive γ, ν in (0,1], and integer budget0…50 required.');const n=values.length,C=1/(nu*n),K=values.map(x=>values.map(y=>rbf(x,y,gamma)));let alpha=Array(n).fill(1/n),trace=[certificate(alpha,K,C)];
 for(let step=0;step<budget&&!trace.at(-1).converged;step++){let best=null;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const p=pairUpdate(alpha,K,C,i,j);if(!best||p.after-p.before<best.after-best.before)best={...p,i,j};}if(!best||best.before-best.after<1e-16)break;alpha=best.alpha;trace.push({...certificate(alpha,K,C),pair:[best.i,best.j],delta:best.delta});}return {K,C,alpha,trace,...trace.at(-1)};}
export function fourRowTree(rootCut=.5,cap=2,query=2){if(!Number.isFinite(rootCut)||rootCut<=0||rootCut>=3||!Number.isInteger(cap)||cap<0||cap>6||!Number.isFinite(query))throw Error('Root cut must be inside(0,3), cap0…6 integer, query finite.');const values=[0,1,2,3],nodes=[];
 function build(ids,depth){const index=nodes.length,node={index,ids,depth,population:ids.length,feature:-1,cut:null,left:-1,right:-1};nodes.push(node);if(depth>=cap||ids.length<2)return index;const lo=values[ids[0]],hi=values[ids.at(-1)],cut=depth===0?rootCut:[1.5,2.5,.5].find(v=>v>lo&&v<hi)??(lo+hi)/2;node.feature=0;node.cut=cut;node.left=build(ids.filter(i=>values[i]<cut),depth+1);node.right=build(ids.filter(i=>values[i]>=cut),depth+1);return index;}
 build([0,1,2,3],0);let i=0,visited=[0];while(nodes[i].left>=0){i=query<nodes[i].cut?nodes[i].left:nodes[i].right;visited.push(i);}const leaf=nodes[i];return {values,nodes,visited,leaf,path:leaf.depth+c(leaf.population)};}
export function twoAnchorIntervals(gamma,a=1){const g=q=>.5*(Math.exp(-4*gamma*a*a)*Math.expm1(-gamma*((q+a)**2-4*a*a))+Math.expm1(-gamma*(q-a)**2));
 if(g(0)>=0)return {intervals:[[-a,a]],inner:0,status:'Center admitted; one interval'};
 // Locate a positive interior point with the cancellation-resistant difference.
 let positive=null;for(let i=1;i<=52;i++){const q=a-a*2**(-i);if(g(q)>0){positive=q;break;}}
 if(positive===null)return {intervals:null,inner:a,status:'Inner boundary is unresolved at coordinate precision; analytic anchors remain g=0, no empty-region claim'};
 let lo=0,hi=positive;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(g(mid)>0)hi=mid;else lo=mid;}const inner=(lo+hi)/2;return {intervals:[[-a,-inner],[inner,a]],inner,status:'Two intervals; inner roots from stable bounded bisection'};}
export function visitedIsolation(values,cuts,query,cap=3){let ids=values.map((_,i)=>i).sort((a,b)=>values[a]-values[b]||a-b),steps=[],domains=[],error=null;for(let d=0;d<cap;d++){const lo=values[ids[0]],hi=values[ids.at(-1)],active=ids.length>1&&lo<hi&&!error;domains.push({active,lo,hi});if(!active)continue;const cut=cuts[d];if(!Number.isFinite(cut)||cut<=lo||cut>=hi){error=`Cut${d+1} must be strictly inside (${fmt(lo)}, ${fmt(hi)}).`;continue;}const left=ids.filter(i=>values[i]<cut),right=ids.filter(i=>values[i]>=cut),next=query<cut?left:right;steps.push({depth:d,cut,ids:[...ids],left,right,next});ids=next;}const depth=steps.length;return {steps,domains,error,ids,depth,path:error?null:depth+c(ids.length)};}
export function suppliedSupport(candidate,kernelBuilder=gamma=>(x,y)=>Math.exp(-gamma*x.reduce((s,v,i)=>s+(v-y[i])**2,0))){
 const {reference,features,rowIds,alpha,gamma,rho,C}=candidate,n=reference.length,d=features.length;
 if(!n||!d||rowIds.length!==n||new Set(rowIds).size!==n||new Set(features).size!==d||reference.some(r=>r.length!==d||r.some(v=>!Number.isFinite(v)))||alpha.length!==n||alpha.some(v=>!Number.isFinite(v)||v<0||v>C)||Math.abs(alpha.reduce((a,b)=>a+b,0)-1)>1e-12||!Number.isFinite(rho)||!Number.isFinite(gamma)||gamma<=0)throw Error('The supplied candidate is not a coherent finite support bundle.');
 // This constructor is deliberately called before the returned bundle exists.
 const kernel=kernelBuilder(gamma);if(typeof kernel!=='function')throw Error('No fitted kernel was constructed.');
 const rows=reference.map(r=>Object.freeze([...r])),weights=Object.freeze([...alpha]),names=Object.freeze([...features]),ids=Object.freeze([...rowIds]);
 const score=q=>{if(!Array.isArray(q)||q.length!==d||q.some(v=>!Number.isFinite(v)))throw Error(`Query requires ${d} finite fitted feature columns in order ${names.join(', ')}.`);const raw=rows.reduce((s,r,i)=>s+weights[i]*kernel(q,r),0);if(!Number.isFinite(raw))throw Error('Kernel query is not finite.');return {raw,g:raw-rho};};
 return Object.freeze({reference:Object.freeze(rows),features:names,rowIds:ids,alpha:weights,gamma,rho,C,score});
}
