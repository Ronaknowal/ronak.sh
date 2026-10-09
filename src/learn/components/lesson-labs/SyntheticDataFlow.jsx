import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import {
  COLORS,
  BASE,
  TOKEN_NAMES,
  sampling,
  inverseCDF,
  sequence,
  selection,
  selectedMass,
  familyExposure,
  mixBatch,
  windows,
  populationPath,
  populationEnsemble,
  expectedH,
  costLedger,
} from '../../data/synthetic-data-models.js';
import './synthetic-data-flow.css';

const n = (x, digits = 4) => (x === null ? 'undefined' : flowNumber(x, digits));
const color = (i) => COLORS[((i % COLORS.length) + COLORS.length) % COLORS.length];
const asset = '/learn-code/synthetic-data/';
const cache = new Map();

function Figure({ id, label, children, note }) {
  return (
    <figure className="synthetic-figure" data-synthetic-figure={id} aria-label={label}>
      {children}
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
function Reset({ action }) {
  return (
    <button type="button" onClick={action}>
      Reset example
    </button>
  );
}
function Scroll({ label, children }) {
  const ref = useRef(null),
    cue = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const measure = () => setOverflow(ref.current.scrollWidth > ref.current.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    for (const child of ref.current.children) observer.observe(child);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div>
      <div
        className="synthetic-scroll"
        ref={ref}
        role="region"
        tabIndex={0}
        aria-label={label}
        aria-describedby={overflow ? cue : undefined}
      >
        {children}
      </div>
      {overflow && (
        <p className="synthetic-cue" id={cue}>
          ↔ More of the drawing: scroll sideways, or focus it and use arrow keys.
        </p>
      )}
    </div>
  );
}
function Table({ label, heads, rows }) {
  return (
    <Scroll label={label}>
      <table className="synthetic-table">
        <caption>{label}</caption>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) =>
                j ? (
                  <td key={j} className={typeof value === 'number' || (typeof value === 'string' && /^[−+\d.,/% ()]+$/.test(value)) ? 'synthetic-numeric' : undefined}>{value}</td>
                ) : (
                  <th scope="row" key={j}>
                    {value}
                  </th>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
function Choice({ label, options, value, change }) {
  return <FlowChoice label={label} options={options} value={value} onChange={change} />;
}
function Select({ label, options, value, change }) {
  const id = useId();
  return (
    <label className="synthetic-select" htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => change(event.target.value)}>
        {options.map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
function Token({ index = 0, children, selected = false, muted = false }) {
  return (
    <span
      className={`synthetic-token ${selected ? 'is-selected' : ''} ${muted ? 'is-muted' : ''}`}
      style={{ '--identity': color(index) }}
    >
      {children}
    </span>
  );
}
function Bars({ values, labels, max = 1, title, signed = false }) {
  return (
    <div className="synthetic-bars" aria-label={title}>
      {title && <p>{title}</p>}
      {values.map((value, i) => (
        <div className="synthetic-bar-row" key={labels[i]}>
          <span style={{ color: color(i) }}>{labels[i]}</span>
          <div className={`synthetic-bar-track ${signed ? 'is-signed' : ''}`}>
            <span
              style={{
                background: color(i),
                width: `${(Math.abs(value) / max) * (signed ? 50 : 100)}%`,
                marginLeft: signed ? `${value < 0 ? 50 - (Math.abs(value) / max) * 50 : 50}%` : 0,
              }}
            />
          </div>
          <output>{n(value, 6)}</output>
        </div>
      ))}
    </div>
  );
}
function Network({ title, fixed = false, index = 2 }) {
  return (
    <div className="synthetic-network">
      <strong>{title}</strong>
      <svg
        viewBox="0 0 200 105"
        role="img"
        aria-label={`${title}: two hidden stages and output; schematic, not actual weight values`}
      >
        {[0, 1].flatMap((layer) =>
          [0, 1, 2].flatMap((a) =>
            [0, 1, 2].map((b) => (
              <line
                key={`${layer}-${a}-${b}`}
                x1={25 + 75 * layer}
                y1={22 + 30 * a}
                x2={100 + 75 * layer}
                y2={22 + 30 * b}
                stroke={color(index)}
                opacity=".35"
              />
            )),
          ),
        )}
        {[0, 1, 2].flatMap((layer) =>
          [0, 1, 2].map((row) => (
            <circle
              key={`${layer}-${row}`}
              cx={25 + 75 * layer}
              cy={22 + 30 * row}
              r="7"
              fill={color(index)}
            />
          )),
        )}
      </svg>
      <span>{fixed ? 'θ fixed · generate text' : 'θ changes · predict targets'}</span>
    </div>
  );
}
function Data({ files, children }) {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, retry] = useState(0);
  const key = files.join('|');
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    const load = (name) => {
      if (!cache.has(name))
        cache.set(
          name,
          fetch(asset + name)
            .then((r) => {
              if (!r.ok) throw new Error(`Could not load ${name} (${r.status})`);
              return r.json();
            })
            .catch((error) => {
              cache.delete(name);
              throw error;
            }),
        );
      return cache.get(name);
    };
    Promise.all(key.split('|').map(load))
      .then((values) => {
        if (live) setState({ status: 'ready', values });
      })
      .catch((error) => {
        if (live) setState({ status: 'failed', error: error.message });
      });
    return () => {
      live = false;
    };
  }, [key, attempt]);
  if (state.status === 'failed')
    return (
      <p role="alert">
        {state.error}.{' '}
        <button type="button" onClick={() => retry((x) => x + 1)}>
          Retry recorded data
        </button>
      </p>
    );
  if (state.status !== 'ready') return <p role="status">Loading recorded observations…</p>;
  return children(...state.values);
}

function SourceJourney() {
  const [kind, setKind] = useState('rewrite');
  const alternatives = {
    copy: 'A longer pendulum takes more time per swing.',
    rewrite: 'Lengthening a pendulum makes each swing take longer.',
    invention: 'A heavier pendulum always swings faster.',
  };
  return (
    <Figure
      id="S01"
      label="A source changes the corpus; a separate model learns"
      note="Constructed pendulum example. The network sketches show parameter owners, not measured weights."
    >
      <div className="synthetic-journey">
        <div className="synthetic-sheet" style={{ '--identity': color(0) }}>
          <strong>Source A</strong>
          <p>A longer pendulum takes more time per swing.</p>
        </div>
        <div className="synthetic-arrow">↓ source-conditioned prompt</div>
        <Network title="Generator" fixed index={1} />
        <div className="synthetic-arrow">↓ emitted text</div>
        <div className="synthetic-sheet" style={{ '--identity': color(0) }}>
          <strong>A · {kind}</strong>
          <p>{alternatives[kind]}</p>
          <span>
            {kind === 'copy'
              ? 'Same sequence'
              : kind === 'invention'
                ? 'Unsupported change'
                : 'Changed wording'}
          </span>
        </div>
        <div className="synthetic-arrow">↓ selected training targets</div>
        <Network title="Student" />
        <div className="synthetic-targets">
          {alternatives[kind].split(' ').map((t, i) => (
            <Token key={i}>{t}</Token>
          ))}
          <span>→ next-token loss → update θ</span>
        </div>
      </div>
      <div className="synthetic-evaluation">
        <Token index={3}>Untouched source B</Token>
        <span>→ student evaluation loss only · no training arrow</span>
      </div>
      <FlowControls>
        <Choice
          label="Generated record"
          options={Object.keys(alternatives).map((k) => [k, k])}
          value={kind}
          change={setKind}
        />
        <Reset action={() => setKind('rewrite')} />
      </FlowControls>
    </Figure>
  );
}
function TargetMask() {
  const [answerOnly, setAnswerOnly] = useState(false);
  const [initialization, setInitialization] = useState('random');
  return (
    <Figure id="S02" label="Identical QA text with different prediction targets">
      <Scroll label="Aligned QA input, target, and loss masks">
        <div className="synthetic-token-matrix">
          <span>Input at t</span>
          {['BOS', 'Q:', 'Why?', 'A:'].map((x, i) => (
            <Token index={i < 3 ? 0 : 1} key={i}>
              {x}
            </Token>
          ))}
          <span>Predict t + 1</span>
          {['Q:', 'Why?', 'A:', 'Because.'].map((x, i) => (
            <Token index={i < 2 ? 0 : 1} key={i}>
              {x}
            </Token>
          ))}
          <span>Target selected</span>
          {[0, 1, 2, 3].map((i) => (
            <strong key={i}>{answerOnly && i < 2 ? '0 · ignored' : '1 · included'}</strong>
          ))}
          <span>Token NLL</span>
          {[1, 2, 3, 4].map((v, i) => (
            <span key={i}>{answerOnly && i < 2 ? <s>{v}</s> : v} nats</span>
          ))}
        </div>
      </Scroll>
      <FlowReadout>
        {answerOnly ? '(3 + 4) / 2 = 3.5' : '(1 + 2 + 3 + 4) / 4 = 2.5'} nats per selected target.
        Initialization: {initialization}; it does not determine this mask.
      </FlowReadout>
      <FlowControls>
        <Choice
          label="Loss targets"
          value={answerOnly}
          change={setAnswerOnly}
          options={[
            [false, 'All tokens'],
            [true, 'Answer only'],
          ]}
        />
        <Choice
          label="Initial parameters"
          value={initialization}
          change={setInitialization}
          options={['random', 'pretrained'].map((x) => [x, x])}
        />
        <Reset
          action={() => {
            setAnswerOnly(false);
            setInitialization('random');
          }}
        />
      </FlowControls>
    </Figure>
  );
}
function PromptCommitments() {
  const [period, setPeriod] = useState(2);
  return (
    <Figure id="S03" label="Trace source commitments into fixed derived claims" note="Authored text records, not a physical simulation or live teacher output. Editing a record tests consistency with its saved derivative, not whether the edited physics is true.">
      <div className="synthetic-sheet" style={{'--identity':color(0)}}><strong>Source A · {period === 2 ? 'original version' : 'edited version'}</strong>
        <p>A pendulum of <Token index={0}>length 1 m</Token> makes <Token index={1}>one small-angle oscillation</Token> in <Token index={2}>about {period} seconds</Token> <Token index={3}>near Earth’s surface</Token>.</p></div>
      <div className="synthetic-correspondence">
        {[
          ['Length', '1 m', 'one-metre pendulum', 0],
          ['Motion', 'small-angle oscillation', 'small swing', 1],
          ['Period', `about ${period} seconds`, 'roughly 2 seconds', 2],
          ['Condition', 'near Earth’s surface', 'near Earth’s surface', 3],
        ].map(([label,source,output,index])=><div key={label}><span><b>{label}</b><Token index={index}>{source}</Token></span><span aria-hidden="true">→</span><span><Token index={index}>{output}</Token>{index === 2 && period !== 2 && <strong className="synthetic-stale">≠ stale output</strong>}</span></div>)}
      </div>
      <p>Fixed derivative A-plain · parent: A / original version. Its four claims keep their correspondence colours.</p>
      <div className="synthetic-two"><div><strong>Omitted conditions</strong><p>“Every pendulum takes exactly 2 seconds.”</p><p>✕ Length, small-angle condition, location and approximation disappeared.</p></div><div><strong>Unsupported addition</strong><p>“Heavier pendulums move faster.”</p><p>✕ No source span supplies a mass comparison.</p></div></div>
      <FlowControls>
        <FlowSlider name="Period in edited source, seconds" value={period} min={2} max={3} step={.5} onChange={setPeriod}/>
        <Reset action={()=>setPeriod(2)}/>
      </FlowControls>
      <FlowReadout>{period === 2 ? 'Source period and saved derivative agree.' : `Source now says ${period} seconds; saved output still says 2. The parent version must be checked before reuse.`}</FlowReadout>
    </Figure>
  );
}
function GenerationRoutes() {
  const [route, setRoute] = useState('source');
  const [parent, setParent] = useState('A');
  const [style, setStyle] = useState('plain');
  const sources = {A:'A longer pendulum takes more time per small-angle swing near Earth’s surface.', B:'At standard atmospheric pressure, pure water boils at about 100 degrees Celsius.'};
  const identity = parent === 'A' ? 0 : 1;
  return (
    <Figure id="S04" label="Sources of synthetic records">
      <div className="synthetic-sheet" style={{'--identity':color(identity)}}><strong>Source {parent} · version 1</strong><p>{sources[parent]}</p></div>
      <div className="synthetic-arrow">{route === 'source' ? '↓ supplied evidence + requested form' : '✕ source edge absent for this route'}</div>
      <div className="synthetic-prompt"><strong>Exact constructed request</strong><p>{route === 'source' ? `${style === 'plain' ? 'Rewrite this account in plain English' : 'Write one question and its answer using this account'}. Preserve its conditions; add no facts. Source ${parent}: ${sources[parent]}` : route === 'seed' ? `Create ${style === 'plain' ? 'a plain explanation' : 'a question and answer'} about ${parent === 'A' ? 'pendulums' : 'boiling water'}. No source passage is supplied.` : `Construct (2 + 3) × 4; evaluate its exact arithmetic. Render ${style === 'plain' ? 'a plain worked explanation' : 'a question and answer'}.`}</p></div>
      <div className="synthetic-arrow">↓ {route === 'procedure' ? 'exact evaluator' : 'fixed generator'} → candidate {style === 'plain' ? 'prose' : 'question + answer'} → checking</div>
      <div className="synthetic-route-grid">
        {['source', 'seed', 'procedure'].map((r, i) => (
          <div
            key={r}
            className={r === route ? 'is-selected' : ''}
            style={{ '--identity': color(i) }}
          >
            <strong>{['Source-conditioned', 'Seed-expanded', 'Procedural'][i]}</strong>
            <div className="synthetic-route-object">
              {r === 'source' ? (
                <>
                  <Token>A paragraph</Token>
                  <span>→ generator → rewrite</span>
                </>
              ) : r === 'seed' ? (
                <>
                  <Token index={1}>Example question</Token>
                  <span>→ generator → new questions</span>
                </>
              ) : (
                <>
                  <span className="synthetic-expression">(a + b) × c</span>
                  <span>→ exact evaluator → answer</span>
                </>
              )}
            </div>
            <p>
              {
                [
                  'Preserve named source commitments.',
                  'Check novelty and factual premises.',
                  'Certify only the declared grammar.',
                ][i]
              }
            </p>
          </div>
        ))}
      </div>
      <FlowControls>
        <Choice label="Source identity" value={parent} change={setParent} options={[['A','A · pendulum'],['B','B · water']]}/>
        <Choice label="Requested form" value={style} change={setStyle} options={[['plain','Plain explanation'],['qa','Question and answer']]}/>
        <Choice
          label="Inspect route"
          options={[
            ['source', 'Source'],
            ['seed', 'Seed'],
            ['procedure', 'Procedure'],
          ]}
          value={route}
          change={setRoute}
        />
        <Reset action={()=>{setRoute('source');setParent('A');setStyle('plain')}}/>
      </FlowControls>
      <FlowReadout>
        {route === 'source' ? `Parent A/B relation: this candidate retains parent ${parent}, version 1. ` : 'No source-conditioned parent is claimed. '}
        {route === 'procedure'
          ? 'An answer follows from exact operations; coverage remains limited to this generated task family.'
          : 'The generator supplies a candidate. Its fluency does not certify a preserved fact.'}
      </FlowReadout>
    </Figure>
  );
}
function Nucleus() {
  const [temperature, setTemperature] = useState(1),
    [topP, setTopP] = useState(0.8);
  const state = sampling(BASE, temperature, topP);
  let sum = 0;
  return (
    <Figure id="S05" label="Temperature changes probabilities; nucleus sampling changes support">
      <div className="synthetic-two">
        <Bars
          values={state.probabilities}
          labels={TOKEN_NAMES}
          title="Temperature-adjusted probability"
        />
        <Bars
          values={state.nucleus}
          labels={TOKEN_NAMES}
          title="Retained and renormalized probability"
        />
      </div>
      <Table
        label="Descending probability order and boundary crossing"
        heads={['Token', 'Mass', 'Cumulative mass', 'Retain?']}
        rows={state.order.map((i) => {
          sum += state.probabilities[i];
          return [
            <Token index={i}>{TOKEN_NAMES[i]}</Token>,
            n(state.probabilities[i]),
            n(sum),
            state.kept.includes(i) ? 'Yes' : 'No',
          ];
        })}
      />
      <FlowReadout>
        Keep {state.kept.length} tokens with total mass {n(state.retainedMass)}. The token that
        crosses {n(topP)} stays. Then divide each retained mass by {n(state.retainedMass)}.
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Temperature"
          min={0.2}
          max={2}
          step={0.1}
          value={temperature}
          onChange={setTemperature}
        />
        <FlowSlider
          name="Nucleus mass p"
          min={0.1}
          max={1}
          step={0.05}
          value={topP}
          onChange={setTopP}
        />
        <Reset
          action={() => {
            setTemperature(1);
            setTopP(0.8);
          }}
        />
      </FlowControls>
    </Figure>
  );
}
function CDF() {
  const [u, setU] = useState(0.8),
    [second, setSecond] = useState(0.8);
  const masses = sampling().nucleus,
    token = inverseCDF(masses, u);
  const result = sequence([u, second]);
  return (
    <Figure id="S06" label="Uniform draws select half-open token intervals">
      <div className="synthetic-ruler" aria-label="Inverse CDF over original token order">
        {masses.map(
          (p, i) =>
            p > 0 && (
              <span key={i} style={{ width: `${p * 100}%`, background: color(i) }}>
                {TOKEN_NAMES[i]} · {n(p)}
              </span>
            ),
        )}
        <i style={{ left: `${u * 100}%` }} />
        <strong style={{ left: `clamp(3em, ${u * 100}%, calc(100% - 3em))`, transform: 'translateX(-50%)' }}>u = {n(u)}</strong>
      </div>
      <div className="synthetic-axis">
        <span>0</span>
        <span className="synthetic-boundary">0.6875</span>
        <span>1 · excluded endpoint</span>
      </div>
      <FlowReadout>
        The single-step .8 nucleus selects <Token index={token}>{TOKEN_NAMES[token]}</Token>.
        Zero-mass entries have no interval.
      </FlowReadout>
      <Table
        label="Autoregressive lookup fixture, nucleus .9"
        heads={['Step', 'Previous token', 'Current masses', 'Draw', 'Append']}
        rows={result.rows.map((row, i) => [
          i + 1,
          TOKEN_NAMES[row.previous],
          row.probabilities.map((p) => n(p, 3)).join(' / '),
          row.u,
          <Token index={row.token}>{TOKEN_NAMES[row.token]}</Token>,
        ])}
      />
      <FlowReadout>
        Termination: {result.termination}. The second row uses the first sampled token's conditional
        distribution.
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="First uniform draw"
          min={0}
          max={0.999}
          step={0.001}
          value={u}
          onChange={setU}
        />
        <FlowSlider
          name="Second uniform draw"
          min={0}
          max={0.999}
          step={0.001}
          value={second}
          onChange={setSecond}
        />
        <Reset
          action={() => {
            setU(0.8);
            setSecond(0.8);
          }}
        />
      </FlowControls>
    </Figure>
  );
}
function Arithmetic() {
  const [step, setStep] = useState(6),
    [answer, setAnswer] = useState(20);
  return (
    <Figure id="S07" label="An exact expression tree and separately checked proposed steps">
      <Scroll label="Expression tree">
        <svg
          className="synthetic-drawing"
          viewBox="0 0 640 220"
          role="img"
          aria-label="2 plus 3 equals 5; multiply 5 by 4 equals 20; compare candidate steps separately"
        >
          {[
            [75, 45, 155, 95],
            [235, 45, 155, 95],
            [155, 115, 260, 165],
            [370, 95, 260, 165],
          ].map((p, i) => (
            <line key={i} x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke="#9299a2" />
          ))}
          {[
            [75, 35, '2'],
            [235, 35, '3'],
            [155, 105, '+ = 5'],
            [370, 85, '4'],
            [260, 175, '× = 20'],
          ].map(([x, y, text], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={text.length > 2 ? 35 : 24}
                fill="#15171c"
                stroke={color(i < 3 ? 0 : 1)}
              />
              <text x={x} y={y + 6} textAnchor="middle" fill={color(i < 3 ? 0 : 1)}>
                {text}
              </text>
            </g>
          ))}
          <text x="450" y="70" fill="#eee">
            Exact evaluation
          </text>
          <text x="450" y="103" fill={color(2)}>
            rational arithmetic
          </text>
          <text x="450" y="136" fill="#eee">
            (2 + 3) × 4 = 20
          </text>
        </svg>
      </Scroll>
      <Table
        label="Candidate checks are different questions"
        heads={['Candidate claim', 'Check', 'Result']}
        rows={[
          [`2 + 3 = ${step}`, 'Equality of both sides', step === 5 ? 'Valid' : 'False'],
          [
            `${step} × 4 = ${answer}`,
            'Equality of both sides',
            step * 4 === answer ? 'Valid' : 'False',
          ],
          [
            `Final answer ${answer}`,
            'Matches exact task answer',
            answer === 20 ? 'Correct' : 'Incorrect',
          ],
        ]}
      />
      <FlowControls>
        <FlowSlider
          name="Claimed first result"
          min={4}
          max={7}
          step={1}
          value={step}
          onChange={setStep}
        />
        <FlowSlider
          name="Final answer"
          min={16}
          max={28}
          step={1}
          value={answer}
          onChange={setAnswer}
        />
        <Reset
          action={() => {
            setStep(6);
            setAnswer(20);
          }}
        />
      </FlowControls>
      <FlowReadout>
        {answer === 20 && step !== 5
          ? 'The final answer passes while the intermediate derivation fails.'
          : 'Even true equalities do not by themselves establish that the steps form a complete proof.'}
      </FlowReadout>
    </Figure>
  );
}
function ConfusionPopulation() {
  const [prevalence, setPrevalence] = useState(0.6),
    [tpr, setTpr] = useState(0.9),
    [fpr, setFpr] = useState(0.2);
  const s = selection(prevalence, tpr, fpr);
  return (
    <Figure id="S08" label="Population mass before and after filtering">
      <div
        className="synthetic-population"
        aria-label="100 candidate-equivalents; outlines indicate acceptance"
      >
        {Array.from({ length: 100 }, (_, i) => {
          const correct = i < prevalence * 100;
          const rank = correct ? i : i - prevalence * 100;
          const accepted = rank < Math.round((correct ? s.tp : s.fp) * 100);
          return (
            <span
              key={i}
              style={{ '--identity': color(correct ? 0 : 1) }}
              className={accepted ? 'accepted' : ''}
              title={`${correct ? 'Correct' : 'Incorrect'} class; ${accepted ? 'accepted' : 'rejected'} mass`}
            />
          );
        })}
      </div>
      <p>
        <Token>Correct class</Token> <Token index={1}>Incorrect class</Token> · outline = selected.
        Fractional cells are rounded for drawing; exact masses are below.
      </p>
      <Table
        label="Exact expected candidates out of 100"
        heads={['Class', 'Accepted', 'Rejected']}
        rows={[
          [<Token>Correct</Token>, n(s.tp * 100), n(s.fn * 100)],
          [<Token index={1}>Incorrect</Token>, n(s.fp * 100), n(s.tn * 100)],
        ]}
      />
      <FlowReadout>
        Keep {n(s.acceptance * 100)} / 100. Precision ={' '}
        {s.acceptance
          ? `${n(s.tp * 100)} / ${n(s.acceptance * 100)} = ${n(s.precision)}`
          : 'undefined: no candidate is accepted'}
        . Recall = {n(s.recall)}.
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Correct prevalence"
          min={0}
          max={1}
          step={0.1}
          value={prevalence}
          onChange={setPrevalence}
        />
        <FlowSlider
          name="True-positive rate"
          min={0}
          max={1}
          step={0.1}
          value={tpr}
          onChange={setTpr}
        />
        <FlowSlider
          name="False-positive rate"
          min={0}
          max={1}
          step={0.1}
          value={fpr}
          onChange={setFpr}
        />
        <Reset
          action={() => {
            setPrevalence(0.6);
            setTpr(0.9);
            setFpr(0.2);
          }}
        />
      </FlowControls>
    </Figure>
  );
}
function SelectionSupport() {
  const [minority, setMinority] = useState(0);
  const q = [0.6, 0.3, 0.1],
    a = [1, 0.5, minority],
    s = selectedMass(q, a);
  return (
    <Figure id="S09" label="Selection reweights category support">
      <div className="synthetic-two">
        <Bars values={q} labels={['A', 'B', 'C']} title="Generator category masses q" />
        <Bars
          values={s.conditional}
          labels={['A', 'B', 'C']}
          title="Selected category masses q × a / Z"
        />
      </div>
      <Table
        label="The selection calculation"
        heads={['Category', 'q', 'Accept a', 'Joint mass q × a', 'Conditional mass']}
        rows={q.map((p, i) => [
          <Token index={i}>{'ABC'[i]}</Token>,
          p,
          a[i],
          n(s.joint[i]),
          n(s.conditional[i]),
        ])}
      />
      <FlowReadout>
        Z = {n(s.total)}.{' '}
        {minority === 0
          ? 'Category C disappears entirely, although the generator could produce it.'
          : `Category C retains mass ${n(s.conditional[2])}.`}
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Accept category C"
          min={0}
          max={1}
          step={0.1}
          value={minority}
          onChange={setMinority}
        />
        <Reset action={() => setMinority(0)} />
      </FlowControls>
    </Figure>
  );
}
function Families() {
  const [leak, setLeak] = useState(true),
    [bridge, setBridge] = useState(false),
    [together, setTogether] = useState(false);
  return (
    <Figure id="S10" label="Parent and duplicate relations determine split groups">
      <Scroll label="Source-family graph">
        <svg
          className="synthetic-drawing"
          viewBox="0 0 680 265"
          role="img"
          aria-label={`Source A has rewrites A1 and A2, source B has B1. ${leak ? 'A2 crosses the split' : 'Family A is together'}. ${bridge ? 'A2 duplicates B1, joining both families' : 'Families are disconnected'}.`}
        >
          <path
            d={`M140 58 L90 150 ${leak ? '' : 'M140 58 L280 150'} M520 58 L530 150`}
            stroke="#a2a6ae"
            strokeWidth="2"
            fill="none"
          />
          <line
            x1={together ? 650 : 355}
            y1="0"
            x2={together ? 650 : 355}
            y2="255"
            stroke="#b9bdc5"
            strokeDasharray="7 6"
          />
          <text x="50" y="245" fill="#ddd">
            {together ? 'Whole connected component in train' : 'Train partition'}
          </text>
          <text x="440" y="245" fill="#ddd">
            {together ? '' : 'Held-out partition'}
          </text>
          {[
            [140, 40, 'A', 0],
            [90, 170, 'A1', 0],
            [leak ? 430 : 280, 170, 'A2', 0],
            [520, 40, 'B', 1],
            [530, 170, 'B1', 1],
          ].map(([x, y, name, identity]) => (
            <g key={name}>
              <rect
                x={x - 33}
                y={y - 23}
                width="66"
                height="46"
                rx="3"
                fill="#15171c"
                stroke={color(identity)}
                strokeWidth="2"
              />
              <text x={x} y={y + 6} textAnchor="middle" fill={color(identity)}>
                {name}
              </text>
            </g>
          ))}
          {leak && (
            <path d="M140 63 Q320 55 430 147" stroke={color(0)} strokeWidth="2" fill="none" />
          )}
          {bridge && (
            <>
              <path
                d={`M${leak ? 463 : 313} 180 Q420 222 497 180`}
                stroke={color(2)}
                strokeDasharray="4 3"
                fill="none"
              />
              <text x="345" y="223" fill={color(2)}>
                duplicate edge
              </text>
            </>
          )}
        </svg>
      </Scroll>
      <FlowReadout>
        {together
          ? 'All five records belong to train. The duplicate-connected component is intact; evaluate on another untouched component.'
          : bridge
            ? 'The duplicate edge joins A and B into one connected component. Both complete families must receive one partition.'
            : leak
              ? 'A trains the student while its rewrite A2 is held out. This family leaks across the split.'
              : 'A, A1 and A2 stay in train. B and B1 stay held out; the disconnected family split is consistent.'}
      </FlowReadout>
      <FlowControls>
        <Choice
          label="A2 placement"
          options={[
            [true, 'Across split'],
            [false, 'With its parent'],
          ]}
          value={leak}
          change={(value) => {
            setLeak(value);
            setTogether(false);
          }}
        />
        <Choice
          label="Duplicate relation"
          options={[
            [false, 'Absent'],
            [true, 'A2 equals B1'],
          ]}
          value={bridge}
          change={(value) => {
            setBridge(value);
            setTogether(false);
          }}
        />
        {bridge && (
          <button
            type="button"
            onClick={() => {
              setLeak(false);
              setTogether(true);
            }}
          >
            Group the whole component
          </button>
        )}
        <Reset
          action={() => {
            setLeak(true);
            setBridge(false);
            setTogether(false);
          }}
        />
      </FlowControls>
    </Figure>
  );
}
function FamilyCounts() {
  const [count, setCount] = useState(3);
  const state = familyExposure(count);
  return (
    <Figure id="S11" label="Distinct strings can concentrate on one source family">
      <div className="synthetic-family-rows">
        <strong>Family A</strong>
        <div>
          {Array.from({ length: count }, (_, i) => (
            <Token key={i}>A{i + 1}</Token>
          ))}
        </div>
        <strong>Family B</strong>
        <div>
          <Token index={1}>B1</Token>
        </div>
      </div>
      <Bars
        values={state.weights}
        labels={['A exposure', 'B exposure']}
        title="Equal-record sampling weights"
      />
      <FlowReadout>
        {count + 1} distinct constructed strings; two source families. Effective weighted family
        count = 1 / ({n(state.weights[0])}² + {n(state.weights[1])}²) = {n(state.effective)}. This
        measures concentration, not semantic originality.
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Rewrites from A"
          min={1}
          max={8}
          step={1}
          value={count}
          onChange={setCount}
        />
        <Reset action={() => setCount(3)} />
      </FlowControls>
    </Figure>
  );
}

function CorpusMix() {
  const [alpha, setAlpha] = useState(0.5);
  const batch = mixBatch(alpha);
  return (
    <Figure id="S12" label="Two window pools feed one fixed-size batch">
      <Data files={['study.json', 'audit.json']}>
        {(study, audit) => (
          <>
            <div className="synthetic-two">
              {['raw', 'generated'].map((arm, k) => (
                <div key={arm}>
                  <strong style={{ color: color(k) }}>
                    {arm === 'raw' ? 'Original' : 'Generated'} pool · branch probability{' '}
                    {n(k ? alpha : 1 - alpha)}
                  </strong>
                  <div className="synthetic-corpus-bars">
                    {study[arm].record_bytes.map((length, i) => (
                      <div
                        key={i}
                        title={`Record ${i + 1}: ${length} bytes; ${Math.max(0, length - 32)} eligible starts`}
                        style={{ width: `${(length / 1012) * 100}%`, background: color(k) }}
                      />
                    ))}
                  </div>
                  <p>
                    {study[arm].records} records · {study[arm].utf8_bytes} bytes ·{' '}
                    {audit[k ? 'generated_windows' : 'raw_windows']} eligible windows
                  </p>
                </div>
              ))}
            </div>
            <div className="synthetic-arrow">↓ branch draw, then uniform rank within that pool</div>
            <div className="synthetic-batch">
              {batch.map((row, i) => (
                <div key={i} style={{ '--identity': color(row.generated ? 1 : 0) }}>
                  <strong>
                    {row.generated ? 'G' : 'O'}
                    {i + 1}
                  </strong>
                  <span>32 targets</span>
                  <small>
                    rank{' '}
                    {Math.floor(
                      row.rank * (row.generated ? audit.generated_windows : audit.raw_windows),
                    )}
                  </small>
                </div>
              ))}
            </div>
            <FlowReadout>
              {batch.filter((row) => row.generated).length} / 16 generated windows in this fixed
              browser draw; each has 32 targets. Expected fraction {n(alpha)}. Each rank selects a
              start inside one record.
            </FlowReadout>
          </>
        )}
      </Data>
      <p>
        Bar length encodes bytes on a shared scale. An equal-document mixture of lengths 100 and 20
        instead gives generated target mass 20 / 120 = 1/6.
      </p>
      <FlowControls>
        <Choice
          label="Expected generated target fraction"
          options={[
            [0, '0 · original only'],
            [0.5, '½ mixture'],
            [1, '1 · generated only'],
          ]}
          value={alpha}
          change={setAlpha}
        />
      </FlowControls>
      <figcaption>
        Recorded corpus sizes; constructed browser batch using seed 17, not a replay of the Python
        training draws.
      </figcaption>
    </Figure>
  );
}

function ByteWindow() {
  const [position, setPosition] = useState(8),
    [future, setFuture] = useState(false),
    [offset, setOffset] = useState(0);
  return (
    <Figure id="S13" label="One shifted byte window and its causal attention mask">
      <Data files={['source-records.json']}>
        {(sources) => {
          const record = sources.records.find((row) => row.id === 'train-00');
          const original = windows(record.text).bytes.slice(offset, offset + 33);
          const bytes = [...original];
          if (future) bytes[32] = bytes[32] === 65 ? 66 : 65;
          return (
            <>
              <p>
                <Token>{record.id}</Token> · start {offset} · 33 real source bytes. Select the
                output row of the causal mask.
              </p>
              <Scroll label="32 input and target bytes with the causal mask">
                <div className="synthetic-byte-grid">
                  <div className="synthetic-byte-row">
                    <strong>Input index</strong>
                    {bytes.slice(0, 32).map((b, i) => (
                      <span key={i}>{i}</span>
                    ))}
                  </div>
                  <div className="synthetic-byte-row">
                    <strong>Input byte</strong>
                    {bytes.slice(0, 32).map((b, i) => (
                      <span className={i <= position ? 'context-byte' : ''} key={i}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="synthetic-byte-row">
                    <strong>Target byte</strong>
                    {bytes.slice(1).map((b, i) => (
                      <span className={i === position ? 'target-byte' : ''} key={i}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <div
                    className="synthetic-mask"
                    role="img"
                    aria-label="Lower triangular 32 by 32 causal visibility matrix, selected output row outlined"
                  >
                    {Array.from({ length: 32 }, (_, row) => (
                      <div key={row} className={row === position ? 'selected-mask-row' : ''}>
                        <strong>{row}</strong>
                        {Array.from({ length: 32 }, (_, col) => (
                          <i
                            key={col}
                            style={{
                              background: col <= row ? color(0) : '#252830',
                              opacity: col <= row ? (row === position ? 1 : 0.35) : 1,
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </Scroll>
              <FlowReadout>
                Output {position} may read input bytes 0–{position}; target = byte {position + 1} (
                {bytes[position + 1]}). Editing byte 32 changes{' '}
                {position === 31
                  ? 'this last target, but none of its input context'
                  : 'a later target, outside this prediction’s context'}
                .
              </FlowReadout>
              <p>
                Loss adds −log p(target) over all 32 positions, then divides by 32. A constructed
                uniform head has p = 1/256 everywhere: sum {n(32 * Math.log(256))} / 32 ={' '}
                {n(Math.log(256))} nats. The trained head is inspected below.
              </p>
            </>
          );
        }}
      </Data>
      <FlowControls>
        <FlowSlider
          name="Output row"
          min={0}
          max={31}
          step={1}
          value={position}
          onChange={setPosition}
        />
        <FlowSlider
          name="Source window start"
          min={0}
          max={40}
          step={1}
          value={offset}
          onChange={setOffset}
        />
        <Choice
          label="Last byte"
          options={[
            [false, 'Original'],
            [true, 'Edit byte 32'],
          ]}
          value={future}
          change={setFuture}
        />
        <Reset
          action={() => {
            setPosition(8);
            setOffset(0);
            setFuture(false);
          }}
        />
      </FlowControls>
    </Figure>
  );
}

function GeneratorRecord() {
  const [index, setIndex] = useState('0');
  return (
    <Figure id="S14" label="Inspect the actual encoder–decoder generation records">
      <Data files={['source-records.json', 'candidates.json', 'audit.json']}>
        {(sources, candidates, audit) => {
          const row = candidates.records[Number(index)];
          const source = sources.records.find((s) => s.id === row.source_id);
          const reviewed = audit.manual_audit.find((s) => s.id === row.id);
          return (
            <>
              <div className="synthetic-sheet" style={{ '--identity': color(0) }}>
                <strong>{source.id} · original source</strong>
                <p>{source.text}</p>
              </div>
              <div className="synthetic-arrow">
                ↓ full prompt · {row.input_ids.length} subword IDs
              </div>
              <Scroll label="Teacher encoder and autoregressive decoder">
                <svg
                  className="synthetic-drawing"
                  viewBox="0 0 700 205"
                  role="img"
                  aria-label="The encoder reads all prompt tokens. The decoder reads its causal prefix and cross-attends to encoder states, then emits the next token."
                >
                  <rect x="25" y="30" width="270" height="120" fill="#201b2b" stroke={color(1)} />
                  <text x="45" y="58" fill={color(1)}>
                    Encoder · all input tokens
                  </text>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <g key={i}>
                      <rect x={45 + i * 37} y="84" width="25" height="40" fill={color(0)} />
                      <path
                        d={`M${58 + i * 37} 82 Q158 55 ${243 - i * 37} 82`}
                        stroke={color(0)}
                        fill="none"
                      />
                    </g>
                  ))}
                  <path d="M296 105 L385 105" stroke={color(1)} strokeWidth="3" />
                  <text x="348" y="73" fill="#ddd" textAnchor="middle">
                    <tspan x="348">cross-</tspan><tspan x="348" dy="19">attend</tspan>
                  </text>
                  <rect x="400" y="30" width="270" height="120" fill="#16242a" stroke={color(2)} />
                  <text x="418" y="58" fill={color(2)}>
                    Decoder · causal prefix
                  </text>
                  {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                      <rect x={420 + i * 42} y="86" width="27" height="38" fill={color(1)} />
                      <path
                        d={`M${433 + i * 42} 84 L${445 + i * 42} 74 L${475 + i * 42} 84`}
                        stroke={color(1)}
                        fill="none"
                      />
                    </g>
                  ))}
                  <path d="M578 104 L613 104" stroke={color(2)} strokeWidth="2" />
                  <circle cx="634" cy="104" r="17" fill={color(2)} />
                  <text x="350" y="180" fill="#ddd" textAnchor="middle">
                    append token → repeat until EOS or cap
                  </text>
                </svg>
              </Scroll>
              <div className="synthetic-sheet" style={{ '--identity': color(0) }}>
                <strong>{row.id} · literal generated text</strong>
                <p>{row.text}</p>
              </div>
              <Table
                label="Saved generation, not a browser rerun"
                heads={['Field', 'Observed value']}
                rows={[
                  [
                    'Model',
                    `${candidates.model} · ${candidates.parameters.toLocaleString()} parameters · CPU`,
                  ],
                  ['Revision', <span className="synthetic-hash">{candidates.revision}</span>],
                  ['Requested form', row.style],
                  ['Input clipped?', row.input_truncated ? 'Yes' : 'No'],
                  ['New decoder tokens', row.output_ids.length - 1],
                  ['Termination', row.termination],
                  [
                    'Selection',
                    reviewed.selection.accepted
                      ? 'Kept by minimal format filter'
                      : reviewed.selection.reasons.join('; '),
                  ],
                  ['Output hash', <span className="synthetic-hash">{reviewed.selection.sha256}</span>],
                ]}
              />
              <p>
                <strong>Manual semantic inspection:</strong> {reviewed.note}
              </p>
              <FlowControls>
                <Select
                  label="Recorded candidate"
                  value={index}
                  change={setIndex}
                  options={candidates.records.map((r, i) => [
                    String(i),
                    `${r.id} · ${r.termination}`,
                  ])}
                />
              </FlowControls>
            </>
          );
        }}
      </Data>
    </Figure>
  );
}

const wordSet = (text) => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
function CandidateAudit() {
  const [index, setIndex] = useState('0');
  return (
    <Figure id="S15" label="Compare each actual candidate with its source and selection decision">
      <Data files={['source-records.json', 'candidates.json', 'audit.json']}>
        {(sources, candidates, audit) => {
          const row = candidates.records[Number(index)],
            source = sources.records.find((s) => s.id === row.source_id);
          const review = audit.manual_audit.find((s) => s.id === row.id),
            vocabulary = wordSet(source.text);
          const outputWords = [...wordSet(row.text)],
            shared = outputWords.filter((w) => vocabulary.has(w)).length;
          return (
            <>
              <div className="synthetic-two">
                <div>
                  <strong style={{ color: color(0) }}>{source.id} · source</strong>
                  <p>{source.text}</p>
                </div>
                <div>
                  <strong style={{ color: color(1) }}>{row.id} · output</strong>
                  <p className="synthetic-word-diff">
                    {row.text.split(/([\p{L}\p{N}]+)/u).map((part, i) =>
                      /^[\p{L}\p{N}]+$/u.test(part) ? (
                        <span
                          key={i}
                          className={
                            vocabulary.has(part.toLowerCase()) ? 'shared-word' : 'new-word'
                          }
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                </div>
              </div>
              <p>
                Amber words occur in the source; underlined violet words do not. A shared word can
                be used falsely, and a new word can be a faithful paraphrase.
              </p>
              <Table
                label="Descriptive counts and separate decisions"
                heads={['Measure', 'Value']}
                rows={[
                  [
                    'UTF-8 source / output bytes',
                    `${windows(source.text).bytes.length} / ${windows(row.text).bytes.length}`,
                  ],
                  ['Unique output words found in source', `${shared} / ${outputWords.length}`],
                  [
                    'Input truncation / output cap',
                    `${row.input_truncated ? 'clipped' : 'whole prompt'} / ${row.termination}`,
                  ],
                  [
                    'Minimal usable-format selection',
                    review.selection.accepted
                      ? 'Keep'
                      : `Reject: ${review.selection.reasons.join('; ')}`,
                  ],
                  ['Manual semantic assessment', review.note],
                ]}
              />
              <FlowControls>
                <Select
                  label="Inspect every candidate, including rejections"
                  options={candidates.records.map((r, i) => [String(i), r.id])}
                  value={index}
                  change={setIndex}
                />
              </FlowControls>
              <FlowReadout>
                34 outputs remain inspectable. 32 kept, 2 too short; all 17 requested QA outputs
                omitted an answer. This audit is not a calibrated factuality score.
              </FlowReadout>
            </>
          );
        }}
      </Data>
    </Figure>
  );
}

function TrainingLanes() {
  const [seed, setSeed] = useState(17),
    [step, setStep] = useState(300);
  return (
    <Figure id="S16" label="Three separate student fits share initialization and sampling draws">
      <Data files={['study.json']}>
        {(study) => {
          const fits = study.fits.filter((f) => f.seed === seed);
          return (
            <>
              <div className="synthetic-training-root">
                <strong>Seed {seed} · one initial parameter state</strong>
                <span>same branch draws + same within-pool ranks</span>
                <span>↓ copied into three separately updated students ↓</span>
              </div>
              <div className="synthetic-training-lanes">
                {fits.map((fit, i) => {
                  const score = fit.history.find((h) => h.step === step);
                  return (
                    <div
                      key={fit.arm}
                      style={{
                        '--identity': color(fit.arm === 'generated' ? 1 : 0),
                        borderTopStyle: fit.arm === 'copy' ? 'dashed' : 'solid',
                      }}
                    >
                      <strong>{fit.arm}</strong>
                      <div className="synthetic-lane-input">
                        <span>branch 0: original</span>
                        <span>branch 1: {fit.arm === 'generated' ? 'generated' : 'original'}</span>
                      </div>
                      <Network title={`Student ${i + 1}`} index={fit.arm === 'generated' ? 1 : 0} />
                      <p>{step * 16 * 32} selected training targets</p>
                      <output>Held-out byte NLL {n(score.byte_nll, 6)}</output>
                    </div>
                  );
                })}
              </div>
              <div className="synthetic-evaluation">
                <Token index={3}>4 untouched paragraphs · 1,862 targets</Token>
                <span>↑ same evaluation for each lane ↑</span>
              </div>
              <FlowReadout>
                Raw/copy final parameter hashes{' '}
                {fits[0].final_weight_sha256 === fits[1].final_weight_sha256
                  ? 'match exactly'
                  : 'differ'}
                . Generated targets after all 300 updates:{' '}
                {fits[2].generated_targets.toLocaleString()} /{' '}
                {fits[2].training_targets.toLocaleString()}.
              </FlowReadout>
              <FlowControls>
                <Choice
                  label="Paired seed"
                  options={[17, 29, 43].map((v) => [v, String(v)])}
                  value={seed}
                  change={setSeed}
                />
                <Choice
                  label="Recorded checkpoint"
                  options={[0, 100, 200, 300].map((v) => [v, String(v)])}
                  value={step}
                  change={setStep}
                />
                <Reset
                  action={() => {
                    setSeed(17);
                    setStep(300);
                  }}
                />
              </FlowControls>
            </>
          );
        }}
      </Data>
    </Figure>
  );
}

function PairedResults() {
  const [seed, setSeed] = useState(17);
  return (
    <Figure id="S17" label="Actual paired final losses, including all three seeds">
      <Data files={['study.json', 'audit.json']}>
        {(study, audit) => {
          const raw = study.fits.find((f) => f.seed === seed && f.arm === 'raw').history.at(-1);
          const generated = study.fits
            .find((f) => f.seed === seed && f.arm === 'generated')
            .history.at(-1);
          const x = (v) => 90 + ((v - 2.2) / 0.16) * 520;
          return (
            <>
              <Scroll label="Paired final byte NLL">
                <svg
                  className="synthetic-drawing"
                  viewBox="0 0 680 240"
                  role="img"
                  aria-label="Paired final negative log likelihood for seeds17,29,43; lower is better"
                >
                  {[2.2, 2.24, 2.28, 2.32, 2.36].map((v) => (
                    <g key={v}>
                      <line x1={x(v)} x2={x(v)} y1="22" y2="184" stroke="#393d46" />
                      <text x={x(v)} y="208" fill="#ddd" textAnchor="middle">
                        {v.toFixed(2)}
                      </text>
                    </g>
                  ))}
                  {audit.pairs.map((pair, i) => (
                    <g key={pair.seed}>
                      <text x="10" y={51 + i * 59} fill="#ddd">
                        Seed {pair.seed}
                      </text>
                      <line
                        x1={x(pair.raw_byte_nll)}
                        x2={x(pair.generated_byte_nll)}
                        y1={45 + i * 59}
                        y2={45 + i * 59}
                        stroke="#ccc"
                      />
                      <circle cx={x(pair.raw_byte_nll)} cy={45 + i * 59} r="7" fill={color(0)} />
                      <rect
                        x={x(pair.generated_byte_nll) - 6}
                        y={39 + i * 59}
                        width="12"
                        height="12"
                        fill={color(1)}
                      />
                    </g>
                  ))}
                  <text x="290" y="235" fill="#ddd">
                    Mean nats per held-out byte ↓
                  </text>
                </svg>
              </Scroll>
              <p>
                <Token>● Original only</Token> <Token index={1}>■ Generated mixture</Token>
              </p>
              <Bars
                values={audit.pairs.map((p) => p.generated_minus_raw)}
                labels={audit.pairs.map((p) => `Seed ${p.seed}`)}
                max={0.02}
                signed
                title="Generated minus original · zero at center · negative is lower loss"
              />
              <Table
                label={`Final paragraph measurements · seed ${seed}`}
                heads={['Paragraph', 'Targets', 'Original NLL', 'Generated NLL', 'Difference']}
                rows={raw.paragraphs.map((p, i) => [
                  p.id,
                  p.targets,
                  n(p.mean_nats, 6),
                  n(generated.paragraphs[i].mean_nats, 6),
                  n(generated.paragraphs[i].mean_nats - p.mean_nats, 6),
                ])}
              />
              <FlowReadout>
                Mean paired difference {n(audit.mean_paired_difference, 6)} nats/byte. Signs differ
                across seeds. These three small fits do not establish a general improvement.
              </FlowReadout>
              <FlowControls>
                <Choice
                  label="Paragraph table seed"
                  options={[17, 29, 43].map((v) => [v, String(v)])}
                  value={seed}
                  change={setSeed}
                />
              </FlowControls>
            </>
          );
        }}
      </Data>
    </Figure>
  );
}

const byteLabel = (b) =>
  b >= 33 && b <= 126
    ? `${b} · ${String.fromCharCode(b)}`
    : b === 32
      ? '32 · space'
      : `${b} · byte`;
function SavedHead() {
  const [arm, setArm] = useState('raw'),
    [index, setIndex] = useState('0'),
    [byte, setByte] = useState(226);
  return (
    <Figure id="S18" label="Inspect all 256 probabilities from saved student forwards">
      <Data files={['study.json']}>
        {(study) => {
          const rows = study.inspector.find((r) => r.arm === arm).rows,
            row = rows[Number(index)];
          return (
            <>
              <p>
                Seed 17 · final checkpoint · {row.source_id} · target position {row.target_position}
              </p>
              <div className="synthetic-context">
                {row.context.map((b, i) => (
                  <Token key={i}>{byteLabel(b)}</Token>
                ))}
                <span>→</span>
                <Token index={3} selected>
                  target {byteLabel(row.target)}
                </Token>
              </div>
              <div
                className="synthetic-probability-grid"
                aria-label="All 256 saved probabilities in byte order"
              >
                {row.probabilities.map((p, b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setByte(b)}
                    className={b === byte ? 'is-selected' : ''}
                    style={{ '--mass': p, '--identity': color(b === row.target ? 3 : 2) }}
                    aria-label={`Byte ${b}, probability ${p}${b === row.target ? ', true target' : ''}`}
                    aria-pressed={b === byte}
                  >
                    <span>{b}</span>
                    <i style={{ height: `${Math.sqrt(p) * 100}%` }} />
                  </button>
                ))}
              </div>
              <FlowReadout>
                Selected byte {byteLabel(byte)}: p = {n(row.probabilities[byte], 9)}. Target p ={' '}
                {n(row.probabilities[row.target], 9)}; target NLL ={' '}
                {n(-Math.log(row.probabilities[row.target]), 6)} nats.
              </FlowReadout>
              <p>
                Cell bar height is √p so small values remain visible; numeric readout gives
                probability. Rose marks the true target, outline marks your selection. These
                complete vectors were saved from actual student forwards.
              </p>
              <FlowControls>
                <Choice
                  label="Saved student"
                  options={['raw', 'copy', 'generated'].map((v) => [v, v])}
                  value={arm}
                  change={setArm}
                />
                <Select
                  label="Fixed held-out position"
                  options={rows.map((r, i) => [
                    String(i),
                    `${r.source_id} · position ${r.target_position}`,
                  ])}
                  value={index}
                  change={setIndex}
                />
                <Reset
                  action={() => {
                    setArm('raw');
                    setIndex('0');
                    setByte(226);
                  }}
                />
              </FlowControls>
            </>
          );
        }}
      </Data>
    </Figure>
  );
}

function Urn({ counts, label }) {
  return (
    <div className="synthetic-urn">
      <strong>{label}</strong>
      <div>
        {counts.flatMap((count, i) =>
          Array.from({ length: count }, (_, k) => (
            <span
              key={`${i}-${k}`}
              style={{ background: color(i) }}
              title={`Category ${'ABC'[i]}`}
            />
          )),
        )}
      </div>
      <p>{counts.map((c, i) => `${'ABC'[i]}: ${c}`).join(' · ')}</p>
    </div>
  );
}
function Replacement() {
  const [seed, setSeed] = useState(17),
    [generation, setGeneration] = useState(1);
  const path = populationPath({ seed, generations: 20 }),
    before = path[Math.max(0, generation - 1)],
    after = path[generation];
  return (
    <Figure id="S19" label="Sampling ten records can remove a rare category">
      <div className="synthetic-two">
        <Urn
          counts={before.counts}
          label={`Generation ${Math.max(0, generation - 1)} · sampling pool`}
        />
        <Urn counts={after.counts} label={`Generation ${generation} · sampled replacement`} />
      </div>
      <Bars
        values={after.distribution}
        labels={['A', 'B', 'C']}
        title="New categorical probabilities = sampled counts / 10"
      />
      <FlowReadout>
        Missing categories:{' '}
        {after.counts
          .map((count, i) => (count === 0 ? 'ABC'[i] : null))
          .filter(Boolean)
          .join(', ') || 'none'}
        . Pure replacement cannot sample a category whose current probability is zero.
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Simulation seed"
          min={1}
          max={30}
          step={1}
          value={seed}
          onChange={setSeed}
        />
        <button
          type="button"
          disabled={generation === 0}
          onClick={() => setGeneration((g) => g - 1)}
        >
          Previous generation
        </button>
        <button
          type="button"
          disabled={generation === 20}
          onClick={() => setGeneration((g) => g + 1)}
        >
          Next generation
        </button>
        <Reset
          action={() => {
            setSeed(17);
            setGeneration(1);
          }}
        />
      </FlowControls>
      <figcaption>
        Constructed finite-population simulation; these dots are category samples, not
        language-model training measurements.
      </figcaption>
    </Figure>
  );
}

function CorpusHistory() {
  const [rule, setRule] = useState('replace'),
    [generation, setGeneration] = useState(3),
    [alpha, setAlpha] = useState(0.5);
  const path = populationPath({ rule, generations: generation, alpha }),
    row = path.at(-1);
  const kept =
    rule === 'accumulate' ? path : rule === 'anchor' && generation > 0 ? [path[0], row] : [row];
  return (
    <Figure id="S20" label="Recursive update rules preserve different corpora and weights">
      <div className="synthetic-history">
        {kept.map((r, i) => (
          <Urn
            key={i}
            counts={r.counts}
            label={
              r.generation === 0
                ? 'Original records · generation 0'
                : `${rule === 'fresh' ? 'Fresh draw from original q₀' : 'Sampled records'} · generation ${r.generation}`
            }
          />
        ))}
      </div>
      <Bars
        values={row.distribution}
        labels={['A', 'B', 'C']}
        title="Distribution sampled by the next generation"
      />
      <FlowReadout>
        {row.stored} stored record slots.{' '}
        {rule === 'anchor'
          ? `Original weight ${n(1 - alpha)}, latest generated weight ${n(alpha)}. Stored row count does not set this mixture weight.`
          : rule === 'accumulate'
            ? `Each of ${generation + 1} equal-size batches gets weight 1/${generation + 1}.`
            : rule === 'fresh'
              ? 'Each new draw uses q₀, independently of lost categories in the previous sample.'
              : 'Only the latest ten sampled records remain.'}
      </FlowReadout>
      <FlowControls>
        <Choice
          label="Corpus update"
          options={['replace', 'anchor', 'accumulate', 'fresh'].map((v) => [v, v])}
          value={rule}
          change={setRule}
        />
        <FlowSlider
          name="Generation"
          min={0}
          max={6}
          step={1}
          value={generation}
          onChange={setGeneration}
        />
        {rule === 'anchor' && (
          <FlowSlider
            name="Generated mixture weight α"
            min={0}
            max={1}
            step={0.1}
            value={alpha}
            onChange={setAlpha}
          />
        )}
        <Reset
          action={() => {
            setRule('replace');
            setGeneration(3);
            setAlpha(0.5);
          }}
        />
      </FlowControls>
      <figcaption>
        Constructed categorical process, seed 17. Original colours persist through every update.
      </figcaption>
    </Figure>
  );
}

function DiversityPaths() {
  const [population, setPopulation] = useState(10),
    [generation, setGeneration] = useState(20);
  const state = useMemo(() => populationEnsemble(population, 20), [population]);
  const accumulation = expectedH('accumulate', population, 20);
  const x = (g) => 65 + g * 27,
    y = (h) => 280 - h * 240;
  const points = (values) => values.map((h, g) => `${x(g)},${y(h)}`).join(' ');
  return (
    <Figure id="S21" label="Individual diversity paths and their exact expectation">
      <Scroll label="Heterozygosity over twenty generations">
        <svg
          className="synthetic-drawing"
          viewBox="0 0 680 335"
          role="img"
          aria-label="64 categorical replacement simulations and exact expected heterozygosity, vertical scale zero to one"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1="65" x2="605" y1={y(v)} y2={y(v)} stroke="#343842" />
              <text x="50" y={y(v) + 5} textAnchor="end" fill="#ddd">
                {v}
              </text>
            </g>
          ))}
          {state.paths.map((path, i) => (
            <polyline
              key={i}
              points={points(path.map((r) => r.H))}
              fill="none"
              stroke={color(1)}
              opacity=".15"
            />
          ))}
          <polyline points={points(state.mean)} fill="none" stroke={color(2)} strokeWidth="3" />
          <polyline
            points={points(state.expected)}
            fill="none"
            stroke={color(0)}
            strokeWidth="3"
            strokeDasharray="7 4"
          />
          <polyline
            points={points(accumulation)}
            fill="none"
            stroke={color(3)}
            strokeWidth="3"
            strokeDasharray="2 5"
          />
          <line
            x1={x(generation)}
            x2={x(generation)}
            y1="30"
            y2="280"
            stroke="#eee"
            strokeDasharray="2 4"
          />
          {[0, 5, 10, 15, 20].map((v) => (
            <text key={v} x={x(v)} y="305" textAnchor="middle" fill="#ddd">
              {v}
            </text>
          ))}
          <text x="65" y="20" fill="#ddd">
            H = 1 − Σq²
          </text>
          <text x="290" y="331" fill="#ddd">
            Generation
          </text>
        </svg>
      </Scroll>
      <p>
        <Token index={1}>64 individual paths</Token> <Token index={2}>Sample mean</Token>{' '}
        <Token>Dashed replacement expectation</Token>{' '}
        <Token index={3}>Dotted accumulation expectation</Token>
      </p>
      <FlowReadout>
        At generation {generation}, exact E[H] = .54 × (1 − 1/{population})^{generation} ={' '}
        {n(state.expected[generation], 6)}. Mean across 64 browser paths ={' '}
        {n(state.mean[generation], 6)}. One path: {state.paths[0][generation].counts.join(' / ')}.{' '}
        Accumulation expectation at the same generation: {n(accumulation[generation], 6)}; its
        storage grows to {(generation + 1) * population} records.
      </FlowReadout>
      <FlowControls>
        <Choice
          label="Replacement sample size N"
          options={[10, 20, 50].map((v) => [v, String(v)])}
          value={population}
          change={setPopulation}
        />
        <FlowSlider
          name="Inspect generation"
          min={0}
          max={20}
          step={1}
          value={generation}
          onChange={setGeneration}
        />
        <Reset
          action={() => {
            setPopulation(10);
            setGeneration(20);
          }}
        />
      </FlowControls>
      <figcaption>
        Browser-seeded category simulations. The equation describes pure multinomial replacement; it
        is not an empirical scaling law for neural models.
      </figcaption>
    </Figure>
  );
}

function Costs() {
  const [generation, setGeneration] = useState(0.04),
    [verification, setVerification] = useState(0.01),
    [acceptance, setAcceptance] = useState(0.62);
  const cost = costLedger(generation, verification, acceptance);
  return (
    <Figure id="S22" label="Count rejected generation attempts in the cost of kept data">
      <div className="synthetic-cost-equation">
        <span>
          <Token>Generate {n(generation)} units</Token> +{' '}
          <Token index={1}>Check {n(verification)} units</Token>
        </span>
        <span>÷ acceptance {n(acceptance)}</span>
        <strong>
          {cost.perKeep === null
            ? 'No finite cost per keep'
            : `${n(cost.perKeep, 6)} units per keep`}
        </strong>
      </div>
      <FlowReadout>
        {cost.expectedAttempts === null
          ? 'No candidate is accepted under this stationary policy.'
          : `Expected attempts per keep = ${n(cost.expectedAttempts, 6)}. Rejected attempts still incur generation and checking costs.`}
      </FlowReadout>
      <FlowControls>
        <FlowSlider
          name="Generation cost, arbitrary units"
          min={0}
          max={0.1}
          step={0.01}
          value={generation}
          onChange={setGeneration}
        />
        <FlowSlider
          name="Verification cost, arbitrary units"
          min={0}
          max={0.1}
          step={0.01}
          value={verification}
          onChange={setVerification}
        />
        <FlowSlider
          name="Acceptance probability"
          min={0}
          max={1}
          step={0.01}
          value={acceptance}
          onChange={setAcceptance}
        />
        <Reset
          action={() => {
            setGeneration(0.04);
            setVerification(0.01);
            setAcceptance(0.62);
          }}
        />
      </FlowControls>
      <Table
        label="What must match before comparing source-paper results"
        heads={['Condition', 'Question to inspect']}
        rows={[
          [
            'Source and model',
            'Was the generator conditioned on retained real data? Which model produced it?',
          ],
          ['Selection', 'What did the checker establish, and what fraction survived?'],
          ['Student budget', 'Were selected training targets and compute held fixed?'],
          ['Recursion', 'Was the original corpus replaced, anchored, or accumulated?'],
          ['Evaluation', 'Which held-out tasks and split relations support the claim?'],
        ]}
      />
    </Figure>
  );
}

const figures = {
  S01: SourceJourney,
  S02: TargetMask,
  S03: PromptCommitments,
  S04: GenerationRoutes,
  S05: Nucleus,
  S06: CDF,
  S07: Arithmetic,
  S08: ConfusionPopulation,
  S09: SelectionSupport,
  S10: Families,
  S11: FamilyCounts,
  S12: CorpusMix,
  S13: ByteWindow,
  S14: GeneratorRecord,
  S15: CandidateAudit,
  S16: TrainingLanes,
  S17: PairedResults,
  S18: SavedHead,
  S19: Replacement,
  S20: CorpusHistory,
  S21: DiversityPaths,
  S22: Costs,
};
export default function SyntheticFigure({ id }) {
  const Component = figures[id];
  if (!Component) throw new Error(`Missing synthetic structure ${id}`);
  return <Component />;
}
