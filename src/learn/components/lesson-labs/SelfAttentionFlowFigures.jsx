import { useId } from 'react';
import { attentionRead } from '../../data/self-attention-models.js';
import { flowNumber as f } from './LessonFlow.jsx';
export const attentionColors = {
  input: '#77cddb',
  parameter: '#e4b752',
  computed: '#be9cf5',
  operation: '#e8e6df',
  edge: '#99978f',
  backward: '#eda064'
};
export const attentionFixture = {
  queries: [[1, 0], [0, 1], [1, 1]],
  keys: [[1, 0], [0, 1], [1, 1]],
  values: [[2, 0], [0, 2], [1, 1]]
};
const names = ['A', 'B', 'C', 'D'];
export const attentionVector = values => `[${values.map(v => f(v, 4)).join(', ')}]`;

// Matrices are actual numbered cells with named axes, not prose in node cards.

export function AttentionMatrix({
  label,
  rows,
  columns,
  values,
  role = 'computed',
  selected = -1
}) {
  return <div className="attention-matrix"><span className="attention-matrix-label">{label}</span><table style={{
      '--matrix-color': attentionColors[role]
    }}><thead><tr><th aria-label="row labels" />{columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{values.map((row, i) => <tr key={i} data-selected={i === selected || undefined}><th>{rows[i]}</th>{row.map((v, j) => <td key={j}>{typeof v === 'number' ? f(v, 4) : v}</td>)}</tr>)}</tbody></table></div>;
}
function Drawing({
  label,
  children,
  width = 640,
  height = 260
}) {
  const id = useId();
  return <figure className="attention-flow-drawing"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg></figure>;
}
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = attentionColors.edge,
  dashed = false
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1),
    size = 8;
  const a = `${x2 - size * Math.cos(angle - .45)},${y2 - size * Math.sin(angle - .45)}`,
    b = `${x2 - size * Math.cos(angle + .45)},${y2 - size * Math.sin(angle + .45)}`;
  return <g stroke={color} fill={color}><line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? '5 4' : undefined} /><polygon points={`${x2},${y2} ${a} ${b}`} /></g>;
}
function Text({
  x,
  y,
  children,
  color = attentionColors.operation,
  anchor = 'middle',
  size = 15
}) {
  return <text x={x} y={y} fill={color} textAnchor={anchor} fontSize={size}>{children}</text>;
}
function Values({
  x,
  y,
  values,
  role = 'computed',
  cell = 48,
  digits = 3,
  label
}) {
  return <g><Text x={x + values[0].length * cell / 2} y={y - 12} color={attentionColors[role]}>{label}</Text>{values.map((row, i) => row.map((v, j) => <g key={`${i}-${j}`}><rect x={x + j * cell} y={y + i * cell} width={cell} height={cell} fill={v > 0 ? '#e4b75220' : v < 0 ? '#77cddb20' : 'none'} stroke={attentionColors[role]} /><Text x={x + (j + .5) * cell} y={y + (i + .65) * cell}>{f(v, digits)}</Text></g>))}</g>;
}
export function AttentionProjectionDrawing() {
  return <Drawing label="Three positions with three input coordinates pass through separate learned maps to create queries, keys and values" height={385}>

    <Values x={20} y={122} values={[[1, 0, 0], [0, 1, 0], [0, 0, 1]]} role="input" cell={36} label="Input X: A, B, C rows" />

    {[['query', attentionFixture.queries], ['key', attentionFixture.keys], ['value', attentionFixture.values]].map(([name, values], i) => <g key={name}>

      <Arrow x1={140} y1={175} x2={240} y2={80 + i * 110} />

      <Values x={255} y={40 + i * 110} values={values} cell={28} role="parameter" label={`Learned ${name} map`} />

      <Arrow x1={325} y1={80 + i * 110} x2={395} y2={80 + i * 110} />

      <Values x={425} y={40 + i * 110} values={values} cell={28} label={`${name === 'query' ? 'queries' : `${name}s`}: A, B, C`} />

    </g>)}

    <Text x={108} y={278} color={attentionColors.input}>cyan: supplied input</Text><Text x={285} y={373} color={attentionColors.parameter}>amber: learned maps</Text><Text x={492} y={373} color={attentionColors.computed}>violet: computed vectors</Text>

  </Drawing>;
}
export function AttentionMatchingDrawing({
  query = [1, 0],
  keys = attentionFixture.keys,
  values = attentionFixture.values
}) {
  const result = attentionRead(query, keys, values);
  return <Drawing label="Receiver A compares corresponding query and key coordinates; the separate donor values do not enter the comparison" height={240}>

    <Values x={24} y={97} values={[query]} label="A's query" />

    {keys.map((key, j) => <g key={j}>

      <Arrow x1={132} y1={115} x2={204} y2={48 + j * 70} />

      <Text x={215} y={37 + j * 70} anchor="start">{names[j]} key {attentionVector(key)}</Text>

      <Text x={215} y={59 + j * 70} anchor="start" color={attentionColors.computed}>{query[0]}×{key[0]} + {query[1]}×{key[1]} = {f(result.raw[j], 3)}</Text>

      <Text x={467} y={49 + j * 70} anchor="start">value {attentionVector(values[j])}</Text>

    </g>)}<Text x={327} y={231}>matches select weights; separate values carry information</Text>

  </Drawing>;
}
export function AttentionNormalizationDrawing({
  result = attentionRead([1, 0], attentionFixture.keys, attentionFixture.values)
}) {
  const mass = result.scores.map(Math.exp),
    total = mass.reduce((a, b) => a + b, 0);
  return <Drawing label="Each donor score is scaled, exponentiated into positive mass, then divided by the same receiver-row total" height={235}>

    <Text x={70} y={24}>donor</Text><Text x={188} y={24}>scaled score</Text><Text x={359} y={24}>positive mass</Text><Text x={547} y={24}>row weight</Text>

    {mass.map((m, j) => <g key={j}><Text x={70} y={66 + j * 54}>{names[j]}</Text><Text x={188} y={66 + j * 54} color={attentionColors.computed}>{f(result.scores[j], 4)}</Text><Arrow x1={237} y1={61 + j * 54} x2={285} y2={61 + j * 54} /><rect x={295} y={44 + j * 54} width={Math.min(130, 48 * m)} height={24} fill={attentionColors.computed} fillOpacity=".28" /><Text x={359} y={66 + j * 54}>{f(m, 4)}</Text><Arrow x1={440} y1={61 + j * 54} x2={491} y2={61 + j * 54} /><Text x={547} y={66 + j * 54} color={attentionColors.computed}>{f(result.weights[j], 4)}</Text></g>)}

    <Text x={330} y={223}>divide every mass by the same total {f(total, 4)}</Text>

  </Drawing>;
}
export function AttentionWeightDrawing({
  weights,
  labels = weights.map((_, i) => names[i] || String(i + 1)),
  label = 'Donor coefficients',
  selected
}) {
  return <figure className="attention-flow-weights" aria-label={label}><div className="attention-weight-label">{label} · coefficient scale 0–1</div><div className="attention-flow-bars">{weights.map((v, i) => <div key={i} data-selected={selected === i || undefined}><span>{labels[i]}</span><div className="attention-flow-bar-track"><i style={{
            height: `${v * 100}%`
          }} /></div><output>{f(v, 3)}</output></div>)}</div></figure>;
}
export function AttentionValueDrawing({
  values,
  output
}) {
  const px = x => 58 + (x + 3) * 40,
    py = y => 282 - (y + 3) * 40;
  const cross = (values[1][0] - values[0][0]) * (values[2][1] - values[0][1]) - (values[1][1] - values[0][1]) * (values[2][0] - values[0][0]);
  return <Drawing label={`Donor values and computed mixture on equal coordinate scales; the reachable region is a ${Math.abs(cross) < 1e-10 ? 'line segment' : 'triangle'}`} width={390} height={330}>

    {[...Array(7)].map((_, i) => <g key={i}><line x1={58 + i * 40} x2={58 + i * 40} y1={42} y2={282} stroke="#34332f" /><line y1={42 + i * 40} y2={42 + i * 40} x1={58} x2={298} stroke="#34332f" /><Text x={58 + i * 40} y={303} size={12}>{i - 3}</Text><Text x={40} y={286 - i * 40} size={12}>{i - 3}</Text></g>)}

    {Math.abs(cross) < 1e-10 ? <polyline points={values.map(v => `${px(v[0])},${py(v[1])}`).join(' ')} fill="none" stroke={attentionColors.computed} strokeWidth={3} /> : <polygon points={values.map(v => `${px(v[0])},${py(v[1])}`).join(' ')} fill={attentionColors.computed} fillOpacity=".12" stroke={attentionColors.computed} />}

    {values.map((v, i) => <g key={i}><circle cx={px(v[0])} cy={py(v[1])} r={6} fill={attentionColors.computed} /><Text x={px(v[0]) + 12} y={py(v[1]) - 12} anchor="start">value {names[i]}</Text></g>)}

    <circle cx={px(output[0])} cy={py(output[1])} r={9} fill="none" stroke="#fff" strokeWidth={2} /><line x1={px(output[0])} y1={py(output[1])} x2={105} y2={60} stroke="#fff" /><Text x={105} y={52}>mixture</Text>

    <Text x={178} y={326}>value coordinate 1</Text><Text x={14} y={25} anchor="start">value coordinate 2</Text>

  </Drawing>;
}
export function AttentionLegalDrawing({
  receiver = 1,
  allowed = [true, true, false],
  weights = [0.3302, 0.6698, 0]
}) {
  return <Drawing label={`Legal donor arrows into receiver ${names[receiver]}; crossed paths are blocked before weights are normalized`} height={235}>

    {allowed.map((yes, i) => {
      const x = 70 + i * 150;
      return <g key={i}><circle cx={x} cy={42} r={22} fill="none" stroke={attentionColors.computed} /><Text x={x} y={47}>{names[i]}</Text><Text x={x} y={85}>{i > receiver ? 'future' : 'available'}</Text><Arrow x1={x} y1={99} x2={280} y2={175} color={yes ? attentionColors.edge : '#504e49'} dashed={!yes} /><Text x={x} y={118} color={yes ? attentionColors.computed : '#bbb'}>{yes ? `weight ${f(weights[i], 3)}` : 'blocked: 0'}</Text>{!yes && <Text x={x} y={145}>×</Text>}</g>;
    })}

    <circle cx={280} cy={197} r={22} fill="none" stroke={attentionColors.computed} /><Text x={280} y={202}>{names[receiver]}</Text><Text x={340} y={201} anchor="start">receiving position</Text>

  </Drawing>;
}
export function AttentionHeadDrawing({
  one,
  two,
  inputs = [[1, 0], [0, 1]]
}) {
  const values = two.projected.value,
    weights = two.headReads.map(head => head[0].weights);
  return <Drawing label="Learned value map, separate head value mixtures, concatenation and a distinct identity output projection" width={760} height={730}>

    <Values x={40} y={50} values={inputs} role="input" label="input rows A, B" />

    <Arrow x1={150} y1={95} x2={248} y2={95} />

    <Values x={267} y={50} values={values.every(row => row.every(v => v === 0)) ? [[0, 0], [0, 0]] : [[1, 0], [0, 1]]} role="parameter" label="learned value map" />

    <Arrow x1={375} y1={95} x2={486} y2={95} />

    <Values x={514} y={50} values={values} label="values: rows A, B" />

    <Values x={40} y={217} values={[one.headReads[0][0].weights]} cell={64} digits={4} label="one head: donor weights" />

    <Arrow x1={183} y1={250} x2={475} y2={250} />

    <Text x={330} y={226}>one distribution mixes both coordinates</Text>

    <Values x={514} y={217} values={[one.output[0]]} cell={64} digits={4} label="one-head mixture" />

    {[0, 1].map(head => {
      const base = head * 380,
        scalar = two.merged[0][head];
      return <g key={head}>

      <Text x={base + 185} y={304}>head {head + 1}: coordinate {head + 1}</Text>

      <Values x={base + 28} y={350} values={[weights[head]]} cell={64} digits={4} label="donor weights A, B" />

      <Values x={base + 227} y={350} values={values.map(row => [row[head]])} cell={48} label="values A, B" />

      <Arrow x1={base + 104} y1={420} x2={base + 155} y2={450} /><Arrow x1={base + 251} y1={454} x2={base + 205} y2={450} />

      <Text x={base + 180} y={473} size={13}>{f(weights[head][0], 4)}×{f(values[0][head], 3)} + {f(weights[head][1], 4)}×{f(values[1][head], 3)}</Text>

      <rect x={base + 134} y={483} width={92} height={48} stroke={attentionColors.computed} fill="none" /><Text x={base + 180} y={513} color={attentionColors.computed}>{f(scalar, 4)}</Text>

    </g>;
    })}

    <Arrow x1={180} y1={538} x2={240} y2={596} /><Arrow x1={560} y1={538} x2={368} y2={596} />

    <Values x={240} y={596} values={[two.merged[0]]} cell={64} digits={4} />

    <Arrow x1={382} y1={620} x2={419} y2={620} />

    <Values x={440} y={567} values={[[1, 0], [0, 1]]} role="parameter" cell={36} />

    <Arrow x1={520} y1={620} x2={576} y2={620} />

    <Values x={599} y={596} values={[two.output[0]]} cell={64} digits={4} /><Text x={304} y={686}>concatenate scalar outputs</Text><Text x={476} y={716} color={attentionColors.parameter}>learned output map W_O</Text><Text x={663} y={686}>two-head output</Text>

  </Drawing>;
}
export function AttentionBackwardDrawing() {
  return <Drawing label="A scalar mixture of values 0 and 4 has output 3; upstream derivative 1 divides into value and score-gradient paths" height={295}>

    <Text x={110} y={30}>donor 1: value 0</Text><Text x={490} y={30}>donor 2: value 4</Text>

    <Text x={110} y={60} color={attentionColors.computed}>weight 0.25</Text><Text x={490} y={60} color={attentionColors.computed}>weight 0.75</Text>

    <Arrow x1={110} y1={80} x2={290} y2={134} /><Arrow x1={490} y1={80} x2={330} y2={134} /><rect x={287} y={132} width={46} height={46} rx={8} fill="none" stroke={attentionColors.operation} /><Text x={310} y={161}>Σ</Text><Text x={310} y={197}>mixture = 3</Text>

    <Arrow x1={310} y1={222} x2={310} y2={179} color={attentionColors.backward} dashed /><Text x={310} y={247} color={attentionColors.backward}>loss derivative at output = 1</Text>

    <Arrow x1={270} y1={160} x2={110} y2={96} color={attentionColors.backward} dashed /><Arrow x1={350} y1={160} x2={490} y2={96} color={attentionColors.backward} dashed />

    <Text x={110} y={121} color={attentionColors.backward}>value derivative 0.25</Text><Text x={490} y={121} color={attentionColors.backward}>value derivative 0.75</Text>

    <Text x={110} y={273} color={attentionColors.backward}>score: 0.25 × (0−3) = −0.75</Text><Text x={490} y={273} color={attentionColors.backward}>score: 0.75 × (4−3) = 0.75</Text>

  </Drawing>;
}
export function AttentionBlockDrawing() {
  return <Drawing label="Three donor exponential masses and weighted values merge into block sums, then global numerator and denominator before dividing" height={330}>

    {[['1', '1', '1'], ['2', '3', '6'], ['4', '6', '24']].map(([mass, value, product], i) => <g key={i}><Text x={100 + i * 220} y={26}>donor {i + 1}</Text><rect x={70 + i * 220} y={45} width={Number(mass) * 12} height={30} fill={attentionColors.computed} fillOpacity=".35" /><Text x={100 + i * 220} y={102}>mass {mass} × value {value}</Text><Text x={100 + i * 220} y={128}>weighted value {product}</Text></g>)}

    <Arrow x1={100} y1={140} x2={210} y2={179} /><Arrow x1={320} y1={140} x2={210} y2={179} /><Arrow x1={540} y1={140} x2={540} y2={179} />

    <Text x={210} y={203}>block 1: mass 3; numerator 7</Text><Text x={510} y={203}>block 2: mass 4; numerator 24</Text>

    <Arrow x1={210} y1={219} x2={303} y2={257} /><Arrow x1={510} y1={219} x2={337} y2={257} /><Text x={320} y={285}>add masses: 7; add numerators: 31</Text><Text x={320} y={319} color={attentionColors.computed}>divide once: mixture 31 / 7 = 4.4286</Text>

  </Drawing>;
}
export function AttentionStorageDrawing({
  length,
  heads,
  matrixBytes,
  cacheBytes
}) {
  return <Drawing label="A receiver by donor attention grid grows in two sequence directions; cached keys and values add one row per position" height={315}>

    <Text x={148} y={22}>one head: receivers × donors</Text>

    {Array.from({
      length: 8
    }, (_, i) => Array.from({
      length: 8
    }, (_, j) => <rect key={`${i}-${j}`} x={40 + j * 24} y={46 + i * 24} width={24} height={24} fill="none" stroke={attentionColors.computed} />))}

    <Text x={146} y={264}>{heads} heads · {f(matrixBytes / 2 ** 20, 2)} MiB</Text>

    <Text x={452} y={22}>cached keys and values</Text>

    <Text x={452} y={40} size={12}>positions × features</Text>

    {Array.from({
      length: 8
    }, (_, i) => <g key={i}><rect x={345} y={46 + i * 24} width={95} height={24} fill="none" stroke={attentionColors.computed} /><rect x={461} y={46 + i * 24} width={95} height={24} fill="none" stroke={attentionColors.computed} /></g>)}

    <Text x={393} y={63}>keys</Text><Text x={508} y={63}>values</Text><Text x={452} y={264}>12 layers · {f(cacheBytes / 2 ** 20, 2)} MiB</Text>

    <Text x={320} y={283} size={12}>schematic grid; actual length {length}; width 1024; two bytes per number</Text>

  </Drawing>;
}
