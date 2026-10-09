import { Prose, H2, H3, Code } from '../../../../src/learn/components/content';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {
  LessonIntro,
  LessonTable,
  Sources,
} from '../../../../src/learn/components/lesson-labs/LessonElements.jsx';
import {
  MathEquation as MathBlock,
  PairAnatomy,
  OperationAnatomy,
  ModelBranches,
  FourScores,
  RelativeShift,
  LossSlope,
  TokenScore,
  Masks,
  BoundaryAudit,
  TiltNormalize,
  ObjectiveGeometry,
  Cancellation,
  RankingChoices,
  RewardClasses,
  GradientFanIn,
  SharedMass,
  BetaQuestions,
  UpdateGraph,
  ConstructedRun,
  RealDataSplit,
  NativeParity,
  CacheLineage,
  EvidenceReadout,
  GenerationAudit,
  RepeatedLabels,
  ObjectiveContrast,
  DataRefresh,
} from '../../../../src/learn/components/lesson-labs/DPOFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';

const root = '/learn/examples/dpo/';
const Program = ({ file, title }) => (
  <RemoteCodeBlock source={root + file} filename={file} title={title} />
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

const dpo = {
  title: 'DPO (Direct Preference Optimization)',
  readTime: '~75 min read + programs and practice',
  content: () => (
    <div className="lesson-flow dpo-flow">
      <LessonIntro
        prerequisites="Causal Language Modeling supplies the autoregressive decoder and next-token prediction. RLHF supplies comparative labels and a fixed-reference objective; both are briefly rebuilt here. Logs, probability distributions and gradients help. Response-only SFT, exact masks and the DPO derivation are explained before use."
        exampleKind="Python + actual causal-model and current DPOTrainer updates"
      >
        Start with one request and two answers. Follow their tokens through four probability scores,
        a relative comparison and a policy update. Sections 1–4 establish the objects; sections 5–6
        explain why the loss takes this form and what its gradient can do. Sections 7–10 provide
        complete programs, measured results and a cache audit. Section 11 develops ambiguous labels
        and alternative objectives. Finish with changed practice and further learning.
      </LessonIntro>

      <Anchor id="1-why-it-exists" />
      <Anchor id="1-start-with-the-problem" />
      <H2>1. Learn from a comparison</H2>
      <Prose>
        “Name France's capital in one word” asks for more than a correct fact. A is “Paris”; B is
        “Paris is the capital of France.” Both mention the right city, but A follows this
        instruction. A comparison record can express that distinction without supplying a numerical
        quality score. Keep the request attached to the judgment: a request for a complete sentence
        would favour B. The drawing separates the shared request, the two candidate completions and
        the supplied preference.
      </Prose>
      {/* D01: one shared prompt forks into complete A/B spans; criterion edit changes the supplied label, never identity colour. */}
      <PairAnatomy />
      <Prose>
        Read downward from the request to both branches. The label says which answer is preferred
        <em> for that request</em>. It is separate from the language model's current probability of
        either answer. Changing the criterion changes the label without editing the responses. With
        no length requirement there may be a tie; a data pipeline should preserve that ambiguity
        instead of inventing a winner. These opening labels are constructed examples, not
        observations of human raters.
      </Prose>
      <Prose>
        Write a labelled training row as a shared prompt x, a preferred completion y⁺ and a
        dispreferred completion y⁻. “Chosen” and “rejected” are conventional column names for those
        roles. They do not assert that every claim in the chosen text is true, that the rejected
        text is useless, or that all people share the same preference. Real rows later in this
        lesson retain their released text and judgments, including questionable material.
      </Prose>
      <Prose>
        In{' '}
        <a href="/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models#3-learn-a-score-difference">
          RLHF
        </a>
        , comparisons can train a reward predictor, and a policy can then optimize its scores on
        newly sampled responses. Direct Preference Optimization, or DPO, asks whether the policy can
        learn directly from the comparison rows. The answer begins with the same policy/reference
        relationship that appeared in RLHF, but the training operation changes.
      </Prose>

      <Anchor id="2-core-intuition" />
      <Anchor id="2-build-the-intuition" />
      <H2>2. Four scores replace a sampled loop</H2>
      <Prose>
        Put the two workflows beside each other. In a reward-and-policy loop, recorded comparisons
        fit a scorer, current policy samples are scored, and those scores drive a policy update. In
        an offline DPO update, the answers to score already exist in the record. Both model states
        read those same tokens. The word <em>offline</em> describes this use of fixed observations;
        it does not mean the code cannot run on a connected machine.
      </Prose>
      {/* D02: genuine model parameter grids and data/update paths; reference present in both workflows; no mandatory four-copy claim. */}
      <OperationAnatomy />
      <Prose>
        Follow the DPO lane from a pair to two evaluations under the trainable policy and two under
        a fixed reference. A scalar loss sends gradients back through the policy. This loss does not
        need a separately fitted reward head, sampled on-policy rollouts or a critic. Those
        omissions describe the direct update, not a guarantee about memory or total system cost.
        Producing and judging the recorded pairs still costs work. A PPO implementation can also
        share actor and value parameters rather than keep every role in an independent model.
      </Prose>
      <Prose>
        The policy and reference commonly begin as copies of a supervised fine-tuned checkpoint.
        Supervised fine-tuning, or SFT, makes demonstrated response tokens likely under a prompt.
        During DPO the policy weights change; the reference remains the selected initial state. Draw
        these as two parameter sets before writing any loss. The two policy branches share one
        trainable set of weights, not two separately optimized policies.
      </Prose>
      {/* D03: same x/A and x/B traverse policy and reference parameter matrices; stop-gradient bars terminate the reference path. */}
      <ModelBranches />
      <Prose>
        Trace A through the policy, then through the reference; do the same for B. Each path returns
        the log probability of the complete supplied response given the prompt. Scoring known
        response tokens is teacher forcing: each token is predicted with the preceding supplied
        tokens visible. It does not sample an alternative token at that position. The reference
        branch uses no gradient, and its storage is a separate copy. A frozen reference also differs
        from PPO's <em>old policy</em>, which identifies the distribution that collected a
        particular rollout and can change between collections.
      </Prose>
      <Prose>
        Now attach numbers to the four paths. Let sA and sB denote policy log probabilities, and fA
        and fB denote reference log probabilities. The letters f remind us which model is fixed. A
        log probability is measured in nats here because the logarithm is natural. More negative
        values mean lower probability. The example supplies two responses from a much larger
        possible response space; their probabilities need not add to one.
      </Prose>
      {/* D04: 2x2 score matrix, explicit row/column identity and subtractions; invalid total mass is rejected. */}
      <FourScores />
      <Prose>
        The policy gives A −2 and B −4, while the reference gives A −3 and B −3.5. A's gain relative
        to the reference is −2 − (−3) = 1 nat. B's gain is −4 − (−3.5) = −0.5 nats. These are
        changes in log probabilities, so a gain of 1 means multiplication of probability by e, not
        addition of one probability point. The next section compares those two gains. If edited
        values put more than total probability one on two distinct complete responses, the display
        diagnoses the invalid distribution rather than accepting an impossible fixture.
      </Prose>

      <H2>3. Build the relative preference margin</H2>
      <Prose>
        A comparison asks how much more the chosen response gained than the rejected response. Place
        their two gains on one signed axis. The common zero means “unchanged from the reference,” so
        negative bars remain meaningful. Subtract B's gain from A's gain only after both model
        differences have been identified.
      </Prose>
      {/* D05: same zero for signed gains; bracket shows subtracting the rejected gain; raw policy gap remains visible. */}
      <RelativeShift />
      <Prose>
        A gained 1 while B lost 0.5, so A's relative advantage is 1 − (−0.5) = 1.5 nats. Call that
        quantity the <em>relative preference margin</em>, m. The same number comes from subtracting
        the reference A-versus-B gap from the policy A-versus-B gap. A positive m need not mean A
        has higher raw probability than B: an initially much less likely A can gain more and still
        remain less likely. Equal gains give m = 0 even when both probabilities fall.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &m=(s_A-f_A)-(s_B-f_B)\\
        &=\log\frac{\pi_\theta(y^+\mid x)}{\pi_{\mathrm{ref}}(y^+\mid x)}\\
        &-\log\frac{\pi_\theta(y^-\mid x)}{\pi_{\mathrm{ref}}(y^-\mid x)}.
      \end{aligned}`}</MathBlock>
      <Prose>
        The subscript θ names the policy's trainable parameters. To turn this margin into a
        probability model for the supplied comparison, multiply it by a positive coefficient β and
        apply the sigmoid. A sigmoid maps a real logit z to a value between zero and one. The
        negative log probability of the chosen label is the loss. The three curves below distinguish
        a comparison probability, its loss and its slope.
      </Prose>
      {/* D06: calculated sigmoid/loss/slope at beta .4 and margin1.5, stable arithmetic, no implied sampling probability. */}
      <LossSlope />
      <Prose>
        At β = 0.4 and m = 1.5, the logit is 0.6. The modeled probability of the chosen comparison
        is about 0.645656, and the loss is about 0.437488 nats. It is not the probability of
        sampling the string “Paris”: that still comes from the language model. Set m to zero and the
        comparison probability becomes 0.5 with loss log 2, approximately 0.693147. At
        initialization policy and reference are equal, so every margin is zero regardless of their
        raw answer probabilities. The gradient is still nonzero; training can start there.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &z=\beta m,\\
        &\sigma(z)=\frac{1}{1+e^{-z}},\\
        &\ell=-\log\sigma(\beta m)\\
        &=\operatorname{softplus}(-\beta m).
      \end{aligned}`}</MathBlock>
      <Prose>
        A batch averages this per-pair loss. It does not average all response tokens into one
        undifferentiated pool: each response first contributes its sequence sum, and each labelled
        pair contributes one logistic loss. Stable softplus avoids taking a logarithm of a rounded
        probability zero. The complete algebra program later evaluates logits of both −1000 and
        +1000 without exponential overflow. β = 0 would erase the policy gradient and no longer
        represents the positive-coefficient derivation below; the interactive calculation requires β
        greater than zero.
      </Prose>

      <H2>4. A response score comes from tokens</H2>
      <Prose>
        The four scores are not separate free parameters in a language model. Each is assembled from
        many conditional next-token probabilities. For a short sequence such as BOS, Q, Paris, EOS,
        the logit row at Q predicts Paris and the row at Paris predicts EOS. Draw the vocabulary
        axis as well as time: selecting a token means taking one entry after the whole row has been
        normalized by log-softmax.
      </Prose>
      {/* D07: real BxTxV tensor anatomy, selected cells at predicting rows, target shift and response sum. */}
      <TokenScore />
      <Prose>
        Follow the arrow from a predicting row to the next supplied token. Only Paris and EOS are
        response targets in the short example, so their selected log probabilities enter the sum.
        The prompt remains visible context. The final input row has no following target in this
        supplied sequence. In a batch with padded length T and vocabulary size V, logits have shape
        B × T × V; pairing <Code>logits[:, :-1]</Code> with <Code>input_ids[:, 1:]</Code> produces B
        × (T − 1) selected values before the response mask removes unwanted targets.
      </Prose>
      <MathBlock>{String.raw`\log\pi_\theta(y\mid x)=\sum_{t=1}^{|y|}
        \log\pi_\theta(y_t\mid x,y_{<t}).`}</MathBlock>
      <Prose>
        This identity follows from multiplying conditional probabilities along the supplied response
        and taking a logarithm. EOS is part of that complete-response event when the representation
        uses it as the stopping token. A long response has more terms, usually making its sum more
        negative. Replacing the sum with an average may sometimes be useful, but it defines a
        different score; section 11 shows a comparison whose sign changes.
      </Prose>
      <Prose>
        Two masks answer two different questions. The attention mask marks actual sequence positions
        rather than padding. The completion mask marks which same-position tokens belong to the
        response loss. The causal triangle separately prevents each position from reading future
        tokens. Keep these objects visible together when the batch contains responses of different
        lengths.
      </Prose>
      {/* D08: attention triangle plus position-aligned attention/target masks; shared PAD/EOS ID does not merge roles. */}
      <Masks />
      <Prose>
        In the executed mixed-length check, row one has IDs [1, 3, 5, 7, 2], with three prompt
        positions followed by two response targets. Row two has [1, 8, 9, 2, 2]: its first position
        is prompt, the next three are response, and the final 2 is padding. PAD and EOS
        intentionally share ID 2 in this check. Positions distinguish them: the genuine EOS is
        selected while the final padding cell is not. The valid shifted masks are [0, 0, 1, 1] and
        [1, 1, 1, 0]. Their counts are two and three, not the number of token IDs different from
        PAD.
      </Prose>
      <Prose>
        With the saved seeded logits, the two response sums are −4.165702 and −10.830213 nats.
        Adding padding leaves those sums unchanged. An ignored prompt target has zero direct
        derivative at that output-logit coordinate, but response predictions still depend on prompt
        representations. Their gradients can flow through attention into the prompt computation. “Do
        not supervise prompt tokens” does not mean “stop all gradients through the prompt.” A row
        with no response targets is rejected instead of divided by zero.
      </Prose>
      <Prose>
        There is a second boundary to audit before masks exist: the boundary between raw prompt and
        response strings. Tokenizing each string separately and concatenating IDs need not equal
        tokenizing their joined text. A tokenizer can merge characters across that join. Context
        truncation can also remove exactly the suffix on which the preference depends.
      </Prose>
      {/* D09: verified BPE a+b->ab merge, stable boundary, and whole-pair rejection when context removes decisive tokens. */}
      <BoundaryAudit />
      <Prose>
        The actual BPE fixture gives the prompt “a” token ID 0 but joined “ab” token ID 2. The old
        prompt IDs are no longer a prefix of the full IDs, so simply masking the first token as
        prompt would discard the response too. Our plain-text route requires a stable prompt prefix
        for both candidates and appends a genuine EOS once. If either full pair member exceeds the
        context limit, it rejects and records the whole pair. Cutting off a decisive phrase and
        retaining the original label would silently change the training example.
      </Prose>
      <Prose>
        To run this first program, download the{' '}
        <a href={root + 'dpo-programs.zip'} download>complete example archive</a>, extract it,
        and open a terminal in that folder. With Python 3.11 or later, create a virtual environment
        using <Code>python -m venv .venv</Code>, activate it with <Code>.venv/Scripts/Activate.ps1</Code> in PowerShell or{' '}<Code>source .venv/bin/activate</Code> in a POSIX shell, and consult the{' '}
        <a href={root + 'README.md'}>setup README</a> for the full commands. Install the pinned packages with{' '}
        <Code>python -m pip install -r requirements.txt</Code>. Run{' '}
        <Code>python -B response_scores.py --output my-response-scores.json</Code> to inspect
        the selected targets and loss calculations without training a model. Section 10 joins
        the full study commands, companion files and recorded results.
      </Prose>
      <Program
        file="response_scores.py"
        title="Gather genuine response targets with one causal shift"
      />
      <Prose>
        Read <Code>pack</Code> first: it constructs right padding, visibility and response roles
        from lengths. <Code>response_scores</Code> shifts the target and its masks together, applies
        log-softmax across vocabulary, gathers actual next tokens and sums valid terms.
        <Code>pair_loss</Code> expects all chosen rows followed by all rejected rows, subtracts
        detached reference sums and averages pair losses. For its two-pair fixture the margins are
        1.5 and 0.5, the losses approximately 0.554355 and 0.644397, and their mean 0.599376. The{' '}
        <Code>boundary</Code> function supplies explicit errors for ambiguous or incomplete
        responses. These are different checks of one data contract, not interchangeable masks.
      </Prose>

      <Anchor id="3-mathematical-foundation" />
      <Anchor id="3-make-the-idea-precise" />
      <H2>5. Why the normalizer disappears</H2>
      <Prose>
        We can now compute DPO, but why compare reference-relative log probabilities at all? Begin
        with the RLHF question for one fixed prompt: prefer responses with larger reward, while
        penalizing movement from a reference distribution. In this mathematical derivation the
        reward function is given. It is not a new reward model secretly fitted inside the DPO
        program. A three-response example makes the normalization visible.
      </Prose>
      {/* D10: multiply reference masses by exp(reward/beta), pool Z, normalize; explicit shared reward shift. */}
      <TiltNormalize />
      <Prose>
        Start from reference masses [0.5, 0.3, 0.2], rewards [1, 0, −1] and β = 1. Weight each mass
        by the exponential of its reward. A receives a factor e, B a factor one and C a factor e to
        the power −1. The three products do not sum to one, so divide each by their common sum Z.
        The result is approximately [0.784399, 0.173139, 0.042463]. The log of Z is 0.549691. Equal
        rewards give equal factors and return the reference. Adding one common constant to every
        reward multiplies both numerator and denominator by the same factor, leaving the normalized
        probabilities unchanged.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &\pi^*(y\mid x)=\frac{\pi_{\rm ref}(y\mid x)e^{r(x,y)/\beta}}{Z(x)},\\
        &Z(x)=\sum_y\pi_{\rm ref}(y\mid x)e^{r(x,y)/\beta}.
      \end{aligned}`}</MathBlock>
      <Prose>
        This tilted distribution optimizes an expected-reward-minus-KL objective. KL divergence
        compares complete distributions, weighting each log ratio by the candidate policy's
        probability. Individual log ratios can be negative while the total KL is nonnegative. To see
        the balance as a curve, simplify to two possible responses with reference [0.6, 0.4],
        rewards [1, 0] and β = 0.7. The entire two-action distribution is determined by A's mass p;
        B has mass 1 − p.
      </Prose>
      {/* D11: full two-action objective, not a falsely global three-action slice; reward/KL/objective panels and calculated optimum. */}
      <ObjectiveGeometry />
      <Prose>
        Moving p toward one raises expected reward but also increases the weighted KL cost. The peak
        occurs at the exponential tilt for this two-action problem. Raising β holds the reward fixed
        and makes distance from the reference more costly. It is a penalty coefficient, not an
        instruction that the achieved KL equal a particular hard budget. We can verify the peak
        algebraically rather than rely on the plotted grid.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &J(\pi)=\mathbb E_{y\sim\pi}[r(x,y)]\\
        &-\beta D_{\rm KL}(\pi\Vert\pi_{\rm ref}),\\
        &D_{\rm KL}(\pi\Vert q)=\sum_y\pi(y)\log\frac{\pi(y)}{q(y)}.
      \end{aligned}`}</MathBlock>
      <Prose>
        Take a log of the tilted policy: log π* = log πref + r/β − log Z. Substitute that expression
        into the KL from π to π*. Expanding the log ratio gives KL(π∥π*) = KL(π∥πref) − Eπ[r]/β +
        log Z, because the policy probabilities sum to one. Rearranging isolates our objective as a
        constant minus a nonnegative divergence.
      </Prose>
      <MathBlock>{String.raw`J(\pi)=\beta\log Z(x)-\beta D_{\rm KL}(\pi\Vert\pi^*).`}</MathBlock>
      <Prose>
        Equality at the maximum holds when π = π* on the relevant support. This statement assumes β
        positive, a finite normalizer, and a candidate policy with no positive mass where the
        reference has zero mass. Finite positive softmax distributions satisfy the finite-action
        version; an unbounded response space needs the normalizability condition stated explicitly.
        A neural model class, finite dataset and finite optimizer run need not realize the ideal
        distribution or reach that maximum.
      </Prose>
      <Prose>
        Rearrange the same tilted-policy equation to express its reward using a log probability
        ratio plus a prompt-dependent constant. Now compare two answers to the <em>same</em>
        prompt. Draw the origin of the shared constant before cancelling it.
      </Prose>
      {/* D12: same prompt feeds common c(x) into both reward equations; different-prompt edit leaves residual constants. */}
      <Cancellation />
      <Prose>
        Both reward paths receive c(x) = β log Z(x). Subtracting B's reward from A's removes c(x)
        exactly. The remaining difference is β times the relative log-probability margin. If A
        belongs to x₁ and B to x₂, the two constants generally differ and leave c(x₁) − c(x₂).
        Editing the common constant in a valid pair therefore changes neither its reward gap nor its
        modeled preference probability. A cross-prompt comparison cannot use that cancellation
        without additional structure.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &r(x,y)=\beta\log\frac{\pi^*(y\mid x)}{\pi_{\rm ref}(y\mid x)}+c(x),\\
        &r(x,y^+)-r(x,y^-)=\beta m.
      \end{aligned}`}</MathBlock>
      <Prose>
        The Bradley–Terry comparison model assigns probability σ(rA − rB) to preferring A over B.
        Replacing the ideal policy by a trainable πθ supplies a reward parameterization up to a
        prompt constant. Fitting that comparison likelihood produces the DPO loss in section 3. No
        explicit Z is needed in this pair likelihood. This is a change of parameterization and a
        statistical objective, not a proof that each empirical gradient step exactly solves the
        original reward optimization or that the supplied labels fully identify human values.
      </Prose>
      <H3>A deeper extension: ranking more than two answers</H3>
      <Prose>
        A full ranking can instead model sequential choices from the remaining answers. For the
        ranking A above B above C, first choose A from all three, then choose B from the two that
        remain. The denominators change after a choice; repeating one binary sigmoid is not the same
        model.
      </Prose>
      {/* D12 adjunct: actual remaining-choice tree A/B/C -> B/C with denominators; static ranking extension. */}
      <RankingChoices />
      <Prose>
        The first branch uses exp(rA) divided by exp(rA) + exp(rB) + exp(rC). Conditional on that
        choice, the second uses exp(rB) divided by exp(rB) + exp(rC). Multiply the two factors for
        this ordering. This is the Plackett–Luce ranking model. A common prompt constant cancels
        from each numerator and denominator. It motivates a listwise extension, while the complete
        programs here intentionally fit pairwise comparisons.
      </Prose>
      <Prose>
        Cancellation also explains what comparisons cannot tell us. Rewards r and r + c(x) give the
        same within-prompt preferences and the same tilted policy. Support is a separate condition,
        not something a reward shift repairs.
      </Prose>
      {/* D13: reward-equivalent vectors, same normalized masses, and explicit zero-reference support diagnostic. */}
      <RewardClasses />
      <Prose>
        Shift all three rewards together and watch the normalized masses stay fixed. Change only one
        reward and the policy changes. If a response has zero reference mass, any positive
        candidate-policy mass there gives infinite KL; no finite reward bonus compensates for it in
        this objective. Adding epsilon changes the reference and therefore changes the problem. A
        mathematically positive vocabulary softmax does not guarantee that a truncated sampler or
        finite-precision implementation preserves every possible path.
      </Prose>
      <Program
        file="dpo_algebra.py"
        title="Compute DPO, the tilted optimum, and its limits with the standard library"
      />
      <Prose>
        The program follows the derivation in executable pieces. <Code>dpo</Code> validates four log
        probabilities and computes the two gains, margin, logit, probability, loss and score
        partials. <Code>tilted</Code> uses log-sum-exp only on supported responses;
        <Code>kl</Code> returns infinity when a positive candidate mass lacks reference support. The
        checks compare the exact objective identity, common shifts, joint reward/β scaling,
        finite-difference signs, a different-prompt residual and the alternatives introduced later.
        A checked finite-action identity is evidence for this calculation, not a benchmark result
        for a large language model.
      </Prose>

      <H2>6. What a gradient does and does not promise</H2>
      <Prose>
        The loss is scalar, but a neural update acts through all the tokens and shared weights that
        produced it. Differentiate in two stages. First consider the response log probabilities as
        coordinates; then follow their own Jacobians back to θ. The fan-in drawing makes the shared
        scalar multiplier distinct from those token-specific paths.
      </Prose>
      {/* D14: loss->margin->two sums->token log probabilities->one parameter grid, separate signed token Jacobians. */}
      <GradientFanIn />
      <Prose>
        A chosen-score increase lowers the loss, so its coordinate partial is negative. A
        rejected-score increase raises it, so that partial is positive. At m = 1.5 and β = 0.4,
        their magnitudes are about 0.141737. Every token in a response sum receives this pair
        multiplier, but the derivative of each token log probability depends on its own context and
        vocabulary distribution. For one log-softmax row the selected-token derivative is one minus
        its probability, and each other vocabulary coordinate receives minus its probability. These
        directions can interact through shared weights.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &w=\beta\sigma(-\beta m),\\
        &\frac{\partial\ell}{\partial s_A}=-w,\quad\frac{\partial\ell}{\partial s_B}=w,\\
        &\nabla_\theta\ell=-w\left(\begin{aligned}&\nabla_\theta\log\pi_\theta(y^+\mid x)\\&-\nabla_\theta\log\pi_\theta(y^-\mid x)\end{aligned}\right).
      \end{aligned}`}</MathBlock>
      <Prose>
        Gradient descent subtracts this loss gradient. It therefore favours the chosen-minus-
        rejected score direction locally. That does not guarantee that the chosen probability rises
        after a finite update. An intentionally constrained three-output model supplies a
        counterexample we can calculate completely.
      </Prose>
      {/* D15: one theta feeds logits(theta,-theta,10theta), plus before/after normalized A/B/C masses. */}
      <SharedMass />
      <Prose>
        The logits are θ, −θ and 10θ for A, B and C. At θ = 0 all three masses are one third, as is
        the reference. The A-minus-B log probability gap is 2θ because the common softmax normalizer
        cancels. At β = 1 the initial loss derivative is −1. A descent step with learning rate 0.1
        moves θ to 0.1. The new masses are approximately 0.233736, 0.191367 and 0.574897: both
        compared answers became less likely while C gained mass. Nevertheless the relative margin
        rose from zero to 0.2 and the pair loss fell to 0.598139.
      </Prose>
      <Prose>
        This example ties all three logits to one parameter. It does not claim the same outcome for
        three independently adjustable logits, or for every language-model update. It establishes
        why a coordinate-gradient slogan is insufficient for shared parameters. Real minibatches add
        conflicting examples, optimizer history and finite steps. Inspect chosen and rejected
        likelihoods separately, and check actual generation rather than treating a larger pair
        margin as a complete quality measurement.
      </Prose>
      <Prose>
        β raises a related interpretive trap. In the ideal tilted policy, vary β while keeping a
        reward function fixed. In the DPO gradient, vary β while keeping a current margin fixed.
        These are different experiments, so their immediate effects need not point in the same
        verbal direction.
      </Prose>
      {/* D16: fixed-reward ideal tilt and fixed-margin derivative as separate named investigations. */}
      <BetaQuestions />
      <Prose>
        In the fixed-reward panel, larger β makes the exponential reward factors more alike, pulling
        the optimum toward the reference. In the fixed-margin panel at m = 0, the gradient magnitude
        is β/2, so doubling β doubles that initial coordinate multiplier. At other margins, β also
        changes the sigmoid saturation. Finite-data training combines both the objective's
        parameterization and an optimizer trajectory; “larger β always means a smaller update” is
        not a reliable rule. A vanishing learning rate is an exact no-update case; setting β to zero
        discards the preference signal and the derivation's positive-penalty setting.
      </Prose>

      <Anchor id="4-from-scratch-implementation" />
      <H2>7. Build and train the scratch model</H2>
      <Prose>
        We have the data contract and loss, so connect them to an actual causal decoder. The
        backbone below is the complete inspected TinyLM from{' '}
        <a href="/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#7-build-the-complete-causal-decoder">
          Causal Language Modeling
        </a>
        . Token and position embeddings feed two pre-normalized causal blocks and a vocabulary
        projection. Nothing here is a reward head or value estimator. Our DPO wrapper only supplies
        pairs, masks, sequence scores and the optimization objective.
      </Prose>
      <Program file="causal_backbone.py" title="The complete causal decoder dependency" />
      <Prose>
        Inside attention, query/key scores receive a lower-triangular mask before softmax, so a
        predicting row cannot use a future response token. Each block adds attention and an MLP back
        into the residual stream. The final head returns a vocabulary logit vector at every
        position. This small implementation uses right padding: because valid tokens precede padded
        positions, causal attention keeps the future padding from changing valid prefix states. Its
        response-scoring mask still removes padded targets. Arbitrary left padding would require a
        different attention/position treatment and is not supported by this wrapper.
      </Prose>
      <Prose>
        The constructed experiment uses 13 tokens: PAD, BOS, EOS, one, sentence, France, Italy,
        Paris, Rome, is, capital, of and period. The literal vocabulary token <Code>period</Code>
        is a word representing punctuation in this small grammar. Four prompts combine two
        instructions with two countries. SFT sees both a short capital answer and a long sentence
        for every prompt. DPO then receives two comparisons per prompt: the instruction-appropriate
        answer beats the alternative length and beats an otherwise matching answer with the wrong
        capital. These eight preferences are deliberately constructed, not human annotations.
      </Prose>
      <Prose>
        The model has width 32, two heads, two layers, context 16 and 26,560 parameters. CPU
        initialization uses seed 41 with no dropout. SFT runs 120 full-batch AdamW updates at
        learning rate 0.003 and weight decay zero, with gradient norm limited to one. Its loss
        averages the negative log probability over the 36 genuine demonstration response targets.
        The final response NLL is 0.160750 nats. Copy that checkpoint to the fixed reference, then
        initialize two independent continuation policies from exactly the same weights.
      </Prose>
      {/* D17: actual 16-row/72-target first pair batch, 8 margins, mean loss, observed gradient norm and weight identity; saved checkpoint values only. */}
      <UpdateGraph />
      <Prose>
        The DPO minibatch contains all eight chosen responses followed by all eight rejected
        responses: 16 rows, 72 valid response targets and eight pair margins. For the first pair,
        chosen and rejected log probabilities are −0.705123 and −0.743207 under both models. Every
        initial relative margin is zero and the mean loss is 0.693147. Its first actual policy
        gradient norm before clipping is 0.518972. The optimizer changes the shared policy weights,
        while the copied reference's hash and absent gradients remain fixed. Checkpoint selectors
        expose saved scores and update diagnostics; they do not simulate a new browser fit or invent
        unrecorded intermediate parameter values.
      </Prose>
      <Prose>
        DPO runs 40 full-batch updates with β = 0.2, learning rate 0.001, zero weight decay and norm
        limit one. A second continuation trains only the chosen responses for 40 updates with the
        same optimizer settings, using a response-token mean NLL. It has 36 response targets per
        update rather than DPO's 72. Both begin with fresh optimizer moments. Equal update counts
        therefore do not establish equal FLOPs, token budgets or information use. The unchanged SFT
        checkpoint provides the common step-zero baseline.
      </Prose>
      <Program
        file="scratch_dpo.py"
        title="Complete SFT initialization, DPO and chosen-only continuation with free generation"
      />
      <Prose>
        Begin at <Code>fixture</Code>, then follow <Code>sft</Code>, <Code>frozen_copy</Code> and
        <Code>continuation</Code>. The reference scores are collected under no-grad and reused
        because those weights, tokens and masks stay fixed. Each DPO step recomputes policy scores
        and applies the response-sum, pair-mean loss. The chosen-only branch slices the chosen rows
        and uses a different reduction. <Code>generate</Code> samples the model's next-token softmax
        repeatedly rather than teacher-forcing a stored candidate. It stops at EOS or eight new
        actions; a PAD or BOS draw counts as a malformed response rather than being silently
        suppressed.
      </Prose>
      <Prose>
        The exact-task criterion is independently specified before fitting: a response must equal
        the capital-plus-EOS sequence for a one-word request or the full constructed sentence for a
        sentence request. At each saved checkpoint, generate eight samples for each of the four
        prompts, resetting generator seed 941 and using temperature one over the full vocabulary.
        The drawing keeps this criterion separate from pair loss and relative margin.
      </Prose>
      {/* D18: saved two-method checkpoints and all 320 literal outputs; no interpolation or unrecorded decoding seeds. */}
      <ConstructedRun />
      <Prose>
        DPO's pair loss falls at every recorded checkpoint, and all eight supplied pairs already
        have positive relative margins at update 10. Yet only 22 of its 32 free generations meet the
        exact task at that point. By update 40 the count is 30, with one response still ending at
        the horizon. The chosen-only continuation finishes with 31 exact responses and a higher DPO
        diagnostic loss of 0.381460. A diagnostic preference loss and free-generation task success
        answer different questions even on these four training prompts.
      </Prose>
      <LessonTable
        caption="Recorded constructed-task outcomes; 32 generations per method and checkpoint"
        headers={[
          'Update',
          'DPO pair loss',
          'DPO exact count',
          'Chosen-only pair loss',
          'Chosen-only exact count',
        ]}
        rows={[
          ['0', '0.693147', '13 / 32', '0.693147', '13 / 32'],
          ['10', '0.474742', '22 / 32', '0.597581', '27 / 32'],
          ['20', '0.365393', '28 / 32', '0.457231', '30 / 32'],
          ['30', '0.212896', '30 / 32', '0.405654', '31 / 32'],
          ['40', '0.162277', '30 / 32', '0.381460', '31 / 32'],
        ]}
      />
      <Prose>
        These are measured small-model outcomes on training prompts under one declared seed and
        decoding rule. They neither establish held-out generalization nor rank alignment algorithms
        universally. Resetting the same generator seed controls the random-number stream, but
        different EOS lengths can consume different numbers of draws, so later samples need not use
        identical per-position random variates across methods. Retaining every output makes that
        sampling protocol inspectable.
      </Prose>

      <Anchor id="5-production-implementation" />
      <H2>8. Use the current library on real comparisons</H2>
      <Prose>
        The small grammar makes failures unambiguous. Real preference text adds messy boundaries,
        repeated prompts and labels that a program cannot certify as correct. Reuse the released
        Anthropic HH helpful-base records from the RLHF lesson, keeping original strings and the
        same first-human-question family split. The shared conversation and the response suffix are
        distinct fields; concatenate the prompt exactly once.
      </Prose>
      {/* D19: actual source row and family membership, original suffixes, train-only vocabulary and exact filter counts. */}
      <RealDataSplit />
      <Prose>
        The complete offline selection contains 329 training pairs in 256 families and 163 held-out
        pairs in 128 different families. This native study takes the first 128 training and 64
        held-out rows by original row ID, spanning 117 and 56 families respectively. Their family
        sets do not overlap. Row 81, for example, retains a conversation containing dubious animal
        facts before a question about black cats. The lesson does not correct that released text or
        silently replace its supplied preference. A data audit can establish exact strings and split
        identities without establishing the truth of those strings.
      </Prose>
      <Program
        file="pair_records.py"
        title="Preserve and audit exact human-comparison records offline"
      />
      <Prose>
        With no source argument, this program audits the supplied <Code>records.json</Code>. It
        checks that prompt plus each suffix reconstructs its original full text, verifies pair
        digests and forbids family or prompt overlap. The optional gzip path reconstructs the same
        selection only when the official source hash matches. Grouping uses the normalized first
        human turn, so two later conversations with that same start remain in one partition. It
        reduces this particular leakage route; it is not a semantic duplicate detector for every
        possible paraphrase.
      </Prose>
      <Prose>
        The ordinary library route builds a WordLevel tokenizer from selected training rows only,
        using 1,024 frequent words plus PAD, UNK, BOS and EOS. That gives a vocabulary of 1,028.
        Unknown held-out words stay unknown instead of entering the vocabulary after evaluation.
        Right-padded full examples must preserve the prompt prefix and fit 192 tokens including one
        appended EOS. All 128/64 selected pairs pass these particular checks; the code still records
        every exclusion if a changed dataset fails them.
      </Prose>
      <Prose>
        Create a GPT2 language model from configuration: width 32, one layer, two heads, context
        256, all dropout zero and 53,856 parameters. It starts randomly, not from a pretrained
        assistant checkpoint. Forty chosen-response SFT updates at learning rate 0.001 initialize
        the policy. The full training-response NLL falls from 6.934535 to 5.769031 nats. Then copy
        the reference and construct TRL 1.14.2's <Code>DPOTrainer</Code> with the real text columns
        and <Code>processing_class=tokenizer</Code>. This GPT2 and the constructed TinyLM are
        different architectures; numerical parity means comparing two objectives on this
        <em> same GPT2 state and batch</em>.
      </Prose>
      {/* D20: actual native 16x85 batch, 398 target positions, four-score/per-pair decomposition and same-state loss/gradient discrepancy. */}
      <NativeParity />
      <Prose>
        Inspect the native dataset and collator before trusting the trainer label. The first eight
        pairs become 16 rows of padded width 85, with 398 response targets. The program checks exact
        prompt/chosen/rejected IDs against its independently prepared records and checks the
        chosen-first batch, attention and completion masks. On the same warm-started weights, native
        and manual losses both equal 0.6931471825; the maximum absolute policy-gradient difference
        is about 3.353 × 10⁻⁸, below the declared 2 × 10⁻⁵ tolerance. Equality of the initial loss
        alone would be weak evidence because every relative margin is zero; checking all parameter
        gradients also checks the differentiated computation.
      </Prose>
      <Program
        file="trl_dpo.py"
        title="Current native DPOTrainer: exact preparation, parity, fitting and held-out observations"
      />
      <Prose>
        <Code>prepare</Code> fixes the training-only tokenizer and exact row membership;
        <Code>verify_preparation</Code> compares the trainer's normal text route to independently
        constructed IDs and masks. <Code>parity</Code> compares two copies of identical weights,
        uses evaluation mode to avoid a training-token counter side effect, and flushes its
        diagnostic metric queue through the public logging method. <Code>assess</Code> computes
        per-pair held-out quantities directly instead of inferring them from mixed training logs.
        The actual 40-update fit then uses batch size eight, β = 0.2, constant learning rate 0.001,
        zero weight decay, norm limit one, seed/data seed 43 and no reference synchronization.
      </Prose>
      <Prose>
        The installed configuration field is <Code>precompute_ref_log_probs</Code>; this run keeps
        it false. The first attempted native program used an obsolete spelling and stopped after its
        warm-start, before any DPO update. The corrected configuration is validated earlier, and a
        separate no-fit preflight checked the actual interface before the corrected run. Its
        original failure and source are available in the bundle's provenance. No scientific setting
        or selected row was tuned in response to a preference result.
      </Prose>
      <Prose>
        For larger pretrained models, the same data, mask and objective checks still matter, while
        adapters, precision, distributed state and memory scheduling become additional engineering
        choices. This runnable route deliberately uses a from-configuration model so it needs no
        gated checkpoint or API key. It does not certify an unexecuted production deployment or
        claim a particular model size will fit a particular GPU.
      </Prose>

      <Anchor id="8-what-scales-and-what-doesn-t" />
      <H2>9. Freeze what a reference cache means</H2>
      <Prose>
        In each DPO step the reference weights are fixed. If the exact two token sequences and masks
        are also fixed, their two reference sums can be computed once and reused. A cache row is
        more than two numbers: it is a claim about which model state and scoring inputs produced
        those numbers. Draw that lineage before comparing runtime costs.
      </Prose>
      {/* D21: two-score cache linked to reference/tokenizer/template/IDs/masks/order; one policy-only change remains valid. */}
      <CacheLineage />
      <Prose>
        Start at the frozen reference identity and follow the tokenizer, template, token IDs,
        attention/completion masks and row ordering into the stored sums. A policy update changes
        none of those reference inputs, so the cache remains valid. An added assistant header, a
        different EOS rule or a swapped pair order changes the claim even if the reference
        checkpoint filename stays the same. The cache validator rejects that mismatch; changing a
        hash to match old scores would not recompute the promised quantity.
      </Prose>
      <Program
        file="reference_cache.py"
        title="Cache reference sums with semantic identity and exact gradient comparison"
      />
      <Prose>
        <Code>cache_key</Code> requires an evaluation-mode reference with gradients disabled and
        records all relevant identities. <Code>read_cache</Code> checks the semantic key, row count
        and stored-score digest before returning a tensor. The executed comparison gives the same
        0.6931471825 loss with or without caching and maximum gradient difference zero. After a
        deliberate policy-weight perturbation, both routes give 0.6929057240 and still have gradient
        difference zero. This is a no-fit perturbation test, not another training result. Reference,
        tokenizer, template, token, mask, order and score-byte mutations are each rejected.
      </Prose>
      <Prose>
        Caching can remove repeated reference forwards from the update loop, at the cost of
        precomputation, storage and invalidation. It does not remove the chosen/rejected policy
        forwards or their backward pass. Concatenating candidates into one batch is not four
        independent models, and “two scores per pair” is not a universal memory-saving percentage:
        weights, optimizer state, activations, sequence lengths and scheduling also matter.
        Stochastic reference dropout would make a cache and a fresh draw different random
        computations; the exact comparison here disables it.
      </Prose>

      <Anchor id="6-visual-walkthrough" />
      <Anchor id="7-decision-matrix" />
      <Anchor id="9-failure-modes-and-gotchas" />
      <H2>10. Read the evidence separately</H2>
      <Prose>
        Lower training loss says the model better fits supplied training comparisons under this
        objective. It does not directly tell us how well new comparisons are discriminated, how
        calibrated their probabilities are or how free responses read. Keep the four held-out
        sequence scores, response lengths and literal texts connected so one attractive average
        cannot hide the quantity it summarizes.
      </Prose>
      {/* D22: actual 64 held-out rows, raw/reference gaps, relative margins, lengths and chosen/rejected changes; no invented trend fit. */}
      <EvidenceReadout />
      <Prose>
        For each chosen-oriented pair, let p be its modeled preference probability and its supplied
        label be one. Binary cross-entropy, or BCE, is −log p for that row: it is the same logistic
        loss evaluated on held-out comparisons. The Brier score is (p − 1)², the squared probability
        error. Average each quantity over the held-out pairs; smaller is better for both. Agreement
        counts p above 0.5 as one, below 0.5 as zero and an exact tie as one half. It ignores how
        far the probability lies from that threshold.
      </Prose>
      <Prose>
        After native DPO, the implicit comparison model agrees with the supplied chosen label on 36
        of 64 held-out pairs, or 0.5625. Its average chosen log probability rises by 0.421455 nats
        and rejected log probability falls by 0.662779. Yet BCE worsens from 0.693147 to 0.728696,
        and Brier score worsens from 0.25 to 0.260136. Agreement only asks which side of 0.5 a
        prediction lies on; the probability losses also penalize confidence on the wrong side. A
        gain in one metric need not imply a gain in another.
      </Prose>
      <LessonTable
        caption="Native held-out comparison evidence; the same 64 untouched prompt-family-separated pairs"
        headers={['Quantity', 'Initial policy = reference', 'After 40 DPO updates']}
        rows={[
          ['Implicit agreement, ties half', '0.5', '0.5625'],
          ['Pair BCE, nats', '0.693147', '0.728696'],
          ['Brier score', '0.25', '0.260136'],
          ['Mean chosen log-probability change, nats', '0', '+0.421455'],
          ['Mean rejected log-probability change, nats', '0', '−0.662779'],
          [
            'Mean chosen/rejected response targets',
            '24.671875 / 18.171875',
            '24.671875 / 18.171875',
          ],
        ]}
      />
      <Prose>
        The initial implicit probability is exactly 0.5 because current and reference scores
        coincide; it is not a measurement that the initial model has random semantic knowledge.
        These held-out response lengths are fixed properties of the recorded candidates, not lengths
        sampled from the policy. The chosen candidates average more tokens here. That correlation
        motivates inspecting length and subgroup counts, but does not by itself establish that the
        loss learned a length shortcut. A controlled label/content/length comparison would be needed
        for that causal claim.
      </Prose>
      <Prose>
        Teacher-forced pair scores only inspect two supplied paths through the vocabulary tree. Free
        generation can leave both paths immediately. Compare that operation explicitly, then read
        the baseline and final samples from the first four held-out prompts.
      </Prose>
      {/* D23: teacher-forced pair branches beside actual free generated paths, all eight baseline and eight final samples preserved. */}
      <GenerationAudit />
      <Prose>
        The real-data run saves two samples from each prompt at temperature one with a shared
        generator seed 943, stopping at EOS or 24 new actions. A final row-81 sample reads “I'm and
        cable in eating not. [EOS]”. Another final sample reaches the horizon and includes a
        generated BOS token. These are literal observations of an incoherent tiny model, not fresh
        human preference judgments. The bundle keeps all eight baseline and eight final outputs in
        their original order. We do not assign an invented helpfulness win rate to them.
      </Prose>
      <Prose>
        A useful evaluation plan therefore reserves prompt families, reports comparison
        probabilities and raw likelihood changes, examines response lengths and literal failures,
        and separately evaluates newly generated answers under the intended task or a documented
        human judgment protocol. A stronger initial model can make a practical system, but neither
        inherited fluency nor reduced preference loss replaces that evaluation. The shared-parameter
        counterexample explains why the chosen likelihood can even fall while the relative pair
        margin improves.
      </Prose>
      <H3>Run and inspect the complete evidence</H3>
      <Prose>
        Download the self-contained archive below, extract it into a working folder and follow its
        README. The mathematical program needs only the standard library. Install the pinned
        packages in a virtual environment for tensor/native examples. The full runner verifies
        source, data, protocol and environment identities before conserving an existing result. It
        retains failures rather than silently rerunning until an attractive outcome appears. Use a
        new freeze file and output directory for an intentional changed experiment.
      </Prose>
      <Program
        file="dpo_study.py"
        title="Freeze the scientific inputs and retain each stage's outputs and failures"
      />
      <Prose>
        Use <Code>--freeze --freeze-file my-study-freeze.json</Code> to record your own current
        environment, then pass that same <Code>--freeze-file</Code> to the run. The historical
        initial and native-continuation freezes in the archive describe the recorded observations;
        they should not be overwritten with your environment. The initial native failure completed a
        warm-start but no DPO update, and its unpersisted warm-start had to be repeated by the
        explicit API continuation. The constructed fit and the original three no-fit stages were
        conserved. The runner's source/data guards make these execution identities visible.
      </Prose>
      <div className="lesson-file-index">
        <p>
          <a href={root + 'dpo-programs.zip'} download>
            Download all programs, data, provenance and saved results
          </a>
        </p>
        <ul>
          <li>
            <a href={root + 'README.md'}>Setup and commands</a> ·{' '}
            <a href={root + 'requirements.txt'}>Pinned packages</a>
          </li>
          <li>
            <a href={root + 'study-protocol.md'}>Scientific protocol</a> ·{' '}
            <a href={root + 'selection.json'}>Exact native membership and tokenization</a>
          </li>
          <li>
            <a href={root + 'records.json'}>Original comparison records</a> ·{' '}
            <a href={root + 'HH-LICENSE.txt'}>Data license</a>
          </li>
          <li>
            <a href={root + 'results/scratch.json'}>All constructed checkpoints and generations</a>{' '}
            · <a href={root + 'results/native.json'}>All native scores and generations</a>
          </li>
          <li>
            <a href={root + 'results/algebra.json'}>Exact algebra</a> ·{' '}
            <a href={root + 'results/response.json'}>Token/mask observations</a> ·{' '}
            <a href={root + 'results/cache.json'}>Cache comparison</a>
          </li>
          <li>
            <a href={root + 'execution-provenance.json'}>Executed-source provenance</a> ·{' '}
            <a href={root + 'download-manifest.json'}>Archive member checksums</a>
          </li>
        </ul>
      </div>

      <H2>11. When labels and objectives change</H2>
      <Prose>
        So far every row had a chosen orientation. Repeated judgments of the same pair can disagree,
        and a model should not treat their empirical frequency as a certainty of one. Suppose A wins
        eight of ten judgments. Plot the average logistic loss for this one pair as a function of
        its comparison logit z, counting both outcomes.
      </Prose>
      {/* D24: explicit A/B label counts, empirical q, finite optimum and all-wins infinite limit; zero-count invalid state. */}
      <RepeatedLabels />
      <Prose>
        Eight labels contribute −log σ(z); two contribute −log(1 − σ(z)). Their average slope is
        σ(z) − 0.8, which becomes zero at σ(z) = 0.8, or z = log 4 ≈ 1.386294. Five versus five
        gives optimum zero. Ten versus zero has no finite minimum: increasing z keeps reducing this
        unconstrained one-pair loss. This limiting statement assumes the logit can move
        independently; shared parameters and conflicting data can prevent separation. Disagreement
        can reflect ambiguity, different raters or missing context, not only noise.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}
        &\ell_q(z)=q\operatorname{softplus}(-z)\\
        &+(1-q)\operatorname{softplus}(z),\\
        &\frac{d\ell_q}{dz}=\sigma(z)-q,\\
        &z^*=\log\frac{q}{1-q}\ (0<q<1).
      \end{aligned}`}</MathBlock>
      <Prose>
        One response to confidently labelled, potentially noisy pairs is to use a conservative
        target q = 1 − ε rather than one. That deliberately changes the objective and produces
        finite target logit log((1 − ε)/ε) when ε lies strictly between zero and one. Another
        approach, Identity Preference Optimization or IPO, uses a squared relative-gap objective
        with a finite target. Draw the target locations and score reductions before comparing method
        names.
      </Prose>
      {/* D25: logistic/conservative/IPO targets with separately labelled units, then actual sum-versus-mean sign reversal. */}
      <ObjectiveContrast />
      <Prose>
        Under the displayed IPO convention, the relative log-ratio gap is trained toward 1/(2τ),
        where τ is its positive regularization parameter. Its squared residual measures a gap error,
        not an error between a probability and a human rating. At τ = 0.4 the target is 1.25.
        Comparing the heights of logistic and squared loss curves is not an algorithm quality
        comparison because their scales and interpretations differ. The original IPO analysis also
        has population and pair-sampling assumptions; arbitrary missing empirical comparisons do not
        inherit a universal identification guarantee.
      </Prose>
      <MathBlock>{String.raw`\ell_{\rm IPO}=\left[\begin{aligned}
        &\log\frac{\pi_\theta(y^+\mid x)}{\pi_{\rm ref}(y^+\mid x)}\\
        &-\log\frac{\pi_\theta(y^-\mid x)}{\pi_{\rm ref}(y^-\mid x)}\\
        &-\frac{1}{2\tau}
      \end{aligned}\right]^2.`}</MathBlock>
      <Prose>
        Reduction conventions matter just as much as the final loss. Suppose the chosen response
        gains 0.9 nats across three tokens while the rejected response gains 1.2 across six. Summed
        DPO margin is −0.3. Dividing each response's policy and reference sum by its own target
        length gives a mean-score margin of 0.9/3 − 1.2/6 = 0.1, reversing the sign. Equal lengths
        preserve the sign but still rescale the margin. Length normalization therefore changes the
        objective; it is not merely a numerically equivalent speed trick.
      </Prose>
      <Prose>
        In the executed TRL 1.14.2 source, standard sigmoid DPO uses response sums, whereas its IPO
        branch averages completion scores before forming the gap. That is an implementation
        convention to check when comparing a formula to a config. Its plain sigmoid branch also does
        not apply <Code>label_smoothing</Code> simply because that configuration field exists. The
        conservative logistic calculation above is explicit in the scratch algebra; it is not a
        claim that setting that field changes this native sigmoid run.
      </Prose>
      <Prose>
        The dataset itself can change too. An offline objective can be placed inside a larger cycle
        that periodically samples a new policy and obtains new judgments. Keep the dataset version,
        current policy and reference version separate when drawing that cycle.
      </Prose>
      {/* D26: new generated candidates -> external judgment -> new fixed pair dataset -> direct updates, explicit reference-version choice. */}
      <DataRefresh />
      <Prose>
        A new policy may generate answers unlike the old dataset's candidates. Fresh judgments can
        cover those behaviours, after which the next training segment still fits a fixed collection
        of pairs. A human label, a model judge and a verifiable rule carry different evidence and
        failure modes; the DPO loss does not erase those distinctions. Changing the reference is
        another explicit choice and invalidates old reference caches. The diagram describes this
        possible workflow, not a performed online experiment in our small study.
      </Prose>
      <Prose>
        DPO removes a particular sampled reward-optimization loop from the direct fitting step. It
        does not remove the need for a useful initial policy, sound comparisons, correct
        tokenization and independent evaluation. The next lesson, SimPO, changes the score by using
        a length-normalized policy term without an explicit reference and adds a target margin. The
        sum-versus-mean example makes clear why that is a new objective to derive, not an
        interchangeable switch in the formula we have just implemented.
      </Prose>

      <Anchor id="11-self-check-exercises" />
      <H2>12. Practice with changed cases</H2>
      <Prose>
        These problems change the scores, masks, parameter sharing or experimental decision. Draw
        the relevant objects before calculating. Hints and worked solutions are independent of the
        live examples above; you can open either whenever it helps.
      </Prose>
      <Exercise
        title="1. What did the label actually establish?"
        hint={
          <Prose>
            Separate the requested behaviour, the evidence available to a judge and factual truth.
          </Prose>
        }
        solution={
          <Prose>
            The prompt needs a criterion for a useful uncertainty estimate: evidence, calibration or
            an explicit account of what is unknown. A confident answer can sound persuasive while
            being unsupported; a cautious answer can also be unhelpfully vague. Record the
            criterion, information available to the judge and the selected answer. A preference
            label establishes that comparison under that procedure. It does not establish that the
            forecast is true or that its confidence is calibrated. Calibration requires outcomes
            across relevant forecasts, beyond one pair.
          </Prose>
        }
      >
        A user asks how certain a weather forecast is. Answer A confidently asserts certainty; B
        explains uncertainty but omits a number. A collector marks A preferred. What information is
        missing before you treat this as a useful training comparison?
      </Exercise>
      <Exercise
        title="2. Relative gain versus raw probability"
        hint={
          <Prose>
            Subtract reference from policy separately for A and B, then subtract those gains.
          </Prose>
        }
        solution={
          <>
            <Prose>
              A gains −5 − (−7) = 2 nats; B gains −4 − (−5.5) = 1.5 nats. The relative margin is 0.5
              nats in favour of A. Nevertheless, the policy's raw log-probability gap is −1, so A
              has exp(−1) times B's complete-response probability. The reference gap was −1.5. DPO's
              relative comparison says the A-to-B odds improved from that reference; it does not say
              A is now the more probable answer.
            </Prose>
          </>
        }
      >
        The policy scores A at −5 and B at −4. The reference scores A at −7 and B at −5.5. Compute
        the DPO margin. Which response is more probable under the policy?
      </Exercise>
      <Exercise
        title="3. Follow the loss and both score derivatives"
        hint={
          <Prose>
            Use z = βm, stable softplus(−z), and a common derivative magnitude β sigmoid(−z).
          </Prose>
        }
        solution={
          <>
            <Prose>
              The gains are 0.4 and −0.2, giving m = 0.6 and z = 0.18. The modeled preference
              probability is 0.544879; the loss is 0.607192. The derivative magnitude is 0.3 × (1 −
              0.544879) = 0.136536. The chosen-score derivative is −0.136536 and the rejected-score
              derivative is +0.136536. These signs describe derivatives with respect to the two
              scores. A shared parameter step also depends on their score Jacobians.
            </Prose>
          </>
        }
      >
        Let β = 0.3, policy scores (−2.4, −3.1) and reference scores (−2.8, −2.9), with A preferred.
        Compute the margin, preference probability, loss and derivatives with respect to both policy
        scores.
      </Exercise>
      <Exercise
        title="4. Where can probability go?"
        hint={
          <Prose>
            The DPO margin uses a difference. A normalized policy includes responses besides the two
            observed ones.
          </Prose>
        }
        solution={
          <Prose>
            Each relative gain decreases by 0.7, so their difference, βm and pair loss stay
            unchanged. Each compared response's probability is multiplied by exp(−0.7),
            approximately 0.4966. In a full normalized output distribution, their removed mass can
            move to other responses. If A and B were the only possible outcomes, decreasing both
            masses without renormalization would be invalid. In a language model they usually occupy
            only a small part of the output space.
          </Prose>
        }
      >
        Both policy sequence log-probabilities decrease by 0.7 while reference scores stay fixed.
        Does this pair's DPO loss detect that change? Explain how both probabilities can decrease.
      </Exercise>
      <Exercise
        title="5. Build shifted masks when padding equals EOS"
        hint={
          <Prose>
            Label token positions 0–7. A target at token position j is predicted by logits at j − 1.
          </Prose>
        }
        solution={
          <>
            <Prose>
              Both prompts occupy positions 0, 1 and 2. Row A's response occupies 3 and 4, with real
              EOS at 4; its token-aligned response mask is [0, 0, 0, 1, 1, 0, 0, 0]. The shifted
              target mask over seven prediction rows is [0, 0, 1, 1, 0, 0, 0], selecting two terms.
              Row B occupies response positions 3–6, with EOS at 6; its masks are [0, 0, 0, 1, 1, 1,
              1, 0] and [0, 0, 1, 1, 1, 1, 0], selecting four terms. Attention retains real prompt
              and response positions, including EOS, but excludes padding after lengths 5 and 7.
              Testing the token ID against EOS would incorrectly remove a genuine training target.
            </Prose>
          </>
        }
      >
        Two rows have prompt length 3 and response lengths 2 and 4, including EOS. Both are
        right-padded to length 8, and PAD uses the EOS ID. Write each response mask before and after
        the causal shift.
      </Exercise>
      <Exercise
        title="6. Preserve the comparison's meaning"
        hint={<Prose>Ask whether the scorer still receives the completion that was judged.</Prose>}
        solution={
          <Prose>
            Reject the whole pair from this bounded-context experiment and record why, or design a
            new rendering with sufficient context and verify that the original judged responses and
            relevant context remain intact. If the text actually changes, obtain an appropriate new
            judgment rather than silently reusing the old one. Independently tokenize the fully
            rendered prompt-plus-response and check the boundary: a token spanning the boundary can
            make a separately tokenized prompt length wrong even without truncation. Stable
            delimiters or template-aware span construction address boundaries; a larger context
            budget alone does not.
          </Prose>
        }
      >
        A preference turns on the last two tokens, but the context limit removes the final token.
        The pipeline keeps the old label and calls the remaining prefix the chosen answer. Repair
        this procedure and distinguish this problem from a token crossing the prompt boundary.
      </Exercise>
      <Exercise
        title="7. Reweight and normalize a different policy"
        hint={
          <Prose>
            Compute each reference mass times exp(reward/β), then sum all three weights.
          </Prose>
        }
        solution={
          <>
            <Prose>
              The unnormalized weights sum to Z = 1.152745, with log Z = 0.142146. Dividing by Z
              gives [0.367297, 0.337803, 0.294900]. Adding 3 to every reward multiplies every weight
              and Z by exp(3/0.8) = exp(3.75). That common factor cancels. The normalized policy is
              unchanged although the expected reward and objective value shift by 3.
            </Prose>
          </>
        }
      >
        For reference probabilities [0.2, 0.5, 0.3], rewards [0.6, −0.2, 0.1] and β = 0.8, find Z
        and the ideal tilted policy. What changes if every reward increases by 3?
      </Exercise>
      <Exercise
        title="8. Diagnose support and prompt identity"
        hint={
          <Prose>
            Inspect the denominator in each log ratio and the argument of each normalizer.
          </Prose>
        }
        solution={
          <Prose>
            Positive candidate mass where the reference has zero mass makes forward KL infinite, so
            it cannot be a finite-KL candidate under this objective. Adding epsilon and
            renormalizing creates a different reference and therefore a different optimization
            problem; it is not an exact evaluation of the original ratio. For different prompts, the
            recovered rewards contain β log Z(x₁) and β log Z(x₂). Their difference generally
            remains. The same-prompt cancellation that yields the simple DPO margin therefore does
            not justify comparing two unrelated requests this way.
          </Prose>
        }
      >
        A reference assigns zero mass to C, but a candidate policy assigns C probability 0.1. A
        colleague adds epsilon to the reference and also compares answers from different prompts,
        claiming both operations preserve the derivation. Assess the two claims.
      </Exercise>
      <Exercise
        title="9. A new shared-parameter counterexample"
        hint={
          <Prose>
            The log-probability difference cancels the softmax normalizer, so log π(A) − log π(B) =
            2θ.
          </Prose>
        }
        solution={
          <>
            <Prose>
              At θ = 0 both the reference and policy are uniform. The margin is m = 2θ, so at zero
              the derivative is −β × (1/2) × 2 = −0.6. Gradient descent gives θ = 0 − 0.2 × (−0.6) =
              0.12. The new logits are [0.24, 0, 0.84], producing probabilities [0.277105, 0.217978,
              0.504917]. A falls from 1/3 even though the relative margin rises to 0.24. With z =
              0.144 the pair loss falls to 0.623737. The third response receives enough mass to
              lower both compared probabilities.
            </Prose>
          </>
        }
      >
        Use logits (2θ, 0, 7θ), a uniform frozen reference, θ = 0, β = 0.6 and learning rate 0.2. A
        is preferred to B. Compute one exact gradient-descent step and the three new probabilities.
        Did A's probability increase?
      </Exercise>
      <Exercise
        title="10. Two meanings of changing beta"
        hint={<Prose>State what stays fixed in each question before taking a limit.</Prose>}
        solution={
          <Prose>
            At fixed margin zero, the score-gradient magnitude is β/2. Doubling β doubles it; for
            example β = 0.2 gives 0.1 and β = 0.4 gives 0.2. In the separate ideal fixed-reward
            problem, exp(r/β) tends to 1 as β grows, so the optimal policy approaches the reference.
            As positive β tends toward zero, a finite-action policy concentrates on maximal-reward
            actions that have reference support; tied maxima retain relative reference weights.
            These are different held-fixed questions. Setting β to exactly zero in the training
            formula removes its margin gradient and is not the same as solving that limiting reward
            problem.
          </Prose>
        }
      >
        At margin zero, beta doubles. What happens to the score-gradient magnitude? Separately, for
        fixed rewards and a finite supported action set, what happens to the ideal policy as beta
        becomes very large or tends toward zero?
      </Exercise>
      <Exercise
        title="11. Repair the objective, then test it"
        hint={
          <Prose>
            Restore response sums, pair averaging and an independently frozen reference.
          </Prose>
        }
        solution={
          <>
            <Prose>
              Build valid target positions from response membership and real sequence lengths, shift
              targets and their mask once, gather next-token log-probabilities and sum the selected
              terms separately for each response. Form one four-score margin per pair and average
              the pair losses. Copy the initialized policy to a separate reference, disable its
              parameter gradients, put it in evaluation mode and compute its scores without an
              autograd graph. Give the optimizer only policy parameters. Keeping reference and
              policy as aliases would break the fixed baseline even if reference scores were
              detached.
            </Prose>
            <Prose>
              Append right-padding without changing real tokens: sequence scores, loss and policy
              gradients should remain equal within tolerance. Compare a short row alone and beside a
              longer padded row. Also check the reference state hash before and after a policy step,
              and require its gradients to remain absent. These checks detect the stated failures
              more directly than a declining training loss.
            </Prose>
          </>
        }
      >
        A training loop averages log-probabilities over every padded position and passes both policy
        and reference parameters to its optimizer. Explain a complete repair and propose two
        meaningful invariance checks.
      </Exercise>
      <Exercise
        title="12. Keep held-out families independent"
        hint={
          <Prose>Split the unit that can leak before fitting anything that learns from text.</Prose>
        }
        solution={
          <Prose>
            Group conversations by the stated family rule, then place every member of each family in
            one split. Inspect near-duplicates that the rule may miss; no heuristic establishes
            perfect semantic independence. Fit vocabulary and preprocessing statistics on the
            training split only, then apply the frozen tokenizer to held-out data and report
            coverage or unknown tokens. An implicit reward accuracy of 0.7 is agreement with
            supplied pair labels under relative score differences on that set. It is not a 70% human
            win rate for freshly generated responses.
          </Prose>
        }
      >
        Two variants of the same first human question appear in opposite splits. The tokenizer was
        fitted on both splits, and the report calls held-out implicit reward accuracy 0.7 a human
        win rate. Repair the split and interpret the metric.
      </Exercise>
      <Exercise
        title="13. Does this reference cache still apply?"
        hint={
          <Prose>
            The reference scores depend on the exact scored tokens and masks, not merely on model
            weights.
          </Prose>
        }
        solution={
          <Prose>
            The added assistant header changes rendering and potentially token IDs, context and
            response boundaries, so the old cache is invalid even with unchanged reference weights.
            A policy-only update leaves reference scores valid if every other scoring input stays
            identical. Bind reference state, tokenizer and vocabulary, rendering/template, record
            order or row identities, exact token IDs, attention and completion masks,
            context/truncation convention and response-score reduction. Verify alignment when
            loading the two sums for each pair. This example's cache key names the scoring
            convention; the surrounding study runner additionally binds actual scoring-source bytes.
            A persistent cache reused outside that runner would need that source identity or an
            equally explicit version contract too.
          </Prose>
        }
      >
        The reference weights are unchanged, but a chat template adds an assistant header. In a
        separate run, only policy weights change. Decide which cached reference scores remain valid
        and list the identities you would bind.
      </Exercise>
      <Exercise
        title="14. Interpret an apparently successful run"
        hint={
          <Prose>
            Separate fitted pair separation, absolute likelihood, length and fresh response quality.
          </Prose>
        }
        solution={
          <Prose>
            The loss supports improved fit to the evaluated pair objective. Chosen likelihood can
            fall while rejected likelihood falls faster, increasing the relative margin. Longer
            outputs and failures on unseen prompts prevent a claim of generally better instruction
            following. Reserve an independent prompt set, freeze decoding and comparison criteria,
            then compare fresh baseline and updated responses using an appropriate blinded judgment
            or verifiable task rule. Report length and termination alongside quality, and include a
            length-controlled comparison when verbosity can influence judgments. Do not tune
            repeatedly on that final assessment set and still call it untouched.
          </Prose>
        }
      >
        Pair loss improves, chosen log-probability falls, rejected log-probability falls faster,
        generated length doubles and unfamiliar prompts fail. What has improved, what remains
        unknown, and which additional comparison would address response quality?
      </Exercise>
      <Exercise
        title="15. Distinguish three finite targets"
        hint={
          <Prose>
            For logistic loss with target q, its derivative with respect to z is sigmoid(z) − q.
          </Prose>
        }
        solution={
          <>
            <Prose>
              Seven wins and three losses give q = 0.7. Setting the derivative to zero gives z =
              log(0.7/0.3) = 0.847298. Its relative-margin target is z/β, not z unless β = 1. With
              only wins, the infimum occurs as z grows without bound; there is no finite
              unconstrained minimum. Smoothing a positive label with ε = 0.2 changes its target to q
              = 0.8, so the optimal logit is log 4 = 1.386294. Under the displayed IPO convention, τ
              = 0.25 gives a relative-gap target 1/(2τ) = 2. This is a log-ratio gap, not a
              probability, and is distinct from either logistic logit target.
            </Prose>
          </>
        }
      >
        A repeated pair receives seven A-wins and three B-wins. Derive the logistic optimum and
        contrast it with all wins, a positive label smoothed with ε = 0.2, and the displayed IPO
        target at τ = 0.25.
      </Exercise>
      <Exercise
        title="16. Length normalization changes the question"
        hint={
          <Prose>Divide each response's own gain by its own target count before subtracting.</Prose>
        }
        solution={
          <Prose>
            The summed margin is 1.2 − 1.6 = −0.4. The mean-score margin is 1.2/4 − 1.6/8 = 0.1. The
            sign reverses. A useful controlled comparison holds prompts, quality criteria and
            comparable content fixed while matching response lengths or reporting length strata;
            then inspect both score conventions and independently judge generated quality.
            Constructing semantically equivalent shorter and longer responses also exposes whether
            the label reflects brevity or omitted information. Dividing by length changes the
            objective and does not guarantee that its selected preference is correct.
          </Prose>
        }
      >
        A has four target tokens and gains 1.2 nats relative to the reference. B has eight and gains
        1.6. Compute summed and mean-score margins, then design a comparison that helps distinguish
        a length effect from task quality.
      </Exercise>

      <Anchor id="10-primary-sources" />
      <Sources
        alternatives={
          <>
            <Prose>
              <a href="https://rlhfbook.com/c/08-direct-alignment">
                RLHF Book: Direct-Alignment Algorithms
              </a>{' '}
              places the four-score objective among direct alignment methods. Use its derivation and
              experimental questions after you can trace the local masks and loss; compare its broad
              taxonomy with the exact score reductions used here.
            </Prose>
            <Prose>
              <a href="https://huggingface.co/learn/smol-course/en/unit2/2">
                Hugging Face Smol Course: DPO
              </a>{' '}
              offers a second practical explanation organized around preference records and a
              trainer. It is useful for connecting the dataset schema to everyday library use. Match
              its examples to your installed API and keep the two beta questions separate.
            </Prose>
            <Prose>
              <a href="https://arxiv.org/html/2410.08847v4">
                Unintentional Unalignment: Likelihood Displacement in Direct Preference Optimization
              </a>{' '}
              develops the shared-representation issue beyond our three-logit witness. Read the
              assumptions of its geometric analysis before applying its conclusions to another
              architecture; our one-parameter example establishes possibility rather than
              prevalence.
            </Prose>
          </>
        }
      >
        <li>
          <a href="https://arxiv.org/html/2305.18290v3">
            Rafailov et al., Direct Preference Optimization
          </a>{' '}
          — original regularized-objective derivation, reward equivalence, preference loss and
          experimental setup. Its benchmark results describe those models and evaluations, not a
          universal ranking of alignment methods.
        </li>
        <li>
          <a href="https://proceedings.mlr.press/v238/gheshlaghi-azar24a/gheshlaghi-azar24a.pdf">
            Azar et al., A General Theoretical Paradigm to Understand Learning from Human
            Preferences
          </a>{' '}
          — finite-target preference optimization and the assumptions behind the IPO formulation
          used in section 11.
        </li>
        <li>
          <a href="https://huggingface.co/docs/trl/dpo_trainer">TRL DPOTrainer documentation</a> —
          current dataset, configuration, metrics and reference-cache interfaces. The supplied
          executable route records TRL 1.14.2 and Transformers 5.19.0; inspect versioned source when
          a loss option's reduction matters.
        </li>
        <li>
          <a href="https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/dpo_trainer.py">
            TRL 1.14.2 DPOTrainer source
          </a>{' '}
          — actual collation, causal shift, sequence reduction, loss and metric calculations matched
          by the native parity check.
        </li>
        <li>
          <a href="https://github.com/anthropics/hh-rlhf">Anthropic HH-RLHF data and MIT license</a>{' '}
          — original source for the supplied small helpful-base record subset. The download retains
          the selected texts, family split and source digest so the local experiment can be audited
          offline.
        </li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>15. What you can now do</H2>
        <Prose>
          You can turn one same-prompt comparison into four response scores, trace their shifted
          token masks, derive the reference-relative loss and explain what its gradient does to
          shared parameters. You can run a complete causal-model update or the ordinary trainer,
          test their score and gradient contracts, validate a reference cache and separate pair fit
          from generated-response quality. The next useful question is which parts of this objective
          should change when there is no explicit reference model. Carry the length, margin and
          evaluation distinctions into SimPO rather than carrying over a quality promise.
        </Prose>
      </section>
    </div>
  ),
};

export default dpo;
