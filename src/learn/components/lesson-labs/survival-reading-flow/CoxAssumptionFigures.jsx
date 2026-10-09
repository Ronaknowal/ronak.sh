import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, QuantityControl, CurvePlot, MassStrip, Operation, Arrow, Value, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { residualDiagnostics, changingEffect, mixtureAt, FIXED_UNTIED_BETA } from './cox-diagnostic-models.js';
const points=(fn,end=12)=>Array.from({length:121},(_,i)=>[i*end/120,fn(i*end/120)]);

export function ProportionalRatesFigure() {
  const H=t=>.1*Math.min(t,4)+.2*Math.max(0,t-4);
  return <Drawing id="D31a" label="A constant hazard ratio does not create a constant probability difference">
    <div className="survival-columns"><CurvePlot lines={[{points:[[0,.1],[4,.1],[4,.2],[12,.2]],label:'Reference',color:colors.observed},{points:[[0,.05],[4,.05],[4,.1],[12,.1]],label:'Comparison: half the rate',color:colors.computed}]} xMax={12} yMax={.25} yLabel="rate per day"/><CurvePlot lines={[{points:points(t=>Math.exp(-H(t))),label:'Reference survival'},{points:points(t=>Math.exp(-.5*H(t))),label:'Comparison survival',color:colors.computed}]} xMax={12}/></div>
    <p>Both rates jump at day 4, keeping their ratio 1/2. Their survival curves accumulate those rates; the vertical probability gap changes with time.</p>
  </Drawing>;
}

export function ChangingEffectFigure() {
  const [change,setChange]=useState(4);
  return <Drawing id="D31b" label="Changing relative rates can make survival curves cross later">
    <CurvePlot lines={[{points:[[0,.1],[12,.1]],label:'Reference rate 0.1'},{points:[[0,.05],[change,.05],[change,.2],[12,.2]],label:'Comparison: 0.05 then 0.2',color:colors.computed}]} xMax={12} yMax={.25} yLabel="rate per day" cursor={change}/>
    <div className="survival-columns"><CurvePlot lines={[{points:points(t=>changingEffect(t,change).referenceH),label:'Reference H'},{points:points(t=>changingEffect(t,change).comparisonH),label:'Comparison H',color:colors.computed}]} xMax={12} yMax={2.4} yLabel="accumulated rate"/><CurvePlot lines={[{points:points(t=>changingEffect(t,change).referenceSurvival),label:'Reference S'},{points:points(t=>changingEffect(t,change).comparisonSurvival),label:'Comparison S',color:colors.computed}]} xMax={12}/></div>
    <QuantityControl label="Rate-change day" value={change} onChange={setChange} min={0} max={8} reset={()=>setChange(4)} unit="days"/>
    <FlowReadout>{change===0?'The comparison starts at the larger rate; there is no later nontrivial crossing.':`Rates reverse at day ${n(change)}, but accumulated rates—and therefore survival—cross at day ${n(1.5*change)}.`} At the starting change day 4, survival crosses at day 6.</FlowReadout>
  </Drawing>;
}

export function SchoenfeldResidualFigure() {
  const model=residualDiagnostics();
  return <Drawing id="D32a" label="At each failure, compare its feature with the current weighted competitors">
    <div className="survival-score-rows">{model.rows.map(row=><div key={row.id}><Value label={`${row.id}, day ${row.time}`}>observed x = {row.x}</Value><Arrow label="minus risk-set mean"/><Value label="Weighted mean">{n(row.mean)}</Value><Arrow/><Value label="Raw residual">{n(row.residual)}</Value></div>)}</div>
    <CurvePlot lines={[{points:[[0,0],[5,0]],label:'Zero residual reference',color:'#aaa'}]} points={model.rows.map(row=>[row.time,row.residual])} xMax={5} yMin={-1.5} yMax={1.5} yTicks={[-1,0,1]} yLabel="raw feature residual"/>
    <p>The fixed coefficient is {n(FIXED_UNTIED_BETA)} in the separately untied example. These event-specific residuals are not outcome residuals y − ŷ.</p>
  </Drawing>;
}

export function ScaledResidualFigure() {
  const model=residualDiagnostics();
  return <Drawing id="D32b" label="Raw residual, information-scaled residual and coefficient-scale display are distinct">
    <div className="survival-score-rows">{model.rows.map(row=><div key={row.id}><Value label={`${row.id}: raw r`}>{n(row.residual)}</Value><Arrow label={`× 4/I; I = ${n(model.information)}`}/><Value label="Scaled residual">{n(row.scaled)}</Value><Arrow label={`+ β̂ ${n(FIXED_UNTIED_BETA)}`}/><Value label="Coefficient-scale value">{n(FIXED_UNTIED_BETA+row.scaled)}</Value></div>)}</div>
    <p>Under the model, the raw residual's conditional expectation is zero. For a small time-varying coefficient departure, its first-order mean is the event's information times that departure; scaling gives a local coefficient-oriented display.</p>
  </Drawing>;
}

export function EfficientTimeScoreFigure() {
  const model=residualDiagnostics();
  return <Drawing id="D32c" label="Time-effect information must account for the fitted constant coefficient">
    <div className="survival-score-rows">{model.rows.map(row=><div key={row.id}><Value label={`Day ${row.time}: g = t − ${model.meanTime}`}>{n(row.g)}</Value><Arrow label={`× residual ${n(row.residual)}`}/><Value label="Time-score contribution">{n(row.g*row.residual)}</Value></div>)}</div>
    <CurvePlot lines={[{points:[[0,FIXED_UNTIED_BETA],[5,FIXED_UNTIED_BETA]],label:'Fitted constant coefficient',color:colors.observed},{points:[[0,FIXED_UNTIED_BETA-.2*model.meanTime],[5,FIXED_UNTIED_BETA+.2*(5-model.meanTime)]],label:'Illustrative alternative: β̂ + 0.2(t − 2.375)',color:colors.computed}]} xMax={5} yMin={-1.5} yMax={.5} yTicks={[-1.5,-.5,.5]} yLabel="coefficient at current event time"/>
    <div className="survival-information-matrix"><span>Iββ<br/><strong>{n(model.information)}</strong></span><span>Iβθ<br/><strong>{n(model.cross)}</strong></span><span>Iθβ<br/><strong>{n(model.cross)}</strong></span><span>Iθθ<br/><strong>{n(model.timeInformation)}</strong></span></div>
    <div className="survival-score-rows">{model.rows.map(row=><div key={row.id}><Value label={`${row.id}: adjusted time direction`}>{n(row.g-model.cross/model.information)}</Value><Arrow label={`square × event spread ${n(row.information)}`}/><Value label="Positive adjusted-information contribution">{n((row.g-model.cross/model.information)**2*row.information)}</Value></div>)}</div>
    <Operation><Value label="Time score Uθ">{n(model.timeScore)}</Value><Arrow label="remove fitted-β information"/><Value label="Iθθ − Iθβ Iββ⁻¹ Iβθ">{n(model.efficient)}</Value><Arrow label="Uθ² / adjusted information"/><Value label="Test statistic">{n(model.statistic)}</Value></Operation>
    <p>The off-diagonal entries encode overlap between the constant coefficient and time interaction. Testing as though the constant coefficient were known would use the wrong information.</p>
  </Drawing>;
}

export function SurvivorMixtureFigure() {
  const [share,setShare]=useState(.5),[multiplier,setMultiplier]=useState(.5),[resetKey,setResetKey]=useState(0),current=mixtureAt(5,share,multiplier);
  const reset=()=>{setShare(.5);setMultiplier(.5);setResetKey(key=>key+1);};
  return <Drawing id="D33a" label="Differential depletion changes the mixture among survivors">
    <MassStrip label="Starting population in both groups" segments={[{label:'Robust: rate 0.1',value:share},{label:'Frail: rate 0.4',value:1-share,color:colors.computed}]}/>
    <div className="survival-score-rows">{[{label:'Reference',scale:1},{label:'Comparison',scale:multiplier}].map(group=><div key={group.label}><Value label={`${group.label}: surviving robust mass`}>{n(share)} × exp(−{n(.1*group.scale)} × 5) = {n(share*Math.exp(-.5*group.scale))}</Value><Value label="Surviving frail mass">{n(1-share)} × exp(−{n(.4*group.scale)} × 5) = {n((1-share)*Math.exp(-2*group.scale))}</Value><Arrow label="divide each by their total"/></div>)}</div>
    <div className="survival-columns"><MassStrip label="Among reference survivors at day 5" segments={[{label:'Robust',value:current.reference.robustShare},{label:'Frail',value:1-current.reference.robustShare,color:colors.computed}]}/><MassStrip label="Among comparison survivors at day 5" segments={[{label:'Robust',value:current.comparison.robustShare},{label:'Frail',value:1-current.comparison.robustShare,color:colors.computed}]}/></div>
    <CurvePlot lines={[{points:points(t=>mixtureAt(t,share,multiplier).ratio,20),label:'Marginal hazard ratio',color:colors.event},{points:[[0,multiplier],[20,multiplier]],label:'Within-type multiplier',color:colors.computed,dashed:true}]} xMax={20} yMax={Math.max(2,multiplier*2)} yLabel="comparison / reference rate" cursor={5}/>
    <QuantityControl key={`share-${resetKey}`} label="Starting robust fraction" value={share} onChange={setShare} min={0} max={1} step={.05} reset={reset}/>
    <QuantityControl key={`multiplier-${resetKey}`} label="Within-type rate multiplier" value={multiplier} onChange={setMultiplier} min={.25} max={1.5} step={.05} reset={reset}/>
    <FlowReadout>At day 5, the reference rate is {n(current.reference.hazard)} and the comparison rate {n(current.comparison.hazard)}, giving ratio <strong>{n(current.ratio)}</strong>. The starting within-type multiplier is 0.5, yet the starting mixture's marginal ratio is about 0.634167. A pure single type or multiplier 1 removes this contrast.</FlowReadout>
    <p>For a separate mixture with rates 1 and 2, initial shares 1/3 and 2/3, the two survivor shares become equal at time log 2. Its marginal rate is then 1.5 and its derivative is −1/4: faster-failing types deplete sooner.</p>
  </Drawing>;
}

export function NonproportionalRemediesFigure() {
  return <Drawing id="D33b" label="Different remedies change different parts of a time-to-event model">
    <div className="survival-columns"><div><CurvePlot lines={[{points:points(t=>Math.exp(-.1*t)),label:'Stratum A baseline'},{points:points(t=>Math.exp(-.3*t)),label:'Stratum B baseline',color:colors.computed}]} xMax={12}/><p><strong>Stratify:</strong> give distinct groups their own baseline curves while sharing the specified coefficient effects.</p></div><div><CurvePlot lines={[{points:[[0,.5],[4,.5],[4,2],[12,2]],label:'A declared time-varying multiplier',color:colors.computed}]} xMax={12} yMax={2.5} yLabel="relative rate"/><p><strong>Change the coefficient with time:</strong> evaluate that effect at each event time.</p></div></div>
    <Operation><Value label="Original lifetime ruler">t: 0 → 6 → 12</Value><Arrow label="stretch the time coordinate × 2"/><Value label="Accelerated-time ruler">2t: 0 → 12 → 24</Value></Operation>
    <p>A time-scale model changes the lifetime clock itself. Each route has its own assumptions and target; none turns a descriptive association into a causal effect.</p>
  </Drawing>;
}
