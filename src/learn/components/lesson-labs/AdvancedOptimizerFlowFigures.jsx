import { useId } from 'react';
import { flowNumber as f } from './LessonFlow.jsx';
import { bowlGeometry, hessianProbes, sampledCurvature, prodigyTrace, scheduleFreeTrace } from '../../data/advanced-optimizer-models.js';
export const optimizerFlowColors = Object.freeze({
  input: '#79c8e8',
  parameter: '#e6bb60',
  computed: '#c5a5e8',
  operator: '#858585',
  derivative: '#f09a68',
  text: '#dedede'
});
const c = optimizerFlowColors;
export const optimizerVector = (values, digits = 5) => `[${values.map(value => f(value, digits)).join(', ')}]`;
export function OptimizerFlowDrawing({
  label,
  description,
  height,
  width = 350,
  children
}) {
  const identity = useId().replaceAll(':', '');
  return <figure className="optimizer-flow-drawing">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${identity}-title ${identity}-description`}>
      <title id={`${identity}-title`}>{label}</title><desc id={`${identity}-description`}>{description}</desc>
      <defs><marker id={`${identity}-forward`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill={c.operator} /></marker><marker id={`${identity}-derivative`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill={c.derivative} /></marker></defs>
      {typeof children === 'function' ? children({
        forward: `url(#${identity}-forward)`,
        derivative: `url(#${identity}-derivative)`
      }) : children}
    </svg>
  </figure>;
}
export function OptimizerFlowText({
  x,
  y,
  children,
  color = c.text,
  anchor = 'start',
  ...attributes
}) {
  return <text x={x} y={y} fill={color} textAnchor={anchor} {...attributes}>{children}</text>;
}
export function OptimizerFlowCell({
  x,
  y,
  value,
  role = 'computed',
  width = 58,
  height = 30
}) {
  return <g><rect x={x} y={y} width={width} height={height} fill="none" stroke={c[role]} /><OptimizerFlowText x={x + width / 2} y={y + height / 2 + 4} anchor="middle" color={c[role]}>{typeof value === 'number' ? f(value, 5) : value}</OptimizerFlowText></g>;
}
export function OptimizerFlowWire({
  from,
  to,
  marker,
  derivative = false,
  bend
}) {
  const points = bend ? [from, ...bend, to] : [from, to];
  return <polyline points={points.map(point => point.join(',')).join(' ')} fill="none" stroke={derivative ? c.derivative : c.operator} strokeDasharray={derivative ? '5 4' : undefined} markerEnd={marker} />;
}
export function optimizerOpening(rate = .1) {
  const inputs = [1, 2],
    weights = [[.4, -.2], [.1, .3]],
    target = [1, 0];
  const scores = weights[0].map((_, column) => inputs.reduce((sum, input, row) => sum + input * weights[row][column], 0));
  const maximum = Math.max(...scores),
    masses = scores.map(score => Math.exp(score - maximum)),
    total = masses.reduce((sum, mass) => sum + mass, 0);
  const probabilities = masses.map(mass => mass / total),
    residual = probabilities.map((value, column) => value - target[column]);
  const gradient = inputs.map(input => residual.map(value => input * value));
  const nextWeights = weights.map((row, i) => row.map((value, j) => value - rate * gradient[i][j]));
  const nextScores = nextWeights[0].map((_, j) => inputs.reduce((sum, input, i) => sum + input * nextWeights[i][j], 0));
  const nextMasses = nextScores.map(score => Math.exp(score - Math.max(...nextScores))),
    nextTotal = nextMasses.reduce((sum, mass) => sum + mass, 0);
  return {
    inputs,
    weights,
    target,
    scores,
    maximum,
    masses,
    total,
    probabilities,
    residual,
    gradient,
    loss: -Math.log(probabilities[0]),
    rate,
    nextWeights,
    nextScores,
    nextProbabilities: nextMasses.map(mass => mass / nextTotal)
  };
}
export function OptimizerScoresDrawing() {
  const state = optimizerOpening();
  return <OptimizerFlowDrawing label="Two supplied inputs contribute to both learned score columns" description="Input 1 times .4 plus input 2 times .1 makes class 0 score 0.6. Input 1 times negative 0.2 plus input 2 times 0.3 makes class 1 score 0.4. Cyan inputs, amber learned weights, gray multiply/add operations and violet results are directly labelled." height={432}>{({
      forward
    }) => <>
    <OptimizerFlowText x={12} y={18} color={c.input}>supplied features</OptimizerFlowText>
    {state.inputs.map((value, i) => <g key={i}><OptimizerFlowText x={12} y={53 + i * 66}>feature {i + 1}</OptimizerFlowText><OptimizerFlowCell x={100} y={34 + i * 66} width={42} value={value} role="input" /></g>)}
    <OptimizerFlowText x={170} y={18} color={c.parameter}>learned weight grid</OptimizerFlowText>
    <OptimizerFlowText x={208} y={52} anchor="middle">class 0</OptimizerFlowText><OptimizerFlowText x={294} y={52} anchor="middle">class 1</OptimizerFlowText>
    {state.weights.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><OptimizerFlowCell x={178 + j * 86} y={65 + i * 66} value={value} role="parameter" /><OptimizerFlowWire from={[142, 49 + i * 66]} to={[178 + j * 86, 80 + i * 66]} bend={j ? [[155, 49 + i * 66], [155, 119 + i * 66], [250, 119 + i * 66], [250, 80 + i * 66]] : undefined} marker={forward} /></g>))}
    {[0, 1].map(j => <g key={j}>
      <OptimizerFlowWire from={[207 + j * 86, 161]} to={[85 + j * 179, 201]} bend={[[207 + j * 86, 179], [85 + j * 179, 179]]} marker={forward} />
      <OptimizerFlowText x={85 + j * 179} y={224} anchor="middle">class {j} products</OptimizerFlowText>
      {state.weights.map((row, i) => <OptimizerFlowText key={i} x={85 + j * 179} y={253 + i * 27} anchor="middle" color={c.computed}>{state.inputs[i]} × {f(row[j])} = {f(state.inputs[i] * row[j])}</OptimizerFlowText>)}
      <OptimizerFlowWire from={[85 + j * 179, 291]} to={[85 + j * 179, 312]} marker={forward} />
      <circle cx={85 + j * 179} cy={329} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={85 + j * 179} y={334} anchor="middle">+</OptimizerFlowText>
      <OptimizerFlowWire from={[85 + j * 179, 342]} to={[85 + j * 179, 362]} marker={forward} />
      <OptimizerFlowCell x={56 + j * 179} y={375} value={state.scores[j]} /><OptimizerFlowText x={85 + j * 179} y={424} anchor="middle" color={c.computed}>score {j}</OptimizerFlowText>
    </g>)}
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerProbabilityDrawing() {
  const state = optimizerOpening();
  return <OptimizerFlowDrawing label="Scores become positive masses with one shared total" description={`Scores 0.6, 0.4 subtract the common maximum 0.6. Their exponentials are 1 and ${state.masses[1]}; each mass forks into the sum and its own division. Both divisions receive denominator ${state.total}. Probabilities are ${state.probabilities.join(',')}.`} height={446}>{({
      forward
    }) => <>
    {[0, 1].map(j => <g key={j}><OptimizerFlowText x={75 + j * 195} y={18} anchor="middle">class {j} score</OptimizerFlowText><OptimizerFlowCell x={46 + j * 195} y={29} value={state.scores[j]} /><OptimizerFlowWire from={[75 + j * 195, 59]} to={[75 + j * 195, 80]} marker={forward} /><OptimizerFlowText x={75 + j * 195} y={99} anchor="middle">subtract max .6</OptimizerFlowText><OptimizerFlowCell x={46 + j * 195} y={114} value={state.scores[j] - state.maximum} /><OptimizerFlowWire from={[75 + j * 195, 144]} to={[75 + j * 195, 165]} marker={forward} /><OptimizerFlowText x={75 + j * 195} y={185} anchor="middle">exp</OptimizerFlowText><OptimizerFlowCell x={40 + j * 195} y={199} width={70} value={state.masses[j]} /><OptimizerFlowWire from={[75 + j * 195, 229]} to={[174, 250]} marker={forward} /></g>)}
    <circle cx={174} cy={264} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={174} y={269} anchor="middle">+</OptimizerFlowText><OptimizerFlowText x={174} y={296} anchor="middle" color={c.computed}>shared total {f(state.total, 6)}</OptimizerFlowText>
    {[0, 1].map(j => <g key={j}>
      <OptimizerFlowWire from={[75 + j * 195, 229]} to={[65.808 + j * 195, 348.808]} bend={[[29 + j * 293, 240], [29 + j * 293, 324]]} marker={forward} />
      <OptimizerFlowWire from={[174, 305]} to={[84.192 + j * 195, 348.808]} marker={forward} />
      <circle cx={75 + j * 195} cy={358} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={75 + j * 195} y={363} anchor="middle">÷</OptimizerFlowText>
      <OptimizerFlowWire from={[75 + j * 195, 371]} to={[75 + j * 195, 409]} marker={forward} /><OptimizerFlowCell x={34 + j * 195} y={409} width={82} value={state.probabilities[j]} />
    </g>)}
    <OptimizerFlowText x={175} y={393} anchor="middle">own mass / shared sum</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerObjectiveDrawing() {
  const state = optimizerOpening();
  return <OptimizerFlowDrawing label="The target selects a probability and the derivative returns to the weights" description={`Target 0 selects probability ${state.probabilities[0]}, giving negative natural logarithm loss ${state.loss}. The orange return wires reach both score derivatives p−y:${state.residual.join(',')}; each then multiplies supplied input 1 or 2 and reaches its actual weight-gradient cell.`} height={585}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={10} y={18} color={c.input}>supplied target: class 0</OptimizerFlowText><OptimizerFlowCell x={10} y={30} value="1, 0" role="input" width={76} />
    <OptimizerFlowText x={190} y={18} color={c.computed}>model probabilities</OptimizerFlowText><OptimizerFlowCell x={189} y={30} value={f(state.probabilities[0], 6)} width={76} /><OptimizerFlowCell x={273} y={30} value={f(state.probabilities[1], 6)} width={76} />
    <OptimizerFlowWire from={[48, 60]} to={[158, 103]} marker={forward} /><OptimizerFlowWire from={[227, 60]} to={[185, 103]} marker={forward} /><OptimizerFlowText x={175} y={124} anchor="middle">select correct probability</OptimizerFlowText><OptimizerFlowWire from={[175, 137]} to={[175, 158]} marker={forward} /><OptimizerFlowText x={175} y={182} anchor="middle">−ln</OptimizerFlowText><OptimizerFlowCell x={131} y={195} width={88} value={state.loss} /><OptimizerFlowText x={175} y={250} anchor="middle" color={c.computed}>loss L</OptimizerFlowText>
    {[0, 1].map(j => <OptimizerFlowWire key={j} from={[147 + j * 55, 225]} to={[113 + j * 124, 304]} bend={[[147 + j * 55, 260], [113 + j * 124, 260]]} marker={derivative} derivative />)}
    <OptimizerFlowText x={175} y={290} anchor="middle" color={c.derivative}>score derivatives p − y</OptimizerFlowText><OptimizerFlowCell x={65} y={304} width={96} role="derivative" value={state.residual[0]} /><OptimizerFlowCell x={189} y={304} width={96} role="derivative" value={state.residual[1]} />
    {state.inputs.map((input, i) => <g key={i}>
      <OptimizerFlowText x={12} y={365 + i * 103} color={c.input}>input {i + 1}</OptimizerFlowText><OptimizerFlowCell x={12} y={375 + i * 103} width={38} role="input" value={input} />
      {[0, 1].map(j => <g key={j}>
        <OptimizerFlowWire from={[113 + j * 124, 334]} to={[113 + j * 124, 384 + i * 103]} bend={i ? [[173 + j * 124, 350], [173 + j * 124, 384 + i * 103]] : undefined} marker={derivative} derivative />
        <OptimizerFlowWire from={[50, 390 + i * 103]} to={[98 + j * 124, 398 + i * 103]} bend={j ? [[59, 390 + i * 103], [59, 415 + i * 103], [218, 415 + i * 103], [218, 398 + i * 103]] : undefined} marker={forward} />
        <circle cx={113 + j * 124} cy={400 + i * 103} r={12} fill="none" stroke={c.operator} /><OptimizerFlowText x={113 + j * 124} y={405 + i * 103} anchor="middle">×</OptimizerFlowText><OptimizerFlowWire from={[113 + j * 124, 412 + i * 103]} to={[113 + j * 124, 432 + i * 103]} marker={derivative} derivative /><OptimizerFlowCell x={64 + j * 125} y={440 + i * 103} width={98} value={state.gradient[i][j]} role="derivative" />
      </g>)}
    </g>)}
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerUpdateDrawing({
  state = optimizerOpening()
}) {
  return <OptimizerFlowDrawing label="Subtract the scaled gradient from the actual weight matrix" description={`Learning rate ${state.rate}. Old weights minus rate times derivative yield ${state.nextWeights.flat().join(',')}. The same input produces scores ${state.nextScores.join(',')} and probabilities ${state.nextProbabilities.join(',')}.`} height={449}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={15} y={18} color={c.parameter}>old weights W</OptimizerFlowText><OptimizerFlowText x={195} y={18} color={c.derivative}>gradient g</OptimizerFlowText>
    {state.weights.map((row, i) => row.map((value, j) => <g key={`${i}-${j}`}><OptimizerFlowCell x={12 + j * 68} y={31 + i * 41} width={60} role="parameter" value={value} /><OptimizerFlowCell x={191 + j * 80} y={31 + i * 41} width={77} role="derivative" value={state.gradient[i][j]} /></g>))}
    <OptimizerFlowWire from={[91, 113]} to={[139, 182]} marker={forward} /><OptimizerFlowWire from={[269, 113]} to={[205, 182]} marker={forward} /><OptimizerFlowText x={264} y={150} color={c.derivative} anchor="middle">× η={f(state.rate)}</OptimizerFlowText><circle cx={174} cy={196} r={15} fill="none" stroke={c.operator} /><OptimizerFlowText x={174} y={201} anchor="middle">−</OptimizerFlowText><OptimizerFlowWire from={[174, 211]} to={[174, 238]} marker={forward} /><OptimizerFlowText x={174} y={259} color={c.parameter} anchor="middle">new weights</OptimizerFlowText>
    {state.nextWeights.map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={75 + j * 103} y={272 + i * 40} width={96} role="parameter" value={value} />))}
    <OptimizerFlowWire from={[174, 342]} to={[174, 368]} marker={forward} /><OptimizerFlowText x={174} y={389} anchor="middle">same input → new scores</OptimizerFlowText><OptimizerFlowText x={174} y={413} color={c.computed} anchor="middle">{optimizerVector(state.nextScores)}</OptimizerFlowText><OptimizerFlowText x={174} y={440} color={c.computed} anchor="middle">new p₀ = {f(state.nextProbabilities[0], 6)}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function AdamHistoriesDrawing() {
  return <OptimizerFlowDrawing label="Signed and squared gradients feed separate persistent arrays" description="Fresh gradients 2 and negative 4. Signed history starts zero and becomes 0.2, negative 0.4 under beta 0.9. Squared history becomes 0.004,.016 under beta 0.999. Squaring removes signs, while signed history preserves them." height={356}>{({
      forward
    }) => <>
    <OptimizerFlowText x={175} y={18} anchor="middle" color={c.derivative}>current gradient [2, −4]</OptimizerFlowText>
    <OptimizerFlowWire from={[145, 27]} to={[80, 65]} marker={forward} /><OptimizerFlowWire from={[205, 27]} to={[273, 65]} marker={forward} />
    <OptimizerFlowText x={80} y={83} anchor="middle">retain signs</OptimizerFlowText><OptimizerFlowText x={273} y={83} anchor="middle">square each</OptimizerFlowText><OptimizerFlowCell x={27} y={98} width={107} value="2, −4" role="derivative" /><OptimizerFlowCell x={220} y={98} width={107} value="4, 16" />
    {[0, 1].map(i => <g key={i}><OptimizerFlowWire from={[80 + i * 193, 128]} to={[80 + i * 193, 150]} marker={forward} /><OptimizerFlowText x={80 + i * 193} y={171} anchor="middle">× {i ? '.001' : '.1'} fresh</OptimizerFlowText><OptimizerFlowText x={80 + i * 193} y={196} anchor="middle">+ {i ? '.999' : '.9'} old</OptimizerFlowText><OptimizerFlowText x={80 + i * 193} y={221} anchor="middle">old buffer [0, 0]</OptimizerFlowText><OptimizerFlowWire from={[80 + i * 193, 233]} to={[80 + i * 193, 259]} marker={forward} /><OptimizerFlowCell x={22 + i * 193} y={272} width={117} value={i ? '.004, .016' : '.2, −.4'} /><OptimizerFlowText x={80 + i * 193} y={333} anchor="middle" color={c.computed}>{i ? 'v: squared history' : 'm: signed history'}</OptimizerFlowText></g>)}
  </>}</OptimizerFlowDrawing>;
}
export function AdamCorrectionDrawing() {
  const beta = .9,
    terms = [beta ** 3, (1 - beta) * beta ** 2, (1 - beta) * beta, 1 - beta];
  let offset = 15;
  return <OptimizerFlowDrawing label="Some early averaging weight still belongs to the initial zero" description="At update 3 with beta 0.9, initial zero has weight 0.729. Gradients 1, 2, 3 have weights 0.081,.09,.1. Their sum 0.271 equals 1−.9 cubed. Dividing the computed average by 0.271 removes that initial-zero contribution." height={300}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>update t=3; β=.9</OptimizerFlowText>
    {terms.map((term, i) => {
        const start = offset;
        offset += 320 * term;
        return <g key={i}><rect x={start} y={35} width={320 * term} height={30} fill={i ? c.computed : c.operator} />{i === 0 && <OptimizerFlowText x={start + 8} y={55} color="#080808">initial zero .729</OptimizerFlowText>}</g>;
      })}
    {terms.map((term, i) => <g key={i}><OptimizerFlowText x={20} y={101 + i * 28}>{i ? `gradient ${i}` : 'initial zero'}</OptimizerFlowText><OptimizerFlowText x={190} y={101 + i * 28} color={i ? c.computed : c.operator}>weight {f(term, 3)}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={175} y={219} anchor="middle">gradient weight sum = .271</OptimizerFlowText><OptimizerFlowWire from={[175, 230]} to={[175, 254]} marker={forward} /><OptimizerFlowText x={175} y={279} anchor="middle">m ÷ (1−βᵗ) → corrected m</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerSignedRulers({
  rows,
  label,
  description
}) {
  const values = rows.flatMap(row => row.points.map(point => point.value));
  const lo = Math.min(0, ...values),
    hi = Math.max(0, ...values),
    span = hi - lo || 1,
    padding = span * .15;
  const project = value => 30 + (value - lo + padding) / (span + 2 * padding) * 285;
  const offsets = rows.map((_, i) => rows.slice(0, i).reduce((total, row) => total + 125 + row.points.length * 27, 0));
  const number = value => Math.abs(value) > 1e5 ? value.toExponential(3) : f(value, 6);
  return <OptimizerFlowDrawing label={label} description={description} height={rows.reduce((total, row) => total + 125 + row.points.length * 27, 0)}>
    {rows.map((row, i) => {
      const offset = offsets[i];
      return <g key={row.name}><OptimizerFlowText x={15} y={22 + offset}>{row.name}</OptimizerFlowText><line x1={30} x2={315} y1={51 + offset} y2={51 + offset} stroke={c.operator} /><line x1={project(0)} x2={project(0)} y1={45 + offset} y2={58 + offset} stroke={c.operator} /><OptimizerFlowText x={30} y={76 + offset} color={c.operator}>{number(lo - padding)}</OptimizerFlowText><OptimizerFlowText x={315} y={76 + offset} anchor="end" color={c.operator}>{number(hi + padding)}</OptimizerFlowText><OptimizerFlowText x={project(0)} y={98 + offset} anchor="middle" color={c.operator}>0</OptimizerFlowText>{row.points.map((point, j) => <g key={point.name}><circle cx={project(point.value)} cy={51 + offset} r={5 + j * 2} fill={j === 0 ? c[point.role || 'parameter'] : 'none'} stroke={c[point.role || 'computed']} /><circle cx={25} cy={120 + offset + j * 27} r={5 + j * 2} fill={j === 0 ? c[point.role || 'parameter'] : 'none'} stroke={c[point.role || 'computed']} /><OptimizerFlowText x={44} y={125 + offset + j * 27} color={c[point.role || 'computed']}>{point.name}: {number(point.value)}</OptimizerFlowText></g>)}</g>;
    })}
  </OptimizerFlowDrawing>;
}
export function AdamUpdateDrawing() {
  return <OptimizerSignedRulers label="Decoupled shrinkage and normalized descent both change the weight" description="Coordinate 1 moves 0.5 to 0.4985 by decay, then 0.4685 by descent. Coordinate 2 moves negative 0.7 to negative 0.6979 then negative 0.6679. Both rulers share the same parameter units and zero; ring symbols distinguish coincident or nearby positions." rows={[{
    name: 'coordinate 1; direction +1',
    points: [{
      name: 'old',
      value: .5,
      role: 'parameter'
    }, {
      name: 'decay',
      value: .4985
    }, {
      name: 'next',
      value: .4685,
      role: 'parameter'
    }]
  }, {
    name: 'coordinate 2; direction −1',
    points: [{
      name: 'old',
      value: -.7,
      role: 'parameter'
    }, {
      name: 'decay',
      value: -.6979
    }, {
      name: 'next',
      value: -.6679,
      role: 'parameter'
    }]
  }]} />;
}
export function AdamImpulseDrawing() {
  const step = 1000,
    m = .1,
    v = .001,
    correctedM = m / (1 - .9 ** step),
    correctedV = v / (1 - .999 ** step),
    ratio = correctedM / Math.sqrt(correctedV);
  return <OptimizerFlowDrawing label="Different histories make a late impulse exceed a direction magnitude of one" description={`After 999 zero gradients and gradient 1 at update 1000, signed raw moment 0.1 and second raw moment 0.001 give bias-corrected direction ${ratio} before epsilon.`} height={290}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>999 zero gradients → current g=1</OptimizerFlowText>
    <OptimizerFlowText x={75} y={56} anchor="middle">m=.1</OptimizerFlowText><OptimizerFlowText x={270} y={56} anchor="middle">v=.001</OptimizerFlowText>
    <OptimizerFlowWire from={[75, 67]} to={[75, 92]} marker={forward} /><OptimizerFlowWire from={[270, 67]} to={[270, 92]} marker={forward} /><OptimizerFlowText x={75} y={116} anchor="middle">÷ (1−.9¹⁰⁰⁰)</OptimizerFlowText><OptimizerFlowText x={270} y={116} anchor="middle">÷ (1−.999¹⁰⁰⁰)</OptimizerFlowText>
    <OptimizerFlowText x={75} y={154} anchor="middle" color={c.computed}>m̂={f(correctedM, 6)}</OptimizerFlowText><OptimizerFlowText x={270} y={154} anchor="middle" color={c.computed}>v̂={f(correctedV, 6)}</OptimizerFlowText><OptimizerFlowWire from={[75, 168]} to={[157, 205]} marker={forward} /><OptimizerFlowWire from={[270, 168]} to={[192, 205]} marker={forward} /><OptimizerFlowText x={175} y={229} anchor="middle">m̂ ÷ √v̂</OptimizerFlowText><OptimizerFlowText x={175} y={274} anchor="middle" color={c.computed}>direction = {f(ratio, 7)}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function LionBalanceDrawing({
  row,
  beta1 = .9,
  beta2 = .99,
  view = 'evidence'
}) {
  const memory = view === 'memory';
  const first = memory ? beta2 * row.memory : row.historyPart,
    second = memory ? (1 - beta2) * row.gradient : row.freshPart,
    result = memory ? row.nextMemory : row.blend;
  const extent = Math.max(Math.abs(first), Math.abs(second), Math.abs(result), .1) * 1.2;
  const px = value => 175 + value / extent * 142;
  return <OptimizerFlowDrawing label={memory ? 'The second blend writes the next momentum' : 'Blend old history and current gradient before taking a sign'} description={`History contribution ${first}, fresh gradient contribution ${second}, sum ${result}. ${memory ? 'Stored next memory.' : 'The sign of their sum chooses the current gradient-driven direction.'}`} height={memory ? 254 : 334}>{({
      forward
    }) => <>
    {[[`${memory ? 'β₂' : 'β₁'} × old m`, first], [`(1−${memory ? 'β₂' : 'β₁'}) × g`, second], [memory ? 'next stored m' : 'sum; before sign', result]].map(([name, value], i) => <g key={name}><OptimizerFlowText x={14} y={22 + i * 69} color={i === 2 ? c.computed : c.text}>{name}: {f(value, 6)}</OptimizerFlowText><line x1={33} x2={317} y1={42 + i * 69} y2={42 + i * 69} stroke={c.operator} /><line x1={175} x2={175} y1={35 + i * 69} y2={49 + i * 69} stroke={c.operator} /><line x1={175} x2={px(value)} y1={42 + i * 69} y2={42 + i * 69} stroke={i === 1 ? c.derivative : c.computed} strokeWidth={6} /><circle cx={px(value)} cy={42 + i * 69} r={4} fill={i === 1 ? c.derivative : c.computed} /></g>)}
    <OptimizerFlowText x={175} y={224} anchor="middle" color={c.operator}>all rulers share zero and units</OptimizerFlowText>
    {!memory && <><OptimizerFlowWire from={[175, 234]} to={[175, 260]} marker={forward} /><OptimizerFlowText x={175} y={283} anchor="middle">sign(sum)</OptimizerFlowText>{[-1, 0, 1].map((sign, i) => <g key={sign}><circle cx={80 + 95 * i} cy={315} r={13} fill={sign === row.direction ? c.computed : 'none'} stroke={c.computed} /><OptimizerFlowText x={80 + 95 * i} y={320} anchor="middle" color={sign === row.direction ? '#080808' : c.computed}>{sign === -1 ? '−1' : sign}</OptimizerFlowText></g>)}</>}
  </>}</OptimizerFlowDrawing>;
}
export function CurvatureBowlsDrawing() {
  const geometries = [bowlGeometry(false), bowlGeometry(true)],
    scale = 34;
  return <OptimizerFlowDrawing label="Diagonal curvature loses off-axis coupling" description="Two quadratic bowls share parameter axes and initial location 2, negative 1. Principal curvature 1 and 20; second bowl rotates by pi over 6. Actual gradient rate 0.08, diagonal-Newton and full-Newton endpoints are drawn. Full Newton reaches 0, 0, while rotated diagonal update differs." height={868}>{({
      forward
    }) => <>
    {geometries.map((geometry, panel) => {
        const cy = 170 + panel * 430,
          cx = 174,
          point = value => [cx + scale * value[0], cy - scale * value[1]],
          xy = point(geometry.point);
        const directions = [['gradient η=.08', geometry.descent, c.derivative], ['diagonal step', geometry.diagonal, c.computed], ['full Newton', geometry.newton, c.parameter]];
        return <g key={panel}>
        <OptimizerFlowText x={15} y={22 + panel * 430}>{panel ? 'same bowl rotated by π/6' : 'axis-aligned quadratic bowl'}</OptimizerFlowText>
        <line x1={cx - 3 * scale} x2={cx + 3 * scale} y1={cy} y2={cy} stroke={c.operator} /><line x1={cx} x2={cx} y1={cy - 3 * scale} y2={cy + 3 * scale} stroke={c.operator} />
        {[-3, -2, -1, 1, 2, 3].map(tick => <g key={tick}><line x1={cx + scale * tick} x2={cx + scale * tick} y1={cy - 3} y2={cy + 3} stroke={c.operator} /><OptimizerFlowText x={cx + scale * tick} y={cy + 18} anchor="middle" color={c.operator}>{tick}</OptimizerFlowText></g>)}
        <OptimizerFlowText x={cx + 3 * scale + 17} y={cy + 5}>θ₁</OptimizerFlowText><OptimizerFlowText x={cx + 5} y={cy - 3 * scale - 15}>θ₂</OptimizerFlowText>
        {[.5, 1, 2, 4].map(level => <ellipse key={level} cx={cx} cy={cy} rx={scale * Math.sqrt(2 * level)} ry={scale * Math.sqrt(2 * level / 20)} transform={`rotate(${-geometry.angle * 180 / Math.PI},${cx},${cy})`} fill="none" stroke={c.operator} strokeDasharray="2 3" />)}
        <circle cx={xy[0]} cy={xy[1]} r={5} fill={c.input} /><OptimizerFlowText x={xy[0] - 3} y={xy[1] + 25} anchor="end" color={c.input}>start [2, −1]</OptimizerFlowText>
        {directions.map(([name, destination, color], i) => {
            const end = point(destination);
            return <g key={name}><line x1={xy[0]} x2={end[0]} y1={xy[1]} y2={end[1]} stroke={color} strokeDasharray={i === 0 ? '5 4' : undefined} markerEnd={forward} /><circle cx={end[0]} cy={end[1]} r={4} fill="none" stroke={color} /><OptimizerFlowText x={15} y={303 + panel * 430 + i * 24} color={color}>{name}: {optimizerVector(destination, 4)}</OptimizerFlowText></g>;
          })}
        <OptimizerFlowText x={15} y={379 + panel * 430}>dashed L: .5, 1, 2, 4 (inside → out)</OptimizerFlowText><OptimizerFlowText x={15} y={414 + panel * 430}>H={optimizerVector(geometry.H[0], 4)},</OptimizerFlowText><OptimizerFlowText x={178} y={414 + panel * 430}>{optimizerVector(geometry.H[1], 4)}</OptimizerFlowText>
      </g>;
      })}
  </>}</OptimizerFlowDrawing>;
}
export function SophiaClipDrawing({
  momentum = [.2, -.3, 0],
  diagonal = [5, .1, 0],
  rho = .5,
  epsilon = 1e-12
}) {
  const denominators = diagonal.map(value => Math.max(rho * value, epsilon)),
    ratios = momentum.map((value, i) => value / denominators[i]),
    clipped = ratios.map(value => Math.max(-1, Math.min(1, value)));
  return <OptimizerFlowDrawing label="Floor a curvature denominator, divide momentum, then clip each coordinate" description={`Momentum ${momentum.join(',')}, smoothed diagonal ${diagonal.join(',')}, rho ${rho}, epsilon ${epsilon}. Ratios ${ratios.join(',')} clip to ${clipped.join(',')}. Each lane is a coordinate of the same parameter vector.`} height={440}>{({
      forward
    }) => <>
    {[0, 1, 2].map(i => <g key={i}>
      <OptimizerFlowText x={58 + i * 116} y={18} anchor="middle">coordinate {i + 1}</OptimizerFlowText><OptimizerFlowText x={58 + i * 116} y={49} anchor="middle" color={c.computed}>m={f(momentum[i])}</OptimizerFlowText><OptimizerFlowWire from={[90 + i * 116, 49]} to={[78 + i * 116, 225]} bend={[[104 + i * 116, 59], [104 + i * 116, 225]]} marker={forward} /><OptimizerFlowText x={58 + i * 116} y={76} anchor="middle" color={c.computed}>h={f(diagonal[i])}</OptimizerFlowText><OptimizerFlowWire from={[58 + i * 116, 86]} to={[58 + i * 116, 108]} marker={forward} /><OptimizerFlowText x={58 + i * 116} y={132} anchor="middle">ρh={f(rho * diagonal[i])}</OptimizerFlowText><OptimizerFlowText x={58 + i * 116} y={159} anchor="middle">floor at ε</OptimizerFlowText><OptimizerFlowText x={58 + i * 116} y={186} anchor="middle" color={c.computed}>{denominators[i] < 1e-6 ? denominators[i].toExponential(1) : f(denominators[i])}</OptimizerFlowText><OptimizerFlowWire from={[58 + i * 116, 199]} to={[58 + i * 116, 223]} marker={forward} /><OptimizerFlowText x={58 + i * 116} y={248} anchor="middle">m ÷ denominator</OptimizerFlowText><OptimizerFlowText x={58 + i * 116} y={276} anchor="middle" color={c.computed}>{Math.abs(ratios[i]) > 1e6 ? ratios[i].toExponential(2) : f(ratios[i])}</OptimizerFlowText><OptimizerFlowWire from={[58 + i * 116, 289]} to={[58 + i * 116, 313]} marker={forward} /><OptimizerFlowText x={58 + i * 116} y={338} anchor="middle">clip to [−1,1]</OptimizerFlowText><OptimizerFlowCell x={29 + i * 116} y={360} value={clipped[i]} />
    </g>)}
    <OptimizerFlowText x={175} y={424} anchor="middle">ρ={f(rho)}; ε={epsilon.toExponential(0)}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function HessianProbeDrawing({
  matrix = [2, 3, 1],
  probe = [1, 1]
}) {
  const [a, b, d] = matrix,
    H = [[a, b], [b, d]],
    product = H.map(row => row.reduce((total, value, i) => total + value * probe[i], 0)),
    estimate = product.map((value, i) => value * probe[i]);
  return <OptimizerFlowDrawing label="Matrix product before elementwise probe multiplication" description={`Hessian rows ${H.map(row => row.join(',')).join(';')}. Probe ${probe.join(',')}. Matrix-vector product ${product.join(',')}; elementwise estimate ${estimate.join(',')}. All four equally likely sign probes average the diagonal ${a},${d}.`} height={477}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>symmetric Hessian H</OptimizerFlowText><OptimizerFlowText x={239} y={18} color={c.input}>probe u</OptimizerFlowText>
    {H.map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={14 + j * 68} y={32 + i * 43} width={59} value={value} />))}
    {probe.map((value, i) => <OptimizerFlowCell key={i} x={249} y={32 + i * 43} width={59} value={value} role="input" />)}
    <OptimizerFlowText x={190} y={78} anchor="middle">×</OptimizerFlowText><OptimizerFlowWire from={[175, 117]} to={[175, 146]} marker={forward} />
    {H.map((row, i) => <OptimizerFlowText key={i} x={175} y={171 + i * 28} anchor="middle">row {i + 1}: {f(row[0])}×{probe[0]} + {f(row[1])}×{probe[1]}</OptimizerFlowText>)}
    <OptimizerFlowText x={175} y={237} anchor="middle" color={c.computed}>Hu={optimizerVector(product)}</OptimizerFlowText><OptimizerFlowWire from={[175, 250]} to={[175, 278]} marker={forward} /><OptimizerFlowText x={175} y={303} anchor="middle">multiply each result by its u</OptimizerFlowText><OptimizerFlowText x={175} y={335} anchor="middle" color={c.computed}>u⊙Hu={optimizerVector(estimate)}</OptimizerFlowText>
    <OptimizerFlowText x={175} y={384} anchor="middle">four-probe mean:</OptimizerFlowText><OptimizerFlowText x={175} y={413} anchor="middle" color={c.computed}>{optimizerVector([a, d])}</OptimizerFlowText><OptimizerFlowText x={175} y={459} anchor="middle">each chosen probe is one estimate</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function HessianMatrixDrawing({
  matrix = [4, -2, 1]
}) {
  const [a, b, d] = matrix,
    eigenvalues = hessianProbes(a, b, d).eigenvalues;
  return <OptimizerFlowDrawing label="Three independent entries specify a complete symmetric matrix" description={`Current matrix ${a},${b};${b},${d}. Eigenvalues ${eigenvalues.join(',')}. The off-diagonal cells are the same edited quantity; changing one changes both.`} height={210}>
    <OptimizerFlowText x={175} y={18} anchor="middle">H: rows and columns are coordinates</OptimizerFlowText>
    {[[a, b], [b, d]].map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={100 + j * 83} y={45 + i * 44} width={69} value={value} />))}
    <OptimizerFlowText x={175} y={167} anchor="middle" color={c.computed}>eigenvalues {optimizerVector(eigenvalues, 6)}</OptimizerFlowText><OptimizerFlowText x={175} y={196} anchor="middle">both off-diagonal cells share H₁₂</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function HessianAutogradDrawing() {
  return <OptimizerFlowDrawing label="A second derivative of a scalar dot product gives a Hessian-vector product" description="Differentiate scalar loss L with respect to parameters to obtain gradient g while preserving its graph. Dot fixed supplied probe u with g. Differentiate that scalar with respect to the same parameters to obtain H u. Each new loss evaluation has a fresh graph." height={407}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={15} y={18} color={c.parameter}>same parameters θ</OptimizerFlowText><OptimizerFlowWire from={[175, 29]} to={[175, 56]} marker={forward} /><OptimizerFlowText x={175} y={81} anchor="middle">compute scalar loss L</OptimizerFlowText><OptimizerFlowWire from={[175, 93]} to={[175, 122]} marker={derivative} derivative /><OptimizerFlowText x={175} y={148} anchor="middle" color={c.derivative}>first derivative g=∇L</OptimizerFlowText><OptimizerFlowText x={175} y={174} anchor="middle">preserve this gradient graph</OptimizerFlowText><OptimizerFlowWire from={[175, 187]} to={[175, 220]} marker={forward} /><OptimizerFlowText x={175} y={247} anchor="middle">sum gᵢuᵢ → one scalar</OptimizerFlowText><OptimizerFlowText x={15} y={219} color={c.input}>fixed u</OptimizerFlowText><OptimizerFlowWire from={[74, 216]} to={[136, 236]} marker={forward} /><OptimizerFlowWire from={[175, 260]} to={[175, 297]} marker={derivative} derivative /><OptimizerFlowText x={175} y={325} anchor="middle" color={c.derivative}>second derivative ∇(gᵀu)=Hu</OptimizerFlowText><OptimizerFlowText x={175} y={377} anchor="middle">new loss evaluation → fresh graph</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function SampledLabelDrawing({
  input = 2,
  probability = .8,
  label = 1
}) {
  const realGradient = input * (probability - label),
    derivatives = [input * probability, input * (probability - 1)],
    masses = [1 - probability, probability],
    weighted = derivatives.map((value, i) => masses[i] * value ** 2);
  return <OptimizerFlowDrawing label="True-label training and model-sampled curvature are separate paths" description={`Input ${input}, model probability ${probability}, real target ${label}. True derivative ${realGradient} squares to ${realGradient ** 2}. Model label 0 probability ${masses[0]} yields derivative ${derivatives[0]}; label 1 probability ${masses[1]} yields ${derivatives[1]}. Weighted squared expectation ${weighted[0] + weighted[1]}.`} height={533}>{({
      forward
    }) => <>
    <OptimizerFlowText x={175} y={18} anchor="middle">input x={f(input)}; current p={f(probability)}</OptimizerFlowText><OptimizerFlowText x={15} y={52} color={c.input}>real label {label}</OptimizerFlowText><OptimizerFlowWire from={[64, 62]} to={[64, 85]} marker={forward} /><OptimizerFlowText x={64} y={108} anchor="middle" color={c.derivative}>g={f(realGradient)}</OptimizerFlowText><OptimizerFlowText x={64} y={136} anchor="middle" color={c.computed}>g²={f(realGradient ** 2)}</OptimizerFlowText><OptimizerFlowText x={275} y={52} anchor="middle">model draw</OptimizerFlowText>
    {[0, 1].map(sample => <g key={sample}><OptimizerFlowWire from={[285, 64]} to={[83 + sample * 180, 196]} marker={forward} /><OptimizerFlowText x={83 + sample * 180} y={220} anchor="middle" color={c.input}>sampled label {sample}</OptimizerFlowText><OptimizerFlowText x={83 + sample * 180} y={247} anchor="middle">probability {f(masses[sample])}</OptimizerFlowText><OptimizerFlowText x={83 + sample * 180} y={275} anchor="middle" color={c.derivative}>g={f(derivatives[sample])}</OptimizerFlowText><OptimizerFlowText x={83 + sample * 180} y={303} anchor="middle">square {f(derivatives[sample] ** 2)}</OptimizerFlowText><OptimizerFlowText x={83 + sample * 180} y={331} anchor="middle" color={c.computed}>weighted {f(weighted[sample])}</OptimizerFlowText><OptimizerFlowWire from={[83 + sample * 180, 344]} to={[175, 373]} marker={forward} /></g>)}
    <circle cx={175} cy={389} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={394} anchor="middle">+</OptimizerFlowText><OptimizerFlowText x={175} y={431} anchor="middle" color={c.computed}>expected square {f(weighted[0] + weighted[1])}</OptimizerFlowText><OptimizerFlowText x={175} y={474} anchor="middle">analytic x²p(1−p)</OptimizerFlowText><OptimizerFlowText x={175} y={504} anchor="middle" color={c.computed}>{f(input ** 2 * probability * (1 - probability))}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function SampledBatchDrawing({
  inputs = [2, 1],
  probabilities = [.8, .3],
  labels = [1, 0]
}) {
  const result = sampledCurvature(inputs, probabilities, labels);
  return <OptimizerFlowDrawing label="All four independent sampled-label pairs feed the batch-scaled square" description={`Two examples with inputs ${inputs.join(',')}, probabilities ${probabilities.join(',')}. Each independent label pair has its joint probability and twice its squared mean gradient; their weighted sum ${result.expectation} equals analytic mean ${result.exact}, while true-label mean square ${result.trueSquare} is separate.`} height={531}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>two independent examples; N=2</OptimizerFlowText><OptimizerFlowText x={15} y={47} color={c.input}>x={optimizerVector(inputs)}; p={optimizerVector(probabilities)}</OptimizerFlowText>
    {result.outcomes.map((row, i) => <g key={i}><OptimizerFlowText x={15} y={85 + i * 79} color={c.input}>draw [{row.sampled.join(', ')}]</OptimizerFlowText><OptimizerFlowText x={147} y={85 + i * 79}>mass {f(row.probability, 5)}</OptimizerFlowText><OptimizerFlowWire from={[95, 96 + i * 79]} to={[121, 96 + i * 79]} marker={forward} /><OptimizerFlowText x={147} y={111 + i * 79} color={c.derivative}>mean ĝ={f(row.gradient, 6)}</OptimizerFlowText><OptimizerFlowText x={15} y={139 + i * 79}>Nĝ²={f(row.estimate, 6)}</OptimizerFlowText><OptimizerFlowText x={175} y={139 + i * 79} color={c.computed}>mass × Nĝ²={f(row.contribution, 6)}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={175} y={435} anchor="middle">sum all four weighted leaves</OptimizerFlowText><OptimizerFlowText x={175} y={464} anchor="middle" color={c.computed}>expected {f(result.expectation, 7)}</OptimizerFlowText><OptimizerFlowText x={175} y={493} anchor="middle">analytic mean {f(result.exact, 7)}</OptimizerFlowText><OptimizerFlowText x={175} y={522} anchor="middle">without N: {f(result.expectation / 2, 7)}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function GGNChainDrawing() {
  // A local shape cutaway: two classes and one parameter, with symbolic
  // derivatives. Concrete values enter only in the following counterexample.
  return <OptimizerFlowDrawing label="The loss Hessian has a Gauss–Newton route and a logit-curvature route" description="Two classes and one parameter show Jacobian entries df0/dtheta and df1/dtheta. Logit curvature has p0(1−p0), negative p0p1, negative p1p0, p1(1−p1). J transpose C J forms G. Separate residual-weighted logit second derivatives join G to form H; nonlinear logits can contribute on both paths." height={647}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={175} y={18} anchor="middle">two-class, one-parameter cutaway</OptimizerFlowText><OptimizerFlowText x={40} y={53} color={c.parameter}>θ</OptimizerFlowText><OptimizerFlowWire from={[65, 49]} to={[148, 49]} marker={forward} /><OptimizerFlowWire from={[65, 49]} to={[242, 49]} bend={[[100, 49], [100, 75], [235, 75], [235, 49]]} marker={forward} /><OptimizerFlowCell x={148} y={32} width={75} value="f₀(θ)" /><OptimizerFlowCell x={242} y={32} width={75} value="f₁(θ)" />
    <OptimizerFlowText x={15} y={101} color={c.derivative}>J: logit derivatives</OptimizerFlowText><OptimizerFlowCell x={152} y={114} width={89} value="∂f₀/∂θ" role="derivative" /><OptimizerFlowCell x={152} y={154} width={89} value="∂f₁/∂θ" role="derivative" />
    <OptimizerFlowText x={15} y={224}>C: curvature in logits</OptimizerFlowText>
    {[['p₀(1−p₀)', '−p₀p₁'], ['−p₁p₀', 'p₁(1−p₁)']].map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={64 + j * 119} y={237 + i * 41} width={110} value={value} />))}
    <OptimizerFlowWire from={[241, 169]} to={[228, 351]} bend={[[333, 169], [333, 351]]} marker={forward} /><OptimizerFlowWire from={[175, 308]} to={[175, 337]} marker={forward} /><rect x={120} y={337} width={110} height={30} rx={5} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={358} anchor="middle">Jᵀ C J</OptimizerFlowText><OptimizerFlowWire from={[175, 367]} to={[175, 386]} marker={forward} /><OptimizerFlowText x={175} y={404} anchor="middle" color={c.computed}>G</OptimizerFlowText>
    <OptimizerFlowText x={175} y={437} anchor="middle">second, separate path:</OptimizerFlowText><OptimizerFlowText x={175} y={466} anchor="middle" color={c.derivative}>(p₀−y₀)∇²f₀ + (p₁−y₁)∇²f₁</OptimizerFlowText><OptimizerFlowWire from={[175, 479]} to={[175, 515]} marker={forward} /><OptimizerFlowWire from={[157, 399]} to={[161, 529]} bend={[[38, 399], [38, 529]]} marker={forward} /><circle cx={175} cy={529} r={14} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={534} anchor="middle">+</OptimizerFlowText><OptimizerFlowWire from={[175, 543]} to={[175, 564]} marker={forward} /><OptimizerFlowText x={175} y={585} anchor="middle" color={c.computed}>full H = G + residual path</OptimizerFlowText><OptimizerFlowText x={175} y={627} anchor="middle">linear logits: second path is zero</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function GGNScalarDrawing() {
  const theta = 1,
    probability = 1 / (1 + Math.exp(-(theta ** 2))),
    ggn = 4 * theta ** 2 * probability * (1 - probability),
    extra = 2 * (probability - 1),
    full = ggn + extra;
  return <OptimizerFlowDrawing label="A nonlinear logit contributes curvature beyond the Gauss–Newton term" description={`Logit theta squared, theta 1, real class 1 target, probability ${probability}. Logit first derivative 2 and second derivative 2. Gauss–Newton ${ggn}, residual term ${extra}, full Hessian ${full}.`} height={427}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18} color={c.parameter}>θ=1 → logit f₁=θ²=1</OptimizerFlowText><OptimizerFlowText x={15} y={48}>f₀=0; p₁={f(probability, 6)}; y₁=1</OptimizerFlowText>
    <OptimizerFlowText x={83} y={97} anchor="middle">first derivative 2</OptimizerFlowText><OptimizerFlowText x={268} y={97} anchor="middle">second derivative 2</OptimizerFlowText><OptimizerFlowWire from={[83, 110]} to={[83, 145]} marker={forward} /><OptimizerFlowWire from={[268, 110]} to={[268, 145]} marker={forward} /><OptimizerFlowText x={83} y={169} anchor="middle">2² × p₁(1−p₁)</OptimizerFlowText><OptimizerFlowText x={268} y={169} anchor="middle">2 × (p₁−1)</OptimizerFlowText><OptimizerFlowText x={83} y={204} anchor="middle" color={c.computed}>G={f(ggn, 6)}</OptimizerFlowText><OptimizerFlowText x={268} y={204} anchor="middle" color={c.derivative}>{f(extra, 6)}</OptimizerFlowText><OptimizerFlowWire from={[83, 216]} to={[156, 258]} marker={forward} /><OptimizerFlowWire from={[268, 216]} to={[194, 258]} marker={forward} /><circle cx={175} cy={275} r={14} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={280} anchor="middle">+</OptimizerFlowText><OptimizerFlowText x={175} y={327} anchor="middle" color={c.computed}>full H={f(full, 6)}</OptimizerFlowText><OptimizerFlowText x={175} y={391} anchor="middle">all terms at the same θ and target</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function SophiaRefreshDrawing() {
  return <OptimizerFlowDrawing label="Training and curvature gradients read the same unchanged parameters" description="One amber current model forks to two computed violet mean losses. Cyan true targets enter the training loss; independently model-sampled targets enter the curvature loss. Separate cleared gradients store g and sampled gradient. Multiply squared sampled mean by N once, refresh h, then step using saved g. No parameter update lies between reads." height={472}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={175} y={18} anchor="middle" color={c.parameter}>one unchanged current θ</OptimizerFlowText>
    <OptimizerFlowWire from={[145, 29]} to={[39, 127]} bend={[[28, 29], [28, 127]]} marker={forward} /><OptimizerFlowWire from={[205, 29]} to={[321, 127]} bend={[[332, 29], [332, 127]]} marker={forward} />
    <OptimizerFlowText x={80} y={63} anchor="middle" color={c.input}>true targets</OptimizerFlowText><OptimizerFlowText x={271} y={63} anchor="middle" color={c.input}>model-sampled targets</OptimizerFlowText><OptimizerFlowWire from={[80, 75]} to={[80, 103]} marker={forward} /><OptimizerFlowWire from={[271, 75]} to={[271, 103]} marker={forward} />
    <OptimizerFlowText x={80} y={130} anchor="middle" color={c.computed}>training mean loss</OptimizerFlowText><OptimizerFlowText x={271} y={130} anchor="middle" color={c.computed}>sampled mean loss</OptimizerFlowText><OptimizerFlowWire from={[80, 143]} to={[80, 172]} marker={derivative} derivative /><OptimizerFlowWire from={[271, 143]} to={[271, 172]} marker={derivative} derivative />
    <OptimizerFlowText x={80} y={197} anchor="middle" color={c.derivative}>save g</OptimizerFlowText><OptimizerFlowText x={271} y={197} anchor="middle" color={c.derivative}>separate ĝ</OptimizerFlowText><OptimizerFlowText x={80} y={234} anchor="middle">clear each buffer</OptimizerFlowText><OptimizerFlowText x={271} y={234} anchor="middle">N × ĝ², once</OptimizerFlowText><OptimizerFlowWire from={[271, 248]} to={[271, 278]} marker={forward} /><OptimizerFlowText x={271} y={307} anchor="middle" color={c.computed}>refresh h</OptimizerFlowText><OptimizerFlowWire from={[80, 247]} to={[155, 352]} marker={forward} /><OptimizerFlowWire from={[271, 320]} to={[195, 352]} marker={forward} /><OptimizerFlowText x={175} y={377} anchor="middle">momentum / curvature / clip</OptimizerFlowText><OptimizerFlowWire from={[175, 390]} to={[175, 420]} marker={forward} /><OptimizerFlowText x={175} y={449} anchor="middle" color={c.parameter}>only now update θ</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerTraceDrawing({
  label,
  description,
  series,
  xLabel = 'update',
  yLabel = 'parameter location',
  zero = false,
  yDomain,
  xTicks
}) {
  const finite = series.flatMap(line => line.points).filter(point => point.every(Number.isFinite));
  const xs = finite.map(point => point[0]),
    ys = finite.map(point => point[1]);
  const xmin = Math.min(0, ...xs),
    xmax = Math.max(1, ...xs),
    low = Math.min(...ys, ...(zero ? [0] : [])),
    high = Math.max(...ys, ...(zero ? [0] : []));
  const pad = Math.max((high - low) * .08, .1),
    ymin = yDomain?.[0] ?? low - pad,
    ymax = yDomain?.[1] ?? high + pad;
  const x = value => 78 + 249 * (value - xmin) / (xmax - xmin),
    y = value => 260 - 207 * (value - ymin) / (ymax - ymin);
  const tick = value => Math.abs(value) > 1e4 ? value.toExponential(1) : f(value, 3);
  const curveColors = ['#e6bb60', '#c5a5e8', '#79c8e8', '#f09a68', '#dedede', '#a5a5a5'];
  return <OptimizerFlowDrawing label={label} description={description} height={350 + series.length * 38}>
    <OptimizerFlowText x={15} y={18}>{yLabel}</OptimizerFlowText>
    <line x1={78} x2={78} y1={53} y2={260} stroke={c.operator} /><line x1={78} x2={327} y1={260} y2={260} stroke={c.operator} />
    {[0, .5, 1].map(fraction => {
      const value = ymin + fraction * (ymax - ymin),
        yy = y(value);
      return <g key={fraction}><line x1={74} x2={327} y1={yy} y2={yy} stroke={c.operator} opacity={.25} /><OptimizerFlowText x={70} y={yy + 4} anchor="end">{tick(value)}</OptimizerFlowText></g>;
    })}
    {(xTicks || [xmin, xmax]).map(value => <OptimizerFlowText key={value} x={x(value)} y={282} anchor="middle">{f(value)}</OptimizerFlowText>)}
    {zero && ymin <= 0 && ymax >= 0 && <line x1={78} x2={327} y1={y(0)} y2={y(0)} stroke={c.operator} strokeDasharray="3 3" />}
    {series.map((line, i) => {
      const points = line.points.filter(point => point.every(Number.isFinite)),
        last = points.at(-1),
        paint = curveColors[i % curveColors.length],
        dash = line.dash || (line.dashed ? '5 4' : undefined),
        labelY = 340 + i * 38,
        rail = 343 - i * 2;
      return <g key={line.name}>{line.connect !== false && <polyline points={points.map(point => `${x(point[0])},${y(point[1])}`).join(' ')} stroke={paint} strokeDasharray={dash} fill="none" />}{points.map((point, j) => <circle key={j} cx={x(point[0])} cy={y(point[1])} r={2.5} fill={paint} />)}{last && <polyline points={`${x(last[0])},${y(last[1])} ${rail},${y(last[1])} ${rail},${labelY - 5} 15,${labelY - 5}`} stroke={paint} strokeWidth={.7} strokeDasharray={dash} fill="none" opacity={.65} />}<OptimizerFlowText x={15} y={labelY + 11} color={paint}>{line.name}</OptimizerFlowText></g>;
    })}
    <OptimizerFlowText x={190} y={307} anchor="middle">{xLabel}</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function ProdigyDisplacementDrawing() {
  const row = prodigyTrace(0, 3, .01, 1, 12).rows[2];
  return <OptimizerSignedRulers label="Observed movement meets the current gradient" description="Prodigy update 3 begins at its previous computed parameter, not at the target. Gradient comes from the declared quadratic; displacement points back to initialization. Their dot product enters the scale statistic." rows={[{
    name: 'one coordinate; update 3',
    points: [{
      name: 'initial θ₀',
      value: 0,
      role: 'parameter'
    }, {
      name: 'before θ',
      value: row.before,
      role: 'parameter'
    }, {
      name: 'after θ',
      value: row.after,
      role: 'parameter'
    }, {
      name: 'target a',
      value: 3,
      role: 'input'
    }]
  }]} />;
}
export function ProdigyGlobalDrawing({
  gradients = [-1, 2],
  displacements = [-.5, -.25]
}) {
  const terms = gradients.map((value, i) => value * displacements[i]),
    total = terms.reduce((a, b) => a + b, 0);
  return <OptimizerFlowDrawing label="A global dot product combines all signed contributions" description={`Gradients ${gradients}; displacement toward initial weights ${displacements}. Coordinate products ${terms}; global sum ${total}. Absolute values before summation would be a different statistic.`} height={270}>{({
      forward
    }) => <>
    {terms.map((term, i) => <g key={i}><OptimizerFlowText x={87 + i * 175} y={18} anchor="middle">coordinate {i + 1}</OptimizerFlowText><OptimizerFlowText x={87 + i * 175} y={52} anchor="middle" color={c.derivative}>g={f(gradients[i])}</OptimizerFlowText><OptimizerFlowText x={87 + i * 175} y={83} anchor="middle">θ₀−θ={f(displacements[i])}</OptimizerFlowText><circle cx={87 + i * 175} cy={113} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={87 + i * 175} y={118} anchor="middle">×</OptimizerFlowText><OptimizerFlowText x={87 + i * 175} y={154} anchor="middle" color={c.computed}>{f(term)}</OptimizerFlowText><OptimizerFlowWire from={[87 + i * 175, 165]} to={[156 + i * 38, 197]} marker={forward} /></g>)}
    <circle cx={175} cy={211} r={13} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={216} anchor="middle">+</OptimizerFlowText><OptimizerFlowText x={175} y={257} anchor="middle" color={c.computed}>signed global total {f(total)}</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function ProdigyStateDrawing({
  row = prodigyTrace(0, 3, .01, 1, 12).rows[2]
}) {
  const small = value => Math.abs(value) < .001 && value !== 0 ? value.toExponential(3) : f(value, 6);
  return <OptimizerFlowDrawing label="The scale used now is distinct from the scale retained next" description={`Current d ${row.distance_used} supplies both moment histories and the actual subtraction operator. Before weight ${row.before}, multiplier ${row.rate}, current moments ${row.momentum},${row.second} produce next weight ${row.after}. Accumulated r ${row.numerator}/L1 s ${row.denominator} proposes next d ${row.distance_next}, which has only a future-storage route.`} height={698}>{({
      forward
    }) => <>
    <OptimizerFlowText x={175} y={18} anchor="middle" color={c.computed}>current d={small(row.distance_used)}</OptimizerFlowText>
    <OptimizerFlowWire from={[133, 31]} to={[72, 89]} marker={forward} /><OptimizerFlowWire from={[216, 31]} to={[274, 89]} marker={forward} />
    <OptimizerFlowText x={77} y={115} anchor="middle">scaled histories</OptimizerFlowText><OptimizerFlowText x={77} y={146} anchor="middle">m uses d·g</OptimizerFlowText><OptimizerFlowText x={77} y={177} anchor="middle">v uses d²·g²</OptimizerFlowText>
    <OptimizerFlowText x={265} y={115} anchor="middle">adaptation histories</OptimizerFlowText><OptimizerFlowText x={265} y={146} anchor="middle">r={small(row.numerator)}</OptimizerFlowText><OptimizerFlowText x={265} y={177} anchor="middle">‖s‖₁={small(row.denominator)}</OptimizerFlowText>
    <OptimizerFlowWire from={[77, 190]} to={[77, 219]} marker={forward} /><OptimizerFlowText x={77} y={247} anchor="middle">m={small(row.momentum)}</OptimizerFlowText><OptimizerFlowText x={77} y={278} anchor="middle">v={small(row.second)}</OptimizerFlowText>
    <OptimizerFlowWire from={[265, 190]} to={[265, 219]} marker={forward} /><OptimizerFlowText x={265} y={247} anchor="middle">max(current d, r/‖s‖₁)</OptimizerFlowText><OptimizerFlowText x={265} y={278} anchor="middle" color={c.computed}>next d={small(row.distance_next)}</OptimizerFlowText>
    <OptimizerFlowText x={105} y={354} anchor="middle" color={c.parameter}>old θ={f(row.before, 6)}</OptimizerFlowText><OptimizerFlowText x={271} y={354} anchor="middle" color={c.input}>multiplier γ={f(row.rate)}</OptimizerFlowText>
    <OptimizerFlowWire from={[105, 366]} to={[112, 411]} marker={forward} /><OptimizerFlowWire from={[271, 366]} to={[239, 411]} marker={forward} />
    <OptimizerFlowWire from={[77, 292]} to={[175, 411]} bend={[[77, 307], [175, 307]]} marker={forward} />
    <OptimizerFlowWire from={[133, 31]} to={[45, 429]} bend={[[12, 31], [12, 429]]} marker={forward} /><OptimizerFlowText x={22} y={399} color={c.computed}>d now</OptimizerFlowText>
    <rect x={45} y={411} width={260} height={65} rx={5} fill="none" stroke={c.operator} /><OptimizerFlowText x={175} y={438} anchor="middle">θ − γd·m/(√v+dε)</OptimizerFlowText><OptimizerFlowText x={175} y={463} anchor="middle">current d, not next d</OptimizerFlowText>
    <OptimizerFlowWire from={[175, 476]} to={[175, 507]} marker={forward} /><OptimizerFlowText x={175} y={538} anchor="middle" color={c.parameter}>next θ={f(row.after, 6)}</OptimizerFlowText>
    <OptimizerFlowWire from={[265, 292]} to={[214, 586]} bend={[[337, 292], [337, 586]]} marker={forward} /><OptimizerFlowText x={175} y={614} anchor="middle" color={c.computed}>retain next d for a later step</OptimizerFlowText>
    <OptimizerFlowText x={175} y={655} anchor="middle">separate operands and future storage</OptimizerFlowText><OptimizerFlowText x={175} y={691} anchor="middle">the target is absent from both histories</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function ScheduleFreePointsDrawing({
  row = scheduleFreeTrace(2, 0, [1, -1, .5, -.5], .9, .2)[2],
  beta = .9,
  rate = .2
}) {
  return <><OptimizerSignedRulers label="Three locations have different jobs" description={`Old average x ${row.oldAverage}, fast z ${row.oldFast}, interpolation y ${row.training}. Gradient ${row.gradient} is read at y, applied at z; new z ${row.fast} enters average x ${row.average}.`} rows={[{
      name: `before update ${row.step}`,
      points: [{
        name: 'average x',
        value: row.oldAverage,
        role: 'parameter'
      }, {
        name: 'fast z',
        value: row.oldFast,
        role: 'parameter'
      }, {
        name: 'read y',
        value: row.training,
        role: 'computed'
      }]
    }, {
      name: 'after the same update',
      points: [{
        name: 'average x',
        value: row.average,
        role: 'parameter'
      }, {
        name: 'fast z',
        value: row.fast,
        role: 'parameter'
      }, {
        name: 'next y',
        value: row.nextTraining,
        role: 'computed'
      }]
    }]} />
    <OptimizerFlowDrawing label="Interpolate, read the gradient, update the fast point, then average" description={`Beta ${beta}, eta ${rate}. Interpolation uses old x, z. True gradient plus declared perturbation is read at y. Subtract eta gradient from old z. New z enters old x with coefficient ${row.coefficient}.`} height={508}>{({
        forward,
        derivative
      }) => <>
      <OptimizerFlowText x={83} y={18} anchor="middle" color={c.parameter}>old x={f(row.oldAverage)}</OptimizerFlowText><OptimizerFlowText x={271} y={18} anchor="middle" color={c.parameter}>old z={f(row.oldFast)}</OptimizerFlowText><OptimizerFlowWire from={[83, 32]} to={[156, 80]} marker={forward} /><OptimizerFlowWire from={[271, 32]} to={[194, 80]} marker={forward} /><OptimizerFlowText x={175} y={108} anchor="middle">βx + (1−β)z</OptimizerFlowText><OptimizerFlowText x={175} y={139} anchor="middle" color={c.computed}>read at y={f(row.training, 6)}</OptimizerFlowText>
      <OptimizerFlowWire from={[175, 152]} to={[175, 185]} marker={derivative} derivative /><OptimizerFlowText x={175} y={213} anchor="middle" color={c.derivative}>g(y) + perturbation={f(row.gradient, 6)}</OptimizerFlowText><OptimizerFlowWire from={[175, 227]} to={[175, 261]} marker={forward} /><OptimizerFlowWire from={[271, 32]} to={[300, 282]} bend={[[334, 32], [334, 282]]} marker={forward} /><OptimizerFlowText x={175} y={288} anchor="middle">new z = old z − ηg</OptimizerFlowText><OptimizerFlowText x={175} y={318} anchor="middle" color={c.parameter}>{f(row.fast, 6)}</OptimizerFlowText><OptimizerFlowWire from={[175, 332]} to={[175, 369]} marker={forward} /><OptimizerFlowWire from={[83, 32]} to={[55, 394]} bend={[[15, 32], [15, 394]]} marker={forward} /><OptimizerFlowText x={175} y={395} anchor="middle">new x = old x + c(new z−old x)</OptimizerFlowText><OptimizerFlowText x={175} y={429} anchor="middle" color={c.parameter}>{f(row.average, 6)}; c=1/{row.step}</OptimizerFlowText><OptimizerFlowText x={175} y={491} anchor="middle">evaluation reads x, next gradient reads y</OptimizerFlowText>
    </>}</OptimizerFlowDrawing></>;
}
export function ScheduleFreeHistoryDrawing({
  rates = [.1, .2, .3]
}) {
  const squares = rates.map(value => value ** 2),
    total = squares.reduce((a, b) => a + b, 0),
    max = Math.max(...squares, 1e-12);
  return <OptimizerFlowDrawing label="Final averaging weights differ from each insertion coefficient" description={`Rates ${rates}, squared weights ${squares}. Final normalized weights ${squares.map(value => total > 0 ? value / total : 0)}. Running insertion divides each current square by sum so far. If all rates are zero, no normalized new point weight exists.`} height={155 + rates.length * 107}>{({
      forward
    }) => <>
    {rates.map((rate, i) => <g key={i}><OptimizerFlowText x={15} y={18 + i * 107}>step {i + 1}; η={f(rate)}</OptimizerFlowText><rect x={15} y={35 + i * 107} width={295 * squares[i] / max} height={16} fill={c.computed} /><OptimizerFlowText x={15} y={75 + i * 107}>η²={f(squares[i])}; final {total > 0 ? f(squares[i] / total, 6) : 'undefined'}</OptimizerFlowText><OptimizerFlowText x={15} y={99 + i * 107}>insertion {squares.slice(0, i + 1).reduce((a, b) => a + b, 0) > 0 ? f(squares[i] / squares.slice(0, i + 1).reduce((a, b) => a + b, 0), 6) : 'no update'}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={rates.length * 107 + 24}>all final weights share total Ση²={f(total)}</OptimizerFlowText><OptimizerFlowText x={15} y={rates.length * 107 + 60}>equal-rate SGD instead averages new z equally</OptimizerFlowText><OptimizerFlowText x={15} y={rates.length * 107 + 96}>post-update points; no first-moment EMA</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function ScheduleFreeStorageDrawing() {
  return <OptimizerFlowDrawing label="A compact parameter buffer changes representation while fast state persists" description="Literal separate arrays x, y, z and second moment v explain mathematical locations. Efficient storage holds one main parameter buffer and additional z, v. Optimizer eval maps y, z to x; train maps x, z to y. Beta zero breaks the y to x division, unlike direct mathematical recurrence." height={438}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>literal reference arrays</OptimizerFlowText>{['current y', 'average x', 'fast z', 'moment v'].map((name, i) => <OptimizerFlowCell key={name} x={15 + i % 2 * 175} y={37 + Math.floor(i / 2) * 45} width={135} value={name} role={i < 3 ? 'parameter' : 'computed'} />)}
    <OptimizerFlowText x={15} y={169}>compact main buffer + two extra arrays</OptimizerFlowText><OptimizerFlowCell x={15} y={188} width={136} value="main: y or x" role="parameter" /><OptimizerFlowCell x={192} y={188} width={58} value="z" role="parameter" /><OptimizerFlowCell x={269} y={188} width={58} value="v" />
    <OptimizerFlowText x={15} y={260}>optimizer.eval(): x=(y−(1−β)z)/β</OptimizerFlowText><OptimizerFlowText x={15} y={302}>optimizer.train(): y=βx+(1−β)z</OptimizerFlowText><OptimizerFlowText x={15} y={344}>model.eval() changes layers, not this buffer</OptimizerFlowText><OptimizerFlowText x={15} y={386}>compact mode inversion needs β≠0</OptimizerFlowText><OptimizerFlowText x={15} y={427}>z and v retain their separate identities</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function ScheduleFreeAdamDrawing() {
  const gradient = 2,
    second = .001 * gradient ** 2,
    corrected = second / .001,
    scaled = gradient / (Math.sqrt(corrected) + 1e-8),
    next = 2 - .1 * scaled;
  return <OptimizerFlowDrawing label="Schedule-Free Adam scales the gradient with a second moment before moving z" description={`One constructed first update has x=y=z=2, target 0, no perturbation, rate 0.1, beta2 0.999, epsilon 1e-8, no decay. Gradient 2, second moment 0.004, corrected 4, normalized direction ${scaled}, new fast ${next}; first average equals new fast.`} height={499}>{({
      forward,
      derivative
    }) => <>
    <OptimizerFlowText x={15} y={18} color={c.parameter}>same initial x=y=z=2; target 0</OptimizerFlowText><OptimizerFlowText x={175} y={56} anchor="middle" color={c.derivative}>gradient at y: g=2</OptimizerFlowText><OptimizerFlowWire from={[145, 68]} to={[81, 111]} marker={forward} /><OptimizerFlowWire from={[205, 68]} to={[277, 280]} bend={[[330, 68], [330, 280]]} marker={forward} /><OptimizerFlowText x={81} y={140} anchor="middle">square g²=4</OptimizerFlowText><OptimizerFlowText x={81} y={173} anchor="middle">v=.999×0+.001×4</OptimizerFlowText><OptimizerFlowText x={81} y={208} anchor="middle" color={c.computed}>v=.004</OptimizerFlowText><OptimizerFlowText x={81} y={242} anchor="middle">v̂=v/(1−.999)=4</OptimizerFlowText><OptimizerFlowWire from={[81, 255]} to={[175, 280]} marker={forward} /><OptimizerFlowText x={175} y={307} anchor="middle">g/(√v̂+ε) ≈ 1</OptimizerFlowText><OptimizerFlowWire from={[175, 320]} to={[175, 349]} marker={forward} /><OptimizerFlowText x={175} y={377} anchor="middle">new z = 2 − .1×direction</OptimizerFlowText><OptimizerFlowText x={175} y={414} anchor="middle" color={c.parameter}>{f(next, 8)}</OptimizerFlowText><OptimizerFlowText x={175} y={452} anchor="middle">first c=1: new x=new z</OptimizerFlowText><OptimizerFlowText x={175} y={489} anchor="middle">second moment; no ordinary first-moment EMA</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function ScheduleFreeConvexDrawing() {
  const x = value => 175 + 125 * value,
    y = value => 270 - 360 * .5 * value ** 2;
  return <OptimizerFlowDrawing label="A convex graph lies below a chord between parameter points" description="Constructed objective f(theta)=theta squared over 2 on minus 1 to 1. Post-update points minus 1 and 1 have objective 0.5; equal average 0 has objective 0 below average objective 0.5. This diagram illustrates convexity, not convergence of an arbitrary neural loss." height={382}>
    <OptimizerFlowText x={15} y={18}>constructed f(θ)=½θ² on [−1,1]</OptimizerFlowText><line x1={50} x2={300} y1={270} y2={270} stroke={c.operator} /><line x1={175} x2={175} y1={65} y2={290} stroke={c.operator} />
    <polyline points={Array.from({
      length: 41
    }, (_, i) => {
      const value = -1 + i / 20;
      return `${x(value)},${y(value)}`;
    }).join(' ')} fill="none" stroke={c.computed} /><line x1={50} x2={300} y1={90} y2={90} stroke={c.operator} strokeDasharray="5 4" />
    {[-1, 0, 1].map(value => <g key={value}><circle cx={x(value)} cy={y(value)} r={5} fill={value === 0 ? c.parameter : c.computed} /><OptimizerFlowText x={x(value)} y={310} anchor="middle">{value === 0 ? 'average 0' : `point ${value}`}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={175} y={69} anchor="middle">mean of endpoint losses = .5</OptimizerFlowText><OptimizerFlowText x={175} y={341} anchor="middle">loss of average = 0 ≤ .5</OptimizerFlowText><OptimizerFlowText x={175} y={368} anchor="middle">a convexity picture; theorem needs more</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function OptimizerWorkDrawing() {
  return <OptimizerFlowDrawing label="Total constructed time multiplies updates by time per update" description="Arithmetic example A: 600 updates times 1.1 units=660; B: 1000 updates times 1 unit=1000. Equal time axis 0 to 1000. Not an actual optimizer timing or GPU benchmark." height={294}>
    <OptimizerFlowText x={15} y={18}>declared time units; no benchmark</OptimizerFlowText>
    {[[600, 1.1], [1000, 1]].map(([steps, cost], i) => <g key={i}><OptimizerFlowText x={15} y={60 + i * 94}>case {i + 1}: {steps} updates × {cost}</OptimizerFlowText><rect x={15} y={76 + i * 94} width={320 * steps * cost / 1000} height={17} fill={c.computed} /><OptimizerFlowText x={15} y={117 + i * 94}>total {steps * cost} time units</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={257}>both bars: zero to 1000 time units</OptimizerFlowText><OptimizerFlowText x={15} y={290}>total ratio 1000/660 ≈ 1.515</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function OptimizerMemoryDrawing({
  allocations,
  ranks,
  global = false
}) {
  if (global) allocations = allocations.map(row => ({
    ...row,
    local: row.total,
    sharded: false
  }));
  const total = allocations.reduce((sum, row) => sum + row.local, 0),
    roles = ['parameter', 'derivative', 'computed'];
  return <OptimizerFlowDrawing label="Each tensor payload retains its global and per-rank ownership" description={`Global/local allocations ${allocations.map(row => `${row.name}:${row.total}/${row.local}`).join(';')}. Listed per-rank total ${total} bytes. Ranks ${ranks}; only marked sharded arrays divide by rank count. Activation/workspace/master weights not specified.`} height={391}>
    <OptimizerFlowText x={15} y={18}>{global ? 'three global tensor payloads' : 'listed payload on one rank'}</OptimizerFlowText>
    {allocations.map((row, i) => {
      const start = allocations.slice(0, i).reduce((a, b) => a + b.local, 0);
      return <rect key={row.name} x={15 + 320 * start / total} y={40} width={320 * row.local / total} height={37} fill={c[roles[i]]} />;
    })}
    {allocations.map((row, i) => <g key={row.name}><rect x={15} y={106 + i * 73} width={10} height={10} fill={c[roles[i]]} /><OptimizerFlowText x={34} y={115 + i * 73}>{row.name}: {f(row.local / 1e9, 3)} GB</OptimizerFlowText><OptimizerFlowText x={34} y={142 + i * 73}>{global ? 'all listed parameters' : row.sharded ? `global ÷ ${ranks} ranks` : 'replicated in full'}</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={352}>listed sum {f(total / 1e9, 3)} GB; {f(total / 2 ** 30, 3)} GiB</OptimizerFlowText><OptimizerFlowText x={15} y={377}>payload only; peak needs more allocations</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function OptimizerFactorDrawing() {
  const values = [[1, 3], [5, 7]],
    rows = values.map(row => row.reduce((a, b) => a + b, 0) / 2),
    columns = [0, 1].map(j => (values[0][j] + values[1][j]) / 2),
    mean = 4,
    approximate = rows.map(r => columns.map(col => r * col / mean));
  return <OptimizerFlowDrawing label="Row and column means reconstruct marginals but lose individual entries" description="Second moment matrix 1, 3; 5, 7 has row means 2, 6, column means 3, 5, global mean 4. Outer product divided by 4 gives 1.5, 2.5; 4.5, 7.5; marginals survive, entries change. This is only the factorization branch, not full Adafactor." height={425}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>original second moment V</OptimizerFlowText>
    {values.map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={15 + j * 72} y={40 + i * 42} value={value} />))}
    <OptimizerFlowText x={192} y={66}>row means [2,6]</OptimizerFlowText><OptimizerFlowText x={15} y={153}>column means [3,5]; global mean 4</OptimizerFlowText><OptimizerFlowWire from={[175, 165]} to={[175, 196]} marker={forward} /><OptimizerFlowText x={175} y={224} anchor="middle">Ṽᵢⱼ = rowᵢ × columnⱼ / mean</OptimizerFlowText>
    {approximate.map((row, i) => row.map((value, j) => <OptimizerFlowCell key={`${i}-${j}`} x={101 + j * 82} y={249 + i * 42} width={69} value={value} />))}
    <OptimizerFlowText x={15} y={361}>same row/column means; different cells</OptimizerFlowText><OptimizerFlowText x={15} y={402}>rank-one estimate replaces dense detail</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
export function OptimizerFactorShapeDrawing({
  rows,
  columns
}) {
  const longest = Math.max(rows, columns),
    width = 230 * columns / longest,
    height = 230 * rows / longest;
  // Geometry preserves the matrix aspect ratio. Visible separators sample the
  // complete dimensions; they are not one displayed cell per saved entry.
  return <OptimizerFlowDrawing label="A dense matrix needs one entry per row-column pair; factors need two vectors" description={`Dense shape ${rows} by ${columns};${rows * columns} entries. Row factor ${rows}, column factor ${columns};${rows + columns} entries. Matrix aspect ratio is literal, separators schematic at most eight per axis. Actual matrix dimensions and counts are directly labelled.`} height={430}>
    <OptimizerFlowText x={15} y={18}>dense: n×m={rows * columns} entries</OptimizerFlowText><OptimizerFlowText x={15} y={46}>n={rows} rows; m={columns} columns</OptimizerFlowText>
    <rect x={55} y={69} width={Math.max(.1, width)} height={Math.max(.1, height)} fill="none" stroke={c.computed} />
    {Array.from({
      length: Math.min(rows, 8) - 1
    }, (_, i) => <line key={`r${i}`} x1={55} x2={55 + width} y1={69 + height * (i + 1) / Math.min(rows, 8)} y2={69 + height * (i + 1) / Math.min(rows, 8)} stroke={c.computed} opacity={.5} />)}
    {Array.from({
      length: Math.min(columns, 8) - 1
    }, (_, i) => <line key={`c${i}`} x1={55 + width * (i + 1) / Math.min(columns, 8)} x2={55 + width * (i + 1) / Math.min(columns, 8)} y1={69} y2={69 + height} stroke={c.computed} opacity={.5} />)}
    <rect x={310} y={69} width={10} height={Math.max(.1, height)} fill="none" stroke={c.computed} /><rect x={55} y={316} width={Math.max(.1, width)} height={10} fill="none" stroke={c.computed} />
    <OptimizerFlowText x={15} y={362} color={c.computed}>vectors: n + m = {rows + columns} entries</OptimizerFlowText><OptimizerFlowText x={15} y={393}>violet statistics; row/column factor shapes</OptimizerFlowText><OptimizerFlowText x={15} y={421}>aspect ratio exact; separators schematic</OptimizerFlowText>
  </OptimizerFlowDrawing>;
}
export function MuonPolarDrawing() {
  const matrices = [{
    name: 'entrywise sign(M)',
    matrix: [[1, 1], [1, 1]],
    points: [[1, 1], [1, -1]],
    outputs: [[2, 2], [0, 0]]
  }, {
    name: 'ideal polar U Vᵀ',
    matrix: [[1, 0], [0, 1]],
    points: [[1, 1], [1, -1]],
    outputs: [[1, 1], [1, -1]]
  }];
  return <OptimizerFlowDrawing label="Entrywise signs can destroy a matrix direction that its polar factor preserves" description="Matrix M: 2, 1; 1, 2 has singular vectors proportional to 1, 1 and 1, minus 1, singular values 3 and 1. Ideal polar is identity. Entrywise sign gives all ones, mapping difference vector to zero. Exact SVD polar does not claim parity with finite Newton–Schulz Muon." height={710}>{({
      forward
    }) => <>
    <OptimizerFlowText x={15} y={18}>M=[[2,1],[1,2]]</OptimizerFlowText><OptimizerFlowText x={15} y={49}>singular values 3 and 1</OptimizerFlowText><OptimizerFlowText x={15} y={79}>directions [1,1] and [1,−1]</OptimizerFlowText>
    {matrices.map((entry, i) => <g key={entry.name}><OptimizerFlowText x={15} y={124 + i * 277}>{entry.name}</OptimizerFlowText>{entry.matrix.map((row, r) => row.map((value, j) => <OptimizerFlowCell key={`${r}-${j}`} x={15 + j * 64} y={143 + i * 277 + r * 36} width={52} value={value} />))}{entry.points.map((point, j) => <g key={j}><OptimizerFlowText x={175} y={165 + i * 277 + j * 53} color={c.input}>{optimizerVector(point)}</OptimizerFlowText><OptimizerFlowWire from={[222, 175 + i * 277 + j * 53]} to={[261, 175 + i * 277 + j * 53]} marker={forward} /><OptimizerFlowText x={269} y={188 + i * 277 + j * 53} color={c.computed}>{optimizerVector(entry.outputs[j])}</OptimizerFlowText></g>)}<line x1={85} x2={285} y1={328 + i * 277} y2={328 + i * 277} stroke={c.operator} /><line x1={185} x2={185} y1={248 + i * 277} y2={386 + i * 277} stroke={c.operator} />{entry.outputs.map((point, j) => <g key={j}><OptimizerFlowWire from={[185, 328 + i * 277]} to={[185 + point[0] * 36, 328 + i * 277 - point[1] * 36]} marker={forward} /><circle cx={185 + point[0] * 36} cy={328 + i * 277 - point[1] * 36} r={j ? 5 : 3} stroke={c.computed} fill="none" /></g>)}<OptimizerFlowText x={287} y={344 + i * 277}>axis 1</OptimizerFlowText><OptimizerFlowText x={195} y={253 + i * 277}>axis 2</OptimizerFlowText></g>)}
    <OptimizerFlowText x={15} y={695}>ideal geometry; finite library iteration differs</OptimizerFlowText>
  </>}</OptimizerFlowDrawing>;
}
