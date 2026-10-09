import React, { useEffect, useId, useState } from 'react';
import { Math as SharedInlineMath } from '../content/Math.jsx';
import * as M from '../../data/prm-models.js';
import './prm-flow.css';

const hues = ['#76b8ff', '#ba9bff', '#f0bd68', '#76d0d9', '#e6a3bd', '#b8c7e0'];
const f = (value, digits = 4) =>
  value === null || value === undefined
    ? 'unknown'
    : !Number.isFinite(value)
      ? value < 0
        ? '−∞'
        : '∞'
      : Number(value.toFixed(digits)).toString();
const known = (value) => (value === null ? 'unknown' : value ? '✓ passes' : '× fails');

function Figure({ id, title, children, note }) {
  return (
    <figure className="prm-figure" data-prm-figure={id} aria-label={title}>
      {children}
      {note && <p className="prm-note">{note}</p>}
    </figure>
  );
}
function Controls({ children }) {
  return <div className="prm-controls">{children}</div>;
}
function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option
            key={Array.isArray(option) ? option[0] : option}
            value={Array.isArray(option) ? option[0] : option}
          >
            {Array.isArray(option) ? option[1] : option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05 }) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}: <output>{f(value)}</output>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="prm-toggle">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
function Scroll({ children, label = 'Diagram; scroll horizontally for its full structure' }) {
  const node = React.useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = node.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div className="prm-scroll-shell">
      <div ref={node} className="prm-scroll" tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      {overflow && (
        <p className="prm-scroll-hint">
          Scroll horizontally for the complete structure. Keyboard: focus this region and use ← / →.
        </p>
      )}
    </div>
  );
}
export { Scroll as PRMScroll };
function SVG({ width = 640, height, children, label }) {
  return (
    <Scroll label={label}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </Scroll>
  );
}
function Masses({ values, names = M.classes, title = 'Class probabilities' }) {
  return (
    <div className="prm-masses" aria-label={title}>
      {values.map((p, i) => (
        <div key={names[i]}>
          <span>{names[i]}</span>
          <div className="prm-mass-track">
            <span style={{ width: `${p * 100}%`, background: hues[i] }} />
          </div>
          <output>{f(p)}</output>
        </div>
      ))}
    </div>
  );
}
function Output({ children }) {
  return (
    <div className="prm-output" aria-live="polite">
      {children}
    </div>
  );
}
export function PRMTable({ caption, headers, rows }) {
  return (
    <Scroll label={`${caption}: table`}>
      <table className="prm-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((text, i) => (
              <th key={i} scope="col">
                {text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((text, j) => (
                <td key={j}>{text}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
const requests = new Map();
function load(url, retry = false) {
  if (retry) requests.delete(url);
  if (!requests.has(url))
    requests.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .catch((error) => {
          requests.delete(url);
          throw error;
        }),
    );
  return requests.get(url);
}
function useEvidence(model = false) {
  const [state, setState] = useState({ data: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, error: null });
    const jobs = [load('/learn-data/process-reward-models/observations.json', version > 0)];
    if (model) jobs.push(load('/learn-code/process-reward-models/study/model.json', version > 0));
    Promise.all(jobs)
      .then(([data, weights]) => {
        if (active) setState({ data, model: weights, error: null });
      })
      .catch((error) => {
        if (active) setState({ data: null, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [model, version]);
  return { ...state, retry: () => setVersion((value) => value + 1) };
}
function Pending({ state }) {
  return (
    <Output>
      {state.error ? (
        <>
          <p>Retained evidence could not load ({state.error}). No result has been substituted.</p>
          <button onClick={state.retry}>Retry evidence</button>
        </>
      ) : (
        <p>Loading retained evidence…</p>
      )}
    </Output>
  );
}

export function PRMAlgebraTrajectories() {
  const [answer, setAnswer] = useState('3');
  const paths = [
    ['A', ['2x + 2 = 8', '2x = 6', 'x = 3'], '3', null],
    ['B', ['2x + 1 = 8', '2x = 7', 'x = 3.5'], answer, 0],
    ['C', ['2x + 2 = 8', '2x = 6', 'answer 4'], '4', 2],
  ];
  return (
    <Figure
      id="D01"
      title="Judge the transformation and the assertion separately"
      note="Constructed paths for 2(x+1)=8. Identity hue stays fixed when a checker result changes."
    >
      <div className="prm-paths">
        {paths.map(([id, steps, terminal, error], i) => (
          <div className="prm-algebra" key={id} style={{ '--identity': hues[i] }}>
            <b>{id}</b>
            <ol>
              {steps.map((step, j) => (
                <li key={j}>
                  <span className={error === j ? 'prm-error-term' : ''}>
                    {id === 'B' && j === 0 ? (
                      <>
                        2x + <mark>1</mark> = 8
                      </>
                    ) : (
                      step
                    )}
                  </span>
                  <small>
                    {error === j
                      ? '× first error'
                      : error !== null && j > error
                        ? 'consistent with supplied premise'
                        : '✓ valid transformation'}
                  </small>
                </li>
              ))}
            </ol>
            <div className="prm-terminal">
              Asserted answer {terminal}
              <strong>{known(terminal === '3')}</strong>
            </div>
            <p>First process error: {error === null ? 'none' : `step ${error}`}</p>
          </div>
        ))}
      </div>
      <Controls>
        <Select
          label="B asserted answer"
          value={answer}
          onChange={setAnswer}
          options={['3', '3.5']}
        />
        <button onClick={() => setAnswer('3')}>Reset paths</button>
      </Controls>
    </Figure>
  );
}

export function PRMTaskGeometry() {
  const [position, setPosition] = useState(4);
  const tokens = ['Q', 'a', 'SEP', 'b', 'SEP'];
  const ids = [1, 2, 3, 4, 3];
  return (
    <Figure
      id="D02"
      title="A scorer reads supplied text; a generator proposes text"
      note="Illustrative width 3 and vocabulary 5. Local roles: supplied IDs cyan, learned embedding/head arrays amber, contextual vectors and computed scores violet. The same SEP ID selects the same embedding row; causal context can still differ."
    >
      <SVG
        height={440}
        label="Token positions select embedding rows; causal context feeds a three-class head; generator has a separate vocabulary head"
      >
        <text x={20} y={25}>
          Scorer: supplied IDs → row lookup → causal contextual vector
        </text>
        {tokens.map((token, i) => (
          <g key={i}>
            <rect
              x={25 + i * 115}
              y={50}
              width={85}
              height={45}
              fill={i <= position ? hues[3] : '#202637'}
              opacity={i <= position ? 0.85 : 0.5}
              stroke={i === position ? 'white' : 'none'}
              strokeWidth={3}
            />
            <text x={67 + i * 115} y={72} textAnchor="middle" fill="#101724">
              {token}
            </text>
            <text x={67 + i * 115} y={113} textAnchor="middle">
              i={i}; ID={ids[i]}
            </text>
            {[0, 1, 2].map((j) => (
              <rect
                key={j}
                x={25 + i * 115 + j * 28}
                y={133}
                width={26}
                height={24}
                fill={hues[2]}
                opacity={0.25 + ((ids[i] + j) % 3) * 0.2}
              />
            ))}
            {i <= position && (
              <line x1={67 + i * 115} y1={160} x2={300} y2={200} stroke={hues[3]} />
            )}
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={245 + i * 40} y={200} width={38} height={32} fill={hues[1]} />
            <line x1={264 + i * 40} y1={234} x2={264 + i * 40} y2={260} stroke={hues[1]} />
          </g>
        ))}
        <text x={385} y={222}>
          h at boundary {position}
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            {[0, 1, 2].map((row) => (
              <rect
                key={row}
                x={245 + i * 40}
                y={260 + row * 13}
                width={38}
                height={11}
                fill={hues[2]}
              />
            ))}
            <text x={264 + i * 40} y={315} textAnchor="middle">
              {M.classes[i][0]}
            </text>
          </g>
        ))}
        <text x={385} y={285}>
          scorer head: 3×3 + bias
        </text>
        <line x1={15} y1={334} x2={625} y2={334} stroke="#78849a" />
        <text x={20} y={360}>
          Separate generator θ
        </text>
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((column) => (
            <rect
              key={`${row}-${column}`}
              x={40 + column * 35}
              y={375 + row * 13}
              width={32}
              height={11}
              fill={hues[2]}
            />
          )),
        )}
        {[0.15, 0.4, 0.1, 0.25, 0.1].map((p, i) => (
          <rect
            key={i}
            x={300 + i * 60}
            y={405 - p * 70}
            width={40}
            height={p * 70}
            fill={hues[1]}
          />
        ))}
        <text x={275} y={432}>
          next-token vocabulary probabilities
        </text>
      </SVG>
      <Output>
        Selected boundary {position} reads positions 0–{position}. Scoring supplied tokens creates
        no new token and performs no weight update.
      </Output>
      <Controls>
        <Select
          label="Selected boundary"
          value={position}
          onChange={(value) => setPosition(Number(value))}
          options={[
            [2, 'position 2'],
            [4, 'position 4'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMLabelSemantics() {
  const [mode, setMode] = useState('local');
  const rows =
    mode === 'local'
      ? [
          'invalid',
          'valid under supplied premise',
          'valid under supplied premise',
          'neutral repeat',
        ]
      : mode === 'cumulative'
        ? Array(4).fill('invalid prefix')
        : ['invalid', 'unknown', 'unknown', 'unknown'];
  return (
    <Figure id="D03" title="The same written path supports different label contracts">
      <div className="prm-expression-row">
        {['2x+1=8', '2x=7', 'x=3.5', 'repeat x=3.5'].map((text, i) => (
          <div key={text}>
            <b>step {i}</b>
            <code>{text}</code>
            <span className={rows[i] === 'unknown' ? 'prm-unknown' : ''}>{rows[i]}</span>
          </div>
        ))}
      </div>
      <PRMTable
        caption="Aligned constructed rubric rows for the same four boundaries"
        headers={['contract', 'step 0', 'step 1', 'step 2', 'step 3']}
        rows={[
          [
            'local validity',
            'invalid',
            'valid under supplied premise',
            'valid under supplied premise',
            'valid repeat',
          ],
          ['cumulative validity', 'invalid', 'invalid', 'invalid', 'invalid'],
          [
            'local progress under supplied premise',
            'invalid attempt',
            'manipulation advances that premise',
            'solves that premise',
            'neutral repeat',
          ],
          ['first-error stop', 'invalid', 'unknown', 'unknown', 'unknown'],
        ]}
      />
      <PRMTable
        caption="Names remain separate from indices"
        headers={['Rubric', 'Meaning']}
        rows={[
          ['Local', 'Judge the current operation relative to its visible premise.'],
          ['Cumulative', 'Judge whether the whole prefix remains valid for the original question.'],
          [
            'Progress',
            'A reasonable attempt can be suboptimal; positive progress labels do not guarantee positive value advantage.',
          ],
          ['First-error stop', 'Keep the known error; leave later labels unknown.'],
        ]}
      />
      <Output>
        First expansion is invalid under every displayed contract. Reasserting answer 3 does not
        repair that historical prefix.
      </Output>
      <Controls>
        <Select
          label="Annotation convention"
          value={mode}
          onChange={setMode}
          options={[
            ['local', 'local operation'],
            ['cumulative', 'cumulative validity'],
            ['stop', 'first-error stop'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function SourceMath({ children }) {
  const ref = React.useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  return (
    <span className="prm-source-math-shell">
      <span
        ref={ref}
        className="prm-source-math"
        tabIndex={0}
        role="region"
        aria-label="Original source equation; scroll horizontally when needed"
        data-source-latex={children}
      >
        <SharedInlineMath>{children}</SharedInlineMath>
      </span>
      {overflow && (
        <span className="prm-source-math-hint">
          Scroll this equation horizontally; focus it and use ← / →.
        </span>
      )}
    </span>
  );
}

function SourceText({ children }) {
  // These two retained source records use single-dollar inline math delimiters.
  // Prose remains escaped React text; only the delimited expression enters shared KaTeX.
  return String(children)
    .split(/(\$[^$]+\$)/g)
    .map((part, index) =>
      part.startsWith('$') && part.endsWith('$') ? (
        <SourceMath key={index}>{part.slice(1, -1)}</SourceMath>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      ),
    );
}

export function PRMBranchAnnotation() {
  const state = useEvidence();
  const [index, setIndex] = useState(0);
  if (!state.data)
    return (
      <Figure id="D04" title="Source alternatives share one parent">
        <Pending state={state} />
      </Figure>
    );
  const branch = state.data.branches[index];
  const siblings = branch.annotation.completions;
  return (
    <Figure id="D04" title="Read the actual annotation branch before extracting labels">
      <div className="prm-parent">
        <b>
          upstream {branch.split}: record {branch.record}, step {branch.step}
        </b>
        <p>Shared parent: {branch.prefix.length} chosen earlier steps</p>
        <p>
          <SourceText>{branch.question}</SourceText>
        </p>
        {branch.prefix.length ? (
          <ol>
            {branch.prefix.map((text, i) => (
              <li key={i} value={i + 1}>
                <span>step {i}: </span>
                <SourceText>{text}</SourceText>
              </li>
            ))}
          </ol>
        ) : (
          <p>∅ Empty earlier prefix; this is the first step.</p>
        )}
      </div>
      <SVG
        height={220}
        label={`Actual parent address fans into ${siblings.length} sibling alternatives; selected edge is drawn only when present`}
      >
        <text x={320} y={22} textAnchor="middle">
          parent ({branch.record}, {branch.step})
        </text>
        <circle cx={320} cy={45} r={9} fill={hues[3]} />
        {siblings.map((item, i) => {
          const x = ((i + 0.5) * 640) / siblings.length;
          const chosen = branch.annotation.chosen_completion === i;
          return (
            <g key={i}>
              <line
                x1={320}
                y1={54}
                x2={x}
                y2={122}
                stroke={chosen ? 'white' : hues[1]}
                strokeWidth={chosen ? 3 : 1.5}
              />
              <circle
                cx={x}
                cy={130}
                r={8}
                fill={hues[1]}
                stroke={chosen ? 'white' : 'none'}
                strokeWidth={3}
              />
              <text x={x} y={159} textAnchor="middle">
                alternative {i}
              </text>
              <text x={x} y={184} textAnchor="middle">
                rating {item.rating ?? 'unknown'}
              </text>
              <text x={x} y={208} textAnchor="middle">
                {chosen ? 'chosen' : 'same parent'}
              </text>
            </g>
          );
        })}
      </SVG>
      <div className="prm-siblings">
        {siblings.map((item, i) => (
          <div key={i} className={branch.annotation.chosen_completion === i ? 'prm-selected' : ''}>
            <b>alternative {i}</b>
            <span>
              same parent ({branch.record}, {branch.step})
            </span>
            <p>
              <SourceText>{item.text}</SourceText>
            </p>
            <p>
              rating:{' '}
              {item.rating === null || item.rating === undefined
                ? 'unknown'
                : `${item.rating} (${M.classes[item.rating + 1]})`}
              ; flagged: {String(Boolean(item.flagged))}
            </p>
            <strong>
              {branch.annotation.chosen_completion === i
                ? 'chosen continuation'
                : 'sibling alternative'}
            </strong>
          </div>
        ))}
      </div>
      <Output>
        Chosen edge:{' '}
        {branch.annotation.chosen_completion === null ||
        branch.annotation.chosen_completion === undefined
          ? 'absent; do not guess a continuation'
          : `alternative ${branch.annotation.chosen_completion}`}
        .
      </Output>
      <Controls>
        <Select
          label="Actual source address"
          value={index}
          onChange={(value) => setIndex(Number(value))}
          options={[
            [0, 'train record 0, last step'],
            [1, 'test record 156, step 5'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMBoundaryAnatomy() {
  const [longer, setLonger] = useState(false);
  const [boundary, setBoundary] = useState(2);
  const tokens = longer
    ? ['Q', 'a', 'SEP', 'b', 'c', 'SEP', 'PAD']
    : ['Q', 'a', 'SEP', 'b', 'SEP', 'PAD'];
  const selected = boundary === 2 ? 2 : longer ? 5 : 4;
  return (
    <Figure id="D05" title="A separator class target uses its current contextual row">
      <Scroll>
        <div
          className="prm-position-grid"
          style={{ gridTemplateColumns: `130px repeat(${tokens.length}, 70px)` }}
        >
          <b>position</b>
          {tokens.map((_, i) => (
            <b key={i}>{i}</b>
          ))}
          <b>token / ID</b>
          {tokens.map((token, i) => (
            <span key={i} className={i === selected ? 'prm-selected' : ''}>
              {token}
              <small>ID {['Q', 'a', 'SEP', 'b', 'c', 'PAD'].indexOf(token) + 1}</small>
            </span>
          ))}
          <b>lookup E[id]</b>
          {tokens.map((_, i) => (
            <span key={i} className="prm-vector">
              ▰ ▰ ▰
            </span>
          ))}
          <b>causal hᵢ</b>
          {tokens.map((_, i) => (
            <span key={i} className={i <= selected ? 'prm-visible' : ''}>
              h{sub(i)}
            </span>
          ))}
          <b>current class</b>
          {tokens.map((token, i) => (
            <span key={i}>{token === 'SEP' ? (i === 2 ? '2 progress' : '0 invalid') : '—'}</span>
          ))}
          <b>LM next token</b>
          {tokens.map((_, i) => (
            <span key={i}>
              {tokens[i + 1] === 'PAD' || i === tokens.length - 1 ? 'masked' : tokens[i + 1]}
            </span>
          ))}
        </div>
      </Scroll>
      <Output>
        Boundary {selected} reads positions 0–{selected}. The class target stays at {selected}; an
        LM target instead names the token after its predictor row.
      </Output>
      <Controls>
        <Toggle label="Add c before the second separator" value={longer} onChange={setLonger} />
        <Select
          label="Boundary to trace"
          value={boundary}
          onChange={(value) => setBoundary(Number(value))}
          options={[
            [2, 'first separator'],
            [4, 'second separator'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
function sub(value) {
  return <sub>{value}</sub>;
}

export function PRMVisibilityAndTargets() {
  const state = useEvidence();
  const [row, setRow] = useState(2);
  const [masked, setMasked] = useState(false);
  const [future, setFuture] = useState(false);
  const tokens = ['Q', 'a', 'SEP', future ? 'edited b' : 'b', 'SEP', 'EOS', 'PAD'];
  return (
    <Figure id="D06" title="Visibility and eligibility are two independent masks">
      <PRMTable
        caption="Causal attention: columns are keys; rows are queries"
        headers={['query ↓ / key →', ...tokens.map((token, i) => `${i} ${token}`)]}
        rows={tokens.map((token, i) => [
          <button onClick={() => setRow(i)} aria-pressed={row === i}>
            {i} {token}
          </button>,
          ...tokens.map((_, j) => (
            <span
              className={
                j <= i && j !== 6
                  ? row === i
                    ? 'prm-visible prm-selected'
                    : 'prm-visible'
                  : 'prm-excluded'
              }
            >
              {j <= i && j !== 6 ? '1' : '0'}
            </span>
          )),
        ])}
      />
      <div className="prm-token-line">
        {tokens.map((token, i) => (
          <span key={i}>
            <b>
              {i} {token}
            </b>
            <small>{!masked && (i === 2 || i === 4) ? 'class eligible' : 'no class target'}</small>
          </span>
        ))}
      </div>
      <Output>
        Query {row} can read [{Array.from({ length: Math.min(row + 1, 6) }, (_, i) => i).join(', ')}
        ].{' '}
        {masked
          ? 'No eligible targets: mean loss unknown; update skipped.'
          : 'Two eligible class positions: 2, 4.'}{' '}
        {future
          ? 'The future edit is after boundary 2.'
          : 'EOS is a visible token; PAD key is excluded.'}
      </Output>
      {state.data ? (
        <p className="prm-note">
          Actual random Transformers run: “future edit cannot change earlier boundary” and “later
          boundary responds to visible edit” both passed. Every parameter stayed unchanged for the
          all-masked batch. Its original first-boundary masses were [
          {state.data.transformers.boundary_probabilities[0].map((value) => f(value, 7)).join(', ')}
          ]. These are retained native checks, not a live Transformer inference in this browser.
        </p>
      ) : (
        <Pending state={state} />
      )}
      <Controls>
        <Slider label="Query row" value={row} onChange={setRow} max={6} step={1} />
        <Toggle label="Mask all class targets" value={masked} onChange={setMasked} />
        <Toggle label="Edit the later step" value={future} onChange={setFuture} />
      </Controls>
    </Figure>
  );
}

export function PRMReductionDenominator() {
  const [masks, setMasks] = useState([[true], [true, true, true]]);
  const result = M.reductions([[4], [1, 1, 1]], masks);
  return (
    <Figure id="D07" title="Choose which objects receive equal weight">
      <div className="prm-loss-rows">
        {[[4], [1, 1, 1]].map((values, i) => (
          <div key={i}>
            <b>trajectory {i === 0 ? 'A' : 'B'}</b>
            {values.map((value, j) => (
              <button
                key={j}
                className={masks[i][j] ? 'prm-loss-included' : 'prm-unknown'}
                aria-pressed={masks[i][j]}
                onClick={() =>
                  setMasks((current) =>
                    current.map((row, r) =>
                      row.map((item, c) => (r === i && c === j ? !item : item)),
                    ),
                  )
                }
              >
                <strong>{value}</strong>
                <small>{masks[i][j] ? 'included' : 'masked'}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="prm-reduction-pools">
        <div>
          <span className="prm-bracket">all included boundary losses</span>
          <strong>
            sum ÷ {result.boundaries} boundaries = {f(result.boundary)}
          </strong>
          {masks
            .flat()
            .map(
              (include, i) =>
                include && <small key={i}>each included loss weight 1/{result.boundaries} </small>,
            )}
        </div>
        <div>
          <span className="prm-bracket">mean per nonempty trajectory</span>
          <strong>
            sum of means ÷ {result.trajectories} trajectories = {f(result.trajectory)}
          </strong>
          {masks.map(
            (row, i) =>
              row.some(Boolean) && (
                <small key={i}>
                  trajectory {i}: each loss weight 1/({result.trajectories}×
                  {row.filter(Boolean).length}){' '}
                </small>
              ),
          )}
        </div>
      </div>
      <Controls>
        <button onClick={() => setMasks([[false], [false, false, false]])}>
          Mask every target
        </button>
        <button onClick={() => setMasks([[true], [true, true, true]])}>Reset losses</button>
      </Controls>
    </Figure>
  );
}

export function PRMStepLoss() {
  const [z, setZ] = useState(Math.log(4));
  const [target, setTarget] = useState(0);
  const [mask, setMask] = useState(false);
  const result = M.binary(z, target, !mask);
  const points = Array.from({ length: 81 }, (_, i) => {
    const x = -4 + i / 10;
    return `${55 + (x + 4) * 65},${255 - M.binary(x, target).loss * 48}`;
  }).join(' ');
  return (
    <Figure id="D08" title="A wrong confident label creates a large corrective gradient">
      <Masses names={['target 0 mass', 'target 1 mass']} values={[1 - result.p, result.p]} />
      <SVG
        height={310}
        label="Binary cross-entropy curve versus logit; selected loss and gradient descent direction"
      >
        <line x1={55} y1={255} x2={580} y2={255} stroke="#8793a9" />
        <line x1={55} y1={25} x2={55} y2={255} stroke="#8793a9" />
        <polyline points={points} fill="none" stroke={hues[1]} strokeWidth={3} />
        <circle
          cx={55 + (Math.max(-4, Math.min(4, z)) + 4) * 65}
          cy={Math.max(25, 255 - M.binary(z, target).loss * 48)}
          r={7}
          fill={mask ? '#8e98aa' : hues[2]}
        />
        {[-4, -2, 0, 2, 4].map((x) => (
          <text key={x} x={55 + (x + 4) * 65} y={276} textAnchor="middle">
            {x}
          </text>
        ))}
        {[0, 1, 2, 3, 4].map((y) => (
          <text key={y} x={42} y={259 - y * 48} textAnchor="end">
            {y}
          </text>
        ))}
        <text x={80} y={25}>
          loss (nats)
        </text>
        <text x={310} y={302}>
          logit z
        </text>
      </SVG>
      <Output>
        p={f(result.p)}; z={f(z)}; target c={target}; loss={f(result.loss)}; ∂L/∂z=
        {f(result.derivative)}.{' '}
        {mask
          ? 'No contribution or update from this boundary.'
          : result.derivative === 0
            ? 'No corrective logit gradient.'
            : result.derivative > 0
              ? 'Descent lowers z and p.'
              : 'Descent raises z and p.'}
      </Output>
      {(Math.abs(z) > 4 || !Number.isFinite(result.loss)) && (
        <p className="prm-note">
          The selected endpoint lies outside the plotted finite-logit window; its marker is clamped
          to that window's edge. The exact limiting loss and derivative are reported above.
        </p>
      )}
      <Controls>
        <Slider
          label="Progress probability p"
          value={result.p}
          onChange={(value) => setZ(Math.log(value / (1 - value)))}
          step={0.01}
        />
        <Select
          label="Target class"
          value={target}
          onChange={(value) => setTarget(Number(value))}
          options={[
            [0, '0'],
            [1, '1'],
          ]}
        />
        <Toggle label="Mask this target" value={mask} onChange={setMask} />
        <button
          onClick={() => {
            setZ(Math.log(4));
            setTarget(0);
            setMask(false);
          }}
        >
          Reset ln 4
        </button>
      </Controls>
    </Figure>
  );
}

export function PRMGradientRoutes() {
  const [frozen, setFrozen] = useState(false);
  return (
    <Figure
      id="D09"
      title="One later label can update earlier visible embeddings"
      note="Constructed averaging context map: h=(question+current)/2. These individual derivatives come from exact Torch autograd, not from the random Transformer's aggregate gradient norm."
    >
      <SVG
        height={310}
        label="Question and current embeddings average into h; the head sends dashed gradient routes backward"
      >
        {[
          ['question', '[0, 2]', 130],
          ['current', '[2, 2]', 480],
        ].map(([name, vector, x]) => (
          <g key={name}>
            <text x={x} y={25} textAnchor="middle">
              {name} embedding {vector}
            </text>
            <rect x={x - 65} y={40} width={130} height={38} fill={hues[3]} />
            <line x1={x} y1={80} x2={320} y2={125} stroke={hues[3]} strokeWidth={2} />
            {!frozen && (
              <path d={`M320 145 L${x} 90`} stroke={hues[4]} strokeDasharray="5 4" fill="none" />
            )}
            <text x={x} y={110} textAnchor="middle">
              {frozen ? 'frozen: no update' : 'gradient [.16,.12]'}
            </text>
          </g>
        ))}
        <rect x={250} y={125} width={140} height={40} fill={hues[1]} />
        <text x={320} y={150} fill="#101724" textAnchor="middle">
          h = [1,2]
        </text>
        <text x={405} y={150}>
          ∂L/∂h=[.32,.24]
        </text>
        <line x1={320} y1={165} x2={320} y2={205} stroke={hues[1]} />
        <line x1={340} y1={205} x2={340} y2={170} stroke={hues[4]} strokeDasharray="5 4" />
        <rect x={240} y={205} width={160} height={40} fill={hues[2]} />
        <text x={320} y={230} textAnchor="middle" fill="#101724">
          w = [.4,.3]
        </text>
        <text x={420} y={226}>
          ∂L/∂w=[.8,1.6]
        </text>
        <text x={30} y={275}>
          bias b=ln4−1; ∂L/∂b=.8
        </text>
        <text x={340} y={275}>
          z=ln4; target0; ∂L/∂z=.8
        </text>
      </SVG>
      <Output>
        Forward values and head gradients remain the same.{' '}
        {frozen
          ? 'Backbone parameters receive no update.'
          : 'Both visible input embedding vectors receive [.16,.12].'}
      </Output>
      <Controls>
        <Toggle label="Freeze contextual backbone" value={frozen} onChange={setFrozen} />
      </Controls>
    </Figure>
  );
}

export function PRMNeutralSimplex() {
  const [invalid, setInvalid] = useState(0.1);
  const [neutral, setNeutral] = useState(0.6);
  const progress = Math.max(0, 1 - invalid - neutral);
  const point = [
    320 * invalid + 80 * neutral + 560 * progress,
    35 * invalid + 265 * (neutral + progress),
  ];
  return (
    <Figure id="D10" title="Neutral keeps its own mass and target">
      <SVG
        height={305}
        label="Three-class probability simplex; point position is the weighted corner sum"
      >
        <path d="M320 35 L80 265 L560 265 Z" fill="none" stroke="#8190a8" strokeWidth={2} />
        <text x={320} y={23} textAnchor="middle" fill={hues[0]}>
          invalid (1,0,0)
        </text>
        <text x={80} y={290} fill={hues[1]}>
          neutral (0,1,0)
        </text>
        <text x={560} y={290} textAnchor="end" fill={hues[2]}>
          progress (0,0,1)
        </text>
        <line
          x1={point[0]}
          y1={point[1]}
          x2={point[0]}
          y2={265}
          stroke={hues[3]}
          strokeDasharray="4 4"
        />
        <circle cx={point[0]} cy={point[1]} r={8} fill="white" />
        <text
          x={point[1] < 65 ? point[0] + 70 : point[0]}
          y={point[1] < 65 ? point[1] + 5 : point[1] - 14}
          textAnchor={point[1] < 65 ? 'start' : 'middle'}
        >
          ({f(invalid)}, {f(neutral)}, {f(progress)})
        </text>
      </SVG>
      <Masses values={[invalid, neutral, progress]} />
      <Output>
        Acceptable = neutral + progress = {f(neutral + progress)}. Strict progress = {f(progress)}.
        For neutral target, logit gradient = [{f(invalid)}, {f(neutral - 1)}, {f(progress)}]; sum=0.
      </Output>
      <Controls>
        <Slider
          label="Invalid mass"
          value={invalid}
          onChange={(value) => {
            setInvalid(value);
            setNeutral((current) => Math.min(current, 1 - value));
          }}
        />
        <Slider
          label="Neutral mass"
          value={neutral}
          onChange={setNeutral}
          max={Number((1 - invalid).toFixed(2))}
          step={0.01}
        />
      </Controls>
    </Figure>
  );
}

export function PRMRealCorpusStructure() {
  const state = useEvidence();
  const [split, setSplit] = useState('train');
  if (!state.data)
    return (
      <Figure id="D11" title="Keep problems, trajectories and siblings nested">
        <Pending state={state} />
      </Figure>
    );
  const selected = state.data.extraction.selected[split];
  const example = state.data.examples[split][0];
  return (
    <Figure id="D11" title="Split by problem identity, not by alternative">
      <div className="prm-corpus-nest">
        <strong>Problem hash {example.problem_id.slice(0, 16)}…</strong>
        <div>
          <strong>Source trajectory {example.source.record}</strong>
          <div>
            <strong>Parent prefix: step {example.source.step}</strong>
            <p>{example.prefix_steps.length} earlier chosen steps</p>
            <div>
              <strong>Sibling alternative {example.source.alternative}</strong>
              <span>
                class {example.class_id}: {M.classes[example.class_id]}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="prm-current-text">Source alternative: {example.current_step}</p>
      <PRMTable
        caption="Actual fixed split counts"
        headers={['split', 'problems', 'alternatives', 'invalid / neutral / progress']}
        rows={Object.entries(state.data.extraction.selected).map(([name, row]) => [
          name,
          row.problems,
          row.examples,
          [0, 1, 2].map((i) => row.class_counts[i] || 0).join(' / '),
        ])}
      />
      <Output>
        {split}: {selected.problems} disjoint problem identities, {selected.examples} eligible
        alternatives. Cap 12 alternatives per problem after deduplication. Retained upstream file
        prefixes introduce prefix bias; these are not the complete PRM800K corpus.
      </Output>
      <Controls>
        <Select
          label="Actual split to inspect"
          value={split}
          onChange={setSplit}
          options={['train', 'validation', 'test']}
        />
      </Controls>
    </Figure>
  );
}

function useInspection(model, example, initial) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    setResult(null);
    if (model && example)
      M.inspect(model, example, initial).then((value) => {
        if (active) setResult(value);
      });
    return () => {
      active = false;
    };
  }, [model, example, initial]);
  return result;
}

export function PRMLearnedFeatureMap() {
  const state = useEvidence(true);
  const [initial, setInitial] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [index, setIndex] = useState(0);
  const source = state.model?.inspection.correct.example;
  const example = React.useMemo(
    () => (source ? { ...source, current_step: empty ? '' : source.current_step } : null),
    [source, empty],
  );
  const result = useInspection(state.model, example, initial);
  if (!state.data || !result)
    return (
      <Figure id="D12" title="Trace a real spelling into the learned weight array">
        <Pending state={state} />
      </Figure>
    );
  const trace = result.current.trace.length ? result.current.trace : result.prefix.trace;
  const item = trace[Math.min(index, trace.length - 1)];
  const offset = result.current.trace.length ? 512 : 0;
  const nonzero = result.x.map((value, row) => ({ value, row })).filter((item) => item.value !== 0);
  const selectedRows = [
    item.bucket + offset,
    ...nonzero
      .filter((row) => row.row !== item.bucket + offset)
      .slice(0, 7)
      .map((row) => row.row),
  ];
  return (
    <Figure
      id="D12"
      title="All 1,024 coordinates contribute; the drawn subset is labelled"
      note="Actual held-out input and actual stored weights. Local roles: supplied feature cyan, learned weights amber, computed logits violet. Initial/final switches fixed stored arrays; it does not train in the browser."
    >
      <div className="prm-hash-anatomy">
        <code>{item.word}</code>
        <span>
          SHA256 <code>{item.digest.slice(0, 18)}…</code>
        </span>
        <span>
          bucket {item.bucket}; sign {item.sign > 0 ? '+1' : '−1'}
        </span>
        <strong>
          {offset ? 'current half +512' : 'prefix half +0'} → row {item.bucket + offset}
        </strong>
      </div>
      <PRMTable
        caption={`Sparse view: ${selectedRows.length} rows shown; ${nonzero.length} nonzero of 1,024 total`}
        headers={['row', 'x[row]', 'W invalid', 'W neutral', 'W progress']}
        rows={selectedRows.map((row) => [
          <span className={row === item.bucket + offset ? 'prm-selected' : ''}>{row}</span>,
          <span style={{ color: hues[3] }}>{f(result.x[row])}</span>,
          ...result.weights[row].map((value) => <span style={{ color: hues[2] }}>{f(value)}</span>),
        ])}
      />
      <p>
        {nonzero.length - selectedRows.filter((row) => result.x[row] !== 0).length} additional
        nonzero rows omitted from this drawing; computation uses every row.
      </p>
      <div className="prm-weight-product">
        <code>z = xW + b</code>
        <span>z = [{result.logits.map((value) => f(value)).join(', ')}]</span>
      </div>
      <Masses values={result.probabilities} />
      <Output>
        {empty
          ? 'Empty current step: current half is zero; prefix features remain.'
          : 'Current text uses signed counts divided by √(lexeme count).'}{' '}
        Order loss: “a b” and “b a” have the same feature vector. Collision: “
        {state.data.collision.words[0]}” and “{state.data.collision.words[1]}” both map to bucket{' '}
        {state.data.collision.bucket}, sign {state.data.collision.sign}, so their single-lexeme
        vectors are identical.
      </Output>
      <Controls>
        <Toggle label="Use stored initial weights" value={initial} onChange={setInitial} />
        <Toggle label="Empty current step" value={empty} onChange={setEmpty} />
        <Slider
          label="Spelling to trace"
          value={Math.min(index, trace.length - 1)}
          onChange={setIndex}
          max={Math.max(0, trace.length - 1)}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function PRMStudyResults() {
  const state = useEvidence();
  const [split, setSplit] = useState('test');
  if (!state.data)
    return (
      <Figure id="D13" title="Read the measured study, including its weak results">
        <Pending state={state} />
      </Figure>
    );
  const study = state.data.study;
  const checkpoints = study.checkpoints;
  const final = checkpoints.at(-1).metrics[split];
  const prior = study.baseline[split];
  const max =
    Math.max(
      ...checkpoints.map((point) => point.metrics[split].cross_entropy),
      prior.cross_entropy,
    ) * 1.1;
  const point = (x, y) => [65 + (x / 160) * 505, 260 - (y / max) * 220];
  return (
    <Figure id="D13" title="Improvement on training data does not establish held-out improvement">
      <SVG
        height={315}
        label={`${split} cross-entropy at five measured checkpoints; prior comparison`}
      >
        <line x1={65} y1={40} x2={65} y2={260} stroke="#8d99ad" />
        <line x1={65} y1={260} x2={585} y2={260} stroke="#8d99ad" />
        {[0, 0.5, 1].map(
          (y) =>
            y <= max && (
              <g key={y}>
                <text x={54} y={point(0, y)[1] + 5} textAnchor="end">
                  {y}
                </text>
                <line
                  x1={65}
                  y1={point(0, y)[1]}
                  x2={570}
                  y2={point(0, y)[1]}
                  stroke="#485267"
                  opacity={0.5}
                />
              </g>
            ),
        )}
        <line
          x1={65}
          y1={point(0, prior.cross_entropy)[1]}
          x2={570}
          y2={point(0, prior.cross_entropy)[1]}
          stroke={hues[2]}
          strokeDasharray="5 5"
        />
        <polyline
          points={checkpoints
            .map((checkpoint) =>
              point(checkpoint.update, checkpoint.metrics[split].cross_entropy).join(','),
            )
            .join(' ')}
          stroke={hues[0]}
          strokeWidth={3}
          fill="none"
        />
        {checkpoints.map((checkpoint) => (
          <g key={checkpoint.update}>
            <circle
              cx={point(checkpoint.update, checkpoint.metrics[split].cross_entropy)[0]}
              cy={point(checkpoint.update, checkpoint.metrics[split].cross_entropy)[1]}
              r={5}
              fill={hues[0]}
            />
            <text x={point(checkpoint.update, 0)[0]} y={283} textAnchor="middle">
              {checkpoint.update}
            </text>
          </g>
        ))}
        <text x={70} y={25}>
          cross-entropy (nats per eligible alternative)
        </text>
        <text x={305} y={48} fill={hues[0]}>
          measured model
        </text>
        <text x={475} y={48} fill={hues[2]}>
          fixed prior
        </text>
        <text x={250} y={307}>
          SGD update
        </text>
      </SVG>
      <PRMTable
        caption={`${split}: final raw confusion counts, true rows / predicted columns`}
        headers={['true ↓ / predicted →', ...M.classes]}
        rows={final.confusion.map((row, i) => [M.classes[i], ...row])}
      />
      <PRMTable
        caption="Different metric units"
        headers={['metric', 'final', 'class-prior baseline']}
        rows={['accuracy', 'cross_entropy', 'brier'].map((metric) => [
          metric,
          f(final[metric], 8),
          f(prior[metric], 8),
        ])}
      />
      <Output>
        Fixed 160-update fit, seed 23. Final test CE and Brier are worse than the prior baseline;
        neutral recall is 0/72. Lines connect measured points only.
      </Output>
      <Controls>
        <Select
          label="Measured split"
          value={split}
          onChange={setSplit}
          options={['train', 'validation', 'test']}
        />
      </Controls>
    </Figure>
  );
}

export function PRMHeldoutInspector() {
  const state = useEvidence(true);
  const [kind, setKind] = useState('correct');
  const [edited, setEdited] = useState(null);
  const original = state.model?.inspection[kind].example;
  const example = React.useMemo(
    () =>
      original
        ? { ...original, current_step: edited === null ? original.current_step : edited }
        : null,
    [original, edited],
  );
  const result = useInspection(state.model, example, false);
  return (
    <Figure id="D14" title="Inspect a true held-out success and failure with the same fixed scorer">
      {!state.data || !result ? (
        <Pending state={state} />
      ) : (
        <>
          <div className="prm-inspection-text">
            <b>
              upstream test: record {original.source.record}, step {original.source.step},
              alternative {original.source.alternative}
            </b>
            <p>{original.question}</p>
            <p>Complete earlier chosen prefix ({original.prefix_steps.length} steps):</p>
            {original.prefix_steps.length ? (
              <ol>
                {original.prefix_steps.map((text, i) => (
                  <li key={i} value={i + 1}>
                    <span>step {i}: </span>
                    {text}
                  </li>
                ))}
              </ol>
            ) : (
              <p>∅ Empty earlier prefix; this is the first step.</p>
            )}
            <p className="prm-current-text">{example.current_step || '∅ empty current text'}</p>
          </div>
          <Masses values={result.probabilities} />
          <Output>
            Predicted: {M.classes[result.probabilities.indexOf(Math.max(...result.probabilities))]}.{' '}
            {edited === null
              ? 'Source annotation'
              : 'Original-source annotation; not a new label for your edit'}
            : {M.classes[original.class_id]}.
          </Output>
          <Controls>
            <Select
              label="Actual held-out case"
              value={kind}
              onChange={(value) => {
                setKind(value);
                setEdited(null);
              }}
              options={['correct', 'failure']}
            />
            <label>
              Current step text
              <textarea
                value={example.current_step}
                onChange={(event) => setEdited(event.target.value)}
              />
            </label>
            <button onClick={() => setEdited('')}>Empty current step</button>
            <button onClick={() => setEdited(original.current_step + ' ' + original.current_step)}>
              Repeat current step
            </button>
            <button onClick={() => setEdited(null)}>Reset original text</button>
          </Controls>
        </>
      )}
    </Figure>
  );
}

const methods = [
  ['minimum', 'minimum'],
  ['mean', 'mean'],
  ['product', 'product'],
  ['log_product', 'sum of log probabilities'],
];
export function PRMAggregationGeometry() {
  const [method, setMethod] = useState('product');
  const [repeat, setRepeat] = useState(false);
  const [zero, setZero] = useState(false);
  const [empty, setEmpty] = useState(false);
  const paths = empty ? [[], []] : [[0.9, zero ? 0 : 0.9], Array(repeat ? 6 : 5).fill(0.95)];
  const scores = paths.map((path) => M.aggregate(path, method));
  return (
    <Figure
      id="D15"
      title="The reduction changes what length and weak steps mean"
      note="These are assigned fixture scores. Product is a heuristic unless the factors are valid conditional probabilities for the claimed joint event."
    >
      {paths.map((path, i) => (
        <div key={i} className="prm-probability-path" style={{ '--identity': hues[i] }}>
          <b>path {i ? 'B' : 'A'}</b>
          {path.length ? (
            path.map((p, j) => (
              <div key={j}>
                <span>step {j}</span>
                <strong>{p}</strong>
                <div className="prm-product-track">
                  <span
                    style={{ width: `${path.slice(0, j + 1).reduce((a, b) => a * b, 1) * 100}%` }}
                  />
                </div>
                <small>prefix product {f(M.aggregate(path.slice(0, j + 1)))}</small>
                <small>log contribution {f(Math.log(p))}</small>
              </div>
            ))
          ) : (
            <span className="prm-unknown">empty path</span>
          )}
        </div>
      ))}
      <Output>
        {method}: A={f(scores[0])}, B={f(scores[1])}; order{' '}
        {scores[0] === null
          ? 'unknown'
          : scores[0] === scores[1]
            ? 'tie'
            : scores[0] > scores[1]
              ? 'A above B'
              : 'B above A'}
        .
      </Output>
      <Controls>
        <Select
          label="Trajectory reduction"
          value={method}
          onChange={setMethod}
          options={methods}
        />
        <Toggle label="Repeat one B step" value={repeat} onChange={setRepeat} />
        <Toggle label="Set A's second probability to zero" value={zero} onChange={setZero} />
        <Toggle label="Empty both paths" value={empty} onChange={setEmpty} />
      </Controls>
    </Figure>
  );
}

export function PRMCandidateForest() {
  const [count, setCount] = useState(6);
  const [method, setMethod] = useState('product');
  const result = M.rankPool(count, method);
  return (
    <Figure id="D16" title="Rank paths and add answer masses as separate decisions">
      <div className="prm-candidate-forest">
        {result.ordered.map((item) => (
          <div
            key={item.id}
            className={result.selected.id === item.id ? 'prm-selected' : ''}
            style={{ '--identity': hues[item.index] }}
          >
            <b>
              {item.id}: rank {result.ordered.indexOf(item) + 1}
            </b>
            <ol>
              {item.steps.map((step, i) => (
                <li key={i}>
                  <code>{step}</code>
                  <small>assigned p={item.scores[i]}</small>
                </li>
              ))}
            </ol>
            <div className="prm-terminal">
              answer {item.answer}
              <strong>{known(item.correct)}</strong>
            </div>
            <output>
              {method} score {f(item.score)}
            </output>
          </div>
        ))}
      </div>
      {!count && <p className="prm-unknown">No candidates are available.</p>}
      <PRMTable
        caption={
          method === 'log_product'
            ? 'Answer votes: relative product mass exp(log score − common max)'
            : `Answer votes: summed ${method} weights`
        }
        headers={['normalized fixture answer', 'mass']}
        rows={result.answerWeights.map(([answer, mass]) => [answer, f(mass)])}
      />
      <Output>
        Requested {count}; scored {result.scored} actual candidates. Selected path{' '}
        {result.selected?.id || 'unknown'}; weighted-vote answer {result.weightedVote || 'unknown'};
        oracle any correct {result.oracle === null ? 'unknown' : String(result.oracle)}.
      </Output>
      <Controls>
        <Slider
          label="Requested fixed-pool candidates"
          value={count}
          onChange={setCount}
          max={9}
          step={1}
        />
        <Select label="Ranking coordinate" value={method} onChange={setMethod} options={methods} />
      </Controls>
    </Figure>
  );
}

export function PRMEvaluationDenominators() {
  const [threshold, setThreshold] = useState(0.5);
  const [group, setGroup] = useState('both');
  const all = [[0.2, 0.9], [0.9, 0.2], [0.9, 0.9, 0.2], [0.9, 0.9, 0.9, 0.9], [0.9], [0.9], [0.2]];
  const targets = [0, 1, 2, 3, -1, -1, -1];
  const indices = targets
    .map((target, i) => i)
    .filter((i) => group === 'both' || (group === 'errors' ? targets[i] >= 0 : targets[i] === -1));
  const predicted = indices.map((i) => M.firstError(all[i], threshold));
  const result = M.localization(
    predicted,
    indices.map((i) => targets[i]),
  );
  return (
    <Figure id="D17" title="Trace each denominator back to its cases">
      <PRMTable
        caption="Seven constructed earliest-error cases; −1 means no error"
        headers={['case', 'assigned step masses', 'target index', 'predicted index', 'exact match']}
        rows={indices.map((i, j) => [
          i,
          all[i].join(', '),
          targets[i],
          predicted[j],
          known(targets[i] === predicted[j]),
        ])}
      />
      <div className="prm-reduction-pools">
        <div>
          <span className="prm-bracket">error-bearing cases ({result.errors})</span>
          <strong>accuracy {f(result.a)}</strong>
        </div>
        <div>
          <span className="prm-bracket">all-correct cases ({result.correct})</span>
          <strong>accuracy {f(result.b)}</strong>
        </div>
      </div>
      <Output>
        H = harmonic mean of the two group accuracies = {f(result.h)}. Default: 3/4 and 2/3 → 12/17.
        This is the reported ProcessBench convention, not precision/recall F₁. These cases provide
        earliest-error labels; no terminal-answer label has been invented.
      </Output>
      <Controls>
        <Slider label="Error threshold" value={threshold} onChange={setThreshold} step={0.1} />
        <Select
          label="Available reference groups"
          value={group}
          onChange={setGroup}
          options={[
            ['both', 'both groups'],
            ['errors', 'error-bearing only'],
            ['correct', 'all-correct only'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMCoverageAndAbstention() {
  const [threshold, setThreshold] = useState(0.5);
  const cases = [
    [0.95, true],
    [0.8, false],
    [0.7, true],
    [0.45, false],
    [0.2, true],
  ];
  const accepted = cases.filter(([p]) => p >= threshold);
  const accuracy = accepted.length ? accepted.filter(([, c]) => c).length / accepted.length : null;
  return (
    <Figure
      id="D18"
      title="Rejecting every case makes conditional accuracy undefined"
      note="Fixed labelled illustration; threshold editing here is not benchmark tuning."
    >
      <div className="prm-confidence-line">
        {cases.map(([p, correct], i) => (
          <div key={i} className={p >= threshold ? 'prm-selected' : 'prm-excluded'}>
            <b>case {i}</b>
            <strong>{p}</strong>
            <span>{known(correct)}</span>
            <small>{p >= threshold ? 'accepted' : 'abstained'}</small>
          </div>
        ))}
      </div>
      <Output>
        Accepted {accepted.length}/5; coverage {f(accepted.length / 5)}. Correct accepted{' '}
        {accepted.filter(([, correct]) => correct).length}; conditional accuracy {f(accuracy)}.
      </Output>
      <Controls>
        <Slider label="Acceptance threshold" value={threshold} onChange={setThreshold} />
      </Controls>
    </Figure>
  );
}

export function PRMCompletionTree() {
  const [budget, setBudget] = useState(8);
  const [fixture, setFixture] = useState('default');
  const texts = [
    'x=2',
    'x=1',
    fixture === 'failure' ? 'x=5' : 'x=3',
    'x=4',
    'x=−3',
    'x=3.5',
    'repeat 2x=6',
    'x=0',
  ];
  // The checker requires a terminal x=value assertion and substitution into 2(x+1)=8.
  // Repeating a premise is not a terminal answer, even though its equation is valid.
  const outcomes = texts.map((text) => {
    const answer = text.replace('−', '-').match(/^x=(-?\d+(?:\.\d+)?)$/);
    return Number(Boolean(answer && 2 * (Number(answer[1]) + 1) === 8));
  });
  const successes = outcomes.slice(0, budget).reduce((a, b) => a + b, 0);
  return (
    <Figure
      id="D19"
      title="A continuation checker estimates what this completer can finish"
      note="Constructed fixed continuations, not language-model samples. A repaired answer after a wrong prefix does not certify that prefix as valid."
    >
      <div className="prm-completion-prefix">
        <span>Original question: solve 2(x+1)=8. Checker: terminal x=value, then substitute.</span>
        <code>{fixture === 'repair' ? 'wrong prefix: 2x+1=8' : 'valid prefix: 2x=6'}</code>
        <strong>completer μ</strong>
      </div>
      <SVG
        width={720}
        height={215}
        label="One supplied prefix fans into a fixed sequence of eight continuation leaves"
      >
        <circle cx={360} cy={25} r={9} fill={hues[3]} />
        {texts.map((text, i) => (
          <g
            key={text}
            opacity={i < budget ? 1 : 0.3}
            data-continuation-text={text}
            data-checker-reward={outcomes[i]}
          >
            <line x1={360} y1={34} x2={45 + i * 90} y2={115} stroke={hues[i % hues.length]} />
            <circle cx={45 + i * 90} cy={115} r={8} fill={hues[i % hues.length]} />
            <text x={45 + i * 90} y={143} textAnchor="middle">
              leaf {i}
            </text>
            <text x={45 + i * 90} y={165} textAnchor="middle">
              {text}
            </text>
            <text x={45 + i * 90} y={190} textAnchor="middle">
              {i < budget ? `${outcomes[i] ? '✓' : '×'} R=${outcomes[i]}` : 'not drawn'}
            </text>
          </g>
        ))}
      </SVG>
      <Output>
        {budget} completion draws, {successes} successes. HE=
        {budget ? Number(successes > 0) : 'unknown'}; SE=
        {budget ? f(successes / budget) : 'unknown'}. The supplied prefix remains present at K=0.
      </Output>
      <Controls>
        <Slider label="Completion budget K" value={budget} onChange={setBudget} max={8} step={1} />
        <Select
          label="Declared fixture"
          value={fixture}
          onChange={setFixture}
          options={[
            ['default', 'valid prefix, one successful continuation'],
            ['repair', 'wrong prefix, checker accepts a repaired assertion'],
            ['failure', 'valid prefix, no successful continuation'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMEstimatorSampling() {
  const [value, setValue] = useState(0.1);
  const [budget, setBudget] = useState(8);
  const [count, setCount] = useState(1);
  const result = M.binomial(value, budget);
  const selected = Math.min(count, budget);
  return (
    <Figure
      id="D20"
      title="Hard and soft estimators have different sampling behaviour"
      note="Exact hypothetical independent Bernoulli draws with declared V; these probabilities are not measured language outcomes."
    >
      <SVG height={300} label="Binomial probability masses by number of successes">
        <line x1={50} y1={250} x2={595} y2={250} stroke="#9ba5b7" />
        <line x1={50} y1={30} x2={50} y2={250} stroke="#9ba5b7" />
        {[0, 0.5, 1].map((y) => (
          <text key={y} x={39} y={255 - y * 210} textAnchor="end">
            {y}
          </text>
        ))}
        {result.distribution.map((p, k) => (
          <g key={k}>
            <rect
              x={65 + (k * 520) / (budget + 1)}
              y={250 - p * 210}
              width={Math.min(42, 420 / (budget + 1))}
              height={Math.max(1, p * 210)}
              fill={hues[1]}
              stroke={k === selected ? 'white' : 'none'}
              strokeWidth={3}
            />
            <text x={75 + (k * 520) / (budget + 1)} y={274} textAnchor="middle">
              {k}
            </text>
          </g>
        ))}
        <text x={70} y={25}>
          Pr(success count=k)
        </text>
        <text x={265} y={296}>
          success count k
        </text>
      </SVG>
      <Output>
        Pr(HE=1)={f(result.hard, 8)}; E[SE]={f(result.mean)}; Var(SE)={f(result.variance, 8)}.
        Selected k={selected}: likelihood {f(result.distribution[selected], 8)}, SE=
        {budget ? f(selected / budget) : 'unknown'}.
      </Output>
      <Controls>
        <Slider
          label="Declared per-draw success value V"
          value={value}
          onChange={setValue}
          step={0.01}
        />
        <Slider
          label="Independent draw budget K"
          value={budget}
          onChange={setBudget}
          max={16}
          step={1}
        />
        <Slider
          label="Success count k to inspect"
          value={selected}
          onChange={setCount}
          max={budget}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function PRMConsensusAddresses() {
  const [judge, setJudge] = useState(2);
  const rollout = [0, 1, -1, null, 2];
  const judges = [0, judge, -1, 2, null];
  const retained = rollout.map(
    (value, i) => value !== null && judges[i] !== null && value === judges[i],
  );
  return (
    <Figure id="D21" title="Agreement filters exact trajectory addresses, not truth">
      <PRMTable
        caption="−1 means no first error; unknown stays unknown"
        headers={['trajectory address', 'rollout first error', 'judge first error', 'filter state']}
        rows={rollout.map((value, i) => [
          `trajectory ${i}`,
          value === null ? 'unknown' : value,
          judges[i] === null ? 'unknown' : judges[i],
          value === null || judges[i] === null ? 'unknown' : retained[i] ? 'retained' : 'disagrees',
        ])}
      />
      <Output>
        Intersection retains {retained.filter(Boolean).length}/5 trajectories: [
        {retained.flatMap((value, i) => (value ? [i] : [])).join(', ')}]. Two estimators can share
        an error; agreement does not supply new label truth.
      </Output>
      <Controls>
        <Select
          label="Judge earliest-error estimate for trajectory 1"
          value={judge}
          onChange={(value) => setJudge(Number(value))}
          options={[
            [2, '2 (disagrees)'],
            [1, '1 (agrees)'],
            [-1, '−1 (no error)'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function FiniteTree({
  selected = [],
  pruned = [],
  unreachable = [],
  expanded = [],
  rollout = [],
  backup = [],
  values = null,
  expansionLabel = 'expanded',
}) {
  const backupMarker = 'prm-backup-' + useId().replace(/:/g, '');
  // Circle columns remain independent of their right-hand text columns.
  // Orthogonal edges use the clear inter-level lanes below each complete label group.
  const nodes = M.finiteNodes.map((node) => ({
    ...node,
    y: node.parent === null ? 35 : node.id.length === 1 ? 195 : 355,
  }));
  return (
    <SVG
      width={750}
      height={480}
      label="Actual finite ancestry: root branches A/B; each has two leaves; edges meet fixed node centres"
    >
      <defs>
        <marker
          id={backupMarker}
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={hues[4]} />
        </marker>
      </defs>
      {nodes
        .filter((node) => node.parent)
        .map((node) => {
          const parent = nodes.find((item) => item.id === node.parent);
          return (
            <path
              key={node.id}
              d={`M${parent.x},${parent.y + 13} V${parent.y + 100} H${node.x} V${node.y - 13}`}
              fill="none"
              stroke={
                selected.includes(node.id) ? 'white' : node.id.startsWith('A') ? hues[0] : hues[1]
              }
              strokeWidth={selected.includes(node.id) ? 3 : 1.5}
              strokeDasharray={
                rollout.includes(node.id)
                  ? '6 4'
                  : pruned.includes(node.id) || unreachable.includes(node.id)
                    ? '2 4'
                    : undefined
              }
              opacity={pruned.includes(node.id) || unreachable.includes(node.id) ? 0.4 : 1}
            />
          );
        })}
      {nodes
        .filter((node) => node.parent && backup.includes(node.id))
        .map((node) => {
          const parent = nodes.find((item) => item.id === node.parent);
          return (
            <path
              key={'backup-' + node.id}
              d={`M${node.x - 18},${node.y - 15} V${parent.y + 110} H${parent.x - 18} V${parent.y + 15}`}
              fill="none"
              stroke={hues[4]}
              strokeWidth={2}
              strokeDasharray="3 3"
              markerEnd={`url(#${backupMarker})`}
            />
          );
        })}
      {nodes.map((node) => (
        <g
          key={node.id}
          opacity={pruned.includes(node.id) || unreachable.includes(node.id) ? 0.5 : 1}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={13}
            fill={node.id.startsWith('A') ? hues[0] : node.id.startsWith('B') ? hues[1] : hues[3]}
            stroke={selected.includes(node.id) ? 'white' : 'none'}
            strokeWidth={3}
          />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#101724">
            {node.id}
          </text>
          <text x={node.x + 24} y={node.y - 14}>
            {node.text}
          </text>
          <text x={node.x + 24} y={node.y + 8}>
            {values ? values[node.id] || 'n=0, W=0' : `p=${node.local}; V=${node.value}`}
          </text>
          <text x={node.x + 24} y={node.y + 30}>
            {pruned.includes(node.id) ? (
              'pruned'
            ) : unreachable.includes(node.id) ? (
              'not reached'
            ) : rollout.includes(node.id) ? (
              'rollout only'
            ) : expanded.includes(node.id) ? (
              expansionLabel === 'generated / scored' ? (
                <>
                  <tspan x={node.x + 24}>generated</tspan>
                  <tspan x={node.x + 24} dy={22}>
                    / scored
                  </tspan>
                </>
              ) : (
                expansionLabel
              )
            ) : node.reward !== undefined ? (
              `checker R=${node.reward}`
            ) : (
              'supplied prefix'
            )}
          </text>
        </g>
      ))}
      <text x={375} y={439} textAnchor="middle">
        {values
          ? 'White: selection · dashed: rollout only'
          : 'Dim dashed branches: pruned or not reached'}
      </text>
      {values && (
        <text x={375} y={465} textAnchor="middle" fill={hues[4]}>
          Rose arrows return reward to selected ancestors only
        </text>
      )}
    </SVG>
  );
}

export function PRMBeamTree() {
  const [width, setWidth] = useState(1);
  const [depth, setDepth] = useState(2);
  const [family, setFamily] = useState('product');
  const result = M.beam(width, depth, family);
  const pruned = result.layers.flatMap((layer) => layer.pruned);
  const scored = result.layers.flatMap((layer) => layer.scored);
  const unreachable = M.finiteNodes
    .filter((node) => node.parent && !scored.includes(node.id))
    .map((node) => node.id);
  return (
    <Figure id="D22" title="Pruning a parent removes access to its descendants">
      <FiniteTree
        selected={result.selected?.path || []}
        pruned={pruned}
        unreachable={unreachable}
        expanded={scored}
        expansionLabel="generated / scored"
      />
      <Output>
        Scored {result.scored} new nodes; selected {result.selected?.node.id || 'unknown'}; score{' '}
        {f(result.selected?.score)}; checker reward {f(result.selected?.node.reward)}. Pruned [
        {pruned.join(', ')}]; not reached [{unreachable.join(', ')}].
      </Output>
      <Controls>
        <Slider label="Beam width" value={width} onChange={setWidth} min={1} max={2} step={1} />
        <Slider label="Expansion depth budget" value={depth} onChange={setDepth} max={2} step={1} />
        <Select
          label="Scoring target"
          value={family}
          onChange={setFamily}
          options={[
            ['product', 'product of local scores'],
            ['value', 'declared completion value'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMVisitTree() {
  const state = useEvidence();
  const [budget, setBudget] = useState(8);
  const [step, setStep] = useState(8);
  if (!state.data)
    return (
      <Figure id="D23" title="Replay actual generic UCT visits and backups">
        <Pending state={state} />
      </Figure>
    );
  const run = state.data.uct[budget];
  const selectedStep = Math.min(step, budget);
  const trace = selectedStep ? run.traces[selectedStep - 1] : null;
  const visits = trace?.visits_after || {};
  const returns = trace?.return_sums_after || {};
  const expanded = [
    ...new Set(run.traces.slice(0, selectedStep).map((item) => item.selection_path.at(-1))),
  ].filter((id) => M.finiteNodes.find((node) => node.id === id).reward === undefined);
  const values = Object.fromEntries(
    M.finiteNodes.map((node) => [node.id, `n=${visits[node.id] || 0}, W=${returns[node.id] || 0}`]),
  );
  const rows = M.finiteNodes
    .filter((node) => node.parent)
    .map((node) => {
      const n = visits[node.id] || 0;
      const parentN = visits[node.parent] || 0;
      return [
        node.id,
        n,
        returns[node.id] || 0,
        !n
          ? 'unvisited first'
          : parentN
            ? f((returns[node.id] || 0) / n + run.exploration * Math.sqrt(Math.log(parentN) / n))
            : 'unknown',
      ];
    });
  return (
    <Figure
      id="D23"
      title="Selection, rollout-only edges and backup are different paths"
      note="Actual deterministic Python generic UCT, seed 19 and c=√2. This is not the complete ReST-MCTS* algorithm."
    >
      <FiniteTree
        selected={trace?.selection_path || []}
        rollout={trace?.rollout || []}
        backup={trace?.selection_path || []}
        expanded={expanded}
        values={values}
      />
      <PRMTable
        caption="Post-backup counts and next selection priorities"
        headers={['child', 'visits n', 'return sum W', 'UCT priority']}
        rows={rows}
      />
      <Output>
        Simulation {selectedStep}/{budget}. Selected path [
        {trace?.selection_path.join(', ') || 'none'}]; rollout-only [
        {trace?.rollout.join(', ') || 'none'}]; checker reward {f(trace?.reward)}. Every selected
        ancestor receives the backup. Final root child {run.selected_root_child || 'unknown'};
        neural weight updates 0.
      </Output>
      <Controls>
        <Slider
          label="Executed simulation budget"
          value={budget}
          onChange={(value) => {
            setBudget(value);
            setStep(value);
          }}
          max={16}
          step={1}
        />
        <Slider
          label="Recorded simulation to inspect"
          value={selectedStep}
          onChange={setStep}
          max={budget}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function PRMValueAdvantageGeometry() {
  const [alpha, setAlpha] = useState(1);
  const branches = [
    ['A', [0.75, 0.85], 0.8],
    ['B', [0.4, 0], 0.2],
  ];
  return (
    <Figure
      id="D24"
      title="A high absolute value can coexist with negative progress"
      note="Fixed completer μ. Both parent values are computed from their children at probabilities .5/.5; they cannot be independently edited."
    >
      <div className="prm-value-branches">
        {branches.map(([name, children, parent], i) => (
          <div key={name} style={{ '--identity': hues[i] }}>
            <b>branch {name}</b>
            <SVG
              width={300}
              height={190}
              label={`Branch ${name} parent is the mean of two child values`}
            >
              <circle cx={150} cy={35} r={8} fill={hues[i]} />
              <text x={150} y={20} textAnchor="middle">
                parent V={parent}
              </text>
              {children.map((value, j) => (
                <g key={j}>
                  <line x1={150} y1={43} x2={70 + j * 160} y2={105} stroke={hues[i]} />
                  <text x={95 + j * 115} y={77} textAnchor="middle">
                    μ=.5
                  </text>
                  <circle
                    cx={70 + j * 160}
                    cy={105}
                    r={8}
                    fill={hues[i]}
                    stroke={j === 0 ? 'white' : 'none'}
                    strokeWidth={3}
                  />
                  <text x={70 + j * 160} y={132} textAnchor="middle">
                    V={value}
                  </text>
                  <text x={70 + j * 160} y={157} textAnchor="middle">
                    {j ? 'supporting child' : 'selected child'}
                  </text>
                </g>
              ))}
            </SVG>
            <div className="prm-signed-axis">
              <span>−.2</span>
              <span className="prm-zero">0</span>
              <span>+.2</span>
              <i style={{ left: `${50 + ((children[0] - parent) / 0.4) * 100}%` }} />
            </div>
            <p>
              Advantage {f(children[0] - parent)}; V + αA ={' '}
              {f(children[0] + alpha * (children[0] - parent))}
            </p>
          </div>
        ))}
      </div>
      <Output>
        A=.75−.05α; B=.4+.2α. Exact crossover α=1.4. At α={f(alpha)},{' '}
        {alpha === 1.4 ? 'tie' : alpha < 1.4 ? 'A ranks higher' : 'B ranks higher'}.
      </Output>
      <Controls>
        <Slider
          label="Advantage coefficient α"
          value={alpha}
          onChange={setAlpha}
          max={2}
          step={0.1}
        />
      </Controls>
    </Figure>
  );
}

export function PRMProverContrast() {
  const [k, setK] = useState(4);
  const [first, setFirst] = useState(0.75);
  const [second, setSecond] = useState(0.85);
  const transform = (q) => (k ? 1 - (1 - q) ** k : null);
  return (
    <Figure
      id="D25"
      title="Oracle best-of-K improves values while changing their contrast"
      note="Declared independent draws and an oracle selecting any successful outcome. Learned selection is not guaranteed to achieve this transform; prover μ and generator π have separate budgets."
    >
      <div className="prm-oracle-masses">
        {[first, second].map((q, i) => (
          <div key={i}>
            <b>prefix {i ? 'B' : 'A'}</b>
            <Masses names={['per-draw failure', 'per-draw success']} values={[1 - q, q]} />
            <div className="prm-draw-dots">
              {Array.from({ length: k }, (_, j) => (
                <span key={j}>draw {j + 1}</span>
              ))}
            </div>
            <p>
              Oracle success 1−(1−{f(q)})^{k} = {f(transform(q))}
            </p>
          </div>
        ))}
      </div>
      <Output>
        Per-draw contrast {f(second - first)}; oracle contrast{' '}
        {k ? f(transform(second) - transform(first)) : 'unknown: no attempted outcome'}. K=1
        preserves the original values; near-one values saturate.
      </Output>
      <Controls>
        <Slider label="Oracle independent draws K" value={k} onChange={setK} max={16} step={1} />
        <Slider
          label="A per-draw success probability"
          value={first}
          onChange={setFirst}
          step={0.01}
        />
        <Slider
          label="B per-draw success probability"
          value={second}
          onChange={setSecond}
          step={0.01}
        />
      </Controls>
    </Figure>
  );
}

export function PRMPolicyCredit() {
  const [q, setQ] = useState(0.6);
  const [a, setA] = useState(0.8);
  const [b, setB] = useState(0.2);
  const [baseline, setBaseline] = useState(false);
  const [selected, setSelected] = useState(0);
  const result = M.policy(q, a, b, baseline);
  const leaf = result.leaves[selected];
  return (
    <Figure id="D26" title="A shared terminal return multiplies distinct action derivatives">
      <SVG height={300} label="Complete four-leaf policy with branch and success probabilities">
        <circle cx={320} cy={25} r={8} fill={hues[3]} />
        {['A', 'B'].map((branch, i) => (
          <g key={branch}>
            <path d={`M320,33 V60 H${160 + i * 320} V92`} fill="none" stroke={hues[i]} />
            <circle cx={160 + i * 320} cy={100} r={8} fill={hues[i]} />
            <text x={180 + i * 320} y={104}>
              π({branch})={f(i ? 1 - q : q)}
            </text>
          </g>
        ))}
        {result.leaves.map((item, i) => (
          <g key={i}>
            <path
              d={`M${i < 2 ? 160 : 480},108 V145 H${80 + i * 160} V186`}
              fill="none"
              stroke={hues[i < 2 ? 0 : 1]}
              strokeWidth={selected === i ? 3 : 1}
            />
            <circle
              cx={80 + i * 160}
              cy={195}
              r={9}
              fill={hues[i < 2 ? 0 : 1]}
              stroke={selected === i ? 'white' : 'none'}
              strokeWidth={3}
            />
            <text x={80 + i * 160} y={250} textAnchor="middle">
              {item.branch}
              {item.success ? '✓' : '×'}: R={item.success}
            </text>
            <text x={80 + i * 160} y={225} textAnchor="middle">
              conditional p={f(item.success ? (i < 2 ? a : b) : 1 - (i < 2 ? a : b))}
            </text>
            <text x={80 + i * 160} y={275} textAnchor="middle">
              mass {f(item.mass)}
            </text>
          </g>
        ))}
      </SVG>
      <PRMTable
        caption="Selected sample versus exact all-leaf expectation"
        headers={['quantity', 'root logit', 'A logit', 'B logit']}
        rows={[
          ['sample score ∂logπ', ...leaf.score.map((value) => f(value))],
          ['sample credit', ...leaf.credit.map((value) => f(value))],
          ['mass × score × credit', ...leaf.contribution.map((value) => f(value))],
          ['summed expectation gradient', ...result.gradient.map((value) => f(value))],
        ]}
      />
      <Output>
        Expected terminal reward {f(result.expected)}. State baselines change sample credit while
        preserving this fully enumerated expectation. The three parameter updates are not identical
        merely because the same R appears.
      </Output>
      <Controls>
        <Slider label="π(A)=q" value={q} onChange={setQ} min={0.05} max={0.95} />
        <Slider label="Success after A" value={a} onChange={setA} min={0.05} max={0.95} />
        <Slider label="Success after B" value={b} onChange={setB} min={0.05} max={0.95} />
        <Toggle label="Use state baselines" value={baseline} onChange={setBaseline} />
        <Select
          label="Sample leaf to trace"
          value={selected}
          onChange={(value) => setSelected(Number(value))}
          options={[
            [0, 'A success'],
            [1, 'A failure'],
            [2, 'B success'],
            [3, 'B failure'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function PRMRewardTelescoping() {
  const [gamma, setGamma] = useState(0.9);
  const [terminal, setTerminal] = useState(0);
  const [omit, setOmit] = useState(false);
  const values = [0.2, 0.5, 0.9, terminal];
  const result = M.shaping(values, gamma);
  return (
    <Figure id="D27" title="Keep the discounted transition into the terminal state">
      <SVG height={260} label="Potential levels and discounted transition differences">
        <line x1={50} y1={185} x2={600} y2={185} stroke="#8996aa" />
        {values.map((value, i) => (
          <g key={i}>
            <line
              x1={90 + i * 150}
              y1={185}
              x2={90 + i * 150}
              y2={185 - value * 135}
              stroke={hues[1]}
              strokeWidth={3}
            />
            <circle cx={90 + i * 150} cy={185 - value * 135} r={7} fill={hues[1]} />
            <text x={90 + i * 150} y={210} textAnchor="middle">
              state {i}
              {i === 3 ? ' terminal' : ''}
            </text>
            <text x={90 + i * 150} y={170 - value * 135} textAnchor="middle">
              Φ={f(value)}
            </text>
            {i < 3 && (
              <g opacity={omit && i === 2 ? 0.35 : 1}>
                <line x1={98 + i * 150} y1={75} x2={225 + i * 150} y2={75} stroke={hues[2]} />
                <text x={165 + i * 150} y={55} textAnchor="middle">
                  F={f(result.bonuses[i])}
                </text>
                <text x={165 + i * 150} y={99} textAnchor="middle">
                  γ^{i}F={f(result.weighted[i])}
                </text>
              </g>
            )}
          </g>
        ))}
      </SVG>
      <Output>
        {omit ? 'Terminal transition omitted: ' : 'All transitions included: '}discounted bonus sum{' '}
        {f(omit ? result.omitted : result.sum)}. Correct telescope −Φ₀ + γ³Φ₃ ={' '}
        {f(result.telescoped)}. Default full sum −.2; omitted sum .529.
      </Output>
      <div className="prm-length-proxy">
        <span>Separate wrong proxy: 2 valid steps × .1 = .2</span>
        <span>4 valid steps × .1 = .4</span>
        <strong>same terminal outcome; raw length bonus changes the goal</strong>
      </div>
      <Controls>
        <Slider label="Discount γ" value={gamma} onChange={setGamma} />
        <Slider label="Terminal potential Φ₃" value={terminal} onChange={setTerminal} />
        <Toggle label="Omit final transition penalty" value={omit} onChange={setOmit} />
      </Controls>
    </Figure>
  );
}

export function PRMWorkLedger() {
  const [k, setK] = useState(8);
  const [reuse, setReuse] = useState(false);
  const text = 'Q: 2(x+1)=8\n2x=6';
  const bytes = [...new TextEncoder().encode(text)];
  const prefix = new TextEncoder().encode('Q: 2(x+1)=8\n').length;
  return (
    <Figure id="D28" title="Count different kinds of work in their own units">
      <code className="prm-byte-source">{text}</code>
      <div className="prm-byte-strip">
        {bytes.map((byte, i) => (
          <span key={i}>
            <b>{i}</b>
            {byte}
            <small>{String.fromCharCode(byte) === '\n' ? '↵' : String.fromCharCode(byte)}</small>
          </span>
        ))}
      </div>
      <PRMTable
        caption="Declared byte-token illustration and actual parameter counts"
        headers={['object', 'count', 'unit / scope']}
        rows={[
          ['displayed input', bytes.length, 'UTF-8 byte tokens; not a word count'],
          ['lexical feature vector', 1024, 'coordinates'],
          ['lexical learned array', 3075, '1024×3 weights + 3 biases'],
          ['random Transformers contract', 14331, 'parameters in a separate architecture'],
          ['original supplied prefix', 1, 'prefix; increasing K does not increase it'],
          ['continued leaves', k, 'completion attempts'],
          ['terminal checks', k, 'checker calls'],
          [
            'prefix prefill tokens',
            reuse ? (k ? prefix : 0) : prefix * k,
            reuse ? 'one reused prefix (when K>0)' : 'repeated prefix processing',
          ],
          [
            'prefix KV memory',
            reuse && k ? 'retained' : 'not shared',
            'storage is required to reuse causal keys/values',
          ],
        ]}
      />
      <Output>
        K={k}:{' '}
        {k ? 'continuations and checks are counted separately' : 'no continuation estimate exists'}.
        These counters do not measure wall-clock speed or annotation hours.
      </Output>
      <Controls>
        <Slider label="Completion attempts K" value={k} onChange={setK} max={16} step={1} />
        <Toggle label="Reuse a causal prefix cache" value={reuse} onChange={setReuse} />
      </Controls>
    </Figure>
  );
}

export function PRMProxyFailure() {
  const [kind, setKind] = useState('expansion');
  const [rubric, setRubric] = useState('outcome');
  const objects = {
    expansion: {
      object: '2x+1=8 → 2x=7 → x=3.5 → assert answer 3',
      outcome: '✓ final substitution accepts assertion 3',
      process: '× constant 1 should be 2; first error 0',
    },
    root: {
      object: 'x(x+1)=0 → divide by x → x=−1; omitted root 0',
      outcome: '✓ any-valid-root checker accepts −1',
      process: '× incomplete solution set; cannot divide by potentially zero x',
    },
    repetition: {
      object: '2x=6 → 2x=6 → 2x=6 → x=3',
      outcome: '✓ final answer 3',
      process:
        'neutral repeated equations: valid but no extra progress; raw +.1 per step rewards length',
    },
    format: {
      object: 'numeric answer 3; supplied string “x = 3”',
      outcome: '× integer-only parser rejects format',
      process: '✓ numeric result can still be mathematically correct',
    },
    missing: {
      object: 'classes [progress, invalid, unknown]; eligibility [1,1,0]',
      outcome: 'unknown: no declared terminal-answer label',
      process: 'unknown suffix is excluded, not labelled invalid or neutral',
    },
  };
  const item = objects[kind];
  const priorities = [
    [0.9, 0.05, 0.05],
    [1 / 3, 1 / 3, 1 / 3],
    [0.2, 0.4, 0.4],
  ]
    .map((mass, i) => {
      const entropy = -mass.reduce((sum, p) => sum + p * Math.log(p), 0);
      return { i, entropy, bonus: i === 2 ? 1 : 0, priority: entropy + (i === 2 ? 1 : 0) };
    })
    .sort((a, b) => b.priority - a.priority);
  return (
    <Figure id="D29" title="Inspect the exact proxy operation before trusting its score">
      <div className="prm-failure-object">
        <code>{item.object}</code>
        <strong>{item[rubric]}</strong>
      </div>
      <PRMTable
        caption="Annotation request priority; none is a new ground-truth label"
        headers={['request order', 'case', 'entropy', 'disagreement bonus', 'priority']}
        rows={priorities.map((row, i) => [
          i + 1,
          row.i,
          f(row.entropy),
          row.bonus,
          f(row.priority),
        ])}
      />
      <Output>
        Ranking requests does not convert uncertainty into correctness. These five failures are
        constructed probes; inspect the actual learned-model failure in the held-out case viewer
        above.
      </Output>
      <Controls>
        <Select
          label="Failure object"
          value={kind}
          onChange={setKind}
          options={[
            ['expansion', 'wrong derivation, right assertion'],
            ['root', 'lost solution'],
            ['repetition', 'neutral repetition'],
            ['format', 'checker format rejection'],
            ['missing', 'missing annotation'],
          ]}
        />
        <Select
          label="Operation being judged"
          value={rubric}
          onChange={setRubric}
          options={[
            ['outcome', 'outcome checker'],
            ['process', 'process rubric'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
