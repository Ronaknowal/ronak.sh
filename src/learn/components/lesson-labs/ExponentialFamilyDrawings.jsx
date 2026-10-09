import { EFigure, EScene, EResponsive, ELabel, EArrow, ETable, EBars, EPlot, ef, ec } from './ExponentialReadingPrimitives.jsx';
import { finiteExponentialFamily, normalDensity, sampleCurve } from '../../data/exponential-reading-models.js';

export function FiniteWorkflow({eta=0,controls=null}) {
  const s=finiteExponentialFamily(eta,0,[1,2,1]);
  return <><p>Outcomes −1,0,1; baseline 1,2,1. Current η={ef(eta)}.</p><EResponsive>{width=>{
    const left=14,right=width-14,span=right-left;
    return <EScene label="Three raw weights normalized into one probability law" width={width} height={390}>{s.outcomes.map((x,i)=><g key={x}>
      <ELabel x={left} y={25+i*125}>x={x}, h={s.base[i]}</ELabel>
      <rect x={left} y={45+i*125} width={span*s.probabilities[i]} height={16} fill={ec[0]}/>
      <ELabel x={left} y={87+i*125}>p={ef(s.probabilities[i],4)}</ELabel>
      <ELabel x={left} y={113+i*125} colour={ec[1]}>x·p={ef(x*s.probabilities[i],4)}</ELabel>
    </g>)}</EScene>;
  }}</EResponsive><p>All probability bar lengths use the common 0…1 scale. Mean={ef(s.mean[0])}; variance={ef(s.covariance[0][0])}; A={ef(s.logPartition)}.</p>{controls}<ETable label="Full weights, normalization and moments" columns={['x','h','log weight','ordinary weight','probability','x × p','p × (x−mean)²']} rows={s.outcomes.map((x,i)=>[x,s.base[i],ef(s.logWeights[i]),ef(Math.exp(s.logWeights[i])),ef(s.probabilities[i]),ef(x*s.probabilities[i]),ef(s.probabilities[i]*(x-s.mean[0])**2)])}/></>;
}
export function FamilyDrawing({id}) {
  const eta=.7,s=finiteExponentialFamily(eta,0,[1,2,1]);let child;
  if(id==='E16')child=<EBars label="Declared baseline weights, before probability normalization" columns={['Outcome','h(x)']} rows={[[-1,1],[0,2],[1,1]]} max={2}/>;
  else if(id==='E17')child=<><EBars label="Exponential factor reweights each same outcome" columns={['Outcome','h(x)','h(x) exp(.7x)']} rows={s.outcomes.map((x,i)=>[x,s.base[i],Math.exp(s.logWeights[i])])}/><p>The same multiplier formula gives different factors at different outcomes. All weights stay positive.</p></>;
  else if(id==='E18')child=<FiniteWorkflow eta={eta}/>;
  else if(id==='E19')child=<><EBars label="Common shift preserves normalized relative weights" columns={['Outcome','log weight','shifted log weight']} signed rows={[[-1,-1000,-2000],[0,Math.log(2),Math.log(2)-1000],[1,1000,0]]} max={2000}/><p>Common shift m=1000. Relative weights are exp(−2000), exp(log2−1000),1. A=m+log(sum of relative weights), numerically 1000; tiny represented weights underflow to 0.</p></>;
  else if(id==='E20')child=<><EBars label="Bernoulli raw odds and normalized masses" columns={['Outcome','raw weight','probability']} rows={[[0,1,.25],[1,3,.75]]} max={3}/><p>η=log3; weight total 4; A=log4. Raw weight and probability share outcome identity, with their units named separately.</p></>;
  else if(id==='E21'){
    const factorial=n=>{let t=1;for(let k=2;k<=n;k++)t*=k;return t;},poisson=Array.from({length:13},(_,k)=>[k,Math.exp(-2)*2**k/factorial(k)]);
    child=<div className="ef-compare"><div><EBars label="Poisson rate 2: displayed count prefix" columns={['Count k','P(K=k)']} rows={poisson}/><p>Counts 0…12 are displayed; omitted tail mass is {ef(1-poisson.reduce((a,r)=>a+r[1],0))}. No prefix renormalization.</p></div><EPlot label="Exponential rate 2 waiting-time density" xDomain={[0,4]} yDomain={[0,2]} xLabel="waiting time x, shown 0…4" yLabel="density per time unit" series={[{name:'λ=2 continuous density',points:sampleCurve(x=>2*Math.exp(-2*x),0,4),area:true}]}/></div>;
  }else if(id==='E22')child=<><EPlot label="Integrable Gaussian from a negative quadratic" xDomain={[-6,6]} yDomain={[0,.5]} xLabel="observation x" yLabel="Lebesgue density per x unit" series={[{name:'μ=1.5, v=2',points:sampleCurve(x=>normalDensity(x),-6,6)}]}/><p>η₁=.75,η₂=−.25; the negative quadratic damps both tails. η₂≥0 is outside the Gaussian natural domain.</p><EPlot label="The Gaussian negative quadratic before its normalizer" xDomain={[-6,6]} yDomain={[-14,2]} xLabel="same observation x" yLabel="η₁x+η₂x²" series={[{name:'.75x−.25x²',points:sampleCurve(x=>.75*x-.25*x*x,-6,6)}]}/></>;
  else if(id==='E23')child=<EBars label="Signed first-moment contributions" columns={['Outcome','x × probability']} signed rows={s.outcomes.map((x,i)=>[x,x*s.probabilities[i]])}/>;
  else if(id==='E24')child=<><EBars label="Centered-square variance contributions" columns={['Outcome','p × (x−mean)²']} rows={s.outcomes.map((x,i)=>[x,s.probabilities[i]*(x-s.mean[0])**2])}/><p>Common mean={ef(s.mean[0])}; sum={ef(s.covariance[0][0])}. Each centered square is nonnegative.</p></>;
  else if(id==='E25')child=<><EBars label="Scores and probability-weighted scores at the same outcomes" columns={['Outcome','score x−mean','probability × score']} signed rows={s.outcomes.map((x,i)=>[x,x-s.mean[0],s.probabilities[i]*(x-s.mean[0])])}/><p>Weighted score sum={ef(s.outcomes.reduce((a,x,i)=>a+s.probabilities[i]*(x-s.mean[0]),0))}; differentiation coordinate is η.</p></>;
  else if(id==='E27')child=<><EPlot label="Two statistic coordinates and their probability-weighted center" xDomain={[-1,1]} yDomain={[0,1]} xLabel="T₁=x" yLabel="T₂=x²" equal series={[{name:'statistic vectors',points:[[-1,1],[0,0],[1,1]],dots:true,connect:false},{name:'mean (.1,.5)',points:[[.1,.5]],dots:true,connect:false}]}/><ETable label="Exact centered covariance contributions" columns={['x','p','p(x−.1)²','p(x−.1)(x²−.5)','p(x²−.5)²']} rows={[-1,0,1].map((x,i)=>{const p=[.2,.5,.3][i];return[x,p,ef(p*(x-.1)**2),ef(p*(x-.1)*(x*x-.5)),ef(p*(x*x-.5)**2)];})}/><p>Covariance entries: .49,.05,.25. For eight independent observations multiply every entry by 8; a constant direction has zero variance.</p></>;
  else if(id==='E28'){
    const shifted=finiteExponentialFamily(.9,0,[1,2,1]);child=<><EBars label="The same outcomes under a finite exponential tilt" columns={['Outcome','p at η=.7','p at η=.9']} rows={s.outcomes.map((x,i)=>[x,s.probabilities[i],shifted.probabilities[i]])} max={1}/><p>Tilt u=.2 adds to η. log M={ef(shifted.logPartition-s.logPartition)}=A(.9)−A(.7). For a continuous Exponential rate λ, the tilt requires u&lt;λ.</p></>;
  }else throw new Error('Unknown static family object '+id);
  return <EFigure id={id}>{child}</EFigure>;
}
