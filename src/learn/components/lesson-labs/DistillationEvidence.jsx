import { useState } from 'react';
import { colors, sum, traceCheck, cost } from '../../data/distillation-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Bars, Pair, Arrow, fmt, vec, useEvidence, EvidenceState } from './DistillationShared.jsx';

export function DistillTrace() {
  const [intermediate, setIntermediate] = useState(6);
  const [product, setProduct] = useState(20);
  const [answer, setAnswer] = useState(20);
  const [malformed, setMalformed] = useState(false);
  const result = traceCheck(2, 3, 4, intermediate, product, answer);
  const rows = [[5, 20, 20], [intermediate, product, answer], [6, 24, 24]];
  return <Figure id="D19" caption="The independently calculated task answer is 20. Local step consistency asks a different question from that external answer check. The middle trace is editable; an absent integer causes structural rejection before semantic checks.">
    <p>Prompt: (2 + 3) × 4 → true sum 5 → true answer 20</p>
    {rows.map(([s, p, a], j) => <div key={j}>
      <p>{['Correct trace', 'Editable trace', 'Consistent with a wrong first step'][j]}</p>
      <div className="distill-vector" style={{ '--role': j === 1 ? colors.student : colors.fixed }}>
        <span>sum {j === 1 && malformed ? 'missing' : s}</span><span>× 4 → product {p}</span><span>copy → answer {a}</span><span>EOS</span>
      </div>
    </div>)}
    <Controls reset={() => { setIntermediate(6); setProduct(20); setAnswer(20); setMalformed(false); }}>
      <Range label="Reported sum" value={intermediate} min={0} max={10} step={1} onChange={setIntermediate} />
      <Range label="Reported product" value={product} min={0} max={40} step={1} onChange={setProduct} />
      <Range label="Reported final answer" value={answer} min={0} max={40} step={1} onChange={setAnswer} />
      <Check label="Omit the sum integer (malformed)" checked={malformed} onChange={setMalformed} /></Controls>
    <Table label="Editable trace checks" headers={['predicate', 'result']}
      rows={[
        ['Structure includes integer and EOS', !malformed ? 'pass' : 'fail'],
        ['Sum equals 2+3', !malformed && intermediate === 5 ? 'pass' : 'fail'],
        ['Product equals reported sum ×4', !malformed && product === intermediate * 4 ? 'pass' : 'fail'],
        ['Answer equals reported product', !malformed && answer === product ? 'pass' : 'fail'],
        ['Answer equals independent truth 20', !malformed && result.final ? 'pass' : 'fail'],
        ['All arithmetic steps correct', !malformed && result.steps ? 'pass' : 'fail'],
      ]} />
  </Figure>;
}
export function DistillFiltering() {
  const state = useEvidence();
  const [filter, setFilter] = useState('final_correct');
  const [chosen, setChosen] = useState('3:3:3/sample');
  if (!state.data) return <Figure id="D20" caption="Recorded candidate filtering"><EvidenceState state={state} /></Figure>;
  const rows = state.data.candidates;
  const accepted = rows.filter(row => filter === 'none' || filter !== 'empty' && row.check[filter]);
  const parents = new Set(accepted.map(row => row.parent_id));
  const selected = rows.find(row => row.id === chosen);
  const final = accepted.filter(row => row.check.final_correct).length;
  const steps = accepted.filter(row => row.check.all_steps_correct).length;
  return <Figure id="D20" caption="All 256 original candidates remain in the denominator and selector. Counts come from their frozen parser and independent arithmetic checks. Empty rejection is a constructed boundary applied to this same ledger.">
    <div className="distill-vector" style={{ '--role': colors.teacher }}><span>128 original parents</span><span>× 2 decoding routes</span><span>256 candidates</span></div>
    <Arrow>↓ selected predicate</Arrow>
    <Pair><Bars title="Retained / original candidates" values={[accepted.length, rows.length - accepted.length]} names={['retained', 'rejected']} maximum={256} />
      <Bars title="Retained parent coverage" values={[parents.size, 128 - parents.size]} names={['present', 'missing']} maximum={128} /></Pair>
    <Controls><Select label="Retention predicate" value={filter} options={[
      ['none', 'Keep every candidate'], ['structural', 'Valid structure + EOS'], ['final_correct', 'Correct final answer'],
      ['all_steps_correct', 'All steps correct'], ['empty', 'Reject all: boundary case']]} onChange={setFilter} />
      <Select label="Inspect an original candidate" value={chosen} options={rows.map(row => [row.id, row.id])} onChange={setChosen} /></Controls>
    <p>{selected.id}: <code>{selected.text}</code></p>
    <p>Structure {String(selected.check.structural)}; final {String(selected.check.final_correct)}; all steps {String(selected.check.all_steps_correct)}. Selected candidate {accepted.includes(selected) ? 'retained' : 'rejected'}.</p>
    <p>Accepted final precision {accepted.length ? `${final}/${accepted.length} = ${fmt(final / accepted.length)}` : 'undefined (0 accepted)'}; accepted full-step precision {accepted.length ? `${steps}/${accepted.length} = ${fmt(steps / accepted.length)}` : 'undefined (0 accepted)'}.</p>
  </Figure>;
}
export function DistillR1Recipe() {
  const bases = ['Qwen2.5-Math-1.5B', 'Qwen2.5-Math-7B', 'Qwen2.5-14B', 'Qwen2.5-32B', 'Llama-3.1-8B', 'Llama-3.3-70B-Instruct'];
  return <Figure id="D21" caption="Published R1 paper v2 recipe, 4 January 2026: selected text enters six independent SFT routes. Upstream teacher RL is distinct from these released student routes. Approximate mixture counts and the exact Table 5 total are labelled separately.">
    <Pair><div><p style={{ color: colors.teacher }}>Reasoning: approximately 600,000</p>
      <div className="distill-vector" style={{ '--role': colors.teacher }}><span>teacher-generated reasoning text</span><span>rule checks / V3 judgment</span></div></div>
      <div><p style={{ color: colors.target }}>Other tasks: approximately 200,000</p>
        <div className="distill-vector" style={{ '--role': colors.target }}><span>reused V3 supervised data</span><span>generated responses</span></div></div></Pair>
    <Arrow>↓ selected text mixture: exact Table 5 total 804,745 ↓</Arrow>
    <Scroll label="Six separate dense student SFT destinations"><svg viewBox="0 0 670 360" style={{ minWidth: '42em' }} role="img" aria-label="One selected text corpus fans out to six separate SFT student bases">
      <path d="M335 15V40H30V310" stroke={colors.teacher} fill="none" strokeWidth="2" />
      {bases.map((base, j) => <g key={base}>
        <path d={`M30 ${65 + j * 48}H125`} stroke={colors.student} strokeWidth="2" />
        <text x="75" y={57 + j * 48} textAnchor="middle">SFT →</text>
        <rect x="130" y={43 + j * 48} width="505" height="34" stroke={colors.student} fill="#252932" />
        <text x="150" y={66 + j * 48}>{base}</text>
      </g>)}
    </svg></Scroll>
    <p>Each route: SFT only, 2–3 epochs, context 32,768, batch size 64. The published 32B comparison supports its stated experiment; it is not a universal result for every small model.</p>
  </Figure>;
}
export function DistillExperiment() {
  const state = useEvidence();
  const [family, setFamily] = useState('1:3');
  if (!state.data) return <Figure id="D22" caption="Recorded family split"><EvidenceState state={state} /></Figure>;
  const families = ['train', 'dev', 'test'].flatMap(split => [...new Set(state.data.records[split].map(row => row.family))].map(id => ({ id, split })));
  const selected = families.find(row => row.id === family);
  const color = split => split === 'train' ? colors.teacher : split === 'dev' ? colors.student : colors.target;
  const records = state.data.records[selected.split].filter(row => row.family === family);
  return <Figure id="D22" caption="The 45 unordered (a,b) families were split before fitting; all four training-range c variants stay together. Selecting a family only inspects its frozen assignment. Shift cases use c=5,6 for the same held-out test families.">
    <div className="distill-family-grid">{families.map(row => <button type="button" key={row.id} onClick={() => setFamily(row.id)}
      style={{ '--role': color(row.split), outline: family === row.id ? '2px solid white' : undefined }} aria-pressed={family === row.id}>{row.id}<small>{row.split}</small></button>)}</div>
    <Controls><Select label="Inspect family a:b" value={family} options={families.map(row => [row.id, `${row.id} — ${row.split}`])} onChange={setFamily} /></Controls>
    <div className="distill-vector" style={{ '--role': color(selected.split) }}>{records.map(row => <span key={row.id}>{row.id} → answer {row.answer}</span>)}</div>
    <Arrow>Train families → teacher fit → development selection → frozen teacher</Arrow>
    <Arrow color={colors.teacher}>once-generated training corpus → 5 arms × 3 seeds → development selection</Arrow>
    <Arrow color={colors.target}>all 15 terminal outcomes → selection seal → test + shift once</Arrow>
    <p>Selected family {family}: {selected.split}. Counts: 32 train families / 6 development / 7 test; 128 / 24 / 28 records.</p>
  </Figure>;
}
export function DistillSavedTargets() {
  const state = useEvidence();
  const [chosen, setChosen] = useState('3:3:3/sample');
  const [position, setPosition] = useState(1);
  const [event, setEvent] = useState(9);
  if (!state.data) return <Figure id="D23" caption="Actual saved teacher targets"><EvidenceState state={state} /></Figure>;
  const example = state.data.examples.find(row => row.id === chosen);
  const probabilities = example.log_probs[position].map(Math.exp);
  const top = probabilities.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value).slice(0, 6);
  const remainder = sum(probabilities) - sum(top.map(row => row.value));
  const vocabulary = state.data.vocabulary;
  return <Figure id="D23" caption="All text and next-token probabilities here are from the frozen neural teacher's original candidate ledger. The five inspectable examples include all four defective samples and one ordinary correct greedy trace. No teacher is rerun in the browser.">
    <p>Prompt ({example.record.a}+{example.record.b})×{example.record.c}; candidate {example.id}</p>
    <div className="distill-vector" style={{ '--role': colors.teacher }}>{example.ids.map((id, j) =>
      <span key={j} style={{ outline: position === j ? '2px solid white' : undefined }}>{j}: {vocabulary[id]}</span>)}</div>
    <Controls><Select label="Recorded candidate" value={chosen} options={state.data.examples.map(row => [row.id, row.id])} onChange={setChosen} />
      <Range label="Target position" value={position} min={0} max={8} step={1} onChange={setPosition} />
      <Select label="Inspect any vocabulary event" value={String(event)} options={vocabulary.map((word, j) => [String(j), `${j}: ${word}`])} onChange={value => setEvent(Number(value))} /></Controls>
    <Bars title={`Saved q at predictor position ${example.record.prompt_ids.length - 1 + position}: six largest masses plus all others`}
      values={[...top.map(row => row.value), remainder]} names={[...top.map(row => `${row.index}: ${vocabulary[row.index]}`), 'remaining 115 events']}
      identities={false} color={colors.teacher} />
    <p>Event {event} ({vocabulary[event]}): probability {fmt(probabilities[event], 9)}; log probability {fmt(example.log_probs[position][event])}. Full mass sum {fmt(sum(probabilities), 7)}.</p>
    <Table label="Different supervision from the same candidate" headers={['arm', 'target or retention']}
      rows={[
        ['hard', example.check.structural ? example.text : 'Excluded: malformed structure'],
        ['soft', example.check.structural ? 'All 121 probabilities at each retained target prefix' : 'Excluded: malformed structure'],
        ['answer only', example.check.structural ? `${example.check.answer} <eos>` : 'Excluded: no parsed answer'],
        ['verified', example.check.all_steps_correct ? 'Keep all nine target tokens' : 'Reject: not all arithmetic steps correct'],
      ]} />
  </Figure>;
}
export function DistillLayerCopy() {
  const embedding = 50304 * 128;
  const block = (14067712 - 2 * embedding - 256) / 6;
  return <Figure id="D24" caption="Base blocks 0,2,4 initialize the three-block student; the fine-tuned teacher is a distinct frozen model. Both embeddings and the untied vocabulary head retain their full width and vocabulary. Cache addresses are renumbered 0,1,2 without changing copied tensors.">
    <Scroll label="Six base blocks and three copied student blocks"><svg viewBox="0 0 600 385" style={{ minWidth: '37em' }} role="img" aria-label="Base layers zero, two and four map into student cache slots zero, one and two">
      <text x="140" y="25" textAnchor="middle">Pretrained base</text><text x="455" y="25" textAnchor="middle">Student</text>
      {[0, 1, 2, 3, 4, 5].map(index => <g key={index}><rect x="50" y={47 + index * 49} width="180" height="32" fill="#242831" stroke={index % 2 ? colors.fixed : colors.teacher} />
        <text x="140" y={69 + index * 49} textAnchor="middle">block {index}</text>
        {index % 2 === 0 && <><path d={`M230 ${63 + index * 49}L365 ${87 + index / 2 * 98}`} stroke={colors.student} fill="none" strokeWidth="2" />
          <rect x="365" y={71 + index / 2 * 98} width="180" height="32" fill="#242831" stroke={colors.student} />
          <text x="455" y={93 + index / 2 * 98} textAnchor="middle">cache layer {index / 2}</text></>}
      </g>)}
      <text x="300" y="367" textAnchor="middle">All hidden states: width 128 → vocabulary size 50,304</text>
    </svg></Scroll>
    <Table label="Actual parameter accounting" headers={['parameter part', 'teacher count', 'student count']}
      rows={[
        ['Input embeddings', embedding, embedding], ['Untied output head', embedding, embedding],
        ['Decoder blocks', 6 * block, 3 * block], ['Final normalization', 256, 256],
        ['Total', 14067712, 13472896],
      ]} />
    <p>Reduction {(100 * (14067712 - 13472896) / 14067712).toFixed(2)}%; half the blocks retain approximately 95.77% of these parameters.</p>
  </Figure>;
}
export function DistillChunks() {
  const [batch, setBatch] = useState(2);
  const [length, setLength] = useState(5);
  const [chunk, setChunk] = useState(4);
  const valid = batch * (length - 2);
  const chunks = Array.from({ length: Math.ceil(valid / chunk) }, (_, j) => Math.min(chunk, valid - j * chunk));
  return <Figure id="D25" caption="Constructed dimensions expose memory structure. Each batch row has two non-target positions and L−2 valid targets. Packing valid positions preserves their event rows; the tail chunk's unused rows are masked. The native evidence separately checks full-model loss and gradients.">
    <p>Full logical logits: teacher and student each B × L × V, V=50,304</p>
    <div className="distill-token-grid" style={{ gridTemplateColumns: `repeat(${length}, minmax(3rem, 1fr))` }}>
      {Array.from({ length: batch * length }, (_, j) => <span key={j} style={{ '--role': j % length < 2 ? colors.fixed : colors.student }}>{Math.floor(j / length)},{j % length}<small>{j % length < 2 ? 'masked' : 'valid'}</small></span>)}</div>
    <Arrow>pack {valid} valid rows → vocabulary projection in chunks ↓</Arrow>
    <div className="distill-chunks">{chunks.map((size, j) => <div key={j}><p>chunk {j}: {size} valid × V</p>
      <div className="distill-vector" style={{ '--role': colors.teacher }}>{Array.from({ length: chunk }, (_, k) => <span key={k}>{k < size ? `b${Math.floor((j * chunk + k) / (length - 2))},t${2 + (j * chunk + k) % (length - 2)}` : 'tail mask'}</span>)}</div></div>)}</div>
    <Controls reset={() => { setBatch(2); setLength(5); setChunk(4); }}>
      <Range label="Batch B" value={batch} min={1} max={4} step={1} onChange={setBatch} />
      <Range label="Positions L" value={length} min={3} max={8} step={1} onChange={setLength} />
      <Range label="Chunk capacity C" value={chunk} min={1} max={8} step={1} onChange={setChunk} /></Controls>
    <p>Two full logit arrays: {2 * batch * length * 50304} scalar entries. Two capacity-C logit arrays: {2 * chunk * 50304}. Final chunk has {chunks.at(-1)} valid rows; padded tail {chunk - chunks.at(-1)}. Other model activations and backward storage are separate costs.</p>
  </Figure>;
}
const armColors = { gold: colors.fixed, hard: colors.teacher, soft: colors.student, answer: colors.target, verified: '#71d8d0' };
export function DistillOutcomes() {
  const state = useEvidence();
  const [split, setSplit] = useState('test');
  const [metric, setMetric] = useState('correct');
  if (!state.data) return <Figure id="D26" caption="All frozen arithmetic outcomes"><EvidenceState state={state} /></Figure>;
  const teacher = state.data.teacher[split];
  const maximum = metric === 'reference_nll' ? Math.max(teacher.reference_nll, ...state.data.students.map(row => row.results[split].reference_nll)) * 1.05 : teacher.records;
  const teacherValue = teacher[metric];
  return <Figure id="D26" caption="All fifteen selected outcomes remain visible, including selected step-zero models and invalid generations. A correct-count or invalid-count dot uses the same split denominator; NLL is separately measured on the reference format.">
    <Scroll label="All fifteen method and seed outcomes"><svg viewBox="0 0 650 625" style={{ minWidth: '40em' }} role="img" aria-label={`All method and seed results for ${split}, ${metric}; teacher vertical reference shown`}>
      <path d={`M${180 + 400 * teacherValue / maximum} 20V565`} stroke={colors.teacher} strokeDasharray="4 4" />
      {state.data.students.map((row, j) => <g key={`${row.arm}-${row.seed}`}>
        <text x="166" y={42 + j * 34} textAnchor="end" style={{ fill: armColors[row.arm] }}>{row.arm} {row.seed}</text>
        <path d={`M180 ${37 + j * 34}H580`} stroke="#353943" />
        <circle cx={180 + 400 * row.results[split][metric] / maximum} cy={37 + j * 34} r="5" fill={armColors[row.arm]} />
        <text x="600" y={42 + j * 34}>{fmt(row.results[split][metric], 2)}</text>
      </g>)}
      <text x="180" y="580">0</text><text x="580" y="580" textAnchor="end">{fmt(maximum, 2)}</text>
      <text x="370" y="612" textAnchor="middle">{metric === 'reference_nll' ? 'reference NLL, nats per target' : `${metric} / ${teacher.records} records`}</text>
    </svg></Scroll>
    <Controls><Select label="Held-out split" value={split} options={[['test', 'Test: 28 records'], ['shift', 'Shift: 14 records']]} onChange={setSplit} />
      <Select label="Recorded metric" value={metric} options={[['correct', 'Correct final answers'], ['invalid', 'Invalid outputs'], ['reference_nll', 'Reference NLL']]} onChange={setMetric} /></Controls>
    <p>Teacher reference: {fmt(teacherValue)} {metric === 'reference_nll' ? 'nats per target' : `/ ${teacher.records}`}. No interpolation or new checkpoint selection.</p>
    <Table label="All selected models and denominators" headers={['arm / seed', 'selected step', 'correct / records', 'invalid', 'NLL']}
      rows={state.data.students.map(row => [row.arm + ' / ' + row.seed, row.selected_step, `${row.results[split].correct}/${row.results[split].records}`, row.results[split].invalid, row.results[split].reference_nll])} />
  </Figure>;
}
export function DistillCosts() {
  const [queries, setQueries] = useState(3000);
  const [upfront, setUpfront] = useState(60);
  const [student, setStudent] = useState(.01);
  const result = cost(queries, upfront, .03, student);
  return <Figure id="D27" caption="The cost bars are a constructed scenario in consistent abstract cost units. Recorded generation and training token counts below are observations, not the scenario's prices and not measured serving speedups.">
    <Bars title="Constructed total cost" values={[result.teacher, result.student]} names={['Teacher on every query', 'Upfront transfer + student queries']}
      maximum={Math.max(result.teacher, result.student, 1)} />
    <Controls reset={() => { setQueries(3000); setUpfront(60); setStudent(.01); }}>
      <Range label="Deployment queries N" value={queries} min={0} max={10000} step={100} onChange={setQueries} />
      <Range label="Upfront cost" value={upfront} min={0} max={200} step={10} onChange={setUpfront} />
      <Range label="Student cost / query" value={student} min={.005} max={.04} step={.005} onChange={setStudent} /></Controls>
    <p>Teacher price = .03/query. Equal-cost query count = {result.breakEven == null ? 'no positive-cost saving threshold: student is not cheaper per query' : fmt(result.breakEven)}. Quality requirements must still be met.</p>
    <Table label="Actual arithmetic campaign work" headers={['stage', 'observed quantity']}
      rows={[
        ['Teacher fitting', '1,200 updates; 19,200 examples; 172,800 target tokens'],
        ['Once-generated corpus', '256 candidates; 2,304 generated tokens; 255 structural; 252 all-step correct'],
        ['Each gold/hard/soft student', '600 updates; 9,563 examples; 86,067 targets'],
        ['Each answer-only student', '600 updates; 9,563 examples; 19,126 targets'],
        ['Each verified student', '600 updates; 9,452 examples; 85,068 targets'],
      ]} />
  </Figure>;
}
export function DistillRoute() {
  const [vectors, setVectors] = useState(true);
  const [same, setSame] = useState(true);
  const [studentPrefix, setStudentPrefix] = useState(false);
  const direct = vectors && same;
  return <Figure id="D28" caption="Choose the available supervision signal before naming an objective. Literal text can be retokenized; direct per-token KL needs corresponding vocabulary events. Student-prefix feedback additionally needs a teacher that can be queried at those states.">
    <Scroll label="Transfer objective decision graph"><svg viewBox="0 0 640 295" style={{ minWidth: '40em' }} role="img" aria-label="Full vector access and shared events lead to direct distribution loss; otherwise literal text leads to retokenized response cross-entropy">
      <path d="M320 48V86M320 126L155 180M320 126L485 180" stroke={colors.fixed} fill="none" strokeWidth="2" />
      <rect x="175" y="15" width="290" height="35" fill="#252932" stroke={colors.teacher} />
      <text x="320" y="39" textAnchor="middle">Teacher information available</text>
      <path d="M320 71L450 107L320 143L190 107Z" fill="#252932" stroke={colors.teacher} />
      <text x="320" y="101" textAnchor="middle">full vectors?</text>
      <text x="320" y="119" textAnchor="middle">same events?</text>
      <rect x="35" y="180" width="240" height="48" fill="#252932" stroke={direct ? colors.student : colors.fixed} strokeWidth={direct ? 3 : 1} />
      <rect x="365" y="180" width="240" height="48" fill="#252932" stroke={!direct ? colors.target : colors.fixed} strokeWidth={!direct ? 3 : 1} />
      <text x="155" y="170" textAnchor="middle">yes</text><text x="485" y="170" textAnchor="middle">no</text>
      <text x="155" y="209" textAnchor="middle">distribution KL / JSD</text><text x="485" y="209" textAnchor="middle">text → tokenize → CE</text>
      <text x="320" y="270" textAnchor="middle">Target quality and independent task evaluation remain separate.</text>
    </svg></Scroll>
    <Controls><Check label="Teacher exposes full vocabulary vectors" checked={vectors} onChange={setVectors} />
      <Check label="Teacher/student events correspond" checked={same} onChange={setSame} />
      <Check label="Use prefixes sampled from the student" checked={studentPrefix} onChange={setStudentPrefix} /></Controls>
    <p>{direct ? `Direct soft loss is available at ${studentPrefix ? 'student-visited' : 'teacher/data'} prefixes. ${studentPrefix ? 'Query the teacher at each visited prefix; sampling remains detached in ordinary local imitation.' : 'The fixed target path defines the visited prefixes.'}`
      : 'Direct per-token KL is blocked. With literal teacher completions, retokenize each complete response and use response-only CE.'}</p>
  </Figure>;
}
