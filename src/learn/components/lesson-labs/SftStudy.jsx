import { useEffect, useState } from 'react';
import data from '../../data/sft-runtime-data.json';
import { roles } from '../../data/sft-models.js';
import { Figure, Controls, Select, Scroll, Lanes, SftTable, fmt, vec } from './SftFlowShared.jsx';

function useRecordedStudy() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ value: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ value: null, error: null });
    fetch('/learn-code/supervised-fine-tuning/study-evaluation.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(value => {
        if (!value.base || value.runs?.length !== 6) throw new Error('Unexpected study format');
        setState({ value, error: null });
      })
      .catch(error => { if (error.name !== 'AbortError') setState({ value: null, error: error.message }); });
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}

function Loading({ state }) {
  return <div role="status" className="sft-data-state">
    <p>{state.error ? `Recorded results could not load: ${state.error}.` : 'Loading the recorded experiment…'}</p>
    {state.error && <button type="button" onClick={state.retry}>Retry recorded results</button>}
  </div>;
}

function Curve({ run, selected }) {
  const x = step => 65 + step * 2.8;
  const y = nll => 315 - Math.log(nll / .2) / Math.log(8 / .2) * 270;
  const color = run.policy === 'response' ? roles.answer : roles.prompt;
  return <g opacity={selected ? 1 : .35}>
    <path d={run.history.map((row, i) => `${i ? 'L' : 'M'}${x(row.step)} ${y(row.development_response.nll)}`).join(' ')}
      fill="none" stroke={color} strokeWidth={selected ? 3 : 1.5}
      strokeDasharray={run.seed === 17 ? undefined : run.seed === 29 ? '8 5' : '2 4'} />
    {run.history.map(row => <g key={row.step}>
      <circle cx={x(row.step)} cy={y(row.development_response.nll)} r={row.step === run.selected_step ? 6 : 3.5}
        fill={color} stroke={row.step === run.selected_step ? '#f4f4f5' : color} strokeWidth="2">
        <title>{run.policy}-{run.seed}, step {row.step}: {row.development_response.nll}; {row.step === run.selected_step ? 'selected by development' : 'diagnostic'}</title>
      </circle>
    </g>)}
  </g>;
}

export function SftResults() {
  const state = useRecordedStudy();
  const [selected, setSelected] = useState('response-29');
  if (!state.value) return <Figure id="S18" caption="Recorded six-run development histories and final test measurements."><Loading state={state} /></Figure>;
  const study = state.value;
  const run = study.runs.find(row => `${row.policy}-${row.seed}` === selected);
  const test = run.test;
  const x = step => 65 + step * 2.8;
  const y = nll => 315 - Math.log(nll / .2) / Math.log(8 / .2) * 270;
  return <Figure id="S18" caption="Actual development response NLL; logarithmic vertical axis. Gold = response objective, blue = full objective. Seed 17 is solid, 29 dashed, 43 dotted. White rings mark predeclared development-selected checkpoints; controls inspect saved results only.">
    <Scroll label="All six recorded development curves"><svg className="sft-wide-svg" viewBox="0 0 690 380" role="img" aria-label="Recorded development NLL curves with selected checkpoint rings">
      {[.2, .5, 1, 2, 4, 8].map(value => <g key={value}><path d={`M65 ${y(value)} H625`} stroke="#3f424b" /><text x="52" y={y(value) + 5} textAnchor="end">{value}</text></g>)}
      {[0, 50, 100, 150, 200].map(step => <g key={step}><text x={x(step)} y="344" textAnchor="middle">{step}</text><path d={`M${x(step)} 315 V323`} stroke="#ccc" /></g>)}
      <text x="345" y="374" textAnchor="middle">Optimizer updates</text>
      <text x="65" y="25">Development response NLL (nats / selected token; log scale)</text>
      {study.runs.filter(row => `${row.policy}-${row.seed}` !== selected).map(row => <Curve key={`${row.policy}-${row.seed}`} run={row} selected={false} />)}
      <Curve run={run} selected />
    </svg></Scroll>
    <Controls><Select label="Highlight recorded run" value={selected} options={study.runs.map(row => [`${row.policy}-${row.seed}`, `${row.policy} / seed ${row.seed}`])} onChange={setSelected} /></Controls>
    <Lanes rows={[
      { name: 'Checkpoint step', values: run.history.map(row => row.step), selected: run.history.map(row => row.step === run.selected_step) },
      { name: 'Development NLL', values: run.history.map(row => row.development_response.nll), selected: run.history.map(row => row.step === run.selected_step) },
    ]} />
    <p>Selected step <b>{run.selected_step}</b>; test response NLL {fmt(test.response.nll, 6)};
      free-generation accuracy {fmt(test.generation.accuracy, 4)}, macro-F1 {fmt(test.generation.macro_f1, 4)}.</p>
    <SftTable label="Every measured final outcome and baselines" headers={['Model', 'Selected step', 'Test response NLL', 'Free accuracy', 'Free macro-F1']} rows={[
      ['Base', 'before adaptation', fmt(study.base.response.nll, 5), fmt(study.base.generation.accuracy), fmt(study.base.generation.macro_f1)],
      ['Majority label', 'training counts', 'not a generative model', fmt(data.summary.majority.accuracy, 5), fmt(data.summary.majority.macro_f1, 5)],
      ...study.runs.map(row => [`${row.policy}-${row.seed}`, row.selected_step, fmt(row.test.response.nll, 5), fmt(row.test.generation.accuracy, 5), fmt(row.test.generation.macro_f1, 5)]),
    ]} />
  </Figure>;
}

export function SftConfusion() {
  const state = useRecordedStudy();
  const [model, setModel] = useState('response-17');
  const [identity, setIdentity] = useState(0);
  const [mode, setMode] = useState('generation');
  if (!state.value) return <Figure id="S19" caption="Recorded predictions with actual full-vocabulary generation and a separate fixed-candidate evaluation."><Loading state={state} /></Figure>;
  const study = state.value;
  const evaluation = model === 'base' ? study.base : study.runs.find(row => `${row.policy}-${row.seed}` === model).test;
  const metrics = evaluation[mode];
  const source = data.study.test_records.find(row => row.id === identity);
  const generated = evaluation.generation.rows.find(row => row.id === identity);
  const constrained = evaluation.constrained.rows.find(row => row.id === identity);
  const prediction = mode === 'generation' ? generated.prediction : constrained.prediction;
  const goldIndex = metrics.gold_order.indexOf(source.label);
  const predictionIndex = metrics.prediction_order.indexOf(prediction);
  return <Figure id="S19" caption="All 104 test records contribute to the confusion matrix. The inspector is restricted to the six test IDs declared before evaluation. Gold class is a row; prediction is a column, including invalid output.">
    <Scroll label="Three gold classes by four prediction outcomes"><table className="sft-confusion">
      <thead><tr><th>Gold ↓ / prediction →</th>{metrics.prediction_order.map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody>{metrics.gold_order.map((name, i) => <tr key={name}><th scope="row">{name}</th>{metrics.confusion[i].map((value, j) => <td key={j}
        data-selected={i === goldIndex && j === predictionIndex || undefined}
        style={{ background: `rgba(133,182,255,${.04 + value / 104 * .65})` }}>{value}</td>)}</tr>)}</tbody>
    </table></Scroll>
    <Controls reset={() => { setModel('response-17'); setIdentity(0); setMode('generation'); }}>
      <Select label="Recorded model" value={model} options={[
        ['base', 'Base checkpoint'], ...study.runs.map(row => [`${row.policy}-${row.seed}`, `${row.policy} / seed ${row.seed}`]),
      ]} onChange={setModel} />
      <Select label="Evaluation method" value={mode} options={[['generation', 'Free full-vocabulary generation'], ['constrained', 'Three complete label candidates']]} onChange={setMode} />
      <Select label="Predeclared test example" value={identity} options={data.study.test_records.map(row => [row.id, `Test ${row.id} — ${row.label}`])} onChange={value => setIdentity(Number(value))} />
    </Controls>
    <p>Accuracy {fmt(metrics.accuracy, 4)}; macro-F1 {fmt(metrics.macro_f1, 4)}.
      Highlight: gold <b>{source.label}</b>, {mode === 'generation' ? 'generated' : 'candidate'} prediction <b>{prediction}</b>.</p>
    <pre className="sft-text-view">{`Classify the verse sentiment as negative, no impact, or positive.\nVerse: ${source.verse}\nAnswer:`}</pre>
    <div className="sft-record-output"><strong>Actual free generation</strong><pre className="sft-text-view">{generated.text ?? '(unmapped token IDs)'}</pre>
      <p>Emitted IDs {vec(generated.ids)}; {generated.eos_stopped ? 'stopped at EOS' : 'reached the 8-token cap'};
        validated label: {generated.prediction}.</p></div>
    <SftTable label="Separate complete-candidate scores, including EOS" headers={['Candidate', 'Sum of token log probabilities']} rows={['negative', 'no impact', 'positive'].map((name, i) => [name, fmt(constrained.candidate_logp[i], 6)])} />
    <p>No candidate-length normalization is applied. A valid output and EOS termination are separate observations.</p>
  </Figure>;
}

export function SftDiagnosis() {
  const [failure, setFailure] = useState('boundary');
  const paths = {
    boundary: ['Boundary mismatch', 'Joint prompt/completion IDs', 'Repair serialization and recheck selected positions'],
    stopping: ['Missing termination', 'Genuine EOS labels versus padded storage', 'Restore positional EOS ownership'],
    dominant: ['Dominant-class output', 'Training class counts and full confusion matrix', 'Investigate representation and data balance on development data'],
    late: ['Late degradation', 'Development curve and predeclared selection rule', 'Choose by development; preserve final and selected outcomes'],
    retained: ['Retained-task decline', 'A separate untouched retention assessment', 'Compare a bounded data or parameter-subset intervention'],
  };
  const current = paths[failure];
  return <Figure id="S20" caption="A failure is evidence to inspect a specific object. An intervention needs a new, declared comparison; these links do not diagnose every poor result from one metric.">
    <div className="sft-diagnostic-tree">
      <div className="sft-diagnostic-root"><span className="sft-observed" />{current[0]}</div>
      <div className="sft-diagnostic-stem" />
      <div className="sft-diagnostic-object"><span className="sft-inspected" />{current[1]}</div>
      <div className="sft-diagnostic-stem" />
      <div className="sft-diagnostic-action"><span className="sft-intervention" />{current[2]}</div>
      <div className="sft-diagnostic-branches"><a href="/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models">Data quality</a>
        <a href="/learn/path/full-curriculum/p-tuning-soft-prompt-methods?module=large-language-models">Trainable parameter subset</a>
        <a href="/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models">Preference and reward objective</a></div>
    </div>
    <Controls><Select label="Observed failure" value={failure} options={Object.entries(paths).map(([key, value]) => [key, value[0]])} onChange={setFailure} /></Controls>
  </Figure>;
}
