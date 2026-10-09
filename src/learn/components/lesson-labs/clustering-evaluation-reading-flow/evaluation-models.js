export const six = [0, 1, 2, 7, 8, 9];
export const probe = [0, 1, 4, 5, 8, 9];
export const U = [0,0,0,0,1,1,1,1], S = [0,0,0,1,0,1,1,1], R = [0,0,1,1,2,2,3,3];
export const ids6 = [...'ABCDEF'], ids8 = [...'ABCDEFGH'];
export const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
export const choose = (n,k) => { if(k<0 || k>n)return 0; let p=1;for(let j=1;j<=Math.min(k,n-k);j++)p=p*(n-j+1)/j;return p; };
export const groups = labels => [...new Set(labels)];
export const distance = (a,b,w) => Math.sqrt(a.reduce((s,v,j)=>s+(w?.[j]??1)*(v-b[j])**2,0));
export function silhouette(rows, labels, weights) {
  if(rows.length!==labels.length || rows.some(r=>r.some(x=>!Number.isFinite(x))))throw new Error('Finite aligned rows required');
  const g=groups(labels);if(g.length<2 || g.length>=rows.length)return {valid:false,reason:'Require 2 ≤ occupied bins < number of observations',values:rows.map(()=>null),mean:null};
  const samples=rows.map((row,i)=>{
    const own=[],foreign=new Map();
    rows.forEach((r,j)=>{if(i===j)return;const d=distance(row,r,weights);if(labels[j]===labels[i])own.push(d);else{if(!foreign.has(labels[j]))foreign.set(labels[j],[]);foreign.get(labels[j]).push(d);}});
    const a=own.length?mean(own):0,b=Math.min(...[...foreign.values()].map(mean));
    return {a,b,s:own.length?(Math.max(a,b)===0?0:(b-a)/Math.max(a,b)):0,own,foreign:[...foreign].map(([bin,edges])=>({bin,edges,mean:mean(edges)}))};
  });
  return {valid:true,samples,values:samples.map(s=>s.s),mean:mean(samples.map(s=>s.s))};
}
export function contingency(u,v){if(u.length!==v.length||!u.length)throw new Error('Same nonempty aligned IDs required');const a=groups(u),b=groups(v),cells=a.map(x=>b.map(y=>u.reduce((s,z,i)=>s+(z===x&&v[i]===y),0)));return {a,b,cells,rows:cells.map(r=>r.reduce((s,x)=>s+x,0)),cols:b.map((_,j)=>cells.reduce((s,r)=>s+r[j],0)),n:u.length};}
export function pairScores(u,v){const t=contingency(u,v),total=choose(t.n,2),tp=t.cells.flat().reduce((s,n)=>s+choose(n,2),0),ref=t.rows.reduce((s,n)=>s+choose(n,2),0),cand=t.cols.reduce((s,n)=>s+choose(n,2),0),fp=cand-tp,fn=ref-tp,tn=total-tp-fp-fn,expected=total?ref*cand/total:0,den=(ref+cand)/2-expected;return {...t,total,tp,fp,fn,tn,expected,ari:den===0?1:(tp-expected)/den,ri:total?(tp+tn)/total:1};}
export const entropy = counts => {const n=counts.reduce((s,x)=>s+x,0);return counts.reduce((s,x)=>x?s-x/n*Math.log2(x/n):s,0);};
export function information(cells){const rows=cells.map(r=>r.reduce((s,x)=>s+x,0)),cols=cells[0].map((_,j)=>cells.reduce((s,r)=>s+r[j],0)),n=rows.reduce((s,x)=>s+x,0);let mi=0;cells.forEach((r,i)=>r.forEach((x,j)=>{if(x)mi+=x/n*Math.log2(n*x/(rows[i]*cols[j]));}));return {hu:entropy(rows),hv:entropy(cols),mi};}
export function overlap(a,b,r,n=8){const lo=Math.max(0,a+b-n),hi=Math.min(a,b);if(![a,b,r].every(Number.isInteger)||a<1||a>=n||b<1||b>=n||r<lo||r>hi)throw new Error(`Overlap must be ${lo}…${hi} with bin sizes 1…${n-1}`);const states=Array.from({length:hi-lo+1},(_,j)=>{const z=lo+j,cells=[[z,a-z],[b-z,n-a-b+z]],count=choose(a,z)*choose(n-a,b-z),p=count/choose(n,b);return {r:z,cells,count,p,...information(cells)};});return {lo,hi,states,current:states.find(s=>s.r===r),emi:states.reduce((s,x)=>s+x.p*x.mi,0)};}
export const nmi = (hu,hv,mi,normalizer) => {const den={arithmetic:(hu+hv)/2,geometric:Math.sqrt(hu*hv),minimum:Math.min(hu,hv),maximum:Math.max(hu,hv)}[normalizer];return den===0?(hu===0&&hv===0?1:0):mi/den;};
function compareCenters(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]-b[i];}return 0;}
export function fitLine(x,counts,k){if(x.length!==counts.length||k<1||k>x.length||x.some((v,i)=>!Number.isFinite(v)||i>0&&v<=x[i-1])||counts.some(w=>!Number.isFinite(w)||w<=0))throw new Error('Strictly ordered finite locations and positive counts required');
  let best=null;
  const visit=(cuts,start)=>{if(cuts.length===k-1){const ends=[0,...cuts,x.length],centers=[],costs=[];for(let g=0;g<k;g++){const lo=ends[g],hi=ends[g+1],mass=counts.slice(lo,hi).reduce((s,v)=>s+v,0),c=x.slice(lo,hi).reduce((s,v,j)=>s+counts[lo+j]*v,0)/mass;centers.push(c);costs.push(x.slice(lo,hi).reduce((s,v,j)=>s+counts[lo+j]*(v-c)**2,0));}const cost=costs.reduce((s,v)=>s+v,0);if(!best||cost<best.cost||cost===best.cost&&compareCenters(centers,best.centers)<0)best={cost,centers,cuts:[...cuts]};return;}for(let j=start;j<=x.length-(k-1-cuts.length);j++)visit([...cuts,j],j+1);};
  visit([],1);return {...best,labels:x.map(v=>{let index=0;best.centers.forEach((c,j)=>{if((v-c)**2<(v-best.centers[index])**2)index=j;});return index;})};
}
export function stability(x=probe,k=2,first=[3,3,1,1,1,1]){const a=fitLine(x,first,k),b=fitLine(x,[1,1,1,1,3,3],k);return {a,b,ari:pairScores(a.labels,b.labels).ari};}
export function support(runs,a,b){let together=0,seen=0;for(const run of runs){if(Object.hasOwn(run,a)&&Object.hasOwn(run,b)){seen++;if(run[a]===run[b])together++;}}return {together,seen,fraction:seen?together/seen:null};}
export const gapToy=[[0,0],[.2,.1],[-.2,-.1],[.1,-.2],[4,4],[4.1,4.2],[3.8,3.9],[4.2,3.8],[8,0],[8.2,.1],[7.8,-.1],[8.1,-.2]];
// New two-dimensional geometry arithmetic only. This does not fit clusters,
// generate reference samples, replay Gap, or replace its shape-aware SVD source.
export function frame2(rows=gapToy){const mu=[0,1].map(j=>mean(rows.map(r=>r[j]))),centered=rows.map(r=>r.map((v,j)=>v-mu[j])),xx=centered.reduce((s,r)=>s+r[0]**2,0),yy=centered.reduce((s,r)=>s+r[1]**2,0),xy=centered.reduce((s,r)=>s+r[0]*r[1],0),theta=.5*Math.atan2(2*xy,xx-yy),axes=[[Math.cos(theta),Math.sin(theta)],[-Math.sin(theta),Math.cos(theta)]],z=centered.map(r=>axes.map(a=>r[0]*a[0]+r[1]*a[1]));return {mu,axes,z,low:[0,1].map(j=>Math.min(...z.map(r=>r[j]))),high:[0,1].map(j=>Math.max(...z.map(r=>r[j])))};}
