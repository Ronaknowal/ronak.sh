import { useEffect, useId, useRef, useState } from 'react';
import { FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import {
  COLORS,
  DOCUMENTS,
  SUPPORT,
  reference,
  surprise,
  repetition,
  sigmoid,
  gradientStep,
  select,
  metrics,
  calibration,
  connectedGroups,
  neuralPolicy,
  rankPercentiles,
  pipelineAudit,
  costLedger,
} from '../../data/curation-pipeline-models.js';
import observed from '../../data/curation-pipeline-recorded-study.json';
import './curation-pipeline-flow.css';

const n = (value, digits = 4) => flowNumber(value, digits);
const percent = (value) => (value === null ? 'undefined' : `${n(100 * value, 2)}%`);
const hue = (id) => COLORS[Math.max(0, DOCUMENTS.indexOf(id)) % COLORS.length];
function Figure({ id, label, children, note }) {
  return (
    <figure className="curation-figure" data-curation-figure={id} aria-label={label}>
      {children}
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
function Reset({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Reset example
    </button>
  );
}
function Doc({ id, children, rejected = false }) {
  return (
    <span
      className={`curation-doc ${rejected ? 'is-rejected' : ''}`}
      style={{ '--identity': hue(id) }}
    >
      <strong>{id}</strong>
      {children && <span>{children}</span>}
      {rejected && <span>× removed</span>}
    </span>
  );
}
function Scroll({ label, className = 'curation-scroll', children }) {
  const ref = useRef(null);
  const cue = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div className="curation-scroll-shell">
    <div ref={ref} className={className} role="region" tabIndex={0}
      aria-label={label} aria-describedby={overflow ? cue : undefined}>{children}</div>
    {overflow && <p id={cue} className="curation-scroll-cue">↔ More columns: scroll sideways, or focus the drawing and use arrow keys.</p>}
  </div>;
}
function Table({ title, headers, rows }) {
  return (
    <div className="curation-table-object">
      <p className="curation-table-caption">{title}</p>
      <Scroll label={title}>
      <table aria-label={title}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {v}
                  </th>
                ) : (
                  <td key={j}>
                    {typeof v === 'string' && /^[a-f0-9]{40,}$/.test(v) ? (
                      <span className="curation-digest">{v}</span>
                    ) : (
                      v
                    )}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </Scroll>
    </div>
  );
}
function Vector({ label, values, role = 'feature' }) {
  return (
    <div className={`curation-vector role-${role}`}>
      <span>{label}</span>
      <div>
        {values.map((v, i) => (
          <span key={i}>{typeof v === 'number' ? n(v) : v}</span>
        ))}
      </div>
    </div>
  );
}
function Arrow({ children }) {
  return (
    <div className="curation-arrow">
      ↓ <span>{children}</span>
    </div>
  );
}
function Bars({ rows, maximum = 1, label }) {
  return (
    <div className="curation-bars" role="img" aria-label={label}>
      {rows.map(([name, value, color], i) => (
        <div className="curation-bar-row" key={name}>
          <span>{name}</span>
          <div className="curation-bar-track">
            {value !== null && (
              <span
                style={{
                  width: `${Math.max(0, Math.min(100, (100 * value) / maximum))}%`,
                  background: color || COLORS[i % 4],
                }}
              />
            )}
          </div>
          <output>{value === null ? 'undefined' : n(value)}</output>
        </div>
      ))}
    </div>
  );
}
function Confusion({ result, showIds = true }) {
  return (
    <div className="curation-confusion" role="group" aria-label="Truth by retention decision">
      {['tp', 'fn', 'fp', 'tn'].map((key) => (
        <div key={key} className={`cell-${key}`}>
          <span>
            {
              {
                tp: 'Label 1 · keep',
                fn: 'Label 1 · remove',
                fp: 'Label 0 · keep',
                tn: 'Label 0 · remove',
              }[key]
            }
          </span>
          <strong>{result[key]}</strong>
          {showIds && <span>{result.cells[key].join(', ') || 'none'}</span>}
        </div>
      ))}
    </div>
  );
}

function Extraction() {
  const [mode, setMode] = useState('article');
  const lines =
    mode === 'article'
      ? [
          'Pendulum motion',
          'A pendulum exchanges potential and kinetic energy.',
          'The period increases with its length.',
        ]
      : mode === 'navigation'
        ? ['Home', 'Subscribe', 'Contact']
        : [];
  return (
    <Figure
      id="C01"
      label="Source DOM and retained article spans"
      note="Constructed source. A keeps its identity; changing extraction creates a different derived text."
    >
      <div className="curation-extraction">
        <div className="curation-tree">
          <code>html · A</code>
          <ul>
            <li className={mode === 'navigation' ? 'is-active' : ''}>
              <code>nav</code>
              <p>Home · Subscribe · Contact</p>
            </li>
            <li className={mode === 'article' ? 'is-active' : ''}>
              <code>article</code>
              <ul>
                <li>
                  <code>h1</code> Pendulum motion
                </li>
                <li>
                  <code>p</code> A pendulum exchanges potential and kinetic energy.
                </li>
                <li>
                  <code>p</code> The period increases with its length.
                </li>
              </ul>
            </li>
            <li className="is-omitted">
              <code>script</code> analytics()
            </li>
            <li className="is-omitted">
              <code>footer</code> Terms
            </li>
          </ul>
        </div>
        <div>
          <Arrow>selected text nodes → line array</Arrow>
          <ol className="curation-extracted">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {!lines.length && <p role="status">No extracted text: quarantine, no score.</p>}
          <Doc id="A">{lines.length} derived lines</Doc>
        </div>
      </div>
      <FlowControls>
        <FlowChoice
          label="Read source spans"
          options={[
            ['article', 'Article'],
            ['navigation', 'Wrong: navigation'],
            ['empty', 'Empty selection'],
          ]}
          value={mode}
          onChange={setMode}
        />
      </FlowControls>
      <p className="curation-provenance">
        Source: authored article.html → immutable raw bytes; derived text → extractor choice + its
        own digest. URL alone cannot identify the extraction.
      </p>
    </Figure>
  );
}
function Retention() {
  const [ids, setIds] = useState(['A', 'B']);
  const bytes = [20, 60, 10, 10];
  return (
    <Figure id="C02" label="Record retention versus byte retention">
      <p>Equal record marks · denominator 4</p>
      <div className="curation-record-marks">
        {DOCUMENTS.map((id) => (
          <Doc key={id} id={id} rejected={!ids.includes(id)} />
        ))}
      </div>
      <p>Byte widths · denominator 100</p>
      <div className="curation-mass" role="img" aria-label="A20 B60 C10 D10 bytes">
        {DOCUMENTS.map((id, i) => (
          <span
            key={id}
            style={{
              flexGrow: bytes[i],
              background: hue(id),
              opacity: ids.includes(id) ? 0.9 : 0.15,
            }}
          />
        ))}
      </div>
      <p>{DOCUMENTS.map((id, i) => `${id}: ${bytes[i]} bytes`).join(' · ')}</p>
      <FlowControls>
        {DOCUMENTS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={ids.includes(id)}
            onClick={() => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])}
          >
            Keep {id}
          </button>
        ))}
        <Reset onClick={() => setIds(['A', 'B'])} />
      </FlowControls>
      <FlowReadout>
        {ids.length}/4 records = {percent(ids.length / 4)};{' '}
        {bytes.reduce((sum, b, i) => sum + (ids.includes(DOCUMENTS[i]) ? b : 0), 0)}/100 bytes
        retained. Token retention still requires the model tokenizer.
      </FlowReadout>
    </Figure>
  );
}
function Repetition() {
  const [text, setText] = useState('aaaa\nb\naaaa');
  const [threshold, setThreshold] = useState(0.5);
  const result = repetition(text);
  return (
    <Figure id="C03" label="Duplicate line and character measurements">
      <div className="curation-lines">
        {result.rows.map((row, i) => (
          <div key={i} className={row.duplicate ? 'is-duplicate' : ''}>
            <span>
              Line {i + 1} {row.duplicate ? 'additional occurrence ×' : 'first occurrence'}
            </span>
            <div className="curation-character-lane">
              {Array.from(row.line).map((c, j) => (
                <span key={j}>{c === ' ' ? '␠' : c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="curation-fractions">
        <p>
          <strong>
            {result.duplicateLines} / {result.rows.length}
          </strong>{' '}
          additional lines / all lines
        </p>
        <p>
          <strong>
            {result.duplicateCharacters} / {result.characters}
          </strong>{' '}
          repeated characters / all characters
        </p>
      </div>
      <FlowControls>
        <label className="curation-field">
          Text lines
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        </label>
        <FlowSlider
          name="Maximum repeated-character share"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={setThreshold}
        />
        <Reset
          onClick={() => {
            setText('aaaa\nb\naaaa');
            setThreshold(0.5);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Line incidence {percent(result.lineShare)}; character share {percent(result.characterShare)}
        .{' '}
        {result.characterShare === null
          ? 'Empty extraction: quarantine.'
          : result.characterShare <= threshold
            ? 'Kept under this rule.'
            : 'Removed under this rule.'}
      </FlowReadout>
    </Figure>
  );
}
function Reference({ candidate = false }) {
  const [kind, setKind] = useState('general');
  const [alpha, setAlpha] = useState(1);
  const [text, setText] = useState('pendulum energy');
  const distribution = reference(kind, alpha);
  const result = surprise(text, distribution);
  return (
    <Figure
      id={candidate ? 'C05' : 'C04'}
      label={
        candidate
          ? 'Wordwise surprise contributions'
          : 'Normalized reference with one unknown bucket'
      }
    >
      {candidate ? (
        <>
          <div className="curation-word-contributions">
            {result.rows.map((row, i) => (
              <div key={i}>
                <code>{row.word}</code>
                <span>→ {row.bucket}</span>
                <span>p = {n(row.probability)}</span>
                <span
                  className="curation-loss-column"
                  style={{ height: `${Math.max(0.1, row.loss) * 1.7}rem` }}
                />
                <strong>−ln p = {n(row.loss)}</strong>
              </div>
            ))}
          </div>
          <p>
            Sum {n(result.total)} ÷ {result.rows.length} words → H {n(result.mean)} → exp(H){' '}
            {n(result.perplexity)}
          </p>
        </>
      ) : (
        <>
          <Table
            title="Count mass and smoothing on shared support"
            headers={['Outcome', 'Observed count', '+ α', 'Probability']}
            rows={SUPPORT.map((word, i) => [
              word,
              distribution.counts[i],
              alpha,
              `${n(distribution.counts[i] + alpha)} / ${n(distribution.denominator)} = ${n(distribution.probabilities[i])}`,
            ])}
          />
          <Bars
            rows={SUPPORT.map((word, i) => [word, distribution.probabilities[i]])}
            label="Reference probability mass"
          />
        </>
      )}
      <FlowControls>
        <FlowChoice
          label="Reference"
          options={[
            ['general', 'General'],
            ['target', 'Pendulum domain'],
            ['empty', 'No observations'],
          ]}
          value={kind}
          onChange={setKind}
        />
        {candidate ? (
          <label className="curation-field">
            Candidate words
            <input value={text} onChange={(e) => setText(e.target.value)} />
          </label>
        ) : (
          <FlowSlider
            name="Smoothing α"
            min={0.25}
            max={2}
            step={0.25}
            value={alpha}
            onChange={setAlpha}
          />
        )}
        <Reset
          onClick={() => {
            setKind('general');
            setAlpha(1);
            setText('pendulum energy');
          }}
        />
      </FlowControls>
      <FlowReadout>
        {candidate
          ? result.rows.length
            ? `Each unknown spelling reads the same UNK probability; mean surprise ${n(result.mean)} nats per whitespace word.`
            : 'No words: mean loss and perplexity are undefined.'
          : `The ${SUPPORT.length} probabilities sum to ${n(distribution.probabilities.reduce((a, b) => a + b, 0))}. UNK is one outcome.`}
      </FlowReadout>
    </Figure>
  );
}
function LabelSources() {
  return (
    <Figure id="C06" label="Teacher rubric and reference-membership labels">
      <div className="curation-pair">
        <div>
          <div className="curation-page-lines">
            <span>record prefix · first 1,000 characters</span>
            <i />
            <i />
            <i />
          </div>
          <Arrow>text + educational rubric → teacher</Arrow>
          <Vector
            label="Released annotation fields"
            values={['score: 3', 'target: score ≥ 3']}
            role="weight"
          />
          <p>A proxy judgment about educational value; no absent rationale is invented.</p>
        </div>
        <div>
          <div className="curation-membership">
            <div>
              chosen reference set <Doc id="A" />
              <Doc id="D" />
            </div>
            <div>
              background set <Doc id="B" />
              <Doc id="C" />
            </div>
          </div>
          <Arrow>source membership → target</Arrow>
          <Vector label="Membership labels" values={['A,D: 1', 'B,C: 0']} role="weight" />
          <p>Predicting a source's identity is different from learning the teacher rubric.</p>
        </div>
      </div>
    </Figure>
  );
}
function Features() {
  const [w0, setW0] = useState(0.4);
  const [w1, setW1] = useState(-0.2);
  const idf = 1 + Math.log(5 / 3),
    norm = 5 * idf;
  const z = 0.6 * w0 + 0.8 * w1 + 0.1;
  return (
    <Figure id="C07" label="Counts through IDF and normalized weighted features">
      <div className="curation-feature-path">
        <Vector label="energy · motion counts" values={[3, 4]} />
        <Arrow>both df = 2 of 4 training documents</Arrow>
        <Vector label="smoothed IDF" values={[idf, idf]} />
        <Arrow>multiply counts, then divide by length {n(norm)}</Arrow>
        <Vector label="L2 feature x" values={[0.6, 0.8]} />
        <Vector label="supplied weights w" values={[w0, w1]} role="weight" />
        <Arrow>coordinate products, then sum + intercept .1</Arrow>
        <Vector label="x × w contributions" values={[0.6 * w0, 0.8 * w1]} role="contribution" />
      </div>
      <p>
        z = {n(0.6 * w0)} + {n(0.8 * w1)} + .1 = {n(z)} → sigmoid = <strong>{n(sigmoid(z))}</strong>
      </p>
      <FlowControls>
        <FlowSlider name="Energy weight" value={w0} onChange={setW0} min={-2} max={2} step={0.1} />
        <FlowSlider name="Motion weight" value={w1} onChange={setW1} min={-2} max={2} step={0.1} />
        <Reset
          onClick={() => {
            setW0(0.4);
            setW1(-0.2);
          }}
        />
      </FlowControls>
      <FlowReadout>
        These edited weights are a constructed cutaway. Training-only vocabulary and IDF stay
        frozen; unseen words create no new feature coordinate.
      </FlowReadout>
    </Figure>
  );
}
function Update() {
  const [rate, setRate] = useState(0.1),
    [label, setLabel] = useState(1);
  const r = gradientStep({ rate, label });
  return (
    <Figure id="C08" label="Binary cross entropy and complete gradient step">
      <div className="curation-computation">
        <Vector label="x" values={[0.6, 0.8]} />
        <Arrow>dot w + b</Arrow>
        <Vector label="z → p → p−y" values={[r.z, r.p, r.residual]} role="contribution" />
        <div className="curation-pair">
          <Vector label="data gradient (p−y)x" values={r.dataGradient} />
          <Vector label="penalty gradient λw" values={r.penaltyGradient} role="weight" />
        </div>
        <Arrow>add derivatives; subtract η × gradient</Arrow>
        <Vector label="new w" values={r.next} role="weight" />
        <Vector
          label="new b; new probability"
          values={[r.nextBias, r.nextProbability]}
          role="contribution"
        />
      </div>
      <FlowControls>
        <FlowSlider
          name="Learning rate η"
          min={0}
          max={1}
          step={0.05}
          value={rate}
          onChange={setRate}
        />
        <FlowChoice
          label="Observed label y"
          options={[
            [0, '0'],
            [1, '1'],
          ]}
          value={label}
          onChange={setLabel}
        />
        <Reset
          onClick={() => {
            setRate(0.1);
            setLabel(1);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Before update: BCE {n(r.dataLoss)}, penalized loss {n(r.loss)}.{' '}
        {rate === 0
          ? 'Zero learning rate leaves all weights and the probability unchanged.'
          : `The intercept derivative is ${n(r.residual)} with no penalty.`}
      </FlowReadout>
    </Figure>
  );
}
function Splits() {
  const [bridge, setBridge] = useState(false),
    [wrong, setWrong] = useState(false);
  const ids = ['A1', 'A2', 'B1', 'C1', 'C2'];
  const edges = [['A1', 'A2'], ['C1', 'C2'], ...(bridge ? [['A2', 'B1']] : [])];
  const groups = connectedGroups(ids, edges);
  const partitions = wrong
    ? [['A1', 'B1'], ['A2', 'C1'], ['C2']]
    : [groups[0], groups[1] || [], groups[2] || []];
  return (
    <Figure id="C09" label="Connected source groups precede partition assignment">
      <div className="curation-group-graph">
        {groups.map((group, i) => (
          <div key={i} style={{ '--identity': COLORS[i] }}>
            <span>component {i + 1}</span>
            <strong>{group.join(' ↔ ')}</strong>
          </div>
        ))}
      </div>
      <Arrow>{wrong ? 'Wrong: independent row assignment' : 'Move each whole component'}</Arrow>
      <div className="curation-partitions">
        {[
          'Train · fit features/weights',
          'Tune · select threshold',
          'Final · assess frozen rule',
        ].map((name, i) => (
          <div key={name}>
            <strong>{name}</strong>
            <p>{partitions[i].join(', ') || 'empty in this constructed fixture'}</p>
          </div>
        ))}
      </div>
      <FlowControls>
        <FlowChoice
          label="Known A2—B1 duplicate edge"
          options={[
            [false, 'Absent'],
            [true, 'Present'],
          ]}
          value={bridge}
          onChange={setBridge}
        />
        <FlowChoice
          label="Partition unit"
          options={[
            [false, 'Whole component'],
            [true, 'Wrong: row'],
          ]}
          value={wrong}
          onChange={setWrong}
        />
        <Reset
          onClick={() => {
            setBridge(false);
            setWrong(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {wrong
          ? 'Known related records cross partitions: A1/A2 and C1/C2 leak.'
          : 'No declared edge crosses partitions. This does not establish that every semantic relation was detected.'}
      </FlowReadout>
    </Figure>
  );
}
const scoredRows = [
  { id: 'A', score: 0.95, label: 1 },
  { id: 'B', score: 0.8, label: 1 },
  { id: 'C', score: 0.75, label: 0 },
  { id: 'D', score: 0.7, label: 1 },
];
function Selection() {
  const [mode, setMode] = useState('threshold'),
    [threshold, setThreshold] = useState(0.7),
    [count, setCount] = useState(2),
    [ties, setTies] = useState(false);
  const rows = scoredRows.map((r) => ({
    ...r,
    score: ties && ['A', 'B'].includes(r.id) ? 0.8 : r.score,
  }));
  const kept = select(rows, mode, mode === 'count' ? count : threshold),
    r = metrics(rows, kept);
  return (
    <Figure id="C10" label="Ranked scores, keep rule and actual confusion cells">
      <div className="curation-score-ruler">
        {select(rows, 'count', 4).map((row) => (
          <div key={row.id}>
            <Doc id={row.id} rejected={!kept.some((r) => r.id === row.id)} />
            <span className="curation-score-track">
              <i style={{ left: `${row.score * 100}%`, background: hue(row.id) }} />
              <b
                style={{
                  left: `${threshold * 100}%`,
                  visibility: mode === 'threshold' ? 'visible' : 'hidden',
                }}
              />
            </span>
            <span>
              {n(row.score)} · label {row.label}
            </span>
          </div>
        ))}
      </div>
      <p>Score axis: 0 → 1; line marks the current threshold.</p>
      <Confusion result={r} />
      <FlowControls>
        <FlowChoice
          label="Selection rule"
          options={[
            ['threshold', 'Threshold'],
            ['count', 'Exact count'],
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'threshold' ? (
          <FlowSlider
            name="Keep scores at least"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={setThreshold}
          />
        ) : (
          <FlowSlider name="Keep k" min={0} max={4} step={1} value={count} onChange={setCount} />
        )}
        <FlowChoice
          label="A and B score tie"
          options={[
            [false, 'Original'],
            [true, 'Tie at .8'],
          ]}
          value={ties}
          onChange={setTies}
        />
        <Reset
          onClick={() => {
            setMode('threshold');
            setThreshold(0.7);
            setCount(2);
            setTies(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Precision {n(r.precision)}, recall {n(r.recall)}, F1 {n(r.f1)}. Exact counts split ties by
        ID; thresholding includes every tied score at the boundary.
      </FlowReadout>
    </Figure>
  );
}
function Calibration() {
  const [square, setSquare] = useState(false);
  const rows = [
    { id: 'A', score: square ? 0.64 : 0.8, label: 1 },
    { id: 'B', score: square ? 0.16 : 0.4, label: 0 },
  ];
  const bins = calibration(rows),
    r = metrics(rows, []);
  return (
    <Figure id="C11" label="Calibration bins and per-record Brier errors">
      <div className="curation-calibration">
        {bins.map((bin, i) => (
          <div key={i}>
            <span>
              {n(bin.low, 1)}–{n(bin.high, 1)}
            </span>
            <div className="curation-bin-bars">
              <i style={{ height: `${(bin.score || 0) * 100}%` }} />
              <b style={{ height: `${(bin.frequency || 0) * 100}%` }} />
            </div>
            <span>n = {bin.count}</span>
            <span>score {n(bin.score)}</span>
            <span>observed {n(bin.frequency)}</span>
          </div>
        ))}
      </div>
      <p>
        Bar height: fraction 0–1. Blue = mean score; amber = observed positive fraction. Empty bins
        remain undefined.
      </p>
      <Table
        title="Individual squared errors"
        headers={['ID', 'Probability', 'Label', '(p−y)²']}
        rows={rows.map((r) => [r.id, r.score, r.label, n((r.score - r.label) ** 2)])}
      />
      <FlowControls>
        <FlowChoice
          label="Monotone probability transform"
          options={[
            [false, 'Original'],
            [true, 'Square scores'],
          ]}
          value={square}
          onChange={setSquare}
        />
      </FlowControls>
      <FlowReadout>
        A ranks above B in both states. Brier mean = {n(r.brier)}; bin membership is recomputed
        after the transformation.
      </FlowReadout>
    </Figure>
  );
}
function StudyAnatomy() {
  return (
    <Figure id="C12" label="Measured annotation collection, protected splits and fitted curator">
      <div
        className="curation-collection-windows"
        aria-label="Twenty equally spaced collection windows"
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i}>
            <i />
            100 rows
          </span>
        ))}
      </div>
      <p>20 fixed windows → 2,000 teacher-labelled prefixes → 1,920 declared components</p>
      <Arrow>split before fitted statistics</Arrow>
      <div className="curation-partitions">
        {['train', 'tune', 'final'].map((name) => (
          <div key={name}>
            <strong>{name}</strong>
            <p>
              {observed.classCounts[name][0] + observed.classCounts[name][1]} records
              <br />
              {observed.classCounts[name][1]} positive · {observed.classCounts[name][0]} negative
            </p>
            <span>
              {name === 'train'
                ? 'fit 1,024-feature model'
                : name === 'tune'
                  ? 'choose threshold .10'
                  : 'apply frozen choice'}
            </span>
          </div>
        ))}
      </div>
      <Arrow>training rows → TF-IDF matrix × learned weight column + bias → sigmoid</Arrow>
      <Scroll
        className="curation-matrix-product"
        label="Training matrix 1184 by 1024 times weights 1024 by 1"
      >
        <div className="curation-matrix-art">
          {Array.from({ length: 48 }, (_, i) => (
            <i key={i} style={{ opacity: ((i * 7) % 13) / 16 + 0.15 }} />
          ))}
        </div>
        <span>×</span>
        <div className="curation-weight-art">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <span>→</span>
        <div className="curation-output-art">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </Scroll>
      <p>
        Drawing shows shapes and roles, not sampled feature magnitudes: X[1184,1024], w[1024],
        scores[1184]. Fit converged in {observed.fit.iterations} updates. Vocabulary and weights
        remain frozen during inspection.
      </p>
    </Figure>
  );
}
function UnitPlot({ label, horizontal, vertical, series, diagonal = false }) {
  return (
    <div className="curation-unit-plot">
      <p>{vertical}: 0 at bottom → 1 at top</p>
      <svg viewBox="0 0 340 230" role="img" aria-label={label}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1="15" x2="325" y1={215 - 200 * t} y2={215 - 200 * t} stroke="#ffffff18" />
            <line y1="15" y2="215" x1={15 + 310 * t} x2={15 + 310 * t} stroke="#ffffff18" />
          </g>
        ))}
        <path d="M15 15V215H325" fill="none" stroke="#dddddd" />
        {diagonal && (
          <path d="M15 215L325 15" fill="none" stroke="#ffffff66" strokeDasharray="5 5" />
        )}
        {series.map(({ name, color, points, connect = false }) => (
          <g key={name}>
            {connect && (
              <polyline
                points={points
                  .filter((p) => p[1] !== null)
                  .map(([x, y]) => `${15 + 310 * x},${215 - 200 * y}`)
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            )}
            {points
              .filter((p) => p[1] !== null)
              .map(([x, y], i) => (
                <circle key={i} cx={15 + 310 * x} cy={215 - 200 * y} r="4" fill={color} />
              ))}
          </g>
        ))}
      </svg>
      <p>{horizontal}: 0 at left → 1 at right</p>
      <div className="curation-plot-legend">
        {series.map((s) => (
          <span key={s.name} style={{ color: s.color }}>
            ● {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
function StudyResults() {
  const [policy, setPolicy] = useState('scratch'),
    [threshold, setThreshold] = useState(0.1),
    [rowIndex, setRowIndex] = useState(0);
  const rows = observed.predictions.map((row) => ({ ...row, score: row[policy] }));
  const r = metrics(rows, select(rows, 'threshold', threshold)),
    row = rows[rowIndex];
  const curve = Array.from({ length: 17 }, (_, i) => {
    const t = (10 + 5 * i) / 100,
      kept = select(rows, 'threshold', t),
      result = metrics(rows, kept);
    return { threshold: t, retention: kept.length / rows.length, ...result };
  });
  const bins = calibration(rows);
  return (
    <Figure id="C13" label="Actual final predictions and descriptive operating-point inspection">
      <Confusion result={r} showIds={false} />
      <div className="curation-pair">
        <UnitPlot
          label="Observed final precision and recall at the seventeen declared thresholds"
          horizontal="Retained-record fraction"
          vertical="Metric fraction"
          series={[
            {
              name: 'Precision',
              color: COLORS[0],
              points: curve.map((p) => [p.retention, p.precision]),
              connect: true,
            },
            {
              name: 'Recall',
              color: COLORS[1],
              points: curve.map((p) => [p.retention, p.recall]),
              connect: true,
            },
          ]}
        />
        <UnitPlot
          label="Observed final calibration bins, empty bins omitted"
          horizontal="Mean predicted probability"
          vertical="Observed positive fraction"
          diagonal
          series={[
            {
              name: 'Nonempty calibration bins',
              color: COLORS[2],
              points: bins.filter((b) => b.count).map((b) => [b.score, b.frequency]),
            },
          ]}
        />
      </div>
      <Table
        title="Measured final calibration support"
        headers={['Bin', 'Records', 'Mean score', 'Positive fraction']}
        rows={bins.map((b) => [
          `${n(b.low, 1)}–${n(b.high, 1)}`,
          b.count,
          n(b.score),
          n(b.frequency),
        ])}
      />
      <Bars
        rows={[
          ['Precision', r.precision, COLORS[0]],
          ['Recall', r.recall || 0, COLORS[1]],
          ['Record retention', (r.tp + r.fp) / rows.length, COLORS[2]],
        ]}
        label="Final precision recall retention fractions"
      />
      <p>
        {r.precision === null && 'Precision is undefined: there are no kept records. '}Brier{' '}
        {n(r.brier, 6)}. {rows.length} final prefixes; labels are teacher judgments.
      </p>
      <FlowControls>
        <FlowChoice
          label="Saved classifier"
          options={[
            ['scratch', 'Scratch'],
            ['library', 'scikit-learn'],
            ['constant', 'Constant baseline'],
          ]}
          value={policy}
          onChange={setPolicy}
        />
        <FlowSlider
          name="Descriptive threshold"
          min={0.1}
          max={0.9}
          step={0.05}
          value={threshold}
          onChange={setThreshold}
        />
        <button type="button" onClick={() => setThreshold(observed.selected[policy].threshold)}>
          Restore tune-selected threshold
        </button>
      </FlowControls>
      <FlowReadout>
        The fixed tune-selected {policy} threshold is {observed.selected[policy].threshold}.
        Exploring final thresholds here does not change the original study or create a new unbiased
        selection.
      </FlowReadout>
      <Table
        title="Recorded final row"
        headers={['Field', 'Value']}
        rows={[
          ['ID / source row', `${row.id} / ${row.source_row}`],
          ['Teacher integer / binary label', `${row.teacher_score} / ${row.label}`],
          [
            'Saved score / decision',
            `${n(row.score, 8)} / ${row.score >= threshold ? 'keep' : 'remove'}`,
          ],
          ['Prefix UTF-8 bytes', row.prefix_bytes],
          ['Group identity', row.group],
          ['Text digest', row.text_sha256],
        ]}
      />
      <FlowControls>
        <FlowSlider
          name="Final record index"
          min={0}
          max={rows.length - 1}
          step={1}
          value={rowIndex}
          onChange={setRowIndex}
        />
      </FlowControls>
    </Figure>
  );
}
function NeuralAnatomy() {
  const [index, setIndex] = useState(0),
    row = observed.neural.examples[index];
  return (
    <Figure id="C14" label="Actual released BERT curator and recorded input">
      <p>{row.text}</p>
      <div className="curation-token-ids">
        {row.ids.map((id, i) => (
          <span key={i} className={i === 0 ? 'is-cls' : ''}>
            {i === 0 ? 'CLS ' : ''}
            {id}
          </span>
        ))}
      </div>
      <p>
        {row.characters} Unicode characters → {row.model_tokens} model positions; this example has
        validity 1 at every shown position.
      </p>
      <div className="curation-bert-stack">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i}>
            <span>encoder layer {i + 1}</span>
            <i />
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
      <Arrow>final contextual rows · width 768 · read CLS row</Arrow>
      <Vector
        label="Actual verified head"
        values={['dense 768→768', 'tanh', 'linear 768→1']}
        role="weight"
      />
      <p>
        Recorded raw scalar <strong>{n(row.raw_score, 6)}</strong> → clamp {n(row.clamped, 6)} →
        integer {row.integer_score} → {row.kept ? 'keep' : 'remove'}
      </p>
      <FlowControls>
        <FlowChoice
          label="Recorded model input"
          options={observed.neural.examples.map((r, i) => [i, r.id])}
          value={index}
          onChange={setIndex}
        />
      </FlowControls>
      <FlowReadout>
        Actual CPU inference, pinned revision 284663cb… . This regressor predicts an
        educational-rubric score; its single scalar is not a probability.
      </FlowReadout>
    </Figure>
  );
}
function Rounding() {
  const [raw, setRaw] = useState(2.5),
    r = neuralPolicy(raw);
  return (
    <Figure id="C15" label="Clamping and nearest-even integer decision">
      <div className="curation-rounding-axis">
        <span style={{ left: `${(r.clamped / 5) * 100}%` }}>▼</span>
        <div>
          {[0, 1, 2, 3, 4, 5].map((x) => (
            <b key={x}>{x}</b>
          ))}
        </div>
      </div>
      <Vector
        label="raw → clamped → nearest even → threshold 3"
        values={[raw, r.clamped, r.integer, r.keep ? 'KEEP' : 'REMOVE']}
        role="contribution"
      />
      <FlowControls>
        <FlowSlider
          name="Raw regression score"
          min={-1}
          max={6}
          step={0.01}
          value={raw}
          onChange={setRaw}
        />
        {[2.49, 2.5, 2.52, 3].map((x) => (
          <button key={x} type="button" onClick={() => setRaw(x)}>
            {x}
          </button>
        ))}
      </FlowControls>
      <FlowReadout>
        {raw === 2.5
          ? 'The exact 2.5 tie rounds to even 2, so it is removed.'
          : `${n(raw)} becomes integer ${r.integer}; ${r.keep ? 'kept' : 'removed'}.`}{' '}
        This is an integer-score policy, not raw ≥2.5.
      </FlowReadout>
    </Figure>
  );
}
const pipelineRows = [
  { id: 'A', repetition: true, curator: true, score: .85, bytes: 20 },
  { id: 'B', repetition: true, curator: false, score: .35, bytes: 60 },
  { id: 'C', repetition: false, curator: true, score: .9, bytes: 10 },
  { id: 'D', repetition: true, curator: true, score: .7, bytes: 10 },
];
function Pipeline({ audit = false }) {
  const [reverse, setReverse] = useState(false),
    [representativeFirst, setRepresentativeFirst] = useState(false),
    [overlap, setOverlap] = useState(false);
  const order = reverse ? ['curator', 'repetition'] : ['repetition', 'curator'];
  const inputs = pipelineRows.map(row => row.id === 'C' && overlap ? { ...row, score: .4, curator: false } : row);
  const rows = pipelineAudit(inputs, order);
  return (
    <Figure
      id={audit ? 'C17' : 'C16'}
      label={
        audit
          ? 'Inclusive failures versus first-removal attribution'
          : 'Record conservation through pure filtering'
      }
    >
      <p>Supplied scores A .85 · B .35 · C {overlap ? '.40' : '.90'} · D .70; curator keeps scores ≥.50. C fails repetition.</p>
      {audit ? (
        <Table
          title="The same immutable rows, two predicates"
          headers={['ID', 'Fails repetition?', 'Fails curator?', 'First removal', 'Final']}
          rows={rows.map((row) => [
            <Doc id={row.id} />,
            row.failures.includes('repetition') ? '× yes' : 'no',
            row.failures.includes('curator') ? '× yes' : 'no',
            row.first || 'none',
            row.keep ? 'keep' : 'remove',
          ])}
        />
      ) : (
        <div className="curation-stage-trace">
          {['Input', ...order, 'Writer'].map((stage, i) => {
            const active =
              i === 0
                ? DOCUMENTS
                : pipelineRows
                    .filter((row) => order.slice(0, Math.min(i, 2)).every((name) => row[name]))
                    .map((row) => row.id);
            return (
              <div key={stage}>
                <strong>{stage}</strong>
                <div>
                  {DOCUMENTS.map((id) => (
                    <Doc id={id} key={id} rejected={!active.includes(id)} />
                  ))}
                </div>
                <span>
                  {active.length} records ·{' '}
                  {pipelineRows
                    .filter((row) => active.includes(row.id))
                    .reduce((a, row) => a + row.bytes, 0)}{' '}
                  bytes
                </span>
              </div>
            );
          })}
        </div>
      )}
      <FlowControls>
        <FlowChoice
          label="Pure predicate order"
          options={[
            [false, 'Repetition → curator'],
            [true, 'Curator → repetition'],
          ]}
          value={reverse}
          onChange={setReverse}
        />
      </FlowControls>
      <FlowReadout>
        A,D survive both orders. C's first-removal reason is{' '}
        {rows.find((row) => row.id === 'C').first}; its inclusive failures stay{' '}
        {overlap ? 'repetition and curator' : 'repetition only'}.
        {' '}Accepted A,D plus rejected B,C account for every ID once.
        {audit && !overlap && ' Lower C’s supplied score to create an overlapping failure, then swap the order.'}
      </FlowReadout>
      {audit && (
        <>
          <FlowControls>
            <button type="button" onClick={() => setOverlap(!overlap)}>
              {overlap ? 'Restore C score .90' : 'Change C score to .40: fail both'}
            </button>
          </FlowControls>
          <p>
            Now change the kind of stage: in a duplicate pair X1/X2, choose the first
            representative. X1 fails the score; X2 passes.
          </p>
          <div className="curation-stateful">
            <span>X1: first · fails score</span>
            <span>↔ same duplicate group</span>
            <span>X2: second · passes score</span>
          </div>
          <FlowControls>
            <FlowChoice
              label="Stateful stage order"
              options={[
                [false, 'Score → representative'],
                [true, 'Representative → score'],
              ]}
              value={representativeFirst}
              onChange={setRepresentativeFirst}
            />
          </FlowControls>
          <FlowReadout>
            {representativeFirst
              ? 'Choose X1 first, then remove it: nothing survives.'
              : 'Remove X1 first, then choose X2: X2 survives.'}{' '}
            Representative selection is not an independent predicate on each original row.
          </FlowReadout>
        </>
      )}
    </Figure>
  );
}
function Ratio() {
  const [text, setText] = useState('pendulum energy'),
    [same, setSame] = useState(false);
  const general = reference('general'),
    target = reference(same ? 'general' : 'target');
  const a = surprise(text, general),
    b = surprise(text, target);
  const total = a.total - b.total,
    mean = a.rows.length ? total / a.rows.length : null;
  return (
    <Figure id="C18" label="Shared-support reference ratio contributions">
      <Table
        title="Both references on the same outcomes"
        headers={['Outcome', 'General p', 'Target q', 'ln(q/p)']}
        rows={SUPPORT.map((word, i) => [
          word,
          n(general.probabilities[i]),
          n(target.probabilities[i]),
          n(Math.log(target.probabilities[i] / general.probabilities[i])),
        ])}
      />
      <div className="curation-ratio-terms">
        {a.rows.map((row, i) => (
          <div key={i}>
            <code>{row.word}</code>
            <strong>{n(row.loss - b.rows[i].loss)}</strong>
            <span>target advantage, nats</span>
          </div>
        ))}
      </div>
      <p>
        Total log ratio {n(total)}; word mean {n(mean)}. Exponentiated total {n(Math.exp(total))};
        exponentiated mean {mean === null ? 'undefined' : n(Math.exp(mean))}.
      </p>
      <FlowControls>
        <label className="curation-field">
          Phrase
          <input value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <FlowChoice
          label="Reference relation"
          options={[
            [false, 'Different'],
            [true, 'Identical'],
          ]}
          value={same}
          onChange={setSame}
        />
        <Reset
          onClick={() => {
            setText('pendulum energy');
            setSame(false);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {same
          ? 'Identical references make every contribution zero.'
          : 'Positive means the target reference assigns greater probability to the sequence.'}{' '}
        The mean removes length scaling; it is a different selection score.
      </FlowReadout>
    </Figure>
  );
}
function Ensemble() {
  const [same, setSame] = useState(false),
    [mode, setMode] = useState('union'),
    [cutoff, setCutoff] = useState(0.6);
  const a = rankPercentiles({ A: 4, B: 3, C: 2, D: 1 });
  const b = rankPercentiles(same ? { A: 4, B: 3, C: 2, D: 1 } : { A: 2, B: 1, C: 4, D: 3 });
  const kept = DOCUMENTS.filter(
    (id) => (mode === 'union' ? Math.max(a[id], b[id]) : Math.min(a[id], b[id])) >= cutoff,
  );
  return (
    <Figure id="C19" label="Within-curator percentiles and literal set combination">
      <div className="curation-ensemble">
        <div>
          <strong>Curator 1</strong>
          {DOCUMENTS.map((id) => (
            <div key={id}>
              <Doc id={id} />
              <span>
                {n(a[id])} {a[id] >= cutoff ? '● selected' : '○'}
              </span>
            </div>
          ))}
        </div>
        <div>
          <strong>Curator 2</strong>
          {DOCUMENTS.map((id) => (
            <div key={id}>
              <Doc id={id} />
              <span>
                {n(b[id])} {b[id] >= cutoff ? '● selected' : '○'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Arrow>
        {mode === 'union'
          ? 'max percentile = selected by either'
          : 'min percentile = selected by both'}
      </Arrow>
      <div className="curation-record-marks">
        {DOCUMENTS.map((id) => (
          <Doc key={id} id={id} rejected={!kept.includes(id)} />
        ))}
      </div>
      <FlowControls>
        <FlowChoice
          label="Combine"
          options={[
            ['union', 'Union'],
            ['intersection', 'Intersection'],
          ]}
          value={mode}
          onChange={setMode}
        />
        <FlowSlider
          name="Percentile cutoff"
          value={cutoff}
          onChange={setCutoff}
          min={0}
          max={1}
          step={0.05}
        />
        <FlowChoice
          label="Rankings"
          options={[
            [false, 'Different'],
            [true, 'Identical'],
          ]}
          value={same}
          onChange={setSame}
        />
        <Reset
          onClick={() => {
            setSame(false);
            setMode('union');
            setCutoff(0.6);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {kept.length}/4 kept: {kept.join(', ') || 'none'}. Percentile alignment does not calibrate
        truth probabilities or conserve the retained count.
      </FlowReadout>
    </Figure>
  );
}
function Work() {
  const [retention, setRetention] = useState(0.2),
    [cost, setCost] = useState(10);
  const cheap = costLedger(1000, [1, cost], [retention, 0.5]);
  const expensive = costLedger(1000, [cost, 1], [0.5, retention]);
  return (
    <Figure id="C20" label="Incoming record counts and conditional stage work">
      <div className="curation-pair">
        {[
          ['Cheap first', cheap],
          ['Expensive first', expensive],
        ].map(([name, result]) => (
          <div key={name}>
            <strong>{name}</strong>
            {result.stages.map((stage, i) => (
              <div className="curation-work-stage" key={i}>
                <div style={{ width: `${(stage.incoming / 1000) * 100}%` }} />
                <p>
                  {n(stage.incoming)} incoming × {n(stage.cost)} work/record ={' '}
                  <strong>{n(stage.work)}</strong>
                </p>
              </div>
            ))}
            <p>
              Total {n(result.total)} · remain {n(result.remaining)}
            </p>
          </div>
        ))}
      </div>
      <FlowControls>
        <FlowSlider
          name="Cheap-stage retained fraction"
          min={0}
          max={1}
          step={0.05}
          value={retention}
          onChange={setRetention}
        />
        <FlowSlider
          name="Expensive work per record"
          min={1}
          max={20}
          step={1}
          value={cost}
          onChange={setCost}
        />
        <Reset
          onClick={() => {
            setRetention(0.2);
            setCost(10);
          }}
        />
      </FlowControls>
      <FlowReadout>
        Constructed independent pass fractions and fixed costs. Audit-all-predicates work and
        correlated conditional retention need separate accounting.
      </FlowReadout>
      <p>
        Teacher/student account: teacher labels 50 × 20 + fit 200 + student scores N × 2. Direct
        teacher N × 20. Crossover: N &gt; 1200/18, first integer 67.
      </p>
    </Figure>
  );
}
function Downstream() {
  const [fraction, setFraction] = useState(0.25),
    pool = 1000 * fraction;
  const unique = pool * -Math.expm1(1000 * Math.log1p(-1 / pool));
  return (
    <Figure id="C21" label="Fixed training budget and changed available corpus">
      <div className="curation-controlled-study">
        <div className="curation-fixed">
          Shared model initialization
          <br />
          Shared optimizer
          <br />
          1,000 target presentations
          <br />
          Same independent evaluation
        </div>
        <div className="curation-pair">
          <div>
            <strong>Original pool</strong>
            <div className="curation-pool-grid">
              {Array.from({ length: 100 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <p>1,000 unique targets</p>
          </div>
          <div>
            <strong>Filtered pool</strong>
            <div className="curation-pool-grid">
              {Array.from({ length: 100 }, (_, i) => (
                <i key={i} style={{ opacity: i < 100 * fraction ? 1 : 0.12 }} />
              ))}
            </div>
            <p>{n(pool)} unique targets</p>
          </div>
        </div>
      </div>
      <FlowControls>
        <FlowSlider
          name="Retained unique-target fraction"
          value={fraction}
          onChange={setFraction}
          min={0.05}
          max={1}
          step={0.05}
        />
      </FlowControls>
      <FlowReadout>
        Mean cyclic exposure {n(1000 / pool)} presentations per retained target. Uniform replacement
        yields {n(unique, 2)} expected distinct targets. Equal processed targets do not mean equal
        diversity.
      </FlowReadout>
      <Table
        title="Published DCLM v2 Table 3: extractor intervention, 1B–1x recipe"
        headers={['Extractor', 'CORE', 'EXTENDED']}
        rows={[
          ['WET', 20.7, 12.2],
          ['resiliparse', 24.1, 13.4],
          ['trafilatura', 24.5, 12.5],
        ]}
      />
      <p>
        Attributed controlled result: 1.4B parameters, 28.8B training tokens, RefinedWeb heuristics.
        These are the paper's aggregate scores, not a local training run or a universal extractor
        ranking.
      </p>
    </Figure>
  );
}

const FIGURES = {
  C01: Extraction,
  C02: Retention,
  C03: Repetition,
  C04: () => <Reference />,
  C05: () => <Reference candidate />,
  C06: LabelSources,
  C07: Features,
  C08: Update,
  C09: Splits,
  C10: Selection,
  C11: Calibration,
  C12: StudyAnatomy,
  C13: StudyResults,
  C14: NeuralAnatomy,
  C15: Rounding,
  C16: () => <Pipeline />,
  C17: () => <Pipeline audit />,
  C18: Ratio,
  C19: Ensemble,
  C20: Work,
  C21: Downstream,
};
export default function CurationFigure({ id }) {
  const Component = FIGURES[id];
  if (!Component) throw new Error(`Unknown curation mechanism ${id}`);
  return <Component />;
}
