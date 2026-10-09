import { useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing } from "./GaussianScalarFigures.jsx";
import { MixtureArrow, gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { GaussianEmTraceDrawing } from "./GaussianEmFigures.jsx";
import { repeatedRowFloor, recordedScalarObjectives, objectiveTrace, objectiveState } from "./gaussian-objective-models.mjs";

const {left:LEFT,right:RIGHT,sum:SUM,ink:INK,reference:REFERENCE}=gaussianMixtureColours;
const colours=[LEFT,RIGHT],number=value=>flowNumber(value,9);

export function GaussianRepeatedRowFloorLab() {
  const [floor,setFloor]=useState(0.25),state=repeatedRowFloor(floor);
  return <FlowLab id="gmm-d32" label="Change one minimum variance after the repeated observations' first fixed allocation">
    <GaussianDrawing id="D32" title="Repeated observations keep distinct IDs and clipping acts on variance before taking its square root" width={850} height={1270} adaptive
      description={`Four fixed observations: A/B both at minus two, C/D both at plus two. Initial Left/Right means minus two/plus two, variances one and equal weights. First allocations are held fixed. Raw first variance ${state.components[0].rawVariance}, minimum ${floor}, used variance ${state.components[0].usedVariance}, standard deviation ${state.components[0].usedStandardDeviation}. One positive minimum acts through max, not addition. A separate supplied raw variance point six is above all offered minima and remains unchanged.`}>
      {width=>{
        const x=value=>60+(value+3)*(width-90)/6;
        return <>
          <text x="20" y="25">Four rows; repeated coordinates</text>
          <text x="20" y="54">Same position; distinct IDs</text>
          <line x1={x(-3)} x2={x(3)} y1="112" y2="112" stroke={REFERENCE}/>
          {[{ids:'A / B',value:-2},{ids:'C / D',value:2}].map(group=><g key={group.ids} data-repeated-ids={group.ids} data-position={group.value}>
            <text x={x(group.value)} y="92" textAnchor="middle">{group.ids}</text><circle cx={x(group.value)} cy="112" r="5" fill={INK}/><text x={x(group.value)} y="140" textAnchor="middle">{group.value}</text>
          </g>)}
          <text x="20" y="180">Used Left / Right shares</text>
          {state.used.rows.map((row,index)=>{
            const y=218+index*70,barWidth=width-100;
            return <g key={row.id} data-repeated-allocation={row.id} data-left-share={row.components[0].share} data-right-share={row.components[1].share}>
              <text x="20" y={y}>{row.id}: {number(row.components[0].share)} / {number(row.components[1].share)}</text>
              <rect x="60" y={y+10} width={barWidth*row.components[0].share} height="12" fill={LEFT}/><rect x={60+barWidth*row.components[0].share} y={y+10} width={barWidth*row.components[1].share} height="12" fill={RIGHT}/>
            </g>;
          })}
          <text x="20" y="515">Each row totals 1; both counts = 2.</text>
          <text x="20" y="550">Two symmetric component updates</text>
          {state.components.map((component,index)=>{
            const y=586+index*115;
            return <g key={component.id} data-floored-component={component.id} data-raw-variance={component.rawVariance} data-used-variance={component.usedVariance} data-used-sd={component.usedStandardDeviation}>
              <text x="20" y={y} fill={colours[index]}>{component.id}: new mean {number(component.mean)}</text>
              <text x="20" y={y+28} fill={colours[index]}>Raw variance: {number(component.rawVariance)}</text>
              <text x="20" y={y+56} fill={colours[index]}>Used variance: {number(component.usedVariance)}</text>
              <text x="20" y={y+84} fill={colours[index]}>Used SD: {number(component.usedStandardDeviation)}</text>
            </g>;
          })}
          <text x="20" y="842">Raw variance and ε feed max:</text>
          <text x="20" y="871">max({number(state.components[0].rawVariance)}, {number(floor)})</text>
          <MixtureArrow points={[[width/2,885],[width/2,910]]}/>
          <text x={width/2} y="936" textAnchor="middle" fill={SUM}>variance {number(state.components[0].usedVariance)}</text>
          <MixtureArrow points={[[width/2,945],[width/2,970]]}/>
          <text x={width/2} y="998" textAnchor="middle" fill={SUM}>√variance → SD {number(state.components[0].usedStandardDeviation)}</text>
          <line x1={x(-3)} x2={x(3)} y1="1040" y2="1040" stroke={REFERENCE}/>
          {state.components.map((component,index)=><g key={component.id} data-floor-sd-bracket={component.id} data-floor-sd={component.usedStandardDeviation}>
            <path d={`M${x(component.mean-component.usedStandardDeviation)},1028 v12 H${x(component.mean+component.usedStandardDeviation)} v-12`} fill="none" stroke={colours[index]} strokeWidth="2"/>
            <circle cx={x(component.mean)} cy="1040" r="4" fill={colours[index]}/>
          </g>)}
          {[-3,-2,-1,0,1,2,3].map(value=><text key={value} x={x(value)} y="1068" textAnchor="middle">{value}</text>)}
          <text x="20" y="1098">Brackets: mean ± used SD</text>
          <text x="20" y="1140">Separate supplied raw variance: 0.6</text>
          <text x="20" y="1169">max(0.6, {number(floor)}) = 0.6: inactive</text>
          <text x="20" y="1220">Variance is squared coordinate units.</text>
          <text x="20" y="1249">SD is coordinate units.</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls><FlowSlider name="Minimum variance for repeated rows" value={floor} onChange={setFloor} min={0.05} max={0.5} step={0.01}/><button type="button" onClick={()=>setFloor(0.25)}>Reset</button></FlowControls>
    <FlowReadout>The allocations and raw variance <strong>{number(state.components[0].rawVariance)}</strong> stay fixed. Minimum variance <strong>{number(floor)}</strong> makes each used variance <strong>{number(state.components[0].usedVariance)}</strong> and each used standard deviation <strong>{number(state.components[0].usedStandardDeviation)}</strong>. Every offered minimum is active for these repeated rows. In the separate raw-variance 0.6 comparison, the same minimum is inactive and leaves 0.6 unchanged.</FlowReadout>
  </FlowLab>;
}

export function GaussianRecordedObjectiveTrace() {
  return <GaussianDrawing id="D33-recorded" title="Six retained O1 scalar log-likelihood states" width={760} height={560} adaptive
    description="Original recorded scalar NumPy output: initial total log likelihood minus7.158187, followed by minus6.461856, minus5.724278, minus5.675743, minus5.675742 and minus5.675742. Both graph axes are linear. The original program uses a point05 variance floor; these printed values are preserved historical output, not a new execution.">
    {width=>{
      const x=iteration=>65+iteration*(width-100)/5,y=value=>270-(value+7.4)/1.9*170;
      return <>
        <text x="20" y="25">Recorded O1 scalar output</text><text x="20" y="54">Total log likelihood · linear nats</text>
        <line x1="65" x2="65" y1="90" y2="270" stroke={REFERENCE}/>
        {[-7.4,-6.5,-5.5].map(value=><g key={value}><text x="53" y={y(value)+5} textAnchor="end">{value}</text><line x1="65" x2={width-35} y1={y(value)} y2={y(value)} stroke={REFERENCE} strokeDasharray="2 6"/></g>)}
        <path d={recordedScalarObjectives.map((value,index)=>`${index?'L':'M'}${x(index)},${y(value)}`).join(' ')} fill="none" stroke={SUM} strokeWidth="2"/>
        <line x1="65" x2={width-35} y1="270" y2="270" stroke={REFERENCE}/>
        {recordedScalarObjectives.map((value,index)=><g key={index} data-recorded-o1-state={index} data-recorded-o1-objective={value}><circle cx={x(index)} cy={y(value)} r="4" fill={SUM}/><text x={x(index)} y="297" textAnchor="middle">{index}</text><text x="20" y={345+index*28}>State {index}: ℓ {value}</text></g>)}
        <text x="20" y="529">Original floor 0.05; six printed states.</text>
      </>;
    }}
  </GaussianDrawing>;
}

function GainDrawing({trace,selected}) {
  const gains=trace.states.map(snapshot=>snapshot.gain),finite=gains.filter(value=>value!==null),maximum=Math.max(0,...finite),minimum=Math.min(0,...finite),flat=maximum===minimum;
  const margin=flat?0.1:Math.max(0.05,(maximum-minimum)*0.1),lower=minimum-margin,upper=maximum+margin;
  return <GaussianDrawing id="D33-gain" title="Signed total-log-likelihood gain of each accepted M-step" width={820} height={355} adaptive
    description={`Stored gains are current total log likelihood minus the preceding state's value. State zero has no prior-state gain. Signed gain uses an ordinary linear range ${lower} to ${upper}. The selection highlights iteration ${selected}; all stored values are retained.`}>
    {width=>{
      const x=iteration=>70+iteration*(width-100)/50,y=value=>245-(value-lower)/(upper-lower)*170;
      return <><text x="20" y="25">M gain · signed linear nats</text>
        <line x1="70" x2="70" y1="75" y2="245" stroke={REFERENCE}/>
        {[lower,upper].map(value=><text key={value} x="58" y={y(value)+5} textAnchor="end">{flowNumber(value,2)}</text>)}
        <text x={width-30} y={y(0)-12} textAnchor="end">zero gain</text>
        <line x1="70" x2={width-30} y1={y(0)} y2={y(0)} stroke={REFERENCE} strokeDasharray="2 5"/>
        {gains.map((gain,index)=>gain===null?null:<g key={index} data-trace-gain-iteration={index} data-trace-gain={gain}><line x1={x(index)} x2={x(index)} y1={y(0)} y2={y(gain)} stroke={index===selected?INK:SUM}/><circle cx={x(index)} cy={y(gain)} r={index===selected?5:2} fill={index===selected?INK:SUM}/></g>)}
        <line x1="70" x2={width-30} y1="245" y2="245" stroke={REFERENCE}/>
        {[0,10,20,30,40,50].map(iteration=><text key={iteration} x={x(iteration)} y="275" textAnchor="middle">{iteration}</text>)}
        <text x="20" y="309">State 0: no preceding-state gain.</text><text x="20" y="338">Large light dot: selected iteration.</text>
      </>;
    }}
  </GaussianDrawing>;
}

function ObjectiveReduction({state}) {
  return <GaussianDrawing id="D33-reduction" title="Same-state row logs sum into total log likelihood, then divide into mean" width={820} height={620} adaptive
    description={`At parameter state theta${state.parameterTimestamp}, observed IDs A toD each supply their log mixture density. Sum over actual observed IDs gives ${state.total} nats; divide by actual count ${state.count} to obtain ${state.mean} nats per row. All row logs and reductions have the same current parameter timestamp, distinct from stored used allocation timestamp ${state.usedAllocationTimestamp}.`}>
    {width=><>
      <text x="20" y="25">Current parameters θ{state.parameterTimestamp}</text>
      <text x="20" y="54">Row mixture logs · natural log</text>
      {state.rowLogs.map((row,index)=><text key={row.id} data-objective-row={row.id} data-objective-row-log={row.value} x="20" y={96+index*28}>{row.id}: {number(row.value)}</text>)}
      <MixtureArrow points={[[width/2,205],[width/2,233]]}/>
      <text x={width/2} y="260" textAnchor="middle">Σ over observed IDs</text>
      <MixtureArrow points={[[width/2,270],[width/2,298]]}/>
      <text x={width/2} y="326" textAnchor="middle" fill={SUM}>Total ℓ = {number(state.total)}</text>
      <text x={width/2} y="354" textAnchor="middle">nats · θ{state.parameterTimestamp}</text>
      <MixtureArrow points={[[width/2,365],[width/2,393]]}/>
      <text x={width/2} y="420" textAnchor="middle">÷ actual row count {state.count}</text>
      <MixtureArrow points={[[width/2,430],[width/2,458]]}/>
      <text x={width/2} y="486" textAnchor="middle" fill={SUM}>Mean ℓ / n = {number(state.mean)}</text>
      <text x={width/2} y="514" textAnchor="middle">nats / row · θ{state.parameterTimestamp}</text>
      <text x="20" y="563">Used allocations: θ{state.usedAllocationTimestamp}</text>
      <text x="20" y="592">Current score: θ{state.parameterTimestamp}</text>
    </>}
  </GaussianDrawing>;
}

export function GaussianObjectiveTraceLab() {
  const trace=useMemo(()=>objectiveTrace(),[]),[iteration,setIteration]=useState(0),state=objectiveState(trace,iteration);
  return <FlowLab id="gmm-d33" label="Choose a stored scalar parameter state and follow its likelihood reductions and signed gain">
    <GaussianEmTraceDrawing trace={trace} selectedIteration={iteration} id="D33-current"/>
    <GainDrawing trace={trace} selected={iteration}/>
    <ObjectiveReduction state={state}/>
    <FlowControls><FlowSlider name="Stored scalar iteration" value={iteration} onChange={setIteration} min={0} max={trace.states.length-1} step={1}/><button type="button" onClick={()=>setIteration(0)}>Reset</button></FlowControls>
    <FlowReadout>Parameter state <strong>θ{iteration}</strong> has total log likelihood <strong>{number(state.total)}</strong> nats and mean <strong>{number(state.mean)}</strong> nats per row across <strong>{state.count}</strong> observations. {state.gain===null?'State zero has no preceding-state gain.':`Its M-step changed the total by ${state.gain!==0&&Math.abs(state.gain)<1e-6?state.gain.toExponential(8):number(state.gain)} nats.`} Used allocations belong to <strong>θ{state.usedAllocationTimestamp}</strong>; the score is recomputed under <strong>θ{iteration}</strong>. Moving this control selects stored values; it does not refit the model.</FlowReadout>
    <div className="em-table-region" role="region" tabIndex={0} aria-label="All fifty-one stored scalar objectives and gains">
      <table className="em-exact-table"><caption>All stored states; tick labels omit no data</caption><thead><tr><th scope="col">State</th><th scope="col">Total ℓ / nats</th><th scope="col">Mean ℓ/n / nats per row</th><th scope="col">Signed M gain / nats</th></tr></thead>
        <tbody>{trace.states.map(snapshot=><tr key={snapshot.iteration} data-stored-objective-state={snapshot.iteration}><th scope="row">θ{snapshot.iteration}</th><td>{number(snapshot.objective.totalLogLikelihood)}</td><td>{number(snapshot.objective.meanLogLikelihood)}</td><td>{snapshot.gain===null?'No predecessor':snapshot.gain.toExponential(8)}</td></tr>)}</tbody>
      </table>
    </div>
  </FlowLab>;
}

export function GaussianFlatObjectiveReference() {
  const trace=useMemo(()=>objectiveTrace(undefined,{ids:['Left','Right'],weights:[0.5,0.5],means:[0,0],variances:[2.5,2.5]}),[]);
  return <GaussianEmTraceDrawing trace={trace} id="D33-flat"/>;
}
