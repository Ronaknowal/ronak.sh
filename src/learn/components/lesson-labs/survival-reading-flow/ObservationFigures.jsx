import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, Pump, Lifelines, QuantityControl, MassStrip, Operation, Arrow, Value, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { PUMPS, observationsAt, retention } from './univariate-models.js';

export function EventClockFigure() {
  return <Drawing id="D01" label="A failed seal and a stopped logger have different meanings">
    <div className="survival-columns"><Pump id="C" failed label="Seal fails at day 4" /><Pump id="D" logger={false} label="Seal working when recording ends at day 4" /></div>
    <Lifelines rows={PUMPS.filter(row => ['C','D'].includes(row.id))} max={6} ticks={[0,2,4,6]} />
    <Operation><Value label="Commissioning">Clock = 0 days</Value><Arrow label="follow the same pump"/><Value label="At the matching endpoint">C: T = 4 · D: T &gt; 4</Value></Operation>
  </Drawing>;
}

export function ObservationCutoffFigure() {
  const [cutoff, setCutoff] = useState(9), rows = observationsAt(cutoff), failures = rows.filter(row => row.event).length;
  return <Drawing id="D02" label="Shorten observed follow-up without creating failures">
    <Lifelines rows={rows} cursor={cutoff} />
    <QuantityControl label="Follow-up limit" value={cutoff} onChange={setCutoff} min={0} max={9} unit="days" reset={() => setCutoff(9)} />
    <FlowReadout><strong>{failures} recorded failures and {rows.length - failures} censored records.</strong> Both the endpoint and event flag change when an observation is shortened. At the starting limit of 9 days there are 4 failures and 4 censored records.</FlowReadout>
  </Drawing>;
}

export function InformationTimeFigure() {
  return <Drawing id="D03" label="Available measurements travel forward; later responses do not travel backward">
    <Pump id="C" label="Measurements at commissioning" />
    <div className="survival-feature-sockets"><span>Temperature<br/><strong>18 °C</strong></span><span>Pressure<br/><strong>3 bar</strong></span><span>Installed material<br/><strong>Type A</strong></span></div>
    <Operation><Value label="Day 0 measurements">Features x</Value><Arrow label="available now"/><Value label="Day 0 question">Future survival curve</Value></Operation>
    <Lifelines rows={[{id:'C',time:4,event:true,note:'Later failure supplies the response (4, 1)'}]} max={6} ticks={[0,2,4,6]} />
    <div className="survival-forbidden"><span aria-hidden="true">↶ ✕</span> The final inspection note is not a day-0 input.</div>
    <p>The same later endpoint can teach a model during training; it cannot be an input to its earlier prediction.</p>
  </Drawing>;
}

export function UnknownTailFigure() {
  const completions = [
    { name:'Hypothetical completion 1', times:[2,4,4,5,6,8,8,10], mean:5.875 },
    { name:'Hypothetical completion 2', times:[2,100,4,100,6,100,8,1000], mean:165 },
  ];
  return <Drawing id="D04" label="Two possible unobserved futures agree with the same recorded observations">
    <Lifelines rows={PUMPS} />
    <div className="survival-columns">{completions.map(completion => <div key={completion.name}>
      <p><strong>{completion.name}</strong></p>
      <div className="survival-completion-grid">{PUMPS.map((row,index) => <div key={row.id}><strong>{row.id}</strong><span className={row.event ? 'survival-fixed-value' : 'survival-hypothetical-value'}>{completion.times[index]} days {row.event ? '● observed' : '◇ imagined'}</span></div>)}</div>
      <p>Completed mean: <strong>{completion.mean} days</strong></p>
    </div>)}</div>
    <div className="survival-tail-rulers"><div><span>Observed through day 9</span><span className="survival-broken-axis">─────── // ───────</span><span>Remaining mass placed at 10</span></div><div><span>The same known prefix</span><span className="survival-broken-axis">─────── // ───────</span><span>Remaining mass placed at 1000</span></div></div>
    <p>The double slash breaks the time axis; the imagined endpoints are not drawn to a common distance scale. The observed rows alone cannot decide the missing tail or an unrestricted mean.</p>
  </Drawing>;
}

export function RecordingSelectionFigure() {
  const [chance, setChance] = useState(.5), model = retention(chance);
  return <Drawing id="D05" label="Recording can change the mix of lifetimes">
    <MassStrip label="Original population: equal short- and long-lifetime types" segments={[{label:'Short',value:.5,color:colors.event},{label:'Long',value:.5,color:colors.computed}]} />
    <div className="survival-selection-forks"><div><span>Short type: ½</span><span aria-hidden="true">↓</span><span>Retain with probability ½</span><strong>Recorded mass ¼</strong></div><div><span>Long type: ½</span><span aria-hidden="true">↓</span><span>Retain with probability {n(chance)}</span><strong>Recorded mass {n(model.longMass)}</strong></div></div>
    <MassStrip label="Among retained records: renormalize by the retained total" segments={[{label:'Short',value:1-model.selectedLongShare,color:colors.event},{label:'Long',value:model.selectedLongShare,color:colors.computed}]} />
    <QuantityControl label="Long-type recording chance" value={chance} onChange={setChance} min={0} max={1} step={.05} reset={() => setChance(.5)} />
    <FlowReadout>Long lifetimes occupy <strong>{n(model.selectedLongShare)}</strong> of retained records, compared with 0.5 in the original population. The original lifetimes have not changed; only their observation chances have.</FlowReadout>
  </Drawing>;
}

export function EntryVersusCensorFigure() {
  return <Drawing id="D06" label="An observed censored row differs from a lifetime excluded by entry">
    <Lifelines rows={[{id:'Recorded B',time:3,event:false,note:'A real row: still working at day 3'}]} max={6} ticks={[0,2,3,6]} />
    <div className="survival-entry-gate"><Lifelines rows={[{id:'Unrecruited pump',time:2,event:true,note:'Fails at day 2, before recruitment opens'}]} max={6} ticks={[0,2,3,6]} cursor={3} /><p><strong>Day-3 entry gate: already failed → no recruited row.</strong></p></div>
    <p>The first case records the inequality T &gt; 3. The second changes who can enter the observed population.</p>
  </Drawing>;
}
