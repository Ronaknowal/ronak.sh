import { createContext, useContext, useId, useState } from 'react';
import { LessonTable } from './LessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { arrivalWindowState, bayesPopulationState, continuousEvidenceState, eventConditionState, mixedDelayState, pairedEvidenceState, probabilityNumber, urnCountState } from '../../data/probability-distributions-models.js';
import './probability-distributions-labs.css';
const n = probabilityNumber;
const pct = v => v === null ? 'undefined: zero evidence' : `${n(v * 100)}%`;
const AMBER = '#edc267',
  NEUTRAL = '#ded5bf',
  CYAN = '#97bfca';
function Drawing({
  label,
  children,
  height = 240
}) {
  const id = useId();
  return <svg className="probability-drawing" viewBox={`0 0 360 ${height}`} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>;
}
function Axis({
  x1 = 45,
  x2 = 325,
  y = 190,
  top = 40,
  ticks = [],
  ymax = 1,
  label
}) {
  return <g className="probability-axis"><path d={`M${x1} ${top}V${y}H${x2}`} /><text x={x1 - 9} y={y + 5} textAnchor="end">0</text><text x={x1 - 9} y={top + 5} textAnchor="end">{n(ymax)}</text>
    {ticks.map(([x, v]) => <g key={String(v)}><path d={`M${x} ${y}v5`} /><text x={x} y={y + 24} textAnchor="middle">{v}</text></g>)}{label && <text x={x1} y="20">{label}</text>}
  </g>;
}
function MassBar({
  masses,
  labels,
  caption
}) {
  let start = 0;
  return <figure className="probability-inline-figure"><Drawing height={100} label={`${caption}. Full axis0 to1; ${labels.map((l, i) => `${l}: ${n(masses[i])}`).join('; ')}`}>
    <path className="probability-axis" d="M30 68H330M30 64v8M330 64v8" />{masses.map((m, i) => {
        const x = 30 + 300 * start;
        start += m;
        return <rect key={i} x={x} y="27" width={300 * m} height="30" fill={i ? CYAN : AMBER} className={i ? 'probability-comparison-fill' : ''} />;
      })}<text x="30" y="91">0</text><text x="330" y="91" textAnchor="end">1</text>
  </Drawing><figcaption>{caption}. {labels.map((l, i) => <span key={l}>{i > 0 && '; '}{l}: <strong>{n(masses[i])}</strong></span>)}</figcaption></figure>;
}
function Reset({
  onClick
}) {
  return <button type="button" onClick={onClick}>Reset</button>;
}
export function EventConditionLab() {
  const [event, setEvent] = useState([2, 4, 6]),
    [condition, setCondition] = useState([4, 5, 6]);
  const state = eventConditionState(event, condition),
    groups = [[false, false], [true, false], [true, true], [false, true]],
    names = ['neither', 'A only', 'A ∩ B', 'B only'];
  const toggle = (values, value, setter) => setter(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
  return <FlowLab id="probability-events" label="Die event regions and retained outcomes">
    <div className="probability-event-regions" role="img" aria-label={`Six equal-mass outcomes; A=${event.join(',') || 'empty'}, B=${condition.join(',') || 'empty'}`}>
      {groups.map(([a, b], i) => <div key={names[i]} className={`probability-region ${a ? 'in-a' : ''} ${b ? 'in-b' : ''}`}><span>{names[i]}</span><div className="probability-outcomes">{state.outcomes.filter(o => o.inEvent === a && o.inCondition === b).map(o => <span className="probability-outcome" key={o.value}>{o.value}</span>)}</div></div>)}
    </div><p>Each outcome has original mass 1/6. Region sizes do not encode probability.</p>
    <div className="probability-retained"><span>Retain B →</span><div className="probability-outcomes">{state.outcomes.filter(o => o.inCondition).map(o => <span key={o.value} className={`probability-outcome ${o.inEvent ? 'selected' : 'comparison'}`}>{o.value}</span>)}</div></div>
    <FlowControls>{[['Event A', event, setEvent], ['Given event B', condition, setCondition]].map(([label, values, setter]) => <div className="flow-choice" role="group" aria-label={label} key={label}><span className="flow-choice-label">{label}</span>{state.outcomes.map(o => <button key={o.value} type="button" aria-label={`${label}, face ${o.value}`} aria-pressed={values.includes(o.value)} onClick={() => toggle(values, o.value, setter)}>{o.value}</button>)}</div>)}<Reset onClick={() => {
        setEvent([2, 4, 6]);
        setCondition([4, 5, 6]);
      }} /></FlowControls>
    <FlowReadout>P(A)={n(state.eventProbability)}; P(B)={n(state.conditionProbability)}; shared mass P(A∩B)={n(state.intersectionProbability)}; union mass={n(state.unionProbability)}.</FlowReadout>
    <FlowReadout>{condition.length ? <>{event.filter(v => condition.includes(v)).length} of {condition.length} retained outcomes also belong to A: <strong>P(A|B)={n(state.conditionalProbability)}</strong>.</> : <>B is empty: P(B)=0. <strong>The conditional probability is undefined.</strong></>}</FlowReadout>
  </FlowLab>;
}
const BayesContext = createContext(null);
export function ProbabilityLessonProvider({
  children
}) {
  const [prior, setPrior] = useState(.01),
    [sensitivity, setSensitivity] = useState(.95),
    [falsePositive, setFalsePositive] = useState(.1),
    [positive, setPositive] = useState(true);
  return <BayesContext.Provider value={{
    prior,
    setPrior,
    sensitivity,
    setSensitivity,
    falsePositive,
    setFalsePositive,
    positive,
    setPositive
  }}>{children}</BayesContext.Provider>;
}
function useBayes() {
  const context = useContext(BayesContext);
  if (!context) throw new Error('Bayes investigations require ProbabilityLessonProvider.');
  return {
    ...context,
    state: bayesPopulationState(context.prior, context.sensitivity, context.falsePositive)
  };
}
function SelectedBayes({
  state,
  positive
}) {
  const i = positive ? 0 : 1,
    masses = [state.cells[i].mass, state.cells[i + 2].mass],
    total = masses[0] + masses[1],
    posterior = total ? masses[0] / total : null;
  return <><MassBar masses={masses} labels={[`H and ${positive ? '+' : '−'}`, `not H and ${positive ? '+' : '−'}`]} caption="Selected denominator contributions on the whole-population axis" />{posterior !== null && <MassBar masses={[posterior, 1 - posterior]} labels={['H within result', 'not H within result']} caption="The selected result renormalized to mass 1" />}<FlowReadout>Observed {positive ? '+' : '−'}: denominator={n(total)}; <strong>P(H|{positive ? '+' : '−'})={pct(posterior)}</strong>.{posterior === null && ' This result has zero mass under the stated model.'}</FlowReadout></>;
}
export function BayesPopulationLab() {
  const {
    prior,
    setPrior,
    sensitivity,
    setSensitivity,
    falsePositive,
    setFalsePositive,
    positive,
    setPositive,
    state
  } = useBayes();
  const edges = [[[30, 180], [150, 85], n(prior), 76, 111], [[30, 180], [150, 275], n(1 - prior), 75, 256], [[150, 85], [302, 35], n(sensitivity), 216, 44], [[150, 85], [302, 135], n(1 - sensitivity), 217, 129], [[150, 275], [302, 225], n(falsePositive), 214, 233], [[150, 275], [302, 325], n(1 - falsePositive), 214, 319]];
  return <FlowLab id="probability-bayes" label="Bayes population tree and selected denominator">
    <Drawing height={360} label={`Prior then result tree; each leaf is a joint event. H prior${n(prior)}, sensitivity${n(sensitivity)}, false-positive rate${n(falsePositive)}.`}>
      {edges.map(([a, b, label, x, y], i) => <g key={i}><line className={i > 3 ? 'probability-comparison' : 'probability-branch'} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><text className="probability-label-halo" x={x} y={y}>{label}</text></g>)}
      {[[30, 180, 'all'], [150, 85, 'H'], [150, 275, 'not H'], [302, 35, 'H,+'], [302, 135, 'H,−'], [302, 225, 'not H,+'], [302, 325, 'not H,−']].map(([x, y, label], i) => <g key={label}><circle cx={x} cy={y} r="4" fill={i > 4 ? CYAN : AMBER} /><text x={x} y={y + (i === 1 || i === 2 ? 24 : -13)} textAnchor="middle">{label}</text></g>)}
    </Drawing><p>Tree spacing organizes the conditioning branches; it does not encode probability. The strips below encode probability by their actual widths.</p><LessonTable caption="Joint leaf mass = prior × branch probability. Expected counts in 100,000 synthetic cases, not observed cases." headers={['Joint event', 'Probability', 'Expected count']} rows={['H,+', 'H,−', 'not H,+', 'not H,−'].map((label, i) => [label, n(state.cells[i].mass), n(state.expectedCounts[i])])} />
    <SelectedBayes state={state} positive={positive} /><FlowControls><FlowSlider name="Prior P(H)" value={prior} onChange={setPrior} min={0} max={1} step={.01} /><FlowSlider name="Sensitivity P(+|H)" value={sensitivity} onChange={setSensitivity} min={0} max={1} step={.01} /><FlowSlider name="False-positive rate P(+|not H)" value={falsePositive} onChange={setFalsePositive} min={0} max={1} step={.01} /><Reset onClick={() => {
        setPrior(.01);
        setSensitivity(.95);
        setFalsePositive(.1);
        setPositive(true);
      }} /></FlowControls>
  </FlowLab>;
}
export function BayesOutcomeChoice() {
  const {
    positive,
    setPositive,
    state
  } = useBayes();
  return <FlowLab id="probability-bayes-result" label="Choose the detector result after both outcomes are explained"><FlowControls><FlowChoice label="Observed result" value={positive} onChange={setPositive} options={[[true, 'Flagged +'], [false, 'Not flagged −']]} /></FlowControls><FlowReadout>The tree above retains the {positive ? 'positive' : 'negative'} leaves. P(H|{positive ? '+' : '−'})=<strong>{pct(positive ? state.positivePosterior : state.negativePosterior)}</strong>; denominator={n(positive ? state.positiveMass : state.negativeMass)}.</FlowReadout></FlowLab>;
}
function EvidenceWiring({
  copy
}) {
  return <Drawing height={190} label={copy ? 'One random sign fans through a copy wire to two identical messages.' : 'Two fresh random draws send one sign each to two distinct messages; independent within class.'}>
    {copy ? <><path className="probability-branch" d="M58 95H150M150 95L255 45M150 95L255 145" /><circle cx="58" cy="95" r="18" className="probability-node" /><text x="58" y="100" textAnchor="middle">±</text><text x="150" y="83" textAnchor="middle">copy</text></> : <>{[45, 145].map(y => <g key={y}><line x1="60" y1={y} x2="255" y2={y} className="probability-comparison" /><circle cx="60" cy={y} r="18" className="probability-node" /><text x="60" y={y + 5} textAnchor="middle">±</text></g>)}<text x="136" y="100" textAnchor="middle">two draws</text></>}
    {[45, 145].map((y, i) => <g key={y}><circle cx="280" cy={y} r="19" className="probability-node" /><text x="280" y={y + 5} textAnchor="middle">E{i + 1}</text></g>)}<text x="30" y="180">{copy ? '+ → ++; − → −−' : '++, +−, −+, −− are possible'}</text>
  </Drawing>;
}
export function ReusedEvidenceLab() {
  const [c, setC] = useState(0),
    [pattern, setPattern] = useState(0),
    state = pairedEvidenceState(.01, .95, .1, c),
    selected = state.patterns[pattern];
  return <FlowLab id="probability-evidence" label="Copied versus fresh detector evidence"><div className="probability-two"><div><p>Copy mechanism · probability {n(c)}</p><EvidenceWiring copy /></div><div><p>Fresh mechanism · probability {n(1 - c)}</p><EvidenceWiring /></div></div>
    <LessonTable caption="Pair likelihoods within each class; each row uses the same copy mixture." headers={['Pair', 'P(pair|H)', 'P(pair|not H)']} rows={state.patterns.map(p => [p.label, n(p.givenHypothesis), n(p.givenAlternative)])} />
    <FlowControls><FlowSlider name="Copy share c" value={c} onChange={setC} min={0} max={1} step={.05} /><FlowChoice label="Observed pair" value={pattern} onChange={setPattern} options={state.patterns.map((p, i) => [i, p.label])} /><Reset onClick={() => {
        setC(0);
        setPattern(0);
      }} /></FlowControls>
    <FlowReadout>For {selected.label}, class likelihoods are {n(selected.givenHypothesis)} and {n(selected.givenAlternative)}. <strong>Actual posterior={pct(selected.posterior)}</strong>; assuming two fresh draws gives {pct(selected.independentPosterior)}.{selected.posterior === null && ' This mixed-sign pair is impossible when c=1.'}</FlowReadout>
  </FlowLab>;
}
export function SelectionCountFigure() {
  const sets = [['A', 'B', 'C'], ['A', 'C', 'D'], ['C', 'D', 'E']];
  return <figure className="probability-inline-figure"><Drawing height={265} label="Selected subsets map to marked count: ABC to2, ACD to1, CDE to0; A and B marked.">
    {sets.map((set, i) => <g key={i}>{set.map((name, j) => <g key={name}><circle cx={48 + 58 * j} cy={48 + 82 * i} r="18" className={['A', 'B'].includes(name) ? 'probability-marked-node' : 'probability-node'} /><text x={48 + 58 * j} y={53 + 82 * i} textAnchor="middle">{name}</text></g>)}<path className="probability-branch" d={`M190 ${48 + 82 * i}h75l-8 -5m8 5l-8 5`} /><circle cx="305" cy={48 + 82 * i} r="20" className="probability-node" /><text x="305" y={53 + 82 * i} textAnchor="middle">{2 - i}</text></g>)}
  </Drawing><figcaption>Selected objects → marked count. Amber outlines mark A and B; the count equals their number in the subset.</figcaption></figure>;
}
function CountPlot({
  masses,
  cdf = false
}) {
  const x = k => 55 + 40 * k,
    y = p => 190 - 150 * p;
  return <Drawing label={`${cdf ? 'CDF includes each mass at the filled integer point' : 'PMF; amber bars select counts at most1'}. Count axis0 to6; probability axis0 to1.`}>
    <Axis ticks={Array.from({
      length: 7
    }, (_, k) => [x(k), k])} label={cdf ? 'F(k)' : 'P(X=k)'} />{cdf && <line className="probability-branch" x1="45" x2={x(0)} y1="190" y2="190" />}
    {masses.map((p, i) => cdf ? <g key={i}><line className="probability-comparison" x1={x(i)} x2={i === masses.length - 1 ? 325 : x(i + 1)} y1={y(p.cumulative)} y2={y(p.cumulative)} /><circle cx={x(i)} cy={y(i ? masses[i - 1].cumulative : 0)} r="4" className="probability-open-point" /><circle cx={x(i)} cy={y(p.cumulative)} r="4" fill={CYAN} /><line x1={x(i)} x2={x(i)} y1={y(i ? masses[i - 1].cumulative : 0)} y2={y(p.cumulative)} className="probability-residual" /></g> : <rect key={i} x={x(i) - 10} y={y(p.mass)} width="20" height={150 * p.mass} fill={i <= 1 ? AMBER : CYAN} className={i > 1 ? 'probability-comparison-fill' : ''} />)}
  </Drawing>;
}
export function UrnCountLab() {
  const [marked, setMarked] = useState(2),
    [draws, setDraws] = useState(3),
    [replacement, setReplacement] = useState(false),
    state = urnCountState(marked, draws, replacement, 1);
  return <FlowLab id="probability-urn" label="Six-object urn and count distribution">
    <Drawing height={draws ? 305 : 120} label={`Initial six labelled objects; first${marked} marked. ${draws ? 'One possible first selection A is traced to the pool after that draw.' : 'Zero draws: no object selected.'} ${replacement ? 'A returns and is available again.' : 'A stays out and is unavailable for the next draw.'}`}>
      <text x="25" y="20">Initial pool</text><path className="probability-axis" d="M25 30v50q0 15 15 15h275q15 0 15-15V30" />
      {Array.from({
        length: 6
      }, (_, i) => <g key={i}><circle cx={52 + 51 * i} cy="58" r="18" className={i < marked ? 'probability-marked-node' : 'probability-node'} /><text x={52 + 51 * i} y="63" textAnchor="middle">{String.fromCharCode(65 + i)}</text></g>)}
      {draws > 0 && <><path className="probability-branch" d="M52 80L166 132l-8 -1m8 1l-5 -7" /><circle cx="180" cy="150" r="18" className={marked ? 'probability-marked-node' : 'probability-node'} /><text x="180" y="155" textAnchor="middle">A</text>
        {replacement ? <><path className="probability-comparison" d="M180 170V181H340V223H52V230l-5 -7m5 7l5 -7" /><text x="213" y="165">return</text></> : <><path className="probability-comparison" d="M202 150h67l-7 -5m7 5l-7 5" /><text x="275" y="155">out</text></>}
        <text x="25" y="210">Pool after first draw</text><path className="probability-axis" d="M25 223v48q0 15 15 15h275q15 0 15-15v-48" />
        {Array.from({
          length: 6
        }, (_, i) => <g key={i}><circle cx={52 + 51 * i} cy="250" r="18" className={i === 0 && !replacement ? 'probability-unavailable-node' : i < marked ? 'probability-marked-node' : 'probability-node'} /><text x={52 + 51 * i} y="255" textAnchor="middle">{String.fromCharCode(65 + i)}</text>{i === 0 && !replacement && <path className="probability-residual" d="M38 236L66 264M66 236L38 264" />}</g>)}
      </>}
    </Drawing><p>{draws ? 'This mechanism trace shows one possible first selection, A. The distributions below average over all allowed selections; they do not condition on that traced first outcome.' : 'Zero draws fix the count at zero.'}</p><div className="probability-two"><CountPlot masses={state.masses} /><CountPlot masses={state.masses} cdf /></div>
    <FlowControls><FlowSlider name="Marked objects K" value={marked} onChange={setMarked} min={0} max={6} step={1} /><FlowSlider name="Draw count n" value={draws} onChange={setDraws} min={0} max={6} step={1} /><FlowChoice label="Sampling rule" value={replacement} onChange={setReplacement} options={[[false, 'Keep selected object out'], [true, 'Replace and remix']]} /><Reset onClick={() => {
        setMarked(2);
        setDraws(3);
        setReplacement(false);
      }} /></FlowControls>
    <FlowReadout>Fixed count threshold: 1. <strong>P(X≤1)={n(state.cumulativeMass)}</strong>; P(X=1)={n(state.selectedMass)}. Bars show individual masses; the staircase accumulates them.</FlowReadout><LessonTable caption="Calculated PMF and CDF for the current experiment." headers={['Count k', 'P(X=k)', 'F(k)']} rows={state.masses.map(p => [p.successes, n(p.mass), n(p.cumulative)])} />
  </FlowLab>;
}
export function MomentBalanceFigure() {
  const masses = [.2, .5, .3],
    x = k => 70 + 110 * k,
    mean = x(1.1);
  return <figure className="probability-inline-figure"><Drawing height={345} label="Masses.2,.5,.3 at0,1,2. Mean1.1; deviations−1.1,−.1,.9.">
    <Axis x1={50} x2={320} y={165} top={35} ticks={masses.map((_, i) => [x(i), i])} label="P(X=x)" />{masses.map((p, i) => <rect key={i} x={x(i) - 12} y={165 - 130 * p} width="24" height={130 * p} fill={NEUTRAL} />)}
    <line x1={mean} x2={mean} y1="40" y2="320" className="probability-residual" /><path d={`M${mean - 7} 179L${mean + 7} 179L${mean} 165Z`} fill={AMBER} /><text x={mean + 10} y="218">μ=1.1</text>
    {masses.map((_, i) => <g key={i}><line className="probability-branch" x1={mean} x2={x(i)} y1={238 + i * 35} y2={238 + i * 35} /><circle cx={x(i)} cy={238 + i * 35} r="4" fill={NEUTRAL} /><text x={x(i) + (i < 2 ? -8 : 8)} y={242 + i * 35} textAnchor={i < 2 ? 'end' : 'start'}>{i}</text></g>)}
  </Drawing><LessonTable caption="Variance weights squared distances, not distances themselves." headers={['x', 'Mass', 'x−1.1', 'Mass × squared distance']} rows={[[0, '.2', '−1.1', '.242'], [1, '.5', '−.1', '.005'], [2, '.3', '.9', '.243']]} /><figcaption>Weighted deviations balance: −.22−.05+.27=0. Weighted squares sum to .49.</figcaption></figure>;
}
export function MomentTailFigure() {
  return <figure className="probability-inline-figure"><div className="probability-two">{[['A', [0, .5, 0, .5, 0]], ['B', [.125, 0, .75, 0, .125]]].map(([label, masses]) => <div key={label}><p>Distribution {label} · mean 0, variance 1</p><Drawing label={`Distribution${label}: masses${masses.join(',')} at−2,−1,0,1,2; shaded tails outside±1.5.`}>
    <rect x="45" y="40" width="50" height="150" fill={`${AMBER}20`} /><rect x="275" y="40" width="50" height="150" fill={`${AMBER}20`} /><Axis ticks={masses.map((_, i) => [65 + 60 * i, i - 2])} label="P(X=x)" />{masses.map((m, i) => <rect key={i} x={55 + 60 * i} y={190 - 150 * m} width="20" height={150 * m} fill={label === 'A' ? NEUTRAL : CYAN} className={label === 'B' ? 'probability-comparison-fill' : ''} />)}
  </Drawing><p>Tail mass: {label === 'A' ? '0' : '1/4'}. Masses at x=−2,−1,0,1,2: {masses.map(n).join(', ')}.</p></div>)}</div><figcaption>Both panels use the same axes; the shaded regions lie outside ±1.5.</figcaption></figure>;
}
function UniformDensity({
  state,
  maxWidth,
  maxDensity,
  atom = false
}) {
  const clipId = useId(),
    x = v => 50 + 270 * v / maxWidth,
    y = v => 190 - 150 * v / maxDensity;
  const visibleMass = state.density * Math.max(0, Math.min(state.right, maxWidth) - Math.min(state.left, maxWidth));
  return <Drawing label={`Continuous density${n(state.density)} per${state.unit}; support0 to${n(state.width)}; selected interval${n(state.left)} to${n(state.right)}. Plot window0 to${n(maxWidth)}; shown shaded area${n(visibleMass)}.`}>
    <defs><clipPath id={clipId}><rect x="50" y="39" width="271" height="152" /></clipPath></defs>
    <Axis x1={50} x2={320} ymax={maxDensity} ticks={[[50, 0], [185, n(maxWidth / 2)], [320, n(maxWidth)]]} label={`Density · per ${state.unit === 'seconds' ? 's' : 'ms'}`} />
    <g clipPath={`url(#${clipId})`}><rect x={x(state.left)} y={y(state.density)} width={x(state.right) - x(state.left)} height={190 - y(state.density)} fill={`${AMBER}70`} /><path className="probability-branch" d={`M50 190V${y(state.density)}H${x(state.width)}V190`} /></g>{atom && <text x="50" y="233">Atom is separate from density area</text>}
  </Drawing>;
}
function DelayCdf({
  state
}) {
  const x = v => 50 + 270 * v / .2,
    y = v => 190 - 150 * v;
  return <Drawing label={`CDF jumps from0 to${n(state.atom)} at zero, then rises to1 at.2seconds. F(a minus)${n(state.cdfLeftLimit)}, F(b)${n(state.cdfRight)}.`}>
    <Axis x1={50} x2={320} ticks={[[50, 0], [185, '.1'], [320, '.2']]} label="F(x)" /><path className="probability-comparison" d={`M30 190H50M50 ${y(state.atom)}L320 40H340`} /><line x1="50" x2="50" y1="190" y2={y(state.atom)} className="probability-residual" /><circle cx="50" cy="190" r="4" className="probability-open-point" /><circle cx="50" cy={y(state.atom)} r="4" fill={CYAN} />
    <line x1={x(state.left)} x2={x(state.left)} y1="190" y2={y(state.cdfLeftLimit)} className="probability-residual" /><line x1={x(state.right)} x2={x(state.right)} y1="190" y2={y(state.cdfRight)} className="probability-residual" /><circle cx={x(state.left)} cy={y(state.cdfLeftLimit)} r="5" fill={AMBER} /><circle cx={x(state.right)} cy={y(state.cdfRight)} r="5" fill={AMBER} />
  </Drawing>;
}
export function DensityAreaLab() {
  const [width, setWidth] = useState(.2),
    [unit, setUnit] = useState('seconds'),
    state = mixedDelayState(width, 0, .25, .75, unit),
    scale = unit === 'seconds' ? 1 : 1000;
  return <FlowLab id="probability-density" label="Uniform delay density and unit-invariant area"><div className="probability-two"><div><p>Fixed detail window: [0,{n(.4 * scale)}] {unit}</p><UniformDensity state={state} maxWidth={.4 * scale} maxDensity={10 / scale} /><p>This detail clips any support or event beyond its fixed window.</p></div><div><p>Whole allowed range: [0,{n(2 * scale)}] {unit}</p><UniformDensity state={state} maxWidth={2 * scale} maxDensity={10 / scale} /></div></div><p>Both vertical axes run from 0 to {n(10 / scale)} per {unit}. Both horizontal windows stay fixed as range width changes. Unit conversion relabels the same physical windows.</p>
    <FlowControls><FlowSlider name="Range width in seconds" value={width} onChange={setWidth} min={.1} max={2} step={.1} /><FlowChoice label="Displayed units" value={unit} onChange={setUnit} options={[['seconds', 'Seconds'], ['milliseconds', 'Milliseconds']]} /><Reset onClick={() => {
        setWidth(.2);
        setUnit('seconds');
      }} /></FlowControls><FlowReadout>Support width={n(state.width)} {unit}; density={n(state.density)} per {unit}. Middle-half interval=[{n(state.left)},{n(state.right)}]; <strong>area={n(state.continuousMass)}</strong>.</FlowReadout>
  </FlowLab>;
}
export function MixedDelayLab() {
  const [q, setQ] = useState(.3),
    [left, setLeft] = useState(.25),
    [right, setRight] = useState(.75),
    state = mixedDelayState(.2, q, left, right);
  return <FlowLab id="probability-mixed-delay" label="Mixed delay area and CDF point-mass jump"><div className="probability-two"><UniformDensity state={state} maxWidth={.2} maxDensity={5} atom /><DelayCdf state={state} /></div><MassBar masses={[q, 1 - q]} labels={['Point mass at zero', 'Continuous mass over (0,.2)']} caption="Total mass partitions into an atom and continuous area" />
    <FlowControls><FlowSlider name="Immediate completion q" value={q} onChange={setQ} min={0} max={1} step={.05} /><FlowSlider name="Left fraction a/.2" value={left} onChange={setLeft} min={0} max={right} step={.05} /><FlowSlider name="Right fraction b/.2" value={right} onChange={setRight} min={left} max={1} step={.05} /><Reset onClick={() => {
        setQ(.3);
        setLeft(.25);
        setRight(.75);
      }} /></FlowControls><FlowReadout>Closed interval [{n(state.left)},{n(state.right)}] seconds: continuous area={n(state.continuousMass)}; included zero atom={n(state.includedAtom)}. <strong>Total={n(state.intervalMass)}</strong> = F(b) {n(state.cdfRight)} − F(a⁻) {n(state.cdfLeftLimit)}.</FlowReadout><p>Endpoints stop at each other. At [0,0] the shaded area has zero width; the closed event retains its atom q. A reversed interval is invalid in the model.</p>
  </FlowLab>;
}
export function ArrivalCountWaitLab() {
  const [rate, setRate] = useState(2),
    [window, setWindow] = useState(1.5),
    state = arrivalWindowState(rate, window),
    x = t => 40 + 280 * t / 2;
  return <FlowLab id="probability-arrivals" label="Fixed arrival realization and theoretical count PMF"><Drawing height={210} label={`One supplied synthetic realization. Window${n(window)}minutes; rate${n(rate)}events/minute. First arrival at${n(state.arrivals[0].time)}.`}>
    <rect x="40" y="45" width={x(window) - 40} height="72" fill={`${AMBER}20`} /><path className="probability-axis" d="M40 83H320" />{state.arrivals.filter(a => a.time <= 2).map(a => <line key={a.event} x1={x(a.time)} x2={x(a.time)} y1="60" y2="104" className={a.inWindow ? 'probability-branch' : 'probability-comparison'} />)}<line x1="40" x2={x(Math.min(state.arrivals[0].time, 2))} y1="35" y2="35" className="probability-branch" /><text x="40" y="22">First wait T</text>
    {[0, .5, 1, 1.5, 2].map(t => <g key={t}><path className="probability-axis" d={`M${x(t)} 126v5`} /><text x={x(t)} y="153" textAnchor="middle">{t}</text></g>)}<text x="180" y="180" textAnchor="middle">Time · minutes</text>
  </Drawing><p>First wait T={n(state.arrivals[0].time)} minutes. {state.realizationTruncated ? 'At least ' : ''}{state.displayedArrivalsInWindow} supplied arrivals fall in this window. {state.realizationTruncated ? 'All twelve supplied events are used; later arrivals are not generated.' : 'The first supplied tick after the window establishes its realized count.'} This one timeline does not estimate the probabilities below.</p>
    <Drawing label="Poisson PMF for counts0 through24; fixed probability axis0 to1. Tail beyond24 reported without renormalization."><Axis ticks={[0, 6, 12, 18, 24].map(k => [50 + 11 * k, k])} label="P(N(t)=k)" />{state.masses.map(p => <rect key={p.count} x={47 + 11 * p.count} y={190 - 150 * p.mass} width="7" height={150 * p.mass} fill={p.count === 0 ? AMBER : CYAN} />)}</Drawing>
    <FlowControls><FlowSlider name="Rate · events per minute" value={rate} onChange={setRate} min={.25} max={6} step={.25} /><FlowSlider name="Window · minutes" value={window} onChange={setWindow} min={0} max={2} step={.1} /><Reset onClick={() => {
        setRate(2);
        setWindow(1.5);
      }} /></FlowControls><FlowReadout>Mean count λt={n(state.meanCount)}; <strong>P(N(t)=0)=P(T&gt;t)={n(state.noArrivals)}</strong>; P(N(t)≥1)={n(state.atLeastOne)}. Unplotted P(N(t)&gt;24)={n(state.tailBeyond24)}.</FlowReadout>
    <LessonTable caption="All twelve fixed uniform inputs and their transformation; synthetic, not observed traffic." headers={['Event', 'u', '−log(1−u)/λ', 'Arrival time', 'In window?']} rows={state.arrivals.map(a => [a.event, a.uniform, n(a.wait), n(a.time), a.inWindow ? 'yes' : 'no'])} />
  </FlowLab>;
}
const polyline = (fn, min, max, x, y, steps = 100) => Array.from({
  length: steps + 1
}, (_, i) => {
  const t = min + (max - min) * i / steps;
  return `${x(t)},${y(fn(t))}`;
}).join(' ');
export function WaitQuantileLab() {
  const [p, setP] = useState(.5),
    wait = -Math.log1p(-p) / 2,
    x = t => 50 + 270 * t / 2.5,
    y = v => 190 - 150 * v;
  return <FlowLab id="probability-wait-quantile" label="Inverse exponential CDF at fixed rate2 per minute"><Drawing label={`CDF rate2 perminute; probability${n(p)} meets the curve at wait${n(wait)}minutes; time domain0 to2.5.`}>
    <Axis ticks={[0, .5, 1, 1.5, 2, 2.5].map(t => [x(t), t])} label="F(t)" /><polyline points={polyline(t => -Math.expm1(-2 * t), 0, 2.5, x, y)} className="probability-branch" /><path d={`M50 ${y(p)}H${x(wait)}V190`} className="probability-residual" /><circle cx={x(wait)} cy={y(p)} r="5" fill={AMBER} />
  </Drawing><FlowControls><FlowSlider name="Quantile probability p" value={p} onChange={setP} min={.01} max={.99} step={.01} /><Reset onClick={() => setP(.5)} /></FlowControls><FlowReadout>Rate stays fixed at <strong>2 events/minute</strong>. F(t)={n(p)} at t=<strong>{n(wait)} minutes</strong>; survival there is {n(1 - p)}. Mean first wait is .5 minutes.</FlowReadout></FlowLab>;
}
export function NormalUnitsFigure() {
  const x = t => 50 + 270 * (t + .6) / 1.2,
    y = f => 185 - 140 * f / 2,
    density = t => Math.exp(-.5 * (t / .2) ** 2) / (.2 * Math.sqrt(2 * Math.PI));
  return <figure className="probability-inline-figure probability-normal-units"><Drawing height={330} label="Normal density mean0, standard deviation.2volts; interval−.1 to.1volts shaded. Identical intervals on millivolt and standardized axes.">
    <path className="probability-axis" d="M50 45V185H320" /><text x="50" y="20">Density · per volt</text><text x="36" y="190">0</text><text x="36" y="49">2</text><polygon points={`${x(-.1)},185 ${polyline(density, -.1, .1, x, y)} ${x(.1)},185`} fill={`${AMBER}70`} /><polyline points={polyline(density, -.6, .6, x, y)} className="probability-branch" />
    {[205, 251, 297].map((base, i) => <g key={base}><path className="probability-axis" d={`M50 ${base}H320`} />{[-.1, 0, .1].map(t => <g key={t}><path className="probability-branch" d={`M${x(t)} ${base - 4}v8`} /><text x={x(t) + (t < 0 ? -6 : t > 0 ? 6 : 0)} y={base + 23} textAnchor={t < 0 ? 'end' : t > 0 ? 'start' : 'middle'}>{i === 0 ? t : i === 1 ? Math.round(t * 1000) : t / .2}</text></g>)}</g>)}
  </Drawing><p>Axes from top to bottom: the marked endpoints identify the same event. Scroll the table horizontally when needed to compare every column.</p><LessonTable caption="Coordinate comparison: the marked endpoints identify the same event." headers={['Coordinate', 'Left', 'Center', 'Right', 'Density at center']} rows={[['Volts', '−.1', '0', '.1', '1.994711 per volt'], ['Millivolts', '−100', '0', '100', '.001995 per millivolt'], ['Standardized z', '−.5', '0', '.5', '.398942 per z unit']]} /><figcaption>Shaded probability=.382925 in every coordinate system. The curve shows [−.6,.6] volts; its tails continue beyond the plot.</figcaption></figure>;
}
export function ContinuousEvidenceLab() {
  const [time, setTime] = useState(.2),
    [width, setWidth] = useState(.1),
    state = continuousEvidenceState(time, width),
    x = t => 50 + 270 * t / 2.1,
    y = f => 190 - 150 * f / 3;
  return <FlowLab id="probability-continuous-evidence" label="Two exponential interval likelihoods and Bayes denominator"><div className="probability-two">{[3, 1].map((rate, i) => <div key={rate}><p>{i === 0 ? 'Fast' : 'Slow'} mode · rate {rate}/minute, prior .5</p><Drawing label={`Rate${rate} exponential density; interval[${n(time)},${n(time + width)}]minutes has area${n(state.areas[i])}. Both panels: time0 to2.1; density0 to3.`}>
    <Axis ymax={3} ticks={[0, .7, 1.4, 2.1].map(t => [x(t), t])} label="Density · per minute" /><polygon points={`${x(time)},190 ${polyline(t => rate * Math.exp(-rate * t), time, time + width, x, y)} ${x(time + width)},190`} fill={`${i ? CYAN : AMBER}70`} /><polyline points={polyline(t => rate * Math.exp(-rate * t), 0, 2.1, x, y)} className={i ? 'probability-comparison' : 'probability-branch'} />
  </Drawing><p>Interval area={n(state.areas[i])}; density at t={n(state.densities[i])} per minute.</p></div>)}</div><MassBar masses={state.weightedAreas} labels={['Fast prior × area', 'Slow prior × area']} caption="The denominator adds the prior-weighted interval masses" /><MassBar masses={[state.posterior, 1 - state.posterior]} labels={['Fast within interval', 'Slow within interval']} caption="Divide those contributions by their total to renormalize the interval to 1" />
    <FlowControls><FlowSlider name="Interval start t · minutes" value={time} onChange={setTime} min={0} max={2} step={.05} /><FlowChoice label="Interval width h · minutes" value={width} onChange={setWidth} options={[[.1, '.1'], [.001, '.001'], [.00001, '.00001']]} /><Reset onClick={() => {
        setTime(.2);
        setWidth(.1);
      }} /></FlowControls><FlowReadout>Denominator={n(state.denominator)}. <strong>Exact interval posterior={n(state.posterior)}</strong>; density-limit posterior={n(state.densityPosterior)}. The narrowing interval uses stable expm1 calculations; its tiny shaded width is drawn at true scale.</FlowReadout>
  </FlowLab>;
}
