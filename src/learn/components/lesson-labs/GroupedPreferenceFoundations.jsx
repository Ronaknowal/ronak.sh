import React, { useState } from 'react';
import * as model from '../../data/grouped-preference-models.js';
import {
  Figure,
  Identity,
  Controls,
  Select,
  NumberField,
  Local,
  Table,
  Strip,
  Bars,
  Branches,
  Branch,
  Arrow,
  Matrix,
  Cloud,
  Curves,
  curvePoints,
  fmt,
  vector,
} from './GroupedPreferenceElements.jsx';

const probabilities = [0.2, 0.3, 0.5];
const identities = ['A ◇', 'B ○', 'C △'];
const sizes = (first = 2, last = 4) =>
  Array.from({ length: last - first + 1 }, (_, index) => [first + index, `G = ${first + index}`]);

export function BaselineAnatomy() {
  return (
    <Figure id="D01" label="Policy, reward and baseline anatomy">
      <div className="grouped-tree-root">Prompt x: label this verse</div>
      <Branches>
        <Branch index={0}>
          <Identity index={0}>First token: “negative”</Identity>
          <Arrow>↓ EOS</Arrow>
          <p>A ◇ completed response → reward 0</p>
        </Branch>
        <Branch index={1}>
          <Identity index={1}>First token: “no”</Identity>
          <Arrow>↓ “impact” → EOS</Arrow>
          <p>B ○ completed response → reward 1</p>
        </Branch>
        <Branch index={2}>
          <Identity index={2}>First token: “positive”</Identity>
          <Arrow>↓ EOS</Arrow>
          <p>C △ completed response → reward 2</p>
        </Branch>
      </Branches>
      <Branches>
        <Branch index={2}>
          <p>Completed C → scalar reward 2</p>
          <Arrow>↘ subtract baseline</Arrow>
        </Branch>
        <Branch index={1}>
          <p>Prefix → learned value V = 1</p>
          <p>RLHF critic: comparison branch replaced by group rewards below.</p>
          <Arrow>↙ baseline 1</Arrow>
        </Branch>
      </Branches>
      <p className="grouped-center">
        Advantage 2 − 1 = +1 → multiply C’s log-probability score → policy update
      </p>
      <p>
        Old sampling policy and reference policy are separate objects; neither is this baseline.
        Values here are constructed.
      </p>
    </Figure>
  );
}

export function SamePromptGroups() {
  const [size, setSize] = useState(4);
  const [reward, setReward] = useState(2);
  const [equal, setEqual] = useState(false);
  const first = (equal ? [2, 2, 2, 2] : [0, 1, 1, reward]).slice(0, size);
  return (
    <Figure id="D02" label="Separate same-prompt reward groups">
      {[first, Array(size).fill(2)].map((values, row) => (
        <div key={row}>
          <p className="grouped-tree-root">
            Prompt {row + 1} → {size} fixed fixture draws
          </p>
          <Branches>
            {values.map((value, index) => (
              <Branch key={index} index={[0, 1, 1, 2][index]}>
                <Identity index={[0, 1, 1, 2][index]}>
                  {identities[[0, 1, 1, 2][index]]} · draw {index + 1}
                </Identity>
                <Arrow>↓ completed path → reward</Arrow>
                <output>{fmt(value)}</output>
              </Branch>
            ))}
          </Branches>
          <p>
            Own-prompt mean {fmt(model.mean(values))}; centered rewards{' '}
            {vector(values.map((value) => value - model.mean(values)))}.
          </p>
        </div>
      ))}
      <Controls
        reset={() => {
          setSize(4);
          setReward(2);
          setEqual(false);
        }}
      >
        <Select
          label="Fixture group size"
          value={size}
          onChange={(value) => setSize(Number(value))}
          options={sizes()}
        />
        <NumberField
          label="Prompt 1, draw 4 reward"
          disabled={size < 4 || equal}
          value={reward}
          onChange={setReward}
        />
        <Select
          label="Reward fixture"
          value={equal ? 'equal' : 'vary'}
          onChange={(value) => setEqual(value === 'equal')}
          options={[
            ['vary', 'Original varied group'],
            ['equal', 'All equal to 2'],
          ]}
        />
      </Controls>
      <p>
        Changing size takes the first G declared draws; it does not sample new responses. Draws 2
        and 3 repeat answer B.
      </p>
    </Figure>
  );
}

export function CausalResponseScore() {
  const [length, setLength] = useState(2);
  const [step, setStep] = useState(0);
  const response = [1, 2, 1].slice(0, length);
  const targets = [...response, 3];
  const names = ['other', 'answer₁', 'answer₂', 'EOS'];
  const selected = Math.min(step, targets.length - 1);
  const rows = Array.from({ length: length + 3 }, (_, row) => {
    const action = targets[row - 1];
    const p =
      action === undefined
        ? [0.25, 0.25, 0.25, 0.25]
        : Array.from({ length: 4 }, (_, column) => (column === action ? 0.7 : 0.1));
    return p;
  });
  return (
    <Figure id="D03" label="One causal shift and response score">
      <Strip
        values={['prompt₀', 'prompt₁', ...response.map((index) => names[index]), 'EOS', 'PAD=EOS']}
        selected={[selected + 2]}
        coloursByIndex={[3, 3, ...response.map(() => 2), 2, 3]}
        label="Input positions"
      />
      <Local label="Preceding logits by vocabulary column" selectionKey={`${length}-${selected}`}>
        <div
          className="grouped-score-grid"
          style={{ gridTemplateColumns: '12rem repeat(4, 6rem)' }}
        >
          <strong>Predicting logit row</strong>
          {names.map((name) => (
            <strong key={name}>{name}</strong>
          ))}
          {rows.map((row, index) => (
            <React.Fragment key={index}>
              <strong>
                row {index} → target {index + 1}
              </strong>
              {row.map((value, column) => (
                <span
                  key={column}
                  className={
                    index === selected + 1 && column === targets[selected]
                      ? 'grouped-target'
                      : index < 1 || index > length + 1
                        ? 'grouped-unused'
                        : ''
                  }
                >
                  {fmt(value)}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </Local>
      <p>
        Selected target position {selected + 2} ({names[targets[selected]]}) ← logit row{' '}
        {selected + 1}. Selected response sum through this target:{' '}
        {fmt((selected + 1) * Math.log(0.7))}; full sum: {fmt(targets.length * Math.log(0.7))}{' '}
        log-probability units.
      </p>
      <p>
        Prompt targets and final storage padding are excluded. Genuine EOS is selected. These
        normalized vocabulary rows are a constructed score trace.
      </p>
      <Controls
        reset={() => {
          setLength(2);
          setStep(0);
        }}
      >
        <button
          type="button"
          onClick={() => setStep(Math.max(0, selected - 1))}
          disabled={selected === 0}
        >
          Previous target
        </button>
        <button
          type="button"
          onClick={() => setStep(Math.min(targets.length - 1, selected + 1))}
          disabled={selected === targets.length - 1}
        >
          Next target
        </button>
        <Select
          label="Answer tokens before EOS"
          value={length}
          onChange={(value) => {
            setLength(Number(value));
            setStep(0);
          }}
          options={[
            [2, 'Two'],
            [3, 'Three'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function ScoreGeometry() {
  const [logits, setLogits] = useState([Math.log(0.2), Math.log(0.3)]);
  const [answer, setAnswer] = useState(2);
  const [equal, setEqual] = useState(false);
  const p = model.softmax([...logits, Math.log(0.5)]);
  const rewards = equal ? [1, 1, 1] : [0, 1, 2];
  const exact = model.target(p, rewards);
  return (
    <Figure id="D04" label="Probability and score-coordinate geometry">
      <Bars
        label="Answer probability"
        maximum={1}
        rows={p.map((value, index) => ({ label: identities[index], value }))}
      />
      <Bars
        label={`Selected ${identities[answer]} score eᵧ − p`}
        signed
        maximum={1}
        rows={p.map((value, index) => ({
          label: identities[index],
          value: (index === answer ? 1 : 0) - value,
        }))}
      />
      <Table
        label="Weighted contributions to the expected gradient"
        headers={['Draw', 'Reward', 'p × reward × score']}
        rows={p.map((value, index) => [
          <Identity index={index}>{identities[index]}</Identity>,
          rewards[index],
          vector(
            p.map((coordinate, j) => value * rewards[index] * ((index === j ? 1 : 0) - coordinate)),
          ),
        ])}
      />
      <p>
        Expected reward J = {fmt(exact.reward)}. Sum of weighted contributions ={' '}
        {vector(exact.gradient)}. Probability-weighted score sum is (0, 0, 0).
      </p>
      <Controls
        reset={() => {
          setLogits([Math.log(0.2), Math.log(0.3)]);
          setAnswer(2);
          setEqual(false);
        }}
      >
        {logits.map((value, index) => (
          <NumberField
            key={index}
            label={`Logit ${identities[index]}`}
            value={value}
            onChange={(next) => setLogits(logits.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <Select
          label="Selected answer"
          value={answer}
          onChange={(value) => setAnswer(Number(value))}
          options={identities.map((label, index) => [index, label])}
        />
        <Select
          label="Rewards"
          value={equal ? 'equal' : 'varied'}
          onChange={(value) => setEqual(value === 'equal')}
          options={[
            ['varied', '(0, 1, 2)'],
            ['equal', '(1, 1, 1)'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function BaselineDependency() {
  const [method, setMethod] = useState('constant');
  const [baseline, setBaseline] = useState(1);
  const d = model.distribution(probabilities, [0, 1, 2], 2, method, baseline);
  return (
    <Figure id="D05" label="Baseline dependency graph">
      <div className="grouped-tree-root">Fixed prompt x → independent draw y</div>
      <Branches>
        <Branch index={0}>
          <p>y → reward r(y)</p>
          <Arrow>↘ r − b</Arrow>
        </Branch>
        <Branch index={1}>
          <p>
            {method === 'own'
              ? 'y → r(y) → own baseline b'
              : `Independent constant → baseline b = ${fmt(baseline)}`}
          </p>
          <Arrow>↙ subtract</Arrow>
        </Branch>
        <Branch index={2}>
          <p>y → log p(y) → score s(y)</p>
          <Arrow>↓ multiply advantage</Arrow>
        </Branch>
      </Branches>
      <Bars
        label="Expected gradient and target on the same coordinate scale"
        signed
        maximum={0.4}
        rows={d.mean_gradient.flatMap((value, index) => [
          { label: `Mean ${identities[index]}`, value, colour: index },
          { label: `Target ${identities[index]}`, value: d.target_gradient[index], colour: index },
        ])}
      />
      <p>
        Exactly enumerated G = 2: covariance trace {fmt(d.covariance_trace)}, target{' '}
        {vector(d.target_gradient)}.{' '}
        {method === 'own'
          ? 'Own-reward dependence makes every advantage zero.'
          : 'The independent baseline changes spread while preserving the mean.'}
      </p>
      <Controls
        reset={() => {
          setMethod('constant');
          setBaseline(1);
        }}
      >
        <Select
          label="Baseline dependence"
          value={method}
          onChange={setMethod}
          options={[
            ['constant', 'Independent constant'],
            ['own', 'Own reward'],
          ]}
        />
        <NumberField
          label="Constant baseline b"
          disabled={method === 'own'}
          value={baseline}
          onChange={setBaseline}
        />
      </Controls>
    </Figure>
  );
}

export function SelfMeanFactor() {
  const [size, setSize] = useState(4);
  const [reward, setReward] = useState(2);
  const [equal, setEqual] = useState(false);
  const d = model.distribution(
    probabilities,
    equal ? [1, 1, 1] : [0, 1, reward],
    size,
    'self_mean',
  );
  return (
    <Figure id="D06" label="Own-reward influence in a group mean">
      <Matrix
        label="Every row's baseline reads every reward"
        size={size}
        cell={(row, column) => (
          <span className={row === column ? 'grouped-selected' : ''}>
            {row === column ? 'own ' : ''}1/{size}
          </span>
        )}
      />
      <p>
        Outlined diagonal: each response subtracts {fmt(1 / size)} of its own reward signal.
        Off-diagonal independent terms have zero expected score product.
      </p>
      <Bars
        label="Exactly enumerated expectation versus analytic target"
        signed
        maximum={Math.max(0.05, ...d.target_gradient.map(Math.abs))}
        rows={d.mean_gradient.flatMap((value, index) => [
          { label: `Centered ${identities[index]}`, value, colour: index },
          { label: `Target ${identities[index]}`, value: d.target_gradient[index], colour: index },
        ])}
      />
      <p>
        Factor (G−1)/G = {fmt((size - 1) / size)}; enumerated mean {vector(d.mean_gradient)} from{' '}
        {3 ** size} ordered groups.
      </p>
      <Controls
        reset={() => {
          setSize(4);
          setReward(2);
          setEqual(false);
        }}
      >
        <Select
          label="Independent draws"
          value={size}
          onChange={(value) => setSize(Number(value))}
          options={sizes(2, 5)}
        />
        <NumberField label="Answer C reward" disabled={equal} value={reward} onChange={setReward} />
        <Select
          label="Reward fixture"
          value={equal ? 'equal' : 'varied'}
          onChange={(value) => setEqual(value === 'equal')}
          options={[
            ['varied', 'Varied rewards'],
            ['equal', 'All rewards 1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function LeaveOneOutMatrix() {
  const [rewards, setRewards] = useState([0, 1, 1, 2]);
  const [size, setSize] = useState(4);
  const active = rewards.slice(0, size);
  const values = model.advantages(active, 'loo');
  return (
    <Figure id="D07" label="Leave-one-out exclusion matrix">
      <Matrix
        label="Cross out each row's own reward"
        size={size}
        cell={(row, column) =>
          row === column ? '× excluded' : `${fmt(active[column])} / ${size - 1}`
        }
      />
      <Table
        label="Result for each draw"
        headers={['Draw', 'Reward', 'Other mean', 'LOO advantage', 'Raw centered']}
        rows={active.map((reward, index) => [
          `draw ${index + 1}`,
          fmt(reward),
          size > 1 ? fmt((model.sum(active) - reward) / (size - 1)) : 'undefined',
          values ? fmt(values[index]) : 'undefined',
          fmt(reward - model.mean(active)),
        ])}
      />
      <p>
        {size > 1
          ? `LOO = ${fmt(size / (size - 1))} × raw centered for this group, before scaling or clipping.`
          : 'G = 1 has no other response. No leave-one-out baseline exists.'}
      </p>
      <Controls
        reset={() => {
          setRewards([0, 1, 1, 2]);
          setSize(4);
        }}
      >
        <Select
          label="Group size"
          value={size}
          onChange={(value) => setSize(Number(value))}
          options={sizes(1)}
        />
        {active.map((reward, index) => (
          <NumberField
            key={index}
            label={`Draw ${index + 1} reward`}
            value={reward}
            onChange={(next) => setRewards(rewards.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <button type="button" onClick={() => setRewards([1, 1, 1, 1])}>
          All rewards 1
        </button>
      </Controls>
    </Figure>
  );
}

export function IndependenceTrees() {
  return (
    <Figure id="D08" label="Two independent conditional draws">
      <p className="grouped-tree-root">Condition on the same fixed prompt x</p>
      <Branches>
        <Branch index={0}>
          <Identity index={0}>Separate random draw j</Identity>
          <Branches>
            <Branch index={0}>A .2</Branch>
            <Branch index={1}>B .3</Branch>
            <Branch index={2}>C .5</Branch>
          </Branches>
          <Arrow>↓ reward rⱼ → baseline b₋ᵢ</Arrow>
        </Branch>
        <Branch index={1}>
          <Identity index={1}>Separate random draw i</Identity>
          <Branches>
            <Branch index={0}>A .2</Branch>
            <Branch index={1}>B .3</Branch>
            <Branch index={2}>C .5</Branch>
          </Branches>
          <Arrow>↓ score sᵢ = eᵢ − p</Arrow>
        </Branch>
      </Branches>
      <p className="grouped-center">
        Joint weight p(yⱼ|x) p(yᵢ|x) → E[b₋ᵢ|x] × E[sᵢ|x] → E[b₋ᵢ|x] × 0 = 0
      </p>
      <p className="grouped-center">
        × Reusing i's own draw inserts yᵢ → bᵢ; the factorization fails.
      </p>
      <p>
        Independent samples can have identical text. Copying one sample gives identical rewards by
        dependence and makes LOO zero even when the target is nonzero.
      </p>
    </Figure>
  );
}

export function GradientDistribution() {
  const [method, setMethod] = useState('loo');
  const [size, setSize] = useState(2);
  const [reward, setReward] = useState(2);
  const [equal, setEqual] = useState(false);
  const [logits, setLogits] = useState([Math.log(0.2), Math.log(0.3)]);
  const p = model.softmax([...logits, Math.log(0.5)]);
  const d = model.distribution(p, equal ? [1, 1, 1] : [0, 1, reward], size, method);
  return (
    <Figure id="D09" label="Exact estimator gradient cloud">
      <Cloud distribution={d} />
      <p>
        Constructed p = {vector(p)}. A and B logits are editable; C stays at log(0.5). Constant
        baseline is 0.5. Standardization uses sample spread plus 0.0001 and can change the expected
        target.
      </p>
      <Controls
        reset={() => {
          setMethod('loo');
          setLogits([Math.log(0.2), Math.log(0.3)]);
          setSize(2);
          setReward(2);
          setEqual(false);
        }}
      >
        {logits.map((value, index) => (
          <NumberField
            key={index}
            label={`Constructed ${index === 0 ? 'A' : 'B'} logit`}
            value={value}
            onChange={(next) => setLogits(logits.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <Select label="Estimator" value={method} onChange={setMethod} options={model.methods} />
        <Select
          label="Group size"
          value={size}
          onChange={(value) => setSize(Number(value))}
          options={sizes()}
        />
        <NumberField label="Answer C reward" disabled={equal} value={reward} onChange={setReward} />
        <Select
          label="Reward fixture"
          value={equal ? 'equal' : 'varied'}
          onChange={(value) => setEqual(value === 'equal')}
          options={[
            ['varied', 'Varied'],
            ['equal', 'All equal'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function RewardBudget() {
  const [method, setMethod] = useState('loo');
  const [scale, setScale] = useState(1);
  const budgets = [4, 8, 16, 32];
  const distributions = [2, 4].map((size) =>
    model.distribution(probabilities, [0, scale, 2 * scale], size, method),
  );
  const series = distributions.map((d, index) => ({
    name: `G = ${[2, 4][index]}`,
    points: budgets.map((budget) => [
      budget,
      d.covariance_trace / (budget / [2, 4][index]) + d.bias_squared,
    ]),
  }));
  return (
    <Figure id="D10" label="MSE per equal reward-call budget">
      <Curves series={series} domain={[4, 32]} label="Reward calls (horizontal), MSE (vertical)" />
      <Table
        label="Exact budget arithmetic; connecting segments guide the eye"
        headers={['Reward calls', 'G = 2 MSE', 'G = 4 MSE']}
        rows={budgets.map((budget, index) => [
          budget,
          fmt(series[0].points[index][1]),
          fmt(series[1].points[index][1]),
        ])}
      />
      <p>
        MSE = covariance trace / independent groups + squared bias. The policy stays fixed and all
        calls have equal cost. Standardized estimates can target a different expectation; MSE here
        remains relative to the raw reward gradient.
      </p>
      <Controls
        reset={() => {
          setMethod('loo');
          setScale(1);
        }}
      >
        <Select label="Estimator" value={method} onChange={setMethod} options={model.methods} />
        <NumberField label="Reward scale" value={scale} min={0} max={3} onChange={setScale} />
      </Controls>
    </Figure>
  );
}

export function StandardizationRows() {
  const [rewards, setRewards] = useState([0, 1, 1, 2]);
  const [sample, setSample] = useState(true);
  const [valid, setValid] = useState(4);
  const data = model.standardize(
    rewards.map((value, index) => (index < valid ? value : null)),
    sample,
  );
  return (
    <Figure id="D11" label="Centering and standardization rows">
      <Table
        label="Aligned transformations; missing entries stay missing"
        headers={['Stage', 'draw 1', 'draw 2', 'draw 3', 'draw 4']}
        rows={[
          ['Reward', ...rewards.map((value, index) => (index < valid ? fmt(value) : 'missing'))],
          ['Subtract mean', ...data.deviations.map((value) => fmt(value))],
          ['Divide by spread + ε', ...data.values.map((value) => fmt(value))],
        ]}
      />
      <p>
        Valid count {valid}; mean {fmt(data.center)}; {sample ? 'sample' : 'population'} variance{' '}
        {fmt(data.variance)}; standard deviation {fmt(data.std)}; ε = 0.0001.
      </p>
      <p>
        {data.std === null
          ? 'One valid reward cannot define sample spread. Native handling returns zero reward advantage with the valid count; that is a missing-comparison fallback.'
          : data.std === 0
            ? 'Equal observed rewards give zero numerator. This differs from missing feedback.'
            : 'The denominator is computed from this same observed group.'}{' '}
        A separate reference penalty may still contribute.
      </p>
      <Controls
        reset={() => {
          setRewards([0, 1, 1, 2]);
          setSample(true);
          setValid(4);
        }}
      >
        {rewards.map((value, index) => (
          <NumberField
            key={index}
            label={`Reward ${index + 1}`}
            disabled={index >= valid}
            value={value}
            onChange={(next) => setRewards(rewards.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <Select
          label="Spread convention"
          value={sample ? 'sample' : 'population'}
          onChange={(value) => setSample(value === 'sample')}
          options={[
            ['sample', 'Sample / (n−1)'],
            ['population', 'Population / n'],
          ]}
        />
        <Select
          label="Observed rewards"
          value={valid}
          onChange={(value) => setValid(Number(value))}
          options={[
            [4, 'All four'],
            [3, 'First three'],
            [1, 'Only first'],
          ]}
        />
        <button type="button" onClick={() => setRewards([1, 1, 1, 1])}>
          All equal
        </button>
      </Controls>
    </Figure>
  );
}

export function QuestionWeighting() {
  const [q, setQ] = useState([0.1, 0.7]);
  const rows = q.map((probability) => ({
    probability,
    target: probability * (1 - probability),
    mixed: 1 - probability ** 4 - (1 - probability) ** 4,
    estimates: ['self_mean', 'loo', 'standardized'].map(
      (method) =>
        model.distribution([1 - probability, probability], [0, 1], 4, method).mean_gradient[1],
    ),
  }));
  return (
    <Figure id="D12" label="Bernoulli questions and group weighting">
      <Branches>
        {rows.map((row, index) => (
          <Branch key={index} index={index}>
            <Identity index={index}>Question {index + 1}, four independent draws</Identity>
            <Branches>
              <Branch index={0}>Failure: {fmt(1 - row.probability)} → reward 0</Branch>
              <Branch index={2}>Success: {fmt(row.probability)} → reward 1</Branch>
            </Branches>
            <p>Mixed-group probability {fmt(row.mixed)}</p>
          </Branch>
        ))}
      </Branches>
      <Bars
        label="Expected success-logit gradient"
        maximum={Math.max(0.3, ...rows.flatMap((row) => row.estimates))}
        rows={rows.flatMap((row, index) => [
          { label: `Q${index + 1} exact q(1−q)`, value: row.target, colour: index },
          ...row.estimates.map((value, i) => ({
            label: `Q${index + 1} ${['self mean', 'LOO', 'standardized'][i]}`,
            value,
            colour: index,
          })),
        ])}
      />
      <p>
        The expectation sums over 16 possible binary groups per question; zero-probability groups
        contribute zero and are omitted from enumeration. The coordinates belong to these separate
        constructed Bernoulli logits.
      </p>
      <Controls reset={() => setQ([0.1, 0.7])}>
        {q.map((value, index) => (
          <NumberField
            key={index}
            label={`Question ${index + 1} success probability`}
            value={value}
            min={0}
            max={1}
            onChange={(next) => setQ(q.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <button type="button" onClick={() => setQ([0.5, 0.5])}>
          Equal questions
        </button>
      </Controls>
    </Figure>
  );
}
