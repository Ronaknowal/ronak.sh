import { Drawing, Arrow, Cells } from './MessagePassingFlowElements.jsx';
import { flowNumber as number } from './LessonFlow.jsx';
import examples from '../../data/message-passing-examples.json';

const cyan = '#82d3ed', amber = '#e4b752', violet = '#c1a4f5';
const sign = value => value > 0 ? '#342b18' : value < 0 ? '#152539' : '#161616';
const title = (y, text, hue = '#eee') => <text x={16} y={y} fill={hue}>{text}</text>;

// Every tile represents an actual entry, not a decorative layer icon. A matrix
// overview encodes sign only; the selected row and stored weights give numbers.
function MatrixOverview({ values, y, selected = 2, columns = values[0].length }) {
  const size = Math.min(16, 240 / columns), rowHeight = 8;
  return <g>
    {values.map((row, r) => <g key={r}>
      {row.map((value, c) => <rect key={c} x={38 + c * size} y={y + r * rowHeight}
        width={size - 1} height={rowHeight - 1} fill={sign(value)} />)}
      {(r === selected || r === values.length - 1) &&
        <text x={28} y={y + r * rowHeight + 7} textAnchor="end">{r}</text>}
    </g>)}
    <rect x={36} y={y + selected * rowHeight - 1} width={columns * size + 3}
      height={rowHeight + 1} stroke="#fff" fill="none" />
  </g>;
}

function IndexedVector({ values, y, columns = 2, before }) {
  const cellWidth = 124;
  return <g>{values.map((value, index) => {
    const x = 16 + index % columns * cellWidth, rowY = y + Math.floor(index / columns) * 67;
    return <g key={index}>
      <text x={x} y={rowY}>Channel {index + 1}</text>
      <rect x={x} y={rowY + 9} width={112} height={35} fill={sign(value)} stroke={before?.[index] < 0 ? violet : '#666'} />
      <text x={x + 56} y={rowY + 32} textAnchor="middle">{number(value, 4)}</text>
    </g>;
  })}</g>;
}

function StoredWeights({ values, layer, inputLabels }) {
  const columns = values[0].length, cellWidth = columns === 3 ? 68 : 96;
  return <Drawing width={288} height={155 + values.length * 40}
    label={`${layer}: complete saved weight values; rows are output channels and columns are input channels`}>
    {title(25, `${layer}: actual saved weights`, amber)}
    {title(55, `${values.length} output rows × ${columns} inputs`)}
    {inputLabels.map((label, c) => <text key={c} x={64 + c * cellWidth} y={88} textAnchor="middle">{label}</text>)}
    {values.map((row, r) => <g key={r}>
      <text x={24} y={119 + r * 40} textAnchor="end">{r + 1}</text>
      {row.map((value, c) => <g key={c}>
        <rect x={32 + c * cellWidth} y={97 + r * 40} width={cellWidth - 4} height={32} fill={sign(value)} stroke={amber} />
        <text x={32 + c * cellWidth + (cellWidth - 4) / 2} y={119 + r * 40} textAnchor="middle">{number(value, 3)}</text>
      </g>)}
    </g>)}
    {title(142 + values.length * 40, 'Same weights at every member')}
  </Drawing>;
}

function FirstProjection({ trace }) {
  return <Drawing width={288} height={895} label="Actual 34×3 input array and 34×16 projected array; white row is member 2, selected first channel is a dot product with saved W1 row 1">
    {title(25, 'X: members down, channels across')}
    {title(55, '34 × 3; white row = member 2')}
    <MatrixOverview values={trace.features} y={78} />
    {title(378, 'Member 2: constant, degree, pairs')}
    <Cells x={16} y={396} values={[trace.features[2]]} cellWidth={85} digits={4} />
    <Arrow x1={144} y1={446} x2={144} y2={479} />
    {title(508, 'Each row × shared W₁ᵀ', amber)}
    {title(538, 'No neighboring row enters yet')}
    <MatrixOverview values={trace.result.first.projected} y={565} />
    {title(868, '34 rows × 16 projected channels')}
  </Drawing>;
}

function ChannelGather({ trace, model, layer = 'first', channel = 0 }) {
  const result = trace.result[layer], coefficients = result.coefficients[2];
  const incoming = coefficients.flatMap((coefficient, source) => coefficient ? [{ source, coefficient,
    value: result.projected[source][channel], product: coefficient * result.projected[source][channel] }] : []);
  const extent = Math.max(...incoming.map(row => Math.abs(row.product)), .00001);
  const height = incoming.length * 76 + 277;
  return <Drawing width={288} height={height}
    label={`${layer} layer, member 2 channel ${channel + 1}: each allowed sender's projected value times S[2,sender], followed by their sum and saved bias`}>
    {title(25, `${layer === 'first' ? 'First' : 'Last'} layer: member 2, channel ${channel + 1}`)}
    {title(56, 'Sender → coefficient × projection')}
    {incoming.map((row, index) => {
      const y = 88 + index * 76;
      return <g key={row.source}>
        <text x={16} y={y} fill={row.source === 2 ? '#fff' : cyan}>ID {row.source}: {number(row.coefficient, 4)} × {number(row.value, 4)}</text>
        <line x1={144} y1={y + 9} x2={144} y2={y + 33} stroke="#777" />
        <rect x={row.product < 0 ? 144 - Math.abs(row.product) / extent * 90 : 144} y={y + 12}
          width={Math.abs(row.product) / extent * 90} height={15} fill={row.product < 0 ? cyan : amber} />
        <text x={16} y={y + 48}>Product {number(row.product, 5)}</text>
      </g>;
    })}
    {title(height - 171, 'Bars: products; shared zero at │')}
    {title(height - 137, 'Cyan negative · amber positive')}
    <Arrow x1={144} y1={height - 119} x2={144} y2={height - 89} />
    {title(height - 62, `Sum = ${number(incoming.reduce((total, row) => total + row.product, 0), 6)}`)}
    {title(height - 25, `Add bias ${number(model.state[layer + '.bias'][channel], 6)}`, amber)}
  </Drawing>;
}

function HiddenChannels({ trace, model }) {
  const before = trace.result.first.output[2], hidden = trace.result.hidden[2];
  return <Drawing width={288} height={913} label="Member 2 complete 16-channel hidden row: negative pre-ReLU entries become zero, all nonnegative entries survive; violet outlines mark clipped channels">
    {title(25, 'After S aggregation, add b₁', amber)}
    {title(58, `Channel 1 bias = ${number(model.state['first.bias'][0], 6)}`)}
    {title(92, `Pre-ReLU = ${number(before[0], 6)}`, violet)}
    <text x={68} y={139} textAnchor="middle">Before</text>
    <text x={220} y={139} textAnchor="middle">After</text>
    <rect x={16} y={152} width={104} height={42} fill={sign(before[0])} stroke={cyan} />
    <text x={68} y={180} textAnchor="middle">{number(before[0], 4)}</text>
    <Arrow x1={124} y1={174} x2={163} y2={174} hue={violet} />
    <rect x={168} y={152} width={104} height={42} fill={sign(hidden[0])} stroke={violet} />
    <text x={220} y={180} textAnchor="middle">{number(hidden[0], 4)}</text>
    {title(254, 'ReLU: negative → 0', violet)}
    {title(288, 'All 16 actual hidden entries')}
    <IndexedVector values={hidden} y={327} before={before} />
    {title(889, 'Violet outlines: clipped to zero', violet)}
  </Drawing>;
}

function LastProjection({ trace, model }) {
  const stored = model.state['last.linear.weight'];
  // Display W2 transpose explicitly so its two class columns fit a phone while
  // retaining all32 actual saved parameters and their original storage meaning.
  const transposed = stored[0].map((_, channel) => stored.map(row => row[channel]));
  return <>
    <Drawing width={288} height={1010} label="Complete saved W2 transpose: 16 hidden-input rows by 2 class-output columns; original PyTorch storage is 2×16">
      {title(25, 'W₂ᵀ: actual last-layer weights', amber)}
      {title(57, 'Shown: 16 inputs × 2 outputs')}
      {title(89, 'Stored W₂ has shape 2 × 16')}
      <text x={109} y={125} textAnchor="middle">class 0</text><text x={207} y={125} textAnchor="middle">class 1</text>
      {transposed.map((row, channel) => <g key={channel}>
        <text x={27} y={163 + channel * 48} textAnchor="end">{channel + 1}</text>
        <Cells x={60} y={136 + channel * 48} values={[row]} cellWidth={98} digits={3} />
      </g>)}
      {title(955, 'Each hidden row × W₂ᵀ', amber)}
      {title(989, 'Then S gathers projected rows')}
    </Drawing>
    <Drawing width={288} height={589} label="Actual last projected 34×2 array, then member 2 two class logits after S and saved b2, then class softmax probabilities">
      {title(25, '34 rows × 2 projected classes')}
      <MatrixOverview values={trace.result.last.projected} y={50} />
      {title(353, 'S gathers; add b₂; no ReLU')}
      <text x={79} y={389} textAnchor="middle" fill={cyan}>class 0</text>
      <text x={207} y={389} textAnchor="middle" fill={amber}>class 1</text>
      <Cells x={20} y={405} values={[trace.result.logits[2]]} cellWidth={128} digits={4} />
      <Arrow x1={144} y1={456} x2={144} y2={479} />
      {title(510, 'Softmax over these two classes')}
      <Cells x={20} y={530} values={[trace.result.probabilities[2]]} cellWidth={128} digits={5} signFill={false} />
    </Drawing>
  </>;
}

function FittingLabels({ trace }) {
  const ids = new Set(examples.roles.fit);
  return <Drawing width={288} height={1210} label="All 34 logit rows are computed, but only ten fitting rows have answer-to-cross-entropy wires; summed observed terms divided by 10 give final saved-weight fitting loss">
    {title(25, 'All 34 logits exist')}
    {title(57, 'Labels enter only at fitting rows')}
    {title(89, 'Logits → CE ← known answer y')}
    {trace.result.logits.map((row, id) => <g key={id}>
      <text x={25} y={122 + id * 20} textAnchor="end" fill={ids.has(id) ? '#fff' : '#aaa'}>{id}</text>
      <rect x={37} y={112 + id * 20} width={39} height={11} fill={sign(row[0])} stroke={ids.has(id) ? '#fff' : '#444'} />
      <rect x={79} y={112 + id * 20} width={39} height={11} fill={sign(row[1])} stroke={ids.has(id) ? '#fff' : '#444'} />
      {ids.has(id) && <><Arrow x1={124} y1={118 + id * 20} x2={144} y2={118 + id * 20} />
        <circle cx={151} cy={118 + id * 20} r={5} fill={violet} />
        <Arrow x1={184} y1={118 + id * 20} x2={159} y2={118 + id * 20} />
        <text x={191} y={123 + id * 20} fill={graphTargetHue(id)}>y = {examples.graph.nodes[id].club}</text></>}
    </g>)}
    {title(823, 'Exactly 10 cross-entropy terms')}
    {trace.fitRows.map((row, index) => <g key={row.id}>
      <text x={16} y={859 + index * 24}>ID {row.id}</text>
      <line x1={78} y1={853 + index * 24} x2={132} y2={853 + index * 24} stroke="#aaa" />
      <text x={146} y={859 + index * 24}>{number(row.loss, 6)}</text>
    </g>)}
    <Arrow x1={144} y1={1101} x2={144} y2={1138} />
    {title(1170, `Sum / 10 = ${number(trace.fitLoss, 8)}`, violet)}
    {title(1201, 'At saved final parameters')}
  </Drawing>;
}

const graphTargetHue = id => examples.graph.nodes[id].club ? amber : cyan;

export function SavedGraphArrays({ trace, model }) {
  return <>
    <p className="flow-note">Array fills show sign only: amber is positive, cyan is negative and charcoal is zero. White outlines trace member 2; in the loss drawing they mark the ten fitting rows. Channel numbers index computed features, not club labels. Numerical labels are rounded; a displayed zero loss can be a small positive term.</p>
    <div className="mp-study-grid">
      <FirstProjection trace={trace} />
      <StoredWeights values={model.state['first.linear.weight']} layer="W₁" inputLabels={['input 1', 'input 2', 'input 3']} />
      <ChannelGather trace={trace} model={model} />
      <HiddenChannels trace={trace} model={model} />
      <LastProjection trace={trace} model={model} />
      <ChannelGather trace={trace} model={model} layer="last" channel={0} />
      <ChannelGather trace={trace} model={model} layer="last" channel={1} />
      <FittingLabels trace={trace} />
    </div>
    <p>For each layer, multiply each member’s row by the same stored weights, gather the allowed projected rows with S, then add the shared bias. ReLU clips the first layer’s negative entries. The last layer retains signed logits. The two final gathered routes show where member 2’s two logits come from.</p>
    <p>The loss drawing selects ten fitting rows; no withheld answer enters it. The original program clears gradients, differentiates this computation back through both layers, then applies AdamW with learning rate .02 and weight decay .01 for 300 epochs. These views inspect saved final parameters; they do not replay optimizer steps or claim saved gradients.</p>
  </>;
}
