import { useState } from 'react';
import { colors, sum, sequence, sampleSequence, categorical, kl, teacherRows } from '../../data/distillation-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Bars, Pair, Arrow, Tree, fmt, vec } from './DistillationShared.jsx';

export function DistillSequenceTree() {
  const [shift, setShift] = useState(0);
  const result = sequence(shift);
  return <Figure id="D12" caption="One changed first-position logit changes how often each second-position row is visited. Its two conditional rows retain the same values. Each leaf probability is the product of the labelled edges.">
    <div className="distill-tree-pair"><Tree rows={result.q} title="Teacher sequence q" /><Tree rows={result.p} title="Student sequence p" color={colors.student} /></div>
    <Controls reset={() => setShift(0)}><Range label="Student first-logit shift" value={shift} min={-2} max={2} onChange={setShift} /></Controls>
    <Table label="Complete leaf events" headers={['completion', 'q', 'p', '−q log p']}
      rows={result.qLeaf.map((mass, index) => [['AA', 'AB', 'BA', 'BB'][index], mass, result.pLeaf[index], -mass * Math.log(result.pLeaf[index])])} />
    <p>Leaf sums q={fmt(sum(result.qLeaf))}, p={fmt(sum(result.pLeaf))}; sequence CE {fmt(result.ce)} nats.</p>
  </Figure>;
}
export function DistillSequenceSample() {
  const [uniform, setUniform] = useState(.5);
  const [count, setCount] = useState(20);
  const [seed, setSeed] = useState(731);
  const [greedy, setGreedy] = useState(false);
  const result = sequence();
  const selected = categorical(result.qLeaf, uniform);
  const sampled = sampleSequence(count, seed, result.qLeaf, result.pLeaf);
  const mode = result.qLeaf.indexOf(Math.max(...result.qLeaf));
  const counts = greedy ? result.qLeaf.map((_, j) => j === mode ? count : 0) : sampled.counts;
  const mean = greedy ? -Math.log(result.pLeaf[mode]) : sampled.mean;
  return <Figure id="D13" caption="The highlighted leaf is one CDF selection. The separate deterministic seeded stream estimates the teacher expectation. Repeating the most likely leaf estimates a different selected-text target; one finite sample is not guaranteed to improve monotonically as its count grows.">
    <Tree rows={result.q} title="Teacher distribution, with one selected leaf" selected={selected} />
    <Controls reset={() => { setUniform(.5); setCount(20); setSeed(731); setGreedy(false); }}>
      <Range label="One leaf's uniform" value={uniform} min={0} max={.999} step={.001} onChange={setUniform} />
      <Range label="Stream sample count" value={count} min={1} max={1000} step={1} onChange={setCount} />
      <Range label="Stream seed" value={seed} min={1} max={1000} step={1} onChange={setSeed} />
      <Check label="Repeat the maximum-probability leaf instead" checked={greedy} onChange={setGreedy} /></Controls>
    <Table label="Selected-text CE observations" headers={['leaf', 'stream count', 'student −log p']}
      rows={counts.map((value, j) => [['AA', 'AB', 'BA', 'BB'][j], value, -Math.log(result.pLeaf[j])])} />
    <p>One selected leaf loss: {fmt(-Math.log(result.pLeaf[selected]))}; stream mean {fmt(mean)}; exact teacher expectation {fmt(result.ce)} nats. Difference {fmt(mean - result.ce)}.</p>
  </Figure>;
}
export function DistillResponseMask() {
  const [length, setLength] = useState(3);
  const [collision, setCollision] = useState(true);
  const tokens = ['BOS', ...Array.from({ length: length - 1 }, (_, j) => `prompt${j}`), 'answer', 'EOS', 'PAD'];
  const ids = tokens.map((value, j) => value === 'EOS' ? 0 : value === 'PAD' ? collision ? 0 : 99 : j + 1);
  return <Figure id="D14" caption="Each prediction row is one position before its target. Validity comes from the true response boundary and length; an EOS ID that equals pad storage must remain a real supervised target.">
    <Scroll label="Causal input positions, predictor arrows and response target mask"><svg viewBox={`0 0 ${tokens.length * 90 + 100} 220`}
      style={{ minWidth: `${(tokens.length * 90 + 100) / 16}em` }} role="img" aria-label={`Prompt length ${length}; predictor ${length - 1} targets answer; predictor ${length} targets EOS; pad has no target loss`}>
      {tokens.map((token, index) => <g key={index}>
        <text x={70 + index * 90} y="25" textAnchor="middle">pos {index}</text>
        <rect x={32 + index * 90} y="45" width="76" height="35" fill="#252932" stroke={index < length ? colors.fixed : index < length + 2 ? colors.target : '#666'} />
        <text x={70 + index * 90} y="68" textAnchor="middle">{token}</text>
        <text x={70 + index * 90} y="104" textAnchor="middle">ID {ids[index]}</text>
        {index >= length && index < length + 2 && <path d={`M${70 + (index - 1) * 90} 117L${70 + index * 90} 165M${58 + index * 90} 163L${70 + index * 90} 165L${62 + index * 90} 155`} stroke={index === length ? colors.student : colors.target} fill="none" strokeWidth="2" />}
        <text x={70 + index * 90} y="188" textAnchor="middle" style={{ fill: index >= length && index < length + 2 ? colors.target : colors.fixed }}>{index >= length && index < length + 2 ? 'loss ✓' : 'loss ×'}</text>
      </g>)}
    </svg></Scroll>
    <Controls reset={() => { setLength(3); setCollision(true); }}>
      <Range label="Prompt positions (including BOS)" value={length} min={2} max={6} step={1} onChange={setLength} />
      <Check label="EOS and PAD share storage ID 0" checked={collision} onChange={setCollision} /></Controls>
    <p>Two valid targets: answer and EOS. First response predictor index = {length - 1}. Prompt-target and padding loss derivatives are zero; their contextual activations can still affect later predictions.</p>
  </Figure>;
}
export function DistillReduction() {
  const [length, setLength] = useState(4);
  const [repeat, setRepeat] = useState(false);
  const a = [.2, .4];
  const b = Array.from({ length }, (_, j) => 1 + j * .2);
  const rows = repeat ? [a, b, b] : [a, b];
  const total = sum(rows.map(row => sum(row)));
  const count = sum(rows.map(row => row.length));
  const mean = sum(rows.map(row => sum(row) / row.length)) / rows.length;
  return <Figure id="D15" caption="The visible cells are per-target losses in nats. Pooling gives every target equal weight; averaging row means gives every response equal weight. Duplicating a response changes its weight in both denominators.">
    {rows.map((row, j) => <div key={j}><p>Response {j + 1}</p><div className="distill-vector" style={{ '--role': j === 0 ? colors.teacher : colors.student }}>
      {row.map((value, index) => <span key={index}>{fmt(value)} nats</span>)}</div><Arrow>sum {fmt(sum(row))} ÷ {row.length} targets = {fmt(sum(row) / row.length)}</Arrow></div>)}
    <Controls reset={() => { setLength(4); setRepeat(false); }}>
      <Range label="Second response targets" value={length} min={2} max={8} step={1} onChange={setLength} />
      <Check label="Repeat the second response once" checked={repeat} onChange={setRepeat} /></Controls>
    <p>Pooled mean = {fmt(total)} nats / {count} targets = {fmt(total / count)} nats per target.</p>
    <p>Mean of response means = {fmt(mean)} nats per target. {length === 2 ? 'Equal lengths make the two reductions agree.' : 'The longer response receives more pooled weight.'}</p>
  </Figure>;
}
export function DistillPrefixWeights() {
  const [shift, setShift] = useState(0);
  const [source, setSource] = useState('student');
  const [direction, setDirection] = useState('forward');
  const result = sequence(shift);
  const weights = source === 'student' ? result.p[0] : result.q[0];
  const terms = result.p.slice(1).map((row, j) => direction === 'forward' ? kl(result.q[j + 1], row) : kl(row, result.q[j + 1]));
  return <Figure id="D16" caption="Who visits a prefix and which direction compares its next-token distributions are independent choices. The node areas below encode visitation mass, with exact numbers beside them.">
    <Scroll label="Teacher and student prefix visitation masses"><svg viewBox="0 0 500 210" className="distill-tree" role="img" aria-label={`${source} visitation weights ${vec(weights)}`}>
      <path d="M250 25L125 110M250 25L375 110" stroke={source === 'teacher' ? colors.teacher : colors.student} fill="none" />
      <text x="250" y="20" textAnchor="middle">same starting prefix</text>
      {weights.map((weight, j) => <g key={j}><circle cx={125 + j * 250} cy="112" r={48 * Math.sqrt(weight)} fill={j === 0 ? '#264762' : '#4d3d24'} stroke={colors.event[j]} />
        <text x={125 + j * 250} y="55" textAnchor="middle">prefix {j === 0 ? 'A' : 'B'}</text>
        <text x={125 + j * 250} y="181" textAnchor="middle">mass {fmt(weight)}</text></g>)}
    </svg></Scroll>
    <Controls reset={() => { setShift(0); setSource('student'); setDirection('forward'); }}>
      <Range label="Student first-logit shift" value={shift} min={-2} max={2} onChange={setShift} />
      <Select label="Prefix source" value={source} options={[['teacher', 'Teacher visited'], ['student', 'Student visited']]} onChange={setSource} />
      <Select label="Local divergence" value={direction} options={[['forward', 'KL(q ‖ p)'], ['reverse', 'KL(p ‖ q)']]} onChange={setDirection} /></Controls>
    <Table label="Conditional comparisons at visited states" headers={['prefix', 'weight', 'local divergence', 'weighted contribution']}
      rows={weights.map((weight, j) => [j === 0 ? 'A' : 'B', weight, terms[j], weight * terms[j]])} />
    <p>Expected second-position divergence = {fmt(sum(weights.map((weight, j) => weight * terms[j])))} nats. This local comparison keeps the selected visitation weights detached during its update.</p>
  </Figure>;
}
export function DistillVisitationGradient() {
  const [detach, setDetach] = useState(true);
  const [shift, setShift] = useState(0);
  const [equal, setEqual] = useState(false);
  const result = sequence(shift, equal);
  const gradient = detach ? result.detached : result.full;
  return <Figure id="D17" caption="Forward values do not change when a probability is detached. The missing derivative is through the probability of reaching the next prefix; the local next-token loss still differentiates its student logits.">
    <Scroll label="Reverse-KL computation graph with optional visitation derivative"><svg viewBox="0 0 620 300" style={{ minWidth: '38em' }} role="img" aria-label="Root logits produce prefix probabilities and a root KL; conditional logits produce two local KLs. Optional derivative through prefix probabilities contributes to the total loss gradient.">
      <g stroke={colors.student} fill="none" strokeWidth="2"><path d="M125 55V110M495 55V110M125 153V205H310V245M495 153V205H310M230 37H310V85M310 119V245" />
        <path d="M97 205V60" stroke={detach ? colors.fixed : colors.target} strokeDasharray={detach ? '4 5' : undefined} /></g>
      <g fill="#242831" stroke={colors.fixed}><rect x="20" y="20" width="210" height="35" /><rect x="390" y="20" width="210" height="35" />
        <rect x="20" y="110" width="210" height="43" /><rect x="390" y="110" width="210" height="43" /><rect x="260" y="85" width="100" height="34" /><rect x="190" y="245" width="240" height="35" /></g>
      <text x="125" y="43" textAnchor="middle">first-position logits</text><text x="495" y="43" textAnchor="middle">conditional logits</text>
      <text x="125" y="136" textAnchor="middle">prefix masses p(A), p(B)</text><text x="495" y="136" textAnchor="middle">local costs C(A), C(B)</text>
      <text x="310" y="107" textAnchor="middle">root KL</text>
      <text x="310" y="269" textAnchor="middle">root KL + Σ prefix mass × C</text>
      <text x="125" y="184" textAnchor="middle" className="distill-backed">{detach ? '× detached weight' : '← visitation derivative'}</text>
    </svg></Scroll>
    <Controls reset={() => { setDetach(true); setShift(0); setEqual(false); }}>
      <Check label="Detach prefix probability in backward" checked={detach} onChange={setDetach} />
      <Range label="First-logit shift" value={shift} min={-2} max={2} onChange={setShift} />
      <Check label="Match both continuation rows (zero costs)" checked={equal} onChange={setEqual} /></Controls>
    <Table label="Student logit derivatives" headers={['row', 'selected derivative', 'full minus detached']}
      rows={gradient.map((row, j) => [['first', 'after A', 'after B'][j], vec(row), vec(j === 0 ? result.visitation : [0, 0])])} />
    <p>Same forward reverse KL = {fmt(result.reverse)} nats. Future cost = {fmt(result.future)}; costs A/B = {vec(result.local.slice(1))}.</p>
  </Figure>;
}
export function DistillStudentPrefix() {
  const [prefix, setPrefix] = useState('B');
  const result = sequence();
  const index = prefix === 'A' ? 1 : 2;
  return <Figure id="D18" caption="After the student chooses a token, both models receive exactly that resulting prefix. Teacher feedback is a full next-token row at this state; no teacher-written continuation is secretly substituted for the student's prefix.">
    <div className="distill-vector" style={{ '--role': colors.student }}><span>original prompt</span><span>student token {prefix}</span><span>next position →</span></div>
    <Arrow>same literal prefix enters both decoders ↓</Arrow>
    <Pair><Bars title={`Teacher after ${prefix}`} values={result.q[index]} names={['next A', 'next B']} />
      <Bars title={`Student after ${prefix}`} values={result.p[index]} names={['next A', 'next B']} /></Pair>
    <Controls><Select label="Student's sampled first token" value={prefix} options={[['A', 'A'], ['B', 'B']]} onChange={setPrefix} /></Controls>
    <p>Local forward KL = {fmt(kl(result.q[index], result.p[index]))} nats. Feedback can teach this visited state even when it is less likely under the teacher; it does not guarantee a later correct answer.</p>
  </Figure>;
}
