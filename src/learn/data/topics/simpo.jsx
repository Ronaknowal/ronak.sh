import { Prose, H2, Code } from '../../../../src/learn/components/content';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {
  LessonIntro,
  LessonTable,
  Sources,
} from '../../../../src/learn/components/lesson-labs/LessonElements.jsx';
import {
  MathEquation as MathBlock,
  PairRequest,
  ComputationRoles,
  CausalGather,
  TargetMasks,
  SumToMean,
  ProbabilityTree,
  SegmentationAndEOS,
  MarginPipeline,
  SoftThreshold,
  MarginUnits,
  TokenCredit,
  SharedContext,
  RankVersusSample,
  OrientedLinks,
  SharedMassDrift,
  AuxiliaryTerm,
  ScratchLoop,
  AblationOutcomes,
  RecordAndSplit,
  NativeBatch,
  ConfigurationMap,
  MeasuredScoreAudit,
  GeneratedOutputs,
  CostRoles,
  ContradictoryLabels,
  ObjectiveCoordinates,
  OfflineAndRefresh,
} from '../../../../src/learn/components/lesson-labs/SimPOFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';

const root = '/learn/examples/simpo/';
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

const simpo = {
  title: 'SimPO (Simple Preference Optimization)',
  readTime: '~65 min read + programs and practice',
  content: () => (
    <div className="lesson-flow simpo-flow">
      <LessonIntro
        prerequisites="DPO supplies a comparison and a reference-relative loss. Causal Language Modeling supplies next-token logits; SFT supplies response-target supervision. We rebuild the exact masks and score reductions here. Logs, derivatives and a softmax distribution help."
        exampleKind="Python + complete causal-model updates and current native CPOTrainer in SimPO mode"
      >
        Follow two answers from their tokens to a mean score, a desired gap and a shared model
        update. Sections 1–6 establish the mechanism; section 7 examines policy drift. Sections 8–10
        run complete programs and read their actual outcomes. Section 11 extends the reasoning to
        conflicting labels and other objectives. Finish with changed cases and further learning.
      </LessonIntro>

      <Anchor id="1-why-it-exists" />
      <Anchor id="1-start-with-the-problem" />
      <H2>1. Keep the comparison, change the score</H2>
      <Prose>
        Ask, “Name France's capital in one word.” Candidate A says “Paris”; candidate B says “Paris
        is the capital of France.” Both contain the relevant fact, but only A follows this requested
        format. Suppose our comparison record selects A. The record gives us a direction for
        learning; it does not say either answer's model probability or how much better A is.
      </Prose>
      <PairRequest />
      <Prose>
        The request branches into two whole responses, while the supplied label sits beside them.
        Change the request to ask for a sentence and the stipulated label changes. Remove the format
        requirement and this example alone no longer justifies the same preference. Response
        identity stays fixed through the lesson: A is amber, B violet and a third possible response
        C cyan. A preference method still needs comparisons that express the behavior we actually
        want.
      </Prose>
      <Prose>
        In{' '}
        <a href="/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models">
          DPO
        </a>
        , each response is scored by both a trainable policy and a fixed reference. Subtracting
        their log probabilities measures a relative change. SimPO asks whether we can train directly
        from the policy's own response scores, while adjusting their length reduction and desired
        gap. First locate the computations that this choice keeps and removes.
      </Prose>
      <ComputationRoles />
      <Prose>
        Both branches run through the same policy weights. The policy-only path produces two scores
        and one comparison loss; the DPO path additionally consumes two frozen-reference scores.
        Removing those reference computations is concrete. Removing every source of policy drift is
        not a consequence of it. SimPO changes the scoring rule and objective; it is not DPO's
        regularized-objective derivation with an inconvenient implementation deleted.
      </Prose>
      <Prose>
        The three pieces we will build are a mean response log-probability, a positive scale β
        called beta, and an absolute target margin γ called gamma. They need precise meanings before
        they become configuration fields. Begin with what one response score actually sums.
      </Prose>

      <Anchor id="2-core-intuition" />
      <Anchor id="2-build-the-intuition" />
      <H2>2. Follow one response through the model</H2>
      <Prose>
        A causal decoder receives a prompt followed by a supplied response. At each position it
        predicts the next token from earlier context. Scoring a response means reading the model's
        probability for each of those supplied next tokens. This is teacher forcing: a
        low-probability supplied token remains in the input for later predictions, even if a sampler
        would have chosen something else.
      </Prose>
      <CausalGather />
      <Prose>
        Follow the row containing BOS, Q, Paris and EOS. The output after Q predicts Paris; the
        output after Paris predicts EOS, the end-of-sequence token. Each output is a vector over the
        vocabulary. Log-softmax converts that vector into log probabilities, and gathering selects
        the coordinate for the supplied target. The last input position has no following target
        here. We shift logits against target IDs once, not once in each of two helpers.
      </Prose>
      <MathBlock>{String.raw`a_t=\log\pi_\theta(y_t\mid x,y_{<t}),\qquad s_\theta(x,y)=\sum_{t=1}^{L_y}a_t=\log\pi_\theta(y\mid x)`}</MathBlock>
      <Prose>
        Here x is the prompt, y the scored suffix, θ the shared model parameters, L the number of
        genuine response targets and a the selected token log probability. The product rule for a
        causal sequence becomes this sum after taking logs. When EOS is included, the event includes
        termination there; omitting EOS scores a prefix event instead. These are different
        quantities even when the visible words are identical.
      </Prose>
      <Prose>
        Real batches need a second distinction. Attention describes which input positions exist as
        context; supervision describes which next-token predictions enter this objective. A prompt
        can be fully visible to the response while its own targets contribute no loss.
      </Prose>
      <TargetMasks />
      <Prose>
        In the attention triangle, each real response position can read the earlier prompt and
        response. In the target row, only the response and its genuine EOS count. Right padding
        fills the rectangular batch but contributes neither context nor targets. Toggle PAD=EOS: the
        numerical token ID now appears both at a real stop and in padding, yet only the real stop
        counts. A token-ID inequality cannot recover that positional distinction.
      </Prose>
      <MathBlock>{String.raw`m_t=\mathbf1[\text{response target at }t]\,\mathbf1[\text{real target and predictor}],\quad s=\sum_t m_t a_t,\quad L=\sum_t m_t>0`}</MathBlock>
      <Prose>
        The complete scorer validates a nonempty prompt and response, rejects targets in padding,
        and rejects a target at the first input position because it has no preceding predictor. A
        zero target count is an error, not a denominator to clamp to one. Appending padding or
        reordering rows must preserve the corresponding scores. The
        <a href="/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models#3-choose-the-predictions-that-count">
          {' '}
          SFT target-mask explanation
        </a>
        uses the same separation between visibility and selected targets.
      </Prose>

      <H2>3. Divide by what was actually scored</H2>
      <Prose>
        Adding another token adds another nonpositive log probability. A whole-path sum therefore
        reflects both the probabilities of its actions and how many actions it contains. SimPO
        changes the response score by dividing that sum by its own genuine target count. Examine an
        example where that changes the ordering before assigning the result a meaning.
      </Prose>
      <SumToMean />
      <Prose>
        A's two contributions −0.4 and −0.6 sum to −1. B's four contributions −0.2, −0.3, −0.4 and
        −0.3 sum to −1.2. The sum prefers A because −1 is larger. Their means are −0.5 and −0.3, so
        the mean prefers B. B's individual actions are easier on average, although the probability
        of the complete supplied path is lower. These stipulated terms illustrate a scoring
        distinction; they do not imply that longer answers are better or worse.
      </Prose>
      <MathBlock>{String.raw`u_\theta(x,y)=\frac{s_\theta(x,y)}{L_y},\qquad \exp(u_\theta)=\left(\prod_{t=1}^{L_y}\pi_\theta(y_t\mid x,y_{<t})\right)^{1/L_y}`}</MathBlock>
      <Prose>
        The exponential of u is the geometric mean of the target probabilities. It is positive and
        at most one. It is not generally the probability of a complete response. To see why, use a
        complete probability tree, with every possible leaf and every stop transition shown.
      </Prose>
      <ProbabilityTree />
      <Prose>
        The first choice gives A probability .4, B .3 and C .3. A and C each take a forced EOS edge
        of probability one. B splits into suffixes with probabilities .9 and .1, each then taking a
        forced EOS edge. The completed leaf masses are .4, .27, .03 and .3, which sum to one. A's
        two scored targets give geometric mean √.4, about .6325. B1's three targets give the cube
        root of .27, about .6463. B1 wins the mean ranking even though A is sampled more often in
        expectation. The forced edges contribute zero log probability but still count as targets;
        leaving them out silently changes the mean.
      </Prose>
      <Prose>
        The same issue makes tokenization and termination substantive parts of the objective. A
        score per token uses a unit chosen by the tokenizer. It does not automatically remove
        length-related artifacts in the comparisons, the model or the evaluation.
      </Prose>
      <SegmentationAndEOS />
      <Prose>
        Hold an event's stipulated log probability at −2. Represent it as two scored targets and the
        mean is −1; represent it as four and the mean is −.5. This arithmetic isolates the
        denominator. Changing a real tokenizer also changes the model's parameters and event
        representation, so it is not a neutral deployment switch. Likewise, adding an EOS term
        changes both the numerator and denominator. Freeze tokenizer, template, response boundary
        and stop convention when comparing objectives.
      </Prose>

      <Anchor id="3-mathematical-foundation" />
      <Anchor id="3-make-the-idea-precise" />
      <H2>4. Ask for a larger gap</H2>
      <Prose>
        We now have one mean score for each response. The supplied comparison asks the chosen mean
        to exceed the rejected mean. SimPO goes further: it subtracts a positive margin from the
        scaled gap before applying a smooth logistic loss. Walk through one pair first.
      </Prose>
      <MarginPipeline />
      <Prose>
        Means −.5 and −.8 produce gap d=.3. Multiplying by β=2 gives .6; subtracting γ=.4 gives
        logit z=.2. The loss is softplus(−.2), about .598139. Softplus is the smooth function
        log(1+exp(v)); computing it stably avoids overflow for large v. Minimizing this loss pushes
        z upward, which pushes the chosen-minus-rejected mean gap upward.
      </Prose>
      <MathBlock>{String.raw`d=u_\theta(x,y^+)-u_\theta(x,y^-),\quad z=\beta d-\gamma,\quad \ell=-\log\sigma(z)=\operatorname{softplus}(\gamma-\beta d)`}</MathBlock>
      <Prose>
        Superscripts + and − identify the supplied chosen and rejected suffixes; σ is the sigmoid
        1/(1+exp(−z)). Training averages this loss over comparison records. The original paper calls
        β times the mean an implicit reward. Here that is a policy-derived training score, not a
        separately fitted reward model or an independently validated quality score.
      </Prose>
      <SoftThreshold />
      <Prose>
        The marked gap γ/β is where z becomes zero. At β=2 and γ=.4 this is d=.2, with loss log 2,
        about .693147, and derivative −1. Training has not stopped there. Above it, the loss and
        gradient decrease smoothly but remain nonzero at every finite gap. A hinge loss would
        instead have a flat region; the comparison curve names that different choice. A larger
        margin strengthens the gradient at a fixed current gap. A zero margin still learns.
      </Prose>
      <MathBlock>{String.raw`\frac{\partial\ell}{\partial d}=-\beta\sigma(\gamma-\beta d),\qquad \ell(\gamma/\beta)=\log2,\qquad \ell'(\gamma/\beta)=-\beta/2`}</MathBlock>
      <Prose>
        There are two legitimate margin units. The absolute margin γ is subtracted after scaling.
        The ratio δ=γ/β specifies the desired gap in unscaled mean-log-probability units. Confusing
        them changes the objective. This matters when moving between the original implementation's
        gamma/beta-ratio setting and TRL's absolute <Code>simpo_gamma</Code> field.
      </Prose>
      <MarginUnits />
      <Prose>
        With β=2, γ=.4 and δ=.2 describe the same boundary. If β changes while γ stays fixed, the
        desired gap changes. If δ stays fixed instead, γ must change with β. Even holding δ fixed
        does not keep gradient magnitude or sharpness fixed. Beta must be positive for this
        parameterization; at beta zero with fixed gamma, the loss is constant in d and supplies no
        preference-learning gradient. Beta is not an explicit KL constraint in this objective.
      </Prose>
      <Prose>
        To run the full mathematical program, download the
        <a href={root + 'simpo-programs.zip'} download>
          {' '}
          complete SimPO archive
        </a>{' '}
        and extract it. The <a href={root + 'README.md'}>README</a> gives virtual-environment
        activation commands; create it with <Code>python -m venv .venv</Code> and install
        <Code>python -m pip install -r requirements.txt</Code>. The pinned versions are in
        <a href={root + 'requirements.txt'}> requirements.txt</a>. Run
        <Code>python -B simpo_algebra.py --output algebra-results.json</Code> from the extracted
        directory. This first program uses only Python's standard library and performs no fitting.
      </Prose>
      <Program
        file="simpo_algebra.py"
        title="Complete score, margin, probability-tree and drift mathematics"
      />
      <Prose>
        Read <Code>pair</Code> as the wired computation above. <Code>probability_tree</Code>
        enumerates complete paths instead of normalizing their geometric means into a new invented
        sampler. <Code>softplus</Code> and <Code>sigmoid</Code> avoid large positive exponentials.
        The checks compare derivatives with finite differences, include arguments of magnitude 1000,
        and verify that the threshold is neither zero loss nor zero gradient. Later sections explain
        the same program's shared-logit and conflicting-label routines.
      </Prose>

      <H2>5. Follow the gradient back to tokens</H2>
      <Prose>
        A mean score is built from token contributions, so the pair derivative must pass through
        each division. First treat selected log probabilities as separate coordinates. Then
        reconnect those coordinates to the single shared causal model that actually generates them.
      </Prose>
      <TokenCredit />
      <Prose>
        Let w=βσ(γ−βd), which is positive. Every chosen token contribution receives coefficient
        −w/L₊; every rejected contribution receives +w/L₋. With two chosen and four rejected
        targets, the individual rejected coefficients are half the magnitude of the chosen
        coefficients. The coefficients sum to −w on the chosen path and +w on the rejected path
        before averaging across pairs. This equal path sum does not imply equal parameter-gradient
        norms.
      </Prose>
      <MathBlock>{String.raw`\frac{\partial\ell}{\partial a_t^+}=-\frac{w}{L_+},\quad \frac{\partial\ell}{\partial a_t^-}=\frac{w}{L_-},\qquad \nabla_\theta\ell=-w\left(\frac1{L_+}\sum_t\nabla_\theta a_t^+-\frac1{L_-}\sum_t\nabla_\theta a_t^-\right)`}</MathBlock>
      <Prose>
        A log probability is itself a log-softmax coordinate. Its logit derivative is the selected
        target's one-hot vector minus the vocabulary probability vector. Increasing one vocabulary
        logit also changes the normalizer, and every response uses the same parameters. The formula
        therefore does not license independently adding a constant to chosen tokens and subtracting
        one from rejected tokens. The token Jacobians, shared contexts and optimizer determine the
        actual parameter displacement. A batch mean adds division by the number of pairs.
      </Prose>
      <SharedContext />
      <Prose>
        The first response loss flows through its vocabulary head, causal blocks and prompt context.
        Crossed-out prompt targets mean “do not score those predictions,” not “erase these inputs.”
        In the complete decoder probe, the unique BOS, request and country embeddings all receive
        nonzero gradients from the first response target alone. Recomputing its predictor on the
        truncated prefix gives the same logits: future supplied response tokens cannot affect it.
        This connects the target mask to the actual attention computation.
      </Prose>
      <Program
        file="response_scores.py"
        title="Complete causal sum/count scoring and mean-score pair gradients"
      />
      <Prose>
        Run <Code>python -B response_scores.py --output response-scores-results.json</Code>.
        <Code>pack</Code> records attention and completion masks separately.{' '}
        <Code>response_scores</Code>
        aligns logits at positions before each target, gathers their log probabilities and reduces
        only valid response positions. <Code>pair_loss</Code> divides by each row's own positive
        count, subtracts the chosen and rejected means, then averages pair losses. Rows must be all
        chosen followed by all rejected; an arbitrary interleaving changes which pairs you train.
      </Prose>
      <Prose>
        The ordinary Torch route uses log-softmax, gather, masks and autograd. The explicit formulas
        provide an independent way to check it. The program also verifies genuine EOS with PAD=EOS,
        single/batch scores, appended padding, reordered rows and malformed boundaries. These score
        operations cost O(BTV) for vocabulary normalization plus O(BT) for gathering and reduction
        on existing logits; the causal decoder still pays its own attention and width costs.
        Omitting a reference pass does not remove those costs.
      </Prose>

      <H2>6. What mean-score ranking says about generation</H2>
      <Prose>
        Pair training reads supplied suffixes. Generation makes a sequence of fresh choices. They
        share a model but answer different questions. Return to the complete tree to separate the
        response selected by mean score from the responses produced by its actual transitions.
      </Prose>
      <RankVersusSample />
      <Prose>
        Mean scoring prefers B1 over A, while the unchanged sampler reaches them with probabilities
        .27 and .4. C and B2 remain possible even though our comparison mentions neither. A finite
        sample may fluctuate around those probabilities; it does not turn the geometric-mean ranking
        into a sequence distribution. Greedy decoding, temperature changes and beam length penalties
        introduce additional decision rules. State the decoding rule when claiming that a training
        score aligns with generation behavior.
      </Prose>
      <Prose>
        There is another subtle distinction in the margin loss. A sigmoid expression resembles a
        two-choice probability, but the two label orientations no longer complement each other when
        each subtracts the same positive margin. Draw both orientations before interpreting it.
      </Prose>
      <OrientedLinks />
      <Prose>
        The A-chosen orientation uses σ(βd−γ); reversing the record uses σ(−βd−γ). At d=0 and
        positive gamma, both are below one half. Their sum is below one, not one. With gamma zero
        the complementary identity returns. The shifted logistic link supplies a useful smooth
        training objective, but these two oriented values cannot be the two probabilities of one
        calibrated binary human judgment. An empirical preference win rate needs actual judgments
        under a specified evaluation, not a relabelled loss output.
      </Prose>
      <MathBlock>{String.raw`\sigma(\beta d-\gamma)+\sigma(-\beta d-\gamma)<1\quad(\gamma>0),\qquad \sigma(\beta d)+\sigma(-\beta d)=1`}</MathBlock>

      <H2>7. A margin does not preserve the starting policy</H2>
      <Prose>
        Since the loss favors a gap, it can improve while both compared probabilities fall. That
        claim is about shared parameters, not independent score coordinates. A complete three-action
        model makes the possibility exact and lets us compute true probability drift.
      </Prose>
      <SharedMassDrift />
      <Prose>
        Give A, B and C logits θ, −θ and 10θ. At θ=0 their probabilities are all one third. The
        one-target mean gap between A and B is 2θ because the shared log normalizer cancels. With
        beta 1 and gamma .4, the derivative at zero is −2σ(.4), about −1.197375. One gradient
        descent step of size .1 sets theta to .119738. The A/B gap rises to .239475, yet their
        probabilities fall to .211650 and .166578; C grows to .621772. The strongly shared C logit
        captures the probability mass. This is a possibility witness, not a prevalence estimate.
      </Prose>
      <MathBlock>{String.raw`p_\theta=\operatorname{softmax}(\theta,-\theta,10\theta),\quad d=\log p_A-\log p_B=2\theta,\quad D_{\mathrm{KL}}(p_{\mathrm{after}}\Vert p_0)=\sum_jp_j\log\frac{p_j}{1/3}`}</MathBlock>
      <Prose>
        All three outcomes are enumerated, so this KL is a genuine normalized-distribution
        divergence, about .175947 nats after the step. A margin shift contains no term that fixes it
        or bounds it globally. In
        <a href="/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models">
          {' '}
          RLHF
        </a>
        , an explicit reference-relative KL term instead assigns a cost to distributional change.
        Those objectives can share a useful practical concern without being mathematically
        identical.
      </Prose>
      <Prose>
        One optional modification directly trains the chosen responses with negative log likelihood,
        abbreviated NLL. It adds a chosen-likelihood gradient to the preference gradient. The choice
        of its denominator matters when chosen responses have different lengths.
      </Prose>
      <AuxiliaryTerm />
      <Prose>
        Extend the local model to two coordinates, with logits θ+φ, −θ+φ and 10θ−2φ. At the origin
        the preference gradient is (−1.197375, 0), while the chosen NLL gradient is (7/3, −1). NLL
        opposes the preference direction along theta and also moves phi. With learning rate .1, NLL
        weight .1 gives step (.096404, .01); weight 1 gives (−.113596, .1). These are vector
        additions through shared parameters, not a promise that both objectives improve
        simultaneously. The auxiliary weight is a new hyperparameter and does not create a hard KL
        bound. Setting phi to zero recovers the earlier model.
      </Prose>
      <MathBlock>{String.raw`\mathcal L=\frac1N\sum_{i=1}^N\ell_i+\lambda\left(-\frac{\sum_i s_i^+}{\sum_i L_i^+}\right)`}</MathBlock>
      <Prose>
        This auxiliary NLL averages over all chosen targets in the batch. Averaging the chosen
        response means would weight short and long responses differently. TRL's native CPO auxiliary
        term follows the token-mean version here. Plain SimPO sets lambda to zero. The native class
        name covers several objectives, so we will specify the actual loss and auxiliary settings
        rather than infer them from the trainer's name.
      </Prose>
      <Program
        file="objective_geometry.py"
        title="Complete two-coordinate gradient geometry and unequal-length NLL check"
      />
      <Prose>
        Run <Code>python -B objective_geometry.py --output objective-geometry-results.json</Code>.
        The local log-softmax model lets autograd compute both gradient vectors, while central
        finite differences check each coordinate. It then verifies the preference plus auxiliary
        gradient on two chosen responses of lengths two and six. This is a no-fit derivative
        investigation: the drawn step is stipulated arithmetic, not an additional empirical study.
      </Prose>

      <Anchor id="4-from-scratch-implementation" />
      <H2>8. Train a complete scratch model</H2>
      <Prose>
        Scalar examples explain the objective. A useful next test must send it through a real causal
        decoder, share weights across contexts and actually generate tokens. We reuse the complete
        model from
        <a href="/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#7-build-the-complete-causal-decoder">
          {' '}
          Causal Language Modeling
        </a>
        : token and position embeddings, masked multi-head attention, residual connections,
        normalization, feed-forward blocks and a vocabulary head. There is no separate reward head.
      </Prose>
      <ScratchLoop />
      <Prose>
        The model has 26,560 parameters, width 32, two heads, two blocks and context 16. Its
        thirteen-token vocabulary expresses four prompts: one word or a sentence, for France or
        Italy. Eight demonstrations show both short and long correct-capital responses under every
        prompt. Response-only SFT therefore initializes useful language and facts without teaching
        the format distinction perfectly. Its 120 updates reduce response-token NLL from 2.721968 to
        .160754. The shared SFT snapshot is copied before the preference updates.
      </Prose>
      <Prose>
        Each prompt supplies two constructed comparisons: the requested format beats the other
        length, and the correct capital beats a wrong-capital substitution in the same format. This
        deliberately mixes a length-related comparison with a factual one. The actual inputs, labels
        and masks are visible in <Code>fixture</Code>; there is no claim that a human rated these
        pairs. The local strings use “period” as a vocabulary item and include literal EOS.
      </Prose>
      <Program
        file="causal_backbone.py"
        title="Complete prerequisite causal Transformer, supplied locally"
      />
      <Prose>
        In <Code>CausalAttention</Code>, query/key scores receive a lower-triangular causal mask
        before softmax. The projected weighted values then join the residual stream. Each
        <Code>Block</Code> applies attention and a feed-forward network around that stream;
        <Code>TinyLM</Code> adds positions and maps the final hidden vectors to vocabulary logits.
        Its three model classes match the prerequisite exactly. Only the local download description
        changes. Right padding occurs after real context, so its later keys cannot affect genuine
        earlier positions in this scratch causal route.
      </Prose>
      <Prose>
        Four continuations isolate one change at a time. All start with identical SFT weights,
        records and fresh optimizer moments, then take forty full-pair AdamW steps at learning rate
        .001 with clipping norm 1 and no weight decay. Beta stays 2. The baseline uses means and
        gamma .4; the alternatives remove the margin, replace means with sums, or add .1
        chosen-token-mean NLL. Matched updates do not make their gradient geometry or compute equal.
      </Prose>
      <Program
        file="scratch_simpo.py"
        title="Complete SFT initializer and four controlled preference continuations"
      />
      <Prose>
        Run{' '}
        <Code>
          python -B scratch_simpo.py --output my-scratch.json --workdir my-scratch-weights
        </Code>
        in a fresh destination. <Code>sft</Code> trains only genuine response targets. Each
        <Code>continuation</Code> makes a deep copy, builds chosen-first pairs and passes the
        selected reduction/margin/NLL weight to the same loss. Every tenth update saves scores and
        generates eight samples for each prompt. The generator resets to seed 947 for each
        method/checkpoint, draws from the full vocabulary at temperature 1 and stops at EOS or eight
        new actions. PAD and BOS draws remain real malformed outputs, not hidden exclusions.
      </Prose>
      <AblationOutcomes />
      <Prose>
        The initial exact-format/capital criterion passes 19 of 32 samples. For mean plus margin,
        counts at updates 0, 10, 20, 30 and 40 are 19, 17, 29, 29 and 21. Its pair loss falls from
        .510421 to .034804, while the final sample set includes two malformed responses. The
        zero-margin run also ends at 21; the sum ablation ends at 30 and the auxiliary-NLL variant
        at 29. Each result belongs to this one seed, vocabulary, criterion and budget. A smaller raw
        loss from a differently defined objective is not a common quality score.
      </Prose>
      <LessonTable
        caption="Observed constructed-task outcomes; 32 samples at each checkpoint"
        headers={[
          'Continuation',
          'Criterion at 0 / 10 / 20 / 30 / 40',
          'Final mean gap',
          'Final mean emitted targets',
        ]}
        rows={[
          ['Mean, gamma .4', '19 / 17 / 29 / 29 / 21', '3.065657', '4.0625'],
          ['Mean, gamma 0', '19 / 17 / 28 / 29 / 21', '3.004658', '4.0625'],
          ['Sum, gamma .4', '19 / 19 / 29 / 30 / 30', '1.866774', '4.53125'],
          ['Mean, gamma .4, NLL .1', '19 / 19 / 29 / 30 / 29', '3.082860', '4.53125'],
        ]}
      />
      <Prose>
        One final mean-margin sample for the Italy sentence request is “Rome PAD BOS period Italy
        period EOS.” A correct initial word and a real EOS do not satisfy the whole task. The sum
        variant also fails on a sentence using the wrong country. All 640 literal samples and every
        fixed comparison are in
        <a href={root + 'results/scratch-results.json'}> scratch-results.json</a>. Inspect them
        alongside the loss. These are training prompts, so even a perfect criterion would not
        establish held-out generalization or a broad alignment result.
      </Prose>

      <Anchor id="5-production-implementation" />
      <H2>9. Use the current native trainer</H2>
      <Prose>
        The scratch loop makes each operation visible. An ordinary trainer should now implement the
        same contract on genuine comparison records. The next experiment uses a small released
        Anthropic HH helpful-base subset with its original strings, chosen/rejected labels and MIT
        license. A supplied preference label is evidence about that comparison, not a guarantee that
        every statement in its response is factual.
      </Prose>
      <RecordAndSplit />
      <Prose>
        Each record separates the shared conversation prefix from its final Assistant suffixes.
        Variants sharing the same normalized first-human turn belong to one prompt family, which
        stays wholly in one split. The selected inputs contain 128 training pairs from 117 families
        and 64 held-out pairs from 56 families; the family overlap is zero. A 1,028-entry WordLevel
        vocabulary is fitted on selected training text only. Unknown held-out words map to UNK. That
        limited vocabulary is part of this demonstration's limits, not an evaluation shortcut.
      </Prose>
      <Program
        file="pair_records.py"
        title="Complete exact-text and prompt-family audit for the released comparisons"
      />
      <Prose>
        Run <Code>python -B pair_records.py</Code> to audit the supplied offline
        <a href={root + 'records.json'}> records</a>. The optional source mode reconstructs the
        selection from an exact-hash upstream gzip. The normal lesson route needs no network
        download. <Code>audit</Code> verifies the reconstructed original chosen/rejected strings,
        pair digests, unique original row IDs and disjoint prompt families. Reusing the previous
        data allows continuity; the new model seed and score convention still make this a separate
        experiment, not a controlled rerun of DPO's measured performance.
      </Prose>
      <Prose>
        Native preparation is a scientific input. Current CPOTrainer adds a BOS token to the prompt
        and EOS to each suffix. We independently derive those IDs and reject any whole pair
        exceeding 192 total positions before passing text to the trainer. All 128/64 selected pairs
        actually survive that filter. Relative to the earlier DPO inputs, the only ID change is one
        added prompt BOS; the vocabulary and response IDs are identical.
      </Prose>
      <NativeBatch />
      <Prose>
        Chosen and rejected rows have their own full IDs, attention masks and labels. Prompt and
        padding labels are −100; each genuine response token, including its terminal EOS, keeps its
        ID. The native collator pads these rows, then concatenates all chosen before all rejected.
        The first eight pairs become a 16 by 86 input array. Check the actual saved target counts,
        not the padded width: a response mean divides by its genuine response targets alone.
      </Prose>
      <Prose>
        The no-update preflight verifies every retained response row and compares the full native
        batch with our independent packer. On the randomly initialized model, loss is .88256061 and
        the largest parameter-gradient difference is about 8.01×10⁻⁸. The check runs again on the
        saved SFT initializer before preference fitting: native and independent losses agree within
        3×10⁻⁷ and all gradients within 3×10⁻⁸. A superficially similar scalar formula would not
        establish these mask, shift and denominator agreements.
      </Prose>
      <ConfigurationMap />
      <Prose>
        Use <Code>from trl.experimental.cpo import CPOConfig, CPOTrainer</Code> with the supplied
        TRL 1.14.2 environment. Set <Code>loss_type="simpo"</Code>, <Code>beta=2</Code> and
        <Code>simpo_gamma=.4</Code>. Set <Code>cpo_alpha=0</Code>, <Code>alpha=0</Code> and
        <Code>label_smoothing=0</Code> explicitly. CPO's auxiliary chosen NLL defaults to enabled;
        AlphaPO shaping and smoothing are also separate objective choices. Experimental APIs can
        move, so the download records both package versions and the actual inspected source hashes.
      </Prose>
      <Program
        file="trl_simpo.py"
        title="Complete native preparation, gradient parity, training, evaluation and save/reload"
      />
      <Prose>
        First run <Code>python -B trl_simpo.py --prepare-only --selection my-selection.json</Code>,
        then{' '}
        <Code>
          python -B trl_simpo.py --preflight-only --selection my-selection.json --workdir
          my-preflight --output my-preflight.json
        </Code>
        . These commands fit no parameters. <Code>verify_preparation</Code> compares every native
        ID/label sequence and the complete first batch. <Code>parity</Code> uses a copied model, the
        ordinary native loss API and independent sum/count scoring, then compares every parameter
        gradient. A tokenizer-boundary merge example shows why concatenating independently encoded
        pieces is unsafe without checking the boundary.
      </Prose>
      <Prose>
        The actual fit uses GPT2LMHeadModel from configuration: one block, width 32, two heads,
        context 256, no dropout and 53,856 parameters. It starts from seed 53, receives forty
        chosen-response SFT updates, then forty native SimPO updates with batch eight and constant
        AdamW learning rate .001. CPU float32, no gradient checkpointing, no weight decay, and no
        external reporting keep the route explicit. It downloads no pretrained language model. The
        native trainer handles its own shuffled training batches after the response-only warm start.
      </Prose>
      <Prose>
        <Code>assess</Code> independently scores every fixed held-out pair, while{' '}
        <Code>generate</Code>
        samples fresh suffixes. Initial and final model states plus the tokenizer are saved for
        further no-fit checks. Reloading the final model reproduces every held-out score exactly.
        The source has no custom trainer subclass, and the parity test consumes the native API's
        actual return structure. Changing a configuration field is meaningful only if the tested
        reduction and target convention continue to match it.
      </Prose>

      <Anchor id="6-visual-walkthrough" />
      <H2>10. Read measured outcomes and costs</H2>
      <Prose>
        Training loss alone cannot tell us whether the learned preference transfers or whether
        generations improve. The reserved families let us examine scores on fixed comparisons; the
        generated outputs separately show what the model actually does. Start with all the fixed
        pairs, including those that move against their labels.
      </Prose>
      <MeasuredScoreAudit />
      <Prose>
        Across 64 held-out pairs, mean gap increases from −.004219 to .034860, but mean SimPO
        surrogate worsens from .969016 to 1.007681. Strict raw-gap agreement falls from 33/64 to
        30/64; no ties occur, so half-credit tie agreement is identical here. Desired-gap
        satisfaction increases from 13/64 to 21/64. These summaries can move in different
        directions: an average gap, the count of positive gaps and a nonlinear loss are different
        operations.
      </Prose>
      <Prose>
        Both chosen and rejected absolute sequence log probabilities fall on every one of the 64
        held-out pairs. Their average changes are −6.920998 and −5.986765 nats respectively. The
        corresponding average mean-score changes are −.315298 and −.354377. Unequal lengths explain
        why the relative movement of sums need not match that of means. This measured score
        displacement is consistent with the possibility exposed by the earlier shared-logit example;
        these finite supplied paths do not enumerate the whole policy or yield its full KL.
      </Prose>
      <Prose>
        The native trainer's logged reward accuracy uses a strict positive unshifted score gap. It
        does not test the positive target margin and does not give ties half credit. Our independent
        report names all three metrics. It also avoids calling the shifted sigmoid a human-win
        probability. A calibration or quality claim would require a separate appropriate evaluation
        and enough relevant evidence; these fixed comparison summaries cannot supply it.
      </Prose>
      <GeneratedOutputs />
      <Prose>
        For each of the first four held-out prompts, two samples are generated before and after
        training with seed 953, temperature 1 and a 24-action cap. All sixteen reach the cap without
        EOS. The outputs are incoherent strings from a tiny model initialized without pretraining. A
        rectangle-area question, for example, receives a sequence beginning “asked Movie” followed
        by unrelated words. The complete strings, including emitted special tokens, are available in
        the figure and
        <a href={root + 'results/native-results.json'}> native-results.json</a>. There is no
        measured helpfulness win rate here, and decreasing a training objective would not create
        one.
      </Prose>
      <Prose>
        SimPO's reference-free computation still offers a real engineering distinction. To assess
        that distinction, count the operations performed by a particular implementation, including
        whether DPO reference scores were already cached, before translating it into resource
        claims.
      </Prose>
      <CostRoles />
      <Prose>
        Online-reference DPO evaluates policy and frozen reference on both suffixes, with backward
        computation only through the policy. Cached-reference DPO moves the reference work to a
        prior pass and reads saved scores during optimization. SimPO needs neither a reference
        forward nor reference-score cache for this objective. All three still train the policy; its
        gradients and optimizer moments do not disappear. Shared-base adapters, quantization,
        activations, sequence lengths and distributed execution affect actual memory and latency.
      </Prose>
      <Prose>
        The arithmetic view counts only its named parameter or score storage. It is not a measured
        GPU peak or a fixed speedup. The SimPO paper reports experiments on particular pretrained
        models, datasets and generation evaluations. Those empirical results motivate studying the
        method; our CPU mechanism study neither reproduces nor generalizes their benchmark ranking.
        Choose a method with held-out task evidence and operational constraints together.
      </Prose>
      <Program
        file="simpo_study.py"
        title="Complete prospective freeze, stage runner and exact-result conservation"
      />
      <Prose>
        Read <a href={root + 'study-protocol.md'}>study-protocol.md</a> before starting a new fit.
        <Code>python -B simpo_study.py --output-dir my-simpo-observations</Code> runs the four
        declared stages with the supplied prospective freeze. The runner binds every program,
        record, tokenizer selection, protocol and dependency version, plus the actual native CPO
        sources. It saves commands, logs and output hashes, and reuses a completed stage only when
        all these inputs and result bytes match. A changed study needs a separately named freeze and
        destination, as the README explains. Failed runs remain available for diagnosis.
      </Prose>
      <Prose>
        The archive contains the eight complete programs, requirements, records/license,
        preparation, protocol, provenance and all four result files. Individual full-source
        Copy/Download controls accompany each program. Start with algebra and masks if you only want
        the mechanism; run the scratch study to change a controlled comparison; use the native route
        when you want to test a real trainer against exact response scoring. Keep the fixed-pair and
        generation questions separate whichever route you choose.
      </Prose>

      <Anchor id="7-decision-matrix" />
      <Anchor id="8-what-scales-and-what-doesn-t" />
      <Anchor id="8-what-scales-and-what-doesnt" />
      <Anchor id="9-failure-modes-and-gotchas" />
      <H2>11. Change labels or objectives deliberately</H2>
      <Prose>
        Real comparisons can conflict. Suppose the identical A/B pair appears repeatedly, with A
        chosen a fraction q of the time. We must reverse the score gap when B is chosen. With a
        positive margin, that is different from smoothing one fixed oriented logistic label.
      </Prose>
      <ContradictoryLabels />
      <Prose>
        Follow the two record orientations: A-wins contributes softplus(γ−βd), while B-wins
        contributes softplus(γ+βd). Each asks its own chosen response for a positive gap. Their
        weighted average can balance at a finite gap when both labels occur. By contrast,
        fixed-orientation smoothing applies fractional positive and negative labels to the one logit
        z=βd−γ; its negative-label term is softplus(βd−γ), with the opposite margin sign.
      </Prose>
      <MathBlock>{String.raw`R(d)=q\operatorname{softplus}(\gamma-\beta d)+(1-q)\operatorname{softplus}(\gamma+\beta d),\quad R'(d)=\beta[(1-q)\sigma(\gamma+\beta d)-q\sigma(\gamma-\beta d)]`}</MathBlock>
      <Prose>
        For q=.75, beta 2 and gamma .5, solving that monotone derivative gives d≈.698124. The
        fixed-orientation smoothed objective instead minimizes at d=(γ+log(q/(1−q)))/β≈.799306. At
        gamma zero they coincide. With q=1, the logistic objective has its infimum as d tends to
        positive infinity; the target margin is still not a finite stopping point. Parameter
        constraints and regularization can of course prevent a real model from realizing an
        arbitrary score gap.
      </Prose>
      <MathBlock>{String.raw`S(d)=q\operatorname{softplus}(-z)+(1-q)\operatorname{softplus}(z),\quad z=\beta d-\gamma,\quad d_S^*=\frac{\gamma+\log(q/(1-q))}{\beta}\quad(0<q<1)`}</MathBlock>
      <Prose>
        The algebra program brackets and bisects the derivative root instead of assuming the
        no-margin logistic optimum still applies. Its endpoint handling reports no finite minimum
        for all-one-label data. A smoothing field in a library is a deliberate objective change; it
        should not be described as if it literally duplicated an oppositely labelled margin record.
      </Prose>
      <ObjectiveCoordinates />
      <Prose>
        The same suffixes can enter different score coordinates. Standard DPO uses summed
        reference-relative log probabilities. Plain SimPO uses policy means and a positive margin.
        The displayed IPO convention puts a squared penalty around a finite target
        reference-relative gap. CPO configurations can add chosen NLL, but the trainer can also
        select SimPO means with that auxiliary weight set to zero. “Reference-free” is not a
        complete definition of the loss or its denominator.
      </Prose>
      <MathBlock>{String.raw`\Delta_{\mathrm{ref}}=(s^+-s_{\mathrm{ref}}^+)-(s^--s_{\mathrm{ref}}^-),\quad \ell_{\mathrm{DPO}}=\operatorname{softplus}(-\beta\Delta_{\mathrm{ref}}),\quad \ell_{\mathrm{IPO}}=\left(\Delta_{\mathrm{ref}}-\frac1{2\tau}\right)^2`}</MathBlock>
      <Prose>
        Here tau is IPO's positive regularization parameter under this stated convention. Other
        implementations can change length reductions, so compare their actual scores before
        comparing hyperparameters. Even SimPO with gamma zero equals a particular DPO scalar
        expression only under extra restrictions, such as equal candidate lengths and zero reference
        log-score difference with an appropriate beta rescaling. Those special cases do not make the
        general methods interchangeable or restore the original KL derivation.
      </Prose>
      <OfflineAndRefresh />
      <Prose>
        Finally, offline pairs may describe responses the current model rarely generates. Refreshing
        candidates from the current policy changes the data distribution; obtaining new human or
        model judgments then changes the evidence supporting their labels. Keep prompt-family
        boundaries, candidate-generation settings, judge provenance and frozen evaluation separate.
        A more recent dataset does not automatically have better labels, and feeding current samples
        back into training does not by itself correct reward hacking or weak task criteria.
      </Prose>
      <Prose>
        For a new task, first check whether the comparisons express its actual constraints and
        whether response boundaries and lengths are defensible. Then choose the score, margin units,
        auxiliary terms and reference behavior explicitly. Preserve absolute likelihood diagnostics
        and free generations on held-out prompts. The model can optimize exactly what was
        implemented while failing what a reader hoped the objective meant.
      </Prose>

      <Anchor id="11-self-check-exercises" />
      <H2>12. Practice with changed cases</H2>
      <Exercise
        title="1. A short answer can miss the task"
        hint={<Prose>Separate the request's constraint from answer length and model score.</Prose>}
        solution={
          <Prose>
            A valid pair might be A: “It is faster,” and B: “It is faster and uses less memory.” If
            the prompt requests two reasons and both B reasons are supported, a supplied label can
            choose B. A's brevity does not satisfy the missing second reason. Neither the label nor
            the length tells us the policy's probability. If factual support or the meaning of
            “reason” is unclear, resolve that criterion first. The loss optimizes a mistaken label
            as readily as a useful one.
          </Prose>
        }
      >
        A prompt asks for two reasons. The shorter candidate gives one. Construct a defensible
        comparison and explain why “SimPO prefers shorter answers” is not a valid labelling rule.
      </Exercise>
      <Exercise
        title="2. Keep the genuine stop when PAD equals EOS"
        hint={
          <Prose>
            Write input positions, then place each predictor exactly one position earlier.
          </Prose>
        }
        solution={
          <Prose>
            Both prompts occupy positions 0–2. A's targets 8 and 2 occupy positions 3 and 4; their
            predictors are 2 and 3. Its position 5 is padding. B's targets 7, 9 and 2 occupy
            positions 3–5, using predictors 2–4. A has attention mask [1, 1, 1, 1, 1, 0] and
            completion mask [0, 0, 0, 1, 1, 0]; B has all-real attention and completion mask [0, 0,
            0, 1, 1, 1]. Shift these masks with the targets once. Masking every ID equal to 2
            removes both genuine stops. Counts must be two and three, not one and two.
          </Prose>
        }
      >
        Use prompt IDs [1, 4, 6], response A [8, 2] and response B [7, 9, 2]. Right-pad to six
        positions with ID 2, also EOS. Give masks, counts and predictors; repair a scorer that
        ignores every ID equal to 2.
      </Exercise>
      <Exercise
        title="3. Name the event before choosing its score"
        hint={<Prose>Compare sums first, then divide each by its own count.</Prose>}
        solution={
          <Prose>
            Sums −2.4 and −3 prefer A because its completed-path probability exp(−2.4) is larger.
            Means −2.4/3=−.8 and −3/5=−.6 instead prefer B. The sums are sequence log probabilities
            under the stated target/termination convention. Exponentiated means are geometric means
            of transition probabilities and need not sum to one across responses. A mean-score win
            does not change which completed event had larger probability.
          </Prose>
        }
      >
        A has sum −2.4 across three targets; B has sum −3 across five. Compute both rankings and
        identify which value is a sequence log probability.
      </Exercise>
      <Exercise
        title="4. A different token unit changes the mean"
        hint={
          <Prose>
            Hold the stipulated total log probability fixed only for this arithmetic comparison.
          </Prose>
        }
        solution={
          <Prose>
            The means are −3/2=−1.5 and −3/6=−.5 despite the same stipulated event mass exp(−3). A
            real tokenizer swap generally changes the model and its probabilities as well as the
            denominator. Freeze tokenizer, template and EOS when attributing an observed change to
            the objective. If tokenization is the intended intervention, declare it explicitly and
            evaluate a task criterion not defined only per token.
          </Prose>
        }
      >
        An event with log probability −3 is represented using two targets or six. Explain the mean
        change and why swapping a deployed model's tokenizer is not a neutral normalization fix.
      </Exercise>
      <Exercise
        title="5. Failing the desired margin still gives a finite gradient"
        hint={<Prose>Compute z=beta times gap minus gamma before applying softplus.</Prose>}
        solution={
          <Prose>
            z=3(.2)−.9=−.3. Loss is softplus(.3)=.854355 and its gap derivative is
            −3σ(.3)=−1.723328. The desired gap is .9/3=.3, so the current pair falls below it.
            Gradient descent still has a finite signal to increase the gap. At the desired gap, loss
            would be log 2 and the derivative −1.5; reaching it does not stop learning.
          </Prose>
        }
      >
        For beta 3, gamma .9 and gap .2, compute logit, loss, gap derivative and desired gap. Does
        the pair produce an update signal?
      </Exercise>
      <Exercise
        title="6. Translate margin units before changing beta"
        hint={
          <Prose>
            Use gamma=beta times the ratio, then hold each of the two quantities fixed separately.
          </Prose>
        }
        solution={
          <Prose>
            Ratio .25 with beta 4 requires absolute gamma 1 in TRL. Halving beta to 2 while keeping
            gamma 1 doubles the desired gap from .25 to .5. Keeping ratio .25 instead requires gamma
            .5, so the desired gap stays .25. Even then, gradient scale and sharpness change with
            beta. Passing .25 as the original absolute gamma accidentally requests gap .0625 instead
            of .25.
          </Prose>
        }
      >
        A recipe uses gamma/beta ratio .25 and beta 4. Translate it to TRL, then compare halving
        beta while holding gamma or the ratio fixed.
      </Exercise>
      <Exercise
        title="7. Token coefficients are not parameter gradients"
        hint={
          <Prose>Divide the pair weight separately by the chosen and rejected target counts.</Prose>
        }
        solution={
          <Prose>
            Each chosen contribution has derivative −.8/2=−.4. Each rejected contribution has
            derivative .8/5=.16. Their path sums are −.8 and .8; a batch mean adds division by pair
            count. Parameter gradients additionally multiply these coefficients by the
            log-probability Jacobians and add across shared parameters. Context and vocabulary
            normalization mean equal coefficient sums imply neither equal gradient norms nor
            independent probability changes.
          </Prose>
        }
      >
        A pair has weight w=.8 and chosen/rejected lengths two and five. Give every direct
        token-score coefficient and explain what remains before an optimizer can update the model.
      </Exercise>
      <Exercise
        title="8. Repair an alleged human-win probability"
        hint={
          <Prose>The reverse record subtracts the same positive gamma from its reversed gap.</Prose>
        }
        solution={
          <Prose>
            The logits are 2(.4)−.6=.2 and −2(.4)−.6=−1.4. Their links are approximately .549834 and
            .197816, summing to .747650. They cannot describe complementary outcomes of one binary
            judgment. Report shifted training links if useful; an actual win-probability claim needs
            an appropriate evaluated probabilistic model or held-out judgments. The loss terms
            themselves are not measured human preferences.
          </Prose>
        }
      >
        At gap .4, beta 2 and gamma .6, a report calls the two oriented sigmoid values human-win
        probabilities. Compute them and repair the interpretation.
      </Exercise>
      <Exercise
        title="9. A larger gap with a smaller chosen probability"
        hint={
          <Prose>
            The shared normalizer cancels in the A/B gap but remains in each probability.
          </Prose>
        }
        solution={
          <Prose>
            The gap is 2θ. At zero its loss derivative is −2σ(.2)=−1.099668. A .05 step sets theta
            to .0549834 and the gap to .1099668. Softmax of theta, minus theta and six times theta
            gives approximately (.311305, .278887, .409808). Both A and B fall below one third
            despite the improved gap. The third outcome gains mass through shared parameters. This
            witness establishes possibility, not prevalence.
          </Prose>
        }
      >
        Use logits (theta, minus theta, six times theta), beta 1, gamma .2 and initial theta zero.
        After one gradient step of size .05, does the chosen probability rise?
      </Exercise>
      <Exercise
        title="10. Two NLL denominators imply different weights"
        hint={<Prose>Reconstruct each response's sum before pooling its targets.</Prose>}
        solution={
          <Prose>
            The sums are −.4 and −4.8. Token-mean NLL is (.4+4.8)/(2+6)=.65; mean-of-response-means
            NLL is (.2+.8)/2=.5. The first weights responses by target count, while the second gives
            each response equal weight. Current native CPO auxiliary cross entropy uses the first
            convention. State that denominator when reproducing an auxiliary term or accumulating
            uneven batches.
          </Prose>
        }
      >
        Two chosen responses have lengths two and six, with mean log scores −.2 and −.8. Compare the
        two NLL reductions and identify which matches the native auxiliary term.
      </Exercise>
      <Exercise
        title="11. Isolate normalization without relabelling the method"
        hint={
          <Prose>
            Use one frozen initializer and one shared record/order schedule; change one loss
            operation.
          </Prose>
        }
        solution={
          <Prose>
            Copy the same SFT state twice; preserve tokenizer/EOS/masks, records, batch order,
            beta/gamma, optimizer settings, update budget and evaluation prompts/seeds. Divide by
            genuine counts in one branch only, and verify identical initial logits. Report common
            sum/mean diagnostics plus task generations; the same beta still has different effective
            scaling. The sum branch lacks reference-relative subtraction, so it is a reference-free
            sum ablation, not DPO. Tuning fairness would require another declared experiment.
          </Prose>
        }
      >
        Design a normalization-only ablation. Explain the constants to preserve and why the
        summed-score branch cannot simply be called DPO.
      </Exercise>
      <Exercise
        title="12. Fix the trainer and target contract together"
        hint={
          <Prose>
            Separate ratio conversion from the auxiliary weight, then inspect native IDs and labels.
          </Prose>
        }
        solution={
          <Prose>
            Use the experimental CPO import with loss_type="simpo", beta=2, simpo_gamma=.4,
            cpo_alpha=0, alpha=0 and label_smoothing=0. Verify prompt BOS, one response EOS and −100
            prompt/padding labels. Count selected shifted targets from positions, not padded width.
            Reject both members of a pair if either whole sequence exceeds the budget, before native
            truncation. Compare native/manual loss and every parameter gradient with dropout
            disabled before interpreting a fit.
          </Prose>
        }
      >
        A plain SimPO config uses beta 2 and desired gap .2, leaves cpo_alpha at its default, and
        passes .2 as simpo_gamma. Repair it and specify the target/count checks it still needs.
      </Exercise>
      <Exercise
        title="13. A fixed-pair success does not describe free generations"
        hint={
          <Prose>
            Track absolute score movement and sample outcomes outside the supplied pair.
          </Prose>
        }
        solution={
          <Prose>
            A larger mean gap with both absolute probabilities falling is consistent with mass
            moving elsewhere through shared parameters. Report sums, means, lengths and gaps without
            calling their finite differences full-policy KL or generated-quality gains. Evaluate
            fresh generations on held-out prompts with fixed decoding and an independent criterion.
            Retain complete strings, stop rates and failures: other responses may have gained
            probability without ever appearing in the pair.
          </Prose>
        }
      >
        A report shows improved mean gaps but both candidate likelihoods fall. Give a valid
        interpretation and identify evidence needed for a generation-quality conclusion.
      </Exercise>
      <Exercise
        title="14. Count a concrete reference computation"
        hint={
          <Prose>
            Distinguish work moved to preprocessing from work removed from the objective.
          </Prose>
        }
        solution={
          <Prose>
            Online-reference DPO runs policy and reference on both suffixes, with backward gradients
            only through the policy. Cached-reference DPO computes frozen scores earlier and reads
            them during training. SimPO removes that reference-scoring requirement but still
            computes policy logits, gradients and optimizer state. A valid cache requires exact
            weights, tokenizer/template, IDs/masks and pair correspondence. Activations, batch
            shape, adapters, hardware and distributed execution still affect speed and memory, so no
            universal performance multiplier follows from these operator roles.
          </Prose>
        }
      >
        Compare online-reference DPO, cached-reference DPO and SimPO. What disappears, what moves,
        and why is a fixed performance multiplier unjustified?
      </Exercise>
      <Exercise
        title="15. Conflicting records differ from fixed-orientation smoothing"
        hint={<Prose>Write each actual label orientation, keeping its gamma positive.</Prose>}
        solution={
          <>
            <Prose>
              The repeated-record objective is .75 softplus(.5−2d)+.25 softplus(.5+2d), with
              derivative 2[.25σ(.5+2d)−.75σ(.5−2d)] and root .698124. Fixed-orientation smoothing
              instead uses .75 softplus(−z)+.25 softplus(z), z=2d−.5, with optimum (.5+log
              3)/2≈.799306. The negative-label terms have different margin signs.
            </Prose>
            <Prose>
              At gamma zero they coincide and minimize at log 3/2. With only A-wins, the
              unconstrained infimum occurs at infinite positive gap; the desired margin is not a
              finite optimum. The algebra program solves the derivative only for interior label
              frequencies and names the endpoint limitation.
            </Prose>
          </>
        }
      >
        For A-wins frequency .75, beta 2 and gamma .5, derive the objective, derivative and
        numerical optimum. Compare fixed-orientation smoothing, gamma zero and the endpoints.
      </Exercise>
      <Exercise
        title="16. Make a changed task falsifiable"
        hint={
          <Prose>
            Define behavior before seeing scores or generations and preserve a shared initializer.
          </Prose>
        }
        solution={
          <Prose>
            One valid project adds a request for two factual clauses and changes the grammar and
            comparisons accordingly. Freeze new data, protocol and source hashes before fitting.
            Copy one new SFT initializer across declared variants with matched
            records/order/schedule and retain a baseline. Define exact clause-count/fact criteria
            independently of loss; use held-out prompt families for generalization claims and fixed
            decoding seeds/budgets. Keep every sample and fixed-pair score change. A valid
            conclusion is that pair loss improved while held-out task success did not. That
            disproves the proposed gain under the declared setup; it does not justify hiding a seed
            or retuning after inspection.
          </Prose>
        }
      >
        Design a new task and controlled experiment capable of disproving “this objective improves
        the behavior.” Specify inputs, state reuse, metrics and retained evidence.
      </Exercise>

      <Anchor id="10-primary-sources" />
      <Sources
        alternatives={
          <>
            <Prose>
              <a href="https://rlhfbook.com/c/08-direct-alignment">
                RLHF Book: Direct Alignment Algorithms
              </a>{' '}
              places reference-relative and reference-free objectives in a common sequence. Use it
              after the local mean/margin derivation to compare assumptions, likelihood drift and
              the questions a preference experiment should answer.
            </Prose>
            <Prose>
              <a href="https://github.com/princeton-nlp/SimPO/blob/main/README.md">
                The authors' SimPO implementation guide
              </a>{' '}
              connects initialization, margin-ratio settings, data formatting and generation
              evaluation. Treat each recipe's parameters as settings for its stated model/data;
              translate their units before using another trainer.
            </Prose>
            <Prose>
              <a href="https://huggingface.co/docs/trl/cpo_trainer">The TRL CPO trainer guide</a>{' '}
              maps preference data to a maintained trainer. Read its loss-specific options beside
              the source when reproducing mean reduction, auxiliary NLL or an experimental import.
              The supplied programs use one exact tested version.
            </Prose>
          </>
        }
      >
        <li>
          <a href="https://arxiv.org/html/2405.14734v3">
            Meng et al., SimPO: Simple Preference Optimization with a Reference-Free Reward
          </a>{' '}
          — primary score, margin objective, comparisons and ablations. Section 2 defines the core
          loss; experimental and appendix details qualify benchmark claims.
        </li>
        <li>
          <a href="https://github.com/princeton-nlp/SimPO/blob/main/scripts/simpo_trainer.py">
            Original SimPO trainer implementation
          </a>{' '}
          — response normalization and original gamma/beta-ratio convention. Match target masks and
          reductions before treating another configuration as equivalent.
        </li>
        <li>
          <a href="https://github.com/huggingface/trl/blob/v1.14.2/trl/experimental/cpo/cpo_trainer.py">
            TRL 1.14.2 CPOTrainer source
          </a>{' '}
          — BOS/EOS preparation, mean scores, absolute margin, chosen NLL, loss composition and
          strict logged reward accuracy used by the native program.
        </li>
        <li>
          <a href="https://arxiv.org/html/2305.18290v3">
            Rafailov et al., Direct Preference Optimization
          </a>{' '}
          — reference-relative regularized-objective derivation contrasted with the policy mean
          here. Removing a reference and changing normalization changes its assumptions.
        </li>
        <li>
          <a href="https://github.com/anthropics/hh-rlhf">Anthropic HH-RLHF data and license</a> —
          original comparison source. The archive preserves exact selected text, source row/family
          identities, hashes and MIT license for offline reproduction.
        </li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>15. What you can now do</H2>
        <Prose>
          You can construct genuine causal targets, distinguish sums from means, translate margin
          units and derive token/shared-parameter gradients. You can explain why a margin does not
          bound drift or certify generation quality, run controlled scratch and native programs, and
          interpret mixed held-out and generation outcomes. Next,
          <a href="/learn/path/full-curriculum/p-tuning-soft-prompt-methods?module=large-language-models">
            {' '}
            P-Tuning and Prompt Tuning
          </a>{' '}
          changes which parameters we train rather than only the objective. Carry the exact target,
          state and evaluation discipline into those smaller trainable interfaces.
        </Prose>
      </section>
    </div>
  ),
};

export default simpo;
