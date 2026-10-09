import { H2, H3, Prose, Callout } from '../../components/content';
import { MathBlock } from '../../components/lesson-labs/RandomVariableEquation.jsx';
import { LessonIntro, LessonTable, Checkpoint, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import { RunnableExample } from '../../components/lesson-labs/RunnableExample.jsx';
import { OutcomeMappingLab, DistributionCdfLab, MeanSquaredLossLab, JointLawLab, CenteredCovarianceLab, SharedNoiseLab, GroupPredictionLab, ConditionalDecompositionLab, SquaredUniformLab, SampleMeanLawLab } from '../../components/lesson-labs/RandomVariableFlowLabs.jsx';
import { PreimageFigure, FairCopiedFigure, GroupingFigure, PmfSupportFigure, EndpointFigure, ThresholdContributionFigure, WeightedBalanceFigure, NonlinearAverageFigure, LinearityFigure, IndicatorCountFigure, CenteredSquaresFigure, AffineUnitsFigure, LossDecompositionFigure, SameMomentsFigure, ConditionalRowFigure, ProductFactorizationFigure, CenteredProductFigure, CorrelationUnitsFigure, WeightedCauchyFigure, NonlinearWitnessFigure, CalibratedEstimandFigure, OuterProductPsdFigure, LinearMapFigure, InvalidPsdFigure, AffinePredictionFigure, TowerPartitionFigure, ResidualOrthogonalityFigure, InformationRefinementFigure, SubgroupCounterFigure, DensityAreaFigure, MixedLawFigure, DensityBranchesFigure, CauchySidesFigure, ParetoThresholdFigure, DatasetStatisticFigure, PairCovarianceSumFigure, BinomialArrangementsFigure, ChebyshevFigure, SampleCenteringFigure, DenominatorTargetFigure, StreamingRecenterFigure, CancellationFigure } from '../../components/lesson-labs/RandomVariableFigures.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/random-variable-flow.css';
import { randomVariableLibraryExamples } from '../random-variable-library-examples.js';
import { randomVariableExamples } from '../random-variables-examples.js';
function Example({
  name, library = false
}) {
  const example = library ? randomVariableLibraryExamples[name] : randomVariableExamples[name];
  return <section><Prose><strong>Before running.</strong> {example.question}</Prose><RunnableExample example={example} /><Prose>{example.interpretation}</Prose></section>;
}
function Practice({
  title,
  prompt,
  hint,
  children
}) {
  return <section className="lesson-check"><H3>{title}</H3><Prose>{prompt}</Prose><details><summary>Hint</summary><Prose>{hint}</Prose></details><details><summary>Reasoned solution</summary>{children}</details></section>;
}
export default {
  title: 'Random Variables, Expectation & Covariance',
  readTime: '~100 min read + 3 hours practice',
  hasIntegratedGuide: true,
  content: () => <div className="random-variable-lesson lesson-flow">
    <LessonIntro prerequisites="Start with sets, functions, fractions and elementary algebra. We introduce finite probability from the beginning. The continuous branch uses the preceding Single-Variable Calculus lesson; the finite core does not need integration." sections={[['1-give-an-outcome-a-number', 'Outcomes and random variables'], ['2-follow-probability-into-a-distribution', 'PMFs and CDFs'], ['3-average-the-right-quantity', 'Expectation and transformations'], ['4-measure-spread-and-choose-a-prediction', 'Variance and squared loss'], ['5-keep-the-pairings', 'Joint laws and dependence'], ['6-interpret-centered-products', 'Covariance and correlation'], ['7-combine-quantities-with-shared-noise', 'Linear combinations'], ['8-predict-with-available-information', 'Conditional moments'], ['9-transform-continuous-values', 'Continuous distributions'], ['10-check-whether-a-moment-exists', 'Moment boundaries'], ['11-distinguish-a-population-from-a-sample', 'Sampling and estimation'], ['12-practise-on-changed-models', 'Independent practice']]}>Two measurements each fluctuate by the same amount. Will averaging them halve the variance? That depends on whether their errors move together. This lesson develops the tools needed to answer that question from a probability model, while keeping the individual outcomes, their distribution and the quantity you want to predict distinct. On a first pass, follow the outcome maps, weighted averages, pairings, centered products and shared noise, then group predictions and the population/sample distinction. Return to the visible matrix and projection arguments, continuous and moment-existence branches, and sampling proofs for the deeper read.</LessonIntro>

    <H2>1. Give an outcome a number</H2>
    <Prose>Imagine tossing two labelled coins: first and second. Before tossing, the possible outcomes are TT, TH, HT and HH. The <strong>sample space</strong> Ω is this collection of outcomes. A particular outcome is written ω. An <strong>event</strong> is a set of outcomes answering a yes-or-no question: “at least one head” is the event {'{TH,HT,HH}'}.</Prose>
    <Prose>A probability model gives each possible outcome a nonnegative weight, with all weights adding to one. For two independent fair coins, each outcome has probability 1/4. “Fair” describes each coin's individual chance; <strong>independent</strong> says one coin's result does not change the other's chance. Together those assumptions justify multiplying 1/2 by 1/2. Two fair coins need not be independent if, for example, one result is copied from the other.</Prose>
    <Prose>Choose a numerical question for these same outcomes: count both heads, mark whether the first coin is heads, or mark whether the two coins agree. An indicator rule uses 1 for yes and 0 for no. The controls below specify these three fixed rules and the two coins' probabilities.</Prose>
    <OutcomeMappingLab />
    <Prose>The head-count rule sends TT to 0, both TH and HT to 1, and HH to 2. Each arrow carries its own source probability. Selecting first-head or agreement keeps the same possible tosses but asks a different numerical question; neither operation tosses the coins again.</Prose>
    <Prose>Now ask for the number of heads. The rule X assigns TT→0, TH→1, HT→1, HH→2. A <strong>random variable</strong> is a numerical function on the outcome space. The function itself is fixed; its input is uncertain. If the result is TH, the <strong>realized value</strong> is x=X(TH)=1. Random variables often use capitals and realized numbers lowercase.</Prose>
    <LessonTable caption="Keep the objects separate" headers={['Object', 'In the coin example', 'What it describes']} rows={[['Outcome ω', 'TH', 'The full result of the declared experiment'], ['Random variable X', 'Count the heads', 'A fixed rule applied to every possible outcome'], ['Realization x', '1 after observing TH', 'One observed numerical value'], ['Distribution of X', 'Masses 1/4,1/2,1/4 at 0,1,2', 'How probability is spread over numerical values']]} />
    <Prose>Several random variables can describe the same outcome. X can count heads while Y indicates whether the first coin was heads. On TH, X=1 and Y=0. Replacing X with a different rule does not require another toss. Their shared outcome is also what makes it meaningful to ask how X and Y behave together.</Prose>
    <PreimageFigure />
    <Prose>The event X≤1 has the three preimages TT, TH and HT. Their probabilities add to 3/4. Observing TH selects one input and realizes the value 1; it does not replace the whole fixed rule or its probability law.</Prose>
    
    <FairCopiedFigure />
    <Prose>The copied fair model has only TT and HH, each with probability 1/2. Both coins still have fair individual probabilities, while TH and HT have zero probability. The assumption about the experiment determines the four source weights.</Prose>
    <Prose>For finite spaces any such numerical rule is allowed. In general probability theory, a random variable must be <strong>measurable</strong>: inverse images of the relevant numerical events must be events to which the model assigns probabilities. That is the precise extension developed in <a href="/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations">Measure Theory &amp; Probability Spaces</a>. Here the finite event sets make this automatic.</Prose>

    <H2>2. Follow probability into a distribution</H2>
    <GroupingFigure />
    <Prose>To find P(X=1), collect <em>every</em> outcome that X sends to 1. TH and HT each contribute 1/4, so the total is 1/2. It would be wrong to give 0,1,2 equal probabilities merely because there are three different values. Probability belongs to the original model and is carried through the rule.</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      p_X(x)&=P(X=x)\\
      &=\sum_{\omega:\,X(\omega)=x}P(\{\omega\}).
    \end{aligned}`}</MathBlock>
    <PmfSupportFigure />
    <Prose>The <strong>probability mass function</strong>, or PMF, records these point probabilities for a discrete variable. Its positive-mass values form the support in this finite setting. Summing the PMF gives one because every original outcome contributes to exactly one value. The same operation is sometimes called pushing a probability law forward through a function.</Prose>

    <H3>Accumulating mass answers threshold questions</H3>
    <Prose>The <strong>cumulative distribution function</strong> is F(t)=P(X≤t). The threshold t asks how much probability is on values at or below it; it is not another possible toss or a change to X's fixed rule.</Prose>
    <DistributionCdfLab />
    <Prose>For the fair head count it is 0 below 0,1/4 from 0 up to but excluding 1,3/4 from 1 up to but excluding 2, and 1 from 2 onward. The equality in “≤” includes mass at the threshold, so the CDF jumps when the threshold reaches a supported value.</Prose>

    
    <EndpointFigure />
    <Prose>At the same two endpoints, excluding 0 leaves only the atom at 1, probability 1/2. Including 0 also retains its 1/4 atom, making 3/4. The cumulative level immediately below 0 is 0, whereas the level at 0 is 1/4.</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      P(a<X\le b)&=F(b)-F(a),\\
      P(a\le X\le b)&=F(b)-F(a^-).
    \end{aligned}`}</MathBlock>
    <Prose>F(a⁻) means the cumulative mass strictly below a. Thus P(X=a)=F(a)−F(a⁻). The CDF never decreases, approaches 0 and 1 at the two extremes and is right-continuous. Unlike a PMF or density formula of a specific kind, a CDF describes discrete, continuous and mixed real-valued laws.</Prose>
    <Prose>For the optional programs, use Download to save each complete file under its shown filename, then run it with Python 3.12 or a compatible Python 3. The fourteen retained programs use only the standard library and need no data file or earlier program. Two optional library comparisons explicitly use NumPy 2.3.5 and SciPy 1.18.1; install those libraries in your own Python environment before running those files. Every block contains its imports, inputs and expected output with a nearby question and interpretation. Nothing executes automatically in this page.</Prose>

    

    <H2>3. Average the right quantity</H2>
    <WeightedBalanceFigure />
    <Prose>Consider a different finite law: values −2,0,3 have probabilities 1/4,1/2,1/4. Their weighted contributions are −1/2,0,3/4, totaling 1/4. The probability-weighted residuals about 1/4 sum to zero. Averaging the three distinct support values equally instead would give 1/3 and would change the model.</Prose>
    <Prose>The <strong>expectation</strong> E[X] is the probability-weighted average of a random variable. For a finite model, multiply each value by the probability attached to it and add. The result has the same units as X. It need not be a possible observation: a fair die has mean 3.5, although it never lands on 3.5.</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      E[X]&=\sum_\omega X(\omega)P(\{\omega\})\\
      &=\sum_x x\,p_X(x).
    \end{aligned}`}</MathBlock>
    <Prose>The second line regroups the first line by equal X-values. This explains why we can compute from either the outcome table or the induced distribution. The mean describes a model, not a guarantee about the next value or the exact average of a particular finite sample. We will state the conditions for repeated averages later.</Prose>
    <Prose>The complete finite program uses two different head probabilities, then groups the same four outcome masses. Predict the induced PMF and its weighted head count before running; an unequal law needs unequal numerical weights.</Prose>
    <Example name="mapping" />
    <Checkpoint prompt="Two fair coins always agree because the second result copies the first. Is the head-count PMF still 1/4,1/2,1/4?"><Prose>No. TT and HH each have probability 1/2, while TH and HT have probability 0. The head count is 0 or 2 with equal probability; its mean will still be 1. Fair marginals do not specify the joint outcome law.</Prose></Checkpoint>
    
    <H3>Transform first, then average</H3>
    <NonlinearAverageFigure />
    <Prose>If the relevant cost is g(X), apply g to each possible value before weighting it. You do not have to derive the whole distribution of g(X) first. Regrouping the original outcome sum proves the useful rule sometimes called <strong>LOTUS</strong>, the law of the unconscious statistician:</Prose>
    <MathBlock>{String.raw`E[g(X)]=\sum_x g(x)p_X(x).`}</MathBlock>
    <Prose>For X equally likely −1 or 1, E[X]=0 but E[X²]=1. Squaring the mean gives 0, a different quantity. A nonlinear transformation generally does not commute with expectation. The distinction matters when a loss, energy or financial payoff is nonlinear in the uncertain input.</Prose>
    <H3>Linearity does not require independence</H3>
    <LinearityFigure />
    <Prose>On the same three equiprobable outcomes, take X=−1,0,1 and Y=X²=1,0,1. Their sum values 0,0,2 have mean 2/3, equal to 0+2/3. The calculation uses the actual paired outcomes even though Y is determined by X.</Prose>
    <Prose>For constants a,b and two variables on the same outcome space, expand the finite sum for aX+bY. Distribute the probability weight over the two terms and collect them: E[aX+bY]=aE[X]+bE[Y]. This uses no factorization of joint probabilities, so it does not require independence. Adding a constant shifts the mean by that constant.</Prose>
    <Prose>An <strong>indicator</strong> I_A is 1 on event A and 0 elsewhere. Its expectation is P(A). To count events, add their indicators: the expected count is the sum of their individual probabilities, whether or not those events are independent. For three repeated copies of the same bit with success probability p, the expected number of ones is 3p. The distribution of that count is not generally binomial.</Prose>
    <IndicatorCountFigure />
    <Prose>Draw twice without replacement from two marked and two unmarked labelled balls. The twelve ordered distinct-ball pairs are equally likely. Each draw has marked probability 1/2, so the expected number marked is 1. Their dependence changes the count law and its spread, while the sum of the two marginal expectations remains valid.</Prose>
    

    <Prose>An expectation over an event still needs its own target. In a different head-count law with masses 3/8,1/2,1/8 at 0,1,2, the event X≥1 has probability 5/8. First retain its two contributions, then decide whether to normalize them.</Prose>
    <ThresholdContributionFigure />
    <Prose>The restricted sum is 1×1/2+2×1/8=3/4. Dividing it by 5/8 gives the conditional mean 6/5. SciPy includes the stated lower and upper support endpoints; its ordinary restricted expectation and its conditional expectation are different operations. This program also compares E[X²]=1 with E[X]²=9/16.</Prose>

    <Prose>For infinite spaces these operations need the relevant integrability conditions. Finite E|X| and E|Y| suffice for ordinary signed linearity. Nonnegative expectations can be infinite, but expressions such as infinity minus infinity are undefined. We return to this limitation after the continuous examples.</Prose>

    <H2>4. Measure spread and choose a prediction</H2>
    <Prose>The mean alone does not describe fluctuation. Center X by subtracting μ=E[X]. The signed deviations average to zero, so simply averaging them cannot measure spread. <strong>Variance</strong> averages their squares. <strong>Standard deviation</strong> takes its square root to return to the original units.</Prose>
    <CenteredSquaresFigure />
    <Prose>For the −2,0,3 law, subtract mean 1/4 to obtain residuals −9/4,−1/4,11/4. Their probability-weighted squares are 81/64,1/32,121/64, adding to 51/16. These are squared distances rather than signed distances that could cancel.</Prose>
    
    <MathBlock>{String.raw`\begin{aligned}
      \operatorname{Var}(X)&=E[(X-\mu)^2]\\
      &=E[X^2]-2\mu E[X]+\mu^2\\
      &=E[X^2]-\mu^2.
    \end{aligned}`}</MathBlock>
    <Prose>In the ordinary finite-variance setting, every term is defined and variance is nonnegative. It is zero exactly when X equals its mean with probability one. For a finite model this allows exceptional values only on zero-probability outcomes.</Prose>
    <AffineUnitsFigure />
    <Prose>For Y=−2X+10, the mapped support is 14,10,4 with the original probabilities. Its mean is 19/2, variance 51/4 and standard deviation √51/2. The negative multiplier reverses positions; the translation changes the origin but not centered distances.</Prose>
    <Prose>If X is a time in seconds, Var(X) is in seconds². For Y=aX+b, its centered value is a(X−μ), hence Var(Y)=a²Var(X) and SD(Y)=|a|SD(X). A translation does not change spread. A negative scaling reverses order but still gives a nonnegative variance.</Prose>
    <H3>Why the mean is the best constant under squared error</H3>
    <Prose>Suppose you must announce one prediction c before seeing X, and your penalty is (X−c)². The candidate sets the origin of the squared distances, so moving it changes the expected penalty. Compare the asymmetric law just drawn, the equal-mass law at −1 and 1, and a constant law assigning probability 1 to 2.</Prose>
    <MeanSquaredLossLab />
    <Prose>At c=0 the asymmetric law's penalty is 13/4. At c=1/4 it is 51/16, a reduction of 1/16. A constant law at 2 has zero penalty only when c=2. The three cases keep the same loss function while changing the probability model.</Prose>
    <LossDecompositionFigure />
    <Prose>Split X−c into (X−μ)+(μ−c). On expansion, the cross term has expectation 2(μ−c)E[X−μ]=0. Therefore:</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      &E[(X-c)^2]\\
      &=\operatorname{Var}(X)+(\mu-c)^2.
    \end{aligned}`}</MathBlock>
    <Prose>The first term is fixed by the population. The second is nonnegative and vanishes at c=μ. Thus the mean is the unique best constant prediction under this loss when the second moment is finite. This conclusion depends on the loss: absolute error has a median as a minimizer, a different optimization question.</Prose>

    <Example name="moments" />
    <Prose>Return to the restricted finite expectation from section 3. Its whole SciPy program also prints variance, which is now defined: mean 3/4 and second moment 1 give variance 1−9/16=7/16. Compare the restricted sum with the normalized conditional mean on exactly the same support.</Prose>
    <Example name="finite" library />
    <SameMomentsFigure />
    <Prose>Spread is not a full risk description. Equal mass at −1 and 1 has mean 0 and variance 1. Masses 1/8,3/4,1/8 at −2,0,2 have the same moments, but P(|X|≥1.5) changes from 0 to 1/4. A standard-deviation interval is not automatically a stated-coverage probability interval. A distributional assumption or a valid inequality is needed.</Prose>

    <H2>5. Keep the pairings</H2>
    <Prose>To describe two variables together, retain the probability of each <em>pair</em>. The <strong>joint PMF</strong> p(x,y)=P(X=x,Y=y) is a table: rows can index X-values and columns Y-values. Summing a row removes the question about Y and gives the <strong>marginal</strong> P(X=x); column sums give P(Y=y).</Prose>
    <Prose>Suppose X is equally likely −1,0,1. In one model Y=X; in a second Y=−X; in a third Y is an independent uniform draw. Every model gives the same individual distribution to Y. The pairings are different, so the outcome of X+Y can be very different: under Y=−X it is always 0.</Prose>

    <Prose>A conditional row describes the distribution left after the information X=x is known. Divide the retained joint row by its total so it sums to one. For a zero-probability row the division does not identify a conditional law. A software choice on such a row must not be presented as something learned from the model.</Prose>
    <JointLawLab />
    
    <ConditionalRowFigure />
    <Prose>In the separate grid with joint masses [[.3,.2],[.1,.4]], the X=0 row has mass .5. Its conditional probabilities are .3/.5=.6 and .2/.5=.4. A row of mass 0 cannot be normalized and does not identify a conditional law.</Prose>
        <MathBlock>{String.raw`\begin{aligned}
      p_X(x)&=\sum_y p(x,y),\\
      p_{Y|X}(y|x)&=\frac{p(x,y)}{p_X(x)}
      \quad\text{for}\\
      &p_X(x)>0.
    \end{aligned}`}</MathBlock>
    
    <Prose><strong>Independence</strong> means that the joint law factors: p(x,y)=p_X(x)p_Y(y) for every pair in the finite table. Equivalently, each positive-mass conditional row gives the unchanged marginal law of Y. One mismatched cell refutes independence; one matching cell does not prove it. For general variables independence is defined through all suitable event pairs, not just point masses that may all be zero.</Prose>
    <ProductFactorizationFigure />
    
    <Prose>Expectations of pair-dependent quantities use the joint law: E[h(X,Y)]=Σ_xΣ_y h(x,y)p(x,y). In particular E[XY] needs pairings. If X,Y are independent and integrable, the factorized sum or integral gives E[XY]=E[X]E[Y]. The converse for this one product is not generally true.</Prose>

    <H2>6. Interpret centered products</H2>
    <Prose>When both variables tend to be above their means together, their centered product is positive. When one is above while the other is below, it is negative. <strong>Covariance</strong> averages these products. This captures a particular linear association rather than every form of dependence.</Prose>
    <CenteredProductFigure />
    <Prose>In the matching law, the three equally likely pairs are [−1,−1], [0,0] and [1,1], and both means are zero. The two outer centered products are 1 and the middle is 0. Their weighted contributions are 1/3,0,1/3, totaling covariance 2/3. Opposite pairing changes those two products to −1 while preserving the individual distributions.</Prose>
    
    <MathBlock>{String.raw`\begin{aligned}
      &\operatorname{Cov}(X,Y)\\
      &=E[(X-\mu_X)(Y-\mu_Y)]\\
      &=E[XY]-\mu_X\mu_Y.
    \end{aligned}`}</MathBlock>
    <Prose>Assume finite second moments throughout this covariance section. They also ensure that the product is integrable. Covariance is symmetric; Cov(X,X)=Var(X); and linearity gives Cov(aX+b,cY+d)=acCov(X,Y). Its units are the product of X's and Y's units. A positive change of measurement scale changes its magnitude, while a negative one reverses its sign.</Prose>

    <H3>Normalize only when both spreads are positive</H3>
    <Prose><strong>Correlation</strong> divides covariance by both standard deviations. The result is dimensionless. If either variable is constant almost surely, its standard deviation is zero and this correlation is undefined, rather than zero.</Prose>
    <CorrelationUnitsFigure />
    <MathBlock>{String.raw`\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y},
      \qquad \sigma_X,\sigma_Y>0.`}</MathBlock>
    <Prose>Choose a paired law: matching, opposite, independent or the nonlinear square rule. Each is a complete stipulated outcome model. The scale control multiplies Y by an integer from −2 to 2; the shift adds an integer from −3 to 3. Raw coordinates use their declared fixed axes; the separate centered plane gives both coordinates the same display scale. Selecting a paired outcome highlights its signed centered-product contribution. Reset returns the matching law with scale 1 and shift 0.</Prose>
    <CenteredCovarianceLab />
    <Prose>Matching pairs have covariance 2/3 and correlation 1. Multiplying Y by −2 reverses the covariance sign and scales its magnitude; adding a constant only moves the raw points. Setting the scale to 0 makes Y constant and correlation undefined. The mean-centered rectangle shows which paired deviations supplied each signed contribution.</Prose>
    <WeightedCauchyFigure />
    <Prose>For finite paired outcomes, multiply each centered coordinate by the square root of its probability. The two resulting vectors have dot product equal to covariance; each squared length equals the corresponding variance. A zero dot product can come from signed cancellation, while equal directions account for perfect correlation.</Prose>
    <Prose>To see why |ρ|≤1, write A=X−μ_X and B=Y−μ_Y. For any t, E[(B−tA)²] is nonnegative. With Var(X)&gt;0, choose t=Cov(X,Y)/Var(X). Expanding gives Var(Y)−Cov(X,Y)²/Var(X)≥0, which is the claimed bound after dividing by Var(Y)&gt;0. Equality requires B=tA almost surely: under these positive-variance conditions, perfect correlation is an affine relation with positive or negative slope.</Prose>
    <H3>A nonlinear dependency can cancel every centered product</H3>
    <NonlinearWitnessFigure />
    <Prose>Take X uniform on −1,0,1 and Y=X². Then E[X]=0, E[Y]=2/3 and E[XY]=E[X³]=0 by cancellation, so covariance is 0. Yet P(X=0,Y=1)=0 differs from P(X=0)P(Y=1)=2/9. In fact Y is completely determined by X. The issue is the limited summary, not a lack of dependence.</Prose>
    <Example name="joint" />
    <Prose>Return to the two marked balls and two draws from section 3. The full program compares replacement with no replacement using exact outcomes. Both expected counts are 1; their count variances are 1/2 and 1/3. The two indicator variables have covariance 0 with replacement and −1/12 without it. These paired contributions explain why linearity of expectation needs fewer assumptions than variance addition.</Prose>
    <Example name="indicators" />
    <Callout title="Correlation is not a causal effect">A joint distribution describes association under its data-generating process. It does not alone say what happens if you intervene on one variable. A shared cause, selection or a change in groups can alter the association. Causal conclusions need additional assumptions and design; the <a href="/learn/path/full-curriculum/causal-inference-do-calculus?module=math-foundations">Causal Inference</a> lesson studies those requirements.</Callout>
    <Prose>One useful special case has extra structure: jointly Gaussian variables with zero cross-covariance are independent. Having individually normal marginal distributions is not the same assumption as having a jointly Gaussian vector. Do not apply that exception to the arbitrary finite tables above.</Prose>

    <H2>7. Combine quantities with shared noise</H2>
    

    
    <H3>A complete common-error example</H3>
    <Prose>In a synthetic measurement model, A=10+S+e_A and B=20+S+e_B millivolts. The shared disturbance S is equally likely −2 or 2. Independent local disturbances e_A,e_B are each equally likely −1 or 1, and all three disturbance signs are independent. These assumptions give eight equally likely outcomes.</Prose>
    <Prose>The common-amplitude control changes the magnitude of the shared disturbance S; the local-amplitude control changes both independent local disturbances. The two coefficients specify the output aA+bB. Default coefficients 1/2,1/2 form the average; coefficients −1,1 form the difference. These have different measurement targets.</Prose>
    <SharedNoiseLab />
    <Prose>The means are 10 and 20. Each variance is 4+1=5 mV². Their covariance is 4 mV² because only the same shared S term remains after all independent centered cross products vanish. Correlation is 4/5. Thus the average has variance (5+5+2·4)/4=9/2 mV², not 5/2. The difference B−A has variance 5+5−2·4=2 mV².</Prose>
    <Prose>Center aX+bY, square it and keep the cross term. This gives the rule needed for sums, differences and weighted averages:</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      &\operatorname{Var}(aX+bY)\\
      &=a^2\operatorname{Var}(X)\\
      &\quad+b^2\operatorname{Var}(Y)\\
      &\quad+2ab\operatorname{Cov}(X,Y).
    \end{aligned}`}</MathBlock>
<Prose>Only uncorrelated cross terms disappear. Independence is sufficient, but not necessary, for that simplification. A negative covariance reduces the variance of a sum and increases the variance of a difference; changing one coefficient's sign changes which cancellations occur.</Prose>
    

    <Example name="noise" />
    <Prose>These quantities have different baselines: the average is centered at 15 mV; the difference at 10 mV. A lower variance does not automatically make one a better estimator of the other. If both channels measure a common unknown target, first state how calibration removes their known offsets and what quantity the combination must preserve. A sum-to-one weight constraint can preserve a common target; an unqualified difference would remove it along with any shared component.</Prose>
    <CalibratedEstimandFigure />
    <Prose>For a separate calibrated model with common targetθ, shared variance 9 and local variances 1 and 4, aA+(1−a)B preservesθ. Its variance is 9+a²+4(1−a)²=49/5+5(a −4/5)², minimized at a=4/5. The difference instead removesθ as well as the shared error; its smaller variance 5 answers a different question.</Prose>
    
    <H3>Package every pairwise covariance in one matrix</H3>
    <Prose>A <strong>random vector</strong> collects variables into a column, such as Z=(X,Y)ᵀ. Its mean is the column of means. Its covariance matrix Σ has variances on the diagonal and pairwise covariances off it. The superscript T denotes transposition: turn a column into a row.</Prose>
    <OuterProductPsdFigure />
    <Prose>In the eight-outcome model, the reading pair [7,17] has centered vector [−3,−3] and mass 1/8. Its outer product contribution is [[9/8,9/8],[9/8,9/8]]. Sum all eight such matrices to obtain [[5,4],[4,5]]. For coefficients [1,−1], the centered combination is e_A−e_B; its weighted squares sum to 2. More generally each direction turns the weighted outer products into nonnegative scalar squares.</Prose>
    
    <MathBlock>{String.raw`\begin{gathered}
      \Sigma=E[(Z-\mu)(Z-\mu)^T],\\
      \Sigma_{ij}=\operatorname{Cov}(Z_i,Z_j),\\
      \operatorname{Var}(w^TZ)=w^T\Sigma w.
    \end{gathered}`}</MathBlock>
    
    <MathBlock>{String.raw`w^T\Sigma w=\sum_\omega p_\omega\bigl(w^T(z_\omega-\mu)\bigr)^2\ge 0.`}</MathBlock>
    <Prose>For two components, the last line expands to the variance rule above. Since every variance is nonnegative, Σ is <strong>positive semidefinite</strong>: wᵀΣw≥0 for every real coefficient vector w. It need not be invertible; if a nonzero combination wᵀZ is constant almost surely, that direction has zero variance.</Prose>
    <InvalidPsdFigure />
    <Prose>Entrywise plausibility is insufficient. A three-variable proposal with diagonal 1 and every off-diagonal −.8 would give the sum variance 3+6(−.8)=−1.8. This contradicts nonnegative variance and rules out the entire proposed matrix.</Prose>
    <Prose>Map the two measurement channels into their average and difference. The first output uses coefficients 1/2,1/2; the second uses −1,1. The same eight possible paired readings supply both outputs.</Prose>
    <LinearMapFigure />
    <Prose>The coefficient matrix is [[1/2,1/2],[−1,1]]. The transformed mean is [15,10], and its covariance is [[4.5,0],[0,2]]. Every entry describes a paired output quantity rather than a newly independent collection of readings.</Prose>
    <Prose>A linear map V=AZ+b gives Cov(V)=AΣAᵀ. If Z has d entries and V has k, A is k×d and the new covariance is k×k. To derive it, center V to get A(Z−μ), form its outer product and pull the fixed matrices outside the expectation. This concerns linear transformations; replacing A with a Jacobian for a nonlinear map is a local approximation requiring additional error analysis.</Prose>
    <Example name="matrix" />
    <section data-lesson-teaching="" className="lesson-teaching-section"><h3 className="lesson-teaching-section__title">Deeper application: the best affine prediction</h3>
      <AffinePredictionFigure />
    <Prose>To predict Y with c+aX, first choose c=μ_Y−aμ_X; this makes the prediction error centered. Its expected square becomes Var(Y)−2aCov(X,Y)+a²Var(X). For Var(X)&gt;0, completing the square gives the optimum slope a=Cov(X,Y)/Var(X). If Var(X)=0, X supplies no varying linear feature and the best constant is μ_Y; slope is not uniquely identified.</Prose>
      <Prose>This is a population squared-loss calculation under finite second moments. A fitted regression estimates quantities from data and has additional uncertainty. After defining conditional means in section 8, we will compare the two prediction classes with a complete program.</Prose>
    </section>

    <H2>8. Predict with available information</H2>
    <Prose>Suppose you learn which group G an outcome belongs to before predicting Y. Within a positive-probability group g, normalize its masses and average Y. This gives E[Y|G=g], a number for that fixed group. Before the group is observed, E[Y|G] is itself a random variable: it selects the mean associated with the group that occurs.</Prose>
    <Prose>Use a stipulated finite model: G takes −2 or 2, and an independent fair sign U takes −1 or 1. Set Y=G−U. The percentage control changes only the probability of the positive group; each positive-mass group retains its two equally likely U signs.</Prose>
    <GroupPredictionLab />
    <Prose>The two positive-mass conditional means are −2 and 2. Changing their probabilities changes the pooled mean while preserving each non-null group's possible Y values. A zero-probability group has no conditional law to calculate.</Prose>
    <TowerPartitionFigure />
    <Prose>With equally likely groups, the group means −2 and 2 contribute −1 and 1 to the pooled mean, giving zero. Equivalently, each of the four equally likely outcome values contributes its own Y/4. Grouping and ungrouping those same weighted contributions give the same answer.</Prose>
    
    
    <MathBlock>{String.raw`\begin{aligned}
      m(g)&=E[Y\mid G=g],\\
      m(G)(\omega)&=m(G(\omega)),\\
      E[m(G)]&=E[Y].
    \end{aligned}`}</MathBlock>

    <Prose>The last identity is <strong>total expectation</strong>. For a finite partition, multiplying each conditional average by its group mass cancels the normalization denominator; summing groups counts every outcome once. A null group's chosen value contributes no mass. For nested information, averaging a finer conditional prediction inside each coarser group gives the coarser conditional mean: the <strong>tower property</strong>. The nesting premise matters.</Prose>
    <H3>Residual error versus changing group means</H3>
    <ResidualOrthogonalityFigure />
    <Prose>In those equally likely groups, the residual Y−G is −U: its conditional mean is zero and conditional variance is 1. The group means −2 and 2 have variance 4. The pooled Y variance is 5, made from average within-group 1 plus between-group 4. The cross products cancel within each group, which is the operation the drawing exposes.</Prose>
    <Prose>Write Y−E[Y]=(Y−m(G))+(m(G)−E[Y]). The first term has conditional mean zero within every positive-mass group. Multiplying it by the second, which is fixed inside each group, still gives conditional mean zero. Expanding the square therefore yields:</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      \operatorname{Var}(Y)
      &=E[\operatorname{Var}(Y\mid G)]\\
      &\quad+\operatorname{Var}(E[Y\mid G]).
    \end{aligned}`}</MathBlock>
    <Prose>This is the <strong>law of total variance</strong> under finite second moments. The first term is average remaining spread within groups; the second is spread between group means. Do not average conditional variances without the correct group probabilities.</Prose>
    <Prose>For a concrete paired example, use the earlier equally likely G=−2 or 2 and independent U=−1 or 1, and define both X=G+U and Y=G−U. Now the same four outcomes retain the two coordinates needed for covariance.</Prose>
    <ConditionalDecompositionLab />
    <Prose>Within a group, increasing U raises X and lowers Y, so conditional covariance is −1. Both conditional means equal G, whose variance is 4. The pooled covariance is −1+4=3, while total Y variance is 1+4=5. Changing the group weights changes the between contribution and retains the within relation in each positive-mass group. The relation within groups and the pooled relation answer different questions.</Prose>
    <Prose>The same decomposition for both X and Y gives <strong>total covariance</strong>. Both residual-versus-group-mean cross terms vanish by the same conditional averaging argument, so:</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      &\operatorname{Cov}(X,Y)\\
      &=E[\operatorname{Cov}(X,Y\mid G)]\\
      &\quad+\operatorname{Cov}(E[X\mid G],E[Y\mid G]).
    \end{aligned}`}</MathBlock>
    

    <Example name="conditioning" />
    <H3>Why additional information can improve average prediction</H3>
    <InformationRefinementFigure />
    <Prose>For the default four equiprobable outcomes, no information gives prediction 0 and squared risk 5. Knowing G gives predictions −2 or 2 and risk 1. Knowing G and U identifies Y and leaves risk 0. These are nested information sets under one probability model, not fitted algorithms measured on a held-out sample.</Prose>
    <Prose>For any alternative prediction a(G) using only the same group information, expand Y−a(G)=(Y−m(G))+(m(G)−a(G)). The cross term vanishes, giving E[(Y−a(G))²]=E[(Y−m(G))²]+E[(m(G)−a(G))²]. Thus the conditional mean minimizes expected squared loss among those predictions. A richer information set permits every old prediction, so its minimum <em>average</em> risk cannot increase.</Prose>
    <Prose>Return to the earlier nonlinear model: X is equally likely −1,0,1 and Y=X². The best affine prediction has intercept 2/3 and slope 0, with risk 2/9; knowing X exactly determines Y and gives conditional-mean risk 0. The complete program compares these two permitted prediction classes on the same outcomes.</Prose>
    <Example name="prediction" />
    
    <SubgroupCounterFigure />
    <Prose>A different two-group model makes the limitation explicit: group probabilities 3/4 and 1/4, means 2 and 6, variances 1 and 9. The pooled mean is 3; average within variance 3 plus between variance 3 gives total 6. The second group's variance 9 is larger than 6 even though the weighted average decomposition holds.</Prose>
    <Prose>This does not say every observation improves or every subgroup has smaller conditional variance than the pooled variance. A rare high-variability group can have a larger variance. Nor does it say a finite fitted predictor automatically attains the population optimum. Hidden outcome information would change the permitted prediction problem rather than prove better learning.</Prose>
    <Prose>The finite partition proof shows the mechanism. <a href="/learn/path/full-curriculum/measure-theory-probability-spaces?module=math-foundations#8-use-information-to-form-a-conditional-expectation">The measure-theory conditional-expectation branch</a> extends this to general information sets, almost-sure versions and continuous observations where P(X=x)=0. The <a href="/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml">regression lesson</a> develops fitted models; it does not remove the need to distinguish population risk from finite-data performance.</Prose>

    <H2>9. Transform continuous values</H2>
    <DensityAreaFigure />
    <Prose>A continuous variable can spread probability over intervals instead of isolated points. A <strong>probability density</strong> f_X, when it exists, integrates to 1 and gives interval probability by area. Its height is not a point probability and can exceed 1. A uniform delay on [0,.2] seconds has density 5 per second; a .1-second interval inside the support has probability .5.</Prose>
    <MathBlock>{String.raw`\begin{gathered}
      P(a<X\le b)=\int_a^b f_X(x)\,dx,\\
      E[g(X)]=\int g(x)f_X(x)\,dx.
    \end{gathered}`}</MathBlock>
    <Prose>The expectation integral has the same weighted-value meaning as the finite sum, subject to its existence conditions. For a density-only law a singleton has probability 0. A CDF jump instead signals point mass. A mixed law can combine a point mass and a density component, so no ordinary density alone accounts for all its probability. The earlier <a href="/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations#6-read-area-and-cumulative-probability">Probability Distributions lesson</a> works a mixed-delay example in detail.</Prose>
    <MixedLawFigure />
    <Prose>For example, place mass 1/2 at 0 and the remaining mass uniformly on [0,1]. The CDF jumps to 1/2 at 0, then follows 1/2+y/2 to 1 at 1. The continuous density 1/2 accounts for only half the total mass; its integral alone misses the atom.</Prose>
    
    <H3>A non-injective rule needs every preimage branch</H3>
    <Prose>Apply the square rule to a uniform input U on [−1,1], producing Y=U². Select a lower and upper Y endpoint to ask which inputs land inside that output interval. The positive and negative preimages both contribute probability.</Prose>
    <SquaredUniformLab />
    <Prose>The default Y interval [.25,.81] has preimages [−.9,−.5] and [.5,.9]. Their total length .8 at U density 1/2 gives probability .4. Equal endpoints have probability 0, and the whole [0,1] output interval has probability 1; neither operation creates an atom at 0.</Prose>
    <Prose>Let U be uniform on [−1,1] and Y=U². For 0≤y≤1, the event U²≤y is the interval −√y≤U≤√y. Its length is 2√y; multiplying by uniform density 1/2 gives F_Y(y)=√y. The CDF is 0 for y&lt;0 and 1 for y≥1.</Prose>
        <DensityBranchesFigure />
    <Prose>At an output value y between 0 and 1, the positive input branch is √y and the negative branch is −√y. Each inverse branch changes width at rate 1/(2√y); multiplying each by the input density 1/2 gives two contributions of 1/(4√y). Adding both gives the output density.</Prose>
    <MathBlock>{String.raw`f_Y(y)=\frac{1}{2\sqrt y},\qquad 0<y<1.`}</MathBlock>

    <Prose>Differentiating the CDF gives this density on the open interval. Its unbounded height near 0 is integrable: the mass from 0 toε is √ε, which tends to 0. Therefore there is no point mass at 0. Forgetting the negative U branch would account for only half the mass.</Prose>

    <Prose>We can compute Y's moments directly from U without a new density calculation: integrate u²/2 from −1 to 1 to get E[Y]=1/3. Similarly E[Y²]=E[U⁴]=1/5, so Var(Y)=1/5−1/9=4/45. These agree with integrating against f_Y; substitution y=u² on the positive branch verifies the same calculation.</Prose>
    <Example name="continuous" />
    <Prose>For a differentiable strictly monotone transformation, an inverse derivative corrects the density for changes of width. For a many-to-one transformation, contributions from all appropriate inverse branches must be added, under their regularity conditions. The CDF/preimage method used here often avoids mistakes before a general change-of-variables formula is introduced.</Prose>

    <H2>10. Check whether a moment exists</H2>
    <Prose>A finite weighted table always gives finite moments. An unbounded distribution need not. For a signed variable, a finite ordinary expectation requires E|X|&lt;∞. More generally its positive and negative parts may define an extended expectation if they are not both infinite. A symmetric-looking expression does not justify subtracting two divergent contributions.</Prose>
    <CauchySidesFigure />
    <Prose>For example, the standard Cauchy density is 1/[π(1+x²)]. Its symmetric integral of x f(x) over [−R,R] is 0 for every finite R, but each of the positive and negative absolute contributions grows without bound. That principal-value cancellation is not an ordinary mean. A simulation or finite integration window cannot repair this distinction.</Prose>
    <H3>A finite mean can coexist with an infinite second moment</H3>
    <ParetoThresholdFigure />
    <Prose>Consider the Pareto density f(x)=αx<sup>−α−1</sup> for x≥1, with α&gt;0. It integrates to 1. To find the k-th nonnegative moment, integrate αx<sup>k −α−1</sup> from 1 to infinity. The power integral converges exactly when k&lt;α, and then equals α/(α−k). Thus the mean is finite only for α&gt;1; the second moment only for α&gt;2.</Prose>
    <Example name="tails" />
    <Prose>For α&gt;2, subtracting the squared mean gives variance α/[(α−1)²(α−2)]. At α=3/2 the mean is 3, but the second moment diverges; finite-variance covariance formulas and the Chebyshev bound below cannot be used as if a finite variance had been supplied. A finite sample variance can still be computed, because a finite list and the underlying law are different objects.</Prose>
    <Prose>These examples are the boundary check, not a replacement for measure and convergence theory. The lesson on <a href="/learn/path/full-curriculum/real-analysis-sequences-modes-of-convergence?module=math-foundations">Real Analysis, Sequences &amp; Modes of Convergence</a> explains why passing limits through averages requires hypotheses.</Prose>

    <H2>11. Distinguish a population from a sample</H2>
    <DatasetStatisticFigure />
    <Prose>The distribution's mean μ is a population quantity. Before collecting n readings, their sample mean X̄=(X₁+⋯+Xₙ)/n is a random variable too. After the readings x₁,…,xₙ are known, x̄ is one realized estimate. A probability statement about X̄ concerns repeated possible datasets under a specified sampling model, not several interpretations of an already fixed number.</Prose>
    <Prose>If all Xᵢ have mean μ, linearity gives E[X̄]=μ even if they are dependent. Its variance, however, retains every pair covariance:</Prose>
        <PairCovarianceSumFigure />
    <Prose>For three independent readings, the three diagonal cells contribute σ² and the six off-diagonal cells contribute 0, giving 3σ²/9. If all three readings copy one variable, all nine cells contribute σ², giving 9σ²/9. The actual pairings decide which cross terms survive.</Prose>
    <MathBlock>{String.raw`\begin{aligned}
      &\operatorname{Var}(\bar X)\\
      &=\frac{1}{n^2}\sum_{i=1}^{n}\sum_{j=1}^{n}\operatorname{Cov}(X_i,X_j).
    \end{aligned}`}</MathBlock>

    <Prose>For independent identically distributed readings with variance σ², only the n diagonal terms remain, giving σ²/n. “Identically distributed” means the marginal laws agree; “independent” is a separate claim about their joint law. If every reading copies one variable Z, all n² covariance terms equal Var(Z), so the average keeps that full variance.</Prose>
    <Prose>A <strong>Bernoulli</strong> variable B is 1 with probability p and 0 otherwise. Its mean is p. Because B²=B, its variance is p −p²=p(1−p).</Prose>
    <BinomialArrangementsFigure />
    <Prose> For n independent copies, a particular arrangement with k ones has probability pᵏ(1−p)ⁿ⁻ᵏ. There are “n choose k” such arrangements: choose which k positions contain the ones. Their count has a <strong>binomial</strong> law. The sample mean takes value k/n with that same mass. Python's comb(n,k) supplies this number of arrangements.</Prose>
    <SampleMeanLawLab />
    <Example name="sample_mean" />
    <H3>A precise finite-variance averaging guarantee</H3>
    <ChebyshevFigure />
    <Prose>For any variable W with mean μ and finite variance, the event |W−μ|≥ε contributes at least ε² per unit of its probability to E[(W−μ)²]. Therefore P(|W−μ|≥ε)≤Var(W)/ε² for ε&gt;0: <strong>Chebyshev's inequality</strong>. Under the iid finite-variance model, substituting W=X̄ gives σ²/(nε²), capped at 1 as a probability bound.</Prose>
    <Prose>For fixed ε this upper bound tends to 0 with n, proving convergence in probability of the iid finite-variance average to μ. A broader iid law of large numbers works under finite absolute first moment, with a different proof; it does not create a finite variance when one is absent. Neither result promises monotone improvement for one sample path or an exact finite-sample error. Sharper assumptions and bounds belong to <a href="/learn/path/full-curriculum/concentration-inequalities-hoeffding-bernstein-chernoff?module=math-foundations">Concentration Inequalities</a>.</Prose>
    <H3>What the n−1 denominator corrects</H3>
    <SampleCenteringFigure />
    <Prose>For iid paired observations (Xᵢ,Yᵢ), a usual sample covariance is s_XY=Σᵢ(Xᵢ−X̄)(Yᵢ−Ȳ)/(n −1), n≥2. Both entries from the same pair stay together. Independence is across pairs, not a requirement that X and Y within each pair be independent.</Prose>
    <Prose>Let the true means be μ_X,μ_Y. Expanding the numerator gives Σᵢ(Xᵢ−μ_X)(Yᵢ−μ_Y)−n(X̄−μ_X)(Ȳ−μ_Y). The first expected value is nCov(X,Y). The second is nCov(X̄,Ȳ)=Cov(X,Y), using iid pairs and finite second moments. The expected numerator is therefore (n −1)Cov(X,Y). Dividing by n −1 makes this estimator unbiased under those conditions. Taking Y=X proves the sample-variance version.</Prose>
    <Example name="sample_covariance" />
    <Prose>Dividing by n instead has a different legitimate use: it is the variance of the empirical distribution that places mass 1/n at each observed row. “Unbiased estimator of a population variance” and “variance of this finite empirical distribution” are different targets. Unequal weights, missing pair entries, dependence and selection mechanisms need their own analysis. There is no universal denominator correction that fixes them all.</Prose>
    <DenominatorTargetFigure />
    <Prose>The complete NumPy comparison first computes the earlier eight-outcome population by actual probability-weighted centered products, then transforms it into average and difference coordinates. It separately computes the three-row observed dataset with both denominators. With rows [1,2],[2,1],[4,3], the X squared-residual numerator is 14/3: dividing by 3 gives empirical 14/9, while dividing by 2 gives 7/3, unbiased only under the stated iid finite-moment model. NumPy needs observations in rows with <code>rowvar=False</code>; probability weights require the population target <code>ddof=0</code>.</Prose>
    <Example name="covariance" library />
    
    
    <H3>Compute centered moments carefully</H3>
    <CancellationFigure />
    <Prose>The stored readings are 10¹²−1,10¹²,10¹²+1. Their mean is 10¹² and centered residuals are −1,0,1. Squared sum 2 divided by 3 gives population variance 2/3. This exact offset and denominator are the ones used by the complete program below; the large shared offset is explicitly separated from the small variation.</Prose>
    <Prose>E[X²]−E[X]² is a useful algebraic identity, but a floating-point implementation can lose a small variance when subtracting two nearly equal huge values. A centered two-pass calculation or an online update can avoid that particular cancellation. Welford's update maintains a count, mean and sum M₂ of squared deviations from the current mean.</Prose>
    <StreamingRecenterFigure />
    <Prose>When a new value x arrives, let δ=x −oldMean, set newMean=oldMean+δ/n, and add δ(x −newMean) to M₂. To derive the update, recenter the old n −1 values around newMean; their old signed deviations sum to zero. Their new squared deviations add (n −1)(oldMean −newMean)², then the new point adds(x −newMean)². Substitution yields δ(x −newMean). Choose the final denominator according to the intended population or sample statistic.</Prose>
    <Example name="stable" />
    <Prose>This example uses exactly representable finite inputs around 10¹². It is not a claim that every floating-point range or stream is safe: input rounding, overflow and accumulated error still matter. Our interactive models use small declared ranges, centered sums and explicit degenerate states.</Prose>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>12. Practise on changed models</H2>
    <Prose>The fourteen scratch programs use the Python standard library; the two complete library comparisons use NumPy or SciPy as described beside their code. Solve the questions before opening the reasoned solutions. Finite code checks support the calculations; general laws rely on their derivations and assumptions.</Prose>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="1. Reconstruct the induced law" prompt="Four outcomes have probabilities 1/8,3/8,1/4,1/4. A rule sends them to −1,−1,2,4. Find the PMF, E[X], F(2), and P(−1<X≤2)." hint="Combine the first two masses before computing the distribution."><Prose>The PMF is −1 with 1/2, 2 with 1/4, 4 with 1/4. Mean is −1/2+1/2+1=1. F(2)=3/4. Excluding −1 leaves P(−1&lt;X≤2)=1/4. Equal numerical values collect mass; they do not create extra independent draws.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="2. Change the loss and the units" prompt="For that law, compute variance and E[(X−2)²]. Then transform to Y=−3X+5." hint="Compute E[X²], then use the centered identities."><Prose>E[X²]=1/2+1+4=11/2; Var(X)=11/2−1=9/2. Predicting 2 has squared loss 9/2+(2−1)²=11/2. The new mean is 2, variance 81/2 and standard deviation 3√(9/2). The negative scale reverses order but cannot create a negative variance.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="3. Refute independence with a real witness" prompt="Take X uniform on −2,0,2 and Y=X². Compute covariance and show why it is not an independence test." hint="Use symmetry for E[X] and E[X³], then inspect X=0,Y=4."><Prose>E[X]=E[X³]=0, so covariance is 0. But the joint mass at(0,4) is 0 while the marginal product is (1/3)(2/3)=2/9. The dependence is nonlinear and completely specified by Y=X².</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="4. Two dice, two new variables" prompt="For two independent fair dice A,B, define S=A+B and D=A−B. Find both means, variances and covariance; decide whether S,D are independent." hint="Expand using Var(A)=Var(B)=35/12, then check one joint cell."><Prose>E[S]=7, E[D]=0; both variances are 35/6. Cov(S,D)=Var(A)−Var(B)=0. Yet P(S=2,D=0)=1/36, whereas P(S=2)P(D=0)=(1/36)(1/6)=1/216. The variables are dependent.</Prose></Practice></div>
    <Example name="dice" />
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="5. Calibrate the task before comparing variance" prompt="Now A=θ+S+e_A and B=θ+S+e_B measure the same target, with independent zero-mean S,e_A,e_B of variances 9,1,4. For T=aA+(1−a)B, find the variance-minimizing weight. What does B−A estimate?" hint="The common term always has coefficient 1; minimize a²+4(1−a)²."><Prose>Var(T)=9+a²+4(1−a)². Completing the square gives 9+5(a−4/5)²+4/5. The optimum is a=4/5, variance 49/5. It remains unbiased for θ under the stated zero-mean model. B−A has mean 0 and variance 5; it cancels θ as well as S, so it is not an estimator of θ. Its smaller variance answers a different question.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="6. An impossible covariance proposal" prompt="A proposed three-variable correlation matrix has every diagonal 1 and every off-diagonal −0.8. Can it be valid?" hint="Calculate the variance of the sum of all three standardized variables."><Prose>The sum would have variance 3+2·3·(−.8)=−1.8. A variance cannot be negative, so the matrix is not positive semidefinite and cannot be a correlation matrix. Having every individual entry in [−1,1] is not enough.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="7. Weight the conditional cells" prompt="Group A has probability 3/4, conditional Y mean 2 and variance 1. Group B has probability 1/4, conditional mean 6 and variance 9. Find the overall mean and variance. Does each group's variance have to be smaller?" hint="Add the average within-group variance to the variance of the two means."><Prose>The overall mean is 3. Average within variance is (3/4)1+(1/4)9=3. Between variance is (3/4)(2−3)²+(1/4)(6−3)²=3. Total variance is 6. Group B's variance 9 exceeds 6, so the law controls an average of conditional variances, not a bound for each subgroup.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="8. Keep both continuous branches" prompt="For U uniform on [−1,1], calculate P(.04≤U²≤.49) and E[(U²)²]. What is P(U²=0)?" hint="Translate the interval into positive and negative U values."><Prose>The preimages are[−.7,−.2] and[.2,.7]. Total length 1 at density 1/2 gives probability 1/2. E[U⁴]=1/5. The singleton has probability 0; an unbounded density near 0 does not create an atom.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="9. Check the theorem's input" prompt="A Pareto law has alpha=1.8. A sample returns variance 12. Can you put 12 into the known-variance Chebyshev formula for its iid mean?" hint="Distinguish the population moment condition from a finite statistic."><Prose>No. The mean exists because 1.8&gt;1, but the second moment diverges because 1.8≤2. A finite sample variance does not supply a finite population variance or a guaranteed upper bound. Even for a finite-variance population, substituting an observed variance into that theorem needs separate justification.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="10. Diagnose copied observations" prompt="A Bernoulli(1/4) bit is copied into every row of a dataset of size 100. Find the expected sample mean, its variance and the realized corrected sample variance." hint="Every row is the same random variable."><Prose>The sample mean is the original bit: expectation 1/4 and variance 3/16. In either realized dataset all rows are equal, so the sample variance is 0 even with denominator 99. Independence across rows is absent; more copies do not produce 100 independent trials.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="11. Identify what a zero covariance does permit" prompt="X,Y have means 0, variances 4 and 9, and covariance 0. What is Var(2X−Y)? Can you conclude E[X²Y²]=E[X²]E[Y²]?" hint="Use the second-moment identity only for the quantity it covers."><Prose>Var(2X−Y)=4·4+9−4·0=25. The product of squared variables is a fourth-order question, not determined by zero covariance; those fourth moments may not even exist. Independence plus suitable integrability would justify a factorization, but it has not been supplied.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="12. Modify the outcome program independently" prompt="Keep the original program's independent first-head probability 1/4 and second-head probability 1/2, but replace head count with first indicator minus second indicator. Modify the scratch grouping, derive the new law/mean/variance, and compare the same support with SciPy. What is the conditional mean given a nonnegative result?" hint="TT and HH now share the zero output; TH and HT give different signed values. Normalize the retained masses only after their total is known."><Prose>The new support is −1,0,1 with masses 3/8,1/2,1/8. Its mean is −1/4, second moment 1/2 and variance 7/16. In the original loop, change only the fixed numerical rule to first −second; preserve every outcome's original probability and add equal output masses. In the SciPy route use this support/mass list and compare <code>.mean()</code>/<code>.var()</code> with the explicit sums. The nonnegative event has mass 5/8 and retained weighted sum 1/8, so its conditional mean is 1/5. Changing the rule does not create independent new tosses or alter the outcome probabilities.</Prose></Practice></div>
    <div className="lesson-exercise" data-lesson-exercise=""><Practice title="13. Change units in the full library comparison" prompt="In the eight-outcome NumPy population, change only the first channel from millivolts to volts by dividing its numeric values by 1000. Derive the new covariance matrix and correlation before running the complete program. What must change before interpreting an average?" hint="Apply one factor to cross-covariance and two to the first variance. A dimensionless correlation cancels those factors; raw values in different units cannot be averaged as if they shared one scale."><Prose>The covariance is [[5×10⁻⁶,.004],[.004,5]], with diagonal units V² and mV² and cross units V·mV. Means become .01V and 20mV. Correlation remains .8 because both the numerator and the first standard deviation acquire the same positive 1/1000 factor. Apply <code>np.cov</code> to the same actual eight rows and probability weights, and compare these values with the explicitly weighted centered products. Before taking a physical average or difference, express both channels in the same units or change the transformation matrix to perform the required conversion; otherwise the numerical operation answers the wrong measurement question. The independent three-row observed sample remains a separate object with its own denominator choice.</Prose></Practice></div>
    <Prose><strong>Readiness check.</strong> Explain where each probability mass came from; calculate a transformed expectation and a paired covariance; supply an explicit independence witness; preserve units and the estimand in a noise combination; derive a conditional decomposition; and identify which sampling or moment assumption a claimed guarantee requires.</Prose>
    <Prose><strong>Next in this module:</strong> <a href="/learn/path/full-curriculum/sampling-measurement-experimental-design?module=math-foundations">Sampling, Measurement &amp; Experimental Design</a> asks how data collection produces the observations these calculations use. Carry forward the distinction between a new independent unit, a repeated reading and a copied value.</Prose></section>
    <Sources alternatives={<p>For a spoken route, the <a href="https://stat110.hsites.harvard.edu/youtube" target="_blank" rel="noreferrer">official Harvard Stat 110 guide</a> links lectures 8–9 on random variables/expectation, 21 on covariance and 25–29 on conditioning and averages. Start with the finite expectations and then follow the conditioning lectures after section8. <a href="https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/resources/derivation-of-the-law-of-total-variance/" target="_blank" rel="noreferrer">John Tsitsiklis's MIT total-variance derivation</a> is a focused alternative after the finite grouping example; use its step-by-step conditional expansion alongside the grouped outcomes.</p>}>
      <li><a href="https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class04-prep-b.pdf" target="_blank" rel="noreferrer">MIT 18.05: expected value</a> — selected weighted-average, linearity and infinite-mean discussion; a concise undergraduate written route with additional problems.</li>
      <li><a href="https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class07-prep-b.pdf" target="_blank" rel="noreferrer">MIT 18.05: covariance and correlation</a> — selected finite definitions, sum-variance identities and independence counterexample. Use the finite sections first; trace the finite paired examples before the continuous calculations.</li>
      <li><a href="https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class06-prep-a.pdf" target="_blank" rel="noreferrer">MIT 18.05: continuous moments</a> — selected definition and uniform/exponential moment passages connect sums to integrals. The integral branch assumes basic calculus.</li>
      <li><a href="https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/3d68defe35d6265a9b882ef0f655f230_MIT6_041F10_L12.pdf">MIT6.041: conditional expectations</a> — both content pages distinguish a group mean from its random-variable version, derive total expectation/variance and show why the group probabilities matter. Use this written route after section8.</li>
      <li><a href="https://numpy.org/doc/2.3/reference/generated/numpy.cov.html">NumPy2.3: covariance</a> — observation orientation, probability weights and denominator conventions for the complete library comparison. Match its target to the actual probability model or empirical sample.</li>
      <li><a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.rv_discrete.expect.html">SciPy: finite discrete expectation</a> — inclusive support bounds and conditional normalization for the restricted-expectation construction in section3 and complete program in section4. Numerical expectations still need the appropriate existence conditions.</li>
      <li><a href="https://math.pku.edu.cn/teachers/litj/notes/numer_anal/AmerStat_37_242_Chan_Variance.pdf">Chan, Golub and LeVeque: computing sample variance</a> — article pages242–243 compare subtraction, centered computation and the actual streaming recurrences. Later error analyses are a specialist follow-up beyond the local finite numerical example.</li>
      <li><a href="https://web.mit.edu/18.06/www/Spring21/Lecture%20notes.pdf" target="_blank" rel="noreferrer">MIT 18.06, lecture 31: covariance matrices</a> — equations 288–291 and the following degeneracy explanation connect weighted outer products to positive semidefiniteness and the variance of linear combinations. Read that lecture after the two-channel matrix calculation; the later notes continue toward principal components.</li>
      <li><a href="https://www2.stat.duke.edu/courses/Fall19/sta721/lectures/NormalTheory/multnorm.pdf" target="_blank" rel="noreferrer">Duke STA 721: multivariate normal theory</a> — the block-independence construction explains why the zero-covariance exception requires a jointly Gaussian vector. This is a specialist follow-up, not an assumption needed for our finite examples.</li>
    </Sources>
  </div>
};
