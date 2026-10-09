import { useState } from 'react';
import { FlowControls, FlowReadout } from '../LessonFlow.jsx';
import { Drawing, QuantityControl, RiskMembers, CurvePlot, MassStrip, Operation, Arrow, Value, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { COX_ROWS, riskCompetition, newtonTrials, untiedTerms, mergeMoments } from './cox-models.js';
import { useSurvivalState } from './SurvivalLessonState.jsx';

export function CoxCompetitionFigure() {
  const {coefficient,setCoefficient}=useSurvivalState(),model=riskCompetition(coefficient);
  return <Drawing id="D24" label="Features become scores, positive weights and current event shares">
    <RiskMembers rows={COX_ROWS} eventIds={['A']} caption="All six are observed at day 1; A is the observed failure"/>
    <div className="survival-score-rows">{model.members.map(row=><div key={row.id}><strong>{row.id}</strong><Value label="Feature x">{row.x}</Value><Arrow label={`× β ${n(coefficient)}`}/><Value label="Score">{n(row.score)}</Value><Arrow label="exp"/><Value label="Weight">{n(row.weight)}</Value></div>)}</div>
    <MassStrip label={`Divide each weight by their sum ${n(Math.exp(model.logDenominator))}`} segments={model.members.map((row,index)=>({label:row.id,value:row.share,color:[colors.event,colors.observed,colors.computed,'#df9e77','#8db9c0','#c7a7bd'][index]}))}/>
    <QuantityControl label="Cox coefficient" value={coefficient} onChange={setCoefficient} min={-2} max={2} step={.05} reset={()=>setCoefficient(Math.log(2))}/>
    <FlowReadout>A's share is <strong>{n(model.members[0].share)}</strong>; C's is {n(model.members[2].share)}. At the starting β = log 2, A has 1/14 and C has 2/7. β = 0 gives every current subject 1/6. The linked feature-balance drawing below uses this same coefficient.</FlowReadout>
  </Drawing>;
}

export function CoxFeatureBalanceFigure() {
  const {coefficient}=useSurvivalState(),model=riskCompetition(coefficient);
  const distribution=[-1,0,1].map(x=>({label:`x = ${x}`,value:model.members.filter(row=>row.x===x).reduce((sum,row)=>sum+row.share,0),color:x===-1?colors.event:x===0?colors.observed:colors.computed}));
  return <Drawing id="D25" label="The weighted feature balance determines score and information">
    <MassStrip label={`Current day-1 feature distribution, at β = ${n(coefficient)}`} segments={distribution}/>
    <div className="survival-balance-beam"><span className="survival-balance-axis"/>{[-1,0,1].map(x=><span key={x} className="survival-balance-point" style={{left:`${10+40*(x+1)}%`}}><i/><strong>x = {x}</strong></span>)}<span className="survival-balance-mean" style={{left:`${10+40*(model.mean+1)}%`}}>▲</span></div>
    <p>The triangle marks the weighted mean {n(model.mean)}. The observations stay at −1, 0 and 1; changing β in the preceding drawing changes their weights.</p>
    <Operation><Value label="Observed feature of A">−1</Value><Arrow label="minus weighted mean"/><Value label="This event's score">{n(-1-model.mean)}</Value><Arrow label="weighted squared spread"/><Value label="This event's information">{n(model.variance)}</Value></Operation>
    <div className="survival-score-rows">{distribution.map((row,index)=>{const x=index-1;return <div key={x}><Value label={`Feature ${x}`}>{n(row.value)} weight share</Value><Arrow label={`× (${x} − ${n(model.mean)})²`}/><Value label="Information contribution">{n(row.value*(x-model.mean)**2)}</Value></div>;})}</div>
    <p>At β = log 2, the mean is 3/7, score −10/7 and information 26/49. If every feature were the same, the centered spread would be zero and this competition could not identify that coefficient.</p>
  </Drawing>;
}

export function NewtonBacktrackingFigure() {
  const [step,setStep]=useState(0),trace=newtonTrials(),selected=step===0?{beta:3,objective:trace.objective}:trace.trials[step-1];
  const points=Array.from({length:181},(_,i)=>{const beta=-20+i*24/180;return[beta,untiedTerms(beta).objective];});
  return <Drawing id="D26" label="An uncapped Newton trial must actually decrease the objective">
    <p>Separate untied example: C fails at day 2.5. The other five rows are unchanged.</p>
    <CurvePlot lines={[{points,label:'Actual negative partial log likelihood F',color:colors.computed}]} xMin={-20} xMax={4} xTicks={[-20,-8,4]} yMax={65} yTicks={[0,30,60]} xLabel="coefficient β" yLabel="objective F" points={[[3,trace.objective,colors.observed],[selected.beta,selected.objective,colors.event]]}/>
    <Operation><Value label="Start: β = 3">F = {n(trace.objective)}</Value><Arrow label={`Δ = U / I = ${n(trace.direction)}`}/><Value label={step===0?'Current starting state':`Trial fraction ${trace.trials[step-1].fraction}`}>β = {n(selected.beta)}</Value><Arrow/><Value label="Actual trial objective">{n(selected.objective)}</Value></Operation>
    <FlowControls><button type="button" disabled={step===0} onClick={()=>setStep(step-1)}>Previous trial</button><button type="button" disabled={step===3} onClick={()=>setStep(step+1)}>Next trial</button><button type="button" onClick={()=>setStep(0)}>Reset</button></FlowControls>
    <FlowReadout>Step {step+1} of 4. {step===0?'Start with U = −3.824145 and I = 0.177200.':`${trace.trials[step-1].accepted?'Accept':'Reject'}: F ${n(selected.objective)} ${trace.trials[step-1].accepted?'≤':'>'} sufficient-decrease threshold ${n(trace.trials[step-1].threshold)}.`} The ordinary fitter separately caps its direction at 2; this drawing exposes the uncapped full, half and quarter trials.</FlowReadout>
  </Drawing>;
}

export function SuffixMomentsFigure() {
  const suffixes=[5,4,3,2,1].map(time=>({time,members:COX_ROWS.filter(row=>row.time>=time)}));
  const merge=mergeMoments({scale:0,mass:1,mean:-1,variance:0},{scale:0,mass:1,mean:1,variance:0});
  const local=riskCompetition(1,2,[{id:'Huge early',time:1,x:1000},{id:'Later A',time:2,x:-1000},{id:'Later B',time:3,x:-1001},{id:'Later C',time:4,x:-1002}]);
  return <Drawing id="D27" label="A descending scan builds suffix risk moments once">
    <div className="survival-suffix-scan">{suffixes.map((row,index)=><div key={row.time}><strong>Day {row.time}</strong><div className="survival-suffix-subjects">{row.members.map(member=><span key={member.id} className={member.event&&member.time===row.time?'survival-amber':''}>{member.id}</span>)}</div><span>{index===0?'Start with F':'Retain later pool + add this endpoint group'}</span></div>)}</div>
    <p>At day 2, the death pool B/C joins the later pool D/E/F. Equal-time competitors enter together before their event terms are calculated.</p>
    <Operation><Value label="Left centered pool">mass 1, mean −1, spread 0</Value><Arrow label="positive merge"/><Value label="Right centered pool">mass 1, mean +1, spread 0</Value><Arrow/><Value label="Combined">mean {merge.mean}, variance {merge.variance}</Value></Operation>
    <div className="survival-local-scale"><p><strong>A separate extreme-score example</strong></p><p>Day-1 score 1000 has already left the later risk set.</p><div className="survival-feature-sockets">{local.members.map(row=><span key={row.id}>{row.id}<br/>score {row.score}<br/>local scaled weight {n(Math.exp(row.score-local.scale))}</span>)}</div><p>Using the current maximum −1000 keeps the denominator finite on a log scale: <strong>{n(local.logDenominator)}</strong>. A single global shift of 1000 would underflow these later weights.</p></div>
  </Drawing>;
}
