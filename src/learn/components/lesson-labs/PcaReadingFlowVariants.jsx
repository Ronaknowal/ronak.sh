import { diagonal, dot, formatNumber, originalRows, recordColors, recordNames } from "../../data/pca-geometry.js";
import { kernelFeatures, kernelGrandMean, kernelMeans, kernelQuery, kernelTraining, pcpFirstStep, sparseServing, thresholdComparison } from "../../data/pca-variants.js";
import { Arrow, Controls, Drawing, Figure, Matrix, NumberField, Point, useNumericDrafts } from './PcaReadingFlowPrimitives.jsx';

export function KernelCentering() {
  const raw = kernelFeatures.map(value => kernelFeatures.map(other => value * other));
  const centered = raw.map((row, index) => row.map((value, column) => value - kernelMeans[index] - kernelMeans[column] + kernelGrandMean));
  return <Figure job="D50" title="Center the feature dot-product table, not the original input labels"
    description="Three scalar inputs map to squared features. Feature means and the original kernel table supply four terms for each centered cell. Its one positive eigenvector supplies training coordinates."
    caption="x−1/0/1 → squared features 1/0/1 → centered 1/3,−2/3,1/3. Selected corner 1−2/3−2/3+4/9=1/9. κ = 2/3; Q=(1,−2,1)/√6; scores Q√κ=(1,−2,1)/3. End inputs collide in this feature space.">
    <Drawing width={370} height={500} title="Original scalar positions, squared features and centered feature positions"
      description="Three original positions map through squaring to two distinct feature locations. The shared feature mean shifts all three values before their dot products are formed.">
      {[kernelTraining, kernelFeatures, kernelFeatures.map(value => value - 2 / 3)].map((values, lane) => <g key={lane}>
        <text x={15} y={26 + lane * 165}>{['Original x', 'Feature φ(x)=x²', 'Centered feature φ(x)−2/3'][lane]}</text>
        <line x1={55} y1={70 + lane * 165} x2={315} y2={70 + lane * 165} stroke="#777" />
        {values.map((value, index) => <g key={index}>
          <Point x={175 + value * 100} y={70 + lane * 165 + (lane > 0 && index === 2 ? -18 : 0)}
            color={recordColors[index]} shape={index} label={String(index + 1)} dx={index === 0 ? -15 : 8} dy={index === 2 && lane > 0 ? -10 : 23} />
          <text x={15} y={111 + lane * 165 + index * 20} fill={recordColors[index]}>Row {index + 1}: {formatNumber(value)}</text>
        </g>)}
      </g>)}
    </Drawing>
    <div className="pca-comparison">
      <Matrix values={raw} rowLabels={['Input −1', 'Input 0', 'Input 1']} columnLabels={['Input −1', 'Input 0', 'Input 1']} label="K = φφᵀ; original training row/column identities" />
      <Matrix values={centered} rowLabels={['Input −1', 'Input 0', 'Input 1']} columnLabels={['Input −1', 'Input 0', 'Input 1']} label="HKH; subtract both training means and restore grand mean" />
    </div>
    <Drawing width={370} height={255} title="One centered corner and positive eigendirection"
      description="Four numeric terms feed the selected centered cell; a three-cell eigenvector times its square-root eigenvalue produces all three fitted coordinates.">
      <text x={15} y={31}>Selected K11 cell: 1</text>
      <text x={15} y={70}>− row mean 2/3 − column mean 2/3</text>
      <text x={15} y={109}>+ grand mean 4/9</text>
      <Arrow x1={210} y1={104} x2={255} y2={104} />
      <text x={270} y={109}>1/9</text>
      <text x={15} y={163}>Q = (1,−2,1)/√6; κ = 2/3</text>
      <text x={15} y={210}>Q × √κ → (1,−2,1)/3</text>
      <text x={15} y={249}>Positive eigenspace only; no original-space inverse</text>
    </Drawing>
  </Figure>;
}

export function KernelFutureRow() {
  const input = useNumericDrafts([1], [[-2, 2]]);
  const state = kernelQuery(input.values[0]);
  const reversed = kernelQuery(-input.values[0]);
  return <Figure job="D51" title="A future kernel row keeps the training centering state"
    description="The live scalar supplies three kernel products in the original training order. Each subtracts its own row mean and the corresponding saved column mean, then adds the saved grand mean."
    caption={`x${state.value}, feature x²${state.feature}; query-row mean ${state.ownMean}. Forward score ${state.score}, equal to x²−2/3 up to arithmetic. Query ${-state.value} has the same score ${reversed.score}; the original input cannot be uniquely recovered. Training means remain fixed when the query changes.`}>
    <Matrix values={state.raw.map((value, index) => [kernelTraining[index], value, state.ownMean, kernelMeans[index], kernelGrandMean, state.centered[index], state.normalizedDirection[index], state.products[index]])}
      rowLabels={['Training −1', 'Training 0', 'Training 1']} columnLabels={['Input address', 'Kernel product', 'Own row mean', 'Saved column mean', 'Saved grand mean', 'Centered kernel value', 'Q/√κ', 'Score product']}
      label="All three query-column operands and their current products" />
    <Drawing width={370} height={255} title="Query centering and score adder"
      description="A selected first-column product follows the four centering terms and then the fitted normalized eigendirection coefficient. All three final products enter a sum.">
      <text x={15} y={29}>Column 1: {formatNumber(state.raw[0])} − {formatNumber(state.ownMean)}</text>
      <text x={15} y={67}>− 2/3 + 4/9 = {formatNumber(state.centered[0])}</text>
      <Arrow x1={181} y1={82} x2={181} y2={112} />
      <text x={15} y={142}>× .5 → {formatNumber(state.products[0])}</text>
      <text x={15} y={183}>All products {state.products.map(value => formatNumber(value)).join(', ')}</text>
      <text x={15} y={227}>Sum → {formatNumber(state.score)}</text>
    </Drawing>
    <Controls onReset={input.reset}><NumberField state={input} index={0} label="Future kernel query x" min={-2} max={2} /></Controls>
  </Figure>;
}

export function SparseAtomsAndServing() {
  const input = useNumericDrafts([0], [[0, 1]]);
  const ridge = input.values[0];
  const state = sparseServing(ridge);
  const beforeObjective = .5 * (2 * ((1 - .5) ** 2 + 1)) + .1 / Math.sqrt(2);
  const next = Math.sqrt(2) - .1;
  const afterObjective = (1 - next / Math.sqrt(2)) ** 2 * 2 + .1 * (2 * next);
  return <Figure job="D52" title="Nonorthogonal atoms need a Gram solve at serving time"
    description="Two distinct atom arrows have nonzero dot product. Naive query dots decode to a wrong point; a ridge Gram solve supplies the actual fitted-atom coefficients. A separate sparse atom-update inset follows its own objective."
    caption={`Serving ridge ρ ${ridge}; query(1,1). Naive dots(1,√2) decode(2,1). Gram coefficients(${state.coefficients.map(value => formatNumber(value)).join(', ')}) decode(${state.decoded.map(value => formatNumber(value)).join(', ')}). Fitted sparsity α and serving ridge ρ are different parameters. Dependent-atoms inset: ${state.dependentStatus}.`}>
    <Drawing width={350} height={345} title="Nonorthogonal atoms, query and naive reconstruction"
      description="Equal coordinate units show d1(1,0), d2(1,1)/square-root-two, query(1,1), and naive decoded(2,1); both atom arrows remain fixed when ridge changes.">
      <line x1={50} y1={270} x2={300} y2={270} stroke="#555" />
      <line x1={50} y1={270} x2={50} y2={45} stroke="#555" />
      {state.atoms.map((atom, index) => <g key={index}>
        <Arrow x1={50} y1={270} x2={50 + atom[0] * 110} y2={270 - atom[1] * 110} color={index ? '#AB83D8' : '#4EA3D8'} />
        <text x={55 + atom[0] * 110} y={292 - atom[1] * 110} fill={index ? '#AB83D8' : '#4EA3D8'}>d{index + 1}</text>
      </g>)}
      <Point x={160} y={160} label="Query" color="#ddd" hollow dx={-45} dy={-17} />
      <Point x={270} y={160} label="Naive" color="#DD8C78" shape={1} dx={-19} dy={-17} />
      <Point x={50 + state.decoded[0] * 110} y={270 - state.decoded[1] * 110} label="Solved" color="#efbd6d" hollow shape={2} dx={8} dy={23} />
      <text x={15} y={27}>d1·d2 = 1/√2; orthogonality is absent</text>
      <text x={15} y={330}>Coordinate units0,1,2; same fixed atom state</text>
    </Drawing>
    <Controls onReset={input.reset}><NumberField state={input} index={0} label="Serving ridge rho" min={0} max={1} /></Controls>
    <Matrix values={state.gram} columnLabels={['Atom1', 'Atom2']} label="Actual D Dᵀ + ρI system; RHS(1,√2)" />
    <Matrix values={[state.naive, state.coefficients]} rowLabels={['Naive dots', 'Gram solution']}
      columnLabels={['Coefficient 1', 'Coefficient 2']} label="Different serving routes on the same atoms and query" />
    <Matrix values={state.dependentGram} columnLabels={['Duplicated atom1', 'Duplicated atom2']}
      label={`Separate duplicate-atom inset: ${state.dependentStatus}`} />
    <Drawing width={370} height={375} title="One sparse dictionary atom update"
      description="The fixed two-record score column and initial atom produce a gradient trial. Entrywise soft threshold with alpha .1 changes both atom coefficients; before and after objectives are labelled.">
      <text x={15} y={28}>A = [[1,1],[−1,−1]]; Z = (1,−1)/√2</text>
      <text x={15} y={68}>Initial D = (1/√2,0); α = .1</text>
      <MatrixSvgPair values={[Math.SQRT1_2, 0]} y={90} color="#4EA3D8" />
      <Arrow x1={183} y1={135} x2={183} y2={160} />
      <text x={15} y={187}>Unit-gradient trial (√2,√2)</text>
      <MatrixSvgPair values={[Math.sqrt(2), Math.sqrt(2)]} y={207} color="#AB83D8" />
      <text x={15} y={277}>Soft .1 → ({formatNumber(next)}, {formatNumber(next)})</text>
      <text x={15} y={318}>Objective {formatNumber(beforeObjective)} → {formatNumber(afterObjective)}</text>
      <text x={15} y={365}>One trace; no global-optimum assertion</text>
    </Drawing>
  </Figure>;
}

function MatrixSvgPair({ values, y, color }) {
  return <g>{values.map((value, column) => <g key={column}>
    <rect x={25 + column * 155} y={y} width={145} height={35} fill="none" stroke={color} />
    <text x={97 + column * 155} y={y + 24} textAnchor="middle">{formatNumber(value)}</text>
  </g>)}</g>;
}

function SignedCells({ values, title, range = 4 }) {
  const side = values.length === 3 ? 83 : 118;
  return <Drawing width={350} height={values.length === 3 ? 350 : 330} title={title}
    description={`All cells use the same signed minus-${range} to plus-${range} scale. Blue is negative, coral positive; each cell has a numeric value and row/column address.`}>
    <text x={15} y={27}>{title}</text>
    {values.map((row, index) => row.map((value, column) => <g key={`${index}-${column}`}>
      <rect x={34 + column * side} y={52 + index * side} width={side - 4} height={side - 4}
        stroke="#777" fill={value < 0 ? '#4EA3D8' : '#DD8C78'} fillOpacity={Math.min(1, Math.abs(value) / range)} />
      <text x={34 + (column + .5) * side} y={80 + index * side} textAnchor="middle">{index + 1},{column + 1}</text>
      <text x={34 + (column + .5) * side} y={108 + index * side} textAnchor="middle">{formatNumber(value, 5)}</text>
    </g>))}
    <text x={15} y={values.length === 3 ? 335 : 319}>Common signed cell scale −{range} to {range}</text>
  </Drawing>;
}

export function RobustAndThresholdOperators() {
  const input = useNumericDrafts([1], [[0, 3]]);
  const state = thresholdComparison(input.values[0]);
  const step = pcpFirstStep();
  return <Figure job="D53" title="Entrywise and singular-value thresholds change different objects"
    description="Observed, low-rank and sparse three-by-three tables establish PCP anatomy. Two threshold lanes use the same two-by-two operand and control, while a separate first ADMM update uses its actual sequential operands."
    caption={`τ${state.threshold}: soft thresholds cells; SVT shrinks singular values 3/1 to ${state.shrunk.join('/')}, then rebuilds each cell. Both lanes stay visible. PCP μ = 1, λ = .5 starts S0,U0 and uses new L in the second operand; first-step primal norm ${step.primal}, dual-change norm ${step.dualChange}. This is one update, not convergence or identifiability evidence.`}>
    <div className="pca-comparison">
      <SignedCells values={[[4, 1, 1], [1, 1, 1], [1, 1, 1]]} title="Observed M = L + S" />
      <SignedCells values={Array.from({ length: 3 }, () => [1, 1, 1])} title="Illustrative low-rank L" />
      <SignedCells values={[[3, 0, 0], [0, 0, 0], [0, 0, 0]]} title="Illustrative sparse S" />
    </div>
    <SignedCells values={[[1, 0, 0], [0, 0, 0], [0, 0, 0]]} title="Single pixel: both rank 1 and sparse" />
    <SignedCells values={state.matrix} title="Common illustrative threshold operand B" range={2} />
    <div className="pca-comparison"><SignedCells values={state.soft} title="Entrywise soft output" range={2} /><SignedCells values={state.svt} title="Singular-value threshold output" range={2} /></div>
    <Controls onReset={input.reset}><NumberField state={input} index={0} label="Common comparison threshold tau" min={0} max={3} /></Controls>
    <Drawing width={370} height={260} title="Actual singular shrink and rebuilt corner"
      description="The eigenvectors are (1,1) and (1,minus1), each divided by square-root-two. Shrunk singular values multiply their rank-one corner contributions; both terms are summed.">
      {[3, 1].map((value, index) => <g key={index}>
        <text x={15} y={29 + index * 64}>Singular {index + 1}: {value} → max({value}−{state.threshold},0) = {formatNumber(state.shrunk[index])}</text>
        <rect x={15} y={40 + index * 64} width={300 * state.shrunk[index] / 3} height={12} fill={index ? '#AB83D8' : '#4EA3D8'} />
      </g>)}
      <text x={15} y={181}>Corner = {formatNumber(state.shrunk[0])}×.5 + {formatNumber(state.shrunk[1])}×.5</text>
      <text x={15} y={224}>= {formatNumber(state.svt[0][0])}; common singular scale 0–3</text>
    </Drawing>
    <Matrix values={step.lowOperand} label="First actual PCP operand M−S+U with S0/U0; threshold 1/μ = 1" />
    <Matrix values={step.low} label="New L after the first SVT" />
    <Matrix values={step.sparseOperand} label="Second actual operand M−Lnew+U; threshold λ/μ = .5" />
    <Matrix values={step.sparse} label="New S after entrywise threshold" />
    <Matrix values={step.dual} label="New U = U + M−Lnew−Snew; also the current primal residual" />
    <p>The primal and dual residuals must each satisfy their own absolute-plus-relative stopping limit in the complete program. This displayed first update has no convergence status.</p>
  </Figure>;
}

export function WeightedGridMetric() {
  const times = [0, 1, 3];
  const weights = [.5, 1.5, 1];
  const residual = [1, 0, 1];
  return <Figure job="D54" title="Unequal grid spacing changes the squared-error metric"
    description="Three time locations carry trapezoidal weights. Each residual multiplies by its positive square-root weight; squared transformed lengths sum to 1.5 instead of the unweighted 2."
    caption="Times 0,1,3; trapezoidal weights .5,1.5,1. Residual(1,0,1): unweighted square sum 2, weighted square sum 1.5. Positive weights make inverse scaling possible. A zero weight deletes a coordinate and cannot be inverted by division.">
    <Drawing width={350} height={325} title="Unequal time intervals and coordinate scaling"
      description="A time ruler uses equal units, so the one-unit and two-unit intervals have different lengths. Weight lanes preserve the same time addresses through square-root multiplication and inverse division.">
      <line x1={45} y1={74} x2={300} y2={74} stroke="#aaa" />
      {times.map((time, index) => <g key={time}>
        <circle cx={45 + time * 85} cy={74} r={5} fill={recordColors[index]} />
        <text x={45 + time * 85} y={56} textAnchor="middle" fill={recordColors[index]}>t{time}</text>
      </g>)}
      <text x={15} y={117}>Interval widths 1 and 2 supply trapezoid weights</text>
      {weights.map((weight, index) => <g key={index}>
        <text x={15} y={161 + index * 56} fill={recordColors[index]}>t{times[index]}: {residual[index]} × √{weight}</text>
        <Arrow x1={169} y1={155 + index * 56} x2={205} y2={155 + index * 56} color={recordColors[index]} />
        <text x={215} y={161 + index * 56}>{formatNumber(residual[index] * Math.sqrt(weight))}</text>
        <text x={15} y={185 + index * 56}>Inverse divides by the same √{weight}</text>
      </g>)}
    </Drawing>
    <Matrix values={times.map((time, index) => [time, weights[index], residual[index], residual[index] ** 2, weights[index] * residual[index] ** 2])}
      columnLabels={['Time', 'Weight', 'Residual', 'Unweighted square', 'Weighted square']}
      label="Every coordinate contribution; common positive finite-grid metric" />
  </Figure>;
}

export function RepresentationContrasts() {
  return <Figure job="D55" title="Different purposes preserve different parts of the same records"
    description="Five small geometries show named-feature selection, an explicitly illustrative random linear map, offset-sensitive uncentered SVD, nonlinear collisions and response-versus-perpendicular regression residuals."
    caption="These are different objectives. Uncentered(10,±1) retains the x offset while centered PCA retains y variation. OLS slope .8 has vertical SSE 3.6; PCA slope 1 has perpendicular SSE 2. The error totals have different meanings and cannot rank the methods as a common-loss contest.">
    <Drawing width={350} height={240} title="Feature selection retains one named column"
      description="Each original two-cell record row has its y cell crossed out while x retains its original name and value.">
      <text x={15} y={28}>Select original x, rather than rotate both features</text>
      {originalRows.map((row, index) => <g key={index}>
        <text x={15} y={69 + index * 43} fill={recordColors[index]}>{recordNames[index]}</text>
        <rect x={50} y={45 + index * 43} width={105} height={35} fill="none" stroke="#4EA3D8" />
        <text x={102} y={69 + index * 43} textAnchor="middle">x = {row[0]}</text>
        <rect x={178} y={45 + index * 43} width={105} height={35} fill="none" stroke="#777" />
        <text x={230} y={69 + index * 43} textAnchor="middle">y = {row[1]}</text>
        <path d={`M178,${45 + index * 43} L283,${80 + index * 43}`} stroke="#DD8C78" />
      </g>)}
    </Drawing>
    <Drawing width={350} height={230} title="An illustrative random linear coordinate has no fitted variance objective"
      description="An explicitly illustrative fixed row(.6,minus.8) multiplies the centered A row(−2,−1). Both products and their sum are visible.">
      <text x={15} y={28}>Illustrative map R = (.6,−.8)</text>
      <text x={15} y={74}>A centered(−2,−1): −2×.6 = −1.2</text>
      <text x={15} y={120}>−1×−.8 = .8</text>
      <Arrow x1={175} y1={135} x2={175} y2={160} />
      <text x={15} y={188}>Coordinate −.4; not fitted maximum variance</text>
      <text x={15} y={224}>No distance guarantee is inferred from one map</text>
    </Drawing>
    <Drawing width={350} height={360} title="Centering removes a large unvarying offset"
      description="Two points x10/y±1 have a tall horizontal displacement from zero. An origin-based horizontal axis retains the offset; the centered vertical axis retains the only variation.">
      <line x1={35} y1={166} x2={300} y2={166} stroke="#aaa" />
      <line x1={35} y1={55} x2={35} y2={282} stroke="#555" />
      <Point x={285} y={141} color="#4EA3D8" label="(10,1)" dx={-75} dy={-18} />
      <Point x={285} y={191} color="#AB83D8" label="(10,−1)" shape={1} dx={-78} dy={26} />
      <Arrow x1={35} y1={166} x2={279} y2={166} color="#DD8C78" />
      <Arrow x1={285} y1={261} x2={285} y2={73} color="#efbd6d" />
      <text x={15} y={28}>Uncentered SVD versus centered PCA</text>
      <text x={35} y={305}>0</text><text x={285} y={305} textAnchor="middle">10</text>
      <text x={15} y={339}>Coral offset axis x; amber centered variation y</text>
    </Drawing>
    <Drawing width={350} height={295} title="A circle can collide under one linear coordinate"
      description="Opposite upper/lower circle points have equal horizontal coordinate zero. Their projected marks share one horizontal location, losing the original vertical distinction.">
      <circle cx={175} cy={149} r={95} stroke="#888" fill="none" />
      <line x1={50} y1={149} x2={300} y2={149} stroke="#777" />
      <Point x={175} y={54} color="#4EA3D8" label="(0,1)" />
      <Point x={175} y={244} color="#AB83D8" label="(0,−1)" shape={1} dx={10} dy={18} />
      <Arrow x1={175} y1={61} x2={175} y2={142} color="#4EA3D8" />
      <Arrow x1={175} y1={238} x2={175} y2={157} color="#AB83D8" />
      <text x={15} y={28}>A one-coordinate collision is an information loss</text>
      <text x={193} y={172}>Both x = 0</text>
      <text x={15} y={292}>A nonlinear objective needs a different taught route</text>
    </Drawing>
    <Drawing width={350} height={360} title="OLS vertical errors versus PCA perpendicular errors"
      description="The centered four records use equal coordinate units. A slope .8 response line has vertical residuals; the slope 1 PCA line has perpendicular residuals for the same A point.">
      <line x1={47} y1={181} x2={307} y2={181} stroke="#444" />
      <line x1={177} y1={51} x2={177} y2={311} stroke="#444" />
      <line x1={55} y1={303} x2={299} y2={59} stroke="#efbd6d" strokeWidth={2} />
      <line x1={55} y1={278.6} x2={299} y2={83.4} stroke="#AB83D8" strokeWidth={2} />
      {originalRows.map((row, index) => <Point key={index} x={177 + (row[0] - 3) * 50} y={181 - (row[1] - 2) * 50}
        label={recordNames[index]} color={recordColors[index]} />)}
      <line x1={77} y1={231} x2={77} y2={261} stroke="#AB83D8" strokeDasharray="4 3" />
      <line x1={77} y1={231} x2={102} y2={256} stroke="#efbd6d" strokeDasharray="4 3" />
      <text x={15} y={28}>Amber PCA y=x; violet OLS y=.8x</text>
      <text x={15} y={343}>Perpendicular SSE 2; vertical SSE 3.6</text>
    </Drawing>
  </Figure>;
}

export const variantDrawings = {
  D50: KernelCentering,
  D51: KernelFutureRow,
  D52: SparseAtomsAndServing,
  D53: RobustAndThresholdOperators,
  D54: WeightedGridMetric,
  D55: RepresentationContrasts
};
