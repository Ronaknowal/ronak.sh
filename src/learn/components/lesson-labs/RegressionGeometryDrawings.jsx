import { RegressionDrawing as Drawing, RegressionLabel as Label, RegressionValue as Value, RegressionWire as Wire, RegressionOperation as Operation, RegressionPath, RegressionPlot, RegressionSeriesLabel } from './LinearLogisticDrawings.jsx';
import { binaryCurvatureReport } from '../../data/linear-logistic-flow-models.js';
export function RegressionSplitDrawing({
  complete = false
}) {
  const counts = complete ? [180, 60, 60] : [2, 1, 1];
  const centers = [55, 160, 265];
  return <Drawing name={complete ? 'regression-held-out-circuit' : 'regression-split-roles'} height={complete ? 754 : 348} description={complete ? 'Training fits candidates; validation selects a model and threshold; the frozen model uses test features, while test targets enter only the final report' : 'A small illustrative row partition assigns distinct jobs to training, validation and test'} caption={complete ? 'The arrays show two representative rows per partition. Counts are the actual 300-row experiment; dots stand for the remaining rows. Solid arrows show permitted information use.' : 'This four-row partition only explains the three jobs. The worked four-row fit later uses all four rows to expose arithmetic; its training error is not a test report.'}>
    <Wire points={[[55, 177], [55, 245]]} />
    <Wire points={[[160, complete ? 177 : 117], [160, 245]]} />
    {!complete && <Wire points={[[265, 117], [265, 245]]} />}
    {complete && <>
      <Wire points={[[79, 269], [136, 269]]} />
      <Wire points={[[160, 293], [160, 351]]} />
      <Wire points={[[160, 397], [160, 461]]} />
      <Wire points={[[160, 507], [160, 520], [225, 520], [225, 560], [241, 560]]} />
      <Wire points={[[243, 157], [243, 210], [315, 210], [315, 560], [289, 560]]} />
      <Wire points={[[287, 157], [287, 660], [184, 660]]} />
      <Wire points={[[265, 584], [265, 606], [160, 606], [160, 636]]} />
      <Wire points={[[160, 684], [160, 720]]} />
    </>}
    {centers.map((center, index) => <g key={center}>
      <Label x={center} y={28} role="input">{['train', 'validation', 'test'][index]}</Label>
      <Label x={center} y={55}>{counts[index]} rows</Label>
      {Array.from({
        length: complete || index === 0 ? 2 : 1
      }, (_, row) => <g key={row}>
        <rect x={center - 43} y={77 + row * 40} width={86} height={40} fill="none" stroke="#67cbd9" />
        <line x1={center} x2={center} y1={77 + row * 40} y2={117 + row * 40} stroke="#67cbd9" />
        <Label x={center - 22} y={103 + row * 40} role="input">x</Label>
        <Label x={center + 22} y={103 + row * 40} role="target">y</Label>
      </g>)}
      <Label x={center} y={175}>{complete ? '⋮' : ''}</Label>
    </g>)}
    <Operation x={55} y={269} label="fit" />
    <Operation x={160} y={269} label={complete ? 'score' : 'choose'} />
    {!complete && <Operation x={265} y={269} label="test" />}
    {!complete && <>
      <Label x={55} y={327} role="parameter">coefficients</Label>
      <Label x={160} y={327} role="computed">settings</Label>
      <Label x={265} y={327} role="computed">report</Label>
    </>}
    {complete && <>
      <Value x={160} y={374} label="validation choice" value="C = 0.1" width={116} />
      <Value x={160} y={484} label="validation cost gate" value="τ = 0.325406" width={154} />
      <Operation x={265} y={560} label="use" />
      <Label x={110} y={544}>frozen fit + gate</Label>
      <Label x={214} y={203} role="input" anchor="end">test x</Label>
      <Label x={160} y={628} role="computed">probabilities / decisions</Label>
      <Label x={282} y={702} role="target">test y</Label>
      <Operation x={160} y={660} label="test" />
      <Label x={160} y={744} role="computed">probability loss + decision cost</Label>
    </>}
  </Drawing>;
}
export function MeanBalanceDrawing() {
  const values = [1, 2, 2, 4];
  return <Drawing name="regression-mean-balance" height={674} description="Four observed hours share one axis; signed deviations around their mean sum to zero, while shifting the candidate adds the same error to each observation" caption="All marks use one hours scale. The small vertical offset keeps the two observations at 2 hours separately visible; their horizontal hours positions remain identical. Both error groups use the same 30 pixels per hour. Moving the constant from 2.25 to 3 subtracts 0.75 from every residual.">
    <line x1={40} x2={290} y1={92} y2={92} stroke="#969b9f" />
    {[0, 1, 2, 3, 4].map(value => <Label key={value} x={40 + value * 60} y={119}>{value}</Label>)}
    {values.map((value, index) => <g key={index}>
      <circle cx={40 + value * 60} cy={index === 2 ? 84 : 92} r={5} fill="#eeeae3" />
      <Label x={40 + value * 60} y={index === 2 ? 61 : 39}>{'ABCD'[index]}</Label>
    </g>)}
    <line x1={175} x2={175} y1={128} y2={168} stroke="#bb9aec" />
    <line x1={220} x2={220} y1={128} y2={151} stroke="#efbb53" />
    <Label x={250} y={157} role="parameter">a = 3</Label>
    <Label x={175} y={193} role="computed">mean ȳ = 2.25 hours</Label>
    {values.map((value, index) => {
      const x = 45 + index * 77;
      return <g key={index}>
        <Label x={x} y={347}>{'ABCD'[index]}</Label>
        <line x1={x} x2={x} y1={257} y2={257 + (2.25 - value) * 30} stroke="#bb9aec" strokeWidth={4} />
        <Label x={x} y={323} role="computed">{value - 2.25}</Label>
      </g>;
    })}
    <Label x={160} y={372}>−1.25 − 0.25 − 0.25 + 1.75 = 0</Label>
    <Label x={160} y={418} role="parameter">Same observations, constant a = 3</Label>
    {values.map((value, index) => {
      const x = 45 + index * 77;
      return <g key={'changed-' + index}>
        <Label x={x} y={599}>{'ABCD'[index]}</Label>
        <line x1={x} x2={x} y1={481} y2={481 + (3 - value) * 30} stroke="#bb9aec" strokeWidth={4} />
        <Label x={x} y={574} role="computed">{value - 3}</Label>
      </g>;
    })}
    <Label x={160} y={619}>−2 − 1 − 1 + 1 = −3</Label>
    <Label x={160} y={665}>The shared shift breaks the zero balance</Label>
  </Drawing>;
}
export function CenteredReductionDrawing() {
  const centeredX = [-1.5, -.5, .5, 1.5];
  const centeredY = [-1.25, -.25, -.25, 1.75];
  return <Drawing name="regression-centered-reductions" height={588} description="Centered distance and time arrays form cross-products and squared distances; their column sums give the least-squares slope" caption="Cyan columns are centered supplied rows. Violet columns are computed products. The ratio uses totals 4.5 / 5 = 0.9, then the means recover b = 2.25 − 0.9 × 1.5 = 0.9.">
    <Label x={45} y={27} role="input">x − x̄</Label>
    <Label x={120} y={27} role="input">y − ȳ</Label>
    <Label x={205} y={27} role="computed">product</Label>
    <Label x={280} y={27} role="computed">(x−x̄)²</Label>
    {centeredX.map((x, index) => <g key={x}>
      {[x, centeredY[index], x * centeredY[index], x * x].map((value, column) => <g key={column}>
        <rect x={[10, 85, 170, 245][column]} y={52 + index * 49} width={70} height={46} fill="none" stroke={column < 2 ? '#67cbd9' : '#bb9aec'} />
        <Label x={[45, 120, 205, 280][column]} y={81 + index * 49} role={column < 2 ? 'input' : 'computed'}>{value}</Label>
      </g>)}
    </g>)}
    <Wire points={[[205, 246], [205, 260]]} />
    <Wire points={[[280, 246], [280, 260]]} />
    <Operation x={205} y={284} label="Σ" />
    <Operation x={280} y={284} label="Σ" />
    <Wire points={[[205, 308], [155, 308], [155, 378], [170, 378]]} />
    <Wire points={[[280, 308], [319, 308], [319, 378], [315, 378]]} />
    <Value x={205} y={378} label="sum" value="4.5" width={70} />
    <Value x={280} y={378} label="sum" value="5" width={70} />
    <Wire points={[[205, 401], [205, 470], [184, 470]]} />
    <Wire points={[[280, 401], [280, 528], [160, 528], [160, 494]]} />
    <Operation x={160} y={470} label="÷" />
    <Label x={160} y={566} role="computed">slope w = 0.9</Label>
  </Drawing>;
}
export function NormalBalanceDrawing() {
  const errors = [.1, .2, -.7, .4];
  return <Drawing name="regression-normal-balance" height={454} description="Each fitted residual is multiplied by the constant column or distance column, then each contribution column sums to zero" caption="These are the original four-row optimum's residuals. Both sums are zero even though the individual errors remain. Multiplication by 1 belongs to the intercept; multiplication by x belongs to the slope.">
    <Wire points={[[50, 243], [50, 300], [61, 300]]} />
    <Wire points={[[160, 243], [160, 263], [85, 263], [85, 276]]} />
    <Wire points={[[160, 243], [160, 263], [235, 263], [235, 276]]} />
    <Wire points={[[270, 243], [270, 300], [259, 300]]} />
    <Wire points={[[85, 324], [85, 345], [45, 345], [45, 383], [50, 383]]} />
    <Wire points={[[235, 324], [235, 345], [285, 345], [285, 383], [270, 383]]} />
    <Label x={50} y={27} role="input">constant</Label>
    <Label x={160} y={27} role="computed">residual e</Label>
    <Label x={270} y={27} role="input">distance x</Label>
    {errors.map((error, index) => <g key={index}>
      {[50, 160, 270].map((center, column) => <g key={column}>
        <rect x={center - 35} y={51 + index * 48} width={70} height={48} fill="none" stroke={column === 1 ? '#bb9aec' : '#67cbd9'} />
        <Label x={center} y={82 + index * 48} role={column === 1 ? 'computed' : 'input'}>{column === 0 ? 1 : column === 1 ? error : index}</Label>
      </g>)}
    </g>)}
    <Operation x={85} y={300} label="dot" />
    <Operation x={235} y={300} label="dot" />
    <Value x={85} y={383} label="1ᵀe" value="0" width={70} />
    <Value x={235} y={383} label="xᵀe" value="0" width={70} />
    <Label x={160} y={433}>Both balances vanish</Label>
  </Drawing>;
}
export function ObservationProjectionDrawing() {
  const project = ([a, b, c]) => [165 + 55 * a - 45 * b, 345 - 25 * a - 25 * b - 50 * c];
  const origin = project([0, 0, 0]);
  const observed = project([1, 2, 2]);
  const fitted = project([7 / 6, 5 / 3, 13 / 6]);
  const plane = [[0, 0, 0], [2, 2, 2], [2, 3, 4], [0, 1, 2]].map(project);
  return <Drawing name="regression-observation-projection" height={395} description="An explicitly different three-observation example projects a three-coordinate target onto the plane generated by the constant and distance columns" caption="Perspective view of R³: the plane spans (1,1,1) and (0,1,2). The white vector is y; violet is its fitted vector; orange is the residual between their tips. Screen angles are perspective angles, not measurements of the 3D right angle.">
    <polygon points={plane.map(point => point.join(',')).join(' ')} fill="#bb9aec" fillOpacity={.12} stroke="#bb9aec" />
    <Wire points={[origin, observed]} />
    <Wire points={[origin, fitted]} />
    <line x1={fitted[0]} y1={fitted[1]} x2={observed[0]} y2={observed[1]} stroke="#e99a61" strokeWidth={3} />
    <circle cx={observed[0]} cy={observed[1]} r={5} fill="#eeeae3" />
    <circle cx={fitted[0]} cy={fitted[1]} r={5} fill="#bb9aec" />
    <Label x={80} y={157} role="target">y</Label>
    <Label x={196} y={177} role="computed">Xβ</Label>
    <Label x={129} y={125} role="gradient">e = y − Xβ</Label>
    <Label x={236} y={68}>column plane</Label>
    <Label x={165} y={378}>origin</Label>
  </Drawing>;
}
export function DuplicateColumnsDrawing() {
  return <Drawing name="regression-duplicate-columns" height={422} description="Two identical distance columns contribute coefficients whose sum is the same under different choices; their difference is unidentifiable" caption="Every row has the same x in both columns. Moving one coefficient by +5 and the other by −5 leaves all predictions unchanged; the intercept stays 0.9.">
    {[70, 250].map((x, index) => <g key={x}>
      <Label x={x} y={28} role="input">same x column</Label>
      {[0, 1, 2, 3].map((value, row) => <g key={row}>
        <rect x={x - 30} y={51 + row * 40} width={60} height={40} fill="none" stroke="#67cbd9" />
        <Label x={x} y={77 + row * 40} role="input">{value}</Label>
      </g>)}
      <Value x={x} y={285} label={index ? 'coefficient 2' : 'coefficient 1'} value={index ? '0.45' : '0.45'} role="parameter" />
    </g>)}
    <Wire points={[[70, 308], [70, 345], [136, 345]]} />
    <Wire points={[[250, 308], [250, 345], [184, 345]]} />
    <Operation x={160} y={345} label="+" />
    <Label x={160} y={401} role="computed">0.45 + 0.45 = 5.45 − 4.55 = 0.9</Label>
  </Drawing>;
}
export function ConditioningDrawing() {
  return <Drawing name="regression-conditioning" height={390} description="A unit circle mapped by a diagonal matrix becomes an ellipse; its Gram matrix squares the two stretch factors" caption="This separate two-direction matrix fixture is diag(1,0.1), not the shipment matrix. Its stretches are 1 and 0.1 (condition number 10); the Gram matrix stretches are 1 and 0.01 (condition number 100). All axes use the same scale.">
    <Label x={160} y={28}>unit circle</Label>
    <circle cx={160} cy={106} r={60} fill="none" stroke="#67cbd9" />
    <Label x={160} y={207} role="computed">X = diag(1, 0.1)</Label>
    <ellipse cx={160} cy={235} rx={60} ry={6} fill="none" stroke="#bb9aec" strokeWidth={2} />
    <Label x={160} y={307} role="computed">XᵀX = diag(1, 0.01)</Label>
    <ellipse cx={160} cy={335} rx={60} ry={.6} fill="none" stroke="#eeeae3" />
    <Label x={160} y={385}>weak direction shrinks again</Label>
  </Drawing>;
}
export function WeightedRowDrawing({
  importance = .25
}) {
  const root = Math.sqrt(importance);
  const printed = value => Number(value.toFixed(4));
  return <Drawing name="regression-weighted-row" height={418} description="Shipment D's design row and target are multiplied by the square root of its importance, producing an equivalent ordinary least-squares row" caption="Only D changes weight. Each other row has importance 1 and remains unchanged. Scaling both sides makes its ordinary squared error equal to αD times the original squared error.">
    <Wire points={[[75, 104], [75, 177], [136, 177]]} />
    <Wire points={[[245, 104], [245, 177], [184, 177]]} />
    <Wire points={[[160, 201], [160, 227], [70, 227], [70, 315], [90, 315]]} />
    <Label x={75} y={28} role="input">D: [1, x, y]</Label>
    <Value x={75} y={81} label="" value="1, 3, 4" role="input" width={124} />
    <Label x={245} y={28} role="input">√αD</Label>
    <Value x={245} y={81} label="" value={printed(root)} role="input" />
    <Operation x={160} y={177} label="×" />
    <Label x={160} y={262} role="computed">weighted [1, x, y]</Label>
    <rect x={90} y={292} width={210} height={46} fill="none" stroke="#bb9aec" />
    {[root, 3 * root, 4 * root].map((value, index) => <g key={index}>
      {index > 0 && <line x1={90 + index * 70} x2={90 + index * 70} y1={292} y2={338} stroke="#bb9aec" />}
      <Label x={125 + index * 70} y={321} role="computed">{printed(value)}</Label>
    </g>)}
    <Label x={160} y={388}>Squared transformed error = αD × eD²</Label>
  </Drawing>;
}
function SharedPredictionErrorDrawing({ logistic }) {
  const columns = logistic ? [200] : [50, 150, 250, 350];
  const features = logistic ? [2] : [0, 1, 2, 3];
  const targets = logistic ? [1] : [1, 2, 2, 4];
  const parameters = logistic ? [-1, 1] : [0, 0];
  const errorOperationY = logistic ? 895 : 710;
  const targetY = logistic ? 790 : 610;
  const predictionY = logistic ? 680 : 490;
  const errorY = logistic ? 980 : 795;
  return <Drawing name={logistic ? 'regression-binary-shared-error' : 'regression-linear-shared-errors'} width={400} height={logistic ? 1055 : 870} description="Every prediction uses both old coefficients and the supplied feature; the prediction and observed target then form the common error used by both derivatives" caption={logistic ? 'Fresh fixed binary row: x=2 and y=1. The shared old coefficients give score 1, probability 0.731059 and probability error −0.268941. This error feeds both derivative branches in the next cutaway.' : 'Fresh original four-row fixture. Both old coefficients are zero, so all predictions are zero. Subtracting the supplied targets gives errors −1, −2, −2 and −4. Both derivatives use these same four errors.'}>
    <Value x={110} y={68} label="old intercept b" value={parameters[0]} role="parameter" width={110} />
    <Value x={290} y={68} label="old slope w" value={parameters[1]} role="parameter" width={110} />
    <Wire points={[[290, 91], [390, 91], [390, 245]]} />
    <Wire points={[[110, 91], [5, 91], [5, 355]]} />
    {columns.map((x, index) => {
      const score = parameters[0] + parameters[1] * features[index];
      const prediction = logistic ? 1 / (1 + Math.exp(-score)) : score;
      return <g key={x}>
        <Value x={x} y={185} label={logistic ? 'supplied x' : `x: ${'ABCD'[index]}`} value={features[index]} role="input" width={80} />
        <Wire points={[[x, 208], [x, 261]]} />
        <Wire points={[[390, 245], [x + 30, 245], [x + 30, 285], [x + 24, 285]]} />
        <Operation x={x} y={285} label="×" />
        <Label x={x} y={335} role="computed">{parameters[1] * features[index]}</Label>
        <Wire points={[[x, 309], [x, 381]]} />
        <Wire points={[[5, 355], [x - 30, 355], [x - 30, 405], [x - 24, 405]]} />
        <Operation x={x} y={405} label="+" />
        <Wire points={[[x, 429], [x, 467]]} />
        <Value x={x} y={490} label={logistic ? 'score z' : 'prediction ŷ'} value={score} width={80} />
        {logistic && <>
          <Wire points={[[x, 513], [x, 571]]} />
          <Operation x={x} y={595} label="σ" />
          <Wire points={[[x, 619], [x, 657]]} />
          <Value x={x} y={680} label="probability p" value="0.731059" width={112} />
        </>}
        <Value x={x} y={targetY} label="observed y" value={targets[index]} role="target" width={80} />
        <Wire points={[[x, predictionY + 23], [x - 43, predictionY + 23], [x - 43, errorOperationY], [x - 24, errorOperationY]]} />
        <Wire points={[[x, targetY + 23], [x, errorOperationY - 24]]} />
        <Operation x={x} y={errorOperationY} label="−" />
        <Wire points={[[x, errorOperationY + 24], [x, errorY - 23]]} />
        <Value x={x} y={errorY} label={logistic ? 'error p−y' : 'error ŷ−y'} value={Number((prediction - targets[index]).toFixed(6))} role="gradient" width={logistic ? 112 : 80} />
      </g>;
    })}
    <Label x={200} y={logistic ? 1032 : 847}>One shared old state, then one error per row</Label>
  </Drawing>;
}

function SharedGradientReductionDrawing({ logistic }) {
  if (logistic) return <Drawing name="regression-binary-gradient-branches" width={400} height={442} description="The same probability error is the intercept derivative and is multiplied by the supplied feature to make the slope derivative" caption="For this one binary row, the intercept derivative is p−y. The slope derivative is x(p−y) = 2 × (−0.268941) = −0.537883. Neither derivative uses a newly updated coefficient.">
    <Value x={100} y={70} label="shared p−y" value="−0.268941" role="gradient" width={112} />
    <Value x={300} y={70} label="supplied x" value="2" role="input" />
    <Wire points={[[100, 93], [100, 200], [176, 200]]} />
    <Wire points={[[300, 93], [300, 200], [224, 200]]} />
    <Operation x={200} y={200} label="×" />
    <Wire points={[[100, 93], [30, 93], [30, 360], [44, 360]]} />
    <Wire points={[[200, 224], [200, 360], [244, 360]]} />
    <Value x={100} y={360} label="gradient for b" value="−0.268941" role="gradient" width={112} />
    <Value x={300} y={360} label="gradient for w" value="−0.537883" role="gradient" width={112} />
  </Drawing>;
  const errors = [-1, -2, -2, -4];
  return <Drawing name="regression-linear-gradient-reductions" width={400} height={857} description="Shared prediction errors sum directly for the intercept; each error is first multiplied by its feature before the slope sum; both sums receive the same mean-squared-error factor two over four" caption="The intercept sums −1−2−2−4=−9. The slope sums 0−2−4−12=−18. For mean squared loss over four rows, both receive factor 2/n=0.5, giving gradients −4.5 and −9.">
    {errors.map((error, index) => {
      const x = 50 + index * 100;
      return <g key={x}>
        <Value x={x} y={80} label={`error ${'ABCD'[index]}`} value={error} role="gradient" width={80} />
        <Value x={x} y={190} label="supplied x" value={index} role="input" width={80} />
        <Wire points={[[x, 103], [x + 40, 103], [x + 40, 280], [x + 24, 280]]} />
        <Wire points={[[x, 213], [x, 256]]} />
        <Operation x={x} y={280} label="×" />
        <Wire points={[[x, 304], [x, 347]]} />
        <Value x={x} y={370} label="x × error" value={index * error} role="gradient" width={80} />
        <Wire points={[[x, 103], [x, 130], [5, 130], [5, 490], [76, 490]]} />
        <Wire points={[[x, 393], [x, 425], [300, 425], [300, 466]]} />
      </g>;
    })}
    <Operation x={100} y={490} label="Σ" />
    <Operation x={300} y={490} label="Σ" />
    <Wire points={[[100, 514], [100, 542]]} />
    <Wire points={[[300, 514], [300, 542]]} />
    <Value x={100} y={565} label="sum errors" value="−9" role="gradient" />
    <Value x={300} y={565} label="sum x × errors" value="−18" role="gradient" width={114} />
    <Value x={200} y={700} label="factor 2/n" value="0.5" role="input" />
    {[100, 300].map((x, index) => <g key={x}>
      <Wire points={[[x, 588], [x, 676]]} />
      <Wire points={[[200 + (index ? 42 : -42), 700], [x + (index ? -24 : 24), 700]]} />
      <Operation x={x} y={700} label="×" />
      <Wire points={[[x, 724], [x, 772]]} />
      <Value x={x} y={795} label={`gradient for ${index ? 'w' : 'b'}`} value={index ? '−9' : '−4.5'} role="gradient" width={114} />
    </g>)}
  </Drawing>;
}

export function RegressionUpdateDrawing({
  logistic = false
}) {
  const gradients = logistic ? [-.26894142137, -.53788284274] : [-4.5, -9];
  const parameters = logistic ? [-1, 1] : [0, 0];
  const rate = logistic ? .1 : .05;
  const names = ['b', 'w'];
  return <>
    <SharedPredictionErrorDrawing logistic={logistic} />
    <SharedGradientReductionDrawing logistic={logistic} />
    <Drawing name={logistic ? 'regression-logistic-gradient' : 'regression-same-state-update'} height={614} description="The two gradients already calculated from the shared old state are separately scaled and subtracted from the saved coefficients" caption={logistic ? 'Continue the same fixed binary row. The two gradients above are now scaled by rate 0.1 and subtracted from the saved old b=−1 and w=1. Solid arrows carry numerical operands.' : 'Continue the same original four rows. Both gradients above are now scaled by rate 0.05 and subtracted from the saved zero coefficients. The long side rails retain the old state; no newly updated b enters the w derivative.'}>
    {[75, 245].map((x, index) => <g key={x}>
      <Wire points={[[x, 210], [x, 266]]} />
      <Wire points={[[x, 314], [x, 345], [x + (index ? 70 : -70), 345], [x + (index ? 70 : -70), 378], [x + (index ? 57 : -57), 378]]} />
      <Wire points={[[x, 401], [x, 456]]} />
      <Wire points={[[x + (index ? 42 : -42), 68], [index ? 315 : 5, 68], [index ? 315 : 5, 480], [x + (index ? 24 : -24), 480]]} />
      <Wire points={[[x, 504], [x, 519], [x + (index ? 70 : -70), 519], [x + (index ? 70 : -70), 562], [x + (index ? 57 : -57), 562]]} />
      <Value x={x} y={68} label={`old ${names[index]}`} value={parameters[index]} role="parameter" />
      <Value x={x} y={187} label="gradient" value={Number(gradients[index].toFixed(6))} role="gradient" width={114} />
      <Operation x={x} y={290} label="×" />
      <Value x={x} y={378} label="η × gradient" value={Number((rate * gradients[index]).toFixed(6))} role="gradient" width={114} />
      <Operation x={x} y={480} label="−" />
      <Value x={x} y={562} label={`new ${names[index]}`} value={Number((parameters[index] - rate * gradients[index]).toFixed(6))} role="parameter" width={114} />
    </g>)}
    <Wire points={[[135, 290], [99, 290]]} />
    <Wire points={[[185, 290], [221, 290]]} />
    <Value x={160} y={290} label="rate η" value={rate} role="input" width={50} />
    <Label x={160} y={609}>Update both from the old state</Label>
    </Drawing>
  </>;
}
export function CurvatureDirectionDrawing() {
  const curvature = (9 + Math.sqrt(61)) / 2;
  const rates = [.05, .2, .3];
  return <Drawing name="regression-curvature-direction" height={422} description="Along the largest-curvature eigenvector, gradient descent multiplies signed parameter error by one minus learning-rate times curvature" caption="This is signed error along one parameter direction, not shipment distance. Each row starts at error +1. Crossing zero means oscillation; moving farther from zero means amplification.">
    <Label x={160} y={27}>Largest curvature λmax = 8.405125</Label>
    {rates.map((rate, index) => {
      const y = 114 + index * 112;
      const scale = value => 175 + value * 72;
      const after = 1 - rate * curvature;
      return <g key={rate}>
        <Label x={15} y={y - 38} anchor="start">η = {rate}; multiplier {after.toFixed(3)}</Label>
        <line x1={35} x2={270} y1={y} y2={y} stroke="#676b70" />
        <line x1={175} x2={175} y1={y - 9} y2={y + 9} stroke="#eeeae3" />
        <circle cx={scale(1)} cy={y} r={5} fill="#67cbd9" />
        <Wire points={[[scale(1), y], [scale(after), y]]} />
        <circle cx={scale(after)} cy={y} r={5} fill="#bb9aec" />
        <Label x={175} y={y + 29}>0</Label>
      </g>;
    })}
  </Drawing>;
}
export function BernoulliProductDrawing() {
  return <Drawing name="regression-joint-likelihood" height={400} description="Two conditionally independent observed labels select two probability masses; multiplication forms their joint likelihood, while negative logs turn the product into a sum" caption="Separate hand fixture: both observed labels receive probability 0.5. Their joint mass is 0.25, total negative log is 1.386294, and mean loss is 0.693147.">
    <Wire points={[[75, 83], [75, 151], [136, 151]]} />
    <Wire points={[[245, 83], [245, 151], [184, 151]]} />
    <Wire points={[[160, 175], [160, 218]]} />
    <Wire points={[[160, 264], [160, 291]]} />
    <Value x={75} y={60} label="row 1 mass" value="0.5" />
    <Value x={245} y={60} label="row 2 mass" value="0.5" />
    <Operation x={160} y={151} label="×" />
    <Value x={160} y={241} label="joint mass" value="0.25" width={112} />
    <Operation x={160} y={315} label="−log" />
    <Label x={160} y={361} role="computed">Total −log likelihood = 1.386294</Label>
  </Drawing>;
}
export function LogisticCurvatureDrawing() {
  return <Drawing name="regression-logistic-curvature" height={584} description="A parameter direction changes each row's score; nonnegative probability curvature weights its squared change, so every directional second derivative is nonnegative" caption="One row at p=0.5 with directional score change 2 contributes 0.25 × 2² = 1. Other rows add their own nonnegative terms. Convexity describes shape; section 8 separately checks whether finite minimizing coefficients exist.">
    <Wire points={[[75, 83], [75, 124]]} />
    <Wire points={[[75, 172], [75, 217]]} />
    <Wire points={[[75, 263], [75, 320], [136, 320]]} />
    <Wire points={[[245, 83], [245, 320], [184, 320]]} />
    <Wire points={[[160, 344], [90, 344], [90, 410], [110, 410]]} />
    <Wire points={[[160, 433], [160, 493]]} />
    <Wire points={[[275, 463], [275, 517], [184, 517]]} />
    <Value x={75} y={60} label="score change" value="xᵀv = 2" role="computed" width={126} />
    <Value x={245} y={60} label="p(1−p)" value="0.25" width={112} />
    <Operation x={75} y={148} label="²" />
    <Value x={75} y={240} label="squared change" value="4" width={126} />
    <Operation x={160} y={320} label="×" />
    <Value x={160} y={410} label="this row's term" value="1" width={100} />
    <Value x={275} y={440} label="other rows" value="≥ 0" width={60} />
    <Operation x={160} y={517} label="Σ" />
    <Label x={160} y={579}>Sum, then divide by row count: ≥ 0</Label>
  </Drawing>;
}
export function IRLSWorkingRowDrawing() {
  return <Drawing name="regression-irls-working-row" height={624} description="At score zero, a label-one row has probability one half, curvature one quarter and pseudo-response two; weighted quadratic fitting produces the Newton step" caption="This is one row of the overlapping eight-row binary fixture at β=0. Curvature W=0.25 changes with the current model; fixed data importance α has a different meaning.">
    <Wire points={[[75, 83], [75, 151], [136, 151]]} />
    <Wire points={[[245, 83], [245, 151], [184, 151]]} />
    <Wire points={[[160, 175], [160, 227]]} />
    <Wire points={[[160, 273], [160, 338]]} />
    <Value x={75} y={60} label="observed y" value="1" role="target" />
    <Value x={245} y={60} label="current p" value="0.5" />
    <Operation x={160} y={151} label="−" />
    <Value x={160} y={250} label="score correction numerator" value="0.5" width={126} />
    <Value x={265} y={298} label="curvature W" value="0.25" width={90} />
    <Wire points={[[265, 321], [265, 362], [184, 362]]} />
    <Operation x={160} y={362} label="÷" />
    <Wire points={[[160, 386], [160, 420], [70, 420], [70, 460], [104, 460]]} />
    <Wire points={[[160, 483], [160, 527]]} />
    <Wire points={[[265, 483], [265, 551], [184, 551]]} />
    <Value x={160} y={460} label="score correction" value="2" width={112} />
    <Value x={265} y={460} label="old score" value="0" width={84} />
    <Operation x={160} y={551} label="+" />
    <Label x={160} y={610} role="computed">working response = 2</Label>
  </Drawing>;
}
export function LogisticNewtonDrawing() {
  const initial = binaryCurvatureReport();
  const curvature = initial.hessian[1][1];
  const candidate = -initial.slopeGradient / curvature;
  const weights = Array.from({
    length: 101
  }, (_, index) => -1 + index * .03);
  return <RegressionPlot name="regression-newton-quadratic" description="The current logistic objective, its tangent and its second-order local quadratic at zero slope; the quadratic's minimum proposes the first Newton slope" xDomain={[-1, 2]} yDomain={[.5, 1.35]} xLabel="Slope w, with intercept held at its symmetric optimum 0" yLabel="Mean log loss + 0.1w²/2" clipMarks caption="Solid violet: the exact eight-row objective. Dashed cyan: local tangent. Gray: local quadratic. Both approximations touch the exact curve at w=0; the orange line locates the quadratic's proposed minimum w=0.526316. The fixed axes clip the curves where they leave this displayed range.">
    {({
      xScale,
      yScale,
      left,
      top,
      bottom
    }) => <>
      <RegressionPath points={weights.map(w => [w, binaryCurvatureReport(w).objective])} xScale={xScale} yScale={yScale} />
      <RegressionPath points={weights.map(w => [w, initial.objective + initial.slopeGradient * w])} xScale={xScale} yScale={yScale} color="#67cbd9" dashed />
      <RegressionPath points={weights.map(w => [w, initial.objective + initial.slopeGradient * w + curvature * w ** 2 / 2])} xScale={xScale} yScale={yScale} color="#969b9f" />
      <line x1={xScale(candidate)} x2={xScale(candidate)} y1={top} y2={bottom} stroke="#e99a61" strokeDasharray="4 4" />
      <circle cx={xScale(0)} cy={yScale(initial.objective)} r={5} fill="#eeeae3" />
      <RegressionSeriesLabel target={[xScale(1.5), yScale(binaryCurvatureReport(1.5).objective)]} position={[left + 4, 52]}>exact J</RegressionSeriesLabel>
      <RegressionSeriesLabel target={[xScale(1.2), yScale(initial.objective + initial.slopeGradient * 1.2 + curvature * 1.2 ** 2 / 2)]} position={[left + 4, 90]} color="#969b9f">local quadratic</RegressionSeriesLabel>
      <RegressionSeriesLabel target={[xScale(-.5), yScale(initial.objective - initial.slopeGradient * .5)]} position={[left + 4, 232]} color="#67cbd9">tangent</RegressionSeriesLabel>
    </>}
  </RegressionPlot>;
}
export function LibraryPenaltyDrawing() {
  return <Drawing name="regression-library-penalty" height={415} description="Sample count and scratch mean-loss penalty determine the library inverse-penalty parameter through C equals one over n lambda" caption="These are the same eight overlapping rows with λ=0.1. Duplicating every row doubles n, while mean loss and λ stay fixed; C must halve to preserve the matched optimum.">
    <Wire points={[[75, 83], [75, 151], [136, 151]]} />
    <Wire points={[[245, 83], [245, 151], [184, 151]]} />
    <Wire points={[[160, 175], [160, 218]]} />
    <Value x={75} y={60} label="row count n" value="8" role="input" />
    <Value x={245} y={60} label="mean penalty λ" value="0.1" role="input" />
    <Operation x={160} y={151} label="×" />
    <Value x={160} y={241} label="nλ" value="0.8" width={112} />
    <Wire points={[[160, 264], [160, 298]]} />
    <Operation x={160} y={322} label="1/" />
    <Label x={160} y={378} role="computed">C = 1.25</Label>
    <Label x={160} y={407} role="computed">Duplicate rows: C = 0.625</Label>
  </Drawing>;
}
export function PenaltyResponseDrawing() {
  const values = Array.from({
    length: 81
  }, (_, index) => -2 + index * .05);
  const rules = [{
    label: 'No penalty: w = a',
    solve: a => a
  }, {
    label: 'Ridge: w = a / 1.5',
    solve: a => a / 1.5
  }, {
    label: 'Lasso: w = sign(a) max(|a| − 0.5, 0)',
    solve: a => Math.sign(a) * Math.max(Math.abs(a) - .5, 0)
  }];
  return <>{rules.map((rule, index) => <RegressionPlot key={rule.label} name={`regression-penalty-response-${index}`} description={rule.label} xDomain={[-2, 2]} yDomain={[-2, 2]} xLabel="Unpenalized optimum a" yLabel={rule.label} caption={`Same one-coordinate squared loss and λ=0.5. The white point marks a=0.3, w=${Number(rule.solve(.3).toFixed(3))}.`}>
    {({
        xScale,
        yScale,
        left
      }) => <>
      <RegressionPath points={values.map(a => [a, rule.solve(a)])} xScale={xScale} yScale={yScale} />
      <circle cx={xScale(.3)} cy={yScale(rule.solve(.3))} r={5} fill="#eeeae3" />
      <RegressionSeriesLabel target={[xScale(1.2), yScale(rule.solve(1.2))]} position={[left + 4, 52]}>{['No penalty', 'Ridge', 'Lasso'][index]}</RegressionSeriesLabel>
    </>}
  </RegressionPlot>)}</>;
}
