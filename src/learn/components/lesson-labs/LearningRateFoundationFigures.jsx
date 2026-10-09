import { useState } from 'react';
import { buildRateSchedule } from '../../data/learning-rate-schedule-models.js';
import { scalarRateStep, warmupRates, comparedPolicyRates } from '../../data/learning-rate-reading-models.js';
import { Figure, Plot, Ruler, PointRuler, IntervalBands, Flow, Measure, Mark, Legend, Ledger, Controls, NumberControl, SelectControl, Readout, Steps, ClockMark, n, ink, scheduleIdentity } from './LearningRateReadingPrimitives.jsx';

const points = rows => rows.map(r=>({x:r.update,y:r.rate}));
const rateSeries = (rows, kind='cosine', label) => ({ ...scheduleIdentity[kind], label: label || scheduleIdentity[kind].label, points: points(rows), step:kind==='step' });
function useInputs(initial) {const [state,setState]=useState(initial),[epoch,setEpoch]=useState(0);return [state,(key,value)=>setState(s=>({...s,[key]:value})),()=>{setState(initial);setEpoch(e=>e+1);},epoch,setState];}

export function ScalarMove({ id='L03' }) {
  const [state,set,reset,epoch]=useInputs({curvature:2,rate:.25,error:2}); const result=scalarRateStep(state);
  const verdict=Math.abs(result.multiplier)<1?'Magnitude contracts':Math.abs(result.multiplier)===1?'Magnitude stays the same':'Magnitude expands';
  return <Figure id={id} caption="The grey square and amber circle share the actual signed ruler. Separate labels preserve coincident points; curvature and rate together determine the multiplier.">
    <Ruler before={state.error} after={result.next}/>
    <Readout>q = 1 − {n(state.rate)} × {n(state.curvature)} = {n(result.multiplier)}. {verdict}; {result.multiplier<0?'the error changes side.':result.multiplier===0?'the next error is exactly zero.':'the error keeps its side.'} Initial error zero stays zero.</Readout>
    <p className="lr-equation">Gradient {n(result.gradient)} × rate {n(state.rate)} → displacement {n(result.displacement)} → new error {n(result.next)}</p>
    <Controls key={epoch} reset={reset}><NumberControl label="Curvature h" step={.5} value={state.curvature} min={.5} max={4} onChange={v=>set('curvature',v)}/><NumberControl label="Rate η" value={state.rate} min={0} max={1} onChange={v=>set('rate',v)}/><NumberControl label="Initial error e" step={.1} value={state.error} min={-2} max={2} onChange={v=>set('error',v)}/></Controls>
  </Figure>;
}

export function WarmupJoin() {
  const [state,set,reset,epoch,setState]=useInputs({total:6,warmup:2,floorRatio:1/6}); const [notice,setNotice]=useState('');
  const rows=warmupRates(state);const boundary=state.warmup?state.warmup-1:0;
  const near=rows.filter(r=>r.update>=Math.max(0,boundary-1)&&r.update<=Math.min(state.total-1,boundary+2));
  return <Figure id="L09" caption="Amber circles always identify the cosine policy. Warmup and decay are phase annotations, not new policy colours. The peak is consumed once; the white ring marks their shared boundary.">
    <Plot title="The complete consumed sequence" series={[rateSeries(rows)]} yDomain={[0,.12]} selected={{x:boundary,y:.12}} boundaries={[{x:boundary}]} brackets={[{start:boundary,end:state.total-1,label:`Decay: u=${boundary} to ${state.total-1}; ${state.total-1-boundary} intervals`}]}/>
    <Plot title="The join, on the same rate scale" series={[rateSeries(near)]} yDomain={[0,.12]} selected={{x:boundary,y:.12}}/>
    <Readout>{state.warmup?`${state.warmup} warmup updates; ${state.total-state.warmup} later decay intervals. The used peak at u=${boundary} is the progress-zero boundary.`:'No warmup: all used samples interpolate across T−1 intervals.'} Minimum η = .12 × {n(state.floorRatio,9)} = {n(.12*state.floorRatio)}. {notice}</Readout>
    <Controls key={epoch} reset={()=>{reset();setNotice('');}}><NumberControl label="Used-update budget T" integer value={state.total} min={4} max={24} onChange={total=>{setState(s=>({...s,total,warmup:Math.min(s.warmup,total-1)}));setNotice(state.warmup>=total?`Warmup adjusted to ${total-1} to keep W<T.`:'');}}/><NumberControl label="Warmup updates W" integer value={state.warmup} min={0} max={state.total-1} onChange={v=>set('warmup',v)}/><NumberControl label="Minimum / peak ratio" value={state.floorRatio} min={0} max={1} onChange={v=>set('floorRatio',v)}/></Controls>
    <Ledger caption="Every used value and its phase" headers={['u','ηᵤ','Phase']} rows={rows.map(r=>[r.update,n(r.rate),r.update<state.warmup?'Warmup':'Cosine decay'])}/>

  </Figure>;
}

export function PolicyChoice() {
  const [state,set,reset,epoch]=useInputs({kind:'cosine',selected:0});const rows=comparedPolicyRates(state.kind),r=rows[state.selected];
  const formula={constant:'η = .2',linear:`η = .2 + (.01 − .2) × ${state.selected}/11`,cosine:`η = .01 + .19 × (1 + cos(π × ${state.selected}/11))/2`,step:`η = .2 × .5^floor(${state.selected}/3)`,exponential:`η = .2 × (.01/.2)^(${state.selected}/11)`}[state.kind];
  return <Figure id="L11" caption="Each policy keeps its own colour and marker. Integer samples are consumed; joining strokes only explain the rule. The white ring selects one actual operand substitution.">
    <Plot title={scheduleIdentity[state.kind].label} series={[rateSeries(rows,state.kind)]} xDomain={[0,11]} yDomain={[0,.2]} selected={{x:state.selected,y:r.rate}}/>
    <Readout>{formula} = {n(r.rate)} at update {state.selected}.</Readout>
    <Controls key={epoch} reset={reset}><SelectControl label="Rate policy" value={state.kind} options={Object.entries(scheduleIdentity).map(([k,v])=>[k,v.label])} onChange={v=>set('kind',v)}/><NumberControl label="Selected update" integer value={state.selected} min={0} max={11} onChange={v=>set('selected',v)}/></Controls>
    <Ledger caption="Complete finite policy" headers={['u','Used η']} rows={rows.map(r=>[r.update,n(r.rate)])}/>

  </Figure>;
}

function VectorMove() {
  return <Figure id="L02" caption="Both views use equal physical x/y scales. The lower magnification shows the small displacement without distorting its direction. Doubling the gradient doubles the movement at the same rate.">
    {[{domain:[-2.3,1.3],title:'Vectors from the origin',origin:true},{domain:[-2.05,-1.85],xDomain:[.78,1.04],title:'Endpoint magnification',origin:false}].map((view,index)=><div className="lr-vector-view" key={view.title}><p>{view.title}</p><Measure>{({width,font})=>{
      const pad=font*2.6, side=Math.max(110,width-2*pad),height=side+2*pad;
      const xmin=index? .78:-2.3,xmax=index?1.04:1.3,ymin=index?-2.14:-2.3,ymax=index?-1.88:1.3;
      const x=v=>pad+(v-xmin)/(xmax-xmin)*side,y=v=>height-pad-(v-ymin)/(ymax-ymin)*side;
      const line=(a,b,c,d,colour,dash,arrow=false)=>{const dx=x(c)-x(a),dy=y(d)-y(b),length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;return <g><line x1={x(a)} y1={y(b)} x2={x(c)} y2={y(d)} stroke={colour} strokeWidth="2" strokeDasharray={dash}/>{arrow&&<path d={`M${x(c)-ux*9+uy*4},${y(d)-uy*9-ux*4}L${x(c)},${y(d)}L${x(c)-ux*9-uy*4},${y(d)-uy*9+ux*4}`} fill="none" stroke={colour} strokeWidth="2"/>}</g>;};
      return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${view.title}; start (1,−2), new point (.9,−2.01), doubled-gradient endpoint (.8,−2.02).`} style={{fontSize:font}}>
        <rect x={pad} y={pad} width={side} height={side} fill="none" stroke="#555"/>
        {view.origin&&<>{line(xmin,0,xmax,0,'#666')}{line(0,ymin,0,ymax,'#666')}{line(0,0,1,-2,ink.grey,undefined,true)}{line(0,0,.9,-2.01,ink.amber,undefined,true)}</>}
        {line(1,-2,.9,-2.01,ink.amber,undefined,true)}{line(1,-2,.8,-2.02,ink.cyan,'4 3',true)}
        <Mark x={x(1)} y={y(-2)} colour={ink.grey} shape="square"/><Mark x={x(.9)} y={y(-2.01)} colour={ink.amber}/><Mark x={x(.8)} y={y(-2.02)} colour={ink.cyan} shape="triangle"/>
        <text x={width/2} y={height-font*.4} textAnchor="middle">x</text><text x={pad} y={font}>y</text><text x={pad} y={height-font*.4}>{n(xmin,2)}</text><text x={width-pad} y={height-font*.4} textAnchor="end">{n(xmax,2)}</text>
        <text x={pad-font*.3} y={pad} textAnchor="end">{n(ymax,2)}</text><text x={pad-font*.3} y={height-pad} textAnchor="end">{n(ymin,2)}</text>
      </svg>;
    }}</Measure></div>)}
    <Legend entries={[{label:'Start (1, −2)',colour:ink.grey,shape:'square'},{label:'Gradient (2, .2): endpoint (.9, −2.01)',colour:ink.amber},{label:'Doubled gradient: endpoint (.8, −2.02)',colour:ink.cyan,shape:'triangle'}]}/><p>Displacement length √(.1² + .01²) = {n(Math.hypot(.1,.01))}; doubled length {n(Math.hypot(.2,.02))}.</p>
  </Figure>;
}

function ClockLanes() {
  return <><ol className="lr-clock-groups lr-overview-clocks">{[0,1,2,3].map(group=><li key={group}>
    <p className="lr-clock-group-title">Group {group+1} · microbatches {group*3+1}–{group*3+3}</p>
    <div className="lr-overview-ticks" aria-label={`Microbatches ${group*3+1} through ${group*3+3}`}>{[1,2,3].map(i=><span key={i}><ClockMark kind="microbatch"/>{group*3+i}</span>)}</div>
    <div className="lr-overview-bracket">Three contributions → <ClockMark kind="attempt"/> attempt {group+1}</div>
    <p>Epoch 1: {group===3?'ends after microbatch 12':`${(group+1)*3} of 12 contributions received`}</p>
    <p className="lr-validation-event">{group%2===1?<><ClockMark kind="validation"/> Validation {Math.floor(group/2)+1}, after {(group+1)*3}</>:'Validation: no observation here'}</p>
    {group<3&&<p className="lr-clock-continuation">Continue with microbatch {(group+1)*3+1} ↓</p>}
  </li>)}</ol><p>Neutral ticks count contributions; an outlined diamond marks an attempt, whose success is not specified here. Cyan rings mark validation observations. Four attempts belong to one declared epoch.</p></>;
}

export function FoundationFigure({id}) {
  if(id==='L03')return <ScalarMove/>;
  if(id==='L09')return <WarmupJoin/>;
  if(id==='L11')return <PolicyChoice/>;
  if(id==='L02')return <VectorMove/>;
  if(id==='L01')return <Figure id={id} caption="The derivative has loss per parameter units; its scaled negative becomes a parameter displacement. These two rulers deliberately have different units."><Ruler before={0} after={4} domain={[0,4.5]} beforeLabel="Origin" afterLabel="Derivative" colour={ink.cyan} label="Derivative g = 2 × 2 = 4; loss per parameter"/><Flow title="Change units and reverse direction" nodes={[{label:'Multiply g by −η',detail:'−.1 × 4 = −.4 in parameter units.',colour:ink.amber}]}/><Ruler before={2} after={1.6} domain={[0,2.2]} label="Parameter θ; optimum 0"/></Figure>;
  if(id==='L04')return <Figure id={id} caption="Open endpoints at q=±1 exclude them from strict contraction. Exact landing at q=0 is included. Every movement below starts from error 1 on the same signed scale."><PointRuler title="Strict contraction: −1 < q < 1" domain={[-1.6,1.2]} ticks={[-1,0,1]} interval={[-1,1]} rows={[{label:'Excluded boundary q=−1: equal magnitude, opposite side',value:-1,hollow:true,colour:ink.cyan},{label:'Included q=0: exact landing',value:0,colour:ink.cyan},{label:'Excluded boundary q=1: no change',value:1,hollow:true,colour:ink.cyan}]}/><PointRuler title="Before □ and after ○ on one signed-error scale" domain={[-1.6,1.2]} ticks={[-1,0,1]} rows={[0,.5,1,1.5,2,2.5].map(a=>({label:`ηh=${a}; q=${1-a}; error 1 → ${1-a}`,from:1,value:1-a,hollow:true}))}/></Figure>;
  if(id==='L05')return <Figure id={id} caption="Follow the stored field through each optimizer event to the next prepared field. The fixed gradient is g=1, so rate and displacement happen to have equal magnitudes."><Flow title="Three optimizer events and the rate field they consume" nodes={[{label:'Stored η=.2',detail:'Before update 0',colour:ink.amber},{label:'Update 0 consumes .2',detail:'Optimizer displacement −.2; then scheduler writes .1',decision:true},{label:'Stored η=.1',detail:'Before update 1',colour:ink.amber},{label:'Update 1 consumes .1',detail:'Optimizer displacement −.1; then scheduler writes .05',decision:true},{label:'Stored η=.05',detail:'Before update 2',colour:ink.amber},{label:'Update 2 consumes .05',detail:'Optimizer displacement −.05; the declared three-value list is exhausted.',decision:true}]}/></Figure>;
  if(id==='L06')return <Figure id={id} caption="Aligned lanes encode event order and grouping, not wall time. One epoch is declared to end after microbatch 12; validation occurs after 6 and 12."><ClockLanes/></Figure>;
  if(id==='L07')return <Figure id={id} caption="For this constructed clock illustration, ηᵤ=.2×(.5)ᵘ. Three filled rates are consumed. The hollow .025 is prepared by that rule but the three-update budget ends before it is consumed."><Plot title="Three consumed rates; one prepared future value" xDomain={[0,3]} yDomain={[0,.2]} boundaries={[{x:2.5}]} series={[{label:'Consumed',colour:ink.amber,points:[.2,.1,.05].map((y,x)=>({x,y}))},{label:'Prepared, unconsumed',colour:ink.amber,points:[{x:3,y:.025,hollow:true}],connect:false}]}/><Ledger caption="Used versus prepared" headers={['Index','Rate','Status']} rows={[[0,'.2','Consumed'],[1,'.1','Consumed'],[2,'.05','Consumed'],[3,'.025','Prepared; budget already exhausted']]}/></Figure>;
  if(id==='L08')return <Figure id={id} caption="Six marked integer samples span five intervals. Both plots share the same axes; interpolation strokes are guides between actual consumed values.">{['constant','linear'].map(kind=><Plot key={kind} title={`${scheduleIdentity[kind].label}: six points, five intervals`} yDomain={[0,.12]} xDomain={[0,5]} brackets={[{start:0,end:5,label:'Five intervals connect six used samples'}]} series={[rateSeries(buildRateSchedule({kind,total:6,warmup:0,peak:.12,minimum:.02}),kind)]}/>)}</Figure>;
  if(id==='L10')return <Figure id={id} caption="The four exact eight-value strips share the same scale. W=0 and W=1 coincide; W=7 leaves one decay interval to the floor.">{[0,1,3,7].map(warmup=>{const rows=buildRateSchedule({total:8,warmup,peak:.2,minimum:.01});return <div key={warmup}><Plot title={`Warmup W=${warmup}`} xDomain={[0,7]} yDomain={[0,.2]} series={[rateSeries(rows)]} boundaries={warmup?[{x:warmup-1}]:[]} brackets={[{start:Math.max(0,warmup-1),end:7,label:`Decay spans ${8-Math.max(1,warmup)} intervals after the peak`}]}/><p>{rows.map(r=>n(r.rate)).join(' · ')}</p></div>;})}</Figure>;
  if(id==='L12')return <Figure id={id} caption="The first four filled values are recorded CPU PyTorch values from cosine_restarts.py. The hollow fifth value is derived from its stated cosine rule after the fourth call; it is unconsumed and was not printed in that output.">{[{intervals:4,values:[.2,.172175,.105,.037825,.01]},{intervals:3,values:[.2,.1525,.0575,.01,.0575]}].map(({intervals,values})=><Plot key={intervals} title={`T_max=${intervals} intervals`} xDomain={[0,4]} yDomain={[0,.2]} boundaries={[{x:3.5}]} series={[{label:'Cosine; outlined point is unconsumed',colour:ink.amber,points:values.map((y,x)=>({x,y,hollow:x===4}))}]}/>)}</Figure>;
  if(id==='L13'){const rows=buildRateSchedule({kind:'restart',total:7,period:6,peak:.2,minimum:.01});return <Figure id={id} caption="At the period-six boundary the excluded phase endpoint would be .01, while the next cycle consumes .2. Those two values share the same boundary x-coordinate and keep distinct markers."><Plot title="The boundary changes phase" xDomain={[0,6]} yDomain={[0,.2]} series={[{label:'Cycle-one interpolation',legend:false,markers:false,colour:ink.amber,points:[...points(rows.slice(0,6)),{x:6,y:.01}]},{label:'Cycle-one consumed rates',colour:ink.amber,points:points(rows.slice(0,6)),connect:false},{label:'Terminal minimum, excluded',colour:ink.amber,points:[{x:6,y:.01,hollow:true}],connect:false},{label:'Next-cycle peak, included',colour:ink.amber,points:[{x:6,y:.2}],connect:false}]}/></Figure>;}
  throw new Error(`Unknown foundation figure ${id}`);
}
