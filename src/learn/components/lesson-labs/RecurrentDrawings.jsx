import { useId } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { scalarRecurrence } from '../../data/recurrent-models.js';
import './recurrent-flow.css';

const palette = { input: '#89bfd0', learned: '#e4b752', computed: '#b5a3dd', wire: '#969696', ink: '#e4e4e4', backward: '#eaa26c' };

export function RecurrentDrawing({ name, label, height = 420, children }) {
  const arrow = useId().replaceAll(':', '');
  return <figure className="recurrent-flow-drawing" data-figure={name}>
    <svg viewBox={`0 0 340 ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      <defs><marker id={arrow} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8" fill={palette.wire} /></marker></defs>
      {children(arrow)}
    </svg>
  </figure>;
}

export function RecurrentWire({ points, arrow, dashed = false, color }) {
  return <polyline points={points.map(point => point.join(',')).join(' ')} fill="none" stroke={palette[color] || (dashed ? palette.backward : palette.wire)} strokeWidth="1.7" strokeDasharray={dashed ? '5 4' : undefined} markerEnd={arrow ? `url(#${arrow})` : undefined} />;
}

export function RecurrentLabel({ x = 170, y, children, color = 'ink', anchor = 'middle' }) {
  return <text x={x} y={y} textAnchor={anchor} fill={palette[color]}>{children}</text>;
}

export function RecurrentArray({ x = 80, y, values, label, role = 'computed', cell = 60 }) {
  return <g>
    {label && <RecurrentLabel x={x + values.length * cell / 2} y={y - 12} color={role}>{label}</RecurrentLabel>}
    {values.map((value, i) => <g key={i}><rect x={x + cell * i} y={y} width={cell} height="34" fill="none" stroke={palette[role]} /><text x={x + cell * (i + .5)} y={y + 22} textAnchor="middle" fill={palette.ink}>{typeof value === 'number' ? number(value, 4) : value}</text></g>)}
  </g>;
}

export function RecurrentOperation({ x = 170, y, label, width = 94 }) {
  return <g><rect x={x - width / 2} y={y - 17} width={width} height="34" rx="5" fill="none" stroke={palette.ink} /><RecurrentLabel x={x} y={y + 5}>{label}</RecurrentLabel></g>;
}

function Matrix({ x, y, rows, label }) {
  return <g><RecurrentLabel x={x + 45} y={y - 13} color="learned">{label}</RecurrentLabel>{rows.map((row, r) => row.map((v, c) => <g key={`${r}:${c}`}><rect x={x + c * 45} y={y + r * 32} width="45" height="32" fill="none" stroke={palette.learned} /><RecurrentLabel x={x + c * 45 + 22.5} y={y + r * 32 + 21}>{number(v, 3)}</RecurrentLabel></g>))}</g>;
}

export function RecurrentSharedStateFigure() {
  return <div className="flow-columns-2">
    <RecurrentDrawing name="recurrent-state-anatomy" height={398} label="One input and the previous computed state enter one learned update. The new state goes to the next observation.">
      {arrow => <>
        <RecurrentArray x={26} y={44} values={[.4, 1]} cell={55} role="input" label="current point" />
        <RecurrentArray x={186} y={44} values={['?', '?', '…']} cell={36} label="previous state" />
        <RecurrentWire points={[[81, 78], [81, 125], [145, 125], [145, 162]]} arrow={arrow} />
        <RecurrentWire points={[[241, 78], [241, 125], [195, 125], [195, 162]]} arrow={arrow} />
        <RecurrentOperation y={180} label="state update" width={128} />
        <RecurrentWire points={[[170, 197], [170, 226], [286, 226], [286, 282], [260, 282]]} arrow={arrow} />
        <RecurrentArray x={80} y={265} values={['?', '?', '…']} label="new state values" />
        <RecurrentWire points={[[170, 299], [170, 354]]} arrow={arrow} />
        <RecurrentLabel y={379}>carry these values to the next point</RecurrentLabel>
      </>}
    </RecurrentDrawing>
    <RecurrentDrawing name="recurrent-state-unroll" height={398} label="Three distinct computed states use the same parameters. State flows from observation one to two to three.">
      {arrow => <>
        <RecurrentLabel x={270} y={23} color="learned">shared weights</RecurrentLabel>
        <path d="M288 35 V297" stroke={palette.learned} fill="none" strokeDasharray="3 4" />
        {[1, 2, 3].map((position, i) => <g key={position}>
          <RecurrentArray x={10} y={54 + i * 112} cell={65} values={[`point ${position}`]} role="input" />
          <RecurrentWire points={[[75, 71 + i * 112], [117, 71 + i * 112]]} arrow={arrow} />
          <RecurrentOperation x={164} y={71 + i * 112} label="same update" />
          <line x1="212" y1={71 + i * 112} x2="288" y2={71 + i * 112} stroke={palette.learned} strokeDasharray="3 4" />
          <RecurrentWire points={[[164, 88 + i * 112], [164, 112 + i * 112]]} arrow={arrow} />
          <RecurrentLabel x={164} y={134 + i * 112} color="computed">state after point {position}</RecurrentLabel>
          {i < 2 && <RecurrentWire points={[[164, 139 + i * 112], [164, 165 + i * 112]]} arrow={arrow} />}
        </g>)}
      </>}
    </RecurrentDrawing>
  </div>;
}

export function RecurrentAffineFigure() {
  const input = [.4, -.2], previous = [.1, .3], incoming = [.4, -.04], retained = [.09, .12], sum = [.59, -.02];
  return <RecurrentDrawing name="recurrent-affine" height={596} label="Two-coordinate cutaway. Input and previous state each pass through their learned matrix, add with bias, then pass through tanh.">
    {arrow => <>
      <RecurrentArray x={22} y={35} values={input} cell={55} role="input" label="current input" />
      <RecurrentArray x={208} y={35} values={previous} cell={55} label="previous state" />
      <RecurrentWire points={[[77, 69], [77, 109]]} arrow={arrow} /><RecurrentWire points={[[263, 69], [263, 109]]} arrow={arrow} />
      <Matrix x={32} y={132} rows={[[.8, -.4], [.2, .6]]} label="Wₓ · mix input" />
      <Matrix x={218} y={132} rows={[[.6, .1], [-.3, .5]]} label="Wₕ · mix state" />
      <RecurrentWire points={[[77, 196], [77, 242]]} arrow={arrow} /><RecurrentWire points={[[263, 196], [263, 242]]} arrow={arrow} />
      <RecurrentArray x={22} y={245} values={incoming} cell={55} /><RecurrentArray x={208} y={245} values={retained} cell={55} />
      <RecurrentWire points={[[77, 279], [77, 316], [138, 316], [138, 342]]} arrow={arrow} />
      <RecurrentWire points={[[263, 279], [263, 316], [202, 316], [202, 342]]} arrow={arrow} />
      <RecurrentOperation y={360} label="add + bias" width={108} />
      <RecurrentLabel x={72} y={361} color="learned">b</RecurrentLabel><RecurrentLabel x={72} y={382} color="learned">(.1, −.1)</RecurrentLabel>
      <RecurrentWire points={[[94, 360], [115, 360]]} arrow={arrow} />
      <RecurrentWire points={[[170, 377], [170, 391], [244, 391], [244, 434], [230, 434]]} arrow={arrow} />
      <RecurrentArray x={110} y={417} values={sum} cell={60} label="preactivation" />
      <RecurrentWire points={[[170, 451], [170, 473]]} arrow={arrow} /><RecurrentOperation y={490} label="tanh" />
      <RecurrentWire points={[[170, 507], [170, 525], [264, 525], [264, 568], [250, 568]]} arrow={arrow} />
      <RecurrentArray x={90} y={551} values={sum.map(Math.tanh)} cell={80} label="new state" />
    </>}
  </RecurrentDrawing>;
}

export function LstmCellDrawing({ cell = .8, forget = .9, input = .2, candidate = -.5, output = .6, read = true, write = true }) {
  const next = forget * cell + (write ? input * candidate : 0);
  return <RecurrentDrawing name={read ? 'lstm-cell-read' : 'lstm-cell-store'} height={read ? 518 : 384} label={`Old cell ${cell}, retained ${forget * cell}, written ${write ? input * candidate : 0}; new cell ${next}${read ? ` and hidden ${output * Math.tanh(next)}` : ''}. Forward cell storage and hidden readout have separate paths.`}>
    {arrow => <>
      <RecurrentArray x={15} y={39} values={[cell]} cell={78} label="old cell" />
      <RecurrentArray x={130} y={39} values={[forget]} cell={78} label="retain f" />
      <RecurrentWire points={[[54, 73], [54, 111], [115, 111], [115, 143]]} arrow={arrow} />
      <RecurrentWire points={[[169, 73], [169, 111], [145, 111], [145, 143]]} arrow={arrow} />
      <RecurrentOperation x={130} y={160} label="⊗" width={38} />
      <RecurrentLabel x={73} y={201}>retained {number(forget * cell)}</RecurrentLabel>
      {write && <>
        <RecurrentArray x={238} y={39} values={[candidate]} cell={78} label="candidate g" />
        <RecurrentArray x={238} y={122} values={[input]} cell={78} label="write i" />
        <RecurrentWire points={[[277, 73], [327, 73], [327, 192], [277, 192], [277, 214]]} arrow={arrow} />
        <RecurrentWire points={[[277, 156], [277, 214]]} arrow={arrow} />
        <RecurrentOperation x={277} y={231} label="⊗" width={38} />
        <RecurrentLabel x={263} y={275}>written {number(input * candidate)}</RecurrentLabel>
        <RecurrentWire points={[[277, 248], [277, 293], [190, 293]]} arrow={arrow} />
      </>}
      <RecurrentWire points={[[130, 177], [130, 235], [170, 235], [170, write ? 276 : 325]]} arrow={arrow} />
      {write && <><RecurrentOperation y={293} label="⊕" width={38} /><RecurrentWire points={[[170, 310], [170, 325]]} arrow={arrow} /></>}
      <RecurrentArray x={123} y={326} values={[next]} cell={94} label="" />
      <RecurrentLabel x={268} y={318} color="computed">new cell</RecurrentLabel>
      {read && <>
        <RecurrentWire points={[[170, 360], [170, 390]]} arrow={arrow} /><RecurrentOperation y={408} label="tanh" />
        <RecurrentWire points={[[170, 425], [170, 452]]} arrow={arrow} />
        <RecurrentArray x={238} y={386} values={[output]} cell={78} label="read o" />
        <RecurrentWire points={[[277, 420], [277, 469], [190, 469]]} arrow={arrow} /><RecurrentOperation y={469} label="⊗" width={38} />
        <RecurrentLabel y={509} color="computed">hidden output {number(output * Math.tanh(next))}</RecurrentLabel>
        <RecurrentWire points={[[217, 343], [330, 343], [330, 501]]} arrow={arrow} />
        <RecurrentLabel x={314} y={484} anchor="end">cell continues</RecurrentLabel>
      </>}
    </>}
  </RecurrentDrawing>;
}

export function ScalarTraceDrawing({ state, trace }) {
  return <RecurrentDrawing name="recurrent-scalar-trace" height={690} label={`Three inputs reuse weights ${state.inputWeight}, ${state.recurrentWeight} and bias ${state.bias}. Computed states ${trace.states.join(', ')}.`}>
    {arrow => <>
      <RecurrentArray x={230} y={24} values={[state.initial]} cell={88} label="initial h₀" />
      {trace.steps.map((row, i) => { const y = 154 + i * 195; return <g key={i}>
        <RecurrentArray x={10} y={y - 17} values={[state.inputs[i]]} cell={65} role="input" label={`input ${i + 1}`} />
        <RecurrentWire points={[[75, y], [134, y]]} arrow={arrow} />
        <RecurrentLabel x={103} y={y - 21} color="learned">× {number(state.inputWeight)}</RecurrentLabel>
        <RecurrentOperation x={161} y={y} label="Σ+b" width={55} />
        <RecurrentLabel x={155} y={y + 41} color="learned">b = {number(state.bias)}</RecurrentLabel>
        <RecurrentWire points={[[274, i === 0 ? 58 : y - 107], [274, y - 56], [161, y - 56], [161, y - 17]]} arrow={arrow} />
        <RecurrentLabel x={191} y={y - 72} color="learned">old state × {number(state.recurrentWeight)}</RecurrentLabel>
        <RecurrentWire points={[[189, y], [229, y]]} arrow={arrow} />
        <RecurrentOperation x={274} y={y} label="tanh" width={90} />
        <RecurrentWire points={[[274, y + 17], [274, y + 56]]} arrow={arrow} />
        <RecurrentArray x={230} y={y + 56} values={[row.hidden]} cell={88} />
        <RecurrentLabel x={132} y={y + 79} color="computed">state h{i + 1}</RecurrentLabel>
        <RecurrentLabel x={142} y={y + 111}>sum {number(row.preactivation)} before tanh</RecurrentLabel>
      </g>; })}
    </>}
  </RecurrentDrawing>;
}

export function SharedCreditDrawing({ result }) {
  const sum = Object.values(result.gradient);
  return <RecurrentDrawing name="recurrent-shared-credit" height={464} label={`Three local gradient contributions add into one shared gradient: ${sum.join(', ')}. Columns are input weight, recurrent weight and bias.`}>
    {arrow => <>
      <RecurrentLabel y={22} color="backward">gradient columns: wₓ, wₕ, b</RecurrentLabel>
      {result.contributions.map((row, i) => <g key={i}>
        <RecurrentLabel x={28} y={72 + i * 91}>{i + 1}</RecurrentLabel>
        <RecurrentArray x={54} y={49 + i * 91} values={[row.inputWeight, row.recurrentWeight, row.bias]} cell={90} role="backward" />
        <RecurrentWire points={[[54, 66 + i * 91], [40, 66 + i * 91], [40, 335], [150, 335]]} arrow={arrow} dashed />
      </g>)}
      <RecurrentOperation y={335} label="⊕" width={38} />
      <RecurrentWire points={[[170, 352], [330, 352], [330, 409], [324, 409]]} arrow={arrow} dashed />
      <RecurrentLabel y={379} color="backward">one shared gradient</RecurrentLabel>
      <RecurrentArray x={54} y={392} values={sum} cell={90} role="backward" />
      <RecurrentLabel y={452}>add uses; do not copy weights</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentCreditPicture() {
  return <SharedCreditDrawing result={scalarRecurrence({ inputs: [.4, -.2, .7], inputWeight: .8, recurrentWeight: .6, bias: .1, initial: 0, target: .3, rate: .1 })} />;
}

export function GruBlendDrawing({ old = .8, retain = .75, candidate = -.4 }) {
  const kept = old * retain, replacement = (1 - retain) * candidate;
  return <RecurrentDrawing name="gru-retain-blend" height={390} label={`Retain ${retain} of old state ${old}, add ${1 - retain} of candidate ${candidate}: new state ${kept + replacement}.`}>
    {arrow => <>
      <RecurrentArray x={26} y={41} values={[old]} cell={100} label="old state" />
      <RecurrentArray x={214} y={41} values={[candidate]} cell={100} label="candidate" />
      <RecurrentWire points={[[76, 75], [76, 126]]} arrow={arrow} /><RecurrentWire points={[[264, 75], [264, 126]]} arrow={arrow} />
      <RecurrentOperation x={76} y={143} label={`× ${number(retain)}`} width={100} /><RecurrentOperation x={264} y={143} label={`× ${number(1 - retain)}`} width={100} />
      <RecurrentLabel x={76} y={184}>z, retained share</RecurrentLabel><RecurrentLabel x={264} y={184}>1−z, written share</RecurrentLabel>
      <RecurrentArray x={26} y={216} values={[kept]} cell={100} /><RecurrentArray x={214} y={216} values={[replacement]} cell={100} />
      <RecurrentWire points={[[76, 160], [10, 160], [10, 233], [26, 233]]} arrow={arrow} /><RecurrentWire points={[[264, 160], [330, 160], [330, 233], [314, 233]]} arrow={arrow} />
      <RecurrentWire points={[[76, 250], [76, 294], [150, 294]]} arrow={arrow} /><RecurrentWire points={[[264, 250], [264, 294], [190, 294]]} arrow={arrow} />
      <RecurrentOperation y={294} label="⊕" width={38} /><RecurrentWire points={[[170, 311], [170, 345]]} arrow={arrow} />
      <RecurrentArray x={120} y={346} values={[kept + replacement]} cell={100} /><RecurrentLabel x={269} y={369} color="computed">new state</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function GruResetDrawing({ hidden = [1, 2], reset = [.2, .8], matrix = [[1, 2], [3, 4]], bias = [.5, -.5] }) {
  const scaled = hidden.map((v, i) => v * reset[i]);
  const affine = x => matrix.map((row, i) => row.reduce((s, w, j) => s + w * x[j], bias[i]));
  const before = affine(scaled), unscaled = affine(hidden), after = unscaled.map((v, i) => v * reset[i]);
  return <div className="flow-columns-2">{[false, true].map(resetAfter => <RecurrentDrawing key={String(resetAfter)} name={resetAfter ? 'gru-reset-after' : 'gru-reset-before'} height={527} label={`${resetAfter ? 'Reset after matrix and hidden bias' : 'Reset before matrix'}. Recurrent contribution ${resetAfter ? after : before}. Each off-diagonal weight mixes a different source coordinate.`}>
    {arrow => <>
      <RecurrentLabel y={24}>{resetAfter ? 'reset after mixing + hidden bias' : 'reset before mixing'}</RecurrentLabel>
      <RecurrentArray x={100} y={58} values={hidden} cell={70} label="previous hidden" />
      {!resetAfter && <>
        <RecurrentWire points={[[135, 92], [135, 121]]} arrow={arrow} /><RecurrentWire points={[[205, 92], [205, 121]]} arrow={arrow} />
        <RecurrentOperation x={135} y={139} label={`× ${number(reset[0])}`} width={62} /><RecurrentOperation x={205} y={139} label={`× ${number(reset[1])}`} width={62} />
        <RecurrentArray x={100} y={181} values={scaled} cell={70} />
      </>}
      {resetAfter && <><RecurrentWire points={[[135, 92], [135, 185]]} arrow={arrow} /><RecurrentWire points={[[205, 92], [205, 185]]} arrow={arrow} /><RecurrentArray x={100} y={181} values={hidden} cell={70} /></>}
      <RecurrentWire points={[[135, 215], [135, 240], [95, 276]]} arrow={arrow} /><RecurrentWire points={[[205, 215], [205, 240], [245, 276]]} arrow={arrow} />
      <RecurrentWire points={[[135, 215], [135, 230], [245, 276]]} arrow={arrow} /><RecurrentWire points={[[205, 215], [205, 230], [95, 276]]} arrow={arrow} />
      <RecurrentLabel x={67} y={241} color="learned">{number(matrix[0][0])}</RecurrentLabel><RecurrentLabel x={285} y={241} color="learned">{number(matrix[1][1])}</RecurrentLabel>
      <RecurrentLabel x={202} y={268} color="learned">{number(matrix[1][0])}</RecurrentLabel><RecurrentLabel x={147} y={268} color="learned">{number(matrix[0][1])}</RecurrentLabel>
      <RecurrentOperation x={95} y={295} label="Σ + b₁" width={88} /><RecurrentOperation x={245} y={295} label="Σ + b₂" width={88} />
      <RecurrentLabel x={95} y={336} color="learned">b₁ = {number(bias[0])}</RecurrentLabel><RecurrentLabel x={245} y={336} color="learned">b₂ = {number(bias[1])}</RecurrentLabel>
      <RecurrentWire points={[[95, 312], [95, 360]]} arrow={arrow} /><RecurrentWire points={[[245, 312], [245, 360]]} arrow={arrow} />
      <RecurrentArray x={58} y={361} values={[resetAfter ? unscaled[0] : before[0]]} cell={74} /><RecurrentArray x={208} y={361} values={[resetAfter ? unscaled[1] : before[1]]} cell={74} />
      {resetAfter && <>
        <RecurrentWire points={[[95, 395], [95, 431]]} arrow={arrow} /><RecurrentWire points={[[245, 395], [245, 431]]} arrow={arrow} />
        <RecurrentOperation x={95} y={449} label={`× ${number(reset[0])}`} width={72} /><RecurrentOperation x={245} y={449} label={`× ${number(reset[1])}`} width={72} />
      </>}
      <RecurrentLabel y={505} color="computed">candidate contribution ({(resetAfter ? after : before).map(v => number(v)).join(', ')})</RecurrentLabel>
    </>}
  </RecurrentDrawing>)}</div>;
}

export function RecurrentGateFigure() {
  const kind = 'lstm';
  const gates = ['i · write', 'f · retain', 'g · candidate', 'o · read'];
  return <RecurrentDrawing name={`${kind}-gate-generator`} height={460} label={`${kind.toUpperCase()} gate generator. Current input and previous hidden each enter learned affine rows. Corresponding rows add, split into gate groups, and use sigmoid except the tanh candidate.`}>
    {arrow => <>
      <RecurrentArray x={16} y={40} values={['x₁', 'x₂']} cell={66} role="input" label="current input" />
      <RecurrentArray x={192} y={40} values={['h₁', 'h₂']} cell={66} label="previous hidden" />
      {[82, 258].map((x, branch) => <g key={x}>
        <RecurrentWire points={[[x, 74], [x, 112]]} arrow={arrow} />
        {gates.map((gate, i) => <g key={gate}>
          <rect x={x - 54} y={118 + i * 22} width="72" height="22" fill="none" stroke={palette.learned} />
          <line x1={x - 18} x2={x - 18} y1={118 + i * 22} y2={140 + i * 22} stroke={palette.learned} />
          <line x1={x - 54} x2={x + 18} y1={129 + i * 22} y2={129 + i * 22} stroke={palette.learned} />
          <rect x={x + 26} y={118 + i * 22} width="20" height="22" fill="none" stroke={palette.learned} />
          <line x1={x + 26} x2={x + 46} y1={129 + i * 22} y2={129 + i * 22} stroke={palette.learned} />
        </g>)}
        <RecurrentLabel x={x} y={231} color="learned">{branch ? 'Wₕ h + bₕ' : 'Wₓ x + bₓ'}</RecurrentLabel>
        <RecurrentWire points={[[x, 118 + gates.length * 22], [branch ? 190 : 150, 118 + gates.length * 22], [branch ? 190 : 150, 252], [branch ? 194 : 146, 252], [branch ? 194 : 146, 274]]} arrow={arrow} />
      </g>)}
      <RecurrentOperation y={291} label="add rows" width={106} />
      <RecurrentWire points={[[170, 308], [170, 330], [18, 330], [18, 369]]} />
      {gates.map((gate, i) => { const x = 45 + i * (250 / (gates.length - 1)); return <g key={gate}>
        <RecurrentWire points={[[18, 330], [x, 330], [x, 353]]} arrow={arrow} />
        <RecurrentOperation x={x} y={371} width={62} label={gate[0] === 'g' || gate[0] === 'n' ? 'tanh' : 'σ'} />
        <RecurrentWire points={[[x, 388], [x, 416]]} arrow={arrow} />
        <RecurrentLabel x={x} y={439} color="computed">{gate.split(' · ')[0]}</RecurrentLabel>
      </g>; })}
    </>}
  </RecurrentDrawing>;
}

export function RecurrentClassifierFigure() {
  return <RecurrentDrawing name="recurrent-pen-classifier" height={665} label="Eight two-coordinate points pass through the same recurrent update. Final 32-coordinate hidden state enters a linear ten-score head and softmax. The separate true label enters cross-entropy, never the recurrent input.">
    {arrow => <>
      <RecurrentLabel y={25} color="input">eight points · two coordinates each</RecurrentLabel>
      {Array.from({ length: 8 }, (_, i) => <g key={i}><rect x={48 + i * 30} y="43" width="30" height="38" fill="none" stroke={palette.input} /><line x1={48 + i * 30} x2={78 + i * 30} y1="62" y2="62" stroke={palette.input} /><RecurrentLabel x={63 + i * 30} y={99}>{i + 1}</RecurrentLabel></g>)}
      <RecurrentWire points={[[168, 109], [168, 143]]} arrow={arrow} />
      <RecurrentOperation y={161} width={170} label="shared state updates" />
      <RecurrentWire points={[[170, 178], [170, 206], [297, 206], [297, 250], [286, 250]]} arrow={arrow} />
      <RecurrentArray x={46} y={233} values={['h₁', 'h₂', '…', 'h₃₂']} cell={60} label="final hidden · 32 values" />
      <RecurrentWire points={[[170, 267], [170, 300]]} arrow={arrow} />
      <RecurrentOperation y={318} width={164} label="linear 10-class head" />
      <RecurrentWire points={[[170, 335], [170, 359], [332, 359], [332, 403], [320, 403]]} arrow={arrow} />
      <RecurrentArray x={20} y={386} values={Array.from({ length: 10 }, (_, i) => `ℓ${i}`)} cell={30} label="ℓ₀…ℓ₉: one score per digit" />
      <RecurrentWire points={[[170, 420], [170, 449]]} arrow={arrow} /><RecurrentOperation y={467} label="softmax" width={110} />
      <RecurrentLabel y={514} color="computed">ten reported probabilities</RecurrentLabel>
      <RecurrentArray x={226} y={559} values={['label']} cell={82} role="input" label="true digit" />
      <RecurrentWire points={[[20, 403], [10, 403], [10, 597], [87, 597]]} arrow={arrow} /><RecurrentLabel x={66} y={573}>raw scores</RecurrentLabel>
      <RecurrentWire points={[[226, 576], [217, 576], [217, 597], [201, 597]]} arrow={arrow} />
      <RecurrentOperation x={151} y={597} label="cross-entropy" width={126} />
      <RecurrentLabel y={648} color="backward">loss trains weights; label is not input</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentBoundaryFigure({ boundary = 2 }) {
  return <RecurrentDrawing name="recurrent-chunk-paths" height={550} label={`Five positions split after ${boundary}. Carry sends the numeric state and gradient path through. Detach sends the same state value but stops the gradient. Reset sends zero and uses no preceding state. Orange dashed arrows carry suffix-loss credit leftward.`}>
    {arrow => <>
      <RecurrentLabel y={25}>same five inputs and fixed weights</RecurrentLabel>
      {['carry', 'detach', 'reset'].map((mode, i) => <g key={mode}>
        <RecurrentLabel x={45} y={64 + i * 165}>{mode}</RecurrentLabel>
        {Array.from({ length: 5 }, (_, t) => <g key={t}><rect x={20 + t * 62} y={83 + i * 165} width="42" height="34" fill="none" stroke={palette.computed} /><RecurrentLabel x={41 + t * 62} y={105 + i * 165}>{t + 1}</RecurrentLabel>{t < 4 && !(mode === 'reset' && t === boundary - 1) && <RecurrentWire points={[[62 + t * 62, 100 + i * 165], [82 + t * 62, 100 + i * 165]]} arrow={arrow} />}</g>)}
        <path d={`M${72 + (boundary - 1) * 62} ${76 + i * 165} v65`} fill="none" stroke={palette.learned} strokeDasharray="3 3" />
        <RecurrentWire points={[[310, 100 + i * 165], [330, 100 + i * 165], [330, 134 + i * 165], [mode === 'carry' ? 30 : 82 + (boundary - 1) * 62, 134 + i * 165]]} arrow={arrow} dashed />
        {mode !== 'carry' && <path d={`M${67 + (boundary - 1) * 62} ${129 + i * 165} l10 10 m0 -10 l-10 10`} stroke={palette.backward} />}
        {mode === 'reset' && <><RecurrentLabel x={20 + boundary * 62 - 11} y={73 + i * 165}>0</RecurrentLabel><RecurrentWire points={[[20 + boundary * 62 - 10, 77 + i * 165], [20 + boundary * 62 - 10, 100 + i * 165], [20 + boundary * 62, 100 + i * 165]]} arrow={arrow} /></>}
        <RecurrentLabel x={170} y={157 + i * 165} color={mode === 'carry' ? 'backward' : 'ink'}>{mode === 'carry' ? 'value + backward path cross' : mode === 'detach' ? 'same value; backward path cut' : 'zero replaces carried state'}</RecurrentLabel>
      </g>)}
    </>}
  </RecurrentDrawing>;
}

export function RecurrentOwnershipFigure({ swapped = false }) {
  return <RecurrentDrawing name="recurrent-state-owners" height={333} label={`Two streams A and B own distinct states. Next batch rows are B,A. ${swapped ? 'Passing unchanged state rows gives the wrong owner to each input.' : 'Reordering both inputs and state rows preserves stream identity.'}`}>
    {arrow => <>
      <RecurrentLabel y={25}>old batch: A, B · new batch: B, A</RecurrentLabel>
      <RecurrentArray x={20} y={76} values={['state A']} cell={118} label="saved row 0" /><RecurrentArray x={202} y={76} values={['state B']} cell={118} label="saved row 1" />
      <RecurrentWire points={[[79, 110], [79, 145], [swapped ? 79 : 261, 217]]} arrow={arrow} />
      <RecurrentWire points={[[261, 110], [261, 145], [swapped ? 261 : 79, 217]]} arrow={arrow} />
      <RecurrentArray x={20} y={231} values={['input B']} cell={118} role="input" /><RecurrentArray x={202} y={231} values={['input A']} cell={118} role="input" />
      <RecurrentLabel y={310}>{swapped ? 'wrong histories enter both updates' : 'each input receives its own history'}</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentPackingFigure({ length = 3 }) {
  return <RecurrentDrawing name="recurrent-packing" height={400} label={`A five-position padded row has ${length} real positions. Packed computation visits only those positions. A backward ordinary padded row sees padding first. Loss masking also excludes padded targets.`}>
    {arrow => <>
      <RecurrentLabel y={24}>positions 1–5 · filled = valid input</RecurrentLabel>
      {['ordinary padded row', 'packed row', 'target mask'].map((name, row) => <g key={name}>
        <RecurrentLabel y={64 + row * 110}>{name}</RecurrentLabel>
        {Array.from({ length: 5 }, (_, i) => <g key={i}><rect x={30 + i * 56} y={82 + row * 110} width="44" height="34" fill={i < length ? '#89bfd022' : 'none'} stroke={i < length ? palette.input : palette.wire} strokeDasharray={i < length ? undefined : '3 3'} /><RecurrentLabel x={52 + i * 56} y={104 + row * 110}>{row === 2 ? i < length ? '1' : '0' : i < length ? i + 1 : row === 1 ? '—' : 'pad'}</RecurrentLabel></g>)}
        {row < 2 && <RecurrentWire points={row === 0 ? [[309, 138], [31, 138]] : [[31, 248], [30 + (length - 1) * 56 + 44, 248]]} arrow={arrow} />}
      </g>)}
      <RecurrentLabel y={377}>packing changes updates; mask selects losses</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentDirectionsFigure() {
  return <RecurrentDrawing name="recurrent-direction-endpoints" height={334} label="Forward reads A to D, backward reads D to A. Their complete endpoints are forward D and backward A. Output at D contains complete forward history but only D in backward history.">
    {arrow => <>
      {['A', 'B', 'C', 'D'].map((v, i) => <RecurrentArray key={v} x={25 + i * 78} y={112} values={[v]} role="input" cell={52} />)}
      <RecurrentLabel y={35}>forward reads A → B → C → D</RecurrentLabel><RecurrentWire points={[[27, 75], [310, 75]]} arrow={arrow} />
      <RecurrentLabel y={212}>backward reads D → C → B → A</RecurrentLabel><RecurrentWire points={[[310, 179], [27, 179]]} arrow={arrow} />
      <RecurrentWire points={[[285, 75], [330, 75], [330, 228], [10, 228], [10, 267], [85, 267]]} arrow={arrow} />
      <RecurrentWire points={[[52, 179], [10, 179], [10, 215], [330, 215], [330, 267], [255, 267]]} arrow={arrow} />
      <RecurrentArray x={85} y={250} values={['forward D', 'backward A']} cell={85} />
      <RecurrentLabel y={319}>concatenate these complete histories</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentStackFigure() {
  return <RecurrentDrawing name="recurrent-layers" height={381} label="Two recurrent layers and three positions. Horizontal arrows carry state in each layer. Vertical arrows pass the lower layer output to the upper layer at the same position. Inter-layer dropout, if enabled, is on vertical edges only.">
    {arrow => <>
      <RecurrentLabel y={25}>horizontal = positions; vertical = depth</RecurrentLabel>
      {[1, 2].map((layer, r) => <g key={layer}>{[1, 2, 3].map((t, i) => <g key={t}><RecurrentOperation x={60 + i * 110} y={layer === 1 ? 266 : 116} width={88} label={`layer ${layer}`} />{i < 2 && <RecurrentWire points={[[104 + i * 110, layer === 1 ? 266 : 116], [126 + i * 110, layer === 1 ? 266 : 116]]} arrow={arrow} />}{r === 0 && <RecurrentWire points={[[60 + i * 110, 249], [60 + i * 110, 134]]} arrow={arrow} />}</g>)}</g>)}
      {[1, 2, 3].map((t, i) => <RecurrentLabel key={t} x={60 + i * 110} y={323}>position {t}</RecurrentLabel>)}
      <RecurrentLabel y={360}>a one-layer model has no such edge</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function LstmJacobianFigure() {
  return <RecurrentDrawing name="lstm-full-state-paths" height={423} label="A cell perturbation can reach the next cell by direct cell-to-cell retention and indirectly through hidden readout and later gate changes. Two paths enter the final cell; the direct forget path alone is not the whole derivative.">
    {arrow => <>
      {['previous', 'one step', 'two steps'].map((v, i) => <RecurrentLabel key={v} x={53 + i * 117} y={30}>{v}</RecurrentLabel>)}
      {[0, 1, 2].map(i => <g key={i}><RecurrentArray x={15 + i * 117} y={88} values={[`c${i}`]} cell={74} /><RecurrentArray x={15 + i * 117} y={250} values={[`h${i}`]} cell={74} /></g>)}
      <RecurrentWire points={[[89, 105], [132, 105]]} arrow={arrow} /><RecurrentWire points={[[206, 105], [249, 105]]} arrow={arrow} />
      <RecurrentWire points={[[53, 122], [53, 192], [169, 250]]} arrow={arrow} />
      <RecurrentWire points={[[169, 250], [169, 192], [286, 122]]} arrow={arrow} />
      <RecurrentLabel x={111} y={69} color="computed">.746494</RecurrentLabel><RecurrentLabel x={230} y={69} color="computed">.746494</RecurrentLabel>
      <RecurrentLabel x={96} y={211} color="computed">.318697</RecurrentLabel><RecurrentLabel x={251} y={211} color="computed">.458119</RecurrentLabel>
      <RecurrentLabel y={334}>direct product .557253</RecurrentLabel><RecurrentLabel y={362}>plus feedback product .146001</RecurrentLabel><RecurrentLabel y={400}>rounded fixed-J illustration: .703254</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function LstmPeepholeFigure() {
  return <RecurrentDrawing name="lstm-peephole" height={398} label="Previous cell enters the input and forget gates directly; updated cell enters the output gate. Hidden state is not the only gate input in a peephole variant.">
    {arrow => <>
      <RecurrentArray x={10} y={48} values={['old c']} cell={88} label="stored cell" /><RecurrentArray x={230} y={48} values={['old h']} cell={98} label="hidden view" />
      <RecurrentWire points={[[54, 82], [54, 118], [91, 118], [91, 146]]} arrow={arrow} /><RecurrentWire points={[[279, 82], [279, 118], [249, 118], [249, 146]]} arrow={arrow} />
      <RecurrentOperation y={164} label="input / forget gates" width={224} />
      <RecurrentWire points={[[170, 181], [170, 212]]} arrow={arrow} /><RecurrentOperation y={230} label="retain + write" width={150} />
      <RecurrentWire points={[[170, 247], [170, 277]]} arrow={arrow} /><RecurrentArray x={118} y={278} values={['new c']} cell={104} />
      <RecurrentWire points={[[222, 295], [289, 295], [289, 337], [252, 337]]} arrow={arrow} /><RecurrentOperation y={337} label="output gate" width={164} />
      <RecurrentLabel y={384}>peepholes inspect the cell itself</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function LstmProjectionFigure() {
  return <RecurrentDrawing name="lstm-projection" height={374} label="Cell width H is 32, unprojected exposed vector has width 32. A learned 12 by 32 projection makes hidden width P equal 12; recurrent feedback uses 12 values while the cell retains 32.">
    {arrow => <>
      <RecurrentLabel y={25}>cell and hidden need not have equal width</RecurrentLabel>
      {Array.from({ length: 32 }, (_, i) => <rect key={i} x={26 + i * 9} y="54" width="9" height="30" fill="none" stroke={palette.computed} />)}
      <RecurrentLabel y={111}>cell c: 32 values remain stored</RecurrentLabel>
      <RecurrentWire points={[[170, 84], [330, 84], [330, 145], [250, 145]]} arrow={arrow} /><RecurrentOperation y={145} width={162} label="tanh + output gate" />
      <RecurrentWire points={[[170, 162], [170, 192]]} arrow={arrow} /><RecurrentOperation y={210} width={175} label="12 × 32 projection" />
      <RecurrentWire points={[[170, 227], [170, 257]]} arrow={arrow} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={116 + i * 9} y="258" width="9" height="30" fill="none" stroke={palette.computed} />)}
      <RecurrentLabel y={315}>hidden h: 12 values for feedback / head</RecurrentLabel><RecurrentLabel y={357}>same cell width; narrower communication</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentTruncationFigure() {
  return <RecurrentDrawing name="recurrent-randomized-credit" height={362} label="One derivative path has contribution g. Keeping it with probability one half and doubling it gives 2g; dropping it gives zero. The mean contribution is g; simply dropping without correction would give half g.">
    {arrow => <>
      <RecurrentArray x={120} y={39} values={['path g']} cell={100} role="backward" />
      <RecurrentWire points={[[170, 73], [170, 106], [77, 106], [77, 147]]} arrow={arrow} dashed /><RecurrentWire points={[[170, 106], [265, 106], [265, 147]]} arrow={arrow} dashed />
      <RecurrentLabel x={77} y={131}>probability .5</RecurrentLabel><RecurrentLabel x={265} y={131}>probability .5</RecurrentLabel>
      <RecurrentOperation x={77} y={165} label="keep × 2" width={110} /><RecurrentOperation x={265} y={165} label="drop × 0" width={110} />
      <RecurrentWire points={[[77, 182], [77, 220], [148, 220], [148, 262]]} arrow={arrow} dashed /><RecurrentWire points={[[265, 182], [265, 220], [192, 220], [192, 262]]} arrow={arrow} dashed />
      <RecurrentOperation y={280} width={198} label="mean: .5×2g + .5×0" /><RecurrentLabel y={334} color="backward">expected contribution g; noisier samples</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentCostFigure() {
  return <RecurrentDrawing name="recurrent-inference-training-memory" height={371} label="Carried inference state stores one batch by hidden array, independent of prefix length. Backpropagation stores intermediates for each position, forming positions by batch by hidden storage. LSTM carries an additional cell array.">
    {() => <>
      <RecurrentLabel y={24}>inference: current batch × hidden</RecurrentLabel>
      {[0, 1, 2].map(row => [0, 1, 2, 3].map(column => <rect key={`${row}:${column}`} x={101 + column * 34} y={46 + row * 25} width="34" height="25" fill="none" stroke={palette.computed} />))}
      <RecurrentLabel y={151}>training: saved position × batch × hidden</RecurrentLabel>
      {[3, 2, 1, 0].map(t => <g key={t}>{[0, 1, 2].map(row => [0, 1, 2, 3].map(column => <rect key={`${row}:${column}`} x={74 + t * 18 + column * 34} y={235 - t * 19 + row * 25} width="34" height="25" fill="#090909" stroke={palette.computed} />))}</g>)}
      <RecurrentLabel y={354}>more positions add history, not state width</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function GruCandidateFigure() {
  return <RecurrentDrawing name="gru-candidate-reset-after" height={554} label="Torch GRU candidate: previous hidden goes through its learned affine including hidden bias, then coordinatewise reset multiplication. Current input has a separate affine and bias. The branches add and tanh produces candidate n. Reset and retain gates use ordinary summed input and hidden affines followed by sigmoid.">
    {arrow => <>
      <RecurrentArray x={20} y={41} values={['x']} cell={96} role="input" label="current input" /><RecurrentArray x={224} y={41} values={['h old']} cell={96} label="previous hidden" />
      <RecurrentWire points={[[68, 75], [68, 116]]} arrow={arrow} /><RecurrentWire points={[[272, 75], [272, 116]]} arrow={arrow} />
      <RecurrentOperation x={68} y={134} width={126} label="Wₓₙ x + bₓₙ" /><RecurrentOperation x={272} y={134} width={126} label="Wₕₙ h + bₕₙ" />
      <RecurrentArray x={15} y={204} values={['reset r']} cell={102} label="σ gate vector" />
      <RecurrentWire points={[[272, 151], [272, 259], [231, 259], [231, 278]]} arrow={arrow} /><RecurrentWire points={[[117, 221], [192, 221], [192, 278]]} arrow={arrow} />
      <RecurrentOperation x={213} y={296} width={54} label="⊙" /><RecurrentLabel x={270} y={342}>reset after affine</RecurrentLabel>
      <RecurrentWire points={[[68, 151], [68, 372], [151, 372]]} arrow={arrow} /><RecurrentWire points={[[213, 313], [213, 372], [189, 372]]} arrow={arrow} />
      <RecurrentOperation y={372} width={38} label="⊕" /><RecurrentWire points={[[170, 389], [170, 426]]} arrow={arrow} /><RecurrentOperation y={444} label="tanh" />
      <RecurrentWire points={[[170, 461], [170, 482]]} arrow={arrow} />
      <RecurrentArray x={95} y={484} values={['n₁', 'n₂', '…']} cell={50} />
      <RecurrentLabel y={545} color="computed">candidate n feeds the earlier z blend</RecurrentLabel>
    </>}
  </RecurrentDrawing>;
}

export function RecurrentPlot({ title, xLabel, yLabel, xDomain, yDomain, series }) {
  const x = value => 43 + 184 * (value - xDomain[0]) / (xDomain[1] - xDomain[0]);
  const y = value => 231 - 199 * (value - yDomain[0]) / (yDomain[1] - yDomain[0]);
  const labels = series.map((line, index) => ({ index, desired: y(line.values.at(-1)[1]) + 4 })).sort((a, b) => a.desired - b.desired);
  labels.forEach((label, i) => { label.at = Math.max(44, label.desired, i ? labels[i - 1].at + 24 : 44); });
  const excess = Math.max(0, labels.at(-1).at - 231);
  labels.forEach(label => { label.at -= excess; });
  return <div>
    <RecurrentDrawing name={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} height={287} label={`${title}. Horizontal ${xLabel}, vertical ${yLabel}. Lines are labelled at their endpoints; dots are the supplied samples.`}>
      {() => <>
        <path d="M43 30 V231 H230" stroke="#969696" fill="none" />
        {[0, .5, 1].map(f => <g key={f}><RecurrentLabel x={43 + f * 184} y={255}>{number(xDomain[0] + f * (xDomain[1] - xDomain[0]), 2)}</RecurrentLabel><RecurrentLabel x={36} y={235 - f * 199} anchor="end">{number(yDomain[0] + f * (yDomain[1] - yDomain[0]), 2)}</RecurrentLabel></g>)}
        {series.map((line, i) => { const last = line.values.at(-1), baseline = labels.find(l => l.index === i).at; return <g key={line.label}>
          <polyline fill="none" stroke={line.color} strokeWidth="2" strokeDasharray={line.dashed ? '5 4' : undefined} points={line.values.map(p => `${x(p[0])},${y(p[1])}`).join(' ')} />
          {line.values.length <= 8 && line.values.map(([a, b], j) => <circle key={j} cx={x(a)} cy={y(b)} r="3" fill={line.color} />)}
          <path d={`M${x(last[0])} ${y(last[1])} L239 ${baseline - 4}`} stroke={line.color} fill="none" />
          <text x="243" y={baseline} fill={line.color}>{line.label}</text>
        </g>; })}
      </>}
    </RecurrentDrawing>
    <p className="flow-note">Horizontal: {xLabel}. Vertical: {yLabel}.</p>
  </div>;
}
