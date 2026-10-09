import { finiteElement1D, rectangleStencil, triangleElement, twoGridCorrection, poissonProblem } from '../../data/numerical-pde-models.js';
import { colors, correctionStages, Ledger, Matrix, Mesh, Plot, ReadingRegion, Scene, Stencil, Triangle, number } from './NumericalPdeReadingPrimitives.jsx';
import { RectangleMesh, Squares, WorkTimeline } from './NumericalPdeGeometry.jsx';
import { BudgetBars } from './NumericalPdeFoundationFigures.jsx';
import { mechanismProgram } from '../../data/numerical-pdes-mechanism-program.js';

const nodes = [0, .25, .5, .75, 1];
const quadratic = x => x * (1 - x);
const sample = (fn, knots = nodes) => [...new Set([...Array.from({ length: 129 }, (_, j) => j / 128), ...knots])].sort((a, b) => a - b).map(x => [x, fn(x)]);
const hat = (x, j, mesh = nodes) => x < mesh[j - 1] || x > mesh[j + 1] ? 0 : x <= mesh[j] ? (x - mesh[j - 1]) / (mesh[j] - mesh[j - 1]) : (mesh[j + 1] - x) / (mesh[j + 1] - mesh[j]);

export function SparsePattern({ matrix, label }) {
  const entries = matrix.flatMap((row, i) => row.flatMap((value, j) => value === 0 ? [] : [{ i, j, value }]));
  return <div className="npde-reading-object"><p>{label}</p><Scene label={label} height={205}>{width => {
    const cell = Math.min((width - 28) / matrix.length, 174 / matrix.length);
    return <><rect x="14" y="12" width={cell * matrix.length} height={cell * matrix.length} fill="none" stroke={colors.muted} />{entries.map(({ i, j, value }) => <rect key={`${i},${j}`} x={14 + j * cell} y={12 + i * cell} width={cell} height={cell} fill={value > 0 ? colors.computed : colors.defect} fillOpacity=".75" stroke="#090b0d" />)}</>;
  }}</Scene><p>Columns increase left to right; rows increase top to bottom, both 0…{matrix.length - 1}. Amber: positive entries, pink: negative entries; blank positions are exactly zero. All {entries.length} nonzero entries retain their row-column addresses below.</p><Ledger label="Every nonzero coefficient" headers={['Row', 'Column', 'Value']} rows={entries.map(({ i, j, value }) => [i, j, value])} /></div>;
}

function rectangleMatrix() {
  const matrix = Array.from({ length: 12 }, () => Array(12).fill(0));
  for (let j = 1; j < 4; j++) for (let i = 1; i < 5; i++) {
    const r = rectangleStencil({ xLength: 2, selectedX: i, selectedY: j });
    for (const p of r.neighbors) if (!p.boundary) matrix[r.selectedIndex][p.index] = p.coefficient;
  }
  return matrix;
}

function ElementAssembly() {
  const r = finiteElement1D();
  return <><Mesh nodes={nodes} values={r.values} selected={2} label="Shared physical nodes identify where neighboring local matrices add" /><Ledger label="Every local-to-global address map" headers={['Element', 'Local 0 → global', 'Local 1 → global', 'Local factor k/h']} rows={r.elements.map((e, j) => [j, j, j + 1, e.factor])} /><Matrix label="Complete assembled five-node stiffness before boundary elimination" values={r.stiffness} /><Ledger label="Complete assembled distributed load" headers={['Global node', 'Load']} rows={r.load.map((value, j) => [j, value])} /><p>At every shared node, the two adjacent positive diagonal contributions add. The three interior diagonal entries are 8 and their adjacent coefficients are −4.</p></>;
}

export function ElementFigure({ id }) {
  switch (id) {
    case 'N44': return <><Plot label="A test perturbation vanishes at prescribed endpoints but samples the interior source" series={[{ label: 'Probe v=x(1−x)', color: colors.reference, points: sample(quadratic) }]} markers={[[0, 0], [1 / 3, 2 / 9], [1, 0]]} /><Stencil label="Unit point source acts on the actual probe value" operands={[2 / 9]} positions={[1 / 3]} coefficients={[1]} result={2 / 9} /><p>The point work is v(1/3)=2/9, not the integral of v. A distributed source 2 instead gives ∫2v dx=1/3. Both use the same zero-trace test function; a nonzero trial boundary is handled by a lift.</p></>;
    case 'N45': return <><Plot label="Complete physical support of the middle hat" series={[{ label: 'φ₂: support [1/4,3/4]', color: colors.computed, points: [[0, 0], [.25, 0], [.5, 1], [.75, 0], [1, 0]] }]} markers={[[.25, 0], [.5, 1], [.75, 0]]} /><Ledger label="Actual open-cell hat derivatives" headers={['Cell', 'Length', 'Slope']} rows={[["(1/4,1/2)", .25, 4], ['(1/2,3/4)', .25, -4], ['Outside support', 'not applicable', 0]]} /></>;
    case 'N46': return <><Mesh nodes={[.25, .5]} values={[0, 1]} label="One quarter-cell, two local basis values and one constant mode" /><Matrix label="Local derivative-product integrals: (1/h)[[1,−1],[−1,1]]" values={[[4, -4], [-4, 4]]} /><Stencil label="First local row on the constant vector" operands={[1, 1]} coefficients={[4, -4]} result={0} /><p>The second row also returns 0. A constant coefficient vector has no local derivative or local energy; conductivity multiplies the whole matrix.</p></>;
    case 'N47': return <><Plot label="Two neighboring shapes evaluate the same point at 1/3" xDomain={[.25, .5]} series={[{ label: 'Left shape', color: colors.field, points: [[.25, 1], [.5, 0]] }, { label: 'Right shape', color: colors.computed, points: [[.25, 0], [.5, 1]] }]} markers={[[1 / 3, 2 / 3], [1 / 3, 1 / 3]]} /><Ledger label="Distributed integral and point evaluation are different loads" headers={['Operation', 'Left local load', 'Right local load', 'Sum']} rows={[["Source 2 on this quarter-cell", .25, .25, .5], ['Unit source at 1/3', 2 / 3, 1 / 3, 1]]} /></>;
    case 'N48': return <ElementAssembly />;
    case 'N50': {
      const r = finiteElement1D({ sourceKind: 'point', source: 1 });
      return <><Plot label="Point source: whole exact Green tent versus its quarter-mesh reconstruction" series={[{ label: 'Exact continuous tent', color: colors.field, points: r.curve.map(p => [p.x, p.exact]) }, { label: 'P1 reconstruction', color: colors.computed, points: r.curve.map(p => [p.x, p.numerical]) }]} markers={[[1 / 3, 2 / 9], [1 / 3, 1 / 6]]} /><p>Exact peak 2/9 and reconstructed value 1/6 differ by 1/18. Both curves use the same physical x and temperature scales. Inserting 1/3 as a node captures the corner exactly in this constant-coefficient one-dimensional case.</p></>;
    }
    case 'N51': {
      const r = finiteElement1D({ nodes: [0, .2, .6, 1], left: 2, right: -1 });
      return <><Mesh nodes={r.nodes} values={r.values} label="Actual unequal elements, prescribed ends and two solved interior values" /><Matrix label="Symmetric reduced stiffness" values={r.stiffness.slice(1, -1).map(row => row.slice(1, -1))} /><Ledger label="Eliminate prescribed columns in the same addressed rows" headers={['Row', 'Original load', 'Boundary column subtraction', 'Reduced RHS', 'Solved value']} rows={[[1, .6, 10, 10.6, r.values[1]], [2, .8, -2.5, -1.7, r.values[2]]]} /></>;
    }
    case 'N52': return <><Plot label="Error derivative on each open cell; mean zero within every cell" yLabel="u′−Uₕ′" series={[{ label: 'Derivative error', color: colors.defect, points: nodes.slice(0, -1).flatMap((x, j) => [[x, .25], [nodes[j + 1], -.25]]) }]} /><Ledger label="Pair with the complete middle hat gradient" headers={['Cell', 'Hat derivative', 'Integral of error derivative', 'Energy pairing']} rows={[[0, 0, 0, 0], [1, 4, 0, 0], [2, -4, 0, 0], [3, 0, 0, 0]]} /><p>Each derivative-error integral vanishes, hence so does its pairing with any piecewise-constant hat derivative. Vertical drawn jumps mark the one-sided limits, not a classical derivative at the nodes.</p></>;
    case 'N53': return <><Plot label="A finite-space perturbation added to the Galerkin field" series={[{ label: 'Quadratic u', color: colors.field, points: sample(quadratic) }, { label: 'Uₕ nodal interpolant', color: colors.computed, points: nodes.map(x => [x, quadratic(x)]) }, { label: 'Trial Uₕ+.1φ₂', color: colors.reference, points: nodes.map((x, j) => [x, quadratic(x) + .1 * (j === 2 ? 1 : 0)]) }]} /><Squares label="Energy Pythagoras: squared Galerkin error and squared finite-space perturbation" values={[Math.sqrt(1 / 48), Math.sqrt(.08)]} /><p>At h=1/4, ||u−Uₕ||²ₐ=1/48. The perturbation contributes (.1)²×8=.08. Orthogonality makes the cross term zero, so this trial's squared error is 1/48+.08; the drawing does not assert Euclidean perpendicular spatial curves.</p></>;
    case 'N54': return <><Plot label="One physical quarter-cell: field gap t(h−t) and its derivative h−2t" xDomain={[0, .25]} xLabel="Local coordinate t" yLabel="Error or derivative error" series={[{ label: 'Field gap', color: colors.defect, points: Array.from({ length: 65 }, (_, j) => { const t = j / 256; return [t, t * (.25 - t)]; }) }, { label: 'Derivative gap', color: colors.reference, points: [[0, .25], [.25, -.25]] }]} /><Ledger label="Exact whole-domain errors of the same quadratic" headers={['N', 'Maximum', 'L2', 'Energy', 'Nodal']} rows={[4, 8, 16].map(n => [n, 1 / (4 * n * n), 1 / (n * n * Math.sqrt(30)), 1 / (n * Math.sqrt(3)), 0])} /></>;
    case 'N55': return <><Plot label="Regularity contrast: smooth quadratic and a point-source corner" series={[{ label: 'Smooth quadratic', color: colors.field, points: sample(quadratic) }, { label: 'Green tent at 1/3', color: colors.defect, points: [[0, 0], [1 / 3, 2 / 9], [1, 0]] }]} /><div className="npde-pair">{[[[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [0, .05]]].map((vertices, j) => <Triangle key={j} vertices={vertices} gradients={triangleElement(vertices).gradients} label={j ? 'Thin triangle: actual altitude .05 and larger gradients' : 'Reference triangle: altitude 1'} />)}</div><p>A corner does not have the same global second derivative as a smooth quadratic. A thin element changes gradient magnitudes through its inverse map. Coercivity, regularity, mesh quality, quadrature and solve error remain separate assumptions.</p></>;
    case 'N56': return <RectangleMesh result={rectangleStencil({ xLength: 2 })} />;
    case 'N58': return <><RectangleMesh result={rectangleStencil({ xLength: 2 })} /><Ledger label="Actual selected star row on the constant field" headers={["Neighbor", "Coefficient", "Operand", "Contribution"]} rows={[["Center", 44.5, 1, 44.5], ["Left", -6.25, 1, -6.25], ["Right", -6.25, 1, -6.25], ["Bottom", -16, 1, -16], ["Top", -16, 1, -16], ["Sum", "", "", 0]]} /><p>The coefficient ledger follows center, left, right, bottom, top. Only interior-addressed entries remain in the matrix; prescribed neighbor values move to the RHS.</p></>;
    case 'N59': return <><RectangleMesh result={rectangleStencil({ xLength: 2 })} /><div className="npde-pair"><Matrix label="Aₓ, four horizontal unknowns" values={Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => i === j ? 12.5 : Math.abs(i - j) === 1 ? -6.25 : 0))} /><Matrix label="Aᵧ, three vertical unknowns" values={[[32, -16, 0], [-16, 32, -16], [0, -16, 32]]} /></div><SparsePattern matrix={rectangleMatrix()} label="Iᵧ⊗Aₓ + Aᵧ⊗Iₓ: actual x-fast twelve-row pattern" /><p>Each four-entry horizontal block has the same Aₓ; the vertical term links matching horizontal addresses in adjacent blocks. This is the same physical stencil, expressed in x-fast vector order.</p></>;
    case 'N60': return <div className="npde-pair">{[[[0, 0], [1, 0], [0, 1]], [[0, 0], [2, 0], [0, 3]]].map((vertices, j) => {
      const r = triangleElement(vertices);
      return <div key={j}><Triangle label={j ? 'Physical triangle: width 2, height 3, area 3' : 'Reference triangle: area 1/2'} vertices={vertices} gradients={r.gradients} /><Matrix label="Actual area-weighted gradient products" values={r.stiffness} /></div>;
    })}</div>;
    case 'N62': {
      const matrix = rectangleMatrix(), rowPointers = [0], columnIndices = [], values = [];
      matrix.forEach(row => { row.forEach((value, j) => { if (value !== 0) { columnIndices.push(j); values.push(value); } }); rowPointers.push(values.length); });
      return <><SparsePattern matrix={matrix} label="All 46 occupied slots of the actual 12×12 rectangular operator" /><Ledger label="Actual compressed sparse row arrays" headers={['Array', 'Complete contents']} rows={[["row pointers (13)", rowPointers], ['column indices (46)', columnIndices], ['values (46)', values]]} /><p>Each row pointer pair selects its consecutive addressed coefficient entries. Elimination fill can add entries beyond this original stencil; no universal linear-work two-dimensional factorization claim is implied.</p></>;
    }
    case 'N63': return <>{[1, 7].map(k => {
      const r = twoGridCorrection(k);
      return <div key={k}><Plot label={`Whole mode ${k} before and after one weighted-Jacobi step`} series={[{ label: 'Initial mode', color: correctionStages.initial, points: r.initial.map((v, j) => [j / 8, v]) }, { label: 'Smoothed mode', color: correctionStages.smooth, dash: '9 3', points: r.smooth.map((v, j) => [j / 8, v]) }]} /><p>ω=2/3; exact mode factor={number(1 - 4 / 3 * Math.sin(k * Math.PI / 16) ** 2)}. Both endpoints and all seven signed interior entries remain present.</p></div>;
    })}</>;
    case 'N64': {
      const r = twoGridCorrection();
      return <><Plot label="Each coarse coefficient has a whole fine-grid prolongation column" series={Array.from({ length: 3 }, (_, j) => ({ label: `Coarse basis ${j + 1}`, color: [colors.field, colors.computed, colors.reference][j], points: [[0, 0], ...r.prolongation.map((row, i) => [(i + 1) / 8, row[j]]), [1, 0]] }))} /><Matrix label="Full prolongation P (seven fine by three coarse)" values={r.prolongation} /><Matrix label="Coarse operator R A P; R=Pᵀ/2" values={[[32, -16, 0], [-16, 32, -16], [0, -16, 32]]} /><p>Prolong first, apply the actual fine operator second, restrict third. Solve the coarse residual equation and subtract its prolonged result; do not independently invent a coarse coordinate convention.</p></>;
    }
    case 'N66': {
      const mesh = [0, .1, .35, .7, 1], r = finiteElement1D({ nodes: mesh, left: 1, right: 2 });
      return <><Mesh nodes={mesh} values={r.values} selected={2} label="Complete nonuniform physical mesh and first solved load" /><SparsePattern matrix={r.stiffness.slice(1, -1).map(row => row.slice(1, -1))} label="Same two adjacent coupling bands from both assembly routes" /><Ledger label="Lower band storage and full load" headers={['Stored column', 'Main diagonal', 'Lower neighbor', 'Reduced RHS', 'Solution']} rows={r.rhs.map((v, j) => [j, r.stiffness[j + 1][j + 1], j < r.rhs.length - 1 ? r.stiffness[j + 2][j + 1] : 0, v, r.values[j + 1]])} /><p>Row 0 of the lower-band array stores the main diagonal; row 1 stores the lower neighbor at its column. The last unused neighbor slot is 0, not an additional matrix coefficient.</p></>;
    }
    case 'N67': {
      const mesh = [0, .1, .35, .7, 1];
      return <>{[.4, .35].map(point => {
        const r = finiteElement1D({ nodes: mesh, sourceKind: 'point', source: 1, point });
        return <div key={point}><Plot label={`New point RHS at ${point}; same stiffness and factorization`} series={[{ label: 'Exact Green tent', color: colors.field, points: r.curve.map(p => [p.x, p.exact]) }, { label: 'Computed P1', color: colors.computed, points: mesh.map((x, j) => [x, r.values[j]]) }]} /><Ledger label="Complete changed interior load and solution" headers={['Node', 'Position', 'Load', 'Value']} rows={r.values.slice(1, -1).map((v, j) => [j + 1, mesh[j + 1], r.rhs[j], v])} /></div>;
      })}<p>At .4, the load weights are 6/7 and 1/7; the solved values are .06,.21,.12. The second source is an actual mesh node; changing only load or its strength leaves the stiffness factors available for reuse.</p></>;
    }
    case 'N68': {
      const r = poissonProblem({ intervals: 64, length: 1.5, scale: 2, left: 2, right: -1 });
      return <><Plot label="Whole changed continuous field and computed reconstruction on the physical rod" series={[{ label: 'Declared continuous quartic plus endpoint lift', color: colors.field, points: r.curve.map(p => [p.x, p.exact]) }, { label: 'Computed P1 reconstruction', color: colors.computed, points: r.nodes.map((x, j) => [x, r.values[j]]) }]} /><p>All curves cover actual length 3/2. Source scale 2 and endpoints 2,−1 belong to this same problem; they are not changes only to the plotted axis.</p></>;
    }
    case 'N69': return <><BudgetBars label="Changed N=64 field tolerance: mesh part and remaining algebraic part" amounts={[45 / 65536, .001 - 45 / 65536]} names={['Combined mesh bound 45/65536', 'Positive remainder of tolerance .001']} /><Ledger label="Every scale used to convert the remaining budget" headers={['Quantity', 'Value']} rows={[["Physical h", 3 / 128], ['Inverse bound L²/8', 9 / 32], ['Residual allowance', 2567 / 2304000]]} /><p>Divide the remaining field allowance by 9/32 to obtain the physical residual threshold. The unit-length inverse bound would target a different problem.</p></>;
    case 'N70': return <><WorkTimeline reports={[{ budget: 200, used: 200, success: false }, { budget: 12000, used: 7700, success: true }]} /><Ledger label="Retained actual changed-program decisions" headers={['Budget', 'Updates used', 'Field bound', 'Certified']} rows={[[200, 200, 5.810567487, 'no'], [12000, 7700, .000994986, 'yes']]} /><p>These are recorded complete-program reports, not a fresh iteration campaign. The sufficient successful checkpoint is not claimed to be the first possible success. Finite failure is retained alongside the declared field, norm and tolerance.</p></>;
    default: throw new Error(`Unowned numerical element figure ${id}`);
  }
}
