import { useId } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { blockOccupancy, causalEdges, graphReach, featureMemory, randomFeatureRead, sparseRead } from '../../data/sparse-attention-models.js';
import { sparseOpeningRead, sparseNystromTrace, sparseFeatureMemory } from '../../data/sparse-attention-reading-traces.js';
import examples from '../../data/sparse-attention-examples.json';
import './sparse-attention-flow.css';

export const sparseColors = {
  input: '#77cddb', parameter: '#e4b752', computed: '#be9cf5',
  operation: '#e8e6df', edge: '#99978f', backward: '#eda064',
};
export const sparseVector = (row, digits = 5) => row == null ? 'undefined' : `[${row.map(value => number(value, digits)).join(', ')}]`;

export function SparseDrawing({ label, width = 340, height, children }) {
  const id = useId();
  return <figure className="sparse-flow-drawing">
    <span className={`sparse-flow-scroll-hint${width <= 340 ? ' sparse-flow-scroll-hint--small' : ''}`}>This connected drawing can scroll sideways. Focus it and use the arrow keys to inspect every labelled part.</span>
    <div className="sparse-flow-scroll" tabIndex={0} role="region" aria-label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id} style={{ minWidth: width, width, maxWidth: width }}>
        <title id={id}>{label}</title>{children}
      </svg>
    </div>
  </figure>;
}

export function SparseText({ x, y, children, role = 'operation', anchor = 'middle', size = 15 }) {
  return <text x={x} y={y} fill={sparseColors[role]} textAnchor={anchor} fontSize={size}>{children}</text>;
}

export function SparseCells({ x, y, values, label, role = 'computed', columnRoles, width = 92, height = 40, digits = 5, rowLabels, selectedRow = null }) {
  const rows = Array.isArray(values[0]) ? values : [values];
  return <g>
    {label && <SparseText x={x + rows[0].length * width / 2} y={y - 17} role={role}>{label}</SparseText>}
    {rowLabels?.map((name, row) => <SparseText key={row} x={x - 9} y={y + row * height + 26} anchor="end">{name}</SparseText>)}
    {rows.map((row, i) => row.map((value, j) => <g key={`${i}:${j}`}>
      <rect x={x + j * width} y={y + i * height} width={width} height={height}
        fill={typeof value === 'number' && value !== 0 ? '#e8e6df0c' : 'none'}
        stroke={i === selectedRow ? '#ffffff' : sparseColors[columnRoles?.[j] ?? role]} strokeWidth={i === selectedRow ? 2 : 1}/>
      <SparseText x={x + (j + .5) * width} y={y + i * height + 26}>{typeof value === 'number' ? number(value, digits) : value}</SparseText>
    </g>))}
  </g>;
}

export function SparseArrow({ path, x1, y1, x2, y2, backward = false, masked = false }) {
  const id = useId(), color = backward ? sparseColors.backward : sparseColors.edge;
  return <g>
    <defs><marker id={id} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L7 3.5 L0 7" fill={color}/></marker></defs>
    <path d={path ?? `M${x1} ${y1} L${x2} ${y2}`} fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray={backward || masked ? '5 4' : undefined} markerEnd={`url(#${id})`}/>
  </g>;
}

export function SparseOperation({ x, y, symbol, width = 38, height = 34 }) {
  return <g><rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={3} fill="none" stroke={sparseColors.edge}/>
    <SparseText x={x} y={y + 5}>{symbol}</SparseText></g>;
}

export function SparseDeterministicFeatureDrawing() {
  const signed = [0, 1, 1, 0], neighbor = [1, 1, 0, 0], features = [0, 1, 0, 0];
  return <SparseDrawing height={1530} label="Four sign quadrants map to four distinct product-feature directions; one cyclic shift of rectified signed coordinates is shown for key minus one, one">
    <SparseText x={170} y={24}>Two input coordinates, four quadrants.</SparseText>
    <SparseArrow x1={36} y1={176} x2={310} y2={176}/><SparseArrow x1={170} y1={312} x2={170} y2={48}/>
    <SparseText x={313} y={198} role="input">k₁</SparseText><SparseText x={190} y={52} role="input">k₂</SparseText>
    {[[245,101,'[1, 1]'],[95,101,'[−1, 1]'],[95,251,'[−1, −1]'],[245,251,'[1, −1]']].map(([x,y,label],i)=><g key={label}>
      <circle cx={x} cy={y} r={6} fill={sparseColors.input} stroke={i===1?'white':'none'} strokeWidth={2}/>
      <SparseText x={x} y={y-16} role="input">{label}</SparseText>
    </g>)}
    <SparseArrow path="M95 107 V344 H170 V380"/>
    <SparseText x={170} y={366}>Trace the white-marked [−1, 1].</SparseText>
    <SparseOperation x={170} y={399} symbol="r([k, −k])" width={148}/>
    <SparseText x={170} y={439}>r(a) keeps max(a, 0).</SparseText>
    <SparseArrow x1={170} y1={416} x2={170} y2={489}/>
    <SparseCells x={38} y={489} width={66} values={signed} label="u: rectified signed coordinates"/>
    <SparseArrow path="M302 509 H325 V579 H244"/><SparseOperation x={170} y={579} symbol="Next cyclic entry" width={164}/>
    <SparseArrow x1={170} y1={596} x2={170} y2={669}/>
    <SparseCells x={38} y={669} width={66} values={neighbor} label="Next entries: [u₁, u₂, u₃, u₀]"/>
    {signed.map((_,i)=><g key={i}>
      <SparseArrow path={`M${71+66*i} 529 H${42+66*i} V770 H${52+66*i}`}/>
      <SparseArrow x1={71+66*i} y1={709} x2={71+66*i} y2={753}/>
      <SparseOperation x={71+66*i} y={770} symbol="×"/>
      <SparseArrow x1={71+66*i} y1={787} x2={71+66*i} y2={879}/>
    </g>)}
    <SparseCells x={38} y={879} width={66} values={features} label="Four product features"/>
    <SparseText x={170} y={957}>Same rule for each quadrant:</SparseText>
    <SparseCells x={42} y={1020} width={64} values={[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}
      rowLabels={['++','−+','−−','+−']} label="One direction per input quadrant"/>
    {['++','−+','−−','+−'].map((label,i)=><SparseText key={label} x={74+64*i} y={1208}>{label}</SparseText>)}
    <SparseText x={170} y={1250}>Column order follows cyclic products.</SparseText>
    <SparseCells x={42} y={1340} width={64} values={[[1,0,0,0],[0,0,0,0]]}
      rowLabels={['A','B']}/><SparseText x={170} y={1300}>A: [2,.5] has the same ++ features.</SparseText><SparseText x={170} y={1325}>B: [1,0] has no pair product.</SparseText>
    <SparseText x={170} y={1468}>Different quadrants separate here.</SparseText>
    <SparseText x={170} y={1503}>Not every original key stays distinct.</SparseText>
  </SparseDrawing>;
}

export function SparseOpeningDrawing() {
  const read = sparseOpeningRead();
  return <SparseDrawing label="One supplied query matches three supplied keys; explicit exponentials, their shared sum and per-source division produce weights whose value products sum to 1.75" height={1840}>
    <SparseCells x={45} y={50} values={read.query} role="input" label="Receiving query"/>
    <SparseCells x={210} y={50} values={read.keys} role="input" label="Source keys" rowLabels={['0', '1', '2']}/>
    <SparseArrow path="M91 90 V211 H151"/><SparseArrow path="M256 170 V211 H189"/>
    <SparseOperation x={170} y={211} symbol="×"/>
    <SparseText x={170} y={255}>Multiply matching coordinates.</SparseText>
    <SparseArrow x1={170} y1={229} x2={170} y2={298}/>
    <SparseCells x={104} y={298} values={read.products} width={132} label="One product per source" rowLabels={['0', '1', '2']}/>
    <SparseArrow x1={170} y1={418} x2={170} y2={468}/>
    <SparseOperation x={170} y={485} symbol="÷ 1" width={82}/>
    <SparseText x={170} y={526}>One coordinate: scale is one.</SparseText>
    <SparseArrow x1={170} y1={502} x2={170} y2={571}/>
    <SparseCells x={104} y={571} values={read.scores.map(score=>[score])} width={132} label="Scores" rowLabels={['0','1','2']}/>
    <SparseArrow x1={170} y1={691} x2={170} y2={734}/><SparseOperation x={170} y={751} symbol="exp" width={76}/>
    <SparseArrow x1={170} y1={768} x2={170} y2={816}/><SparseCells x={104} y={816} values={read.exponentials.map(amount=>[amount])} width={132} label="Positive amounts" rowLabels={['0','1','2']}/>
    <SparseArrow x1={170} y1={936} x2={170} y2={990}/><SparseOperation x={170} y={1007} symbol="Σ"/>
    <SparseArrow x1={170} y1={1024} x2={170} y2={1063}/><SparseCells x={104} y={1063} values={[4]} width={132} label="Shared total: 2 + 1 + 1"/>
    <SparseArrow x1={170} y1={1103} x2={170} y2={1163}/><SparseArrow path="M236 876 H308 V1180 H223"/>
    <SparseOperation x={170} y={1180} symbol="Each ÷ total" width={106}/>
    <SparseArrow x1={170} y1={1197} x2={170} y2={1250}/><SparseCells x={104} y={1250} values={read.weights.map(weight=>[weight])} width={132} label="Normalized weights" rowLabels={['0','1','2']}/>
    <SparseCells x={30} y={1450} values={read.values.map((row, record) => [read.weights[record], row[0], read.contributions[record][0]])} width={92} columnRoles={['computed','input','computed']} rowLabels={['0','1','2']}/>
    {['Weight','Message','Product'].map((label,i)=><SparseText key={label} x={76+92*i} y={1431} role={i===1?'input':'computed'}>{label}</SparseText>)}
    <SparseArrow path="M170 1370 V1399 H76 V1450"/>
    <SparseText x={170} y={1611}>Multiply each weight × message.</SparseText>
    <SparseArrow path="M306 1510 H325 V1670 H189"/><SparseOperation x={170} y={1670} symbol="Σ"/>
    <SparseArrow x1={170} y1={1687} x2={170} y2={1750}/><SparseCells x={104} y={1750} values={read.output} width={132} label="Returned answer"/>
  </SparseDrawing>;
}

export function SparseDeletionDrawing({ scores = [Math.log(2), 0, 0], values = [[2], [-1], [4]], legal = [true, true, false] }) {
  const read = sparseRead(scores, values, legal), count = scores.length, rowHeight = 44;
  const valueColumns = values[0].length;
  const productsY = 180 + count * rowHeight;
  const finalY = productsY + count * rowHeight + 128;
  const rows = scores.map((score, record) => [record, legal[record] ? 'yes' : '×', read.denseWeights[record], read.weights?.[record] ?? '—']);
  return <SparseDrawing width={560} height={finalY + 100} label="Removing a source changes the denominator and all retained weights; each signed message is multiplied by its new share">
    <SparseText x={280} y={25}>Same source records, changed support.</SparseText>
    <SparseCells x={32} y={82} values={rows} width={94}/>
    {['Source', 'Retain?', 'Full share', 'New share'].map((label, i) => <SparseText key={label} x={79 + 94 * i} y={63}>{label}</SparseText>)}
    <SparseText x={280} y={120 + count * rowHeight}>Removed full share: {number(read.removedMass, 6)}.</SparseText>
    <SparseCells x={40} y={productsY} values={values} width={84} role="input" label="Actual messages" rowLabels={scores.map((_, i) => String(i))}/>
    <SparseArrow path={`M408 ${82 + count * 40 - 20} H540 V${productsY - 55} H260 V${productsY + 3}`}/>
    <SparseArrow x1={40 + valueColumns * 84} y1={productsY + 20} x2={241} y2={productsY + 20}/>
    <SparseOperation x={260} y={productsY + 20} symbol="×"/>
    <SparseArrow x1={279} y1={productsY + 20} x2={330} y2={productsY + 20}/>
    <SparseCells x={330} y={productsY} values={read.contributions ?? values.map(row => row.map(() => '—'))} width={92} label="Weighted messages"/>
    <SparseArrow path={`M422 ${productsY + count * 40} V${finalY - 60} H299`}/>
    <SparseOperation x={280} y={finalY - 60} symbol="Σ"/>
    <SparseArrow x1={280} y1={finalY - 43} x2={280} y2={finalY}/>
    <SparseCells x={280 - valueColumns * 92 / 2} y={finalY} values={read.output ?? values[0].map(() => 'undefined')} width={92} label="Selected answer"/>
  </SparseDrawing>;
}

export function SparseLayerDrawing({ mask, source, target, layers = 2, label = 'Possible source-to-receiver dependence through successive layers' }) {
  const reach = graphReach(mask, source, layers), path = reach.paths[target];
  const width = Math.max(340, 130 * (layers + 1)), height = 96 + mask.length * 34;
  const x = layer => 36 + layer * (width - 72) / layers, y = position => 60 + position * 34;
  return <SparseDrawing label={label} width={width} height={height}>
    {Array.from({ length: layers }, (_, layer) => <g key={layer}>
      {mask.flatMap((row, receiver) => row.map((allowed, record) => allowed || receiver === record
        ? <line key={`${receiver}:${record}`} x1={x(layer)} y1={y(record)} x2={x(layer + 1)} y2={y(receiver)} stroke={sparseColors.edge} opacity={0.12}/>
        : null))}
    </g>)}
    {path && path.slice(1).map((position, layer) => <SparseArrow key={layer} x1={x(layer) + 12} y1={y(path[layer])} x2={x(layer + 1) - 13} y2={y(position)}/>)}
    {reach.stages.map((stage, layer) => <g key={layer}>
      <SparseText x={x(layer)} y={24}>{layer === 0 ? 'Input' : `Layer ${layer}`}</SparseText>
      {stage.map((reachable, position) => <g key={position}>
        <circle cx={x(layer)} cy={y(position)} r={12} fill={reachable ? '#be9cf51a' : 'none'} stroke={path?.[layer] === position ? '#ffffff' : layer === 0 ? sparseColors.input : sparseColors.computed} strokeWidth={path?.[layer] === position ? 2 : 1}/>
        <SparseText x={x(layer)} y={y(position) + 5}>{position}</SparseText>
      </g>)}
    </g>)}
    <SparseText x={width / 2} y={height - 11}>{path ? `Traced path: ${path.join(' → ')}` : `No ${layers}-layer route from ${source} to ${target}`}</SparseText>
  </SparseDrawing>;
}

export function SparseHubDrawing() {
  return <div className="sparse-flow-independent-scenes">
    <div><p>Encoder: two-way local edges and hub 6; no causal guarantee.</p>
      <SparseLayerDrawing mask={Array.from({length:12},(_,receiver)=>Array.from({length:12},(_,source)=>Math.abs(receiver-source)<3||receiver===6||source===6))} source={11} target={2} label="Bidirectional encoder: source 11 reaches receiver 2 through global hub 6 in two layers; this is deliberately not a causal decoder"/>
    </div>
    {[-1, 6, 0].map(hub => <div key={hub}>
      <p>{hub < 0 ? 'Only a three-key causal window.' : `The same window with causal hub ${hub}.`}</p>
      <SparseLayerDrawing mask={causalEdges(12, 3, hub)} source={2} target={11}/>
    </div>)}
  </div>;
}

export function SparsePermissionDrawing({ mask, receiver = -1, source = -1, block = 1 }) {
  const cell = 40, width = Math.max(340, mask.length * cell + 90), height = mask.length * cell + 120;
  return <SparseDrawing width={width} height={height} label="Permission matrix: rows receive information, columns supply source records; a dot permits a connection and a cross excludes it">
    <SparseText x={50 + mask.length * cell / 2} y={20}>Source record columns</SparseText>
    {mask.map((_, column) => <SparseText key={column} x={70 + column * cell} y={49}>{column}</SparseText>)}
    {mask.map((row, i) => <g key={i}>
      <SparseText x={35} y={86 + i * cell} anchor="end">{i}</SparseText>
      {row.map((allowed, j) => <g key={j}>
        <rect x={50 + j * cell} y={60 + i * cell} width={cell} height={cell} fill={allowed ? '#77cddb12' : 'none'}
          stroke={i === receiver && j === source ? '#ffffff' : sparseColors.edge} strokeWidth={i === receiver && j === source ? 3 : 1}/>
        <SparseText x={70 + j * cell} y={86 + i * cell} role={allowed ? 'input' : 'operation'}>{allowed ? '●' : '×'}</SparseText>
      </g>)}
    </g>)}
    {block > 1 && Array.from({ length: mask.length / block + 1 }, (_, boundary) => <g key={boundary}>
      <line x1={50 + boundary * block * cell} y1={60} x2={50 + boundary * block * cell} y2={60 + mask.length * cell} stroke="#ffffff" strokeWidth={2}/>
      <line x1={50} y1={60 + boundary * block * cell} x2={50 + mask.length * cell} y2={60 + boundary * block * cell} stroke="#ffffff" strokeWidth={2}/>
    </g>)}
    <SparseText x={width / 2} y={height - 35}>Rows receive; columns supply.</SparseText>
    <SparseText x={width / 2} y={height - 12}>White border marks the edited cell.</SparseText>
  </SparseDrawing>;
}

export function SparseTilesDrawing({ mask, size = 2, receiver = 0, source = 0 }) {
  const count = blockOccupancy(mask, size);
  const tileIds = count.tiles.flatMap((row, blockRow) => row.flatMap((occupied, blockColumn) => occupied ? [[blockRow, blockColumn]] : []));
  return <>
    <SparsePermissionDrawing mask={mask} receiver={receiver} source={source} block={size}/>
    <SparseDrawing label="Each occupied block has a real row/column metadata pair; all cells in that block are candidate work even when some connections are forbidden" width={400} height={Math.max(230, 190 + tileIds.length * 40)}>
      <SparseText x={200} y={25}>{size} × {size} cells per block.</SparseText>
      <SparseText x={200} y={57}>{count.edges} selected connections.</SparseText>
      {tileIds.length > 0 ? <>
        <SparseCells x={40} y={115} values={tileIds.map(([row, column]) => [row, column, size * size])} width={100}/>
        {['Block row', 'Block col', 'Candidates'].map((name, column) => <SparseText key={name} x={90 + column * 100} y={96}>{name}</SparseText>)}
      </> : <SparseText x={200} y={115}>No occupied block; no candidate cells.</SparseText>}
      <SparseText x={200} y={Math.max(200, 115 + tileIds.length * 40 + 45)}>{count.occupied} occupied blocks → {count.candidates} candidate cells.</SparseText>
    </SparseDrawing>
  </>;
}

export function SparseOuterProductDrawing({ keyFeatures = [1, 2], value = [1, -1], record = 0 }) {
  const write = keyFeatures.map(entry => value.map(message => entry * message));
  return <SparseDrawing label={`Record ${record}: each key feature multiplies every message coordinate to make a feature-by-message matrix write`} height={440}>
    <SparseCells x={30} y={55} values={keyFeatures.map(entry => [entry])} width={92} role="input" label="Key features"/>
    <SparseCells x={150} y={55} values={value} width={84} role="input" label="Message coordinates"/>
    <SparseArrow path={`M76 ${55 + keyFeatures.length * 40} V225 H151`}/>
    <SparseArrow path="M234 95 V225 H189"/>
    <SparseOperation x={170} y={225} symbol="×"/>
    <SparseText x={170} y={268}>Multiply every row × column pair.</SparseText>
    <SparseArrow x1={170} y1={242} x2={170} y2={320}/>
    <SparseCells x={170 - value.length * 84 / 2} y={320} values={write} width={84} label={`Record ${record}'s matrix write`}/>
  </SparseDrawing>;
}

export function SparseMemoryReadDrawing({ query = [2, 1], keys = [[1, 0], [0, 1], [1, 1]], values = [[2], [-1], [3]], selected = keys.length - 1 }) {
  const columns = values[0]?.length ?? 2, read = sparseFeatureMemory(query, keys, values, columns);
  return <SparseDrawing label="The same query reaches the matrix numerator and the separately summed key normalizer; divide only when overlap is positive" width={400} height={940}>
    <SparseCells x={55} y={60} values={read.matrix} width={92} label="Accumulated matrix S"/>
    <SparseCells x={285} y={60} values={read.normalizer.map(value => [value])} width={92} label="Key sum z"/>
    <SparseText x={200} y={181}>{keys.length ? `Both include records 0 through ${selected}.` : 'No records have been included.'}</SparseText>
    <SparseCells x={116} y={242} values={query} width={84} role="input" label="Current query features"/>
    <SparseArrow path="M200 282 V345 H120 V400"/><SparseArrow path="M200 345 H310 V400"/>
    <SparseArrow path={`M97 ${60 + query.length * 40} V345 H102 V417`}/>
    <SparseArrow path={`M327 ${60 + query.length * 40} V370 H328 V417`}/>
    <SparseOperation x={120} y={417} symbol="×"/><SparseOperation x={310} y={417} symbol="×"/>
    <SparseText x={120} y={464}>Query × S rows</SparseText><SparseText x={310} y={464}>Query × z entries</SparseText>
    <SparseArrow x1={120} y1={434} x2={120} y2={518}/><SparseArrow x1={310} y1={434} x2={310} y2={518}/>
    <SparseCells x={120 - columns * 104 / 2} y={518} values={read.matrix.map((row, i) => row.map(value => value * query[i]))} width={104}/>
    <SparseCells x={268} y={518} values={read.normalizer.map((value, i) => [value * query[i]])} width={104}/>
    <SparseArrow x1={120} y1={598} x2={120} y2={627}/><SparseArrow x1={310} y1={598} x2={310} y2={627}/>
    <SparseOperation x={120} y={644} symbol="Σ"/><SparseOperation x={310} y={644} symbol="Σ"/>
    <SparseArrow x1={120} y1={661} x2={120} y2={718}/><SparseArrow x1={310} y1={661} x2={310} y2={718}/>
    <SparseCells x={120 - columns * 104 / 2} y={718} values={read.numerator} width={104} label="Numerator"/>
    <SparseCells x={268} y={718} values={[read.denominator]} width={104} label="Denominator"/>
    <SparseArrow path="M120 758 V800 H181"/><SparseArrow path="M310 758 V800 H219"/>
    <SparseOperation x={200} y={800} symbol="÷"/>
    <SparseArrow x1={200} y1={817} x2={200} y2={876}/>
    <SparseCells x={200 - columns * 104 / 2} y={876} values={read.output ?? Array(columns).fill('undefined')} width={104} label="Returned answer"/>
  </SparseDrawing>;
}

export function SparseMemoryWritesDrawing() {
  const keys = [[1, 0], [0, 1], [1, 1]], values = [[2], [-1], [3]], read = featureMemory([2, 1], keys, values);
  return <>
    <div className="sparse-flow-independent-scenes">{read.history.map((step, record) => <SparseDrawing key={record} height={1050} label={`Write ${record}: the actual matrix contribution adds to prior S, and the same key independently adds to prior z`}>
      <SparseCells x={25} y={55} values={keys[record].map(value => [value])} width={84} role="input" label={`Key ${record}`}/>
      <SparseCells x={230} y={55} values={values[record]} width={84} role="input" label="Message"/>
      <SparseArrow path="M67 135 V179 H151"/><SparseArrow path="M272 95 V179 H189"/>
      <SparseOperation x={170} y={179} symbol="×"/>
      <SparseArrow x1={170} y1={196} x2={170} y2={260}/>
      <SparseCells x={128} y={260} values={step.contribution} width={84} label="Actual matrix write"/>
      <SparseCells x={25} y={400} values={record === 0 ? [[0], [0]] : read.history[record - 1].matrix} width={84} label="Prior S"/>
      <SparseCells x={230} y={400} values={step.contribution} width={84} label="Same write"/>
      <SparseArrow path="M212 300 H330 V360 H272 V400"/>
      <SparseArrow path="M67 480 V540 H151"/><SparseArrow path="M272 480 V540 H189"/>
      <SparseOperation x={170} y={540} symbol="+"/>
      <SparseArrow x1={170} y1={557} x2={170} y2={617}/>
      <SparseCells x={128} y={617} values={step.matrix} width={84} label="New S"/>
      <SparseCells x={25} y={760} values={keys[record].map(value => [value])} width={84} role="input" label="Same key"/>
      <SparseCells x={230} y={760} values={(record === 0 ? [0, 0] : read.history[record - 1].normalizer).map(value => [value])} width={84} label="Prior z"/>
      <SparseArrow path="M25 95 H8 V735 H67 V760"/>
      <SparseArrow path="M67 840 V880 H151"/><SparseArrow path="M272 840 V880 H189"/>
      <SparseOperation x={170} y={880} symbol="+"/>
      <SparseArrow x1={170} y1={897} x2={170} y2={953}/>
      <SparseCells x={128} y={953} values={step.normalizer.map(value => [value])} width={84} label="New z"/>
    </SparseDrawing>)}</div>
    <SparseMemoryReadDrawing/>
  </>;
}

export function SparseProjectionDrawing({ values = [1, 2, 9], coefficients = [.5, 0, .5], position = 0 }) {
  const products = values.map((value, record) => value * coefficients[record]);
  const full = products.reduce((a, b) => a + b, 0), prefix = products.slice(0, position + 1).reduce((a, b) => a + b, 0);
  const y = record => 72 + record * 55, totalY = 145 + values.length * 55;
  return <SparseDrawing label="Length coefficients multiply actual source messages; a full summary receives future records while the separately built prefix summary excludes them" width={500} height={totalY + 180}>
    <SparseCells x={30} y={52} values={values.map((value, record) => [value, coefficients[record], products[record]])} width={100} height={55} rowLabels={values.map((_, i) => String(i))}/>
    {['Message', 'Coefficient', 'Product'].map((label, i) => <SparseText key={label} x={80 + i * 100} y={33} role={i === 2 ? 'computed' : 'input'}>{label}</SparseText>)}
    {values.map((_, record) => <g key={record}>
      <SparseArrow path={`M330 ${y(record)} H${350 + record * 9} V${totalY} H189`} masked={record > position}/>
      {record <= position && <SparseArrow path={`M330 ${y(record)} H${430 + record * 9} V${totalY} H419`}/>}
    </g>)}
    <SparseOperation x={170} y={totalY} symbol="Σ"/><SparseOperation x={400} y={totalY} symbol="Σ"/>
    <SparseArrow x1={170} y1={totalY + 17} x2={170} y2={totalY + 82}/><SparseArrow x1={400} y1={totalY + 17} x2={400} y2={totalY + 82}/>
    <SparseCells x={120} y={totalY + 82} values={[full]} width={100} label="Full summary"/>
    <SparseCells x={350} y={totalY + 82} values={[prefix]} width={100} label={`Prefix through ${position}`}/>
    <SparseText x={250} y={totalY + 158}>Dashed routes originate after the query.</SparseText>
  </SparseDrawing>;
}

export function SparseNystromDrawing() {
  const trace = sparseNystromTrace(examples.nystrom_worked);
  return <SparseDrawing label="The actual landmark factors read from the value side: B times V, signed middle inverse correction, then F times the corrected rows" width={820} height={1050}>
    <SparseCells x={65} y={65} values={trace.back} width={90} label="B: two landmark queries read four keys"/>
    <SparseCells x={555} y={65} values={trace.value} width={90} role="input" label="V: four messages"/>
    <SparseArrow path="M245 145 V278 H391"/><SparseArrow path="M600 225 V278 H429"/>
    <SparseOperation x={410} y={278} symbol="×"/>
    <SparseArrow x1={410} y1={295} x2={410} y2={359}/>
    <SparseCells x={365} y={359} values={trace.first} width={90} label="BV: two aggregate messages"/>
    <SparseCells x={65} y={474} values={trace.inverse} width={108} label="A⁺: signed correction"/>
    <SparseArrow path="M173 554 V609 H391"/><SparseArrow x1={410} y1={439} x2={410} y2={592}/>
    <SparseOperation x={410} y={609} symbol="×"/>
    <SparseArrow x1={410} y1={626} x2={410} y2={687}/>
    <SparseCells x={365} y={687} values={trace.corrected} width={90} label="A⁺(BV): corrected messages"/>
    <SparseCells x={65} y={803} values={trace.front} width={108} label="F: four queries read two landmarks"/>
    <SparseArrow path="M281 883 H340 V931 H391"/><SparseArrow x1={410} y1={767} x2={410} y2={914}/>
    <SparseOperation x={410} y={931} symbol="×"/>
    <SparseArrow x1={429} y1={931} x2={580} y2={931}/>
    <SparseCells x={580} y={870} values={trace.output} width={132} label="Four returned answers"/>
  </SparseDrawing>;
}

export function SparseRandomFeatureDrawing({ input, features = 8, receiver = 3, source = 1 }) {
  const projection = examples.random_features_fresh.projections.slice(0, features);
  const read = randomFeatureRead(input.query, input.keys, input.values, projection);
  const query = input.query[receiver], key = input.keys[source];
  const dot = (left, right) => left.reduce((total, value, i) => total + value * right[i], 0);
  const qDots = projection.map(row => dot(query, row)), kDots = projection.map(row => dot(key, row));
  const qPenalty = dot(query, query) / 2, kPenalty = dot(key, key) / 2;
  const qShift = Math.max(...qDots.map(value => value - qPenalty));
  const qFeatures = read.qPhi[receiver], keyFeatures = read.kPhi[source];
  const products = qFeatures.map((value, i) => value * keyFeatures[i]);
  const first = products.slice(0, 3).reduce((a, b) => a + b, 0);
  const rest = products.slice(3).reduce((a, b) => a + b, 0);
  const amounts = input.keys.map((_, record) => record <= receiver ? dot(qFeatures, read.kPhi[record]) : 0);
  const denominator = amounts.reduce((a, b) => a + b, 0);
  const selectedWeight = denominator > 0 ? amounts[source] / denominator : null;
  const table = projection.slice(0, 3).map((row, sample) => [sample, qDots[sample], kDots[sample], qFeatures[sample], keyFeatures[sample], products[sample]]);
  return <SparseDrawing label="Actual fixed sampled projection rows turn current Q and K into positive coordinates; coordinate products sum into a sampled match, then permitted matches normalize across sources" width={860} height={1080}>
    <SparseCells x={30} y={60} values={projection.slice(0, 3)} width={104} role="input" label={`First 3 of ${features} fixed sample rows`}/>
    <SparseCells x={375} y={60} values={query} width={104} role="input" label={`Scaled query ${receiver}`}/>
    <SparseCells x={615} y={60} values={key} width={104} role="input" label={`Scaled key ${source}`}/>
    <SparseArrow path="M134 180 V246 H441"/><SparseArrow path="M479 100 V229"/><SparseArrow path="M719 100 V246 H517"/>
    <SparseOperation x={479} y={246} symbol="dot" width={76}/>
    <SparseText x={430} y={308}>Subtract half each input's squared length.</SparseText>
    <SparseText x={430} y={338}>Query half-square = {number(qPenalty)}; key half-square = {number(kPenalty)}.</SparseText>
    <SparseText x={430} y={369}>Then subtract one query-local shift {number(qShift)};</SparseText>
    <SparseText x={430} y={398}>all key rows share shift {number(read.commonKeyScale)}.</SparseText>
    <SparseArrow x1={479} y1={263} x2={479} y2={427}/>
    <SparseOperation x={479} y={444} symbol="exp" width={76}/>
    <SparseArrow x1={479} y1={461} x2={479} y2={515}/>
    <SparseCells x={30} y={515} values={table} width={128}/>
    {['Sample', 'ω · query', 'ω · key', 'Query feature', 'Key feature', 'Product'].map((name, i) => <SparseText key={name} x={94 + 128 * i} y={496}>{name}</SparseText>)}
    <SparseArrow path="M798 575 H839 V688 H497"/>
    <SparseOperation x={479} y={688} symbol="Σ"/>
    <SparseCells x={65} y={684} values={[rest]} width={132} label={`Other ${features - 3} products`}/>
    <SparseArrow path="M197 704 H460 V688"/>
    <SparseText x={430} y={770}>Shown sum {number(first)} + remaining sum {number(rest)}.</SparseText>
    <SparseText x={430} y={805}>Selected match = {number(first + rest)}; legal mass = {number(denominator)}.</SparseText>
    <SparseText x={430} y={840}>{source <= receiver ? `Source ${source} is permitted at receiver ${receiver}.` : `Source ${source} is future: its legal amount is zero.`}</SparseText>
    <SparseCells x={80} y={903} values={amounts.map((amount, record) => [record, amount, read.weights[receiver]?.[record] ?? 'undefined'])} width={132}/>
    {['Source', 'Legal amount', 'Normalized share'].map((name, i) => <SparseText key={name} x={146 + 132 * i} y={884}>{name}</SparseText>)}
    <SparseText x={675} y={961}>Selected share:</SparseText>
    <SparseText x={675} y={993}>{selectedWeight === null ? 'undefined' : number(selectedWeight, 6)}</SparseText>
  </SparseDrawing>;
}

export function SparseWeightedValuesDrawing({ values, weights, receiver, label = 'Computed normalized shares multiply the actual message coordinates before all permitted contributions are added' }) {
  const columns = values[0].length, width = Math.max(400, 140 + columns * 112);
  const products = values.map((row, record) => row.map(value => value * (weights?.[record] ?? 0)));
  const output = weights ? Array.from({ length: columns }, (_, coordinate) => products.reduce((total, row) => total + row[coordinate], 0)) : null;
  const bottom = 250 + values.length * 50;
  return <SparseDrawing label={label} width={width} height={bottom + values.length * 40 + 190}>
    <SparseText x={width / 2} y={28}>Receiving row {receiver}: the same edited messages.</SparseText>
    <SparseCells x={36} y={88} values={values} width={112} role="input" label="Source messages" rowLabels={values.map((_, record) => record)}/>
    <SparseCells x={width - 128} y={88} values={values.map((_, record) => [weights?.[record] ?? 'undefined'])} width={112} label="Current shares"/>
    <SparseArrow path={`M${36 + columns * 56} ${88 + values.length * 40} V${bottom - 70} H${width / 2 - 19}`}/>
    <SparseArrow path={`M${width - 72} ${88 + values.length * 40} V${bottom - 70} H${width / 2 + 19}`}/>
    <SparseOperation x={width / 2} y={bottom - 70} symbol="×"/>
    <SparseArrow x1={width / 2} y1={bottom - 53} x2={width / 2} y2={bottom}/>
    <SparseCells x={(width - columns * 112) / 2} y={bottom} values={products} width={112} label="Weight × message, for every source" rowLabels={values.map((_, record) => record)}/>
    <SparseArrow x1={width / 2} y1={bottom + values.length * 40} x2={width / 2} y2={bottom + values.length * 40 + 35}/>
    <SparseOperation x={width / 2} y={bottom + values.length * 40 + 52} symbol="Σ"/>
    <SparseArrow x1={width / 2} y1={bottom + values.length * 40 + 69} x2={width / 2} y2={bottom + values.length * 40 + 116}/>
    <SparseCells x={(width - columns * 112) / 2} y={bottom + values.length * 40 + 116} values={output ?? values[0].map(() => 'undefined')} width={112} label="Returned message"/>
  </SparseDrawing>;
}

export function SparseGaussianSampleDrawing({ input = [.5, -.25], projection = [.3, .8] }) {
  const products = input.map((value, coordinate) => value * projection[coordinate]);
  const dot = products.reduce((a, b) => a + b, 0), squares = input.map(value => value * value);
  const halfSquare = squares.reduce((a, b) => a + b, 0) / 2;
  const logFeature = dot - halfSquare;
  return <SparseDrawing width={480} height={1120} label="One fixed Gaussian sample row and one already-scaled input form a dot product, subtract half the input squared length, then exponentiate into one positive feature">
    <SparseCells x={20} y={58} values={input} width={100} role="input" label="Already-scaled input x"/>
    <SparseCells x={260} y={58} values={projection} width={100} role="input" label="Fixed sample row ω"/>
    <SparseArrow path="M120 98 V155 H221"/><SparseArrow path="M360 98 V155 H259"/>
    <SparseOperation x={240} y={155} symbol="×"/>
    <SparseArrow x1={240} y1={172} x2={240} y2={222}/>
    <SparseCells x={140} y={222} values={products} width={100} label="Coordinate products"/>
    <SparseArrow x1={240} y1={262} x2={240} y2={320}/><SparseOperation x={240} y={337} symbol="Σ"/>
    <SparseArrow x1={240} y1={354} x2={240} y2={402}/><SparseCells x={174} y={402} values={[dot]} width={132} label="ω · x"/>
    <SparseArrow path="M120 98 H7 V482 H221"/><SparseOperation x={240} y={482} symbol="square" width={76}/>
    <SparseArrow x1={240} y1={499} x2={240} y2={546}/><SparseCells x={140} y={546} values={squares} width={100} label="Input coordinate squares"/>
    <SparseArrow x1={240} y1={586} x2={240} y2={626}/><SparseOperation x={240} y={643} symbol="Σ ÷ 2" width={82}/>
    <SparseArrow x1={240} y1={660} x2={240} y2={707}/><SparseCells x={174} y={707} values={[halfSquare]} width={132} label="Half squared length"/>
    <SparseArrow path="M306 422 H456 V811 H297"/><SparseArrow x1={240} y1={747} x2={240} y2={794}/>
    <SparseOperation x={240} y={811} symbol="dot − half" width={114}/>
    <SparseArrow x1={240} y1={828} x2={240} y2={869}/><SparseCells x={174} y={869} values={[logFeature]} width={132} label="Log feature"/>
    <SparseArrow x1={240} y1={909} x2={240} y2={947}/><SparseOperation x={240} y={964} symbol="exp" width={64}/>
    <SparseArrow x1={240} y1={981} x2={240} y2={1034}/><SparseCells x={174} y={1034} values={[Math.exp(logFeature)]} width={132} label="Positive feature"/>
  </SparseDrawing>;
}

export function SparseDefinedFeatureDrawing() {
  const raw = [-1, 0, 2], scaled = raw.map(value => value / 8 ** .25);
  const transformed = scaled.map(value => value >= 0 ? value + 1 : Math.exp(value));
  return <SparseDrawing width={460} height={540} label="Signed projected coordinates are first scaled, then ELU plus one maps each coordinate into a positive feature used by the defined kernel">
    <SparseCells x={50} y={65} values={raw} width={120} role="input" label="Three displayed projected coordinates"/>
    <SparseArrow x1={230} y1={105} x2={230} y2={164}/><SparseOperation x={230} y={181} symbol="÷ 8¼" width={88}/>
    <SparseArrow x1={230} y1={198} x2={230} y2={247}/><SparseCells x={50} y={247} values={scaled} width={120} label="Scaled coordinates"/>
    <SparseArrow x1={230} y1={287} x2={230} y2={346}/><SparseOperation x={230} y={363} symbol="ELU + 1" width={110}/>
    <SparseText x={230} y={413}>Negative x → exp(x); otherwise x → x + 1.</SparseText>
    <SparseArrow x1={230} y1={380} x2={230} y2={458}/><SparseCells x={50} y={458} values={transformed} width={120} label="Positive feature coordinates"/>
  </SparseDrawing>;
}

export function SparseCollisionDrawing() {
  return <div className="sparse-flow-independent-scenes">{[[1, 3], [2, 2]].map((values, index) => <SparseDrawing key={index} label={`History ${index + 1} writes different scalar messages but ends in the same S and z`} height={665}>
    <SparseCells x={18} y={68} values={values.map(value => [1, value])} width={130} columnRoles={['input', 'input']} rowLabels={['0', '1']}/>
    <SparseText x={83} y={47} role="input">Key feature</SparseText><SparseText x={213} y={47} role="input">Message</SparseText>
    <SparseArrow x1={148} y1={148} x2={148} y2={200}/><SparseOperation x={148} y={217} symbol="write" width={76}/>
    <SparseArrow path="M148 234 V285 H83 V317"/><SparseArrow path="M148 285 H239 V317"/>
    <SparseCells x={18} y={317} values={[4]} width={130} label="Final S"/><SparseCells x={174} y={317} values={[2]} width={130} label="Final z"/>
    <SparseArrow path="M83 357 V415 H129"/><SparseArrow path="M239 357 V415 H205"/><SparseOperation x={167} y={415} symbol="S ÷ z" width={76}/>
    <SparseArrow x1={167} y1={432} x2={167} y2={493}/><SparseCells x={102} y={493} values={[2]} width={130} label="Same final read, query = 1"/>
    <SparseText x={167} y={595}>First-prefix answer: {values[0]}.</SparseText><SparseText x={167} y={630}>Final S,z no longer tell them apart.</SparseText>
  </SparseDrawing>)}</div>;
}

export function SparseCommonScaleDrawing() {
  const scale = Math.exp(-2), oldS = 6, oldZ = 3, rescaledS = oldS * scale, rescaledZ = oldZ * scale;
  const newS = rescaledS + 4, newZ = rescaledZ + 1;
  return <SparseDrawing width={500} height={1090} label="When the new key raises the shared log scale by two, both old state arrays are multiplied by exp minus two before the new scaled write is added">
    <SparseCells x={45} y={66} values={[[oldS, oldZ]]} width={150} label="Old state, old common log scale = 0"/>
    <SparseCells x={350} y={66} values={[2]} width={115} role="input" label="New log scale"/>
    <SparseArrow x1={120} y1={106} x2={120} y2={223}/><SparseArrow path="M407 106 V171 H158 V223"/>
    <SparseOperation x={120} y={240} symbol="× exp(−2)" width={150}/>
    <SparseText x={320} y={193}>Same multiplier for all old writes.</SparseText>
    <SparseArrow x1={120} y1={257} x2={120} y2={328}/><SparseCells x={45} y={328} values={[[rescaledS, rescaledZ]]} width={150} label="Rescaled old S and z"/>
    <SparseCells x={45} y={471} values={[[1, 4]]} width={150} columnRoles={['computed', 'input']} label="New scaled feature and scalar value"/>
    <SparseArrow x1={120} y1={511} x2={120} y2={571}/><SparseOperation x={120} y={588} symbol="×"/>
    <SparseArrow x1={120} y1={605} x2={120} y2={662}/><SparseCells x={45} y={662} values={[[4, 1]]} width={150} label="New write to S and z"/>
    <SparseArrow path="M345 348 H459 V755 H269"/><SparseArrow path="M195 702 V726 H250 V738"/>
    <SparseOperation x={250} y={755} symbol="+"/>
    <SparseArrow x1={250} y1={772} x2={250} y2={829}/><SparseCells x={100} y={829} values={[[newS, newZ]]} width={150} label="New S and z in the new shared scale"/>
    <SparseArrow x1={250} y1={869} x2={250} y2={919}/><SparseOperation x={250} y={936} symbol="S ÷ z" width={82}/>
    <SparseArrow x1={250} y1={953} x2={250} y2={1010}/><SparseCells x={184} y={1010} values={[newS / newZ]} width={132} label="Query = 1: normalized read"/>
  </SparseDrawing>;
}

export function SparseRatioDrawing() {
  return <div className="sparse-flow-independent-scenes">{[
    { pairs: [[1, 2], [3, 4]], result: .625, name: 'Normalize each possible draw first', values: [.5, .75] },
    { pairs: [[2, 3]], result: 2 / 3, name: 'Average similarities first, then normalize', values: [2 / 3] },
  ].map(({ pairs, result, name, values }, index) => <SparseDrawing key={index} height={560} label={name}>
    <SparseText x={170} y={32}>{index === 0 ? 'Two equally likely draws' : 'Mean amounts first'}</SparseText>
    <SparseText x={98} y={75} role="input">First</SparseText><SparseText x={242} y={75} role="input">Total</SparseText>
    <SparseCells x={26} y={96} values={pairs} width={144} role="input"/>
    <SparseArrow x1={170} y1={96 + pairs.length * 40} x2={170} y2={235}/><SparseOperation x={170} y={252} symbol="First ÷ total" width={160}/>
    <SparseArrow x1={170} y1={269} x2={170} y2={331}/><SparseCells x={98} y={331} values={values.map(value => [value])} width={144} label="Normalized first weight"/>
    <SparseArrow x1={170} y1={331 + values.length * 40} x2={170} y2={449}/><SparseOperation x={170} y={466} symbol={index === 0 ? 'Mean' : 'Keep'} width={84}/>
    <SparseArrow x1={170} y1={483} x2={170} y2={515}/><SparseCells x={98} y={515} values={[result]} width={144}/>
  </SparseDrawing>)}</div>;
}

export function SparseEvictionDrawing() {
  return <SparseDrawing width={700} height={1350} label="Remove a known included key-feature and value pair by subtracting exactly its outer product and its key features from the two memory arrays, then read the remaining state with the same query">
    <SparseCells x={72} y={70} values={[[4, 4], [5, 1]]} width={110} label="Before: S"/><SparseCells x={449} y={70} values={[[4], [4]]} width={110} label="Before: z"/>
    <SparseCells x={72} y={266} values={[1, 2]} width={110} role="input" label="Known included key features"/><SparseCells x={404} y={266} values={[1, -1]} width={110} role="input" label="Its value coordinates"/>
    <SparseArrow path="M182 306 V350 H312"/><SparseArrow path="M514 306 V350 H388"/><SparseOperation x={350} y={350} symbol="outer" width={76}/>
    <SparseArrow x1={350} y1={367} x2={350} y2={426}/><SparseCells x={240} y={426} values={[[1, -1], [2, -2]]} width={110} label="This write to S"/>
    <SparseArrow path="M182 150 V585 H145"/><SparseArrow path="M350 506 V585 H221"/><SparseOperation x={183} y={585} symbol="subtract" width={100}/>
    <SparseArrow path="M504 150 H644 V585 H557"/><SparseArrow path="M72 286 H26 V537 H507 V568"/><SparseOperation x={507} y={585} symbol="subtract" width={100}/>
    <SparseArrow x1={183} y1={602} x2={183} y2={676}/><SparseCells x={72} y={676} values={[[3, 5], [3, 3]]} width={110} label="After: S"/>
    <SparseArrow x1={507} y1={602} x2={507} y2={676}/><SparseCells x={452} y={676} values={[[3], [2]]} width={110} label="After: z"/>
    <SparseCells x={242} y={812} values={[1,3]} width={108} role="input" label="Same query"/>
    <SparseArrow path="M183 756 V936 H124"/><SparseArrow path="M350 852 V894 H183 V919"/>
    <SparseOperation x={183} y={936} symbol="×; sum" width={118}/>
    <SparseArrow path="M507 756 V936 H565"/><SparseArrow path="M458 832 H629 V892 H507 V919"/>
    <SparseOperation x={507} y={936} symbol="dot" width={76}/>
    <SparseArrow x1={183} y1={953} x2={183} y2={1020}/><SparseCells x={72} y={1020} values={[12, 14]} width={110} label="Numerators"/>
    <SparseArrow x1={507} y1={953} x2={507} y2={1020}/><SparseCells x={452} y={1020} values={[9]} width={110} label="Denominator"/>
    <SparseArrow path="M183 1060 V1120 H331"/><SparseArrow path="M507 1060 V1120 H369"/><SparseOperation x={350} y={1120} symbol="÷"/>
    <SparseArrow x1={350} y1={1137} x2={350} y2={1210}/><SparseCells x={242} y={1210} values={[4/3,14/9]} width={108} label="Read of remaining records"/>
    <SparseText x={350} y={1310}>The caller must know this write was included.</SparseText>
  </SparseDrawing>;
}
