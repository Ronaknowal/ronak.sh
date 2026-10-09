import { flowNumber as number } from './LessonFlow.jsx';
import './state-space-flow.css';
const colours = {
  input: '#79c5d8',
  parameter: '#e2b55a',
  computed: '#baa1e3',
  ink: '#dedede',
  wire: '#898989',
  credit: '#e99369'
};
function Label({
  x,
  y,
  children,
  role = 'ink',
  anchor = 'start',
  size = 14
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={colours[role]} fontSize={size}>{children}</text>;
}
function Wire({
  points,
  credit = false
}) {
  const end = points.at(-1),
    previous = points.at(-2);
  const angle = Math.atan2(end[1] - previous[1], end[0] - previous[0]);
  const tip = sign => [end[0] - 7 * Math.cos(angle) + sign * 3 * Math.sin(angle), end[1] - 7 * Math.sin(angle) - sign * 3 * Math.cos(angle)];
  return <g fill="none" stroke={credit ? colours.credit : colours.wire} strokeWidth="1.5" strokeDasharray={credit ? '5 4' : undefined}>
    <polyline points={points.map(point => point.join(',')).join(' ')} />
    <polyline points={[tip(-1), end, tip(1)].map(point => point.join(',')).join(' ')} />
  </g>;
}
function Value({
  x,
  y,
  value,
  role = 'computed',
  radius = 25
}) {
  return <g><circle cx={x} cy={y} r={radius} fill="none" stroke={colours[role]} /><Label x={x} y={y + 5} role={role} anchor="middle">{typeof value === 'number' ? number(value, 3) : value}</Label></g>;
}
function Operation({
  x,
  y,
  text,
  width = 78,
  height = 32
}) {
  return <g><rect x={x} y={y} width={width} height={height} rx="5" fill="none" stroke={colours.ink} /><Label x={x + width / 2} y={y + height / 2 + 5} anchor="middle">{text}</Label></g>;
}
function Cells({
  x,
  y,
  values,
  role = 'computed',
  cell = 43,
  selected
}) {
  return <g>{values.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}>
    <rect x={x + j * cell} y={y + i * cell} width={cell} height={cell} fill="rgba(220,220,220,.035)" stroke={selected?.[0] === i && selected?.[1] === j ? colours.ink : colours[role]} strokeWidth={selected?.[0] === i && selected?.[1] === j ? 2.5 : 1} />
    <Label x={x + (j + .5) * cell} y={y + (i + .5) * cell + 5} role={role} anchor="middle" size={13}>{typeof value === 'number' ? number(value, 3) : value}</Label>
  </g>))}</g>;
}
function Drawing({
  name,
  height,
  label,
  children,
  caption,
  width = 360
}) {
  return <figure className="state-flow-drawing" data-figure={`state-space-${name}`}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>{children}</svg>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
export { Drawing as StateDrawing, Label as StateLabel, Wire as StateWire, Cells as StateCells, Operation as StateOperation, Value as StateValue };
export function StateRetentionDrawing({
  previous = 1,
  input = 0,
  retention = .8,
  writeFraction = 1 - retention,
  step = 1
}) {
  const carried = retention * previous,
    written = writeFraction * input;
  return <Drawing name="retention" height={400} label={`At step ${step}, retained old memory ${number(carried)} and new write ${number(written)} add to ${number(carried + written)}.`}>
    <Label x={12} y={20}>Step {step}: downward flow into one sum</Label>
    <Label x={12} y={55} role="input">old summary</Label><Label x={226} y={55} role="input">new reading</Label>
    <Value x={69} y={93} value={previous} role="input" /><Value x={286} y={93} value={input} role="input" />
    <Wire points={[[69, 118], [69, 151]]} /><Wire points={[[286, 118], [286, 151]]} />
    <Operation x={22} y={151} width={94} text={`× ${number(retention, 3)}`} /><Operation x={239} y={151} width={94} text={`× ${number(writeFraction, 3)}`} />
    <Label x={89} y={209}>retained</Label><Label x={211} y={209}>written</Label>
    <Wire points={[[69, 183], [69, 235]]} /><Wire points={[[286, 183], [286, 235]]} />
    <Value x={69} y={260} value={carried} /><Value x={286} y={260} value={written} />
    <Wire points={[[69, 285], [69, 320], [155, 320]]} /><Wire points={[[286, 285], [286, 320], [205, 320]]} />
    <Value x={180} y={320} value="⊕" role="ink" />
    <Wire points={[[180, 345], [180, 372]]} /><Label x={180} y={395} role="computed" anchor="middle">new summary {number(carried + written)}</Label>
  </Drawing>;
}
export function StatePathsDrawing({
  read = 2,
  direct = .25
}) {
  const state = .5 * 1 + 1 * 3,
    output = read * state + direct * 3;
  return <Drawing name="four-jobs" height={659} label={`Advance half of old state one, write input three, read new state ${state} with coefficient ${read}, and add direct input ${direct * 3} to produce ${output}.`}>
    <Label x={12} y={20}>Advance / write / read / direct</Label>
    <Value x={66} y={76} value={1} role="input" /><Label x={12} y={40} role="input">old state</Label>
    <Value x={245} y={76} value={3} role="input" /><Label x={220} y={40} role="input">input</Label>
    <Wire points={[[66, 101], [66, 135]]} /><Wire points={[[245, 101], [245, 135]]} />
    <Operation x={25} y={135} text="× .5" /><Operation x={206} y={135} text="× 1" />
    <Label x={109} y={155} role="parameter">advance</Label><Label x={290} y={155} role="parameter">write</Label>
    <Wire points={[[66, 167], [66, 240], [153, 240]]} /><Wire points={[[245, 167], [245, 240], [207, 240]]} />
    <Value x={180} y={240} value="⊕" role="ink" />
    <Wire points={[[180, 265], [180, 298]]} /><Value x={180} y={323} value={state} /><Label x={12} y={328} role="computed">new state</Label>
    <Wire points={[[180, 348], [180, 385]]} /><Operation x={141} y={385} text={`× ${number(read, 2)}`} />
    <Label x={18} y={408} role="parameter">read</Label>
    <Wire points={[[270, 76], [337, 76], [337, 423], [318, 423]]} /><Operation x={267} y={437} width={70} text={`× ${number(direct, 2)}`} />
    <Wire points={[[318, 423], [302, 423], [302, 437]]} /><Label x={237} y={498} role="parameter">direct</Label>
    <Wire points={[[180, 417], [180, 519]]} /><Wire points={[[302, 469], [302, 544], [207, 544]]} />
    <Value x={180} y={544} value="⊕" role="ink" />
    <Wire points={[[180, 569], [180, 596]]} /><Value x={180} y={621} value={output} /><Label x={12} y={625} role="computed">output y</Label>
    <Wire points={[[155, 323], [101, 323], [101, 361], [15, 361]]} /><Label x={12} y={383}>carry to next step</Label>
  </Drawing>;
}
export function StateMatrixWriteDrawing({
  old = [[2, 1], [0, 0]],
  decay = .5,
  write = [0, 1],
  values = [3, -1],
  read = [1, 1]
}) {
  const retained = old.map(row => row.map(value => decay * value));
  const incoming = write.map(weight => values.map(value => weight * value));
  const state = retained.map((row, i) => row.map((value, j) => value + incoming[i][j]));
  const output = values.map((_, j) => read.reduce((sum, weight, i) => sum + weight * state[i][j], 0));
  return <Drawing name="matrix-write" height={1480} label="Two state rows by two value columns. The write column and value row enter an outer product. Retained and incoming matrices add cell by cell. Reading contracts state rows into one output for each value column.">
    <Label x={12} y={22}>State rows; value columns</Label>
    <Label x={12} y={62} role="input">old S</Label><Cells x={98} y={79} cell={80} values={old} role="input" />
    <Wire points={[[178, 239], [178, 279]]} /><Operation x={119} y={279} width={118} text={`× ${number(decay)}`} />
    <Wire points={[[178, 311], [178, 363]]} /><Cells x={98} y={363} cell={80} values={retained} />
    <Label x={12} y={349}>retained S</Label>
    <Wire points={[[258, 443], [347, 443], [347, 1024], [205, 1024]]} />
    <Label x={12} y={581} role="parameter">write b</Label><Cells x={12} y={608} cell={72} values={write.map(value => [value])} role="parameter" />
    <Label x={194} y={581} role="input">value v</Label><Cells x={194} y={608} cell={72} values={[values]} role="input" />
    <Wire points={[[84, 680], [153, 680]]} /><Wire points={[[194, 644], [178, 644], [178, 655]]} /><Value x={178} y={680} value="⊗" role="ink" />
    <Wire points={[[178, 705], [178, 801]]} /><Cells x={98} y={801} cell={80} values={incoming} />
    <Label x={12} y={784}>b[row] × v[column]</Label>
    <Wire points={[[178, 961], [178, 999]]} /><Value x={180} y={1024} value="⊕" role="ink" />
    <Wire points={[[180, 1049], [180, 1100]]} /><Cells x={100} y={1100} cell={80} values={state} />
    <Label x={12} y={1080}>new S</Label>
    <Wire points={[[180, 1260], [180, 1303]]} /><Operation x={128} y={1303} width={104} text="c × S" />
    <Label x={12} y={1260}>read c</Label><Cells x={12} y={1283} cell={48} values={[read]} role="parameter" />
    <Wire points={[[108, 1307], [128, 1307]]} />
    <Wire points={[[180, 1335], [180, 1378]]} /><Cells x={100} y={1378} cell={80} values={[output]} />
  </Drawing>;
}
export function StateVectorDrawing() {
  return <Drawing name="vector-anatomy" height={1127} label="Separate operands feed every multiplication: A-bar times old state gives half and 1.6; B-bar times input three gives three and zero. These vectors add into 3.5 and 1.6; independent read row two minus one dots that new vector into 5.4.">
    <Label x={12} y={22}>Two coordinates; operands stay separate</Label>
    <Label x={12} y={56} role="parameter">A-bar: 2 × 2</Label><Cells x={12} y={76} values={[[.5, 0], [0, .8]]} role="parameter" />
    <Label x={237} y={56} role="input">old h: 2 × 1</Label><Cells x={279} y={76} values={[[1], [2]]} role="input" />
    <Wire points={[[55, 162], [55, 218], [141, 218]]} /><Wire points={[[300, 162], [300, 218], [237, 218]]} />
    <Operation x={141} y={202} text="A-bar × h" width={96} />
    <Wire points={[[189, 234], [189, 267]]} /><Cells x={168} y={267} values={[[.5], [1.6]]} />
    <Label x={12} y={296} role="computed">carried vector</Label>
    <Wire points={[[211, 310], [347, 310], [347, 763], [207, 763]]} />
    <Label x={12} y={399} role="parameter">B-bar: 2 × 1</Label><Cells x={12} y={419} values={[[1], [0]]} role="parameter" />
    <Label x={252} y={399} role="input">input u</Label><Cells x={279} y={419} values={[[3]]} role="input" />
    <Wire points={[[34, 505], [34, 550], [141, 550]]} /><Wire points={[[300, 462], [300, 550], [237, 550]]} />
    <Operation x={141} y={534} text="B-bar × u" width={96} />
    <Wire points={[[189, 566], [189, 603]]} /><Cells x={168} y={603} values={[[3], [0]]} />
    <Label x={12} y={631} role="computed">written vector</Label>
    <Wire points={[[189, 689], [189, 718], [180, 718], [180, 738]]} /><Value x={180} y={763} value="⊕" role="ink" />
    <Wire points={[[180, 788], [180, 823]]} /><Cells x={159} y={823} values={[[3.5], [1.6]]} />
    <Label x={12} y={851} role="computed">new h</Label>
    <Label x={12} y={947} role="parameter">read C: 1 × 2</Label><Cells x={12} y={968} values={[[2, -1]]} role="parameter" />
    <Wire points={[[180, 909], [180, 984]]} /><Wire points={[[98, 989], [119, 989], [119, 1000], [141, 1000]]} />
    <Operation x={141} y={984} width={78} text="dot" />
    <Wire points={[[180, 1016], [180, 1054]]} /><Value x={180} y={1079} value={5.4} />
    <Label x={12} y={1120}>Output 7 − 1.6; reading does not change h.</Label>
  </Drawing>;
}
export function StateReachDrawing() {
  return <Drawing name="reach-read" height={362} label="Input reaches only state coordinate zero. Independent coordinate one has no write or read path. Changing that hidden coordinate does not change the output.">
    <Label x={12} y={22}>What can enter, and what can be seen?</Label>
    <Value x={54} y={83} value="u" role="input" /><Value x={204} y={83} value="h₀" /><Value x={204} y={226} value="h₁" />
    <Wire points={[[79, 83], [179, 83]]} /><Label x={90} y={63} role="parameter">write 1</Label>
    <Wire points={[[229, 83], [307, 83], [307, 272]]} /><Value x={307} y={297} value="y" />
    <Label x={237} y={118} role="parameter">read 1</Label>
    <path d="M 54,108 V 226 H 175 M 229,226 H 273" stroke="#646464" fill="none" strokeDasharray="4 5" />
    <Label x={91} y={249}>× write 0</Label><Label x={223} y={268}>× read 0</Label>
    <Label x={12} y={344}>Independent h₁ has no input/output route.</Label>
  </Drawing>;
}
export function StateHeldDrawing({
  interval = 1,
  input = 1,
  rate = -1,
  bilinear = false
}) {
  const scaleX = 240 / 3,
    scaleY = 28;
  const exact = Array.from({
    length: 61
  }, (_, i) => {
    const time = i / 20;
    const value = rate === 0 ? time * input : Math.expm1(rate * time) / rate * input;
    return [time, value];
  });
  const sampled = rate === 0 ? interval * input : Math.expm1(rate * interval) / rate * input;
  const retention = (1 + interval * rate / 2) / (1 - interval * rate / 2);
  const approximate = interval * input / (1 - interval * rate / 2);
  return <Drawing name={bilinear ? 'sampling-comparison' : 'held-input'} height={334} label="Held input stays constant while the state approaches it; the sample lies at the chosen interval. The horizontal axis is physical time, not a sequence index.">
    <Label x={12} y={21}>Input held at {number(input)}; initial state 0</Label>
    <path d="M 46,59 V 257 H 319" fill="none" stroke={colours.wire} />
    <Label x={12} y={42} role="computed">state</Label><Label x={240} y={290}>time</Label>
    {[0, 1, 2, 3].map(t => <g key={t}><line x1={46 + scaleX * t} x2={46 + scaleX * t} y1={253} y2={261} stroke={colours.wire} /><Label x={46 + scaleX * t} y={280} anchor="middle">{t}</Label></g>)}
    <polyline points={exact.map(([t, value]) => `${46 + scaleX * t},${247 - scaleY * value}`).join(' ')} fill="none" stroke={colours.computed} strokeWidth="2" />
    <path d={`M ${46 + scaleX * interval},${247 - scaleY * sampled} V 257`} stroke={colours.wire} fill="none" strokeDasharray="4 4" />
    <circle cx={46 + scaleX * interval} cy={247 - scaleY * sampled} r="5" fill={colours.computed} />
    {[0, 2, 4, 6].map(value => <Label key={value} x={36} y={251 - scaleY * value} anchor="end">{value}</Label>)}
    <Label x={295} y={252 - scaleY * exact.at(-1)[1]} role="computed">ZOH</Label>
    {bilinear && <><rect x={42 + scaleX * interval} y={243 - scaleY * approximate} width="8" height="8" fill={colours.ink} /><Label x={58} y={76}>square: bilinear sample</Label></>}
    <Label x={12} y={328}>Δ = {number(interval)}; {bilinear ? `bilinear retain ${number(retention, 3)}` : 'same held-input interval'}</Label>
  </Drawing>;
}
export function StateIntegralDrawing() {
  return <Drawing name="held-integral" height={359} label="Three equally spaced input contributions are born during one held interval. Earlier contributions decay longer before reaching the end. Summing all infinitesimal contributions gives the integrated write.">
    <Label x={12} y={22}>Earlier writes decay for longer</Label>
    <line x1="36" y1="80" x2="321" y2="80" stroke={colours.wire} />
    {[0, 1, 2].map((value, index) => <g key={value}>
      <Value x={48 + index * 97} y={80} value="B u" role="input" radius={23} />
      <Wire points={[[48 + index * 97, 103], [48 + index * 97, 172]]} />
      <Operation x={13 + index * 97} y={172} width={72} text={['eᴬΔ', 'eᴬ⁽Δ/²⁾', 'e⁰'][index]} />
      <Wire points={index === 1 ? [[145, 204], [145, 232], [180, 232], [180, 240]] : [[48 + index * 97, 204], [48 + index * 97, 265], [index === 0 ? 155 : 205, 265]]} />
    </g>)}
    <Value x={180} y={265} value="⊕" role="ink" /><Label x={12} y={328}>Read the sum at the interval endpoint.</Label>
    <Label x={12} y={352}>Pieces illustrate the exact integral.</Label>
  </Drawing>;
}
export function StateBlockExponentialDrawing() {
  return <Drawing name="block-exponential" height={358} label="The upper left rate block A and upper right write block B enter one lifted exponential. Its output's upper blocks are the discrete transition and integrated write. Bottom blocks are zero and identity.">
    <Label x={12} y={21}>One lifted matrix, both coefficients</Label>
    <Cells x={15} y={51} cell={44} role="parameter" values={[["A₀₀", "A₀₁", "B₀"], ["A₁₀", "A₁₁", "B₁"], [0, 0, 0]]} />
    <Wire points={[[81, 183], [81, 217]]} /><Operation x={27} y={217} width={108} text="exp(Δ × ·)" />
    <Wire points={[[135, 233], [181, 233], [181, 180], [210, 180]]} />
    <Cells x={210} y={137} cell={44} values={[["Ā₀₀", "Ā₀₁", "B̄₀"], ["Ā₁₀", "Ā₁₁", "B̄₁"], [0, 0, 1]]} />
    <Label x={12} y={300}>Upper left: advance. Upper right: write.</Label>
    <Label x={12} y={332}>A = 0 is allowed; no inverse of A appears.</Label>
  </Drawing>;
}
export function StateOutputRoutesDrawing() {
  return <Drawing name="output-routes" height={355} label="Initial memory advances independently; input history convolves with strictly proper taps; current input uses the direct path. All three contribute once to output.">
    <Label x={12} y={22}>Three separate contributions to y</Label>
    <Cells x={12} y={52} values={[["h₋₁"]]} role="input" /><Cells x={145} y={52} values={[["u past"]]} role="input" cell={63} /><Cells x={281} y={52} values={[["u now"]]} role="input" cell={63} />
    <Wire points={[[34, 95], [34, 135]]} /><Wire points={[[176, 115], [176, 135]]} /><Wire points={[[312, 115], [312, 135]]} />
    <Operation x={5} y={135} width={112} text="C Āᵗ⁺¹ h₋₁" /><Operation x={135} y={135} width={95} text="kernel × u" /><Operation x={279} y={135} width={68} text="D × u" />
    <Wire points={[[61, 167], [61, 241], [152, 241]]} /><Wire points={[[182, 167], [182, 216]]} /><Wire points={[[313, 167], [313, 241], [207, 241]]} />
    <Value x={180} y={241} value="⊕" role="ink" /><Wire points={[[180, 266], [180, 302]]} /><Value x={180} y={327} value="y" />
  </Drawing>;
}
export function StateImpulseDrawing({
  inputs = [2, 0, 1, 0],
  retention = .5,
  selected = 2
}) {
  const size = Math.min(inputs.length, 4),
    start = Math.max(0, Math.min(selected - 2, inputs.length - size));
  const rows = Array.from({
    length: size
  }, (_, i) => Array.from({
    length: size
  }, (_, j) => {
    const birth = start + j,
      output = start + i;
    return birth > output ? '—' : inputs[birth] * retention ** (output - birth);
  }));
  return <Drawing name="impulse-triangle" height={197 + size * 53} label="Rows are output positions and columns are input birth positions. Future inputs have no path to earlier outputs. Each column fades down the causal triangle; rows sum into outputs.">
    <Label x={12} y={22}>One input travels down its column</Label>
    <Cells x={79} y={68} values={[inputs.slice(start, start + size)]} cell={53} role="input" />
    <Label x={12} y={97}>input</Label>
    {Array.from({
      length: size
    }, (_, i) => <g key={i}><Wire points={[[105 + 53 * i, 121], [105 + 53 * i, 154]]} /><Label x={95 + 53 * i} y={145} anchor="end" size={12}>{start + i}</Label></g>)}
    <Cells x={79} y={164} values={rows} cell={53} selected={[selected - start, selected - start]} />
    {Array.from({
      length: size
    }, (_, i) => <Label key={i} x={12} y={194 + 53 * i}>out {start + i}</Label>)}
    <Label x={12} y={190 + size * 53}>— means not yet; zero is an arrived zero.</Label>
  </Drawing>;
}
export function StateOscillatorDrawing({
  damping = .2,
  frequency = 2,
  interval = .25
}) {
  const angle = frequency * interval,
    radius = Math.exp(-damping * interval);
  const next = [radius * Math.cos(angle), radius * Math.sin(angle)];
  return <Drawing name="rotating-state" height={352} label="Equal x/y scales. The old real coordinate pair (1,0) rotates counterclockwise by frequency times interval, then its radius contracts by exp(-damping times interval).">
    <Label x={12} y={22}>A two-coordinate memory turns and shrinks</Label>
    <path d="M 42,188 H 325 M 182,52 V 316" fill="none" stroke={colours.wire} />
    <circle cx="182" cy="188" r="112" fill="none" stroke="#555" strokeDasharray="4 5" />
    <Wire points={[[182, 188], [294, 188]]} /><Label x={241} y={213} role="input">old (1,0)</Label>
    <line x1="182" y1="188" x2={182 + 112 * next[0]} y2={188 - 112 * next[1]} stroke={colours.computed} strokeWidth="3" />
    <circle cx={182 + 112 * next[0]} cy={188 - 112 * next[1]} r="5" fill={colours.computed} />
    <Label x={12} y={339} role="computed">new [{next.map(value => number(value, 3)).join(', ')}]; radius {number(radius, 3)}</Label>
    <Label x={310} y={180}>x</Label><Label x={191} y={62}>y</Label>
  </Drawing>;
}
