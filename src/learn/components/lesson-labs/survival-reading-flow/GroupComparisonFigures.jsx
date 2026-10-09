import { useState } from 'react';
import { FlowReadout } from '../LessonFlow.jsx';
import { Drawing, Lifelines, QuantityControl, RiskMembers, CurvePlot, NumberBars, Operation, Arrow, Value, colors, formatNumber as n } from './SurvivalPrimitives.jsx';
import { kaplanMeier, staircase } from './univariate-models.js';
import { GROUP_PUMPS, CROSSING_PUMPS, logrankRows, twoFailureAllocations } from './rate-comparison-models.js';

export function FailureAllocationFigure() {
  const [count,setCount]=useState(1),pairs=twoFailureAllocations();
  const probabilities=[0,1,2].map(k=>pairs.filter(pair=>pair.count===k).length/15);
  return <Drawing id="D22" label="Count every possible pair under equal current failure chances">
    <div className="survival-columns"><RiskMembers rows={[{id:'C',color:colors.computed},{id:'D',color:colors.computed}]} caption="Group 1: two current competitors"/><RiskMembers rows={['E','F','G','H'].map(id=>({id}))} caption="Group 0: four current competitors"/></div>
    <div className="survival-pair-allocations">{pairs.map(pair=><div key={pair.members.map(member=>member.id).join('')} className={pair.count===count?'survival-pair-selected':''}><span style={{color:pair.members[0].group?colors.computed:colors.observed}}>{pair.members[0].id}</span><span aria-hidden="true">↔</span><span style={{color:pair.members[1].group?colors.computed:colors.observed}}>{pair.members[1].id}</span><small>{pair.count} from group 1</small></div>)}</div>
    <NumberBars rows={probabilities.map((probability,k)=>({label:`${k} group-1 failures: ${[6,8,1][k]} of 15 equally likely pairs`,value:probability,color:k===count?colors.event:colors.observed}))} max={1} />
    <QuantityControl label="Observed group-1 failures" value={count} onChange={setCount} min={0} max={2} step={1} integer reset={()=>setCount(1)}/>
    <FlowReadout>The selected count {count} occurs in <strong>{[6,8,1][count]} of 15</strong> pairs under this null. Expected count = 2/3; variance = 16/45. Two simultaneous failures are sampled without replacement, so the choices are dependent.</FlowReadout>
  </Drawing>;
}

function ContributionDrawing({ model }) {
  const max=Math.max(1,...model.groups.map(group=>Math.abs(group.contribution)));
  return <div className="survival-contributions">{model.groups.map(group=><div key={group.time}><p>Day {group.time}: {group.d1} observed − {n(group.expected)} expected = <strong>{n(group.contribution)}</strong></p><div className="survival-signed-axis"><i/><span style={{left:group.contribution<0?`${50+50*group.contribution/max}%`:'50%',width:`${50*Math.abs(group.contribution)/max}%`,background:group.contribution<0?colors.computed:colors.event}}/></div><p>Risk group 1 / group 0: {group.n1} / {group.n0}; variance contribution {n(group.increment)}</p></div>)}</div>;
}

export function AccumulatedGroupFigure() {
  const model=logrankRows(GROUP_PUMPS);
  return <Drawing id="D23" label="Combine event-time comparisons using each current risk set">
    <Lifelines rows={GROUP_PUMPS.map(row=>({...row,color:row.group?colors.computed:colors.observed,note:`Group ${row.group}: ${row.event?'failure':'logging ends'} day ${row.time}`}))}/>
    <p>Purple is group 1; blue is group 0. Amber fill marks the subjects failing at the current clock while the outline keeps their group identity.</p><div className="survival-event-rosters">{model.groups.map(group=><RiskMembers key={group.time} rows={group.risk.map(row=>({...row,color:row.group?colors.computed:colors.observed}))} time={group.time} caption={`Day ${group.time}: group counts ${group.n1} + ${group.n0}; failures ${group.d}`}/>)}</div>
    <ContributionDrawing model={model}/>
    <Operation><Value label="Total observed − expected">U = 7/6</Value><Arrow label="square / variance"/><Value label="Variance">V = 17/36</Value><Arrow/><Value label="Test statistic">Q = 49/17 = {n(model.statistic)}</Value></Operation>
  </Drawing>;
}

export function CrossingGroupsFigure() {
  const model=logrankRows(CROSSING_PUMPS);
  const left=kaplanMeier(CROSSING_PUMPS.filter(row=>row.group===1)),right=kaplanMeier(CROSSING_PUMPS.filter(row=>row.group===0));
  return <Drawing id="D23-crossing" label="Early and late differences can cancel in one signed test">
    <Lifelines rows={CROSSING_PUMPS.map(row=>({...row,color:row.group?colors.computed:colors.observed,note:`Group ${row.group}: ${row.event?'failure':'logging ends'} day ${row.time}`}))} max={3} ticks={[0,1,2,3]}/>
    <CurvePlot lines={[{points:staircase(left,3),label:'J: group 1',color:colors.computed},{points:staircase(right,3),label:'K: group 0',color:colors.observed}]} xMax={3} xTicks={[0,1,2,3]}/>
    <ContributionDrawing model={model}/>
    <Operation><Value label="Signed sum">+1 − 1 = 0</Value><Arrow/><Value label="Variance">29/35</Value><Arrow/><Value label="Unweighted statistic">Q = 0; p = 1</Value></Operation>
    <p>The survival curves differ even though these signed contributions cancel. Giving the two event times early weights 8 and 6 gives weighted U = 2; late weights 0 and 1/4 give U = −1/4. Each answers its declared weighted question.</p>
  </Drawing>;
}
