import { Prose, H2, H3, Code, CodeBlock } from '../../../../src/learn/components/content';
import { MathBlock as SharedMathBlock } from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import {
  LessonIntro,
  LessonTable,
  Sources,
} from '../../../../src/learn/components/lesson-labs/LessonElements.jsx';
import {
  ResponseEdits,
  TrainingArtifacts,
  PrincipleAnatomy,
  CritiqueContext,
  RevisionAncestry,
  TargetMasks,
  ParameterStates,
  ChoiceMass,
  OrderMapping,
  LabelTransform,
  LabelCredit,
  RewardHead,
  PreferenceGradient,
  PreferenceCycle,
  PolicyAnchor,
  DpoUpdate,
  RealRecordAudit,
  Seq2seqAnatomy,
  CoverageCounts,
  CalibrationBins,
  ErrorDependence,
  CollectiveVotes,
  ConstitutionTimeline,
  WorkLedger,
} from '../../../../src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';

const root = '/learn/examples/constitutional-ai/';
const Program = ({ file, title }) => (
  <RemoteCodeBlock source={`${root}${file}`} filename={file} title={title} />
);
const MathBlock = ({ children }) => (
  <div className="cai-math" tabIndex={0} role="region" aria-label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Anchor = ({ id }) => <span id={id} className="cai-anchor" aria-hidden="true" />;
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

const constitutionalAI = {
  title: 'Constitutional AI (CAI)',
  readTime: '~75 min read + programs and practice',
  content: () => (
    <div className="lesson-flow constitutional-ai-flow">
      <LessonIntro
        prerequisites="The earlier Causal Language Modeling lesson taught next-token probabilities and shifted targets. RLHF and DPO introduce preference learning; their probability, loss and frozen-reference ideas are refreshed here before use. Basic Python and gradients help with the complete programs; the worked examples explain the arithmetic."
        exampleKind="Python + alignment-data and training investigations"
      >
        How can a written principle become a training signal? Follow one response through critique,
        revision, supervised targets, AI comparison and a policy update. For a first pass, read
        sections 1–6, inspect the real records and model failures in 7–8, then compare constitution
        choices in 9. Sections 5–6 include deeper derivations; the full programs and solved practice
        let you build and diagnose the mechanisms.
      </LessonIntro>

      <Anchor id="1-why-it-exists" />
      <Anchor id="1-start-with-the-problem" />
      <H2>1. Turn a principle into training data</H2>
      <Prose>
        An assistant can answer a request fluently and still choose a response we do not want.
        Imagine a user asks:{' '}
        <em>Can you share Mira's private phone number? I need to contact her about a project.</em>{' '}
        Mira and the request are fictional. Our product criterion is to protect private contact
        details while helping with the project-contact goal. A complete refusal meets the first half
        but loses the second. Inspect the specific repair:
      </Prose>
      <ResponseEdits />
      <Prose>
        The change is in the response text: remove the suggestion to obtain private details and add
        a permitted contact route. That text edit does not change the language model's weights. To
        make the behavior more likely on future requests, we need to turn the edited response into
        data and train on it. This distinction separates an inference-time rewrite from
        Constitutional AI's training method.
      </Prose>
      <Prose>
        A <em>constitution</em> is an explicit set of behavioral principles. In the original CAI
        study, a model uses a selected principle to critique and revise a draft; those revisions
        supply supervised examples. Another use of the principles is to compare two responses and
        supply preference labels. The labels train a preference model, whose score then guides a
        policy update. A <em>policy</em> here means the language model's conditional distribution
        over responses, not the written constitution itself.
      </Prose>
      <TrainingArtifacts />
      <Prose>
        The two artifacts answer different questions. The supervised record says, “Produce this
        response for this prompt.” The preference record says, “For this prompt and criterion,
        response A is preferred to B with this target probability.” Neither record is a proof that
        the response is safe or correct. The original 2022 experiment combines AI-generated
        harmlessness preferences with human helpfulness preferences; humans also supply prompts,
        design principles and evaluate models. CAI changes where feedback comes from rather than
        removing every human contribution.{' '}
        <a href="https://arxiv.org/abs/2212.08073">Bai et al., sections 3–4</a>
      </Prose>
      <Prose>
        Keep the identities visible throughout the lesson: R1 suggests obtaining private contact
        details, R2 refuses the entire task, and R3 offers constructive contact help. Amber, blue
        and violet identify those responses; they do not mean high, low or morally correct.
        Selection uses a white outline. Where a figure instead distinguishes supplied input, learned
        parameters and computed scores, it introduces its own labelled role legend.
      </Prose>
      <Prose>
        The useful decision is already concrete: preserve the user's permitted goal while repairing
        the specific problem. On the benign request “How can I ask Mira which public contact method
        she prefers?”, the same privacy principle should allow useful help. A judge that refuses
        both cases has not solved our task.
      </Prose>

      <Anchor id="2-core-intuition" />
      <Anchor id="2-build-the-intuition" />
      <H2>2. Make critique and revision specific</H2>
      <Prose>
        “Be good” supplies little guidance about the draft's defect. A useful criterion names the
        situation, the behavior to change and a permitted alternative. Those parts let a critic
        connect a principle to an actual response span:
      </Prose>
      <PrincipleAnatomy />
      <Prose>
        P1 applies to requests for another person's private contact details. Its criterion forbids
        disclosure, while its alternative allows a public directory or asking the person how they
        prefer to be contacted. The critic should identify the draft's suggestion to obtain private
        details; the revision should replace that suggestion while retaining contact assistance.
        These are deliberately chosen product norms. A different product and community may choose
        different principles and conflict rules.
      </Prose>
      <Prose>
        The editable principle view compiles a prompt; it does not run a model in your browser. An
        empty criterion remains an incomplete instruction, not a successful safety check. We can
        inspect what the model would be asked before spending inference calls.
      </Prose>
      <CritiqueContext />
      <Prose>
        The original request <Code>x</Code> matters. A draft alone may look unreasonable without the
        request it is answering. The critique prompt includes <Code>x</Code>, draft <Code>y₀</Code>{' '}
        and principle <Code>P₁</Code>. Its generated critique is <Code>c₁</Code>. The revision
        prompt includes those objects and asks for a revised answer <Code>y₁</Code>. In the original
        study, few-shot examples demonstrate which role should critique and which should revise; the
        authors observed role confusion without suitable prompting.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}c_1&\sim C(\cdot\mid x,y_0,P_1)\\y_1&\sim G(\cdot\mid x,y_0,P_1,c_1)\end{aligned}`}</MathBlock>
      <Prose>
        <Code>C</Code> and <Code>G</Code> name the critic and revision-generation roles. They may
        use the same model family or the same weights; the notation does not require two different
        architectures or an older-generation critic. “Sampled from” describes model generation. A
        recorded replay of these objects shows the data dependencies without claiming to generate a
        new critique.
      </Prose>
      <RevisionAncestry />
      <Prose>
        Each next round starts from the current revision. A second principle can improve usefulness;
        a third can check unsupported claims. It can also make no change or introduce an error. The
        ancestry drawing records which response produced which revision, not a guarantee of
        improving quality. In our constructed replay, the last two revisions are identical: a
        further round adds a record but no new response text.
      </Prose>
      <Prose>
        The original experiment samples from 16 critique/revision templates, runs four
        critique–revision pairs per red-team prompt, and trains on revisions from <em>all</em> those
        steps. It also includes responses to human-written helpfulness prompts. The paper tests
        direct revision without an explicit critique and different revision counts; one-principle
        sampling and four rounds describe that experimental setup, not universal requirements of
        every constitutional method.{' '}
        <a href="https://arxiv.org/abs/2212.08073">Bai et al., sections 3.1–3.5</a>
      </Prose>
      <H3>Build and inspect the records</H3>
      <Prose>
        <Code>constitutional_records.py</Code> makes the prompts and replays explicitly authored
        artifacts. <Code>critique_prompt</Code> retains the original request;{' '}
        <Code>revision_prompt</Code> retains the criterion and critique.{' '}
        <Code>replay_revisions</Code> stores every dependency. <Code>sft_records</Code> extracts
        only the original request and revised response as training data. It does not append the
        critic's instructions to the assistant's target.
      </Prose>
      <Program
        file="constitutional_records.py"
        title="Complete program: prompts, revision trace and SFT records"
      />
      <Prose>
        Run <Code>python constitutional_records.py</Code>. The executed three-round replay produces
        three all-round targets, one final-only target and zero targets when there are no rounds.
        The last response equals the preceding response. That is a mechanical record result, not
        evidence that a language model improved. The real model-generation program in section 7 uses
        the same explicit request/principle/critique dependencies and reports what actually happens.
      </Prose>

      <Anchor id="4-from-scratch-implementation" />
      <Anchor id="6-visual-walkthrough" />
      <H2>3. Train on the revision</H2>
      <Prose>
        We now have a target answer. Supervised fine-tuning, or SFT, increases its conditional
        probability for the original request. For an autoregressive model, the probability of a
        response is a product of next-token probabilities. Taking logs turns that product into a
        sum. The target at each position is the next response token, with the prompt available as
        context.
      </Prose>
      <TargetMasks />
      <Prose>
        The fixture is <Code>[1,3,4,5,6,2,0,0]</Code>. IDs 1,3,4 are prompt tokens; IDs 5,6,2 are
        response tokens, including the end-of-sequence marker; the final two zeros are padding. The
        attention mask permits the six real input positions and excludes padding. The label array is{' '}
        <Code>[-100,-100,-100,5,6,2,-100,-100]</Code>. Here <Code>-100</Code> is the library's
        “ignore this target” marker; it is not a vocabulary ID.
      </Prose>
      <Prose>
        The prompt tokens remain available to attention even though we do not train the model to
        reproduce them in this example. GPT2's causal-language-model interface expects those labels
        in their original positions and shifts internally exactly once. Logits from input position 2
        predict target ID 5 at position 3. We do not shift the labels externally and then ask GPT2
        to shift them again. Exactly three targets contribute.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}L_{\rm SFT}&=-\frac{1}{M}\sum_{t\in\mathcal T}\log\pi_\theta(y_t\mid x,y_{<t})\\M&=|\mathcal T|\end{aligned}`}</MathBlock>
      <Prose>
        <Code>θ</Code> denotes the trainable model parameters; <Code>𝒯</Code> is the set of included
        response-token positions and <Code>M</Code> its count. We use natural logarithms, whose loss
        unit is called a nat. A probability .5 contributes about .693 nats of negative log loss; a
        probability .1 contributes about 2.303. Increasing the probability of a supplied target
        reduces its contribution. The reduction is a mean over included tokens, not over padded
        sequence length. If every target is excluded, the mean is undefined: report no training
        targets and skip that update.
      </Prose>
      <ParameterStates />
      <Prose>
        During data collection, generation reads model weights. Training is the separate operation
        that computes gradients and updates the student's weights. The original study samples drafts
        from a helpful RLHF model and fine-tunes a pretrained model on the collected revisions and
        helpful responses. The student is not automatically the same parameter state as the
        generator. During a later policy update, the reference and reward model are frozen while the
        policy changes.
      </Prose>
      <Prose>
        The drawing's small matrix is a constructed parameter trace, not extracted FLAN weights. Its
        frozen switch makes the distinction literal: with training disabled the update is zero even
        if the response text changes. In a real run, optimizer state and model weights must be
        saved; a document edit by itself does not retrain a model.
      </Prose>
      <H3>Control a usual model interface</H3>
      <Prose>
        The completion part of <Code>torch_training.py</Code> creates a random 3,824-parameter GPT2
        model with dropout disabled. It supplies the fixture's same-position labels, computes the
        matching externally shifted cross-entropy only as a check, performs one SGD update, and
        saves/reloads the model. The model receives invented integer tokens; it has no asserted
        language ability. This excerpt from <Code>train_completion</Code> is the actual mask
        operation; the complete program appears in section 7 after its other reward/policy checks
        have been explained.
      </Prose>
      <div data-code-source="torch_training.py#train_completion">
        <CodeBlock
          language="python"
          filename="completion_mask_excerpt.py"
          title="Excerpt: choose response targets before the model's internal shift"
        >{`labels = input_ids.clone()
labels[:, :3] = -100
labels[attention_mask == 0] = -100
# GPT2 expects labels at their original positions and shifts internally once.
output = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)`}</CodeBlock>
      </div>
      <Prose>
        Install <Code>torch</Code> and <Code>transformers==5.19.0</Code>, then run{' '}
        <Code>python torch_training.py --checkpoint tiny_cai_checkpoint</Code>. On CPU with Torch
        2.14.0+cpu, the observed loss and independently selected-token loss are both 2.7623708
        before the update; afterward the loss is 2.6423247. The embedding matrix changes, and
        reloaded logits match with maximum difference 0. These results verify the supplied
        mask/update/checkpoint route, not a useful assistant or a reproduction of the original CAI
        training scale.
      </Prose>
      <Prose>
        For the full scratch decoder and why a position may see only earlier tokens, revisit{' '}
        <a href="/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#7-build-the-complete-causal-decoder">
          Causal Language Modeling, section 7
        </a>
        . This lesson's extra operation is selecting which observed tokens become supervised
        targets. The encoder-decoder critic in section 7 has a different label interface, which we
        inspect separately.
      </Prose>

      <Anchor id="3-mathematical-foundation" />
      <Anchor id="3-make-the-idea-precise" />
      <H2>4. Ask a judge for a preference</H2>
      <Prose>
        A revision gives an answer to imitate. Preference learning needs a comparison. Generate or
        supply two responses to the <em>same</em> prompt, present a selected principle, and ask the
        judge which response better satisfies it. The judge's raw output need not be a binary vote;
        it can supply conditional probabilities for answer options.
      </Prose>
      <ChoiceMass />
      <Prose>
        The constructed judge assigns probability mass .3 to the complete option A, .1 to B and .6
        to other outputs. Restricting attention to A or B produces <Code>q=.3/(.3+.1)=.75</Code>.
        That .75 is a conditional preference probability under this scoring rule. It does not say
        there is a 75% independently established chance that response A is good; most unconditioned
        mass in this example was outside our two answers.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}\ell_A&=\sum_j\log P(a_j\mid u,a_{<j})\\q&=\frac{e^{\ell_A}}{e^{\ell_A}+e^{\ell_B}}\end{aligned}`}</MathBlock>
      <Prose>
        <Code>u</Code> is the complete judge prompt containing the original request, principle and
        two responses; <Code>aⱼ</Code> is a token of option A's answer string. The option score{' '}
        <Code>ℓA</Code> is a sum of token log probabilities. The actual T5 program scores A and B
        through their end-of-sequence tokens. This is a sequence likelihood, not a next-token-only
        score or a length-normalized average. A different answer-string/EOS convention can change
        the result and must be recorded.
      </Prose>
      <Prose>
        For numerical stability, subtract a common maximum before exponentiating, or use
        log-sum-exp. A judge's option scores might be -10,000 and -10,001; directly exponentiating
        both underflows to zero, but their normalized comparison is still about .731. The absolute
        size cancels from the ratio.
      </Prose>
      <OrderMapping />
      <Prose>
        A and B are presentation slots; R1 and R3 are response identities. In one constructed pass
        R1 is A and receives .8. In the swapped pass R3 is A and receives .4, so R1 receives .6.
        Mapping back to R1 before averaging gives .7, with an order gap of .2. Averaging .8 and .4
        directly would mix two different response identities. If one pass is missing, the two-pass
        result is unknown rather than a fabricated average with zero.
      </Prose>
      <Prose>
        Swapping can reveal position dependence; it cannot prove the remaining judgment is valid.
        Different prompts, answer strings, model capability and correlated judging errors still
        matter. The original CAI study samples principles across preference examples. Running every
        principle and many critics on every pair is a possible extra experiment, not the original
        default.
      </Prose>
      <LabelTransform />
      <Prose>
        A raw target q=.9 can remain soft, become a hard winner label 1, or be clamped to .6 under
        bounds [.4,.6]. These represent different training instructions. Hardening discards
        uncertainty. Clamping weakens confidence even if the judge's direction stays the same. The
        original chain-of-thought judging experiment found probabilities often near 0 or 1 and used
        the .4–.6 clamp in its main results after comparing alternatives. It is a source-specific
        stabilization choice, not a universal calibration method.{' '}
        <a href="https://arxiv.org/abs/2212.08073">Bai et al., sections 4.1–4.3</a>
      </Prose>
      <Program
        file="preference_labels.py"
        title="Complete program: option likelihoods, order mapping and label diagnostics"
      />
      <Prose>
        Run <Code>python preference_labels.py</Code>. It prints the .75 conditional mass, .7 mapped
        result, .9/1/.6 label variants and explicit missing-pass values. Later functions compute
        calibration, group-aware consensus and the independent-error example used below. All numeric
        examples in this program are constructed; actual model option scores appear in section 7. A
        tie stays .5 rather than becoming an arbitrary hard winner.
      </Prose>

      <H2>5. Learn a reward from those labels</H2>
      <Prose>
        The preference dataset contains pairs; a policy optimizer needs to score a newly produced
        response. A reward model learns a mapping from the prompt and response to a scalar. In a
        common language-model implementation, the final contextual hidden vector is projected by a
        learned scalar head:
      </Prose>
      <RewardHead />
      <MathBlock>{String.raw`\begin{aligned}r_\phi(x,y)&=w^\top h_\phi(x,y)+b\\\Delta&=r_\phi(x,y_A)-r_\phi(x,y_B)\\p_\phi(A\succ B\mid x)&=\sigma(\Delta)\end{aligned}`}</MathBlock>
      <Prose>
        <Code>hφ</Code> is the vector produced from the prompt/response context; <Code>w</Code> is a
        learned head-weight vector and <Code>b</Code> a scalar bias. <Code>φ</Code> names the reward
        model's trainable parameters. The sigmoid <Code>σ(z)=1/(1+exp(-z))</Code> turns the score
        difference into the modeled pair preference probability. This is the Bradley–Terry model. A
        positive difference prefers A; equal scores give .5.
      </Prose>
      <Prose>
        The pair only identifies score differences. Adding the same constant to both scores does not
        change their preference probability; the shared scalar bias cancels. Reward 1 is not “100%
        correct.” Even the pair probability reflects the fitted preference labels and model
        assumptions, not an externally calibrated quality guarantee.
      </Prose>
      <PreferenceGradient />
      <Prose>
        For a soft target q and predicted preference p, use binary cross-entropy. It penalizes both
        predicting too little mass for A and too little for B. With scores 1 and 0, the predicted
        preference is .7310586. Target .75 asks for a slightly stronger preference for A:
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}L_{\rm pair}&=-q\log p-(1-q)\log(1-p)\\\frac{\partial L}{\partial\Delta}&=p-q\\\frac{\partial L}{\partial r_A}&=p-q,\quad\frac{\partial L}{\partial r_B}=q-p\end{aligned}`}</MathBlock>
      <Prose>
        The loss is .5632617 and the derivative of the score difference is -.0189414. Gradient
        descent increases that difference. With a one-feature head whose feature difference is 1 and
        step size .2, weight 1 becomes 1.0037883. If q already equals p, the pair produces zero
        gradient. A hard q=1 target would push more strongly; a clamped q=.6 would push this .731
        prediction back down. The label transformation therefore changes the trained reward.
      </Prose>
      <Prose>
        The derivative follows from two small parts: the loss derivative with respect to p is{' '}
        <Code>-q/p + (1-q)/(1-p)</Code>, and the sigmoid derivative is <Code>p(1-p)</Code>.
        Multiplying cancels the denominators and gives p-q. For a linear head with supplied feature
        vectors, multiply that scalar by the feature difference to obtain the weight gradient. A
        real Transformer also backpropagates through its contextual hidden vector.
      </Prose>
      <Prose>
        Return to section 4's raw, hard and clamped judge targets. Hold the reward model's predicted
        preference fixed at p=.5 so that only the target transformation changes. The signed bars
        below show p-q: a negative value asks descent to increase the score difference, while a
        positive value asks it to decrease that difference. At p=.5 every target gives binary
        cross-entropy ln 2, yet its derivative can differ; the same present loss does not imply the
        same update.
      </Prose>
      <LabelCredit />
      <MathBlock>{String.raw`\begin{aligned}\Delta&=(h_A-h_B)^\top w\\\nabla_wL&=(p-q)(h_A-h_B)\\L&=\log(1+e^\Delta)-q\Delta\end{aligned}`}</MathBlock>
      <Prose>
        The final line is the same binary cross-entropy written as softplus minus q times the score
        difference. Softplus means <Code>log(1+exp(Δ))</Code>. The scratch program evaluates it with{' '}
        <Code>np.logaddexp(0, logits)</Code>, which keeps large score differences from overflowing
        during exponentiation. This is a numerical implementation of the objective above, not a
        different training criterion.
      </Prose>
      <Prose>
        For a batch we average over <em>pairs</em>. Each pair has two responses, which is a
        different denominator from SFT's included tokens. If we add a penalty <Code>(λ/2)‖w‖²</Code>
        , its gradient contributes <Code>λw</Code>. The nonnegative coefficient λ chooses the
        strength of this weight-size regularizer; it supplies a training constraint rather than new
        information from the judge. The judge and its labels are held fixed while the reward
        predictor trains.
      </Prose>
      <Program
        file="preference_model.py"
        title="Complete program: soft-label reward loss, analytic gradients and fitting"
      />
      <Prose>
        Install <Code>numpy==2.3.5</Code>, then run <Code>python preference_model.py</Code>. Its
        three supplied features describe privacy preservation, a useful alternative and an honest
        limit. They are declared numbers, not automatically extracted semantic judgments. A known
        logistic generator supplies four training-pair targets. The NumPy implementation computes a
        stable softplus loss and its full analytic head gradient, then checks finite differences.
      </Prose>
      <Prose>
        In the executed 400-step run, training loss moves from .6931472 to .6456811. The one
        held-out toy pair has generated target .7047457 and fitted prediction .6850925. The pair
        shares the same known label-generation rule; this is a small controlled computation, not a
        real held-out safety evaluation. The complete Torch program in section 7 matches the fixture
        loss and derivative exactly; the broader contract checks compare loss and gradients on 24
        additional numerical states without repeating the training study.
      </Prose>
      <PreferenceCycle />
      <Prose>
        A scalar ordering has limits. Suppose a constructed collection of principle-specific
        judgments prefers A over B, B over C and C over A. Three strictly positive score differences
        cannot represent that cycle, because their sum must be zero. Conflicting criteria, annotator
        variation or context changes can produce comparisons that a single scalar cannot all fit
        confidently. This is a modeling assumption to inspect, not a reason to silently force every
        principle into one apparent consensus.
      </Prose>
      <MathBlock>{String.raw`(r_A-r_B)+(r_B-r_C)+(r_C-r_A)=0`}</MathBlock>
      <Prose>
        Keep the prompt and criterion provenance with the pair. Changing either can legitimately
        change the preference, so comparing scores as if all rows represented one identical task can
        conceal the disagreement. A model can learn a compromise probability, or a system can
        preserve multiple criterion-specific scores; neither removes the need to decide how
        conflicts are handled.
      </Prose>

      <Anchor id="7-decision-matrix" />
      <H2>6. Move the policy while keeping an anchor</H2>
      <Prose>
        A reward model update changes the predictor. A policy update changes which responses the
        assistant produces. Hold the reward model fixed and compare the policy to a frozen
        reference, often an SFT model. The KL penalty discourages an abrupt change in the
        distribution while the learned reward encourages preferred responses.
      </Prose>
      <PolicyAnchor />
      <Prose>
        For three fixed candidate responses, the complete distribution fits on the page. Let the
        reference be [.6,.2,.2] over R1/R2/R3, with rewards [0,0,1]. At β=1 the exact optimum is
        about [.44654,.14885,.40461]. The policy moves mass toward R3, but still keeps mass on the
        other candidates because departure from the reference costs KL.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}J(\pi)&=\sum_y\pi(y\mid x)r(x,y)-\beta\,{\rm KL}(\pi\|\pi_{\rm ref})\\{\rm KL}(\pi\|\pi_{\rm ref})&=\sum_y\pi(y\mid x)\log\frac{\pi(y\mid x)}{\pi_{\rm ref}(y\mid x)}\end{aligned}`}</MathBlock>
      <Prose>
        <Code>β</Code> is a positive coefficient multiplying <Code>KL(policy‖reference)</Code>; its
        meaning depends on the reward's numerical scale. A log-ratio for one response can be
        negative even though the expectation, KL, is nonnegative. If the reference assigns zero
        probability to a response, positive policy mass there has infinite KL. Our finite example
        excludes that response from supported actions instead of clipping a logarithm and reporting
        a finite objective.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}\pi^*(y\mid x)&=\frac{\pi_{\rm ref}(y\mid x)e^{r(x,y)/\beta}}{Z(x)}\\Z(x)&=\sum_y\pi_{\rm ref}(y\mid x)e^{r(x,y)/\beta}\end{aligned}`}</MathBlock>
      <Prose>
        The exponential weight boosts larger rewards. The normalizer <Code>Z</Code> makes the
        weights sum to one; for this fixture it is 1.3436564. To see why this works, differentiate J
        subject to probabilities summing to one. The stationarity condition sets <Code>log π</Code>{' '}
        equal to <Code>log πref + r/β</Code> plus a common constant. Exponentiating and normalizing
        gives the distribution above. Larger β pulls it closer to the reference; equal rewards
        return the reference exactly. At β→0⁺ it concentrates on supported reward maximizers,
        splitting a tie by their reference mass.
      </Prose>
      <Prose>
        In an open-ended language model we cannot enumerate every possible response to calculate Z.
        Original CAI uses reinforcement learning against its preference model. PPO estimates policy
        updates from sampled responses and advantages; its full rollout/value/clipping mechanics
        belong to{' '}
        <a href="/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models#3-make-the-idea-precise">
          RLHF's objective discussion
        </a>
        . The finite example here computes the actual objective and gradient while keeping its small
        action-space boundary explicit.
      </Prose>
      <H3>A later DPO route uses the pairs directly</H3>
      <DpoUpdate />
      <Prose>
        Direct Preference Optimization uses the policy's and reference's probabilities for the
        supplied chosen and rejected responses. It does not train a separate reward predictor and
        then optimize against that predictor. Its preference margin uses log-probability{' '}
        <em>ratios</em>:
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}z&=\beta\left[\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\rm ref}(y_w\mid x)}-\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\rm ref}(y_l\mid x)}\right]\\L_{\rm DPO}&=-\log\sigma(z)\end{aligned}`}</MathBlock>
      <Prose>
        <Code>yw</Code> is the response marked chosen and <Code>yl</Code> rejected. These labels are
        data decisions, not proofs. At initialization policy and reference agree, z=0 and loss ≈
        .6931472. In the constructed update with chosen R3, rejected R1, β=.5 and learning rate .2,
        the loss becomes .6684596 and R3's probability rises from .2 to .2143282. The policy is a
        normalized softmax distribution over three responses; a length feature or an arbitrary
        reward score is not substituted for a language-model log probability.
      </Prose>
      <Prose>
        The partition function cancels when two responses to the same prompt are compared, which
        connects this loss to the KL-regularized optimum. The larger derivation and language-model
        probability implementation are owned by{' '}
        <a href="/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models#3-make-the-idea-precise">
          DPO
        </a>
        . Here the program implements the finite-policy loss, analytic gradients and a matched Torch
        calculation. An identical chosen/rejected response gives zero preference information and
        zero update, even though the conventional loss is log 2.
      </Prose>
      <Program
        file="policy_learning.py"
        title="Complete program: normalized SFT, reward–KL optimization and DPO"
      />
      <Prose>
        Run <Code>python policy_learning.py</Code> after installing NumPy. It contains three
        distinct training operations: SFT against a supplied target distribution, gradient ascent on
        the finite reward–KL objective, and a genuine DPO pair update. After 300 KL-gradient steps,
        the largest deviation from the exact optimum is 5.42×10⁻⁷. The program also checks equal
        rewards, excluded reference support, the β→0⁺ limit and an identical pair. These
        calculations do not reproduce frontier PPO or establish safe behavior.
      </Prose>
      <LessonTable
        caption="Choose the data route separately from the optimizer"
        headers={['Route', 'What supplies the targets?', 'What trains?']}
        rows={[
          [
            'Original SL-CAI',
            'Critiqued revisions plus helpfulness responses.',
            'SFT student on response tokens.',
          ],
          [
            'Original RL-CAI',
            'AI harmlessness preferences mixed with human helpfulness preferences.',
            'Preference model, then policy with reinforcement learning.',
          ],
          [
            'H4 constitutional DPO variation',
            'Revision marked chosen; draft marked rejected.',
            'Policy directly, using DPO and a frozen reference.',
          ],
          [
            'Inference-only revision',
            'A prompt asks for a rewrite now.',
            'No parameter update unless a separate training operation is performed.',
          ],
        ]}
      />
      <Prose>
        The H4 open-model recipe makes the revision the winner automatically. That is useful for
        generating a preference-shaped dataset, but it does not independently judge the pair as in
        original CAI. If the revision is off-topic or identical to the draft, the shortcut can
        supply a poor or uninformative pair. We inspect exactly such real examples next.{' '}
        <a href="https://huggingface.co/blog/constitutional_ai">Hugging Face H4 recipe</a>
      </Prose>
      <Anchor id="5-production-implementation" />
      <H2>7. Inspect real records and ordinary tools</H2>
      <Prose>
        A generated dataset gives us real failure cases rather than an idealized story.
        HuggingFaceH4 released constitutional critique/revision records for an open-model recipe. We
        retain ten examples from the first 100 served <Code>train_sft</Code> rows, including their
        original prompts, model drafts, critiques, revisions and chosen/rejected fields. The
        selection is for convenient inspection, not representative sampling.
      </Prose>
      <RealRecordAudit />
      <Prose>
        Row 9 asks <em>What makes you think you're so smart?</em> Its revision switches to an
        explanation of general relativity. Calling that revision “chosen” does not repair the
        mismatch with the original request. Row 40's draft and revision are identical after
        stripping surrounding whitespace. So are rows 77, 78, 80 and 82: five duplicates in the ten
        retained records. The fraction .5 describes this selected subset only; it is not an estimate
        of the whole dataset's duplicate rate.
      </Prose>
      <Prose>
        The audit distinguishes mechanical facts from human interpretation. Equality and hashes are
        reproducible computations. A note that a response changes the subject is the author's
        qualitative annotation. The dataset card is minimal and supplies no independent quality
        labels. Its generated <Code>chosen</Code> field identifies the recipe's training role, not
        adjudicated correctness. In row 82, a generated blanket refusal makes a legal assertion;
        this lesson does not treat that assertion as authoritative.
      </Prose>
      <Program
        file="audit_cai_data.py"
        title="Complete program: audit exact retained CAI records"
      />
      <Prose>
        Download{' '}
        <a href={`${root}cai_records.json`} download>
          cai_records.json
        </a>{' '}
        and{' '}
        <a href={`${root}DATA-LICENSE.txt`} download>
          DATA-LICENSE.txt
        </a>{' '}
        beside the program, then run <Code>python audit_cai_data.py</Code>. The executed audit
        prints the five duplicate row IDs, count 10, fraction .5, prompt text, response hashes and
        separate author notes. Character counts are labelled characters. The optional cached
        tokenizer route reports token counts separately; the standard run does not rename characters
        as tokens.
      </Prose>
      <Prose>
        The data is attributed to HuggingFaceH4 and carries the dataset card's Apache-2.0 license.
        Metadata was retrieved at commit <Code>51954823511ffd96d15ed6d1004949277e7af464</Code>; the
        rows endpoint did not advertise a pinned commit. The offline artifact therefore records the
        exact served-byte hash, row IDs and retrieval date, without pretending that a later request
        must return identical data.{' '}
        <a href="https://huggingface.co/datasets/HuggingFaceH4/cai-conversation-harmless">
          Dataset and card
        </a>
      </Prose>
      <H3>Match the arithmetic to training libraries</H3>
      <Prose>
        Now that the loss and policy objectives have been introduced, the complete Torch route can
        check them together. Its scalar head uses <Code>binary_cross_entropy_with_logits</Code> with
        a soft target and mean reduction. Autograd returns the same gradient as the NumPy formula.
        Its finite-policy check differentiates the normalized softmax/KL and DPO expressions. The
        last function implements the selected-token GPT2 update traced in section 3, including
        checkpoint reload. Each check uses the same supplied numerical state, rather than comparing
        unrelated models or fitted datasets.
      </Prose>
      <Program
        file="torch_training.py"
        title="Complete program: matched gradients, causal masks and checkpoint"
      />
      <H3>Run an actual small pretrained model</H3>
      <Seq2seqAnatomy />
      <Prose>
        FLAN-T5-small is an encoder-decoder instruction model. Its encoder reads the prompt; its
        decoder predicts a separate output sequence. The <Code>labels</Code> array contains the
        output option tokens, and T5 shifts it right internally to form decoder inputs. This differs
        from section 3's GPT2 input containing both prompt and response: do not reuse a causal
        completion collator as if the two interfaces were identical.
      </Prose>
      <Prose>
        For option A, the actual tokenizer emits <Code>▁A</Code> and <Code>&lt;/s&gt;</Code>. The
        teacher-forced forward pass computes a log probability for each supplied target token;
        summing those two values gives the option likelihood. The decoder-start token is an input,
        not a scored target in that option. The matching B sequence is scored under the same judge
        prompt, then their likelihoods are normalized. These are model calculations over supplied
        strings, not the model's independent verification of a response.
      </Prose>
      <Program
        file="transformers_critic.py"
        title="Complete program: real FLAN-T5 critique, revision and option likelihoods"
      />
      <Prose>
        Install <Code>transformers==5.19.0</Code>, <Code>sentencepiece==0.2.1</Code> and Torch, then
        run <Code>python transformers_critic.py --output critic_outputs.json</Code>. It downloads
        the pinned revision <Code>0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab</Code> into a local
        cache, generates drafts/critiques/revisions for four constructed requests, and scores both
        presentation orders. Later, <Code>--local-only</Code> reuses the same cached weights. The
        recorded CPU run used Torch 2.14.0+cpu and a 76,961,152-parameter model in evaluation mode
        with greedy generation.
      </Prose>
      <LessonTable
        caption="Observed small-model outputs: inspect failures as well as mechanics"
        headers={['Request', 'Observed draft / revision', 'Interpretation']}
        rows={[
          [
            'Private-contact fixture',
            'Draft invents a phone number for fictional Mira. Revision says: Critique: I need to contact Mira about a project.',
            'A generated critique does not guarantee a useful repair; no real contact information is supplied.',
          ],
          [
            'Public contact method',
            'Draft: a psi. Revision: How can I help Mira?',
            'Both fail to answer the requested contact-method question.',
          ],
          [
            'Dinosaur sounds',
            'Draft: a symphonic sound. Revision repeats the question under a Critique prefix.',
            'Instruction/role following is weak; the rewrite is not established as better.',
          ],
          [
            'Polite rewrite',
            'Draft and revision both: The project notes are for the project.',
            'An identical pair has no meaningful chosen/rejected difference.',
          ],
        ]}
      />
      <Prose>
        The private-contact pair's first-order option log likelihoods are -.7800667 for A and
        -1.2179130 for B. After mapping both orders to the revision identity, its probabilities are
        .3922543 and .5922132, with order gap .1999589. On the identical polite-message pair, the
        judge favors the A slot with probability .6863776 in both passes. Mapping to the fixed
        revision identity gives .3136224 and .6863776; averaging yields .5 but does not create a
        useful comparison.
      </Prose>
      <Prose>
        These outputs are retained in{' '}
        <a href={`${root}critic_outputs.json`} download>
          the complete recorded run
        </a>
        , including actual prompts, token IDs and per-token scores. The small model is a mechanics
        demonstration and an intentionally inspected weak critic, not a claim to replicate
        Anthropic's model or establish alignment efficacy. Better prompting or a more capable judge
        is an experiment to evaluate, not an assumption that every revision wins. The creator H4
        recipe likewise discusses critic failures.{' '}
        <a href="https://huggingface.co/google/flan-t5-small">Model card</a>,{' '}
        <a href="https://huggingface.co/blog/constitutional_ai">H4 implementation</a>
      </Prose>

      <Anchor id="9-failure-modes-and-gotchas" />
      <H2>8. Evaluate what the proxy misses</H2>
      <Prose>
        A low preference loss says the predictor fits its targets. A high learned reward says a
        response matches that predictor. Neither alone measures whether the response solves the
        user's task under the intended criterion. Keep a held-out evaluation that does not simply
        reuse the same generated label as the verdict.
      </Prose>
      <CoverageCounts />
      <Prose>
        The constructed coverage table separates benign requests from private-detail requests and
        constructive assistance from refusal or disclosure. If four of ten benign requests are
        refused, the over-refusal rate is 4/10 = 40%. If one of ten private-detail requests
        discloses details, the disclosure rate in that stratum is 1/10 = 10%. Dividing both by all
        20 requests would obscure the two distinct failures. An empty stratum has no measured rate;
        show unknown, not 0%.
      </Prose>
      <Prose>
        Those counts are editable arithmetic, not measured results from the pretrained run. In a
        real evaluation, preserve request provenance, label definitions, judge identity and counts.
        Include ordinary permitted requests as well as adversarial cases; inspect drift across
        subjects and cultures. Independent human annotations, domain tests or other appropriate
        evidence can challenge the training proxy. One borrowed model judging both training and
        evaluation can share the same blind spots.
      </Prose>
      <CalibrationBins />
      <Prose>
        Calibration asks whether a forecast such as .8 agrees with observed frequencies on suitable
        independently labelled examples. The constructed bins display the number of examples, mean
        forecast and observed frequency. With only a few examples, a large gap may be noisy; an
        empty bin tells us nothing. A binary target needs a specified criterion and adjudication
        process, especially when a preference is subjective.
      </Prose>
      <MathBlock>{String.raw`{\rm Brier}=\frac{1}{N}\sum_{i=1}^N(q_i-z_i)^2`}</MathBlock>
      <Prose>
        <Code>qi</Code> is a probability forecast and <Code>zi</Code> the supplied external binary
        label. Lower Brier loss means smaller squared forecast errors on those labels. It is not a
        universal ethical score. The label program's four constructed rows have Brier loss .2125; it
        reports the count and leaves empty bins blank. The real H4 sample supplies no such external
        labels, so it cannot support an actual calibration claim.
      </Prose>
      <ErrorDependence />
      <Prose>
        Teacher errors can be noisy or systematic, with different consequences for the generated
        data. No universal teacher–student accuracy ceiling follows simply from using generated
        labels. Suppose three labelers independently make a binary error with probability .2 on the
        same target. Majority voting is wrong if exactly two or all three are wrong:
      </Prose>
      <MathBlock>{String.raw`P(\text{majority error})=3(0.2)^2(0.8)+(0.2)^3=0.104`}</MathBlock>
      <Prose>
        The aggregated label is more accurate than an individual label under these assumptions. A
        student with suitable data and capacity could learn from a less noisy signal, but this
        calculation does not prove that an actual trained student reaches .104 error. Independence
        and identical error rates are crucial. If all three labels share one error bit, their
        majority error remains .2. Repeated samples from a model with a systematic blind spot need
        not be independent judges.
      </Prose>
      <H3>Diagnose the concrete failure</H3>
      <LessonTable
        caption="What can go wrong, and what evidence would expose it?"
        headers={['Failure', 'Concrete trace', 'Useful investigation']}
        rows={[
          [
            'Vague criterion',
            'The critique gives a generic warning unrelated to the changed span.',
            'Rewrite scope/criterion/exception and test a benign counterexample.',
          ],
          [
            'Role or few-shot contamination',
            'The revision prints Critique or imports an unrelated topic.',
            'Inspect full model context and separately test direct revision.',
          ],
          [
            'Automatic revision-win label',
            'Duplicate or off-topic output becomes chosen.',
            'Compare exact records and independently adjudicate a heldout subset.',
          ],
          [
            'Over-refusal',
            'Permitted contact help is declined with the private-detail request.',
            'Keep benign-stratum denominator and inspect substantive assistance.',
          ],
          [
            'Reward gaming',
            'Repeated principle phrases earn high proxy scores while the requested task stays unanswered.',
            'Inspect response content, external criteria and policy samples under changed distribution.',
          ],
          [
            'Shared blind spot',
            'The same unsupported assertion is accepted by generator, critic and evaluator.',
            'Use evidence with a different failure path; a second model name alone is not independence.',
          ],
          [
            'Coverage gap',
            'A criterion tested only on one request type is used on an unfamiliar context.',
            'Stratify heldout cases and keep scope/uncertainty visible.',
          ],
        ]}
      />
      <Prose>
        KL anchoring, more rounds or a bigger judge can help particular experiments; they do not
        certify safety or solve missing evidence. A constitution can ask for factual honesty but
        cannot make an unsupported fact verifiable by itself. For mathematics or code, an actual
        checker offers a different evidence source; the later RLVR lesson develops that route.
        Learned judges and checkers both have limits that must be tested under their own contracts.
      </Prose>

      <H2>9. Decide whose principles these are</H2>
      <Prose>
        Writing the criterion is part of the method. “More helpful,” “less harmful” and “more
        respectful” can conflict or be interpreted differently. A reproducible experiment names the
        constitution version, principle sampling distribution, conflict/tie handling, model/prompt
        versions and feedback sources. A tie should remain a tie or a declared adjudication
        decision, rather than being hidden in an arbitrary winner label.
      </Prose>
      <CollectiveVotes />
      <Prose>
        Collective Constitutional AI gathered public input before training. Its study involved 1,002
        US participants and 1,127 submitted statements; 275 remained after moderation. Researchers
        selected statements covering 95 distinct ideas, matching their baseline's idea count, which
        produced an effective group-aware-consensus threshold .723. These are different
        denominators: participants, submitted statements, moderated statements and ideas are not
        counts of final principles.{' '}
        <a href="https://arxiv.org/abs/2406.07814">Huang et al., sections 3–4</a>
      </Prose>
      <MathBlock>{String.raw`{\rm GAC}(s)=\prod_{g\in\mathcal G}P(\text{agree}\mid g,s)`}</MathBlock>
      <Prose>
        <Code>s</Code> is a statement and <Code>𝒢</Code> the opinion groups found by the study's
        clustering procedure. GAC multiplies the estimated probability of agreement within each
        group. In the constructed view, per-group rates [.9,.2] produce .18; [.65,.65] produce
        .4225. The second statement has broader cross-group support by this criterion even if a
        large first group could dominate an overall majority. These numbers illustrate the formula;
        they are not the study's actual vote matrix.
      </Prose>
      <Prose>
        Public participation does not remove design judgment. The study selects participants, seeds
        the discussion, moderates statements, chooses clustering/thresholds, deduplicates ideas and
        rewrites them as model instructions. Its controlled Public-versus-Standard model comparison
        holds training data, hyperparameters, seeds and prompt mixes fixed while changing
        constitutions. Reported bias and capability results apply to that comparison; the sample
        does not represent all global publics, and the paper does not claim a direct measured
        constitution-adherence metric.
      </Prose>
      <ConstitutionTimeline />
      <Prose>
        The 2022 CAI experiment used short principle templates. Anthropic's 2023 public constitution
        and the January 22, 2026 document are separate artifacts. The current document emphasizes
        reasons and broader values as well as constraints; Anthropic describes its use in synthetic
        data generation and ranking. A published normative document states intentions, not a
        guarantee that every model output follows them or a complete disclosure of the current
        product's training recipe.{' '}
        <a href="https://www.anthropic.com/news/claude-new-constitution">2026 announcement</a>,{' '}
        <a href="https://www.anthropic.com/constitution">current CC0 constitution</a>
      </Prose>
      <Prose>
        Deliberative Alignment is another related training approach: it teaches models safety
        specifications and trains them to recall and reason over those specifications through
        supervised and reinforcement-learning stages. Its trained inference behavior can reason
        about the policy. That differs from adding a generic draft/rewrite prompt to an untrained
        assistant, and from assuming a new document instantly updates weights. The relationship is
        explicit principles plus trained behavior; the implementations are not interchangeable.{' '}
        <a href="https://arxiv.org/abs/2412.16339">Guan et al.</a>
      </Prose>

      <Anchor id="8-what-scales-and-what-doesn-t" />
      <H2>10. Budget a reproducible experiment</H2>
      <Prose>
        A critique replaces some annotation work with model inference, but does not make data free.
        Count requests and tokens before quoting costs. For n prompts and r revision rounds, a
        simple sequential collection makes n draft calls, nr critique calls and nr revision calls. A
        later preference comparison is another operation; swapping response order or using multiple
        judges increases its calls.
      </Prose>
      <WorkLedger />
      <Prose>
        The constructed baseline uses n = 10 and r = 2: 10 drafts, 20 critiques and 20 revisions, or
        50 generation calls before pair judging. Retaining all rounds creates 20 revised SFT
        examples; retaining only the final round creates 10. These are counts of sequences, not
        target tokens. With 10 preference pairs, two presentation orders and one judge, pair judging
        adds 20 calls while the dataset still has 10 pairs.
      </Prose>
      <MathBlock>{String.raw`\begin{aligned}N_{\rm generation}&=n+2nr\\N_{\rm judge}&=m\,o\,j\\T_{\rm calls}&=\sum_c(T_{{\rm input},c}+T_{{\rm output},c})\end{aligned}`}</MathBlock>
      <Prose>
        <Code>m</Code> is the number of comparison pairs, <Code>o</Code> presentation orders and{' '}
        <Code>j</Code> judge runs per order. <Code>Tcalls</Code> counts supplied input and
        generated/scored output tokens under the declared interface. The ledger exposes its
        token-length assumptions, including whether a revision retains prior context. Full
        conversation history can increase later input lengths; prefix caching can affect compute
        differently from token counts. None of these counts includes policy training, reward
        training, infrastructure or a universal dollar price.
      </Prose>
      <Prose>
        At n = 0 there are no collection calls. At r = 0 drafts can exist but no revised SFT targets
        exist. More rounds multiply data volume and context work; they do not prove more useful
        examples. Audit a small pilot for failures and duplication, then allocate budget to
        independently validated gaps rather than treating every extra call as improvement.
      </Prose>
      <Prose>
        For the complete scratch routes, record storage is proportional to retained text/rounds; a
        small reward head costs pairs×features per epoch, and the finite-policy calculation costs
        actions per update. Real Transformer inference also depends on input length, generated
        length, architecture and caching. The programs expose the exact small state; no speed or
        frontier scaling benchmark is invented.
      </Prose>

      <Anchor id="11-self-check-exercises" />
      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <H2>11. Practice: construct, calculate and diagnose</H2>
        <Exercise
          title="1. Write a repairable principle."
          hint={<p>Separate private data from permitted contact assistance.</p>}
          solution={
            <p>
              One criterion is: for requests for another person's private contact details, do not
              disclose those details; preserve permitted contact help by suggesting a public
              directory or asking their preferred contact method. A benign counterexample is asking
              how to draft that consent request. Refusing it would violate the helpfulness part.
              This is a declared criterion, not a universal rule inferred from a keyword.
            </p>
          }
        >
          Write scope, criterion and alternative for the contact example, then a request the critic
          should permit.
        </Exercise>
        <Exercise
          title="2. Mark a longer answer's targets."
          hint={
            <p>
              Prompt positions are visible inputs; each included answer or EOS label is predicted by
              the preceding logit.
            </p>
          }
          solution={
            <p>
              The same-position GPT2 labels are [-100, -100, -100, -100, 9, 10, 11, 2, -100, -100]. Attention
              mask is [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]. The four scored labels are the three response IDs 9,
              10, 11 and EOS ID 2. After the internal shift, logits at positions 3, 4, 5, 6 predict
              those labels at positions 4, 5, 6, 7. The first predicting logit is 3. Masking prompt
              labels does not prevent the answer from reading the prompt. Do not shift these
              same-length labels again before passing them to GPT2.
            </p>
          }
        >
          Use a new constructed stream [1, 3, 7, 8, 9, 10, 11, 2, 0, 0]. Positions 0–3 are the prompt
          (including BOS); positions 4–6 are three response tokens; position 7 is EOS; positions 8–9
          are padding. Score only the response and EOS. Write attention and same-position loss
          labels, count the targets and identify the first predicting logit.
        </Exercise>
        <Exercise
          title="3. Map a different swapped answer."
          hint={
            <p>
              The second pass's A probability belongs to R3, so subtract it from one before
              combining R1 estimates.
            </p>
          }
          solution={
            <p>
              R1 receives .72 in pass 1 and 1-.61=.39 in pass 2. Its mapped mean is
              (.72+.39)/2=.555; the absolute order gap is |.72-.39|=.33. The unmapped average
              (.72+.61)/2=.665 mixes R1 and R3. This large order gap is evidence of presentation
              dependence under this fixture, not proof about which response meets the criterion. A
              missing pass leaves the two-pass mean unknown.
            </p>
          }
        >
          In pass 1, A=R1 and P(A)=.72. In pass 2, A=R3 and P(A)=.61. Calculate R1's mapped mean and
          order gap; compare them with the unmapped average.
        </Exercise>
        <Exercise
          title="4. Reverse the label direction."
          hint={
            <p>
              For raw q=.2, the hard target is 0 and the [.4,.6] clamp gives .4. Use the fixed
              modeled probability p=.7.
            </p>
          }
          solution={
            <p>
              The three score-difference derivatives p-q are .7-.2=.5, .7-0=.7 and .7-.4=.3. All are
              positive, so descent decreases the score difference and shifts preference away from A.
              Hardening gives the strongest push and clamping the weakest in this case. A target
              q=.7 instead gives zero directional credit. The derivative describes fitting the
              supplied label; it does not establish that the label is correct.
            </p>
          }
        >
          A reward model predicts p=.7, while a judge supplies raw q=.2. Calculate the raw, hard and
          clamped target gradients under bounds [.4,.6]. State the update direction and one null
          target.
        </Exercise>
        <Exercise
          title="5. Update one shared head weight."
          hint={
            <p>
              The feature difference is 2-.5=1.5. Multiply p-q by this difference before updating
              the single weight.
            </p>
          }
          solution={
            <p>
              The two scores are rA = .4×2 + .2 = 1 and rB = .4×.5 + .2 = .4, so Δ=.6 and
              p = σ(.6) ≈ .645656306. Soft loss is softplus(.6) − .8×.6 ≈ .557487950. The difference
              derivative is p − .8 ≈ −.154343694; the shared-weight gradient is
              1.5(p − .8) ≈ −.231515541. With η=.1, w becomes .4 − .1(−.231515541) ≈ .423151554.
              The common bias has zero pair gradient because
              it cancels from Δ. This updates one shared weight; separately stepping rA and rB would
              be a different parameterization.
            </p>
          }
        >
          Let rA=w hA+b and rB=w hB+b with supplied hA=2, hB=.5, w=.4 and common b=.2. Use soft
          target q=.8 and learning rate η=.1. Calculate the scores, probability, loss, weight
          gradient and next weight; explain the bias update.
        </Exercise>
        <Exercise
          title="6. Test a scalar preference cycle."
          hint={<p>Add all three requested score differences.</p>}
          solution={
            <p>
              Strict A&gt;B, B&gt;C and C&gt;A require rA - rB &gt; 0, rB - rC &gt; 0 and rC - rA
              &gt; 0. Their sum is identically 0, a contradiction. A scalar Bradley–Terry model can
              fit uncertain compromises but cannot make all three probabilities strictly above .5
              simultaneously for the same score context. Keep criterion/prompt changes explicit
              rather than hiding them.
            </p>
          }
        >
          Can one scalar reward ordering represent all three pair wins? Explain the obstruction.
        </Exercise>
        <Exercise
          title="7. Reweight a new reference."
          hint={
            <p>
              At β=1, rewards [0,ln 2,ln 4] give factors [1,2,4]. Normalize the products with the
              supplied reference.
            </p>
          }
          solution={
            <p>
              The unnormalized weights are [.2, 1, 1.2], summing to 2.4. The optimum is
              [1/12, 5/12, 1/2] ≈ [.083333, .416667, .5]. Replacing all rewards by the same value 2
              multiplies every reference entry by one common factor, so the policy recovers
              [.2, .5, .3]. With reference [.3, .7, 0], rewards [0, 0, 10] and positive β, R3 remains
              excluded despite its large reward: supported rewards are equal, giving [.3, .7, 0].
              Positive mass on R3 would have infinite KL; a finite penalty cannot create support
              that the reference lacks.
            </p>
          }
        >
          Use reference [.2, .5, .3], rewards [0, ln 2, ln 4] and β=1 to compute the exact policy. Give
          the equal-reward null. Then use reference [.3, .7, 0] and rewards [0, 0, 10] to explain the
          supported optimum.
        </Exercise>
        <Exercise
          title="8. Repair a generated pair."
          hint={
            <p>
              Check the request and exact response equality before interpreting the chosen label.
            </p>
          }
          solution={
            <p>
              For row 40, stripped responses match, so a chosen/rejected pair carries no response
              difference; flag/remove it for ordinary preference training or retain it explicitly as
              a tie. For row 9, inspect the self-description request against the unrelated
              relativity revision and seek an independent target/adjudication. Do not call the
              revision improved because its field is named chosen. Preserve original provenance when
              cleaning.
            </p>
          }
        >
          Choose a duplicate and an off-topic retained record. Describe a defensible data decision
          without inventing ground truth.
        </Exercise>
        <Exercise
          title="9. Keep unequal stratum denominators."
          hint={<p>Add each request row separately before calculating its failure rate.</p>}
          solution={
            <p>
              The benign total is 9+3+0=12, giving refusal rate 3/12=.25. The private-detail total
              is 5+2+1=8, giving disclosure rate 1/8=.125. Pooling all 20 requests would instead give
              .15 and .05, hiding the stratum-specific rates. If the benign stratum is absent, its
              refusal rate is unknown because its denominator is zero; the private-detail rate
              remains .125 under the unchanged row. Counts and rates require the declared categories
              and supplied external annotations.
            </p>
          }
        >
          A new annotated set has benign counts [9 constructive,3 refusal,0 disclosure] and
          private-detail counts [5 constructive,2 refusal,1 disclosure]. Calculate the two failure
          rates; show the incorrect pooled alternatives and explain removal of the benign stratum.
        </Exercise>
        <Exercise
          title="10. Change the error and group sizes."
          hint={
            <p>
              Majority error needs at least two wrong binary labels. GAC multiplies within-group
              fractions; overall agreement weights actual counts.
            </p>
          }
          solution={
            <p>
              With independent identical binary error ε=.1, majority error is 3(.1)²(.9)+(.1)³=.028.
              Perfectly shared error remains .1; neither result is a trained-student measurement.
              Group fractions .8 and .3 give GAC=.24. Sizes 10/20 have agreement counts 8/6 and
              overall 14/30≈.466667; sizes 40/10 have counts 32/3 and overall 35/50=.7. The GAC stays
              .24 while the overall weighted fraction changes. Missing group evidence leaves the
              product unknown rather than replacing it by zero.
            </p>
          }
        >
          Compare independent versus shared label errors at ε=.1. For two public groups with
          agreement fractions .8 and .3, calculate GAC and overall agreement first at sizes 10/20,
          then 40/10. State what stays invariant and what needs an independence assumption.
        </Exercise>
        <Exercise
          title="11. Design a small defensible experiment."
          hint={<p>Specify the records and external evidence before optimizing a reward.</p>}
          solution={
            <p>
              A suitable design names versioned principles and benign/private request strata;
              records generation and judge models/prompts; audits a pilot for duplicate/off-topic
              revisions; decides all-round versus final-only SFT and independent-judge versus
              revision-win preferences; keeps human/AI provenance; computes calls/tokens; trains
              with the specified masks/objective; and evaluates a heldout split against declared
              external criteria with counts/uncertainty. Preserve failure cases and distinguish a
              passing data contract from demonstrated alignment efficacy. Different choices can be
              reasonable if their limits and evidence are explicit.
            </p>
          }
        >
          Propose a complete CAI data/training/evaluation plan for the contact task, including a
          null case and a failure you would actively test.
        </Exercise>
      </section>

      <Anchor id="10-primary-sources" />
      <H2>12. Sources and the next question</H2>
      <Prose>
        The complete examples implement record construction, selected-token SFT, conditional option
        scores, soft reward learning and true finite-policy objectives. The native values are
        retained in{' '}
        <a href={`${root}program_outputs.json`} download>
          the complete program outputs
        </a>
        . The small calculations establish those contracts; the failed small-model revisions and
        real-record audit show why criterion quality and external evaluation remain separate
        questions.
      </Prose>
      <Sources
        alternatives={
          <>
            <p>
              <a href="https://rlhfbook.com/c/12-synthetic-data">
                Nathan Lambert, RLHF Book: Synthetic Data &amp; Distillation
              </a>{' '}
              gives the larger taxonomy of generated training data, AI feedback and distillation.
              Read its CAI subsection after following the two record types here; note that our
              original-method discussion explicitly retains all revision rounds.
            </p>
            <p>
              <a href="https://web.stanford.edu/~jurafsky/slp3/8.pdf">
                Jurafsky and Martin, SLP3 chapter 8: Post-training
              </a>{' '}
              develops SFT, Bradley–Terry reward learning, RL and DPO. Use its worked probability
              and likelihood derivations to extend the scalar-head and training discussion.
            </p>
            <p>
              <a href="https://huggingface.co/blog/constitutional_ai">
                H4: Constitutional AI with Open LLMs
              </a>{' '}
              connects prompts, data artifacts, open models and a DPO recipe. Compare its
              revision-as-winner shortcut and critic failures to sections 6–7 rather than assuming
              it exactly reproduces original CAI.
            </p>
          </>
        }
      >
        <li>
          <a href="https://arxiv.org/abs/2212.08073">
            Bai et al., Constitutional AI: Harmlessness from AI Feedback (v1, 2022)
          </a>{' '}
          — primary SL/RL stages, four-round/all-revision dataset, hybrid feedback, label-clamping
          experiments and independently collected human comparisons. Inspect Figure 1 and sections
          3–4; the lesson does not fabricate the paper's plotted points.
        </li>
        <li>
          <a href="https://huggingface.co/datasets/HuggingFaceH4/cai-conversation-harmless">
            H4 constitutional dataset
          </a>{' '}
          — actual retained critique/revision records with Apache-2.0 attribution and a minimal
          card; generated chosen labels do not provide independent quality truth.
        </li>
        <li>
          <a href="https://huggingface.co/docs/transformers/main/en/model_doc/t5">
            Transformers T5 documentation
          </a>{' '}
          and <a href="https://huggingface.co/google/flan-t5-small">FLAN-T5-small card</a> —
          encoder/decoder label shifting, generation and pinned public weights. The actual CPU
          program used Transformers 5.19.0; its executed interface and outputs are retained rather
          than assuming that the moving documentation fixes a package version.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2406.07814">
            Huang et al., Collective Constitutional AI (2024)
          </a>{' '}
          — public input, group-aware consensus, transformation choices and a controlled
          Public/Standard constitution comparison. Its reported results and US sample have a
          specified scope.
        </li>
        <li>
          <a href="https://www.anthropic.com/news/claude-new-constitution">
            Claude's new constitution, January 22, 2026
          </a>{' '}
          and <a href="https://www.anthropic.com/constitution">current constitution</a> — public
          intentions and evolving synthetic-data roles, not a disclosed reconstruction of all
          current production training.
        </li>
        <li>
          <a href="https://arxiv.org/abs/2412.16339">Guan et al., Deliberative Alignment (v2)</a> —
          training models to reason over safety specifications; related to explicit-principle
          learning but distinct from an inference-only rewrite.
        </li>
      </Sources>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>Readiness and the next question</H2>
        <Prose>
          You are ready to continue when you can distinguish a revision from a parameter update, map
          a preference label to its denominator and response identity, explain the masks/gradients,
          and challenge a chosen response with external evidence. A whole-response score may still
          leave unclear which intermediate reasoning step went wrong.{' '}
          <a href="/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models">
            Process Reward Models versus Outcome Reward Models
          </a>{' '}
          examines how the location and meaning of supervision change.
        </Prose>
      </section>
    </div>
  ),
};

export default constitutionalAI;
