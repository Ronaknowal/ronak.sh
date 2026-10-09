import { finiteElbo, restrictedFiniteOptimum, covarianceEllipse, gaussianProjection } from '../../data/variational-inference-models.js';
import { normalPdf, range, normalCdf } from '../../data/variational-reading-models.js';
import { VScene, VResponsive, VPlot, VLabel, VArrow, VTable, VBars, vf, vc } from './VariationalReadingPrimitives.jsx';

export function DensityShapes({ curves, label, xDomain=[-5,5], yDomain=[0,.8], tail=null, interval=null, coordinate='θ' }) {
  const series=curves.map((curve,i)=>({name:curve.name,points:range(...xDomain,241).map(x=>[x,normalPdf(x,curve.mean,curve.variance)]),colour:curve.colour || vc[i%4]}));
  if(tail!==null){const c=curves[0];series.push({name:c.name+'; shaded θ>'+vf(tail),points:range(tail,xDomain[1],121).map(x=>[x,normalPdf(x,c.mean,c.variance)]),colour:c.colour || vc[0],area:true});}
  if(interval){const c=curves[0];series.push({name:c.name+'; shaded interval',points:range(...interval,121).map(x=>[x,normalPdf(x,c.mean,c.variance)]),colour:c.colour || vc[0],area:true});}
  return <><VPlot label={label} xDomain={xDomain} yDomain={yDomain} xLabel={coordinate+', possible unknown'} yLabel="probability density" series={series} references={[{axis:'x',value:curves[0].mean,name:'first curve mean'},...(tail===null ? [] : [{axis:'x',value:tail,name:'tail threshold'}])]} />
    <VTable label={label+'; distribution parameters'} columns={['Curve','Mean','Variance','Density units']} rows={curves.map(c=>[c.name,vf(c.mean),vf(c.variance),'inverse '+coordinate+' units'])} /></>;
}
export function GaussianPlane({ target=[[1,.8],[.8,1]], covariance=[[.36,0],[0,.36]], targetMean=[0,0], mean=[0,0], label='Target and approximation covariance contours', radius=1, directions=false, controls=null }) {
  return <><VPlot label={label} xDomain={[-3,3]} yDomain={[-3,3]} xLabel="θ₁" yLabel="θ₂" equal width={680} height={630} series={[
    {name:`target p, radius ${radius}`,points:covarianceEllipse(target,targetMean,radius),colour:vc[1]},
    {name:`approximation q, radius ${radius}`,points:covarianceEllipse(covariance,mean,radius),colour:vc[0]},
  ]}>{({x,y})=>directions ? <g><VArrow x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} colour={vc[2]}/><VArrow x1={x(0)} y1={y(0)} x2={x(1)} y2={y(-1)} colour={vc[3]}/></g> : null}</VPlot>
  {controls}{directions && <p className="vi-series-key"><span style={{color:vc[2]}}>sum direction w=(1,1)</span><span style={{color:vc[3]}}>difference direction w=(1,−1)</span></p>}
  <VTable label="Full covariance entries; same coordinate units" columns={['Distribution','Mean₁','Mean₂','C₁₁','C₁₂','C₂₂']} rows={[[ 'target p',...targetMean.map(value=>vf(value)),vf(target[0][0]),vf(target[0][1]),vf(target[1][1])],['approximation q',...mean.map(value=>vf(value)),vf(covariance[0][0]),vf(covariance[0][1]),vf(covariance[1][1])]]} /></>;
}
export function FiniteRows({ result, label='All state contributions' }) {
  return <VTable label={label} columns={['State','Joint','p','q','q log joint','−q log q','q log(q/p)']} rows={result.rows.map((r,i)=>['ABC'[i],vf(r.joint),vf(r.posterior),vf(r.probability),vf(r.expectedLogJoint),vf(r.entropy),vf(r.kl)])} />;
}
export function FiniteShape({ result, controls = null }) {
  return <><VBars label="State probability masses; cyan target p, amber q" columns={['State','q','p']} rows={result.rows.map((r,i)=>['ABC'[i],r.probability,r.posterior])} max={1} controls={controls} /><FiniteRows result={result}/></>;
}
function Simplex() {
  const vertices=[[1,0,0],[0,1,0],[0,0,1]],p=[.2,.5,.3],q=restrictedFiniteOptimum().q;
  return <><p className="vi-series-key"><span style={{color:vc[1]}}>cyan point: target p</span><span style={{color:vc[0]}}>amber point: restricted optimum; amber line: B=C</span></p>
    <VResponsive>{width=>{
      const base=Math.min(300,(width-64)*.7),bottom=base+48;
      const point=a=>[32+(width-64)*(a[1]+a[2]/2),bottom-base*a[2]];
      const pxy=point(p),qxy=point(q);
      return <VScene label="Probability simplex and B=C restricted family" width={width} height={bottom+48}>
        <polygon points={vertices.map(v=>point(v).join(',')).join(' ')} fill="none" stroke="#888" />
        <line x1={point([1,0,0])[0]} y1={point([1,0,0])[1]} x2={point([0,.5,.5])[0]} y2={point([0,.5,.5])[1]} stroke={vc[0]} strokeWidth={3} />
        {vertices.map((v,i)=><VLabel key={i} x={point(v)[0]} y={point(v)[1]+(i===2 ? -22 : 28)} anchor="middle">{'ABC'[i]}=1</VLabel>)}
        <circle cx={pxy[0]} cy={pxy[1]} r={5} fill={vc[1]} /><circle cx={qxy[0]} cy={qxy[1]} r={5} fill={vc[0]} />
      </VScene>;
    }}</VResponsive><VTable label="All simplex coordinates" columns={['Point','A','B','C']} rows={[['p',...p.map(value=>vf(value))],['q optimum',...q.map(value=>vf(value))]]} /></>;
}
function ProductGrid({mu=[-2,2],label='Initial product q₁q₂'}) {
  const variance=.36;
  const densities=[];
  for(let i=0;i<36;i++)for(let j=0;j<36;j++){
    const x=-5+(i+.5)*10/36,y=-5+(j+.5)*10/36;
    densities.push({x,y,value:normalPdf(x,mu[0],variance)*normalPdf(y,mu[1],variance)});
  }
  const maximum=Math.max(...densities.map(d=>d.value));
  return <><p className="vi-axis-label">Opacity = density / {vf(maximum)}.</p><VPlot label={label+'; actual density sampled at cell centres'} xDomain={[-5,5]} yDomain={[-5,5]} equal width={680} height={630} xLabel="θ₁" yLabel="θ₂">
    {({x,y})=><g>{densities.map((d,i)=><rect key={i} x={x(d.x-5/36)} y={y(d.y+5/36)} width={x(d.x+5/36)-x(d.x-5/36)} height={y(d.y-5/36)-y(d.y+5/36)} fill={vc[0]} opacity={d.value/maximum} />)}</g>}
  </VPlot><DensityShapes label="The two complete factors being multiplied" curves={[{name:'q₁',mean:mu[0],variance:.36},{name:'q₂',mean:mu[1],variance:.36}]} yDomain={[0,1]} /></>;
}
export default function FoundationDrawing({ id }) {
  const uniform=finiteElbo([1/3,1/3,1/3]),restricted=restrictedFiniteOptimum(),exact=finiteElbo([.2,.5,.3]);
  if(id==='V01')return <><DensityShapes label="A possible correction, its mean and its right tail" curves={[{name:'N(0,1)',mean:0,variance:1}]} tail={1} yDomain={[0,.5]}/><VTable label="Point versus interval event" columns={['Quantity','Value']} rows={[[ 'mean θ',0],['Pr(θ>1)',vf(1-normalCdf(1))],['Probability of exact point0',0]]}/></>;
  if(id==='V02')return <><VPlot label="Approximation settings select complete distributions" xDomain={[-1,2]} yDomain={[-1,1.2]} xLabel="m, variational mean" yLabel="log s, variational log SD" equal height={570} series={[{name:'m0, log s0',points:[[0,0]],connect:false,dots:true,colour:vc[0]},{name:'m1, log s log2',points:[[1,Math.log(2)]],connect:false,dots:true,colour:vc[1]}]} /><DensityShapes label="Two selected settings on a common unknown axis" curves={[{name:'m0,log s0',mean:0,variance:1},{name:'m1,log s log2',mean:1,variance:4}]} /></>;
  if(id==='V03')return <><VBars label="Actual multiplication and normalization on each state" columns={['State','Likelihood','Joint','Posterior']} rows={[[ 'A',.24,.08,.2],['B',.6,.2,.5],['C',.36,.12,.3]]} max={1} /><VTable label="Prior multiplication and total evidence" columns={['State','Prior','Likelihood','Prior×likelihood','Joint/.40']} rows={'ABC'.split('').map((s,i)=>[s,'1/3',[.24,.6,.36][i],[.08,.2,.12][i],[.2,.5,.3][i]])} /></>;
  if(id==='V04')return <><DensityShapes label="Original density, θ in0…1" curves={[{name:'θ~N(0,1)',mean:0,variance:1}]} xDomain={[-4,4]} yDomain={[0,.5]} interval={[0,1]} /><DensityShapes coordinate="θ′" label="Transformed density, θ′=2θ in0…2" curves={[{name:'θ′~N(0,4)',mean:0,variance:4}]} xDomain={[-8,8]} yDomain={[0,.5]} interval={[0,2]} /><VTable label="Matched intervals conserve probability" columns={['Coordinate','Interval','Probability','Peak density']} rows={[[ 'θ','[0,1]',vf(normalCdf(1)-.5),vf(normalPdf(0))],['θ′','[0,2]',vf(normalCdf(1)-.5),vf(normalPdf(0,0,4))]]} /></>;
  if(id==='V05')return <>{[[.5,.5,0],[.4,.5,.1],[1,0,0]].map((q,i)=>{const r=finiteElbo(q,[.4,.6,0]);return <div key={i}><FiniteShape result={r} /><p>Candidate{i+1}: reverse KL {vf(r.kl)}.</p></div>;})}</>;
  if(id==='V07')return <><VBars signed label="Signed weighted log ratios; uniform q" columns={['State','q log(q/p)']} rows={uniform.rows.map((r,i)=>['ABC'[i],r.kl])} /><FiniteRows result={uniform}/><FiniteRows result={exact} label="Exact q=p gives zero in every contribution" /></>;
  if(id==='V08')return <><VPlot label="ELBO plus positive KL gap reaches fixed log evidence" xDomain={[-1.06,-.85]} yDomain={[0,4]} xLabel="objective / log-evidence, nats" yLabel="candidate row" series={[{name:'candidate ELBO',points:[uniform,restricted,exact].map((r,i)=>[r.elbo,i+1]),connect:false,dots:true},{name:'fixed log evidence',points:[uniform,restricted,exact].map((r,i)=>[r.logEvidence,i+1]),connect:false,dots:true,colour:vc[1]}]}>{({x,y})=><g>{[uniform,restricted,exact].map((r,i)=><VArrow key={i} x1={x(r.elbo)} y1={y(i+1)} x2={x(r.logEvidence)} y2={y(i+1)} colour={vc[0]} />)}</g>}</VPlot><VTable label="All actual objective/gap sums" columns={['q','ELBO','KL','ELBO+KL']} rows={[uniform,restricted,exact].map((r,i)=>[['uniform','restricted optimum','exact'][i],vf(r.elbo),vf(r.kl),vf(r.elbo+r.kl)])}/></>;
  if(id==='V09')return <><VPlot label="Concave log function and Jensen chord" xDomain={[.2,1.8]} yDomain={[-1.7,.7]} xLabel="positive ratio" yLabel="log ratio" series={[{name:'log curve',points:range(.2,1.8).map(x=>[x,Math.log(x)]),colour:vc[1]},{name:'Jensen chord',points:[[.5,Math.log(.5)],[1.5,Math.log(1.5)]],dots:true,colour:vc[0]},{name:'expectation comparison',points:[[1,.5*(Math.log(.5)+Math.log(1.5))],[1,0]],dots:true,colour:vc[2]}]} /><VTable label="Jensen uses the same two positive ratios" columns={['Operation','Value']} rows={[[ 'E log ratio',vf(.5*(Math.log(.5)+Math.log(1.5)))],['log E ratio',0]]} /></>;
  if(id==='V10')return <><VBars label="Uniform entropy contributions" columns={['State','−q log q']} rows={uniform.rows.map((r,i)=>['ABC'[i],r.entropy])}/><VBars label="Concentrated entropy uses limiting zero terms" columns={['State','−q log q']} rows={finiteElbo([1,0,0]).rows.map((r,i)=>['ABC'[i],r.entropy])}/></>;
  if(id==='V11')return <Simplex/>;
  if(id==='V12')return <><VPlot label="Restricted-family objective, exact optimum and current q" xDomain={[0,1]} yDomain={[-2.6,-.8]} xLabel="q_A, with q_B=q_C" yLabel="ELBO, nats" series={[{name:'restricted-family ELBO',points:range(0,1,201).map(a=>[a,finiteElbo([a,(1-a)/2,(1-a)/2]).elbo])},{name:'current q_A=.2',points:[[.2,finiteElbo([.2,.4,.4]).elbo]],connect:false,dots:true,colour:vc[1]},{name:'restricted optimum',points:[[restricted.q[0],restricted.elbo]],connect:false,dots:true,colour:vc[2]}]} /><VTable label="Family restriction and remaining optimization" columns={['Quantity','Value']} rows={[[ 'current q_A',.2],['optimal q_A',vf(restricted.q[0])],['irreducible family KL',vf(restricted.kl)],['current excess KL',vf(finiteElbo([.2,.4,.4]).kl-restricted.kl)]]}/></>;
  if(id==='V13')return <><VBars signed label="Likelihood and prior-ratio ELBO terms" columns={['State','q log likelihood','−q log(q/prior)']} rows={uniform.rows.map((r,i)=>['ABC'[i],r.probability*Math.log([.24,.6,.36][i]),-r.probability*Math.log(3*r.probability)])}/><FiniteRows result={uniform}/></>;
  if(id==='V14')return <><VBars signed label="Original and half-likelihood event objectives; same q candidates" columns={['Candidate','Original ELBO','Half ELBO']} rows={[uniform,restricted,exact].map((r,i)=>[['uniform','restricted','exact'][i],r.elbo,r.elbo-Math.log(2)])}/><VTable label="Two valid binary event models; constants shift both objectives" columns={['Candidate','Original ELBO','Half-likelihood ELBO','KL unchanged','Original log Z','Half log Z']} rows={[uniform,restricted,exact].map((r,i)=>[['uniform','restricted','exact'][i],vf(r.elbo),vf(r.elbo-Math.log(2)),vf(r.kl),vf(r.logEvidence),vf(r.logEvidence-Math.log(2))])}/></>;
  if(id==='V16')return <><GaussianPlane/><DensityShapes coordinate="θ₁" label="Fix θ₂=1: target conditional θ₁ versus target marginal" curves={[{name:'conditional N(.8,.36)',mean:.8,variance:.36},{name:'marginal N(0,1)',mean:0,variance:1}]} yDomain={[0,.8]}/></>;
  if(id==='V17')return <><GaussianPlane label="Reverse-KL optimum keeps diagonal variance.36"/><GaussianPlane label="Forward-KL optimum is the product of target marginals" covariance={[[1,0],[0,1]]}/><VTable label="Projection directions cannot be substituted" columns={['Family','Variance each','Reverse KL']} rows={[[ 'reverse optimum',.36,vf(gaussianProjection().kl)],['forward optimum',1,vf(gaussianProjection(.8,'marginals').kl)]]}/></>;
  if(id==='V18')return <><GaussianPlane directions/><DensityShapes coordinate="θ₁+θ₂" label="Actual sum projection θ₁+θ₂" curves={[{name:'q sum N(0,.72)',mean:0,variance:.72},{name:'p sum N(0,3.6)',mean:0,variance:3.6}]} xDomain={[-6,6]} yDomain={[0,.8]}/><DensityShapes coordinate="θ₁−θ₂" label="Actual difference projection θ₁−θ₂" curves={[{name:'q difference N(0,.72)',mean:0,variance:.72},{name:'p difference N(0,.4)',mean:0,variance:.4}]} xDomain={[-6,6]} yDomain={[0,.8]}/><VBars label="Variance of actual sum and difference; cyan target, amber q" columns={['Quantity','q variance','p variance']} rows={[[ 'θ₁+θ₂',.72,3.6],['θ₁−θ₂',.72,.4]]} max={4}/></>;
  if(id==='V19')return <><GaussianPlane/><VPlot label="Orthogonal coordinates diagonalize Gaussian covariance" xDomain={[-3,3]} yDomain={[-3,3]} equal height={610} xLabel="(θ₁+θ₂)/√2" yLabel="(θ₁−θ₂)/√2" series={[{points:covarianceEllipse([[1.8,0],[0,.2]]),colour:vc[1]}]} /><VTable label="Transformed covariance and probability measure" columns={['Entry','Value']} rows={[[ 'sum-axis variance',1.8],['difference-axis variance',.2],['off diagonal covariance',0],['absolute Jacobian',1]]}/></>;
  if(id==='V20')return <><ProductGrid/><ProductGrid mu={[3.4,2]} label="After replacing complete q₁; q₂ unchanged"/><VTable label="Whole factors before and after the ordered replacement" columns={['State','q₁ mean','q₁ variance','q₂ mean','q₂ variance']} rows={[[ 'before',-2,.36,2,.36],['after',3.4,.36,2,.36]]}/></>;
  throw new Error(`No foundational drawing for ${id}`);
}
