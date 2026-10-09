// Deterministic projection of the frozen complete reasoning manuscript.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  ReasoningScroll,
  ReasoningTable as NeuralTable,
  ExpressionTree,
  ExposedEvidence,
  ConditionalTree,
  SharedDecoder,
  TraceChecker,
  ProbabilityContributions,
  ScoreCoordinates,
  GradientUpdate,
  GroupComparison,
  SignedClipping,
  SamplerSupport,
  GroupComposition,
  GenerationTimeline,
  ReductionWeights,
  StudySplit,
  SavedRollout,
  TransferResults,
  NativeTrace,
  SampleMatrix,
  SubsetCounting,
  TokenBudget,
  TrainingStages,
  TrainingInterventions,
  CrossingCurves,
  ObservedSets,
  TeacherInformation,
  EvidenceDiagnosis,
} from '../../components/lesson-labs/ReasoningFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <ReasoningScroll label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </ReasoningScroll>
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn-code/rl-reasoning/' + file}
    language="python"
    title={file}
    filename={file}
  />
);
const Old = ({ ids }) => ids.map((id) => <span key={id} id={id} aria-hidden="true" />);
function FileIndex() {
  const files = [
    'sequence_policy.py',
    'reasoning_checks.py',
    'reasoning_sampling.py',
    'tiny_causal_lm.py',
    'reasoning_train.py',
    'reasoning_study.py',
    'acquire_model.py',
    'reasoning_trl.py',
    'reasoning_evaluate.py',
    'README.md',
    'requirements.txt',
    'model-source-report.json',
    'data/source.json',
    'data/gsm8k-slice.json',
    'data/GSM8K-LICENSE.txt',
    'observations.json',
    'download-manifest.json',
  ];
  return (
    <details className="reasoning-file-index">
      <summary>Complete program, data and recorded-result files</summary>
      <p>
        <a href="/learn-code/rl-reasoning/rl-reasoning.zip" download>
          Download the complete bundle
        </a>
      </p>
      <ul>
        {files.map((file) => (
          <li key={file}>
            <a href={'/learn-code/rl-reasoning/' + file}>{file}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
function ReasoningLesson() {
  return (
    <div className="lesson-flow reasoning-flow">
      <Old ids={['1-why-it-exists', '1-start-with-the-problem']} />
      <H2>{'1. One answer, many possible paths'}</H2>

      <Prose>
        {'Suppose the question is '}
        <strong>{'“What is (2 + 3) × 3?”'}</strong>
        {
          ' A language model must choose the words or tokens of its response. We want to understand how checking completed answers can change those choices—and what an improved answer score would actually establish.'
        }
      </Prose>

      <ExpressionTree />

      <Prose>
        {
          'Read the expression from its leaves. Add 2 and 3 to obtain 5; multiply that result by 3 to obtain 15. The operations depend on each other. Multiplying before completing the addition solves a different expression. This small dependency will let us distinguish a correct answer from a correct displayed derivation.'
        }
      </Prose>

      <ExposedEvidence />

      <Prose>
        {'The three responses end with the same answer. '}
        <code>{'sum = 5; answer = 15'}</code>
        {' displays the two correct operations. '}
        <code>{'sum = 6; answer = 15'}</code>
        {' reaches the correct final number through an inconsistent explanation. '}
        <code>{'answer = 15'}</code>
        {
          ' does not expose an intermediate calculation. If the task asks only for a final answer, the short response can satisfy it. If the task requires a derivation, we must say how that derivation will be checked. The absence of written steps is not proof that no internal computation occurred; written steps are not proof that they caused the answer.'
        }
      </Prose>

      <Prose>
        {'A '}
        <strong>{'policy'}</strong>
        {" is the model's distribution over possible next tokens. A "}
        <strong>{'rollout'}</strong>
        {' is one response sampled from that policy. A '}
        <strong>{'reward'}</strong>
        {
          " is a numerical score computed from a rollout. Reinforcement learning changes the policy using rewards of its sampled responses. During inference, sampling more responses changes the amount of computation spent answering a question; it does not itself update the model's weights."
        }
      </Prose>

      <Prose opening="prerequisites">
        {
          'We will first enumerate a tiny response tree, then train an actual shared causal decoder and inspect a normal pretrained-model training route. You need the next-token convention from '
        }
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models'
          }
        >
          {'Causal Language Modeling'}
        </a>
        {', the completion mask from '}
        <a
          href={
            '/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models'
          }
        >
          {'Supervised Fine-Tuning'}
        </a>
        {
          ', and basic probability and derivatives. Each new reward, gradient and evaluation operation is worked through here.'
        }
      </Prose>

      <Prose opening="route">
        {
          'Read sections 1–7 to follow the mechanism, then sections 8–10 to connect it to programs and evidence. Sections 11–13 use that foundation to interpret research and choose a follow-up experiment. The derivations and complete code stay visible; you can revisit their coordinate-level details after tracing the pictures once.'
        }
      </Prose>

      <Old ids={['2-core-intuition', '2-build-the-intuition', '6-visual-walkthrough']} />
      <H2>{'2. A response is a sequence of choices'}</H2>

      <Prose>
        {
          'An answer score arrives at the end. Before we can use it, we need to know the probability of the path that produced that answer.'
        }
      </Prose>

      <ConditionalTree />

      <Prose>
        {
          'In this deliberately finite language, first choose a displayed sum from {4, 5, 6}; then choose an answer from {12, 15, 18}; then emit a fixed end marker. The initial sum probabilities are (.2, .5, .3). After sum 5, the answer probabilities are (.1, .8, .1). Therefore the path “sum 5, answer 15” has probability '
        }
        <code>{'.5 × .8 = .4'}</code>
        {'. After sum 4, the answer-15 probability is .2, so that different path has probability '}
        <code>{'.2 × .2 = .04'}</code>
        {
          '. A later choice depends on the earlier prefix. The nine terminal path probabilities sum to one.'
        }
      </Prose>

      <Prose>{'For prompt x and response tokens y₁,…,y_T, the same rule becomes'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\pi_\\theta(y\\mid x)=\\prod_{t=1}^{T}\\pi_\\theta(y_t\\mid x,y_{<t}),\\qquad \\log\\pi_\\theta(y\\mid x)=\\sum_{t=1}^{T}\\log\\pi_\\theta(y_t\\mid x,y_{<t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {'Here θ denotes all trainable parameters; '}
        <InlineMath>{'y_{<t}'}</InlineMath>
        {
          ' means the already generated prefix. The log turns a product into a sum, which is both numerically useful and exactly the quantity differentiated during training. In a general decoder the end-of-sequence token, '
        }
        <strong>{'EOS'}</strong>
        {
          ', is itself a predicted token. A response cut off by a maximum-token limit has a different termination event from one that chose EOS.'
        }
      </Prose>

      <SharedDecoder />

      <Prose>
        {
          'The finite tree has a separate logit vector at each of its four decision nodes. A neural language model instead reuses the same embedding, attention and feed-forward weights for different questions and prefixes. In our scratch experiment, each token enters two causal Transformer blocks, and the final hidden vector produces 99 next-token logits. Each emitted token is appended to the prefix before the next forward pass. This is sequential generation with shared parameters, rather than a bandit that chooses one predefined “reasoning strategy.” Shared parameters make transfer possible; they do not guarantee that a learned rule will generalize to new questions.'
        }
      </Prose>

      <Prose>
        {'To run the examples, '}
        <a href="/learn-code/rl-reasoning/rl-reasoning.zip" download>
          {'download the bundle'}
        </a>
        {' and keep its directory structure. Create a Python 3.12 virtual environment and install '}
        <code>{'requirements.txt'}</code>
        {' with '}
        <code>{'python -m pip install -r requirements.txt'}</code>
        {
          '. The four finite examples require no downloaded model; the gradient verification uses PyTorch. '
        }
        <a href="/learn-code/rl-reasoning/README.md">
          <code>{'README.md'}</code>
        </a>
        {' gives the separate commands and scientific-run boundaries. Run the first example with '}
        <code>{'python sequence_policy.py'}</code>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <code>{'sequence_policy.py'}</code>
        {' writes the finite tree explicitly. '}
        <code>{'trajectories'}</code>
        {' multiplies a root probability by its selected conditional probability. Its stable '}
        <code>{'softmax'}</code>
        {
          ' subtracts the largest logit before exponentiation; subtracting the same value leaves normalized probabilities unchanged. The complete program also computes the exact gradient and compares it with PyTorch autograd and central differences on all twelve logit coordinates under both final-answer and derivation rewards.'
        }
      </Prose>

      <Program file="sequence_policy.py" />

      <Prose>
        {
          'Enumerating this nine-path tree is cheap. A vocabulary with V possible tokens and length T can have V^T paths, so enumeration is not the general training algorithm. Sampling G responses visits only their G × T token decisions. We will derive why those sampled paths can still provide a useful gradient.'
        }
      </Prose>

      <H2>{'3. The checker defines the learning signal'}</H2>

      <Prose>
        {
          'The probability tree tells us what the model can produce. The checker decides which of those productions receive credit.'
        }
      </Prose>

      <TraceChecker />

      <Prose>
        {
          'Our arithmetic checker has separate outputs for valid syntax, presence of an actual EOS, the intermediate sum, consistency of the multiplication, and the final answer. For the false-step response '
        }
        <code>{'sum = 6; answer = 15'}</code>
        {
          ', syntax and final-answer matching pass, but both the sum and its multiplication fail. For '
        }
        <code>{'answer = 15'}</code>
        {
          ', the final answer passes and the intermediate checks are unavailable. These are distinct observations, not different shades of one “correctness” flag.'
        }
      </Prose>

      <Prose>
        {'The training reward in our experiment is '}
        <strong>
          {
            'one if the parsed final answer is correct and the model actually emitted EOS; zero otherwise'
          }
        </strong>
        {
          '. The displayed derivation is measured separately. Requiring EOS is a declared task rule that makes cap-cut responses unsuccessful, even when their current text already contains the right number. Another task could choose a different rule; changing it changes the objective.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'check_trace'}</code>
        {' uses a full-string finite grammar. It accepts signed integers in '}
        <code>{'sum = …; answer = …'}</code>
        {' or '}
        <code>{'answer = …'}</code>
        {'; it never runs model-produced text with '}
        <code>{'eval'}</code>
        {'. For real GSM8K questions, '}
        <code>{'terminal_number'}</code>
        {' requires exactly one '}
        <code>{'####'}</code>
        {' marker followed by a terminal decimal number. It converts the decimal to an exact '}
        <code>{'Fraction'}</code>
        {', so '}
        <code>{'#### 18'}</code>
        {' and '}
        <code>{'#### 18.0'}</code>
        {
          ' compare as the same value. A second marker, invalid comma grouping, a trailing explanation or '
        }
        <code>{'#### 1/2'}</code>
        {
          " fails this deliberately narrow contract. The official dataset's normalized-string extractor has different acceptance rules; this lesson's checker is not an identical reproduction of that benchmark evaluator."
        }
      </Prose>

      <Program file="reasoning_checks.py" />

      <Prose>
        {
          "When a checker is incomplete, optimizing its output can reward unintended responses. Even an exact arithmetic checker proves only the stated arithmetic property. It cannot establish the truth of an unrelated sentence or reveal the model's hidden computation. "
        }
        <a
          href={
            '/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models'
          }
        >
          {'Process versus outcome reward models'}
        </a>
        {
          ' develops feedback attached to individual displayed steps; our next calculation starts with a single terminal score.'
        }
      </Prose>

      <Old ids={['3-make-the-idea-precise', '3-mathematical-foundation']} />
      <H2>{'4. How one score changes several token choices'}</H2>

      <Prose>
        {
          'We can now calculate the objective before introducing a sampled estimator. Let R(y) be the checker reward and let J(θ) be the expected reward over responses drawn from the policy.'
        }
      </Prose>

      <ProbabilityContributions />

      <Prose>
        {'With final-answer reward, the three paths ending in 15 contribute '}
        <code>{'.04'}</code>
        {', '}
        <code>{'.4'}</code>
        {' and '}
        <code>{'.09'}</code>
        {'. Their sum is '}
        <strong>{'J = .53'}</strong>
        {
          '. If we instead require the displayed sum to be 5 as well, only the middle path receives credit, so the expected reward is '
        }
        <strong>{'.4'}</strong>
        {
          '. The model distribution did not change; the checker changed which probability mass counts.'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'J(\\theta)=\\sum_y\\pi_\\theta(y\\mid x)R(y).'}</MathBlock>
      </div>

      <Prose>
        {
          'Assume the checker is fixed and the finite policy probabilities are differentiable and positive. Differentiate this expectation, multiply and divide by the path probability, and use the log-product rule:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\nabla J=\\sum_y\\pi_\\theta(y\\mid x)R(y)\\nabla\\log\\pi_\\theta(y\\mid x)=\\mathbb E_{y\\sim\\pi_\\theta}\\!\\left[R(y)\\sum_t\\nabla\\log\\pi_\\theta(y_t\\mid x,y_{<t})\\right].'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The '}
        <strong>{'score-function gradient'}</strong>
        {
          ' differentiates the log probability of a sampled response. It does not differentiate through an integer equality checker or through the sampled token IDs. The reward tells the update which sampled paths were useful; the differentiable model tells it how to change their probabilities.'
        }
      </Prose>

      <ScoreCoordinates />

      <Prose>
        {
          'For a softmax decision with probabilities p and sampled action j, the derivative of log p_j with respect to logit z_k is '
        }
        <code>{'1[k=j] − p_k'}</code>
        {'. On the successful path “5, 15,” the root score vector is '}
        <code>{'(−.2, .5, −.3)'}</code>
        {' and the reached child score is '}
        <code>{'(−.1, .2, −.1)'}</code>
        {
          ". Unvisited child nodes contribute zeros. Multiply all these contributions by the same terminal reward. This increases the sampled path's likelihood on average, but does not identify which intermediate step caused success. A false derivation ending in the right answer receives the same final-answer reward."
        }
      </Prose>

      <Prose>{'Subtracting an action-independent baseline b can reduce sampling noise:'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {'\\mathbb E[(R-b)\\nabla\\log\\pi]=\\nabla J-b\\nabla\\sum_y\\pi(y)=\\nabla J.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'For this equation, b may depend on the question but must not depend on which response is sampled; treat it as fixed in the score-function loss. A learned value baseline can have its own training objective. If the baseline secretly equals the sampled reward, every advantage is zero and the estimator is generally biased. A baseline changes individual updates and variance, not the exact expected reward gradient under these assumptions.'
        }
      </Prose>

      <GradientUpdate />

      <Prose>
        {'The exact root gradient in our initial tree is '}
        <code>{'(−.066, .135, −.069)'}</code>
        {
          '. To see why, the conditional expected rewards after sums 4, 5 and 6 are .2, .8 and .3. Each root derivative is '
        }
        <code>{'p_k × (conditional value − .53)'}</code>
        {
          '. The sum-5 branch gains probability, while the two weaker branches lose it. Child-node derivatives also include the probability of reaching that child. '
        }
        <code>{'exact_gradient'}</code>
        {' computes these reverse values directly; '}
        <code>{'update'}</code>
        {' performs gradient '}
        <strong>{'ascent'}</strong>
        {', '}
        <code>{'z ← z + η∇J'}</code>
        {
          '. An optimizer minimizing a loss instead uses the negative reward-weighted log probability. A large step can invalidate the small-change intuition, so the live example lets you compare a bounded step with the unchanged state.'
        }
      </Prose>

      <H2>{'5. Compare responses from the same question'}</H2>

      <Prose>
        {
          "A useful baseline should reflect question difficulty. Comparing answers to the same question prevents an easy question's high reward from being treated as surprising success everywhere."
        }
      </Prose>

      <GroupComparison />

      <Prose>
        {'Consider four rewards '}
        <code>{'[1, 0, 0, 1]'}</code>
        {'. Their mean is .5. Using the sample standard deviation gives '}
        <code>{'sqrt(1/3) ≈ .577350'}</code>
        {'; dividing deviations by that value plus .0001 produces advantages approximately '}
        <code>{'[.865875, −.865875, −.865875, .865875]'}</code>
        {
          ". The denominator convention and epsilon matter. An implementation using the population standard deviation would produce a different magnitude. Dividing by a random sample standard deviation does not inherit the previous section's unbiased constant-baseline proof."
        }
      </Prose>

      <Prose>
        {
          'If all four answers fail—or all four succeed—the centered reward advantages are zero. That removes this reward-driven gradient. A separately enabled KL penalty, entropy bonus, weight decay or existing optimizer momentum may still change weights. “No reward contrast” and “the entire model must remain unchanged” are different claims.'
        }
      </Prose>

      <Prose>
        {'Our scratch experiment uses a simpler unbiased '}
        <strong>{'leave-one-out baseline'}</strong>
        {'. For G independent answers to one question,'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'A_i=R_i-\\frac{1}{G-1}\\sum_{j\\ne i}R_j,\\qquad L=-\\frac1{BG}\\sum_{b,i}A_{b,i}\\sum_t m_{b,i,t}\\log\\pi_\\theta(y_{b,i,t}\\mid x_b,y_{b,i,<t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'B is the number of questions and m selects emitted completion tokens through EOS. The other answers are independent of answer i conditional on the question, which gives the required baseline independence. Subtracting a mean that includes the same sampled answer introduces a factor '
        }
        <code>{'(G−1)/G'}</code>
        {
          ' in the unnormalized estimator; leave-one-out avoids that factor. This is an unbiased gradient estimator under the fresh sampling law, before gradient clipping or optimizer transforms. A group of one cannot supply this baseline. The complete scratch loop uses one fresh batch per update and no reference penalty or repeated optimization over old responses.'
        }
      </Prose>

      <SignedClipping />

      <Prose>
        {'GRPO-style clipped updates additionally keep track of the '}
        <strong>{'old'}</strong>
        {' policy that generated the response and the '}
        <strong>{'current'}</strong>
        {' policy being optimized. Their token probability ratio is '}
        <code>{'r = exp(log π_current − log π_old)'}</code>
        {'. The objective maximizes '}
        <code>{'min(rA, clip(r,1−ε,1+ε)A)'}</code>
        {
          '. For positive A, increasing r past the upper boundary stops increasing the clipped benefit. For negative A, decreasing r below the lower boundary stops increasing that benefit. The opposite directions can still be penalized. The sign of A determines which side matters.'
        }
      </Prose>

      <Prose>
        {'A '}
        <strong>{'reference'}</strong>
        {
          ' policy used for a KL penalty is a separate role; it need not be the old rollout policy. Our native example disables KL with beta zero, uses epsilon .2 and explicitly chooses per-response GRPO reduction. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/grpo-rloo-kto-advanced-preference-methods?module=large-language-models'
          }
        >
          {'group-relative optimization lesson'}
        </a>
        {
          ' owns the broader algorithm comparison. Here the finite derivation and two concrete programs make the particular choices inspectable.'
        }
      </Prose>

      <H2>{'6. Exploration changes what can be learned'}</H2>

      <Prose>
        {
          'No centered reward update can discover a successful answer that never appears in its samples. The sampler therefore belongs in the training specification.'
        }
      </Prose>

      <SamplerSupport />

      <Prose>
        {
          'Temperature divides logits by a positive T before softmax. A smaller temperature concentrates mass on larger logits; a larger temperature spreads it out. Nucleus, or top-p, sampling sorts token probabilities, retains the smallest prefix whose cumulative mass reaches p, and renormalizes that retained mass. The token crossing the threshold stays. A removed token has zero probability under this sampler even if the underlying full softmax assigns it positive probability.'
        }
      </Prose>

      <Prose>
        {
          'The finite tree lets you change both controls and trace every resulting path probability. For the default tree, a top-p threshold .5 keeps only sum 5 at the root and only answer 15 after it, making the sampled final answer always correct. This constructed setting is not evidence that .5 is a generally better threshold. A different root ordering could remove the useful branch entirely. During the scratch study we use T=1 and full vocabulary support; the log probabilities in the loss match that actual sampling distribution.'
        }
      </Prose>

      <GroupComposition />

      <Prose>
        {
          'If independent attempts succeed with probability p, a group of G has all-failed probability '
        }
        <code>{'(1−p)^G'}</code>
        {', all-successful probability '}
        <code>{'p^G'}</code>
        {', and mixed probability '}
        <code>{'1−(1−p)^G−p^G'}</code>
        {
          '. With p=.1 and G=8, all-failed probability is about .430467 and mixed probability is about .569533. Increasing G can reveal a rare reward contrast, but it also spends more generated tokens. When p is already close to one, all-successful groups become common instead.'
        }
      </Prose>

      <Prose>
        {
          'After n failures, p has not been proven zero. Under independent identically distributed Bernoulli attempts, the one-sided 95% upper confidence bound after zero successes is '
        }
        <code>{'1−.05^(1/n)'}</code>
        {
          '. For n=256 it is about .011634. This bound concerns one fixed question/sampler distribution; pooling different questions as if they share one p changes the assumption. Teacher demonstrations can introduce useful trajectories directly, while curricula change which questions supply reward contrast. These are different interventions from drawing more samples from an unchanged policy.'
        }
      </Prose>

      <Program file="reasoning_sampling.py" />

      <Old ids={['8-what-scales-and-what-doesn-t']} />
      <H2>{'7. Length is both work and a confounder'}</H2>

      <Prose>
        {
          'A larger group spends more work. Longer individual responses also spend work, and their treatment changes the objective.'
        }
      </Prose>

      <GenerationTimeline />

      <Prose>
        {
          'Keep four lengths separate: prompt tokens, emitted response tokens, padded tensor positions and the maximum allowed response length. A five-token response ending in EOS contributes five emitted targets. A shorter terminated response may occupy five tensor positions after padding but should not receive five reward-weighted terms. A cap-cut response has no actual EOS; inserting a padding token with the same numeric ID must not invent termination. The rollout records an active mask '
        }
        <strong>{'before'}</strong>
        {
          ' deciding whether the newly chosen token ends the response, so the first EOS remains included.'
        }
      </Prose>

      <ReductionWeights />

      <Prose>
        {
          'Suppose one response has two token contributions of 1 and another has four token contributions of 3. Equal-response averaging gives '
        }
        <code>{'((1+1)/2 + (3+3+3+3)/4)/2 = 2'}</code>
        {'. Pooling all six tokens gives '}
        <code>{'(2+12)/6 = 7/3'}</code>
        {'. Averaging sequence sums gives '}
        <code>{'(2+12)/2 = 7'}</code>
        {
          '. These are different weightings of the same data. Our scratch score-function estimator uses a sequence sum, then averages sampled responses; its expected gradient matches the terminal-return objective derived earlier. The native GRPO route averages within each response. Naming the reduction is more informative than calling both losses simply “policy gradient.”'
        }
      </Prose>

      <Prose>
        {
          'Longer responses may perform useful sequential computation, repeat themselves, exploit a format reward or merely reflect an increased output cap. Comparing correct-only lengths also selects a changing subset of responses. To assess a length change, inspect the actual tokens and compare task success under a declared emitted-token budget. Do not infer a universal accuracy gain from length alone.'
        }
      </Prose>

      <Old ids={['4-from-scratch-implementation']} />
      <H2>{'8. Run a controlled sequential experiment'}</H2>

      <Prose>
        {
          'The finite tree makes derivatives transparent. We now ask whether an actual shared neural policy learns something that transfers beyond the arithmetic families it saw during training.'
        }
      </Prose>

      <StudySplit />

      <Prose>
        {'Generate all 55 unordered operand pairs with '}
        <code>{'0 ≤ a ≤ b ≤ 9'}</code>
        {
          ', shuffle them once with seed 41, and split the pairs into 39 training, 8 development and 8 test families. For each pair, let c take the values 1 through 5. This produces 195 training, 40 development and 40 test questions. Holding out a whole (a,b) family prevents the same addition pair from appearing on both sides merely with a different multiplier. No parameter search uses the development set in this fixed experiment; keeping it separate shows where future choices should be made.'
        }
      </Prose>

      <Prose>
        {
          'The vocabulary contains integers 0 through 90 and eight operator/field/EOS symbols. The prompt '
        }
        <code>{'( a + b ) × c ='}</code>
        {' uses eight tokens. The five target tokens are '}
        <code>{'SUM'}</code>
        {', a+b, '}
        <code>{'ANSWER'}</code>
        {
          ', (a+b)c and EOS. Two pre-norm causal Transformer blocks, width 48, three attention heads and a 99-way output projection give '
        }
        <strong>{'66,528 parameters'}</strong>
        {'. The architecture is the exact '}
        <code>{'TinyLM'}</code>
        {' supplied by Causal Language Modeling; '}
        <code>{'reasoning_train.py'}</code>
        {' owns the new task, generation mask, rewards and learning objectives.'}
      </Prose>

      <Program file="tiny_causal_lm.py" />

      <Prose>
        {'In this reused implementation, '}
        <code>{'CausalAttention'}</code>
        {
          ' projects queries, keys and values, masks future positions and mixes only permitted values. '
        }
        <code>{'Block'}</code>
        {' adds attention and feed-forward residual updates; '}
        <code>{'TinyLM'}</code>
        {
          ' adds token and position embeddings before those blocks and projects each output to vocabulary logits. The original Alice experiment at the bottom is retained with its data; the arithmetic runner imports the classes and supplies its own vocabulary and records.'
        }
      </Prose>

      <Prose>
        {
          'For each of seeds 17, 29 and 43, fit 500 supervised warm-start updates with batch 32 and learning rate .003. Clone that resulting state into two continuations: 80 more SFT updates and 80 fresh-rollout RL updates, each with learning rate .0003. Each continuation receives the same sequence of eight training questions, repeated eight times. SFT supplies their correct five-token targets; RL samples eight attempts per question. Both use AdamW without weight decay and gradient-norm clipping at one. Equal question schedules and nominal sample counts do not imply equal floating-point work: autoregressive sampling requires repeated forwards, and early EOS can alter emitted-token counts.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'completion_logits'}</code>
        {
          ' concatenates the prompt with all but the last completion token and takes predictor positions beginning at index seven. Thus the last prompt token predicts SUM, and the last content token predicts EOS. '
        }
        <code>{'rollout'}</code>
        {' appends sampled tokens to the actual causal history. '}
        <code>{'reinforce_loss'}</code>
        {
          ' gathers those same sampled targets, selects emitted positions, sums log probabilities and multiplies by detached leave-one-out advantages. The reward computation itself remains outside autograd.'
        }
      </Prose>

      <Program file="reasoning_train.py" />

      <SavedRollout />

      <Prose>
        {'Inspect the saved seed-17 update 21. Its first response to '}
        <code>{'(2+6)×4'}</code>
        {' is '}
        <code>{'sum = 8; answer = 32'}</code>
        {
          ", with five active targets and reward 1. Its group contains one failure, so this successful response's leave-one-out advantage is approximately 1/7. Each of its five recorded token log probabilities contributes to the same reward-weighted sequence score. At another saved step all rewards are one and the reward gradient is zero. Adam's existing moment estimates can still affect an update; inspect actual parameter state rather than equating a zero current gradient with a fresh optimizer."
        }
      </Prose>

      <Prose>
        {''}
        <code>{'reasoning_study.py'}</code>
        {
          ' writes the exact source hashes, split, seeds, budgets and evaluation plan before fitting. It refuses an existing output directory. All three warm starts and all six continuations finish before the held-out campaign starts. We then evaluate the already declared checkpoints 0, 20, 40, 60 and 80; none is selected for looking best on test. Each evaluated model generates 16 attempts for each of the 40 test questions under T=1, full support and a five-token cap.'
        }
      </Prose>

      <Program file="reasoning_study.py" />

      <TransferResults />

      <Prose>
        {
          "The outcome is a useful failure. Average training rollout rewards during RL are .985547, .987695 and .987695 for the three seeds. Only 69, 54 and 58 of each run's 640 question groups have mixed rewards. Yet "
        }
        <strong>
          {
            'all three warm starts and all three terminal RL models produce zero correct test answers out of 640 sampled attempts per model'
          }
        </strong>
        {
          '. Every displayed derivation in all 27 checkpoint evaluations is incorrect. The models have learned the training families and output format without demonstrating the intended arithmetic generalization.'
        }
      </Prose>

      <Prose>
        {
          'The terminal SFT models produce 0, 1 and 1 correct final answers out of 640. Their two successes are revealing: '
        }
        <code>{'(1+5)×2'}</code>
        {' receives '}
        <code>{'sum = 56; answer = 12'}</code>
        {', and '}
        <code>{'(1+1)×5'}</code>
        {' receives '}
        <code>{'sum = 5; answer = 10'}</code>
        {
          '. Both final numbers are correct and both displayed derivations are wrong. Treating these isolated matches as learned arithmetic would ignore the stronger diagnostic already available.'
        }
      </Prose>

      <Prose>
        {'Reference-target token '}
        <strong>{'negative log-likelihood (NLL)'}</strong>
        {
          " also behaves differently from sampled correctness. It averages the negative log probability of each known reference token under its correct prefix. Seed 17 moves from warm-start NLL 2.440459 to RL NLL 2.324509, but its sampled test success remains zero. Seed 29's RL NLL rises from 2.401092 to 2.429248. Seed 43's falls from 2.131697 to 2.111793. These are per-token natural-log losses on the known five-token reference; they measure a different object from generated answer accuracy. The complete saved traces and all checkpoint values are available with the code, including unfavorable outcomes."
        }
      </Prose>

      <Prose>
        {
          'The experiment establishes this controlled result for a tiny finite-language model. It does not establish that reinforcement learning cannot generalize arithmetic, or identify a universal minimum model size. A justified follow-up would change one suspected limitation—representation, family coverage, warm-start data or reward curriculum—using development families, then test the resulting choice on fresh held-out families.'
        }
      </Prose>

      <Old ids={['5-production-implementation']} />
      <H2>{'9. Use a real pretrained policy and the normal trainer'}</H2>

      <Prose>
        {
          'The scratch experiment explains the operations. An ordinary library route adds a pretrained tokenizer/model, trainer batching and real word-problem text. Those layers need their own explicit contracts.'
        }
      </Prose>

      <NativeTrace />

      <Prose>
        {'The supplied route loads the actual pretrained '}
        <strong>{'Pythia-14m'}</strong>
        {', pinned to revision '}
        <code>{'cf967c0a9a04383db6f7b1108d86b2962634b4ac'}</code>
        {
          ", with 14,067,712 parameters. This is a small English base model, not an instruction-tuned reasoning model. The data contains the first 16 training and 8 test questions of the pinned MIT-licensed GSM8K files, with their original solutions. For example, Janet's 16 daily eggs minus 3 eaten and 4 used for muffins leave 9 eggs; selling them for $2 gives $18. The prompt requests a terminal "
        }
        <code>{'####'}</code>
        {' numeric answer; the callback checks that value and an actual EOS.'}
      </Prose>

      <Prose>
        {'Use the bundled acquisition script to verify the exact model bytes, then run:'}
      </Prose>

      <CodeBlock language={'bash'}>
        {
          'python -m pip install -r requirements.txt\npython acquire_model.py --output model\npython reasoning_trl.py --model model --output native-run'
        }
      </CodeBlock>

      <Prose>
        {''}
        <code>{'reasoning_trl.py'}</code>
        {
          ' uses TRL 1.14.2 and Transformers 5.19.0. It sets CPU float32, four generations per question, batch eight, two optimizer steps, learning rate 1e-6, a 96-token completion cap, T=1, top-p=1 and top-k=0. '
        }
        <code>{"loss_type='grpo'"}</code>
        {' chooses per-response averaging; '}
        <code>{"scale_rewards='group'"}</code>
        {' chooses group standardization; '}
        <code>{'beta=0'}</code>
        {
          ' removes the reference KL term. Current TRL defaults are not a statement of the original R1 recipe, so these choices are explicit. '
        }
        <code>{'mask_truncated_completions=False'}</code>
        {
          ' retains cap-cut completion positions in the loss mask, while the custom reward still gives them zero for missing EOS.'
        }
      </Prose>

      <Prose>
        {
          'The acquirer checks the pinned source report before reusing an existing file and verifies each downloaded digest before renaming its temporary file. It downloads weights; it does not execute remote model code or train anything.'
        }
      </Prose>

      <Program file="acquire_model.py" />

      <Program file="reasoning_trl.py" />

      <Prose>
        {
          'Before any task update, the script compares native and manual clipped losses on the constructed nonzero reward group from section 5. It checks gradients with respect to the same token log probabilities at log-ratio shifts 0, +.4 and −.4, including masked positions. At ratio one the signed advantages cancel in the scalar mean loss, but the coordinate gradients are nonzero. '
        }
        <strong>{'A zero scalar loss is not generally a zero gradient.'}</strong>
        {' This is an objective-contract check, separate from measured model performance.'}
      </Prose>

      <Prose>
        {
          "The real two-update run consumes 16 completions from four distinct training questions, drawn from the available 16-record dataset. All rewards are zero. The subsequent 8-question, 4-attempt evaluation has zero rewards in all 32 completions. With a fresh optimizer, zero KL and zero weight decay, the saved policy's tensor digest remains identical; reloading it is exact. Raw completions are retained so that the empty reward signal is observable. Merely calling "
        }
        <code>{'trainer.train()'}</code>
        {' did not produce a reasoning improvement.'}
      </Prose>

      <Prose>
        {
          'The reported trainer runtime is 29.387 seconds on the executed CPU configuration; it excludes model acquisition and the later held-out generation. It is not a latency promise for another machine. The native route demonstrates actual tokenization, sampling, reward plumbing, masks, loss conventions and persistence. The scratch study and this API demonstration answer different questions, so their model scores should not be compared as a benchmark.'
        }
      </Prose>

      <H2>{'10. Measure what improved'}</H2>

      <Prose>
        {
          'An experiment can change the probability of success, the chance of finding at least one solution, the quality of a selector or the token cost. These need different measurements.'
        }
      </Prose>

      <SampleMatrix />

      <Prose>
        {
          'Consider a question with eight sampled answers, two correct. The sample mean, 2/8=.25, estimates the probability that one draw is correct: '
        }
        <strong>{'pass@1'}</strong>
        {
          '. An oracle that knows the ground truth would find at least one correct answer among all eight, so its observed success is one. A majority vote may still choose an incorrect answer if the six failures agree. An answer-checking oracle is not a deployable selector when ground truth is unavailable.'
        }
      </Prose>

      <Prose>
        {
          'For true per-draw probability p and independent attempts, the probability of at least one success in k draws is '
        }
        <code>{'1−(1−p)^k'}</code>
        {
          '. But plugging the noisy sample estimate c/n into that formula introduces bias. We can instead average over all size-k subsets of the n observed attempts.'
        }
      </Prose>

      <SubsetCounting />

      <Prose>
        {'There are '}
        <code>{'C(n,k)'}</code>
        {' equally sized subsets and '}
        <code>{'C(n−c,k)'}</code>
        {' contain only failures. Thus'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\widehat{\\operatorname{pass@k}}=1-\\frac{\\binom{n-c}{k}}{\\binom{n}{k}},\\qquad 1\\le k\\le n.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'For n=8, c=2 and k=2, this is '}
        <code>{'1−15/28 = 13/28 ≈ .464286'}</code>
        {'. For k=4 it is '}
        <code>{'1−15/70 = 11/14 ≈ .785714'}</code>
        {'. If c=0 the estimate is zero; if fewer than k failures remain, it is one. '}
        <code>{'pass_at_k'}</code>
        {' evaluates the failure product using '}
        <code>{'log1p'}</code>
        {' and '}
        <code>{'expm1'}</code>
        {
          ', avoiding factorial overflow and loss of precision. The estimator targets independent draws under one fixed sampler; correlated search outputs require a different interpretation. Calculate it per question, then average questions so one heavily sampled question does not silently get greater weight.'
        }
      </Prose>

      <Prose>
        {
          'Our majority function excludes invalid answers and unterminated responses, and resolves ties by first occurrence. The rule is deterministic and declared; another tie rule is another selector. For the local experiment, all terminal majority results are zero, even in the two runs with one correct final answer among 640 draws.'
        }
      </Prose>

      <TokenBudget />

      <Prose>
        {'A fixed sample count does not fix work when lengths vary. '}
        <code>{'budget_prefix'}</code>
        {
          " replays attempts in generation order under a hard emitted-token budget. If only part of the next attempt fits, those tokens consume the remaining budget and that unfinished attempt casts no vote. The policy cannot look at an attempt's eventual length and skip it for free. Select first-answer, majority or explicitly named oracle outcomes on that same budget prefix; keep selection quality separate from whether any correct candidate exists."
        }
      </Prose>

      <Program file="reasoning_evaluate.py" />

      <Prose>
        {
          'When comparing two models, pair observations on the same questions. Our five multipliers share one (a,b) family, so the study first averages within each family and resamples the eight family differences. It retains all three training seeds separately. The all-zero RL differences produce a bootstrap interval '
        }
        <code>{'[0,0]'}</code>
        {
          '; that is degeneracy of resampling the observed zeros, not proof of zero population uncertainty. Eight families and 16 draws per question are a small diagnostic sample. More defensible uncertainty needs more independent questions and enough attempts to resolve the probabilities being compared.'
        }
      </Prose>

      <H2>{'11. Read R1 as a documented training system'}</H2>

      <Prose>
        {
          'The components above help us read a larger reported system without turning one acronym into the whole explanation.'
        }
      </Prose>

      <TrainingStages />

      <Prose>
        {''}
        <strong>{'R1-Zero'}</strong>
        {' begins reasoning-oriented reinforcement learning from the base model. '}
        <strong>{'R1'}</strong>
        {
          ' adds a cold-start supervised stage, reasoning-oriented RL, rejection-sampling data followed by supervised training, and a broader RL stage. These stages contribute different information. A teacher-generated or selected demonstration supplies a target sequence; a verifier supplies an outcome score; a reward model supplies a learned estimate. The R1 distillation branch trains separate students on collected demonstrations. It is not evidence that those students independently rediscovered all trajectories through reward-only training.'
        }
      </Prose>

      <Prose>
        {
          'The original January 2025 report and the expanded January 2026 version contain different descriptions and results. When interpreting a number, retain its version, model, benchmark and selection rule. In particular, averaging binary correctness over many sampled responses estimates pass@1; majority voting and oracle success among those responses are different metrics. A development benchmark used to guide training is not an untouched final test. The '
        }
        <a href={'https://arxiv.org/html/2501.12948v2'}>{'expanded R1 report'}</a>
        {' supplies the relevant training and evaluation detail.'}
      </Prose>

      <TrainingInterventions />

      <Prose>
        {
          'The expanded version documents reference refreshes and a later increase in the rollout length cap. Put such interventions on the same timeline as any response-length observation: the training environment changed. Its evaluation sampler also differs from its training sampler. These facts make a simple “longer response therefore new reasoning ability” interpretation inadequate. Read the actual trace and controlled evaluation, not only the plotted average length.'
        }
      </Prose>

      <Prose>
        {'Outcome-based reasoning training is also not synonymous with GRPO. '}
        <a href={'https://arxiv.org/html/2411.15124v1'}>{'Tülu 3'}</a>
        {
          ' uses a PPO-based verifiable-reward stage within its own post-training recipe. Model initialization, data, value estimation, reward construction and evaluation matter alongside the policy objective. The implementation choices in our two small programs are stated explicitly so that differences from these large systems remain visible.'
        }
      </Prose>

      <H2>{'12. What can a success curve establish?'}</H2>

      <Prose>
        {
          'Suppose a model improves at producing its most likely solutions. Does that establish that it can solve more kinds of problem? A crossing curve shows why those questions differ.'
        }
      </Prose>

      <CrossingCurves />

      <Prose>
        {
          "Construct two equally weighted tasks. The base model succeeds with probabilities (.2,.2); the changed model succeeds with probabilities (.8,.01). The changed mean pass@1 is .405 versus .2, so one-draw accuracy improves. At k=16, however, the base's chance of finding a solution on a random task is about .971853, while the changed model's is about .574271. It became very good at the first task and much worse at the second. These are exactly computed probability curves, not measured benchmark results."
        }
      </Prose>

      <ObservedSets />

      <Prose>
        {'For actual models, record which questions each solves under the '}
        <strong>{'same finite budget'}</strong>
        {
          '. The four cells are solved by both, base only, changed only and neither observed to solve. A question in the last cell is not mathematically impossible for either policy. The distribution of successes across questions, not only their grand total, reveals whether improvements concentrate or spread.'
        }
      </Prose>

      <Prose>
        {''}
        <a
          href={
            'https://papers.neurips.cc/paper_files/paper/2025/file/537d5aa768c2d534016a4d06f87bc8fb-Paper-Conference.pdf'
          }
        >
          {"Yue and colleagues' NeurIPS 2025 study"}
        </a>
        {
          ' reports differences between single-sample performance and sampled coverage in its tested models. That provides a concrete investigation of sampling efficiency. Finite unsuccessful searches do not prove zero model support, and a low average token perplexity for a long solution is not the probability of sampling the whole solution. A product of many reasonably likely token events can still be a very small sequence probability.'
        }
      </Prose>

      <TeacherInformation />

      <Prose>
        {
          'Teacher-guided methods change the experiment. A teacher can provide a successful trajectory on a question that the current student did not solve within its exploration budget. Supervised learning on that trace can move probability toward useful paths, followed by fresh RL exploration. '
        }
        <a href={'https://arxiv.org/html/2606.22317v1'}>{'Boundary-Aware Curriculum RL'}</a>
        {
          ', a June 2026 preprint, explicitly includes such a teacher/SFT bridge. Its results therefore concern a system with new demonstration information. They cannot settle a claim restricted to reward-only learning from an unchanged starting distribution. '
        }
        <a href={'https://aclanthology.org/2026.acl-long.1994.pdf'}>{'RL-PLUS'}</a>
        {
          ' similarly offers a further study of integrating external demonstrations with policy learning.'
        }
      </Prose>

      <Prose>
        {
          'There is no universal parameter-count threshold implied by a few successful or failed runs. The informative question is which initialization, data, checker, sampling support and compute budget produce which transferable behavior. A claim of new capability needs controlled evidence that distinguishes those possibilities.'
        }
      </Prose>

      <Old ids={['7-decision-matrix', '9-failure-modes-and-gotchas']} />
      <H2>{'13. Choose the next intervention'}</H2>

      <Prose>
        {
          'The saved artifacts tell us where to intervene. Start with the first broken link between the intended task and the measured output.'
        }
      </Prose>

      <EvidenceDiagnosis />

      <Prose>
        {
          'If strings fail to parse, inspect actual tokenizer boundaries, prompt wording, EOS and the checker grammar. If every group has one reward value, inspect both all-failed and all-successful rates; they suggest different data problems. If training reward is near one while held-out families fail, as in our scratch experiment, first investigate representation and family coverage. More updates on the same already solved families are not evidence of a remedy. If generated length grows, inspect caps, selected subsets and reward incentives before crediting useful extra computation. If the final answer passes while steps fail, inspect the mismatch between the requested property and the reward.'
        }
      </Prose>

      <Prose>
        {
          'For numerical tasks, a reference answer can make a terminal check exact within a specified grammar. For code tasks, passing executable tests certifies those tests, not all possible inputs. The same loop—sample, check, update, evaluate—has different guarantees because the checker has different coverage. Design evaluation around the intended use, including the cost of selecting an answer, then change one justified element and test it on new evidence.'
        }
      </Prose>

      <Prose>
        {
          'The downloadable files include complete programs, real records and retained observations. Begin with the finite tree, change a reward or conditional probability, and check the gradient. Then change the neural experiment prospectively, conserving its split and recording a new protocol. A useful extension explains why its metric should change and reports the result even when it does not.'
        }
      </Prose>
      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <Old ids={['11-self-check-exercises']} />
        <H2>{'14. Independent practice'}</H2>
        <Prose>
          {
            'Try the changed cases before opening their hints or solutions. These exercises use the same mechanisms with new inputs; the live investigations remain freely editable.'
          }
        </Prose>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'1. Follow a conditional path'}</H3>

          <Prose>
            {
              'A root chooses sums 3 and 4 with probabilities .6 and .4. After sum 3, answer 12 has probability .2; after sum 4, it has probability .7. Compute final-answer success probability. Then require the displayed sum to be 4 as well.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {" Multiply each branch's reach probability by its conditional success probability."}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' Final-answer success is '}
              <code>{'.6×.2 + .4×.7 = .4'}</code>
              {'. Requiring the correct displayed sum removes the first contribution and gives '}
              <code>{'.4×.7=.28'}</code>
              {
                '. The difference .12 is probability assigned to final-correct but derivation-invalid paths. No policy parameter changed.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'2. Derive one reward gradient'}</H3>

          <Prose>
            {
              'At a binary root let p=(.3,.7) and downstream expected rewards be (.9,.2). Compute expected reward and the two logit derivatives. State the direction of a small ascent step.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Use p_k(V_k−J), not V_k alone.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' '}
              <code>{'J=.3×.9+.7×.2=.41'}</code>
              {'. The derivatives are '}
              <code>{'.3×(.9−.41)=.147'}</code>
              {' and '}
              <code>{'.7×(.2−.41)=−.147'}</code>
              {
                '. Increasing the first logit and decreasing the second shifts probability toward the stronger branch. Their sum is zero because a common logit shift cannot affect softmax. Compare your result with central differences using a changed two-branch fixture; both the objective and the gradient must use the same conditional rewards.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'3. Find a biased baseline'}</H3>

          <Prose>
            {'An implementation sets b equal to the sampled reward before multiplying '}
            <code>{'(R−b)∇logπ'}</code>
            {
              '. Explain why this does not demonstrate a variance-free correct estimator. Give a valid alternative for independent samples from one question.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {' Ask what the estimator returns when the true expected-reward gradient is nonzero.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' It always returns zero, including the nonzero derivative in exercise 2. The baseline depends on the sampled response, so its expected score contribution need not vanish. Use a question-dependent constant, a separately fitted value estimate treated as fixed in this loss, or the mean reward of the other independently sampled responses. For rewards '
              }
              <code>{'[1,0,1]'}</code>
              {', leave-one-out advantages are '}
              <code>{'[.5,−1,.5]'}</code>
              {
                '; their group dependence does not break the required independence between response i and its other-response baseline.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'4. Diagnose a zero-contrast group'}</H3>

          <Prose>
            {
              'All rewards in a group are one. The current binary policy has p=.8, its reference has q=.5, and a forward-KL penalty is enabled. Is the entire gradient zero?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {' Differentiate '}
              <code>{'p log(p/q)+(1−p)log((1−p)/(1−q))'}</code>
              {' with respect to the current logit.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' The centered reward gradient is zero. The KL derivative is '}
              <code>{'p(1−p)[logit(p)−logit(q)] = .16 log 4 ≈ .221807'}</code>
              {
                '. Minimizing a positive multiple of this penalty moves p toward the reference. The total loss can therefore move the policy. With KL disabled, existing optimizer momentum or other terms must still be considered separately.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'5. Respect the sign in clipping'}</H3>

          <Prose>
            {
              'Let ε=.2, r=1.4 and A=−2. Compute the unclipped and clipped products and the minimum used by the maximization objective. Repeat with A=+2.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Multiply by the signed advantage before taking the minimum.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' For A=−2, products are −2.8 and −2.4; the minimum is −2.8. The adverse increase in a negatively advantaged action remains penalized. For A=+2, products are 2.8 and 2.4; the minimum is 2.4, so additional beneficial increase past the upper limit is clipped. Clipping r without retaining the signed minimum gives the wrong behavior.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'6. Calculate missing exploration'}</H3>

          <Prose>
            {
              'Independent attempts succeed with p=.02. What is the probability that a group of 16 has no success? Can 16 failures establish p=0?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Every draw must fail; then invert the probability of observing all failures for the confidence bound.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' All-failed probability is '}
              <code>{'.98^16 ≈ .723798'}</code>
              {
                '. Such failure is common even though success has positive probability. Under a fixed iid sampler, zero of 16 gives one-sided 95% upper bound '
              }
              <code>{'1−.05^(1/16) ≈ .170749'}</code>
              {
                ', not zero. A group-size decision should compare the added chance of useful contrast with the emitted-token cost.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'7. Inspect nucleus support'}</H3>

          <Prose>
            {
              'The next-token probabilities are (.55,.3,.15), and only the third token can lead to success. What happens at top-p=.8? What changes at top-p=1?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Retain the token that first crosses the cumulative threshold.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The first two tokens reach cumulative mass .85, so the third is excluded. Their sampling probabilities become '
              }
              <code>{'.55/.85'}</code>
              {' and '}
              <code>{'.3/.85'}</code>
              {
                '; success through the third token is impossible under this truncated sampler. Full support retains probability .15 for it. This is a statement about the sampling rule, not proof that its logits were negative infinity in the underlying model.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'8. Repair an EOS mask'}</H3>

          <Prose>
            {'EOS and PAD share ID 0. A generated row is '}
            <code>{'[7,0,0,0]'}</code>
            {'; another is '}
            <code>{'[7,8,9,4]'}</code>
            {
              " at a four-token cap with no EOS. Give the emitted masks and explain the final reward under this lesson's termination rule."
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Mark the first EOS before padding the row.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' The first mask is '}
              <code>{'[1,1,0,0]'}</code>
              {': include the first EOS, exclude later padding. The second is '}
              <code>{'[1,1,1,1]'}</code>
              {
                ': all four tokens were emitted. Its reward is zero because it did not terminate, even if an answer parser already finds a correct value. Testing only '
              }
              <code>{'token_id != pad_id'}</code>
              {
                ' would incorrectly delete the genuine EOS. Termination status must come from generation history before padding.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'9. Separate three success metrics'}</H3>

          <Prose>
            {
              'Ten attempts contain three correct answers. The other seven all return the same wrong number. Compute pass@1, the finite-sample pass@3 estimate, oracle success among ten and majority correctness.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                " Count three-element subsets containing only failures separately from the selector's vote."
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' Pass@1 is .3. Pass@3 is '}
              <code>{'1−C(7,3)/C(10,3)=1−35/120=17/24≈.708333'}</code>
              {
                '. Oracle success is one because a correct answer exists. Majority correctness is zero because the wrong answer has seven votes. A sampler and a selector can therefore change different metrics.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'10. Spend a hard token budget'}</H3>

          <Prose>
            {
              'Three sequential attempts require 4, 7 and 3 emitted tokens. The first is wrong, the second correct and the third wrong. With a budget of 8, which completed attempts can vote and how many tokens are charged?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' At the start of the second attempt, its eventual length is not available to the online policy.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The first four-token attempt completes. Four tokens of the second attempt consume the remaining budget, but its final answer is unavailable and cannot vote. Charge all eight tokens. Do not skip the second attempt using knowledge of its eventual seven-token length to obtain the third cheaply. '
              }
              <code>{'budget_prefix'}</code>
              {
                ' returns one completed attempt, four partial tokens and an unfinished-attempt flag.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'11. Distinguish answer reward from derivation validity'}</H3>

          <Prose>
            {'For '}
            <code>{'(3+4)×2'}</code>
            {', inspect '}
            <code>{'sum = 8; answer = 14'}</code>
            {
              ' followed by EOS. Then inspect the same text with no EOS. State syntax, sum correctness, product consistency, final-answer correctness and reward.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Compare 14 with both the true product and the product implied by the displayed sum.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Syntax is valid; 8 is not 3+4; 14 is not 8×2; the final answer is nevertheless the correct 14. With EOS the final-answer reward is one and derivation correctness is false. Without EOS the reward is zero. A strict process-and-outcome reward would be a changed objective, not a corrected implementation of the original final-only objective.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'12. Design the split before fitting'}</H3>

          <Prose>
            {'A dataset contains '}
            <code>{'(2+7)×1'}</code>
            {' through '}
            <code>{'(2+7)×5'}</code>
            {
              '. A random row split places four in training and one in test. What does that test fail to isolate, and how would you change the experiment?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Identify the unit of information shared across those five rows.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' It cannot cleanly test generalization to an unseen addition family: training already exposes 2+7 and several associated products. Split by (a,b) family first, then put all multipliers for that family in the same partition. Use a distinct development partition for settings or stopping choices, and seal final test families until the declared evaluation. A stronger transfer question may also require unseen operands or number ranges; name the property being tested rather than calling any split “generalization.”'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'13. Interpret contradictory diagnostics'}</H3>

          <Prose>
            {
              'A run has .99 training reward, no correct held-out samples, valid output format and improving reference-token NLL. Propose a justified next diagnostic. Does a '
            }
            <code>{'[0,0]'}</code>
            {
              ' bootstrap interval from all-zero paired success differences settle the population effect?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Inspect what each metric conditions on and which observed differences a bootstrap can resample.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Inspect held-out raw sums/products, train/test family coverage and model probability on the reference under the same representation. Good format and token NLL do not establish sampled answer accuracy. Check whether training groups are almost always all-successful and hence provide little comparative signal. The degenerate interval merely resamples observed zeros; it does not establish no possible effect on unseen questions. Increase independent evaluation families and sampling resolution before making a broad claim. Any training change should be chosen on development evidence and tested on fresh questions.'
              }
            </Prose>
          </details>
        </section>
        <section className="reasoning-practice lesson-exercise" data-lesson-exercise>
          <H3>{'14. Extend one complete program'}</H3>

          <Prose>
            {
              'Change the scratch experiment to reward only responses that have a correct displayed derivation and actual EOS. Keep its family split, model, seeds, schedule and sampling law fixed. Specify the implementation change, null cases and report you would need before claiming improvement.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Change the reward field used by the update, not the answer string or test reference. Preserve both metrics.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' Define the new training reward as '}
              <code>{"int(result['derivation_correct'] and result['terminated'])"}</code>
              {
                '. Keep the old final-answer metric and add the new process-and-outcome metric in evaluation. The '
              }
              <code>{'sum = 6; answer = 15'}</code>
              {' countercase must now receive zero for '}
              <code>{'(2+3)×3'}</code>
              {'; '}
              <code>{'sum = 5; answer = 15'}</code>
              {
                " with EOS gets one; the same text without EOS gets zero. First test masks, reward cases and a nonzero changed-gradient fixture. Save a new prospective protocol and output directory, run every declared seed once, and compare fixed checkpoints on new or genuinely held-out evaluation data. Report all-failed/all-successful/mixed groups, emitted tokens, final-answer and derivation metrics, and each seed's outcomes. This is an implementation and experimental-design solution; it does not invent a result from an experiment we have not run."
              }
            </Prose>
          </details>
        </section>
      </section>
      <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
        <H2>{'15. Key takeaways'}</H2>

        <ul>
          <li>
            {
              'A response is a sequence of conditional choices. Terminal rewards weight the log probability of the whole sampled path.'
            }
          </li>
          <li>
            {
              'A checker defines the optimized property. Correct answers, valid displayed steps, valid syntax and actual termination need separate observations.'
            }
          </li>
          <li>
            {
              'Baseline independence, sampling support, masks, ratios and reductions determine the update. Equal centered rewards remove one gradient contribution, not necessarily every source of change.'
            }
          </li>
          <li>
            {
              'Training reward, reference-token NLL, pass@1, oracle pass@k, majority selection and token cost answer different questions.'
            }
          </li>
          <li>
            {
              'The local neural studies expose negative outcomes honestly. Larger-system claims require evidence about their actual initialization, data, checker, sampler and evaluation.'
            }
          </li>
        </ul>
      </section>
      <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
        <H2>{'16. Further learning'}</H2>

        <ul>
          <li>
            {''}
            <strong>
              {'Stanford CS336, '}
              <a
                href={
                  'https://raw.githubusercontent.com/stanford-cs336/lectures/main/lecture_16.pdf'
                }
              >
                {'reinforcement learning lecture'}
              </a>
              {'.'}
            </strong>
            {
              " Use the policy/return and group-relative diagrams after sections 4–5, then compare its pipeline diagrams with section 11. The current main-branch deck contains later examples as well as the course's original material; check its version when citing it."
            }
          </li>
          <li>
            {''}
            <strong>
              {'Nathan Lambert, '}
              <a href={'https://rlhfbook.com/c/07-reasoning'}>{'RLHF Book reasoning chapter'}</a>
              {'.'}
            </strong>
            {
              ' A book-style route from post-training components to reasoning systems. Read it after the local experiment and distinguish training changes from deployment-time search.'
            }
          </li>
          <li>
            {''}
            <strong>
              {''}
              <a href={'https://arxiv.org/html/2501.12948v2'}>{'DeepSeek-R1 expanded report'}</a>
              {'.'}
            </strong>
            {
              ' Read the method and evaluation appendices with the stage diagram open. Track which checkpoint receives supervised traces, verifier rewards or broader feedback. This is a system report, not a promise that the two-update demonstration reproduces it.'
            }
          </li>
          <li>
            {''}
            <strong>
              {''}
              <a
                href={
                  'https://papers.neurips.cc/paper_files/paper/2025/file/537d5aa768c2d534016a4d06f87bc8fb-Paper-Conference.pdf'
                }
              >
                {'Yue et al., NeurIPS 2025'}
              </a>
              {'.'}
            </strong>
            {
              ' Reconstruct the distinction between sampling efficiency and observed problem coverage. Challenge any inference from finite failure to absolute impossibility.'
            }
          </li>
          <li>
            {''}
            <strong>
              {''}
              <a href={'https://arxiv.org/html/2606.22317v1'}>{'Boundary-Aware Curriculum RL'}</a>
              {' and '}
              <a href={'https://aclanthology.org/2026.acl-long.1994.pdf'}>{'RL-PLUS'}</a>
              {'.'}
            </strong>
            {
              ' Compare where external demonstrations enter the update. The former is a 2026 preprint; the latter is a research alternative rather than the implementation used in this lesson.'
            }
          </li>
        </ul>
      </section>
      <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
        <Old ids={['10-primary-sources']} />
        <H2>{'17. Technical references'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2501.12948v1'}>{'DeepSeek-R1 original version'}</a>
            {' and '}
            <a href={'https://arxiv.org/html/2501.12948v2'}>{'expanded version'}</a>
            {': method, stage and evaluation provenance.'}
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2411.15124v1'}>{'Tülu 3'}</a>
            {', verifiable-reward training sections: a distinct PPO-based implementation.'}
          </li>
          <li>
            {''}
            <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/grpo_trainer.py'}>
              {'TRL 1.14.2 GRPO trainer source'}
            </a>
            {' and '}
            <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/grpo_config.py'}>
              {'configuration'}
            </a>
            {
              ': completion masks, sample standard deviation, token ratios and loss reductions used by the native bridge.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://huggingface.co/EleutherAI/pythia-14m/blob/cf967c0a9a04383db6f7b1108d86b2962634b4ac/README.md'
              }
            >
              {'Pinned Pythia-14m model card'}
            </a>
            {': the actual pretrained checkpoint and its scope.'}
          </li>
          <li>
            {''}
            <a
              href={
                'https://github.com/openai/grade-school-math/tree/3101c7d5072418e28b9008a6636bde82a006892c'
              }
            >
              {'GSM8K source and license'}
            </a>
            {
              ': original question/solution records. The supplied source report binds the exact selected bytes and checker differences.'
            }
          </li>
        </ul>
      </section>
      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <Old ids={['the-post-training-section-what-this-has-all-been-building-toward']} />
        <H2>{'18. Readiness and related topics'}</H2>

        <Prose>
          {
            'You are ready to continue when you can trace a sampled token through its probability, checker result, advantage and gradient; repair an EOS mask; and explain why a higher training reward can coexist with failed transfer. You should also be able to choose a success metric and selector for a stated token budget, and design a changed experiment without selecting its winner on the test set.'
          }
        </Prose>

        <Prose>
          {''}
          <a
            href={
              '/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models'
            }
          >
            {'Process and outcome rewards'}
          </a>
          {' develops feedback granularity. '}
          <a
            href={
              '/learn/path/full-curriculum/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation?module=large-language-models'
            }
          >
            {'Knowledge distillation'}
          </a>
          {' explains transfer from teacher trajectories and distributions. '}
          <a
            href={
              '/learn/path/full-curriculum/typed-decision-models-calibrated-neural-decision-systems?module=large-language-models'
            }
          >
            {'Typed decision models'}
          </a>
          {
            ' asks a different next question: when an application needs a finite decision and trustworthy probabilities, what should the model output and how should those probabilities be checked?'
          }
        </Prose>

        <FileIndex />
      </section>
    </div>
  );
}
export default {
  title: 'RL for Reasoning (DeepSeek-R1-style)',
  slug: 'rl-for-reasoning-deepseek-r1-style',
  readTime: '~70 min read + 100 min practice',
  content: ReasoningLesson,
};
