import { flowNumber } from './LessonFlow.jsx';
import { VisionFlowCells, VisionFlowDrawing, VisionFlowWire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

export function VisionDinoTargetDrawing({ teacher, center, temperature, read, offset = 0 }) {
  return <VisionFlowDrawing width={340} height={700} label="The complete three-prototype teacher target: subtract the running center from teacher logits, divide by positive teacher temperature, then normalize all exponentials together.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={[teacher.map(value=>value+offset)]} cellWidth={96} label="Teacher logits + common offset" role="input" />
      <VisionFlowCells x={20} y={155} rows={[center]} cellWidth={96} label="Running center (held fixed here)" role="input" />
      <VisionFlowWire path="M308 77 H324 V240 H195" arrowId={arrowId} />
      <VisionFlowWire path="M164 189 V223" arrowId={arrowId} />
      <rect x="117" y="223" width="78" height="34" fill="none" stroke={colors.operation} />
      <text x="156" y="246" textAnchor="middle">subtract</text>
      <VisionFlowWire path="M156 257 H7 V329 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={312} rows={[read.centered]} cellWidth={96} label="Centered teacher logits" />
      <VisionFlowWire path="M164 346 V393" arrowId={arrowId} />
      <rect x="82" y="393" width="164" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="416" textAnchor="middle">÷ τteacher {flowNumber(temperature,2)}</text>
      <VisionFlowWire path="M164 427 H7 V494 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={477} rows={[read.centered.map(value=>value/temperature)]} cellWidth={96} label="Scaled target scores" />
      <VisionFlowWire path="M164 511 V553" arrowId={arrowId} />
      <rect x="98" y="553" width="132" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="576" textAnchor="middle">stable softmax</text>
      <VisionFlowWire path="M164 587 H7 V654 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={637} rows={[read.target]} cellWidth={96} label="Current teacher target q" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionDinoStudentDrawing({ student, temperature, read }) {
  const losses=read.target.map((target,index)=>-target*Math.log(read.probability[index]));
  return <VisionFlowDrawing width={340} height={840} label="Student logits divided by student temperature produce a three-prototype distribution. Cross-entropy weights each negative log probability by the detached target; the student logit gradient is probability minus target divided by temperature.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={[student]} cellWidth={96} label="Student logits s" role="input" />
      <VisionFlowWire path="M164 94 V140" arrowId={arrowId} />
      <rect x="58" y="140" width="212" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="163" textAnchor="middle">÷ {flowNumber(temperature,2)} then softmax</text>
      <VisionFlowWire path="M164 174 H7 V241 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={224} rows={[read.probability]} cellWidth={96} label="Student probability p" />
      <VisionFlowCells x={20} y={319} rows={[read.target]} cellWidth={96} label="Detached teacher probability q" />
      <VisionFlowWire path="M308 241 H324 V405 H235" arrowId={arrowId} />
      <VisionFlowWire path="M164 353 V388" arrowId={arrowId} />
      <rect x="93" y="388" width="142" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="411" textAnchor="middle">Each −q log p</text>
      <VisionFlowWire path="M164 422 H7 V487 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={470} rows={[losses]} cellWidth={96} label="Prototype loss contributions" />
      <VisionFlowWire path="M164 504 V548" arrowId={arrowId} />
      <rect x="102" y="548" width="124" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="571" textAnchor="middle">Σ = {flowNumber(read.loss,4)}</text>
      <VisionFlowWire path="M226 565 H330 V622 H322 V664 H308" arrowId={arrowId} color={colors.gradient} dashed />
      <VisionFlowCells x={20} y={647} rows={[read.gradient]} cellWidth={96} label="Logit credit: (p − q) ÷ τstudent" role="gradient" />
      <VisionFlowWire path="M164 647 H335 V77 H308" arrowId={arrowId} color={colors.gradient} dashed />
      <text x="20" y="730" fill={colors.gradient}>Orange: credit returns to student</text>
      <text x="20" y="755">Teacher target receives no credit.</text>
      <text x="20" y="780">Update: s ← s − rate × credit</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionBalancedPrototypeDrawing({ trace, step }) {
  const current=trace.steps[step];
  const input=step?trace.steps[step-1].values:[[1,2,3],[3,1,1]];
  const total=rows=>rows.flat().reduce((a,b)=>a+b,0);
  const columns=input[0].map((_,coordinate)=>input.reduce((mass,row)=>mass+row[coordinate],0));
  const rows=input.map(row=>row.reduce((a,b)=>a+b,0));
  const prototypePass=step%2===1;
  const divisors=step ? prototypePass?columns.map(value=>value*3):rows.map(value=>value*2) : [total(input)];
  return <VisionFlowDrawing width={340} height={1080} label={`The current balancing pass: ${current.stage}. Its actual previous matrix and row or column divisors feed the division. Two explicit sum operations compute the current sample and prototype totals, revealing which constraint is satisfied after the last pass.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={65} rows={input} cellWidth={96} label="Actual input to this pass" role={step?'computed':'input'} />
      <VisionFlowWire path="M164 133 V187" arrowId={arrowId} />
      <rect x="20" y="187" width="288" height="46" fill="none" stroke={colors.operation} />
      <text x="164" y="215" textAnchor="middle">{step ? prototypePass?'Sum each column, multiply by 3':'Sum each row, multiply by 2':'Sum all six initial entries'}</text>
      <VisionFlowWire path="M164 233 H7 V307 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={290} rows={[divisors]} cellWidth={96} label="Divisors for this pass" />
      <VisionFlowWire path="M308 99 H324 V394 H258" arrowId={arrowId} />
      <VisionFlowWire path={`M${20+divisors.length*48} 324 V356 H144 V375`} arrowId={arrowId} />
      <rect x="30" y="375" width="228" height="38" fill="none" stroke={colors.operation} />
      <text x="144" y="400" textAnchor="middle">{step?prototypePass?'Divide each matching column':'Divide each matching row':'Divide every entry by 11'}</text>
      <VisionFlowWire path="M144 413 H7 V483 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={466} rows={current.values} cellWidth={96} label="Current mass matrix" />
      <VisionFlowWire path="M164 534 V590" arrowId={arrowId} />
      <rect x="30" y="590" width="228" height="38" fill="none" stroke={colors.operation} />
      <text x="144" y="615" textAnchor="middle">Sum down every column</text>
      <VisionFlowWire path="M144 628 H7 V695 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={678} rows={[current.prototypeMass]} cellWidth={96} label="Current prototype masses" />
      <VisionFlowWire path="M308 500 H324 V790 H258" arrowId={arrowId} />
      <rect x="30" y="771" width="228" height="38" fill="none" stroke={colors.operation} />
      <text x="144" y="796" textAnchor="middle">Sum across every row</text>
      <VisionFlowWire path="M144 809 H7 V876 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={859} rows={[current.sampleMass]} cellWidth={96} label="Current sample masses" />
      <text x="20" y="950">Prototype target mass: 1/3 each</text>
      <text x="20" y="975">Sample target mass: 1/2 each</text>
      <text x="20" y="1010">Final probability = 2 × final mass</text>
      <text x="20" y="1045">{current.stage}</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionGramDirectionsDrawing({ vectors, selected }) {
  return <VisionFlowDrawing width={340} height={530} label="Four patch feature directions on the unit circle. Each endpoint has a labelled leader, including coincident directions. White marks the selected feature; features are computed violet.">
    {arrowId => <>
      <text x="20" y="24">Unit feature: length 1; edit angle</text>
      <circle cx="170" cy="170" r="100" fill="none" stroke={colors.forward} />
      <line x1="55" y1="170" x2="285" y2="170" stroke={colors.forward} />
      <line x1="170" y1="55" x2="170" y2="285" stroke={colors.forward} />
      <text x="286" y="193">x</text><text x="181" y="57">y</text>
      <text x="272" y="158">1</text><text x="138" y="76">1</text>
      {vectors.map(([x,y],index)=> <g key={index}>
        <VisionFlowWire path={`M170 170 L${170+100*x} ${170-100*y}`} arrowId={arrowId}
          color={index===selected?'white':colors.computed} dashed={index%2===1} />
        <circle cx={170+100*x} cy={170-100*y} r={3+index} fill="none" stroke={index===selected?'white':colors.computed} />
        <path d={`M${170+100*x} ${170-100*y} H${300+index*8} V${332+index*43} H275`}
          fill="none" stroke={colors.forward} />
        <text x="20" y={337+index*43} fill={index===selected?'white':colors.computed}>
          Feature {index}: [{flowNumber(x,3)}, {flowNumber(y,3)}]
        </text>
      </g>)}
      <text x="20" y="513">Leaders identify coincident arrows.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionGramMatrixDrawing({ gram }) {
  return <VisionFlowDrawing width={340} height={1050} label="All pairwise unit-feature dot products form the current Gram matrix. Subtract the fixed teacher matrix, square every entry and sum; matching pairwise geometry need not fix the overall coordinate rotation.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={gram.gram} cellWidth={76} label="Student Gram: feature row/column" />
      <VisionFlowCells x={20} y={280} rows={gram.reference} cellWidth={76} label="Fixed teacher Gram" />
      <VisionFlowWire path="M324 128 H333 V465 H200" arrowId={arrowId} />
      <VisionFlowWire path="M172 416 V448" arrowId={arrowId} />
      <rect x="144" y="448" width="56" height="34" fill="none" stroke={colors.operation} />
      <text x="172" y="471" textAnchor="middle">−</text>
      <VisionFlowWire path="M172 482 H7 V551 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={534} rows={gram.difference} cellWidth={76} label="Student − teacher, all 16 entries" />
      <VisionFlowWire path="M172 670 V717" arrowId={arrowId} />
      <rect x="88" y="717" width="168" height="34" fill="none" stroke={colors.operation} />
      <text x="172" y="740" textAnchor="middle">Square every entry</text>
      <VisionFlowWire path="M172 751 H7 V820 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={803} rows={gram.difference.map(row=>row.map(value=>value*value))}
        cellWidth={76} label="Squared discrepancies" />
      <text x="20" y="991">Sum loss = {flowNumber(gram.loss,6)}</text>
      <text x="20" y="1016">Mean loss = sum ÷ 16 = {flowNumber(gram.loss/16,6)}</text>
    </>}
  </VisionFlowDrawing>;
}
