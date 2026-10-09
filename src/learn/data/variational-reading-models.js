// Deterministic mathematical models for the declared VI reading-flow objects.
export const range = (a,b,n=161) => Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const sum = values => values.reduce((a,b)=>a+b,0);
export function normalPdf(x,m=0,v=1) { return Math.exp(-.5*(x-m)**2/v)/Math.sqrt(2*Math.PI*v); }
export function integrate(fn,a,b,n=1200) {
  if(n%2 || n<2 || !Number.isFinite(a+b)) throw new RangeError('Finite bounds and positive even integration count required.');
  const h=(b-a)/n;
  let total=fn(a)+fn(b);
  for(let i=1;i<n;i++) total+=(i%2 ? 4 : 2)*fn(a+i*h);
  return total*h/3;
}
export function normalCdf(x) {
  if(x<=-10)return 0;if(x>=10)return 1;
  return .5+Math.sign(x)*integrate(z=>normalPdf(z),0,Math.abs(x),800);
}
export function logGamma(z) {
  const coefficients=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(!(z>0))throw new RangeError('Positive gamma argument required.');
  if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
  let x=.99999999999980993;z-=1;
  for(let i=0;i<coefficients.length;i++)x+=coefficients[i]/(z+i+1);
  const t=z+7.5;
  return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
}
export function digamma(x) {
  if(!(x>0))throw new RangeError('Positive digamma argument required.');
  let value=0;
  while(x<12){value-=1/x;x+=1;}
  const u=1/x, u2=u*u;
  return value+Math.log(x)-u/2-u2/12+u2*u2/120-u2**3/252+u2**4/240-u2**5/132;
}
export function igPdf(v,a,b) {
  return v>0 ? Math.exp(a*Math.log(b)-logGamma(a)-(a+1)*Math.log(v)-b/v) : 0;
}
export const sleepRows = Object.freeze([
  [1,.7,1.9],[2,-1.6,.8],[3,-.2,1.1],[4,-1.2,.1],[5,-.1,-.1],
  [6,3.4,4.4],[7,3.7,5.5],[8,.8,1.6],[9,0,4.6],[10,2,3.4],
].map(([id,first,second])=>Object.freeze({id,first,second,difference:Math.round((second-first)*10)/10})));
export const NIG = Object.freeze({kappa:11,mean:79/55,alpha:7,beta:10937/1100});
export function nigLogPdf(mu,v) {
  const {kappa,mean,alpha,beta}=NIG;
  return v>0 ? alpha*Math.log(beta)-logGamma(alpha)+.5*Math.log(kappa/(2*Math.PI))-(alpha+1.5)*Math.log(v)-(beta+.5*kappa*(mu-mean)**2)/v : -Infinity;
}
export function sleepMarginalPdf(mu) {
  const {kappa,mean,alpha,beta}=NIG;
  const df=2*alpha,scale=Math.sqrt(beta/(alpha*kappa)),z=(mu-mean)/scale;
  return Math.exp(logGamma((df+1)/2)-logGamma(df/2))/(Math.sqrt(df*Math.PI)*scale)*(1+z*z/df)**(-(df+1)/2);
}
export function sleepTail(threshold=2) {
  // Exact Student law numerically integrated to a far tail; missing positive
  // remainder is bounded by the polynomial tail and independently checked.
  return integrate(sleepMarginalPdf,threshold,30,6000);
}
export function productIgKl(mean,variance,shape,scale) {
  const {kappa,mean:targetMean,alpha,beta}=NIG;
  const elogv=Math.log(scale)-digamma(shape), eprecision=shape/scale;
  const constant=alpha*Math.log(beta)-logGamma(alpha)+.5*Math.log(kappa/(2*Math.PI));
  const elogp=constant-(alpha+1.5)*elogv-(beta+.5*kappa*(variance+(mean-targetMean)**2))*eprecision;
  const entropyMu=.5*Math.log(2*Math.PI*Math.E*variance);
  const entropyV=shape+Math.log(scale)+logGamma(shape)-(1+shape)*digamma(shape);
  return -entropyMu-entropyV-elogp;
}
export function sleepUpdates(sweeps=0) {
  if(!Number.isInteger(sweeps)||sweeps<0||sweeps>20)throw new RangeError('Use0–20 complete sweeps.');
  const {kappa,mean:targetMean,alpha,beta}=NIG;
  const shape=alpha+.5;
  let mean=0,variance=1,scale=12;
  const rows=[];
  for(let sweep=0;sweep<=sweeps;sweep++){
    rows.push({sweep,mean,variance,shape,scale,eprecision:shape/scale,elogv:Math.log(scale)-digamma(shape),kl:productIgKl(mean,variance,shape,scale)});
    mean=targetMean;variance=scale/(shape*kappa);scale=beta+.5*kappa*(variance+(mean-targetMean)**2);
  }
  const optimumVariance=beta/(alpha*kappa),optimumScale=beta*shape/alpha;
  return {rows,current:rows.at(-1),optimum:{mean:targetMean,variance:optimumVariance,shape,scale:optimumScale,kl:productIgKl(targetMean,optimumVariance,shape,optimumScale)}};
}
export function logSigmaOptimum() {
  const {kappa,mean,alpha,beta}=NIG;
  const variance=beta/(alpha*kappa),tauVariance=1/(4*alpha+2),tauMean=tauVariance-.5*Math.log(alpha/beta);
  const elogp=alpha*Math.log(beta)-logGamma(alpha)+.5*Math.log(kappa/(2*Math.PI))+Math.log(2)-(2*alpha+1)*tauMean-(beta+.5*kappa*variance)*Math.exp(-2*tauMean+2*tauVariance);
  const kl=-.5*Math.log(2*Math.PI*Math.E*variance)-.5*Math.log(2*Math.PI*Math.E*tauVariance)-elogp;
  return {mean,variance,tauMean,tauVariance,kl,eprecision:Math.exp(-2*tauMean+2*tauVariance)};
}
export const batches = Object.freeze([[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]);
export function hierarchyProposal(mean=1,batchIndex=1,rho=.25) {
  if(!Number.isFinite(mean)||mean<-2||mean>4 || !Number.isInteger(batchIndex)||batchIndex<0||batchIndex>5 || !Number.isFinite(rho)||rho<0||rho>1) throw new RangeError('Use finite current mean−2…4, a declared batch and rho0…1.');
  const observations=[1,2,4,5],locals=observations.map(y=>(mean+y)/2),J=5,h=J*mean;
  const proposals=batches.map(batch=>2*sum(batch.map(i=>locals[i]))),referenceH=sum(locals);
  const selectedH=proposals[batchIndex],steppedH=(1-rho)*h+rho*selectedH;
  return {mean,J,h,observations,locals,proposals,referenceH,selectedH,steppedH,steppedMean:steppedH/J,referenceSteppedMean:((1-rho)*h+rho*referenceH)/J,batch:batches[batchIndex],rho};
}
export function finiteImportance(q=[1/3,1/3,1/3],values=[0,1,0]) {
  const p=[.2,.5,.3];
  if(q.length!==3||q.some(x=>!Number.isFinite(x)||x<0||x>1)||Math.abs(sum(q)-1)>1e-10)throw new RangeError('Three nonnegative normalized probabilities required.');
  const integral=sum(p.map((x,i)=>x*values[i])),missing=p.map((x,i)=>x>0&&q[i]===0 ? i : null).filter(x=>x!==null);
  if(missing.length)return {p,q,values,integral,missing,valid:false,ratios:q.map((x,i)=>x ? p[i]/x : Infinity),rawVariance:null,snCoefficient:null,ratioSecondMoment:null};
  const ratios=p.map((x,i)=>x/q[i]),ratioSecondMoment=sum(q.map((x,i)=>x*ratios[i]**2));
  const rawVariance=sum(p.map((x,i)=>x*x*values[i]**2/q[i]))-integral**2;
  const snCoefficient=sum(p.map((x,i)=>x*x*(values[i]-integral)**2/q[i]));
  return {p,q,values,integral,missing,valid:true,ratios,rawVariance,snCoefficient,ratioSecondMoment};
}
