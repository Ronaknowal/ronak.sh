// Static projection of the accepted manuscript. Scientific programs and observations are unchanged.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Local, Table } from '../../components/lesson-labs/SpeculativeElements.jsx';
import {
  DecoderPaths,
  PolicyProposal,
  VerificationMatrix,
  ShiftedScores,
  RejectionTrace,
  BonusAndStop,
  SharedMass,
  AcceptanceInterval,
  ResidualRouting,
  MassRecovery,
  PrefixFork,
  SequenceLaw,
  SupportCases,
  ProcessedPolicy,
  RollbackGrid,
  PendingToken,
  ScratchAnatomy,
  CacheParity,
  TailSum,
  CostTimeline,
  WorkMemory,
  LookaheadPolicies,
  TreeAttention,
  GreedyTraversal,
  TwoProposals,
  MedusaHeads,
  EagleOne,
  EagleThree,
  NativeCall,
  PairedObservations,
  WorkLedger,
  TokenizerBoundary,
  ResourceCompetition,
  PromptLookup,
  EarlyExit,
  CheckpointMtp,
} from '../../components/lesson-labs/SpeculativeDecodingFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <Local label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </Local>
);
const NeuralTable = ({ headers, rows, caption }) => (
  <Table headers={headers} rows={rows} label={caption} />
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn-code/speculative-decoding/' + file}
    filename={file}
    title={file}
    language="python"
  />
);
function SpeculativeLesson() {
  return (
    <div className="lesson-flow speculative-flow">
      <Prose>
        {
          "A decoder has selected the next token, but it cannot yet select the token after that: the new token changes the context. Repeating a large model for one output at a time can be expensive. A smaller model could suggest several outputs quickly. The difficulty is using those suggestions without quietly replacing the large model's behavior with the small model's behavior."
        }
      </Prose>

      <Prose>
        {
          'We will build that correction. First we will account for every possible output in a tiny vocabulary. Then we will carry the argument through a changing prefix, real attention caches, a tree of candidates and an ordinary library call. Finally we will measure the work and elapsed time separately. Preserving a distribution, maintaining a cache and achieving a speedup are three different claims.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'The '}
        <a
          href={
            '/learn/path/full-curriculum/decoding-strategies-greedy-beam-top-k-top-p-temperature?module=large-language-models'
          }
        >
          {'decoding lesson'}
        </a>
        {' supplies processed next-token probabilities, categorical sampling and stop rules. The '}
        <a
          href={
            '/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models'
          }
        >
          {'KV-cache lesson'}
        </a>
        {
          ' explains stored keys and values. We refresh the parts needed here. No rejection-sampling prerequisite is assumed.'
        }
      </Prose>

      <Prose>
        {
          'For a first pass, follow sections 1–10 and 13–18, doing practice tasks 1–12 and 17–18. Sections 11–12 extend the mechanism to trees and learned proposers; return to them before practice tasks 13–16. Their explanations remain visible. The exact stochastic tree calculation is a deeper branch within section 11. The Python files are complete local programs. The drawings use explicitly constructed examples or identified retained observations.'
        }
      </Prose>

      <span id="1-start-with-the-problem" aria-hidden="true" />
      <span id="1-why-it-exists" aria-hidden="true" />
      <H2>{'1. Keep the desired policy separate from the proposal'}</H2>

      <Prose>
        {
          'Imagine continuing “The small red boat”. Both models receive exactly the same committed token IDs. The larger '
        }
        <strong>{'target'}</strong>
        {' model defines the next-token behavior we want. The '}
        <strong>{'draft'}</strong>
        {' model supplies a cheaper suggestion that we may reject.'}
      </Prose>

      <DecoderPaths />

      <Prose>
        {
          'The example library route uses a six-block Pythia decoder and an independent copy retaining its first three blocks. Each block has width 128, four attention heads and an MLP intermediate width of 512. In this checkpoint, normalized attention and normalized MLP branches run in parallel and add to the residual. The output head maps the final hidden vector to vocabulary scores. Keeping fewer blocks changes that vector and its probabilities. Shared vocabulary and copied initial weights do not make the draft an equivalent decoder.'
        }
      </Prose>

      <Prose>
        {
          'The depth control illustrates architecture only. Equal depth removes the assumed reduction in block count; it does not create a measured speed comparison. Our later native workload fixes the draft at three blocks. A separately trained small model may be a better proposer, but that is a different experiment.'
        }
      </Prose>

      <PolicyProposal />

      <Prose>
        {'At one prefix, suppose the desired probabilities for A, B and C are '}
        <code>{'(0.2, 0.5, 0.3)'}</code>
        {', while the draft proposes '}
        <code>{'(0.5, 0.3, 0.2)'}</code>
        {
          ". Returning the draft's token directly would make A appear too often and B and C too rarely. We need to keep some proposals and redirect the excess."
        }
      </Prose>

      <Prose>
        {
          "Write the committed prefix as h, the target's probability as p(x | h), and the draft's probability as q(x | h). These are the distributions "
        }
        <strong>{'after'}</strong>
        {
          ' any declared temperature or filtering. A “policy” here is the rule that gives these probabilities and stops generation; it is not a promise that the resulting text is correct. Speculation aims to preserve that selected rule.'
        }
      </Prose>

      <span id="2-build-the-intuition" aria-hidden="true" />
      <span id="2-core-intuition" aria-hidden="true" />
      <H2>{'2. Known candidates can be scored together'}</H2>

      <Prose>
        {'The draft first supplies a candidate path, such as '}
        <code>{'[A, B, C]'}</code>
        {
          '. Those IDs are now known inputs. The target can process their positions together using causal attention, just as it processes a known prompt.'
        }
      </Prose>

      <VerificationMatrix />

      <Prose>
        {
          'The row for candidate B can attend to the committed prefix and candidate A. It cannot attend to candidate C. Processing the rows in one model call does not remove these dependencies: the causal mask enforces them. Matrix operations over known rows can be grouped; generating unknown IDs still depends on earlier selections.'
        }
      </Prose>

      <Prose>
        {
          'The model does work for every candidate position. Attention, projections and MLP operations are not free merely because they occur inside one call. Whether grouping them costs less than separate calls is a hardware and workload question we will measure later.'
        }
      </Prose>

      <ShiftedScores />

      <Prose>
        {
          'If the prefix contains five computed positions, its final row at position 4 predicts the next ID at position 5. The row that processes candidate A at position 5 predicts candidate B at position 6. After processing C at position 7, its row predicts a possible extra output at position 8. Three candidates therefore have three tests and one additional next-token distribution.'
        }
      </Prose>

      <Prose>
        {
          'This shift matters in code. The first candidate is tested against the saved prefix-tail logits, not the logits produced by feeding that candidate. The latter already condition on it. With no candidates, the saved prefix-tail row still supports one ordinary target selection. A nonempty prefix or an explicit beginning-of-sequence context supplies that first row.'
        }
      </Prose>

      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{'3. Draft, test, repair or take a bonus'}</H2>

      <Prose>
        {
          'Before proving the correction, trace one round. The draft proposes three IDs sequentially. At each draft step it records the probability of the proposed ID under the same candidate prefix. The target supplies the corresponding probabilities on that path.'
        }
      </Prose>

      <RejectionTrace />

      <Prose>
        {'For each proposed ID, compare a fresh uniform value in '}
        <code>{'[0, 1)'}</code>
        {
          ' with an acceptance threshold. A proposal the target likes at least as much as the draft is always accepted. A proposal overrepresented by the draft is accepted only part of the time. For example, p(x) = 0.2 and q(x) = 0.5 give threshold 0.4. Uniform 0.3 accepts; 0.6 rejects. Our finite sampler uses a strict comparison, so exactly 0.4 rejects too.'
        }
      </Prose>

      <Prose>
        {
          'Test candidates from left to right. If the first passes and the second fails, emit the first ID and one replacement drawn from the correction distribution. Discard the second candidate and every later candidate. A later ID was proposed using a context that included the rejected ID; after replacement it describes a different history.'
        }
      </Prose>

      <BonusAndStop />

      <Prose>
        {
          "If all three candidates pass, use the target's extra row to draw a fourth output. That fourth ID is a "
        }
        <strong>{'bonus'}</strong>
        {
          ', not a fourth draft candidate. If a candidate is the end-of-sequence token, EOS, and is accepted, stop immediately without a bonus. A replacement EOS also stops immediately. No output may cross the maximum-new-token budget.'
        }
      </Prose>

      <Prose>
        {
          'Our scratch loop reserves one remaining output for repair or bonus, so it drafts at most '
        }
        <code>{'min(K, remaining − 1)'}</code>
        {
          ' IDs. With only one output left it drafts none and takes one target step. This is a simple valid budget convention; a maintained implementation may propose a longer path and crop accepted outputs at its stop boundary. Count proposed, accepted, emitted and scored IDs explicitly before comparing the two.'
        }
      </Prose>

      <span id="3-make-the-idea-precise" aria-hidden="true" />
      <span id="3-mathematical-foundation" aria-hidden="true" />
      <H2>{'4. Recover the missing probability mass'}</H2>

      <Prose>
        {'Return to p = '}
        <code>{'(0.2, 0.5, 0.3)'}</code>
        {' and q = '}
        <code>{'(0.5, 0.3, 0.2)'}</code>
        {'. Think of one unit of probability divided among three labelled destinations.'}
      </Prose>

      <SharedMass />

      <Prose>
        {
          'For A, the draft supplies 0.5 but the target wants only 0.2. Keep a fraction 0.2/0.5 = 0.4 of A proposals. For B, all 0.3 of draft mass can stay, but another 0.2 is needed. For C, keep all 0.2 and supply another 0.1. The total kept mass is 0.7 and the rejected mass is 0.3.'
        }
      </Prose>

      <AcceptanceInterval />

      <Prose>{'The general threshold is the target-to-proposal ratio capped at one:'}</Prose>

      <div className="neural-equation">
        <MathBlock>{'a(x)=\\min\\left(1,\\frac{p(x)}{q(x)}\\right),\\qquad u<a(x).'}</MathBlock>
      </div>

      <Prose>
        {
          'This expression is evaluated only for an ID actually proposed by q. A valid q sampler never proposes q(x) = 0. If p(x) = 0 and q(x) > 0, the threshold is zero and the strict comparison rejects even uniform zero. Under an ideal continuous uniform law, a single boundary has probability zero. A finite random-number generator can produce some boundary values, so executable conventions still matter.'
        }
      </Prose>

      <ResidualRouting />

      <Prose>
        {
          'Rejection has already selected an event of probability 0.3. Conditional on that event, send two thirds of replacements to B and one third to C. Multiplying back gives unconditional repaired masses 0.3 × 2/3 = 0.2 and 0.3 × 1/3 = 0.1. The unnormalized deficits and the conditional repair distribution have different meanings.'
        }
      </Prose>

      <Prose>
        {'Let '}
        <code>{'[z]₊ = max(z, 0)'}</code>
        {'. The repair distribution is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'r(x)=\\frac{[p(x)-q(x)]_+}{\\sum_y[p(y)-q(y)]_+}.'}</MathBlock>
      </div>

      <Prose>
        {
          'It is defined when rejection has positive probability. If p = q, every proposal is accepted and the denominator is zero. The repair branch is unreachable; replacing it by a uniform distribution would hide a broken control path rather than explain it.'
        }
      </Prose>

      <MassRecovery />

      <Prose>
        {
          'For each token, accepted mass is q(x)a(x) = min(p(x), q(x)). Rejected total equals the total positive deficit because p and q both sum to one. Adding accepted and repaired mass therefore gives'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\Pr(\\text{output}=x)=\\min(p(x),q(x))+[p(x)-q(x)]_+=p(x).'}</MathBlock>
      </div>

      <Prose>
        {
          'This is a mass balance, not an approximation obtained by collecting many samples. It also explains target-only support: an ID with q(x) = 0 can still receive output mass through repair.'
        }
      </Prose>

      <Prose>
        {'Download the '}
        <a href={'/learn-code/speculative-decoding/speculative-decoding.zip'}>
          {'complete program bundle'}
        </a>
        {' and keep its Python, text and JSON files together. The '}
        <a href={'/learn-code/speculative-decoding/README.md'}>{'README'}</a>
        {
          ' contains activation commands, inputs and the complete file map. Start in a separate Python 3.11-or-later environment:'
        }
      </Prose>

      <CodeBlock language={'bash'}>
        {
          'python -m venv .venv\n# Activate .venv using the command for your shell in README.md.\npython -m pip install numpy==2.3.5\npython speculative_math.py'
        }
      </CodeBlock>

      <Program file="speculative_math.py" />

      <Prose>
        {''}
        <code>{'distribution'}</code>
        {
          ' rejects negative, nonfinite, empty and unnormalized rows. It corrects only small summation roundoff. '
        }
        <code>{'categorical'}</code>
        {
          ' builds intervals over positive-support IDs, including the final interval, so trailing zero-probability IDs cannot acquire a rounding gap. '
        }
        <code>{'acceptance'}</code>
        {' refuses an impossible q = 0 proposal. '}
        <code>{'residual'}</code>
        {' returns '}
        <code>{'None'}</code>
        {
          ' for an unreachable repair branch. Each function expresses a part of the probability argument rather than adding an arbitrary epsilon to make every division return a number.'
        }
      </Prose>

      <H2>{'5. The next distribution depends on the committed prefix'}</H2>

      <Prose>
        {
          'A one-token proof is not yet a complete sequence algorithm. The probability of the next token changes after each accepted token or replacement.'
        }
      </Prose>

      <PrefixFork />

      <Prose>
        {
          'Suppose the draft proposed B followed by A, but B was replaced by C. The stored probability of the second proposal describes q(A | h, B). The next actual proposal must describe q(· | h, C). Keeping the old A without the appropriate new-prefix proposal and verification changes the process. This is why the loop stops at the first rejection.'
        }
      </Prose>

      <Prose>
        {
          "Induct on the committed sequence. At its current prefix h, the mass balance gives exactly p(· | h) for the next emitted token. If a proposal is accepted, its prefix is still the actual prefix and the next test remains valid. If it is rejected, emit the corrected token and start a fresh round from the new prefix. Repeating this reasoning yields the target's conditional sequence law, with the same EOS and output-budget conventions."
        }
      </Prose>

      <SequenceLaw />

      <Prose>
        {
          'The finite model makes this testable without neural or Monte Carlo uncertainty. At the empty prefix its target probabilities for A, B and EOS are '
        }
        <code>{'(0.5, 0.3, 0.2)'}</code>
        {'. After A they are '}
        <code>{'(0.2, 0.5, 0.3)'}</code>
        {'; after B they are '}
        <code>{'(0.4, 0.1, 0.5)'}</code>
        {
          '. Its draft uses different corresponding rows. EOS terminates a path. At horizon three, every terminal path has an exact rational probability.'
        }
      </Prose>

      <Prose>
        {'For example, immediate EOS has mass 1/5. The path A then EOS has mass '}
        <code>{'(1/2)(3/10) = 3/20'}</code>
        {'. A, B, EOS has mass '}
        <code>{'(1/2)(1/2)(1/2) = 1/8'}</code>
        {
          '. The last multiplication uses the row after B, not the row after A. Correct speculative rounds redistribute how those paths are reached while preserving each terminal mass.'
        }
      </Prose>

      <Program file="speculative_decode.py" />

      <Prose>
        {
          'The conditional loop records the prefix for every test and separates accepted IDs, discarded candidates, repair and bonus. Its target and draft arguments are functions of a complete prefix; the default functions are finite probability oracles. Their call counts do not measure neural work.'
        }
      </Prose>

      <Program file="sequence_law.py" />

      <Prose>
        {
          'The exact enumerator multiplies rational proposal and conditional acceptance probabilities, routes rejection through the rational residual and expands until EOS or the horizon. It compares every path with direct target generation, not only total mass. The deliberately wrong suffix routine is separate: it preserves a probability total of one while assigning different masses to terminal sequences. Normalization alone cannot certify the desired law.'
        }
      </Prose>

      <Prose>
        {
          'The wrong routine reuses the target row scored after rejected B when its repaired history ends in A. For the two-output example, correct AA, AB and A–EOS masses are '
        }
        <code>{'(0.10, 0.25, 0.15)'}</code>
        {'; stale target scores change them to '}
        <code>{'(0.16, 0.13, 0.21)'}</code>
        {'. A weaker counterexample can accidentally hide the bug: in this fixture the old '}
        <strong>{'draft'}</strong>
        {' row after B happens to equal the correct '}
        <strong>{'target'}</strong>
        {
          ' row after A. Reusing that particular wrong row would pass. Inspect the actual operands, rather than assuming any invalid algorithm must fail on every example.'
        }
      </Prose>

      <H2>{'6. Use the probabilities of the policy actually sampled'}</H2>

      <Prose>
        {
          'The correction permits target and draft to have different supports. It requires the numbers in the ratio to describe their actual sampling rules.'
        }
      </Prose>

      <SupportCases />

      <Prose>
        {
          'A target-only ID can emerge from repair. A draft-only ID always rejects. An ID absent from both distributions has no role in either branch. With disjoint supports every proposal rejects, then repair draws directly from p. Correctness survives, but drafting becomes wasted work. With equal distributions every proposal accepts, until a stop rule ends the round.'
        }
      </Prose>

      <ProcessedPolicy />

      <Prose>
        {'Suppose logits correspond to unnormalized weights '}
        <code>{'(6, 3, 1)'}</code>
        {
          '. At temperature one, keeping only the top two and renormalizing gives target probabilities '
        }
        <code>{'(2/3, 1/3, 0)'}</code>
        {
          '. Those are the p values the verifier must use. A draft may use full support, but q in the ratio must then be its full normalized proposal law. Substituting raw logits, probabilities before temperature, or probabilities before filtering breaks the mass balance.'
        }
      </Prose>

      <Prose>
        {
          "Greedy decoding is a separate selection convention: select the largest score, resolving ties by the lowest token ID in our scratch implementation. It can be viewed here as a point-mass target law. A proposed ID either equals that selected ID or does not. The repair is the target's chosen ID. This preserves greedy choices; it does not turn greedy decoding into ancestral sampling from the original softmax."
        }
      </Prose>

      <Prose>
        {
          'Some methods deliberately relax verification, such as accepting a sufficiently likely token rather than applying the exact ratio and repair. Such acceptance can be useful, but it defines an approximate or changed policy. Likewise, blending target and assistant probabilities changes the distribution one is preserving. State that target before claiming exactness.'
        }
      </Prose>

      <H2>{'7. A committed token and a cached position are different'}</H2>

      <Prose>
        {
          'The probability loop determines which IDs survive. The implementation must make the attention state describe precisely those IDs.'
        }
      </Prose>

      <RollbackGrid />

      <Prose>
        {
          'Suppose positions 0–4 are committed and computed. We process candidate positions 5, 6 and 7 together. If only position 5 is accepted, retain the K/V records through position 5 and discard the logical visibility of positions 6–7. Their allocated bytes can remain in memory. Attention must not read them as valid history.'
        }
      </Prose>

      <Prose>
        {
          'Changing those unused bytes to large poison values is a useful mechanical test. If a later valid score changes, stale state leaked into a computation. Logical truncation is enough when every reader honors the length; physical erasure is not a necessary mathematical operation.'
        }
      </Prose>

      <PendingToken />

      <Prose>
        {
          'A repair selected for position 6 is committed immediately, but its K/V records do not yet exist. The next forward must process that repair before predicting position 7. The same applies to a bonus. Our scratch implementation first truncates both caches to the computed accepted prefix, then appends the pending repair or bonus if generation will continue.'
        }
      </Prose>

      <Prose>
        {
          'If the response has ended, the final selected ID never needs another forward. Under the scratch convention, terminal output leaves '
        }
        <code>{'prompt length + emitted length − 1'}</code>
        {
          ' computed positions. For an accepted terminal EOS we even crop its unnecessary last computed row to keep this convention uniform. This is a storage convention, not a change to returned IDs.'
        }
      </Prose>

      <Prose>
        {
          "Absolute position is independent of physical address. A moved K/V record still represents its original token position. Learned positional embeddings and rotary encodings make a different logical index a different computation. Reusing physical slots after truncation must supply the new token's correct absolute position."
        }
      </Prose>

      <Prose>
        {
          'Before any write, check capacity. Refusing a request after half its layers have written would leave inconsistent state. The small cache adapter checks the whole append boundary first, so overflow can leave both length and bytes unchanged.'
        }
      </Prose>

      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <H2>{'8. Check the mechanism on an actual decoder'}</H2>

      <Prose>
        {
          'Finite distributions isolate the proof. To test cache operations, use a model that actually computes attention over stored tensors.'
        }
      </Prose>

      <ScratchAnatomy />

      <Prose>
        {
          'The reused TinyLM has token embeddings plus learned position embeddings, three blocks, final normalization and a vocabulary head. Its block first adds the attention output to the residual, then normalizes that result and adds the MLP output. This sequential residual structure differs from the Pythia checkpoint in section 1. The one-block draft is copied from the same initialized TinyLM. These fixed random weights test mechanics; they have not learned to write text.'
        }
      </Prose>

      <Prose>
        {'Install the pinned CPU stack described in the README before running the neural programs:'}
      </Prose>

      <CodeBlock language={'bash'}>
        {'python -m pip install torch==2.14.0\npython speculative_cache.py'}
      </CodeBlock>

      <Program file="tiny_causal_lm.py" />

      <Prose>
        {
          'The complete architecture retains its standalone training entry point for reuse, but this lesson does not invoke that training command. '
        }
        <code>{'forward'}</code>
        {
          ' applies the causal model to a complete sequence. It supplies an independent full-prefix reference for each cache check.'
        }
      </Prose>

      <Program file="cached_decoder.py" />

      <Prose>
        {
          "The adapter stores separate K/V arrays for each layer, writes only the new positions, combines them with valid history and creates the corresponding causal query rows. The positional offset begins at the cache's computed length. This is the same complete prerequisite implementation; speculation adds truncation rather than replacing attention with a mock score generator."
        }
      </Prose>

      <CacheParity />

      <Prose>
        {
          'The mechanical comparison uses float64, width 16 and four heads. A candidate chunk and independently recomputed full prefix may perform floating-point operations in different groupings. We compare logits using declared absolute and relative tolerances of 10⁻¹² and separately compare greedy IDs. A tolerance pass is not a claim of bit-identical arithmetic.'
        }
      </Prose>

      <Program file="speculative_cache.py" />

      <Prose>
        {''}
        <code>{'TruncatableDecoder'}</code>
        {' changes only the logical length and provides the poison operation. '}
        <code>{'generate'}</code>
        {
          ' preserves the saved score before drafting, evaluates the candidate chunk, tests proposals at the correctly shifted rows, commits outputs, crops both caches and appends the pending ID when needed. After each continuing round it compares the next score with an independent full-prefix forward. Dedicated fixtures retain zero or two candidate rows before a replacement, and a capacity fixture checks refusal without mutation.'
        }
      </Prose>

      <Prose>
        {
          'In the retained run, all six greedy routes—K = 0, 1 and 3, each with clean or poisoned unused storage—returned '
        }
        <code>{'[8, 13, 13, 2, 16, 2]'}</code>
        {
          ', matching the independent target continuation. Both final caches contained eight computed positions after a three-ID prompt and six outputs. The explicit zero-accepted rollback had maximum logit difference about 2.22 × 10⁻¹⁶; the two-accepted rollback differed by about 3.33 × 10⁻¹⁶. The capacity refusal preserved its bytes and length. These are mechanical observations on fixed random weights, not evidence of fluent generation or measured speedup.'
        }
      </Prose>

      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'9. Acceptance is only one part of cost'}</H2>

      <Prose>
        {
          'At a fixed prefix, total acceptance is the shared probability mass. For the original three-token example it is 0.7.'
        }
      </Prose>

      <TailSum />

      <Prose>
        {
          'For a simple analytic model, assume every successive proposal independently passes with the same probability α, ignore EOS and assume enough output budget. The first proposal survives with probability α. Reaching and accepting the second requires two successes, giving α². The probability of accepting at least j proposals is αʲ. Summing these tail probabilities gives the expected accepted count.'
        }
      </Prose>

      <Prose>
        {
          'One more output is always emitted in this model: a repair after rejection or a bonus after all proposals pass. Thus'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\mathbb E[L_{\\rm accepted}]=\\sum_{j=1}^{K}\\alpha^j,\n\\qquad\n\\mathbb E[L_{\\rm emitted}]=\\sum_{j=0}^{K}\\alpha^j.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'With α = 0.7 and K = 4, emitted expectation is '}
        <code>{'1 + .7 + .49 + .343 + .2401 = 2.7731'}</code>
        {
          '. With α = 0 it is one, and with α = 1 it is K + 1. The finite sum also handles K = 0 without a division-by-zero special formula. Real prefix-dependent acceptance and stop rules need their own accounting.'
        }
      </Prose>

      <Prose>
        {'At one prefix, α = Σ min(p, q). Total variation distance is '}
        <code>{'TV(p, q) = ½ Σ |p − q|'}</code>
        {
          ', so α = 1 − TV. Equal overlap means equal one-step rejection probability. It does not imply equal draft cost, visited contexts or whole-response latency.'
        }
      </Prose>

      <CostTimeline />

      <Prose>
        {
          'Let one baseline target selection cost Cₜ. A speculative round costs K serial draft selections, a target verification of the candidate chunk and bookkeeping. If their costs are C_d, C_v(K) and C_o, the simplified speedup is'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'S=\\frac{\\mathbb E[L_{\\rm emitted}]C_t}{K C_d+C_v(K)+C_o}.'}</MathBlock>
      </div>

      <Prose>
        {
          "The numerator is what the baseline would cost for the expected number of outputs. The denominator is the speculative round's work in time units. Setting verification cost equal to one target step and ignoring overhead yields the familiar special denominator "
        }
        <code>{'1 + K C_d/C_t'}</code>
        {' after dividing by Cₜ. Neither assumption is automatic.'}
      </Prose>

      <WorkMemory />

      <Prose>
        {
          'Grouping target rows can reuse loaded weights while increasing matrix work and cache traffic. The draft also occupies weights, cache and execution time. With concurrent requests, other work may already provide efficient matrix shapes or compete for the same bandwidth. There is no universal batch-size threshold at which speculation becomes useful or useless. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'continuous-batching lesson'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models'
          }
        >
          {'queueing lesson'}
        </a>
        {' explain the surrounding scheduler and latency costs.'}
      </Prose>

      <H2>{'10. More proposals can mean more waste'}</H2>

      <Prose>
        {
          "The first candidate might be excellent while later candidates become uncertain. A fixed K treats them all as worth drafting. A confidence policy can stop sooner, but the draft's confidence is not the target's acceptance decision."
        }
      </Prose>

      <LookaheadPolicies />

      <Prose>
        {
          "The fixed policy drafts up to its cap. The confidence policy observes the draft's own selected probability and stops when it crosses a declared threshold. The oracle in the drawing knows the later target tests; it is a retrospective comparison, not free information available before verification. An all-low-confidence trace can reduce to ordinary target generation."
        }
      </Prose>

      <Prose>
        {
          'Dynamic lookahead trades extra proposal work against the chance of extending the accepted prefix. A confidence threshold needs its own evaluation because a confident draft can disagree with the target. Our measured route fixes K and sets the native confidence threshold to zero, leaving only the declared length and EOS limits to shorten a round. This makes the compared arms interpretable; it does not establish fixed K as the best serving policy.'
        }
      </Prose>

      <H2>{'11. A tree needs both a valid mask and a valid verifier'}</H2>

      <Prose>
        {
          "A single draft path bets on one continuation. A tree proposes alternatives: perhaps A and B at the first position, with different children beneath them. The target can score these known nodes in a packed computation, but siblings must not become one another's history."
        }
      </Prose>

      <TreeAttention />

      <Prose>
        {'Take four candidate nodes with tokens '}
        <code>{'[2, 5, 8, 9]'}</code>
        {' and parents '}
        <code>{'[-1, -1, 0, 1]'}</code>
        {
          '. The first two are alternatives immediately after the common prompt. Token 8 follows token 2; token 9 follows token 5. The packed row for 8 may attend to the entire prompt, 2 and itself. It must not attend to 5 or 9. Both root alternatives use the same absolute position; both children use the next position. Packed array index and logical depth are different coordinates.'
        }
      </Prose>

      <Prose>
        {
          "The target row at each node predicts the token after that node's path. Comparing it with an independent full-prefix forward checks the mask and position semantics. It does not establish that a later selection rule returns the desired distribution."
        }
      </Prose>

      <GreedyTraversal />

      <Prose>
        {
          "For greedy selection, begin with the target's argmax after the common prefix. If the tree contains that child, emit it and consult its next-token row. Continue while the next target argmax exists among the current node's children. When it is absent, emit the target-selected ID and finish the round; its own next state was not verified on this tree. EOS ends immediately. If duplicate children represent the same token path, a fixed first-listed tie rule keeps traversal deterministic."
        }
      </Prose>

      <Prose>
        {
          "This is not beam search. We do not rank complete paths by accumulated probability, and a longer available branch does not override the target's next greedy choice. The "
        }
        <a
          href={
            '/learn/path/full-curriculum/decoding-strategies-greedy-beam-top-k-top-p-temperature?module=large-language-models'
          }
        >
          {'decoding lesson'}
        </a>
        {' explains the separate beam objective.'}
      </Prose>

      <TwoProposals />

      <Prose>
        {
          'Sampling requires more care. A small correct construction helps reveal the requirement. At one prefix let p = '
        }
        <code>{'(0.7, 0.3)'}</code>
        {' and q = '}
        <code>{'(0.4, 0.6)'}</code>
        {'. Test one fresh q proposal against p. Accepted masses are '}
        <code>{'(0.4, 0.3)'}</code>
        {', leaving rejection mass 0.3. Conditional on rejection, the desired residual is now '}
        <code>{'(1, 0)'}</code>
        {'.'}
      </Prose>

      <Prose>
        {'We may test a second independently drawn q proposal against '}
        <strong>{'that residual'}</strong>
        {
          '. It proposes A with probability 0.4 and accepts it; it proposes B with probability 0.6 and rejects it, after which final repair still produces A. The second proposal changes work but not the output law: A receives '
        }
        <code>{'0.4 + 0.3(0.4 + 0.6) = 0.7'}</code>
        {
          ', and B receives 0.3. At every rejection, update the active desired distribution before testing another proposal.'
        }
      </Prose>

      <Prose>
        {
          'A tempting alternative tests both proposals independently against the original p, then prefers whichever accepted ID is smaller or whichever branch is longer. That preference changes mass allocation. A mask that correctly computes every score cannot repair this selection bias. General stochastic tree algorithms must specify proposal order, dependence and residual updates; a slogan such as “keep the longest accepted branch” is not a correctness proof.'
        }
      </Prose>

      <Program file="tree_verification.py" />

      <Prose>
        {''}
        <code>{'tree_layout'}</code>
        {" builds each node's ancestor list, depth position and allowed attention row. "}
        <code>{'tree_forward'}</code>
        {
          ' performs the real embedding, attention, residual and MLP operations using that mask. The independent-path comparison checks every node. Separately, '
        }
        <code>{'two_proposal_law'}</code>
        {' enumerates the finite sequential correction with exact fractions, while '}
        <code>{'biased_preferred'}</code>
        {
          ' supplies a normalized but wrong counterexample. The packed neural example and the probability example have different jobs and are not presented as a full SpecInfer engine.'
        }
      </Prose>

      <Prose>
        {
          'The retained four-node FP64 comparison had maximum absolute logit differences from zero to 4.44 × 10⁻¹⁶ across the independent paths. The separate binary preference bug returned '
        }
        <code>{'(0.703, 0.297)'}</code>
        {' instead of '}
        <code>{'(0.7, 0.3)'}</code>
        {
          '. That small exact discrepancy illustrates why plausible-looking output frequencies and a correct mask are insufficient: the selection rule itself changed the law.'
        }
      </Prose>

      <H2>{'12. Learn better proposals from a shared state'}</H2>

      <Prose>
        {
          "A separate draft repeats some representation work. Another approach uses the target's current hidden state to produce several candidate positions. This changes how proposals are made; verification still needs a clearly stated policy."
        }
      </Prose>

      <MedusaHeads />

      <Prose>
        {
          'In a residual proposal head, transform the current hidden vector, apply a nonlinearity, add the original vector and project to vocabulary logits. Several heads branch from the same state. One can learn a nearby future token and another a farther future token. Each needs the corresponding shifted training label, not a copy of the current token label.'
        }
      </Prose>

      <Prose>
        {
          'Our constructed diagnostic defines head offset j at state t to predict token t + j, starting at j = 1. Production Medusa usually describes extra future heads relative to the base next-token head; check that counting convention before copying labels. The principle is the same: logits and labels must refer to the same future position.'
        }
      </Prose>

      <Prose>
        {
          "With cross-entropy, a head's loss is the negative log probability assigned to its correct future ID. Average over valid positions for that offset. Farther offsets have fewer available labels near the sequence end. In frozen-backbone training, detach the shared state: gradients update the new heads only. In joint training, gradients also flow through the backbone and embeddings, so the base model can change. These are different training contracts, corresponding to the important Medusa-1/Medusa-2 distinction."
        }
      </Prose>

      <Program file="proposal_heads.py" />

      <Prose>
        {
          'The program creates a small embedding/backbone and three actual residual heads. It computes shifted cross-entropy, checks it against gathered log-softmax values, then performs one SGD update in each of frozen and joint modes from identical initial tensors. It records gradient ownership and which parameters changed. Two short constructed sequences cannot establish trained Medusa quality. The program tests the loss and gradient mechanism only.'
        }
      </Prose>

      <Prose>
        {
          'Both retained modes began with total loss 5.8699800466, the sum of three mean losses over 8, 6 and 4 valid targets. In frozen mode the embedding and backbone gradients were absent and those parameters stayed unchanged; all three heads updated. Joint mode produced backbone/embedding gradients and changed those parameters too. Identical initial forward losses do not imply identical update ownership. Exactly one update per mode was performed, with no text-quality evaluation.'
        }
      </Prose>

      <Prose>
        {
          "Medusa's typical acceptance is a separate approximate verification choice: it allows sufficiently likely alternatives under a thresholding rule. Do not attach the exact ratio-and-residual guarantee to that rule. Learned heads, tree packing and acceptance policy are three separable design decisions."
        }
      </Prose>

      <EagleOne />

      <Prose>
        {
          'EAGLE-1 predicts a next target feature rather than starting from raw token context alone. The current target feature does not determine the next state by itself: the sampled next token also matters. Feed the current feature together with the embedding of that '
        }
        <strong>{'advanced token'}</strong>
        {
          ", project their concatenation and run the draft decoder. Its predicted feature passes through the target's output head to produce another proposal distribution. Training includes feature prediction and token prediction objectives. The token input resolves an ambiguity that a feature-only extrapolation would leave."
        }
      </Prose>

      <Prose>
        {
          'For a concrete dependency trace, start with hₜ, select xₜ₊₁, and combine hₜ with the embedding of xₜ₊₁ to propose the feature that supports predicting xₜ₊₂. The advanced-token arrow must land before the predicted feature, not after its output probability. Rejection can invalidate that recursively proposed state just as it invalidates a token suffix.'
        }
      </Prose>

      <EagleThree />

      <Prose>
        {
          'EAGLE-3 changes the representation and training route. It combines low-, middle- and high-level target features, conditions the draft on the advanced token, and trains token prediction using its own recursively generated states. The two-step unrolling matters: a later draft step can receive a state produced by the draft itself, exposing it during training to the kind of state it will use during multi-step drafting.'
        }
      </Prose>

      <Prose>
        {
          "Do not describe this as EAGLE-1's feature-regression objective with more taps. Feature fusion, token prediction and self-generated-state feedback play distinct roles. The drawings trace these operations; this lesson does not fit EAGLE-1 or EAGLE-3 or claim their published speedups on our machine."
        }
      </Prose>

      <span id="5-production-implementation" aria-hidden="true" />
      <H2>{'13. Use ordinary assisted generation deliberately'}</H2>

      <Prose>
        {
          'The mathematical sampler explains the law. A maintained implementation additionally manages processors, model input shapes, caches and stopping conditions. Inspect and pin that implementation when reproducing an experiment.'
        }
      </Prose>

      <NativeCall />

      <Prose>
        {'Our route uses Transformers 5.19.0 and the pinned Pythia-14M revision '}
        <code>{'cf967c0a9a04383db6f7b1108d86b2962634b4ac'}</code>
        {'. The six model/tokenizer files have byte counts and SHA-256 identities in '}
        <code>{'model-source-report.json'}</code>
        {'. Downloading them is separate from generation:'}
      </Prose>

      <CodeBlock language={'bash'}>
        {
          'python -m pip install numpy==2.3.5 torch==2.14.0 transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0\npython acquire_model.py --output model-cache\npython native_speculation.py --model model-cache --output my-diagnostic.json'
        }
      </CodeBlock>

      <Program file="acquire_model.py" />

      <Prose>
        {
          'The acquisition helper retains a partial or mismatching file for inspection rather than treating it as the requested checkpoint. Model loading then uses local-only paths after verification. The draft is an independent copy with its first three blocks retained, its declared layer count updated and its attention cache layer indices made contiguous. Both models use evaluation mode and the same tokenizer.'
        }
      </Prose>

      <Prose>
        {'The ordinary call is '}
        <code>{'target.generate(..., assistant_model=draft)'}</code>
        {'. Set the draft schedule to '}
        <code>{'"constant"'}</code>
        {' and its confidence threshold to zero when studying fixed lookahead. Setting only '}
        <code>{'num_assistant_tokens=5'}</code>
        {
          ' does not establish five proposals: a confidence stop, EOS or the remaining output budget may shorten the candidate path. Keep '
        }
        <code>{'assistant_ensemble_weight=None'}</code>
        {' when preserving the target policy rather than an ensemble policy.'}
      </Prose>

      <Prose>
        {
          'This pinned assisted route supports a single input sequence with caching and rejects its unsupported static/hybrid/sliding cache configurations. Those are versioned route restrictions, not statements that speculative algorithms are inherently incompatible with batching or those storage techniques. Its sampling branch uses proposal score tensors, processed target logits, the ratio test and residual correction. Greedy or no-proposal-logit branches instead compare target selections with candidate IDs.'
        }
      </Prose>

      <Prose>
        {
          'There is a further API distinction between choosing storage and passing an existing storage object. In the first retained diagnostic attempt, an explicit '
        }
        <code>{'cache_implementation="dynamic"'}</code>
        {" initialized the first round successfully, but conflicted with the assistant's carried "}
        <code>{'past_key_values'}</code>
        {' on round two. The corrected caller sets '}
        <code>{'cache_implementation=None'}</code>
        {': this pinned decoder-only default creates a '}
        <code>{'DynamicCache'}</code>
        {
          " when absent and reuses the provided object when present. The candidate generator copies the target's generation configuration, so changing only the draft's configuration would miss the conflicting setting."
        }
      </Prose>

      <Prose>
        {
          'The failed greedy attempt is retained rather than presented as a completed continuation. Its first round proposed IDs '
        }
        <code>{'[281, 48056, 25013]'}</code>
        {', the target selected ID '}
        <code>{'13'}</code>
        {
          ' at the first mismatch, and the target cache was cropped to four computed positions. The next candidate start failed before another model forward. At that point the observed work was one target forward over seven input rows and three draft forwards over six rows. Those partial observations establish what happened before the API error; they are not a valid completed-response timing or a speedup measurement.'
        }
      </Prose>

      <Prose>
        {
          'The remaining sampled diagnostic completed under the corrected configuration. With seed 409 and an eight-output cap it returned '
        }
        <code>{'[313, 395, 253, 2644, 273, 776, 1533, 10]'}</code>
        {'. Its first round proposed '}
        <code>{'[313, 436, 310]'}</code>
        {
          ', kept the first ID and emitted replacement 395; the cache then contained five computed positions. Across the complete continuation it used seven target forwards over 25 input rows and 15 draft forwards over 23 rows. This is an actual example of rejecting most draft work, while retaining a valid next context for another round. Its rich observation hooks distinguish it from the minimally instrumented timing workload below.'
        }
      </Prose>

      <Prose>
        {
          'After accepting outputs, the implementation crops the target cache and updates the assistant state for the next round. It also crops at length/EOS boundaries and then sets its internal '
        }
        <code>{'n_matches'}</code>
        {' to '}
        <code>{'emitted_count − 1'}</code>
        {
          '. That variable is therefore not always the literal number of accepted draft tokens. The diagnostic retains explicit proposed and emitted IDs, score shapes and the post-crop cache length instead of renaming that internal counter.'
        }
      </Prose>

      <Prose>
        {'The installed sampling helper uses '}
        <code>{'<='}</code>
        {
          ' in its finite random comparison. Our strict reference rejects p = 0, q > 0 even at uniform zero. A constructed helper probe isolates that endpoint; it is distinct from the ideal continuous proof, where a boundary has zero mass. This distinction is recorded openly rather than changing the installed sampler inside the study.'
        }
      </Prose>

      <Program file="native_speculation.py" />

      <Prose>
        {
          'The rich diagnostic wraps candidate observation methods and attaches forward hooks, then restores them in '
        }
        <code>{'finally'}</code>
        {
          '. Its two declared attempts are separate from timing measurements; the retained greedy attempt failed partway through, so its partial trace is not a completed continuation. The measured path retains only equal call/input-row counters for every arm. Full output IDs are essential: fewer calls alone do not show that an output obeyed the cap or stopped at the first EOS.'
        }
      </Prose>

      <H3>{'Copy a continuation already in the prompt'}</H3>

      <Prose>
        {
          'A learned assistant is not the only possible source of candidate IDs. Repeated text can supply a continuation without another model.'
        }
      </Prose>

      <PromptLookup />

      <Prose>
        {'In '}
        <code>{'[A, B, C, D, A, B]'}</code>
        {', the current two-token suffix is '}
        <code>{'[A, B]'}</code>
        {'. Its earlier occurrence is followed by '}
        <code>{'[C, D]'}</code>
        {
          ', which can be copied as candidates. The target still verifies them. If the current suffix has no eligible earlier match, or only one output remains under the native reserve-a-bonus rule, the candidate lane is empty and target generation continues normally.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'generate(prompt_lookup_num_tokens=2)'}</code>
        {
          ' selects the ordinary route. The candidate generator searches suffix sizes and eligible earlier matches, with versioned EOS/forbidden-token cropping. It returns candidate IDs without a learned q-logit tensor. The native no-logit branch compares greedy target choices, or independently sampled target choices at the verified positions, with the copied IDs. It does not invent a learned probability row for the copied continuation. These optional calls are supplied as functions in the full native program; the Pythia timing campaign does not execute them.'
        }
      </Prose>

      <H3>{'Exit a trained model early'}</H3>

      <Prose>
        {
          'An early-exit proposer uses an intermediate boundary of the same model. That boundary needs useful trained logits; arbitrary intermediate layers are not automatically qualified.'
        }
      </Prose>

      <EarlyExit />

      <Prose>
        {
          'For a checkpoint trained for early exit, layers 1 through e produce candidate states and a shared output head proposes IDs. Full-depth verification then checks those known candidates. The drawing keeps the remaining layers visible: an early proposal boundary does not remove them from the target computation.'
        }
      </Prose>

      <Prose>
        {'The ordinary call '}
        <code>{'generate(assistant_early_exit=4)'}</code>
        {
          " requires such a trained checkpoint, for example an appropriate LayerSkip checkpoint. In the inspected implementation, candidate generation temporarily restricts the same model's active depth, then restores it for verification and manages its cache state. Sharing a model's weights is distinct from proving that every activation and cache byte is reused without recomputation. This is also distinct from our independently copied, pruned Pythia draft. The optional helper requires explicit confirmation of the checkpoint's training condition and performs no acquisition or call by default."
        }
      </Prose>

      <H3>{'Follow checkpoint-trained multi-token modules'}</H3>

      <Prose>
        {
          'Some checkpoints contain additional modules trained to predict further tokens. Their structure is not the same as independent heads branching from one hidden state.'
        }
      </Prose>

      <CheckpointMtp />

      <Prose>
        {
          "Start with the main decoder's last state hₜ and the selected next token xₜ₊₁. A checkpoint MTP module combines normalized state and token embedding, projects their concatenation, computes a new state and uses the shared output head to propose another token. That new state and newly advanced token feed the next module. The proposal chain is sequentially conditioned. A rejection invalidates downstream module history, so the next proposal path must be rebuilt from valid state."
        }
      </Prose>

      <Prose>
        {'Current '}
        <code>{'generate(use_mtp=True)'}</code>
        {
          ' requires an architecture and checkpoint containing supported trained MTP weights. Applicable configurations expose '
        }
        <code>{'num_mtp_layers'}</code>
        {', sometimes serialized through the '}
        <code>{'num_nextn_predict_layers'}</code>
        {
          ' alias. A positive configuration field is a necessary check, not proof that the weights exist; the native loader checks supported weight patterns. Supported DeepSeek-V3 or GLM-4.5 checkpoints are examples. The layer count governs candidate count and the inspected route remains batch one. This lesson neither downloads those large checkpoints nor substitutes fresh random heads for their trained modules.'
        }
      </Prose>

      <H2>{'14. Compare like-for-like observations'}</H2>

      <Prose>
        {
          'An assisted call can return the right kind of output while taking longer. To find out, specify the workload before looking at the timings.'
        }
      </Prose>

      <PairedObservations />

      <Prose>
        {
          'The declared workload takes the four prose lines of the distributed public-domain Alice excerpt, in file order. It retains at most their first 32 Pythia IDs: the resulting lengths are 19, 32, 32 and 32. Each prefix is continued in greedy mode and in sampled mode with temperature 0.8, top-k disabled and top-p one. The arms are target-only and fixed lookahead 1, 3 and 5. Every call permits at most 24 new IDs.'
        }
      </Prose>

      <Prose>
        {
          'One warmup for each prefix/mode/arm produces 32 warmups. Three fixed repetition seeds produce 96 measured calls. Arm order rotates by a declared rule across repetitions, prefixes and modes; it does not change after a slow result. All 128 calls, including warmups, permit at most 3072 emitted IDs. The two rich diagnostic calls in section 13 are separately budgeted at eight outputs each.'
        }
      </Prose>

      <Prose>
        {
          'Pair a speculative measurement with the target-only call for the same prefix, mode and repetition. Whole-call speedup divides baseline elapsed time by speculative elapsed time. A value below one is a slowdown. Also divide each elapsed time by its actual emitted count: an early EOS may make whole-call and per-token comparisons differ. Neither ratio is meaningful if an output is missing; a failed record needs its failure status.'
        }
      </Prose>

      <Prose>
        {
          'All 32 warmups and 96 measurements completed in the retained CPU run. Every call emitted the full 24-ID cap, giving 3072 outputs including warmups. Model-weight hashes were unchanged before and after inference. All 36 measured greedy speculative/baseline pairs returned the same IDs. Sampled strings were not required to match.'
        }
      </Prose>

      <NeuralTable
        caption={'14. Compare like-for-like observations'}
        headers={[
          <>{'Mode'}</>,
          <>{'Arm'}</>,
          <>{'Median whole-call ms'}</>,
          <>{'Median ms/output ID'}</>,
          <>{'Median paired speedup'}</>,
          <>{'Paired speedup range'}</>,
        ]}
        rows={[
          [
            <>{'Greedy'}</>,
            <>{'Target-only'}</>,
            <>{'183.60'}</>,
            <>{'7.65'}</>,
            <>{'—'}</>,
            <>{'—'}</>,
          ],
          [
            <>{'Greedy'}</>,
            <>{'K = 1'}</>,
            <>{'382.15'}</>,
            <>{'15.92'}</>,
            <>{'0.486'}</>,
            <>{'0.359–0.691'}</>,
          ],
          [
            <>{'Greedy'}</>,
            <>{'K = 3'}</>,
            <>{'621.85'}</>,
            <>{'25.91'}</>,
            <>{'0.302'}</>,
            <>{'0.265–0.373'}</>,
          ],
          [
            <>{'Greedy'}</>,
            <>{'K = 5'}</>,
            <>{'804.95'}</>,
            <>{'33.54'}</>,
            <>{'0.231'}</>,
            <>{'0.186–0.321'}</>,
          ],
          [
            <>{'Sampled'}</>,
            <>{'Target-only'}</>,
            <>{'257.73'}</>,
            <>{'10.74'}</>,
            <>{'—'}</>,
            <>{'—'}</>,
          ],
          [
            <>{'Sampled'}</>,
            <>{'K = 1'}</>,
            <>{'456.63'}</>,
            <>{'19.03'}</>,
            <>{'0.562'}</>,
            <>{'0.390–0.690'}</>,
          ],
          [
            <>{'Sampled'}</>,
            <>{'K = 3'}</>,
            <>{'814.58'}</>,
            <>{'33.94'}</>,
            <>{'0.285'}</>,
            <>{'0.226–0.509'}</>,
          ],
          [
            <>{'Sampled'}</>,
            <>{'K = 5'}</>,
            <>{'1051.87'}</>,
            <>{'43.83'}</>,
            <>{'0.231'}</>,
            <>{'0.113–0.310'}</>,
          ],
        ]}
      />

      <Prose>
        {
          "Each row summarizes 12 measured calls: four prefixes times three repetitions. The paired column takes the median of each pair's ratio, rather than dividing the two arm medians. All 72 speculative pairs were slower than their baseline; there was no observed timing win in this workload. For example, the greedy K = 1 median paired speedup of 0.486 means about half the baseline's output rate under this equal-length comparison. These small CPU measurements use an untrained pruned draft and include the common hook cost. They answer the declared experiment, not whether a trained proposer on different hardware will help."
        }
      </Prose>

      <WorkLedger />

      <Prose>
        {
          "Forward calls and processed input rows explain work from different angles. One target call can process several rows. A draft call consumes resources even if all its proposed IDs are discarded. Minimal counters execute inside every arm's timer; hook installation, tokenization and text decoding stay outside. Rich candidate-probability hooks run only in the separate diagnostics. The timing includes the common instrumentation cost rather than subtracting an invented overhead."
        }
      </Prose>

      <Prose>
        {
          'Across the 12 measured greedy calls, target-only used 288 target forwards and 621 target input rows. K = 3 reduced the target count to 246, but processed 1242 target rows and added 663 draft forwards over 1224 draft rows. Increasing to K = 5 still used 246 target forwards while increasing draft forwards to 1017. The extra proposal work did not buy more target-call savings in this fixture. That explains the direction of the observed slowdown without pretending call counts alone predict milliseconds.'
        }
      </Prose>

      <Prose>
        {
          'The source-bound runner preserves all warmups, measured rows, outliers and failures. Exclusive start files prevent silently replacing a failed or completed stage. A new intended experiment needs new paths and a new protocol. Same-seed sampled outputs need not match because the algorithms consume random draws differently. Greedy comparisons are checked separately and any mismatch is retained, including possible floating-point shape effects.'
        }
      </Prose>

      <Program file="speculation_study.py" />

      <Prose>
        {''}
        <code>{'prepare'}</code>
        {
          ' verifies model bytes and tokenizes the four fixed lines without constructing a neural model. '
        }
        <code>{'run'}</code>
        {
          ' guards the prepared source and dependencies, then performs one named stage. Mechanical checks precede native diagnostics, and the fixed timing workload follows successful earlier stages. The JSONL journal records completed calls immediately. Its small CPU workload supports conclusions about those observed calls; it is not a language-quality benchmark or a forecast of accelerator throughput.'
        }
      </Prose>

      <Prose>
        {
          "The saved record also includes two failures encountered before the timing workload. First, the deliberately wrong finite example accidentally used a stale proposal row equal to the correct target row, so its expected inequality failed. The corrected witness in section 5 uses a genuinely different stale target row. The earlier mass and finite-loop checks had returned before that exception, but their combined raw return was not saved; the archive records that limitation instead of reconstructing results. The corrected sequence check, practice calculations, cache comparisons, tree comparisons and two head updates subsequently completed. Second, the native greedy diagnostic encountered the cache-ownership conflict described in section 13. Its failed attempt remains separate from the corrected configuration's remaining work. Neither failure was removed or silently rerun."
        }
      </Prose>

      <H2>{'15. Token boundaries and other requests also matter'}</H2>

      <Prose>
        {
          'The simple derivation used a common vocabulary. Two models that tokenize text differently do not assign the same meaning to an integer ID.'
        }
      </Prose>

      <TokenizerBoundary />

      <Prose>
        {'For example, one constructed tokenizer might divide '}
        <code>{'unhappy'}</code>
        {' into '}
        <code>{'un'}</code>
        {' and '}
        <code>{'happy'}</code>
        {', while another divides it into '}
        <code>{'unh'}</code>
        {' and '}
        <code>{'appy'}</code>
        {
          ". Their pieces cross each other's boundaries. Appending text can also change a tokenizer's final segmentation. Replacing one model's ID with the same integer in another vocabulary is meaningless; even mapping a completed piece to a fixed list may need to revise a suffix."
        }
      </Prose>

      <Prose>
        {
          "Universal assisted decoding addresses this through text/token alignment and re-encoding, with implementation-specific state management. The diagram exposes why alignment is necessary. It is not a general replacement for the maintained algorithm. Check the current library's tokenizer requirements and restrictions rather than assuming every target/draft pair is interchangeable."
        }
      </Prose>

      <ResourceCompetition />

      <Prose>
        {
          "A request does not own a server in isolation. Draft work can compete with another request's target work, and provisional cache allocations can reduce available capacity. A policy that improves one response's elapsed time can reduce aggregate throughput or worsen another response's waiting time. Conversely, an idle resource may make useful draft work possible. These are scheduler and workload questions, not contradictions of the probability proof."
        }
      </Prose>

      <Prose>
        {'Use the '}
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'continuous batching'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models'
          }
        >
          {'queueing'}
        </a>
        {
          ' lessons to define arrival, admission, service and completion. Production engine configuration belongs in '
        }
        <a
          href={
            '/learn/path/full-curriculum/inference-engines-serving?module=large-language-models'
          }
        >
          {'Inference Engines & Serving'}
        </a>
        {
          '. Its maintained integration may combine proposal types, paged storage and batching; a small single-request experiment does not establish a universal serving policy.'
        }
      </Prose>

      <span id="7-decision-matrix" aria-hidden="true" />
      <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
      <H2>{'16. Diagnose the mechanism before tuning it'}</H2>

      <Prose>
        {
          'Speculative decoding separates suggestion from commitment. A draft supplies known candidate IDs, the target scores their conditional contexts, and a valid verifier either keeps a prefix or repairs its first failure. The positive residual restores missing probability mass. Caches keep only history consistent with committed IDs. Additional outputs per target call can help, but only when their saved cost exceeds proposal, verification and bookkeeping cost.'
        }
      </Prose>

      <NeuralTable
        caption={'16. Diagnose the mechanism before tuning it'}
        headers={[<>{'Observation'}</>, <>{'Inspect first'}</>, <>{'Why it matters'}</>]}
        rows={[
          [
            <>{'Output law changes'}</>,
            <>{'Actual processed p/q, residual and any approximate/ensemble rule'}</>,
            <>{'Correct logits with a different selection rule preserve a different policy.'}</>,
          ],
          [
            <>{'Later text depends on a rejected candidate'}</>,
            <>{'Discarded suffix, cache length and pending replacement'}</>,
            <>{'The next operation may be conditioning on the wrong history.'}</>,
          ],
          [
            <>{'Greedy IDs disagree'}</>,
            <>{'Tie rule, processors, shifted rows and numerical shape effects'}</>,
            <>{'A cache error and finite-precision disagreement need different repairs.'}</>,
          ],
          [
            <>{'High acceptance but no speedup'}</>,
            <>{'Verification row cost, draft cost, overhead and contention'}</>,
            <>{'Acceptance is only one term in elapsed time.'}</>,
          ],
          [
            <>{'Small actual candidate counts despite large K'}</>,
            <>{'Confidence stop, EOS and remaining budget'}</>,
            <>{'K may be a cap rather than a realized length.'}</>,
          ],
          [
            <>{'Native match count seems inconsistent'}</>,
            <>{'Explicit proposed/emitted IDs and post-stop cropping'}</>,
            <>{'An internal bookkeeping field may not mean accepted proposals.'}</>,
          ],
        ]}
      />

      <Prose>
        {'The '}
        <a href={'/learn-code/speculative-decoding/README.md'}>
          {'README and complete file index'}
        </a>
        {
          ' map each full program to its role. Start with the finite mass calculation, then the conditional enumerator, before tracing real cache arrays or native hooks. The full bundle includes exact prerequisite helpers and their inputs; checkpoint weights are acquired separately from pinned sources.'
        }
      </Prose>

      <NeuralTable
        caption={'16. Diagnose the mechanism before tuning it'}
        headers={[<>{'Complete source'}</>, <>{'What to inspect or change'}</>]}
        rows={[
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/speculative_math.py'}>
                {'speculative_math.py'}
              </a>
              {''}
            </>,
            <>{'Probability validation, positive support, acceptance and residual'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/speculative_decode.py'}>
                {'speculative_decode.py'}
              </a>
              {''}
            </>,
            <>{'Prefix-conditioned loop, first rejection, bonus and stopping'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/sequence_law.py'}>{'sequence_law.py'}</a>
              {''}
            </>,
            <>{'Every terminal rational mass and the wrong-history witness'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/speculative_cache.py'}>
                {'speculative_cache.py'}
              </a>
              {''}
            </>,
            <>{'Real two-model cache truncation, pending input and poisoned suffix'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/tree_verification.py'}>
                {'tree_verification.py'}
              </a>
              {''}
            </>,
            <>{'Ancestor mask, depth positions and ordered residual correction'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/proposal_heads.py'}>
                {'proposal_heads.py'}
              </a>
              {''}
            </>,
            <>{'Shifted head labels and frozen/joint gradient ownership'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/native_speculation.py'}>
                {'native_speculation.py'}
              </a>
              {''}
            </>,
            <>{'Ordinary pinned assisted generation and optional extension calls'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/speculation_study.py'}>
                {'speculation_study.py'}
              </a>
              {''}
            </>,
            <>{'Declared workload, source guards, timing and raw result journals'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/practice_answers.py'}>
                {'practice_answers.py'}
              </a>
              {''}
            </>,
            <>{'Complete changed-input answers'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/tiny_causal_lm.py'}>
                {'tiny_causal_lm.py'}
              </a>
              {''}
            </>,
            <>{'Full reused model architecture and its separate training entry point'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/cached_decoder.py'}>
                {'cached_decoder.py'}
              </a>
              {''}
            </>,
            <>{'Full reused per-layer K/V adapter'}</>,
          ],
          [
            <>
              {''}
              <a href={'/learn-code/speculative-decoding/acquire_model.py'}>{'acquire_model.py'}</a>
              {''}
            </>,
            <>{'Pinned public model acquisition and exact byte checks'}</>,
          ],
        ]}
      />

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <span id="11-self-check-exercises" aria-hidden="true" />
        <H2>{'17. Independent practice'}</H2>

        <Prose>
          {
            'Use the changed inputs below before opening each solution. On a first pass, do tasks 1–12 and 17–18; tasks 13–16 return to the deeper tree and learned-proposer sections as linked below. The '
          }
          <a href={'/learn-code/speculative-decoding/practice_answers.py'}>
            {'complete answer program'}
          </a>
          {
            ' recomputes the numerical cases. Explanation matters: identify the conditional distribution, context or cost that makes the result valid.'
          }
        </Prose>

        <section className="lesson-exercise" data-lesson-exercise="1">
          <H3>{'1. Route a different deficit'}</H3>

          <Prose>
            {'For p = '}
            <code>{'(0.4, 0.1, 0.5)'}</code>
            {' and q = '}
            <code>{'(0.2, 0.5, 0.3)'}</code>
            {
              ', find acceptance overlap and the conditional repair distribution. Account for the final mass of each token.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Separate common mass from positive p − q before normalizing anything.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'Common mass is '}
              <code>{'(0.2, 0.1, 0.3)'}</code>
              {', totaling 0.6. Deficit is '}
              <code>{'(0.2, 0, 0.2)'}</code>
              {', totaling 0.4, so repair is '}
              <code>{'(0.5, 0, 0.5)'}</code>
              {
                '. Multiplying repair by rejection probability 0.4 gives the unconditional missing masses. Adding them to the common masses returns p.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="2">
          <H3>{'2. Emit an unproposable token'}</H3>

          <Prose>
            {'Let q = '}
            <code>{'(0, 0.6, 0.4)'}</code>
            {' and p = '}
            <code>{'(0.3, 0.2, 0.5)'}</code>
            {'. How can output A have positive probability when the draft never proposes it?'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'The source of an output need not be the proposal branch.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'Accepted mass is '}
              <code>{'(0, 0.2, 0.4)'}</code>
              {'. B supplies rejected mass 0.4. Deficits are '}
              <code>{'(0.3, 0, 0.1)'}</code>
              {', so repair is '}
              <code>{'(0.75, 0, 0.25)'}</code>
              {'. A gets unconditional output mass '}
              <code>{'0.4 × 0.75 = 0.3'}</code>
              {' through repair. Dividing p(A) by q(A) is unnecessary because A is never proposed.'}
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="3">
          <H3>{'3. Locate an exact boundary'}</H3>

          <Prose>
            {
              'A proposed token has p = 0.12 and q = 0.3. Under strict comparison, what happens at uniforms 0.399, 0.4 and 0.401? Why discuss equality at all?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'The threshold is 0.4; distinguish an ideal continuous draw from a finite generator.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The outcomes are accept, reject, reject. A single endpoint has zero probability under the ideal continuous law, but a finite generator can emit represented values exactly. An explicit convention avoids accidental admission of a zero-target-probability proposal at uniform zero.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="4">
          <H3>{'4. Count outputs, including a stop'}</H3>

          <Prose>
            {
              'With K = 2, trace first acceptance followed by second rejection; then trace all acceptance. What changes if the repair is EOS?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'A repair replaces the first failed proposal; a bonus exists only after all proposals pass.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'The first case emits '}
              <code>{'[accepted first, repair]'}</code>
              {
                ', two outputs. All acceptance emits the two candidates plus one target-only bonus, three outputs when budget and EOS permit. A repair EOS ends after '
              }
              <code>{'[accepted first, EOS]'}</code>
              {'; no later candidate or bonus is emitted.'}
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="5">
          <H3>{'5. Quantify a stale suffix'}</H3>

          <Prose>
            {'At the first position p = '}
            <code>{'(3/5, 2/5)'}</code>
            {' and q = '}
            <code>{'(3/10, 7/10)'}</code>
            {'. The target after A is '}
            <code>{'(9/10, 1/10)'}</code>
            {' and after B is '}
            <code>{'(1/5, 4/5)'}</code>
            {
              '. In the accepted-first branch, take the second token from the correct target. In the rejected-B/repaired-A branch, a buggy routine instead uses the old B-context draft row '
            }
            <code>{'(1/10, 9/10)'}</code>
            {'. Compute AA, AB, BA and BB masses.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Accepted first-token masses are A = 0.3 and B = 0.4. Rejection supplies another 0.3 to A.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'The correct law is '}
              <code>{'(0.54, 0.06, 0.08, 0.32)'}</code>
              {'. The buggy law gives AA '}
              <code>{'0.3×0.9 + 0.3×0.1 = 0.30'}</code>
              {', AB '}
              <code>{'0.3×0.1 + 0.3×0.9 = 0.30'}</code>
              {', and unchanged BA/BB '}
              <code>{'(0.08, 0.32)'}</code>
              {
                '. Both laws sum to one. The stale suffix moved 0.24 mass from AA to AB, so normalization did not catch the context error.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="6">
          <H3>{'6. Equal laws, different strings'}</H3>

          <Prose>
            {'With p = q = '}
            <code>{'(0.5, 0.5)'}</code>
            {
              ", one algorithm's relevant uniform is 0.25 and another's is 0.75 because it consumed an extra draw earlier. Does their different output disprove distributional equality?"
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'A marginal distribution and a coupling of two runs are different objects.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'No. The first selects A and the second B, while each relevant uniform can still be uniformly distributed and each output marginal remain p. Pairing seed values is reproducible bookkeeping, not a proof that two algorithms consume the same random numbers at corresponding decisions.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="7">
          <H3>{'7. Correct after filtering'}</H3>

          <Prose>
            {'Target logits are '}
            <code>{'log(6), log(3), log(1)'}</code>
            {'. Apply temperature one and top-two filtering. With draft q = '}
            <code>{'(0.2, 0.3, 0.5)'}</code>
            {', find target probabilities and repair.'}
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Normalize retained weights 6 and 3 before subtracting q.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'The target is '}
              <code>{'(2/3, 1/3, 0)'}</code>
              {'. Deficits are '}
              <code>{'(7/15, 1/30, 0)'}</code>
              {', totaling 1/2; repair is '}
              <code>{'(14/15, 1/15, 0)'}</code>
              {
                '. Every C proposal rejects. Raw logits or unnormalized weights cannot be substituted in this probability ratio.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="8">
          <H3>{'8. Name every retained position'}</H3>

          <Prose>
            {
              'Five positions are already computed. Four candidates are processed; two pass before a rejection. Under our pending-token convention, which positions remain computed, and what is the next append?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Positions start at zero. A selected replacement is not automatically a computed K/V row.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Initial positions are 0–4; candidates occupy 5–8. Retain computed positions 0–6. Discard logical visibility of candidate positions 7–8. The replacement is committed at position 7 but pending. Append precisely that replacement next, creating its K/V and moving computed length to 8. Reading stale position 7 would condition on the rejected candidate.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="9">
          <H3>{'9. Move bytes without moving time'}</H3>

          <Prose>
            {
              'A cache manager moves a key/value record to another physical slot. A developer also renumbers its logical position to match the slot. Diagnose the error for learned positions and rotary attention.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                "The slot locates storage; the position describes the token's place in its sequence."
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "The manager should update the address mapping while preserving the record's logical position. Learned-position computation used the original position embedding; changing the label does not recompute that state correctly. A rotary key already encodes its logical position and should not be rotated again merely because its storage address changed. The exact cache representation determines what metadata must move, but physical relocation is not a new token time."
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="10">
          <H3>{'10. Reconstruct the tail sum'}</H3>

          <Prose>
            {
              'Under independent common acceptance α = 0.6 and K = 3, compute expected accepted and emitted counts. Check α = 0 and α = 1.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'List the probabilities of accepting at least one, two and three proposals.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'They are 0.6, 0.36 and 0.216. Accepted expectation is 1.176; adding the repair/bonus gives 2.176 emitted. At α = 0, accepted is zero and emitted one. At α = 1, accepted is three and emitted four. EOS or an insufficient budget would invalidate this unrestricted model.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="11">
          <H3>{'11. Cross the break-even point'}</H3>

          <Prose>
            {
              'Use the previous expectation with target cost 10 ms, draft cost 2 ms per proposal, chunk verification 14 ms, overhead 1 ms and K = 3. What happens if overhead increases to 3 ms?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Compare expected baseline cost for 2.176 outputs with the whole speculative round.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'Expected baseline cost is 21.76 ms. Original round cost is '}
              <code>{'3×2 + 14 + 1 = 21'}</code>
              {
                ' ms, giving speedup about 1.03619. Raising overhead gives 23 ms and speedup about 0.94609, a slowdown. Acceptance did not change; the cost of realizing those outputs did.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="12">
          <H3>{'12. Same overlap, different latency'}</H3>

          <Prose>
            {
              'Construct two contexts with α = 0.7 and K = 2 but different elapsed costs. Explain what additional information is needed for a whole-workload expectation.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'The emitted expectation is fixed by this simplified α/K pair; the round cost need not be.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'Both contexts have expected emitted count '}
              <code>{'1 + .7 + .49 = 2.19'}</code>
              {
                '. Suppose their total round costs are 10 and 30 ms because their history lengths or draft costs differ. They have the same one-step overlap and different cost per expected output. A workload expectation also needs how often each context is visited, including the conditional paths and stop rules. Many other concrete cost constructions are valid if their units and assumptions are explicit.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="13">
          <H3>{'13. Write a tree mask'}</H3>

          <Prose>
            {'This begins the deeper practice branch. Tasks 13–14 use '}
            <a href={'#11-a-tree-needs-both-a-valid-mask-and-a-valid-verifier'}>
              {"section 11's tree masks and sequential residual correction"}
            </a>
            {'; tasks 15–16 use '}
            <a href={'#12-learn-better-proposals-from-a-shared-state'}>
              {"section 12's learned heads and EAGLE dependencies"}
            </a>
            {
              '. Read those sections before attempting the corresponding tasks. First-pass readers can continue with task 17 and return here afterward.'
            }
          </Prose>

          <Prose>
            {
              "Four candidate nodes are a root, its left and right children, and the left child's child. Write the candidate-only ancestor/self attention mask and depth positions."
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Rows are queries; columns are permitted candidate keys. Add common prompt columns separately.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'Depths are '}
              <code>{'[0, 1, 1, 2]'}</code>
              {'. In that node order the mask rows are '}
              <code>{'[1,0,0,0]'}</code>
              {', '}
              <code>{'[1,1,0,0]'}</code>
              {', '}
              <code>{'[1,0,1,0]'}</code>
              {', '}
              <code>{'[1,1,0,1]'}</code>
              {
                '. Logical positions add the common prefix offset. Letting the grandchild attend to the right child leaks a sibling history that is absent from its independent path.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="14">
          <H3>{'14. Repair before the second test'}</H3>

          <Prose>
            {'For p = '}
            <code>{'(0.5, 0.35, 0.15)'}</code>
            {' and q = '}
            <code>{'(0.2, 0.2, 0.6)'}</code>
            {
              ', enumerate two sequential proposals. Find the residual after each possible rejection and account for final A/B/C mass.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'First accepted mass totals 0.55. Within its rejection branch, test the second q proposal against the normalized remaining target mass.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'First accepted masses are '}
              <code>{'(0.2, 0.2, 0.15)'}</code>
              {' and rejection probability is 0.45. Its residual is '}
              <code>{'(2/3, 1/3, 0)'}</code>
              {'. The second test accepts conditional masses '}
              <code>{'(0.2, 0.2, 0)'}</code>
              {' and rejects with probability 0.6; the final repair is '}
              <code>{'(7/9, 2/9, 0)'}</code>
              {'. Final A mass is '}
              <code>{'0.2 + 0.45(0.2 + 0.6×7/9) = 0.5'}</code>
              {'; B is '}
              <code>{'0.2 + 0.45(0.2 + 0.6×2/9) = 0.35'}</code>
              {
                '; C remains 0.15. Each rejection changes the active desired row, including the second one.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="15">
          <H3>{'15. Repair a head-label shift'}</H3>

          <Prose>
            {
              'A head at state t is intended to predict token t + 3, but its labels begin at t + 2. Fix the target and explain gradient ownership in frozen and joint modes.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Align each hidden position with the intended future label before flattening for cross-entropy.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Pair hidden positions through length−3 with labels beginning three positions later. Exclude the last three hidden positions because their labels are unavailable. Frozen mode detaches the backbone state, so only the new head parameters receive gradients. Joint mode also propagates through the backbone and embeddings. A low loss against the wrong offset does not establish the intended prediction task.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="16">
          <H3>{"16. Follow EAGLE's token arrow"}</H3>

          <Prose>
            {
              "Two examples have the same target state hₜ but select different next tokens. A developer replaces their advanced-token embeddings with one constant. Another developer keeps EAGLE-3's three feature taps but supplies a fresh target state at every training step instead of feeding back a draft-generated state. Which dependency does each change remove? Does either change alone settle verification exactness?"
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                "Trace both the selected-token input and the second training step's state source. Proposal training and the verifier have different jobs."
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "The constant embedding erases which next token was actually selected; the following conditional prediction cannot distinguish those examples from that input. Replacing draft-state feedback removes exposure to the proposer's own recursively generated states, even though the low/middle/high feature taps remain. Neither training change alone establishes or disproves exact target-law verification: that requires the declared proposal law, acceptance rule and repair. Better proposals affect efficiency; correctness still needs its separate argument."
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="17">
          <H3>{'17. Read the complete native configuration'}</H3>

          <Prose>
            {
              'An experiment requests K = 5 but leaves confidence threshold 0.4 and ensemble weight 0.2. Can it claim fixed five-candidate rounds preserving the original target distribution?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'One field can stop proposals early; another changes the desired policy.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'No. Confidence may stop before five candidates, and a non-null ensemble changes the verified distribution. For our fixed-cap target-preserving comparison, set '
              }
              <code>{'num_assistant_tokens=5'}</code>
              {', '}
              <code>{'num_assistant_tokens_schedule="constant"'}</code>
              {', '}
              <code>{'assistant_confidence_threshold=0.0'}</code>
              {' and '}
              <code>{'assistant_ensemble_weight=None'}</code>
              {
                '. EOS and the remaining output budget can still shorten a round, so five is a maximum rather than an unconditional realized count.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="18">
          <H3>{'18. Report both a win and a loss'}</H3>

          <Prose>
            {
              'Prompt X takes baseline 100 ms for ten outputs and speculative 80 ms for ten. Prompt Y takes baseline 60 ms for six outputs and speculative 72 ms for six. Compute paired speedups and ms per token. Design the next reproducible comparison.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Keep prompt pairs separate before making any aggregate statement.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'X has speedup 1.25 and 10 versus 8 ms/token. Y has speedup about 0.8333 and 10 versus 12 ms/token. One pair improves and one slows down. One repetition gives no reliable variability estimate or general ranking. A valid follow-up freezes prompt selection, processing policies, seeds, arms, warmups, order, output limits, instrumentation and failure handling before collecting repetitions, then retains all results. Equal-seed sampled strings need not match.'
              }
            </Prose>
          </details>
        </section>

        <Program file="practice_answers.py" />
      </section>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
      >
        <span id="10-primary-sources" aria-hidden="true" />
        <H2>{'18. Further learning and readiness'}</H2>

        <Prose>
          {'For another explanation of the core mechanism, read '}
          <a href={'https://huggingface.co/blog/assisted-generation'}>
            {"Hugging Face's Assisted Generation article"}
          </a>
          {
            '. Its call/score walkthrough is accessible after sections 2–4; its 2023 API restrictions are historical, so use the pinned current program for execution. '
          }
          <a href={'https://github.com/stanford-cs336/lectures/blob/main/lecture_10.py'}>
            {'Stanford CS336 Lecture 10 companion source'}
          </a>
          {
            ' gives an intermediate systems treatment connecting memory traffic and speculative verification. The companion notes were the reviewed teaching resource; no video viewing is required to follow this lesson. The '
          }
          <a href={'https://huggingface.co/blog/dynamic_speculation_lookahead'}>
            {'dynamic-lookahead article'}
          </a>
          {
            ' is useful after the cost model for comparing confidence heuristics with an oracle, with hardware-specific measurements kept in context.'
          }
        </Prose>

        <Prose>
          {'For precise technical claims, '}
          <a href={'https://proceedings.mlr.press/v202/leviathan23a.html'}>
            {'Leviathan, Kalman and Matias'}
          </a>
          {
            ' derive exact speculative decoding, conditional cost models and explicitly relaxed alternatives. '
          }
          <a href={'https://arxiv.org/abs/2302.01318'}>{'Chen and colleagues'}</a>
          {
            ' independently develop speculative sampling; their target/proposal symbol convention differs, so follow the role rather than copying a letter. '
          }
          <a href={'https://arxiv.org/abs/2305.09781'}>{'SpecInfer'}</a>
          {' supplies the broader tree-verification systems setting. '}
          <a href={'https://arxiv.org/abs/2401.10774'}>{'Medusa'}</a>
          {', '}
          <a href={'https://arxiv.org/abs/2401.15077'}>{'EAGLE-1'}</a>
          {' and '}
          <a href={'https://arxiv.org/abs/2503.01840'}>{'EAGLE-3'}</a>
          {
            ' support the distinct learned-proposer mechanisms. Their trained checkpoints and published benchmarks were not reproduced by our tiny mechanical programs.'
          }
        </Prose>

        <Prose>
          {'The '}
          <a href={'https://huggingface.co/docs/transformers/main/en/assisted_decoding'}>
            {'current Transformers assisted-decoding guide'}
          </a>
          {
            ' describes ordinary extension routes and tokenizer conditions. It is a moving guide; the executable behavior here is pinned to 5.19.0 and its inspected implementation. '
          }
          <a href={'https://docs.vllm.ai/en/stable/features/speculative_decoding/'}>
            {"vLLM's speculative-decoding documentation"}
          </a>
          {
            ' is a practical next resource for engine integration, using its current nested configuration and version-specific compatibility conditions. No local vLLM execution is claimed.'
          }
        </Prose>

        <Prose>
          {
            "You are ready to use the mechanism when you can trace a first rejection and an all-accepted round, derive one-token mass recovery, explain why a stale suffix is invalid, name both caches' next valid inputs, distinguish tree score correctness from selection correctness, and diagnose a measured slowdown without changing the target policy to hide it. Try the exact enumerator with a changed valid finite model before modifying a native generation path."
          }
        </Prose>

        <Prose>
          {'Next, '}
          <a
            href={
              '/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models'
            }
          >
            {'Prefix Caching & Prompt Caching'}
          </a>
          {
            ' changes what is reused. Speculation computes provisional future work that may be discarded; prefix caching reuses already computed shared past work. Both depend on precise history identity, but their validity questions differ.'
          }
        </Prose>
      </section>
    </div>
  );
}
export default {
  title: 'Speculative Decoding',
  readTime: '~100 min read + programs and practice',
  hasIntegratedGuide: true,
  content: SpeculativeLesson,
};
