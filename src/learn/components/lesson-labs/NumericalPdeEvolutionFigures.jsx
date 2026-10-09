import { diffusionEvolution, materialInterface, neumannBalance, advectionEvolution, burgersGodunovFlux } from '../../data/numerical-pde-models.js';
import { colors, timeMethods, Ledger, Matrix, Mesh, Plot, Scene, Stencil, number } from './NumericalPdeReadingPrimitives.jsx';
import { CellBalance, CellBars, MaterialRod, Riemann } from './NumericalPdeGeometry.jsx';
import { BudgetBars } from './NumericalPdeFoundationFigures.jsx';

const nodes = Array.from({ length: 9 }, (_, j) => j / 8);
const sine = k => nodes.map(x => Math.sin(k * Math.PI * x));
const sampled = (fn, count = 160) => Array.from({ length: count + 1 }, (_, j) => fn(2 * Math.PI * j / count));

export function AmplificationPlane({ kind = 'regions', courant = .75 }) {
  const unit = sampled(t => [Math.cos(t), Math.sin(t)]);
  const series = kind === 'regions' ? [
    { ...timeMethods.explicit, label: 'Explicit Euler boundary: |1+z|=1; stable inside', points: sampled(t => [-1 + Math.cos(t), Math.sin(t)]) },
    { ...timeMethods.backward, label: 'Backward Euler boundary: |1−z|=1; stable outside', points: sampled(t => [1 + Math.cos(t), Math.sin(t)]) },
  ] : [
    { label: 'Unit-magnitude circle', color: colors.muted, points: unit },
    { label: `Upwind multipliers, c=${courant}`, color: colors.computed, points: sampled(t => [1 - courant + courant * Math.cos(t), -courant * Math.sin(t)]) },
    { label: `Centered Euler multipliers, c=${courant}`, color: colors.defect, points: sampled(t => [1, -courant * Math.sin(t)]) },
  ];
  return <><Plot label={kind === 'regions' ? 'Scalar absolute-stability boundaries in the complex z plane' : 'Every Fourier multiplier on the same complex plane'} xLabel={kind === 'regions' ? 'Real part of z=Δtλ' : 'Real part of multiplier'} yLabel="Imaginary part" equal xDomain={kind === 'regions' ? [-2.25, 2.25] : [-1.2, 1.2]} yDomain={[-1.2, 1.2]} series={series} />
    <p>{kind === 'regions' ? 'The amber disk contains the explicit-stable parameters. The exterior of the violet circle is backward-stable, including the entire negative-real half-plane. A diffusion mode lies at z=−μ.' : 'The amber circle lies within the unit disk for 0≤c≤1. The pink vertical segment meets the circle only at multiplier 1; its other points have magnitude above 1.'}</p></>;
}

export function DependencyCone({ courant = .75, steps = 4 }) {
  return <div className="npde-reading-object"><p>One-cell-per-step dependency and the physical upstream origin</p><Scene label="Discrete backward dependency triangle versus the exact transport characteristic" height={210}>{width => {
    const span = width - 32;
    const x = a => 16 + span * a / 10;
    const y = t => 184 - 36 * t;
    const end = 7;
    return <>
      {[0, 1, 2, 3, 4].map(t => <g key={t}><line x1="16" x2={width - 16} y1={y(t)} y2={y(t)} stroke="#343a44" />{Array.from({ length: 11 }, (_, j) => <circle key={j} cx={x(j)} cy={y(t)} r="2" fill={colors.muted} />)}</g>)}
      <polygon points={`${x(end)},${y(steps)} ${x(end - steps)},${y(0)} ${x(end)},${y(0)}`} fill="rgba(232,180,74,.12)" stroke={colors.computed} />
      <line x1={x(end)} y1={y(steps)} x2={x(end - courant * steps)} y2={y(0)} stroke={colors.field} strokeWidth="3" />
      <circle cx={x(end - courant * steps)} cy={y(0)} r="4" fill={colors.field} />
      <circle cx={x(end)} cy={y(steps)} r="4" fill={colors.computed} />
    </>;
  }}</Scene><p>Horizontal: spatial cell address 0…10. Vertical: time levels 0…4 from bottom to top. Amber triangle: possible upstream cells in four numerical steps. Cyan line: exact characteristic, arriving from address {number(7 - courant * steps)}. At c={courant}, {courant <= 1 ? 'that origin lies within the dependency triangle' : 'it lies beyond the left boundary'}.</p></div>;
}

export function EvolutionFigure({ id }) {
  switch (id) {
    case 'N24': {
      const r = diffusionEvolution();
      return <><Mesh nodes={nodes} values={sine(1)} selected={4} label="Restriction of the initial sine field: one complete addressed vector" /><Stencil label="Generator row −αA acting at the center; α=1" operands={sine(1).slice(3, 6)} positions={nodes.slice(3, 6)} addresses={[3, 4, 5]} coefficients={[64, -128, 64]} /><Plot label="One entire vector update, with fixed endpoints retained" series={[{ label: 'Initial vector', color: colors.field, points: nodes.map((x, j) => [x, r.frames[0].explicit[j]]) }, { label: 'First explicit vector', color: colors.computed, points: nodes.map((x, j) => [x, r.frames[1].explicit[j]]) }]} /><p>The PDE field is sampled into a spatial ODE. Here Δt={number(r.dt)}; the integrator updates all seven interior entries together.</p></>;
    }
    case 'N25': {
      const k = 3, values = sine(k), lambda = 256 * Math.sin(k * Math.PI / 16) ** 2;
      return <><Plot label="A whole discrete sine mode and its spatial operator image" yLabel="Mode and operator value" series={[{ label: 'vⱼ=sin(3πj/8)', color: colors.field, points: nodes.map((x, j) => [x, values[j]]) }, { label: 'Av=λ₃v', color: colors.computed, points: nodes.map((x, j) => [x, lambda * values[j]]) }]} /><Plot label="Shape comparison after explicitly dividing the operator image by λ₃" yLabel="v and Av / λ₃" yDomain={[-1.1, 1.1]} series={[{ label: 'Original signed mode v', color: colors.field, points: nodes.map((x, j) => [x, values[j]]) }, { label: 'Operator image Av / λ₃', color: colors.computed, dash: '5 4', points: nodes.map((x, j) => [x, lambda * values[j] / lambda]) }]} /><p>The first view keeps both actual amplitudes on one axis. This second view explicitly removes the positive factor λ₃={number(lambda)} from Av: every peak, trough and zero position coincides with v. Their maximum absolute amplitudes are 1 and {number(lambda)} respectively.</p><Ledger label="All entries of the same eigenvector equation" headers={['j', 'vⱼ', '(Av)ⱼ', 'λ₃ vⱼ']} rows={values.slice(1, -1).map((v, j) => [j + 1, v, 64 * (2 * v - values[j] - values[j + 2]), lambda * v])} /><p>λ₃={number(lambda)}. The same scalar multiplier applies to every signed entry; explicit time stepping gives (1−αΔtλ₃)v.</p></>;
    }
    case 'N26': return <><Stencil label="N=3, r=.6: first update of nonnegative input (1,0)" operands={[0, 1, 0]} coefficients={[.6, -.2, .6]} result={-.2} /><Matrix label="Whole two-unknown update matrix" values={[[-.2, .6], [.6, -.2]]} /><CellBars values={[-.2, .6]} identities={['U₁ at x=1/3', 'U₂ at x=2/3']} quantity="updated entry" label="Updated vector: its negative entry is below the zero axis" /><Ledger label="Two different tests of the same matrix" headers={['Test', 'Result']} rows={[["Eigenvalues", '.4 and −.8'], ['Euclidean spectral radius', .8], ['Update of (1,0)', '−.2, .6'], ['Positivity', 'fails: negative diagonal']]} /></>;
    case 'N28': return <><Stencil label="Under r≤1/2, old error enters with nonnegative row weights" operands={[1, 1, 1]} coefficients={[.25, .5, .25]} result={1} /><BudgetBars label="Accumulated maximum-norm error bound: temporal and spatial contributions" amounts={[.01, .0025]} names={['Illustrative CₜTΔt: .01', 'Illustrative CₓTh²: .0025']} /><p>The weight sum is 1, so each new propagated entry is bounded by the old maximum. Per-step defects then add; the two budget numbers illustrate a declared bound, not measured errors. Smoothness and compatible boundaries supply its constants.</p></>;
    case 'N29': return <AmplificationPlane />;
    case 'N30': return <><Matrix label="Backward Euler coupled new-time rows: N=4, r=1/4" values={[[1.5, -.25, 0], [-.25, 1.5, -.25], [0, -.25, 1.5]]} /><Mesh nodes={[.25, .5, .75]} values={[0, 1, 0]} selected={1} label="The previous vector is the new solve's right-hand side" coefficients={[[-1, -.25], [0, 1.5], [1, -.25]]} /><p>Each connected new-time neighbor is unknown. Factor this unchanged tridiagonal matrix once; substitute each new right-hand side through the same factors. For RHS (0,1,0), the new vector is (2/17,12/17,2/17).</p></>;
    case 'N31': return <><CellBars label="One mode at μ=8: sign and magnitude on one common scale" values={[Math.exp(-8), -7, 1 / 9, -.6]} identities={['Exact spatial ODE', 'Explicit Euler', 'Backward Euler', 'Crank–Nicolson']} identityStyles={['semidiscrete', 'explicit', 'backward', 'crank'].map(key => timeMethods[key])} /><Ledger label="Every one-step factor" headers={['Method', 'Factor', 'Interpretation']} rows={[["Exact spatial ODE", Math.exp(-8), 'positive, strongly damped'], ['Explicit Euler', -7, 'negative and amplified'], ['Backward Euler', 1 / 9, 'positive and damped'], ['Crank–Nicolson', -.6, 'damped but sign reversed']]} /><p>No interpolation between these discrete methods is intended. The same sign and magnitude scale permits their comparison.</p></>;
    case 'N32': {
      const n = 16, time = .02, lambda = 4 * n * n * Math.sin(Math.PI / (2 * n)) ** 2;
      const spatialExact = Math.exp(-lambda * time), pdeExact = Math.exp(-(Math.PI ** 2) * time);
      const rows = [16, 32, 64, 128].map(steps => {
        const mu = lambda * time / steps;
        return [steps, time / steps, (1 - mu) ** steps, (1 + mu) ** -steps, ((1 - mu / 2) / (1 + mu / 2)) ** steps];
      });
      return <><Plot label="Halve only Δt on the same spatial mode; reference amplitudes remain fixed" xLabel="Time steps (log₂)" yLabel="Amplitude at T=.02" zero={false} series={[...['explicit', 'backward', 'crank'].map((key, j) => ({ ...timeMethods[key], points: rows.map(r => [Math.log2(r[0]), r[j + 2]]) })), { ...timeMethods.semidiscrete, points: [[4, spatialExact], [7, spatialExact]] }, { ...timeMethods.continuous, points: [[4, pdeExact], [7, pdeExact]] }]} /><Ledger label="Actual amplification powers, fixed N=16 and mode 1" headers={['Time steps', 'Δt', 'Explicit amplitude', 'Backward amplitude', 'Crank amplitude']} rows={rows} /><p>The cyan dash-dot reference is {number(spatialExact)}; the dashed PDE reference is {number(pdeExact)}. Their fixed difference is spatial, so only the first isolates temporal error.</p></>;
    }
    case 'N33': return <><CellBalance loads={[.5, .5, .5, .5]} left={0} right={0} /><p>Every amber shared face appears once with a minus sign in the left cell and once with a plus sign in the right cell. Summing removes internal terms; only the two outward boundaries and integrated source remain. This is an accounting diagram, not a solved steady field.</p></>;
    case 'N34': {
      const r = materialInterface();
      return <><MaterialRod position={.5} conductivity={10} flux={r.flux} temperature={r.interfaceTemperature} resistances={r.resistances} /><Plot label="Actual continuous two-material temperature profile" series={[{ label: 'Common-flux temperature', color: colors.field, points: r.curve.map(p => [p.x, p.y]) }]} markers={r.curve.map(p => [p.x, p.y])} /><p>Series resistance gives q=20/11. Replacing by arithmetic conductivity instead gives 11/2, a different physical operation.</p></>;
    }
    case 'N36': {
      const r = neumannBalance();
      return <><CellBalance loads={r.loads} values={r.values} fluxes={r.fluxes} /><SquaresOfNullspace /><p>The loads sum 0; adding any constant to all four temperatures changes no face difference. The shown solution selects the mean-zero representative. A right outward flux 2 would leave total load −1 and no compatible solution.</p></>;
    }
    case 'N38': {
      const r = advectionEvolution({ steps: 1 });
      return <><CellBars label="Whole pulse: exact translated cell averages and one upwind update" values={r.frames[1].values} exact={r.frames[1].exact} /><Stencil label="Positive velocity: actual cell 5 blends itself and cell 4" operands={[r.frames[0].values[4], r.frames[0].values[5]]} positions={[4.5 / 16, 5.5 / 16]} addresses={[4, 5]} coefficients={[.75, .25]} /><p>Every stored number is an interval average. Positive velocity takes upstream cell j−1; negative velocity takes j+1, including the wrap from the last cell to the first.</p></>;
    }
    case 'N40': return <AmplificationPlane kind="transport" />;
    case 'N41': return <><DependencyCone courant={.75} /><DependencyCone courant={1.25} /><p>The second cyan origin lies outside the same four-step reachable triangle. This necessary domain condition is distinct from the mode-magnitude test.</p></>;
    case 'N42': return <>{[[-1, 2], [2, 0], [3, -3]].map(([left, right]) => <Riemann key={`${left},${right}`} left={left} right={right} result={burgersGodunovFlux(left, right)} />)}</>;
    default: throw new Error(`Unowned numerical evolution figure ${id}`);
  }
}

function SquaresOfNullspace() {
  return <><Mesh nodes={[.125, .375, .625, .875]} values={[1, 1, 1, 1]} label="Constant null direction: every neighbor difference is zero" /><Ledger label="All neighboring constant differences" headers={['Face', 'Difference']} rows={[[1, 0], [2, 0], [3, 0]]} /></>;
}
