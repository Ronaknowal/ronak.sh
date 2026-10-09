import { useState } from 'react';
import { FlowLab, FlowControls, FlowChoice, FlowReadout, flowNumber as num } from './LessonFlow.jsx';
import { Drawing, Arrow, Paper, paperHues } from './MessagePassingFlowElements.jsx';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import { transductiveBoundaryTrace, inductiveBoundaryTrace, temporalBoundaryTrace } from '../../data/message-boundary-flow-models.js';
import './message-boundary-flow.css';

const resultHue='#c1a4f5',parameterHue='#e4b752';
const line=(y,text,hue='#eee')=><text x="144" y={y} textAnchor="middle" fill={hue}>{text}</text>;
function PathGraph({label,active=true,values,degree}) {
  return <Drawing width={288} height={degree?345:300} label={label}>
    <Paper id={0} x={60} y={86} /><Paper id={1} x={221} y={86} />
    <Arrow x1={88} y1={86} x2={193} y2={86} both />
    <Paper id={2} x={144} y={221} />
    {active?<g><path d="M249,86H273V221H172" stroke={paperHues[2]} fill="none"/><Arrow x1={273} y1={86} x2={249} y2={86} hue={paperHues[2]}/><Arrow x1={203} y1={221} x2={172} y2={221} hue={paperHues[2]}/></g>:
      <g><path d="M249,86H273V221H172" stroke="#777" strokeDasharray="5 5" fill="none"/><path d="M265,160l16,16m0,-16l-16,16" stroke="#eee"/>{line(292,'No available 1—2 route','#aaa')}</g>}
    {values && <g><text x="60" y="143" textAnchor="middle" fill={paperHues[0]}>x={num(values[0])}</text><text x="221" y="143" textAnchor="middle" fill={paperHues[1]}>x={num(values[1])}</text><text x="144" y="275" textAnchor="middle" fill={paperHues[2]}>x={num(values[2])}</text></g>}
    {degree && line(332,`Edge degrees: [${degree.join(', ')}]`,resultHue)}
  </Drawing>;
}
function FitLabels() {
  return <Drawing width={288} height={355} label="Only paper 1's constructed class 0 label enters fitting cross entropy; paper 0/2 assessment labels have no input wire">
    {line(26,'Labels have a different route')}
    {line(66,'Paper 0: held out','#aaa')}{line(98,'Paper 2: held out','#aaa')}
    {line(150,'Paper 1 fitting label: class 0',paperHues[1])}
    <Arrow x1={144} y1={167} x2={144} y2={203} hue={paperHues[1]}/>
    <rect x="29" y="212" width="230" height="44" fill="#101010" stroke={resultHue}/>
    {line(240,'fitting cross entropy',resultHue)}
    {line(290,'fit mask: [false, true, false]')}{line(332,'Held-out labels: no input wire','#aaa')}
  </Drawing>;
}
function ReceivingSum({trace}) {
  return <Drawing width={288} height={400} label={`Paper 1 reads own 2, paper 0 value 1 and ${trace.active.includes(2)?'paper 2 value '+trace.features[2][0]:'no paper 2 context'}, yielding ${trace.output[1]}`}>
    {line(26,'Paper 1 feature-to-state route')}
    {trace.donorProducts.map((v,id)=>{const x=220+id*21;return <g key={id}><text x="22" y={74+id*53} fill={paperHues[id]}>Paper {id}: {id===2&&!trace.active.includes(2)?'excluded':num(v)}</text>{!(id===2&&!trace.active.includes(2))&&<g><path d={`M${x},${80+id*53}V${216+id*11}H${174-id*5}`} stroke={paperHues[id]} fill="none"/><Arrow x1={174-id*5} y1={216+id*11} x2={161-id*5} y2={226+id*9} hue={paperHues[id]}/></g>}</g>;})}
    <circle cx="144" cy="246" r="24" stroke={resultHue} fill="#101010"/>
    {line(253,'+',resultHue)}
    {line(306,`state = ${num(trace.output[1])}`,resultHue)}
    {line(346,`fixed class scores [state, 0]`,parameterHue)}
    {line(387,`scores = [${num(trace.logits[0])}, 0]`,resultHue)}
  </Drawing>;
}
export function MessagePassingTransductiveBoundaryLab() {
  const [last,setLast]=useState(4),[include,setInclude]=useState(true),[revision,setRevision]=useState(0);
  const trace=transductiveBoundaryTrace(last,include);
  const reset=()=>{setLast(4);setInclude(true);setRevision(r=>r+1);};
  return <FlowLab label="Available unlabeled context and fitting-label boundary" id="message-transductive-boundary" data-job="D22">
    <div className="mp-boundary-grid"><PathGraph label="Available feature context for papers 0/1/2" active={include} values={[1,2,last]}/><ReceivingSum trace={trace}/><FitLabels/></div>
    <FlowControls><FlowChoice label="Paper 2 feature context" options={[[true,'Available'],[false,'Excluded']]} value={include} onChange={setInclude}/>
      <AggregationQuantity label="Paper 2 feature" value={last} min={-4} max={6} onChange={setLast} revision={revision}/><button type="button" onClick={reset}>Reset</button></FlowControls>
    <FlowReadout>Paper 1 reads {include?'three available rows':'only papers 0 and 1'}, giving state <strong>{num(trace.output[1])}</strong>. Only its constructed class 0 label enters fitting loss <strong>{num(trace.fittingLoss)}</strong>; papers 0/2 labels remain held out.</FlowReadout>
    <p className="flow-note">Constructed unit-weight sum and fixed scores [state,0], to isolate information access. This is not a trained classifier or measured assessment.</p>
  </FlowLab>;
}
function InductiveStage({stage,arriving,weight}) {
  return <Drawing width={288} height={570} label={`${arriving?'Later arriving':'Fitting'} graph includes papers ${stage.ids.join(',')}; same weight ${weight}; current closed degrees ${stage.degrees.join(',')}`}>
    {line(26,arriving?'Later: paper 2 arrives':'Fitting: papers 0 and 1 only')}
    <Paper id={0} x={58} y={112}/><Paper id={1} x={220} y={112}/><Arrow x1={86} y1={112} x2={192} y2={112} both/>
    {arriving?<g><Paper id={2} x={144} y={246}/><path d="M248,112H273V246H172" stroke={paperHues[2]} fill="none"/><Arrow x1={273} y1={112} x2={248} y2={112} hue={paperHues[2]}/><Arrow x1={202} y1={246} x2={172} y2={246} hue={paperHues[2]}/></g>:<g><circle cx="144" cy="246" r="27" stroke="#777" strokeDasharray="5 5" fill="none"/>{line(251,'2','#aaa')}{line(306,'Absent from fitting inputs','#aaa')}</g>}
    {line(346,`Closed degrees [${stage.degrees.join(', ')}]`,resultHue)}
    {line(384,`shared channel weight w = ${weight}`,parameterHue)}
    {line(422,'Current graph normalization → read')}
    {stage.ids.map((id,i)=><text key={id} x="22" y={464+32*i} fill={paperHues[id]}>Paper {id}: {num(stage.output[i][0])}</text>)}
  </Drawing>;
}
export function MessagePassingInductiveBoundaryFigure() {
  const trace=inductiveBoundaryTrace();
  return <FlowLab id="message-inductive-boundary" label="An unseen paper is absent during fitting and uses shared parameters only after arrival" data-job="D23-inductive">
    <div className="mp-boundary-grid"><InductiveStage stage={trace.fitting} weight={trace.weight}/><InductiveStage stage={trace.arriving} arriving weight={trace.weight}/></div>
    <table className="mp-boundary-table"><caption>New graph, same channel weight, recomputed coefficients</caption><thead><tr><th>Available graph</th><th>Receiver 1 own coefficient</th><th>Receiver 1 reading paper 0</th></tr></thead><tbody><tr><th>Fitting 0—1</th><td>1/2</td><td>1/2</td></tr><tr><th>Later 0—1—2</th><td>1/3</td><td>1/√6</td></tr></tbody></table>
    <FlowReadout>Paper 2 has no fitting feature, edge, preprocessing or loss route. After arrival, its output is <strong>{num(trace.arriving.output[2][0])}</strong> under the same illustrative weight 1 and a newly computed normalizer.</FlowReadout>
    <p className="flow-note">This drawing fixes weight 1 to expose transfer of an operation; it does not claim that this weight was learned. Holding out whole graphs uses the same availability boundary for all their nodes.</p>
  </FlowLab>;
}
function TemporalRoute({trace}) {
  return <div className="mp-boundary-grid"><PathGraph label={`${trace.cutoff?'Later t1':'Legal earlier t0'} known graph and degree-derived input`} active={trace.hasTarget} values={trace.features.map(r=>r[0])} degree={trace.degree}/>
    <Drawing width={288} height={460} label={`Cutoff t${trace.cutoff}; edge degree/2 features, own-loop normalization and output rows feed a separate prospective pair head`}>
      {line(25,`Available at t${trace.cutoff}`)}{line(65,'Feature = edge degree / 2')}
      {line(105,`x = [${trace.features.map(r=>num(r[0])).join(', ')}]`,resultHue)}
      <Arrow x1={144} y1={125} x2={144} y2={156}/>{line(187,'S: current graph + own loops')}
      {line(230,`closed degrees [${trace.degrees.join(', ')}]`,resultHue)}
      <Arrow x1={144} y1={250} x2={144} y2={280}/>{line(311,'Graph read: h = Sx')}
      {trace.output.map((v,id)=><text key={id} x="22" y={356+31*id} fill={paperHues[id]}>Paper {id}: h = {num(v)}</text>)}
    </Drawing>
    <Drawing width={288} height={435} label="The candidate pair head reads endpoints 1/2; it does not insert the candidate relationship into message adjacency">
      {line(27,'Separate candidate pair: (1, 2)')}
      <Paper id={1} x={65} y={113}/><Paper id={2} x={223} y={113}/>
      <Arrow x1={65} y1={141} x2={125} y2={220} hue={paperHues[1]}/><Arrow x1={223} y1={141} x2={163} y2={220} hue={paperHues[2]}/>
      <circle cx="144" cy="245" r="25" fill="#101010" stroke={resultHue}/>{line(252,'×',resultHue)}
      {line(311,`h₁ × h₂ = ${num(trace.pairScore)}`,resultHue)}
      {line(365,'No candidate→message input wire')}{line(410,'Score is not a fitted probability','#aaa')}
    </Drawing></div>;
}
export function MessagePassingTemporalBoundaryLab() {
  const [cutoff,setCutoff]=useState(0),trace=temporalBoundaryTrace(cutoff);
  return <FlowLab id="message-temporal-boundary" label="A future edge also changes degree features and invalidates graph normalization" data-job="D23">
    <Drawing width={288} height={160} label="Information timeline: t0 known 0—1; t1 adds relationship 1—2; the later record is unavailable to an earlier prediction">
      <text x="20" y="30">t0: known 0—1</text><Arrow x1={35} y1={46} x2={35} y2={82}/><text x="20" y="111">t1: also observe 1—2</text>
      <text x="20" y="148" fill={parameterHue}>Current cutoff: t{cutoff}</text>
    </Drawing>
    <TemporalRoute trace={trace}/>
    <FlowControls><FlowChoice label="Observation cutoff" options={[[0,'Earlier t0'],[1,'Later t1']]} value={cutoff} onChange={setCutoff}/><button type="button" onClick={()=>setCutoff(0)}>Reset</button></FlowControls>
    <FlowReadout>{cutoff===0?'Legal earlier input excludes relationship 1—2 and its degree contribution.':'The later input includes relationship 1—2; using it for the earlier task would leak future information.'} The separate pair score is <strong>{num(trace.pairScore)}</strong>. {trace.cacheMustChange?`Reusing the t0 normalizer would give paper 1 state ${num(trace.staleOutput[1])}, rather than ${num(trace.output[1])}.`:'The t0 normalizer matches this graph.'}</FlowReadout>
    <p className="flow-note">Constructed one-channel degree feature and dot-product pair head. The timeline demonstrates information access, not measured link-prediction performance.</p>
  </FlowLab>;
}
