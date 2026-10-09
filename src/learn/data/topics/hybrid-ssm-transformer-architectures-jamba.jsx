// Generated from the complete Hybrid Memory manuscript by its explicit guarded renderer.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { HybridCollisionDrawing, HybridDepthDrawing, HybridResidualDrawing, HybridOriginalCycleDrawing, HybridAffineScanDrawing, HybridDiagonalOrderDrawing, HybridAttentionAnatomyDrawing, HybridGroupedHeadsDrawing, HybridCausalPairsDrawing, HybridCacheAnatomyDrawing, HybridSwiGluDrawing, HybridExpertBankDrawing, HybridPrecisionDrawing, HybridRequestForkDrawing, HybridAlternativeRoutesDrawing, HybridSharedWeightsDrawing, HybridApplicationInterventionsDrawing } from '../../components/lesson-labs/HybridMemoryFlowFigures.jsx';
import { HybridMemoryFlowProvider, HybridRecordEditFlow, HybridSummaryFlow, HybridAddressFlow, HybridRecordOrderFlow, HybridMemoryCaseFlow, HybridTinyStateFlow, HybridDiscretizationFlow, HybridBudgetFlow, HybridWindowFlow, HybridBudgetCaseFlow, HybridRouterScoreFlow, HybridRouterValueFlow, HybridRouterConventionFlow } from '../../components/lesson-labs/HybridMemoryFlowLabs.jsx';
import { HybridMemoryStudyProvider, HybridStudySelectionFlow, HybridStrokeEditFlow, HybridEmbeddingFlow, HybridStudyArchitectureDrawing, HybridLayerTraceFlow, HybridStateCellFlow, HybridAttentionCellFlow, HybridClassifierFlow, HybridTrainingHistoriesDrawing, HybridContinuationFlow, HybridPrefixCacheFlow, HybridStudyCaseFlow, HybridFlowProgram, HybridFlowDownloads } from '../../components/lesson-labs/HybridMemoryFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/hybrid-memory-flow.css';
export default {
  title: 'Hybrid SSM–Transformer Architectures: Jamba and Complementary Memory',
  readTime: '~90 min read + investigations and practice', hasIntegratedGuide: true,
  content: () => <HybridMemoryFlowProvider><HybridMemoryStudyProvider><div className="neural-lesson neural-lesson-neutral lesson-flow hybrid-memory-flow">
<Prose opening="summary">{""}<strong>{"What you will understand."}</strong>{" Follow information through a model that keeps a compact evolving state and separately addressable records. Build its selective update and attention read, calculate its actual request storage, distinguish expert selection from memory selection, and inspect a complete trained example through its input, layers, classifier and resumed requests."}</Prose>

<Prose opening="prerequisites">{""}<strong>{"Before starting."}</strong>{" Review the "}<a href={"/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals"}>{"state-space model's retain/write/read update"}</a>{", "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"causal attention and projected query/key/value vectors"}</a>{", and "}<a href={"/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals"}>{"both residual additions"}</a>{". We rebuild the small objects here before composing them. The "}<a href={"/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals"}>{"MoE lesson"}</a>{" owns full trainable expert dispatch."}</Prose>

<Prose opening="exploration">{""}<strong>{"Read and investigate."}</strong>{" Work through the records, state cells and stored keys before counting their bytes. Each small investigation changes a quantity just explained. Shared records, budget dimensions and stroke inputs remain the same across their later views; reset and pin controls preserve complete cases. Deeper derivations and complete programs stay visible."}</Prose>

<Prose>{"The preceding "}<a href={"/learn/path/full-curriculum/neural-ode-continuous-depth-models?module=deep-learning-fundamentals"}>{"Neural ODE lesson"}</a>{" made depth a continuous trajectory. Here depth is a discrete sequence of different operations. A document assistant may need both the evolving argument and the exact amount beside an earlier invoice identifier. Those needs motivate two information routes inside one network. A hybrid does not mean a vote between separately trained answers: it can mean a single learned representation passing through different kinds of memory operation."}</Prose>

<H2>{"1. Which information should survive the next input?"}</H2>

<Prose>{"Imagine three labelled measurements arriving. What recent level do they describe, and which measurement belongs to A?"}</Prose>

<Prose>{"The same supplied records can answer two different questions through two different reads."}</Prose>

<HybridRecordEditFlow />

<Prose>{"The cyan fields are supplied information. A key is the label used to address a record; its value is the measurement. Arrival order is separate from the label. A recent-level question can compress the measurements into a summary. An A-specific question needs some representation that distinguishes A's value from B's value. Neither question has yet required a neural network."}</Prose>

<H3>{"Keep two running numbers"}</H3>

<Prose>{"How could a summary remember recent measurements without retaining the entire list?"}</Prose>

<Prose>{"Maintain a weighted numerator and its matching normalizer; update both when each record arrives."}</Prose>

<HybridSummaryFlow />

<Prose>{"Follow the two vertical routes. Their old registers are violet computed state. The supplied multiplier λ scales both registers. The left addition inserts the new measurement; the right addition inserts one unit of normalizing mass. Dividing their new values gives the current weighted average. Keeping only the numerator would let the scale change when the number or weights of records change."}</Prose>

<Prose>{"With the original records and λ=1/2, the first update is (2,1), the second is (8,1.5), and the third is (8,1.75). The final ratio is 32/7, approximately 4.571429. The newer record contributes 4, the middle record contributes 3.5, and the oldest contributes 0.5 to the numerator. Their normalizing weights are 1,0.5,0.25 respectively."}</Prose>

<div className="neural-equation"><MathBlock>{"s_t=\\lambda s_{t-1}+v_t,\\quad n_t=\\lambda n_{t-1}+1,\\quad r_t=s_t/n_t."}</MathBlock></div>

<Prose>{"Here t counts arrivals and v is the arriving value. Starting with both registers zero gives a positive normalizer after the first input even when λ=0. At λ=0 the read is the newest value; at λ=1 it is the ordinary average. Between them it is a recency-weighted average. Relabelling a key cannot change this particular rule because no key enters its update."}</Prose>

<Prose>{"Unrolling the update makes its memory explicit:"}</Prose>

<div className="neural-equation"><MathBlock>{"r_T=\\frac{\\sum_{j=1}^{T}\\lambda^{T-j}v_j}{\\sum_{j=1}^{T}\\lambda^{T-j}}."}</MathBlock></div>

<Prose>{"The persistent state is still just two numbers. This rule is linear in values before normalization; a learned selective model will make its coefficients depend on the input. We will draw that change in §3."}</Prose>

<H3>{"Read by an address instead"}</H3>

<Prose>{"What changes when the question names A instead of asking for a recent level?"}</Prose>

<Prose>{"Score the keys against the query, then use normalized scores to combine the separately retained values."}</Prose>

<HybridAddressFlow />

<Prose>{"Follow the first connected drawing downward: each score passes through exp to become a positive mass. All mass arrows meet at Σ, giving one shared sum. That same sum reaches every division, while each division also receives its own mass. The repeated mass circles carry the original computed values; they do not apply exp again. Then read across the table: key/value → compatibility score → positive exponential mass → normalized weight → signed value contribution. A matching A receives score log 9, the natural logarithm of 9; the other keys receive score 0. Exponentiation turns that score back into 9, while exp(0)=1. Their masses are 9,1,1, whose sum is 11. Dividing each mass by 11 makes the weights sum to one. Summing the final column yields 29/11, approximately 2.636364."}</Prose>

<div className="neural-equation"><MathBlock>{"\\alpha_j=\\frac{e^{s_j}}{\\sum_r e^{s_r}},\\qquad o=\\sum_j\\alpha_jv_j."}</MathBlock></div>

<Prose>{"The calculation is exact softmax arithmetic for these inputs, but the answer is a mixture rather than A's original value 2. Larger positive score gaps concentrate more probability on matching keys; they do not create a separate absence detector. Repeated matching keys share the mass. No matching key gives a uniform mixture here. A negative matching score can even make a matching record less influential. These distinctions matter when using attention for retrieval."}</Prose>

<Prose>{"The controls above edit one shared record list. Change B's label to A: only the key-sensitive read changes. Change a value: both reads can change. Changing the query or score gap keeps the summary fixed. With all values equal, either weighted read returns that common value even when the weights change."}</Prose>

<H3>{"A collision shows precisely what was lost"}</H3>

<Prose>{"Could later computation recover every old value from those two summary registers?"}</Prose>

<Prose>{"Two different streams can leave identical registers while preserving different separately addressed values."}</Prose>

<HybridCollisionDrawing />

<Prose>{"The original values 2,7,4 and changed values 6,5,4 both leave s=8 and n=1.75 under this rule. Any later function receiving only those two numbers must return the same answer for both. Their query-A reads are 29/11 and 63/11 because their retained value lists differ. This counterexample concerns this two-register summary. It does not prove that every recurrent network has the same copying limitation: a larger state, a selective write, training or a different representation can preserve different information."}</Prose>

<Prose>{"Does changing arrival order change both reads equally?"}</Prose>

<Prose>{"Move an unchanged record and follow the already taught routes."}</Prose>

<HybridRecordOrderFlow />

<Prose>{"The recency weights depend on arrival order. The key-sensitive sum here does not: the same key/value/score terms are merely permuted. Later attention over contextualized, order-dependent representations need not have that invariance."}</Prose>

<Prose>{"What storage grows when more records arrive?"}</Prose>

<Prose>{"The summary keeps its two registers while an addressable bank keeps each added record."}</Prose>

<HybridMemoryCaseFlow />

<Prose>{"Pin a complete case before changing it: the pin includes fields, order, query, λ and score gap. Newly added records begin as A:0 and can be edited above. A hybrid can carry both kinds of information into a later vector; it does not have to average the two displayed answers together."}</Prose>

<Prose>{"The following "}<code>{"memory_read"}</code>{" function calculates the two-register recurrence and addressed read just drawn. Subtracting the largest score before exponentiation preserves the normalized weights while avoiding avoidable exponential overflow. Its returned states and weights expose the intermediate calculations instead of hiding them behind a hybrid-model library."}</Prose>

<CodeBlock language={"python"}>{"import math\nimport numpy as np\n\ndef memory_read(values,keys,query,decay=.5,beta=math.log(9)):\n    values=np.asarray(values,dtype=float);keys=np.asarray(keys)\n    scores=np.array([beta if key==query else 0 for key in keys])\n    weights=np.exp(scores-scores.max());weights/=weights.sum()\n    numerator=normalizer=0.;states=[]\n    for value in values:\n        numerator=decay*numerator+value;normalizer=decay*normalizer+1\n        states.append([numerator,normalizer,numerator/normalizer])\n    return {'states':states,'weights':weights.tolist(),'attention':float(weights@values),\n            'summary':states[-1][-1]}"}</CodeBlock>

<Prose>{""}<code>{"values"}</code>{" and "}<code>{"keys"}</code>{" describe the same ordered records. The loop carries only the numerator and normalizer; the separately constructed "}<code>{"weights"}</code>{" retain one term per key. "}<code>{"weights @ values"}</code>{" is the sum of those weighted measurements. The full program appears after the storage and expert calculations in §7, once those operations have also been explained."}</Prose>

<H2>{"2. Where do the different operations sit in one network?"}</H2>

<Prose>{"We now have a compact update and an addressable read. How can both participate in one learned computation?"}</Prose>

<Prose>{"Separate input positions across the drawing from depth layers down the drawing."}</Prose>

<HybridDepthDrawing />

<Prose>{"Each column follows a particular arriving position through the stack. Each row is a different learned layer, with its own memory. Horizontal arrows carry that row's state between positions; vertical arrows carry the current position's computed representation into the next layer. An attention layer's stored keys and values are projections of its own inputs, which already include lower layers' computations. Thirty-two depth layers do not mean thirty-two input tokens."}</Prose>

<Prose>{"A "}<strong>{"sequence mixer"}</strong>{" lets one position depend on other permitted positions. Both the recurrent update and causal attention are mixers. A feed-forward network, or FFN, transforms one position's current vector; it uses context already mixed into that vector but does not independently visit other positions."}</Prose>

<H3>{"Preserve both residual routes"}</H3>

<Prose>{"How does a mixer change a representation without discarding its direct input path?"}</Prose>

<Prose>{"The complete layer adds the mixer output, then separately adds the FFN output to that new intermediate."}</Prose>

<HybridResidualDrawing />

<Prose>{"The first bypass carries the original input x into the first addition. Norm rescales the complete vector before the mixer. Its output 3 is a constructed scalar cutaway, not the result of applying every real matrix to scalar 2. The first intermediate is u=2+3=5. The second bypass starts at u, not at the original x. Adding the constructed FFN output 4 therefore gives 9. Adding 4 to x instead would give 6 and remove the mixer's direct residual contribution."}</Prose>

<div className="neural-equation"><MathBlock>{"u^\\ell=x^\\ell+\\operatorname{Mixer}_\\ell(\\operatorname{RMSNorm}(x^\\ell)),\\qquad\nx^{\\ell+1}=u^\\ell+\\operatorname{FFN}_\\ell(\\operatorname{RMSNorm}(u^\\ell))."}</MathBlock></div>

<Prose>{"The superscript ℓ selects a depth layer. RMSNorm multiplies each coordinate by the inverse root-mean-square magnitude and a learned gain; it does not subtract the mean. With gains g and small positive ε,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{RMSNorm}(x)_i=g_i x_i\\big/\\sqrt{\\tfrac1d\\sum_j x_j^2+\\epsilon}."}</MathBlock></div>

<Prose>{"The later real trace shows every normalized coordinate and both additions. Keeping an original path supports information and gradient flow; it does not guarantee that arbitrary training is stable."}</Prose>

<H3>{"Read the actual original release pattern"}</H3>

<Prose>{"Which layer chooses a state update, which chooses attention, and which chooses experts?"}</Prose>

<Prose>{"Mixer choice and FFN choice are separate columns in the released eight-layer cycle."}</Prose>

<HybridOriginalCycleDrawing />

<Prose>{"The zero-based depth index 4 uses attention. The seven other mixer positions use Mamba selective updates. Odd indices use top-2 of 16 FFN experts; even indices use a dense FFN. Repeating four cycles gives 32 layers, attention at 4,12,20,28 and 28 selective layers. Those attention positions have dense FFNs in this release. Every token passes through every depth layer; this cycle is not a rule to attend only to every eighth token."}</Prose>

<Prose>{"The "}<a href={"https://huggingface.co/ai21labs/Jamba-v0.1/blob/main/config.json"}>{"Jamba-v0.1 configuration"}</a>{" and "}<a href={"https://arxiv.org/html/2403.19887v1"}>{"original report"}</a>{" own this pattern. The paper's 1.3B models trained on 250B tokens compared 1:3 and 1:7 ratios with similar reported results in that experiment. That observation motivated the tested cheaper pattern; it is not a theorem that every task should use one attention layer per eight layers. Early attention can already read available input representations, and late attention can still directly influence the head. Placement needs an actual comparison."}</Prose>

<H2>{"3. What exactly does a selective state layer update?"}</H2>

<Prose>{"The two-register summary was key-blind and used one fixed λ. What would a learned mixer need to decide what to retain, write and read for this input?"}</Prose>

<Prose>{"Start with the full input, projection, short history and old state rather than a box labelled “Mamba.”"}</Prose>

<HybridTinyStateFlow view="objects" />

<Prose>{"This is an explicitly new constructed two-channel cutaway, chosen so every coefficient fits on the page. The numerical walk-through uses the default supplied mixer input [2,−1], already downstream of the enclosing layer's normalization. The input controls in all four selective views share that same current vector; editing one updates the displayed projection, coefficients, state and output everywhere. The four rows of the learned input matrix produce two projected channel values and two separate output-gate precursors. All biases are zero. At the default they give projected [2,−1] and gate [1,1]. Gate values modulate the later read; they are not additional persistent state cells."}</Prose>

<Prose>{"In each projection circuit, match input 0 to coefficient 0 and input 1 to coefficient 1. Each × produces one product; both products and the zero bias enter Σ + b. The separate gate circuit follows the same arithmetic with a different learned matrix row. Circles in these connected cutaways round to two decimal places; the adjacent ledgers retain more digits, and every operation uses the unrounded values."}</Prose>

<Prose>{"Each channel's projected input joins its own two previous projected inputs. The first causal window [1,0,2] meets kernel [0.25,0.5,1], producing 2.25. The second window [−1,0,−1] meets [0.5,−0.25,1], producing−1.5. Each channel has its own kernel; there is no cross-channel sum in this depthwise convolution. Applying SiLU, defined as a times sigmoid(a), gives transformed inputs approximately 2.035463704 and−0.273638286. After the step, the history retains the final two projected window entries. Retaining H alone would lose these distinct convolution operands."}</Prose>

<H3>{"Choose the current write, read and elapsed step"}</H3>

<Prose>{"How can these transformed inputs choose how strongly the old state decays and where new information goes?"}</Prose>

<Prose>{"Separate learned projections from the current computed timestep, write and read coefficients."}</Prose>

<HybridTinyStateFlow view="coefficients" />

<Prose>{"Follow the first weighted-sum circuit from the transformed input to the timestep precursor, including the learned bias. Its next arrow passes through softplus. Follow the second weighted sum to the write precursor. In the RMS drawing, square both write coordinates, add them, divide by their count of two, add ε and take a square root. This computes one shared divisor. Both original precursor coordinates—not their squares—are divided by it, then multiplied by their individual learned gains."}</Prose>

<Prose>{"The complete Δ matrix and biases produce two precursors. Softplus converts them to positive steps without requiring them to mean seconds. The write matrix produces two coordinates that are shared across the channels' state-coordinate axis; the read matrix produces two coefficients used after the new state has been assembled. The read vector follows the same projection-and-RMS arithmetic just drawn for the write vector, using the distinct learned read matrix shown below it. Each vector uses the shown unit RMS gains and ε=0.000001. These normalized B and C vectors can have either sign. They are input-dependent computed quantities, not themselves fixed parameter matrices."}</Prose>

<Prose>{"Original Jamba additionally normalizes the low-rank timestep features before the later timestep projection and softplus. This cutaway and the real small study deliberately use a complete small timestep projection instead of that low-rank factorization. Normalizing the residual output instead would not reproduce the official placement. Check "}<a href={"https://github.com/huggingface/transformers/blob/main/src/transformers/models/jamba/modeling_jamba.py"}>{"the official callable source"}</a>{" when implementing a particular checkpoint."}</Prose>

<H3>{"Work one retain–write–read step"}</H3>

<Prose>{"Which old cells survive and how do they become an output vector?"}</Prose>

<Prose>{"Every state cell receives a retained old term and a new write term; the completed state is then read, skipped, gated and projected."}</Prose>

<HybridTinyStateFlow view="state" />

<Prose>{"Start at old H [0,0] in the first connected drawing. The current Δ₀ and learned A [0,0] meet at ×, then exp computes retention. Multiplying that retention by the old cell gives the retained term. The separate three-input product computes the current write from Δ₀, u₀ and B₀. Only the final + joins these two terms into new H [0,0]. The full labelled matrices below extend that same operation to every cell: H has a channel row and a state-coordinate column. The continuous coefficients are negative, represented by A=−exp(a); our rows are [−1,−2]. Exponentiating ΔA yields a cellwise retention factor strictly between zero and one for finite positive Δ. Multiply it by the carried H cell. Add Δ times the current channel input times the corresponding B coefficient. The old row and the new outer write remain separate until their addition."}</Prose>

<Prose>{"In the next circuit, each new state cell meets its corresponding C coefficient. Their products enter one sum; the direct skip D₀ × u₀ enters that same sum as a separate current-input contribution. It is not an additional learned bias. The following gate drawing takes this completed read-plus-skip value and multiplies it by SiLU of the separately projected gate. The two gated channels enter the displayed learned output matrix. No gate arrow feeds back into stored H."}</Prose>

<Prose>{"For a channel i and state coordinate n, the computed transition and read are"}</Prose>

<div className="neural-equation"><MathBlock>{"H_{t,i,n}=e^{-\\Delta_{t,i}e^{a_{i,n}}}H_{t-1,i,n}+\\Delta_{t,i}B_{t,n}u_{t,i},\\qquad\ny_{t,i}=\\sum_n C_{t,n}H_{t,i,n}+D_i u_{t,i}."}</MathBlock></div>

<Prose>{"The read contracts across state coordinates, not channels. Its direct D×u path bypasses that stored-state read. The separate projected gate enters through SiLU(gate)×y. The output matrix then mixes channels back into the residual vector. The complete constructed output is approximately [3.312887417,−1.013090770]. All state cells, coefficients, direct-skip terms and output-matrix entries are displayed; these are not learned values from a released foundation model."}</Prose>

<Prose>{"Change a supplied mixer input only after following that path once."}</Prose>

<HybridTinyStateFlow view="output" />

<Prose>{"The live result recomputes the projection, causal convolution, selective coefficients, state and gated output under those same constructed learned weights and old buffers. The upcoming saved-model trace exposes analogous actual 16×4 states and learned matrices instead of replacing them with fabricated heatmaps."}</Prose>

<H3>{"Deeper: a discrete update is a modelling choice"}</H3>

<Prose>{"Does the write ΔBu equal exact integration of every continuous-time state equation?"}</Prose>

<Prose>{"Compare the same old state, decay and constant input under the two different write coefficients."}</Prose>

<HybridDiscretizationFlow />

<Prose>{"For the scalar equation dh/ds=Ah+f with constant f over an interval Δ, the exact zero-order-hold update is"}</Prose>

<div className="neural-equation"><MathBlock>{"h_{\\mathrm{new}}=e^{A\\Delta}h_{\\mathrm{old}}+\\frac{e^{A\\Delta}-1}{A}f."}</MathBlock></div>

<Prose>{"The fraction has limit Δ at A=0. A stable implementation uses "}<code>{"expm1(A*Δ)/A"}</code>{", with that explicit zero-rate branch, rather than subtracting nearly equal numbers carelessly. Mamba's common input discretization uses Δf for its write while retaining the exponential decay. At A=−1, Δ=1, old state 1 and f=2, exact integration gives 2−e^(−1), approximately 1.632121; the common write gives 2+e^(−1), approximately 2.367879. At Δ=0 both leave the old state unchanged. This distinction is developed with its full derivation in the earlier "}<a href={"/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals"}>{"state-space lesson"}</a>{"."}</Prose>

<H3>{"Deeper: why a scan can replace a sequential loop"}</H3>

<Prose>{"How can a state dependency be computed in parallel without pretending the dependency disappeared?"}</Prose>

<Prose>{"Compose the actual affine maps in arrival order before applying them to the starting state."}</Prose>

<HybridAffineScanDrawing />

<Prose>{"A scalar state update is h↦ah+b after the current coefficients are fixed. If a left map runs before a right map, their composition has a=a_right×a_left and b=a_right×b_left+b_right. Our first two maps(0.5,2) and(0.25,−1) combine into(0.125,−0.5); adding the third(0.8,0.2) gives(0.1,−0.2). Applying each in sequence or the combined map to the same initial h gives the same answer in exact arithmetic."}</Prose>

<div className="neural-equation"><MathBlock>{"(a_L,b_L)\\star(a_R,b_R)=(a_Ra_L,\\;a_Rb_L+b_R)."}</MathBlock></div>

<Prose>{"Function composition is associative, so a parallel prefix tree can compute every ordered prefix. It is not commutative: exchanging arrival order usually changes b. Floating-point reduction order can change small rounding errors. Once all input-dependent coefficients have been computed, this is an affine scan over the state; the projections, input-dependent coefficients and nonlinear gates still make the complete input-to-output model nonlinear."}</Prose>

<Prose>{"At fixed expanded-channel and state dimensions the state update costs a fixed amount per input, giving work proportional to sequence length T for that operation. Training needs gradients and intermediate information; a compact inference cache does not promise that training stores only one state. The derivative along the old-state route multiplies retention coefficients, which can attenuate distant credit. Input-dependent Δ/B/C routes and skip/residual paths add further derivatives. Negative A ensures decay of the homogeneous frozen-coefficient step, not unconditional boundedness of arbitrary learned writes or gradients. Optimized scans, recomputation and fused kernels address these engineering costs. The explanatory loop is a computational reference, not an optimized-kernel timing forecast."}</Prose>

<H2>{"4. What does an attention layer keep instead?"}</H2>

<Prose>{"We have unpacked a state that is updated in place. What changes when a layer keeps a separately addressable representation of every permitted position?"}</Prose>

<Prose>{"Draw the query and the stored key/value operands before drawing attention's formula."}</Prose>

<HybridAttentionAnatomyDrawing />

<Prose>{"This new vector cutaway reproduces §1's scores exactly. Each label is a three-coordinate one-hot key. The supplied query has coordinate√3log9 along A and zeros along B/C. Dividing its dot product with each key by√3 produces log 9,0,0. Values remain 2,7,4. The table carries every score, exponential mass, probability and weighted value to the same 29/11 sum."}</Prose>

<Prose>{"In a learned head, q=Wq x, k=Wk x and v=Wv x are projections of the layer's current input vectors, with their defined biases if present. Keys and values from older positions are stored; the newest key and value are appended before the newest query reads them. The read is then projected back to the residual stream. Unlike the compact H, the bank preserves a separate row for each retained position."}</Prose>

<div className="neural-equation"><MathBlock>{"\\alpha_{t,j}=\\frac{\\exp(q_t^\\top k_j/\\sqrt{d_h})}{\\sum_{r\\le t}\\exp(q_t^\\top k_r/\\sqrt{d_h})},\\qquad o_t=\\sum_{j\\le t}\\alpha_{t,j}v_j."}</MathBlock></div>

<Prose>{"The causal convention includes j=t, so a position may read itself; future positions are excluded. Cached K/V avoids recomputing old projections, but the new query still compares with and combines retained rows. Masking, correct offsets and actual head grouping remain part of the function."}</Prose>

<H3>{"Shared stored heads still answer distinct queries"}</H3>

<Prose>{"Does storing fewer K/V heads mean computing fewer queries?"}</Prose>

<Prose>{"Four distinct query heads can read one shared stored K/V head."}</Prose>

<HybridGroupedHeadsDrawing />

<Prose>{"The four violet query circles have separate q values. Follow one query arrow into its own read junction, then into its own output circle. The two other arrows into that junction come from the shared K and V banks. Repeat that path for the other three query rows: no query arrow merges with another query arrow. The single key bank and single value bank provide operands to all four reads; they are not four duplicated banks. Original Jamba has 32 query heads sharing 8 K/V heads, each width 128. Its stored head count is 8; its score calculations still serve 32 queries. The "}<a href={"/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals"}>{"GQA/MQA lesson"}</a>{" explains the grouping and its full implementation."}</Prose>

<H3>{"Where can order enter a no-RoPE hybrid?"}</H3>

<Prose>{"The simple position-free record read in §1 was invariant to record permutation. The state update was not. A later attention layer reading outputs of lower recurrent/causal-convolution layers can therefore receive already order-dependent vectors. Original Jamba does not add RoPE or another explicit positional embedding; the original report compared variants with and without RoPE. Its result does not imply that raw unordered token embeddings already encode order or that every hybrid can safely remove positional mechanisms."}</Prose>

<Prose>{"Our upcoming small comparison explicitly adds the same global position tags to every neural candidate, including the all-attention baseline. It is therefore a controlled teaching experiment, not a replica of the release's no-RoPE architecture."}</Prose>

<H2>{"5. What storage grows with the sequence?"}</H2>

<Prose>{"We can now name what survives the next input. How many bytes does that request really need?"}</Prose>

<Prose>{"Separate persistent H, short projected history and K/V rows before multiplying tensor dimensions."}</Prose>

<HybridCacheAnatomyDrawing />

<Prose>{"H has expanded channels down one axis and state coordinates across the other. Short history has a different slot axis. K and V have growing position rows. Each layer and request owns its own bundle. Model weights are shared across requests, and temporary activations/workspaces have a separate lifetime. A small K/V bank alone does not show that the weights or peak training allocations fit on a device."}</Prose>

<Prose>{"For batch B, attention depth count L_A, retained length T, stored heads H_KV, head width d_h and K/V scalar bytes b_KV,"}</Prose>

<div className="neural-equation"><MathBlock>{"M_{KV}=B L_A T\\,2H_{KV}d_hb_{KV}."}</MathBlock></div>

<Prose>{"The 2 is the K/V pair. With L_M selective layers, expanded channels I, state width N, reserved history slots C and separately stated dtypes,"}</Prose>

<div className="neural-equation"><MathBlock>{"M_H=B L_M I N b_H,\\qquad M_{\\mathrm{history}}=B L_M I C b_{\\mathrm{history}}."}</MathBlock></div>

<Prose>{"GiB divides integer bytes by 2^30; GB divides by 10^9. The displayed counts use exact integer arithmetic before conversion. A reserved width-C implementation can allocate C slots even though only C−1 previous inputs are mathematically necessary. The later native study stores the minimal previous-two buffer for its width 3 kernel."}</Prose>

<Prose>{"Which dimensions are replicated when requests or input positions increase?"}</Prose>

<HybridBudgetFlow view="request" />

<Prose>{"Increasing batch multiplies all request tensors. Increasing length grows K/V only; changing attention-layer count exchanges the two kinds of layer allocation at fixed depth. Setting no attention layers gives zero K/V; all-attention depth gives zero selective state/history. At zero input positions the counted preallocated selective buffers can remain nonzero even while K/V has no rows."}</Prose>

<Prose>{"Which dimensions belong to the selective state rather than attention?"}</Prose>

<HybridBudgetFlow view="state" />

<Prose>{"Width times expansion gives I. Increasing state-coordinate count multiplies H but not the short history's slot count. Width influences both persistent channels and learned projection work, so a storage edit alone is not a quality or timing comparison."}</Prose>

<Prose>{"Which stored-head dimensions remain separate from depth?"}</Prose>

<HybridBudgetFlow view="heads" />

<Prose>{"Head count and coordinates per stored head multiply K/V. If total depth is reduced below its attention count, that count is reduced too and remains visible in the earlier controls; a configuration cannot have more attention layers than layers."}</Prose>

<Prose>{"Which dtype belongs to which object?"}</Prose>

<HybridBudgetFlow view="history" />

<Prose>{"The state and history can have different dtypes. A byte-count choice describes storage scalar size, not whether a particular backend supports that precision or whether it preserves numerical accuracy. Changing reserved convolution slots does not change N."}</Prose>

<H3>{"The original-shape calculation"}</H3>

<Prose>{"Use B=1,32 layers with 4 attention/28 selective, d=4096, expansion 2, I=8192, N=16, C=4,8 K/V heads of width 128, two-byte K/V/history and four-byte H. One attention layer stores 4096 bytes per token; all four together store 16,384 bytes per token. H takes 14 MiB; history takes 1.75 MiB. At 262,144 positions K/V is 4 GiB and total counted request storage is 4.015380859375 GiB. A hypothetical 32-layer all-attention K/V bank with the same stored-head shape is 32 GiB."}</Prose>

<NeuralTable caption={"The original-shape calculation"} headers={[<>{"Context positions"}</>,<>{"Hypothetical all-attention K/V (GiB)"}</>,<>{"Hybrid K/V (GiB)"}</>,<>{"Hybrid H + history (GiB)"}</>,<>{"Hybrid counted total (GiB)"}</>]} rows={[[<>{"1024"}</>,<>{"0.125"}</>,<>{"0.015625"}</>,<>{"0.015380859375"}</>,<>{"0.031005859375"}</>],[<>{"4096"}</>,<>{"0.5"}</>,<>{"0.0625"}</>,<>{"0.015380859375"}</>,<>{"0.077880859375"}</>],[<>{"16384"}</>,<>{"2"}</>,<>{"0.25"}</>,<>{"0.015380859375"}</>,<>{"0.265380859375"}</>],[<>{"65536"}</>,<>{"8"}</>,<>{"1"}</>,<>{"0.015380859375"}</>,<>{"1.015380859375"}</>],[<>{"262144"}</>,<>{"32"}</>,<>{"4"}</>,<>{"0.015380859375"}</>,<>{"4.015380859375"}</>]]} />

<Prose>{"K/V is exactly eight times smaller in this shape comparison. Total counted request storage is not, because the hybrid also carries H and history. This is calculated tensor size, not measured allocator memory, equal-capacity model quality or latency."}</Prose>

<Prose>{"Could a fixed attention window bound the remaining growing bank?"}</Prose>

<HybridWindowFlow />

<Prose>{"Retained length becomes min(T,W). The last actual integer positions are drawn; crossed positions are outside the directly addressable window. Removing their rows changes the attention operator. Distant information might survive through recurrent state or later contextualized vectors, but the storage bound alone does not guarantee recovery of arbitrary old identifiers."}</Prose>

<Prose>{"Keep a complete budget before comparing changed cases."}</Prose>

<HybridBudgetCaseFlow />

<H2>{"6. Why are prompt processing and one-token decoding different jobs?"}</H2>

<Prose>{"The bank's growth does not directly tell us its arithmetic. Which query/key pairs are actually evaluated?"}</Prose>

<Prose>{"The prompt forms a causal triangle; a new decoding token adds one query row."}</Prose>

<HybridCausalPairsDrawing />

<Prose>{"The violet cells show all permitted pairs for a prompt of T=5:1+2+3+4+5=15. Its next query reads those five stored positions and itself, adding 6 white-outlined pairs. The small triangle is an exact counting example, not a latency plot."}</Prose>

<Prose>{"For learned Q/K/V/output matrices, query and output widths d give two d×d projections; key and value widths k=H_KV d_h give two k×d projections. Counting a multiplication and addition as two operations gives projection work 4BTd(d+k). Score dot products and value accumulation each use d coordinates across query heads. The ideal causal pair-product work is"}</Prose>

<div className="neural-equation"><MathBlock>{"4Bd\\frac{T(T+1)}2=2BdT(T+1)."}</MathBlock></div>

<Prose>{"After T retained positions, one new query's pair products cost 4Bd(T+1), plus its projections. The history-dependent work is linear for that new query but sums quadratically across full-attention prefill. Actual kernels may process padded tiles or additional masked products."}</Prose>

<Prose>{"At T=32768, d=4096, k=1024 and B=1, one layer's prompt projections use 2,748,779,069,440 operations; ideal pair products use 8,796,361,457,664. These are per prompt, not per token. Biases, normalization, softmax, recurrence, FFNs and implementation overhead were excluded. Fused attention and selective scan libraries may change utilization and data movement without changing these equations. Measure time-to-first-token, decoding, peak memory and concurrency on the actual backend rather than converting operation counts into invented seconds."}</Prose>

<H2>{"7. Why are experts a separate choice from memory?"}</H2>

<Prose>{"Attention selected information from earlier positions. What does selecting an expert select instead?"}</Prose>

<Prose>{"Begin with one complete gated FFN before drawing a router or a bank of experts."}</Prose>

<HybridSwiGluDrawing />

<Prose>{"The supplied normalized vector [1,2] is an explicitly new constructed FFN example. The two input coordinates fork into both projection branches. The actual Wg and Wu matrices produce gate [1,−2] and up [3,1]. Only the gate branch passes through SiLU; follow each of its two outputs into the × that also receives the matching up coordinate. These products are the hidden vector. The actual Wd matrix combines both hidden coordinates into each output coordinate. The matrix tables below retain all operands and more decimal places than the connected cutaway. No history is stored by this operation. In the residual layer of §2, its output is added to u."}</Prose>

<div className="neural-equation"><MathBlock>{"F_e(x)=W_{\\mathrm{down},e}\\left[\\operatorname{SiLU}(W_{\\mathrm{gate},e}x)\\odot W_{\\mathrm{up},e}x\\right]."}</MathBlock></div>

<Prose>{"For model width d and hidden width f, gate and up are f×d, down is d×f. Ignoring biases, three matrices contribute 3df entries per expert. Counting just two matrices misses the gating branch."}</Prose>

<H3>{"Trace every router probability"}</H3>

<Prose>{"Which experts execute for this current token vector?"}</Prose>

<HybridRouterScoreFlow />

<Prose>{"The first drawing repeats the score → exp → shared sum → individual division route from §1, now for four expert scores rather than three stored records. A router produces these four compatibility scores. The original constructed scores log 4,log 2,0,0 have masses 4,2,1,1 and full probabilities 0.5,0.25,0.125,0.125. Top-2 selects E0 and E1; the white marks indicate selection while violet bar length indicates probability. The four output vectors are [2,−1],[0,3],[−2,0],[1,1]. Their selected contributions sum to [1,0.25]."}</Prose>

<div className="neural-equation"><MathBlock>{"p=\\operatorname{softmax}(r(x)),\\qquad z(x)=\\sum_{e\\in\\operatorname{TopK}(p)}p_eF_e(x)."}</MathBlock></div>

<Prose>{"The inspected Jamba implementation retains these full-softmax probabilities after selection. Changing an unselected score changes the denominator and can therefore change selected weights before the selected set changes. Top-k ties use the explicitly stated lower-ID convention in this teaching implementation; another device's "}<code>{"topk"}</code>{" need not choose the same tied order."}</Prose>

<Prose>{"Does changing an unselected expert's output have the same effect?"}</Prose>

<HybridRouterValueFlow />

<Prose>{"It is a genuine null when scores and selection stay fixed, because that output does not enter the sum. Selected vector coordinates can also cancel, so a zero output does not by itself imply that no expert executed."}</Prose>

<Prose>{"What happens if selected probabilities are renormalized?"}</Prose>

<HybridRouterConventionFlow />

<Prose>{"Dividing selected probabilities by selected mass 0.75 instead gives [4/3,1/3]. This is a deliberately different operator, not a repair inferred from the words “top-2.” Selecting all four makes their mass 1 and the two conventions coincide. Match the actual checkpoint's rule. Pinning preserves scores, all output vectors and k; resetting restores the original case."}</Prose>

<H3>{"Deeper: stored capacity is different from active work"}</H3>

<Prose>{"Where are the unselected experts' weights during this token's computation?"}</Prose>

<HybridExpertBankDrawing />

<Prose>{"Their gate/up/down matrices remain stored even when they do not execute for this token. Other tokens in the batch can activate them. Routing may require dispatch, weight movement or communication; expert balancing, capacity and training gradients are developed in the "}<a href={"/learn-code/mixture-of-experts-transformers-moe/moe_study.py"}>{"complete MoE program"}</a>{"."}</Prose>

<Prose>{"Using d=4096,f=14336,16 dense FFNs and 16 expert FFNs with 16 experts each gives:"}</Prose>

<NeuralTable caption={"Deeper: stored capacity is different from active work"} headers={[<>{"FFN quantity, excluding biases/routers/mixers"}</>,<>{"Calculation"}</>,<>{"Parameters"}</>]} rows={[[<>{"One SwiGLU expert"}</>,<>{"3df"}</>,<>{"176160768"}</>],[<>{"All stored FFN matrices"}</>,<>{"(16+16×16)3df"}</>,<>{"47915728896"}</>],[<>{"FFN matrices active for one token"}</>,<>{"(16+16×2)3df"}</>,<>{"8455716864"}</>],[<>{"Hypothetical 32 dense FFNs"}</>,<>{"32×3df"}</>,<>{"5637144576"}</>]]} />

<Prose>{"Stored FFN entries are 8.5 times the hypothetical all-dense pool; active entries are 1.5 times it. These scoped counts help explain approximately 52B total/12B active original model parameters. Sparse selection limits executed work while retaining a larger parameter pool; it does not erase unselected weights or make the capacity free."}</Prose>

<Prose>{"The complete scalar mechanisms program now brings together the already taught memory read, byte accounting, stable softmax and selected-expert mixture. "}<code>{"route"}</code>{" returns the full probabilities, selected indices, retained weights and vector sum separately; its "}<code>{"renormalize"}</code>{" argument explicitly changes the convention. The byte calculation uses integer products and separately counts K/V, recurrent state and short history. Its direct entry point writes an example-results file in the program's directory; importing its functions does not run that writer."}</Prose>

<HybridFlowProgram file="hybrid_mechanisms.py" />

<H2>{"8. What changes when the release or numerical format changes?"}</H2>

<Prose>{"We have separated request state and active FFN work. Which of those facts may be reused for a different checkpoint?"}</Prose>

<Prose>{"Keep the release's actual dimensions separate from its family's name."}</Prose>

<NeuralTable caption={"8. What changes when the release or numerical format changes?"} headers={[<>{"Release"}</>,<>{"Approximately total / active parameters"}</>,<>{"Depth and width"}</>,<>{"Architectural scope"}</>]} rows={[[<>{"Jamba-v0.1"}</>,<>{"52B /12B"}</>,<>{"32 layers, width 4096"}</>,<>{"Original base release;4 attention layers"}</>],[<>{"Jamba-1.5 Mini"}</>,<>{"52B /12B"}</>,<>{"Same size family"}</>,<>{"Updated instruction-tuned successor"}</>],[<>{"Jamba-1.5 Large"}</>,<>{"398B /94B"}</>,<>{"72 layers, width 8192"}</>,<>{"9 attention layers;64 query heads and 8 K/V heads"}</>]]} />

<Prose>{"The larger model is not the 32-layer budget with a new name. "}<a href={"https://arxiv.org/html/2408.12570v1#S2"}>{"Jamba-1.5 §2"}</a>{" describes its configurations and the authors' tested retention of Mamba-1 after comparing Mamba-2 hybrids. A newer mixer was not automatically better in that combination."}</Prose>

<H3>{"Weight-storage precision and activation range solve different problems"}</H3>

<Prose>{"Does storing expert weights in int8 make every computation and request buffer int8?"}</Prose>

<HybridPrecisionDrawing />

<Prose>{"The first route stores selected FFN weight tiles as integers and reconstructs their scaled values inside the compute kernel. ExpertsInt8 uses dequantization for BF16 computation; it does not make the entire model a uniform-int8 network. Approximately 52B weights at two bytes each already mean 104 billion bytes before caches and workspaces. A discussion of fitting such a model in a single 80GB device depends on the actual quantization/allocation method, not only the active-parameter count."}</Prose>

<Prose>{"The second route concerns activations. FP16's largest finite magnitude is 65504; BF16 has a much wider exponent range but fewer fraction bits. Switching activation dtype can therefore overflow a computation that was finite in BF16. The "}<a href={"https://arxiv.org/html/2408.12570v1#S3.SS2"}>{"1.5 report §3.2"}</a>{" describes a small mean-squared activation penalty to adapt training to the serving constraint. For α times the average of n squared activation entries, its local derivative is 2αu/n. The complete training derivative includes how u depends on parameters. This is a source-scoped engineering choice, not a universal coefficient or clipping rule for every hybrid."}</Prose>

<Prose>{"Pretraining → a stage emphasizing long documents → mixed-skill/long-context post-training changes what the model learns. A maximum context field or enough memory to allocate its cache does not establish reliable reasoning across the entire context. Current model-card identifiers, parameter layouts, normalization placement, routing convention and kernel support must be checked against the exact chosen revision."}</Prose>

<Prose>{"The "}<a href={"https://huggingface.co/ai21labs/AI21-Jamba-Mini-1.7"}>{"Mini1.7 card"}</a>{" describes 256K context and instruction/grounding updates. Its repository title and example identifier order differ, so resolve the actual ID before copying a deployment command. Its stated BF16 multi-GPU requirements and reported capabilities are model-card claims, not results from the small experiment we now turn to."}</Prose>

<H2>{"9. Can we follow an actual learned hybrid from its input to a prediction?"}</H2>

<Prose>{"The preceding coefficients were constructed. We now explicitly switch to a real measured handwriting study whose saved weights and complete results can be inspected."}</Prose>

<Prose>{"An eight-point spatial pen path supplies every model input."}</Prose>

<HybridStudySelectionFlow />

<Prose>{"The "}<a href={"https://archive.ics.uci.edu/dataset/81/pen+based+recognition+of+handwritten+digits"}>{"UCI PenDigits dataset"}</a>{" contains traces from 44 writers, released as eight spatially resampled(x,y) points and a digit label. The samples are approximately regular along distance travelled, not regular time intervals. Direction arrows show point order; neither elapsed seconds, pressure nor pen lifts were supplied. Its 7494 development rows come from 30 writers; its 3498 assessment rows come from 14 different writers."}</Prose>

<Prose>{"All 10992 released coordinate sequences are distinct. Seed 181 selects 1000 fitting and 300 validation rows, balanced across ten labels, from the development file;6194 development rows remain unused. All 3498 official assessment rows remain. Fit/validation are row selections from the development writers, not a new writer-disjoint split; the official assessment writer separation is distinct."}</Prose>

<H3>{"Turn the actual coordinates into model features"}</H3>

<Prose>{"What does changing one point change before any memory operation runs?"}</Prose>

<HybridStrokeEditFlow />

<Prose>{"The dashed original remains as a reference while the current path changes. The original row 2970 is labelled 1; an edited path receives no invented new ground-truth label. The same edited coordinates flow into every subsequent saved-model and cache view."}</Prose>

<Prose>{"How does a point become an embedding vector?"}</Prose>

<HybridEmbeddingFlow />

<Prose>{"Divide x and y by 50 and subtract 1, putting them in [−1,1]. Add the global zero-based position tag t/7 and its square. This fixed transformation learns nothing from held-out rows. Each learned embedding row multiplies all four features and adds its bias; the view shows the complete chosen row and all contributions, not just a highlighted coefficient."}</Prose>

<div className="neural-equation"><MathBlock>{"f_t=[x_t/50-1,\\;y_t/50-1,\\;t/7,\\;(t/7)^2],\\qquad h_t=W_{\\mathrm{embed}}f_t+b_{\\mathrm{embed}}."}</MathBlock></div>

<Prose>{"The position denominator stays 7 for a partial prefix or resumed suffix. Restarting t at a chunk boundary changes the input basis even when all caches were correctly preserved."}</Prose>

<H3>{"Compose the complete small network"}</H3>

<Prose>{"Where do those sixteen embedding coordinates go next?"}</Prose>

<HybridStudyArchitectureDrawing />

<Prose>{"Every neural candidate has three causal layers, each with the two residual additions of §2, a final RMSNorm, and a ten-row classifier at the last position. M is a selective mixer with 16 channels, state width 4 and causal convolution width 3; A is one 16-coordinate attention head. Every layer's dense SwiGLU has hidden width 32. M0 and M2 in MAM each own their H and projected history; A1 owns growing K/V. The default model has no trained experts: routing in §7 was a separate controlled scalar/vector investigation."}</Prose>

<Prose>{"The tiny mixer omits Jamba's expansion and low-rank timestep factorization; the tiny attention has one head rather than GQA. All candidates use the same supplied global position tags. These deliberate choices make each operation inspectable. They prevent this model from being a miniature performance benchmark for a released language model."}</Prose>

<Prose>{"Which values actually enter the two residual additions?"}</Prose>

<HybridLayerTraceFlow />

<Prose>{"The selected coordinate is shown before normalization, after normalization, after mixing, at u=x+mixed, after the second normalization, after the FFN and at u+FFN. A normalized coordinate depends on the whole vector's RMS. An FFN coordinate also depends on all its incoming vector terms; showing one coordinate does not turn the layer into sixteen independent scalar classifiers."}</Prose>

<Prose>{"How is one real selective cell assembled?"}</Prose>

<HybridStateCellFlow />

<Prose>{"The current projected input joins its actual previous-two history slots. The view then exposes u,Δ,B,C, the old cell, retention factor, retained term, new write and new cell. The full four-cell row and each C product remain visible for the read contraction. The skip and gate apply afterwards. Select an M layer in the earlier layer view. An A layer has no H cell, so irrelevant state controls are removed and its distinct representation is explained rather than displaying fake zeros."}</Prose>

<Prose>{"What can a real attention query read at this point?"}</Prose>

<HybridAttentionCellFlow />

<Prose>{"For an A layer, every permitted stored key row contributes a full 16-coordinate dot product divided by√16=4, then a normalized weight and selected value-coordinate contribution. The current point is included; a future point is absent. The highlighted coordinate is one product in the full score, not the whole score. The complete selected stored K/V row remains inspectable through the prefix-cache view in §10."}</Prose>

<Prose>{"How do these contextualized coordinates become a digit decision?"}</Prose>

<HybridClassifierFlow />

<Prose>{"The final normalized 16-coordinate vector meets every coefficient in the selected classifier row and its learned bias. This produces one logit: a real-valued score, not yet a probability. All ten scores participate in one softmax denominator. Selecting a different row does not retrain the model. Earlier-point logits show its intermediate computation, but training supervised only point 8, so they are not calibrated guarantees about partial-stroke recognition."}</Prose>

<H3>{"Implement the composition from scratch, using ordinary tensor tools"}</H3>

<Prose>{"The complete "}<code>{"stroke_models.py"}</code>{" uses "}<code>{"nn.Linear"}</code>{" and registered parameters for learned projections, a per-channel convolution kernel, explicit selective tensor updates, explicit masked attention, RMSNorm and both residual additions. "}<code>{"SelectiveMixer.step"}</code>{" follows the retain/write/read/gate operands drawn in §3. Its returned pair is(state,projected history). "}<code>{"AttentionMixer.step"}</code>{" returns(K,V); "}<code>{"Layer.step"}</code>{" composes a mixer with the correctly retained u+FFN path. "}<code>{"StrokeModel.positioned"}</code>{" creates the four-feature input basis, and its classifier reads the final normalized vector."}</Prose>

<HybridFlowProgram file="stroke_models.py" />

<Prose>{""}<code>{"SelectiveMixer.forward"}</code>{" deliberately loops over positions to expose the state contract; an optimized scan can compute the same affine dependencies with a different schedule. "}<code>{"AttentionMixer.forward"}</code>{" uses a triangular future mask; "}<code>{"step"}</code>{" appends K/V and reads the complete permitted prefix. This small reference uses repeated concatenation for the attention bank, which can copy old data. A production cache may preallocate or page memory while preserving the same model/position/request identity contract. Changing allocation must preserve the same step outputs and owned prefix-cache values."}</Prose>

<Prose>{"The dense channel route first computes its second RMSNorm, projects 64 coordinates split into 32 gate and 32 up values, multiplies SiLU(gate)×up, and projects those 32 hidden values back to 16. Its output is added to the intermediate u. The learned projections and parameters remain ordinary PyTorch objects, so autograd, state dictionaries and Adam can operate on the explicitly implemented mechanism."}</Prose>

<Prose>{"All six predeclared runs used 80 epochs, batches 100, Adam learning rate 0.003, gradient-norm clipping 1 and the same batch-permutation sequence from seed 491. Each fit chooses its earliest lowest-validation-cross-entropy epoch, not lowest validation error count. Four neural patterns at seed 37, the second MAM seed 73 and a 170-parameter flattened linear model are all retained. Matching depth is not matching capacity."}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathcal L=-\\frac1m\\sum_{i=1}^{m}\\log\\operatorname{softmax}(z_i)_{y_i}."}</MathBlock></div>

<Prose>{"In a directory containing the companion data, arrays and programs, run "}<code>{"python stroke_models.py"}</code>{" to read the saved report without training. "}<code>{"python stroke_models.py --train"}</code>{" explicitly reproduces all six declared fits. The retained study used CPU PyTorch 2.14.0 and NumPy 2.3.5; no foundation-model weights or CUDA kernels were required. The raw files, saved NPZ arrays and provenance are supplied for that actual reproduction dependency, not arbitrary “save this” naming."}</Prose>

<H3>{"Keep the measured results, including the reversals"}</H3>

<Prose>{"Did the hybrid actually win this comparison?"}</Prose>

<HybridTrainingHistoriesDrawing />

<Prose>{"The plots use all 480 measured validation-history rows with no smoothing. Outlined points mark the selected epochs; the table retains every fit/error result. MMM has the fewest validation classification errors, while AAA has the fewest assessment errors. MAM is not the overall winner. Its two seeds differ. MAM and AMM also differ despite equal parameter count, showing that arrangement can change fitted behavior."}</Prose>

<Prose>{"These measured runs support a limited conclusion: the learned sequence models can recognize these eight-point paths, and mixer arrangement affects this controlled study. They do not establish language-model retrieval capacity, long-context inference throughput or a universally superior hybrid ratio. Validation cross-entropy can improve through confidence changes without changing error count. A few confident mistakes can also increase it sharply; keep both measures."}</Prose>

<Prose>{"The complete inspection program uses the same saved weights and exposes the intermediate arrays, full logits, class probabilities and cache interventions. It explicitly maps raw data rows to the native trace instead of importing a ready-made hybrid network."}</Prose>

<HybridFlowProgram file="inspect_stroke.py" />

<Prose>{"For the original validation row 2452, run "}<code>{"python inspect_stroke.py --row 2452 --break-at 3 --mode carry"}</code>{", then use "}<code>{"--mode convolution-reset"}</code>{". This is a deliberate switch from our edited row 2970 back to the stated original digit 0 example. The uninterrupted probability for 0 is approximately 0.997078. Clearing its history changes intermediate logits by about 9.0302877 while its final class remains 0. We now use that difference to study request correctness rather than equating a correct label with an equivalent computation."}</Prose>

<H2>{"10. What must survive when a request resumes or branches?"}</H2>

<Prose>{"The complete model has now produced a real prefix. Which objects must accompany its next point?"}</Prose>

<Prose>{"Inspect the original prefix bundle before applying any intervention."}</Prose>

<HybridPrefixCacheFlow />

<Prose>{"At boundary 3, each M layer stores 16×4=64 H values and 16×2=32 previous projected inputs. The A layer stores three 16-coordinate keys and three 16-coordinate values,96 values. MAM therefore carries 288 values in these tensors. This is the program's actual minimal previous-two history layout, different from §5's reserved-four original-release accounting."}</Prose>

<Prose>{"A request state comprises every layer's required tensors and the next logical position. Those tensors depend on the prefix, model weights, layer and input basis. They are not a global scratch buffer interchangeable between users."}</Prose>

<Prose>{"Does complete carried execution reproduce the original function?"}</Prose>

<HybridContinuationFlow view="boundary" />

<Prose>{"The full and current branch probability vectors are both drawn. Each point's maximum absolute logit difference is shown; comparing only the final winning class would miss numeric changes. An empty prefix before point 1 and an empty suffix after point 8 are true null boundaries: an intervention cannot affect already-produced outputs without recomputation."}</Prose>

<Prose>{"The original five neural models'300 validation sequences had a maximum full-versus-stream output discrepancy of approximately 1.26×10^(−5) in float32. The retained two-sequence float64 MAM check gave output discrepancy 1.42×10^(−14) and parameter-gradient discrepancy below 3.1×10^(−15). These are the unchanged small-model scientific checks, not a precision promise for arbitrary release kernels."}</Prose>

<Prose>{"Which past object caused a changed computation?"}</Prose>

<HybridContinuationFlow view="separate" />

<Prose>{"The default unedited row 2970 with MAM-37, boundary 3 and only K/V cleared changes its uninterrupted class 1 to branch class 2. Clearing only short history leaves H in place but changes the next transformed input. Clearing the recurrent pair removes both H and its history. Fault flags are independent and remain visible: later controls do not silently switch off earlier interventions."}</Prose>

<Prose>{"Can correct tensors still give a wrong continuation if the supplied position is restarted?"}</Prose>

<HybridContinuationFlow view="position" />

<Prose>{"The fourth point must use global index 3, producing tags 3/7 and 9/49. Restarting its index at 0 changes its embedding. The local input basis, not just tensor shape, belongs to the request contract."}</Prose>

<H3>{"Own a request, then fork its prefix"}</H3>

<Prose>{"What happens if two users arrive interleaved or a single prefix produces two continuations?"}</Prose>

<HybridRequestForkDrawing />

<Prose>{"Each branch owns independent H/history/K/V tensor storage while sharing frozen model weights. Appending to one branch must not mutate the other's starting point. Explicitly keeping a prefix snapshot also enables rewind. K/V appends can be reversed by truncating appended rows; recurrent updates can lose information through selective writes, decay and finite precision, so their rewind uses a saved state or prefix recomputation."}</Prose>

<Prose>{"What does a deliberately wrong request identity do to this same input?"}</Prose>

<HybridContinuationFlow view="identity" />

<Prose>{"The donor is the other stated validation row's prefix at the same boundary. The current request keeps its own suffix. Compatible shapes do not make that donor the same prefix. This intervention is a diagnostic identity error, not a cache optimization."}</Prose>

<H3>{"Add an explicit request-state adapter"}</H3>

<Prose>{"The existing native "}<code>{"StrokeModel.stream"}</code>{" updates its supplied cache list and assumes a nonempty chunk. A safe caller must own that list, validate inputs and avoid calling its stack operation with an empty suffix. The following additional program composes that same unchanged model into request continuation, snapshot, fork and restore operations."}</Prose>

<HybridFlowProgram file="hybrid_cache_tools.py" />

<Prose>{""}<code>{"StrokeRequest"}</code>{" binds actual architecture/parameter bytes, a nonempty request ID, batch size and the fixed eight-point feature basis. Before appending, it checks every batch row's finite normalized coordinates, dtype/device, shape and remaining global positions. It validates every cache pair against the current layer kind and offset. It then streams into deep-cloned state and commits only if both output and new state are finite. A failed input or failed computation leaves the original request untouched. An empty chunk returns a B×0×10 tensor and preserves its offset, instead of reaching "}<code>{"torch.stack([])"}</code>{"."}</Prose>

<Prose>{""}<code>{"snapshot"}</code>{" clones each tensor and records a prefix digest. Its public cache property returns another copy: frozen metadata alone would not make tensor storage immutable. "}<code>{"restore"}</code>{" validates request/model/basis/batch/offset, checks the actual prefix and clones the stored tensors before replacing the request's state. "}<code>{"fork"}</code>{" deep-copies state and prefix points into a distinct branch identity. Both branches share evaluated weights. Changing those weights or evaluation state mid-request is rejected."}</Prose>

<Prose>{"This is a validated sequential adapter for the taught small 8-point model, not a concurrent multi-user serving manager, an authentication scheme or a format for any released Jamba cache class. Its snapshots are trusted in-process objects; editing private storage or constructing forged snapshots is outside the public returned-copy contract. The identity fingerprint binds pattern and parameter bytes; backend/source revisions must be recorded separately when that distinction affects the serving contract."}</Prose>

<Prose>{"Running the program's no-training main demonstrates same-input full/chunk agreement, branch isolation, rewind and an empty suffix. Complementary checks cover all five saved causal models, two simultaneous rows, boundary 0/8, wrong identities/shapes/dtypes and atomic failures. For a production service, paging, allocation groups, scheduling, precision and prefix-reuse rules need their own implementation. The "}<a href={"https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/"}>{"vLLM design"}</a>{" explains those distinctions and marks some Mamba prefix support as work in progress; check actual installed support rather than assuming a design document means the optimization is available."}</Prose>

<Prose>{"Keep one complete edited study case when comparing interventions."}</Prose>

<HybridStudyCaseFlow />

<Prose>{"Reset restores the entire stated default, including coordinate edits, selections, boundary and all flags. Restore-source changes only coordinates. A pin deep-copies every chosen input and intervention; further edits cannot alter it. The selected neural array loads only when the study is reached, stays bound to its requested identity and is validated before inference. Loading failure and retry preserve the current input rather than substituting an old model."}</Prose>

<H2>{"11. How do other hybrids change the information routes?"}</H2>

<Prose>{"We have now distinguished state updates, addressing, routing and request ownership. A different hybrid family can change one of these routes rather than merely changing Jamba's name."}</Prose>

<HybridAlternativeRoutesDrawing />

<H3>{"Reuse parameters at several depth positions: Zamba and Zamba2"}</H3>

<Prose>{""}<a href={"https://arxiv.org/html/2405.16712v1"}>{"Zamba"}</a>{" repeatedly invokes a shared attention/MLP module along a Mamba backbone. The module receives the current residual representation concatenated with the original input embedding. “Shared” describes reused parameters across depth; it does not mean attention sees only every sixth input token. Every invocation still performs its operation."}</Prose>

<Prose>{"Could shared projection weights alone justify sharing its computed keys?"}</Prose>

<HybridSharedWeightsDrawing />

<Prose>{"The displayed identity projection sends [1,0] to [1,0] and [0,1] to [0,1]. Those are different keys despite identical weights. Reusing one invocation's bank for the other changes the function unless the architecture explicitly defines that sharing during training and inference. The "}<a href={"https://huggingface.co/Zyphra/Zamba2-7B"}>{"Zamba2 card"}</a>{" adds Mamba-2, two alternating shared blocks, depth-specific low-rank adapters and RoPE in shared attention. Check which parameter and cache contracts are actually tied."}</Prose>

<H3>{"Bound direct reads with a window: Griffin and Samba"}</H3>

<Prose>{"The already taught fixed-window view in §5 shows why "}<a href={"/learn/path/full-curriculum/long-context-sequence-models-transformer-xl-griffin-perceiver?module=deep-learning-fundamentals"}>{"Griffin"}</a>{" and "}<a href={"https://arxiv.org/html/2406.07522v1"}>{"Samba"}</a>{" can limit direct attention storage. Griffin combines a gated linear recurrence with local attention; Samba combines Mamba, sliding-window attention and separate FFNs. Outside the window, information must be carried through state or later representations. “Can continue processing” differs from “can recover every arbitrary distant detail.” Their reported generalization/passkey experiments have specific data and training conditions."}</Prose>

<H3>{"Fuse branches within a layer: Hymba"}</H3>

<Prose>{"Serial composition feeds a first operation's transformed representation into a later operation. "}<a href={"https://arxiv.org/html/2411.13676v1"}>{"Hymba"}</a>{" instead sends the same layer input to parallel attention and SSM branches, normalizes/rescales the results, then combines them. It also explicitly uses local/global attention, cross-layer K/V sharing and learned prefix meta tokens. Those tokens provide learned initialization, not newly retrieved external facts. Parallel fusion, weight tying and explicit cache sharing are three separate choices."}</Prose>

<H3>{"Deeper: a different memory update can change the hybrid itself"}</H3>

<Prose>{"Recent significant examples extend the information-route vocabulary. "}<a href={"https://research.nvidia.com/labs/adlr/nemotronh/"}>{"Nemotron-H"}</a>{" uses Mamba-2/attention/MLP layouts. The "}<a href={"https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct"}>{"Qwen3-Next80B-A3B card"}</a>{" specifies Gated DeltaNet, gated attention and MoE; its linear/full-attention layout and active expert counts belong to that release, not the original Jamba configuration. "}<a href={"https://arxiv.org/html/2510.26692v1"}>{"Kimi Linear"}</a>{" combines three KDA layers with an MLA layer in its described repeating layout. Our stored Mamba arrays are not numerical oracles for any of these different operators."}</Prose>

<Prose>{"Why does a fine-grained forgetting gate need a precise position in a matrix-memory update?"}</Prose>

<HybridDiagonalOrderDrawing />

<Prose>{"S has key-feature rows and value-coordinate columns. A unit key k reads kᵀS; a rank-one correction changes the state toward a supplied message v. A diagonal forgetting gate scales feature rows unequally. In the displayed example, k=[1/√2,1/√2], v=[2,−1], β=0.5 and gate coefficients [0.25,0.75]. Applying the correction to the forgotten state gives a different old-state transition from forgetting after the correction. Both comparison paths add the exact same new write βkvᵀ; the maximum cell difference is 0.5."}</Prose>

<div className="neural-equation"><MathBlock>{"S_{\\mathrm{new}}=(I-\\beta kk^\\top)\\operatorname{diag}(\\alpha)S+\\beta kv^\\top."}</MathBlock></div>

<Prose>{"A scalar gate αI commutes with the correction, while a general unequal diagonal gate does not. Changing the order in code can therefore silently implement a different model. This is the specific old-state order in the inspected KDA treatment, not an instruction to replace every earlier DeltaNet implementation. The "}<a href={"/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals"}>{"linear-attention update lesson"}</a>{" teaches the underlying associative/delta memory; "}<a href={"/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals"}>{"MLA"}</a>{" owns the distinct remaining attention branch."}</Prose>

<Prose>{""}<a href={"https://www.ibm.com/granite/docs/models/granite4-0"}>{"Granite4.0 documentation"}</a>{" also distinguishes hybrid dense, hybrid MoE and traditional models. Organization/family names do not determine every member's mixer. The useful research question is which information update and read each concrete architecture defines, followed by matched actual evaluation conditions—not a family-name quality ranking."}</Prose>

<H2>{"12. How would you decide whether a hybrid helps your workload?"}</H2>

<Prose>{"The real classifier and differing architectures give us mechanisms, not a universal deployment winner. Which experiment would test the information your application needs?"}</Prose>

<HybridApplicationInterventionsDrawing />

<Prose>{"For incident reports, hold the symptom narrative fixed and change only a part number; ask for that component and its evidence location. Then keep identifiers fixed and change the order of a diagnosis and later correction; ask for the currently supported conclusion. Add near-matching distractors and absent-evidence questions. These isolate address-sensitive retrieval, evidence integration and an appropriate no-evidence response rather than treating all long-document questions as one task."}</Prose>

<Prose>{"For scientific notebooks, distinguish an early parameter setting from the later superseding value and cite the relevant record. Include unrelated experiments that reuse the same parameter name. For handwriting, compare changes to an early turn with changes to the closing stroke under fixed frozen weights. These are applications to investigate: the small digit study did not measure language-model notebook reasoning. Exact auditable identifiers and quantities may be better served by external structured retrieval or a database rather than unaided neural regeneration."}</Prose>

<Prose>{"Define answer correctness, citation accuracy, conflicts and absence before evaluating. Independently vary prompt length, evidence position, number of relevant records and distractor similarity. A verbatim passkey is one useful ability, not a complete document-reasoning evaluation. Compare with a simpler model or retrieval baseline under the resource constraint you actually care about."}</Prose>

<H3>{"Use the ordinary released-model library route deliberately"}</H3>

<Prose>{"The complete deployment program handles the checkpoint/model revision, tokenizer, prompt, generated-token accounting and CUDA resource assumptions separately from the scratch model."}</Prose>

<HybridFlowProgram file="deployment_example.py" />

<Prose>{"Its "}<code>{"AutoTokenizer"}</code>{" and model/generation calls select the release's implemented normalization, expert dispatch and cache classes. The scratch PenDigits network uses ordinary tensor tools to expose its own mechanism; it cannot validate arbitrary foundation-model outputs. The large-model program remains unexecuted here and requires suitable model storage, CUDA and kernels. Verify a resolvable exact ID/revision, actual optional kernel path, chosen dtypes/quantization and backend support before interpreting it as a working deployment for your hardware."}</Prose>

<Prose>{"Record GPU model/count, software revisions, precision, batching, cold versus warm load, input/output lengths and sampling settings. Measure time to first token, per-token decoding time, total latency, peak memory and concurrent requests while meeting a latency limit. Equal total parameters, active parameters, training tokens and serving cost are different comparisons. No invented relative-compute curve replaces those measurements."}</Prose>

<Prose>{"For fine-tuning, inspect the actual module names before selecting adapter targets. Attention projections, recurrent input/timestep/output projections and FFNs offer different adaptation routes. Attention-only adaptation is a valid restricted experiment; broader targets cost more and need held-out comparisons, including long-context retention. There is no universal rule that a recurrent branch needs twice the learning rate or a special clipping threshold. The useful decision sequence is: what information must survive → which operation exposes its route → which allocation/work grows → whether the serving state is correct → whether task improvement justifies the total cost."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"13. Practice, independent reproduction and the next question"}</H2>

<Prose>{"Attempt the changed cases below before opening their hints or solutions. They test whether you can carry the mechanism to new inputs instead of memorizing the examples. Questions 1–6 emphasize the core computation;7–10 extend the architectural and engineering decisions."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. An identical summary, a different answer"}</H3>

<Prose>{"With "}<InlineMath>{"\\lambda=1/2"}</InlineMath>{", do "}<InlineMath>{"[1,4,2]"}</InlineMath>{" and "}<InlineMath>{"[5,2,2]"}</InlineMath>{" end at the same summary state? The labels are A, B, C. For query A, use attention weights proportional to "}<InlineMath>{"[4,1,1]"}</InlineMath>{". Compute both attention reads and explain what this proves."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Unroll the numerator to "}<InlineMath>{"\\frac14v_1+\\frac12v_2+v_3"}</InlineMath>{". The normalizer is the same for equal sequence lengths."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Both numerators are 4.25 and both normalizers are 1.75, giving 17/7. Attention gives "}<InlineMath>{"(4+4+2)/6=5/3"}</InlineMath>{" for the first sequence and "}<InlineMath>{"(20+2+2)/6=4"}</InlineMath>{" for the second. This summary cannot distinguish these histories; separate keyed values can. Neither attention result is guaranteed to equal its label-A value, and the example does not prove that all recurrent states have this collision."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A different cache budget"}</H3>

<Prose>{"A model has 24 layers, six using full attention. Batch size is two, with four KV heads of width 64 and two-byte K/V storage. At 8,192 tokens, calculate K/V bytes. Then double only the sequence length. Which other model information would be needed to calculate total request state?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Multiply batch, attention layers, tokens, two banks, KV heads, head width and bytes per scalar."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The count is "}<InlineMath>{"2\\cdot6\\cdot8192\\cdot2\\cdot4\\cdot64\\cdot2=100,663,296"}</InlineMath>{" bytes, or 96 MiB. Doubling context gives 192 MiB. Recurrent-layer count, expanded/state dimensions, convolution history layout and their dtypes are needed for the remaining persistent state. Allocator overhead, weights and temporary memory are additional concerns."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Repair the residual"}</H3>

<Prose>{"An implementation uses "}<InlineMath>{"x_{\\mathrm{next}}=x+\\mathrm{FFN}(\\mathrm{Norm}(x+\\mathrm{Mix}(\\mathrm{Norm}(x))))"}</InlineMath>{". Explain the missing path. In a scalar example with "}<InlineMath>{"x=2"}</InlineMath>{", mixer output 3 and FFN output 4, compare it with the intended two-residual layer."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Name the intermediate value after the mixer addition before writing the second addition."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first intermediate value is "}<InlineMath>{"u=2+3=5"}</InlineMath>{". The intended result is "}<InlineMath>{"u+4=9"}</InlineMath>{". The displayed implementation returns "}<InlineMath>{"2+4=6"}</InlineMath>{", so the mixer contribution lacks its direct residual path into the final output. The FFN still depends on it, but that is a different function."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Where did the missing probability mass go?"}</H3>

<Prose>{"Four router probabilities are "}<InlineMath>{"[0.4,0.3,0.2,0.1]"}</InlineMath>{". Top-2 outputs are "}<InlineMath>{"[5,0]"}</InlineMath>{" and "}<InlineMath>{"[0,5]"}</InlineMath>{". Compute the retained-probability mixture and the renormalized mixture. If only the third expert's output changes, which mixture changes?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The selected mass is 0.7. Selection and score computation are held fixed."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Retained mixing gives "}<InlineMath>{"[2,1.5]"}</InlineMath>{". Renormalized mixing gives "}<InlineMath>{"[20/7,15/7]"}</InlineMath>{". Neither changes when only an unselected expert's output changes, since that output is not evaluated in the mixture. Changing its router score is different and can affect the retained weights even before selection changes."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. A correct final label hides a cache bug"}</H3>

<Prose>{"The model returns digit zero both before and after its convolution history is cleared mid-request. A teammate concludes that convolution history can be discarded. Give a concrete verification strategy and a null case where clearing state really has no effect."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare numeric outputs at every position under the same weights and inputs, not just an argmax."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Compare full-sequence logits with correctly carried streaming logits, then compare the damaged branch. Check more than one input and inspect the point immediately after the boundary. Intermediate differences or probability changes refute equivalence even when the final class stays zero. Clearing an already-empty cache before the first token is a true null; clearing after the last token cannot alter already-produced outputs. These nulls do not justify clearing a nonempty midstream cache."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Choose without looking at the assessment answers"}</H3>

<Prose>{"Two candidate models have validation cross-entropies 0.12 and 0.15; their assessment error counts are 50 and 30. Your declared selection rule was lowest validation cross-entropy. Which candidate is selected, and what do you do with the second candidate's better assessment count?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate an honest report from a new selection decision."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Select the first candidate under the declared rule. Report both assessment results as part of the planned comparison, including the reversal. Do not relabel the second as the validation-selected winner. If the reversal motivates a new selection rule or training experiment, develop it using development evidence and evaluate the resulting decision with an independent assessment protocol."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Shared weights do not guarantee shared keys"}</H3>

<Prose>{"A shared key projection is the identity. It is called at two depths with vectors "}<InlineMath>{"[1,0]"}</InlineMath>{" and "}<InlineMath>{"[0,1]"}</InlineMath>{" for the same token. Can the two invocations use the same stored key without changing either computation? What extra design would make cache sharing legitimate?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Apply the projection before arguing from parameter identity."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The keys are "}<InlineMath>{"[1,0]"}</InlineMath>{" and "}<InlineMath>{"[0,1]"}</InlineMath>{", so replacing one with the other changes its attention scores. Explicit architectural sharing could define both layers to consume a key bank generated by a designated layer, with that rule used during training and inference. That is a different contract from merely tying projection weights."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Active weights and stored weights"}</H3>

<Prose>{"A toy network has eight FFN positions. Four are dense; four have four experts and select two. Each SwiGLU expert has model width 16 and intermediate width 32. Calculate total FFN parameters, active FFN parameters for one token, and the corresponding all-dense total."}</Prose>

<details><summary>Hint</summary>

<Prose>{"One expert has three matrices, each with "}<InlineMath>{"16\\cdot32"}</InlineMath>{" entries."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"One expert has 1,536 parameters. Stored FFN parameters are "}<InlineMath>{"(4+4\\cdot4)1536=30,720"}</InlineMath>{". Active FFN parameters are "}<InlineMath>{"(4+4\\cdot2)1536=18,432"}</InlineMath>{". Eight dense FFNs have 12,288. Sparse selection increases the parameter pool while limiting, rather than eliminating, extra work. Router and mixer parameters are excluded."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Window the attention"}</H3>

<Prose>{"Replace every full-attention layer by a window of 512 positions. A query asks for an identifier introduced 10,000 positions earlier. Explain what information routes remain and why the cache can be bounded without proving the answer will be correct."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Direct access to a key is different from information carried forward in hidden representations."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The old identifier's original key lies outside every individual attention window. Its information could persist through recurrent state or be copied into later representations and relayed through layers. Those routes may or may not preserve enough detail. With fixed width and state size, each layer's window cache and recurrent buffers have bounded size, but that storage bound is not a guarantee of arbitrary exact recall."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Design a useful hybrid experiment"}</H3>

<Prose>{"You want to answer questions about a laboratory notebook. Design two interventions that distinguish identifier retrieval from combining evidence across a sequence, and name the measurements required to decide whether a hybrid is useful."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Change one explanatory factor at a time. Include questions whose answers are absent."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"For retrieval, change one experiment's identifier or final parameter value while preserving the surrounding narrative and add near-matching distractor identifiers. For sequence integration, reorder a superseded setting and its correction, or move the relevant evidence across several separated entries while holding identifier vocabulary fixed. Score correct answers, evidence citations and appropriate no-evidence responses. Measure TTFT, decode time, total latency, peak memory and concurrency at a recorded model/software/hardware configuration. Compare with a simpler model or structured retrieval baseline under the same task and resource constraints."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Branch a request without aliasing its state"}</H3>

<Prose>{"Snapshot a MAM prefix after point three. Fork two distinct request IDs, append a different fourth point to each, and then restore the original request to its snapshot. Explain which tensors must have distinct storage, which objects may be shared, and how you would detect a changed model or wrong prefix before any mutation."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate the evaluated parameter tensors from each request's H, projected convolution history, K, V and processed input prefix. An assignment of a tensor reference is not a clone of its storage."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The two M layers each need independent H and projected-history tensors; the A layer needs independent K and V banks. Each branch also retains independent processed points and offset metadata. Frozen evaluated model weights may be shared. Appending to branch one must leave branch two's full tensor values and prefix unchanged; compare snapshots and tensor storage addresses. The adapter validates its parameter identity, request ID, fixed input basis, batch, offset and actual prefix digest before restore, validates every cache shape/dtype/device, and commits a cloned append only after finite output and state are produced. The third-point snapshot restores recurrent state; merely truncating K/V is insufficient. A wrong prefix, changed parameters, ninth point or nonfinite later batch row must be rejected with the original state unchanged. Use the returned-copy public snapshot contract; this is not an adversarial serialization format."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning"><H3>{"Foundations: two complementary explanations"}</H3>

<ul><li>{""}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/queries-keys-values.html"}>{"Dive into Deep Learning: queries, keys and values"}</a>{". Read the record/query example, then map its weighted read to §1. It offers a second route to the intuition behind addressing before the matrix equation."}</li><li>{""}<a href={"https://ageron.github.io/homlp/HOMLP_Appendix_E.pdf"}>{"Aurélien Géron: state-space models appendix"}</a>{". The author-hosted appendix builds the linear state-space foundation and explains the selective Mamba components near pages29–33. Pair it with §3's actual state cells and with the linked full SSM lesson. This free appendix complements the attention treatment; it does not validate the local handwriting experiment."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H3>{"References and other ways to learn"}</H3>

<ul><li>{""}<strong>{"Architecture and evidence:"}</strong>{" "}<a href={"https://arxiv.org/html/2403.19887v1"}>{"Lieber et al., Jamba"}</a>{". Start with §2 and the actual release shape in §3; then read the ratio, format-following and normalization investigations in §6. The authors distinguish measured behavior from their induction-head hypothesis."}</li><li>{""}<strong>{"Scale and serving:"}</strong>{" "}<a href={"https://arxiv.org/html/2408.12570v1"}>{"Jamba-1.5 technical report"}</a>{". §§2–3 explain the larger configuration, ExpertsInt8 and activation-range issue; §§5–6 explain training stages and evaluation. Read the hardware and output-length conditions beside throughput figures."}</li><li>{""}<strong>{"Implementation reference:"}</strong>{" "}<a href={"https://huggingface.co/docs/transformers/model_doc/jamba"}>{"Hugging Face Jamba documentation"}</a>{" and "}<a href={"https://github.com/huggingface/transformers/blob/main/src/transformers/models/jamba/modeling_jamba.py"}>{"model source"}</a>{". Follow the two residual additions, normalized timestep/B/C features, selected router weights and distinct cache operations. Names and kernel APIs can change between revisions."}</li><li>{""}<strong>{"Data and independent reproduction:"}</strong>{" "}<a href={"https://archive.ics.uci.edu/dataset/81/pen+based+recognition+of+handwritten+digits"}>{"UCI PenDigits"}</a>{", by E. Alpaydin and F. Alimoglu, "}<a href={"https://doi.org/10.24432/C5MG6K"}>{"DOI"}</a>{". The original names file explains spatial resampling and the writer-disjoint official assessment set. The accompanying files retain attribution and the CC BY 4.0 source license."}</li><li>{""}<strong>{"A guided video course:"}</strong>{" "}<a href={"https://www.deeplearning.ai/courses/build-long-context-ai-apps-with-jamba/"}>{"Build Long-Context AI Apps with Jamba"}</a>{", DeepLearning.AI with AI21, taught by Chen Wang and Chen Almagor. The verified course listing describes nine video lessons, architecture, document prompting, tool calling and context/RAG applications. Its listing was reviewed; the videos and notebooks were not watched or executed for this lesson. Use it for an application-oriented second explanation; access and hosted APIs may require an account."}</li><li>{""}<strong>{"Alternative design explanations:"}</strong>{" "}<a href={"https://www.zyphra.com/our-work/the-zyphra-training-cookbook"}>{"Zyphra's training cookbook"}</a>{" explains the rationale for shared blocks; pair it with "}<a href={"https://arxiv.org/html/2405.16712v1"}>{"Zamba"}</a>{" and the "}<a href={"https://huggingface.co/Zyphra/Zamba2-7B"}>{"Zamba2 card"}</a>{". "}<a href={"https://arxiv.org/html/2406.07522v1"}>{"Samba"}</a>{" and "}<a href={"https://arxiv.org/html/2411.13676v1"}>{"Hymba"}</a>{" expose different choices of locality and within-layer fusion."}</li><li>{""}<strong>{"Serving-state design:"}</strong>{" "}<a href={"https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/"}>{"vLLM hybrid KV cache manager"}</a>{". Useful after the cache investigation; it shows why allocator groups, padding and prefix-reuse rules cannot all be copied from a homogeneous attention stack."}</li><li>{""}<strong>{"Significant later architecture examples:"}</strong>{" "}<a href={"https://research.nvidia.com/labs/adlr/nemotronh/"}>{"Nemotron-H's official report"}</a>{" gives actual layout and evaluation conditions; "}<a href={"https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct"}>{"Qwen3-Next's official card"}</a>{" specifies its released Gated DeltaNet/gated-attention/MoE design; "}<a href={"https://arxiv.org/html/2510.26692v1"}>{"Kimi Linear"}</a>{", especially its architecture/update sections, gives the fine-grained KDA forgetting order. Read these after §11, keeping their operators and reported evidence separate from Jamba and the local arrays. "}<a href={"https://www.ibm.com/granite/docs/models/granite4-0"}>{"Granite4.0's architecture table"}</a>{" illustrates why one family label is insufficient to infer every member's architecture."}</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H3>{"Build and reproduce"}</H3>

<Prose>{"Keep the five complete programs together for the stated imports. "}<code>{"hybrid_mechanisms.py"}</code>{" runs the scalar memory/storage/router calculations without training. "}<code>{"stroke_models.py"}</code>{" defines the scratch model, data loader and optional training entry point; "}<code>{"inspect_stroke.py"}</code>{" reads its saved fits without refitting. The additional "}<code>{"hybrid_cache_tools.py"}</code>{" imports that same model and validates same-input continuation, snapshot, fork and restore. "}<code>{"deployment_example.py"}</code>{" is the separate, unexecuted large-model library route."}</Prose>

<Prose>{"Use the retained "}<code>{"pendigits.tra"}</code>{", "}<code>{"pendigits.tes"}</code>{" and "}<code>{"pendigits.names"}</code>{" with "}<code>{"data-provenance.md"}</code>{" for data attribution and selection details. "}<code>{"stroke-fits.npz"}</code>{" contains all six saved fits; "}<code>{"stroke-results.json"}</code>{" contains complete outcomes and histories. Their original bytes, epochs and error counts are retained. The selected browser model arrays are derived representations of the five neural fits, not replacements for the reproducible native checkpoint. Read the files and measured-output claims before invoking a training entry point; training again is a new experiment."}</Prose>

<HybridFlowDownloads /></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"What to learn next"}</H3>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/titans-multi-memory-architecture?module=deep-learning-fundamentals"}>{"Titans: Multi-Memory Architecture"}</a>{". Carry forward the questions learned here: what each memory stores, what updates it, how a read is performed, and what must be preserved when processing the next part of a sequence."}</Prose></section>
  </div></HybridMemoryStudyProvider></HybridMemoryFlowProvider>,
};
