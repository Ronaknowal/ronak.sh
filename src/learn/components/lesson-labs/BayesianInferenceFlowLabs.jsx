import { useState } from 'react';
import {
  betaPriors, betaPosteriorState, betaRegionState, batchPredictionState,
  freshEvidenceState, exposureState, categoryState, knownNormalState,
  normalInverseGammaState, sleepInferenceState, wordsState, modelEvidenceState,
  lossState, reporterGridState,
} from '../../data/bayesian-inference-flow-models.js';
import { Figure, Scene, Label, Ledger, Table, TokenRows, Simplex, Choice, CountInput, Range, Controls, number } from './BayesianInferenceDrawings.jsx';
import { BetaDrawing, PowerDrawing, BatchDrawing, FreshDrawing } from './BayesianInferenceFigures.jsx';
import {
  ExposureDrawing, GammaDrawing, CountMixtureDrawing, CategoryTokens,
  CovarianceDrawing, QuadraticDrawing, PrecisionDrawing, NormalPredictionDrawing,
  VarianceForkDrawing, CompleteSquareDrawing, StudentPredictionDrawing,
  SleepPairsDrawing, SleepSummaryDrawing,
} from './BayesianInferenceContinuousFigures.jsx';
import { PredictiveWordsDrawing, EvidenceIntegralDrawing, ModelIndicatorDrawing, LossDrawing, GridDrawing } from './BayesianInferencePredictiveFigures.jsx';

const priorOptions = betaPriors.map(prior => [prior.id, `${prior.label ?? prior.name ?? prior.id}: Beta(${prior.a},${prior.b})`]);
function count(raw, label) {
  if (String(raw).trim() === '') throw new RangeError(`${label} needs a whole-number entry; a blank is not zero.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite whole number.`);
  return value;
}
function derive(compute) {
  try { return { state: compute(), error: null }; }
  catch (error) { return { state: null, error: error.message }; }
}
function ErrorMessage({ error }) {
  return error ? <p className="bf-error" role="alert">{error} The computed drawing is cleared until the input is valid.</p> : null;
}
export function BetaUpdateLab() {
  const [prior,setPrior]=useState('moderate'),[successes,setSuccesses]=useState('8'),[failures,setFailures]=useState('2');
  const {state,error}=derive(()=>betaPosteriorState(prior,count(successes,'Successes'),count(failures,'Failures')));
  const reset=()=>{setPrior('moderate');setSuccesses('8');setFailures('2');};
  return <Figure id="lab-beta-update" controls={<Controls onReset={reset}><Choice label="Proper Beta prior" value={prior} onChange={setPrior} options={priorOptions} /><CountInput label="Observed successes" value={successes} onChange={setSuccesses} max={40} /><CountInput label="Observed failures" value={failures} onChange={setFailures} max={40} /></Controls>} caption="Each displayed token is an observed outcome. Prior exponents and actual outcome powers compose the posterior. Threshold .70 and equal-tailed 95% level stay fixed; zero observations retain the selected proper prior."><ErrorMessage error={error} />{state&&<><TokenRows successes={state.successes} failures={state.failures} /><PowerDrawing prior={state.prior} successes={state.successes} failures={state.failures} /><BetaDrawing state={state} /><Ledger rows={[[`Posterior shapes`,`${state.a}, ${state.b}`],['Mean / next success probability',number(state.mean)],['Variance',number(state.variance)],['Mode',state.mode===null?'flat; no unique mode':`${number(state.mode)} (${state.modeKind})`],['Observed sample rate',state.sampleRate===null?'undefined with no observations':number(state.sampleRate)]]} /></>}</Figure>;
}
export function BetaRegionLab() {
  const [threshold,setThreshold]=useState(.7),[level,setLevel]=useState(.95);
  const state=betaRegionState(10,4,threshold,level);
  return <Figure id="lab-beta-region" controls={<Controls onReset={()=>{setThreshold(.7);setLevel(.95);}}><Range label="Right-event threshold" value={threshold} onChange={setThreshold} min={0} max={1} step={.01} /><Choice label="Equal-tailed credible level" value={String(level)} onChange={value=>setLevel(Number(value))} options={[[`.9`,'90%'],[`.95`,'95%'],[`.99`,'99%']]} /></Controls>} caption="The fixed Beta(10,4) density and underlying 8/2 data do not change. The threshold selects an event; the credible level selects quantile endpoints. At threshold 0 the probability is 1; at 1 it is 0, with no endpoint point mass."><BetaDrawing state={state} region="threshold" prior={false} /><Table label="Selected credible region and right event" headers={['Region','Lower','Upper','Probability']} rows={[[`Central ${number(100*level)}%`,number(state.low),number(state.high),level],[`θ>${number(threshold)}`,threshold,1,number(state.above)]]} /></Figure>;
}
export function BatchPredictionLab() {
  const [size,setSize]=useState('10'),[cutoff,setCutoff]=useState('9');
  const {state,error}=derive(()=>batchPredictionState(10,4,count(size,'Future size'),count(cutoff,'Inclusive cutoff')));
  const editSize=raw=>{setSize(raw);const n=Number(raw),k=Number(cutoff);if(String(raw).trim()!==''&&Number.isInteger(n)&&n>=1&&n<=20&&Number.isInteger(k)&&k>n)setCutoff(String(n));};
  return <Figure id="lab-batch-prediction" controls={<Controls onReset={()=>{setSize('10');setCutoff('9');}}><CountInput label="Future visitor count m (1–20)" value={size} onChange={editSize} max={20} /><CountInput label="Inclusive success cutoff k (0–m)" value={cutoff} onChange={setCutoff} max={state?.m??20} /></Controls>} caption="The same Beta(10,4) posterior generates the integrated amber count probabilities and the same-mean plug-in cyan comparison. Reducing m below the current cutoff clamps the cutoff to m. For m=1 both predictions agree; cutoff 0 includes every outcome."><ErrorMessage error={error} />{state&&<BatchDrawing state={state} />}</Figure>;
}
export function PriorSensitivityLab() {
  const [prior,setPrior]=useState('moderate'),state=betaPosteriorState(prior,8,2),weight=state.prior.a+state.prior.b,priorMean=state.prior.a/weight,total=weight+10;
  return <Figure id="lab-prior-sensitivity" controls={<Controls onReset={()=>setPrior('moderate')}><Choice label="Proper prior for the same 8/2 data" value={prior} onChange={setPrior} options={priorOptions} /></Controls>} caption="Changing a prior changes the model's initial uncertainty and its mean weight; it adds no observed visitors. The same 8 successes and 2 failures remain fixed. The displayed prior weight is not its kernel exponent sum."><BetaDrawing state={state} /><Scene label="Actual mean-weight contributions from the selected proper prior and fixed data" height={175}><rect x="25" y="35" width={310*weight/total} height="25" className="bf-bar prior" /><rect x={25+310*weight/total} y="35" width={310*10/total} height="25" className="bf-bar posterior" /><Label x="25" y="100" anchor="start">prior mean {number(priorMean)}, weight {weight}</Label><Label x="25" y="135" anchor="start">data mean .8, weight 10</Label><Label x="25" y="170" anchor="start">posterior mean {number(state.mean)}</Label></Scene><Ledger rows={[[`Weighted numerator`,`${number(weight*priorMean)} + 8`],['Mean-weight denominator',total],['Prior kernel powers',`${state.prior.a-1}, ${state.prior.b-1}`]]} /></Figure>;
}
export function FreshEvidenceLab() {
  const [successes,setSuccesses]=useState('3'),[failures,setFailures]=useState('2');
  const {state,error}=derive(()=>freshEvidenceState(count(successes,'Fresh successes'),count(failures,'Fresh failures')));
  return <Figure id="lab-fresh-evidence" controls={<Controls onReset={()=>{setSuccesses('3');setFailures('2');}}><CountInput label="Fresh D2 successes" value={successes} onChange={setSuccesses} max={20} /><CountInput label="Fresh D2 failures" value={failures} onChange={setFailures} max={20} /></Controls>} caption="D2 represents genuinely new dataset identities. Sequential and pooled unique updates agree; the crossed 18,6 route repeats D1 instead. With zero fresh outcomes, the posterior remains 10,4."><ErrorMessage error={error} />{state&&<><FreshDrawing state={state} /><BetaDrawing state={state} /></>}</Figure>;
}
export function ExposureLab() {
  const [hours,setHours]=useState(.5),[horizon,setHorizon]=useState(1),state=exposureState(hours,horizon);
  return <Figure id="lab-exposure" controls={<Controls onReset={()=>{setHours(.5);setHorizon(1);}}><Choice label="First exposure with 3 events (hours)" value={String(hours)} onChange={value=>setHours(Number(value))} options={[[`.5`,'0.5 h'],['1','1 h'],['2','2 h'],['4','4 h']]} /><Choice label="Unobserved future duration (hours)" value={String(horizon)} onChange={value=>setHorizon(Number(value))} options={[[`.5`,'0.5 h'],['1','1 h'],['2','2 h']]} /></Controls>} caption="The second exposure stays 2 hours with 6 events. Longer observed duration changes the inferred rate; changing only future duration changes the count prediction without refitting the rate posterior. All intervals and units are physical hours."><ExposureDrawing state={state} /><GammaDrawing state={state} /><CountMixtureDrawing state={state} /></Figure>;
}
export function CategoryLab() {
  const [countC,setCountC]=useState('1');const {state,error}=derive(()=>categoryState(count(countC,'Category C count')));
  return <Figure id="lab-category" controls={<Controls onReset={()=>setCountC('1')}><CountInput label="Observed category C count (0–5)" value={countC} onChange={setCountC} max={5} /></Controls>} caption="Prior shapes 1,1,1 and observed A count 6 / B count 3 stay fixed. Every new C token changes the observed total. C count 0 leaves a declared C vertex and prior shape 1; no independent probability slider can move the state off the sum-one simplex."><ErrorMessage error={error} />{state&&<><CategoryTokens state={state} /><CovarianceDrawing state={state} /><Ledger rows={[[`Current shapes`,state.shapes.join(', ')],['Current observed total',state.counts.reduce((sum,value)=>sum+value,0)],['Next C probability',number(state.means[2])]]} /></>}</Figure>;
}
export function KnownNormalLab() {
  const [n,setN]=useState(4),state=knownNormalState(n);
  return <Figure id="lab-known-normal" controls={<Controls onReset={()=>setN(4)}><Choice label="Hypothetical dataset size; mean fixed 4" value={String(n)} onChange={value=>setN(Number(value))} options={[1,4,16,64].map(value=>[String(value),`${value} observations`])} /></Controls>} caption="Each choice is a declared different hypothetical dataset with the same observed mean 4 and known noise SD 2, rather than repeated copies of four observations. Prior centre 0/SD 1 stays fixed. The posterior variance shrinks, while future variance retains noise floor 4."><QuadraticDrawing state={state} /><PrecisionDrawing state={state} /><NormalPredictionDrawing state={state} /></Figure>;
}
const kappaOptions=[['.25','0.25'],['1','1'],['4','4']];
export function UnknownNormalLab() {
  const [kappa,setKappa]=useState(1),state=normalInverseGammaState([2,3,4,7],kappa);
  return <Figure id="lab-unknown-normal" controls={<Controls onReset={()=>setKappa(1)}><Choice label="Proper prior mean weight κ0" value={String(kappa)} onChange={value=>setKappa(Number(value))} options={kappaOptions} /></Controls>} caption="The actual synthetic sample 2,3,4,7 remains fixed, as do prior m0=0, α0=2, β0=2 and interval 95%. Changing κ0 alters the between-centre contribution and posterior scales, while α = 4 and Student degrees of freedom 8 remain unchanged."><VarianceForkDrawing kappa={kappa} /><CompleteSquareDrawing state={state} /><StudentPredictionDrawing state={state} /></Figure>;
}
export function SleepInferenceLab() {
  const [kappa,setKappa]=useState(1),[contrast,setContrast]=useState('second-first'),state=sleepInferenceState(kappa,contrast);
  return <Figure id="lab-sleep-inference" controls={<Controls onReset={()=>{setKappa(1);setContrast('second-first');}}><Choice label="Proper prior mean weight κ0" value={String(kappa)} onChange={value=>setKappa(Number(value))} options={kappaOptions} /><Choice label="Within-person paired contrast" value={contrast} onChange={setContrast} options={[[`second-first`,'Drug2 − Drug1'],['first-second','Drug1 − Drug2']]} /></Controls>} caption="All ten original pairs retain their IDs and hour units. Reversal negates the posterior centre and exchanges signs/order of interval endpoints, leaving SSE, β and widths unchanged. Proper zero-centred prior α₀ = 2 / β₀ = 2 and Student degrees of freedom 14 remain fixed; the interval level is 95%."><SleepPairsDrawing state={state} /><SleepSummaryDrawing state={state} /><StudentPredictionDrawing state={state} hours /><Ledger rows={[[`P(mean>0)`,number(state.meanAboveZero)],['P(future difference>0)',number(state.futureAboveZero)]]} /></Figure>;
}
export function PredictiveRunsLab() {
  const [pattern,setPattern]=useState('clustered'),[reference,setReference]=useState('posterior'),state=wordsState(pattern,reference);
  return <Figure id="lab-predictive-runs" controls={<Controls onReset={()=>{setPattern('clustered');setReference('posterior');}}><Choice label="Observed fixed 8/2 word" value={pattern} onChange={setPattern} options={[[`clustered`,'Clustered:2 runs'],['spread','Spread:5 runs']]} /><Choice label="Complete replicated reference experiment" value={reference} onChange={setReference} options={[[`prior`,'Prior predictive Beta(2,2)'],['posterior','Posterior predictive Beta(10,4)'],['same-count','Conditional ordering:8 successes']]} /></Controls>} caption="The event is runs at most the observed word's run count. Prior and posterior replication allow differing totals in 1024 words; conditioning on eight successes selects 45 equal-weight words. Exact enumeration has no simulation noise and is not labelled a classical p-value."><PredictiveWordsDrawing state={state} /></Figure>;
}
export function ModelEvidenceLab() {
  const [prior,setPrior]=useState('uniform'),[modelPrior,setModelPrior]=useState(.5),state=modelEvidenceState(prior,modelPrior);
  return <Figure id="lab-model-evidence" controls={<Controls onReset={()=>{setPrior('uniform');setModelPrior(.5);}}><Choice label="Proper parameter prior within M1" value={prior} onChange={setPrior} options={priorOptions.filter(([id])=>id!=='low')} /><Choice label="Separate prior model probability P(M1)" value={String(modelPrior)} onChange={value=>setModelPrior(Number(value))} options={[[`.1`,'0.1'],[`.5`,'0.5'],[`.9`,'0.9']]} /></Controls>} caption="Both branches describe the same ordered 8/2 word. Changing P(M1) changes model-posterior odds but not the Bayes factor. Changing M1's proper parameter prior changes its evidence. M0 is the fixed fair-rate model; a continuous density height is never substituted for its discrete branch mass."><EvidenceIntegralDrawing state={state} /><ModelIndicatorDrawing state={state} /></Figure>;
}
export function PosteriorLossLab() {
  const [cost,setCost]=useState(19),[view,setView]=useState('loss'),state=lossState(cost,view);
  return <Figure id="lab-posterior-loss" controls={<Controls onReset={()=>{setCost(19);setView('loss');}}><Range label="Synthetic wrong-launch cost" value={cost} onChange={setCost} min={1} max={25} step={1} /><Choice label="Decision consequence rule" value={view} onChange={setView} options={[[`loss`,'Threshold-event expected loss'],['utility','Linear 100θ−70 utility']]} /></Controls>} caption="The posterior and .70 event remain fixed. The threshold-loss decision changes with declared cost; the separate linear utility remains positive. At the exact cost cutoff q/(1−q), launch and wait are indifferent. These synthetic consequences demonstrate the calculation, rather than a real decision recommendation."><LossDrawing state={state} /></Figure>;
}
export function ReporterGridLab() {
  const [cells,setCells]=useState(100),state=reporterGridState(cells);
  return <Figure id="lab-reporter-grid" controls={<Controls onReset={()=>setCells(100)}><Choice label="Complete midpoint grid cell count" value={String(cells)} onChange={value=>setCells(Number(value))} options={[[`100`,'100 cells'],['1000','1,000 cells'],['10000','10,000 cells']]} /></Controls>} caption="The detector has true-positive .9 and false-positive .1, with proper Beta(2,2) prior and 8 positive/2 negative reports. All selected grid cells contribute to the full sums; the exact positive-mixture reference uses identical inputs and stays fixed. Refinement is a comparison, not a universal error certificate."><GridDrawing state={state} /></Figure>;
}
