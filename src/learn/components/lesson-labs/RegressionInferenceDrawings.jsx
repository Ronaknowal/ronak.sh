import { RegressionDrawing as Drawing, RegressionLabel as Label, RegressionValue as Value, RegressionWire as Wire, RegressionOperation as Operation, RegressionPath, RegressionPlot, RegressionSeriesLabel } from './LinearLogisticDrawings.jsx';
export function HeldOutDifferenceDrawing() {
  const rows = [['prior', .647514], ['logistic', .646604]];
  return <RegressionPlot name="regression-tiny-held-out-gain" description="Recorded test log losses from the unchanged synthetic programme differ by only 0.000910 after rounding" xDomain={[0, 3]} yDomain={[.645, .650]} xLabel="Same 60 test rows, two frozen rules" yLabel="Test log loss (magnified vertical range)" yTickDigits={6} caption="Recorded, not live training. The y-axis deliberately starts at 0.645; these are points, not zero-based bars. The mean-loss improvement is 0.000910 using the printed six-decimal outputs.">
    {({
      xScale,
      yScale,
      left
    }) => <>
      {rows.map(([name, value], index) => <g key={name}>
        <circle cx={xScale(index + 1)} cy={yScale(value)} r={6} fill={index ? '#bb9aec' : '#eeeae3'} />
        <RegressionSeriesLabel target={[xScale(index + 1), yScale(value)]} position={[left + 4, index ? 230 : 48]} color={index ? '#bb9aec' : '#eeeae3'}>{name} {value}</RegressionSeriesLabel>
      </g>)}
    </>}
  </RegressionPlot>;
}
export function RealDataSplitDrawing() {
  return <Drawing name="regression-real-data-split" height={674} description="442 real observations contain 10 baseline features and a later numerical target; train-only centering and least-squares fitting use 353 rows, then two frozen rules predict 89 test rows" caption="Symbolic row cutaway of the bundled diabetes dataset, not invented patient measurements. The exact programme requests raw coordinates with scaled=False and learns centering only on training rows.">
    <Label x={160} y={27}>442 people × 10 baseline features</Label>
    <rect x={30} y={53} width={260} height={116} fill="none" stroke="#67cbd9" />
    {[0, 1, 2].map(row => <g key={row}>
      <line x1={30} x2={290} y1={91 + row * 38} y2={91 + row * 38} stroke="#67cbd9" />
      <Label x={75} y={80 + row * 38} role="input">age</Label>
      <Label x={145} y={80 + row * 38} role="input">bmi</Label>
      <Label x={205} y={80 + row * 38} role="input">…</Label>
      <Label x={260} y={80 + row * 38} role="target">y</Label>
    </g>)}
    <Wire points={[[160, 169], [160, 207], [8, 207], [8, 279], [15, 279]]} />
    <Wire points={[[160, 169], [160, 279], [179, 279]]} />
    <Wire points={[[160, 169], [160, 207], [319, 207], [319, 279], [317, 279]]} />
    <Value x={75} y={279} label="training" value="353 rows" role="input" width={120} />
    <Value x={223} y={279} label="test x" value="89 rows" role="input" width={88} />
    <Value x={292} y={279} label="test y" value="89" role="target" width={50} />
    <Wire points={[[75, 302], [75, 353]]} />
    <Operation x={75} y={377} label="fit" />
    <Wire points={[[99, 377], [190, 377], [190, 463], [221, 463]]} />
    <Wire points={[[223, 302], [245, 302], [245, 439]]} />
    <Wire points={[[292, 302], [309, 302], [309, 580], [184, 580]]} />
    <Operation x={245} y={463} label="use" />
    <Label x={75} y={430} role="parameter">train means + β</Label>
    <Wire points={[[245, 487], [245, 524], [160, 524], [160, 556]]} />
    <Label x={119} y={511} role="computed">estimates</Label>
    <Operation x={160} y={580} label="test" />
    <Wire points={[[160, 604], [160, 633]]} />
    <Label x={160} y={653} role="computed">Mean-rule and fitted-rule errors</Label>
  </Drawing>;
}
export function GaussianErrorDrawing() {
  const outcomes = Array.from({
    length: 121
  }, (_, index) => -1 + index * .05);
  return <RegressionPlot name="regression-gaussian-errors" description="At a fixed feature input, a unit-variance Gaussian model centers its outcome density at the predicted mean 2; moving a target farther away increases squared residual and negative log density" xDomain={[-1, 5]} yDomain={[0, .45]} xLabel="Outcome y, for one fixed input x" yLabel="Conditional density (not probability mass)" caption="Separate assumed-noise illustration: mean 2, σ=1. Density is exp(−(y−2)²/2)/√(2π). Areas under intervals are probabilities; the curve height itself is a density.">
    {({
      xScale,
      yScale,
      left
    }) => <>
      <RegressionPath points={outcomes.map(y => [y, Math.exp(-((y - 2) ** 2) / 2) / Math.sqrt(2 * Math.PI)])} xScale={xScale} yScale={yScale} />
      <line x1={xScale(2)} x2={xScale(2)} y1={yScale(0)} y2={yScale(1 / Math.sqrt(2 * Math.PI))} stroke="#eeeae3" strokeDasharray="4 4" />
      <RegressionSeriesLabel target={[xScale(1.4), yScale(Math.exp(-(.6 ** 2) / 2) / Math.sqrt(2 * Math.PI))]} position={[left + 4, 48]}>assumed density</RegressionSeriesLabel>
    </>}
  </RegressionPlot>;
}
export function SparseDesignDrawing() {
  const arrays = [['values', [2, 1, 3]], ['columns', [0, 3, 2]], ['offsets', [0, 1, 2, 3]]];
  return <Drawing name="regression-sparse-storage" height={580} description="A small sparse row array stores only nonzero values with column indices and row offsets; streaming presents rows in batches while retaining one coefficient vector" caption="Illustrative 3×4 cutaway, not the entire 180×20 programme matrix. CSR stores data [2,1,3], column indices [0,3,2], and row offsets [0,1,2,3]. The actual training matrix has 539 stored nonzeros.">
    <Label x={160} y={27} role="input">Sparse feature array</Label>
    {[[2, 0, 0, 0], [0, 0, 0, 1], [0, 0, 3, 0]].map((row, index) => <g key={index}>
      {row.map((value, column) => <g key={column}>
        <rect x={40 + column * 60} y={53 + index * 48} width={60} height={48} fill="none" stroke={value ? '#67cbd9' : '#333'} />
        <Label x={70 + column * 60} y={84 + index * 48} role={value ? 'input' : 'operation'}>{value}</Label>
      </g>)}
    </g>)}
    <Wire points={[[160, 197], [160, 233]]} />
    <Operation x={160} y={257} label="CSR" />
    {arrays.map(([name, values], row) => <g key={name}>
      <Wire points={[[136, 257], [16, 257], [16, 347 + row * 80], [67, 347 + row * 80]]} />
      <Label x={165} y={317 + row * 80} role="input">{name}</Label>
      {values.map((value, index) => <g key={index}>
        <rect x={67 + index * 49} y={324 + row * 80} width={49} height={46} fill="none" stroke="#67cbd9" />
        <Label x={91 + index * 49} y={353 + row * 80} role="input">{value}</Label>
      </g>)}
    </g>)}
    <Label x={160} y={570}>Offsets delimit each row's stored slice</Label>
  </Drawing>;
}
export function GeneralizedLinearDrawing() {
  return <Drawing name="regression-glm-branches" height={415} description="A shared linear feature score branches into an identity mean for Gaussian outcomes or a sigmoid mean for Bernoulli outcomes; the observed outcome family determines the corresponding likelihood" caption="The linear predictor is shared structure, not one fitted model reused for two outputs. Each branch fits its own parameters and has its own outcome distribution and objective.">
    <Wire points={[[160, 83], [160, 137], [75, 137], [75, 177]]} />
    <Wire points={[[160, 83], [160, 137], [245, 137], [245, 177]]} />
    <Value x={160} y={60} label="linear predictor" value="xᵀβ" width={126} />
    <Operation x={75} y={201} label="id" />
    <Operation x={245} y={201} label="σ" />
    <Wire points={[[75, 225], [75, 276]]} />
    <Wire points={[[245, 225], [245, 276]]} />
    <Value x={75} y={299} label="mean hours" value="xᵀβ" width={126} />
    <Value x={245} y={299} label="probability" value="σ(xᵀβ)" width={126} />
    <Label x={75} y={377}>Gaussian noise</Label>
    <Label x={245} y={377}>Bernoulli labels</Label>
  </Drawing>;
}
export function DecisionCostDrawing() {
  return <Drawing name="regression-action-costs" height={642} description="One probability branches to expected cost of warning and remaining quiet; false-warning cost times one minus probability competes with missed-deadline cost times probability" caption="Separate calibrated-probability illustration: p=0.3, false-warning cost 1, missed-deadline cost 4. Compare expected costs 0.7 and 1.2; warning is cheaper. This is a decision calculation, not another model fit.">
    <Value x={160} y={60} label="missed-deadline probability" value="p = 0.3" />
    <Wire points={[[160, 83], [160, 111], [75, 111], [75, 161]]} />
    <Wire points={[[160, 83], [160, 111], [245, 111], [245, 161]]} />
    <Value x={75} y={184} label="on-time probability" value="1−p = 0.7" width={140} />
    <Value x={245} y={184} label="miss probability" value="p = 0.3" width={140} />
    <Wire points={[[75, 207], [8, 207], [8, 343], [56, 343]]} />
    <Wire points={[[245, 207], [319, 207], [319, 343], [264, 343]]} />
    <Value x={80} y={280} label="false-warning cost" value="1" role="input" width={70} />
    <Value x={240} y={280} label="miss cost" value="4" role="input" width={70} />
    <Wire points={[[80, 303], [80, 319]]} />
    <Wire points={[[240, 303], [240, 319]]} />
    <Operation x={80} y={343} label="×" />
    <Operation x={240} y={343} label="×" />
    <Wire points={[[80, 367], [8, 367], [8, 442], [17, 442]]} />
    <Wire points={[[240, 367], [319, 367], [319, 442], [303, 442]]} />
    <Value x={80} y={442} label="warn: expected cost" value="0.7" width={126} />
    <Value x={240} y={442} label="quiet cost" value="1.2" width={126} />
    <Wire points={[[80, 465], [80, 540], [136, 540]]} />
    <Wire points={[[240, 465], [240, 540], [184, 540]]} />
    <Operation x={160} y={540} label="≤" />
    <Wire points={[[160, 564], [160, 604]]} />
    <Label x={160} y={630} role="computed">Warn: 0.7 ≤ 1.2</Label>
  </Drawing>;
}
export function SelectedRowDrawing() {
  return <Drawing name="regression-one-design-row" height={438} description="Shipment B's augmented row multiplies a leading one by the shared intercept and distance one by the shared slope; two distinct products join at an addition" caption="One row of the same matrix, not a separately fitted rule. Both products are 0.9 and their sum estimates 1.8 hours.">
    <Value x={46} y={60} label="row B" value="1" role="input" width={70} />
    <Value x={126} y={60} label="b" value="0.9" role="parameter" width={70} />
    <Value x={205} y={60} label="x" value="1" role="input" width={70} />
    <Value x={283} y={60} label="w" value="0.9" role="parameter" width={70} />
    <Wire points={[[46, 83], [46, 145], [62, 145]]} />
    <Wire points={[[126, 83], [126, 145], [110, 145]]} />
    <Wire points={[[205, 83], [205, 145], [220, 145]]} />
    <Wire points={[[283, 83], [283, 145], [268, 145]]} />
    <Operation x={86} y={145} label="×" />
    <Operation x={244} y={145} label="×" />
    <Wire points={[[86, 169], [86, 182], [30, 182], [30, 242], [44, 242]]} />
    <Wire points={[[244, 169], [244, 182], [306, 182], [306, 242], [286, 242]]} />
    <Value x={86} y={242} label="1 × b" value="0.9" />
    <Value x={244} y={242} label="x × w" value="0.9" />
    <Wire points={[[86, 265], [86, 340], [136, 340]]} />
    <Wire points={[[244, 265], [244, 340], [184, 340]]} />
    <Operation x={160} y={340} label="+" />
    <Wire points={[[160, 364], [160, 405]]} />
    <Label x={160} y={430} role="computed">Estimated hours: 1.8</Label>
  </Drawing>;
}
export function RobustLossDrawing() {
  const losses = [{
    name: 'Half squared',
    color: '#bb9aec',
    evaluate: residual => residual ** 2 / 2
  }, {
    name: 'Huber, δ=1',
    color: '#e99a61',
    evaluate: residual => Math.abs(residual) <= 1 ? residual ** 2 / 2 : Math.abs(residual) - .5
  }];
  return <>{losses.map(loss => <RegressionPlot key={loss.name} name={'regression-robust-' + (loss.name.startsWith('Huber') ? 'huber' : 'square')} description={loss.name + ' loss uses the same residual and vertical scales as the comparison'} xDomain={[-3, 3]} yDomain={[0, 5]} xLabel="Residual e = observed − estimated" yLabel={loss.name + ' loss'} caption={loss.name.startsWith('Huber') ? 'Near zero this is the same quadratic. Beyond |e|=1 its slope has magnitude 1, so large vertical errors no longer produce ever-growing score derivatives.' : 'At |e|=3 the loss is 4.5. Its derivative magnitude is |e|, so a large residual exerts greater vertical influence.'}>
    {({
        xScale,
        yScale
      }) => <>
      <RegressionPath points={Array.from({
          length: 121
        }, (_, index) => {
          const residual = -3 + index / 20;
          return [residual, loss.evaluate(residual)];
        })} xScale={xScale} yScale={yScale} color={loss.color} />
      <RegressionSeriesLabel target={[xScale(2), yScale(loss.evaluate(2))]}
        position={[xScale(1), yScale(4.2) - 8]} color={loss.color} anchor="middle">
        {loss.name}
      </RegressionSeriesLabel>
    </>}
  </RegressionPlot>)}</>;
}
export function StreamingUpdateDrawing() {
  return <Drawing name="regression-streaming-coefficients" height={505} description="A small batch and the saved coefficient vector separately enter prediction and gradient; a learning-rate update produces the next coefficient vector used for the following batch" caption="The batch changes, but one model's coefficients persist. The stream does not silently fit a separate rule for each batch. A final short batch still contributes its rows.">
    <Label x={72} y={27} role="input">Current batch</Label>
    {[0, 1, 2].map(row => <g key={row}>
      <rect x={20} y={47 + row * 36} width={104} height={36} fill="none" stroke="#67cbd9" />
      <Label x={72} y={72 + row * 36} role="input">x, y</Label>
    </g>)}
    <Value x={243} y={95} label="saved β" value="b, w₁, …" role="parameter" width={134} />
    <Wire points={[[72, 155], [72, 219], [136, 219]]} />
    <Wire points={[[243, 118], [243, 219], [184, 219]]} />
    <Operation x={160} y={219} label="∇" />
    <Label x={160} y={276} role="computed">Batch objective gradient</Label>
    <Wire points={[[160, 243], [160, 311]]} />
    <Wire points={[[310, 95], [315, 95], [315, 335], [184, 335]]} />
    <Operation x={160} y={335} label="−η∇" />
    <Wire points={[[160, 359], [160, 401]]} />
    <Value x={160} y={424} label="next β" value="updated coefficients" role="parameter" width={194} />
    <Label x={160} y={497}>Next batch reuses this saved state</Label>
  </Drawing>;
}
export function GrowingDesignDrawing() {
  const cases = [{
    rows: 6,
    columns: 2,
    label: 'Hold p fixed'
  }, {
    rows: 6,
    columns: 4,
    label: 'Grow p with n'
  }];
  return <Drawing name="regression-growing-design" height={367} description="Two schematic design arrays contrast adding observations with a fixed number of features and adding both observations and features; no numerical phase boundary is plotted" caption="Schematic grids, not paper measurements. Rows are people and columns are non-intercept features; p names their count. In the asymptotic comparison n grows in both routes, but p/n tends to zero only in the first.">
    {cases.map((item, index) => {
      const left = index ? 176 : 28;
      const width = index ? 28 : 40;
      return <g key={item.label}>
        <Label x={index ? 232 : 68} y={27} role="input">{item.label}</Label>
        {Array.from({
          length: item.rows
        }, (_, row) => Array.from({
          length: item.columns
        }, (_, column) => <rect key={row + '-' + column} x={left + column * width} y={53 + row * 27} width={width} height={27} fill="none" stroke="#67cbd9" />))}
        <Wire points={[[index ? 232 : 68, 224], [index ? 232 : 68, 268]]} />
        <Label x={index ? 232 : 68} y={298}>{index ? 'p/n → κ > 0' : 'p/n → 0'}</Label>
      </g>;
    })}
    <Label x={160} y={345}>More coefficients share the evidence</Label>
  </Drawing>;
}
export function CurvatureWorkDrawing() {
  return <Drawing name="regression-curvature-work" height={585} description="The same logistic curvature can be stored as a complete matrix for a linear solve, or applied to a direction without storing every matrix entry" caption="A two-coordinate cutaway at the eight-row zero-score fixture. The full Hessian is diagonal here by symmetry; general Hessians need not be. Matrix-vector products can use X, per-row curvatures and the penalty directly.">
    <Label x={160} y={27} role="computed">Full matrix: 2 × 2 cutaway</Label>
    {[[.25, 0], [0, .475]].map((row, index) => row.map((value, column) => <g key={index + '-' + column}>
      <rect x={78 + column * 82} y={49 + index * 44} width={82} height={44} fill="none" stroke="#bb9aec" />
      <Label x={119 + column * 82} y={78 + index * 44} role="computed">{value}</Label>
    </g>))}
    <Wire points={[[160, 137], [160, 189]]} />
    <Operation x={160} y={213} label="solve" />
    <Value x={271} y={181} label="−gradient" value="0, 0.25" width={94} />
    <Wire points={[[271, 204], [271, 213], [184, 213]]} />
    <Wire points={[[160, 237], [160, 281]]} />
    <Label x={160} y={301} role="computed">Correction δ = [0, 0.526316]</Label>
    <Label x={160} y={357}>Operator route: apply H to a direction</Label>
    <Value x={75} y={415} label="direction v" value="1, 1" role="input" width={112} />
    <Value x={245} y={415} label="X, row W, λ" value="same case" width={112} />
    <Wire points={[[75, 438], [75, 493], [136, 493]]} />
    <Wire points={[[245, 438], [245, 493], [184, 493]]} />
    <Operation x={160} y={493} label="Hv" />
    <Wire points={[[160, 517], [160, 550]]} />
    <Label x={160} y={578} role="computed">Hv = [0.25, 0.475]</Label>
  </Drawing>;
}
export function QuasiSeparationDrawing() {
  return <RegressionPlot name="regression-quasi-separation" description="A fixed four-row example has label zero at minus one, both labels at zero, and label one at plus one; increasing the slope can improve the outside rows while the coincident conflicting rows stay at probability one half" xDomain={[-1.5, 1.5]} yDomain={[-2.5, 2.5]} xLabel="New fixed feature fixture" yLabel="Score at w=2, b=0" caption="The single center mark represents two observations with the same feature and different labels. No point is displaced to suggest different scores. Increasing w improves the outside likelihood terms while both center terms remain log(2).">
    {({
      xScale,
      yScale,
      left,
      right
    }) => <>
      <line x1={left} x2={right} y1={yScale(0)} y2={yScale(0)} stroke="#969b9f" strokeDasharray="4 4" />
      <RegressionPath points={[[-1, -2], [1, 2]]} xScale={xScale} yScale={yScale} />
      {[-1, 0, 1].map(input => <circle key={input} cx={xScale(input)} cy={yScale(2 * input)} r={5} fill="#bb9aec" />)}
      <Label x={xScale(-1)} y={yScale(-2) - 16} role="target">y=0</Label>
      <Label x={xScale(1)} y={yScale(2) - 16} role="target">y=1</Label>
      <RegressionSeriesLabel target={[xScale(0), yScale(0)]} position={[left + 4, 235]} color="#eeeae3">same x: y=0 and y=1</RegressionSeriesLabel>
    </>}
  </RegressionPlot>;
}
