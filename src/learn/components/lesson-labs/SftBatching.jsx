import { useState } from 'react';
import data from '../../data/sft-runtime-data.json';
import { roles, maskedBatch, packGraph, sum, capstone } from '../../data/sft-models.js';
import { Figure, Controls, Select, Range, Check, Lanes, AttentionMatrix, Decoder, SftTable, fmt, vec } from './SftFlowShared.jsx';

export function SftPadding() {
  const [bad, setBad] = useState(false);
  const [overlength, setOverlength] = useState(false);
  const batch = maskedBatch(bad);
  return <Figure id="S11" caption="ID 0 is both the genuine EOS value and padded storage. Input validity comes from record length; response ownership is a separate label array.">
    <p className="sft-small">Local padding fixture: BOS 6, user 1, q 2, assistant 3, yes 4, no 5, EOS 0. These example IDs are distinct from the real Pythia vocabulary.</p>
    {batch.ids.map((row, r) => <div className="sft-batch-record" key={r}>
      <Lanes label={`Padded record ${r ? 'B' : 'A'}`} rows={[
        { name: `${r ? 'B' : 'A'} position`, values: row.map((_, j) => j) },
        { name: 'Input ID', values: row, colors: row.map((id, j) => batch.valid[r][j] ? id === 0 ? roles.boundary : j < 4 ? roles.prompt : roles.answer : roles.muted) },
        { name: 'Valid input', values: batch.valid[r] },
        { name: 'Aligned label', values: batch.labels[r], selected: batch.labels[r].map(value => value !== -100), colors: row.map((id, j) => !batch.valid[r][j] ? roles.muted : id === 0 ? roles.boundary : j < 4 ? roles.prompt : roles.answer) },
      ]} />
    </div>)}
    <output className="sft-result">{batch.targets} targets: {bad ? 'both genuine EOS targets erased' : 'both genuine EOS targets preserved'}</output>
    {overlength && <p className="sft-error">Constructed 65-token record → reject before batching (maximum 64). No silently truncated response enters the objective.</p>}
    <Controls reset={() => { setBad(false); setOverlength(false); }}>
      <Check label="Faulty rule: ignore every ID equal to padding" checked={bad} onChange={setBad} />
      <Check label="Add a 65-token overlength record" checked={overlength} onChange={setOverlength} />
    </Controls>
  </Figure>;
}

export function SftDenominator() {
  const [longCount, setLongCount] = useState(4);
  const [naive, setNaive] = useState(false);
  const n = 2 + longCount;
  const sums = [2 * .5, longCount * 2];
  const weights = naive ? [.5, .5] : [2 / n, longCount / n];
  const means = [.5, 2];
  const fixtureGradients = [1, -2];
  return <Figure id="S12" caption="Constructed losses and one scalar gradient isolate aggregation. The native decoder receipt below separately verifies every real parameter derivative.">
    <div className="sft-comparison">
      {['A', 'B'].map((name, i) => <div key={name} className="sft-accumulator">
        <strong>Microbatch {name}</strong><div className="sft-loss-dots" style={{ '--role': i ? roles.tool : roles.prompt }}>
          {Array.from({ length: i ? longCount : 2 }, (_, j) => <span key={j}>{means[i]}</span>)}
        </div><p>sum {sums[i]} / count {i ? longCount : 2} = mean {means[i]}</p>
        <p className="sft-backward">mean gradient {fixtureGradients[i]} × weight {fmt(weights[i])}</p>
      </div>)}
    </div>
    <div className="sft-converge" aria-hidden="true" />
    <p className="sft-small">Scalar fixture at θ = 0: L_A = .5 + θ and L_B = 2 − 2θ, giving mean gradients +1 and −2.</p>
    <p>Token mean: ({sums[0]} + {sums[1]}) / {n} = <b>{fmt(sum(sums) / n)}</b></p>
    <p>{naive ? 'Naive equal' : 'Count-weighted'} accumulation: loss {fmt(sum(means.map((value, i) => value * weights[i])))};
      gradient <b>{fmt(sum(fixtureGradients.map((value, i) => value * weights[i])))}</b>.</p>
    <Controls reset={() => { setLongCount(4); setNaive(false); }}>
      <Range label="B target count" min={2} max={8} step={1} value={longCount} onChange={setLongCount} />
      <Check label="Use naive equal microbatch weights" checked={naive} onChange={setNaive} />
    </Controls>
    <p className="sft-small">Executed TinyLM check: weighted gradient difference {data.reports['batching-report.json'].accumulation_error.toExponential(2)};
      naive difference {fmt(data.reports['batching-report.json'].naive_accumulation_gradient_error, 6)}.</p>
  </Figure>;
}

export function SftPackedMask() {
  const [isolated, setIsolated] = useState(true);
  const [query, setQuery] = useState(8);
  const report = data.reports['batching-report.json'];
  const graph = packGraph([5, 7], isolated);
  const keys = graph[query].flatMap((allowed, j) => allowed ? [j] : []);
  return <Figure id="S13" caption="The exact native fixture packs a 5-token record and a 7-token record. Blue and teal distinguish their causal blocks; pink marks cross-record context newly admitted by ordinary causal masking.">
    <Lanes rows={[{ name: 'Packed IDs', values: report.packed_ids[0], colors: report.packed_ids[0].map((_, j) => j < 5 ? roles.prompt : roles.tool) }]} />
    <AttentionMatrix graph={graph} lengths={[5, 7]} activeRow={query} onRow={setQuery} />
    <Controls reset={() => { setIsolated(true); setQuery(8); }}>
      <Check label="Isolate record boundaries" checked={isolated} onChange={setIsolated} />
      <Select label="Inspect query row" value={query} options={graph.map((_, j) => [j, `Query ${j}`])} onChange={value => setQuery(Number(value))} />
    </Controls>
    <p>Query {query} can read keys {vec(keys)}. {isolated ? 'No A→B context edge exists.' : 'B can read A: the training problem has changed.'}</p>
    <p>Recorded native comparison against separate evaluation: {isolated ? 'every valid logit agrees within numerical tolerance' : `maximum changed logit = ${fmt(report.cross_record_logit_error, 6)}`}.</p>
  </Figure>;
}

export function SftPositions() {
  const [reset, setReset] = useState(true);
  const report = data.reports['batching-report.json'];
  const actual = report.packed_positions[0];
  const positions = actual.map((value, j) => reset ? value : j);
  return <Figure id="S14" caption="Storage concatenation does not have to change the position embedding. The block attention mask remains correct in both branches, isolating the position-reset decision.">
    <Lanes rows={[
      { name: 'Storage column', values: actual.map((_, j) => j) },
      { name: 'Input token ID', values: report.packed_ids[0], colors: actual.map((_, j) => j < 5 ? roles.prompt : roles.tool) },
      { name: 'Position embedding row', values: positions, colors: positions.map((value, j) => value === actual[j] ? roles.boundary : roles.gradient) },
    ]} />
    <div className="sft-position-paths">
      <div><b>A position lookup</b><span>0 → 1 → 2 → 3 → 4</span></div>
      <div><b>B position lookup</b><span>{positions.slice(5).join(' → ')}</span></div>
    </div>
    <Controls><Check label="Reset positions at each record boundary" checked={reset} onChange={setReset} /></Controls>
    <SftTable label="Recorded native separate/packed check" headers={['Quantity', 'Current branch']} rows={reset ? [
      ['Logits / loss', 'same computation within tolerance'], ['Maximum gradient difference', report.all_parameter_gradient_error.toExponential(3)], ['Maximum SGD update difference', report.update_error.toExponential(3)],
    ] : [['Maximum logit difference', fmt(report.nonreset_position_logit_error, 6)], ['Cause', 'B now uses embedding positions 5…11'], ['Isolation', 'Block mask still has no cross-record edges']]} />
  </Figure>;
}

export function SftPipeline() {
  const [stage, setStage] = useState('source');
  const row = data.tokenized_record;
  const stages = [['source', 'Source'], ['tokens', 'Serialization'], ['labels', 'Masks'], ['loss', 'Objective'], ['update', 'Update'], ['inference', 'Inference']];
  const prompt = `Classify the verse sentiment as negative, no impact, or positive.\nVerse: ${row.verse}\nAnswer:`;
  const labels = row.ids.map((id, j) => j < row.boundary ? -100 : id);
  return <Figure id="S15" caption="One actual held-out record is inspected here without updating on it. The training path diagram describes the corresponding operation on training records; evaluation never supplies optimizer updates.">
    <ol className="sft-stage-map">{stages.map(([key, name], i) => <li key={key} data-selected={stage === key || undefined}>
      <b>{i + 1}</b><span>{name}</span>{i < stages.length - 1 && <i aria-hidden="true">→</i>}
    </li>)}</ol>
    {stage === 'source' && <dl className="sft-fields"><dt>Test ID</dt><dd>{row.id}</dd><dt>Verse</dt><dd>{row.verse}</dd><dt>Gold label</dt><dd>{row.label}</dd></dl>}
    {stage === 'tokens' && <><pre className="sft-text-view">{prompt + ' ' + row.label + ' [EOS]'}</pre><Lanes rows={[{ name: 'Actual joint IDs', values: row.ids }]} /></>}
    {stage === 'labels' && <Lanes rows={[{ name: 'Input validity', values: row.ids.map(() => 1) }, { name: 'Aligned labels', values: labels, colors: labels.map(id => id === -100 ? roles.prompt : roles.answer) }]} />}
    {stage === 'loss' && <><Lanes rows={[{ name: 'Selected target position', values: row.ids.flatMap((_, j) => j >= row.boundary ? [j] : []) }, { name: 'Predicting logit position', values: row.ids.flatMap((_, j) => j >= row.boundary ? [j - 1] : []) }]} /><p>Selected NLL sum / {row.ids.length - row.boundary} targets. Exactly one causal shift.</p></>}
    {stage === 'update' && <div className="sft-update-chain"><span>Training-record mean loss</span><span>↓ backward through decoder</span><span>global gradient norm clipping</span><span>↓ AdamW moments + parameter update</span><span>save model state</span></div>}
    {stage === 'inference' && <><pre className="sft-text-view">{prompt}</pre><p className="sft-arrow">Prompt → saved decoder → model-emitted IDs → EOS or cap → output validation</p><p>No gold answer is in the input.</p></>}
    <Controls><Select label="Inspect pipeline stage" value={stage} options={stages} onChange={setStage} /></Controls>
  </Figure>;
}

export function SftNativeTrainer() {
  const [schema, setSchema] = useState('completion');
  const report = data.reports['native-trainer-report.json'];
  const batch = report.batch;
  const labels = schema === 'completion' ? batch.labels : batch.input_ids.map((row, r) => row.map((id, j) => j > 0 && batch.attention_mask[r][j] ? id : -100));
  return <Figure id="S16" caption="Actual TRL 1.14.2 preparation and native-versus-explicit check. The text-only branch changes which valid targets count; it does not change the supplied input tokens.">
    {batch.input_ids.map((row, r) => <Lanes key={r} label={`Actual TRL row ${r}`} rows={[
      { name: `TRL row ${r}: IDs`, values: row }, { name: 'Valid inputs', values: batch.attention_mask[r] },
      { name: 'Aligned labels', values: labels[r], colors: labels[r].map(value => value === -100 ? roles.prompt : value === 0 ? roles.boundary : roles.answer) },
    ]} />)}
    <Controls><Select label="Trainer data schema" value={schema} options={[['completion', 'Prompt / completion: 5 targets'], ['text', 'Text only: 9 targets']]} onChange={setSchema} /></Controls>
    <p><b>{labels.flat().filter(id => id !== -100).length} selected targets.</b> Prompt/completion tensors follow the explicit collator; text-only schema additionally selects prompt targets.</p>
    <div className="sft-native-chain">
      <div><b>Same logits</b><span>↓ shifted selected loss</span><span>{fmt(report.scratch_loss, 7)} = {fmt(report.native_loss, 7)}</span></div>
      <div><b>All derivatives</b><span>↓ maximum difference</span><span>{report.gradient_error}</span></div>
      <div><b>One actual SGD update</b><span>↓ maximum difference</span><span>{report.update_error.toExponential(3)}</span></div>
      <div><b>Save → reload</b><span>same logits</span><span>exact</span></div>
    </div>
    <p className="sft-small">Parity measurements above belong to the original five-target prompt/completion batch. Switching the schema displays its changed labels, without assigning those parity numbers to a new training run.</p>
  </Figure>;
}

export function SftExperiment() {
  const [policy, setPolicy] = useState('response');
  const [seed, setSeed] = useState(17);
  const run = data.summary.runs.find(row => row.policy === policy && row.seed === seed);
  return <Figure id="S17" caption="The six actual runs share a pinned pretrained checkpoint, record-order seeds and optimizer update count. Objective choice changes selected targets, so this is not an equal-target-budget comparison.">
    <div className="sft-experiment-root"><Decoder label="One pretrained Pythia-14M checkpoint" blocks={6} /><p>14,067,712 trainable parameters; same architecture and tokenizer</p></div>
    <div className="sft-fork" aria-hidden="true" />
    <div className="sft-comparison">{['response', 'full'].map(name => <div key={name} className="sft-experiment-arm" data-selected={name === policy || undefined}>
      <strong style={{ color: name === 'response' ? roles.answer : roles.prompt }}>{name === 'response' ? 'Answer + EOS targets' : 'All available next-token targets'}</strong>
      <div className="sft-seed-row">{[17, 29, 43].map(value => <span key={value} data-selected={value === seed && name === policy || undefined}>seed {value}</span>)}</div>
      <p>843 training records → 200 updates each</p>
    </div>)}</div>
    <div className="sft-selection-route"><span>Development at 0 / 50 / 100 / 150 / 200</span><b>↓ lowest response NLL, earliest tie</b><span>Save selected checkpoint</span><b>↓ after all six fits finish</b><span>104 test records, frozen inference contract</span></div>
    <Controls reset={() => { setPolicy('response'); setSeed(17); }}>
      <Select label="Objective" value={policy} options={[['response', 'Response only'], ['full', 'Full sequence']]} onChange={setPolicy} />
      <Select label="Order seed" value={seed} options={[17, 29, 43].map(value => [value, String(value)])} onChange={value => setSeed(Number(value))} />
    </Controls>
    <p>Actual run {policy}-{seed}: {run.presentations} record presentations; {run.input_positions.toLocaleString()} valid input positions;
      <b> {run.selected_targets.toLocaleString()} selected training targets</b>; development chose step {run.selected_step}.</p>
  </Figure>;
}

export function SftCapstone() {
  const [long, setLong] = useState(true);
  const [eos, setEos] = useState(true);
  const trace = capstone(long, eos);
  const gradient = trace.dhead[2][4];
  const paddedLength = Math.max(...trace.records.map(row => row.length));
  return <Figure id="S21" caption="Changed-data capstone: identity embeddings, zero 7×7 head, independent record contexts. Controls recompute the entire manual graph; the fixed exercise below retains its original question and solution.">
    <Lanes label="Capstone vocabulary" rows={[
      { name: 'Vocabulary ID', values: [0, 1, 2, 3, 4, 5, 6] },
      { name: 'Token', values: ['BOS', 'user', 'q', 'assistant', 'yes', 'no', 'EOS'], colors: [roles.boundary, roles.prompt, roles.prompt, roles.prompt, roles.answer, roles.answer, roles.boundary] },
    ]} />
    {trace.records.map((record, r) => <Lanes key={r} label={`Capstone padded record ${r ? 'B' : 'A'}`} rows={[
      { name: `${r ? 'B' : 'A'} padded IDs`, values: Array.from({ length: paddedLength }, (_, j) => record[j] ?? 6) },
      { name: 'Input validity', values: Array.from({ length: paddedLength }, (_, j) => Number(j < record.length)) },
      { name: 'Aligned labels', values: Array.from({ length: paddedLength }, (_, j) => j < record.length && j >= 4 && (eos || record[j] !== 6) ? record[j] : -100) },
    ]} />)}
    <Lanes rows={[
      { name: 'Packed input IDs', values: trace.ids, colors: trace.ids.map((_, j) => j < 6 ? roles.prompt : roles.tool) },
      { name: 'Reset positions', values: trace.positions },
      { name: 'Target labels', values: trace.labels, selected: trace.labels.map(id => id !== -100) },
    ]} />
    <AttentionMatrix graph={trace.visible} lengths={trace.records.map(row => row.length)} label="Capstone independent causal blocks" />
    <Controls reset={() => { setLong(true); setEos(true); }}>
      <Check label="B answer contains no then yes" checked={long} onChange={setLong} />
      <Check label="Select genuine EOS targets" checked={eos} onChange={setEos} />
    </Controls>
    <SftTable label="Every selected contribution to W[q, yes]" headers={['Predicting row', 'Target ID', 'q context weight', 'dlogit[yes]', 'Product']} rows={trace.selected.map(row => [
      row.logitPosition, row.target,
      fmt(sum(trace.mixing[row.logitPosition].map((w, k) => trace.ids[k] === 2 ? w : 0)), 6),
      fmt(trace.dlogits[row.logitPosition][4], 6),
      fmt(sum(trace.mixing[row.logitPosition].map((w, k) => trace.ids[k] === 2 ? w : 0)) * trace.dlogits[row.logitPosition][4], 6),
    ])} />
    <p>{sum(trace.visible.flat().map(Number))} allowed context edges; {trace.count} targets; initial NLL log 7 = {fmt(trace.loss, 6)}.</p>
    <p className="sft-backward">dW[q,yes] = {fmt(gradient, 8)} → SGD .1 → W[q,yes] = {fmt(-.1 * gradient, 8)}.</p>
    <p>Zero initial head gives zero embedding gradient on this first step. An untouched test still needs the declared prompt, validation and baselines.</p>
  </Figure>;
}
