import { Prose, H2, H3, Code } from '../../../../src/learn/components/content';
import { MathBlock as SharedMathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {
  LessonIntro,
  LessonTable,
  Sources,
} from '../../../../src/learn/components/lesson-labs/LessonElements.jsx';
import {
  PairJudgment,
  TrainingStages,
  PairAnatomy,
  GroupSplit,
  ScalarHead,
  GapProbability,
  HeadGradient,
  ScoreGauge,
  ReferenceTerms,
  TiltedPolicy,
  ScoreFunction,
  BaselineVariance,
  TokenPath,
  TokenMasks,
  ModelRoles,
  TokenRewards,
  AdvantageTrace,
  TerminalCutoff,
  ValidNormalization,
  ClippedSurrogate,
  SharedParameter,
  RolloutTimeline,
  TrainingTrace,
  FrameworkParity,
  HeldoutPairs,
  MeasuredTraining,
  ProxyConflict,
  WorkLedger,
} from '../../../../src/learn/components/lesson-labs/RLHFFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';

const root = '/learn/examples/rlhf/';
const Program = ({ file, title }) => (
  <RemoteCodeBlock source={root + file} filename={file} title={title} />
);
const MathBlock = ({ children }) => (
  <div className="rlhf-math" role="region" tabIndex={0} aria-label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Anchor = ({ id }) => <span id={id} aria-hidden="true" />;
const Exercise = ({ title, children, hint, solution }) => (
  <div className="lesson-exercise flow-check" data-lesson-exercise>
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

const rlhf = {
  title: 'RLHF (Reinforcement Learning from Human Feedback)',
  readTime: '~90 min read + programs and practice',
  content: () => (
    <div className="lesson-flow rlhf-flow">
      <LessonIntro
        prerequisites="Causal Language Modeling supplied the causal decoder and shifted next-token targets. Basic probability, logs, vectors and gradient descent help. Response-only supervised fine-tuning, policy gradients, temporal credit and PPO are explained here before use."
        exampleKind="Python + preference learning and actual token PPO"
      >
        Follow one comparison all the way to a change in generated-token probabilities. The first
        pass is sections 1–3, the main derivations in 4–8, the complete run in 9 and its measured
        limits in 11. Sections 4–8 also give deeper mathematical branches. Section 10 connects the
        programs to current libraries; section 12 helps choose the next training question. Finish
        with changed practice, further learning, technical references and readiness.
      </LessonIntro>

      <Anchor id="1-why-it-exists" />
      <Anchor id="1-start-with-the-problem" />
      <H2>1. A judgment that changes generation</H2>
      <Prose>
        A language model can know that Paris is France's capital and still answer the request badly.
        Suppose the user asks, <em>Name France's capital in one word.</em> Compare A, <em>Paris</em>
        , with B, <em>Paris is the capital of France.</em> Both convey the same fact, but only A
        follows the one-word instruction. If the request asks for a complete sentence, B becomes the
        better fit. A rule saying “prefer shorter responses” would miss the reason for the first
        judgment.
      </Prose>
      <PairJudgment />
      <Prose>
        The response identities stay fixed while the criterion changes. The highlighted winner is a
        supplied judgment in this constructed example; it is not a probability produced by the
        model. A real annotation task needs a question, candidate answers, instructions for
        comparison and a way to represent ties or insufficient information. A person's choice is
        evidence about that task and person. It does not turn the answer into a factual oracle.
      </Prose>
      <Prose>
        Pretraining predicts tokens from text. Supervised fine-tuning, or SFT, increases the
        probability of demonstrated answers. A comparison adds a different kind of information:
        among two completed candidates for the same prompt, one is preferred. Reinforcement learning
        from human feedback, or RLHF, uses such feedback to guide a policy, the model's distribution
        over actions. For a language model, an action will be a generated token. A reward model
        learns a scalar score from comparisons; policy optimization then uses that score to change
        the generator. We first learn how a completed answer is scored; then we open the answer into
        its individual actions.
      </Prose>
      <TrainingStages />
      <Prose>
        Read the solid arrows as data and the dashed arrows as parameter updates. Demonstrations fit
        the initial policy. Comparisons fit a reward model that maps a prompt and completed response
        to a scalar score. Fresh responses from the policy are scored, and an optimization rule
        changes the policy toward better scores while controlling departure from a reference. These
        are distinct operations: editing a label does not directly edit an answer, and scoring an
        answer does not train the policy until a gradient update occurs.
      </Prose>
      <Prose>
        This three-stage route is the one developed here. SFT is a useful initialization, not a
        mathematical requirement of every preference-learning system. New comparisons and reward
        refits can be interleaved with later policy rounds. The{' '}
        <a href="https://arxiv.org/abs/2203.02155">InstructGPT study</a> is a primary example of
        demonstrations, ranked outputs and policy optimization; its large-model human evaluations
        are separate evidence from our small CPU programs.
      </Prose>

      <H2>2. Preserve the question in the data</H2>
      <Prose>
        A comparison is not just two strings. Write it as (x, yA, yB, q): x is the shared prompt or
        conversation, yA and yB are alternative continuations, and q is the supplied probability or
        fraction favoring A. A strict A-over-B label has q=1; a tie can use q=.5 if the annotation
        protocol treats it that way. “Cannot judge” is not automatically a tie. Keep that missing
        information distinct, and decide which records the training objective accepts.
      </Prose>
      <PairAnatomy />
      <Prose>
        The displayed pair is an unchanged record from Anthropic's released helpful-base
        comparisons. The conversation trunk is shared; only the final Assistant continuation
        branches. The program finds the last Assistant marker in each full string and requires the
        entire preceding context to agree. It excludes mismatches instead of inventing a common
        prompt. Its source row number and digest let you trace the pair back to the retained gzip.
        The original chosen label remains the original label even when our predictor disagrees.
      </Prose>
      <Prose>
        Splitting random rows can put repeated questions in both training and evaluation. A reward
        model may then look good by recognizing familiar material. Our fixed subset groups records
        by the first Human turn, after whitespace normalization and case folding, before splitting.
        This also keeps later conversation continuations of that initial question together. Exact
        full-prompt hashes are retained as a second overlap check. Different paraphrases can still
        cross the boundary; a hash split does not prove semantic novelty.
      </Prose>
      <GroupSplit />
      <Prose>
        Each block is a prompt family, and every comparison inside it moves with the family. The
        deterministic hash chooses a partition before any fit. The canonical study takes at most two
        pairs per selected family: 329 training pairs from 256 families and 163 held-out pairs from
        128 other families. Both family overlap and exact-prompt overlap are zero. The readable
        length bounds select a narrow subset: five to forty-five words in each response and at most
        sixty-five in the prompt. Those bounds are part of the study's scope, not a recommended
        universal data filter.
      </Prose>
      <Prose>
        The audit begins with 43,835 original rows. It finds 10,342 eligible rows after counting
        unequal prefixes, empty/equal responses and length exclusions. These counts precede model
        fitting. Neither the subset nor the held-out set was selected for easy wins. The full
        selection code and exact offline records are supplied:
      </Prose>
      <Program
        file="preference_records.py"
        title="Preserve exact comparison records and split prompt families"
      />
      <Prose>
        Run the program without arguments to audit the supplied records. With the original gzip and{' '}
        <Code>--source</Code>, it reproduces the selection and verifies the source hash first.{' '}
        <Code>extract</Code> preserves both original full strings and their exact suffixes;{' '}
        <Code>freeze</Code> chooses whole families; <Code>audit</Code> reconstructs every full
        string and checks overlap. Change the split seed in the source as an exercise, but keep that
        new exploratory split separate from the recorded canonical study.
      </Prose>

      <Anchor id="2-core-intuition" />
      <Anchor id="2-build-the-intuition" />
      <H2>3. Learn a score difference</H2>
      <Prose>
        A reward model reads both x and y and returns one real number r(x,y). Start with a
        transparent scalar head. Let the supplied response representations be hA=[1,0] and hB=[0,1],
        the shared weight vector w=[.4,−.2], and bias b=0. A score is the dot product w·h+b, so the
        two scores are .4 and −.2. A learned text encoder will later produce h; these two numbers
        are stipulated features so that we can see the head's exact work.
      </Prose>
      <ScalarHead />
      <Prose>
        Both branches use the same weights. Changing the first weight changes every response whose
        first feature is nonzero. We are not assigning a separate free score parameter to every
        sentence. The final scalar says how this model ranks responses under its training labels; it
        has no intrinsic unit such as “percent helpful.”
      </Prose>
      <Prose>
        To fit a pair, turn the score difference d=rA−rB into a preference probability p=σ(d). The
        sigmoid maps every real difference into (0,1). Its odds are p/(1−p)=exp(d): a difference .6
        gives odds about 1.822 and probability about .645656. Zero difference means .5, and
        reversing the pair changes p to 1−p. This is a Bradley–Terry logistic model of the
        comparisons, an assumption about how a scalar ordering explains observed choices.
      </Prose>
      <GapProbability />
      <MathBlock>
        {'d=r_A-r_B,\\qquad p=\\sigma(d)=\\frac{1}{1+e^{-d}},\\qquad \\frac{p}{1-p}=e^d'}
      </MathBlock>
      <Prose>
        A good probability model assigns high probability to observed labels. The negative log
        likelihood for target q is binary cross entropy: −q log p−(1−q) log(1−p). For a strict A
        winner it is −log p. Substituting the sigmoid gives the stable expression softplus(d)−qd;
        for q=1 it is softplus(−d). Softplus(z)=log(1+exp(z)) is evaluated with a stable library
        operation. Artificially clipping p before taking its log changes the gradient at extremes;
        numerical stability can preserve the original objective.
      </Prose>
      <MathBlock>
        {'\\ell(d,q)=\\log(1+e^d)-qd,\\qquad \\frac{\\partial\\ell}{\\partial d}=\\sigma(d)-q=p-q'}
      </MathBlock>
      <Prose>
        To see the derivative, differentiate the two log terms with respect to p, giving
        −q/p+(1−q)/(1−p). The sigmoid derivative is p(1−p). Multiplication cancels the denominators
        and leaves p−q. Since d=rA−rB, the two score derivatives are p−q and −(p−q). Gradient
        descent subtracts a derivative. With p≈.645656 and q=1, descent raises A's score relative to
        B.
      </Prose>
      <HeadGradient />
      <Prose>
        The head's weight gradient is (p−q)(hA−hB), not two unrelated score updates. Here it is
        approximately [−.354344,.354344]; a step .1 changes w to [.435434,−.235434]. If the head
        shares a text encoder, that same derivative also flows into its representations. A common
        bias contributes equally to both scores and cancels from d, so this pair loss supplies zero
        gradient to that bias. A soft target equal to p gives zero gradient even when the current
        loss is positive.
      </Prose>
      <H3>What a score can and cannot identify</H3>
      <Prose>
        Add the same constant to both scores and the difference stays fixed. Multiply both by a
        positive constant and the sign remains, but the probability usually changes. A pairwise
        label identifies relative scores, not an absolute zero. Reward scaling is nevertheless
        consequential when the reward is later balanced against a reference penalty.
      </Prose>
      <ScoreGauge />
      <Prose>
        Perfectly separable training pairs can drive unregularized score gaps upward without a
        finite best weight norm. Regularization, finite training budgets, held-out evaluation and
        explicit score conventions matter. A scalar score also cannot satisfy the strict cycle
        A&gt;B, B&gt;C, C&gt;A simultaneously. Such a cycle can reflect different contexts or
        raters, ambiguous instructions, or incompatible preferences; calling every disagreement
        annotation noise hides the substantive problem.
      </Prose>
      <Program
        file="pairwise_reward.py"
        title="Fit a real pairwise reward baseline and verify the gradient"
      />
      <Prose>
        This full program builds a training-only response-word vocabulary, adds length and
        prompt-overlap features, and fits a shared linear head on chosen-minus-rejected vectors. The
        pair difference removes the constant feature. Each update averages gradients over pairs and
        adds L2 regularization to the nonconstant weights. Its Torch and central finite-difference
        checks start from exactly the same two-dimensional head. The sklearn route includes both
        signed orientations with binary labels, disables an intercept and maps the regularization
        convention explicitly; a converged solver need not equal a fixed four-hundred-step fit.
        Section 11 reads the actual held-out outcomes rather than assuming more features must win.
      </Prose>

      <Anchor id="3-mathematical-foundation" />
      <Anchor id="3-make-the-idea-precise" />
      <H2>4. Reward with a reference</H2>
      <Prose>
        If we optimize only the learned score, the policy can exploit places where the score
        extrapolates badly. One useful constraint is to stay near a reference policy, often the SFT
        model. For one prompt, let π(y) be the current distribution over complete responses and
        πref(y) the fixed reference. The objective rewards high r(y) and subtracts β times the
        Kullback–Leibler divergence DKL(π‖πref). β is a positive tradeoff measured in reward units
        per nat, because the logarithms use base e.
      </Prose>
      <ReferenceTerms />
      <Prose>
        Read one row before summing. With current probabilities [.6,.3,.1] and reference [.4,.4,.2],
        the log ratio for B is log(.3/.4), which is negative. A sampled negative log ratio is valid;
        it says B is less likely under the current policy. Weighting every log ratio by its current
        probability and summing gives the nonnegative exact KL. Equality gives zero. The expectation
        is over the current distribution, so replacing these weights by the reference answers a
        different question.
      </Prose>
      <MathBlock>
        {
          'J(\\pi)=\\sum_y\\pi(y)r(y)-\\beta\\sum_y\\pi(y)\\log\\frac{\\pi(y)}{\\pi_{\\mathrm{ref}}(y)}'
        }
      </MathBlock>
      <Prose>
        A finite sample average can also be negative although the exact KL is nonnegative. Report
        what was measured: a mean sampled sequence log ratio, a full categorical KL, and an
        approximate change from the old policy are different diagnostics. Old-policy probabilities
        will stabilize a PPO update; reference probabilities anchor the policy's task-level
        objective. They are not interchangeable snapshots.
      </Prose>
      <H3>Deeper branch: solve the finite policy exactly</H3>
      <Prose>
        For three possible responses, start from reference probabilities [.4,.4,.2] and rewards
        [1,.4,−.2]. Give higher-scored responses more mass while retaining the reference as an
        anchor. The drawing multiplies each reference probability by an exponential reward factor,
        then divides by the sum of the resulting masses.
      </Prose>
      <TiltedPolicy />
      <Prose>
        The reference provides the starting mass, the reward tilts it, and division restores a
        distribution. Equal rewards give equal multipliers, so the normalized result returns exactly
        to the reference. We can now derive this reweighting. Enforce the probability sum with a
        multiplier c. The derivative with respect to πi is ri−β(log(πi/refi)+1)+c. Setting it to
        zero gives log(πi/refi)=ri/β plus a constant shared by all i. Exponentiation gives
        unnormalized mass refi exp(ri/β); normalization supplies the constant.
      </Prose>
      <MathBlock>
        {
          '\\pi_i^*=\\frac{\\pi_{\\mathrm{ref},i}\\exp(r_i/\\beta)}{\\sum_j\\pi_{\\mathrm{ref},j}\\exp(r_j/\\beta)}'
        }
      </MathBlock>
      <Prose>
        Adding one constant to all rewards multiplies every unnormalized mass equally and changes
        nothing. Scaling rewards and β by the same positive factor also preserves the answer.
        Reducing β concentrates mass on supported high-reward responses; tied maxima retain their
        relative reference mass in the limit. If the reference assigns zero probability to a
        response, positive mass there has infinite KL. A finite reward cannot create that missing
        support in this finite constrained problem.
      </Prose>
      <Prose>
        This exact finite optimum teaches the objective; it is not our token-PPO implementation. An
        autoregressive model shares parameters across an enormous set of strings, and we do not
        enumerate or independently choose every response probability. We will estimate an update
        from actual generated sequences. The exact normalization also sets up the next lesson's DPO
        derivation, where comparisons can eliminate a prompt-dependent normalization term.
      </Prose>

      <H2>5. Turn sampled reward into a gradient</H2>
      <Prose>
        Let θ denote the policy parameters. An update needs a direction in that parameter space, but
        we can only afford to draw a small number of responses. Each sampled response supplies its
        reward and the direction that would increase its log probability. Multiplying those two
        quantities gives a score-function estimate. The drawing compares each possible estimate with
        their exact probability-weighted average for a two-response policy.
      </Prose>
      <ScoreFunction />
      <Prose>
        Use two unconstrained softmax logits zA,zB as the coordinates throughout this example. If
        the probabilities are [.25,.75], drawing A gives the score vector [.75,−.75]; drawing B
        gives [−.25,.25]. With rewards [2,0], the two gradient estimates are [1.5,−1.5] and [0,0].
        Their probability-weighted mean is [.375,−.375]. One draw is not that mean, but many
        independent draws average toward it.
      </Prose>
      <MathBlock>
        {
          '\\nabla_\\theta\\mathbb E_{y\\sim\\pi_\\theta}[r(y)]=\\mathbb E_{y\\sim\\pi_\\theta}[r(y)\\nabla_\\theta\\log\\pi_\\theta(y)]'
        }
      </MathBlock>
      <Prose>
        For a fixed reward, differentiate the expected reward and use ∇π=π∇logπ to obtain the
        equation above. Sampling from the policy gives an unbiased estimator under the usual
        differentiability and support assumptions. The vectors show which logit increases and which
        decreases. A parameter update can change both probabilities because softmax normalizes them
        together. We maximize reward by adding the estimated objective gradient, or equivalently
        minimize a loss with its negative. Confusing these signs can produce a perfectly running
        program that learns the reverse preference.
      </Prose>
      <H3>A baseline changes noise without changing this expectation</H3>
      <Prose>
        Subtract a baseline b that does not depend on the sampled action. Its expected score term is
        b∑y π(y)∇logπ(y)=b∑y∇π(y)=b∇1=0. Thus replacing r by r−b preserves the expected gradient.
        For a sequence, a baseline may depend on the state, meaning the prefix before the next
        token. Detach that baseline in the policy loss; learning its own parameters is a separate
        regression problem.
      </Prose>
      <BaselineVariance />
      <Prose>
        A baseline is not automatically helpful. For our two-action example b=1.5 makes both
        possible estimates [.375,−.375], giving zero variance in these coordinates. A poor baseline
        such as b=4 increases variance. The program calculates the full two-point distribution and
        its variance before comparing twenty thousand fixed-seed samples. If b depends on the chosen
        action, the expectation-zero proof no longer applies. Setting b(y)=r(y) makes every estimate
        zero, which is biased whenever the true reward gradient is nonzero.
      </Prose>
      <Prose>
        The KL term has an additional subtlety: its logπ depends on θ. Differentiating the exact
        finite objective yields the score-function expectation with shaped reward r−βlog(π/ref),
        plus a term −β E[∇logπ]. That extra term is zero under the full distribution. Our PPO loop
        instead constructs sampled rewards from a frozen old rollout, detaches them and optimizes a
        surrogate near that rollout. This explains the relationship without pretending that each
        sampled update is the exact differentiated KL objective.
      </Prose>
      <Program
        file="policy_gradient.py"
        title="Exact gradients, sampled estimators, baseline variance and clipping witness"
      />
      <Prose>
        <Code>exact_gradient</Code> computes the finite derivative directly; Torch and finite
        differences independently check it. <Code>estimator_moments</Code> lists each possible
        score-function vector and its weighted mean and variance. <Code>tilted</Code> respects zero
        reference support. The later clipping example in the same program will show how one shared
        parameter moves two observations. Change the baseline, keep the sampling count fixed, and
        compare variance in the same logit coordinates.
      </Prose>

      <H2>6. A response is a sequence of actions</H2>
      <Prose>
        Now open the response into tokens. The state before action t is the prompt plus all
        previously sampled tokens. The policy reads that prefix and distributes probability over the
        vocabulary. A sampled token extends the prefix, so the next distribution changes. For the
        path Paris then EOS, the response probability is the probability of Paris after the prompt
        multiplied by the probability of EOS after prompt-plus-Paris. Its log probability is the sum
        of those two gathered log probabilities.
      </Prose>
      <TokenPath />
      <Prose>
        In the constructed tree at temperature 1, Paris has probability .6 and Rome .4 after the
        prompt. After Paris, EOS has probability .8 and a continuation .2. The selected Paris→EOS
        response therefore has probability .48 and log probability log(.6)+log(.8). Unselected
        branches remain possible even though one path was sampled. Temperature changes the
        distribution by scaling logits before softmax. The canonical program fixes temperature at
        one and samples the full vocabulary. It does not use top-k or top-p filtering, which would
        require careful agreement between the actual sampling distribution and the probabilities
        stored for the update.
      </Prose>
      <MathBlock>
        {
          '\\pi_\\theta(y\\mid x)=\\prod_{t=1}^{T}\\pi_\\theta(y_t\\mid x,y_{<t}),\\qquad \\log\\pi_\\theta(y\\mid x)=\\sum_{t=1}^{T}\\log\\pi_\\theta(y_t\\mid x,y_{<t})'
        }
      </MathBlock>
      <H3>Keep input visibility separate from target supervision</H3>
      <Prose>
        A causal decoder's output at input position j predicts the token at position j+1. If the
        input is [BOS,Q,Paris,EOS,PAD], logit 1 predicts Paris and logit 2 predicts EOS. The prompt
        remains visible context even though predicting its own tokens is excluded from the response
        loss. An attention mask describes valid input positions; a target mask describes which
        next-token predictions contribute to the objective.
      </Prose>
      <TokenMasks />
      <Prose>
        In the scratch program, <Code>shifted_scores</Code> compares logits before the last position
        with IDs after the first, exactly once. The valid predicting positions begin at
        prompt_length−1 and end before total_length−1. In Transformers' native causal loss,
        same-position labels are supplied and the model performs that shift internally. Do not shift
        those labels a second time. EOS is an actual generated decision and is scored; padding is
        excluded by recorded position and length. Even when a tokenizer reuses EOS as its PAD ID,
        equality to that ID cannot decide validity.
      </Prose>
      <Prose>
        Our tiny full-vocabulary policy can even draw the token named PAD or BOS inside a response.
        Such a draw is an actual action with a stored probability, not batch padding. It stays in
        the loss and is reported as malformed output. This makes the distribution and masking
        honest. A batch with no valid actions has no meaningful token mean and skips the optimizer
        step. Ignoring prompt targets also does not force prompt representations' gradients to zero:
        later supervised tokens attend to that context.
      </Prose>
      <ModelRoles />
      <Prose>
        The actor's final hidden stream has shape B×L×D for batch size B, positions L and width D.
        Its vocabulary head maps each hidden vector to V logits. A value head maps the same
        pre-action hidden vector to one predicted future return. The reward model is separate here
        and reads the completed prompt-plus-response, taking its scalar from the last valid token.
        It can therefore see the answer that the pre-action critic is trying to anticipate.
      </Prose>
      <Prose>
        The reference is a frozen copy of the SFT actor, used to score the same selected tokens.
        “Old” probabilities are detached numbers from the policy that collected the current rollout;
        the actor may change during later inner updates. Four roles do not require four equally
        sized full models: the actor and critic here share a backbone, old probabilities are stored
        arrays, and the reference and reward have explicitly separate frozen owners.
      </Prose>
      <H3>Put the completed score on the token trajectory</H3>
      <Prose>
        At each generated action, subtract β times its stored old-policy log probability minus its
        fixed-reference log probability. Add the reward model's completed-response score to the
        final action, including EOS when present. The result is a sequence of shaped rewards. Its
        sum is the terminal score minus β times the sampled sequence log ratio.
      </Prose>
      <TokenRewards />
      <Prose>
        The aligned rows distinguish an action's pre-action value from the reward obtained after the
        action. Changing β changes shaped rewards while the retained probabilities and terminal
        score stay fixed. Equal old/reference probabilities leave only the terminal score. These are
        sampled fixed-rollout rewards; no gradient passes through their stored log probabilities
        during PPO. Fresh generation later makes a new trajectory and new rewards.
      </Prose>

      <H2>7. Assign credit along the prefix</H2>
      <Prose>
        A completed score arrives late, but earlier choices helped cause it. A return is the sum of
        future rewards, optionally discounted by γ at each step. A value estimate Vt predicts that
        return from the prefix before action t. A temporal-difference residual asks how surprising
        this step's reward plus the discounted next prediction was relative to the current
        prediction. Generalized advantage estimation, or GAE, carries these residuals backward
        through the trajectory; λ controls how much later surprises propagate.
      </Prose>
      <AdvantageTrace />
      <Prose>
        Work backward along the arrows, multiplying the carried amount by γλ at each step. The
        advantage estimates how much better or worse this sampled continuation was than the current
        value prediction. For rewards [−.1,−.2,1.3], values [.4,.5,.6], γ=1 and a true terminal
        value 0, the residuals are [0,−.1,.7]. With λ=.8, start at the end: A2=.7;
        A1=−.1+.8(.7)=.46; A0=0+.8(.46)=.368.
      </Prose>
      <MathBlock>
        {
          '\\delta_t=r_t+\\gamma V_{t+1}-V_t,\\qquad \\hat A_t=\\delta_t+\\gamma\\lambda\\hat A_{t+1}'
        }
      </MathBlock>
      <Prose>
        The arrows show how the last positive residual reaches earlier actions with progressively
        smaller weight. A value-regression target is A+V, giving [.768,.96,1.3] in this example. At
        λ=0, each advantage uses one residual. At λ=1 and terminal bootstrap 0, the residual sum
        telescopes into the full discounted return minus Vt. Intermediate λ trades sensitivity to
        noisy distant rewards against reliance on imperfect value predictions; it is not universally
        best at a fixed setting.
      </Prose>
      <TerminalCutoff />
      <Prose>
        A real terminal state has no future return to bootstrap. A continuing-task rollout cut for a
        time limit is different: its last residual can include V(next), even though the trace must
        not continue into an unrelated next episode. Use separate semantics for bootstrap validity
        and trace continuation. In this lesson's canonical program, both EOS and the declared
        eight-action response horizon terminate the finite task, so bootstrap is zero. The adjacent
        calculation changes the task to a continuing cutoff and supplies a next value explicitly; it
        does not silently change the canonical run.
      </Prose>
      <H3>Normalize only the observations you have</H3>
      <Prose>
        Batches contain responses of different lengths. Store them in padded tensors, but compute
        advantage statistics only from valid generated actions. Subtract their mean and divide by
        the square root of their population variance plus a small epsilon. Then write normalized
        values back only at those positions. A huge number in a padding cell must not change the
        valid statistics.
      </Prose>
      <ValidNormalization />
      <Prose>
        Constant valid advantages become zero after centering. A no-action batch remains a no-op.
        Advantage normalization changes the scale and centering of a finite update; it is an
        implementation choice, not an identity that preserves every minibatch objective. The program
        freezes normalized advantages from the rollout for the entire inner update, avoiding moving
        targets as the critic changes.
      </Prose>
      <Program
        file="token_credit.py"
        title="Shifted scores, masks, reward shaping, GAE and valid-only normalization"
      />
      <Prose>
        The program checks gathered log probabilities against native cross entropy, then compares
        the backward GAE recursion with an independently expanded sum. Mixed lengths, EOS, padding
        fillers, continuing bootstrap and no-action cases exercise the important boundaries. GAE
        takes O(BL) work and output storage with one reverse accumulator per sequence. Its inputs
        are detached rollout measurements; the later actor/value loss supplies the differentiated
        path.
      </Prose>

      <H2>8. Reuse a rollout carefully</H2>
      <Prose>
        A fresh rollout is expensive. Proximal Policy Optimization, or PPO, reuses it for a bounded
        number of updates while comparing the current policy with the policy that collected it. For
        one recorded action, the probability ratio is ρ=exp(logπcurrent−logπold). At the start,
        before any update, it is one. Keep the old log probability fixed: overwriting it after each
        minibatch would hide accumulated movement. Choose a clipping width ε around ratio 1; the
        drawing shows how that interval changes the incentive for each advantage sign.
      </Prose>
      <ClippedSurrogate />
      <Prose>
        The policy maximizes the lower of two products: the probability ratio times advantage, and a
        clipped ratio times that same advantage. This gives a conservative surrogate. For positive
        advantage, increasing the selected action probability is helpful, but the objective stops
        rewarding it once ρ exceeds 1+ε. Decreasing it remains harmful and keeps a slope. For
        negative advantage, lowering its probability is helpful, so the plateau is below 1−ε;
        increasing it remains harmful and active. The minimum chooses the conservative branch in
        each sign case.
      </Prose>
      <Prose>
        With A=2 and ε=.2, ratios [.5,.8,1,1.2,1.5] give surrogate values [1,1.6,2,2.4,2.4]. With
        A=−2 they give [−1.6,−1.6,−2,−2.4,−3]. Read the second plot carefully: its harmful
        high-ratio side is not flat. For A=0 the entire policy contribution is zero. The code
        minimizes the negative surrogate and adds a separately weighted critic regression loss.
      </Prose>
      <MathBlock>
        {
          'L^{\\mathrm{clip}}=\\mathbb E\\left[\\min\\left(\\rho_t\\hat A_t,\\;\\mathrm{clip}(\\rho_t,1-\\epsilon,1+\\epsilon)\\hat A_t\\right)\\right]'
        }
      </MathBlock>
      <H3>Clipping is an incentive limit, not a hard trust region</H3>
      <Prose>
        PPO does not clamp the model's actual probability ratio. A clipped observation can still
        move because parameters are shared with other observations or with the value loss. Here a
        single current parameter θ feeds two states: p1=σ(θ) and p2=σ(−.1θ−log(4)). The old
        parameter 0 gave probabilities .5 and .2. At θ=.7, state 1's ratio≈1.336 is already on its
        positive-advantage plateau, while state 2 with negative advantage has ratio≈.945 and remains
        active.
      </Prose>
      <SharedParameter />
      <Prose>
        The first observation's local gradient is exactly zero. The second's gradient moves θ to
        about .715330 under the declared .2 ascent step, and the first ratio rises further to about
        1.343156. The retained analytic/autograd calculation verifies this witness. It explains why
        clipping is not a guarantee that every ratio stays within the interval, nor a proof that a
        full policy's KL is bounded by ε. Learning rate, number of epochs, gradient norms and direct
        drift diagnostics still matter.
      </Prose>
      <RolloutTimeline />
      <Prose>
        Follow one colour through the inner epochs: token IDs, old log probabilities, values used to
        construct targets, advantages and targets all belong to that fixed rollout. The current
        model is recomputed and differentiated for each minibatch. After the bounded inner loop,
        generate a fresh batch from the updated actor. Its new old-policy snapshot now differs; the
        SFT reference still stays fixed. Resetting this demonstration restores both timelines, not
        just the visible epoch counter.
      </Prose>
      <Prose>
        Our reduction is the mean over valid tokens in each minibatch, for both policy surrogate and
        value squared error. Longer responses therefore contribute more terms; this differs from
        averaging one response-summed objective per sequence. The total minimized loss is
        policy_loss+.5×mean_squared_value_error. There is no additional hidden half factor, entropy
        bonus or value clipping. These choices define this executable reference loop; other
        implementations must state their own choices before results can be compared.
      </Prose>

      <Anchor id="4-from-scratch-implementation" />
      <Anchor id="6-visual-walkthrough" />
      <H2>9. The complete scratch training loop</H2>
      <Prose>
        We can now run the entire mechanism. The small vocabulary contains thirteen tokens: PAD,
        BOS, EOS, one, sentence, France, Italy, Paris, Rome, is, capital, of and a period. Four
        prompts combine an instruction with a country. “BOS one France” requests “Paris EOS”; “BOS
        sentence Italy” requests “Rome is capital of Italy . EOS.” These are constructed
        exact-response tasks, not open-ended human helpfulness evaluation. They are deliberately
        small enough to inspect every generated action.
      </Prose>
      <Prose>
        Eight demonstrations include both short and long correct-capital answers for each prompt, so
        the initial SFT policy has an imperfect instruction-following signal. Eight constructed
        comparisons then prefer the requested length and the correct capital. A reward model fits
        those pairs. Its score is centered once by the mean score of both candidates in its training
        pairs; the center removes an arbitrary offset without rescaling the gaps. Perfect
        training-pair accuracy will not establish good scores for all newly generated strings.
      </Prose>
      <TrainingTrace />
      <Prose>
        Trace one retained rollout through the actual functions. <Code>collect</Code> samples a
        token, appends it to the prefix, and repeats until EOS or the finite horizon. With
        parameters unchanged, it gathers the same selected tokens' old and reference log
        probabilities, pre-action values and final reward. <Code>shape_rewards</Code> adds the
        terminal score. <Code>gae</Code> builds advantages and value targets, and valid-only
        normalization supplies the policy weights. All these arrays are detached.
      </Prose>
      <Prose>
        <Code>current_action_outputs</Code> runs the current actor again for each selected minibatch
        and gathers the corresponding positions. Only this current forward path is differentiated.{' '}
        <Code>update</Code> computes the clipped policy term plus value regression, clips the total
        parameter-gradient norm to one, and applies AdamW. It repeats four epochs with four
        trajectories per minibatch. The next collection round uses the changed actor. Before the
        first inner update, a same-policy equality check requires every valid current ratio to be
        one.
      </Prose>
      <Program
        file="token_ppo.py"
        title="Full response-only SFT, learned reward and autoregressive token PPO"
      />
      <Prose>
        The complete program contains all three fits. SFT runs 120 full-batch updates with
        response/EOS token mean loss. The separate reward fit runs 120 mean pair-loss updates. PPO
        collects sixteen responses in each of twenty rounds and uses β=.1, γ=1, λ=.95 and clip ε=.2.
        The actor/value model has 26,593 parameters. These are the prospective study settings, not
        tuned recommendations; the retained run is read in section 11.
      </Prose>
      <Program
        file="causal_backbone.py"
        title="The exact prerequisite causal decoder classes, included for a complete download"
      />
      <Prose>
        This local helper preserves the earlier{' '}
        <a href="/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models">
          Causal Language Modeling
        </a>{' '}
        model classes byte for byte. The new <Code>hidden_stream</Code> exposes the same normalized
        hidden vector before its vocabulary projection. The actor branches that vector to a new
        value head. The reward owner takes the last valid hidden vector of its own decoder and
        applies a separate scalar head. It does not claim that the old logits-only decoder already
        supplied a critic.
      </Prose>
      <Prose>
        Our reference implementation recomputes complete prefixes during sampling; it has no KV
        cache. Dense attention has quadratic position cost, and storing multiple model states and
        optimizer moments costs memory. The small loop favors inspectable operations over serving
        throughput. Frozen model hashes are checked after every completed run, old log-probability
        arrays stay fixed, and actor and critic weights must actually change. Those invariants
        detect wrong wiring; they do not certify useful language behavior.
      </Prose>
      <Program
        file="rlhf_study.py"
        title="Run each frozen experiment once and retain its source-bound result"
      />
      <Prose>
        Download the <a href="/learn/examples/rlhf/rlhf-programs.zip">complete runnable bundle</a>,
        including its setup instructions and pinned requirements. Place the programs, helper and{' '}
        <a href="/learn/examples/rlhf/records.json">offline records</a> in one directory. The driver
        runs the algebra, real-data baseline, token loop and library checks, writing each result and
        a receipt with code/data hashes and package versions. A completed stage is conserved on a
        later invocation. A changed source requires review instead of silently replacing a result.
        The <a href="/learn/examples/rlhf/HH-LICENSE.txt">dataset license</a> accompanies the
        records; the original dataset and narrower selection remain distinguishable.
      </Prose>

      <Anchor id="5-production-implementation" />
      <H2>10. Use the library deliberately</H2>
      <Prose>
        A library does not remove the data contract. It handles large tensor operations, model
        definitions and training infrastructure while your code still decides which text is
        compared, which targets count and which state is frozen. The executed route here uses
        PyTorch 2.14 CPU, Transformers 5.19.0 and TRL 1.14.2. TRL removed its former
        PPOTrainer/PPOConfig and value-head interfaces in version 1.13; copying an older snippet is
        not a working current PPO implementation. The complete token loop above supplies PPO with
        ordinary current differentiable model and optimizer operations.
      </Prose>
      <FrameworkParity />
      <Prose>
        The Transformers bridge constructs a small GPT2 language model plus an explicit scalar value
        module. Its token embeddings, biases and architectural details are not identical to the
        earlier TinyLM, so we do not assert weight-by-weight architecture parity. Instead, the same
        GPT2 forward state is evaluated two ways: gathered response-token log probabilities and
        GPT2's native causal loss with same-position masked labels. Both give 2.623677969 nats over
        eleven valid targets, with zero maximum gradient discrepancy in this retained float32 run.
      </Prose>
      <Program
        file="transformers_bridge.py"
        title="Native GPT2 token/value outputs, same-state loss parity and an actual update"
      />
      <Prose>
        The input tensor is 3×10; logits are 3×10×13 and values 3×10. Dropout is zero. The bridge
        then stores old probabilities, creates fixed advantages and value targets, and performs one
        actual PPO/value optimizer step. Actor embeddings and the value head change; the copied
        reference and old arrays do not. This establishes the framework interface and objective
        correspondence at the stated settings. It is neither a second policy study nor proof that
        every implementation uses the same reduction.
      </Prose>
      <H3>The supported reward-training route</H3>
      <Prose>
        TRL's current RewardTrainer accepts explicit prompt/chosen/rejected records. When a separate
        prompt column is supplied, chosen and rejected must be response suffixes: the trainer
        concatenates the prompt once. For ordinary string data it appends EOS when missing,
        tokenizes each complete candidate, and filters the whole pair if either tokenized sequence
        exceeds max_length. That is pair removal, not truncating both answers to a common length.
        Record the count; filtering can alter which comparisons the fit sees.
      </Prose>
      <Prose>
        The collator places all chosen candidates first and all rejected candidates second in one
        padded batch. A scalar sequence-classification model returns one score per sequence.
        Splitting its output into those two halves restores each pair; the loss is the mean softplus
        of negative chosen-minus-rejected gaps. Margin and score-centering options change this
        objective. Both are disabled for our parity comparison, and CPU float32, dropout 0 and no
        gradient checkpointing are explicit.
      </Prose>
      <Program
        file="reward_trainer.py"
        title="Train the current TRL reward interface on a fixed real comparison subset"
      />
      <Prose>
        The tokenizer is fully supplied: a training-only WordLevel vocabulary with explicit PAD,
        UNK, BOS and EOS. A small GPT2 scalar model is created from configuration, not a downloaded
        pretrained language model. The program checks that the prompt appears exactly once and EOS
        remains the final valid token, compares loss and parameter gradients to a separate
        same-state direct calculation, then fits exactly twenty optimizer steps on the predeclared
        first 128 training pairs. Its evaluation uses the corresponding fixed 64 held-out pairs; no
        pair exceeded the declared limit in this run. The direct held-out summary is 33/64
        agreement, BCE .703402 and Brier .255024, illustrating the limits of a tiny from-config
        model. The initial loss differs from its direct calculation by about 6×10⁻⁸ and the maximum
        gradient discrepancy is about 1.2×10⁻⁷. Flushing a labelled manual parity probe before
        evaluation keeps its diagnostic metrics separate from held-out aggregates. The retained
        per-pair outputs, rather than a mixed diagnostic queue, determine the reported held-out
        summary.
      </Prose>

      <Anchor id="9-failure-modes-and-gotchas" />
      <H2>11. Decide what improved</H2>
      <Prose>
        There are at least three different questions: does the reward predictor match new
        comparisons, does the policy increase that predictor's score, and do generated responses
        meet an independently stated task criterion? Answer them with separate measurements.
        Training loss alone answers none of the held-out or generated-response questions. Nor does a
        universal “safe KL” threshold exist independently of the model, reward scale, prompts and
        measurement convention.
      </Prose>
      <HeldoutPairs />
      <Prose>
        In the frozen real-data study, the linear text-feature reward head agrees with 60.1% of the
        163 held-out comparisons, giving ties half credit. Its BCE is .656571 nats and Brier score
        .232001. A length-only baseline reaches 61.7% agreement, BCE .658357 and Brier .232826. Thus
        the richer head has slightly better probability losses here while losing on thresholded
        agreement. Those differences are small results on one selected subset, not evidence that
        length measures helpfulness.
      </Prose>
      <LessonTable
        caption="Observed held-out comparison prediction on the same 163 pairs"
        headers={['Predictor', 'Agreement, ties half', 'BCE, nats', 'Brier']}
        rows={[
          ['Linear word/length/overlap head', '0.601227', '0.656571', '0.232001'],
          ['Length-only head', '0.616564', '0.658357', '0.232826'],
          ['sklearn fit of the matched linear objective', '0.595092', '0.656258', '0.231854'],
          ['Uninformative probability .5', '0.5', '0.693147', '0.25'],
        ]}
      />
      <Prose>
        A held-out pair's chosen-probability is a model output; the supplied chosen label is the
        observed target. BCE penalizes overconfident errors more sharply than accuracy, while Brier
        measures squared probability error. The bin view presents every pair in both orientations,
        swapping p with 1−p and the binary label with its complement. Otherwise a chosen-first
        dataset would make every displayed label one by construction. Counts are shown, empty bins
        stay empty, and the two orientations are not independent new human judgments.
      </Prose>
      <Prose>
        Length strata and literal pairs help diagnose shortcuts. A high score for a longer answer
        can be appropriate when more detail is requested and wrong when brevity is requested. The
        baseline's shallow overlap feature cannot understand all these instructions. Moreover, the
        subset came from readable helpful-base training records with a new grouped split, not the
        dataset's original official evaluation protocol. We make no population-wide or
        production-quality inference from these local figures.
      </Prose>
      <MeasuredTraining />
      <Prose>
        The constructed token study has an independently defined exact-response criterion. At the
        SFT checkpoint, 13 of 32 fixed-seed generated samples meet it. After round 5, proxy reward
        has risen from about −.678 to 1.391, yet only 5 of 32 meet the criterion. Round 15 reaches
        19 of 32, then round 20 falls to 16 of 32 despite a slightly higher proxy score. No run was
        repeated to make these curves prettier. The same four prompts and evaluation seed are
        reused, so these are mechanism diagnostics, not held-out generalization.
      </Prose>
      <LessonTable
        caption="Retained constructed-policy evaluation; 32 generated responses per checkpoint"
        headers={[
          'Round',
          'Mean proxy reward',
          'Exact criterion',
          'Mean sampled sequence log ratio',
          'EOS endings',
        ]}
        rows={[
          ['SFT / 0', '−0.677667', '13 / 32', '0', '31 / 32'],
          ['5', '1.390582', '5 / 32', '7.624175', '17 / 32'],
          ['10', '3.670865', '15 / 32', '4.134484', '24 / 32'],
          ['15', '4.103687', '19 / 32', '2.911565', '30 / 32'],
          ['20', '4.140644', '16 / 32', '5.416496', '27 / 32'],
        ]}
      />
      <Prose>
        The reward fit reaches perfect accuracy on its eight training comparisons. Yet at round 5 it
        assigns about 4.770 to <em>Paris is Paris Paris is . EOS</em> for the sentence-France
        prompt. At round 15, <em>Paris is capital of Italy . EOS</em> receives about 4.767 for that
        same prompt. These are retained actual generated failures, selected after the run as
        high-proxy criterion failures. They show reward-model extrapolation failure outside its tiny
        comparison set. They do not show that human annotators preferred those malformed or
        incorrect answers.
      </Prose>
      <Prose>
        Some generations reach the declared horizon without EOS; one round 5 evaluation sample
        contains a PAD/BOS token as an actual sampled action. The report retains both. Sampling full
        vocabulary, valid token masking, old-policy snapshots and frozen model checks all passed, so
        algorithmic execution and useful outputs remain separate assessments. A stronger experiment
        would add new annotated comparisons from the policy's changed distribution, then reserve an
        independent evaluation set before choosing another training setting.
      </Prose>
      <H3>A controlled proxy failure you can calculate</H3>
      <Prose>
        To isolate the mechanism from neural training noise, return to three constructed responses
        for the one-word request: A, “Paris”; B, “Paris is France's capital”; and C, “Rome is
        France's capital, certainly.” The supplied exact task criterion is [1,0,0]. Use a uniform
        reference and proxy rewards [1,b,2b], where b is an explicitly wrong verbosity bias. At b=0
        the proxy matches the criterion; increasing b rewards the longer wrong answer most. The
        exact finite optimum from section 4 shifts mass according to that proxy even when expected
        criterion declines. At b=1 and β=.5, A receives only 1/(2+exp(2))≈.106507 of the mass.
      </Prose>
      <ProxyConflict />
      <Prose>
        This is a calculated counterexample with supplied scores, not a measurement of human values.
        Setting the proxy equal to the criterion removes the designed conflict; making all proxy
        rewards equal restores the reference distribution. The learned miniature gives a separate
        observed example of imperfect extrapolation. In larger studies,{' '}
        <a href="https://arxiv.org/abs/2210.10760">reward-model overoptimization research</a>{' '}
        measures the gap using separately defined evaluation signals; our tiny fixture does not
        reproduce those scaling results.
      </Prose>

      <Anchor id="7-decision-matrix" />
      <Anchor id="8-what-scales-and-what-doesnt" />
      <Anchor id="8-what-scales-and-what-doesn-t" />
      <H2>12. Choose the next training question</H2>
      <Prose>
        Choose the method by the supervision and decision you can actually measure. Demonstrations
        support SFT. A reward model can rank multiple sampled candidates at inference through
        best-of-N selection without changing the policy. Offline chosen/rejected pairs support
        direct preference methods such as DPO. Online sampled responses and scored outcomes support
        policy-gradient training such as the complete loop here. These routes can be combined, but
        comparing them requires accounting for both training and inference work.
      </Prose>
      <LessonTable
        caption="Different evidence and operations answer different training questions"
        headers={['Route', 'Signal', 'What changes', 'Critical question']}
        rows={[
          [
            'SFT',
            'Demonstrated target responses',
            'Policy token likelihood',
            'Do demonstrations cover desired behavior?',
          ],
          [
            'Best-of-N',
            'Scores for N generated candidates',
            'Selected answer, with policy weights fixed',
            'Does extra inference sampling find better candidates?',
          ],
          [
            'Reward model + PPO',
            'New policy samples scored by a model or environment',
            'Actor and usually a value estimator',
            'Does the scoring signal remain valid as generation changes?',
          ],
          [
            'DPO / SimPO',
            'Offline comparative responses',
            'A direct policy preference objective',
            'Do pair distribution and objective assumptions fit the task?',
          ],
          [
            'RLOO / GRPO / related variants',
            'Groups of sampled responses and rewards',
            'Policy with a chosen baseline/normalization',
            'Which estimator and group signal are actually used?',
          ],
          [
            'AI / constitutional feedback',
            'Model judgments guided by instructions or principles',
            'Labels and then a chosen training objective',
            'How are judge errors and principle choices evaluated?',
          ],
          [
            'Verifiable reward / process supervision',
            'Checkable outcomes or intermediate-step labels',
            'Reward location and supervision granularity',
            'What does the verifier or step label really establish?',
          ],
        ]}
      />
      <Prose>
        Direct methods get their full derivations in the next lessons; replacing a learned value
        baseline with group statistics also changes the estimator and data collection. AI feedback
        changes who or what supplies the judgment, not the need to test its meaning. A verifiable
        outcome can be stronger evidence for a narrowly checkable property while leaving other
        qualities unmeasured.
      </Prose>
      <WorkLedger />
      <Prose>
        Separate collection from updating. With B responses of average T generated tokens, a round
        samples about BT actions. K inner epochs revisit about KBT valid action positions for the
        actor/value loss, plus reference and reward scoring work during collection. For B=16, T=6
        and K=4, those two counts are 96 generated actions and 384 update positions. Setting K to
        zero retains generation but eliminates the update. These are token-work counts, not
        wall-clock predictions: attention length, caching, batching, parallelism, precision and
        communication change actual cost.
      </Prose>
      <Prose>
        For a matched-budget comparison, hold prompt distribution, available
        demonstrations/comparisons, independent evaluation and a declared generation budget fixed.
        Then report training-token and inference-token costs separately. A best-of-N method spends
        multiple candidates at inference; an SFT policy may emit one. A reward model trained on
        extra labels has received extra information. Hiding either difference makes a “same budget”
        claim misleading.
      </Prose>

      <Anchor id="11-self-check-exercises" />
      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <H2>13. Independent practice</H2>
        <Prose>
          These cases change the numbers, masks or decision. Use the hints if useful; each complete
          solution explains the operation and its limit.
        </Prose>
        <Exercise
          title="1. Change the instruction."
          hint={<p>Separate factual correctness, task compliance and the source of a label.</p>}
          solution={
            <p>
              For “Give the country and capital in a complete sentence,” B's sentence can fit better
              than A's isolated “Paris,” even though both contain the correct capital. The
              prompt-conditioned preference reverses; a universal shorter-is-better score would not.
              A stipulated winner is constructed supervision. To call it observed human feedback,
              collect an actual judgment under stated instructions and preserve its provenance.
              Agreement by several people still does not establish every factual or safety property.
            </p>
          }
        >
          Change the opening request to “Give the country and capital in a complete sentence.”
          Explain which response you prefer, why the old length rule fails, and what evidence would
          justify calling the label human feedback.
        </Exercise>
        <Exercise
          title="2. Repair a leaking split and choose new queries."
          hint={
            <p>
              Move groups before measuring performance. Uncertainty alone is not a coverage policy.
            </p>
          }
          solution={
            <p>
              Rows a and c must share a partition because their initial question is Q1; rows b and d
              must also move together for Q2. One valid split trains on both Q1 rows and evaluates
              both Q2 rows, although that tiny test cannot represent a broad domain. For new
              annotation, reserve evaluation first, sample across declared prompt strata and policy
              behaviors, then combine uncertain pairs with diverse and high-impact cases. Keep
              presentation order balanced and permit ties/unknown. A model near .5 can indicate a
              useful close choice or a malformed/unjudgeable pair; inspect the text. Measure
              held-out ranking/probability error and stratum coverage after a fixed annotation
              budget, including annotator disagreement, rather than repeatedly selecting questions
              until a preferred score appears.
            </p>
          }
        >
          Rows a/c share initial question Q1 and rows b/d share Q2. A proposed split trains on a/b
          and tests on c/d. Repair it. Then design a twenty-pair annotation round that uses reward
          uncertainty without excluding unrepresented prompt types; state what you would measure.
        </Exercise>
        <Exercise
          title="3. Update a changed reward head."
          hint={<p>Compute the shared representation difference before multiplying by p−q.</p>}
          solution={
            <p>
              The scores are .4 and .6, so d=−.2 and p≈.450166003. With q=1, p−q≈−.549833997. The
              difference hA−hB is [2,−2], giving gradient [−1.099667995, 1.099667995]. Subtract .1
              times that gradient: w becomes [.2099667995, .0900332005]. The common bias cancels and
              has zero pair gradient. The updated gap is about .239867198, so A's modeled
              probability rises. This is one shared-weight step, not independently assigning two new
              scores.
            </p>
          }
        >
          Let hA=[2,1], hB=[0,3], w=[.1,.2], common bias 0, target q=1 and learning rate .1. Compute
          scores, probability, weight gradient and the next weights.
        </Exercise>
        <Exercise
          title="4. Diagnose an impossible scalar ordering."
          hint={<p>Add the three strict inequalities.</p>}
          solution={
            <p>
              The first two imply rA&gt;rC, contradicting rC&gt;rA. Equivalently, the sum of the
              three requested positive score differences is zero. A scalar model can compromise
              probabilistically, but cannot satisfy all three strict comparisons at once for the
              same conditioning information. Inspect whether prompts, instructions or annotator
              groups differ; these may require additional conditioning or a richer preference
              representation. Majority vote can choose a training label but does not prove the
              underlying disagreement was meaningless.
            </p>
          }
        >
          At the same prompt and criterion, comparisons request A&gt;B, B&gt;C and C&gt;A. Show why
          no scalar scores satisfy all three. Name two evidence checks before deleting a label.
        </Exercise>
        <Exercise
          title="5. Compute a changed reference penalty."
          hint={<p>Weight each log ratio by its current probability.</p>}
          solution={
            <p>
              The two log ratios are log(1.4)≈.336472237 and log(.6)≈−.510825624. Their weighted
              contributions are about .235530566 and −.153247687, summing to KL≈.082282879 nats. A
              sample of the second response has a negative log ratio; that does not contradict the
              positive full expectation. At β=.3, the exact penalty is about .024684864 reward
              units. Changing the reference weights instead of the current weights would compute a
              different expectation.
            </p>
          }
        >
          For π=[.7,.3], reference=[.5,.5] and β=.3, compute both signed KL contributions, their sum
          and the penalty. Explain a negative one-sample estimate.
        </Exercise>
        <Exercise
          title="6. Scale and support."
          hint={<p>Look at r/β and at the multiplicative reference mass.</p>}
          solution={
            <p>
              Multiplying all rewards and β by four leaves every r/β unchanged, so the normalized
              optimum is identical. Adding any common reward offset also cancels. With reference
              [.4,.6,0], rewards [0,0,100] and positive β, the third response remains unsupported;
              the optimum is [.4,.6,0]. Its large reward cannot compensate for infinite KL at
              positive mass. A practical softmax usually assigns positive mathematical mass to every
              unmasked action, but hard sampling masks or an explicitly finite reference can change
              support.
            </p>
          }
        >
          Explain what happens when both rewards and β are multiplied by four. Then solve the
          supported optimum for reference [.4,.6,0] and rewards [0,0,100].
        </Exercise>
        <Exercise
          title="7. Check a new baseline exactly."
          hint={<p>Use score vectors [.6,−.6] and [−.4,.4].</p>}
          solution={
            <p>
              Without a baseline, action A gives [1.8,−1.8] and B gives [.4,−.4]; the mean is
              [.96,−.96]. With b=1, the estimates are [1.2,−1.2] and [.8,−.8], with the same mean.
              For either coordinate, variance is .4(.24²)+.6(−.16²)=.0384 with the baseline, versus
              .4(.84²)+.6(−.56²)=.4704 without it. The baseline here reduces variance. Replacing b
              by each action's own reward makes both estimates zero and biases this nonzero-gradient
              case.
            </p>
          }
        >
          Let p=[.4,.6], rewards=[3,−1] and state-only baseline b=1. In two-softmax-logit
          coordinates, compute both possible estimates, their expected gradient and each
          coordinate's variance. Compare b=0 and the action-dependent b(y)=r(y).
        </Exercise>
        <Exercise
          title="8. Locate the first response target."
          hint={
            <p>The target is one position after its predicting logit; validity comes from roles.</p>
          }
          solution={
            <p>
              Positions 0–3 are prompt, 4–6 are response tokens and 7 is EOS; padding occupies 8–9.
              Attention validity is [1,1,1,1,1,1,1,1,0,0]. Same-position causal labels are
              [−100,−100,−100,−100,7,9,12,2,−100,−100]. Predicting logits 3, 4, 5, 6 score targets
              4, 5, 6, 7, giving four contributions. GPT2 receives those unshifted same-length
              labels and shifts internally. Even if padding IDs were also 2, positions 8–9 would
              remain excluded while genuine EOS at position 7 remains scored. Ignoring prompt loss
              does not prevent response gradients from flowing through prompt context.
            </p>
          }
        >
          A complete stream is [1,3,5,6,7,9,12,2,0,0]. The prompt occupies positions 0–3, response
          tokens 4–6, EOS at position 7 and PAD at positions 8–9. Write attention validity,
          same-position labels and the predicting positions. What changes if PAD shares EOS's ID?
        </Exercise>
        <Exercise
          title="9. Change the trajectory boundary."
          hint={<p>Start with the final delta, then propagate one half of it backward.</p>}
          solution={
            <p>
              For a true terminal, δ=[.2+.4−.3, 1−.4]=[.3,.6]. GAE gives A=[.3+.5(.6),.6]=[.6,.6]
              and targets [.9,1]. For a continuing cutoff with Vnext=.8, only the final residual
              directly changes: δ1=1+.8−.4=1.4. The earlier advantage also changes through the
              trace, giving A=[1,1.4] and targets [1.3,1.8]. Neither case carries an advantage trace
              into the next episode. A maximum-length boundary must be assigned one of these task
              meanings explicitly.
            </p>
          }
        >
          Use rewards [.2,1], values [.3,.4], γ=1 and λ=.5. Compute GAE and targets for a true
          terminal. Repeat with a continuing cutoff whose next-state value is .8.
        </Exercise>
        <Exercise
          title="10. Read the negative-advantage branch."
          hint={<p>Evaluate both products before taking their minimum.</p>}
          solution={
            <p>
              At ratio 1.4, the unclipped product is −4.2 and the clipped product is −3.3, so the
              surrogate is −4.2 with ratio slope −3. Increasing a negatively advantaged action is
              harmful and remains penalized. At ratio .7, the two products are −2.1 and −2.7; the
              surrogate is −2.7 and locally flat below .9. Lowering its probability past the helpful
              boundary gains no further surrogate benefit. Neither calculation clamps the actual
              ratio, and shared parameters can still move it.
            </p>
          }
        >
          Let A=−3 and ε=.1. Compute the surrogate at ratio 1.4 and ratio .7, identify its local
          slope, and explain why only one side is flat.
        </Exercise>
        <Exercise
          title="11. Repair a moving old policy."
          hint={
            <p>The denominator identifies the distribution that generated the stored action.</p>
          }
          solution={
            <p>
              Store old selected-token log probabilities under no_grad when collecting the rollout,
              and retain them across all minibatches and epochs from that rollout. Recompute only
              current log probabilities during each update. Replacing old values with each current
              forward pass resets ratios toward 1 and removes the intended record of cumulative
              movement from collection. Advantages and targets must also remain fixed within the
              round. After fresh generation, use a fresh old snapshot; the fixed SFT reference still
              serves a different role.
            </p>
          }
        >
          A loop overwrites old_logp with the current model's log probabilities before every
          minibatch. Explain the bug and write the corrected collection/update boundary in words.
        </Exercise>
        <Exercise
          title="12. Modify the complete program."
          hint={<p>Separate a frozen trajectory calculation from a future on-policy collection.</p>}
          solution={
            <p>
              On the unchanged saved trajectory, adding 1 to its terminal score adds 1 to its final
              residual and adds (γλ) raised to the distance from that action to each earlier
              unnormalized advantage. With γ=1, λ=.95 and three actions, the additions are
              [.9025,.95,1]. Stored old/reference log probabilities, action IDs, mask and values
              stay fixed. Targets increase by the same amounts; valid-normalized advantages need not
              shift by those amounts because their mean/variance are recomputed. A later trained
              policy can generate different actions, so that future rollout is not a controlled
              fixed-trajectory comparison. Test the unnormalized recursion first.
            </p>
          }
        >
          On a saved three-action rollout, increase only the terminal reward by 1 with γ=1 and
          λ=.95. Predict changes and invariants before editing token_credit.py. Explain why the same
          statement does not determine the next generated response.
        </Exercise>
        <Exercise
          title="13. Repair the library pair."
          hint={
            <p>
              Use either explicit shared prompt plus suffixes, or complete candidates without a
              separate prompt.
            </p>
          }
          solution={
            <p>
              With prompt='Question: X\\nAnswer:', chosen and rejected must contain only their
              respective suffixes. If they already contain the full prompt, remove the separate
              prompt column or split the suffixes exactly; do not duplicate the context. In the
              declared max_length 192 route, a tokenized candidate of 193 makes its entire
              comparison pair fail the filter, even if the other candidate is short. Count that
              removal and preserve the source record separately. Cropping it to 192 would implement
              a different data policy and might delete EOS or the decisive answer span.
            </p>
          }
        >
          A record has a prompt column and also repeats that full prompt at the start of both
          candidates. Repair it. One complete tokenized candidate is 193 tokens at max_length 192;
          state what the current RewardTrainer does and why silently cropping is not equivalent.
        </Exercise>
        <Exercise
          title="14. Decide from conflicting evidence."
          hint={
            <p>
              Name the claim each measurement supports and the missing denominator or evaluation
              source.
            </p>
          }
          solution={
            <p>
              A higher proxy score establishes that the measured samples receive higher scores from
              that predictor. It does not establish better task performance. The criterion fell from
              18/30=.6 to 12/30=.4 on this small set, while unchanged held-out pair accuracy says
              only that the reward's ranking behavior on those fixed comparisons stayed the same.
              Inspect literal failures and prompt strata, then collect independent judgments or
              verified outcomes on new policy samples under a reserved protocol. More uncertainty
              estimates and repeated prospective seeds can help, but do not erase the observed
              decline or tune on the evaluation set. β should be assessed with reward units and
              measured tradeoffs, not a universal KL cutoff.
            </p>
          }
        >
          A new policy raises mean proxy reward from 1 to 2.5, leaves the reward model's fixed
          held-out pair accuracy at .65, and changes task successes from 18/30 to 12/30. What can
          you conclude? Specify the next evaluation and one reason a larger β alone is not a
          complete diagnosis.
        </Exercise>
        <Exercise
          title="15. Design a budget-aware ablation."
          hint={<p>Count annotation information, training work and generation work separately.</p>}
          solution={
            <p>
              Freeze prompt-family splits and an independent response evaluation protocol. Train
              SFT, then compare that checkpoint, best-of-N using the same frozen reward, and PPO
              from the same checkpoint. Use the same available comparison labels for
              reward-dependent routes and report which route consumes them. Fix a declared
              candidate-token budget per evaluated prompt or report a
              performance-versus-inference-budget curve; a one-sample PPO answer and N-sample
              selector have different inference costs. Separately report SFT/reward/policy update
              work, collection tokens and annotation effort. An ablation removing the reference
              penalty tests one mechanism only if the rest of the protocol stays fixed. Several
              seeds estimate training variability; prompt-group resampling respects
              repeated-question dependence. No hypothetical table counts as a performed experiment.
            </p>
          }
        >
          Compare SFT, best-of-N and PPO under a defensible budget. State fixed inputs, separate
          costs, evaluation signals, one ablation and the remaining confounder if best-of-N samples
          more answers at inference.
        </Exercise>
      </section>

      <Anchor id="10-primary-sources" />
      <Sources
        alternatives={
          <>
            <p>
              <a href="https://rlhfbook.com/c/03-training-overview">Nathan Lambert's RLHF Book</a>{' '}
              offers a second continuous explanation. After section 3, read{' '}
              <a href="https://rlhfbook.com/c/05-reward-models">Reward Modeling</a> for scalar heads
              and pair probabilities; after section 8, read{' '}
              <a href="https://rlhfbook.com/c/06-policy-gradients">Policy Gradients</a> for
              estimator and implementation choices. Its code conventions should be compared
              explicitly with this lesson's masking and reductions.
            </p>
            <p>
              <a href="https://cmu-l3.github.io/anlp-fall2025/static_files/anlp-f2025-15-rl-llms.pdf">
                CMU Advanced NLP, Reinforcement Learning for LLMs, fall 2025
              </a>{' '}
              provides an alternate token-versus-response decision-process treatment and connects
              task, initialization, reward and optimization. Use its token-state drawing to redraw
              section 6 with your own prompt. Compare where the token-level diagram places states,
              actions and rewards with the whole-response view.
            </p>
            <p>
              <a href="https://spinningup.openai.com/en/latest/algorithms/ppo.html">
                Spinning Up's PPO explanation
              </a>{' '}
              is a focused next reading for both advantage signs, the clipped surrogate and
              practical stopping. Read it alongside the two plots in section 8 and identify exactly
              why a plateau is not a hard constraint.
            </p>
          </>
        }
      >
        <li>
          <a href="https://arxiv.org/abs/1706.03741">
            Christiano et al., Deep Reinforcement Learning from Human Preferences (2017)
          </a>{' '}
          — primary preference-model and policy-learning loop, including ties, unjudgeable
          comparisons and query selection. The paper's environment experiments are not locally
          reproduced.
        </li>
        <li>
          <a href="https://arxiv.org/abs/1909.08593">
            Ziegler et al., Fine-Tuning Language Models from Human Preferences (2019)
          </a>{' '}
          — language-model preference optimization and reference regularization.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2009.01325">
            Stiennon et al., Learning to Summarize from Human Feedback (2020)
          </a>{' '}
          — summary comparisons and the relationship between optimization and independent human
          evaluation.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2203.02155">
            Ouyang et al., Training Language Models to Follow Instructions with Human Feedback
            (2022)
          </a>{' '}
          — demonstrations, reward modeling, policy optimization and stated evaluation populations.
          No paper headline is substituted for the small local evidence.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2204.05862">
            Bai et al., Training a Helpful and Harmless Assistant with Reinforcement Learning from
            Human Feedback (2022)
          </a>{' '}
          and <a href="https://github.com/anthropics/hh-rlhf">HH-RLHF data repository</a> — primary
          task/data context and the actual helpful-base source used here. This lesson uses the
          helpful subset and a documented new grouped split.
        </li>
        <li>
          <a href="https://arxiv.org/abs/1707.06347">
            Schulman et al., Proximal Policy Optimization Algorithms (2017)
          </a>{' '}
          — original clipped surrogate and multiple epochs over collected observations.
        </li>
        <li>
          <a href="https://arxiv.org/abs/1506.02438">
            Schulman et al., High-Dimensional Continuous Control Using Generalized Advantage
            Estimation (2015)
          </a>{' '}
          — residual expansion, γ and λ, and the value/advantage distinction.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2210.10760">
            Gao et al., Scaling Laws for Reward Model Overoptimization (2022)
          </a>{' '}
          — controlled proxy-versus-gold-model evidence. Its synthetic gold reward is not human
          truth, and its numerical optima are not copied into this lesson.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2403.17031">
            Huang et al., The N+ Implementation Details of RLHF with PPO (2024)
          </a>{' '}
          — token reward/value anatomy and implementation distinctions. Follow the token-level
          reward and value diagrams to compare terminal-score placement, masks and training
          conventions with this lesson's complete loop.
        </li>
        <li>
          <a href="https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/reward_trainer.py">
            TRL 1.14.2 RewardTrainer source
          </a>{' '}
          and{' '}
          <a href="https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/reward_config.py">
            RewardConfig source
          </a>{' '}
          — exact pair ordering, prompt concatenation, EOS insertion, pair filtering and loss
          options used in the native route.
        </li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>Readiness and the next question</H2>
        <Prose>
          Continue when you can derive a pair gradient, distinguish old policy from fixed reference,
          locate the first response logit and EOS target, trace GAE backward, explain both clipping
          branches, and challenge a proxy gain with separate evidence. You should also be able to
          run the full program and identify which arrays are detached and which model receives each
          gradient. The next question is whether comparison data can train the policy directly
          without an explicit learned reward-and-PPO loop.{' '}
          <a href="/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models">
            Direct Preference Optimization
          </a>{' '}
          starts from the reference-tilted optimum and derives that alternative.
        </Prose>
      </section>
    </div>
  ),
};

export default rlhf;
