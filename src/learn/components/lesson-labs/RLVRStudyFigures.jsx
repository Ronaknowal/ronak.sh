import React, { useState } from 'react';
import * as M from '../../data/rlvr-models.js';
import {
  Figure,
  Controls,
  Select,
  Range,
  Check,
  Reset,
  Svg,
  Text,
  Line,
  Arrow,
  Bars,
  Tokens,
  RLVRTable,
  RLVRScroll,
  DataView,
  Plot,
  palette,
  f,
} from './RLVRFlow.jsx';

const arms = ['group-scaled-grpo', 'unscaled-centred-grpo', 'verified-sample-sft'];
const seeds = [17, 29, 43];
const recordById = (data, id) => [...data.train, ...data.test].find((row) => row.id === id);
function RunControls({ seed, arm, setSeed, setArm, children, reset }) {
  return (
    <Controls>
      <Select
        label="Recorded seed"
        value={seed}
        onChange={(value) => setSeed(Number(value))}
        options={seeds.map(String)}
      />
      <Select
        label="Recorded arm"
        value={arm}
        onChange={setArm}
        options={arms.map((name) => [name, M.armLabel(name)])}
      />
      {children}
      <Reset onClick={reset} />
    </Controls>
  );
}
function Task({ record, solution = false }) {
  return (
    <>
      <p style={{ color: M.roles.input }}>
        {record.id} · {record.split} source row {record.source_row} · {record.question_bytes} UTF-8
        bytes
      </p>
      <div className="rlvr-raw">{record.question}</div>
      {solution && (
        <>
          <p>Original solution and label</p>
          <div className="rlvr-raw">{record.answer}</div>
        </>
      )}
      <p>External gold: {record.gold}. Gold is excluded from the generation prompt.</p>
    </>
  );
}
function Sample({ sample, record }) {
  const prefix = M.byteIds(record.question);
  return (
    <>
      <div className="rlvr-raw">{sample.response || '(empty response)'}</div>
      <p>
        Extracted object {sample.verdict.parsed || 'none'} · {sample.verdict.reason} · reward{' '}
        {f(sample.verdict.reward)} · length {sample.length} ·{' '}
        {sample.ended_with_EOS
          ? 'generated EOS included'
          : sample.truncated
            ? 'cap reached without EOS'
            : 'no EOS'}
      </p>
      <Tokens ids={sample.response_ids} offset={prefix.length} />
      <RLVRTable
        headers={[
          'Predictor position',
          'Target position',
          'Target ID',
          'Saved generation log probability',
        ]}
        rows={sample.response_ids.map((id, i) => [
          prefix.length + i - 1,
          prefix.length + i,
          id,
          f(sample.generated_logps[i], 9),
        ])}
      />
      <p className="rlvr-note">
        All {prefix.length} prefix positions are context. Response targets start at {prefix.length};
        their first predictor is {prefix.length - 1}. Right-padding has no included target.
      </p>
    </>
  );
}
export function SelectedCorpusContext() {
  const [split, setSplit] = useState('train'),
    [index, setIndex] = useState('0');
  return (
    <Figure id="D27" label="All selected official records, complete original question and solution">
      <DataView file="records.json">
        {(data) => {
          const rows = data[split],
            record = rows[Number(index)] || rows[0];
          return (
            <>
              <Task record={record} solution />
              <p>
                Derived supervised response target: <code>{`#### ${record.gold}`}</code> plus
                generated-target EOS. Selection: first 24 train / 12 test rows in source order with
                question ≤240 UTF-8 bytes and integer gold 0…99.
              </p>
              <Controls>
                <Select
                  label="Source split"
                  value={split}
                  onChange={(value) => {
                    setSplit(value);
                    setIndex('0');
                  }}
                  options={['train', 'test']}
                />
                <Select
                  label="Complete record"
                  value={index}
                  onChange={setIndex}
                  options={rows.map((row, i) => [String(i), row.id])}
                />
                <Reset
                  onClick={() => {
                    setSplit('train');
                    setIndex('0');
                  }}
                />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function TinyCausalModelAnatomy() {
  const [position, setPosition] = useState(0);
  return (
    <Figure
      id="D28"
      label="Actual byte tensor shapes, two attention heads, causal mask and residual paths"
    >
      <DataView file="records.json">
        {(data) => {
          const record = data.train[0],
            ids = M.byteIds(record.question),
            at = Math.min(position, ids.length - 2);
          return (
            <>
              <Svg
                height={690}
                label="One actual TinyLM block with causal geometry and changing MLP width"
              >
                <Text x={85} y={28}>
                  IDs [B,T] · token table [260,24]
                </Text>
                <Text x={85} y={57}>
                  + position table [320,24] → x [B,T,24]
                </Text>
                <Arrow x1={310} y1={72} x2={310} y2={103} color={M.roles.input} />
                <Text x={310} y={128} anchor="middle">
                  LayerNorm → Q,K,V [B,2,T,12]
                </Text>
                {[0, 1].map((head) => (
                  <g key={head}>
                    <Text x={160 + head * 320} y={160} anchor="middle" color={palette[head]}>
                      Head {head + 1} · score [T,T]
                    </Text>
                    {Array.from({ length: 6 }, (_, i) =>
                      Array.from({ length: 6 }, (_, j) => (
                        <rect
                          key={`${i}-${j}`}
                          x={105 + head * 320 + j * 16}
                          y={175 + i * 16}
                          width={14}
                          height={14}
                          fill={j <= i ? `${palette[head]}77` : 'transparent'}
                          stroke={j <= i ? palette[head] : M.roles.frozen}
                          strokeDasharray={j > i ? '2 2' : undefined}
                        />
                      )),
                    )}
                    <Text x={160 + head * 320} y={295} anchor="middle">
                      Keys j ≤ query i
                    </Text>
                    <Arrow x1={160 + head * 320} y1={306} x2={310} y2={334} />
                  </g>
                ))}
                <Text x={310} y={360} anchor="middle">
                  Concat 2×12 → projection 24
                </Text>
                <path d="M75,55L55,55L55,405L280,405" fill="none" stroke={M.roles.input} />
                <circle cx={310} cy={405} r={17} fill="none" stroke={M.roles.input} />
                <Text x={310} y={410} anchor="middle">
                  +
                </Text>
                <Arrow x1={310} y1={372} x2={310} y2={385} />
                <Arrow x1={310} y1={423} x2={310} y2={449} />
                <Text x={310} y={470} anchor="middle">
                  LayerNorm → MLP
                </Text>
                <polygon
                  points="270,490 350,490 440,525 180,525"
                  fill={`${M.roles.parameter}22`}
                  stroke={M.roles.parameter}
                />
                <Text x={310} y={516} anchor="middle">
                  24 → 96 · GELU
                </Text>
                <polygon
                  points="180,535 440,535 350,570 270,570"
                  fill={`${M.roles.parameter}22`}
                  stroke={M.roles.parameter}
                />
                <Text x={310} y={558} anchor="middle">
                  96 → 24
                </Text>
                <path d="M350,405L545,405L545,598L330,598" fill="none" stroke={M.roles.input} />
                <circle cx={310} cy={598} r={17} fill="none" stroke={M.roles.input} />
                <Text x={310} y={603} anchor="middle">
                  +
                </Text>
                <Arrow x1={310} y1={570} x2={310} y2={578} />
                <Arrow x1={310} y1={616} x2={310} y2={637} />
                <Text x={310} y={662} anchor="middle">
                  Final norm → 260 logits → softmax
                </Text>
              </Svg>
              <p>
                Structural allowed-attention cells, not invented attention weights. Position {at}{' '}
                with ID {ids[at]} predicts target {at + 1}, ID {ids[at + 1]}, using only input
                positions ≤{at}. This fixed-byte model starts without pretrained knowledge.
              </p>
              <Tokens
                ids={ids.slice(Math.max(0, at - 2), at + 4)}
                mask={ids.slice(Math.max(0, at - 2), at + 4).map(() => false)}
                selected={at - Math.max(0, at - 2)}
                offset={Math.max(0, at - 2)}
              />
              <Controls>
                <Range
                  label="Prefix predictor address"
                  value={at}
                  onChange={setPosition}
                  min={0}
                  max={ids.length - 2}
                  step={1}
                />
                <Reset onClick={() => setPosition(0)} />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function GeneratedGroupAndMasks() {
  const [seed, setSeed] = useState(17),
    [arm, setArm] = useState(arms[0]),
    [step, setStep] = useState(1),
    [selected, setSelected] = useState('0');
  return (
    <Figure id="D29" label="All actual sampled groups, response addresses and included targets">
      <DataView file="records.json">
        {(records) => (
          <DataView file={`train-${seed}-${arm}.json`}>
            {(run) => {
              const row = run.steps[step - 1],
                sample = row.samples[Number(selected)] || row.samples[0],
                record = recordById(records, sample.record_id);
              return (
                <>
                  <p>
                    Seed {seed} · {M.armLabel(arm)} · scheduled rollout {step} · generating state{' '}
                    <code className="rlvr-hash">{row.generating_state_sha256}</code>
                  </p>
                  <Task record={record} />
                  <RLVRTable
                    headers={[
                      'Prompt / sample identity',
                      'Raw sampled response',
                      'Reward',
                      'Mean',
                      'Population SD',
                      'Coefficient',
                    ]}
                    rows={row.samples.map((item, i) => [
                      <span style={{ color: palette[item.sample % 4] }}>
                        {item.record_id} / {item.sample}
                      </span>,
                      <span className="rlvr-raw">{item.response}</span>,
                      f(item.verdict.reward),
                      f(item.group_mean),
                      f(item.population_std),
                      f(item.advantage),
                    ])}
                  />
                  <p>
                    Selected response address: {sample.record_id} / sample {sample.sample}
                  </p>
                  <Sample sample={sample} record={record} />
                  <RunControls
                    {...{ seed, arm, setSeed, setArm }}
                    reset={() => {
                      setSeed(17);
                      setArm(arms[0]);
                      setStep(1);
                      setSelected('0');
                    }}
                  >
                    <Range
                      label="Saved rollout"
                      value={step}
                      onChange={(value) => {
                        setStep(value);
                        setSelected('0');
                      }}
                      min={1}
                      max={48}
                      step={1}
                    />
                    <Select
                      label="Saved response"
                      value={selected}
                      onChange={setSelected}
                      options={row.samples.map((item, i) => [
                        String(i),
                        `${item.record_id} / sample ${item.sample}`,
                      ])}
                    />
                  </RunControls>
                </>
              );
            }}
          </DataView>
        )}
      </DataView>
    </Figure>
  );
}
export function RolloutReuseAndUpdate() {
  const [seed, setSeed] = useState(17),
    [arm, setArm] = useState(arms[0]),
    [step, setStep] = useState(1),
    [epoch, setEpoch] = useState('0'),
    [sampleIndex, setSample] = useState('0');
  return (
    <Figure
      id="D30"
      label="Actual detached score addresses, reused rollout and optimizer boundaries"
    >
      <DataView file={`train-${seed}-${arm}.json`}>
        {(run) => {
          const row = run.steps[step - 1],
            update = row.update,
            epochs = update.epochs || [],
            current = epochs[Number(epoch)] || epochs[0],
            i = Number(sampleIndex),
            sample = row.samples[i];
          return (
            <>
              {arm === 'verified-sample-sft' ? (
                <>
                  <Svg
                    height={280}
                    label="Actual verified-SFT selection and likelihood update, or zero-target skip"
                  >
                    <Text x={65} y={35}>
                      Generate once from W_old · {row.samples.length} responses
                    </Text>
                    <Arrow x1={310} y1={48} x2={310} y2={82} />
                    <Text x={310} y={109} anchor="middle" color={M.roles.score}>
                      Verifier accepts {update.accepted_ids?.length || 0} response addresses
                    </Text>
                    <Arrow
                      x1={310}
                      y1={122}
                      x2={310}
                      y2={159}
                      color={update.updates ? M.roles.parameter : M.roles.frozen}
                    />
                    <Text
                      x={310}
                      y={184}
                      anchor="middle"
                      color={update.updates ? M.roles.parameter : M.roles.frozen}
                    >
                      {update.updates
                        ? 'Accepted response IDs → likelihood loss → trainable W'
                        : 'Zero accepted response targets → skip optimizer update'}
                    </Text>
                    <Text x={65} y={223}>
                      Frozen reference is unused by this selected-SFT update.
                    </Text>
                    <Text x={65} y={258}>
                      No group advantages, probability ratios or KL rescore route.
                    </Text>
                  </Svg>
                  <RLVRTable
                    headers={['Accepted record', 'Response address', 'Included targets']}
                    rows={(update.accepted_ids || []).map((item, j) => [
                      item.record_id,
                      item.sample,
                      update.target_counts[j],
                    ])}
                  />
                </>
              ) : (
                <Svg
                  height={280}
                  label="Generation snapshot and separate old, reference and current scores"
                >
                  <Text x={80} y={35}>
                    Generate once from W_old
                  </Text>
                  <Arrow x1={200} y1={50} x2={200} y2={80} />
                  <Text x={80} y={106}>
                    Saved batch: {row.samples.length} responses
                  </Text>
                  {[
                    ['old · detached', 120],
                    ['reference · fixed', 330],
                    ['current · trainable', 530],
                  ].map(([name, x], j) => (
                    <g key={name}>
                      <Arrow
                        x1={200}
                        y1={119}
                        x2={x}
                        y2={163}
                        dashed={j < 2}
                        color={j === 2 ? M.roles.parameter : M.roles.frozen}
                      />
                      <Text x={x} y={190} anchor="middle">
                        {name}
                      </Text>
                      <Text x={x} y={220} anchor="middle">
                        Same target IDs
                      </Text>
                    </g>
                  ))}
                  <Text x={80} y={263}>
                    Current is rescored after each update; old scores stay fixed.
                  </Text>
                </Svg>
              )}
              <p>
                Old / generation hash{' '}
                <code className="rlvr-hash">{row.generating_state_sha256}</code>; frozen reference{' '}
                <code className="rlvr-hash">{run.reference_sha256}</code>.
              </p>
              <p>
                Selected response address {i}: {sample.record_id} / sample {sample.sample} · reward{' '}
                {sample.verdict.reward}.
              </p>
              <div className="rlvr-raw">{sample.response || '(empty response)'}</div>
              {current ? (
                <>
                  <RLVRTable
                    headers={[
                      'Target ID',
                      'Old log p',
                      'Reference log q',
                      'Current log p',
                      'ρ',
                      'k₃',
                      'Clipped surrogate',
                    ]}
                    rows={sample.response_ids.map((id, t) => [
                      id,
                      f(update.old_state_logps[i][t], 9),
                      f(update.reference_logps[i][t], 9),
                      f(current.token_logps[i][t], 9),
                      f(current.token_ratios[i][t], 9),
                      f(current.token_k3[i][t], 9),
                      f(M.clippedTerm(current.token_ratios[i][t], sample.advantage).value, 9),
                    ])}
                  />
                  <RLVRTable
                    headers={[
                      'Saved epoch',
                      'Response-equal loss',
                      'Gradient L₂',
                      'Parameter displacement L₂',
                      'Sampled k₃ response mean',
                    ]}
                    rows={epochs.map((e) => [
                      e.epoch,
                      f(e.loss, 10),
                      f(e.gradient_l2),
                      f(e.parameter_delta_l2),
                      f(e.sampled_k3_response_mean, 9),
                    ])}
                  />
                  <p>
                    Selected epoch {current.epoch}: response {i} loss{' '}
                    {f(current.response_losses[i], 10)}; after-update hash{' '}
                    <code className="rlvr-hash">{current.state_sha256}</code>.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Verified SFT:{' '}
                    {update.skip || 'accepted response targets receive a likelihood update'} ·
                    actual updates {update.updates} · loss {f(update.loss, 9)}.
                  </p>
                  <RLVRTable
                    headers={['Retained record', 'Sample address']}
                    rows={(update.accepted_ids || []).map((item) => [item.record_id, item.sample])}
                  />
                </>
              )}
              <p>
                This rollout adds {update.updates} optimizer updates; cumulative count{' '}
                {row.optimizer_updates_total}. The browser reads retained values; it performs no
                optimizer step.
              </p>
              <RunControls
                {...{ seed, arm, setSeed, setArm }}
                reset={() => {
                  setSeed(17);
                  setArm(arms[0]);
                  setStep(1);
                  setEpoch('0');
                  setSample('0');
                }}
              >
                <Range
                  label="Saved rollout"
                  value={step}
                  onChange={setStep}
                  min={1}
                  max={48}
                  step={1}
                />
                {epochs.length > 0 && (
                  <>
                    <Select
                      label="Saved rescore epoch"
                      value={epoch}
                      onChange={setEpoch}
                      options={epochs.map((e, j) => [String(j), String(e.epoch)])}
                    />
                    <Select
                      label="Response address"
                      value={sampleIndex}
                      onChange={setSample}
                      options={row.samples.map((s, j) => [
                        String(j),
                        `${s.record_id} / ${s.sample}`,
                      ])}
                    />
                  </>
                )}
              </RunControls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function SharedWarmStartAndArms() {
  const [seed, setSeed] = useState('17');
  return (
    <Figure id="D31" label="Actual identical arm starts from one warm checkpoint per seed">
      <DataView file="study-index.json">
        {(data) => {
          const warm = data.warm_runs.find((row) => row.seed === Number(seed)),
            runs = data.runs.filter((row) => row.seed === Number(seed));
          return (
            <>
              <Svg height={270} label="One warm parameter object copied to three independent arms">
                <Text x={320} y={35} anchor="middle" color={M.roles.parameter}>
                  Seed {seed} · one warm W
                </Text>
                <Text x={320} y={65} anchor="middle">
                  192 teacher-forced updates
                </Text>
                {runs.map((run, i) => (
                  <g key={run.arm}>
                    <Arrow x1={320} y1={82} x2={110 + i * 210} y2={130} color={palette[i]} />
                    <Text x={110 + i * 210} y={155} anchor="middle" color={palette[i]}>
                      {M.armLabel(run.arm)}
                    </Text>
                    <Text x={110 + i * 210} y={185} anchor="middle">
                      start = warm, byte for byte
                    </Text>
                    <Text x={110 + i * 210} y={217} anchor="middle">
                      {run.optimizer_updates} updates
                    </Text>
                  </g>
                ))}
              </Svg>
              <p>
                Warm hash <code className="rlvr-hash">{warm.warm_sha256}</code>.
              </p>
              <RLVRTable
                headers={[
                  'Arm',
                  'Identical starting hash',
                  'Fixed reference hash',
                  'Final hash',
                  'Updates',
                ]}
                rows={runs.map((run) => [
                  M.armLabel(run.arm),
                  <code className="rlvr-hash">{run.start_sha256}</code>,
                  <code className="rlvr-hash">{run.reference_sha256}</code>,
                  <code className="rlvr-hash">{run.final_sha256}</code>,
                  run.optimizer_updates,
                ])}
              />
              <Controls>
                <Select
                  label="Warm seed"
                  value={seed}
                  onChange={setSeed}
                  options={seeds.map(String)}
                />
                <Reset onClick={() => setSeed('17')} />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function ActualRewardAndContrastHistory() {
  const [seed, setSeed] = useState(17),
    [arm, setArm] = useState(arms[0]),
    [metric, setMetric] = useState('answer_pass_fraction');
  const metrics = [
    ['answer_pass_fraction', 'Accepted answer fraction'],
    ['mixed_group_fraction', 'Mixed-group fraction'],
    ['mean_length', 'Mean generated positions'],
    ['updates', 'Optimizer updates this rollout'],
    ['sampled_k3_response_mean', 'Last-epoch sampled k₃'],
  ];
  return (
    <Figure id="D32" label="All actual scheduled trajectories, with declared common axes">
      <DataView file="metrics.json">
        {(data) => {
          const run = data.runs.find((row) => row.seed === seed && row.arm === arm),
            all = data.runs.filter((row) => row.seed === seed);
          const value = (row) =>
            metric === 'sampled_k3_response_mean' ? (row[metric]?.at(-1) ?? null) : row[metric];
          const max = metric.includes('fraction')
            ? 1
            : metric === 'mean_length'
              ? 12
              : metric === 'updates'
                ? 2
                : Math.max(
                    1e-8,
                    ...all.flatMap((r) => r.history.map(value).filter(Number.isFinite)),
                  );
          return (
            <>
              <Plot
                domainX={[1, 48]}
                domainY={[0, max]}
                xLabel="Scheduled rollout 1…48"
                yLabel={metrics.find((row) => row[0] === metric)[1]}
                series={all.map((r, i) => ({
                  color: palette[i],
                  points: r.history.map((row) => [row.step, value(row)]),
                }))}
              />
              <p>
                {all.map((r, i) => (
                  <span key={r.arm} style={{ color: palette[i], marginRight: '1rem' }}>
                    {M.armLabel(r.arm)}
                  </span>
                ))}
              </p>
              <RLVRTable
                headers={[
                  'Selected arm',
                  'Prompt groups',
                  'Training responses',
                  'Generated positions',
                  'Actual updates',
                  'Skipped rollouts',
                ]}
                rows={[
                  [
                    M.armLabel(arm),
                    run.work.prompt_groups,
                    run.work.training_responses,
                    run.work.training_generated_tokens,
                    run.work.optimizer_updates,
                    run.work.skipped_rollouts,
                  ],
                ]}
              />
              <p>
                All 48 scheduled points are retained per arm; no smoothing or best-checkpoint
                selection. Selected held-out checkpoints:
              </p>
              <RLVRTable
                headers={['Checkpoint', 'Answer passes /96', 'Mean record pass@4 /12 records']}
                rows={run.evaluations.map((row) => [
                  row.step,
                  `${row.pass_count} / ${row.sample_count}`,
                  f(row.mean_record_pass_at_4_estimator),
                ])}
              />
              <RunControls
                {...{ seed, arm, setSeed, setArm }}
                reset={() => {
                  setSeed(17);
                  setArm(arms[0]);
                  setMetric('answer_pass_fraction');
                }}
              >
                <Select
                  label="Trajectory quantity"
                  value={metric}
                  onChange={setMetric}
                  options={metrics}
                />
              </RunControls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function HeldoutResponseInspector() {
  const [seed, setSeed] = useState(17),
    [arm, setArm] = useState(arms[0]),
    [checkpoint, setCheckpoint] = useState('48'),
    [recordIndex, setRecord] = useState('0'),
    [sampleIndex, setSample] = useState('0'),
    [initial, setInitial] = useState(false);
  return (
    <Figure
      id="D33"
      label="All untouched test records and fresh samples from every fixed checkpoint"
    >
      <DataView file="records.json">
        {(records) => (
          <DataView file={`eval-${seed}-${arm}.json`}>
            {(evaluations) => {
              const evaluation = evaluations.find((row) => row.step === Number(checkpoint)),
                row = evaluation.records[Number(recordIndex)],
                record = recordById(records, row.record_id),
                sample = row.samples[Number(sampleIndex)];
              return (
                <>
                  <Task record={record} solution />
                  <p>
                    Seed {seed} · {M.armLabel(arm)} · checkpoint {checkpoint}; state{' '}
                    <code className="rlvr-hash">{evaluation.state_sha256}</code>.
                  </p>
                  <RLVRTable
                    headers={['Sample', 'Full response', 'Parsed answer', 'Verdict', 'Length']}
                    rows={row.samples.map((s) => [
                      s.sample,
                      <span className="rlvr-raw">{s.response}</span>,
                      s.verdict.parsed || 'none',
                      s.verdict.reason,
                      s.length,
                    ])}
                  />
                  <Sample sample={sample} record={record} />
                  {initial && (
                    <>
                      <p>
                        Checkpoint 0, same response address but a fresh sample; samples are not
                        paired response draws.
                      </p>
                      <div className="rlvr-raw">
                        {
                          evaluations[0].records[Number(recordIndex)].samples[Number(sampleIndex)]
                            .response
                        }
                      </div>
                      <p>
                        Initial verdict:{' '}
                        {
                          evaluations[0].records[Number(recordIndex)].samples[Number(sampleIndex)]
                            .verdict.reason
                        }
                        .
                      </p>
                    </>
                  )}
                  <RunControls
                    {...{ seed, arm, setSeed, setArm }}
                    reset={() => {
                      setSeed(17);
                      setArm(arms[0]);
                      setCheckpoint('48');
                      setRecord('0');
                      setSample('0');
                      setInitial(false);
                    }}
                  >
                    <Select
                      label="Fixed checkpoint"
                      value={checkpoint}
                      onChange={setCheckpoint}
                      options={['0', '16', '32', '48']}
                    />
                    <Select
                      label="Held-out record"
                      value={recordIndex}
                      onChange={setRecord}
                      options={evaluation.records.map((r, i) => [String(i), r.record_id])}
                    />
                    <Select
                      label="Fresh sample address"
                      value={sampleIndex}
                      onChange={setSample}
                      options={Array.from({ length: 8 }, (_, i) => String(i))}
                    />
                    <Check
                      label="Compare initial fresh sample"
                      value={initial}
                      onChange={setInitial}
                    />
                  </RunControls>
                </>
              );
            }}
          </DataView>
        )}
      </DataView>
    </Figure>
  );
}
export function PretrainedToolOutputs() {
  const [index, setIndex] = useState('0');
  return (
    <Figure id="D34" label="All actual encoder-decoder baseline prompts and generated positions">
      <DataView file="flan.json">
        {(data) => {
          const row = data.records[Number(index)];
          return (
            <>
              <div className="rlvr-raw">{row.prompt}</div>
              <Svg
                height={270}
                label="Encoder input memory and decoder start followed by autoregressive targets"
              >
                <Text x={65} y={35} color={M.roles.input}>
                  Encoder input · {row.input_ids.length} IDs
                </Text>
                <rect
                  x={65}
                  y={55}
                  width={210}
                  height={70}
                  fill={`${M.roles.input}22`}
                  stroke={M.roles.input}
                />
                <Text x={170} y={84} anchor="middle">
                  Bidirectional encoder
                </Text>
                <Text x={170} y={109} anchor="middle">
                  Input memory
                </Text>
                <Arrow x1={280} y1={90} x2={355} y2={90} />
                <Text x={320} y={65} anchor="middle">
                  cross-attention
                </Text>
                <rect
                  x={360}
                  y={55}
                  width={215}
                  height={70}
                  fill={`${M.roles.parameter}22`}
                  stroke={M.roles.parameter}
                />
                <Text x={467} y={84} anchor="middle">
                  Causal decoder
                </Text>
                <Text x={467} y={109} anchor="middle">
                  Start ID {row.decoder_start_token_id}
                </Text>
                <Arrow x1={470} y1={132} x2={470} y2={167} />
                <Text x={65} y={198}>
                  Returned positions: {row.generated_ids.join(' → ')}
                </Text>
                <Text x={65} y={234}>
                  Start excluded: {row.new_decoder_tokens} new tokens,{' '}
                  {row.generated_decoder_positions} returned positions
                </Text>
              </Svg>
              <p>Full encoder IDs</p>
              <div className="rlvr-raw">{row.input_ids.join(', ')}</div>
              <p>Actual greedy output</p>
              <div className="rlvr-raw">{row.prediction || '(empty)'}</div>
              <p>
                External gold {row.gold}; parsed {row.verdict.parsed || 'none'};{' '}
                {row.verdict.reason}; reward {f(row.verdict.reward)}. Strict answer acceptance{' '}
                {data.accepted}/{data.records.length} across all retained records.
              </p>
              <p>
                Checkpoint {data.checkpoint.checkpoint}, revision{' '}
                <code className="rlvr-hash">{data.checkpoint.revision}</code>. Separate pretrained
                baseline, not a paired custom-training arm.
              </p>
              <Controls>
                <Select
                  label="Greedy baseline record"
                  value={index}
                  onChange={setIndex}
                  options={data.records.map((r, i) => [String(i), r.record_id])}
                />
                <Reset onClick={() => setIndex('0')} />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function NativeTrainerContract() {
  const [sample, setSample] = useState('0'),
    [mode, setMode] = useState('sampled');
  return (
    <Figure
      id="D35"
      label="Original native failure, its retained target mask, own-step audit and separate fixture"
    >
      <DataView file="native.json">
        {(data) => {
          const event = (kind) => data.events.find((row) => row.kind === kind)?.observation;
          const batch = event('native-batch-captured').batch,
            rows = event('native-rewards-generated').rows,
            row = rows[Number(sample)],
            i = Number(sample),
            actual = event('native-loss-gradient-parity'),
            fixture = data.continuation.mixed_fixture;
          const comparison = mode === 'sampled' ? actual : fixture,
            details = comparison.details;
          return (
            <>
              <p>
                Original native study status: <strong>failed update-equality assertion</strong>.
                Local GPT2 seed 19, 64 warm updates, one native optimizer step. The continuation
                performed no new generation or optimizer update.
              </p>
              <div className="rlvr-raw">{row.response}</div>
              <p>
                {row.record_id}; gold {row.gold}; reward {row.verdict.reward}; {row.verdict.reason}.
              </p>
              <Tokens
                ids={batch.completion_ids[i]}
                mask={batch.completion_mask[i].map(Boolean)}
                offset={batch.prompt_ids[i].length}
              />
              <RLVRTable
                headers={[
                  'Captured target column',
                  'ID',
                  'Included',
                  'Coefficient',
                  'Current log p',
                  'k₃ (excluded padding can be large)',
                ]}
                rows={batch.completion_ids[i].map((id, t) => [
                  t,
                  id,
                  batch.completion_mask[i][t] ? 'yes' : 'no',
                  f(mode === 'sampled' ? batch.advantages[i] : fixture.advantages[i]),
                  f(details.current_logps[i][t], 9),
                  f(details.token_k3[i][t], 9),
                ])}
              />
              <p>
                All-zero sampled coefficients: {batch.advantages.join(', ')}. Constructed fixture:{' '}
                {fixture.advantages.join(', ')}; {fixture.origin}.
              </p>
              <RLVRTable
                headers={[
                  'Comparison',
                  'Native loss',
                  'Explicit loss',
                  'Max gradient difference',
                  'Additional optimizer steps',
                ]}
                rows={[
                  [
                    mode === 'sampled' ? 'Actual homogeneous group' : 'Constructed mixed fixture',
                    f(comparison.native_loss, 12),
                    f(comparison.explicit_loss, 12),
                    comparison.max_gradient_difference.toExponential(8),
                    mode === 'sampled' ? 'one original native + one explicit twin' : 0,
                  ],
                ]}
              />
              <RLVRTable
                headers={['Retained check', 'Actual value', 'Declared interpretation']}
                rows={[
                  [
                    'Original parameter gap',
                    data.continuation.own_step_analytical_audit.cross_implementation_parameter_difference.toExponential(
                      10,
                    ),
                    'failed original 5e−5 tolerance',
                  ],
                  [
                    'Native own AdamW arithmetic',
                    data.continuation.own_step_analytical_audit.native.consistent
                      ? 'consistent'
                      : 'inconsistent',
                    'gradient inferred from retained first moment; no post-zero_grad native gradient',
                  ],
                  [
                    'Explicit own AdamW arithmetic',
                    data.continuation.own_step_analytical_audit.explicit.consistent
                      ? 'consistent'
                      : 'inconsistent',
                    'its retained actual gradient and moments',
                  ],
                  [
                    'Sensitive explicit gradient',
                    data.alignment.first_step_adamw_sensitivity.explicit_gradient.toExponential(10),
                    'c_proj.bias[17]',
                  ],
                  [
                    'AdamW epsilon',
                    data.alignment.first_step_adamw_sensitivity.epsilon,
                    'tiny gradient can produce much larger parameter displacement',
                  ],
                ]}
              />
              <p>
                Own-step arithmetic consistency does not make unequal updates equal. Score-row
                matching inferred from saved values:{' '}
                {data.alignment.best_reference_row_to_manual_row_mapping.join(', ')}; maximum
                matched gap {data.alignment.best_maximum_difference.toExponential(8)}. This
                permutation was not independently logged.
              </p>
              <RLVRTable
                caption="Explicit pinned native configuration"
                headers={['Setting', 'Value']}
                rows={Object.entries(data.protocol).map(([key, value]) => [
                  key,
                  typeof value === 'object' ? JSON.stringify(value) : String(value),
                ])}
              />
              <Controls>
                <Select
                  label="Captured response row"
                  value={sample}
                  onChange={setSample}
                  options={['0', '1', '2', '3']}
                />
                <Select
                  label="Gradient comparison origin"
                  value={mode}
                  onChange={setMode}
                  options={[
                    ['sampled', 'Actual sampled group'],
                    ['fixture', 'Separate constructed mixed fixture'],
                  ]}
                />
                <Reset
                  onClick={() => {
                    setSample('0');
                    setMode('sampled');
                  }}
                />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function PassAtKSamplingGeometry() {
  const [k, setK] = useState(4),
    [mode, setMode] = useState('two');
  const answers =
    mode === 'two'
      ? ['72', '72', '24', '24', '24', '5', null, null]
      : mode === 'none'
        ? ['24', '24', '5', '5', null, null, null, null]
        : ['72', '72', '24', '24', '5', '5', null, null];
  const count = answers.filter((answer) => answer === '72').length,
    vote = M.answerVote(answers),
    estimate = M.passAtK(8, count, k),
    denominator = M.binomial(8, k),
    failure = M.binomial(8 - count, k);
  const subsets = [];
  function choose(start, selected) {
    if (selected.length === Math.min(k, 8)) {
      subsets.push(selected);
      return;
    }
    for (let i = start; i < 8; i++) choose(i + 1, [...selected, i]);
  }
  if (k <= 8) choose(0, []);
  return (
    <Figure
      id="D36"
      label="Eight literal response slots, all subset counts and separate voting rules"
    >
      <div className="rlvr-tokens">
        {answers.map((answer, i) => (
          <span key={i} className="rlvr-token" style={{ '--entity': palette[i % 4] }}>
            <small>Response {i + 1}</small>
            <b>{answer || 'invalid'}</b>
            <small>{answer === '72' ? 'answer passes' : 'answer fails'}</small>
          </span>
        ))}
      </div>
      <RLVRTable
        headers={['Quantity', 'Exact denominator / operation', 'Value']}
        rows={[
          [
            `Observed pass@${k} estimator`,
            `${denominator} subsets; ${failure} all-failure subsets`,
            f(estimate, 9),
          ],
          ['Known IID p=.25 any-success probability', `1 − .75^${k}`, f(1 - 0.75 ** k, 9)],
          ['Observed answer fraction', `${count}/8`, f(count / 8)],
          [
            'Plurality',
            'Invalids omitted from counts; top tie → unknown',
            vote.plurality || (vote.tied ? 'tie' : 'none'),
          ],
          ['Strict majority', 'More than 4 of all 8 draws', vote.majority || 'none'],
        ]}
      />
      {k <= 8 && (
        <RLVRScroll label="All response-address subsets">
          <div className="rlvr-subsets">
            {subsets.map((subset, i) => (
              <span
                key={i}
                style={{
                  borderColor: subset.some((j) => answers[j] === '72')
                    ? M.roles.score
                    : M.roles.frozen,
                }}
              >
                {subset.map((j) => j + 1).join('·')}{' '}
                {subset.some((j) => answers[j] === '72') ? 'pass' : 'fail'}
              </span>
            ))}
          </div>
        </RLVRScroll>
      )}
      <Controls>
        <Range label="Subset size k" value={k} onChange={setK} min={1} max={9} step={1} />
        <Select
          label="Constructed answers"
          value={mode}
          onChange={setMode}
          options={[
            ['two', 'Two answer passes'],
            ['none', 'No correct answers'],
            ['tie', 'Plurality tied three ways'],
          ]}
        />
        <Reset
          onClick={() => {
            setK(4);
            setMode('two');
          }}
        />
      </Controls>
      <p className="rlvr-note">
        Every subset uses distinct retained response addresses. The IID probability assumes known p;
        it is not the empirical subset estimator or a correctness test for the winning vote.
      </p>
    </Figure>
  );
}
export function PaperProtocolComparison() {
  const [selected, setSelected] = useState('r1zero');
  const recipes = [
    [
      'tulu',
      'Tülu 3 v3',
      'PPO; value model',
      'Programmatic success 10; missing-EOS −10',
      '7,473 GSM8K +7,500 MATH +14,973 constraints',
      'Selected checkpoints and domain evaluations',
      'https://arxiv.org/html/2411.15124v3',
    ],
    [
      'math',
      'DeepSeekMath v2',
      'GRPO',
      'Learned reward model trained from rule judgments',
      'Group objective and later reference/reward refresh',
      'Separate mathematical/reward-model recipe',
      'https://arxiv.org/html/2402.03300v2',
    ],
    [
      'r1zero',
      'R1-Zero January v1',
      'Rule-reward GRPO',
      'Accuracy and formatting rules',
      'Zero cold-start SFT',
      'AIME pass@1 15.6→71.0; final consensus@64 86.7; evolving curve uses 16-response description',
      'https://arxiv.org/html/2501.12948v1',
    ],
    [
      'r1',
      'R1 January v1',
      'Multiple stages',
      'Rules then broader learned feedback',
      'Cold-start SFT → reasoning RL → rejection/nonreasoning SFT → general-domain RL',
      'Distilled-model SFT is separately described',
      'https://arxiv.org/html/2501.12948v1',
    ],
    [
      'nature',
      'R1 Nature',
      'Revised published recipe',
      'Its own methods and result version',
      'Group 16; β .001; reference refresh 400 steps',
      'Do not combine denominators with January report',
      'https://www.nature.com/articles/s41586-025-09422-z',
    ],
    [
      'open',
      'Pinned Open-R1',
      'Historical reproduction roadmap',
      'Implementation/status record',
      'Distillation marked complete; repository no longer maintained',
      'Roadmap does not establish every intended stage completed',
      'https://github.com/huggingface/open-r1/tree/5b6ff22b3fb7aa069c54866e517f39dfc3160e09',
    ],
  ];
  const row = recipes.find((r) => r[0] === selected);
  return (
    <Figure id="D37" label="Source-local protocol columns, without mixing research versions">
      <RLVRTable
        headers={[
          'Source / version',
          'Update route',
          'Feedback contract',
          'Training context',
          'Evaluation / scope',
        ]}
        rows={recipes.map((r) => [<a href={r[6]}>{r[1]}</a>, ...r.slice(2, 6)])}
      />
      <Svg height={200} label="Selected recipe coordinates stay with their source version">
        <Text x={70} y={35} color={M.roles.input}>
          {row[1]}
        </Text>
        <Line x1={70} y1={60} x2={550} y2={60} />
        {[
          ['Feedback', 100],
          ['Update', 320],
          ['Evaluation', 530],
        ].map(([name, x]) => (
          <g key={name}>
            <circle
              cx={x}
              cy={60}
              r={7}
              fill={
                name === 'Feedback'
                  ? M.roles.input
                  : name === 'Update'
                    ? M.roles.parameter
                    : M.roles.score
              }
            />
            <Text x={x} y={98} anchor="middle">
              {name}
            </Text>
          </g>
        ))}
        <Text x={70} y={145}>
          These fields belong to one source; they are not transferable defaults.
        </Text>
        <Text x={70} y={178}>
          Our custom and native programs declare their own options.
        </Text>
      </Svg>
      <RLVRTable
        caption={`Selected source: ${row[1]}`}
        headers={['Source-local field', 'Retained source claim']}
        rows={[
          ['Feedback', row[3]],
          ['Update', row[2]],
          ['Training context', row[4]],
          ['Evaluation / scope', row[5]],
        ]}
      />
      <Controls>
        <Select
          label="Source to trace"
          value={selected}
          onChange={setSelected}
          options={recipes.map((r) => [r[0], r[1]])}
        />
        <Reset onClick={() => setSelected('r1zero')} />
      </Controls>
    </Figure>
  );
}
export function WorkAndMetricLedger() {
  const [objects, setObjects] = useState('grpo');
  return (
    <Figure id="D38" label="Exact recorded work denominators and model storage roles">
      <DataView file="metrics.json">
        {(data) => {
          const work = (key) => data.runs.reduce((sum, r) => sum + r.work[key], 0),
            warmUpdates = data.warm.reduce((sum, r) => sum + r.updates, 0),
            targets = data.warm.reduce((sum, r) => sum + r.response_target_count, 0);
          return (
            <>
              <RLVRTable
                headers={['Measured role', 'Count', 'Denominator / interpretation']}
                rows={[
                  ['Custom warm optimizer updates', warmUpdates, '3 seeds ×192'],
                  [
                    'Warm drawn training rows',
                    warmUpdates * 6,
                    '6 draws per update; draws can repeat',
                  ],
                  ['Warm response targets', targets, 'Included teacher-forced positions'],
                  ['Training prompt groups', work('prompt_groups'), '9 arms/seeds ×48 ×2'],
                  [
                    'Training generated responses',
                    work('training_responses'),
                    '4 responses per group',
                  ],
                  [
                    'Training generated positions',
                    work('training_generated_tokens'),
                    'Included EOS; not prefix or padding',
                  ],
                  [
                    'Training optimizer updates',
                    work('optimizer_updates'),
                    '576 GRPO +94 selected SFT',
                  ],
                  [
                    'Skipped SFT rollouts',
                    work('skipped_rollouts'),
                    'No accepted target; no optimizer update',
                  ],
                  ['Fresh evaluation responses', work('evaluation_responses'), '9 ×4 ×12 ×8'],
                  [
                    'Native separate warm / update',
                    '64 / 1',
                    'Explicit twin step is comparison arithmetic',
                  ],
                  [
                    'Continuation optimizer updates',
                    0,
                    'Own-step audit and constructed gradient fixture',
                  ],
                  ['Pretrained greedy outputs', 12, 'Decoder start excluded from new-token count'],
                  [
                    'Independent reasoning assessment',
                    'not measured',
                    'Numeric acceptance is not a reasoning label',
                  ],
                  ['Human usefulness', 'not measured', 'No human evaluation in this study'],
                ]}
              />
              <Svg
                height={objects === 'ppo' ? 450 : 300}
                label="Literal policy, frozen reference, score buffer and optimizer storage objects"
              >
                <rect
                  x={75}
                  y={55}
                  width={170}
                  height={105}
                  fill={`${M.roles.parameter}22`}
                  stroke={M.roles.parameter}
                />
                <Text x={160} y={88} anchor="middle">
                  Policy parameters W
                </Text>
                <Text x={160} y={115} anchor="middle">
                  Trainable gradients
                </Text>
                <Text x={160} y={143} anchor="middle">
                  Adam m and v
                </Text>
                <rect
                  x={350}
                  y={55}
                  width={210}
                  height={105}
                  fill="none"
                  stroke={M.roles.frozen}
                  strokeDasharray="5 4"
                />
                <Text x={455} y={89} anchor="middle">
                  Frozen reference W_ref
                </Text>
                <Text x={455} y={119} anchor="middle">
                  No optimizer moments
                </Text>
                <Text x={75} y={203}>
                  Old target log-p buffer: detached rollout coordinates
                </Text>
                {objects === 'ppo' ? (
                  <>
                    <rect
                      x={75}
                      y={246}
                      width={230}
                      height={121}
                      fill={`${M.roles.score}22`}
                      stroke={M.roles.score}
                    />
                    <Text x={190} y={275} anchor="middle" color={M.roles.score}>
                      Value-model parameters φ
                    </Text>
                    <Text x={190} y={303} anchor="middle">
                      Own trainable gradients
                    </Text>
                    <Text x={190} y={337} anchor="middle">
                      Own optimizer m_φ, v_φ
                    </Text>
                    <Arrow x1={305} y1={306} x2={360} y2={306} color={M.roles.score} />
                    <Text x={385} y={290}>
                      V_φ predicts a baseline
                    </Text>
                    <Text x={385} y={319}>
                      Value-fit loss updates φ
                    </Text>
                    <Text x={75} y={399}>
                      These are storage roles, not a measured PPO run or byte count.
                    </Text>
                  </>
                ) : (
                  <Text x={75} y={239}>
                    Group baseline comes from rewards, not a learned critic.
                  </Text>
                )}
                <Text x={75} y={objects === 'ppo' ? 434 : 275}>
                  Sizes, dtype and batching determine bytes; no universal percentage.
                </Text>
              </Svg>
              <Controls>
                <Select
                  label="Storage roles to compare"
                  value={objects}
                  onChange={setObjects}
                  options={[
                    ['grpo', 'Group-relative route'],
                    ['ppo', 'PPO value-model route'],
                  ]}
                />
                <Reset onClick={() => setObjects('grpo')} />
              </Controls>
            </>
          );
        }}
      </DataView>
    </Figure>
  );
}
export function ControlledUseDecision() {
  const [example, setExample] = useState('numeric');
  const cases = {
    numeric: [5, 'Exact numeric goal with gold, support and untouched evaluation'],
    style: [0, 'Subjective style: consider human or learned feedback'],
    missing: [1, 'Numeric task without gold: return unknown, not automatic reward'],
    support: [2, 'Target absent from candidate support: repair representation or sampling'],
    contrast: [3, 'All sampled rewards homogeneous: inspect sampling or supervised warm start'],
    gap: [4, 'Finite y=0 tests accept x: strengthen the specification'],
  };
  const current = cases[example],
    predicates = [
      'Intended property checkable?',
      'Valid gold / specification?',
      'Candidate support exists?',
      'Observed group contrast?',
      'Specification gap checked?',
      'Untouched evaluation?',
    ],
    leaves = [
      'Human / learned feedback',
      'Unknown; acquire specification',
      'Repair support / sampling',
      'Inspect sampling / warm start',
      'Add the (2,3) counterexample',
      'Qualify generalization',
    ];
  return (
    <Figure id="D39" label="Concrete short-predicate decision tree with literal branch endpoints">
      <Svg width={760} height={680} label="Decision predicates and actual example leaves">
        {predicates.map((predicate, i) => {
          const y = 45 + i * 95,
            active = i <= current[0],
            stop = i === current[0] && current[0] < 5;
          return (
            <g key={predicate}>
              <Text
                x={465}
                y={y}
                anchor="middle"
                color={active ? M.roles.parameter : M.roles.frozen}
              >
                {predicate}
              </Text>
              <Line
                x1={465}
                y1={y + 10}
                x2={465}
                y2={y + 32}
                color={active ? M.roles.parameter : M.roles.frozen}
              />
              <Arrow
                x1={465}
                y1={y + 32}
                x2={145}
                y2={y + 57}
                color={stop ? M.roles.score : M.roles.frozen}
              />
              <Text x={300} y={y + 48} anchor="middle">
                no
              </Text>
              <Text
                x={145}
                y={y + 78}
                anchor="middle"
                color={stop ? M.roles.score : M.roles.frozen}
              >
                {leaves[i]}
              </Text>
              {i < 5 && (
                <>
                  <Arrow
                    x1={465}
                    y1={y + 32}
                    x2={465}
                    y2={y + 70}
                    color={active && !stop ? M.roles.parameter : M.roles.frozen}
                  />
                  <Text x={495} y={y + 61}>
                    yes
                  </Text>
                </>
              )}
            </g>
          );
        })}
        <Arrow
          x1={465}
          y1={552}
          x2={465}
          y2={607}
          color={current[0] === 5 ? M.roles.score : M.roles.frozen}
        />
        <Text x={465} y={643} anchor="middle" color={M.roles.score}>
          Compare the declared RLVR recipe
        </Text>
      </Svg>
      <p>
        {current[1]}. Selected route highlights the predicates followed; labels and branch endpoints
        preserve the actual decision structure.
      </p>
      <Controls>
        <Select
          label="Concrete task case"
          value={example}
          onChange={setExample}
          options={[
            ['numeric', 'Numeric task with all conditions'],
            ['style', 'Subjective style'],
            ['missing', 'Missing numeric gold'],
            ['support', 'Missing candidate support'],
            ['contrast', 'No observed reward contrast'],
            ['gap', 'Weak program specification'],
          ]}
        />
        <Reset onClick={() => setExample('numeric')} />
      </Controls>
    </Figure>
  );
}
