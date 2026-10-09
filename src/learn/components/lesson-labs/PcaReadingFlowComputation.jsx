import { diagonal, formatNumber, projection, recordColors, recordNames } from "../../data/pca-geometry.js";
import { batchMeans, pixelDecode, rangeFinder, rangeProbe, rangeTable } from "../../data/pca-computation.js";
import { CoordinatePlane } from './PcaReadingFlowFoundation.jsx';
import { Arrow, Controls, Drawing, Figure, Matrix, NumberField, Point, useNumericDrafts } from './PcaReadingFlowPrimitives.jsx';

function PixelGrid({ values, title, signed = false }) {
  return <Drawing width={300} height={330} title={title}
    description="All nine pixels retain row-major r/c addresses. Intensity uses a common zero-to-one grayscale; signed patterns or residuals use a labelled minus-one to one scale with blue negative and coral positive.">
    <text x={15} y={27}>{title}</text>
    {values.map((value, index) => {
      const color = signed ? value < 0 ? '#4EA3D8' : '#DD8C78' : `rgb(${Math.round(value * 255)},${Math.round(value * 255)},${Math.round(value * 255)})`;
      return <g key={index}>
        <rect x={24 + index % 3 * 83} y={52 + Math.floor(index / 3) * 77} width={79} height={73}
          fill={color} fillOpacity={signed ? Math.abs(value) : 1} stroke="#777" />
        <text x={63 + index % 3 * 83} y={78 + Math.floor(index / 3) * 77} textAnchor="middle"
          fill={!signed && value > .5 ? '#111' : '#fff'}>{`r${Math.floor(index / 3) + 1}c${index % 3 + 1}`}</text>
        <text x={63 + index % 3 * 83} y={107 + Math.floor(index / 3) * 77} textAnchor="middle"
          fill={!signed && value > .5 ? '#111' : '#fff'}>{formatNumber(value, 4)}</text>
      </g>;
    })}
    <text x={15} y={315}>{signed ? 'Signed values −1 to 1; no intensity clipping' : 'Intensity 0 black → 1 white'}</text>
  </Drawing>;
}

export function PixelPatterns() {
  const input = useNumericDrafts([.3, -.2, 1], [[-.5, .5], [-.5, .5], [1, 2, true]]);
  const [a, b, kept] = input.values;
  const state = pixelDecode(a, b, kept);
  return <Figure job="D44" title="Named pixels are features and image patterns are directions"
    description="Mean and two orthonormal patterns are visible before their weighted composition. The current original, retained decode and residual use the same row-major pixel locations."
    caption={`a ${a}, b ${b}, k ${kept}. Original = mean+aB1+bB2; decoded = mean+aB1${kept === 2 ? '+bB2' : ''}. Squared pixel loss ${state.loss}. Bounds keep intensities 0–1 without clipping. Pattern values and intensities have explicitly different scales.`}>
    <div className="pca-comparison">
      <PixelGrid values={state.mean} title="Mean image" />
      <PixelGrid values={state.patterns[0]} title="First unit pattern B1" signed />
      <PixelGrid values={state.patterns[1]} title="Second unit pattern B2" signed />
    </div>
    <div className="pca-comparison">
      <PixelGrid values={state.original} title="Current original image" />
      <PixelGrid values={state.decoded} title="Retained reconstruction" />
      <PixelGrid values={state.residual} title="Original minus reconstruction" signed />
    </div>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="First image pattern weight a" min={-.5} max={.5} />
      <NumberField state={input} index={1} label="Second image pattern weight b" min={-.5} max={.5} />
      <NumberField state={input} index={2} label="Image kept count" min={1} max={2} step={1} />
    </Controls>
  </Figure>;
}

function DiagnosticPoint({ row, name }) {
  const score = (row[0] + row[1]) / Math.sqrt(2);
  const foot = [score / Math.sqrt(2), score / Math.sqrt(2)];
  const loss = row.reduce((sum, value, index) => sum + (value - foot[index]) ** 2, 0);
  return <div>
    <CoordinatePlane rows={[row]} mean={[0, 0]} direction={diagonal} feet={[foot]}
      extent={[[-5, 5], [-5, 5]]} title={`${name} retained and residual geometry`}
      rowLabels={[name === 'Baseline P' ? 'P' : name === 'Baseline Q' ? 'Q' : 'Query']} />
    <p>{name} = ({row.join(', ')}): score² {formatNumber(score ** 2)}; perpendicular residual² {formatNumber(loss)}.</p>
  </div>;
}

export function AlongAndAway() {
  const input = useNumericDrafts([3, 3], [[-4, 4], [-4, 4]]);
  return <Figure job="D45" title="Along-axis size and perpendicular loss answer different questions"
    description="The retained diagonal and perpendicular foot are shown for both fixed contrast points and a live query, all on equal minus-five to five axes."
    caption="P(3,3) has score² = 18 and residual² = 0. Q(3,−3) has score² = 0 and residual² = 18. Both baselines stay visible as the query changes. No alert threshold or calibrated operational anomaly claim is supplied.">
    <div className="pca-comparison"><DiagnosticPoint row={[3, 3]} name="Baseline P" /><DiagnosticPoint row={[3, -3]} name="Baseline Q" /><DiagnosticPoint row={input.values} name="Current query" /></div>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Diagnostic query x" min={-4} max={4} />
      <NumberField state={input} index={1} label="Diagnostic query y" min={-4} max={4} />
    </Controls>
  </Figure>;
}

export function TimePermutation() {
  const rows = [[0, 0], [1, 1], [2, -1], [3, 0]];
  const orders = [[0, 1, 2, 3], [0, 2, 1, 3]];
  return <Figure job="D46" title="Row order changes a time path but leaves covariance unchanged"
    description="The same four keyed records are connected in chronological and permuted order. Their identity hues and shapes follow the records; numbered time positions follow each route."
    caption="Exact constructed time paths: sum of squared successive steps 9 versus 15; the same centered covariance [[5/3,−1/3],[−1/3,2/3]] in both orders. A covariance representation has discarded the sequence.">
    <div className="pca-comparison">{orders.map((order, which) => <Drawing key={which} width={350} height={350}
      title={which ? 'Permuted path A,C,B,D' : 'Chronological path A,B,C,D'}
      description="Equal horizontal and vertical coordinate units; arrows connect successive record identities and labelled time positions.">
      <text x={15} y={27}>{which ? 'Permutation 0,2,1,3' : 'Chronological 0,1,2,3'}</text>
      <line x1={40} y1={170} x2={305} y2={170} stroke="#555" />
      <line x1={55} y1={52} x2={55} y2={283} stroke="#555" />
      {order.slice(0, -1).map((index, time) => <Arrow key={time}
        x1={55 + rows[index][0] * 75} y1={170 - rows[index][1] * 75}
        x2={55 + rows[order[time + 1]][0] * 75} y2={170 - rows[order[time + 1]][1] * 75} color="#888" />)}
      {order.map((index, time) => <g key={index}>
        <Point x={55 + rows[index][0] * 75} y={170 - rows[index][1] * 75} label={recordNames[index]} shape={index} color={recordColors[index]} />
        <text x={55 + rows[index][0] * 75} y={196 - rows[index][1] * 75}>t{time + 1}</text>
      </g>)}
      {[0, 1, 2, 3].map(value => <text key={value} x={55 + value * 75} y={310} textAnchor="middle">{value}</text>)}
      {[-1, 0, 1].map(value => <text key={value} x={26} y={175 - value * 75}>{value}</text>)}
      <text x={15} y={341}>Identity follows records; time position changes</text>
    </Drawing>)}</div>
    <Matrix values={[[5 / 3, -1 / 3], [-1 / 3, 2 / 3]]} columnLabels={['x', 'y']} label="Identical sample covariance for both complete row orders" />
  </Figure>;
}

export function RangeFinderAnatomy() {
  const firstProbe = rangeProbe.map(row => [row[0]]);
  const firstRange = rangeTable.map(row => [row.reduce((sum, value, column) => sum + value * firstProbe[column][0], 0)]);
  const stages = [
    ['A', '1000 × 100', 200, 140], ['Ω', '100 × 15', 50, 140],
    ['Y = AΩ', '1000 × 15', 50, 140], ['Q from QR', '1000 × 15', 50, 140],
    ['B = QᵀA', '15 × 100', 200, 35]
  ];
  return <Figure job="D47" title="A sampled range narrows the large factorization"
    description="Dimensioned table silhouettes show the tall input, narrow probe and range, orthonormal range and short compressed table. Final factors return to the original row and feature spaces."
    caption="Arithmetic storage estimate: 1,000,000×5,000×8 = 40 GB decimal before workspace. n = 1000, d = 100, k = 10, p = 5 gives ℓ = 15. Drawn silhouettes indicate tall/wide roles, not a proportional memory chart or measured speedup.">
    <Drawing width={370} height={1450} title="Randomized range-finder table anatomy"
      description="Each array has a concrete row/column shape and a labelled multiplication or QR operation; the small SVD produces factors with original row and feature dimensions.">
      {stages.map(([name, shape, width, height], index) => <g key={name} transform={`translate(0,${20 + index * 218})`}>
        <text x={15} y={24}>{name}: {shape}</text>
        <rect x={115} y={39} width={width} height={height} stroke={index === 1 ? '#AB83D8' : '#4EA3D8'} fill="none" />
        <text x={15} y={79}>{index === 1 ? 'Probe' : index === 2 ? 'Multiply' : index === 3 ? 'Normalize' : index === 4 ? 'Compress' : 'Input'}</text>
        {index > 0 && index < stages.length - 1 && <Arrow x1={140} y1={185} x2={140} y2={211} />}
      </g>)}
      <path d="M319,130 H345 V530 H179" stroke="#4EA3D8" fill="none" strokeWidth={1.7} />
      <Arrow x1={179} y1={530} x2={169} y2={530} color="#4EA3D8" />
      <text x={15} y={216}>Ω is a separate probe; A is reused in AΩ</text>
      <Arrow x1={140} y1={985} x2={140} y2={1020} />
      <text x={15} y={1047}>Small direct SVD of B</text>
      <rect x={20} y={1070} width={50} height={75} stroke="#4EA3D8" fill="none" />
      <rect x={130} y={1070} width={50} height={75} stroke="#efbd6d" fill="none" />
      <rect x={240} y={1070} width={110} height={45} stroke="#AB83D8" fill="none" />
      <text x={20} y={1174}>Left 15 × 10</text>
      <text x={130} y={1198}>S 10 × 10</text>
      <text x={240} y={1150}>D 10 × 100</text>
      <text x={15} y={1239}>Q (1000 × 15) × left (15 × 10)</text>
      <Arrow x1={140} y1={1254} x2={140} y2={1290} />
      <rect x={115} y={1305} width={40} height={90} stroke="#4EA3D8" fill="none" />
      <text x={173} y={1332}>U: 1000 × 10</text>
      <text x={173} y={1364}>Approximate factor</text>
      <text x={15} y={1438}>Query scores use the feature rows: A × Dᵀ</text>
    </Drawing>
    <Drawing width={370} height={265} title="One actual range-product column"
      description="The first row of the fixed tiny centered table multiplies the first fixed probe column entry by entry. All three products enter an adder, yielding the first row of the range column.">
      <text x={15} y={15}>Worked range product: A × Ω</text>
      {[-2, 0, 1].map((value, column) => <g key={column}>
        <text x={15} y={38 + column * 58} fill={recordColors[column]}>Feature {column + 1}: {value} × {firstProbe[column][0]} = {value * firstProbe[column][0]}</text>
        <Arrow x1={198} y1={33 + column * 58} x2={264} y2={91} color={recordColors[column]} />
      </g>)}
      <circle cx={287} cy={91} r={18} stroke="#ddd" fill="none" />
      <text x={287} y={97} textAnchor="middle">+</text>
      <text x={15} y={217}>Y first row = −2 + 0 + 1 = −1</text>
      <text x={15} y={250}>Fixed probe arithmetic; no random performance fit</text>
    </Drawing>
    <div className="pca-comparison">
      <Matrix values={rangeTable} rowLabels={recordNames} columnLabels={['Feature 1', 'Feature 2', 'Feature 3']} label="Tiny fixed A, 4 × 3" />
      <Matrix values={firstProbe} rowLabels={['Feature 1', 'Feature 2', 'Feature 3']} columnLabels={['Probe column 1']} label="Ω first fixed column, 3 × 1" />
      <Matrix values={firstRange} rowLabels={recordNames} columnLabels={['Range column 1']} label="Actual AΩ first column, 4 × 1" />
    </div>
  </Figure>;
}

export function NormalizedRangeFinder() {
  const input = useNumericDrafts([0, 1], [[0, 3, true], [0, 2, true]]);
  const [powers, oversampling] = input.values;
  const state = rangeFinder(powers, oversampling);
  return <Figure job="D48" title="Normalize every multiplication in the fixed tiny range finder"
    description="The fixed centered four-by-three table and fixed probe supply actual intermediate matrices. Powers add both transpose and return QR stages; oversampling changes port widths."
    caption={`Fixed Ω columns, not a new random draw. q ${powers}, p ${oversampling}, ℓ ${state.ell}; passes ${state.passes}; computed relative reconstruction residual ${state.relativeResidual}; Q orthogonality error ${state.orthogonality}. This small drawing uses reorthogonalized columns and bounded one-sided Jacobi rotations; the downloadable general route uses maintained QR/direct SVD. A zero table has range rank 0 and no positive signal direction.`}>
    <div className="pca-comparison"><Matrix values={rangeTable} rowLabels={recordNames} columnLabels={['Feature 1', 'Feature 2', 'Feature 3']} label="Fixed centered A, 4 × 3" />
      <Matrix values={state.omega} label={`Fixed Ω prefix, 3 × ${state.ell}`} /></div>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="Normalized power repetitions q" min={0} max={3} step={1} />
      <NumberField state={input} index={1} label="Range oversampling p" min={0} max={2} step={1} />
    </Controls>
    {state.stages.map((stage, index) => <div key={stage.name}>
      {index > 0 && <Drawing width={320} height={67} title={`Operation into ${stage.name}`} description="An operation arrow links the preceding complete numeric table to the next normalized or multiplied table.">
        <Arrow x1={145} y1={5} x2={145} y2={28} />
        <text x={15} y={57}>{stage.name}</text>
      </Drawing>}
      <Matrix values={stage.matrix} label={`${stage.name}, ${stage.matrix.length} × ${stage.matrix[0].length}`} />
    </div>)}
    <Matrix values={state.small} columnLabels={['Feature 1', 'Feature 2', 'Feature 3']} label={`B = QᵀA, ${state.small.length} × 3; actual small factorization input `} />
    <Matrix values={state.singular.map(value => [value.singular, ...value.direction])}
      columnLabels={['Singular value', 'Direction feature 1', 'Direction feature 2', 'Direction feature 3']}
      label="Current small direct-SVD values and feature directions" />
    <Matrix values={state.reconstructed} rowLabels={recordNames} columnLabels={['Feature 1', 'Feature 2', 'Feature 3']}
      label="One retained direction; actual projection/decode on A" />
    <Matrix values={Array.from({ length: 4 }, () => [0, 0, 0])} label="Zero-table comparison: range rank 0; no norm division or preferred axis" />
  </Figure>;
}

export function MeanCorrection() {
  const input = useNumericDrafts([1, 1], [[-3, 3], [1, 2, true]]);
  const [next, kept] = input.values;
  const state = batchMeans(next);
  return <Figure job="D49" title="Between-batch mean movement needs one correction row"
    description="Two constant two-row batches have zero internal scatter. Their mean displacement is retained through an extra scaled row, whose outer product recovers the missing combined scatter."
    caption={`Old n = 2 mean(−1,0), new b = 2 mean(${next},0); combined mean(${state.combinedMean.join(', ')}). √(nb/(n+b)) = 1; correction (${state.correction.join(', ')}); merged scatter (${state.scatter[0].join(', ')}; ${state.scatter[1].join(', ')}). k ${kept} retains this rank≤1 represented range. Full history equality needs all represented directions; earlier truncation may discard history.`}>
    <Drawing width={370} height={360} title="Zero within-batch scatter and a nonzero between-mean term"
      description="Each two-record batch has coincident points on a common minus-three to three horizontal scale. The mean-displacement arrow leads to a correction row and its squared outer-product term.">
      <line x1={35} y1={98} x2={335} y2={98} stroke="#777" />
      {[-3, -1, 1, 3].map(value => <text key={value} x={185 + value * 50} y={124} textAnchor="middle">{value}</text>)}
      <Point x={135} y={98} color="#4EA3D8" label="Old ×2" dx={-40} dy={-16} />
      <Point x={185 + next * 50} y={98} color="#AB83D8" shape={1} label="New ×2" dx={-27} dy={28} />
      <Arrow x1={185 + next * 50} y1={155} x2={135} y2={155} color="#efbd6d" />
      <text x={15} y={28}>Each centered batch is two zero rows</text>
      <text x={15} y={199}>Correction = 1 × (old mean − new mean)</text>
      <text x={15} y={240}>({formatNumber(state.correction[0])}, 0)</text>
      <Arrow x1={153} y1={235} x2={200} y2={235} />
      <text x={217} y={240}>Outer product</text>
      <text x={15} y={294}>Missing x scatter = {formatNumber(state.scatter[0][0])}</text>
      <text x={15} y={342}>At new mean 1: correction (−2,0), scatter 4</text>
    </Drawing>
    <Controls onReset={input.reset}>
      <NumberField state={input} index={0} label="New batch mean x" min={-3} max={3} />
      <NumberField state={input} index={1} label="Batch retained count" min={1} max={2} step={1} />
    </Controls>
    <Matrix values={state.stack} rowLabels={['Old centered 1', 'Old centered 2', 'New centered 1', 'New centered 2', 'Correction']}
      rowColors={['#4EA3D8', '#4EA3D8', '#AB83D8', '#AB83D8', '#efbd6d']}
      columnLabels={['x', 'y']} label="Actual mean-corrected stack for these constant batches" />
    <Matrix values={state.scatter} columnLabels={['x', 'y']} label="Stackᵀ stack = merged centered scatter; population/sample denominators remain separate" />
  </Figure>;
}

export const computationDrawings = {
  D44: PixelPatterns,
  D45: AlongAndAway,
  D46: TimePermutation,
  D47: RangeFinderAnatomy,
  D48: NormalizedRangeFinder,
  D49: MeanCorrection
};
