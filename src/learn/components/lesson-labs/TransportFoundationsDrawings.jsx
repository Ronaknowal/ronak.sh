import { Figure, Geometry, Dot, Law, LawPair, Plan, Matrix, Ledger, Values, Plot, sourceColours, targetColours, fmt } from './TransportDrawingPrimitives.jsx';
import { CdfDrawing } from './TransportLiveInvestigations.jsx';
import { orderedTransport } from '../../data/optimal-transport-models.js';
const half = [.5, .5],
  diagonal = [[.5, 0], [0, .5]],
  product = [[.25, .25], [.25, .25]];
const F = ({
  n,
  label,
  children,
  caption
}) => <Figure id={'OT' + String(n).padStart(2, '0')} label={label} caption={caption}>{children}</Figure>;
const line = (fn, a, b, N = 60) => Array.from({
  length: N + 1
}, (_, i) => {
  const x = a + (b - a) * i / N;
  return [x, fn(x)];
});
export function WeightedLaw() {
  return <F n={1} label="A weighted point law and its zero-mass boundary"><Law locations={[0, 2]} weights={half} domain={[0, 2]} label="α = ½δ0 + ½δ2" /><Law locations={[0, 2]} weights={[1, 0]} domain={[0, 2]} label="Changed weights: α = δ0 (A1 is empty)" /><p className="ot-key">Disk area ∝ probability mass; total probability = 1 in both laws.</p></F>;
}
export function MatchedLaws() {
  return <F n={2} label="Four atoms on equal-unit location axes"><LawPair /><Values items={[[`Source support`, 'A0 = 0, A1 = 2'], ['Target support', 'B0 = 0, B1 = 1'], ['Each law’s total', 1]]} /></F>;
}
export function Shipment() {
  return <F n={3} label="Half a unit of mass moves one location unit"><Geometry label="Shipment from location 2 to location 1" height={150}><line x1="30" x2="270" y1="102" y2="102" stroke="#888" />{[0, 1, 2].map(v => <g key={v}><text x={30 + v * 120} y="125" textAnchor="middle">{v}</text><line x1={30 + v * 120} x2={30 + v * 120} y1="99" y2="108" stroke="#888" /></g>)}<path d="M260 58H160l12 -7m-12 7 12 7" stroke={sourceColours[1]} strokeWidth="6" fill="none" /><Dot x={270} y={58} mass={.5} colour={sourceColours[1]} /><Dot x={150} y={58} mass={.5} target colour={targetColours[1]} /><text x="270" y="28" textAnchor="middle">A1</text><text x="150" y="28" textAnchor="middle">B1</text><text x="210" y="87" textAnchor="middle">length 1</text></Geometry><Values items={[[`Mass`, .5], ['Cost per unit', 1], ['Work = ½ × 1', .5], ['Changed destination 0: ½ × 2', 1]]} /></F>;
}
export function SplitVersusMap() {
  return <F n={4} label="A single atom must split to form the target law"><LawPair x={[0]} a={[1]} y={[-1, 1]} b={half} domain={[-1, 1]} /><Plan plan={[[.5, .5]]} a={[1]} b={half} max={1} /><Values items={[[`Required split`, 'T00 = ½; T01 = ½'], ['Squared cost', 1], ['A deterministic T(0)', 'has only one value']]} /></F>;
}
export function JointAndMargins() {
  return <F n={5} label="A coupling is a joint law whose projections recover both marginals"><Matrix values={[[.4, .1], [.1, .4]]} max={.5} requiredRows={half} requiredCols={half} /><div className="ot-operation"><span>Sum each row → source probabilities (.5, .5)</span><b aria-hidden="true">↔</b><span>Sum each column → target probabilities (.5, .5)</span></div><Values items={[[`Joint total`, 1], ['Any entry', 'probability of both its source and target']]} /></F>;
}
export function IndependentVersusCheap() {
  return <F n={6} label="Two different couplings with identical marginals"><div className="ot-pair"><Matrix values={product} max={.5} label="Independent product: cost 1" requiredRows={half} requiredCols={half} /><Matrix values={diagonal} max={.5} label="Diagonal: cost ½" requiredRows={half} requiredCols={half} /></div><p className="ot-key">Both totals are 1. The same row/column projections leave the pairing undetermined.</p></F>;
}
export function CompleteLedger() {
  return <F n={7} label="All four routes and their cost contributions"><Plan plan={diagonal} a={half} b={half} selected={3} max={.5} /><Ledger label="Whole movement ledger" headers={['route', 'mass', 'unit cost', 'work']} rows={[[`A0 → B0`, .5, 0, 0], [`A0 → B1`, 0, 1, 0], [`A1 → B0`, 0, 2, 0], [`A1 → B1`, .5, 1, .5]]} /></F>;
}
export function FeasibleInterval() {
  return <F n={8} label="Four nonnegative cells impose a single feasible interval"><div className="ot-pair"><Ledger label="Entries determined by t" headers={['cell', 'expression', 'nonnegative when']} rows={[[`P00`, 't', 't ≥ 0'], ['P01', 'a0 − t', 't ≤ a0'], ['P10', 'b0 − t', 't ≤ b0'], ['P11', '1 − a0 − b0 + t', 't ≥ a0 + b0 − 1']]} /><Geometry label="Half-weight feasible interval from zero to one-half" height={165}><line x1="30" x2="270" y1="75" y2="75" stroke="#777" /><line x1="30" x2="270" y1="75" y2="75" stroke={sourceColours[0]} strokeWidth="6" /><circle cx="30" cy="75" r="5" fill="#fff" /><circle cx="270" cy="75" r="5" fill="#fff" /><text x="30" y="107" textAnchor="middle">0</text><text x="270" y="107" textAnchor="middle">½</text><text x="150" y="50" textAnchor="middle">every feasible t</text><text x="150" y="135" textAnchor="middle">½ weights → interval [0, ½]</text></Geometry></div><Values items={[[`General lower bound`, 'max(0, a0 + b0 − 1)'], ['General upper bound', 'min(a0, b0)'], ['a0 = .6, b0 = .3', '[0, .3]']]} /></F>;
}
export function LinearCost() {
  return <F n={10} label="Three cost rules yield decreasing, flat and increasing objectives"><Plot domain={[0, .5]} range={[0, 2]} xLabel="feasible t" yLabel="Linear transport cost" curves={[{
      label: 'distance: 1.5 − 2t',
      points: [[0, 1.5], [.5, .5]],
      colour: sourceColours[0]
    }, {
      label: 'indifferent: 1',
      points: [[0, 1], [.5, 1]],
      colour: sourceColours[1],
      dashed: true
    }, {
      label: 'changed: 4t',
      points: [[0, 0], [.5, 2]],
      colour: targetColours[0]
    }]} points={[{
      x: .5,
      y: .5
    }, {
      x: 0,
      y: 0
    }]} /><Ledger label="Declared cost matrices" headers={['rule', 'C00,C01', 'C10,C11', 'minimizing t']} rows={[[`distance`, '0, 1', '2, 1', '.5'], ['indifferent', '0, 1', '1, 2', 'every t'], ['changed', '2, 0', '0, 2', '0']]} /></F>;
}
export function SlackCertificate() {
  return <F n={12} label="Nonnegative weighted slacks prove the lower bound"><div className="ot-pair"><Matrix values={[[0, 1], [1, 0]]} label="Feasible certificate slacks" kind="slack" /><Matrix values={[[0, 0], [0, 0]]} label="Mass × slack for diagonal P" kind="weighted slack" max={.5} /></div><div className="ot-operation"><span>Σ Pij (Cij − fi − gj)</span><b>=</b><span>cost − a·f − b·g = 0</span></div><Ledger label="A certificate must be feasible in every cell" headers={['prices', 'lowest slack', 'lower-bound claim']} rows={[[`f=(0,1), g=(0,0)`, 0, 'valid: bound .5'], ['f=(0,2), g=(0,0)', -1, 'invalid: A1 → B1 overprices by 1']]} /></F>;
}
export function PowerAndRoot() {
  return <F n={13} label="Unit mass travels from zero to two; power and root differ"><LawPair x={[0]} y={[2]} a={[1]} b={[1]} domain={[0, 2]} /><div className="ot-operation"><span>|2 − 0| = 2 → W1 = 2</span><span>|2 − 0|² = 4 → W2² = 4</span><span>√4 = 2 → W2 = 2</span></div><p className="ot-key">W1 and W2 use location units. W2² uses squared location units.</p></F>;
}
export function LipschitzWitness() {
  return <F n={14} label="A one-Lipschitz witness separates the two laws"><Plot domain={[0, 2]} range={[0, 4]} xLabel="location z" yLabel="Witness value" curves={[{
      label: 'valid φ(z) = z, slope 1',
      points: [[0, 0], [2, 2]],
      colour: sourceColours[0]
    }, {
      label: 'invalid φ(z) = 2z, slope 2',
      points: [[0, 0], [2, 4]],
      colour: targetColours[0],
      dashed: true
    }]} /><Values items={[[`Eα[φ]`, 1], ['Eβ[φ]', .5], ['Valid lower bound', .5], ['Oversteep witness', 'violates |φ(x) − φ(y)| ≤ |x − y|']]} /></F>;
}
export function Gluing() {
  return <F n={15} label="Two joint laws glue through a common intermediate marginal"><Geometry label="A unit packet travels 0 to 1 to 3" height={145}><line x1="30" x2="270" y1="85" y2="85" stroke="#777" />{[[0, 30], [1, 110], [3, 270]].map(([v, x], i) => <g key={v}><Dot x={x} y={60} mass={1} colour={sourceColours[i]} /><text x={x} y="107" textAnchor="middle">{v}</text></g>)}<path d="M52 60H87M133 60H247" stroke="#eee" strokeWidth="2" /><text x="70" y="30" textAnchor="middle">1</text><text x="190" y="30" textAnchor="middle">2</text></Geometry><div className="ot-operation"><span>Conditional first leg Pij / bj</span><b>×</b><span>second leg Ujk</span><b>→</b><span>joint Rijk = Pij Ujk / bj</span></div><Values items={[[`Direct distance`, 3], ['Sum of leg distances', '1 + 2 = 3'], ['bj = 0', 'both incident marginals are empty; contribute 0']]} /></F>;
}
export function Uncrossing() {
  return <F n={16} label="Uncrossing ordered matches reduces the distance cost"><div className="ot-pair"><Plan plan={[[0, .5], [.5, 0]]} max={.5} label="Crossed: cost 1.5" /><Plan plan={diagonal} max={.5} label="Ordered: cost .5" /></div><Ledger label="Route cost exchange on ordered locations" headers={['plan', 'two distances', 'half-weight cost']} rows={[[`crossed`, '|0−1| + |2−0| = 3', 1.5], ['ordered', '|0−0| + |2−1| = 1', .5]]} /></F>;
}
export function WeightedCdf() {
  return <F n={17} label="Weighted CDF gaps account for every unit of one-dimensional work"><CdfDrawing x={[0, 3]} a={[.4, .6]} y={[1, 2, 5]} b={[.2, .5, .3]} /><Values items={[[`W1 = .4 + .2 + .3 + .6`, 1.5]]} /></F>;
}
export function WeightedQuantiles() {
  const cuts = [0, .2, .4, .7, 1],
    A = [0, 0, 3, 3],
    B = [1, 2, 2, 5];
  return <F n={19} label="A common probability axis aligns weighted quantile intervals"><Plot domain={[0, 1]} xTicks={cuts} yTicks={[0, 1, 2, 3, 4, 5]} range={[0, 5]} xLabel="probability u" yLabel="Quantile location" curves={[{
      label: 'Qα',
      points: A.flatMap((v, i) => [[cuts[i], v], [cuts[i + 1], v]]),
      colour: sourceColours[0]
    }, {
      label: 'Qβ',
      points: B.flatMap((v, i) => [[cuts[i], v], [cuts[i + 1], v]]),
      colour: targetColours[0],
      dashed: true
    }]} areas={A.map((v, i) => ({
      x0: cuts[i],
      x1: cuts[i + 1],
      y0: v,
      y1: B[i]
    }))} /><Ledger label="Every shared probability interval" headers={['u', 'mass', 'Qα', 'Qβ', 'absolute contribution']} rows={A.map((v, i) => [`${cuts[i]}–${cuts[i + 1]}`, cuts[i + 1] - cuts[i], v, B[i], Math.abs(v - B[i]) * (cuts[i + 1] - cuts[i])])} /></F>;
}
export function Sweep() {
  const s = orderedTransport([0, 3], [.4, .6], [1, 2, 5], [.2, .5, .3]);
  return <F n={20} label="The ordered sweep exhausts at least one endpoint per shipment"><div className="ot-pair">{[{step:1,i:0,j:0,left:.4,right:.2,restA:.2,restB:0,next:'Only target pointer advances: B0 → B1.'},{step:2,i:0,j:1,left:.2,right:.5,restA:0,restB:.3,next:'Only source pointer advances: A0 → A1.'}].map(t=><div key={t.step}><p className="ot-object-label">Step {t.step}: current pointers A{t.i}, B{t.j}</p><Geometry label={`Remaining ${t.left} at A0, ${t.right} at B${t.j}; send .2`} height={205}><path d="M75 80H222l-9 -6m9 6-9 6" stroke={sourceColours[0]} strokeWidth="5.6" fill="none"/><Dot x={55} y={80} mass={t.left} selected/><Dot x={245} y={80} mass={t.right} target colour={targetColours[t.j]} selected/><text x="55" y="39" textAnchor="middle">A0: x=0</text><text x="245" y="39" textAnchor="middle">B{t.j}: y={t.j+1}</text><text x="150" y="64" textAnchor="middle">send .2</text><text x="55" y="127" textAnchor="middle">left {t.left}</text><text x="245" y="127" textAnchor="middle">left {t.right}</text><text x="150" y="163" textAnchor="middle">P0{t.j} ← min({t.left}, {t.right})</text><text x="150" y="193" textAnchor="middle">remainders: {t.restA}, {t.restB}</text></Geometry><p>{t.next}</p><Matrix values={t.step===1?[[.2,0,0],[0,0,0]]:[[.2,.2,0],[0,0,0]]} max={.6} selected={t.j} label="Emitted cells so far" /></div>)}</div><p className="ot-key">White outlines identify the two current pointers; the source hue continues along each emitted route. The complete final plan follows.</p><Plan plan={s.plan} a={[.4, .6]} b={[.2, .5, .3]} max={.6} selected={0} /><Ledger label="Four actual sparse shipments" headers={['step', 'route', 'packet', 'exhausted']} rows={[[1, '0 → 1', .2, 'target at 1'], [2, '0 → 2', .2, 'source at 0'], [3, '3 → 2', .3, 'target at 2'], [4, '3 → 5', .3, 'both final endpoints']]} /></F>;
}
export function SweepBoundaries() {
  return <F n={21} label="Duplicate positions, empty atoms and tiny positive residuals have different meanings"><div className="ot-pair"><Law locations={[0, 0, 2]} weights={[.25, .25, .5]} domain={[0, 2]} label="Two records at 0 combine to mass ½" /><Law locations={[0, 2]} weights={[.5, .5]} domain={[0, 2]} label="The same law after aggregation" names={['A0+A1', 'A2']} colours={[sourceColours[0], sourceColours[2]]} outlineColours={[sourceColours[1], null]} /></div><Ledger label="Boundary actions in the sparse sweep" headers={['record', 'action', 'reason']} rows={[[`mass = 0`, 'advance its pointer', 'there is no packet'], ['duplicate position', 'combine or keep exact records', 'law is unchanged'], ['residual = 5 × 10⁻¹⁶', 'ship its full positive value', 'no tolerance cutoff may delete it']]} /><p className="ot-note">Coincident markers occupy the same physical position; this is not a third location. The ledger resolves their separate input records.</p></F>;
}
export function PowerOnLine() {
  return <F n={22} label="The same ordered plan gives different powered costs"><Matrix values={[[.2, .2, 0], [0, .3, .3]]} max={.6} /><Ledger label="Exact contributions from the common quantile coupling" headers={['route', 'mass', 'distance', 'mass × d', 'mass × d²']} rows={[[`0 → 1`, .2, 1, .2, .2], ['0 → 2', .2, 2, .4, .8], ['3 → 2', .3, 1, .3, .3], ['3 → 5', .3, 2, .6, 1.2]]} /><Values items={[[`W1`, 1.5], ['W2²', 2.5], ['Multiply locations by 3', 'W1 × 3; W2² × 9']]} /></F>;
}
export function GaussianLine() {
  const normal = (m, s, x) => Math.exp(-.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  return <F n={23} label="A Gaussian affine map changes mean and standard deviation"><Plot domain={[-4, 13]} xTicks={[-4, 0, 4, 8, 13]} range={[0, .42]} xLabel="location" yLabel="Density" curves={[{
      label: 'N(0,1)',
      points: line(x => normal(0, 1, x), -4, 13, 110),
      colour: sourceColours[0]
    }, {
      label: 'N(4,9)',
      points: line(x => normal(4, 3, x), -4, 13, 110),
      colour: targetColours[0]
    }]} /><Geometry label="One common Z produces both X and Y; each column is one coupled sample" height={220}>{[-1,0,1].map((z,i)=><g key={z}><path d={`M${55+i*95} 42V165`} stroke="#888"/><circle cx={55+i*95} cy="45" r="4" fill="#eee"/><Dot x={55+i*95} y={100} scale={5} colour={sourceColours[0]}/><Dot x={55+i*95} y={164} scale={5} target colour={targetColours[0]}/><text x={55+i*95} y="25" textAnchor="middle">Z={z}</text><text x={55+i*95} y="84" textAnchor="middle">X={z}</text><text x={55+i*95} y="203" textAnchor="middle">Y={4+3*z}</text></g>)}</Geometry><p className="ot-key">Each column uses the same Z: X = Z and Y = 4 + 3Z. These three traced coordinates illustrate the coupling; they are not a three-point Gaussian approximation.</p><div className="ot-operation"><span>x → 4 + 3x</span><span>mean shift: (4 − 0)² = 16</span><span>spread change: (3 − 1)² = 4</span></div><Values items={[[`W2²`, 20], ['W2', Math.sqrt(20)]]} /></F>;
}
export function GaussianPlane() {
  return <F n={24} label="Two Gaussian standard-deviation ellipses on equal coordinate units"><Geometry label="Equal-unit x and y axes; ellipses are one-standard-deviation contours" height={280}><path d="M35 140H280M140 265V15" stroke="#777" />{[-2, -1, 0, 1, 2, 3, 4].map(v => <g key={v}><text x={140 + v * 35} y="157" textAnchor="middle">{v}</text>{v <= 3 && <text x="130" y={140 - v * 35 + 4} textAnchor="end">{v}</text>}</g>)}<ellipse cx="140" cy="140" rx="35" ry="70" fill="none" stroke={sourceColours[0]} strokeWidth="2" /><ellipse cx="210" cy="105" rx="70" ry="35" fill="none" stroke={targetColours[0]} strokeWidth="2" strokeDasharray="5 3" /><circle cx="140" cy="140" r="3" fill={sourceColours[0]} /><circle cx="210" cy="105" r="3" fill={targetColours[0]} /></Geometry><Ledger label="Mean and common-axis standard deviations" headers={['law', 'mean', 'SD x', 'SD y']} rows={[[`source`, '(0,0)', 1, 2], ['target', '(2,1)', 2, 1]]} /><Values items={[[`Squared mean shift`, 5], ['Squared spread changes', '1 + 1'], ['W2²', 7]]} /></F>;
}
export function ConvexPotential() {
  return <F n={25} label="The derivative of a convex potential gives the Gaussian map"><div className="ot-pair"><Plot domain={[-2, 2]} range={[-3, 15]} xLabel="x" yLabel="Potential φ(x)" curves={[{
        label: '4x + 1.5x²',
        points: line(x => 4 * x + 1.5 * x * x, -2, 2),
        colour: sourceColours[1]
      }, {label:'tangent at x=0: slope 4',points:[[-.5,-2],[.5,2]],colour:sourceColours[0],dashed:true}, {label:'tangent at x=1: slope 7',points:[[.5,2],[1.5,9]],colour:sourceColours[2],dashed:true}]} points={[{x:0,y:0,colour:sourceColours[0]},{x:1,y:5.5,colour:sourceColours[2]}]} /><Plot domain={[-2, 2]} range={[-2, 10]} xLabel="x" yLabel="Map T(x)" curves={[{
        label: 'φ′(x) = 4 + 3x',
        points: [[-2, -2], [2, 10]],
        colour: sourceColours[0]
      }]} points={[{x:0,y:4,colour:sourceColours[0]},{x:1,y:7,colour:sourceColours[2]}]} /></div><p className="ot-key">Trace the cyan point: at x=0 the potential is 0, its tangent rises 4 per unit, so T(0)=4. At the amber point x=1, φ(1)=5.5 and the tangent rises 7 per unit, so T(1)=7. The same point colour links each tangent slope to its map output.</p><Values items={[[`φ″`, 3], ['This map', 'monotone, induced by a convex potential'], ['General Brenier result', 'quadratic cost; absolutely continuous source; finite second moments']]} /></F>;
}
export function ConditionalRows() {
  return <F n={26} label="Normalize each coupling row to obtain a conditional law"><Plan plan={[[.25, .25, 0], [0, .25, .25]]} a={half} b={[.25, .5, .25]} max={.5} /><div className="ot-pair"><Matrix values={[[.5, .5, 0], [0, .5, .5]]} max={1} label="Conditional weights Pij / ai" kind="conditional" /><Law locations={[-1, 1, 3]} weights={[.25, .5, .25]} domain={[-1, 3]} label="Target locations used by each conditional mean" target /></div><Values items={[[`Row A0 mean`, 0], ['Row A1 mean', 2], ['Zero source row', 'conditional mean undefined; omit its zero contribution']]} /></F>;
}
export function VarianceLost() {
  return <F n={27} label="Conditional means collapse within-row variability"><Law locations={[-1, 1, 3]} weights={[.25, .5, .25]} domain={[-1, 3]} label="Original target: mean 1, variance 2" target /><Law locations={[0, 2]} weights={half} domain={[-1, 3]} label="Conditional-mean image: mean 1, variance 1" /><div className="ot-operation"><span>Var(Y) = 2</span><b>=</b><span>Var(E[Y|X]) = 1</span><b>+</b><span>E[Var(Y|X)] = 1</span></div></F>;
}
export function DisplacementContrast() {
  return <F n={28} label="Moving a particle differs from mixing endpoint laws"><Law locations={[1]} weights={[1]} domain={[0, 2]} label="Halfway displacement: δ1" /><Law locations={[0, 2]} weights={half} domain={[0, 2]} label="Halfway mixture: ½δ0 + ½δ2" /><Values items={[[`Both means`, 1], ['Displacement variance', 0], ['Mixture variance', 1]]} /></F>;
}
export function DisplacementPath() {
  return <F n={29} label="A constant-speed five-frame displacement path"><div className="ot-step-grid">{[0, .25, .5, .75, 1].map(t => <Law key={t} locations={[2 * t]} weights={[1]} domain={[0, 2]} label={`t = ${t}; location = ${2 * t}`} />)}</div><p className="ot-key">Each successive quarter-time frame moves 0.5 location units; speed stays 2.</p></F>;
}
export function ContinuityPath() {
  return <F n={30} label="Conserved moving mass and the kinetic action"><Geometry label="A unit atom follows x(t)=2t through a space-time plane" height={215}><path d="M42 173H275M42 173V25" fill="none" stroke="#888" /><path d="M42 173L262 33" stroke={sourceColours[0]} strokeWidth="3" />{[0, .25, .5, .75, 1].map(t => <circle key={t} cx={42 + 220 * t} cy={173 - 140 * t} r="4" fill={sourceColours[0]} />)}<text x="40" y="194">0</text><text x="260" y="194">1</text><text x="22" y="38">2</text><text x="145" y="211">time t</text><text x="50" y="20">location x</text></Geometry><p className="ot-object-label">A smooth translated density makes local flux visible</p><Plot domain={[-3,3]} range={[0,.45]} xTicks={[-3,-1,0,1,3]} xLabel="location x at t=0" yLabel="ρ₀(x): standard normal density" curves={[{label:'smooth density',points:line(x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),-3,3),colour:sourceColours[0]}]} areas={[{x0:0,x1:1,y0:0,y1:.45}]} /><Geometry label="Fixed interval [0,1]: incoming flux exceeds outgoing flux" height={160}><path d="M85 35V100M215 35V100" stroke="#aaa"/><path d="M25 65H115l-10 -7m10 7-10 7" stroke={sourceColours[0]} strokeWidth="4" fill="none"/><path d="M175 65H265l-10 -7m10 7-10 7" stroke={sourceColours[0]} strokeWidth="2.43" fill="none"/><text x="85" y="124" textAnchor="middle">x=0</text><text x="215" y="124" textAnchor="middle">x=1</text><text x="150" y="24" textAnchor="middle">fixed observation interval</text><text x="150" y="153" textAnchor="middle">mass increases inside</text></Geometry><Values items={[["Incoming ρ(0) v",2/Math.sqrt(2*Math.PI)],["Outgoing ρ(1) v",2*Math.exp(-.5)/Math.sqrt(2*Math.PI)],["d/dt mass in [0,1] at t=0",2*(1-Math.exp(-.5))/Math.sqrt(2*Math.PI)]]}/><p className="ot-note">This separate smooth example is ρₜ(x) = exp(−(x−2t)²/2)/√(2π), moving at v=2. Flux ρv is mass crossing a point per unit time. The interval gains incoming flux minus outgoing flux. It satisfies ∂tρ = −2∂xρ, so ∂tρ + ∂x(ρv)=0 pointwise; the plotted shaded strip only marks [0,1], not a rectangular density approximation.</p><div className="ot-operation"><span>ρt = δ2t; velocity v = 2</span><span>∂tρ + ∇·(ρv) = 0 in the weak sense</span><span>∫₀¹ ∫ |v|² dρt dt = 4</span></div><p className="ot-note">The density is a measure with a moving atom; ordinary pointwise density derivatives are not asserted.</p></F>;
}
