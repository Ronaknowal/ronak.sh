import { poissonProblem, poissonRefinement, finiteElement1D } from '../../data/numerical-pde-models.js';
import { colors, Ledger, Matrix, Mesh, number, Plot, ReadingRegion, Scene, Stencil } from './NumericalPdeReadingPrimitives.jsx';
import { Squares, WorkTimeline } from './NumericalPdeGeometry.jsx';
import { numericalPdeExamples } from '../../data/numerical-pde-examples.js';

const quadratic = x => x * (1 - x);
const quartic = x => x - 2 * x ** 3 + x ** 4;
const sample = (fn, a = 0, b = 1, count = 128) => Array.from({ length: count + 1 }, (_, j) => [a + (b - a) * j / count, fn(a + (b - a) * j / count)]);
const nodes = [0, .25, .5, .75, 1];
const values = nodes.map(quadratic);
const field = (label, exact = quadratic, computed = values, mesh = nodes) => <Plot label={label} series={[{ label: 'Continuous field', color: colors.field, points: sample(exact) }, { label: 'Stored values joined linearly', color: colors.computed, points: mesh.map((x, j) => [x, computed[j]]) }]} markers={mesh.map((x, j) => [x, computed[j]])} />;

export function BudgetBars({ amounts, names, label }) {
  const total = amounts.reduce((a, b) => a + b, 0);
  const palette = [colors.defect, colors.computed, colors.reference];
  return <div className="npde-reading-object"><p>{label}</p><Scene label={label} height={85}>{width => {
    let accumulated = 0;
    return <>{amounts.map((value, j) => {
      const start = accumulated;
      accumulated += value;
      return <rect key={j} x={12 + (width - 24) * start / (total || 1)} y="25" width={(width - 24) * value / (total || 1)} height="35" fill={palette[j % palette.length]} />;
    })}</>;
  }}</Scene><Ledger label="Components on the same additive budget scale" headers={['Component', 'Bound']} rows={amounts.map((value, j) => [names[j], value]).concat([['Total', total]])} /></div>;
}

export function CancellationTerms() {
  const x = .25;
  const h = .25;
  const terms = [quartic(x), h * (1 - 6 * x ** 2 + 4 * x ** 3), h ** 2 / 2 * (-12 * x + 12 * x ** 2), h ** 3 / 6 * (-12 + 24 * x), h ** 4];
  return <div className="npde-reading-object"><p>Paired expansions at x−h and x+h; x=1/4, h=1/4, quartic target</p><Scene label="Matching derivative terms connected across two expansions; odd powers have opposite signs" height={160}>{width => <>
    {terms.map((_, j) => <g key={j}><circle cx="22" cy={15 + 29 * j} r="5" fill={j % 2 ? colors.defect : colors.field} /><circle cx={width - 22} cy={15 + 29 * j} r="5" fill={j % 2 ? colors.computed : colors.field} /><line x1="30" x2={width - 30} y1={15 + 29 * j} y2={15 + 29 * j} stroke={j % 2 ? colors.defect : colors.field} strokeDasharray={j % 2 ? '4 3' : undefined} /></g>)}
  </>}</Scene><p>From top to bottom the lines represent derivative orders 0, 1, 2, 3 and 4. Each line connects the same derivative order. Dashed pink odd orders cancel; cyan even orders add. Values belong to these polynomial expansions, not measured convergence data.</p><Ledger label="Complete paired Taylor operands" headers={['Order', 'Left contribution', 'Right contribution', 'Sum']} rows={terms.map((value, j) => [j, (j % 2 ? -1 : 1) * value, value, (j % 2 ? 0 : 2) * value])} /></div>;
}

export function FoundationFigure({ id }) {
  const N = 4;
  switch (id) {
    case 'N01': return <>{field('The continuous quadratic, actual five samples and their reconstruction')}<Mesh nodes={nodes} values={values} label="Four physical cells and five nodal addresses" /></>;
    case 'N02': return <Plot label="Same nodal restriction, different between-node fields" series={[{ label: 'u=x(1−x)', color: colors.field, points: sample(quadratic) }, { label: 'u + .05 sin(4πx)', color: colors.defect, points: sample(x => quadratic(x) + .05 * Math.sin(4 * Math.PI * x)) }]} markers={nodes.map((x, j) => [x, values[j]])} />;
    case 'N03': return <Mesh nodes={nodes} values={values} selected={1} label="Restriction links spatial samples to addressed vector slots; endpoints remain known" />;
    case 'N04': return <Stencil label="Actual centered curvature row at j=1" operands={values.slice(0, 3)} positions={nodes.slice(0, 3)} coefficients={[-16, 32, -16]} />;
    case 'N05': return <CancellationTerms />;
    case 'N06': return <>{[4, 8].map(n => <div key={n}><Stencil label={`Quartic stencil at x=1/2, N=${n}`} operands={[.5 - 1 / n, .5, .5 + 1 / n].map(quartic)} positions={[.5 - 1 / n, .5, .5 + 1 / n]} addresses={[n / 2 - 1, n / 2, n / 2 + 1]} coefficients={[-n * n, 2 * n * n, -n * n]} /><p>Continuous forcing: 3. Signed forcing minus stencil: {number(2 / n ** 2)}.</p></div>)}</>;
    case 'N07': return <><Mesh nodes={nodes} values={nodes.map(x => quadratic(x) + 2 - 3 * x)} selected={1} label="Both known endpoints contribute to the interior rows" /><Matrix label="Scaled interior matrix T" values={[[2, -1, 0], [-1, 2, -1], [0, -1, 2]]} /><Ledger label="Known boundary moved to the corresponding load" headers={['Interior row', 'h²f', 'Boundary contribution', 'Final scaled RHS']} rows={[[1, .125, 2, 2.125], [2, .125, 0, .125], [3, .125, -1, -.875]]} /></>;
    case 'N08': return <div className="npde-pair"><Matrix label="Physical operator A; units 1 / length²" values={[[32, -16, 0], [-16, 32, -16], [0, -16, 32]]} /><Matrix label="Scaled operator T=h²A; h²=1/16" values={[[2, -1, 0], [-1, 2, -1], [0, -1, 2]]} /></div>;
    case 'N09': return <><Matrix label="Lower unit factor L; actual addressed elimination multipliers" values={[[1, 0, 0], [-.5, 1, 0], [0, -2 / 3, 1]]} /><Mesh nodes={[0, 1, 2]} values={[2, 1.5, 4 / 3]} label="Ordered positive pivots in D; forward then backward passes follow these neighbors" /><p>T=L D Lᵀ. Each adjacent link updates one next load; the reverse pass subtracts the remaining neighbor. A second RHS reuses these same factors.</p></>;
    case 'N10': return field('Whole changed-boundary solution, including both prescribed ends', x => quadratic(x) + 2 - 3 * x, nodes.map(x => quadratic(x) + 2 - 3 * x));
    case 'N11': return <><Plot label="One cell: two nodal weights give a chord below the quadratic" xDomain={[0, .25]} series={[{ label: 'Continuous quadratic', color: colors.field, points: sample(quadratic, 0, .25) }, { label: 'Chord', color: colors.computed, points: [[0, 0], [.25, 3 / 16]] }]} markers={[[.125, 3 / 32], [.125, 7 / 64]]} /><Stencil label="Half of each endpoint forms the selected interpolated value" operands={[0, 3 / 16]} positions={[0, .25]} coefficients={[.5, .5]} /><p>At x=1/8 the chord gives 3/32, exact field 7/64, gap 1/64.</p></>;
    case 'N12': {
      const a = 0, b = .25, x = .125;
      const line = t => quartic(a) + (quartic(b) - quartic(a)) * (t - a) / (b - a);
      const coefficient = (quartic(x) - line(x)) / ((x - a) * (x - b));
      return <><Plot label="Rolle construction: subtract a chord and a quadratic to obtain three zero positions" xDomain={[a, b]} series={[{ label: 'w(t)=u(t)−chord(t)−c(t−a)(t−b)', color: colors.defect, points: sample(t => quartic(t) - line(t) - coefficient * (t - a) * (t - b), a, b) }]} markers={[[a, 0], [x, 0], [b, 0]]} /><Mesh nodes={[a, x, b]} values={[0, 0, 0]} label="Three exact roots imply two successive Rolle steps under C² regularity" /><p>c={number(coefficient)} in this quartic example. The same construction gives the stated second-derivative remainder; the sampled curve illustrates its roots, not a global error certificate.</p></>;
    }
    case 'N13': return <><Plot label="Piecewise-constant derivative on open cells; jumps at nodes" yLabel="Slope of reconstruction" series={[{ label: 'Cell slopes', color: colors.computed, points: nodes.slice(0, -1).flatMap((x, j) => [[x, (values[j + 1] - values[j]) * N], [nodes[j + 1], (values[j + 1] - values[j]) * N]]) }]} /><Ledger label="Every open-cell slope" headers={['Cell', 'Slope']} rows={nodes.slice(0, -1).map((_, j) => [j, (values[j + 1] - values[j]) * N])} /><p>The vertical segments mark jumps; they are not classical derivative values at mesh nodes.</p></>;
    case 'N14': {
      const r = finiteElement1D({ nodes: Array.from({ length: 9 }, (_, j) => j / 8) });
      return <><Plot label="Same quadratic: zero nodal error and nonzero reconstructed discrepancy" yLabel="Field discrepancy" series={[{ label: 'Exact minus reconstructed', color: colors.defect, points: r.curve.map(p => [p.x, p.exact - p.numerical]) }]} markers={r.nodes.map(x => [x, 0])} /><Ledger label="Different requested error objects on N=8" headers={['Object', 'Exact discretization error']} rows={[["Nodal", 0], ['Continuous maximum', r.fieldError], ['Continuous L2', r.l2Error], ['Energy', r.energyError]]} /></>;
    }
    case 'N15': return <><Mesh nodes={nodes} values={nodes.map(quartic)} selected={2} label="Same rows compare exact restriction and computed vector" /><Ledger label="Subtract complete operator equations with the same boundary load" headers={['Operand', 'Equation']} rows={[["Exact samples", 'A Rₕu = fₕ − τ'], ['Computed vector', 'A Û = fₕ − r'], ['Computed minus exact', 'A(Û − Rₕu) = τ − r']]} /><p>The mesh and addressed operator are shared. The two fₕ contributions cancel; the exact-data defect stays alongside the unfinished-solve residual.</p></>;
    case 'N16': return <><Plot label="Positive quadratic barrier g=x(1−x)/2 on the connected chain" series={[{ label: 'Barrier', color: colors.reference, points: sample(x => x * (1 - x) / 2) }]} markers={nodes.map(x => [x, x * (1 - x) / 2])} /><Stencil label="Barrier at the central row returns one" operands={[.25, .5, .75].map(x => x * (1 - x) / 2)} positions={[.25, .5, .75]} addresses={[1, 2, 3]} coefficients={[-16, 32, -16]} /><p>Zero endpoints and nonnegative barrier support the maximum-principle comparison. Its nodal maximum is at most 1/8.</p></>;
    case 'N17': return <BudgetBars label="Unit quartic N=8: distinct contributions to a whole-field bound" amounts={[0, 1 / 256, 3 / 512]} names={['Algebraic allowance shown here as zero', 'Nodal mesh contribution', 'Interpolation contribution']} />;
    case 'N19': return <><Plot label="Nested physical grids: declared exact nodal mesh errors" xLabel="log₂ N" yLabel="log₂ exact error" zero={false} series={[{ label: 'Exact quartic discretization relation', color: colors.field, points: [8, 16, 32, 64].map(n => [Math.log2(n), Math.log2(1 / (4 * n ** 2))]) }]} /><Ledger label="Computed refinement separately from the exact relation" headers={['N', 'Computed error', 'Exact mesh error', 'Observed order']} rows={poissonRefinement().map(r => [r.intervals, r.error, r.exactNodalDiscretizationError, r.observedOrder])} /></>;
    case 'N21': return <div className="npde-pair"><Plot label="Manufactured quartic and its known endpoints" series={[{ label: 'u=x−2x³+x⁴', color: colors.field, points: sample(quartic) }]} /><Plot label="Derived forcing, not an independent fixture" yLabel="f=−u″" series={[{ label: 'f=12x(1−x)', color: colors.defect, points: sample(x => 12 * x * (1 - x)) }]} /></div>;
    case 'N22': {
      const r = poissonProblem({ intervals: 8 });
      return <><Stencil label="Physical row of the represented floating vector; exact certificate evaluates its rational operands" positions={r.nodes.slice(3, 6)} addresses={[3, 4, 5]} operands={r.values.slice(3, 6)} coefficients={[-64, 128, -64]} /><Ledger label="Displayed float diagnostic versus upward-rounded exact bound" headers={['Quantity', 'Value']} rows={[["Float physical residual maximum", Math.max(...r.residuals.map(Math.abs))], ['Exact represented-vector residual upper bound', r.certificate.residualUpper], ['Whole exact rational field bound', r.certificate.exactFieldBound]]} /><p>The long rational is obtained by interpreting the stored IEEE vector exactly. Rounded decimal diagnostics alone do not supply this bound.</p></>;
    }
    case 'N23': return <><WorkTimeline reports={[{ budget: 25, used: 25, success: false }, { budget: 4000, used: 1450, success: true }]} /><Ledger label="Recorded complete-program outcomes; retained actual stdout" headers={['Allowed updates', 'Updates used', 'Status', 'Whole field bound']} rows={[[25, 25, 'not certified', .338996619], [4000, 1450, 'certified', .000963614]]} /><p>This complete programme uses the unit quartic on N=32, with interpolation contribution 5/8192; it is a finer grid than the earlier N=8 illustration. Checks occur at the program's stated cadence; 1450 is not a claim of the first possible successful update. The retained complete stdout is:</p><ReadingRegion label="Complete retained certificate output" kind="code"><pre>{numericalPdeExamples.certificate.expected}</pre></ReadingRegion></>;
    default: throw new Error(`No foundation drawing for ${id}`);
  }
}
