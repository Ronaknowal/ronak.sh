import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Local,
  Table,
  Identity,
  Strip,
  Arrow,
  Bars,
  colours,
  fmt,
  vector,
} from './DapoElements.jsx';
import { integerParser, parserFixtures } from '../../data/dapo-models.js';

const EvidenceContext = createContext(null);
export function DapoEvidenceProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/learn-code/dapo/runtime-observations.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Evidence unavailable');
        return response.json();
      })
      .then((value) => {
        if (!value.runs || value.parity.length !== 8) throw new Error('Unexpected evidence');
        setData(value);
      })
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <EvidenceContext.Provider value={{ data, error, retry: () => setAttempt(attempt + 1) }}>
      {children}
    </EvidenceContext.Provider>
  );
}
function Evidence({ children }) {
  const state = useContext(EvidenceContext);
  if (state.error)
    return (
      <p role="alert">
        Recorded observations could not load.{' '}
        <button type="button" onClick={state.retry}>
          Retry recorded observations
        </button>
      </p>
    );
  if (!state.data) return <p role="status">Loading recorded observations…</p>;
  return children(state.data);
}
function RunSelector({ data, value, onChange }) {
  return (
    <Select
      label="Recorded method and seed"
      value={value}
      onChange={(v) => onChange(Number(v))}
      options={data.runs.map((run, i) => [
        i,
        `${run.arm} / seed ${run.seed}${run.status === 'failed' ? ' / failed guard' : ''}`,
      ])}
    />
  );
}
export function SavedRolloutLedger() {
  const [runIndex, setRunIndex] = useState(3);
  const [slotIndex, setSlotIndex] = useState(0);
  return (
    <Figure id="D24" label="All recorded runs and rollout slots, including failure and exhaustion">
      <Evidence>
        {(data) => {
          const run = data.runs[runIndex];
          const slot = run.slots[Math.min(slotIndex, run.slots.length - 1)];
          return (
            <>
              <Table
                label="This run’s observed rollout slots"
                headers={[
                  'Slot',
                  'Collector state',
                  'Generated tokens',
                  'Selected tokens',
                  'Completed updates',
                ]}
                rows={run.slots.map((row) => [
                  row.slot,
                  row.status,
                  row.generated_tokens,
                  row.selected_tokens,
                  row.updates.length,
                ])}
              />
              <p>
                <strong>
                  {run.arm}, seed {run.seed}: {run.status}
                </strong>
                .{' '}
                {run.status === 'failed'
                  ? 'The original score guard stopped this run; no terminal evaluation exists. A filled collector is not proof its optimizer updates completed.'
                  : 'Every prescribed slot remains shown, including exhausted slots.'}
              </p>
              <Table
                label={`Slot ${slot.slot}: actual generated responses`}
                headers={[
                  'Group / source ID',
                  'Response UID',
                  'Emitted text',
                  'Correct',
                  'Length / stop',
                  'Penalty / shaped reward',
                  'Selected',
                ]}
                rows={slot.candidates
                  .flat()
                  .map((row) => [
                    `${row.group_uid} / ${row.id}`,
                    row.uid,
                    row.text ?? '[unmapped output IDs]',
                    String(row.correct),
                    `${row.completion_ids.length} / ${row.eos_stopped ? 'EOS' : 'cap'}`,
                    `${fmt(row.length_penalty)} / ${fmt(row.shaped_reward)}`,
                    slot.selected.includes(row.uid) ? 'yes' : 'no',
                  ])}
              />
              <Table
                label="Actual whole-group decisions"
                headers={['Group UID', 'Mixed correctness', 'Decision']}
                rows={slot.decisions.map((row) => [
                  row.group_uid,
                  String(row.mixed_correctness),
                  row.reason,
                ])}
              />
              <Controls
                reset={() => {
                  setRunIndex(3);
                  setSlotIndex(0);
                }}
              >
                <RunSelector
                  data={data}
                  value={runIndex}
                  onChange={(v) => {
                    setRunIndex(v);
                    setSlotIndex(0);
                  }}
                />
                <Select
                  label="Observed rollout slot"
                  value={slotIndex}
                  onChange={(v) => setSlotIndex(Number(v))}
                  options={run.slots.map((row, i) => [i, `Slot ${row.slot}: ${row.status}`])}
                />
              </Controls>
            </>
          );
        }}
      </Evidence>
    </Figure>
  );
}
export function NativeMechanism() {
  const [mask, setMask] = useState('no');
  return (
    <Figure id="D25" label="Native trainer operations and the absent refill stage">
      <Local label="Nested native generation and update path" minWidth="36rem">
        <div className="dapo-native-path">
          <div>
            <strong>One prompt</strong>
            <span>num_generations = 4</span>
          </div>
          <Arrow>generate at T = 1, cap = 8</Arrow>
          <div>
            <strong>A · B · C · D completions</strong>
            <span>correctness +1/−1 + soft length reward</span>
          </div>
          <Arrow>sum rewards, then group normalize</Arrow>
          <div>
            <strong>four response advantages</strong>
            <span>sample SD + 10⁻⁴; no reference term (β = 0)</span>
          </div>
          <Arrow>teacher-force selected response addresses</Arrow>
          <div>
            <strong>current − old logp → token ratios</strong>
            <span>ε low .2 / high .28 → signed clipped terms</span>
          </div>
          <Arrow>selected token sum / generation-batch denominator</Arrow>
          <div>
            <strong>two SGD updates total</strong>
            <span>No dynamic-refill collector in this route</span>
          </div>
        </div>
      </Local>
      <Strip
        label="Constructed optional truncation-mask branch"
        values={[
          'A EOS: 1, 1',
          'B EOS: 1, 1, 1',
          `C cap: ${mask === 'yes' ? '0, 0' : '1, 1'}`,
          'D EOS: 1, 1, 1',
        ]}
      />
      <p>
        The mask toggle is a finite resulting-mask demonstration. It does not rerun generation. The
        recorded primary native route disables hard truncation masking; the six preflight cases
        separately compare both mask states. A reward function cannot itself refill prompt groups.
      </p>
      <Controls reset={() => setMask('no')}>
        <Select
          label="Constructed truncation masking"
          value={mask}
          onChange={setMask}
          options={[
            ['no', 'Disabled: retain C tokens'],
            ['yes', 'Enabled: remove C loss row'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function NativeParity() {
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState(0);
  return (
    <Figure id="D26" label="Saved native and mathematical losses and all-gradient checks">
      <Evidence>
        {(data) => {
          const row = data.parity[index];
          const inputs = row.inputs.inputs;
          const mask = inputs.completion_mask;
          return (
            <>
              <p>
                <strong>
                  {row.kind === 'constructed'
                    ? 'Constructed FP64 preflight'
                    : 'Actual FP32 sampled update'}
                </strong>
                . These records are separate evidence classes; no matched-sample comparison joins
                native and scratch campaigns.
              </p>
              <Local label="Exact selected response-address mask" minWidth="31rem">
                <div className="dapo-ragged">
                  {mask.map((values, i) => (
                    <div key={i}>
                      <Identity index={i}>response {i}</Identity>
                      {values.map((value, j) => (
                        <span
                          key={j}
                          className={value ? '' : 'dapo-masked'}
                          style={{ '--entity': colours[i % 4] }}
                        >
                          {value ? `t${j}` : 'excluded'}
                        </span>
                      ))}
                      <strong>A {fmt(inputs.advantages[i])}</strong>
                    </div>
                  ))}
                </div>
              </Local>
              <p>
                Inspect response {response}. Prompt IDs in stored order:{' '}
                {inputs.prompt_ids[response].join(', ')}. Prompt validity mask:{' '}
                {inputs.prompt_mask[response].join(', ')}.
              </p>
              <Table
                label={`Saved response ${response}: emitted IDs and native objective operands`}
                headers={[
                  'Position',
                  'Token ID',
                  'Selected mask',
                  'Saved old logp',
                  'Saved ratio',
                  'Masked loss term',
                ]}
                rows={inputs.completion_ids[response].map((token, position) => [
                  position,
                  token,
                  mask[response][position],
                  inputs.old_per_token_logps
                    ? fmt(inputs.old_per_token_logps[response][position], 8)
                    : 'Not stored for actual batch',
                  fmt(row.inputs.manual_details.ratio[response][position], 8),
                  fmt(row.inputs.manual_details.terms[response][position], 8),
                ])}
              />
              <p>
                Excluded addresses retain stored padding or placeholder scores. Their scores are not
                interpreted as selected-action log probabilities; their masked loss terms are zero.
              </p>
              <Table
                label="Actual saved parity values"
                headers={['Quantity', 'Value']}
                rows={[
                  ['Native loss', fmt(row.native_loss, 10)],
                  ['Mathematical loss', fmt(row.scratch_loss, 10)],
                  ['Actual denominator', row.inputs.normalizer],
                  ['Gradient entries compared', row.gradient_elements],
                  ['Maximum all-gradient discrepancy', fmt(row.maximum_gradient_error, 12)],
                  [
                    'Shadow SGD comparison',
                    row.shadow_sgd_maximum_error === null
                      ? 'Not run for this case'
                      : fmt(row.shadow_sgd_maximum_error, 16),
                  ],
                  [
                    'Loss absolute / relative tolerance',
                    row.kind === 'constructed' ? '1e−11 / 1e−10' : '3e−6 / 2e−5',
                  ],
                  [
                    'Gradient absolute / relative tolerance',
                    row.kind === 'constructed' ? '1e−10 / 1e−9' : '2e−5 / 5e−4',
                  ],
                ]}
              />
              <p>
                {row.native_loss === 0
                  ? 'This actual group has zero loss/gradient signal. The separate nonzero constructed cases check the active branches.'
                  : 'This record exercises a nonzero objective.'}{' '}
                Only the first constructed case includes a shadow SGD step; the preflight restores
                all FP32 parameters exactly.
              </p>
              <Controls
                reset={() => {
                  setIndex(0);
                  setResponse(0);
                }}
              >
                <Select
                  label="Saved parity case"
                  value={index}
                  onChange={(v) => setIndex(Number(v))}
                  options={data.parity.map((r, i) => [
                    i,
                    r.kind === 'constructed'
                      ? `Constructed ${i + 1}: shift ${r.log_ratio_shift}, mask ${r.mask_truncated}`
                      : `Actual update ${i - 5}`,
                  ])}
                />
                <Select
                  label="Inspect saved response"
                  value={response}
                  onChange={(value) => setResponse(Number(value))}
                  options={inputs.completion_ids.map((_, i) => [i, `Response ${i}`])}
                />
              </Controls>
            </>
          );
        }}
      </Evidence>
    </Figure>
  );
}
export function ObservedOutcomes() {
  const [metric, setMetric] = useState('nll');
  return (
    <Figure id="D27" label="Every prescribed before-and-after outcome without selecting a winner">
      <Evidence>
        {(data) => {
          const rows = [
            ...data.runs,
            {
              arm: 'native route',
              seed: 73,
              status: 'passed',
              before: data.native.before,
              after: data.native.after,
            },
          ];
          const domain = metric === 'nll' ? [0.33, 0.36] : [0, 32];
          const x = (value) => 185 + ((value - domain[0]) / (domain[1] - domain[0])) * 340;
          return (
            <>
              <Local label="All paired outcomes on a common measured axis" minWidth="39rem">
                <svg
                  viewBox="0 0 650 435"
                  className="dapo-plot dapo-tall-plot"
                  role="img"
                  aria-label={
                    metric === 'nll'
                      ? 'Response NLL for every method/seed'
                      : 'Strict free-label correct counts out of32'
                  }
                >
                  <path d="M185 25V390H525" stroke="#999" fill="none" />
                  {rows.map((row, i) => {
                    const before = row.before[metric === 'nll' ? 'nll' : 'correct'];
                    const after = row.after?.[metric === 'nll' ? 'nll' : 'correct'];
                    const y = 52 + i * 48;
                    return (
                      <g key={i}>
                        <text x="5" y={y + 5} fill={colours[Math.floor(i / 3) % 4]}>
                          {row.arm === 'native route'
                            ? 'native'
                            : row.arm === 'response-baseline'
                              ? 'baseline'
                              : 'combined'}{' '}
                          {row.seed}
                        </text>
                        {after !== undefined && after !== null && (
                          <path
                            d={`M${x(before)} ${y}H${x(after)}`}
                            stroke={colours[Math.floor(i / 3) % 4]}
                            strokeWidth="2"
                          />
                        )}
                        <circle cx={x(before)} cy={y} r="6" fill="none" stroke="#ddd" />
                        {after !== undefined && after !== null ? (
                          <circle
                            cx={x(after)}
                            cy={y}
                            r="6"
                            fill={colours[Math.floor(i / 3) % 4]}
                          />
                        ) : (
                          <text x="540" y={y + 5} fill="#efb66b">
                            guard failed
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {[0, 0.5, 1].map((f) => {
                    const v = domain[0] + f * (domain[1] - domain[0]);
                    return (
                      <text key={f} x={x(v) - 12} y="415" fill="#ddd">
                        {fmt(v, 3)}
                      </text>
                    );
                  })}
                </svg>
              </Local>
              <p>
                Hollow = shared initial checkpoint; filled = terminal result. Axis:{' '}
                {metric === 'nll'
                  ? 'response NLL, .33 to .36; lower is better'
                  : 'strict free-label correct count, 0 to 32; higher is better'}
                . No terminal dot is invented for combined seed 73.
              </p>
              <Table
                label="Exact measured values and update states"
                headers={['Method / seed', 'Before', 'After', 'Actual update / exhaustion state']}
                rows={rows.map((row) => [
                  `${row.arm} / ${row.seed}`,
                  fmt(row.before[metric === 'nll' ? 'nll' : 'correct'], 6),
                  row.after
                    ? fmt(row.after[metric === 'nll' ? 'nll' : 'correct'], 6)
                    : 'not observed',
                  row.arm === 'native route'
                    ? '2 updates, no refill'
                    : `${row.optimizer_updates} updates; ${row.slots.filter((s) => s.status === 'exhausted').length} exhausted slots; ${row.status}`,
                ])}
              />
              <Controls reset={() => setMetric('nll')}>
                <Select
                  label="Recorded outcome"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    ['nll', 'Response negative log likelihood'],
                    ['accuracy', 'Strict free-label correct /32'],
                  ]}
                />
              </Controls>
            </>
          );
        }}
      </Evidence>
    </Figure>
  );
}
export function WorkAccounting() {
  const [index, setIndex] = useState(5);
  return (
    <Figure id="D28" label="Generated, selected and optimizer-used token positions">
      <Evidence>
        {(data) => {
          const row = data.runs[index];
          return (
            <>
              <Bars
                label="Saved work counts; shared token-position axis"
                maximum={Math.max(row.generated_tokens, row.optimizer_token_positions)}
                rows={[
                  { label: 'Generated response tokens', value: row.generated_tokens, colour: 0 },
                  {
                    label: 'Selected tokens including unupdated partial batch',
                    value: row.selected_tokens,
                    colour: 1,
                  },
                  {
                    label: 'Optimizer token positions across repeated steps',
                    value: row.optimizer_token_positions,
                    colour: 2,
                  },
                ]}
              />
              <Table
                label="Counts keep their denominators and measurement boundaries"
                headers={['Quantity', 'Saved value']}
                rows={[
                  ['Generated prompt groups', row.generated_groups],
                  ['Completed optimizer updates', row.optimizer_updates],
                  [
                    'Optimizer positions per completed update',
                    row.optimizer_updates
                      ? fmt(row.optimizer_token_positions / row.optimizer_updates)
                      : 'undefined',
                  ],
                  [
                    'Collection + training elapsed seconds',
                    row.timing
                      ? fmt(row.timing.training_and_collection_seconds)
                      : 'No complete-run timing',
                  ],
                  [
                    'Total elapsed including evaluation/startup seconds',
                    row.timing ? fmt(row.timing.total_seconds) : 'No complete-run timing',
                  ],
                ]}
              />
              <p>
                {row.status === 'failed'
                  ? 'Failure retains generated work and the first two updates; no completed-run timing or terminal score is inferred.'
                  : 'An exhausted partial slot can contribute selected tokens but zero optimizer positions.'}{' '}
                Reusing a filled slot for two updates counts its selected positions twice.
                Shared-host time is a local observation, not a paper-scale speed claim.
              </p>
              <Controls reset={() => setIndex(5)}>
                <RunSelector data={data} value={index} onChange={setIndex} />
              </Controls>
            </>
          );
        }}
      </Evidence>
    </Figure>
  );
}
export function IntegerParser() {
  const [index, setIndex] = useState(0);
  const text = parserFixtures[index][1];
  const result = integerParser(text);
  return (
    <Figure id="D29" label="The last literal boxed marker defines a narrow integer parser">
      <Local label="Exact characters and parser extraction boundary" minWidth="34rem">
        <div className="dapo-character-strip">
          {[...text].map((character, i) => (
            <span
              key={i}
              className={
                i >= result.start && result.start >= 0 && (result.end < 0 || i <= result.end)
                  ? 'dapo-focus'
                  : ''
              }
            >
              <small>{i}</small>
              {character === ' ' ? '␠' : character}
            </span>
          ))}
        </div>
      </Local>
      <Arrow>
        last literal marker at {result.start} → next closing brace at {result.end} → strip body
      </Arrow>
      <p>
        Graded body: <code>{result.body ?? 'none'}</code>. <strong>{result.reason}</strong>
        {result.value !== null ? `; integer ${result.value}` : ''}.
      </p>
      <p>
        This local parser scans the whole input and follows its last literal marker even when
        nested. It does not parse general LaTeX, evaluate expressions or validate the reasoning. The
        pinned official scorer’s trailing-window and balanced-brace rules are a separate contract.
      </p>
      <Controls reset={() => setIndex(0)}>
        <Select
          label="Parser fixture"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={parserFixtures.map(([label], i) => [i, label])}
        />
      </Controls>
    </Figure>
  );
}
export function CircleCollision() {
  const [selected, setSelected] = useState('derived');
  const radius = Math.sqrt(72);
  const derived = 11 - radius;
  const printed = 11 - 2 * Math.sqrt(6);
  const x = (value) => 40 + value * 22;
  const y = (value) => 430 - value * 22;
  return (
    <Figure id="D30" label="A source-local geometry error survives the integer mapping">
      <Local label="Circle drawn with equal x and y units" minWidth="36rem">
        <svg
          viewBox="0 0 580 485"
          className="dapo-plot dapo-tall-plot"
          role="img"
          aria-label="Circle center11,8 radius square-root72; derived left edge2.5147 differs from printed candidate6.1010"
        >
          <path d={`M40 ${y(0)}H550 M${x(0)} 30V455`} stroke="#888" fill="none" />
          <circle cx={x(11)} cy={y(8)} r={radius * 22} fill="none" stroke="#aaa" strokeWidth="2" />
          <circle cx={x(11)} cy={y(8)} r="4" fill="#eee" />
          <text x={x(11) + 8} y={y(8) - 10} fill="#ddd">
            (11, 8)
          </text>
          <path d={`M${x(derived)} ${y(8)}H${x(11)}`} stroke={colours[0]} strokeWidth="3" />
          {[
            ['derived', derived, 0],
            ['printed', printed, 1],
          ].map(([label, value, colour]) => (
            <g key={label}>
              <path
                d={`M${x(value)} 35V${y(0)}`}
                stroke={colours[colour]}
                strokeWidth={selected === label ? 3 : 1}
                strokeDasharray={label === 'printed' ? '6 4' : undefined}
              />
              <text x={x(value) - 20} y="24" fill={colours[colour]}>
                {label}
              </text>
            </g>
          ))}
          {[0, 5, 10, 15, 20].map((v) => (
            <React.Fragment key={v}>
              <text x={x(v) - 8} y="465" fill="#ddd">
                {v}
              </text>
              {v <= 15 && (
                <text x="5" y={y(v) + 5} fill="#ddd">
                  {v}
                </text>
              )}
            </React.Fragment>
          ))}
        </svg>
      </Local>
      <p>
        Completing the square gives (x − 11)² + (y − 8)² = 72. Derived minimum x = 11 − 6√2 ={' '}
        {fmt(derived)}. The paper prints 11 − 2√6 = {fmt(printed)}.
      </p>
      <Table
        label="Two distinct answers collapse to the same transformed integer"
        headers={['Answer source', 'Coefficient triple', 'Sum']}
        rows={[
          [<Identity index={0}>Derived geometry</Identity>, '(11, 6, 2)', 19],
          [<Identity index={1}>Printed source candidate</Identity>, '(11, 2, 6)', 19],
        ]}
      />
      <p>
        The selected line highlights{' '}
        {selected === 'derived'
          ? 'the actual leftmost x-coordinate'
          : 'the source’s printed candidate, inside the actual circle’s horizontal range'}
        . This is one verified source example, not an estimate of dataset error rate.
      </p>
      <Controls reset={() => setSelected('derived')}>
        <Select
          label="Highlight candidate"
          value={selected}
          onChange={setSelected}
          options={[
            ['derived', 'Derived leftmost x'],
            ['printed', 'Printed source answer'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function PaperProgression() {
  const [index, setIndex] = useState(5);
  const labels = [
    'naive GRPO',
    '+ overlong filtering',
    '+ Clip-Higher',
    '+ soft punishment',
    '+ token-level loss',
    '+ dynamic sampling',
  ];
  const scores = [30, 36, 38, 41, 42, 50];
  return (
    <Figure id="D31" label="The paper’s cumulative intervention sequence, not independent effects">
      <Bars
        label="AIME2024 avg@32, percent; common 0–100 axis"
        maximum={100}
        rows={[
          ...scores.map((value, i) => ({
            label: `${i === index ? '→ ' : ''}${labels[i]}`,
            value,
            colour: i === index ? 1 : 0,
          })),
          { label: 'Separate comparison: R1-Zero-Qwen-32B', value: 47, colour: 2 },
        ]}
      />
      <p>
        Selected row retains <strong>{labels.slice(0, index + 1).join(' → ')}</strong>.{' '}
        {index
          ? `Its conditional increment from the prior row is ${scores[index] - scores[index - 1]} points.`
          : 'This is the starting baseline.'}{' '}
        It is not an isolated factorial effect. These are exact camera-ready Table 1 observations,
        not this lesson’s tiny-model results or a current leaderboard.
      </p>
      <Controls reset={() => setIndex(5)}>
        <Select
          label="Inspect cumulative row"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={labels.map((label, i) => [i, label])}
        />
      </Controls>
    </Figure>
  );
}
export function RecipeComparison() {
  const [focus, setFocus] = useState('selection');
  const rows = [
    [
      'selection',
      'Group selection',
      'Mixed correctness refill',
      'Mixed correctness; up to 10 batches',
      'Mixed correctness; up to 10 batches',
      'No refill',
      'Mixed correctness; up to 3 batches',
    ],
    [
      'clip',
      'Clip / dual cap',
      '.2/.28; primary equation',
      '.2/.28; c10',
      '.2/.28; c10',
      '.2/.28; no dual',
      '.2/.28; no dual',
    ],
    [
      'length',
      'Cap / buffer',
      '20,480 / 4,096',
      '20,480 / 4,096',
      '20,480 / 4,096',
      '8 / 4',
      '8 / 4',
    ],
    [
      'mask',
      'Hard overlong handling',
      'Filtering appears in progressive table',
      'Best reproductions mostly omit',
      'README: not implemented',
      'Primary disabled; finite case enabled',
      'Disabled',
    ],
    [
      'reduction',
      'Normalization',
      'Pooled response tokens',
      'Token mean; actor batch caveat',
      'Configured token mean',
      'Generation-batch token denominator',
      'Global selected-token mean',
    ],
    ['group', 'Group / target prompts', '16 / 512', '16 / 512', '16 / 512', '4 / 1', '4 / 2'],
    [
      'optimizer',
      'Optimizer / warm-up',
      'AdamW 1e−6 / 20 rollout steps',
      'AdamW 1e−6 / script field10',
      'AdamW 1e−6 / script field10',
      'SGD 1e−4 / none',
      'SGD 1e−4 / none',
    ],
    ['reference', 'Reference KL', 'Removed', 'Disabled', 'Disabled', 'β = 0', 'β = 0'],
  ];
  return (
    <Figure
      id="D32"
      label="Paper, two recipe snapshots and two local routes have distinct contracts"
    >
      <Table
        label="Source-bound mechanism comparison"
        headers={[
          'Mechanism',
          'Paper',
          'Original verl 4f80e465',
          'Later recipe 242c73fc',
          'TRL1.14.2 local route',
          'Local scratch combined',
        ]}
        rows={rows.map(([key, ...cells]) =>
          cells.map((value, i) => (
            <span className={key === focus ? 'dapo-focus' : ''} key={i}>
              {value}
            </span>
          )),
        )}
      />
      <p>
        The selected row is highlighted across implementations. The original actor’s response-count
        microbatch weighting need not equal a global token mean. Similar configuration names do not
        establish identical batching, task, sampling or compute; source-specific distinctions stay
        explicit.
      </p>
      <Controls reset={() => setFocus('selection')}>
        <Select
          label="Compare mechanism"
          value={focus}
          onChange={setFocus}
          options={rows.map((row) => [row[0], row[1]])}
        />
      </Controls>
    </Figure>
  );
}
