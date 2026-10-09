// Small teaching models for the accepted quantile and intrinsic investigations.
// These compute current browser states; Python execution records remain separate.
export function quantileBarycentre(lambda=.5,unequal=false){
  if(!Number.isFinite(lambda)||lambda<0||lambda>1)throw new RangeError('Barycentre weight must be in [0,1]');
  const a=unequal?[.25,.75]:[.5,.5],b=[.5,.5],x=[0,2],y=unequal?[1,5]:[2,4];
  const cuts=unequal?[0,.25,.5,1]:[0,.5,1];
  const intervals=cuts.slice(0,-1).map((lo,i)=>{const hi=cuts[i+1],u=(lo+hi)/2,A=u<a[0]?0:1,B=u<b[0]?0:1;return{lo,hi,mass:hi-lo,x:x[A],y:y[B],position:(1-lambda)*x[A]+lambda*y[B],A,B};});
  const aggregate=new Map();for(const r of intervals)aggregate.set(r.position,(aggregate.get(r.position)||0)+r.mass);
  const atoms=[...aggregate].sort((p,q)=>p[0]-q[0]);
  const costA=intervals.reduce((s,r)=>s+r.mass*(r.position-r.x)**2,0),costB=intervals.reduce((s,r)=>s+r.mass*(r.position-r.y)**2,0);
  return{x,y,a,b,intervals,locations:atoms.map(r=>r[0]),weights:atoms.map(r=>r[1]),costA,costB,objective:(1-lambda)*costA+lambda*costB};
}
export const intrinsicSource=[[0,0],[1,0],[0,2]],intrinsicTarget=[[5,10],[7,10],[7,11]];
export const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
export const distances=points=>points.map(p=>points.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])));
export function intrinsicCoupling(permutation=3,mix=0){
  if(!Number.isInteger(permutation)||permutation<0||permutation>5||!Number.isFinite(mix)||mix<0||mix>1)throw new RangeError('Invalid intrinsic comparison');
  const perm=permutations[permutation],D=distances(intrinsicSource),E=distances(intrinsicTarget),plan=perm.map(j=>perm.map((_,k)=>(j===k?(1-mix)/3:0)+mix/9));
  let loss=0;const terms=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)for(let l=0;l<3;l++){const value=(D[i][k]-E[j][l])**2*plan[i][j]*plan[k][l];loss+=value;terms.push({i,j,k,l,value});}
  return{perm,D,E,plan,loss,terms};
}
