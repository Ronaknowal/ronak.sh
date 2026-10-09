import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  NumberField,
  Local,
  Table,
  Strip,
  Identity,
  Arrow,
  Bars,
  Curves,
  curvePoints,
  colours,
  fmt,
  vector,
} from './DapoElements.jsx';
import {
  clippedTerm,
  probabilityStep,
  entropy,
  raggedLoss,
  lengthPenalty,
  groupStatistics,
  sum,
  workedTrace,
} from '../../data/dapo-models.js';

export function SignedClip() {
  const [ratio, setRatio] = useState(1.25);
  const [advantage, setAdvantage] = useState(1);
  const [high, setHigh] = useState(0.28);
  const term = clippedTerm(ratio, advantage, high);
  return (
    <Figure id="D07" label="Signed clipping changes which side is flat">
      <Curves
        label="Ratio → maximized surrogate"
        domain={[0.2, 1.8]}
        marker={ratio}
        vertical={[0.8, 1 + high]}
        series={[
          {
            name: 'positive A = +1',
            points: curvePoints(0.2, 1.8, (r) => clippedTerm(r, 1, high).surrogate, 100, [
              0.8,
              1 + high,
            ]),
          },
          {
            name: 'negative A = −1',
            points: curvePoints(0.2, 1.8, (r) => clippedTerm(r, -1, high).surrogate, 100, [
              0.8,
              1 + high,
            ]),
          },
        ]}
      />
      <p>
        Selected A = {advantage}: raw rA = {fmt(ratio * advantage)}; clipped-ratio contribution ={' '}
        {fmt(term.clipped * advantage)}; surrogate = {fmt(term.surrogate)}; loss = {fmt(term.loss)}.
      </p>
      <p>
        {term.kink
          ? 'This active signed knee has no unique mathematical derivative.'
          : `Selected-logp loss derivative = ${fmt(term.derivative)}.`}{' '}
        Positive A flattens only at the upper boundary; negative A flattens only below the lower
        boundary; zero A is flat everywhere.
      </p>
      <Controls
        reset={() => {
          setRatio(1.25);
          setAdvantage(1);
          setHigh(0.28);
        }}
      >
        <NumberField
          label="Likelihood ratio"
          value={ratio}
          onChange={setRatio}
          min={0.2}
          max={1.8}
          step={0.01}
        />
        <Select
          label="Advantage sign"
          value={advantage}
          onChange={(v) => setAdvantage(Number(v))}
          options={[
            [1, '+1'],
            [-1, '−1'],
            [0, '0'],
          ]}
        />
        <Select
          label="Upper epsilon"
          value={high}
          onChange={(v) => setHigh(Number(v))}
          options={[
            [0.2, '.20 symmetric'],
            [0.28, '.28 Clip-Higher'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ProbabilitySimplex() {
  const [old, setOld] = useState(0.1);
  const [rate, setRate] = useState(2);
  const result = probabilityStep([old, 1 - old], 0, 1, rate);
  const next = result.after[0];
  const x = (p) => 50 + 500 * p;
  return (
    <Figure id="D08" label="An optimizer step is not a hard clipping projection">
      <Local
        label="Two-outcome probability simplex with old, new and nominal ratio ceiling"
        minWidth="35rem"
      >
        <svg
          viewBox="0 0 610 190"
          className="dapo-plot"
          role="img"
          aria-label={`Old selected probability ${old}; new ${next}; nominal1.28 times old ${1.28 * old}`}
        >
          <path d="M50 90H550" stroke="#aaa" strokeWidth="2" />
          <text x="35" y="125" fill="#ddd">
            0
          </text>
          <text x="545" y="125" fill="#ddd">
            1
          </text>
          <path d={`M${x(old)} 90H${x(next)}`} stroke={colours[0]} strokeWidth="5" />
          <circle cx={x(old)} cy="90" r="7" fill="none" stroke="#ddd" />
          <circle cx={x(next)} cy="90" r="7" fill={colours[0]} />
          {old * 1.28 <= 1 && (
            <path d={`M${x(old * 1.28)} 45V140`} stroke={colours[1]} strokeDasharray="4 4" />
          )}
          <text x="50" y="30" fill="#ddd">
            p(action 0) + p(action 1) = 1
          </text>
          <text x="50" y="170" fill={colours[1]}>
            Dashed: nominal upper ratio boundary, when inside simplex
          </text>
        </svg>
      </Local>
      <p>
        Old p = {fmt(old)}; after one logit SGD step p = {fmt(next)}; ratio ={' '}
        <strong>{fmt(next / old)}</strong>. Other probability = {fmt(1 - next)}.{' '}
        {next / old > 1.28
          ? 'The step crosses the nominal threshold.'
          : 'This step stays below the nominal threshold.'}{' '}
        Its gradient was computed at ratio 1 before the step.
      </p>
      <Controls
        reset={() => {
          setOld(0.1);
          setRate(2);
        }}
      >
        <Select
          label="Old action probability"
          value={old}
          onChange={(v) => setOld(Number(v))}
          options={[
            [0.1, '.10 rare'],
            [0.8, '.80 common'],
          ]}
        />
        <NumberField
          label="Constructed logit step size"
          value={rate}
          onChange={setRate}
          min={0}
          max={8}
          step={0.25}
        />
      </Controls>
    </Figure>
  );
}
export function EntropyChange() {
  const [selected, setSelected] = useState(0);
  const [high, setHigh] = useState(0.28);
  const before = [0.8, 0.15, 0.05];
  const result = probabilityStep(before, selected, 1, 0.7, high, 1.24);
  return (
    <Figure id="D09" label="A wider ratio incentive does not determine entropy direction">
      <Bars
        label="Token probability before"
        maximum={1}
        rows={before.map((value, i) => ({ label: `Token ${i}`, value, colour: i }))}
      />
      <Bars
        label="Token probability after one constructed logit step"
        maximum={1}
        rows={result.after.map((value, i) => ({ label: `Token ${i}`, value, colour: i }))}
      />
      <Table
        label="The same token identities contribute to categorical entropy"
        headers={['Token', 'Before −p log p', 'After −p log p']}
        rows={before.map((p, i) => [
          <Identity index={i}>{i}</Identity>,
          fmt(-p * Math.log(p)),
          fmt(-result.after[i] * Math.log(result.after[i])),
        ])}
      />
      <p>
        Entropy {fmt(entropy(before))} → {fmt(entropy(result.after))} nats. The scalar ratio 1.24
        describes an already changed sampled score; the display shows an additional constructed
        logit step with rate .7.{' '}
        {high === 0.2
          ? 'Its positive term is already flat; this term supplies no further step.'
          : 'The wider upper boundary still allows a gradient.'}
      </p>
      <Controls
        reset={() => {
          setSelected(0);
          setHigh(0.28);
        }}
      >
        <Select
          label="Rewarded token"
          value={selected}
          onChange={(v) => setSelected(Number(v))}
          options={[
            [0, 'Common token 0'],
            [2, 'Rare token 2'],
          ]}
        />
        <Select
          label="Clipping recipe"
          value={high}
          onChange={(v) => setHigh(Number(v))}
          options={[
            [0.2, 'Symmetric .20'],
            [0.28, 'Upper .28'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function NegativeDualClip() {
  const [ratio, setRatio] = useState(12);
  const [enabled, setEnabled] = useState('yes');
  const term = clippedTerm(ratio, -2, 0.28, 0.2, enabled === 'yes' ? 10 : null);
  return (
    <Figure id="D10" label="Optional dual clipping caps a different negative-advantage branch">
      <Curves
        label="Ratio → minimized loss for A = −2"
        domain={[0.2, 15]}
        marker={ratio}
        vertical={[0.8, 10]}
        series={[
          {
            name: 'ordinary asymmetric loss',
            points: curvePoints(0.2, 15, (r) => clippedTerm(r, -2).loss, 100, [0.8, 10]),
          },
          {
            name: 'optional c = 10',
            dashed: true,
            points: curvePoints(
              0.2,
              15,
              (r) => clippedTerm(r, -2, 0.28, 0.2, 10).loss,
              100,
              [0.8, 10],
            ),
          },
        ]}
      />
      <p>
        Current loss {fmt(term.loss)};{' '}
        {term.kink
          ? 'at a nondifferentiable active knee'
          : `logp derivative ${fmt(term.derivative)}`}
        . The extra negative-advantage loss ceiling is −cA = 20. The primary local study disables
        it.
      </p>
      <Controls
        reset={() => {
          setRatio(12);
          setEnabled('yes');
        }}
      >
        <NumberField
          label="Ratio"
          value={ratio}
          onChange={setRatio}
          min={0.2}
          max={15}
          step={0.1}
        />
        <Select
          label="Optional dual cap"
          value={enabled}
          onChange={setEnabled}
          options={[
            ['yes', 'Enabled c = 10'],
            ['no', 'Disabled'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function RaggedWeights() {
  const [long, setLong] = useState(6);
  const [reduction, setReduction] = useState('response');
  const lengths = [2, long];
  return (
    <Figure id="D11" label="Response-equal versus token-equal coefficients on actual ragged cells">
      <Local label="Ragged token-weight matrix" minWidth="32rem">
        <div className="dapo-ragged">
          {lengths.map((length, row) => (
            <div key={row}>
              <Identity index={row}>{row === 0 ? 'A' : 'B'}</Identity>
              <span className="dapo-masked">prompt</span>
              {Array.from({ length }, (_, i) => (
                <span key={i} style={{ '--entity': colours[row] }}>
                  {fmt(reduction === 'response' ? 1 / (2 * length) : 1 / (2 + long), 4)}
                </span>
              ))}
              {Array.from({ length: Math.max(...lengths) - length }, (_, i) => (
                <span key={`pad${i}`} className="dapo-masked">
                  PAD
                </span>
              ))}
              <strong>Σ = {fmt(reduction === 'response' ? 0.5 : length / (2 + long))}</strong>
            </div>
          ))}
        </div>
      </Local>
      <p>
        Selected counts: 2 and {long}.{' '}
        {reduction === 'response'
          ? 'Each response receives total coefficient 1/2.'
          : 'Each selected token receives the same coefficient; longer responses receive more total weight.'}{' '}
        Prompt and positional padding are excluded.
      </p>
      <Controls
        reset={() => {
          setLong(6);
          setReduction('response');
        }}
      >
        <NumberField
          label="B selected length"
          value={long}
          onChange={setLong}
          min={2}
          max={10}
          step={1}
        />
        <Select
          label="Normalization"
          value={reduction}
          onChange={setReduction}
          options={[
            ['response', 'Equal responses'],
            ['token', 'Equal selected tokens'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function LossMass() {
  const [value, setValue] = useState(3);
  const [mask, setMask] = useState('all');
  const rows = [2, 6].map((length, row) =>
    Array.from({ length }, (_, i) => ({
      value: row === 0 ? 1 : i === 0 ? value : 3,
      selected: mask !== 'empty' && (mask !== 'drop' || row === 0 || i !== 0),
    })),
  );
  const total = raggedLoss(rows);
  return (
    <Figure id="D12" label="Signed token terms feed one numerator and one selected count">
      <Local label="Selected values remain at their ragged token addresses" minWidth="32rem">
        <div className="dapo-ragged">
          {rows.map((row, i) => (
            <div key={i}>
              <Identity index={i}>{i === 0 ? 'A' : 'B'}</Identity>
              {row.map((cell, j) => (
                <span
                  key={j}
                  className={cell.selected ? '' : 'dapo-masked'}
                  style={{ '--entity': colours[i] }}
                >
                  {cell.selected ? fmt(cell.value) : 'excluded'}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Local>
      <Arrow>
        selected terms → numerator {fmt(sum(total.sums))}; selected cells → count {total.count}
      </Arrow>
      <p>
        <strong>
          {total.loss === null
            ? 'Undefined: zero selected-token denominator. The scratch program rejects this input.'
            : `Token mean = ${fmt(sum(total.sums))} / ${total.count} = ${fmt(total.loss)}`}
        </strong>
      </p>
      <Controls
        reset={() => {
          setValue(3);
          setMask('all');
        }}
      >
        <NumberField
          label="B first token loss"
          disabled={mask !== 'all'}
          value={value}
          onChange={setValue}
          min={-5}
          max={5}
          step={0.5}
        />
        {mask !== 'all' && (
          <p>This token is excluded by the selected mask, so its loss control is disabled.</p>
        )}
        <Select
          label="Selected mask"
          value={mask}
          onChange={setMask}
          options={[
            ['all', 'All response tokens'],
            ['drop', 'Exclude B first token'],
            ['empty', 'Exclude every token'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function TerminationMasks() {
  const [intervention, setIntervention] = useState('reward');
  const [sibling, setSibling] = useState(1);
  const sequences = [
    ['x', '12', 'EOS'],
    ['x', 'x', 'x', '…'],
    ['x', 'x', '12', 'EOS'],
  ];
  const terminated = [true, false, true];
  const baseRewards = [1, intervention === 'reward' ? 0 : -1, sibling, 1];
  const rewards = baseRewards.map(
    (value, index) => value + (intervention === 'soft' ? [-0.5, -1, -1, 0][index] : 0),
  );
  const stats = groupStatistics(rewards);
  return (
    <Figure id="D17" label="Reward changes, loss masks and EOS stopping are distinct">
      <Local label="Three aligned response traces under a four-token cap" minWidth="34rem">
        <div className="dapo-ragged">
          {sequences.map((row, i) => (
            <div key={i}>
              <Identity index={i}>{['early EOS', 'cap, no EOS', 'EOS at cap'][i]}</Identity>
              {Array.from({ length: 4 }, (_, j) => (
                <span
                  key={j}
                  className={
                    j >= row.length || (intervention === 'mask' && !terminated[i])
                      ? 'dapo-masked'
                      : ''
                  }
                  style={{ '--entity': colours[i] }}
                >
                  {row[j] ?? 'PAD'}
                </span>
              ))}
              <strong>{terminated[i] ? 'terminated' : 'truncated'}</strong>
            </div>
          ))}
        </div>
      </Local>
      <p>
        The last row’s EOS at the cap remains a genuine selected action.{' '}
        {intervention === 'mask'
          ? 'The middle row’s entire loss mask is removed; its reward can still enter sibling normalization.'
          : intervention === 'soft'
            ? 'A soft penalty changes the reward; token validity remains unchanged.'
            : 'Assigning reward zero does not erase selected token terms.'}
      </p>
      <Strip
        label="Reward normalization example including a fourth sibling"
        values={rewards.map((r, i) => `${r} → A ${fmt(stats.advantages[i])}`)}
      />
      <p>
        For the shown reward group, the middle response’s coefficient is {fmt(stats.advantages[1])}.
        Soft penalties at lengths 3, 4, 4 with cap 4/buffer 2 are −.5, −1, −1; the fourth sibling
        has no penalty.
        {intervention === 'soft'
          ? ' These penalties are included in the displayed rewards and coefficients.'
          : ' These penalties are not added in this selected intervention.'}
      </p>
      <Controls
        reset={() => {
          setIntervention('reward');
          setSibling(1);
        }}
      >
        <Select
          label="Intervention to inspect"
          value={intervention}
          onChange={setIntervention}
          options={[
            ['reward', 'Set middle reward to zero'],
            ['mask', 'Mask truncated response'],
            ['soft', 'Inspect soft penalties'],
          ]}
        />
        <Select
          label="Third sibling correctness reward"
          value={sibling}
          onChange={(v) => setSibling(Number(v))}
          options={[
            [1, '+1'],
            [-1, '−1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function LengthBuffer() {
  const [length, setLength] = useState(6);
  const [buffer, setBuffer] = useState(4);
  const [eos, setEos] = useState('yes');
  const [hard, setHard] = useState('no');
  const penalty = lengthPenalty(length, 8, buffer);
  const rewards = [1 + penalty, -1, 1, 1];
  const stats = groupStatistics(rewards);
  return (
    <Figure id="D18" label="Length shaping changes a reward before group normalization">
      <Curves
        label="Emitted length → additive reward penalty"
        domain={[0, 10]}
        marker={length}
        yDomain={[-1.1, 0.1]}
        vertical={[8 - buffer, 8]}
        series={[
          {
            name: `Cap 8; buffer ${buffer}`,
            points: curvePoints(0, 10, (x) => lengthPenalty(x, 8, buffer), 100, [8 - buffer, 8]),
          },
        ]}
      />
      <Strip
        label="Correctness plus penalty becomes a group coefficient"
        values={[
          `A: +1 ${fmt(penalty)} = ${fmt(rewards[0])}`,
          `mean ${fmt(stats.mean)}`,
          `SD ${fmt(stats.sd)}`,
          `A coefficient ${fmt(stats.advantages[0])}`,
        ]}
      />
      <p>
        Optional hard-mask selected count for A:{' '}
        <strong>{hard === 'yes' && eos === 'no' ? 0 : length}</strong>. Penalty calculation is
        independent of that selection. EOS at length 8 is terminated; “no EOS” means this is a
        declared truncation fixture.
      </p>
      <Controls
        reset={() => {
          setLength(6);
          setBuffer(4);
          setEos('yes');
          setHard('no');
        }}
      >
        <NumberField
          label="Emitted length"
          value={length}
          onChange={setLength}
          min={1}
          max={8}
          step={1}
        />
        <NumberField
          label="Positive buffer"
          value={buffer}
          onChange={setBuffer}
          min={1}
          max={8}
          step={1}
        />
        <Select
          label="Termination"
          value={eos}
          onChange={setEos}
          options={[
            ['yes', 'EOS emitted'],
            ['no', 'Stopped without EOS'],
          ]}
        />
        <Select
          label="Hard loss masking"
          value={hard}
          onChange={setHard}
          options={[
            ['no', 'Disabled'],
            ['yes', 'Mask truncated'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function SoftmaxGradient() {
  const [action, setAction] = useState(0);
  const [advantage, setAdvantage] = useState(1);
  const probabilities = [0.5, 0.3, 0.2];
  const result = probabilityStep(probabilities, action, advantage, 0.1, 0.28, 1.1);
  return (
    <Figure id="D19" label="A selected log probability backpropagates to all logits">
      <Strip
        label="One prefix's normalized vocabulary probabilities"
        values={probabilities.map((p, i) => `p${i} = ${p}`)}
        selected={[action]}
      />
      <Arrow>
        gather action {action} → ratio 1.1 → signed coefficient −rA = {fmt(-1.1 * advantage)}
      </Arrow>
      <Table
        label="Softmax coupling expands the scalar derivative"
        headers={['Logit coordinate', 'one-hot − probability', 'loss gradient, Z = 1']}
        rows={probabilities.map((p, i) => [
          <Identity index={i}>z{i}</Identity>,
          fmt((i === action ? 1 : 0) - p),
          fmt(result.gradient[i]),
        ])}
      />
      <Bars
        label="All-coordinate gradient"
        signed
        rows={result.gradient.map((value, i) => ({ label: `z${i}`, value, colour: i }))}
      />
      <p>
        The coordinates sum to {fmt(sum(result.gradient))}; an additive shift to all logits cannot
        change probabilities. For a selected-token batch denominator Z, divide each contribution by
        Z before summing.
      </p>
      <Controls
        reset={() => {
          setAction(0);
          setAdvantage(1);
        }}
      >
        <Select
          label="Selected token"
          value={action}
          onChange={(v) => setAction(Number(v))}
          options={[
            [0, 'Token 0'],
            [1, 'Token 1'],
            [2, 'Token 2'],
          ]}
        />
        <Select
          label="Advantage"
          value={advantage}
          onChange={(v) => setAdvantage(Number(v))}
          options={[
            [1, '+1'],
            [-1, '−1'],
            [0, '0'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function MicrobatchCount() {
  const [split, setSplit] = useState(2);
  const terms = [1, 1, 3, 3, 3, 3, 3, 3];
  const partitions = [terms.slice(0, split), terms.slice(split)];
  const wrong = sum(partitions.map((row) => sum(row) / row.length)) / 2;
  return (
    <Figure id="D20" label="Changing a microbatch partition must preserve the global denominator">
      <Local label="The same eight loss cells partition into two microbatches" minWidth="32rem">
        <div className="dapo-ragged">
          {partitions.map((row, i) => (
            <div key={i}>
              <Identity index={i}>batch {i + 1}</Identity>
              {row.map((v, j) => (
                <span key={j} style={{ '--entity': colours[i] }}>
                  {v}
                </span>
              ))}
              <strong>
                sum {sum(row)} / count {row.length}
              </strong>
            </div>
          ))}
        </div>
      </Local>
      <p>
        Correct: {sum(partitions[0])}/8 + {sum(partitions[1])}/8 = <strong>2.5</strong>. Mean of
        local means = <strong>{fmt(wrong)}</strong>. Only the incorrect estimator changes when the
        partition moves.
      </p>
      <Controls reset={() => setSplit(2)}>
        <NumberField
          label="First microbatch token count"
          value={split}
          onChange={setSplit}
          min={1}
          max={7}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
export function FullTrace() {
  const [reward, setReward] = useState(-1);
  const result = workedTrace(reward);
  return (
    <Figure
      id="D35"
      label="A complete two-response trace through coefficients, clipping and gradients"
    >
      <Strip
        label="Reward group statistics"
        values={[
          `rewards ${vector(result.rewards)}`,
          `mean ${fmt(result.stats.mean)}`,
          `SD ${fmt(result.stats.sd)}`,
          `advantages ${vector(result.stats.advantages)}`,
        ]}
      />
      <Table
        label="Each selected token retains its identity and local derivative"
        headers={['Response: position', 'ratio', 'A', 'loss term', '∂loss / ∂logp, after /5']}
        rows={result.rows.flatMap((row, i) =>
          row.map((cell, j) => [
            <Identity index={i}>
              {i === 0 ? 'A' : 'B'}:{j}
            </Identity>,
            cell.ratio,
            fmt(result.stats.advantages[i]),
            fmt(cell.loss),
            fmt(cell.derivative),
          ]),
        )}
      />
      <p>
        Pooled loss = <strong>{fmt(result.loss)}</strong>.{' '}
        {reward === 1
          ? 'Equal rewards give zero reward advantages and zero policy terms at β = 0.'
          : 'B’s ratio 1.3 lies on the positive flat branch; A’s two negative terms remain active.'}
      </p>
      <p>
        For B’s first action with p = (.2, .5, .3), its full logit-gradient contribution is{' '}
        {vector([0.8, -0.5, -0.3].map((value) => value * result.rows[1][0].derivative))}. The
        selected-logp scalar reaches every coupled logit.
      </p>
      <Controls reset={() => setReward(-1)}>
        <Select
          label="A outcome reward"
          value={reward}
          onChange={(v) => setReward(Number(v))}
          options={[
            [-1, '−1: mixed group'],
            [1, '+1: homogeneous group'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
