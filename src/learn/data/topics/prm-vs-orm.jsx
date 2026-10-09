// Deterministic projection of the accepted PRM manuscript; prose is not rewritten here.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  PRMTable as NeuralTable,
  PRMScroll,
  PRMAlgebraTrajectories,
  PRMTaskGeometry,
  PRMLabelSemantics,
  PRMBranchAnnotation,
  PRMBoundaryAnatomy,
  PRMVisibilityAndTargets,
  PRMReductionDenominator,
  PRMStepLoss,
  PRMGradientRoutes,
  PRMNeutralSimplex,
  PRMRealCorpusStructure,
  PRMLearnedFeatureMap,
  PRMStudyResults,
  PRMHeldoutInspector,
  PRMAggregationGeometry,
  PRMCandidateForest,
  PRMEvaluationDenominators,
  PRMCoverageAndAbstention,
  PRMCompletionTree,
  PRMEstimatorSampling,
  PRMConsensusAddresses,
  PRMBeamTree,
  PRMVisitTree,
  PRMValueAdvantageGeometry,
  PRMProverContrast,
  PRMPolicyCredit,
  PRMRewardTelescoping,
  PRMWorkLedger,
  PRMProxyFailure,
} from '../../components/lesson-labs/PRMFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <PRMScroll label="Mathematical expression; scroll horizontally if needed">
    <SharedMathBlock>{children}</SharedMathBlock>
  </PRMScroll>
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn-code/process-reward-models/' + file}
    language="python"
    title={file}
    filename={file}
  />
);
const Old = ({ ids }) => ids.map((id) => <span key={id} id={id} aria-hidden="true" />);
function FileIndex() {
  const files = [
    'prm_records.py',
    'prm_transformers.py',
    'prm_contracts.py',
    'prm_classifier.py',
    'prm_torch.py',
    'prm_search.py',
    'prm_rollouts_rewards.py',
    'README.md',
    'requirements.txt',
    'study-protocol.md',
    'PRM800K-LICENSE.txt',
    'sources/provenance.json',
    'sources/phase2_train.jsonl.prefix',
    'sources/phase2_test.jsonl.prefix',
    'data/extraction.json',
    'data/train.jsonl',
    'data/validation.jsonl',
    'data/test.jsonl',
    'study/model.json',
    'study/predictions.json',
    'study/results.json',
    'study/prospective-inputs.json',
    'download-manifest.json',
  ];
  return (
    <details className="prm-file-index">
      <summary>Program, data and retained-result file index</summary>
      <ul>
        {files.map((file) => (
          <li key={file}>
            <a href={'/learn-code/process-reward-models/' + file}>{file}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
function PRMLesson() {
  return (
    <div className="lesson-flow prm-flow">
      <Prose opening="summary">
        {
          'Follow one algebraic solution from its written steps to labels, causal classifier positions, learned probabilities and a search or policy decision. A final answer and the route to that answer are different objects to judge. That distinction is useful only when the labels, model inputs and evaluation preserve it.'
        }
      </Prose>

      <Prose opening="route">
        {
          'You can follow sections 1–7 first, then return for rollouts, search and policy credit in sections 8–12. The complete programs run without an LLM service. The real-data study uses human mathematical-step annotations; its small lexical classifier is deliberately transparent and has serious limitations.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'Prerequisites: '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#3-predict-every-position-without-seeing-tomorrow'
          }
        >
          {'causal visibility'}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#5-count-the-targets-that-actually-belong'
          }
        >
          {'supervised-position masks'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models#5-learn-a-reward-from-those-labels'
          }
        >
          {'learning a preference reward'}
        </a>
        {
          ' help. We refresh their local operations here. Elementary probability, logarithms, Python and derivatives help with the implementations. A reinforcement-learning background is not required for the finite tree developed later.'
        }
      </Prose>

      <Old ids={['1-why-it-exists', '1-start-with-the-problem']} />
      <H2>{'1. A correct answer can hide a wrong step'}</H2>

      <Prose>
        {'Solve '}
        <code>{'2(x+1)=8'}</code>
        {'. Multiplying through gives '}
        <code>{'2x+2=8'}</code>
        {'; subtracting 2 gives '}
        <code>{'2x=6'}</code>
        {'; dividing by 2 gives '}
        <code>{'x=3'}</code>
        {'. Substitution checks the final answer: '}
        <code>{'2(3+1)=8'}</code>
        {'. This path has both valid transformations and a correct result.'}
      </Prose>

      <PRMAlgebraTrajectories />

      <Prose>
        {
          "Read A's blue path one expression at a time. Each line preserves the same solution set. B's violet path starts with "
        }
        <code>{'2x+1=8'}</code>
        {', so it already lost that property: the constant should be 2. Its later '}
        <code>{'2x=7'}</code>
        {' and '}
        <code>{'x=3.5'}</code>
        {
          ' are consistent with that wrong equation. If B then writes “answer 3”, the final substitution checker accepts that assertion while its first reasoning error remains at step'
        }
      </Prose>

      <ol start={0}>
        <li>{"C's amber path begins correctly but asserts answer 4; its final answer and"}</li>
      </ol>

      <Prose>
        {
          'last step both fail. These are constructed examples that separate the questions; they are not predictions from a trained model.'
        }
      </Prose>

      <Prose>
        {'An '}
        <strong>{'outcome label'}</strong>
        {
          ' judges the completed response under a stated criterion, such as whether the asserted solution passes a final-answer checker. A '
        }
        <strong>{'process label'}</strong>
        {
          ' judges an intermediate step or prefix under a stated rubric. The two can disagree. A checker that accepts one correct root of '
        }
        <code>{'x(x+1)=0'}</code>
        {
          " also needs to ask whether the response omitted the other root. “Correct answer” is always relative to that checker's coverage."
        }
      </Prose>

      <PRMTaskGeometry />

      <Prose>
        {
          "The generator supplies a question-conditioned sequence of tokens. The scorer reads supplied tokens and transforms them into contextual vectors. A vector at a later position can represent earlier visible tokens; its coordinates are numbers, not named rules such as “knows distributivity”. A learned output head maps that vector to a score. In the drawing, the generator's parameter array and scorer's parameter array are separate. Reranking candidates changes which response we choose; it does not, by itself, update either array."
        }
      </Prose>

      <Prose>
        {'A '}
        <strong>{'reward model'}</strong>
        {
          " is a learned scoring function. An ORM learns from outcome targets; a PRM learns from process targets. Neither acronym determines exactly which tokens the model reads or where it receives labels. Cobbe's verifier, Uesato's outcome supervision and Lightman's ORM use different choices. An outcome-trained model may read a full trace and may receive outcome supervision at several positions. A PRM may score steps individually or score a cumulative prefix. We must state those contracts before comparing them."
        }
      </Prose>

      <Prose>
        {
          'Written reasoning is an observable response. It is not guaranteed to reveal every internal computation that produced the answer. Process supervision judges that visible object; it does not give us direct access to an internal proof.'
        }
      </Prose>

      <Old ids={['2-core-intuition', '2-build-the-intuition']} />
      <H2>{'2. Choose what the label means'}</H2>

      <Prose>
        {'A step can be locally valid yet add nothing. Repeating “we have '}
        <code>{'2x=6'}</code>
        {
          '” after already deriving it preserves truth but makes no progress. It can also be locally consistent with a wrong earlier equation. Labeling this case requires deciding whether the target means validity given the visible premise, validity of the entire prefix, or useful progress toward the original problem.'
        }
      </Prose>

      <PRMLabelSemantics />

      <Prose>
        {
          'Trace the first error from left to right. Under a local convention, the first expansion in B is invalid while the next algebraic manipulation can be valid relative to its supplied premise. Under a cumulative-prefix convention, every prefix after that error is invalid. Under first-error annotation, an annotator may stop there: later steps are unannotated. Stopping does not turn the suffix into either a valid or an invalid target. These conventions answer different questions, so a loss or benchmark cannot silently exchange them.'
        }
      </Prose>

      <Prose>
        {
          "PRM800K's human rubric distinguishes negative, neutral and positive ratings. Positive includes valid solution steps and reasonable, understandable attempts that may ultimately turn out to be suboptimal. Neutral includes valid steps without useful progress. Negative includes incorrect or unreasonable steps and other rubric-defined failures. A flagged or missing rating is not the neutral class. Our local model maps upstream ratings −1, 0 and +1 to class IDs 0, 1 and 2: "
        }
        <strong>{'invalid, neutral, progress'}</strong>
        {'. The new IDs are array indices; their names carry the meaning. Here '}
        <strong>{'progress'}</strong>
        {
          ' is our short name for that human annotation category. It does not guarantee future success or a positive prover advantage, which we will define separately in section 10.'
        }
      </Prose>

      <PRMBranchAnnotation />

      <Prose>
        {
          "The annotation interface can contain several alternatives at one step. They are siblings, not a longer solution. Each alternative is judged against the earlier chosen steps. Only the selected completion supplies the next step's prefix. In retained training record 0, the final annotated step has five alternatives after the same previous path. Its first alternative is negative; several alternatives are neutral. Concatenating all five would invent a trace that no annotator saw. The displayed source address tells you which record, step and alternative supplied each label."
        }
      </Prose>

      <Prose>
        {
          'The extractor below keeps current unflagged labels only when their earlier chosen prefix is known and nonnegative. It excludes records used for quality control or initial screening and keeps finishes marked '
        }
        <code>{'solution'}</code>
        {' or '}
        <code>{'found_error'}</code>
        {
          ". It does not fill a missing prefix from a generated future step or the dataset's ground-truth solution. Those fields are useful for auditing, but including them in features would change the learning problem."
        }
      </Prose>

      <Prose>
        {'After the eligibility checks, this actual excerpt from '}
        <code>{'extract'}</code>
        {' records the prefix, current step, mapped label and complete source address:'}
      </Prose>

      <CodeBlock language={'python'}>
        {
          'groups[problem_id].append({\n    "problem_id": problem_id,\n    "question": question,\n    "prefix_steps": prefix.copy(),\n    "current_step": completion["text"],\n    "upstream_rating": rating,\n    "class_id": rating + 1,\n    "source": {\n        "split": source_split,\n        "record": record_index,\n        "step": step_index,\n        "alternative": alternative_index,\n    },\n})'
        }
      </CodeBlock>

      <Prose>
        {
          'The complete program defines that surrounding loop, its filtering counters, deduplication and split logic. Follow '
        }
        <code>{'extract'}</code>
        {
          ': it gathers examples with source addresses, extends the chosen prefix after judging siblings, then deduplicates exact tuples before capping each problem. '
        }
        <code>{'select'}</code>
        {
          ' uses problem identities to construct disjoint groups. IDs track membership and never become model features.'
        }
      </Prose>

      <Program file="prm_records.py" />
      <FileIndex />

      <Prose>
        {'To run the examples locally, download and extract '}
        <a href="/learn-code/process-reward-models/prm-programs-data.zip" download>
          <strong>{'prm-programs-data.zip'}</strong>
        </a>
        {
          ', then open a terminal in its extracted directory. Create a Python virtual environment and install the supplied versions with '
        }
        <code>{'python -m pip install -r requirements.txt'}</code>
        {
          '. NumPy supports the lexical study; PyTorch and Transformers support the later ordinary-tool examples. The small random model runs offline once these dependencies are installed and needs no GPU.'
        }
      </Prose>

      <Prose>
        {'The seven '}
        <code>{'.py'}</code>
        {' files are the complete programs. '}
        <code>{'sources/'}</code>
        {' contains the two retained raw prefixes and their provenance; '}
        <code>{'data/'}</code>
        {' contains the selected train/validation/test examples; '}
        <code>{'study/'}</code>
        {" contains the actual fixed fit's weights, predictions and results. "}
        <a href="/learn-code/process-reward-models/README.md">
          <code>{'README.md'}</code>
        </a>
        {' gives each command, and '}
        <a href="/learn-code/process-reward-models/PRM800K-LICENSE.txt">
          <code>{'PRM800K-LICENSE.txt'}</code>
        </a>
        {
          ' supplies the actual data notice. The lesson shows every complete program directly as well as providing that archive.'
        }
      </Prose>

      <Prose>
        {
          'Run extraction into a new directory with the two supplied complete-record prefixes, preserving the selected examples already present under '
        }
        <code>{'data/'}</code>
        {':'}
      </Prose>

      <CodeBlock language={'shell'}>
        {
          'python prm_records.py --train sources/phase2_train.jsonl.prefix --test sources/phase2_test.jsonl.prefix --out extracted-data'
        }
      </CodeBlock>

      <Prose>
        {
          'The source is a pinned MIT-licensed PRM800K snapshot. The downloadable bundle includes its notice and byte provenance. These files are bounded convenience prefixes, not the complete upstream train and test files. Their sampling and early-step cap restrict what our later measurements can establish.'
        }
      </Prose>

      <Old ids={['3-mathematical-foundation', '3-make-the-idea-precise']} />
      <H2>{'3. Put the target at the right position'}</H2>

      <Prose>
        {
          "A causal model can classify a step after reading it. Add a separator after each step and attach its class label to that separator's position. This gives the model the question, earlier steps and the current step, while excluding future text."
        }
      </Prose>

      <PRMBoundaryAnatomy />

      <Prose>
        {'Read the row '}
        <code>{'Q a SEP b SEP PAD'}</code>
        {
          ' using zero-based positions. The first separator is at position 2; its hidden vector can read positions 0, 1 and 2. The next is at position 4 and can read through position 4. We attach labels at 2 and 4. The class for step '
        }
        <code>{'a'}</code>
        {
          ' belongs to its own boundary, not the next token. Token IDs first select embedding rows; causal transformations produce contextual hidden rows; a shared class head maps each selected row to three logits. The same head parameters are used at both boundaries.'
        }
      </Prose>

      <PRMVisibilityAndTargets />

      <Prose>
        {'Now compare two masks. The '}
        <strong>{'attention mask'}</strong>
        {' controls which positions may contribute information. The '}
        <strong>{'target mask'}</strong>
        {
          ' controls which classifier outputs contribute loss. The question must remain visible even though it has no step label. Padding is neither a question nor a real step and receives no target. An actual end-of-sequence token can be visible without being a supervised step boundary. Even when EOS and PAD share an ID in another model, their positions have different roles. IDs alone cannot infer those roles.'
        }
      </Prose>

      <Prose>
        {'Changing '}
        <code>{'b'}</code>
        {
          " must not change the earlier boundary's logits when the model is causal and dropout is disabled. The later boundary can change. This is an information-flow check, independent of whether either prediction is useful. Our actual random Transformers model passes that exact null test. Editing visible text in the later lexical baseline is a different operation and need not be null."
        }
      </Prose>

      <Prose>
        {
          "For question x, steps s₁ through sᵢ and parameters φ, let hφ(x,s≤ᵢ) be the current boundary's hidden vector. With C classes and vector width d, a head uses W of shape d×C and bias b of length C:"
        }
      </Prose>

      <MathBlock>
        {
          'z_i = W^\\top h_\\phi(x,s_{\\le i}) + b,\\qquad\np_{i,c} = \\frac{\\exp(z_{i,c})}{\\sum_{k=0}^{C-1}\\exp(z_{i,k})}.'
        }
      </MathBlock>

      <Prose>
        {
          'The logits z are unconstrained numbers; softmax turns them into a distribution over the declared classes. W and b are learned. The labels tell us what the classes mean; softmax does not independently verify a mathematical statement.'
        }
      </Prose>

      <PRMReductionDenominator />

      <Prose>
        {
          'A batch also needs a reduction rule. One trajectory has a single included boundary with loss 4. Another has three included boundaries, each with loss 1. The global boundary mean is '
        }
        <code>{'(4+1+1+1)/4=1.75'}</code>
        {'. Averaging within each trajectory and then across trajectories gives '}
        <code>{'(4+1)/2=2.5'}</code>
        {
          '. The first weights boundaries equally; the second weights nonempty trajectories equally. Neither is merely a cosmetic display change: their gradient weights differ.'
        }
      </Prose>

      <Prose>
        {'If mᵢ is 1 for an included boundary and 0 otherwise, the masked boundary mean is'}
      </Prose>

      <MathBlock>{'L = \\frac{\\sum_i m_i\\ell_i}{\\sum_i m_i},\\qquad \\sum_i m_i>0.'}</MathBlock>

      <Prose>
        {
          'An all-masked batch has no defined mean. Skip its update explicitly. Multiplying an undefined mean by zero afterward does not repair it. Truncation must also drop a target if its full current step and boundary were removed. Packing several independent questions into one sequence requires blocked visibility and correct position/target mapping; a plain causal triangle would otherwise let later questions read earlier unrelated examples.'
        }
      </Prose>

      <Prose>
        {'The complete scratch attention and causal backbone are implemented in '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#7-build-the-complete-causal-decoder'
          }
        >
          {'Causal Language Modeling, section 7'}
        </a>
        {' and its visible '}
        <a href={'/learn-code/causal-language-modeling/tiny_causal_lm.py'}>{'tiny_causal_lm.py'}</a>
        {'. Its '}
        <code>{'CausalAttention'}</code>
        {' opens Q/K/V projections, scaled scores, the causal triangle, softmax and weighted sum; '}
        <code>{'Block'}</code>
        {
          ' opens the residual and feed-forward paths. Here the new contributions are the class head, same-boundary targets and their loss eligibility. Reuse that backbone rather than interpreting the library import below as a from-scratch explanation of attention.'
        }
      </Prose>

      <Prose>
        {
          "The ordinary Transformers program uses UTF-8 byte IDs for a tiny random GPT2ForTokenClassification: byte IDs 0–255, SEP 256, EOS 257 and PAD 258. This is an explicit architecture test, not a claim to use Qwen's vocabulary. It builds labels with −100 at excluded positions and actual class IDs at current separators. The library's token-classification cross-entropy (CE) uses those same positions; it measures the negative log probability assigned to the true class. The causal language-model loss instead shifts next-token targets. The next section derives the classification loss and its derivative."
        }
      </Prose>

      <CodeBlock language={'python'}>
        {
          'eligible = labels != -100\nmanual = F.cross_entropy(outputs.logits[eligible], labels[eligible])\n# Compare manual with outputs.loss: no [:, :-1] / [:, 1:] shift here.'
        }
      </CodeBlock>

      <Prose>
        {'Read '}
        <code>{'verify'}</code>
        {
          ' from encoding through the two-row batch, explicit loss, future edit, padding edit, contextual gradient, null-batch guard and save/reload. The program checks the full mechanism using ordinary model APIs. Its loss is a random-model contract result, not a reward quality metric.'
        }
      </Prose>

      <Prose>
        {
          'The executed model has 14,331 parameters, three eligible labels and mean CE 1.106667638 in both library and explicit calculations. One later target gives the earlier question-byte embedding a nonzero gradient norm .102439530. Twenty-six contract checks pass with PyTorch 2.14 and Transformers 5.17, including exact earlier-boundary invariance, padding invariance and save/reload. The random probabilities are near one third; they establish the interface, not a successful mathematical classifier.'
        }
      </Prose>

      <Program file="prm_transformers.py" />

      <CodeBlock language={'shell'}>
        {'python prm_transformers.py --work random-model --output transformers.json'}
      </CodeBlock>

      <Prose>
        {
          "The optional pretrained route requires an immutable commit argument and uses the official Qwen PRM's chat template and atomic "
        }
        <code>{'<extra_0>'}</code>
        {
          ' separator. It verifies a two-class head and selects its positive probability at exactly those positions. It has separate model licensing and substantial memory and download requirements. We did not execute that route or report its model-card example as our result. The tiny offline route is the executed one.'
        }
      </Prose>

      <Old ids={['4-from-scratch-implementation']} />
      <H2>{'4. Learn from a step, not from its name'}</H2>

      <Prose>
        {
          'Consider a binary classifier for “acceptable” versus “invalid”. Suppose it assigns acceptable probability .8 to the wrong expansion '
        }
        <code>{'2x+1=8'}</code>
        {
          ". The label is 0, so training should reduce that probability. It should not reward the model for confidently recognizing the expression's familiar style."
        }
      </Prose>

      <PRMStepLoss />

      <Prose>
        {
          'The binary head computes z=wᵀh+b, then p=σ(z)=1/(1+exp(−z)). At z=ln4, p=.8. For target c=0, the loss is −ln(1−.8)=ln5≈1.609438. Its derivative with respect to z is +.8. A gradient-descent update subtracts a multiple of that positive derivative, lowering z and p. If the target were 1, the derivative would be −.2 instead. The same prediction receives opposite pressure under different declared targets.'
        }
      </Prose>

      <MathBlock>
        {
          '\\ell(z,c)=\\operatorname{softplus}(z)-cz,\n\\qquad \\frac{\\partial\\ell}{\\partial z}=\\sigma(z)-c.'
        }
      </MathBlock>

      <Prose>
        {
          'All displayed loss logarithms are natural logs, so cross-entropy is measured in nats. Softplus is log(1+exp(z)). A stable implementation uses '
        }
        <code>{'logaddexp(0,z)'}</code>
        {
          ' rather than forming exp(z) for a huge positive logit. The derivative is with respect to the logit, not the raw probability. Clipping probabilities before differentiating would create a different function.'
        }
      </Prose>

      <PRMGradientRoutes />

      <Prose>
        {
          'Follow the derivative backward from one boundary. The head receives ∂ℓ/∂w=(p−c)h and ∂ℓ/∂b=p−c; the hidden vector receives (p−c)w. The contextual backbone then routes that derivative into its earlier visible computations. Earlier embeddings can receive gradient even though their own positions have no class label. A frozen backbone blocks its parameter update; a trainable backbone permits it. The target mask says which losses begin this backward route, not which parameters can receive credit through context.'
        }
      </Prose>

      <Prose>
        {
          "For a fully traceable constructed map, average question embedding (0,2) and current-step embedding (2,2), giving h=(1,2). With w=(.4,.3) and bias ln4−1≈.386294, z=ln4 and p=.8. The invalid-target derivative gives head-weight gradient (.8,1.6), bias gradient .8 and hidden gradient (.32,.24). Each averaged input receives half that hidden gradient, (.16,.12). This fixed-average map isolates the route; a real Transformer has learned attention and additional operations. The actual library test separately checks that its causal backbone also sends a later label's gradient to an earlier question embedding."
        }
      </Prose>

      <Prose>
        {
          'This differs from the earlier CAI pairwise target. There, a preferred pair constrains a score difference. Here, one labelled step supplies an absolute class target under a rubric. A sigmoid score can be used in both settings, but their supervision and probability meanings differ.'
        }
      </Prose>

      <PRMNeutralSimplex />

      <Prose>
        {
          'Our real corpus has three classes. A point in the triangle has masses p₀+p₁+p₂=1. For (.1,.6,.3), the acceptable probability under the declared nonnegative rubric is p₁+p₂=.9, while strict-progress probability is p₂=.3. Neutral is a real target with its own mass. Treating it as missing discards information; treating it as positive progress changes the question.'
        }
      </Prose>

      <Prose>{'For target class y, three-way cross-entropy and its logit derivative are'}</Prose>

      <MathBlock>
        {
          '\\ell(z,y)=\\operatorname{logsumexp}(z)-z_y,\n\\qquad \\frac{\\partial\\ell}{\\partial z_c}=p_c-\\mathbf1[c=y].'
        }
      </MathBlock>

      <Prose>
        {
          'At the neutral target, (.1,.6,.3) gives derivative (.1,−.4,.3): raise the neutral logit and lower the other two under gradient descent. The program compares both loss families and gradients with PyTorch, checks finite differences, boundary alignment, reductions, missing targets and changed practice values.'
        }
      </Prose>

      <Program file="prm_contracts.py" />

      <CodeBlock language={'shell'}>{'python prm_contracts.py --output contracts.json'}</CodeBlock>

      <Prose>
        {
          'The worked invalid binary loss, three-class derivative and two different denominators are computed from their defining expressions. Passing these contracts establishes arithmetic and API correspondence; it does not establish the accuracy of a trained reward model.'
        }
      </Prose>

      <Old ids={['5-production-implementation']} />
      <H2>{'5. Fit and inspect actual labelled records'}</H2>

      <Prose>
        {
          'We now fit a complete small classifier on the actual retained records. It sees the question, earlier chosen steps and current alternative text. It does not see the future solution, answer key, verifier score, target or unique ID. The experiment is fixed before fitting, so a weak result remains visible.'
        }
      </Prose>

      <PRMRealCorpusStructure />

      <Prose>
        {
          'Sort exact UTF-8 problem hashes. From the upstream training prefix, use the first 96 eligible problems for training and the next 32 for validation. Use the first 48 eligible upstream-test problems for testing. Deduplicate exact problem/prefix/current-step/rating tuples, then keep the first 12 eligible examples per problem in source order. The resulting splits contain 918, 290 and 524 labelled examples. Their problem identities have no overlap.'
        }
      </Prose>

      <NeuralTable
        caption={'5. Fit and inspect actual labelled records'}
        headers={[
          <>{'Split'}</>,
          <>{'Problems'}</>,
          <>{'Examples'}</>,
          <>{'Invalid'}</>,
          <>{'Neutral'}</>,
          <>{'Progress'}</>,
        ]}
        rows={[
          [<>{'Train'}</>, <>{'96'}</>, <>{'918'}</>, <>{'194'}</>, <>{'137'}</>, <>{'587'}</>],
          [<>{'Validation'}</>, <>{'32'}</>, <>{'290'}</>, <>{'68'}</>, <>{'45'}</>, <>{'177'}</>],
          [<>{'Test'}</>, <>{'48'}</>, <>{'524'}</>, <>{'130'}</>, <>{'72'}</>, <>{'322'}</>],
        ]}
      />

      <Prose>
        {
          'The counts are examples, not independent problems. Siblings and steps within a problem share text and annotation context. Holding problems apart reduces one important form of leakage; it does not make these bounded prefixes representative of the full corpus. The cap favours earlier annotated steps. The original bytes, license, rejection counts, selected files and prospective protocol accompany the runnable study.'
        }
      </Prose>

      <PRMLearnedFeatureMap />

      <Prose>
        {'Our model turns text into a '}
        <strong>{'signed hashed lexical feature vector'}</strong>
        {
          ". Split text into word runs, numeric runs and non-whitespace symbols. SHA256 maps each lexeme to one of 512 buckets and a deterministic sign. Sum signed occurrences, then divide by the square root of that half's lexeme count. The question plus earlier steps occupies the first 512 coordinates; the current step occupies the next 512. Empty text contributes zeros."
        }
      </Prose>

      <Prose>
        {
          'Trace one lexeme from its spelling to its bucket and sign, then to the three class-weight columns. Several spellings can collide in a bucket. Reordering lexemes within one half does not change its vector. This model therefore reads the whole supplied prefix but loses its order. It has no built-in algebra parser, proof rules or pretrained mathematical knowledge. Separating halves lets it distinguish prior context from the proposed step; it does not restore the missing structure.'
        }
      </Prose>

      <Prose>
        {
          "For matrix X with one 1024-coordinate row per example, weights W of shape 1024×3 and bias b, logits are Z=XW+b. A stable softmax subtracts each row's maximum before exponentiation. Subtracting the maximum does not change its probabilities. The cross-entropy derivative gives Δ=(P−Y)/n for one-hot target rows Y and n training examples. With L2 coefficient λ=.001:"
        }
      </Prose>

      <MathBlock>
        {
          'L=\\frac1n\\sum_j\\ell_j+\\frac\\lambda2\\|W\\|_F^2,\n\\qquad \\nabla_WL=X^\\top\\Delta+\\lambda W,\n\\qquad \\nabla_bL=\\sum_j\\Delta_j.'
        }
      </MathBlock>

      <Prose>
        {
          'Initialize with NumPy seed 23, Gaussian weight standard deviation .01 and zero biases. Apply exactly 160 full-batch updates at learning rate .1. The final update is the result; no checkpoint or hyperparameter is selected on test outcomes. Save updates 0, 20, 40, 80 and 160 so we can distinguish training behaviour from held-out behaviour.'
        }
      </Prose>

      <PRMStudyResults />

      <Prose>
        {
          'Compare the test results on the same 524 examples. The prior baseline uses training class counts with Laplace-1 smoothing and supplies that same distribution to every test example. It predicts progress for every example.'
        }
      </Prose>

      <NeuralTable
        caption={'5. Fit and inspect actual labelled records'}
        headers={[
          <>{'Model'}</>,
          <>{'Accuracy'}</>,
          <>{'Mean CE, nats'}</>,
          <>{'Three-class Brier'}</>,
        ]}
        rows={[
          [<>{'Training-prior baseline'}</>, <>{'.614504'}</>, <>{'.921723'}</>, <>{'.544005'}</>],
          [<>{'Initialized classifier'}</>, <>{'.337786'}</>, <>{'1.100704'}</>, <>{'.668045'}</>],
          [<>{'Fitted update 160'}</>, <>{'.618321'}</>, <>{'.942385'}</>, <>{'.559909'}</>],
        ]}
      />

      <Prose>
        {
          'Cross-entropy measures assigned probability at the true class; Brier sums the three squared probability errors for each example and then averages examples. Lower is better for both. Accuracy counts only the largest-probability class. These are probability-quality measures, not pure tests of calibration alone: calibration asks whether stated probabilities match observed frequencies on the evaluated distribution, while distinguishing classes also affects them. The tiny accuracy increase corresponds to two additional correct predictions, but the fitted probabilities are worse than the prior on CE and Brier. Learning an imbalanced corpus is not automatically useful process judgment.'
        }
      </Prose>

      <Prose>
        {
          'The final test confusion matrix has true classes as rows and predicted classes as columns, ordered invalid, neutral, progress:'
        }
      </Prose>

      <NeuralTable
        caption={'5. Fit and inspect actual labelled records'}
        headers={[<>{'True / predicted'}</>, <>{'Invalid'}</>, <>{'Neutral'}</>, <>{'Progress'}</>]}
        rows={[
          [<>{'Invalid'}</>, <>{'15'}</>, <>{'0'}</>, <>{'115'}</>],
          [<>{'Neutral'}</>, <>{'1'}</>, <>{'0'}</>, <>{'71'}</>],
          [<>{'Progress'}</>, <>{'12'}</>, <>{'1'}</>, <>{'309'}</>],
        ]}
      />

      <Prose>
        {
          'It recognizes 15 of 130 invalid cases and zero of 72 neutral cases. The dominant progress class conceals that weakness if we report only accuracy. Training CE falls to .809677, while validation CE is .936392. This supports a limited conclusion: the declared lexical objective was optimized, but its features and corpus balance do not yield a strong reasoning verifier.'
        }
      </Prose>

      <PRMHeldoutInspector />

      <Prose>
        {
          'The first stable correct test case is upstream-test record 0, step 0, alternative 0. Its true class is progress; the model assigns (.200045,.210701,.589254). The next annotated step in that same record is neutral, but the model assigns (.213869,.208326,.577805) and predicts progress. Read the actual problem and both step texts, not just the scores. Editing the text reruns the exact saved feature map and final weights. The model is not retrained in the browser, and a changed probability is not a new ground-truth label. An empty edited step still has the question/prefix half; show that scope explicitly rather than claiming there is no input at all.'
        }
      </Prose>

      <Prose>
        {'Read the complete scratch program in four passes: '}
        <code>{'signed_features'}</code>
        {' and '}
        <code>{'features'}</code>
        {' define inputs; '}
        <code>{'objective_gradient'}</code>
        {' defines the trained function; '}
        <code>{'fit'}</code>
        {' applies the fixed update schedule; '}
        <code>{'metrics'}</code>
        {
          " and the exported predictions define the reported units. The results file includes source hashes and every split's checkpoints. The model file retains initialization, fitted weights and the selected correct/failure examples."
        }
      </Prose>

      <Program file="prm_classifier.py" />

      <CodeBlock language={'shell'}>
        {'python prm_classifier.py --data data --out new-study'}
      </CodeBlock>

      <Prose>
        {'The program refuses to overwrite an existing '}
        <code>{'results.json'}</code>
        {
          '. To inspect the retained experiment, read its saved files; running a new output directory is an explicitly separate fit. Change a protocol only as a new declared study, not by silently replacing these measurements.'
        }
      </Prose>

      <Prose>
        {'The ordinary-tool implementation uses '}
        <code>{'nn.Linear(1024,3)'}</code>
        {
          ', CE and SGD. PyTorch stores its weight as 3×1024, so copy the scratch W transposed. Match the same batch, initialization, regularization and mean reduction before comparing gradients and updates. A different reduction or regularized bias would be a different experiment.'
        }
      </Prose>

      <Program file="prm_torch.py" />

      <CodeBlock language={'shell'}>
        {'python prm_torch.py --data data --model study/model.json --output torch.json'}
      </CodeBlock>

      <Prose>
        {
          'The executed default checks a matched gradient/update, all-masked preservation and the retained fitted probabilities on all splits. It performs no second scientific fit. '
        }
        <code>{'--fit-out'}</code>
        {
          ' supplies a complete ordinary-tool training route for a separately requested run. Neither implementation proves semantic reasoning ability merely by agreeing numerically.'
        }
      </Prose>

      <Old ids={['6-visual-walkthrough']} />
      <H2>{'6. Turn many scores into one decision'}</H2>

      <Prose>
        {
          'A completed path has several step scores, but selecting one response needs a single ordering. The reduction defines what that ordering favours. A minimum asks about the weakest scored step. A product penalizes accumulating factors below 1. A mean asks about average score and can hide one weak step among many strong ones.'
        }
      </Prose>

      <PRMAggregationGeometry />

      <Prose>
        {
          "Compare A's two .9 scores with B's five .95 scores. Minimum and mean prefer B: .95 exceeds .9. The product prefers A: .9²=.81, while .95⁵=.7737809375. Every extra subunit factor reduces a product even when it is relatively high. A repeated harmless step can therefore change a ranking without changing the underlying answer. This length sensitivity belongs to the chosen reduction; it is not evidence that the new step is wrong."
        }
      </Prose>

      <Prose>{'For nonempty probabilities p₁ through pT, the reductions are'}</Prose>

      <MathBlock>
        {
          'S_{\\min}=\\min_i p_i,\\qquad S_{\\text{mean}}=\\frac1T\\sum_i p_i,\n\\qquad S_{\\text{product}}=\\prod_i p_i,\n\\qquad S_{\\log}=\\sum_i\\log p_i.'
        }
      </MathBlock>

      <Prose>
        {
          'Log-product preserves product ordering while avoiding numerical underflow for long paths. An exact zero gives −∞; it must not silently become a finite score unless a declared smoothing rule changes the function. An empty path does not supply evidence of correctness. Our API returns unknown rather than calling its empty product 1 a verified solution.'
        }
      </Prose>

      <Prose>
        {
          'When does a product mean a joint correctness probability? Let Cᵢ denote the event that step i is valid. The probability chain rule requires each factor to estimate correctness conditional on all earlier validity events and the relevant supplied context:'
        }
      </Prose>

      <MathBlock>
        {'P(C_1,\\ldots,C_T\\mid x,s_{1:T})\n=\\prod_i P(C_i\\mid C_{<i},x,s_{1:T}).'}
      </MathBlock>

      <Prose>
        {
          'Our causal scores see only s≤ᵢ. Interpreting them as those full-trace conditional factors additionally assumes that later text adds no relevant information for that validity judgment. Training on selected known-valid prefixes is compatible with a local causal question, but does not itself establish calibration or this joint-distribution identity. The chain rule does not require independent steps. Multiplying cumulative-prefix probabilities would instead count earlier validity repeatedly. Minimum and mean have their own heuristic interpretations; neither derives that joint probability.'
        }
      </Prose>

      <Prose>
        {
          "Lightman's PRM uses product ranking; Math-Shepherd uses minimum. These are source-specific choices, not two spellings of the same probability. Select a reduction on validation data under the intended downstream metric and report its length and neutral-label policy. The complete "
        }
        <code>{'aggregate'}</code>
        {' function in '}
        <code>{'prm_contracts.py'}</code>
        {' exposes all four routes and their edge cases.'}
      </Prose>

      <Old ids={['7-decision-matrix']} />
      <H2>{'7. Rank a fixed candidate pool'}</H2>

      <Prose>
        {
          'Suppose a generator has already produced six candidate solutions. Each has a written path, terminal answer and declared step scores. Reranking chooses from this fixed pool. It cannot create a correct solution that is absent.'
        }
      </Prose>

      <PRMCandidateForest />

      <Prose>
        {
          "In our finite fixture, product ranking puts C first even though its answer 4 is wrong: its two scores .99 and .98 multiply to .9702. A's product is .81; B's is .87514. Summing product weights for repeated answers instead selects answer 3, which receives A, B and F's combined support. These scores are constructed to show differing decisions, not produced by our weak lexical model. Candidate identities remain coloured; a selected outline is distinct from the terminal checker's correct/incorrect mark."
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Best-of-N'}</strong>
        {' selects the highest-scored candidate from N generated candidates. '}
        <strong>{'Weighted voting'}</strong>
        {
          ' groups equivalent answers and adds their candidate weights. The grouping operation requires an answer parser or equivalence checker; a string-normalization rule is not general mathematical equivalence. '
        }
        <strong>{'Oracle pool success'}</strong>
        {
          ' asks whether any candidate has a correct answer. It measures available opportunity, not how often the scorer realizes it. Our N control reveals the first N entries of a fixed pool; it performs no new generation. Exact score ties keep the lower original index.'
        }
      </Prose>

      <Prose>
        {
          "Ranking and voting use different operations. Taking logs preserves each candidate's product ordering; "
        }
        <strong>{'adding those negative logs does not preserve the answer vote'}</strong>
        {'. For log-product input, '}
        <code>{'vote_masses'}</code>
        {
          ' subtracts the largest finite log score from every log score, then exponentiates. These nonnegative relative masses share one common scaling factor, so adding them selects the same answer as adding the original product masses without underflowing all long paths to zero. A path with log score −∞ receives zero mass. With an empty pool or only zero masses, the vote is unknown.'
        }
      </Prose>

      <Prose>
        {
          'For this pool, product voting assigns answer 3 mass 2.49514 and answer 4 mass 1.7202. Log-product ranking still selects C, and equivalent relative-mass voting still selects 3. The output explicitly labels those weights '
        }
        <code>{'relative_product_mass'}</code>
        {
          '; they are proportional weights, not the unscaled product probabilities. Minimum and mean voting use their own nonnegative heuristic scores directly.'
        }
      </Prose>

      <PRMEvaluationDenominators />

      <Prose>
        {
          'Now inspect a different evaluation question: where is the first error? We predict the first acceptable-step score below a threshold fixed on validation, or −1 when none is below it. A missing earlier label can prevent a known ground-truth location; exclude that case from exact localization and report its exclusion. Never tune the threshold on the final benchmark.'
        }
      </Prose>

      <Prose>
        {
          'ProcessBench reports the harmonic mean of two group accuracies: exact first- error localization on erroneous solutions and all-correct detection on correct solutions. For 3/4 and 2/3, the value is'
        }
      </Prose>

      <MathBlock>
        {'H=\\frac{2ab}{a+b}=\\frac{12}{17}\\approx .705882,\n\\quad a=\\frac34,\\quad b=\\frac23.'}
      </MathBlock>

      <Prose>
        {
          'The paper calls this F1, but it is not the usual confusion-matrix precision/ recall F1. A model can select correct final answers while locating errors poorly. Boundary CE, probability calibration, answer-selection success and error localization must remain separate. If either group is absent, this two-group harmonic metric is undefined. If both groups exist and both accuracies are zero, our declared convention returns zero.'
        }
      </Prose>

      <PRMCoverageAndAbstention />

      <Prose>
        {
          'An abstaining model also changes its denominator. Raising a threshold can exclude difficult cases and improve accepted-case accuracy while reducing coverage. Report accepted count, total count, coverage and conditional accuracy together. With zero accepted cases, conditional accuracy is unknown, not 100%. Confidence is a model output; it is not automatically a calibrated probability of downstream correctness.'
        }
      </Prose>

      <Prose>
        {
          'The full search program implements fixed-pool ranking/voting/oracle coverage, localization and abstention as well as the complete trees in section 9. Read '
        }
        <code>{'rank_pool'}</code>
        {
          ' first: it scores the supplied entries, sorts with a stable tie rule, groups answer weights and reports separate oracle coverage. These operations do not update neural parameters or invent additional candidates.'
        }
      </Prose>

      <Program file="prm_search.py" />

      <CodeBlock language={'shell'}>{'python prm_search.py --output search.json'}</CodeBlock>

      <Prose>
        {
          "For a published comparison, Lightman et al.'s large-scale evaluation reports the following final-answer selection rates over 500 held-out MATH problems, with 1,860 candidates per problem:"
        }
      </Prose>

      <NeuralTable
        caption={'7. Rank a fixed candidate pool'}
        headers={[<>{'Selection method'}</>, <>{'Solved'}</>]}
        rows={[
          [<>{'ORM best-of-1,860'}</>, <>{'72.4%'}</>],
          [<>{'PRM best-of-1,860'}</>, <>{'78.2%'}</>],
          [<>{'Majority voting'}</>, <>{'69.6%'}</>],
        ]}
      />

      <Prose>
        {
          "These are published results, not our experiment. The generator stays fixed; this is reranking rather than generator RL. Their large-scale training sets differ in size and collection strategy, so the table is not an isolated supervision-only causal comparison. The paper's small-scale experiments address those confounds more directly. Our lexical classifier and six-path fixture cannot reproduce that benchmark or justify a universal PRM advantage. "
        }
        <a href={'https://arxiv.org/html/2305.20050v1'}>{'Lightman methods and comparison'}</a>
        {'.'}
      </Prose>

      <H2>{'8. Estimate future success with rollouts'}</H2>

      <Prose>
        {
          'Human local-step labels are costly. Another route asks a completer to continue from a prefix and checks the resulting answers. A '
        }
        <strong>{'rollout'}</strong>
        {
          ' is one such continuation. Its outcome estimates whether that completer can finish successfully from the prefix, rather than directly judging the current step.'
        }
      </Prose>

      <PRMCompletionTree />

      <Prose>
        {
          'Trace the eight branches in the drawing. Exactly one reaches a checker-success leaf. The hard estimate, “did any succeed?”, is 1. The soft estimate, “what fraction succeeded?”, is 1/8=.125. Neither says every earlier step was valid. A completer may repair an erroneous prefix, or fail despite a valid prefix. Changing the completer can change the estimate while the original text stays the same.'
        }
      </Prose>

      <Prose>
        {
          "For fixed completer policy μ, write Vμ(s) for the probability of eventual checker success from prefix state s. A policy is the conditional distribution used to choose the next action at each state; here it is the completer's continuation rule. With K independent completions and k successes:"
        }
      </Prose>

      <MathBlock>
        {'\\widehat V=\\frac{k}{K},\\qquad \\mathrm{HE}=\\mathbf1[k>0],\\qquad K>0.'}
      </MathBlock>

      <Prose>
        {
          "Math-Shepherd uses continuation-based hard/soft estimation to build automated process supervision and also studies stepwise policy optimization. Its labels have this future-success dependence; they are not a human local-proof oracle. Our explicit finite completer demonstrates the estimator, not the paper's large-model data construction or training results."
        }
      </Prose>

      <PRMEstimatorSampling />

      <Prose>
        {
          'If the true success probability is .1 and K=8 independent draws, the probability of at least one success is '
        }
        <code>{'1−.9⁸=.56953279'}</code>
        {
          '. A hard label therefore becomes positive much more often than the underlying success probability .1. The soft estimate has expectation .1 and variance '
        }
        <code>{'.1×.9/8=.01125'}</code>
        {
          '. More draws reduce its sampling variance under these assumptions; they also cost more generation and checking.'
        }
      </Prose>

      <MathBlock>
        {
          'P(\\mathrm{HE}=1)=1-(1-V)^K,\n\\qquad \\mathbb E[\\widehat V]=V,\n\\qquad \\operatorname{Var}(\\widehat V)=\\frac{V(1-V)}{K}.'
        }
      </MathBlock>

      <Prose>
        {
          'The independent Bernoulli model supplies these formulas. Correlated decoding, shared judge errors or a changing completer can violate that model. K=0 supplies no estimate. An observed fraction is neither a calibrated posterior nor a guaranteed error-free label.'
        }
      </Prose>

      <PRMConsensusAddresses />

      <Prose>
        {
          "A second judge can provide a complementary first-error estimate for the same full trajectory. In our fixture, two of five addresses agree, one disagrees and two have missing judgments. Retain the two agreements only if that is the declared filtering rule; report all five counts. The judge and rollout must address the same trajectory and indexing convention. Agreement on different prefixes or shifted indices has no useful interpretation. Consensus can filter disagreement while retaining shared errors and changing the selected distribution. Qwen's PRM work studies this correctness/value distinction and consensus route; agreement is not a proof of truth."
        }
      </Prose>

      <Prose>
        {'Read '}
        <code>{'estimates'}</code>
        {', '}
        <code>{'binomial'}</code>
        {', '}
        <code>{'sampled_completions'}</code>
        {' and '}
        <code>{'consensus'}</code>
        {
          ' in the complete program. The exact binomial calculation enumerates possible success counts; the seeded sampler supplies a concrete finite draw. The later functions use the same state/action vocabulary for reward credit and shaping.'
        }
      </Prose>

      <Program file="prm_rollouts_rewards.py" />

      <CodeBlock language={'shell'}>
        {'python prm_rollouts_rewards.py --output rewards.json'}
      </CodeBlock>

      <H2>{'9. Search before the answer is finished'}</H2>

      <Prose>
        {
          'Reranking waits for complete candidates. Search can inspect partial prefixes, expand promising ones and stop spending work on others. A prefix score can guide that decision only if its target matches the decision: local validity, cumulative validity and future success are different quantities.'
        }
      </Prose>

      <PRMBeamTree />

      <Prose>
        {
          "Our rooted tree has children A and B with local scores .6 and .9. A can reach correct leaf A1 with next score .95, or incorrect A2 with .4. B's two terminal leaves are incorrect and have next scores .5 and .4. Product-scored beam width 1 keeps only B at the first layer. It scores four nodes in total and selects B1, product .45. A1 is unreachable because its parent was pruned."
        }
      </Prose>

      <Prose>
        {
          "Width 2 keeps both parents, scores six nodes in total and can select A1, product .57. This constructed improvement comes from preserving a correct branch whose initial score was weak; wider search is not guaranteed to improve a flawed scorer on every tree. Using our supplied continuation-value scores instead of local product scores makes a different decision even at width 1. Those supplied value scores are constructed estimates, not exact averages over this finite tree: B's estimate .2 is wrong because both shown leaves fail. A changed scoring target is not a guarantee of an accurate predictor. The drawing follows literal parent-child edges and labels pruned branches; an unreachable leaf cannot be counted as a generated candidate."
        }
      </Prose>

      <Prose>
        {
          'A beam retains up to B partial paths per depth. It expands their children, scores them and keeps the best B under the declared tie rule. Store complete terminal paths separately so a finished solution is not expanded again. Depth zero produces no completed answer. In '
        }
        <code>{'beam'}</code>
        {
          ', every layer records its scored nodes, kept names and pruned names; the receipt counts actual work.'
        }
      </Prose>

      <Prose>
        {
          'With branching factor b and depth D, later layers score at most B×b nodes each, so expansion work is bounded by that layer budget. Head scoring, model prefill, decoding and checker work have additional costs. Selecting B items with a heap costs O(n log B) for n scored entries; full sorting costs O(n log n). Count completed candidates and scored partial nodes separately.'
        }
      </Prose>

      <PRMVisitTree />

      <Prose>
        {
          "Monte Carlo tree search allocates visits adaptively. In our generic UCT demonstration, an unvisited child is chosen first with a stable name tie-break. For visited children, selection balances mean observed reward against an exploration term. Then the algorithm expands a node, samples a continuation to a terminal checker reward and adds that reward to the selected ancestors' return sums and visit counts."
        }
      </Prose>

      <Prose>{'For child j with visits nⱼ, return sum Sⱼ and parent visits N:'}</Prose>

      <MathBlock>
        {'\\operatorname{UCT}_j=\\frac{S_j}{n_j}\n+c\\sqrt{\\frac{\\log N}{n_j}},\\qquad n_j>0.'}
      </MathBlock>

      <Prose>
        {
          'The first term exploits observed reward; the second prioritizes relatively underexplored children. c is a chosen exploration coefficient. Unvisited children need the explicit rule because division by zero is not a valid score. A '
        }
        <strong>{'backup'}</strong>
        {
          " here updates tree statistics. It is not gradient backpropagation and changes no neural weights. Our first rollout can traverse nodes not yet added to the search tree; only the selected/expanded path gets that simulation's backup. The complete program records both paths separately."
        }
      </Prose>

      <Prose>
        {
          'In the executed seed-19 trace, simulation 1 selects only root, rolls out A→A1 and receives 1: root has visits 1/return-sum 1, while A was only in the rollout. Simulation 2 selects root→A, rolls out A1 and backs up 1: root has 2/2 and A has 1/1. Simulation 3 selects unvisited B, rolls out B2 and receives 0: root becomes 3/2 and B 1/0. These are visits/return sums, not probabilities or gradient updates. Later selection uses their means and exploration terms.'
        }
      </Prose>

      <Prose>
        {
          'ReST-MCTS* is a named search/self-training method with its own search-derived quality targets and training procedure. It is not identical to our plain UCT function. Read its method before treating a generic tree demonstration as a reproduction. Search can provide candidate traces and labels for later training; that subsequent optimization is another operation with another budget.'
        }
      </Prose>

      <H2>{'10. Distinguish promise from progress'}</H2>

      <Prose>
        {
          'A state s is the visible question and current prefix. An action a is one proposed next step. Under a fixed completer μ, Vμ(s) measures future success before the action; Qμ(s,a) measures future success after choosing that action and then continuing with μ. The '
        }
        <strong>{'advantage'}</strong>
        {
          " Aμ(s,a)=Qμ(s,a)−Vμ(s) measures the change relative to the completer's expected baseline at that state."
        }
      </Prose>

      <PRMValueAdvantageGeometry />

      <Prose>
        {
          "Read both complete parent branches. At A's state, μ chooses two children equally with values .75 and .85, so the parent value is .8. Choosing the .75 child gives advantage −.05. At B's state, equally likely children have values .4 and 0, so the parent value is .2. Choosing .4 gives advantage +.2. A's selected child is more promising in absolute value; B's selected child makes more progress relative to its starting state."
        }
      </Prose>

      <Prose>
        {
          "The displayed ranking illustration combines Q+αA for this fixed policy. A's score is .75−.05α; B's is .4+.2α. They tie at α=1.4, and B wins above it. This combination deliberately changes the question. A positive advantage need not be a locally valid algebraic step, and a negative advantage need not be false. Its meaning depends on the completer, available alternatives and checker."
        }
      </Prose>

      <MathBlock>
        {'V^\\mu(s)=\\sum_a\\mu(a\\mid s)Q^\\mu(s,a),\n\\qquad A^\\mu(s,a)=Q^\\mu(s,a)-V^\\mu(s).'}
      </MathBlock>

      <Prose>
        {
          'The parent values are actual probability-weighted averages in this fixture, not independently assigned bars. Changing μ changes those averages. Missing continuations must not be treated as known zero-value actions unless that failure outcome is explicitly part of the environment.'
        }
      </Prose>

      <PRMProverContrast />

      <Prose>
        {
          'A prover can also be stronger through search. An oracle best-of-K completer with independent per-draw success q succeeds with probability '
        }
        <code>{'1−(1−q)^K'}</code>
        {
          '. This transformation saturates near 1: prefixes whose single-draw values .9 and .95 differ visibly can both become almost certain under a large oracle budget. It changes progress contrasts, costs and which errors the prover distinguishes. A useful prover must supply complementary information; “make it strongest” is not a complete recipe. The oracle assumption itself is unrealistic when a learned selector can misrank successes.'
        }
      </Prose>

      <Prose>
        {
          'Rewarding Progress distinguishes base-policy value Qπ from a prover-policy advantage Aμ. We introduced one-policy averages first so these two roles now have meaning. The source studies when such a prover supplies useful extra credit. Its idealized guarantees have explicit policy, optimization and oracle assumptions; they do not promise every PRM score improves every language model. '
        }
        <a href={'https://arxiv.org/html/2410.08146v1'}>{'Rewarding Progress'}</a>
        {'.'}
      </Prose>

      <H2>{'11. Use rewards without silently changing the goal'}</H2>

      <Prose>
        {
          'A learned label predictor and the objective optimized by a generator are different functions. We can train a classifier well and still optimize a misleading proxy. First examine terminal outcome credit on a complete finite policy, then compare a carefully defined shaping rule.'
        }
      </Prose>

      <PRMPolicyCredit />

      <Prose>
        {
          'The first action selects A with probability q=.6 and B with .4. At A, the second decision succeeds with pA=.8; at B, with pB=.2. Four leaf masses are .48, .12, .08 and .32, with rewards 1, 0, 1 and 0. Their expected terminal reward is .48+.08=.56. Every action probability comes from its own logit.'
        }
      </Prose>

      <Prose>
        {
          'On the successful A trajectory, terminal return 1 multiplies both selected action score derivatives. The first derivative is 1−q=.4; the second is 1−pA=.2. The common return does not imply identical parameter contributions. Enumerating all four leaves gives expected logit derivatives .144, .096 and .064 for q, pA and pB. Ordinary Torch differentiation of q pA+(1−q)pB, with probabilities supplied by logits, agrees with that enumeration.'
        }
      </Prose>

      <Prose>{'For terminal objective J=Eπ[R] and trajectory action probabilities π:'}</Prose>

      <MathBlock>
        {'\\nabla J=\\mathbb E_\\pi\\left[\\sum_i\\nabla\\log\\pi(a_i\\mid s_i)R\\right].'}
      </MathBlock>

      <Prose>
        {
          "This is the likelihood-ratio identity: differentiating each trajectory's probability supplies its action log-probability derivatives. If immediate rewards rⱼ arrive along the path, the action at i can use its subsequent discounted return Gᵢ=Σⱼ≥ᵢγʲ⁻ⁱrⱼ. Earlier rewards disappear from the expected score contribution because the action cannot affect them. That argument does not justify replacing Gᵢ with any locally pleasing correctness score."
        }
      </Prose>

      <Prose>
        {
          'Keep the time discount when the objective is a discounted episode return. With action indices starting at 0, Jγ=E[Σⱼγʲrⱼ] gives ∇Jγ=E[Σᵢγⁱ∇logπ(aᵢ|sᵢ)Gᵢ]. The leading γⁱ accounts for when action i occurred; it is not removed merely by rewriting future rewards relative to that action. Our four-leaf terminal example is undiscounted (γ=1), so that factor is 1.'
        }
      </Prose>

      <Prose>
        {
          'An action-independent state baseline b(sᵢ) has zero expected score contribution at that state. Our finite enumeration checks that subtraction preserves the expected gradient. A baseline can change estimator variance; the present calculation does not prove universal variance reduction or sample efficiency. Such claims require the actual correlated trajectory and estimator model.'
        }
      </Prose>

      <PRMRewardTelescoping />

      <Prose>
        {
          'Suppose a state potential Φ assigns levels .2, .5, .9 and 0 along a three-action episode. A '
        }
        <strong>{'potential-shaped bonus'}</strong>
        {
          ' is γΦ(next)−Φ(current). With γ=.9, its bonuses are .25, .31 and −.9. Discounting gives .25+.279−.729=−.2. The last negative bonus is essential: omit it and the sum becomes .529.'
        }
      </Prose>

      <MathBlock>
        {
          'F_i=\\gamma\\Phi(s_{i+1})-\\Phi(s_i),\n\\qquad\\sum_{i=0}^{T-1}\\gamma^iF_i=-\\Phi(s_0)+\\gamma^T\\Phi(s_T).'
        }
      </MathBlock>

      <Prose>
        {
          "Under the declared finite episodic setting, fixed initial state and zero terminal potential, this adds an action-independent constant to return. It preserves the original objective ordering. Keep the original discount and terminal handling. Raw positive local-validity rewards do not obey that identity. If equally correct two-step and four-step paths receive +.1 per step, the longer path gets .4 instead of .2; repeating a harmless statement can increase the proxy without improving the answer. Nonzero terminal potential can likewise change the ordering. Ng et al.'s shaping result requires its stated environment/discount conditions; the telescope explains our finite example's guarantee."
        }
      </Prose>

      <Prose>
        {
          'The PAV surrogate is a different construction. At a matching current iterate, freeze the old state visitation and prover advantages, then add an action- choice term to the outcome objective:'
        }
      </Prose>

      <MathBlock>
        {
          'J_{\\text{sur}}(\\pi)=J(\\pi)\n+\\alpha\\sum_t\\mathbb E_{s\\sim d_t^{\\pi_{old}}}\n\\mathbb E_{a\\sim\\pi(\\cdot\\mid s)}[A^\\mu(s,a)].'
        }
      </MathBlock>

      <Prose>
        {
          'Here dₜ is the probability distribution over states visited at time t by the old policy; Aμ is held fixed while differentiating. When old equals current, the effective action credit is Qπ+αAμ under matching visitation. Away from that iterate, the old occupancy weighting differs. This is not a global equality for arbitrary old/current policies, nor the same as adding Aμ to every future return and claiming potential-shaping invariance.'
        }
      </Prose>

      <Prose>
        {
          "Using one's own advantage at that iterate gives the outcome-gradient direction up to a positive scale; it need not produce the identical optimizer step. Our finite one-state check with α=.5 scales .144 to .216. A separate prover can change the direction because its advantage can distinguish actions differently. The value/progress distinction, frozen terms and visitation conditions matter before any named-method guarantee is invoked."
        }
      </Prose>

      <Prose>
        {'The complete '}
        <code>{'prm_rollouts_rewards.py'}</code>
        {
          ' enumerates leaf masses and gradient contributions, checks a state baseline, computes the potential telescope and compares the local own-advantage surrogate with autograd. It does not fit a generator or claim a measured policy improvement.'
        }
      </Prose>

      <Old ids={['8-what-scales-and-what-doesn-t', '9-failure-modes-and-gotchas']} />
      <H2>{'12. Budget and attack the proxy'}</H2>

      <Prose>
        {
          "Sparse boundary labels do not make the backbone free. The scorer still reads the prefix needed to produce each boundary's vector. Batching many candidates can improve hardware use but changes neither what is being scored nor whether its target is sound."
        }
      </Prose>

      <PRMWorkLedger />

      <Prose>
        {
          'Keep counts in their own units. Our corpus has 918 training examples from 96 problems. Each selected alternative supplies one class target, but its prefix can contain many tokens and earlier steps. The lexical model has 1024×3+3=3,075 parameters. The random Transformers contract uses a separate byte vocabulary and small contextual backbone. None of these counts equals an annotation hour, generated candidate, completion or policy update.'
        }
      </Prose>

      <Prose>
        {
          'For M boundaries, hidden width d and C classes, head projection costs O(MdC). Trajectory reductions cost O(T) for T steps. Generator decoding, scorer backbone work, checker calls, annotation and search statistics require separate counters. Increasing a rollout budget K increases continuations and checks; it does not create more original prefixes. Shared causal-prefix KV reuse can reduce repeated prefill while retaining corresponding cache memory. Truncation can save computation while removing evidence or targets; report that loss. Use the declared tokenizer for token counts, not a word-count guess.'
        }
      </Prose>

      <PRMProxyFailure />

      <Prose>
        {
          'Try five concrete failure probes. First, assert the correct final answer after a wrong expansion: the outcome check can pass while the process fails. Second, divide '
        }
        <code>{'x(x+1)=0'}</code>
        {
          ' by x: a response returning only −1 loses solution 0. Third, repeat a valid equation: local validity may remain high while progress vanishes, and a raw dense reward may favour the extra length. Fourth, give a correct answer in a format the parser rejects: a checker failure need not imply a reasoning failure. Fifth, stop annotations after the first error: missing suffix labels must remain unknown rather than invented negatives or positives.'
        }
      </Prose>

      <Prose>
        {
          "Our lexical study adds a sixth warning: superficial familiar expressions and class frequencies can dominate a model that has no structural proof input. Inspect failures at new problems, unusual transformations and new lengths. Training on one generator's traces and optimizing another generator can shift the distribution. Optimization may preferentially discover high-scoring mistakes; passive test accuracy does not settle that behaviour."
        }
      </Prose>

      <Prose>
        {
          'Active annotation can prioritize uncertain or disputed examples. The provided priority fixture computes class entropy and adds a declared disagreement bonus, then sorts with a stable index tie-break. It requests labels; it does not convert uncertainty into truth. Selection changes the dataset distribution and deserves its own retained counts and held-out evaluation.'
        }
      </Prose>

      <Prose>
        {
          'For the constructed masses (.9,.05,.05), (1/3,1/3,1/3) and (.2,.4,.4), entropy −Σp ln p is about .394, 1.099 and 1.055. Adding a disagreement bonus 1 to only the third case makes it first priority at 2.055. The ranking is a declared annotation heuristic, not a new target. '
        }
        <code>{'proxy_failures'}</code>
        {
          ' separately computes the omitted-root, length-bonus, parser and missing-mask fixtures so the failure objects can be inspected directly.'
        }
      </Prose>

      <Prose>
        {
          'Dense process-based policy optimization has been studied, including Math-Shepherd and PAV. DeepSeek-R1 reports a specific unsuccessful PRM route and practical difficulties; it does not prove process RL impossible. Likewise, a verifiable outcome reward is only as reliable as its checker coverage. Evaluate the actual proxy, optimization method, task and budget rather than granting either reward type universal immunity to exploitation.'
        }
      </Prose>
      <Old ids={['11-self-check-exercises']} />
      <H2>{'13. Practice and resources'}</H2>
      <Prose>
        {
          'Use new inputs to test the contracts. Each solution is instructional; the complete programs are available to modify and inspect.'
        }
      </Prose>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'1. Repair a lost solution'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {' A candidate solves '}
          <code>{'x(x−2)=0'}</code>
          {
            ' by dividing by x and reports only 2. Where is the error and what can a final-answer checker miss?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Check whether the divisor can be zero.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Dividing by x excludes x=0 without justification. The solution set is {0,2}; both satisfy the original equation. A checker accepting one valid root may accept 2 while missing the incomplete set. Label the division under the step rubric and evaluate the completed answer under a set-completeness criterion. These are different checks.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'2. Preserve unknowns'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' Four steps have progress, neutral, invalid and unannotated labels. Give local targets, acceptable targets, cumulative targets and a mask.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Missing is not neutral; a known invalid prefix stays invalid.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              " Local classes are [2,1,0,unknown] with mask [1,1,1,0]. Under the nonnegative acceptable rubric, targets are [1,1,0,unknown]. For cumulative prefix validity, [1,1,0,0] is justified if the third step establishes an invalid prefix under that convention; the fourth's own local label is still unknown. If the dataset records only first-error local labels, do not manufacture that fourth cumulative target as a local annotation."
            }
          </Prose>

          <Prose>
            {
              "The statement “all steps so far are valid” is already false after the known invalid third step, regardless of the fourth step's local status. A later repaired answer does not make the historical prefix valid."
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'3. Align a longer sequence'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {' For '}
          <code>{'Q a SEP b c SEP PAD'}</code>
          {
            ', locate class targets and visible prefixes. How would causal LM target alignment differ?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Count positions from zero and attach the class after its current step.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Separators are at 2 and 5, so there are two eligible class targets. Boundary 2 sees positions 0–2; boundary 5 sees 0–5. PAD at 6 is excluded. Classification labels use logits at positions 2 and 5. A causal LM predicts the next token from each earlier position, pairing logits at t with token target at t+1. Applying that shift to these class labels would misalign the task.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'4. Reverse the binary gradient'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' With acceptable probability .25 and target 1, derive the loss and logit derivative. Explain a two-boundary mean and an all-masked update.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Use −ln p and p−c.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Loss is ln4≈1.386294; derivative is .25−1=−.75. Descent raises the logit. If two eligible boundary losses are averaged, each logit derivative is divided by 2 before routing through its parameters. If neither boundary is eligible, the denominator is zero and the update is skipped. Do not call that undefined mean a zero loss.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'5. Read the neutral simplex'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' Masses are (.1,.6,.3), ordered invalid/neutral/progress. Compute acceptable and strict-progress scores, then the neutral-target logit gradient.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Subtract the one-hot target from the probability row.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Acceptable is .6+.3=.9; strict progress is .3. CE gradient is (.1,.6−1,.3)=(.1,−.4,.3). Its components sum to zero. The target raises neutral relative to the other logits without declaring neutral useful progress.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'6. Find a length-induced reversal'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {' Compare A=(.8,.8) with B=(.9,.9,.9,.9). Add one .9 step to B.'}
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Recompute products separately from minima and means.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              " A's product is .64; B's four-step product is .6561, so B initially wins. Five steps give .59049, so A wins. Minimum/mean remain .8 versus .9 and still prefer B. Log-product has the product ordering. The reversal reflects the reduction's length sensitivity, not a newly observed invalid step."
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'7. Interpret two successes'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' Two of six completer draws succeed. Give HE and SE. What does a zero budget mean, and can a wrong prefix still get a positive estimate?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' The checker grades the continued answer, not every prior step.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' HE=1 and SE=2/6=1/3. At K=0 both are unknown. A completer may repair the prefix and then pass the checker, so positive future-success evidence does not prove earlier local validity. Under independent draws with true value V, the soft variance is V(1−V)/6; substituting 1/3 is only a plug-in estimate, not knowledge of V.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'8. Keep the evaluation denominator'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' Error localization is 2/5; all-correct detection is 3/4. Compute the ProcessBench-style harmonic metric and handle an absent group.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Use the harmonic mean of the two group accuracies.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' H=2×(2/5)×(3/4)/((2/5)+(3/4))=12/23≈.521739. This combines two group accuracies, not standard binary precision and recall. If either group has zero cases, its accuracy and H are undefined. Report counts rather than borrowing a score from final-answer selection.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'9. Count the erroneous prune'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            " Change the finite beam's first local scores to A=.55 and B=.85, keeping later scores A1=.95,A2=.4,B1=.5,B2=.4. Trace widths 1 and 2."
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' A pruned parent never generates its children.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Width 1 keeps B, scores its two leaves and selects B1 with .425; four nodes were scored and the correct A1 was never generated. Width 2 keeps A/B, scores four leaves and selects A1 with .5225; six nodes were scored. The extra work preserves a low-scored correct branch. A different tree/scorer can still fail at width 2; this is a concrete counterexample, not a monotonic performance theorem.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'10. Verify parent averages and progress'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            " Parent values are .7 and .1; selected children .6 and .35. Parent A's other child is .8 with equal probabilities. At parent B, μ chooses .35 with probability 2/7 and zero otherwise. Find advantages and the crossover."
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Compute each parent average before subtracting.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' A averages (.6+.8)/2=.7; B averages .35×2/7=.1. Advantages are −.1 and +.25. Scores .6−.1α and .35+.25α tie when .25=.35α, or α=5/7. This verifies the parents rather than assuming unrelated value bars.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'11. Enumerate new policy credit'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {' Use q=.5,pA=.9,pB=.1. Derive expected return and three logit gradients.'}
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Differentiate probabilities through their own sigmoid logits.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Leaf masses are .45,.05,.05,.45; successful mass is .5. The q-logit derivative is q(1−q)(pA−pB)=.25×.8=.2. The pA-logit derivative is q pA(1−pA)=.5×.9×.1=.045; the pB derivative is (1−q)pB(1−pB)=.045. A state-only baseline contributes zero expected action score. A common terminal return supplies distinct action derivatives, not identical updates.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'12. Keep the terminal shaping term'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' Potentials are (.4,.6,0), γ=1. Derive the bonuses and compare raw +.1 rewards on two-step and four-step equally correct paths.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Include the transition into the terminal state.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Potential bonuses are +.2 and −.6, totaling −.4. Omitting the last gives +.2 and changes the objective. With fixed initial state and zero terminal potential, the full total is an action-independent constant. Raw local rewards instead add .2 versus .4, favouring the longer path. That raw length incentive is outside the potential guarantee.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'13. Extract a new sibling safely'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            " Choose a retained record other than record 0. Print one sibling step's source addresses and prefixes, then test the continuation and split invariants."
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Compare arrays, not only string lengths.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Run '}
            <code>{'prm_records.py'}</code>
            {' on the supplied files and inspect examples sharing source record/step. Their '}
            <code>{'prefix_steps'}</code>
            {
              ' arrays must be identical; their current text and alternative index can differ. For a subsequent step, the appended text must equal the preceding chosen completion, not the full alternative list. Compare the three selected '
            }
            <code>{'problem_id'}</code>
            {
              ' sets: all pairwise intersections must be empty. The program retains the exact tuples, source addresses and hashes needed to assert these properties. A first-error suffix or missing continuation must not acquire an invented label.'
            }
          </Prose>

          <Prose>
            {
              'As a concrete new record, upstream-test record 156, step 5 has four retained sibling alternatives (indices 0–3). Each has the same five earlier chosen steps and each has upstream rating −1, mapped to class 0. One writes '
            }
            <code>{'a⁴+b⁸=(a⁴+a⁴+b⁸+b⁸)/4'}</code>
            {
              ', which halves the claimed sum. The other alternatives do not become its continuation. Their source addresses and shared prefix provide a direct test case; the absence of a subsequent chosen continuation must not be repaired by guessing from those siblings.'
            }
          </Prose>
        </details>
      </section>
      <section className="prm-practice" data-lesson-exercise>
        <H3>{'14. Diagnose incompatible successes'}</H3>

        <Prose>
          {''}
          <strong>{'Task.'}</strong>
          {
            ' A model selects correct final answers but misses earliest errors. Propose a held-out investigation without merging the metrics.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {' Define targets, counts and generation/scoring budgets before comparing.'}
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              " Keep one fixed candidate pool per new problem and record the selected answer's checker result and oracle pool coverage. Separately evaluate fully labelled erroneous/all-correct traces with a validation-fixed threshold and report exact first-error accuracy, all-correct accuracy and their harmonic mean. Report boundary CE/Brier and accepted-case coverage when abstaining. Include wrong-process/right-answer, valid-then-failed, unusual-length and new-generator cases. Compare declared reductions and an outcome scorer under the same generator/candidate/checker budgets. Count scorer tokens, boundary targets and checker calls separately. Good answer selection may rely on a different signal from accurate process localization; the results need not agree."
            }
          </Prose>
        </details>
      </section>
      <H3>{'Further learning: inspect another route'}</H3>

      <Prose>
        {
          "Use Uesato's supervision comparison to redraw local and cumulative targets for one example before looking at its outcome scores. Use Lightman's appendix scoring alternatives to test whether one neutral/repeated step changes a path ranking. Use Ng's theorem conditions to identify exactly which term preserves or breaks the potential telescope. Each activity asks you to inspect a new representation rather than reuse only our defaults; the precise sources follow."
        }
      </Prose>

      <Old ids={['10-primary-sources']} />
      <H3>{'Technical references'}</H3>

      <ul>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2211.14275v1'}>
            {'Uesato et al., process and outcome feedback'}
          </a>
          {
            ': compare supervision targets and controlled mathematical reasoning outcomes. Its setting and labels differ from a universal PRM recipe.'
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2305.20050v1'}>
            {"Lightman et al., Let's Verify Step by Step"}
          </a>
          {' and '}
          <a href={'https://github.com/openai/prm800k'}>{'PRM800K'}</a>
          {
            ': inspect human labels, candidate ranking and the actual annotation schema before importing a corpus.'
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2312.08935v3'}>{'Math-Shepherd'}</a>
          {
            ': follow continuation-derived labels and its separate policy-optimization experiment. Local validity and future success remain distinct.'
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2501.07301v2'}>{"Qwen's PRM lessons"}</a>
          {' and '}
          <a href={'https://arxiv.org/html/2412.06559v1'}>{'ProcessBench'}</a>
          {
            ": study complementary process localization and value/correctness filtering. Check the metric's denominators."
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2410.08146v1'}>{'Rewarding Progress'}</a>
          {': examine prover advantages and the assumptions behind its optimization argument.'}
        </li>
        <li>
          {''}
          <a href={'https://ai.stanford.edu/~ang/papers/shaping-icml99.pdf'}>
            {'Ng, Harada and Russell, reward shaping'}
          </a>
          {
            ': inspect the potential form and episodic/discount conditions, not just the phrase “dense reward”.'
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2406.03816v3'}>{'ReST-MCTS*'}</a>
          {
            ': compare a complete named search/self-training system with our generic UCT demonstration.'
          }
        </li>
        <li>
          {''}
          <a href={'https://huggingface.co/Qwen/Qwen2.5-Math-PRM-7B'}>
            {'Official Qwen PRM model card'}
          </a>
          {
            ': check chat serialization, boundary tokens, head outputs and its model license before a pretrained deployment. Its printed values are published examples.'
          }
        </li>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2501.12948v1'}>{'DeepSeek-R1 limitations'}</a>
          {
            ': read the scoped PRM experiment difficulty without treating it as a universal impossibility.'
          }
        </li>
      </ul>

      <H3>{'Readiness and the next question'}</H3>

      <Prose>
        {
          'You are ready to continue when you can explain the target at a boundary, derive its masked gradient, reproduce a changed ranking or first-error metric, and diagnose a case where high reward fails to establish a valid solution. Keep local validity, future success, signed progress and optimized return separate when you choose a reward. A literal trace and an explicit denominator make that choice reviewable.'
        }
      </Prose>

      <Prose>
        {'Next, '}
        <a
          href={
            '/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models'
          }
        >
          {'RLAIF, IPO, ORPO and emerging alignment methods'}
        </a>
        {
          ' asks how AI preferences and different policy losses change what is learned. Carry forward the distinction between the meaning of a target, the function that predicts it and the objective optimized with its score.'
        }
      </Prose>
    </div>
  );
}
export default {
  title: 'Process Reward Models (PRM) vs Outcome Reward Models (ORM)',
  slug: 'process-reward-models-prm-vs-outcome-reward-models-orm',
  readTime: '~65 min read + 100 min practice',
  content: PRMLesson,
};
