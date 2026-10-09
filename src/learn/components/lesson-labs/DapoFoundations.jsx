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
  colours,
  fmt,
  vector,
} from './DapoElements.jsx';
import { groupStatistics, lengthPenalty } from '../../data/dapo-models.js';

const responseTokens = [['13'], ['twelve', 'is', 'the answer'], ['12'], ['7', '+5', '=', '12']];
export function AnswerPaths() {
  const [selected, setSelected] = useState(0);
  return (
    <Figure id="D01" label="A shared prefix branches into four sampled responses">
      <Local label="Prefix tree with four distinct response paths" minWidth="36rem">
        <svg
          viewBox="0 0 660 360"
          className="dapo-plot"
          role="img"
          aria-label="Prompt 7 plus 5 branches into four sampled sequences; selection highlights its conditioned path"
        >
          <text x="20" y="35" fill="#eee">
            Prompt: 7 + 5?
          </text>
          <path d="M85 50V180H150" stroke="#aaa" fill="none" />
          {responseTokens.map((tokens, row) => (
            <g key={row}>
              <path
                d={`M150 180L230 ${85 + row * 75}H${245 + (tokens.length - 1) * 90}`}
                stroke={colours[row]}
                fill="none"
                strokeWidth={selected === row ? 4 : 2}
              />
              {tokens.map((token, column) => (
                <g key={column}>
                  <circle cx={245 + column * 90} cy={85 + row * 75} r="5" fill={colours[row]} />
                  <text x={230 + column * 90} y={65 + row * 75} fill={colours[row]}>
                    {token}
                  </text>
                </g>
              ))}
              <text x="575" y={70 + row * 75} fill={colours[row]}>
                {String.fromCharCode(65 + row)}: {row >= 2 ? '+1' : '−1'}
              </text>
            </g>
          ))}
        </svg>
      </Local>
      <p>
        <Identity index={selected}>Response {String.fromCharCode(65 + selected)}</Identity>: each
        edge uses the whole preceding prefix.{' '}
        {selected === 0
          ? 'Wrong integer 13.'
          : selected === 1
            ? 'Malformed for this exact integer checker, despite its understandable wording.'
            : 'Checked final integer 12.'}{' '}
        Boundaries are constructed tokens, not a tokenizer measurement.
      </p>
      <Controls reset={() => setSelected(0)}>
        <Select
          label="Trace response"
          value={selected}
          onChange={(v) => setSelected(Number(v))}
          options={['A', 'B', 'C', 'D'].map((id, i) => [i, id])}
        />
      </Controls>
    </Figure>
  );
}
export function RewardToUpdate() {
  const [reward, setReward] = useState(-1);
  const rewards = [-1, reward, 1, 1];
  const stats = groupStatistics(rewards);
  return (
    <Figure
      id="D02"
      label="The same responses become coefficients, token losses and a parameter update"
    >
      <Table
        label="Response identity travels from reward into every selected token"
        headers={['Response', 'Checked reward', 'Relative coefficient', 'Selected token cells']}
        rows={rewards.map((r, i) => [
          <Identity index={i}>{String.fromCharCode(65 + i)}</Identity>,
          r,
          fmt(stats.advantages[i]),
          <Strip
            label={`Response ${i} token coefficients`}
            coloursByIndex={responseTokens[i].map(() => i)}
            values={responseTokens[i].map((token) => `${token}: ${fmt(stats.advantages[i], 3)}`)}
          />,
        ])}
      />
      <Arrow>
        sampled IDs → fixed rewards → relative coefficients → differentiable token scores
      </Arrow>
      <Local label="Loss derivative returns to shared parameter entries" minWidth="30rem">
        <svg
          viewBox="0 0 540 145"
          className="dapo-plot"
          role="img"
          aria-label="Token loss sum feeds a gradient arrow back to a shared parameter matrix"
        >
          <text x="10" y="50" fill="#eee">
            sum / selected tokens → loss
          </text>
          <path d="M240 70V110H440V65" stroke="#efb66b" fill="none" strokeWidth="2" />
          <text x="265" y="135" fill="#efb66b">
            ∂loss / ∂weights
          </text>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}/${col}`}
                x={385 + col * 35}
                y={5 + row * 25}
                width="30"
                height="20"
                fill="#303030"
                stroke={colours[row]}
              />
            )),
          )}
        </svg>
      </Local>
      <p>
        A is wrong, B malformed, C directly correct and D correct after a longer calculation.
        Editing B to +1 is a counterfactual reward assignment, not this checker's verdict on its
        malformed text. It changes the group mean and every relative coefficient. The gradient
        follows scored token probabilities into shared weights.
      </p>
      <Controls reset={() => setReward(-1)}>
        <Select
          label="B terminal reward"
          value={reward}
          onChange={(v) => setReward(Number(v))}
          options={[
            [-1, '−1: failed check'],
            [1, '+1: counterfactual pass'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function FrozenRollout() {
  const [tick, setTick] = useState(1);
  const current = [0.08, 0.1, 0.12][tick];
  return (
    <Figure id="D03" label="One fixed rollout snapshot spans two updates">
      <Local label="Old-policy bracket and changing current parameter snapshots" minWidth="34rem">
        <svg
          viewBox="0 0 600 240"
          className="dapo-plot"
          role="img"
          aria-label={`Old probability stays .08 across both updates; current tick ${tick} has probability ${current}`}
        >
          <path
            d="M80 60V35H520V60"
            stroke="#bbb"
            strokeDasharray="6 4"
            fill="none"
            strokeWidth="2"
          />
          <text x="155" y="22" fill="#ddd">
            Fixed rollout snapshot: p old = .08
          </text>
          <path d="M80 125H520" stroke="#777" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx={100 + i * 200} cy="125" r="8" fill={i === tick ? colours[1] : '#777'} />
              <text x={65 + i * 200} y="92" fill={i === tick ? colours[1] : '#ddd'}>
                tick {i}
              </text>
              <text x={50 + i * 200} y="162" fill="#ddd">
                p = {[0.08, 0.1, 0.12][i]}
              </text>
              <text x={50 + i * 200} y="192" fill="#ddd">
                θ{i}: {i === 0 ? 'initial' : 'updated'}
              </text>
            </g>
          ))}
        </svg>
      </Local>
      <Strip
        label="The same stored prefix and target"
        values={['prompt: 7 + 5', 'prefix: 7 +', 'target: 5', 'old logp: ' + fmt(Math.log(0.08))]}
      />
      <p>
        Current / old = {fmt(current)} / .08 = <strong>{fmt(current / 0.08)}</strong>. The old
        denominator remains detached. A regularization reference would be a third role; β = 0 omits
        that role here.
      </p>
      <Controls reset={() => setTick(1)}>
        <Select
          label="Optimizer tick"
          value={tick}
          onChange={(v) => setTick(Number(v))}
          options={[
            [0, '0: before updates'],
            [1, '1: after first update'],
            [2, '2: after second update'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function CausalAddresses() {
  const [target, setTarget] = useState(3);
  const [current, setCurrent] = useState(0.1);
  const tokens = ['Q', '7', '+5', '12', 'EOS', 'PAD'];
  return (
    <Figure id="D04" label="Shifted causal prediction and positional EOS mask">
      <Table
        label="Predictor rows see only their causal prefix"
        headers={['query ↓ / key →', ...tokens.map((t, i) => `${i}: ${t}`)]}
        rows={tokens.map((t, row) => [
          `${row}: ${t}`,
          ...tokens.map((_, col) => (
            <span
              style={{
                color: col <= row && col < 5 ? colours[0] : '#888',
                outline: row === target - 1 && col === target - 1 ? '2px solid white' : undefined,
              }}
            >
              {col < 5 && col <= row ? '●' : '·'}
            </span>
          )),
        ])}
      />
      <p>
        Predictor at position {target - 1} → target at {target}: <strong>{tokens[target]}</strong>.
        The target itself is outside its predictor’s causal prefix. The padding query’s output is
        unused; the mask shown excludes padding keys, not an assertion that every implementation
        zeros its query output.
      </p>
      <Strip
        label="Loss target validity"
        values={[
          'Q: context',
          '7: context',
          '+5: context',
          '12: selected',
          'EOS ID 0: selected',
          'PAD ID 0: excluded',
        ]}
        selected={[target]}
      />
      <Arrow>current logp − frozen old logp → exp → ratio</Arrow>
      <p>
        {fmt(Math.log(current))} − {fmt(Math.log(0.08))} = {fmt(Math.log(current / 0.08))}; exp ={' '}
        {fmt(current / 0.08)}. These constructed probabilities describe the selected target.
      </p>
      <Controls
        reset={() => {
          setTarget(3);
          setCurrent(0.1);
        }}
      >
        <Select
          label="Scored response target"
          value={target}
          onChange={(v) => setTarget(Number(v))}
          options={[
            [3, '12 at position 3'],
            [4, 'EOS at position 4'],
          ]}
        />
        <NumberField
          label="Current probability"
          value={current}
          min={0.01}
          max={0.99}
          step={0.01}
          onChange={setCurrent}
        />
      </Controls>
    </Figure>
  );
}
export function RewardRuler() {
  const [last, setLast] = useState(1);
  const rewards = [-1, -1, 1, last];
  const stats = groupStatistics(rewards);
  const x = (value) => 300 + value * 170;
  return (
    <Figure id="D05" label="Rewards, centered displacements and sample standard deviation">
      <Local label="Four parallel reward rulers joined to the same mean" minWidth="36rem">
        <svg
          viewBox="0 0 620 300"
          className="dapo-plot"
          role="img"
          aria-label={`Mean ${stats.mean}; sample variance ${stats.variance}; sample standard deviation ${stats.sd}`}
        >
          {rewards.map((reward, row) => (
            <g key={row}>
              <text x="10" y={50 + row * 62} fill={colours[row]}>
                {String.fromCharCode(65 + row)}
              </text>
              <path d={`M100 ${45 + row * 62}H510`} stroke="#555" />
              <path
                d={`M${x(stats.mean)} ${45 + row * 62}H${x(reward)}`}
                stroke={colours[row]}
                strokeWidth="4"
              />
              <circle cx={x(reward)} cy={45 + row * 62} r="6" fill={colours[row]} />
              <text x="535" y={50 + row * 62} fill={colours[row]}>
                {fmt(stats.centered[row])}
              </text>
            </g>
          ))}
          <path d={`M${x(stats.mean)} 20V255`} stroke="#fff" strokeDasharray="4 4" />
          {[-1, 0, 1].map((v) => (
            <text key={v} x={x(v) - 8} y="287" fill="#ddd">
              {v}
            </text>
          ))}
        </svg>
      </Local>
      <p>
        White mean line: {fmt(stats.mean)}. Squared displacements sum to {fmt(stats.variance * 3)};
        divide by <strong>G − 1 = 3</strong> → variance {fmt(stats.variance)} → SD {fmt(stats.sd)}.
      </p>
      <Strip
        label="Standardized advantages in response order"
        values={stats.advantages.map((v) => fmt(v))}
      />
      <Controls reset={() => setLast(1)}>
        <Select
          label="D reward"
          value={last}
          onChange={(v) => setLast(Number(v))}
          options={[
            [-1, '−1'],
            [1, '+1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function HomogeneousGroups() {
  const [group, setGroup] = useState(2);
  const [metric, setMetric] = useState('correctness');
  const patterns = [
    [1, 1, 1, 1],
    [-1, -1, -1, -1],
    [-1, -1, 1, 1],
  ];
  const lengths = [2, 4, 6, 8];
  const rewards = patterns[group].map(
    (r, i) => r + (metric === 'shaped' ? lengthPenalty(lengths[i], 8, 4) : 0),
  );
  const stats = groupStatistics(rewards);
  return (
    <Figure id="D06" label="Homogeneous correctness can differ from homogeneous shaped reward">
      <Table
        label="Three prompts, four response identities each"
        headers={['Prompt', 'A', 'B', 'C', 'D']}
        rows={patterns.map((values, i) => [
          `${i === group ? '→ ' : ''}${['all correct', 'all wrong', 'mixed'][i]}`,
          ...values.map((r, j) => <Identity index={j}>{r > 0 ? '✓ +1' : '× −1'}</Identity>),
        ])}
      />
      <Strip
        label="Selected metric's actual rewards"
        values={rewards.map((r, i) => `${String.fromCharCode(65 + i)} L${lengths[i]}: ${fmt(r)}`)}
      />
      <Bars
        label="Selected group's advantages"
        signed
        rows={stats.advantages.map((value, i) => ({
          label: String.fromCharCode(65 + i),
          value,
          colour: i,
        }))}
      />
      <p>
        Reward SD {fmt(stats.sd)}.{' '}
        {stats.sd === 0
          ? 'Zero relative reward advantage; task success and failure remain different.'
          : 'The selected reward metric supplies a within-group contrast.'}{' '}
        The main collector filters correctness before adding length shaping.
      </p>
      <Controls
        reset={() => {
          setGroup(2);
          setMetric('correctness');
        }}
      >
        <Select
          label="Prompt group"
          value={group}
          onChange={(v) => setGroup(Number(v))}
          options={[
            [0, 'All correct'],
            [1, 'All wrong'],
            [2, 'Mixed'],
          ]}
        />
        <Select
          label="Inspect reward metric"
          value={metric}
          onChange={setMetric}
          options={[
            ['correctness', 'Correctness only'],
            ['shaped', 'Correctness + length penalty'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ModelStructure() {
  const [layer, setLayer] = useState(0);
  return (
    <Figure id="D23" label="The configured Pythia 14m decoder and trainable tensors">
      <Local
        label="Six sequential GPT-NeoX blocks with one parallel-residual block expanded"
        minWidth="47rem"
      >
        <svg
          viewBox="0 0 780 735"
          className="dapo-plot dapo-tall-plot"
          role="img"
          aria-label="Embedding feeds blocks one through six sequentially, final layer norm and untied head. Each selected block sends its input through two separate layer norms, parallel attention and MLP branches, then sums both with the residual input."
        >
          <text x="15" y="28" fill="#ddd">
            prompt / label / EOS IDs
          </text>
          <rect x="15" y="45" width="225" height="42" fill="#222" stroke={colours[0]} />
          <text x="25" y="73" fill={colours[0]}>
            Embedding 50,304 × 128
          </text>
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <path
                d={`M125 ${87 + i * 65}V${110 + i * 65}m-5 -7 5 7 5 -7`}
                stroke="#aaa"
                fill="none"
              />
              <rect
                x="35"
                y={110 + i * 65}
                width="185"
                height="42"
                fill={i === layer ? '#383838' : '#222'}
                stroke={i === layer ? 'white' : '#777'}
              />
              <text x="70" y={137 + i * 65} fill={colours[1]}>
                block {i + 1}
              </text>
            </g>
          ))}
          <path d="M125 477V515m-5 -7 5 7 5 -7" stroke="#aaa" fill="none" />
          <rect x="35" y="515" width="185" height="42" fill="#222" stroke="#aaa" />
          <text x="60" y="542" fill="#ddd">
            Final layer norm
          </text>
          <path d="M125 557V592m-5 -7 5 7 5 -7" stroke="#aaa" fill="none" />
          <rect x="15" y="592" width="225" height="65" fill="#222" stroke={colours[3]} />
          <text x="35" y="617" fill={colours[3]}>
            Untied vocabulary head
          </text>
          <text x="60" y="641" fill={colours[3]}>
            128 × 50,304
          </text>
          <path
            d={`M220 ${131 + layer * 65}H275V90H530`}
            stroke="#777"
            strokeDasharray="4 4"
            fill="none"
          />
          <text x="330" y="45" fill="#ddd">
            Expanded block {layer + 1}: parallel residual
          </text>
          <text x="500" y="115" fill="#ddd">
            input x
          </text>
          <path
            d="M530 125V145H385V180 M530 145H665V180 M530 125H755V475H550"
            stroke="#aaa"
            fill="none"
          />
          {[
            [310, 'Layer norm 1'],
            [590, 'Layer norm 2'],
          ].map(([x, label]) => (
            <g key={label}>
              <rect x={x} y="180" width="155" height="46" fill="#222" stroke={colours[0]} />
              <text x={x + 12} y="208" fill={colours[0]}>
                {label}
              </text>
            </g>
          ))}
          <path
            d="M385 226V272m-5 -7 5 7 5 -7 M665 226V272m-5 -7 5 7 5 -7"
            stroke="#aaa"
            fill="none"
          />
          <rect x="310" y="272" width="155" height="98" fill="#222" stroke={colours[1]} />
          <text x="323" y="298" fill={colours[1]}>
            Causal attention
          </text>
          <text x="323" y="325" fill="#ddd">
            4 heads × 32
          </text>
          <text x="323" y="352" fill="#ddd">
            output width 128
          </text>
          <rect x="590" y="272" width="155" height="98" fill="#222" stroke={colours[2]} />
          <text x="610" y="298" fill={colours[2]}>
            MLP + GELU
          </text>
          <text x="600" y="325" fill="#ddd">
            128 → 512 → 128
          </text>
          <path d="M385 370V430H520V455 M665 370V430H540V455" stroke="#aaa" fill="none" />
          <circle cx="535" cy="475" r="22" fill="#222" stroke="#ddd" />
          <text x="526" y="482" fill="#ddd">
            +
          </text>
          <path d="M535 497V540m-5 -7 5 7 5 -7" stroke="#aaa" fill="none" />
          <text x="365" y="565" fill="#ddd">
            output = x + attention(LN₁ x) + MLP(LN₂ x)
          </text>
          <text x="20" y="708" fill="#ddd">
            Selected token loss differentiates through the shared sequence of trainable blocks.
          </text>
        </svg>
      </Local>
      <p>
        The actual configuration sets use_parallel_residual = true: within each sequential block,
        attention and MLP read separately normalized copies of the same input and add to its
        residual. Transformers owns the decoder; local code owns collection and loss. The exact
        recorded checkpoint has 14,067,712 parameters. This drawing describes its configuration, not
        a new training observation.
      </p>
      <Controls reset={() => setLayer(0)}>
        <Select
          label="Inspect decoder block"
          value={layer}
          onChange={(v) => setLayer(Number(v))}
          options={Array.from({ length: 6 }, (_, i) => [i, `Block ${i + 1}`])}
        />
      </Controls>
    </Figure>
  );
}
