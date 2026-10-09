import { useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { MoeFlowSelect } from './MoeFlowLabs.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { MoeScene, MoeText, MoeCells, MoeWire, MoeOperation, MOE_PAINT } from './MoeFlowFigures.jsx';
import examples from '../../data/moe-examples.json';

const n=flowNumber, colors=['#b49aff','#6fd9eb','#eee'],dash=['','7 4','3 4'];
export function MoeRecordedStudy() {
  const [run,setRun]=useState(6),[digit,setDigit]=useState(0),current=examples.study[run],curve=current.curve;
  const metrics=current.measurements,assessment=metrics.assessment;
  const min=Math.min(...curve.map(x=>x.validation_ce_after));
  const keys=['minibatch_ce_before','validation_ce_after','minibatch_aux_before'];
  const ceiling=Math.max(3,...curve.flatMap(p=>keys.map(k=>p[k]))),x=s=>70+(s-1)/239*520,y=v=>390-v/ceiling*310;
  const counts=assessment.countsByClass?.[digit]??null;
  return <FlowLab id="moe-flow-recorded-study" label="All twelve retained outcomes and histories">
    <MoeScene width={970} height={580} title="The recorded optimization clock distinguishes before-update minibatches from after-update validation"
      description={`The selected retained run ${current.key} has thirteen recorded points. The validation minimum ${min} selects update ${current.selected_step}. Minibatch task CE and auxiliary loss are measured before the update; validation task CE is measured after it. Curves do not create new runs.`}>
      <path d="M70 70V390H620" fill="none" stroke={MOE_PAINT.forward}/>
      {[0,1,2,3].filter(v=>v<=ceiling).map(v=><g key={v}><MoeText x={50} y={y(v)+5} anchor="end">{v}</MoeText><path d={`M65 ${y(v)}H620`} stroke="#343438"/></g>)}
      {[1,80,160,240].map(s=><MoeText key={s} x={x(s)} y={423} anchor="middle">{s}</MoeText>)}
      <MoeText x={70} y={45}>loss (natural-log units); auxiliary uses its own surrogate scale</MoeText>
      <MoeText x={235} y={457}>optimizer update index</MoeText>
      {keys.map((key,i)=><g key={key}>
        <polyline points={curve.map(p=>`${x(p.step)},${y(p[key])}`).join(' ')} fill="none" stroke={colors[i]} strokeDasharray={dash[i]} strokeWidth="2"/>
        {curve.map(p=><circle key={p.step} cx={x(p.step)} cy={y(p[key])} r="3" fill={colors[i]}/>)}
        <path d={`M590 ${y(curve.at(-1)[key])}H630V${485+i*29}H654`} stroke={colors[i]} fill="none"/>
        <MoeText x={660} y={490+i*29}>{['minibatch CE, before','validation CE, after','minibatch auxiliary, before'][i]}</MoeText>
      </g>)}
      <path d={`M${x(current.selected_step)} 70V390`} stroke="#fff" strokeDasharray="5 4"/><MoeText x={70} y={550}>White dashed line: checkpoint selected by validation task CE.</MoeText>
    </MoeScene>
    <MoeScene width={850} height={860} title="Every seed retains both its clean and stress outcome"
      description="All twelve runs are separate paired rows on the same zero-to-three-hundred correct-image scale. Circles are clean inputs; squares are lower-half-zero stress inputs. The same supplied class labels score both. Lines connect a run's two measured outcomes, not interpolated new experiments.">
      <MoeText x={18} y={30}>Measured correct / 300: ○ clean, □ lower-half zero.</MoeText>
      {[0,100,200,300].map(v=><g key={v}><MoeText x={280+v*1.6} y={66} anchor="middle">{v}</MoeText><path d={`M${280+v*1.6} 80V800`} stroke="#363639"/></g>)}
      {examples.study.map((entry,i)=>{const y=106+i*58,a=entry.measurements.assessment.correct,b=entry.measurements.assessment_lower_half_zero.correct;return <g key={entry.key}>
        <MoeText x={18} y={y+5}>{entry.key}</MoeText><path d={`M${280+b*1.6} ${y}H${280+a*1.6}`} stroke={MOE_PAINT.forward}/>
        <circle cx={280+a*1.6} cy={y} r="5" fill={MOE_PAINT.computed}/><rect x={280+b*1.6-5} y={y-5} width="10" height="10" fill={MOE_PAINT.input}/>
      </g>;})}
      <MoeText x={18} y={839}>Separate seed rows preserve disagreement; these are recorded outcomes.</MoeText>
    </MoeScene>
    {counts?<MoeScene width={740} height={410} title="The observed-class histogram counts patch assignments, not professions"
      description={`For observed digit ${digit}, the retained assessment counts ${counts.join(', ')}. Every image has sixteen patches and two selected experts, so its thirty images contribute 960 assignments. Gate colors do not imply semantic specialization.`}>
      <MoeText x={18} y={30}>Class {digit}: actual selected assignments, denominator 30 × 16 × 2 = 960.</MoeText>
      {counts.map((count,e)=><g key={e}><MoeText x={18} y={92+e*70}>E{e}</MoeText><rect x="65" y={70+e*70} width={count/960*510} height="30" fill={MOE_PAINT.computed}/><MoeText x={590} y={92+e*70}>{count} / 960</MoeText></g>)}
      <MoeText x={18} y={394}>Counts alone do not establish what a branch contributes to recognition.</MoeText>
    </MoeScene>:<p>This retained dense model has no routed-expert assignment histogram.</p>}
    <FlowControls><MoeFlowSelect name="Retained condition and seed" value={run} options={examples.study.map((r,i)=>[i,r.key])} onChange={v=>setRun(+v)}/>
      <MoeFlowSelect name="Observed digit for the retained class row" value={digit} options={Array.from({length:10},(_,i)=>[i,String(i)])} onChange={v=>setDigit(+v)}/></FlowControls>
    <FlowReadout>{current.key}: selected update {current.selected_step}. Assessment {assessment.correct}/{assessment.count} correct, CE {n(assessment.cross_entropy)}.
      {' '}The class {digit} confusion row is [{assessment.confusion[digit].join(', ')}]; its entries count actual supplied-class examples.</FlowReadout>
    <NeuralTable caption="Every recorded point of the selected retained run" headers={['Update','Minibatch CE before','Minibatch auxiliary before','Validation CE after']} rows={curve.map(p=>[p.step,n(p.minibatch_ce_before),n(p.minibatch_aux_before),n(p.validation_ce_after)])}/>
    <NeuralTable caption="All twelve clean/stress pairs; no adverse run omitted" headers={['Condition and seed','Selected update','Assessment correct/count','Clean CE','Lower-half-zero correct/count']} rows={examples.study.map(r=>[r.key,r.selected_step,`${r.measurements.assessment.correct}/${r.measurements.assessment.count}`,n(r.measurements.assessment.cross_entropy),`${r.measurements.assessment_lower_half_zero.correct}/${r.measurements.assessment_lower_half_zero.count}`])}/>
  </FlowLab>;
}

export function MoeDeploymentDrawing({kind='distill'}) {
  return <MoeScene width={780} height={560} title={kind==='distill'?'A fixed teacher and a supplied label supervise a trainable student':'A supplied task identity selects a fixed extractable subset'}
    description={kind==='distill'?'Input reaches both frozen teacher and trainable student. Their full class probabilities join a matching loss; the supplied label reaches a separate task loss. Only the student parameters receive the training derivative. Removing an expert from the teacher is a different operator.':'Task identity chooses a fixed expert subset, while token vectors are still its computation inputs. The extracted task network contains only those fixed selected maps plus shared blocks. A new token-dependent router would produce a different deployment.'}>
    {kind==='distill'?<>
      <MoeCells x={18} y={55} values={['x0','x1']} role="input" label="one supplied input"/>
      <MoeCells x={230} y={55} values={['teacher θ']} role="frozen" width={160} label="fixed parameters"/><MoeCells x={560} y={55} values={['student θ']} role="parameter" width={160} label="trainable parameters"/>
      <MoeWire path="M147 73H190V178H245"/><MoeWire path="M190 178H585"/><MoeWire path="M310 93V158"/><MoeWire path="M640 93V158"/>
      <MoeOperation x={275} y={178} radius={30} symbol="F"/><MoeOperation x={615} y={178} radius={30} symbol="f"/>
      <MoeWire path="M275 208V260"/><MoeWire path="M615 208V260"/>
      <MoeCells x={210} y={260} values={[.7,.2,.1]} label="teacher probabilities" width={100}/><MoeCells x={535} y={260} values={[.5,.3,.2]} label="student probabilities" width={75}/>
      <MoeWire path="M355 298V365H420"/><MoeWire path="M650 298V365H460"/><MoeOperation x={440} y={365} radius={20} symbol="J"/>
      <MoeCells x={18} y={350} values={[0]} role="input" label="supplied class y"/><MoeWire path="M81 368H160V420H575"/><MoeOperation x={595} y={420} symbol="CE" radius={22}/>
      <MoeWire path="M635 298V400H612"/><MoeWire path="M595 442V505H640V93" gradient/>
      <MoeWire path="M440 385V525H725V75H720" gradient/>
      <MoeText x={18} y={492}>Illustrated matching term: KL(teacher || student).</MoeText><MoeText x={18} y={535}>The teacher has no update arrow; deleting experts is not this training rule.</MoeText>
    </>:<>
      <MoeCells x={18} y={55} values={['en→fr']} role="input" width={120} label="supplied task identity"/>
      <MoeWire path="M135 73H230"/><MoeOperation x={260} y={73} symbol="IDs" radius={30}/><MoeWire path="M290 73H365"/>
      <MoeCells x={365} y={55} values={['E0','E2']} role="operation" label="fixed task subset"/>
      <MoeCells x={18} y={230} values={['x0','x1']} role="input" label="token representation"/>
      <MoeWire path="M147 248H245"/><MoeOperation x={275} y={248} symbol="E0" radius={30}/><MoeWire path="M147 248H180V348H245"/><MoeOperation x={275} y={348} symbol="E2" radius={30}/>
      <MoeWire path="M365 73H340V200H275V218"/><MoeWire path="M430 93V318H275"/>
      <rect x={200} y={195} width={145} height={195} fill="none" stroke="#fff"/><MoeText x={370} y={295}>extracted maps plus shared model blocks</MoeText>
      <MoeText x={18} y={480}>The task selects the subset; each token remains the numerical expert input.</MoeText>
      <MoeText x={18} y={525}>Less per-token routing freedom buys a fixed deployment structure.</MoeText>
    </>}
  </MoeScene>;
}
