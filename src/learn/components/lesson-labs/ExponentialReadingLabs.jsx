import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { EFigure, ETable, ef } from './ExponentialReadingPrimitives.jsx';
import { EstimatorDistributions, ModelRecords } from './ExponentialFoundationDrawings.jsx';
import { FiniteWorkflow } from './ExponentialFamilyDrawings.jsx';
import { FitDrawing } from './ExponentialInferenceDrawings.jsx';
import { MergeDrawing } from './ExponentialGaussianDrawings.jsx';
import { CoordinateDrawing } from './ExponentialStructuredDrawings.jsx';
import { conditionalAveraging, finiteMomentFit, finiteTeachingFamily, SUFFICIENCY_REFERENCE } from '../../data/exponential-reading-models.js';

export function ConditionalLab() {
  const [p,setP]=useState(.2),a=conditionalAveraging(p);
  return <FlowLab id="ef-E07" label="Exact conditional averaging under the common Bernoulli model"><EFigure id="E07"><EstimatorDistributions p={p} controls={<><FlowReadout>Both estimator means are <strong>{ef(a.firstMean)}</strong>. Var(X₁)=<strong>{ef(a.firstVariance)}</strong>; Var(S/4)=<strong>{ef(a.averagedVariance)}</strong>; residual variance=<strong>{ef(a.residual)}</strong>. All 16 records are enumerated exactly; there is no Monte Carlo noise.</FlowReadout><FlowControls><FlowSlider name="Common success probability p" value={p} onChange={setP} min={.05} max={.95} step={.05} /><button type="button" onClick={()=>setP(.2)}>Reset</button></FlowControls></>} /><ETable label="Every raw record and residual contribution" columns={['Record','S','X₁','S/4','Mass','Mass × (X₁−S/4)²']} rows={a.rows.map(r=>[r.bits.join(''),r.count,r.first,r.count/4,ef(r.mass),ef(r.mass*(r.first-r.count/4)**2)])} /></EFigure></FlowLab>;
}
export function SummaryLab() {
  const [bits,setBits]=useState([...SUFFICIENCY_REFERENCE]),[model,setModel]=useState('common'),[pA,setPA]=useState(.8),[pB,setPB]=useState(.3);
  return <FlowLab id="ef-E14" label="Summary sufficiency depends on the sampling model"><EFigure id="E14"><ModelRecords bits={bits} grouped={model==='grouped'} pA={pA} pB={pB} controls={<FlowControls><FlowChoice label="Sampling model" value={model} onChange={setModel} options={[[ 'common','One common p'],['grouped','Separate group probabilities']]}/><FlowSlider name={model==='common' ? 'Common success probability p' : 'Group A success probability'} value={pA} onChange={setPA} min={.05} max={.95} step={.05} />{model==='grouped'&&<FlowSlider name="Group B success probability" value={pB} onChange={setPB} min={.05} max={.95} step={.05}/>}<div className="ef-bit-controls">{bits.map((bit,i)=><button key={i} type="button" aria-pressed={Boolean(bit)} aria-label={'Toggle observation '+(i+1)+' in group '+(i<4?'A':'B')+'; current '+bit} onClick={()=>setBits(old=>old.map((v,j)=>j===i?1-v:v))}>{i+1}: {bit}</button>)}</div><button type="button" onClick={()=>setBits([1,1,1,0,1,1,1,0])}>Move successes between groups</button><button type="button" onClick={()=>{setBits([...SUFFICIENCY_REFERENCE]);setModel('common');setPA(.8);setPB(.3);}}>Reset</button></FlowControls>} /></EFigure></FlowLab>;
}
export function NormalizerLab() {
  const [eta,setEta]=useState(0);
  return <FlowLab id="ef-E26" label="Finite weights, normalizer and moments"><EFigure id="E26"><FiniteWorkflow eta={eta} controls={<FlowControls><FlowSlider name="Natural parameter η" value={eta} onChange={setEta} min={-5} max={5} step={.1}/><button type="button" onClick={()=>setEta(0)}>Reset</button></FlowControls>} /></EFigure></FlowLab>;
}
const initialCounts=[2,5,3],initialFit=finiteMomentFit(initialCounts).parameters;
export function CountFitLab() {
  const [counts,setCounts]=useState(initialCounts),[countDrafts,setCountDrafts]=useState(initialCounts.map(String)),[eta,setEta]=useState(initialFit),[drafts,setDrafts]=useState(initialFit.map(String)),[error,setError]=useState('');
  const fitCounts=value=>{const a=finiteMomentFit(value);setEta(a.parameters);setDrafts(a.parameters ? a.parameters.map(String) : ['','']);};
  const preset=value=>{setCounts(value);setCountDrafts(value.map(String));fitCounts(value);setError('');};
  const editCount=(i,text)=>{
    setCountDrafts(old=>old.map((v,j)=>j===i?text:v));
    const value=Number(text);
    if(!/^\d+$/.test(text)||!Number.isInteger(value)||value<0||value>20){setError('Each count must be an integer from 0 through 20. The last valid calculation stays visible.');return;}
    setCounts(old=>old.map((v,j)=>j===i?value:v));setError('');
  };
  const editEta=(i,text)=>{
    const next=drafts.map((v,j)=>j===i?text:v);setDrafts(next);
    if(next.some(v=>v.trim()===''||!Number.isFinite(Number(v)))){setError('Both natural parameters must be finite numbers. The last valid model stays visible.');return;}
    const values=next.map(Number);
    try{finiteTeachingFamily(...values);setEta(values);setError('');}catch(e){setError(e.message);}
  };
  const countInvalid=countDrafts.some(v=>!/^\d+$/.test(v)||Number(v)>20);
  const parameterInvalid=(eta!==null||drafts.some(v=>v.trim()!==''))&&drafts.some(v=>v.trim()===''||!Number.isFinite(Number(v)));
  let visibleError=countInvalid ? 'Each count must be an integer from 0 through 20. The last valid calculation stays visible.' : parameterInvalid ? 'Both natural parameters must be finite numbers. The last valid model stays visible.' : error;
  if(drafts.every(v=>v.trim()!==''&&Number.isFinite(Number(v))))try{finiteTeachingFamily(...drafts.map(Number));}catch(e){visibleError=e.message;}
  return <FlowLab id="ef-E32" label="Mean triangle, finite count fit and boundary cases"><EFigure id="E32"><FitDrawing counts={counts} parameters={eta} error={visibleError} controls={<FlowControls>{[-1,0,1].map((x,i)=><label key={x} className="ef-input">Count at x={x}<input type="text" inputMode="numeric" value={countDrafts[i]} aria-invalid={countInvalid} onChange={event=>editCount(i,event.target.value)}/></label>)}{[0,1].map(i=><label key={i} className="ef-input">Natural parameter η{i+1}<input type="text" inputMode="decimal" value={drafts[i]} aria-invalid={parameterInvalid||Boolean(visibleError)&&!countInvalid} onChange={event=>editEta(i,event.target.value)}/></label>)}<button type="button" onClick={()=>{fitCounts(counts);setCountDrafts(counts.map(String));setError('');}}>Fit counts</button><button type="button" onClick={()=>preset([2,0,3])}>Remove middle outcome</button><button type="button" onClick={()=>preset([0,0,0])}>Empty sample</button><button type="button" onClick={()=>preset([...initialCounts])}>Reset</button></FlowControls>} /></EFigure></FlowLab>;
}
export function MergeLab() {
  const [shift,setShift]=useState(0);
  return <FlowLab id="ef-E41" label="Centered Gaussian block merge with actual shifted observations"><EFigure id="E41"><MergeDrawing shift={shift} controls={<FlowControls><FlowSlider name="Shift every right-block observation" value={shift} onChange={setShift} min={-5} max={5} step={.5}/><button type="button" onClick={()=>setShift(0)}>Reset</button></FlowControls>} /></EFigure></FlowLab>;
}
export function CoordinatesLab() {
  const [alpha,setAlpha]=useState(2),[beta,setBeta]=useState(3);
  return <FlowLab id="ef-E55" label="The same prior in probability and log-odds coordinates"><EFigure id="E55"><CoordinateDrawing alpha={alpha} beta={beta} controls={<FlowControls><FlowSlider name="Beta shape α" value={alpha} onChange={setAlpha} min={1} max={8} step={1}/><FlowSlider name="Beta shape β" value={beta} onChange={setBeta} min={1} max={8} step={1}/><button type="button" onClick={()=>{setAlpha(2);setBeta(3);}}>Reset</button></FlowControls>} /></EFigure></FlowLab>;
}
