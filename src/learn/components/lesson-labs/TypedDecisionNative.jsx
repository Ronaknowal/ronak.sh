import { useState } from 'react';
import { argmax, candidateColors as colors, intentNames, softmaxTrace } from '../../data/typed-decision-models.js';
import { Arrow, Bars, Check, Controls, EvidenceState, Figure, fmt, Matrix, Pair, Plot, Range,
  Scroll, Select, Table, Tensor, useObservations } from './TypedDecisionShared.jsx';

const questionNames = ['intent', 'urgency', 'refund'];
function answerText(answer) {
  return answer.type === 'choice' ? answer.choice : answer.type === 'score' ? `expected index ${answer.score}` : `P(true) = ${answer.noul}`;
}
function nativeProbability(answer) {
  return answer.probabilities ? Object.values(answer.probabilities) : [1 - answer.noul, answer.noul];
}
function nativeNames(answer) {
  return answer.probabilities ? Object.keys(answer.probabilities) : ['false', 'true'];
}

export function DecisionNativeArchitecture() {
  const state = useObservations();
  const [question, setQuestion] = useState('intent');
  if (!state.data) return <Figure id="D30" caption="Recorded native checkpoint interface"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const index = questionNames.indexOf(question);
  const answer = data.typed.native[0].answers[question];
  const logits = data.typed.raw_logits[index];
  const temperature = question === 'intent' ? data.nativeRuntime.native_temperature_by_options['choice:6-10']
    : question === 'urgency' ? data.nativeRuntime.native_temperature_by_options['score:3-5'] : data.nativeRuntime.native_temperature_by_options['noul:2'];
  return <Figure id="D30" caption="Pinned English Laya, ModernBERT width 1024 plus two head Transformer layers and a shared scalar scorer. The receipt stores raw rows and batch shapes, not all encoded token IDs. Native rounded output and external full-precision calibration are distinct branches.">
    <p>Recorded state: {data.typed.states[0].state}</p><p>Question: {data.typed.questions[question].instructions}</p>
    <Tensor rows={6} columns={131} label="Actual full typed batch token tensor" color={colors[0]} />
    <Arrow>token / position representation → ModernBERT width 1024</Arrow>
    <div className="typed-residual"><div className="typed-residual-rail" /><div className="typed-block"><p>Contextual backbone → head Transformer layer 1 → head Transformer layer 2</p>
      <Tensor rows={logits.length} columns={1024} label="Gather candidate marker states" rowColors={colors} /></div></div>
    <Arrow>Shared scoring network → {logits.length} raw logits</Arrow>
    <Matrix label="Recorded raw logit row" values={[logits]} rowNames={[question]} colNames={nativeNames(answer)} signed />
    <Pair><div><Arrow>native bucket T = {fmt(temperature, 7)} → rounding</Arrow><Bars title="Native returned probabilities" values={nativeProbability(answer)} names={nativeNames(answer)} />
      <p>{answerText(answer)}. Returned confidence = {answer.confidence}; answer confidence = {answer.answer_confidence}.</p></div>
      <div><Arrow>separate external postprocessor</Arrow><p>For the six-intent evaluation only: T = {fmt(data.calibration.methods.laya.temperature, 6)} fitted on 120 calibration rows. This was not installed into Agent.</p>
        {question === 'intent' && <Bars title="Full-precision external probability calculation" values={softmaxTrace(logits, undefined, data.calibration.methods.laya.temperature).probabilities} names={nativeNames(answer)} />}</div></Pair>
    <Controls reset={() => setQuestion('intent')}><Select label="Recorded question type" value={question} options={questionNames.map(x => [x, x])} onChange={setQuestion} /></Controls>
  </Figure>;
}

export function DecisionNativeBatch() {
  const state = useObservations();
  const [selected, setSelected] = useState(0);
  if (!state.data) return <Figure id="D31" caption="Actual six-row typed batch"><EvidenceState state={state} /></Figure>;
  const data = state.data.typed;
  const event = data.forward_events[0];
  const s = Math.floor(selected / 3);
  const q = questionNames[selected % 3];
  const answer = data.native[s].answers[q];
  return <Figure id="D31" caption="Two input states × three questions become six encoder rows in one recorded forward call. Candidate widths differ; answers are grouped back under original state and question IDs. Multiple questions still consume separate rows.">
    <Matrix label={`Actual candidate mask, marker tensor ${event.marker_shape.join(' × ')}`} values={event.widths.map(width => Array.from({ length: 6 }, (_, j) => Number(j < width)))}
      rowNames={event.widths.map((_, i) => `state${Math.floor(i / 3)} / ${questionNames[i % 3]}`)} colNames={Array.from({ length: 6 }, (_, i) => `slot${i}`)} selected={selected} />
    <Arrow>row {selected} → state {s} → question {q}</Arrow>
    <p>{data.states[s].state}</p><Bars title="Actual native returned row" values={nativeProbability(answer)} names={nativeNames(answer)} />
    <p>{answerText(answer)}. Full input shape {event.input_shape.join(' × ')}; gradient recording {String(event.grad_enabled)}.</p>
    <Controls reset={() => setSelected(0)}><Select label="Inspect restored answer" value={selected} options={event.widths.map((_, i) => [i, `state ${Math.floor(i / 3)} / ${questionNames[i % 3]}`])} onChange={x => setSelected(Number(x))} /></Controls>
  </Figure>;
}

export function DecisionNativeCost() {
  const state = useObservations();
  const [batch, setBatch] = useState('1');
  if (!state.data) return <Figure id="D32" caption="Measured local CPU costs"><EvidenceState state={state} /></Figure>;
  const data = state.data.nativeRuntime;
  const row = data.warm[batch];
  return <Figure id="D32" caption="Actual local end-to-end calls on the shared CPU host. Download time is excluded. RSS is one after-run snapshot, not peak allocation. Cold loading and warm calls have separate scales; this is not a vendor comparison.">
    <Bars title="Cold stages, seconds" values={[data.cold_load_seconds, data.first_batch4_seconds]} names={['checkpoint loading', 'first batch of 4']} max={60} />
    <Plot series={[{ name: `warm batch ${batch}`, values: row.seconds.map((x, i) => [i + 1, x]) }]} points xLabel="recorded call" yLabel="end-to-end seconds" xDomain={[1, row.seconds.length]} />
    <p>N={row.n}; median {fmt(row.median_seconds)}s; p95 {fmt(row.p95_seconds)}s; {fmt(row.examples_per_second)} examples/s.</p>
    <Table caption="Measured workload" headers={['Field', 'Value']} rows={[
      ['Parameters', data.parameters], ['Threads', data.threads], ['dtype / backend', `${data.dtype} / ${data.backend}`],
      ['RSS after run', `${data.rss_after_bytes.toLocaleString()} bytes`], ['Processor', data.hardware.processor], ['Platform', data.hardware.platform],
    ]} />
    <Controls reset={() => setBatch('1')}><Select label="Warm call workload" value={batch} options={[['1', 'one example per call'], ['4', 'four examples per call']]} onChange={setBatch} /></Controls>
  </Figure>;
}

function alignedShift(data, index, native) {
  const row = data.shifts.rows[index];
  const parentIndex = data.test.findIndex(item => item.id === row.parent_id);
  const parent = data.test[parentIndex];
  const base = data.calibration.methods[native ? 'laya' : 'seed-17'].test_calibrated.probabilities[parentIndex];
  const changed = native ? softmaxTrace(data.nativeShifts[index].raw_logits[0], undefined, data.calibration.methods.laya.temperature).probabilities
    : data.replay['seed-17'].shifts[index].probabilities;
  const identity = option => row.identity_map?.[option.id] || option.id;
  const aligned = parent.options.map(option => changed[row.options.findIndex(other => identity(other) === option.id)]);
  return { row, parent, base, aligned, delta: aligned.map((x, i) => x - base[i]) };
}
export function DecisionSchemaShift() {
  const state = useObservations();
  const [index, setIndex] = useState(0);
  const [native, setNative] = useState(false);
  if (!state.data) return <Figure id="D33" caption="Saved controlled schema changes"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const eligible = data.shifts.rows.map((row, i) => [row, i]).filter(([row]) => ['reverse', 'paraphrase', 'rename-ids'].includes(row.intervention));
  const result = alignedShift(data, index, native);
  const maximum = Math.max(.001, ...result.delta.map(Math.abs));
  return <Figure id="D33" caption="Rows are real saved model outputs, aligned back to original event identities. Positive-temperature arithmetic uses the original external T diagnostically; a changed schema has not been recalibrated. Scratch IDs are outside encoded text; native IDs are inside it.">
    <p>{result.row.id}: {native ? 'native Laya' : 'scratch seed-17'} · {result.row.intervention}</p>
    <Table caption="Identity correspondence through the change" headers={['Original ID', 'Changed slot', 'Changed ID']} rows={result.parent.options.map(option => {
      const slot = result.row.options.findIndex(x => (result.row.identity_map?.[x.id] || x.id) === option.id);
      return [option.id, slot, result.row.options[slot].id];
    })} />
    <Pair><Bars title="Original probabilities" values={result.base} names={intentNames} /><Bars title="Changed, aligned probabilities" values={result.aligned} names={intentNames} /></Pair>
    <Scroll label="Signed probability changes around zero"><svg viewBox="0 0 510 310" style={{ width: '32rem' }} role="img" aria-label="Probability deltas relative to original schema">
      <path d="M260 10V270" stroke="#ddd" />{result.delta.map((value, i) => <g key={i}>
        <text x="10" y={19 + 44 * i}>{String.fromCharCode(65 + i)}</text>
        <text x="490" y={19 + 44 * i} textAnchor="end">{fmt(value, 6)}</text>
        <rect x={value < 0 ? 260 + value / maximum * 185 : 260} y={25 + 44 * i} width={Math.abs(value) / maximum * 185} height="12" fill={colors[i]} /></g>)}
      <text x="75" y="297">−{fmt(maximum)}</text><text x="260" y="297" textAnchor="middle">0</text><text x="445" y="297" textAnchor="end">+{fmt(maximum)}</text>
    </svg></Scroll>
    <Controls reset={() => { setIndex(0); setNative(false); }}><Select label="Recorded schema intervention" value={index} options={eligible.map(([row, i]) => [i, row.id])} onChange={x => setIndex(Number(x))} /><Check label="Inspect native checkpoint instead" checked={native} onChange={setNative} /></Controls>
  </Figure>;
}

export function DecisionTokenBudget() {
  const state = useObservations();
  const [end, setEnd] = useState(false);
  const [budget, setBudget] = useState(512);
  if (!state.data) return <Figure id="D34" caption="Actual long-input truncation records"><EvidenceState state={state} /></Figure>;
  const index = end ? 19 : 18;
  const data = state.data;
  const row = data.shifts.rows[index];
  const observed = data.nativeShifts[index];
  const usage = observed.native[0].usage;
  const kept = usage.state_tokens - usage.state_tokens_dropped;
  const overhead = usage.input_tokens - kept;
  const hypotheticalKept = Math.max(0, Math.min(usage.state_tokens, budget - overhead));
  return <Figure id="D34" caption="The actual native record uses a 512-token input cap. The lower ruler is a constructed count-only budget calculation with observed non-state overhead held fixed; moving it does not produce another model prediction or retokenize text.">
    <p>{row.intervention}. Actual state tokens {usage.state_tokens}; kept {kept}; dropped {usage.state_tokens_dropped}; non-state tokens {overhead}.</p>
    <div className="typed-budget"><i style={{ width: `${100 * kept / usage.state_tokens}%`, background: colors[4] }} /><i style={{ width: `${100 * usage.state_tokens_dropped / usage.state_tokens}%`, background: '#66616c' }} /></div>
    <div className="typed-key"><span style={{ color: colors[4] }}>kept state prefix</span><span>discarded suffix</span></div>
    <p>Beginning: “{row.state.slice(0, 145)}…”</p><p>Ending: “…{row.state.slice(-145)}”</p>
    <p>Recorded answer: {observed.native[0].answers.intent.choice}. Truncated: {String(usage.truncated)}; affected question: {usage.truncated_questions.join(', ')}.</p>
    <p>Constructed total budget {budget}: {hypotheticalKept} state tokens retained if the observed {overhead}-token overhead stays fixed.</p>
    <div className="typed-budget"><i style={{ width: `${100 * hypotheticalKept / usage.state_tokens}%`, background: colors[0] }} /><i style={{ width: `${100 * (usage.state_tokens - hypotheticalKept) / usage.state_tokens}%`, background: '#444852' }} /></div>
    <Controls reset={() => { setEnd(false); setBudget(512); }}><Check label="Put actual clue at the end" checked={end} onChange={setEnd} /><Range label="Constructed total budget" value={budget} min={128} max={1152} step={32} onChange={setBudget} /></Controls>
  </Figure>;
}

export function DecisionShiftEvidence() {
  const state = useObservations();
  const [index, setIndex] = useState(16);
  const [seed, setSeed] = useState('seed-17');
  if (!state.data) return <Figure id="D35" caption="All controlled shift observations"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const row = data.shifts.rows[index];
  const scratch = data.replay[seed].shifts[index];
  const native = data.nativeShifts[index].native[0].answers.intent;
  const originalIds = ["card_arrival", "card_delivery_estimate", "card_linking", "card_not_working", "lost_or_stolen_card", "card_payment_not_recognised"];
  const identityColor = id => colors[originalIds.indexOf(row.identity_map?.[id] || id)] || "#a8aab2";
  return <Figure id="D35" caption="All 24 prespecified interventions remain inspectable. Colours follow original event identities through reordering, omission and ID renaming; extra distractors are grey. These individual cases do not estimate population robustness. A missing correct candidate forces a choice among wrong options; schema validity cannot detect the omitted event.">
    <Table caption="Recorded interventions" headers={['Index', 'Intervention', 'Scratch status', 'Native choice']} rows={data.shifts.rows.map((r, i) => [i, r.intervention, data.replay[seed].shifts[i].status, data.nativeShifts[i].native[0].answers.intent.choice])} />
    <p><strong>{row.id}</strong>: {row.state.length > 400 ? `${row.state.slice(0, 180)} … ${row.state.slice(-100)}` : row.state}</p>
    {row.english_meaning && <p>Provided English meaning: {row.english_meaning}</p>}
    <p>Correct candidate slot: {row.target == null ? 'absent from the supplied set' : row.target}.</p>
    <Pair><div>{scratch.status === 'rejected' ? <p>Scratch rejected: {scratch.reason}</p>
      : <><Bars title={`${seed} recorded probabilities`} values={scratch.probabilities} names={row.options.map(x => x.id)} colors={row.options.map(x => identityColor(x.id))} /><p>Selected {row.options[argmax(scratch.probabilities)].id}</p></>}</div>
      <div><Bars title="Native rounded probabilities" values={Object.values(native.probabilities)} names={Object.keys(native.probabilities)} colors={Object.keys(native.probabilities).map(identityColor)} /><p>Selected {native.choice}.{row.intervention === 'hindi' && ' English checkpoint; Hindi behavior is not a multilingual competence claim.'}</p></div></Pair>
    <Controls reset={() => { setIndex(16); setSeed('seed-17'); }}><Select label="Prespecified intervention" value={index} options={data.shifts.rows.map((r, i) => [i, `${i}: ${r.id}`])} onChange={x => setIndex(Number(x))} /><Select label="Scratch seed" value={seed} options={['seed-17', 'seed-29', 'seed-43'].map(x => [x, x])} onChange={setSeed} /></Controls>
  </Figure>;
}

export function DecisionArtifact() {
  const state = useObservations();
  const [change, setChange] = useState('none');
  if (!state.data) return <Figure id="D36" caption="Saved artifact dependencies and replay"><EvidenceState state={state} /></Figure>;
  const data = state.data;
  const artifact = data.artifact.payload;
  const items = [['checkpoint', 85, 45], ['tokenizer', 250, 45], ['candidate schema', 455, 45], ['cached raw logits', 250, 145], ['external T', 100, 245], ['cost policy', 460, 245], ['decision output', 280, 355]];
  const marked = change === 'description' ? [2, 3, 4, 6] : change === 'cost' ? [5, 6] : [];
  return <Figure id="D36" caption="The package binds the pipeline's dependencies, not just weights. Changing a description invalidates the requested schema and downstream calibration; changing costs changes the decision policy without retraining weights. These are dependency demonstrations, not new model runs.">
    <Scroll label="Artifact dependency graph"><svg viewBox="0 0 570 395" style={{ width: '35.625rem' }} role="img" aria-label="Model and schema feed cached logits, then external temperature and cost policy feed the final decision">
      <g stroke="#aaa" fill="none"><path d="M85 65L250 130M250 65V130M455 65L250 130M250 160L100 230M250 160L460 230M100 265L280 340M460 265L280 340" /></g>
      {items.map(([name, x, y], i) => <g key={name}><rect x={x - 72} y={y - 18} width="144" height="36" fill="#21232a" stroke={marked.includes(i) ? '#ff997e' : colors[i % colors.length]} strokeWidth={marked.includes(i) ? 3 : 1} />
        <text x={x} y={y + 5} textAnchor="middle">{name}</text></g>)}
    </svg></Scroll>
    <p>{change === 'none' ? 'Unchanged package: native cached float64 vector replay is bitwise equal.' : change === 'description' ? 'Changed description: the loader rejects mismatched candidate schema. Recompute predictions and assess calibration on the changed interface.' : 'Changed cost: preserve learned weights and probability model; record a new policy and reassess action costs.'}</p>
    <Table caption="Exact selected dependency identities" headers={['Object', 'SHA256']} rows={Object.entries(artifact.dependencies).map(([name, value]) => [name, <span className="typed-hash" key={name}>{value.sha256}</span>])} />
    <p className="typed-hash">Artifact payload: {data.artifact.payload_sha256}</p>
    <p>Native cached equality: {String(data.replay.laya_external.bitwise_cached_vector_replay)}. Scratch live replay maximum errors: {['seed-17', 'seed-29', 'seed-43'].map(seed => `${seed} ${data.replay[seed].replayed_batch_max_error.toExponential(3)}`).join('; ')}.</p>
    <Controls reset={() => setChange('none')}><Select label="Inspect dependency change" value={change} options={[['none', 'unchanged artifact'], ['description', 'candidate description changes'], ['cost', 'action cost changes']]} onChange={setChange} /></Controls>
  </Figure>;
}
