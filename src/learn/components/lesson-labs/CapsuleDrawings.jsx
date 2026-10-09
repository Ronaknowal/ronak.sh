import { flowNumber as n } from './LessonFlow.jsx';
import { norm, squash } from '../../data/capsule-models.js';
import './capsule-flow.css';

export const capsuleInk = { input: '#77c9db', learned: '#e2b55a', output: '#b69ee8', neutral: '#ddd', line: '#929292', gradient: '#eb9859' };
const { input, learned, output, neutral, line, gradient } = capsuleInk;

export function CapsuleDrawing({ name, label, height = 300, children }) {
  return <figure className="capsule-flow-figure" data-figure={name}>
    <svg viewBox={`0 0 320 ${height + 12}`} role="img" aria-label={label}>{children}</svg>
  </figure>;
}
function Label({ x, y, children, color = neutral, anchor = 'middle', small = false }) {
  return <text x={x} y={y} fill={color} textAnchor={anchor} className={small ? 'capsule-flow-small' : undefined}>{children}</text>;
}
export function CapsuleWire({ x1, y1, x2, y2, color = line, dash }) {
  const radius = Math.hypot(x2 - x1, y2 - y1);
  if (!radius) return null;
  const ux = (x2 - x1) / radius, uy = (y2 - y1) / radius;
  return <g fill="none" stroke={color} strokeWidth="1.8" strokeDasharray={dash}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} />
    <path d={`M${x2 - 6 * ux - 3 * uy},${y2 - 6 * uy + 3 * ux} L${x2},${y2} L${x2 - 6 * ux + 3 * uy},${y2 - 6 * uy - 3 * ux}`} />
  </g>;
}
function Operation({ x = 160, y, width = 140, children }) {
  return <g><rect x={x - width / 2} y={y - 18} width={width} height="36" rx="7" fill="none" stroke={neutral} /><Label x={x} y={y + 5}>{children}</Label></g>;
}
function MapGrid({ x, y, size = 4, rows = size, side = 80, color = input, selected, depth = 1, values }) {
  return <g>{Array.from({ length: depth }, (_, index) => <rect key={`plane-${index}`} x={x + index * 5} y={y - index * 5} width={side} height={side * rows / size} fill="#090909" stroke={color} opacity={index === depth - 1 ? 1 : .55} />)}
    {Array.from({ length: size * rows }, (_, index) => {
      const cell = side / size;
      return <rect key={index} x={x + depth * 5 - 5 + index % size * cell} y={y - depth * 5 + 5 + Math.floor(index / size) * cell} width={cell} height={cell} fill={values ? `rgb(${values[index] * 255} ${values[index] * 255} ${values[index] * 255})` : index === selected ? '#262626' : 'none'} stroke={index === selected ? neutral : color} strokeWidth={index === selected ? 2.5 : .5} />;
    })}</g>;
}
function CoordinateVector({ x, y, count, width = 112, height = 24, color = output, selected }) {
  return <g>{Array.from({ length: count }, (_, index) => <rect key={index} x={x + index * width / count} y={y} width={width / count} height={height} fill={index === selected ? '#262626' : 'none'} stroke={index === selected ? neutral : color} strokeWidth={index === selected ? 2.5 : 1} />)}</g>;
}
function Axes({ originX = 145, originY = 170, scale = 45, limit = 2.5, minX = -limit, minY = -limit, maxY = limit, xlabel = 'coordinate 1', ylabel = 'coordinate 2', ylabelX = originX, ylabelY = originY - scale * limit - 15, ylabelAnchor = 'middle' }) {
  return <g><CapsuleWire x1={originX + scale * minX} y1={originY} x2={originX + scale * limit} y2={originY} /><CapsuleWire x1={originX} y1={originY - scale * minY} x2={originX} y2={originY - scale * maxY} /><Label x={originX + scale * limit} y={originY + 25} anchor="end" small>{xlabel}</Label><Label x={ylabelX} y={ylabelY} anchor={ylabelAnchor} small>{ylabel}</Label><Label x={originX - 8} y={originY + 19} anchor="end" small>0</Label></g>;
}
function VectorArrow({ vector, start = [0, 0], color = output, originX = 145, originY = 170, scale = 45, dash }) {
  return <CapsuleWire x1={originX + scale * start[0]} y1={originY - scale * start[1]} x2={originX + scale * vector[0]} y2={originY - scale * vector[1]} color={color} dash={dash} />;
}

export function CapsuleAnatomy() {
  return <CapsuleDrawing name="capsule-anatomy" label="An arrow from zero to coordinates 0.3 and0.4, with projected coordinate values, length0.5 and direction" height={300}>
    <Axes originX={65} originY={220} scale={320} limit={.55} minX={0} minY={0} />
    <path d="M65,92 H161 V220" stroke={input} fill="none" strokeDasharray="3 4" />
    <VectorArrow vector={[.3, .4]} originX={65} originY={220} scale={320} color={input} />
    <Label x={200} y={25} color={input}>u = (0.3, 0.4)</Label>
    <Label x={161} y={264} color={input}>0.3</Label><Label x={53} y={99} color={input} anchor="end">0.4</Label>
    <Label x={195} y={144}>length 0.5</Label><Label x={212} y={172}>direction ↗</Label>
    <Label x={160} y={282} small>Both coordinates describe one entity.</Label>
  </CapsuleDrawing>;
}

export function CapsuleGroupDrawing({ row, column, type }) {
  const selected = row * 4 + column;
  return <CapsuleDrawing name="capsule-grouping" label={`Sixteen channel planes at the same4by4 location; type${type} groups channels${type * 4} to${type * 4 + 3} into child${selected * 4 + type}`} height={390}>
    <Label x={160} y={22} color={input}>16 channel planes · 4 × 4</Label>
    <MapGrid x={102} y={59} depth={4} selected={selected} />
    <Label x={160} y={158}>same cell ({row}, {column})</Label>
    <CapsuleWire x1={160} y1={172} x2={160} y2={202} />
    {Array.from({ length: 4 }, (_, capsuleType) => <g key={capsuleType}>
      <Label x={28} y={229 + capsuleType * 37} anchor="start" color={capsuleType === type ? neutral : line}>type {capsuleType}</Label>
      <CoordinateVector x={109} y={210 + capsuleType * 37} count={4} color={input} />
      <Label x={267} y={228 + capsuleType * 37} small>{capsuleType * 4}–{capsuleType * 4 + 3}</Label>
      {capsuleType === type && <rect x="102" y={204 + capsuleType * 37} width="126" height="36" fill="none" stroke={neutral} strokeWidth="2" />}
    </g>)}
    <Label x={160} y={380} small>Four coordinates together; values unchanged.</Label>
  </CapsuleDrawing>;
}

export function CapsulePartWholeDrawing() {
  return <CapsuleDrawing name="capsule-parts" label="Two wheels predict a bicycle center through different part-to-whole offsets" height={230}>
    <circle cx="65" cy="141" r="31" stroke={input} fill="none" /><circle cx="254" cy="141" r="31" stroke={input} fill="none" />
    <path d="M65,141 L128,79 L163,141 Z M128,79 L203,79 L163,141 M203,79 L254,141 M203,79 L198,56 H221" stroke={line} strokeWidth="2" fill="none" />
    <circle cx="160" cy="102" r="5" fill={output} />
    <CapsuleWire x1={69} y1={133} x2={150} y2={105} color={learned} />
    <CapsuleWire x1={245} y1={130} x2={170} y2={105} color={learned} />
    <Label x={160} y={29} color={output}>predicted whole centre</Label>
    <Label x={65} y={203} color={input}>rear wheel</Label><Label x={254} y={203} color={input}>front wheel</Label>
    <Label x={160} y={225} small>Different relations; one whole.</Label>
  </CapsuleDrawing>;
}
export function CapsuleVoteDrawing() {
  return <CapsuleDrawing name="capsule-vote-transform" label="One four-coordinate child is transformed by two separate8by4 learned matrices into two eight-coordinate parent votes" height={390}>
    <Label x={160} y={25} color={input}>one child i · 4 coordinates</Label>
    <CoordinateVector x={104} y={44} count={4} color={input} />
    {[0, 1].map(parent => <g key={parent}>
      <CapsuleWire x1={parent ? 186 : 134} y1={74} x2={parent ? 246 : 74} y2={109} />
      <Label x={parent ? 246 : 74} y={130} color={learned}>Wᵢ{parent ? 'B' : 'A'}</Label>
      <MapGrid x={parent ? 214 : 42} y={153} size={4} rows={8} side={64} color={learned} />
      <Label x={parent ? 246 : 74} y={303} small>8 outputs × 4 inputs</Label>
      <CapsuleWire x1={parent ? 246 : 74} y1={313} x2={parent ? 246 : 74} y2={333} />
      <CoordinateVector x={parent ? 190 : 18} y={342} count={8} />
      <Label x={parent ? 246 : 74} y={384} color={output}>vote for {parent ? 'B' : 'A'}</Label>
    </g>)}
  </CapsuleDrawing>;
}

const childSeries = ['#77c9db', '#e2b55a', '#b69ee8'];
export function CapsuleContributionDrawing({ votes, state, parent }) {
  let end = [0, 0];
  return <CapsuleDrawing name={`capsule-contributions-${parent}`} label={`Parent${parent ? 'B' : 'A'} contributions summed head-to-tail with shared minus6 to6 coordinate scale`} height={365}>
    <Label x={160} y={22}>Parent {parent ? 'B' : 'A'} · head-to-tail sum</Label>
    <Axes originX={145} originY={160} scale={19} limit={6} />
    {votes.map((row, child) => {
      const start = end;
      end = end.map((value, coordinate) => value + state.coupling[child][parent] * row[parent][coordinate]);
      return <VectorArrow key={child} start={start} vector={end} color={childSeries[child]} originX={145} originY={160} scale={19} />;
    })}
    <VectorArrow vector={state.sums[parent]} originX={145} originY={160} scale={19} color={neutral} dash="4 4" />
    {votes.map((row, child) => <Label key={child} x={160} y={294 + 23 * child} color={childSeries[child]} small>child {child + 1}: {n(state.coupling[child][parent], 4)} × ({row[parent].map(value => n(value)).join(', ')})</Label>)}
    <Label x={160} y={364} small>Sum ({state.sums[parent].map(value => n(value, 4)).join(', ')}); axes ±6.</Label>
  </CapsuleDrawing>;
}

export function CapsuleSquashDrawing({ values }) {
  const result = squash(values), radius = norm(values);
  return <div className="flow-columns-2">
    <CapsuleDrawing name="capsule-squash-vectors" label="Input and squashed output arrows on the same coordinate axes; squash preserves direction" height={310}>
      <Axes originY={155} scale={22} limit={5} />
      <VectorArrow vector={values} originY={155} scale={22} color={input} />
      <VectorArrow vector={result} originY={155} scale={22} color={output} />
      <Label x={160} y={286} color={input}>input ({values.map(value => n(value, 2)).join(', ')})</Label>
      <Label x={160} y={308} color={output}>output ({result.map(value => n(value, 4)).join(', ')})</Label>
    </CapsuleDrawing>
    <CapsuleDrawing name="capsule-squash-curve" label="Analytic input radius versus output length; current point on r squared over1plus r squared" height={310}>
      <Label x={160} y={23}>output length · score, not probability</Label>
      <path d="M44,45 V241 H289" stroke={line} fill="none" />
      <polyline points={Array.from({ length: 121 }, (_, index) => { const r = index / 20; return `${44 + r * 40},${241 - 180 * r * r / (1 + r * r)}`; }).join(' ')} stroke={output} fill="none" strokeWidth="2" />
      {[0, .5, 1].map(value => <Label key={value} x={32} y={246 - value * 180} anchor="end" small>{value}</Label>)}
      {[0, 1, 3, 6].map(value => <Label key={value} x={44 + value * 40} y={267} small>{value}</Label>)}
      {radius <= 6 && <circle cx={44 + radius * 40} cy={241 - 180 * norm(result)} r="5" fill={input} />}
      <Label x={160} y={297}>input radius r →</Label>
    </CapsuleDrawing>
  </div>;
}

export function CapsuleRoutingDrawing({ state }) {
  return <CapsuleDrawing name="capsule-routing" label={`Routing step${state.step}: each child's shares over parents sum1; actual current shares lead to sum, squash and next-step agreement`} height={665}>
    <Label x={160} y={23}>step {state.step} · current outgoing shares</Label>
    {[0, 1, 2].map(child => <g key={child}>
      <circle cx={52 + child * 108} cy="67" r="15" fill="none" stroke={input} />
      <Label x={52 + child * 108} y={72} color={input}>{child + 1}</Label>
      <Label x={52 + child * 108} y={110} small>A {n(state.coupling[child][0], 3)}</Label>
      <Label x={52 + child * 108} y={136} small>B {n(state.coupling[child][1], 3)}</Label>
      <CapsuleWire x1={52 + child * 108} y1={150} x2={80} y2={199} />
      <CapsuleWire x1={52 + child * 108} y1={158} x2={240} y2={199} />
    </g>)}
    {[0, 1].map(parent => <g key={parent}>
      <Operation x={80 + parent * 160} y={218} width={118}>sum for {parent ? 'B' : 'A'}</Operation>
      <Label x={80 + parent * 160} y={260} color={output} small>({state.sums[parent].map(value => n(value, 3)).join(', ')})</Label>
      <CapsuleWire x1={80 + parent * 160} y1={275} x2={80 + parent * 160} y2={300} />
      <Operation x={80 + parent * 160} y={324} width={118}>squash</Operation>
      <Label x={80 + parent * 160} y={368} color={output} small>v₁ {n(state.outputs[parent][0], 5)}</Label>
      <Label x={80 + parent * 160} y={392} color={output} small>v₂ {n(state.outputs[parent][1], 5)}</Label>
      <Label x={80 + parent * 160} y={421} color={output} small>length {n(state.lengths[parent], 4)}</Label>
      <CapsuleWire x1={80 + parent * 160} y1={435} x2={80 + parent * 160} y2={464} />
    </g>)}
    <Operation y={490} width={272}>dot each vote with its parent</Operation>
    <CapsuleWire x1={160} y1={512} x2={160} y2={542} />
    <Operation y={567} width={240}>add agreements to logits</Operation>
    <CapsuleWire x1={160} y1={588} x2={160} y2={619} />
    <Label x={160} y={652} small>If another step: softmax again.</Label>
  </CapsuleDrawing>;
}

export function CapsuleLifetimeDrawing() {
  return <CapsuleDrawing name="capsule-state-lifetime" label="Learned weights persist between images while each image's routing logits begin at zero" height={250}>
    <MapGrid x={132} y={26} side={48} size={3} color={learned} />
    <Label x={160} y={105} color={learned}>learned W · retained</Label>
    <CapsuleWire x1={138} y1={117} x2={76} y2={149} /><CapsuleWire x1={182} y1={117} x2={244} y2={149} />
    <CoordinateVector x={18} y={161} count={4} color={input} /><CoordinateVector x={190} y={161} count={4} color={input} />
    <Label x={74} y={218} small>image 1: b starts 0</Label><Label x={246} y={243} small>image 2: b starts 0</Label>
  </CapsuleDrawing>;
}

export function CapsuleClassifierDrawing({ classic = false }) {
  const stages = classic
    ? [[1, 28, 'image · 28 × 28'], [256, 20, '256 channels · 20 × 20'], [256, 6, '32 types × 8 · 6 × 6']]
    : [[1, 8, 'image · 8 × 8'], [32, 8, '32 channels · 8 × 8'], [16, 4, '4 types × 4 · 4 × 4']];
  const actualImage = [0,0,0,.3125,1,.1875,0,0,0,0,.0625,.9375,1,.25,0,0,0,0,.625,1,1,.0625,0,0,0,.1875,1,1,.9375,.25,.125,0,0,.625,1,1,1,1,.75,0,0,.0625,.4375,.875,.8125,.375,.3125,0,0,0,0,.6875,.75,0,0,0,0,0,0,.25,.625,0,0,0];
  return <CapsuleDrawing name={classic ? 'capsule-classic-topology' : 'capsule-classifier'} label={classic ? 'Original28by28 CapsNet with actual changing spatial grids and grouped coordinates' : 'Tiny8by8 classifier, actual source251 input: spatial tensors group into64 four-vectors then route to10 eight-coordinate class vectors and score lengths'} height={990}>
    {stages.map(([channels, size, text], index) => <g key={index}>
      <Label x={160} y={24 + index * 170} color={index ? output : input}>{text}</Label>
      <MapGrid x={(320 - 84 * size / stages[0][1]) / 2 - (Math.min(channels, 4) - 1) * 5} y={47 + index * 170} side={84 * size / stages[0][1]} size={size} depth={Math.min(channels, 4)} color={index ? output : input} values={!classic && index === 0 ? actualImage : undefined} />
      <CapsuleWire x1={160} y1={144 + index * 170} x2={160} y2={160 + index * 170} />
    </g>)}
    <Label x={160} y={534}>regroup {classic ? '1,152 × 8' : '64 × 4'} coordinates</Label>
    {[0, 1, 2].map(index => <CoordinateVector key={index} x={104} y={550 + 30 * index} count={classic ? 8 : 4} />)}
    <Label x={235} y={597} small>⋮</Label>
    <CapsuleWire x1={160} y1={645} x2={160} y2={668} />
    <Operation y={692} width={232}>learned votes → routing</Operation>
    {Array.from({ length: 10 }, (_, row) => <g key={row}><CoordinateVector x={75} y={733 + row * 18} count={classic ? 16 : 8} width={170} height={14} /><Label x={55} y={745 + row * 18} small>{row}</Label></g>)}
    <Label x={160} y={949} color={output}>10 vectors · each {classic ? 16 : 8} coordinates</Label>
    <Label x={160} y={980}>length of each → longest class</Label>
  </CapsuleDrawing>;
}

export function CapsuleDecoderDrawing({ selected = 4, coordinate = 0, delta = 0 }) {
  return <CapsuleDrawing name="capsule-decoder-boundary" label={`Ten class vectors; only class${selected} passes the mask; true training label and inference argmax supply separate mask choices; labels never enter the encoder`} height={845}>
    <Label x={160} y={23} color={output}>10 class vectors · each 8 coordinates</Label>
    {Array.from({ length: 10 }, (_, index) => <g key={index}>
      <CoordinateVector x={80} y={42 + index * 27} count={8} width={152} selected={index === selected ? coordinate : undefined} />
      <Label x={59} y={61 + index * 27} small>{index}</Label>
    </g>)}
    <CapsuleWire x1={160} y1={317} x2={160} y2={395} />
    <Label x={64} y={342} small>training:</Label><Label x={64} y={366} color={input} small>true class y</Label>
    <Label x={256} y={342} small>inference:</Label><Label x={256} y={366} color={output} small>longest class</Label>
    <CapsuleWire x1={65} y1={381} x2={105} y2={411} /><CapsuleWire x1={255} y1={381} x2={215} y2={411} />
    <Operation y={413} width={180}>keep class {selected}</Operation>
    <CapsuleWire x1={160} y1={435} x2={160} y2={460} />
    {Array.from({ length: 10 }, (_, row) => <g key={row}>
      <Label x={54} y={482 + row * 13} small>{row}</Label>
      {Array.from({ length: 8 }, (_, column) => <rect key={column} x={80 + column * 20} y={472 + row * 13} width="20" height="13" fill="none" stroke={row === selected ? output : line} strokeDasharray={row === selected ? undefined : '2 2'} />)}
      {row !== selected && <Label x={257} y={482 + row * 13} small>0</Label>}
    </g>)}
    <Label x={160} y={633} small>{delta ? `coordinate ${coordinate}: add ${n(delta)}` : '80 values; 72 zeroed by the mask'}</Label>
    <CapsuleWire x1={160} y1={645} x2={160} y2={667} />
    <Operation y={692} width={240}>flatten 80 → 64 → 128 → 64</Operation>
    <CapsuleWire x1={160} y1={714} x2={160} y2={738} />
    <MapGrid x={120} y={748} side={64} size={8} color={output} />
    <Label x={160} y={840}>64 reconstructed pixels · sigmoid</Label>
  </CapsuleDrawing>;
}

export function CapsuleObjectiveDrawing() {
  return <CapsuleDrawing name="capsule-objective-routes" label="True class targets margin loss and the training decoder mask; original pixels target reconstruction loss; margin plus0.0005times reconstruction squared-error sum gives total training loss; targets never enter encoder" height={650}>
    <Label x={56} y={25} color={input}>pixels x</Label><Label x={257} y={25} color={input}>true class y</Label>
    <CapsuleWire x1={56} y1={42} x2={56} y2={80} />
    <Operation x={56} y={101} width={100}>encoder</Operation>
    <CapsuleWire x1={56} y1={121} x2={56} y2={151} />
    {Array.from({ length: 10 }, (_, row) => <CoordinateVector key={row} x={17} y={141 + row * 8} width={78} height={6} count={8} />)}
    <Label x={56} y={246} color={output} small>10 × 8</Label>
    <CapsuleWire x1={56} y1={255} x2={56} y2={266} />
    <Operation x={56} y={284} width={100}>lengths</Operation>
    <CapsuleWire x1={111} y1={284} x2={166} y2={284} />
    <Operation x={236} y={284} width={140}>margin loss</Operation>
    <CapsuleWire x1={257} y1={43} x2={257} y2={266} color={input} />
    <path d="M95,175 H158 V327" fill="none" stroke={output} />
    <CapsuleWire x1={158} y1={327} x2={158} y2={350} color={output} />
    <Operation x={158} y={375} width={140}>mask → decoder</Operation>
    <path d="M257,56 H312 V375 H229" fill="none" stroke={input} strokeDasharray="4 4" />
    <circle cx="257" cy="56" r="3" fill={input} />
    <CapsuleWire x1={243} y1={375} x2={228} y2={375} color={input} />
    <CapsuleWire x1={158} y1={395} x2={158} y2={438} color={output} />
    <Operation x={158} y={462} width={228}>reconstruction loss</Operation>
    <path d="M56,52 H6 V462 H42" fill="none" stroke={input} strokeDasharray="4 4" />
    <circle cx="56" cy="52" r="3" fill={input} />
    <CapsuleWire x1={26} y1={462} x2={42} y2={462} color={input} />
    <CapsuleWire x1={158} y1={480} x2={158} y2={516} />
    <Operation x={158} y={539} width={140}>× 0.0005</Operation>
    <CapsuleWire x1={158} y1={557} x2={158} y2={592} />
    <path d="M290,302 V610 H184" fill="none" stroke={output} />
    <CapsuleWire x1={204} y1={610} x2={176} y2={610} color={output} />
    <circle cx="158" cy="610" r="17" fill="none" stroke={neutral} /><Label x={158} y={615}>⊕</Label>
    <Label x={158} y={647}>total training loss L</Label>
  </CapsuleDrawing>;
}

export function CapsuleCoordinateAdditionDrawing() {
  const values = [[1, 0, 0, .35], [0, 1, 0, .7], [0, 0, 1, 0], [0, 0, 0, 1]];
  return <CapsuleDrawing name="capsule-coordinate-addition" label="Constructed4by4 pose vote: add normalized row0.25 and column0.5 to first two last-column entries0.1 and0.2, yielding0.35 and0.7" height={380}>
    <Label x={160} y={24}>shared relation + cell centre</Label>
    <Label x={160} y={57} color={input}>row 0.25; column 0.5</Label>
    {values.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><rect x={60 + j * 50} y={90 + i * 50} width="50" height="50" fill="none" stroke={j === 3 && i < 2 ? neutral : output} strokeWidth={j === 3 && i < 2 ? 2.5 : 1} /><Label x={85 + j * 50} y={120 + i * 50} color={output}>{value}</Label></g>))}
    <Label x={160} y={323}>0.1 + 0.25 = 0.35</Label><Label x={160} y={351}>0.2 + 0.5 = 0.7</Label>
    <Label x={160} y={378} small>Constructed entries, not fitted.</Label>
  </CapsuleDrawing>;
}
export function CapsuleDensityDrawing() {
  return <CapsuleDrawing name="capsule-transformed-density" label="A uniform square with area1and probability mass0.2 becomes area2under horizontal scaling2, with preserved mass and density0.1" height={240}>
    <Label x={160} y={25}>same mass; different coordinate area</Label>
    <rect x="25" y="70" width="65" height="65" fill="#132127" stroke={input} /><rect x="160" y="70" width="130" height="65" fill="#20182b" stroke={output} />
    <CapsuleWire x1={102} y1={101} x2={149} y2={101} color={learned} />
    <Label x={127} y={60} color={learned} small>×2</Label>
    <Label x={58} y={165} small>area 1</Label><Label x={225} y={165} small>area 2</Label>
    <Label x={58} y={192} color={input} small>density 0.2</Label><Label x={225} y={192} color={output} small>density 0.1</Label>
    <Label x={160} y={230}>0.2 × 1 = 0.1 × 2 = mass 0.2</Label>
  </CapsuleDrawing>;
}

export function CapsuleMarginDrawing({ trueLength = .7, wrongLength = .3, spread = false }) {
  return <CapsuleDrawing name={spread ? 'capsule-spread-loss' : 'capsule-margin-loss'} label={spread ? 'Spread loss compares true and wrong activation gap against margin0.2' : 'Separate true and wrong score rulers with true threshold0.9 and wrong threshold0.1'} height={240}>
    {[trueLength, wrongLength].map((value, index) => <g key={index}>
      <Label x={160} y={28 + 94 * index}>{index ? 'wrong class' : 'true class'} · {n(value, 3)}</Label>
      <path d={`M30,${55 + 94 * index} H290`} stroke={line} />
      <circle cx={30 + 260 * value} cy={55 + 94 * index} r="5" fill={output} />
      {!spread && <g><path d={`M${30 + 260 * (index ? .1 : .9)},${46 + 94 * index}v18`} stroke={neutral} /><Label x={30 + 260 * (index ? .1 : .9)} y={91 + 94 * index} small>threshold {index ? .1 : .9}</Label></g>}
    </g>)}
    <Label x={160} y={226}>{spread ? `gap ${n(trueLength - wrongLength, 3)}; required 0.2` : 'Each ruler runs from 0 to 1.'}</Label>
  </CapsuleDrawing>;
}

export function CapsuleSensitivityDrawing({ radius = .5, delta = .02 }) {
  const direction = radius ? [.6, .8] : [1, 0], tangent = [-direction[1], direction[0]], base = direction.map(value => value * radius), result = squash(base);
  const points = [base.map((value, index) => value + delta * direction[index]), base.map((value, index) => value + delta * tangent[index])];
  return <div className="flow-columns-2">{[false, true].map(isOutput => <CapsuleDrawing key={String(isOutput)} name={isOutput ? 'capsule-sensitivity-output' : 'capsule-sensitivity-input'} label={isOutput ? 'Output changes from equal radial and perpendicular input perturbations, enlarged to show actual finite displacements' : 'Equal radial and perpendicular input perturbations at the same arrow endpoint'} height={340}>
    <Label x={160} y={25}>{isOutput ? 'output changes · enlarged' : 'input changes · enlarged'}</Label>
    <Axes originX={145} originY={165} scale={isOutput ? 85 : 20} limit={isOutput ? 1.5 : 6} />
    <VectorArrow vector={isOutput ? result : base} originX={145} originY={165} scale={isOutput ? 85 : 20} color={isOutput ? output : input} />
    {points.map((point, index) => {
      const change = isOutput ? squash(point).map((value, axis) => value - result[axis]) : point.map((value, axis) => value - base[axis]);
      const origin = isOutput ? result : base;
      return <VectorArrow key={index} start={origin} vector={origin.map((value, axis) => value + change[axis] * (isOutput ? 10 : 40))} originX={145} originY={165} scale={isOutput ? 85 : 20} color={index ? learned : input} />;
    })}
    <Label x={160} y={286} color={input}>radial · along arrow</Label><Label x={160} y={312} color={learned}>perpendicular · turns arrow</Label>
    <Label x={160} y={337} small>Axes {isOutput ? '±1.5; perturbations ×10' : '±6; perturbations ×40'}.</Label>
  </CapsuleDrawing>)}</div>;
}

export function CapsuleGradientDrawing() {
  return <CapsuleDrawing name="capsule-gradient-routes" label="Vote reaches output directly and through computed couplings; detach stops the orange dashed coupling feedback gradient, not forward numbers" height={375}>
    <circle cx="160" cy="38" r="17" fill="none" stroke={input} /><Label x={160} y={43} color={input}>u</Label>
    <CapsuleWire x1={145} y1={60} x2={72} y2={112} /><CapsuleWire x1={175} y1={60} x2={248} y2={112} />
    <Operation x={72} y={140} width={105}>vote value</Operation><Operation x={248} y={140} width={105}>coupling c(u)</Operation>
    <CapsuleWire x1={72} y1={160} x2={146} y2={240} /><CapsuleWire x1={248} y1={160} x2={174} y2={240} />
    <circle cx="160" cy="256" r="17" fill="none" stroke={neutral} /><Label x={160} y={261}>⊗</Label>
    <CapsuleWire x1={160} y1={278} x2={160} y2={310} /><Label x={160} y={338} color={output}>output c(u) · u</Label>
    <CapsuleWire x1={192} y1={253} x2={282} y2={179} color={gradient} dash="4 4" />
    <Label x={160} y={371} color={gradient} small>Detach removes coupling's backward route.</Label>
  </CapsuleDrawing>;
}

export function CapsuleFrameDrawing({ angle = 90, stretch = 2, physical = true }) {
  const radians = angle * Math.PI / 180;
  const rotate = ([x, y]) => [Math.cos(radians) * x - Math.sin(radians) * y, Math.sin(radians) * x + Math.cos(radians) * y];
  const original = physical ? [1, 3] : [stretch, 2];
  const after = rotate(original);
  const other = physical ? rotate([1, 3]) : rotate([1, 2]).map((value, index) => value * (index ? 1 : stretch));
  return <CapsuleDrawing name={physical ? 'capsule-frame-commuting' : 'capsule-frame-counterexample'} label={physical ? 'Constructed part frame at2,3 predicts whole at1,3; rotation and relation application yield same rotated endpoint' : 'Unconstrained vote map: rotate then stretch differs from stretch then rotate'} height={380}>
    <Label x={160} y={22}>{physical ? 'supplied part–whole relation' : 'unconstrained vector relation'}</Label>
    <Axes originX={160} originY={175} scale={18} limit={7} minY={-5.5} maxY={5.5} ylabelX={142} ylabelY={89} ylabelAnchor="end" />
    <VectorArrow vector={original} originX={160} originY={175} scale={18} color={input} />
    <VectorArrow vector={after} originX={160} originY={175} scale={18} color={output} />
    <VectorArrow vector={other} originX={160} originY={175} scale={18} color={learned} dash="4 4" />
    {physical && <g>{[[[2, 3], 0, input], [[1, 3], 0, learned], [rotate([2, 3]), radians, input], [after, radians, output]].map(([point, rotation, color], index) => <g key={index}>
      <circle cx={160 + 18 * point[0]} cy={175 - 18 * point[1]} r="3" fill={color} />
      <CapsuleWire x1={160 + 18 * point[0]} y1={175 - 18 * point[1]} x2={160 + 18 * point[0] + 14 * Math.cos(rotation)} y2={175 - 18 * point[1] - 14 * Math.sin(rotation)} color={color} />
      <CapsuleWire x1={160 + 18 * point[0]} y1={175 - 18 * point[1]} x2={160 + 18 * point[0] - 14 * Math.sin(rotation)} y2={175 - 18 * point[1] - 14 * Math.cos(rotation)} color={color} />
    </g>)}<Label x={160} y={60} color={input} small>part origin (2,3) → whole (1,3)</Label></g>}
    <Label x={160} y={312} color={output} small>{physical ? 'both transformation orders' : 'stretch, then rotate'}: ({after.map(value => n(value, 3)).join(', ')})</Label>
    <Label x={160} y={343} color={learned} small>{physical ? 'same endpoint · dashed overlaps solid' : 'rotate, then stretch'}: ({other.map(value => n(value, 3)).join(', ')})</Label>
    <Label x={160} y={375} small>{physical ? 'Supplied frames, not learned axes.' : `endpoint difference length ${n(norm(after.map((value, index) => value - other[index])), 5)}`}</Label>
  </CapsuleDrawing>;
}

export function CapsuleEMDrawing({ votes, state, parent = 0 }) {
  const identified = state && state.mass[parent] > 1e-12;
  const scale = 42;
  return <CapsuleDrawing name={`capsule-em-distribution-${parent}`} label={`Parent${parent ? 'B' : 'A'} sees its own transformed votes; effective mass determines mean and diagonal spread, or no evidence is identified`} height={370}>
    <Label x={160} y={24}>Parent {parent ? 'B' : 'A'} · transformed vote plane</Label>
    <path d="M18,175 H286 M64,214 V119" stroke={line} fill="none" />
    <Label x={286} y={201} anchor="end" small>coordinate 1 →</Label><Label x={64} y={108} small>coordinate 2 ↑</Label>
    {identified && <ellipse cx={64 + scale * state.means[parent][0]} cy={175 - scale * state.means[parent][1]} rx={scale * Math.sqrt(state.variance[parent][0])} ry={scale * Math.sqrt(state.variance[parent][1])} stroke={output} fill="none" strokeDasharray="4 4" />}
    {votes.map((row, child) => <g key={child}><circle cx={64 + scale * row[parent][0]} cy={175 - scale * row[parent][1]} r={3 + (state?.effective[child][parent] ?? 0) * 6} fill={childSeries[child]} /><Label x={36 + 112 * child} y={277} color={childSeries[child]} small>child {child + 1}</Label></g>)}
    {identified && <path d={`M${58 + scale * state.means[parent][0]},${175 - scale * state.means[parent][1]}h12m-6,-6v12`} stroke={output} strokeWidth="2" />}
    <Label x={160} y={310} color={output} small>{identified ? `mean ${n(state.means[parent][0], 5)}; mass ${n(state.mass[parent], 5)}` : 'mean not identified · no active evidence'}</Label>
    <Label x={160} y={340} small>{identified ? `horizontal variance ${n(state.variance[parent][0], 5)}` : 'A denominator guard cannot create evidence.'}</Label>
    <Label x={160} y={369} small>Vertical floor 0.01; not observed spread.</Label>
  </CapsuleDrawing>;
}

export function CapsuleEMProcessDrawing() {
  return <CapsuleDrawing name="capsule-em-process" label="Child activation multiplies normalized responsibility once; resulting weighted votes determine means and spread, then cost activation and density revise responsibility" height={400}>
    <Label x={80} y={26} color={input}>child activation aᵢ</Label><Label x={246} y={26} color={output}>share Rᵢⱼ</Label>
    <CapsuleWire x1={80} y1={43} x2={145} y2={81} /><CapsuleWire x1={246} y1={43} x2={175} y2={81} />
    <circle cx="160" cy="99" r="17" fill="none" stroke={neutral} /><Label x={160} y={104}>⊗</Label>
    <Label x={160} y={145} color={output}>effective mass qᵢⱼ = aᵢ Rᵢⱼ</Label>
    <CapsuleWire x1={160} y1={158} x2={160} y2={183} /><Operation y={207} width={266}>weighted mean and spread</Operation>
    <CapsuleWire x1={119} y1={229} x2={80} y2={265} /><CapsuleWire x1={201} y1={229} x2={245} y2={265} />
    <Operation x={80} y={288} width={138}>coding cost</Operation><Operation x={245} y={288} width={138}>log density</Operation>
    <CapsuleWire x1={80} y1={309} x2={80} y2={319} />
    <CapsuleWire x1={245} y1={309} x2={245} y2={346} />
    <Label x={80} y={339} color={output}>parent activation</Label><Label x={245} y={367} color={output}>next child shares</Label>
    <CapsuleWire x1={132} y1={342} x2={169} y2={357} />
    <Label x={160} y={397} small>Recompute q from fixed a and new R each round.</Label>
  </CapsuleDrawing>;
}

export function CapsulePriorDrawing() {
  return <CapsuleDrawing name="capsule-prior-posterior" label="Constructed Gaussian mean inference: prior centered zero, one observed vote2 gives posterior mean1 variance0.5, nine votes2 mean1.8 variance0.1" height={270}>
    <Label x={160} y={23}>uncertainty over a parent's mean</Label>
    <path d="M35,210 H295" fill="none" stroke={line} />
    {[[0, 1, input], [1, .5, output], [1.8, .1, learned]].map(([mean, variance, color]) => <polyline key={mean} fill="none" stroke={color} strokeWidth="2" points={Array.from({ length: 101 }, (_, index) => { const x = -2 + index * .06; return `${35 + (x + 2) * 43},${210 - 88 * Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance)}`; }).join(' ')} />)}
    <Label x={72} y={147} color={input} small>prior · 0</Label><Label x={150} y={121} color={output} small>1 vote · 1</Label><Label x={248} y={69} color={learned} small>9 votes · 1.8</Label>
    <Label x={35} y={237} small>−2</Label><Label x={121} y={237} small>0</Label><Label x={207} y={237} small>2</Label><Label x={293} y={237} small>4</Label>
    <Label x={160} y={266}>candidate mean →</Label>
  </CapsuleDrawing>;
}
export function CapsuleGateDrawing() {
  return <CapsuleDrawing name="capsule-straight-through" label="Hard gate jumps from0to1 at zero; surrogate sigmoid derivative is continuous and nonzero at1" height={275}>
    <Label x={160} y={23}>hard forward / surrogate backward</Label>
    <path d="M35,212 H292 M163,45 V212" stroke={line} fill="none" />
    <path d="M35,212 H163 M163,68 H292" stroke={output} strokeWidth="2" fill="none" />
    <polyline stroke={gradient} strokeDasharray="4 4" fill="none" points={Array.from({ length: 81 }, (_, index) => { const x = -4 + index / 10, sigmoid = 1 / (1 + Math.exp(-x)); return `${35 + index * 3.2},${212 - 144 * sigmoid * (1 - sigmoid)}`; }).join(' ')} />
    <circle cx="195" cy="68" r="4" fill={output} /><circle cx="195" cy={212 - 144 * .1966119332} r="4" fill={gradient} />
    <Label x={74} y={97} color={output} small>forward gate</Label><Label x={225} y={154} color={gradient} small>surrogate ∂</Label>
    <Label x={195} y={243} small>s = 1</Label><Label x={160} y={272} small>At 1: true ∂ = 0; surrogate ∂ ≈ 0.1966.</Label>
  </CapsuleDrawing>;
}
