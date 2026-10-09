// Deterministic projection of the accepted DAPO manuscript.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Local, Table as DapoTable } from '../../components/lesson-labs/DapoElements.jsx';
import {
  DapoEvidenceProvider,
  AnswerPaths,
  RewardToUpdate,
  FrozenRollout,
  CausalAddresses,
  RewardRuler,
  HomogeneousGroups,
  SignedClip,
  ProbabilitySimplex,
  EntropyChange,
  NegativeDualClip,
  RaggedWeights,
  LossMass,
  WholeGroupCollector,
  IdentityJoin,
  MixedGroupCost,
  AcceptedMixture,
  TerminationMasks,
  LengthBuffer,
  SoftmaxGradient,
  MicrobatchCount,
  RecordMemory,
  FiniteBatchDebugger,
  ModelStructure,
  SavedRolloutLedger,
  NativeMechanism,
  NativeParity,
  ObservedOutcomes,
  WorkAccounting,
  IntegerParser,
  CircleCollision,
  PaperProgression,
  RecipeComparison,
  FailureTrace,
  MetricDenominators,
  FullTrace,
  ComputeBudget,
} from '../../components/lesson-labs/DapoFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <Local label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </Local>
);
const NeuralTable = ({ headers, rows, ...props }) => (
  <DapoTable headers={headers} rows={rows} label={props.caption ?? 'Comparison'} />
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn-code/dapo/' + file}
    filename={file}
    title={file}
    language="python"
  />
);
function DapoLesson() {
  return (
    <DapoEvidenceProvider>
      <div className="lesson-flow dapo-flow">
        <Prose>
          {
            'A language model produces four answers to the same question. Two pass the checker and two fail. That sounds like useful training feedback. But what if all four pass? What if one answer is three times as long as another? What if the checker sees an unfinished answer because generation hit its token limit? The reward alone does not answer how much each sampled token should influence the next parameter update.'
          }
        </Prose>

        <Prose>
          {
            'DAPO is a recipe for handling these details in large-scale reinforcement learning for language models. Its name expands to '
          }
          <strong>{'Decoupled Clip and Dynamic sAmpling Policy Optimization'}</strong>
          {
            ". We will build its pieces from a single sampled answer, derive the loss and its gradients, implement a bounded collector and run both a local objective and an ordinary library trainer. Our small model experiment uses sentiment labels to expose the mechanics. The paper's long-reasoning results have a separate task, model and compute budget."
          }
        </Prose>

        <Prose opening="prerequisites">
          {''}
          <a
            href={
              '/learn/path/full-curriculum/rlvr-reinforcement-learning-with-verifiable-rewards?module=large-language-models'
            }
          >
            {'RLVR'}
          </a>
          {' establishes the terminal checker; '}
          <a
            href={
              '/learn/path/full-curriculum/grpo-rloo-kto-advanced-preference-methods?module=large-language-models'
            }
          >
            {'GRPO, RLOO and KTO'}
          </a>
          {
            ' establishes grouped policy gradients. We refresh those objects as they enter the calculation. Follow sections 1–10 for the mechanism, 11–14 for complete implementations and observations, then 15–18 to audit a verifier and choose a recipe. The deeper branches on dual clipping and microbatch normalization remain visible after their simpler examples.'
          }
        </Prose>

        <span id="1-why-it-exists" aria-hidden="true" />
        <span id="1-start-with-the-problem" aria-hidden="true" />
        <H2>{'1. Follow one answer into one update'}</H2>

        <Prose>
          {'Consider the question '}
          <code>{'7 + 5'}</code>
          {
            '. A model can continue that prefix in several ways. Each answer is an ordered sequence of sampled tokens; the probability of its next token depends on the question and the tokens already emitted. We call the question a '
          }
          <strong>{'prompt'}</strong>
          {' and the emitted sequence a '}
          <strong>{'response'}</strong>
          {'.'}
        </Prose>

        <AnswerPaths />

        <Prose>
          {
            'The drawing uses four labelled paths. A returns a wrong number; B does not give the required numeric form; C returns 12 directly; D reaches 12 after a longer calculation. For this introductory checker, the final numeric answer determines reward: correct is +1 and incorrect or malformed is −1. Later we make the extraction rule explicit. A reward is a number returned by that contract, not an inspection of every reasoning step.'
          }
        </Prose>

        <Prose>
          {'Let the prompt be '}
          <InlineMath>{'q'}</InlineMath>
          {' and response '}
          <InlineMath>{'i'}</InlineMath>
          {' be '}
          <InlineMath>{'o_i=(o_{i,1},\\ldots,o_{i,L_i})'}</InlineMath>
          {'. Its length is '}
          <InlineMath>{'L_i'}</InlineMath>
          {'. A language model with parameters '}
          <InlineMath>{'\\theta'}</InlineMath>
          {' assigns '}
          <InlineMath>{'\\pi_\\theta(o_{i,t}\\mid q,o_{i,<t})'}</InlineMath>
          {' to the token at position '}
          <InlineMath>{'t'}</InlineMath>
          {'. The notation '}
          <InlineMath>{'o_{i,<t}'}</InlineMath>
          {
            ' means the earlier response tokens. Multiplying these conditional probabilities gives the probability of that complete response, including its stop token when one is emitted.'
          }
        </Prose>

        <Prose>
          {
            "We want high-reward responses to become more likely, but a sampled token does not carry an independent correctness label. The terminal reward first becomes a comparison within the group, then a coefficient in a differentiable loss. Changing the loss changes the model's future token probabilities."
          }
        </Prose>

        <RewardToUpdate />

        <Prose>
          {
            'The arrows in the loop represent different operations. Sampling chooses token IDs. Checking assigns rewards. Group arithmetic assigns relative coefficients. Teacher forcing recomputes the probability of each already chosen token. Differentiation follows those probabilities back to the model parameters. The checker itself need not be differentiable: its result is held fixed during the update.'
          }
        </Prose>

        <H2>{'2. Keep the rollout policy fixed while updating'}</H2>

        <Prose>
          {
            'The loop generates responses with one set of weights, then changes those weights. To describe that change we need two roles. The '
          }
          <strong>{'old policy'}</strong>
          {' is the snapshot that generated the sampled responses. The '}
          <strong>{'current policy'}</strong>
          {
            ' is the model whose parameters the optimizer is changing. At the start of a rollout they coincide; after an update they can differ.'
          }
        </Prose>

        <FrozenRollout />

        <Prose>
          {
            'For the stored token in the drawing, suppose its old probability was .08 and its current probability is .10. Dividing .10 by .08 gives 1.25: that action has become 25% more likely at this prefix. This '
          }
          <strong>{'ratio'}</strong>
          {
            ' measures relative change, not the current probability itself. For any stored token, the same comparison is'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              'r_{i,t}(\\theta)=\n\\frac{\\pi_\\theta(o_{i,t}\\mid q,o_{i,<t})}\n{\\pi_{\\mathrm{old}}(o_{i,t}\\mid q,o_{i,<t})}\n=\\exp\\bigl(\\ell_{i,t}(\\theta)-\\ell^{\\mathrm{old}}_{i,t}\\bigr).'
            }
          </MathBlock>
        </div>

        <Prose>
          {'Here '}
          <InlineMath>{'\\ell'}</InlineMath>
          {
            ' is a log probability. The same token and the same prefix appear in both numerator and denominator.'
          }
        </Prose>

        <Prose>
          {
            'The old log probability is a constant during all updates that reuse this rollout. Detaching the denominator prevents an unintended gradient through the sampling snapshot. Replacing it after every optimizer step would change the comparison being optimized.'
          }
        </Prose>

        <CausalAddresses />

        <Prose>
          {"A decoder's logits at input position "}
          <InlineMath>{'t-1'}</InlineMath>
          {' predict target position '}
          <InlineMath>{'t'}</InlineMath>
          {
            ". The target token is present in the stored tensor so it can be gathered, but the predictor's causal attention must not read that target or later tokens. Prompt positions supply context; only response targets enter this response loss. An actual end-of-sequence token, "
          }
          <strong>{'EOS'}</strong>
          {
            ', is one of those targets. A padding cell can store the same token ID without being an emitted action; its mask decides whether it counts.'
          }
        </Prose>

        <Prose>
          {'There is sometimes a third model: a fixed '}
          <strong>{'reference policy'}</strong>
          {
            " used to regularize deviation from a starting behaviour with a KL term. That role is different from the old rollout snapshot. DAPO's main recipe sets the reference KL coefficient "
          }
          <InlineMath>{'\\beta'}</InlineMath>
          {
            ' to zero. It still needs old scores for the ratios. Subtracting two detached old/reference scores cannot supply a gradient with respect to the current model.'
          }
        </Prose>

        <span id="2-core-intuition" aria-hidden="true" />
        <span id="2-build-the-intuition" aria-hidden="true" />
        <H2>{'3. Compare answers within their prompt'}</H2>

        <Prose>
          {
            "We now have token probabilities. What coefficient should multiply their gradients? Group-relative methods compare each response's reward with the rewards of other responses to the same prompt. A response receives a positive coefficient when it is better than its sampled siblings and a negative one when it is worse."
          }
        </Prose>

        <RewardRuler />

        <Prose>
          {'For the four rewards '}
          <InlineMath>{'(-1,-1,+1,+1)'}</InlineMath>
          {
            ', adding and dividing by four gives mean 0. Subtracting that mean leaves two negative and two positive displacements. Their squared values sum to 4; dividing by three gives sample variance '
          }
          <InlineMath>{'4/3'}</InlineMath>
          {
            '. Its square root is about 1.155. Dividing each displacement by this scale gives approximately '
          }
          <InlineMath>{'(-.866,-.866,+.866,+.866)'}</InlineMath>
          {', before the tiny denominator safeguard. These signed, scaled comparisons are the '}
          <strong>{'advantages'}</strong>
          {
            '. Each response passes its one advantage to every selected token; it is not a token-by-token assessment.'
          }
        </Prose>

        <Prose>
          {'For a group of '}
          <InlineMath>{'G\\ge2'}</InlineMath>
          {' responses, define its mean '}
          <InlineMath>{'\\bar R'}</InlineMath>
          {', sample standard deviation '}
          <InlineMath>{'s_R'}</InlineMath>
          {', and standardized '}
          <strong>{'advantage'}</strong> <InlineMath>{'A_i'}</InlineMath>
          {':'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\bar R=\\frac1G\\sum_{i=1}^{G}R_i,\\qquad\ns_R=\\sqrt{\\frac{\\sum_i(R_i-\\bar R)^2}{G-1}},\\qquad\nA_i=\\frac{R_i-\\bar R}{s_R+\\varepsilon}.'
            }
          </MathBlock>
        </div>

        <Prose>
          {'The small positive '}
          <InlineMath>{'\\varepsilon'}</InlineMath>
          {
            ' prevents division by zero. The pinned original verl implementation uses sample standard deviation and '
          }
          <InlineMath>{'\\varepsilon=10^{-6}'}</InlineMath>
          {'. The ordinary TRL route later uses '}
          <InlineMath>{'10^{-4}'}</InlineMath>
          {'. Both are specified rather than silently treated as identical.'}
        </Prose>

        <HomogeneousGroups />

        <Prose>
          {
            'If every response gets +1, all centered rewards are zero. The same is true when every response gets −1. Neither group gives a relative policy signal. With '
          }
          <InlineMath>{'\\beta=0'}</InlineMath>
          {
            ' and no other objective, the corresponding policy-gradient terms are zero. The all-correct group and all-wrong group nevertheless have very different task meanings, so report them separately.'
          }
        </Prose>

        <Prose>
          {'Changing the reward scale also needs care. If '}
          <InlineMath>{"R'_i=cR_i+b"}</InlineMath>
          {' with '}
          <InlineMath>{'c>0'}</InlineMath>
          {', then centering removes '}
          <InlineMath>{'b'}</InlineMath>
          {' and the standard deviation scales by '}
          <InlineMath>{'c'}</InlineMath>
          {
            '. Without epsilon, the standardized advantages are unchanged. With a fixed epsilon, they become '
          }
          <InlineMath>{'(R_i-\\bar R)/(s_R+\\varepsilon/c)'}</InlineMath>
          {', which need not be exactly equal. Scaling epsilon by '}
          <InlineMath>{'c'}</InlineMath>
          {
            ' restores exact equality. This is why “+1/−1 and 1/0 rewards are equivalent” needs a numerical qualification.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>{'Deeper: what normalization does not prove.'}</strong>
          {
            ' A self-including sample mean is correlated with the sampled action whose score it multiplies. Even without standardization, its expected finite-group score estimator has a '
          }
          <InlineMath>{'(G-1)/G'}</InlineMath>
          {
            ' factor relative to the raw expected-reward gradient under the usual IID assumptions. A leave-one-out baseline removes that particular factor. Dividing by a random group standard deviation introduces another weighting. These choices can work well, but standardized group advantages are not an automatic unbiased estimator of every proposed population objective. The linked GRPO lesson derives these distinctions explicitly.'
          }
        </Prose>

        <H2>{'4. Read clipping as a slope, not a fence'}</H2>

        <Prose>
          {
            "An old-policy sample may become much more likely as the current model changes. The clipped surrogate limits the incentive to keep improving an already favourable sampled action. It does this by changing the objective's slope; it does not project the model's probabilities into a permitted interval."
          }
        </Prose>

        <SignedClip />

        <Prose>
          {
            'Start with advantage +1 and ratio 1.25 in the drawing. The objective compares the raw contribution 1.25 with a clipped contribution. Symmetric .2 clipping caps that second value at 1.2, so the smaller value is 1.2. Raising the upper epsilon to .28 permits 1.25. With advantage −1, the raw value is −1.25, smaller than the symmetrically clipped −1.2; both recipes therefore keep −1.25. Making this unfavourable action more likely still worsens the objective. We call the quantity being maximized the '
          }
          <strong>{'surrogate'}</strong>
          {'; the minimized loss is its negative.'}
        </Prose>

        <Prose>
          {'Write the lower ratio bound as '}
          <InlineMath>{'l=1-\\epsilon_{\\mathrm{low}}'}</InlineMath>
          {' and the upper bound as '}
          <InlineMath>{'u=1+\\epsilon_{\\mathrm{high}}'}</InlineMath>
          {'. For one token, the maximized surrogate and minimized loss are'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {'S(r,A)=\\min\\{rA,\\operatorname{clip}(r,l,u)A\\},\\qquad\nL(r,A)=-S(r,A).'}
          </MathBlock>
        </div>

        <Prose>
          {'For '}
          <InlineMath>{'A>0'}</InlineMath>
          {', the surrogate rises with '}
          <InlineMath>{'r'}</InlineMath>
          {' until '}
          <InlineMath>{'r=u'}</InlineMath>
          {', then stays at '}
          <InlineMath>{'uA'}</InlineMath>
          {'. Making a good sampled action less likely, even below '}
          <InlineMath>{'l'}</InlineMath>
          {', still makes the objective worse. For '}
          <InlineMath>{'A<0'}</InlineMath>
          {', the surrogate is flat below '}
          <InlineMath>{'l'}</InlineMath>
          {' and decreases with '}
          <InlineMath>{'r'}</InlineMath>
          {' above '}
          <InlineMath>{'l'}</InlineMath>
          {'. The sign reverses which side becomes flat.'}
        </Prose>

        <Prose>
          {'Away from the knees, because '}
          <InlineMath>{'dr/d\\ell=r'}</InlineMath>
          {', the loss derivative with respect to the current selected log probability is '}
          <InlineMath>{'-rA'}</InlineMath>
          {
            ' on the active sloped branch and 0 on the flat branch. At an exact knee the mathematical function is nondifferentiable; finite gradient checks therefore use points away from it.'
          }
        </Prose>

        <ProbabilitySimplex />

        <Prose>
          {
            "The model's parameters are shared across tokens and examples. A large step, momentum, or gradients from other terms can move a probability beyond a clipping threshold. Once a particular term is flat, its own incentive stops; the rest of the parameter update does not disappear. A clipping threshold is therefore not a hard guarantee about the next model."
          }
        </Prose>

        <H2>{'5. Clip-Higher changes permission, not guaranteed entropy'}</H2>

        <Prose>
          {'DAPO separates the two clipping widths. Its '}
          <strong>{'Clip-Higher'}</strong>
          {
            ' setting keeps the lower epsilon at .2 and uses an upper epsilon of .28. A positive-advantage token can remain on the rising branch over a wider range. The motivation is to avoid suppressing useful exploration too early in long-response training.'
          }
        </Prose>

        <EntropyChange />

        <Prose>
          {
            'For an old probability .01, a ratio of 1.2 means current probability .012; 1.28 means .0128. For an old probability .5, the same ratios mean .6 and .64. These are absolute-probability interpretations of the ratios, not promises that an optimizer will reach those values. The distribution must still normalize, so increasing one token changes the mass available to others.'
          }
        </Prose>

        <Prose>{"Entropy measures a distribution's spread:"}</Prose>

        <div className="neural-equation">
          <MathBlock>{'H(p)=-\\sum_a p_a\\log p_a.'}</MathBlock>
        </div>

        <Prose>
          {'For a binary distribution '}
          <InlineMath>{'(.8,.2)'}</InlineMath>
          {', entropy is about .5004 nats. Increasing the already dominant action to .9 produces '}
          <InlineMath>{'(.9,.1)'}</InlineMath>
          {
            " with entropy about .3251 nats. The rewarded action became more likely while entropy fell. Clip-Higher can permit that update. The paper's observed entropy behaviour is empirical; asymmetric clipping alone does not guarantee that entropy rises or remains above a floor."
          }
        </Prose>

        <NegativeDualClip />

        <Prose>
          {''}
          <strong>{'Deeper: a reproduction adds dual clipping.'}</strong>
          {
            " The pinned original reproduction's loss implementation supports an additional constant "
          }
          <InlineMath>{'c>1'}</InlineMath>
          {' and its run script uses '}
          <InlineMath>{'c=10'}</InlineMath>
          {'. For negative advantages, it replaces the ordinary minimized loss by'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'L_{\\mathrm{dual}}(r,A)=\\min\\{L(r,A),-cA\\},\\quad A<0.'}</MathBlock>
        </div>

        <Prose>
          {'For positive advantages it leaves the ordinary loss unchanged. At '}
          <InlineMath>{'A=-2'}</InlineMath>
          {', the extra cap is 20. At '}
          <InlineMath>{'r=12'}</InlineMath>
          {
            ", the ordinary loss is 24, so dual clipping returns 20 and removes that term's slope there. This is a second, source-specific operation, not another name for the asymmetric interval "
          }
          <InlineMath>{'.8'}</InlineMath>
          {' to '}
          <InlineMath>{'1.28'}</InlineMath>
          {
            '. Our primary local campaigns leave dual clipping disabled; the finite program exposes and checks it separately.'
          }
        </Prose>

        <H2>{'6. Decide what gets equal weight'}</H2>

        <Prose>
          {
            "Clipping determines each selected token's contribution. We still need to combine those contributions into one scalar. Suppose one response has two selected tokens and another has six. Should the two responses have equal total weight, or should every selected token have equal weight?"
          }
        </Prose>

        <RaggedWeights />

        <Prose>
          {
            "With the two responses in the drawing, equal response weight gives each row one half of the total influence. The first row's two tokens therefore receive 1/4 each; the second row's six tokens receive 1/12 each. Equal token weight instead gives all eight tokens 1/8: the short response has total weight 1/4 and the long one 3/4. If the rows' mean contributions are 1 and 3, equal response weight gives "
          }
          <InlineMath>{'(1+3)/2=2'}</InlineMath>
          {', while equal token weight gives '}
          <InlineMath>{'(2\\cdot1+6\\cdot3)/8=2.5'}</InlineMath>
          {'.'}
        </Prose>

        <Prose>
          {'Let '}
          <InlineMath>{'M_{i,t}'}</InlineMath>
          {' be 1 for an included response token and 0 otherwise, and let '}
          <InlineMath>{'L_i=\\sum_tM_{i,t}'}</InlineMath>
          {'. For '}
          <InlineMath>{'N'}</InlineMath>
          {' nonempty responses, those two choices generalize to'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\mathcal L_{\\mathrm{response}}=\n\\frac1N\\sum_i\\frac{\\sum_tM_{i,t}L(r_{i,t},A_i)}{L_i},\n\\qquad\n\\mathcal L_{\\mathrm{token}}=\n\\frac{\\sum_{i,t}M_{i,t}L(r_{i,t},A_i)}{\\sum_{i,t}M_{i,t}}.'
            }
          </MathBlock>
        </div>

        <LossMass />

        <Prose>
          {
            "This is DAPO's token-level aggregation distinction. GRPO already uses per-token likelihood ratios; DAPO does not introduce those ratios from sequence-level GRPO. The change here is the reduction. Longer responses receive more total influence under token averaging because they contain more included terms. That is a weighting choice, not a theorem that every length bias disappears."
          }
        </Prose>

        <Prose>
          {
            'An all-empty selected mask has denominator 0. Our scratch program rejects it rather than reporting a successful zero loss. An optional library clamp may return a numerical value in that situation, but no token evidence was used. Always inspect the selected count along with the loss.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>{"Deeper: compare Dr. GRPO's question."}</strong>
          {
            " Dr. GRPO removes per-response length normalization and the group standard-deviation scaling, and uses a fixed normalizing constant such as a generation budget. Pooled-token averaging still has a denominator that changes with the sampled batch's lengths. Those are different objectives and estimators. Removing a variable length factor also does not, by itself, remove the finite-group self-mean factor derived earlier. State the target gradient and assumptions before calling an estimator unbiased."
          }
        </Prose>

        <H2>{'7. Refill with complete prompt groups'}</H2>

        <Prose>
          {
            "Token averaging decides how retained tokens count. But a batch of all-correct or all-wrong groups still has no relative correctness signal. DAPO's "
          }
          <strong>{'dynamic sampling'}</strong>
          {
            ' generates more candidate prompt groups and retains eligible groups until it fills a target training batch.'
          }
        </Prose>

        <WholeGroupCollector />

        <Prose>
          {
            'The unit of selection is a whole prompt group. For binary correctness, a mixed group has at least one passing and at least one failing answer. If '
          }
          <InlineMath>{'C_i\\in\\{0,1\\}'}</InlineMath>
          {' records correctness, eligibility is '}
          <InlineMath>{'0<\\sum_{i=1}^GC_i<G'}</InlineMath>
          {'. The first and last conditions reject all-wrong and all-correct groups, respectively.'}
        </Prose>

        <Prose>
          {
            'Imagine a target of two eligible prompts, each with four responses. The first candidate batch has two homogeneous groups, so it fills no slots. The second has one mixed group and one homogeneous group, so it fills one slot. The third supplies another mixed group and completes the target. Every generated answer counts as work, including discarded groups and an eligible group generated after the final available slot is filled.'
          }
        </Prose>

        <Prose>
          {
            'The original recipe samples additional candidate questions. It does not require retrying the same failed question indefinitely. Our local collector uses an explicit, fixed candidate order and a maximum of three batches. If it cannot fill its target, it records an '
          }
          <strong>{'exhausted slot'}</strong>
          {
            ' and makes no optimizer update for that slot. Reporting that outcome is more informative than silently changing the budget until a mixed group appears.'
          }
        </Prose>

        <IdentityJoin />

        <Prose>
          {
            'Filtering must preserve identity. Suppose response rows for prompts C and A survive. Their corresponding prompt rows, old log probabilities, masks and rewards must also be C and A. Combining retained responses with the first two unfiltered prompts A and B evaluates the wrong conditional probabilities. A plausible scalar loss would not reveal that error.'
          }
        </Prose>

        <Prose>
          {
            'The local collector retains complete row records with prompt, group and response IDs. Tensor packing happens after selection. Selecting the same UIDs after a storage permutation preserves their contents. Changing candidate arrival order can still change which eligible groups fit a finite quota; that is a selection-policy change, not an identity-join guarantee.'
          }
        </Prose>

        <Prose>
          {'Selection also needs an explicit '}
          <strong>{'metric'}</strong>
          {
            '. Our main collector filters binary correctness. The eventual loss can use correctness plus a length penalty. A group can be homogeneous in correctness and heterogeneous in shaped reward. Those two filters would retain different data; neither should be called simply “remove zero-variance groups” without naming the variance.'
          }
        </Prose>

        <span id="8-what-scales-and-what-doesnt" aria-hidden="true" />
        <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
        <H2>{'8. Account for the cost and selection effect'}</H2>

        <Prose>
          {
            'Refilling improves the proportion of informative retained groups. It also spends generation work on rejected candidates and changes the distribution of prompts used for updates. We can see both effects in a small probability model before interpreting a measured speed claim.'
          }
        </Prose>

        <MixedGroupCost />

        <Prose>
          {
            'Take two independent responses, each correct with probability .5. The tree has four equally likely outcomes: pass/pass, pass/fail, fail/pass and fail/fail. Only the middle two are mixed, so acceptance probability is .5. With unlimited independent candidate trials of this kind, three accepted groups require '
          }
          <InlineMath>{'3/.5=6'}</InlineMath>
          {
            ' candidates on average. An average is not a guarantee that a budget of six will succeed.'
          }
        </Prose>

        <Prose>
          {'For a fixed prompt with independent responses and correctness probability '}
          <InlineMath>{'p'}</InlineMath>
          {', all '}
          <InlineMath>{'G'}</InlineMath>
          {' responses pass with probability '}
          <InlineMath>{'p^G'}</InlineMath>
          {'; all fail with probability '}
          <InlineMath>{'(1-p)^G'}</InlineMath>
          {'. Subtracting these disjoint homogeneous events gives mixed probability'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'a(p)=1-p^G-(1-p)^G.'}</MathBlock>
        </div>

        <Prose>
          {
            'With the same positive acceptance probability on each independent trial, the unlimited expected candidate count for '
          }
          <InlineMath>{'K'}</InlineMath>
          {' accepted groups is '}
          <InlineMath>{'K/a(p)'}</InlineMath>
          {'.'}
        </Prose>

        <Prose>
          {'When '}
          <InlineMath>{'p=0'}</InlineMath>
          {' or '}
          <InlineMath>{'p=1'}</InlineMath>
          {
            ', acceptance is zero. No finite number of retries can produce a mixed group under those assumptions. A real model may have correlated responses, and different prompts have different probabilities; those facts can invalidate the simple cost prediction. The formula is a mechanism model whose assumptions must travel with it.'
          }
        </Prose>

        <AcceptedMixture />

        <Prose>
          {
            'Suppose half the candidate prompts are always answered correctly and half produce a mixed group with probability .5. The first type contributes '
          }
          <InlineMath>{'.5\\cdot0=0'}</InlineMath>
          {' accepted mass; the second contributes '}
          <InlineMath>{'.5\\cdot.5=.25'}</InlineMath>
          {
            '. After dividing by total accepted mass .25, every retained prompt belongs to the second type. Selection has changed the prompt distribution.'
          }
        </Prose>

        <Prose>
          {'Let candidate prompt type '}
          <InlineMath>{'j'}</InlineMath>
          {' have mass '}
          <InlineMath>{'w_j'}</InlineMath>
          {' and mixed probability '}
          <InlineMath>{'a_j'}</InlineMath>
          {'. Multiplying each mass by its acceptance probability and renormalizing gives'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>{"w'_j=\\frac{w_ja_j}{\\sum_k w_ka_k},"}</MathBlock>
        </div>

        <Prose>
          {
            'when the denominator is positive. This can usefully focus updates, but a lower loss on the retained data is not automatically an improvement on the original task mixture.'
          }
        </Prose>

        <Prose>
          {
            'For efficiency, count candidate groups, generated tokens, retained tokens, actual optimizer updates and elapsed time. “Fewer training steps” compares only one of those quantities. An accepted step can become more expensive as the model solves more questions and homogeneous groups become common.'
          }
        </Prose>

        <H2>{'9. Treat truncation and length reward separately'}</H2>

        <Prose>
          {
            'Even an eligible group can contain a response cut off before its final answer. The model can stop by emitting EOS, or the generator can stop because it reaches a maximum token count. These are different termination events. If a checker receives an unfinished response, a low reward may reflect the budget rather than the correctness of a complete proposed answer.'
          }
        </Prose>

        <TerminationMasks />

        <Prose>{'There are at least three possible interventions:'}</Prose>

        <NeuralTable
          caption={'9. Treat truncation and length reward separately'}
          headers={[<>{'Intervention'}</>, <>{'What changes'}</>, <>{'What can remain active'}</>]}
          rows={[
            [
              <>{'Set its terminal reward to zero'}</>,
              <>{'The scalar used in group statistics'}</>,
              <>{'Its advantage can be nonzero relative to siblings'}</>,
            ],
            [
              <>{'Remove its response from the loss mask'}</>,
              <>{'Its selected token contributions'}</>,
              <>
                {
                  "Its reward may still affect siblings' group statistics, depending on the implementation"
                }
              </>,
            ],
            [
              <>{'Add a length penalty'}</>,
              <>{'The shaped reward before centering'}</>,
              <>{'The response can still contribute every token to the loss'}</>,
            ],
          ]}
        />

        <Prose>
          {'For rewards '}
          <InlineMath>{'(0,1,1,1)'}</InlineMath>
          {
            ', the zero-reward response has centered value −.75. Zero reward is therefore not equivalent to removing its gradient. Likewise, removing its loss tokens is not necessarily equivalent to removing it from the reward-normalization group. Read both the mask and group-statistic code.'
          }
        </Prose>

        <LengthBuffer />

        <Prose>
          {
            "With the paper's maximum length 20,480 and buffer 4,096, subtracting the buffer locates the penalty's start at 16,384 tokens. A response of length 18,432 lies halfway across that buffer: "
          }
          <InlineMath>{'(16{,}384-18{,}432)/4{,}096=-.5'}</InlineMath>
          {'. The penalty is zero before the buffer and reaches −1 at the maximum.'}
        </Prose>

        <Prose>
          {"DAPO's soft length penalty therefore starts before the hard generation limit. Let "}
          <InlineMath>{'M'}</InlineMath>
          {' be the maximum response length and '}
          <InlineMath>{'B'}</InlineMath>
          {' be a positive buffer with '}
          <InlineMath>{'B\\le M'}</InlineMath>
          {':'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              'P(L)=\\begin{cases}\n0,&L\\le M-B,\\\\\n(M-B-L)/B,&M-B<L\\le M,\\\\\n-1,&L>M.\n\\end{cases}\n\\qquad R_i=R^{\\mathrm{correctness}}_i+P(L_i).'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'A generator enforcing the cap never produces a longer response, but the final branch makes the mathematical function explicit. The pinned reward helper implements it directly.'
          }
        </Prose>

        <Prose>
          {
            'Our tiny demonstration uses cap 8 and buffer 4 so the same arithmetic can be inspected on short outputs. Those numbers are not recommendations for reasoning tasks. We count genuine emitted EOS as a token and determine truncation from the termination event: EOS exactly at the cap still means the model emitted a stop token.'
          }
        </Prose>

        <Prose>
          {
            "The original reproduction reports that its best runs mostly omit hard overlong filtering. TRL's published DAPO configuration example instead enables "
          }
          <code>{'mask_truncated_completions'}</code>
          {
            '. Our primary native campaign leaves it disabled; its finite preflight separately examines the optional resulting mask. The source comparison later keeps these recipes distinct. Soft shaping and hard masking must not be silently merged under one “overlong handling” flag.'
          }
        </Prose>

        <span id="3-mathematical-foundation" aria-hidden="true" />
        <span id="3-make-the-idea-precise" aria-hidden="true" />
        <H2>{'10. Assemble the actual objective and gradient'}</H2>

        <Prose>
          {
            'We can now assemble a precise local variant. Generate complete prompt groups, filter on correctness variation, shape rewards by length, compute group advantages, score the selected tokens with old and current policies, apply asymmetric clipping, and pool the selected token terms. Hold old scores, rewards and masks fixed during each update.'
          }
        </Prose>

        <SoftmaxGradient />

        <Prose>
          {
            'For our primary DAPO-component objective, with no reference KL, hard truncation mask or dual clipping, the minimized loss is'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\mathcal L(\\theta)=\n-\\frac1Z\\sum_{i,t}M_{i,t}\n\\min\\!\\left(r_{i,t}(\\theta)A_i,\n\\operatorname{clip}(r_{i,t}(\\theta),.8,1.28)A_i\\right),\n\\quad Z=\\sum_{i,t}M_{i,t}>0.'
            }
          </MathBlock>
        </div>

        <Prose>
          {'The tensor dimensions help locate mistakes: current/old logps and mask are '}
          <InlineMath>{'N\\times T'}</InlineMath>
          {', one advantage per response is '}
          <InlineMath>{'N'}</InlineMath>
          {', and broadcasting it across positions gives '}
          <InlineMath>{'N\\times T'}</InlineMath>
          {'. The selected-token count '}
          <InlineMath>{'Z'}</InlineMath>
          {' is a scalar. Prompt tokens remain visible to the model but have zero target mask.'}
        </Prose>

        <Prose>
          {'Suppose one selected action '}
          <InlineMath>{'a'}</InlineMath>
          {' has probability '}
          <InlineMath>{'p_a'}</InlineMath>
          {' from logits '}
          <InlineMath>{'z'}</InlineMath>
          {'. Softmax gives the useful derivative'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'\\frac{\\partial\\log p_a}{\\partial z_k}\n=\\mathbf1[k=a]-p_k.'}</MathBlock>
        </div>

        <Prose>
          {"On an unclipped branch, this token's contribution to the logit gradient is "}
          <InlineMath>{'(-rA/Z)(\\mathbf e_a-p)'}</InlineMath>
          {
            ". On its flat branch, that contribution is zero. All logit coordinates participate because probabilities share normalization. The full language-model gradient then follows the logits back through the same network; it is not a separate independent update of each token's probability."
          }
        </Prose>

        <Prose>
          {
            'Masking can also affect numerical stability. Multiplying an overflowed unselected exponential by zero can produce NaN. The local objective first replaces unselected log-ratios with zero, computes the ratio, then reduces only selected terms. It rejects nonfinite selected inputs and an empty mask. That numerical protection does not discard difficult but valid selected rows.'
          }
        </Prose>

        <MicrobatchCount />

        <Prose>
          {''}
          <strong>{'Deeper: preserve the denominator across microbatches.'}</strong>
          {
            ' Suppose one microbatch contains 2 selected tokens with total loss 2, and another contains 6 with total loss 18. The whole-batch token mean is '
          }
          <InlineMath>{'(2+18)/(2+6)=2.5'}</InlineMath>
          {'. Averaging the two local means gives '}
          <InlineMath>{'(1+3)/2=2'}</InlineMath>
          {', a different objective.'}
        </Prose>

        <Prose>
          {
            'To preserve the global mean, accumulate both numerators and counts, or divide each differentiable numerator by the same known global count 8 and sum the losses. Do not take another average afterward. Across processes, the scaling must also account for whether distributed gradient reduction sums or averages.'
          }
        </Prose>

        <Prose>
          {
            'The pinned original verl actor weights dynamic microbatch means by the number of response rows. That does not automatically equal weighting by selected token counts when lengths differ. Modern library implementations can use a generation-batch token normalizer with process/accumulation factors. We inspect the pinned native denominator and compare actual gradients instead of assuming that a '
          }
          <code>{'token-mean'}</code>
          {' label establishes equivalence at every batching boundary.'}
        </Prose>

        <span id="4-from-scratch-implementation" aria-hidden="true" />
        <H2>{'11. Implement a collector that cannot lose identity'}</H2>

        <Prose>
          {
            'The objective is now explicit. The next risk is feeding it the wrong rows. A response, its prompt, its reward and its old log probabilities form one record. They must survive filtering together.'
          }
        </Prose>

        <RecordMemory />

        <Prose>
          {
            "Suppose the incoming prompts are A, B and C. The collector retains C and A. Gathering completions with indices [2,0] but taking the first two prompt rows pairs C's response with A and A's response with B. All tensor dimensions can still match. The loss runs, but it scores responses in the wrong contexts. This is a semantic error that a shape assertion cannot catch."
          }
        </Prose>

        <Prose>
          {''}
          <code>{'complete_groups'}</code>
          {
            ' checks unique response UIDs, exactly G rows per group, one prompt identity per group and identical prompt token sequences within that group. '
          }
          <code>{'collect'}</code>
          {' retains entire original records. Its '}
          <code>{'decisions'}</code>
          {
            ' list also records generated groups excluded by the quota, so discarded work remains visible. A caller must inspect '
          }
          <code>{'status'}</code>
          {
            ': an exhausted collector may contain some eligible groups but has not fulfilled the requested optimization batch. Our training program records that slot and performs no update.'
          }
        </Prose>

        <Prose>
          {'Download and extract the '}
          <a href={'/learn-code/dapo-examples.zip'}>{'complete program archive'}</a>
          {'. The '}
          <a href={'/learn-code/dapo/README.md'}>{'README'}</a>
          {' describes its files and environment. In the extracted '}
          <code>{'dapo'}</code>
          {' directory, create a Python 3.12 virtual environment with '}
          <code>{'python -m venv .venv'}</code>
          {', activate it for your shell ('}
          <code>{'.venv\\Scripts\\Activate.ps1'}</code>
          {' in PowerShell or '}
          <code>{'source .venv/bin/activate'}</code>
          {' in bash), then install '}
          <code>{'python -m pip install -r requirements.txt'}</code>
          {'. Run '}
          <code>{'python dapo_checks.py --output finite.json'}</code>
          {' from that same directory. '}
          <code>{'dapo_collect.py'}</code>
          {' and '}
          <code>{'dapo_math.py'}</code>
          {
            ' are imported helpers; the finite check command uses constructed tensors and the library reward helper without loading or training a language model. The model-acquisition commands follow in section 12.'
          }
        </Prose>

        <Program file="dapo_collect.py" />

        <Prose>
          {'Read the collector from the inner loop outward. '}
          <code>{'mixed'}</code>
          {' asks whether both correctness outcomes occur. '}
          <code>{'room'}</code>
          {
            ' asks whether another complete group fits. Only their conjunction selects a group in dynamic mode. Reordering storage within a known group must preserve its fields. Changing the arrival order of eligible groups can change which ones fill the quota; the program does not claim that a first-arrival policy is permutation invariant.'
          }
        </Prose>

        <FiniteBatchDebugger />

        <Prose>
          {'The objective receives already gathered current and old token log probabilities. '}
          <code>{'advantages'}</code>
          {' detaches the group statistics; '}
          <code>{'objective'}</code>
          {
            ' broadcasts one coefficient per response, computes the signed clipped surrogate and reduces over explicit selected positions. It returns intermediate tensors so a failed case can be inspected without reimplementing the loss in a plotting script.'
          }
        </Prose>

        <Program file="dapo_math.py" />

        <Prose>
          {
            'Padding is an address convention, not a reward convention. If PAD and EOS share an ID, comparing every token ID with EOS would erase a genuine emitted EOS. The recorded generation length determines which positions are valid. The causal gather scores each completion token from its preceding prefix, including the first completion token predicted from the last prompt position.'
          }
        </Prose>

        <Prose>
          {''}
          <code>{'dapo_checks.py'}</code>
          {
            " exercises the branches that a lucky model batch can miss: positive and negative clipping, optional dual clipping, unequal lengths, all-masked rejection, whole-group selection, quota overflow, finite exhaustion, microbatch denominators and the ordinary library's soft length penalty. Its finite-difference checks stay away from clipping knees, where the loss is continuous but a unique derivative need not exist."
          }
        </Prose>

        <Program file="dapo_checks.py" />

        <H2>{'12. Run a small real language-model update'}</H2>

        <Prose>
          {
            'Finite examples establish the calculation. A language-model run adds a causal network, real text, stochastic generation and parameter sharing across tokens. We reuse the exact small checkpoint from '
          }
          <a
            href={
              '/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models'
            }
          >
            {'Supervised Fine-Tuning'}
          </a>
          {' and the sampler taught in '}
          <a
            href={
              '/learn/path/full-curriculum/grpo-rloo-kto-advanced-preference-methods?module=large-language-models'
            }
          >
            {'GRPO, RLOO and KTO'}
          </a>
          {'. The new code implements the collector and objective around those components.'}
        </Prose>

        <ModelStructure />

        <Prose>
          {
            'The saved Pythia14m configuration has vocabulary size 50,304, hidden width 128, six blocks, four attention heads per block and MLP width 512. Its input embedding and vocabulary head are untied. Transformers executes that architecture; PyTorch differentiates it. We keep dropout disabled so generation and old-policy rescoring describe the same distribution.'
          }
        </Prose>

        <Prose>
          {
            'The task is Poem Sentiment. A prompt contains a real poem excerpt and asks for one label. The verifier checks the emitted label against the dataset label. This makes group selection and token loss observable on modest hardware. It does not measure long mathematical reasoning. The first 16 training records and first 32 test records, ordered by original ID after removing mixed labels, are the same demonstration cohort used in the prerequisite. Their repeated use must not be mistaken for an untouched benchmark.'
          }
        </Prose>

        <Prose>
          {'All six runs start from the same SFT response-only seed 17 selected checkpoint. The '}
          <code>{'model.safetensors'}</code>
          {' identity is '}
          <code>{'8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd'}</code>
          {
            '. Seeds 73, 89 and 101 prescribe prompt order and generation randomness; they do not select three different initial models. Both methods share the candidate prompt plan, although different updates can make their later generated answers differ even when their sampling seeds agree.'
          }
        </Prose>

        <NeuralTable
          caption={'12. Run a small real language-model update'}
          headers={[
            <>{'Setting'}</>,
            <>{'Response baseline'}</>,
            <>{'Combined DAPO components'}</>,
          ]}
          rows={[
            [<>{'Prompt groups per filled slot'}</>, <>{'2'}</>, <>{'2'}</>],
            [<>{'Responses per prompt'}</>, <>{'4'}</>, <>{'4'}</>],
            [<>{'Candidate batches per slot'}</>, <>{'1'}</>, <>{'At most 3'}</>],
            [
              <>{'Eligible groups'}</>,
              <>{'Every complete group'}</>,
              <>{'Mixed correctness only'}</>,
            ],
            [<>{'Correctness reward'}</>, <>{'+1 or −1'}</>, <>{'+1 or −1'}</>],
            [<>{'Extra length reward'}</>, <>{'None'}</>, <>{'Cap 8, buffer 4 soft penalty'}</>],
            [<>{'Clip widths'}</>, <>{'.2 below, .2 above'}</>, <>{'.2 below, .28 above'}</>],
            [<>{'Reduction'}</>, <>{'Mean of response means'}</>, <>{'Mean of selected tokens'}</>],
            [<>{'Scheduled slots'}</>, <>{'2'}</>, <>{'2'}</>],
            [<>{'Updates per filled slot'}</>, <>{'2'}</>, <>{'2'}</>],
          ]}
        />

        <Prose>
          {
            'Both use sample standard deviation plus 1e−6, plain SGD at 1e−4, full-support temperature 1 sampling, genuine EOS stopping and an eight-token generation cap. Neither has a KL term, dual clipping or hard-overlong loss masking. The old scores remain fixed across the two updates on each collected batch. If a combined-arm slot exhausts its candidate budget, it receives zero updates; the program does not keep trying until the result looks useful.'
          }
        </Prose>

        <SavedRolloutLedger />

        <Prose>
          {
            "The training loop first saves raw candidate records and gathers whole eligible groups. It then recomputes old token scores, checks them against the probabilities used during generation and takes the two prescribed updates. Every selected token's current score and clipped term remain inspectable. Finally it evaluates the terminal policy and verifies that a saved-and-reloaded model has exactly the same parameters. Reload equality checks serialization; it does not establish better predictions."
          }
        </Prose>

        <Program file="train_dapo.py" />

        <Prose>
          {
            'Use Python 3.12, create a virtual environment, and install the supplied pinned requirements. Reuse the SFT checkpoint directory, including its tokenizer; the downloadable sources contain acquisition instructions and data provenance. Adapted model weights are not bundled. A fresh SFT run produces a new model observation even if it uses the same command.'
          }
        </Prose>

        <CodeBlock language={'sh'}>
          {
            'python -m pip install -r requirements.txt\npython dapo_checks.py --output finite.json\npython train_dapo.py --model response-17/selected --data data --arm response-baseline --seed 73 --output runs/response-baseline-73\npython train_dapo.py --model response-17/selected --data data --arm dapo-components --seed 73 --output runs/dapo-components-73'
          }
        </CodeBlock>

        <Prose>
          {
            'Run the two training commands with seeds 89 and 101 and distinct corresponding directories to obtain the whole prespecified comparison. Each program refuses an existing run directory. Preserve failures and their saved state rather than overwriting them or changing the seed. A reviewed continuation from a coherent checkpoint is a different operation from silently restarting a failed fit.'
          }
        </Prose>

        <span id="5-production-implementation" aria-hidden="true" />
        <H2>{'13. Use the ordinary library route honestly'}</H2>

        <Prose>
          {
            'The local implementation makes each operation visible. The ordinary library route makes different responsibilities visible: an option can select a loss without supplying the entire algorithm around it.'
          }
        </Prose>

        <NativeMechanism />

        <Prose>
          {'The pinned TRL 1.14.2 route uses '}
          <code>{'GRPOTrainer'}</code>
          {' with '}
          <code>{'loss_type="dapo"'}</code>
          {', '}
          <code>{'epsilon=.2'}</code>
          {', '}
          <code>{'epsilon_high=.28'}</code>
          {', '}
          <code>{'beta=0'}</code>
          {' and '}
          <code>{'scale_rewards="group"'}</code>
          {
            ". Its correctness reward and ordinary soft-overlong reward are summed before normalization. The library's group denominator is sample standard deviation plus 1e−4, whereas our scratch route uses 1e−6. Small numerical conventions belong in the comparison, even when they rarely dominate the outcome."
          }
        </Prose>

        <Prose>
          {''}
          <code>{'loss_type="dapo"'}</code>
          {
            ' chooses a token normalization path. It does not provide the bounded mixed-group refill collector from section 7. A reward callback returns scores for completions that already exist; it cannot by itself request new prompt groups until a quota is filled. A pre-generation data collator has even less information: it has no sampled responses or observed correctness yet.'
          }
        </Prose>

        <Prose>
          {
            "The official TRL DAPO example enables hard truncation masking. Our primary native campaign disables it to keep its selected recipe explicit. A separate constructed preflight supplies a resulting mask with one truncated row removed. That tests the loss on the mask; it does not simulate every EOS/cap branch of the trainer's generation code."
          }
        </Prose>

        <NativeParity />

        <Prose>
          {
            'Before scientific updates, the program compares the maintained native loss with an explicit mathematical objective on six constructed cases: three signed log-probability shifts, each with and without the declared masked row. These FP64 cases exercise active and flat clipping branches. It compares every parameter gradient. Only the first case also compares a shadow SGD update. The preflight then restores all original FP32 parameters exactly. The shadow calculation is a parity fixture, not another training observation. Across the six cases, the largest all-parameter gradient discrepancy was 3.2792×10⁻¹²; the first shadow update differed by at most 2.1337×10⁻¹⁶.'
          }
        </Prose>

        <Prose>
          {
            'The actual native route then takes exactly two FP32 SGD updates. Its real generated rewards, masks, scores, losses and gradients are saved and checked separately. A genuine homogeneous group may have zero policy gradient; the constructed nonzero cases prevent that outcome from making the loss check vacuous. Floating-point agreement within declared tolerances is distinct from symbolic equality or identical sampling across implementations. Here the two actual native/manual losses were −0.1731900722 and 0 respectively, with zero maximum gradient discrepancy across 14,067,712 parameter entries in each comparison. The second zero loss belongs to the actual batch; it is not a substitute for the six constructed clipping checks.'
          }
        </Prose>

        <Program file="trl_dapo.py" />

        <Prose>
          {'Read '}
          <code>{'_compute_loss'}</code>
          {
            " alongside its explicit comparison. The denominator includes the native generation-batch selected-token count and the pinned trainer's process/accumulation scaling. That is why copying only a one-line token mean can fail when batch layout changes. This study uses one process and the fixed configuration in the program; a distributed adaptation needs its own scaling check."
          }
        </Prose>

        <CodeBlock language={'sh'}>
          {'python trl_dapo.py --model response-17/selected --data data --output runs/native'}
        </CodeBlock>

        <H2>{'14. Read observations without selecting a winner'}</H2>

        <Prose>
          {
            'The two implementations expose different parts of the system. Their results need the same care as their equations: a result must identify the workload, the denominator and the comparison it can support.'
          }
        </Prose>

        <ObservedOutcomes />

        <Prose>
          {'The evaluator keeps three questions separate. '}
          <strong>{'Response NLL'}</strong>
          {
            " pools the negative log probabilities of the gold label's tokens and EOS, conditioned on the supplied prompt. "
          }
          <strong>{'Free-generation accuracy'}</strong>
          {
            ' greedily chooses from the entire vocabulary until EOS or the eight-token cap; text outside the three permitted labels counts as an invalid prediction. '
          }
          <strong>{'Constrained accuracy'}</strong>
          {
            ' instead scores each of the three complete candidate labels, including EOS, and chooses the highest sequence log probability, without length normalization. That last decision rule cannot emit arbitrary text and is not free generation.'
          }
        </Prose>

        <Prose>
          {
            'Accuracy counts correct predicted labels. A target probability can rise without becoming the most probable label, so lower NLL with unchanged accuracy is possible. Conversely, a few argmax changes do not reveal every probability change. Inspect per-record outputs alongside both summaries.'
          }
        </Prose>

        <Prose>
          {'Every run starts at response NLL '}
          <strong>{'0.351335'}</strong>
          {' and '}
          <strong>{'20/32'}</strong>
          {
            ' correct under both decision rules. The prescribed outcomes are below. A stopped run has no terminal evaluation; a blank metric is not zero accuracy.'
          }
        </Prose>

        <NeuralTable
          caption={'14. Read observations without selecting a winner'}
          headers={[
            <>{'Route'}</>,
            <>{'Seed'}</>,
            <>{'Actual updates'}</>,
            <>{'Terminal response NLL'}</>,
            <>{'Free / constrained correct'}</>,
            <>{'Outcome'}</>,
          ]}
          rows={[
            [
              <>{'Response baseline'}</>,
              <>{'73'}</>,
              <>{'4'}</>,
              <>{'0.340288'}</>,
              <>{'20/32 / 20/32'}</>,
              <>{'Both slots filled'}</>,
            ],
            [
              <>{'Response baseline'}</>,
              <>{'89'}</>,
              <>{'4'}</>,
              <>{'0.343689'}</>,
              <>{'20/32 / 20/32'}</>,
              <>{'Both slots filled'}</>,
            ],
            [
              <>{'Response baseline'}</>,
              <>{'101'}</>,
              <>{'4'}</>,
              <>{'0.339069'}</>,
              <>{'19/32 / 19/32'}</>,
              <>{'Both slots filled'}</>,
            ],
            [
              <>{'Combined DAPO components'}</>,
              <>{'73'}</>,
              <>{'2'}</>,
              <>{'Not measured'}</>,
              <>{'Not measured'}</>,
              <>{'Score-consistency guard stopped slot 2'}</>,
            ],
            [
              <>{'Combined DAPO components'}</>,
              <>{'89'}</>,
              <>{'4'}</>,
              <>{'0.352159'}</>,
              <>{'20/32 / 20/32'}</>,
              <>{'Both slots filled'}</>,
            ],
            [
              <>{'Combined DAPO components'}</>,
              <>{'101'}</>,
              <>{'2'}</>,
              <>{'0.340385'}</>,
              <>{'18/32 / 18/32'}</>,
              <>{'One filled, one exhausted slot'}</>,
            ],
            [
              <>{'Separate native TRL route'}</>,
              <>{'73'}</>,
              <>{'2'}</>,
              <>{'0.337745'}</>,
              <>{'19/32 / 19/32'}</>,
              <>{'Two native updates; no refill'}</>,
            ],
          ]}
        />

        <Prose>
          {
            'Lower NLL does not guarantee more correct labels. Baseline seed 101 and the native route both improve NLL while losing one correct prediction. Combined seed 89 makes NLL slightly worse without changing the predicted-label count. Combined seed 101 stops collecting after its finite budget is exhausted; it has two actual updates and loses two correct predictions. These are the observations to explain, not reasons to search for a better seed.'
          }
        </Prose>

        <Prose>
          {
            'The combined seed 73 completed its first two updates. Before updating the second slot, a sampled selected-token log probability was −0.5820778608 while the batched recomputation was −0.5821170807. Their absolute difference was 0.0000392199, exceeding the declared '
          }
          <code>{'atol=2e-5, rtol=2e-5'}</code>
          {
            ' comparison for that value. The program preserved the complete batch, frozen old scores, model, optimizer and random state and stopped. We did not relax the guard, repeat the run, or manufacture a final metric. This is a failed consistency check between two scoring paths; the stored difference alone does not prove which floating-point operation caused it. The other originally prescribed runs were attempted once with their unchanged settings.'
          }
        </Prose>

        <Prose>
          {
            'All completed routes reload their saved weights exactly. Exact reload checks serialization; it cannot turn the failed score check or a worse prediction into a success. The full output retains every per-record prediction and every prescribed seed, including the interrupted one.'
          }
        </Prose>

        <WorkAccounting />

        <Prose>
          {
            "A selected group can be used in two optimizer iterations, so generated tokens, selected tokens and tokens processed by optimizer steps are different counts. An exhausted slot can have generated many tokens and selected a partial set, yet contribute no optimizer update. Count that work when discussing efficiency. Local timings include a shared host and the recorded workload. They are not a measurement of the paper's distributed throughput."
          }
        </Prose>

        <Prose>
          {'For example, the completed combined seed 101 generated '}
          <strong>{'107 tokens'}</strong>
          {' and selected '}
          <strong>{'31'}</strong>
          {" across its two slots. Only the filled slot's "}
          <strong>{'20'}</strong>
          {' tokens reached optimization; two iterations therefore processed '}
          <strong>{'40 selected-token positions'}</strong>
          {
            '. The other 11 selected tokens belonged to an exhausted partial batch and were not used for an update. Combined seed 89 generated 77 tokens, selected 39 and processed 78 selected-token positions over four updates. That distinction is what the cost drawing keeps visible.'
          }
        </Prose>

        <Prose>
          {
            'The interrupted seed 73 generated 126 tokens before stopping. Its first slot used 22 selected tokens twice, so 44 selected-token positions reached completed optimizer steps. Later generated or selected work is still real work, even though it cannot supply a terminal quality comparison.'
          }
        </Prose>

        <Prose>
          {
            "The combined arm changes selection, clipping, reward shaping and normalization together. Its difference from the response baseline cannot identify one component's causal effect. The native route also differs in batching and sampling details. All three seeds remain visible; choosing the best afterward would change the meaning of the experiment. The 32 repeatedly used test records support a small instructional comparison, not a general benchmark ranking."
          }
        </Prose>

        <Prose>
          {''}
          <code>{'report_dapo.py'}</code>
          {
            ' reads the six prescribed directories and the native directory. It makes no training calls and selects no winning seed. The complete source shows which stored quantities enter each displayed result.'
          }
        </Prose>

        <Program file="report_dapo.py" />

        <CodeBlock language={'sh'}>
          {'python report_dapo.py --runs runs --output observations.json'}
        </CodeBlock>

        <H2>{'15. Inspect the verifier and its data contract'}</H2>

        <Prose>
          {
            'The small run used sentiment labels. Return now to mathematical answers, where the boundary between a checkable output and a valid argument becomes sharper.'
          }
        </Prose>

        <IntegerParser />

        <Prose>
          {'Our finite parser finds the last literal '}
          <code>{'\\boxed{'}</code>
          {
            ' marker, takes characters up to the next closing brace, strips surrounding whitespace and accepts a signed decimal integer. It does not evaluate expressions. Thus '
          }
          <code>{'\\boxed{12}'}</code>
          {' can pass a target of 12; '}
          <code>{'\\boxed{6+6}'}</code>
          {
            ' fails this contract even though a person can evaluate it. Repeated boxes use the last marker. A marker nested inside another box can therefore be selected; this deliberately narrow parser is not a balanced-brace LaTeX parser.'
          }
        </Prose>

        <Prose>
          {
            'The pinned original DAPO checker has a different contract. Its default path looks for the last '
          }
          <code>{'Answer:'}</code>
          {
            ' match in a restricted trailing window and applies string normalization. Its optional strict-box path extracts a balanced boxed span from a shorter trailing window. The outer scoring function first keeps the final 300 characters; the ordinary strict-box branch then examines the final 100. The local full-context integer function is not an exact port of either route. A benchmark result is meaningful only together with the actual parser, normalization and extraction settings.'
          }
        </Prose>

        <Prose>
          {
            'The official data release makes integer answers convenient, but convenience does not establish the correctness of a transformed question. The retained sample contains twelve official records with question, target and source fields. It is a small inspection sample, not an audit of the entire corpus. The dataset metadata revision and the unversioned first-rows response are recorded separately; the sample is not asserted to come from that exact metadata revision.'
          }
        </Prose>

        <CircleCollision />

        <Prose>
          {
            "A concrete source audit shows why that distinction matters. The paper's appendix gives the circle"
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'x^2+y^2-22x-16y+113=0.'}</MathBlock>
        </div>

        <Prose>{'Complete the square by adding 121 and 64 inside the squared terms:'}</Prose>

        <div className="neural-equation">
          <MathBlock>{'(x-11)^2+(y-8)^2=121+64-113=72.'}</MathBlock>
        </div>

        <Prose>
          {'Its center is (11,8), radius is '}
          <InlineMath>{'\\sqrt{72}=6\\sqrt2'}</InlineMath>
          {', and its minimum x-coordinate is '}
          <InlineMath>{'11-6\\sqrt2'}</InlineMath>
          {". The inspected PDF's example prints "}
          <InlineMath>{'11-2\\sqrt6'}</InlineMath>
          {' instead. These are different real numbers.'}
        </Prose>

        <Prose>
          {'Yet the transformation asks for a sum of coefficients in the form '}
          <InlineMath>{'a-b\\sqrt c'}</InlineMath>
          {
            '. The triples (11,6,2) and (11,2,6) both sum to 19. A final integer checker can therefore accept 19 without detecting this intermediate disagreement. This is a specific collision in an inspected example, not a claim about the prevalence of errors throughout the released dataset.'
          }
        </Prose>

        <Prose>
          {
            'More generally, mapping a rich mathematical object to a small integer can be many-to-one. Specify a canonical representation when needed, preserve original solutions for auditing, and distinguish final-answer validity from proof validity. A strong reward optimizer cannot repair a verifier that measures the wrong property.'
          }
        </Prose>

        <span id="7-decision-matrix" aria-hidden="true" />
        <H2>{'16. Separate the paper result from the recipe you run'}</H2>

        <Prose>
          {
            'We have now examined an objective, a collector, a native route and a verifier. The published result combines these with a large model, substantial generation and a particular evaluation protocol.'
          }
        </Prose>

        <PaperProgression />

        <Prose>
          {
            'The DAPO paper reports the following cumulative AIME 2024 results for its Qwen2.5-32B setting. Each row adds to the preceding row.'
          }
        </Prose>

        <NeuralTable
          caption={'16. Separate the paper result from the recipe you run'}
          headers={[<>{'Cumulative configuration'}</>, <>{'AIME 2024 avg@32 (%)'}</>]}
          rows={[
            [<>{'Naive GRPO'}</>, <>{'30'}</>],
            [<>{'Add overlong filtering'}</>, <>{'36'}</>],
            [<>{'Add Clip-Higher'}</>, <>{'38'}</>],
            [<>{'Add soft overlong punishment'}</>, <>{'41'}</>],
            [<>{'Add token-level loss'}</>, <>{'42'}</>],
            [<>{'Add dynamic sampling'}</>, <>{'50'}</>],
          ]}
        />

        <Prose>
          {
            'The separately reported DeepSeek-R1-Zero-Qwen-32B comparison is 47. It is a 32B-model comparison, not a result against the full 671B DeepSeek-R1 model. '
          }
          <code>{'avg@32'}</code>
          {' averages repeated sampled correctness; it is not '}
          <code>{'pass@32'}</code>
          {
            ', which asks whether at least one of 32 samples succeeds, nor a consensus-vote score. The paper specifies evaluation temperature 1 and top-p .7. Its reported training-step reduction does not itself measure an equal reduction in generated tokens, hardware time or cost. '
          }
          <a href={'https://arxiv.org/abs/2503.14476'}>{'DAPO paper'}</a>
          {''}
        </Prose>

        <Prose>
          {
            'The path is informative but not a factorial experiment. For example, 50−42 is the observed increment when dynamic sampling is added after the earlier changes. It does not establish an eight-point effect in every configuration. Interactions between selection, lengths and gradients are precisely why the whole recipe matters.'
          }
        </Prose>

        <RecipeComparison />

        <NeuralTable
          caption={'16. Separate the paper result from the recipe you run'}
          headers={[
            <>{'Mechanism'}</>,
            <>{'Pinned original reproduction'}</>,
            <>{'This native route'}</>,
            <>{'This scratch combined route'}</>,
          ]}
          rows={[
            [<>{'Clip widths'}</>, <>{'.2/.28'}</>, <>{'.2/.28'}</>, <>{'.2/.28'}</>],
            [<>{'Dual clip'}</>, <>{'c=10'}</>, <>{'Disabled'}</>, <>{'Disabled'}</>],
            [<>{'KL loss/reward'}</>, <>{'Disabled'}</>, <>{'Disabled'}</>, <>{'Disabled'}</>],
            [
              <>{'Group selection'}</>,
              <>{'Correctness variation, bounded refill'}</>,
              <>{'No refill'}</>,
              <>{'Mixed correctness, bounded refill'}</>,
            ],
            [<>{'Responses per prompt'}</>, <>{'16'}</>, <>{'4'}</>, <>{'4'}</>],
            [
              <>{'Target prompts'}</>,
              <>{'512'}</>,
              <>{'1 per native generated group'}</>,
              <>{'2 per slot'}</>,
            ],
            [
              <>{'Candidate generation limit'}</>,
              <>{'10 batches'}</>,
              <>{'No refill batches'}</>,
              <>{'3 batches'}</>,
            ],
            [
              <>{'Maximum completion'}</>,
              <>{'20,480 tokens'}</>,
              <>{'8 tokens'}</>,
              <>{'8 tokens'}</>,
            ],
            [<>{'Soft buffer'}</>, <>{'4,096 tokens'}</>, <>{'4 tokens'}</>, <>{'4 tokens'}</>],
            [
              <>{'Loss normalization'}</>,
              <>{'Configured token mean; inspect actor batching'}</>,
              <>{'Pinned native token denominator'}</>,
              <>{'Global selected-token mean'}</>,
            ],
          ]}
        />

        <Prose>
          {
            'The original reproduction script and the later retained recipe both expose those large-scale group, clip and buffer settings, but they are different code snapshots. For example, the retained rollout GPU-memory setting changes from .7 to .80. The paper describes a 20-rollout-step warm-up, while the pinned scripts set '
          }
          <code>{'lr_warmup_steps=10'}</code>
          {
            "; those fields should not be silently declared identical. Configuration, units and the executing implementation all matter. The old actor's microbatch weighting issue from section 10 remains relevant even when the configuration says token mean."
          }
        </Prose>

        <Prose>
          {'The large recipe uses AdamW at '}
          <InlineMath>{'10^{-6}'}</InlineMath>
          {
            ' with weight decay and gradient clipping. The tiny local comparison deliberately uses plain SGD at '
          }
          <InlineMath>{'10^{-4}'}</InlineMath>
          {
            ' to expose the objective and parameter step. Neither its model scale, task, optimizer nor generation budget reproduces the paper. Use its code to understand and test mechanisms, then design an appropriate experiment for your target workload.'
          }
        </Prose>

        <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
        <H2>{'17. Diagnose failures with the right denominator'}</H2>

        <Prose>
          {
            'The recipe comparison explains why one headline curve is insufficient. Diagnosis follows the computation in order, so a downstream symptom does not conceal an earlier failure.'
          }
        </Prose>

        <FailureTrace />

        <Prose>
          {
            'First inspect generated prompt groups. Are most all-correct, all-wrong or mixed? Then inspect eligible and selected groups separately: quota overflow can discard eligible groups, and a budget can expire with a partial batch. Next inspect shaped rewards and advantages, genuine EOS/cap outcomes and selected-token counts. Only then interpret loss, clipping, gradient norm and parameter movement.'
          }
        </Prose>

        <Prose>
          {
            'A homogeneous reward group at beta 0 contributes no relative policy gradient. An entirely masked batch has no valid token denominator and should be rejected, not assigned a convenient zero loss. A generation/rescore discrepancy means the intended old-policy distribution is not being reproduced. Common causes include shifted token addresses, padding, enabled dropout, different temperature or truncated sampling support. Preserve the actual inputs and discrepancy before changing any settings.'
          }
        </Prose>

        <MetricDenominators />

        <Prose>
          {
            'Correctness is counted over graded responses. Acceptance is counted over candidate prompt groups. A selected-token clip fraction counts active token positions; a response-level fraction answers a different question. Moreover, a ratio outside a numeric interval does not always mean the signed surrogate uses its flat branch. State whether a reported fraction means outside-range ratios or actual active clipping.'
          }
        </Prose>

        <Prose>
          {
            'Entropy describes a distribution over vocabulary choices. A low clipping fraction says nothing by itself about reward quality or diversity. Reward hacking means exploiting the reward contract while missing the intended task; a parser defect and a genuine distribution shift require different repairs. Adding KL, entropy regularization or a different verifier is a deliberate new variant, not an invisible fix to the reported recipe.'
          }
        </Prose>

        <span id="6-visual-walkthrough" aria-hidden="true" />
        <H2>{'18. Make an implementation decision'}</H2>

        <Prose>
          {
            'Bring the pieces together on a new finite group. This is a calculation you can reproduce, not another empirical language-model result.'
          }
        </Prose>

        <FullTrace />

        <Prose>
          {
            'Take two responses with rewards −1 and +1 and lengths 2 and 3. Assume no length penalty in this finite fixture. The group is mixed, its mean is 0 and its sample standard deviation is '
          }
          <InlineMath>{'\\sqrt2'}</InlineMath>
          {'. Write '}
          <InlineMath>{'a=1/(\\sqrt2+10^{-6})'}</InlineMath>
          {'; advantages are '}
          <InlineMath>{'[-a,+a]'}</InlineMath>
          {'. Old scores are frozen. The current-to-old ratios are '}
          <InlineMath>{'[.9,1.1]'}</InlineMath>
          {' for the negative response and '}
          <InlineMath>{'[1,1.3,1.1]'}</InlineMath>
          {' for the positive response.'}
        </Prose>

        <Prose>
          {'At clip bounds .8 and 1.28, the negative-response loss terms are '}
          <InlineMath>{'.9a,1.1a'}</InlineMath>
          {'. The positive-response terms are '}
          <InlineMath>{'-a,-1.28a,-1.1a'}</InlineMath>
          {
            ': its ratio 1.3 is on the flat branch. Summing and dividing by the five selected tokens gives'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'L=\\frac{(.9+1.1-1-1.28-1.1)a}{5}=-\\frac{1.38a}{5}.'}</MathBlock>
        </div>

        <Prose>
          {'Derivatives with respect to current selected-action log probabilities are '}
          <InlineMath>{'[.9a/5,1.1a/5]'}</InlineMath>
          {' and '}
          <InlineMath>{'[-a/5,0,-1.1a/5]'}</InlineMath>
          {'. For a prefix distribution '}
          <InlineMath>{'p=(.2,.5,.3)'}</InlineMath>
          {
            ' whose selected action is the first coordinate and whose scalar log-probability derivative is '
          }
          <InlineMath>{'-a/5'}</InlineMath>
          {', the logit gradient is '}
          <InlineMath>{'(-a/5)(.8,-.5,-.3)'}</InlineMath>
          {
            ". Gradient descent increases that selected logit's relative preference. The flat token contributes zero through this term, but shared network parameters can still move because of other tokens."
          }
        </Prose>

        <ComputeBudget />

        <Prose>
          {
            'A run specification needs both learning and failure rules. If a slot permits B candidate batches, Q prompts per batch, G responses per prompt and cap M, then its generated completion-token bound is '
          }
          <InlineMath>{'BQGM'}</InlineMath>
          {
            '. With 3 batches, 2 prompts, 4 responses and cap 8, that is 192 tokens per slot, even if none qualifies. This bounds completion generation, not prompt-prefill operations, model FLOPs, wall time or expected accuracy. A quota larger than '
          }
          <InlineMath>{'BQ'}</InlineMath>
          {' cannot be filled.'}
        </Prose>

        <Prose>
          {
            'For an application, start with a verifier whose accepted property matches the desired outcome. Choose the collector budget before seeing results. Record the exact dataset/split, initial checkpoint, parser, score normalization, masks, optimizer and evaluation protocol. Decide how exhausted slots are handled and which coherent state survives a failure. Then compare methods under a workload that answers your question: equal generated-token budgets and equal accepted updates are different experimental designs.'
          }
        </Prose>
        <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
          <span id="11-self-check-exercises" aria-hidden="true" />
          <H2>{'Independent practice'}</H2>
          <Prose>
            {
              'These questions change the inputs or assumptions from the main examples. Use the hints when useful, then compare your reasoning with the worked solutions.'
            }
          </Prose>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P01. What did the checker establish?'}</H3>

            <Prose>
              {
                'A four-token response passes a final-answer check. Does that establish that each token expressed a correct reasoning step?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {' Separate what the checker reads from where the training coefficient is applied.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  " No. The checker establishes only that the extracted final answer meets its contract. A response can contain an incorrect intermediate statement and still end with the accepted number. Broadcasting a response's training coefficient over its tokens does not turn the terminal checker into a process reward model."
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P02. Which ratio, which derivative?'}</H3>

            <Prose>
              {
                'Compute the ratio for old probability .12 and current probability .09. An implementation then adds '
              }
              <code>{'old_logp - reference_logp'}</code>
              {
                ' to the loss, with both tensors detached. Does that term regularize the current parameters?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Identify which operand depends on the current parameters.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' The ratio is '}
                <InlineMath>{'.09/.12=.75'}</InlineMath>
                {
                  ': the selected action is 25% less likely. The additional detached difference has derivative zero with respect to the current parameters. It may be a reported statistic or part of a fixed reward construction, but by itself it cannot act as a differentiable current-policy regularizer.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P03. Change one reward'}</H3>

            <Prose>
              {'For '}
              <InlineMath>{'(-1,+1,+1,+1)'}</InlineMath>
              {', compute the mean, sample SD and advantages with '}
              <InlineMath>{'\\varepsilon=10^{-6}'}</InlineMath>
              {'. What must also change for exact invariance when all rewards are multiplied by 2?'}
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {' The squared centered values are '}
                <InlineMath>{'2.25,.25,.25,.25'}</InlineMath>
                {'.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' The mean is .5, sample variance is '}
                <InlineMath>{'3/3=1'}</InlineMath>
                {', and the advantages are '}
                <InlineMath>{'(-1.5,.5,.5,.5)/(1+10^{-6})'}</InlineMath>
                {
                  '. Multiplying rewards by 2 requires multiplying epsilon by 2 for exact equality. Keeping epsilon fixed gives a very close but different vector.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P04. Compare both signs'}</H3>

            <Prose>
              {'At '}
              <InlineMath>{'r=1.24'}</InlineMath>
              {', compare symmetric '}
              <InlineMath>{'.2'}</InlineMath>
              {' and asymmetric '}
              <InlineMath>{'.2/.28'}</InlineMath>
              {' clipping for '}
              <InlineMath>{'A=+2'}</InlineMath>
              {' and '}
              <InlineMath>{'A=-2'}</InlineMath>
              {'. Can you conclude that no future ratio will exceed 1.28?'}
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Multiply by the advantage before selecting the smaller surrogate.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  " Positive advantages give 2.4 versus 2.48; negative advantages give −2.48 in both cases. No hard ratio bound follows. The objective changes the selected term's derivative and does not constrain every possible parameter update."
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P05. Change which outcome becomes more likely'}</H3>

            <Prose>
              {'Compare the entropy of '}
              <InlineMath>{'(.2,.8)'}</InlineMath>
              {' with '}
              <InlineMath>{'(.3,.7)'}</InlineMath>
              {'. Then compute the dual-clipped loss for '}
              <InlineMath>{'A=-.5,r=8,c=6'}</InlineMath>
              {'. Explain why this entropy change differs from section 5.'}
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {' Entropy sums two '}
                <InlineMath>{'-p\\log p'}</InlineMath>
                {' terms; the additional negative-advantage loss cap is '}
                <InlineMath>{'-cA'}</InlineMath>
                {'.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  ' Entropy increases from approximately .5004 to .6109 nats because the initially rarer outcome becomes more likely, moving toward a balanced distribution. The ordinary negative-advantage loss is 4; the additional cap gives 3. The opposite entropy directions here and in section 5 show why a ratio incentive alone supplies no entropy guarantee.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P06. Change both length and sign'}</H3>

            <Prose>
              {
                'Two responses have lengths 3 and 9, with mean token-loss contributions 2 and −1. Compute the response-equal and pooled-token means.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{" Recover each row's numerator before combining rows."}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' Response-equal gives '}
                <InlineMath>{'(2-1)/2=.5'}</InlineMath>
                {'. Pooled-token gives '}
                <InlineMath>{'(3\\cdot2+9\\cdot(-1))/12=-.25'}</InlineMath>
                {
                  ". Even the sign can differ. Duplicating a selected token changes the pooled denominator and that response's total influence; it is not a cosmetic padding operation."
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P07. Fill a finite quota'}</H3>

            <Prose>
              {'The target is three mixed groups. Three successive candidate batches are '}
              <code>{'[all-pass, mixed]'}</code>
              {', '}
              <code>{'[all-fail, mixed]'}</code>
              {', and '}
              <code>{'[mixed, mixed]'}</code>
              {
                '. Which groups are retained if arrival order breaks ties? Which generated work is discarded?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Keep whole groups and stop filling once three slots are occupied.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  ' Retain the second group of batch 1, the second of batch 2 and the first of batch 3. The final group is eligible but falls beyond the quota. It was still generated and must count in the work ledger, alongside the two homogeneous groups. If the budget ended after batch 2, the target would be unfilled rather than magically complete.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P08. What does an accepted update cost?'}</H3>

            <Prose>
              {'With '}
              <InlineMath>{'G=3,p=.25'}</InlineMath>
              {
                ', calculate mixed probability and the unlimited-IID expected candidate count for four accepted groups. Why is this insufficient to predict wall time for a language model?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Prompt lengths and response lengths are absent from the formula.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' Mixed probability is '}
                <InlineMath>{'1-.25^3-.75^3=.5625'}</InlineMath>
                {', so expected candidate count is '}
                <InlineMath>{'4/.5625=64/9'}</InlineMath>
                {
                  ', approximately 7.111. The formula assumes identical independent trials and says nothing about token lengths, batching, model cost or a finite cap. Equal accepted-update counts can correspond to different generation and optimization work.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P09. Zero is not removal'}</H3>

            <Prose>
              {
                'Compute the penalty at length 90 with maximum 120 and buffer 40. Then explain why reward zero in the group '
              }
              <InlineMath>{'(0,2,2,2)'}</InlineMath>
              {" does not remove that response's policy-gradient contribution."}
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {' First locate the beginning of the soft buffer, then subtract the group mean.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' The buffer begins at 80; the penalty is '}
                <InlineMath>{'(80-90)/40=-.25'}</InlineMath>
                {
                  '. The zero reward has centered value −1.5, so its standardized advantage is negative. A loss mask of zero removes its token terms; changing reward to zero does not perform that masking operation.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P10. Make accumulation invariant'}</H3>

            <Prose>
              {
                'Two microbatches have selected-token counts 3 and 5 and loss sums 6 and 20. Compute the intended global mean and the mean of microbatch means. Give a correct gradient-accumulation construction.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' The count 8 belongs to the whole optimization batch.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' Global mean is '}
                <InlineMath>{'(6+20)/(3+5)=3.25'}</InlineMath>
                {
                  '; averaging the local means 2 and 4 gives 3. Backpropagate the first numerator divided by 8 and the second numerator divided by 8, summing their gradients before one optimizer step. This preserves the global denominator without averaging those two losses again.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P11. Repair the join'}</H3>

            <Prose>
              {
                'Prompt rows are [A,B,C,D]. Selected response indices are [3,0], but the program uses prompt rows [A,B]. Explain the fault and give an identity check that would detect it before a model forward pass.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' A matching batch size is insufficient.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  " The correct prompt order is [D,A]. Gather each complete record using the same UID selection, including masks, rewards and old scores. Assert that every selected response's stored prompt ID and token prefix equal the prompt fields used to score it. Test a non-prefix selection such as [3,0]; testing only [0,1] would conceal this bug."
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P12. Interpret a zero group gradient'}</H3>

            <Prose>
              {
                'A group has rewards [1,1,1,1]. There is no KL or auxiliary objective. What are its advantages, and what can you conclude about training?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  ' Separate success on the sampled answers from information in their relative comparison.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  " All centered rewards and all advantages are zero. Its policy-loss gradient is zero even though all four sampled answers passed. That is neither proof of generalization nor an implementation failure. Dynamic selection skips this group because it offers no within-prompt correctness contrast. If length shaping makes rewards differ, coefficients could differ, but this lesson's collector still filters on correctness before shaping."
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P13. Locate the missing collector'}</H3>

            <Prose>
              {
                'You configure the DAPO loss and write a correctness reward. A colleague proposes filtering mixed groups in the input data collator. Explain why that cannot implement the required dynamic sampling.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Follow when correctness first becomes available.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  ' The collator runs before generation and has no sampled answers. Mixed correctness can be decided only after a complete group is generated and graded. A bounded collector must then retain whole eligible groups, generate more candidates if needed, and return filled or exhausted status. The loss option and reward callback alone do not implement those control-flow steps.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P14. Explain an apparently contradictory result'}</H3>

            <Prose>
              {
                'A run lowers target NLL but retains exactly the same predicted labels. Does that make either metric wrong? If the combined arm differs from baseline, can you attribute that difference to Clip-Higher?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Argmax discards most of a probability distribution.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  ' Neither metric need be wrong. Probabilities can change without crossing the argmax boundary. Inspect complete per-record probabilities and labels. The combined comparison changes several components simultaneously, so it cannot isolate Clip-Higher. A controlled component comparison would need to specify what remains fixed, the generation budget and repeated-run design before observing outcomes.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P15. Construct a reward collision'}</H3>

            <Prose>
              {'Compare the coefficient triples (7,3,2) and (7,2,3) under the map '}
              <InlineMath>{'(a,b,c)\\mapsto a+b+c'}</InlineMath>
              {'. What information does a terminal reward for 12 lose?'}
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Evaluate the map before comparing the corresponding radicals.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' Both triples map to 12, but '}
                <InlineMath>{'7-3\\sqrt2\\ne7-2\\sqrt3'}</InlineMath>
                {
                  '. The mapped answer cannot distinguish the two real values, still less certify the reasoning that produced either. Preserve the original problem and a canonical representation or an appropriate richer verifier when that distinction is part of the task.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P16. Read a cumulative table correctly'}</H3>

            <Prose>
              {
                'Four binary components could be enabled or disabled. How many configurations does a full factorial design contain, and why does a cumulative path not identify all component interactions?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Enumerate choices, not rows in the published table.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' There are '}
                <InlineMath>{'2^4=16'}</InlineMath>
                {
                  ' configurations. A cumulative path visits only some combinations and measures changes conditional on the components already active. It cannot recover every main effect and interaction. Comparable budgets, initialization, evaluation and a prespecified repeated-run design are also necessary; simply running more configurations does not remove those confounds.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P17. Compare equal accepted-step reward curves'}</H3>

            <Prose>
              {
                'Run A generates 20 prompt groups and keeps 10. Run B generates 50 and keeps 10. Their reward curves over accepted updates look identical. What can you conclude about generation efficiency?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>{' Equal accepted work does not imply equal candidate work.'}</Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  ' Acceptance rates are .5 and .2. Run B generates more candidate groups for the same retained count, but exact compute also depends on token lengths, batching and hardware. Record generated tokens, actual masks and elapsed workload before claiming a speed ratio. Equal reward curves alone conceal this difference.'
                }
              </Prose>
            </details>
          </section>
          <section className="dapo-practice lesson-exercise" data-lesson-exercise>
            <H3>{'P18. Write and trace a bounded run'}</H3>

            <Prose>
              {'Use rewards −1 and +1, lengths 3 and 2, and ratio rows '}
              <InlineMath>{'[.7,1,1.1]'}</InlineMath>
              {' and '}
              <InlineMath>{'[1.1,1.4]'}</InlineMath>
              {'. Keep sample-SD epsilon '}
              <InlineMath>{'10^{-6}'}</InlineMath>
              {
                ', ratio bounds .8/1.28, no shaping and all five positions selected. Compute the loss and its selected-log-probability derivatives. Then describe a reproducible small application using the supplied Poem Sentiment data and initial checkpoint, including finite failure handling.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {' Let '}
                <InlineMath>{'a=1/(\\sqrt2+10^{-6})'}</InlineMath>
                {
                  '. Check each sign before deciding which clipping branch is flat. Keep this calculation separate from the model run.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {' Negative token losses are '}
                <InlineMath>{'.8a,a,1.1a'}</InlineMath>
                {'; positive token losses are '}
                <InlineMath>{'-1.1a,-1.28a'}</InlineMath>
                {'. Their pooled loss is '}
                <InlineMath>{'.52/[5(\\sqrt2+10^{-6})]'}</InlineMath>
                {'. The derivative rows are '}
                <InlineMath>{'[0,a/5,1.1a/5]'}</InlineMath>
                {' and '}
                <InlineMath>{'[-1.1a/5,0]'}</InlineMath>
                {
                  '. Both the negative ratio .7 and the positive ratio 1.4 lie on their respective flat branches. For the application, use Poem Sentiment revision '
                }
                <code>{'612e9a1f86799126c68f0c5d9c3f1fc28f88068f'}</code>
                {
                  ', the first 16 eligible train and 32 test IDs in the supplied selection, and the exact SFT model hash from section 12. Prespecify seeds 73/89/101, group 4, target 2, at most 3 candidate batches, cap 8 and two updates per filled slot. Retain exhausted slots with no update, raw responses and coherent state. Compare all prescribed terminal observations with the same initial checkpoint; do not select a seed afterward. The short-label task tests collector/objective mechanics, not long reasoning.'
                }
              </Prose>
            </details>
          </section>
          <Program file="practice_answers.py" />
        </section>
        <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
          <H2>{'What to carry forward'}</H2>

          <Prose>
            {
              "DAPO changes the learning system around a group-relative objective. Wider positive clipping changes an active branch; it does not guarantee entropy. Dynamic sampling changes both useful comparisons and the selected prompt distribution. Token normalization changes each response's influence. Length shaping and hard masking act at different stages. The verifier determines what the reward actually establishes."
            }
          </Prose>

          <Prose>
            {'The next lesson, '}
            <a
              href={
                '/learn/path/full-curriculum/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation?module=large-language-models'
              }
            >
              {'Knowledge Distillation for LLMs'}
            </a>
            {
              ', asks how behavior learned by a stronger or more expensive model can be transferred to another model. Keep the verifier and evaluation distinctions: imitating a successful output does not automatically preserve the process that made it successful.'
            }
          </Prose>
        </section>

        <section
          className="lesson-ending lesson-ending--references"
          data-lesson-ending="references"
        >
          <span id="10-primary-sources" aria-hidden="true" />
          <H2>{'Sources and further study'}</H2>

          <ul>
            <li>
              {''}
              <a href={'https://arxiv.org/abs/2503.14476'}>{'DAPO paper'}</a>
              {
                ': read section 3 for the four mechanisms, Table 1 for the cumulative comparison and the appendix for data transformation. Compare its mathematical statement with the executable recipes.'
              }
            </li>
            <li>
              {''}
              <a
                href={
                  'https://github.com/volcengine/verl/tree/4f80e465c2ec79ab9c3c30ec74b9745de61d0490/recipe/dapo'
                }
              >
                {'Original DAPO reproduction'}
              </a>
              {
                ': inspect the collector, reward manager, actor normalization and run configuration together. A flag name alone does not specify the executed objective.'
              }
            </li>
            <li>
              {''}
              <a
                href={
                  'https://github.com/verl-project/verl-recipe/tree/242c73fcadf331e7214c4b48f67423f45239cea8/dapo'
                }
              >
                {'Later retained DAPO recipe'}
              </a>
              {
                ': compare the pinned snapshot rather than assuming the live branch matches an older paper.'
              }
            </li>
            <li>
              {''}
              <a
                href={'https://github.com/huggingface/trl/blob/v1.14.2/docs/source/paper_index.md'}
              >
                {'TRL1.14.2 paper configurations'}
              </a>
              {
                ': the ordinary library route and its explicit truncation-mask example. Follow the matching trainer source for normalization details.'
              }
            </li>
            <li>
              {''}
              <a href={'https://arxiv.org/abs/2503.20783'}>
                {'Understanding R1-Zero-Like Training'}
              </a>
              {
                ': a complementary analysis of group scaling and length-related normalization choices, including Dr.GRPO. These choices are alternatives with different weighting, not interchangeable names.'
              }
            </li>
            <li>
              {''}
              <a href={'https://arxiv.org/abs/1707.06347'}>{'PPO paper'}</a>
              {' and '}
              <a href={'https://spinningup.openai.com/en/latest/algorithms/ppo.html'}>
                {'Spinning Up: PPO'}
              </a>
              {
                ': derive the signed clipped surrogate and connect its branches to a policy-gradient update before adapting it to long token sequences.'
              }
            </li>
            <li>
              {''}
              <a href={'https://huggingface.co/datasets/BytedTsinghua-SIA/DAPO-Math-17k'}>
                {'Official DAPO-Math-17k release'}
              </a>
              {
                ': inspect original records, release metadata and answer formatting. A small inspected sample cannot establish a corpus-wide error rate.'
              }
            </li>
          </ul>
        </section>

        <section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources">
          <H2>{'Complete program index'}</H2>

          <Prose>
            {
              'The math, collector, checks, training, native route, report and solved-practice programs appear where their concepts are taught. Four unchanged prerequisite helpers complete the executable bundle: model loading/full-support generation, causal token gathering, data formatting and evaluation. Their full sources follow so the local program can be inspected and run without guessing an unexplained dependency. Their original mathematical walkthrough remains in the linked SFT and GRPO lessons.'
            }
          </Prose>

          <Program file="online_preferences.py" />

          <Program file="group_losses.py" />

          <Program file="sft_data.py" />

          <Program file="sft_evaluate.py" />

          <Prose>
            {
              'The final helper preserves observations and coherent training state when a later comparison fails. Its event log is append-only; its latest checkpoint is replaced atomically and includes the context needed for a deliberately reviewed continuation. It is the unchanged helper from the RLVR lesson. Writing a checkpoint is not an automatic instruction to resume or repeat work.'
            }
          </Prose>

          <Program file="scientific_journal.py" />
        </section>

        <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
          <H2>{'Ready to explain and extend'}</H2>

          <Prose>
            {
              'You should be able to trace a stored response from its generating policy to its reward, group coefficient, selected token terms and parameter gradient; explain why changing a sign, length or mask changes that trace; and implement a finite collector whose selected rows keep the correct identities.'
            }
          </Prose>

          <Prose>
            {
              'For an extension, choose one component question and specify the comparison before running it. Keep all prescribed outcomes, including exhausted slots and unchanged predictions. Explain which observations concern a mathematical fixture, a small language-model run or a published large-scale result. Those boundaries make the implementation useful when its first experiment fails.'
            }
          </Prose>
        </section>
      </div>
    </DapoEvidenceProvider>
  );
}
export default {
  title: 'DAPO: Decoupled Clip and Dynamic sAmpling Policy Optimization',
  readTime: '~90 min read + programs and practice',
  content: DapoLesson,
};
