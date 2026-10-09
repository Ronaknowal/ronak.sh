import React, { useEffect, useId, useRef, useState } from 'react';
import { MathBlock as SharedMathBlock } from '../content/Math.jsx';
import * as model from '../../data/simpo-models.js';
import { observations as saved } from '../../data/simpo-observations.js';
import './simpo-flow.css';

const colours = ['#efb66b', '#c5a3ed', '#86c9f1', '#f29f91'];
const fmt = (value, digits = 4) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)).toString() : value < 0 ? '−∞' : '∞';
const vector = (values) => `[${values.map((x) => fmt(x)).join(', ')}]`;

function Figure({ id, label, children }) {
  return (
    <figure className="simpo-figure" data-simpo-figure={id} aria-label={label}>
      {children}
    </figure>
  );
}

function Controls({ children, reset }) {
  return (
    <fieldset className="simpo-controls">
      <legend>Change this example</legend>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
}

function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label className="simpo-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min = -2, max = 2, step = 'any' }) {
  const id = useId();
  return (
    <label className="simpo-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(next))
            onChange(Math.min(max, Math.max(min, step === 1 ? Math.round(next) : next)));
        }}
      />
    </label>
  );
}

function Identity({ index = 0, children }) {
  return <strong style={{ color: colours[index] }}>{children}</strong>;
}

function Arrow({ children = '↓' }) {
  return <div className="simpo-arrow">{children}</div>;
}

function Local({ label, children, math = false, selectionKey }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    const mutations = new MutationObserver(measure);
    mutations.observe(node, { childList: true, subtree: true, characterData: true });
    const visibility = new IntersectionObserver(measure);
    visibility.observe(node);
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      visibility.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [children]);
  useEffect(() => {
    if (selectionKey === undefined) return undefined;
    const node = ref.current;
    const reveal = () => {
      const target = node.querySelector('.simpo-cell-target');
      if (!target) return;
      const bounds = node.getBoundingClientRect();
      const cell = target.getBoundingClientRect();
      const headingWidth =
        node.querySelector('.simpo-row-head')?.getBoundingClientRect().width ?? 0;
      const left = bounds.left + headingWidth + 4;
      const right = bounds.right - 4;
      if (cell.left < left) node.scrollLeft += cell.left - left;
      else if (cell.right > right) node.scrollLeft += cell.right - right;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(node);
    return () => observer.disconnect();
  }, [selectionKey]);
  return (
    <div className="simpo-local-wrap">
      {overflow && (
        <p className="simpo-scroll-hint">
          Scroll this {math ? 'equation' : 'aligned view'} horizontally; focus it and use the arrow
          keys.
        </p>
      )}
      <div
        className={math ? 'simpo-math' : 'simpo-local'}
        ref={ref}
        role="region"
        tabIndex={0}
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

export function MathEquation({ children }) {
  return (
    <Local label="Mathematical relationship" math>
      <SharedMathBlock>{children}</SharedMathBlock>
    </Local>
  );
}

function Table({ label, headers, rows }) {
  return (
    <div className="simpo-table">
      <p>{label}</p>
      <Local label={label}>
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
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

function Tokens({ values, selected = [], index = 0, indices }) {
  return (
    <div className="simpo-tokens">
      {values.map((value, i) => (
        <span
          key={i}
          className={selected.includes(i) ? 'simpo-selected' : ''}
          style={{ '--entity': colours[indices?.[i] ?? index] }}
        >
          <small>{i}</small>
          {value}
        </span>
      ))}
    </div>
  );
}

function Matrix({ label, rows = 3, columns = 4, frozen = false }) {
  return (
    <div className={`simpo-matrix ${frozen ? 'simpo-frozen' : ''}`}>
      <strong>{label}</strong>
      <div style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, i) => (
          <i key={i} style={{ opacity: 0.35 + (i % 4) * 0.15 }} />
        ))}
      </div>
      <small>Schematic shared parameter array{frozen ? ' · fixed' : ''}</small>
    </div>
  );
}

function Branch({ index = 0, title, children }) {
  return (
    <div className="simpo-branch" style={{ '--entity': colours[index] }}>
      <Identity index={index}>{title}</Identity>
      {children}
    </div>
  );
}

function Bars({ labels, values, maximum = 1, colourIndices }) {
  return (
    <div className="simpo-bars">
      {values.map((value, i) => (
        <div key={labels[i]}>
          <span>{labels[i]}</span>
          <div className="simpo-bar-track">
            <i
              style={{
                width: `${(100 * Math.max(0, value)) / maximum}%`,
                background: colours[colourIndices?.[i] ?? i % colours.length],
              }}
            />
          </div>
          <output>{fmt(value)}</output>
        </div>
      ))}
    </div>
  );
}

function Chart({
  lines,
  xLabel,
  yLabel,
  xMin = -1,
  xMax = 1,
  yMin = 0,
  yMax = 4,
  point,
  threshold,
}) {
  const left = 16,
    right = 384,
    top = 15,
    bottom = 175;
  const x = (value) => left + ((value - xMin) / (xMax - xMin)) * (right - left);
  const y = (value) => bottom - ((value - yMin) / (yMax - yMin)) * (bottom - top);
  return (
    <div className="simpo-chart">
      <p>
        {yLabel} · range {fmt(yMin)} to {fmt(yMax)}
      </p>
      <svg viewBox="0 0 400 190" role="img" aria-label={`${yLabel} against ${xLabel}`}>
        <path className="simpo-axis" d={`M${left},${top}V${bottom}H${right}`} />
        {yMin < 0 && yMax > 0 && <path className="simpo-zero" d={`M${left},${y(0)}H${right}`} />}
        {threshold >= xMin && threshold <= xMax && (
          <path className="simpo-zero" d={`M${x(threshold)},${top}V${bottom}`} />
        )}
        {lines.map((line, index) => (
          <path
            key={line.name}
            data-series={line.name}
            d={line.values.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a)},${y(b)}`).join(' ')}
            fill="none"
            stroke={line.colour ?? colours[index]}
            strokeWidth="2.5"
            strokeDasharray={line.dashed ? '6 4' : undefined}
          />
        ))}
        {point && (
          <circle
            cx={x(point[0])}
            cy={y(point[1])}
            r="5"
            fill="white"
            stroke="#181818"
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="simpo-chart-ends">
        <span>{fmt(xMin)}</span>
        <span>{xLabel}</span>
        <span>{fmt(xMax)}</span>
      </div>
      <p className="simpo-legend">
        {lines.map((line, i) => (
          <span key={line.name} style={{ color: line.colour ?? colours[i] }}>
            {line.name}
            {line.dashed ? ' (dashed)' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}

export function PairRequest() {
  const [format, setFormat] = useState('word');
  const prompt =
    format === 'word'
      ? "Name France's capital in one word."
      : format === 'sentence'
        ? "Name France's capital in a sentence."
        : "Name France's capital.";
  return (
    <Figure id="D01" label="One request, two responses and a supplied preference">
      <p className="simpo-centre">
        <strong>{prompt}</strong>
      </p>
      <div className="simpo-fork" aria-hidden="true">
        ↙　 ↘
      </div>
      <div className="simpo-branches">
        <Branch title="A">
          <p>Paris</p>
        </Branch>
        <Branch index={1} title="B">
          <p>Paris is the capital of France.</p>
        </Branch>
      </div>
      <p className="simpo-bracket">
        Supplied format criterion →{' '}
        {format === 'word'
          ? 'A preferred'
          : format === 'sentence'
            ? 'B preferred'
            : 'no preference established by this criterion'}
      </p>
      <Controls reset={() => setFormat('word')}>
        <Select
          label="Requested format"
          value={format}
          onChange={setFormat}
          options={[
            ['word', 'One word'],
            ['sentence', 'A sentence'],
            ['none', 'No specified format'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function ComputationRoles() {
  return (
    <Figure
      id="D02"
      label="Both candidates share policy weights; DPO additionally scores a reference"
    >
      <div className="simpo-branches">
        <Branch title="Trainable policy">
          <Tokens values={['A response', 'B response']} indices={[0, 1]} />
          <Arrow />
          <Matrix label="One θ, both responses" />
          <Arrow />
          <div className="simpo-branches">
            <Identity>A policy score</Identity>
            <Identity index={1}>B policy score</Identity>
          </div>
          <p>Sum/count reduction comes next.</p>
        </Branch>
        <Branch index={2} title="Additional DPO reference">
          <Tokens values={['A response', 'B response']} indices={[0, 1]} />
          <Arrow />
          <Matrix label="One fixed reference" frozen />
          <Arrow />
          <p>Two fixed scores · no reference gradient</p>
        </Branch>
      </div>
      <div className="simpo-bracket">
        Policy scores → SimPO comparison
        <br />
        Policy and reference scores → DPO comparison
      </div>
    </Figure>
  );
}

export function CausalGather() {
  const [position, setPosition] = useState(2);
  const fixture = model.gathered(saved.fixture);
  const row = fixture.rows[position];
  const ids = fixture.ids;
  return (
    <Figure id="D03" label="A causal logits tensor gathers the following token once">
      <p>
        Exact program fixture: 2 batches × 5 positions × 13 vocabulary logits. Q expands to the
        prompt tokens “one France”.
      </p>
      <Tokens
        values={['BOS', 'one', 'France', 'Paris', 'EOS']}
        selected={Array.from({ length: position + 1 }, (_, i) => i)}
      />
      <p>
        Context ends at position {position}; its logits predict position {position + 1}, token ID{' '}
        {row.target}.
      </p>
      <Local label="First batch logits matrix with selected predictor row" selectionKey={position}>
        <div className="simpo-logits" style={{ gridTemplateColumns: '5rem repeat(13, 3.2rem)' }}>
          <strong className="simpo-row-head">t / ID</strong>
          {Array.from({ length: 13 }, (_, i) => (
            <strong key={i}>{i}</strong>
          ))}
          {saved.fixture.logits[0].slice(0, 4).map((values, t) => (
            <React.Fragment key={t}>
              <strong className="simpo-row-head">t = {t}</strong>
              {values.map((value, v) => (
                <span
                  key={v}
                  className={
                    t === position && v === row.target
                      ? 'simpo-cell-target'
                      : t === position
                        ? 'simpo-cell-row'
                        : ''
                  }
                >
                  {fmt(value, 2)}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </Local>
      <Arrow>log softmax → gather ID {row.target}</Arrow>
      <p>
        p = {fmt(row.probabilities[row.target], 6)}; log p = {fmt(row.logp, 6)}; response target{' '}
        {row.selected ? 'included' : 'excluded'}. Selected response sum = {fmt(fixture.sum, 6)} over{' '}
        {fixture.count} targets.
      </p>
      <Controls reset={() => setPosition(2)}>
        <Select
          label="Predictor position"
          value={position}
          onChange={(value) => setPosition(Number(value))}
          options={ids.slice(0, -1).map((_, i) => [i, `Position ${i} predicts ${i + 1}`])}
        />
      </Controls>
    </Figure>
  );
}

export function TargetMasks() {
  const [same, setSame] = useState('same');
  const [malformed, setMalformed] = useState('valid');
  const fixture = model.gathered(saved.fixture, 1);
  return (
    <Figure
      id="D04"
      label="Causal attention and response supervision are separate positional masks"
    >
      <p>
        Second row: response positions 1–3, with genuine EOS at position 3 and padding at position
        4. The supplied response mask selects which targets contribute to the score.
      </p>
      <Tokens
        values={['BOS', 'Rome', 'is', 'EOS', same === 'same' ? 'EOS / PAD' : 'PAD']}
        selected={malformed === 'empty' ? [] : [1, 2, 3]}
        index={1}
      />
      <div
        className="simpo-attention"
        role="img"
        aria-label="Allowed causal keys for real queries 0 through 3. Padded query 4 has an ignored output; its attention is not depicted."
      >
        <div>query ↓ / key →</div>
        {Array.from({ length: 4 }, (_, t) => (
          <div className="simpo-attention-row" key={t}>
            <span>t {t}</span>
            {Array.from({ length: 5 }, (_, k) => (
              <i key={k} className={k <= t ? 'simpo-visible-key' : ''}>
                {k}
              </i>
            ))}
          </div>
        ))}
        <p>Query 4 (padding): output ignored; attention not depicted.</p>
      </div>
      <p>
        Rows 0–3 show allowed causal keys for real queries. Implementations may compute the padded
        query differently; a key-padding mask does not necessarily suppress its query. Its unused
        output is discarded.
      </p>
      <Table
        label="Position, visibility and supervision"
        headers={['Position', 'Attention', 'Response label']}
        rows={fixture.ids.map((_, i) => [
          i,
          Number(fixture.attention[i]),
          malformed === 'empty'
            ? 'ignored'
            : fixture.targets[i]
              ? i === 3
                ? 'EOS'
                : `ID ${fixture.ids[i]}`
              : 'ignored',
        ])}
      />
      <p role="status">
        {malformed === 'empty'
          ? 'Rejected: zero response targets. There is no mean score.'
          : `Target count 3; score sum ${fmt(fixture.sum, 6)}. ${same === 'same' ? 'The shared EOS ID does not select padding.' : 'Renaming PAD does not change the positional mask.'}`}
      </p>
      <Controls
        reset={() => {
          setSame('same');
          setMalformed('valid');
        }}
      >
        <Select
          label="Padding token convention"
          value={same}
          onChange={setSame}
          options={[
            ['same', 'PAD equals EOS ID'],
            ['different', 'Distinct PAD label'],
          ]}
        />
        <Select
          label="Response mask"
          value={malformed}
          onChange={setMalformed}
          options={[
            ['valid', 'Valid three targets'],
            ['empty', 'Malformed: no targets'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

const pathFixtures = {
  unequal: [
    [-0.4, -0.6],
    [-0.2, -0.3, -0.4, -0.3],
  ],
  equal: [
    [-0.4, -0.6],
    [-0.5, -0.7],
  ],
  easy: [
    [-0.4, -0.6],
    [-0.4, -0.6, -0.01, -0.01],
  ],
};

export function SumToMean() {
  const [name, setName] = useState('unequal');
  const scores = pathFixtures[name].map(model.score);
  return (
    <Figure id="D05" label="Token contributions become a sum and then a response mean">
      <div className="simpo-branches">
        {pathFixtures[name].map((values, i) => (
          <Branch key={i} index={i} title={i ? 'B' : 'A'}>
            <Tokens values={values.map((v) => fmt(v))} index={i} />
            <div className="simpo-bracket">Σ = {fmt(scores[i].sum)}</div>
            <Arrow>÷ {scores[i].count} targets</Arrow>
            <p>Mean = {fmt(scores[i].mean)}</p>
          </Branch>
        ))}
      </div>
      <p>
        Sum ranks {scores[0].sum > scores[1].sum ? 'A' : 'B'} higher; mean ranks{' '}
        {scores[0].mean > scores[1].mean ? 'A' : scores[0].mean < scores[1].mean ? 'B' : 'a tie'}.
        These are stipulated paths; other probability mass is unspecified.
      </p>
      <Controls reset={() => setName('unequal')}>
        <Select
          label="Token contribution fixture"
          value={name}
          onChange={setName}
          options={[
            ['unequal', 'Unequal counts'],
            ['equal', 'Equal target counts'],
            ['easy', 'Append easy tokens'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function TreeDrawing({ rank = 'sum', counts }) {
  const leaves = model.probabilityTree();
  const winner = [...leaves].sort((a, b) => b[rank] - a[rank])[0].name;
  return (
    <>
      <p className="simpo-centre">
        <strong>Root: one next-token distribution</strong>
      </p>
      <div className="simpo-tree">
        <div className="simpo-tree-arm" style={{ '--entity': colours[0] }}>
          <Identity>A · p = 0.4</Identity>
          <Arrow>↓ EOS · p = 1</Arrow>
          <p>Leaf A · 2 targets</p>
        </div>
        <div className="simpo-tree-arm" style={{ '--entity': colours[1] }}>
          <Identity index={1}>B · p = 0.3</Identity>
          <div className="simpo-tree-split">
            {[
              ['B1', 0.9],
              ['B2', 0.1],
            ].map(([name, p]) => (
              <div key={name}>
                <p>
                  ↳ {name} · p = {p}
                </p>
                <Arrow>↓ EOS · p = 1</Arrow>
                <p>3 targets</p>
              </div>
            ))}
          </div>
        </div>
        <div className="simpo-tree-arm" style={{ '--entity': colours[2] }}>
          <Identity index={2}>C · p = 0.3</Identity>
          <Arrow>↓ EOS · p = 1</Arrow>
          <p>Leaf C · 2 targets</p>
        </div>
      </div>
      <Table
        label={`Full leaf distribution; ${rank} ranks ${winner} first`}
        headers={[
          'Leaf',
          'Mass',
          'L',
          'Sum log p',
          'Mean log p',
          'exp(mean)',
          ...(counts ? ['Sample count'] : []),
        ]}
        rows={leaves.map((leaf) => [
          leaf.name,
          fmt(leaf.mass),
          leaf.count,
          fmt(leaf.sum),
          fmt(leaf.mean),
          fmt(leaf.geometricMean),
          ...(counts ? [counts[leaf.name]] : []),
        ])}
      />
      <p>
        Complete leaf mass = 1. Geometric means sum to{' '}
        {fmt(model.sum(leaves.map((leaf) => leaf.geometricMean)))}; they are not a normalized
        response distribution.
      </p>
    </>
  );
}

export function ProbabilityTree() {
  const [rank, setRank] = useState('sum');
  return (
    <Figure id="D06" label="Complete probability tree with every forced EOS edge">
      <TreeDrawing rank={rank} />
      <Controls reset={() => setRank('sum')}>
        <Select
          label="Rank complete leaves by"
          value={rank}
          onChange={setRank}
          options={[
            ['sum', 'Sum log probability'],
            ['mean', 'Mean log probability'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function SegmentationAndEOS() {
  const [length, setLength] = useState(2);
  const [eos, setEos] = useState('include');
  const values = Array(length).fill(-2 / length);
  const selected = eos === 'include' ? [...values, -0.3] : values;
  const score = model.score(selected);
  return (
    <Figure id="D07" label="Stipulated segmentation and genuine EOS change the score denominator">
      <p>Stipulated content event mass exp(−2) = {fmt(Math.exp(-2))}</p>
      <Tokens values={values.map((v, i) => `piece ${i + 1}: ${fmt(v)}`)} />
      <Arrow />
      <Tokens values={[eos === 'include' ? 'EOS: −0.3 included' : 'EOS: not scored']} index={2} />
      <p>
        {eos === 'include' ? 'Complete-response convention' : 'Different prefix-scoring convention'}
        : sum {fmt(score.sum)} ÷ {score.count} = mean {fmt(score.mean)}. Alternate segmentation is a
        constructed comparison, not invariance of a trained tokenizer.
      </p>
      <Controls
        reset={() => {
          setLength(2);
          setEos('include');
        }}
      >
        <Select
          label="Content pieces"
          value={length}
          onChange={(v) => setLength(Number(v))}
          options={[
            [2, 'Two targets'],
            [4, 'Four targets'],
          ]}
        />
        <Select
          label="Termination score"
          value={eos}
          onChange={setEos}
          options={[
            ['include', 'Include genuine EOS'],
            ['omit', 'Content prefix only'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function MarginPipeline() {
  const [gap, setGap] = useState(0.3);
  const [gamma, setGamma] = useState(0.4);
  const result = model.pair(gap, 2, gamma);
  return (
    <Figure id="D08" label="Mean scores become a gap, scaled margin and smooth loss">
      <div className="simpo-branches">
        <Branch title={`uA = ${fmt(-0.8 + gap)}`}>
          <p>Stipulated mean score A</p>
        </Branch>
        <Branch index={1} title="uB = −0.8">
          <p>Stipulated mean score B</p>
        </Branch>
      </div>
      <Arrow>subtract → d = {fmt(gap)}</Arrow>
      <div className="simpo-pipeline">
        <span>
          × β = 2<br />
          {fmt(2 * gap)}
        </span>
        <b>→</b>
        <span>
          − γ = {fmt(gamma)}
          <br />z = {fmt(result.z)}
        </span>
        <b>→</b>
        <span>
          softplus(−z)
          <br />
          {fmt(result.loss)}
        </span>
      </div>
      <p>
        Derivative ∂loss/∂d = {fmt(result.derivative)}. Raw score winner:{' '}
        {gap > 0 ? 'A' : gap < 0 ? 'B' : 'tie'}. Desired gap = {fmt(result.threshold)}.
      </p>
      <Controls
        reset={() => {
          setGap(0.3);
          setGamma(0.4);
        }}
      >
        <NumberField label="Stipulated gap d" value={gap} onChange={setGap} min={-1} max={0.8} />
        <NumberField label="Absolute gamma" value={gamma} onChange={setGamma} min={0} max={2} />
      </Controls>
    </Figure>
  );
}

export function SoftThreshold() {
  const [gamma, setGamma] = useState(0.4);
  const [hinge, setHinge] = useState('off');
  const grid = Array.from({ length: 81 }, (_, i) => -1 + i / 40);
  const result = model.pair(0.3, 2, gamma);
  const lines = [
    { name: 'Logistic loss', values: grid.map((d) => [d, model.pair(d, 2, gamma).loss]) },
  ];
  if (hinge === 'on')
    lines.push({
      name: 'Different hinge loss',
      values: grid.map((d) => [d, Math.max(0, gamma - 2 * d)]),
      dashed: true,
    });
  return (
    <Figure id="D09" label="The desired gap is not a hard stopping threshold">
      <Chart
        lines={lines}
        xLabel="Mean-score gap d"
        yLabel="Loss"
        yMax={4.1}
        point={[0.3, result.loss]}
        threshold={result.threshold}
      />
      <Chart
        lines={[
          {
            name: 'Signed logistic derivative',
            values: grid.map((d) => [d, model.pair(d, 2, gamma).derivative]),
            colour: colours[2],
          },
        ]}
        xLabel="Mean-score gap d"
        yLabel="Derivative per unit gap"
        yMin={-2}
        yMax={0}
        point={[0.3, result.derivative]}
        threshold={result.threshold}
      />
      <p>
        Marker d = 0.3: loss {fmt(result.loss)}, slope {fmt(result.derivative)}. Desired gap{' '}
        {fmt(result.threshold)}: loss log 2, slope −1. The vertical dashed marker is the desired
        gap.
      </p>
      <Controls
        reset={() => {
          setGamma(0.4);
          setHinge('off');
        }}
      >
        <NumberField label="Absolute gamma" value={gamma} onChange={setGamma} min={0} max={2} />
        <Select
          label="Comparison objective"
          value={hinge}
          onChange={setHinge}
          options={[
            ['off', 'Logistic only'],
            ['on', 'Add distinct hinge loss'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function MarginUnits() {
  const [hold, setHold] = useState('gamma');
  const [beta, setBeta] = useState(2);
  const gamma = hold === 'gamma' ? 0.4 : 0.2 * beta;
  const result = model.pair(0.3, beta, gamma);
  return (
    <Figure id="D10" label="Absolute gamma and target-gap ratio are different units">
      <div className="simpo-rulers">
        <div>
          <span>Absolute γ</span>
          <i style={{ width: `${(gamma / 1.6) * 100}%` }} />
          <output>{fmt(gamma)}</output>
        </div>
        <Arrow>γ = β × δ</Arrow>
        <div>
          <span>Gap units δ</span>
          <i style={{ width: `${(result.threshold / 1.6) * 100}%` }} />
          <output>{fmt(result.threshold)}</output>
        </div>
      </div>
      <p>
        β = {fmt(beta)}; fixed d = 0.3 → z {fmt(result.z)}, loss {fmt(result.loss)}, slope{' '}
        {fmt(result.derivative)}. Official ratio δ maps to TRL's absolute simpo_gamma = {fmt(gamma)}
        .
      </p>
      <Controls
        reset={() => {
          setHold('gamma');
          setBeta(2);
        }}
      >
        <Select
          label="Quantity held fixed"
          value={hold}
          onChange={setHold}
          options={[
            ['gamma', 'Hold gamma at 0.4'],
            ['delta', 'Hold ratio at 0.2'],
          ]}
        />
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.25} max={4} step={0.25} />
      </Controls>
    </Figure>
  );
}

export function TokenCredit() {
  const [counts, setCounts] = useState('unequal');
  const lengths = counts === 'unequal' ? [2, 4] : [3, 3];
  const weight = -model.pair(0.3).derivative;
  return (
    <Figure id="D11" label="Pair coefficient distributes through two mean reductions">
      <div className="simpo-branches">
        {lengths.map((length, i) => (
          <Branch key={i} index={i} title={i ? 'B rejected' : 'A chosen'}>
            <Tokens
              values={Array.from({ length }, () => fmt(((i ? 1 : -1) * weight) / length))}
              index={i}
            />
            <p>
              ∂loss/∂token log p = {i ? '+' : '−'}w/{length}
            </p>
            <div className="simpo-bracket">Coefficient sum = {fmt((i ? 1 : -1) * weight)}</div>
          </Branch>
        ))}
      </div>
      <Arrow>both branches → logit Jacobians → shared θ</Arrow>
      <Matrix label="One causal model receives both paths" />
      <p>
        w = β sigmoid(γ − βd) = {fmt(weight)}. These are log-probability coordinates; parameter
        gradients also require the shared model's Jacobian.
      </p>
      <Controls reset={() => setCounts('unequal')}>
        <Select
          label="Response target counts"
          value={counts}
          onChange={setCounts}
          options={[
            ['unequal', 'A: 2, B: 4'],
            ['equal', 'A: 3, B: 3'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function SharedContext() {
  const context = saved.response.shared_context;
  return (
    <Figure id="D12" label="Ignored prompt labels retain gradient paths through causal context">
      <Tokens
        values={['BOS (ID 1)', 'one (ID 3)', 'France (ID 5)', 'Paris (ID 7)', 'EOS']}
        selected={[0, 1, 2]}
        indices={[0, 1, 2, 3, 3]}
      />
      <div className="simpo-bracket">First response target: Paris at position 3</div>
      <Arrow>earlier prompt embeddings → causal attention at predictor position 2</Arrow>
      <Matrix label="Shared causal decoder" />
      <Arrow>Paris NLL → backward through context</Arrow>
      <Bars
        labels={['BOS embedding norm', 'one embedding norm', 'France embedding norm']}
        values={Object.values(context.prompt_embedding_gradient_norms)}
        maximum={0.4}
      />
      <p>
        Saved no-fit probe: first-target NLL {fmt(context.first_target_nll, 10)}. Prompt target
        losses are ignored, while these prompt embedding gradients are nonzero. No future response
        position is in this predictor's context.
      </p>
    </Figure>
  );
}

const conditionNames = {
  'mean-margin': 'Mean + margin',
  'mean-zero': 'Mean + zero margin',
  'sum-margin': 'Sum + margin',
  'mean-margin-nll': 'Mean + margin + NLL',
};
const methodName = (method) => conditionNames[method.condition.name] ?? method.condition.name;

export function ScratchLoop() {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const method = saved.scratch.methods[index];
  const checkpoint = method.checkpoints.find((row) => row.step === step);
  return (
    <Figure id="D17" label="A shared causal decoder and one SFT state feed four continuation arms">
      <Tokens values={['prompt IDs', 'response IDs', 'positional mask']} />
      <Arrow />
      <div className="simpo-decoder">
        <Matrix label="13 × 32 token embeddings" />
        <Arrow />
        <div className="simpo-branches">
          <div className="simpo-attention-mini">
            Causal attention
            <br />◼ ◻ ◻<br />◼ ◼ ◻<br />◼ ◼ ◼
          </div>
          <div>
            <p>2 blocks · 2 heads · width 32</p>
            <p>Residual + feedforward paths</p>
          </div>
        </div>
        <Arrow />
        <Matrix label="32 × 13 output projection" />
        <Arrow>shift → response sums/counts → pair loss → AdamW</Arrow>
      </div>
      <p>26,560 shared parameters; seed 47. SFT initializer:</p>
      <code className="simpo-digest">{saved.scratch.shared_sft_weights}</code>
      <div className="simpo-fork" aria-hidden="true">
        ↙　↓　↓　↘
      </div>
      <div className="simpo-method-fork">
        {saved.scratch.methods.map((arm, i) => (
          <div key={arm.condition.name} className={i === index ? 'simpo-selected-arm' : ''}>
            <Identity index={i}>{methodName(arm)}</Identity>
            <p>
              {arm.condition.reduction} scores; γ {arm.condition.gamma}; NLL weight{' '}
              {arm.condition.chosen_weight}
            </p>
          </div>
        ))}
      </div>
      <p>
        Selected saved update {step}: objective {fmt(checkpoint.objective, 6)}, common mean gap{' '}
        {fmt(checkpoint.mean_gap, 6)}. All branches begin from the same SFT digest; each has its own
        optimizer continuation.
      </p>
      <Controls
        reset={() => {
          setIndex(0);
          setStep(0);
        }}
      >
        <Select
          label="Continuation"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={saved.scratch.methods.map((arm, i) => [i, methodName(arm)])}
        />
        <Select
          label="Saved update"
          value={step}
          onChange={(v) => setStep(Number(v))}
          options={method.checkpoints.map((row) => [row.step, String(row.step)])}
        />
      </Controls>
    </Figure>
  );
}

function scratchMetric(row, metric) {
  if (metric === 'objective') return row.objective;
  if (metric === 'gap') return row.mean_gap;
  if (metric === 'chosen')
    return model.sum(row.pairs.map((pair) => pair.chosen_sum)) / row.pairs.length;
  if (metric === 'rejected')
    return model.sum(row.pairs.map((pair) => pair.rejected_sum)) / row.pairs.length;
  const outputs = row.generation.outputs;
  if (metric === 'length') return model.sum(outputs.map((out) => out.length)) / outputs.length;
  return outputs.filter((out) => out.criterion).length;
}

export function AblationOutcomes() {
  const [metric, setMetric] = useState('success');
  const [index, setIndex] = useState(0);
  const titles = {
    success: 'Exact-format/capital successes of 32',
    gap: 'Common mean-score gap',
    objective: 'Each arm’s own training objective',
    length: 'Mean generated target count',
    chosen: 'Mean chosen sum log p',
    rejected: 'Mean rejected sum log p',
  };
  const lines = saved.scratch.methods.map((method, i) => ({
    name: methodName(method),
    values: method.checkpoints.map((row) => [row.step, scratchMetric(row, metric)]),
    colour: colours[i],
    dashed: i > 1,
  }));
  const values = lines.flatMap((line) => line.values.map((row) => row[1]));
  const low = Math.min(0, ...values),
    high = Math.max(0, ...values);
  const span = Math.max(1, high - low);
  const method = saved.scratch.methods[index];
  return (
    <Figure id="D18" label="All four saved continuations share one measured evaluation">
      <Chart
        lines={lines}
        xLabel="Saved update"
        yLabel={titles[metric]}
        xMin={0}
        xMax={40}
        yMin={low < 0 ? low - 0.05 * span : 0}
        yMax={high + 0.08 * span}
      />
      <Table
        label={`${methodName(method)}: exact saved values`}
        headers={['Update', titles[metric], 'EOS', 'Malformed']}
        rows={method.checkpoints.map((row) => [
          row.step,
          fmt(scratchMetric(row, metric), 6),
          row.generation.outputs.filter((x) => x.stop === 'EOS').length,
          row.generation.outputs.filter((x) => x.malformed).length,
        ])}
      />
      <p>
        {metric === 'objective'
          ? 'These objectives differ: their numeric heights are not a shared quality ranking.'
          : 'One declared seed, full saved samples, no uncertainty estimate or universal ranking.'}{' '}
        <a href="/learn/examples/simpo/results/scratch-results.json">
          Read every saved response and pair score.
        </a>
      </p>
      <Controls
        reset={() => {
          setMetric('success');
          setIndex(0);
        }}
      >
        <Select
          label="Measured quantity"
          value={metric}
          onChange={setMetric}
          options={[
            ['success', 'Successes / 32'],
            ['gap', 'Mean-score gap'],
            ['objective', 'Training objective'],
            ['length', 'Generated length'],
            ['chosen', 'Chosen sum log p'],
            ['rejected', 'Rejected sum log p'],
          ]}
        />
        <Select
          label="Exact table for"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={saved.scratch.methods.map((arm, i) => [i, methodName(arm)])}
        />
      </Controls>
    </Figure>
  );
}

export function RecordAndSplit() {
  const [index, setIndex] = useState(0);
  const examples = [
    saved.selection.selected.train[0],
    ...saved.selection.selected.heldout.slice(0, 3),
  ].map((id) => saved.records.records.find((row) => row.row_id === id));
  const row = examples[index];
  const retained = saved.selection.retained[row.split].find((r) => r.row_id === row.row_id);
  return (
    <Figure id="D19" label="A released comparison retains its prompt family through splitting">
      <p>
        HH comparison row {row.row_id} · {row.split}. Family{' '}
        <code className="simpo-digest">{row.family_id}</code>
      </p>
      <blockquote className="simpo-record">{row.prompt}</blockquote>
      <div className="simpo-fork" aria-hidden="true">
        ↙　↘
      </div>
      <div className="simpo-branches">
        <Branch title="Supplied chosen suffix">
          <p className="simpo-record">{row.chosen}</p>
          <p>{retained.chosen_ids.length} response targets, including EOS</p>
        </Branch>
        <Branch index={1} title="Supplied rejected suffix">
          <p className="simpo-record">{row.rejected}</p>
          <p>{retained.rejected_ids.length} response targets, including EOS</p>
        </Branch>
      </div>
      <div className="simpo-split-graph">
        <span>Prompt family</span>
        <b>→</b>
        <span>
          {row.split === 'train' ? 'Train: vocabulary + updates' : 'Held-out: evaluation only'}
        </span>
        <b>↛</b>
        <span>{row.split === 'train' ? 'Held-out' : 'Vocabulary fitting'}</span>
      </div>
      <p>
        128 training pairs in 117 families; 64 held-out pairs in 56 families; zero shared families.
        Supplied preferences are labels, not factual guarantees.
      </p>
      <Controls reset={() => setIndex(0)}>
        <Select
          label="Actual record"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={examples.map((record, i) => [i, `Row ${record.row_id} · ${record.split}`])}
        />
      </Controls>
    </Figure>
  );
}

export function NativeBatch() {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState('chosen');
  const [target, setTarget] = useState(0);
  const parity = saved.native.parity;
  const flat = index + (side === 'chosen' ? 0 : 8);
  const ids = parity.native_batch[`${side}_input_ids`][index];
  const labels = parity.native_batch[`${side}_labels`][index];
  const attention = parity.native_batch[`${side}_attention_mask`][index];
  const positions = labels.flatMap((label, i) => (label === -100 ? [] : [i]));
  const ordinal = Math.min(target, positions.length - 1);
  const position = positions[ordinal];
  const logps = parity.selected_token_logps[flat];
  const select = (value, setter) => {
    setter(value);
    setTarget(0);
  };
  return (
    <Figure
      id="D20"
      label="Actual CPO native labels and mask align with independent response scoring"
    >
      <p>
        Saved native batch pair {index + 1}, {side}. One added BOS precedes the original prompt;
        response includes genuine EOS.
      </p>
      <Local
        label="Actual native token positions, attention and labels"
        selectionKey={`${index}-${side}-${position}`}
      >
        <div
          className="simpo-native-grid"
          style={{ gridTemplateColumns: `6rem repeat(${ids.length}, 3.3rem)` }}
        >
          {[
            ['Position', ids.map((_, i) => i)],
            ['Input ID', ids],
            ['Attention', attention],
            ['Label', labels.map((x) => (x === -100 ? '—' : x))],
          ].map(([name, values]) => (
            <React.Fragment key={name}>
              <strong className="simpo-row-head">{name}</strong>
              {values.map((value, i) => (
                <span key={i} className={i === position ? 'simpo-cell-target' : ''}>
                  {value}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </Local>
      <Arrow>
        logits at {position - 1} → target ID {ids[position]} at {position}
      </Arrow>
      <p>
        Selected response target {ordinal + 1}/{positions.length}. Gathered log p ={' '}
        {fmt(logps[position - 1], 6)}. Recorded sum {fmt(parity.sums[flat], 6)} ÷{' '}
        {parity.counts[flat]} = mean {fmt(parity.sums[flat] / parity.counts[flat], 6)}.
      </p>
      <p>
        Pair gap {fmt(parity.gaps[index], 6)} → loss {fmt(parity.losses[index], 6)}. Native batch
        loss {fmt(parity.native_loss, 8)}; independent loss {fmt(parity.manual_loss, 8)}; maximum
        gradient difference {parity.max_gradient_difference.toExponential(3)}.
      </p>
      <Controls
        reset={() => {
          setIndex(0);
          setSide('chosen');
          setTarget(0);
        }}
      >
        <Select
          label="Saved pair"
          value={index}
          onChange={(v) => select(Number(v), setIndex)}
          options={Array.from({ length: 8 }, (_, i) => [i, `Pair ${i + 1}`])}
        />
        <Select
          label="Response branch"
          value={side}
          onChange={(v) => select(v, setSide)}
          options={[
            ['chosen', 'Chosen'],
            ['rejected', 'Rejected'],
          ]}
        />
        <Select
          label="Response target"
          value={ordinal}
          onChange={(v) => setTarget(Number(v))}
          options={positions.map((p, i) => [i, `Target ${i + 1} · position ${p}`])}
        />
      </Controls>
    </Figure>
  );
}

export function ConfigurationMap() {
  const [beta, setBeta] = useState(2);
  const [ratio, setRatio] = useState(0.2);
  return (
    <Figure id="D21" label="Current CPOTrainer SimPO configuration maps to mathematical operations">
      <pre className="simpo-config">{`from trl.experimental.cpo import CPOConfig, CPOTrainer\n\nCPOConfig(\n    loss_type="simpo",\n    beta=${beta},\n    simpo_gamma=${Number((beta * ratio).toFixed(8))},\n    cpo_alpha=0.0,\n    alpha=0.0,\n    label_smoothing=0.0,\n)`}</pre>
      <div className="simpo-pipeline">
        <span>
          response sums/counts
          <br />
          loss_type = simpo
        </span>
        <b>→</b>
        <span>
          βd − absolute γ<br />
          {fmt(beta)}d − {fmt(beta * ratio)}
        </span>
        <b>→</b>
        <span>pair-mean logistic loss</span>
      </div>
      <Table
        label="Additional fields select additional mechanisms"
        headers={['Field', 'Plain SimPO', 'Effect when enabled']}
        rows={[
          ['cpo_alpha', '0', 'Chosen-token NLL weight'],
          ['alpha', '0', 'Alternate AlphaPO reward shaping'],
          ['label_smoothing', '0', 'Changes the link objective'],
        ]}
      />
      <p>
        An auxiliary-NLL variant explicitly changes cpo_alpha; it is a separate objective. The ratio
        δ is {fmt(ratio)}, while TRL receives γ = βδ = {fmt(beta * ratio)}.
      </p>
      <Controls
        reset={() => {
          setBeta(2);
          setRatio(0.2);
        }}
      >
        <NumberField label="Beta" value={beta} onChange={setBeta} min={0.25} max={4} step={0.25} />
        <NumberField
          label="Official gamma/beta ratio"
          value={ratio}
          onChange={setRatio}
          min={0}
          max={1}
        />
      </Controls>
    </Figure>
  );
}

export function MeasuredScoreAudit() {
  const [state, setState] = useState('after');
  const [stratum, setStratum] = useState('all');
  const [index, setIndex] = useState(0);
  const selected = saved.native[state];
  const rows = selected.predictions.filter(
    (row) =>
      stratum === 'all' ||
      (stratum === 'long'
        ? row.chosen_length > row.rejected_length
        : row.chosen_length <= row.rejected_length),
  );
  const row = rows[Math.min(index, rows.length - 1)];
  const changes = saved.native.absolute_changes.find((x) => x.row_id === row.row_id);
  const maxLength = Math.max(...selected.predictions.map((x) => x.chosen_length));
  const maximum = Math.max(0.5, ...selected.predictions.map((x) => Math.abs(x.mean_gap)));
  return (
    <Figure
      id="D22"
      label="Measured pair gaps and absolute likelihood changes answer different questions"
    >
      <p>
        Held-out {state === 'before' ? 'SFT initializer' : 'after SimPO'}; {rows.length} of 64 fixed
        labelled pairs displayed.
      </p>
      <div className="simpo-scatter">
        <p>
          Mean-score gap: −{fmt(maximum)} to +{fmt(maximum)}
        </p>
        <svg
          viewBox="0 0 400 220"
          role="img"
          aria-label="Actual chosen response length against measured mean gap"
        >
          <path className="simpo-axis" d="M20 15V200H385" />
          <path className="simpo-zero" d="M20 107.5H385" />
          {rows.map((r) => (
            <circle
              key={r.row_id}
              data-row={r.row_id}
              cx={20 + (365 * r.chosen_length) / maxLength}
              cy={107.5 - (92.5 * r.mean_gap) / maximum}
              r={r.row_id === row.row_id ? 6 : 3}
              fill={r.row_id === row.row_id ? colours[0] : colours[2]}
              stroke={r.row_id === row.row_id ? 'white' : 'none'}
            />
          ))}
        </svg>
        <div className="simpo-chart-ends">
          <span>0</span>
          <span>Chosen target count</span>
          <span>{maxLength}</span>
        </div>
      </div>
      <p>
        Whole 64-pair strict agreement {fmt(selected.metrics.agreement_strict)}, ties-half agreement{' '}
        {fmt(selected.metrics.agreement_ties_half)}, desired gap fraction{' '}
        {fmt(selected.metrics.desired_gap_fraction)}, mean loss {fmt(selected.metrics.surrogate)}.
      </p>
      <Table
        label={`Selected row ${row.row_id}; lengths chosen ${row.chosen_length}, rejected ${row.rejected_length}`}
        headers={['Quantity', 'Chosen', 'Rejected']}
        rows={[
          ['Current sum', fmt(row.chosen_sum), fmt(row.rejected_sum)],
          ['Current mean', fmt(row.chosen_mean), fmt(row.rejected_mean)],
          ['After − before sum', fmt(changes.chosen_sum_change), fmt(changes.rejected_sum_change)],
          [
            'After − before mean',
            fmt(changes.chosen_mean_change),
            fmt(changes.rejected_mean_change),
          ],
        ]}
      />
      <p>
        Selected gap {fmt(row.mean_gap)}. Fixed supplied-response length is not generated length.
        The change rows always compare final to initial weights.
      </p>
      <Controls
        reset={() => {
          setState('after');
          setStratum('all');
          setIndex(0);
        }}
      >
        <Select
          label="Checkpoint"
          value={state}
          onChange={setState}
          options={[
            ['before', 'Before SimPO'],
            ['after', 'After SimPO'],
          ]}
        />
        <Select
          label="Length stratum"
          value={stratum}
          onChange={(v) => {
            setStratum(v);
            setIndex(0);
          }}
          options={[
            ['all', 'All pairs'],
            ['long', 'Chosen longer'],
            ['short', 'Chosen no longer'],
          ]}
        />
        <Select
          label="Exact pair"
          value={Math.min(index, rows.length - 1)}
          onChange={(v) => setIndex(Number(v))}
          options={rows.map((r, i) => [i, `Row ${r.row_id}`])}
        />
      </Controls>
    </Figure>
  );
}

export function GeneratedOutputs() {
  const [state, setState] = useState('after');
  const [index, setIndex] = useState(0);
  const generations = saved.native[`${state}_generations`];
  const rowIds = [...new Set(generations.map((row) => row.row_id))];
  const outputs = generations.filter((row) => row.row_id === rowIds[index]);
  const record = saved.records.records.find((row) => row.row_id === rowIds[index]);
  return (
    <Figure id="D23" label="Actual generated outputs differ from teacher-forced preference scores">
      <blockquote className="simpo-record">{record.prompt}</blockquote>
      <div className="simpo-branches">
        <Branch title="Supplied chosen continuation">
          <p className="simpo-record">{record.chosen}</p>
        </Branch>
        <Branch index={1} title="Supplied rejected continuation">
          <p className="simpo-record">{record.rejected}</p>
        </Branch>
      </div>
      <Arrow>same prompt → sample from selected saved model</Arrow>
      {outputs.map((row) => (
        <div className="simpo-generation" key={row.sample}>
          <Identity index={2}>Generated sample {row.sample + 1}</Identity>
          <p className="simpo-record">{row.response || '(empty response)'}</p>
          <Tokens values={row.response_ids} index={2} />
          <p>
            {row.length} actions · stop: {row.stop} · malformed: {String(row.malformed)}
          </p>
        </div>
      ))}
      <p>
        All 16 declared before/after samples are retained. These short native-fixture generations
        are incoherent; no helpfulness score is assigned.
      </p>
      <Controls
        reset={() => {
          setState('after');
          setIndex(0);
        }}
      >
        <Select
          label="Saved weights"
          value={state}
          onChange={setState}
          options={[
            ['before', 'SFT initializer'],
            ['after', 'After SimPO'],
          ]}
        />
        <Select
          label="Held-out prompt"
          value={index}
          onChange={(v) => setIndex(Number(v))}
          options={rowIds.map((id, i) => [i, `Row ${id}`])}
        />
      </Controls>
    </Figure>
  );
}

export function CostRoles() {
  const [reference, setReference] = useState('none');
  const [bytes, setBytes] = useState(4);
  const [pairs, setPairs] = useState(192);
  const cost = model.cost(saved.native.parameters, bytes, pairs, reference);
  return (
    <Figure id="D24" label="Parameter and score storage follow concrete computational roles">
      <div className="simpo-branches">
        <Branch title="Every training batch">
          <Matrix label="Policy weights" />
          <Arrow>forward → loss → backward → optimizer</Arrow>
          <p>Persistent optimizer state remains.</p>
        </Branch>
        <Branch
          index={2}
          title={
            reference === 'none'
              ? 'SimPO'
              : reference === 'online'
                ? 'Online-reference DPO'
                : 'Cached-reference DPO'
          }
        >
          {reference === 'online' ? (
            <>
              <Matrix label="Fixed reference weights" frozen />
              <Arrow>reference forward → two scores</Arrow>
            </>
          ) : reference === 'cached' ? (
            <>
              <div className="simpo-cache">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i}>A / B</i>
                ))}
              </div>
              <Arrow>lookup → two precomputed scores</Arrow>
            </>
          ) : (
            <p>No reference scores or reference forward in this loss.</p>
          )}
        </Branch>
      </div>
      <Table
        label={`Arithmetic for ${saved.native.parameters.toLocaleString()} parameters; decimal bytes`}
        headers={['Stored object', 'Bytes']}
        rows={[
          ['Policy weights', cost.policyWeights.toLocaleString()],
          ['Reference weights', cost.referenceWeights.toLocaleString()],
          ['Two float32 scores per pair', cost.referenceScores.toLocaleString()],
        ]}
      />
      <p>
        Excludes activations, optimizer moments, gradients, sharding and latency. Cached DPO pays
        the reference forward when the cache is made.
      </p>
      <Controls
        reset={() => {
          setReference('none');
          setBytes(4);
          setPairs(192);
        }}
      >
        <Select
          label="Implementation"
          value={reference}
          onChange={setReference}
          options={[
            ['none', 'SimPO'],
            ['online', 'DPO: online reference'],
            ['cached', 'DPO: cached reference'],
          ]}
        />
        <Select
          label="Bytes per weight"
          value={bytes}
          onChange={(v) => setBytes(Number(v))}
          options={[
            [2, '2 bytes'],
            [4, '4 bytes'],
          ]}
        />
        <NumberField
          label="Cached pair count"
          value={pairs}
          onChange={setPairs}
          min={1}
          max={1000000}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function ContradictoryLabels() {
  const [q, setQ] = useState(0.75);
  const [gamma, setGamma] = useState(0.5);
  const grid = Array.from({ length: 81 }, (_, i) => -2 + i / 20);
  const optimum = model.repeatedOptimum(q, 2, gamma);
  const smooth = q === 0 ? -Infinity : q === 1 ? Infinity : (gamma + Math.log(q / (1 - q))) / 2;
  return (
    <Figure id="D25" label="Repeated opposite labels differ from smoothing one shifted orientation">
      <div className="simpo-branches">
        <Branch title={`A preferred: fraction q = ${fmt(q)}`}>
          <p>softplus(γ − 2d)</p>
        </Branch>
        <Branch index={1} title={`B preferred: fraction 1 − q = ${fmt(1 - q)}`}>
          <p>softplus(γ + 2d)</p>
        </Branch>
      </div>
      <Arrow>frequency-weighted sum</Arrow>
      <Chart
        xMin={-2}
        xMax={2}
        yMax={6.2}
        xLabel="Mean-score gap d"
        yLabel="Weighted loss"
        lines={[
          {
            name: 'Repeated opposite labels',
            values: grid.map((d) => [d, model.repeated(d, q, 2, gamma).loss]),
          },
          {
            name: 'One-orientation smoothing',
            dashed: true,
            values: grid.map((d) => [d, model.repeated(d, q, 2, gamma).smoothedLoss]),
          },
        ]}
      />
      <p>
        Opposite-label optimum d = {fmt(optimum, 6)}; smoothing optimum d = {fmt(smooth, 6)}.{' '}
        {q === 0 || q === 1
          ? 'The infimum requires an infinite signed gap; neither has a finite minimizer.'
          : gamma === 0
            ? 'At zero margin the objectives coincide.'
            : 'Subtracting the same positive margin in both label orientations changes the optimum.'}
      </p>
      <Controls
        reset={() => {
          setQ(0.75);
          setGamma(0.5);
        }}
      >
        <NumberField
          label="A-preferred fraction q"
          value={q}
          onChange={setQ}
          min={0}
          max={1}
          step={0.05}
        />
        <NumberField label="Gamma" value={gamma} onChange={setGamma} min={0} max={2} />
      </Controls>
    </Figure>
  );
}

export function ObjectiveCoordinates() {
  const [name, setName] = useState('simpo');
  const rows = {
    simpo: ['Mean policy scores', 'softplus(γ − βd)', 'No reference; mean each response'],
    dpo: ['Sum policy minus sum reference', 'softplus(−βd)', 'Fixed reference scores required'],
    ipo: [
      'Reference-relative log-ratio gap',
      '(d − 1/(2β))²',
      'Squared objective in the stated coordinates',
    ],
    cpo: [
      'Preference term plus chosen NLL',
      'Pair loss + λ × chosen-token NLL',
      'Auxiliary likelihood trains chosen tokens',
    ],
  };
  return (
    <Figure id="D26" label="Changing coordinates and changing the loss are distinct operations">
      <div className="simpo-branches">
        <Branch title="A token log probabilities">
          <Tokens values={['log pA1', 'log pA2', '…']} />
        </Branch>
        <Branch index={1} title="B token log probabilities">
          <Tokens values={['log pB1', 'log pB2', '…']} index={1} />
        </Branch>
      </div>
      <Arrow />
      <div className="simpo-pipeline">
        <span>{rows[name][0]}</span>
        <b>→</b>
        <span>{rows[name][1]}</span>
      </div>
      <p>
        {rows[name][2]}. Coordinates and loss must both be specified; these rows do not compare
        measured performance.
      </p>
      <Controls reset={() => setName('simpo')}>
        <Select
          label="Objective view"
          value={name}
          onChange={setName}
          options={[
            ['simpo', 'Plain SimPO'],
            ['dpo', 'Standard DPO'],
            ['ipo', 'IPO (reference ratios)'],
            ['cpo', 'CPO with chosen NLL'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function OfflineAndRefresh() {
  return (
    <Figure
      id="D27"
      label="Offline updates reuse labels; refreshing data requires new generated and judged records"
    >
      <div className="simpo-branches">
        <Branch title="Fixed offline comparisons">
          <div className="simpo-record-stack">
            <span>prompt x</span>
            <span>chosen y+</span>
            <span>rejected y−</span>
            <span>family / split</span>
          </div>
          <Arrow>read the same labels</Arrow>
          <Matrix label="Current policy" />
          <Arrow>score → pair loss → update → score again</Arrow>
          <p>The supplied responses remain fixed as the weights change.</p>
        </Branch>
        <Branch index={2} title="Separate data refresh">
          <Matrix label="Current policy" />
          <Arrow>generate fresh responses</Arrow>
          <Tokens values={['new y1', 'new y2']} index={2} />
          <Arrow>judge under declared criterion</Arrow>
          <div className="simpo-record-stack">
            <span>new label: not yet known</span>
            <span>preserve prompt family boundary</span>
          </div>
          <Arrow>new record → next training dataset</Arrow>
          <p>New labels require a judge; they are not implied by the mean denominator.</p>
        </Branch>
      </div>
      <p>Online group credit is a further algorithmic choice explored in GRPO/RLOO.</p>
    </Figure>
  );
}

export function RankVersusSample() {
  const [seed, setSeed] = useState(7);
  const [mode, setMode] = useState('exact');
  return (
    <Figure id="D13" label="Mean-score ranking differs from ancestral sample frequency">
      <TreeDrawing rank="mean" counts={mode === 'samples' ? model.sampleTree(seed) : null} />
      <p>
        Mean-score winner B1 has mass 0.27; A has mass 0.4.{' '}
        {mode === 'samples'
          ? 'The 40 draws are a seeded finite simulation from exact leaf masses.'
          : 'Sampling follows transition probabilities, without renormalizing the geometric means.'}
      </p>
      <Controls
        reset={() => {
          setSeed(7);
          setMode('exact');
        }}
      >
        <Select
          label="Display"
          value={mode}
          onChange={setMode}
          options={[
            ['exact', 'Exact probabilities'],
            ['samples', '40 simulated draws'],
          ]}
        />
        <NumberField
          label="Simulation seed"
          value={seed}
          onChange={setSeed}
          min={0}
          max={9999}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function OrientedLinks() {
  const [gap, setGap] = useState(0.3);
  const [gamma, setGamma] = useState(0.4);
  const forward = model.sigmoid(2 * gap - gamma);
  const reverse = model.sigmoid(-2 * gap - gamma);
  return (
    <Figure id="D14" label="Opposite margin links need not complement each other">
      <div className="simpo-branches">
        <Branch title="A preferred orientation">
          <p>2d − γ = {fmt(2 * gap - gamma)}</p>
          <Arrow />
          <p>sigmoid = {fmt(forward)}</p>
        </Branch>
        <Branch index={1} title="B preferred orientation">
          <p>−2d − γ = {fmt(-2 * gap - gamma)}</p>
          <Arrow />
          <p>sigmoid = {fmt(reverse)}</p>
        </Branch>
      </div>
      <Bars labels={['A-oriented link', 'B-oriented link']} values={[forward, reverse]} />
      <p>
        Sum = {fmt(forward + reverse)}.{' '}
        {gamma === 0
          ? 'At zero margin these links complement each other.'
          : 'The positive margin is subtracted in both orientations.'}{' '}
        These are training links, not two measured human-choice probabilities.
      </p>
      <Controls
        reset={() => {
          setGap(0.3);
          setGamma(0.4);
        }}
      >
        <NumberField label="Gap d" value={gap} onChange={setGap} min={-1} max={1} />
        <NumberField label="Gamma" value={gamma} onChange={setGamma} min={0} max={2} />
      </Controls>
    </Figure>
  );
}

export function SharedMassDrift() {
  const [step, setStep] = useState('after');
  const result = model.drift(step === 'after' ? 0.1 : 0);
  return (
    <Figure
      id="D15"
      label="A shared parameter can improve the pair gap while both compared masses fall"
    >
      <p>Logits [θ, −θ, 10θ] for complete one-target outcomes A, B, C.</p>
      <div className="simpo-branches">
        <div>
          <p>Before: θ = 0</p>
          <Bars labels={['A', 'B', 'C']} values={result.before} />
        </div>
        <div>
          <p>
            {step === 'after' ? 'After one step' : 'Unchanged'}: θ = {fmt(result.theta, 6)}
          </p>
          <Bars labels={['A', 'B', 'C']} values={result.after} />
        </div>
      </div>
      <p>
        Derivative at zero {fmt(result.derivative, 6)}; step size {step === 'after' ? '0.1' : '0'}.
        Gap = {fmt(result.gap, 6)}; exact KL(after || before) = {fmt(result.kl, 6)}. C participates
        in normalization although the pair only names A and B.
      </p>
      <Controls reset={() => setStep('after')}>
        <Select
          label="Parameter state"
          value={step}
          onChange={setStep}
          options={[
            ['before', 'Initial state'],
            ['after', 'One gradient step'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function AuxiliaryTerm() {
  const [weight, setWeight] = useState('0.1');
  const row = saved.geometry.plane.find((x) => x.weight === Number(weight));
  const arrows = [
    { name: 'Preference gradient', value: row.preference_gradient },
    { name: 'Weighted chosen NLL', value: row.chosen_nll_gradient.map((x) => x * Number(weight)) },
    { name: 'Total gradient', value: row.total_gradient },
  ];
  return (
    <Figure id="D16" label="An auxiliary chosen-token loss adds a distinct parameter gradient">
      <p>
        Local logits [θ + φ, −θ + φ, 10θ − 2φ] at (0, 0). Axes show gradient coordinates, not
        probabilities.
      </p>
      <div className="simpo-plane">
        <svg
          viewBox="0 0 400 280"
          role="img"
          aria-label="Preference, weighted NLL and total gradient vectors"
        >
          <path className="simpo-axis" d="M20 110H380M160 20V260" />
          {arrows.map((arrow, i) => (
            <g key={arrow.name}>
              <path
                d={`M160 110L${160 + arrow.value[0] * 70} ${110 - arrow.value[1] * 100}`}
                stroke={colours[i]}
                strokeWidth="3"
              />
              <circle
                cx={160 + arrow.value[0] * 70}
                cy={110 - arrow.value[1] * 100}
                r="5"
                fill={colours[i]}
              />
            </g>
          ))}
        </svg>
        <p>θ coordinate → · φ coordinate ↑; origin at axes intersection.</p>
      </div>
      <Table
        label="Exact gradient vectors"
        headers={['Contribution', '∂/∂θ', '∂/∂φ']}
        rows={arrows.map((arrow, i) => [
          <Identity index={i}>{arrow.name}</Identity>,
          ...arrow.value.map((x) => fmt(x, 6)),
        ])}
      />
      <p>
        Step −0.1 ∇ = {vector(row.step)}. Pair loss is pair-mean; auxiliary NLL pools chosen target
        tokens. For lengths 2 and 6, each chosen token has denominator 8.
      </p>
      <Controls reset={() => setWeight('0.1')}>
        <Select
          label="Chosen NLL weight λ"
          value={weight}
          onChange={setWeight}
          options={[
            ['0', '0 — plain preference'],
            ['0.1', '0.1'],
            ['1', '1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
