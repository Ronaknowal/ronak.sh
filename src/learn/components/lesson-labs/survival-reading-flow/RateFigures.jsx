import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, Lifelines, QuantityControl, CurvePlot, MassStrip, Operation, Arrow, Value, NumberBars, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { PUMPS, kaplanMeier, staircase } from './univariate-models.js';
import { conditionalExponential, weibullWindow, exposureFit } from './rate-comparison-models.js';

const samples=(fn,end,count=120,start=0)=>Array.from({length:count+1},(_,i)=>{const x=start+(end-start)*i/count;return[x,fn(x)];});

export function ConditionalRateFigure() {
  const [width,setWidth]=useState(1), model=conditionalExponential(.2,width);
  return <Drawing id="D15" label="A rate and a finite-window probability have different units">
    <MassStrip label="Among pumps still working at the beginning of this window" segments={[{label:'Fail during window',value:model.probability,color:colors.event},{label:'Still working at its end',value:1-model.probability,color:colors.observed}]} />
    <Operation><Value label="Instantaneous rate">0.2 per day</Value><Arrow label={`accumulate across ${n(width)} days`} /><Value label="Integrated rate">{n(model.area)}</Value><Arrow label="1 − exp(−area)" /><Value label="Conditional failure chance">{n(model.probability)}</Value></Operation>
    <CurvePlot lines={[{points:samples(t=>-Math.expm1(-.2*t),10),label:'Finite-window probability'}]} xMax={10} xLabel="window length in days" yLabel="failure probability" cursor={width} points={[[width,model.probability]]} />
    <QuantityControl label="Window length" value={width} onChange={setWidth} min={.01} max={10} step={.1} unit="days" reset={()=>setWidth(1)} />
    <FlowReadout>The probability is <strong>{n(model.probability)}</strong>; dividing by the window gives {n(model.probability/width)} per day. This approaches the rate 0.2 as the window shrinks. Starting width: 1 day.</FlowReadout>
  </Drawing>;
}

export function AccumulatedRateFigure() {
  const [rate,setRate]=useState(.2),area=rate*3,survival=Math.exp(-area);
  return <Drawing id="D16" label="Accumulated rate is area; survival is its exponential transform">
    <div className="survival-columns"><CurvePlot lines={[{points:[[0,rate],[3,rate]],label:'Constant rate',color:colors.computed}]} xMax={3} yMax={2} yLabel="rate per day" rectangles={[{start:0,end:3,height:rate}]} /><CurvePlot lines={[{points:samples(t=>Math.exp(-rate*t),3),label:'Remaining survival'}]} xMax={3} /></div>
    <Operation><Value label="Three-day rate area">3 × {n(rate)} = {n(area)}</Value><Arrow label="exp(−H)"/><Value label="Survival at day 3">{n(survival)}</Value></Operation>
    <QuantityControl label="Constant rate" value={rate} onChange={setRate} min={0} max={2} step={.05} unit="per day" reset={()=>setRate(.2)} />
    <FlowReadout>H(3) = {n(area)} can exceed one; S(3) = {n(survival)} remains a probability. At rate zero there is no accumulated loss. The starting rate is 0.2 per day.</FlowReadout>
  </Drawing>;
}

export function AgeDependentRateFigure() {
  const [shape,setShape]=useState(2),[age,setAge]=useState(4),[resetKey,setResetKey]=useState(0),model=weibullWindow(shape,age);
  const reset=()=>{setShape(2);setAge(4);setResetKey(key=>key+1);};
  const hazard=t=>shape/12*(t/12)**(shape-1), start=shape<1?.05:0;
  const rates=samples(hazard,27,150,start),rectangles=Array.from({length:60},(_,i)=>({start:age+i*.05,end:age+(i+1)*.05,height:hazard(age+(i+.5)*.05)})),maximum=Math.max(.25,...rates.map(([,y])=>y),...rectangles.map(row=>row.height));
  return <Drawing id="D17" label="The future rate area depends on present age when the rate changes">
    <CurvePlot lines={[{points:rates,color:colors.computed,label:'Weibull rate; scale 12 days'}]} xMax={27} xLabel="age in days" yMax={maximum} yLabel="rate per day" cursor={age} rectangles={rectangles} />
    {shape<1&&<p>The rate tends to infinity at age zero. The drawn rate curve starts at 0.05 days; the probability calculation still includes the full integrable area.</p>}
    <MassStrip label={`Of the pumps that reached age ${n(age)}, what happens in the next 3 days?`} segments={[{label:'Fail',value:model.probability,color:colors.event},{label:'Survive window',value:model.conditionalSurvival,color:colors.observed}]} />
    <QuantityControl key={`age-${resetKey}`} label="Present age" value={age} onChange={setAge} min={0} max={24} unit="days" reset={reset} />
    <QuantityControl key={`shape-${resetKey}`} label="Weibull shape" value={shape} onChange={setShape} min={.5} max={3} step={.1} reset={reset} />
    <FlowReadout>The exact future rate area is <strong>{n(model.area)}</strong>, giving failure chance <strong>{n(model.probability)}</strong>. At the starting age 4 and shape 2, the area is 11/48. Shape 1 makes this fixed three-day chance independent of age.</FlowReadout>
  </Drawing>;
}

export function DiscreteJumpFigure() {
  const groups=kaplanMeier(),na=groups.at(-1).nelsonAalen;
  return <Drawing id="D18" label="A discrete hazard jump and a continuous rate area transform differently">
    <MassStrip label="A conditional failure jump q = 1/2 removes exactly half" segments={[{label:'Removed',value:.5,color:colors.event},{label:'Retained',value:.5}]} />
    <Operation><Value label="Exact logarithmic loss">−log(1 − 1/2) = {n(Math.log(2))}</Value><Arrow label="different quantities"/><Value label="Nelson–Aalen increment">1/2</Value></Operation>
    <CurvePlot lines={[{points:staircase(),label:'KM: multiply (1 − d/n)'},{points:[[0,1],...groups.flatMap((row,index)=>[[row.time,Math.exp(-(groups[index-1]?.nelsonAalen||0))],[row.time,Math.exp(-row.nelsonAalen)]]),[9,Math.exp(-na)]],color:colors.computed,label:'exp(−Nelson–Aalen)'}]} />
    <p>The pump cohort ends at KM = 35/128 = {n(35/128)}, while exp(−25/24) = {n(Math.exp(-na))}. They are not algebraically identical at finite jumps.</p>
    <div className="survival-columns"><CurvePlot lines={[{points:samples(t=>.5+.5*Math.exp(-.2*t),14),label:'Half never fail; half have rate 0.2'}]} xMax={14} /><CurvePlot lines={[{points:[[0,1],[0,.75],...samples(t=>.75*Math.exp(-.2*t),14)],label:'Mass 1/4 fails at the origin; remainder has rate 0.2'}]} xMax={14} /></div>
    <p>These last two curves are explicitly supplied population laws. An unobserved data tail does not establish either law.</p>
  </Drawing>;
}

export function DensityTailFigure() {
  const density=t=>.2*Math.exp(-.2*t),survival=Math.exp(-.8);
  return <Drawing id="D19" label="An exact failure contributes density; a censored observation contributes a tail probability">
    <Lifelines rows={PUMPS.filter(row=>['C','D'].includes(row.id))} max={6} ticks={[0,2,4,6]} />
    <CurvePlot lines={[{points:samples(density,14),label:'Exponential density, rate 0.2'}]} xMax={14} yMax={.2} yLabel="density per day" cursor={4} points={[[4,density(4)]]} rectangles={Array.from({length:100},(_,i)=>({start:4+i*.1,end:4+(i+1)*.1,height:density(4+(i+.5)*.1)}))} />
    <Operation><Value label="C: density height at 4">{n(density(4))} per day</Value><Arrow label="different observation"/><Value label="D: all probability beyond 4">{n(survival)}</Value></Operation>
    <p>The shaded tail continues beyond the drawing at day 14. Its full area is exp(−0.8); a density height is not the probability of one exact continuous time.</p>
  </Drawing>;
}

export function ExposureLikelihoodFigure() {
  const [extra,setExtra]=useState(0),model=exposureFit(extra),rows=PUMPS.map(row=>row.id==='H'?{...row,time:row.time+extra}:row);
  return <Drawing id="D20" label="All observed exposure contributes to the fitted constant rate">
    <Lifelines rows={rows} max={13} ticks={[0,4,9,13]} />
    <Operation><Value label="Recorded failures">{model.events}</Value><Arrow label="divide by summed exposure"/><Value label="Pump-days">{n(model.exposure)}</Value><Arrow/><Value label="Fitted rate">{n(model.rate)} per day</Value></Operation>
    <CurvePlot lines={[{points:samples(eta=>Math.exp(model.relativeLogLikelihood(eta)),0,160,-6),label:'Likelihood / maximum likelihood',color:colors.computed}]} xMin={-6} xMax={0} xTicks={[-6,-3,0]} xLabel="log-rate η" yLabel="likelihood / maximum likelihood" cursor={model.eta} points={[[model.eta,1]]} />
    <QuantityControl label="Extra follow-up for H" value={extra} onChange={setExtra} min={0} max={4} unit="days" reset={()=>setExtra(0)} />
    <FlowReadout>Still four failures, now <strong>{n(model.exposure)} pump-days</strong>: the fitted rate is {n(model.rate)}. More event-free exposure lowers that rate. Starting exposure: 43 pump-days. If there were no failures but 7 days of exposure, the maximum would instead be at rate zero.</FlowReadout>
  </Drawing>;
}

export function RateScoreFigure() {
  const fit=exposureFit(),rate=.2;
  return <Drawing id="D21" label="The score compares the observed event count with rate times exposure">
    <NumberBars rows={[{label:'Observed failures',value:4,color:colors.event},{label:'Rate 0.2 × exposure 43',value:rate*43,color:colors.computed}]} max={rate*43} />
    <Operation><Value label="Log-rate score">4 − 8.6 = −4.6</Value><Arrow label="divide by rate"/><Value label="Rate score">4/0.2 − 43 = −23</Value></Operation>
    <div className="survival-columns"><Value label="At the fitted log-rate: information">{n(fit.informationEta)}</Value><Value label="At the fitted rate: information">{n(fit.informationRate)} days²</Value><Value label="Rate standard error">{n(fit.standardErrorRate)} per day</Value></div>
    <p>A negative score at rate 0.2 asks us to lower it. The coordinates change the score and curvature units, while their optimum still has rate×exposure = 4.</p>
  </Drawing>;
}
