import { useState } from 'react';
import { diagonal, dot, formatNumber, originalRows, perpendicular, recordColors, recordNames } from "../../data/pca-geometry.js";
import { biplotFactors, coefficientCorrelation, labelledRectangle } from "../../data/pca-interpretation.js";
import { featureColors, wineState } from "../../data/pca-wine-state.js";
import { Arrow, Controls, Drawing, Figure, Matrix, NumberField, Point, useNumericDrafts } from './PcaReadingFlowPrimitives.jsx';

export function CoefficientsAndScores() {
  const centeredA = [-2, -1];
  const products = centeredA.map((value, column) => value * diagonal[column]);
  return <Figure job="D30" title="Feature coefficients make an observation score"
    description="The two feature coefficients multiply A's two centered measurements before the products join in an adder. Wine coefficients keep the same thirteen feature identities."
    caption="A coefficient belongs to a feature and an axis. A score belongs to an observation and that axis. The arrows identify those different addresses; coefficients are not an observation ranking.">
    <Drawing width={370} height={320} title="Coefficient column and one record product"
      description="A two-cell direction column feeds two separate multipliers with A's centered x and y. Their products join to form A's PC1 score.">
      {centeredA.map((value, column) => <g key={column}>
        <text x={15} y={30 + column * 115} fill={column ? '#AB83D8' : '#4EA3D8'}>{column ? 'y' : 'x'} coefficient</text>
        <rect x={15} y={43 + column * 115} width={110} height={32} fill="none" stroke={column ? '#AB83D8' : '#4EA3D8'} />
        <text x={70} y={65 + column * 115} textAnchor="middle">{formatNumber(diagonal[column])}</text>
        <Arrow x1={132} y1={58 + column * 115} x2={178} y2={58 + column * 115} />
        <text x={187} y={63 + column * 115}>× {value} = {formatNumber(products[column])}</text>
        {column === 0 ? <>
          <path d="M245,78 H346 V220 H245" stroke={recordColors[0]} fill="none" strokeWidth={1.7} />
          <Arrow x1={245} y1={220} x2={245} y2={233} color={recordColors[0]} />
        </> : <Arrow x1={245} y1={193} x2={245} y2={233} color={recordColors[0]} />}
      </g>)}
      <circle cx={245} cy={254} r={19} fill="none" stroke="#ddd" />
      <text x={245} y={260} textAnchor="middle">+</text>
      <text x={15} y={302} fill={recordColors[0]}>A's score = {formatNumber(dot(centeredA, diagonal))}</text>
    </Drawing>
    <Drawing width={590} height={710} title="Thirteen signed Wine feature coefficients on one scale"
      description="Every named feature keeps its own hue and saved PC1 coefficient. Bars extend left for negative values and right for positive values from one shared zero; the scale is minus one to one.">
      <text x={15} y={26}>Saved standardized PC1: feature coefficients</text>
      {[-1, -.5, 0, .5, 1].map(tick => <g key={tick}>
        <line x1={405 + tick * 155} x2={405 + tick * 155} y1={55} y2={667} stroke="#333" />
        <text x={405 + tick * 155} y={695} textAnchor="middle">{tick}</text>
      </g>)}
      {wineState.wineFullFit.components[0].map((value, index) => <g key={wineState.wineFeatures[index]}>
        <text x={15} y={79 + index * 46} fill={featureColors[index]}>{wineState.wineFeatures[index]}</text>
        <line x1={405} y1={74 + index * 46} x2={405 + value * 155} y2={74 + index * 46}
          stroke={featureColors[index]} strokeWidth={9} />
        <text x={15} y={99 + index * 46} fill={featureColors[index]}>{formatNumber(value)}</text>
      </g>)}
    </Drawing>
    <Matrix values={wineState.wineFullFit.components[0].map(value => [value])}
      rowLabels={wineState.wineFeatures} rowColors={featureColors} columnLabels={['Saved standardized PC1 coefficient']}
      label="Thirteen features supply one saved Wine direction; feature identity is retained" exactNumbers />
  </Figure>;
}

export function CoefficientVersusCorrelation() {
  const state = coefficientCorrelation();
  const x = value => 190 + value * 145;
  return <Figure job="D31" title="A coefficient and a fitted correlation have different scales"
    description="Covariance times the direction supplies the numerator. Feature and score standard deviations supply the denominator. Both final quantities use the same minus-one to one scale."
    caption={`Constructed four-record fit: coefficient ${state.coefficient}; covariance product ${state.numerator}; feature SD ${state.featureDeviation}; score SD ${state.scoreDeviation}; correlation ${state.correlation}. A constant feature has zero SD, so its correlation is undefined, not zero.`}>
    <Drawing width={370} height={410} title="Covariance numerator and standard deviation denominator"
      description="Two covariance entries multiply the two coefficients. The summed numerator is divided by the product of two standard deviations; comparable bars follow on one fixed scale.">
      <text x={15} y={30}>Covariance row × direction</text>
      <text x={15} y={65}>10/3 × 1/√2 + 8/3 × 1/√2</text>
      <Arrow x1={188} y1={78} x2={188} y2={105} />
      <text x={188} y={132} textAnchor="middle">Numerator {formatNumber(state.numerator)}</text>
      <line x1={60} y1={145} x2={318} y2={145} stroke="#eee" />
      <text x={188} y={172} textAnchor="middle">Denominator √(10/3) × √6</text>
      <Arrow x1={188} y1={186} x2={188} y2={212} />
      <text x={188} y={239} textAnchor="middle">Correlation √0.9</text>
      {[['Coefficient', state.coefficient, '#4EA3D8'], ['Correlation', state.correlation, '#AB83D8']].map(([name, value, color], index) => <g key={name}>
        <text x={15} y={275 + 67 * index}>{name}: {formatNumber(value)}</text>
        <line x1={x(-1)} y1={295 + 67 * index} x2={x(1)} y2={295 + 67 * index} stroke="#777" />
        <line x1={x(0)} y1={295 + 67 * index} x2={x(value)} y2={295 + 67 * index} stroke={color} strokeWidth={9} />
        {[-1, 0, 1].map(tick => <text key={tick} x={x(tick)} y={318 + 67 * index} textAnchor="middle">{tick}</text>)}
      </g>)}
    </Drawing>
  </Figure>;
}

function BiplotPlane({ records, features }) {
  const range = 3.5;
  const scale = 37;
  const x = value => 165 + scale * value;
  const y = value => 174 - scale * value;
  return <Drawing width={350} height={355} title="Two labelled biplot factors"
    description="Record marks use their row-factor coordinates; feature arrows use their column-factor coordinates. Both factors have explicitly labelled factor units, with the same displayed scale.">
    <rect x={x(-range)} y={y(range)} width={2 * range * scale} height={2 * range * scale} stroke="#555" fill="none" />
    {[-3, 0, 3].map(tick => <g key={tick}>
      <line x1={x(tick)} x2={x(tick)} y1={y(-range)} y2={y(range)} stroke="#333" />
      <line x1={x(-range)} x2={x(range)} y1={y(tick)} y2={y(tick)} stroke="#333" />
      <text x={x(tick)} y={324} textAnchor="middle">{tick}</text>
      <text x={22} y={y(tick) + 4} textAnchor="end">{tick}</text>
    </g>)}
    {features.map((row, index) => <g key={index}>
      <Arrow x1={x(0)} y1={y(0)} x2={x(row[0])} y2={y(row[1])} color={index ? '#AB83D8' : '#4EA3D8'} />
      <text x={x(row[0]) + 7} y={y(row[1]) + (index ? 20 : -10)} fill={index ? '#AB83D8' : '#4EA3D8'}>{index ? 'Feature y' : 'Feature x'}</text>
    </g>)}
    {records.map((row, index) => <Point key={index} x={x(row[0])} y={y(row[1])}
      label={recordNames[index]} color={recordColors[index]} dx={index % 2 ? -18 : 10} dy={index % 2 ? 18 : -10} />)}
    <text x={165} y={26} textAnchor="middle">Record factor / feature factor units</text>
    <text x={165} y={350} textAnchor="middle">First factor coordinate</text>
  </Drawing>;
}

export function BiplotScaling() {
  const [gamma, setGamma] = useState(1);
  const [reverse, setReverse] = useState(false);
  const state = biplotFactors(gamma, reverse);
  function reset() {
    setGamma(1);
    setReverse(false);
  }
  return <Figure job="D32" title="Move singular-value scale between paired factors"
    description="Row coordinates are U times S to gamma; feature arrows are V times S to one minus gamma. Reversing the first column reverses both factors, leaving every reconstructed entry unchanged."
    caption={`γ = ${gamma}. Record units: U S^γ; feature units: V S^(1−γ). First-column sign ${reverse ? 'reversed in both factors' : 'original in both factors'}. Full reconstruction squared residual ${state.loss}; tiny nonzero values are binary arithmetic. These feature arrows are not correlations.`}>
    <BiplotPlane records={state.records} features={state.features} />
    <Controls onReset={reset}>
      <label className="pca-number-field">Singular-value scaling γ
        <select aria-label="Biplot scaling gamma" value={gamma} onChange={event => setGamma(Number(event.target.value))}>
          {[0, .5, 1].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="pca-checkbox"><input type="checkbox" checked={reverse} onChange={event => setReverse(event.target.checked)} />{' '}Reverse first column in both factors</label>
    </Controls>
    <div className="pca-comparison">
      <Matrix values={state.records} rowLabels={recordNames} columnLabels={['Column 1', 'Column 2']} label="Record factor: U S^γ, 4 × 2" />
      <Matrix values={state.features} rowLabels={['x feature', 'y feature']} rowColors={['#4EA3D8', '#AB83D8']}
        columnLabels={['Column 1', 'Column 2']} label="Feature factor: V S^(1−γ), 2 × 2" />
    </div>
    <Drawing width={350} height={135} title="Paired factor dimensions and multiplication"
      description="A four-by-two row factor multiplies a two-by-two transposed feature factor to restore the four-by-two centered table.">
      <rect x={15} y={15} width={75} height={80} fill="none" stroke="#4EA3D8" />
      <text x={53} y={60} textAnchor="middle">4 × 2</text>
      <text x={104} y={60}>×</text>
      <rect x={129} y={15} width={75} height={40} fill="none" stroke="#AB83D8" />
      <text x={167} y={42} textAnchor="middle">2 × 2</text>
      <text x={167} y={84} textAnchor="middle">Transpose</text>
      <Arrow x1={217} y1={47} x2={251} y2={47} />
      <rect x={265} y={15} width={75} height={80} fill="none" stroke="#ddd" />
      <text x={302} y={60} textAnchor="middle">4 × 2</text>
      <text x={15} y={122}>Paired column products reconstruct each cell</text>
    </Drawing>
    <Matrix values={state.reconstructed} rowLabels={recordNames} columnLabels={['Centered x', 'Centered y']} label="Current factor product; compare with the original centered table" />
  </Figure>;
}

export function VarianceVersusLabels() {
  const input = useNumericDrafts([10], [[1, 20]]);
  const [axis, setAxis] = useState('PC1');
  const spread = input.values[0];
  const state = labelledRectangle(spread, axis);
  const x = value => 175 + 120 * value / spread;
  const y = value => 175 - 120 * value / spread;
  const colors = { positive: '#DD8C78', negative: '#4EA3D8' };
  function reset() {
    input.reset();
    setAxis('PC1');
  }
  return <Figure job="D33" title="A high-variance score can lose every class distinction"
    description="Four fixed-labelled corners differ by the sign of y. The horizontal ruler drops y and places each opposite-label pair at one shared coordinate. The vertical ruler retains the separating measurement."
    caption={`${axis} retains variance fraction ${state.ratio}. Labels come from the sign of y and do not affect the PCA calculation. At spread 1 the two variances tie: horizontal and vertical are chosen representatives, not uniquely preferred components. Circle A/square C are negative; triangle B/diamond D are positive. Colour now encodes label group, while letters/shapes retain record identity.`}>
    <Drawing width={350} height={395} title="Original labelled rectangle"
      description="Both axes use the same measurement unit and the same plus/minus spread extent. Actual corner y values remain plus/minus one, so a large horizontal spread makes a genuinely flat rectangle.">
      <line x1={x(-spread)} y1={175} x2={x(spread)} y2={175} stroke="#aaa" />
      <line x1={175} y1={60} x2={175} y2={290} stroke="#aaa" />
      {[-spread, 0, spread].map(value => <text key={value} x={x(value)} y={332} textAnchor="middle">{formatNumber(value)}</text>)}
      {[-spread, 0, spread].map(value => <text key={value} x={25} y={y(value) + 5}>{formatNumber(value)}</text>)}
      {state.rows.map((row, index) => <Point key={index} x={x(row[0])} y={y(row[1])}
        label={recordNames[index]} shape={index} color={colors[state.labels[index]]}
        dx={index < 2 ? -20 : 10} dy={index % 2 ? -12 : 21} />)}
      <text x={15} y={383}>Corner y = ±1; equal x/y units</text>
      <text x={175} y={28} textAnchor="middle">Original y carries the label</text>
      <text x={175} y={355} textAnchor="middle">Original x measurement</text>
    </Drawing>
    <Drawing width={350} height={axis === 'both' ? 320 : 210} title="Current retained coordinates and collision pairs"
      description="Single-coordinate tracks mark coincident opposite-label records with paired labelled shapes. The two-coordinate view retains both rows of the rectangle.">
      {axis === 'both' ? <>
        <line x1={55} y1={160} x2={295} y2={160} stroke="#aaa" />
        <line x1={175} y1={50} x2={175} y2={260} stroke="#aaa" />
        {[-spread, 0, spread].map(value => <g key={value}>
          <text x={x(value)} y={285} textAnchor="middle">{formatNumber(value)}</text>
          <text x={25} y={165 - 120 * value / spread}>{formatNumber(value)}</text>
        </g>)}
        {state.coordinates.map((row, index) => <Point key={index} x={x(row[0])} y={160 - 120 * row[1] / spread}
          label={recordNames[index]} shape={index} color={colors[state.labels[index]]}
          dx={index < 2 ? -20 : 10} dy={index % 2 ? -12 : 22} />)}
        <text x={175} y={302} textAnchor="middle">Both original coordinates remain</text>
      </> : <>
        <line x1={45} y1={90} x2={305} y2={90} stroke="#aaa" />
        {[-1, 1].map(sign => {
          const indices = state.coordinates.map((row, index) => [row[0], index])
            .filter(([value]) => Math.sign(value) === sign).map(([, index]) => index);
          const value = sign * (axis === 'PC1' ? spread : 1);
          const position = 175 + sign * 120;
          return <g key={sign}>
            <line x1={position} y1={64} x2={position} y2={149} stroke="#888" strokeDasharray="3 4" />
            {indices.map((index, slot) => <Point key={index} x={position} y={82 + slot * 46}
              label={recordNames[index]} shape={index} color={colors[state.labels[index]]} dx={sign < 0 ? 11 : -23} dy={5} />)}
            <text x={position} y={172} textAnchor="middle">{formatNumber(value)}</text>
          </g>;
        })}
        <text x={175} y={28} textAnchor="middle">{axis === 'PC1' ? 'Opposite labels share each x score' : 'Same labels share each y score'}</text>
        <text x={175} y={202} textAnchor="middle">Offset symbols share the dashed score location</text>
      </>}
    </Drawing>
    <Controls onReset={reset}>
      <NumberField state={input} index={0} label="Horizontal spread" min={1} max={20} />
      <label className="pca-number-field">Retained axis
        <select aria-label="Label comparison axis" value={axis} onChange={event => setAxis(event.target.value)}>
          <option value="PC1">PC1: horizontal</option>
          <option value="PC2">PC2: vertical</option>
          <option value="both">Both coordinates</option>
        </select>
      </label>
    </Controls>
    <Matrix values={state.rows.map((row, index) => [...row, state.labels[index], ...state.coordinates[index]])}
      rowLabels={recordNames} rowColors={state.labels.map(label => colors[label])}
      columnLabels={['Original x', 'Original y', 'Group', 'Retained coordinate 1', 'Retained coordinate 2']}
      label="All labelled records and their current retained coordinates" />
  </Figure>;
}

export function DistanceDecomposition() {
  const difference = originalRows[0].map((value, index) => value - originalRows[1][index]);
  const scores = [dot(difference, diagonal), dot(difference, perpendicular)];
  return <Figure job="D34" title="Distance is the sum of squared score differences"
    description="A minus B gives the original displacement. Both orthogonal score differences contribute nonnegative squared lengths; dropping the second track removes its two-unit contribution."
    caption={`A−B = (${difference.join(', ')}); original squared distance 2. PC1 difference ${scores[0]} contributes ${scores[0] ** 2}; PC2 difference ${scores[1]} contributes ${scores[1] ** 2}. Full rotation preserves 2, while the first-coordinate distance is 0. No clustering is fitted here.`}>
    <Drawing width={350} height={400} title="Original displacement and two orthogonal distance contributions"
      description="A one-by-one right triangle has squared length two. The first score track has zero length, the second has length square root of two and is visibly crossed out for the truncated comparison.">
      <Point x={65} y={92} label="A" color={recordColors[0]} dx={-19} dy={-10} />
      <Point x={115} y={142} label="B" color={recordColors[1]} dx={-19} dy={21} />
      <line x1={65} y1={92} x2={115} y2={142} stroke="#ddd" strokeWidth={2} />
      <path d="M65,92 H115 V142" stroke="#999" fill="none" strokeDasharray="4 3" />
      <text x={122} y={99}>Δx = −1</text>
      <text x={122} y={139}>Δy = 1</text>
      <text x={15} y={180}>A − B = (−1, 1); y increases upward</text>
      <text x={15} y={30}>Original distance square = 1² + 1² = 2</text>
      {scores.map((score, index) => <g key={index}>
        <text x={15} y={204 + index * 92}>PC{index + 1}: Δscore {formatNumber(score)}</text>
        <line x1={55} y1={227 + index * 92} x2={295} y2={227 + index * 92} stroke="#555" />
        <line x1={55} y1={227 + index * 92} x2={55 + 120 * Math.abs(score)} y2={227 + index * 92}
          stroke={index ? '#AB83D8' : '#4EA3D8'} strokeWidth={9} />
        <text x={15} y={255 + index * 92}>Squared contribution {formatNumber(score ** 2)}</text>
        {index === 1 && <path d="M48,305 L240,333 M48,333 L240,305" stroke="#DD8C78" strokeWidth={2} />}
      </g>)}
      <text x={15} y={390}>Keeping PC1 removes the second nonnegative term</text>
    </Drawing>
  </Figure>;
}

export function FoldOwnedPrediction() {
  const results = wineState.prediction.results;
  const groups = [null, 2, 8];
  return <Figure job="D35" title="Each prediction fold fits its own preprocessing"
    description="Five separate fold lanes send only training records into the scaler, optional PCA and classifier fit. The held-out records pass through fitted transforms into an accuracy calculation. All saved fold outcomes are shown on a common zero-to-one scale."
    caption="Measured retained five-fold Wine accuracies, StratifiedKFold with shuffle and seed 42, StandardScaler and logistic regression max_iter = 2000. Each lane is a fold, not a replicate or final test. No-PCA and PCA2/PCA8 use the same split recipe; these scores do not certify a final deployment choice.">
    <Drawing width={570} height={510} title="Five disjoint fitting and held-out evaluation lanes"
      description="Each fold has training and held-out branches. Training traverses scaler fit, optional PCA fit and logistic fit; held-out data uses those stored transformations before comparison with its truth.">
      <text x={15} y={26}>Training fits inside each fold; validation only transforms and scores</text>
      {[0, 1, 2, 3, 4].map(fold => <g key={fold} transform={`translate(0,${48 + fold * 89})`}>
        <text x={15} y={25}>Fold {fold + 1}</text>
        <rect x={80} y={0} width={58} height={30} fill="none" stroke="#4EA3D8" />
        <text x={109} y={21} textAnchor="middle">Train</text>
        <Arrow x1={141} y1={16} x2={168} y2={16} color="#4EA3D8" />
        {['Scale', 'PCA?', 'Logistic'].map((name, stage) => <g key={name}>
          <rect x={175 + stage * 100} y={0} width={75} height={30} stroke="#4EA3D8" fill="none" />
          <text x={212 + stage * 100} y={21} textAnchor="middle">{name}</text>
          {stage < 2 && <Arrow x1={253 + stage * 100} y1={16} x2={271 + stage * 100} y2={16} />}
          <line x1={212 + stage * 100} y1={32} x2={212 + stage * 100} y2={48} stroke="#999" strokeDasharray="3 3" />
        </g>)}
        <rect x={80} y={49} width={58} height={26} fill="none" stroke="#AB83D8" />
        <text x={109} y={68} textAnchor="middle">Held-out</text>
        <path d="M140,62 H460" stroke="#AB83D8" fill="none" />
        <Arrow x1={460} y1={62} x2={482} y2={62} color="#AB83D8" />
        <text x={490} y={68}>Accuracy</text>
      </g>)}
    </Drawing>
    <Drawing width={370} height={340} title="All saved fold accuracies on one scale"
      description="Three series have fifteen actual saved marks. The vertical scale starts at zero and ends at one, with all five fold addresses labelled.">
      {[0, .25, .5, .75, 1].map(value => <g key={value}>
        <line x1={60} y1={285 - 240 * value} x2={320} y2={285 - 240 * value} stroke="#444" />
        <text x={48} y={290 - 240 * value} textAnchor="end">{value}</text>
      </g>)}
      {groups.map((kept, series) => {
        const scores = results[kept === null ? 'None' : String(kept)];
        const color = ['#aaa', '#4EA3D8', '#AB83D8'][series];
        return <g key={String(kept)}>
          <path d={scores.map((value, fold) => `${fold ? 'L' : 'M'}${60 + fold * 65},${285 - value * 240}`).join(' ')} fill="none" stroke={color} strokeWidth={2} />
          {scores.map((value, fold) => <Point key={fold} x={60 + fold * 65} y={285 - value * 240} shape={series} color={color} />)}
        </g>;
      })}
      {[1, 2, 3, 4, 5].map((fold, index) => <text key={fold} x={60 + index * 65} y={311} textAnchor="middle">{fold}</text>)}
      <text x={190} y={335} textAnchor="middle">Fold; gray none, blue 2, violet 8</text>
    </Drawing>
    <Matrix values={groups.map(kept => {
      const scores = results[kept === null ? 'None' : String(kept)];
      return [...scores, scores.reduce((sum, value) => sum + value, 0) / 5];
    })} rowLabels={['No PCA', 'PCA2', 'PCA8']} rowColors={['#aaa', '#4EA3D8', '#AB83D8']}
      columnLabels={['Fold 1', 'Fold 2', 'Fold 3', 'Fold 4', 'Fold 5', 'Mean']}
      label="All fifteen retained measured accuracies and derived arithmetic means" exactNumbers />
  </Figure>;
}

export const interpretationDrawings = {
  D30: CoefficientsAndScores,
  D31: CoefficientVersusCorrelation,
  D32: BiplotScaling,
  D33: VarianceVersusLabels,
  D34: DistanceDecomposition,
  D35: FoldOwnedPrediction
};
