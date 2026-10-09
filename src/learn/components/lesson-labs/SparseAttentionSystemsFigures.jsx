import { flowNumber as number } from './LessonFlow.jsx';
import { SparseDrawing, SparseText, SparseCells, SparseArrow, SparseOperation, sparseColors } from './SparseAttentionFlowFigures.jsx';
import { sparseHeadTrace, sparseQuotientGradient, sparseNormalizationTrace } from '../../data/sparse-attention-reading-traces.js';
import examples from '../../data/sparse-attention-examples.json';

const rowSlice = (rows, count = 6) => rows.map(row => row.slice(0, count));

export function SparsePairsDrawing() {
  const length = 6, cell = 40;
  return <SparseDrawing width={340} height={550} label="Six source positions and six receiving positions define a triangular causal grid of 21 legal query-key pairs">
    <SparseText x={170} y={28}>Columns are source records 0–5.</SparseText>
    {Array.from({ length }, (_, source) => <SparseText key={source} x={80 + source * cell} y={73}>{source}</SparseText>)}
    {Array.from({ length }, (_, receiver) => <g key={receiver}>
      <SparseText x={38} y={112 + receiver * cell}>{receiver}</SparseText>
      {Array.from({ length }, (_, source) => <rect key={source} x={60 + source * cell} y={88 + receiver * cell} width={cell} height={cell}
        fill={source <= receiver ? '#be9cf51c' : 'none'} stroke={sparseColors.edge} strokeDasharray={source > receiver ? '4 3' : undefined}/>)}
    </g>)}
    <SparseText x={170} y={377}>Rows are receiving queries 0–5.</SparseText>
    <SparseText x={170} y={412}>Solid cells: 1 + 2 + … + 6 = 21 pairs.</SparseText>
    <SparseText x={170} y={447}>Dashed cells are future sources.</SparseText>
    <SparseCells x={22} y={491} values={[[0, 1, 2, 3, 4, 5]]} width={49} role="input" label="Six records remain stored separately"/>
  </SparseDrawing>;
}

export function SparseRepresentationDrawing() {
  return <SparseDrawing width={720} height={980} label="Distinct ways to represent a read: selected individual records, feature state, learned length summaries and exact score tiles">
    <SparseCells x={30} y={70} values={[[0, 1, 2, 3, 4, 5]]} width={92} role="input" label="Same six source-record IDs"/>
    <SparseArrow path="M306 110 V169 H110 V229"/><SparseArrow path="M306 169 H535 V229"/>
    <SparseCells x={20} y={229} values={[[0, 1], [4, 5]]} width={92} role="input" label="Selected individual records"/>
    <SparseCells x={397} y={229} values={[[4, 4], [5, 1]]} width={110} label="Feature state S: worked example"/>
    <SparseCells x={617} y={229} values={[[4], [4]]} width={90} label="z"/>
    <SparseText x={150} y={368}>Omitted records cannot send a message.</SparseText>
    <SparseText x={535} y={368}>Each write joins shared coordinate sums.</SparseText>
    <SparseArrow path="M582 90 H713 V447 H150 V507"/><SparseArrow path="M713 447 H530 V507"/>
    <SparseCells x={35} y={507} values={[[.5, 0, .5], [.25, .5, .25]]} width={78} role="parameter" label="Two learned length-summary rows"/>
    <SparseCells x={417} y={507} values={[[0, 1], [2, 3]]} width={110} label="One temporary exact score tile"/>
    <SparseText x={150} y={649}>Each summary mixes several record coordinates.</SparseText>
    <SparseText x={530} y={649}>Other tiles are visited without dropping pairs.</SparseText>
    <SparseText x={360} y={734}>These lower arrays illustrate different representations;</SparseText>
    <SparseText x={360} y={770}>their coordinates are not interchangeable outputs.</SparseText>
    <SparseText x={360} y={838}>Sparse: choose sources. Feature: change matching rule.</SparseText>
    <SparseText x={360} y={874}>Summary: mix sources. Tiled exact: change execution order.</SparseText>
    <SparseText x={360} y={922}>Compare quality, pair work, persistent state and workspace separately.</SparseText>
  </SparseDrawing>;
}

export function SparseForecastDrawing({ points, predictions, original, selected = 19, target = null, zoom = false }) {
  const all = [...points, ...Object.values(predictions ?? {}), ...Object.values(original ?? {}), ...(target ? [target] : [])];
  const bounds = zoom && predictions
    ? [Math.min(...Object.values(predictions).map(row => row[0]), ...Object.values(original ?? {}).map(row => row[0])) - .006,
      Math.max(...Object.values(predictions).map(row => row[0]), ...Object.values(original ?? {}).map(row => row[0])) + .006,
      Math.min(...Object.values(predictions).map(row => row[1]), ...Object.values(original ?? {}).map(row => row[1])) - .006,
      Math.max(...Object.values(predictions).map(row => row[1]), ...Object.values(original ?? {}).map(row => row[1])) + .006]
    : [Math.min(0, ...all.map(row => row[0])), Math.max(1, ...all.map(row => row[0])), Math.min(0, ...all.map(row => row[1])), Math.max(1, ...all.map(row => row[1]))];
  const x = value => 54 + (value - bounds[0]) / (bounds[1] - bounds[0]) * 234;
  const y = value => 288 - (value - bounds[2]) / (bounds[3] - bounds[2]) * 234;
  const operatorStyles = { dense: { color: sparseColors.computed, marker: 'circle' }, window: { color: '#dedad1', marker: 'square' }, kernel: { color: '#c5afe9', marker: 'diamond' } };
  const marker = (point, style, key, hollow = false) => style.marker === 'square'
    ? <rect key={key} x={x(point[0]) - 5} y={y(point[1]) - 5} width={10} height={10} stroke={style.color} fill={hollow ? 'none' : style.color}/>
    : style.marker === 'diamond' ? <path key={key} d={`M${x(point[0])} ${y(point[1]) - 6} l6 6 -6 6 -6 -6 z`} stroke={style.color} fill={hollow ? 'none' : style.color}/>
      : <circle key={key} cx={x(point[0])} cy={y(point[1])} r={5} stroke={style.color} fill={hollow ? 'none' : style.color}/>;
  return <SparseDrawing height={670} label={zoom ? 'Shared exact forecast-coordinate zoom for the same three current and original model outputs' : 'Actual edited input path and three current model forecasts in the original coordinate system'}>
    <path d="M54 54 V288 H288" fill="none" stroke={sparseColors.edge}/>
    {[0, 1, 2].map(tick => { const xx = bounds[0] + (bounds[1] - bounds[0]) * tick / 2, yy = bounds[2] + (bounds[3] - bounds[2]) * tick / 2;
      return <g key={tick}><SparseText x={x(xx)} y={322}>{number(xx, 3)}</SparseText><SparseText x={44} y={y(yy) + 5} anchor="end" size={13}>{number(yy, 3)}</SparseText></g>; })}
    {!zoom && <><polyline points={points.map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill="none" stroke={sparseColors.input}/>
      {points.map((point, record) => <circle key={record} cx={x(point[0])} cy={y(point[1])} r={record === selected ? 5 : 2.5} fill={sparseColors.input} stroke={record === selected ? '#fff' : 'none'}/>)}
    </>}
    {Object.entries(original ?? {}).map(([mode, point]) => marker(point, operatorStyles[mode], `original-${mode}`, true))}
    {Object.entries(predictions ?? {}).map(([mode, point]) => marker(point, operatorStyles[mode], `current-${mode}`))}
    {!zoom && target && <path d={`M${x(target[0]) - 5} ${y(target[1]) - 5} l10 10 m-10 0 l10 -10`} stroke={sparseColors.operation} strokeWidth={2}/>}
    <SparseText x={170} y={363}>x coordinate; y increases upward.</SparseText>
    <SparseText x={170} y={398}>{zoom ? 'All forecasts share these axes.' : 'Cyan path: supplied prefix.'}</SparseText>
    <SparseText x={170} y={427}>{zoom ? 'Same prefix length.' : `White ring: selected record ${selected}.`}</SparseText>
    <SparseText x={170} y={462}>Circle dense; square window;</SparseText>
    <SparseText x={170} y={491}>diamond positive-feature kernel.</SparseText>
    <SparseText x={170} y={526}>Solid: current forecast.</SparseText>
    <SparseText x={170} y={555}>Hollow: original-prefix forecast.</SparseText>
    <SparseText x={170} y={590}>{target && !zoom ? 'White cross: truth for the' : 'Original means untouched inputs'}</SparseText>
    <SparseText x={170} y={619}>{target && !zoom ? 'original path only.' : 'at this same prefix length.'}</SparseText>
  </SparseDrawing>;
}

export function SparseNetworkDrawing({ trace, record = trace.points.length - 1 }) {
  const shown = row => row.slice(0, 6), operations = [
    ['Scaled point', trace.scaled[record], 'input'], ['Stem + position', shown(trace.state[record]), 'computed'],
    ['Attention LayerNorm', shown(trace.attentionNorm[record].output), 'computed'],
    ['Three head outputs: two of eight each', trace.headOutputs.flatMap(head => head[record].slice(0, 2)), 'computed'],
    ['Output-map write', shown(trace.attentionWrite[record]), 'computed'], ['First residual state', shown(trace.residual[record]), 'computed'],
    ['Feedforward LayerNorm', shown(trace.feedforwardNorm[record].output), 'computed'], ['Expanded: six of 48', shown(trace.expanded[record]), 'computed'],
    ['Exact GELU: six of 48', shown(trace.activated[record]), 'computed'], ['Feedforward write', shown(trace.feedforwardWrite[record]), 'computed'],
    ['Second residual state', shown(trace.fed[record]), 'computed'], ['Final LayerNorm', shown(trace.finalNorm[record].output), 'computed'],
    ['Forecast in scaled coordinates', trace.projectedForecast[record], 'computed'], ['Forecast in original coordinates', trace.predictions[record], 'computed'],
  ];
  const yy = index => 70 + 160 * index;
  const names = ['2 → 24 stem, bias; add positions', 'LN: mean, variance, gain, offset', 'Q/K/V maps; actual head reads', '24 → 24 learned output map', '+ saved input state', 'LN: mean, variance, gain, offset', '24 → 48 learned map + bias', 'Coordinatewise erf-GELU', '48 → 24 learned map + bias', '+ saved first residual', 'LN: mean, variance, gain, offset', '24 → 2 learned map + bias', '(coordinate + 1) ÷ 2'];
  return <SparseDrawing width={800} height={yy(operations.length - 1) + 100} label={`Actual ${trace.mode} network route for receiving record ${record}; full widths named and each large state displays six coordinates`}>
    <SparseText x={400} y={28}>Mode {trace.mode}; receiving record {record}. Large 24-wide rows show six coordinates.</SparseText>
    {operations.map(([name, values, role], index) => <g key={name}>
      <SparseCells x={(800 - values.length * 104) / 2} y={yy(index)} values={values} width={104} role={role} label={name}/>
      {index < operations.length - 1 && <>
        <SparseArrow x1={400} y1={yy(index) + 40} x2={400} y2={yy(index) + 76}/>
        <SparseOperation x={400} y={yy(index) + 93} symbol={index === 4 || index === 9 ? '+' : 'map'} width={74}/>
        <SparseText x={460} y={yy(index) + 99} anchor="start">{names[index]}</SparseText>
        <SparseArrow x1={400} y1={yy(index) + 110} x2={400} y2={yy(index + 1)}/>
      </>}
    </g>)}
    <SparseArrow path={`M88 ${yy(1) + 20} H15 V${yy(4) + 93} H363`}/>
    <SparseText x={18} y={yy(3) + 55} anchor="start">Saved</SparseText>
    <SparseArrow path={`M88 ${yy(5) + 20} H38 V${yy(9) + 93} H363`}/>
    <SparseText x={41} y={yy(7) + 55} anchor="start">Saved</SparseText>
  </SparseDrawing>;
}

export function SparseAffineDrawing({ trace, stage = 'stem', record = trace.points.length - 1, outputCoordinate = 0 }) {
  const stages = {
    stem: [trace.scaled[record], 'stem.weight', 'stem.bias'],
    query: [trace.attentionNorm[record].output, 'qkv.weight', null],
    key: [trace.attentionNorm[record].output, 'qkv.weight', null],
    value: [trace.attentionNorm[record].output, 'qkv.weight', null],
    output: [trace.merged[record], 'output.weight', null],
    expand: [trace.feedforwardNorm[record].output, 'feedforward.0.weight', 'feedforward.0.bias'],
    contract: [trace.activated[record], 'feedforward.2.weight', 'feedforward.2.bias'],
    forecast: [trace.finalNorm[record].output, 'forecast.weight', 'forecast.bias'],
  };
  const [input, weightName, biasName] = stages[stage];
  const mapCoordinate = outputCoordinate + (stage === 'key' ? 24 : stage === 'value' ? 48 : 0);
  const row = trace.weights[weightName][mapCoordinate], bias = biasName ? trace.weights[biasName][mapCoordinate] : 0;
  const products = input.map((value, coordinate) => value * row[coordinate]);
  const visible = Math.min(6, input.length), remainder = products.slice(visible).reduce((a, b) => a + b, 0);
  const fullSum = products.reduce((a, b) => a + b, 0), cellsCenter = 35 + visible * 112 / 2;
  return <SparseDrawing width={820} height={732} label={`Actual ${stage} affine map output coordinate ${outputCoordinate}, with input × learned row products, exact omitted sum and learned bias`}>
    <SparseText x={410} y={28}>{weightName}: {trace.weights[weightName].length} outputs × {input.length} inputs.</SparseText>
    <SparseCells x={35} y={91} values={input.slice(0, visible)} width={112} label={`${visible} of ${input.length} actual map-input coordinates`}/>
    <SparseCells x={35} y={220} values={row.slice(0, visible)} width={112} role="parameter" label={`Learned row ${mapCoordinate}; ${visible} shown`}/>
    <SparseArrow path={`M${cellsCenter} 131 H795 V324 H448`}/><SparseArrow path={`M${cellsCenter} 260 H410 V307`}/>
    <SparseOperation x={410} y={324} symbol="×" width={76}/>
    <SparseArrow path={`M410 341 H795 V415 H${35 + visible * 112}`}/><SparseCells x={35} y={395} values={products.slice(0, visible)} width={112} label="Coordinate products"/>
    <SparseArrow path={`M${cellsCenter} 435 H410 V573`}/><SparseOperation x={410} y={590} symbol="Σ"/>
    <SparseCells x={50} y={576} values={[remainder]} width={140} label={`Other ${input.length - visible} products`}/><SparseArrow x1={190} y1={596} x2={391} y2={590}/>
    <SparseArrow x1={429} y1={590} x2={537} y2={590}/><SparseOperation x={556} y={590} symbol="+"/>
    <SparseCells x={610} y={535} values={[bias]} width={140} role={biasName ? 'parameter' : 'operation'} label={biasName ? 'Learned bias' : 'No bias: zero'}/><SparseArrow path="M680 575 V590 H575"/>
    <SparseArrow x1={556} y1={607} x2={556} y2={666}/><SparseCells x={486} y={666} values={[fullSum + bias]} width={140} label="This output coordinate"/>
  </SparseDrawing>;
}

export function SparseHeadDrawing({ trace, head = 0, receiver = trace.points.length - 1 }) {
  const local = sparseHeadTrace(trace, head, receiver), selected = Math.min(receiver, Math.max(0, receiver - 2));
  const shown = 4, rows = local.values.length;
  const selectedProducts = trace.mode === 'kernel'
    ? local.queryFeatures.map((value, coordinate) => value * local.keyFeatures[selected][coordinate])
    : local.products[selected];
  const activeSum = selectedProducts.reduce((a, b) => a + b, 0);
  const contributions = local.values.map((value, source) => [source, local.weights[source], value[0], value[1], local.contributions[source][0], local.contributions[source][1]]);
  const tableY = 1340, sumY = tableY + rows * 40 + 90;
  return <SparseDrawing width={960} height={sumY + 210} label={`Actual head ${head} of the current ${trace.mode} network: projected query/key coordinates, permitted normalized weights, every weighted value contribution and full head output`}>
    <SparseText x={480} y={28}>Head {head}; receiver {receiver}; source {selected} expanded below; eight-dimensional head.</SparseText>
    <SparseCells x={35} y={89} values={(trace.mode === 'kernel' ? local.queryFeatures : local.query).slice(0, shown)} width={120} label="Four of eight query coordinates"/>
    <SparseCells x={35} y={219} values={(trace.mode === 'kernel' ? local.keyFeatures[selected] : local.keys[selected]).slice(0, shown)} width={120} label={`Source ${selected}: matching key coordinates`}/>
    <SparseArrow path="M275 129 H920 V314 H537"/><SparseArrow path="M275 259 V314 H461"/><SparseOperation x={499} y={314} symbol="×" width={76}/>
    <SparseArrow x1={499} y1={331} x2={499} y2={391}/><SparseCells x={35} y={391} values={selectedProducts.slice(0, shown)} width={120} label="Four products; all eight enter the sum"/>
    <SparseArrow x1={275} y1={431} x2={275} y2={485}/><SparseOperation x={275} y={502} symbol="Σ"/>
    <SparseCells x={370} y={484} values={[selectedProducts.slice(shown).reduce((a, b) => a + b, 0)]} width={140} label="Other four products"/><SparseArrow x1={370} y1={504} x2={294} y2={502}/>
    <SparseArrow x1={275} y1={519} x2={275} y2={570}/><SparseCells x={205} y={570} values={[activeSum]} width={140} label={trace.mode === 'kernel' ? 'Feature match' : 'Full dot product'}/>
    {trace.mode !== 'kernel' ? <>
      <SparseArrow x1={275} y1={610} x2={275} y2={658}/><SparseOperation x={275} y={675} symbol="÷ √8" width={90}/>
      <SparseArrow x1={275} y1={692} x2={275} y2={740}/><SparseCells x={205} y={740} values={[local.scores[selected]]} width={140} label="This source's score"/>
      <SparseCells x={570} y={740} values={[local.maximum]} width={150} label="Maximum permitted score, all sources"/>
      <SparseArrow x1={275} y1={780} x2={275} y2={813}/><SparseArrow path="M645 780 V830 H350"/><SparseOperation x={275} y={830} symbol="score − max" width={150}/>
      <SparseArrow x1={275} y1={847} x2={275} y2={890}/><SparseCells x={205} y={890} values={[local.shifted[selected] ?? 'forbidden']} width={140} label="Shifted permitted score"/>
      <SparseArrow x1={275} y1={930} x2={275} y2={964}/><SparseOperation x={275} y={981} symbol="exp" width={70}/>
      <SparseArrow x1={275} y1={998} x2={275} y2={1040}/><SparseCells x={205} y={1040} values={[local.exponentials[selected]]} width={140} label="This source's legal amount"/>
      <SparseCells x={570} y={1040} values={[local.mass]} width={150} label="Sum of all legal exp amounts"/>
    </> : <>
      <SparseArrow x1={275} y1={610} x2={275} y2={1040}/><SparseCells x={205} y={1040} values={[local.legal[selected] ? activeSum : 0]} width={140} label="This source's legal feature amount"/>
      <SparseCells x={570} y={1040} values={[local.appliedDenominator]} width={150} label="Full feature mass with fitted 1e−9 floor"/>
      <SparseText x={480} y={820}>Query features feed both the matrix numerator and key-sum denominator.</SparseText>
      <SparseText x={480} y={856}>The local pair weight below reconstructs that same accumulated read.</SparseText>
    </>}
    <SparseArrow path="M275 1080 V1140 H461"/><SparseArrow path="M645 1080 V1140 H499"/><SparseOperation x={480} y={1140} symbol="÷"/>
    <SparseArrow x1={480} y1={1157} x2={480} y2={1200}/><SparseCells x={410} y={1200} values={[local.weights[selected]]} width={140} label={`Source ${selected}: current normalized share`}/>
    <SparseText x={480} y={1290}>Each source follows this normalization; the complete contribution table follows.</SparseText>
    <SparseCells x={35} y={tableY} values={contributions} width={145} selectedRow={selected} columnRoles={['operation', 'computed', 'computed', 'computed', 'computed', 'computed']}/>
    {['Source ID', 'Share', 'Value 0', 'Value 1', 'Share × v₀', 'Share × v₁'].map((name, i) => <SparseText key={name} x={107.5 + i * 145} y={tableY - 22}>{name}</SparseText>)}
    <SparseArrow path={`M760 ${tableY + rows * 40} V${sumY - 35} H537`}/>
    <SparseOperation x={499} y={sumY - 35} symbol="Σ ac" width={76}/>
    <SparseArrow x1={499} y1={sumY - 18} x2={499} y2={sumY + 55}/>
    <SparseCells x={35} y={sumY + 55} values={local.output} width={112} label="All eight returned head coordinates"/>
    <SparseText x={480} y={sumY + 148}>Two of eight value coordinates are expanded above; all eight sums appear below.</SparseText>
  </SparseDrawing>;
}

export function SparseNsaDrawing() {
  const selected=[0,1,4,5];
  const lanes=[
    {name:'Compressed branch',ids:['c₀','c₁','c₂'],keys:['Kc₀','Kc₁','Kc₂'],values:['Vc₀','Vc₁','Vc₂'],gate:'g_comp'},
    {name:'Selected branch',ids:selected,keys:selected.map(id=>`Ks${id}`),values:selected.map(id=>`Vs${id}`),gate:'g_select'},
    {name:'Window branch',ids:[6,7,8],keys:['Kw6','Kw7','Kw8'],values:['Vw6','Vw7','Vw8'],gate:'g_window'},
  ];
  return <>
    <SparseDrawing width={1080} height={1750} label="NSA compressed attention supplies selection-block importance, summed within a query-head group; selected block IDs gather the matching original keys and values, never substituting IDs for coordinates">
      <SparseCells x={80} y={75} values={['x₀','x₁','x₂','x₃','x₄','x₅','x₆','x₇','x₈']} width={102} role="input" label="Original source representations; subscripts attach source IDs"/>
      <SparseArrow x1={233} y1={115} x2={233} y2={193}/><SparseOperation x={233} y={210} symbol="learned block compression" width={314}/>
      <SparseArrow x1={233} y1={227} x2={233} y2={294}/><SparseCells x={66} y={294} values={['Kc₀','Kc₁','Kc₂']} width={110} label="Compressed key coordinates"/>
      <SparseText x={233} y={388}>Illustrative blocks: 0–2, 3–5, 6–8.</SparseText>
      <SparseCells x={742} y={210} values={['x_query']} width={160} role="input" label="Current input representation"/>
      <SparseArrow x1={822} y1={250} x2={822} y2={306}/><SparseOperation x={822} y={323} symbol="learned Q map" width={210}/>
      <SparseArrow x1={822} y1={340} x2={822} y2={405}/><SparseCells x={742} y={405} values={['q₀','q₁']} width={130} label="Two heads in one illustrative group"/>
      <SparseArrow path="M233 334 V496 H391"/><SparseArrow path="M872 445 V496 H629"/><SparseOperation x={510} y={496} symbol="dot; scale; row softmax" width={308}/>
      <SparseArrow x1={510} y1={513} x2={510} y2={588}/><SparseCells x={315} y={588} values={[['a₀c₀','a₀c₁','a₀c₂'],['a₁c₀','a₁c₁','a₁c₂']]} width={130} label="Compressed-read shares, each head's row sums to one"/>
      <SparseArrow x1={510} y1={668} x2={510} y2={739}/><SparseOperation x={510} y={756} symbol="align overlaps to selection blocks" width={432}/>
      <SparseArrow x1={510} y1={773} x2={510} y2={840}/><SparseCells x={185} y={840} values={[['I₀₀','I₀₁','I₀₂','I₀₃','I₀₄'],['I₁₀','I₁₁','I₁₂','I₁₃','I₁₄']]} width={130} label="Each head's importance for two-record selection blocks"/>
      <SparseArrow x1={510} y1={920} x2={510} y2={982}/><SparseOperation x={510} y={999} symbol="sum importance within query-head group" width={456}/>
      <SparseArrow x1={510} y1={1016} x2={510} y2={1075}/><SparseCells x={185} y={1075} values={['I₀','I₁','I₂','I₃','I₄']} width={130} label="Group-shared selection-block importance"/>
      <SparseArrow x1={510} y1={1115} x2={510} y2={1173}/><SparseOperation x={510} y={1190} symbol="top two block IDs: 0 and 2" width={314}/>
      <SparseArrow x1={510} y1={1207} x2={510} y2={1267}/><SparseCells x={286} y={1267} values={selected} width={112} role="operation" label="Selected original source IDs (metadata)"/>
      <SparseCells x={32} y={1381} values={['Ks₀,Vs₀','Ks₁,Vs₁','…','Ks₈,Vs₈']} width={146} label="Separate selected-branch maps supply original K/V records"/>
      <SparseArrow path="M998 95 H1058 V1190 H992"/><SparseOperation x={852} y={1190} symbol="selected-branch K/V maps" width={280}/>
      <SparseArrow path="M852 1207 V1344 H324 V1381"/>
      <SparseArrow x1={510} y1={1307} x2={510} y2={1477}/><SparseArrow path="M324 1421 V1494 H412"/><SparseOperation x={510} y={1494} symbol="gather by IDs" width={196}/>
      <SparseArrow x1={510} y1={1511} x2={510} y2={1571}/><SparseCells x={242} y={1571} values={['Ks₀,Vs₀','Ks₁,Vs₁','Ks₄,Vs₄','Ks₅,Vs₅']} width={134} label="Matching selected content coordinates, not integers"/>
      <SparseText x={540} y={1692}>These symbolic rankings illustrate ownership; they are not measured learned scores.</SparseText>
      <SparseText x={540} y={1724}>The full model also retains its prescribed fixed/local block rules.</SparseText>
    </SparseDrawing>
    <SparseDrawing width={1080} height={1570} label="NSA uses three independently mapped key/value branches and separately normalized reads; MLP plus sigmoid gates come from the input representation and multiply each completed branch output">
      <SparseCells x={455} y={65} values={['x_query']} width={170} role="input" label="Same input representation used to form the query"/>
      <SparseArrow x1={540} y1={105} x2={540} y2={160}/><SparseOperation x={540} y={177} symbol="learned MLP → sigmoid" width={300}/>
      <SparseArrow x1={540} y1={194} x2={540} y2={260}/><SparseCells x={360} y={260} values={['g_comp','g_select','g_window']} width={120} label="Three input-derived gates, each between zero and one"/>
      {lanes.map((lane,branch)=>{const center=180+360*branch,rows=lane.keys.map((key,index)=>[lane.ids[index],key,lane.values[index]]);return <g key={lane.name}>
        <SparseCells x={center-150} y={432} values={rows} width={100} columnRoles={['operation','computed','computed']} label={lane.name}/>
        {['ID tag','Key','Value'].map((name,index)=><SparseText key={name} x={center-100+100*index} y={397}>{name}</SparseText>)}
        <SparseCells x={center-60} y={665} values={['same q']} width={120} label="Shared projected query"/>
        <SparseArrow path={`M${center} ${432+rows.length*40} V612 H${center+158} V778 H${center+117}`}/>
        <SparseArrow x1={center} y1={705} x2={center} y2={761}/><SparseOperation x={center} y={778} symbol="dot; scale; softmax" width={234}/>
        <SparseArrow x1={center} y1={795} x2={center} y2={848}/><SparseCells x={center-150} y={848} values={[lane.ids.map((_,record)=>`a${branch},${record}`)]} width={300/lane.ids.length} label="Each branch's weights sum to one"/>
        <SparseArrow x1={center} y1={888} x2={center} y2={961}/><SparseArrow path={`M${center+100} ${432+rows.length*40} H${center+169} V978 H${center+117}`}/>
        <SparseOperation x={center} y={978} symbol="Σ weight × value" width={234}/>
        <SparseArrow x1={center} y1={995} x2={center} y2={1054}/><SparseCells x={center-60} y={1054} values={[`output${branch}`]} width={120} label="Completed branch read"/>
        <SparseArrow x1={center} y1={1094} x2={center} y2={1193}/><SparseArrow path={`M${420+branch*120} 300 V344 H${center-174} V1210 H${center-98}`}/><SparseOperation x={center} y={1210} symbol={`× ${lane.gate}`} width={196}/>
        <SparseArrow path={`M${center} 1227 V1340 H${branch===2?559:521}`}/>
      </g>;})}
      <SparseOperation x={540} y={1340} symbol="+"/><SparseArrow x1={540} y1={1357} x2={540} y2={1416}/><SparseCells x={470} y={1416} values={['output']} width={140} label="Three gated reads added"/>
      <SparseText x={540} y={1520}>Independent branch K/V maps; gates need not sum to one.</SparseText>
    </SparseDrawing>
  </>;
}

export function SparseDsaDrawing() {
  return <SparseDrawing width={960} height={1250} label="DSA's separate indexer scores every visible source, selects source IDs, then those IDs gather matching latent and position records for the main MLA read">
    <SparseCells x={35} y={65} values={['x_query']} width={144} role="input" label="Current representation"/>
    <SparseCells x={550} y={65} values={['x₀', 'x₁', '…', 'x_L']} width={92} role="input" label="All visible source representations"/>
    <SparseArrow x1={107} y1={105} x2={107} y2={169}/><SparseOperation x={107} y={186} symbol="indexer Q, w" width={178}/>
    <SparseArrow x1={734} y1={105} x2={734} y2={169}/><SparseOperation x={734} y={186} symbol="indexer K" width={156}/>
    <SparseArrow path="M107 203 V273 H391"/><SparseArrow path="M734 203 V273 H629"/><SparseOperation x={510} y={273} symbol="Σ wₕ ReLU(qₕ · k)" width={238}/>
    <SparseArrow x1={510} y1={290} x2={510} y2={345}/><SparseCells x={220} y={345} values={['I₀', 'I₁', '…', 'I_L']} width={145} label="All-prefix indexer scores; not just the winners"/>
    <SparseArrow x1={510} y1={385} x2={510} y2={442}/><SparseOperation x={510} y={459} symbol="top-k IDs" width={140}/>
    <SparseArrow x1={510} y1={476} x2={510} y2={529}/><SparseCells x={305} y={529} values={['id_a', 'id_b', 'id_c']} width={136} label="Illustrative selected source IDs"/>
    <SparseCells x={38} y={679} values={['c₀,p₀', 'c₁,p₁', '…', 'c_L,p_L']} width={166} label="Matching main latent/position memory, same sequence and layer"/>
    <SparseArrow x1={510} y1={569} x2={510} y2={766}/><SparseArrow path="M370 719 V783 H448"/><SparseOperation x={510} y={783} symbol="gather IDs" width={160}/>
    <SparseArrow x1={510} y1={800} x2={510} y2={855}/><SparseCells x={274} y={855} values={['c_a,p_a', 'c_b,p_b', 'c_c,p_c']} width={158} label="Actual selected main records"/>
    <SparseArrow path="M35 85 H13 V766 H23"/><SparseOperation x={105} y={766} symbol="main Q map" width={164}/>
    <SparseArrow x1={105} y1={783} x2={105} y2={855}/><SparseCells x={35} y={855} values={['main q']} width={144} label="Current main query"/>
    <SparseArrow path="M107 895 V1000 H392"/>
    <SparseArrow x1={510} y1={895} x2={510} y2={983}/><SparseOperation x={510} y={1000} symbol="main score → softmax" width={236}/>
    <SparseArrow x1={510} y1={1017} x2={510} y2={1080}/><SparseOperation x={510} y={1097} symbol="Σ a × latent; output map" width={284}/>
    <SparseArrow x1={510} y1={1114} x2={510} y2={1175}/><SparseCells x={440} y={1175} values={['output']} width={140} label="Main read, distinct from indexer training"/>
  </SparseDrawing>;
}

export function SparseCsaDrawing() {
  const modes = ['Full', 'Reindex', 'Reuse'];
  return <SparseDrawing width={1170} height={1260} label="CSA2's three modes reuse matching global memory and possibly indices, while every mode supplies a fresh main query and the current layer's local key/value records">
    {modes.map((mode, branch) => { const center = 195 + branch * 390; return <g key={mode}>
      <SparseText x={center} y={31}>{mode}</SparseText>
      <SparseCells x={center - 135} y={85} values={['fresh Q', 'local KV']} width={135} label="Current layer, every mode"/>
      <SparseCells x={center - 135} y={230} values={[branch === 0 ? 'new global M' : 'same old M', branch === 0 ? 'new indexer K' : 'same old Kᵢ']} width={135} label="Global records and their matching indexer keys"/>
      {branch < 2 ? <>
        <SparseCells x={center - 68} y={375} values={['fresh Qᵢ']} width={136} label="New indexer query"/>
        <SparseArrow path={`M${center + 67} 270 H${center + 172} V476 H${center + 95}`}/><SparseArrow x1={center} y1={415} x2={center} y2={459}/>
        <SparseOperation x={center} y={476} symbol="indexer → new IDs" width={214}/>
      </> : <SparseCells x={center - 100} y={450} values={['matching old IDs']} width={200} label="Last indices for exactly this memory"/>}
      <SparseArrow path={`M${center - 67} 270 H${center - 172} V619 H${center - 88}`}/>
      <SparseArrow x1={center} y1={branch < 2 ? 493 : 490} x2={center} y2={602}/><SparseOperation x={center} y={619} symbol="gather global records" width={242}/>
      <SparseArrow x1={center} y1={636} x2={center} y2={705}/><SparseCells x={center - 136} y={705} values={['selected global', 'current local']} width={136} label="Concatenated main K/V records"/>
      <SparseArrow path={`M${center + 67} 125 H${center + 181} V725 H${center + 136}`}/>
      <SparseArrow path={`M${center - 67} 125 H${center - 186} V846 H${center - 124}`}/>
      <SparseArrow x1={center} y1={745} x2={center} y2={829}/><SparseOperation x={center} y={846} symbol="fresh Q scores actual K" width={260}/>
      <SparseArrow x1={center} y1={863} x2={center} y2={928}/><SparseOperation x={center} y={945} symbol="normalize; Σ weight × V" width={288}/>
      <SparseArrow x1={center} y1={962} x2={center} y2={1024}/><SparseCells x={center - 70} y={1024} values={['output']} width={140} label="Fresh main read"/>
    </g>; })}
    <SparseText x={585} y={1126}>Reindex changes which old records are retrieved; Reuse retains matching IDs.</SparseText>
    <SparseText x={585} y={1162}>Neither mode permits indices from a different sequence, memory basis or checkpoint.</SparseText>
    <SparseText x={585} y={1198}>An initial full pass supplies memory; local K/V and main Q are always current.</SparseText>
  </SparseDrawing>;
}

export function SparseNormalizationDrawing({ trace, stage = 'attention', record = trace.points.length - 1 }) {
  const norm = stage === 'attention' ? trace.attentionNorm[record] : stage === 'feedforward' ? trace.feedforwardNorm[record] : trace.finalNorm[record];
  return <SparseDrawing width={860} height={1420} label={`Actual ${stage} LayerNorm centers the full 24-coordinate row, computes its full variance and uses the shared divisor before learned coordinate gains and offsets`}>
    <SparseCells x={40} y={75} values={norm.input.slice(0, 6)} width={120} label="Six of 24 actual input coordinates; all 24 enter mean and variance"/>
    <SparseArrow x1={400} y1={115} x2={400} y2={174}/><SparseOperation x={400} y={191} symbol="Σ all 24 ÷ 24" width={184}/>
    <SparseArrow x1={400} y1={208} x2={400} y2={264}/><SparseCells x={330} y={264} values={[norm.mean]} width={140} label="Full mean"/>
    <SparseArrow path="M760 95 H833 V362 H476"/><SparseArrow x1={400} y1={304} x2={400} y2={345}/><SparseOperation x={400} y={362} symbol="input − mean" width={180}/>
    <SparseArrow x1={400} y1={379} x2={400} y2={433}/><SparseCells x={40} y={433} values={norm.centered.slice(0, 6)} width={120} label="Six centered coordinates"/>
    <SparseArrow x1={400} y1={473} x2={400} y2={527}/><SparseOperation x={400} y={544} symbol="squares; full mean" width={210}/>
    <SparseArrow x1={400} y1={561} x2={400} y2={615}/><SparseCells x={330} y={615} values={[norm.variance]} width={140} label="Full population variance"/>
    <SparseArrow x1={400} y1={655} x2={400} y2={709}/><SparseOperation x={400} y={726} symbol="√(variance + ε)" width={210}/>
    <SparseCells x={40} y={707} values={[norm.epsilon]} width={140} role="operation" label="Fixed ε"/><SparseArrow x1={180} y1={727} x2={295} y2={726}/>
    <SparseArrow x1={400} y1={743} x2={400} y2={796}/><SparseCells x={330} y={796} values={[norm.divisor]} width={140} label="Shared divisor"/>
    <SparseArrow path="M40 453 H15 V911 H295"/><SparseArrow x1={400} y1={836} x2={400} y2={894}/><SparseOperation x={400} y={911} symbol="centered ÷ divisor" width={228}/>
    <SparseArrow x1={400} y1={928} x2={400} y2={983}/><SparseCells x={40} y={983} values={norm.unit.slice(0, 6)} width={120} label="Unit coordinates, six of 24"/>
    <SparseCells x={40} y={1112} values={[norm.gain.slice(0, 6), norm.offset.slice(0, 6)]} width={120} role="parameter" label="Learned gains (top), offsets (bottom), same six coordinates"/>
    <SparseArrow path="M760 1003 H833 V1271 H514"/><SparseArrow x1={400} y1={1192} x2={400} y2={1254}/><SparseOperation x={400} y={1271} symbol="unit × gain + offset" width={254}/>
    <SparseArrow x1={400} y1={1288} x2={400} y2={1342}/><SparseCells x={40} y={1342} values={norm.output.slice(0, 6)} width={120} label="Normalized output row: six of 24"/>
  </SparseDrawing>;
}

export function SparseGeluDrawing({ trace, record = trace.points.length - 1 }) {
  const inputs = trace.expanded[record].slice(0, 6), outputs = trace.activated[record].slice(0, 6);
  const factors = inputs.map((value, coordinate) => value === 0 ? .5 : outputs[coordinate] / value);
  return <SparseDrawing width={820} height={565} label="The actual six displayed expanded coordinates receive their own exact Gaussian-CDF GELU factor, then multiply into six activated coordinates">
    <SparseCells x={30} y={77} values={inputs} width={120} label="Six of 48 expanded coordinates"/>
    <SparseArrow x1={390} y1={117} x2={390} y2={177}/><SparseOperation x={390} y={194} symbol="Φ(x) = (1 + erf(x/√2))/2" width={344}/>
    <SparseArrow x1={390} y1={211} x2={390} y2={266}/><SparseCells x={30} y={266} values={factors} width={120} label="One Gaussian-CDF factor per coordinate"/>
    <SparseArrow path="M750 97 H798 V367 H409"/><SparseArrow x1={390} y1={306} x2={390} y2={350}/><SparseOperation x={390} y={367} symbol="×"/>
    <SparseArrow x1={390} y1={384} x2={390} y2={442}/><SparseCells x={30} y={442} values={outputs} width={120} label="Exact-erf GELU outputs"/>
    <SparseText x={410} y={535}>This is the saved model's exact GELU, not the tanh approximation.</SparseText>
  </SparseDrawing>;
}

export function SparseQuotientDrawing({ query = [1, 3], keys = [[1, 2], [2, 1], [1, 1]], values = [[1, -1], [0, 2], [3, 1]], upstream = [1, -.5] }) {
  const trace = sparseQuotientGradient(query, keys, values, upstream), read = trace.read;
  const operandsY=1286, operationY=operandsY+keys.length*40+150, gradientsY=operationY+110;
  return <SparseDrawing width={900} height={trace.defined ? gradientsY+keys.length*40+150 : 490} label="The feature query feeds both numerator and denominator; matrix credit reaches keys and values, while key-sum credit reaches only keys">
    <SparseCells x={42} y={76} values={read.matrix} width={122} label="Forward state S"/>
    <SparseCells x={568} y={76} values={read.normalizer} width={122} label="Forward key sum z"/>
    <SparseCells x={328} y={261} values={query} width={122} role="input" label="Forward query features a"/>
    <SparseArrow path="M164 156 V373 H307"/><SparseArrow path="M450 301 V341 H345 V356"/>
    <SparseOperation x={345} y={373} symbol="aᵀS" width={76}/>
    <SparseArrow path="M690 116 V373 H593"/><SparseArrow path="M450 341 H555 V356"/><SparseOperation x={555} y={373} symbol="aᵀz" width={76}/>
    {!trace.defined ? <SparseText x={450} y={455}>Zero positive overlap: read and derivative are undefined.</SparseText> : <>
      <SparseArrow x1={345} y1={390} x2={345} y2={455}/><SparseCells x={223} y={455} values={read.numerator} width={122} label="Numerator n"/>
      <SparseArrow x1={555} y1={390} x2={555} y2={455}/><SparseCells x={515} y={455} values={[read.denominator]} width={122} label="Denominator b"/>
      <SparseArrow path="M345 495 V569 H431"/><SparseArrow path="M576 495 V569 H469"/><SparseOperation x={450} y={569} symbol="÷"/>
      <SparseArrow x1={450} y1={586} x2={450} y2={641}/><SparseCells x={328} y={641} values={read.output} width={122} label="Forward output o"/>
      <SparseCells x={40} y={734} values={upstream} width={122} role="backward" label="Supplied output credit g"/>
      <SparseArrow path="M284 754 H312 V662 H328" backward/>
      <SparseArrow path="M450 641 V611 H345 V495" backward/><SparseArrow path="M450 611 H576 V495" backward/>
      <SparseCells x={223} y={842} values={trace.numeratorGradient} width={122} role="backward" label="Credit to n: g / b"/>
      <SparseCells x={555} y={842} values={[trace.denominatorGradient]} width={160} role="backward" label="Credit to b: −g · o / b"/>
      <SparseArrow path="M345 842 H19 V116 H42" backward/><SparseArrow path="M635 842 H860 V96 H812" backward/>
      <SparseCells x={42} y={974} values={trace.stateGradient} width={122} role="backward" label="Credit to S"/>
      <SparseCells x={568} y={974} values={trace.normalizerGradient} width={122} role="backward" label="Credit to z"/>
      <SparseArrow path="M164 974 V930 H450 V301" backward/><SparseArrow path="M690 974 V922 H450" backward/>
      <SparseCells x={328} y={1127} values={trace.queryGradient} width={122} role="backward" label="Both routes add into query credit"/>
      <SparseCells x={42} y={operandsY} values={keys} width={122} role="input" label="Every supplied key feature"/>
      <SparseCells x={550} y={operandsY} values={values} width={122} role="input" label="Its supplied value"/>
      <SparseArrow path={`M672 ${operandsY+keys.length*40} V${operationY-120} H220 V${operationY-17}`}/>
      <SparseArrow path={`M164 ${operandsY+keys.length*40} V${operationY-80} H670 V${operationY-17}`}/>
      <SparseArrow path={`M42 1014 H20 V${operationY} H62`} backward/>
      <SparseArrow path={`M286 1014 H882 V${operationY} H791`} backward/>
      <SparseArrow path={`M568 1014 H480 V${operationY-42} H220 V${operationY-17}`} backward/>
      <SparseOperation x={220} y={operationY} symbol="S credit × value + z credit" width={316}/>
      <SparseOperation x={670} y={operationY} symbol="S creditᵀ × key" width={242}/>
      <SparseArrow x1={220} y1={operationY+17} x2={220} y2={gradientsY} backward/>
      <SparseArrow x1={670} y1={operationY+17} x2={670} y2={gradientsY} backward/>
      <SparseCells x={98} y={gradientsY} values={trace.keyGradients} width={122} role="backward" label="Credit to each supplied key feature"/>
      <SparseCells x={548} y={gradientsY} values={trace.valueGradients} width={122} role="backward" label="Credit to each supplied value"/>
      <SparseText x={450} y={gradientsY+keys.length*40+93}>z contains no values: only its key-credit route exists.</SparseText>
      <SparseText x={450} y={gradientsY+keys.length*40+127}>Orange dashed arrows carry reverse credit; feature coordinates are supplied.</SparseText>
    </>}
  </SparseDrawing>;
}

export function SparsePackingDrawing() {
  return <SparseDrawing width={640} height={685} label="Two packed documents occupy one storage row but require separate cumulative memories; their position identities restart or are supplied explicitly">
    <SparseCells x={26} y={80} values={['A₀', 'A₁', 'A₂', 'B₀', 'B₁', 'B₂']} width={96} role="input" label="Physical storage order; subscripts are document-local positions"/>
    <path d="M314 42 V587" stroke={sparseColors.operation} strokeDasharray="5 5"/>
    <SparseText x={158} y={174}>Document A</SparseText><SparseText x={458} y={174}>Document B</SparseText>
    {[0, 1].map(document => { const center = 158 + 300 * document; return <g key={document}>
      <SparseArrow x1={center} y1={120} x2={center} y2={231}/><SparseOperation x={center} y={248} symbol="S = 0, z = 0" width={160}/>
      <SparseArrow x1={center} y1={265} x2={center} y2={319}/><SparseCells x={center - 120} y={319} values={[[`${document ? 'B' : 'A'}₀ write`, 'read 0'], [`${document ? 'B' : 'A'}₁ write`, 'read 1'], [`${document ? 'B' : 'A'}₂ write`, 'read 2']]} width={120} label="Only this document's writes"/>
      <SparseArrow x1={center} y1={439} x2={center} y2={491}/><SparseOperation x={center} y={508} symbol="discard / reset" width={166}/>
    </g>; })}
    <SparseText x={320} y={623}>A's final state must not be B's starting state.</SparseText>
    <SparseText x={320} y={660}>Cache identity includes model, feature map, sequence and position convention.</SparseText>
  </SparseDrawing>;
}

export function SparseDeltaDrawing() {
  const key = [1, 0], value = [3, 2], old = [[1, -.5], [.25, 1]], oldRead = old[0], error = value.map((entry, i) => entry - oldRead[i]);
  const write = key.map(entry => error.map(value => entry * value)), next = old.map((row, i) => row.map((entry, j) => entry + write[i][j]));
  return <SparseDrawing width={680} height={1090} label="A unit key reads its old prediction from state, subtracts it from the desired value and writes the error outer product; beta one overwrites only that unit-key direction">
    <SparseCells x={30} y={69} values={old} width={120} label="Old state S"/>
    <SparseCells x={360} y={69} values={key} width={120} role="input" label="Unit key k"/>
    <SparseArrow path="M150 149 V219 H291"/><SparseArrow path="M480 109 V219 H367"/><SparseOperation x={329} y={219} symbol="kᵀS" width={76}/>
    <SparseArrow x1={329} y1={236} x2={329} y2={290}/><SparseCells x={209} y={290} values={oldRead} width={120} label="Old prediction"/>
    <SparseCells x={30} y={422} values={value} width={120} role="input" label="Desired value v"/>
    <SparseArrow path="M329 330 V480 H367"/><SparseArrow path="M150 462 V480 H291"/><SparseOperation x={329} y={480} symbol="v − kᵀS" width={156}/>
    <SparseArrow x1={329} y1={497} x2={329} y2={550}/><SparseCells x={209} y={550} values={error} width={120} label="Prediction error"/>
    <SparseArrow path="M480 109 H654 V651 H367"/><SparseArrow x1={329} y1={590} x2={329} y2={634}/><SparseOperation x={329} y={651} symbol="β k ⊗ error" width={170}/>
    <SparseArrow x1={329} y1={668} x2={329} y2={722}/><SparseCells x={209} y={722} values={write} width={120} label="Write at β = 1"/>
    <SparseArrow path="M30 109 H13 V868 H253"/><SparseArrow x1={329} y1={802} x2={329} y2={851}/><SparseOperation x={329} y={868} symbol="γ S + write" width={168}/>
    <SparseArrow x1={329} y1={885} x2={329} y2={945}/><SparseCells x={209} y={945} values={next} width={120} label="New S at γ = 1"/>
    <SparseText x={340} y={1063}>New unit-key read is [3, 2]; other directions need not be overwritten.</SparseText>
  </SparseDrawing>;
}

export function SparseLandmarkDrawing() {
  const fixture = examples.nystrom_worked;
  return <SparseDrawing width={880} height={1480} label="Four actual query and key rows form two contiguous mean landmarks; three distinct normalized matching matrices connect full queries to landmark keys, landmarks to landmarks and landmark queries to full keys">
    <SparseCells x={42} y={70} values={fixture.query} width={120} role="input" label="Four supplied query rows Q" rowLabels={[0, 1, 2, 3]}/>
    <SparseCells x={550} y={70} values={fixture.key} width={120} role="input" label="Four supplied key rows K" rowLabels={[0, 1, 2, 3]}/>
    {[162, 670].map(center => <g key={center}><SparseArrow x1={center} y1={230} x2={center} y2={287}/><SparseOperation x={center} y={304} symbol="mean rows 0–1, 2–3" width={250}/><SparseArrow x1={center} y1={321} x2={center} y2={388}/></g>)}
    <SparseCells x={42} y={388} values={fixture.query_landmarks} width={120} label="Two query landmarks Q̃"/>
    <SparseCells x={550} y={388} values={fixture.key_landmarks} width={120} label="Two key landmarks K̃"/>
    <SparseArrow path="M282 130 H856 V559 H795"/><SparseArrow x1={670} y1={468} x2={670} y2={542}/>
    <SparseOperation x={670} y={559} symbol="QK̃ᵀ / √2; softmax" width={250}/>
    <SparseArrow x1={670} y1={576} x2={670} y2={638}/><SparseCells x={550} y={638} values={fixture.front} width={120} label="F: four queries × two landmarks"/>
    <SparseArrow path="M162 468 V559 H313"/><SparseArrow path="M550 428 H504 V559 H567"/><SparseOperation x={440} y={559} symbol="Q̃K̃ᵀ / √2; softmax" width={254}/>
    <SparseArrow x1={440} y1={576} x2={440} y2={935}/><SparseCells x={320} y={935} values={fixture.middle} width={120} label="A: two landmarks × two landmarks"/>
    <SparseArrow path="M162 468 V1119 H315"/><SparseArrow path="M790 130 H870 V1119 H565"/><SparseOperation x={440} y={1119} symbol="Q̃Kᵀ / √2; softmax" width={250}/>
    <SparseArrow x1={440} y1={1136} x2={440} y2={1197}/><SparseCells x={200} y={1197} values={fixture.back} width={120} label="B: two landmark queries × four keys"/>
    <SparseText x={440} y={1340}>Each of F, A and B normalizes across its own key columns.</SparseText>
    <SparseText x={440} y={1382}>Their dimensions differ; A⁺ later corrects overlap between landmarks.</SparseText>
    <SparseText x={440} y={1424}>This constructed example is noncausal; no future-mask guarantee is implied.</SparseText>
  </SparseDrawing>;
}

export function SparseUnevenSegmentsDrawing() {
  const records = [1, 2, 3, 4, 5, 6, 7], groups = [[0, 1, 2], [3, 4], [5, 6]];
  return <SparseDrawing width={760} height={500} label="Seven source records are partitioned into contiguous segments of sizes three, two and two; each mean divides by its own count">
    <SparseCells x={30} y={70} values={records} width={100} role="input" label="Supplied scalar records, original order"/>
    {groups.map((ids, group) => { const center = 132 + group * 250, average = ids.reduce((total, id) => total + records[id], 0) / ids.length; return <g key={group}>
      {ids.map(id => <SparseArrow key={id} path={`M${80 + id * 100} 110 V${165 + group * 12} H${center} V241`}/>)}
      <SparseOperation x={center} y={258} symbol={`Σ ÷ ${ids.length}`} width={92}/>
      <SparseArrow x1={center} y1={275} x2={center} y2={339}/><SparseCells x={center - 62} y={339} values={[average]} width={124} label={`Mean ${group}`}/>
      <SparseText x={center} y={430}>Source IDs {ids.join(', ')}.</SparseText>
    </g>; })}
  </SparseDrawing>;
}

export function SparseLengthMapDrawing() {
  const keys = [[1, 0], [0, 2], [2, 1], [-1, 1]], values = [[2], [-1], [3], [4]];
  const maps = [[.5, .5, 0, 0], [0, 0, .5, .5]];
  const multiply = records => maps.map(row => records[0].map((_, coordinate) => row.reduce((total, weight, record) => total + weight * records[record][coordinate], 0)));
  return <SparseDrawing width={920} height={1080} label="Two supplied learned-length-map rows multiply four source key/value rows along the length dimension, creating two summary records instead of compressing the coordinate dimension">
    <SparseCells x={30} y={69} values={keys} width={115} role="input" label="K: four rows, two coordinates"/>
    <SparseCells x={700} y={69} values={values} width={115} role="input" label="V: four source rows × one coordinate"/>
    <SparseCells x={260} y={341} values={maps} width={100} role="parameter" label="Constructed E and F: two summaries × four source positions"/>
    <SparseArrow path="M145 229 V521 H256"/><SparseArrow path="M410 421 V521 H332"/><SparseOperation x={294} y={521} symbol="EK" width={76}/>
    <SparseArrow path="M760 229 V521 H702"/><SparseArrow path="M560 421 V521 H626"/><SparseOperation x={664} y={521} symbol="FV" width={76}/>
    <SparseArrow x1={294} y1={538} x2={294} y2={610}/><SparseCells x={179} y={610} values={multiply(keys)} width={115} label="Two summary keys, still two coordinates"/>
    <SparseArrow x1={664} y1={538} x2={664} y2={610}/><SparseCells x={606} y={610} values={multiply(values)} width={115} label="Two summary values"/>
    <SparseCells x={50} y={802} values={[1, 0]} width={115} role="input" label="Supplied current query"/>
    <SparseArrow path="M165 842 V913 H334"/><SparseArrow path="M294 690 V913 H566"/><SparseOperation x={450} y={913} symbol="Q(EK)ᵀ → softmax" width={232}/>
    <SparseArrow path="M664 690 V1009 H565"/><SparseArrow x1={450} y1={930} x2={450} y2={992}/><SparseOperation x={450} y={1009} symbol="Σ shares × (FV)" width={230}/>
    <SparseText x={460} y={1063}>The query normalizes across two summary slots, not four original source records.</SparseText>
  </SparseDrawing>;
}

export function SparseReformerDrawing() {
  const records = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, .2], [.2, 1]];
  const signed = records.map(([x, y]) => [x, y, -x, -y]);
  const buckets = signed.map(row => row.indexOf(Math.max(...row))), order = records.map((_, id) => id).sort((a, b) => buckets[a] - buckets[b] || a - b);
  return <SparseDrawing width={860} height={1400} label="A constructed identity random projection gives signed-axis products, argmax bucket IDs and a sorted order carrying original position IDs; causal permission uses original positions after local gathering">
    <SparseCells x={36} y={68} values={records} width={110} role="input" label="Supplied shared Q/K rows" rowLabels={records.map((_, id) => id)}/>
    <SparseCells x={535} y={68} values={[[1, 0], [0, 1]]} width={110} role="input" label="Fixed R = identity for this arithmetic"/>
    <SparseArrow path="M146 308 V379 H392"/><SparseArrow path="M645 148 V379 H468"/><SparseOperation x={430} y={379} symbol="[xR, −xR]" width={178}/>
    <SparseArrow x1={430} y1={396} x2={430} y2={456}/><SparseCells x={210} y={456} values={signed} width={110} label="Four signed-axis products for every original record"/>
    <SparseArrow x1={430} y1={696} x2={430} y2={748}/><SparseOperation x={430} y={765} symbol="argmax" width={112}/>
    <SparseArrow x1={430} y1={782} x2={430} y2={839}/><SparseCells x={78} y={839} values={[buckets]} width={112} label="Bucket ID, still in original order"/>
    <SparseArrow x1={430} y1={879} x2={430} y2={936}/><SparseOperation x={430} y={953} symbol="sort (bucket, original ID)" width={296}/>
    <SparseArrow x1={430} y1={970} x2={430} y2={1028}/><SparseCells x={78} y={1028} values={[order]} width={112} label="Sorted records retain their original IDs"/>
    <SparseCells x={240} y={1190} values={[[0, 4], ['yes', '×']]} width={130} label="Illustrative gathered pair for receiver original ID 0"/>
    <SparseArrow path="M414 1068 V1149 H370 V1190"/>
    <SparseText x={430} y={1328}>Original ID 4 is future even though sorting placed it beside ID 0.</SparseText>
    <SparseText x={430} y={1366}>Real LSH attention adds prescribed neighbouring chunks, rounds and match rules.</SparseText>
  </SparseDrawing>;
}

export function SparseRoutingDrawing() {
  const raw = [[2, 0], [0, 2], [1, .5], [-1, 0]], centroids = [[1, -1], [-1, 1]];
  const normalized = raw.map(row => sparseNormalizationTrace(row, [1, 1], [0, 0]).output);
  const distances = normalized.map(row => centroids.map(center => row.reduce((total, value, coordinate) => total + (value - center[coordinate]) ** 2, 0)));
  const assignment = distances.map(row => row[0] <= row[1] ? 0 : 1);
  return <SparseDrawing width={840} height={950} label="Affine-free LayerNorm transforms actual supplied records; squared distances to two stipulated centroid coordinates choose routing IDs before candidate-budget balancing">
    <SparseCells x={38} y={69} values={raw} width={120} role="input" label="Four supplied records"/>
    <SparseArrow x1={158} y1={229} x2={158} y2={292}/><SparseOperation x={158} y={309} symbol="LN; ε = 1e−5" width={188}/>
    <SparseArrow x1={158} y1={326} x2={158} y2={389}/><SparseCells x={38} y={389} values={normalized} width={120} label="No learned gain or offset"/>
    <SparseCells x={535} y={389} values={centroids} width={120} role="parameter" label="Two stipulated centroid rows"/>
    <SparseArrow path="M158 549 V618 H361"/><SparseArrow path="M655 469 V618 H479"/><SparseOperation x={420} y={618} symbol="Σ (x − center)²" width={218}/>
    <SparseArrow x1={420} y1={635} x2={420} y2={688}/><SparseCells x={38} y={688} values={distances.map((row, record) => [...row, assignment[record]])} width={180} label="Distance to centroid 0, centroid 1; then nearest-centroid ID"/>
    <SparseText x={420} y={891}>A routing budget may rebalance/gather candidates; nearest IDs alone do not bound work.</SparseText>
    <SparseText x={420} y={929}>Affine-free LN is not exact Euclidean unit normalization.</SparseText>
  </SparseDrawing>;
}

export function SparseOrthogonalSamplesDrawing() {
  const scenes = [
    {name:'Two illustrative IID rows',rows:[[2,0],[1.5*Math.cos(.8),1.5*Math.sin(.8)]],orthogonal:false},
    {name:'Illustrative orthogonal block',rows:[[2,0],[0,1.5]],orthogonal:true},
  ];
  return <div className="sparse-flow-independent-scenes">{scenes.map(scene=><SparseDrawing key={scene.name} height={560} label={`${scene.name}; labelled direction and radius, with separately drawn orthogonality constraint`}>
    <SparseText x={170} y={30}>{scene.name}</SparseText>
    <path d="M50 290 H300 M90 330 V70" stroke={sparseColors.edge} fill="none"/>
    {scene.rows.map((row,sample)=><g key={sample}>
      <SparseArrow x1={90} y1={290} x2={90+row[0]*90} y2={290-row[1]*90}/>
      <path d={`M${90+row[0]*90} ${290-row[1]*90} L${sample===0?250:190} ${sample===0?304:128}`} stroke={sparseColors.edge} fill="none"/>
      <SparseText x={sample===0?250:190} y={sample===0?320:120}>Row {sample}; radius {sample===0?'2':'1.5'}.</SparseText>
      <SparseCells x={40} y={380+sample*75} values={row} width={130} role="input" label={`Actual projection row ${sample}`}/>
    </g>)}
    {scene.orthogonal&&<path d="M90 268 H112 V290" stroke={sparseColors.operation} fill="none"/>}
    <SparseText x={170} y={535}>{scene.orthogonal?'Right angle; separate chi radii.':'No forced right angle.'}</SparseText>
  </SparseDrawing>)}</div>;
}

export function SparseVarianceDrawing({ magnitude=1, features=64 }) {
  const match=Math.exp(magnitude*magnitude), variance=Math.exp(2*magnitude*magnitude)*(Math.exp(4*magnitude*magnitude)-1)/features;
  const rows=Array.from({length:33},(_,index)=>{const x=index/16;return[x,Math.log10(Math.exp(2*x*x)*(Math.exp(4*x*x)-1)/features+1e-12)];});
  const x=value=>60+value*120, y=value=>278-(value+12)/24*220;
  return <SparseDrawing height={620} label="Analytic IID positive-Gaussian kernel-estimator variance for scalar x equals y, with log10 variance on the vertical axis; this is a formula curve, not measured model error">
    <path d="M60 50 V278 H300" stroke={sparseColors.edge} fill="none"/>
    <polyline points={rows.map(row=>`${x(row[0])},${y(row[1])}`).join(' ')} stroke={sparseColors.computed} fill="none"/>
    {[0,1,2].map(value=><SparseText key={value} x={x(value)} y={305}>{value}</SparseText>)}
    {[-12,0,12].map(value=><SparseText key={value} x={50} y={y(value)+5} anchor="end">{value}</SparseText>)}
    <circle cx={x(magnitude)} cy={y(Math.log10(variance+1e-12))} r={5} fill={sparseColors.computed}/>
    <SparseText x={170} y={345}>Horizontal: x = y = scalar magnitude.</SparseText>
    <SparseText x={170} y={377}>Vertical: log₁₀ analytic variance.</SparseText>
    <SparseText x={170} y={414}>IID sample count m = {features}.</SparseText>
    <SparseCells x={40} y={475} values={[[match,variance]]} width={130} label="Expected kernel; estimator variance"/>
    <SparseText x={170} y={559}>Variance belongs to the unnormalized</SparseText>
    <SparseText x={170} y={589}>kernel estimate, not its output ratio.</SparseText>
  </SparseDrawing>;
}

export function SparseFixedRadiusDrawing() {
  const plus=Math.exp(1),minus=Math.exp(-3),fixed=(plus+minus)/2;
  return <SparseDrawing height={750} label="At x equals y equals one, a fixed-radius sample is plus or minus one and gives the wrong expected kernel; a Gaussian draw must have its Gaussian radial distribution">
    <SparseCells x={40} y={75} values={[[1,-1]]} width={130} role="input" label="Fixed-radius ω: two equiprobable signs"/>
    <SparseArrow x1={170} y1={115} x2={170} y2={178}/><SparseOperation x={170} y={195} symbol="exp(2ω − 1)" width={182}/>
    <SparseArrow x1={170} y1={212} x2={170} y2={275}/><SparseCells x={40} y={275} values={[[plus,minus]]} width={130} label="Two pair products at x = y = 1"/>
    <SparseArrow x1={170} y1={315} x2={170} y2={377}/><SparseOperation x={170} y={394} symbol="average" width={108}/>
    <SparseArrow x1={170} y1={411} x2={170} y2={475}/><SparseCells x={95} y={475} values={[fixed]} width={150} label="Fixed-radius expectation"/>
    <SparseCells x={95} y={603} values={[Math.E]} width={150} label="Gaussian expectation: exp(xy)"/>
    <SparseText x={170} y={699}>Orthogonal directions alone do not</SparseText>
    <SparseText x={170} y={731}>replace the required chi radii.</SparseText>
  </SparseDrawing>;
}

export function SparseTrialsDrawing({ seed=5 }) {
  const x=features=>({16:85,64:265,256:445})[features],y=error=>345-error*3300;
  return <SparseDrawing width={760} height={490} label="All 24 recorded random-feature output errors from eight fixed seeds and three feature counts, with a selected seed highlighted; this is the retained trained-head study, separate from the live edited case">
    <path d="M85 65 V345 H445" fill="none" stroke={sparseColors.edge}/>
    {[0,.04,.08].map(error=><g key={error}><SparseText x={72} y={y(error)+5} anchor="end">{number(error,2)}</SparseText><path d={`M85 ${y(error)} H445`} stroke={sparseColors.edge} opacity={.22}/></g>)}
    {[16,64,256].map(features=><SparseText key={features} x={x(features)} y={379}>{features}</SparseText>)}
    {Array.from({length:8},(_,currentSeed)=>{
      const trials=examples.trials.filter(trial=>trial.seed===currentSeed),color=currentSeed===seed?sparseColors.computed:sparseColors.edge;
      const end=trials.at(-1),labelY=44+currentSeed*42;
      return <g key={currentSeed}>
        <polyline points={trials.map(trial=>`${x(trial.features)},${y(trial.relative_output_l2_error)}`).join(' ')} stroke={color} strokeWidth={currentSeed===seed?3:1} opacity={currentSeed===seed?1:.65} fill="none"/>
        {trials.map(trial=><circle key={trial.features} cx={x(trial.features)} cy={y(trial.relative_output_l2_error)} r={currentSeed===seed?4:2} fill={color}/>)}
        <path d={`M445 ${y(end.relative_output_l2_error)} H${465+currentSeed*7} V${labelY} H580`} stroke={color} fill="none"/>
        <SparseText x={588} y={labelY+5} anchor="start" role={currentSeed===seed?'computed':'operation'}>Seed {currentSeed}</SparseText>
      </g>;
    })}
    <SparseText x={270} y={420}>Horizontal: sampled-feature count.</SparseText>
    <SparseText x={380} y={459}>Vertical: relative L₂ error of complete head output, not training loss.</SparseText>
  </SparseDrawing>;
}

export function SparseBudgetDrawing({ length=1024, window=5, features=8 }) {
  const heads=3,keyWidth=8,valueWidth=8,bytes=4,retained=Math.min(length,window);
  const shownIds=(first,count)=>count<=4?Array.from({length:count},(_,offset)=>first+offset):[first,first+1,'…',first+count-1];
  const lanes=[
    {name:'Dense individual memory',ids:shownIds(0,length),payload:heads*length*(keyWidth+valueWidth)*bytes},
    {name:'Window individual memory',ids:shownIds(length-retained,retained),payload:heads*retained*(keyWidth+valueWidth)*bytes},
  ];
  const densePairs=length*(length+1)/2,w=Math.min(length,window),windowPairs=w*(w+1)/2+(length-w)*w;
  return <SparseDrawing width={780} height={950} label="Analytic retained-state and pair-product counts for three eight-wide heads; dense/window keep separate record entries, feature memory keeps an m by eight state and m normalizer">
    {lanes.map((lane,index)=><g key={lane.name}>
      <SparseCells x={50} y={80+index*195} values={[lane.ids.map(id=>`K/V ${id}`)]} width={170} role="computed" label={lane.name}/>
      <SparseText x={390} y={167+index*195}>Float32 retained payload: {lane.payload.toLocaleString('en-US')} bytes.</SparseText>
    </g>)}
    <SparseCells x={50} y={490} values={[[`S[0,0]`,`S[0,1]`],[`S[1,0]`,`S[1,1]`]]} width={140} label={`S: ${features} rows × 8 columns`}/>
    <SparseCells x={550} y={490} values={['z[0]','z[1]']} width={90} label={`Two of ${features} key-sum entries`}/>
    <SparseText x={390} y={602}>Only the upper-left 2 × 2 of each head's state is shown.</SparseText>
    <SparseText x={390} y={636}>Feature-state payload: {(heads*features*(valueWidth+1)*bytes).toLocaleString('en-US')} bytes.</SparseText>
    <SparseCells x={140} y={730} values={[[densePairs,windowPairs]]} width={250} label="Legal causal pairs per head: dense, window"/>
    <SparseText x={390} y={845}>Counts exclude projections, feature-map evaluation, temporary storage and metadata.</SparseText>
    <SparseText x={390} y={883}>For each feature write/read, coordinate products depend on m × value width.</SparseText>
    <SparseText x={390} y={921}>These are analytic quantities; no execution-time or model-quality estimate is shown.</SparseText>
  </SparseDrawing>;
}

export function SparseFlexDrawing() {
  const query=[1,0],keys=[[1,.5],[0,1]],values=[2,-1],scores=keys.map(key=>(query[0]*key[0]+query[1]*key[1])/Math.sqrt(2));
  return <SparseDrawing width={740} height={1250} label="A partial block contains one permitted and one future source; actual scores receive an independent score modification, the partial-cell permission and normalized weights before reading values">
    <SparseCells x={50} y={65} values={query} width={110} role="input" label="Receiving query at position 0"/>
    <SparseCells x={470} y={65} values={keys} width={110} role="input" label="Actual keys at source IDs 0 and 1"/>
    <SparseArrow path="M160 105 V209 H332"/><SparseArrow path="M580 145 V209 H408"/><SparseOperation x={370} y={209} symbol="QKᵀ / √2" width={156}/>
    <SparseArrow x1={370} y1={226} x2={370} y2={287}/><SparseCells x={260} y={287} values={scores} width={110} label="Computed tile-row scores"/>
    <SparseText x={160} y={396}>Partial block: IDs, permissions.</SparseText><SparseCells x={50} y={443} values={[[0,1],['yes','×']]} width={110}/>
    <SparseText x={580} y={396}>Score modification: identity.</SparseText><SparseCells x={470} y={443} values={['s+0','s+0']} width={110} role="operation"/>
    <SparseArrow x1={370} y1={327} x2={370} y2={599}/><SparseArrow path="M160 523 V616 H332"/><SparseArrow path="M580 483 V616 H408"/>
    <SparseOperation x={370} y={616} symbol="modify score; mask cell" width={264}/>
    <SparseArrow x1={370} y1={633} x2={370} y2={693}/><SparseCells x={260} y={693} values={[scores[0],'−∞']} width={110} label="Only permitted scores enter this read"/>
    <SparseArrow x1={370} y1={733} x2={370} y2={787}/><SparseOperation x={370} y={804} symbol="stable softmax" width={188}/>
    <SparseArrow x1={370} y1={821} x2={370} y2={878}/><SparseCells x={260} y={878} values={[1,0]} width={110} label="Normalized weights"/>
    <SparseCells x={45} y={995} values={values} width={110} role="input" label="Matching source values"/>
    <SparseArrow path="M370 918 V1088 H408"/><SparseArrow path="M155 1035 V1088 H332"/><SparseOperation x={370} y={1088} symbol="Σ weight × V" width={180}/>
    <SparseArrow x1={370} y1={1105} x2={370} y2={1167}/><SparseCells x={300} y={1167} values={[2]} width={140} label="Returned output"/>
  </SparseDrawing>;
}

export function SparseHierarchicalSelectionDrawing() {
  const scores=[.2,.6,.1,.8,.3,.7,.4,.5],maxima=[.6,.8,.7,.5],selectedBlocks=[1,2],pool=selectedBlocks.flatMap(block=>[2*block,2*block+1]);
  return <SparseDrawing width={900} height={1130} label="A constructed hierarchical candidate pool takes block maxima, keeps two blocks, then rescores only their original record IDs; the initial pass still visits every source">
    <SparseCells x={34} y={78} values={scores} width={104} role="input" label="Illustrative initial scores at all eight original source IDs"/>
    <SparseArrow x1={450} y1={118} x2={450} y2={184}/><SparseOperation x={450} y={201} symbol="maximum within each two-record block" width={430}/>
    <SparseArrow x1={450} y1={218} x2={450} y2={279}/><SparseCells x={242} y={279} values={maxima} width={104} label="Four block maxima, no source omitted yet"/>
    <SparseArrow x1={450} y1={319} x2={450} y2={381}/><SparseOperation x={450} y={398} symbol="top two block IDs" width={226}/>
    <SparseArrow x1={450} y1={415} x2={450} y2={477}/><SparseCells x={346} y={477} values={selectedBlocks} width={104} label="Block IDs 1 and 2"/>
    <SparseArrow x1={450} y1={517} x2={450} y2={580}/><SparseOperation x={450} y={597} symbol="gather original IDs" width={238}/>
    <SparseArrow x1={450} y1={614} x2={450} y2={676}/><SparseCells x={242} y={676} values={pool} width={104} label="Candidate source IDs 2, 3, 4, 5"/>
    <SparseCells x={46} y={827} values={['fresh Qᵢ']} width={154} label="Later indexer query"/>
    <SparseArrow path="M123 867 V930 H326"/><SparseArrow x1={450} y1={716} x2={450} y2={913}/><SparseOperation x={450} y={930} symbol="rescore these original keys" width={316}/>
    <SparseArrow x1={450} y1={947} x2={450} y2={1010}/><SparseCells x={242} y={1010} values={['new I₂','new I₃','new I₄','new I₅']} width={104} label="Later scores are new; omitted IDs cannot re-enter this restricted pool"/>
    <SparseText x={450} y={1100}>This arithmetic illustrates ownership; actual learned indexer scores are not supplied here.</SparseText>
  </SparseDrawing>;
}
