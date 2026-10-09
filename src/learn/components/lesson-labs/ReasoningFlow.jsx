import React, { useEffect, useId, useRef, useState } from 'react';
import * as M from '../../data/reasoning-models.js';
import './reasoning-flow.css';

const hues = ['#83baff', '#c1a0ed', '#ef9e91'];
const f = (value, digits = 6) =>
  value == null
    ? 'unavailable'
    : Number.isFinite(value)
      ? Number(value.toFixed(digits)).toString()
      : String(value);
const vector = (values) => `[${values.map((v) => f(v)).join(', ')}]`;
const status = (value) => (value === null ? '— not exposed' : value ? '✓ passes' : '× fails');

function Figure({ id, label, children }) {
  return (
    <figure className="reasoning-figure" data-reasoning-figure={id} aria-label={label}>
      {children}
    </figure>
  );
}

function Controls({ children, reset }) {
  return (
    <fieldset className="reasoning-controls">
      <legend>Change this example</legend>
      {children}
      <button type="button" onClick={reset}>
        Reset
      </button>
    </fieldset>
  );
}

function NumberField({ label, value, onChange, min, max, step = 'any' }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);
  return (
    <label className="reasoning-field" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      <input
        id={id}
        aria-labelledby={`${id}-label`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          const next = Number(raw);
          setDraft(raw);
          const valid =
            raw !== '' &&
            Number.isFinite(next) &&
            next >= min &&
            next <= max &&
            (step !== 1 || Number.isInteger(next));
          setInvalid(!valid);
          if (valid) onChange(next);
        }}
        onBlur={() => {
          if (invalid) {
            setDraft(String(value));
            setInvalid(false);
          }
        }}
      />
      {invalid && (
        <small id={`${id}-error`}>
          Enter {step === 1 ? 'an integer' : 'a number'} from {min} to {max}. The drawing keeps the
          last valid value.
        </small>
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <label className="reasoning-field" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      <select
        id={id}
        aria-labelledby={`${id}-label`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
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
    <label className="reasoning-toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ReasoningScroll({ label, children }) {
  const reference = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = reference.current;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    if (node.firstElementChild) resize.observe(node.firstElementChild);
    const changes = new MutationObserver(measure);
    changes.observe(node, { subtree: true, childList: true, characterData: true });
    const visible = new IntersectionObserver(measure);
    visible.observe(node);
    document.fonts?.addEventListener('loadingdone', measure);
    measure();
    return () => {
      resize.disconnect();
      changes.disconnect();
      visible.disconnect();
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, []);
  return (
    <div className="reasoning-scroll-shell">
      <div
        ref={reference}
        className="reasoning-scroll"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {children}
      </div>
      {overflow && (
        <p className="reasoning-scroll-hint">
          Scroll horizontally for the complete {label.toLowerCase()}. Keyboard: focus this region
          and use ← / →.
        </p>
      )}
    </div>
  );
}

export function ReasoningTable({ caption, headers, rows }) {
  return (
    <ReasoningScroll label={caption}>
      <table className="reasoning-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
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
    </ReasoningScroll>
  );
}

function SVG({ width = 600, height, label, children }) {
  const marker = useId().replaceAll(':', '');
  return (
    <ReasoningScroll label={label}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}
        role="img"
        aria-label={label}
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        <g style={{ '--reasoning-arrow': `url(#${marker})` }}>{children}</g>
      </svg>
    </ReasoningScroll>
  );
}

function Wire({ x1, y1, x2, y2, colour = '#aaa', dashed = false }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={colour}
      strokeWidth="1.5"
      strokeDasharray={dashed ? '5 4' : undefined}
      className="reasoning-wire"
    />
  );
}

function Circle({ x, y, value, colour = '#e7bb72', radius = 25 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill="#171717" stroke={colour} strokeWidth="2" />
      <text x={x} y={y + 7} textAnchor="middle" style={{ fill: colour }}>
        {value}
      </text>
    </g>
  );
}

function Masses({ names, values, maximum = 1, colours = hues, signed = false }) {
  return (
    <div className="reasoning-masses">
      {values.map((value, i) => (
        <div key={i}>
          <span style={{ color: colours[i % colours.length] }}>{names[i]}</span>
          <div className={`reasoning-track${signed ? ' reasoning-track--signed' : ''}`}>
            <i
              style={{
                background: colours[i % colours.length],
                width: `${(Math.abs(value) / maximum) * (signed ? 50 : 100)}%`,
                left: signed ? `${value < 0 ? 50 - (Math.abs(value) / maximum) * 50 : 50}%` : 0,
              }}
            />
          </div>
          <output>{f(value)}</output>
        </div>
      ))}
    </div>
  );
}

function TokenRow({ values, masks, colour = '#e7bb72' }) {
  return (
    <div className="reasoning-tokens">
      {values.map((value, i) => (
        <span
          key={i}
          style={{ borderColor: colour, color: masks && !masks[i] ? '#aaa' : colour }}
          className={masks && !masks[i] ? 'reasoning-token--padding' : ''}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export function ExpressionTree() {
  const [values, setValues] = useState([2, 3, 3]);
  const [a, b, c] = values;
  return (
    <Figure id="D01" label="Arithmetic expression dependency tree">
      <SVG width={340} height={420} label="Expression tree">
        <Wire x1={90} y1={55} x2={145} y2={115} />
        <Wire x1={210} y1={55} x2={155} y2={115} />
        <Wire x1={150} y1={161} x2={150} y2={190} />
        <Wire x1={150} y1={232} x2={205} y2={265} />
        <Wire x1={270} y1={232} x2={225} y2={265} />
        <Circle x={90} y={30} value={a} colour={hues[0]} />
        <Circle x={210} y={30} value={b} colour={hues[1]} />
        <Circle x={150} y={137} value="+" />
        <text x={30} y={140}>
          add
        </text>
        <Circle x={150} y={211} value={a + b} />
        <Circle x={270} y={211} value={c} colour={hues[2]} />
        <Circle x={215} y={288} value="×" />
        <text x={25} y={294}>
          multiply
        </text>
        <Wire x1={215} y1={315} x2={215} y2={349} />
        <Circle x={215} y={377} value={(a + b) * c} />
        <text x={25} y={384}>
          product
        </text>
      </SVG>
      <Controls reset={() => setValues([2, 3, 3])}>
        {['Operand a', 'Operand b', 'Multiplier c'].map((label, i) => (
          <NumberField
            key={label}
            label={label}
            value={values[i]}
            min={i === 2 ? 1 : 0}
            max={i === 2 ? 5 : 9}
            step={1}
            onChange={(value) => setValues(values.map((v, j) => (i === j ? value : v)))}
          />
        ))}
      </Controls>
    </Figure>
  );
}

export function ExposedEvidence() {
  const [selected, setSelected] = useState('0');
  const responses = ['sum = 5; answer = 15', 'sum = 6; answer = 15', 'answer = 15'];
  return (
    <Figure id="D02" label="Same final answer with different exposed evidence">
      <div className="reasoning-responses">
        {responses.map((text, i) => {
          const checked = M.checkTrace(2, 3, 3, text);
          return (
            <div
              key={text}
              className={Number(selected) === i ? 'reasoning-selected' : ''}
              style={{ '--identity': hues[i] }}
            >
              <p>
                <strong>Response {i + 1}</strong> <code>{text}</code>
              </p>
              <dl>
                {[
                  ['Syntax', checked.format],
                  ['Final answer', checked.final],
                  ['Displayed sum', checked.sumCorrect],
                  ['Product consistency', checked.product],
                ].map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{status(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      <Controls reset={() => setSelected('0')}>
        <Select
          label="Outline response"
          value={selected}
          onChange={setSelected}
          options={responses.map((_, i) => [String(i), `Response ${i + 1}`])}
        />
      </Controls>
    </Figure>
  );
}

function PrefixBranches({ state, sampled = false }) {
  const root = sampled ? state.nodes[0].sampled : state.probabilities[0];
  return (
    <div className="reasoning-branches">
      {M.sums.map((sum, i) => (
        <div key={sum}>
          <p style={{ color: hues[i] }}>
            Path {String.fromCharCode(65 + i)} · sum {sum}: root mass {f(root[i])}
          </p>
          <SVG width={310} height={380} label={`Prefix branch for sum ${sum}`}>
            <text x={155} y={23} textAnchor="middle">
              prompt (2+3)×3
            </text>
            <Wire x1={155} y1={33} x2={155} y2={96} colour={hues[i]} dashed={root[i] === 0} />
            <text x={183} y={70}>
              {f(root[i], 3)}
            </text>
            <g transform="translate(0, 100)">
              <Circle x={155} y={35} value={sum} colour={hues[i]} />
              {M.answers.map((answer, j) => {
                const x = 45 + j * 110;
                const p = sampled ? state.nodes[i + 1].sampled[j] : state.probabilities[i + 1][j];
                return (
                  <g key={answer}>
                    <Wire
                      x1={155}
                      y1={62}
                      x2={x}
                      y2={153}
                      colour={hues[i]}
                      dashed={p === 0 || root[i] === 0}
                    />
                    <text x={x} y={123} textAnchor="middle" className="reasoning-label-backed">
                      {f(p, 3)}
                    </text>
                    <Circle x={x} y={178} value={answer} colour={hues[i]} />
                    <text x={x} y={230} textAnchor="middle">
                      {f(root[i] * p, 4)}
                    </text>
                  </g>
                );
              })}
              <text x={155} y={268} textAnchor="middle">
                path mass, then fixed EOS (1)
              </text>
            </g>
          </SVG>
        </div>
      ))}
    </div>
  );
}

export function ConditionalTree() {
  const [offset, setOffset] = useState(0);
  const state = M.tree(offset);
  return (
    <Figure id="D03" label="Conditional prefix probabilities">
      <PrefixBranches state={state} />
      <p>All nine terminal masses sum to {f(M.total(state.paths.map((p) => p.probability)))}.</p>
      <Controls reset={() => setOffset(0)}>
        <NumberField
          label="Sum-5 root logit offset"
          value={offset}
          min={-2}
          max={2}
          onChange={setOffset}
        />
      </Controls>
    </Figure>
  );
}

export function SharedDecoder() {
  const [prompt, setPrompt] = useState('0');
  const [prefix, setPrefix] = useState(0);
  const inputs =
    prompt === '0' ? ['(', 2, '+', 3, ')', '×', 3, '='] : ['(', 1, '+', 4, ')', '×', 2, '='];
  const history = [...inputs, ...['SUM', 5].slice(0, prefix)];
  return (
    <Figure id="D04" label="Shared decoder weights and separate prefix states">
      <TokenRow values={history} colour={hues[Number(prompt)]} />
      <SVG width={560} height={420} label="Causal decoder parameter and activation shapes">
        <text x={15} y={28}>
          same token embedding: 99 × 48
        </text>
        {Array.from({ length: 6 }, (_, i) =>
          Array.from({ length: 12 }, (_, j) => (
            <rect
              key={`${i}-${j}`}
              x={20 + j * 12}
              y={46 + i * 9}
              width={10}
              height={7}
              fill="#e7bb72"
              opacity=".7"
            />
          )),
        )}
        <text x={196} y={79}>
          {history.length} token positions × 48
        </text>
        <Wire x1={100} y1={111} x2={100} y2={145} />
        {[0, 1].map((block) => (
          <g key={block} transform={`translate(0, ${block * 112})`}>
            <text x={190} y={158}>
              causal block {block + 1}
            </text>
            <text x={190} y={185}>
              attention → residual → MLP
            </text>
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 6 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={25 + col * 16}
                  y={144 + row * 11}
                  width={14}
                  height={9}
                  fill={col <= row ? hues[Number(prompt)] : 'none'}
                  stroke="#777"
                  strokeWidth=".5"
                />
              )),
            )}
            <Wire x1={75} y1={214} x2={75} y2={239} />
          </g>
        ))}
        <text x={20} y={390}>
          shared 48 × 99 output weights → 99 next-token logits
        </text>
      </SVG>
      <p>
        Shape schematic: the arrays show representative cells, and each attention triangle shows the
        first six positions. Cell colours show allowed causal positions, not measured attention
        values. The same 66,528 parameters process either prefix. Each new token extends the
        history.
      </p>
      <Controls
        reset={() => {
          setPrompt('0');
          setPrefix(0);
        }}
      >
        <Select
          label="Question"
          value={prompt}
          onChange={setPrompt}
          options={[
            ['0', '(2+3)×3'],
            ['1', '(1+4)×2'],
          ]}
        />
        <NumberField
          label="Already emitted tokens"
          value={prefix}
          min={0}
          max={2}
          step={1}
          onChange={setPrefix}
        />
      </Controls>
    </Figure>
  );
}

export function TraceChecker() {
  const [text, setText] = useState('sum = 5; answer = 15');
  const [eos, setEos] = useState(true);
  const [preset, setPreset] = useState('valid');
  const checked = M.checkTrace(2, 3, 3, text, eos);
  const presets = {
    valid: ['sum = 5; answer = 15', true],
    false: ['sum = 6; answer = 15', true],
    malformed: ['sum = 5; answer =', true],
    cap: ['sum = 5; answer = 15', false],
    direct: ['answer = 15', true],
  };
  const select = (value) => {
    setPreset(value);
    setText(presets[value][0]);
    setEos(presets[value][1]);
  };
  return (
    <Figure id="D05" label="Trace parsing and separate equality checks">
      <p className="reasoning-literal">
        <code>
          {text
            ? text.split(/(sum|answer|-?\d+|;|=)/g).map((part, i) => (
                <span
                  key={i}
                  className={
                    /^(sum|answer)$/.test(part)
                      ? 'reasoning-parser-name'
                      : /^-?\d+$/.test(part)
                        ? 'reasoning-parser-number'
                        : /^[;=]$/.test(part)
                          ? 'reasoning-parser-separator'
                          : undefined
                  }
                >
                  {part}
                </span>
              ))
            : '(empty text)'}
        </code>
      </p>
      <p>
        Underlined names identify fields; amber integers are parsed values; neutral separators
        delimit the grammar.
      </p>
      <ReasoningTable
        caption="Separate checker outputs"
        headers={['Operation', 'Observed value', 'Result']}
        rows={[
          [
            'Parse full grammar',
            checked.format ? 'complete response' : 'invalid syntax',
            status(checked.format),
          ],
          [
            'Compare sum with 2+3',
            checked.intermediate === null ? 'not exposed' : `${checked.intermediate} = 5?`,
            status(checked.sumCorrect),
          ],
          [
            'Compare answer with displayed sum×3',
            checked.intermediate === null
              ? 'not exposed'
              : `${checked.answer} = ${checked.intermediate * 3}?`,
            status(checked.product),
          ],
          [
            'Compare answer with true product',
            `${checked.answer ?? 'absent'} = 15?`,
            status(checked.final),
          ],
          ['Actual EOS', eos ? 'emitted' : 'not emitted', status(eos)],
          ['Training reward', 'final correct AND actual EOS', checked.reward],
        ]}
      />
      <Controls reset={() => select('valid')}>
        <Select
          label="Trace case"
          value={preset}
          onChange={select}
          options={Object.keys(presets).map((key) => [
            key,
            {
              valid: 'Valid derivation',
              false: 'False sum',
              malformed: 'Incomplete text',
              cap: 'No EOS',
              direct: 'No displayed sum',
            }[key],
          ])}
        />
        <label className="reasoning-field">
          Response text
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <Toggle label="Actual EOS emitted" value={eos} onChange={setEos} />
      </Controls>
    </Figure>
  );
}

export function ProbabilityContributions() {
  const [strict, setStrict] = useState(false);
  const state = M.tree(0, strict);
  return (
    <Figure id="D06" label="Path probability times reward">
      <ReasoningTable
        caption="Nine path contributions on a common probability scale"
        headers={['Path', 'Probability', 'Reward', 'Contribution']}
        rows={state.paths.map((p) => [
          <span style={{ color: hues[p.i] }}>
            {p.sum} → {p.answer}
          </span>,
          <span className="reasoning-probability-cell">
            <i style={{ width: `${p.probability * 100}%`, background: hues[p.i] }} />
            {f(p.probability)}
          </span>,
          p.reward,
          <span className="reasoning-probability-cell">
            <i style={{ width: `${p.probability * p.reward * 100}%`, background: hues[p.i] }} />
            {f(p.probability * p.reward)}
          </span>,
        ])}
      />
      <p>
        Expected reward J = {f(state.value)}. Widths show probability on [0, 1]; the reward chooses
        which mass counts.
      </p>
      <Controls reset={() => setStrict(false)}>
        <Toggle label="Require correct displayed sum" value={strict} onChange={setStrict} />
      </Controls>
    </Figure>
  );
}

export function ScoreCoordinates() {
  const [path, setPath] = useState('4');
  const [baseline, setBaseline] = useState(0);
  const state = M.tree();
  const selected = M.trajectoryScore(state, Number(path), baseline);
  return (
    <Figure id="D07" label="Selected trajectory score coordinates">
      <p style={{ color: hues[selected.path.i] }}>
        sum {selected.path.sum} → answer {selected.path.answer}; path probability{' '}
        {f(selected.path.probability)}; reward {selected.path.reward}
      </p>
      <ReasoningTable
        caption="One-hot minus probability at every decision node"
        headers={['Node', 'Probabilities', 'Score ∂logπ/∂logits', '(reward−baseline) × score']}
        rows={state.probabilities.map((row, i) => [
          i === 0 ? 'root' : `after sum ${M.sums[i - 1]}`,
          vector(row),
          vector(selected.score[i]),
          vector(selected.weighted[i]),
        ])}
      />
      <p>
        Constant-baseline expected score contribution across all nine paths: 0. Unvisited
        conditional rows are zero for this sample.
      </p>
      <Controls
        reset={() => {
          setPath('4');
          setBaseline(0);
        }}
      >
        <Select
          label="Sampled path"
          value={path}
          onChange={setPath}
          options={state.paths.map((p, i) => [String(i), `${p.sum} → ${p.answer}`])}
        />
        <NumberField
          label="Constant baseline"
          value={baseline}
          min={-1}
          max={1}
          onChange={setBaseline}
        />
      </Controls>
    </Figure>
  );
}

export function GradientUpdate() {
  const [rate, setRate] = useState(0.1);
  const [strict, setStrict] = useState(false);
  const { before, after } = M.gradientStep(rate, strict);
  return (
    <Figure id="D08" label="Exact logit gradient and probability update">
      <Masses
        names={M.sums.map((s) => `sum ${s}`)}
        values={before.gradient[0]}
        maximum={0.25}
        signed
      />
      <ReasoningTable
        caption="All logit coordinates and their changed probabilities"
        headers={['Node', 'Old logits', 'Gradient', 'New probabilities']}
        rows={before.logits.map((row, i) => [
          i === 0 ? 'root' : `sum ${M.sums[i - 1]}`,
          vector(row),
          vector(before.gradient[i]),
          vector(after.probabilities[i]),
        ])}
      />
      <p>
        Gradient ascent z ← z + {f(rate)}∇J. Expected reward {f(before.value)} → {f(after.value)};
        new root mass {f(M.total(after.probabilities[0]))}.
      </p>
      <Controls
        reset={() => {
          setRate(0.1);
          setStrict(false);
        }}
      >
        <NumberField label="Ascent step size" value={rate} min={0} max={0.5} onChange={setRate} />
        <Toggle label="Require correct displayed sum" value={strict} onChange={setStrict} />
      </Controls>
    </Figure>
  );
}

export function GroupComparison() {
  const [preset, setPreset] = useState('mixed');
  const [beta, setBeta] = useState(0);
  const rewards = preset === 'mixed' ? [1, 0, 0, 1] : Array(4).fill(preset === 'success' ? 1 : 0);
  const state = M.group(rewards);
  const klGradient = beta * 0.8 * 0.2 * Math.log(4);
  return (
    <Figure id="D09" label="Same-question group reward comparison">
      <TokenRow values={rewards.map((r, i) => `response ${i + 1}: ${r}`)} />
      <p>
        Group mean {f(state.mean)}; sample SD {f(state.standardDeviation)} (denominator G−1 = 3);
        epsilon 0.0001.
      </p>
      <Masses
        names={rewards.map((_, i) => `response ${i + 1}`)}
        values={state.advantages}
        signed
        maximum={1}
        colours={['#e7bb72']}
      />
      <ReasoningTable
        caption="Separate reward comparison and binary-reference penalty"
        headers={['Contribution', 'Value']}
        rows={[
          ['Centered standardized advantages', vector(state.advantages)],
          ['Leave-one-out advantages', vector(state.loo)],
          ['Binary forward-KL loss derivative', f(klGradient)],
        ]}
      />
      <p>
        The KL illustration uses current p=.8 and reference q=.5. Other optimizer terms are outside
        this calculation; zero current reward advantage does not describe optimizer momentum.
      </p>
      <Controls
        reset={() => {
          setPreset('mixed');
          setBeta(0);
        }}
      >
        <Select
          label="Group rewards"
          value={preset}
          onChange={setPreset}
          options={[
            ['mixed', 'Mixed'],
            ['failure', 'All fail'],
            ['success', 'All succeed'],
          ]}
        />
        <NumberField
          label="KL penalty coefficient"
          value={beta}
          min={0}
          max={0.2}
          onChange={setBeta}
        />
      </Controls>
    </Figure>
  );
}

export function SignedClipping() {
  const [ratio, setRatio] = useState(1);
  const [advantage, setAdvantage] = useState(1);
  const state = M.clipped(ratio, advantage);
  return (
    <Figure id="D10" label="Signed token-ratio clipping">
      <Masses
        names={['Old token π', 'Current token π', 'Reference π']}
        values={[0.25, ratio * 0.25, 0.5]}
        colours={['#aaa', '#e7bb72', '#ccc']}
      />
      <SVG width={440} height={100} label="Token ratio clipping interval">
        <line x1={35} x2={405} y1={45} y2={45} stroke="#777" />
        {[0.2, 0.8, 1, 1.2, 2].map((r) => (
          <g key={r}>
            <line
              x1={35 + ((r - 0.2) / 1.8) * 370}
              x2={35 + ((r - 0.2) / 1.8) * 370}
              y1={25}
              y2={60}
              stroke="#aaa"
              strokeDasharray={r === 0.8 || r === 1.2 ? '4 3' : undefined}
            />
            <text x={35 + ((r - 0.2) / 1.8) * 370} y={87} textAnchor="middle">
              {r}
            </text>
          </g>
        ))}
        <circle cx={35 + ((ratio - 0.2) / 1.8) * 370} cy={45} r={7} fill="#e7bb72" />
      </SVG>
      <Masses
        names={['r × A', 'clip(r) × A', 'selected minimum']}
        values={[state.raw, state.bounded, state.objective]}
        signed
        maximum={4}
        colours={['#83baff', '#c1a0ed', '#e7bb72']}
      />
      <p>
        Maximize the minimum {f(state.objective)}. This illustration has no reference-KL term; the
        reference bar is a separate policy role.
      </p>
      <Controls
        reset={() => {
          setRatio(1);
          setAdvantage(1);
        }}
      >
        <NumberField
          label="Current / old token probability"
          value={ratio}
          min={0.2}
          max={2}
          onChange={setRatio}
        />
        <NumberField
          label="Advantage A"
          value={advantage}
          min={-2}
          max={2}
          onChange={setAdvantage}
        />
      </Controls>
    </Figure>
  );
}

export function SamplerSupport() {
  const [temperature, setTemperature] = useState(1);
  const [topP, setTopP] = useState(1);
  const [fixture, setFixture] = useState('initial');
  const state = M.sampledTree(temperature, topP, fixture === 'cut');
  return (
    <Figure id="D11" label="Temperature and nucleus support on the prefix tree">
      <PrefixBranches state={state} sampled />
      <ReasoningTable
        caption="Full temperature-softmax and retained support"
        headers={['Decision', 'Original mass', 'After nucleus', 'Retained mass']}
        rows={state.nodes.map((node, i) => [
          i === 0 ? 'root' : `sum ${M.sums[i - 1]}`,
          vector(node.original),
          vector(node.sampled),
          f(node.mass),
        ])}
      />
      <p>
        Calculated sampled final-answer success: {f(state.success)}. Ghost edges have zero
        probability under this sampler.
      </p>
      <Controls
        reset={() => {
          setTemperature(1);
          setTopP(1);
          setFixture('initial');
        }}
      >
        <NumberField
          label="Temperature"
          value={temperature}
          min={0.2}
          max={2}
          onChange={setTemperature}
        />
        <NumberField label="Nucleus top-p" value={topP} min={0.1} max={1} onChange={setTopP} />
        <Select
          label="Root distribution"
          value={fixture}
          onChange={setFixture}
          options={[
            ['initial', 'Initial'],
            ['cut', 'Useful path below cutoff'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function GroupComposition() {
  const [p, setP] = useState(0.1);
  const [count, setCount] = useState(8);
  const [trials, setTrials] = useState(256);
  const state = M.groupEvents(p, count);
  const values = [state.failed, state.mixed, state.successful];
  return (
    <Figure id="D12" label="Probabilities of equal and mixed reward groups">
      <div className="reasoning-stacked" aria-label="Group event probabilities on total width one">
        {values.map((v, i) => (
          <span key={i} style={{ flexBasis: `${v * 100}%`, background: hues[i] }} />
        ))}
      </div>
      <ReasoningTable
        caption="Exact independent group events"
        headers={['Event', 'Probability']}
        rows={['All fail', 'Mixed rewards', 'All succeed'].map((name, i) => [
          <span style={{ color: hues[i] }}>{name}</span>,
          values[i] === 0
            ? '0'
            : values[i] < 0.00001
              ? values[i].toExponential(7)
              : f(values[i], 8),
        ])}
      />
      <p>
        After zero successes in {trials} attempts, one-sided 95% upper bound:{' '}
        {f(M.noSuccessUpper(trials), 8)}. Both calculations assume independent draws from one fixed
        question and sampler.
      </p>
      <Controls
        reset={() => {
          setP(0.1);
          setCount(8);
          setTrials(256);
        }}
      >
        <NumberField label="Per-draw success p" value={p} min={0} max={1} onChange={setP} />
        <NumberField
          label="Group size G"
          value={count}
          min={2}
          max={64}
          step={1}
          onChange={setCount}
        />
        <NumberField
          label="Observed failures n"
          value={trials}
          min={1}
          max={1024}
          step={1}
          onChange={setTrials}
        />
      </Controls>
    </Figure>
  );
}

export function GenerationTimeline() {
  const [preset, setPreset] = useState('full');
  const [cap, setCap] = useState(5);
  const cases = { full: [91, 5, 92, 15, 98], early: [92, 15, 98, 98, 98], cut: [91, 5, 92, 15] };
  const state = M.emitted(cases[preset], cap);
  return (
    <Figure id="D13" label="Prompt, emitted tokens, padding and cap">
      <p>Eight prompt positions</p>
      <TokenRow values={['(', 2, '+', 3, ')', '×', 3, '=']} colour="#aaa" />
      <p>Completion IDs: 91 = SUM; 92 = ANSWER; 98 = EOS (also padding)</p>
      <TokenRow values={state.tokens} masks={state.mask} />
      <ReasoningTable
        caption="Generation history determines supervision"
        headers={['Position', 'Token ID', 'Emitted mask', 'Role']}
        rows={state.tokens.map((id, i) => [
          i + 1,
          id,
          Number(state.mask[i]),
          !state.mask[i] ? 'padding' : id === 98 ? 'actual EOS included' : 'emitted target',
        ])}
      />
      <p>
        Eight prompt positions; {state.count} emitted targets and{' '}
        {state.tokens.length - state.count} padding positions in {state.tokens.length} completion
        tensor positions. End event: {state.terminated ? 'actual EOS' : 'cap / supplied cutoff'}.
        Final-only reward{' '}
        {state.terminated && ((preset === 'full' && cap === 5) || preset === 'early') ? 1 : 0} for
        the supplied trace.
      </p>
      <Controls
        reset={() => {
          setPreset('full');
          setCap(5);
        }}
      >
        <Select
          label="Recorded token case"
          value={preset}
          onChange={setPreset}
          options={[
            ['full', 'Five-token derivation'],
            ['early', 'Early direct answer'],
            ['cut', 'No EOS'],
          ]}
        />
        <NumberField
          label="Completion cap"
          value={cap}
          min={1}
          max={5}
          step={1}
          onChange={setCap}
        />
      </Controls>
    </Figure>
  );
}

export function ReductionWeights() {
  const [length, setLength] = useState(4);
  const [value, setValue] = useState(3);
  const state = M.reductions(length, value);
  return (
    <Figure id="D14" label="Sequence sums, response means and pooled token means">
      <div className="reasoning-reduction-row">
        <span>Response A</span>
        <TokenRow values={[1, 1]} colour={hues[0]} />
        <p>sum 2 ÷ length 2 = 1</p>
      </div>
      <div className="reasoning-reduction-row">
        <span>Response B</span>
        <TokenRow values={Array(length).fill(value)} colour={hues[1]} />
        <p>
          sum {f(length * value)} ÷ length {length} = {f(value)}
        </p>
      </div>
      <ReasoningTable
        caption="Different averaging operations on the same token contributions"
        headers={['Reduction', 'Arithmetic', 'Value']}
        rows={[
          ['Mean sequence sum', `(2 + ${f(length * value)}) / 2`, f(state.sequence)],
          ['Mean response mean', `(1 + ${f(value)}) / 2`, f(state.response)],
          ['Pooled token mean', `(2 + ${f(length * value)}) / ${2 + length}`, f(state.pooled)],
        ]}
      />
      <Controls
        reset={() => {
          setLength(4);
          setValue(3);
        }}
      >
        <NumberField
          label="Response B length"
          value={length}
          min={1}
          max={8}
          step={1}
          onChange={setLength}
        />
        <NumberField
          label="B contribution per token"
          value={value}
          min={-3}
          max={3}
          onChange={setValue}
        />
      </Controls>
    </Figure>
  );
}

const assets = new Map();
function requestAsset(file, retry = false) {
  if (retry) assets.delete(file);
  if (!assets.has(file)) {
    assets.set(
      file,
      fetch(`/learn-code/rl-reasoning/${file}`).then((response) => {
        if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || ''))
          throw new Error('Observation unavailable');
        return response.json();
      }),
    );
  }
  return assets.get(file);
}

function Recorded({ file, children }) {
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setResult(null);
    setFailed(false);
    requestAsset(file, attempt > 0)
      .then((value) => {
        if (current) setResult(value);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [file, attempt]);
  if (failed)
    return (
      <p role="alert">
        The recorded observations could not load.{' '}
        <button className="reasoning-retry" type="button" onClick={() => setAttempt((n) => n + 1)}>
          Retry
        </button>
      </p>
    );
  if (result === null) return <p role="status">Loading the recorded observations…</p>;
  return children(result);
}

function CheckpointGlyph({ label, colour = '#e7bb72' }) {
  return (
    <div className="reasoning-checkpoint">
      <div className="reasoning-parameter-array" aria-label="Model parameter array, schematic">
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ background: colour }} />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

function LinePlot({
  series,
  maximum = 1,
  minimum = 0,
  xMaximum,
  label,
  xLabel = 'update / checkpoint',
  cursor,
}) {
  const [inspected, setInspected] = useState(null);
  const x = (value) => 72 + (value / xMaximum) * 460;
  const y = (value) => 250 - ((value - minimum) / (maximum - minimum || 1)) * 190;
  return (
    <>
      <SVG width={600} height={325} label={label}>
        {cursor !== undefined && (
          <line
            x1={x(cursor)}
            x2={x(cursor)}
            y1={60}
            y2={250}
            stroke="#e7bb72"
            strokeDasharray="3 4"
          />
        )}
        {[minimum, (minimum + maximum) / 2, maximum].map((tick) => (
          <g key={tick}>
            <line x1={72} x2={532} y1={y(tick)} y2={y(tick)} stroke="#444" />
            <text x={63} y={y(tick) + 5} textAnchor="end">
              {f(tick, 3)}
            </text>
          </g>
        ))}
        {[0, xMaximum / 2, xMaximum].map((tick) => (
          <text key={tick} x={x(tick)} y={280} textAnchor="middle">
            {f(tick)}
          </text>
        ))}
        {series.map((line, i) => (
          <g key={line.name}>
            <polyline
              fill="none"
              stroke={line.colour}
              strokeWidth={2}
              strokeDasharray={i === 1 ? '7 4' : i === 2 ? '2 4' : undefined}
              points={line.points.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')}
            />
            {line.points
              .filter(
                (_, j) => line.points.length < 12 || j % 10 === 0 || j === line.points.length - 1,
              )
              .map(([a, b, source], j) => (
                <g
                  key={j}
                  tabIndex={0}
                  aria-label={`${line.name}: ${a}, ${f(b, 8)}${source ? `; ${source}` : ''}`}
                  onFocus={() => setInspected({ name: line.name, a, b, source })}
                  onMouseEnter={() => setInspected({ name: line.name, a, b, source })}
                >
                  <title>{`${line.name}: ${a}, ${f(b, 8)}${source ? `; ${source}` : ''}`}</title>
                  {i === 1 ? (
                    <rect
                      key={j}
                      x={x(a) - 5}
                      y={y(b) - 5}
                      width={10}
                      height={10}
                      fill="none"
                      stroke={line.colour}
                      strokeWidth={2}
                    />
                  ) : i === 2 ? (
                    <path
                      key={j}
                      d={`M ${x(a)} ${y(b) - 7} l 7 12 h -14 z`}
                      fill="none"
                      stroke={line.colour}
                      strokeWidth={2}
                    />
                  ) : (
                    <circle key={j} cx={x(a)} cy={y(b)} r={4} fill={line.colour} />
                  )}
                </g>
              ))}
          </g>
        ))}
        <text x={302} y={309} textAnchor="middle">
          {xLabel}
        </text>
      </SVG>
      {inspected && (
        <p className="reasoning-plot-inspection">
          {inspected.name}: coordinate {inspected.a}, value {f(inspected.b, 8)}
          {inspected.source ? `; saved file ${inspected.source}` : ''}.
        </p>
      )}
    </>
  );
}

export function StudySplit() {
  const [family, setFamily] = useState('2-6');
  const [seed, setSeed] = useState('17');
  return (
    <Figure id="D15" label="Family split and shared warm-start checkpoint">
      <Recorded file="observations/scratch/protocol.json">
        {(protocol) => {
          const partitions = Object.entries(protocol.splits);
          const record = partitions
            .flatMap(([, rows]) => rows)
            .find((row) => row.family === family);
          const partition = partitions.find(([, rows]) =>
            rows.some((row) => row.family === family),
          )[0];
          return (
            <>
              <div className="reasoning-family-groups">
                {partitions.map(([name, rows], index) => {
                  const families = [...new Set(rows.map((row) => row.family))];
                  return (
                    <div key={name}>
                      <p style={{ color: hues[index] }}>
                        {name}: {families.length} families / {rows.length} questions
                      </p>
                      <div className="reasoning-family-dots">
                        {families.map((id) => (
                          <span
                            key={id}
                            className={family === id ? 'reasoning-selected' : ''}
                            style={{ color: hues[index] }}
                          >
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p>
                Family ({record.a}, {record.b}) stays entirely in {partition}: multipliers 1, 2, 3,
                4, 5.
              </p>
              <div className="reasoning-fork">
                <CheckpointGlyph label={`Seed ${seed}: 500 SFT updates`} />
                <span className="reasoning-branch-arrow">↓ clone the same weights</span>
                <div>
                  <CheckpointGlyph label="80 SFT updates" colour="#8cd2d9" />
                  <CheckpointGlyph label="80 RL updates" colour={hues[1]} />
                  <CheckpointGlyph label="Unchanged warm checkpoint" colour="#aaa" />
                </div>
              </div>
              <p>
                All nine fits finish before the fixed held-out checkpoint campaign. No test-feedback
                edge selects a checkpoint.
              </p>
              <Controls
                reset={() => {
                  setFamily('2-6');
                  setSeed('17');
                }}
              >
                <Select
                  label="Inspect family"
                  value={family}
                  onChange={setFamily}
                  options={partitions
                    .flatMap(([, rows]) => [...new Set(rows.map((r) => r.family))])
                    .map((id) => [id, id])}
                />
                <Select
                  label="Recorded training seed"
                  value={seed}
                  onChange={setSeed}
                  options={['17', '29', '43'].map((v) => [v, v])}
                />
              </Controls>
            </>
          );
        }}
      </Recorded>
    </Figure>
  );
}

export function SavedRollout() {
  const [seed, setSeed] = useState('17');
  const [step, setStep] = useState(21);
  return (
    <Figure id="D16" label="Saved sampled response and its sequence gradient credit">
      <Recorded file={`observations/scratch/seed-${seed}/rl-history.json`}>
        {(history) => {
          const row = history[step - 1];
          const sample = row.sample;
          const sequenceLog = M.total(row.sample_logps.map((p, i) => p * Number(sample.mask[i])));
          return (
            <>
              <p>
                Recorded seed {seed}, update {step}, question {sample.id}:{' '}
                <code>{sample.text}</code>
              </p>
              <TokenRow values={sample.ids} masks={sample.mask} colour={hues[1]} />
              <ReasoningTable
                caption="Actual saved token contributions"
                headers={['Target position', 'ID', 'Emitted mask', 'log π']}
                rows={sample.ids.map((id, i) => [
                  i + 1,
                  id,
                  Number(sample.mask[i]),
                  f(row.sample_logps[i], 8),
                ])}
              />
              <p>
                Reward {sample.reward}; LOO advantage {f(row.sample_advantage, 8)}; selected log sum{' '}
                {f(sequenceLog, 8)}; individual negative weighted score{' '}
                {f(-sequenceLog * row.sample_advantage, 8)}.
              </p>
              <p>
                The entire 64-response batch loss is {f(row.loss, 8)}. Mean reward{' '}
                {f(row.reward_mean)}; mixed groups {row.mixed_groups}/8; pre-clipping gradient norm{' '}
                {f(row.gradient_norm)}.{' '}
                {row.gradient_norm === 0
                  ? 'Current reward gradient is zero; Adam may still retain earlier moments.'
                  : ''}
              </p>
              <Controls
                reset={() => {
                  setSeed('17');
                  setStep(21);
                }}
              >
                <Select
                  label="Recorded seed"
                  value={seed}
                  onChange={setSeed}
                  options={['17', '29', '43'].map((v) => [v, v])}
                />
                <NumberField
                  label="Saved update"
                  value={step}
                  min={1}
                  max={80}
                  step={1}
                  onChange={setStep}
                />
              </Controls>
            </>
          );
        }}
      </Recorded>
    </Figure>
  );
}

export function TransferResults() {
  const [seed, setSeed] = useState('17');
  const [metric, setMetric] = useState('pass1');
  return (
    <Figure id="D17" label="Recorded training reward and held-out transfer">
      <Recorded file="observations.json">
        {(observations) => {
          const rows = observations.summary.evaluations.filter((row) => row.seed === Number(seed));
          const names = {
            pass1: 'held-out pass@1',
            format: 'valid format fraction',
            derivation: 'valid derivation fraction',
            nll: 'reference NLL, nats/token',
          };
          const series = [
            ['warm', '#aaa'],
            ['sft', '#8cd2d9'],
            ['rl', hues[1]],
          ].map(([arm, colour]) => ({
            name: arm,
            colour,
            points: rows
              .filter((row) => row.arm === arm)
              .map((row) => [row.step, row[metric], row.file]),
          }));
          const maximum =
            metric === 'nll' ? Math.ceil(Math.max(...rows.map((row) => row.nll)) * 2) / 2 : 1;
          return (
            <>
              <Recorded file={`observations/scratch/seed-${seed}/rl-history.json`}>
                {(history) => (
                  <>
                    <p>Measured training rollout reward</p>
                    <LinePlot
                      label="Training reward by update"
                      xMaximum={80}
                      series={[
                        {
                          name: 'RL reward',
                          colour: hues[1],
                          points: history.map((row) => [row.step, row.reward_mean]),
                        },
                      ]}
                    />
                  </>
                )}
              </Recorded>
              <p>{names[metric]} · 40 test questions × 16 attempts</p>
              <LinePlot
                label={`Held-out ${names[metric]}`}
                xMaximum={80}
                maximum={maximum}
                series={series}
              />
              <p className="reasoning-legend">
                <span style={{ color: '#aaa' }}>● warm</span>
                <span style={{ color: '#8cd2d9' }}>□ SFT, dashed</span>
                <span style={{ color: hues[1] }}>△ RL, dotted</span>
              </p>
              <ReasoningTable
                caption="All fixed checkpoints for this seed"
                headers={['Method / update', names[metric], 'Recorded file']}
                rows={rows.map((row) => [
                  <span
                    style={{
                      color: row.arm === 'rl' ? hues[1] : row.arm === 'sft' ? '#8cd2d9' : '#aaa',
                    }}
                  >
                    {row.arm} / {row.step}
                  </span>,
                  f(row[metric], 8),
                  row.file,
                ])}
              />
              <p>
                Coincident zero marks keep their exact coordinates. The terminal paired RL bootstrap
                [0, 0] resamples observed zeros; it does not establish zero population uncertainty.
              </p>
              <Controls
                reset={() => {
                  setSeed('17');
                  setMetric('pass1');
                }}
              >
                <Select
                  label="Training seed"
                  value={seed}
                  onChange={setSeed}
                  options={['17', '29', '43'].map((v) => [v, v])}
                />
                <Select
                  label="Held-out measurement"
                  value={metric}
                  onChange={setMetric}
                  options={Object.entries(names)}
                />
              </Controls>
            </>
          );
        }}
      </Recorded>
    </Figure>
  );
}

export function NativeTrace() {
  const [split, setSplit] = useState('train');
  const [index, setIndex] = useState(0);
  const [view, setView] = useState('sample');
  return (
    <Figure id="D18" label="Actual pretrained model completions and separate constructed parity">
      <Recorded file="observations/native/report.json">
        {(report) => {
          const rows = split === 'train' ? report.train_rewards : report.heldout;
          const row = rows[index];
          return (
            <>
              <p>
                Pythia-14m · TRL 1.14.2 · two updates. Available train records: 16; consumed
                questions: 4; train completions: 16. Held-out: 8 questions × 4 attempts.
              </p>
              {view === 'sample' ? (
                <>
                  <p>
                    <strong>{row.id}</strong>
                  </p>
                  <p className="reasoning-raw-text">
                    {row.prompt ||
                      `Solve the arithmetic word problem. End with #### followed by the numeric answer.\nQuestion: ${row.question}\nAnswer:`}
                  </p>
                  <p>Full sampled completion</p>
                  <p className="reasoning-raw-text">{row.completion ?? row.text}</p>
                  <p>Original reference</p>
                  <p className="reasoning-raw-text">{row.reference}</p>
                  <TokenRow values={row.ids} masks={row.ids.map(() => true)} colour={hues[0]} />
                  <p>
                    {row.ids.length} emitted token IDs; actual EOS {row.terminated ? 'yes' : 'no'};
                    reward {row.reward}. T=1, top-p=1, top-k=0, cap 96; group 4, beta 0,
                    per-response reduction.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Constructed reward group {vector(report.parity.rewards)}; advantages{' '}
                    {vector(report.parity.advantages)}. These are objective checks, not observed
                    task rewards.
                  </p>
                  <ReasoningTable
                    caption="Three separately constructed nonzero derivatives"
                    headers={[
                      'Log-ratio shift',
                      'Native loss',
                      'First-EOS mask',
                      'Token-coordinate gradient',
                    ]}
                    rows={report.parity.cases.map((row) => [
                      row.log_ratio_shift,
                      f(row.native_loss, 8),
                      report.parity.completion_mask.map((mask, i) => (
                        <div key={i}>
                          response {i + 1}: {vector(mask)}
                        </div>
                      )),
                      row.gradient.map((r, i) => (
                        <div key={i}>
                          response {i + 1}: {vector(r)}
                        </div>
                      )),
                    ])}
                  />
                </>
              )}
              <p>
                All sampled task rewards are zero. Weights{' '}
                {report.weights_changed ? 'changed' : 'unchanged'}; saved reload{' '}
                {report.saved_reload_exact ? 'exact' : 'not exact'}.
              </p>
              <Controls
                reset={() => {
                  setSplit('train');
                  setIndex(0);
                  setView('sample');
                }}
              >
                <Select
                  label="Evidence view"
                  value={view}
                  onChange={setView}
                  options={[
                    ['sample', 'Actual completions'],
                    ['parity', 'Constructed derivatives'],
                  ]}
                />
                <Select
                  label="Recorded split"
                  value={split}
                  onChange={(value) => {
                    setSplit(value);
                    setIndex(0);
                  }}
                  options={[
                    ['train', 'Training'],
                    ['test', 'Held-out'],
                  ]}
                />
                <NumberField
                  label="Sample index (zero-based)"
                  value={index}
                  min={0}
                  max={rows.length - 1}
                  step={1}
                  onChange={setIndex}
                />
              </Controls>
            </>
          );
        }}
      </Recorded>
    </Figure>
  );
}

export function SampleMatrix() {
  const [count, setCount] = useState(8);
  const questions = [
    { name: 'Q1', truth: 15, values: [12, 15, 12, 12, 15, 12, 12, 12] },
    { name: 'Q2', truth: 18, values: [18, 18, 18, 12, 12, 12, null, null] },
  ];
  return (
    <Figure id="D19" label="Question by sampled-answer matrix">
      <ReasoningTable
        caption="Constructed attempts; correctness is an explicit check mark"
        headers={['Question / truth', ...Array.from({ length: count }, (_, i) => `draw ${i + 1}`)]}
        rows={questions.map((row, i) => [
          <span style={{ color: hues[i] }}>
            {row.name}: {row.truth}
          </span>,
          ...row.values
            .slice(0, count)
            .map((value) => (
              <span style={{ color: hues[i] }}>
                {value === null ? 'invalid' : `${value} ${value === row.truth ? '✓' : '×'}`}
              </span>
            )),
        ])}
      />
      <ReasoningTable
        caption="Sampler success and selector success are different"
        headers={[
          'Question',
          'pass@1',
          'Oracle among all draws',
          'Majority answer',
          'Majority correct',
        ]}
        rows={questions.map((row) => {
          const values = row.values.slice(0, count);
          const successes = values.filter((v) => v === row.truth).length;
          const selected = M.majority(values);
          return [
            row.name,
            f(successes / count),
            Number(successes > 0),
            selected ?? 'none',
            Number(selected === row.truth),
          ];
        })}
      />
      <p>
        Invalid outputs do not vote. Ties use the first occurring answer. All metrics use the same
        visible attempt prefix.
      </p>
      <Controls reset={() => setCount(8)}>
        <NumberField
          label="First n attempts"
          value={count}
          min={1}
          max={8}
          step={1}
          onChange={setCount}
        />
      </Controls>
    </Figure>
  );
}

function subsets(n, k, prefix = [], start = 0) {
  if (prefix.length === k) return [prefix];
  return Array.from({ length: n - start }, (_, i) => start + i).flatMap((i) =>
    subsets(n, k, [...prefix, i], i + 1),
  );
}

export function SubsetCounting() {
  const [correct, setCorrect] = useState(2);
  const [k, setK] = useState(2);
  const groups = subsets(8, k);
  const failures = groups.filter((group) => group.every((i) => i >= correct)).length;
  return (
    <Figure id="D20" label="Count subsets with at least one observed success">
      <TokenRow
        values={Array.from({ length: 8 }, (_, i) => `${i + 1}: ${i < correct ? '✓' : '×'}`)}
      />
      <div
        className="reasoning-subsets"
        aria-label="Every unordered subset of these eight attempts"
      >
        {groups.map((group, i) => (
          <div key={i} className={group.some((v) => v < correct) ? 'reasoning-subset-success' : ''}>
            <span>{group.map((v) => v + 1).join(', ')}</span>
            <strong>{group.some((v) => v < correct) ? '✓ contains success' : '× all fail'}</strong>
          </div>
        ))}
      </div>
      <p>
        {groups.length} total subsets; {failures} failure-only subsets. Estimated pass@{k} = 1 −{' '}
        {failures}/{groups.length} = {f(M.passAtK(8, correct, k))}. These are subsets of existing
        attempts, not new model calls.
      </p>
      <Controls
        reset={() => {
          setCorrect(2);
          setK(2);
        }}
      >
        <NumberField
          label="Correct among eight (c)"
          value={correct}
          min={0}
          max={8}
          step={1}
          onChange={setCorrect}
        />
        <NumberField label="Subset size k" value={k} min={1} max={8} step={1} onChange={setK} />
      </Controls>
    </Figure>
  );
}

function BudgetDrawing({ attempts, budget, selector, truth }) {
  const state = M.budgetPrefix(attempts, budget);
  const vote =
    selector === 'oracle'
      ? state.completed.some((r) => r.correct)
        ? truth
        : null
      : selector === 'first'
        ? state.completed[0]?.terminated === false
          ? null
          : (state.completed[0]?.answer ?? null)
        : M.majority(state.completed.map((r) => (r.terminated === false ? null : r.answer)));
  let spent = 0;
  return (
    <>
      <div className="reasoning-budget">
        {attempts.map((attempt, i) => {
          const available = Math.max(0, Math.min(attempt.tokens, budget - spent));
          spent += attempt.tokens;
          return (
            <div key={i}>
              <span>
                Attempt {i + 1}: {attempt.tokens} tokens
              </span>
              <div
                className="reasoning-budget-track"
                style={{
                  width: `${(attempt.tokens / Math.max(...attempts.map((r) => r.tokens))) * 100}%`,
                }}
              >
                <i
                  style={{ width: `${(available / attempt.tokens) * 100}%` }}
                  className={available < attempt.tokens ? 'reasoning-partial' : ''}
                />
              </div>
              <span>
                {available === attempt.tokens
                  ? 'complete'
                  : available > 0
                    ? `${available} charged, incomplete`
                    : 'not generated'}
              </span>
            </div>
          );
        })}
      </div>
      <p>
        Charged {state.used} tokens; {state.completed.length} complete attempts; {state.partial}{' '}
        partial tokens.{' '}
        {selector === 'oracle'
          ? 'Ground-truth oracle'
          : selector === 'majority'
            ? 'Majority'
            : 'First complete answer'}
        : {vote ?? 'no answer'}; correct {Number(vote === truth)}.
      </p>
      <ReasoningTable
        caption="Full trace records in generation order"
        headers={['Attempt', 'Text', 'Final-correct']}
        rows={attempts.map((r, i) => [i + 1, r.text, Number(r.correct)])}
      />
    </>
  );
}

export function TokenBudget() {
  const [fixture, setFixture] = useState('constructed');
  const [budget, setBudget] = useState(8);
  const [selector, setSelector] = useState('majority');
  const constructed = [
    { tokens: 4, answer: 12, correct: false, text: 'wrong first response' },
    { tokens: 7, answer: 15, correct: true, text: 'correct second response' },
    { tokens: 3, answer: 12, correct: false, text: 'wrong third response' },
  ];
  return (
    <Figure id="D21" label="Hard emitted-token budget with a charged partial attempt">
      {fixture === 'constructed' ? (
        <BudgetDrawing attempts={constructed} budget={budget} selector={selector} truth={15} />
      ) : (
        <Recorded file="observations/scratch/evaluation-17-rl-80.json">
          {(data) => (
            <>
              <p>Recorded seed 17 terminal RL, question {data.rows[0].id}</p>
              <BudgetDrawing
                attempts={data.rows[0].attempts}
                budget={budget}
                selector={selector}
                truth={data.rows[0].truth}
              />
            </>
          )}
        </Recorded>
      )}
      <Controls
        reset={() => {
          setFixture('constructed');
          setBudget(8);
          setSelector('majority');
        }}
      >
        <Select
          label="Attempt stream"
          value={fixture}
          onChange={(v) => {
            setFixture(v);
            setBudget(8);
          }}
          options={[
            ['constructed', 'Constructed 4 / 7 / 3'],
            ['recorded', 'Recorded terminal RL'],
          ]}
        />
        <NumberField
          label="Emitted-token budget"
          value={budget}
          min={0}
          max={fixture === 'constructed' ? 14 : 80}
          step={1}
          onChange={setBudget}
        />
        <Select
          label="Answer selector"
          value={selector}
          onChange={setSelector}
          options={[
            ['first', 'First complete'],
            ['majority', 'Majority'],
            ['oracle', 'Ground-truth oracle'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

function Stage({ name, kind, children }) {
  return (
    <div className="reasoning-stage">
      <CheckpointGlyph
        label={name}
        colour={kind === 'sft' ? '#8cd2d9' : kind === 'rl' ? hues[1] : '#aaa'}
      />
      {kind === 'sft' ? (
        <TokenRow values={['prompt', 'target tokens', 'EOS']} colour="#8cd2d9" />
      ) : kind === 'rl' ? (
        <div className="reasoning-rollout-stack">
          <TokenRow values={['sample 1', '✓ / ×']} colour={hues[0]} />
          <TokenRow values={['sample 2', '✓ / ×']} colour={hues[2]} />
        </div>
      ) : null}
      <p>{children}</p>
    </div>
  );
}

export function TrainingStages() {
  return (
    <Figure id="D22" label="Distinct R1-Zero and multistage R1 systems">
      <p>
        <strong>R1-Zero</strong> · reported v2 route
      </p>
      <div className="reasoning-stage-lane">
        <Stage name="Base checkpoint">Initial weights</Stage>
        <span className="reasoning-stage-arrow">↓ weight update</span>
        <Stage name="Reasoning RL" kind="rl">
          Sample responses → check outcomes → update weights
        </Stage>
      </div>
      <p>
        <strong>R1</strong> · reported v2 route
      </p>
      <div className="reasoning-stage-lane">
        <Stage name="Base checkpoint">Initial weights</Stage>
        <span className="reasoning-stage-arrow">↓ SFT weight update</span>
        <Stage name="Cold-start SFT" kind="sft">
          Demonstration tokens supply a target
        </Stage>
        <span className="reasoning-stage-arrow">↓ RL weight update</span>
        <Stage name="Reasoning RL" kind="rl">
          Verifier feedback changes the policy
        </Stage>
      </div>
      <div className="reasoning-data-handoff">
        <TokenRow
          values={['selected reasoning traces', 'other supervised data']}
          colour="#8cd2d9"
        />
        <p>↓ collected data goes to two distinct weight updates</p>
      </div>
      <div className="reasoning-stage-lane">
        <Stage name="Fresh DeepSeek-V3-Base">Base weights receive the collected targets</Stage>
        <span className="reasoning-stage-arrow">↓ SFT weight update</span>
        <Stage name="R1 supervised stage" kind="sft">
          Train on the selected and other demonstrations
        </Stage>
        <span className="reasoning-stage-arrow">↓ broader feedback</span>
        <Stage name="Broader RL" kind="rl">
          Later feedback extends the recipe
        </Stage>
      </div>
      <p className="reasoning-branch-arrow">
        Separate branch from the collected demonstrations above ↓
      </p>
      <div className="reasoning-stage-lane">
        <Stage name="Separate distilled students" kind="sft">
          Collected demonstrations also train separate student models
        </Stage>
      </div>
      <p>
        Token targets and outcome checks are different data. Array marks show checkpoint artifacts
        schematically; their sizes do not encode model size or accuracy. Source: expanded R1 report,
        sections 2–3.
      </p>
    </Figure>
  );
}

export function TrainingInterventions() {
  const [step, setStep] = useState(8200);
  const state = M.reportedSchedule(step);
  const x = (value) => 45 + (value / 10400) * 520;
  return (
    <Figure id="D23" label="Reported R1-Zero training interventions">
      <SVG width={640} height={200} label="Reported reference refresh and length-cap timeline">
        <line x1={45} x2={565} y1={75} y2={75} stroke="#999" />
        {Array.from({ length: 27 }, (_, i) => (
          <line key={i} x1={x(i * 400)} x2={x(i * 400)} y1={65} y2={85} stroke="#aaa" />
        ))}
        <line x1={x(8200)} x2={x(8200)} y1={30} y2={145} stroke={hues[2]} strokeDasharray="4 3" />
        <circle cx={x(step)} cy={75} r={7} fill="#e7bb72" />
        <text x={45} y={115}>
          0
        </text>
        <text x={x(4000)} y={115} textAnchor="middle">
          4,000
        </text>
        <text x={x(8000)} y={115} textAnchor="end">
          8,000
        </text>
        <text x={565} y={115} textAnchor="end">
          10,400
        </text>
        <text x={45} y={160}>
          cap 32,768
        </text>
        <text x={x(8200) + 8} y={160}>
          65,536
        </text>
        <text x={x(8200)} y={192} textAnchor="middle">
          step 8,200
        </text>
      </SVG>
      <ReasoningTable
        caption="Reported training and evaluation configurations, R1 v2"
        headers={['Role', 'Configuration']}
        rows={[
          [
            'At selected training step',
            `step ${step}; cap ${state.cap.toLocaleString()}; latest reference ${state.reference === 0 ? 'initial checkpoint' : `step ${state.reference}`}`,
          ],
          [
            'Training',
            'G=16; temperature 1; beta .001; learning rate .000003; reference every 400 updates',
          ],
          ['Evaluation', 'temperature .6; top-p .95; cap 32,768'],
        ]}
      />
      <p>
        The cap change at 8,200 is not itself a 400-step reference refresh. This is a configuration
        timeline from v2 G.1/D.1, not a measured performance curve from the local study.
      </p>
      <Controls reset={() => setStep(8200)}>
        <NumberField
          label="Reported training step"
          value={step}
          min={0}
          max={10400}
          step={1}
          onChange={setStep}
        />
      </Controls>
    </Figure>
  );
}

export function CrossingCurves() {
  const [probability, setProbability] = useState(0.01);
  const [count, setCount] = useState(16);
  const current = M.crossing(count, probability);
  const points = Array.from({ length: 64 }, (_, i) => [i + 1, M.crossing(i + 1, probability)]);
  return (
    <Figure id="D24" label="Constructed single-draw improvement and finite coverage reversal">
      <ReasoningTable
        caption="Two equally weighted constructed questions"
        headers={['Policy', 'Question 1 success', 'Question 2 success']}
        rows={[
          ['Base', 0.2, 0.2],
          ['Changed', 0.8, probability],
        ]}
      />
      <LinePlot
        label="Exact probability of at least one success versus number of attempts"
        xMaximum={64}
        xLabel="independent attempts k"
        cursor={count}
        series={[
          { name: 'base', colour: hues[0], points: points.map(([k, row]) => [k, row.base]) },
          { name: 'changed', colour: hues[1], points: points.map(([k, row]) => [k, row.changed]) },
        ]}
      />
      <p className="reasoning-legend">
        <span style={{ color: hues[0] }}>● base</span>
        <span style={{ color: hues[1] }}>□ changed</span>
      </p>
      <p>
        At {count} independent attempts: base {f(current.base)}, changed {f(current.changed)}. The
        horizontal coordinate is number of attempts k, not training updates. Exact calculation, not
        a benchmark observation.
      </p>
      <Controls
        reset={() => {
          setProbability(0.01);
          setCount(16);
        }}
      >
        <NumberField
          label="Changed policy, question 2 success"
          value={probability}
          min={0}
          max={1}
          onChange={setProbability}
        />
        <NumberField
          label="Inspect attempt count k"
          value={count}
          min={1}
          max={64}
          step={1}
          onChange={setCount}
        />
      </Controls>
    </Figure>
  );
}

export function ObservedSets() {
  const [identity, setIdentity] = useState('1');
  const [base, setBase] = useState([1, 2, 3, 4]);
  const [changed, setChanged] = useState([3, 4, 5]);
  const cells = M.observedSets(base, changed);
  const toggle = (values, setter, include) =>
    setter(include ? [...values, Number(identity)] : values.filter((v) => v !== Number(identity)));
  return (
    <Figure id="D25" label="Observed solved sets at a fixed finite budget">
      <div className="reasoning-set-matrix">
        {Object.entries(cells).map(([key, ids], index) => (
          <div key={key}>
            <p>
              {
                {
                  both: 'Both observed',
                  base: 'Base only',
                  changed: 'Changed only',
                  neither: 'Neither observed',
                }[key]
              }
              : {ids.length}
            </p>
            <div className="reasoning-family-dots">
              {ids.length ? (
                ids.map((id) => (
                  <span key={id} style={{ color: hues[(id - 1) % 3] }}>
                    Q{id}
                  </span>
                ))
              ) : (
                <span>0</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p>
        Constructed observations under 16 attempts per question. Dots count question identities;
        cell areas have no quantitative meaning. “Neither observed” does not mean impossible.
      </p>
      <Controls
        reset={() => {
          setIdentity('1');
          setBase([1, 2, 3, 4]);
          setChanged([3, 4, 5]);
        }}
      >
        <Select
          label="Question identity"
          value={identity}
          onChange={setIdentity}
          options={Array.from({ length: 8 }, (_, i) => [String(i + 1), `Q${i + 1}`])}
        />
        <Toggle
          label="Base observed a success"
          value={base.includes(Number(identity))}
          onChange={(value) => toggle(base, setBase, value)}
        />
        <Toggle
          label="Changed observed a success"
          value={changed.includes(Number(identity))}
          onChange={(value) => toggle(changed, setChanged, value)}
        />
      </Controls>
    </Figure>
  );
}

export function TeacherInformation() {
  return (
    <Figure id="D26" label="Teacher demonstrations introduce new information">
      <p>Constructed question: (2 + 3) × 3. The teacher trace below exposes sum 5 and answer 15.</p>
      <div className="reasoning-stage-lane">
        <Stage name="Student exploration" kind="rl">
          All observed rewards zero within the finite budget
        </Stage>
        <span className="reasoning-stage-arrow">↓ request a trace</span>
        <div className="reasoning-stage">
          <TokenRow values={['teacher: SUM', 5, 'ANSWER', 15, 'EOS']} colour="#8cd2d9" />
          <p>External demonstration supplies target tokens</p>
          <p>Teacher failure → no usable demonstration</p>
        </div>
        <span className="reasoning-stage-arrow">↓ demonstration tokens → SFT weight update</span>
        <Stage name="Student SFT bridge" kind="sft">
          New target information changes the student weights
        </Stage>
        <span className="reasoning-stage-arrow">↓ sample again</span>
        <Stage name="Fresh student RL" kind="rl">
          Generate fresh student attempts, then check their outcomes
        </Stage>
      </div>
      <p>
        Constructed mechanism. Boundary-Aware Curriculum RL (2026 preprint) uses a 256-sample
        exploration boundary and a teacher/SFT bridge. No reward gradient is drawn through the
        teacher. A finite miss is not zero policy support.
      </p>
    </Figure>
  );
}

export function EvidenceDiagnosis() {
  const [symptom, setSymptom] = useState('transfer');
  const cases = {
    format: {
      artifact: 'sum = 5; answer =',
      observation: 'Finite grammar rejects the incomplete answer.',
      next: 'Inspect tokenizer boundaries, prompt format and raw text before changing the reward.',
    },
    cap: {
      artifact: 'sum = 5; answer = 15 (no EOS)',
      observation: 'Correct visible number; reward 0 because actual termination is required.',
      next: 'Measure cap-cut frequency and compare the intended termination contract.',
    },
    contrast: {
      artifact: 'Recorded native run: 16 training completions, all rewards 0',
      observation: 'No group has reward contrast; saved tensor weights are unchanged.',
      next: 'Inspect full raw completions and model/task compatibility; preserve the zero-signal observation.',
    },
    transfer: {
      artifact: 'Seed 17: mean train rollout reward .985546875; terminal test 0/640',
      observation: 'Good training-family reward does not transfer to the held-out families.',
      next: 'Inspect family coverage and representation on development data before more updates.',
    },
    derivation: {
      artifact: 'Recorded seed 29 terminal SFT: sum = 56; answer = 12 for (1+5)×2',
      observation: 'Final-answer match with an invalid displayed sum and product.',
      next: 'Compare the requested property with the final-only reward, then predeclare any process-reward change.',
    },
    length: {
      artifact:
        'Constructed countercase: add repeated filler while preserving the same final answer',
      observation: 'Emitted-token cost rises without changing arithmetic correctness.',
      next: 'Inspect tokens, caps and selected subsets; compare under one emitted-token budget.',
    },
  };
  const current = cases[symptom];
  return (
    <Figure id="D27" label="Diagnose the failed link using inspectable evidence">
      <p className="reasoning-literal">
        <code>{current.artifact}</code>
      </p>
      <dl className="reasoning-diagnosis">
        <dt>What the artifact establishes</dt>
        <dd>{current.observation}</dd>
        <dt>Next measurement</dt>
        <dd>{current.next}</dd>
      </dl>
      <Controls reset={() => setSymptom('transfer')}>
        <Select
          label="Observed failure"
          value={symptom}
          onChange={setSymptom}
          options={[
            ['format', 'Invalid format'],
            ['cap', 'Missing EOS'],
            ['contrast', 'No reward contrast'],
            ['transfer', 'Failed transfer'],
            ['derivation', 'False derivation'],
            ['length', 'Longer output'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
