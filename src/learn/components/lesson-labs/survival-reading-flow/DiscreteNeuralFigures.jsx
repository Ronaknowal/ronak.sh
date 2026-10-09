import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing,Lifelines,QuantityControl,CurvePlot,MassStrip,Operation,Arrow,Value,colors,formatNumber as n } from './SurvivalPrimitives.jsx';
import { discreteBranches,scoreGradient } from './tree-time-models.js';

export function ConditionalForkFigure() {
  const [last,setLast]=useState(.25),model=discreteBranches(last);
  const steps=[[0,1],...model.rows.flatMap(row=>[[row.bin*2,row.before],[row.bin*2,row.after]])];
  return <Drawing id="D44a" label="Conditional event questions carry the remaining population into each next interval">
    <div className="survival-conditional-forks">{model.rows.map(row=><div key={row.bin}><p>Interval ({2*(row.bin-1)}, {2*row.bin}] days · incoming mass <strong>{n(row.before)}</strong></p><div className="survival-fork-body"><span className="survival-fork-continue">↓ multiply {n(1-row.hazard)}<br/>Continue: <strong>{n(row.after)}</strong></span><span className="survival-fork-event">↘ multiply q = {n(row.hazard)}<br/>First failure: <strong>{n(row.mass)}</strong><br/>■ ends this path</span></div></div>)}</div>
    <CurvePlot lines={[{points:steps,label:'Survival after each complete interval'}]} xMax={6} xTicks={[0,2,4,6]}/>
    <QuantityControl label="Third-interval failure probability" value={last} onChange={setLast} min={0} max={1} step={.01} reset={()=>setLast(.25)}/>
    <FlowReadout>Of the starting population, <strong>{n(.72*last)}</strong> fails in interval 3 and <strong>{n(model.survival)}</strong> remains at day 6; 0.72 reached this interval. Earlier branches remain unchanged. Final survivors have unknown later outcomes, not guaranteed permanent survival.</FlowReadout>
  </Drawing>;
}

export function PersonPeriodObservationFigure() {
  const cases=[{id:'Event',time:5,event:true,bins:[0,0,1],likelihood:.18},{id:'Censor at 4',time:4,event:false,bins:[0,0],likelihood:.72},{id:'Censor at 3',time:3,event:false,bins:[0],likelihood:.9}];
  return <Drawing id="D44b" label="Only completely answered interval questions create binary rows">
    {cases.map(subject=><div key={subject.id}><Lifelines rows={[subject]} max={6} ticks={[0,2,4,6]}/><div className="survival-period-rows">{[1,2,3].map(bin=><div key={bin} className={bin>subject.bins.length?'survival-unobserved-period':''}><strong>({2*(bin-1)}, {2*bin}]</strong><span>{bin<=subject.bins.length?`${subject.id}, bin ${bin}, event ${subject.bins[bin-1]}, feature x@0`:'No binary row: partial or future observation'}</span></div>)}</div><p>Retained grouped likelihood: {subject.likelihood}. {subject.time===3?'The partial second interval is discarded by this grouped convention; 0.9 is not an exact-day continuous likelihood.':''}</p></div>)}
  </Drawing>;
}

export function OddsVersusRateFigure() {
  const area=-Math.log(.8);
  return <Drawing id="D45a" label="Doubling conditional odds differs from doubling accumulated rate">
    <MassStrip label="Shared starting conditional probability" segments={[{label:'Event',value:.2,color:colors.event},{label:'No event',value:.8}]}/>
    <Operation><Value label="Event : no-event odds">0.2 / 0.8 = 0.25</Value><Arrow label="× 2"/><Value label="New odds">0.5</Value><Arrow label="divide by 1 + odds"/><Value label="Event probability">1/3 = {n(1/3)}</Value></Operation>
    <CurvePlot lines={[{points:[[0,area],[1,area]],label:'Illustrative constant rate over one day',color:colors.computed}]} xMax={1} yMax={.5} yLabel="rate per day" rectangles={[{start:0,end:1,height:area}]}/>
    <Operation><Value label="Integrated rate">−log(0.8) = {n(area)}</Value><Arrow label="× 2"/><Value label="New area">{n(2*area)}</Value><Arrow label="1 − exp(−area)"/><Value label="Event probability">0.36</Value></Operation>
    <div className="survival-probability-comparison"><span style={{left:'20%'}}>●</span><span style={{left:`${100/3}%`}}>◆</span><span style={{left:'36%'}}>│</span></div><p>Common 0–1 ruler: ● baseline 0.2 · ◆ doubled odds 1/3 · │ doubled rate area 0.36.</p>
  </Drawing>;
}

export function SmallProbabilityFigure() {
  const eta=-20,a=Math.exp(eta),q=-Math.expm1(-a),loss=-Math.log(q),gradient=-a/Math.expm1(a),curvature=a/2-a*a/6+a**4/180;
  return <Drawing id="D45b" label="Compute the tiny event's log likelihood before display rounding">
    <Operation><Value label="Linear predictor η">−20</Value><Arrow label="exp"/><Value label="Positive accumulated rate a">{a.toExponential(9)}</Value></Operation>
    <div className="survival-columns"><Operation><Value label="Event log path">log(−expm1(−a))</Value><Arrow label="negate"/><Value label="Event loss">{loss.toFixed(11)}</Value></Operation><Operation><Value label="No-event log path">−a</Value><Arrow label="negate"/><Value label="No-event loss">{a.toExponential(9)}</Value></Operation></div>
    <Operation><Value label="Event loss gradient">{gradient.toFixed(12)}</Value><Arrow label="differentiate stably"/><Value label="Event curvature">{curvature.toExponential(9)}</Value></Operation>
    <p>q = {q.toExponential(9)} rounds to {n(q)} at six decimals. The rounded display must not be fed back into the loss. The small-a curvature uses its local series to avoid cancellation.</p>
  </Drawing>;
}

export function IntervalBlockSolverFigure() {
  const rows=[[1,1,0],[1,2,0],[1,3,1],[2,1,0],[2,2,0],[3,1,0],[4,1,1],[5,1,0],[5,2,0],[5,3,1],[6,1,0],[6,2,0],[6,3,0]];
  return <Drawing id="D45c" label="Each person-period row selects one baseline coefficient and one subject's features">
    <div className="survival-period-rows">{rows.map(([subject,bin,event],index)=><div key={index}><strong>Subject {subject}, bin {bin}</strong><span>event {event}; η = α{bin} + β x{subject}</span></div>)}</div>
    <div className="survival-block-hessian"><div><strong>D: interval baseline block</strong><div className="survival-matrix-three">{['D₁','0','0','0','D₂','0','0','0','D₃'].map((cell,index)=><span key={index}>{cell}</span>)}</div></div><div><strong>B: baseline–feature</strong><span>B₁</span><span>B₂</span><span>B₃</span></div><div><strong>Bᵀ: shared coupling</strong><span>B₁ B₂ B₃</span></div><div><strong>C: feature curvature</strong><span>C</span></div></div>
    <Operation><Value label="Baseline block D">Diagonal: invert its entries</Value><Arrow label="eliminate baseline direction"/><Value label="Smaller feature solve">C − BᵀD⁻¹B</Value><Arrow/><Value label="Recover baseline update">Back-substitute</Value></Operation>
    <p>These are six subjects and thirteen binary rows. The demonstration fits with ridge 0.5 on all four parameters; repeated rows do not increase the independent subject count. A larger feature system needs a linear solve, not a dense inverse.</p>
  </Drawing>;
}

export function NeuralCoxAnatomyFigure() {
  const inputs=[50,170],hidden=[25,110,195];
  return <Drawing id="D46a" label="A neural score replaces the feature map while retaining full risk-set competition">
    <div className="survival-network"><svg viewBox="0 0 500 220" preserveAspectRatio="none" aria-hidden="true">{inputs.flatMap(y=>hidden.map(h=><path key={`${y}-${h}`} d={`M65 ${y}L235 ${h}`} fill="none" stroke={colors.observed} strokeWidth="1.5"/>))}{hidden.map(h=><path key={h} d={`M265 ${h}L435 110`} fill="none" stroke={colors.computed} strokeWidth="1.5"/>)}</svg><span style={{left:'10%',top:'22.7%'}}>x₁</span><span style={{left:'10%',top:'77.3%'}}>x₂</span>{['h₁','h₂','h₃'].map((label,i)=><span key={label} className="survival-network-hidden" style={{left:'50%',top:`${hidden[i]/2.2}%`}}>{label}</span>)}<span className="survival-network-output" style={{left:'90%',top:'50%'}}>s</span></div>
    <div className="survival-network-key"><span>Two measured inputs</span><span>Three units: weighted sum → tanh</span><span>One scalar score</span></div>
    <Operation><Value label="Repeat this network for each eligible subject">sA, sB, sC, …</Value><Arrow label="exp and shared sum"/><Value label="Full current risk denominator">Σ exp(s)</Value><Arrow label="observed event loss"/><Value label="Gradient return">Every score → same network weights</Value></Operation>
    <p>Lines are real trainable connections. The response selects the risk set and event loss; it is not another input measurement.</p>
  </Drawing>;
}

export function NeuralScoreGradientFigure() {
  const [score,setScore]=useState(Math.log(2)),model=scoreGradient(score);
  return <Drawing id="D46b" label="All eligible scores affect the observed event's loss and gradient">
    <div className="survival-score-rows">{['A','B','C'].map((id,index)=><div key={id}><Value label={`${id}: ${index===0?'observed event':'eligible competitor'}`}>weight {n(model.weights[index])}</Value><Arrow label={`divide by ${n(model.denominator)}`}/><Value label="Risk share">{n(model.shares[index])}</Value><Arrow label={index===0?'subtract 1':'subtract 0'}/><Value label="Loss derivative to score">{n(model.gradients[index])}</Value></div>)}</div>
    <MassStrip label="The three shares divide one current competition" segments={model.shares.map((value,i)=>({label:['A','B','C'][i],value}))}/>
    <QuantityControl label="B neural score" value={score} onChange={setScore} min={-Math.log(4)} max={Math.log(4)} step={.05} reset={()=>setScore(Math.log(2))}/>
    <FlowReadout>The full denominator is {n(model.denominator)}, loss <strong>{n(model.loss)}</strong>, and the score derivatives sum to {n(model.gradients.reduce((a,b)=>a+b,0))}. Starting weights 1, 2, 3 give loss log 6 and gradients −5/6, 1/3, 1/2.</FlowReadout>
  </Drawing>;
}

export function CoxGradientScanFigure() {
  return <Drawing id="D46c" label="A suffix sum and a prefix coefficient produce all full-risk score derivatives">
    <div className="survival-score-rows">{[{id:'A',time:1,w:1,suffix:6,event:1},{id:'B',time:2,w:2,suffix:5,event:0},{id:'C',time:3,w:3,suffix:3,event:0}].map(row=><div key={row.id}><Value label={`${row.id}, day ${row.time}`}>weight {row.w}</Value><Arrow label="right-to-left suffix"/><Value label="Current risk total">{row.suffix}</Value><Arrow label="group events / risk total"/><Value label="Group coefficient">{row.event? '1/6':'0'}</Value><Arrow label="left-to-right coefficient prefix"/><Value label="Derivative">{row.w}/6 − {row.event} = {n(row.w/6-row.event)}</Value></div>)}</div>
    <p>Every subject receives the event coefficients from earlier or equal event times where it was eligible. Equal-time subjects use the same suffix beginning at their group's first member; they do not receive arbitrary row-order denominators.</p>
  </Drawing>;
}

export function NeuralRiskBatchFigure() {
  return <Drawing id="D46d" label="A random subject batch removes competitors and changes the Cox objective">
    <div className="survival-columns"><MassStrip label="Full A/B/C risk pool: weights 1, 2, 3" segments={[{label:'A',value:1/6},{label:'B',value:2/6},{label:'C',value:3/6}]}/><MassStrip label="Arbitrary A/C batch: eligible B omitted" segments={[{label:'A',value:1/4},{label:'C',value:3/4,color:colors.event}]}/></div>
    <Operation><Value label="Full event loss">log 6 = {n(Math.log(6))}</Value><Arrow label="different denominator"/><Value label="A/C-only loss">log 4 = {n(Math.log(4))}</Value></Operation>
    <div className="survival-probability-tree"><div><strong>Sample control B</strong><span>Adjusted denominator 1 + 2×2 = 5</span></div><div><strong>Sample control C</strong><span>Adjusted denominator 1 + 2×3 = 7</span></div></div>
    <p>The adjusted denominator's mean is 6, but the mean log denominator is log √35 = {n(.5*Math.log(35))}, below log 6. A sampled objective must be taught as its own objective; unbiased denominators alone do not give unbiased log losses.</p>
  </Drawing>;
}

export function TimeDependentNeuralScoreFigure() {
  return <Drawing id="D46e" label="Every competitor receives the same current event time in a time-varying score">
    <div className="survival-time-score-rows">{['t₁','t₂'].map(time=><div key={time}><strong>Current event time {time}</strong><div>{['A','B','C'].map(id=><span key={id}>g({time}, x{id})<br/>↓ exp(score)</span>)}</div><span>Combine only subjects eligible at this {time}</span></div>)}</div>
    <Operation><Value label="Reference jump at each event time">d / Σ exp(g(tⱼ,x))</Value><Arrow label="multiply this profile's exp(g(tⱼ,x*))"/><Value label="Profile rate increments">Accumulate over event times</Value><Arrow label="exp(−sum)"/><Value label="Profile survival">A time-dependent curve</Value></Operation>
    <p>Using a competitor's own future stopping time in g would answer a different, leaked question. A time-varying score generally has no single fixed multiplier to apply to the whole baseline curve.</p>
  </Drawing>;
}
