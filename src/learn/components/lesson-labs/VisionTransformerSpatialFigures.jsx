import { flowNumber } from './LessonFlow.jsx';
import { VisionFlowCells, VisionFlowDrawing, VisionFlowWire, visionFlowColors as colors } from './VisionTransformerFlowFigures.jsx';

function SpatialGrid({ x = 58, y, side = 6, values, cell = 42, label, selected = -1, support = null, role = 'input' }) {
  return <g>
    <text x="20" y={y-39} fill={colors[role]}>{label}</text>
    {Array.from({ length:side }, (_, coordinate) => <g key={coordinate}>
      <text x={x + (coordinate+.5)*cell} y={y-12} textAnchor="middle">{coordinate}</text>
      <text x={x-15} y={y+(coordinate+.5)*cell+5} textAnchor="middle">{coordinate}</text>
    </g>)}
    {values.map((value,index) => <g key={index}>
      <rect x={x+index%side*cell} y={y+Math.floor(index/side)*cell} width={cell} height={cell}
        fill={support?.[index] > 0 ? '#252525' : '#0a0a0a'} stroke={selected===index ? 'white' : colors[role]}
        strokeWidth={selected===index ? 3 : 1} />
      <text x={x+(index%side+.5)*cell} y={y+(Math.floor(index/side)+.5)*cell+5}
        textAnchor="middle" fill={colors.text}>{typeof value === 'number' ? flowNumber(value,2) : value}</text>
    </g>)}
  </g>;
}

function uniformShareLabel(value) {
  if (value===0) return '0';
  for (let denominator=1;denominator<=1296;denominator+=1) {
    const numerator=Math.round(value*denominator);
    if (Math.abs(value-numerator/denominator)<1e-12) return denominator===1 ? String(numerator) : `${numerator}/${denominator}`;
  }
  return flowNumber(value,3);
}

export function VisionWindowInfluenceDrawing({ values, influence, destination, source, output, window, shift, layers, wrap }) {
  const shares = influence[destination];
  return <VisionFlowDrawing width={340} height={1060}
    label={`Current six-by-six uniform window example with window side ${window}, shift ${shift}, ${layers} completed reads. Source and receiver coordinates, every current value and every composed coefficient are shown; ${wrap ? 'cyclic wrap is deliberately allowed' : 'cross-edge wrap is excluded'}.`}>
    {arrowId => <>
      <SpatialGrid y={88} values={values} selected={source} support={shares} label="Source values; white = edited source" />
      <text x="20" y="371">Grey = source can reach receiver</text>
      <text x="20" y="396">Room side {window}; shifted side {shift}</text>
      <rect x="20" y="423" width="288" height="38" fill="none" stroke={colors.operation}/>
      <text x="164" y="448" textAnchor="middle">{layers===2?'Mask geometry: compose 2 reads':layers===1?'Mask geometry: one uniform read':'No read: identity coefficients'}</text>
      <VisionFlowWire path="M310 214 H333 V442 H308" arrowId={arrowId}/>
      <VisionFlowWire path="M164 461 H7 V565 H58" arrowId={arrowId}/>
      <SpatialGrid y={544} values={shares.map(uniformShareLabel)} selected={destination} support={shares}
        label={`After ${layers} reads: source coefficients`} role="computed" />
      <text x="20" y="826">White = receiver ({Math.floor(destination/6)},{destination%6})</text>
      <text x="20" y="851">All 36 source terms enter the sum.</text>
      <VisionFlowWire path="M58 214 H7 V880 H147" arrowId={arrowId}/>
      <VisionFlowWire path="M310 670 H325 V880 H181" arrowId={arrowId}/>
      <circle cx="164" cy="880" r="17" fill="none" stroke={colors.operation}/>
      <text x="164" y="885" textAnchor="middle">×</text>
      <VisionFlowWire path="M164 897 H7 V967 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={950} rows={[[values[source], shares[source], values[source]*shares[source]]]}
        cellWidth={96} label="Selected value, share, contribution" />
      <text x="20" y="1030">Full receiver sum = {flowNumber(output[destination],4)}</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionUniformTwoHopDrawing() {
  const sources = Array.from({length:16},(_,index)=>index);
  return <VisionFlowDrawing width={340} height={1030} label="A four-by-four interior uniform example: receiver (2,2) reads four first-layer room outputs, each of which mixed four distinct original sources. Every original source reaches the final receiver with coefficient 1/16.">
    {arrowId => <>
      <SpatialGrid y={95} side={4} cell={54} values={sources} selected={10}
        label="Original source IDs: metadata only" />
      {[0,2].flatMap(row => [0,2].map(column => <rect key={`${row}-${column}`}
        x={58+column*54} y={95+row*54} width="108" height="108" fill="none" stroke="white" strokeWidth="3" />))}
      <text x="20" y="353">Each room: four equal shares</text>
      <VisionFlowWire path="M166 311 H7 V483 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={466} rows={[[.25,.25,.25,.25]]} cellWidth={76}
        label="First read within each room" />
      <VisionFlowWire path="M324 483 H334 V665 H183" arrowId={arrowId} />
      <VisionFlowCells x={20} y={593} rows={[[.25,.25,.25,.25]]} cellWidth={76}
        label="Second read: independent shares" />
      <VisionFlowWire path="M166 627 V648" arrowId={arrowId} />
      <circle cx="166" cy="665" r="17" fill="none" stroke={colors.operation}/>
      <text x="166" y="670" textAnchor="middle">×</text>
      <VisionFlowWire path="M149 665 H7 V760 H58" arrowId={arrowId}/>
      <SpatialGrid y={733} side={4} cell={54} x={58} values={Array(16).fill('1/16')}
        label="Composed shares: 1/4 × 1/4" role="computed" />
      <text x="20" y="989">16 sources × 1/16; shares sum to 1</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionRelativeBiasDrawing({ bias, destination, values, weights, output, wrap, source }) {
  const legal = weights[destination].map((weight,index)=>({index,weight})).filter(record=>record.weight>0);
  const receiverRow=Math.floor(destination/6), receiverColumn=destination%6;
  const local=index=>[(Math.floor(index/6)-1+6)%6%2,(index%6-1+6)%6%2];
  const receiverLocal=local(destination);
  const lookups=legal.map(record=>{
    const sourceLocal=local(record.index);
    const dr=receiverLocal[0]-sourceLocal[0],dc=receiverLocal[1]-sourceLocal[1];
    return {...record,dr,dc,score:bias[dr+1][dc+1]};
  });
  const maximum=Math.max(...lookups.map(record=>record.score));
  const amounts=lookups.map(record=>Math.exp(record.score-maximum));
  const total=amounts.reduce((a,b)=>a+b,0);
  return <VisionFlowDrawing width={340} height={1660} label="The current legal source IDs remain metadata. Query-minus-key offsets in the shifted room select actual learned bias entries. Their exponential amounts share one explicit sum and divisor, then read weights multiply actual source values and sum. Forbidden sources never enter the denominator.">
    {arrowId => <>
      <VisionFlowCells x={20} y={60} rows={bias} cellWidth={96} label="Bias: rows Δr; columns Δc = −1,0,1" role="parameter" />
      <text x="20" y="196">Receiver ({receiverRow},{receiverColumn}); room ({receiverLocal.join(',')})</text>
      <text x="20" y="222">Δ = query room coordinate − key</text>
      <text x="20" y="248">Columns: source ID, Δr, Δc, bias</text>
      <VisionFlowCells x={20} y={290} rows={lookups.map(row=>[row.index,row.dr,row.dc,row.score])}
        cellWidth={76} label="Actual legal-source lookups" />
      <VisionFlowWire path="M308 111 H332 V466 H298" arrowId={arrowId}/>
      <VisionFlowWire path={`M172 ${290+lookups.length*34} V449`} arrowId={arrowId}/>
      <rect x="30" y="449" width="268" height="34" fill="none" stroke={colors.operation}/>
      <text x="164" y="472" textAnchor="middle">exp(each bias − maximum)</text>
      <VisionFlowWire path="M164 483 H7 V553 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={536} rows={lookups.map((row,index)=>[row.score,amounts[index]])}
        cellWidth={120} label="Legal score and exponential amount" />
      <text x="20" y="712">Maximum: {flowNumber(maximum,4)}</text>
      <VisionFlowWire path={`M200 ${536+lookups.length*34} V754 H147`} arrowId={arrowId}/>
      <circle cx="164" cy="754" r="17" fill="none" stroke={colors.operation}/>
      <text x="164" y="759" textAnchor="middle">Σ</text>
      <VisionFlowWire path="M164 771 H7 V840 H116" arrowId={arrowId}/>
      <VisionFlowCells x={116} y={823} rows={[[total]]} cellWidth={96} label="Shared legal exp sum" />
      <VisionFlowWire path={`M260 ${536+lookups.length*17} H331 V932 H264`} arrowId={arrowId}/>
      <VisionFlowWire path="M164 857 V913" arrowId={arrowId}/>
      <rect x="64" y="913" width="200" height="38" fill="none" stroke={colors.operation}/>
      <text x="164" y="938" textAnchor="middle">Each amount ÷ sum</text>
      <VisionFlowWire path="M164 951 H7 V1021 H20" arrowId={arrowId}/>
      <VisionFlowCells x={20} y={1004} rows={lookups.map(row=>[row.index,row.weight])} cellWidth={120} label="Source ID; normalized weight" />
      <SpatialGrid y={1230} values={values} selected={source} support={weights[destination]}
        label="Values; grey legal, white edited" />
      <VisionFlowWire path={`M260 ${1004+lookups.length*17} H332 V1540 H290`} arrowId={arrowId}/>
      <VisionFlowWire path="M184 1482 V1521" arrowId={arrowId}/>
      <rect x="38" y="1521" width="252" height="38" fill="none" stroke={colors.operation}/>
      <text x="164" y="1546" textAnchor="middle">Σ(weight × source value)</text>
      <text x="20" y="1613">Full sum: {flowNumber(output[destination],4)}</text>
      <text x="20" y="1639">{wrap?'Diagnostic: cyclic wrap allowed':'Hard mask excludes wrapped edges'}</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionPatchMergeDrawing() {
  const vectors=[[1,2],[5,6],[3,4],[7,8]];
  const joined=vectors.flat();
  const mean=joined.reduce((a,b)=>a+b,0)/8;
  const divisor=Math.sqrt(joined.reduce((a,b)=>a+(b-mean)**2,0)/8+1e-5);
  const normalized=joined.map(value=>(value-mean)/divisor);
  const maps=[[1,0,0,0,1,0,0,0],[0,1,0,0,0,1,0,0],[0,0,1,0,0,0,1,0],[0,0,0,1,0,0,0,1]];
  const output=maps.map(row=>row.reduce((total,value,i)=>total+value*normalized[i],0));
  return <VisionFlowDrawing width={340} height={1030} label="Four actual neighboring two-coordinate records concatenate in TL,BL,TR,BR order, normalize across eight coordinates, and enter a stipulated four-by-eight learned reduction map. Spatial resolution halves while feature width doubles.">
    {arrowId => <>
      {vectors.map((row,index)=> <VisionFlowCells key={index} x={20+(index>1?164:0)} y={65+(index%2)*95}
        rows={[row]} cellWidth={68} label={['TL','BL','TR','BR'][index]} />)}
      <VisionFlowWire path="M152 194 V246 H170" arrowId={arrowId} />
      <VisionFlowWire path="M304 194 V246 H204" arrowId={arrowId} />
      <VisionFlowWire path="M152 82 H163 V224 H180 V229" arrowId={arrowId} />
      <VisionFlowWire path="M320 82 H330 V224 H194 V229" arrowId={arrowId} />
      <circle cx="187" cy="246" r="17" fill="none" stroke={colors.operation} />
      <text x="187" y="251" textAnchor="middle">∥</text>
      <VisionFlowWire path="M187 263 H7 V327 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={310} rows={[joined.slice(0,4),joined.slice(4)]} cellWidth={76}
        label="One row of 8; wrapped for display" />
      <VisionFlowWire path="M172 378 V423" arrowId={arrowId} />
      <rect x="104" y="423" width="136" height="34" fill="none" stroke={colors.operation} />
      <text x="172" y="446" textAnchor="middle">LN 8 values</text>
      <VisionFlowWire path="M172 457 H7 V524 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={507} rows={[normalized.slice(0,4),normalized.slice(4)]} cellWidth={76}
        label="Gain 1, offset 0, ε=0.00001" />
      <VisionFlowCells x={20} y={634} rows={maps.map(row=>row.slice(0,4))} cellWidth={76}
        label="Reduction W: first 4 of 8 columns" role="parameter" />
      <text x="20" y="799">… other columns equal these four</text>
      <VisionFlowWire path="M324 541 H334 V854 H224" arrowId={arrowId} />
      <VisionFlowWire path="M172 770 H333 V854 H224" arrowId={arrowId} />
      <rect x="120" y="837" width="104" height="34" fill="none" stroke={colors.operation} />
      <text x="172" y="860" textAnchor="middle">W × row</text>
      <VisionFlowWire path="M172 871 H7 V941 H20" arrowId={arrowId} />
      <VisionFlowCells x={20} y={924} rows={[output]} cellWidth={76} label="One new spatial row, width 4" />
      <text x="20" y="1000">Example coefficients are stipulated.</text>
    </>}
  </VisionFlowDrawing>;
}

export function VisionTwoHopPathsDrawing({ first, second, source, destination }) {
  const routes=first.map((row,intermediate)=>[intermediate,row[source],second[destination][intermediate],row[source]*second[destination][intermediate]])
    .filter(row=>row[3]>0);
  const coefficient=routes.reduce((total,row)=>total+row[3],0);
  const height=420+routes.length*34;
  return <VisionFlowDrawing width={340} height={height} label={`Every nonzero two-hop path from original source ${source} through an intermediate row to receiver ${destination}. Each path multiplies its two actual weights, then all paths add. Zero-weight paths are omitted explicitly.`}>
    {arrowId=><>
      <text x="20" y="25">Original source {source} → receiver {destination}</text>
      <text x="20" y="50">Rows below: nonzero paths only</text>
      <text x="20" y="94">Columns: middle ID, first share,</text>
      <text x="20" y="119">second share, their product</text>
      <VisionFlowCells x={20} y={162} rows={routes.length?routes:[['none','—','—',0]]} cellWidth={76} label="Actual current paths" />
      <VisionFlowWire path={`M172 ${162+Math.max(1,routes.length)*34} V${223+Math.max(1,routes.length)*34}`} arrowId={arrowId} />
      <circle cx="172" cy={240+Math.max(1,routes.length)*34} r="17" fill="none" stroke={colors.operation} />
      <text x="172" y={245+Math.max(1,routes.length)*34} textAnchor="middle">Σ</text>
      <VisionFlowWire path={`M172 ${257+Math.max(1,routes.length)*34} H7 V${325+Math.max(1,routes.length)*34} H124`} arrowId={arrowId} />
      <VisionFlowCells x={124} y={308+Math.max(1,routes.length)*34} rows={[[coefficient]]} cellWidth={96} label="Full source coefficient" />
    </>}
  </VisionFlowDrawing>;
}
