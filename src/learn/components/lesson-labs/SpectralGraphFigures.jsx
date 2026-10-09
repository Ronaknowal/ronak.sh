import { bridgeSpectrum, graphFromEdges, graphEnergy, cutMetrics, cutSweep, clusteringState, filterState, ridgePathState, diffusionState, symmetricSpectrum, multiply, dot } from '../../data/spectral-graph-models.js';
import recorded from '../../data/spectral-recorded-diagnostics.json';
import { SpectralFigure as Figure, Scene, Label, Arrow, Network, SignedBars, Matrix, EigenAgreement, SweepAxis, EmbeddingViews, GainCurve, DiffusionCurves, WeightedAtoms, WalkTransfer, sf, palette } from './SpectralGraphDrawings';

const signal = [1, 1, 1, -1, -1, -1];
const graph = bridgeSpectrum(.2);
const normalized = bridgeSpectrum(.2, true);
const path = graphFromEdges(3, [[0, 1, 1], [1, 2, 1]]);
const cluster = clusteringState();
const names = ['A', 'B', 'C', 'D', 'E', 'F'];
const figure = (name, label, caption, children) => <Figure name={name} label={label} caption={caption}>{children}</Figure>;

export function SpectralSignalGraphFigure() {
  return figure('signal', 'A signed signal on six graph nodes', 'Node positions arrange the example. Values live on nodes; edge labels give affinities. Only C–D joins opposite values.', <Network graph={graph} values={signal} sides={[0, 0, 0, 1, 1, 1]} label="ABC plus one, DEF minus one; bridge 0.2" />);
}
export function SpectralRowDifferenceFigure() {
  return figure('row', 'C row of L adds weighted differences', 'C has neighbors A, B and D. Its diagonal 2.2 sums their weights. Each row cell multiplies one node value; zero cells contribute nothing.', <>
    <Network graph={graph} values={signal} selected={[2]} label="Three neighbors of C" />
    <Matrix values={[graph.laplacian[2], signal]} rows={['L row C', 'x']} columns={names} label="Align row cells with node values" highlight={(i, j) => [0, 1, 2, 3].includes(j)} />
    <SignedBars values={[0, 0, .4]} names={['1(C−A)', '1(C−B)', '.2(C−D)']} scale={1} label="Three signed differences, all on the same scale" /><p>0 + 0 + 0.4 = (Lx)C. Increasing CD to 0.5 would make this row result 1.</p></>);
}
export function SpectralEdgeEnergyFigure() {
  return figure('energy', 'The only mismatching edge contributes weighted squared difference', 'Difference −2 has squared magnitude 4. Multiplying its area by bridge weight 0.2 gives 0.8. Counting both orientations gives 1.6, then the factor ½ returns 0.8.', <Scene height={265} label="Difference ruler and squared area weighted by 0.2"><line x1="65" y1="45" x2="265" y2="45" className="sg-axis" /><Label x={65} y={30}>−1</Label><Label x={165} y={30}>0</Label><Label x={265} y={30}>1</Label><line x1="65" y1="54" x2="265" y2="54" className="sg-bar" /><Label x={165} y={83}>xD − xC = −2</Label><rect x="65" y="105" width="130" height="130" className="sg-outline" /><rect x="65" y="209" width="130" height="26" className="sg-area" /><Label x={130} y={170}>4 units²</Label><Label x={240} y={224} small>.2 × 4 = .8</Label><Label x={165} y={260} small>Constant node values give zero difference.</Label></Scene>);
}
export function SpectralEigenEquationFigure() {
  return figure('eigen-equation', 'Compare Lu2 with lambda2 times u2', 'The two coordinate vectors overlap to numerical precision. A mode is a whole node pattern whose shape survives application of L, up to a scalar.', <EigenAgreement state={graph} />);
}
export function SpectralKernelComponentsFigure() {
  const disconnected = bridgeSpectrum(0), c = 1 / Math.sqrt(3);
  return figure('kernel', 'Two component indicators lie in the kernel', 'These normalized columns are supported on separate triangles. Applying L gives zero in every row. Rotating these two columns gives another basis of the same two-dimensional kernel.', <><Network graph={disconnected} sides={[0, 0, 0, 1, 1, 1]} label="Two disconnected triangles" /><Matrix values={names.map((_, i) => [i < 3 ? c : 0, i < 3 ? 0 : c, 0, 0])} columns={['q1', 'q2', 'Lq1', 'Lq2']} label="Normalized indicators and their images" /></>);
}
export function SpectralRayleighConstraintFigure() {
  const l2 = graph.values[1], l3 = graph.values[2];
  return figure('rayleigh', 'Energy contours on a two-mode unit-circle slice', 'This is the u2,u3 coefficient slice of the full five-dimensional space perpendicular to the constant mode. The unit circle imposes length one. Its lowest-energy points are ±u2.', <Scene height={305} label="Rayleigh energy contours meeting the unit circle at u2">{marker => <>
    <Arrow from={[35, 160]} to={[308, 160]} marker={marker} /><Arrow from={[170, 280]} to={[170, 32]} marker={marker} /><circle cx="170" cy="160" r="95" className="sg-outline" />{[l2, 1.5 * l2, 2 * l2].map((energy, i) => <ellipse key={i} cx="170" cy="160" rx={95 * Math.sqrt(energy / l2)} ry={95 * Math.sqrt(energy / l3)} className="sg-contour" />)}<circle cx="75" cy="160" r="5" className="sg-dot" /><circle cx="265" cy="160" r="5" className="sg-dot" /><Label x={75} y={190} small>−u2</Label><Label x={265} y={190} small>+u2</Label><Label x={308} y={147} small>c2</Label><Label x={193} y={34} small>c3</Label><Label x={149} y={184} small>0</Label><Label x={170} y={300} small>{sf(l2)} c2² + {sf(l3)} c3²</Label></>}</Scene>);
}
export function SpectralEdgeIncrementFigure() {
  return figure('edge-increment', 'One edge adds a rank-one Laplacian block', 'For δ ≥ 0, adding δ to CD increases this fixed vector’s energy by δ(uC−uD)². The four displayed cells are the complete added block; normalized L also changes its degree scaling.', <><Scene height={110} label="Added CD edge"><circle cx="90" cy="50" r="20" className="sg-node" /><circle cx="250" cy="50" r="20" className="sg-node" /><line x1="110" y1="50" x2="230" y2="50" className="sg-threshold" /><Label x={90} y={56}>C</Label><Label x={250} y={56}>D</Label><Label x={170} y={35}>δ</Label></Scene><Matrix values={[[1, -1], [-1, 1]]} rows={['C', 'D']} columns={['C', 'D']} label="δ times this 2 × 2 block; all other cells zero" /><SignedBars values={[1, -1]} names={['bC', 'bD']} label="Endpoint difference vector b" /></>);
}
export function SpectralCutVolumesFigure() {
  const metrics = cutMetrics(graph, [0, 1, 2]);
  return figure('cut-volumes', 'A cut counts crossings once and internal degree twice', 'All three internal unit edges contribute two degree endpoints each: 6 on each side. CD contributes 0.2 to each side’s volume, but crossing weight is only 0.2.', <><Network graph={graph} sides={[0, 0, 0, 1, 1, 1]} values={graph.degree} label="ABC versus DEF, with degrees beneath nodes" /><Scene height={155} label="Degree endpoints account for side volumes">{[0, 1].map(side => <g key={side}>{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={50 + i * 45} cy={40 + side * 70} r="7" fill={palette[side]} />)}<rect x="312" y={33 + side * 70} width="7" height="14" className="sg-area" /><Label x={170} y={68 + side * 70} small>{side ? 'DEF' : 'ABC'}: 6 × 1 + .2 = {sf(side ? metrics.otherVolume : metrics.volume)}</Label></g>)}</Scene></>);
}
export function SpectralIndicatorRelaxationFigure() {
  const u = signal.map(value => value / Math.sqrt(6));
  return figure('relaxation', 'The discrete cut indicator relaxes to a continuous eigenvector', 'Both vectors have zero sum and unit norm. The cut indicator has energy 0.133333; the continuous minimizer has energy λ2 ≈ 0.122027. A relaxed minimum does not certify every rounded cut.', <><SignedBars values={u} secondary={graph.vectors[1]} secondaryName="continuous u2" scale={.5} label="Cut indicator in amber and continuous u2 in cyan" /><p>Indicator energy {sf(graphEnergy(graph, u).total, 6)} → minimum {sf(graph.values[1], 6)}.</p></>);
}
export function SpectralDegreeCoordinatesFigure() {
  const v = normalized.vectors[1], y = v.map((value, i) => value / Math.sqrt(graph.degree[i]));
  return figure('degree-coordinates', 'Normalize the operator, then convert coordinates by degree', 'The normalized null direction is √d. The sweep uses y = D⁻½v, so its orthogonality is degree weighted. At C, divide vC by √2.2.', <><SignedBars values={graph.degree.map(Math.sqrt)} names={names.map(name => `√d${name}`)} label="The normalized constant direction" /><Matrix values={names.map((_, i) => [graph.degree[i], v[i], y[i]])} columns={['d', 'v2', 'y=v2/√d']} label="Every node’s degree-coordinate conversion" highlight={i => i === 2} /><p>Σdᵢyᵢ = {sf(dot(graph.degree, y), 8)}; Σdᵢyᵢ² = {sf(dot(graph.degree, y.map(value => value ** 2)), 8)}.</p></>);
}
export function SpectralNcutIndicatorFigure() {
  const y = signal.map(value => value / Math.sqrt(12.4));
  return figure('ncut-indicator', 'A degree-weighted unit indicator realizes Ncut', 'The two side volumes are equal, so each coordinate is ±1/√12.4. The six degree-weighted squared lengths sum to one. This indicator’s Rayleigh quotient equals Ncut.', <><SignedBars values={y} scale={.35} label="Signed degree-weighted cut indicator" /><SignedBars values={graph.degree.map((degree, i) => degree * y[i] ** 2)} scale={.2} names={names.map(name => `d${name} y${name}²`)} label="Six positive contributions to weighted unit length" /><p>Σdᵢyᵢ² = 1; yᵀLy = {sf(graphEnergy(graph, y).total, 6)} = Ncut.</p></>);
}
export function SpectralSweepFigure() {
  const state = cutSweep();
  return figure('sweep', 'Round the relaxed coordinate at a genuine gap', 'Coincident coordinates share a mark; positions are not jittered into an artificial order. The amber threshold selects the displayed set. Gaps of at most 10⁻⁹ stay grouped.', <><SweepAxis state={state} candidate={state.best} /><Network graph={state} sides={state.degree.map((_, i) => state.best.nodes.includes(i) ? 0 : 1)} label="Best retained sweep cut" /><Matrix values={state.candidates.map(item => [item.threshold, item.cut, item.conductance])} rows={state.candidates.map(item => item.nodes.map(i => names[i]).join(''))} columns={['threshold', 'cut', 'φ']} label="All retained default candidates" /></>);
}
export function SpectralIsolateOperatorFigure() {
  const isolated = graphFromEdges(3, [[0, 1, 1]]);
  return figure('isolate', 'An isolate changes the normalized operator convention', 'The product D⁻½LD⁻½ has an all-zero isolate row. Blindly using I−D⁻½AD⁻½ instead puts one on the isolate diagonal, changing the zero multiplicity.', <><Network graph={isolated} label="A unit pair and one isolate" /><Matrix values={isolated.normalized} label="Product convention: spectrum 0, 0, 2" /><Matrix values={[[1, -1, 0], [-1, 1, 0], [0, 0, 1]]} label="Blind identity convention: spectrum 0, 1, 2" highlight={(i, j) => i === 2 && j === 2} /></>);
}
export function SpectralCheegerBoundsFigure() {
  const nu = normalized.values[1], phi = cutMetrics(graph, [0, 1, 2]).conductance, entries = [[nu / 2, 'ν2/2', 57], [phi, 'φ* here', 99], [Math.sqrt(2 * nu), '√(2ν2)', 141]];
  return figure('cheeger', 'Compare the actual bottleneck with Cheeger bounds', 'For this graph the triangle split is the best conductance cut. The bounds constrain its quality; the close lower markers are labeled on separate rows rather than separated numerically.', <Scene height={210} label="Conductance interval from zero to one"><line x1="45" y1="180" x2="310" y2="180" className="sg-axis" /><Label x={45} y={205} small>0</Label><Label x={310} y={205} small>1</Label>{entries.map(([value, name, y]) => <g key={name}><line x1={45 + 265 * value} y1="180" x2={45 + 265 * value} y2={y + 10} className="sg-stem" /><circle cx={45 + 265 * value} cy="180" r="4" className="sg-dot" /><Label x={165} y={y} small>{name} = {sf(value, 6)}</Label></g>)}</Scene>);
}
export function SpectralWeightedMedianFigure() {
  const y = [-2, -1, 4 / 3], z = [-1, 0, 7 / 3], degrees = [1, 2, 3];
  return figure('weighted-median', 'Shift a weighted-mean-zero signal at its degree median', 'On edges AC=1, BC=2, the degrees are 1,2,3. Weighted mean of y is zero. Median −1 shifts to zero; strict negative support has volume 1, strict positive support 3, each at most half the total 6. Edge differences stay fixed. Atom area encodes degree; horizontal position encodes the actual scalar value.', <><Network graph={graphFromEdges(3, [[0, 2, 1], [1, 2, 2]])} values={y} label="Three-node weighted example" /><p>Before: degree-weighted median m = −1.</p><WeightedAtoms values={y} degrees={degrees} median={-1} label="Three weighted atoms at their original scalar coordinates; median minus one" /><p>After: z = y − m, with median zero.</p><WeightedAtoms values={z} degrees={degrees} median={0} label="The same weighted atoms shifted by one; median zero" /><Matrix values={y.map((value, i) => [degrees[i], value, z[i]])} columns={['degree', 'before y', 'shifted z']} label="Exact scalar shift preserves every edge difference" /><p>Energy remains 22; weighted squared length grows 34/3 → 52/3. The quotient decreases 33/17 → 33/26.</p></>);
}
export function SpectralThresholdDensityFigure() {
  const a = -3 / Math.sqrt(58), b = 7 / Math.sqrt(58), px = value => 95 + 200 * value, py = value => 185 - 65 * 2 * Math.abs(value);
  const intervals = [[a, 0, 'A inclusion: 9/58'], [0, b, 'C inclusion: 49/58'], [a, b, 'AC crossing: 1'], [0, b, 'BC crossing: 49/58']];
  return figure('threshold-density', 'The proof samples an actual signed threshold density', 'The V-shaped density 2|t| is supported only on [−3/√58, 7/√58]. Its two areas are 9/58 and 49/58, totaling one. Bars below use the same coordinate axis: a node is included on its displayed interval; an edge crosses between its endpoint values. B has value zero and inclusion probability zero.', <><Scene height={560} label="Density with actual node-inclusion and both edge-crossing intervals"><line x1="30" y1="185" x2="315" y2="185" className="sg-axis" /><path d={`M${px(a)} 185L${px(a)} ${py(a)}L95 185L${px(b)} ${py(b)}L${px(b)} 185Z`} className="sg-density" /><line x1="95" y1="40" x2="95" y2="190" className="sg-axis" /><Label x={px(a)} y={210} anchor="start" small>{sf(a, 3)}</Label><Label x={95} y={234} small>0</Label><Label x={px(b)} y={210} small>{sf(b, 3)}</Label><Label x={55} y={150} small>9/58</Label><Label x={215} y={138} small>49/58</Label>{intervals.map(([left, right, text], i) => <g key={text}><line x1={px(left)} y1={270 + i * 70} x2={px(right)} y2={270 + i * 70} className="sg-bar" /><line x1={px(left)} y1={257 + i * 70} x2={px(left)} y2={283 + i * 70} className="sg-stem" /><line x1={px(right)} y1={257 + i * 70} x2={px(right)} y2={283 + i * 70} className="sg-stem" /><Label x={170} y={308 + i * 70} small>{text}</Label></g>)}</Scene><p>Expected smaller-side volume = 1·9/58 + 3·49/58 = 78/29. Expected crossing weight = 1·1 + 2·49/58 = 78/29. Scaled energy is 99/29; the expectation bound compares (78/29)² ≤ 2·(99/29)·(78/29).</p></>);
}
export function RowDrawing({ state = cluster, selected = 2 }) {
  return <><Matrix values={state.raw} columns={['u1', 'u2', 'u3']} label="All three raw spectral columns, one row per node" highlight={i => i === selected} /><SignedBars values={state.raw[selected]} secondary={state.points[selected]} secondaryName="unit row" names={['coord 1', 'coord 2', 'coord 3']} scale={1} label="Selected raw row and its unit-length direction" /><p>{String.fromCharCode(65 + selected)} raw norm = {sf(state.rowNorms[selected], 7)}. Divide every amber coordinate by this same norm to obtain the cyan row; its squared length is {sf(dot(state.points[selected], state.points[selected]), 8)}.</p></>;
}
export function SpectralEmbeddingRowFigure() {
  return figure('row-embedding', 'Normalize a spectral row across all selected modes', 'The selected C row uses all three columns, not a two-dimensional drawing. Row normalization preserves its direction and changes its radius to one.', <RowDrawing />);
}
export function SpectralComponentRowRadiiFigure() {
  const disconnected = clusteringState(0);
  return figure('component-radii', 'Raw rows on component axes become unit directions', 'For three disconnected triangles each raw row has radius √(2/6)=1/√3. Row normalization sends the three components to distinct unit directions. Rotating the complete selected kernel rotates all rows together and preserves their distances.', <><SignedBars values={[1 / Math.sqrt(3), 1, 1 / Math.sqrt(3), 1, 1 / Math.sqrt(3), 1]} names={['ABC raw', 'ABC unit', 'DEF raw', 'DEF unit', 'GHI raw', 'GHI unit']} scale={1} label="Three component radii before and after normalization" /><Matrix values={[disconnected.points[0], disconnected.points[3], disconnected.points[6]]} rows={['ABC', 'DEF', 'GHI']} columns={['axis 1', 'axis 2', 'axis 3']} label="Representative unit row directions" /></>);
}
export function SpectralLloydTraceFigure() {
  return figure('lloyd', 'Assignments use all three row coordinates', 'Each view omits one coordinate; lines connect rows to their assigned center in that view. The algorithm’s squared distances and loss still use all three coordinates. Square marks are centroids. Nearby projected labels share a leader; all circles keep their exact coordinates.', <EmbeddingViews state={cluster} frame={cluster.frames[1]} />);
}
export function SpectralSeedEmptyCenterFigure() {
  const state = clusteringState(0, 'nearby'), frame = state.frames[1];
  return figure('empty-center', 'Nearby seeds can leave a center empty', 'Seeds A,B,D put two initial centers on the same component direction when bridges vanish. Exact distance ties choose the lower center index. Empty centers remain in place; their outlines are hollow.', <><Network graph={state} sides={frame.labels} selected={state.seeds} label="Disconnected graph with nearby seed nodes selected" /><EmbeddingViews state={state} frame={frame} /><p>Empty center indices: {frame.empty.map(i => i + 1).join(', ')}. Occupied centers update to their assigned means.</p></>);
}
export function SpectralFourierSumFigure() {
  const basis = [[1, 1, 1].map(x => x / Math.sqrt(3)), [1, 0, -1].map(x => x / Math.sqrt(2)), [1, -2, 1].map(x => x / Math.sqrt(6))], input = [0, 1, 0], coefficients = basis.map(vector => dot(vector, input));
  return figure('fourier-sum', 'A middle-node impulse is the sum of full mode contributions', 'The λ=1 coefficient vanishes. The constant contribution plus the λ=3 contribution reconstructs the middle impulse exactly; squared coefficients sum to signal energy one.', <><Network graph={path} values={input} path label="Input zero, one, zero" />{basis.map((vector, i) => <div key={i}><p>λ = {[0, 1, 3][i]}; coefficient {sf(coefficients[i], 6)}</p><SignedBars values={vector.map(value => value * coefficients[i])} names={['A', 'B', 'C']} scale={1} label={`Whole contribution of mode ${i + 1}`} /></div>)}<SignedBars values={input} scale={1} label="Sum reconstructs the input" /></>);
}
export function FilterDrawing({ state, kind, amount, controls }) {
  return <><GainCurve values={state.values} gains={state.gains} kind={kind} amount={amount} label={`${kind} gains at all six graph eigenvalues`} /><SignedBars values={state.signal} secondary={state.output} secondaryName="filtered output" label="Input in amber and output in cyan on one scale" />{controls}<Matrix values={state.coefficients.map((coefficient, i) => [state.values[i], coefficient, state.gains[i], coefficient * state.gains[i]])} rows={state.values.map((_, i) => `mode ${i + 1}`)} columns={['λ', 'coefficient', 'gain', 'retained']} label="Every mode’s coefficient and applied gain" /></>;
}
export function SpectralHeatGainFigure() {
  return figure('heat', 'Heat suppresses high-frequency mode coefficients continuously', 'The curve is e⁻ᵗλ at t=1; six points are the actual eigenvalues of this graph. The output sums all gained contributions. No coefficient is silently discarded.', <FilterDrawing state={filterState()} kind="heat" amount={1} />);
}
export function SpectralProjectionGainFigure() {
  return figure('projection', 'An orthogonal projection keeps two complete lowest modes', 'Gains are one for modes 1–2 and zero for modes 3–6. The discarded squared norm is the sum of the omitted squared coefficients. A cutoff inside a repeated eigenspace depends on the chosen basis.', <FilterDrawing state={filterState(.2, 'noisy', 'cutoff', 2)} kind="cutoff" amount={2} />);
}
export function RidgeDrawing({ state }) {
  return <><Network graph={state} values={state.output} path label="Ridge-smoothed middle impulse" /><Matrix values={state.normal} label="I + αL: these rows multiply the output to equal input (0,1,0)" /><GainCurve values={state.values} gains={state.gains} kind="ridge" amount={state.alpha} label="Ridge gain 1 divided by one plus alpha lambda" /><p>Squared fit = {sf(state.fit, 6)}; edge energy = {sf(state.energy, 6)}; fit + α × energy = <strong>{sf(state.objective, 6)}</strong>.</p></>;
}
export function SpectralRidgeSolveFigure() {
  return figure('ridge', 'Solve the smoothing normal equations on a unit path', 'At α=1, the middle impulse becomes (¼,½,¼). The fit cost is 3/8 and edge energy 1/8, totaling 1/2. The gain curve describes the same solution in eigen-coordinates.', <RidgeDrawing state={ridgePathState()} />);
}
export function SpectralPolynomialLocalityFigure() {
  return figure('polynomial', 'Each multiplication by L reaches at most one additional hop', 'Starting at A, LeA reaches B; L²eA reaches C. Node positions show this path’s connectivity. Finite polynomial degree limits support; the full heat exponential contains arbitrarily high powers.', <>{[[1, 0, 0], [1, -1, 0], [2, -3, 1]].map((values, i) => <div key={i}><p>{['eA', 'LeA', 'L²eA'][i]}</p><Network graph={path} values={values} selected={Array.from({ length: i + 1 }, (_, j) => j)} path label={`Support after ${i} applications of L`} /></div>)}</>);
}
export function SpectralDiffusionTrajectoriesFigure() {
  return figure('diffusion', 'Six trajectories approach the connected component mean', 'Initial values are (4,1,1,−2,−2,1), with total 3. For any positive bridge the exact limit is 0.5 at every node. Finite-time curves illustrate approach, not arrival at infinite time.', <DiffusionCurves state={diffusionState()} />);
}
export function SpectralWalkMassFigure() {
  return figure('walk', 'A two-node ordinary walk alternates; a lazy walk settles', 'Each row of nodes is a time layer. Arrow labels give transition probability / transferred mass. Amber routes carry positive mass; dim dashed routes have zero mass at their source. Columns in the tables are mass distributions. Ordinary swapping has eigenvalue −1 and oscillates. Averaging with identity changes that eigenvalue to zero and removes this alternating mode.', <><p>Ordinary walk: all mass crosses at each step.</p><WalkTransfer /><Matrix values={[[1, 0, 1], [0, 1, 0]]} rows={['A mass', 'B mass']} columns={['t0', 't1', 't2']} label="Ordinary column-mass walk" /><p>Lazy walk: half stays, half crosses at each step.</p><WalkTransfer lazy /><Matrix values={[[1, .5, .5], [0, .5, .5]]} rows={['A mass', 'B mass']} columns={['t0', 't1', 't2']} label="Lazy half-stay, half-cross walk" /></>);
}
export function SpectralRepeatedProjectorFigure() {
  const p = [[2 / 3, -1 / 3, -1 / 3], [-1 / 3, 2 / 3, -1 / 3], [-1 / 3, -1 / 3, 2 / 3]];
  const rotated = [1 / 2 + 1 / Math.sqrt(12), -1 / 2 + 1 / Math.sqrt(12), -1 / Math.sqrt(3)];
  return figure('repeated-projector', 'A full repeated-eigenvalue projector survives basis rotation', 'This coefficient plane is the triangle’s λ=3 eigenspace, not a map of graph node positions. Rotating its two basis arrows by π/4 leaves the full projector unchanged; retaining only one arrow changes a partial projection.', <><Scene height={245} label="Two orthonormal frames in the same eigenspace plane">{marker => <><Arrow from={[165, 155]} to={[165, 50]} marker={marker} /><Arrow from={[165, 155]} to={[270, 155]} marker={marker} /><Arrow from={[165, 155]} to={[239, 81]} marker={marker} className="sg-cyan" /><Arrow from={[165, 155]} to={[91, 81]} marker={marker} className="sg-cyan" /><path d="M165 85A70 70 0 0 1 215 105" className="sg-contour" /><Label x={217} y={67} small>π/4</Label><Label x={165} y={230} small>Two bases; one eigenspace.</Label></>}</Scene><Matrix values={p} label="Full projector I − 11ᵀ/3, before and after rotation" /><SignedBars values={[.5, -.5, 0]} secondary={rotated.map(value => value * rotated[0])} secondaryName="rotated one-direction projector of eA" scale={1} label="Partial projection of eA before and after basis rotation" /><p>The complete projection remains (2/3, −1/3, −1/3) in both bases.</p></>);
}
export function SpectralBridgeCurrentFigure() {
  return figure('bridge-current', 'One ampere across the bridge needs five volts', 'Inject at C, extract at grounded D. All ABC potentials are 5 V and all DEF potentials 0 V. Internal edges carry zero current; CD conductance 0.2 S carries 0.2 × 5 = 1 A.', <Network graph={graph} values={[5, 5, 5, 0, 0, 0]} selected={[2, 3]} edgeText={(i, j) => i === 2 && j === 3 ? '1 A' : '0 A'} edgeCurrent={(i, j) => i === 2 && j === 3 ? 1 : 0} label="Bridge current and node voltages" />);
}
export function SpectralParallelCircuitFigure() {
  const triangle = graphFromEdges(3, [[0, 1, 1], [0, 2, 1], [1, 2, 1]]);
  return figure('parallel-circuit', 'Direct and two-edge routes divide the injected current', 'With B grounded, VA=2/3 and VC=1/3. Direct AB carries 2/3 A; the two-edge A–C–B route carries 1/3 A. One ohm in parallel with two ohms gives RAB=2/3 Ω. An attached bridge with no extraction carries no current.', <Network graph={triangle} values={[2 / 3, 0, 1 / 3]} selected={[0, 1]} edgeText={(i, j) => i === 0 && j === 1 ? '2/3 A' : '1/3 A'} edgeCurrent={(i, j) => i === 0 ? j === 1 ? 2 / 3 : 1 / 3 : -1 / 3} label="Triangle potentials with two parallel current routes" />);
}
export function SpectralResistanceModesFigure() {
  const injection = [1, 0, 0, 0, 0, -1], potentials = [19 / 3, 6, 17 / 3, 2 / 3, 1 / 3, 0];
  const terms = graph.vectors.slice(1).map((vector, i) => (vector[0] - vector[5]) ** 2 / graph.values[i + 1]);
  return figure('resistance-modes', 'Grounded potentials and inverse-eigenvalue contributions agree', 'A-to-F resistance is 2/3 + 5 + 2/3 = 19/3 Ω. Pinning F removes the constant ambiguity. The mode sum divides endpoint differences by each positive eigenvalue; a cross-component pair would have infinite resistance.', <><Network graph={graph} values={potentials} selected={[0, 5]} edgeCurrent={(i, j, weight) => weight * (potentials[i] - potentials[j])} label="One-ampere A to F solve with F grounded" /><Matrix values={graph.laplacian.slice(0, 5).map(row => row.slice(0, 5))} rows={names.slice(0, 5)} columns={names.slice(0, 5)} label="Grounded five-row operator; target (1,0,0,0,0)" /><SignedBars values={terms} names={terms.map((_, i) => `mode ${i + 2}`)} label="Positive resistance contributions from all nonzero modes" /><p>Sum {sf(terms.reduce((a, b) => a + b, 0), 8)} Ω. Full L times these potentials = ({multiply(graph.laplacian, potentials).map(value => sf(value, 4)).join(', ')}), matching injection ({injection.join(', ')}).</p></>);
}
export function SpectralSparseModesFigure() {
  const row = cluster.normalized[2], indices = row.flatMap((value, i) => value ? [i] : []), data = indices.map(i => row[i]);
  const counts = cluster.normalized.map(values => values.filter(Boolean).length), ptr = [0]; counts.forEach(count => ptr.push(ptr.at(-1) + count));
  const input = [2, -1, 3, 0, 1, -2, 4, 0, 1], products = indices.map((node, i) => input[node] * data[i]);
  return figure('sparse-modes', 'CSR stores occupied normalized-Laplacian cells', 'The C row’s columns and data are a slice between row pointers 6 and 10. Its dot product touches four cells, not nine. Requesting three modes returns nine rows by three columns; iteration count still depends on convergence.', <><Matrix values={[ptr]} rows={['rowptr']} columns={ptr.map((_, i) => i)} label="Nine-row CSR start and end offsets" /><Matrix values={[indices, data, indices.map(node => input[node]), products]} rows={['indices C', 'data C', 'x at index', 'product']} columns={indices.map((_, i) => `slot ${i}`)} label="C row: occupied indices, data and actual matvec products" /><SignedBars values={products} names={indices.map(i => `column ${i}`)} label="Signed contributions from the four occupied cells" /><p>Input x = ({input.join(', ')}). Sum these four products to obtain (𝓛x)C = {sf(products.reduce((a, b) => a + b, 0), 7)}.</p><Matrix values={cluster.raw} columns={['lowest 1', 'lowest 2', 'lowest 3']} label="Requested sparse result shape: 9 × 3" /><p>One matvec stores/touches O(n+m) cells. Dense eigendecomposition additionally allocates n² entries; requesting fewer modes does not make convergence automatic.</p></>);
}
export function SpectralEmbeddingConventionFigure() {
  const generalized = cluster.raw[2].map(value => value / Math.sqrt(cluster.degree[2]));
  return figure('embedding-convention', 'Two declared spectral embeddings use different row scalings', 'A generalized embedding divides this C row by √dC. A unit-row embedding divides it by its own three-coordinate length. These are different representations even when a particular fixture yields the same memberships.', <><SignedBars values={generalized} secondary={cluster.points[2]} secondaryName="unit row" scale={1} names={['coordinate 1', 'coordinate 2', 'coordinate 3']} label="Generalized coordinates in amber and unit row in cyan" /><Matrix values={[cluster.raw[2], generalized, cluster.points[2]]} rows={['U row C', 'D⁻½U row C', 'unit U row C']} columns={['1', '2', '3']} label="Exact convention comparison" /></>);
}
export function RecordedCutDrawing({ affinity = 'equal' }) {
  const item = recorded.result[affinity], member = new Set(item.best.members), coordinates = Array(34);
  item.coordinate_order.forEach((node, i) => { coordinates[node] = item.coordinate_values[i]; });
  const edges = recorded.edges.filter(([a, b]) => member.has(a) !== member.has(b));
  const min = Math.min(...coordinates), max = Math.max(...coordinates), py = value => 45 + 550 * (max - value) / (max - min);
  // Rank rows remain a complete readable companion to true-coordinate positions.
  return <><Scene height={650} label={`All thirty-four recorded scalar coordinates for ${affinity} affinities`}><line x1="145" y1="35" x2="145" y2="610" className="sg-axis" />{item.coordinate_order.map((node, i) => <g key={node}><circle cx={145} cy={py(coordinates[node])} r="3" fill={member.has(node) ? palette[0] : palette[1]} /><line x1="148" y1={py(coordinates[node])} x2={210} y2={45 + i * 17} className="sg-coordinate-link" /><Label x={217} y={50 + i * 17} anchor="start" small>{node}: {sf(coordinates[node], 3)}</Label></g>)}<line x1="40" y1={py(item.best.threshold)} x2="170" y2={py(item.best.threshold)} className="sg-threshold" /><Label x={30} y={py(item.best.threshold) - 10} anchor="start" small>threshold</Label><Label x={170} y={640} small>Left: real coordinate. Right: ranked labels.</Label></Scene><Matrix values={edges.map(([a, b, weight]) => [a, b, affinity === 'equal' ? 1 : weight])} rows={edges.map((_, i) => i + 1)} columns={['source ID', 'target ID', 'weight']} label="Every crossing edge, with stable source node IDs" /><p>{edges.length} crossing edges; crossing weight {item.best.crossing}; side volumes {item.best.volumes.join(' and ')}; φ = {sf(item.best.conductance, 7)}.</p></>;
}
export function SpectralRecordedCutFigure() {
  return figure('recorded', 'Observed network cut under two declared affinities', 'This offline carrier retains source node IDs and interaction context. Equal versus context affinities select the same membership on this example, while the complete operators and low-subspace projectors differ. Neither partition is presented as historical faction truth.', <><p>Equal affinity</p><RecordedCutDrawing /><p>Context affinity</p><RecordedCutDrawing affinity="context" /><p>Two-mode projector difference ‖Pequal−Pcontext‖F = {sf(recorded.result.low_subspace_projector_difference, 7)}. Node ID 0 is the separately declared singleton baseline.</p></>);
}
