import { Prose, H2 } from '../../../../src/learn/components/content';
import { MathBlock as SharedMathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {
  LessonIntro,
  LessonTable,
  Sources,
} from '../../../../src/learn/components/lesson-labs/LessonElements.jsx';
import {
  BaselineAnatomy,
  SamePromptGroups,
  CausalResponseScore,
  ScoreGeometry,
  BaselineDependency,
  SelfMeanFactor,
  LeaveOneOutMatrix,
  IndependenceTrees,
  GradientDistribution,
  RewardBudget,
  StandardizationRows,
  QuestionWeighting,
  PolicySnapshots,
  RatioBranches,
  ClippingSurfaces,
  ReductionGrid,
  SampledKL,
  RegularizationPaths,
  OnlineLoop,
  NativeConfigurations,
  PairAndBinaryLabels,
  KTOUtility,
  ReferencePairing,
  WeightedClasses,
  DetachedReference,
  KTOBatch,
  MeasuredCandidates,
  MeasuredEstimators,
  RecordedUpdates,
  MethodObjects,
  ReportPolicy,
} from '../../../../src/learn/components/lesson-labs/GroupedPreferenceFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';

const root = '/learn-code/grpo-rloo-kto/';
const Program = ({ file, title }) => (
  <RemoteCodeBlock source={root + file} filename={file} title={title} />
);
const MathBlock = ({ children }) => (
  <div
    className="grouped-preference-math"
    role="region"
    tabIndex={0}
    aria-label="Mathematical relationship"
  >
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Anchor = ({ id }) => <span id={id} aria-hidden="true" />;
const Exercise = ({ title, children, hint, solution }) => (
  <div
    className="lesson-exercise flow-check"
    data-lesson-exercise
    id={`group-practice-${title.split('.')[0]}`}
  >
    <p>
      <strong>{title}</strong> {children}
    </p>
    <details>
      <summary>Hint</summary>
      {hint}
    </details>
    <details>
      <summary>Worked solution</summary>
      {solution}
    </details>
  </div>
);

const lesson = {
  title: 'GRPO, RLOO, KTO & Advanced Preference Methods',
  readTime: '~90 min read + programs and practice',
  content: () => (
    <div className="lesson-flow grouped-preference-flow">
      <LessonIntro
        prerequisites="RLHF supplies score-function gradients, old/current/reference policies and PPO clipping. SFT supplies response masks and real poem data. DPO and SimPO supply fixed preference records. We rebuild the local calculations before changing them."
        exampleKind="Exact finite estimators, complete causal-model updates and ordinary pinned TRL trainers"
      >
        Follow a group of answers from reward to baseline to gradient. Then compare individual
        desirable and undesirable records through KTO. The first pass follows every section; the
        covariance expansion and the optional weighted-KL derivative are deeper branches. Actual
        poem scores connect the finite calculations to a causal model. Two-update demonstrations
        establish how the implementations behave, with every outcome retained.
      </LessonIntro>

      <Anchor id="1-why-it-exists" />
      <Anchor id="1-start-with-the-problem" />
      <H2>1. Replace a critic only after identifying its job</H2>
      <Prose>
        Ask a model to label the sentiment of a poem verse. It can answer “negative”, “no impact” or
        “positive”, and it can also produce text outside those labels. A reward function gives a
        completed response a number. In our real-data example it returns 1 when the strict parsed
        label matches the dataset annotation and 0 otherwise. The annotation is a human judgment
        recorded by that dataset; correctness here is relative to that judgment.
      </Prose>
      <BaselineAnatomy />
      <Prose>
        Trace one response down the token tree. Its tokens receive probabilities from the policy;
        the completed response receives a reward. A baseline supplies a comparison level. Their
        difference, called its reward advantage here, tells the update whether that sampled response
        did better or worse than the comparison. The baseline is neither the frozen reference policy
        nor the old sampling policy. Those policies have separate jobs in controlling and measuring
        a change.
      </Prose>
      <Prose>
        In{' '}
        <a href="/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models">
          RLHF
        </a>
        , a learned value function predicts a future return from a prefix. Training that critic
        costs parameters, activations and optimization work. When a prompt can produce several
        complete responses, their rewards offer another source of comparison. GRPO means Group
        Relative Policy Optimization; RLOO means REINFORCE Leave-One-Out. Both use a group, but
        their advantage calculations and common implementations differ. We will derive those
        differences instead of treating “critic-free” as a complete algorithm.
      </Prose>
      <SamePromptGroups />
      <Prose>
        The first prompt's four responses have rewards 0, 1, 1 and 2, with mean 1. The second
        prompt's responses all have reward 2, with mean 2. Subtracting each prompt's own mean gives
        the first group differences −1, 0, 0 and 1, and the second group four zeros. The second
        group has no within-group reward contrast even though every reward is high. Four equally bad
        responses would also have no contrast. Edit a reward and watch only its own prompt's
        comparison change. Responses are independent draws conditional on that prompt in the
        derivations below; repeated answer text is allowed.
      </Prose>
      <Prose>
        A group baseline removes the need to predict this comparison with a critic. It still
        requires generation and rewards, and reference regularization may still require a reference
        model. To understand exactly what the group changes, first locate the probability whose
        derivative each response contributes.
      </Prose>

      <H2>2. Follow one complete response through the gradient</H2>
      <CausalResponseScore />
      <Prose>
        A causal decoder's row immediately before a response token predicts that token. For a
        two-token answer followed by an end-of-sequence (EOS) token, select three rows and sum three
        log probabilities. The prompt remains context, although its target positions do not
        contribute to the response sum. Padding may store the same integer as EOS; a positional
        target mask distinguishes the genuine stopping action from storage added to align rows. A
        longer answer adds selected actions rather than silently averaging them away.
      </Prose>
      <MathBlock>{String.raw`\ell_\theta(y\mid x)=\sum_{t=1}^{L}\log\pi_\theta(y_t\mid x,y_{<t}),\qquad
        s_\theta(y\mid x)=\nabla_\theta\ell_\theta(y\mid x).`}</MathBlock>
      <Prose>
        Here x is the prompt, y the response, L its selected length, θ the policy parameters, and s
        the score vector. “Score” in this equation means a derivative of log probability; it is
        different from a scalar reward or a reward model's output. The same parameter may affect
        many token rows, so the parameter gradient adds their contributions.
      </Prose>
      <ScoreGeometry />
      <Prose>
        Temporarily restrict the policy to three complete answers, with probabilities p = (0.2, 0.3,
        0.5) and rewards r = (0, 1, 2). Its expected reward is 0.2 × 0 + 0.3 × 1 + 0.5 × 2 = 1.3. If
        answer C is drawn, its score with respect to the three softmax logits is (−0.2, −0.3, 0.5).
        Increasing C's logit raises its probability while normalization reduces the others. Weight
        all three possible score vectors by their probabilities and they sum to zero.
      </Prose>
      <MathBlock>{String.raw`p_j=\frac{e^{z_j}}{\sum_k e^{z_k}},\qquad
        s_j(y)=\mathbf 1[y=j]-p_j,\qquad J=\sum_y p_y r_y,\qquad
        \frac{\partial J}{\partial z_j}=p_j(r_j-J).`}</MathBlock>
      <Prose>
        The exact gradient is (−0.26, −0.09, 0.35). A small gradient-ascent step raises the expected
        reward locally. It does not raise every positive-reward answer: B's reward 1 is below the
        current average 1.3. A response's absolute reward and its contribution relative to other
        possibilities are different comparisons. Equal rewards make the expected-reward gradient
        zero because reallocating probability cannot improve reward.
      </Prose>
      <Prose>
        The finite logits make every calculation visible. A language model uses shared neural
        parameters instead; its score is the same log-probability derivative carried through that
        larger computation. Reward is treated as an observed scalar with no direct derivative
        through θ. For a fixed prompt and an on-policy draw, the score-function identity gives the
        following estimator, averaging G independent draws for that prompt.
      </Prose>
      <MathBlock>{String.raw`\nabla_\theta J(x)=\mathbb E_{y\sim\pi_\theta(\cdot\mid x)}
        [r(x,y)\nabla_\theta\log\pi_\theta(y\mid x)],\qquad
        \widehat g=\frac1G\sum_{i=1}^{G}r_i s_i.`}</MathBlock>
      <Prose>
        Sampling makes this estimate vary across groups. Its expected value can be correct while an
        individual update points in an unhelpful direction. Baselines aim to change that sampling
        variation. Whether they also change the expectation depends on what information they use.
      </Prose>

      <Exercise
        title="1. Trace a different response mask."
        hint={
          <Prose>
            Write original input positions first, then move each selected target one row left to
            locate its predicting logit.
          </Prose>
        }
        solution={
          <Prose>
            Prompt tokens occupy positions 0 and 1; answer tokens occupy 2, 3 and 4; genuine EOS
            occupies 5. Select predicting logit rows 1, 2, 3 and 4. A padding cell at position 6 is
            excluded even if it stores the EOS integer. Prompt target losses are ignored, but prompt
            representations still participate in the attention computation that predicts later
            selected tokens, so their upstream gradients can be nonzero.
          </Prose>
        }
      >
        A sequence has two prompt tokens, three answer tokens, a genuine EOS and one padding token
        that stores EOS. Which predicting rows contribute? Can the prompt still receive gradient?
      </Exercise>
      <Exercise
        title="2. Compute a new exact gradient."
        hint={
          <Prose>
            First find the scalar expected reward. For each answer, subtract p from its one-hot
            vector.
          </Prose>
        }
        solution={
          <Prose>
            The expectation is 0.5(−1) + 0.25(2) + 0.25(0) = 0. The three score vectors are (0.5,
            −0.25, −0.25), (−0.5, 0.75, −0.25) and (−0.5, −0.25, 0.75). Their probability-weighted
            sum is zero. Multiplying each probability by its reward minus zero gives the target
            (−0.5, 0.5, 0). The zero third coordinate does not mean its sampled score is zero; other
            outcomes cancel its expected contribution.
          </Prose>
        }
      >
        For p = (0.5, 0.25, 0.25) and rewards (−1, 2, 0), find J, all score vectors and the exact
        three-logit gradient.
      </Exercise>

      <Anchor id="2-core-intuition" />
      <Anchor id="2-build-the-intuition" />
      <H2>3. A useful baseline must avoid the sampled answer's reward</H2>
      <BaselineDependency />
      <Prose>
        A constant baseline b = 1 subtracts the same number whichever answer was drawn. Its expected
        extra term is −b times the expected score, which is zero. It can change the estimate's
        spread while preserving its mean. Now draw a new edge from the response's own reward into
        its baseline, and set that baseline to the same reward. Every advantage becomes zero, so
        every estimate becomes zero, even for our nonzero true gradient. A baseline cannot be
        justified merely by calling it “a comparison”.
      </Prose>
      <MathBlock>{String.raw`\mathbb E[s]=\sum_y\pi_\theta(y)\nabla_\theta\log\pi_\theta(y)
        =\nabla_\theta\sum_y\pi_\theta(y)=0,\qquad
        \mathbb E[(r-b)s]=\nabla_\theta J\quad\text{for a baseline independent of the draw}.`}</MathBlock>
      <Prose>
        The baseline may depend on the prompt. We condition on that prompt throughout this argument.
        It must not acquire dependence on the particular sampled response in a way that invalidates
        the zero cross-term. A learned baseline is normally detached from the policy loss; otherwise
        differentiating the product introduces another term. Even an independent baseline can
        increase variance if it is poorly chosen.
      </Prose>
      <SelfMeanFactor />
      <Prose>
        A group mean looks like a convenient baseline, but the influence matrix exposes an important
        diagonal. Each response contributes 1/G of its own reward to its own mean. With four draws,
        self-centering retains only three quarters of the original expected gradient. The other
        group members contribute independent baselines; the diagonal subtracts one quarter of the
        reward signal itself. Increasing G reduces this effect but does not remove it at a finite
        group size.
      </Prose>
      <MathBlock>{String.raw`\bar r=\frac1G\sum_j r_j,\qquad
        \mathbb E[(r_i-\bar r)s_i]
        =\mathbb E[r_i s_i]-\frac1G\mathbb E[r_i s_i]
        -\frac1G\sum_{j\ne i}\mathbb E[r_j]\mathbb E[s_i]
        =\left(1-\frac1G\right)\nabla J.`}</MathBlock>
      <Prose>
        This is the expectation of raw mean subtraction under independent same-prompt draws.
        Dividing by a random standard deviation, clipping a probability ratio or reusing correlated
        samples adds further changes. A constant rescaling could compensate for this one factor in a
        plain estimator; it does not prove that two full training recipes are equivalent.
        Leave-one-out gives a direct way to avoid self-inclusion.
      </Prose>
      <Prose>
        To run the finite calculations, download the{' '}
        <a href={root + 'grpo-rloo-kto.zip'} download>
          {' '}
          complete program archive
        </a>{' '}
        and extract it. Its <a href={root + 'README.md'}>README</a> identifies the model/data
        lineage and commands. Create a virtual environment with <code>python -m venv .venv</code>,
        activate it, then install <code>python -m pip install -r requirements.txt</code>. NumPy
        performs the exact enumeration; the neural routes additionally use PyTorch, Transformers and
        TRL. Start with <code>python group_estimators.py --group-size 4 --output finite.json</code>.
        This constructs the declared three-answer example and requires no model download.
      </Prose>
      <Program
        file="group_estimators.py"
        title="Exact distributions of grouped gradient estimators"
      />
      <Prose>
        <code>advantages</code> computes one group's comparison values. The ordered product
        enumeration visits every possible sequence of G answers and multiplies its draw
        probabilities. The resulting weighted mean is an exact expectation for that finite
        distribution, not a Monte Carlo estimate. The online central-moment calculation avoids
        subtracting two nearly equal large second moments. We will interpret its covariance, bias
        and mean squared error after deriving the leave-one-out estimator.
      </Prose>

      <H2>4. Leave one answer out</H2>
      <LeaveOneOutMatrix />
      <Prose>
        Cross out the diagonal before averaging. For rewards (0, 1, 1, 2), the first response
        compares its 0 with the other three rewards' mean, 4/3. The fourth compares its 2 with the
        others' mean, 2/3. The middle responses each compare 1 with 1. Their advantages are (−4/3,
        0, 0, 4/3). The raw centered values were (−1, 0, 0, 1), so every value is multiplied by 4/3.
        This is an algebraic identity for any fixed reward group of size greater than one.
      </Prose>
      <MathBlock>{String.raw`b_{-i}=\frac{\sum_{j\ne i}r_j}{G-1},\qquad
        A_i^{\mathrm{LOO}}=r_i-b_{-i}
        =\frac{G}{G-1}(r_i-\bar r),\qquad
        \widehat g_{\mathrm{LOO}}=\frac1G\sum_i A_i^{\mathrm{LOO}}s_i.`}</MathBlock>
      <Prose>
        Sum the rewards once, subtract each response's reward, and divide by G−1. Computing all G
        baselines then takes O(G) work, rather than recomputing G separate sums. The matrix is an
        explanation of dependencies; an implementation need not store a quadratic matrix. A group of
        one has no other response and no leave-one-out mean. It must be rejected or explicitly
        treated as missing comparison evidence.
      </Prose>
      <IndependenceTrees />
      <Prose>
        The two trees begin from the same fixed prompt but have separate random draws. When response
        i supplies the score, the other draws supply its baseline. Their joint probability factors,
        so the expected product of baseline and score factors too. The score expectation is zero.
        This proves unbiasedness for the raw on-policy score-function estimator under those
        assumptions; it is not a claim about every clipped, standardized or stale-data update called
        RLOO.
      </Prose>
      <MathBlock>{String.raw`\mathbb E[b_{-i}s_i\mid x]
        =\mathbb E[b_{-i}\mid x]\,\mathbb E[s_i\mid x]=0,\qquad
        \mathbb E[\widehat g_{\mathrm{LOO}}\mid x]=\nabla J(x).`}</MathBlock>
      <Prose>
        Independence is about sampling, not different text. Two independent draws can produce the
        same response. Conversely, copying one sampled response four times creates perfect
        dependence even though it has the right one-response marginal distribution. Every copied
        reward equals its leave-one-out baseline and the estimate is zero. Increasing the copied
        group size does not repair that failure.
      </Prose>

      <Exercise
        title="3. Exclude one of three rewards."
        hint={
          <Prose>
            The total is 6. For each record subtract its reward from that total and divide by two.
          </Prose>
        }
        solution={
          <Prose>
            The mean is 2. Raw deviations are (0, −3, 3). Excluded means are (2, 3.5, 0.5), giving
            LOO advantages (0, −4.5, 4.5). They are 3/2 times the raw deviations. Under independent
            same-prompt sampling, the raw-centered expected gradient has factor 2/3, while the raw
            LOO expectation equals the target.
          </Prose>
        }
      >
        Compute raw centered and leave-one-out advantages for rewards (2, −1, 5). State the
        finite-group expectation factor.
      </Exercise>
      <Exercise
        title="4. Break the independence proof."
        hint={
          <Prose>
            Preserve the marginal distribution of one draw while making the group members depend on
            one another.
          </Prose>
        }
        solution={
          <Prose>
            For independent draws, cross terms E[r_j s_i] with j ≠ i factor into E[r_j]E[s_i] = 0.
            The self term leaves factor (G−1)/G for raw centering. Instead sample one answer and
            copy it to every group position. Each position retains the correct one-draw marginal,
            but every reward equals its excluded mean, so LOO is identically zero. On the preceding
            nonconstant-reward example the true gradient is nonzero. The missing ingredient is joint
            independence, not group size or different strings.
          </Prose>
        }
      >
        Explain the cross-term argument, then construct correlated draws that make LOO fail despite
        correct one-draw marginals.
      </Exercise>
      <Exercise
        title="5. Handle missing feedback in linear time."
        hint={
          <Prose>
            Count finite entries, sum them once, and exclude each finite reward from that sum.
          </Prose>
        }
        solution={
          <Prose>
            The valid rewards are 3, −1 and 7, with count 3 and total 9. Excluded means are 3, 5 and
            1, giving advantages 0, −6 and 6. The missing position gets the declared zero-advantage
            fallback, so the stored vector is (0, 0, −6, 6) with valid count 3. For fewer than two
            observations return zero reward advantages with the count, without claiming a baseline
            exists. This requires O(G) work. The first observed reward's numerical zero advantage
            and the second entry's missing-feedback fallback have different meanings; retain the
            mask.
          </Prose>
        }
      >
        Implement the masked LOO operation for (3, missing, −1, 7). Specify what happens with one
        valid reward and explain why missing is not reward zero.
      </Exercise>

      <H2>5. Compare estimator distributions, not advantage magnitudes</H2>
      <GradientDistribution />
      <Prose>
        For three possible answers and two independent draws, there are nine ordered groups. Group
        (A, C) has probability 0.2 × 0.5 = 0.1, and (C, A) is a separate event with the same
        probability. Each group produces a three-coordinate gradient estimate. The plot shows its
        first and third coordinates, with area representing probability mass; the second coordinate
        follows because the coordinates sum to zero. The exact target and the distribution's mean
        use different marks so systematic displacement remains visible when the cloud is small.
      </Prose>
      <Prose>
        Bias is the mean estimate minus the target. Variance describes the spread around that mean.
        Mean squared error (MSE) relative to the target combines both. A raw self-centered estimator
        can have a smaller spread partly because it shrinks the signal; comparing only spread would
        reward that shrinkage. Corrected self-centering and leave-one-out coincide group by group
        before any other transformation, so their clouds coincide.
      </Prose>
      <MathBlock>{String.raw`\mu=\mathbb E[\widehat g],\quad b=\mu-g,\quad
        \operatorname{Cov}(\widehat g)=\mathbb E[(\widehat g-\mu)(\widehat g-\mu)^\top],\qquad
        \mathbb E\|\widehat g-g\|^2=\operatorname{tr}\operatorname{Cov}(\widehat g)+\|b\|^2.`}</MathBlock>
      <Prose>
        The covariance trace adds the variances of the displayed gradient coordinates and the
        remaining coordinate. All quantities here refer to the three answer logits. A neural
        parameterization applies a model-dependent Jacobian to these directions, so these numerical
        variances are not automatically variances of every neural weight. Change reward C and
        compare the whole distribution again. There is no universal rule that a named baseline has
        the smallest variance on every policy and reward.
      </Prose>
      <Prose>
        <strong>Deeper derivation.</strong> Write the error as (estimate − mean) + (mean − target).
        Expanding its squared length produces a cross term whose expectation is zero, because
        estimate − mean has mean zero. The remaining first term is the covariance trace; the second
        is squared bias. This decomposition requires no independence between coordinates. It makes a
        biased estimator's tradeoff explicit rather than treating unbiasedness as the only useful
        property.
      </Prose>
      <RewardBudget />
      <Prose>
        A larger group spends more reward calls. At a budget of eight calls, group size two gives
        four independent group estimates; group size four gives two. Averaging n independent group
        estimates divides their covariance by n while leaving their bias unchanged. The budget plot
        applies exactly that calculation at a fixed policy. It does not train between groups or
        predict a model's eventual benchmark quality.
      </Prose>
      <MathBlock>{String.raw`n=\frac{B}{G},\qquad
        \operatorname{MSE}_B=\frac{\operatorname{tr}\operatorname{Cov}(\widehat g_G)}{n}+\|b_G\|^2,
        \quad B\text{ a positive multiple of }G.`}</MathBlock>
      <Prose>
        This comparison assumes equal-cost reward calls and independent groups. Real response
        lengths, expensive verifiers, model memory and generation batching can change wall time.
        Keep those costs separate from this derived variance calculation. Standardizing each group
        introduces another issue: its denominator is random, so even the direction's expected
        weighting can change.
      </Prose>

      <Exercise
        title="6. Find a variance counterexample."
        hint={
          <Prose>
            For two draws the ordered groups have probabilities 0.49, 0.21, 0.21 and 0.09. Compute
            one coordinate; the other has the opposite sign.
          </Prose>
        }
        solution={
          <Prose>
            The exact gradient is (−0.63, 0.63). Plain REINFORCE's first-coordinate estimates are
            −0.6, −0.65, −0.65 and −0.7, giving total two-coordinate MSE 0.0021. LOO gives 0, −1.5,
            −1.5 and 0, giving MSE 1.0962. A constant baseline 10 gives −3.6, 1.35, 1.35 and 6.3,
            with MSE 20.5821. All three expectations equal the target. Here the rewards and scores
            make uncentered estimates unusually stable; unbiasedness does not order the variances.
          </Prose>
        }
      >
        Enumerate G = 2 for probabilities (0.7, 0.3) and rewards (−2, 1). Compare plain REINFORCE,
        LOO and an independent constant baseline of 10.
      </Exercise>

      <H2>6. What standardizing the group changes</H2>
      <StandardizationRows />
      <Prose>
        For (0, 1, 1, 2), the mean is 1 and the deviations are (−1, 0, 0, 1). Their squared sum is
        2. Dividing by G−1 = 3 gives sample variance 2/3 and sample standard deviation about
        0.816497. Dividing each deviation by this standard deviation plus 0.0001 gives approximately
        (−1.224595, 0, 0, 1.224595). The denominator is recomputed from each observed group, so it
        can depend on the very response whose score it multiplies.
      </Prose>
      <MathBlock>{String.raw`\sigma_G=\sqrt{\frac1{G-1}\sum_i(r_i-\bar r)^2},\qquad
        A_i^{\mathrm{std}}=\frac{r_i-\bar r}{\sigma_G+\epsilon}.`}</MathBlock>
      <Prose>
        Adding the same constant to every finite reward leaves both deviations and spread unchanged.
        Multiplying rewards by a positive number scales the deviations and spread together, but a
        fixed epsilon prevents exact scale invariance. Sample and population standard deviations
        also differ by a group-size factor. These choices belong in the definition of the
        implemented objective, not in an unrecorded library default.
      </Prose>
      <Prose>
        Four equal rewards give zero deviations. A missing reward is a different observation: the
        local helper represents it by NaN (“not a number”) and excludes it from the valid count.
        Fewer than two observed rewards gives zero reward advantage with an explicit count; it does
        not establish a leave-one-out comparison or a sample spread. A separate reference penalty
        can still produce a gradient when the reward advantage is zero. Missingness correlated with
        answer quality can also bias which rewards are observed.
      </Prose>
      <QuestionWeighting />
      <Prose>
        Consider two constructed yes/no policies. Their success probabilities are 0.1 and 0.7, and
        success earns 1. With four independent responses, the probability of a mixed success/failure
        group is 1 − q⁴ − (1−q)⁴: 0.3438 for the first question and 0.7518 for the second. An
        all-success or all-failure group has no centered reward contrast. Standardized mixed groups
        are rescaled according to how many successes they contain. Enumerating the binary groups
        exposes how this changes their expected contributions.
      </Prose>
      <MathBlock>{String.raw`J=q,\qquad \frac{dJ}{dz}=q(1-q),\qquad
        P(\text{mixed group})=1-q^G-(1-q)^G,\quad q=\operatorname{sigmoid}(z).`}</MathBlock>
      <Prose>
        The raw target gradients are 0.09 and 0.21 in these binary logit coordinates. Raw mean
        subtraction multiplies each by (G−1)/G; raw leave-one-out retains each target. Division by a
        random group spread generally has another expectation. It is therefore unsafe to describe
        standardization as only a harmless fixed change of learning rate. This binary construction
        illustrates prompt weighting; an arbitrary language model's shared-parameter gradient need
        not follow these two scalar curves.
      </Prose>
      <Exercise
        title="7. Change reward units."
        hint={
          <Prose>
            Track the numerator and standard deviation separately, keeping epsilon fixed.
          </Prose>
        }
        solution={
          <Prose>
            Adding 8 leaves raw centered and LOO advantages unchanged. Multiplying all rewards by 3
            triples both of those advantages and the raw reward gradient. Standardization becomes
            3(r−mean)/(3σ+ε) = (r−mean)/(σ+ε/3), so it is not exactly unchanged with fixed positive
            ε. A plain REINFORCE estimate also acquires 8s per draw after translation; that term has
            zero expectation but changes variance. A fixed constant baseline does not automatically
            shift with the reward.
          </Prose>
        }
      >
        Predict the effect of replacing each reward r by 3r + 8. Distinguish raw centered, LOO,
        standardized and plain estimators.
      </Exercise>

      <H2>7. Old policy, current policy and reference are different objects</H2>
      <PolicySnapshots />
      <Prose>
        The old policy samples a rollout. Its log probabilities describe how those particular
        responses were obtained. The current policy is the one being differentiated and updated. A
        fixed reference supplies a separate comparison distribution. At initialization all three can
        have equal weights, but equality at one instant does not merge their roles. After an
        optimizer step the current weights change while cached old and reference scores remain
        fixed. A later rollout refreshes the old policy; refreshing the reference is a separate
        recipe choice that must be stated explicitly.
      </Prose>
      <Prose>
        When data came from the old policy, a probability ratio measures how much the current policy
        reweights it. An exact whole-response importance ratio is a product over all selected
        tokens. A token ratio and a geometric mean of token ratios are different objects. Label the
        operation before selecting a clipping threshold.
      </Prose>
      <RatioBranches />
      <Prose>
        Suppose the first token's current probability is 1.5 times its old probability and the
        second token's is 0.8 times its old probability. The whole-response ratio is 1.5 × 0.8 =
        1.2. Its geometric mean is √1.2, about 1.095445. The two token ratios remain 1.5 and 0.8.
        The multiplication tree, summed log changes and averaged log changes produce these three
        quantities from the same inputs.
      </Prose>
      <MathBlock>{String.raw`\rho_t=\exp(\ell_{\theta,t}-\ell_{\mathrm{old},t}),\quad
        \rho_{\mathrm{seq}}=\exp\!\left(\sum_{t=1}^{L}(\ell_{\theta,t}-\ell_{\mathrm{old},t})\right),\quad
        \rho_{\mathrm{geom}}=\exp\!\left(\frac1L\sum_{t=1}^{L}(\ell_{\theta,t}-\ell_{\mathrm{old},t})\right).`}</MathBlock>
      <Prose>
        Ordinary importance weighting of a complete response uses the sequence ratio when the
        sampling distribution has support wherever the target distribution contributes. A geometric
        mean changes that weight and reduces its dependence on length. Current GRPO's sequence-level
        importance option uses this geometric mean; the RLOO route below uses the full sequence sum.
        Those settings are not interchangeable even though each may be described informally as “a
        sequence ratio”. Equal current and old scores make all three ratios one, which is a useful
        null check but cannot reveal their difference.
      </Prose>

      <Anchor id="3-mathematical-foundation" />
      <H2>8. Clipping and reduction define the actual GRPO loss</H2>
      <ClippingSurfaces />
      <Prose>
        For positive advantage, increasing a ratio initially increases the reward surrogate. Once
        the ratio exceeds 1 + ε, the clipped branch supplies the smaller value and the surrogate
        stops rewarding further increase. For negative advantage, the plateau is on the other side:
        ratios below 1 − ε stop receiving additional incentive to decrease. At ε = 0.2 and ratio
        1.5, positive advantage 1 yields the clipped surrogate 1.2, while negative advantage −1
        yields −1.5 and remains active.
      </Prose>
      <MathBlock>{String.raw`S(\rho,A)=\min\{\rho A,\operatorname{clip}(\rho,1-\epsilon,1+\epsilon)A\},\qquad
        L_{\mathrm{policy}}=-S(\rho,A).`}</MathBlock>
      <Prose>
        The optimizer minimizes the negative surrogate. Clipping one sampled term does not constrain
        all model probabilities to that interval: shared parameters also respond to other samples
        and losses. This is a modified optimization objective, not a hard trust-region constraint.
        At advantage zero the policy term and its gradient are zero; a separately added reference
        penalty may still be active.
      </Prose>
      <ReductionGrid />
      <Prose>
        Now consider one response with two selected tokens and another with four. If every cell has
        loss 2, response averaging and pooled-token averaging both return 2. That equality hides
        their weighting. Change the short response's losses to (1, 1) and the long response's to (3,
        3, 3, 3). Averaging each response first gives (1 + 3)/2 = 2. Pooling all six token terms
        gives 14/6 = 7/3. Dividing their sum by two responses times a fixed cap of four gives 14/8 =
        7/4.
      </Prose>
      <MathBlock>{String.raw`L_{\mathrm{response}}=\frac1G\sum_i\frac1{L_i}\sum_t m_{i,t}l_{i,t},\quad
        L_{\mathrm{token}}=\frac{\sum_{i,t}m_{i,t}l_{i,t}}{\sum_i L_i},\quad
        L_{\mathrm{fixed}}=\frac{\sum_{i,t}m_{i,t}l_{i,t}}{G L_{\max}}.`}</MathBlock>
      <Prose>
        The mask m selects actual response tokens and L is its row sum. In response averaging, each
        short-response cell above has weight 1/4 and each long-response cell weight 1/8. Pooled
        averaging gives every selected cell weight 1/6. Fixed-cap averaging gives every selected
        cell weight 1/8. These coefficients multiply gradients as well as displayed losses.
        Appending masked padding changes none of the selected sums or lengths.
      </Prose>
      <Prose>
        Original-style GRPO combines group-standardized advantages, token clipping and per-response
        averaging. A pooled reduction is one part of DAPO, whose full recipe also changes clipping
        and sampling choices. A fixed-cap reduction is one part of Dr.GRPO, whose analysis also
        removes group standard-deviation scaling. Selecting a similarly named loss reduction in TRL
        does not reproduce a whole paper's procedure. Next we add the reference term, whose sampling
        and differentiation require equal care.
      </Prose>

      <Exercise
        title="8. Follow all three ratios."
        hint={
          <Prose>
            Multiply ratios for the sequence value, and take its cube root for the geometric mean.
            Apply the minimum after multiplying by the advantage.
          </Prose>
        }
        solution={
          <Prose>
            The token ratios are (1.4, 0.7, 1.1); the full sequence ratio is 1.078 and the geometric
            ratio is the cube root of 1.078. With ε = 0.2 and A = 1, token surrogates are (1.2, 0.7,
            1.1): only the first is on its upper plateau. With A = −1 they are (−1.4, −0.8, −1.1):
            only the second is on its lower plateau. The sequence ratio is inside the interval.
            Replacing the token ratios by it changes the loss and gradient structure.
          </Prose>
        }
      >
        Use token ratios (1.4, 0.7, 1.1) and ε = 0.2. Compute token, sequence and geometric values
        and both signed clipped surrogates.
      </Exercise>
      <Exercise
        title="9. Change the reduction weights."
        hint={
          <Prose>There are two responses and four selected cells, but their lengths differ.</Prose>
        }
        solution={
          <Prose>
            For losses (4) and (1, 1, 1), the response mean is (4+1)/2 = 2.5, with cell derivatives
            (1/2; 1/6, 1/6, 1/6). The pooled mean is 7/4 = 1.75 with derivative 1/4 for each
            selected cell. With fixed cap 3, the reduction is 7/6 and each selected derivative is
            1/6. Append two masked storage cells: each result and every original derivative stays
            the same, while the added cells have zero derivatives.
          </Prose>
        }
      >
        Implement response, pooled-token and fixed-cap reductions for lengths 1 and 3 with losses
        (4) and (1, 1, 1). Check gradients after appending padding.
      </Exercise>

      <H2>9. A reference penalty has a sampling distribution and a gradient path</H2>
      <SampledKL />
      <Prose>
        Let the current three-answer policy be p = (0.2, 0.3, 0.5) and the reference be q = (0.4,
        0.4, 0.2). For answer A, log(p/q) = log(1/2), a negative number. The probability-weighted
        sum over all answers is nevertheless nonnegative: that sum is KL(p || q). A signed sampled
        log ratio is not a nonnegative KL value on every draw. The alternative per-draw expression
        in the next column is nonnegative.
      </Prose>
      <MathBlock>{String.raw`k_3(y)=\frac{q_y}{p_y}-\log\frac{q_y}{p_y}-1,\qquad
        \mathbb E_{y\sim p}[k_3(y)]=\sum_y p_y\log\frac{p_y}{q_y}=\operatorname{KL}(p\Vert q).`}</MathBlock>
      <Prose>
        For positive v, the inequality v − log v − 1 ≥ 0 proves each k₃ term is nonnegative. Under
        current-policy sampling, the expectation of q/p is the sum of q, which is 1, and cancels the
        final −1. If the weighting distribution is an older policy, that cancellation generally
        fails. For token scores, the statement applies conditionally at each fixed prefix; an old
        policy can also change which prefixes are visited.
      </Prose>
      <RegularizationPaths />
      <Prose>
        Follow the two implementations separately. In our original-style GRPO route, current token
        log probabilities feed a differentiable k₃ term added to the loss. Reference scores remain
        fixed. In the current RLOO route, the sampled old/reference sequence log ratio first
        subtracts a penalty from the reward; leave-one-out then centers those shaped rewards. These
        detached scalar advantages multiply the current sequence-ratio surrogate. Moving a number
        between reward and loss without tracing its derivative can change the update.
      </Prose>
      <MathBlock>{String.raw`L_{\mathrm{GRPO}}=\frac1G\sum_i\frac1{L_i}\sum_t m_{i,t}
        [-S(\rho_{i,t},A_i)+\beta k_{3,i,t}],\qquad
        \widetilde r_i=r_i-\beta\sum_t m_{i,t}(\ell_{\mathrm{old},i,t}-\ell_{\mathrm{ref},i,t}).`}</MathBlock>
      <Prose>
        These are the declared teaching configurations. Current TRL 1.14.2 also offers a
        bias-correction switch that multiplies the GRPO k₃ term by the differentiable current/old
        ratio. Its default is true. Our original-style demonstration explicitly sets{' '}
        <code>use_bias_correction_kl=False</code>, and checks the optional true branch separately.
        Coefficient value one does not mean that coefficient has derivative zero.
      </Prose>
      <Prose>
        <strong>Deeper derivative.</strong> Let a current selected log probability be l, reference
        log probability be h, and old log probability be o. With those latter quantities fixed, v =
        exp(h−l), k₃ = v − (h−l) − 1 and dk₃/dl = 1−v. The optional weighted branch is exp(l−o)k₃.
        Product differentiation adds a k₃ term:
      </Prose>
      <MathBlock>{String.raw`\frac{d}{dl}\,[e^{l-o}k_3]
        =e^{l-o}[k_3+1-e^{h-l}].`}</MathBlock>
      <Prose>
        Even when l = o, that extra term remains if current and reference differ. A useful parity
        fixture must therefore include old = current ≠ reference and old ≠ current, not only
        equality of all three policies. Neither per-token weighting nor a k₃ value identity alone
        corrects a different distribution of prefix states. Adding a wholly detached penalty to a
        loss is another distinct operation: it changes the displayed loss value but supplies no
        penalty gradient.
      </Prose>

      <Exercise
        title="10. Separate signed samples from expected KL."
        hint={
          <Prose>
            Choose two unequal distributions and examine the event whose current probability is
            lower than reference.
          </Prose>
        }
        solution={
          <Prose>
            Let p = (0.25, 0.75) and q = (0.5, 0.5). The first signed log ratio is log(1/2),
            negative. Exact KL is 0.25 log(1/2) + 0.75 log(3/2), positive (about 0.130812).
            Weighting k₃ by current p gives that KL because the q/p expectation is 1. Weighting by
            an unrelated old distribution does not supply that cancellation; value nonnegativity
            remains but the expectation generally differs.
          </Prose>
        }
      >
        Construct a negative sampled log ratio with positive expected KL. Explain which weighting
        makes the k₃ value identity hold.
      </Exercise>
      <Exercise
        title="11. Repair a missing gradient path."
        hint={
          <Prose>Detach the reference and old scores, not the current score in the penalty.</Prose>
        }
        solution={
          <Prose>
            For current log score l and fixed reference h, compute v = exp(h−l) and penalty v −
            (h−l) − 1 while retaining l's graph. Its derivative is 1−exp(h−l), nonzero when l ≠ h. A
            test with h−l = log 2 gives derivative −1. If the entire penalty is detached, its
            derivative contribution is zero. Reference gradients must remain absent. For the
            optional weighted branch also differentiate exp(l−o); the extra product term is
            required.
          </Prose>
        }
      >
        A loss adds a detached numerical KL penalty and claims to regularize the policy. Repair it
        and give a nonzero-gradient test.
      </Exercise>

      <Anchor id="4-from-scratch-implementation" />
      <H2>10. Implement the complete grouped update</H2>
      <OnlineLoop />
      <Prose>
        Start with a prompt and draw four responses from the current rollout snapshot. Retain token
        IDs, actual stopping positions and sampled log probabilities. The reward function reads the
        complete response. Fixed old and reference scores are measured on those same tokens; current
        scores retain a gradient. Group statistics supply detached advantages, and the selected loss
        then flows backward through the causal model. Save the resulting weights and verify their
        reload.
      </Prose>
      <Prose>
        The scratch implementation delegates the decoder architecture and automatic differentiation
        to Transformers and PyTorch. It explicitly implements sampling, masks, rewards, baselines,
        ratios, reductions and updates. Sampling uses temperature 1 over the full model vocabulary
        without top-k or nucleus filtering. A generated EOS stops that response; reaching the
        eight-token cap does not manufacture a final EOS. IDs outside the tokenizer's mapped
        vocabulary are retained and marked invalid.
      </Prose>
      <Program file="group_losses.py" title="Selected causal scores and explicit grouped losses" />
      <Prose>
        <code>response_logps</code> shifts logits and targets exactly once and returns an explicit
        positional mask. <code>group_advantages</code> groups consecutive rewards from the same
        prompt and returns valid counts. <code>reduce_token_loss</code> makes every denominator
        visible. <code>grpo_loss</code> differentiates the declared KL branch;{' '}
        <code>rloo_reward</code> shapes fixed rewards before the sequence surrogate. Run{' '}
        <code>python group_losses.py --output losses.json</code> to inspect a constructed
        unequal-length tensor example with nonzero derivatives. Those numbers are separate from the
        observed poem generations.
      </Prose>
      <Program
        file="online_preferences.py"
        title="Full scratch sampling, grouped update and persistence"
      />
      <Prose>
        The sampler appends tokens to each row's actual length and reads the preceding valid logit.
        Stopped rows no longer acquire selected actions. The subsequent teacher-forced scoring check
        compares the sampled log probabilities with the same selected tokens. This catches an
        off-by-one or EOS/PAD masking error before optimization. The fixed reference is a
        no-gradient copy. Both current updates and exact saved-model reload are visible in the
        report; the reference itself is never optimized.
      </Prose>
      <Prose>
        With a local SFT response-17 checkpoint, run{' '}
        <code>
          python online_preferences.py --model response-17/selected --data data --method grpo
          --output my-grpo
        </code>
        . Replacing the method argument with <code>rloo</code> chooses its explicit raw
        leave-one-out sequence objective. Each command starts a new two-update demonstration. The
        guarded study driver later ties these operations to exact files and a fixed protocol.
        Removing a critic does not remove the cost of G response generations, their reward
        evaluations, reference scoring or the current model's activations.
      </Prose>
      <NativeConfigurations />
      <Prose>
        Our pinned ordinary route uses TRL 1.14.2, Transformers 5.19.0 and Torch 2.14 on CPU.
        Explicitly selecting <code>loss_type='grpo'</code>, token importance, group scaling, β =
        0.01 and an unweighted KL branch differs from current GRPO defaults, including their
        DAPO-style reduction and β = 0. Both online configurations disable dropout, use actual batch
        size 4, group size 4, one rollout iteration, two SGD updates at 10⁻⁵ and no gradient
        clipping or decay. The RLOO configuration disables advantage normalization and uses its
        whole-sequence ratio. These are small teaching settings, not a reproduction of a large
        published training run.
      </Prose>
      <Anchor id="5-production-implementation" />
      <Program
        file="trl_group_training.py"
        title="Ordinary GRPOTrainer and RLOOTrainer with exact batch inspection"
      />
      <Prose>
        The subclasses observe the actual trainer computation. Native generation and its optimizer
        remain native. For each loss, the comparison independently forwards the backbone and
        constructs the scratch objective, then checks every trainable parameter's derivative. A
        shadow SGD step checks the update without modifying the real trainer weights. Selected
        response scores are compared using the mask: the native scorer zero-fills ignored padding
        cells, while the raw backbone can leave finite values there. Those unused representations
        need not agree; their contribution to loss and gradient must be zero. Constructed
        unequal-length batches expose nonzero clipping and both KL branches even when actual sampled
        reward groups tie.
      </Prose>

      <Exercise
        title="16. Audit an original-GRPO claim."
        hint={
          <Prose>
            Read the resolved reduction, reference coefficient, importance axis, group scaling and
            KL correction fields.
          </Prose>
        }
        solution={
          <Prose>
            Current defaults can select DAPO-style token pooling and β = 0, removing the separate
            reference penalty. Sequence importance can use a geometric mean rather than original
            token ratios. The default bias-correction KL switch also adds a differentiable ratio
            factor when β is nonzero. State the actual variant or explicitly select response-mean
            grpo, token importance, the intended group spread, nonzero declared beta and the chosen
            KL branch. Those fields alone still do not reproduce a paper's model, data, reward,
            sampling or reference-refresh schedule.
          </Prose>
        }
      >
        A trainer uses defaults and claims to reproduce original GRPO. Identify the configuration
        and experimental assumptions you must inspect.
      </Exercise>

      <H2>11. A binary label is a new kind of evidence</H2>
      <PairAndBinaryLabels />
      <Prose>
        A comparison says one response is preferred to another for a prompt. It does not say the
        winner is good in an absolute sense. If two answers are both poor, their ordering can still
        be clear. Raise or lower the quality threshold in the drawing: the pair's ordering stays the
        same while the individual acceptable/unacceptable labels change. The illustrative quality
        values explain this distinction; they are not measured human scores.
      </Prose>
      <Prose>
        KTO, Kahneman–Tversky Optimization, consumes individual responses with desirable or
        undesirable labels. A Boolean label does not require another response in the same record.
        Converting a comparison into a desirable winner and undesirable loser is a modelling
        assumption, not lossless format conversion. For our poem task we declare the exact
        criterion: a candidate sentiment label is desirable when it equals the retained dataset
        annotation. Each prompt therefore supplies one desirable and two undesirable candidates. A
        different application needs its own meaningful criterion.
      </Prose>

      <Exercise
        title="12. Give a Boolean label an actual meaning."
        hint={
          <Prose>
            Relative preference identifies an ordering. Supply a separate acceptance rule before
            making individual labels.
          </Prose>
        }
        solution={
          <Prose>
            A winner can be the less harmful of two harmful answers, so declaring it desirable
            changes the evidence. For a structured extraction task, one explicit desirable criterion
            could require every requested field to match an adjudicated record and require no extra
            fields. Then evaluate each response against that criterion, retaining ambiguous or
            unscorable cases separately. This definition may reject both answers in a pair, and it
            requires the relevant ground-truth fields rather than merely the pair ordering.
          </Prose>
        }
      >
        Two harmful answers form a clear preference pair. Why is naive unpairing insufficient, and
        how would you define individual labels for another task?
      </Exercise>

      <H2>12. KTO measures utility around a reference point</H2>
      <KTOUtility />
      <Prose>
        First compare the policy's response likelihood with a frozen reference. Their
        log-probability difference d measures relative change, not absolute answer quality. Subtract
        a reference point k, then scale by positive β to get u. For a desirable record, increasing u
        decreases its loss. For an undesirable record, increasing u increases its loss. Separate
        positive weights determine each class's contribution. At d = k and equal weights, both
        labels have loss one half.
      </Prose>
      <MathBlock>{String.raw`d=\log\pi_\theta(y\mid x)-\log\pi_{\mathrm{ref}}(y\mid x),\qquad
        u=\beta(d-\operatorname{stopgrad}(k)),\qquad
        L_D=\lambda_D\sigma(-u),\quad L_U=\lambda_U\sigma(u).`}</MathBlock>
      <Prose>
        The sigmoid σ(u) = 1/(1+exp(−u)) approaches 1 as u grows and 0 as u shrinks. Both losses
        saturate. A desirable response with a very negative u has a high loss but a small
        derivative, so being confidently wrong does not guarantee a strong correcting update. Equal
        class weights give symmetric derivative magnitudes at opposite signed distances. The named
        utility model motivates the loss; it does not establish a trained model's psychological
        properties.
      </Prose>
      <ReferencePairing />
      <Prose>
        The theoretical reference point involves a current-policy KL expectation. The practical
        batch procedure uses a different object. Rotate completion strings among prompts within a
        microbatch, score these mismatched pairs under current and reference policies, average their
        log ratios and clamp the average below at zero. Here each prompt receives the preceding
        completion, wrapping the final completion into the first row: four records become (x₁, y₄),
        (x₂, y₁), (x₃, y₂), (x₄, y₃). The resulting scalar is detached. It is a practical reference
        estimate, not an unbiased observation of the theoretical current-policy KL.
      </Prose>
      <MathBlock>{String.raw`\widehat k=\operatorname{stopgrad}\!\left[
        \max\!\left(0,\frac1B\sum_{i=1}^{B}
        \log\frac{\pi_\theta(y_{i-1}\mid x_i)}{\pi_{\mathrm{ref}}(y_{i-1}\mid x_i)}\right)\right],`}</MathBlock>
      <Prose>
        Indices wrap around the microbatch. Changing its partition changes the pairings and can
        change k even if the set of original records is unchanged. A negative pre-clamp average
        produces k = 0; it is not evidence that the policy equals the reference. The actual
        sequential candidate ordering can also place several records from one prompt in a
        microbatch, so rotation does not guarantee a different prompt every time. Retain the actual
        prepared pairs rather than describing an idealized shuffle.
      </Prose>

      <Exercise
        title="13. Compute KTO terms at a changed distance."
        hint={
          <Prose>
            Compute u once; the two derivatives share βσ(u)(1−σ(u)) before class weights and signs.
          </Prose>
        }
        solution={
          <Prose>
            u = 0.4(0.7−0.1) = 0.24. The desirable loss is 2σ(−0.24), about 0.880573; its derivative
            is −0.8σ(0.24)(1−σ(0.24)). The undesirable loss is σ(0.24), about 0.559714; its
            derivative is +0.4σ(0.24)(1−σ(0.24)). Setting both weights to one restores equal
            derivative magnitude at matched signed distance. Sending a desirable record's u far
            negative drives its loss toward its weight while its gradient approaches zero.
          </Prose>
        }
      >
        Use d = 0.7, k = 0.1, β = 0.4 and weights 2/1. Compute both losses and derivatives; then
        diagnose confidently wrong saturation.
      </Exercise>

      <H2>13. Class balance and a detached reference change the gradient</H2>
      <WeightedClasses />
      <Prose>
        Suppose one desirable and three undesirable records have equal unweighted loss. With weights
        1 and 1, the undesirable class contributes three times as much to the batch sum. Doubling
        the desirable weight changes that total ratio to 2:3. KTO's implemented reduction averages
        weighted terms over the total number of examples; it does not divide by the sum of weights
        or average the two class means separately.
      </Prose>
      <MathBlock>{String.raw`L=\frac1N\left(\sum_{i\in D}\lambda_D\sigma(-u_i)
        +\sum_{i\in U}\lambda_U\sigma(u_i)\right),\qquad
        \frac{\text{matched desirable contribution}}{\text{matched undesirable contribution}}
        =\frac{n_D\lambda_D}{n_U\lambda_U}.`}</MathBlock>
      <Prose>
        The contribution ratio assumes matched per-record utility values; unequal distances also
        change each term. If a desired weighted-frequency ratio lies between a and b, solve a ≤ n_D
        λ_D/(n_U λ_U) ≤ b for the class weight rather than quoting a universal number. Class
        frequency is one consideration, alongside label quality and the behavior to learn. A class
        weight alone does not prove resistance to noisy labels.
      </Prose>
      <DetachedReference />
      <Prose>
        The labelled response path carries gradients through d. The mismatch branch computes k and
        stops its derivative before subtraction. If that stop is removed, the gradient acquires a
        term through the mismatch examples and changes the objective's update. A finite-difference
        check of the intended convention must hold k fixed. Recomputing k at every perturbation
        tests a different derivative.
      </Prose>
      <MathBlock>{String.raw`\frac{\partial L_D}{\partial d}=-\lambda_D\beta\sigma(u)[1-\sigma(u)],\qquad
        \frac{\partial L_U}{\partial d}=\lambda_U\beta\sigma(u)[1-\sigma(u)].`}</MathBlock>
      <Prose>
        These signs push a desirable response's log ratio upward and an undesirable one's downward
        under gradient descent. The shared model can change other responses at the same time. Large
        absolute u shrinks σ(u)(1−σ(u)) in both directions. Inspect the high-loss, low-gradient end
        of the desirable curve to diagnose saturation without mistaking a bounded loss for a
        guarantee of easy optimization.
      </Prose>
      <Program
        file="kto_loss.py"
        title="Explicit KTO utility, detached reference and score-coordinate update"
      />
      <Prose>
        This program uses <code>sigmoid(-sign * u)</code>, avoiding subtraction from one near
        saturation. The reference scores and practical reference point are detached, while labelled
        policy scores remain differentiable. Its four-score SGD example is a constructed coordinate
        update, not a fitted language model. Run{' '}
        <code>python kto_loss.py --output utility.json</code> to inspect every weighted term,
        derivative and updated score before moving to the ordinary trainer.
      </Prose>

      <Exercise
        title="15. Derive a weight interval."
        hint={
          <Prose>
            For matched per-example contributions, compare frequency times weight before applying
            the common total-example denominator.
          </Prose>
        }
        solution={
          <Prose>
            With one desirable record for five undesirable records and λ_U = 1, the
            weighted-frequency ratio is λ_D/5. Requiring it in [1, 1.5] gives λ_D in [5, 7.5]. The
            loss still divides the weighted sum by six total examples, not by λ_D + 5. Unequal
            utility distances change the actual class contributions, and neither interval nor
            normalization proves any robustness to incorrect labels.
          </Prose>
        }
      >
        For a 1:5 class-count ratio, choose desirable weights that put matched weighted
        contributions between 1 and 1.5, fixing the undesirable weight at one.
      </Exercise>

      <H2>14. Implement KTO and use its ordinary trainer</H2>
      <KTOBatch />
      <Prose>
        Each raw record contains a prompt, one completion and a Boolean label. The actual trainer
        prepares both the labelled completion and its rotated KL completion, with causal target
        masks and genuine EOS. Current and reference forward passes produce sequence log-probability
        sums; the utility loss consumes their differences. The practical reference branch is
        no-gradient, while the labelled current branch is differentiated. A batch must contain more
        than one record for the intended mismatch operation. Accumulating several one-record
        microbatches does not create other completions inside any one microbatch.
      </Prose>
      <Program
        file="trl_kto.py"
        title="Ordinary KTOTrainer, actual prepared pairs and full-gradient parity"
      />
      <Prose>
        The selected native configuration has 48 records from 16 fixed training prompts, actual
        microbatch size 4, sequential preparation, β = 0.1, desirable weight 2 and undesirable
        weight 1. It retains actual prepared rows and checks their rotated token sequences before
        training. Its nonzero reference fixtures include matched reference, positive reference,
        all-desirable and all-undesirable batches. A missing class is allowed; an empty batch is a
        different invalid input.
      </Prose>
      <Prose>
        The scratch KTO loss and native loss are compared on the same actual prepared tokens and
        through every trainable model parameter. A shadow SGD step isolates numerical update
        agreement. Two real native updates then run from the same initial SFT model used for the
        online routes. They consume different evidence, so these routes are not a controlled
        performance ranking of three algorithms. We can still inspect their own masks, gradients,
        saved weights and fixed evaluation outputs.
      </Prose>
      <Exercise
        title="14. Form the actual mismatch batch."
        hint={
          <Prose>
            Wrap the final completion to the first prompt, then average all four observed log ratios
            before clamping.
          </Prose>
        }
        solution={
          <Prose>
            For records (x₁,y₁) through (x₄,y₄), the previous-completion rotation pairs (x₁, y₄),
            (x₂, y₁), (x₃, y₂), (x₄, y₃). Ratios in log units (−0.8, 0.2, 0.1, −0.3) have mean −0.2,
            so the practical reference is detached zero. That does not show equal distributions. A
            one-record microbatch rotates its completion back to itself; accumulating gradients from
            several such batches does not retroactively create these four mismatches.
          </Prose>
        }
      >
        Construct a four-record cyclic mismatch and use log-ratio values (−0.8, 0.2, 0.1, −0.3).
        What reference point results, and why is gradient accumulation not a substitute for the
        actual batch?
      </Exercise>

      <Anchor id="6-visual-walkthrough" />
      <H2>15. Measure the estimators on actual model probabilities</H2>
      <MeasuredCandidates />
      <Prose>
        The first fixed evaluation verse is “my canoe to make more steady,” with the retained
        dataset label “no impact”. The selected SFT model scores all three complete candidate
        labels, including EOS. In order negative, no impact, positive, their sequence log
        probabilities are approximately −6.201137, −2.871139 and −0.064857. Exponentiating and
        renormalizing those three sequence probabilities gives approximately (0.002036, 0.056870,
        0.941095).
      </Prose>
      <Prose>
        This new three-action policy is conditional on the response being one of the three
        enumerated candidates. Other possible response strings are outside that action space. Its
        0.056870 probability on the annotated label is not the full model's probability of being
        correct under every possible generation and parser outcome. Restriction makes exact
        enumeration possible; the separate free-generation evaluation measures the unrestricted
        decoder's behavior under its declared stopping rule.
      </Prose>
      <MathBlock>{String.raw`p_j^{\mathrm{restricted}}=\frac{\exp\ell_j}{\sum_{k=1}^{3}\exp\ell_k},\qquad
        r_j=\mathbf1[\text{candidate}_j=\text{retained label}],\qquad
        g_j=p_j^{\mathrm{restricted}}(r_j-J).`}</MathBlock>
      <MeasuredEstimators />
      <Prose>
        The exact restricted-policy target for that first verse is approximately (−0.000116,
        0.053635, −0.053520). With G = 2, raw self-centering produces half that expected vector.
        Corrected self-centering and leave-one-out reproduce the target. At G = 4, raw
        self-centering produces three quarters. The standardized estimator's no-impact coordinate is
        about 0.037921 at G = 2 and 0.079281 at G = 4; neither is the raw target 0.053635. Group
        size changes its reward-dependent normalization.
      </Prose>
      <Prose>
        Leave-one-out is not uniformly the minimum-variance choice. On this first verse, G = 2 gives
        covariance trace about 0.047894 for LOO, compared with 0.011017 for the fixed baseline 0.5.
        Both have the correct expectation. The recorded explorer retains all 32 fixed verses, both
        group sizes, six methods and four reward budgets, so the example is inspectable alongside
        every other outcome. Choosing a displayed row reads saved measurements; it does not rerun a
        model or change those measurements.
      </Prose>
      <Program
        file="sft_data.py"
        title="Exact SFT data serialization and positional response masks"
      />
      <Prose>
        This is the unchanged SFT data helper. It owns the literal sentiment prompt, retained-label
        mapping, true EOS and response-target span. The same source TSVs and serialization make the
        model lineage explicit. Reusing this helper avoids changing the tokenization while claiming
        that only a preference method changed.
      </Prose>
      <Program
        file="sft_evaluate.py"
        title="Exact SFT response likelihood, strict generation and candidate evaluation"
      />
      <Prose>
        This unchanged helper keeps three measurements separate: pooled response-target negative
        log-likelihood (NLL), strict free-generation label accuracy and the highest-scoring
        enumerated candidate. A valid label and an EOS stop are separate observations. Unmapped
        model vocabulary IDs are retained as invalid outputs. The official test verses have already
        appeared in the SFT lesson; these are fixed evaluation examples rather than a newly secret
        benchmark.
      </Prose>
      <Program
        file="group_study.py"
        title="Prospective source guard and once-only six-stage study"
      />
      <Prose>
        Preparation records the exact program, model, tokenizer, data and native-source hashes;
        software versions; fixed source IDs; candidate token spans; and resolved trainer
        configurations. Execution checks these identities before each stage. A completed stage is
        reused only with its matching protocol and report; a partial stage stops. After a source
        correction, successful earlier science remains bound to the source that actually ran, rather
        than being relabelled as a new execution. The README separates reproduction of that exact
        SFT checkpoint from a new experiment using a different local checkpoint.
      </Prose>
      <RecordedUpdates />
      <Prose>
        In the two scratch routes, the first sampled reward group was (1, 0, 0, 1) and the second
        was (0, 0, 0, 0). Both methods started at pooled response NLL 0.351335 on 84 selected
        targets from 32 verses. After two updates, the GRPO route reached 0.350412 and the RLOO
        route 0.349362. Each still produced 20 correct greedy labels out of 32, with all 32 outputs
        valid and EOS-stopped. A changed probability can change NLL without crossing an argmax
        boundary.
      </Prose>
      <Prose>
        Their parameter-change L2 norms were about 0.000329 and 0.000635 respectively; both
        saved-model reloads matched exactly. These are observed interface demonstrations with
        different loss constructions, two steps and one fixed seed. Their small NLL changes do not
        establish convergence or a method ranking. The real-batch records, constructed derivative
        checks and evaluation outputs answer different questions and remain separately inspectable.
      </Prose>
      <Prose>
        The native GRPO and RLOO runs each observed rewards (1, 1, 1, 1), then (1, 1, 0, 1). The
        first group produced zero reward advantages; the initial current and reference policies also
        agreed, so that particular update had zero gradient. The second group supplied a contrast.
        Its mean surrogate loss was nearly zero even though its gradient was nonzero: averaging
        centered advantages can cancel loss values without cancelling their differently directed
        derivatives.
      </Prose>
      <LessonTable
        caption="Fixed 32-verse evaluation after exactly two updates"
        headers={['Route', 'Response NLL', 'Correct greedy labels', 'Parameter-change L2']}
        rows={[
          ['Initial checkpoint', '0.351335', '20 / 32', '0'],
          ['Scratch GRPO', '0.350412', '20 / 32', '0.000329'],
          ['Scratch RLOO', '0.349362', '20 / 32', '0.000635'],
          ['Native GRPO', '0.352804', '20 / 32', '0.000300'],
          ['Native RLOO', '0.354186', '20 / 32', '0.000573'],
          ['Native KTO', '0.351431', '20 / 32', '0.0000264'],
        ]}
      />
      <Prose>
        All five final models emitted valid, EOS-stopped labels for all 32 verses, and all five
        selected the same candidate labels as before. Their unchanged confusion matrix, with gold
        rows and prediction columns ordered negative, no impact, positive, is ((5, 2, 0), (1, 13,
        6), (0, 3, 2)); the invalid column is zero. Each save/reload check matched exactly. These
        overlapping demonstrations use different sampling seeds and, for KTO, a different data
        object. The table cannot rank algorithms or establish generalization beyond these inspected
        records.
      </Prose>
      <Prose>
        Native KTO retained all 48 prepared records. Its first actual batch had labels (undesirable,
        undesirable, desirable, undesirable), giving weighted terms (0.5, 0.5, 1, 0.5) at the
        initial policy and mean loss 0.625. The second actual batch loss was about 0.750028. Both
        practical reference points clamped to zero; neither fact implies that the second current
        policy equalled the reference. The prepared record file exposes the exact
        previous-completion rotation.
      </Prose>
      <Prose>
        Numerical parity also has a declared domain. The native selected-score function stores zero
        at ignored padding cells, while direct scoring can store a finite log probability there.
        Compare selected cells, losses and gradients, rather than requiring those unused
        representations to match. Constructed nonzero GRPO/RLOO checks use float64 to separate the
        formulas from float32 cancellation; the code restores every initial parameter exactly to
        float32 before training. Across those online constructed cases, the largest gradient
        difference was below 3 × 10⁻¹². Actual training-batch parity stays in float32: maximum
        differences were below 5 × 10⁻⁷ for the online routes and zero for KTO. Earlier failing
        checks and their corrections remain in the downloadable provenance; they are not counted as
        successful scientific updates.
      </Prose>
      <Program
        file="group_checks.py"
        title="Independent finite and tensor checks for the implemented mechanisms"
      />
      <Prose>
        The checks compare exact enumeration with analytic gradients, finite differences with
        autograd, masking with selected positions, and reduction weights with changed lengths. They
        include missing rewards and class-empty KTO batches. Their constructed results establish
        those mechanisms under the tested conventions; the saved scientific observations establish
        what happened in the separate model runs.
      </Prose>

      <Anchor id="7-decision-matrix" />
      <Anchor id="8-what-scales-and-what-doesn-t" />
      <Anchor id="8-what-scales-and-what-doesnt" />
      <Anchor id="9-failure-modes-and-gotchas" />
      <H2>16. Choose by data, estimator and cost</H2>
      <MethodObjects />
      <Prose>
        Begin with the evidence available. A callable reward and the ability to generate several
        responses support an online group estimator. Individual labelled responses support KTO when
        their desirable/undesirable meaning is defensible. Paired records support DPO or SimPO under
        their own assumptions. These are possible routes, not mutually exclusive laws. Ask how
        rewards are obtained, how often groups contain a useful contrast, which reference
        computations are required and what the labels mean.
      </Prose>
      <Prose>
        If every generated answer has the same measured reward, inspect the reward's resolution and
        actual outputs before concluding the task is solved. If rewards are missing selectively, a
        zero-advantage fallback does not repair the observation bias. If ratios drift during reuse,
        revisit old-policy lifetime and support. If KTO has high loss and tiny gradients, inspect
        saturation and the practical reference point. Each diagnosis refers to a concrete object
        drawn earlier, rather than an invented numerical score for which method is “best”.
      </Prose>
      <ReportPolicy />
      <Prose>
        A policy need not sample language tokens. Suppose it samples one of two probability reports:
        A reports (0.8, 0.2) and B reports (0.4, 0.6). The policy chooses them with probabilities
        (0.25, 0.75). If the observed outcome is the first category, a log-score reward is log 0.8
        for A and log 0.4 for B. The sampled objects are reports, not category labels. Their reward
        difference is log 2, so the exact gradient with respect to the two policy logits is (3 log
        2/16, −3 log 2/16), approximately (0.129965, −0.129965).
      </Prose>
      <Prose>
        Leave-one-out can estimate that report-selection gradient under its sampling assumptions.
        Directly differentiating a report's log score is another route: it changes the probabilities
        inside a report rather than only the chance of selecting a fixed report. A proper scoring
        reward alone does not make a standardized or clipped finite policy estimator a direct
        proper-score optimizer, nor guarantee calibrated outputs.{' '}
        <a href="/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models">
          Typed Decision Models
        </a>{' '}
        develops that application with a continuous policy over reports, proper scores, calibration
        and a measured decision system.
      </Prose>
      <Exercise
        title="17. Sample reports rather than classes."
        hint={
          <Prose>
            The reward difference is log(0.7/0.2), and the two-action logit gradient has factor
            p₁p₂.
          </Prose>
        }
        solution={
          <Prose>
            The two report rewards are log 0.7 and log 0.2 for the first observed category. With
            policy probabilities (0.6, 0.4), the exact selection-logit gradient is (0.24 log 3.5,
            −0.24 log 3.5). Direct differentiation of the expected reward with respect to those
            policy logits agrees. Differentiating the report probabilities themselves instead
            changes the reports, introducing a different parameter path. Applying a random group
            normalization to a score-function estimate does not preserve the direct proper-score
            target automatically.
          </Prose>
        }
      >
        A policy chooses reports (0.7, 0.3) and (0.2, 0.8) with probabilities (0.6, 0.4). The
        observed category is first. Compute the exact policy gradient and identify the direct-report
        alternative.
      </Exercise>

      <Anchor id="11-self-check-exercises" />
      <H2>17. Practice and a bounded capstone</H2>
      <Prose>
        The changed-example tasks beside each mechanism test the assumptions, intermediate
        calculations and implementation boundaries. Revisit the response-mask task in section 2,
        baseline tasks in sections 4–6, loss tasks in sections 8–10, KTO tasks in sections 11–14 and
        report-policy task in section 16. The accompanying answer program checks the numerical and
        tensor cases without fitting another model.
      </Prose>
      <Exercise
        title="18. Prespecify a falsifiable extension."
        hint={
          <Prose>
            Separate a reward's usefulness from format compliance. Fix selection and evaluation
            before reading the new outcomes.
          </Prose>
        }
        solution={
          <Prose>
            One bounded extension fixes the same initial checkpoint and first 16 training IDs, then
            changes reward to 0.25 for any strictly valid sentiment label plus 0.75 for matching the
            retained annotation. Keep the same sampling and two-step budget, a new predeclared seed
            and separate fresh output directory. Freeze all files/configurations first; do not
            select between seeds afterward. Record valid-label rate, correctness, reward
            distributions, mixed-group fraction and fixed evaluation NLL/accuracy. A rise in
            validity with no improvement in correctness would reject a claim that this small
            experiment demonstrates better sentiment decisions. Low mixed-group frequency or
            unchanged weights explains limited training signal without justifying extra unplanned
            runs. Existing test exposure remains disclosed. This is a prospective extension, not an
            executed result.
          </Prose>
        }
      >
        Design a bounded alternative reward experiment using retained training data. Specify roles,
        budget, diagnostics and an outcome that would contradict your usefulness claim.
      </Exercise>

      <Program
        file="practice_answers.py"
        title="Complete changed-example answers and capstone diagnostics"
      />
      <Prose>
        Run <code>python practice_answers.py --output practice-answers.json</code> from the
        extracted archive. The program enumerates the changed variance counterexample, computes
        reduction gradients before and after padding, checks the retained KL derivative and solves
        the changed KTO and report-policy calculations. Its linear-time masked LOO function returns
        both an observation mask and valid count. The capstone helper only summarizes supplied
        records; its example is explicitly constructed and launches no training run. Pair the
        computed answers with each nearby worked explanation.
      </Prose>

      <H2>18. Keep the implementation and its evidence together</H2>
      <Prose>
        Download the{' '}
        <a href={root + 'grpo-rloo-kto.zip'} download>
          complete runnable archive
        </a>{' '}
        and start with its <a href={root + 'README.md'}>README</a>. The{' '}
        <a href={root + 'requirements.txt'}>pinned requirements</a> describe the observed stack;{' '}
        <a href={root + 'provenance.json'}>provenance</a> connects source, original successful
        stages and bounded native continuations. Saved data and output JSON make it possible to
        inspect a claim without fitting another model. Adapted model weights are not bundled: the
        README links the exact SFT lineage and a separate base-model route.
      </Prose>
      <LessonTable
        caption="Program index: choose the object you want to inspect"
        headers={['Full file', 'Use it for']}
        rows={[
          [
            <a href={root + 'group_estimators.py'} download>
              group_estimators.py
            </a>,
            'Exact finite distributions, covariance, bias and reward budgets',
          ],
          [
            <a href={root + 'group_losses.py'} download>
              group_losses.py
            </a>,
            'Causal scores, grouped advantages, clipping and reductions',
          ],
          [
            <a href={root + 'kto_loss.py'} download>
              kto_loss.py
            </a>,
            'Weighted binary utility and detached practical reference',
          ],
          [
            <a href={root + 'online_preferences.py'} download>
              online_preferences.py
            </a>,
            'Complete scratch sampling, updates, evaluation and persistence',
          ],
          [
            <a href={root + 'trl_group_training.py'} download>
              trl_group_training.py
            </a>,
            'Ordinary native GRPO/RLOO, exact batches and numerical comparisons',
          ],
          [
            <a href={root + 'trl_kto.py'} download>
              trl_kto.py
            </a>,
            'Ordinary native KTO and its actual prepared records',
          ],
          [
            <a href={root + 'group_study.py'} download>
              group_study.py
            </a>,
            'Prospective identities and guarded six-stage execution',
          ],
          [
            <a href={root + 'group_checks.py'} download>
              group_checks.py
            </a>,
            'Finite and tensor mechanism checks',
          ],
          [
            <a href={root + 'practice_answers.py'} download>
              practice_answers.py
            </a>,
            'Changed numerical answers and a no-fit capstone diagnostic',
          ],
          [
            <a href={root + 'sft_data.py'} download>
              sft_data.py
            </a>,
            'Exact reused data serialization and selected positions',
          ],
          [
            <a href={root + 'sft_evaluate.py'} download>
              sft_evaluate.py
            </a>,
            'Exact reused likelihood, strict generation and candidate decisions',
          ],
        ]}
      />
      <Prose>
        You are ready to extend these programs when you can identify the random object being
        sampled, state which baseline is independent of which draw, and trace every selected token
        through the actual loss reduction. For KTO, you should also be able to explain where each
        Boolean label came from and why the practical reference is detached. When an output
        surprises you, inspect that path before tuning a coefficient.
      </Prose>
      <Anchor id="10-primary-sources" />
      <Sources
        alternatives={
          <>
            <Prose>
              <a href="https://rlhfbook.com/c/06-policy-gradients">RLHF Book: Policy Gradients</a>{' '}
              develops score-function estimation and the surrounding policy-gradient family. Use it
              to revisit why a baseline can reduce variance without changing an expectation, then
              return to the finite-group dependence calculation here.
            </Prose>
            <Prose>
              <a href="https://raw.githubusercontent.com/stanford-cs336/spring2025-lectures/main/lecture_17.py">
                Stanford CS336, lecture 17
              </a>{' '}
              offers an executable teaching treatment of RL updates and implementation choices. Its
              deliberately simplified policy is useful for isolating the estimator; the
              causal-response programs here supply the token and masking route.
            </Prose>
            <Prose>
              <a href="https://huggingface.co/docs/trl/grpo_trainer">TRL GRPO guide</a>,{' '}
              <a href="https://huggingface.co/docs/trl/rloo_trainer">RLOO guide</a> and{' '}
              <a href="https://huggingface.co/docs/trl/kto_trainer">KTO guide</a> explain ordinary
              dataset and trainer APIs. Compare their current defaults with the explicitly pinned
              configuration here before interpreting a shared algorithm name.
            </Prose>
          </>
        }
      >
        <li>
          <a href="https://arxiv.org/html/2402.03300v3">DeepSeekMath, sections 4.1–4.2</a>{' '}
          introduces GRPO's group statistics, token ratios and critic-free recipe. It is the source
          for the original construction, not a claim that our two-step run reproduces it.
        </li>
        <li>
          <a href="https://arxiv.org/html/2402.14740v2">
            Back to Basics: Revisiting REINFORCE Style Optimization for Learning from Human Feedback
          </a>{' '}
          studies response-level RLOO and its computation tradeoffs. Its model/task experiments are
          separate from the exact finite variance comparisons in this lesson.
        </li>
        <li>
          <a href="https://arxiv.org/html/2402.01306v3">
            KTO: Model Alignment as Prospect Theoretic Optimization
          </a>{' '}
          defines the binary-label utility formulation and practical reference procedure. Read the
          assumptions behind labels and loss weighting together with the objective.
        </li>
        <li>
          <a href="https://arxiv.org/html/2503.14476v2">DAPO</a> and{' '}
          <a href="https://arxiv.org/html/2503.20783v2">
            Understanding R1-Zero-Like Training: A Critical Perspective
          </a>{' '}
          investigate group scaling, token weighting and related training choices. A reduction
          switch alone does not reproduce either paper's complete recipe.
        </li>
        <li>
          <a href="https://github.com/huggingface/trl/tree/v1.14.2/trl/trainer">
            TRL v1.14.2 trainer source
          </a>{' '}
          fixes the implementation studied here, including the optional KL correction,
          selected-score representation and KTO batch preparation.
        </li>
        <li>
          <a href="https://github.com/google-research-datasets/poem-sentiment">Poem Sentiment</a>{' '}
          supplies the annotated verses;{' '}
          <a href="https://arxiv.org/abs/2011.02686">Sheng and Uthus (2020)</a> describe its
          research setting. The labels are task annotations rather than universal judgments about a
          poem's effect on every reader.
        </li>
        <li>
          <a href="https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac">
            Pinned Pythia-14M checkpoint
          </a>{' '}
          supplies the pretrained causal decoder behind the reused response-only SFT lineage.
        </li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>Next: where the feedback comes from</H2>
        <Prose>
          We have traced how grouped numerical rewards and individual Boolean labels change a
          policy. The next lesson,{' '}
          <a href="/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models">
            Constitutional AI
          </a>
          , asks how explicit principles can guide critiques, revisions and preference judgments
          that supply that feedback. Later,{' '}
          <a href="/learn/path/full-curriculum/rl-for-reasoning-deepseek-r1-style?module=large-language-models">
            RL for Reasoning
          </a>{' '}
          studies verifier rewards and reasoning outcomes, including unsuccessful small-model
          transfer. Keep reward construction, gradient estimation and evaluation as separate
          questions when those applications become more elaborate.
        </Prose>
      </section>
    </div>
  ),
};

export default lesson;
