// Structure drawings for Depthwise Separable & Dilated Convolutions. They follow the module
// vocabulary (docs/teaching/deep-learning-beginner/visual-vocabulary.md): cyan supplied inputs,
// amber learned weights, violet computed values, neutral white-outlined operations, thick white
// outline for the traced element. Every quantity a drawing states is repeated in HTML or prose.
import { samplingSupport } from '../../data/depthwise-convolution-models.js';
import { flowNumber as f } from './LessonFlow.jsx';
import './depthwise-drawings.css';

export const signed = value => (value < 0 ? `(${f(value)})` : f(value));

export function Grid({ x, y, rows, cols, cell, role, traced = [] }) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    cells.push(<rect key={`${r}-${c}`} x={x + c * cell} y={y + r * cell} width={cell} height={cell} className={`dd-cell dd-${role}`} />);
  }
  traced.forEach(([r, c, h = 1, w = 1], index) => cells.push(<rect key={`t${index}`} x={x + c * cell} y={y + r * cell} width={w * cell} height={h * cell} className="dd-traced" />));
  return <g>{cells}</g>;
}

export const Label = ({ x, y, children, anchor = 'start', className = '' }) =>
  <text x={x} y={y} textAnchor={anchor} className={`dd-label ${className}`}>{children}</text>;

// A row of numbered cells; `traced` outlines a run of cells, `under` writes "× w" below cells.
export function NumberCells({ x, y, values, cell = 30, role, traced = [], under = [] }) {
  return <g>
    {values.map((value, i) => <g key={i}>
      <rect x={x + i * cell} y={y} width={cell} height={cell} className={`dd-cell dd-${role}`} />
      <text x={x + i * cell + cell / 2} y={y + cell / 2 + 4} textAnchor="middle" className="dd-cell-text">{f(value)}</text>
      {under[i] !== undefined && <text x={x + i * cell + cell / 2} y={y + cell + 14} textAnchor="middle" className="dd-label dd-param-text dd-under">×{f(under[i])}</text>}
    </g>)}
    {traced.length > 0 && <rect x={x + traced[0] * cell} y={y} width={traced.length * cell} height={cell} className="dd-traced" />}
  </g>;
}

/* §1 Standard convolution versus depthwise + pointwise on real C × H × W tensors -------- */
function TensorInputs() {
  return <>
    <Grid x={12} y={30} rows={5} cols={5} cell={16} role="input" traced={[[0, 0, 3, 3]]} />
    <Label x={12} y={124}>channel A · 5 × 5</Label>
    <Grid x={12} y={140} rows={5} cols={5} cell={16} role="input" traced={[[0, 0, 3, 3]]} />
    <Label x={12} y={234}>channel B · 5 × 5</Label>
  </>;
}

function OutputMap({ x, y, sigma, label }) {
  return <g>
    <circle cx={sigma[0]} cy={sigma[1]} r={13} className="dd-op" /><text x={sigma[0]} y={sigma[1] + 5} textAnchor="middle" className="dd-op-text">Σ</text>
    <line x1={sigma[0] + 13} y1={sigma[1]} x2={x} y2={y + 8} className="dd-wire" />
    <Grid x={x} y={y} rows={3} cols={3} cell={14} role="computed" traced={[[0, 0]]} />
    <Label x={x + 21} y={y + 56} anchor="middle" className="dd-computed-text">{label}</Label>
  </g>;
}

export function TensorAnatomyFigure({ kind }) {
  if (kind === 'standard') {
    // Each output channel owns one 3×3 slice per input channel: 2 outputs × 2 inputs = 4 slices.
    const slices = [[0, 'A', 20], [0, 'B', 62], [1, 'A', 140], [1, 'B', 182]];
    return <figure className="dd-figure" data-figure="standard-tensor-anatomy">
      <svg viewBox="0 0 400 250" className="dd-svg dd-svg-tensor" role="img" aria-label="Standard convolution with two input channels and two output channels. Each input channel's 3 by 3 window is wired to both output kernels. Output channel 0 owns two 3 by 3 slices, one for A and one for B, summed into its output map; output channel 1 owns two different slices. Four slices in all.">
        <TensorInputs />
        {slices.map(([o, name, y]) => <g key={`${o}${name}`}>
          <line x1={92} y1={name === 'A' ? 54 : 164} x2={136} y2={y + 16} className="dd-wire" />
          <Grid x={136} y={y} rows={3} cols={3} cell={11} role="param" />
          <Label x={174} y={y + 21} className="dd-param-text">{name}</Label>
          <line x1={186} y1={y + 16} x2={228} y2={o ? 177 : 57} className="dd-wire" />
        </g>)}
        <Label x={136} y={14} className="dd-param-text">kernel 0: a slice per channel</Label>
        <Label x={136} y={134} className="dd-param-text">kernel 1: two new slices</Label>
        <OutputMap x={290} y={40} sigma={[240, 57]} label="output 0" />
        <OutputMap x={290} y={160} sigma={[240, 177]} label="output 1" />
        <Label x={398} y={246} anchor="end" className="dd-note">4 slices = 2 inputs × 2 outputs</Label>
      </svg>
    </figure>;
  }
  return <figure className="dd-figure" data-figure="separable-tensor-anatomy">
    <svg viewBox="0 0 420 262" className="dd-svg dd-svg-tensor-wide" role="img" aria-label="Depthwise then pointwise with two input and two output channels. Each input channel's window is filtered only by its own 3 by 3 filter, D_A or D_B, making filtered maps z_A and z_B. A 1 by 1 pointwise step then reads one position in both filtered maps and mixes them twice, with two different pairs of amber weights, into output channels 0 and 1. The two spatial filters are shared by both outputs; only the mixing weights differ.">
      <Label x={12} y={14} className="dd-heading">depthwise: each channel alone</Label>
      <Label x={244} y={14} className="dd-heading">pointwise 1×1: mix</Label>
      <line x1={234} y1={22} x2={234} y2={240} className="dd-divider" />
      <TensorInputs />
      <line x1={60} y1={54} x2={100} y2={54} className="dd-wire" /><line x1={60} y1={164} x2={100} y2={164} className="dd-wire" />
      <Grid x={100} y={36} rows={3} cols={3} cell={12} role="param" /><Label x={100} y={86} className="dd-param-text">D_A</Label>
      <Grid x={100} y={146} rows={3} cols={3} cell={12} role="param" /><Label x={100} y={196} className="dd-param-text">D_B</Label>
      <line x1={136} y1={54} x2={170} y2={38} className="dd-wire" /><line x1={136} y1={164} x2={170} y2={148} className="dd-wire" />
      <Grid x={170} y={30} rows={3} cols={3} cell={16} role="computed" traced={[[0, 0]]} /><Label x={170} y={92} className="dd-computed-text">z_A</Label>
      <Grid x={170} y={140} rows={3} cols={3} cell={16} role="computed" traced={[[0, 0]]} /><Label x={170} y={202} className="dd-computed-text">z_B</Label>
      {[[38, 57], [38, 177], [148, 57], [148, 177]].map(([from, to]) => <line key={`${from}${to}`} x1={186} y1={from} x2={292} y2={to} className="dd-weight-wire" />)}
      <Label x={274} y={44} className="dd-param-text">P₀</Label>
      <Label x={274} y={202} className="dd-param-text">P₁</Label>
      <OutputMap x={350} y={40} sigma={[305, 57]} label="output 0" />
      <OutputMap x={350} y={160} sigma={[305, 177]} label="output 1" />
      <Label x={12} y={256} className="dd-note">2 shared spatial filters; each output adds only its own 2 mixing weights</Label>
    </svg>
  </figure>;
}

/* §2 Groups between dense and depthwise, and channel shuffle ---------------------------- */
const wireX = [15, 45, 75, 105];
const connected = (groups, i, o) => Math.floor(i / (4 / groups)) === Math.floor(o / (4 / groups));

export function GroupWiringFigure() {
  const panels = [[1, 'groups 1 (dense)', 16], [2, 'groups 2', 8], [4, 'groups 4 (depthwise)', 4]];
  return <figure className="dd-figure" data-figure="group-wiring">
    <svg viewBox="0 0 396 160" className="dd-svg dd-svg-groups" role="img" aria-label="Input channels i0 to i3 on top and output channels o0 to o3 below, wired three ways, with each group in a dashed box. Groups 1: one group, every input connects to every output, 16 kernel slices. Groups 2: inputs i0 and i1 connect only to o0 and o1, inputs i2 and i3 only to o2 and o3, 8 slices. Groups 4, which is depthwise: each input connects only to its own output, 4 slices.">
      {panels.map(([groups, title, slices], p) => {
        const size = 4 / groups;
        return <g key={groups} transform={`translate(${p * 132 + 4} 0)`}>
          {Array.from({ length: groups }, (_, g) => <rect key={g} x={wireX[g * size] - 13} y={8} width={(size - 1) * 30 + 26} height={112} className="dd-group-box" />)}
          {wireX.flatMap((xi, i) => wireX.map((xo, o) => connected(groups, i, o) && <line key={`${i}${o}`} x1={xi} y1={30} x2={xo} y2={98} className="dd-weight-wire" />))}
          {wireX.map((x, i) => <g key={`i${i}`}><circle cx={x} cy={24} r={9} className="dd-node dd-node-input" /><text x={x} y={27} textAnchor="middle" className="dd-node-text">i{i}</text></g>)}
          {wireX.map((x, o) => <g key={`o${o}`}><circle cx={x} cy={104} r={9} className="dd-node dd-node-computed" /><text x={x} y={107} textAnchor="middle" className="dd-node-text">o{o}</text></g>)}
          <Label x={60} y={138} anchor="middle">{title}</Label>
          <Label x={60} y={152} anchor="middle" className="dd-param-text">{slices} kernel slices</Label>
        </g>;
      })}
    </svg>
  </figure>;
}

const shufflePermutation = [0, 2, 1, 3]; // reshape (2 groups, 2 channels), transpose, flatten
function ShufflePanel({ shuffle, offset }) {
  const x = wireX.map(value => value + offset + 10);
  const rows = [30, 86, 130, 186];
  const reach1 = new Set([0, 1, 2, 3].filter(o => connected(2, 0, o)));
  const after = shuffle ? shufflePermutation : [0, 1, 2, 3];
  const reach2 = new Set([0, 1, 2, 3].filter(position => reach1.has(after[position])));
  const reach3 = new Set([0, 1, 2, 3].filter(o => [...reach2].some(i => connected(2, i, o))));
  const lines = [];
  for (let i = 0; i < 4; i++) for (let o = 0; o < 4; o++) {
    if (!connected(2, i, o)) continue;
    lines.push(<line key={`a${i}${o}`} x1={x[i]} y1={rows[0] + 9} x2={x[o]} y2={rows[1] - 9} className={i === 0 ? 'dd-reach-wire' : 'dd-weight-wire dd-faint'} />);
    lines.push(<line key={`b${i}${o}`} x1={x[i]} y1={rows[2] + 9} x2={x[o]} y2={rows[3] - 9} className={reach2.has(i) ? 'dd-reach-wire' : 'dd-weight-wire dd-faint'} />);
  }
  for (let position = 0; position < 4; position++) {
    lines.push(<line key={`s${position}`} x1={x[after[position]]} y1={rows[1] + 9} x2={x[position]} y2={rows[2] - 9} className={reach1.has(after[position]) ? 'dd-reach-wire' : 'dd-wire dd-faint'} />);
  }
  const node = (row, index, label, reached, role) => <g key={`${row}${index}`}>
    <circle cx={x[index]} cy={rows[row]} r={9} className={`dd-node dd-node-${role}${reached ? ' dd-node-reached' : ''}`} />
    <text x={x[index]} y={rows[row] + 3} textAnchor="middle" className="dd-node-text">{label}</text>
  </g>;
  const boxes = [0, 2].flatMap(row => [0, 1].map(g => <rect key={`${row}${g}`} x={x[g * 2] - 13} y={rows[row] - 14} width={56} height={rows[row + 1] - rows[row] + 28} className="dd-group-box" />));
  return <g>
    <Label x={offset + 55} y={12} anchor="middle" className="dd-heading">{shuffle ? 'shuffle between layers' : 'no shuffle'}</Label>
    {boxes}{lines}
    {[0, 1, 2, 3].map(i => node(0, i, i, i === 0, 'input'))}
    {[0, 1, 2, 3].map(i => node(1, i, i, reach1.has(i), 'computed'))}
    {[0, 1, 2, 3].map(i => node(2, i, after[i], reach2.has(i), 'computed'))}
    {[0, 1, 2, 3].map(i => node(3, i, i, reach3.has(i), 'computed'))}
    <Label x={offset + 55} y={216} anchor="middle">channel 0 reaches {reach3.size} of 4</Label>
  </g>;
}

export function ChannelShuffleFigure() {
  return <figure className="dd-figure" data-figure="channel-shuffle">
    <svg viewBox="0 0 346 226" className="dd-svg dd-svg-shuffle" role="img" aria-label="Two grouped layers with 2 groups each on channels 0 to 3; dashed boxes mark the groups. Without shuffle, channel 0's paths, drawn white, stay inside the first group and reach outputs 0 and 1 only. With a shuffle that reorders the channels to 0, 2, 1, 3 between the layers, channel 1 moves into the second group, so channel 0's paths reach all 4 outputs.">
      <ShufflePanel shuffle={false} offset={66} />
      <ShufflePanel shuffle offset={206} />
      <Label x={4} y={62} className="dd-row-label">layer 1</Label>
      <Label x={4} y={112} className="dd-row-label">reorder</Label>
      <Label x={4} y={162} className="dd-row-label">layer 2</Label>
    </svg>
  </figure>;
}

/* §3 A dilated 3 × 3 kernel on an image grid ------------------------------------------- */
export function DilatedKernelsFigure() {
  const cell = 12;
  return <figure className="dd-figure" data-figure="dilated-kernels-2d">
    <svg viewBox="0 0 366 158" className="dd-svg dd-svg-dilated" role="img" aria-label="Three 9 by 9 input grids. Each shows the nine taps of one 3 by 3 kernel around the centre cell. Dilation 1: the taps touch, spanning 3 by 3. Dilation 2: one cell between taps, spanning 5 by 5. Dilation 4: three cells between taps, spanning the whole 9 by 9. Each kernel still has 9 weights.">
      {[1, 2, 4].map((d, p) => {
        const x0 = 9 + p * 120, y0 = 9;
        const taps = [-1, 0, 1].flatMap(a => [-1, 0, 1].map(b => [4 + a * d, 4 + b * d]));
        return <g key={d}>
          <Grid x={x0} y={y0} rows={9} cols={9} cell={cell} role="input" />
          {taps.map(([r, c]) => <rect key={`${r}-${c}`} x={x0 + c * cell + 1.5} y={y0 + r * cell + 1.5} width={cell - 3} height={cell - 3} className="dd-tap" />)}
          <rect x={x0 + (4 - d) * cell - 3} y={y0 + (4 - d) * cell - 3} width={(2 * d + 1) * cell + 6} height={(2 * d + 1) * cell + 6} className="dd-span" />
          <rect x={x0 + 4 * cell} y={y0 + 4 * cell} width={cell} height={cell} className="dd-traced" />
          <Label x={x0 + 54} y={134} anchor="middle">dilation {d}</Label>
          <Label x={x0 + 54} y={149} anchor="middle" className="dd-param-text">span {2 * d + 1} × {2 * d + 1} · 9 weights</Label>
        </g>;
      })}
    </svg>
  </figure>;
}

/* §3 Gridding: reachable 2D sites after three serial layers ---------------------------- */
export function GriddingFigure() {
  const cell = 9;
  const panels = [[2, 2, 2], [1, 2, 4]];
  return <figure className="dd-figure" data-figure="gridding-2d">
    <svg viewBox="0 0 306 178" className="dd-svg dd-svg-gridding" role="img" aria-label="Two 15 by 15 grids of offsets around one output, minus 7 to 7 in each direction. Rates 2, 2, 2: only sites whose row and column offsets are both even are reached, 49 of the 169 sites inside the dashed bounding box, leaving a regular grid of holes. Rates 1, 2, 4: all 225 sites are reached.">
      {panels.map((rates, p) => {
        const support = samplingSupport(rates);
        const sites = new Set(support.sites);
        const x0 = 6 + p * 159, y0 = 6;
        const half = (support.width - 1) / 2;
        const cells = [];
        for (let r = -7; r <= 7; r++) for (let c = -7; c <= 7; c++) {
          const reached = sites.has(r) && sites.has(c);
          cells.push(<rect key={`${r}${c}`} x={x0 + (c + 7) * cell + 1} y={y0 + (r + 7) * cell + 1} width={cell - 2} height={cell - 2} className={reached ? 'dd-reached' : 'dd-hole'} />);
        }
        return <g key={p}>
          {cells}
          <rect x={x0 + (7 - half) * cell} y={y0 + (7 - half) * cell} width={support.width * cell} height={support.width * cell} className="dd-span" />
          <rect x={x0 + 7 * cell} y={y0 + 7 * cell} width={cell} height={cell} className="dd-traced" />
          <Label x={x0 + 67} y={157} anchor="middle">rates {rates.join(', ')}</Label>
          <Label x={x0 + 67} y={172} anchor="middle" className="dd-computed-text">{sites.size ** 2} of {support.width ** 2} sites in the box</Label>
        </g>;
      })}
    </svg>
  </figure>;
}

/* §5 Bottleneck versus inverted residual, drawn to scale -------------------------------- */
const channelWidth = channels => channels * 0.47;
function BlockColumn({ id, center, title, tensors, ops, skip, note }) {
  const tops = [30, 130, 230, 352];
  return <g>
    <Label x={center} y={16} anchor="middle" className="dd-heading">{title}</Label>
    {tensors.map(([channels, side, height], index) => {
      const width = channelWidth(channels);
      return <g key={index}>
        <rect x={center - width / 2} y={tops[index]} width={width} height={height} className={`dd-slab ${index === 0 ? 'dd-slab-input' : 'dd-slab-computed'}`} />
        <Label x={center} y={tops[index] + height + 13} anchor="middle" className={index === 0 ? 'dd-input-text' : 'dd-computed-text'}>{channels} × {side} × {side}</Label>
      </g>;
    })}
    {ops.map(([name, weights], index) => <g key={name}>
      <Label x={center} y={tops[index] + 58} anchor="middle">{name}</Label>
      <Label x={center} y={tops[index] + 71} anchor="middle" className="dd-param-text">{weights} weights</Label>
      <path d={`M ${center} ${tops[index] + 76} V ${tops[index + 1] - (skip && index === 2 ? 22 : 3)}`} className="dd-wire" markerEnd={skip && index === 2 ? undefined : `url(#${id})`} />
    </g>)}
    {skip && <g>
      <circle cx={center} cy={tops[3] - 12} r={9} className="dd-op" /><text x={center} y={tops[3] - 7} textAnchor="middle" className="dd-op-text">⊕</text>
      <path d={`M ${center} ${tops[3] - 3} V ${tops[3] - 1}`} className="dd-wire" />
      <path d={`M ${center - 62} ${tops[0] + 13} H ${center - 76} V ${tops[3] - 12} H ${center - 12}`} className="dd-skip" markerEnd={`url(#${id})`} />
      <Label x={center - 72} y={tops[3] - 18} className="dd-note">skip</Label>
    </g>}
    <Label x={center} y={410} anchor="middle" className="dd-note">{note}</Label>
  </g>;
}

export function BlockShapesFigure() {
  return <figure className="dd-figure" data-figure="block-shapes">
    <svg viewBox="0 0 372 418" className="dd-svg dd-svg-blocks" role="img" aria-label="Two blocks drawn with tensor width proportional to channel count. Left, a ResNet-50 bottleneck at 56 by 56: 256 channels narrow to 64 with a 1 by 1, a 3 by 3 works on 64, a 1 by 1 widens back to 256, and a skip path adds the input at ⊕. Right, a MobileNet V2 inverted residual with stride 2: 32 channels at 14 by 14 widen to 192, a 3 by 3 depthwise step with stride 2 halves the grid to 7 by 7, drawn as a shorter slab, and a linear 1 by 1 projection narrows back to 32. Its shapes change, so it has no skip.">
      <defs><marker id="dd-block-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z" className="dd-head-fwd" /></marker></defs>
      <BlockColumn id="dd-block-head" center={96} title="ResNet-50 bottleneck" tensors={[[256, 56, 26], [64, 56, 26], [64, 56, 26], [256, 56, 26]]}
        ops={[['1×1 reduce', '16,384'], ['3×3 standard', '36,864'], ['1×1 expand', '16,384']]} skip note="⊕ adds the input back" />
      <BlockColumn id="dd-block-head" center={276} title="Inverted residual, stride 2" tensors={[[32, 14, 26], [192, 14, 26], [192, 7, 13], [32, 7, 13]]}
        ops={[['1×1 expand ×6', '6,144'], ['3×3 depthwise, stride 2', '1,728'], ['1×1 linear projection', '6,144']]} note="shapes change: no skip" />
    </svg>
  </figure>;
}

/* §5 Output stride: how a backbone keeps a finer grid ------------------------------------ */
export function OutputStrideFigure() {
  const rows = [['output stride 32', [56, 28, 14, 7], ['', '', '', '']], ['output stride 16', [56, 28, 14, 14], ['', '', '', 'd = 2']], ['output stride 8', [56, 28, 28, 28], ['', '', 'd = 2', 'd = 4']]];
  const side = grid => grid * 0.7;
  return <figure className="dd-figure" data-figure="output-stride">
    <svg viewBox="0 0 380 222" className="dd-svg dd-svg-stride" role="img" aria-label="ResNet's last four stages drawn as squares sized by their grid, for a 224 by 224 input. Output stride 32: grids 56, 28, 14, 7. Output stride 16: the last stage keeps 14 by 14 by removing its stride and dilating its 3 by 3 convolutions by 2. Output stride 8: the last two stages keep 28 by 28, dilated by 2 and 4.">
      {rows.map(([title, grids, dilation], r) => {
        const y = 22 + r * 68;
        return <g key={title}>
          <Label x={4} y={y + 22} className="dd-heading">{title}</Label>
          {grids.map((grid, s) => {
            const x = 128 + s * 64, size = side(grid);
            return <g key={s}>
              <rect x={x} y={y + 22 - size / 2} width={size} height={size} className={`dd-slab ${dilation[s] ? 'dd-slab-dilated' : 'dd-slab-computed'}`} />
              <Label x={x + size + 4} y={y + 26} className="dd-label-small">{grid}</Label>
              {dilation[s] && <Label x={x + size / 2} y={y + 22 + size / 2 + 13} anchor="middle" className="dd-param-text">{dilation[s]}</Label>}
            </g>;
          })}
        </g>;
      })}
      <Label x={4} y={218} className="dd-note">224 × 224 input; ResNet stages 2–5, squares to scale; amber d: dilated</Label>
    </svg>
  </figure>;
}

/* §5 Parallel ASPP branches over one feature map ---------------------------------------- */
export function AsppBranchesFigure() {
  const centers = [36, 108, 180, 252, 324];
  const branches = [['1×1', 'centre only'], ['3×3', 'rate 6'], ['3×3', 'rate 12'], ['3×3', 'rate 18'], ['average pool', '→ 1×1', '→ resize']];
  return <figure className="dd-figure" data-figure="aspp-branches">
    <svg viewBox="0 0 360 306" className="dd-svg dd-svg-aspp" role="img" aria-label="One feature map, C by H by W, feeds five parallel branches: a 1 by 1 convolution, three 3 by 3 convolutions at rates 6, 12 and 18, and an image-pooling branch that averages the whole map to 1 by 1, projects it and resizes it back to H by W. Each branch makes B channels at H by W. The five results are concatenated into 5B channels, and a 1 by 1 projection mixes them back to B channels.">
      <rect x={105} y={8} width={150} height={24} className="dd-slab dd-slab-input" />
      <Label x={180} y={48} anchor="middle" className="dd-input-text">feature map C × H × W</Label>
      {centers.map((x, index) => <g key={x}>
        <line x1={180} y1={54} x2={x} y2={70} className="dd-wire" />
        <rect x={x - 33} y={70} width={66} height={46} rx={6} className="dd-op" />
        {branches[index].map((line, k) => <Label key={k} x={x} y={85 + k * 13 + (branches[index].length === 2 ? 6 : 0)} anchor="middle" className="dd-op-text-small">{line}</Label>)}
        <line x1={x} y1={116} x2={x} y2={128} className="dd-wire" />
        <rect x={x - 26} y={128} width={52} height={16} className="dd-slab dd-slab-computed" />
        <Label x={x} y={158} anchor="middle" className="dd-computed-text">B×H×W</Label>
        <line x1={x} y1={164} x2={70 + index * 55} y2={186} className="dd-wire" />
      </g>)}
      {centers.map((x, index) => <rect key={`c${x}`} x={44 + index * 55} y={186} width={52} height={18} className="dd-slab dd-slab-computed" />)}
      <Label x={180} y={220} anchor="middle" className="dd-computed-text">‖ concatenate: 5B × H × W</Label>
      <line x1={180} y1={226} x2={180} y2={236} className="dd-wire" />
      <rect x={100} y={236} width={160} height={24} rx={6} className="dd-op" />
      <Label x={180} y={252} anchor="middle" className="dd-op-text-small">1×1 projection: 5B → B</Label>
      <line x1={180} y1={260} x2={180} y2={270} className="dd-wire" />
      <rect x={154} y={270} width={52} height={16} className="dd-slab dd-slab-computed" />
      <Label x={180} y={302} anchor="middle" className="dd-computed-text">output B × H × W</Label>
    </svg>
  </figure>;
}

/* §5 Where rates 6, 12 and 18 land on a 33 × 33 map ------------------------------------ */
export const footprintMap = 33;
export const footprintRates = [6, 12, 18];
export function footprintTaps(rate, centre = 16) {
  return [-1, 0, 1].flatMap(a => [-1, 0, 1].map(b => [centre + a * rate, centre + b * rate]))
    .map(([r, c]) => ({ r, c, inside: r >= 0 && c >= 0 && r < footprintMap && c < footprintMap }));
}

export function AsppFootprintFigure() {
  const cell = 7, origin = 30;
  const at = position => origin + position * cell + cell / 2;
  const marker = (rate, { r, c, inside }, key) => {
    const x = at(c), y = at(r);
    const cls = `dd-mark dd-mark-${rate}${inside ? '' : ' dd-mark-outside'}`;
    if (rate === 6) return <circle key={key} cx={x} cy={y} r={3.6} className={cls} />;
    if (rate === 12) return <rect key={key} x={x - 3.4} y={y - 3.4} width={6.8} height={6.8} className={cls} />;
    return <path key={key} d={`M ${x} ${y - 4.6} L ${x + 4.6} ${y} L ${x} ${y + 4.6} L ${x - 4.6} ${y} Z`} className={cls} />;
  };
  const lines = [];
  for (let i = 0; i <= footprintMap; i++) {
    lines.push(<line key={`h${i}`} x1={origin} y1={origin + i * cell} x2={origin + footprintMap * cell} y2={origin + i * cell} className="dd-fine" />);
    lines.push(<line key={`v${i}`} x1={origin + i * cell} y1={origin} x2={origin + i * cell} y2={origin + footprintMap * cell} className="dd-fine" />);
  }
  return <figure className="dd-figure" data-figure="aspp-footprints">
    <svg viewBox="0 0 291 312" className="dd-svg dd-svg-footprint" role="img" aria-label="A 33 by 33 feature map with the output position at its centre, outlined in white; all three rates share that centre tap. Rate 6 taps, circles, and rate 12 taps, squares, all land inside the map. The other eight rate 18 taps, diamonds, fall two cells outside the map, in zero padding, drawn hollow.">
      <rect x={origin} y={origin} width={footprintMap * cell} height={footprintMap * cell} className="dd-map" />
      {lines}
      {footprintRates.flatMap(rate => footprintTaps(rate).filter(({ r, c }) => r !== 16 || c !== 16).map((tap, index) => marker(rate, tap, `${rate}-${index}`)))}
      <rect x={origin + 16 * cell - 1.5} y={origin + 16 * cell - 1.5} width={cell + 3} height={cell + 3} className="dd-traced" />
      <Label x={at(22) + 7} y={at(10) + 3} className="dd-rate-6">rate 6</Label>
      <Label x={at(28) + 7} y={at(4) + 3} className="dd-rate-12">rate 12</Label>
      <Label x={at(34) - 2} y={at(-2) - 9} anchor="end" className="dd-rate-18">rate 18 (outside)</Label>
      <Label x={145} y={290} anchor="middle">33 × 33 map; white outline = output and shared centre tap</Label>
      <Label x={145} y={305} anchor="middle" className="dd-note">hollow marks = taps that land in zero padding</Label>
    </svg>
  </figure>;
}

/* §6 One trained 12 × 9 matrix, its singular values, and its rank-2 factors -------------- */
// Seed 1, dilation 1, second-layer weights for input channel 0 (digit-inference.json),
// rounded to two decimals; scripts/verify-depthwise-drawings.py recomputes every value.
export const svdMatrix = [[-0.25, -0.17, 0.15, -0.22, 0.2, 0.1, -0.2, 0.25, -0.15], [-0.19, -0.16, 0.04, -0.26, 0.12, 0.16, 0.29, 0.16, -0.14], [0.25, 0.15, 0.2, 0.29, 0.32, 0.31, -0.21, -0.09, 0.28], [-0.13, 0.23, 0.12, -0.29, 0.2, 0.18, -0.01, 0.11, -0.18], [0.24, 0.22, -0.18, 0.2, -0.16, -0.2, -0.16, -0.17, 0.08], [0.14, 0.35, 0.09, 0.3, 0.26, 0.12, -0.23, -0.14, -0.26], [-0.31, 0.29, 0.26, -0.41, 0.15, 0.11, 0.14, 0.19, -0.3], [0.2, 0.11, 0.17, 0.14, 0.3, 0.32, -0.25, 0.22, 0.21], [-0.06, 0.35, 0.18, 0.2, 0.15, 0.33, 0.18, 0.13, 0.3], [-0.16, -0.12, -0.12, 0.23, 0.06, 0.04, 0.24, 0.22, 0.28], [0.26, 0.32, 0.3, 0.32, 0.16, 0.23, 0.19, 0.26, -0.21], [0.21, 0.24, 0.22, 0.19, 0.17, 0.23, -0.24, -0.3, 0.07]];
export const svdValues = [1.414, 1.202, 0.831, 0.664, 0.472, 0.347, 0.299, 0.19, 0.076];
export const svdPatterns = [[0.36, 0.46, 0.29, 0.47, 0.35, 0.39, -0.22, -0.05, 0.15], [-0.36, 0.17, 0.36, -0.42, 0.34, 0.35, 0.19, 0.41, -0.32]];
export const keptEnergy = m => svdValues.slice(0, m).reduce((s, v) => s + v * v, 0) / svdValues.reduce((s, v) => s + v * v, 0);

const fixed2 = value => (value < 0 ? '−' : '') + Math.abs(value).toFixed(2);
const signedClass = value => Math.abs(value) < 0.005 ? 'dd-zero' : value < 0 ? 'dd-negative' : 'dd-positive';
function ValueGrid({ values, label, columns }) {
  return <div className="dd-value-block"><p className="dd-grid-label">{label}</p>
    <div className="dd-value-scroll" role="region" tabIndex={0} aria-label={label}>
      <div className="dd-value-grid" style={{ '--cols': columns }}>{values.flat().map((value, index) => <span key={index} className={signedClass(value)}>{fixed2(value)}</span>)}</div>
    </div></div>;
}

export function SvdMatrixFigure() {
  return <figure className="dd-figure" data-figure="trained-weight-matrix">
    <ValueGrid values={svdMatrix} columns={9} label="W for input channel 0: 12 rows (output filters) × 9 columns (taps of a 3×3 kernel, read row by row)" />
  </figure>;
}

export function SvdSpectrumFigure({ kept = 2 }) {
  const height = value => value / svdValues[0] * 96;
  const share = Math.round(keptEnergy(kept) * 100);
  return <figure className="dd-figure" data-figure="singular-values-and-factors">
    <svg viewBox="0 0 320 172" className="dd-svg dd-svg-spectrum" role="img" aria-label={`Bar chart of the nine singular values of W, from largest to smallest: ${svdValues.join(', ')}. The first ${kept} bars are filled to show the patterns kept; the remaining bars are dashed outlines, the discarded patterns. Keeping ${kept} retains ${share} percent of the squared weight energy.`}>
      <line x1={30} y1={128} x2={310} y2={128} className="dd-axis" />
      {svdValues.map((value, index) => {
        const x = 38 + index * 30, h = height(value);
        return <g key={index}>
          <rect x={x} y={128 - h} width={20} height={h} className={index < kept ? 'dd-bar-kept' : 'dd-bar-dropped'} />
          <text x={x + 10} y={122 - h} textAnchor="middle" className="dd-bar-value">{value.toFixed(2)}</text>
          <text x={x + 10} y={144} textAnchor="middle" className="dd-label">σ{index + 1}</text>
        </g>;
      })}
      <Label x={310} y={20} anchor="end" className="dd-param-text">kept: {share}% of Σσ²</Label>
      <Label x={38} y={164} className="dd-param-text">filled: kept (m = {kept})</Label>
      <Label x={310} y={164} anchor="end" className="dd-note">dashed: discarded</Label>
    </svg>
    <svg viewBox="0 0 330 128" className="dd-svg dd-svg-factors" role="img" aria-label={`Shapes of the factorization: W, 12 rows by 9 columns, approximately equals P, 12 rows by ${kept} columns, times D, ${kept} rows by 9 columns. Each row of D is one 3 by 3 depthwise filter; each column of P holds that pattern's 12 mixing weights.`}>
      <Grid x={8} y={10} rows={12} cols={9} cell={8} role="param" />
      <Label x={44} y={118} anchor="middle">W · 12 × 9</Label>
      <text x={98} y={62} textAnchor="middle" className="dd-op-text">≈</text>
      <Grid x={116} y={10} rows={12} cols={kept} cell={8} role="param" />
      <Label x={124} y={118} anchor="middle">P · 12 × {kept}</Label>
      <text x={152} y={62} textAnchor="middle" className="dd-op-text">×</text>
      <Grid x={168} y={46} rows={kept} cols={9} cell={8} role="param" />
      <Label x={204} y={82} anchor="middle">D · {kept} × 9</Label>
      <line x1={242} y1={50} x2={266} y2={25} className="dd-wire" />
      {kept > 1 && <line x1={242} y1={58} x2={266} y2={81} className="dd-wire" />}
      {svdPatterns.slice(0, kept).map((_, index) => <g key={index}>
        <Grid x={270} y={10 + index * 56} rows={3} cols={3} cell={10} role="param" />
        <Label x={285} y={52 + index * 56} anchor="middle">filter {index + 1}</Label>
      </g>)}
    </svg>
    <div className="flow-columns-2">{svdPatterns.slice(0, kept).map((pattern, index) =>
      <ValueGrid key={index} columns={3} values={[pattern.slice(0, 3), pattern.slice(3, 6), pattern.slice(6, 9)]} label={`Row ${index + 1} of D as a 3×3 depthwise filter (σ${index + 1} = ${svdValues[index].toFixed(2)})`} />)}</div>
  </figure>;
}
