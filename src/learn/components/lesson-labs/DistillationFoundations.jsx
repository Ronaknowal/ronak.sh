import { useState } from 'react';
import { colors, sum, softmax, kl, entropy, loss, update, categorical, teacherLogits,
  studentLogits, family, restrictedTeacher, teacherRows } from '../../data/distillation-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Bars, Pair, Arrow, Tree, Curve, fmt, vec } from './DistillationShared.jsx';

function Decoder({ teacher = false }) {
  const color = teacher ? colors.teacher : colors.student;
  const indices = teacher ? [0, 1, 2, 3, 4, 5] : [0, 2, 4];
  return <div className="distill-stack" style={{ '--role': color }}>
    <p style={{ color }}>{teacher ? 'Teacher θ — frozen' : 'Student φ — trainable'}</p>
    <div className="distill-vector"><span>prefix token IDs</span></div><Arrow>↓ lookup</Arrow>
    <div className="distill-layer">Embedding table<small>50,304 rows × 128 coordinates</small></div>
    {indices.map((index, position) => <div className="distill-layer" key={index}>
      <span>Block {position} {teacher ? '' : `(copied base block ${index})`}</span>
      <Scroll label={`Residual wiring in ${teacher ? 'teacher' : 'student'} block ${position}`}>
        <svg viewBox="0 0 320 180" style={{ minWidth: '20em' }} role="img" aria-label="Pythia parallel residual block: the same input x feeds a first normalization and attention, a second normalization and feedforward network, and an identity branch. The three outputs are added.">
          <path d="M18 80H305M18 80V30H280V80M18 80V124H280V80" stroke={color} fill="none" />
          <rect x="55" y="14" width="173" height="32" fill="#292d36" stroke={color} />
          <rect x="55" y="108" width="173" height="32" fill="#292d36" stroke={color} />
          <text x="141" y="36" textAnchor="middle">LN₁ → Attention</text>
          <text x="141" y="130" textAnchor="middle">LN₂ → Feedforward</text>
          <text x="141" y="75" textAnchor="middle" className="distill-backed">identity x</text>
          <circle cx="280" cy="80" r="12" fill="#292d36" stroke={color} />
          <text x="280" y="86" textAnchor="middle">+</text>
          <text x="160" y="171" textAnchor="middle">same x; all output widths 128</text>
        </svg>
      </Scroll>
    </div>)}
    <div className="distill-layer">Final normalization → vocabulary head<small>128 coordinates → 50,304 logits</small></div>
    <div className="distill-vector">{['z₀', 'z₁', '…', 'z₅₀₃₀₃'].map(value => <span key={value}>{value}</span>)}</div>
    <p>{teacher ? 'Stop gradient: teacher values supply a target.' : 'Loss derivatives update only the student parameters.'}</p>
  </div>;
}
export function DistillNetworks() {
  return <Figure id="D01" caption="Actual dimensions and parallel residual wiring of the pinned Pythia model: x + Attention(LN₁(x)) + FFN(LN₂(x)). Each vector row is one selected predictor position. Vocabulary logits are symbolic coordinates, not fabricated model outputs.">
    <Pair><Decoder teacher /><Decoder /></Pair>
  </Figure>;
}
export function DistillDeployment() {
  const [training, setTraining] = useState(true);
  return <Figure id="D02" caption="A constructed four-event student forward stays identical when the teacher and training loss are removed. Deployment changes the computation that is needed, not the saved student weights.">
    <p>Same prefix → student logits {vec(studentLogits)}</p>
    <Bars title="Student forward p" values={softmax(studentLogits)} />
    {training && <><Arrow color={colors.teacher}>Teacher q → stop gradient → target side of KL</Arrow>
      <Pair><Bars title="Frozen teacher q" values={softmax(teacherLogits)} />
        <div><p>KL(q ‖ p) = {fmt(kl(softmax(teacherLogits), softmax(studentLogits)))} nats</p>
          <Arrow color={colors.student}>∂loss/∂student parameters ↑</Arrow><p>Teacher parameter derivative: none.</p></div></Pair></>}
    <Controls><Check label="Training graph (off = deployment)" checked={training} onChange={setTraining} /></Controls>
    <p>Student p = {vec(softmax(studentLogits))} in both states.</p>
  </Figure>;
}
export function DistillSignals() {
  const [logit, setLogit] = useState(2);
  const [rule, setRule] = useState('argmax');
  const [uniform, setUniform] = useState(.7);
  const q = softmax([logit, 0, -1, -3]);
  const index = rule === 'argmax' ? q.indexOf(Math.max(...q)) : categorical(q, uniform);
  return <Figure id="D03" caption="A selected token preserves its identity but discards the other masses. The sample uses the shown uniform through cumulative probabilities; it is not a second soft target.">
    <Pair><Bars title="Complete teacher distribution" values={q} /><Bars title={`${rule === 'argmax' ? 'Greedy' : 'Sampled'} hard target`} values={q.map((_, j) => +(j === index))} /></Pair>
    <Controls reset={() => { setLogit(2); setRule('argmax'); setUniform(.7); }}>
      <Range label="Teacher logit A" min={-3} max={4} value={logit} onChange={setLogit} />
      <Select label="Projection rule" value={rule} options={[['argmax', 'Argmax'], ['sample', 'CDF sample']]} onChange={setRule} />
      <Range label="Sampling uniform" min={0} max={.999} step={.001} value={uniform} onChange={setUniform} />
    </Controls><p>Selected event {['A', 'B', 'C', 'D'][index]}; its original mass is {fmt(q[index])}. A uniform inside the same CDF interval leaves the sampled identity unchanged.</p>
  </Figure>;
}
export function DistillCompletion() {
  const [uniform, setUniform] = useState(.6);
  const leaf = teacherRows[0].flatMap((mass, index) => teacherRows[index + 1].map(value => mass * value));
  const chosen = categorical(leaf, uniform);
  return <Figure id="D04" caption="A whole completion follows a path through conditional rows. Its leaf probability is the product of the two edge probabilities; copying its text does not retain all the unselected conditional distributions.">
    <Tree rows={teacherRows} title="Teacher's two-token text distribution" selected={chosen} />
    <Controls reset={() => setUniform(.6)}><Range label="Uniform selecting one leaf" value={uniform} min={0} max={.999} step={.001} onChange={setUniform} /></Controls>
    <p>Copied completion: <strong>{['A A', 'A B', 'B A', 'B B'][chosen]}</strong>. Leaf mass {fmt(leaf[chosen])}; each edge remains visible above.</p>
  </Figure>;
}
export function DistillDivergence() {
  const [first, setFirst] = useState(Math.log(.4));
  const [equal, setEqual] = useState(false);
  const q = [.6, .2, .15, .05];
  const p = equal ? q : softmax([first, Math.log(.3), Math.log(.2), Math.log(.1)]);
  return <Figure id="D05" caption="Each row names the same event on both sides. A negative individual KL contribution is allowed; their complete sum is nonnegative. Entropy depends on q, while changing p changes cross-entropy.">
    <Pair><Bars title="Teacher q" values={q} /><Bars title="Student p" values={p} /></Pair>
    <Controls reset={() => { setFirst(Math.log(.4)); setEqual(false); }}>
      <Range label="Student logit A" min={-4} max={2} step={.01} value={first} onChange={setFirst} />
      <Check label="Match p exactly to q (zero KL)" checked={equal} onChange={setEqual} />
    </Controls>
    <Table label="Contributions in nats" headers={['event', 'q', 'p', '−q log q', '−q log p', 'q log(q/p)']}
      rows={q.map((mass, j) => [<span style={{ color: colors.event[j] }}>{['A', 'B', 'C', 'D'][j]}</span>, mass, p[j], -mass * Math.log(mass), -mass * Math.log(p[j]), mass * Math.log(mass / p[j])])} />
    <p>Entropy {fmt(entropy(q))}; cross-entropy {fmt(entropy(q) + kl(q, p))}; KL {fmt(kl(q, p))}.</p>
  </Figure>;
}
export function DistillVocabulary() {
  const [swap, setSwap] = useState(true);
  const [correct, setCorrect] = useState(false);
  const [segmented, setSegmented] = useState(false);
  const permutation = swap ? [1, 0, 2, 3] : [0, 1, 2, 3];
  const q = [.6, .2, .15, .05];
  const raw = permutation.map(index => q[index]);
  const p = correct ? q : raw;
  return <Figure id="D06" caption="Event identity follows the labelled token, not its numeric array index. A permutation can be undone; different token segmentation is not repaired by pretending that an equally wide vector has the same events.">
    {segmented ? <Scroll label="One teacher token corresponds to a student sequence, not one event">
      <svg viewBox="0 0 550 260" style={{ minWidth: '34em' }} role="img" aria-label="Teacher token A and student tokens A1 followed by A2 encode the same string with different next-token events; direct categorical KL is unavailable">
        <text x="100" y="35" textAnchor="middle">Teacher next event</text>
        <text x="395" y="35" textAnchor="middle">Student token sequence</text>
        <rect x="50" y="72" width="100" height="40" fill="#252932" stroke={colors.teacher} />
        <text x="100" y="99" textAnchor="middle">A</text>
        <rect x="300" y="72" width="75" height="40" fill="#252932" stroke={colors.student} />
        <rect x="420" y="72" width="75" height="40" fill="#252932" stroke={colors.target} />
        <text x="338" y="99" textAnchor="middle">A₁</text><text x="458" y="99" textAnchor="middle">A₂</text>
        <path d="M375 92H416" stroke={colors.fixed} /><text x="396" y="70" textAnchor="middle">then</text>
        <path d="M100 119V148H458V119M338 119V148" stroke={colors.fixed} fill="none" />
        <text x="275" y="179" textAnchor="middle">same literal text, different token boundaries</text>
        <text x="275" y="222" textAnchor="middle" style={{ fill: colors.blocked }}>× no one-to-one next-event correspondence</text>
      </svg>
    </Scroll> : <Scroll label="Teacher ID to token to student ID correspondences"><svg viewBox="0 0 550 260" style={{ minWidth: '34em' }} role="img" aria-label="Four token identities cross between teacher and permuted student IDs">
      <text x="90" y="25" textAnchor="middle">Teacher ID</text><text x="440" y="25" textAnchor="middle">Student ID</text>
      {q.map((value, j) => <g key={j}>
        <path d={`M160 ${65 + j * 48}L375 ${65 + permutation.indexOf(j) * 48}`} stroke={colors.event[j]} strokeWidth="2" />
        <text x="80" y={70 + j * 48} textAnchor="middle" style={{ fill: colors.event[j] }}>{j}: {['A', 'B', 'C', 'D'][j]}</text>
        <text x="455" y={70 + permutation.indexOf(j) * 48} textAnchor="middle" style={{ fill: colors.event[j] }}>{permutation.indexOf(j)}: {['A', 'B', 'C', 'D'][j]}</text>
      </g>)}
    </svg></Scroll>}
    <Controls><Check label="Swap student IDs 0 and 1" checked={swap} onChange={setSwap} />
      <Check label="Reindex by the token identity" checked={correct} onChange={setCorrect} />
      <Check label="Student instead splits A into two tokens" checked={segmented} onChange={setSegmented} /></Controls>
    <p>{segmented ? 'Direct per-token KL is unavailable: no one-to-one event mapping. Transfer the literal text and retokenize it instead.'
      : `Compared p = ${vec(p)}; computed KL = ${fmt(kl(q, p))} nats. ${correct || !swap ? 'Events and masses now agree.' : 'Equal vector width hid an event mismatch.'}`}</p>
  </Figure>;
}
export function DistillTemperature() {
  const [temperature, setTemperature] = useState(1);
  const [ties, setTies] = useState(false);
  const [shift, setShift] = useState(0);
  const teacher = (ties ? [2, 2, -1, -3] : teacherLogits).map(value => value + shift);
  const probabilityLabel = value => value > 0 && value < .00001 ? value.toExponential(2) : fmt(value);
  return <Figure id="D07" caption="Division by the same positive temperature precedes normalization. A shared logit offset cancels; tied largest logits retain split mass as temperature becomes small. Tiny positive probabilities use scientific notation: 3.07e-6 means 0.00000307.">
    <Table label="Logits → divided logits → probabilities" headers={['event', 'teacher logit', 'logit/T', 'qT']}
      rows={teacher.map((value, j) => [['A', 'B', 'C', 'D'][j], value, value / temperature, probabilityLabel(softmax(teacher, temperature)[j])])} />
    <Pair><Bars title="Teacher qT" format={probabilityLabel} values={softmax(teacher, temperature)} /><Bars title="Student pT" format={probabilityLabel} values={softmax(studentLogits, temperature)} /></Pair>
    <Controls reset={() => { setTemperature(1); setTies(false); setShift(0); }}>
      <Range label="Temperature T" value={temperature} min={.25} max={8} step={.25} onChange={setTemperature} />
      <Range label="Shared teacher logit shift" value={shift} min={-4} max={4} onChange={setShift} />
      <Check label="Tie teacher maxima A and B" checked={ties} onChange={setTies} /></Controls>
  </Figure>;
}
export function DistillUpdate() {
  const [temperature, setTemperature] = useState(2);
  const [rate, setRate] = useState(.2);
  const [scaled, setScaled] = useState(true);
  const [equal, setEqual] = useState(false);
  const result = update(temperature, rate, scaled, equal);
  const px = value => 90 + 85 * (value + 3.5);
  return <Figure id="D08" caption="Each arrow is the actual −η times logit derivative, with all events coupled by softmax. The teacher receives no derivative. The displayed objective uses the same temperature and scale before and after the step.">
    <Scroll label="Four student logits before and after one gradient step"><svg viewBox="0 0 620 245" style={{ minWidth: '38em' }} role="img" aria-label="Student logit update vectors">
      {result.z.map((value, j) => <g key={j}>
        <text x="30" y={45 + j * 48} style={{ fill: colors.event[j] }}>{['A', 'B', 'C', 'D'][j]}</text>
        <path d={`M70 ${40 + j * 48}H580`} stroke="#373c45" />
        <path d={`M${px(value)} ${40 + j * 48}H${px(result.next[j])}`} stroke={colors.event[j]} strokeWidth="4" />
        <circle cx={px(value)} cy={40 + j * 48} r="5" fill="#17191e" stroke={colors.event[j]} />
        <circle cx={px(result.next[j])} cy={40 + j * 48} r="5" fill={colors.event[j]} />
      </g>)}
      <text x="310" y="238" textAnchor="middle">open = before · filled = after · common logit scale</text>
    </svg></Scroll>
    <Controls reset={() => { setTemperature(2); setRate(.2); setScaled(true); setEqual(false); }}>
      <Range label="Learning rate η" value={rate} min={0} max={.4} step={.01} onChange={setRate} />
      <Range label="Temperature" value={temperature} min={.25} max={8} step={.25} onChange={setTemperature} />
      <Check label="Multiply loss by T²" checked={scaled} onChange={setScaled} />
      <Check label="Student logits equal teacher" checked={equal} onChange={setEqual} /></Controls>
    <Table label="Exact one-step calculation" headers={['event', 'before z', 'gradient', '−η gradient', 'after z']}
      rows={result.z.map((value, j) => [['A', 'B', 'C', 'D'][j], value, result.g[j], -rate * result.g[j], result.next[j]])} />
    <p>Loss {fmt(result.before)} → {fmt(result.after)} nats; gradient sum {fmt(sum(result.g))}. Rate zero or equal distributions produces no movement.</p>
  </Figure>;
}
export function DistillHighTemperature() {
  const [power, setPower] = useState(3);
  const t = 2 ** power;
  const center = values => values.map(value => value - sum(values) / values.length);
  const a = center(teacherLogits);
  const b = center(studentLogits);
  const limit = sum(a.map((value, j) => (value - b[j]) ** 2)) / 8;
  return <Figure id="D09" caption="Calculated values approach the centered-logit limit. These are evaluations of a finite equation, not measured language-model learning curves. The horizontal axis is log₂ T.">
    <Table label="Centered coordinates" headers={['event', 'teacher centered', 'student centered', 'squared gap / 8']}
      rows={a.map((value, j) => [['A', 'B', 'C', 'D'][j], value, b[j], (value - b[j]) ** 2 / 8])} />
    <Curve xLabel="log₂ T" maximum={1} vertical={power} series={[
      { name: 'T² KL', color: colors.student, values: Array.from({ length: 71 }, (_, j) => {
        const temperature = 2 ** (j / 10);
        return [j / 10, temperature ** 2 * kl(softmax(teacherLogits, temperature), softmax(studentLogits, temperature))];
      }) }, { name: 'asymptotic limit', color: colors.teacher, values: [[0, limit], [7, limit]] },
    ]} />
    <Controls reset={() => setPower(3)}><Range label="log₂ T" value={power} min={0} max={7} step={1} onChange={setPower} /></Controls>
    <p>T = {t}; scaled KL {fmt(t * t * kl(softmax(teacherLogits, t), softmax(studentLogits, t)))}; limit {fmt(limit)}.</p>
  </Figure>;
}
const grid = Array.from({ length: 999 }, (_, index) => (index + 1) / 1000);
const reverseMinimum = grid.slice(0, 499).reduce((best, u) => kl(family(u), restrictedTeacher) < kl(family(best), restrictedTeacher) ? u : best, .5);
export function DistillConstraint() {
  const [u, setU] = useState(.5);
  const p = family(u);
  const point = values => [60 * values[0] + 260 * values[1] + 460 * values[2], 245 * (values[0] + values[2]) + 30 * values[1]];
  const path = grid.filter((_, index) => index % 5 === 0).map((value, index) => `${index ? 'L' : 'M'}${point(family(value)).join(' ')}`).join(' ');
  return <Figure id="D10" caption="Every point in the triangle is a three-event probability vector. The student can move only along its curved family. The teacher is off that curve; objective direction therefore changes the best available approximation.">
    <Scroll label="Three-event probability simplex and restricted student family"><svg viewBox="0 0 520 300" style={{ minWidth: '32em' }} role="img" aria-label="Triangle corners correspond to pure A, B, C; student family curves between A and C below teacher q">
      <path d="M60 245L260 30L460 245Z" fill="none" stroke={colors.fixed} />
      <path d={path} fill="none" stroke={colors.student} strokeWidth="2" />
      {[restrictedTeacher, p].map((values, index) => <circle key={index} cx={point(values)[0]} cy={point(values)[1]} r="7" fill={index ? colors.student : colors.teacher} />)}
      {[.5, reverseMinimum, 1 - reverseMinimum].map((value, j) => <circle key={value} cx={point(family(value))[0]} cy={point(family(value))[1]} r="11" fill="none" stroke={j ? colors.target : colors.fixed} />)}
      <text x="60" y="275" textAnchor="middle">A = 1</text><text x="260" y="20" textAnchor="middle">B = 1</text><text x="460" y="275" textAnchor="middle">C = 1</text>
    </svg></Scroll>
    <div className="distill-key"><span style={{ color: colors.teacher }}>● teacher q</span><span style={{ color: colors.student }}>● student p(u)</span><span>○ forward optimum</span><span style={{ color: colors.target }}>○ reverse optima</span></div>
    <Controls reset={() => setU(.5)}><Range label="Student parameter u" value={u} min={.001} max={.999} step={.001} onChange={setU} /></Controls>
    <Pair><Bars title="Teacher q" values={restrictedTeacher} names={['A', 'B', 'C']} /><Bars title="Student p(u)" values={p} names={['A', 'B', 'C']} /></Pair>
    <p>Forward KL {fmt(kl(restrictedTeacher, p))}; reverse KL {fmt(kl(p, restrictedTeacher))}. Grid minima: forward u = .5; reverse u ≈ {fmt(reverseMinimum, 3)} or {fmt(1 - reverseMinimum, 3)}.</p>
  </Figure>;
}
export function DistillDirections() {
  const [beta, setBeta] = useState(.5);
  const [u, setU] = useState(.5);
  const [equal, setEqual] = useState(false);
  const p = equal ? restrictedTeacher : family(u);
  const nativeName = beta === 0 ? 'native endpoint: forward KL' : beta === 1 ? 'native endpoint: reverse KL' : `interior JSD β=${fmt(beta)}`;
  return <Figure id="D11" caption="The finite family exposes direction-dependent minima. TRL's endpoint replacements are explicit branches; the unnormalized interior JSD tends to zero as β approaches either endpoint, not to these endpoint KL values.">
    <Curve vertical={u} series={[
      { name: 'forward KL', color: colors.teacher, values: grid.filter((_, j) => j % 5 === 0).map(value => [value, kl(restrictedTeacher, family(value))]) },
      { name: 'reverse KL', color: colors.student, values: grid.filter((_, j) => j % 5 === 0).map(value => [value, kl(family(value), restrictedTeacher)]) },
      { name: nativeName, color: colors.target, values: grid.filter((_, j) => j % 5 === 0).map(value => [value, loss(restrictedTeacher, family(value), 'native', beta)]) },
    ]} />
    <Controls reset={() => { setBeta(.5); setU(.5); setEqual(false); }}>
      <Range label="u" value={u} min={.001} max={.999} step={.001} onChange={setU} />
      <Range label="Native divergence selector β" value={beta} min={0} max={1} step={.05} onChange={setBeta} />
      <Check label="Lift restriction and set p=q for readout" checked={equal} onChange={setEqual} /></Controls>
    <p>{equal ? 'Unrestricted null p=q (outside the plotted family):' : `At u=${fmt(u)}:`} forward {fmt(kl(restrictedTeacher, p))}; reverse {fmt(kl(p, restrictedTeacher))}; {nativeName} = {fmt(loss(restrictedTeacher, p, 'native', beta))} nats.</p>
  </Figure>;
}
