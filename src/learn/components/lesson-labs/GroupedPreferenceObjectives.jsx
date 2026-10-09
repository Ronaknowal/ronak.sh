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
  Curves,
  curvePoints,
  fmt,
  vector,
} from './GroupedPreferenceElements.jsx';

export function PolicySnapshots() {
  return (
    <Figure id="D13" label="Old current and reference policy lifetimes">
      <Local label="Policy snapshots across two optimizer updates">
        <div className="grouped-timeline">
          <strong>Time →</strong>
          {['Initialize / sample', 'Update 1', 'Update 2', 'Next rollout'].map((value) => (
            <strong key={value}>{value}</strong>
          ))}
          <strong>Current ━</strong>
          {['θ₀', 'θ₁ ← gradient', 'θ₂ ← gradient', 'θ₂'].map((value, index) => (
            <span className="grouped-current" key={index}>
              {value}
            </span>
          ))}
          <strong>Old ┄</strong>
          {['copy θ₀ → generate', 'θ₀ cached logps', 'θ₀ cached logps', 'copy θ₂ → generate'].map(
            (value, index) => (
              <span className="grouped-old" key={index}>
                {value}
              </span>
            ),
          )}
          <strong>Reference ···</strong>
          {['copy θref = θ₀', 'θref fixed', 'θref fixed', 'θref fixed'].map((value, index) => (
            <span className="grouped-reference" key={index}>
              {value}
            </span>
          ))}
        </div>
      </Local>
      <p>
        Only the solid current lane receives gradients. Old and reference selected scores are
        detached. Old refresh follows the next rollout; a reference refresh would be a separate,
        explicitly chosen recipe event.
      </p>
      <p>
        This two-update lifetime diagram is constructed; a recipe using one update per rollout
        refreshes old sooner. The saved native demonstration below uses one rollout iteration.
      </p>
    </Figure>
  );
}

export function RatioBranches() {
  const [logs, setLogs] = useState([Math.log(1.5), Math.log(0.8), 0, 0]);
  const [length, setLength] = useState(2);
  const selected = logs.slice(0, length);
  const total = model.sum(selected);
  return (
    <Figure id="D14" label="Token sequence and geometric ratios">
      <Table
        label="Same tokens, fixed old probability 0.2"
        headers={['Token', 'Old p', 'Current p', 'Log change', 'Token ratio']}
        rows={selected.map((value, index) => [
          index + 1,
          0.2,
          fmt(0.2 * Math.exp(value)),
          fmt(value),
          fmt(Math.exp(value)),
        ])}
      />
      <Branches>
        <Branch index={0}>
          <p>Each log change → exp separately</p>
          <Strip values={selected.map((value) => fmt(Math.exp(value)))} />
          <p>Token ratios retain {length} separate terms.</p>
        </Branch>
        <Branch index={1}>
          <p>Σ log changes = {fmt(total)}</p>
          <Arrow>↓ exp (equivalently multiply ratios)</Arrow>
          <output>Full response ratio {fmt(Math.exp(total))}</output>
        </Branch>
        <Branch index={2}>
          <p>Σ log changes / L = {fmt(total / length)}</p>
          <Arrow>↓ exp</Arrow>
          <output>Geometric ratio {fmt(Math.exp(total / length))}</output>
        </Branch>
      </Branches>
      <Controls
        reset={() => {
          setLogs([Math.log(1.5), Math.log(0.8), 0, 0]);
          setLength(2);
        }}
      >
        <Select
          label="Response length"
          value={length}
          onChange={(value) => setLength(Number(value))}
          options={[
            [2, 'Two selected tokens'],
            [4, 'Four selected tokens'],
          ]}
        />
        {selected.map((value, index) => (
          <NumberField
            key={index}
            label={`Token ${index + 1} log change`}
            value={value}
            min={-1.5}
            max={1.5}
            onChange={(next) => setLogs(logs.map((old, i) => (i === index ? next : old)))}
          />
        ))}
        <button type="button" onClick={() => setLogs([0, 0, 0, 0])}>
          Equal old and current
        </button>
      </Controls>
      <p>
        The bounded current probabilities remain below one. Geometric averaging changes the weight;
        it is not ordinary whole-response importance sampling.
      </p>
    </Figure>
  );
}

export function ClippingSurfaces() {
  const [ratio, setRatio] = useState(1.5);
  const [epsilon, setEpsilon] = useState(0.2);
  const [zero, setZero] = useState(false);
  return (
    <Figure id="D15" label="Sign-sensitive clipped surrogate">
      {[zero ? 0 : 1, zero ? 0 : -1].map((advantage, index) => {
        const result = model.clipped(ratio, advantage, epsilon);
        return (
          <div key={index}>
            <p>
              Advantage A = {advantage}; bounds {fmt(1 - epsilon)} and {fmt(1 + epsilon)}
            </p>
            <Curves
              domain={[0, 2]}
              yDomain={[-2, 2]}
              marker={ratio}
              vertical={[1 - epsilon, 1 + epsilon]}
              label="Ratio (horizontal), reward surrogate (vertical)"
              series={[
                {
                  name: 'Unclipped ρA',
                  dashed: true,
                  points: curvePoints(0, 2, (value) => value * advantage),
                },
                {
                  name: 'Minimum surrogate',
                  points: curvePoints(
                    0,
                    2,
                    (value) => model.clipped(value, advantage, epsilon).surrogate,
                  ),
                },
              ]}
            />
            <p>
              Raw {fmt(result.raw)}; bounded branch {fmt(result.bounded)}; minimum{' '}
              {fmt(result.surrogate)}; derivative dS/dρ {fmt(result.derivative)}. Loss is −S.{' '}
              {(advantage > 0 && ratio === 1 + epsilon) || (advantage < 0 && ratio === 1 - epsilon)
                ? 'At the kink, one-sided slopes differ; this readout uses the plateau-side slope.'
                : ''}
            </p>
          </div>
        );
      })}
      <Controls
        reset={() => {
          setRatio(1.5);
          setEpsilon(0.2);
          setZero(false);
        }}
      >
        <NumberField
          label="Current / old ratio"
          value={ratio}
          min={0}
          max={2}
          onChange={setRatio}
        />
        <NumberField
          label="Clipping ε"
          value={epsilon}
          min={0.05}
          max={0.5}
          onChange={setEpsilon}
        />
        <Select
          label="Reward advantage"
          value={zero ? 'zero' : 'signed'}
          onChange={(value) => setZero(value === 'zero')}
          options={[
            ['signed', 'Compare +1 and −1'],
            ['zero', 'Zero advantage'],
          ]}
        />
      </Controls>
      <p>A plateau in a sampled loss term does not impose a hard probability or parameter bound.</p>
    </Figure>
  );
}

export function ReductionGrid() {
  const [rows, setRows] = useState([
    [1, 3],
    [2, 2, 2, 2],
  ]);
  const [equal, setEqual] = useState(false);
  const active = [rows[0], equal ? rows[1].slice(0, 2) : rows[1]];
  return (
    <Figure id="D16" label="Loss cells and reduction derivatives">
      <p>
        Rows are responses; columns are selected tokens. An absent cell contributes neither loss nor
        gradient.
      </p>
      <Table
        label="Actual token-loss grid"
        headers={['Response', 'token 1', 'token 2', 'token 3', 'token 4']}
        rows={active.map((row, index) => [
          <Identity index={index}>response {index + 1}</Identity>,
          ...Array.from({ length: 4 }, (_, column) =>
            row[column] === undefined ? 'masked' : fmt(row[column]),
          ),
        ])}
      />
      {model.reductions(active).map((result) => (
        <Table
          key={result.name}
          label={`${result.name}: ${fmt(result.value)}; literal cell derivative weights`}
          headers={['Response', 'token 1', 'token 2', 'token 3', 'token 4']}
          rows={result.weights.map((row, index) => [
            `response ${index + 1}`,
            ...Array.from({ length: 4 }, (_, column) => fmt(row[column] ?? 0)),
          ])}
        />
      ))}
      <Controls
        reset={() => {
          setRows([
            [1, 3],
            [2, 2, 2, 2],
          ]);
          setEqual(false);
        }}
      >
        <NumberField
          label="Short response, first loss"
          value={rows[0][0]}
          min={0}
          max={5}
          onChange={(next) => setRows([[next, rows[0][1]], rows[1]])}
        />
        <button
          type="button"
          onClick={() =>
            setRows([
              [1, 1],
              [3, 3, 3, 3],
            ])
          }
        >
          Changed losses 1 versus 3
        </button>
        <Select
          label="Response lengths"
          value={equal ? 'equal' : 'unequal'}
          onChange={(value) => setEqual(value === 'equal')}
          options={[
            ['unequal', '2 and 4 tokens'],
            ['equal', '2 and 2 tokens'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function SampledKL() {
  const [logits, setLogits] = useState([0.2, 0.3, 0.5].map(Math.log));
  const [sampling, setSampling] = useState('current');
  const q = [0.4, 0.4, 0.2];
  const p = model.softmax(logits);
  const weights = sampling === 'current' ? p : [0.2, 0.3, 0.5];
  const result = model.sampledKL(p, q, weights);
  return (
    <Figure id="D17" label="Sampled KL value and its weighting">
      <Bars
        label="Current probability"
        maximum={1}
        rows={p.map((value, index) => ({ label: ['A ◇', 'B ○', 'C △'][index], value }))}
      />
      <Table
        label="Per-action KL terms"
        headers={['Action', 'Current p', 'Reference q', 'log(p/q)', 'k₃', 'Sampling weight × k₃']}
        rows={p.map((value, index) => [
          <Identity index={index}>{['A ◇', 'B ○', 'C △'][index]}</Identity>,
          fmt(value),
          fmt(q[index]),
          fmt(result.logRatio[index]),
          fmt(result.k3[index]),
          fmt(weights[index] * result.k3[index]),
        ])}
      />
      <p>
        Weighted k₃ = {fmt(result.sampled)}; exact KL(p || q) = {fmt(result.exact)}. Weights ={' '}
        {vector(weights)}.{' '}
        {sampling === 'current'
          ? 'Current-policy weighting gives the value identity.'
          : 'Fixed old weights need not give the current-policy KL.'}
      </p>
      <Controls
        reset={() => {
          setLogits([0.2, 0.3, 0.5].map(Math.log));
          setSampling('current');
        }}
      >
        <NumberField
          label="Current A logit"
          value={logits[0]}
          onChange={(value) => setLogits([value, logits[1], logits[2]])}
        />
        <Select
          label="Sampling weights"
          value={sampling}
          onChange={setSampling}
          options={[
            ['current', 'Current p'],
            ['old', 'Fixed old (0.2, 0.3, 0.5)'],
          ]}
        />
        <button type="button" onClick={() => setLogits(q.map(Math.log))}>
          Current equals reference
        </button>
      </Controls>
      <p>
        The expectation identity concerns values. Detaching a sampled quantity changes its
        derivative path.
      </p>
    </Figure>
  );
}

export function RegularizationPaths() {
  const [fixture, setFixture] = useState('sameOld');
  const values = { sameOld: [-1, -1, -0.5], differentOld: [-1, -1.4, -0.5], equal: [-1, -1, -1] }[
    fixture
  ];
  const [current, old, reference] = values;
  const plain = model.penaltyDerivative(current, old, reference);
  const corrected = model.penaltyDerivative(current, old, reference, true);
  return (
    <Figure id="D18" label="Regularization gradient paths">
      <Branches>
        <Branch index={2}>
          <p>
            <Identity index={2}>Current l ━</Identity> → exp(h−l) → k₃
          </p>
          <p>
            <Identity index={1}>Reference h ··· fixed</Identity> ↗
          </p>
          <Arrow>↓ β k₃ → loss → current gradient</Arrow>
          <p>Original-style selection: correction false.</p>
          <p>Optional true: current l → exp(l−old o) ━ × k₃ → loss. Both inputs carry gradients.</p>
        </Branch>
        <Branch index={0}>
          <p>
            <Identity index={0}>Old o ┄ fixed</Identity> − reference h ···
          </p>
          <Arrow>↓ sequence sum × β</Arrow>
          <p>Observed reward − penalty → LOO</p>
          <p>
            <span className="grouped-stop">stop gradient on advantages</span>
          </p>
          <Arrow>↓ × current sequence surrogate → loss</Arrow>
          <p>Current RLOO shapes rewards before its baseline.</p>
        </Branch>
      </Branches>
      <Table
        label="Derivative with respect to one selected current log score l"
        headers={['Branch', 'Penalty value', 'd penalty / dl']}
        rows={[
          ['k₃', fmt(plain.value), fmt(plain.derivative)],
          ['exp(l−o) × k₃', fmt(corrected.value), fmt(corrected.derivative)],
          ['Wrong: wholly detached penalty', fmt(plain.value), 0],
        ]}
      />
      <p>
        l = {current}, o = {old}, h = {reference}; coefficient exp(l−o) = {fmt(plain.ratio)}. The
        table omits the common positive β multiplier. A coefficient equal to one can still have a
        nonzero derivative.
      </p>
      <Controls reset={() => setFixture('sameOld')}>
        <Select
          label="Constructed score fixture"
          value={fixture}
          onChange={setFixture}
          options={[
            ['sameOld', 'Old = current ≠ reference'],
            ['differentOld', 'Old ≠ current ≠ reference'],
            ['equal', 'All three equal'],
          ]}
        />
      </Controls>
      <p>
        Fresh on-policy reward shaping can recover a score-function derivative. Reusing old samples
        with clipping creates a surrogate; these trainer paths are not universally equivalent.
      </p>
    </Figure>
  );
}

export function OnlineLoop() {
  return (
    <Figure id="D19" label="Complete grouped causal-model batch">
      <p className="grouped-tree-root">B = 2 prompts → G = 4 generated responses per prompt</p>
      <Branches>
        {[
          [0, 1, 1, 2],
          [2, 2, 2, 2],
        ].map((rewards, index) => (
          <Branch key={index} index={index}>
            <Identity index={index}>Prompt {index + 1}</Identity>
            {rewards.map((reward, row) => (
              <div key={row}>
                <Strip
                  values={row === 3 ? ['answer', 'token', 'cap'] : ['answer', 'EOS', 'PAD']}
                  coloursByIndex={[index, index, 3]}
                />
                <p>
                  draw {row + 1} → reward {reward}
                </p>
              </div>
            ))}
            <p>
              Reward row {vector(rewards)} → centered row{' '}
              {vector(rewards.map((value) => value - model.mean(rewards)))}
            </p>
          </Branch>
        ))}
      </Branches>
      <Arrow>↓ 8 response rows × selected-token positions</Arrow>
      <Branches>
        <Branch index={2}>
          <p>Current model ━ → selected logps with gradient</p>
        </Branch>
        <Branch index={0}>
          <p>Old model ┄ → cached logps</p>
          <span className="grouped-stop">no gradient</span>
        </Branch>
        <Branch index={1}>
          <p>Reference model ··· → reference logps</p>
          <span className="grouped-stop">no gradient</span>
        </Branch>
      </Branches>
      <Arrow>↓ ratios + detached advantages + reference term</Arrow>
      <p className="grouped-center">
        Selected-token mask → declared reduction → scalar loss → backward through current decoder →
        optimizer → saved weights
      </p>
      <p>
        EOS is a selected stopping action. “cap” marks a truncated response with no manufactured
        EOS. Prompt 2 has zero reward advantages; a nonzero reference term can still contribute.
        Generation/reward work scales with B × G selected responses.
      </p>
    </Figure>
  );
}

export function NativeConfigurations() {
  return (
    <Figure id="D20" label="Exact native configuration correspondence">
      <Table
        label="Pinned TRL 1.14.2; names alone do not define a recipe"
        headers={[
          'Object',
          'Selected original-style GRPO',
          'Selected RLOO',
          'Current GRPO default',
        ]}
        rows={[
          [
            <a href="#grouped-D11">Advantage scaling → D11</a>,
            'group sample std + ε',
            'normalize_advantages=False',
            'group',
          ],
          [
            <a href="#grouped-D14">Importance ratio → D14</a>,
            'token',
            'whole-sequence product',
            'token',
          ],
          [
            <a href="#grouped-D16">Reduction → D16</a>,
            "loss_type='grpo' response mean",
            'sequence mean',
            "loss_type='dapo' pooled tokens",
          ],
          [
            <a href="#grouped-D18">Reference path → D18</a>,
            'loss-side k₃, beta=.01',
            'reward-side old/ref, beta=.01',
            'beta=0',
          ],
          ['Bias correction KL', 'explicit False', 'not this GRPO branch', 'True when KL used'],
          [
            'Dropout',
            'explicit disable_dropout=True',
            'explicit disable_dropout=True',
            'inspect resolved configuration',
          ],
          [
            'This demonstration',
            'G=4, batch=4, 2 SGD steps',
            'G=4, batch=4, 2 SGD steps',
            'not a study recipe',
          ],
        ]}
      />
      <p>
        Selected learning rate 10⁻⁵, one rollout iteration, no weight decay or gradient clipping.
        These settings locate the implementation; they do not reproduce an entire paper.
      </p>
    </Figure>
  );
}
