import { useState } from 'react';
import { colors, initialPrompt, multiply, WK, WV, attention } from '../../data/soft-prompt-models.js';
import { Figure, Controls, Select, Range, Check, Scroll, Matrix, Lanes, SoftTable,
  Operation, Arrow, fmt, vec, useObservation, ObservationState } from './SoftPromptShared.jsx';

const observationPath = '/learn-assets/p-tuning-soft-prompt-methods/observations.json';
const methods = [['input', 'Flat input'], ['encoder-mlp', 'MLP input'], ['encoder-lstm', 'BiLSTM input'],
  ['prefix-direct', 'Direct K/V'], ['prefix-projected', 'Projected K/V']];
const scientificMethods = methods.filter(([key]) => ['input', 'encoder-mlp', 'prefix-direct'].includes(key));
const methodName = key => methods.find(([name]) => name === key)?.[1] || key;
const methodColor = key => key === 'input' ? colors.prompt : key === 'encoder-mlp' ? colors.taskB : colors.key;

export function SoftNativeRoutes() {
  const [method, setMethod] = useState('input');
  const [record, setRecord] = useState(0);
  const state = useObservation(`native-${method}.json`);
  const batch = useObservation('/learn-assets/p-tuning-soft-prompt-methods/native-batch.json');
  const result = state.data;
  const isInput = !method.startsWith('prefix');
  return <Figure id="P20" caption="Five executed PEFT configurations use the same two real training records. Input routes create output rows for the virtual positions; K/V routes add cache memory but keep only real output positions.">
    <ObservationState state={batch} />
    {batch.data && <><p className="soft-text">{batch.data.rows[record].verse}</p>
      <Lanes label="Exact native diagnostic input and label arrays" rows={[
        { name: 'input IDs', values: batch.data.batch.input_ids[record] },
        { name: 'valid key mask', values: batch.data.batch.attention_mask[record], color: colors.real },
        { name: 'target-position labels', values: batch.data.batch.labels[record], color: colors.target },
      ]} /></>}
    <Operation color={isInput ? colors.prompt : colors.key}>{methodName(method)}: {isInput
      ? '8 × 128 materialized input rows → prepend to real embeddings'
      : '6 layers × K/V × 8 rows × 128 width → per-layer DynamicCache memory'}</Operation>
    <Arrow>frozen six-layer Pythia → output logits</Arrow>
    <ObservationState state={state} />
    {result && <><Operation color={colors.real}>Observed logits {vec(result.logits_shape)}. {isInput
      ? '41 positions = 8 virtual + 33 real. The evaluator strips 8 output rows.'
      : '33 real positions. The evaluator strips 0 output rows.'}</Operation>
      <p>Actual trainable count: {result.trainable_count.toLocaleString()}. Base tensors exact after the diagnostic update: {String(result.frozen_base_exact)}.</p></>}
    <Controls><Select label="Native method" value={method} options={methods} onChange={setMethod} />
      <Select label="Diagnostic record" value={record} options={[[0, 'Record 0'], [1, 'Record 1']]} onChange={value => setRecord(Number(value))} /></Controls>
    <p>{method === 'prefix-projected' ? 'This configuration explicitly enables prefix_projection=True; encoder_hidden_size alone would not do so.'
      : isInput ? 'PEFT receives real target-position labels and applies its own training shift. The displayed −100 entries are ignored targets, not hidden context.'
        : 'Memory supplies keys and values, not new real prediction rows.'}</p>
  </Figure>;
}

export function SoftCache() {
  const [method, setMethod] = useState('input');
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(false);
  const state = useObservation(`native-${method}.json`);
  const cache = state.data?.cache;
  const length = 39 + step * (wrong ? 9 : 1);
  const groups = [
    { count: 8, label: 'virtual prefix', color: colors.prompt },
    { count: 31, label: 'real prefill', color: colors.real },
    { count: step, label: 'newly evaluated', color: colors.value },
    { count: wrong ? 8 * step : 0, label: 'repeated virtual: constructed bug', color: colors.target },
  ];
  const cells = groups.flatMap(group => Array.from({ length: group.count }, () => group));
  return <Figure id="P21" caption="The recorded diagnostic has 31 real prefill positions and 8 virtual positions. Selecting a next ID does not itself append its evaluated key/value; only feeding that ID back grows the cache. The repeated-prefix view is a constructed bug.">
    <div className="soft-node-list">{groups.map(group => <span key={group.label}
      style={{ '--role': group.color }}>{group.count} {group.label}</span>)}</div>
    <Scroll label="Cache rows split into virtual prefix, real prefill, and newly evaluated tokens">
      <svg className="soft-network" viewBox="0 0 708 104" role="img"
        aria-label={`${length} cache rows; each equal-width cell is one position. ${groups.map(group => `${group.count} ${group.label}`).join('; ')}.`}>
        <text x="12" y="22">One equal-width cell = one cached position</text>
        {cells.map((group, index) => <rect key={index} data-cache-cell={group.label}
          x={12 + index * 12} y="38" width="10" height="26" fill={group.color} />)}
        <text x="12" y="92">0</text>
        <text x={12 + length * 12} y="92" textAnchor="end">{length} positions</text>
      </svg>
    </Scroll>
    <Operation>At decoding call {step}: each layer's key shape is [1, 4, {length}, 32].
      {wrong && step > 0 ? ' This is incorrect repeated injection.' : ' Prefix memory was supplied once.'}</Operation>
    <ObservationState state={state} />
    {cache && <><p>Saved observations below are from the correct cache, with prefix supplied once.
      {wrong ? ' The constructed repeated-prefix bug has no measured generated IDs or logit errors here.' : ''}</p>
      <Lanes label="Correct-cache diagnostic selected IDs" rows={[
      { name: 'emitted so far', values: cache.emitted_ids.slice(0, step + 1), color: colors.target },
    ]} /><p>The last displayed ID has been selected but not evaluated. Native/recomputed maximum FP32 logit difference for call {step}: {fmt(cache.per_step_max_logit_errors[step], 9)}. Recorded IDs agree in this fixture.</p></>}
    <Controls reset={() => { setStep(0); setWrong(false); setMethod('input'); }}>
      <Range label="Decoding call after prefill" value={step} min={0} max={2} step={1} onChange={setStep} />
      <Select label="Executed method" value={method} options={methods} onChange={setMethod} />
      <Check label="Constructed bug: prepend 8 rows again each call" checked={wrong} onChange={setWrong} />
    </Controls>
    {state.data && <p>Recorded correct-cache final length: {cache.cache_final_length}; matched reload max logit error: {fmt(state.data.reload_max_logit_error, 9)}.
      {' '}{state.data.materialization_limit}</p>}
    <p>Close FP32 logits are not bitwise equality and do not guarantee the same argmax near every possible tie. The complete program retains float64 and materialization diagnostics.</p>
  </Figure>;
}

export function SoftExperiment() {
  const [seed, setSeed] = useState(17);
  const [method, setMethod] = useState('input');
  const state = useObservation(observationPath);
  const selected = state.data?.runs.find(row => row.seed === seed && row.method === method);
  const pair = state.data?.initialization.find(row => row.seed === seed);
  return <Figure id="P22" caption="These are three complete adaptation recipes. Flat and MLP share exactly the initial prompt and logits within each seed. Direct K/V differs in count, initialization and access to layers; it is not an isolated depth experiment.">
    <Operation>One pinned Pythia base: 14,067,712 fixed parameters. Same source splits, literal serialization and response targets.</Operation>
    <Arrow>fresh unchanged base per run ↓</Arrow>
    <div className="soft-experiment-grid">{scientificMethods.map(([key, title]) => <div key={key}
      data-selected={key === method || undefined} style={{ '--role': methodColor(key) }}>
      <strong>{title}</strong><span>{key === 'input' ? '8 × 128 direct rows; 1,024 values'
        : key === 'encoder-mlp' ? 'latent + MLP; 10,432 values' : '6 × 2 × 8 × 128; 12,288 values'}</span>
      <span>{key === 'prefix-direct' ? 'Normal(0, 0.02²)' : 'Same materialized initial P'}</span>
      <div className="soft-node-list">{[17, 29, 43].map(value => <span key={value} style={{ '--role': methodColor(key) }}
        data-selected={value === seed || undefined}>seed {value}</span>)}</div>
    </div>)}</div>
    <ObservationState state={state} />
    <Controls><Select label="Recipe" value={method} options={scientificMethods} onChange={setMethod} />
      <Select label="Paired seed" value={seed} options={[17, 29, 43].map(value => [value, String(value)])} onChange={value => setSeed(Number(value))} /></Controls>
    {selected && <><output className="soft-result">Initial adapter norm {fmt(selected.initial.adapter_norm)}; initial dev NLL {fmt(selected.initial.dev.nll)}.</output>
      <p>Flat/MLP initial prompt and logits exact: {String(pair.initial_pair_exact)}. Same-seed batch plan identity:</p>
      <span className="soft-frozen-hash">{pair.batch_plan_sha256}</span>
      <p>{pair.examples_over_200_steps} examples over 200 updates, including the final batch of 3 in a full pass. Equal exposure does not equalize parameter counts or computation.</p></>}
  </Figure>;
}

export function SoftSelection() {
  const [key, setKey] = useState('input-17');
  const [index, setIndex] = useState(0);
  const state = useObservation(observationPath);
  const run = state.data?.runs.find(row => row.key === key);
  const item = run?.history[index];
  return <Figure id="P23" caption="Controls inspect recorded checkpoints. The selection remains the prospectively declared minimum dev NLL, earliest on ties. Every run still reaches 200 updates before the nine-run selection seal permits test evaluation.">
    <div className="soft-lineage"><Operation color={colors.real}>843 training examples → 200 updates</Operation>
      <Arrow>five recorded checkpoints ↓</Arrow><Operation color={colors.target}>105 development examples → minimum response NLL</Operation>
      <Arrow>all nine terminal fits → seal all selections ↓</Arrow><Operation color={colors.key}>104 test examples → once-run evaluation</Operation></div>
    <ObservationState state={state} />
    {run && <Lanes label="Recorded development checkpoints and selected state" rows={[
      { name: 'update', values: run.history.map(row => row.step), selected: [index] },
      { name: 'dev NLL', values: run.history.map(row => fmt(row.dev.nll)), color: colors.target },
      { name: 'sealed selection', values: run.history.map(row => row.step === run.selected_step ? 'selected' : '—'), color: colors.key },
    ]} />}
    <Controls><Select label="Recorded run" value={key} options={state.data?.runs.map(row => [row.key, `${methodName(row.method)} · seed ${row.seed}`]) || [[key, key]]} onChange={setKey} />
      <Range label="Inspect checkpoint index" value={index} min={0} max={4} step={1} onChange={setIndex} /></Controls>
    {item && <output className="soft-result">Step {item.step}: {fmt(item.dev.nll_sum)} nats / {item.dev.targets} targets = {fmt(item.dev.nll)}. Sealed selected step stays {run.selected_step}.</output>}
  </Figure>;
}

function DevCurves({ runs, seed, focused }) {
  const top = 30, height = 205;
  const y = value => top + height * (Math.log(9) - Math.log(value)) / (Math.log(9) - Math.log(.3));
  const x = step => 80 + 2.15 * step;
  return <Scroll label={`Recorded five-point development curves for seed ${seed}; logarithmic NLL axis`}>
    <svg className="soft-network" viewBox="0 0 576 300" role="img" aria-label={`Seed ${seed}: all three methods' five development NLL observations; logarithmic vertical axis, selected observations outlined.`}>
      {[.3, .5, 1, 2, 4, 8].map(tick => <g key={tick}><path d={`M80 ${y(tick)}H510`} stroke="#3e4857" />
        <text x="65" y={y(tick) + 5} textAnchor="end">{tick}</text></g>)}
      <text x="80" y="17">Dev NLL (nats / target, log axis)</text>
      {[0, 50, 100, 150, 200].map(step => <text key={step} x={x(step)} y="261" textAnchor="middle">{step}</text>)}
      <text x="290" y="289" textAnchor="middle">optimizer updates · seed {seed}</text>
      {runs.map(run => <g key={run.key} opacity={focused === 'all' || focused === run.method ? 1 : .28}>
        <polyline points={run.history.map(row => `${x(row.step)},${y(row.dev.nll)}`).join(' ')} fill="none" stroke={methodColor(run.method)} strokeWidth="2" />
        {run.history.map(row => <g key={row.step}><circle cx={x(row.step)} cy={y(row.dev.nll)} r="4" fill={methodColor(run.method)} />
          {row.step === run.selected_step && <circle cx={x(row.step)} cy={y(row.dev.nll)} r="8" stroke={methodColor(run.method)} fill="none" strokeWidth="2" />}</g>)}
      </g>)}
    </svg>
  </Scroll>;
}

export function SoftOutcomes() {
  const [focused, setFocused] = useState('all');
  const state = useObservation(observationPath);
  return <Figure id="P24" caption="All nine curves are actual saved observations. Connecting segments guide the eye; they are not unmeasured intermediate evaluations. Rings mark sealed dev selections. All nine methods still produce the same majority-only decisions.">
    <div className="soft-node-list">{scientificMethods.map(([key, title]) => <span key={key} style={{ '--role': methodColor(key) }}>{title}</span>)}</div>
    <ObservationState state={state} />
    {state.data && <>{[17, 29, 43].map(seed => <DevCurves key={seed} seed={seed}
      runs={state.data.runs.filter(row => row.seed === seed)} focused={focused} />)}
      <Controls><Select label="Emphasize a curve family" value={focused} options={[[ 'all', 'All methods' ], ...scientificMethods]} onChange={setFocused} /></Controls>
      <SoftTable label="Every selected scientific outcome" headers={['Recipe · seed', 'Selected update', 'Test NLL', 'Free accuracy', 'Candidate accuracy', 'Macro F1']}
        rows={state.data.runs.map(row => [`${methodName(row.method)} · ${row.seed}`, row.selected_step,
          fmt(row.test_nll, 6), fmt(row.free_accuracy, 6), fmt(row.candidate_accuracy, 6), fmt(row.macro_f1, 6)])} />
      <p>Bare base: NLL {fmt(state.data.baseline.nll, 6)}, free accuracy {fmt(state.data.baseline.accuracy)}, candidate accuracy {fmt(state.data.baseline.candidateAccuracy, 6)}.
        Training-majority rule and every adapter: accuracy 69/104; macro F1 0.265896.</p></>}
  </Figure>;
}

export function SoftPredictions() {
  const [key, setKey] = useState('input-17');
  const [identity, setIdentity] = useState(1);
  const state = useObservation(observationPath);
  const run = state.data?.runs.find(row => row.key === key);
  const example = run?.examples.find(row => row.id === identity);
  return <Figure id="P25" caption="The six example IDs were declared before outcomes. This view reads exact saved model outputs and three complete-candidate log scores; it never regenerates a response or selects a new checkpoint.">
    <ObservationState state={state} />
    {run && <Matrix title="Gold rows × predicted columns: exact held-out confusion counts" rows={run.confusion}
      rowLabels={['negative', 'no impact', 'positive']} columns={['negative', 'no impact', 'positive', 'invalid']} color={colors.target} />}
    <Controls><Select label="Selected adapter" value={key} options={state.data?.runs.map(row => [row.key, `${methodName(row.method)} · seed ${row.seed}`]) || [[key, key]]} onChange={setKey} />
      <Select label="Predeclared test example" value={identity} options={[[5, '5 · negative'], [6, '6 · negative'], [0, '0 · no impact'], [2, '2 · no impact'], [1, '1 · positive'], [10, '10 · positive']]} onChange={value => setIdentity(Number(value))} /></Controls>
    {example && <><p className="soft-text">{`Classify the verse sentiment as negative, no impact, or positive.\nVerse: ${example.verse}\nAnswer:`}</p>
      <Lanes label="Exact free generation and correctness" rows={[
        { name: 'emitted IDs', values: example.generation.ids, color: colors.real },
      ]} />
      <Operation color={colors.target}>Gold: {example.generation.gold}. Generated text: “{example.generation.text}”. Prediction: {example.generation.prediction}.
        EOS stopped: {String(example.generation.eos_stopped)}.</Operation>
      <Matrix title="Separate complete-candidate log probability sums, including EOS" rows={[example.candidate.candidate_logp]}
        rowLabels={['log p(answer | prompt)']} columns={['negative', 'no impact', 'positive']} color={colors.key} />
      <p>Candidate winner: {example.candidate.prediction}. Pooled response NLL and these complete-string scores are different measurements. A valid output format does not repair the incorrect minority-class prediction.</p></>}
  </Figure>;
}

export function SoftArtifactRouting() {
  const [base, setBase] = useState('matching');
  const [shape, setShape] = useState('matching');
  const [combined, setCombined] = useState(false);
  const rows = combined ? [...initialPrompt, ...initialPrompt] : initialPrompt;
  const result = attention(multiply(rows, WK), multiply(rows, WV), 0);
  const valid = base === 'matching' && shape === 'matching';
  return <Figure id="P26" caption="A task artifact requires the matching base identity, vocabulary, shape and injection convention. The lower calculation separately demonstrates why concatenated prompts are not an additive behavior guarantee.">
    <div className="soft-comparison"><Operation color={colors.prompt}>Task manifest: sentiment; input prompt [8,128]; pinned Pythia revision; pinned tokenizer; original template and EOS convention.</Operation>
      <Operation color={colors.real}>Requested base: {base === 'matching' ? 'the declared pinned checkpoint' : 'different checkpoint with the same width'}.
        Tensor shape: {shape === 'matching' ? '[8,128]' : '[8,64]'}.</Operation></div>
    <Arrow>validate every required identity and shape ↓</Arrow>
    <output className="soft-result">{valid ? 'Validation passes → route the task tensor to the shared base.'
      : `Reject before inference: ${base !== 'matching' ? 'base identity mismatch' : 'prompt width mismatch'}.`}</output>
    <Controls><Select label="Base identity" value={base} options={[[ 'matching', 'Matching pinned base' ], ['other', 'Different base, same shape']]} onChange={setBase} />
      <Select label="Prompt dimensions" value={shape} options={[[ 'matching', 'Matching width 128' ], ['other', 'Wrong width 64']]} onChange={setShape} /></Controls>
    <Matrix title="Constructed section 3 prompt-composition calculation" rows={rows} color={colors.prompt} />
    <Arrow>{rows.length} prompt keys + 2 real keys → one shared softmax denominator</Arrow>
    <Operation color={colors.value}>Output {vec(result.output)}; class 0 loss {fmt(result.loss)}.</Operation>
    <Controls><Check label="Concatenate a second identical prompt" checked={combined} onChange={setCombined} /></Controls>
    <p>Even a duplicate prompt changes how much normalized attention goes to prompt versus real rows. Its behavior is not twice the original output; later layers add further interactions.</p>
  </Figure>;
}
