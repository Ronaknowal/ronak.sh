import React, { useEffect, useId, useRef, useState } from 'react';
import * as model from '../../data/rlhf-models.js';
import { observations } from '../../data/rlhf-observations.js';
import './rlhf-flow.css';

const fmt = (value, digits = 5) =>
  value === null
    ? 'undefined'
    : Number.isFinite(value)
      ? Number(value.toFixed(digits)).toString()
      : '∞';
const vector = (values) => `[${values.map((value) => fmt(value)).join(', ')}]`;
const hues = ['amber', 'blue', 'violet'];

function Figure({ id, label, children }) {
  return (
    <figure className="rlhf-figure" data-rlhf-figure={id} aria-label={label}>
      {children}
    </figure>
  );
}
function Controls({ reset, children }) {
  return (
    <fieldset className="rlhf-controls">
      <legend>Change this example</legend>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
}
function NumberField({ label, value, onChange, min, max, step = 0.1 }) {
  const id = useId();
  return (
    <label className="rlhf-field" htmlFor={id}>
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
    <label className="rlhf-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="rlhf-toggle">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
function Local({ label, children }) {
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
    <div className="rlhf-local-wrap">
      {overflow && (
        <p className="rlhf-scroll-hint">
          Scroll this aligned view horizontally; focus it and use the arrow keys.
        </p>
      )}
      <div ref={ref} className="rlhf-local" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
function Grid({ label, headers, rows }) {
  return (
    <div className="rlhf-grid-wrap">
      <p className="rlhf-table-label">{label}</p>
      <Local label={label}>
        <table className="rlhf-table" aria-label={label}>
          <thead>
            <tr>
              {headers.map((heading) => (
                <th key={heading} scope="col">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={j}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
    </div>
  );
}
function Identity({ index, children }) {
  return (
    <span className={`rlhf-identity rlhf-${hues[index]}`}>
      {model.responses[index].id}
      {children && <> · {children}</>}
    </span>
  );
}
function ProbabilityBars({ probabilities, references, labels = ['A', 'B', 'C'] }) {
  return (
    <div className="rlhf-bars">
      {probabilities.map((value, i) => (
        <div className={`rlhf-bar-row rlhf-${hues[i]}`} key={i}>
          <span>{labels[i]}</span>
          <div className="rlhf-bar-track">
            <span className="rlhf-bar-fill" style={{ width: `${100 * value}%` }} />
            {references && (
              <i className="rlhf-reference-tick" style={{ left: `${100 * references[i]}%` }} />
            )}
          </div>
          <output>{fmt(value)}</output>
        </div>
      ))}
    </div>
  );
}
function Arrow({ children = '↓', frozen = false }) {
  return <div className={`rlhf-arrow ${frozen ? 'rlhf-frozen' : ''}`}>{children}</div>;
}
function Matrix({ label, rows, columns, hue = 'amber' }) {
  return (
    <div className={`rlhf-matrix rlhf-${hue}`}>
      <span>{label}</span>
      <div
        className="rlhf-matrix-cells"
        aria-hidden="true"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          maxWidth: columns === 1 ? '3rem' : undefined,
        }}
      >
        {Array.from({ length: rows * columns }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
function Signed({ values, labels }) {
  const maximum = Math.max(1, ...values.map(Math.abs));
  return (
    <div className="rlhf-signed">
      {values.map((value, i) => (
        <div className={`rlhf-signed-row rlhf-${hues[i % 3]}`} key={i}>
          <span>{labels[i]}</span>
          <div className="rlhf-signed-track">
            <i
              style={{
                left: value < 0 ? `${50 - (50 * Math.abs(value)) / maximum}%` : '50%',
                width: `${(50 * Math.abs(value)) / maximum}%`,
              }}
            />
          </div>
          <output>{fmt(value)}</output>
        </div>
      ))}
    </div>
  );
}

export function PairJudgment() {
  const [request, setRequest] = useState('word');
  const winner = request === 'word' ? 0 : request === 'sentence' ? 1 : -1;
  return (
    <Figure id="D01" label="A supplied judgment depends on the request">
      <p className="rlhf-prompt">
        Name France's capital{' '}
        {request === 'word'
          ? 'in one word.'
          : request === 'sentence'
            ? 'in a complete sentence.'
            : 'with no length preference.'}
      </p>
      <div className="rlhf-branches">
        {model.responses.slice(0, 2).map((response, i) => (
          <div className={`rlhf-response rlhf-${response.colour}`} key={response.id}>
            <Identity index={i} />
            <p>{response.text}</p>
            <p className="rlhf-selection">
              {winner === i
                ? '✓ Supplied preferred response'
                : winner === -1
                  ? 'Equal under this supplied criterion'
                  : 'Other candidate'}
            </p>
          </div>
        ))}
      </div>
      <figcaption>The label follows the instruction; A and B retain their identities.</figcaption>
      <Controls reset={() => setRequest('word')}>
        <Select
          label="Request criterion"
          value={request}
          onChange={setRequest}
          options={[
            ['word', 'One word'],
            ['sentence', 'Complete sentence'],
            ['tie', 'No length preference'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function TrainingStages() {
  return (
    <Figure id="D02" label="Demonstration, comparison and policy update paths">
      <div className="rlhf-stage-map">
        <div>
          <div className="rlhf-document-stack">
            <span>x → demonstrated y</span>
            <span>x → demonstrated y</span>
          </div>
          <Arrow>↓ token targets</Arrow>
          <div className="rlhf-parameter-update">⇣ supervised parameter update</div>
          <Matrix label="SFT policy parameters" rows={3} columns={5} />
        </div>
        <div>
          <div className="rlhf-pair-stack">
            <Identity index={0}>preferred</Identity>
            <Identity index={1}>other</Identity>
          </div>
          <Arrow>↓ comparison loss</Arrow>
          <div className="rlhf-parameter-update">⇣ reward parameter update</div>
          <Matrix label="Reward parameters" rows={3} columns={3} hue="violet" />
        </div>
      </div>
      <p className="rlhf-stage-connection">
        SFT checkpoint ↙ initializes the current policy · ↘ supplies a fixed reference
      </p>
      <div className="rlhf-policy-loop">
        <div>
          <Matrix label="Current policy" rows={3} columns={5} />
          <Arrow>↓ sample tokens</Arrow>
          <div className="rlhf-token-stream">
            <span>Paris</span>
            <span>EOS</span>
          </div>
          <Arrow>↓ completed response</Arrow>
          <Matrix label="Frozen learned reward scorer" rows={2} columns={3} hue="violet" />
          <Arrow>↓ scalar reward r(x, y)</Arrow>
        </div>
        <div>
          <Matrix label="Fixed SFT reference" rows={3} columns={5} hue="blue" />
          <Arrow>↓ score the same selected response</Arrow>
          <p>Reference probabilities</p>
          <Arrow>↓ compare with current probabilities</Arrow>
        </div>
      </div>
      <p className="rlhf-stage-connection">Reward and reference comparison → policy objective</p>
      <div className="rlhf-update-loop">
        ⇡ Gradient update returns to the current policy parameters
      </div>
      <figcaption>
        Data flows downward. The returning update changes parameters; a label by itself does not
        change a generated string. SFT supplies the initial policy and fixed reference.
      </figcaption>
    </Figure>
  );
}
export function PairAnatomy() {
  const pair = observations.pair;
  return (
    <Figure id="D03" label="Literal released comparison with shared conversation trunk">
      <div className="rlhf-conversation">
        <strong>Shared prompt x · source row {pair.row_id}</strong>
        <p>{pair.prompt}</p>
      </div>
      <div className="rlhf-fork" aria-hidden="true">
        ↙ shared context ↘
      </div>
      <div className="rlhf-branches">
        <div className="rlhf-response rlhf-amber">
          <Identity index={0}>original chosen suffix</Identity>
          <p>{pair.chosen}</p>
        </div>
        <div className="rlhf-response rlhf-blue">
          <Identity index={1}>original rejected suffix</Identity>
          <p>{pair.rejected}</p>
        </div>
      </div>
      <figcaption>
        Unchanged released text and label. Prior conversation claims are part of the data, not
        endorsed facts. The prompt is concatenated exactly once with either suffix.
      </figcaption>
    </Figure>
  );
}
export function GroupSplit() {
  const [seed, setSeed] = useState(31);
  const [leak, setLeak] = useState(false);
  const split = model.splitFamilies(seed, leak);
  return (
    <Figure id="D04" label="Whole prompt families cross the split together">
      <div className="rlhf-branches">
        {['train', 'heldout'].map((name) => (
          <div key={name}>
            <p>
              {name === 'train' ? 'Training' : 'Held out'} ·{' '}
              {split[name].reduce((n, group) => n + group.rows.length, 0)} pairs
            </p>
            <div className="rlhf-family-bank">
              {split[name].map((group) => (
                <div
                  className="rlhf-family"
                  key={group.id}
                  style={{
                    '--family-colour': ['#f0b86e', '#8bc8f4', '#c5a3f0', '#ed9bac'][
                      Number(group.id.slice(1)) % 4
                    ],
                  }}
                >
                  <strong>{group.id}</strong>
                  {group.rows.map((row) => (
                    <span key={row}>{row}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p role="status">
        Family overlap: {split.overlap}.{' '}
        {split.heldout.length === 0
          ? 'No held-out families: evaluation is undefined.'
          : leak
            ? 'Both splits contain the same questions.'
            : 'Every shown family stays within one partition.'}
      </p>
      <figcaption>
        Eight constructed families demonstrate grouping. The actual retained study uses 256 training
        families and 128 different held-out families.
      </figcaption>
      <Controls
        reset={() => {
          setSeed(31);
          setLeak(false);
        }}
      >
        <NumberField
          label="Constructed split seed"
          value={seed}
          onChange={setSeed}
          min={0}
          max={99}
          step={1}
        />
        <Toggle label="Compare a leaking row split" value={leak} onChange={setLeak} />
      </Controls>
    </Figure>
  );
}
export function ScalarHead() {
  const [first, setFirst] = useState(0.4);
  const [identical, setIdentical] = useState(false);
  const state = model.head([first, -0.2], 1, 0, 1, identical);
  return (
    <Figure id="D05" label="Two feature vectors pass through the same scalar head">
      <div className="rlhf-dot-head">
        {state.features.map((features, i) => (
          <div className={`rlhf-dot-path rlhf-${hues[i]}`} key={i}>
            <Identity index={i} />
            <span className="rlhf-vector">{vector(features)}</span>
            <span>·</span>
            <span className="rlhf-vector">{vector(state.w)}</span>
            <span>→</span>
            <strong>{fmt(state.scores[i])}</strong>
          </div>
        ))}
      </div>
      <p>
        Shared weights w; bias 0. Each dot product multiplies corresponding coordinates and adds
        them.
      </p>
      <p>
        Score gap = {fmt(state.gap)}. Identical feature vectors cannot receive different scores from
        this shared head.
      </p>
      <Controls
        reset={() => {
          setFirst(0.4);
          setIdentical(false);
        }}
      >
        <NumberField
          label="First shared weight"
          value={first}
          onChange={setFirst}
          min={-2}
          max={2}
        />
        <Toggle label="Identical feature vectors" value={identical} onChange={setIdentical} />
      </Controls>
    </Figure>
  );
}
export function GapProbability() {
  const [gap, setGap] = useState(0.6);
  const probability = model.sigmoid(gap);
  return (
    <Figure id="D06" label="A score gap becomes a comparison probability">
      <div className="rlhf-number-line">
        <span>−6</span>
        <div>
          <i style={{ left: `${(100 * (gap + 6)) / 12}%` }} />
          <b style={{ left: '50%' }}>0</b>
        </div>
        <span>6</span>
      </div>
      <p>Gap d = {fmt(gap)} → sigmoid → modeled A-over-B probability</p>
      <ProbabilityBars
        probabilities={[probability, 1 - probability]}
        labels={['A wins', 'B wins']}
      />
      <p>Odds A:B = {fmt(Math.exp(gap))}:1. At gap 0, neither candidate is favored.</p>
      <Controls reset={() => setGap(0.6)}>
        <NumberField label="Score gap A minus B" value={gap} onChange={setGap} min={-6} max={6} />
      </Controls>
    </Figure>
  );
}
export function HeadGradient() {
  const [target, setTarget] = useState(1);
  const state = model.head([0.4, -0.2], target);
  return (
    <Figure id="D07" label="The pair derivative flows into shared weights">
      <div className="rlhf-gradient-tree">
        <div>p − q = {fmt(state.derivative)}</div>
        <div className="rlhf-fork">↙ multiply by hA − hB ↘</div>
        <Signed values={state.gradient} labels={['∂loss / ∂w₁', '∂loss / ∂w₂']} />
        <Arrow>↓ subtract 0.1 × gradient</Arrow>
        <p>New w = {vector(state.nextWeights)}</p>
      </div>
      <p>
        Score derivatives: A {fmt(state.derivative)}, B {fmt(-state.derivative)}. The common bias
        derivative is 0.
      </p>
      <Controls reset={() => setTarget(1)}>
        <NumberField
          label="Supplied target q"
          value={target}
          onChange={setTarget}
          min={0}
          max={1}
          step={0.05}
        />
        <button type="button" onClick={() => setTarget(state.probability)}>
          Set q equal to p
        </button>
      </Controls>
    </Figure>
  );
}
export function ScoreGauge() {
  const [offset, setOffset] = useState(0);
  const [scale, setScale] = useState(1);
  const original = model.head();
  const changed = model.head([0.4, -0.2], 1, offset, scale);
  return (
    <Figure id="D08" label="Common score shift and score scale have different effects">
      <Grid
        label="Shared transformation of both scores"
        headers={['Quantity', 'Original', 'After scale then offset']}
        rows={[
          [<Identity index={0} />, fmt(original.scores[0]), fmt(changed.scores[0])],
          [<Identity index={1} />, fmt(original.scores[1]), fmt(changed.scores[1])],
          ['Gap', fmt(original.gap), fmt(changed.gap)],
          ['A probability', fmt(original.probability), fmt(changed.probability)],
        ]}
      />
      <ProbabilityBars
        probabilities={[changed.probability, 1 - changed.probability]}
        labels={['A wins', 'B wins']}
      />
      <Controls
        reset={() => {
          setOffset(0);
          setScale(1);
        }}
      >
        <NumberField label="Common offset" value={offset} onChange={setOffset} min={-3} max={3} />
        <NumberField label="Common scale" value={scale} onChange={setScale} min={0} max={4} />
      </Controls>
    </Figure>
  );
}
export function ReferenceTerms() {
  const [a, setA] = useState(0.6);
  const [b, setB] = useState(0.3);
  const [beta, setBeta] = useState(0.5);
  const [zeroSupport, setZeroSupport] = useState(false);
  const reference = zeroSupport ? [0.5, 0.5, 0] : [0.4, 0.4, 0.2];
  const state = model.referenceTerms([a, b, 1 - a - b], reference, [1, 0.4, -0.2], beta);
  return (
    <Figure id="D09" label="Exact reference KL is a current-probability-weighted sum">
      {a + b <= 1 && <ProbabilityBars probabilities={[a, b, 1 - a - b]} references={reference} />}
      <p>Filled mass: current policy. Thin ticks: fixed reference.</p>
      {state.valid ? (
        <>
          <Grid
            label="One term per possible complete response"
            headers={[
              'Response',
              'log(current / reference)',
              'Current × log ratio',
              'Current × reward',
            ]}
            rows={state.policy.map((_, i) => [
              <Identity index={i} />,
              fmt(state.ratios[i]),
              fmt(state.contributions[i]),
              fmt(state.rewardParts[i]),
            ])}
          />
          <p>
            Exact KL = {fmt(state.kl)} nats; expected reward = {fmt(state.reward)}; β KL ={' '}
            {fmt(state.penalty)}; objective = {fmt(state.objective)}.
          </p>
        </>
      ) : (
        <p role="status">{state.reason}</p>
      )}
      <Controls
        reset={() => {
          setA(0.6);
          setB(0.3);
          setBeta(0.5);
          setZeroSupport(false);
        }}
      >
        <NumberField label="Current mass A" value={a} onChange={setA} min={0} max={1} step={0.05} />
        <NumberField label="Current mass B" value={b} onChange={setB} min={0} max={1} step={0.05} />
        <NumberField label="Reference weight β" value={beta} onChange={setBeta} min={0} max={2} />
        <Toggle
          label="Give reference C zero support"
          value={zeroSupport}
          onChange={setZeroSupport}
        />
        <button
          type="button"
          onClick={() => {
            setA(reference[0]);
            setB(reference[1]);
          }}
        >
          Set current equal to reference
        </button>
      </Controls>
    </Figure>
  );
}
export function TiltedPolicy() {
  const [reward, setReward] = useState(1);
  const [beta, setBeta] = useState(0.5);
  const [mode, setMode] = useState('usual');
  const reference = mode === 'unsupported' ? [0.5, 0.5, 0] : [0.4, 0.4, 0.2];
  const rewards = mode === 'equal' ? [reward, reward, reward] : [reward, 0.4, -0.2];
  const state = model.tilted(reference, rewards, beta);
  return (
    <Figure id="D10" label="Reward tilts reference mass before normalization">
      <Grid
        label="Stable exponential tilt, subtracting one shared maximum reward"
        headers={['Response', 'Reference', 'exp((r − max r) / β)', 'Product', 'Normalized']}
        rows={reference.map((value, i) => [
          <Identity index={i} />,
          fmt(value),
          fmt(state.factors[i]),
          fmt(state.masses[i]),
          fmt(state.policy[i]),
        ])}
      />
      <Arrow>↓ divide every product by {fmt(state.normalizer)}</Arrow>
      <ProbabilityBars probabilities={state.policy} references={reference} />
      <p>
        The shared reward shift {fmt(state.shift)} avoids large exponentials and cancels during
        normalization.
      </p>
      <Controls
        reset={() => {
          setReward(1);
          setBeta(0.5);
          setMode('usual');
        }}
      >
        <NumberField label="Reward A" value={reward} onChange={setReward} min={-2} max={2} />
        <NumberField
          label="Positive β"
          value={beta}
          onChange={setBeta}
          min={0.05}
          max={3}
          step={0.05}
        />
        <Select
          label="Reward/support case"
          value={mode}
          onChange={setMode}
          options={[
            ['usual', 'Different rewards'],
            ['equal', 'All rewards equal'],
            ['unsupported', 'C absent from reference'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ScoreFunction() {
  const [p, setP] = useState(0.25);
  const [action, setAction] = useState('0');
  const state = model.estimator(p);
  return (
    <Figure id="D11" label="One sampled score vector versus its exact expectation">
      <ProbabilityBars probabilities={state.probabilities} labels={['Draw A', 'Draw B']} />
      <Grid
        label="Every possible draw in two-logit coordinates"
        headers={['Draw', 'Score vector', 'Reward', 'Reward × score']}
        rows={state.probabilities.map((_, i) => [
          <Identity index={i} />,
          vector(state.scores[i]),
          state.rewards[i],
          vector(state.estimates[i]),
        ])}
      />
      <Signed
        values={[state.estimates[Number(action)][0], state.mean[0]]}
        labels={['This draw, coordinate 1', 'Exact mean, coordinate 1']}
      />
      <p>
        Selected vector {vector(state.estimates[Number(action)])}; exact expected vector{' '}
        {vector(state.mean)}.
      </p>
      <Controls
        reset={() => {
          setP(0.25);
          setAction('0');
        }}
      >
        <NumberField
          label="Probability of A"
          value={p}
          onChange={setP}
          min={0.05}
          max={0.95}
          step={0.05}
        />
        <Select
          label="Sampled action"
          value={action}
          onChange={setAction}
          options={[
            ['0', 'A'],
            ['1', 'B'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function BaselineVariance() {
  const [baseline, setBaseline] = useState(0);
  const [dependent, setDependent] = useState(false);
  const state = model.estimator(0.25, baseline, dependent);
  return (
    <Figure id="D12" label="A baseline changes the two-point estimator distribution">
      <Signed
        values={state.estimates.map((row) => row[0])}
        labels={['A draw, probability .25', 'B draw, probability .75']}
      />
      <p>
        Coordinate 1: mean {fmt(state.mean[0])}; exact reward gradient {fmt(state.exact[0])};
        variance {fmt(state.variance[0])}. Coordinate 2 has opposite mean and the same variance.
      </p>
      <figcaption>
        {dependent
          ? 'Setting each action baseline to its own reward erases the gradient and biases this example.'
          : 'These are exact weighted moments of both possible draws, not noisy training-loss measurements.'}
      </figcaption>
      <Controls
        reset={() => {
          setBaseline(0);
          setDependent(false);
        }}
      >
        <NumberField
          label="Action-independent baseline"
          value={baseline}
          onChange={setBaseline}
          min={-2}
          max={4}
        />
        <Toggle
          label="Compare b(action) = reward(action)"
          value={dependent}
          onChange={setDependent}
        />
        <button
          type="button"
          onClick={() => {
            setBaseline(1.5);
            setDependent(false);
          }}
        >
          Use zero-variance baseline
        </button>
      </Controls>
    </Figure>
  );
}
export function TokenPath() {
  const [temperature, setTemperature] = useState(1);
  const state = model.path(temperature);
  return (
    <Figure id="D13" label="A selected autoregressive path through conditional branches">
      <div className="rlhf-token-tree">
        <p className="rlhf-prompt">Prefix: BOS one France</p>
        <div className="rlhf-branches">
          <div className="rlhf-selected-path">
            <Arrow>↓ {fmt(state.first[0], 2)}</Arrow>
            <span className="rlhf-token rlhf-amber">Paris</span>
            <p>Prefix now includes Paris</p>
            <div className="rlhf-branches">
              <div>
                <Arrow>↓ {fmt(state.afterParis[0], 2)}</Arrow>
                <span className="rlhf-token rlhf-amber">EOS</span>
                <p>Stop</p>
              </div>
              <div>
                <Arrow>↘ {fmt(state.afterParis[1], 2)}</Arrow>
                <span className="rlhf-token rlhf-blue">more</span>
              </div>
            </div>
          </div>
          <div>
            <Arrow>↘ {fmt(state.first[1], 2)}</Arrow>
            <span className="rlhf-token rlhf-blue">Rome</span>
            <p>Unselected branch</p>
          </div>
        </div>
      </div>
      <p>
        Paris → EOS: {fmt(state.first[0])} × {fmt(state.afterParis[0])} = {fmt(state.probability)}.
        Sum of selected log probabilities = {fmt(state.logProbability)}.
      </p>
      <p className="rlhf-note">
        Branch labels round to two decimal places. The path calculation uses unrounded probabilities.
      </p>
      <Controls reset={() => setTemperature(1)}>
        <NumberField
          label="Temperature"
          value={temperature}
          onChange={setTemperature}
          min={0.2}
          max={3}
        />
      </Controls>
    </Figure>
  );
}
export function TokenMasks() {
  const [prompt, setPrompt] = useState(2);
  const [actions, setActions] = useState(2);
  const [samePad, setSamePad] = useState(false);
  const state = model.tokenMask(prompt, actions, samePad);
  return (
    <Figure id="D14" label="Causal predicting positions and response targets remain distinct">
      <Local label="Aligned input, role, attention and supervision grid">
        <div
          className="rlhf-token-grid"
          style={{
            gridTemplateColumns: `minmax(9rem, auto) repeat(${state.tokens.length}, minmax(4.5rem, 1fr))`,
          }}
        >
          {[
            ['Input position', ...state.tokens.map((_, i) => i)],
            ['Input token', ...state.tokens],
            ['Role', ...state.roles],
            ['Attention', ...state.attention],
            ['Response target', ...state.target],
            [
              'Predicting logit',
              ...state.predictor.map((value, i) => (value ? `${i} → ${i + 1}` : 'excluded')),
            ],
          ].map((row, i) =>
            row.map((cell, j) => (
              <span
                key={`${i}-${j}`}
                className={
                  j === 0 ? 'rlhf-row-label' : `rlhf-grid-cell rlhf-role-${state.roles[j - 1]}`
                }
              >
                {cell}
              </span>
            )),
          )}
        </div>
      </Local>
      <p>
        {actions
          ? `${actions} generated actions count, including genuine EOS. The first response target uses logit ${prompt - 1}.`
          : 'No generated actions: no valid token mean and no optimizer update.'}{' '}
        The aligned grid can be scrolled horizontally.
      </p>
      <Controls
        reset={() => {
          setPrompt(2);
          setActions(2);
          setSamePad(false);
        }}
      >
        <NumberField
          label="Prompt positions"
          value={prompt}
          onChange={setPrompt}
          min={1}
          max={4}
          step={1}
        />
        <NumberField
          label="Response actions including EOS"
          value={actions}
          onChange={setActions}
          min={0}
          max={4}
          step={1}
        />
        <Toggle label="Padding shares EOS token ID" value={samePad} onChange={setSamePad} />
      </Controls>
    </Figure>
  );
}

export function ModelRoles() {
  return (
    <Figure id="D15" label="Shared actor and critic, separate frozen reference and reward">
      <div className="rlhf-model-roles">
        <div className="rlhf-actor-branch">
          <p>Current prefix IDs · B × L</p>
          <Arrow>↓ causal decoder</Arrow>
          <Matrix label="Shared hidden stream · B × L × D" rows={4} columns={6} />
          <div className="rlhf-fork">↙ same hidden state ↘</div>
          <div className="rlhf-branches">
            <div>
              <Matrix label="Vocabulary projection · D × V" rows={3} columns={6} />
              <Arrow>↓</Arrow>
              <Matrix label="Actor logits · B × L × V" rows={4} columns={6} />
            </div>
            <div>
              <Matrix label="Value projection · D × 1" rows={3} columns={1} hue="blue" />
              <Arrow>↓</Arrow>
              <Matrix label="Pre-action values · B × L" rows={2} columns={4} hue="blue" />
            </div>
          </div>
        </div>
        <div className="rlhf-frozen-branch">
          <p>Same selected tokens</p>
          <Matrix label="Fixed SFT reference" rows={3} columns={5} hue="violet" />
          <Arrow frozen>⇣ no gradients</Arrow>
          <p>Reference token log probabilities</p>
          <hr />
          <p>Completed prompt + response</p>
          <Matrix label="Separate frozen reward decoder" rows={3} columns={5} hue="violet" />
          <Arrow frozen>⇣ last valid hidden vector</Arrow>
          <p>Reward score · B scalars</p>
        </div>
      </div>
      <figcaption>
        Old-policy probabilities are stored arrays from collection, not another changing model.
        Actor and critic share parameters in this implementation.
      </figcaption>
    </Figure>
  );
}
export function TokenRewards() {
  const [beta, setBeta] = useState(0.1);
  const [equal, setEqual] = useState(false);
  const state = model.shaped(beta, equal);
  return (
    <Figure id="D16" label="Selected-token reference terms plus a terminal score">
      <Grid
        label="One aligned column per generated action"
        headers={['Quantity', ...state.actions]}
        rows={[
          ['Pre-action value', ...state.values.map((value) => fmt(value))],
          ['Old log probability', ...state.old.map((value) => fmt(value))],
          ['Reference log probability', ...state.reference.map((value) => fmt(value))],
          ['Old − reference', ...state.logRatio.map((value) => fmt(value))],
          ['−β × log ratio', ...state.penalties.map((value) => fmt(value))],
          ['Completed score addition', ...state.terminal],
          ['Shaped reward', ...state.rewards.map((value) => <strong>{fmt(value)}</strong>)],
        ]}
      />
      <p>
        Total shaped reward {fmt(model.sum(state.rewards))} = terminal score 1.3 − β × sampled
        sequence log ratio {fmt(model.sum(state.logRatio))}.
      </p>
      <Controls
        reset={() => {
          setBeta(0.1);
          setEqual(false);
        }}
      >
        <NumberField
          label="Reference coefficient β"
          value={beta}
          onChange={setBeta}
          min={0}
          max={1}
          step={0.05}
        />
        <Toggle label="Equal old and reference probabilities" value={equal} onChange={setEqual} />
      </Controls>
    </Figure>
  );
}
function CreditRows({ state }) {
  return (
    <>
      <Grid
        label="Rewards and values are aligned before propagation"
        headers={['Quantity', 'Action 0', 'Action 1', 'Action 2']}
        rows={[
          ['Reward', ...state.rewards.map((value) => fmt(value))],
          ['Pre-action value', ...state.values.map((value) => fmt(value))],
          ['Residual δ', ...state.residuals.map((value) => fmt(value))],
        ]}
      />
      <div className="rlhf-backward-trace">
        {state.advantages.map((value, i) => (
          <React.Fragment key={i}>
            <div className={`rlhf-credit-node rlhf-${hues[i]}`}>
              <span>A{i}</span>
              <strong>{fmt(value)}</strong>
              <small>
                δ{i} = {fmt(state.residuals[i])}
              </small>
            </div>
            {i < 2 && <div className="rlhf-credit-link">× {fmt(state.gamma * state.lambda)}</div>}
          </React.Fragment>
        ))}
      </div>
      <p>
        Value targets A + V = {vector(state.targets)}. Start at A2 and follow the arrows toward A0.
      </p>
    </>
  );
}
export function AdvantageTrace() {
  const [lambda, setLambda] = useState(0.8);
  const state = model.gae(undefined, undefined, lambda);
  return (
    <Figure id="D17" label="Temporal residuals propagate backward through GAE">
      <CreditRows state={state} />
      <Controls reset={() => setLambda(0.8)}>
        <NumberField
          label="Trace parameter λ"
          value={lambda}
          onChange={setLambda}
          min={0}
          max={1}
          step={0.05}
        />
      </Controls>
    </Figure>
  );
}
export function TerminalCutoff() {
  const [terminal, setTerminal] = useState(true);
  const [value, setValue] = useState(0.8);
  const state = model.gae(undefined, undefined, 0.8, 1, terminal ? 0 : value);
  return (
    <Figure id="D18" label="True terminal and continuing-task cutoff use different bootstraps">
      <div className="rlhf-boundary-path">
        <span className="rlhf-token">Last observed prefix</span>
        <Arrow>→</Arrow>
        <div className={terminal ? 'rlhf-terminal' : 'rlhf-continuing'}>
          {terminal ? 'Terminal: no future return' : 'Cutoff: task continues'}
          <strong>Bootstrap {fmt(state.bootstrap)}</strong>
        </div>
        <span className="rlhf-trace-stop">║ Trace stops here in both cases</span>
      </div>
      <CreditRows state={state} />
      <figcaption>
        The canonical finite-horizon experiment terminates at EOS or eight actions. This continuing
        cutoff is a separately constructed task.
      </figcaption>
      <Controls
        reset={() => {
          setTerminal(true);
          setValue(0.8);
        }}
      >
        <Toggle label="True terminal" value={terminal} onChange={setTerminal} />
        <NumberField
          label="Next-state value for continuing cutoff"
          value={value}
          onChange={setValue}
          min={-1}
          max={2}
        />
      </Controls>
    </Figure>
  );
}
export function ValidNormalization() {
  const [filler, setFiller] = useState(100);
  const [constant, setConstant] = useState(false);
  const [empty, setEmpty] = useState(false);
  const state = model.normalization(filler, constant, empty);
  return (
    <Figure id="D19" label="Advantage statistics use only valid response cells">
      <div className="rlhf-normalization-map">
        <div>
          <p>Padded advantage matrix</p>
          <div className="rlhf-numeric-matrix">
            {state.values.flatMap((row, i) =>
              row.map((value, j) => (
                <span
                  key={`${i}-${j}`}
                  className={state.mask[i][j] ? 'rlhf-valid' : 'rlhf-padding'}
                >
                  {fmt(value)}
                  <small>{state.mask[i][j] ? 'valid' : 'PAD'}</small>
                </span>
              )),
            )}
          </div>
        </div>
        <Arrow>→</Arrow>
        <div>
          <p>Select valid cells: population statistics</p>
          <p>n = {state.selected.length}</p>
          <p>mean = {fmt(state.mean)}</p>
          <p>variance = {fmt(state.variance)}</p>
        </div>
        <Arrow>→</Arrow>
        <div>
          <p>Normalize and write to valid positions</p>
          <div className="rlhf-numeric-matrix">
            {state.normalized.flatMap((row, i) =>
              row.map((value, j) => (
                <span
                  key={`${i}-${j}`}
                  className={state.mask[i][j] ? 'rlhf-valid' : 'rlhf-padding'}
                >
                  {fmt(value, 3)}
                </span>
              )),
            )}
          </div>
        </div>
      </div>
      <p>
        {empty
          ? 'No actions: skip the optimizer; a token mean is undefined.'
          : constant
            ? 'Constant valid values center to zero. Epsilon keeps division defined.'
            : 'Padding fillers never enter the mean or population variance.'}
      </p>
      <Controls
        reset={() => {
          setFiller(100);
          setConstant(false);
          setEmpty(false);
        }}
      >
        <NumberField
          label="Excluded PAD filler"
          value={filler}
          onChange={setFiller}
          min={-1000}
          max={1000}
          step={10}
        />
        <Toggle label="Constant valid advantages" value={constant} onChange={setConstant} />
        <Toggle label="No valid actions" value={empty} onChange={setEmpty} />
      </Controls>
    </Figure>
  );
}
function ClipPlot({ advantage, ratio, epsilon }) {
  const values = Array.from({ length: 81 }, (_, i) => i / 40);
  const y = (value) => 100 - value * 22;
  const points = (clipped) =>
    values
      .map(
        (value) =>
          `${value * 200},${y(clipped ? model.clip(value, advantage, epsilon).surrogate : value * advantage)}`,
      )
      .join(' ');
  const current = model.clip(ratio, advantage, epsilon);
  return (
    <div className="rlhf-clip-plot">
      <p>Advantage {advantage} · vertical axis: surrogate</p>
      <div className="rlhf-plot-frame">
        <div className="rlhf-plot-y">
          <span style={{ top: '6%' }}>+4</span>
          <span style={{ top: '50%' }}>0</span>
          <span style={{ top: '94%' }}>−4</span>
        </div>
        <svg
          viewBox="0 0 400 200"
          role="img"
          aria-label={`Surrogate for advantage ${advantage}, ratio ${ratio}, value ${fmt(current.surrogate)}`}
        >
          <line x1="0" x2="400" y1="100" y2="100" className="rlhf-axis" />
          <line
            x1={(1 - epsilon) * 200}
            x2={(1 - epsilon) * 200}
            y1="0"
            y2="200"
            className="rlhf-clip-bound"
          />
          <line
            x1={(1 + epsilon) * 200}
            x2={(1 + epsilon) * 200}
            y1="0"
            y2="200"
            className="rlhf-clip-bound"
          />
          <polyline points={points(false)} className="rlhf-raw-line" />
          <polyline points={points(true)} className="rlhf-surrogate-line" />
          <circle cx={ratio * 200} cy={y(current.surrogate)} r="5" className="rlhf-current-point" />
        </svg>
      </div>
      <div className="rlhf-axis-labels">
        <span>0</span>
        <span>.5</span>
        <span>1</span>
        <span>1.5</span>
        <span>2</span>
      </div>
      <p>Horizontal axis: current / old probability ratio</p>
      <p>
        Surrogate {fmt(current.surrogate)}; slope{' '}
        {current.atKink ? 'kink: one-sided slopes differ' : fmt(current.slope)}.
      </p>
    </div>
  );
}
export function ClippedSurrogate() {
  const [ratio, setRatio] = useState(1.5);
  const [epsilon, setEpsilon] = useState(0.2);
  const [zero, setZero] = useState(false);
  return (
    <Figure id="D20" label="Both signs of the clipped PPO surrogate">
      <div className="rlhf-two-plots">
        <ClipPlot advantage={zero ? 0 : 2} ratio={ratio} epsilon={epsilon} />
        <ClipPlot advantage={zero ? 0 : -2} ratio={ratio} epsilon={epsilon} />
      </div>
      <p>
        Dashed blue: unclipped ratio × advantage. Amber: minimum surrogate. Vertical dotted lines:{' '}
        {fmt(1 - epsilon)} and {fmt(1 + epsilon)}. The actual ratio remains {fmt(ratio)}.
      </p>
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
          onChange={setRatio}
          min={0}
          max={2}
          step={0.05}
        />
        <NumberField
          label="Clip width ε"
          value={epsilon}
          onChange={setEpsilon}
          min={0.05}
          max={0.5}
          step={0.05}
        />
        <Toggle label="Zero advantages" value={zero} onChange={setZero} />
      </Controls>
    </Figure>
  );
}
export function SharedParameter() {
  const [rate, setRate] = useState(0.2);
  const state = model.sharedParameter(rate);
  return (
    <Figure id="D21" label="A shared parameter moves an observation beyond its plateau">
      <p className="rlhf-shared-parameter">
        θ = {fmt(state.theta)} → {fmt(state.next)}
      </p>
      <div className="rlhf-fork">↙ shared parameter ↘</div>
      <div className="rlhf-branches">
        <div className="rlhf-amber">
          <p>State 1: σ(θ), A = +1</p>
          <p>Local gradient 0 · plateau</p>
          <p>
            Ratio {fmt(state.ratios[0])} → <strong>{fmt(state.afterRatios[0])}</strong>
          </p>
        </div>
        <div className="rlhf-blue">
          <p>State 2: σ(−0.1θ − log 4), A = −1</p>
          <p>Active gradient {fmt(state.gradient)}</p>
          <p>
            Ratio {fmt(state.ratios[1])} → {fmt(state.afterRatios[1])}
          </p>
        </div>
      </div>
      <p>
        Ascent step = rate × combined gradient. State 1 is already above 1.2, yet the other state's
        update can push it farther.
      </p>
      <Controls reset={() => setRate(0.2)}>
        <NumberField
          label="Ascent learning rate"
          value={rate}
          onChange={setRate}
          min={0}
          max={0.5}
          step={0.05}
        />
      </Controls>
    </Figure>
  );
}
export function RolloutTimeline() {
  const [step, setStep] = useState(0);
  const state = model.timeline(step);
  const { round, inner } = state;
  return (
    <Figure id="D22" label="Outer collection and inner updates have different clocks">
      <div className="rlhf-timeline">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`rlhf-time-cell rlhf-${i < 5 ? 'amber' : 'blue'} ${i === step ? 'rlhf-time-current' : ''}`}
          >
            <span>{i % 5 === 0 ? `Collect ${Math.floor(i / 5) + 1}` : `Epoch ${i % 5}`}</span>
            <small>{i === step ? 'Current step' : i < step ? 'Passed' : 'Upcoming'}</small>
          </div>
        ))}
      </div>
      <Grid
        label="Which state changes now?"
        headers={['Owner', 'Current state']}
        rows={[
          ['Current actor', `θ after ${round * 4 + inner} illustrative updates`],
          [
            'Stored rollout',
            `Batch ${round + 1}: fixed tokens, old scores, advantages and targets`,
          ],
          [
            'Old probabilities',
            `Captured at θ after ${round * 4} updates; unchanged within this batch`,
          ],
          ['Reference', 'Original SFT checkpoint throughout both batches'],
        ]}
      />
      <Grid
        label="Constructed scalar policy snapshot: p = sigmoid(θ)"
        headers={['Quantity', 'Value']}
        rows={[
          ['Current θ', fmt(state.theta)],
          ['Collection θ', fmt(state.oldTheta)],
          ['Current selected log probability', fmt(state.currentLogp)],
          ['Stored old log probability', fmt(state.oldLogp)],
          ['Fixed reference log probability', fmt(state.referenceLogp)],
          ['Current / old ratio', fmt(state.ratio)],
        ]}
      />
      <figcaption>
        Constructed clock: θ advances by 0.1 for each displayed update. The actual study uses four
        minibatches per epoch. This illustration isolates snapshot timing; it is not a replay of
        neural updates. Reset restores both clocks.
      </figcaption>
      <Controls reset={() => setStep(0)}>
        <NumberField
          label="Timeline step"
          value={step}
          onChange={setStep}
          min={0}
          max={9}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
export function TrainingTrace() {
  const [index, setIndex] = useState('0');
  const row = Number(index);
  const trace = observations.firstRollout;
  const count = trace.action_lengths[row];
  const promptCount = trace.prompt_lengths[row];
  const ids = trace.ids[row].slice(0, trace.lengths[row]);
  return (
    <Figure id="D23" label="Actual retained first-rollout tensors through the complete loop">
      <p>
        Retained first rollout, sequence {row + 1}. Prompt:{' '}
        {ids
          .slice(0, promptCount)
          .map((id) => observations.tokens[id])
          .join(' ')}
      </p>
      <div className="rlhf-token-stream">
        {ids.slice(promptCount).map((id, i) => (
          <span className="rlhf-token rlhf-amber" key={i}>
            {observations.tokens[id]}
          </span>
        ))}
      </div>
      <Grid
        label="Detached collection tensors, one row per actual action"
        headers={['Action', 'Old logp', 'Reference logp', 'Value', 'Reward', 'Advantage', 'Target']}
        rows={Array.from({ length: count }, (_, i) => [
          observations.tokens[ids[promptCount + i]],
          ...['old_logp', 'reference_logp', 'old_values', 'rewards', 'advantages', 'targets'].map(
            (key) => fmt(trace[key][row][i], 4),
          ),
        ])}
      />
      <div className="rlhf-operation-chain">
        <span>collect</span>
        <Arrow>→ detached tensors →</Arrow>
        <span>shape_rewards → gae</span>
        <Arrow>→ fixed targets →</Arrow>
        <span>current_action_outputs</span>
        <Arrow>→ gradients →</Arrow>
        <span>update → new policy</span>
      </div>
      <p>
        The first actual minibatch has {observations.firstUpdate.valid_tokens} valid tokens, policy
        loss {fmt(observations.firstUpdate.policy_loss)} and value MSE{' '}
        {fmt(observations.firstUpdate.value_mse)}. That minibatch combines trajectories; it is not
        this single row's loss.
      </p>
      <Controls reset={() => setIndex('0')}>
        <Select
          label="Retained trajectory"
          value={index}
          onChange={setIndex}
          options={trace.ids.map((_, i) => [String(i), `Sequence ${i + 1}`])}
        />
      </Controls>
    </Figure>
  );
}
export function FrameworkParity() {
  const result = observations.framework;
  return (
    <Figure id="D24" label="The same GPT2 forward state reaches the same masked objective">
      <Matrix label="Same input IDs · 3 × 10" rows={3} columns={10} />
      <Arrow>↓ one current GPT2 state</Arrow>
      <div className="rlhf-branches">
        <div>
          <Matrix label="Logits · 3 × 10 × 13" rows={3} columns={10} />
          <p>Gather next targets → valid response mean</p>
          <strong>{fmt(result.gathered_nll, 9)} nats</strong>
        </div>
        <div>
          <Matrix label="Same-position masked labels · 3 × 10" rows={3} columns={10} hue="blue" />
          <p>Native causal loss → internal shift once</p>
          <strong>{fmt(result.native_shifted_nll, 9)} nats</strong>
        </div>
      </div>
      <p>
        {result.valid_targets} targets; maximum parameter-gradient difference{' '}
        {fmt(result.max_gradient_discrepancy)}. Values have shape {result.value_shape.join(' × ')}.
        CPU float32, dropout 0.
      </p>
      <figcaption>
        Measured objective/interface parity on one identical GPT2 state. TinyLM and GPT2
        architectures are different.
      </figcaption>
    </Figure>
  );
}
export function HeldoutPairs() {
  const [index, setIndex] = useState('0');
  const row = observations.heldoutExamples[Number(index)];
  const prediction = observations.heldoutPredictions.find((item) => item.row_id === row.row_id);
  const bins = model.calibration(observations.heldoutPredictions);
  return (
    <Figure id="D25" label="Observed held-out probabilities and unchanged human-comparison records">
      <Grid
        label="All 163 held-out pairs in both orientations"
        headers={[
          'Probability bin',
          'Oriented count',
          'Mean probability',
          'Observed A-win fraction',
        ]}
        rows={bins.map((bin) => [
          `${fmt(bin.low)}–${fmt(bin.high)}`,
          bin.count,
          bin.confidence === null ? 'empty' : fmt(bin.confidence),
          bin.frequency === null ? 'empty' : fmt(bin.frequency),
        ])}
      />
      <div className="rlhf-conversation">
        <strong>Source row {row.row_id} · held-out prompt</strong>
        <p>{row.prompt}</p>
      </div>
      <div className="rlhf-branches">
        <div className="rlhf-response rlhf-amber">
          <Identity index={0}>original chosen</Identity>
          <p>{row.chosen}</p>
          <p>Score {fmt(prediction.chosen_score)}</p>
        </div>
        <div className="rlhf-response rlhf-blue">
          <Identity index={1}>original rejected</Identity>
          <p>{row.rejected}</p>
          <p>Score {fmt(prediction.rejected_score)}</p>
        </div>
      </div>
      <ProbabilityBars
        probabilities={[prediction.probability, 1 - prediction.probability]}
        labels={['Model favors chosen', 'Model favors rejected']}
      />
      <p>
        Chosen-label BCE = {fmt(-Math.log(prediction.probability))}; Brier ={' '}
        {fmt((1 - prediction.probability) ** 2)}. Two orientations reuse one judgment.
      </p>
      <Controls reset={() => setIndex('0')}>
        <Select
          label="Literal pair, first twelve held-out source rows"
          value={index}
          onChange={setIndex}
          options={observations.heldoutExamples.map((item, i) => [
            String(i),
            `Source row ${item.row_id}`,
          ])}
        />
      </Controls>
    </Figure>
  );
}
function MeasuredPlot({ label, points, selected }) {
  const low = Math.min(0, ...points.map((point) => point[1]));
  const high = Math.max(1, ...points.map((point) => point[1]));
  const x = (value) => 12 + value * 18.8;
  const y = (value) => 180 - ((value - low) / (high - low)) * 164;
  return (
    <div className="rlhf-measured-plot">
      <p>{label}</p>
      <div className="rlhf-plot-frame">
        <div className="rlhf-range-labels">
          <span style={{ top: '8%' }}>{fmt(high, 2)}</span>
          <span style={{ top: '90%' }}>{fmt(low, 2)}</span>
        </div>
        <svg
          viewBox="0 0 400 200"
          role="img"
          aria-label={`${label}, recorded rounds ${points.map((point) => point[0]).join(', ')}`}
        >
          <line x1="12" x2="388" y1="180" y2="180" className="rlhf-axis" />
          <polyline
            points={points.map((point) => `${x(point[0])},${y(point[1])}`).join(' ')}
            className="rlhf-surrogate-line"
          />
          {points.map((point) => (
            <circle
              key={point[0]}
              cx={x(point[0])}
              cy={y(point[1])}
              r={point[0] === selected ? 6 : 3}
              className="rlhf-current-point"
            />
          ))}
        </svg>
      </div>
      <div className="rlhf-axis-labels">
        <span>0</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
      </div>
      <p>Horizontal axis: PPO round</p>
    </div>
  );
}
export function MeasuredTraining() {
  const [checkpoint, setCheckpoint] = useState('0');
  const [sample, setSample] = useState('0');
  const index = Number(checkpoint);
  const point = observations.evaluations[index];
  const output = point.outputs[Number(sample)];
  return (
    <Figure id="D26" label="Retained policy measurements and literal generated outputs">
      <div className="rlhf-two-plots">
        {[
          ['Mean proxy reward', 'proxy_mean'],
          ['Mean sampled sequence log ratio, nats', 'sampled_sequence_log_ratio_mean'],
          ['Mean response length, tokens', 'mean_length'],
          ['Exact criterion fraction', 'criterion_fraction'],
        ].map(([label, key]) => (
          <MeasuredPlot
            key={key}
            label={label}
            points={observations.evaluations.map((item) => [item.round, item[key]])}
            selected={point.round}
          />
        ))}
        <MeasuredPlot
          label="Mean minibatch value MSE per training round"
          points={observations.rounds.map((item) => [item.round, item.valueMse])}
          selected={point.round}
        />
      </div>
      <div className="rlhf-conversation">
        <strong>
          Round {point.round} · retained sample {Number(sample) + 1} / 32
        </strong>
        <p>Prompt: {output.prompt}</p>
        <p className="rlhf-output">{output.response}</p>
      </div>
      <p>
        Proxy {fmt(output.proxy)}; exact criterion {output.criterion}; {output.length} actions;{' '}
        {output.eos ? 'EOS ending' : 'finite horizon ending'};{' '}
        {output.malformed ? 'contains actual PAD/BOS draw' : 'no PAD/BOS draw'}.
      </p>
      <figcaption>
        Lines connect only retained measurements. Criterion and generation use the same four
        training prompts and fixed seed; no held-out policy generalization is claimed.
      </figcaption>
      <Controls
        reset={() => {
          setCheckpoint('0');
          setSample('0');
        }}
      >
        <Select
          label="Saved checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={observations.evaluations.map((item, i) => [
            String(i),
            item.round === 0 ? 'SFT baseline' : `Round ${item.round}`,
          ])}
        />
        <Select
          label="Saved generated sample"
          value={sample}
          onChange={setSample}
          options={point.outputs.map((_, i) => [String(i), `Sample ${i + 1}`])}
        />
      </Controls>
    </Figure>
  );
}
export function ProxyConflict() {
  const [bias, setBias] = useState(1);
  const [beta, setBeta] = useState(0.5);
  const [flat, setFlat] = useState(false);
  const rewards = flat ? [1, 1, 1] : [1, bias, 2 * bias];
  const state = model.tilted([1 / 3, 1 / 3, 1 / 3], rewards, beta);
  return (
    <Figure id="D27" label="A constructed proxy can favor the wrong response">
      <Grid
        label="Fixed task criterion versus changed proxy"
        headers={['Response', 'One-word exact criterion', 'Proxy', 'Optimized probability']}
        rows={model.responses.map((response, i) => [
          <>
            <Identity index={i} />
            <p>{response.text}</p>
          </>,
          i === 0 ? 1 : 0,
          fmt(rewards[i]),
          fmt(state.policy[i]),
        ])}
      />
      <ProbabilityBars probabilities={state.policy} references={[1 / 3, 1 / 3, 1 / 3]} />
      <p>
        Expected exact criterion = {fmt(state.policy[0])}; expected proxy ={' '}
        {fmt(model.sum(state.policy.map((value, i) => value * rewards[i])))}.
      </p>
      <figcaption>
        Calculated finite-response example with supplied scores. Criterion stays fixed while proxy
        bias changes.
      </figcaption>
      <Controls
        reset={() => {
          setBias(1);
          setBeta(0.5);
          setFlat(false);
        }}
      >
        <NumberField
          label="Wrong verbosity bias b"
          value={bias}
          onChange={setBias}
          min={0}
          max={2}
        />
        <NumberField
          label="Positive β"
          value={beta}
          onChange={setBeta}
          min={0.05}
          max={2}
          step={0.05}
        />
        <Toggle label="Equal proxy scores, no signal" value={flat} onChange={setFlat} />
      </Controls>
    </Figure>
  );
}
export function WorkLedger() {
  const [batch, setBatch] = useState(16);
  const [epochs, setEpochs] = useState(4);
  const state = model.work(batch, 6, epochs);
  const maximum = Math.max(state.collection, state.actorValueUpdate, 1);
  return (
    <Figure id="D28" label="Collection and repeated training have distinct work counts">
      <div className="rlhf-work-bars">
        {[
          ['Generated actions', state.collection],
          ['Actor/value update positions', state.actorValueUpdate],
          ['Reference selected-token scores', state.reference],
        ].map(([label, count], i) => (
          <div className={`rlhf-${hues[i]}`} key={label}>
            <p>
              {label}: {count}
            </p>
            <div className="rlhf-bar-track">
              <span className="rlhf-bar-fill" style={{ width: `${(count / maximum) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p>
        {batch} responses × 6 average actions = {state.collection} sampled actions. {epochs} epochs
        × {state.collection} valid positions = {state.actorValueUpdate} update positions. The reward
        model scores {state.rewardSequences} completed sequences.
      </p>
      <figcaption>
        These count different operations; bars are not equal-cost hardware work. Prefix attention,
        memory and communication are omitted. Zero epochs preserves collection.
      </figcaption>
      <Controls
        reset={() => {
          setBatch(16);
          setEpochs(4);
        }}
      >
        <NumberField
          label="Responses per collection"
          value={batch}
          onChange={setBatch}
          min={1}
          max={64}
          step={1}
        />
        <NumberField
          label="Inner epochs"
          value={epochs}
          onChange={setEpochs}
          min={0}
          max={8}
          step={1}
        />
      </Controls>
    </Figure>
  );
}
