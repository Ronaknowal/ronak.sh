// Static projection of the complete independently accepted manuscript.
import { Prose, H2, H3, CodeBlock } from '../../../../src/learn/components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../../../src/learn/components/content/Math.jsx';
import RemoteCodeBlock from '../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { useCodeDownload } from '../../../../src/learn/components/content/LessonCodeDownloads.jsx';
import {
  RLAIFScroll,
  RLAIFTable as NeuralTable,
  FeedbackObjectiveAxes,
  FullComparisonRecord,
  CompiledJudgePrompt,
  ConditionalOptionMass,
  MappedOrderWires,
  LabelValidityRows,
  SoftTargetTransforms,
  RewardHeadWiring,
  SoftBCELossGradient,
  DistilledDirectRoutes,
  RatingDistributionMap,
  FinitePolicyScoreVectors,
  SnapshotTimeline,
  AlignedGatherMatrix,
  SumMeanTokenScores,
  CausalTargetMask,
  RelativeGainCoordinates,
  IPOAndDPOCoordinates,
  ContradictoryPreferenceCounts,
  FourActionPreferenceMatrix,
  PreferenceTransformTilt,
  MissingSupportSimplex,
  GeometricTokenPool,
  OddsContrast,
  SharedWeightGradients,
  TinyCausalArchitecture,
  SharedWarmStartFork,
  TrainerTargetMasks,
  NativeExplicitBridge,
  RealFeedbackPair,
  ActualTrainingTrajectories,
  PairedHeldoutOutcomes,
  MetricLineage,
  CountedModelWork,
  ControlledComparisonMatrix,
} from '../../../../src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx';
import '../../../../src/learn/components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <RLAIFScroll className="rf-math" label="Mathematical expression; scroll horizontally if needed">
    <SharedMathBlock>{children}</SharedMathBlock>
  </RLAIFScroll>
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn/examples/rlaif-methods/' + file}
    language="python"
    title={file}
    filename={file}
  />
);
const Old = ({ ids }) => ids.map((id) => <span key={id} id={id} aria-hidden="true" />);
const supporting = [
  'causal_backbone.py',
  'FILES.md',
  'observations/execution-binding.json',
  'observations/feedback-results.json',
  'observations/finite-results.json',
  'observations/judge-results.json',
  'observations/loop-results.json',
  'observations/losses-results.json',
  'observations/native-results.json',
  'observations/records-results.json',
  'observations/training-results.json',
  'provenance.json',
  'README.md',
  'records.json',
  'requirements.txt',
  'response_scores.py',
  'selection.json',
  'study-protocol.md',
  'UltraFeedback-LICENSE.txt',
];
function SupportingFile({ file }) {
  useCodeDownload({
    filename: file.split('/').at(-1),
    kind: 'asset',
    downloadUrl: '/learn/examples/rlaif-methods/' + file,
    title: file,
  });
  return null;
}
function RLAIFLesson() {
  return (
    <div className="lesson-flow rlaif-flow">
      {supporting.map((file) => (
        <SupportingFile key={file} file={file} />
      ))}
      <Prose opening="summary">
        {
          'A comparison can change training in two different places: who supplies the feedback, and what objective turns that feedback into a parameter update. Follow one pair through an AI judge, a learned reward, a policy update and two alternative preference objectives. You will see the intermediate probabilities and gradients, then run complete scratch and current-library programs on retained real records.'
        }
      </Prose>

      <Prose opening="route">
        {
          'The small experiments here teach mechanisms. Released labels are AI judgments; a local small judge is another imperfect observer. Neither is human ground truth. The finite calculations, native-library parity and held-out model diagnostics answer different questions, which we keep separate throughout.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {'Prerequisites: '}
        <a
          href={
            '/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models#2-four-scores-replace-a-sampled-loop'
          }
        >
          {"DPO's four scores"}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models#4-a-response-score-comes-from-tokens'
          }
        >
          {'response targets'}
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
            '/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models#5-learn-a-reward-from-those-labels'
          }
        >
          {"CAI's preference reward"}
        </a>
        {
          ' are useful. We refresh the operations needed here. Basic Python, probabilities, logarithms and derivatives help; a research background is not required.'
        }
      </Prose>

      <Old ids={['1-why-it-exists', '1-start-with-the-problem']} />
      <H2>{'1. Separate the feedback source from the learning rule'}</H2>

      <FeedbackObjectiveAxes />

      <Prose>
        {
          'Read the two coordinates independently. The vertical coordinate asks where a judgment came from: a person, an AI labeler or a task checker. The horizontal coordinate asks how training uses it: fit a reward and sample policy responses, or apply a direct objective to stored pairs. Moving vertically does not choose the horizontal coordinate. AI-labelled pairs can train DPO or IPO; an AI judge can also feed a sampled reinforcement-learning loop.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'RLAIF'}</strong>
        {
          ' means reinforcement learning from AI feedback. In the studied Lee et al. recipe, a labeler supplies preference distributions, a reward model learns those labels and REINFORCE updates the policy. Their direct variant scores each fresh policy response with the labeler instead of a learned reward. '
        }
        <strong>{'IPO'}</strong>
        {
          ', Identity Preference Optimization, changes the preference objective and its finite target. '
        }
        <strong>{'ORPO'}</strong>
        {
          ', Odds Ratio Preference Optimization, combines chosen-response imitation with an odds contrast without a reference model. These names describe different mechanisms, so they are not mutually exclusive answers to one question. Chosen-response imitation is supervised fine-tuning, abbreviated '
        }
        <strong>{'SFT'}</strong>
        {': the model learns to predict the supplied chosen target tokens. '}
        <a href={'https://arxiv.org/html/2309.00267v2'}>{'Lee et al., §§2.1–2.3'}</a>
        {', '}
        <a href={'https://proceedings.mlr.press/v238/gheshlaghi-azar24a.html'}>
          {'Azar et al., §4'}
        </a>
        {', '}
        <a href={'https://aclanthology.org/2024.emnlp-main.626/'}>{'Hong et al., §3'}</a>
        {'.'}
      </Prose>

      <FullComparisonRecord />

      <Prose>
        {
          'Our constructed source note says: “The workshop is on Friday, starts at 10 am, takes place in Room 4, and requires no booking.” The request is “Tell a visitor when and where to come, and whether booking is needed.” A says “Come on Friday at 10 am to Room 4; no booking is needed.” B says “Come on Friday at 10 am to Room 4.” C says “Come on Friday at 10 am to Room 4; booking is required.”'
        }
      </Prose>

      <Prose>
        {
          'A, B and C retain their blue, rose and violet identities when their displayed positions change. Under a criterion of accurate and complete visitor guidance, B omits useful information and C contradicts the note. The preference record must preserve that criterion, the request, source context and both full responses. A winner ID without its context cannot explain what was preferred.'
        }
      </Prose>

      <Prose>
        {
          'This is a teaching example whose facts we can inspect. Later released records have historical AI scores. We retain those original labels without presenting our own judgment or a new small-model score as their replacement. The task, criterion and data unit come before the training rule.'
        }
      </Prose>

      <Old ids={['2-core-intuition', '2-build-the-intuition']} />
      <H2>{'2. Trace what the judge actually sees'}</H2>

      <CompiledJudgePrompt />

      <Prose>
        {
          "The comparison prompt puts the request and criterion before “Response 1” and “Response 2”, then asks which better satisfies the criterion. A response's identity is separate from its option number. The decoder is asked to emit an option such as "
        }
        <code>{'1'}</code>
        {'; it is not asked to predict all the source text again.'}
      </Prose>

      <Prose>
        {
          "Our native demonstration uses the pinned small encoder-decoder Flan-T5 model. The complete comparison prompt lives in its encoder. The option's target IDs, including its end-of-sequence token, live in the decoder labels. T5 shifts those labels internally to construct preceding decoder inputs. A causal GPT-2 instead puts context and response in one sequence and shifts predictions against next tokens. These are different input/target arrangements, not interchangeable calls to a generic “score” function."
        }
      </Prose>

      <ConditionalOptionMass />

      <Prose>
        {
          'Suppose the judge assigns mass .3 to option A, .1 to option B and .6 to all other outputs. Restricting attention to A and B gives '
        }
        <code>{'.3 / (.3 + .1) = .75'}</code>
        {
          '. The .6 has not disappeared from the underlying distribution; we excluded it when defining the conditional comparison. A high conditional preference can coexist with low unrestricted mass on either valid answer. It is not automatically a calibrated 75% human preference probability.'
        }
      </Prose>

      <Prose>
        {'Let '}
        <code>{'s₁'}</code>
        {' and '}
        <code>{'s₂'}</code>
        {
          ' be option log probabilities. Conditional normalization can be computed stably without exponentiating large negative numbers separately:'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'q_1=\\frac{e^{s_1}}{e^{s_1}+e^{s_2}}\n=\\sigma(s_1-s_2),\\qquad \\sigma(z)=\\frac{1}{1+e^{-z}}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'Lee et al. take the next-token distribution over designated option tokens. Our program scores each '
        }
        <strong>{'complete'}</strong>
        {
          " option string including EOS. This handles an option that occupies multiple tokens, but it also adds the model's stopping probability. It is a declared extension, not an exact replication of their next-token label protocol. Raw scores and every target ID remain available. "
        }
        <a href={'https://arxiv.org/html/2309.00267v2#A2'}>{'Lee et al., Appendix B'}</a>
        {'.'}
      </Prose>

      <MappedOrderWires />

      <Prose>
        {
          "Now swap the responses. If A was first and received probability .8, then A is second in the swapped prompt. Suppose the judge gives the new first option B probability .4. A's mapped probability is therefore "
        }
        <code>{'1 − .4 = .6'}</code>
        {'. Average the two probabilities for '}
        <strong>{"A's identity"}</strong>
        {': '}
        <code>{'(.8 + .6) / 2 = .7'}</code>
        {
          '. Averaging the two first-position scores directly would give .6 and answer the wrong question. The order gap is '
        }
        <code>{'|.8 − .6| = .2'}</code>
        {'.'}
      </Prose>

      <Prose>
        {
          'Mapped averaging can reduce one form of position dependence. It neither proves the criterion was interpreted correctly nor removes every judge bias. Keep both passes and their gap. Ties, disagreements and large gaps are observations to inspect, not reasons to hide rows until agreement looks good.'
        }
      </Prose>

      <LabelValidityRows />

      <Prose>
        {
          'A missing result has no preference probability. In a text-generation route an unparsed answer also remains unknown; replacing it with .5 invents a tie. In our full-option likelihood route, inputs beyond the 512-token encoder budget remain unavailable. We select the first four eligible training pairs using token counts in both orders before observing judge outcomes, with no truncation. The browser later replays those saved scores; it does not run this model.'
        }
      </Prose>

      <Program file="judge_labels.py" />

      <Prose>
        {''}
        <code>{'comparison_prompt'}</code>
        {' compiles the actual request, criterion and ordered responses. '}
        <code>{'prepare_inputs'}</code>
        {' selects by token budget alone. '}
        <code>{'score_option'}</code>
        {
          ' gathers one target log probability at each decoder position and sums it, including EOS. '
        }
        <code>{'distribution'}</code>
        {' normalizes only the declared options. '}
        <code>{'run'}</code>
        {
          " maps the swapped second option back to the chosen response before averaging. The single-answer rating route is explained in section 4. Its values remain a separate observation from the released record's historical source score."
        }
      </Prose>

      <Old ids={['3-mathematical-foundation', '3-make-the-idea-precise']} />
      <H2>{'3. Learn a reward from a soft preference'}</H2>

      <SoftTargetTransforms />

      <Prose>
        {'The mapped '}
        <code>{'.7'}</code>
        {
          ' target says the supplied comparison favors A while retaining probability .3 for B. A hard target turns that into “A wins” with probability 1. Multiplying a hard-A loss by .7 is yet another operation. It reduces the strength of an A-only update, but it omits the B outcome. The distinction matters when feedback is uncertain or contradictory.'
        }
      </Prose>

      <RewardHeadWiring />

      <Prose>
        {'The tiny reward head uses feature '}
        <code>{'.5'}</code>
        {' for A and '}
        <code>{'−.5'}</code>
        {' for B. Its one trainable weight is '}
        <code>{'g'}</code>
        {'. The scores are '}
        <code>{'g/2'}</code>
        {' and '}
        <code>{'−g/2'}</code>
        {', so their difference is exactly '}
        <code>{'g'}</code>
        {". The model's probability of preferring A is "}
        <code>{'p = sigmoid(g)'}</code>
        {'. At '}
        <code>{'g = 0'}</code>
        {', both scores are zero and '}
        <code>{'p = .5'}</code>
        {
          '. This makes every link from weight to score to preference visible. A text reward model would replace these fixed features with learned context/response representations; the loss on the score difference is the same local operation.'
        }
      </Prose>

      <SoftBCELossGradient />

      <Prose>
        {''}
        <strong>{'Binary cross-entropy'}</strong>
        {' compares the supplied target '}
        <code>{'q'}</code>
        {" with the reward head's preference "}
        <code>{'p'}</code>
        {'. Both outcomes contribute:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'L(g;q)=-q\\log\\sigma(g)-(1-q)\\log\\sigma(-g).'}</MathBlock>
      </div>

      <Prose>
        {'Equivalently, use '}
        <code>{'q·softplus(−g) + (1−q)·softplus(g)'}</code>
        {', where '}
        <code>{'softplus(z) = log(1+exp(z))'}</code>
        {' is evaluated with a stable library operation. Differentiate the full expression:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\frac{\\partial L}{\\partial g}=p-q.'}</MathBlock>
      </div>

      <Prose>
        {'With '}
        <code>{'q = .8'}</code>
        {' and '}
        <code>{'p = .5'}</code>
        {', the loss is '}
        <code>{'log(2) ≈ .693147'}</code>
        {', and the derivative is '}
        <code>{'−.3'}</code>
        {'. Gradient descent raises '}
        <code>{'g'}</code>
        {', moving the predicted preference toward .8. The A-only weighted loss '}
        <code>{'.8·softplus(−g)'}</code>
        {' instead has loss '}
        <code>{'.554518'}</code>
        {' and derivative '}
        <code>{'−.4'}</code>
        {
          ' at that point. Its optimum still drives the preference toward 1 if the weight stays positive. These are not the same target or optimum.'
        }
      </Prose>

      <Prose>
        {'For a single repeated target '}
        <code>{'q'}</code>
        {' strictly between zero and one, the full loss is minimized at '}
        <code>{'p = q'}</code>
        {', hence '}
        <code>{'g = log(q/(1−q))'}</code>
        {
          '. Changing every score by the same constant leaves their difference unchanged: preference fitting cannot identify an absolute reward offset. The reference policy used later is a different object; it is not the judge and does not resolve a missing data label.'
        }
      </Prose>

      <Program file="feedback_learning.py" />

      <Prose>
        {''}
        <code>{'RewardHead.forward'}</code>
        {' multiplies the two visible features by its scalar weight. '}
        <code>{'soft_preference_loss'}</code>
        {' retains both label terms. The program fits the constructed '}
        <code>{'q = .7'}</code>
        {
          ' gap for the declared 64 SGD updates, starting at zero with learning rate .1. Each update checks the actual autograd derivative against '
        }
        <code>{'p − q'}</code>
        {
          '. The program stores its full trajectory and final two rewards, which the next program uses without fitting the reward again. This is one constructed mechanism fit, not evidence that a reward model recognizes useful language.'
        }
      </Prose>

      <Old ids={['6-visual-walkthrough']} />
      <H2>{'4. Compare distilled and direct AI reward'}</H2>

      <DistilledDirectRoutes />

      <Prose>
        {
          'In the distilled route, the AI labeler scores stored comparisons; a reward model learns those labels. During policy training, the reward model scores each newly sampled response. In the direct route, the AI labeler scores each fresh response itself. Direct feedback removes that reward-model approximation while adding labeler work to the online loop. It does not remove approximation in the labeler.'
        }
      </Prose>

      <Prose>
        {
          "Lee et al.'s direct route evaluates one answer using a distribution over ratings 1 through 10. It is not the pairwise probability "
        }
        <code>{'q'}</code>
        {
          ' from the previous section. An answer does not need a freshly paired competitor in that rating prompt. Our native demonstration likewise preserves two separately compiled single-answer rating prompts, then scores all ten complete rating strings.'
        }
      </Prose>

      <RatingDistributionMap />

      <Prose>
        {'Consider rating mass .1 at 1, .2 at 5 and .7 at 10. The expected rating is '}
        <code>{'.1×1 + .2×5 + .7×10 = 8.1'}</code>
        {'. Linearly map the endpoints 1 and 10 to −1 and 1:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\bar s=\\sum_{k=1}^{10}k\\,P(k\\mid x,y),\\qquad\nr_{\\rm direct}=2\\frac{\\bar s-1}{9}-1.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'This example gives reward '}
        <code>{'.577778'}</code>
        {
          '. Moving rating mass changes the expected score and therefore the policy update. The mapping is a reward convention; it does not certify the underlying rating is correct. '
        }
        <a href={'https://arxiv.org/html/2309.00267v2'}>{'Lee et al., §2.3'}</a>
        {'.'}
      </Prose>

      <FinitePolicyScoreVectors />

      <Prose>
        {'Our finite policy chooses between two fixed responses. Let its probabilities be '}
        <code>{'π'}</code>
        {', its supplied rewards be '}
        <code>{'r'}</code>
        {', and its fixed reference be '}
        <code>{'π₀'}</code>
        {'. A policy objective balances expected reward against drift from that reference:'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'J=\\sum_i\\pi_i r_i-\\beta\\sum_i\\pi_i\\log\\frac{\\pi_i}{\\pi_{0i}}.'}
        </MathBlock>
      </div>

      <Prose>
        {'The second sum is '}
        <code>{'KL(π || π₀)'}</code>
        {
          '. This expression requires positive reference support wherever the policy has positive probability; assigning policy mass to a zero-reference action makes this KL infinite. Our two-action trace uses reference '
        }
        <code>{'[.5,.5]'}</code>
        {', so both actions have support. '}
        <code>{'β'}</code>
        {
          " controls this objective's regularization strength and is distinct from an IPO target parameter."
        }
      </Prose>

      <Prose>
        {'For softmax logits '}
        <code>{'z'}</code>
        {', the score-function derivative of sampled action '}
        <code>{'i'}</code>
        {' is '}
        <code>{'eᵢ − π'}</code>
        {', where '}
        <code>{'eᵢ'}</code>
        {
          ' has 1 at that action and 0 elsewhere. Multiply it by the sampled reward minus a baseline. An action-independent baseline changes the sampled estimator but leaves its expectation unchanged because the expected score vector is zero. Detach reward and baseline: differentiating through the baseline would add an unintended update.'
        }
      </Prose>

      <Prose>
        {'The exact gradient for action logit '}
        <code>{'j'}</code>
        {' is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\frac{\\partial J}{\\partial z_j}\n=\\pi_j\\left[u_j-\\sum_i\\pi_i u_i\\right],\\qquad\nu_i=r_i-\\beta\\log\\frac{\\pi_i}{\\pi_{0i}}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The derivative of the extra '}
        <code>{'−β'}</code>
        {
          ' constant cancels because probabilities sum to one. The program checks this expression against autograd and explicitly enumerates baseline cancellation. A token policy uses the same score identity at each generated position; '
        }
        <a
          href={
            '/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models#6-a-response-is-a-sequence-of-actions'
          }
        >
          {"RLHF's response sequence"}
        </a>
        {
          ' shows how those positions accumulate. Lee et al. use REINFORCE rather than a mandatory PPO loop. We do not insert a clipped objective into their recipe.'
        }
      </Prose>

      <SnapshotTimeline />

      <Prose>
        {
          'The reference snapshot stays fixed during these traces. The labeler also stays fixed, and distilled rewards come from the one saved reward-gap fit. Only the policy logits move in the finite update. An old rollout policy, used by algorithms that reuse samples, is another role; changing an optimizer step does not silently replace the fixed reference. Snapshot identity makes these roles checkable.'
        }
      </Prose>

      <Program file="rlaif_loop.py" />

      <Prose>
        {''}
        <code>{'gradient_probe'}</code>
        {' compares the exact expected objective with autograd. '}
        <code>{'trace'}</code>
        {
          ' samples an action using a fixed generator, computes a detached baseline from the current expected reward, then differentiates the sampled negative-reward loss plus exact KL. It performs the declared 64 updates for each route and saves every action, probability and gradient. Distilled rewards are the actual frozen head outputs; direct rewards are the constructed rating values '
        }
        <code>{'[.577778,0]'}</code>
        {
          '. Their scales differ, so faster movement in one trace would not show that its feedback source is better.'
        }
      </Prose>

      <Old ids={['4-from-scratch-implementation']} />
      <H2>{'5. Score the response at the right token positions'}</H2>

      <AlignedGatherMatrix />

      <Prose>
        {
          'Before changing a preference objective, make its response score correct. The three prediction rows contain token probabilities '
        }
        <code>{'[.1,.2,.6,.1]'}</code>
        {', '}
        <code>{'[.1,.7,.1,.1]'}</code>
        {' and '}
        <code>{'[.1,.2,.2,.5]'}</code>
        {'. Their actual target IDs are 2, 1 and 3. Select '}
        <code>{'.6'}</code>
        {' from row 0, '}
        <code>{'.7'}</code>
        {' from row 1 and '}
        <code>{'.5'}</code>
        {' from row 2. The aligned product is '}
        <code>{'.21'}</code>
        {'; the sum of the three log probabilities is '}
        <code>{'log(.21) ≈ −1.560648'}</code>
        {'.'}
      </Prose>

      <Prose>
        {
          'Selecting every target ID from every time row instead yields nine values. That Cartesian square includes scores for targets at positions where they did not occur. The correct operation gathers one vocabulary coordinate for each prediction row: '
        }
        <code>{'logps.gather(-1, target_ids[..., None])'}</code>
        {
          '. A convenient-looking tensor expression does not establish alignment; inspect the selected cells and shapes.'
        }
      </Prose>

      <SumMeanTokenScores />

      <Prose>
        {'For a response with '}
        <code>{'T'}</code>
        {' scored tokens, define'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\ell(y\\mid x)=\\sum_{t=1}^{T}\\log\\pi(y_t\\mid x,y_{<t}),\\qquad\n\\bar\\ell(y\\mid x)=\\frac{\\ell(y\\mid x)}{T}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The sum is the log probability of this complete token sequence under the declared factorization. The mean is a length-normalized token score. Responses of different lengths may change order when you replace sums with means. Divide each response by '
        }
        <strong>{'its own'}</strong>
        {
          ' count; dividing a chosen-minus-rejected sum by one common length generally gives a different quantity.'
        }
      </Prose>

      <CausalTargetMask />

      <Prose>
        {'The input is a beginning-of-sequence marker ('}
        <strong>{'BOS'}</strong>
        {'), the full prompt, a separator ('}
        <strong>{'SEP'}</strong>
        {'), the response and an end-of-sequence marker ('}
        <strong>{'EOS'}</strong>
        {'). Artificial padding ('}
        <strong>{'PAD'}</strong>
        {
          ") fills a batch's remaining positions. The predictor at one position scores the next token. The completion mask selects response targets including genuine EOS. The attention mask marks which positions are real context rather than padding. Prompt tokens remain visible as context even when they are excluded from this response loss. PAD and EOS can share an ID; their position masks must still distinguish artificial padding from a real stop target. A blanket "
        }
        <code>{'token_id != EOS'}</code>
        {' mask would delete real training targets.'}
      </Prose>

      <Program file="records_and_masks.py" />

      <Prose>
        {''}
        <code>{'load_records'}</code>
        {' retains full released rows and their original source scores. '}
        <code>{'vocabulary_for'}</code>
        {' reads only training text. '}
        <code>{'prepare'}</code>
        {' constructs whole token sequences without truncation. '}
        <code>{'rows_batch'}</code>
        {
          ' puts all chosen responses before all rejected responses, an order used by the later losses. The unmodified inspected '
        }
        <code>{'response_scores.py'}</code>
        {
          ' dependency shifts masks with targets, applies log-softmax, gathers aligned cells and returns both sums and counts. The constructed checks compare explicit selected targets with PyTorch cross-entropy and verify PAD=EOS does not erase genuine EOS. The reused causal model and scoring files are supplied in the '
        }
        <a href={'/learn/examples/rlaif-methods/FILES.md'}>{'file index'}</a>
        {'.'}
      </Prose>

      <H2>{'6. Give the relative preference margin a finite target'}</H2>

      <RelativeGainCoordinates />

      <Prose>
        {
          "Recall DPO's four-score comparison. Subtract each reference response score from its policy score, then compare chosen and rejected gains. Here we explicitly use each response's "
        }
        <strong>{'mean'}</strong>
        {' log score, matching current TRL IPO. Let'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'h=(\\bar\\ell_\\theta(y_A\\mid x)-\\bar\\ell_0(y_A\\mid x))\n -(\\bar\\ell_\\theta(y_B\\mid x)-\\bar\\ell_0(y_B\\mid x)).'
          }
        </MathBlock>
      </div>

      <Prose>
        {''}
        <code>{'h = 0'}</code>
        {
          ' says the two responses gained equally relative to the reference. It does not say their absolute probabilities are equal. A displayed '
        }
        <code>{'τh'}</code>
        {' is a different coordinate from raw '}
        <code>{'h'}</code>
        {
          "; label the axis before comparing a target. The earlier DPO lesson's ordinary sigmoid implementation uses "
        }
        <strong>{'summed'}</strong>
        {
          ' scores. This normalization change is a visible implementation convention, not an algebraic cancellation that preserves every sequence margin.'
        }
      </Prose>

      <IPOAndDPOCoordinates />

      <Prose>{'IPO fits a finite preferred margin:'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'c=\\frac{1}{2\\tau},\\qquad L_{\\rm IPO}=(h-c)^2,\n\\qquad \\frac{\\partial L_{\\rm IPO}}{\\partial h}=2(h-c).'
          }
        </MathBlock>
      </div>

      <Prose>
        {'At '}
        <code>{'τ = .5'}</code>
        {', the target is '}
        <code>{'c = 1'}</code>
        {'. Margins '}
        <code>{'−1,0,1,2'}</code>
        {' give losses '}
        <code>{'4,1,0,1'}</code>
        {' and derivatives '}
        <code>{'−4,−2,0,2'}</code>
        {
          '. Below the target, descent increases the margin; above it, descent decreases the margin. That reversal is the local finite-target mechanism. It does not guarantee every model parameter or absolute response probability stays near its reference value.'
        }
      </Prose>

      <Prose>
        {'For comparison, a sigmoid DPO loss on the '}
        <strong>{'same supplied margin coordinate'}</strong>
        {' is '}
        <code>{'softplus(−βh)'}</code>
        {', with derivative '}
        <code>{'−β·sigmoid(−βh)'}</code>
        {
          '. It keeps encouraging a larger preferred margin while that derivative approaches zero. The derivative with respect to '
        }
        <code>{'h'}</code>
        {' is bounded between '}
        <code>{'−β'}</code>
        {
          ' and 0; a large log ratio does not prove an unbounded gradient. A parameter gradient also multiplies this local derivative by how the model produces '
        }
        <code>{'h'}</code>
        {'.'}
      </Prose>

      <Prose>
        {'The published IPO Algorithm 1 multiplies the square by positive '}
        <code>{'τ'}</code>
        {
          '; the v1 formulation and current pinned trainer omit that prefactor. With a fixed positive '
        }
        <code>{'τ'}</code>
        {', the minimizer is the same, while gradients differ by a factor of '}
        <code>{'τ'}</code>
        {
          '. A learning-rate comparison must account for that difference. Our explicit/native bridge follows the pinned no-prefactor convention. '
        }
        <a href={'https://proceedings.mlr.press/v238/gheshlaghi-azar24a/gheshlaghi-azar24a.pdf'}>
          {'Azar et al., Algorithm 1'}
        </a>
        {'.'}
      </Prose>

      <ContradictoryPreferenceCounts />

      <Prose>
        {'Now suppose the same pair is labelled A-wins with probability '}
        <code>{'q'}</code>
        {' and B-wins with probability '}
        <code>{'1−q'}</code>
        {'. Its expected square is'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'\\mathbb E L=q(h-c)^2+(1-q)(h+c)^2.'}</MathBlock>
      </div>

      <Prose>
        {'Differentiate, set the derivative to zero, and obtain '}
        <code>{'h* = c(2q−1)'}</code>
        {'. The irreducible minimum is '}
        <code>{'4c²q(1−q)'}</code>
        {'. With '}
        <code>{'q = .7'}</code>
        {' and '}
        <code>{'c = 1'}</code>
        {', the best margin is '}
        <code>{'.4'}</code>
        {', not 1, and the minimum is '}
        <code>{'.84'}</code>
        {
          ', not zero. Contradictory labels cannot all achieve their individual target. Under ordinary sigmoid DPO with the same finite-action setting, the optimum instead satisfies '
        }
        <code>{'βh = log(q/(1−q))'}</code>
        {'. Neither result validates the preference labels themselves.'}
      </Prose>

      <Prose>
        {
          'The next section asks what these local margins imply for a whole policy. That requires assumptions about normalization, observed support and preference structure; the square alone is not the complete story.'
        }
      </Prose>

      <H2>{'7. Deeper: probabilities, cycles and missing support'}</H2>

      <FourActionPreferenceMatrix />

      <Prose>
        {
          'Start with an actual finite set of actions, each treated as one event. Here a policy is a normalized probability vector, not an exponentiated mean token score. '
        }
        <code>{'P(i beats j)'}</code>
        {
          ' fills a preference matrix. Its diagonal is .5 and opposing entries sum to 1. A behavior distribution '
        }
        <code>{'μ'}</code>
        {
          ' says how often competitors are sampled. An expected preference score averages each row against that distribution.'
        }
      </Prose>

      <Prose>
        {
          'The published IPO example uses four actions. A beats B with probability .99; B beats C with probability .75; C beats A with probability .75. Those three form a cycle, so a single global scalar ranking cannot reproduce all pairwise choices. D beats each of them with probability .75. Against uniform behavior, the row averages are '
        }
        <code>{'.4975, .3775, .4375, .6875'}</code>
        {
          '. The literal matrix makes the cycle and the average against a competitor distribution separate objects. '
        }
        <a href={'https://proceedings.mlr.press/v238/gheshlaghi-azar24a/gheshlaghi-azar24a.pdf'}>
          {'Azar et al., §5.2'}
        </a>
        {'.'}
      </Prose>

      <PreferenceTransformTilt />

      <Prose>
        {'The broader paper studies a transformation '}
        <code>{'Ψ'}</code>
        {' applied to each pairwise preference probability before averaging. Identity uses '}
        <code>{'Ψ(p)=p'}</code>
        {'; logit uses '}
        <code>{'log(p/(1−p))'}</code>
        {
          '. Identity keeps values between 0 and 1. Logit maps probabilities near the endpoints to large magnitudes and needs care at exactly 0 or 1. This changes the objective, rather than simply rescaling an already averaged score: in general, transforming an average differs from averaging transformed values.'
        }
      </Prose>

      <Prose>
        {'For finite actions define '}
        <code>{'sᵢ = Σⱼ μⱼ Ψ(P(i beats j))'}</code>
        {
          '. Maximizing its expected value with a positive-temperature reference KL gives the normalized tilt'
        }
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {'\\pi_i^*=\n\\frac{\\pi_{0i}\\exp(s_i/\\tau)}{\\sum_k\\pi_{0k}\\exp(s_k/\\tau)}.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'Multiply each reference probability by its exponential preference weight, then divide by the total. At uniform reference, uniform behavior and '
        }
        <code>{'τ = .1'}</code>
        {', the published identity matrix yields approximately '}
        <code>{'[.117152,.035286,.064295,.783268]'}</code>
        {'. D has the largest mass. Adding the same constant to every '}
        <code>{'sᵢ'}</code>
        {
          ' changes all unnormalized weights by the same factor and cancels after division. Smaller '
        }
        <code>{'τ'}</code>
        {
          ' concentrates the distribution more strongly on score differences; zero reference mass excludes an action from this finite-KL support. The program uses log-space softmax to evaluate the tilt stably.'
        }
      </Prose>

      <Prose>
        {'The derivation introduces a normalization multiplier for '}
        <code>{'Σᵢ πᵢ=1'}</code>
        {'. Differentiating with respect to a supported action gives '}
        <code>{'sᵢ − τ(log(πᵢ/π₀ᵢ)+1) + constant = 0'}</code>
        {'; solving for '}
        <code>{'πᵢ'}</code>
        {
          ' produces the exponential form. This argument assumes the finite objective and declared support. It does not make a length-normalized language-model score into a normalized probability over all strings.'
        }
      </Prose>

      <Prose>
        {'For the repeated two-action labels in section 6, use reference '}
        <code>{'[.4,.6]'}</code>
        {', '}
        <code>{'q=.7'}</code>
        {' and '}
        <code>{'τ=.5'}</code>
        {'. The IPO margin '}
        <code>{'.4'}</code>
        {' means the policy odds relative to the reference odds are multiplied by '}
        <code>{'exp(.4)'}</code>
        {'. Normalize to obtain A mass approximately '}
        <code>{'.498634'}</code>
        {'. The comparable sigmoid DPO finite-action optimum at '}
        <code>{'β=.5'}</code>
        {' gives A mass '}
        <code>{'.784'}</code>
        {
          '. They encode different objectives; the larger mass is not evidence of a more correct preference.'
        }
      </Prose>

      <MissingSupportSimplex />

      <Prose>
        {
          'Now only A versus B is observed; C never appears in the behavior sample. With uniform reference and target '
        }
        <code>{'h_AB=1'}</code>
        {', the observed pair fixes '}
        <code>{'π_A/π_B=e'}</code>
        {
          '. It does not fix how much total mass remains on A and B. Put .3 on the observed pair: A gets '
        }
        <code>{'.219318'}</code>
        {', B gets '}
        <code>{'.080682'}</code>
        {' and C gets .7. Put .9 on the pair: A gets '}
        <code>{'.657953'}</code>
        {', B gets '}
        <code>{'.242047'}</code>
        {
          ' and C gets .1. Both have the same observed margin and zero observed pair square. The simplex displays that entire family.'
        }
      </Prose>

      <Prose>
        {
          'For a separate constructed example, add the constraint A versus C with the same target and uniform reference. Both '
        }
        <code>{'π_A/π_B=e'}</code>
        {' and '}
        <code>{'π_A/π_C=e'}</code>
        {' then hold. Normalization uniquely gives '}
        <code>{'[e/(e+2),1/(e+2),1/(e+2)]'}</code>
        {
          ". This small connected constraint system illustrates what additional coverage supplies; it is not a replacement for the paper's distributional assumptions and support proof. Missing behavior support is an explicit nonuniqueness case in Appendix A.2."
        }
      </Prose>

      <Program file="finite_preferences.py" />

      <Prose>
        {''}
        <code>{'noisy_square'}</code>
        {
          ' computes both label directions; autograd confirms the derivative vanishes at the finite optimum. '
        }
        <code>{'identity_tilt'}</code>
        {
          ' multiplies the literal preference matrix by the behavior weights, combines the resulting scores with the reference in log space and normalizes. The missing-support calculation checks equal observed margins at different C masses. These are mathematical substitutions and derivative checks, with no neural fit or invented benchmark trajectory.'
        }
      </Prose>

      <H2>{'8. Couple imitation with a reference-free odds contrast'}</H2>

      <GeometricTokenPool />

      <Prose>
        {
          'ORPO keeps a chosen-response imitation term and adds a rejected-response contrast. Its contrast uses '
        }
        <code>{'q_y = exp(mean token log probability)'}</code>
        {', a geometric mean token score. For A with token probabilities '}
        <code>{'.8,.5'}</code>
        {', the sequence product is .4 and the geometric score is '}
        <code>{'sqrt(.4) ≈ .632456'}</code>
        {
          '. For B with four tokens of probability .5, the product is .0625 and the geometric score is .5. A product and a geometric mean answer different questions about these responses.'
        }
      </Prose>

      <Prose>
        {'These geometric scores do '}
        <strong>{'not'}</strong>
        {
          " form a normalized distribution over response strings. Their sum over arbitrary strings need not be 1. The paper's odds operation is therefore best traced as an objective on these declared scores, not as the literal probability of generating one whole response versus every other response. This qualification matters before interpreting its name. "
        }
        <a href={'https://aclanthology.org/2024.emnlp-main.626/'}>{'Hong et al., §3.1, Eq. 3'}</a>
        {'.'}
      </Prose>

      <OddsContrast />

      <Prose>
        {'For a score '}
        <code>{'q'}</code>
        {' between 0 and 1, odds are '}
        <code>{'q/(1−q)'}</code>
        {'. ORPO compares the chosen and rejected log odds. Write '}
        <code>{'a=mean logp_A'}</code>
        {' and '}
        <code>{'b=mean logp_B'}</code>
        {':'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            'o(a)=a-\\log(1-e^a),\\qquad m=o(a)-o(b),\n\\qquad L_{\\rm contrast}=\\operatorname{softplus}(-m).'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The worked geometric scores give '}
        <code>{'m ≈ .542766'}</code>
        {' and contrast loss '}
        <code>{'.458145'}</code>
        {'. The imitation loss is '}
        <code>{'−a=.458145'}</code>
        {'; at '}
        <code>{'λ=.1'}</code>
        {' the combined response-only loss is '}
        <code>{'.503960'}</code>
        {
          '. That equality between the two component losses is a property of this specific B score .5, not a general ORPO identity.'
        }
      </Prose>

      <Prose>{'Differentiate with respect to the mean-log coordinates:'}</Prose>

      <div className="neural-equation">
        <MathBlock>
          {
            '\\frac{\\partial L_{\\rm contrast}}{\\partial a}\n=-\\frac{\\sigma(-m)}{1-e^a},\\qquad\n\\frac{\\partial L_{\\rm contrast}}{\\partial b}\n=\\frac{\\sigma(-m)}{1-e^b}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          "The signs follow from minimizing the negative log-sigmoid objective: increasing the chosen coordinate reduces the contrast loss, while increasing the rejected coordinate increases it. The paper's printed derivative omits that leading negative-loss sign; follow the objective and verify it numerically. In this worked case the derivatives are "
        }
        <code>{'−1'}</code>
        {' and approximately '}
        <code>{'.735089'}</code>
        {'.'}
      </Prose>

      <Prose>
        {'The combined local response-only loss is '}
        <code>{'−a + λ·L_contrast'}</code>
        {
          '. Current TRL uses a different imitation mask, explained in section 10. For stable odds, compute '
        }
        <code>{'log(1−exp(a))'}</code>
        {' as '}
        <code>{'log(−expm1(a))'}</code>
        {' when '}
        <code>{'a<0'}</code>
        {'. '}
        <code>{'expm1'}</code>
        {
          ' preserves a tiny difference near zero instead of subtracting two rounded numbers. A score exactly at 1 has infinite odds and is outside this finite-input calculation.'
        }
      </Prose>

      <SharedWeightGradients />

      <Prose>
        {
          "Both responses depend on the same model parameters. One local coordinate improving does not guarantee a selected parameter update improves that response's absolute probability. Let one scalar weight "
        }
        <code>{'θ'}</code>
        {' produce target-token logits '}
        <code>{'θx_A'}</code>
        {' and '}
        <code>{'θx_B'}</code>
        {'. With '}
        <code>{'θ=0'}</code>
        {', '}
        <code>{'x_A=1'}</code>
        {' and '}
        <code>{'x_B=3'}</code>
        {', both target probabilities are .5. The imitation derivative with respect to '}
        <code>{'θ'}</code>
        {' is '}
        <code>{'−.5'}</code>
        {'; the contrast derivative is '}
        <code>{'+1'}</code>
        {'. The weighted total is '}
        <code>{'−.5 + λ'}</code>
        {'.'}
      </Prose>

      <Prose>
        {'At '}
        <code>{'λ=.1'}</code>
        {', descent with learning rate .01 changes '}
        <code>{'θ'}</code>
        {' to '}
        <code>{'.004'}</code>
        {'. At '}
        <code>{'λ=.5'}</code>
        {', the two derivatives cancel. At '}
        <code>{'λ=1'}</code>
        {', the parameter moves to '}
        <code>{'−.005'}</code>
        {
          ", lowering the chosen target probability even though the contrast prefers A relative to B. Both probabilities can fall while their relative odds improve. Change B's feature to "
        }
        <code>{'−1'}</code>
        {': the contrast derivative becomes '}
        <code>{'−1'}</code>
        {', reinforces imitation and moves '}
        <code>{'θ'}</code>
        {' to '}
        <code>{'.006'}</code>
        {' at '}
        <code>{'λ=.1'}</code>
        {'. Draw the paths before treating the two loss terms as independent knobs.'}
      </Prose>

      <Prose>
        {
          'SFT cross-entropy also has derivatives for non-target vocabulary logits. What plain chosen-response SFT lacks is an explicit contrast against the supplied rejected '
        }
        <strong>{'response'}</strong>
        {", not all gradients on non-target tokens. ORPO's joint parameter paths and "}
        <code>{'λ'}</code>
        {' determine how that contrast interacts with imitation.'}
      </Prose>

      <Program file="preference_losses.py" />

      <Prose>
        {''}
        <code>{'ipo_loss'}</code>
        {
          ' subtracts detached reference sums, divides by each response count and fits the finite target. '
        }
        <code>{'log_odds'}</code>
        {' uses the stable mean-log formula. '}
        <code>{'orpo_loss'}</code>
        {' combines imitation with the positive contrast penalty. '}
        <code>{'shared_weight'}</code>
        {
          ' maps one actual parameter through both sigmoid paths. The program compares autograd with symmetric finite differences and stores the component derivatives and actual one-step parameter values. Near-boundary calculations are finite-input checks, not claims that any coefficient prevents collapse or calibrates the resulting model.'
        }
      </Prose>

      <H2>{'9. Build one model and conserve its starting point'}</H2>

      <TinyCausalArchitecture />

      <Prose>
        {'The scratch study reuses the complete inspected TinyLM causal classes from '}
        <a
          href={
            '/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models#7-build-the-complete-causal-decoder'
          }
        >
          {'Causal Language Modeling'}
        </a>
        {
          ', via the exact supplied DPO dependency. Here B is the batch size, T is the padded sequence length and V is the vocabulary size. IDs '
        }
        <code>{'[B,T]'}</code>
        {
          ' select token embeddings of width 24; learned position vectors are added. One block applies a normalized causal attention path and a residual feed-forward path. Final normalization and a learned vocabulary head produce logits '
        }
        <code>{'[B,T,V]'}</code>
        {
          ". The next-target masks from section 5 turn those logits into each response's sum and count."
        }
      </Prose>

      <Prose>
        {
          'The causal triangular mask lets a response predictor use its full prompt and previous response tokens, but not future targets. Right padding occurs after real tokens and cannot change earlier causal values. The attention model and target mask answer different questions: what context a position may use, and which predictions belong in the objective. We retain the unmodified architecture instead of disguising Bernoulli success draws as language-model training.'
        }
      </Prose>

      <SharedWarmStartFork />

      <Prose>
        {
          "For each seed, fit one chosen-response SFT warm start. Clone that saved state into four continuations: SFT, DPO, IPO and ORPO. DPO and IPO use the same frozen warm state as their reference; ORPO has no reference in its objective. The SFT continuation shows what more chosen-response imitation alone does. All methods start from identical weights within a seed and receive the same fixed batch schedule. The drawing's shared ancestor establishes that equality; it does not establish that any descendant improved."
        }
      </Prose>

      <Prose>
        {
          'The representation uses full released prompts and responses, split into words and punctuation by a declared regex. Training text builds the vocabulary; held-out unfamiliar tokens map to UNK, and their counts are reported. BOS, SEP and EOS give the sequence boundary explicit IDs. Whole sequences fit a 196-position context without truncation. This tiny unpretrained model is not a useful assistant, and lexical-token perplexity is not subword-token perplexity.'
        }
      </Prose>

      <Prose>
        {
          'The protocol fixes seeds 17, 29 and 43, 64 warm-start updates and 80 continuation updates per arm. That is 15 real-data fits, not a sweep selecting three good runs. AdamW uses learning rate .001, betas '
        }
        <code>{'.9,.999'}</code>
        {', epsilon '}
        <code>{'1e−8'}</code>
        {
          ', zero weight decay and gradient-norm clipping at 1. Batch size is 6. Objective coefficients are DPO '
        }
        <code>{'.2'}</code>
        {', IPO '}
        <code>{'.5'}</code>
        {' and ORPO '}
        <code>{'.1'}</code>
        {
          "; these are one declared setting with different gradient scales, not each method's optimally tuned configuration. Terminal step 80 is fixed before observing held-out outcomes."
        }
      </Prose>

      <Program file="compare_training.py" />

      <Prose>
        {''}
        <code>{'prepared_inputs'}</code>
        {' saves the train-only vocabulary and all seeded batch schedules before fitting. '}
        <code>{'warm_start'}</code>
        {' performs response-only imitation. '}
        <code>{'continuation'}</code>
        {
          ' scores the correct target positions, calls the selected objective, computes its gradient, clips and updates the model. Checkpoints retain all records under their own objective and independent score diagnostics. '
        }
        <code>{'reference_cache'}</code>
        {
          ' scores the fixed reference once for these fixed representations; stale source, tokenizer or weight identity would invalidate that cache.'
        }
      </Prose>

      <Prose>
        {'The negative log-likelihood ('}
        <strong>{'NLL'}</strong>
        {
          ') is the negative sum of the selected target log probabilities. Divide by the stated target count to obtain a per-token NLL; perplexity ('
        }
        <strong>{'PPL'}</strong>
        {') is its exponential. '}
        <code>{'assess'}</code>
        {
          ' reports equal-response objective loss and separately computes token-weighted chosen NLL/PPL. An average of response means weights a short and long response equally; dividing total NLL by total targets weights each token equally. Both denominators are declared. The program saves initial, warm and final weights, restores final state files and checks their model digests. Its work counters measure actual forwarded batches, sequences, positions and target counts. Section 11 interprets the saved observations.'
        }
      </Prose>

      <Prose>
        {'The scratch ORPO arm is a '}
        <strong>{'warm-started response-only variant'}</strong>
        {
          ". It is not the paper's from-base monolithic recipe, and its imitation mask differs from the native trainer. That variation is deliberate for this common-start study and must stay in its visible name when reading results."
        }
      </Prose>

      <Old ids={['5-production-implementation']} />
      <H2>{"10. Make the ordinary trainer's convention visible"}</H2>

      <TrainerTargetMasks />

      <Prose>
        {
          'The ordinary-tool route builds a tiny GPT-2 from configuration and a fast WordLevel tokenizer. It uses the same lexical/punctuation representation, explicit BOS/SEP context and EOS completion, with dropout zero. The original source strings remain in '
        }
        <code>{'records.json'}</code>
        {
          '; the trainer receives their explicit spaced lexical representation. Verify its token IDs against the scratch representation before computing a loss. Reject an overbudget pair instead of quietly changing which response words survive.'
        }
      </Prose>

      <Prose>
        {'Current pinned TRL 1.14.2 configures IPO through '}
        <code>{"DPOConfig(loss_type=['ipo'])"}</code>
        {'. Its '}
        <code>{'beta'}</code>
        {" field is IPO's "}
        <code>{'τ'}</code>
        {' parameter here: target '}
        <code>{'1/(2·beta)'}</code>
        {
          " with no extra beta loss prefactor. The trainer averages each policy-reference response gain over that response's own completion count. An explicit separate frozen reference makes its role visible; ordinary other DPO reference modes are taught in the "
        }
        <a
          href={
            '/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models#9-freeze-what-a-reference-cache-means'
          }
        >
          {'reference-cache section'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {'ORPO is imported from '}
        <code>{'trl.experimental.orpo'}</code>
        {'. Experimental means its API can change; pin the version and inspect its contract. Its '}
        <code>{'beta'}</code>
        {' field weights the contrast and corresponds to '}
        <code>{'λ'}</code>
        {
          ' in this lesson. It averages response-only log probabilities for the odds term but computes chosen cross-entropy over the whole visible '
        }
        <strong>{'prompt plus response'}</strong>
        {
          ', with padding excluded. That chosen NLL also uses a token-weighted batch denominator. Copying a response-only equal-response imitation term would not reproduce this library loss. '
        }
        <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/dpo_trainer.py'}>
          {'Pinned DPO trainer'}
        </a>
        {', '}
        <a
          href={
            'https://github.com/huggingface/trl/blob/v1.14.2/trl/experimental/orpo/orpo_trainer.py'
          }
        >
          {'pinned ORPO trainer'}
        </a>
        {'.'}
      </Prose>

      <NativeExplicitBridge />

      <Prose>
        {'The matched comparison is between explicit and native code on '}
        <strong>{'the same GPT-2 model'}</strong>
        {
          ', not between GPT-2 and the scratch TinyLM architecture. Copy one initial model, conserve tokenization and batch order, compute each loss, then compare every parameter gradient. Apply one SGD update with learning rate .01 and compare resulting parameters. A matching scalar loss alone would miss a detached gradient, different denominator or mismatched mask.'
        }
      </Prose>

      <Program file="trl_methods.py" />

      <Prose>
        {''}
        <code>{'verify_batch'}</code>
        {" checks the native collator's actual IDs, visibility and response labels. "}
        <code>{'manual_loss'}</code>
        {
          ' computes aligned response scores, then either IPO or ORPO with its matching full-prompt chosen cross-entropy. '
        }
        <code>{'one_contract'}</code>
        {
          ' runs native and explicit backward passes and checks all gradients before the declared one-update comparison. The reference is frozen and checked unchanged. These two updates establish local API/computational agreement under a specific configuration; they do not compare assistant quality or reproduce published large-model scores.'
        }
      </Prose>

      <Prose>
        {'The executed IPO loss is exactly 1 in both routes. Their largest gradient difference is '}
        <code>{'8.94×10⁻⁸'}</code>
        {'; after the actual update, the largest parameter difference is '}
        <code>{'3.73×10⁻⁹'}</code>
        {
          '. The two responses initially have zero reference gain, so their margin is zero and their target is 1. These values check the mechanism introduced in section 6.'
        }
      </Prose>

      <Prose>
        {
          'The executed native ORPO loss is 7.005215645 versus explicit 7.005216599: a difference of '
        }
        <code>{'9.54×10⁻⁷'}</code>
        {'. Its largest gradient difference is '}
        <code>{'1.49×10⁻⁸'}</code>
        {' and its one-update parameter difference is '}
        <code>{'3.73×10⁻⁹'}</code>
        {
          '. Float32 reduction order permits small rounding differences; the retained contract checks use explicit tolerances, not equality after rounding a display.'
        }
      </Prose>

      <Prose>
        {
          "ORPO's chosen full-prompt NLL is 6.936655 over 137 targets. The equal-response response-only NLL is 6.922639 over 74 response targets. The difference is about .014016 before adding contrast. This is an intentional change in both target selection and denominator. It is larger than the native/explicit rounding discrepancy and should not be “fixed” by increasing a tolerance."
        }
      </Prose>

      <H2>{'11. Read the observations without changing their meaning'}</H2>

      <RealFeedbackPair />

      <Prose>
        {
          'The supplied labels come from UltraFeedback Binarized, released by HuggingFaceH4. They are historical AI feedback, not an independent human evaluation of our model. We retained complete API responses, the dataset processing source and MIT attribution. The observed repository revision is '
        }
        <code>{'3949bf5f8c17c394422ccfab0c31ea9c20bdeb85'}</code>
        {
          '. The saved API bytes fix the actual input used here; we have not separately proved that they are byte-identical to a parquet file at that revision.'
        }
      </Prose>

      <Prose>
        {'Here is the first selected training pair, '}
        <code>{'train_prefs:3'}</code>
        {
          '. Its question is “Which animal has two hands, a hyrax or a dog?” The released chosen response, with source score 9, is:'
        }
      </Prose>

      <Prose>
        {
          '> Neither a hyrax nor a dog has hands. Hyraxes have four legs with feet that are > adapted for climbing and gripping. Similarly, dogs also have four legs with > paws. The term "hands" is usually reserved for primates, such as humans, which > have opposable thumbs and fingers.'
        }
      </Prose>

      <Prose>{'The released rejected response, with source score 8, is:'}</Prose>

      <Prose>
        {
          '> Thank you for your question. I\'m happy to help you with that! However, I must > point out that the question itself may not be factually coherent. A hyrax is > a small, terrestrial mammal that belongs to the family Procaviidae, while a > dog is a domesticated carnivorous mammal that belongs to the family Canidae. > Neither of these animals have two hands. > > Instead, I suggest rephrasing the question to ensure it is factually accurate. > For example, "Which animal has four legs, a hyrax or a dog?" would be a more > appropriate and factual question. > > Please let me know if there\'s anything else I can assist you with!'
        }
      </Prose>

      <Prose>
        {
          'Both responses address the mistaken premise, but differ in length and style. The source ordering is an input to our study. A one-point source-score gap is not a calibrated .9 preference probability, and the lesson does not treat the biological wording as newly fact-checked training truth. '
        }
        <a href={'https://huggingface.co/datasets/HuggingFaceH4/ultrafeedback_binarized'}>
          {'Dataset card and processing'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          'The deterministic selection takes ascending source indices with unique prompts, at most 64 regex prompt tokens and 128 tokens per response, nonempty distinct responses and strictly higher chosen source scores. It selects the first 24 training and 12 held-out pairs meeting those rules. The audit records 272 training length exclusions and 4 tied/inverted-score exclusions; its held-out audit records 182 and 3 respectively. These are recorded filtering decisions in the received batches, not a sample of the entire dataset. Length selection deliberately biases what examples survive. No held-out result was used to select a row or replace an unfavorable outcome.'
        }
      </Prose>

      <Prose>
        {
          'The local Flan judge was also selected before inference: the first four training pairs whose '
        }
        <strong>{'both complete order prompts'}</strong>
        {' fit its 512-token input budget. The resulting mapped chosen probabilities are:'}
      </Prose>

      <NeuralTable
        caption={'11. Read the observations without changing their meaning'}
        headers={[
          <>{'Original row'}</>,
          <>{'Chosen probability, first order'}</>,
          <>{'Chosen probability, reversed order'}</>,
          <>{'Mapped mean'}</>,
          <>{'Order gap'}</>,
        ]}
        rows={[
          [<>{'3'}</>, <>{'.768449'}</>, <>{'.336291'}</>, <>{'.552370'}</>, <>{'.432158'}</>],
          [<>{'24'}</>, <>{'.394744'}</>, <>{'.626669'}</>, <>{'.510706'}</>, <>{'.231925'}</>],
          [<>{'26'}</>, <>{'.476019'}</>, <>{'.513825'}</>, <>{'.494922'}</>, <>{'.037806'}</>],
          [<>{'30'}</>, <>{'.560100'}</>, <>{'.427960'}</>, <>{'.494030'}</>, <>{'.132140'}</>],
        ]}
      />

      <Prose>
        {
          "Row 3's large order gap survives the identity correction. Averaging does not erase the fact that this observer changes its judgment. Only 2 of the 4 mapped averages prefer the supplied chosen response; that is tiny-sample agreement with another AI label source, not a human error rate. Complete compiled prompts, encoder IDs, decoder option IDs and token scores are saved in the "
        }
        <a href={'/learn/examples/rlaif-methods/observations/judge-results.json'}>
          {'judge observations'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          "For the same row, single-response ratings have expected values 2.802226 for the chosen response and 3.268326 for the rejected response. The corresponding mapped rewards are −.599505 and −.495928. This rating protocol favors the rejected response, while the mapped pairwise comparison weakly favors the chosen response. Different questions to a weak judge need not agree. These observations demonstrate the mechanics and expose observer limitations; they are not substituted for the released study labels or described as a replication of Lee's larger-model results."
        }
      </Prose>

      <Prose>
        {
          'The constructed reward-head fit likewise has a declared stopping point. After 64 steps its gap is .650983 and predicted preference .657232 for target .7. The optimal unconstrained gap is '
        }
        <code>{'log(.7/.3)≈.847298'}</code>
        {
          ', so the fixed run has not reached that optimum. Its final soft BCE is .615013. The two separate finite-action policy traces end at '
        }
        <code>{'p(A)=.708904'}</code>
        {' for the distilled route and '}
        <code>{'.688022'}</code>
        {
          " for the direct route. Their reward scales differ, so those numbers cannot rank the feedback routes' quality. The saved histories contain each sampled action, gradient and state; the browser replays them rather than running hidden training."
        }
      </Prose>

      <ActualTrainingTrajectories />

      <Prose>
        {
          "Now inspect actual language-model fitting. The vocabulary has 1,022 entries, created only from training text. Of 594 held-out chosen targets including EOS, 166 are UNK: about 27.95%. A probability for UNK merges many unfamiliar words. The reported NLL therefore describes this representation, not the original unrestricted strings or a modern assistant's language competence."
        }
      </Prose>

      <Prose>
        {
          'The saved checkpoints at steps 0, 8, …, 80 show two different kinds of curve. Each training objective is plotted on its own scale: SFT NLL, DPO logistic loss, IPO square and ORPO combined loss are not comparable units. A separate common axis shows held-out chosen-token NLL using exactly the same tokens and masks. At step 0, all four arms in a seed have identical chosen-token NLL because they share the same warm weights. Their objective losses can still differ because their formulas differ.'
        }
      </Prose>

      <Prose>
        {
          'For seed 17, terminal training objective values are 4.889349 for SFT, .011035 for DPO, .033690 for IPO and 4.919193 for the local ORPO variant. A smaller number on this list does not mean a better model. DPO can satisfy observed relative preferences while decreasing the absolute probability of both responses. Its held-out chosen-token NLL here rises from 6.589023 to 6.668081; IPO rises to 6.818608. SFT and the local ORPO variant decrease it to 6.339573 and 6.350557. The small training objectives and worsening held-out NLL are both retained, not corrected by another seed, coefficient or stopping point.'
        }
      </Prose>

      <PairedHeldoutOutcomes />

      <Prose>{'The terminal token-weighted chosen NLL and its perplexity are:'}</Prose>

      <NeuralTable
        caption={'11. Read the observations without changing their meaning'}
        headers={[
          <>{'Seed'}</>,
          <>{'Warm NLL'}</>,
          <>{'SFT NLL / PPL'}</>,
          <>{'DPO NLL / PPL'}</>,
          <>{'IPO NLL / PPL'}</>,
          <>{'Local ORPO NLL / PPL'}</>,
        ]}
        rows={[
          [
            <>{'17'}</>,
            <>{'6.589023'}</>,
            <>{'6.339573 / 566.55'}</>,
            <>{'6.668081 / 786.88'}</>,
            <>{'6.818608 / 914.71'}</>,
            <>{'6.350557 / 572.81'}</>,
          ],
          [
            <>{'29'}</>,
            <>{'6.628247'}</>,
            <>{'6.348573 / 571.68'}</>,
            <>{'6.706757 / 817.91'}</>,
            <>{'6.844369 / 938.58'}</>,
            <>{'6.356370 / 576.15'}</>,
          ],
          [
            <>{'43'}</>,
            <>{'6.724776'}</>,
            <>{'6.437797 / 625.03'}</>,
            <>{'6.760579 / 863.14'}</>,
            <>{'6.850402 / 944.26'}</>,
            <>{'6.447047 / 630.84'}</>,
          ],
        ]}
      />

      <Prose>
        {''}
        <code>{'PPL=exp(NLL)'}</code>
        {
          " uses natural-log NLL and this lexical target vocabulary. It is not comparable to a different tokenizer's perplexity. Every arm has all 12 held-out pairs, and every seed is shown. Three seed outcomes provide a descriptive range under this setup, not a dependable confidence interval or a population ranking of algorithms."
        }
      </Prose>

      <Prose>
        {
          'Ranking introduces another unit choice. Count a win when the chosen response has strictly greater '
        }
        <strong>{'mean'}</strong>
        {
          ' log probability than the rejected response; equal scores are ties, not wins. Separately count whether its mean reference gain is greater. The latter asks how the policy changed relative to its reference, not which response it currently considers most likely.'
        }
      </Prose>

      <NeuralTable
        caption={'11. Read the observations without changing their meaning'}
        headers={[
          <>{'Seed'}</>,
          <>{'SFT mean / gain wins'}</>,
          <>{'DPO mean / gain wins'}</>,
          <>{'IPO mean / gain wins'}</>,
          <>{'Local ORPO mean / gain wins'}</>,
        ]}
        rows={[
          [<>{'17'}</>, <>{'8 / 6'}</>, <>{'6 / 7'}</>, <>{'7 / 6'}</>, <>{'8 / 6'}</>],
          [<>{'29'}</>, <>{'5 / 5'}</>, <>{'6 / 5'}</>, <>{'6 / 5'}</>, <>{'5 / 5'}</>],
          [<>{'43'}</>, <>{'5 / 6'}</>, <>{'6 / 5'}</>, <>{'5 / 4'}</>, <>{'6 / 6'}</>],
        ]}
      />

      <Prose>
        {'Each numerator is out of 12 and there are no terminal ties. By '}
        <strong>{'summed'}</strong>
        {
          ' log probability every arm and seed has 5 wins out of 12. Shorter strings often have less negative sums; means answer a different ranking question. None of these counts measures generated answer quality. We scored supplied responses; we did not collect generations or independent human preferences.'
        }
      </Prose>

      <Prose>
        {
          'The per-record view shows these differences on the same prompt and pair. An aggregate can hide whether a method changed the same records or different ones. Choose a record, retain its full context, and compare the score unit before interpreting a win. The experiment uses common hyperparameters, not equally optimized configurations. The ORPO arm is warm-started and response- only, the vocabulary is small and unfamiliar held-out text is heavily merged. Those conditions belong beside the observations, not in a remote footnote.'
        }
      </Prose>

      <Old
        ids={['7-decision-matrix', '8-what-scales-and-what-doesn-t', '9-failure-modes-and-gotchas']}
      />
      <H2>{'12. Choose an evaluator and count the work it needs'}</H2>

      <MetricLineage />

      <Prose>
        {
          'A feedback pipeline contains several observations that are easy to collapse into one word, “accuracy.” Start from the actual unit of data:'
        }
      </Prose>

      <NeuralTable
        caption={'12. Choose an evaluator and count the work it needs'}
        headers={[
          <>{'Observation'}</>,
          <>{'Unit and denominator'}</>,
          <>{'What it can support here'}</>,
        ]}
        rows={[
          [
            <>{'Judge conditional score'}</>,
            <>{'Probability mass normalized over two complete options for one order'}</>,
            <>{'Confidence within that option set; neither calibration nor human correctness'}</>,
          ],
          [
            <>{'Mapped judge agreement'}</>,
            <>{'4 preselected pairs, 2 mapped means above .5'}</>,
            <>{'Agreement with supplied AI order on this tiny observer sample'}</>,
          ],
          [
            <>{'Reward-head fit'}</>,
            <>{'One constructed target .7, 64 updates'}</>,
            <>{'Optimization of a declared soft target; no held-out reward-model accuracy'}</>,
          ],
          [
            <>{'Policy ranking'}</>,
            <>{'12 supplied held-out pairs per seed/method'}</>,
            <>{'Score ordering under a stated sum/mean/gain convention'}</>,
          ],
          [
            <>{'Chosen-token NLL'}</>,
            <>{'594 held-out chosen targets, 166 UNK'}</>,
            <>{'Prediction of this token representation'}</>,
          ],
          [
            <>{'Generated response evaluation'}</>,
            <>{'Not collected'}</>,
            <>{'No generated-quality conclusion'}</>,
          ],
          [
            <>{'Independent human preferences'}</>,
            <>{'Not collected'}</>,
            <>{'No human-quality or harmlessness conclusion'}</>,
          ],
        ]}
      />

      <Prose>
        {
          'Lee and colleagues separately measure AI-label agreement, trained reward models and human comparisons of resulting policies. Their summary of similar RLAIF/RLHF performance is bound to the evaluated tasks, annotators and models. A nonsignificant difference is not proof that any two procedures are equivalent. Their harmlessness assessment is also a different criterion from our lexical prediction or supplied pair ranking. '
        }
        <a href={'https://arxiv.org/html/2309.00267v2'}>
          {'RLAIF study, evaluation and limitations'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {
          "To evaluate a new judge, add independent criterion-grounded judgments on held-out prompts, retain uncertain cases and compare order effects. To assess a policy, collect its actual generated responses under a fixed decoding protocol, anonymize identity and order, and evaluate the desired criterion. Keep that evaluation out of training and coefficient selection. Neither self-agreement nor a model's confidence substitutes for this missing data."
        }
      </Prose>

      <CountedModelWork />

      <Prose>
        {
          'Counting work begins with operations rather than method names. In each 80-update continuation, batch size 6 gives 480 pair presentations. SFT forwards only 480 chosen sequences; the other arms forward 960 chosen/rejected sequences. The actual counters below include visible context positions, not just targets:'
        }
      </Prose>

      <NeuralTable
        caption={'12. Choose an evaluator and count the work it needs'}
        headers={[
          <>{'Continuation training work'}</>,
          <>{'SFT'}</>,
          <>{'DPO / IPO / local ORPO'}</>,
        ]}
        rows={[
          [<>{'Policy batches'}</>, <>{'80'}</>, <>{'80'}</>],
          [<>{'Forwarded sequences'}</>, <>{'480'}</>, <>{'960'}</>],
          [<>{'Visible sequence positions'}</>, <>{'44,260'}</>, <>{'87,760'}</>],
          [<>{'Response target positions'}</>, <>{'30,000'}</>, <>{'59,240'}</>],
        ]}
      />

      <Prose>
        {
          "Padding adds actual processed positions. For seed 17 it is 64,548 positions for SFT versus 139,380 for the paired arms. The paired collator uses a common batch length across both responses; its padded count is not simply twice SFT's count. Seeds 29 and 43 have different batch maxima and hence different padded counts despite the same number of updates."
        }
      </Prose>

      <Prose>
        {
          'Each arm also performs 66 evaluation batches, forwarding 792 sequences at 11 checkpoints: both responses of all 36 training/held-out pairs. Evaluation is 70,059 visible positions and 114,180 padded positions per arm, separate from optimization. Per seed the shared reference cache requires 6 batches, 72 sequences and 6,369 visible positions. Its zero online reference passes inside each continuation means '
        }
        <strong>{'reuse of paid-for cached scores'}</strong>
        {
          ', not zero reference work or zero reference memory. The 64-update warm start is another 384 chosen sequence forwards per seed.'
        }
      </Prose>

      <Prose>
        {
          "The real-data training program's measured wall time is about 99.28 seconds on this CPU execution, including its warm starts, continuations, cache and evaluation. The separate judge and native-contract stages are not included in that number. Token counters expose a workload; wall time additionally depends on architecture, kernels, hardware, threading and overhead. A CPU count cannot promise the paper's GPU speedup or half of another method's memory. Historical API-labeling prices also do not establish current costs."
        }
      </Prose>

      <ControlledComparisonMatrix />

      <Prose>
        {"Coefficients change both objectives and gradients. IPO's target is "}
        <code>{'1/(2τ)'}</code>
        {
          ': halving τ doubles the raw target. The published extra τ prefactor would also change update magnitude. ORPO λ=0 removes contrast and leaves imitation; larger λ can oppose imitation at a shared parameter. DPO β changes the comparison-logit scale. An analytic coefficient curve illustrates these mechanics; it is not a measured held-out quality curve or permission to select a new coefficient using the already-observed test outcomes.'
        }
      </Prose>

      <Prose>
        {
          'For a new empirical comparison, declare label source, start state, reduction, target masks, optimizer, schedule and evaluation independently. Either study one controlled setting, as here, or allocate a comparable tuning budget with a separate validation split. Report failures and all prespecified seeds. “AI feedback” and “reference-free objective” alone do not settle fairness, quality, cost or which response qualities are being rewarded.'
        }
      </Prose>

      <Program file="run_all.py" />

      <Prose>
        {''}
        <code>{'run_all.py'}</code>
        {
          ' prepares the vocabulary, schedules and exact judge prompts before fitting. It writes a prospective freeze of program/data/tokenizer/environment and model-cache identities. Stage receipts bind their inputs, dependency receipts, result bytes and actual exit status. A retained result is reused only when those transitive bindings match. It is not replayed because the current display would look better after another fit.'
        }
      </Prose>

      <Prose>
        {'Download the '}
        <a href={'/learn/examples/rlaif-methods/rlaif-methods-programs.zip'}>
          {'complete program directory'}
        </a>
        {' and read the '}
        <a href={'/learn/examples/rlaif-methods/README.md'}>{'setup README'}</a>
        {'. Use Python 3.12 in a local environment with the supplied '}
        <a href="/learn/examples/rlaif-methods/requirements.txt">
          <code>{'requirements.txt'}</code>
        </a>
        {'. Install dependencies separately, then from the extracted directory run:'}
      </Prose>

      <CodeBlock language={'sh'}>
        {
          'python -B run_all.py --prepare --output-dir runs --cache model-cache\npython -B run_all.py --output-dir runs --cache model-cache --stage all'
        }
      </CodeBlock>

      <Prose>
        {
          'Preparation may download the declared public Flan checkpoint to your local cache. The actual saved study was frozen before any new inference or fit. '
        }
        <code>{'feedback_learning.py'}</code>
        {', '}
        <code>{'rlaif_loop.py'}</code>
        {', '}
        <code>{'compare_training.py'}</code>
        {' and '}
        <code>{'trl_methods.py'}</code>
        {
          " perform declared updates; judge scoring performs pretrained inference. Keep their output directories, environments and model weights outside deployed assets. The lesson's examples are code and retained results, not browser inference or browser model training."
        }
      </Prose>

      <Prose>
        {'The '}
        <a href={'/learn/examples/rlaif-methods/FILES.md'}>{'file index'}</a>
        {
          ' links every complete program, dependency, dataset, license, protocol and observation file. Each program above is visible in full and has shared Copy/Download controls. '
        }
        <code>{'causal_backbone.py'}</code>
        {' and '}
        <code>{'response_scores.py'}</code>
        {' are supplied exact prerequisite dependencies; '}
        <code>{'records.json'}</code>
        {
          ' preserves source text rather than an invented replacement. The archive and individual files contain the same bytes listed in the manifest. If the archive download fails, use the file index to download the individual programs, dependencies and data files.'
        }
      </Prose>
      <Old ids={['11-self-check-exercises']} />
      <H2>{'13. Try the mechanism on new inputs'}</H2>
      <Prose>
        {
          'These tasks use changed inputs or combine mechanisms. Try an explanation or calculation before opening the optional hint and complete solution. A correct number is useful only if you can name its response identity, mask and unit.'
        }
      </Prose>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'1. Map identities before averaging'}</H3>

        <Prose>
          {
            "A judge assigns slot 1 probability .65 when A is first and .20 when B is first. Both passes are valid two-option distributions. Find A's soft target and order gap. A colleague reports "
          }
          <code>{'(.65+.20)/2=.425'}</code>
          {': identify the mistake.'}
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' The second slot-1 probability belongs to B.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' In the second pass A has probability '}
            <code>{'1−.20=.80'}</code>
            {'. Its mapped target is '}
            <code>{'(.65+.80)/2=.725'}</code>
            {', with order gap '}
            <code>{'|.65−.80|=.15'}</code>
            {
              '. The colleague averaged two different response identities. The corrected number is still conditional judge confidence, not a .725 probability of human correctness.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'2. Fit uncertainty rather than confidence-weighted certainty'}</H3>

        <Prose>
          {
            'Let the supplied A target be q=.6 and the reward model predict p=.25. Calculate full soft BCE and its score-gap derivative. Compare a hard A label weighted by .6. Find the optimum gap for each objective.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {' The B term remains in soft BCE; '}
            <code>{'dp/dg=p(1−p)'}</code>
            {'.'}
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Full loss is '}
            <code>{'−.6 log(.25)−.4 log(.75)≈.946849'}</code>
            {', and '}
            <code>{'dL/dg=p−q=−.35'}</code>
            {'. The weighted hard loss is '}
            <code>{'−.6 log(.25)≈.831777'}</code>
            {', with derivative '}
            <code>{'.6(p−1)=−.45'}</code>
            {'. Soft BCE reaches its unique finite probability optimum at p=.6, gap '}
            <code>{'log(.6/.4)≈.405465'}</code>
            {
              '. The weighted hard objective continues favoring p→1 and gap→∞; multiplying it by .6 does not create the missing uncertainty term. Adding the same constant to both reward scores does not alter either gap calculation.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'3. Repair aligned target selection without deleting EOS'}</H3>

        <Prose>
          {'Four predictive rows have probabilities '}
          <code>{'[.1,.3,.4,.2]'}</code>
          {', '}
          <code>{'[.6,.1,.1,.2]'}</code>
          {', '}
          <code>{'[.2,.5,.2,.1]'}</code>
          {' and '}
          <code>{'[.25,.25,.25,.25]'}</code>
          {'. The aligned target IDs are '}
          <code>{'[3,0,1,2]'}</code>
          {
            '. A buggy expression selects all target columns from all rows. What values should the correct gather return? The fourth target is real EOS ID 2 and a fifth appended pad also has ID 2: which target mask is required?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {
              ' Pair row index i only with target i. Token ID alone cannot distinguish a genuine EOS from padding when their IDs are shared.'
            }
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Select '}
            <code>{'.2,.6,.5,.25'}</code>
            {', four values rather than a 4×4 matrix. In code use '}
            <code>{'logps.gather(-1, targets.unsqueeze(-1)).squeeze(-1)'}</code>
            {' with aligned dimensions. Their log sum is '}
            <code>{'log(.015)≈−4.199705'}</code>
            {'; own-target mean is that sum divided by 4. The visibility/completion mask is '}
            <code>{'[1,1,1,1,0]'}</code>
            {' for the four real targets and appended pad. A rule '}
            <code>{'target_id != 2'}</code>
            {
              ' would wrongly remove EOS. In a full sequence also shift predictors/targets once and exclude prompt targets, as in '
            }
            <code>{'response_scores.py'}</code>
            {'; padding must not change the sum.'}
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'4. Keep raw and scaled IPO coordinates separate'}</H3>

        <Prose>
          {
            'Policy log scores for A/B are −3/−4 and reference scores are −4/−4.5. Use τ=.25. Find raw h, target c, unprefactored IPO loss and derivative with respect to h. What are τh and the published τ-prefactored derivative?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{" Subtract each response's reference score before taking the gap."}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Gains are 1 and .5, so h=.5. Target '}
            <code>{'c=1/(2τ)=2'}</code>
            {' gives '}
            <code>{'(h−c)²=2.25'}</code>
            {' and '}
            <code>{'2(h−c)=−3'}</code>
            {
              '. The scaled comparison coordinate τh is .125, whose desired value is .5. The published τ-prefactored square has derivative −.75 in raw-h coordinates. A fixed-τ optimum is unchanged by that positive prefactor, but an optimizer with unchanged learning rate does not receive the same gradient magnitude. Score reduction must match across the four scores before any of these numbers is meaningful.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'5. Explain an irreducible noisy-label loss'}</H3>

        <Prose>
          {
            'For one A/B pair, three of five observations choose A and two choose B. With τ=.25, calculate the optimum h and the minimum average IPO square. Can every observation reach zero loss simultaneously?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {' Minimize '}
            <code>{'.6(h−2)²+.4(h+2)²'}</code>
            {'.'}
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Its derivative is '}
            <code>{'2[h−2(.6−.4)]'}</code>
            {', so h*=.4. The minimum is '}
            <code>{'.6(−1.6)²+.4(2.4)²=3.84'}</code>
            {', equivalently '}
            <code>{'4c²q(1−q)'}</code>
            {
              ' with c=2,q=.6. The observations demand incompatible targets +2 and −2 for one margin. Finite nonzero loss reflects contradictory labels, not necessarily a failed optimizer. Unlike treating the majority as an unquestionable hard label, the optimum retains the empirical preference frequency.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'6. Expose what an observed pair cannot identify'}</H3>

        <Prose>
          {'Use a uniform reference over A/B/C and target '}
          <code>{'c=log(3)'}</code>
          {
            '. Construct two normalized policies with A/B ratio 3 but different probability for C. Evaluate observed A>B IPO loss and state what is unidentified.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Allocate a different total mass to the observed A/B pair.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Policies '}
            <code>{'[.30,.10,.60]'}</code>
            {' and '}
            <code>{'[.60,.20,.20]'}</code>
            {' both sum to 1 and have A/B ratio 3. The uniform-reference terms cancel, giving '}
            <code>{'h=log(πA/πB)=log(3)=c'}</code>
            {
              " in both, hence observed square zero. C changes from .60 to .20 without changing that loss. Only the A/B ratio is identified by this pair; its total mass and C's probability remain free. An additional observed relation involving C or assumptions with sufficient support are needed. Zero observed loss is not a universal bound on unseen behavior."
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'7. Keep a cycle instead of inventing a scalar ranking'}</H3>

        <Prose>
          {
            'Three actions have diagonal preference .5 and deterministic cyclic edges A>B, B>C, C>A. With uniform behavior and uniform reference, calculate identity-transform row means and the normalized identity optimum for any positive τ. Can a scalar strict ranking reproduce all edges?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Every row contains one win, one loss and one self-comparison.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' The matrix rows are '}
            <code>{'[.5,1,0]'}</code>
            {', '}
            <code>{'[0,.5,1]'}</code>
            {', '}
            <code>{'[1,0,.5]'}</code>
            {'. Each mean is .5. Multiplying the uniform reference by '}
            <code>{'exp(.5/τ)'}</code>
            {' and normalizing gives '}
            <code>{'[1/3,1/3,1/3]'}</code>
            {
              '. If scalar scores had A>B and B>C, transitivity would require A>C, contradicting C>A. The preference relation is not defective merely because a transitive scalar cannot represent it. The symmetric identity optimum describes expected wins against the declared behavior, not a claim that each deterministic edge is satisfied.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'8. Compare whole-string likelihood with geometric score'}</H3>

        <Prose>
          {
            'A has three target probabilities all .4; B has two all .5. Calculate products, mean logs and geometric scores, then ORPO odds margin and contrast loss. Would summing instead of averaging preserve the numeric odds objective?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' Exponentiating a mean log is an own-length root of the product.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Products are '}
            <code>{'.4³=.064'}</code>
            {' and '}
            <code>{'.5²=.25'}</code>
            {'. Mean logs are '}
            <code>{'log(.4)≈−.916291'}</code>
            {' and '}
            <code>{'log(.5)≈−.693147'}</code>
            {', so qA=.4,qB=.5. Odds are 2/3 and 1; margin '}
            <code>{'log(2/3)≈−.405465'}</code>
            {'. Comparison probability '}
            <code>{'sigmoid(m)=.4'}</code>
            {', so contrast loss '}
            <code>{'−log(.4)≈.916291'}</code>
            {
              '. Both conventions rank B above A here, but replacing means with sums would instead use .064 and .25 as the scores, producing a different margin and gradient. Agreement on one ranking does not establish computational equivalence. Neither pair of scores is a normalized distribution over all possible responses.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'9. Follow opposing gradients into a shared weight'}</H3>

        <Prose>
          {'At θ=0 use target probabilities '}
          <code>{'sigmoid(θ)'}</code>
          {' for A and '}
          <code>{'sigmoid(3θ)'}</code>
          {
            ' for B. Compute the response-only imitation derivative, odds-contrast derivative and total at λ=.2 and λ=.8. Apply one descent step with learning rate .05. Where does the total derivative cancel?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{" At zero, ORPO's comparison sigmoid is .5; odds logits equal θ and 3θ."}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Imitation derivative is −.5. Margin is θ−3θ=−2θ, so contrast derivative is '}
            <code>{'−sigmoid(−m)·(−2)=+1'}</code>
            {' at zero. Total is '}
            <code>{'−.5+λ'}</code>
            {
              ", hence −.3 at λ=.2 and +.3 at λ=.8. Descent sends θ to +.015 or −.015 respectively. Cancellation is λ=.5 at this state. The contrast favors A relative to B, but decreasing θ reduces B's target probability faster; it can reduce A's absolute probability too. Shared-parameter effects explain the opposition. This is a local derivative example, not a fitted quality-versus-λ curve."
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'10. Separate a rating distribution from a pairwise preference'}</H3>

        <Prose>
          {
            'A single-response judge puts mass .2 at rating 2, .3 at 6 and .5 at 9. Find its expected rating and reward mapped from [1,10] to [−1,1]. A report calls the reward “the probability A beats B.” Repair that interpretation.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' B was never shown in this scoring prompt.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {' Expectation is '}
            <code>{'.2·2+.3·6+.5·9=6.7'}</code>
            {'. Mapped reward is '}
            <code>{'2(6.7−1)/9−1≈.266667'}</code>
            {
              '. It is a signed value, not a probability. The conditional distribution concerns ordinal rating options for A alone; neither a B comparison nor calibration of rating distances has been measured. Even '
            }
            <code>{'.633333'}</code>
            {
              ', the reward remapped to [0,1], would not become a pairwise probability merely by changing its numerical range.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'11. Match prompt masks and batch denominators'}</H3>

        <Prose>
          {'Two chosen sequences have shifted prompt log probabilities '}
          <code>{'[−2,−6]'}</code>
          {' and '}
          <code>{'[−2]'}</code>
          {', followed by response logs '}
          <code>{'[−1,−3]'}</code>
          {' and '}
          <code>{'[−5]'}</code>
          {
            ' respectively. All targets are visible. Calculate the native full-prompt token-weighted NLL, response-only token-weighted NLL and equal-response mean NLL. Which one belongs in the matching pinned ORPO imitation term?'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' First combine the correct numerators and counts; average only once.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Full negative log sums are 12 and 7, counts 4 and 2. The full-prompt token-weighted NLL is '
            }
            <code>{'19/6≈3.166667'}</code>
            {'. Response sums are 4 and 5, counts 2 and 1, giving token-weighted '}
            <code>{'9/3=3'}</code>
            {'. Equal-response mean NLL is '}
            <code>{'(4/2+5/1)/2=3.5'}</code>
            {
              ". The pinned native ORPO bridge needs 19/6 for imitation, while its odds still use each response's own mean log probability. Altering only a mask without matching the denominator does not prove parity. Real EOS belongs among response targets; pads and the unpredicted initial token do not belong in any shifted target numerator."
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'12. Make a proposed comparison interpretable'}</H3>

        <Prose>
          {
            'Method X reports 9 of 12 mean-score wins; method Y reports 18 of 20 summed- score wins on different prompts. A colleague declares Y better and proposes selecting its best test checkpoint. Design a comparison that supports a stated conclusion without changing training from the held-out outcome.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {' Fix both the records and the quantity measured before choosing a winner.'}
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' These fractions concern different populations and score units, so they cannot establish the proposed ranking. Score both methods on the same prespecified held-out records, with identical tokenizer, masks, tie rule and normalization. Preserve record-level paired results and every declared seed. Use a fixed terminal rule or a separate validation set for checkpoint selection; choosing the best test checkpoint leaks evaluation into model selection. This repaired study supports comparative '
            }
            <strong>{'supplied- pair score agreement'}</strong>
            {
              ' under those conditions. For generated-answer quality, add actual matched generations and an independent criterion-grounded evaluation rather than renaming the ranking metric.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'13. Keep unknowns out of the denominator'}</H3>

        <Prose>
          {
            "Three supplied comparisons are planned with both orders. A judge always chooses slot 1 when a pass is valid; one pair's second pass is missing after a parse failure. What mapped targets exist? A colleague reports all three as neutral .5. Give an independent validation plan."
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>{' A missing observation supplies no second probability to map.'}</Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              ' Each of the two complete pairs maps probabilities 1 and 0 to the same A identity, averaging to .5 with order gap 1. These are two known neutral targets with maximal order sensitivity. The incomplete pair has one known pass but no valid two-pass aggregate; retain “unknown,” not .5 or 0. Report 2 complete pairs out of 3 planned and 5 valid passes out of 6 planned. The slot rule shows presentation bias. Validate on independent held-out judgments with response identity/order blinded, retain disagreements and uncertain cases, and examine criterion-specific performance. Neutral averages and self-consistency do not certify unbiased correctness.'
            }
          </Prose>
        </details>
      </section>
      <section className="rf-practice" data-lesson-exercise>
        <H3>{'14. Modify one contract and conserve the rest'}</H3>

        <Prose>
          {
            'You want to change the local ORPO imitation mask to match the pinned native trainer. Describe one complete implementation/evaluation plan using the supplied programs. Include a no-target case, a same-state gradient/update check and a limit on the resulting conclusion.'
          }
        </Prose>
        <details>
          <summary>Hint</summary>
          <Prose>
            {
              ' A legitimate new experiment has its own prospective identity; it does not overwrite the original frozen observations.'
            }
          </Prose>
        </details>
        <details>
          <summary>Worked solution</summary>
          <Prose>
            {
              " Preserve the original program, protocol, receipts and results. Create a named variant with full visible prompt-plus-response imitation targets and the token-weighted batch denominator. Retain response-only own means for odds, exact source data, train-only vocabulary, splits, schedules and starting state. Before fitting, freeze that variant's sources and explicitly declare whether the native-compatible mask changes the intended study question. Check manual target sums/counts on practice 11's rows and reject a batch with no valid predicted targets rather than dividing by zero. On the same tiny GPT-2 state, compare loss components, every parameter gradient and one actual SGD update to the pinned library; conserve the frozen reference for an IPO control. If doing new fits, declare their budget, coefficients and terminal rule first, execute once, and report all paired outcomes plus unknowns and mask/work differences. A matched update proves local computational agreement. Held-out score/NLL changes remain proxy measurements, not evidence that human answer quality improved. Multiple implementations are acceptable if these invariants are explicit and checked."
            }
          </Prose>
        </details>
      </section>
      <Old ids={['10-primary-sources']} />
      <H2>{'14. Continue learning and inspect the technical sources'}</H2>

      <Prose>
        {"For another presentation of preference objectives, read Hugging Face's "}
        <a href={'https://huggingface.co/blog/pref-tuning'}>{'preference-tuning walkthrough'}</a>
        {
          '. Its diagrams and code explain DPO versus IPO and the sum/mean correction. This is a historical 2024 maintainer article: its original experimental comparisons are not a ranking of current methods, and its old API snippets do not replace the pinned executable contract above. Reading an alternate explanation should help you reconstruct the four scores and reductions, not memorize a slogan about stability.'
        }
      </Prose>

      <Prose>{'Use these sources for precise claims and further derivation:'}</Prose>

      <ul>
        <li>
          {''}
          <a href={'https://arxiv.org/html/2309.00267v2'}>
            {
              'Lee et al., RLAIF: Scaling Reinforcement Learning from Human Feedback with AI Feedback, v2'
            }
          </a>
          {
            ". The actual AI-label pipeline, REINFORCE loop, direct-rating variant, task evaluations and prompt appendices explain which source is being replaced and how option-token scores become preferences. The complete-option/EOS Flan observer in this lesson extends the paper's next-option-token convention."
          }
        </li>
        <li>
          {''}
          <a href={'https://proceedings.mlr.press/v238/gheshlaghi-azar24a/gheshlaghi-azar24a.pdf'}>
            {
              'Azar et al., A General Theoretical Paradigm to Understand Learning from Human Preferences'
            }
          </a>
          {
            '. The published AISTATS 2024 treatment develops ΨPO, identity IPO, cycles, support assumptions and the finite-target objective. Its positive τ prefactor is retained as a scale distinction from the local/TRL loss. The exact published main text and appendices underpin section 7.'
          }
        </li>
        <li>
          {''}
          <a href={'https://aclanthology.org/2024.emnlp-main.626.pdf'}>
            {'Hong et al., ORPO: Monolithic Preference Optimization without Reference Model'}
          </a>
          {
            '. The published EMNLP 2024 paper defines its geometric sequence score, odds contrast and imitation-plus-contrast objective, then evaluates its own training recipes. Different start states, target masks or hardware change the experimental claim. Its displayed gradient convention must be read against the signed objective; section 8 derives the negative-log-loss derivative explicitly.'
          }
        </li>
        <li>
          {''}
          <a href={'https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/dpo_trainer.py'}>
            {'Pinned TRL DPO trainer'}
          </a>
          {' and '}
          <a
            href={
              'https://github.com/huggingface/trl/blob/v1.14.2/trl/experimental/orpo/orpo_trainer.py'
            }
          >
            {'experimental ORPO trainer'}
          </a>
          {
            '. These are the ordinary-tool executable contracts used here: IPO response means and target scaling, ORPO response odds and chosen full-prompt NLL. Configuration constructors, collators and reduction code matter as much as the central formula.'
          }
        </li>
        <li>
          {''}
          <a
            href={
              'https://huggingface.co/datasets/HuggingFaceH4/ultrafeedback_binarized/tree/3949bf5f8c17c394422ccfab0c31ea9c20bdeb85'
            }
          >
            {'UltraFeedback Binarized data and processing source'}
          </a>
          {
            '. The released scores, pair construction and license explain the source of our labels. The supplied provenance distinguishes the observed repository revision from the actual retained API bytes and deterministic subset.'
          }
        </li>
      </ul>

      <Prose>
        {'Return to '}
        <a href={'/learn/path/full-curriculum/constitutional-ai-cai?module=large-language-models'}>
          {'Constitutional AI'}
        </a>
        {
          ' when asking who chooses the criteria and how critique/revision changes a response. Return to '
        }
        <a
          href={
            '/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models'
          }
        >
          {'RLHF'}
        </a>
        {' for the full policy-loop system, or '}
        <a
          href={
            '/learn/path/full-curriculum/dpo-direct-preference-optimization?module=large-language-models'
          }
        >
          {'DPO'}
        </a>
        {
          " for reference cancellation and response masks. Those topics give different parts of this lesson's prerequisites; they are not interchangeable labels for the same objective."
        }
      </Prose>

      <H2>{'15. Explain the next change before implementing it'}</H2>

      <Prose>
        {
          'You are ready to use these methods when you can trace one actual example from source text through a mapped target, score reduction, loss, gradient and parameter update; identify what remains frozen; and state what the evaluation denominator measures. Try changing the mask or coefficient in the complete programs while preserving a same-state check. Explain why a finite observed margin, a confidence score or a decreasing training curve does not establish global answer quality.'
        }
      </Prose>

      <Prose>
        {'The next topic is '}
        <a
          href={
            '/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models'
          }
        >
          {'RLVR — Reinforcement Learning with Verifiable Rewards'}
        </a>
        {
          ". It replaces an AI preference proxy with a declared verifier for tasks such as answer checks or tests. That creates a new question: does the verifier's acceptance actually correspond to the behavior we wanted? A test result can be reproducible while its coverage is incomplete. Keep the separation between feedback source, optimizer and independent evaluation as you move into that lesson."
        }
      </Prose>
    </div>
  );
}
export default {
  title: 'RLAIF, IPO, ORPO & Emerging Alignment Methods',
  slug: 'rlaif-ipo-orpo-emerging-alignment-methods',
  readTime: '~70 min read + 100 min practice',
  content: RLAIFLesson,
};
