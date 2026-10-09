import { covarianceFactor } from "./gaussian-covariance-family-models.mjs";
const finite=x=>typeof x==='number'&&Number.isFinite(x),sum=xs=>xs.reduce((a,b)=>a+b,0);
const pair=x=>Array.isArray(x)&&x.length===2&&x.every(finite);
const positive=x=>{if(!finite(x)||x<=0||x>1000)throw new RangeError('Finite positive bounded parameter required.');};
const matrix=a=>Array.isArray(a)&&a.length===2&&a.every(pair);
const add=(a,b)=>a.map((r,i)=>r.map((v,j)=>v+b[i][j]));
const scale=(a,c)=>a.map(r=>r.map(v=>v*c));
const outer=x=>x.map(v=>x.map(w=>v*w));
const quadratic=(x,a)=>x[0]*(a[0][0]*x[0]+a[0][1]*x[1])+x[1]*(a[1][0]*x[0]+a[1][1]*x[1]);
export function pairedInverse(a){const l=covarianceFactor(a),u=1/l[0][0],v=-l[1][0]/(l[0][0]*l[1][1]),w=1/l[1][1];return [[u*u+v*v,v*w],[v*w,w*w]];}
const logdet=a=>{const l=covarianceFactor(a);return 2*(Math.log(l[0][0])+Math.log(l[1][1]));};
// Positive-domain teaching primitives. Shift to >=16, then use the
// Stirling/digamma asymptotic series; no negative/complex continuation.
export function positiveLogGamma(value){positive(value);let x=value,shift=0;while(x<16){shift+=Math.log(x);x++;}const z=1/x,z2=z*z;return (x-.5)*Math.log(x)-x+.5*Math.log(2*Math.PI)+z*(1/12+z2*(-1/360+z2*(1/1260+z2*(-1/1680+z2/1188))))-shift;}
export function positiveDigamma(value){positive(value);let x=value,shift=0;while(x<16){shift-=1/x;x++;}const z=1/x,z2=z*z;return shift+Math.log(x)-z/2-z2*(1/12-z2*(1/120-z2*(1/252-z2*(1/240-z2/132))));}
export function finiteDirichlet(alpha0=1,counts=[2,2]){positive(alpha0);if(!pair(counts)||counts.some(x=>x<0||x>100))throw new RangeError('Two finite nonnegative counts required.');const alpha=counts.map(n=>alpha0+n),total=sum(alpha);return {alpha0,counts:[...counts],alpha,total,mean:alpha.map(a=>a/total),expectedLog:alpha.map(a=>positiveDigamma(a)-positiveDigamma(total)),logMean:alpha.map(a=>Math.log(a/total))};}
export const bayesianToyRows=[[-2,-1],[-2,1],[-1,0],[1,0],[2,-1],[2,1]];
export const bayesianToyShares=bayesianToyRows.map((_,i)=>i<3?[1,0]:[0,1]);
export const bayesianPrior={alpha:1,beta:1,mean:[0,0],degrees:3,inverseScale:[[1,0],[0,1]]};
export function priorPrecisionSlice(a,c){if(!finite(a)||!finite(c)||a<=0||c<=0)throw new RangeError('Positive diagonal precision entries required.');return Math.exp(-(a+c)/2)/(4*Math.PI);}
export function normalWishartUpdate(count,center,scatter,prior=bayesianPrior){
  if(!finite(count)||count<0||count>100||!pair(center)||!matrix(scatter)||!pair(prior.mean))throw new RangeError('Finite paired sufficient statistics required.');
  positive(prior.alpha);positive(prior.beta);positive(prior.degrees);if(prior.degrees<=1)throw new RangeError('Proper 2D Wishart requires degrees > 1.');covarianceFactor(prior.inverseScale);
  const tolerance=1e-12*Math.max(1,...scatter.flat().map(Math.abs)),cross=(scatter[0][1]+scatter[1][0])/2,a=scatter[0][0],c=scatter[1][1],least=(a+c-Math.hypot(a-c,2*cross))/2;
  if(Math.abs(scatter[0][1]-scatter[1][0])>tolerance||least< -tolerance)throw new RangeError('Symmetric positive-semidefinite scatter required.');
  const beta=prior.beta+count,degrees=prior.degrees+count,offset=center.map((v,i)=>v-prior.mean[i]),within=scale([[a,cross],[cross,c]],count),between=scale(outer(offset),prior.beta*count/beta);
  const inverseScale=add(add(prior.inverseScale,within),between),W=pairedInverse(inverseScale),mean=prior.mean.map((v,i)=>v+count/beta*offset[i]);
  return {count,center:[...center],scatter:scatter.map(r=>[...r]),alpha:prior.alpha+count,beta,degrees,mean,inverseScale,W,within,between,priorInverse:prior.inverseScale.map(r=>[...r])};
}
export function suppliedBayesianFactor(){return normalWishartUpdate(2,[1,0],[[.5,0],[0,.25]]);}
export function suppliedBayesianToy(){return [-1,1].map(sign=>normalWishartUpdate(3,[sign*5/3,0],[[2/9,0],[0,2/3]]));}
export function expectedLogAssignment(query=[0,0],factors=suppliedBayesianToy()){
  if(!pair(query)||query.some(v=>Math.abs(v)>100)||!Array.isArray(factors)||!factors.length||factors.length>6)throw new RangeError('Finite bounded paired query and factors required.');
  const total=sum(factors.map(f=>f.alpha)),components=factors.map(f=>{
    positive(f.alpha);positive(f.beta);positive(f.degrees);if(f.degrees<=1||!pair(f.mean))throw new RangeError('Proper paired factor required.');const logW=logdet(f.W),elogWeight=positiveDigamma(f.alpha)-positiveDigamma(total),digammaParts=[positiveDigamma(f.degrees/2),positiveDigamma((f.degrees-1)/2)],elogPrecision=sum(digammaParts)+2*Math.log(2)+logW,meanUncertainty=2/f.beta,offset=query.map((v,i)=>v-f.mean[i]),spatial=f.degrees*quadratic(offset,f.W),normalizer=Math.log(2*Math.PI),logDensity=.5*elogPrecision-normalizer-.5*(meanUncertainty+spatial);
    return {elogWeight,elogPrecision,digammaParts,logW,meanUncertainty,spatial,normalizer,logDensity,logRho:elogWeight+logDensity};
  });const maximum=Math.max(...components.map(c=>c.logRho)),lse=maximum+Math.log(sum(components.map(c=>Math.exp(c.logRho-maximum))));return {query:[...query],components,lse,shares:components.map(c=>Math.exp(c.logRho-lse)),logOdds:components.length===2?components[1].logRho-components[0].logRho:null};
}
const dirNormalizer=alpha=>positiveLogGamma(sum(alpha))-sum(alpha.map(positiveLogGamma));
const wishNormalizer=(inverse,degrees)=>degrees/2*logdet(inverse)-degrees*Math.log(2)-(.5*Math.log(Math.PI)+positiveLogGamma(degrees/2)+positiveLogGamma((degrees-1)/2));
export function suppliedBayesianElbo(){
  const factors=suppliedBayesianToy(),prior=bayesianPrior,alpha=factors.map(f=>f.alpha),logs=expectedLogAssignment([0,0],factors).components;
  let likelihood=0,assignmentPrior=0,parameterPrior=0,parameterQ=0;
  bayesianToyRows.forEach((x,n)=>{const parts=expectedLogAssignment(x,factors).components;bayesianToyShares[n].forEach((r,k)=>{likelihood+=r*parts[k].logDensity;assignmentPrior+=r*parts[k].elogWeight;});});
  const weightPrior=dirNormalizer([prior.alpha,prior.alpha])+sum(logs.map(c=>(prior.alpha-1)*c.elogWeight));
  const weightQ=dirNormalizer(alpha)+sum(logs.map((c,k)=>(alpha[k]-1)*c.elogWeight));
  factors.forEach((f,k)=>{const c=logs[k],offset=f.mean.map((v,i)=>v-prior.mean[i]),priorQuadratic=2/f.beta+f.degrees*quadratic(offset,f.W),normalPrior=.5*(2*Math.log(prior.beta)+c.elogPrecision-2*Math.log(2*Math.PI)-prior.beta*priorQuadratic),trace=sum([0,1].map(i=>sum([0,1].map(j=>prior.inverseScale[i][j]*f.W[j][i]))));
    const wishPrior=wishNormalizer(prior.inverseScale,prior.degrees)+.5*(prior.degrees-3)*c.elogPrecision-.5*f.degrees*trace;
    const normalQ=.5*(2*Math.log(f.beta)+c.elogPrecision-2*Math.log(2*Math.PI)-2),wishQ=wishNormalizer(f.inverseScale,f.degrees)+.5*(f.degrees-3)*c.elogPrecision-f.degrees;
    parameterPrior+=normalPrior+wishPrior;parameterQ+=normalQ+wishQ;
  });
  const terms=[{key:'expected_log_p_X',owner:'X | Z, μ, Λ',value:likelihood},{key:'expected_log_p_Z',owner:'Z | π',value:assignmentPrior},{key:'expected_log_p_pi',owner:'Dirichlet prior π',value:weightPrior},{key:'expected_log_p_mu_precision',owner:'Normal–Wishart prior μ, Λ',value:parameterPrior},{key:'negative_expected_log_q_Z',owner:'− log q(Z); hard rows',value:0},{key:'negative_expected_log_q_pi',owner:'− log q(π)',value:-weightQ},{key:'negative_expected_log_q_mu_precision',owner:'− log q(μ, Λ)',value:-parameterQ}];
  return {terms,total:sum(terms.map(t=>t.value)),normalizers:{priorDirichlet:dirNormalizer([1,1]),posteriorDirichlet:dirNormalizer(alpha),priorWishart:wishNormalizer(prior.inverseScale,3),posteriorWishart:factors.map(f=>wishNormalizer(f.inverseScale,f.degrees))}};
}
export function stickConventions(breaks=Array(6).fill(.5)){
  if(!Array.isArray(breaks)||breaks.length!==6||breaks.some(v=>!finite(v)||v<0||v>1))throw new RangeError('Six finite unit-interval breaks required.');
  const run=final=>{let remaining=1;const steps=breaks.map((v,k)=>{const fraction=final&&k===5?1:v,before=remaining,mass=before*fraction;remaining-=mass;return {index:k+1,before,fraction,mass,after:remaining};});const emitted=steps.map(s=>s.mass),total=sum(emitted);return {steps,emitted,leftover:remaining,total,normalized:total>0?emitted.map(v=>v/total):null};};return {emitted:run(false),finalResidual:run(true)};
}
export function stickPosterior(counts=[2,2,0,0,0,0],gamma=1){positive(gamma);if(!Array.isArray(counts)||counts.length!==6||counts.some(v=>!finite(v)||v<0||v>100))throw new RangeError('Six nonnegative counts required.');let previous=0;return counts.map((n,k)=>{const a=1+n,b=gamma+sum(counts.slice(k+1)),expectedLog=positiveDigamma(a)-positiveDigamma(a+b)+previous;previous+=positiveDigamma(b)-positiveDigamma(a+b);return {a,b,expectedLog};});}
// Exact saved gmm_saved_iris.json bayesian_sensitivity rows, stored order.
export const retainedBayesianWeights=[
 {concentration:.01,weights:[.011766109554147355,.37484691453806224,.6132801979520509,.00010572085086849469,.0000010467410977083283,.000000010363773244639192],converged:true},
 {concentration:1,weights:[.011654658058646229,.37127737953073353,.6074948486339005,.005493675813647216,.0027228124159074663,.0013566255471650901],converged:true},
 {concentration:10,weights:[.011429709465857772,.3642662349577417,.5969498285922453,.01005173101065236,.009086231719607287,.008216264253895496],converged:true}
];
export function retainedActiveCounts(threshold=.01){if(!finite(threshold)||threshold<0||threshold>.2)throw new RangeError('Threshold must be in [0,.2].');return retainedBayesianWeights.map(r=>({...r,active:r.weights.filter(w=>w>threshold).length}));}
export function predictiveContrast(factor=suppliedBayesianFactor()){
  const df=factor.degrees-1;if(!finite(df)||df<=0)throw new RangeError('Positive predictive degrees required.');positive(factor.beta);const precision=scale(factor.W,df*factor.beta/(1+factor.beta)),studentScale=pairedInverse(precision),pluginCovariance=scale(factor.inverseScale,1/factor.degrees),predictiveCovariance=df>2?scale(studentScale,df/(df-2)):null;
  const logStudent=x=>{if(!pair(x))throw new RangeError('Paired query required.');const q=quadratic(x.map((v,i)=>v-factor.mean[i]),precision);return positiveLogGamma((df+2)/2)-positiveLogGamma(df/2)-Math.log(df*Math.PI)+.5*logdet(precision)-(df+2)/2*Math.log1p(q/df);};
  const logPlugin=x=>{if(!pair(x))throw new RangeError('Paired query required.');return -Math.log(2*Math.PI)-.5*logdet(pluginCovariance)-.5*quadratic(x.map((v,i)=>v-factor.mean[i]),pairedInverse(pluginCovariance));};
  const marginalStudent=x=>{if(!finite(x))throw new RangeError('Finite marginal query required.');const q=(x-factor.mean[0])**2/studentScale[0][0];return Math.exp(positiveLogGamma((df+1)/2)-positiveLogGamma(df/2)-.5*Math.log(df*Math.PI*studentScale[0][0])-(df+1)/2*Math.log1p(q/df));};
  const marginalPlugin=x=>Math.exp(-.5*((x-factor.mean[0])**2/pluginCovariance[0][0]))/Math.sqrt(2*Math.PI*pluginCovariance[0][0]);
  return {df,precision,studentScale,pluginCovariance,predictiveCovariance,mean:factor.mean,meanExists:df>1,covarianceExists:df>2,logStudent,logPlugin,marginalStudent,marginalPlugin,expectedLogScore:expectedLogAssignment(factor.mean,[factor]).lse};
}
export function representationOperations(){const row=[0,0],means=[[-2,0],[2,0]],density=Math.exp(-2)/(2*Math.PI),shares=[.5,.5],W=[[1,0],[.5,1]],latent=[2,-1],additive=W.map(r=>sum(r.map((w,i)=>w*latent[i])));return {row,means,density,shares,covariances:[[[1,0],[0,1]],[[1,0],[0,1]]],generator:{weights:[.5,.5],uniform:.75,selected:1,standardDraw:[1,-1],sample:[3,-1]},W,latent,additive};}
