import { flowNumber } from './LessonFlow.jsx';
import { softmax } from '../../data/vision-transformer-models.js';
import {
  VisionFlowCells, VisionFlowDrawing, VisionFlowWire, visionFlowColors as colors,
} from './VisionTransformerFlowFigures.jsx';

const add = (a, b) => a.map((value, coordinate) => value + b[coordinate]);
const sum = row => row.reduce((total, value) => total + value, 0);

export function VisionRecordAssemblyDrawing() {
  const content = [[0,0],[5.5,-2],[9.5,-2],[21.5,-2],[25.5,-2]];
  const position = [[.1,.1],[0,0],[.2,0],[0,.2],[.2,.2]];
  return <VisionFlowDrawing width={340} height={1000}
    label="Five actual records: a learned class workspace and four projected image patches each add their own learned position row. The supplied two-coordinate example uses stipulated small parameters.">
    {arrowId => <>
      <text x="20" y="25">Two coordinates per record</text>
      <text x="20" y="50">Positions: constructed example</text>
      {content.map((row, record) => {
        const y = 100 + record * 175;
        return <g key={record}>
          <VisionFlowCells x={20} y={y} rows={[row]} cellWidth={68}
            label={record ? `Patch ${record - 1} content` : 'Learned CLS workspace'}
            role={record ? 'computed' : 'parameter'} />
          <VisionFlowCells x={20} y={y+82} rows={[position[record]]} cellWidth={68}
            label={record ? `Position ${record-1}` : 'CLS position'} role="parameter" />
          <VisionFlowWire path={`M156 ${y+17} H173 V${y+46}`} arrowId={arrowId} />
          <VisionFlowWire path={`M156 ${y+99} H173 V${y+76}`} arrowId={arrowId} />
          <circle cx="173" cy={y+61} r="15" fill="none" stroke={colors.operation} />
          <text x="173" y={y+66} textAnchor="middle">+</text>
          <VisionFlowWire path={`M188 ${y+61} H333 V${y+140} H316`} arrowId={arrowId} />
          <VisionFlowCells x={180} y={y+123} rows={[add(row,position[record])]} cellWidth={68}
            label={record ? `Sequence row ${record}` : 'Row 0: CLS'} />
        </g>;
      })}
    </>}
  </VisionFlowDrawing>;
}

export const visionConstructedHead = (() => {
  const query = [1,0];
  const keys = [[1,0],[0,1],[-1,0]];
  const values = [[2,0],[0,2],[1,1]];
  const products = keys.map(row => row.map((value, coordinate) => value * query[coordinate]));
  const scores = products.map(row => sum(row) / Math.sqrt(2));
  const maximum = Math.max(...scores);
  const mass = scores.map(score => Math.exp(score - maximum));
  const total = sum(mass);
  const weights = softmax(scores);
  const contributions = values.map((row, source) => row.map(value => value * weights[source]));
  const output = [0,1].map(coordinate => sum(contributions.map(row => row[coordinate])));
  return { query, keys, values, products, scores, mass, total, weights, contributions, output };
})();

export function VisionConstructedHeadDrawing() {
  const read = visionConstructedHead;
  return <VisionFlowDrawing width={340} height={1630}
    label="A constructed two-coordinate attention read with three source records, every coordinate product, scaled score, exponential amount, shared normalization and value contribution shown.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={[read.query]} label="Receiver query Q" role="input" />
      <VisionFlowCells x={20} y={152} rows={read.keys} label="Three source keys K" role="input" />
      <VisionFlowWire path="M172 77 H306 V341 H252" arrowId={arrowId} />
      <VisionFlowWire path="M96 254 V325" arrowId={arrowId} />
      <rect x="20" y="325" width="232" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="348" textAnchor="middle">Q × each K coordinate</text>
      <VisionFlowWire path="M136 359 H7 V427 H60" arrowId={arrowId} />
      <VisionFlowCells x={60} y={410} rows={read.products} label="Coordinate products" />
      <VisionFlowWire path="M136 512 V559" arrowId={arrowId} />
      <rect x="60" y="559" width="152" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="582" textAnchor="middle">Σ row ÷ √2</text>
      <VisionFlowWire path="M136 593 H7 V659 H90" arrowId={arrowId} />
      <VisionFlowCells x={90} y={642} rows={read.scores.map(value => [value])} label="Three scaled scores" cellWidth={92} />
      <VisionFlowWire path="M136 744 V785" arrowId={arrowId} />
      <rect x="45" y="785" width="182" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="808" textAnchor="middle">exp(score − maximum)</text>
      <VisionFlowWire path="M136 819 V870" arrowId={arrowId} />
      <VisionFlowCells x={20} y={870} rows={read.mass.map(value => [value])} label="Exp amounts" cellWidth={92} />
      <VisionFlowWire path="M112 921 H147" arrowId={arrowId} />
      <circle cx="165" cy="921" r="18" fill="none" stroke={colors.operation} />
      <text x="165" y="926" textAnchor="middle">Σ</text>
      <VisionFlowWire path="M183 921 H224" arrowId={arrowId} />
      <VisionFlowCells x={224} y={904} rows={[[read.total]]} cellWidth={96} label="Shared sum" />
      <VisionFlowWire path="M66 972 V1020 H108" arrowId={arrowId} />
      <VisionFlowWire path="M272 938 V1020 H164" arrowId={arrowId} />
      <rect x="108" y="1003" width="56" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="1026" textAnchor="middle">÷</text>
      <VisionFlowWire path="M136 1037 H7 V1105 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={1088} rows={read.weights.map(value => [value])} cellWidth={92} label="Read weights a" />
      <VisionFlowCells x={160} y={1088} rows={read.values} label="Returned values V" role="input" />
      <VisionFlowWire path="M66 1190 V1225 H145" arrowId={arrowId} />
      <VisionFlowWire path="M236 1190 V1225 H179" arrowId={arrowId} />
      <circle cx="162" cy="1225" r="17" fill="none" stroke={colors.operation} />
      <text x="162" y="1230" textAnchor="middle">×</text>
      <VisionFlowWire path="M162 1242 H7 V1310 H86" arrowId={arrowId} />
      <VisionFlowCells x={86} y={1293} rows={read.contributions} label="Each weight × its value row" />
      <VisionFlowWire path="M162 1395 V1446" arrowId={arrowId} />
      <circle cx="162" cy="1464" r="18" fill="none" stroke={colors.operation} />
      <text x="162" y="1469" textAnchor="middle">Σ</text>
      <VisionFlowWire path="M162 1482 H7 V1547 H86" arrowId={arrowId} />
      <VisionFlowCells x={86} y={1530} rows={[read.output]} label="Complete mixed output" />
      <text x="20" y="1600">All three sources participate.</text>
    </>}
  </VisionFlowDrawing>;
}

// A full current table supplies numeric depth next to an honest small cutaway.
// This primitive always attaches maps to activation operands rather than treating
// a learned matrix as though it were generated by the input vector.
export function VisionAffineCutawayDrawing({ input, weights, biases, output, name, inputLabel, inputRole = 'computed', visible = 3 }) {
  const width = Math.min(visible, input.length);
  const rows = Math.min(2, weights.length);
  const products = weights.slice(0,rows).map(row => row.slice(0,width).map((value, coordinate) => value * input[coordinate]));
  return <VisionFlowDrawing width={340} height={790}
    label={`${name}: actual map ${weights.length} by ${input.length}, its input, selected coordinate products, omitted remainder, biases and actual full-sum output.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={62} rows={[input.slice(0,width)]} cellWidth={96}
        label={`${inputLabel}: ${width} of ${input.length}`} role={inputRole} />
      <VisionFlowCells x={20} y={159} rows={weights.slice(0,rows).map(row => row.slice(0,width))}
        cellWidth={96} label={`${name} W: ${weights.length}×${input.length}`} role="parameter" />
      <text x="20" y="250">First {rows} output rows, {width} columns</text>
      <VisionFlowWire path="M308 79 H324 V298 H197" arrowId={arrowId} />
      <VisionFlowWire path="M164 227 H7 V298 H163" arrowId={arrowId} />
      <circle cx="180" cy="298" r="17" fill="none" stroke={colors.operation} />
      <text x="180" y="303" textAnchor="middle">×</text>
      <VisionFlowWire path="M180 315 H324 V390 H308" arrowId={arrowId} />
      <VisionFlowCells x={20} y={373} rows={products} cellWidth={96} label="Shown coordinate products" />
      <text x="20" y="471">… plus {input.length-width} other products per row</text>
      <VisionFlowWire path="M308 407 H332 V523 H197" arrowId={arrowId} />
      <circle cx="180" cy="523" r="17" fill="none" stroke={colors.operation} />
      <text x="180" y="528" textAnchor="middle">Σ</text>
      <VisionFlowWire path="M180 540 V613" arrowId={arrowId} />
      <circle cx="180" cy="630" r="17" fill="none" stroke={colors.operation} />
      <text x="180" y="635" textAnchor="middle">+</text>
      <VisionFlowCells x={20} y={582} rows={[biases.slice(0,rows)]} cellWidth={96} label="Learned biases" role="parameter" />
      <VisionFlowWire path="M116 616 V630 H163" arrowId={arrowId} />
      <VisionFlowWire path="M180 647 H7 V734 H84" arrowId={arrowId} />
      <VisionFlowCells x={84} y={717} rows={[output.slice(0,rows)]} cellWidth={96} label="Actual full dot products + b" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionNormalizationDrawing({ trace, row = 0, title = 'Current row normalization' }) {
  const coordinates = [0,1,2];
  return <VisionFlowDrawing width={340} height={820} label={`${title}: the current row is centered using all 32 coordinates, divided by the common standard deviation with epsilon, then transformed by learned per-coordinate gain and offset. Three coordinates are shown.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={62} rows={[coordinates.map(i => trace.input[row][i])]} cellWidth={96} label="Input: first 3 of 32 coordinates" />
      <VisionFlowCells x={20} y={159} rows={[[trace.means[row]]]} cellWidth={96} label="Mean over all 32" />
      <VisionFlowWire path="M308 79 H322 V239 H194" arrowId={arrowId} />
      <VisionFlowWire path="M116 176 H136 V222" arrowId={arrowId} />
      <rect x="78" y="222" width="116" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="245" textAnchor="middle">Input − mean</text>
      <VisionFlowWire path="M136 256 H7 V325 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={308} rows={[coordinates.map(i => trace.centered[row][i])]} cellWidth={96} label="Centered coordinates" />
      <VisionFlowCells x={20} y={407} rows={[[trace.divisors[row]]]} cellWidth={96} label="√(variance + 0.00001)" />
      <VisionFlowWire path="M308 325 H322 V486 H182" arrowId={arrowId} />
      <VisionFlowWire path="M116 424 H136 V469" arrowId={arrowId} />
      <rect x="90" y="469" width="92" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="492" textAnchor="middle">÷ divisor</text>
      <VisionFlowWire path="M136 503 H7 V568 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={551} rows={[coordinates.map(i => trace.standardized[row][i])]} cellWidth={96} label="Standardized coordinates" />
      <VisionFlowCells x={20} y={647} rows={[coordinates.map(i => trace.gains[i]),coordinates.map(i => trace.offsets[i])]}
        cellWidth={96} label="Learned gain (top), offset (bottom)" role="parameter" />
      <VisionFlowWire path="M308 568 H334 V739 H214" arrowId={arrowId} />
      <VisionFlowWire path="M116 715 H136 V722" arrowId={arrowId} />
      <rect x="58" y="722" width="156" height="34" fill="none" stroke={colors.operation} />
      <text x="136" y="745" textAnchor="middle">× gain + offset</text>
      <VisionFlowWire path="M136 756 V782" arrowId={arrowId} />
      <VisionFlowCells x={20} y={782} rows={[coordinates.map(i => trace.output[row][i])]} cellWidth={96} label="" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionResidualDrawing({ input, update, output, label }) {
  return <VisionFlowDrawing width={340} height={310} label={`${label}: the saved input and computed branch write are added coordinate by coordinate, with three of 32 coordinates shown.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={58} rows={[input.slice(0,3)]} cellWidth={96} label="Saved input: 3 of 32" />
      <VisionFlowCells x={20} y={155} rows={[update.slice(0,3)]} cellWidth={96} label="Computed branch write: 3 of 32" />
      <VisionFlowWire path="M308 75 H322 V226 H191" arrowId={arrowId} />
      <VisionFlowWire path="M164 189 V209" arrowId={arrowId} />
      <circle cx="174" cy="226" r="17" fill="none" stroke={colors.operation} />
      <text x="174" y="231" textAnchor="middle">+</text>
      <VisionFlowWire path="M174 243 V274" arrowId={arrowId} />
      <VisionFlowCells x={20} y={274} rows={[output.slice(0,3)]} cellWidth={96} label="" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionActivationDrawing({ before, after }) {
  return <VisionFlowDrawing width={340} height={280} label="Three actual hidden coordinates pass individually through GELU; the remaining 61 coordinates follow the same pointwise rule.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={[before.slice(0,3)]} cellWidth={96} label="Hidden input: 3 of 64" />
      <VisionFlowWire path="M164 94 V140" arrowId={arrowId} />
      <rect x="82" y="140" width="164" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="163" textAnchor="middle">Elementwise GELU</text>
      <VisionFlowWire path="M164 174 H7 V243 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={226} rows={[after.slice(0,3)]} cellWidth={96} label="Gated hidden values: 3 of 64" />
    </>}
  </VisionFlowDrawing>;
}

export function VisionDigitDrawing({ image, pixel, patch = null }) {
  return <VisionFlowDrawing width={340} height={415} label="The current eight-by-eight digit image with original row and column coordinates. White outlines identify the selected pixel and, when shown, the selected original two-by-two patch. Grayscale encodes the supplied intensity from 0 dark to 1 light.">
    <text x="20" y="23" fill={colors.input}>Current image: 0 dark → 1 light</text>
    {image.map((row,r)=>row.map((value,c)=> <g key={`${r}-${c}`}>
      <rect x={52+c*34} y={80+r*34} width="34" height="34"
        fill={`rgb(${Math.round(20+230*value)},${Math.round(20+230*value)},${Math.round(20+230*value)})`}
        stroke={colors.input} />
      <text x={69+c*34} y={103+r*34} textAnchor="middle" fill={value>.5?'#080808':'#eeeeee'}>{flowNumber(value*16,0)}</text>
    </g>))}
    {Array.from({length:8},(_,coordinate)=> <g key={coordinate}>
      <text x={69+coordinate*34} y="65" textAnchor="middle">{coordinate}</text>
      <text x="28" y={103+coordinate*34} textAnchor="middle">{coordinate}</text>
    </g>)}
    {patch!==null && <rect x={52+patch%4*68} y={80+Math.floor(patch/4)*68} width="68" height="68" fill="none" stroke="white" strokeWidth="3" />}
    <rect x={52+pixel%8*34} y={80+Math.floor(pixel/8)*34} width="34" height="34" fill="none" stroke="white" strokeWidth="3" />
    <text x="20" y="385">Cell numbers: counts out of 16</text>
    <text x="20" y="410">Pixel ({Math.floor(pixel/8)},{pixel%8}) selected</text>
  </VisionFlowDrawing>;
}

export function VisionClassProbabilityDrawing({ trace }) {
  return <VisionFlowDrawing width={340} height={485} label="The ten computed class probabilities of the same current image and patch-position case. Bar length uses the fixed zero-to-one probability scale; no training happens when an input changes.">
    <text x="20" y="25" fill={colors.computed}>Current class probabilities</text>
    <text x="54" y="55">0</text><text x="220" y="55">1</text>
    {trace.probabilities.map((value,index)=> <g key={index}>
      <text x="20" y={90+index*36}>{index}</text>
      <line x1="54" x2="220" y1={84+index*36} y2={84+index*36} stroke={colors.forward} />
      <rect x="54" y={76+index*36} width={166*value} height="16" fill={colors.computed} />
      <text x="237" y={90+index*36}>{flowNumber(value,4)}</text>
    </g>)}
    <text x="20" y="465">Largest probability: class {trace.predicted}</text>
  </VisionFlowDrawing>;
}

export function VisionHeadReadDrawing({ read }) {
  const rows=read.scores.map((score,index)=>[score,read.mass[index],read.shares[index]]);
  const height=280+rows.length*34;
  return <VisionFlowDrawing width={340} height={height} label={`Actual block ${read.blockIndex} head ${read.headIndex} receiver ${read.receiver}: every one of the 17 source rows, including CLS, contributes its scaled score, shifted exponential amount and normalized weight. The full shared denominator includes all 17 sources.`}>
    {arrowId => <>
      <text x="20" y="24">B{read.blockIndex}, head{read.headIndex}, receiver{read.receiver}</text>
      <text x="20" y="49">Source rows: 0 CLS, 1–16 patch slots</text>
      <VisionFlowCells x={20} y={109} rows={rows} cellWidth={96} label="Scaled score, exp amount, weight" />
      <text x="20" y={137+rows.length*34}>Stable maximum = {flowNumber(read.maximum,5)}</text>
      <text x="20" y={164+rows.length*34}>Shared exp sum = {flowNumber(read.denominator,5)}</text>
      <text x="20" y={211+rows.length*34}>Weights then multiply source values.</text>
      <text x="20" y={244+rows.length*34}>The contribution route follows.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionHeadContributionDrawing({ read, source = 0 }) {
  const query=read.query.slice(0,3),key=read.keys[source].slice(0,3),products=read.products[source].slice(0,3);
  const other=[0,1,2].map(coordinate=>read.contributions.reduce((total,row,index)=>index===source?total:total+row[coordinate],0));
  return <VisionFlowDrawing width={340} height={1470} label={`Actual source row ${source} for the same receiver: three of 8 dot-product coordinates shown, then its full scaled score and weight, its value coordinates and weighted contribution. Omitted dot-product terms are included in the full score; the separately drawn sum of other 16 contributions completes the output.`}>
    {arrowId => <>
      <VisionFlowCells x={20} y={62} rows={[query]} cellWidth={96} label="Current query: 3 of 8 coordinates" />
      <VisionFlowCells x={20} y={160} rows={[key]} cellWidth={96} label={`Source ${source} key: 3 of 8`} />
      <VisionFlowWire path="M308 79 H324 V250 H195" arrowId={arrowId} />
      <VisionFlowWire path="M164 194 V233" arrowId={arrowId} />
      <rect x="133" y="233" width="62" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="256" textAnchor="middle">×</text>
      <VisionFlowWire path="M164 267 H324 V335 H308" arrowId={arrowId} />
      <VisionFlowCells x={20} y={318} rows={[products]} cellWidth={96} label="Shown coordinate products" />
      <text x="20" y="392">… plus 5 other terms, then ÷ √8</text>
      <VisionFlowWire path="M308 335 H332 V421 H300" arrowId={arrowId}/>
      <rect x="28" y="404" width="272" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="427" textAnchor="middle">Σ all 8 products, then ÷ √8</text>
      <VisionFlowWire path="M164 438 H7 V494 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={477} rows={[[read.scores[source]]]} cellWidth={96} label="Full scaled score"/>
      <VisionFlowWire path="M116 494 H164 V542" arrowId={arrowId}/>
      <rect x="20" y="542" width="288" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="565" textAnchor="middle">Normalize with all 17 scores</text>
      <VisionFlowWire path="M164 576 H7 V639 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={622} rows={[[read.shares[source]]]} cellWidth={96} label="This source's normalized weight"/>
      <VisionFlowCells x={20} y={726} rows={[read.values[source].slice(0,3)]} cellWidth={96} label="Returned value: first 3 of 8" />
      <VisionFlowWire path="M164 760 V806" arrowId={arrowId} />
      <VisionFlowWire path="M116 639 H324 V823 H195" arrowId={arrowId} />
      <rect x="133" y="806" width="62" height="34" fill="none" stroke={colors.operation} />
      <text x="164" y="829" textAnchor="middle">×</text>
      <VisionFlowWire path="M164 840 H333 V913 H308" arrowId={arrowId} />
      <VisionFlowCells x={20} y={896} rows={[read.contributions[source].slice(0,3)]} cellWidth={96} label="This source's weighted contribution" />
      <VisionFlowCells x={20} y={1000} rows={[other]} cellWidth={96} label="Sum of other 16 contributions"/>
      <VisionFlowWire path="M308 913 H324 V1117 H181" arrowId={arrowId}/>
      <VisionFlowWire path="M164 1034 V1100" arrowId={arrowId}/>
      <circle cx="164" cy="1117" r="17" fill="none" stroke={colors.operation} />
      <text x="164" y="1122" textAnchor="middle">+</text>
      <VisionFlowWire path="M164 1134 H7 V1215 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={1198} rows={[read.output.slice(0,3)]} cellWidth={96} label="Actual all-source mixed output" />
      <text x="20" y="1300">Each output includes 17 sources.</text>
      <text x="20" y="1330">The full 8-coordinate table follows.</text>
      <text x="20" y="1380">Key matches; value carries content.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionNativeAssemblyDrawing({ trace, state, slot = 5 }) {
  const source=trace.order[slot],position=trace.positionIndices[slot];
  return <VisionFlowDrawing width={340} height={890} label={`Current patch slot ${slot} uses original projected patch ${source} and learned position ${position}. Their actual vectors add to the corresponding sequence row. A separate learned CLS workspace and learned CLS position produce row 0. Each shown vector is a three-coordinate cutaway of width 32.`}>
    {arrowId=><>
      <VisionFlowCells x={20} y={62} rows={[trace.projected[source].slice(0,3)]} cellWidth={96} label={`Projected original patch ${source}: 3 of 32`} />
      <VisionFlowCells x={20} y={158} rows={[state.patch_position[0][position].slice(0,3)]} cellWidth={96} label={`Learned position ${position}: 3 of 32`} role="parameter" />
      <VisionFlowWire path="M308 79 H324 V240 H198" arrowId={arrowId}/>
      <VisionFlowWire path="M164 192 V223" arrowId={arrowId}/>
      <rect x="130" y="223" width="68" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="246" textAnchor="middle">+</text>
      <VisionFlowWire path="M164 257 H7 V324 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={307} rows={[trace.assembly[slot+1].slice(0,3)]} cellWidth={96} label={`Assembled sequence row ${slot+1}`} />
      <VisionFlowCells x={20} y={428} rows={[state.cls[0][0].slice(0,3)]} cellWidth={96} label="Learned CLS workspace: 3 of 32" role="parameter" />
      <VisionFlowCells x={20} y={525} rows={[state.cls_position[0][0].slice(0,3)]} cellWidth={96} label="Learned CLS position: 3 of 32" role="parameter" />
      <VisionFlowWire path="M308 445 H324 V607 H198" arrowId={arrowId}/>
      <VisionFlowWire path="M164 559 V590" arrowId={arrowId}/>
      <rect x="130" y="590" width="68" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="613" textAnchor="middle">+</text>
      <VisionFlowWire path="M164 624 H7 V691 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={674} rows={[trace.assembly[0].slice(0,3)]} cellWidth={96} label="Assembled sequence row 0: CLS" />
      <text x="20" y="769">16 patch rows + CLS = 17 rows</text>
      <text x="20" y="800">Every row has 32 coordinates.</text>
      <text x="20" y="837">The full current table is below.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionSlotIdentityDrawing({ trace }) {
  return <VisionFlowDrawing width={340} height={475} label="Each of 16 current patch slots explicitly names its original content source and learned position identity. Original IDs are metadata attached to their vectors, never numerical Q/K/V coordinates.">
    <text x="20" y="25">Current slot grid: row-major listing</text>
    <text x="20" y="50">C = original content; P = position</text>
    {trace.order.map((source,slot)=><g key={slot}>
      <rect x={20+slot%4*76} y={91+Math.floor(slot/4)*76} width="76" height="76" fill="#0a0a0a" stroke={colors.forward}/>
      <text x={58+slot%4*76} y={116+Math.floor(slot/4)*76} textAnchor="middle" fill={colors.input}>C{source}</text>
      <text x={58+slot%4*76} y={147+Math.floor(slot/4)*76} textAnchor="middle" fill={colors.parameter}>P{trace.positionIndices[slot]}</text>
    </g>)}
    <text x="20" y="444">CLS stays in sequence row 0.</text>
  </VisionFlowDrawing>;
}
