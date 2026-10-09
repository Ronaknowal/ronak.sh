import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, Lifelines, QuantityControl, RiskMembers, CurvePlot, MassStrip, Operation, Arrow, Value, NumberBars, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { METRIC_ROWS,concordanceFixture,horizonRows,weightedLosses,knownObservationBranches,integratedLoss } from './metric-models.js';

export function ConcordancePairsFigure() {
  const [score,setScore]=useState(2),model=concordanceFixture(score);
  return <Drawing id="D34a" label="Concordance counts only observable endpoint comparisons">
    <Lifelines rows={model.rows.map(row=>({...row,note:`${row.event?'Failure':'Censor'} at ${row.time}; risk score ${n(row.score)}`}))} max={4} ticks={[0,1,2,4]}/>
    <div className="survival-metric-pairs">{model.pairs.map(pair=><div key={pair.a.id+pair.b.id}><strong>{pair.a.id} ↔ {pair.b.id}</strong><span>{pair.credit===null?'Not comparable: the earlier endpoint is censored':`${pair.event.id} is the observed earlier event${pair.event.time===pair.other.time?' (equal-time censor convention)':''}`}</span><strong>{pair.credit===null?'Excluded':`Credit ${pair.credit}`}</strong></div>)}</div>
    <QuantityControl label="M2 risk score" value={score} onChange={setScore} min={0} max={4} step={.1} reset={()=>setScore(2)}/>
    <FlowReadout><strong>{n(model.credit)} credits / {model.count} comparable pairs = {n(model.concordance)}</strong>. At the starting score 2, the M2/M3 score tie contributes half, giving 0.9. Increasing risk score means predicting an earlier event.</FlowReadout>
  </Drawing>;
}

export function FenwickConcordanceFigure() {
  return <Drawing id="D34b" label="A descending endpoint scan asks prefix counts rather than every pair">
    <div className="survival-suffix-scan"><div><strong>Day 4</strong><span>M4 queries the empty pool, then enters at score 0.</span></div><div><strong>Day 2</strong><span>Insert censored M2 at score 2 before querying failing M3 at score 2. Then insert M3.</span></div><div><strong>Day 1</strong><span>M1 at score 3 finds three lower-score competitors.</span></div></div>
    <div className="survival-dp-cells">{[{score:0,count:1},{score:2,count:1},{score:3,count:0}].map(row=><div key={row.score}><span>Score coordinate {row.score}</span><strong>{row.count}</strong><span>before M3's query</span></div>)}</div>
    <div className="survival-fenwick-scroll" role="region" tabIndex={0} aria-label="Fenwick node ranges" aria-describedby="survival-fenwick-scroll-help">
    <div className="survival-fenwick-tree"><div style={{gridColumn:'1'}}>Node 1: coordinate 1<br/><strong>1</strong></div><div style={{gridColumn:'1 / 3'}}>Node 2: coordinates 1–2<br/><strong>2</strong></div><div style={{gridColumn:'3'}}>Node 3: coordinate 3<br/><strong>0</strong></div></div>
    </div>
    <p id="survival-fenwick-scroll-help" className="survival-fenwick-scroll-note">The three score coordinates stay side by side, so node 2 spans coordinates 1–2. Scroll horizontally to inspect every node; with the diagram focused, use the left and right arrow keys.</p>
    <Operation><Value label="M3 lower count">1</Value><Arrow label="plus half × equal count"/><Value label="M3 credit">1 + ½ × 1 = 1.5</Value><Arrow label="plus M1's three credits"/><Value label="Total">4.5 / 5</Value></Operation>
    <p>A node covers the interval ending at its index with length given by its lowest set bit. For index 6 (binary 110), that interval is 5–6; the next prefix node is index 4 (100), covering 1–4. These are index ranges, not extra subjects.</p>
  </Drawing>;
}

export function HorizonClassificationFigure() {
  const [horizon,setHorizon]=useState(3),rows=horizonRows(horizon);
  return <Drawing id="D35" label="The observation determines whether a horizon outcome is known">
    <Lifelines rows={rows} max={4} ticks={[0,1,2,4]} cursor={horizon}/>
    <div className="survival-metric-pairs">{rows.map(row=><div key={row.id}><strong>{row.id}: {row.role}</strong><span>{row.target===null?'No observable binary target':`I(T > u) = ${row.target}`}</span></div>)}</div>
    <QuantityControl label="Evaluation horizon" value={horizon} onChange={setHorizon} min={0} max={4} reset={()=>setHorizon(3)} unit="days"/>
    <FlowReadout>{rows.filter(row=>row.role==='case').length} observed cases and {rows.filter(row=>row.role==='control').length} controls. {rows.filter(row=>row.target===null).length} records do not supply this binary outcome. Exactly censored at the horizon is excluded under this declared convention.</FlowReadout>
  </Drawing>;
}

export function CensorWeightedLossFigure() {
  const [forecast,setForecast]=useState(.6),model=weightedLosses(forecast),branches=knownObservationBranches(forecast);
  return <Drawing id="D36" label="Inverse observation weights reconstruct a known population loss">
    <div className="survival-law-tree">
      <div className="survival-law-root"><strong>Known population law</strong><span>Lifetime T and follow-up limit C are independent.</span><span>Day-5 survival forecast p = {n(forecast)}</span></div>
      <ul className="survival-law-lifetimes">{[2,8].map(life=><li key={life} style={{'--law-color':life===2?colors.event:colors.survivor}}>
        <div className="survival-law-lifetime"><strong>T = {life} days</strong><span>Lifetime branch probability {life===2?'0.4':'0.6'}</span></div>
        <ul className="survival-law-observations">{branches.filter(row=>row.life===life).map(row=><li key={row.follow} className="survival-law-leaf" data-law-leaf={`${row.life}-${row.follow}`}>
          <div className="survival-law-observation"><strong>C = {row.follow} days</strong><span>Independent branch probability 0.5</span><span>Joint mass {n(row.lifeMass)} × 0.5 = {n(row.mass)}</span></div>
          <div className="survival-law-record"><Value label="Hidden lifetime socket">T = {row.life}</Value><span className="survival-law-record-arrow"><span aria-hidden="true">↓</span><span>Record min(T, C) and the event flag</span></span><Value label="Recorded outcome socket">Y = {row.observedTime}, δ = {row.event?1:0}</Value></div>
          <div className="survival-law-target"><span aria-hidden="true">↓</span><strong>{row.target===null?'Day-5 target is unknown from this record':`Known day-5 target I(T > 5) = ${row.target}`}</strong><span>{row.target===null?'Logging stopped at day 3; this record does not reveal survival to day 5.':row.target===0?'Failure at day 2 establishes target 0.':'The event is at day 8: this subject is still alive at day 5.'}</span></div>
          <dl className="survival-law-operands"><div><dt>Current squared loss</dt><dd data-leaf-loss="">{row.loss===null?'Unavailable':`(${row.target} − ${n(forecast)})² = ${n(row.loss)}`}</dd></div><div><dt>Chance this target is observed</dt><dd>{row.chance===null?'No eligible observed target':n(row.chance)}</dd></div></dl>
          <div className="survival-law-contribution"><span aria-hidden="true">↓</span><span>Known-law weighted contribution</span><strong data-leaf-contribution="">{row.contribution===null?'Unavailable; excluded from the observed-target sum':`${n(row.mass)} × ${n(row.loss)} / ${n(row.chance)} = ${n(row.contribution)}`}</strong></div>
        </li>)}</ul>
      </li>)}</ul>
    </div>
    <p>The connected branches are a supplied probability law, not four sampled records. In the observed-target sum, the unknown leaf supplies no target or weighted term; its loss is not replaced by zero.</p>
    <div className="survival-area-products"><div><span>Full-law expectation</span><strong>0.4 × {n(forecast)}² + 0.6 × (1 − {n(forecast)})² = {n(model.full)}</strong></div><div><span>Sum of eligible weighted branches</span><strong>{branches.filter(row=>row.contribution!==null).map(row=>n(row.contribution)).join(' + ')} = {n(model.ipcw)}</strong></div></div>
    <NumberBars rows={[{label:'Known-law full-population error',value:model.full},{label:'Known-G IPCW expectation',value:model.ipcw,color:colors.computed},{label:'Complete-case conditional error',value:model.completeCase,color:'#df9e77'},{label:'Censor-as-failure error',value:model.censorAsFailure,color:colors.danger}]} max={1}/>
    <QuantityControl label="Day-5 survival forecast" value={forecast} onChange={setForecast} min={0} max={1} step={.01} reset={()=>setForecast(.6)}/>
    <FlowReadout>Forecast {n(forecast)} changes the leaf losses. Observation chances stay 1 for short failures and 0.5 for day-5 survivors. Full-law and known-G weighted error are both <strong>{n(model.full)}</strong>. The observed survivor mass 0.3 receives inverse weight 2, restoring its population mass 0.6.</FlowReadout>
  </Drawing>;
}

export function ReverseKmFigure() {
  const rows=[{id:'F1',time:1,event:true},{id:'C1',time:1,event:false},{id:'F3',time:3,event:true},{id:'C4',time:4,event:false}];
  return <Drawing id="D37" label="At a tied failure and censor clock, reverse KM removes the failure first">
    <Lifelines rows={rows} max={4} ticks={[0,1,3,4]}/>
    <div className="survival-columns"><RiskMembers rows={rows} eventIds={['F1']} caption="Incoming day-1 roster: four; F1 is the genuine failure"/><RiskMembers rows={rows.slice(1).map(row=>({...row,color:row.id==='C1'?colors.computed:colors.observed}))} caption="Remove F1 first: C1 is the one logging endpoint among three"/></div>
    <Operation><Value label="Just before day 1">4 subjects</Value><Arrow label="remove the observed failure first"/><Value label="Censor-risk denominator">3</Value><Arrow label="one censor loss"/><Value label="Observation survivor">1 − 1/3 = 2/3</Value></Operation>
    <NumberBars rows={[{label:'Declared reverse-KM step',value:2/3},{label:'Naive flag flip with all four in risk set',value:3/4,color:colors.danger}]} max={1}/>
    <Operation><Value label="One day-1 logging endpoint among three">G factor = 1 − 1/3</Value><Arrow label="multiply previous G = 1"/><Value label="Post-step G(1)">2/3</Value><Arrow label="locate the filled endpoint below"/></Operation>
    <CurvePlot lines={[{points:[[0,1],[1,1],[1,2/3],[3,2/3],[4,2/3],[4,0]],color:colors.computed,label:'Observation survival G: event-first, right-continuous'}]} xMax={4} xTicks={[0,1,3,4]} yTicks={[0,2/3,1]} yLabel="observation survival G(t)" points={[[1,1,colors.computed,'open'],[1,2/3,colors.computed],[3,2/3,colors.computed],[4,2/3,colors.computed,'open'],[4,0,colors.computed]]}/>
    <div className="survival-area-products"><div><span>Before day 1</span><strong>G = 1</strong></div><div><span>At day 1 through just before 4</span><strong>G = 2/3</strong></div><div><span>Exactly day 4</span><strong>G = 0 · inverse unavailable</strong></div></div>
    <p>Filled points give the declared right-continuous endpoint values; open points show the height just before a drop. F3's genuine failure at day 3 changes the eligible roster but makes no censor-survival drop. At day 4, C4 is the last observation endpoint: one of one makes G zero. The curve stops there; it supplies no additional recording evidence beyond day 4.</p>
  </Drawing>;
}

export function ObservationSupportFigure() {
  const [chance,setChance]=useState(.5),model=weightedLosses(.6,chance);
  return <Drawing id="D38a" label="Rarely observed outcomes have large inverse contributions and unstable loss estimates">
    <MassStrip label="Population probability mass" segments={[{label:'Early event',value:.4,color:colors.event},{label:'Long survivor observed',value:model.survivingRecordedMass},{label:'Long survivor unobserved',value:.6-model.survivingRecordedMass,color:'#777'}]}/>
    <Operation><Value label="Recorded survivor mass">0.6 × {n(chance)} = {n(model.survivingRecordedMass)}</Value><Arrow label="× inverse-weighted loss"/><Value label="Contribution per observed survivor">{chance>0?`0.16 / ${n(chance)} = ${n(model.survivingContribution)}`:'Unavailable: G = 0'}</Value><Arrow/><Value label="Expected survivor contribution">{chance>0?'0.096':'Not identified from these observations'}</Value></Operation>
    <QuantityControl label="Long-follow-up chance" value={chance} onChange={setChance} min={0} max={1} step={.05} reset={()=>setChance(.5)}/>
    <FlowReadout>{chance>0?`Expected total IPCW loss stays ${n(model.ipcw)}, but the single-record variance is ${n(model.variance)}.`:'No long survivors can be observed. The inverse-weight calculation is unavailable; knowing the stipulated population law does not restore observed support.'} Starting recording chance: 0.5.</FlowReadout>
  </Drawing>;
}

export function ConditionalObservationFigure() {
  return <Drawing id="D38b" label="A pooled observation law can misweight groups with different follow-up chances">
    <div className="survival-columns">{[{name:'A',survival:.8,record:.2},{name:'B',survival:.2,record:.8}].map(group=><div key={group.name}><MassStrip label={`Group ${group.name}: half the population`} segments={[{label:'Day-5 survivors',value:group.survival},{label:'Earlier failures',value:1-group.survival,color:colors.event}]}/><Operation><Value label="Survivor observation chance">{group.record}</Value><Arrow label="recorded survivor mass"/><Value label="Within this group">{n(group.survival*group.record)}</Value></Operation><p>At forecast 0.6, the true expected loss is {n((1-group.survival)*.36+group.survival*.16)}.</p></div>)}</div>
    <NumberBars rows={[{label:'Full and group-conditional IPCW loss',value:.26},{label:'Pooled G = 0.5 loss',value:.2312,color:colors.danger}]} max={.4}/>
    <p>Both groups leave the same recorded survivor mass 0.16, yet represent different original survivor masses. Weight by the relevant conditional observation chance, not by a pooled value chosen because it is easier.</p>
  </Drawing>;
}

export function UnoPairWeightFigure() {
  return <Drawing id="D39a" label="A comparable pair requires observation of both members at the earlier event">
    <div className="survival-probability-tree"><div><strong>M1, earlier event at 1</strong><span>3 comparable pairs; all receive credit 1</span><span>G(1) = 1</span><strong>Pair weight 1</strong></div><div><strong>M3, earlier event at 2</strong><span>2 pairs; credits 1/2 and 1</span><span>G(2) = 3/4</span><strong>Pair weight 1/(3/4)² = 16/9</strong></div></div>
    <Operation><Value label="Weighted credit">3 + (1/2 + 1)×16/9 = 51/9</Value><Arrow label="divide by weighted pair count"/><Value label="Weighted denominator">3 + 2×16/9 = 59/9</Value><Arrow/><Value label="Uno-type estimate">51/59 = {n(51/59)}</Value></Operation>
    <p>The earlier event must be strictly before the declared truncation τ = 4. The squared observation term belongs to this pair target; it is not the single-outcome Brier weight.</p>
  </Drawing>;
}

export function HorizonRocFigure() {
  return <Drawing id="D39b" label="A horizon ROC compares cases by that horizon against subjects known to survive beyond it">
    <Lifelines rows={METRIC_ROWS.map(row=>({...row,note:`Risk ${row.id==='M4'?2.5:row.score}; ${row.id==='M2'?'unknown':'observable'} at day 2.5`}))} max={4} ticks={[0,1,2.5,4]} cursor={2.5}/>
    <div className="survival-score-rows"><div><Value label="Case M1">score 3; weight 1</Value><Value label="Case M3">score 2; weight 4/3</Value><Value label="Control M4">score 2.5</Value></div></div>
    <CurvePlot lines={[{points:[[0,0],[0,3/7],[1,3/7],[1,1]],label:'Weighted cumulative/dynamic ROC'}]} xMax={1} xLabel="false-positive fraction" yLabel="weighted true-positive fraction" rectangles={[{start:0,end:1,height:3/7}]}/>
    <p>The area is 3/7. At the earlier horizon 1.5, only M1 is a case and its higher score gives area 1. A changing horizon changes the question and eligible case/control membership.</p>
  </Drawing>;
}

export function NearTieBlocksFigure() {
  return <Drawing id="D39c" label="Adjacent score grouping can connect endpoints that are not pairwise tied">
    <div className="survival-near-ties"><span>Score 0</span><span className="survival-near-edge">← difference .75 →</span><span>Score .75<br/>unscored middle record</span><span className="survival-near-edge">← difference .75 →</span><span>Score 1.5</span></div>
    <p>At tolerance 1, adjacent grouping joins all three into one threshold block. The endpoint difference 1.5 is nevertheless greater than 1.</p>
    <Operation><Value label="Case at score 0 vs control at 1.5">Exact ordering: area 0</Value><Arrow label="adjacent block convention"/><Value label="Both grouped together">Area 1/2</Value></Operation>
    <p>The middle row can connect the block without contributing case/control mass. Tie tolerance and grouping rules must match before comparing libraries.</p>
  </Drawing>;
}

export function IntegratedBrierFigure() {
  const [index,setIndex]=useState(2),model=integratedLoss(index),times=[2,4,8],end=times[index];
  return <Drawing id="D40a" label="Integrate supported error values over their actual time widths">
    <CurvePlot lines={[{points:[[2,.2],[4,.4],[8,.1]],label:'Named grid values, connected for trapezoidal integration'}]} xMin={2} xMax={8} xTicks={[2,4,8]} yMax={.5} yLabel="Brier score" cursor={end} points={[[2,.2],[4,.4],[8,.1]]} areas={model.pieces.map(row=>({points:[[row.start,0],[row.start,row.left],[row.end,row.right],[row.end,0]]}))}/>
    <div className="survival-area-products">{model.pieces.map(row=><div key={row.start}><span>Days {row.start}–{row.end}</span><span>width {row.end-row.start} × mean height {n((row.left+row.right)/2)}</span><strong>area {n(row.area)}</strong></div>)}</div>
    <QuantityControl label="Upper grid index" value={index} onChange={setIndex} min={0} max={2} step={1} integer reset={()=>setIndex(2)}/>
    <FlowReadout>{model.value===null?'A single time point has zero interval width; the integrated average is unavailable.':`Area ${n(model.area)} / interval width ${end-2} = ${n(model.value)}.`} The starting interval is days 2 through 8, not 0 through 8. Equal averaging of the three values would ignore their spacing.</FlowReadout>
  </Drawing>;
}

export function ProbabilityErrorFigure() {
  return <Drawing id="D40b" label="Ranking and calibrated probabilities answer different questions">
    <MassStrip label="Known day-5 population" segments={[{label:'Event free',value:.6},{label:'Failed',value:.4,color:colors.event}]}/>
    <NumberBars rows={[{label:'Forecast 0.6: irreducible loss',value:.24},{label:'Forecast 0.9: same noise plus 0.09 mismatch',value:.33,color:colors.computed}]} max={.4}/>
    <Operation><Value label="Population uncertainty">0.6×0.4 = 0.24</Value><Arrow label="plus (forecast − 0.6)²"/><Value label="At forecast 0.9">0.24 + 0.09 = 0.33</Value></Operation>
    <p>A ranking score can preserve order while giving badly scaled probabilities. A probability-loss report inspects a different property from concordance.</p>
  </Drawing>;
}
