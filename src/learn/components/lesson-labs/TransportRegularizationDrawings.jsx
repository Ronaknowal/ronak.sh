import { Figure, Geometry, Matrix, Plan, Ledger, Values, Plot, sourceColours, targetColours, fmt, sum } from './TransportDrawingPrimitives.jsx';
import { TRANSPORT_COSTS, equalWeightEntropicPlan, sinkhornScaling, transportSummary } from '../../data/optimal-transport-models.js';
const half = [.5, .5],
  C = TRANSPORT_COSTS.distance,
  F = ({
    n,
    label,
    children
  }) => <Figure id={'OT' + n} label={label}>{children}</Figure>;
const curve = (fn, a, b, N = 70) => Array.from({
  length: N + 1
}, (_, i) => {
  const x = a + (b - a) * i / N;
  return [x, fn(x)];
});
const kernel = () => C.map(r => r.map(c => Math.exp(-c / .5)));
const negativeEntropy = P => sum(P.flat().map(p => p === 0 ? 0 : p * (Math.log(p) - 1)));
const KL = (P, Q) => sum(P.flat().map((p, i) => p === 0 ? Q.flat()[i] : p * (Math.log(p) - Math.log(Q.flat()[i])) - p + Q.flat()[i]));
export function EntropicSpread() {
  const s = equalWeightEntropicPlan(C, .5);
  return <F n={31} label="Entropy spreads a feasible plan into previously empty routes"><div className="ot-pair"><Plan plan={[[.5, 0], [0, .5]]} max={.5} label="Linear optimum" /><Plan plan={s.plan} max={.5} label="ε = .5 optimum" /></div><Values items={[[`Diagonal mass`, s.plan[0][0]], ['Off-diagonal mass', s.plan[0][1]], ['Linear cost increases to', s.cost], ['Counting negative entropy', s.negativeEntropy], ['Full regularized objective', s.objective]]} /></F>;
}
export function LogisticPlan() {
  return <F n={32} label="The stationary equation gives an exact two-location entropic plan"><Plot domain={[.1, 2]} xTicks={[.1, .5, 1, 1.5, 2]} range={[0, .5]} xLabel="entropy scale ε" yLabel="Diagonal entry t" curves={[{
      label: 't = ½ / (1 + exp(−1/ε))',
      points: curve(e => equalWeightEntropicPlan(C, e).plan[0][0], .1, 2),
      colour: sourceColours[0]
    }]} /><div className="ot-operation"><span>Cost slope Δ = 0 − 1 − 2 + 1 = −2</span><span>Δ + 2ε log(t / (.5 − t)) = 0</span><span>t = ½ / (1 + exp(Δ / (2ε)))</span></div><Values items={[[`As ε → 0`, 't → .5'], ['As ε grows', 't → .25'], ['Curvature inside (0,.5)', '2ε(1/t + 1/(.5−t)) > 0']]} /></F>;
}
export function GibbsKernel() {
  const K = kernel();
  return <F n={33} label="Exponentiating cost makes preferences, not a feasible coupling"><div className="ot-pair"><Matrix values={C} label="Ground costs C" kind="cost" /><Matrix values={K} label="K = exp(−C/.5)" kind="kernel" max={1} requiredRows={half} requiredCols={half} /></div><p className="ot-note">The rows and columns do not sum to the required half weights. Multiplicative row and column factors must impose those constraints.</p></F>;
}
export function EntropyConvention() {
  const P = equalWeightEntropicPlan(C, .5).plan,
    H = -sum(P.flat().map(p => p * Math.log(p))),
    kl = KL(P, [[.25, .25], [.25, .25]]);
  return <F n={34} label="Shannon entropy, counting negative entropy and reference KL have different constants"><Matrix values={P} max={.5} /><Ledger label="One plan, three declared quantities" headers={['quantity', 'expression', 'value']} rows={[[`Shannon entropy`, '−Σ P log P', H], ['counting negative entropy', 'Σ P(log P−1)', -H - 1], ['KL to product a⊗b', 'Σ P log(P/(ab))', kl]]} /><div className="ot-operation"><span>Fixed marginals: Σ P log(P/(ab))</span><b>=</b><span>Σ P log P − Σ a log a − Σ b log b</span></div><p className="ot-note">Changing the discrete representation changes counting-table entropy. Preserve the reference measure when claiming a distribution-level quantity.</p></F>;
}
export function ThreeOutputs() {
  const s = equalWeightEntropicPlan(C, .5);
  return <F n={35} label="A cost, a full objective and a feasibility residual answer different questions"><Matrix values={s.plan} max={.5} /><Values items={[[`Linear work ⟨C,P⟩`, s.cost], ['Entropy contribution .5 Σ P(log P−1)', .5 * s.negativeEntropy], ['Full objective (sum)', s.objective], ['Marginal residual', s.residual]]} /><div className="ot-operation"><span>Linear term → movement under this plan</span><span>Full objective → value optimized by this convention</span><span>Residual → accuracy of marginal constraints</span></div><p className="ot-note">A negative full objective is permitted. It is not a negative Wasserstein distance.</p></F>;
}
export function StrictConvexity() {
  const Fvalue = (t, e) => 1.5 - 2 * t + e * negativeEntropy([[t, .5 - t], [.5 - t, t]]);
  return <F n={36} label="Entropy bends the affine cost into a strictly convex objective"><Plot domain={[0, .5]} range={[-.5, 1.5]} yTicks={[-.5, 0, .5, 1, 1.5]} xLabel="feasible t" yLabel="Objective" curves={[{
      label: 'linear work',
      points: curve(t => Fvalue(t, 0), 0, .5),
      colour: sourceColours[0]
    }, {
      label: 'full ε=.5 objective',
      points: curve(t => Fvalue(t, .5), 0, .5),
      colour: sourceColours[1]
    }]} points={[{
      x: equalWeightEntropicPlan(C, .5).plan[0][0],
      y: equalWeightEntropicPlan(C, .5).objective
    }]} /><Values items={[[`Finite positive active marginals; ε > 0`, 'unique optimal coupling'], ['Zero required row', 'fixed empty, remove then restore'], ['Curvature', 'positive inside the active feasible interval']]} /></F>;
}
export function RowCorrection() {
  const K = kernel(),
    u = K.map((r, i) => half[i] / sum(r)),
    Q = K.map((r, i) => r.map(v => u[i] * v));
  return <F n={37} label="A row factor spends exactly each source supply"><div className="ot-pair"><Matrix values={K} label="Before: K with v=(1,1)" kind="kernel" max={1} /><Matrix values={Q} label="After: diag(u) K" max={1} requiredRows={half} requiredCols={half} /></div><Ledger label="Every row correction" headers={['row', '(Kv)i', 'required ai', 'ui = ai/(Kv)i']} rows={K.map((r, i) => [`A${i}`, sum(r), half[i], u[i]])} /><p className="ot-note">Both rows now match. In this symmetric half-weight fixture the columns also happen to match; that coincidence is not the general rule.</p></F>;
}
export function ColumnCorrection() {
  const changed = sinkhornScaling({
      source: [.6, .4],
      target: [.3, .7],
      traceSteps: 2
    }),
    K = kernel(),
    u = K.map(r => .5 / sum(r)),
    Q = K.map((r, i) => r.map(v => u[i] * v)),
    v = half.map((b, j) => b / sum(Q.map(r => r[j]))),
    R = Q.map(r => r.map((x, j) => x * v[j]));
  return <F n={38} label="A column correction changes the previously corrected rows"><div className="ot-pair"><Matrix values={Q} label="After row correction" max={.5} requiredRows={half} requiredCols={half} /><Matrix values={R} label="After column correction" max={.5} requiredRows={half} requiredCols={half} /></div><Ledger label="Every column correction" headers={['column', '(Kᵀu)j', 'required bj', 'vj']} rows={half.map((b, j) => [`B${j}`, sum(Q.map(r => r[j])), b, v[j]])} /><p className="ot-note">Here both column factors equal 1, so the half-weight solution stays unchanged. For comparison, change the required margins to (.6,.4) and (.3,.7), as in the following live investigation.</p><div className="ot-pair"><Matrix values={changed.trace[1].plan} label="Changed margins: after row step" max={.7} requiredRows={[.6, .4]} requiredCols={[.3, .7]} /><Matrix values={changed.trace[2].plan} label="Changed margins: after column step" max={.7} requiredRows={[.6, .4]} requiredCols={[.3, .7]} /></div><p className="ot-note">Now the column correction disturbs both rows. Every displayed entry is an actual model half-step.</p></F>;
}
export function ProjectionIdentity() {
  const K = kernel(),
    Q = K.map(r => r.map(v => .5 * v / sum(r))),
    P = [[.5, 0], [0, .5]],
    a = KL(P, K),
    b = KL(P, Q),
    c = KL(Q, K);
  return <F n={40} label="A row KL projection gives a Pythagorean identity"><div className="ot-step-grid"><Matrix values={K} label="Positive K" kind="kernel" max={1} /><Matrix values={Q} label="Row projection Q" max={1} /><Matrix values={P} label="Another row-feasible P" max={1} /></div><div className="ot-operation"><span>D(P ∥ K) = {fmt(a)}</span><b>=</b><span>D(P ∥ Q) = {fmt(b)}</span><b>+</b><span>D(Q ∥ K) = {fmt(c)}</span></div><p className="ot-note">The cancellation uses the common affine row sums. Alternating arbitrary convex sets needs additional conditions or corrections.</p></F>;
}
export function ResidualTrace() {
  const s = sinkhornScaling({
      source: [.6, .4],
      target: [.3, .7],
      traceSteps: 40
    }),
    err = (x, k) => Math.max(...x[k].map(Math.abs));
  return <F n={41} label="Actual row and column residuals across forty half-steps"><Plot domain={[0, 40]} range={[0, 1]} xLabel="half-step" yLabel="Maximum absolute marginal error" curves={[{
      label: 'row residual',
      points: s.trace.map((p, i) => [i, err(p, 'rowErrors')]),
      colour: sourceColours[0]
    }, {
      label: 'column residual',
      points: s.trace.map((p, i) => [i, err(p, 'columnErrors')]),
      colour: targetColours[0],
      dashed: true
    }]} /><Values items={[[`Trace final residual`, s.trace.at(-1).residual], ['Separate stopped reference residual', s.residual], ['Tolerance', s.tolerance], ['Reference sweeps', s.iterations], ['Stop state', s.converged ? 'tolerance satisfied' : 'cap reached']]} /><Ledger label="Complete half-step residual trace" headers={['half-step', 'phase', 'row error', 'column error']} rows={s.trace.map((p, i) => [i, p.phase, err(p, 'rowErrors'), err(p, 'columnErrors')])} /></F>;
}
export function SupportBoundary() {
  return <F n={42} label="A perfect matching does not ensure total support"><div className="ot-pair"><Plan plan={[[1, 1], [0, 1]]} max={1} selected={1} label="Positive support weights A" kind="support" routeLabel="Positive support edges" quantity="edge weight" /><Matrix values={[[1, 0], [0, 1]]} max={1} label="Limit: unit row and column totals" kind="support" requiredRows={[1,1]} requiredCols={[1,1]} /></div><Ledger label="Support edges and matching membership" headers={['edge', 'positive initially', 'on a perfect matching']} rows={[[`A0 → B0`, 'yes', 'yes'], ['A0 → B1', 'yes', 'no'], ['A1 → B0', 'no', 'no'], ['A1 → B1', 'yes', 'yes']]} /><p className="ot-note">The limit has row totals (1, 1), column totals (1, 1), and total 2; these are matrix weights, not a probability law of total 1. The extra positive edge must vanish in the limit; finite positive diagonal factors cannot make it zero. Disconnected identity support permits independent component gauges.</p></F>;
}
export function LogSumExp() {
  const z = [-2000, -2002],
    m = Math.max(...z),
    e = z.map(v => Math.exp(v - m)),
    L = m + Math.log(sum(e));
  return <F n={43} label="Maximum subtraction preserves a finite logarithm of tiny positive terms"><Ledger label="One actual transformed row" headers={['entry', 'log value z', 'ordinary exp(z)', 'shifted exp(z−m)']} rows={z.map((v, i) => [`j=${i}`, v, Math.exp(v), e[i]])} /><div className="ot-operation"><span>m = max(z) = −2000</span><b>→</b><span>exp(z − m) = (1, e⁻²)</span><b>→</b><span>m + log(1 + e⁻²) = {fmt(L, 9)}</span></div><p className="ot-note">The ordinary exponential sum is zero in this machine arithmetic; its stable logarithm is finite. Inputs and transformed C/ε must themselves be representable.</p></F>;
}
export function GaugeShifts() {
  const s = sinkhornScaling(),
    u = s.logSourceScale,
    v = s.logTargetScale;
  return <F n={45} label="Opposite factor shifts cancel in every coupling cell"><Ledger label="A gauge shift c = 3" headers={['cell', 'log ui', 'log vj', 'shifted log ui', 'shifted log vj', 'sum difference']} rows={u.flatMap((a, i) => v.map((b, j) => [`P${i}${j}`, a, b, a + 3, b - 3, a + 3 + b - 3 - (a + b)]))} /><Matrix values={s.plan} max={.5} label="Unchanged coupling after gauge shift" /><div className="ot-operation"><span>Cij → Cij + ri + sj</span><b>→</b><span>balanced objective adds a·r + b·s</span><b>→</b><span>same minimizer; different constant value</span></div><p className="ot-note">This argument relies on fixed marginals. It does not carry unchanged into soft-marginal transport.</p></F>;
}
export function DenseDependencies() {
  return <F n={46} label="A dense kernel has a complete row-column dependency"><Geometry label="Three source rows and four target columns make twelve pairwise entries" height={240}>{[0, 1, 2].map(i => <g key={i}><text x="22" y={55 + i * 52}>A{i}</text>{[0, 1, 2, 3].map(j => <g key={j}><rect x={62 + j * 49} y={33 + i * 52} width="42" height="42" fill={i === 1 ? '#78cbe833' : 'none'} stroke={j === 2 ? '#fff' : '#666'} strokeWidth={j === 2 ? 2 : 1} /><text x={83 + j * 49} y={59 + i * 52} textAnchor="middle">K{i}{j}</text></g>)}</g>)}{[0, 1, 2, 3].map(j => <text key={j} x={83 + j * 49} y="22" textAnchor="middle" style={{
        fill: targetColours[j % 4]
      }}>B{j}</text>)}<text x="150" y="215" textAnchor="middle">row sums use all columns</text><text x="150" y="234" textAnchor="middle">column sums use all rows</text></Geometry><Values items={[[`Stored cells`, 'n × m'], ['One sweep', 'O(nm)'], ['K sweeps', 'O(Knm)'], ['Stable logarithms', 'do not remove dense storage or conditioning']]} /></F>;
}
export function EnvelopeDerivative() {
  const e = 1,
    h = 1e-5,
    s = equalWeightEntropicPlan(C, e);
  const full = costs => {
    const delta = costs[0][0] - costs[0][1] - costs[1][0] + costs[1][1],
      t = .5 / (1 + Math.exp(delta / (2 * e))),
      P = [[t, .5 - t], [.5 - t, t]];
    return sum(P.flat().map((v, i) => v * costs.flat()[i])) + e * negativeEntropy(P);
  };
  const rows = C.flatMap((r, i) => r.map((_, j) => {
    const Cp = C.map(r => [...r]),
      Cm = C.map(r => [...r]);
    Cp[i][j] += h;
    Cm[i][j] -= h;
    return [`C${i}${j}`, s.plan[i][j], (full(Cp) - full(Cm)) / (2 * h)];
  }));
  return <F n={47} label="The optimal plan is the full objective derivative with respect to cost"><Matrix values={s.plan} max={.5} selected={0} label="ε = 1 optimum: derivative entries" /><Ledger label="Central differences of the full optimum (h = 10⁻⁵)" headers={['cost entry', 'plan entry', 'central difference']} rows={rows} /><p className="ot-note">The unique smooth optimum gives ∂F/∂Cij = Pij. Both perturbed costs use the same exact two-by-two optimum, including a negative perturbation at the zero cost cell. This is the full objective, not only its linear term.</p></F>;
}
export function DifferentiatingIterations() {
  const s = sinkhornScaling({
    traceSteps: 2
  });
  return <F n={48} label="Differentiate the actual finite algorithm or the converged optimum"><div className="ot-step-grid">{s.trace.map((p, i) => <Matrix key={i} values={p.plan} max={1} label={['K(θ)', 'row step Q(θ)', 'column step P1(θ)'][i]} kind={i === 0 ? 'kernel' : 'mass'} />)}</div><div className="ot-operation"><span>θ → C(θ) → log K</span><b>→</b><span>logu = loga − LSE(logK + logv)</span><b>→</b><span>logv = logb − LSE(logKᵀ + logu)</span></div><Ledger label="Two derivative objects" headers={['method', 'differentiated object', 'requirement']} rows={[[`unrolled reverse mode`, 'the chosen finite sequence of updates', 'retain or recompute intermediate states'], ['implicit optimum derivative', 'the converged fixed-point/optimality equations', 'convergence and regularity']]} /><p className="ot-note">These objects can differ before convergence. A nonconvex parameter map C(θ) does not inherit a global fitting guarantee.</p></F>;
}
export function DivergenceConditions() {
  const k = Math.exp(-4);
  return <F n={50} label="Self-bias correction needs its declared cost and kernel assumptions"><Matrix values={[[1, k], [k, 1]]} max={1} label="Gaussian-cost kernel on points A0 = 0 and A1 = 2" kind="kernel" colLabels={['● A0','● A1']} colColours={sourceColours} /><Values items={[[`Kernel eigenvalues`, `${fmt(1 - k)} and ${fmt(1 + k)}`], ['Self-correction', 'F(α,β) − ½F(α,α) − ½F(β,β)'], ['Consistent self comparison', 0]]} /><Ledger label="The theorem boundary" headers={['setting', 'supported statement']} rows={[[`Declared compact metric/Lipschitz cost and universal positive kernel`, 'nonnegative, definite Sinkhorn divergence under the cited assumptions'], ['arbitrary route table', 'do not infer positivity or metric properties'], ['large entropy connection', 'energy/MMD interpretation needs compatible cost/kernel conventions']]} /></F>;
}
