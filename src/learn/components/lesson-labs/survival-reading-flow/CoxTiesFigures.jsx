import { useState } from 'react';
import { FlowControls, FlowReadout } from '../LessonFlow.jsx';
import { Drawing, QuantityControl, RiskMembers, CurvePlot, MassStrip, Operation, Arrow, Value, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { TIED_MEMBERS, subsetPairs, subsetCoefficientTrace, baselineAt, baselineSteps } from './cox-models.js';

function PairGrid() {
  const {pairs}=subsetPairs();
  return <div className="survival-pair-allocations">{pairs.map(pair=><div key={pair.ids}><span>{pair.ids[0]}</span><span aria-hidden="true">↔</span><span>{pair.ids[1]}</span><small>weight {n(pair.weight)}</small></div>)}</div>;
}
export function TiedDenominatorsFigure() {
  return <Drawing id="D28" label="The same tied risk set supplies three distinct denominator constructions">
    <RiskMembers rows={TIED_MEMBERS} eventIds={['B','C']} caption="At day 2: B and C fail; D, E and F still compete"/>
    <div className="survival-feature-sockets">{TIED_MEMBERS.map(row=><span key={row.id}>{row.id}<br/>x = {row.x}<br/>weight {row.weight}</span>)}</div>
    <Operation><Value label="Observed pair numerator">1 × 2 = 2</Value><Arrow/><Value label="Breslow denominator">6.5 × 6.5</Value><Arrow/><Value label="Contribution">8/169 = {n(8/169)}</Value></Operation>
    <Operation><Value label="Observed pair numerator">2</Value><Arrow/><Value label="Efron denominator">6.5 × (6.5 − 3/2)</Value><Arrow/><Value label="Contribution">4/65 = {n(4/65)}</Value></Operation>
    <PairGrid/>
    <Operation><Value label="Subset denominator">Sum of ten pair weights = 16</Value><Arrow/><Value label="Conditional subset contribution">2/16 = 1/8</Value></Operation>
    <p>The subset model counts unordered sets of two distinct subjects. It is a different conditional model, not a universally exact repair for rounded continuous times.</p>
  </Drawing>;
}

export function SubsetRecurrenceFigure() {
  const [index,setIndex]=useState(0),trace=subsetCoefficientTrace(),row=trace[index];
  return <Drawing id="D29a" label="Update polynomial coefficients from high degree to low degree">
    <div className="survival-dp-cells">{row.before.map((value,degree)=><div key={degree}><span>Previously: choose {degree}</span><strong>{n(value)}</strong></div>)}</div>
    {index>0&&<div className="survival-dp-arrows"><span>old choose 1 × {n(row.weight)} ↘ choose 2</span><span>old choose 0 × {n(row.weight)} ↘ choose 1</span></div>}
    <div className="survival-dp-cells">{row.after.map((value,degree)=><div key={degree}><span>Now: choose {degree}</span><strong>{n(value)}</strong></div>)}</div>
    <FlowControls><button type="button" disabled={index===0} onClick={()=>setIndex(index-1)}>Previous subject</button><button type="button" disabled={index===5} onClick={()=>setIndex(index+1)}>Next subject</button><button type="button" onClick={()=>setIndex(0)}>Reset</button></FlowControls>
    <FlowReadout>{index===0?'Before processing any subject, the empty subset has weight 1.':`Include subject ${row.id} with weight ${n(row.weight)}: new choose-2 = ${n(row.before[2])} + ${n(row.weight)} × ${n(row.before[1])} = ${n(row.after[2])}.`} Updating degree 2 before degree 1 prevents using the same subject twice. After all five subjects, choose-2 = 16.</FlowReadout>
  </Drawing>;
}

export function SubsetFeatureFigure() {
  const model=subsetPairs();
  return <Drawing id="D29b" label="The conditional subset distribution has feature-sum moments">
    <div className="survival-subset-moments">{model.pairs.map(pair=><div key={pair.ids}><strong>{pair.ids}</strong><span>feature sum {pair.sum}</span><span className="survival-subset-weight" style={{width:`${pair.weight/4*100}%`}}/><span>weight {n(pair.weight)}/16</span></div>)}</div>
    <Operation><Value label="Observed BC feature sum">1</Value><Arrow label="minus expected feature sum"/><Value label="Expected sum">15/16 = {n(model.mean)}</Value><Arrow/><Value label="Score contribution">1/16</Value></Operation>
    <p>The weighted spread of these possible feature sums is <strong>175/256 = {n(model.variance)}</strong>. It measures the information in this tied-set question.</p>
  </Drawing>;
}

export function SubsetMomentMergeFigure() {
  return <Drawing id="D29c" label="A coefficient cell carries a positive mass, feature-sum mean and covariance">
    <p>When D (weight 1/2, feature −1) enters after B and C, the choose-two cell receives two disjoint possibilities.</p>
    <div className="survival-columns"><div><PairGridSubset names={['BC']}/><Value label="Exclude D">mass 2; mean 1; variance 0</Value></div><div><PairGridSubset names={['BD','CD']}/><Value label="Include D">mass 3/2; mean −1/3; variance 2/9</Value></div></div>
    <Operation><Value label="Positive mixture fractions">4/7 and 3/7</Value><Arrow label="merge means and centered spreads"/><Value label="New choose-two cell">mass 7/2; mean 3/7; variance 26/49</Value></Operation>
    <p>A larger case stores the mass on a local log scale. Exclude/include are joined as positive pools; the covariance is not obtained by subtracting two large raw moments.</p>
  </Drawing>;
}
function PairGridSubset({names}) {return <div className="survival-pair-allocations">{subsetPairs().pairs.filter(row=>names.includes(row.ids)).map(row=><div key={row.ids}><span>{row.ids[0]} ↔ {row.ids[1]}</span><small>weight {n(row.weight)}; sum {row.sum}</small></div>)}</div>;}

export function AbsoluteSurvivalFigure() {
  const [profile,setProfile]=useState(0),multiplier=2**profile,h=baselineAt(5);
  return <Drawing id="D30a" label="Baseline increments turn a relative multiplier into an absolute survival curve">
    <div className="survival-baseline-jumps">{[{day:1,d:1,risk:7,jump:1/7},{day:2,d:2,risk:6.5,jump:4/13},{day:4,d:1,risk:3,jump:1/3}].map(row=><div key={row.day}><strong>Day {row.day}</strong><span>{row.d} failures / weighted pool {row.risk}</span><strong>ΔH₀ = {n(row.jump)}</strong></div>)}</div>
    <div className="survival-columns"><CurvePlot lines={[{points:baselineSteps(),label:'Cumulative reference rate H₀',color:colors.computed}]} xMax={5} yLabel="cumulative reference rate"/><CurvePlot lines={[{points:baselineSteps(5,multiplier,true),label:`Survival for feature ${n(profile)}`}]} xMax={5}/></div>
    <Operation><Value label="Profile multiplier">exp(log 2 × {n(profile)}) = {n(multiplier)}</Value><Arrow label={`× H₀ = ${n(h)}`}/><Value label="Profile cumulative rate">{n(multiplier*h)}</Value><Arrow label="exp(−H)"/><Value label="Day-5 survival">{n(Math.exp(-multiplier*h))}</Value></Operation>
    <QuantityControl label="Prediction feature" value={profile} onChange={setProfile} min={-1} max={1} step={.1} reset={()=>setProfile(0)}/>
    <FlowReadout>The coefficients and Breslow baseline stay fixed; only the prediction profile changes. Starting x = 0 gives cumulative baseline 214/273 and survival {n(Math.exp(-h))}. An Efron baseline convention has a different day-2 jump, 23/65, and must be named separately.</FlowReadout>
  </Drawing>;
}

export function ReferenceChangeFigure() {
  const h=baselineAt(5);
  return <Drawing id="D30b" label="Changing the reference rescales the baseline, not the physical prediction">
    <div className="survival-columns"><Operation><Value label="Reference z = 0">H₀ = {n(h)}</Value><Arrow label="x = 1: multiplier 2"/><Value label="Physical cumulative rate">{n(2*h)}</Value></Operation><Operation><Value label="Reference z = 1">H₁ = {n(2*h)}</Value><Arrow label="x = 1: multiplier 1"/><Value label="Physical cumulative rate">{n(2*h)}</Value></Operation></div>
    <CurvePlot lines={[{points:baselineSteps(5,2,true),label:'Fixed x = 1, reference 0'},{points:baselineSteps(5,2,true),label:'Same x = 1, reference 1',color:colors.computed,dashed:true}]} xMax={5}/>
    <p>The two curves coincide because the larger reference baseline is paired with the correspondingly smaller relative multiplier.</p>
  </Drawing>;
}
