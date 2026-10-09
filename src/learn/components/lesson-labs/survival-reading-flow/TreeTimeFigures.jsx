import { useState } from 'react';
import { FlowControls,FlowReadout } from '../LessonFlow.jsx';
import { Drawing,BinaryStorageTree,Lifelines,QuantityControl,CurvePlot,Operation,Arrow,Value,colors,formatNumber as n } from './SurvivalPrimitives.jsx';
import { staircase } from './univariate-models.js';
import { TREE_ROWS,SAVED_BAGS,treeSplit,forestAverage,treePrefixState } from './tree-time-models.js';
const points=(fn,max=36)=>Array.from({length:121},(_,i)=>[i*max/120,fn(i*max/120)]);

export function AcceleratedTimeFigure() {
  const [factor,setFactor]=useState(2),quantiles=[.25,.5,.75].map(p=>({p,time:12*Math.sqrt(-Math.log1p(-p))}));
  return <Drawing id="D41a" label="An accelerated lifetime model stretches corresponding lifetime quantiles">
    <div className="survival-score-rows">{quantiles.map(row=><div key={row.p}><Value label={`${100*row.p}% have failed: reference`}>{n(row.time)} days</Value><Arrow label={`stretch × ${n(factor)}`}/><Value label="Corresponding comparison quantile">{n(factor*row.time)} days</Value></div>)}</div>
    <CurvePlot lines={[{points:points(t=>Math.exp(-((t/12)**2))),label:'Scale 12 days'},{points:points(t=>Math.exp(-((t/(12*factor))**2))),label:`Scale ${n(12*factor)} days`,color:colors.computed}]} xMax={36}/>
    <QuantityControl label="Lifetime stretch" value={factor} onChange={setFactor} min={.25} max={3} step={.05} reset={()=>setFactor(2)}/>
    <FlowReadout>At day 12, reference survival is exp(−1) = {n(Math.exp(-1))}; comparison survival is exp(−1/{n(factor)}²) = <strong>{n(Math.exp(-1/(factor*factor)))}</strong>. For this fixed Weibull shape 2, the same-age hazard ratio is {n(factor**-2)}. Starting stretch: 2.</FlowReadout>
  </Drawing>;
}

export function AftObservationFigure() {
  const density=t=>t===0?0:2*t/144*Math.exp(-((t/12)**2)),grid=points(density,30);
  return <Drawing id="D41b" label="A failure and a censor record send different derivatives to the Weibull scale and shape">
    <CurvePlot lines={[{points:grid,label:'Weibull density: scale 12, shape 2'}]} xMax={30} yMax={.08} yLabel="density per day" cursor={6} points={[[6,density(6)]]} areas={[{points:[[6,0],...grid.filter(([t])=>t>=6),[30,0]]}]}/>
    <div className="survival-columns"><Operation><Value label="Exact failure at 6">log h(6) − H(6) = {n(Math.log(1/12)-.25)}</Value><Arrow/><Value label="Log-scale / log-shape scores">−1.5 / {n(1+Math.log(.25)*.75)}</Value></Operation><Operation><Value label="Censored at 6">−H(6) = −0.25</Value><Arrow/><Value label="Log-scale / log-shape scores">+0.5 / {n(-Math.log(.25)*.25)}</Value></Operation></div>
    <p>H(6) = 1/4 and h(6) = 1/12 per day. The censored tail continues beyond this finite drawing. The same recorded day supplies different information because one record locates an event and the other only bounds it.</p>
  </Drawing>;
}

function LeafCurves({model}) {
  const rightEnd=Math.max(...model.right.map(row=>row.time)),leftEnd=Math.max(...model.left.map(row=>row.time));
  return <div className="survival-columns">{[{name:'Yes / left',rows:model.left,curve:model.leftCurve,end:leftEnd,color:colors.observed},{name:'No / right',rows:model.right,curve:model.rightCurve,end:rightEnd,color:colors.computed}].map(side=><div key={side.name}><p><strong>{side.name}</strong>: {side.rows.map(row=>row.id).join(', ')}</p><Lifelines rows={side.rows} max={9} ticks={[0,3,6,9]}/><CurvePlot lines={[{points:staircase(side.curve,side.end),color:side.color,label:`Observed leaf support through day ${side.end}`},...(side.end<9?[{points:[[side.end,side.curve.at(-1).survival],[9,side.curve.at(-1).survival]],dashed:true,color:side.color,label:'Carried prediction beyond local follow-up'}]:[])]}/></div>)}</div>;
}
function SplitDrawing({cut}) {return <div className="survival-tree-anatomy"><p><strong>Temperature index x ≤ {cut}?</strong></p><svg viewBox="0 0 320 70" aria-hidden="true"><path d="M160 2V20L55 65 M160 20L265 65" fill="none" stroke={colors.observed} strokeWidth="2"/><path d="M55 65l3-11m-3 11l11-3 M265 65l-3-11m3 11l-11-3" stroke={colors.observed} strokeWidth="2"/></svg><div><span>Yes → left · query x = 1</span><span>No → right · query x = 6</span></div></div>;}

export function SurvivalTreeFigure() {const model=treeSplit();return <Drawing id="D42a" label="A saved feature question routes a new profile to an entire leaf survival curve"><div className="survival-feature-sockets">{TREE_ROWS.map(row=><span key={row.id}>{row.id}<br/>x = {row.x}</span>)}</div><SplitDrawing cut={3.5}/><LeafCurves model={model}/><p>At day 4, query x = 1 receives survival 1; query x = 6 receives 1/4. A dashed extension is a prediction rule beyond that leaf's local observation support.</p></Drawing>;}

export function SurvivalSplitFigure() {
  const [index,setIndex]=useState(2),cut=[1.5,2.5,3.5,4.5,5.5][index],model=treeSplit(cut);
  return <Drawing id="D42b" label="Move a legal feature cut and recalculate the group contrast and leaf curves"><SplitDrawing cut={cut}/><LeafCurves model={model}/>
    <div className="survival-score-rows">{model.groups.map(row=><div key={row.time}><Value label={`Day ${row.time}: left / total at risk`}>{row.n1} / {row.n}</Value><Arrow label={`${row.d1} observed − ${n(row.expected)} expected`}/><Value label="Score / variance contribution">{n(row.contribution)} / {n(row.increment)}</Value></div>)}</div>
    <QuantityControl label="Legal cut index" value={index} onChange={setIndex} min={0} max={4} step={1} integer reset={()=>setIndex(2)}/>
    <FlowReadout>At cut {cut}, the left contains {model.left.length} and right {model.right.length} observations. U = {n(model.score)}, V = {n(model.variance)}, score = <strong>{n(model.statistic)}</strong>; query x = 6 routes right with S(4) = {n(model.querySurvival)}. Each offered gap leaves at least two observations on both sides.</FlowReadout>
  </Drawing>;
}

export function WeightedPrefixTreeFigure() {
  const [moved,setMoved]=useState(0),model=treePrefixState(moved),weights=[...model.weights,0,0,0];
  return <Drawing id="D42c" label="A prefix tree updates reached event rosters and preserves old weighted counts">
    <BinaryStorageTree label="Eight-leaf weighted prefix tree" levels={[
      [<><strong>All leaves</strong><span>Weight {n(weights.reduce((a,b)=>a+b,0))}</span></>],
      [0,4].map(start=><><strong>Leaves {start+1}–{start+4}</strong><span>Weight {n(weights.slice(start,start+4).reduce((a,b)=>a+b,0))}</span></>),
      [0,2,4,6].map(start=><><strong>Leaves {start+1}–{start+2}</strong><span>Weight {n(weights.slice(start,start+2).reduce((a,b)=>a+b,0))}</span></>),
      weights.map((weight,index)=><><strong>{index<5?`Day ${model.times[index]}`:'Empty'}</strong><span>weight {n(weight)}</span><span>{index<5?`n = ${model.risk[index]}, left = ${model.left[index]}`:'zero-weight storage'}</span></>),
    ]}/>

    <FlowControls><button type="button" disabled={moved===0} onClick={()=>setMoved(moved-1)}>Previous move</button><button type="button" disabled={moved===2} onClick={()=>setMoved(moved+1)}>Move next pump left</button><button type="button" onClick={()=>setMoved(0)}>Reset</button></FlowControls>
    <FlowReadout>{moved===0?'No pump has moved left.':`Moving P${moved} reaches all five event rosters. Read the old weighted prefix ${n(model.oldPrefix)} before incrementing those counts.`} U = {n(model.score)}, V = {n(model.variance)}. Whole covered branches retain a postponed count increment; the three padding leaves represent no subjects.</FlowReadout>
  </Drawing>;
}

export function BootstrapForestFigure() {
  const bag=SAVED_BAGS[0];
  return <Drawing id="D43a" label="A bootstrap bag repeats occurrences while preserving physical subject identity">
    <p>Eight original physical pumps → eight training occurrences in one saved bag</p>
    <div className="survival-bag-row">{TREE_ROWS.map(row=><strong key={row.id}>{row.id}</strong>)}</div>
    <svg className="survival-bag-wires" viewBox="0 0 800 150" aria-hidden="true">{bag.map((original,slot)=><path key={slot} d={`M${50+original*100},5 C${50+original*100},60 ${50+slot*100},90 ${50+slot*100},145`} fill="none" stroke={colors.observed} strokeWidth="2"/>)}</svg>
    <div className="survival-bag-row">{bag.map((original,slot)=><span key={slot}>P{original+1}<br/><small>slot {slot+1}</small></span>)}</div>
    <div className="survival-forest-anatomy">{[1,2,3].map(member=><div key={member}><svg viewBox="0 0 120 105" aria-hidden="true"><path d="M60 4V26L25 55 M60 26L95 55 M25 55L8 94 M25 55L42 94 M95 55L78 94 M95 55L112 94" fill="none" stroke={colors.computed} strokeWidth="2"/><circle cx="60" cy="15" r="8" fill={colors.observed}/>{[8,42,78,112].map(x=><rect key={x} x={x-5} y="91" width="10" height="10" fill={colors.computed}/>)}</svg><p>Member {member}: its bag and per-node feature choices</p></div>)}</div>
    <Operation><Value label="One fixed query profile">Follow each saved question</Value><Arrow/><Value label="Reached leaf in each member">KM survival and NA cumulative rate</Value><Arrow/><Value label="Aggregate separately">Mean S · mean H</Value></Operation>
    <p>The small trees show the forest's structure, not claimed fitted split values. P7 appears three times in this actual bag; those occurrences do not become three independent physical pumps.</p>
  </Drawing>;
}

export function ForestAggregationFigure() {
  const [repeated,setRepeated]=useState(1),[day,setDay]=useState(3),[resetKey,setResetKey]=useState(0),model=forestAverage(repeated,day);
  const reset=()=>{setRepeated(1);setDay(3);setResetKey(key=>key+1);};
  const sA=1/(repeated+1),hA=repeated/(repeated+1);
  return <Drawing id="D43b" label="Average survival curves separately from cumulative-rate curves">
    <div className="survival-columns"><Lifelines rows={[...Array.from({length:repeated},(_,i)=>({id:`A failure occurrence ${i+1}`,time:2,event:true})),{id:'A censored occurrence',time:4,event:false}]} max={4} ticks={[0,2,4]}/><Lifelines rows={[{id:'B1',time:4,event:false},{id:'B2',time:4,event:false}]} max={4} ticks={[0,2,4]}/></div>
    <CurvePlot lines={[{points:[[0,1],[2,1],[2,sA],[4,sA]],label:'Leaf A survival'},{points:[[0,1],[4,1]],label:'Leaf B survival',color:colors.computed},{points:[[0,1],[2,1],[2,(sA+1)/2],[4,(sA+1)/2]],label:'Mean survival',color:colors.event}]} xMax={4} cursor={day}/>
    <CurvePlot lines={[{points:[[0,0],[2,0],[2,hA],[4,hA]],label:'Leaf A Nelson–Aalen cumulative rate'},{points:[[0,0],[4,0]],label:'Leaf B cumulative rate',color:colors.computed},{points:[[0,0],[2,0],[2,hA/2],[4,hA/2]],label:'Mean cumulative rate',color:colors.event}]} xMax={4} cursor={day} yLabel="cumulative rate"/>
    <Operation><Value label="Mean survival at this day">{n(model.meanS)}</Value><Value label="Mean NA cumulative rate">{n(model.meanH)}</Value><Arrow label="a different aggregation"/><Value label="exp(−mean NA)">{n(model.exponential)}</Value></Operation>
    <QuantityControl key={`repeated-${resetKey}`} label="Repeated failure occurrences" value={repeated} onChange={setRepeated} min={0} max={4} step={1} integer reset={reset}/>
    <QuantityControl key={`day-${resetKey}`} label="Query day" value={day} onChange={setDay} min={0} max={4} reset={reset}/>
    <FlowReadout>After day 2, leaf A has S = 1/({repeated}+1) = {n(sA)} and NA cumulative rate {n(hA)}. At the starting one-failure/day-3 state, mean S is 0.75 but exp(−mean H) is {n(Math.exp(-.25))}. With zero failures or before day 2, both means retain the no-event boundary.</FlowReadout>
    <p>Even with exact exponential member laws, averaging probabilities and then taking logs does not commute: member survivals 1/2 and 1 have arithmetic mean 3/4, while exponentiating the average exact cumulative rate gives √(1/2).</p>
  </Drawing>;
}

export function OutOfBagFigure() {
  const [member,setMember]=useState(1),bag=SAVED_BAGS[member-1],counts=TREE_ROWS.map((_,index)=>SAVED_BAGS.filter(ids=>!ids.includes(index)).length);
  return <Drawing id="D43c" label="Out-of-bag eligibility follows original subject identity across all repeated slots">
    <p>Selected saved member {member}: {bag.map(id=>`P${id+1}`).join(', ')}</p>
    <div className="survival-scroll" role="region" aria-label="Seven-member bootstrap occurrence table; scroll horizontally" tabIndex={0}><table><caption>Each cell counts occurrences of that original pump</caption><thead><tr><th>Pump</th>{SAVED_BAGS.map((_,i)=><th key={i}>Tree {i+1}</th>)}<th>OOB members</th></tr></thead><tbody>{TREE_ROWS.map((row,index)=><tr key={row.id}><th>{row.id}</th>{SAVED_BAGS.map((ids,i)=><td key={i} className={i===member-1?'survival-selected-cell':''}>{ids.filter(id=>id===index).length}</td>)}<td>{counts[index]===0?'Unavailable':counts[index]}</td></tr>)}</tbody></table></div>
    <QuantityControl label="Inspect forest member" value={member} onChange={setMember} min={1} max={7} step={1} integer reset={()=>setMember(1)}/>
    <FlowReadout>Member {member} can assess only {TREE_ROWS.filter((_,index)=>!bag.includes(index)).map(row=>row.id).join(', ')||'no original pumps'} as out of bag. P8 appears in every saved member, so it has no OOB prediction. Inspecting a bag changes no fit or outcome.</FlowReadout>
  </Drawing>;
}
