import { H2, H3, Prose, Code } from '../../components/content';
import { MathBlock } from '../../components/content/Math.jsx';
import { Checkpoint, LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import { RunnableExample as CompleteExample } from '../../components/lesson-labs/RunnableExample.jsx';
import {
  VisitorModelFigure, LikelihoodSliceFigure, NormalizationFigure, BetaPowerFigure,
  BetaShapeFigure, CredibleAreaFigure, ThresholdRegionFigure, SharedFutureFigure,
  FutureJointFigure, BatchVarianceFigure, MeanWeightFigure, FreshFactorFigure,
  SurprisingVarianceFigure, ExcludedSupportFigure, ExposureTimelineFigure,
  GammaKernelFigure, RateUnitFigure, CountMixtureFigure, CategorySimplexFigure,
  CategoryDependenceFigure, DeclaredCategoryFigure, NormalQuadraticFigure,
  PrecisionWeightFigure, NoiseFloorFigure, NormalVarianceForkFigure,
  CompleteSquareFigure, StudentMixFigure, StudentScaleFigure, SummaryMergeFigure,
  SleepPairsFigure, SleepSummaryFigure, SleepPredictionFigure, OrderedRunsFigure,
  PredictiveWordsFigure, ConditionalRunsFigure, EvidenceIntegralFigure,
  ModelIndicatorFigure, LossBranchesFigure, ReporterTreeFigure, GridCellFigure,
  ReporterMixtureFigure,
} from '../../components/lesson-labs/BayesianInferenceFigures.jsx';
import {
  BetaUpdateLab, BetaRegionLab, BatchPredictionLab, PriorSensitivityLab,
  FreshEvidenceLab, ExposureLab, CategoryLab, KnownNormalLab, UnknownNormalLab,
  SleepInferenceLab, PredictiveRunsLab, ModelEvidenceLab, PosteriorLossLab,
  ReporterGridLab,
} from '../../components/lesson-labs/BayesianInferenceFlowLabs.jsx';
import { bayesianInferenceNewExamples as newExamples } from '../bayesian-inference-reading-flow-examples.js';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/bayesian-inference-reading-flow.css';
import { bayesianInferenceExamples as examples } from '../bayesian-inference-examples.js';
function Practice({
  question,
  prompt,
  hint,
  children
}) {
  return <section className="lesson-check"><h3>{question}</h3>{prompt}<details><summary>Hint</summary><Prose>{hint}</Prose></details><details><summary>Show explained solution</summary>{children}</details></section>;
}

function RunnableExample({ example }) {
  return <section><Prose><strong>Before running.</strong> {example.question}</Prose><CompleteExample example={example} /></section>;
}
export default {
  title: 'Bayesian Inference & Conjugate Priors',
  readTime: '~110 min read + 3–4 hours practice',
  hasIntegratedGuide: true,
  content: () => <div className="lesson-pilot lesson-flow bayesian-inference-lesson">
    <LessonIntro prerequisites="Conditional probability, probability mass versus density, expectation and variance from Probability Distributions. MLE/MAP introduced fitting a parameter; Hypothesis Testing distinguished repeated-sampling intervals. We recap the required distinctions before using them. The optional unknown-variance branch uses completing a quadratic square and an additional distribution family." sections={[['1-eight-visitors-do-not-determine-a-rate', 'Specify the model'], ['2-derive-the-update-and-keep-its-uncertainty', 'Beta updating and intervals'], ['3-predict-a-batch-with-shared-uncertainty', 'Future counts and dependence'], ['4-add-only-new-evidence-and-question-the-prior', 'Sequential updates and sensitivity'], ['5-count-events-and-the-time-you-watched', 'Gamma rates and exposure'], ['6-move-from-two-outcomes-to-many', 'Categorical conjugacy'], ['7-combine-noisy-measurements-by-precision', 'Normal means and predictions'], ['8-check-what-the-model-fails-to-describe', 'Predictive model checks'], ['9-compare-models-and-choose-an-action', 'Evidence, decisions and computation'], ['10-practise-the-complete-inference-loop', 'Independent practice']]}>Eight of ten sampled visitors try a new feature. Should you expect eight successes among the next ten? How confident should you be that the underlying adoption rate exceeds 70%? Follow the observations from assumptions to a posterior distribution, future outcomes, model checks and a decision. On a first pass, work through the binary update, parameter areas, shared prediction and fresh evidence in sections 1–4, then compare exposure, category and known-noise updates in sections 5–7. Return to the marked unknown-noise and recorded-data branch, replicated-data checking, model evidence and numerical approximation for their deeper derivations. The final practice combines these routes.</LessonIntro>

    <H2>1. Eight visitors do not determine a rate</H2>
    <Prose>The observed fraction is .8. The <strong>long-run adoption probability</strong>, written θ (“theta”), is unknown. Ten visitors provide limited information: several rates could plausibly produce eight successes. A Bayesian model represents uncertainty about θ with a distribution, then updates that distribution when observations arrive. It does not declare that a particular physical probability must itself fluctuate between visitors.</Prose>
    <Prose>Specify the experiment before calculating. Our synthetic example assumes independently sampled binary outcomes <em>conditional on the same fixed θ</em>. Every visitor has that adoption chance; the sample was not filtered to show enthusiastic users. Repeat visits, targeted recruitment, time drift and correlated households can require a different likelihood. A mathematically correct update cannot repair those assumptions automatically.</Prose>
    <VisitorModelFigure />
    <Prose>Each observed mark belongs to a distinct synthetic visitor; all ten branches refer to one shared θ. A new visitor is another outcome, while changing θ asks about another possible explanation of the same recorded marks. Keep those two directions separate when reading the next curve.</Prose>
    <LikelihoodSliceFigure />
    <Prose>For this fixed ordered word, L(θ;D)=θ⁸(1−θ)². Its largest height occurs at θ=.8, but its area over candidate rates is not required to equal one. The curve measures compatibility of the fixed data with each rate; it is not yet our uncertainty distribution.</Prose>
    <LessonTable caption="Three distributions answer three different questions" headers={['Object', 'What varies?', 'Question']} rows={[['Likelihood L(θ; D)', 'Candidate parameter, observed data D fixed', 'How compatible are these observations with this rate?'], ['Posterior π(θ | D)', 'Parameter under the model after data', 'How is our remaining uncertainty distributed?'], ['Predictive distribution', 'Future observable outcomes', 'What could happen next, averaging over that uncertainty?']]} />
    <Prose>A <strong>prior</strong> π(θ) expresses uncertainty before this dataset. Choose a proper prior before combining its density with the likelihood.</Prose>
    <Prose>For the illustrated normalization, choose prior density 6θ(1−θ), called Beta(2,2). Its area on [0,1] is one; the next section derives the general Beta family. The drawing separates that proper density from the likelihood and their product.</Prose>
    <NormalizationFigure />
    <Prose>Here the Beta(2,2) prior is 6θ(1−θ), so the product is 6θ⁹(1−θ)³. Its area is 3/1430; dividing by that area gives posterior density 2860θ⁹(1−θ)³. If only the count eight was recorded, its 45 possible arrangements multiply both product and evidence: the count evidence is 27/286, while the same posterior remains.</Prose>
    <Prose>The drawing’s product becomes our normalized <strong>posterior</strong> π(θ|D). In general, multiply the likelihood by the prior and divide by the total weighted likelihood so the result has area one:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\pi(\theta\mid D)=\frac{L(\theta;D)\pi(\theta)}{Z(D)},\\
Z(D)=\int_0^1 L(u;D)\pi(u)\,du.
\end{gathered}`}</MathBlock>
    <Prose>The integration variable u is a placeholder. The denominator Z is called the <strong>marginal likelihood</strong> or <strong>evidence</strong>. It must be finite and positive for this posterior formula to work. It is a probability for discrete data and a data density for continuous data; it is not generally a probability density over θ. Later we will need its actual value when comparing models.</Prose>
    <Prose>The preceding MLE/MAP lesson chooses particular parameter values. Here the distribution remains central: a point summary alone cannot give an interval or a future-batch tail probability. The visitor, event-count and four-number Gaussian examples are synthetic; the later sleep branch uses ten recorded pairs with explicit provenance. Eleven complete original programs remain, and four new complete routes add a maintained normal update, ordinary SciPy evaluation, observed-pair inference and an independent grid reference. Each block has its own descriptive filename. Most original calculations use Python's standard library; the marked Student and library routes require NumPy/SciPy. Follow each block's imports and command before running it. Browser investigations use their separately described bounded models.</Prose>

    <H2>2. Derive the update and keep its uncertainty</H2>
    <Prose>A <strong>Beta distribution</strong> describes a number between zero and one. Its positive shape parameters α and β determine how its density spreads across possible rates. Beta(1, 1) is uniform; Beta(2, 2) prefers the middle; Beta(20, 20) has a much stronger preference near one half. Beta(3, 7) favors lower rates. The parameters specify a distribution, not extra actual visitors.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\pi(\theta)=\frac{\theta^{\alpha-1}(1-\theta)^{\beta-1}}{B(\alpha,\beta)},\\
0<\theta<1,\\
B(\alpha,\beta)=\int_0^1 u^{\alpha-1}(1-u)^{\beta-1}\,du.
\end{gathered}`}</MathBlock>
    <Prose>The Beta function B is simply the area needed to normalize those powers. Positive α and β make the integral finite. For positive integer shapes, B(α, β) = (α−1)!(β−1)!/(α+β−1)!, which supplies exact fractions for our modest examples.</Prose>
    <Prose>Let s count successes and f count failures. The likelihood of one particular ordered sequence is θˢ(1−θ)ᶠ. If only the total count was recorded, multiply by the number of possible arrangements, choose(s+f, s). That multiplier is constant in θ and cancels when normalizing the posterior. It still belongs in the probability of the count event.</Prose>
    <BetaPowerFigure />
    <Prose>The prior contributes exponents 1 and 1; the observations contribute 8 and 2. Their sums 9 and 3 match Beta(10,4), whose exponents are always one less than its shape parameters. The exponents add exactly, without an approximation.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
L(\theta;D)\pi(\theta)\\
\propto\
\theta^{s+\alpha-1}(1-\theta)^{f+\beta-1},\\
\theta\mid D\sim\operatorname{Beta}(a,b),\\
a=\alpha+s,\qquad b=\beta+f.
\end{gathered}`}</MathBlock>
    <Prose>The posterior is another Beta distribution because multiplying powers adds their exponents. This is <strong>conjugacy</strong>: a prior family stays within that family under the chosen likelihood. It makes this calculation exact and convenient. It says nothing about whether the likelihood describes real visitors well.</Prose>
    <Prose>The mean and variance follow by integrating θ or θ² against the posterior. For example, E[θ|D] = B(a+1,b)/B(a,b) = a/(a+b). Applying the same ratio to θ², then subtracting the squared mean, gives:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\mathbb E[\theta\mid D]=\frac{a}{a+b},\\
\operatorname{Var}(\theta\mid D)\\ =
\frac{ab}{(a+b)^2(a+b+1)}.
\end{gathered}`}</MathBlock>
    <Prose>With the Beta(2, 2) prior and 8/10 data, the posterior is Beta(10, 4). Its mean is 5/7 ≈ .714286. For a,b &gt; 1, differentiating the log density gives the mode (a−1)/(a+b−2), here 3/4. The mean, mode and observed fraction .8 are different summaries with different meanings.</Prose>
    <H3>An interval contains probability, not a guarantee about every study</H3>
    <Prose>A <strong>95% credible interval</strong> contains 95% of posterior probability under the stated model and prior. An equal-tailed interval leaves .025 below its lower endpoint and .025 above its upper endpoint. It need not be the shortest interval. A highest-density region answers another geometric question and can be disconnected for a multimodal posterior; density-based regions also depend on the parameter coordinate, as the MAP lesson explained.</Prose>
    <CredibleAreaFigure />
    <Prose>The lower endpoint is the .025 quantile and the upper endpoint the .975 quantile: each is found by accumulating density area, not by reading a density height. The unshaded tails each contain .025; the central band contains .95.</Prose>
    <ThresholdRegionFigure />
    <Prose>The shaded region to the right of .70 asks P(θ&gt;.70|D). A mean or mode is one marked coordinate with zero continuous point probability; neither supplies the shaded area.</Prose>
    <Prose><strong>Change the observations.</strong> Choose a listed proper prior, then enter successes and failures between 0 and 40. The 95% central interval and .70 threshold stay fixed and visible, so differences come from the prior or genuinely different data. Zero observations return the prior; under a uniform prior, ten failures give Beta(1,11), next-success probability 1/12 and boundary mode zero. Invalid entries clear the computed result until valid counts are supplied; Reset restores Beta(2,2) with eight successes and two failures.</Prose>
    <BetaUpdateLab />
    <Prose>For Beta(10, 4), the equal-tailed 95% interval is approximately [.461868, .909080]. The probability that θ exceeds .70 is about .579394. These are probabilities about the unknown <em>parameter</em> under this posterior, not statements that the next visitor's binary outcome lies between .46 and .91.</Prose>
    <Prose><strong>Change the probability question.</strong> The next investigation keeps Beta(10,4) fixed. Move the threshold from zero to one, or select a 90%, 95% or 99% central interval. Its threshold area and interval area answer separate questions. At thresholds zero and one the upper probabilities are exactly one and zero; a continuous endpoint is not a point atom. Reset restores .70 and 95%.</Prose>
    <BetaRegionLab />
    <RunnableExample example={examples.betaUpdate} />
    <Prose>The program's integer-shape Beta CDF equals a binomial upper tail; its survival function uses the other tail directly. A bisection repeatedly halves a bracket until its CDF reaches the requested probability. This avoids installing a library for the original example. General positive real shapes, extreme probabilities or very large counts deserve a validated numerical library, with direct survival methods when subtracting from one would lose a tiny tail.</Prose>
    <Prose>A 95% <strong>confidence interval</strong> instead describes repeated-sampling coverage of a procedure at a fixed parameter. Similar endpoints do not make these interpretations interchangeable. A Bayesian credible procedure has its corresponding average coverage under the joint prior-and-data model; that does not promise 95% coverage at every particular fixed θ or under a misspecified model.</Prose>
    <Checkpoint prompt="Increase the sample from 8/10 to 80/100 successes while keeping Beta(2,2). What happens to the mean, and why?"><Prose>The posterior becomes Beta(82,22), with mean 82/104 = 41/52 ≈ .788462. It moves closer to the observed fraction .8 because the fixed prior weight is now smaller relative to the new dataset. This compares two sample sizes; it does not count the original ten observations twice.</Prose></Checkpoint>
    <Checkpoint prompt="Under a uniform prior, ten failures and no successes give which next-success probability? Is a boundary MAP of zero the same thing?"><Prose>The posterior is Beta(1, 11), whose mean and next-success probability are 1/12. Its density mode is at zero, but a continuous posterior assigns zero probability to any individual point. A finite sequence of failures has not proved that success is impossible.</Prose></Checkpoint>
    <BetaShapeFigure />
    <section data-lesson-teaching="" className="lesson-teaching-section"><h3 className="lesson-teaching-section__title">Positive shapes below one are valid too</h3><Prose>Beta(.5, .5) has an integrable density that diverges toward both endpoints. A plot that clips those heights does not make the clipped points finite modes. The update still adds observed counts, but the familiar interior-mode formula needs a,b &gt; 1. Beta(1,1) is flat; if one shape is one and the other exceeds one, its maximum is at the corresponding boundary. The U-shaped drawing labels the divergent endpoint behavior and represents its integrable interior; a finite plotting cap would not turn infinite endpoint limits into finite heights. Editable browser priors use listed positive integers; arbitrary positive shapes use the later SciPy route. This numerical restriction belongs to that demonstration, not to Bayesian inference.</Prose></section>

    <H2>3. Predict a batch with shared uncertainty</H2>
    <Prose>To predict a next success, average its chance θ across the posterior: P(Y=1|D) = E[θ|D] = a/(a+b). For m future visitors, the expected number of successes is m times that number. But a mean is not a distribution. All future visitors share the same uncertain θ.</Prose>
    <SharedFutureFigure />
    <Prose>Two future outcome branches descend from the same uncertain θ. They are independent when that θ is given. Averaging out the common parent produces a different joint experiment from drawing an independent new θ for each future visitor.</Prose>
    <FutureJointFigure />
    <Prose>Under Beta(10,4), the two-success cell has probability E[θ²]=11/21. The two mixed cells each have probability E[θ(1−θ)]=4/21, and the two-failure cell has probability 2/21. They add to one and preserve each visitor’s success probability 5/7. Multiplying those marginal probabilities instead gives the independent plug-in table, which changes the joint cells.</Prose>
    <Prose>Let K count successes among m future visitors. At a fixed θ, K is Binomial(m,θ); averaging over the shared uncertain rate creates a count mixture. Compare its bars with the single-rate plug-in prediction.</Prose>
    <BatchVarianceFigure />
    <Prose><strong>Change the future batch.</strong> Keep the observed posterior fixed, choose a future size from 1 to 20 and an inclusive cutoff from zero to that size. The highlighted bars are K at least that cutoff in each distribution. If reducing the size would leave an impossible cutoff, the cutoff moves down to the new size. At size one the distributions agree; cutoff zero includes all outcomes. Reset uses ten future visitors and cutoff nine.</Prose>
    <BatchPredictionLab />
    <Prose>For ten future visitors after Beta(10,4), both the integrated model and Binomial(10, 5/7) expect 50/7 ≈ 7.142857 successes. The integrated variance is 160/49 ≈ 3.265306; the plug-in variance is only 100/49 ≈ 2.040816. The probability of at least nine successes is about .250736 versus .172858. Shared uncertainty changes the risk of an extreme batch.</Prose>
    <Prose>Integrating the complete conditional probability mass against Beta(a,b) gives the <strong>Beta-Binomial predictive distribution</strong>:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
P(K=k\mid D)\\
={m\choose k}\int_0^1\\
\theta^k(1-\theta)^{m-k}
\pi(\theta\mid D)\,d\theta\\
={m\choose k}\frac{B(a+k,b+m-k)}{B(a,b)},\\
k=0,\ldots,m.
\end{gathered}`}</MathBlock>
    <Prose>The integral is another Beta normalizer. This is a useful recurring trick: integrate a prediction by recognizing the normalized family, rather than replace all uncertainty with a single best rate.</Prose>
    <H3>Derive where the extra variance comes from</H3>
    <Prose>Write p = a/(a+b). For two distinct future indicators Yᵢ,Yⱼ, conditional independence gives E[YᵢYⱼ|θ] = θ². After averaging over θ, their covariance is E[θ²|D]−E[θ|D]² = Var(θ|D), which is positive here. Each single future indicator still has variance p(1−p). Add the m individual variances and the m(m−1) ordered pair covariances:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\operatorname{Var}(K\mid D)\\
=mp(1-p)\\
{}+m(m-1)\operatorname{Var}(\theta\mid D)\\
=mp(1-p)\frac{a+b+m}{a+b+1}.
\end{gathered}`}</MathBlock>
    <Prose>The correlation of distinct future indicators is 1/(a+b+1). This is dependence from sharing an uncertain rate, not an added story that one visitor persuades another. A different model with a fresh independently drawn θ for every visitor would remove that shared uncertainty and produce the plug-in Binomial count distribution.</Prose>
    <RunnableExample example={examples.batchPrediction} />
    <Prose>With m=1 the two distributions agree. With the same posterior mean but increasing concentration a+b, their difference shrinks for a fixed future batch. If a rare high count has a large operational cost, use the distribution appropriate to the shared-rate model rather than infer safety from matching means.</Prose>

    <H2>4. Add only new evidence and question the prior</H2>
    <Prose>Fresh observations multiply a new likelihood factor. A posterior may serve as the next prior because it already represents the old factor; multiplying that factor again would count the same records twice.</Prose>
    <FreshFactorFigure />
    <Prose>After Beta(10,4), five new visitors give three successes and two failures. Reusing the posterior as the next prior gives Beta(13,6), mean 13/19 ≈ .684211. Starting again from Beta(2,2) and pooling all eleven successes/four failures gives the same result. Multiplication is associative, and the sufficient totals add.</Prose>
    <Prose>The order of genuinely new observations does not matter under this fixed common-rate likelihood. Counting the original ten rows twice instead gives Beta(18,6), a different and unjustified answer. Identical observed values can be new evidence; duplicated records are not. If the rate itself changes with time, updating one fixed θ forever can also become the wrong model.</Prose>
    <MeanWeightFigure />
    <Prose>The prior mean .5 carries weight four, while the observed fraction .8 carries weight ten. Their combined mean is (4×.5+10×.8)/14=5/7. These mean weights are the shapes’ sum and sample size; they are not the prior kernel’s exponents 1 and 1.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\frac{\alpha+s}{\alpha+\beta+n}
=\frac{\alpha+\beta}{\alpha+\beta+n}\frac{\alpha}{\alpha+\beta}\\
{}+\frac{n}{\alpha+\beta+n}\frac{s}{n},\qquad n>0.
\end{gathered}`}</MathBlock>
    <Prose>This expresses the posterior mean as a weighted compromise between prior mean and observed fraction. In this particular mean formula, α+β acts like a prior weight. The analogy does not create historical observations. The MAP uses different exponents; a prior's meaning also depends on its family, coordinate and the quantity being predicted.</Prose>
    <LessonTable caption="The same 8/10 evidence under four declared priors" headers={['Prior', 'Posterior', 'Mean']} rows={[['Beta(1,1)', 'Beta(9,3)', '.75'], ['Beta(2,2)', 'Beta(10,4)', '5/7 ≈ .714286'], ['Beta(20,20)', 'Beta(28,22)', '.56'], ['Beta(3,7)', 'Beta(11,9)', '.55']]} />
    <Prose><strong>Compare assumptions on the same observations.</strong> The prior selector below changes only the proper prior among those four choices; successes remain eight and failures two. Read how its prior curve, posterior curve and event area change together. Reset returns Beta(2,2); selecting another prior does not add evidence.</Prose>
    <PriorSensitivityLab />
    <Prose><strong>Add a fresh batch.</strong> Now keep the first eight successes/two failures and the Beta(2,2) starting prior fixed, and enter fresh successes/failures from 0 to 20. Zero fresh counts leave Beta(10,4); Reset adds three and two. The separately labelled duplicate-record comparison is a counterexample, not another permitted source of data.</Prose>
    <FreshEvidenceLab />
    <Prose>With little data, credible alternatives for the prior can meaningfully change the result. Compare their implications for observable outcomes before fitting, then report sensitivity in the decisions that matter. A tight posterior may reflect strong assumptions rather than many independent observations.</Prose>
    <H3>Learning does not make every realized variance decrease</H3>
    <SurprisingVarianceFigure />
    <Prose>Beta(100,1) is very concentrated near one. One surprising failure gives Beta(100,2), moving probability away from that boundary and increasing the variance from about .00009611 to .00018663. There is no rule that each realized posterior must get narrower. Under a coherent model, expected conditional variance decreases on average as information is added; an individual surprising outcome can widen it.</Prose>
    <ExcludedSupportFigure />
    <Prose>A prior that gives zero mass to a whole region cannot acquire positive mass there merely by multiplying by a finite likelihood. The program illustrates that issue in a finite candidate model with rate .8 excluded. In a continuous model, zero probability at a <em>single point</em> is normal and does not exclude its neighborhood. Inspect support, not just a density's value at one point.</Prose>
    <RunnableExample example={examples.sequentialSensitivity} />
    <Prose>An <strong>improper prior</strong> has infinite total mass and cannot itself be sampled as a probability distribution. Some yield proper posteriors after enough suitable data, but that must be proved for the model. The formal density 1/[θ(1−θ)] gives kernel θˢ⁻¹(1−θ)ᶠ⁻¹: it normalizes only when both s and f are positive. Calling it Beta(0,0) does not make it a proper Beta distribution. Its arbitrary normalization constant also prevents ordinary marginal-likelihood comparison. A diffuse proper prior and an improper expression are different objects.</Prose>

    <H2>5. Count events and the time you watched</H2>
    <Prose>A device log records three events in half an hour and six events in two hours. A probability between zero and one is no longer the parameter: we need a nonnegative <strong>event rate</strong> λ, in events per hour. Under a homogeneous Poisson model, disjoint observation intervals are conditionally independent given λ, and count xᵢ in exposure tᵢ has mean λtᵢ. The observation periods and event-detection process must be trustworthy.</Prose>
    <ExposureTimelineFigure />
    <Prose>The lengths are the observed durations, with an aggregate count attached to each. The three and six events have no recorded timestamps in this example; do not invent their positions within those windows. Half an hour and two hours contribute different amounts of exposure.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
P(x_i\mid\lambda,t_i)=\frac{(\lambda t_i)^{x_i}e^{-\lambda t_i}}{x_i!},\\
L(\lambda;D)\propto
\lambda^{\sum_i x_i}e^{-\lambda\sum_i t_i}.
\end{gathered}`}</MathBlock>
    <Prose>Exposure is the amount of time during which events could have been counted. An hour with no events is informative exposure, not a missing row to discard. Zero exposure with a positive count would be impossible under this model. Our interactive windows are strictly positive.</Prose>
    <Prose>A <strong>Gamma(a,b)</strong> prior has density bᵃλᵃ⁻¹exp(−bλ)/Γ(a) for λ&gt;0, with a,b&gt;0. Here b is the Gamma <em>rate parameter</em>, not its scale; Γ extends factorial, with Γ(k)=(k−1)! for positive integers. Since bλ is dimensionless, b has units of hours while λ has units of inverse hours. Mean λ is a/b and variance is a/b². Writing both quantities merely as “rate” without units invites an error.</Prose>
    <GammaKernelFigure />
    <Prose>Start with Gamma(2,1 hour). The two intervals add nine events and 2.5 hours, producing Gamma(11,3.5 hours), mean 22/7 ≈ 3.142857 events/hour. The likelihood-only estimate is total events / total time = 9/2.5 = 3.6. Averaging the interval rates, (6+3)/2 = 4.5, would incorrectly weight half an hour as heavily as two hours.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\lambda^{a-1}e^{-b\lambda}
\lambda^{\sum x_i}e^{-\lambda\sum t_i}\\
=\lambda^{a+\sum x_i-1}e^{-(b+\sum t_i)\lambda},\\
\lambda\mid D\\
\sim\operatorname{Gamma}(a+\textstyle\sum x_i,\ b+\sum t_i).
\end{gathered}`}</MathBlock>
    <H3>Predict a future count, not just the rate</H3>
    <Prose>Let K be the future count during exposure h. For each candidate rate λ, its conditional distribution is Poisson(λh). The drawing averages those count distributions over our Gamma posterior; use h=one hour for the worked comparison.</Prose>
    <CountMixtureFigure />
    <Prose>For the next hour in our example, the expected count is 22/7, variance 198/49 and probability of zero events about .063010. Mixing retains both Poisson noise at each candidate rate and uncertainty about the rate itself.</Prose>
    <Prose>The rate curve describes λ; the integer bars describe a future count. For each candidate λ, future Poisson noise remains, and mixing over λ adds rate uncertainty to that noise. Neither integer bars nor a rate interval should be substituted for the other object.</Prose>
    <Prose>For general posterior shape a and Gamma rate b, integrate the Poisson mass over λ. Its powers produce another Gamma integral:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
P(K=k\mid D,h)\\ =
\frac{\Gamma(a+k)}{\Gamma(a)\,k!}\\
{}\times
\left(\frac b{b+h}\right)^a
\left(\frac h{b+h}\right)^k,\\
\mathbb E[K\mid D,h]=\frac{ah}{b},\\
\operatorname{Var}(K\mid D,h)\\
=\frac{ah}{b}\left(1+\frac hb\right).
\end{gathered}`}</MathBlock>
    <Prose>This Gamma-Poisson mixture is a negative-binomial count distribution under the stated convention. The variance adds Poisson noise ah/b and uncertainty h²Var(λ|D); plugging in the posterior mean rate loses the latter.</Prose>
    <RateUnitFigure />
    <Prose>The same posterior mean 22/7 events per hour is 11/210 events per minute. The density’s coordinate and height units change together, so matching physical intervals retain their probability area.</Prose>
    <Prose><strong>Separate observed exposure from future duration.</strong> Keep counts three and six, the second observed duration two hours and the Gamma(2,1 hour) prior fixed. Choose the first observed duration .5, 1, 2 or 4 hours; choose a future duration .5, 1 or 2 hours independently. Changing observed exposure changes the posterior, whereas changing the future duration changes only its count prediction. All durations are positive; Reset restores .5 observed hours and one future hour.</Prose>
    <ExposureLab />
    <RunnableExample example={examples.gammaExposure} />
    <Prose>Changing hours to minutes divides the numerical event rate by 60 and multiplies b and exposure by 60. Probability of the same next-hour event is unchanged. The model can support inspection scheduling or error-count planning, but changing detection thresholds, missing logs and clustered failures challenge the common-rate Poisson assumptions. A conjugate update is not evidence those problems are absent.</Prose>

    <H2>6. Move from two outcomes to many</H2>
    <Prose>Suppose a log classifies a request into three declared outcomes A, B and C. The unknown parameter is now a vector (θ₁,θ₂,θ₃): nonnegative category probabilities adding to one. The set of such compositions is a <strong>simplex</strong>. Increasing one component must be balanced by the others; they cannot all vary independently while preserving the sum.</Prose>
    <Prose>The <strong>Dirichlet</strong> distribution generalizes Beta to K categories. Positive shapes α₁,…,αₖ give density proportional to the product of θⱼ raised to αⱼ−1 on that simplex. Conditional trials are independent; cⱼ counts category j and the likelihood contributes θⱼᶜʲ. Keep all three declared outcomes when following their individual count updates.</Prose>
    <CategorySimplexFigure />
    <Prose>For prior (1,1,1) and counts (6,3,1), posterior shapes are (7,4,2), giving next-category probabilities 7/13, 4/13 and 2/13. The marked point is their mean composition, not the whole posterior distribution. Multiplying the prior and likelihood adds each count to its category shape:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\boldsymbol\theta\mid D
\sim\operatorname{Dirichlet}(A_1,\ldots,A_K),\\
A_j=\alpha_j+c_j,\qquad A=\sum_j A_j,\\
\mathbb E[\theta_j\mid D]=\frac{A_j}{A},\\
P(Y_{\rm next}=j\mid D)=\frac{A_j}{A}.
\end{gathered}`}</MathBlock>
    <CategoryDependenceFigure />
    <Prose>For (7,4,2), the A marginal variance is 3/169 and the A,B covariance is −2/169. A change along the simplex that increases A has to reduce some other component; the joint drawing and signed covariance describe that constraint.</Prose>
    <Prose>Integrating products of components against the posterior gives the corresponding general variance and covariance formulas:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\operatorname{Var}(\theta_j\mid D)=\frac{A_j(A-A_j)}{A^2(A+1)},\\
\operatorname{Cov}(\theta_i,\theta_j\mid D)\\
=-\frac{A_iA_j}{A^2(A+1)},\quad i\ne j.
\end{gathered}`}</MathBlock>
    <Prose>The negative covariance expresses the sum constraint. The marginal distribution of one θⱼ is Beta(Aⱼ,A−Aⱼ), so a single-category credible interval can use a Beta calculation. Separate 95% marginal intervals are not automatically a joint 95% region for the entire vector.</Prose>
    <section data-lesson-teaching="" className="lesson-teaching-section"><h3 className="lesson-teaching-section__title">Where the multivariate normalizer and count prediction come from</h3><Prose>The Dirichlet normalizer is B(α⃗) = ∏Γ(αⱼ)/Γ(Σαⱼ), the simplex integral of its power product. Increasing one exponent by one gives the mean through B(A⃗+eⱼ)/B(A⃗); increasing two gives second moments and the covariance above. For a future count vector k⃗ with total m, integrating the multinomial mass gives m!/∏kⱼ! times B(A⃗+k⃗)/B(A⃗). This is the Dirichlet-multinomial predictive law; components and future trials retain their shared-parameter dependence.</Prose></section>
    <DeclaredCategoryFigure />
    <Prose><strong>Inspect a declared category with no observations.</strong> Keep prior (1,1,1), A count six and B count three. Change only C count from zero to five. Removing C’s observed count changes both its shape and the total; at C=0 the shapes are (7,4,1) and its next-event probability is 1/12. C stays in the declared simplex. Reset restores C=1 and (7,4,2).</Prose>
    <CategoryLab />
    <Prose>The complete program below also computes the different count vector (6,4,0). Its next-C probability is 1/13 because that example has one more B observation; keep its denominator distinct from the live C=0 case.</Prose>
    <RunnableExample example={examples.dirichletCategories} />
    <Prose>With counts (6,4,0) under the same prior, category C still has next-event probability 1/13. That is useful smoothing for a <em>declared but unseen</em> category. It does not create probabilities for outcomes absent from the category universe. An unknown label, newly discovered species or changing taxonomy requires an explicit expanded or open-category model. K=2 reduces to the Beta case, providing a useful consistency check.</Prose>

    <H2>7. Combine noisy measurements by precision</H2>
    <Prose>The measurements [2,3,4,7] return from MLE/MAP. Their mean is four. Assume independent normal observation noise with known variance σ²=4 and a Normal(m₀=0,v₀=1) prior on the unknown shared mean μ. Here Normal is parameterized by <em>mean and variance</em>; σ is a standard deviation.</Prose>
    <NormalQuadraticFigure />
    <Prose>The negative log posterior contains two quadratic costs: Σ(xᵢ−μ)²/(2σ²) and (μ−m₀)²/(2v₀). Precision means reciprocal variance. Inspect how the prior and observations weight their centers before expanding the μ² and μ terms.</Prose>
    <PrecisionWeightFigure />
    <Prose>Each genuinely independent observation contributes 1/σ² precision. Our prior and four-reading sample each contribute one, so the posterior mean is two and variance is one half. More precise sources receive more weight. If observation variances differ and are known, replace n/σ² with Σ1/σᵢ² and n x̄/σ² with Σxᵢ/σᵢ²; the same quadratic argument proves the update. Correlated measurements require their joint covariance instead of this scalar sum.</Prose>
    <Prose>The μ² coefficient gives the combined precision, while the linear coefficient gives its center. Completing the square produces:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\tau_0=1/v_0,\qquad \tau_D=n/\sigma^2,\\
v=(\tau_0+\tau_D)^{-1},\\
m=v(\tau_0m_0+\tau_D\bar x),\\
\mu\mid D\sim\operatorname{Normal}(m,v).
\end{gathered}`}</MathBlock>
    <NoiseFloorFigure />
    <Prose>A future reading is Xnew = μ + εnew. Under the model, its fresh noise is independent of μ and has variance σ². Integrating the posterior therefore gives Normal(m, v+σ²), not Normal(m,v). In our example the mean's 95% credible interval is [.614096,3.385904], while the next-reading 95% predictive interval is [−2.157711,6.157711]. Learning the mean does not remove observation noise.</Prose>
    <Prose><strong>Vary independent sample size under known noise.</strong> The following comparison fixes prior mean zero/SD one, observed average four and observation SD two. Choose n=1,4,16 or 64. Each choice declares a different hypothetical dataset with that size and average; it does not reuse the same four observations repeatedly. Read the mean-parameter and future-reading widths separately. Reset returns n=4.</Prose>
    <KnownNormalLab />
    <RunnableExample example={examples.normalPrecision} />
    <Prose>This distinction matters when calibrating a sensor. Estimating its common offset can become precise even though any one reading remains noisy. If readings share an unmodeled drift, the apparent added precision may be fictional. The prior also needs interpretable units: changing volts to millivolts multiplies means by 1000 and variances by a million, preserving corresponding event probabilities.</Prose>
    <H3>Deeper: when both mean and noise variance are unknown</H3>
    <Prose>Replacing σ² by a fitted estimate and pretending it is known discards uncertainty. Write v=σ²&gt;0. A proper conjugate joint prior takes v ~ Inverse-Gamma(α₀,β₀), then μ given v ~ Normal(m₀,v/κ₀), with positive α₀,β₀,κ₀. This conditional variance couples the two unknowns; independently assigning a normal mean prior and an inverse-Gamma variance prior defines another joint model.</Prose>
    <NormalVarianceForkFigure />
    <Prose>The first branch draws v, and each conditional normal width depends on that same v. A future reading adds another normal observation at that variance. The marginal mean distribution and future distribution will therefore have different widths even after both unknowns are integrated.</Prose>
    <MathBlock>{String.raw`p(v)=\frac{\beta_0^{\alpha_0}}{\Gamma(\alpha_0)}v^{-\alpha_0-1}e^{-\beta_0/v},\quad v>0.`}</MathBlock>
    <Prose>β₀ has squared measurement units, κ₀ is dimensionless and m₀ has measurement units. This explicit inverse-Gamma density fixes the convention: β₀/v is dimensionless. The prior is proper even when its variance expectation does not exist; E[v]=β₀/(α₀−1) requires α₀&gt;1.</Prose>
    <Prose>Summarize independent observations by n, their average x̄ and within-sample sum of squares S=Σ(xᵢ−x̄)². Compare the four observations’ scatter with the extra cost from disagreement between the sample and prior centers.</Prose>
    <CompleteSquareFigure />
    <Prose>For [2,3,4,7], the average is four and S=4+1+0+9=14. With prior (m₀,κ₀,α₀,β₀)=(0,1,2,2), the between-center contribution is 1×4×(4−0)²/5=12.8. Half the within and between sums adds 7+6.4 to β₀=2. The disagreement term belongs to the joint update; using only sample scatter would lose it.</Prose>
    <Prose>In general, Σ(xᵢ−μ)²=S+n(μ−x̄)² splits within-sample scatter from uncertainty about the center. Completing the square after adding the prior quadratic gives:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
n(\mu-\bar x)^2+\kappa_0(\mu-m_0)^2\\
=(\kappa_0+n)(\mu-m_n)^2+\frac{\kappa_0n}{\kappa_0+n}(\bar x-m_0)^2,\\
m_n=\frac{\kappa_0m_0+n\bar x}{\kappa_0+n}.
\end{gathered}`}</MathBlock>
    <MathBlock>{String.raw`\begin{gathered}
\kappa_n=\kappa_0+n,\quad \alpha_n=\alpha_0+n/2,\\
\beta_n=\beta_0+\frac12\left[S+\frac{\kappa_0n}{\kappa_0+n}(\bar x-m_0)^2\right],\\
v\mid D\sim\operatorname{IG}(\alpha_n,\beta_n),\qquad
\mu\mid v,D\sim N(m_n,v/\kappa_n).
\end{gathered}`}</MathBlock>
    <Prose>Matching the powers of v and the new square leaves the same joint family: (mₙ,κₙ,αₙ,βₙ)=(3.2,5,4,15.4). Integrating the conditional normal over the inverse-Gamma uses ∫₀∞v⁻ᵃ⁻¹exp(−b/v)dv=Γ(a)/bᵃ, obtained by substituting b/v. This creates a Student distribution with heavier tails than a normal curve at a single fixed variance.</Prose>
    <StudentMixFigure />
    <Prose>The displayed variance slices explain which conditional curves contribute; a few drawn slices are not an exact numerical integral. The smooth marginal is the normalized Student density from the analytic integral. Its degrees of freedom ν=2αₙ and horizontal scale s follow from the remaining quadratic.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\mu\mid D\sim t_{2\alpha_n}\left(m_n,\sqrt{\frac{\beta_n}{\alpha_n\kappa_n}}\right),\\
X_{\rm new}\mid D\sim t_{2\alpha_n}\left(m_n,\sqrt{\frac{\beta_n(\kappa_n+1)}{\alpha_n\kappa_n}}\right),\\
f_\nu(z)=\frac{\Gamma((\nu+1)/2)}{\sqrt{\nu\pi}\,\Gamma(\nu/2)}(1+z^2/\nu)^{-(\nu+1)/2}.
\end{gathered}`}</MathBlock>
    <Prose>The last line is the standard Student density; translating by mₙ and scaling by s divides its height by s. Student scale is not standard deviation. For ν&gt;2, variance is νs²/(ν−2); the mean requires ν&gt;1. A proper distribution may have no corresponding moment.</Prose>
    <StudentScaleFigure />
    <Prose>Here ν=8: mean scale .877496 and future scale 2.149419 correspond to SDs 1.013246 and 2.481935. The central 95% intervals are [1.176490,5.223510] for μ and [−1.756568,8.156568] for one reading. Predictive variance is 6.16, whereas E[v|D]=15.4/3=5.133333; the extra mean uncertainty still matters. This is a different prior/model from the known-noise calculation.</Prose>
    <Prose><strong>Change prior mean strength with data fixed.</strong> Keep [2,3,4,7], prior location zero, α₀=2 and β₀=2, and choose κ₀=.25,1 or 4. Larger κ₀ strengthens the conditional prior location and also changes the disagreement term in βₙ. The displayed degrees of freedom stay eight and the interval level stays 95%. Reset returns κ₀=1.</Prose>
    <UnknownNormalLab />
    <Prose>For the browser’s two fixed even degrees of freedom, a direct upper-tail integral can be evaluated without a general numerical integrator. Put t=√ν tan φ and u=sin φ; the standard density times dt becomes C(1−u²)ᵐdu, where m=ν/2−1 and C=35/32 for ν=8 or3,003/2,048 for ν=14. For t≥0, integrate from its transformed u to one. Writing w=1−u makes the finite expansion:</Prose>
    <MathBlock>{String.raw`P(T_\nu>t)=C\sum_{k=0}^{m}(-1)^k{m\choose k}2^{m-k}\frac{w^{m+k+1}}{m+k+1},\quad
w=\frac{\nu}{\sqrt{\nu+t^2}\left(\sqrt{\nu+t^2}+t\right)}.`}</MathBlock>
    <Prose>The rational expression for w avoids subtracting two nearly equal values in a small upper tail. Symmetry supplies negative inputs; bracketed inversion supplies the ordinary interval quantiles. The browser contract is ν=8 or14 with quantiles .005–.995, checked against SciPy, rather than arbitrary degrees or extreme tails. The complete observed program below reuses the prerequisite’s different general integration routine at its supported t14 quantile.</Prose>
    <Prose>The original complete example computes all four updated parameters and asks SciPy for Student quantiles. Its inputs and distribution convention are those derived here; it does not plug a fitted variance into a normal interval.</Prose>
    <RunnableExample example={examples.unknownVariance} />
    <H3>Retain summaries and normalizing constants in a scratch implementation</H3>
    <Prose>Two disjoint groups can be combined without keeping every row. If their sizes, averages and scatter sums are n₁,x̄₁,S₁ and n₂,x̄₂,S₂, the combined scatter includes a between-group term. Empty summaries act as identities.</Prose>
    <SummaryMergeFigure />
    <Prose>The [2,3] group has average 2.5 and S₁=.5; [4,7] has average 5.5 and S₂=4.5. The between-group term is 2×2×3²/4=9, giving S=14. Adding .5+4.5 alone would understate scatter. Updating on these disjoint summaries sequentially agrees with the pooled update; reusing a summary would duplicate evidence.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\bar x=\frac{n_1\bar x_1+n_2\bar x_2}{n_1+n_2},\\
S=S_1+S_2+\frac{n_1n_2}{n_1+n_2}(\bar x_2-\bar x_1)^2.
\end{gathered}`}</MathBlock>
    <Prose>For a full continuous-data evidence, retain every normalizer. The likelihood’s (2π)⁻ⁿᐟ² factor survives. Integrating μ contributes √(κ₀/κₙ); integrating v contributes a ratio of Gamma constants and powers of β:</Prose>
    <MathBlock>{String.raw`p(D)= (2\pi)^{-n/2}\sqrt{\kappa_0/\kappa_n}\,
\frac{\beta_0^{\alpha_0}}{\beta_n^{\alpha_n}}\frac{\Gamma(\alpha_n)}{\Gamma(\alpha_0)}.`}</MathBlock>
    <Prose>This is a joint density for the recorded continuous readings, with inverse measurement units to power n; it need not be bounded by one. The full scratch route stores n, mean and SSE, merges fresh summaries, updates the proper joint prior, returns the two Student parameter sets, checks moment existence and computes this log density using log-Gamma arithmetic.</Prose>
    <RunnableExample example={newExamples.normalCore} />
    <Prose>The two-pass summary costs O(n) work and O(n) temporary tuple storage. Merging or updating an existing summary uses O(1) work and retained storage. The program reports the correct merged SSE 14 and log sequence density −12.239889. Inputs and accumulated arithmetic must remain finite; these formulas do not promise accuracy for overflowing or severely ill-conditioned summaries, nor do they establish normal/exchangeable observations.</Prose>
    <H3>Observed branch: keep the ten pairs and their physical units</H3>
    <Prose>The canonical R <Code>sleep</Code> data record extra sleep in hours for ten people under two drugs. Match drug1 and drug2 by person ID before subtracting: the observations in this branch are drug2−drug1 contrasts, not twenty independent values. The existing CSV, original R documentation, provenance and license accompany the prerequisite’s data carrier.</Prose>
    <SleepPairsFigure />
    <Prose>Reading each arrow in ID order gives contrasts 1.2,2.4,1.3,1.3,0,1,1.8,.8,4.6,1.4 hours. ID5 contributes a real zero; it is not a missing pair. A normal exchangeable model for these ten contrasts is an assumption, and the archived values alone do not establish a random-sampling protocol or a causal drug effect.</Prose>
    <SleepSummaryFigure />
    <Prose>The contrast average is 1.58 hours, with SSE 13.616 hours². Use the explicitly illustrative proper prior (m₀,κ₀,α₀,β₀)=(0 hours,1,2,2 hours²). The posterior is (1.436364 hours,11,7,9.942727 hours²). Prior disagreement again contributes to β; no hidden claim that this prior was elicited from a clinical protocol is required by the arithmetic.</Prose>
    <SleepPredictionFigure />
    <Prose>Both distributions have ν=14. The mean scale is .359342 hours and its 95% interval [.665653,2.207075]; P(μ&gt;0|D)=.999338. One further exchangeable contrast has scale 1.244796 hours, interval [−1.233457,4.106185] and positive probability .866069. A likely positive common mean does not guarantee a positive individual contrast.</Prose>
    <Prose><strong>Compare prior strength and contrast direction.</strong> Keep all ten pairs, α₀=2 and β₀=2 hours² fixed. Select κ₀=.25,1 or 4; select drug2−drug1 or its reverse. With zero-centered prior, reversing the contrast negates the posterior location and reverses interval endpoints, while SSE, β and widths remain unchanged. Degrees of freedom fourteen and interval level 95% remain fixed. Reset restores κ₀=1 and drug2−drug1.</Prose>
    <SleepInferenceLab />
    <Prose>The full program reads the canonical CSV, constructs the contrasts and uses the maintained scratch update rather than a fitted-distribution shortcut. Save it beside <Code>conjugate_normal_scratch.py</Code>, obtain the canonical CSV and unchanged <Code>paired_t_scratch.py</Code>, and supply their paths as its command-line arguments. The reused integration/bisection routine supplies the t14 95% quantile; SciPy checks that same value. Its documented tested accuracy covers 90–99% confidence and integer degrees of freedom 1–99, rather than all numerically admissible extreme tails.</Prose>
    <RunnableExample example={newExamples.sleepStudy} />
    <Prose>Converting hours to minutes multiplies data and prior m₀ by 60 and β₀ by 60²; κ₀ and α₀ stay dimensionless. The mean becomes 86.181818 minutes and mean scale 21.560491 minutes, with the same zero-event probability. Changing only the data would change the physical prior and therefore the model. This Bayesian branch complements the prerequisite’s repeated-sampling analysis; their probability interpretations stay distinct.</Prose>
    <H3>Evaluate the derived distributions through ordinary SciPy</H3>
    <Prose>All families in the following complete route have now been derived. Compute the posterior parameters explicitly, then construct SciPy distributions to evaluate them. <Code>.fit</Code> estimates a distribution from sample values; it does not perform these prior-plus-likelihood updates.</Prose>
    <RunnableExample example={newExamples.libraryRoutes} />
    <Prose>Read each argument against its convention: <Code>gamma(shape, scale=1/rate)</Code>; <Code>nbinom(shape, rate/(rate+h))</Code> for the future Gamma-Poisson count; <Code>sf(8)</Code> for an integer count at least nine; normal <Code>scale</Code> as SD and Student <Code>scale</Code> as horizontal scale. Dirichlet mean/covariance retains its sum constraint. The full stdout compares integrated and plug-in counts and both unknown-noise interval types on exactly the earlier inputs.</Prose>

    <H2>8. Check what the model fails to describe</H2>
    <Prose>Conjugate inference can be computationally exact and still miss an important pattern. A run is a maximal consecutive block of identical outcomes. The likelihood of a common independent rate depends only on the total success count; an ordering diagnostic deliberately inspects something that total discards.</Prose>
    <OrderedRunsFigure />
    <Prose>The words SSSSSSSSFF and SSFSSSFSSS both contain eight successes and two failures, so their common-rate likelihoods and posteriors agree. The first has two runs and the second five. Their arrangement can motivate investigating a time change without already proving one.</Prose>
    <Prose>A <strong>prior predictive check</strong> asks what data the prior and observation model imply before using the current data: draw θ from the prior, then generate a complete dataset conditional on that θ. A <strong>posterior predictive check</strong> draws θ from the posterior and generates a replicated dataset under the same observation design. Compare a relevant pattern—such as variation, extremes or ordering—with the observed data.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
p(D^{\rm rep}\mid D)\\
=\int p(D^{\rm rep}\mid\theta)\pi(\theta\mid D)\,d\theta.
\end{gathered}`}</MathBlock>
    <Prose>Do not use only a statistic the fitted model almost automatically matches. A one-rate Bernoulli model is fitted largely through its count; the already defined run statistic asks about ordering, which that count discards.</Prose>
    <PredictiveWordsFigure />
    <Prose>A length-ten replicated word is one of 1,024 binary words. A word with s successes has integrated weight B(a+s,b+10−s)/B(a,b); sum those weights over words belonging to the selected run event. All words contribute to the exact sum, even when a drawing shows only a labelled subset. Before data use the prior shapes; after data use the posterior shapes.</Prose>
    <ConditionalRunsFigure />
    <Prose>The exact posterior predictive probability of at most two runs here is about .131628. If we instead condition on exactly eight successes, all 45 possible orderings are equally likely under the model and only two have at most two runs, giving 2/45 ≈ .044444. These probabilities differ because the reference experiments differ. The predictive experiment allows different totals; the conditional ordering experiment fixes the total.</Prose>
    <Prose><strong>Change the replicated experiment.</strong> Choose the clustered two-run word or spread five-run word, then choose a prior-predictive, posterior-predictive or same-count ordering reference. The first two allow different success totals; the last fixes eight successes and weights its 45 words equally. The displayed event is runs at most the observed word’s run count. Exact enumeration avoids Monte Carlo sampling error. Reset returns the clustered word and posterior reference.</Prose>
    <PredictiveRunsLab />
    <RunnableExample example={examples.predictivePatterns} />
    <Prose>Posterior predictive tail probabilities generally are <em>not</em> uniformly calibrated classical p-values, because the data help fit the predictive reference. A small value can locate a model concern; a moderate one cannot certify every assumption. Noticing a pattern and then selecting the statistic also changes the assessment context. Use domain knowledge and additional data to investigate temporal dependence or drift rather than turn one displayed tail into an automatic verdict.</Prose>
    <Prose>Prior predictive checks reveal whether a “weak” prior produces plausible observable behavior. With a uniform Beta prior, the prior predictive count of successes among m trials is uniform over 0,…,m—not a Binomial concentrated near m/2. Before observing anything, that prior permits many rates, making extreme batches substantially more plausible than fixing θ=.5 would. Similar checks can expose a Gamma rate prior that implies implausibly many failures per hour.</Prose>
    <Prose>Posterior predictive checking and held-out prediction answer related but different questions. Replicating the training design asks whether fitted models reproduce chosen aspects of it; genuinely new withheld observations test predictive performance under a specified future-data process. A neat replicated plot cannot rule out selection bias or distribution shift outside that process.</Prose>

    <H2>9. Compare models and choose an action</H2>
    <H3>The normalizing constant can be the quantity you need</H3>
    <Prose>Consider two explicit models: M₀ fixes θ=.5; M₁ gives θ a proper Beta prior. Model uncertainty is represented by a separate discrete model indicator. This is how a point-null model can receive positive posterior probability; an ordinary continuous Beta posterior by itself gives P(θ=.5|D)=0.</Prose>
    <Prose>For this first comparison, M₁ uses a uniform Beta(1,1) parameter prior and the two models have equal prior probabilities. Both branches explain the same ordered eight-success/two-failure word; evidence must concern that same event.</Prose>
    <EvidenceIntegralFigure />
    <Prose>For the ordered word, the uniform alternative’s integrated likelihood is 1/495 and the fair model’s likelihood is 1/1024. Their ratio is about 2.068687. It is a <strong>Bayes factor</strong> for this particular proper alternative against the fair model, rather than proof that every conceivable model was tested.</Prose>
    <ModelIndicatorFigure />
    <Prose>With equal model priors, the alternative branch receives (1/495)/(1/495+1/1024)≈.674128 posterior model probability. The null branch carries discrete model probability; M₁’s rate curve remains a continuous parameter density. This comparison does not by itself establish that the feature is useful.</Prose>
    <Prose>For general proper model priors, multiply prior model odds by the evidence ratio:</Prose>
    <MathBlock>{String.raw`\begin{gathered}
\frac{P(M_1\mid D)}{P(M_0\mid D)}\\
=\frac{p(D\mid M_1)}{p(D\mid M_0)}
\frac{P(M_1)}{P(M_0)},\\
p(D\mid M_1)=\frac{B(\alpha+s,\beta+f)}{B(\alpha,\beta)}.
\end{gathered}`}</MathBlock>
    <Prose>The null model assigns point probability through a separate model indicator. An ordinary continuous parameter posterior does not create that point-null branch.</Prose>
    <Prose><strong>Keep parameter priors and model priors separate.</strong> Choose a uniform, moderate or strong proper Beta prior within M₁; independently choose P(M₁)=.1,.5 or .9. Changing model prior odds changes posterior model probability but not that selected Bayes factor. Reset uses uniform M₁ and equal model priors. Every comparison uses the same recorded ordered word.</Prose>
    <ModelEvidenceLab />
    <RunnableExample example={examples.modelEvidence} />
    <Prose>The binomial arrangement factor cancels between these models only because both use the same observed count event. In general, constants can differ between models; dropping them before computing evidence gives the wrong comparison. Evidence also depends on prior spread and support, which is why the program compares several declared proper alternatives. An improper prior's arbitrary scale cannot supply an ordinary model evidence without additional theory.</Prose>
    <H3>Translate uncertainty into a stated loss</H3>
    <Prose>A posterior can supply event probabilities and expected values; choosing an action also needs consequences. The next diagram assigns costs to the two actions in each threshold region.</Prose>
    <LossBranchesFigure />
    <Prose>Suppose the decision is whether to launch when the true rate exceeds .70. Let q = P(θ&gt;.70|D). If an incorrect launch costs 19 and missing a beneficial launch costs 1, posterior expected loss is 19(1−q) for launch and q for waiting. Launch is preferred only when q&gt;19/20=.95. Our q≈.579394 does not pass.</Prose>
    <Prose>Now change the question: each adoption brings 100 units of value and serving a visitor costs 70 regardless of outcome; waiting yields zero. Expected net value per visitor is 100E[θ|D]−70≈1.428571, so that declared linear utility favors launching. The two actions differ because the loss functions differ, not because the posterior arithmetic changed. These synthetic values demonstrate decision reasoning, not a recommendation for a real financial or clinical decision.</Prose>
    <Prose><strong>Change the consequence, with the posterior fixed.</strong> The threshold stays .70 and missed-benefit cost stays one. Choose wrong-launch cost from 1 to 25 and compare launch/wait expected losses; equality means tied risks. Switching to the separately declared linear-utility view keeps adoption value 100 and per-visitor cost 70, so it asks a different consequence question. Reset returns wrong-launch cost 19 and threshold loss.</Prose>
    <PosteriorLossLab />
    <RunnableExample example={examples.decisionLoss} />
    <Prose>Decision thresholds should follow costs, constraints and the population of interest; inference does not choose them automatically. Record the sampling and stopping process too. Bayesian computation does not make arbitrary repeated thresholds, chosen models or selected reports inherit a frequentist error guarantee.</Prose>
    <H3>When conjugacy stops, keep the probability question</H3>
    <Prose>Now observations are reports from a detector. Its known true-positive probability is .9 and false-positive probability .1. Underlying adoption chance θ refers to the latent true state; a report is another outcome of the measurement process.</Prose>
    <ReporterTreeFigure />
    <Prose>The reported success chance is .1+.8*theta, so the posterior is not generally Beta. In mathematical notation q(θ)=.9θ+.1(1−θ)=.1+.8θ. Eight reported successes/two failures give q(θ)⁸[1−q(θ)]². Updating shapes as though reports were true states would infer from the wrong likelihood.</Prose>
    <Prose>A small one-dimensional grid can approximate the posterior: evaluate prior×likelihood at cell midpoints, multiply by cell width, normalize the resulting masses, then sum the desired quantity. Work in logs and subtract the largest log weight before exponentiating to avoid unnecessary underflow. Equal cell widths cancel from normalized weights, but they remain necessary for the approximate evidence integral.</Prose>
    <GridCellFigure />
    <Prose>A cell midpoint is a parameter coordinate; its unnormalized height is the prior×likelihood value there. Height times cell width approximates an integral contribution. Normalize those contributions to cell probability masses before summing a tail or weighted mean. Subtracting a maximum log weight preserves ratios, but restore its factor and the widths when reporting absolute evidence.</Prose>
    <Prose><strong>Change numerical resolution, with the model fixed.</strong> Keep prior Beta(2,2), eight/two reports and .9/.1 detector probabilities fixed. Choose 100,1,000 or 10,000 midpoint cells. The same-input exact/continuous-integral references remain fixed; labelled selected cells illustrate the construction without pretending every cell is individually drawn. Reset uses 100. Refinement tests this calculation’s stability and is not a universal error certificate.</Prose>
    <ReporterGridLab />
    <RunnableExample example={examples.nonconjugateGrid} />
    <Prose>Refining 100→1000→10000 cells stabilizes this example near mean .727949 and P(θ&gt;.7)≈.614373. Refinement is a numerical check, not an automatic error certificate for arbitrary densities: narrow peaks, discontinuities, endpoint singularities, nonuniform cells and truncated support need care. A grid over d dimensions grows exponentially in d. Later MCMC and Variational Inference lessons develop other computational approaches while keeping the distinction between target posterior, numerical approximation and model adequacy.</Prose>
    <H3>Obtain a separate exact and library reference for this reporter</H3>
    <Prose>For these integer report counts, introduce j true adopters among the eight success reports and k among the two failure reports. Expanding their positive branches groups terms by j+k. With a Beta(2,2) prior, each term integrates as another Beta normalizer; nonnegative weights can therefore form an exact finite mixture.</Prose>
    <ReporterMixtureFigure />
    <Prose>The 27 positive terms combine into eleven latent-count components with shapes (2+l,12−l), l=0,…,10. Their integrated prior-weighted masses normalize the mixture. This special polynomial model admits a finite exact reference; arbitrary nonconjugate models need not. With rational .9/.1 probabilities, the ordered evidence is exactly 2885223303/1430000000000.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
(.9\theta+.1(1-\theta))^8(.1\theta+.9(1-\theta))^2\\
=\sum_{j=0}^8\sum_{k=0}^2 {8\choose j}{2\choose k}
.9^j.1^{8-j}.1^k.9^{2-k}\theta^{j+k}(1-\theta)^{10-j-k}.
\end{gathered}`}</MathBlock>
    <Prose>The full reference program independently uses that positive rational expansion and SciPy quadrature. It compares the scratch midpoint resolutions on the same density, not on a different approximation target. Save it as <Code>misclassification_grid_reference.py</Code> and run with NumPy/SciPy installed.</Prose>
    <RunnableExample example={newExamples.gridReference} />
    <Prose>Both references give mean .727949 and upper probability .614373. Perfect reporting reduces the model to an ordinary Beta update. Equal true-positive and false-positive rates make the report likelihood constant in θ, so the combined mixture density equals the prior even if its expansion contains several components. An impossible observed event has zero evidence and no normalized posterior. Those checks separate a computation’s target and domain from a pleasing plot.</Prose>
    <Prose>The four conjugate pairs here share a principle: the likelihood changes coefficients or exponents already represented by the prior. Exponential Families & Sufficient Statistics develops the general theory later. Hierarchical models can learn how related groups share information instead of assigning unrelated fixed prior strengths; their dependency structure and inference deserve their own treatment. Convenience is a reason to consider a prior family, not a sufficient reason to impose it.</Prose>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>10. Practise the complete inference loop</H2>
    <Prose>Work these with the corresponding examples closed. State the observation process, parameter support and units before calculating. A useful solution contains both numbers and the interpretation that makes those numbers relevant.</Prose>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="1 · Change the prior, then add a fresh batch" hint="Update two shape parameters separately. The second batch must contain new observations." prompt={<Prose>Start with Beta(3,2), observe two successes/four failures, then three new successes/one failure. Derive both sequential posteriors and the final mean, interior mode and next-success probability.</Prose>}>
      
      <Prose>First Beta(5,6), then Beta(8,7). Pooling the fresh data adds five successes/five failures to the original prior and agrees. Final mean and prediction are 8/15; mode is 7/13. Multiplying the first batch again would double-count it.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="2 · Predict two visitors without discarding uncertainty" hint="Use a Beta(2,2) posterior and integrate θ² for two successes." prompt={<Prose>Before looking at the solution, find P(K=0), P(K=1), P(K=2) for two future visitors under Beta(2,2), then compare a Binomial(2,.5).</Prose>}>
      
      <Prose>The integrated masses are 3/10,2/5,3/10; plug-in masses are 1/4,1/2,1/4. Both have mean 1, but integrated variance 3/5 exceeds 1/2. The two future outcomes have covariance Var(θ)=1/20 and correlation 1/5. One uncertain rate is shared.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="3 · Keep event counts and exposure together" hint="Zero observed events still contribute observation time." prompt={<Prose>Use Gamma(3,2 hours), then observe no events in half an hour and four in 1.5 hours. Find the posterior, expected count in the next two hours, predictive variance and probability of no events.</Prose>}>
      
      <Prose>Posterior Gamma(7,4 hours). Over h=2 hours, mean is 7/2 and variance 21/4; the zero-count probability is (4/6)⁷=(2/3)⁷≈.058528. Ignoring the empty half hour incorrectly changes the denominator and exaggerates the rate. Converting all time quantities to minutes must preserve these count probabilities.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="4 · A new label is not an unseen declared label" hint="List the complete category universe before using a Dirichlet vector." prompt={<Prose>With prior (2,1,1) and counts (1,2,0), find the posterior means. What happens if the next observation uses a fourth label never included in the model?</Prose>}>
      
      <Prose>The posterior is Dirichlet(3,3,1), giving means 3/7,3/7,1/7. Category 3 remains possible although unseen. A fourth label is outside this model's declared sample space; do not silently insert a zero prior shape or renormalize after hiding the observation. Reconsider the taxonomy, observation mapping or an explicit model supporting additional categories.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="5 · Separate a mean interval from an outcome interval" hint="Prior precision is one fourth; data precision is two." prompt={<Prose>A Normal(0,4) mean prior meets two independent measurements 1 and 3 with known observation variance 1. Find posterior mean/variance and the variance of one new reading.</Prose>}>
      
      <Prose>Data mean 2 and total precision 1/4+2=9/4 give posterior variance 4/9 and mean 16/9. The new reading's variance is 13/9. Normal 95% intervals are 16/9 ±1.959964×2/3 for μ and 16/9 ±1.959964×√13/3 for a new reading. Treating the observations as correlated would require a different precision calculation.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="6 · Diagnose a falsely reassuring model check" hint="Which feature does the common-rate likelihood actually use?" prompt={<Prose>An analyst rearranges the eight-success/two-failure sequence, sees the same posterior mean and claims the model has passed an ordering check. Explain the mistake and reproduce the conditional probability of at most two runs.</Prose>}>
      
      <Prose>All such orderings have the same likelihood and posterior by construction; the equal mean checks no temporal pattern. There are choose(10,8)=45 orderings; only all-successes-then-failures and the reverse have at most two runs, so the conditional probability is 2/45. A posterior predictive reference allows other totals and gives another number. Neither reference should be silently substituted for the other.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="7 · Make the decision rule explicit" hint="Compare posterior expected losses, not just whether a point estimate exceeds the threshold." prompt={<Prose>Suppose P(θ&gt;.7|D)=.8. An incorrect launch costs 3 and a missed beneficial launch costs 1. Compare actions, then change the incorrect-launch cost to 9. Does inference need to change?</Prose>}>
      
      <Prose>With cost 3, launch risk is 3×.2=.6 and waiting risk is .8, so launch. With cost 9, launch risk becomes 1.8 and waiting remains .8, so wait. The posterior is unchanged; the preferred action follows the loss. Equality at a threshold gives tied risks unless another rule breaks the tie.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="8 · Rebuild and test the numerical update" hint="Retain cell widths for evidence; recognize improper normalization and prior-excluded support." prompt={<Prose>Modify the grid program to use four reported successes/six failures. Predict the direction of the posterior change. Compare two grid resolutions and check normalization, bounds, a constant-likelihood case and the true-outcome limit with perfect sensitivity/specificity.</Prose>}>
      
      <Prose>The evidence shifts toward lower θ than the 8/10 example. At 10,000 cells, the mean is about .420543, P(θ&gt;.7) about .036292, and the ordered-sequence evidence about .000681820. These agree with a separate continuous integral. When sensitivity equals the false-positive rate, reports carry no information about θ and the posterior stays at the prior. Required checks: weights sum to one, mean lies in [0,1], threshold probability lies in [0,1], and refinement stabilizes the reported quantities. With no observations the posterior equals the chosen Beta prior; with perfect reporting the grid approaches Beta(6,8), mean 3/7. An improper prior with zero shape values cannot be rescued by calling an unnormalized finite grid “the exact posterior.” Record approximation limits rather than force an answer.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="9 · Merge disjoint normal summaries" hint="Retain the between-group contribution, then use the four-parameter proper joint prior." prompt={<Prose>Summaries for [1,3] and [5,7] have n=2 each, averages two and six, and SSE two each. Combine them, then update the prior (0,1,2,2). Why does adding only their SSE values fail?</Prose>}>
      <Prose>The combined average is four and SSE is 2+2+(2×2/4)(6−2)²=20. The posterior is (m,κ,α,β)=(3.2,5,4,18.4), because the prior disagreement adds another 12.8 inside the half-sum. Omitting between-group scatter would incorrectly use four instead of twenty. Disjoint-summary updating is a storage choice, not permission to reuse the same rows.</Prose>
    </Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice question="10 · Change a paired contrast’s units and direction" hint="Transform the proper prior as well as the observed contrasts; κ and α have no measurement units." prompt={<Prose>For the recorded sleep branch with κ₀=1, convert hours to minutes and reverse the contrast to drug1−drug2. Find the transformed prior β₀, posterior mean and mean scale. Does reversing the sign preserve P(μ&gt;0)?</Prose>}>
      <Prose>Prior β₀ becomes 2×60²=7,200 minutes². Posterior location is −86.181818 minutes and mean scale 21.560491 minutes. Its interval is the negated/reversed hours interval times 60; scale stays positive and SSE/β grow by60². Unit conversion preserves the same physical zero event, but sign reversal swaps the positive and negative events: P(reversed μ&gt;0) is about .000662, not .999338. The continuous zero point has probability zero.</Prose>
    </Practice></div>
    <Prose>You are ready to continue when you can build a posterior from its likelihood and prior, distinguish a parameter interval from an outcome prediction, carry shared uncertainty into a batch, use exposure/precision correctly and diagnose a model assumption a convenient update cannot check. The next module topic is <a href="/learn/path/full-curriculum/concentration-inequalities-hoeffding-bernstein-chernoff?module=math-foundations">Concentration Inequalities (Hoeffding, Bernstein, Chernoff)</a>: finite-sample deviation guarantees under explicit assumptions. MCMC then develops numerical expectations when the posterior cannot be handled by these small conjugate calculations.</Prose></section>
    <Sources alternatives={<ul>
      <li><a href="https://seeing-theory.brown.edu/bayesian-inference/index.html">Brown University: Seeing Theory, Bayesian Inference</a> — a visual route through conditional evidence, likelihood and sequential updates. Use it after sections 1–2 to compare how changing the prior or fresh observations changes the uncertainty curve.</li>
      <li><a href="https://stat110.hsites.harvard.edu/youtube">Harvard Stat 110 official video index</a> — an alternative route through Beta/Gamma distributions and conditional expectation. Start with those distribution lectures after the corresponding families here; then revisit conditional expectation to connect shared uncertainty with prediction.</li>
      <li><a href="https://www.maths.dur.ac.uk/stats/stats2/practical_1-4.html">Durham: Bayesian Poisson exercise</a> — the preserved R-based historical volcano-count exercise for Gamma exposure and prior comparison, with its event-rate assumptions.</li>
    </ul>}>
      <li><a href="https://sites.stat.columbia.edu/gelman/book/BDA3.pdf">Gelman and colleagues: Bayesian Data Analysis, third edition</a> — read the conditioning and one-parameter conjugacy sections alongside our binary and exposure examples; return to normal mean/variance, predictive checking and numerical approximation for the deeper branches.</li>
      <li><a href="https://www.cs.ubc.ca/~murphyk/Papers/bayesGauss.pdf">Murphy: Conjugate Bayesian analysis of the Gaussian distribution</a> — selected known/unknown-normal derivations and distribution appendices. Use the explicit inverse-Gamma density and independently normalized evidence here; scale and precision conventions require care.</li>
      <li><a href="https://www.cs.columbia.edu/~blei/fogm/2018F/materials/DiaconisYlvisaker1979.pdf">Diaconis and Ylvisaker: Conjugate priors for exponential families</a> — a deeper properness and conjugacy treatment. Read it after the later exponential-family topic supplies the natural-parameter framework.</li>
      <li><a href="https://sites.stat.columbia.edu/gelman/research/published/A6n41.pdf">Gelman, Meng and Stern: posterior predictive assessment</a> and <a href="https://www.cs.princeton.edu/courses/archive/fall11/cos597C/reading/Rubin1984.pdf">Rubin: Bayesianly justifiable frequency calculations</a> — specialist readings on replicated-data reference experiments and calibration. Begin with their model-checking setup after section 8, retaining the distinction between Bayesian predictive assessment and repeated-sampling error guarantees.</li>
      <li><a href="https://mc-stan.org/docs/stan-users-guide/posterior-predictive-checks.html">Stan User’s Guide: posterior and prior predictive checks</a> — substantive current 2.40 guidance on replication and diagnostic statistics, distinct from held-out predictive validation.</li>
      <li><a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.beta.html">SciPy Beta</a>, <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.betabinom.html">beta-binomial</a>, <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.gamma.html">Gamma</a>, <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.nbinom.html">negative binomial</a>, <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.dirichlet.html">Dirichlet</a>, <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.norm.html">normal</a> and <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.t.html">Student</a> — actual maintained API conventions used by the complete library programs; direct survival functions preserve upper-tail calculations.</li>
      <li><a href="https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/sleep.html">R datasets: sleep</a> — the recorded two-drug, ten-person data documentation. Download the <a href="/learn-assets/hypothesis-testing/sleep-pairs.csv">canonical paired CSV</a> with its <a href="/learn-assets/hypothesis-testing/sleep-provenance.json">provenance</a> and <a href="/learn-assets/hypothesis-testing/R-COPYING">license carrier</a>; the prerequisite owns these unchanged files.</li>
    </Sources>
  </div>
};
