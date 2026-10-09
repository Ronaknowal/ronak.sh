import React, { useEffect, useId, useRef, useState } from 'react';
import { MathBlock as SharedMathBlock } from '../content/Math.jsx';
import * as model from '../../data/dpo-models.js';
import { observations as saved } from '../../data/dpo-observations.js';
import './dpo-flow.css';

const fmt = (value, digits = 4) =>
  Number.isFinite(value)
    ? Number(value.toFixed(digits)).toString()
    : value === -Infinity
      ? '−∞'
      : '∞';
const vector = (values) => `[${values.map((value) => fmt(value)).join(', ')}]`;
const colours = ['#efb66b', '#c5a3ed', '#86c9f1'];
const records = saved.records.records;

function Figure({ id, label, children }) {
  return (
    <figure className="dpo-figure" data-dpo-figure={id} aria-label={label}>
      {children}
    </figure>
  );
}
function Controls({ children, reset }) {
  return (
    <fieldset className="dpo-controls">
      <legend>Change this example</legend>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
}
function NumberField({ label, value, onChange, min = -5, max = 5, step = 0.1 }) {
  const id = useId();
  return (
    <label className="dpo-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (event.target.value !== '' && Number.isFinite(next))
            onChange(Math.max(min, Math.min(max, step === 1 ? Math.round(next) : next)));
        }}
      />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label className="dpo-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
function Arrow({ children = '↓' }) {
  return <div className="dpo-arrow">{children}</div>;
}
function Identity({ index = 0, children }) {
  return <strong style={{ color: colours[index] }}>{children}</strong>;
}
function Matrix({ label, rows = 3, columns = 4, frozen = false }) {
  return (
    <div className={`dpo-matrix ${frozen ? 'dpo-frozen' : ''}`}>
      <span>{label}</span>
      <div
        className="dpo-matrix-cells"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        aria-hidden="true"
      >
        {Array.from({ length: rows * columns }, (_, i) => (
          <i key={i} style={{ opacity: 0.3 + (i % 5) * 0.15 }} />
        ))}
      </div>
      <small>
        {rows} × {columns} schematic weights{frozen ? ' · fixed' : ''}
      </small>
    </div>
  );
}
function Branches({ children }) {
  return <div className="dpo-branches">{children}</div>;
}
function Response({ index = 0, title, children }) {
  return (
    <div className="dpo-response" style={{ '--dpo-entity': colours[index] }}>
      <Identity index={index}>{title}</Identity>
      <div>{children}</div>
    </div>
  );
}
function Local({ label, children, className = 'dpo-local', equation = false }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);
  return (
    <div className="dpo-local-wrap">
      {overflow && (
        <p className="dpo-scroll-hint">
          {equation ? 'Scroll this equation horizontally' : 'Scroll this aligned view horizontally'}
          ; focus it and use the arrow keys.
        </p>
      )}
      <div ref={ref} className={className} tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
export function MathEquation({ children }) {
  return (
    <Local label="Mathematical relationship" className="dpo-math" equation>
      <SharedMathBlock>{children}</SharedMathBlock>
    </Local>
  );
}
function Table({ label, headers, rows }) {
  return (
    <div className="dpo-table-wrap">
      <p>{label}</p>
      <Local label={label}>
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
    </div>
  );
}
function Tokens({ values, selected = [], index = 0 }) {
  return (
    <div className="dpo-tokens">
      {values.map((value, i) => (
        <span
          key={i}
          className={selected.includes(i) ? 'dpo-selected-token' : ''}
          style={{ '--dpo-entity': colours[index] }}
        >
          <small>{i}</small>
          {value}
        </span>
      ))}
    </div>
  );
}
function Bars({ rows, min = 0, max = 1, unit = 'probability' }) {
  const zero = ((0 - min) / (max - min)) * 100;
  return (
    <div className="dpo-bars" aria-label={unit}>
      {rows.map(([label, value, colour], i) => (
        <div className="dpo-bar-row" key={label}>
          <span>{label}</span>
          <div className="dpo-bar-track">
            <i className="dpo-bar-zero" style={{ left: `${zero}%` }} />
            <i
              className="dpo-bar-fill"
              style={{
                left: `${Math.min(zero, ((value - min) / (max - min)) * 100)}%`,
                width: `${(Math.abs(value) / (max - min)) * 100}%`,
                background: colour || colours[i % 3],
              }}
            />
          </div>
          <strong>{fmt(value)}</strong>
        </div>
      ))}
      <div className="dpo-bar-scale">
        <div className="dpo-axis">
          <span>{fmt(min)}</span>
          <span>{unit}</span>
          <span>{fmt(max)}</span>
        </div>
        <span />
      </div>
    </div>
  );
}
function Chart({ series, xLabel, yLabel, xMin, xMax, yMin, yMax, point }) {
  const x = (v) => 15 + (570 * (v - xMin)) / (xMax - xMin);
  const y = (v) => 210 - (195 * (v - yMin)) / (yMax - yMin);
  return (
    <div className="dpo-chart">
      <div className="dpo-axis">
        <span>{yLabel}</span>
        <span>
          {fmt(yMin)} → {fmt(yMax)}
        </span>
      </div>
      <svg
        viewBox="0 0 600 225"
        role="img"
        aria-label={`${yLabel} versus ${xLabel}; exact selected values follow`}
      >
        <path d="M15 15V210H585" fill="none" stroke="#777" />
        {xMin <= 0 && xMax >= 0 && (
          <path d={`M${x(0)} 15V210`} stroke="#666" strokeDasharray="4 5" />
        )}
        {yMin < 0 && yMax > 0 && <path d={`M15 ${y(0)}H585`} stroke="#666" strokeDasharray="4 5" />}
        {series.map((line, i) => (
          <polyline
            key={line.label}
            points={line.points.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')}
            fill="none"
            stroke={line.colour || colours[i % 3]}
            strokeWidth="3"
            strokeDasharray={i === 1 ? '7 4' : undefined}
          />
        ))}
        {point && <circle cx={x(point[0])} cy={y(point[1])} r="6" fill="#fff" />}
      </svg>
      <div className="dpo-axis">
        <span>{fmt(xMin)}</span>
        <span>{xLabel}</span>
        <span>{fmt(xMax)}</span>
      </div>
      <div className="dpo-legend">
        {series.map((line, i) => (
          <span key={line.label} style={{ color: line.colour || colours[i % 3] }}>
            {i === 1 ? '┄' : '━'} {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}
function curve(fn, min, max, count = 80) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = min + ((max - min) * i) / count;
    return [x, fn(x)];
  });
}

export function PairAnatomy() {
  const [criterion, setCriterion] = useState('word');
  const instructions = {
    word: "Name France's capital in one word.",
    sentence: "Name France's capital in a complete sentence.",
    unknown: "Tell me about France's capital.",
  };
  return (
    <Figure id="D01" label="A request and its supplied comparison">
      <p className="dpo-prompt">{instructions[criterion]}</p>
      <div className="dpo-fork" aria-hidden="true">
        ↙ same request ↘
      </div>
      <Branches>
        <Response title="A">Paris</Response>
        <Response index={1} title="B">
          Paris is the capital of France.
        </Response>
      </Branches>
      <p className="dpo-bracket">
        {criterion === 'unknown'
          ? 'No format preference supplied: do not invent a winner.'
          : `Supplied format preference: ${criterion === 'word' ? 'A over B' : 'B over A'}. Both answers contain the correct fact.`}
      </p>
      <Controls reset={() => setCriterion('word')}>
        <Select
          label="Requested form"
          value={criterion}
          onChange={setCriterion}
          options={[
            ['word', 'One word'],
            ['sentence', 'A sentence'],
            ['unknown', 'Unspecified'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function OperationAnatomy() {
  return (
    <Figure id="D02" label="Sampled reward training and direct comparison training">
      <Branches>
        <div>
          <p>Learn a reward, then sample</p>
          <Tokens values={['prompt', 'A preferred', 'B']} />
          <Arrow>↓ fit scalar score</Arrow>
          <Matrix label="Reward head + language representation" />
          <Branches>
            <Matrix label="Policy generates a continuation" />
            <Matrix label="Fixed reference scores that continuation" frozen />
          </Branches>
          <Arrow>sampled policy continuation → score</Arrow>
          <div className="dpo-loop">Policy update ← reward and reference penalty</div>
          <p>Some methods also learn a critic; roles can share a backbone.</p>
        </div>
        <div>
          <p>Score the supplied pair directly</p>
          <Tokens values={['same prompt', 'A', 'B']} />
          <Arrow>↓ teacher-forced paths</Arrow>
          <Branches>
            <Matrix label="Trainable policy" />
            <Matrix label="Frozen reference" frozen />
          </Branches>
          <Arrow>four sequence scores ↓</Arrow>
          <div className="dpo-loop">Pair loss → policy gradient only</div>
          <p>The supplied target tokens are scored, not sampled here.</p>
        </div>
      </Branches>
    </Figure>
  );
}
export function ModelBranches() {
  return (
    <Figure id="D03" label="Two responses share each model's parameters">
      <p className="dpo-prompt">One prompt x; two known responses</p>
      <Branches>
        {[false, true].map((frozen) => (
          <div key={String(frozen)}>
            <Matrix
              label={frozen ? 'Reference parameters φ' : 'Policy parameters θ'}
              frozen={frozen}
            />
            <div className="dpo-fork">↙ shared weights ↘</div>
            <Branches>
              <Response title="A">x, A → {frozen ? 'fA = −3' : 'sA = −2'}</Response>
              <Response index={1} title="B">
                x, B → {frozen ? 'fB = −3.5' : 'sB = −4'}
              </Response>
            </Branches>
            <div className="dpo-loop">
              {frozen
                ? '⊣ Stop gradient; reference stays fixed'
                : '↑ Gradients from both response paths add into θ'}
            </div>
          </div>
        ))}
      </Branches>
      <figcaption>
        Four forward scores do not mean four separately trained model copies. The weight grids show
        architecture, not measured parameter values.
      </figcaption>
    </Figure>
  );
}
export function FourScores() {
  const [scores, setScores] = useState([-2, -4, -3, -3.5]);
  const result = model.pair(scores.slice(0, 2), scores.slice(2));
  const labels = ['Policy A', 'Policy B', 'Reference A', 'Reference B'];
  return (
    <Figure id="D04" label="Four sequence log-probabilities and two gains">
      <Table
        label="Response log-probability, nats"
        headers={['Model', 'A', 'B']}
        rows={[
          ['Policy', fmt(scores[0]), fmt(scores[1])],
          ['Reference', fmt(scores[2]), fmt(scores[3])],
          ['Policy minus reference', fmt(result.gains[0]), fmt(result.gains[1])],
        ]}
      />
      <div className="dpo-fork">A gain − B gain ↓</div>
      <p>
        Relative margin: <strong>{fmt(result.margin)} nats</strong>. Raw policy gap:{' '}
        {fmt(scores[0] - scores[1])} nats.
      </p>
      {!result.massesValid && (
        <p role="status">
          These two response probabilities sum above one. Choose lower scores for a possible model
          distribution.
        </p>
      )}
      <Controls reset={() => setScores([-2, -4, -3, -3.5])}>
        {labels.map((label, i) => (
          <NumberField
            key={label}
            label={label}
            value={scores[i]}
            min={-30}
            max={-0.01}
            onChange={(value) => setScores(scores.map((old, index) => (index === i ? value : old)))}
          />
        ))}
        <button type="button" onClick={() => setScores([-3, -3.5, -3, -3.5])}>
          Policy = reference
        </button>
      </Controls>
    </Figure>
  );
}
export function RelativeShift() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-0.5);
  const [base, setBase] = useState('original');
  const reference = base === 'original' ? [-3, -3.5] : [-5, -3];
  return (
    <Figure id="D05" label="Signed gains and relative preference">
      <Bars
        min={-2}
        max={2}
        unit="gain in nats"
        rows={[
          ['A gain', a],
          ['B gain', b],
        ]}
      />
      <p className="dpo-bracket">
        A − B = <strong>{fmt(a - b)} nats</strong>
      </p>
      <p>
        Reference scores fixed at A {reference[0]} and B {reference[1]}. Policy scores are{' '}
        {fmt(reference[0] + a)} and {fmt(reference[1] + b)}; raw A − B ={' '}
        {fmt(reference[0] - reference[1] + a - b)}.
      </p>
      <Controls
        reset={() => {
          setA(1);
          setB(-0.5);
          setBase('original');
        }}
      >
        <NumberField label="A gain" value={a} onChange={setA} min={-2} max={2} />
        <NumberField label="B gain" value={b} onChange={setB} min={-2} max={2} />
        <Select
          label="Reference score fixture"
          value={base}
          onChange={setBase}
          options={[
            ['original', 'A −3, B −3.5'],
            ['raw-reversal', 'A −5, B −3: raw ranking can differ'],
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setA(0);
            setB(0);
          }}
        >
          Equal gains
        </button>
      </Controls>
    </Figure>
  );
}
export function LossSlope() {
  const [margin, setMargin] = useState(1.5);
  const [beta, setBeta] = useState(0.4);
  const result = model.pair([margin - 10, -10], [-10, -10], beta);
  return (
    <Figure id="D06" label="DPO logistic loss and update weight">
      <Chart
        xMin={-5}
        xMax={5}
        yMin={0}
        yMax={model.softplus(5 * beta)}
        xLabel="Relative margin m, nats"
        yLabel="Pair loss, nats"
        series={[
          { label: 'Calculated loss', points: curve((x) => model.softplus(-beta * x), -5, 5) },
        ]}
        point={[margin, result.loss]}
      />
      <Chart
        xMin={-5}
        xMax={5}
        yMin={0}
        yMax={1}
        xLabel="Relative margin m, nats"
        yLabel="Modeled comparison probability"
        series={[
          {
            label: 'Probability of the A preference label',
            colour: colours[1],
            points: curve((x) => model.sigmoid(beta * x), -5, 5),
          },
        ]}
        point={[margin, result.probability]}
      />
      <Chart
        xMin={-5}
        xMax={5}
        yMin={0}
        yMax={beta}
        xLabel="Relative margin m, nats"
        yLabel="Gradient magnitude |d loss / d m|"
        series={[
          {
            label: 'Update weight beta × sigmoid(−beta m)',
            colour: colours[2],
            points: curve((x) => beta * model.sigmoid(-beta * x), -5, 5),
          },
        ]}
        point={[margin, result.weight]}
      />
      <p>
        At m = {fmt(margin)}: logit {fmt(result.logit)}, modeled A preference{' '}
        {fmt(result.probability)}, loss <strong>{fmt(result.loss)}</strong>, signed slope{' '}
        <strong>−{fmt(result.weight)}</strong>.
      </p>
      <Controls
        reset={() => {
          setMargin(1.5);
          setBeta(0.4);
        }}
      >
        <NumberField label="Relative margin m" value={margin} onChange={setMargin} />
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.05} max={2} step={0.05} />
        <button type="button" onClick={() => setMargin(0)}>
          Zero margin
        </button>
      </Controls>
    </Figure>
  );
}
export function TokenScore() {
  const fixture = model.tokenFixture();
  const [selected, setSelected] = useState('1');
  const row = Number(selected);
  return (
    <Figure id="D07" label="Causal vocabulary matrix and response gather">
      <Tokens values={fixture.tokens} selected={[row, row + 1]} />
      <Arrow>predictor row t → target at t + 1</Arrow>
      <Table
        label="Constructed vocabulary logits; selected cells are next-token targets"
        headers={['Predictor', ...fixture.vocabulary]}
        rows={fixture.logits.map((values, i) => [
          fixture.tokens[i],
          ...values.map((value, k) => (
            <span className={fixture.targets[i] === k ? 'dpo-gathered' : ''}>{fmt(value)}</span>
          )),
        ])}
      />
      <Table
        label="Gather after log-softmax; then keep response targets"
        headers={['t → target', 'Log probability', 'Response target?']}
        rows={fixture.targets.map((target, i) => [
          `${i} → ${target === null ? 'padding' : fixture.vocabulary[target]}`,
          target === null ? 'excluded' : fmt(fixture.contributions[i]),
          fixture.selected[i] ? 'yes' : 'no',
        ])}
      />
      <p>
        Selected row {row} sees {fixture.tokens.slice(0, row + 1).join(', ')}. Its next target is{' '}
        {fixture.tokens[row + 1]}. Response sum = <strong>{fmt(fixture.responseSum)}</strong> nats.
        This is a constructed four-symbol calculation, separate from the recorded tensor example
        below.
      </p>
      <Controls reset={() => setSelected('1')}>
        <Select
          label="Predictor row"
          value={selected}
          onChange={setSelected}
          options={[
            ['0', 'BOS predicts Q'],
            ['1', 'Q predicts Paris'],
            ['2', 'Paris predicts EOS'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function Masks() {
  const [mode, setMode] = useState('separate');
  const tokens = ['BOS', 'Q', 'Paris', 'EOS', mode === 'shared' ? 'EOS (padding)' : 'PAD'];
  return (
    <Figure id="D08" label="Attention visibility and target supervision differ">
      <Table
        label="Causal attention: a row can use earlier genuine positions"
        headers={['Query / key', ...tokens]}
        rows={tokens.map((token, row) => [
          token,
          ...tokens.map((_, column) => (row < 4 && column <= row ? '●' : '·')),
        ])}
      />
      <Table
        label="Unshifted token roles; move the target mask with targets when shifting"
        headers={['Position', 'Token', 'Visible', 'Supervised target']}
        rows={tokens.map((token, i) => [
          i,
          token,
          i < 4 ? 1 : 0,
          mode !== 'empty' && i >= 2 && i < 4 ? 1 : 0,
        ])}
      />
      <p>
        {mode === 'empty'
          ? 'Invalid example: no response targets. Reject this pair before computing its loss.'
          : 'Paris and the genuine EOS are supervised; the padded position is excluded by position. Q remains visible context even though its target is ignored.'}
      </p>
      <Controls reset={() => setMode('separate')}>
        <Select
          label="Token convention"
          value={mode}
          onChange={setMode}
          options={[
            ['separate', 'Distinct PAD and EOS'],
            ['shared', 'PAD shares EOS ID'],
            ['empty', 'Malformed empty targets'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function BoundaryAudit() {
  const [budget, setBudget] = useState(6);
  const [merge, setMerge] = useState('merge');
  return (
    <Figure id="D09" label="Tokenization boundary and whole-pair context rejection">
      <Branches>
        <div>
          <p>Separately tokenize</p>
          <Tokens
            values={merge === 'merge' ? ['a → ID 0', 'b → ID 1'] : ['a → ID 0', 'space + b → ID 1']}
          />
          <Arrow>join raw text, then tokenize ↓</Arrow>
          <Tokens values={merge === 'merge' ? ['ab → ID 2'] : ['a → ID 0', 'b → ID 1']} />
          <p>
            {merge === 'merge'
              ? 'Actual BPE fixture: the prompt token is no longer a prefix. Reject the assumed boundary.'
              : 'Schematic stable delimiter: the full prompt IDs remain a prefix.'}
          </p>
        </div>
        <div>
          <p>Complete target sequence</p>
          <Tokens values={['BOS', 'request', 'Paris', 'is', 'correct', 'EOS']} selected={[4, 5]} />
          <p>
            Context budget {budget};{' '}
            {budget < 6
              ? 'the full pair is rejected, not relabelled after truncation.'
              : 'all decisive targets and EOS fit.'}
          </p>
          <div
            className="dpo-capacity"
            style={{ width: `${(budget / 6) * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </Branches>
      <Controls
        reset={() => {
          setBudget(6);
          setMerge('merge');
        }}
      >
        <Select
          label="Boundary fixture"
          value={merge}
          onChange={setMerge}
          options={[
            ['merge', 'Cross-boundary BPE merge'],
            ['stable', 'Stable delimiter illustration'],
          ]}
        />
        <NumberField
          label="Context positions"
          value={budget}
          onChange={setBudget}
          min={3}
          max={6}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function TiltNormalize() {
  const [rewardA, setRewardA] = useState(1);
  const [beta, setBeta] = useState(1);
  const [shift, setShift] = useState(0);
  const [rewardC, setRewardC] = useState(-1);
  const reference = [0.5, 0.3, 0.2];
  const rewards = [rewardA, 0, rewardC].map((value) => value + shift);
  const result = model.tilt(reference, rewards, beta);
  return (
    <Figure id="D10" label="Exponential reweighting and shared normalization">
      <Table
        label="Three complete response outcomes"
        headers={[
          'Response',
          'Reference mass',
          'Reward',
          'Multiply by exp(reward / beta)',
          'Normalized mass',
        ]}
        rows={reference.map((p, i) => [
          <Identity index={i}>{'ABC'[i]}</Identity>,
          p,
          fmt(rewards[i]),
          fmt(result.weights[i]),
          fmt(result.probabilities[i]),
        ])}
      />
      <Arrow>
        pool all weighted masses → one shared normalizer Z = {fmt(Math.exp(result.logZ))}
      </Arrow>
      <Bars rows={result.probabilities.map((p, i) => [`${'ABC'[i]} after tilt`, p])} />
      <p>
        The masses sum to {fmt(model.sum(result.probabilities))}. A common reward shift changes Z
        but leaves normalized probabilities unchanged.
      </p>
      <Controls
        reset={() => {
          setRewardA(1);
          setBeta(1);
          setShift(0);
          setRewardC(-1);
        }}
      >
        <NumberField
          label="A reward before shift"
          value={rewardA}
          onChange={setRewardA}
          min={-2}
          max={2}
        />
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.2} max={3} />
        <NumberField
          label="Common reward shift"
          value={shift}
          onChange={setShift}
          min={-2}
          max={2}
        />
        <button
          type="button"
          onClick={() => {
            setRewardA(0);
            setRewardC(0);
          }}
        >
          Equal rewards
        </button>
      </Controls>
    </Figure>
  );
}
export function ObjectiveGeometry() {
  const [beta, setBeta] = useState(0.7);
  const [p, setP] = useState(0.7);
  const reference = [0.6, 0.4];
  const rewards = [1, 0];
  const point = model.objective([p, 1 - p], reference, rewards, beta);
  const optimum = model.tilt(reference, rewards, beta).probabilities[0];
  const series = ['reward', 'penalty', 'objective'].map((key) => ({
    label:
      key === 'penalty'
        ? 'beta × KL'
        : key === 'objective'
          ? 'Reward minus penalty'
          : 'Expected reward',
    points: curve((a) => model.objective([a, 1 - a], reference, rewards, beta)[key], 0.001, 0.999),
  }));
  const values = series.flatMap((line) => line.points.map((point) => point[1]));
  const yMin = Math.min(0, ...values) - 0.05;
  const yMax = Math.max(1, ...values) + 0.05;
  return (
    <Figure id="D11" label="Exact two-response regularized objective">
      <p>Two-response simplification: reference A/B = 0.6/0.4; rewards = 1/0.</p>
      <Chart
        xMin={0}
        xMax={1}
        yMin={yMin}
        yMax={yMax}
        xLabel="Candidate probability of A"
        yLabel="Reward and regularized objective units"
        series={series}
        point={[p, point.objective]}
      />
      <p>
        At A mass {fmt(p, 8)}, reward {fmt(point.reward, 8)} − beta KL {fmt(point.penalty)} ={' '}
        <strong>{fmt(point.objective)}</strong>. The global optimum in this two-response space is A
        ≈ <strong>{fmt(optimum, 8)}</strong>.
      </p>
      <Controls
        reset={() => {
          setBeta(0.7);
          setP(0.7);
        }}
      >
        <NumberField
          label="Candidate A probability"
          value={p}
          onChange={setP}
          min={Number.EPSILON}
          max={1 - Number.EPSILON}
          step="any"
        />
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.1} max={3} />
        <button type="button" onClick={() => setP(optimum)}>
          Move to exact optimum
        </button>
      </Controls>
    </Figure>
  );
}
export function Cancellation() {
  const [constant, setConstant] = useState(2);
  const [same, setSame] = useState('same');
  const cB = same === 'same' ? constant : -1;
  return (
    <Figure id="D12" label="Only a shared prompt constant cancels">
      <p className="dpo-prompt">
        {same === 'same'
          ? `One prompt x supplies c(x) = ${fmt(constant)} to both paths`
          : `Different prompts: c(xA) = ${fmt(constant)}, c(xB) = −1`}
      </p>
      <div className="dpo-fork">↙ shared or separate constants ↘</div>
      <Branches>
        <Response title="A reward">
          0.4 × gain 1 + {fmt(constant)} = {fmt(0.4 + constant)}
        </Response>
        <Response index={1} title="B reward">
          0.4 × gain −0.5 + {fmt(cB)} = {fmt(-0.2 + cB)}
        </Response>
      </Branches>
      <Arrow>subtract the two rewards ↓</Arrow>
      <p>
        Score-derived difference 0.6{' '}
        {same === 'same'
          ? '+ c(x) − c(x) = 0.6'
          : `+ ${fmt(constant)} − (${fmt(cB)}) = ${fmt(0.6 + constant - cB)}`}
        .
      </p>
      <p>
        {same === 'same'
          ? 'The normalizer cancels because both answers share x.'
          : 'The uncancelled prompt term prevents using the same-prompt derivation.'}
      </p>
      <Controls
        reset={() => {
          setConstant(2);
          setSame('same');
        }}
      >
        <NumberField label="Prompt A constant" value={constant} onChange={setConstant} />
        <Select
          label="Prompt identity"
          value={same}
          onChange={setSame}
          options={[
            ['same', 'Same prompt'],
            ['different', 'Different prompts'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function RankingChoices() {
  const result = model.ranking([1, 0, -1]);
  return (
    <Figure id="D12-ranking" label="A ranking uses successive remaining-choice denominators">
      <p>Constructed rewards: A = 1, B = 0, C = −1. Observed ranking: A, then B, then C.</p>
      <Branches>
        <Response title="First: choose A among A, B, C">
          exp(1) / [exp(1) + exp(0) + exp(−1)] = {fmt(result.first[0])}
          <div className="dpo-fork">A removed ↘</div>
        </Response>
        <Response index={1} title="Then: choose B among B, C">
          exp(0) / [exp(0) + exp(−1)] = {fmt(result.second[0])}
          <div className="dpo-fork">B removed ↘</div>
        </Response>
        <Response index={2} title="Finally: only C remains">
          Probability 1
        </Response>
      </Branches>
      <p className="dpo-bracket">
        Multiply conditional choices: ranking probability <strong>{fmt(result.probability)}</strong>
        . The second denominator excludes A.
      </p>
    </Figure>
  );
}
export function RewardClasses() {
  const [shift, setShift] = useState(2);
  const [support, setSupport] = useState('full');
  const reference = support === 'full' ? [0.5, 0.3, 0.2] : [0.6, 0.4, 0];
  const base = [1, 0, -1];
  const result = model.tilt(
    reference,
    base.map((r) => r + shift),
    1,
  );
  return (
    <Figure id="D13" label="Reward shifts preserve policy, support limits remain">
      <Table
        label="Same normalized policy under an additive reward constant"
        headers={['Response', 'r', 'r + common shift', 'Reference mass', 'Tilted mass']}
        rows={base.map((r, i) => [
          <Identity index={i}>{'ABC'[i]}</Identity>,
          r,
          fmt(r + shift),
          reference[i],
          fmt(result.probabilities[i]),
        ])}
      />
      <p>
        {support === 'full'
          ? 'Adding the same constant to all rewards leaves every normalized probability unchanged.'
          : 'Reference C mass is zero. A candidate with positive C mass has infinite KL; a finite reward tilt cannot create supported C mass.'}
      </p>
      <Controls
        reset={() => {
          setShift(2);
          setSupport('full');
        }}
      >
        <NumberField label="Common reward shift" value={shift} onChange={setShift} />
        <Select
          label="Reference support"
          value={support}
          onChange={setSupport}
          options={[
            ['full', 'All responses supported'],
            ['zero', 'C has zero reference mass'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function GradientFanIn() {
  const [margin, setMargin] = useState(1.5);
  const [beta, setBeta] = useState(0.4);
  const [mode, setMode] = useState('different');
  const effectiveMargin = mode === 'same' ? 0 : margin;
  const weight = beta * model.sigmoid(-beta * effectiveMargin);
  const probabilities = [0.2, 0.5, 0.3];
  const jacobian = probabilities.map((p, i) => (i === 1 ? 1 : 0) - p);
  return (
    <Figure id="D14" label="One pair weight multiplies distinct token Jacobians">
      <p>
        Pair loss → relative margin {fmt(effectiveMargin)}; weight w ={' '}
        <strong>{fmt(weight)}</strong>
      </p>
      <Branches>
        <Response title="A response targets">
          <Tokens values={['Paris', 'EOS']} />
          <p>Each selected log-probability receives direct coefficient −w.</p>
        </Response>
        <Response index={1} title="B response targets">
          <Tokens
            index={1}
            values={mode === 'same' ? ['Paris', 'EOS'] : ['Paris', 'is', 'capital', 'EOS']}
          />
          <p>Each selected log-probability receives direct coefficient +w.</p>
        </Response>
      </Branches>
      <Arrow>token Jacobians fan back into the same parameter matrix ↓</Arrow>
      <Matrix label="One shared θ receives the summed path derivatives" />
      <Table
        label="One selected vocabulary row: target is the middle token"
        headers={[
          'Vocabulary coordinate',
          'Softmax probability',
          'd log p(target) / d logit',
          'A loss derivative',
        ]}
        rows={probabilities.map((p, i) => [i, p, fmt(jacobian[i]), fmt(-weight * jacobian[i])])}
      />
      <p>
        {mode === 'same'
          ? 'Identical full response paths have identical Jacobians; the opposite signs cancel exactly.'
          : 'Different tokens and contexts have different Jacobians. Equal direct coefficients do not mean equal parameter updates.'}
      </p>
      <Controls
        reset={() => {
          setMargin(1.5);
          setBeta(0.4);
          setMode('different');
        }}
      >
        {mode !== 'same' && (
          <NumberField
            label="Relative margin"
            value={margin}
            onChange={setMargin}
            min={-5}
            max={20}
          />
        )}
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.05} max={2} />
        <Select
          label="Response paths"
          value={mode}
          onChange={setMode}
          options={[
            ['different', 'Different completions'],
            ['same', 'Identical completions'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function SharedMass() {
  const [theta, setTheta] = useState(0);
  const [rate, setRate] = useState(0.1);
  const [third, setThird] = useState('10');
  const result = model.displacement(theta, rate, Number(third));
  return (
    <Figure id="D15" label="Shared parameters can move both compared probabilities down">
      <p className="dpo-prompt">One parameter θ = {fmt(theta)} feeds all three logits</p>
      <Branches>
        {[1, -1, Number(third)].map((coefficient, i) => (
          <Response key={i} index={i} title={`Response ${'ABC'[i]}`}>
            {coefficient} × θ → logit {fmt(coefficient * theta)}
          </Response>
        ))}
      </Branches>
      <Arrow>one descent step: θ − η × derivative = {fmt(result.next)}</Arrow>
      <Branches>
        <div>
          <p>Before update</p>
          <Bars rows={result.before.map((p, i) => ['ABC'[i], p])} />
        </div>
        <div>
          <p>After update</p>
          <Bars rows={result.after.map((p, i) => ['ABC'[i], p])} />
        </div>
      </Branches>
      <p>
        Relative A/B margin {fmt(result.beforeMargin)} → <strong>{fmt(result.afterMargin)}</strong>;
        derivative {fmt(result.derivative)}. A mass change {fmt(result.after[0] - result.before[0])}
        ; B change {fmt(result.after[1] - result.before[1])}.
      </p>
      <Controls
        reset={() => {
          setTheta(0);
          setRate(0.1);
          setThird('10');
        }}
      >
        <NumberField
          label="Initial theta"
          value={theta}
          onChange={setTheta}
          min={-0.2}
          max={0.2}
          step={0.02}
        />
        <NumberField
          label="Step size eta"
          value={rate}
          onChange={setRate}
          min={0}
          max={0.3}
          step={0.01}
        />
        <Select
          label="Third logit coupling"
          value={third}
          onChange={setThird}
          options={[
            ['10', '10 × theta'],
            ['0', 'Constant zero'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function BetaQuestions() {
  const [beta, setBeta] = useState(0.4);
  const [margin, setMargin] = useState(0);
  const probabilities = model.tilt([0.5, 0.5], [1, 0], beta).probabilities;
  return (
    <Figure
      id="D16"
      label="Beta changes a fixed-reward optimum differently from a fixed-margin gradient"
    >
      <Branches>
        <div>
          <p>Hold rewards [1, 0] and reference [0.5, 0.5] fixed</p>
          <Bars rows={probabilities.map((p, i) => [`${'AB'[i]} optimum`, p])} />
          <p>Higher beta makes this optimum closer to the reference.</p>
        </div>
        <div>
          <p>Hold the current relative margin m = {fmt(margin)} fixed</p>
          <Bars
            min={0}
            max={3}
            unit="gradient magnitude"
            rows={[['beta × sigmoid(−beta m)', beta * model.sigmoid(-beta * margin)]]}
          />
          <p>At zero margin, the gradient magnitude is beta / 2.</p>
        </div>
      </Branches>
      <Controls
        reset={() => {
          setBeta(0.4);
          setMargin(0);
        }}
      >
        <NumberField
          label="Beta in both questions"
          value={beta}
          onChange={setBeta}
          min={0.1}
          max={3}
        />
        <NumberField
          label="Current relative margin"
          value={margin}
          onChange={setMargin}
          min={-2}
          max={2}
        />
      </Controls>
    </Figure>
  );
}

export function UpdateGraph() {
  const [checkpoint, setCheckpoint] = useState('0');
  const [pairIndex, setPairIndex] = useState('0');
  const run = saved.scratch.methods[0];
  const current = run.checkpoints[Number(checkpoint)];
  const pair = current.pairs[Number(pairIndex)];
  const history = current.step ? run.history.find((row) => row.update === current.step) : null;
  return (
    <Figure id="D17" label="One real causal DPO batch and its saved scores">
      <Branches>
        <div>
          <p>16 response paths × at most 10 positions</p>
          <Tokens
            values={['BOS', 'instruction', 'country', 'response', 'EOS', 'padding']}
            selected={[3, 4]}
          />
          <Arrow>IDs → embeddings; width 32 ↓</Arrow>
          <Matrix label="Two causal blocks; two heads each" rows={2} columns={4} />
          <Arrow>16 × T × 13 vocabulary logits ↓</Arrow>
          <div className="dpo-loop">Gather 72 genuine response targets → 16 sequence sums</div>
        </div>
        <div>
          <Matrix label="Same frozen starting decoder" frozen rows={2} columns={4} />
          <Arrow>16 reference sums, cached ↓</Arrow>
          <p>Reference remains fixed across all 40 updates.</p>
          <Table
            label={`Saved pair ${pairIndex} at step ${current.step}`}
            headers={['Score', 'A', 'B']}
            rows={[
              ['Policy sum', fmt(pair.chosen_logp), fmt(pair.rejected_logp)],
              ['Reference sum', fmt(pair.reference_chosen_logp), fmt(pair.reference_rejected_logp)],
              ['Targets', pair.chosen_targets, pair.rejected_targets],
            ]}
          />
        </div>
      </Branches>
      <Arrow>8 relative margins → 8 losses → mean → optimizer → policy only</Arrow>
      <p>
        Selected margin <strong>{fmt(pair.margin)}</strong>; loss {fmt(pair.loss)}. Full batch pair
        loss {fmt(current.pair_loss)}.{' '}
        {history
          ? `Recorded pre-clip gradient norm at update ${current.step}: ${fmt(history.gradient_norm_before_clip)}.`
          : 'Checkpoint zero is the shared SFT initializer, before any DPO update.'}
      </p>
      <figcaption>
        Shapes, scores and gradient norms are recorded observations. The small weight grids show
        structure; intermediate parameter arrays were not recorded.
      </figcaption>
      <Controls
        reset={() => {
          setCheckpoint('0');
          setPairIndex('0');
        }}
      >
        <Select
          label="Saved checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={run.checkpoints.map((row, i) => [String(i), `Step ${row.step}`])}
        />
        <Select
          label="Pair"
          value={pairIndex}
          onChange={setPairIndex}
          options={current.pairs.map((row, i) => [String(i), `Comparison ${row.index}`])}
        />
      </Controls>
    </Figure>
  );
}
export function ConstructedRun() {
  const [method, setMethod] = useState('0');
  const [checkpoint, setCheckpoint] = useState('4');
  const [prompt, setPrompt] = useState('0');
  const run = saved.scratch.methods[Number(method)];
  const current = run.checkpoints[Number(checkpoint)];
  const outputs = current.generation.outputs.slice(Number(prompt) * 8, Number(prompt) * 8 + 8);
  return (
    <Figure id="D18" label="Recorded constructed training and independent request checks">
      <Chart
        xMin={0}
        xMax={40}
        yMin={0}
        yMax={32}
        xLabel="Continuation update"
        yLabel="Exact request successes / 32 generated samples"
        series={saved.scratch.methods.map((item) => ({
          label: item.method,
          points: item.checkpoints.map((row) => [row.step, row.generation.criterion_count]),
        }))}
        point={[current.step, current.generation.criterion_count]}
      />
      <p>
        {run.method}, step {current.step}: pair loss <strong>{fmt(current.pair_loss)}</strong>;
        relative margin {fmt(current.mean_relative_margin)}; exact request successes{' '}
        <strong>{current.generation.criterion_count}/32</strong>; mean length{' '}
        {fmt(current.generation.mean_length)} targets.
      </p>
      <p className="dpo-prompt">{outputs[0].prompt}</p>
      <Table
        label="All eight recorded samples for this prompt"
        headers={['Sample', 'Literal response', 'Exact task', 'Stop']}
        rows={outputs.map((row) => [
          row.sample,
          row.response,
          row.criterion ? 'pass' : 'fail',
          row.stop,
        ])}
      />
      <figcaption>
        These are the four constructed training prompts, temperature 1 and seed 941. The methods use
        different token/compute budgets. Connecting checkpoint points is a guide to recorded
        observations, not unrecorded intermediate measurements.
      </figcaption>
      <Controls
        reset={() => {
          setMethod('0');
          setCheckpoint('4');
          setPrompt('0');
        }}
      >
        <Select
          label="Continuation"
          value={method}
          onChange={setMethod}
          options={saved.scratch.methods.map((row, i) => [String(i), row.method])}
        />
        <Select
          label="Saved checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={run.checkpoints.map((row, i) => [String(i), `Step ${row.step}`])}
        />
        <Select
          label="Training prompt"
          value={prompt}
          onChange={setPrompt}
          options={[
            'One word: France',
            'One word: Italy',
            'Sentence: France',
            'Sentence: Italy',
          ].map((text, i) => [String(i), text])}
        />
      </Controls>
    </Figure>
  );
}
export function RealDataSplit() {
  const [split, setSplit] = useState('train');
  const [index, setIndex] = useState('0');
  const available = saved.selection.retained[split];
  const selection = available[Math.min(Number(index), available.length - 1)];
  const row = records.find((item) => item.row_id === selection.row_id);
  const groups = ['train', 'heldout'].map(
    (part) => new Set(saved.selection.retained[part].map((item) => item.family_id)).size,
  );
  return (
    <Figure id="D19" label="Released comparisons and prompt-family separation">
      <Branches>
        <div className="dpo-loop">
          Training: 128 pairs from {groups[0]} families → fit tokenizer vocabulary
        </div>
        <div className="dpo-loop">Held out: 64 pairs from {groups[1]} families → score only</div>
      </Branches>
      <p>
        Shared family identities across the two sets: <strong>0</strong>. All 192 selected pairs fit
        the declared whole-pair context filter.
      </p>
      <p>
        Row {row.row_id}; {row.split}; family {row.family_id.slice(0, 12)}…
      </p>
      <p className="dpo-prompt">{row.prompt}</p>
      <Branches>
        <Response title="A · supplied chosen">{row.chosen}</Response>
        <Response index={1} title="B · supplied rejected">
          {row.rejected}
        </Response>
      </Branches>
      <p>
        Prepared response target counts: A {selection.chosen_ids.length}, B{' '}
        {selection.rejected_ids.length}, including EOS. Labels are released comparisons; the text
        may contain factual errors.
      </p>
      <Controls
        reset={() => {
          setSplit('train');
          setIndex('0');
        }}
      >
        <Select
          label="Split"
          value={split}
          onChange={(value) => {
            setSplit(value);
            setIndex('0');
          }}
          options={[
            ['train', 'Training'],
            ['heldout', 'Held out'],
          ]}
        />
        <Select
          label="Actual row"
          value={index}
          onChange={setIndex}
          options={available.map((item, i) => [String(i), `Row ${item.row_id}`])}
        />
      </Controls>
    </Figure>
  );
}
export function NativeParity() {
  const [pair, setPair] = useState('0');
  const [side, setSide] = useState('0');
  const [position, setPosition] = useState(30);
  const parity = saved.native.parity;
  const index = Number(pair) + Number(side) * 8;
  const ids = parity.batch.input_ids[index];
  const visible = parity.batch.attention_mask[index];
  const targets = parity.batch.completion_mask[index];
  const vocabulary = Object.fromEntries(
    Object.entries(saved.selection.vocabulary).map(([token, id]) => [id, token]),
  );
  return (
    <Figure id="D20" label="Actual TRL batch masks and same-state loss gradient comparison">
      <Branches>
        <div>
          <Matrix label="Same GPT2 weights, manual response scoring" />
          <p>Gather → genuine response sum → four-score loss</p>
        </div>
        <div>
          <Matrix label="Same GPT2 weights, DPOTrainer" />
          <p>Native collator → concatenated forward → sigmoid DPO loss</p>
        </div>
      </Branches>
      <p>
        Full batch: 16 rows × 85 positions. Gray = prompt context; amber/violet = A/B response
        targets; dark = padding. White outline = selected row.
      </p>
      <Local label="Full native target-mask matrix">
        <div className="dpo-native-matrix">
          {parity.batch.input_ids.map((row, r) => (
            <div key={r} className={r === index ? 'dpo-native-selected' : ''}>
              <span>
                {r < 8 ? 'A' : 'B'}
                {r % 8}
              </span>
              {row.map((_, c) => (
                <i
                  key={c}
                  style={{
                    background: parity.batch.completion_mask[r][c]
                      ? colours[r < 8 ? 0 : 1]
                      : parity.batch.attention_mask[r][c]
                        ? '#77716a'
                        : '#262420',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </Local>
      <Table
        label={`Actual row ${index}: positions ${Math.max(0, position - 2)}–${Math.min(84, position + 2)} of 85`}
        headers={['Position', 'Token / ID', 'Visible', 'Target', 'Predictor']}
        rows={ids
          .map((id, i) => [
            i,
            `${vocabulary[id]} / ${id}`,
            visible[i],
            targets[i],
            targets[i] && i ? i - 1 : 'excluded',
          ])
          .slice(Math.max(0, position - 2), Math.min(85, position + 3))}
      />
      <p>
        Genuine response targets in selected row: <strong>{model.sum(targets)}</strong>. Policy sum{' '}
        {fmt(parity.policy_sums[index])}; reference sum {fmt(parity.reference_sums[index])}.
      </p>
      <Table
        label="Same eight pairs and same fixed weights"
        headers={['Quantity', 'Native', 'Manual']}
        rows={[
          ['Mean pair loss', fmt(parity.native_loss, 10), fmt(parity.manual_loss, 10)],
          [
            'Maximum absolute policy-gradient difference',
            parity.max_gradient_difference.toExponential(3),
            'tolerance 2e−5',
          ],
        ]}
      />
      <figcaption>
        398 total genuine targets across the 16 rows. This receipt stores masks and sequence sums,
        not per-token numerical logits. The scratch TinyLM is a different architecture; parity here
        uses the same GPT2 on both routes.
      </figcaption>
      <Controls
        reset={() => {
          setPair('0');
          setSide('0');
          setPosition(30);
        }}
      >
        <Select
          label="Native batch pair"
          value={pair}
          onChange={setPair}
          options={Array.from({ length: 8 }, (_, i) => [String(i), `Pair ${i}`])}
        />
        <Select
          label="Response"
          value={side}
          onChange={setSide}
          options={[
            ['0', 'A chosen'],
            ['1', 'B rejected'],
          ]}
        />
        <NumberField
          label="Inspect token position"
          value={position}
          onChange={setPosition}
          min={0}
          max={84}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
export function CacheLineage() {
  const [change, setChange] = useState('policy');
  const valid = change === 'policy';
  const entry = saved.cache.cache;
  const failures = {
    reference: 'Reference weights changed',
    tokenizer: 'Token IDs / tokenizer changed',
    template: 'Rendered prompt boundary changed',
    mask: 'Response target mask changed',
    order: 'Pair-row alignment changed',
  };
  return (
    <Figure id="D21" label="Two frozen response scores depend on exact scoring identity">
      <Branches>
        <div>
          <Matrix label="Frozen reference" frozen />
          <p>Tokenizer + rendered prompt + token IDs</p>
          <Arrow>identical causal shift and masks ↓</Arrow>
          <Tokens values={['A sum', 'B sum']} />
        </div>
        <div className="dpo-loop">
          <p>Content-addressed cache row 0</p>
          <Response title="A score">{fmt(entry.scores[0])}</Response>
          <Response index={1} title="B score">
            {fmt(entry.scores[8])}
          </Response>
          <p>
            Reference digest {entry.key.reference_weights.slice(0, 12)}…<br />
            Batch digest {entry.key.batch_sha256.slice(0, 12)}…
          </p>
        </div>
      </Branches>
      <Arrow>join by exact pair order → current policy loss</Arrow>
      <p role="status">
        {valid
          ? `Policy-only changes keep this reference cache valid. Recorded changed-policy loss: ${fmt(saved.cache.changed_policy.cached_loss, 10)}; cached/direct gradient difference: 0.`
          : `${failures[change]}. Reject this cache and recompute the affected reference scores.`}
      </p>
      <figcaption>
        The numerical score cache records semantic scoring conventions. The surrounding runner
        separately binds exact source files. Caching removes repeated reference forwards; policy
        forward and backward still run.
      </figcaption>
      <Controls reset={() => setChange('policy')}>
        <Select
          label="Change one dependency"
          value={change}
          onChange={setChange}
          options={[
            ['policy', 'Policy weights only'],
            ['reference', 'Reference weights'],
            ['tokenizer', 'Tokenizer / token IDs'],
            ['template', 'Chat template'],
            ['mask', 'Target mask'],
            ['order', 'Pair order'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
function Scatter({ rows, selected, field, xLabel }) {
  const values = rows.map(field);
  const margins = rows.map((row) => row.margin);
  const boundX = Math.max(1, ...values.map(Math.abs));
  const boundY = Math.max(1, ...margins.map(Math.abs));
  const x = (value) => 300 + (value / boundX) * 280;
  const y = (value) => 115 - (value / boundY) * 95;
  return (
    <div className="dpo-chart">
      <p>
        Relative margin, nats: −{fmt(boundY)} to {fmt(boundY)}
      </p>
      <svg
        viewBox="0 0 600 230"
        role="img"
        aria-label={`${xLabel} against relative margin for 64 held-out pairs`}
      >
        <path d="M20 115H580M300 20V210" stroke="#797267" />
        {rows.map((row, i) => (
          <circle
            key={row.row_id}
            cx={x(values[i])}
            cy={y(row.margin)}
            r={i === selected ? 7 : 3.5}
            fill={row.margin >= 0 ? colours[0] : colours[1]}
            stroke={i === selected ? '#fff' : 'none'}
            strokeWidth="2"
          >
            <title>
              Row {row.row_id}: {fmt(values[i])}, margin {fmt(row.margin)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="dpo-axis">
        <span>−{fmt(boundX)}</span>
        <span>{xLabel}</span>
        <span>{fmt(boundX)}</span>
      </div>
    </div>
  );
}
export function EvidenceReadout() {
  const [checkpoint, setCheckpoint] = useState('after');
  const [selected, setSelected] = useState('0');
  const rows = saved.native[checkpoint].predictions;
  const row = rows[Number(selected)];
  const record = records.find((item) => item.row_id === row.row_id);
  return (
    <Figure id="D22" label="Real held-out margins, lengths and absolute likelihood changes">
      <Scatter
        rows={rows}
        selected={Number(selected)}
        field={(item) => item.chosen_length - item.rejected_length}
        xLabel="Chosen minus rejected length, targets"
      />
      <Scatter
        rows={rows}
        selected={Number(selected)}
        field={(item) => item.chosen_logp - item.reference_chosen_logp}
        xLabel="Chosen log-probability change, nats"
      />
      <p>
        Amber marks nonnegative margin; violet marks negative margin. The outlined point is row{' '}
        {row.row_id}. No fitted trend or causal length effect is implied.
      </p>
      <Table
        label={`Selected held-out row ${row.row_id}`}
        headers={['Quantity', 'Value']}
        rows={[
          ['Reference A − B', fmt(row.reference_chosen_logp - row.reference_rejected_logp)],
          ['Policy A − B', fmt(row.chosen_logp - row.rejected_logp)],
          ['Relative gain', fmt(row.margin)],
          ['Implicit preference probability', fmt(row.probability)],
          ['A / B targets', `${row.chosen_length} / ${row.rejected_length}`],
        ]}
      />
      <p className="dpo-prompt">{record.prompt}</p>
      <Branches>
        <Response title="Supplied A">{record.chosen}</Response>
        <Response index={1} title="Supplied B">
          {record.rejected}
        </Response>
      </Branches>
      <Controls
        reset={() => {
          setCheckpoint('after');
          setSelected('0');
        }}
      >
        <Select
          label="Measured checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={[
            ['before', 'Before DPO'],
            ['after', 'After 40 updates'],
          ]}
        />
        <Select
          label="Held-out row"
          value={selected}
          onChange={setSelected}
          options={rows.map((item, i) => [String(i), `Row ${item.row_id}`])}
        />
      </Controls>
    </Figure>
  );
}
export function GenerationAudit() {
  const [checkpoint, setCheckpoint] = useState('final');
  const [prompt, setPrompt] = useState('0');
  const all =
    checkpoint === 'final' ? saved.native.final_generations : saved.native.baseline_generations;
  const outputs = all.slice(Number(prompt) * 2, Number(prompt) * 2 + 2);
  const row = records.find((item) => item.row_id === outputs[0].row_id);
  return (
    <Figure id="D23" label="Scored pair paths and actual freely generated continuations">
      <p className="dpo-prompt">{row.prompt}</p>
      <Branches>
        <div>
          <p>Teacher-forced paths used for pair scoring</p>
          <Response title="A supplied continuation">{row.chosen}</Response>
          <Response index={1} title="B supplied continuation">
            {row.rejected}
          </Response>
        </div>
        <div>
          <p>Free autoregressive paths from the same prompt</p>
          {outputs.map((output, i) => (
            <Response key={i} index={2} title={`Recorded sample ${output.sample}`}>
              <p>{output.response}</p>
              <p>
                {output.length} new actions · {output.stop}; token IDs{' '}
                {output.response_ids.join(', ')}
              </p>
            </Response>
          ))}
        </div>
      </Branches>
      <figcaption>
        Temperature 1, seed 943, EOS or 24 actions. These literal outputs receive no new human
        helpfulness labels. Generated tokens can leave both supplied paths immediately.
      </figcaption>
      <Controls
        reset={() => {
          setCheckpoint('final');
          setPrompt('0');
        }}
      >
        <Select
          label="Policy checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={[
            ['baseline', 'Before DPO'],
            ['final', 'After 40 DPO updates'],
          ]}
        />
        <Select
          label="Recorded prompt"
          value={prompt}
          onChange={setPrompt}
          options={Array.from({ length: 4 }, (_, i) => [
            String(i),
            `Held-out row ${all[i * 2].row_id}`,
          ])}
        />
      </Controls>
    </Figure>
  );
}
export function RepeatedLabels() {
  const [a, setA] = useState(8);
  const [b, setB] = useState(2);
  const [z, setZ] = useState(0);
  const result = model.repeated(a, b, z);
  return (
    <Figure id="D24" label="Repeated comparison labels determine a finite or unbounded target">
      <Branches>
        <Response title="A preferred">{a} labels</Response>
        <Response index={1} title="B preferred">
          {b} labels
        </Response>
      </Branches>
      {result ? (
        <>
          <Arrow>empirical fraction q = {fmt(result.q)} ↓</Arrow>
          <Chart
            xMin={-5}
            xMax={5}
            yMin={0}
            yMax={5.1}
            xLabel="Modeled preference logit z"
            yLabel="Mean negative log-likelihood, nats"
            series={[
              {
                label: 'Repeated-label objective',
                points: curve((x) => model.repeated(a, b, x).loss, -5, 5),
              },
            ]}
            point={[z, result.loss]}
          />
          <p>
            At z = {fmt(z)}, loss {fmt(result.loss)}, derivative {fmt(result.derivative)}.{' '}
            {Number.isFinite(result.optimum)
              ? `Exact optimum z = ${fmt(result.optimum)}.`
              : `There is no finite optimum: the target tends to ${fmt(result.optimum)}.`}
          </p>
        </>
      ) : (
        <p role="status">No labels: the empirical fraction and mean loss are undefined.</p>
      )}
      <Controls
        reset={() => {
          setA(8);
          setB(2);
          setZ(0);
        }}
      >
        <NumberField
          label="A-preferred labels"
          value={a}
          onChange={setA}
          min={0}
          max={20}
          step={1}
        />
        <NumberField
          label="B-preferred labels"
          value={b}
          onChange={setB}
          min={0}
          max={20}
          step={1}
        />
        <NumberField label="Current logit z" value={z} onChange={setZ} />
        <button
          type="button"
          onClick={() => {
            setA(10);
            setB(0);
          }}
        >
          All labels prefer A
        </button>
      </Controls>
    </Figure>
  );
}
export function ObjectiveContrast() {
  const [kind, setKind] = useState('logistic');
  const [lengthA, setLengthA] = useState(3);
  const [lengthB, setLengthB] = useState(6);
  const reduction = model.reduction(0.9, 1.2, lengthA, lengthB);
  const losses = {
    logistic: (m) => model.softplus(-m),
    conservative: (m) => 0.8 * model.softplus(-m) + 0.2 * model.softplus(m),
    ipo: (m) => (m - 2) ** 2,
  };
  const labels = {
    logistic: 'Logistic DPO, beta 1',
    conservative: 'Smoothed logistic, epsilon 0.2',
    ipo: 'IPO quadratic, tau 0.25',
  };
  return (
    <Figure id="D25" label="Objective targets and length reductions are separate choices">
      <Chart
        xMin={-2}
        xMax={4}
        yMin={0}
        yMax={kind === 'ipo' ? 16 : 3}
        xLabel="Relative gap under the selected reduction"
        yLabel={kind === 'ipo' ? 'Squared gap units' : 'Logistic loss, nats'}
        series={[{ label: labels[kind], points: curve(losses[kind], -2, 4) }]}
      />
      <p>
        {kind === 'logistic'
          ? 'The separable logistic target is unbounded.'
          : kind === 'conservative'
            ? `The smoothed target is log(4) = ${fmt(Math.log(4))}.`
            : 'IPO targets the finite gap 1 / (2 tau) = 2 under its own score convention.'}
      </p>
      <Table
        label="Stipulated relative gains, same pair but different reduction"
        headers={['Response', 'Sum gain', 'Targets', 'Mean gain']}
        rows={[
          ['A', 0.9, lengthA, fmt(0.9 / lengthA)],
          ['B', 1.2, lengthB, fmt(1.2 / lengthB)],
        ]}
      />
      <p>
        Summed margin <strong>{fmt(reduction.summed)}</strong>; mean-normalized margin{' '}
        <strong>{fmt(reduction.mean)}</strong>. Current standard TRL DPO sums response
        log-probabilities; its IPO branch averages them.
      </p>
      <Controls
        reset={() => {
          setKind('logistic');
          setLengthA(3);
          setLengthB(6);
        }}
      >
        <Select
          label="Objective"
          value={kind}
          onChange={setKind}
          options={Object.entries(labels)}
        />
        <NumberField
          label="A target count"
          value={lengthA}
          onChange={setLengthA}
          min={1}
          max={12}
          step={1}
        />
        <NumberField
          label="B target count"
          value={lengthB}
          onChange={setLengthB}
          min={1}
          max={12}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
export function DataRefresh() {
  return (
    <Figure id="D26" label="New data, policy version and reference choice are separate">
      <Branches>
        <div>
          <p>Round 0: fixed comparisons D₀</p>
          <Tokens values={['prompt family', 'A preferred', 'B']} />
          <Arrow>frozen reference φ₀ + trainable θ₀ ↓</Arrow>
          <Matrix label="Offline DPO updates produce θ₁" />
          <div className="dpo-loop">The loss can reuse D₀ without generating new pairs.</div>
        </div>
        <div>
          <p>Optional new collection round</p>
          <Matrix label="θ₁ generates new candidate paths" />
          <Arrow>human, model or stated verifiable rule ↓</Arrow>
          <Tokens values={['new candidates', 'new judgment', 'dataset D₁']} />
          <Arrow>choose reference version explicitly ↓</Arrow>
          <div className="dpo-loop">Another offline pair update, with new data provenance</div>
        </div>
      </Branches>
      <figcaption>
        Refreshing pairs is a data-collection decision. A newer policy does not automatically change
        the reference or make the evaluator reliable. Keep held-out prompt families separate
        throughout.
      </figcaption>
    </Figure>
  );
}
