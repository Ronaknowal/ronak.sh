import { useId } from 'react';
import { flowNumber as f } from './LessonFlow.jsx';
import './rwkv-flow.css';
const colors = {
  input: '#83b4e8',
  parameter: '#e4b752',
  computed: '#c1a0dc',
  state: '#d8d8d8',
  credit: '#e39d6a'
};
export function RwkvFlowScroll({ label, children }) {
  const scrollHint = useId();
  return <>
    <p id={scrollHint} className="rwkv-flow-scroll-hint">Scroll this drawing sideways to follow every labelled part. With the drawing focused, use the left and right arrow keys.</p>
    <div className="rwkv-flow-scroll" tabIndex={0} role="region" aria-label={label} aria-describedby={scrollHint}>{children}</div>
  </>;
}
function Drawing({
  name,
  label,
  height,
  children,
  caption
}) {
  return <figure className="rwkv-flow-drawing" data-figure={`rwkv-${name}`}>
    <RwkvFlowScroll label={label}>
      <svg viewBox={`0 0 350 ${height}`} role="img" aria-label={label}>{children}</svg>
    </RwkvFlowScroll>
    <figcaption>{caption}</figcaption>
  </figure>;
}
function Wire({
  points,
  role = 'computed',
  dashed = false
}) {
  const id = useId();
  return <g><defs><marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={colors[role]} /></marker></defs>
    <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke={colors[role]} strokeWidth="1.6" strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#${id})`} /></g>;
}
function Text({
  x,
  y,
  children,
  role = 'state',
  anchor = 'middle',
  small = false
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={colors[role]} stroke="#070707" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round" className={small ? 'small' : ''}>{children}</text>;
}
function Cells({
  x,
  y,
  rows,
  role = 'computed',
  size = 46,
  label,
  columnLabels
}) {
  return <g>{label && <Text x={x + rows[0].length * size / 2} y={y - 14} role={role}>{label}</Text>}
    {columnLabels?.map((name, i) => <Text key={name} x={x + (i + .5) * size} y={y - 8} small>{name}</Text>)}
    {rows.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><rect x={x + j * size} y={y + i * size} width={size - 3} height={size - 3} fill="#151515" stroke={colors[role]} /><Text x={x + j * size + (size - 3) / 2} y={y + i * size + size / 2 + 5} role={role} small={String(value).length > 5}>{typeof value === 'number' ? f(value, 3) : value}</Text></g>))}</g>;
}
function Op({
  x,
  y,
  symbol,
  role = 'computed',
  radius = 18
}) {
  return <g><circle cx={x} cy={y} r={radius} stroke={colors[role]} fill="#0c0c0c" /><Text x={x} y={y + 5} role={role}>{symbol}</Text></g>;
}
export function RwkvInputDrawing() {
  return <Drawing name="input-anatomy" label="A supplied input vector enters three distinct learned matrices; each generates a different vector" height={430} caption="Cyan supplies the input. Amber matrices are learned weights. Violet vectors are computed. These symbolic maps do not generate the stipulated numerical fixture below.">
    <Cells x={128} y={35} rows={[['x₁', 'x₂']]} role="input" label="one supplied input x" />
    {[['Wq', 'request q', 58], ['Wk', 'address k', 174], ['Wv', 'content v', 290]].map(([name, label, x]) => <g key={name}>
      <Wire points={[[173, 80], [173, 112], [x + 45, 112], [x + 45, 241], [x + 23, 241]]} role="input" />
      <Cells x={x - 28} y={153} rows={[[name, '·'], ['·', '·']]} role="parameter" size={28} label={name} />
      <Wire points={[[x, 209], [x, 217]]} role="parameter" /><Op x={x} y={241} symbol="×" radius={23} />
      <Wire points={[[x, 265], [x, 277]]} />
      <Cells x={x - 38} y={292} rows={[[label === 'content v' ? 'v₁' : `${name[1]}₁`, label === 'content v' ? 'v₂' : `${name[1]}₂`]]} size={38} />
      <Text x={x} y={360}>{label}</Text>
    </g>)}
    <Text x={175} y={393} small>One input; three jobs; separate weights</Text>
  </Drawing>;
}
export function RwkvTranscriptDrawing({
  scores = [0, Math.log(2), 0],
  values = [2, 8, -1]
}) {
  const scale = Math.max(...scores),
    mass = scores.map(s => Math.exp(s - scale));
  const total = mass.reduce((a, b) => a + b, 0),
    weights = mass.map(v => v / total);
  return <Drawing name="transcript" label="The shared maximum is subtracted from each score before exponentiation; own mass divided by shared total produces a weight that multiplies its own value" height={565} caption={`m is the largest permitted score, ${f(scale, 4)}. Each exp(s−m) keeps its own numerator wire; shared normalization reaches all three denominators. A future record has no edge into this read.`}>
    {scores.map((s, i) => <g key={i}>
      <Cells x={20 + i * 110} y={35} rows={[[f(s, 3)]]} role="input" size={66} label={`score ${i + 1}`} />
      <Wire points={[[53 + i * 110, 100], [53 + i * 110, 129]]} role="input" />
      <Op x={53 + i * 110} y={150} symbol="exp(s−m)" radius={31} />
      <Text x={53 + i * 110} y={197}>{f(mass[i], 3)}</Text>
      <Wire points={[[53 + i * 110, 205], [53 + i * 110, 267]]} />
      <Op x={53 + i * 110} y={288} symbol="÷" />
      <Wire points={[[330, 235], [330, 288], [73 + i * 110, 288]]} />
      <Text x={53 + i * 110} y={338}>{f(weights[i], 4)}</Text>
      <Wire points={[[53 + i * 110, 347], [53 + i * 110, 369]]} />
      <Op x={53 + i * 110} y={391} symbol="×" />
      <Text x={53 + i * 110} y={437} role="input">v = {f(values[i])}</Text>
      <Wire points={[[53 + i * 110, 423], [53 + i * 110, 412]]} role="input" />
      <Wire points={[[53 + i * 110, 411], [53 + i * 110, 467], [175, 467], [175, 482]]} />
    </g>)}
    <Wire points={[[53, 206], [53, 218], [303, 218], [303, 234], [330, 234]]} />
    <Wire points={[[163, 206], [163, 218]]} /><Wire points={[[273, 206], [273, 218]]} />
    <Text x={198} y={247} small>Σ mass = {f(total, 4)}</Text>
    <Op x={175} y={503} symbol="Σ" /><Text x={175} y={551}>answer = {f(weights.reduce((sum, w, i) => sum + w * values[i], 0))}</Text>
  </Drawing>;
}
export function RwkvSummaryDrawing({
  keyVector = [0, 1],
  value = 8,
  query = [2, 1],
  before = [2, 0],
  priorNormalizer = [1, 0],
  state = [2, 8],
  normalizer = [1, 1],
  numerator = 12,
  denominator = 3
}) {
  const key = keyVector;
  return <Drawing name="summary" label="An address vector and scalar content form an outer product, added to memory and address totals; the query separately reads numerator and denominator" height={716} caption="S has one row per address feature and one column per value feature. z retains the corresponding key mass. Query reads both arrays, then divides.">
    <Cells x={17} y={39} rows={key.map(v => [v])} role="input" label="key k̄" />
    <Cells x={145} y={64} rows={[[value]]} role="input" label="value v" />
    <Wire points={[[62, 83], [111, 83], [111, 159]]} role="input" />
    <Wire points={[[168, 109], [168, 137], [130, 137], [130, 168]]} role="input" />
    <Op x={111} y={183} symbol="⊗" radius={23} />
    <Cells x={86} y={236} rows={key.map(k => [k * value])} label="write k̄vᵀ" />
    <Wire points={[[111, 207], [111, 221]]} />
    <Cells x={244} y={168} rows={before.map(v => [v])} role="state" label="old S" />
    <Wire points={[[266, 260], [266, 340], [175, 340], [175, 359]]} role="state" />
    <Wire points={[[111, 328], [111, 340], [155, 340], [155, 368]]} />
    <Op x={175} y={382} symbol="+" /><Cells x={53} y={437} rows={state.map(v => [v])} label="new S" />
    <Wire points={[[175, 401], [175, 422], [77, 422], [77, 436]]} />
    <Cells x={244} y={287} rows={priorNormalizer.map(v => [v])} role="state" label="old z" />
    <Wire points={[[266, 379], [266, 390]]} role="state" /><Op x={266} y={407} symbol="+" radius={13} />
    <Cells x={244} y={455} rows={normalizer.map(v => [v])} label="new z" />
    <Wire points={[[279, 407], [307, 407], [307, 478], [287, 478]]} />
    <Wire points={[[39, 129], [8, 129], [8, 407], [251, 407]]} role="input" />
    <Cells x={128} y={547} rows={[query]} role="input" size={36} label="supplied q̄" />
    <Wire points={[[146, 583], [146, 594], [96, 594]]} role="input" /><Wire points={[[181, 583], [181, 594], [248, 594]]} role="input" />
    <Wire points={[[77, 530], [77, 580]]} /><Wire points={[[266, 547], [266, 580]]} />
    <Op x={77} y={594} symbol="·" radius={12} /><Op x={266} y={594} symbol="·" radius={12} />
    <Text x={77} y={613}>q̄ᵀS = {f(numerator)}</Text><Text x={266} y={613}>q̄ᵀz = {f(denominator)}</Text>
    <Wire points={[[77, 627], [77, 653], [151, 653]]} /><Wire points={[[266, 627], [266, 653], [198, 653]]} />
    <Op x={175} y={653} symbol="÷" /><Text x={175} y={700}>{denominator > 0 ? `answer ${f(numerator / denominator)}` : 'undefined: zero support'}</Text>
  </Drawing>;
}
export function RwkvChunkDrawing({
  length = 3,
  carried = 0,
  local = 12,
  denominator = 3
}) {
  const shown = Math.min(length, 4),
    size = 28;
  return <Drawing name="chunk" label="A query separately reads incoming memory and local query key scores; causal masking precedes local value multiplication; numerator and mass pairs combine before division" height={785} caption={`The permission cutaway shows ${shown} of ${length} local rows; × excludes future donors. Each local returned value is augmented by constant 1, so the weighted sum returns both numerator and mass. These two-coordinate pairs add before division.`}>
    <Cells x={21} y={41} rows={[['S', 'z']]} role="state" label="incoming state" />
    <Cells x={232} y={41} rows={[['Q', 'K']]} role="input" label="local feature arrays" />
    <Wire points={[[255, 87], [255, 129]]} role="input" /><Wire points={[[301, 87], [301, 159], [284, 159]]} role="input" /><Op x={255} y={159} symbol="QKᵀ" radius={27} />
    <Cells x={23} y={140} rows={[['q₁', 'q₂']]} role="input" label="current query row" />
    <Wire points={[[66, 185], [66, 213]]} role="input" /><Op x={66} y={236} symbol="·" />
    <Wire points={[[22, 62], [7, 62], [7, 236], [43, 236]]} role="state" />
    <Cells x={185} y={232} rows={Array.from({
      length: shown
    }, (_, i) => Array.from({
      length: shown
    }, (_, j) => j <= i ? '•' : '×'))} size={size} role="input" label="causal permission L" />
    <Wire points={[[255, 187], [255, 204], [330, 204], [330, 398], [272, 398]]} /><Op x={250} y={398} symbol="⊙ L" radius={23} />
    <Wire points={[[185, 280], [154, 280], [154, 398], [225, 398]]} role="input" />
    <Wire points={[[250, 423], [250, 445]]} /><Op x={250} y={476} symbol="×[V,1]" radius={30} />
    <Cells x={23} y={449} rows={[['v₁', 1], ['⋮', 1]]} role="input" size={37} label="local [V,1]" /><Wire points={[[97, 487], [219, 487]]} role="input" />
    <Wire points={[[66, 259], [66, 536], [153, 536]]} /><Wire points={[[250, 502], [250, 536], [197, 536]]} /><Op x={175} y={536} symbol="+" />
    <Text x={74} y={582}>earlier {f(carried)}</Text><Text x={266} y={582}>local {f(local)}</Text>
    <Cells x={122} y={626} rows={[[carried + local, denominator]]} label="combined numerator, mass" />
    <Wire points={[[175, 560], [175, 601], [110, 601], [110, 649], [121, 649]]} />
    <Wire points={[[144, 673], [144, 717], [153, 717]]} /><Wire points={[[191, 673], [191, 717], [197, 717]]} /><Op x={175} y={717} symbol="÷" />
    <Text x={175} y={773}>answer {denominator > 0 ? f((carried + local) / denominator) : 'undefined'}</Text>
  </Drawing>;
}
export function RwkvWeightedDrawing({
  value = 8,
  keyWeight = 2,
  bonusWeight = 2,
  retention = .5,
  oldA = 2,
  oldB = 1
}) {
  const read = (oldA + keyWeight * bonusWeight * value) / (oldB + keyWeight * bonusWeight);
  const weight = keyWeight * bonusWeight;
  return <Drawing name="weighted-branches" label="Read and storage fork the same old pair and content pair; read multiplies content by bonus times ordinary weight, storage multiplies content by ordinary weight and old state by retention" height={862} caption="Pair coordinates are signed numerator and positive mass. Both branches reuse the same old [A,B] and current [v,1]. Bonus enters only the read; retention enters only saved history.">
    <Cells x={20} y={39} rows={[[oldA, oldB]]} role="state" label="old [A,B]" />
    <Cells x={221} y={39} rows={[[value, 1]]} role="input" label="current [v,1]" />
    <Cells x={232} y={165} rows={[[weight]]} role="computed" size={68} label="exp(k) × exp(u)" />
    <Wire points={[[265, 84], [265, 116], [190, 116], [190, 251]]} role="input" />
    <Wire points={[[267, 232], [267, 272], [199, 272]]} /><Op x={175} y={272} symbol="×" />
    <Wire points={[[175, 294], [175, 328]]} /><Op x={175} y={350} symbol="+" />
    <Wire points={[[65, 84], [65, 350], [153, 350]]} role="state" />
    <Wire points={[[197, 350], [316, 350], [316, 421], [217, 421]]} />
    <Cells x={129} y={399} rows={[[oldA + weight * value, oldB + weight]]} label="read numerator, mass" />
    <Wire points={[[151, 445], [151, 486], [156, 486]]} /><Wire points={[[197, 445], [197, 486], [194, 486]]} /><Op x={175} y={486} symbol="÷" />
    <Text x={175} y={533}>current read {f(read)}</Text>
    <Wire points={[[20, 62], [7, 62], [7, 598], [45, 598]]} role="state" /><Op x={68} y={598} symbol="×" />
    <Wire points={[[68, 629], [68, 620]]} role="parameter" />
    <Wire points={[[308, 62], [340, 62], [340, 598], [299, 598]]} role="input" /><Op x={276} y={598} symbol="×" />
    <Wire points={[[276, 629], [276, 620]]} />
    <Wire points={[[86, 598], [119, 598], [119, 697], [153, 697]]} /><Wire points={[[258, 598], [213, 598], [213, 697], [197, 697]]} /><Op x={175} y={697} symbol="+" />
    <Wire points={[[197, 697], [314, 697], [314, 770], [217, 770]]} />
    <Cells x={129} y={747} rows={[[retention * oldA + keyWeight * value, retention * oldB + keyWeight]]} label="saved [A,B]" />
    <Text x={175} y={832}>read bonus exp(u) = {f(bonusWeight)}</Text>
    <Text x={68} y={638} role="parameter">retention {f(retention)}</Text>
    <Text x={276} y={638}>ordinary exp(k) {f(keyWeight)}</Text>
  </Drawing>;
}
export function RwkvDeltaDrawing({
  before = [2, 7],
  keyVector = [1, 0],
  target = 5,
  rate = 1
}) {
  const key = keyVector;
  const read = before.reduce((s, v, i) => s + v * key[i], 0),
    error = target - read;
  const correction = key.map(k => rate * error * k),
    after = before.map((v, i) => v + correction[i]);
  return <Drawing name="delta" label="Current memory dot address gives a read; subtracting it from target yields error; error times address writes a correction and adds it to original memory" height={649} caption="The saved original memory reaches the final plus independently. A zero residual writes nothing. Correlated addresses share the changed coordinates.">
    <Cells x={22} y={39} rows={[before]} role="state" label="old memory M" />
    <Cells x={219} y={39} rows={[key]} role="input" label="address k" />
    <Wire points={[[68, 84], [68, 112], [153, 112], [153, 137]]} role="state" /><Wire points={[[265, 84], [265, 112], [195, 112], [195, 145]]} role="input" />
    <Op x={175} y={161} symbol="·" /><Text x={175} y={204}>read = {f(read)}</Text>
    <Wire points={[[175, 215], [175, 253]]} /><Op x={175} y={275} symbol="−" />
    <Text x={63} y={280} role="input">target {f(target)}</Text><Wire points={[[115, 275], [152, 275]]} role="input" />
    <Text x={175} y={322}>target − read = {f(error)}</Text>
    <Wire points={[[175, 334], [175, 373]]} /><Op x={175} y={398} symbol="⊗" radius={22} />
    <Wire points={[[265, 86], [337, 86], [337, 398], [198, 398]]} role="input" />
    <Text x={64} y={403} role="parameter">β = {f(rate)}</Text><Wire points={[[106, 398], [151, 398]]} role="parameter" />
    <Cells x={130} y={449} rows={[correction]} label="correction β error kᵀ" />
    <Wire points={[[175, 421], [175, 434]]} /><Wire points={[[175, 493], [175, 525]]} />
    <Wire points={[[23, 62], [8, 62], [8, 547], [152, 547]]} role="state" />
    <Op x={175} y={547} symbol="+" /><Wire points={[[175, 569], [175, 592]]} />
    <Cells x={130} y={601} rows={[after]} label="new memory" />
  </Drawing>;
}
export function RwkvAddressDrawing({
  angles = [0, 90],
  query = 0,
  memory = [5, 7]
}) {
  const vector = angle => [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
  const points = angles.map(vector),
    q = vector(query);
  const groups = [];
  points.forEach((p, i) => {
    const same = groups.find(group => Math.hypot(group.point[0] - p[0], group.point[1] - p[1]) < 1e-9);
    if (same) same.names.push(`k${i + 1}`);else groups.push({
      point: p,
      names: [`k${i + 1}`]
    });
  });
  return <Drawing name="address" label="Unit address arrows and one supplied query share an equal scale two dimensional plane" height={339} caption={`Same unit circle for both coordinates. Coincident endpoints: ${groups.map(group => group.names.join(', ')).join(' / ')}. Query ${f(query)}° reads ${f(memory[0] * q[0] + memory[1] * q[1])}; overlapping addresses can interfere.`}>
    <line x1={28} y1={165} x2={322} y2={165} stroke="#777" /><line x1={175} y1={30} x2={175} y2={300} stroke="#777" />
    <circle cx={175} cy={165} r={106} fill="none" stroke="#666" />
    {groups.map(({
      point: p,
      names
    }, i) => <g key={i}><Wire points={[[175, 165], [175 + p[0] * 106, 165 - p[1] * 106]]} role="input" /><Text x={Math.max(55, Math.min(285, 175 + p[0] * 120))} y={165 - p[1] * 119 + 5} role="input" small>{names.length > 3 ? `${names.length} writes` : names.join(', ')}</Text></g>)}
    <Wire points={[[175, 165], [175 + q[0] * 91, 165 - q[1] * 91]]} role="input" dashed />
    <Text x={275} y={192} small>coordinate 1</Text><Text x={175} y={20} small>coordinate 2</Text><Text x={175} y={328}>dashed query; memory [{memory.map(v => f(v)).join(', ')}]</Text>
  </Drawing>;
}
export function RwkvGooseDrawing({
  result,
  removal = [1, 0]
}) {
  const erasedRead = result.initial.map(row => row.reduce((sum, value, i) => sum + value * removal[i], 0));
  const eraseAddress = removal.map((value, i) => value * [.6, .2][i]);
  return <Drawing name="goose" label="Original matrix splits into diagonal decay and matrix-vector retrieval; the retrieved vector forms a removal outer product, while separate value and replacement address form a fresh write" height={1155} caption={`Value-by-key orientation. Removal direction [${removal.map(v => f(v, 3)).join(', ')}] couples address columns. Fixed erase a=[.6,.2], decay w=[.8,.9], replacement [1,0] and value [5,2]. Each outer product has both operands drawn.`}>
    <Cells x={129} y={34} rows={result.initial} role="state" label="old M" />
    <Cells x={20} y={173} rows={[[.8, .9]]} role="parameter" size={38} label="w columns" /><Cells x={229} y={173} rows={[removal]} role="input" size={38} label="removal κ̂" />
    <Wire points={[[129, 83], [7, 83], [7, 276], [43, 276]]} role="state" /><Wire points={[[218, 83], [330, 83], [330, 276], [300, 276]]} role="state" />
    <Wire points={[[96, 192], [108, 192], [108, 276], [92, 276]]} role="parameter" /><Op x={68} y={276} symbol="×" radius={23} />
    <Wire points={[[267, 211], [267, 251]]} role="input" /><Op x={276} y={276} symbol="·" radius={23} />
    <Wire points={[[68, 301], [68, 312]]} /><Cells x={20} y={329} rows={result.decayed} size={46} label="decayed M" />
    <Wire points={[[276, 301], [276, 314]]} /><Cells x={243} y={330} rows={erasedRead.map(value => [value])} size={33} label="Mκ̂" />
    <Cells x={161} y={437} rows={[eraseAddress]} size={40} label="a⊙κ̂" /><Wire points={[[201, 477], [201, 520], [252, 520]]} />
    <Wire points={[[260, 396], [276, 396], [276, 495]]} /><Op x={276} y={520} symbol="⊗" radius={23} /><Wire points={[[276, 545], [276, 560]]} />
    <Cells x={229} y={577} rows={result.erased} label="removal tile" />
    <Wire points={[[66, 421], [66, 708], [151, 708]]} /><Wire points={[[276, 669], [276, 708], [199, 708]]} /><Op x={175} y={708} symbol="−" />
    <Cells x={20} y={789} rows={[[5], [2]]} role="input" size={35} label="new value v" /><Cells x={116} y={789} rows={[[1, 0]]} role="input" size={35} label="write address k̃" />
    <Wire points={[[54, 859], [54, 892], [122, 892]]} role="input" /><Wire points={[[151, 824], [151, 867]]} role="input" /><Op x={145} y={892} symbol="⊗" radius={23} />
    <Wire points={[[145, 916], [108, 916], [108, 934], [90, 934]]} /><Cells x={20} y={917} rows={result.written} size={35} label="fresh write" />
    <Wire points={[[90, 969], [151, 969]]} /><Wire points={[[175, 732], [218, 732], [218, 941], [175, 941], [175, 947]]} /><Op x={175} y={969} symbol="+" />
    <Wire points={[[175, 992], [175, 1025]]} /><Cells x={129} y={1043} rows={result.next} label="new M" />
  </Drawing>;
}
export function RwkvBlockDrawing() {
  return <Drawing name="block" label="Normalized current and previous inputs feed separate shift projections; sigmoid receptance multiplies WKV read; a projected time output joins residual, then channel features expand twofold, square ReLU, contract, multiply their own gate and join a second residual" height={1138} caption="Fitted width 16, channel width 32: three and six representative cells show the real 1:2 width change. prev-time, a, b, p and prev-channel are five separate carried vectors. LN is the previously taught per-position LayerNorm.">
    <Cells x={131} y={35} rows={[['x₁', '…', 'x₁₆']]} size={28} role="input" label="16 supplied features" />
    <Wire points={[[174, 63], [174, 90]]} role="input" /><Op x={174} y={114} symbol="LN" radius={23} />
    <Cells x={19} y={169} rows={[['prevₜ']]} size={52} role="state" label="time shift" />
    <Text x={216} y={164}>current normalized x</Text>
    {[['r', 114], ['k', 203], ['v', 292]].map(([name, x]) => <g key={name}>
      <Wire points={[[174, 139], [174, 185], [x, 185], [x, 219]]} />
      <Wire points={[[71, 195], [85, 195], [85, 212], [x - 26, 212], [x - 26, 241], [x - 22, 241]]} role="state" />
      <Op x={x} y={241} symbol="mix" radius={21} />
      <Wire points={[[x, 263], [x, 302]]} /><Cells x={x - 18} y={311} rows={[[name]]} size={36} />
    </g>)}
    <Wire points={[[114, 347], [114, 377]]} /><Op x={114} y={400} symbol="σ" />
    <Wire points={[[203, 347], [203, 388], [216, 388]]} /><Wire points={[[292, 347], [292, 388], [267, 388]]} /><Op x={242} y={388} symbol="WKV" radius={26} />
    <Cells x={23} y={334} rows={[['a'], ['b'], ['p']]} role="state" size={32} label="a,b,p state" />
    <Wire points={[[55, 350], [66, 350], [66, 441], [290, 441], [290, 400], [267, 400]]} role="state" />
    <Wire points={[[114, 421], [114, 478], [152, 478]]} /><Wire points={[[242, 415], [242, 478], [198, 478]]} /><Op x={175} y={478} symbol="×" />
    <Wire points={[[175, 500], [175, 527]]} /><Op x={175} y={550} symbol="Wo" radius={23} /><Wire points={[[175, 574], [175, 597]]} /><Op x={175} y={619} symbol="+" />
    <Wire points={[[131, 49], [7, 49], [7, 619], [151, 619]]} role="input" />
    <Wire points={[[175, 642], [175, 665]]} /><Op x={175} y={688} symbol="LN" radius={23} />
    <Cells x={21} y={732} rows={[['prev꜀']]} size={51} role="state" label="channel shift" />
    <Wire points={[[175, 712], [175, 730], [127, 730], [127, 752]]} /><Wire points={[[175, 730], [286, 730], [286, 752]]} />
    <Wire points={[[72, 757], [94, 757], [94, 778], [105, 778]]} role="state" /><Wire points={[[72, 757], [80, 757], [80, 805], [263, 805], [263, 784]]} role="state" />
    <Op x={127} y={778} symbol="mix" radius={21} /><Op x={286} y={778} symbol="mix" radius={21} />
    <Text x={127} y={837} role="parameter">Wk′ expands 16→32</Text><Wire points={[[127, 800], [127, 817]]} />
    <Cells x={53} y={856} rows={[["·", "·", "·", "·", "·", "·"]]} size={25} />
    <Wire points={[[128, 881], [128, 904]]} /><Op x={128} y={926} symbol="ReLU²" radius={27} />
    <Text x={286} y={840} role="parameter">Wr′ → σ</Text><Wire points={[[286, 800], [286, 860]]} /><Op x={286} y={882} symbol="σ" />
    <Wire points={[[128, 954], [128, 977]]} /><Cells x={87} y={991} rows={[['·', '·', '·']]} size={28} label="Wv′ contracts 32→16" />
    <Wire points={[[130, 1019], [130, 1043], [152, 1043]]} /><Wire points={[[286, 904], [286, 1043], [198, 1043]]} /><Op x={175} y={1043} symbol="×" />
    <Wire points={[[175, 1066], [175, 1092]]} /><Op x={175} y={1114} symbol="+" /><Wire points={[[198, 619], [341, 619], [341, 1114], [198, 1114]]} />
    <Text x={272} y={1134}>16 output features</Text>
    {[['r', 114], ['k', 203], ['v', 292]].map(([name, x]) => <Text key={name} x={x} y={285} role="parameter">μ{name}; W{name}</Text>)}
  </Drawing>;
}
export function RwkvBoundaryDrawing() {
  return <Drawing name="complete-boundary" label="A complete fitted classifier state crosses the cut: two blocks of memory and shift slots plus feature sum and count; reset takes a separate zero-state route" height={387} caption="The boundary is an execution decision, not a new example. Carry all slots and pool with sum/count. Detach retains these numbers but stops backward credit; reset discards them.">
    <Cells x={22} y={43} rows={[['time shift', 'channel shift'], ['a / S', 'b / z'], ['scale p', 'block 2']]} size={105} role="state" label="complete recurrent state" />
    <Cells x={244} y={43} rows={[['Σ feat'], ['count']]} size={70} role="state" />
    <Wire points={[[128, 253], [128, 283], [246, 283], [246, 304]]} role="state" /><Wire points={[[280, 183], [280, 304]]} role="state" />
    <Op x={264} y={327} symbol="carry" radius={26} />
    <Text x={69} y={317}>reset → zero</Text><Wire points={[[124, 316], [236, 316]]} role="input" />
    <Text x={175} y={384}>next chunk resumes the same state contract</Text>
  </Drawing>;
}
export function RwkvGradientDrawing() {
  return <Drawing name="read-credit" label="One normalized read sends backward loss credit to query, numerator memory and denominator memory separately" height={542} caption="Solid violet follows the forward read. Dashed orange follows loss credit backward; the normalizer receives credit as well as the signed numerator.">
    <Cells x={20} y={39} rows={[[2, 8]]} role="state" label="Sᵀ = [2,8]" /><Cells x={221} y={39} rows={[[1, 1]]} role="state" label="z = [1,1]" />
    <Cells x={129} y={139} rows={[[2, 1]]} role="input" label="query q" />
    <Wire points={[[65, 84], [65, 245]]} /><Wire points={[[267, 84], [267, 245]]} />
    <Wire points={[[152, 185], [152, 267], [87, 267]]} role="input" /><Wire points={[[197, 185], [197, 267], [246, 267]]} role="input" />
    <Op x={65} y={267} symbol="·" /><Op x={267} y={267} symbol="·" /><Text x={65} y={313}>numerator 12</Text><Text x={267} y={313}>mass 3</Text>
    <Wire points={[[65, 328], [65, 353], [153, 353]]} /><Wire points={[[267, 328], [267, 353], [197, 353]]} /><Op x={175} y={353} symbol="÷" />
    <Text x={175} y={400}>answer 4</Text><Wire points={[[175, 410], [175, 434]]} /><Op x={175} y={458} symbol="½e²" radius={24} />
    <Text x={285} y={463} role="input">target 6</Text><Wire points={[[243, 458], [199, 458]]} role="input" />
    <Wire points={[[149, 458], [8, 458], [8, 14], [64, 14], [64, 32]]} role="credit" dashed /><Wire points={[[201, 458], [341, 458], [341, 14], [266, 14], [266, 32]]} role="credit" dashed />
    <Wire points={[[175, 434], [115, 434], [115, 160], [128, 160]]} role="credit" dashed />
    <Text x={175} y={530}>loss 2; backward multiplier −2</Text>
  </Drawing>;
}
export function RwkvScaleDrawing() {
  return <Drawing name="stable-scale" label="The same maximum log scale is subtracted from old and current log weights to produce two bounded exponent factors" height={442} caption="Exponent-scaling cutaway only: these factors multiply the old and current numerator/mass pairs in the read-and-store circuit. They are not divided by each other. The signed numerator is never logged; p describes weight scale, not its sign.">
    <Cells x={25} y={40} rows={[['p']]} role="state" label="old log scale" /><Cells x={250} y={40} rows={[['u+k']]} role="input" label="current log weight" />
    <Wire points={[[48, 85], [48, 113], [155, 113], [155, 128]]} /><Wire points={[[272, 85], [272, 113], [195, 113], [195, 128]]} />
    <Op x={175} y={149} symbol="max" radius={24} /><Text x={80} y={199}>common q</Text>
    <Wire points={[[175, 174], [175, 218], [66, 218], [66, 242]]} /><Wire points={[[175, 218], [275, 218], [275, 242]]} />
    <Text x={67} y={273}>exp(p−q) ≤ 1</Text><Text x={275} y={273}>exp(u+k−q) ≤ 1</Text>
    <Wire points={[[67, 287], [67, 326]]} /><Wire points={[[275, 287], [275, 326]]} />
    <Cells x={34} y={327} rows={[["eold"]]} size={66} /><Cells x={242} y={327} rows={[["enow"]]} size={66} />
    <Text x={67} y={417}>history factor</Text><Text x={275} y={417}>current factor</Text>
  </Drawing>;
}
export function RwkvDecayDrawing() {
  const x = age => 35 + age * 1.8,
    y = fraction => 213 - fraction * 165;
  return <Drawing name="decay-timescales" label="Three isolated stored contributions decay at fixed rates .5, .9 and .99 over 140 subsequent storage updates" height={350} caption="All three use the same fixed axes. Direct leader labels identify curves even near zero; this is a calculated isolated contribution, not a semantic retention guarantee.">
    <line x1="35" x2="287" y1="213" y2="213" stroke="#777" /><line x1="35" x2="35" y1="45" y2="213" stroke="#777" />
    {[0, .5, 1].map(value => <Text key={value} x={28} y={y(value) + 5} anchor="end" small>{value}</Text>)}
    {[0, 70, 140].map(age => <Text key={age} x={x(age)} y={237} small>{age}</Text>)}
    {[.5, .9, .99].map((rate, i) => <g key={rate}>
      <polyline points={Array.from({
        length: 141
      }, (_, age) => `${x(age)},${y(rate ** age)}`).join(' ')} stroke="#c1a0dc" fill="none" strokeWidth={i + 1} strokeDasharray={i === 1 ? '4 3' : undefined} />
      <Wire points={[[x(140), y(rate ** 140)], [315 + i * 7, y(rate ** 140)], [315 + i * 7, 270 + i * 25], [285, 270 + i * 25]]} />
      <Text x={278} y={275 + i * 25} anchor="end">λ {rate}; half-life {f(Math.log(.5) / Math.log(rate), 2)}</Text>
    </g>)}
  </Drawing>;
}
export function RwkvFeatureDrawing({
  random = false
}) {
  return <Drawing name={random ? 'random-features' : 'feature-map'} label={random ? 'Sampled directions create feature columns, whose pair products average to an estimate of the exponential kernel' : 'Elementwise feature maps change raw query and keys before a positive feature dot product'} height={377} caption={random ? 'Finite sampled columns estimate a kernel. Division by a random total is a separate operation; unbiased kernel estimates do not imply an unbiased normalized answer.' : 'Already mapped features enter the summary once. ELU+1 chooses a different kernel from softmax; reassociation is exact only for the selected rule.'}>
    <Cells x={18} y={41} rows={[[random ? 'x' : 'q=2']]} role="input" size={67} label="query" /><Cells x={217} y={41} rows={[[random ? 'y' : '0', random ? 'y′' : '1']]} role="input" size={55} label="keys" />
    <Wire points={[[52, 108], [52, 144]]} role="input" /><Wire points={[[272, 96], [272, 144]]} role="input" />
    <Op x={52} y={165} symbol="φ" radius={23} /><Op x={272} y={165} symbol="φ" radius={23} />
    <Cells x={18} y={222} rows={random ? [['fω₁', 'fω₂']] : [[3]]} size={48} /><Cells x={223} y={222} rows={[[random ? 'fω₁' : '1', random ? 'fω₂' : '2']]} size={48} />
    <Wire points={[[66, 270], [66, 297], [153, 297]]} /><Wire points={[[272, 270], [272, 297], [196, 297]]} /><Op x={175} y={297} symbol="·" />
    <Text x={175} y={357}>{random ? 'average matching feature products' : 'weights 3 and 6 → answer 20/3'}</Text>
  </Drawing>;
}
export function RwkvMatrixRetentionDrawing({
  gates = [.5, .5],
  state = [11, 12],
  query = [3, 1]
}) {
  const write = [-1, -1],
    next = state.map((v, i) => gates[i] * v + write[i]);
  return <Drawing name="row-retention" label="Each address row has a separate retention coefficient; new outer write joins after retention, then query reads rows" height={574} caption="Third write of the running example: key [1,1], value −1, query [1,2]. Here S is key-by-value. A row gate multiplies every value coordinate in that address row. The returned read has no normalization denominator.">
    <Cells x={18} y={40} rows={state.map(v => [v])} role="state" label="old S rows" /><Cells x={135} y={40} rows={gates.map(v => [v])} role="input" label="row gates" />
    <Wire points={[[64, 87], [99, 87]]} role="state" /><Wire points={[[135, 87], [123, 87]]} role="input" /><Op x={111} y={87} symbol="×" radius={12} />
    <Cells x={243} y={40} rows={[[state[0] * gates[0]], [state[1] * gates[1]]]} label="retained" /><Wire points={[[122, 87], [228, 87]]} />
    <Cells x={18} y={205} rows={write.map(v => [v])} label="new k vᵀ" /><Wire points={[[63, 251], [151, 251]]} /><Wire points={[[266, 133], [266, 251], [199, 251]]} /><Op x={175} y={251} symbol="+" />
    <Wire points={[[175, 274], [175, 316]]} /><Cells x={129} y={333} rows={next.map(v => [v])} label="new S" />
    <Cells x={231} y={400} rows={[query]} role="input" size={37} label="current query" /><Wire points={[[267, 437], [267, 474], [199, 474]]} role="input" />
    <Wire points={[[152, 425], [152, 454]]} /><Op x={175} y={474} symbol="·" radius={23} /><Text x={175} y={548}>unnormalized answer {f(next.reduce((sum, v, i) => sum + v * query[i], 0))}</Text>
  </Drawing>;
}
export function RwkvReflectionDrawing() {
  return <Drawing name="reflection" label="A diagonal transition shrinks coordinate axes while a reflection exchanges coordinate directions; half scaling preserves direction before ideal GroupNorm" height={462} caption="Constructed transition only, with no fresh write. Half scaling changes magnitude; ideal zero-epsilon homogeneous normalization can remove that scale. Practical GroupNorm uses per-head coordinate mean/variance and epsilon.">
    <Cells x={20} y={34} rows={[[0, 1], [1, 0]]} label="I−2nnᵀ" /><Cells x={229} y={34} rows={[[0, .5], [.5, 0]]} label="half transition" />
    <Wire points={[[66, 126], [66, 149]]} /><Wire points={[[275, 126], [275, 149]]} />
    {[[65, 'full', 1], [266, 'half', .5]].map(([x, name, scale]) => <g key={name}>
      <line x1={x - 45} x2={x + 66} y1={326} y2={326} stroke="#666" /><line x1={x - 35} x2={x - 35} y1={167} y2={335} stroke="#666" />
      <Wire points={[[x - 35, 326], [x - 35 + 3 * 14, 326 - 8 * 14]]} role="input" />
      <Wire points={[[x - 35, 326], [x - 35 + 8 * scale * 14, 326 - 3 * scale * 14]]} />
      <Text x={x + 3} y={359}>{name}: [{f(8 * scale)},{f(3 * scale)}]</Text>
    </g>)}
    <Text x={175} y={406}>input [3,8]; equal 14 px per unit</Text><Text x={175} y={442}>released decay exceeds 0.545239; .5 is outside</Text>
  </Drawing>;
}
export function RwkvGooseBlockDrawing() {
  return <Drawing name="goose-block" label="Six separately shifted generators produce receptance key value decay erase and output gate; first-layer value joins interpolation; matrix update feeds read and normalization, a separate bonus adds before output gating and projection" height={1290} caption="Representative head, value-by-key matrix. Six generators use separate learned shifts; l is the learned value-blend logit, σ(l) its coefficient. First-layer value is a within-token intermediate, not past-token cache. κ is per-head L2-normalized; GN uses each head's output-coordinate mean and variance. The channel branch follows below.">
    <Cells x={129} y={35} rows={[["x", "xprev"]]} role="input" label="normalized input and carried shift" />
    {['r', 'k', 'v', 'w', 'a', 'g'].map((name, i) => <g key={name}><Wire points={[[175, 81], [175, 112], [29 + i * 58, 112], [29 + i * 58, 145]]} role="input" /><Cells x={10 + i * 58} y={161} rows={[[name]]} size={39} /></g>)}
    <Cells x={25} y={272} rows={[["vfirst"]]} size={68} /><Op x={170} y={307} symbol="mix v" radius={28} />
    <Wire points={[[145, 200], [145, 260], [170, 260], [170, 277]]} /><Wire points={[[93, 306], [139, 306]]} /><Text x={175} y={360}>v ← v + σ(l)(vfirst−v)</Text>
    <Cells x={20} y={417} rows={[["M₀₀", "M₀₁"], ["M₁₀", "M₁₁"]]} size={36} role="state" label="old M" />
    <Wire points={[[92, 453], [140, 453]]} role="state" /><Op x={175} y={453} symbol="update" radius={33} />
    <Wire points={[[170, 337], [170, 418]]} /><Wire points={[[87, 200], [108, 200], [108, 390], [150, 390], [150, 426]]} />
    <Wire points={[[203, 200], [203, 247], [312, 247], [312, 431], [205, 431]]} /><Wire points={[[261, 200], [279, 200], [279, 476], [206, 476]]} />
    <Text x={270} y={389} small>w,a; κ̂,k̃ from k</Text>
    <Wire points={[[175, 488], [175, 530]]} /><Cells x={129} y={548} rows={[["M′₀₀", "M′₀₁"], ["M′₁₀", "M′₁₁"]]} label="new M; carried to next token" />
    <Wire points={[[175, 640], [175, 684]]} /><Op x={175} y={712} symbol="· r" radius={25} />
    <Wire points={[[29, 200], [8, 200], [8, 712], [149, 712]]} /><Wire points={[[175, 738], [175, 771]]} /><Op x={175} y={798} symbol="GN" radius={25} />
    <Text x={272} y={798} small>one group/head</Text>
    <Op x={270} y={908} symbol="× v" radius={26} /><Wire points={[[170, 337], [226, 337], [226, 868], [270, 868], [270, 879]]} />
    <Cells x={24} y={819} rows={[["u₁", "u₂"]]} role="parameter" size={31} label="bonus u" /><Wire points={[[54, 850], [54, 889]]} role="parameter" />
    <Op x={54} y={915} symbol="Σrku" radius={26} /><Wire points={[[81, 915], [242, 915]]} />
    <Wire points={[[29, 200], [4, 200], [4, 887], [29, 899]]} /><Wire points={[[87, 200], [102, 200], [102, 875], [75, 897]]} />
    <Wire points={[[175, 824], [175, 941]]} /><Op x={175} y={965} symbol="+" /><Wire points={[[270, 935], [270, 965], [197, 965]]} />
    <Wire points={[[175, 987], [175, 1023]]} /><Op x={175} y={1048} symbol="×" radius={22} />
    <Wire points={[[319, 200], [342, 200], [342, 1048], [199, 1048]]} /><Text x={296} y={1030} small>g output gate</Text>
    <Wire points={[[175, 1072], [175, 1108]]} /><Op x={175} y={1133} symbol="Wo" radius={24} /><Wire points={[[175, 1159], [175, 1194]]} /><Op x={175} y={1216} symbol="+" />
    <Cells x={20} y={1101} rows={[["xraw"]]} role="input" size={68} label="saved residual" /><Wire points={[[54, 1169], [54, 1216], [151, 1216]]} role="input" /><Text x={175} y={1270}>time output joins the original residual</Text>
    {/* Labels paint last so the long bypasses cannot obscure their glyphs. */}
    {Array.from({
      length: 6
    }, (_, i) => <Text key={i} x={29 + i * 58} y={221} small role="parameter">shift+map</Text>)}
    <Text x={59} y={258}>first-layer value</Text>
  </Drawing>;
}
export function RwkvGooseChannelDrawing() {
  return <Drawing name="goose-channel" label="Separately shifted normalized input expands to fourfold channel width, squared ReLU acts on each feature, contraction joins the original residual; no receptance multiplication exists in this branch" height={490} caption="RWKV-7's channel branch uses one learned shift and a fourfold expansion in the described paper block. The 2→8→2 cutaway preserves that width ratio. It has no earlier RWKV-4 channel receptance gate.">
    <Cells x={138} y={34} rows={[["x", "prev"]]} role="input" size={37} label="own normalized shift input" /><Wire points={[[175, 71], [175, 105]]} /><Op x={175} y={129} symbol="mix" radius={24} />
    <Wire points={[[175, 155], [175, 181]]} /><Cells x={27} y={203} rows={[["·", "·", "·", "·", "·", "·", "·", "·"]]} size={37} label="Wk: fourfold expansion" />
    <Wire points={[[175, 240], [175, 270]]} /><Op x={175} y={297} symbol="ReLU²" radius={29} />
    <Wire points={[[175, 327], [175, 354]]} /><Cells x={138} y={370} rows={[["·", "·"]]} size={37} label="Wv: contract" />
    <Wire points={[[175, 407], [175, 434]]} /><Op x={175} y={456} symbol="+" /><Cells x={20} y={353} rows={[["xraw"]]} role="input" size={55} label="residual" /><Wire points={[[48, 408], [48, 456], [151, 456]]} role="input" />
  </Drawing>;
}
export function RwkvMatrixBlockDrawing() {
  return <Drawing name="matrix-version" label="One key value outer product branches into current bonus read and unbonused storage; old matrix enters both; receptance reads rows, GroupNorm and SiLU output gate precede projection" height={1115} caption="Key-by-value orientation for RWKV-5/6; a core/readout cutaway after input projections. Fixed learned row retention defines Eagle; an input-generated retention defines Finch. The current bonus affects the read matrix, not the stored write.">
    <Cells x={20} y={39} rows={[["k₁", "k₂"]]} role="input" label="current key" /><Cells x={230} y={39} rows={[["v₁", "v₂"]]} role="input" label="current value" />
    <Wire points={[[66, 85], [66, 124], [151, 124]]} /><Wire points={[[276, 85], [276, 124], [199, 124]]} /><Op x={175} y={124} symbol="⊗" radius={23} />
    <Wire points={[[175, 148], [175, 192]]} /><Cells x={129} y={208} rows={[["kv₁₁", "kv₁₂"], ["kv₂₁", "kv₂₂"]]} label="one outer write" />
    <Cells x={17} y={379} rows={[["S₁₁", "S₁₂"], ["S₂₁", "S₂₂"]]} role="state" size={35} label="old S" />
    <Wire points={[[175, 302], [175, 326], [254, 326], [254, 364]]} /><Op x={254} y={388} symbol="×" radius={22} /><Cells x={287} y={440} rows={[["u₁"], ["u₂"]]} role="parameter" size={28} label="u rows" /><Wire points={[[301, 439], [301, 388], [278, 388]]} role="parameter" />
    <Wire points={[[175, 302], [175, 326], [139, 326], [139, 567], [164, 567]]} /><Op x={185} y={567} symbol="+" />
    <Wire points={[[86, 414], [123, 414], [123, 523]]} role="state" /><Op x={123} y={545} symbol="×" radius={20} /><Wire points={[[145, 545], [167, 553]]} /><Cells x={25} y={539} rows={[["w₁", "w₂"]]} role="parameter" size={31} label="retention" /><Wire points={[[88, 554], [102, 554]]} role="parameter" />
    <Wire points={[[185, 590], [185, 620]]} /><Cells x={148} y={635} rows={[["S′₁₁", "S′₁₂"], ["S′₂₁", "S′₂₂"]]} size={37} label="stored S′" />
    <Wire points={[[254, 420], [254, 486]]} /><Op x={254} y={510} symbol="+" /><Wire points={[[51, 449], [7, 449], [7, 510], [232, 510]]} role="state" />
    <Wire points={[[276, 510], [335, 510], [335, 767], [208, 767]]} /><Op x={175} y={767} symbol="rᵀR" radius={29} />
    <Cells x={20} y={653} rows={[["r₁", "r₂"]]} role="input" size={37} label="receptance r" /><Wire points={[[57, 690], [57, 767], [143, 767]]} role="input" />
    <Wire points={[[175, 798], [175, 830]]} /><Op x={175} y={856} symbol="GN" radius={25} /><Wire points={[[175, 883], [175, 929]]} /><Op x={175} y={951} symbol="×" />
    <Cells x={21} y={836} rows={[["g"]]} role="input" size={40} /><Wire points={[[41, 876], [41, 903]]} /><Op x={41} y={928} symbol="SiLU" radius={25} /><Wire points={[[67, 928], [117, 928], [117, 951], [151, 951]]} />
    <Wire points={[[175, 974], [175, 1003]]} /><Op x={175} y={1028} symbol="Wo" radius={24} /><Wire points={[[175, 1053], [175, 1070]]} /><Op x={175} y={1091} symbol="+" />
    <Text x={72} y={1097} role="input">residual x</Text><Wire points={[[111, 1091], [151, 1091]]} role="input" />
  </Drawing>;
}
export function RwkvClassifierDrawing() {
  return <Drawing name="classifier" label="45 two dimensional coordinates project into 16 channels, two complete memory blocks transform features, mean pooling produces 16 features; a learned 15 by 16 affine readout trains against the separate label" height={1190} caption="Arrays show representative cutaways at their real shapes. Label never enters the feature route. Scores 0–14 correspond to classes 1–15. Loss credit returns to learned projection/block/readout weights, while inference keeps those weights fixed.">
    <Cells x={127} y={35} rows={[["x₁", "y₁"], ["x₂", "y₂"], ["⋮", "⋮"]]} role="input" size={44} label="45×2; fixed 2x−1" />
    <Wire points={[[171, 167], [171, 189]]} /><Op x={171} y={213} symbol="W in" radius={24} />
    <Wire points={[[171, 238], [171, 263]]} /><Cells x={83} y={277} rows={[["·", "·", "·", "·", "·", "·"], ["·", "·", "·", "·", "·", "·"], ["⋮", "⋮", "⋮", "⋮", "⋮", "⋮"]]} size={29} label="45×16 computed features" />
    <Wire points={[[171, 364], [171, 388]]} /><Op x={171} y={414} symbol="B₁→B₂" radius={29} />
    <Wire points={[[171, 444], [171, 468]]} /><Op x={171} y={494} symbol="Σ/45" radius={25} />
    <Wire points={[[171, 520], [171, 646]]} /><Cells x={79} y={664} rows={[["h₁", "h₂", "…", "h₁₆"]]} size={46} label="16 pooled features" />
    <Cells x={23} y={754} rows={[["W₀₁", "…", "W₀₁₆"], ["⋮", "⋮", "⋮"], ["W₁₄₁", "…", "W₁₄₁₆"]]} size={36} role="parameter" label="W: 15×16 cutaway" />
    <Wire points={[[171, 710], [171, 910]]} /><Wire points={[[131, 807], [237, 807], [237, 934], [193, 934]]} role="parameter" /><Op x={171} y={934} symbol="×" />
    <Wire points={[[171, 956], [171, 986]]} /><Op x={171} y={1008} symbol="+" /><Cells x={249} y={952} rows={[["b₀", "…", "b₁₄"]]} size={27} role="parameter" label="15 biases" /><Wire points={[[288, 979], [288, 1008], [194, 1008]]} role="parameter" />
    <Wire points={[[171, 1031], [171, 1055]]} /><Cells x={91} y={1067} rows={[["ℓ₀", "ℓ₁", "…", "ℓ₁₄"]]} size={40} label="15 classifier scores" />
    <Wire points={[[171, 1107], [171, 1123]]} /><Op x={171} y={1145} symbol="CE" radius={24} />
    <Text x={287} y={1150} role="input">true class</Text><Wire points={[[247, 1145], [198, 1145]]} role="input" />
    <Wire points={[[144, 1145], [17, 1145], [17, 213], [145, 213]]} role="credit" dashed />
  </Drawing>;
}
export function RwkvSplitDrawing() {
  return <Drawing name="group-split" label="360 original rows form exact coordinate groups, 30 duplicates collapse, and 330 unique groups partition into fitting validation and assessment" height={370} caption="Exact duplicate groups stay together by retaining their first row. Row-level performer/session identifiers are absent, so this is not a held-out performer experiment.">
    <Cells x={109} y={34} rows={[["360", "rows"]]} role="input" size={65} label="original observations" />
    <Wire points={[[174, 99], [174, 126]]} /><Op x={174} y={150} symbol="group" radius={27} /><Text x={174} y={201}>330 unique; 30 duplicate copies</Text>
    {[['fit', 220, 24], ['validation', 50, 134], ['assessment', 60, 244]].map(([name, n, x]) => <g key={name}><Wire points={[[174, 214], [174, 232], [x + 42, 232], [x + 42, 253]]} /><Cells x={x} y={267} rows={[[n]]} size={84} label={name} /></g>)}
  </Drawing>;
}
export function RwkvObjectiveDrawing() {
  return <Drawing name="next-token-objective" label="The current token updates sequence state; the updated representation makes next token scores; a separate following token supplies the training target, with no target edge to the current update" height={454} caption="The following token reaches only the loss for this step. Solid paths are the forward computation; dashed orange sends loss credit back to trained weights. No future token feeds the current state update.">
    <Cells x={27} y={43} rows={[['sensor']]} role="input" size={90} label="current token" /><Cells x={229} y={43} rows={[['hprev']]} role="state" size={76} label="previous state" />
    <Wire points={[[72, 133], [72, 164], [152, 164], [152, 179]]} role="input" /><Wire points={[[267, 119], [267, 164], [195, 164], [195, 179]]} role="state" />
    <Op x={175} y={201} symbol="update" radius={28} /><Wire points={[[175, 229], [175, 255]]} />
    <Cells x={73} y={269} rows={[["score₁", "…", "scoreᵥ"]]} size={68} label="next-token scores" />
    <Wire points={[[175, 337], [175, 363]]} /><Op x={175} y={390} symbol="loss" radius={24} />
    <Text x={294} y={397} role="input">“reads”</Text><Wire points={[[252, 390], [201, 390]]} role="input" />
    <Wire points={[[149, 390], [10, 390], [10, 201], [146, 201]]} role="credit" dashed />
    <Text x={175} y={431}>target = actual following token</Text>
  </Drawing>;
}
export function RwkvCollapsedHistoryDrawing() {
  return <Drawing name="indistinguishable-histories" label="Two different content histories with the same addresses create identical summary and mass; a future read cannot distinguish them" height={388} caption="A separate constructed case: every key is [1,0], no new write follows. Content [2,8] and [4,6] both give S=[10,0], z=[2,0]. Any supported later query sees the same answer.">
    <Cells x={19} y={39} rows={[[2, 8]]} role="input" label="history one" /><Cells x={231} y={39} rows={[[4, 6]]} role="input" label="history two" />
    <Wire points={[[65, 84], [65, 118]]} /><Wire points={[[277, 84], [277, 118]]} />
    <Cells x={19} y={143} rows={[[10, 0], [2, 0]]} label="S then z" /><Cells x={231} y={143} rows={[[10, 0], [2, 0]]} label="S then z" />
    <Wire points={[[65, 235], [65, 264], [153, 264]]} /><Wire points={[[277, 235], [277, 264], [198, 264]]} /><Op x={175} y={264} symbol="=" />
    <Text x={175} y={316}>query [1,0] → 10/2 → 5</Text><Text x={175} y={361}>the individual old values are unrecoverable</Text>
  </Drawing>;
}
export function RwkvRetNetRotationDrawing() {
  return <Drawing name="position-rotation" label="Two supplied vectors rotate by their position phases on equal scale axes; their dot product depends on the difference in phases" height={349} caption="Constructed two-coordinate cutaway. Rotate query at phase θt and key at phase θi; their dot product depends on θ(t−i). Full RetNet combines such coordinate-pair rotations with decayed retention, head normalization and gating.">
    <line x1="24" y1="166" x2="326" y2="166" stroke="#666" /><line x1="175" y1="27" x2="175" y2="307" stroke="#666" /><circle cx="175" cy="166" r="105" fill="none" stroke="#777" />
    <Wire points={[[175, 166], [280, 166]]} role="input" /><Wire points={[[175, 166], [227.5, 75.067]]} />
    <path d="M255 166 A80 80 0 0 0 215 96.718" fill="none" stroke="#e4b752" />
    <Text x={271} y={139} role="input">key at 0°</Text><Text x={226} y={58}>query at 60°</Text><Text x={249} y={105} role="parameter">phase</Text>
    <Text x={175} y={333}>unit dot product = cos(60°) = .5</Text>
  </Drawing>;
}
export function RwkvSequenceCompressionDrawing() {
  return <Drawing name="sequence-compression" label="A learned two by four projection combines four key or value rows into two sequence slots, preserving the feature dimension" height={452} caption="Compression acts on the sequence axis. A global projection with a nonzero future coefficient can send future content into a compact slot; ordinary causal attention masks do not undo that earlier leakage.">
    <Cells x={17} y={45} rows={[["k₁₁", "k₁₂"], ["k₂₁", "k₂₂"], ["k₃₁", "k₃₂"], ["k₄₁", "k₄₂"]]} role="input" size={40} label="K: 4 positions ×2" />
    <Cells x={149} y={70} rows={[["E₁₁", "E₁₂", "E₁₃", "E₁₄"], ["E₂₁", "E₂₂", "E₂₃", "E₂₄"]]} role="parameter" size={44} label="E: 2 slots ×4 positions" />
    <Wire points={[[57, 207], [57, 253], [153, 253]]} role="input" /><Wire points={[[236, 159], [236, 253], [197, 253]]} role="parameter" /><Op x={175} y={253} symbol="×" />
    <Wire points={[[175, 275], [175, 301]]} /><Cells x={129} y={320} rows={[["K̃₁₁", "K̃₁₂"], ["K̃₂₁", "K̃₂₂"]]} size={46} label="EK: 2 slots ×2 features" />
    <Text x={175} y={445}>V has its own sequence projection F</Text>
  </Drawing>;
}
