import { useMemo, useState } from 'react';
import { attentionFixtures, attentionRow, basisChange, basisPresets, basisVectors, contractionOrders, contractionPresets, inspectContraction } from '../../data/einsum-models.js';
import { Figure, Panels, Panel, Scene, Arrow, Matrix, TensorSlabs, ContractionDrawing, ProductJoin, NumericTable, Plane, SignedAreas, DimensionGrid, OrderTree, X, f, pair, dot, mm, transpose, sum } from './EinsumDrawings';
function Lab({
  id,
  label,
  children
}) {
  return <section className="ef-lab flow-lab" data-lab={id} aria-label={label}>{children}</section>;
}
function Select({
  label,
  value,
  onChange,
  options
}) {
  return <label>{label}<select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(([v, name]) => <option key={v} value={v}>{name}</option>)}</select></label>;
}
function Reset({
  onClick,
  name
}) {
  return <button type="button" onClick={onClick}>Reset {name}</button>;
}
export function safeInspect(expression, operands) {
  const state = inspectContraction(expression, operands);
  if (state.cells.some(cell => !Number.isFinite(cell.value) || cell.terms.some(t => !Number.isFinite(t.product)))) throw new Error('Products or sums overflowed; use smaller finite entries.');
  return state;
}
export function TensorAddressLab() {
  const [address, setAddress] = useState([1, 0, 2]);
  return <Lab id="tensor-address" label="Select a three-axis tensor address"><Figure name="tensor-address-live" caption={`The current address X${pair(address)} reads ${X[address[0]][address[1]][address[2]]}. The white cell keeps the same address through the full slice and feature fiber.`}><TensorSlabs selected={address} /><Matrix values={X[address[0]][address[1]]} label={`Fiber X[${address[0]},${address[1]},:]`} kind={address[0] ? 'right' : 'left'} selected={[[0, address[2]]]} /></Figure><div className="ef-controls">{['Experiment b', 'Observation n', 'Feature d'].map((name, axis) => <Select key={name} label={name} value={address[axis]} onChange={v => setAddress(address.map((x, i) => i === axis ? Number(v) : x))} options={Array.from({
        length: [2, 3, 4][axis]
      }, (_, i) => [i, String(i)])} />)}<Reset name="address" onClick={() => setAddress([1, 0, 2])} /></div></Lab>;
}
export function CoreContractionLab() {
  const [preset, setPreset] = useState('product'),
    [cell, setCell] = useState(1);
  const unit = contractionPresets[preset],
    state = safeInspect(unit.expression, unit.operands);
  return <Lab id="core-contraction" label="Trace one taught contraction"><Figure name="core-contraction-live" caption={`${unit.expression}; the selected output is${pair(state.cells[cell].coordinates)}. Input colours retain operand identity; white grid outlines select the source addresses.`}><ContractionDrawing state={state} operands={unit.operands} cellIndex={cell} /></Figure><div className="ef-controls"><Select label="Taught operation" value={preset} onChange={v => {
        setPreset(v);
        setCell(0);
      }} options={[['product', 'Matrix product'], ['outer', 'Outer product'], ['elementwise', 'Matching-cell product']]} /><Select label="Output address" value={cell} onChange={v => setCell(Number(v))} options={state.cells.map((c, i) => [i, pair(c.coordinates)])} /><Reset name="contraction" onClick={() => {
        setPreset('product');
        setCell(1);
      }} /></div></Lab>;
}
export function RulesInspectorLab() {
  const defaultUnit = contractionPresets.product;
  const [preset, setPreset] = useState('product'),
    [expression, setExpression] = useState(defaultUnit.expression),
    [draft, setDraft] = useState(JSON.stringify(defaultUnit.operands)),
    [cell, setCell] = useState(1);
  const current = useMemo(() => {
    try {
      const operands = JSON.parse(draft);
      return {
        operands,
        state: safeInspect(expression, operands)
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }, [draft, expression]);
  const active = current.state ? Math.min(cell, current.state.cells.length - 1) : 0;
  function choose(v) {
    const next = contractionPresets[v];
    setPreset(v);
    setExpression(next.expression);
    setDraft(JSON.stringify(next.operands));
    setCell(0);
  }
  return <Lab id="rules-inspector" label="Inspect an explicit finite sum">{current.error ? <p className="ef-error" role="alert">Current draft has no computed output: {current.error}</p> : <Figure name="rules-inspector-live" caption="Change the expression or JSON arrays below. Every valid edit immediately recomputes the addressed products; invalid drafts clear this result."><ContractionDrawing state={current.state} operands={current.operands} cellIndex={active} /></Figure>}<div className="ef-controls"><Select label="Inspector starting example" value={preset} onChange={choose} options={Object.entries(contractionPresets).map(([key, value]) => [key, value.name])} /><label className="ef-editor">Explicit expression<input aria-label="Explicit expression" value={expression} onChange={e => setExpression(e.target.value)} spellCheck={false} /></label><label className="ef-editor">Operand list as JSON<textarea aria-label="Operand list as JSON" value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false} /></label>{current.state && <Select label="Inspector output address" value={active} onChange={v => setCell(Number(v))} options={current.state.cells.map((c, i) => [i, pair(c.coordinates)])} />}<Reset name="inspector" onClick={() => {
        choose('product');
        setCell(1);
      }} /></div></Lab>;
}
export function BatchPairLab() {
  const [operation, setOperation] = useState('paired'),
    [order, setOrder] = useState('original');
  const X = [[1, 0], [0, 1]],
    originalY = [[2, 5], [7, 11]],
    Y = order === 'original' ? originalY : [...originalY].reverse(),
    results = operation === 'paired' ? X.map((row, b) => dot(row, Y[b])) : mm(X, transpose(Y));
  return <Lab id="batch-pairing" label="Compare aligned versus all-pairs batches"><Figure name="batch-pairing-live" caption={`Y's current row identities are${order === 'original' ? 'case0,case1' : 'case1,case0'}. Matching the label b pairs row positions; it cannot restore a swapped case identity.`}><Panels><Matrix values={X} label="X rows; case0,case1" rowLabels={['case0', 'case1']} /><Matrix values={Y} label="Y rows; current case order" kind="right" rowLabels={order === 'original' ? ['case0', 'case1'] : ['case1', 'case0']} /><Matrix values={results} label={operation === 'paired' ? 'bi,bi→b; paired result' : 'bi,ci→bc; all-pairs result'} /></Panels><Scene label="Current row-position pairing edges" width={400} height={270}>{[0, 1].map(b => <g key={b}><circle className="ef-node left" cx={50} cy={70 + 120 * b} r={26} /><text x={50} y={75 + 120 * b} textAnchor="middle">X{b}</text>{(operation === 'paired' ? [b] : [0, 1]).map(c => <Arrow key={c} from={[78, 70 + 120 * b]} to={[322, 70 + 120 * c]} kind={b === c ? 'left' : 'right'} dashed={b !== c} />)}<circle className="ef-node right" cx={350} cy={70 + 120 * b} r={26} /><text x={350} y={75 + 120 * b} textAnchor="middle">Y{order === 'original' ? b : 1 - b}</text></g>)}<text x={18} y={253}>Letters name axes; case identity comes from data.</text></Scene></Figure><div className="ef-controls"><Select label="Batch comparison" value={operation} onChange={setOperation} options={[['paired', 'Matching rows'], ['all', 'All row pairs']]} /><Select label="Y case order" value={order} onChange={setOrder} options={[['original', 'Original'], ['swapped', 'Swapped']]} /><Reset name="batch pairing" onClick={() => {
        setOperation('paired');
        setOrder('original');
      }} /></div></Lab>;
}
export function covarianceState(shift = 0, operation = 'centered') {
  const rows = [[1, 2 + shift], [3, shift], [5, 4 + shift]],
    mean = [3, 2 + shift],
    centered = rows.map(row => row.map((x, d) => x - mean[d])),
    source = operation === 'centered' ? centered : rows,
    divisor = operation === 'centered' ? 2 : 1;
  return {
    rows,
    mean,
    centered,
    source,
    divisor,
    result: mm(transpose(source), source).map(row => row.map(x => x / divisor))
  };
}
export function CovarianceCenterLab() {
  const [operation, setOperation] = useState('centered'),
    [shift, setShift] = useState(0),
    state = covarianceState(shift, operation);
  return <Lab id="covariance-centering" label="Center observations before a covariance sum"><Figure name="covariance-centering-live" caption={operation === 'centered' ? 'Mean subtraction moves these same three observations to offsets. Products use the centered entries and divisor N−1=2.' : 'This is an uncentered Gram sum with divisor 1. The translated raw frame still spans eight units; the full values remain visible.'}><Panels><Panel title={`Raw observations; y translation${shift}`}><Plane label="Three original observations and their mean" domain={[[-1, 7], [shift - 1, shift + 7]]} points={[...state.rows.map((value, i) => ({
            value,
            label: `row${i}`,
            slot: [322, 45 + 24 * i]
          })), {
            value: state.mean,
            selected: true,
            label: 'mean',
            slot: [322, 124]
          }]} xLabel="feature0" yLabel={`feature1; raw offset${shift}`} /></Panel><Panel title="Centered observation offsets"><Plane label="Three mean-centered observations" domain={[-4, 4]} points={state.centered.map((value, i) => ({
            value,
            label: `row${i}`,
            slot: [322, 45 + 24 * i]
          }))} vectors={state.centered.map(value => ({
            to: value,
            kind: 'left'
          }))} xLabel="feature0 offset" yLabel="feature1 offset" /></Panel></Panels><Matrix values={state.source} label={operation === 'centered' ? 'Centered entries used in products' : 'Raw entries used in products'} /><ProductJoin label="Selected feature0×feature1 contributions" terms={state.source.map((row, n) => ({
        a: row[0],
        b: row[1],
        product: row[0] * row[1],
        name: `row${n}`
      }))} sumLabel={`Product-sum numerator (before division by ${state.divisor})`} />{operation === 'centered' && <SignedAreas terms={state.centered.map(row => row)} label="Centered signed cross-products" />}<Matrix values={state.result} label={operation === 'centered' ? 'Sample covariance; divisor 2' : 'Uncentered Gram; divisor 1'} selected={[[0, 1]]} /><NumericTable label="Raw mean and the operation's normalization" headers={['Raw mean', 'Divisor', 'Selected result']} rows={[[pair(state.mean), state.divisor, state.result[0][1]]]} /></Figure><div className="ef-controls"><Select label="Feature relationship operation" value={operation} onChange={setOperation} options={[['centered', 'Centered sample covariance'], ['raw', 'Uncentered Gram sum']]} /><Select label="Feature1 translation" value={shift} onChange={v => setShift(Number(v))} options={[[0, '0'], [100, '+100']]} /><Reset name="covariance" onClick={() => {
        setOperation('centered');
        setShift(0);
      }} /></div></Lab>;
}
function WeightBars({
  rows
}) {
  return <Scene label="Attention weights on a fixed0-to1 scale" width={400} height={225}>{rows.map((row, s) => <g key={s}><text x={12} y={29 + 62 * s}>key{s}</text><line className="ef-reference" x1={80} x2={330} y1={40 + 62 * s} y2={40 + 62 * s} /><rect className="ef-area left" x={80} y={26 + 62 * s} width={250 * row.weight} height={28} /><text x={340} y={45 + 62 * s}>{f(row.weight)}</text></g>)}<text x={80} y={221}>0</text><text x={330} y={221}>1</text></Scene>;
}
export function AttentionContractionLab() {
  const [batch, setBatch] = useState(0),
    [query, setQuery] = useState(0),
    [allowed, setAllowed] = useState([true, false, true]),
    [scaled, setScaled] = useState(true);
  let state, error;
  try {
    state = attentionRow(batch, query, allowed, scaled);
  } catch (e) {
    error = e.message;
  }
  const fixture = attentionFixtures[batch];
  return <Lab id="attention-contraction" label="Masked query-to-value retrieval"><Figure name="attention-contraction-live" caption="Each allowed score produces a positive shifted mass. The mass total normalizes the weights; each weight multiplies the value belonging to the same key identity."><Panels><Matrix values={fixture.queries} label={`Q; batch${batch}, selected query${query}`} selected={fixture.queries[query].map((_, d) => [query, d])} /><Matrix values={fixture.keys} label="K; three keys, two comparison features" kind="right" /><Matrix values={fixture.values} label="V; same three key identities" /></Panels><NumericTable label="Current key admission" headers={['Key', 'Allowed']} rows={allowed.map((yes, key) => [key, yes ? 'yes' : 'blocked; mass 0'])} />{error ? <p className="ef-error" role="alert">Current mask has no normalized output: {error}</p> : <><Panels>{state.rows.map(row => <Panel key={row.key} title={`Key${row.key}${allowed[row.key] ? '' : ' (blocked)'}`}><ProductJoin label={`Query${query} dot key${row.key}`} terms={row.products.map((product, d) => ({
              a: state.q[d],
              b: fixture.keys[row.key][d],
              product,
              name: `d=${d}`
            }))} /></Panel>)}</Panels><NumericTable label="Scores, shifted masses, weights and actual value contributions" headers={['Key', 'Scaled score', 'Shifted', 'Mass', 'Weight', 'Value', 'Contribution']} rows={state.rows.map(row => [row.key, row.score, allowed[row.key] ? row.score - state.maximum : 'blocked', allowed[row.key] ? Math.exp(row.score - state.maximum) : 0, row.weight, pair(row.value), pair(row.contribution)])} /><WeightBars rows={state.rows} /><Plane label="Weighted values join in the shared value-feature plane" domain={[[-1, 11], [-1, 7]]} vectors={state.rows.map((row, i) => {
          const from = [0, 1].map(d => sum(state.rows.slice(0, i).map(r => r.contribution[d])));
          return {
            from,
            to: from.map((x, d) => x + row.contribution[d]),
            kind: i % 2 ? 'right' : 'left',
            label: `key${i}: ${pair(row.contribution)}`
          };
        }).concat([{
          to: state.context,
          kind: 'result',
          dashed: true,
          label: `context=${pair(state.context)}`
        }])} xLabel="value feature0" yLabel="value feature1" /><p className="ef-readout">Allowed maximum {f(state.maximum)}; mass total {f(state.denominator)}; sum of weights {f(sum(state.rows.map(row => row.weight)))}. Context {pair(state.context)}.</p></>}</Figure><div className="ef-controls"><Select label="Attention batch" value={batch} onChange={v => setBatch(Number(v))} options={[[0, '0'], [1, '1']]} /><Select label="Attention query" value={query} onChange={v => setQuery(Number(v))} options={[[0, '0'], [1, '1']]} />{allowed.map((yes, key) => <label className="ef-checkbox" key={key}><input type="checkbox" aria-label={`Allow key${key}`} checked={yes} onChange={e => setAllowed(allowed.map((x, i) => i === key ? e.target.checked : x))} />Allow key{key}</label>)}<label className="ef-checkbox"><input type="checkbox" aria-label="Divide attention scores by square root D" checked={scaled} onChange={e => setScaled(e.target.checked)} />Divide by√D</label><Reset name="attention" onClick={() => {
        setBatch(0);
        setQuery(0);
        setAllowed([true, false, true]);
        setScaled(true);
      }} /></div></Lab>;
}
export function ContractionOrderLab() {
  const [drafts, setDrafts] = useState(['5', '40', '2', '30']);
  const dimensions = drafts.map(Number);
  let counts, error;
  try {
    counts = contractionOrders(dimensions);
  } catch (e) {
    error = e.message;
  }
  return <Lab id="contraction-order" label="Choose which matched axis to eliminate first">{error ? <p role="alert" className="ef-error">Current dimensions have no plan output: {error}</p> : <Figure name="contraction-order-live" caption="The same final shape is obtained by two different elimination trees. Exact dense multiplication counts and first-temporary entry counts appear beside their own intermediate shapes; the grid is representative."><Panels><OrderTree dimensions={dimensions} counts={counts.left} /><OrderTree dimensions={dimensions} first="right" counts={counts.right} /></Panels><Panels><DimensionGrid label="A" rows={dimensions[0]} columns={dimensions[1]} /><DimensionGrid label="B" rows={dimensions[1]} columns={dimensions[2]} kind="right" /><DimensionGrid label="C" rows={dimensions[2]} columns={dimensions[3]} /></Panels><p className="ef-readout">{counts.left.total === counts.right.total ? 'The counts tie.' : `${counts.left.total < counts.right.total ? 'Left' : 'Right'} first uses fewer scalar multiplications.`} Final output {dimensions[0]}×{dimensions[3]}. These counts do not measure hardware time or peak resident memory.</p></Figure>}<div className="ef-controls">{['a', 'b', 'c', 'd'].map((name, i) => <label key={name}>Axis length {name}<input aria-label={`Axis length ${name}`} type="number" min={1} max={100} step={1} value={drafts[i]} onChange={e => setDrafts(drafts.map((x, j) => j === i ? e.target.value : x))} /></label>)}<Reset name="order" onClick={() => setDrafts(['5', '40', '2', '30'])} /></div></Lab>;
}
export function levelLines(domain = [-4.5, 4.5]) {
  const [lo, hi] = domain;
  return [-6, 0, 6].map(c => {
    const points = [[lo, 2 * lo - c], [hi, 2 * hi - c], [(lo + c) / 2, lo], [(hi + c) / 2, hi]].filter(([x, y]) => x >= lo && x <= hi && y >= lo && y <= hi).filter((p, i, a) => a.findIndex(q => q[0] === p[0] && q[1] === p[1]) === i);
    return {
      points: points.slice(0, 2),
      label: `ℓ=${c}`,
      slot: [330, 45 + 25 * (c + 6) / 6]
    };
  });
}
function CoordinatePicture({
  state,
  vector,
  functional = false
}) {
  const first = state.S.map(row => row[0] * state.coordinates[0]);
  return <Plane label={functional ? 'Same physical vector with functional level lines' : 'Same physical vector assembled along the selected basis'} domain={[-4.5, 4.5]} lines={functional ? levelLines() : []} vectors={[{
    to: state.S.map(row => row[0]),
    kind: 'left',
    label: `basis0=${pair(state.S.map(row => row[0]))}`
  }, {
    to: state.S.map(row => row[1]),
    kind: 'right',
    label: `basis1=${pair(state.S.map(row => row[1]))}`
  }, {
    to: first,
    kind: 'left',
    dashed: true,
    label: `component0=${pair(first)}`
  }, {
    from: first,
    to: vector,
    kind: 'right',
    dashed: true,
    label: `component1=${pair(state.S.map(row => row[1] * state.coordinates[1]))}`
  }, {
    to: vector,
    kind: 'result',
    label: `physical v=${pair(vector)}`
  }]} />;
}
function BasisLab({
  mode
}) {
  const [basis, setBasis] = useState('shear'),
    [index, setIndex] = useState(0),
    vector = basisVectors[index],
    state = basisChange(basis, vector);
  const names = {
    vector: 'vector coordinates',
    functional: 'functional coordinates',
    metric: 'metric coordinates'
  };
  const terms = state.metric.flatMap((row, i) => row.map((value, j) => state.coordinates[i] * value * state.coordinates[j]));
  return <Lab id={'basis-' + mode} label={names[mode]}><Figure name={'basis-' + mode + '-live'} caption={mode === 'vector' ? 'The physical white vector stays fixed. Its new coordinate weights assemble the same endpoint along the amber and cyan basis directions.' : mode === 'functional' ? 'Each level line has the same scalar measurement in physical space. The new coefficients act on the new coordinates, preserving that measurement.' : 'Each coordinate pair passes through its own metric entry. The signed terms restore the physical squared length even when a naive coordinate-square sum changes.'}><CoordinatePicture state={state} vector={vector} functional={mode === 'functional'} /><Panels><Matrix values={state.S} label="S; new basis columns in old coordinates" /><Matrix values={state.coordinates} label="New coordinates v′" kind="right" /></Panels>{mode === 'functional' && <><Matrix values={state.newFunctional} label="New functional coefficients f′=Sᵀ[2,−1]" /><ProductJoin label="Functional pairing in new coordinates" terms={state.coordinates.map((a, i) => ({
          a,
          b: state.newFunctional[i],
          product: a * state.newFunctional[i],
          name: `coordinate ${i}`
        }))} /><p className="ef-readout">Old measurement2v₀−v₁={f(state.measurement)}; new pairing={f(state.newMeasurement)}.</p></>}{mode === 'metric' && <><Matrix values={state.metric} label="G′=SᵀS; one entry per coordinate pair" /><NumericTable label="Every metric pair contribution" headers={['i,j', 'v′i', 'G′ij', 'v′j', 'Product']} rows={state.metric.flatMap((row, i) => row.map((value, j) => [pair([i, j]), state.coordinates[i], value, state.coordinates[j], terms[2 * i + j]]))} /><ProductJoin label="Four metric pair contributions join" terms={terms.map((product, t) => ({
          a: state.coordinates[Math.floor(t / 2)] * state.metric[Math.floor(t / 2)][t % 2],
          b: state.coordinates[t % 2],
          product,
          name: `pair${pair([Math.floor(t / 2), t % 2])}`
        }))} /><p className="ef-readout">Naive new-coordinate squares={f(state.coordinateSquares)}. Metric result={f(state.metricNormSquared)}. Old physical squared length={f(state.normSquared)}.</p></>}</Figure><div className="ef-controls"><Select label={`${mode} basis`} value={basis} onChange={setBasis} options={Object.keys(basisPresets).map(key => [key, key])} /><Select label={`${mode} physical vector`} value={index} onChange={v => setIndex(Number(v))} options={basisVectors.map((v, i) => [i, pair(v)])} /><Reset name={names[mode]} onClick={() => {
        setBasis('shear');
        setIndex(0);
      }} /></div></Lab>;
}
export function VectorCoordinatesLab() {
  return <BasisLab mode="vector" />;
}
export function FunctionalCoordinatesLab() {
  return <BasisLab mode="functional" />;
}
export function MetricBasisLab() {
  return <BasisLab mode="metric" />;
}
