import {
  betaPosteriorState, betaRegionState, betaDensity, betaTail, betaQuantile,
  betaPriors, logBeta, batchPredictionState, freshEvidenceState, exposureState,
  categoryState, knownNormalState, normalDensity, normalInverseGammaState,
  sleepInferenceState, sleepPairs, summarize, mergeSummaries, gridValues,
  studentLocationDensity, inverseGammaDensity, wordsState, allWords,
  sequencePatterns, modelEvidenceState, lossState, reporterGridState,
  reporterComponents, reporterDensity, gammaDensity,
} from '../../data/bayesian-inference-flow-models.js';
import { Figure, Compare, Scene, Label, Arrow, Ledger, Table, Plot, ProbabilityBars, TokenRows, Word, Simplex, filledCurve, number } from './BayesianInferenceDrawings.jsx';
export {
  ExposureTimelineFigure, GammaKernelFigure, RateUnitFigure, CountMixtureFigure,
  CategorySimplexFigure, CategoryDependenceFigure, DeclaredCategoryFigure,
  NormalQuadraticFigure, PrecisionWeightFigure, NoiseFloorFigure,
  NormalVarianceForkFigure, CompleteSquareFigure,
  StudentMixFigure, StudentScaleFigure, SummaryMergeFigure,
  SleepPairsFigure, SleepSummaryFigure, SleepPredictionFigure,
} from './BayesianInferenceContinuousFigures.jsx';
export {
  OrderedRunsFigure, PredictiveWordsFigure, ConditionalRunsFigure,
  EvidenceIntegralFigure, ModelIndicatorFigure, LossBranchesFigure,
  ReporterTreeFigure, GridCellFigure, ReporterMixtureFigure,
} from './BayesianInferencePredictiveFigures.jsx';

export function BetaDrawing({ state = betaPosteriorState(), region = 'interval', prior = true }) {
  const density = x => betaDensity(x, state.a, state.b);
  const low = region === 'threshold' ? state.threshold : state.low;
  const high = region === 'threshold' ? 1 : state.high;
  const lines = [{ points: state.curve }];
  if (prior && state.priorCurve) lines.unshift({ points: state.priorCurve, tone: 'prior', dashed: true });
  const ymax = Math.ceil(1.1 * Math.max(...lines.flatMap(line => line.points.map(p => p[1]))));
  return <><Plot label={`Beta(${state.a},${state.b}) posterior ${prior && state.priorCurve ? ' and cyan prior' : ''}`} yRange={[0, ymax]} lines={lines} regions={[filledCurve(density, low, high)]} markers={[{ x: low }, { x: high }]} /><p>The two curves share the labelled vertical range 0–{ymax}; this range is recomputed when the shapes change. The fill is {region === 'threshold' ? `P(θ>${number(state.threshold)})` : `${number(100 * state.level)}% equal-tailed probability`}, not density height.</p><Ledger rows={[[`central ${number(100 * state.level)}% endpoints`, `[${number(state.low)}, ${number(state.high)}]`], [`P(θ>${number(state.threshold)})`, number(state.above)]]} /></>;
}
export function VisitorModelFigure() {
  return <Figure id="visitor-model" caption="One shared parameter conditionally generates ten separately identified synthetic outcomes. The future visitor remains unobserved; the arrows specify the model rather than a causal conclusion."><Scene label="One theta node feeding ten observed visitors and one future visitor" height={300}><circle cx="180" cy="38" r="24" className="bf-simplex" /><Label x="180" y="43">θ</Label>{Array.from({ length: 10 }, (_, i) => <g key={i}><Arrow a={[180, 64]} b={[25 + 34 * i, 126]} tone={i < 8 ? 'posterior' : 'prior'} />{i < 8 ? <circle cx={25 + 34 * i} cy="145" r="13" className="bf-outcome success" /> : <path d={`M${25 + 34 * i},132L${38 + 34 * i},156H${12 + 34 * i}Z`} className="bf-outcome failure" />}<Label x={25 + 34 * i} y="150">{i < 8 ? 'S' : 'F'}</Label><Label x={25 + 34 * i} y="182">{i + 1}</Label></g>)}<Arrow a={[180, 65]} b={[180, 229]} dashed /><circle cx="180" cy="249" r="17" className="bf-simplex" /><Label x="180" y="254">?</Label><Label x="180" y="291">Future visitor 11</Label></Scene></Figure>;
}
export function LikelihoodSliceFigure() {
  const likelihood = x => x ** 8 * (1 - x) ** 2;
  return <Figure id="likelihood-slice" caption="The same ordered word is held fixed while the parameter changes. The two marked heights are data probabilities at their stated θ, not probabilities assigned to those parameter points."><Word label="D fixed" values={sequencePatterns[0].values} /><Plot label="Fixed-data likelihood slice" yRange={[0, .008]} yLabel="P(this ordered word | θ)" lines={[{ points: gridValues(likelihood, 0, 1), tone: 'neutral' }]} markers={[.5, .8].map(x => ({ x, y: likelihood(x) }))} /><Table label="Two slices through the same data/parameter model" headers={['θ fixed', 'Data fixed', 'Word likelihood']} rows={[[.5, 'SSSSSSSSFF', number(likelihood(.5), 8)], [.8, 'SSSSSSSSFF', number(likelihood(.8), 8)]]} /></Figure>;
}
export function NormalizationFigure() {
  const likelihood = x => x ** 8 * (1 - x) ** 2, prior = x => 6 * x * (1 - x), joint = x => prior(x) * likelihood(x), posterior = x => betaDensity(x, 10, 4);
  return <Figure id="normalization" caption="All panels use the same horizontal θ coordinate. The first density has unit area, the likelihood need not, and the product's area is evidence. Dividing every product height by that area produces the normalized posterior."><Compare><Plot label="Prior" yRange={[0, 1.6]} lines={[{ points: gridValues(prior, 0, 1), tone: 'prior', dashed: true }]} markers={[{ x: .7, y: prior(.7) }]} /><Plot label="Likelihood, fixed ordered word" yRange={[0, .008]} yLabel="word probability at θ" lines={[{ points: gridValues(likelihood, 0, 1), tone: 'neutral' }]} markers={[{ x: .7, y: likelihood(.7) }]} /><Plot label="Pointwise product: evidence area" yRange={[0, .008]} yLabel="prior × likelihood" lines={[{ points: gridValues(joint, 0, 1), tone: 'neutral' }]} regions={[filledCurve(joint, 0, 1, 'prior')]} markers={[{ x: .7, y: joint(.7) }]} /><Plot label="Product divided by Z" yRange={[0, 4]} lines={[{ points: gridValues(posterior, 0, 1) }]} regions={[filledCurve(posterior, 0, 1)]} markers={[{ x: .7, y: posterior(.7) }]} /></Compare><Ledger rows={[[`Prior at θ=.7`, number(prior(.7))], ['Likelihood at θ=.7', number(likelihood(.7), 8)], ['Product at θ=.7', number(joint(.7), 8)], ['Z: full product area', '3/1430'], ['Product / Z at θ=.7', number(posterior(.7))], ['Posterior full area', '1']]} /></Figure>;
}
export function PowerDrawing({ prior = { a: 2, b: 2 }, successes = 8, failures = 2 }) {
  const maximum = Math.max(prior.a - 1 + successes, prior.b - 1 + failures, 1);
  const scale = 240 / maximum;
  return <Scene label="Prior powers plus outcome powers; shape equals exponent plus one" height={220}>{[[prior.a - 1, successes, 'θ exponent', 'posterior'], [prior.b - 1, failures, '(1−θ) exponent', 'prior']].map(([before, added, label, tone], i) => <g key={label}><Label x="25" y={30 + 95 * i} anchor="start">{label}: {before} + {added} = {before + added}</Label><rect x="25" y={43 + i * 95} width={before * scale} height="23" className="bf-bar neutral" /><rect x={25 + before * scale} y={43 + i * 95} width={added * scale} height="23" className={`bf-bar ${tone}`} /><Label x="25" y={88 + 95 * i} anchor="start">shape {before + added + 1} = exponent + 1</Label></g>)}</Scene>;
}
export function BetaPowerFigure() {
  return <Figure id="beta-powers" caption="The neutral segments are prior exponents; the outcome segments add eight success and two failure powers. Exponent 9 means shape 10, and exponent 3 means shape 4."><TokenRows successes={8} failures={2} /><PowerDrawing /></Figure>;
}
export function BetaShapeFigure() {
  const u = x => 1 / (Math.PI * Math.sqrt(x * (1 - x)));
  return <Figure id="beta-shapes" caption="Same θ axis: uniform Beta(1,1); interior-peaked Beta(2,2); and proper U-shaped Beta(.5,.5). The U-shaped trace shows only its finite interior. Dashed endpoint arrows indicate divergent limits; no clipped probability area is claimed."><Plot label="Three proper Beta shapes" yRange={[0, 5]} lines={[{ points: gridValues(() => 1, 0, 1), tone: 'neutral' }, { points: gridValues(x => betaDensity(x, 2, 2), 0, 1), tone: 'prior', dashed: true }, { points: gridValues(u, .005, .995), tone: 'future' }]}>{({ X, Y }) => <><Arrow a={[X(.005), Y(u(.005))]} b={[X(.005), Y(5)]} tone="future" /><Arrow a={[X(.995), Y(u(.995))]} b={[X(.995), Y(5)]} tone="future" /></>}</Plot><Ledger rows={[[`Neutral`, 'Beta(1,1): flat'], ['Cyan dashed', 'Beta(2,2): interior maximum'], ['Violet', 'Beta(.5,.5): endpoint limits ∞'], ['Coordinate support', '0 ≤ θ ≤ 1; no endpoint atoms']]} /></Figure>;
}
export function CredibleAreaFigure() {
  const state = betaRegionState(), density = x => betaDensity(x, 10, 4);
  return <Figure id="credible-area" caption="Equal-tail endpoints come from cumulative area. Both tails contain .025, while the interval contains .95; the endpoint heights are not those probabilities."><Compare><Plot label="Two tails and central posterior region" yRange={[0, 4]} lines={[{ points: state.curve }]} regions={[filledCurve(density, 0, state.low, 'prior'), filledCurve(density, state.low, state.high), filledCurve(density, state.high, 1, 'future')]} markers={[{ x: state.low }, { x: state.high }]} /><Plot label="Cumulative posterior area F(θ)" yRange={[0, 1]} yLabel="F(θ): probability" lines={[{ points: gridValues(x => betaTail(x, 10, 4), 0, 1) }]} markers={[{ x: state.low, y: .025 }, { x: state.high, y: .975 }]}>{({ X, Y }) => <><path className="bf-reference" d={`M62,${Y(.025)}H${X(state.low)}V222M62,${Y(.975)}H${X(state.high)}V222`} /></>}</Plot></Compare><Ledger rows={[[`Lower quantile F=.025`, number(state.low)], ['Upper quantile F=.975', number(state.high)], ['Outside probability', '.025 + .025'], ['Inside probability', '.95']]} /></Figure>;
}
export function ThresholdRegionFigure() {
  const state = betaRegionState();
  return <Figure id="threshold-region" caption="The .70 threshold selects a right-hand probability region. Mean 5/7 and mode 3/4 are locations; neither marker carries continuous point mass."><BetaDrawing state={state} region="threshold" prior={false} /><Scene label="Separate threshold, mean and mode coordinates" height={135}><line x1="30" x2="330" y1="30" y2="30" className="bf-axis" />{[[.7, 'threshold .70', 65], [5 / 7, 'mean 5/7', 93], [.75, 'mode 3/4', 121]].map(([x, label, y]) => <g key={label}><path className="bf-reference" d={`M${30 + x * 300},30V${y - 15}H75`} /><Label x="68" y={y} anchor="start">{label}</Label></g>)}</Scene></Figure>;
}
export function SharedFutureFigure() {
  return <Figure id="shared-future" caption="Left: both future outcomes have the same latent parent. Right: each outcome has a newly drawn independent θ. Conditional independence in the first model does not make its marginal outcomes independent."><Compare>{[true, false].map(shared => <Scene key={String(shared)} label={shared ? 'One shared theta for two future trials' : 'Independent new theta for each trial'} height={210}>{shared ? <><circle cx="180" cy="40" r="23" className="bf-simplex" /><Label x="180" y="45">θ</Label><Arrow a={[180, 65]} b={[80, 135]} /><Arrow a={[180, 65]} b={[280, 135]} /></> : [80, 280].map((x, i) => <g key={x}><circle cx={x} cy="40" r="23" className="bf-simplex" /><Label x={x} y="45">θ{i + 1}</Label><Arrow a={[x, 65]} b={[x, 135]} /></g>)}{[80, 280].map((x, i) => <g key={x}><circle cx={x} cy="157" r="20" className="bf-simplex" /><Label x={x} y="162">Y{i + 1}</Label></g>)}<Label x="180" y="204">{shared ? 'same uncertain rate' : 'different independent rates'}</Label></Scene>)}</Compare></Figure>;
}
export function FutureJointFigure() {
  return <Figure id="future-joint" caption="The complete shared-rate table sums to one and retains success marginal 5/7. Its SS cell exceeds the product of the marginals; integrating a shared parent creates positive dependence."><Compare><Table label="Shared Beta(10,4) joint" headers={['Y1 / Y2', 'S', 'F']} rows={[[`S`, '11/21', '4/21'], ['F', '4/21', '2/21']]} /><Table label="Independent same-mean comparison" headers={['Y1 / Y2', 'S', 'F']} rows={[[`S`, '25/49', '10/49'], ['F', '10/49', '4/49']]} /></Compare><Scene label="Shared joint SS branch versus independent SS branch" height={170}><Arrow a={[40, 45]} b={[165, 45]} /><Arrow a={[180, 45]} b={[310, 45]} /><Label x="90" y="25">first S: 5/7</Label><Label x="246" y="25">second S|S: 11/15</Label><Label x="180" y="91">shared joint SS = 11/21</Label><Label x="180" y="127">independent joint SS = 25/49</Label><Label x="180" y="161">covariance = 2/147</Label></Scene></Figure>;
}
export function BatchDrawing({ state = batchPredictionState() }) {
  return <><ProbabilityBars label="Integrated versus same-mean plug-in future counts" rows={state.points} series={[['integrated', 'posterior'], ['plugin', 'prior']]} selected={row => row.k >= state.threshold} xLabel="future success count K" /><Ledger rows={[[`Future size / inclusive cutoff`, `${state.m} / ${state.threshold}`], ['Common mean count', number(state.mean)], ['Integrated / plug-in variance', `${number(state.variance)} / ${number(state.pluginVariance)}`], ['P(K ≥ cutoff), integrated / plug-in', `${number(state.integratedTail)} / ${number(state.pluginTail)}`]]} /></>;
}
export function BatchVarianceFigure() {
  const state = batchPredictionState(), total = state.variance, within = 10 * (5 / 7 - 11 / 21), between = 100 * 2 / 147;
  return <Figure id="batch-variance" caption="A shared θ mixes conditional count distributions. The decomposition below is within-θ noise plus between-θ uncertainty: E Var(K|θ)=40/21 and Var E(K|θ)=200/147. Their sum 160/49 differs from plug-in variance 100/49."><Scene label="Posterior parameter feeds a conditional ten-visitor count, then integrated count masses" height={150}><circle cx="55" cy="52" r="24" className="bf-simplex" /><Label x="55" y="57">θ</Label><Arrow a={[81, 52]} b={[173, 52]} /><Label x="124" y="30">shared rate</Label><circle cx="198" cy="52" r="24" className="bf-simplex" /><Label x="198" y="57">K</Label><Arrow a={[224, 52]} b={[318, 52]} /><Label x="25" y="110" anchor="start">θ ~ Beta(10,4)</Label><Label x="25" y="140" anchor="start">K | θ ~ Binomial(10,θ)</Label></Scene><BatchDrawing state={state} /><Scene label="Actual within and between conditional variance contributions" height={125}><rect x="25" y="25" width={310 * within / total} height="28" className="bf-bar prior" /><rect x={25 + 310 * within / total} y="25" width={310 * between / total} height="28" className="bf-bar posterior" /><Label x="25" y="83" anchor="start">within: {number(within)} counts²</Label><Label x="25" y="114" anchor="start">between: {number(between)} counts²</Label></Scene></Figure>;
}
export function MeanWeightFigure() {
  return <Figure id="mean-weights" caption="Four units of prior mean weight plus ten observed outcomes compose the posterior mean. Kernel exponents 1,1 are a different pair of quantities; the prior is not four historical visitors."><Scene label="Prior and observed mean locations and distinct weighted segments" height={245}><line x1="30" x2="330" y1="50" y2="50" className="bf-axis" /><circle cx="180" cy="50" r="5" className="bf-point prior" /><circle cx="270" cy="50" r="5" className="bf-point posterior" /><circle cx={30 + 300 * 5 / 7} cy="50" r="5" className="bf-point future" /><Label x="180" y="26">prior .5</Label><Label x="298" y="84">data .8</Label><path className="bf-reference" d={`M${30 + 300 * 5 / 7},50V110H150`} /><Label x="135" y="115">posterior 5/7</Label><rect x="30" y="145" width={300 * 4 / 14} height="25" className="bf-bar prior" /><rect x={30 + 300 * 4 / 14} y="145" width={300 * 10 / 14} height="25" className="bf-bar posterior" /><Label x="30" y="198" anchor="start">mean weights: 4 + 10 = 14</Label><Label x="30" y="231" anchor="start">prior kernel exponents: 1, 1</Label></Scene></Figure>;
}
export function FreshDrawing({ state = freshEvidenceState() }) {
  return <><TokenRows successes={8} failures={2} label="D1, fixed original rows" /><TokenRows successes={state.freshSuccesses} failures={state.freshFailures} label="D2, genuinely fresh rows" /><Scene label="Sequential and pooled unique-row updates agree; duplicate D1 is crossed out" height={220}><Label x="20" y="25" anchor="start">start (2,2) → D1 → (10,4)</Label><Arrow a={[65, 55]} b={[280, 55]} /><Label x="20" y="90" anchor="start">then D2 → ({state.a},{state.b})</Label><Label x="20" y="130" anchor="start">pool D1 ∪ D2 → ({state.pooled.join(',')})</Label><Label x="20" y="178" anchor="start">duplicate D1 → (18,6)</Label><path className="bf-reference" d="M15,158L320,190M15,190L320,158" /></Scene><Ledger rows={[[`Unique posterior mean`, number(state.mean)], ['Actual fresh row count', state.freshSuccesses + state.freshFailures]]} /></>;
}
export function FreshFactorFigure() {
  return <Figure id="fresh-factors" caption="D1 and D2 are disjoint dataset identities. Sequential factors and their pooled unique counts agree. The crossed route deliberately repeats D1 and is not new evidence."><FreshDrawing /></Figure>;
}
export function SurprisingVarianceFigure() {
  const prior = x => betaDensity(x, 100, 1), posterior = x => betaDensity(x, 100, 2);
  return <Figure id="surprising-variance" caption="One failure moves uncertainty away from the boundary. Both distributions share the fixed zoom. Their displayed variances show that this realized update widens the posterior."><Plot label="Beta(100,1) versus Beta(100,2), fixed endpoint zoom" xRange={[.9, 1]} yRange={[0, 105]} lines={[{ points: gridValues(prior, .9, 1), tone: 'prior', dashed: true }, { points: gridValues(posterior, .9, 1) }]} /><Ledger rows={[[`Prior variance`, number(100 / (101 ** 2 * 102), 9)], ['Posterior variance', number(200 / (102 ** 2 * 103), 9)]]} /></Figure>;
}
export function ExcludedSupportFigure() {
  const candidates = [.2, .5, .7], weights = [.2, .5, .3], joint = candidates.map((x, i) => weights[i] * x ** 8 * (1 - x) ** 2), z = joint.reduce((s, x) => s + x, 0);
  return <Figure id="excluded-support" caption="A different discrete model has three existing parameter atoms and none at .8. Multiplying its masses by a positive likelihood reweights those atoms; it creates no new atom."><Compare>{[['Prior atom masses', weights], ['Posterior atom masses', joint.map(x => x / z)]].map(([label, masses]) => <Plot key={label} label={label} yRange={[0, 1]} yLabel="discrete atom mass" lines={[]} markers={candidates.map((x, i) => ({ x, y: masses[i] }))}>{({ X, Y }) => <>{candidates.map((x, i) => <line key={x} x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(masses[i])} className="bf-arrow posterior" />)}<path d={`M${X(.8) - 7},${Y(0) - 7}L${X(.8) + 7},${Y(0) + 7}M${X(.8) - 7},${Y(0) + 7}L${X(.8) + 7},${Y(0) - 7}`} className="bf-reference" /></>}</Plot>)}</Compare><Table label="Actual three-atom update" headers={['θ atom', 'Prior mass', 'Likelihood', 'Posterior mass']} rows={candidates.map((x, i) => [x, weights[i], number(x ** 8 * (1 - x) ** 2, 9), number(joint[i] / z)])} /></Figure>;
}
