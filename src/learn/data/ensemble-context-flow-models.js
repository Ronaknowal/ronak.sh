export const printedContextTheta = [.443800441, .052026707, .528274900];
export const printedOOFTheta = [-.82759734, .845327571, 1.064964175];
export const printedOOFQueries = [
  { raw: [-.6,.2], columns: [.305260593,.084001396], score: -.480093667, probability: .382230007 },
  { raw: [.7,-.3], columns: [.825321046,.988312571], score: .922586777, probability: .715568886 }
];
export const contextSigmoid = x => x >= 0 ? 1/(1+Math.exp(-x)) : Math.exp(x)/(1+Math.exp(x));
export function ensembleContextProducts(a,b,z) {
  if ([a,b,z].some(x=>!Number.isFinite(x)||x<0||x>1)) throw new RangeError('Use three finite quantities from 0 to 1.');
  const weights=[1-z,z],products=[weights[0]*a,weights[1]*b];
  const learnedProducts=products.map((x,i)=>x*printedContextTheta[i+1]);
  return { a,b,z,weights,products,desired:products[0]+products[1],additiveProducts:[.5*a,.5*b],additive:.5*a+.5*b,
    learnedProducts,learned:printedContextTheta[0]+learnedProducts[0]+learnedProducts[1],
    learnedSlopes:[printedContextTheta[1]*(1-z),printedContextTheta[2]*z] };
}
export function ensembleTypedScore(inputs=[.8,2],theta=[-1,2,.5]) {
  const products=inputs.map((x,i)=>x*theta[i+1]),score=theta[0]+products.reduce((a,b)=>a+b,0);
  return {inputs,theta,products,score,probability:contextSigmoid(score)};
}
