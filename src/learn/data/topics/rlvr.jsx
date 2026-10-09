import { Prose, H2, H3, CodeBlock } from '../../../../src/learn/components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { useCodeDownload } from '../../../../src/learn/components/content/LessonCodeDownloads.jsx';
import {
  RLVRScroll,
  RLVRTable as NeuralTable,
} from '../../../../src/learn/components/lesson-labs/RLVRFlow.jsx';
import {
  FullTaskAndVerdict,
  FeedbackAndUpdateAxes,
  ExtractionSpanAnatomy,
  VerifierOutcomeMatrix,
  FiniteTestsAndCounterexample,
  ProofDerivationTree,
  ResponseProbabilitySimplex,
  CausalSampleAndGather,
  GroupSamplingTree,
  CenteredAndScaledContributions,
  BaselineEnumeration,
  PolicySnapshotAddresses,
  SignedClipGeometry,
  TokenReductionGeometry,
  ExactFiniteKL,
  SampledK3AndGradientRoutes,
  AnySuccessVersusMixedGroup,
  SupportAndEntropy,
  PromptSelectionAndContrast,
  VerifiedSelectionLineage,
  AcceptanceConfusionMatrix,
  AffineRewardCorrection,
  CorrelatedTestOutcomeGrid,
  SpecificationCounterexampleTrace,
  ReasoningAnswerJointMass,
  AnswerAndReasoningEvaluation,
} from '../../../../src/learn/components/lesson-labs/RLVRCoreFigures.jsx';
import {
  SelectedCorpusContext,
  TinyCausalModelAnatomy,
  GeneratedGroupAndMasks,
  RolloutReuseAndUpdate,
  SharedWarmStartAndArms,
  ActualRewardAndContrastHistory,
  HeldoutResponseInspector,
  PretrainedToolOutputs,
  NativeTrainerContract,
  PassAtKSamplingGeometry,
  PaperProtocolComparison,
  WorkAndMetricLedger,
  ControlledUseDecision,
} from '../../../../src/learn/components/lesson-labs/RLVRStudyFigures.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <RLVRScroll
    className="rlvr-equation"
    label="Mathematical expression; scroll horizontally if needed"
  >
    <SharedMathBlock>{children}</SharedMathBlock>
  </RLVRScroll>
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn/examples/rlvr/' + file}
    filename={file}
    title={file}
    language="python"
  />
);
const Old = ({ ids }) => ids.map((id) => <span key={id} id={id} aria-hidden="true" />);
function SupportingFile({ file }) {
  useCodeDownload({
    filename: file.split('/').at(-1),
    kind: 'asset',
    downloadUrl: '/learn/examples/rlvr/' + file,
    title: file,
  });
  return null;
}
function RLVRLesson() {
  return (
    <div className="lesson-flow rlvr-flow">
      {[
        'backbone-provenance.json',
        'FILES.md',
        'GSM8K-LICENSE.txt',
        'protocol.json',
        'provenance.json',
        'README.md',
        'records.json',
        'requirements.txt',
        'study-protocol.md',
        'rlvr-programs.zip',
        'rlvr-observations.zip',
        'download-manifest.json',
      ].map((file) => (
        <SupportingFile key={file} file={file} />
      ))}
      <Prose opening="summary">
        {
          'A model writes an answer. A checker accepts a particular property of that answer, and training changes how likely the model is to produce it. Follow one complete arithmetic problem through the checker, sampled response probabilities, group comparisons and an actual causal update. Then inspect what happens when the checker, the samples or the evaluation question change.'
        }
      </Prose>

      <Prose>
        {'The useful starting question is precise: '}
        <strong>{'what does a passing response establish?'}</strong>
        {
          ' A matching final number, a passed test suite and a checked formal proof establish different things. We will construct each object, trace the update and compare small scratch programs with their ordinary tools.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'Useful prerequisites are '}
        <a
          href={
            '/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models#1-separate-the-feedback-source-from-the-learning-rule'
          }
        >
          {"RLAIF's feedback and objective distinction"}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models#5-turn-sampled-reward-into-a-gradient'
          }
        >
          {"RLHF's sampled gradient"}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models'
          }
        >
          {'causal language-model targets'}
        </a>
        {
          '. We refresh the needed operations here. Basic probabilities, logarithms, derivatives and Python help; the first pass does not require previous RL research.'
        }
      </Prose>

      <Prose opening="route">
        {
          'For a first pass, follow sections 1–9, then 12–14 and the matching practice in section 16. Keep the '
        }
        <strong>{'sampler settings'}</strong>
        {' in section 8 and '}
        <strong>{'verified selection'}</strong>
        {
          ' in section 9: the actual program uses temperature and support, and its third arm learns from selected responses or skips an empty set. Within those sections, group-availability probabilities, entropy and prompt scheduling are marked deeper and can be revisited after the core route. Sections 10–11 develop verifier noise and reasoning proxies; section 15 develops evaluation estimators, public recipes and work comparisons. These deeper branches remain visible for a second pass. The complete section index lets you return to each question without losing the code and worked examples.'
        }
      </Prose>

      <Old ids={['1-why-it-exists', '1-start-with-the-problem']} />
      <H2>{'1. Decide what a passing response means'}</H2>

      <FullTaskAndVerdict />

      <Prose>
        {
          'Natalia sold clips to 48 friends in April and half as many in May. The complete question asks for the total across both months. Half of 48 is 24, and the total is 48+24=72. GSM8K supplies both the original worked solution and its final '
        }
        <code>{'#### 72'}</code>
        {
          " label; our checker receives that label rather than discovering the truth by reading the model's explanation."
        }
      </Prose>

      <Prose>
        {'A writes '}
        <code>{'48/2=24; 48+24=72. #### 72'}</code>
        {'. B writes '}
        <code>{'48/2=20; 48+20=68. #### 72'}</code>
        {'. C writes '}
        <code>{'#### 24'}</code>
        {' and D writes '}
        <code>{'The answer is probably seventy-two'}</code>
        {
          ". A and B both match the declared final numeric contract. Only A's calculation is correct in this constructed comparison. C has a parseable wrong answer; D lacks the required final marker and numeric object. These are four different response identities, with their full text kept next to the verdict."
        }
      </Prose>

      <Prose>
        {'This separates two questions. '}
        <strong>{'Acceptance'}</strong>
        {" is the checker's decision under its contract. "}
        <strong>{'Task correctness'}</strong>
        {
          ' is whether the response satisfies the intended problem. For the four short calculations, we can supply a separate reasoning annotation ourselves. That annotation does not come from the final-number checker. A correct answer with a flawed explanation is also not, by itself, evidence of an intentional attack; it shows which property was actually checked.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Reinforcement learning with verifiable rewards'}</strong>
        {', abbreviated '}
        <strong>{'RLVR'}</strong>
        {', uses an explicit task check to supply feedback for generated responses. A '}
        <strong>{'reward'}</strong>
        {
          ' is the numeric score used by the learning rule. In our first contract it is 1 for accepted and 0 for rejected. These values are a chosen training scale, not proof that every accepted string has the intended reasoning.'
        }
      </Prose>

      <FeedbackAndUpdateAxes />

      <Prose>
        {
          'Read the two axes independently. One asks where feedback comes from: an answer comparison, tests, a proof checker or a learned judgment. The other asks how learning uses feedback: a sampled policy update, or imitation of selected responses. A '
        }
        <strong>{'policy'}</strong>
        {
          " is the model's conditional distribution over responses. The update changes its parameters. Choosing a checker does not choose that update algorithm."
        }
      </Prose>

      <Prose>
        {'Tülu 3 uses rule rewards with '}
        <strong>{'PPO'}</strong>
        {
          ', Proximal Policy Optimization, whose update also uses a learned value estimate. R1-Zero uses rule rewards with a group-based update called '
        }
        <strong>{'GRPO'}</strong>
        {
          ', Group Relative Policy Optimization. Rejection sampling can instead keep accepted model responses for '
        }
        <strong>{'SFT'}</strong>
        {
          ", supervised fine-tuning, which learns to predict their supplied tokens. We build the group update and selected-response route below; PPO's critic and full advantage estimation remain in the RLHF/PPO treatment. "
        }
        <a href={'https://arxiv.org/html/2411.15124v3'}>{'Tülu 3, §6'}</a>
        {', '}
        <a href={'https://arxiv.org/html/2501.12948v1'}>{'R1, January version §2.2'}</a>
        {'.'}
      </Prose>

      <Prose>
        {
          "DeepSeekMath's earlier GRPO study used learned reward models trained from outcome or process judgments. The group update's name does not make that feedback identical to R1-Zero's final-answer rules. Keeping the axes separate lets us ask what changed in a real recipe instead of treating “RLVR” as one fixed loss. "
        }
        <a href={'https://arxiv.org/html/2402.03300v2'}>{'DeepSeekMath, §4'}</a>
        {'.'}
      </Prose>

      <Old ids={['2-core-intuition', '2-build-the-intuition']} />
      <H2>{'2. Parse an object before comparing it'}</H2>

      <Prose>
        {
          'The first verdict concealed an operation: turning part of a string into a number. Open that operation before giving it a reward.'
        }
      </Prose>

      <ExtractionSpanAnatomy />

      <Prose>
        {'In '}
        <code>{'48+24=72.\\n#### 72'}</code>
        {', the last '}
        <code>{'####'}</code>
        {' marker selects the final suffix '}
        <code>{'72'}</code>
        {
          '. Whitespace surrounding it is removed, then the numeric grammar turns it into an exact rational object. '
        }
        <code>{'72'}</code>
        {', '}
        <code>{'72.0'}</code>
        {' and '}
        <code>{'144/2'}</code>
        {' represent the same number under this contract. '}
        <code>{'72 clips'}</code>
        {', '}
        <code>{'50%'}</code>
        {', '}
        <code>{'1/0'}</code>
        {' and an arbitrary expression such as '}
        <code>{'36*2'}</code>
        {' are outside the declared grammar. A decimal such as '}
        <code>{'0.5'}</code>
        {' is converted exactly through '}
        <code>{'Decimal'}</code>
        {
          ', then into the fraction 1/2; it is not a binary floating-point approximation with an unexplained tolerance.'
        }
      </Prose>

      <Prose>
        {
          'The input grammar accepts a signed decimal or an integer numerator/denominator. The whole suffix after the '
        }
        <strong>{'last'}</strong>
        {' marker must match it. Therefore '}
        <code>{'#### 24\\n#### 72'}</code>
        {' selects 72, while '}
        <code>{'#### 72 extra words'}</code>
        {
          ' is rejected. This last-marker choice is a policy of the extractor, not a universal definition of which number a response intended. The displayed span makes that policy visible.'
        }
      </Prose>

      <Prose>
        {'Extraction and comparison do different jobs. The '}
        <strong>{'extractor'}</strong>
        {' selects a span and constructs an object. The '}
        <strong>{'comparator'}</strong>
        {
          ' asks whether that object equals the supplied gold object. A missing or malformed prediction is rejected when gold is known. A missing or unsupported gold is '
        }
        <strong>{'unknown'}</strong>
        {
          ': we cannot fairly label the prediction incorrect without knowing the target. The training subset used later has valid gold for every record, so its 0/1 groups contain no missing labels.'
        }
      </Prose>

      <Prose>
        {
          'For the older boxed-answer form, the scratch program walks balanced braces after the last '
        }
        <code>{'\\boxed{'}</code>
        {'. It can parse a nested integer fraction such as '}
        <code>{'\\boxed{\\frac{1}{2}}'}</code>
        {'. That small extension does not recognize arbitrary LaTeX: '}
        <code>{'\\boxed{\\frac{1+1}{4}}'}</code>
        {
          ' is deliberately outside it. It also does not change the strict #### contract used for our model study. Different answer interfaces need their own declared extraction rules.'
        }
      </Prose>

      <VerifierOutcomeMatrix />

      <Prose>
        {'Ordinary '}
        <strong>{'Math-Verify'}</strong>
        {
          ' separates mathematical extraction from grading and recognizes more representations than our finite numeric grammar. Its '
        }
        <code>{'parse(text, extraction_config=...)'}</code>
        {' returns candidate objects; its '}
        <code>{'verify(gold, prediction)'}</code>
        {
          " then applies the grader's conventions. Those include representation, numerical tolerance and symbolic handling. A richer parser is useful, but its extracted objects still need to be inspected. The choice of gold versus prediction is meaningful; this API is not a declaration that every representation pair is a symmetric mathematical equivalence relation."
        }
      </Prose>

      <Prose>
        {'The pinned TRL '}
        <code>{'accuracy_reward'}</code>
        {' first parses the gold. If it cannot parse that gold, it returns '}
        <code>{'None'}</code>
        {
          '; otherwise it grades an extracted prediction as 1 or 0. It uses a particular LaTeX extraction configuration that prioritizes boxed forms and requires an answer anchor. That differs from our strict entire #### suffix and from a direct Math-Verify call using both expression and LaTeX extractors. Read the actual extracted values beside each raw row before comparing results. '
        }
        <a
          href={
            'https://github.com/huggingface/math-verify/tree/ba3d3aaff23b3f4cac7a14672b4f6e293d97c98b'
          }
        >
          {'Math-Verify parser and grader'}
        </a>
        {', '}
        <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/rewards/accuracy_rewards.py'}>
          {'TRL v1.14.2 accuracy reward'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          'The complete programs are supplied with the data and exact package versions. Download the '
        }
        <a href={'/learn/examples/rlvr/rlvr-programs.zip'}>{'program archive'}</a>
        {', or use the '}
        <a href={'/learn/examples/rlvr/FILES.md'}>{'file index'}</a>
        {
          ' to collect the individual files. Place them together, create a Python 3.12 environment and install their requirements. The three first scratch mechanism programs need only the standard library or PyTorch; the ordinary parser/trainer routes use the pinned additional packages.'
        }
      </Prose>

      <CodeBlock language={'bash'}>
        {
          'python -m venv .venv\npython -m pip install -r requirements.txt\npython -B verifier_contracts.py --output verifier.json\npython -B math_verify_bridge.py --output math-verify.json'
        }
      </CodeBlock>

      <Prose>
        {
          "Activation depends on your shell; run the installation and programs with that environment's Python. The full "
        }
        <code>{'verifier_contracts.py'}</code>
        {
          ' appears after its code and proof contracts in the next section, so each function has an explained task. The parser comparison supplies complete decimal, fraction, percentage, unit, multiple-boxed, malformed and missing cases. Direct finite calls disable POSIX alarm timeouts; the unmodified TRL reward uses its documented worker-thread no-alarm branch on Windows. This local case set is not an execution sandbox.'
        }
      </Prose>

      <Program file="math_verify_bridge.py" />

      <Old ids={['3-mathematical-foundation', '3-make-the-idea-precise']} />
      <H2>{'3. Check a program or proof under an explicit specification'}</H2>

      <Prose>
        {
          'A final number is one possible accepted object. A program or formal proof changes both that object and what the check can establish.'
        }
      </Prose>

      <FiniteTestsAndCounterexample />

      <Prose>
        {
          'Suppose the required function returns the sum of two supplied integers, x and y. Candidate '
        }
        <code>{'x+y'}</code>
        {' performs the requested operation. Candidate '}
        <code>{'x'}</code>
        {' agrees with it whenever y=0. Tests '}
        <code>{'(2,0)→2'}</code>
        {' and '}
        <code>{'(−1,0)→−1'}</code>
        {' therefore accept both candidates. Add '}
        <code>{'(2,3)→5'}</code>
        {': '}
        <code>{'x+y'}</code>
        {' returns 5, while '}
        <code>{'x'}</code>
        {
          ' returns 2. The stronger test set exposes the missing dependence on y. Passing the earlier finite set established agreement on those inputs; it did not establish agreement for all integers.'
        }
      </Prose>

      <Prose>
        {'The scratch checker uses a deliberately small '}
        <strong>{'abstract syntax tree'}</strong>
        {', or '}
        <strong>{'AST'}</strong>
        {', grammar. The tree for '}
        <code>{'x+y'}</code>
        {
          ' has an addition node with leaves x and y. At x=2,y=3, lookup supplies 2 and 3, then addition produces 5. Integer constants, the names x/y, unary minus and addition/subtraction/multiplication are allowed. Other nodes, such as a function call, are rejected. The interpreter recursively applies those declared operations; it never calls Python '
        }
        <code>{'eval'}</code>
        {' or '}
        <code>{'exec'}</code>
        {
          ' on a candidate. This teaches finite testing without pretending arbitrary code has been sandboxed by a timeout or a subprocess.'
        }
      </Prose>

      <Prose>
        {
          "The general distinction transfers to real code evaluation: a unit-test score measures the supplied tests' contract. More test cases may reveal a counterexample, but the reward only certifies the finite checked set unless an additional argument establishes a broader property. Runtime limits and untrusted-code isolation are separate engineering outcomes; this tiny arithmetic interpreter does not implement an operating-system sandbox."
        }
      </Prose>

      <ProofDerivationTree />

      <Prose>
        {
          'Now change the accepted object to a formal proof of “if P and Q hold, then Q and P hold.” Write this as '
        }
        <InlineMath>{'(P\\land Q)\\to(Q\\land P)'}</InlineMath>
        {'. '}
        <strong>{'Conjunction'}</strong>
        {', written '}
        <InlineMath>{'\\land'}</InlineMath>
        {', requires both parts. '}
        <strong>{'Implication'}</strong>
        {', written '}
        <InlineMath>{'\\to'}</InlineMath>
        {
          ', says that assuming its left side lets us derive its right side. P and Q here are proposition symbols; the checker manipulates their exact formal structure rather than interpreting an English explanation.'
        }
      </Prose>

      <Prose>
        {'The proof introduces an assumption named h with proposition '}
        <InlineMath>{'P\\land Q'}</InlineMath>
        {
          '. Conjunction elimination on the right derives Q; elimination on the left derives P. Conjunction introduction combines these results in the order '
        }
        <InlineMath>{'Q\\land P'}</InlineMath>
        {
          '. Implication introduction then discharges h: the conclusion holds conditional on the premise that was assumed. The drawing keeps the binder and both branches connected to their actual ancestors.'
        }
      </Prose>

      <Prose>
        {'In code, the successful body is '}
        <code>
          {'("and-intro", ("and-right", ("assume", "h")), ("and-left", ("assume", "h")))'}
        </code>
        {
          ". The checker reconstructs that body's proposition; it does not trust a node's claimed output label. Choosing left elimination twice reconstructs "
        }
        <InlineMath>{'P\\land P'}</InlineMath>
        {
          '. That is a legitimate consequence of h, but it is the wrong requested conclusion. Using h outside its implication binder fails assumption-scope checking instead. These failure reasons distinguish a valid proof of another statement from an invalid derivation.'
        }
      </Prose>

      <Prose>
        {
          'This small kernel implements exactly assumption, conjunction introduction/ elimination and implication introduction. It neither proves arbitrary Lean theorems nor validates natural-language reasoning. Even a correct proof kernel checks the supplied formal proposition; whether that proposition captures the intended task remains a separate specification question.'
        }
      </Prose>

      <Program file="verifier_contracts.py" />

      <Prose>
        {'Read '}
        <code>{'numeric_object'}</code>
        {', '}
        <code>{'arithmetic_expression'}</code>
        {' and '}
        <code>{'derive'}</code>
        {' as three separate accepted-object constructors. '}
        <code>{'final_verdict'}</code>
        {', '}
        <code>{'check_tests'}</code>
        {' and '}
        <code>{'proof_verdict'}</code>
        {
          ' then compare their outcomes under declared goals. The test fixtures preserve both accepted-but-insufficient cases and stronger counterexamples. To extend the numeric grammar, add a representation deliberately and test its unit policy; to extend the proof grammar, supply a sound reconstruction rule rather than accepting a claimed final proposition.'
        }
      </Prose>

      <Old ids={['6-visual-walkthrough']} />
      <H2>{'4. Turn accepted responses into an expected-return gradient'}</H2>

      <Prose>
        {
          "We can now score a response. The next operation changes the probability of generating responses from those scores. Begin with a complete finite distribution, then connect it to a language model's token probabilities."
        }
      </Prose>

      <ResponseProbabilitySimplex />

      <Prose>
        {
          "Consider three possible full responses to Natalia's question: A ends in 72, C ends in 24, and D is malformed. Their probabilities are .2, .5 and .3. Their rewards are 1, 0 and 0 under the strict final-number contract. The "
        }
        <strong>{'expected reward'}</strong>
        {
          " is their probability-weighted score, so it is .2. That is the long-run average of this policy's rewards under this finite model; a particular three- response sample need not have exactly .2 acceptance."
        }
      </Prose>

      <Prose>
        {'Let '}
        <InlineMath>{'p_i'}</InlineMath>
        {' be the probability of response i and '}
        <InlineMath>{'r_i'}</InlineMath>
        {' its fixed reward. The objective '}
        <InlineMath>{'J'}</InlineMath>
        {' is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'J=\\sum_i p_i r_i=.2(1)+.5(0)+.3(0)=.2.'}</MathBlock>
      </div>

      <Prose>
        {'A model usually represents probabilities through real-valued '}
        <strong>{'logits'}</strong> <InlineMath>{'z_i'}</InlineMath>
        {', with '}
        <InlineMath>{'p_i=\\exp(z_i)/\\sum_j\\exp(z_j)'}</InlineMath>
        {
          '. Increasing one logit affects every normalized probability. Differentiating this softmax-weighted objective gives'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\frac{\\partial J}{\\partial z_i}=p_i(r_i-J).'}</MathBlock>
      </div>

      <Prose>
        {'The three components are '}
        <InlineMath>{'.2(1-.2)=.16'}</InlineMath>
        {', '}
        <InlineMath>{'.5(0-.2)=-.10'}</InlineMath>
        {' and '}
        <InlineMath>{'.3(0-.2)=-.06'}</InlineMath>
        {
          ". A small ascent step increases A's logit relative to the other two. A's reward is not differentiated: it is a supplied scalar attached to that full response. Changing the distribution changes J, not the supplied truth or the definition of acceptance."
        }
      </Prose>

      <Prose>
        {
          'The corresponding sampled identity uses the derivative of a log probability, often called its '
        }
        <strong>{'score'}</strong>
        {':'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\nabla_\\theta J\n=\\mathbb E_{y\\sim\\pi_\\theta}\\left[r(y)\\nabla_\\theta\\log\\pi_\\theta(y\\mid x)\\right].'
          }
        </MathBlock>
      </div>

      <Prose>
        {'Here x is the prompt, y a complete sampled response and '}
        <InlineMath>{'\\theta'}</InlineMath>
        {
          ' the trainable parameters. The identity follows by differentiating the probability weights: '
        }
        <InlineMath>{'\\nabla\\pi=\\pi\\nabla\\log\\pi'}</InlineMath>
        {
          '. It applies with the stated sampling distribution, fixed reward and suitable differentiability/support conditions. A finite sampled estimate is noisy even when its expected gradient matches that objective. '
        }
        <a href={'https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html'}>
          {"Spinning Up's policy-gradient derivation"}
        </a>
        {', '}
        <a href={'https://rlhfbook.com/c/06-policy-gradients'}>{'Lambert, policy gradients'}</a>
        {'.'}
      </Prose>

      <CausalSampleAndGather />

      <Prose>
        {
          'A causal model does not keep one independent logit for every possible sentence. It writes y one token at a time. At response position t, it predicts token '
        }
        <InlineMath>{'y_t'}</InlineMath>
        {
          ' from the prompt and previous response tokens. The full response probability is a product; its log probability is a sum:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\pi_\\theta(y\\mid x)=\\prod_{t=1}^{T}\\pi_\\theta(y_t\\mid x,y_{<t}),\n\\qquad\n\\log\\pi_\\theta(y\\mid x)=\\sum_{t=1}^{T}\\log\\pi_\\theta(y_t\\mid x,y_{<t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The selected logit at sequence position t−1 predicts the target at position t. That one-position shift is essential at the first response token: its predictor is the last prompt position. A sampled end-of-sequence token, '
        }
        <strong>{'EOS'}</strong>
        {
          ', is itself a genuine predicted response target. Padding added for batching is not. An attention mask describes visible positions; a response mask describes which predicted targets contribute to this loss. Prompt positions remain useful context even when they receive no direct response-target loss.'
        }
      </Prose>

      <Prose>
        {
          'A detached terminal reward multiplies the score sum over the included response tokens. The checker does not send a differentiable path through its regex or test verdict. Autograd follows the current token log probabilities back to shared network parameters. This response-level feedback does not identify which reasoning sentence was responsible, and shared parameters mean it does not guarantee that every individual token or related prompt becomes more likely. The learned step-reward distinction belongs to '
        }
        <a
          href={
            '/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models'
          }
        >
          {"PRM's explicit step judgments"}
        </a>
        {'.'}
      </Prose>

      <H2>{'5. Compare samples within a prompt'}</H2>

      <Prose>
        {
          'The raw sampled reward can be a noisy update coefficient. A group of responses to the same prompt supplies a concrete baseline for comparison.'
        }
      </Prose>

      <GroupSamplingTree />

      <Prose>
        {
          "Generate four responses to the same prompt. In the displayed mixed group, their rewards are 1,0,1,0. The group's average reward is .5. The two accepted responses are .5 above that average; the other two are .5 below it. The "
        }
        <strong>{'advantage'}</strong>
        {
          " here means the coefficient measuring a response's reward relative to a stated baseline. It is not a truth label or a guarantee of future progress."
        }
      </Prose>

      <Prose>
        {
          "Groups have prompt identity as well as row order. Combining four samples from four unrelated prompts into one baseline answers a different question. The later program keeps each prompt's four rows together when it reshapes rewards into groups. A batch-level scaling option is possible, but it must be labelled rather than silently substituted for a per-prompt comparison."
        }
      </Prose>

      <CenteredAndScaledContributions />

      <Prose>
        {
          "Subtracting .5 yields centered coefficients .5,−.5,.5,−.5. Some recipes also divide by a group standard deviation, making that group's contrast size more similar to other groups. Under a "
        }
        <strong>{'population'}</strong>
        {
          ' standard deviation, divide the squared deviations by G=4. Their mean square is .25, so the standard deviation is .5 and the scaled coefficients are 1,−1,1,−1. This hand calculation uses no added numerical epsilon.'
        }
      </Prose>

      <Prose>
        {'For rewards '}
        <InlineMath>{'r_1,\\ldots,r_G'}</InlineMath>
        {', define'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\bar r=\\frac1G\\sum_i r_i,\\qquad\n\\sigma_{\\rm pop}=\\sqrt{\\frac1G\\sum_i(r_i-\\bar r)^2},\\qquad\nA_i=\\frac{r_i-\\bar r}{\\sigma_{\\rm pop}+\\eta}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The small positive number '}
        <InlineMath>{'\\eta'}</InlineMath>
        {' avoids division by zero in the implementation. Our custom causal study uses '}
        <InlineMath>{'\\eta=.0001'}</InlineMath>
        {'. Its mixed-group values are therefore '}
        <InlineMath>{'\\pm .5/.5001'}</InlineMath>
        {', approximately '}
        <InlineMath>{'\\pm .99980004'}</InlineMath>
        {
          ', rather than exactly ±1. For an all-fail or all-pass group, every centered coefficient is zero. With the declared epsilon, the reward part of the update is zero. Another loss term, such as the KL penalty introduced below, can still move the policy.'
        }
      </Prose>

      <Prose>
        {'A '}
        <strong>{'sample'}</strong>
        {
          ' standard deviation instead divides the squared deviations by G−1. For this group, it is '
        }
        <InlineMath>{'\\sqrt{1/3}\\approx .57735027'}</InlineMath>
        {'. Without epsilon the coefficients are '}
        <InlineMath>{'\\pm\\sqrt3/2\\approx\\pm .8660254'}</InlineMath>
        {
          '. Pinned TRL uses this sample convention and then adds .0001. A library-versus-scratch comparison must preserve that convention instead of treating the two outputs as a numerical bug. '
        }
        <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/utils.py'}>
          {'TRL v1.14.2 nanstd'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          'Missing reward is also separate from zero reward. A declared nan-aware group baseline uses only available rows and assigns a missing row zero reward advantage. With just one available row, a sample standard deviation is undefined; the native route ultimately replaces that undefined advantage with zero. The scratch diagnostic displays its unavailable scale explicitly. None of these choices establishes that the missing response was incorrect.'
        }
      </Prose>

      <BaselineEnumeration />

      <Prose>
        {
          'Why can subtracting a baseline help? For a baseline b that does not depend on the sampled action, its expected score contribution is zero: '
        }
        <InlineMath>{'b\\sum_y\\pi(y)\\nabla\\log\\pi(y)=b\\nabla\\sum_y\\pi(y)=0'}</InlineMath>
        {
          ". Subtracting that b preserves the expected policy gradient. But the same group's average includes the very response whose score it multiplies; it is not action-independent in that argument."
        }
      </Prose>

      <Prose>
        {
          'Take IID binary responses with success probability p and a group of size G. Enumerate every outcome group, attach its exact probability, and average its actual score estimator. Same-group centering has expectation '
        }
        <InlineMath>{'(1-1/G)p(1-p)'}</InlineMath>
        {' with respect to the Bernoulli logit. For p=.25,G=4, the raw expected gradient is '}
        <InlineMath>{'.25(.75)=.1875'}</InlineMath>
        {' and the same-group expectation is '}
        <InlineMath>{'.140625'}</InlineMath>
        {'. A '}
        <strong>{'leave-one-out'}</strong>
        {
          ' baseline averages only the other G−1 responses. Its coefficients are G/(G−1) times the same-group centered coefficients, restoring the .1875 expectation under these IID assumptions.'
        }
      </Prose>

      <Prose>
        {
          'This multiplicative correction does not prove identical parameter updates under AdamW, clipping or changing optimizer history. Standard deviation scaling adds another nonlinear transformation and is a different estimator again. To assess variance, enumerate the variance of the actual score estimator, not merely the variance of the observed rewards. The displayed 16 rows make both expectation and variance auditable. '
        }
        <a href={'https://rlhfbook.com/c/06-policy-gradients'}>{'Lambert, group baselines'}</a>
        {', '}
        <a href={'https://arxiv.org/html/2402.03300v2'}>{'DeepSeekMath, group advantages'}</a>
        {'.'}
      </Prose>

      <H2>{'6. Reuse a sampled group carefully'}</H2>

      <Prose>
        {
          'Once a group has been scored, it is tempting to reuse it for several updates. The policy that generated it and the policy being updated are then different objects. Keep their probability addresses separate before defining a ratio.'
        }
      </Prose>

      <PolicySnapshotAddresses />

      <Prose>
        {'The '}
        <strong>{'old policy'}</strong> <InlineMath>{'\\pi_{\\rm old}'}</InlineMath>
        {
          ' is the rollout snapshot that generated the response. Its sampled-token log probabilities are stored and detached. The '
        }
        <strong>{'current policy'}</strong> <InlineMath>{'\\pi_\\theta'}</InlineMath>
        {' is rescored at the same token addresses and can change during updates. A '}
        <strong>{'reference policy'}</strong> <InlineMath>{'\\pi_{\\rm ref}'}</InlineMath>
        {
          ' is a separately declared regularizing anchor, introduced in the next section. The old policy is not automatically that reference. In the custom study, reference stays at the shared warm checkpoint while old refreshes at each new rollout.'
        }
      </Prose>

      <Prose>{'At token t, compare current and old probabilities through'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\rho_{i,t}\n=\\frac{\\pi_\\theta(y_{i,t}\\mid x,y_{i,<t})}\n       {\\pi_{\\rm old}(y_{i,t}\\mid x,y_{i,<t})}\n=\\exp(\\ell_{i,t}-\\ell^{\\rm old}_{i,t}).'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The symbol '}
        <InlineMath>{'\\ell'}</InlineMath>
        {
          ' denotes the log probability at that actual sampled-token address. When current equals old, the ratio is 1. After an update, it may differ. This per-token ratio is part of the chosen surrogate; it is not the full product of ratios needed to importance-correct an entire different trajectory distribution. Stable sampling, temperature and support choices must match the log probabilities used for this comparison.'
        }
      </Prose>

      <SignedClipGeometry />

      <Prose>
        {''}
        <strong>{'Clipping'}</strong>
        {
          " changes the incentive after a token's ratio moves far enough in the advantage's preferred direction. With epsilon .2, the ratio band is [.8,1.2]. For positive advantage A=1, increasing the ratio above 1.2 no longer increases the clipped surrogate. For negative advantage A=−1, lowering the ratio below .8 no longer improves it. These are different sides of the band because the desired change has a different sign."
        }
      </Prose>

      <Prose>{'Define a per-token term'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {'s(\\rho,A)\n=\\min\\!\\left(\\rho A,\\;\\operatorname{clip}(\\rho,.8,1.2)A\\right).'}
        </MathBlock>
      </div>

      <Prose>
        {
          "For ratios (1.4,.6,.9,1.1) and advantages (1,−1,1,−1), the terms are (1.2,−.8,.9,−1.1). Their mean is .05. The mean surrogate's ratio derivatives are (0,0,.25,−.25); the training loss is its negative, so its derivative signs reverse. At a kink, an autograd convention determines a selected derivative; we do not compare a finite difference there as though the curve were smooth."
        }
      </Prose>

      <Prose>
        {
          'Notice the other directions: a positive-advantage ratio below .8 still has an incentive to rise, and a negative-advantage ratio above 1.2 still has an incentive to fall. Clipping does not forbid those ratio values. Nor does a plateau freeze all shared network parameters: other tokens can move them. It limits this surrogate incentive, not every change in the policy. '
        }
        <a href={'https://rlhfbook.com/c/06-policy-gradients'}>{'Lambert, PPO cases'}</a>
        {'.'}
      </Prose>

      <TokenReductionGeometry />

      <Prose>
        {
          'Finally decide how token contributions become one scalar. If two responses have lengths 2 and 6 and each of their token contributions is respectively 1 and 3, their response means are 1 and 3. Giving each response equal weight produces '
        }
        <InlineMath>{'(1+3)/2=2'}</InlineMath>
        {'. Pooling all eight tokens instead produces '}
        <InlineMath>{'(2+18)/8=2.5'}</InlineMath>
        {'. A fixed maximum of six positions per response produces '}
        <InlineMath>{'(2+18)/(2\\cdot6)=5/3'}</InlineMath>
        {
          '. The numerator contains the same included terms, but the weights and denominator answer different questions.'
        }
      </Prose>

      <Prose>
        {
          'Our declared GRPO route uses the mean of per-response token means. The DAPO token-mean reduction gives each included token equal weight, so the longer response gets more total weight. Dr.GRPO uses a fixed maximum-length denominator in its named variant. Neither a name nor a library default substitutes for the actual formula. The next DAPO lesson develops the pooled-token choice and its other mechanisms; here it supplies a concrete reduction contrast.'
        }
      </Prose>

      <Program file="group_gradients.py" />

      <Prose>
        {''}
        <code>{'baseline_enumeration'}</code>
        {' supplies complete probability-weighted outcome groups. '}
        <code>{'clipped_terms'}</code>
        {' opens the two signed branches, and '}
        <code>{'kl_routes'}</code>
        {
          ' implements the different derivative routes in the next section. Read the detached tensors as part of the mathematical contract, not an optimization detail. The finite curriculum simulator later in that program is a separate two-task diagnostic, not a fitted language-model result.'
        }
      </Prose>

      <H2>{'7. State which KL quantity is being computed'}</H2>

      <Prose>
        {
          'A reward update can change the policy away from its original behavior. A reference penalty adds another objective, so it needs its own direction, sampling distribution and derivative route.'
        }
      </Prose>

      <ExactFiniteKL />

      <Prose>
        {''}
        <strong>{'Kullback–Leibler divergence'}</strong>
        {', abbreviated '}
        <strong>{'KL'}</strong>
        {
          ', measures a directed difference between probability distributions. For current policy probabilities p and reference probabilities q, the direction used here is policy to reference:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'D_{\\rm KL}(p\\|q)=\\sum_a p_a\\log\\frac{p_a}{q_a}.'}</MathBlock>
      </div>

      <Prose>
        {'For p=(.8,.2),q=(.5,.5), the terms are '}
        <InlineMath>{'.8\\log1.6'}</InlineMath>
        {' and '}
        <InlineMath>{'.2\\log.4'}</InlineMath>
        {
          '. The second term is negative; the sum is approximately .192744757 nats and is nonnegative. Individual terms need not be. Identical distributions give zero. If p assigns positive mass to an action whose q mass is zero, this KL is infinite; a zero-p-mass action contributes zero under the usual limiting convention. Changing the direction changes the quantity, so we will not call reference-to- policy KL the same penalty.'
        }
      </Prose>

      <Prose>
        {'With '}
        <InlineMath>{'p_1=\\operatorname{sigmoid}(\\theta)'}</InlineMath>
        {' and '}
        <InlineMath>{'p_2=1-p_1'}</InlineMath>
        {', exact differentiation includes both the probability weights and their logarithms. At '}
        <InlineMath>{'p_1=.8'}</InlineMath>
        {', it gives '}
        <InlineMath>{'p_1(1-p_1)\\log4=.16\\log4\\approx .221807098'}</InlineMath>
        {' with respect to theta. This is the derivative of the entire finite expectation.'}
      </Prose>

      <SampledK3AndGradientRoutes />

      <Prose>
        {
          'Large vocabulary implementations often score only sampled token addresses. For a fixed address, let '
        }
        <InlineMath>{'u=q_a/p_a'}</InlineMath>
        {'. One nonnegative sampled value is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'k_3(u)=u-\\log u-1.'}</MathBlock>
      </div>

      <Prose>
        {'Under samples from p, and with the needed support so '}
        <InlineMath>{'\\sum_a p_a(q_a/p_a)=1'}</InlineMath>
        {', its expectation equals '}
        <InlineMath>{'D_{\\rm KL}(p\\|q)'}</InlineMath>
        {
          '. For the two actions above, its values are approximately .095003629 and .583709268; their p-weighted mean is the same .192744757. A sampled value identity has not yet specified the gradient estimator.'
        }
      </Prose>

      <Prose>
        {
          'If the sampled addresses and sampling weights are detached while autograd differentiates k3 at those addresses, the expected partial derivative here is .3. It is '
        }
        <strong>{'different'}</strong>
        {
          ' from the exact expectation derivative .221807098. The missing derivative path runs through the sampling weights. Drawing both graphs makes the distinction more concrete than giving both quantities one name.'
        }
      </Prose>

      <Prose>
        {
          "An optional differentiable current/old probability ratio multiplying k3 can restore that weight derivative in this matched finite example. At old=current its value multiplier is 1, so the forward values can match while the derivatives differ. That is the branch controlled by pinned TRL's "
        }
        <code>{'use_bias_correction_kl'}</code>
        {'. The native example explicitly sets it to '}
        <code>{'False'}</code>
        {
          ', matching the plain detached-sample route taught for the custom study. We retain the distinct ratio-weighted calculation rather than describing two branches as automatically equivalent. '
        }
        <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/grpo_trainer.py'}>
          {'TRL v1.14.2 loss'}
        </a>
        {', '}
        <a href={'https://arxiv.org/html/2402.03300v2'}>{'DeepSeekMath, Appendix A'}</a>
        {'.'}
      </Prose>

      <Prose>
        {
          'The declared causal GRPO loss combines a negative clipped reward surrogate with beta times the sampled k3 penalty, averages included token losses within each response, then averages responses. Beta is the chosen trade-off weight. In the small study it is .02; it is not a universal safe setting or a guaranteed policy distance. The reference stays fixed there. Real recipes can refresh a reference, which changes the regularizing target and must be named separately from refreshing the rollout snapshot.'
        }
      </Prose>

      <Prose>
        {
          'There is another boundary when a batch is reused. Its addresses were sampled from the rollout policy, not necessarily the current policy after an update. An unweighted average of k3 over those addresses is then an old-policy sample average. The matching expectation identity above requires the stated current sampling distribution and support, or an appropriate importance-weighted expectation. Naming a term "KL" does not make every reused-batch average an exact current-policy divergence.'
        }
      </Prose>

      <H2>{'8. Diagnose whether sampling finds a useful contrast'}</H2>

      <Prose>
        {
          'The group calculation needs more than one response. It needs responses with different rewards if the only learning signal is their centred reward. Before changing a loss, inspect what the sampler makes available to that loss.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: group-availability probabilities.'}</strong>
        {
          ' This branch asks how likely a sampler is to provide either a success or a useful reward contrast.'
        }
      </Prose>

      <AnySuccessVersusMixedGroup />

      <Prose>
        {
          'Suppose each response independently passes a binary verifier with probability p, and draw a group of G responses. The probability of finding '
        }
        <strong>{'at least one success'}</strong>
        {' excludes only the all-failure group. The probability of a '}
        <strong>{'mixed group'}</strong>
        {' excludes both all-failure and all-success groups:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'P(\\text{any pass})=1-(1-p)^G,\n\\qquad\nP(\\text{mixed})=1-(1-p)^G-p^G.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'At p=.25 and G=4, these are .68359375 and .6796875. All-success groups are rare there, so the two probabilities look similar. At p=.9 and G=4, finding at least one success has probability .9999, while a mixed group has probability .3438. Most groups pass uniformly. A large answer-success rate can coexist with little centred reward contrast.'
        }
      </Prose>

      <Prose>
        {
          'These formulas assume independent responses with the same success probability. Real responses can share modes, memorized paths or sampling correlations. Repeated draws from one policy do not establish that assumption. The event sets remain meaningful; their numerical probabilities need actual dependence information if the assumption fails. Nor is a mixed group proof of a good gradient: the verifier may distinguish the wrong property, or both kinds of response may contain flawed reasoning.'
        }
      </Prose>

      <Prose>
        {
          'For G=1, the mixed probability is zero. For p=0 or p=1, it is zero for every finite G. Increasing G can improve the chance of seeing a contrast at interior p, but it consumes more generated tokens. The DAPO lesson develops a particular dynamic group-selection rule; the diagnostic here explains what such a rule is trying to find without prescribing it universally.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'First-pass sampler settings.'}</strong>
        {
          ' The actual program needs these definitions before its temperature and truncation choices can be interpreted.'
        }
      </Prose>

      <SupportAndEntropy />

      <Prose>
        {'To find a different response, the sampler must be capable of drawing it. '}
        <strong>{'Support'}</strong>
        {
          ' is the set of responses assigned positive probability. Temperature rescales logits before the softmax: for logits z and positive temperature T, the probability of action a is proportional to exp(z_a/T). A larger temperature flattens this distribution; a smaller one concentrates it. It changes the sampling policy whose log probabilities and ratios must be interpreted.'
        }
      </Prose>

      <Prose>
        {
          "A top-k sampler keeps only k candidate token logits and sets the others' sampling probability to zero. That can remove an action leading to a correct solution from support. If it is absent, more samples from the same truncated distribution cannot recover it. Top-p also changes support according to a cumulative probability threshold. Our controlled programs use temperature 1, top-p 1 and no top-k truncation so this support modification is absent."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: entropy and correctness.'}</strong>
        {' A spread-out distribution can still put every response on the wrong answer.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'Entropy'}</strong>
        {' measures how spread out the probabilities are:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'H(p)=-\\sum_a p_a\\log p_a.'}</MathBlock>
      </div>

      <Prose>
        {'For two equally likely responses, '}
        <InlineMath>{'H=\\log 2'}</InlineMath>
        {
          ' nats. If one response has probability 1, H=0. These values describe uncertainty in the response distribution; they do not identify which response is correct. A policy spread across four wrong answers can have more entropy than one concentrated on a correct answer. Likewise, token entropy is not automatically diversity of entire reasoning paths. Read the actual response identities and reward contrasts alongside the distribution, then decide whether more exploration addresses the failure.'
        }
      </Prose>

      <H2>{'9. Change the prompt pool or reuse verified responses'}</H2>

      <Prose>
        {
          "Sampling can fail because a task is too hard, too easy, or outside the policy's current support. Changing which prompts receive computation is a different intervention from changing how their responses are scored."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: prompt scheduling.'}</strong>
        {
          ' This finite comparison studies which tasks receive sampling effort. The first-pass verified-selection route follows it.'
        }
      </Prose>

      <PromptSelectionAndContrast />

      <Prose>
        {
          "In the finite simulator, two tasks share a parameter. A task's success probability is determined by its own declared logit function of that parameter. Their predictions therefore need not improve independently: one parameter change affects both. The drawing keeps those two probabilities and the selected task counts visible instead of presenting a smooth curve as a neural result."
        }
      </Prose>

      <Prose>
        {
          "Three prompt-selection rules answer different questions. Uniform selection spends the same expected share on each task. A fixed easy-first schedule begins with the easier task and later changes the share according to a declared schedule. A mixed-rate rule allocates more share where 1−(1−p)^G−p^G is larger, trying to find reward contrast. Its weights come from the simulator's known probabilities; a real system must estimate its task difficulty and may estimate it poorly."
        }
      </Prose>

      <Prose>
        {
          'Change the starting parameter or task difficulty and compare the selected counts, available contrast and final probabilities. A task near p=.5 can have more group contrast than one near p=0 or p=1. That does not make it the most valuable task for every curriculum: it might be irrelevant to the deployment distribution, or transfer poorly to the harder task. The simulator illustrates these competing effects; it is not a fitted GSM8K study or evidence of universal curriculum superiority. The earlier Curriculum Learning lesson supplies the broader data-mixing question, including which target distribution the sampling rule should serve.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'First-pass verified selection.'}</strong>
        {
          ' This is the third arm of the later study: keep the accepted sampled responses and record a skip when none are available.'
        }
      </Prose>

      <VerifiedSelectionLineage />

      <Prose>
        {'Another route keeps accepted responses and trains on them by likelihood. This is '}
        <strong>{'verified-sample supervised fine-tuning'}</strong>
        {
          ", often called rejection-sampling fine-tuning when sampling and rejection are part of the recipe. Every retained row must retain the generating checkpoint, prompt, response and verifier contract. Otherwise it is difficult to distinguish a new policy's data from replayed old data, or to diagnose why an incorrect example was kept."
        }
      </Prose>

      <Prose>
        {
          'If two of four sampled responses pass, this route uses those two as response targets. It does not apply the negative centred coefficient of the two rejected responses. Its response-only loss is the negative log likelihood of retained target tokens; prompt and padding positions are excluded. Policy-gradient learning and supervised learning thus use different information from the same sampled group. One directly compares relative returns; the other increases the likelihood of selected examples.'
        }
      </Prose>

      <Prose>
        {
          "If no response passes, there is no accepted supervised target. Our program records a skipped update. It does not silently substitute a rejected answer, sample repeatedly until something passes, or count a nonexistent optimizer step. Conversely, a wrong response accepted by a faulty verifier becomes an ordinary supervised target. Selection preserves the verifier's errors as well as its useful distinctions."
        }
      </Prose>

      <Prose>
        {
          'The small study later compares this route with two GRPO coefficient choices from identical warm starts. It uses fewer actual updates when there are few accepted examples. That is an explicit compute difference, not a matched-budget causal comparison. Keep both accepted-row counts and optimizer counts visible before reading its held-out outcomes.'
        }
      </Prose>

      <Old ids={['9-failure-modes-and-gotchas']} />
      <H2>{"10. Inspect the verifier's errors and correlations"}</H2>

      <Prose>
        {
          'Selection and policy gradients both depend on what the verifier accepts. A binary output is convenient, but it can hide several different error mechanisms. Begin with known truth labels in a constructed example so the denominators are visible; a verifier cannot manufacture its own external ground truth.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: noisy acceptance.'}</strong>
        {
          ' The core update is already defined; now we ask what changes when acceptance and intended correctness disagree.'
        }
      </Prose>

      <AcceptanceConfusionMatrix />

      <Prose>
        {
          'Let 20% of responses truly satisfy the intended task. Suppose the verifier rejects 20% of those true successes, its '
        }
        <strong>{'false-negative rate'}</strong>
        {', and accepts 10% of true failures, its '}
        <strong>{'false-positive rate'}</strong>
        {
          '. Out of 100 hypothetical responses, there are 20 true successes and 80 true failures. The verifier accepts 16 of the successes and 8 of the failures, so 24 are accepted in total.'
        }
      </Prose>

      <Prose>
        {'The '}
        <strong>{'precision of acceptance'}</strong>
        {' is 16/24=2/3: among accepted responses, two thirds are truly successful. It is not '}
        <InlineMath>{'1-.1=.9'}</InlineMath>
        {
          '. The false-positive rate conditions on the 80 truly failed responses; precision conditions on the 24 accepted responses. If the true-success prevalence falls while the error rates stay fixed, accepted false positives can form a larger fraction of the selected data.'
        }
      </Prose>

      <Prose>
        {
          'Write true success probability p, false-positive rate f and false-negative rate n. Under this class-conditional error model,'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'P(\\widetilde r=1)=p(1-n)+(1-p)f.'}</MathBlock>
      </div>

      <Prose>
        {
          'The tilde marks the observed noisy reward. At p=.2, f=.1 and n=.2, its acceptance probability is .24. Changing specificity, changing sensitivity and changing the response population are different interventions. These rates are assumed known for the construction; real verifier errors can depend on response content, task category or model behavior in ways this two-rate model omits.'
        }
      </Prose>

      <AffineRewardCorrection />

      <Prose>
        {'If f and n were known constants and 1−f−n were nonzero, a '}
        <strong>{'backward reward correction'}</strong>
        {' could use'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'r_{\\rm corrected}=\\frac{\\widetilde r-f}{1-f-n}.'}</MathBlock>
      </div>

      <Prose>
        {
          'Condition on the true reward. A true failure is accepted with probability f; its corrected expected reward is 0. A true success is accepted with probability 1−n; its corrected expected reward is 1. The correction restores these two conditional expectations under the stated error model. At f=.1 and n=.2, an observed 0 becomes −1/7, while an observed 1 becomes 9/7. Corrected individual rewards can lie outside [0,1] and have greater variance. Unbiased expectation is a property of repeated noisy observations under this model, not a proof that each corrected response has the right truth label.'
        }
      </Prose>

      <Prose>
        {
          'For a group with observed rewards (1,0,1,0), the correction is a positive affine transformation. Centring removes the additive constant. Dividing by a standard deviation removes the positive scale '
        }
        <strong>{'exactly when the additive epsilon is zero'}</strong>
        {
          ', or when epsilon scales with the rewards. The resulting centred normalized coefficients are then the same. This identity does not justify expecting a different normalized group direction merely from applying that affine correction.'
        }
      </Prose>

      <Prose>
        {
          'With the fixed epsilon .0001 used in our population-standard-deviation example, the positive raw coefficient is .5/(.5+.0001)=.999800039992. After correction, the centred positive value and standard deviation are both 5/7, giving (5/7)/(5/7+.0001)=.999860019597. Signs and direction agree, but the magnitudes are not exactly equal. In unnormalized expected-return gradients, known class-conditional noise instead introduces a scale 1−f−n before correction. Keep the estimator and normalization route explicit.'
        }
      </Prose>

      <Prose>
        {
          'Unknown rates, response-dependent errors and a nonpositive 1−f−n require a different diagnosis. Guessing f and n is not an oracle correction. Nor can a constant noise model repair a specification that rewards the wrong property.'
        }
      </Prose>

      <CorrelatedTestOutcomeGrid />

      <Prose>
        {
          'Now give four program responses three tests each. The clean pass rows are (1,1,1), (1,0,1), (0,0,1) and (0,0,0). Their mean test rewards are 1, 2/3, 1/3 and 0. An independent flipped cell changes one test result. A flipped row changes all tests for one response. A flipped column corrupts one test for every response. A whole-group complement replaces every pass with a failure and every failure with a pass. These patterns can have very different realized effects despite similar marginal error rates.'
        }
      </Prose>

      <Prose>
        {
          "For a whole-group complement with no unflipped additional reward component, each row reward becomes 1−r. The centred reward becomes the negative of its former value and its standard deviation stays the same. Its normalized coefficient therefore changes sign. A content-dependent correlated verifier failure can reverse a group's local reward gradient; treating its cells as independent noise would conceal that event. Once clipping or optimizer history is involved, this coefficient identity does not imply a simply negated entire parameter update. A separate format bonus also breaks the pure complement construction unless it is complemented in the same way."
        }
      </Prose>

      <SpecificationCounterexampleTrace />

      <Prose>
        {
          'A specification gap is different from a random flipped label. A final-answer verifier can accept a correct number supported by an invalid argument. Unit tests can accept a program that fails on an untested boundary. A format checker can accept an empty pattern that satisfies its syntax without solving the task. The reward is high because the checked property differs from the intended one.'
        }
      </Prose>

      <Prose>
        {
          'Inspect the first point where a stronger contract changes the verdict. If the task is "produce the correct final number," flawed prose is outside that particular answer contract. If the task also requires a valid derivation, it reveals a missing property. Calling every such example malicious reward hacking assumes an intent that the trace does not establish. Diagnose the concrete property and its counterexample first, then decide whether to strengthen tests, add proof checks, inspect reasoning or change the training objective.'
        }
      </Prose>

      <Program file="reward_noise.py" />

      <Prose>
        {
          'The complete program keeps the truth labels and corruption mechanism visible, computes acceptance precision under the two-rate construction, and compares the raw/corrected and correlated group coefficients. These are finite analytic tests. They are not an estimate of GSM8K verifier error rates or a claimed universal noise-tolerance threshold. Alter the input rates or flip pattern and explain the changed denominator and coefficient before using the output.'
        }
      </Prose>

      <H2>{'11. Relate answer success to reasoning cautiously'}</H2>

      <Prose>
        {
          'A final-answer reward often serves as a proxy for reasoning quality. That can be useful, but it needs an explicit relationship between the two properties. Otherwise successful training on the proxy is silently described as successful training on the intended process.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: reasoning proxies.'}</strong>
        {
          ' This branch separates correct final answers from correct reasoning under a declared relationship between the two.'
        }
      </Prose>

      <ReasoningAnswerJointMass />

      <Prose>
        {
          'In a declared finite population, 25% of responses have correct reasoning. Among those responses, 80% have a correct final answer. Among responses with incorrect reasoning, 20% have a correct final answer. The four joint masses are .20 for correct reasoning and answer, .05 for correct reasoning with a wrong answer, .15 for incorrect reasoning with a correct answer, and .60 for neither. They sum to 1. The answer-success probability is .20+.15=.35.'
        }
      </Prose>

      <Prose>
        {
          'Let c denote correct reasoning, a a correct answer, p_c=P(c), alpha=P(a|c) and b=P(a|not c). Then the answer-success probability is'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'p_a=p_c\\alpha+(1-p_c)b.'}</MathBlock>
      </div>

      <Prose>
        {
          'For population-standard-deviation normalization with epsilon 0, the binary answer reward has standard deviation sqrt(p_a(1−p_a)). Its conditional expected coefficients are'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'E[A\\mid c]=\\frac{\\alpha-p_a}{\\sqrt{p_a(1-p_a)}},\n\\qquad\nE[A\\mid \\neg c]=\\frac{b-p_a}{\\sqrt{p_a(1-p_a)}}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'Here the standard deviation is sqrt(.2275), giving about .943456 for correct reasoning and −.314485 for incorrect reasoning. These are expectations of the declared population-normalized coefficient. Finite groups, an estimated standard deviation and epsilon change the actual coefficients; no real response is assigned this expectation because its reasoning class is known to the model.'
        }
      </Prose>

      <Prose>
        {
          "The explanatory direction depends on alpha exceeding b. If wrong reasoning reaches the right answer more often than correct reasoning in the constructed task, reversing those probabilities reverses which reasoning class gets a larger expected proxy coefficient. This is why the relationship between proxy and intended reasoning matters. It is not a proof that answer-only RL always learns reasoning, nor a measurement of a real policy's hidden reasoning quality."
        }
      </Prose>

      <AnswerAndReasoningEvaluation />

      <Prose>
        {
          'Evaluation should therefore count both properties when both matter. In the eight-response illustration, two answers pass and one of those two also has independently verified correct reasoning. The answer fraction is 2/8=.25. The joint correct-answer-and-reasoning fraction is 1/8=.125. The reasoning fraction '
        }
        <strong>{'among answer-passing responses'}</strong>
        {' is 1/2=.5. Those numbers have different denominators and answer different questions.'}
      </Prose>

      <Prose>
        {
          "If no answer passes, the last conditional fraction has denominator 0 and is unknown; displaying 0 would assert a measured rate where there is no conditional sample. Keep an independent reasoning annotation or a task-specific proof contract alongside each response. A learned judge's repeated votes can be useful evidence of its assessments, but the votes are not mathematical ground truth and need not be independent. Final-answer tests and reasoning checks should remain separate fields so disagreement can be investigated."
        }
      </Prose>

      <Prose>
        {
          'Our small math study checks the extracted numeric answer, not the validity of every generated derivation. Its answer-success measurements later must be read with precisely that scope. The next section builds the complete causal program so the verifier, response masks, sampled histories and measured limitations can be inspected together.'
        }
      </Prose>

      <Old ids={['4-from-scratch-implementation']} />
      <H2>{'12. Build a complete causal RLVR program on actual records'}</H2>

      <Prose>
        {
          'The finite examples let us isolate one operation. A complete language-model program must now join those operations without replacing generated answers by fabricated rewards. It must receive a real prompt, generate tokens, extract an answer, compare with an external label and differentiate the included response probabilities.'
        }
      </Prose>

      <SelectedCorpusContext />

      <Prose>
        {'The supplied records come from the official GSM8K repository at revision '}
        <code>{'3101c7d5072418e28b9008a6636bde82a006892c'}</code>
        {
          '. Before any fit, we selected the first 24 training and 12 test rows in source order whose questions occupy at most 240 UTF-8 bytes and whose final labels are integers from 0 to 99. The full questions, original solutions, source splits and source row numbers remain in '
        }
        <code>{'records.json'}</code>
        {
          '. Its accompanying provenance and MIT notice identify the source and permitted redistribution. This short numeric subset is deliberately restricted; it is not the full GSM8K benchmark.'
        }
      </Prose>

      <Prose>
        {
          "The first training row is Natalia's clips problem. The original solution gives 48/2=24 clips in May and 48+24=72 across both months. We retain that full solution for inspection, but the teacher-forced response target is only "
        }
        <code>{'#### 72'}</code>
        {' plus EOS. The generation prompt is the complete question followed by '}
        <code>{'Give the final numeric answer as #### number.'}</code>
        {
          ' It contains no gold answer or supplied solution. The study does not train the model to imitate the original chain of reasoning. Its 12-token generation cap would also make long derivations impossible; read its results as short final-answer behavior.'
        }
      </Prose>

      <Prose>
        {
          'Source annotations can themselves contain awkward wording: one retained training question names Julie while its solution names Maila, and another question prices pounds in one currency while its prose uses dollar notation. The originals stay verbatim. A matching numeric label does not verify every name, unit or reasoning sentence in the source or generated answer.'
        }
      </Prose>

      <TinyCausalModelAnatomy />

      <Prose>
        {
          'The custom policy is an actual small causal Transformer built from the exact earlier Causal Language Modeling classes. It uses 260 token addresses: raw bytes 0–255, PAD 256, EOS 257, BOS 258 and SEP 259. This vocabulary is fixed; no test text is used to fit it. A reserved token is a separate address, not the ordinary byte string that spells its label.'
        }
      </Prose>

      <Prose>
        {
          'For a batch of B sequences of length L, the input IDs have shape B×L. Token and position embeddings produce B×L×24 hidden values. A single pre-normalization block forms two attention heads, each 12 values wide. Its score matrices have shape B×2×L×L. A triangular causal mask prevents a position from reading future positions. The weighted values return to width 24 and add to the residual stream. A second normalization feeds an MLP with widths 24→96→24, followed by another residual addition. Final normalization and a linear output head produce B×L×260 logits. Softmax turns the 260 logits at one position into probabilities for its next token.'
        }
      </Prose>

      <Prose>
        {
          'Position t−1 predicts the target at position t. The packed batch therefore shifts targets by one position and gathers the log probability of the actual next ID, rather than treating the entire 260-way logit vector as a token score. Right padding occurs after every real sequence, so a real causal position cannot attend to it. The response mask excludes all prompt targets and padding targets. A genuinely generated EOS is still a response target and remains included. Native GPT-2 later uses its own attention-mask path and left-padded prompt tensors; identical address conventions do not make those architectures identical implementations.'
        }
      </Prose>

      <Program file="causal_backbone.py" />

      <Prose>
        {''}
        <code>{'CausalAttention'}</code>
        {' opens the Q/K/V projections, triangular softmax and weighted sum. '}
        <code>{'Block'}</code>
        {' opens both residual additions. '}
        <code>{'TinyLM'}</code>
        {
          ' opens embedding lookup, position addition and output logits. Their complete class ASTs match the earlier program, as recorded in '
        }
        <code>{'backbone-provenance.json'}</code>
        {
          '. Autograd and linear algebra are delegated to PyTorch; the sampling, verifier, masks, coefficients and training loop below are written explicitly. This is a scratch RLVR pipeline around a real causal architecture, not a claim to implement every tensor kernel.'
        }
      </Prose>

      <GeneratedGroupAndMasks />

      <Prose>
        {
          'At each scheduled rollout, the program chooses two distinct training prompts and draws four responses per prompt. It samples from the full temperature-1 distribution with no grammar filter, answer lookup or top-k truncation. It stops at a sampled EOS or the 12-token cap. Generated reserved addresses remain visible in the decoded trace; they are not silently converted into a valid numeric answer. Each response retains its prompt, IDs, sampled log probabilities, termination reason, extracted span, parsed numeric object and verifier verdict.'
        }
      </Prose>

      <Prose>
        {
          'The inspector begins with the first saved rollout, not a handpicked success. Compare one parsed wrong answer, an extraction failure and an accepted answer where present. The reward comes from the same displayed response. Group means, population standard deviations and coefficients come from those exact four rewards. If both groups fail uniformly, their centred coefficients are zero; the drawing does not substitute a mixed group to make an update look useful.'
        }
      </Prose>

      <Program file="rlvr_data.py" />

      <Prose>
        {''}
        <code>{'pack'}</code>
        {' places complete prompt and response IDs in a right-padded matrix. '}
        <code>{'score_targets'}</code>
        {
          " shifts the targets, gathers the next-address log probabilities and returns the same response mask. The strict extraction/verdict code from the first sections remains the reward source. This interface joins data and gradients: a reward is associated with an entire sampled response, while its coefficient multiplies that response's included token scores."
        }
      </Prose>

      <RolloutReuseAndUpdate />

      <Prose>
        {
          "Before either GRPO update, score the sampled targets under the rollout policy and frozen warm reference without gradients. Check sampled generation scores against the same pre-update policy's batched scores. Then freeze these old scores and the group coefficients for both epochs. During each epoch, rescore the same included targets under the current trainable policy. Compute the current/old ratios, signed clipped surrogate and plain sampled k3 against the reference, reduce over tokens within each response and over responses, then differentiate and take one AdamW step."
        }
      </Prose>

      <Prose>
        {
          'The current probabilities can change after the first update while the old denominator remains fixed. Refreshing it inside the second epoch would change the objective. The reference remains the warm policy across rollouts; after a new rollout, the old snapshot is the policy that generated that new batch. Each actual epoch records its loss, token ratios, sampled k3, gradient norm, parameter displacement and resulting weight hash. A zero centred reward does not imply a globally zero update when a separate reference penalty contributes.'
        }
      </Prose>

      <Prose>
        {
          'The selected-response SFT arm instead packs only accepted responses and takes one response-equal likelihood update when that set is nonempty. Its empty-set branch records no update. The warm-up likelihood loss pools all included response targets, whereas the later losses give each included response equal weight. The distinction is visible in their numerators and denominators.'
        }
      </Prose>

      <Program file="tiny_causal_rlvr.py" />

      <Prose>
        {''}
        <code>{'warm_model'}</code>
        {' performs the prescribed response-target supervision. '}
        <code>{'sample_group'}</code>
        {' generates each next address from the actual network. '}
        <code>{'group_coefficients'}</code>
        {
          ' computes prompt-local centred rewards, optionally divided by population standard deviation plus .0001. '
        }
        <code>{'grpo_update'}</code>
        {' fixes old/reference scores and opens both epochs. '}
        <code>{'verified_sft_update'}</code>
        {' opens selection and the empty-set branch. '}
        <code>{'evaluate'}</code>
        {
          ' generates fresh responses on untouched test records without updating weights. Seeds are keyed by arm, rollout or evaluation checkpoint so the saved trace can identify each random stream.'
        }
      </Prose>

      <Prose>{'Run the supplied files from their downloaded directory:'}</Prose>

      <CodeBlock language={'bash'}>
        {
          "python -m venv .venv\n# Activate .venv using your shell's activation command.\npython -m pip install -r requirements.txt\npython -B tiny_causal_rlvr.py --output observations/tiny-study.json --workdir checkpoints\npython -B evaluate_rollouts.py --study observations/tiny-study.json --output observations/metrics.json"
        }
      </CodeBlock>

      <Prose>
        {
          'The dataset, helpers and pinned requirements are in the complete file index. Use fresh output and work directories. The journal writes raw observations before updates, retains completed warm/update/evaluation events and failures, and atomically replaces one coherent latest state containing weights, optimizer, RNG and the fixed batch context. It does not silently resume, replay or overwrite a failed scientific run. A successful check of the code is separate from a successful learning outcome, which we inspect next.'
        }
      </Prose>

      <H2>{'13. Read every measured arm and its limits'}</H2>

      <Prose>
        {
          'We fixed the seeds, budgets and evaluation checkpoints before execution. The completed study includes every scheduled arm and its raw unsuccessful responses; there is no second fit chosen because the first result was disappointing.'
        }
      </Prose>

      <SharedWarmStartAndArms />

      <Prose>
        {
          'Each of seeds 17, 29 and 43 has one 192-update warm start on the 24 training records. For that seed, the three arms begin from exact copies of those weights: group-scaled GRPO, unscaled centred GRPO and verified-sample SFT. The first divides centred rewards by population standard deviation plus .0001; the second leaves them centred but unscaled; the third retains accepted responses as supervised targets. All use the same prescribed 48 scheduled rollout batches and two prompts with four responses per prompt.'
        }
      </Prose>

      <Prose>
        {
          'The six GRPO arms each take two updates per rollout, or 96 actual updates. Verified-sample SFT takes one update for a nonempty selected set and skips the rest: its actual counts are 39, 29 and 26 across the three seeds. There are 50 skipped SFT rollouts in total. An identical starting checkpoint is not an identical compute budget, and it is not identical sampled text: arm-specific random streams generate fresh batches and evaluations. Even at checkpoint 0, format counts can differ between arms with identical weights because different responses were sampled.'
        }
      </Prose>

      <ActualRewardAndContrastHistory />

      <Prose>
        {
          'Across all nine arms, the study generated 3,456 training responses in 864 prompt groups, using 28,537 actual generated tokens. It made 670 arm optimizer updates: 576 GRPO updates and 94 selected-response SFT updates. The earlier 576 warm updates are a separate cost. A scheduled rollout is not synonymous with an optimizer step, and a response is not synonymous with a token.'
        }
      </Prose>

      <Prose>
        {
          'The history exposes homogeneous groups alongside mixed groups. For scaled GRPO, mixed-group counts out of 96 groups are 54, 36 and 26 for seeds 17, 29 and 43. For unscaled GRPO they are 43, 40 and 25. These are observed contrasts from the actual policy at each step, not the IID probabilities from section 8. They should not be pooled as though all groups had one stationary success rate. Read any drift in acceptance, length and reference penalty from the same saved steps. An increase on sampled training prompts alone does not establish generalization to different questions.'
        }
      </Prose>

      <HeldoutResponseInspector />

      <Prose>
        {
          'At checkpoints 0, 16, 32 and 48, every arm generates eight fresh responses for each of the 12 selected test records. Each checkpoint therefore has 96 sampled responses, and the complete study retains 3,456 evaluation responses. No test response enters a training update. The final strict answer-pass counts are:'
        }
      </Prose>

      <NeuralTable
        caption={'13. Read every measured arm and its limits'}
        headers={[
          <>{'Seed'}</>,
          <>{'Group-scaled GRPO'}</>,
          <>{'Unscaled centred GRPO'}</>,
          <>{'Verified-sample SFT'}</>,
        ]}
        rows={[
          [<>{'17'}</>, <>{'1/96'}</>, <>{'0/96'}</>, <>{'0/96'}</>],
          [<>{'29'}</>, <>{'0/96'}</>, <>{'0/96'}</>, <>{'0/96'}</>],
          [<>{'43'}</>, <>{'0/96'}</>, <>{'0/96'}</>, <>{'1/96'}</>],
        ]}
      />

      <Prose>
        {
          'All nine initial answer-pass counts were 0/96. Most final counts remain zero. The two isolated passes do not establish a reliable advantage for either method. The unscaled seed-17 arm had 2/96 at the predeclared checkpoint 32 but 0/96 at the terminal checkpoint; selecting its intermediate peak would tell a different story. The lesson keeps all four checkpoints and reports the terminal results without selecting a winner.'
        }
      </Prose>

      <Prose>
        {
          'Inspect the complete generated strings. Some outputs match the requested final-marker format but give the wrong number; others cannot be parsed. For example, at the scaled seed-17 terminal checkpoint, 35/96 responses had a parseable final numeric span while only 1/96 matched the gold. Format acceptance and answer correctness thus reveal different limitations. These programs check final numbers, not independently verified reasoning. Low answer success is not hidden behind a falling teacher-forced loss or a rising training reward.'
        }
      </Prose>

      <Prose>
        {
          'The experiment is intentionally small: a byte model, 24 short-answer training questions, 12 filtered test questions, a 12-token cap and short fixed training. It makes sampling, masks and updates inspectable; it does not reproduce a large reasoning model or justify a deployment recommendation. More seeds or a different budget would be a new prospective experiment, not a correction that silently replaces these measured outcomes.'
        }
      </Prose>

      <Program file="evaluate_rollouts.py" />

      <Prose>
        {''}
        <code>{'sample_metrics'}</code>
        {
          ' counts accepted answers, parseable spans, EOS outcomes, lengths and answer votes from each complete response set. '
        }
        <code>{'summarize'}</code>
        {
          ' keeps every arm, checkpoint and work denominator. It computes descriptive statistics from the retained JSON without training or regenerating any sample. Changing a parser contract would produce a different measurement, so the contract is part of the result rather than an afterthought.'
        }
      </Prose>

      <Old ids={['5-production-implementation']} />
      <H2>{'14. Use ordinary tools with explicit contracts'}</H2>

      <Prose>
        {
          'A native library can supply a tokenizer, model architecture or training loop. It still needs an explicit task contract and settings. The next two routes show actual maintained tools; they answer different questions from the nine custom-model arms.'
        }
      </Prose>

      <PretrainedToolOutputs />

      <Prose>
        {'The pretrained route opens '}
        <code>{'google/flan-t5-small'}</code>
        {' at exact revision '}
        <code>{'0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab'}</code>
        {
          ' from a local cache. It feeds each complete selected test question and the same final-marker instruction to the ordinary tokenizer and encoder-decoder model, then generates greedily with a maximum of 64 new decoder tokens. It does not fit or adapt that checkpoint.'
        }
      </Prose>

      <Prose>
        {
          'Unlike a causal prompt-plus-response array, the returned encoder-decoder sequence starts with a decoder-start address. That position is counted separately from new generated tokens. The inspector displays input IDs, returned IDs and decoded response so the length accounting can be checked. The twelve actual outputs are unmarked short numeric strings such as '
        }
        <code>{'0'}</code>
        {', '}
        <code>{'3'}</code>
        {' and '}
        <code>{'20'}</code>
        {'. Every strict verifier verdict says '}
        <code>{'missing final marker'}</code>
        {
          ', giving 0/12 under this declared contract. The displayed strings also differ from their corresponding gold numbers. We preserve the actual responses and do not manufacture reasoning explanations or retry with a more favorable prompt.'
        }
      </Prose>

      <Program file="hf_eval_math.py" />

      <Prose>
        {
          'After installing the supplied requirements, run this acquisition command from the program directory. It uses the network to place the '
        }
        <strong>{'exact'}</strong>
        {' named revision in the Hugging Face cache rooted at '}
        <code>{'model-cache'}</code>
        {':'}
      </Prose>

      <CodeBlock language={'bash'}>
        {
          "python -c \"from huggingface_hub import snapshot_download; snapshot_download(repo_id='google/flan-t5-small', revision='0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab', cache_dir='model-cache')\"\npython -B hf_eval_math.py --cache model-cache --output observations/flan.json"
        }
      </CodeBlock>

      <Prose>
        {''}
        <code>{'snapshot_download'}</code>
        {' creates the repository/revision cache layout; pass that same '}
        <code>{'model-cache'}</code>
        {' root to '}
        <code>{'--cache'}</code>
        {', not its internal snapshot directory. Here '}
        <code>{'cache_dir'}</code>
        {' is intentional: a flat '}
        <code>{'local_dir'}</code>
        {' export has a different layout. '}
        <a href={'https://huggingface.co/docs/huggingface_hub/guides/download'}>
          {"Hugging Face's download and cache guide"}
        </a>
        {
          ' explains this ordinary-tool operation. Acquisition downloads files but does not generate answers or fit a model. The second command opens only the local cache and evaluates the twelve tasks. Its '
        }
        <code>{'local_files_only=True'}</code>
        {' makes a missing cache an error, rather than downloading a different revision.'}
      </Prose>

      <Prose>
        {
          'This greedy pretrained observation is separate from the custom architecture, its training history and its sampled evaluation; comparing displayed outputs is useful, but it is not a paired causal claim about model quality.'
        }
      </Prose>

      <NativeTrainerContract />

      <Prose>
        {'The native training route constructs a separate tiny '}
        <code>{'GPT2LMHeadModel'}</code>
        {
          ", with the same vocabulary and contextual dimensions but its own maintained GPT-2 implementation. It performs its prescribed 64 warm updates, saves that exact local state for TRL's reference loader, and performs one real GRPO update on four generated responses. This is not the earlier custom TinyLM study."
        }
      </Prose>

      <Prose>
        {'The options define the calculation: '}
        <code>{'loss_type="grpo"'}</code>
        {
          ', group reward scaling, token ratios, beta .02, symmetric clipping .2, no truncation masking and '
        }
        <code>{'use_bias_correction_kl=False'}</code>
        {'. '}
        <code>{'disable_dropout=True'}</code>
        {
          ' makes the declared dropout-free comparison explicit. Full-support temperature-1 generation and the 12-token cap match the stated sampling contract. Pinned TRL uses sample standard deviation plus .0001 here, whereas the custom group formula uses population standard deviation. Calling both routes "GRPO" does not eliminate that difference.'
        }
      </Prose>

      <Prose>
        {'AdamW keeps two running summaries for each parameter coordinate. Its '}
        <strong>{'first moment'}</strong>
        {' averages previous gradients; its '}
        <strong>{'second moment'}</strong>
        {' averages their squares. Their retention weights are '}
        <InlineMath>{'\\beta_1'}</InlineMath>
        {' for the first moment and '}
        <InlineMath>{'\\beta_2'}</InlineMath>
        {
          ' for the second: .9 and .999 here, so each new observation receives the complementary weight '
        }
        <InlineMath>{'1-\\beta_1'}</InlineMath>
        {' or '}
        <InlineMath>{'1-\\beta_2'}</InlineMath>
        {'. With fresh zero moments and current gradient g, the first step has '}
        <InlineMath>{'m_1=(1-\\beta_1)g'}</InlineMath>
        {' and '}
        <InlineMath>{'v_1=(1-\\beta_2)g^2'}</InlineMath>
        {'. Dividing by the corresponding bias-correction factors recovers g and '}
        <InlineMath>{'g^2'}</InlineMath>
        {
          ' on that step. Their ratio, with a small positive denominator epsilon, determines the parameter movement. The native optimizer here starts fresh and has zero weight decay; later steps also depend on accumulated history, so this first-step simplification does not describe every AdamW update.'
        }
      </Prose>

      <Prose>
        {
          'In the actual sampled native group, all four rewards were zero. The native loss was zero; the explicit loss was approximately −7.2377×10^-11. Their maximum gradient difference was 2.44964×10^-9, within the declared loss and gradient guards. Nevertheless the native and explicit AdamW parameter steps '
        }
        <strong>{'failed'}</strong>
        {
          ' the original equality guard: the maximum parameter difference was 9.83812×10^-5, above its 5×10^-5 threshold.'
        }
      </Prose>

      <Prose>
        {
          "This is a numerical conditioning example. The native first moments were zero and its weights remained equal to the warm reference. The explicit gradient contained tiny nonzero rounding terms. For a fresh first AdamW step with no weight decay, a coordinate's displacement magnitude is"
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\frac{\\alpha_{\\rm lr}\\,|g|}{|g|+\\epsilon_{\\rm Adam}}.'}</MathBlock>
      </div>

      <Prose>
        {'Here '}
        <InlineMath>{'\\alpha_{\\rm lr}'}</InlineMath>
        {' is the learning rate, g the current coordinate gradient and '}
        <InlineMath>{'\\epsilon_{\\rm Adam}'}</InlineMath>
        {
          " the optimizer's denominator stabilizer. That epsilon is separate from the group-standard-deviation stabilizer and the clipping band in earlier sections."
        }
      </Prose>

      <Prose>
        {
          "At learning rate .0005, epsilon 10^-8 and gradient about 2.44964×10^-9, that displacement is about 9.83820×10^-5. A tiny gradient mismatch can thus produce a visible parameter mismatch near the optimizer's epsilon scale. Agreement of losses and gradients within tolerance did not guarantee agreement of the resulting updates. The failed comparison remains failed; its threshold was not relaxed and the training step was not replayed."
        }
      </Prose>

      <Prose>
        {'Each saved step was subsequently checked against '}
        <strong>{'its own'}</strong>
        {
          ' retained first moments, second moments, initial weights and optimizer settings. The native analytical parameter error was zero; the explicit maximum error was 5.82077×10^-11 within a declared arithmetic-rounding allowance. An absent native post-zero_grad gradient was explicitly inferred from its first moment, not relabelled an independently retained backward-gradient observation. This establishes own-step arithmetic consistency, not native/explicit update equality.'
        }
      </Prose>

      <Prose>
        {
          "The original program's last mixed-coefficient fixture had not been reached. After prospective review, a separate continuation restored the retained native state and batch and executed only that fixture for the first time. It assigned the declared coefficients (1,−1,1,−1) to those same generated addresses; these were not observed verifier outcomes. Both fixture losses were zero and their maximum gradient difference was 2.98023×10^-7. It took no optimizer step, generated no response and left native/reference parameters unchanged. The zero forward mean hides nonzero signed gradient paths, which is exactly why the fixture is useful alongside the homogeneous sampled group."
        }
      </Prose>

      <Program file="trl_bridge.py" />

      <Program file="adamw_step_audit.py" />

      <Prose>
        {''}
        <code>{'explicit_loss'}</code>
        {
          ' opens causal gathering, current/old token ratios, signed clipping and plain k3. The maintained '
        }
        <code>{'_compute_loss'}</code>
        {
          ' supplies the library comparison. The complete updated runnable example reports cross-implementation equality separately from the own-step audit; neither property is implied by the other. The historical failure and separately source-bound continuation remain distinct observations. Reading retained rows requires care too: the trainer may shuffle a captured generation batch before computing loss. The updated program logs actual loss inputs and matches exact token/mask rows, consuming identical duplicates once. A numerical row correspondence inferred for the old trace is qualified as inference, not a logged permutation.'
        }
      </Prose>

      <Prose>
        {
          'The shared journal helper records raw operands and measured discrepancies before guards and coherent state at actual boundaries. That makes a failed comparison useful evidence rather than a missing final JSON. It never grants permission to silently replay a failed stage.'
        }
      </Prose>

      <Program file="scientific_journal.py" />

      <Prose>
        {'Finally, ordinary mathematical checking has its own contract. The earlier '}
        <code>{'math_verify_bridge.py'}</code>
        {
          " calls the actual Math-Verify parser/verifier and TRL's accuracy reward on declared finite cases. Missing gold can return "
        }
        <code>{'None'}</code>
        {
          ', different extraction conventions can change the accepted object, and a reasoning delimiter does not prove the text preceding it. These are tool behaviors to inspect, not interchangeable substitutes for the strict final-marker checker.'
        }
      </Prose>

      <Old ids={['7-decision-matrix', '8-what-scales-and-what-doesn-t']} />
      <H2>{'15. Count evaluation and interpret public examples'}</H2>

      <Prose>
        {
          'Once outputs are retained, the next question is which event a reported score counts. An answer-pass fraction, any-success probability, vote and reasoning assessment are distinct measurements even when they use the same responses.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Deeper: evaluation and public protocols.'}</strong>
        {
          " The core study's answer-pass counts are already available; this branch asks what other denominators and recipe choices can legitimately establish."
        }
      </Prose>

      <PassAtKSamplingGeometry />

      <Prose>
        {
          'Suppose a retained set has n=8 complete responses and c=2 answer passes. If we choose a subset of k=4 uniformly without replacement from those eight, the chance that it contains at least one pass is'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'\\widehat{\\operatorname{pass@}k}\n=1-\\frac{\\binom{n-c}{k}}{\\binom{n}{k}}.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'The failure subsets select four of the six failures: C(6,4)=15. There are C(8,4)=70 total subsets, so the result is 1−15/70=11/14, approximately .785714. This is the familiar pass@k estimator computed from a retained response set, under its sampling assumptions. It differs from the known-IID probability 1−(1−p)^4=.68359375 at true p=.25. An observed count c/n=.25 is not a known population success probability.'
        }
      </Prose>

      <Prose>
        {
          'If k>n, the retained-set estimator is unavailable. If n=8 and c=0, it is zero for admissible k; if n−c<k, it is one because every such subset contains a pass. In our terminal scaled seed-17 record with one success among eight, its pass@4 estimate is .5. Averaging that value with eleven zero-record estimates gives .0416667 across the twelve selected records, not a per-response answer-pass fraction of .0416667.'
        }
      </Prose>

      <Prose>
        {'An answer vote asks a different question. A '}
        <strong>{'plurality'}</strong>
        {' chooses the most frequent parsed answer; it need not have more than half the votes. A '}
        <strong>{'majority'}</strong>
        {
          ' requires that stricter share. Our metrics reject a tied plurality as having no unique winner and keep invalid extraction outcomes separate. Eight repeated wrong answers can have unanimous agreement and zero answer-pass probability. Votes are not a verifier for truth; they expose consistency of the sampled answers. Repeated learned reasoning judgments have an additional dependence and accuracy question.'
        }
      </Prose>

      <PaperProtocolComparison />

      <Prose>
        {
          "The public literature illustrates why the complete recipe belongs next to a method name. Tülu 3's RLVR phase uses PPO with explicit verifiable rewards and a value model. Its declared prompt mixture includes 7,473 GSM8K, 7,500 MATH and 14,973 constrained instructions. It uses reward 10 for its verifiable successes and a −10 missing-EOS penalty. The reported selected checkpoints use domain evaluations; they are not the terminal results of our nine-arm study. Its examples also show constraint-satisfying outputs that fail to answer the useful question. "
        }
        <a href={'https://arxiv.org/html/2411.15124v3'}>{'Tülu 3, section 6 and Appendix B.4'}</a>
        {'.'}
      </Prose>

      <Prose>
        {'DeepSeekMath introduces GRPO in a recipe that actually uses a '}
        <strong>{'learned reward model'}</strong>
        {
          ', trained from rule-based judgments. Its reward-model training and later reference/reward refresh choices should not be relabelled a deterministic rule-only R1-Zero loop. The mathematical derivation is useful for the group objective and sampled KL treatment; a shared objective name does not establish the same feedback source. '
        }
        <a href={'https://arxiv.org/html/2402.03300v2'}>
          {'DeepSeekMath, section 4 and Appendix A'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          "The January DeepSeek-R1 report distinguishes rule-reward R1-Zero from the full multi-stage R1 pipeline. The latter includes cold-start SFT, reasoning RL, rejection-sampled/nonreasoning SFT and later general-domain learned feedback. Its distilled models' SFT results do not mean each distilled model received the same RL procedure. January R1-Zero reports AIME pass@1 rising from 15.6 to 71.0 and a final consensus@64 result of 86.7; its evolving Figure 2 curve uses a different 16-response evaluation description. Those protocols should not be merged into one sampling denominator. "
        }
        <a href={'https://arxiv.org/html/2501.12948v1'}>{'DeepSeek-R1, January v1'}</a>
        {'.'}
      </Prose>

      <Prose>
        {
          'The Nature treatment reports its own revised results and settings, including training group size 16, beta .001 and periodic reference refresh every 400 steps. It is a separately documented version, not permission to mix January and Nature scores or substitute evaluation sample counts for training groups. Longer response traces in a particular run do not prove that increasing length always improves reasoning. '
        }
        <a href={'https://www.nature.com/articles/s41586-025-09422-z'}>
          {'DeepSeek-R1, Nature Methods'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          'The pinned Open-R1 README describes a historical reproduction effort, marks its distillation step complete and says the repository is no longer maintained, pointing training users toward TRL. A roadmap is not evidence that every planned R1 stage was reproduced. The installed source inspected in this lesson is TRL v1.14.2, whose current loss default differs from original GRPO, so the native example declares its options explicitly. '
        }
        <a
          href={
            'https://github.com/huggingface/open-r1/tree/5b6ff22b3fb7aa069c54866e517f39dfc3160e09'
          }
        >
          {'Open-R1 at the retained revision'}
        </a>
        {', '}
        <a href={'https://github.com/huggingface/trl/tree/v1.14.2'}>{'TRL v1.14.2'}</a>
        {'.'}
      </Prose>

      <WorkAndMetricLedger />

      <Prose>
        {
          'A work ledger helps keep these comparisons concrete. Our three custom warm runs use 576 updates and 3,456 drawn training rows, with 26,770 included response-target positions across their teacher-forced batches. The later arms use 864 prompt groups, 3,456 generated training responses and 28,537 generated tokens; their 670 actual optimizer updates exclude the 50 skipped SFT rollouts. Evaluation adds 3,456 fresh sampled responses. The separate native architecture adds 64 warm updates and one native optimizer update; its explicit twin step is comparison arithmetic and is counted separately from a training arm. The later fixture adds no optimizer update. Flan adds twelve greedy responses with decoder-start positions excluded from new-token counts.'
        }
      </Prose>

      <Prose>
        {
          "Storage roles differ too. Trainable policy parameters receive gradients. Frozen old log probabilities can represent the rollout denominator without a second permanently stored rollout model in this small implementation. A frozen reference model supplies its own target probabilities. AdamW adds first and second moments for parameters it updates. PPO additionally has a value-model role that GRPO's group baseline avoids. These objects explain a memory difference; they do not support a universal percentage saving without sizes, precision, batching and architecture."
        }
      </Prose>

      <Prose>
        {
          'Selected-set numeric answer success is measured here. Independently assessed reasoning correctness and human usefulness are not measured. Parser acceptance, answer accuracy and a learned reward score cannot silently replace those absent measurements. Count each test invocation, generated position and optimizer step under its actual role before comparing systems or making a cost claim.'
        }
      </Prose>

      <ControlledUseDecision />

      <Prose>
        {
          'To decide whether RLVR fits a task, follow the concrete questions. What intended property can the checker establish? Is a valid gold or specification available, and what happens when it is absent? Can the policy generate useful candidates, and do sampled groups expose a contrast? Can a high reward arise from a specification gap? Does improvement extend to untouched prompts and the intended reasoning or usefulness criterion? An exact-answer task, finite code tests and a formal derivation each take different branches because they check different objects. A subjective stylistic judgment may need human or learned feedback instead. No fixed success-rate threshold answers all of those questions.'
        }
      </Prose>

      <Prose>
        {
          'The next DAPO topic examines specific sampling, clipping, length and reduction choices once this task–reward–sampling–update contract is explicit. Carry the original response identities and denominators forward; changing a mechanism should change a named operation that the learner can trace.'
        }
      </Prose>

      <Program file="run_all.py" />

      <Prose>
        {
          "The complete staged runner checks source/package/data identities and only reuses a previously successful stage when its result and dependencies still match. A changed source or failed status is an explicit stop. The retained study's original driver stopped at the native equality failure; the descriptive metrics stage was then first invoked separately on the already complete custom study. A later approved fixture receipt does not rewrite that original failure or turn an isolated metrics report into a claim that the entire driver passed."
        }
      </Prose>
      <Old ids={['11-self-check-exercises']} />
      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <H2>{'16. Transfer the contract to new cases'}</H2>
        <Prose>
          {
            'The next exercises change the inputs rather than asking you to repeat the worked defaults. Trace the accepted object, conditional denominator and gradient route before choosing a number. The '
          }
          <a href={'/learn/examples/rlvr/FILES.md'}>{'file index'}</a>
          {' links the complete programs and the '}
          <a href={'/learn/examples/rlvr/rlvr-observations.zip'}>{'recorded outputs'}</a>
          {
            ' used for the inspection tasks. Extract the latter into a separate directory; its failed native status and isolated metrics report retain their distinct roles.'
          }
        </Prose>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'1. Separate a numeric value from a unit-bearing string'}</H3>

          <Prose>
            {'Gold is '}
            <code>{'3/4'}</code>
            {'. Compare the strict final-marker verdicts for '}
            <code>{'#### .750'}</code>
            {' and '}
            <code>{'#### 3/4 kg'}</code>
            {'. What changes if the gold is unavailable?'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' The scratch grammar accepts exact decimal numbers or integer fractions; it does not strip units. Missing gold is a different state from a wrong answer.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Decimal .750 becomes the exact fraction 3/4, so the first response is accepted. The second suffix includes '
              }
              <code>{'kg'}</code>
              {
                ', lies outside the declared numeric grammar and is rejected. If gold is unavailable, both receive unknown acceptance/reward under '
              }
              <code>{'final_verdict'}</code>
              {
                ', even though the parser can still expose the first numeric object and the second extraction failure. Adding unit handling would be a new answer contract, not merely a different reward weight.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'2. Find a counterexample to a weak program test'}</H3>

          <Prose>
            {'The required arithmetic function is x+y. Tests '}
            <code>{'(2,2)→4'}</code>
            {' and '}
            <code>{'(0,0)→0'}</code>
            {' accept candidate '}
            <code>{'x*y'}</code>
            {'. Give an allowed new test that distinguishes it from '}
            <code>{'x+y'}</code>
            {'.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Choose inputs where a product and sum differ; the restricted AST grammar supports both addition and multiplication.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' Add '}
              <code>{'(1,2)→3'}</code>
              {'. Candidate '}
              <code>{'x+y'}</code>
              {' returns 3, but '}
              <code>{'x*y'}</code>
              {
                ' returns 2. The product agreed with the original two tests without implementing addition for all integer pairs. A finite pass therefore established only the checked instances; it supplied no universal equivalence proof.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'3. Reconstruct a nested conjunction proof'}</H3>

          <Prose>
            {
              'Construct a proof of P∧(Q∧R)→(R∧P) using only assumption, conjunction elimination/introduction and implication introduction. Explain where h is valid.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {" R is the right conjunct of the right conjunct of h. P is h's left conjunct."}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Introduce h with premise P∧(Q∧R). Its right elimination gives Q∧R; another right elimination gives R. Its left elimination gives P. Conjunction introduction combines R and P, then implication introduction discharges h. The literal proof object is:'
              }
            </Prose>

            <CodeBlock language={'python'}>
              {
                '("imp-intro", "h", ("and", "P", ("and", "Q", "R")),\n ("and-intro",\n  ("and-right", ("and-right", ("assume", "h"))),\n  ("and-left", ("assume", "h"))))'
              }
            </CodeBlock>

            <Prose>
              {
                'h is valid only inside that implication-introduction body. Running the body alone with no h in context fails the assumption lookup. The kernel reconstructs the proposition from these rules; it does not accept a final prose assertion that the goal was proved.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'4. Mask a generated EOS without scoring the prompt'}</H3>

          <Prose>
            {'A packed row is '}
            <code>{'[BOS,65,SEP,35,EOS,PAD]'}</code>
            {'. The prompt is the first three IDs and the response is '}
            <code>{'[35,EOS]'}</code>
            {
              '. Which shifted prediction positions contribute to the response loss? Their target probabilities are .25 and .5; find the response mean log probability.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Position t−1 predicts target t. A generated EOS is included; right-padding PAD is excluded.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Target positions 3 and 4 are predicted by positions 2 and 3. The mask over the five shifted targets is '
              }
              <code>{'[False,False,True,True,False]'}</code>
              {
                '. Its included target IDs are 35 and EOS. The mean log probability is (log .25+log .5)/2=log(.125)/2≈−1.039720771. The prompt targets and PAD contribute nothing to this response loss. Removing EOS would change both its target set and denominator.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'5. Change the group size and standard-deviation convention'}</H3>

          <Prose>
            {'A group of five has rewards '}
            <code>{'(1,0,0,0,0)'}</code>
            {
              '. Find the mean, population standard deviation and sample standard deviation, then the normalized coefficients with epsilon 0. What changes with a fixed epsilon .0001?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' The squared deviations sum to .8. The population denominator is 5; the sample denominator is 4.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The mean is .2 and deviations are .8,−.2,−.2,−.2,−.2. Population variance is .8/5=.16, so its standard deviation is .4. Sample variance is .8/4=.2, so its standard deviation is sqrt(.2). Population-normalized coefficients are '
              }
              <code>{'(2,−.5,−.5,−.5,−.5)'}</code>
              {'. Sample-normalized coefficients are approximately '}
              <code>{'(1.788854,−.447214,−.447214,−.447214,−.447214)'}</code>
              {
                ". With .0001 added to the respective denominator, population coefficients become .8/(.4+.0001) and −.2/(.4+.0001), approximately 1.999500125 and −.499875031. The sample route uses sqrt(.2)+.0001 instead. A library's named group scaling needs this convention to specify the actual magnitude."
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'6. Compare same-group and leave-one-out baselines'}</H3>

          <Prose>
            {
              'For five IID Bernoulli responses with success probability .4 and a Bernoulli logit policy, find the expected unstandardized score gradient after same-group centering and after a leave-one-out baseline.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' The exact return derivative is p(1−p); same-group centering introduces the factor 1−1/G under these assumptions.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The return derivative is .4×.6=.24. Same-group centering produces (1−1/5)×.24=.192. A leave-one-out baseline removes the self-contribution and gives .24. This statement is about an unstandardized expected score gradient under IID draws. Dividing by a random group standard deviation, clipping or running AdamW creates a different estimator/update and is not covered by this particular factor identity.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'7. Follow all four signed clipping cases'}</H3>

          <Prose>
            {'With clipping [.8,1.2], evaluate '}
            <code>{'(rho,A)'}</code>
            {' equal to '}
            <code>{'(.7,2)'}</code>
            {', '}
            <code>{'(1.3,−2)'}</code>
            {', '}
            <code>{'(1.3,2)'}</code>
            {' and '}
            <code>{'(.7,−2)'}</code>
            {'. Find the mean training loss and its four ratio derivatives.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {' Take the minimum of rho×A and clipped-rho×A before negating for loss.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The surrogate terms are 1.4,−2.6,2.4 and −1.6. Their mean is −.1, so the mean negative-surrogate loss is .1. The first two terms remain on the unclipped branches: a positive coefficient below the lower boundary and a negative coefficient above the upper boundary still have incentives to move toward a better ratio. Their surrogate derivatives are 2 and −2; the other two terms lie on plateaus and have derivative 0. After the negative sign and division by four, the loss derivatives are '
              }
              <code>{'(−.5,.5,0,0)'}</code>
              {'.'}
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'8. Keep forward and reverse KL distinct'}</H3>

          <Prose>
            {'Current p=(.6,.4) and reference q=(.3,.7). Compute both directed KL values. For '}
            <InlineMath>{'p_1=\\operatorname{sigmoid}(\\theta)'}</InlineMath>
            {', compare the derivatives with respect to theta.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' Forward KL differentiates its changing p weights as well as their logs; reverse KL has fixed q weights.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' Forward KL is '}
              <InlineMath>{'.6\\log 2+.4\\log(4/7)\\approx .192041993'}</InlineMath>
              {'. Reverse KL is '}
              <InlineMath>{'.3\\log(.5)+.7\\log(1.75)\\approx .183786897'}</InlineMath>
              {'. The forward derivative is '}
              <InlineMath>{'.6\\times .4\\times\\log 3.5\\approx .300663112'}</InlineMath>
              {'. The reverse derivative is '}
              <InlineMath>{'p_1-q_1=.3'}</InlineMath>
              {
                '. These close numbers arise from different objectives; a derivative p−q cannot be substituted for the policy-to-reference KL derivative merely because it looks similar.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'9. Separate any success from mixed rewards'}</H3>

          <Prose>
            {
              'With IID pass probability .8 and group size 5, calculate all-failure, all-success, any-success and mixed-group probabilities.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' The disjoint all-failure/mixed/all-success events sum to one.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' All-failure has probability .2^5=.00032, all-success has probability .8^5=.32768, and any-success has probability 1−.00032=.99968. Mixed-group probability is 1−.00032−.32768=.672. Almost certain availability of a success is not the same event as availability of a centred reward contrast. Correlated response draws would need a different probability model.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'10. Change prevalence and oracle error rates'}</H3>

          <Prose>
            {
              'True-success prevalence is .3, false-positive rate .2 and false-negative rate .1. Find noisy acceptance probability, acceptance precision and the two backward- corrected observed rewards.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {' Accepted true successes have mass .3×.9; accepted failures have mass .7×.2.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                " Acceptance probability is .27+.14=.41 and precision is .27/.41=27/41≈.658536585. Correction divides observed reward minus .2 by 1−.2−.1=.7. Observed 0 becomes −2/7 and observed 1 becomes 8/7. Conditional on true failure, the corrected expectation is .2×8/7+.8×(−2/7)=0; conditional on true success it is .9×8/7+.1×(−2/7)=1. The rates must actually be known and class-conditional for these equalities to apply. They are not supplied by a noisy verifier's own decisions."
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'11. Compare shared-column and whole-group corruption'}</H3>

          <Prose>
            {'Two responses have test rows '}
            <code>{'(1,1,0)'}</code>
            {' and '}
            <code>{'(0,1,0)'}</code>
            {
              '. Reward is mean test pass. Complement the middle column for both, then separately complement the entire original grid. What happens to centred normalized coefficients at epsilon 0?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' A shared column can subtract the same reward from both rows; the whole complement replaces each row reward r by 1−r.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Clean rewards are 2/3 and 1/3, mean 1/2, deviations ±1/6 and population standard deviation 1/6, giving coefficients '
              }
              <code>{'(1,−1)'}</code>
              {
                '. Complementing the middle column yields rewards 1/3 and 0, mean 1/6 and the same deviations/standard deviation, so coefficients remain '
              }
              <code>{'(1,−1)'}</code>
              {
                ' despite lower mean reward. Complementing the entire original grid gives rewards 1/3 and 2/3, and coefficients '
              }
              <code>{'(−1,1)'}</code>
              {
                '. Different correlation patterns can therefore preserve or reverse the local contrast. No claim about a simply scaled AdamW update follows without considering clipping, other loss terms and optimizer history.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'12. Inspect an actual skipped supervised update'}</H3>

          <Prose>
            {
              "Open seed 17's verified-sample SFT run, scheduled step 1. Find its accepted IDs, update count, skip reason and cumulative optimizer count. Why is replacing the empty set with its highest-scoring rejected response a new procedure?"
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {" Read the step's "}
              <code>{'update'}</code>
              {' object, not its scheduled step number.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {' The retained object has '}
              <code>{'accepted_ids=[]'}</code>
              {', '}
              <code>{'updates=0'}</code>
              {', '}
              <code>{'loss=None'}</code>
              {' and '}
              <code>{'skip="no accepted response"'}</code>
              {
                '; the cumulative optimizer count is 0. The rollout sampled responses, but provided no accepted likelihood target. Selecting a rejected response would change the selection contract; repeatedly sampling until success would change the sample budget. Neither occurred in the prescribed study. Later accepted steps do not retroactively create this update.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'13. Estimate pass@3 from a different retained set'}</H3>

          <Prose>
            {
              'Ten complete sampled responses contain three answer passes. Compute the retained-set pass@3 estimator. Is it identical to substituting p=.3 into an IID three-draw event probability?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{' Failure subsets choose three of the seven failed responses.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' The estimator is 1−C(7,3)/C(10,3)=1−35/120=17/24≈.708333333. The known-IID expression at p=.3 is 1−.7^3=.657. Uniform subsets without replacement from these ten and new independent draws from a distribution of known success probability are different constructions. The observed 3/10 fraction is not automatically the true population p. If k exceeds 10, this retained-set formula is unavailable rather than extrapolated.'
              }
            </Prose>
          </details>
        </section>
        <section className="rlvr-practice" data-lesson-exercise>
          <H3>{'14. Trace a different real task through the retained file'}</H3>

          <Prose>
            {'Inspect '}
            <code>{'gsm8k-train-70'}</code>
            {
              " in seed 17's first verified-sample SFT rollout. Martha has 68 apples, Tim has 30 fewer than Martha, and Harry has half as many as Tim. Find the gold answer, first sampled response, its parsed object, EOS status and included response-target count. What reasoning claim can the verdict establish?"
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                ' The raw sampled response is kept separately from the numeric span and its full prefix IDs. An extra leading hash does not change the last-marker suffix that this particular checker selects.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                ' Tim has 68−30=38 apples and Harry has 38/2=19, so the gold is 19. The first retained response is '
              }
              <code>{'#####6'}</code>
              {', with response IDs '}
              <code>{'[35,35,35,35,35,54,257]'}</code>
              {'. The checker selects the suffix after the last '}
              <code>{'####'}</code>
              {' marker, parses 6 and returns '}
              <code>{'numeric mismatch'}</code>
              {
                '; reward is 0. A genuine EOS was sampled, so the response is not cap-truncated and all seven response IDs, including EOS, are included targets. The response supplies no valid derivation of the intended answer. The final-number verdict establishes its mismatch, not an independent assessment of every reasoning step in other responses.'
              }
            </Prose>
          </details>
        </section>
      </section>
      <H2>{'Summary'}</H2>

      <Prose>
        {
          "RLVR joins a checkable task property to sampled response probabilities and a chosen learning rule. Extraction, external labels, group contrasts, detached old/reference scores, signed clipping and causal masks determine what that update actually means. The complete programs show real generation and the retained study's limited generalization; the native trace also shows why numerical loss/gradient agreement need not survive an optimizer step. Use each verifier and metric under its named contract, then inspect the changed case."
        }
      </Prose>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
        data-lesson-resource-list=""
      >
        <H2>{'Further reading'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://rlhfbook.com/c/06-policy-gradients'}>
              {'Lambert, RLHF Book: policy gradients'}
            </a>
            {
              ' connects the score-function derivation, baselines and signed PPO clipping to implementation. Use it to revisit the gradient route before comparing group methods; a method-name table alone does not specify a reduction or estimator.'
            }
          </li>
          <li>
            {''}
            <a href={'https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html'}>
              {'OpenAI Spinning Up: deriving the simplest policy gradient'}
            </a>
            {
              ' develops the log-derivative argument and its sampled program step by step. Its episodic construction explains why an action score receives a return; our causal response then expands that score into included token positions.'
            }
          </li>
          <li>
            {''}
            <a href={'https://rlhfbook.com/c/07-reasoning'}>{'Lambert, RLHF Book: reasoning'}</a>
            {
              ' discusses the reward/evaluation distinctions behind reasoning-oriented RL. Read it alongside the literal task contracts here rather than equating longer sampled text with verified reasoning.'
            }
          </li>
        </ul>

        <Old ids={['10-primary-sources']} />
      </section>
      <section
        className="lesson-ending lesson-ending--references"
        data-lesson-ending="references"
        data-lesson-resource-list=""
      >
        <H2>{'Technical references'}</H2>

        <ul>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2411.15124v3'}>
              {'Tülu 3, section 6 and Appendix B.4'}
            </a>
            {
              ' supplies a PPO-based RLVR recipe, source-local checkpoint choices and concrete constraint-gaming examples. Its targeted reward and broad evaluation can move differently, making it useful for evaluating specification scope.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2402.03300v2'}>
              {'DeepSeekMath, section 4 and Appendix A'}
            </a>
            {
              ' supplies the original GRPO derivation and learned-reward-model context. Inspect the reference and reward-model refreshes; its feedback source differs from a rule-only R1-Zero loop.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2501.12948v1'}>{'DeepSeek-R1, January v1'}</a>
            {' and '}
            <a href={'https://www.nature.com/articles/s41586-025-09422-z'}>
              {'the Nature treatment'}
            </a>
            {
              ' distinguish Zero, full multi-stage R1 and distillation. Keep version-local training groups, evaluation sample counts and reference-refresh settings separate when interpreting their results.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2506.14245v2'}>{'Reasoning incentives, v2'}</a>
            {
              ' derives conditional reasoning-class advantages under an explicit relationship between reasoning and answer success. Its finite assumptions and learned CoT judge delimit what can be inferred about real reasoning and generalization.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2510.00915v5'}>
              {'Learning with imperfect verifiers, v5'}
            </a>
            {
              ' treats known class-conditional error rates and oracle reward correction. Its assumptions, variance costs and the degeneracy under affine group normalization are essential when considering a verifier calibration scheme.'
            }
          </li>
          <li>
            {''}
            <a href={'https://arxiv.org/html/2604.07666v2'}>{'RL with noisy verifiers, v2'}</a>
            {
              ' uses response-by-test outcome matrices to distinguish cell, row, column and shared-group corruption. Its evaluated settings and intervals do not define a universal tolerable-noise threshold.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://github.com/huggingface/math-verify/tree/ba3d3aaff23b3f4cac7a14672b4f6e293d97c98b'
              }
            >
              {'Pinned Math-Verify'}
            </a>
            {
              ' opens extraction and grading heuristics. Inspect the raw mathematical object, gold/prediction direction, timeout route and missing-label behavior before adopting its reward in a different task.'
            }
          </li>
          <li>
            {''}
            <a href={'https://github.com/huggingface/trl/tree/v1.14.2'}>{'Pinned TRL v1.14.2'}</a>
            {
              ' is the ordinary native route examined by the complete program. Its actual loss and group-standard-deviation code govern this comparison; future library defaults require a fresh contract check.'
            }
          </li>
        </ul>
      </section>

      <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
        <H2>{'Keep going'}</H2>

        <Prose>
          {
            'Before continuing, check that you can trace a new raw response into its parsed object and verdict, distinguish a mixed group from any-success sampling, reconstruct a shifted response mask, and explain a signed clipping case. You should also be able to inspect a saved failed update without turning its separate fixture check into a successful learning claim.'
          }
        </Prose>

        <Prose>
          {''}
          <a
            href={
              '/learn/path/full-curriculum/dapo-dynamic-adaptive-policy-optimization?module=large-language-models'
            }
          >
            {'DAPO'}
          </a>
          {
            " develops specific changes to clipping, token reduction, group collection and length feedback. Carry this lesson's verifier object, response masks and work/evaluation denominators into that comparison so each changed mechanism has a visible purpose and a testable consequence."
          }
        </Prose>
      </section>
    </div>
  );
}
export default {
  title: 'RLVR (Reinforcement Learning with Verifiable Rewards)',
  slug: 'rlvr-reinforcement-learning-with-verifiable-rewards',
  readTime: '~95 min read + 120 min practice',
  content: RLVRLesson,
};
