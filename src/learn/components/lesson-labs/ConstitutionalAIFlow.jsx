import React, { useEffect, useId, useRef, useState } from 'react';
import {
  candidates,
  request,
  principles,
  revisions,
  compiledPrinciple,
  targetFixture,
  conditionalChoice,
  mappedOrders,
  transformedLabel,
  headPair,
  preferenceStep,
  policyOptimum,
  dpoStep,
  coverage,
  calibration,
  errorStructure,
  consensus,
  workLedger,
} from '../../data/constitutional-ai-models.js';
import './constitutional-ai-flow.css';

const fmt = (x, digits = 6) =>
  x === null ? 'unknown' : Number.isFinite(x) ? Number(x.toFixed(digits)).toString() : 'invalid';
function Lab({ id, title, children, note }) {
  return (
    <figure className="cai-lab" data-cai-figure={id} aria-label={title}>
      <figcaption>
        <strong>{title}</strong>
      </figcaption>
      {children}
      {note && <p className="cai-caption">{note}</p>}
    </figure>
  );
}
function Field({ label, value, onChange, min, max, step = 0.1, text = false }) {
  const id = useId();
  return (
    <label className="cai-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={text ? 'text' : 'number'}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (text) onChange(e.target.value);
          else {
            const n = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(n))
              onChange(
                Math.max(
                  min ?? -Infinity,
                  Math.min(max ?? Infinity, step === 1 ? Math.round(n) : n),
                ),
              );
          }
        }}
      />
    </label>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="cai-toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
function Controls({ children, reset }) {
  return (
    <fieldset className="cai-controls">
      <legend>Change the current example</legend>
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
    <label className="cai-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Local({ label, children }) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);
  return (
    <div className="cai-local-container">
      {overflow && (
        <p className="cai-scroll-hint">
          Scroll this aligned view horizontally; focus it and use the arrow keys.
        </p>
      )}
      <div ref={ref} className="cai-local" tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
function Candidate({ index, children }) {
  const c = candidates[index];
  return (
    <span className={`cai-identity cai-${c.hue}`} data-candidate={c.id}>
      {c.id}
      {children && <> · {children}</>}
    </span>
  );
}
function Legend({ roles = false }) {
  return (
    <p className="cai-legend">
      {roles ? (
        <>
          <span className="cai-cyan">Supplied input</span> ·{' '}
          <span className="cai-amber">Learned parameters</span> ·{' '}
          <span className="cai-violet">Computed score</span>
        </>
      ) : (
        candidates.map((c, i) => (
          <React.Fragment key={c.id}>
            <Candidate index={i} />
            {i < 2 ? ' · ' : ''}
          </React.Fragment>
        ))
      )}
    </p>
  );
}
function ProbabilityRows({
  values,
  labels = candidates.map((x) => x.id),
  name = 'Probability',
  hues = candidates.map((x) => x.hue),
}) {
  return (
    <div className="cai-probability" aria-label={name}>
      {values.map((value, i) => (
        <div className="cai-prob-row" key={i}>
          <span className={`cai-${hues[i] || 'violet'}`}>{labels[i]}</span>
          <div className="cai-prob-track">
            <span
              style={{ width: `${value === null ? 0 : Math.max(0, Math.min(1, value)) * 100}%` }}
              className={`cai-fill cai-fill-${hues[i] || 'violet'}`}
            />
          </div>
          <output>{fmt(value)}</output>
        </div>
      ))}
      <p className="cai-axis">{name}: 0 at left · 1 at right</p>
    </div>
  );
}
function SignedRows({ values, labels, scale = 1 }) {
  return (
    <div className="cai-signed">
      {values.map((x, i) => (
        <div className="cai-prob-row" key={i}>
          <span>{labels[i]}</span>
          <div className="cai-sign-track">
            <span className="cai-zero" />
            <span
              className="cai-sign-fill"
              style={{
                left: `${x < 0 ? 50 + (50 * x) / scale : 50}%`,
                width: `${(50 * Math.abs(x)) / scale}%`,
              }}
            />
          </div>
          <output>{fmt(x)}</output>
        </div>
      ))}
      <p className="cai-axis">
        Signed scale −{scale} · 0 · +{scale}; descent subtracts this gradient.
      </p>
    </div>
  );
}
function Tensor({ values, label, frozen = false }) {
  return (
    <div className={`cai-tensor ${frozen ? 'cai-frozen' : ''}`}>
      <p>
        {label}
        {frozen ? ' · frozen' : ''}
      </p>
      <div
        className="cai-tensor-cells"
        style={{ gridTemplateColumns: `repeat(${values[0].length},1fr)` }}
      >
        {values.flat().map((x, i) => (
          <span key={i}>{fmt(x, 3)}</span>
        ))}
      </div>
    </div>
  );
}

export function ResponseEdits() {
  return (
    <Lab
      id="response-edits"
      title="Repair the response span, then decide what to train"
      note="Constructed fictional example. Removed/inserted marks encode text edits; candidate hue encodes identity, not quality."
    >
      <Legend />
      <div className="cai-response-alignment">
        <p>
          <Candidate index={0} /> <del className="cai-removed">{candidates[0].text}</del>{' '}
          <small>removed private-contact suggestion</small>
        </p>
        <p>
          <Candidate index={2} /> <ins className="cai-inserted">{candidates[2].text}</ins>{' '}
          <small>inserted permitted contact help</small>
        </p>
      </div>
      <p className="cai-countercase">
        Benign request: “How can I ask Mira which public contact method she prefers?” → “Ask which
        method she prefers.”
      </p>
      <p className="cai-result">
        Text changed · model parameter change: <strong>0</strong>
      </p>
    </Lab>
  );
}
export function TrainingArtifacts() {
  return (
    <Lab
      id="training-artifacts"
      title="Different records feed different trainable copies"
      note="Constructed schemas. Human helpfulness can join AI harmlessness labels in the preference mixture; neither is external ground truth."
    >
      <div className="cai-artifacts">
        <div>
          <h4>Supervised record</h4>
          <dl>
            <dt>x</dt>
            <dd>{request}</dd>
            <dt>y revision</dt>
            <dd className="cai-violet">{revisions[2]}</dd>
            <dt>origin</dt>
            <dd>AI revision · P2 · round 2</dd>
          </dl>
          <div className="cai-down">↓ response-token loss</div>
          <Tensor
            label="Student θ · updates"
            values={[
              [0.1, 0.2],
              [-0.3, 0.4],
            ]}
          />
        </div>
        <div>
          <h4>Preference record</h4>
          <dl>
            <dt>x</dt>
            <dd>Same request</dd>
            <dt>yA, yB</dt>
            <dd>
              <Candidate index={0} /> versus <Candidate index={2} />
            </dd>
            <dt>q</dt>
            <dd>0.25 for R1 · AI criterion label</dd>
            <dt>source</dt>
            <dd>AI harmlessness + separate human helpfulness pairs</dd>
          </dl>
          <div className="cai-down">↓ pair loss</div>
          <Tensor label="Reward head w · updates" values={[[0.1, 0.2]]} />
        </div>
      </div>
      <div className="cai-reference-strip">
        <Tensor
          label="Collection generator θ₀"
          values={[
            [0.1, 0.2],
            [-0.3, 0.4],
          ]}
          frozen
        />
        <span>Separate copy identity: collection θ₀ ≠ trained student θ</span>
      </div>
    </Lab>
  );
}
export function PrincipleAnatomy() {
  const [scope, setScope] = useState(principles[0].scope),
    [criterion, setCriterion] = useState(principles[0].criterion),
    [alternative, setAlternative] = useState(principles[0].alternative);
  const result = compiledPrinciple(scope, criterion, alternative);
  return (
    <Lab
      id="principle-anatomy"
      title="A principle has scope, a repair criterion and an allowed route"
      note="These are user-created product norms. Compilation prepares an instruction; no model runs in this view."
    >
      <p className="cai-annotated-principle">
        <span className="cai-cyan">For {scope || '(missing scope)'}</span>,{' '}
        <span className="cai-rose">{criterion || '(missing criterion)'}</span>;{' '}
        <span className="cai-violet">{alternative || '(missing alternative)'}</span>.
      </p>
      <p className="cai-legend">Cyan: scope · rose: criterion · violet: permitted alternative</p>
      <Controls
        reset={() => {
          setScope(principles[0].scope);
          setCriterion(principles[0].criterion);
          setAlternative(principles[0].alternative);
        }}
      >
        <Field text label="Scope" value={scope} onChange={setScope} />
        <Field text label="Criterion" value={criterion} onChange={setCriterion} />
        <Field text label="Allowed alternative" value={alternative} onChange={setAlternative} />
      </Controls>
      <p>
        Counterexample: a request to <u>ask for the preferred public contact method</u> does not
        request private disclosure.
      </p>
      <pre className={`cai-transcript ${result.valid ? '' : 'cai-invalid'}`} aria-live="polite">
        {result.text}
      </pre>
    </Lab>
  );
}
export function CritiqueContext() {
  const [retain, setRetain] = useState(true),
    [contaminate, setContaminate] = useState(false),
    [benign, setBenign] = useState(false);
  const x = benign ? 'How can I ask Mira which public contact method she prefers?' : request;
  return (
    <Lab
      id="critique-context"
      title="Trace which text the critic and revision actually receive"
      note="Constructed transcript replay. Changing its context does not synthesize a new critique or infer that a response is safe."
    >
      <ol className="cai-context">
        <li>
          <span className="cai-cyan">User x</span>
          <p>{retain ? x : 'Unavailable: request omitted from the critic context.'}</p>
        </li>
        <li>
          <span className="cai-amber">Draft y₀</span>
          <p>{revisions[0]}</p>
        </li>
        <li>
          <span className="cai-violet">Principle P1</span>
          <p>{principles[0].criterion}</p>
        </li>
        <li>
          <span>Recorded critique c₁</span>
          <p>
            {benign || !retain
              ? 'No matching recorded critique for this changed context. Missing evidence remains missing.'
              : 'The draft suggests obtaining private information; offer a permitted route.'}
          </p>
        </li>
        <li>
          <span className="cai-violet">Recorded revision y₁</span>
          <p>
            {benign || !retain ? 'No matching recorded revision.' : revisions[1]}
            {contaminate && (
              <ins className="cai-inserted">
                {' Few-shot example answer: unrelated sample response.'}
              </ins>
            )}
          </p>
        </li>
      </ol>
      <p className="cai-result">
        Training extraction keeps <code>(x, y₁)</code>.{' '}
        {contaminate
          ? 'Appended example text would contaminate the target if copied literally.'
          : 'Critique and instruction text are context, not the intended answer target.'}
      </p>
      <Controls
        reset={() => {
          setRetain(true);
          setContaminate(false);
          setBenign(false);
        }}
      >
        <Toggle label="Keep original request x" value={retain} onChange={setRetain} />
        <Toggle
          label="Append a few-shot answer suffix"
          value={contaminate}
          onChange={setContaminate}
        />
        <Toggle label="Use benign request" value={benign} onChange={setBenign} />
      </Controls>
    </Lab>
  );
}
export function RevisionAncestry() {
  const [round, setRound] = useState(3),
    [all, setAll] = useState(true);
  const targets = round === 0 ? [] : all ? revisions.slice(1, round + 1) : [revisions[round]];
  return (
    <Lab
      id="revision-ancestry"
      title="Recorded ancestry preserves unchanged and failed possibilities"
      note="Vertical lines mean parent→revision, never improvement. Round 3 is exactly unchanged from round 2."
    >
      <ol className="cai-ancestry">
        {revisions.slice(0, round + 1).map((text, i) => (
          <li key={i}>
            <div className="cai-ancestry-label">
              {i > 0 && <>↓ sampled {principles[i - 1].id} · </>}y{i}
              {i === 3 ? ' · unchanged' : ''}
            </div>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <p className="cai-result">Revised SFT sequences: {targets.length}</p>
      {targets.length ? (
        <ol>
          {targets.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      ) : (
        <p>No revised target exists at round 0.</p>
      )}
      <Controls
        reset={() => {
          setRound(3);
          setAll(true);
        }}
      >
        <Field
          label="Completed rounds"
          value={round}
          min={0}
          max={3}
          step={1}
          onChange={setRound}
        />
        <Toggle label="Retain every revised target" value={all} onChange={setAll} />
      </Controls>
    </Lab>
  );
}
export function TargetMasks() {
  const [prompt, setPrompt] = useState(3),
    [padding, setPadding] = useState(2),
    [wrong, setWrong] = useState(false),
    [ignored, setIgnored] = useState(false);
  const state = targetFixture(prompt, padding, wrong, ignored);
  return (
    <Lab
      id="target-masks"
      title="Input visibility and scored next targets have separate rows"
      note="Constructed IDs. Same-position labels are supplied to GPT2; its internal shift happens once. Prompt inputs stay visible even when their labels are −100."
    >
      <Local label="Aligned input, attention, label and next-target positions">
        <table className="cai-token-table">
          <thead>
            <tr>
              <th>Position</th>
              {state.tokens.map((_, i) => (
                <th key={i}>{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Input token</th>
              {state.tokens.map((x, i) => (
                <td className={`cai-token-${x.kind}`} key={i}>
                  {x.token}
                </td>
              ))}
            </tr>
            <tr>
              <th>Input ID</th>
              {state.tokens.map((x, i) => (
                <td key={i}>{x.id}</td>
              ))}
            </tr>
            <tr>
              <th>Attention</th>
              {state.attention.map((x, i) => (
                <td key={i}>{x}</td>
              ))}
            </tr>
            <tr>
              <th>Label at position</th>
              {state.labels.map((x, i) => (
                <td key={i}>{x}</td>
              ))}
            </tr>
            <tr>
              <th>Logit predicts</th>
              {state.tokens.map((_, i) => (
                <td key={i}>
                  {i === state.tokens.length - 1
                    ? 'no next'
                    : state.labels[i + 1] === -100
                      ? 'ignored'
                      : `ID ${state.labels[i + 1]}`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Local>
      <p className="cai-result">
        Contributing targets: {state.count}.{' '}
        {state.count
          ? `First: logit ${state.targets[0].logit} → label position ${state.targets[0].labelPosition} → ID ${state.targets[0].target}.`
          : 'Mean loss undefined; skip the optimizer step.'}
      </p>
      <Controls
        reset={() => {
          setPrompt(3);
          setPadding(2);
          setWrong(false);
          setIgnored(false);
        }}
      >
        <Field
          label="Prompt positions"
          value={prompt}
          min={1}
          max={5}
          step={1}
          onChange={setPrompt}
        />
        <Field
          label="Padding positions"
          value={padding}
          min={0}
          max={4}
          step={1}
          onChange={setPadding}
        />
        <Toggle label="Incorrectly score prompt targets" value={wrong} onChange={setWrong} />
        <Toggle label="Ignore every target" value={ignored} onChange={setIgnored} />
      </Controls>
    </Lab>
  );
}
export function ParameterStates() {
  const [rate, setRate] = useState(0.2),
    [frozen, setFrozen] = useState(false);
  const before = [
      [0.1, 0.2],
      [-0.3, 0.4],
    ],
    gradient = [
      [0.05, -0.1],
      [0.02, 0.03],
    ],
    after = before.map((row, i) => row.map((x, j) => x - (frozen ? 0 : rate) * gradient[i][j]));
  return (
    <Lab
      id="parameter-states"
      title="Collecting text leaves weights fixed; training updates a separate tensor"
      note="Stipulated 2×2 tensor arithmetic, not measured FLAN weights. Dashed boundaries identify frozen parameters."
    >
      <Legend roles />
      <Tensor label="Generator θ₀ during collection" values={before} frozen />
      <div className="cai-tensor-route">
        <Tensor label="Student θ before" values={before} />
        <span className="cai-operator">− {frozen ? 0 : rate} ×</span>
        <Tensor label="Constructed ∇L" values={gradient} />
        <span className="cai-operator">=</span>
        <Tensor label="Student θ after" values={after} frozen={frozen} />
      </div>
      <p className="cai-result">
        Maximum parameter change:{' '}
        {fmt(Math.max(...before.flat().map((x, i) => Math.abs(x - after.flat()[i]))))}.{' '}
        {frozen
          ? 'Frozen student: no update.'
          : 'Only this declared student copy receives the step.'}
      </p>
      <Controls
        reset={() => {
          setRate(0.2);
          setFrozen(false);
        }}
      >
        <Field label="Learning rate η" value={rate} min={0} max={2} onChange={setRate} />
        <Toggle label="Freeze student parameters" value={frozen} onChange={setFrozen} />
      </Controls>
    </Lab>
  );
}
export function ChoiceMass() {
  const initial = [Math.log(0.3), Math.log(0.1), Math.log(0.6)];
  const [logits, setLogits] = useState(initial),
    state = conditionalChoice(logits);
  return (
    <Lab
      id="choice-mass"
      title="Complete option mass versus the conditional A/B question"
      note="Constructed three-outcome categorical logits, normalized to mass over complete A, B and other answers. The actual model later scores full option sequences through EOS. Conditional q is computed in log space even if tiny displayed mass rounds to zero."
    >
      <div className="cai-mass-strip" aria-label="Normalized mass including other responses">
        {state.mass.map((x, i) => (
          <div key={i} className={`cai-fill-${['amber', 'blue', 'violet'][i]}`} style={{ flex: x }}>
            <span>{['A', 'B', 'other'][i]}</span>
          </div>
        ))}
      </div>
      <ProbabilityRows
        values={state.mass}
        labels={['A', 'B', 'other']}
        name="Toy complete-answer mass"
      />
      <div className="cai-subset-bracket">
        A+B subset mass = {fmt(state.subset)}
        <br />
        q(A | A or B) = A/(A+B) = <strong>{fmt(state.q)}</strong>
      </div>
      <p>Equal A/B logits produce q=0.5 regardless of the other aggregate's mass.</p>
      <Controls reset={() => setLogits(initial)}>
        {logits.map((x, i) => (
          <Field
            key={i}
            label={`Toy logit ${['A', 'B', 'other aggregate'][i]}`}
            value={x}
            min={-10000}
            max={10000}
            onChange={(v) => setLogits(logits.map((a, j) => (j === i ? v : a)))}
          />
        ))}
      </Controls>
    </Lab>
  );
}
export function OrderMapping() {
  const [first, setFirst] = useState(0.8),
    [second, setSecond] = useState(0.4),
    [missing, setMissing] = useState(false);
  const state = mappedOrders(first, missing ? null : second);
  return (
    <Lab
      id="order-mapping"
      title="Cross presentation slots back to the same response identity"
      note="A-slot probabilities are not response identities. Map the second pass back before averaging."
    >
      <Legend />
      <Local label="Presentation slots and fixed identity mapping">
        <p>Pass 1 at left: A=R1, B=R3. Pass 2 at right: A=R3, B=R1.</p>
        <svg
          className="cai-order-map"
          width="600"
          height="145"
          viewBox="0 0 600 145"
          role="img"
          aria-label="R1 crosses from slot A to slot B; R3 crosses from slot B to slot A"
        >
          <path d="M65 35 L435 110" className="cai-line-amber" />
          <path d="M65 110 L435 35" className="cai-line-violet" />
          <circle cx="45" cy="35" r="20" className="cai-circle-amber" />
          <circle cx="45" cy="110" r="20" className="cai-circle-violet" />
          <circle cx="455" cy="35" r="20" className="cai-circle-violet" />
          <circle cx="455" cy="110" r="20" className="cai-circle-amber" />
          <text x="45" y="40" className="cai-node-label">
            R1
          </text>
          <text x="45" y="115" className="cai-node-label">
            R3
          </text>
          <text x="455" y="40" className="cai-node-label">
            R3
          </text>
          <text x="455" y="115" className="cai-node-label">
            R1
          </text>
          <text x="85" y="26">
            slot A
          </text>
          <text x="85" y="130">
            slot B
          </text>
          <text x="490" y="40">
            slot A
          </text>
          <text x="490" y="115">
            slot B
          </text>
        </svg>
      </Local>
      <ProbabilityRows
        values={[state.first, state.second, state.mean]}
        labels={['R1 pass1', 'R1 pass2', 'R1 mean']}
        hues={['amber', 'amber', 'amber']}
        name="Mapped R1 probability"
      />
      <p className="cai-result">
        Order gap: {fmt(state.gap)}.{' '}
        {missing
          ? 'Mean unknown: a pass is missing.'
          : 'A mean does not repair an uninformative or biased pair.'}
      </p>
      <Controls
        reset={() => {
          setFirst(0.8);
          setSecond(0.4);
          setMissing(false);
        }}
      >
        <Field label="Pass 1: P(A)" value={first} min={0} max={1} step={0.01} onChange={setFirst} />
        <Field
          label="Pass 2: P(A)"
          value={second}
          min={0}
          max={1}
          step={0.01}
          onChange={setSecond}
        />
        <Toggle label="Second pass unavailable" value={missing} onChange={setMissing} />
      </Controls>
    </Lab>
  );
}
export function LabelTransform({ credit = false }) {
  const [q, setQ] = useState(0.9),
    [mode, setMode] = useState('clamped'),
    [lower, setLower] = useState(0.4),
    [upper, setUpper] = useState(0.6);
  let transformed, error;
  try {
    transformed = transformedLabel(q, mode, lower, upper);
  } catch (e) {
    error = e.message;
  }
  const raw = transformedLabel(q, 'soft'),
    hard = transformedLabel(q, 'hard');
  return (
    <Lab
      id={credit ? 'label-credit' : 'label-transform'}
      title={
        credit
          ? 'Compare label credit at a fixed modeled preference'
          : 'Transform the target probability before training'
      }
      note="Constructed raw q. The .4–.6 clamp belongs to an original experiment setting; it is not universally better calibration."
    >
      {credit ? (
        <p>
          The reward model's fixed preference is p=.5. Compare the score-difference derivative p−q
          for each target from section 4.
        </p>
      ) : (
        <ProbabilityRows
          values={[raw, hard, error ? null : transformed]}
          labels={['Raw q', 'Hard q', 'Active q']}
          hues={['cyan', 'violet', 'violet']}
          name="Target probability on [0,1]"
        />
      )}
      {error ? (
        <p className="cai-invalid">{error}</p>
      ) : credit ? (
        <>
          <SignedRows
            values={[0.5 - raw, 0.5 - hard, 0.5 - transformed]}
            labels={['Raw p−q', 'Hard p−q', 'Active p−q']}
            scale={0.5}
          />
          <p className="cai-result">
            Raw q={fmt(raw)} · hard q={fmt(hard)} · active q={fmt(transformed)}. At model p=.5:
            active binary cross-entropy {fmt(Math.log(2))}; difference gradient{' '}
            {fmt(0.5 - transformed)}. A .5 tie gives no directional credit.
          </p>
        </>
      ) : (
        <p className="cai-result">
          Raw q={fmt(raw)} → hard q={fmt(hard)} or active q={fmt(transformed)}. These are
          alternative target instructions; no reward-model loss or derivative is computed in this
          view.
        </p>
      )}
      <Controls
        reset={() => {
          setQ(0.9);
          setMode('clamped');
          setLower(0.4);
          setUpper(0.6);
        }}
      >
        <Field label="Raw target q" value={q} min={0} max={1} step={0.01} onChange={setQ} />
        <Select
          label="Active transform"
          value={mode}
          onChange={setMode}
          options={[
            ['soft', 'Soft'],
            ['hard', 'Hard with .5 tie'],
            ['clamped', 'Clamped'],
          ]}
        />
        <Field label="Clamp lower" value={lower} min={0} max={1} step={0.01} onChange={setLower} />
        <Field label="Clamp upper" value={upper} min={0} max={1} step={0.01} onChange={setUpper} />
      </Controls>
    </Lab>
  );
}
export function LabelCredit() {
  return <LabelTransform credit />;
}
export function RewardHead() {
  const [w, setW] = useState([1, 0.5]),
    [a, setA] = useState([1, 0.2]),
    [b, setB] = useState([0, 0.2]),
    [offset, setOffset] = useState(0);
  const state = headPair(a, b, w, offset);
  return (
    <Lab
      id="reward-head"
      title="One shared scalar head compares two hidden vectors"
      note="These two-dimensional h vectors are supplied features, not semantic judgments. Candidate IDs persist; the local role legend names vector and coefficient ownership."
    >
      <Legend roles />
      <Local label="Hidden vectors, shared weight and scalar summands">
        <table className="cai-head-table">
          <thead>
            <tr>
              <th>Response</th>
              <th>h₀</th>
              <th>h₁</th>
              <th>w₀h₀</th>
              <th>w₁h₁</th>
              <th>Σ + offset</th>
            </tr>
          </thead>
          <tbody>
            {[
              [a, state.termsA, state.a, 0],
              [b, state.termsB, state.b, 2],
            ].map(([h, terms, score, index]) => (
              <tr key={index}>
                <th>
                  <Candidate index={index} />
                </th>
                {h.map((x, i) => (
                  <td key={`h${i}`} className="cai-cyan">
                    {fmt(x)}
                  </td>
                ))}
                {terms.map((x, i) => (
                  <td key={`t${i}`}>
                    {fmt(w[i])} × {fmt(h[i])} = {fmt(x)}
                  </td>
                ))}
                <td className="cai-violet">{fmt(score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
      <p className="cai-result">
        r(R1)−r(R3)={fmt(state.delta)} → sigmoid = {fmt(state.p)}. The common offset cancels.
      </p>
      <Controls
        reset={() => {
          setW([1, 0.5]);
          setA([1, 0.2]);
          setB([0, 0.2]);
          setOffset(0);
        }}
      >
        {w.map((x, i) => (
          <Field
            key={`w${i}`}
            label={`Weight w${i}`}
            value={x}
            min={-5}
            max={5}
            onChange={(v) => setW(w.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        {a.map((x, i) => (
          <Field
            key={`a${i}`}
            label={`R1 hidden h${i}`}
            value={x}
            min={-5}
            max={5}
            onChange={(v) => setA(a.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        {b.map((x, i) => (
          <Field
            key={`b${i}`}
            label={`R3 hidden h${i}`}
            value={x}
            min={-5}
            max={5}
            onChange={(v) => setB(b.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        <Field
          label="Common score offset"
          value={offset}
          min={-100}
          max={100}
          onChange={setOffset}
        />
      </Controls>
    </Lab>
  );
}
export function PreferenceGradient() {
  const [a, setA] = useState(1),
    [b, setB] = useState(0),
    [q, setQ] = useState(0.75),
    [rate, setRate] = useState(0.2);
  const state = preferenceStep(a, b, q, rate);
  return (
    <Lab
      id="preference-gradient"
      title="Opposing score derivatives carry one pair's credit"
      note="Constructed independently editable response scores. Updating both score parameters is distinct from the one-feature weight update in the program; gradients to the frozen judge are absent."
    >
      <p>
        Difference {fmt(a - b)} → sigmoid p={fmt(state.p)} → pair BCE={fmt(state.loss)}.
      </p>
      <SignedRows values={[state.gradient, -state.gradient]} labels={['∂L/∂r(R1)', '∂L/∂r(R3)']} />
      <div className="cai-gradient-route">
        <span>
          <Candidate index={0} /> {fmt(a)} → {fmt(state.next[0])}
        </span>
        <span className="cai-dashed-label">−η · opposing gradients</span>
        <span>
          <Candidate index={2} /> {fmt(b)} → {fmt(state.next[1])}
        </span>
      </div>
      <p className="cai-result">
        Next pair loss: {fmt(preferenceStep(...state.next, q, 0).loss)}.{' '}
        {Math.abs(state.gradient) < 1e-12 || rate === 0
          ? 'Exact zero-update case.'
          : 'Descent is a local update; the target is supplied data, not a gradient recipient.'}
      </p>
      <Controls
        reset={() => {
          setA(1);
          setB(0);
          setQ(0.75);
          setRate(0.2);
        }}
      >
        <Field label="Score R1" value={a} min={-10} max={10} onChange={setA} />
        <Field label="Score R3" value={b} min={-10} max={10} onChange={setB} />
        <Field label="Target for R1 q" value={q} min={0} max={1} step={0.01} onChange={setQ} />
        <Field label="Step η" value={rate} min={0} max={2} onChange={setRate} />
        <button type="button" onClick={() => setQ(state.p)}>
          Set q to current p (null gradient)
        </button>
      </Controls>
    </Lab>
  );
}
export function PreferenceCycle() {
  const [cycle, setCycle] = useState(true),
    [scores, setScores] = useState([1, 0, -1]);
  const differences = [
    scores[0] - scores[1],
    scores[1] - scores[2],
    cycle ? scores[2] - scores[0] : scores[0] - scores[2],
  ];
  return (
    <Lab
      id="preference-cycle"
      title="A strict preference cycle cannot be one scalar ordering"
      note="Constructed same-context preferences. Arrows mean stipulated preferred→rejected; they are not measured human votes."
    >
      <Legend />
      <Local label="Directed preference-cycle triangle">
        <div className="cai-cycle">
          <svg
            width="290"
            height="230"
            viewBox="0 0 290 230"
            role="img"
            aria-label={`R1 preferred to R2, R2 to R3, ${cycle ? 'R3 to R1' : 'R1 to R3'}`}
          >
            <defs>
              <marker
                id="cai-cycle-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8" fill="currentColor" />
              </marker>
            </defs>
            <path
              d="M135 42 L52 181"
              className="cai-neutral-line"
              markerEnd="url(#cai-cycle-arrow)"
            />
            <path
              d="M62 198 L227 198"
              className="cai-neutral-line"
              markerEnd="url(#cai-cycle-arrow)"
            />
            <path
              d={cycle ? 'M237 181 L155 42' : 'M155 42 L237 181'}
              className="cai-neutral-line"
              markerEnd="url(#cai-cycle-arrow)"
            />
            <circle cx="145" cy="25" r="20" className="cai-circle-amber" />
            <circle cx="42" cy="198" r="20" className="cai-circle-blue" />
            <circle cx="247" cy="198" r="20" className="cai-circle-violet" />
            <text x="145" y="30">
              R1
            </text>
            <text x="42" y="203">
              R2
            </text>
            <text x="247" y="203">
              R3
            </text>
          </svg>
        </div>
      </Local>
      <Local label="Each requested preference and its scalar probability">
        <table>
          <thead>
            <tr>
              <th>Observed preference</th>
              <th>Score difference</th>
              <th>Model probability</th>
            </tr>
          </thead>
          <tbody>
            {['R1 > R2', 'R2 > R3', cycle ? 'R3 > R1' : 'R1 > R3'].map((label, i) => (
              <tr key={i}>
                <th>{label}</th>
                <td>{fmt(differences[i])}</td>
                <td>{fmt(1 / (1 + Math.exp(-differences[i])))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
      <p className="cai-result">
        {cycle
          ? `Cycle differences sum to ${fmt(differences.reduce((x, y) => x + y, 0))}; all three cannot be strictly positive.`
          : 'Transitive targets can agree with this scalar ordering.'}
      </p>
      <Controls
        reset={() => {
          setCycle(true);
          setScores([1, 0, -1]);
        }}
      >
        <Toggle label="Cycle: R3 preferred to R1" value={cycle} onChange={setCycle} />
        {scores.map((x, i) => (
          <Field
            key={i}
            label={`Score ${candidates[i].id}`}
            value={x}
            min={-5}
            max={5}
            onChange={(v) => setScores(scores.map((z, j) => (i === j ? v : z)))}
          />
        ))}
      </Controls>
    </Lab>
  );
}
export function PolicyAnchor() {
  const [reference, setReference] = useState([0.6, 0.2, 0.2]),
    [rewards, setRewards] = useState([0, 0, 1]),
    [beta, setBeta] = useState(1);
  let state, error;
  try {
    state = policyOptimum(reference, rewards, beta);
  } catch (e) {
    error = e.message;
  }
  return (
    <Lab
      id="policy-anchor"
      title="Reweight a supported reference, then renormalize the policy"
      note="Constructed three-action policy. Exponentials subtract the supported maximum reward for stability; that common factor cancels from normalization."
    >
      <Legend />
      {error ? (
        <p className="cai-invalid">{error}</p>
      ) : (
        <>
          <div className="cai-distribution-pair">
            <div>
              <h4>Reference · frozen</h4>
              <ProbabilityRows values={state.ref} />
            </div>
            <div>
              <h4>Optimal policy {state.limit ? '· β=0 limit' : ''}</h4>
              <ProbabilityRows values={state.policy} />
            </div>
          </div>
          <Local label="Reward exponential factors and supported weights">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Reward</th>
                  <th>Relative exp factor</th>
                  <th>Reference × factor</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id}>
                    <th>
                      <Candidate index={i} />
                    </th>
                    <td>{rewards[i]}</td>
                    <td>{fmt(state.factors[i])}</td>
                    <td>{fmt(state.weights[i])}</td>
                    <td>{state.ref[i] === 0 ? 'excluded: reference zero' : 'included'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Local>
          <p className="cai-result">
            Expected reward {fmt(state.reward)} · KL(policy || ref) {fmt(state.kl)} · objective{' '}
            {fmt(state.objective)}.{' '}
            {state.limit
              ? 'At β=0, supported reward maximizers share mass proportional to their reference weights.'
              : 'Equal rewards recover the reference; KL constrains deviation, not correctness.'}
          </p>
        </>
      )}
      <Controls
        reset={() => {
          setReference([0.6, 0.2, 0.2]);
          setRewards([0, 0, 1]);
          setBeta(1);
        }}
      >
        {reference.map((x, i) => (
          <Field
            key={`p${i}`}
            label={`Reference weight ${candidates[i].id}`}
            value={x}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setReference(reference.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        {rewards.map((x, i) => (
          <Field
            key={`r${i}`}
            label={`Reward ${candidates[i].id}`}
            value={x}
            min={-5}
            max={5}
            onChange={(v) => setRewards(rewards.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        <Field label="KL weight β" value={beta} min={0} max={20} onChange={setBeta} />
      </Controls>
    </Lab>
  );
}
export function DpoUpdate() {
  const [logits, setLogits] = useState([Math.log(0.6), Math.log(0.2), Math.log(0.2)]),
    [chosen, setChosen] = useState(2),
    [rejected, setRejected] = useState(0),
    [beta, setBeta] = useState(0.5),
    [rate, setRate] = useState(0.2);
  const state = dpoStep(logits, [0.6, 0.2, 0.2], chosen, rejected, beta, rate);
  return (
    <Lab
      id="dpo-update"
      title="DPO updates normalized policy logits against a frozen reference"
      note="Finite candidate policy, not a length heuristic or full LLM reproduction. Candidate identity survives selected pair changes."
    >
      <Legend />
      <div className="cai-distribution-pair">
        <div>
          <h4>Before policy</h4>
          <ProbabilityRows values={state.policy} />
        </div>
        <div>
          <h4>After one logit step</h4>
          <ProbabilityRows values={state.next} />
        </div>
      </div>
      <p>
        Frozen reference [0.6,0.2,0.2]; log(policy/ref)=[
        {state.ratios.map((x) => fmt(x)).join(', ')}].
      </p>
      <p>
        β × (chosen ratio − rejected ratio) = {fmt(state.margin)} → loss {fmt(state.loss)}.
      </p>
      <SignedRows
        values={state.gradients}
        labels={candidates.map((x) => `∂L/∂logit ${x.id}`)}
        scale={2}
      />
      <p className="cai-result">
        {state.informative
          ? 'Descent subtracts these logit derivatives; softmax then changes all probability shares.'
          : 'No directional information: identical pair or β=0. The loss is ln 2, and every gradient is zero.'}
      </p>
      <Controls
        reset={() => {
          setLogits([Math.log(0.6), Math.log(0.2), Math.log(0.2)]);
          setChosen(2);
          setRejected(0);
          setBeta(0.5);
          setRate(0.2);
        }}
      >
        {logits.map((x, i) => (
          <Field
            key={i}
            label={`Policy logit ${candidates[i].id}`}
            value={x}
            min={-10}
            max={10}
            onChange={(v) => setLogits(logits.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        <Select
          label="Chosen"
          value={chosen}
          onChange={(v) => setChosen(Number(v))}
          options={candidates.map((c, i) => [i, c.id])}
        />
        <Select
          label="Rejected"
          value={rejected}
          onChange={(v) => setRejected(Number(v))}
          options={candidates.map((c, i) => [i, c.id])}
        />
        <Field label="β" value={beta} min={0} max={2} onChange={setBeta} />
        <Field label="η" value={rate} min={0} max={2} onChange={setRate} />
      </Controls>
    </Lab>
  );
}

function useExactArtifact(file, expected, validate) {
  const [state, setState] = useState({ status: 'loading' }),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setState({ status: 'loading' });
    (async () => {
      try {
        const response = await fetch(`/learn/examples/constitutional-ai/${file}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Artifact request failed (${response.status}).`);
        const bytes = await response.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        const hash = Array.from(new Uint8Array(digest), (x) =>
          x.toString(16).padStart(2, '0'),
        ).join('');
        if (hash !== expected) throw new Error('Artifact bytes do not match the retained source.');
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (!validate(data)) throw new Error('Retained artifact schema is invalid.');
        if (alive) setState({ status: 'ready', data, hash });
      } catch (error) {
        if (alive && error.name !== 'AbortError')
          setState({ status: 'error', error: error.message });
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [file, expected, attempt]);
  return { ...state, retry: () => setAttempt((x) => x + 1) };
}
function ArtifactState({ state }) {
  return state.status === 'loading' ? (
    <p role="status">Loading the retained artifact…</p>
  ) : (
    <div role="alert">
      <p>{state.error} No values are substituted.</p>
      <button type="button" onClick={state.retry}>
        Retry artifact
      </button>
    </div>
  );
}
export function RealRecordAudit() {
  const state = useExactArtifact(
    'cai_records.json',
    'd3bcfff6d7477e6add4c36cfb677cc38a12f68df907d907107e5c8ec0f47526c',
    (x) => Array.isArray(x.rows) && x.rows.length === 10,
  );
  const [selected, setSelected] = useState(9);
  const entry =
    state.status === 'ready' ? state.data.rows.find((x) => x.row_idx === selected) : null;
  const row = entry?.row,
    duplicate = row ? row.init_response.trim() === row.revision_response.trim() : null;
  return (
    <Lab
      id="real-record-audit"
      title="Read exact H4 records before trusting the chosen field"
      note="Ten convenience-selected real rows. Chosen/rejected are generated fields, not independently established quality labels. Full responses are retained and reflow."
    >
      {state.status !== 'ready' ? (
        <ArtifactState state={state} />
      ) : (
        <>
          <dl className="cai-record">
            <dt>Original user request</dt>
            <dd>{row.init_prompt}</dd>
            <dt>Draft · init_response</dt>
            <dd>{row.init_response}</dd>
            <dt>Critic instruction</dt>
            <dd>{row.critic_prompt}</dd>
            <dt>Recorded critique</dt>
            <dd>{row.critic_response}</dd>
            <dt>Revision instruction</dt>
            <dd>{row.revision_prompt}</dd>
            <dt>Revision · generated chosen response</dt>
            <dd>{row.revision_response}</dd>
          </dl>
          <p className="cai-result">
            Stripped draft equals revision:{' '}
            <strong>{duplicate ? 'yes · zero response difference' : 'no'}</strong>.{' '}
            {selected === 9
              ? 'Author interpretation: the relativity revision drifts from the self-description request.'
              : selected === 96
                ? 'Author interpretation: inspect retained example/format contamination.'
                : duplicate
                  ? 'Mechanical equality says nothing about correctness; ordinary winner training has no response difference here.'
                  : 'A text difference alone does not establish improvement.'}
          </p>
          <p className="cai-source-id">
            Exact artifact SHA256: {state.hash}. Apache-2.0; metadata commit{' '}
            {state.data.provenance.metadata_commit}. Served rows did not advertise a pinned commit.
          </p>
          <Controls reset={() => setSelected(9)}>
            <Select
              label="Original served row index"
              value={selected}
              onChange={(v) => setSelected(Number(v))}
              options={state.data.rows.map((x) => [x.row_idx, `Row ${x.row_idx}`])}
            />
          </Controls>
        </>
      )}
    </Lab>
  );
}
export function Seq2seqAnatomy() {
  const state = useExactArtifact(
    'critic_outputs.json',
    'b6ad5866aeb4d60ee80545a01dfceb35d495782cc63dfabbc0511119016adf61',
    (x) => Array.isArray(x.records) && x.records.length === 4,
  );
  const [selected, setSelected] = useState('private-contact'),
    [order, setOrder] = useState(0),
    [option, setOption] = useState('a'),
    [selectedToken, setSelectedToken] = useState(0);
  const record =
    state.status === 'ready' ? state.data.records.find((x) => x.id === selected) : null;
  const pass = record?.judge_passes[order],
    scored = pass?.[`option_${option}`],
    start = record?.draft.output_ids[0];
  const total = scored?.token_logprobs.reduce((a, b) => a + b, 0);
  return (
    <Lab
      id="seq2seq-anatomy"
      title="Actual T5 encoder context and shifted decoder option targets"
      note="Recorded CPU FLAN-T5-small inference; selecting a trace does not run a model. Generation and teacher-forced option scoring have their own contexts."
    >
      {state.status !== 'ready' ? (
        <ArtifactState state={state} />
      ) : (
        <>
          <div className="cai-encoder-decoder">
            <div>
              <h4>Generation: encoder input</h4>
              <p>{record.critic_prompt}</p>
              <Local label="Actual critique encoder input IDs">
                <div className="cai-id-stream">
                  {record.critique.input_ids.map((x, i) => (
                    <span key={i}>{x}</span>
                  ))}
                </div>
              </Local>
              <p>
                Actual critique: <q>{record.critique.text}</q>
              </p>
              <p>
                Actual revision: <q>{record.revision.text}</q>
              </p>
            </div>
            <div>
              <h4>Option scoring: decoder shift</h4>
              <p>Teacher-forcing context:</p>
              <p>{pass.judge_prompt}</p>
              <Local label="Decoder input IDs, labels and conditional token scores">
                <table>
                  <thead>
                    <tr>
                      <th>Position</th>
                      {scored.token_ids.map((_, i) => (
                        <th key={i}>{i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Decoder input ID</th>
                      {scored.token_ids.map((_, i) => (
                        <td key={i}>{i === 0 ? start : scored.token_ids[i - 1]}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>Target ID</th>
                      {scored.token_ids.map((x, i) => (
                        <td key={i}>{x}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>Target token</th>
                      {scored.tokens.map((x, i) => (
                        <td key={i}>
                          <button
                            type="button"
                            onFocus={() => setSelectedToken(i)}
                            onClick={() => setSelectedToken(i)}
                            aria-pressed={selectedToken === i}
                          >
                            {x}
                          </button>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th>Conditional log p</th>
                      {scored.token_logprobs.map((x, i) => (
                        <td key={i}>{fmt(x, 9)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Local>
              <p>
                Selected target {selectedToken}: {scored.tokens[selectedToken]} (ID{' '}
                {scored.token_ids[selectedToken]}) follows decoder input ID{' '}
                {selectedToken === 0 ? start : scored.token_ids[selectedToken - 1]}; its conditional
                log p is {fmt(scored.token_logprobs[selectedToken], 9)}.
              </p>
              <p className="cai-result">
                Sum through EOS={fmt(total, 9)}; recorded sequence log p=
                {fmt(scored.sequence_logprob, 9)}. P(A | A or B)=
                {fmt(pass.conditional_probability_a)}.
              </p>
            </div>
          </div>
          <ProbabilityRows
            values={record.revision_probability_mapped}
            labels={['Revision: pass1', 'Revision: pass2']}
            hues={['violet', 'violet']}
            name="Mapped revision probability"
          />
          <p>
            Mean={fmt(record.revision_probability_mean)} · order gap={fmt(record.order_gap)} · exact
            duplicate={record.exact_duplicate ? 'yes' : 'no'}.
          </p>
          <p className="cai-source-id">
            {state.data.model} · revision {state.data.revision} ·{' '}
            {state.data.parameters.toLocaleString('en-US')} parameters · Transformers{' '}
            {state.data.versions.transformers} · SHA256 {state.hash}
          </p>
          <Controls
            reset={() => {
              setSelected('private-contact');
              setOrder(0);
              setOption('a');
              setSelectedToken(0);
            }}
          >
            <Select
              label="Recorded request"
              value={selected}
              onChange={setSelected}
              options={state.data.records.map((x) => [x.id, x.id])}
            />
            <Select
              label="Presentation order"
              value={order}
              onChange={(v) => setOrder(Number(v))}
              options={[
                [0, 'Draft A, revision B'],
                [1, 'Revision A, draft B'],
              ]}
            />
            <Select
              label="Scored option"
              value={option}
              onChange={setOption}
              options={[
                ['a', 'A'],
                ['b', 'B'],
              ]}
            />
          </Controls>
        </>
      )}
    </Lab>
  );
}
export function CoverageCounts() {
  const [rows, setRows] = useState([
      [6, 4, 0],
      [8, 1, 1],
    ]),
    [exclude, setExclude] = useState(false);
  const effective = exclude ? [[0, 0, 0], rows[1]] : rows,
    state = coverage(effective);
  return (
    <Lab
      id="coverage-counts"
      title="Different failures need their own request-stratum denominators"
      note="Constructed counts with supplied external response annotations. They are not measured safety results from H4 or the small critic."
    >
      <Local label="Request stratum by response category">
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Constructive</th>
              <th>Refusal</th>
              <th>Disclosure</th>
              <th>Stratum total</th>
            </tr>
          </thead>
          <tbody>
            {effective.map((row, i) => (
              <tr key={i}>
                <th>{['Benign', 'Private-detail'][i]}</th>
                {row.map((x, j) => (
                  <td
                    key={j}
                    className={j === 1 ? 'cai-blue' : j === 2 ? 'cai-rose' : 'cai-violet'}
                  >
                    {x}
                  </td>
                ))}
                <td>{state.totals[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
      <ProbabilityRows
        values={[state.overRefusal, state.disclosure]}
        labels={['Benign refusal', 'Private disclosure']}
        hues={['blue', 'rose']}
        name="Rate within its own stratum"
      />
      <p className="cai-result">
        Benign refusal: {effective[0][1]}/{state.totals[0]}{' '}
        {state.totals[0] ? '' : '· no denominator, unknown'}. Private disclosure: {effective[1][2]}/
        {state.totals[1]} {state.totals[1] ? '' : '· no denominator, unknown'}.
      </p>
      <Controls
        reset={() => {
          setRows([
            [6, 4, 0],
            [8, 1, 1],
          ]);
          setExclude(false);
        }}
      >
        {rows.flatMap((row, i) =>
          row.map((x, j) => (
            <Field
              key={`${i}${j}`}
              label={`${['Benign', 'Private-detail'][i]} ${['constructive', 'refusal', 'disclosure'][j]}`}
              value={x}
              min={0}
              max={40}
              step={1}
              onChange={(v) =>
                setRows(rows.map((r, k) => r.map((z, l) => (i === k && j === l ? v : z))))
              }
            />
          )),
        )}
        <Toggle label="Exclude benign stratum" value={exclude} onChange={setExclude} />
      </Controls>
    </Lab>
  );
}
export function CalibrationBins() {
  const initial = [
    { q: 0.1, label: 0 },
    { q: 0.2, label: 1 },
    { q: 0.6, label: 1 },
    { q: 0.8, label: 1 },
  ];
  const [rows, setRows] = useState(initial),
    [bins, setBins] = useState(4),
    [empty, setEmpty] = useState(false);
  const state = calibration(empty ? [] : rows, bins);
  return (
    <Lab
      id="calibration-bins"
      title="Forecasts meet independently supplied labels, with bin counts"
      note="Constructed four-row arithmetic. Small/empty bins do not establish real judge calibration. Forecast and observed frequency are different quantities."
    >
      <div className="cai-bin-ledger">
        {state.bins.map((bin, i) => (
          <div key={i}>
            <h4>
              Bin {i + 1}: {fmt(i / bins, 2)}–{fmt((i + 1) / bins, 2)}
              {i === bins - 1 ? ' inclusive at 1' : ''}
            </h4>
            <p>Count: {bin.count}</p>
            <ProbabilityRows
              values={[bin.mean, bin.observed]}
              labels={['Mean forecast', 'Observed label1']}
              hues={['violet', 'cyan']}
              name="Bin rate"
            />
          </div>
        ))}
      </div>
      <p className="cai-result">
        Brier mean squared error={fmt(state.brier)} · contributing rows={empty ? 0 : rows.length}.
        Empty bins remain unknown.
      </p>
      <Controls
        reset={() => {
          setRows(initial);
          setBins(4);
          setEmpty(false);
        }}
      >
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            <Field
              label={`Example ${i + 1} forecast q`}
              value={row.q}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setRows(rows.map((r, j) => (i === j ? { ...r, q: v } : r)))}
            />
            <Select
              label={`Example ${i + 1} external label`}
              value={row.label}
              onChange={(v) =>
                setRows(rows.map((r, j) => (i === j ? { ...r, label: Number(v) } : r)))
              }
              options={[
                [0, '0'],
                [1, '1'],
              ]}
            />
          </React.Fragment>
        ))}
        <Field label="Number of bins" value={bins} min={1} max={8} step={1} onChange={setBins} />
        <Toggle label="No held-out rows" value={empty} onChange={setEmpty} />
      </Controls>
    </Lab>
  );
}
export function ErrorDependence() {
  const [error, setError] = useState(0.2),
    [shared, setShared] = useState(false),
    state = errorStructure(error, shared);
  return (
    <Lab
      id="error-dependence"
      title="Three error bits: independence and a shared mistake differ"
      note="Binary-label assumption, not a student training experiment. Bits mean wrong labels (1) versus correct labels (0); majority is wrong with two or three errors."
    >
      <div className="cai-error-owners">
        {shared ? (
          <>
            <span className="cai-rose">One shared error bit</span>
            <span className="cai-fan">↙ ↓ ↘</span>
          </>
        ) : (
          <span>Three independent Bernoulli draws</span>
        )}
        <div>
          <span>Labeler 1</span>
          <span>Labeler 2</span>
          <span>Labeler 3</span>
        </div>
      </div>
      <Local label="Eight actual error patterns and their probability mass">
        <table>
          <thead>
            <tr>
              <th>Error bits 1/2/3</th>
              <th>Count wrong</th>
              <th>Pattern mass</th>
              <th>Majority wrong?</th>
            </tr>
          </thead>
          <tbody>
            {state.outcomes.map((x, i) => (
              <tr key={i}>
                <th className="cai-bit-row">
                  {x.bits.map((b, j) => (
                    <span key={j} className={b ? 'cai-rose' : 'cai-blue'}>
                      {b}
                    </span>
                  ))}
                </th>
                <td>{x.errors}</td>
                <td>{fmt(x.mass)}</td>
                <td>{x.errors >= 2 ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Local>
      <p className="cai-result">
        Sum of wrong-majority masses={fmt(state.majority)}; individual ε={fmt(error)}.{' '}
        {shared
          ? 'The same mistake survives all three labels.'
          : 'Independence is an explicit fixture assumption.'}
      </p>
      <Controls
        reset={() => {
          setError(0.2);
          setShared(false);
        }}
      >
        <Field
          label="Individual error probability ε"
          value={error}
          min={0}
          max={1}
          step={0.01}
          onChange={setError}
        />
        <Toggle label="All labelers share one error bit" value={shared} onChange={setShared} />
      </Controls>
    </Lab>
  );
}
export function CollectiveVotes() {
  const [sizes, setSizes] = useState([20, 20]),
    [rates, setRates] = useState([0.9, 0.2]),
    [missing, setMissing] = useState(false);
  const counts = rates.map((q, i) => Math.round(q * sizes[i])),
    state = consensus(counts, sizes, missing);
  return (
    <Lab
      id="collective-votes"
      title="Group-aware agreement multiplies fractions; majority weights counts"
      note="Constructed vote matrix. Groups are stipulated here, not the Collective study's participants or inferred clusters. Integer rounding can change a requested fraction."
    >
      <div className="cai-vote-groups">
        {sizes.map((size, i) => (
          <div key={i}>
            <h4>Group {i + 1}</h4>
            {missing && i === 1 ? (
              <p>Missing votes; no probability estimate.</p>
            ) : (
              <>
                <div
                  className="cai-votes"
                  aria-label={`${counts[i]} agreement votes out of ${size}`}
                >
                  {Array.from({ length: size }, (_, j) => (
                    <span
                      key={j}
                      className={j < counts[i] ? 'cai-vote-agree' : 'cai-vote-other'}
                      title={`${j < counts[i] ? 'agree' : 'other'} vote ${j + 1}`}
                    >
                      {j < counts[i] ? '+' : '−'}
                    </span>
                  ))}
                </div>
                <p>
                  {counts[i]}/{size}={fmt(state.rates[i])}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="cai-legend">Blue +: agree · neutral −: other vote</p>
      <p className="cai-result">
        GAC product={fmt(state.gac)} · size-weighted overall agreement={fmt(state.majority)}.
        Empty/missing groups make the product unknown.
      </p>
      <Controls
        reset={() => {
          setSizes([20, 20]);
          setRates([0.9, 0.2]);
          setMissing(false);
        }}
      >
        {sizes.map((x, i) => (
          <Field
            key={`s${i}`}
            label={`Group ${i + 1} size`}
            value={x}
            min={0}
            max={40}
            step={1}
            onChange={(v) => setSizes(sizes.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        {rates.map((x, i) => (
          <Field
            key={`q${i}`}
            label={`Group ${i + 1} requested fraction`}
            value={x}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setRates(rates.map((z, j) => (i === j ? v : z)))}
          />
        ))}
        <Toggle label="Group 2 estimate missing" value={missing} onChange={setMissing} />
        <button
          type="button"
          onClick={() => {
            setSizes([20, 20]);
            setRates([0.65, 0.65]);
            setMissing(false);
          }}
        >
          Use 13/20 in both groups
        </button>
      </Controls>
    </Lab>
  );
}
export function ConstitutionTimeline() {
  const events = [
    [
      '2022',
      'Original CAI experiment',
      'Critique/revision → SFT; independent AI judgments → preference model → RL',
      'https://arxiv.org/abs/2212.08073',
    ],
    [
      '2023',
      'Public principles',
      'Published principle examples; norms and prompting artifacts',
      'https://www.anthropic.com/news/claudes-constitution',
    ],
    [
      '2024',
      'H4 creator recipe',
      'Revision chosen / draft rejected as a distinct DPO shortcut',
      'https://huggingface.co/blog/constitutional_ai',
    ],
    [
      '2024',
      'Collective CAI',
      'Public statements → moderation/groups → curated constitution → training',
      'https://arxiv.org/abs/2406.07814',
    ],
    [
      '2024–25',
      'Deliberative Alignment',
      'Specification reasoning trained with SFT and RL',
      'https://arxiv.org/abs/2412.16339',
    ],
    [
      '2026',
      'Updated holistic constitution',
      'Normative document; not a disclosed replica of the 2022 training pipeline',
      'https://www.anthropic.com/news/claude-new-constitution',
    ],
  ];
  return (
    <Lab
      id="constitution-timeline"
      title="Documents, data recipes and trained methods are different artifacts"
      note="Chronological positions are labelled dates, not a capability scale or identical production-pipeline claim."
    >
      <ol className="cai-timeline">
        {events.map(([year, title, artifact, url]) => (
          <li key={title}>
            <time>{year}</time>
            <div>
              <a href={url}>{title}</a>
              <p>{artifact}</p>
            </div>
          </li>
        ))}
      </ol>
    </Lab>
  );
}
export function WorkLedger() {
  const [n, setN] = useState(10),
    [rounds, setRounds] = useState(2),
    [pairs, setPairs] = useState(10),
    [orders, setOrders] = useState(2),
    [judges, setJudges] = useState(1),
    [prompt, setPrompt] = useState(80),
    [response, setResponse] = useState(40),
    [history, setHistory] = useState(false);
  const state = workLedger(n, rounds, pairs, orders, judges, prompt, response, history);
  return (
    <Lab
      id="work-ledger"
      title="Calls, sequences, pairs and token lengths have separate totals"
      note="Constructed per-call lengths: prompt includes instruction/criterion; critique adds draft, revision adds draft+critique, judge adds both responses and generates one two-token A/B answer including EOS. This budget assumes one generation call per comparison; the real teacher-forced critic program instead scores both complete options in two forward passes per comparison. Each bar shows input/output shares within that row, not absolute lengths across rows. Training compute and prices are excluded."
    >
      <div className="cai-call-segments">
        {state.calls.map((call, i) => (
          <div key={i}>
            <strong>
              {call.kind} × {call.count}
            </strong>
            <div
              className="cai-call-track"
              aria-label={`Per-call input share ${call.input}/${call.input + call.output}, output share ${call.output}/${call.input + call.output}`}
            >
              <span aria-hidden="true" className="cai-fill-cyan" style={{ flex: call.input }} />
              <span aria-hidden="true" className="cai-fill-violet" style={{ flex: call.output }} />
            </div>
            <p>
              <span className="cai-cyan">input {call.input}</span> ·{' '}
              <span className="cai-violet">output {call.output}</span> · per-call total{' '}
              {call.input + call.output}
            </p>
            <p>
              {call.count} × ({call.input}+{call.output}) ={' '}
              {call.count * (call.input + call.output)} tokens
            </p>
          </div>
        ))}
      </div>
      <p className="cai-result">
        Generation calls: {state.generation} · judge calls: {state.judge} · total call tokens:{' '}
        {state.tokens}. Revised SFT sequences all-round/final-only: {state.allTargets}/
        {state.finalTargets}. Preference pairs: {state.pairs}.
      </p>
      <button
        type="button"
        onClick={() => {
          setN(0);
          setPairs(0);
        }}
      >
        No collection and no pairs (zero-work case)
      </button>
      <p>
        Setting collection n=0 alone can leave separately supplied comparison pairs; set m=0 as well
        for all-zero work.
      </p>
      <Controls
        reset={() => {
          setN(10);
          setRounds(2);
          setPairs(10);
          setOrders(2);
          setJudges(1);
          setPrompt(80);
          setResponse(40);
          setHistory(false);
        }}
      >
        <Field label="Collection prompts n" value={n} min={0} max={40} step={1} onChange={setN} />
        <Field
          label="Revision rounds r"
          value={rounds}
          min={0}
          max={4}
          step={1}
          onChange={setRounds}
        />
        <Field
          label="Comparison pairs m"
          value={pairs}
          min={0}
          max={40}
          step={1}
          onChange={setPairs}
        />
        <Field
          label="Orders per pair o"
          value={orders}
          min={1}
          max={2}
          step={1}
          onChange={setOrders}
        />
        <Field
          label="Judge runs per order j"
          value={judges}
          min={1}
          max={4}
          step={1}
          onChange={setJudges}
        />
        <Field
          label="Base input tokens"
          value={prompt}
          min={0}
          max={400}
          step={1}
          onChange={setPrompt}
        />
        <Field
          label="Generated response tokens"
          value={response}
          min={1}
          max={200}
          step={1}
          onChange={setResponse}
        />
        <Toggle
          label="Retain prior critique/revision history"
          value={history}
          onChange={setHistory}
        />
      </Controls>
    </Lab>
  );
}
