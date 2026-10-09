import { useState } from 'react';
import {
  algebraNumber as fmt, parseEquationDraft, equationState, functionProbeState,
  compositionState, quadraticState, growthState, logarithmState,
  inverseSquareState, growthCrossingState,
} from '../../data/algebra-functions-models.js';
import { LessonTable } from './LessonElements';
import {
  AlgebraPlot, AlgebraPipeline, EquationBalance, sampleAlgebra,
} from './AlgebraFunctionsFigures';
import './algebra-functions-labs.css';

function Range({ label, value, onChange, min, max, step = 1 }) {
  return <label className="algebra-control">
    <span>{label}: <strong>{fmt(value)}</strong></span>
    <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

function Reset({ name, onClick }) {
  return <button type="button" onClick={onClick}>{name}</button>;
}

const rates = [-0.5, -0.2, 0, 0.1, 0.2, 0.5, 1];
function RateSelect({ value, onChange, label }) {
  return <label><span>Fractional change per period</span>
    <select aria-label={label} value={value} onChange={event => onChange(Number(event.target.value))}>
      {rates.map(rate => <option value={rate} key={rate}>{rate * 100}% per period</option>)}
    </select>
  </label>;
}

export function EquationStepsLab() {
  const initial = { a: '3', b: '6', c: '21' };
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState(equationState(3, 6, 21));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  function update(next) {
    setDraft(next);
    try {
      setState(parseEquationDraft(next));
      setStep(0);
      setError('');
    } catch (failure) {
      setError(`${failure.message} The drawing still shows the last valid equation.`);
    }
  }
  const frame = state.frames[step];
  return <section className="algebra-lab" aria-label="Equation steps investigation">
    <EquationBalance left={frame.left} right={frame.right} operation={frame.action} equalityHolds={state.kind !== 'none'} />
    <p className="algebra-result" aria-live="polite">
      {state.kind === 'one' ? <>One solution: x = {state.rhs}/{state.a} ≈ {fmt(state.solution)}.</>
        : state.kind === 'all' ? 'Every real x solves the original equation.' : 'No real x solves the original equation.'}
    </p>
    <p>Current equation: {state.a}x + ({state.b}) = {state.c}. Operation {step + 1} of 3.</p>
    <div className="algebra-controls">
      {['a', 'b', 'c'].map(key => <label key={key}><span>Coefficient {key}</span>
        <input aria-label={`Coefficient ${key}`} inputMode="numeric" value={draft[key]}
          onChange={event => update({ ...draft, [key]: event.target.value })} />
      </label>)}
      <Range label="Equation operation" value={step} onChange={setStep} min={0} max={2} />
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="algebra-buttons">
      <Reset name="Every x example" onClick={() => update({ a: '0', b: '7', c: '7' })} />
      <Reset name="No x example" onClick={() => update({ a: '0', b: '7', c: '8' })} />
      <Reset name="Reset equation" onClick={() => update(initial)} />
    </div>
    <p className="lesson-note">Valid integer edits take effect immediately. The exact fraction preserves the answer even when its displayed decimal is rounded.</p>
  </section>;
}

export function FunctionProbeLab() {
  const [kind, setKind] = useState('affine');
  const [input, setInput] = useState(2);
  const state = functionProbeState(kind, input);
  const evaluate = x => kind === 'affine' ? 2 * x + 1 : kind === 'square' ? x * x : 1 / x;
  const curves = kind === 'reciprocal'
    ? [{ values: sampleAlgebra(evaluate, -4, -.05) }, { values: sampleAlgebra(evaluate, .05, 4) }]
    : [{ values: sampleAlgebra(evaluate, -4, 4) }];
  return <section className="algebra-lab" aria-label="Function input and output investigation">
    <AlgebraPlot label="A function curve with the selected input-output point" xRange={[-4, 4]} yRange={[-10, 18]} curves={curves}
      points={state.allowed ? [{ x: input, y: state.y }] : []}
      guides={state.allowed ? [{ from: [input, 0], to: [input, state.y] }, { from: [0, state.y], to: [input, state.y] }] : []} />
    <p className="algebra-result" aria-live="polite">{state.allowed
      ? `Input ${fmt(input)} → output ${fmt(state.y)}; graph point (${fmt(input)}, ${fmt(state.y)}).`
      : 'Input 0 is excluded from 1/x. No output exists there; the output is not zero.'}</p>
    <div className="algebra-controls">
      <label><span>Rule</span><select aria-label="Function rule" value={kind} onChange={event => setKind(event.target.value)}>
        <option value="affine">2x + 1</option><option value="square">x²</option><option value="reciprocal">1/x</option>
      </select></label>
      <Range label="Function input" value={input} onChange={setInput} min={-4} max={4} step={.25} />
      <Reset name="Reset function" onClick={() => { setKind('affine'); setInput(2); }} />
    </div>
    <p className="lesson-note">All curves use the same viewing window. Its edges are not domain restrictions. The reciprocal's two branches stay separate across zero; the selected nonzero queries all fit the window.</p>
  </section>;
}

export function CompositionLab() {
  const [input, setInput] = useState(2);
  const state = compositionState(input);
  return <section className="algebra-lab" aria-label="Function composition investigation">
    <AlgebraPipeline label="Square after affine: S(A(x))" values={[input, state.affine, state.squareAfterAffine]} operations={['×2, then +1', 'square']} />
    <AlgebraPipeline label="Affine after square: A(S(x))" values={[input, state.square, state.affineAfterSquare]} operations={['square', '×2, then +1']} comparison />
    <p className="algebra-result" aria-live="polite">S(A({fmt(input)})) = {fmt(state.squareAfterAffine)}; A(S({fmt(input)})) = {fmt(state.affineAfterSquare)}.</p>
    <div className="algebra-controls"><Range label="Composition input" value={input} onChange={setInput} min={-4} max={4} step={.25} />
      <Reset name="Reset composition" onClick={() => setInput(2)} /></div>
    <p className="lesson-note">Both chains start with the same dimensionless input. Change it to −1 or 0 and compare every intermediate.</p>
  </section>;
}

export function InverseProbeLab() {
  const [branch, setBranch] = useState('full');
  const [output, setOutput] = useState(9);
  const state = inverseSquareState(branch, output);
  const start = branch === 'nonnegative' ? 0 : -4;
  const end = branch === 'nonpositive' ? 0 : 4;
  return <section className="algebra-lab" aria-label="Square inverse branch investigation">
    <AlgebraPlot label="A horizontal output level meets the selected square branch" xRange={[-4, 4]} yRange={[-4, 16]}
      curves={[{ values: sampleAlgebra(x => x * x, start, end) }]}
      guides={[{ from: [-4, output], to: [4, output], comparison: true }]}
      points={state.inputs.map(x => ({ x, y: output }))} />
    <p className="algebra-result" aria-live="polite">Output {fmt(output)}: {state.inputs.length
      ? `input${state.inputs.length > 1 ? 's' : ''} ${state.inputs.map(fmt).join(' and ')}.` : 'no real input on this branch.'}</p>
    <p>{!state.hasInverse
      ? 'The full square rule has no single-valued inverse. At output zero the two candidates coincide, but other positive outputs still have two inputs.'
      : `The ${branch === 'nonnegative' ? 'nonnegative' : 'nonpositive'} branch has an inverse on its range y ≥ 0: ${branch === 'nonnegative' ? '√y' : '−√y'}.`}</p>
    <div className="algebra-controls">
      <label><span>Allowed square inputs</span><select aria-label="Square domain branch" value={branch} onChange={event => setBranch(event.target.value)}>
        <option value="full">All real x</option><option value="nonnegative">x ≥ 0</option><option value="nonpositive">x ≤ 0</option>
      </select></label>
      <Range label="Requested square output" value={output} onChange={setOutput} min={-4} max={16} step={.25} />
      <Reset name="Reset inverse" onClick={() => { setBranch('full'); setOutput(9); }} />
    </div>
    <p className="lesson-note">The dashed horizontal line asks for an output; its intersections identify inputs. Negative requests show the range restriction.</p>
  </section>;
}

export function QuadraticLab() {
  const [h, setH] = useState(3);
  const [k, setK] = useState(-4);
  const state = quadraticState(h, k);
  return <section className="algebra-lab" aria-label="Quadratic roots investigation">
    <AlgebraPlot label="Parabola with vertex and real roots" xRange={[-6, 9]} yRange={[-10, 16]}
      curves={[{ values: sampleAlgebra(x => (x - h) ** 2 + k, -6, 9, 181) }]}
      points={[{ x: h, y: k }, ...state.roots.map(x => ({ x, y: 0 }))]} />
    <p className="algebra-result">y = (x − ({fmt(h)}))² + ({fmt(k)})<br />Expanded: y = x² + ({fmt(state.b)})x + ({fmt(state.c)})</p>
    <p aria-live="polite">Vertex ({fmt(h)}, {fmt(k)}). {k > 0 ? 'No real roots: a nonnegative square cannot equal a negative number.'
      : k === 0 ? `One root x = ${fmt(h)}, repeated twice algebraically.` : `Two roots: h ± √(−k) ≈ ${state.roots.map(fmt).join(' and ')}.`}</p>
    <div className="algebra-controls">
      <Range label="Vertex h" value={h} onChange={setH} min={-2} max={4} step={.5} />
      <Range label="Vertex k" value={k} onChange={setK} min={-9} max={4} step={.5} />
      <Reset name="Reset quadratic" onClick={() => { setH(3); setK(-4); }} />
    </div>
    <p className="lesson-note">The axes stay fixed and contain every supported vertex and root. The upper curve can continue beyond the window; the exact formula still applies there.</p>
  </section>;
}

export function GrowthScaleLab() {
  const [rate, setRate] = useState(.2);
  const [step, setStep] = useState(2);
  const state = growthState(rate, step);
  const high = Math.max(...state.rows.flatMap(row => [row.additive, row.growth]));
  return <section className="algebra-lab" aria-label="Additive and multiplicative growth investigation">
    <AlgebraPlot label="Additive and multiplicative quantities on one shared linear scale" xRange={[0, 8]} yRange={[0, high]}
      xLabel="time (periods)" yLabel={`quantity (units); shared scale 0 to ${fmt(high)}`}
      curves={[{ values: sampleAlgebra(t => 100 * state.multiplier ** t, 0, 8) }, { comparison: true, values: [[0, 100], [8, 260]] }]}
      points={[{ x: step, y: state.active.growth }, { x: step, y: state.active.additive, comparison: true }]} />
    <p className="algebra-result" aria-live="polite">Period {step}: ×{fmt(state.multiplier)} gives {fmt(state.active.growth)} units; +20 gives {fmt(state.active.additive)} units.</p>
    <div className="algebra-key"><span>Amber: repeated multiplier</span><span>Dashed cyan: fixed addition</span></div>
    <div className="algebra-controls"><RateSelect label="Growth rate" value={rate} onChange={setRate} />
      <Range label="Observation period" value={step} onChange={setStep} min={0} max={8} />
      <Reset name="Reset growth" onClick={() => { setRate(.2); setStep(2); }} /></div>
    <LessonTable caption="Whole-period observations of the two stated models" headers={['Period', 'Add 20', `Multiply ${fmt(state.multiplier)}`, 'Multiplier change']}
      rows={state.rows.map(row => [row.t, fmt(row.additive), fmt(row.growth), row.change === null ? 'Initial' : fmt(row.change)])} />
    <p className="lesson-note">Changing the rate recomputes the named shared scale from all nine observations. Curves between observations are chosen interpolations. These are calculated models.</p>
  </section>;
}

export function LogRulerLab() {
  const [base, setBase] = useState(2);
  const [exponent, setExponent] = useState(1.5);
  const state = logarithmState(base, exponent);
  const position = power => 28 + (power + 3) / 6 * 244;
  return <section className="algebra-lab" aria-label="Logarithmic ruler investigation">
    <p className="algebra-axis-label">Positive value bˣ above; exponent x below</p>
    <svg className="algebra-ruler" viewBox="0 0 300 156" role="img" aria-label={`Base ${base}; exponent ${exponent}; value ${fmt(state.value)}`}>
      <line x1="28" x2="272" y1="80" y2="80" className="axis" />
      {state.ticks.map(tick => <g key={tick.power}>
        <line x1={position(tick.power)} x2={position(tick.power)} y1="73" y2="89" className="axis" />
        <text x={position(tick.power)} y={tick.power % 2 === 0 ? 27 : 55} textAnchor="middle">{fmt(tick.value)}</text>
        <text x={position(tick.power)} y="122" textAnchor="middle">{tick.power}</text>
      </g>)}
      <circle cx={position(exponent)} cy="80" r="6" className="point" />
    </svg>
    <p className="algebra-result" aria-live="polite">{base}<sup>{fmt(exponent)}</sup> ≈ {fmt(state.value)}; log base {base} of that exact value = {fmt(exponent)}.</p>
    <div className="algebra-controls"><label><span>Base</span><select aria-label="Logarithm base" value={base} onChange={event => setBase(Number(event.target.value))}>
      <option value="2">2</option><option value="10">10</option><option value="0.5">0.5</option>
    </select></label><Range label="Exponent position" value={exponent} onChange={setExponent} min={-3} max={3} step={.25} />
      <Reset name="Reset logarithm" onClick={() => { setBase(2); setExponent(1.5); }} /></div>
    <p>{state.increasing ? 'Increasing exponents give increasing original values.' : 'Increasing exponents give decreasing original values because the base is below 1.'} The central mark always pairs exponent 0 with value 1.</p>
    <p className="lesson-note">Exponent spacing is uniform. Original values are rounded only for display; the exact value is the stated power.</p>
  </section>;
}

export function GrowthCrossingLab() {
  const [rate, setRate] = useState(.2);
  const [factor, setFactor] = useState(3);
  const state = growthCrossingState(rate, factor);
  const high = Math.max(200, state.target * 1.3);
  return <section className="algebra-lab" aria-label="Growth target crossing investigation">
    <AlgebraPlot label="Growth curve, target and continuous equality crossing" xRange={[0, state.windowEnd]} yRange={[0, high]}
      xLabel={`time (periods), displayed 0 to ${state.windowEnd}`} yLabel={`quantity (units), displayed 0 to ${fmt(high)}`}
      curves={[{ values: sampleAlgebra(t => 100 * state.multiplier ** t, 0, state.windowEnd, 201) }]}
      guides={[{ from: [0, state.target], to: [state.windowEnd, state.target], comparison: true }]}
      points={state.future ? [{ x: state.crossing, y: state.target }] : []} />
    <div className="algebra-key"><span>Amber: 100×{fmt(state.multiplier)}ᵗ</span><span>Dashed cyan: target {fmt(state.target)}</span></div>
    <p className="algebra-result" aria-live="polite">{rate === 0
      ? factor === 1 ? 'Equality holds at every time: the constant amount is 100.' : 'No equality time: the constant amount is 100 and the target differs.'
      : `Continuous equality t ≈ ${fmt(state.crossing)}. ${state.future ? 'The equality is in the future or at the start.' : 'That equality occurred before t = 0.'}`}</p>
    <p>Whole-period question: quantity {state.direction} target. {state.firstObservation === null
      ? 'No nonnegative observation satisfies it for this constant model.'
      : state.firstObservation === 0 ? 'The initial amount already satisfies it: first period 0.'
        : <>First period {state.firstObservation}: {fmt(state.firstAmount)} units. Period {state.firstObservation - 1}: {fmt(state.previousAmount)} units.</>}</p>
    <div className="algebra-controls"><RateSelect label="Crossing growth rate" value={rate} onChange={setRate} />
      <label><span>Target / initial amount</span><select aria-label="Growth target factor" value={factor} onChange={event => setFactor(Number(event.target.value))}>
        {[.125, .5, 1, 2, 3, 8].map(value => <option key={value} value={value}>{value}× initial</option>)}
      </select></label><Reset name="Reset crossing" onClick={() => { setRate(.2); setFactor(3); }} /></div>
    <p className="lesson-note">The whole-period answer substitutes integer times into the model. Plot bounds are named and change with the target; the curve may continue above the visible window. Past equality points are outside this future-time plot.</p>
  </section>;
}
