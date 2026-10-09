import { useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { finiteApproximation, gaussianProjection, coordinateAscent, mixtureProjection, variationalGradients } from '../../data/variational-inference-models.js';
import { hierarchyProposal, sleepUpdates, finiteImportance, batches } from '../../data/variational-reading-models.js';
import { VFigure, vf } from './VariationalReadingPrimitives.jsx';
import { FiniteShape, GaussianPlane } from './VariationalFoundationDrawings.jsx';
import { CaviShape, MixtureShape, GradientShape } from './VariationalGradientDrawings.jsx';
import { ProposalShape, SleepShape, ImportanceShape } from './VariationalStructuredDrawings.jsx';

export function FiniteLab() {
  const [first,setFirst]=useState(.2),[share,setShare]=useState(.5),[family,setFamily]=useState('restricted');
  const result=finiteApproximation(first,family==='restricted' ? .5 : share);
  return <FlowLab id="vi-V06" label="Finite target, family and ELBO"><VFigure id="V06"><FiniteShape result={result} controls={<><FlowReadout>ELBO <strong>{vf(result.elbo)}</strong> plus KL <strong>{vf(result.kl)}</strong> equals fixed log evidence <strong>{vf(result.logEvidence)}</strong>. These are exact finite sums.</FlowReadout><FlowControls>
    <FlowChoice label="Family" value={family} onChange={setFamily} options={[[ 'restricted','B=C restricted'],['free','Free B share']]}/>
    <FlowSlider name="q_A" value={first} onChange={setFirst} min={0} max={1} step={.01}/>
    {family==='free' && <FlowSlider name="B share of remaining mass" value={share} onChange={setShare} min={0} max={1} step={.01}/>}
    <button type="button" onClick={()=>{setFirst(.2);setShare(.5);setFamily('restricted');}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function CovarianceLab() {
  const [rho,setRho]=useState(.8),[family,setFamily]=useState('mean-field');
  const result=gaussianProjection(rho,family);
  return <FlowLab id="vi-V15" label="Covariance and consequential uncertainty"><VFigure id="V15"><GaussianPlane target={result.target} covariance={result.covariance} controls={<><FlowReadout>Reverse KL is <strong>{vf(result.kl)}</strong>. Sum variance p/q is <strong>{vf(result.targetSumVariance)} / {vf(result.sumVariance)}</strong>; difference variance p/q is <strong>{vf(result.targetDifferenceVariance)} / {vf(result.differenceVariance)}</strong>. Radius1 encloses39.35% of each two-dimensional Gaussian.</FlowReadout><FlowControls>
    <FlowSlider name="Target correlation ρ" value={rho} onChange={setRho} min={-.95} max={.95} step={.05}/>
    <FlowChoice label="Approximation" value={family} onChange={setFamily} options={[[ 'mean-field','Reverse-KL independent'],['marginals','Product of target marginals'],['full','Full target covariance']]}/>
    <button type="button" onClick={()=>{setRho(.8);setFamily('mean-field');}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function CoordinateLab() {
  const [rho,setRho]=useState(.8),[updates,setUpdates]=useState(12);
  const result=coordinateAscent(rho,updates),last=result.rows.at(-1);
  return <FlowLab id="vi-V22" label="Ordered whole-factor coordinate updates"><VFigure id="V22"><CaviShape result={result} controls={<><FlowReadout>After <strong>{updates}</strong> ordered updates, means are <strong>{last.mean.map(value=>vf(value)).join(', ')}</strong>. Family KL <strong>{vf(last.familyGap)}</strong> remains separate from optimization gap <strong>{vf(last.optimizationGap)}</strong>.</FlowReadout><FlowControls>
    <FlowSlider name="Target correlation ρ" value={rho} onChange={setRho} min={-.9} max={.9} step={.1}/>
    <FlowSlider name="Individual updates" value={updates} onChange={setUpdates} min={0} max={24} step={1}/>
    <button type="button" onClick={()=>{setRho(.8);setUpdates(12);}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function MixtureLab() {
  const [separation,setSeparation]=useState(3),[mean,setMean]=useState(0),[sd,setSd]=useState(3);
  const result=useMemo(()=>mixtureProjection(mean,sd,separation),[mean,sd,separation]);
  return <FlowLab id="vi-V25" label="A two-mode target and one Gaussian"><VFigure id="V25"><MixtureShape result={result} controls={<><FlowReadout>Quadrature KL is <strong>{vf(result.kl)}</strong>; q sign probability is <strong>{vf(result.rightProbability)}</strong>, while the symmetric target has <strong>.5</strong>. Curves show θ∈[−8,8]; KL uses the separate ε∈[−9,9] integration window with1440 Simpson subintervals.</FlowReadout><FlowControls>
    <FlowSlider name="Mode separation d" value={separation} onChange={setSeparation} min={0} max={4} step={.25}/>
    <FlowSlider name="Approximation mean" value={mean} onChange={setMean} min={-4} max={4} step={.25}/>
    <FlowSlider name="Approximation SD" value={sd} onChange={setSd} min={.3} max={3} step={.1}/>
    <button type="button" onClick={()=>{setSeparation(3);setMean(0);setSd(3);}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function GradientLab() {
  const [mean,setMean]=useState(0),[sd,setSd]=useState(1.2),[count,setCount]=useState(100),[seed,setSeed]=useState(7),[draft,setDraft]=useState('7'),[index,setIndex]=useState(1),[estimator,setEstimator]=useState('pathwise'),[error,setError]=useState('');
  const result=useMemo(()=>variationalGradients({mean,sd,count,seed}),[mean,sd,count,seed]);
  const editSeed=event=>{
    const text=event.target.value;setDraft(text);
    const value=Number(text);
    if(!/^\d+$/.test(text)||!Number.isInteger(value)||value<1||value>4294967295){setError('Use an integer seed from1 through4294967295. The last valid calculation stays visible.');return;}
    setError('');setSeed(value);
  };
  return <FlowLab id="vi-V30" label="Whole actual pathwise and score gradient draws"><VFigure id="V30"><GradientShape result={result} selected={index} estimator={estimator} controls={<><FlowReadout>Valid seed <strong>{seed}</strong>, <strong>{count}</strong> independent draws. Analytic ascent gradients are <strong>{vf(result.exactMean)}</strong> for mean and <strong>{vf(result.exactLogSd)}</strong> for log SD. Sample means and MCSE are computed from the whole visible table, without a universal variance ranking.</FlowReadout><FlowControls>
    <FlowSlider name="Approximation mean m" value={mean} onChange={setMean} min={-2} max={3} step={.1}/>
    <FlowSlider name="Approximation SD s" value={sd} onChange={setSd} min={.2} max={2} step={.1}/>
    <FlowChoice label="Independent draws" value={count} onChange={value=>{setCount(value);setIndex(old=>Math.min(old,value));}} options={[[10,'10'],[100,'100'],[1000,'1000']]}/>
    <FlowChoice label="Contribution plot" value={estimator} onChange={setEstimator} options={[[ 'pathwise','Pathwise'],['score','Score']]}/>
    <FlowSlider name="Selected draw" value={index} onChange={setIndex} min={1} max={count} step={1}/>
    <label className="vi-input">Seed<input type="text" inputMode="numeric" value={draft} onChange={editSeed} aria-invalid={Boolean(error)} /></label>
    <button type="button" onClick={()=>{setMean(1.5);setSd(.7);}}>Match q</button>
    <button type="button" onClick={()=>{setMean(0);setSd(1.2);setCount(100);setSeed(7);setDraft('7');setIndex(1);setEstimator('pathwise');setError('');}}>Reset</button>
  </FlowControls>{error && <p role="alert">{error}</p>}</>}/></VFigure></FlowLab>;
}
export function HierarchyLab() {
  const [mean,setMean]=useState(1),[batch,setBatch]=useState(1),[rho,setRho]=useState(.25);
  const result=hierarchyProposal(mean,batch,rho);
  return <FlowLab id="vi-V42" label="Selected structured natural proposal and full-data reference"><VFigure id="V42"><ProposalShape result={result} controls={<><FlowReadout>Selected indices <strong>[{result.batch.join(',')}]</strong> propose h <strong>{vf(result.selectedH)}</strong> and step to mean <strong>{vf(result.steppedMean)}</strong>. The separate full-data weighted reference is <strong>{vf(result.referenceSteppedMean)}</strong>. One prior contribution is counted once.</FlowReadout><FlowControls>
    <FlowSlider name="Current E μ" value={mean} onChange={setMean} min={-2} max={4} step={.25}/>
    <FlowChoice label="Selected batch indices" value={batch} onChange={setBatch} options={batches.map((b,i)=>[i,'['+b.join(',')+']'])}/>
    <FlowSlider name="Natural step weight ρ" value={rho} onChange={setRho} min={0} max={1} step={.05}/>
    <button type="button" onClick={()=>{setMean(1);setBatch(1);setRho(.25);}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function SleepLab() {
  const [sweeps,setSweeps]=useState(0),result=sleepUpdates(sweeps);
  return <FlowLab id="vi-V52" label="Complete paired-data product-factor updates"><VFigure id="V52"><SleepShape result={result} controls={<><FlowReadout>Current KL <strong>{vf(result.current.kl)}</strong> versus analytic best-family KL <strong>{vf(result.optimum.kl)}</strong>. Current E(1/v) <strong>{vf(result.current.eprecision)}</strong> determines the next mean-factor variance. All {result.rows.length} actual sweep rows remain.</FlowReadout><FlowControls>
    <FlowSlider name="Complete sweeps" value={sweeps} onChange={setSweeps} min={0} max={20} step={1}/>
    <button type="button" onClick={()=>setSweeps(0)}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
export function ImportanceLab() {
  const [proposal,setProposal]=useState('uniform'),[quantity,setQuantity]=useState('indicatorB');
  const options={uniform:[1/3,1/3,1/3],exact:[.2,.5,.3],skew:[.1,.8,.1],missingB:[.4,0,.6]},values={indicatorA:[1,0,0],indicatorB:[0,1,0],stateValue:[0,1,2]};
  const result=finiteImportance(options[proposal],values[quantity]);
  return <FlowLab id="vi-V55" label="Exact finite importance precision and support"><VFigure id="V55"><ImportanceShape result={result} controls={<><FlowReadout>{result.valid ? <>Exact target expectation <strong>{vf(result.integral)}</strong> has no enumeration error. Raw-IS variance <strong>{vf(result.rawVariance)}</strong> is for one independent draw; SN coefficient <strong>{vf(result.snCoefficient)}</strong> gives asymptotic variance divided by count.</> : <>Proposal lacks target support on <strong>{result.missing.map(i=>'ABC'[i]).join(', ')}</strong>. Full-target importance estimates are invalid; no finite precision result is shown.</>}</FlowReadout><FlowControls>
    <FlowChoice label="Proposal q" value={proposal} onChange={setProposal} options={[[ 'uniform','Uniform'],['exact','Exact target'],['skew','(.1,.8,.1)'],['missingB','Missing B']]}/>
    <FlowChoice label="Reported quantity" value={quantity} onChange={setQuantity} options={[[ 'indicatorA','Indicator A'],['indicatorB','Indicator B'],['stateValue','State values0,1,2']]}/>
    <button type="button" onClick={()=>{setProposal('uniform');setQuantity('indicatorB');}}>Reset</button>
  </FlowControls></>}/></VFigure></FlowLab>;
}
