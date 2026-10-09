import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, Lifelines, QuantityControl, RiskMembers, CurvePlot, MassStrip, Operation, Arrow, Value, NumberBars, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { PUMPS, kaplanMeier, survivalAt, staircase, restrictedArea, logLogInterval } from './univariate-models.js';

const groups = kaplanMeier();

export function RiskSetCurveFigure() {
  const [time, setTime] = useState(4);
  const risk = PUMPS.filter(row => row.time >= time), group = groups.find(row => row.time === time);
  const deaths = group?.deaths ?? 0;
  const previous = groups.filter(row => row.time < time).at(-1)?.survival ?? 1;
  return <Drawing id="D07-D08" label="The current risk roster supplies a factor in the survival staircase">
    <Lifelines rows={PUMPS} cursor={time} />
    <RiskMembers rows={risk} time={time} caption={`At day ${n(time)}, before removing any equal-time endpoint: ${risk.length} observed competitors`} />
    <Operation><Value label="Previous surviving mass">{n(previous)}</Value><Arrow label={`× (1 − ${deaths}/${risk.length})`} /><Value label="After this day">{n(survivalAt(time))}</Value></Operation>
    <CurvePlot lines={[{points:staircase(),label:'Kaplan–Meier survival'}]} cursor={time} points={[[time,survivalAt(time)]]} />
    <QuantityControl label="Inspect day" value={time} onChange={setTime} min={0} max={9} reset={() => setTime(4)} unit="days" />
    <FlowReadout>{deaths ? `${deaths} failure among ${risk.length} at risk makes the next downward step.` : 'There is no failure at this exact day, so the curve stays level.'} {time === 4 && 'C fails and D is censored at the same clock: both enter the denominator of six.'} Starting at day 4: previous 7/8, factor 5/6, result 35/48.</FlowReadout>
  </Drawing>;
}

export function UncensoredCancellationFigure() {
  const rows = Array.from({length:8},(_,i)=>({id:String.fromCharCode(65+i)}));
  return <Drawing id="D09" label="Complete follow-up makes consecutive survival fractions cancel">
    <RiskMembers rows={rows} eventIds={['A']} caption="8 observed subjects; the first failure removes A" />
    <Operation><Value label="First factor">7/8</Value><Arrow label="then one failure from seven"/><Value label="Second factor">6/7</Value><Arrow label="the seven cancels"/><Value label="Surviving fraction">6/8</Value></Operation>
    <RiskMembers rows={rows.slice(2)} caption="Six remaining subjects, all still observed" />
    <p>With B instead lost to observation between failures, the next denominator is six while the previous numerator was seven. That cancellation no longer represents a fully observed cohort.</p>
  </Drawing>;
}

export function ConditionalMassFigure() {
  const masses = [1/8,7/48,35/192,35/128,35/128];
  return <Drawing id="D10" label="Conditional losses allocate probability from the remaining mass">
    <p>At day 4, one of six eligible subjects fails.</p><div className="survival-probability-cells">{['C','D','E','F','G','H'].map(id=><span key={id} className={`survival-probability-cell ${id==='C'?'survival-probability-cell--event':''}`}>{id}<br/>{id==='C'?'failure':'no failure'}</span>)}</div>
    <Operation><Value label="Mass reaching day 4">7/8</Value><Arrow label="× conditional loss 1/6"/><Value label="Mass failing at day 4">7/48</Value><Arrow label="leave 5/6"/><Value label="Remaining after day 4">35/48</Value></Operation>
    <MassStrip label="One whole probability budget" segments={masses.map((value,i)=>({value,label:i===4?'Beyond observed failures':`Failure at day ${[2,4,6,8][i]}`,color:[colors.event,colors.computed,colors.observed,'#df9e77','#999'][i]}))} />
    <MassStrip label="Conditional on B surviving day 3" segments={[1/6,5/24,5/16,5/16].map((value,i)=>({value,label:['Day 4','Day 6','Day 8','Unresolved tail'][i]}))} />
    <div className="survival-columns survival-boundary-trials">{[0,2].map(deaths=><div key={deaths} data-boundary-q={deaths/2}>
      <RiskMembers rows={[{id:'1'},{id:'2'}]} eventIds={deaths?['1','2']:[]} caption={`Separate two-trial miniature: ${deaths} failures, ${2-deaths} survivors`}/>
      <Operation><Value label="Conditional counts">n = 2, d = {deaths}</Value><Arrow label="boundary maximizer"/><Value label="Failure chance q">{deaths/2}</Value></Operation>
      <MassStrip label="Allocate the incoming unit mass" segments={[{label:'Failure',value:deaths/2,color:colors.event},{label:'Survive this trial',value:1-deaths/2,color:colors.survivor}]}/>
      <p>{deaths?'Both trial cells fail: q² is largest at q = 1.':'Both trial cells survive: (1 − q)² is largest at q = 0.'} This is a boundary choice, not an interior derivative evaluated at its pole.</p>
    </div>)}</div>
    <p>The separate miniatures do not replace the A–H observations. The tail slot above is probability that those observations did not locate at an event time.</p>
  </Drawing>;
}

export function GreenwoodRiskFigure() {
  const failures=groups.filter(row=>row.deaths),terms=['1/56','1/30','1/12','1/2'],prefixes=['1/56','43/840','113/840','533/840'];
  return <Drawing id="D11" label="The same single failure carries different uncertainty in small risk sets">
    <div className="survival-columns">{[8,2].map(risk=><div key={risk}><RiskMembers rows={Array.from({length:risk},(_,i)=>({id:String(i+1)}))} eventIds={['1']} caption={`One failure among ${risk}`} /><p>Greenwood increment: 1/[{risk}×{risk-1}] = <strong>{n(1/(risk*(risk-1)))}</strong></p></div>)}</div>
    <NumberBars rows={[{label:'One of eight: 1/56',value:1/56},{label:'One of two: 1/2',value:.5,color:colors.computed}]} max={.5} />
    <p>These two independent miniature cohorts compare variance contributions: the smaller risk set contributes 28 times as much. Now follow the actual A–H cohort's accumulated sum.</p>
    <p id="survival-greenwood-caption">Actual failure terms and running Greenwood sum G. The risk roster is read before any endpoint at that day is removed.</p>
    <div className="survival-scroll" role="region" aria-labelledby="survival-greenwood-caption" tabIndex={0}><table className="survival-greenwood-table"><thead><tr><th scope="col">Day</th><th scope="col">Actual risk roster</th><th scope="col">n</th><th scope="col">d</th><th scope="col">n − d</th><th scope="col">Added d/[n(n − d)]</th><th scope="col">Prefix G</th></tr></thead><tbody>{failures.map((row,index)=><tr key={row.time}><th scope="row">{row.time}</th><td>{PUMPS.filter(pump=>pump.time>=row.time).map(pump=>pump.id).join(', ')}</td><td>{row.risk}</td><td>{row.deaths}</td><td>{row.risk-row.deaths}</td><td>{terms[index]}<br/>{n(row.deaths/(row.risk*(row.risk-row.deaths)))}</td><td>{prefixes[index]}<br/>{n(row.greenwood)}</td></tr>)}</tbody></table></div>
    <p>Censor B at day 3, D at day 4, F at day 7 and H at day 9 add no failure term. They leave the observation roster and can reduce later denominators; D is still in the day-4 denominator of six.</p>
    <div className="survival-boundary-inset" data-boundary="greenwood-all-fail"><RiskMembers rows={[{id:'1'},{id:'2'}]} eventIds={['1','2']} caption="Separate all-fail miniature: both remaining subjects fail"/><Operation><Value label="Counts">n = d = 2</Value><Arrow label="n(n − d)"/><Value label="Denominator">2 × 0 = 0</Value><Arrow label="stop interior formula"/><Value label="Variance contribution">Unavailable</Value></Operation><p>The estimated surviving fraction becomes zero. The interior interval cannot divide by this denominator; infinite error bars would not be a measured population interval.</p></div>
  </Drawing>;
}

function IntervalRuler({ low, high, center, min, max, label, lowLabel, highLabel }) {
  const position = value => `${100*(value-min)/(max-min)}%`;
  return <div className="survival-interval"><p>{label}</p><div className="survival-interval-track"><span className="survival-interval-range" style={{left:position(low),width:`${100*(high-low)/(max-min)}%`}}/><i style={{left:position(center)}} /></div><div className="survival-mass-key"><span>{lowLabel}: {n(low)}</span><span>Center: {n(center)}</span><span>{highLabel}: {n(high)}</span></div></div>;
}

export function SurvivalIntervalFigure() {
  const [time,setTime]=useState(4), interval=logLogInterval(time);
  return <Drawing id="D12" label="Build a pointwise interval on a transformed scale and return to probabilities">
    <CurvePlot lines={[{points:staircase(),label:'Estimated survival'}]} cursor={time} points={[[time,interval.survival]]} />
    {interval.available ? <><Operation><Value label="Survival S">{n(interval.survival)}</Value><Arrow label="log(−log S)"/><Value label="Transformed estimate">{n(interval.transformed)}</Value><Arrow label="± 1.959964 × SE"/><Value label="Transformed SE">{n(interval.standardError)}</Value></Operation>
      <IntervalRuler low={interval.transformed-1.959963984540054*interval.standardError} high={interval.transformed+1.959963984540054*interval.standardError} center={interval.transformed} min={interval.transformed-2.5*interval.standardError} max={interval.transformed+2.5*interval.standardError} label="Symmetric interval on the log-negative-log scale" lowLabel="Lower transformed value" highLabel="Upper transformed value" />
      <Operation><Value label="Larger transformed endpoint">{n(interval.transformed+1.959963984540054*interval.standardError)}</Value><Arrow label="exp(−exp z), decreasing"/><Value label="Lower probability bound">{n(interval.low)}</Value></Operation>
      <IntervalRuler low={interval.low} high={interval.high} center={interval.survival} min={0} max={1} label="Returned probability interval, on the full 0-to-1 scale" lowLabel="Lower S" highLabel="Upper S" /></> : <p role="status">The estimate is {n(interval.survival)}. This interior transformed interval is unavailable at a boundary; no infinite coordinate is drawn.</p>}
    <QuantityControl label="Interval day" value={time} onChange={setTime} min={0} max={9} reset={()=>setTime(4)} unit="days" />
    <FlowReadout>At day {n(time)}, Greenwood's sum is {n(interval.greenwood)}. {interval.available ? `The pointwise 95% interval is ${n(interval.low)} to ${n(interval.high)}.` : 'The survival estimate remains visible even though this interval is unavailable.'} The starting day-4 estimate is 35/48.</FlowReadout>
    <div className="survival-boundary-inset" data-boundary="survival-zero"><RiskMembers rows={[{id:'1'},{id:'2'}]} eventIds={['1','2']} caption="Separate S = 0 example: both remaining subjects fail at day 1"/><CurvePlot lines={[{points:[[0,1],[1,1],[1,0]],label:'Separate all-fail cohort'}]} xMax={1} xTicks={[0,.5,1]} points={[[1,0,colors.event]]}/><Operation><Value label="Before the endpoint">S = 1</Value><Arrow label="× (1 − 2/2)"/><Value label="Finite probability after it">S = 0</Value><Arrow label="interior transformation stops"/><Value label="log(−log S) interval">Unavailable</Value></Operation><p>This probability endpoint is valid, but the interior transform is not. It is a different cohort: the A–H control above never reaches S = 0. At time 0 that control supplies the other boundary, S = 1.</p></div>
  </Drawing>;
}

export function RestrictedAreaFigure() {
  const [tau,setTau]=useState(9), {area,rectangles}=restrictedArea(tau);
  return <Drawing id="D13" label="Area under the observed survival steps is restricted expected running time">
    <CurvePlot lines={[{points:staircase(),label:'Survival height'},{points:[[0,.5],[8,.5]],label:'Fixed half-height 0.5',color:colors.computed,dashed:true},{points:[[8,0],[8,.5]],label:'Fixed median: day 8',color:colors.computed,dashed:true}]} xTicks={[0,3,6,8,9]} cursor={tau} rectangles={rectangles} censorMarks={PUMPS.filter(row=>!row.event&&row.time!==4).map(row=>({...row,survival:survivalAt(row.time)}))}/>
    <p className="survival-censor-guide">Short ticks B · 3, F · 7 and H · 9 mark logging endpoints on a level survival step. They cause no drop. The fixed purple guides locate the first crossing of 0.5 at day 8; only the amber horizon and shaded area follow the control.</p>
    <div className="survival-area-products">{rectangles.map((r,index)=><div key={index}><span>Days {n(r.start)}–{n(r.end)}</span><span>{n(r.end-r.start)} days × {n(r.height)}</span><strong>{n(r.area)} days</strong></div>)}</div>
    <QuantityControl label="Area horizon" value={tau} onChange={setTau} min={0} max={9} reset={()=>setTau(9)} unit="days" />
    <FlowReadout>Adding these rectangles gives <strong>{n(area)} days through day {n(tau)}</strong>. At the starting horizon 9, the area is 2525/384 days. The estimated median is day 8; it is a crossing time, not this area.</FlowReadout>
  </Drawing>;
}

export function SearchTimeoutFigure() {
  const methods=[{label:'Method A',times:[1,2,5,5],color:colors.observed},{label:'Method B',times:[3,4,5,5],color:colors.computed}];
  return <Drawing id="D14" label="Use the same area when the event is successful completion">
    <div className="survival-columns">{methods.map(method=>{const rows=method.times.map((time,i)=>({id:`${method.label.at(-1)}${i+1}`,time,event:i<2,note:i<2?`Solved at ${time} seconds`:'Timed out at 5 seconds'}));const km=kaplanMeier(rows);return <div key={method.label}><p><strong>{method.label}</strong></p><Lifelines rows={rows} max={5} ticks={[0,2.5,5]} unit="seconds since search starts" eventLabel="Successful solve" endpointLabel="Unfinished timeout"/><CurvePlot lines={[{points:staircase(km,5),color:method.color}]} xMax={5} yLabel="probability still unsolved" xLabel="seconds" rectangles={restrictedArea(5,km).rectangles}/><p><strong>{n(restrictedArea(5,km).area)} seconds</strong> restricted compute time; 2 of 4 solved.</p></div>;})}</div>
    <p>Here the filled mark means a successful solve. Both methods solve half the jobs; the area distinguishes how long the jobs consume computation.</p>
  </Drawing>;
}
