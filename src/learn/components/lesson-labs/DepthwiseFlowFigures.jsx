// Worked-number drawings for Depthwise Separable & Dilated Convolutions. Same vocabulary as
// DepthwiseDrawings.jsx: cyan supplied values, amber learned weights, violet computed values,
// orange dashed backward sensitivities, thick white outline for the traced entry.
import './depthwise-flow.css';
import { Label, NumberCells, signed } from './DepthwiseDrawings.jsx';
import { flowNumber as f } from './LessonFlow.jsx';

export function FlowArrow({ children = 'forward computation' }) {
  return <div className="dw-arrow"><span aria-hidden="true">↓</span> {children}</div>;
}

export function ValueStrip({ values, role = 'input', selected = [], indices = false }) {
  return <div className={`dw-strip dw-${role}`}>{values.map((value, index) =>
    <span key={index} className={selected.includes(index) ? 'dw-traced' : ''}>
      {indices && <small>index {index}</small>}<b>{value}</b>
      {selected.includes(index) && <small>read</small>}
    </span>)}</div>;
}

const ArrowDefs = ({ id }) => <defs>
  <marker id={`${id}-fwd`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" className="dd-head-fwd" /></marker>
  <marker id={`${id}-back`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" className="dd-head-back" /></marker>
</defs>;
const Arrow = ({ id, d, back = false }) => <path d={d} className={back ? 'dd-back' : 'dd-wire'} markerEnd={`url(#${id}-${back ? 'back' : 'fwd'})`} />;

/* §1 Two output channels read both strips, each through its own kernel ------------------ */
const denseKernels = [{ A: [2, -2], B: [-0.5, -1] }, { A: [1, 0], B: [0, 1] }];
const strips = { A: [1, 2, 3], B: [2, 0, 1] };
const dot = (values, weights) => values[0] * weights[0] + values[1] * weights[1];

export function DenseChannelFigure() {
  return <figure className="dd-figure" data-figure="dense-channel-anatomy">
    <svg viewBox="0 0 380 214" className="dd-svg dd-svg-dense" role="img" aria-label="Two input strips, A = 1, 2, 3 and B = 2, 0, 1, with the first pair of each outlined. Output channel 0 multiplies pair A by its weights 2 and −2, giving −2, and pair B by −0.5 and −1, giving −1; the total is −3. Output channel 1 uses its own weights 1, 0 and 0, 1, giving 1 and 0; the total is 1.">
      {denseKernels.map((kernel, o) => {
        const x0 = 8 + o * 190;
        const sums = ['A', 'B'].map(name => dot(strips[name], kernel[name]));
        return <g key={o}>
          <Label x={x0} y={16} className="dd-computed-text dd-heading">output channel {o}</Label>
          {['A', 'B'].map((name, row) => {
            const y = 34 + row * 72;
            return <g key={name}>
              <Label x={x0} y={y + 21} className="dd-input-text">{name}</Label>
              <NumberCells x={x0 + 16} y={y} values={strips[name]} cell={34} role="input" traced={[0, 1]} under={kernel[name]} />
              <Label x={x0 + 124} y={y + 21} className="dd-computed-text">= {f(sums[row])}</Label>
            </g>;
          })}
          <Label x={x0} y={196} className="dd-computed-text">Σ: {f(sums[0])} + {signed(sums[1])} = {f(sums[0] + sums[1])}</Label>
        </g>;
      })}
      <Label x={8} y={212} className="dd-note">amber “× w” under a cell: that output channel’s own weight for it</Label>
    </svg>
  </figure>;
}

/* §1 The backward route through one depthwise + pointwise output ------------------------- */
export function GradientRouteFigure() {
  const id = 'dw-grad';
  const lanes = [
    { x: 120, patch: [1, 2], name: 'A', filter: '[1, −1]', grad: '[−8, −16]', z: -1, dz: -8, p: 2, dp: 4 },
    { x: 300, patch: [2, 0], name: 'B', filter: '[0.5, 1]', grad: '[8, 0]', z: 1, dz: 4, p: -1, dp: -4 },
  ];
  return <figure className="dd-figure" data-figure="separable-gradient-route">
    <svg viewBox="0 0 420 352" className="dd-svg dd-svg-gradient" role="img" aria-label="Computation circuit drawn top to bottom. Patch A, 1 and 2, passes through D_A = 1, −1 to z_A = −1; patch B, 2 and 0, through D_B = 0.5, 1 to z_B = 1. Pointwise weights P_A = 2 and P_B = −1 feed a sum, y = −3, and the loss L = one half of y minus 1 squared = 8. Orange dashed arrows run backward: ∂L/∂y = −4; ∂L/∂z_A = −8 and ∂L/∂z_B = 4; ∂L/∂P_A = 4 and ∂L/∂P_B = −4; ∂L/∂D_A = −8, −16 and ∂L/∂D_B = 8, 0.">
      <ArrowDefs id={id} />
      {lanes.map(lane => {
        const left = lane.x < 210;
        return <g key={lane.name}>
          <Label x={lane.x} y={14} anchor="middle" className="dd-input-text">patch {lane.name}</Label>
          <NumberCells x={lane.x - 26} y={20} values={lane.patch} cell={26} role="input" />
          <Arrow id={id} d={`M ${lane.x} 48 V 64`} />
          <rect x={lane.x - 58} y={66} width={116} height={40} rx={6} className="dd-param-box" />
          <Label x={lane.x} y={82} anchor="middle" className="dd-param-text">D_{lane.name} = {lane.filter}</Label>
          <Label x={lane.x} y={98} anchor="middle" className="dd-grad-text">∂L/∂D_{lane.name} = {lane.grad}</Label>
          <Arrow id={id} d={`M ${lane.x} 106 V 126`} />
          <Arrow id={id} back d={`M ${lane.x - 14} 128 V 110`} />
          <circle cx={lane.x} cy={144} r={16} className="dd-node dd-node-computed" />
          <text x={lane.x} y={148} textAnchor="middle" className="dd-cell-text">{f(lane.z)}</text>
          <Label x={left ? lane.x + 22 : lane.x - 22} y={140} anchor={left ? 'start' : 'end'} className="dd-computed-text">z_{lane.name}</Label>
          <Label x={left ? lane.x - 22 : lane.x + 22} y={148} anchor={left ? 'end' : 'start'} className="dd-grad-text">∂L/∂z_{lane.name} = {f(lane.dz)}</Label>
          <line x1={lane.x + (left ? 10 : -10)} y1={157} x2={left ? 198 : 222} y2={206} className="dd-weight-wire" />
          <Arrow id={id} back d={`M ${left ? 192 : 228} 216 L ${lane.x + (left ? 2 : -2)} 166`} />
          <Label x={left ? 150 : 270} y={204} anchor={left ? 'end' : 'start'} className="dd-param-text">P_{lane.name} = {f(lane.p)}</Label>
          <Label x={left ? 150 : 270} y={218} anchor={left ? 'end' : 'start'} className="dd-grad-text">∂L/∂P_{lane.name} = {f(lane.dp)}</Label>
        </g>;
      })}
      <circle cx={210} cy={214} r={14} className="dd-op" /><text x={210} y={219} textAnchor="middle" className="dd-op-text">Σ</text>
      <Arrow id={id} d="M 210 228 V 246" />
      <circle cx={210} cy={264} r={16} className="dd-node dd-node-computed" />
      <text x={210} y={268} textAnchor="middle" className="dd-cell-text">−3</text>
      <Label x={232} y={268} className="dd-computed-text">y</Label>
      <Arrow id={id} d="M 210 280 V 298" />
      <Arrow id={id} back d="M 194 300 V 282" />
      <Label x={186} y={294} anchor="end" className="dd-grad-text">∂L/∂y = y − 1 = −4</Label>
      <rect x={140} y={300} width={140} height={32} rx={6} className="dd-op" />
      <Label x={210} y={320} anchor="middle" className="dd-op-text-small">L = ½(y − 1)² = 8</Label>
      <Label x={8} y={348} className="dd-note">grey arrows: forward; orange dashed: backward sensitivities</Label>
    </svg>
  </figure>;
}

/* §3 Shifted copies of the reachable set on one number line ------------------------------ */
export function DilationIntervalFigure() {
  const px = value => 30 + (value + 5) * 30;
  return <figure className="dd-figure" data-figure="dilation-interval-join">
    <svg viewBox="0 0 360 220" className="dd-svg dd-svg-interval" role="img" aria-label="Two number lines from minus 5 to 5. Each shows three copies of the reachable set minus 1, 0, 1, shifted by minus d, 0 and plus d. With d = 3 the copies cover every integer from minus 4 to 4 with no gap. With d = 4 they cover minus 5 to 5 but miss minus 2 and 2, marked with crosses.">
      {[3, 4].map((d, block) => {
        const y0 = 6 + block * 108;
        const reached = new Set([-d, 0, d].flatMap(shift => [-1, 0, 1].map(v => v + shift)));
        const missing = Array.from({ length: 2 * d + 1 }, (_, i) => i - d).filter(v => !reached.has(v));
        return <g key={d}>
          <Label x={10} y={y0 + 12} className="dd-heading">new dilation d = {d}: shift −1, 0, 1 by −{d}, 0, +{d}</Label>
          {[-d, 0, d].map((shift, row) => {
            const y = y0 + 28 + row * 14;
            return <g key={shift}>
              <line x1={px(shift - 1)} y1={y} x2={px(shift + 1)} y2={y} className="dd-copy" />
              {[-1, 0, 1].map(v => <circle key={v} cx={px(shift + v)} cy={y} r={4} className="dd-copy-dot" />)}
            </g>;
          })}
          <line x1={px(-5)} y1={y0 + 74} x2={px(5)} y2={y0 + 74} className="dd-axis" />
          {Array.from({ length: 11 }, (_, i) => i - 5).map(v => <g key={v}>
            <line x1={px(v)} y1={y0 + 70} x2={px(v)} y2={y0 + 78} className="dd-axis" />
            <text x={px(v)} y={y0 + 91} textAnchor="middle" className={reached.has(v) ? 'dd-computed-text' : 'dd-note'}>{f(v)}</text>
          </g>)}
          {missing.map(v => <path key={v} d={`M ${px(v) - 5} ${y0 + 69} l 10 10 m 0 -10 l -10 10`} className="dd-cross" />)}
          <Label x={350} y={y0 + 104} anchor="end" className={missing.length ? 'dd-note' : 'dd-computed-text'}>{missing.length ? `missing ${missing.map(v => f(v)).join(' and ')}` : 'no gaps'}</Label>
        </g>;
      })}
    </svg>
  </figure>;
}

/* §3 Receptive field and jump in original-input units ------------------------------------ */
export function ReceptiveJumpFigure() {
  const px = value => 26 + (value + 9) * 17.5;
  return <figure className="dd-figure" data-figure="receptive-field-jump">
    <svg viewBox="0 0 380 212" className="dd-svg dd-svg-receptive" role="img" aria-label="An axis of original-input offsets from minus 9 to 9. Three violet bands, each seven positions wide, are centred at minus 6, 0 and 6: the incoming features read by one output's three taps. Neighbouring tap centres are 6 apart, dilation 3 times incoming jump 2. Together the bands run from minus 9 to 9, width 19. Below, the next output's centre is 4 positions to the right, stride 2 times incoming jump 2.">
      <line x1={px(-9) - 8} y1={20} x2={px(-9) - 8} y2={104} className="dd-span" />
      <line x1={px(9) + 8} y1={20} x2={px(9) + 8} y2={104} className="dd-span" />
      <Label x={190} y={14} anchor="middle" className="dd-computed-text">combined field −9 … 9: width 19</Label>
      {[-6, 0, 6].map((centre, row) => <g key={centre}>
        <rect x={px(centre - 3) - 8} y={30 + row * 22} width={7 * 17.5} height={14} className="dd-band" />
        <circle cx={px(centre)} cy={37 + row * 22} r={4} className="dd-tap-dot" />
      </g>)}
      <line x1={px(-9) - 8} y1={104} x2={px(9) + 8} y2={104} className="dd-axis" />
      {Array.from({ length: 19 }, (_, i) => i - 9).map(v => <line key={v} x1={px(v)} y1={101} x2={px(v)} y2={107} className="dd-axis" />)}
      {[-9, -6, -3, 0, 3, 6, 9].map(v => <text key={v} x={px(v)} y={120} textAnchor="middle" className="dd-label">{f(v)}</text>)}
      <path d={`M ${px(-6)} 127 v 5 H ${px(0)} v -5`} className="dd-dimension" />
      <Label x={(px(-6) + px(0)) / 2} y={146} anchor="middle" className="dd-param-text">tap spacing 6 = dilation 3 × jump 2</Label>
      <circle cx={px(0)} cy={164} r={5} className="dd-node dd-node-computed" />
      <circle cx={px(4)} cy={164} r={5} className="dd-node dd-node-computed" />
      <path d={`M ${px(0)} 172 v 4 H ${px(4)} v -4`} className="dd-dimension" />
      <Label x={190} y={190} anchor="middle" className="dd-computed-text">next output centre: +4 = stride 2 × jump 2</Label>
      <Label x={8} y={208} className="dd-note">bands: incoming features (7 wide each); dots: tap centres</Label>
    </svg>
  </figure>;
}

/* §5 Expansion keeps the sign that a narrow ReLU would erase ----------------------------- */
function ValueNode({ x, y, value, role }) {
  return <g><circle cx={x} cy={y} r={14} className={`dd-node dd-node-${role}`} /><text x={x} y={y + 4} textAnchor="middle" className="dd-cell-text">{f(value)}</text></g>;
}

export function ExpansionSignFigure() {
  return <figure className="dd-figure" data-figure="linear-bottleneck-sign">
    <svg viewBox="0 0 380 256" className="dd-svg dd-svg-sign" role="img" aria-label="Two copies of a small network, for x = −2 and x = 2. The input x is expanded by learned weights 1 and −1 into two channels, x and −x. ReLU keeps each channel's positive part. A linear projection with weights 1 and −1 recovers x exactly: −2 and 2. A ReLU applied directly to the narrow x would give 0 for −2.">
      {[-2, 2].map((x, panel) => {
        const cx = 95 + panel * 190;
        const channels = [x, -x], kept = channels.map(v => Math.max(0, v));
        return <g key={x}>
          <ValueNode x={cx} y={22} value={x} role="input" /><Label x={cx - 20} y={26} anchor="end" className="dd-input-text">x</Label>
          {[-1, 1].map((side, c) => <g key={side}>
            <line x1={cx + side * 8} y1={34} x2={cx + side * 36} y2={72} className="dd-weight-wire" />
            <Label x={cx + side * 28} y={52} anchor={side < 0 ? 'end' : 'start'} className="dd-param-text">× {signed(c ? -1 : 1)}</Label>
            <ValueNode x={cx + side * 40} y={84} value={channels[c]} role="computed" />
            <rect x={cx + side * 40 - 20} y={106} width={40} height={20} rx={5} className="dd-op" />
            <Label x={cx + side * 40} y={120} anchor="middle" className="dd-op-text-small">ReLU</Label>
            <ValueNode x={cx + side * 40} y={148} value={kept[c]} role="computed" />
            <line x1={cx + side * 36} y1={160} x2={cx + side * 8} y2={196} className="dd-weight-wire" />
            <Label x={cx + side * 28} y={182} anchor={side < 0 ? 'end' : 'start'} className="dd-param-text">× {signed(c ? -1 : 1)}</Label>
          </g>)}
          <ValueNode x={cx} y={208} value={kept[0] - kept[1]} role="computed" />
          <Label x={cx} y={238} anchor="middle" className="dd-computed-text">recovered: {f(x)}</Label>
          <Label x={cx} y={252} anchor="middle" className="dd-note">ReLU on narrow x: {f(Math.max(0, x))}</Label>
        </g>;
      })}
    </svg>
  </figure>;
}

/* §5 The hard-swish curve against ReLU ------------------------------------------------- */
export function HardSwishFigure() {
  const value = x => x * Math.min(6, Math.max(0, x + 3)) / 6;
  const px = x => 40 + (x + 4) * 30, py = y => 150 - y * 30;
  const curve = fn => Array.from({ length: 81 }, (_, index) => { const x = -4 + index / 10; return `${px(x)},${py(fn(x))}`; }).join(' ');
  return <figure data-figure="hard-swish-curve">
    <svg className="dw-plot" viewBox="0 0 300 200" role="img" aria-label="Hard-swish and ReLU plotted from input minus 4 to 4. ReLU, dashed grey, is 0 for negative inputs and equals the input for positive ones. Hard-swish, violet, is 0 up to minus 3, dips below zero to a minimum of minus 0.375 at minus 1.5, crosses 0 at 0, rises below ReLU, and joins it from 3 onward.">
      <path d={`M ${px(-4)} ${py(0)} H ${px(4)} M ${px(0)} ${py(4)} V ${py(-0.6)}`} fill="none" stroke="#777" />
      {[-1, 1, 2, 3, 4].map(y => <g key={y}><line x1={px(0) - 3} x2={px(0) + 3} y1={py(y)} y2={py(y)} stroke="#777" /><text x={px(0) - 6} y={py(y) + 4} textAnchor="end">{f(y)}</text></g>)}
      <polyline points={curve(x => Math.max(0, x))} fill="none" stroke="#a8a8a8" strokeWidth="2" strokeDasharray="5 4" />
      <polyline points={curve(value)} fill="none" stroke="#be9cf5" strokeWidth="3" />
      {[-3, -2, 3].map(x => <circle key={x} cx={px(x)} cy={py(value(x))} r="4" fill="#be9cf5" />)}
      {[-4, -3, -2, -1, 1, 2, 3, 4].map(x => <text key={x} x={px(x)} y={py(0) + 18} textAnchor="middle">{f(x)}</text>)}
      <text x={px(4)} y={py(0) - 6} textAnchor="end">input x</text>
      <text x={px(1.6)} y={py(2) + 4} textAnchor="end" fill="#a8a8a8">ReLU</text>
      <text x={px(-3.9)} y={py(-1.1)} fill="#be9cf5">hard-swish</text>
    </svg><p>Violet: hard-swish; dashed grey: ReLU. Marked points: h(−3) = 0, h(−2) = −1/3, h(3) = 3. Below −3 both curves are 0; from 3 on they coincide.</p>
  </figure>;
}

/* §6 The small digit model, with the one replaced layer outlined ------------------------- */
export function DigitPipelineFigure() {
  const centre = 150;
  const slab = (y, channels, side, role, label) => {
    const width = Math.max(8, channels * 6), height = side * 5;
    return <g>
      <rect x={centre - width / 2} y={y} width={width} height={height} className={`dd-slab dd-slab-${role}`} />
      <Label x={centre + width / 2 + 8} y={y + height / 2 + 4} className={`dd-${role}-text`}>{label}</Label>
    </g>;
  };
  const step = (y, text, weights) => <g>
    <Label x={centre} y={y} anchor="middle">↓ {text}</Label>
    {weights && <Label x={centre} y={y + 13} anchor="middle" className="dd-param-text">{weights}</Label>}
  </g>;
  return <figure className="dd-figure" data-figure="compressed-digit-pipeline">
    <svg viewBox="0 0 300 404" className="dd-svg dd-svg-pipeline" role="img" aria-label="The digit model drawn top to bottom, slab width proportional to channels and height to grid size. A 1 by 8 by 8 image; a learned 3 by 3 stem with ReLU makes 8 by 8 by 8; the replaced layer, outlined in white, makes 12 by 8 by 8 either as a dense 3 by 3 layer or as depthwise then pointwise, followed by the original ReLU; 2 by 2 average pooling gives 12 by 4 by 4; flattening to 192 values and an unchanged linear head give 10 logits.">
      {slab(8, 1, 8, 'input', 'image 1 × 8 × 8')}
      {step(66, '3×3 stem, 1 → 8, then ReLU', 'learned: 80 parameters')}
      {slab(90, 8, 8, 'computed', '8 × 8 × 8')}
      <defs><marker id="dw-pipe-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z" className="dd-head-fwd" /></marker></defs>
      <path d={`M ${centre} 131 V 140`} className="dd-wire" markerEnd="url(#dw-pipe-head)" />
      <path d={`M ${centre} 199 V 204`} className="dd-wire" markerEnd="url(#dw-pipe-head)" />
      <rect x={20} y={142} width={260} height={56} rx={6} className="dd-op dd-replaced" />
      <Label x={centre} y={160} anchor="middle" className="dd-heading">replaced layer: 3×3, 8 → 12, then ReLU</Label>
      <Label x={centre} y={176} anchor="middle" className="dd-param-text">dense: 876 parameters, or</Label>
      <Label x={centre} y={190} anchor="middle" className="dd-param-text">depthwise 8 → 8m, then 1×1 8m → 12</Label>
      {slab(206, 12, 8, 'computed', '12 × 8 × 8')}
      {step(264, 'average each 2×2 block')}
      {slab(276, 12, 4, 'computed', '12 × 4 × 4')}
      {step(314, 'flatten to 192, unchanged linear head', 'learned: 1,930 parameters')}
      {Array.from({ length: 10 }, (_, digit) => <g key={digit}>
        <rect x={70 + digit * 16} y={344} width={16} height={22} className="dd-cell dd-computed" />
        <text x={78 + digit * 16} y={359} textAnchor="middle" className="dd-label">{digit}</text>
      </g>)}
      <Label x={centre} y={386} anchor="middle" className="dd-computed-text">10 logits, one score per digit 0–9</Label>
    </svg>
  </figure>;
}
