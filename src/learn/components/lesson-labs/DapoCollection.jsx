import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  NumberField,
  Local,
  Table,
  Identity,
  Strip,
  Arrow,
  Bars,
  Curves,
  curvePoints,
  colours,
  fmt,
  vector,
} from './DapoElements.jsx';
import {
  collectGroups,
  collectorPresets,
  identityRecords,
  mixedProbability,
  binaryPaths,
  acceptedPopulation,
  groupStatistics,
  clippedTerm,
  sum,
  budget,
} from '../../data/dapo-models.js';

export function WholeGroupCollector() {
  const [preset, setPreset] = useState('filled');
  const [step, setStep] = useState(1);
  const target = preset === 'overflow' ? 1 : 2;
  const result = collectGroups(preset, step, target);
  return (
    <Figure id="D13" label="A finite collector keeps complete mixed groups in arrival order">
      <Table
        label="Generated response groups and their exits"
        headers={['Prompt', 'A', 'B', 'C', 'D', 'Whole-group decision']}
        rows={result.decisions.map((row) => [
          row.id,
          ...row.correct.map((r, i) => <Identity index={i}>{r ? '✓' : '×'}</Identity>),
          row.reason,
        ])}
      />
      <Local label="Accepted prompt-group slots stay whole" minWidth="30rem">
        <div className="dapo-slots">
          {Array.from({ length: target }, (_, i) => (
            <div key={i} className={result.selected[i] ? 'dapo-filled' : ''}>
              <strong>
                target slot {i + 1}: {result.selected[i] ?? 'unfilled'}
              </strong>
              <Strip
                label="Four responses kept together"
                values={['A', 'B', 'C', 'D'].map((id) => (result.selected[i] ? id : '—'))}
              />
            </div>
          ))}
        </div>
      </Local>
      <p>
        <strong>{result.status}</strong>: {result.generated} candidate prompt groups generated;{' '}
        {result.selected.length} accepted of {target}.{' '}
        {result.status === 'exhausted'
          ? 'A partial batch is retained as evidence and supplies zero optimizer updates.'
          : result.status === 'filled'
            ? 'Quota is filled; no later candidate batch is generated.'
            : 'A further candidate batch is permitted within the fixed budget.'}
      </p>
      <Controls
        reset={() => {
          setPreset('filled');
          setStep(1);
        }}
      >
        <Select
          label="Candidate sequence"
          value={preset}
          onChange={(v) => {
            setPreset(v);
            setStep(1);
          }}
          options={[
            ['filled', 'Eventually fills'],
            ['exhausted', 'Budget exhausts'],
            ['overflow', 'Final batch exceeds quota'],
          ]}
        />
        <button
          type="button"
          disabled={step >= collectorPresets[preset].length || result.status === 'filled'}
          onClick={() => setStep(step + 1)}
        >
          Next candidate batch
        </button>
      </Controls>
    </Figure>
  );
}
export function IdentityJoin() {
  const [reversed, setReversed] = useState('no');
  const [broken, setBroken] = useState('no');
  const source = reversed === 'yes' ? [...identityRecords].reverse() : identityRecords;
  const selected = ['C', 'A'].map((id) => source.find((row) => row.id === id));
  return (
    <Figure id="D14" label="Persistent UIDs join every field despite storage reordering">
      <Table
        label="Current storage order"
        headers={['Address', 'UID', 'Prompt IDs', 'Completion IDs', 'Old logps', 'Mask', 'Reward']}
        rows={source.map((row, i) => [
          i,
          row.uid,
          vector(row.prompt),
          vector(row.completion),
          vector(row.old),
          vector(row.mask),
          row.reward,
        ])}
      />
      <Arrow>select persistent UIDs C:0, A:0</Arrow>
      <Table
        label="Selected records and scored prompt identities"
        headers={['Response UID', 'Stored prompt', 'Scoring prompt', 'Identity agreement']}
        rows={selected.map((row, i) => [
          <Identity index={identityRecords.findIndex((r) => r.id === row.id)}>{row.uid}</Identity>,
          row.id,
          broken === 'yes' ? source[i].id : row.id,
          broken === 'yes' && source[i].id !== row.id ? 'MISMATCH' : 'same record',
        ])}
      />
      <p>
        {broken === 'yes'
          ? 'Deliberately broken comparison: selecting completions but slicing prefix rows can pass shape checks while scoring the wrong context.'
          : 'The whole-record gather preserves prompt, emitted tokens, old scores, masks and reward together.'}{' '}
        Storage reordering is distinct from changing which eligible group arrives first at a quota.
      </p>
      <Controls
        reset={() => {
          setReversed('no');
          setBroken('no');
        }}
      >
        <Select
          label="Storage order"
          value={reversed}
          onChange={setReversed}
          options={[
            ['no', 'A B C D'],
            ['yes', 'D C B A'],
          ]}
        />
        <Select
          label="Prompt join"
          value={broken}
          onChange={setBroken}
          options={[
            ['no', 'Gather complete records'],
            ['yes', 'Broken: slice first two prompts'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function MixedGroupCost() {
  const [p, setP] = useState(0.5);
  const [group, setGroup] = useState(2);
  const probability = mixedProbability(p, group);
  const paths = binaryPaths(p, group);
  return (
    <Figure id="D15" label="Mixed-group probability and finite path mass">
      <Curves
        label="Per-response correctness probability → mixed-group probability"
        domain={[0, 1]}
        marker={p}
        yDomain={[0, 1]}
        series={[2, 4, 8].map((g) => ({
          name: `G = ${g}`,
          points: curvePoints(0, 1, (x) => mixedProbability(x, g)),
        }))}
      />
      <Local
        label="Independent Bernoulli paths terminate in homogeneous or mixed groups"
        minWidth="34rem"
      >
        <div className="dapo-paths">
          <strong>root mass 1</strong>
          {paths.map((row, i) => (
            <div key={i} style={{ borderColor: row.mixed ? colours[0] : '#777' }}>
              <span>
                {row.bits.map((b, j) => (
                  <React.Fragment key={j}>
                    {j ? ' → ' : ''}
                    <strong>{b ? 'pass' : 'fail'}</strong>
                  </React.Fragment>
                ))}
              </span>
              <span>
                mass {fmt(row.probability)} · {row.mixed ? 'mixed' : 'homogeneous'}
              </span>
            </div>
          ))}
        </div>
      </Local>
      <p>
        For the selected G = {group}, acceptance a = <strong>{fmt(probability)}</strong>. Unlimited
        IID expected candidates for 3 accepted groups:{' '}
        <strong>{probability > 0 ? fmt(3 / probability) : 'no finite expectation'}</strong>. Every
        displayed path is possible in the binary space; zero-probability paths contribute zero.
        Independence and identical p are assumptions.
      </p>
      <Controls
        reset={() => {
          setP(0.5);
          setGroup(2);
        }}
      >
        <NumberField
          label="Correctness probability"
          value={p}
          onChange={setP}
          min={0}
          max={1}
          step={0.05}
        />
        <Select
          label="Explicit path-tree group size"
          value={group}
          onChange={(v) => setGroup(Number(v))}
          options={[
            [2, '2 draws: 4 paths'],
            [3, '3 draws: 8 paths'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function AcceptedMixture() {
  const [easy, setEasy] = useState(1);
  const [middle, setMiddle] = useState(0.5);
  const [weight, setWeight] = useState(0.5);
  const result = acceptedPopulation([weight, 1 - weight], [easy, middle], 2);
  const collector = collectGroups('filled', 3, 2);
  return (
    <Figure id="D16" label="Acceptance reweights prompt populations and consumes rejected work">
      <Bars
        label="Candidate prompt mass"
        maximum={1}
        rows={[
          { label: 'Type A', value: weight, colour: 0 },
          { label: 'Type B', value: 1 - weight, colour: 1 },
        ]}
      />
      <Table
        label="Multiply candidate mass by mixed-group acceptance"
        headers={['Type', 'Candidate mass', 'Acceptance a(p), G2', 'Unnormalized accepted mass']}
        rows={[
          [
            <Identity index={0}>A</Identity>,
            fmt(weight),
            fmt(mixedProbability(easy, 2)),
            fmt(result.masses[0]),
          ],
          [
            <Identity index={1}>B</Identity>,
            fmt(1 - weight),
            fmt(mixedProbability(middle, 2)),
            fmt(result.masses[1]),
          ],
        ]}
      />
      {result.accepted ? (
        <Bars
          label="Conditional accepted prompt mass"
          maximum={1}
          rows={result.accepted.map((value, i) => ({
            label: `Type ${i === 0 ? 'A' : 'B'}`,
            value,
            colour: i,
          }))}
        />
      ) : (
        <p>
          <strong>No accepted population: both weighted acceptance masses are zero.</strong>
        </p>
      )}
      <Local label="Constructed collector work, each small cell is a response" minWidth="32rem">
        <div className="dapo-ragged">
          {collector.decisions.map((row) => (
            <div key={row.id}>
              <strong>{row.id}</strong>
              {row.correct.map((_, i) => (
                <span
                  key={i}
                  className={row.keep ? '' : 'dapo-masked'}
                  style={{ '--entity': colours[i] }}
                >
                  {row.keep ? 'kept' : 'generated'}
                </span>
              ))}
              <span>{row.reason}</span>
            </div>
          ))}
        </div>
      </Local>
      <p>
        This separate fixed collector generated {collector.generated * 4} responses and retained{' '}
        {collector.selected.length * 4}; response lengths are not encoded as equal token costs. The
        population model does not predict observed throughput.
      </p>
      <Controls
        reset={() => {
          setEasy(1);
          setMiddle(0.5);
          setWeight(0.5);
        }}
      >
        <NumberField
          label="Type A correctness p"
          value={easy}
          onChange={setEasy}
          min={0}
          max={1}
          step={0.1}
        />
        <NumberField
          label="Type B correctness p"
          value={middle}
          onChange={setMiddle}
          min={0}
          max={1}
          step={0.1}
        />
        <NumberField
          label="Candidate mass of A"
          value={weight}
          onChange={setWeight}
          min={0}
          max={1}
          step={0.1}
        />
      </Controls>
    </Figure>
  );
}
export function RecordMemory() {
  const [chosen, setChosen] = useState('C');
  const record = identityRecords.find((row) => row.id === chosen);
  return (
    <Figure id="D21" label="One immutable response record gathers all its variable-length fields">
      <Local label="UID-addressed memory fields" minWidth="36rem">
        <div className="dapo-memory">
          {identityRecords.map((row, i) => (
            <div
              key={row.id}
              className={row.id === chosen ? 'dapo-selected' : ''}
              style={{ '--entity': colours[i] }}
            >
              <strong>{row.uid}</strong>
              <span>group {row.id}</span>
              <span>prompt {vector(row.prompt)}</span>
              <span>completion {vector(row.completion)}</span>
              <span>old {vector(row.old)}</span>
              <span>mask {vector(row.mask)}</span>
              <span>R {row.reward}</span>
            </div>
          ))}
        </div>
      </Local>
      <Arrow>gather UID {record.uid} → one record, not independently sliced arrays</Arrow>
      <p>
        Scoring prefix {vector(record.prompt)} remains attached to completion{' '}
        {vector(record.completion)}. The shared token ID 0 is a genuine emitted EOS at its valid
        position.
      </p>
      <Controls reset={() => setChosen('C')}>
        <Select
          label="Inspect complete record"
          value={chosen}
          onChange={setChosen}
          options={identityRecords.map((row) => [row.id, row.uid])}
        />
      </Controls>
    </Figure>
  );
}
export function FiniteBatchDebugger() {
  const [stage, setStage] = useState('scores');
  const [last, setLast] = useState(1);
  const rewards = [-1, -1, 1, last];
  const stats = groupStatistics(rewards);
  const lengths = [2, 3, 1, 3];
  const count = sum(lengths);
  const old = [[-1, -0.2], [-0.8, -0.6, -0.2], [-0.4], [-0.5, -0.7, -0.4]];
  const ratios = [[1.1, 0.9], [1.05, 1.4, 1], [0.7], [1, 1.2, 1.3]];
  const terms = ratios.map((row, i) => row.map((r) => clippedTerm(r, stats.advantages[i])));
  return (
    <Figure id="D22" label="One finite batch keeps tensor addresses through every operation">
      <p>
        Fixed dimensions: 4 responses × up to 3 response targets; {count} selected addresses. The
        highlighted stage changes attention, while every stage remains visible.
      </p>
      <Table
        label="A complete constructed tensor trace"
        headers={['Response', 'selected mask', 'old logp', 'current logp', 'R → A', 'token loss']}
        rows={old.map((row, i) => [
          <Identity index={i}>{String.fromCharCode(65 + i)}</Identity>,
          <span className={stage === 'mask' ? 'dapo-focus' : ''}>
            {[0, 1, 2].map((j) => (j < lengths[i] ? 1 : 0)).join(', ')}
          </span>,
          <span className={stage === 'scores' ? 'dapo-focus' : ''}>{vector(row)}</span>,
          <span className={stage === 'scores' ? 'dapo-focus' : ''}>
            {vector(row.map((v, j) => v + Math.log(ratios[i][j])))}
          </span>,
          <span className={stage === 'advantage' ? 'dapo-focus' : ''}>
            {rewards[i]} → {fmt(stats.advantages[i])}
          </span>,
          <span className={stage === 'loss' ? 'dapo-focus' : ''}>
            {vector(terms[i].map((t) => t.loss))}
          </span>,
        ])}
      />
      <Arrow>
        sum token losses {fmt(sum(terms.flat().map((t) => t.loss)))} / {count} →{' '}
        {fmt(sum(terms.flat().map((t) => t.loss)) / count)}
      </Arrow>
      <Controls
        reset={() => {
          setStage('scores');
          setLast(1);
        }}
      >
        <Select
          label="Highlight operation"
          value={stage}
          onChange={setStage}
          options={[
            ['mask', 'Positional mask'],
            ['scores', 'Old and current scores'],
            ['advantage', 'Group arithmetic'],
            ['loss', 'Signed token loss'],
          ]}
        />
        <Select
          label="D reward"
          value={last}
          onChange={(v) => setLast(Number(v))}
          options={[
            [1, '+1'],
            [-1, '−1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function FailureTrace() {
  const [mode, setMode] = useState('homogeneous');
  const rewards = mode === 'homogeneous' ? [1, 1, 1, 1] : [-1, -1, 1, 1];
  const stats = groupStatistics(rewards);
  const selected = mode === 'masked' ? 0 : 8;
  return (
    <Figure
      id="D33"
      label="Failure diagnosis follows response, mask, coefficient and update boundaries"
    >
      <Strip
        label="Four constructed terminal outcomes"
        values={rewards.map((r, i) => `${String.fromCharCode(65 + i)}: ${r}`)}
      />
      <Arrow>selected tensor</Arrow>
      <Local label="Two response tokens per group member" minWidth="30rem">
        <div className="dapo-ragged">
          {rewards.map((_, i) => (
            <div key={i}>
              <Identity index={i}>{String.fromCharCode(65 + i)}</Identity>
              {[0, 1].map((j) => (
                <span
                  key={j}
                  className={selected ? '' : 'dapo-masked'}
                  style={{ '--entity': colours[i] }}
                >
                  {selected ? 'selected' : 'excluded'}
                </span>
              ))}
              <span>A = {fmt(stats.advantages[i])}</span>
            </div>
          ))}
        </div>
      </Local>
      <Arrow>
        {mode === 'stale'
          ? 'sampled old −.60 ≠ rescored old −.55 → guard stops before update'
          : mode === 'masked'
            ? 'count 0 → reject undefined denominator'
            : `zero coefficient vector → zero reward gradient → no policy movement at β = 0`}
      </Arrow>
      <p>
        {mode === 'homogeneous'
          ? 'Valid all-correct group with no relative signal; this is not itself a numerical failure.'
          : mode === 'masked'
            ? 'All selected terms were removed. Do not report this as a successful zero-loss observation.'
            : 'The scores refer to a mismatched snapshot, context or numerical computation. Preserve operands before diagnosing; do not silently redefine old scores or widen tolerance.'}
      </p>
      <Controls reset={() => setMode('homogeneous')}>
        <Select
          label="Constructed diagnosis"
          value={mode}
          onChange={setMode}
          options={[
            ['homogeneous', 'Homogeneous rewards'],
            ['masked', 'All tokens masked'],
            ['stale', 'Old-score mismatch'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function MetricDenominators() {
  const [metric, setMetric] = useState('clip');
  const [mask, setMask] = useState('all');
  const correctness = [1, 1, 0, 0];
  const ratios = [
    [1.4, 1],
    [1, 0.9],
    [0.7, 1.1],
    [1.3, 1],
  ];
  const advantages = [1, 1, -1, -1];
  const cells = ratios.flatMap((row, i) =>
    row.map((r, j) => ({
      r,
      i,
      j,
      selected: mask === 'all' || j === 0,
      clipped: (advantages[i] > 0 && r > 1.28) || (advantages[i] < 0 && r < 0.8),
    })),
  );
  const selected = cells.filter((c) => c.selected);
  const clipped = selected.filter((c) => c.clipped).length;
  return (
    <Figure id="D34" label="A metric highlights the actual objects in its denominator">
      <Local label="Response-group and selected-token denominator map" minWidth="33rem">
        <div className="dapo-ragged">
          {ratios.map((row, i) => (
            <div key={i}>
              <Identity index={i}>
                R{i}: {correctness[i] ? '✓' : '×'}
              </Identity>
              {row.map((r, j) => {
                const cell = cells.find((c) => c.i === i && c.j === j);
                return (
                  <span
                    key={j}
                    className={
                      !cell.selected
                        ? 'dapo-masked'
                        : metric === 'clip' && cell.clipped
                          ? 'dapo-focus'
                          : ''
                    }
                    style={{ '--entity': colours[i] }}
                  >
                    r {r}
                    {cell.clipped ? ' clipped' : ''}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </Local>
      <p>
        <strong>
          {metric === 'correctness'
            ? 'Correct responses / sampled responses = 2 / 4 = .5'
            : metric === 'acceptance'
              ? 'Mixed groups / generated groups = 1 / 1 = 1'
              : metric === 'clip'
                ? `Active clipped selected tokens / selected tokens = ${clipped} / ${selected.length} = ${fmt(clipped / selected.length)}`
                : `Selected token positions / optimizer update = ${selected.length} / 1 = ${selected.length}`}
        </strong>
      </p>
      <p>
        Changing the token mask changes selected-token metrics. It does not rewrite terminal
        correctness or the identity of the one generated group.
      </p>
      <Controls
        reset={() => {
          setMetric('clip');
          setMask('all');
        }}
      >
        <Select
          label="Metric"
          value={metric}
          onChange={setMetric}
          options={[
            ['correctness', 'Correctness'],
            ['acceptance', 'Group acceptance'],
            ['clip', 'Selected-token clip fraction'],
            ['work', 'Tokens per update'],
          ]}
        />
        <Select
          label="Selected positions"
          value={mask}
          onChange={setMask}
          options={[
            ['all', 'Both tokens per response'],
            ['first', 'Only first token per response'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ComputeBudget() {
  const [target, setTarget] = useState(2);
  const [candidates, setCandidates] = useState(2);
  const [batches, setBatches] = useState(3);
  const [group, setGroup] = useState(4);
  const [cap, setCap] = useState(8);
  const result = budget(target, candidates, batches, group, cap);
  return (
    <Figure id="D36" label="A generation budget is an upper bound, not a success forecast">
      <Local label="Candidate prompt slots across the bounded batch plane" minWidth="34rem">
        <div
          className="dapo-budget-grid"
          style={{ gridTemplateColumns: `repeat(${candidates}, minmax(5rem,1fr))` }}
        >
          {Array.from({ length: result.candidateGroups }, (_, i) => (
            <div key={i}>
              <strong>
                B{Math.floor(i / candidates) + 1}: Q{(i % candidates) + 1}
              </strong>
              <span>
                {group} responses × {cap} tokens
              </span>
            </div>
          ))}
        </div>
      </Local>
      <p>
        At most {batches} batches × {candidates} prompts × {group} responses × {cap} new tokens ={' '}
        <strong>{result.bound} generated tokens</strong>. Target {target} whole groups requires at
        least {result.minimumResponses} retained responses.
      </p>
      <p>
        {result.possible
          ? 'The candidate budget can contain the target, but homogeneous groups may still prevent filling it.'
          : 'The target exceeds even the total number of candidate groups: filling it is impossible under this budget.'}{' '}
        EOS can reduce work; refill stops when filled. No accuracy or expected-work prediction
        follows from this rectangle.
      </p>
      <Controls
        reset={() => {
          setTarget(2);
          setCandidates(2);
          setBatches(3);
          setGroup(4);
          setCap(8);
        }}
      >
        <NumberField
          label="Target groups"
          value={target}
          onChange={setTarget}
          min={1}
          max={10}
          step={1}
        />
        <NumberField
          label="Candidate prompts per batch"
          value={candidates}
          onChange={setCandidates}
          min={1}
          max={4}
          step={1}
        />
        <NumberField
          label="Maximum batches"
          value={batches}
          onChange={setBatches}
          min={1}
          max={4}
          step={1}
        />
        <NumberField
          label="Responses per prompt"
          value={group}
          onChange={setGroup}
          min={2}
          max={8}
          step={1}
        />
        <NumberField
          label="New-token cap"
          value={cap}
          onChange={setCap}
          min={1}
          max={32}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
