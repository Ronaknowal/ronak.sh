import React, { useState } from 'react';
import saved from '../../data/grouped-preference-observations.json';
import * as model from '../../data/grouped-preference-models.js';
import {
  Figure,
  Identity,
  Controls,
  Select,
  Table,
  Strip,
  Bars,
  Branches,
  Branch,
  Arrow,
  Cloud,
  fmt,
  vector,
} from './GroupedPreferenceElements.jsx';

const labels = ['negative', 'no impact', 'positive'];
const first = saved.rows[0];

export function KTOBatch() {
  const batch = saved.routes.find((route) => route.name === 'native-kto').batches[0];
  return (
    <Figure id="D26" label="Actual prepared KTO records and masks">
      <p>
        First four of 48 prepared records, in actual sequential order. Token 0 is genuine EOS in
        each selected completion.
      </p>
      <Table
        label="Observed records and their rotated KL completions"
        headers={[
          'Row / source ID',
          'Candidate / label',
          'Selected completion IDs',
          'KL completion IDs',
        ]}
        rows={saved.prepared.map((row, index) => [
          `${index + 1} / ${row.source_id}`,
          `${row.candidate} / ${row.label ? '+ D' : '− U'}`,
          vector(row.completion_ids),
          vector(row.KL_completion_ids),
        ])}
      />
      <Branches>
        {saved.prepared.map((row, index) => (
          <Branch key={index} index={index}>
            <Identity index={index}>Prepared row {index + 1}</Identity>
            <p>Prompt context: {row.prompt_ids.length} tokens</p>
            <Strip
              label={`Row ${index + 1} selected completion`}
              values={row.completion_ids.map((id) => `${id}${id === 0 ? ' EOS' : ''}`)}
              coloursByIndex={row.completion_ids.map(() => index)}
            />
            <p>Target mask: prompt zeros → {row.completion_ids.length} ones → padding zeros</p>
          </Branch>
        ))}
      </Branches>
      <Branches>
        <Branch index={2}>
          <p>Labelled tokens → current decoder ━ → sum selected logps</p>
          <Arrow>↘ subtract sequence reference score</Arrow>
        </Branch>
        <Branch index={1}>
          <p>Same labelled tokens → frozen reference ··· → sum selected logps</p>
          <Arrow>↙ fixed reference</Arrow>
        </Branch>
        <Branch index={0}>
          <p>Rotated KL tokens → current/reference scores → mean log-ratio → clamp</p>
          <span className="grouped-stop">detach k = 0</span>
        </Branch>
      </Branches>
      <Table
        label="Observed first update: policy equals initial reference"
        headers={['Row', 'Sequence log-ratio d', 'β(d−k)', 'Weighted utility term']}
        rows={batch.details.log_ratios.map((value, index) => [
          index + 1,
          fmt(value),
          fmt(batch.details.utility_input[index]),
          fmt(batch.details.weighted_terms[index]),
        ])}
      />
      <p>
        Actual weighted mean {fmt(batch.loss)}. The saved report records score differences, not
        separate absolute current/reference sequence sums. Repeated prompts and labels are
        legitimate: row 1's rotated completion has the same IDs as its original completion.
      </p>
      <p>
        Four records coexist in this microbatch. Accumulating four one-record microbatches would not
        construct these pairings.
      </p>
    </Figure>
  );
}

export function MeasuredCandidates() {
  const masses = first.candidate_logp.map(Math.exp);
  const selectedMass = model.sum(masses);
  return (
    <Figure id="D27" label="Measured model scores and restricted action space">
      <blockquote>“{first.verse}”</blockquote>
      <p>
        Fixed evaluation ID {first.id}; retained annotation: {first.gold}.
      </p>
      <Branches>
        {labels.map((label, index) => (
          <Branch key={label} index={index}>
            <Identity index={index}>{label} + EOS</Identity>
            <Arrow>↓ selected SFT causal model</Arrow>
            <p>Sequence log probability {fmt(first.candidate_logp[index], 6)}</p>
            <p>Sequence probability {fmt(masses[index], 6)}</p>
          </Branch>
        ))}
      </Branches>
      <Bars
        label="Mass in the full response distribution"
        maximum={1}
        rows={[
          ...masses.map((value, index) => ({
            label: `${labels[index]} + EOS`,
            value,
            colour: index,
          })),
          { label: 'All other response strings (excluded)', value: 1 - selectedMass, colour: 3 },
        ]}
      />
      <Arrow>↓ condition on these three responses; divide by {fmt(selectedMass, 6)}</Arrow>
      <Bars
        label="Restricted three-action probabilities"
        maximum={1}
        rows={first.restricted_probabilities.map((value, index) => ({
          label: labels[index],
          value,
          colour: index,
        }))}
      />
      <p>
        Renormalization changes the action space. This is not unrestricted generation accuracy.
        Model: Pythia-14M → exact SFT response-17 checkpoint. Dataset: Poem Sentiment.
      </p>
      <p className="grouped-source-note">
        Model weights SHA256 {saved.model_weights_sha256}.{' '}
        <a href="/learn-code/grpo-rloo-kto/evidence/finite/report.json">
          Complete saved finite report
        </a>
        .
      </p>
    </Figure>
  );
}

export function MeasuredEstimators() {
  const [record, setRecord] = useState(0);
  const [method, setMethod] = useState('loo');
  const [size, setSize] = useState(2);
  const row = saved.rows[record];
  const d = row.comparisons.find((item) => item.method === method && item.group_size === size);
  return (
    <Figure id="D28" label="All saved finite estimator results">
      <blockquote>
        Record {row.id}: “{row.verse}”
      </blockquote>
      <p>
        Gold {row.gold}; fixed measured restricted probabilities{' '}
        {vector(row.restricted_probabilities)}. Expected reward {fmt(d.expected_reward)}.
      </p>
      <Cloud
        distribution={d}
        label="Recorded exact distribution at measured candidate probabilities"
      />
      <Table
        label="Derived independent-group reward budgets for this saved distribution"
        headers={['Reward calls', 'Independent groups', 'MSE']}
        rows={[4, 8, 16, 32].map((calls) => [
          calls,
          calls / size,
          fmt(d.covariance_trace / (calls / size) + d.bias_squared),
        ])}
      />
      <Controls
        reset={() => {
          setRecord(0);
          setMethod('loo');
          setSize(2);
        }}
      >
        <Select
          label="Fixed evaluation verse"
          value={record}
          onChange={(value) => setRecord(Number(value))}
          options={saved.rows.map((item, index) => [index, `${item.id}: ${item.verse}`])}
        />
        <Select label="Estimator" value={method} onChange={setMethod} options={model.methods} />
        <Select
          label="Group size"
          value={size}
          onChange={(value) => setSize(Number(value))}
          options={[
            [2, 'G = 2'],
            [4, 'G = 4'],
          ]}
        />
      </Controls>
      <p>
        This reads all 32 retained rows and recorded ordered-group gradients. Coordinates are
        candidate logits, not neural weights. Selecting a row performs no model inference or fit.
      </p>
    </Figure>
  );
}

export function RecordedUpdates() {
  return (
    <Figure id="D29" label="All five recorded two-update outcomes">
      <Table
        label="Fixed 32-verse evaluation; each row has exactly two updates"
        headers={[
          'Route',
          'Before NLL',
          'After NLL',
          'Correct labels',
          'Valid / EOS',
          'Generated tokens',
          'Weight-change L2',
          'Exact reload',
        ]}
        rows={saved.routes.map((route) => [
          route.name,
          fmt(route.before.nll, 6),
          fmt(route.after.nll, 6),
          `${route.after.accuracy * 32} / 32`,
          `${route.after.valid * 32} / ${route.after.eos * 32}`,
          `${route.before.generation_tokens} → ${route.after.generation_tokens}`,
          fmt(route.change.l2, 7),
          route.reload_exact ? 'yes' : 'no',
        ])}
      />
      <p>
        NLL pools 84 selected target tokens. “Valid / EOS” gives counts out of 32 for each
        criterion. Every route retained 20/32 candidate and greedy accuracy. A changed probability
        need not change the chosen label.
      </p>
      <Table
        label="Online evidence: rewards, response lengths and actual scalar loss"
        headers={['Route / step', 'Rewards', 'Selected response lengths', 'Loss']}
        rows={saved.routes
          .filter((route) => route.name !== 'native-kto')
          .flatMap((route) =>
            route.batches.map((batch, index) => [
              `${route.name} / ${index + 1}`,
              vector(batch.rewards),
              vector(batch.lengths),
              fmt(batch.loss),
            ]),
          )}
      />
      <p>
        The native all-success first group had zero reward advantage and zero initial reference
        penalty. Nearly zero mean loss in a later mixed group can coexist with nonzero gradient.
      </p>
      <Table
        label="KTO evidence: labelled utility has its own units"
        headers={['Step', 'Labels', 'Weighted utility terms', 'Reference k', 'Mean loss']}
        rows={saved.routes
          .find((route) => route.name === 'native-kto')
          .batches.map((batch, index) => [
            index + 1,
            batch.labels.map((label) => (label ? '+ D' : '− U')).join(', '),
            vector(batch.details.weighted_terms),
            fmt(batch.reference_point),
            fmt(batch.loss),
          ])}
      />
      <p>
        These overlapping demonstrations use different evidence and seeds; two updates do not
        establish convergence or superiority. Saved reloads are exact. Constructed online parity
        uses float64 and restores the original float32 state; actual training checks stay float32.
        Earlier failed checks remain provenance, not updates.
      </p>
    </Figure>
  );
}

export function MethodObjects() {
  return (
    <Figure id="D30" label="Decision map by available data object">
      <p className="grouped-tree-root">What evidence can you actually obtain?</p>
      <Branches>
        <Branch index={0}>
          <Identity index={0}>Callable reward + online generation</Identity>
          <Arrow>↓ same-prompt sampled group</Arrow>
          <Branches>
            <Branch index={0}>
              <p>GRPO: group standardization → token ratios → declared reduction</p>
            </Branch>
            <Branch index={1}>
              <p>RLOO: other-response mean → sequence score / ratio</p>
            </Branch>
          </Branches>
          <p>
            Keep old/reference roles explicit. Count reward calls and mixed groups; examine missing
            feedback.
          </p>
        </Branch>
        <Branch index={2}>
          <Identity index={2}>Individual labelled responses</Identity>
          <Arrow>↓ defensible + / − criterion</Arrow>
          <p>
            KTO: policy/reference sequence scores → detached practical reference → weighted utility
          </p>
          <p>Inspect actual microbatch pairings, class frequency, label validity and saturation.</p>
        </Branch>
        <Branch index={3}>
          <Identity index={3}>Paired preference records</Identity>
          <Arrow>↓ comparative evidence</Arrow>
          <p>DPO / SimPO: chosen/rejected response scores under their own declared objectives</p>
          <p>A preferred winner need not meet an absolute quality threshold.</p>
        </Branch>
      </Branches>
      <p>
        These are compatible possibilities, not exclusive laws. Price generation and reward calls
        separately from reference-model memory and current-model activations.
      </p>
    </Figure>
  );
}

export function ReportPolicy() {
  const p = [0.25, 0.75];
  const rewards = [Math.log(0.8), Math.log(0.4)];
  const exact = model.target(p, rewards);
  const actions = [0, 1, 1];
  const advantages = model.advantages(
    actions.map((index) => rewards[index]),
    'loo',
  );
  const gradient = p.map((probability, coordinate) =>
    model.mean(
      actions.map(
        (action, index) => advantages[index] * ((action === coordinate ? 1 : 0) - probability),
      ),
    ),
  );
  return (
    <Figure id="D31" label="A policy samples probability reports">
      <p className="grouped-tree-root">Report-selection policy: A with 0.25; B with 0.75</p>
      <Branches>
        <Branch index={0}>
          <Identity index={0}>Report action A</Identity>
          <Strip values={['class 1: 0.8', 'class 2: 0.2']} coloursByIndex={[0, 0]} />
          <Arrow>↓ observe class 1 → log 0.8</Arrow>
          <p>Reward {fmt(rewards[0])}</p>
        </Branch>
        <Branch index={1}>
          <Identity index={1}>Report action B</Identity>
          <Strip values={['class 1: 0.4', 'class 2: 0.6']} coloursByIndex={[1, 1]} />
          <Arrow>↓ observe class 1 → log 0.4</Arrow>
          <p>Reward {fmt(rewards[1])}</p>
        </Branch>
      </Branches>
      <p>
        Expected reward {fmt(exact.reward)} → exact selection-logit gradient{' '}
        {vector(exact.gradient)}.
      </p>
      <Table
        label="Changed sampled group: A, B, B"
        headers={['Drawn report', 'Reward', 'Other mean', 'LOO advantage']}
        rows={actions.map((action, index) => [
          action === 0 ? 'A' : 'B',
          fmt(rewards[action]),
          fmt(rewards[action] - advantages[index]),
          fmt(advantages[index]),
        ])}
      />
      <p>
        This one group's score estimate is {vector(gradient)}, different from its expectation. The
        random action is an entire report vector.
      </p>
      <Branches>
        <Branch index={0}>
          <p>Policy logits → probabilities of choosing fixed reports → score-function update</p>
        </Branch>
        <Branch index={2}>
          <p>
            Separate direct path: report coordinates → log q₁ → derivative with respect to
            coordinates inside the report
          </p>
        </Branch>
      </Branches>
      <p>
        Normalizing or clipping a sampled selection estimator does not turn it into direct
        proper-score differentiation or guarantee calibration.
      </p>
    </Figure>
  );
}
