import { useState } from 'react';
import { FlowControls, FlowLab, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { VisionSelection } from './VisionTransformerFlowLabs.jsx';
import examples from '../../data/vision-transformer-examples.json';
import { VisionFlowCells as Cells, VisionFlowDrawing as Drawing, VisionFlowWire as Wire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

function Step({y,children}) {
  return <g><rect x="30" y={y} width="278" height="38" fill="none" stroke={colors.operation}/>
    <text x="169" y={y+25} textAnchor="middle">{children}</text></g>;
}

export function VisionDatasetProtocolDrawing() {
  return <Drawing width={340} height={1110} label="The fixed digit experiment: 3823 original training-file images partition into 1200 fit images, 300 validation images and 2323 unused images. Only validation cross-entropy chooses among 13 measured checkpoints; the original 1797-image test file enters after selection. No test result guides the checkpoint choice.">
    {id=><>
      <Cells x={20} y={65} rows={[[3823]]} cellWidth={136} label="Original training file: image count" role="input"/>
      <Wire path="M88 99 V148" arrowId={id}/>
      <Step y={148}>Stratify by digit; seed 173</Step>
      <Wire path="M169 186 H7 V256 H20" arrowId={id}/>
      <Cells x={20} y={239} rows={[[1200,300,2323]]} cellWidth={96} label="Fit; validation; unused counts" role="input"/>
      <Wire path="M68 273 V331" arrowId={id}/><Step y={331}>Fit on 1,200 only; 600 updates</Step>
      <Wire path="M169 369 H7 V440 H20" arrowId={id}/>
      <Cells x={20} y={423} rows={[["θ0","θ50","θ100"]]} cellWidth={96} label="First 3 of 13 measured checkpoints" role="parameter"/>
      <Wire path="M164 273 H327 V542 H308" arrowId={id}/>
      <Wire path="M164 457 V523" arrowId={id}/><Step y={523}>Validate every 50 on 300</Step>
      <Wire path="M169 561 H7 V631 H20" arrowId={id}/>
      <Cells x={20} y={614} rows={[["CE0","CE50","CE100"]]} cellWidth={96} label="First 3 of 13 validation losses"/>
      <Wire path="M164 648 V701" arrowId={id}/><Step y={701}>Min validation CE; first tie</Step>
      <Wire path="M169 739 H7 V809 H20" arrowId={id}/>
      <Cells x={20} y={792} rows={[["θchosen"]]} cellWidth={142} label="Selected fixed checkpoint" role="parameter"/>
      <Cells x={20} y={895} rows={[[1797]]} cellWidth={142} label="Original test file: image count" role="input"/>
      <Wire path="M162 809 H328 V993 H308" arrowId={id}/>
      <Wire path="M91 929 V974" arrowId={id}/><Step y={974}>Evaluate once; do not reselect</Step>
      <text x="20" y="1062">Test uses the separate writer pool.</text>
      <text x="20" y="1088">Validation does not split writers.</text>
    </>}
  </Drawing>;
}

function ValidationTraceDrawing({name,record}) {
  const x=step=>68+step/600*234,y=loss=>362-loss/3*240;
  const chosen=record.trace.find(row=>row.step===record.chosen_step);
  return <Drawing width={340} height={500} label={`${name}: all thirteen recorded validation cross-entropies at updates 0 through 600. The fixed vertical axis is 0 to 3 nats; the selected checkpoint minimizes these measured losses. Lines connect recorded points only; they are not extra measurements or a test-loss curve.`}>
    <text x="20" y="25">{name}: validation record</text>
    <text x="20" y="55">Vertical: cross-entropy (nats)</text>
    <path d="M68 122 V362 H302" fill="none" stroke={colors.forward}/>
    {[0,1,2,3].map(value=><g key={value}>
      <path d={`M63 ${y(value)} H302`} fill="none" stroke={colors.forward} strokeDasharray="2 6"/>
      <text x="52" y={y(value)+5} textAnchor="end">{value}</text>
    </g>)}
    {[0,150,300,450,600].map(step=><g key={step}>
      <path d={`M${x(step)} 362 V368`} fill="none" stroke={colors.forward}/>
      <text x={x(step)} y="394" textAnchor="middle">{step}</text>
    </g>)}
    <path d={record.trace.map((row,index)=>`${index?'L':'M'}${x(row.step)} ${y(row.cross_entropy)}`).join(' ')}
      fill="none" stroke={colors.computed} strokeWidth="2"/>
    {record.trace.map(row=><circle key={row.step} cx={x(row.step)} cy={y(row.cross_entropy)} r="4" fill={colors.computed}/>)}
    <circle cx={x(chosen.step)} cy={y(chosen.cross_entropy)} r="8" fill="none" stroke="white" strokeWidth="2"/>
    <text x="20" y="435">White ring: selected update {chosen.step}</text>
    <text x="20" y="462">Loss {flowNumber(chosen.cross_entropy,7)} nats</text>
    <text x="20" y="489">Horizontal: AdamW updates</text>
  </Drawing>;
}

export function VisionRecordedValidationInvestigation() {
  const [model,setModel]=useState('vit');
  const names={cnn:'CNN',vit:'Plain ViT',distilled:'DIST student'};
  const record=examples.study[model];
  return <FlowLab id="vision-recorded-validation" label="Inspect the fixed thirteen-checkpoint validation record">
    <ValidationTraceDrawing name={names[model]} record={record}/>
    <FlowControls><VisionSelection name="Recorded training run" value={model}
      options={Object.entries(names)} onChange={setModel}/></FlowControls>
    <FlowReadout>{names[model]} selects update {record.chosen_step} from thirteen measured validation points.
      This selector displays a recorded run; it does not train a model or substitute test data into selection.</FlowReadout>
    <NeuralTable caption="All measured validation checkpoints for the selected run" headers={['Update','Cross-entropy (nats)','Correct out of 300']}
      rows={record.trace.map(row=>[row.step,flowNumber(row.cross_entropy,8),row.correct])}/>
  </FlowLab>;
}
