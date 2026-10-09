// Positional encoding lesson: continuous beginner-to-specialist reading flow.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { PositionJourneyDrawing, PositionPermutationDrawing, PositionCausalDrawing, PositionShiftDrawing, PositionProjectionTermsDrawing, PositionAttentionRouteDrawing, PositionQuarterTurnDrawing, PositionBasisDrawing, PositionEmbeddingGradientDrawing, PositionPackingDrawing, PositionFrequencyDrawing, PositionMovementArchitectureDrawing, PositionSymmetricBiasDrawing, PositionYarnRampDrawing, PositionCurrentFrequencyDrawing, PositionLongRopeResearchDrawing, PositionCacheMemoryDrawing, PositionTaskCoordinatesDrawing, PositionLinearReadDrawing, PositionMultiaxisDrawing, PositionArray } from '../../components/lesson-labs/PositionalEncodingFlowFigures.jsx';
import { PositionCaseProvider, PositionCaseReset, PositionAdditiveLab, PositionClockLab, PositionClockComparisonLab, PositionRotaryLab, PositionToeplitzLab, PositionDistanceLab, PositionPartialLab, PositionAlibiLab, PositionAlibiCompetitorLab, PositionSlopeLab, PositionShawLab, PositionBucketLab, PositionMovementLabs, PositionCacheLab, PositionCacheLengthLab, PositionExtensionLab, PositionInterpolationLab, PositionXposLab } from '../../components/lesson-labs/PositionalEncodingFlowLabs.jsx';
import '../../components/lesson-labs/lesson-flow.css';
export default {
  title: 'Positional Encodings: Sinusoidal, Learned, RoPE and ALiBi',
  readTime: '~90 min read + experiments and practice',
  hasIntegratedGuide: true,
  content: () => <PositionCaseProvider><div className="neural-lesson neural-lesson-neutral positional-encoding-lesson lesson-flow"><LessonIntro prerequisites="Query/key/value attention and Transformer blocks. Rotations, relative distances and cache coordinates are developed locally." sections={[["1-what-information-is-missing","1. What information is missing?"],["2-add-a-position-vector-learned-and-sinusoidal-encodings","2. Add a position vector: learned and sinusoidal encodings"],["3-rope-let-relative-position-change-the-comparison","3. RoPE: let relative position change the comparison"],["4-alibi-express-a-preference-in-logit-space","4. ALiBi: express a preference in logit space"],["5-other-relative-encodings-explain-the-design-space","5. Other relative encodings explain the design space"],["6-a-real-investigation-can-the-model-see-movement-direction","6. A real investigation: can the model see movement direction?"],["7-implement-positions-and-verify-cached-attention","7. Implement positions and verify cached attention"],["8-deeper-route-extending-the-context-without-confusing-the-claims","8. Deeper route: extending the context without confusing the claims"],["9-choose-the-position-system-for-the-actual-task","9. Choose the position system for the actual task"],["10-practice-change-the-situation-then-explain-the-result","10. Practice: change the situation, then explain the result"],["what-comes-next","What comes next?"],["references-and-another-way-to-learn","References and another way to learn"]]}>An ordered array is useful only when the model can use its order. Follow where position enters the actual computation.</LessonIntro>


<Prose>{"Imagine recording a hand moving around an arc. The same collection of points can describe clockwise or anticlockwise movement. To tell them apart, a model needs to know how the points are ordered—not just where the hand visited."}</Prose>

<PositionJourneyDrawing />

<Prose>{"Follow the arrows: A starts the first journey, while D starts the second. The table keeps two fields for every record: a visited point and its attached position ID, a number describing when it belongs in the journey. Rearranging complete records preserves those associations; attaching new IDs changes them."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals"}>{"previous Transformer Block lesson"}</a>{" supplied that information by attaching a numerical time-slot tag to every point. This lesson studies more structured ways to supply position. Some add a position vector to the input. Some turn query and key vectors before comparing them. Some change the attention score according to distance. These choices affect what the model can represent, how cached generation works and what happens when a sequence becomes longer."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow §§1–6, run the small program in §7 and try exercises 1–4. You will be able to explain and implement the four main methods and diagnose a position-offset bug. The deeper route in §§8–9 develops context extension, geometric variants and engineering choices; exercises 5–8 use that material. Derivations sit beside the mechanism they explain, so you can return to them after trying the visual investigation."}</Prose>

<H2>{"1. What information is missing?"}</H2>

<H3>{"Rows store order; the computation must use it"}</H3>

<Prose>{"What happens when we rearrange all complete records together? In the picture below, three rows use the same learned maps; their comparison matrix moves both row and column axes, and their output values move with them."}</Prose>

<PositionPermutationDrawing />

<Prose>{"Read the first matrix by its query row and key column. Its numbers are unscaled dot products for Q=K=[[1,0],[0,1],[1,1]], with scalar values [2,6,10]. The lower route moves C before A and B, including their values. The same output numbers move to the corresponding rows; their mean is unchanged. This fixture uses unit score scale to isolate rearrangement; the general attention rule below uses the usual head-width scale."}</Prose>

<Prose>{"An array preserves its row order. That does not mean every function applied to the array uses that order. Adding all the rows gives the same sum after any rearrangement."}</Prose>

<Prose>{"Recall one head from "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention"}</a>{". A query describes what a row seeks, a key describes how a row can be matched, and a value is the information mixed into the result:"}</Prose>

<div className="neural-equation"><MathBlock>{"A=\\operatorname{softmax}_{\\text{keys}}(QK^\\top/\\sqrt{d_k}),\\qquad Y=AV."}</MathBlock></div>

<Prose>{"Here rows of Q correspond to queries, columns of the score matrix to keys, and each softmax row sums to 1. "}<InlineMath>{"d_k"}</InlineMath>{" is the width of "}<strong>{"one query/key head"}</strong>{", not the whole model. Dividing by its square root controls score scale."}</Prose>

<Prose>{"A permutation matrix is a row-reordering map: each row and column contains one 1 and otherwise zeros. For the picture’s C, A, B order, its rows are [0,0,1], [1,0,0], [0,1,0]. Multiplying an array on the left selects its rows in that order. Suppose we reorder every input row using that same matrix "}<InlineMath>{"\\Pi"}</InlineMath>{". Shared rowwise projections produce "}<InlineMath>{"\\Pi Q,\\Pi K,\\Pi V"}</InlineMath>{". The score matrix becomes "}<InlineMath>{"\\Pi(QK^\\top)\\Pi^\\top"}</InlineMath>{": its rows and columns are merely rearranged. Rowwise softmax respects that rearrangement, so"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Attention}(\\Pi X)=\\Pi \\operatorname{Attention}(X)."}</MathBlock></div>

<Prose>{"This is "}<strong>{"permutation equivariance"}</strong>{". Output rows move with their inputs. It is different from invariance: an invariant output stays unchanged. Mean pooling the equivariant output gives an invariant whole-sequence representation. Shared feedforward networks, per-row LayerNorm and residual additions preserve the same symmetry when no other positional signal is present."}</Prose>

<Prose>{"For a set of measurements whose order is irrelevant, this is useful. For a movement whose direction matters, it is a limitation. An attention-based set classifier cannot distinguish a sequence from its reversal if the two differ only in row order."}</Prose>



<H3>{"A causal mask already supplies some structure"}</H3>

<Prose>{"Why does a decoder behave differently? Keep its rule “read only this row and earlier rows” fixed while reversing the scalar values; the permitted prefix weights are now paired with different contents."}</Prose>

<PositionCausalDrawing />

<Prose>{"The triangle shows each row’s legal normalized weights: one key, then two, then three. Multiplying those weights by [2,6,10] gives [2,4,6]; the same weights on [10,6,2] give [10,8,6]. The lower picture gives the beginning marker value 1 and all other marker values 0, so the third prefix returns 1/3. It can expose prefix size without adding a position vector."}</Prose>

<Prose>{"The proof assumed the permitted query–key pairs were also unchanged or consistently permuted. A fixed causal mask permits a query to read only itself and preceding slots. Arbitrarily shuffling content while leaving this triangle fixed changes who can read whom. The earlier equivariance proof no longer applies."}</Prose>

<Prose>{"The beginning marker in the lower picture can expose prefix size through "}<InlineMath>{"1/(t+1)"}</InlineMath>{", because the marker is one item among a growing prefix. Additional layers can use such structure. This is why decoder-only Transformers without explicit position embeddings, often called "}<strong>{"NoPE"}</strong>{", are a meaningful research design. It does not imply that every such model automatically learns robust counting or long-context reasoning. The "}<a href={"https://arxiv.org/pdf/2305.19466"}>{"NoPE/length-generalization study"}</a>{" distinguishes the causal setting and evaluates actual tasks rather than equating computability with generalization."}</Prose>

<Prose>{"Position can therefore arrive through several routes: explicit coordinates, position vectors, score biases, causal/local connectivity, recurrent state or a combination. Our task is to identify which route the model actually has."}</Prose>

<H2>{"2. Add a position vector: learned and sinusoidal encodings"}</H2>

<H3>{"A label the model can learn"}</H3>

<Prose>{"Can a record carry a numerical tag into the same Transformer block? Switch from the hand coordinates to a complete two-feature arithmetic example: content A=[1,2], B=[−1,1], C=[0.5,−0.5], with a three-row position table."}</Prose>

<Prose>The additive questions retain one case: content, position-table edits, attached IDs and complete-record storage order. Restore its initial values to follow the printed arithmetic.</Prose>
<PositionCaseReset name="additive" />
<PositionAdditiveLab />

<Prose>{"Read this route top to bottom. The cyan content and its attached integer ID choose one amber table row; addition produces a violet combined input of the same width. For A at ID 0, [1,2]+[0.2,0]=[1.2,2]. Swapping only A/B IDs changes those sums. The values are hand parameters, not a trained language-model checkpoint. Warm/blue cell fills show positive/negative numbers; outlines separately identify input, learned parameter and computed result."}</Prose>

<Prose>{"Let a token or measurement have a content vector "}<InlineMath>{"x_t\\in\\mathbb R^d"}</InlineMath>{". The simplest construction is"}</Prose>

<div className="neural-equation"><MathBlock>{"h_t=x_t+p_t."}</MathBlock></div>

<Prose>{"Both vectors have the same width. Addition keeps the shape "}<InlineMath>{"L\\times d"}</InlineMath>{", so the existing Transformer block can consume it."}</Prose>

<Prose>{"A "}<strong>{"learned absolute embedding"}</strong>{" stores a table "}<InlineMath>{"P\\in\\mathbb R^{L_{\\max}\\times d}"}</InlineMath>{", and chooses "}<InlineMath>{"p_t=P[t]"}</InlineMath>{". Its rows begin as ordinary trainable parameters. During training, a prediction error updates the rows used by that example, together with the rest of the network. If several examples use slot 7, their gradients contribute to the same position row 7."}</Prose>

<Prose>{"The initial position table in the drawing is also listed below for a fixed reference:"}</Prose>

<NeuralTable caption={"A label the model can learn"} headers={[<>{"Slot"}</>,<>{"Position vector"}</>]} rows={[[<>{"0"}</>,<>{"[0.2, 0.0]"}</>],[<>{"1"}</>,<>{"[0.0, 0.3]"}</>],[<>{"2"}</>,<>{"[−0.1, 0.1]"}</>]]} />

<Prose>{"If the content vector "}<code>{"[1,2]"}</code>{" occurs in slot 0, its combined vector is "}<code>{"[1.2,2]"}</code>{". The same content in slot 1 becomes "}<code>{"[1,2.3]"}</code>{". These numbers are a hand fixture, not learned weights from a language model. They make the operation visible: the table tells the model which slot a row occupies; training decides what to do with that signal."}</Prose>

<Prose>{"The table has "}<InlineMath>{"L_{\\max}d"}</InlineMath>{" parameters. A 512 × 768 table has 393,216. A table with 512 rows supports indices 0–511. Index 512 has no row. Enlarging the table solves the storage problem but leaves a learning problem: new rows need a considered initialization, interpolation or further training strategy. Full retraining from scratch is not mathematically required, and a larger table alone does not establish useful longer-context behavior."}</Prose>

<Prose>{"Do not silently replace an out-of-range index with "}<code>{"index % max_length"}</code>{". That makes different absolute positions share an embedding without having trained the model for this periodic rule."}</Prose>

<Prose>{"Does a storage move change the same record? Move A with its attached ID; the selected table row follows it."}</Prose>

<PositionAdditiveLab investigation="storage" />

<Prose>{"Now change actual content coordinates in a selected record; addition preserves the other records and shows where the changed coordinate enters the combined input."}</Prose>

<PositionAdditiveLab investigation="content" />

<Prose>{"Finally change an actual trainable table row. Both coordinate controls edit the selected row; setting equal rows removes this position component’s ability to distinguish those IDs."}</Prose>

<PositionAdditiveLab investigation="table" />

<H3>{"Smooth clocks instead of a table"}</H3>

<Prose>{"Could the tag be computed instead of learned? Each clock hand below turns at a rate called its frequency (ω), in radians per position; 2π radians is one complete turn. Its vertical sine and horizontal cosine form two stored features. The base controls how quickly rates decrease across pairs; the slider sets its power of 10."}</Prose>

<PositionClockLab />

<Prose>{"All four hands describe the same position. Pair 0 turns quickly; the later hands turn more slowly. Dashed projection lines lead to the two numerical cells; stored order is [sin,cos], while the drawn plane uses horizontal cosine and vertical sine. Select a pair, move the position or change the base and follow its phase before reading the formula."}</Prose>

<Prose>{"We can compute the position vector from a fixed formula. The original Transformer used sine/cosine pairs at different frequencies:"}</Prose>

<div className="neural-equation"><MathBlock>{"p_{t,2r}=\\sin(t\\omega_r),\\quad\np_{t,2r+1}=\\cos(t\\omega_r),\\quad\n\\omega_r=b^{-2r/d},\\quad r=0,\\ldots,d/2-1."}</MathBlock></div>

<Prose>{"This definition assumes even "}<InlineMath>{"d"}</InlineMath>{", uses radians and commonly starts from "}<InlineMath>{"b=10000"}</InlineMath>{". Frequency means radians of phase change per position. The wavelength is "}<InlineMath>{"2\\pi/\\omega_r"}</InlineMath>{" positions for a complete turn."}</Prose>

<Prose>{"Think of several clock hands turning at different rates. One fast hand is ambiguous after it comes around again, but the other hands are at different phases. Together they supply a rich position signature. This analogy concerns multiple scales; it does not make a floating-point vector an infinitely precise position identifier."}</Prose>

<Prose>{"For "}<InlineMath>{"d=8,b=10000"}</InlineMath>{", the four frequencies are "}<code>{"[1,0.1,0.01,0.001]"}</code>{". Evaluating the formula gives:"}</Prose>

<NeuralTable caption={"Smooth clocks instead of a table"} headers={[<>{"Position"}</>,<>{"sin pair 0"}</>,<>{"cos pair 0"}</>,<>{"sin pair 1"}</>,<>{"cos pair 1"}</>,<>{"sin pair 2"}</>,<>{"cos pair 2"}</>,<>{"sin pair 3"}</>,<>{"cos pair 3"}</>]} rows={[[<>{"0"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>],[<>{"1"}</>,<>{"0.841"}</>,<>{"0.540"}</>,<>{"0.100"}</>,<>{"0.995"}</>,<>{"0.010"}</>,<>{"1.000"}</>,<>{"0.001"}</>,<>{"1.000"}</>],[<>{"2"}</>,<>{"0.909"}</>,<>{"−0.416"}</>,<>{"0.199"}</>,<>{"0.980"}</>,<>{"0.020"}</>,<>{"1.000"}</>,<>{"0.002"}</>,<>{"1.000"}</>],[<>{"3"}</>,<>{"0.141"}</>,<>{"−0.990"}</>,<>{"0.296"}</>,<>{"0.955"}</>,<>{"0.030"}</>,<>{"1.000"}</>,<>{"0.003"}</>,<>{"1.000"}</>]]} />

<Prose>{"Slow channels appear constant at three decimal places even when their exact values differ. Conversely, the fastest hand turns nearly half a revolution from position 0 to 3. Adjacent positions need not look similar in every channel."}</Prose>

<Prose>{"What if we change the encoding width? Recompute all pair frequencies, rather than merely cropping the previous vector."}</Prose>

<PositionClockLab investigation="width" />

<Prose>{"To compare a change with a retained state, choose one already-taught input, edit it and pin the complete clock when useful. The reference retains all its own inputs."}</Prose>

<PositionClockComparisonLab />

<Prose>{"The larger fixed example below prints every cell, so rounded slow changes do not disappear into an unlabelled colour map."}</Prose>

<PositionArray label="All 16 position signatures at width 32, base 10000" values={Array.from({length:16},(_,t)=>Array.from({length:16},(_,r)=>[Math.sin(t*10000**(-r/16)),Math.cos(t*10000**(-r/16))]).flat())} rows={Array.from({length:16},(_,t)=>`position ${t}`)} columns={Array.from({length:32},(_,j)=>`${j%2?'cos':'sin'} pair ${Math.floor(j/2)}`)} digits={6} />

<H3>{"Why pairs make relative shifts expressible"}</H3>

<Prose>{"The clocks give a tag; can a shared operation move that tag by the same offset from any starting position? This two-coordinate example changes t=3 to t+δ=5 at frequency 0.1."}</Prose>

<PositionShiftDrawing />

<Prose>{"The first column is the stored [sin,cos] code. The middle coefficients depend only on the two-position shift; matrix multiplication gives the last column. We read a pair as a column vector for this proof, although full sequence arrays still store positions as rows."}</Prose>

<Prose>{"The addition identities for sine and cosine give"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{bmatrix}\\sin((t+\\delta)\\omega)\\\\\\cos((t+\\delta)\\omega)\\end{bmatrix}\n=\n\\begin{bmatrix}\\cos(\\delta\\omega)&\\sin(\\delta\\omega)\\\\-\\sin(\\delta\\omega)&\\cos(\\delta\\omega)\\end{bmatrix}\n\\begin{bmatrix}\\sin(t\\omega)\\\\\\cos(t\\omega)\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The matrix depends on the shift "}<InlineMath>{"\\delta"}</InlineMath>{", not on the starting slot "}<InlineMath>{"t"}</InlineMath>{". It is a rotation with a sign/order convention appropriate to the "}<code>{"[sin,cos]"}</code>{" column. This means a shared linear transformation can relate the code of a position to the code of a fixed offset. It does not mean that a learned attention head automatically selects “exactly three positions earlier.”"}</Prose>

<Prose>{"Another useful identity is"}</Prose>

<div className="neural-equation"><MathBlock>{"p_m^\\top p_n=\\sum_r\\cos((m-n)\\omega_r)."}</MathBlock></div>

<Prose>{"Where does that simple identity stop applying? Attention compares learned projections of content plus the tag. Below a declared two-feature comparison separates all four products through a hand map M."}</Prose>

<PositionProjectionTermsDrawing />

<Prose>{"The upper rows distinguish content from positional additions. Each lower cell is one term: content–content, content–position, position–content or position–position. Their sum equals the full combined comparison; none may be silently discarded."}</Prose>

<Prose>{"For the unprojected position vectors alone, the inner product depends on relative offset. But attention compares projected "}<strong>{"content-plus-position"}</strong>{" vectors. Let "}<InlineMath>{"M=W_Q^\\top W_K"}</InlineMath>{" under a column-vector convention. Then"}</Prose>

<div className="neural-equation"><MathBlock>{"(x_m+p_m)^\\top M(x_n+p_n)\n=x_m^\\top Mx_n+x_m^\\top Mp_n+p_m^\\top Mx_n+p_m^\\top Mp_n."}</MathBlock></div>

<Prose>{"There are content–content, content–position, position–content and position–position terms. An arbitrary learned "}<InlineMath>{"M"}</InlineMath>{" need not preserve the simple cosine identity. Those interactions are part of the representation, not inherently wasted capacity. They allow position to affect values and residual features as well as attention scores."}</Prose>

<Prose>{"The "}<a href={"https://arxiv.org/pdf/1706.03762"}>{"original Transformer §3.5"}</a>{" compares learned and fixed input encodings and motivates the shift identity. The "}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/self-attention-and-positional-encoding.html#positional-encoding"}>{"D2L explanation and runnable notebook"}</a>{" supplies another route through the multiscale picture. Neither the existence of a sine formula at position 100,000 nor a successful table lookup establishes that a trained model will use that position well."}</Prose>

<H2>{"3. RoPE: let relative position change the comparison"}</H2>

<H3>{"Rotate the features after the projections"}</H3>

<Prose>{"The additive code changes the input rows. Can position instead change which rows match while leaving their value messages alone? Follow the Q/K path separately from the V path below."}</Prose>

<PositionAttentionRouteDrawing />

<Prose>{"Content first passes through learned projection coefficients. A position-dependent operation turns the projected query and key; their dot product determines the shares. The value branch bypasses that turn and supplies the messages mixed by those shares. The receiver supplies Q; each donor supplies K and V. The symbols show a cutaway of the complete projections, rather than fitted weights."}</Prose>

<Prose>{""}<strong>{"Rotary position embedding"}</strong>{", RoPE, applies a deterministic rotation to each query and key. Standard RoPE leaves the values unrotated. Position enters the query–key comparison in each attention layer."}</Prose>

<Prose>{"What does “turn a pair” mean? In this basic object, a horizontal unit arrow becomes a vertical unit arrow after a counterclockwise quarter turn; both axes have the same scale."}</Prose>

<PositionQuarterTurnDrawing />

<Prose>{"The raw [1,0] arrow and computed [0,1] arrow have the same length. The curved arc marks π/2 radians. We can apply the same operation to any two coordinates, which leads to this matrix."}</Prose>

<Prose>{"Start with two-dimensional vectors. A counterclockwise rotation through angle "}<InlineMath>{"\\phi"}</InlineMath>{" is"}</Prose>

<div className="neural-equation"><MathBlock>{"R(\\phi)=\\begin{bmatrix}\\cos\\phi&-\\sin\\phi\\\\\\sin\\phi&\\cos\\phi\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The point "}<code>{"[1,0]"}</code>{" becomes "}<code>{"[0,1]"}</code>{" at "}<InlineMath>{"\\phi=\\pi/2"}</InlineMath>{". Its length stays 1. A general vector turns through the same angle without changing length."}</Prose>

<Prose>{"For a head of even width "}<InlineMath>{"d_k"}</InlineMath>{", divide the coordinates into pairs. Pair "}<InlineMath>{"r"}</InlineMath>{" gets frequency "}<InlineMath>{"\\theta_r=b^{-2r/d_k}"}</InlineMath>{". At query position "}<InlineMath>{"m"}</InlineMath>{", rotate each pair through "}<InlineMath>{"m\\theta_r"}</InlineMath>{"; at key position "}<InlineMath>{"n"}</InlineMath>{", rotate its corresponding pair through "}<InlineMath>{"n\\theta_r"}</InlineMath>{". Write the block-diagonal collection of rotations as "}<InlineMath>{"R_m"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"q'_m=R_mq_m,\\qquad k'_n=R_nk_n."}</MathBlock></div>

<Prose>{"The coordinate pairs are fixed by the implementation's basis. The projections that produce their content are learned. The rotation planes themselves are not separately learned in this standard construction."}</Prose>



<H3>{"The relative-offset identity, step by step"}</H3>

<Prose>{"For the following running case, use projected q=[0.8,−0.5,0.3,1.2], k=[1,0.25,−0.5,0.75], at IDs 3 and 7, base 10000. These are hand fixtures, not movement-model activations. Hold this content fixed and compare the two pairs. Moving both attached IDs by the same amount turns both vectors together; the signed coordinate products below retain their total."}</Prose>

<PositionCaseReset name="rotary" />
<PositionRotaryLab investigation="shift" />

<Prose>{"To see why, reverse the query’s turn in the comparison. The query returns to its raw coordinates and the key retains only its relative turn by n−m. Each pair’s two coordinate products still sum to the same value."}</Prose>

<PositionRotaryLab investigation="relative" />

<Prose>{"Transpose reverses a rotation, and successive rotations add their angles. Therefore"}</Prose>

<div className="neural-equation"><MathBlock>{"(R_mq_m)^\\top(R_nk_n)\n=q_m^\\top R_m^\\top R_nk_n\n=q_m^\\top R_{n-m}k_n."}</MathBlock></div>

<Prose>{"Turn both vectors by 100 extra position units, using the same frequencies, and their dot product stays unchanged. Turn only the key, and the relative angle changes. That is the useful built-in structure."}</Prose>

<Prose>{"Notice what the identity holds fixed: the "}<strong>{"content vectors"}</strong>{" "}<InlineMath>{"q_m,k_n"}</InlineMath>{". Different words or hidden states still produce different vectors. RoPE has not replaced content similarity with a distance-only score. The vectors in a later layer may already reflect boundaries, masks and earlier context, so a statement about this local operation must not be mistaken for universal translation invariance of an entire language model."}</Prose>

<Prose>{"One pair contributes"}</Prose>

<div className="neural-equation"><MathBlock>{"(q_0k_0+q_1k_1)\\cos(\\Delta\\theta)\n +(q_1k_0-q_0k_1)\\sin(\\Delta\\theta),\\quad \\Delta=n-m."}</MathBlock></div>

<Prose>{"The sine term can distinguish the direction of the offset. With suitable content vectors, “three before” and “three after” can receive different scores. The denominator "}<InlineMath>{"\\sqrt{d_k}"}</InlineMath>{" and rowwise softmax follow this calculation as usual."}</Prose>

<H3>{"A complete four-coordinate example"}</H3>

<Prose>{"The relative identity explains the conservation; now work every coordinate. Return to the same q/k fixture introduced under The relative-offset identity; the initial IDs are 3 and 7 and base is 10000. Related rotary investigations share your current Q/K, IDs, base and common shift; the printed arithmetic below describes their initial state."}</Prose>

<PositionRotaryLab />

<Prose>{"Each pair plane uses equal axes. The raw vectors are cyan and computed rotations violet; labels print every coordinate. The three lower cells show first product, second product and their sum. Add both pair sums, then divide by √4; the walkthrough below performs that same arithmetic."}</Prose>

<Prose>{"At the initial settings of this same fixture, "}<InlineMath>{"d_k=4,b=10000"}</InlineMath>{" gives frequencies 1 and 0.01."}</Prose>

<ol start={1}><li>{"Query pair 0 turns through 3 radians; query pair 1 through 0.03."}</li><li>{"Key pair 0 turns through 7 radians; key pair 1 through 0.07."}</li><li>{"The rotated vectors are"}</li></ol>

<Prose>{"   "}<InlineMath>{"q'\\approx[-0.721434,0.607892,0.263870,1.208459]"}</InlineMath>{" and    "}<InlineMath>{"k'\\approx[0.589656,0.845462,-0.551233,0.713192]"}</InlineMath>{"."}</Prose>

<ol start={4}><li>{"Their dot product is 0.804961. Dividing by "}<InlineMath>{"\\sqrt4=2"}</InlineMath>{" gives the attention logit 0.402481."}</li><li>{"Computing "}<InlineMath>{"q^\\top R_4k"}</InlineMath>{" gives the same 0.804961. Positions 103 and 107 also give that value."}</li></ol>

<Prose>{"The query's norm remains 1.555635. Moving the key to position 8 changes the dot product to 1.570549; bringing it to the same position as the query gives the raw dot product 1.425. A farther key can receive a "}<strong>{"larger"}</strong>{" score. Position modulates a content-dependent comparison; it is not a mandatory recency penalty."}</Prose>

<Prose>{"What if the already-projected content changes? Select Q or K and one coordinate, then change its value. This is a local intervention on an intermediate vector, not a refit or a recomputation of a shared input map."}</Prose>

<PositionRotaryLab investigation="content" />

<H3>{"A diagonal pattern requires a controlled example"}</H3>

<Prose>{"Does relative geometry make every offset diagonal constant? First repeat exactly the same four-feature content at all four positions, then scale position 1 alone. The complete matrix shows what is conserved and what changes."}</Prose>

<PositionToeplitzLab investigation="scale" />

<Prose>{"A matrix is "}<strong>{"Toeplitz"}</strong>{" when each diagonal is constant. If the same content query appears at every position and the same content key appears at every position, RoPE scores depend only on their offsets, producing such a matrix. With q above repeated four times for both Q and K, the diagonal entries are all 2.42 and first off-diagonal entries are 2.010793."}</Prose>

<Prose>{"Now double the content vector at position 1. Its self-score becomes 9.68; neighboring scores involving it double. Other scores remain unchanged. The matrix is no longer Toeplitz, although every comparison still satisfies the RoPE identity. This is a useful controlled contrast for understanding an attention heatmap."}</Prose>

<Prose>{"A general content change need not be a scalar rescaling. Select any of the four rows and any of its four coordinates; this edits the actual matrix input."}</Prose>

<Prose>For the next coordinate-by-coordinate investigation, return to the original four identical vectors. Edit any row and coordinate independently; this fresh case separates arbitrary content changes from the previous one-row scaling experiment.</Prose>

<PositionToeplitzLab />

<Prose>{"Does increasing distance necessarily lower a score? Switch to one unit pair q=k=[1,0] so the only change is the key’s rotation."}</Prose>

<PositionDistanceLab />

<Prose>{"RoPE also does not make every score decrease monotonically with distance. Concentrate q and k on the first pair as "}<code>{"[1,0]"}</code>{": the score is simply "}<InlineMath>{"\\cos\\Delta"}</InlineMath>{", which falls toward −1 near distance 3 and rises to 0.96017 at distance 6. Frequency mixtures can create useful distance structure, but they do not remove this counterexample. The "}<a href={"https://arxiv.org/html/2104.09864v5#S3"}>{"RoFormer construction"}</a>{" and "}<a href={"https://arxiv.org/html/2306.15595v2#S2"}>{"Position Interpolation analysis"}</a>{" help distinguish the exact rotation identity from assumptions about longer-distance behavior."}</Prose>

<H3>{"Coordinate layout and partial rotation"}</H3>

<Prose>{"The last pictures paired neighbouring coordinates. Could another implementation pair different storage entries without changing the geometry? Trace the four wires and apply the same change of basis to the projection output and returned result."}</Prose>

<PositionBasisDrawing />

<Prose>{"The wire order [0,2,1,3] puts the adjacent pair members into opposite halves. The output must return through the inverse mapping too. Loading unchanged projections but pairing their entries differently computes a different comparison."}</Prose>

<Prose>{"Our implementation pairs adjacent entries "}<code>{"(0,1),(2,3),…"}</code>{". Another valid convention pairs the first half with the second half: "}<code>{"(0,d_k/2),(1,d_k/2+1),…"}</code>{". For four coordinates, the permutation "}<code>{"[0,2,1,3]"}</code>{" converts the adjacent representation into the half-split representation. Permute the projection outputs, frequencies and inverse mapping consistently, and these are two coordinate descriptions of the same operation. Changing the rotation routine while loading unchanged checkpoint weights generally is not equivalent."}</Prose>

<Prose>{"Must every coordinate rotate? The next cutaway divides a four-feature head into a rotating subset and an untouched subset, and shows their separate score contributions."}</Prose>

<PositionPartialLab />

<Prose>{"Some architectures rotate only an even number "}<InlineMath>{"d_r\\leq d_k"}</InlineMath>{" of coordinates. Split q and k into rotary and unrotated portions:"}</Prose>

<div className="neural-equation"><MathBlock>{"(q_m^R)^\\top R_{n-m}k_n^R+(q_m^C)^\\top k_n^C."}</MathBlock></div>

<Prose>{"The content-only term and the relative positional term coexist. State whether frequencies use "}<InlineMath>{"d_r"}</InlineMath>{" or a checkpoint-specific rule; do not silently substitute the model width. We will use this split again in "}<a href={"/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals"}>{"Multi-Head Latent Attention"}</a>{"."}</Prose>

<Prose>{"Values are unrotated in the standard mechanism taught here, because the weights already determine how their content is mixed. Rotating values would define a different architecture and requires explaining how its output coordinates transform. It is not an impossible mathematical operation or proof that every such variant trains poorly."}</Prose>

<H3>Deeper: a rotated linear read is a different operator</H3>

<Prose>Does rotary geometry require softmax? We now change the attention operator while retaining the two-coordinate turn. A feature map is a function applied to each projected Q/K vector. One strictly positive map is ELU(x)+1: it returns x+1 when x≥0 and exp(x) otherwise, coordinate by coordinate. Positive mapped vectors have positive ordinary dot products. For this worked case its outputs are already [1,1]. Two donors carry values 2 and 6 at coordinates 0 and π, with query coordinate 0 and frequency 1 radian per coordinate unit. The noninteger coordinate π makes a half-turn exact; it is not a token-slot fixture.</Prose>

<Prose>Write φ for the query feature map, ψ for the key feature map, and Aₘ for the allowed key indices of query m. Here φ names a function on content, rather than the rotation angle used earlier; the turn remains R. Follow those two input routes in the drawing.</Prose>

<PositionLinearReadDrawing />

<Prose>Follow the two routes. The numerator turns the second key feature to [−1,−1], so its query dot is −2; multiplied by value 6 this contributes −12. The first dot is +2 and contributes +4. The denominator uses the unturned positive features, whose masses are 2 and 2. The result is (4−12)/(2+2)=−2. It lies outside the values’ interval [2,6]: signed coefficients 0.5 and −0.5 neither sum to one nor form probabilities. With no rotations, the ordinary positive-feature read would instead return 4.</Prose>

<Prose>Using those two feature maps and the allowed-key set, the RoFormer paper’s linear variant is</Prose>

<MathBlock>{"y_m=\\frac{\\sum_{n\\in\\mathcal A_m}(R_m\\phi(q_m))^\\top(R_n\\psi(k_n))v_n}{\\sum_{n\\in\\mathcal A_m}\\phi(q_m)^\\top\\psi(k_n)}."}</MathBlock>

<Prose>This is the paper’s separate rotated-numerator, unrotated-denominator choice. Strictly positive maps with at least one legal key give a positive denominator; a map that can output all zeros needs a boundary policy. Rotating the denominator as well can cause cancellation to zero. Keeping it positive prevents that particular cancellation, but does not turn the signed numerator into softmax attention. A causal read includes only the permitted prefix in both sums.</Prose>

<Prose>Why can this avoid a query×key matrix? First collect S=Σ(Rₙψ(kₙ))vₙᵀ, a feature-width×value-width array, and z=Σψ(kₙ), a feature-width vector. A query then uses (Rₘφ(qₘ))ᵀS divided by φ(qₘ)ᵀz. Updating these two summaries per new key gives a causal prefix implementation; recomputing each prefix independently would lose that benefit. Costs are O(L dφ dᵥ) for fixed feature widths rather than pairwise O(L²); large feature widths, cancellation and floating-point conditioning still matter. This reassociation changes neither the chosen operator nor its signed nature. It does not exactly reproduce the exponential softmax kernel in §3.</Prose>

<Prose>The complete program computes the summary from scratch, compares explicit pair sums, and uses ordinary differentiable PyTorch matrix operations for the same function. Its boundary check rejects zero mass, and its gradient checks include the feature-map inputs and values. It accepts already-mapped features; add the map and its derivative in a complete model. The later <a href="/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals">Linear Attention lesson</a> develops feature approximations, recurrent summaries and their model-level evaluation. Read <a href="https://arxiv.org/html/2104.09864v5#S3.SS3">RoFormer §3.3</a> for this particular integration.</Prose>

<CodeBlock language="python" filename="rotary-linear-read.py" downloadUrl="/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/rotary-linear-read.py">{"\"\"\"RoFormer's rotated-numerator / unrotated-denominator linear read.\n\nRequires NumPy and PyTorch. No training or downloaded model.\nRun: python rotary-linear-read.py\nInputs are ALREADY nonnegative feature-map outputs, not raw Q/K.\nThis operator does not compute softmax attention or probability weights.\n\"\"\"\nimport numpy as np\nimport torch\n\n\ndef turn(rows, ids, theta):\n    paired = rows.reshape(len(rows), -1, 2)\n    a = ids[:, None] * theta[None, :]\n    c, s = np.cos(a), np.sin(a)\n    x, y = paired[..., 0], paired[..., 1]\n    return np.stack((x*c-y*s, x*s+y*c), -1).reshape(rows.shape)\n\n\ndef linear_rotary_read(query_features, key_features, values, query_ids, key_ids, theta):\n    q, k, v, m, n, frequency = [np.asarray(a, dtype=np.float64) for a in\n                               (query_features, key_features, values, query_ids, key_ids, theta)]\n    if q.ndim != 2 or k.ndim != 2 or v.ndim != 2 or q.shape[1] != k.shape[1]:\n        raise ValueError('Q/K must be row arrays with the same positive even width; V is a row array.')\n    width = q.shape[1]\n    if not len(q) or not len(k) or width < 2 or width % 2 or not v.shape[1]:\n        raise ValueError('Nonempty rows, values and positive even feature width required.')\n    if len(k) != len(v) or m.shape != (len(q),) or n.shape != (len(k),) or frequency.shape != (width//2,):\n        raise ValueError('Query/key IDs and rotary frequencies must match their arrays.')\n    if not all(np.isfinite(a).all() for a in (q,k,v,m,n,frequency)) or (q<0).any() or (k<0).any():\n        raise ValueError('Finite inputs and nonnegative feature-map outputs required.')\n    rq, rk = turn(q,m,frequency), turn(k,n,frequency)\n    # Key/value summary is width x value-width, rather than query-count x key-count.\n    summary = rk.T @ v\n    key_mass = k.sum(axis=0)\n    denominator = q @ key_mass\n    if (denominator <= 0).any():\n        raise ValueError('Each query needs a strictly positive unrotated normalization mass.')\n    return (rq @ summary) / denominator[:,None]\n\n\ndef ordinary_read(q,k,v,m,n,theta):\n    def rotation(x,ids):\n        pair=x.reshape(len(x),-1,2)\n        a=ids[:,None]*theta[None,:]\n        c,s=a.cos(),a.sin()\n        return torch.stack((pair[...,0]*c-pair[...,1]*s,\n                            pair[...,0]*s+pair[...,1]*c),-1).reshape_as(x)\n    # Ordinary differentiable tensor operations retain the same reassociation.\n    summary=rotation(k,n).transpose(0,1) @ v\n    numerator=rotation(q,m) @ summary\n    denominator=q @ k.sum(dim=0)\n    return numerator/denominator[:,None]\n\n\ndef main():\n    q=np.array([[1.,1.]])\n    k=np.array([[1.,1.],[1.,1.]])\n    v=np.array([[2.],[6.]])\n    m=np.array([0.]); n=np.array([0.,np.pi]); theta=np.array([1.])\n    output=linear_rotary_read(q,k,v,m,n,theta)\n    np.testing.assert_allclose(output,[[-2.]],atol=1e-12)\n    explicit=(turn(q,m,theta) @ turn(k,n,theta).T) @ v/(q @ k.T).sum(axis=1,keepdims=True)\n    np.testing.assert_allclose(output,explicit,atol=1e-12)\n    args=[torch.tensor(a,dtype=torch.float64,requires_grad=i<3) for i,a in enumerate((q,k,v,m,n,theta))]\n    native=ordinary_read(*args)\n    np.testing.assert_allclose(native.detach().numpy(),output,atol=1e-12)\n    native.sum().backward()\n    largest=0.\n    for index in range(3):\n        for cell in np.ndindex(args[index].shape):\n            plus=[a.copy() for a in (q,k,v,m,n,theta)]\n            minus=[a.copy() for a in (q,k,v,m,n,theta)]\n            plus[index][cell]+=1e-5; minus[index][cell]-=1e-5\n            difference=(linear_rotary_read(*plus).sum()-linear_rotary_read(*minus).sum())/2e-5\n            error=abs(difference-args[index].grad[cell].item())\n            largest=max(largest,error)\n            assert error<1e-9\n    # Shift all coordinates together: both numerator rotations cancel their common turn.\n    np.testing.assert_allclose(linear_rotary_read(q,k,v,m+20,n+20,theta),output,atol=1e-12)\n    try:\n        linear_rotary_read(np.zeros_like(q),k,v,m,n,theta)\n    except ValueError:\n        pass\n    else:\n        raise AssertionError('A zero denominator must be rejected.')\n    print('Signed coefficients [0.5, -0.5]; result:',output.ravel().tolist())\n    print('Explicit pairs, ordinary tensor route, common shift and zero-mass boundary passed.')\n    print('All Q/K-feature/V gradients: max central-difference error',largest)\n\n\nif __name__=='__main__':\n    main()\n"}</CodeBlock>

<H2>{"4. ALiBi: express a preference in logit space"}</H2>

<H3>{"A score penalty has a precise probabilistic effect"}</H3>

<Prose>{"RoPE changes the geometry. Can distance instead express a preference directly in the score? A positive slope sets the finite penalty per extra position; an independent rule still forbids future keys. An odds ratio means one legal key’s share divided by another’s."}</Prose>

<Prose>The following four-key questions share current scores, IDs, slope and common offset. The printed table describes the initial case.</Prose>
<PositionCaseReset name="alibi" />
<PositionAlibiLab />

<Prose>{"Read each row across: content score, negative distance bias, their allowed sum and normalized share. Key 0’s stronger content still wins despite its larger penalty. Changing the common content offset moves every summed score equally, so the normalized shares stay unchanged."}</Prose>

<Prose>{"In causal attention, query position "}<InlineMath>{"i"}</InlineMath>{" may read key positions "}<InlineMath>{"j\\leq i"}</InlineMath>{". "}<strong>{"Attention with Linear Biases"}</strong>{", ALiBi, uses"}</Prose>

<div className="neural-equation"><MathBlock>{"s_{ij}=q_i^\\top k_j/\\sqrt{d_k}-a_h(i-j),\\qquad a_h>0."}</MathBlock></div>

<Prose>{"The positive slope "}<InlineMath>{"a_h"}</InlineMath>{" is fixed per head in the original scheme. Future positions remain masked. This finite penalty does not replace a causal or padding mask: it discourages a distant legal key; a mask prohibits a key."}</Prose>

<Prose>{"For two legal keys j and r, softmax gives the exact odds ratio"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{A_{ij}}{A_{ir}}\n=\\exp(c_{ij}-c_{ir})\\exp[-a_h((i-j)-(i-r))],"}</MathBlock></div>

<Prose>{"where "}<InlineMath>{"c"}</InlineMath>{" denotes scaled content scores. If content scores tie, an extra distance "}<InlineMath>{"D"}</InlineMath>{" multiplies the odds by "}<InlineMath>{"e^{-a_hD}"}</InlineMath>{". With "}<InlineMath>{"a_h=0.5,D=10"}</InlineMath>{", the factor is 0.006738, not one-half. The distance that halves these equal-content odds is "}<InlineMath>{"\\ln2/a_h\\approx1.3863"}</InlineMath>{". These are odds between keys; an individual normalized probability also depends on all other keys."}</Prose>

<Prose>{"The logit penalty grows linearly. The induced multiplicative factor in unnormalized attention grows or decays exponentially. That connection makes the name and effect easier to remember."}</Prose>

<H3>{"Content can overcome the preference"}</H3>

<Prose>{"Consider a query in slot 3 and keys in slots 0–3. Suppose their scaled content scores are "}<code>{"[2,0,0,0]"}</code>{". With slope 0.5:"}</Prose>

<NeuralTable caption={"Content can overcome the preference"} headers={[<>{"Key position"}</>,<>{"Distance"}</>,<>{"Content score"}</>,<>{"Bias"}</>,<>{"Final score"}</>,<>{"Final attention weight"}</>]} rows={[[<>{"0"}</>,<>{"3"}</>,<>{"2"}</>,<>{"−1.5"}</>,<>{"0.5"}</>,<>{"0.455054"}</>],[<>{"1"}</>,<>{"2"}</>,<>{"0"}</>,<>{"−1.0"}</>,<>{"−1.0"}</>,<>{"0.101536"}</>],[<>{"2"}</>,<>{"1"}</>,<>{"0"}</>,<>{"−0.5"}</>,<>{"−0.5"}</>,<>{"0.167405"}</>],[<>{"3"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0.276004"}</>]]} />

<Prose>{"Without the bias, key 0 receives 0.711235. The distance penalty weakens its advantage, but it still gets the largest weight. The model can learn content scores that counteract a fixed penalty; the penalty itself does not learn. There is no hard finite attention window in this formula."}</Prose>

<Prose>{"Can we edit any actual key, rather than only the distant one? Select its content score and attached ID. A moved future key is prohibited independently of the finite distance bias."}</Prose>

<PositionAlibiLab investigation="keys" />

<Prose>{"Keep the content competition fixed and move just the query boundary or key 3’s ID; this isolates permission from preference, including a row with no permitted key."}</Prose>

<PositionAlibiLab investigation="permission" />

<Prose>{"Now inspect two shares as an odds ratio while changing another competitor. Select two keys from records 0–2; key 3 stays outside that pair."}</Prose>

<PositionAlibiLab investigation="odds" />

<Prose>{"For a separate variable-count fixture, start again with sequential IDs and initial scores [2,0,0,0]. Adding legal competitors gives another way to test that distinction. The receiver follows the new final ID, which contributes the same cancelling row constant to old keys’ biases."}</Prose>

<PositionAlibiCompetitorLab />

<H3>{"Different slopes, different preferences"}</H3>

<Prose>{"The same distance can mean a stronger or weaker preference in different heads. Choose the head count and follow the actual ordered slope schedule and equal-content odds curves."}</Prose>

<PositionSlopeLab />

<Prose>{"For a power-of-two head count H, the original schedule gives"}</Prose>

<div className="neural-equation"><MathBlock>{"a_h=2^{-8h/H},\\quad h=1,\\ldots,H."}</MathBlock></div>

<Prose>{"With eight heads the slopes are 1/2, 1/4,…, 1/256. With two heads they are 1/16 and 1/256, not 1/2 and 1/256. With sixteen heads the first is "}<InlineMath>{"1/\\sqrt2"}</InlineMath>{". Steeper slopes prefer shorter distances more strongly when content scores are comparable. Head behavior still depends on its learned Q/K features."}</Prose>

<Prose>{"The "}<a href={"https://github.com/ofirpress/attention_with_linear_biases/blob/master/fairseq/models/transformer.py#L693"}>{"author's implementation"}</a>{" extends the schedule to a non-power-of-two count by retaining a lower power-of-two schedule and inserting selected slopes from the doubled schedule. Its three-head result is "}<code>{"[1/16,1/256,1/4]"}</code>{". Preserve that convention when reproducing its checkpoints; a different geometric schedule is a design variation, not a reproduction."}</Prose>

<Prose>{"There is also a useful implementation identity. For one causal row,"}</Prose>

<div className="neural-equation"><MathBlock>{"-a_h(i-j)=a_hj-a_hi."}</MathBlock></div>

<Prose>{"The last term is constant across that row. Softmax ignores a common additive constant, so adding "}<InlineMath>{"a_hj"}</InlineMath>{" alone gives the same probabilities if the legal key set is the same. This permits compact bias construction. It does not mean you can omit the causal mask or forget which entries belong to a packed sequence."}</Prose>

<Prose>{"The "}<a href={"https://arxiv.org/html/2108.12409v2#S3"}>{"ALiBi paper"}</a>{" reports length-extrapolation results in specified language-model experiments. It does not prove that this bias solves every long-range task, that all distant facts remain retrievable or that runtime overhead is identical across kernels."}</Prose>

<H3>{"Bidirectional distance needs a direction decision"}</H3>

<Prose>{"The preceding construction used a directed causal permission boundary. For a bidirectional encoder, what information survives if both directions use absolute distance? Reverse both axes of this four-position bias matrix."}</Prose>

<PositionSymmetricBiasDrawing />

<Prose>{"Corresponding cells agree because |i−j| agrees after reversal. This preserves proximity, but does not say which end is the beginning. It is a symmetric encoder adaptation, not the original causal ALiBi rule."}</Prose>

<Prose>{"For an encoder that can read both directions, one possible adaptation is "}<InlineMath>{"-a_h|i-j|"}</InlineMath>{". It favors proximity on either side. But absolute distance cannot tell left from right. Reverse a sequence of length "}<InlineMath>{"L"}</InlineMath>{": slots i, j become "}<InlineMath>{"L-1-i,L-1-j"}</InlineMath>{", and their absolute distance is unchanged."}</Prose>

<Prose>{"If all other operations are shared per row and the final readout is mean pooling, this symmetric adaptation produces the same prediction for a trajectory and its reversal. The real investigation below demonstrates it. Signed relative buckets, explicitly directed heads, absolute slots or another directional signal can break that symmetry. The original causal ALiBi model already has a directed mask, so this particular reversal argument does not apply to it."}</Prose>

<H2>{"5. Other relative encodings explain the design space"}</H2>

<H3>{"A learned relation vector: Shaw-style attention"}</H3>

<Prose>{"A fixed rotation and a fixed penalty specify their relation in advance. Could training learn what a relation means? Here a signed key-minus-query offset selects one of five learned key vectors and a separate value-message vector; offsets beyond ±2 share the boundary row."}</Prose>

<PositionShawLab />

<Prose>{"The key-relation vector joins the projected key inside a dot product with the query. The value-relation vector joins the message before mixing. The same relation can therefore change matching differently for different queries, and it can supply information through the output message as well."}</Prose>

<Prose>{"An offset can be represented by a trainable vector instead of a fixed rotation or scalar penalty. For query i, key j, set "}<InlineMath>{"r=\\operatorname{clip}(j-i,-k,k)"}</InlineMath>{". A Shaw-style head uses"}</Prose>

<div className="neural-equation"><MathBlock>{"s_{ij}=\\frac{q_i^\\top(k_j+a_r^K)}{\\sqrt{d_k}},\\qquad\ny_i=\\sum_j A_{ij}(v_j+a_r^V)."}</MathBlock></div>

<Prose>{"The score contribution "}<InlineMath>{"q_i^\\top a_r^K"}</InlineMath>{" depends on what the query seeks. With "}<InlineMath>{"q=[2,0]"}</InlineMath>{", relation vector "}<code>{"[0.5,1]"}</code>{" adds 1 to the unscaled dot product. Another query "}<code>{"[0,2]"}</code>{" gets 2 from that same relation. A learned scalar bias cannot express this particular query-dependent distinction on its own."}</Prose>

<Prose>{"Clipping at "}<InlineMath>{"k=2"}</InlineMath>{" assigns offsets −9 and −2 to the same relation category. This saves parameters but deliberately loses their exact distance at this component. There are "}<InlineMath>{"2k+1"}</InlineMath>{" relation vectors per table; the value relation can convey which relation supplied information, beyond just changing the weight. The "}<a href={"https://aclanthology.org/N18-2074.pdf"}>{"original relation-aware attention paper §§3.1–3.3"}</a>{" develops this construction and its efficient decomposition."}</Prose>

<H3>{"A learned scalar by distance bucket: T5-style bias"}</H3>

<Prose>{"What if only a learned scalar preference is needed? Rather than learning a relation vector, T5 assigns relative distances to categories, called buckets, then looks up the category’s scalar score bias."}</Prose>

<PositionBucketLab />

<Prose>{"The near bins preserve single integer distances; later bins cover wider ranges and the final bin saturates. Direction chooses one half of the table. The selected b entry is a trainable scalar, with no fixed sign. Category IDs alone never authorize a future key."}</Prose>

<Prose>{"A simpler mechanism learns one scalar per head and relative-distance bucket, then adds it to the content score. Nearby offsets receive finer categories; large distances share coarser categories. The model learns the preference for each category. Unlike ALiBi, it need not be monotone in distance."}</Prose>

<Prose>{"For the common bidirectional 32-bucket, maximum-distance 128 configuration, divide the buckets by direction. Within one direction, distances 0–7 have exact bins and larger distances enter logarithmically widening bins. Under the "}<a href={"https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/t5/modeling_t5.py#L198"}>{"T5 implementation's key-minus-query convention"}</a>{":"}</Prose>

<NeuralTable caption={"A learned scalar by distance bucket: T5-style bias"} headers={[<>{"Offset "}<InlineMath>{"j-i"}</InlineMath>{""}</>,<>{"−129"}</>,<>{"−128"}</>,<>{"−16"}</>,<>{"−8"}</>,<>{"−7"}</>,<>{"−1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"7"}</>,<>{"8"}</>,<>{"16"}</>,<>{"128"}</>,<>{"129"}</>]} rows={[[<>{"Bucket"}</>,<>{"15"}</>,<>{"15"}</>,<>{"10"}</>,<>{"8"}</>,<>{"7"}</>,<>{"1"}</>,<>{"0"}</>,<>{"17"}</>,<>{"23"}</>,<>{"24"}</>,<>{"26"}</>,<>{"31"}</>,<>{"31"}</>]]} />

<Prose>{"The bucket number is an index, not a magnitude. Bucket 31's learned value might be positive or negative. Positions 128 and 129 sharing a bin means this bias component cannot distinguish those two distances; content and other layers may still distinguish their tokens."}</Prose>

<Prose>{"For distance "}<InlineMath>{"D"}</InlineMath>{" in one direction, with "}<InlineMath>{"B"}</InlineMath>{" available buckets and exact range "}<InlineMath>{"E=B/2"}</InlineMath>{", the large-distance index is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\min\\left(B-1,\\;E+\\left\\lfloor\n\\frac{\\ln(D/E)}{\\ln(D_{\\max}/E)}(B-E)\n\\right\\rfloor\\right)."}</MathBlock></div>

<Prose>{"Use the exact index "}<InlineMath>{"D"}</InlineMath>{" for "}<InlineMath>{"D<E"}</InlineMath>{", and add the direction offset afterward. A causal variant allocates buckets differently because future keys are prohibited. It still needs the causal mask; mapping an illegal future offset to a bucket does not authorize attention to it."}</Prose>

<Prose>{"T5's original attention parameterization also omits the usual explicit "}<InlineMath>{"1/\\sqrt{d_k}"}</InlineMath>{" score scale. A lesson comparing "}<strong>{"bias mechanisms"}</strong>{" may use a common scaled-content convention, but a checkpoint reproduction must match its complete attention rule. “Relative bias” names the position component, not every surrounding implementation detail."}</Prose>

<Prose>{"These methods are alternatives with different expressive choices. There is no historical rule that every later method strictly replaces every earlier one."}</Prose>

<H3>{"Implement both learned relative routes"}</H3>

<Prose>{"How do the lookup, matching and message routes translate into code? In the program below, q and k store positions as rows. The offset array has one query×key entry per comparison. Clipping or bucketing makes integer lookup indices; every repeated index contributes to that same parameter row. The independent allowed array decides which keys enter the normalization."}</Prose>

<Prose>{"The NumPy Shaw operator explicitly computes q·aᴷ and the weighted aⱽ messages. Its temporary relation arrays cost O(Lq Lk d) space; this transparent route is suited to small experiments, while a fused or grouped implementation is needed at large lengths. The ordinary PyTorch route uses nn.Embedding for both relation tables and SDPA for the ordinary value mixture, then adds the relation-value mixture. A float SDPA bias is already in logit units, so the relative key dot is scaled exactly once. Native T5 uses scale=1."}</Prose>

<CodeBlock language="python" filename="relative-position-operators.py" downloadUrl="/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/relative-position-operators.py">{"\"\"\"Transparent Shaw/T5 attention and ordinary PyTorch composition.\n\nRun: python relative-position-operators.py\nRequires NumPy and PyTorch. The fixture is float64, dropout-free, one head.\nRows are sequence positions; relation offset is key ID minus query ID.\nThese small operators teach relative lookup and both gradient routes. They are\nnot optimized kernels: Shaw explicitly materializes Lq x Lk x d relations.\n\"\"\"\nimport math\nimport numpy as np\nimport torch\nfrom torch import nn\nfrom torch.nn import functional as F\n\n\ndef validate_rows(q, k, v, q_ids, k_ids, allowed):\n    q, k, v = (np.asarray(a, dtype=np.float64) for a in (q, k, v))\n    q_ids, k_ids = (np.asarray(a) for a in (q_ids, k_ids))\n    if not all(np.issubdtype(a.dtype, np.integer) for a in (q_ids, k_ids)):\n        raise ValueError('Logical relation IDs must be integers in this discrete fixture.')\n    allowed = np.asarray(allowed, dtype=bool)\n    if (q.ndim != 2 or k.ndim != 2 or v.ndim != 2\n            or not len(q) or not len(k) or not q.shape[1] or not v.shape[1]\n            or q.shape[1] != k.shape[1] or k.shape[0] != v.shape[0]\n            or q_ids.shape != (q.shape[0],) or k_ids.shape != (k.shape[0],)\n            or allowed.shape != (q.shape[0], k.shape[0])\n            or not allowed.any(axis=-1).all()\n            or not all(np.isfinite(a).all() for a in (q, k, v))):\n        raise ValueError('Finite compatible rows, IDs and one legal key per query required.')\n    return q, k, v, q_ids, k_ids, allowed\n\n\ndef stable_weights(scores, allowed):\n    masked = np.where(allowed, scores, -np.inf)\n    exponent = np.exp(masked - masked.max(axis=-1, keepdims=True))\n    return exponent / exponent.sum(axis=-1, keepdims=True)\n\n\ndef shaw_attention(q, k, v, q_ids, k_ids, allowed, key_table, value_table):\n    q, k, v, q_ids, k_ids, allowed = validate_rows(q, k, v, q_ids, k_ids, allowed)\n    key_table, value_table = map(np.asarray, (key_table, value_table))\n    if (key_table.ndim != 2 or key_table.shape[0] % 2 != 1\n            or value_table.shape != (key_table.shape[0], v.shape[1])\n            or key_table.shape[1] != q.shape[1]\n            or not np.isfinite(key_table).all() or not np.isfinite(value_table).all()):\n        raise ValueError('Use matching finite odd-row key/value relation tables.')\n    radius = (key_table.shape[0] - 1) // 2\n    offsets = k_ids[None, :] - q_ids[:, None]\n    indices = np.clip(offsets, -radius, radius) + radius\n    relation_keys, relation_values = key_table[indices], value_table[indices]\n    scores = (q @ k.T + np.einsum('id,ijd->ij', q, relation_keys)) / math.sqrt(q.shape[1])\n    weights = stable_weights(scores, allowed)\n    output = weights @ v + np.einsum('ij,ijv->iv', weights, relation_values)\n    return output, weights, indices\n\n\ndef t5_buckets(offsets, bidirectional=True, buckets=32, max_distance=128):\n    offsets = np.asarray(offsets)\n    if not np.issubdtype(offsets.dtype, np.integer):\n        raise ValueError('T5 bucket offsets must be integers.')\n    if buckets < 4 or buckets % 2 or max_distance <= buckets // 2:\n        raise ValueError('Even bucket count and a larger saturation distance required.')\n    per_direction = buckets // 2 if bidirectional else buckets\n    direction = (offsets > 0).astype(np.int64) * per_direction if bidirectional else 0\n    distance = np.abs(offsets) if bidirectional else np.maximum(-offsets, 0)\n    exact = per_direction // 2\n    # Clamp only the logarithm input: near distances still use their exact bins.\n    large = exact + np.floor(np.log(np.maximum(distance, exact) / exact)\n                             / math.log(max_distance / exact)\n                             * (per_direction - exact)).astype(np.int64)\n    return direction + np.where(distance < exact, distance, np.minimum(large, per_direction - 1))\n\n\ndef t5_attention(q, k, v, q_ids, k_ids, allowed, bias_table, bidirectional=True):\n    q, k, v, q_ids, k_ids, allowed = validate_rows(q, k, v, q_ids, k_ids, allowed)\n    bias_table = np.asarray(bias_table, dtype=np.float64)\n    if bias_table.shape != (32,) or not np.isfinite(bias_table).all():\n        raise ValueError('This fixture uses a finite 32-entry scalar bias table.')\n    indices = t5_buckets(k_ids[None, :] - q_ids[:, None], bidirectional)\n    # Native T5's score scale is 1; it does not divide by sqrt(d).\n    weights = stable_weights(q @ k.T + bias_table[indices], allowed)\n    return weights @ v, weights, indices\n\n\ndef ordinary_shaw(q, k, v, q_ids, k_ids, allowed, key_embedding, value_embedding):\n    radius = (key_embedding.num_embeddings - 1) // 2\n    index = (k_ids[None, :] - q_ids[:, None]).clamp(-radius, radius) + radius\n    a_key, a_value = key_embedding(index), value_embedding(index)\n    scale = 1 / math.sqrt(q.shape[-1])\n    scores = (q @ k.T + torch.einsum('id,ijd->ij', q, a_key)) * scale\n    weights = scores.masked_fill(~allowed, -torch.inf).softmax(-1)\n    # SDPA handles the ordinary V mixture. Its float mask is already a logit bias,\n    # so the relative dot must be scaled once before being placed in the mask.\n    bias = (torch.einsum('id,ijd->ij', q, a_key) * scale).masked_fill(~allowed, -torch.inf)\n    content_output = F.scaled_dot_product_attention(q, k, v, attn_mask=bias,\n                                                   dropout_p=0.0, scale=scale)\n    return content_output + torch.einsum('ij,ijv->iv', weights, a_value), weights, index\n\n\ndef ordinary_t5(q, k, v, q_ids, k_ids, allowed, bias_embedding):\n    indices = torch.as_tensor(t5_buckets((k_ids[None, :] - q_ids[:, None]).numpy()))\n    bias = bias_embedding(indices).squeeze(-1).masked_fill(~allowed, -torch.inf)\n    return F.scaled_dot_product_attention(q, k, v, attn_mask=bias, dropout_p=0.0, scale=1.0)\n\n\ndef central_gradient(fn, array, step=1e-5):\n    result = np.zeros_like(array)\n    for index in np.ndindex(array.shape):\n        original = array[index]\n        array[index] = original + step\n        positive = fn()\n        array[index] = original - step\n        negative = fn()\n        array[index] = original\n        result[index] = (positive - negative) / (2 * step)\n    return result\n\n\ndef main():\n    torch.set_num_threads(1)\n    q = np.array([[2., 0.], [0., 2.]])\n    k = np.array([[1., .5], [-.5, 1.], [.25, -.5]])\n    v = np.array([[2., 0.], [0., 3.], [1., -1.]])\n    q_ids, k_ids = np.array([1, 2]), np.array([0, 1, 3])\n    allowed = k_ids[None, :] <= q_ids[:, None]\n    a_key = np.array([[-.2, .1], [.5, 1.], [0., 0.], [.25, -.5], [.1, .2]])\n    a_value = np.array([[.1, 0.], [0., .2], [0., 0.], [-.1, .3], [.2, -.1]])\n    probe = np.array([[.3, -.7], [1., .2]])\n    tq, tk, tv = [torch.tensor(a, dtype=torch.float64, requires_grad=True) for a in (q, k, v)]\n    key_embedding, value_embedding = [nn.Embedding(5, 2, dtype=torch.float64) for _ in range(2)]\n    with torch.no_grad():\n        key_embedding.weight.copy_(torch.from_numpy(a_key))\n        value_embedding.weight.copy_(torch.from_numpy(a_value))\n    torch_ids = [torch.from_numpy(a) for a in (q_ids, k_ids, allowed)]\n    output, weights, indices = ordinary_shaw(tq, tk, tv, *torch_ids, key_embedding, value_embedding)\n    scratch, scratch_weights, _ = shaw_attention(q, k, v, q_ids, k_ids, allowed, a_key, a_value)\n    np.testing.assert_allclose(output.detach().numpy(), scratch, atol=1e-12, rtol=1e-12)\n    np.testing.assert_allclose(weights.detach().numpy(), scratch_weights, atol=1e-12, rtol=1e-12)\n    (output * torch.from_numpy(probe)).sum().backward()\n    objective = lambda: float((shaw_attention(q, k, v, q_ids, k_ids, allowed, a_key, a_value)[0] * probe).sum())\n    errors = [np.max(np.abs(central_gradient(objective, array) - gradient.detach().numpy()))\n              for array, gradient in ((q, tq.grad), (k, tk.grad), (v, tv.grad),\n                                      (a_key, key_embedding.weight.grad),\n                                      (a_value, value_embedding.weight.grad))]\n    assert max(errors) < 1e-8\n    # Offset -1 repeats: the shared relation row receives both uses' gradients.\n    assert (indices == 1).sum().item() == 2\n    bias = np.linspace(-.4, .4, 32)\n    bias_embedding = nn.Embedding(32, 1, dtype=torch.float64)\n    with torch.no_grad():\n        bias_embedding.weight.copy_(torch.from_numpy(bias[:, None]))\n    for tensor in (tq, tk, tv):\n        tensor.grad = None\n    ordinary = ordinary_t5(tq, tk, tv, *torch_ids, bias_embedding)\n    transparent = t5_attention(q, k, v, q_ids, k_ids, allowed, bias)[0]\n    np.testing.assert_allclose(ordinary.detach().numpy(), transparent, atol=1e-12, rtol=1e-12)\n    (ordinary * torch.from_numpy(probe)).sum().backward()\n    objective = lambda: float((t5_attention(q, k, v, q_ids, k_ids, allowed, bias)[0] * probe).sum())\n    t5_errors = [np.max(np.abs(central_gradient(objective, array) - gradient.detach().numpy()))\n                 for array, gradient in ((q, tq.grad), (k, tk.grad), (v, tv.grad),\n                                         (bias, bias_embedding.weight.grad[:, 0]))]\n    assert max(t5_errors) < 1e-8\n    np.set_printoptions(precision=6)\n    print('Shaw outputs:', scratch)\n    print('T5 outputs:', transparent)\n    print('Maximum Shaw input/table gradient difference:', max(errors))\n    print('Maximum T5 input/table gradient difference:', max(t5_errors))\n    print('Causal future buckets do not replace the independent permission mask.')\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<Prose>{"The printed Shaw outputs are [[1.888386,0.356260],[0.254792,2.811745]] and T5 outputs [[1.907453,0.138821],[0.548091,2.177864]]. Forward mixtures and every Q/K/V/table gradient are checked against central differences. Two legal uses of offset −1 accumulate into the same relation row. Removing the value-relation addition would define a different Shaw operator, even if the matching shares stayed the same."}</Prose>

<H2>{"6. A real investigation: can the model see movement direction?"}</H2>

<H3>{"The data and the question"}</H3>

<Prose>{"Return to the real "}<strong>{"Libras Movement"}</strong>{" trajectories used in the preceding lessons. Each record contains 45 ordered x/y hand-centroid samples and one of 15 movement-type labels. Class 4 is an anticlockwise arc; class 5 is a clockwise arc. These are simplified movement measurements, not complete signed-language sentences or a deployed recognition system."}</Prose>

<Prose>{"The "}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"UCI source and original metadata"}</a>{" are available under CC BY 4.0, credited to Daniel Baptista Dias, Sarajane Marques Peres and Helton Hideraldo Bíscaro. The "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/movement_libras.data"}>{"offline input"}</a>{", "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/movement_libras.names"}>{"original metadata"}</a>{" and "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/data-provenance.md"}>{"provenance record"}</a>{" accompany this lesson. Coordinates lie in 0–1; our model uses the fixed transformation "}<InlineMath>{"2x-1"}</InlineMath>{". Position indices 0–44 describe sample order, not exact elapsed seconds."}</Prose>

<Prose>{"The practical question is: "}<strong>{"does changing direction become visible to the classifier, and how does that depend on the encoding?"}</strong>{" Accuracy on the whole dataset and sensitivity to this particular intervention are different measurements."}</Prose>

<Prose>{"The raw 360 rows contain 30 additional exact duplicates. We retain the first occurrence of each unique 90-coordinate trajectory after checking that duplicate labels agree. A fixed classwise split assigns 220 unique records to training, 50 to validation and 60 to test, with four test records per class. Whole trajectories stay together. The collection describes four performers and two sessions but does not provide reliable per-row identities, so this is a row-level study; it cannot establish performance on a new performer or session. The exact split and duplicate groups are saved with the program's results."}</Prose>

<H3>{"Five controlled models"}</H3>

<Prose>{"Return to the actual 45-point trajectory; its two coordinates differ from the earlier invented content features. Where does each position system enter this trained classifier? Follow fixed coordinate scaling, the biased stem and the one-block computation below."}</Prose>

<PositionMovementArchitectureDrawing />

<Prose>{"The first two real rows happen to coincide. Their printed stem outputs use the saved RoPE model’s actual first three weight rows and biases; the other 21 features and 43 records remain in the calculation. The diagram marks every cutaway. Additive encodings enter before the block; rotary coordinates and distance biases enter the attention branch. The final mean excludes invalid padding rows separately from attention’s key permission."}</Prose>

<Prose>{"Each model has a 2-to-24 coordinate projection, one pre-normalized Transformer block with two heads of width 12 and a 48-wide GELU feedforward layer, final LayerNorm, mean pooling and a 24-to-15 classifier. Q/K/V and output maps have biases. LayerNorm uses epsilon "}<InlineMath>{"10^{-5}"}</InlineMath>{". There is no dropout."}</Prose>

<NeuralTable caption={"Five controlled models"} headers={[<>{"Model"}</>,<>{"Where position enters"}</>]} rows={[[<>{"No-position control"}</>,<>{"Nowhere; every row uses the same operations"}</>],[<>{"Sinusoidal"}</>,<>{"Add the width 24 vector to the coordinate embedding"}</>],[<>{"Learned"}</>,<>{"Add a learned 45 × 24 table row"}</>],[<>{"RoPE"}</>,<>{"Rotate the 12-dimensional Q/K vectors before comparing them"}</>],[<>{"Symmetric ALiBi"}</>,<>{"Add a two-head "}<InlineMath>{"-a_h|i-j|"}</InlineMath>{" proximity bias; no causal mask"}</>]]} />

<Prose>{"All shared tensors have exactly the same seed 101 initialization. The learned table uses its own generator 303, initialized with standard deviation 0.02, so creating it does not change the shared weights. The table adds 1,080 parameters: 6,447 versus 5,367 in each other model. Fixed sinusoidal and RoPE frequencies use base 10000. The ALiBi slopes are 1/16 and 1/256."}</Prose>

<Prose>{"Every model gets 180 full-batch Adam updates with learning rate 0.003 and no weight decay. Select its checkpoint by validation macro-F1, then lower validation cross entropy, then the earliest exact tie. Macro-F 1 averages the 15 classwise F1 scores equally. The test records are evaluated after this selection. This is one predeclared seed with one common training protocol, not a large tuning study or a language-model context-extension experiment."}</Prose>

<Prose>{"The actual CPU results were:"}</Prose>

<NeuralTable caption={"Five controlled models"} headers={[<>{"Encoding"}</>,<>{"Selected epoch"}</>,<>{"Train correct /220"}</>,<>{"Validation correct /50"}</>,<>{"Test correct /60"}</>,<>{"Test macro-F1"}</>,<>{"Test CE, nats/record"}</>]} rows={[[<>{"None"}</>,<>{"107"}</>,<>{"193"}</>,<>{"35"}</>,<>{"33"}</>,<>{"0.528"}</>,<>{"1.287"}</>],[<>{"Sinusoidal"}</>,<>{"154"}</>,<>{"217"}</>,<>{"38"}</>,<>{"42"}</>,<>{"0.689"}</>,<>{"1.039"}</>],[<>{"Learned"}</>,<>{"108"}</>,<>{"220"}</>,<>{"40"}</>,<>{"40"}</>,<>{"0.656"}</>,<>{"1.017"}</>],[<>{"RoPE"}</>,<>{"106"}</>,<>{"203"}</>,<>{"35"}</>,<>{"40"}</>,<>{"0.632"}</>,<>{"1.120"}</>],[<>{"Symmetric ALiBi"}</>,<>{"180"}</>,<>{"218"}</>,<>{"29"}</>,<>{"39"}</>,<>{"0.624"}</>,<>{"1.289"}</>]]} />

<Prose>{"Sinusoidal happens to have the highest test-correct count in this run. That does not establish a universal ranking. The models have different inductive biases, only one seed was run, the learned table changes parameter count, and the common hyperparameters need not suit all methods equally. Keep the table as an observation of this protocol. The sharper result comes from the following symmetry test."}</Prose>

<H3>{"Reverse the path and inspect what changes"}</H3>

<Prose>{"The displayed example is source row 77, chosen beforehand as the first held-out class 4 record in the fixed split. All five selected models classify its original version incorrectly. The example is kept because a real failure can still reveal the mechanism."}</Prose>

<Prose>{"There are two different edits:"}</Prose>

<ol start={1}><li>{""}<strong>{"Move records together."}</strong>{" Reverse the storage/display order of the point records and move each original position ID with its point. The sequence meaning has not changed. Every model's pooled logits stay the same within float32 rounding, with maximum changes below "}<InlineMath>{"1.6\\times10^{-6}"}</InlineMath>{"."}</li><li>{""}<strong>{"Reverse the movement."}</strong>{" Reverse the points but retain slot IDs 0–44. A point formerly attached to the beginning is now attached to the end. This changes the ordered trajectory."}</li></ol>

<Prose>{"For the second edit, the observed largest change among the 15 logits was:"}</Prose>

<NeuralTable caption={"Reverse the path and inspect what changes"} headers={[<>{"Model"}</>,<>{"Maximum absolute logit change"}</>,<>{"Original predicted class → reversed prediction"}</>]} rows={[[<>{"None"}</>,<>{"0.000001"}</>,<>{"5→5"}</>],[<>{"Sinusoidal"}</>,<>{"3.652706"}</>,<>{"9→9"}</>],[<>{"Learned"}</>,<>{"6.880572"}</>,<>{"7→5"}</>],[<>{"RoPE"}</>,<>{"6.110313"}</>,<>{"3→5"}</>],[<>{"Symmetric ALiBi"}</>,<>{"0.000002"}</>,<>{"9→9"}</>]]} />

<Prose>{"The unrounded ALiBi change is "}<InlineMath>{"1.55\\times10^{-6}"}</InlineMath>{", numerical noise around an exact real-arithmetic invariance. Its distance matrix is unchanged by reversal after the corresponding row/column rearrangement, so the same proof as in §1 propagates through the block and mean pool. No amount of ordinary parameter training can break this architectural symmetry while its assumptions remain in place."}</Prose>

<Prose>{"The sinusoidal classifier's predicted class stays 9, but its logits change substantially. Looking only at the largest-probability class would conceal its directional sensitivity. The RoPE model's class 5 probability changes from 0.084402 to 0.969648. That shows the intervention affected its decision; it does not supply a verified label for an artificially edited recording. We do not automatically grade any reversed or hand-edited sample as a newly labeled real example."}</Prose>

<H3>{"A visual workspace that exposes the mechanism"}</H3>

<PositionMovementLabs />

<Prose>{"The coordinate edit is also real computation: reflect frame 23's x coordinate from "}<InlineMath>{"x"}</InlineMath>{" to "}<InlineMath>{"1-x"}</InlineMath>{". On this example it changes the maximum logit by 2.890378 in the no-position model and 3.264872 in symmetric ALiBi. Reversal invariance does not mean these models ignore the coordinates. In the ALiBi run this edit even changes the winning class 9→4; an artificially edited sample still has no newly established ground-truth label."}</Prose>

<Prose>{"As another control, append five padded points at coordinates "}<InlineMath>{"[0.75,0.75]"}</InlineMath>{", assign harmless position IDs 0, and exclude them from attention "}<strong>{"and pooling"}</strong>{". Original valid positions remain 0–44. The original logits are recovered within float32 rounding for all five models. Leaving the pads unmasked changes the computation; for the sinusoidal model the largest logit change is 8.816077. Masking keys alone is not sufficient if the final mean still includes padded query rows."}</Prose>

<Prose>{"No retraining occurs when the learner edits an input. Each investigation evaluates all five saved models on the same controlled input. The outputs are from this small movement classifier. Attention weights are one internal calculation rather than a causal explanation of the whole decision."}</Prose>

<H3>{"Reproduce and investigate further"}</H3>

<Prose>{"Download "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/author-calculations.py"}>{"the complete CPU program"}</a>{", the two original data files and "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/author-results.json"}>{"its recorded results"}</a>{" into one directory. With Python, NumPy, PyTorch and scikit-learn installed, run:"}</Prose>

<CodeBlock language={"bash"}>{"python author-calculations.py"}</CodeBlock>

<Prose>{"The program contains the full data-boundary checks, all five model definitions, training/checkpoint selection, metrics, actual interventions and weight export. It has no hidden notebook state, pretrained download or GPU dependency. The recorded run used Python 3.12.14, NumPy 2.3.5, PyTorch 2.14.0+cpu and scikit-learn 1.9.1, with one CPU thread and deterministic algorithms. Last-digit results can vary with a different numerical environment."}</Prose>

<Prose>{"Read "}<code>{"PositionClassifier.forward"}</code>{" in this order: construct the content rows; add an input position signal when selected; normalize; project Q/K/V; apply RoPE or ALiBi at its own location; mask; mix values; perform the residual/feedforward block; normalize and valid-pool; classify. This is the same Transformer mechanism from the previous lesson with a deliberately isolated positional choice."}</Prose>

<Prose>{"The retained "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/position-models.json"}>{"model/trace evidence"}</a>{" supports the interactive view, while the full training histories are optional reproduction material. The five frozen models evaluate the same edits with their own retained weights. Their compact weights load as the investigation comes into view; this is inference, not browser training."}</Prose>

<H2>{"7. Implement positions and verify cached attention"}</H2>

<H3>{"The cache needs a coordinate system"}</H3>

<Prose>{"The classifier read a complete record; generation reads one new query against stored records. Switch explicitly to a small projected fixture with three key/value records at logical IDs 7, 8 and 9. Physical storage slots are 0, 1 and 2. Keep the legal boundary correct and change only the query’s rotation ID."}</Prose>

<Prose>All cache questions retain the same edited Q/K/V records, logical IDs, rotation, permission, storage order and base. Restore the initial case before checking a printed result.</Prose>
<PositionCaseReset name="cache" />
<PositionCacheLab />

<Prose>{"The left columns separate physical slot and logical ID. The middle stores rotated keys and unrotated values. The right permission column decides legality; the query has its own logical ID, rotation ID and cutoff. Their equality in the correct route is a maintained contract, not a consequence of tensor length."}</Prose>

<Prose>{"A "}<strong>{"KV cache"}</strong>{" stores past keys and values so an autoregressive decoder does not project the same past tokens again at every new step. Standard RoPE implementations often cache the already-rotated keys "}<InlineMath>{"R_nk_n"}</InlineMath>{", with unrotated values. A new query at position "}<InlineMath>{"t"}</InlineMath>{" must use "}<InlineMath>{"R_tq_t"}</InlineMath>{"."}</Prose>

<Prose>{"Imagine a chunk whose real positions are 7, 8, 9. When processing its last token separately, the local query tensor has length 1. Calling "}<code>{"arange(1)"}</code>{" gives position 0, not 9. Its shape is valid, but its relative angles to the cached keys are wrong."}</Prose>

<Prose>{"Track three notions separately:"}</Prose>

<NeuralTable caption={"The cache needs a coordinate system"} headers={[<>{"Quantity"}</>,<>{"Meaning"}</>,<>{"Example"}</>]} rows={[[<>{"Logical position ID"}</>,<>{"The coordinate used by the encoding"}</>,<>{"9"}</>],[<>{"Cache slot"}</>,<>{"Where this key/value is stored"}</>,<>{"Slot 2 in this three-entry toy cache"}</>],[<>{"Valid/causal relation"}</>,<>{"Which stored entries this query may read"}</>,<>{"Positions 7, 8, 9 are legal"}</>]]} />

<Prose>{"In a contiguous cache these may have simple relationships. With left padding, packed documents, sliding windows, evictions or reused prefixes, they can differ. RoPE does not remove the need to maintain those relationships. Learned absolute embeddings also do not intrinsically require a separate position field in every cached vector; implementations track enough metadata for their chosen layout and next position."}</Prose>

<H3>{"A runnable, transparent reference"}</H3>

<Prose>{"This complete program uses NumPy and one head so the geometry and cache contract are visible. It implements sinusoidal features, strict learned lookup, adjacent-pair RoPE, the original ALiBi slope schedule, explicit logical-position causal masking, and a full-versus-cached comparison. It is a correctness reference, not a fused production kernel. The small projected Q/K/V arrays are declared hand fixtures, not claimed learned model activations."}</Prose>

<CodeBlock language={"python"}>{"import math\nimport numpy as np\n\n\ndef sinusoidal(positions, width, base=10000.0):\n    if width < 2 or width % 2:\n        raise ValueError(\"Use an even encoding width of at least two.\")\n    positions = np.asarray(positions, dtype=np.float64)\n    frequencies = base ** (-np.arange(0, width, 2) / width)\n    angles = positions[..., None] * frequencies\n    return np.stack((np.sin(angles), np.cos(angles)), -1).reshape(\n        *positions.shape, width)\n\n\ndef learned_positions(table, positions):\n    positions = np.asarray(positions)\n    if not np.issubdtype(positions.dtype, np.integer):\n        raise ValueError(\"Table positions must be integers.\")\n    if np.any(positions < 0) or np.any(positions >= len(table)):\n        raise ValueError(\"Position is outside the learned table.\")\n    return table[positions]\n\n\ndef rotate(values, positions, base=10000.0):\n    values = np.asarray(values, dtype=np.float64)\n    width = values.shape[-1]\n    if width < 2 or width % 2:\n        raise ValueError(\"Use an even rotary width of at least two.\")\n    angles = np.asarray(positions)[..., None] * base ** (\n        -np.arange(0, width, 2) / width)\n    even, odd = values[..., 0::2], values[..., 1::2]\n    return np.stack((even * np.cos(angles) - odd * np.sin(angles),\n                     even * np.sin(angles) + odd * np.cos(angles)),\n                    -1).reshape(values.shape)\n\n\ndef slopes(head_count):\n    if head_count < 1:\n        raise ValueError(\"A head count must be positive.\")\n    def powers(count):\n        start = 2 ** (-2 ** -(math.log2(count) - 3))\n        return [start ** (index + 1) for index in range(count)]\n    lower = 2 ** int(math.floor(math.log2(head_count)))\n    if lower == head_count:\n        return np.array(powers(lower))\n    return np.array(powers(lower) + powers(2 * lower)[::2][:head_count-lower])\n\n\ndef mix(query, keys, values, query_ids, key_ids, mode, slope=.5):\n    query_ids, key_ids = np.asarray(query_ids), np.asarray(key_ids)\n    scores = query @ keys.T / math.sqrt(query.shape[-1])\n    if mode == \"alibi\":\n        scores -= slope * (query_ids[:, None] - key_ids[None, :])\n    legal = key_ids[None, :] <= query_ids[:, None]\n    if np.any(~legal.any(axis=-1)):\n        raise ValueError(\"Every query needs at least one legal key.\")\n    scores = np.where(legal, scores, -np.inf)\n    weights = np.exp(scores - scores.max(axis=-1, keepdims=True))\n    weights /= weights.sum(axis=-1, keepdims=True)\n    return weights @ values\n\n\nq = np.array([[1, 0, .5, -1], [.5, 1, -1, .25], [2, -.5, .25, 1]])\nk = np.array([[.5, 1, 1, 0], [1, -.5, .5, 1], [-.5, .75, 1, -1]])\nv = np.array([[2, 0], [0, 3], [1, -1]])\npositions = np.array([7, 8, 9])\n\nprint(\"position 1:\", np.round(sinusoidal([1], 8)[0], 3))\nprint(\"three-head slopes:\", slopes(3))\ntable = np.array([[.2, 0], [0, .3], [-.1, .1]])\nprint(\"learned slots 2,0:\", learned_positions(table, [2, 0]))\n\nfor mode in (\"rope\", \"alibi\"):\n    q_used = rotate(q, positions) if mode == \"rope\" else q\n    k_used = rotate(k, positions) if mode == \"rope\" else k\n    full = mix(q_used, k_used, v, positions, positions, mode)\n\n    # Prefill positions 7 and 8, then append a correctly positioned new key.\n    cached_keys, cached_values = k_used[:2].copy(), v[:2].copy()\n    cached_keys = np.concatenate((cached_keys, k_used[2:]), axis=0)\n    cached_values = np.concatenate((cached_values, v[2:]), axis=0)\n    last = mix(q_used[2:], cached_keys, cached_values,\n               positions[2:], positions, mode)\n    print(mode, \"last:\", np.round(last[0], 6),\n          \"matches full:\", np.allclose(last, full[2:], atol=1e-12))\n\n# Keep the legal cache entries fixed, but give the query the wrong RoPE angle.\nwrong = mix(rotate(q[2:], [0]), rotate(k, positions), v,\n            [9], positions, \"rope\")\nprint(\"wrong query angle:\", np.round(wrong[0], 6))"}</CodeBlock>

<Prose>{"Recorded outputs include:"}</Prose>

<CodeBlock language={"text"}>{"position 1: [0.841 0.54  0.1   0.995 0.01  1.    0.001 1.   ]\nthree-head slopes: [0.0625     0.00390625 0.25      ]\nlearned slots 2,0: [[-0.1  0.1]\n                  [ 0.2  0. ]]\nrope last: [1.035332 1.29716 ] matches full: True\nalibi last: [0.340434 2.281648] matches full: True\nwrong query angle: [0.65852  1.291697]"}</CodeBlock>

<Prose>{"For the RoPE last query, the actual weights over positions 7, 8, 9 are approximately "}<code>{"[0.487697,0.452366,0.059937]"}</code>{". With the wrong query angle they become "}<code>{"[0.185156,0.526635,0.288209]"}</code>{". There is no shape error to warn us. Comparing the actual output with a full causal reference catches the bug."}</Prose>

<Prose>{"The transparent program compares prefill plus append with the matching full row. The following questions carry your current edits together. Restore the initial cache case above when you want to isolate one change; next change the permitted key-ID cutoff."}</Prose>

<PositionCacheLab investigation="mask" />

<Prose>{"Next edit any query/key coordinate after projection. This changes content independently from its logical identity. These editors identify the original three source slots 0, 1 and 2, so a selected record remains the same record when the later storage-order control moves it to another displayed physical slot."}</Prose>

<PositionCacheLab investigation="content" />

<Prose>{"Change one stored record’s attached logical ID while keeping its raw key and value fixed. Its rotation and permission follow that ID in the consistent route."}</Prose>

<PositionCacheLab investigation="identity" />

<Prose>{"Change a stored value coordinate without changing matching content; the shares stay fixed and the written mixture changes."}</Prose>

<PositionCacheLab investigation="values" />

<Prose>{"Rearrange complete stored records, or translate every logical coordinate together. Storage permutation preserves matching; a common shift preserves the two fixed relative mechanisms when the permission boundary shifts too."}</Prose>

<PositionCacheLab investigation="storage" />

<PositionCacheLab investigation="shift" />

<Prose>{"For a separate fresh append fixture, restore the original three raw key/value records and correct phase/mask settings below. Append declared raw key/value records. The receiver moves to the new last ID, and all earlier stored IDs remain permitted. Compare the matching full-reference row."}</Prose>

<PositionCacheLengthLab />

<H3>{"Match position geometry to the ordinary attention API"}</H3>

<Prose>{"Repeated lookup IDs are ordinary shared parameters. Before using the API, trace two requests for row 7 and their accumulated derivatives; row 9 receives its own derivative."}</Prose>

<PositionEmbeddingGradientDrawing />

<Prose>{"The "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/position_library_bridge.py"}>{"complete position/API bridge"}</a>{" composes standard adjacent-pair RoPE and ALiBi with PyTorch SDPA. The former transforms Q/K before matching; the latter supplies a floating additive score mask containing both distance penalties and negative infinity on illegal entries. A boolean mask would express legality alone. The program compares direct and API values and gradients for two offset queries reading four cached keys, with explicit positions 7–10 and zero dropout. Run "}<code>{"python position_library_bridge.py"}</code>{" with PyTorch."}</Prose>

<Prose>{"Learned absolute positions take the ordinary "}<code>{"nn.Embedding"}</code>{" route. The same program checks its output against direct table indexing and shows why position ID 7 appearing twice accumulates two gradient contributions into row 7, while unused rows remain unchanged. Fixed sinusoids and prescribed ALiBi slopes have no trainable table unless we deliberately introduce one. The scratch formulas expose the calculation; this bridge composes the same geometry with ordinary attention tools."}</Prose>

<Prose>{"This mapping is for the exact conventions taught here, not blanket parity with every checkpoint's RoPE. Half-split pairing, partial rotation, changed bases and context scaling are explicit different transformations in §§3/8. For a checkpoint, use its configuration and code; a shared name does not authorize substituting adjacent-pair rotation."}</Prose>

<Prose>{""}<strong>{"Change the constraint:"}</strong>{" add 100 to both query and key IDs, preserving their legal relation, then add 100 only to queries. "}<strong>{"Hint:"}</strong>{" standard RoPE and ALiBi depend on relative position within this fixed-input operator. "}<strong>{"Solution:"}</strong>{" the common shift leaves scores/outputs unchanged up to rounding; a query-only shift changes offsets and can change outputs. Compare the actual values, not merely whether the final argmax stays the same."}</Prose>

<H3>{"Padding, packed records and numerical precision"}</H3>

<Prose>{"Cache coordinates may differ from storage even without a rotary bug. Left padding changes where valid counting begins; packed documents need an independent cross-document permission boundary."}</Prose>

<PositionPackingDrawing />

<Prose>{"In the upper rows, validity says which entries are real. Cumulative valid counting supplies IDs 0,1,2 after two left pads; × entries must not become permitted padding keys. In the lower matrix, each document’s causal triangle is isolated. Restarting the IDs without that mask would still permit cross-document reads."}</Prose>

<Prose>{"For a left-padded batch, a common logical-position construction is "}<code>{"valid.cumsum(-1)-1"}</code>{", assigning the first valid token position 0. Replace padding indices with a safe value before table lookup, then exclude those entries with the mask. Whether this convention matches a specific checkpoint depends on its training and generation implementation. A uniform position shift cancels locally in standard RoPE when all relevant content and masks are held fixed; arbitrary per-token renumbering does not. Additive learned/sinusoidal vectors generally change under even a common shift."}</Prose>

<Prose>{"When independent documents are packed into one tensor, resetting their position IDs is not enough. A document/block mask must prevent an example from attending to another example. Otherwise equal position IDs do not stop information leakage. Likewise, a key-padding mask often suppresses padded keys but does not automatically erase padded query outputs; exclude those outputs from losses or pooling as appropriate."}</Prose>

<Prose>{"Compute phases at adequate precision. Adjacent large integers can become the same number if converted too early to a low-precision format. For example, BF16 cannot represent every integer beyond 256. Constructing all positions directly in BF16 can therefore give neighboring tokens identical phases before sine/cosine is evaluated. A common implementation calculates phases in float32 and casts the resulting sine/cosine values as needed; our small reference uses float64. Neither floating-point choice provides arbitrary precision at unlimited positions. Validate the actual target range, checkpoint convention and kernel."}</Prose>

<Prose>{"Standard PyTorch Transformer layers do not automatically choose a positional scheme. Use the model's actual embedding/attention implementation and versioned documentation rather than assuming "}<code>{"nn.TransformerEncoder"}</code>{" inserts RoPE or sinusoidal features for you. The real program above makes the injection site explicit; production implementations may fuse the same operation without materializing the intermediate arrays."}</Prose>

<H2>{"8. Deeper route: extending the context without confusing the claims"}</H2>

<H3>{"Three different length questions"}</H3>

<Prose>{"“This model supports a longer context” can mean several things:"}</Prose>

<ol start={1}><li>{""}<strong>{"The operation is defined."}</strong>{" The position lookup/rotation, mask and cache accept that length."}</li><li>{""}<strong>{"The model remains useful."}</strong>{" Loss and downstream quality stay acceptable on the new distribution."}</li><li>{""}<strong>{"The model uses the additional information."}</strong>{" It can retrieve or combine evidence far away, rather than ignoring most of the added context."}</li></ol>

<Prose>{"An ALiBi penalty is defined at arbitrarily large finite distances in real arithmetic, but grows without a finite bound as distance increases. A sine/rotation formula is also defined beyond training indices. Neither is a theorem about the model's behavior on a longer task. The softmax denominator sees more competitors, content distributions change, and long-range computations may require skills the training examples never demanded."}</Prose>

<Prose>{"Even good average language-model loss can hide a failure on an instruction that needs one distant fact. A long-context evaluation should vary both total length and evidence location, include distractors and multiple pieces of evidence, inspect short-context retention, and measure the task that matters. A single successful “needle in a haystack” example does not establish long-document reasoning. The "}<a href={"https://arxiv.org/pdf/2305.19466"}>{"NoPE study"}</a>{" is useful here because it evaluates several algorithmic tasks and separates them from perplexity claims."}</Prose>

<H3>{"Frequency, wavelength and the base"}</H3>

<Prose>{"The cache used one fixed frequency set. Before changing it for longer inputs, what does a base change actually stretch? Compare the fastest and slowest pairs at width 64, with numerical frequencies and wavelength rulers."}</Prose>

<PositionFrequencyDrawing />

<Prose>{"The first pair’s two rulers coincide. The last pair’s changed-base ruler is much longer. Each panel has its own wavelength scale for the two bases, and the printed values identify its units; these are geometry calculations rather than performance measurements."}</Prose>

<Prose>{"For "}<InlineMath>{"d_k=64"}</InlineMath>{", base 10000 gives first frequency 1 and last frequency "}<InlineMath>{"10000^{-31/32}\\approx0.00013335"}</InlineMath>{". The first wavelength is "}<InlineMath>{"2\\pi\\approx6.2832"}</InlineMath>{" positions; the last is 47,117.243."}</Prose>

<Prose>{"Changing the base to 500000 leaves the first frequency exactly 1. For pair "}<InlineMath>{"r"}</InlineMath>{" it multiplies the wavelength by"}</Prose>

<div className="neural-equation"><MathBlock>{"\\left(\\frac{500000}{10000}\\right)^{2r/64}=50^{r/32}."}</MathBlock></div>

<Prose>{"The last wavelength becomes 2,084,764.773, about 44.25 times as long. It is not 50 times for every pair, and the first pair does not change at all. At position 128,000, a 47,117-position wavelength has completed about 2.72 turns, not 20. One channel wrapping is not the same as the entire multiscale code becoming identical, nor must every channel remain monotone over the whole context."}</Prose>



<Prose>{"The base and rotary dimension are checkpoint/architecture choices. There is no universal formula such as “base equals 60 times the target length.” A suitable choice depends on learned Q/K features, training lengths, positional scaling and task. The "}<a href={"https://arxiv.org/html/2407.21783v3#S3.S2"}>{"Llama 3 report"}</a>{" records a 500000 base; its "}<a href={"https://arxiv.org/html/2407.21783v3#S3.S4.SS2"}>{"long-context training section"}</a>{" also describes staged long-sequence training. The resulting capability was not created by editing a configuration field after an otherwise unchanged short-context training run."}</Prose>

<H3>{"Position Interpolation"}</H3>

<Prose>{"Instead of changing the base, can more positions fit inside the original phase interval? Compress the new coordinate rail by a declared factor; the last target coordinate and adjacent spacing are shown live."}</Prose>

<PositionInterpolationLab />

<Prose>{"At factor 4, the target ends at slot 255 and its mapped coordinate is 63.75. The original integer slots ended at 63: fitting inside an interval does not make fractional positions or changed neighbour spacing an old training condition."}</Prose>

<Prose>{"Let a model be trained with nominal context "}<InlineMath>{"L"}</InlineMath>{", and choose a target "}<InlineMath>{"L'=sL"}</InlineMath>{". "}<strong>{"Position Interpolation"}</strong>{", PI, feeds "}<InlineMath>{"t/s"}</InlineMath>{" into the same rotation formula:"}</Prose>

<div className="neural-equation"><MathBlock>{"R_t\\quad\\longrightarrow\\quad R_{t/s}."}</MathBlock></div>

<Prose>{"Equivalently, divide all angular frequencies by "}<InlineMath>{"s"}</InlineMath>{". Distances are compressed too: two new positions 8 slots apart have the old phase difference of 1 slot when "}<InlineMath>{"s=8"}</InlineMath>{". This moves a large range of offsets into a smaller phase range, but also changes local distinctions."}</Prose>

<Prose>{"For training length 64 and target 256, "}<InlineMath>{"s=4"}</InlineMath>{". Position 255 maps to 63.75, not 63. The interval "}<code>{"[0,256)"}</code>{" maps into "}<code>{"[0,64)"}</code>{", but the model was trained at integer positions 0–63; fractional positions and altered token spacing are a new input condition. Endpoint-preserving scaling "}<InlineMath>{"t(63/255)"}</InlineMath>{" is another possible rule, with slightly different spacing. Name which rule you use."}</Prose>

<Prose>{"The "}<a href={"https://arxiv.org/html/2306.15595v2#S2.SS3"}>{"PI paper §2.3"}</a>{" gives the rescaling and a bounded interpolation analysis for a fixed trigonometric score function. Its model experiments include further training. A bound on a fixed score function is not an end-to-end guarantee about hidden states, all softmax competitors or task correctness. Uniform rescaling can work well in a particular protocol, but it is not free of a short-distance tradeoff."}</Prose>

<H3>{"Base scaling, often called NTK-aware scaling"}</H3>

<Prose>{"Uniform compression changes every pair. What if we preserve the fastest pair and stretch slower pairs progressively? In the next comparison, Original, PI and Base-scaled see the same pair index and relative offset. We introduce the fourth rule, YaRN, after explaining its ramp."}</Prose>

<PositionCaseReset name="extension" />
<PositionExtensionLab investigation="base" />

<Prose>{"One proposed alternative for rotary width "}<InlineMath>{"d"}</InlineMath>{" greater than 2 changes the base to"}</Prose>

<div className="neural-equation"><MathBlock>{"b'=b\\,s^{d/(d-2)}."}</MathBlock></div>

<Prose>{"Pairr then has"}</Prose>

<div className="neural-equation"><MathBlock>{"\\theta'_r=\\theta_r\\,s^{-2r/(d-2)}."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"r=0"}</InlineMath>{" there is no change. At the last pair "}<InlineMath>{"r=d/2-1"}</InlineMath>{", the frequency is divided by "}<InlineMath>{"s"}</InlineMath>{". Intermediate pairs receive intermediate scaling. This preserves the fastest phase changes while stretching the slowest wavelengths. The "}<InlineMath>{"d=2"}</InlineMath>{" formula is undefined and must not be applied blindly."}</Prose>

<Prose>{"The name refers to the reasoning that motivated the heuristic; it does not constitute a proof that any pretrained network behaves like its infinite-width neural tangent kernel or that this base change is optimal. The "}<a href={"https://arxiv.org/html/2309.00071v3#S3"}>{"YaRN paper's methodology and appendices"}</a>{" explain the relationship among PI, base changes and later interpolation schemes."}</Prose>

<H3>{"YaRN: select frequencies and adjust score sharpness"}</H3>

<Prose>{"Base scaling distributes the change continuously. Could we instead leave well-cycled pairs alone and interpolate pairs that saw few turns? The cyan curve below weights unchanged frequency by its rotation count; the violet curve shows the distinct pinned library index ramp."}</Prose>

<PositionYarnRampDrawing />

<Prose>{"At height 1 the original frequency is retained; at height 0 it is divided by the extension factor. The paper computes that weight from turns during the original context. The implementation locates integer correction indices and interpolates over pair index instead. Both intend fast unchanged and slow interpolated endpoints, but their middle weights differ."}</Prose>

<Prose>{"Uniform interpolation changes every frequency; a base change changes most frequencies by different amounts. A "}<strong>{"by-parts"}</strong>{" construction instead asks how many turns each pair made within the original context:"}</Prose>

<div className="neural-equation"><MathBlock>{"r_i=\\frac{L\\theta_i}{2\\pi}=\\frac{L}{\\lambda_i}."}</MathBlock></div>

<Prose>{"Under the paper's linear ramp in this rotation count, let"}</Prose>

<div className="neural-equation"><MathBlock>{"\\gamma(r)=\\operatorname{clip}\\left(\\frac{r-\\alpha}{\\beta-\\alpha},0,1\\right),\n\\qquad\n\\widetilde\\theta_i=(1-\\gamma(r_i))\\frac{\\theta_i}{s}+\\gamma(r_i)\\theta_i."}</MathBlock></div>

<Prose>{"Pairs with few turns are fully interpolated; pairs with many turns remain unchanged; the middle blends the two. The paper uses "}<InlineMath>{"\\alpha=1,\\beta=32"}</InlineMath>{" in its Llama experiments. These are thresholds in "}<strong>{"rotations during the original context"}</strong>{", not raw feature indices or universal constants."}</Prose>

<Prose>{"Now the paper ramp has been defined: compare its computed phase with Original, PI and Base-scaled for the same pair and offset."}</Prose>

<PositionExtensionLab />

<Prose>{"YaRN combines this frequency treatment with an empirical attention-temperature adjustment. If softmax originally sees "}<InlineMath>{"q'^\\top k'/\\sqrt d"}</InlineMath>{", dividing this logit by temperature "}<InlineMath>{"T"}</InlineMath>{" makes it sharper when "}<InlineMath>{"T<1"}</InlineMath>{". Scaling "}<strong>{"both"}</strong>{" q and k by "}<InlineMath>{"c=\\sqrt{1/T}"}</InlineMath>{" has the same effect because the dot product scales by "}<InlineMath>{"c^2"}</InlineMath>{". The paper's suggested fit is"}</Prose>

<div className="neural-equation"><MathBlock>{"c=1+0.1\\ln s,\\qquad\\text{logit multiplier}=c^2."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"s=8"}</InlineMath>{", "}<InlineMath>{"c\\approx1.207944"}</InlineMath>{", so logits are multiplied by about 1.459129. Multiplying them by "}<InlineMath>{"\\sqrt{1+0.1\\ln s}"}</InlineMath>{" is a different rule. The temperature fit is an empirical recipe, not a conservation law that exactly compensates every longer softmax."}</Prose>

<Prose>{"The full mechanism therefore changes both relative phases and attention sharpness. In partial-rotation implementations, scaling only the rotary subset does not multiply the entire dot product uniformly. Check whether the attention scale is applied separately and how unrotated channels are treated."}</Prose>

<Prose>{"The displayed frequency comparison uses the "}<strong>{"paper's ramp in rotation count"}</strong>{". Practical checkpoint libraries can discretize the boundary indices and use a ramp over pair indices, giving a different intermediate curve. A label such as “YaRN” is not enough to reproduce every checkpoint: use its versioned implementation, parameter names, rotary width and scaling factors. "}<a href={"https://huggingface.co/docs/transformers/main/en/internal/rope_utils"}>{"Current Transformers RoPE documentation"}</a>{" distinguishes several schemes and per-layer configurations; its "}<code>{"main"}</code>{" documentation is mutable, so pin the version when reproducing a model."}</Prose>

<Prose>{"The frequency comparison is separate from score sharpness. For this next local competition, start with the fixed logits [2,0,−1] so only sharpness changes. Both Q and K are multiplied by c, so the complete logits scale by c² before softmax. The extension factor is shared with the frequency comparisons; changing it retains the selected pair and offset for the subsequent geometry investigation."}</Prose>

<PositionExtensionLab investigation="temperature" />

<Prose>{"The changed geometry still depends on content. Select and edit either already-projected pair below; its four rule-specific dot products are printed independently."}</Prose>

<PositionExtensionLab investigation="content" />

<H3>{"Dynamic scaling and cached representations"}</H3>

<Prose>{"The preceding rules used one frequency set for every compared vector. What breaks if the new query uses a new base but stored keys keep the old one? Return to the declared three-record cache and compare both routes."}</Prose>

<PositionCacheLab investigation="base" />

<Prose>{"The actual route changes the query base and keeps stored keys at base 10000. The reference reconstructs the same fixed raw keys with the new base. That is a one-layer geometry repair, not a reconstruction of earlier hidden states and values."}</Prose>

<Prose>{"A dynamic rule can change frequencies as the current length grows. That raises a consistency problem: old keys might have been rotated with yesterday's frequency vector while the new query uses today's."}</Prose>

<Prose>{"For fixed content keys in one attention layer, you can store unrotated keys or rephase existing keys from the old rotation into the new one. In the hand fixture from §7, changing the base from 10000 to 100 and rotating only the new query gives last output "}<code>{"[0.973912,1.389528]"}</code>{"; recomputing all Q/K rotations consistently at the new base gives "}<code>{"[0.998788,1.344242]"}</code>{"."}</Prose>

<Prose>{"There is a further model-level distinction. In a multilayer decoder, cached hidden states and values may themselves have been computed under the old frequencies. Rephasing keys alone does not generally reproduce a fresh full-prefix pass through "}<strong>{"every layer"}</strong>{" at the new fixed frequency rule. Define the intended dynamic algorithm, maintain internally consistent cache metadata and compare against the appropriate reference. If exact equivalence to a fresh pass under a new global configuration is required, earlier states may need recomputation. A “cache fix” must state what equivalence it promises."}</Prose>

<H3>{"XPos: a relative amplitude factor as well as a rotation"}</H3>

<Prose>{"A rotation preserves length. Could a position-dependent length change add a relative attenuation? Below, each pair uses an amplitude base ζ; the first pair uses ζ=2/7 and a scale of 512 positions. Reciprocal query/key amplitudes act on normally rotated vectors; query-minus-key gap and a common shift are separate choices."}</Prose>

<PositionXposLab />

<Prose>{"The arrows isolate amplitude using a common scale; the ordinary rotation still acts separately. Query and key lengths individually change, but multiplying their opposite exponents keeps only their relative gap. A 512-position causal gap gives the first pair a 2/7 amplitude product."}</Prose>

<Prose>{"XPos extends the geometry using reciprocal query/key scaling. In a real-coordinate form, for each pair "}<InlineMath>{"i"}</InlineMath>{" choose "}<InlineMath>{"0<\\zeta_i<1"}</InlineMath>{" and a positive scale "}<InlineMath>{"S"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"q'_m=\\zeta_i^{m/S}R_mq_m,\\qquad\nk'_n=\\zeta_i^{-n/S}R_nk_n."}</MathBlock></div>

<Prose>{"The pair's score becomes"}</Prose>

<div className="neural-equation"><MathBlock>{"\\zeta_i^{(m-n)/S}\\,q_m^\\top R_{n-m}k_n."}</MathBlock></div>

<Prose>{"For a causal key "}<InlineMath>{"n\\le m"}</InlineMath>{", the amplitude factor attenuates older contributions. The query/key norms individually are no longer preserved. Scaling both vectors in the same direction would produce an unwanted absolute-position factor instead of this relative factor."}</Prose>

<Prose>{"The "}<a href={"https://github.com/microsoft/torchscale/blob/main/torchscale/component/xpos_relative_position.py"}>{"TorchScale XPos implementation"}</a>{" uses a pair scale equivalent to "}<InlineMath>{"\\zeta_i=(2i/d+0.4)/1.4"}</InlineMath>{", default "}<InlineMath>{"S=512"}</InlineMath>{", a centered exponent and reciprocal scaling for keys. For the first pair, "}<InlineMath>{"\\zeta_0=2/7"}</InlineMath>{", so a 512-position causal separation multiplies that pair's score amplitude by 2/7. Higher-frequency pairs have smaller "}<InlineMath>{"\\zeta"}</InlineMath>{" under this rule. Omitting the division by "}<InlineMath>{"S"}</InlineMath>{" would instead apply "}<InlineMath>{"(2/7)^{512}"}</InlineMath>{", an entirely different and numerically extreme factor."}</Prose>

<Prose>{"The centering choice can improve numerical range while preserving a common relative factor when handled consistently. It also belongs in the cache convention. The "}<a href={"https://arxiv.org/pdf/2212.10554"}>{"XPos/LEX paper"}</a>{" separately studies its encoding and blockwise masking; partial rotary dimensions alone are not “XPos.” A fixed amplitude decay also does not establish monotonicity of every content-dependent signed score."}</Prose>



<H3>{"Current frequency rules and what their search actually learns"}</H3>

<Prose>{"The extension formulas tell us how to alter phase coordinates. How do checkpoint-specific rules choose the amount? Llama 3.1 chooses three wavelength bands; LongRoPE can apply one searched factor per pair. These are different policies, not a new softmax."}</Prose>

<PositionCurrentFrequencyDrawing />

<Prose>{"For the original Llama 3.1 settings, factor s=8 and original length 8192, wavelengths below 2048 remain unchanged, those above 8192 use θ/8, and the middle interpolates. Its blend is u=(8192/λ−1)/3 and θ′=(1−u)θ/8+uθ. LongRoPE applies θᵢ/fᵢ using a selected factor vector f; these factors are distinct from wavelengths λ; its paper search may retain an initial unscaled prefix. The pinned HF short/long-factor utility is only the frequency-application component, not the evolutionary search or fine-tuning pipeline."}</Prose>

<Prose>{"The complete program below calculates every frequency rule and applies it to real vector arrays. Its ordinary route calls Transformers 5.17.0 utilities for linear, YaRN, LongRoPE and Llama 3.1, then uses PyTorch complex multiplication for the same adjacent-pair rotation. The library float32 frequency construction and NumPy float64 reference are compared with an explicit rounding bound; output and input derivatives are checked separately. No pretrained model is downloaded."}</Prose>

<CodeBlock language="python" filename="rotary-frequency-rules.py" downloadUrl="/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/rotary-frequency-rules.py">{"\"\"\"Small frequency operators and version-pinned Transformers comparisons.\n\nRequires numpy, torch, transformers==5.17.0. No model download or training.\nRun: python rotary-frequency-rules.py\nFrequency is radians per position; a rotary pair has two real coordinates.\n\"\"\"\nimport math\nimport numpy as np\nimport torch\nimport transformers\nfrom transformers import LlamaConfig\nfrom transformers.modeling_rope_utils import ROPE_INIT_FUNCTIONS\n\n\ndef original_frequencies(width, base):\n    if not isinstance(width, int) or width < 2 or width % 2 or not math.isfinite(base) or base <= 1:\n        raise ValueError('A finite base >1 and positive even rotary width are required.')\n    return base ** (-np.arange(width // 2, dtype=np.float64) * 2 / width)\n\n\ndef extension_rules(width=64, base=10000., original_length=4096, factor=8.):\n    if width <= 2 or original_length < 2 or not math.isfinite(factor) or factor < 1:\n        raise ValueError('Base scaling needs width>2, length>=2 and a finite factor>=1.')\n    theta = original_frequencies(width, base)\n    turns = original_length * theta / (2 * math.pi)\n    paper_weight = np.clip((turns - 1) / 31, 0, 1)\n    # The pinned library finds pair-index boundaries using the chosen turn counts.\n    correction = lambda rotations: width * math.log(original_length / (rotations * 2 * math.pi)) / (2 * math.log(base))\n    low = max(math.floor(correction(32)), 0)\n    high = min(math.ceil(correction(1)), width - 1)\n    library_weight = 1 - np.clip((np.arange(width // 2) - low) / max(high - low, .001), 0, 1)\n    return {\n        'original': theta,\n        'linear': theta / factor,\n        'base-scaled': original_frequencies(width, base * factor ** (width / (width - 2))),\n        'paper-yarn': theta * (paper_weight + (1 - paper_weight) / factor),\n        'yarn': theta * (library_weight + (1 - library_weight) / factor),\n    }, 1 + .1 * math.log(factor)\n\n\ndef llama31_frequencies(width=64, base=500000., original_length=8192, factor=8., low=1., high=4.):\n    if not (0 < low < high) or factor < 1 or original_length < 2:\n        raise ValueError('Positive ordered band thresholds, factor>=1 and length>=2 required.')\n    theta = original_frequencies(width, base)\n    wavelength = 2 * math.pi / theta\n    smooth = (original_length / wavelength - low) / (high - low)\n    blended = (1 - smooth) * theta / factor + smooth * theta\n    return np.where(wavelength < original_length / high, theta,\n                    np.where(wavelength > original_length / low, theta / factor, blended))\n\n\ndef longrope_frequencies(width, base, factors):\n    theta = original_frequencies(width, base)\n    factors = np.asarray(factors, dtype=np.float64)\n    if factors.shape != theta.shape or not np.isfinite(factors).all() or (factors <= 0).any():\n        raise ValueError('One finite positive factor per rotary pair is required.')\n    return theta / factors\n\n\ndef rotate_adjacent(values, positions, theta):\n    values = np.asarray(values, dtype=np.float64)\n    positions = np.asarray(positions, dtype=np.float64)\n    theta = np.asarray(theta, dtype=np.float64)\n    if values.ndim < 1 or values.shape[-1] != 2 * len(theta):\n        raise ValueError('The final vector axis must contain exactly two coordinates per frequency.')\n    if not all(np.isfinite(a).all() for a in (values, positions, theta)):\n        raise ValueError('Finite vectors, coordinates and frequencies required.')\n    angle = positions[..., None] * theta\n    even, odd = values[..., 0::2], values[..., 1::2]\n    return np.stack((even * np.cos(angle) - odd * np.sin(angle),\n                     even * np.sin(angle) + odd * np.cos(angle)), -1).reshape(values.shape)\n\n\ndef ordinary_rotation(values, positions, theta):\n    # Complex multiplication represents the very same two-coordinate rotation.\n    # float64 storage is viewed as complex128; contiguous is needed by view_as_complex.\n    paired = values.reshape(*values.shape[:-1], -1, 2).contiguous()\n    complex_values = torch.view_as_complex(paired)\n    angle = positions[..., None] * theta\n    phase = torch.polar(torch.ones_like(angle), angle)\n    return torch.view_as_real(complex_values * phase).reshape_as(values)\n\n\ndef native_frequencies(kind, width, base, original_length, factor, **extra):\n    # This program pins an actual API contract, not a mutable main-branch example.\n    parameters = dict(rope_type=kind, rope_theta=base, factor=factor, **extra)\n    if kind != 'linear':\n        parameters['original_max_position_embeddings'] = original_length\n    # Llama's band validation requires an original context smaller than the target.\n    target_length = int(original_length * factor)\n    if kind == 'llama3' and target_length == original_length:\n        target_length += 1\n    config = LlamaConfig(hidden_size=width * 2, num_attention_heads=2,\n                         max_position_embeddings=target_length,\n                         rope_parameters=parameters)\n    return ROPE_INIT_FUNCTIONS[kind](config, device=torch.device('cpu'),\n                                    seq_len=int(original_length * factor))\n\n\ndef main():\n    if transformers.__version__ != '5.17.0':\n        raise RuntimeError('Use transformers==5.17.0 for these pinned utility comparisons.')\n    torch.set_num_threads(1)\n    reports = []\n    for width, base, length, factor in [(8, 10000., 64, 4.),\n                                        (64, 10000., 4096, 8.),\n                                        (64, 500000., 8192, 1.),\n                                        (128, 500000., 8192, 8.)]:\n        rules, multiplier = extension_rules(width, base, length, factor)\n        for kind in ('linear', 'yarn'):\n            native, scale = native_frequencies(kind, width, base, length, factor)\n            error = float(np.max(np.abs(native.double().numpy() - rules[kind])))\n            # The official utility uses float32 powers; our reference uses float64.\n            np.testing.assert_allclose(native.double().numpy(), rules[kind], rtol=2e-6, atol=1e-8)\n            assert math.isclose(scale, multiplier if kind == 'yarn' else 1., rel_tol=1e-12)\n            reports.append((width, kind, error))\n        local = llama31_frequencies(width, base, length, factor)\n        native, _ = native_frequencies('llama3', width, base, length, factor,\n                                      low_freq_factor=1., high_freq_factor=4.)\n        np.testing.assert_allclose(native.double().numpy(), local, rtol=2e-6, atol=1e-8)\n        reports.append((width, 'llama3', float(np.max(np.abs(native.double().numpy() - local)))))\n        long = np.linspace(1., factor, width // 2)\n        native, _ = native_frequencies('longrope', width, base, length, factor,\n                                      short_factor=np.ones(width // 2).tolist(), long_factor=long.tolist())\n        expected = longrope_frequencies(width, base, long if factor > 1 else np.ones(width // 2))\n        np.testing.assert_allclose(native.double().numpy(), expected, rtol=2e-6, atol=1e-8)\n        reports.append((width, 'longrope', float(np.max(np.abs(native.double().numpy() - expected)))))\n        positions = np.array([0., 3., 255.])\n        vectors = np.arange(3 * width, dtype=np.float64).reshape(3, width) / 19 - 1\n        tensor = torch.tensor(vectors, dtype=torch.float64, requires_grad=True)\n        result = ordinary_rotation(tensor, torch.from_numpy(positions), torch.from_numpy(local))\n        transparent = rotate_adjacent(vectors, positions, local)\n        np.testing.assert_allclose(result.detach().numpy(), transparent, atol=1e-12, rtol=1e-12)\n        # For a fixed angle, inverse rotation maps an output derivative to the input.\n        probe = torch.linspace(-.5, .5, 3 * width, dtype=torch.float64).reshape(3, width)\n        (result * probe).sum().backward()\n        reference_grad = rotate_adjacent(probe.numpy(), -positions, local)\n        np.testing.assert_allclose(tensor.grad.numpy(), reference_grad, atol=1e-12, rtol=1e-12)\n    print('Transformers version:', transformers.__version__)\n    print('16 frequency comparisons; max absolute float32/float64 difference:', max(r[2] for r in reports))\n    print('Four complete rotation/output/input-gradient comparisons passed.')\n    print('These checks exercise frequency operators; no model quality or full LongRoPE search is measured.')\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<H3>{"A better objective can change a frequency search"}</H3>

<Prose>Read <a href="https://arxiv.org/abs/2402.13753">LongRoPE</a> for the nonuniform factor search and progressive adaptation, and <a href="https://arxiv.org/html/2502.20082v1">LongRoPE2</a> for retrieval-targeted search and mixed short/long training. The following picture isolates their search objective; it does not measure this small lesson’s model quality.</Prose>

<Prose>{"A correct frequency operator is not a chosen model configuration. What should a search measure? LongRoPE2 contrasts ordinary all-token average loss with loss on answer tokens that require retrieving distant evidence, then trains short and long segments with different frequency policies."}</Prose>

<PositionLongRopeResearchDrawing />

<Prose>{"The upper six token losses are constructed arithmetic, not reported benchmark observations. Their all-token mean is 3.2/6≈0.533333, while the answer-only mean is 2.4: easy surrounding text can hide the hard dependency. Needle perplexity exponentiates the selected answer-token mean cross entropy. The method searches a critical pair-index split, applying base scaling to lower-index pairs and monotonically constrained factors to the higher-index group. It ranks candidates by needle-target loss on a fixed retrieval set. This targeted objective can still miss broader reasoning, so evaluate other long-context tasks and short-context retention too."}</Prose>

<Prose>{"The authors propose undertraining of slower pairs as a hypothesis about model behaviour; it does not change the mathematical sine period 2π/θ. After search, short documents use original frequencies with document-isolated attention, while long segments use searched frequencies and adaptation of the same model weights. That complete search/training/evaluation recipe is larger than applying a factor vector. Those responsibilities are described by the original papers and the later Long Context lesson."}</Prose>

<H2>{"9. Choose the position system for the actual task"}</H2>

<H3>{"What changes, and what stays expensive?"}</H3>

<Prose>{"The mechanisms differ, but does supplying position shrink the stored messages? Draw the actual cache axes first: key rotation changes coordinates in place, while reducing the number of stored key/value heads is a separate architectural choice."}</Prose>

<PositionCacheMemoryDrawing />

<NeuralTable caption={"What changes, and what stays expensive?"} headers={[<>{"Mechanism"}</>,<>{"Position parameters"}</>,<>{"Main injection site"}</>,<>{"A question to ask before using it"}</>]} rows={[[<>{"Learned absolute"}</>,<>{""}<InlineMath>{"L_{\\max}d"}</InlineMath>{""}</>,<>{"Input rows"}</>,<>{"Are supported indices and training coverage adequate?"}</>],[<>{"Sinusoidal absolute"}</>,<>{"None"}</>,<>{"Input rows"}</>,<>{"Does the model learn to use this multiscale signal on the relevant lengths?"}</>],[<>{"Shaw-style relative vectors"}</>,<>{"Depends on clipped offset range, width and sharing"}</>,<>{"Query-dependent scores and optionally values"}</>,<>{"Which offsets can share a category without losing needed distinctions?"}</>],[<>{"T5-style scalar buckets"}</>,<>{"Buckets×heads per shared table"}</>,<>{"Scores"}</>,<>{"How much distance/direction precision should the bins preserve?"}</>],[<>{"Standard RoPE"}</>,<>{"None for fixed frequencies"}</>,<>{"Q/K coordinates"}</>,<>{"Which basis, rotary width, frequencies and cache offsets does the model expect?"}</>],[<>{"ALiBi"}</>,<>{"None for fixed slopes"}</>,<>{"Scores"}</>,<>{"Is the chosen directional/proximity prior appropriate for the task and mask?"}</>]]} />

<Prose>{"For a new small model, a simple learned or sinusoidal baseline is useful if its position semantics match the problem. For a pretrained model, preserve its specified scheme first. A frequency change, table extension or bias replacement changes the function the checkpoint computes; it is not a cosmetic implementation substitution."}</Prose>

<Prose>{"RoPE adds work linear in the number of rotated coordinates. Full attention still computes pairwise scores, with "}<InlineMath>{"O(NHL^2d_k)"}</InlineMath>{" attention arithmetic and an "}<InlineMath>{"L^2"}</InlineMath>{" score/probability array if implemented eagerly. A tiled attention kernel can avoid storing the full matrix while calculating the same attention function, within floating-point differences. Positional encoding itself does not make full attention linear in sequence length."}</Prose>

<Prose>{"ALiBi can be generated from position vectors and head slopes. A naive implementation materializes an H × L × L bias; a compatible kernel can compute needed entries or use the causal row-constant identity. Thus “ALiBi requires an extra dense matrix” and “ALiBi is free everywhere” are both implementation-dependent claims. Report actual shapes and measured performance if making a speed comparison."}</Prose>

<Prose>{"With full rotary width and matching query/key widths, standard RoPE does not reduce KV-cache dimensions. For N batch items, D_blk layers, Hkv cached heads, length "}<InlineMath>{"L"}</InlineMath>{" and head widths "}<InlineMath>{"d_k,d_v"}</InlineMath>{", unquantized cache storage is"}</Prose>

<div className="neural-equation"><MathBlock>{"ND_{\\mathrm{blk}}H_{kv}L(d_k+d_v)\\times\\text{bytes per stored element}."}</MathBlock></div>

<Prose>{"An example N=1, D_blk=32, Hkv=8, L=4096, dk=dv=128 with two-byte elements needs 536,870,912 bytes, or 512 MiB, for those K/V tensors. Rotating keys changes their values, not this count. Quantization scales/metadata, padding allocation and other runtime state add their own storage. The "}<strong>{"next"}</strong>{" lesson, "}<a href={"/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals"}>{"Grouped-Query and Multi-Query Attention"}</a>{", changes "}<InlineMath>{"H_{kv}"}</InlineMath>{" and explains the actual sharing computation. RoPE can apply once to each stored key head and separately to each query head, provided corresponding frequency/basis conventions match. Reducing stored heads is a different mechanism from supplying position."}</Prose>

<H3>{"Useful applications beyond words in a sentence"}</H3>

<Prose>{"The last example used ordinal sample IDs. Which coordinates should another task carry? Compare actual elapsed time with array order, then follow a real two-row patch grid before assigning its x/y coordinate pairs."}</Prose>

<PositionTaskCoordinatesDrawing />

<Prose>{"The first rows distinguish seconds 0,1,20 from ordinal slots 0,1,2; a frequency in radians per second must convert with its unit. In the patch grid, flattened neighbours 2 and 3 have spatial change (−2,+1), not a one-step horizontal move. Independent spatial pairs can preserve that actual geometry; a video adds time bands."}</Prose>

<Prose>{""}<strong>{"Movement, irregular time and event streams."}</strong>{" An ordinal sample index measures order. An actual timestamp measures elapsed time. If one sensor records events at 0, 1 and 20 seconds, assigning positions 0, 1, 2 hides the nineteen-second gap. A continuous position formula can accept "}<code>{"[0,1,20]"}</code>{", but its frequency units are now radians per second and must suit that scale. A measurement system may need both event order and elapsed time; an additive learned lookup can instead encode a finite time-bin category. In our Libras example, only sample order was supplied reliably, so the lesson does not relabel slot differences as exact seconds."}</Prose>

<Prose>{""}<strong>{"Images and video."}</strong>{" Rasterizing a patch grid into one long list creates accidental one-dimensional neighbors: the last patch of one row and first patch of the next have consecutive flattened indices. A two-dimensional encoding can represent row and column separately. One construction allocates coordinate pairs to x and y, applying phases "}<InlineMath>{"x\\theta_i"}</InlineMath>{" in one subset and "}<InlineMath>{"y\\theta_j"}</InlineMath>{" in another. Their score contributions depend on "}<InlineMath>{"\\Delta x"}</InlineMath>{" and "}<InlineMath>{"\\Delta y"}</InlineMath>{", not just a flattened offset. A video can add temporal coordinates. A position design must decide how special tokens, different resolutions and multiple frames share these coordinates. The later "}<a href={"/learn/path/full-curriculum/vision-transformers-vit-deit-swin-dinov2?module=deep-learning-fundamentals"}>{"Vision Transformers lesson"}</a>{" develops patch grids, learned-grid interpolation and relative window geometry."}</Prose>

<Prose>How do separate image axes become actual rotary coordinates? Keep the patch grid from the preceding picture and add a second frame. A six-feature teaching head gives one pair to time, one to height and one to width; each pair keeps its own frequency. This is an explicit smaller construction, not a checkpoint reproduction.</Prose>

<PositionMultiaxisDrawing />

<Prose>Read the selected patch records as (t,h,w). The next array assigns tθ₀ to the temporal pair, hθ₁ to the height pair and wθ₂ to the width pair. Only Q/K are turned. Their complete dot product adds the three pair contributions, with relative differences Δt, Δh and Δw. Patches at the same spatial position in two frames share spatial phases while their temporal phase differs. A row-boundary neighbour changes height and width, even if its flattened storage ID changes by only one.</Prose>

<Prose><a href="https://arxiv.org/html/2409.12191v2">Qwen2-VL’s MRoPE</a> uses this coordinate-band idea at checkpoint scale. Its <a href="https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/qwen2_vl/modeling_qwen2_vl.py">pinned implementation</a> chooses temporal/height/width frequency bands of sizes 16/24/24, recomposes the cosine/sine arrays, and repeats them for a 128-feature half-split rotary basis. Those sizes count frequencies, not complete two-coordinate widths. Text gives equal IDs on all three axes, reducing to ordinary one-dimensional RoPE; an image holds its temporal ID constant; video varies it by frame. A new modality begins after the preceding maximum position ID. Special-token alignment, spatial merging and how different resolutions allocate IDs are additional model rules. Correct pair rotations alone do not implement its visual encoder or training pipeline.</Prose>

<Prose>{""}<strong>{"Coordinates versus identities."}</strong>{" In a set of physical objects, rearranging the storage order should not change a prediction if each object's actual coordinates move with it. In a sentence, swapping words while retaining their slots should change the represented sentence. This is the same distinction as our movement workspace. Choosing position IDs deliberately can preserve the symmetry you want and break the symmetry the task must distinguish."}</Prose>

<Prose>{"These examples explain why there is no universal “best position vector.” Start with the relation the learner or application needs—absolute slot, signed distance, elapsed time, two-dimensional displacement—and trace where that relation enters the function."}</Prose>



<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice: change the situation, then explain the result"}</H2>

<Prose>{"Try the questions before opening hints or solutions. Exercises 1–4 check the core route; 5–8 extend it. No pretrained download or long training run is needed."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Two rearrangements"}</H3>

<Prose>{"An encoder receives points A, B, C with position IDs 0, 1, 2 and uses learned absolute input embeddings, no dropout and mean pooling. Compare (a) storing the records in order C, A, B with their IDs 2, 0, 1, and (b) assigning points C, A, B to IDs 0, 1, 2. Which output is guaranteed to equal the original? Explain at the input to the first block."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the three content-plus-position vectors before and after each edit. Check whether you merely permuted existing rows."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"In (a), the combined rows are "}<code>{"[xC+p2,xA+p0,xB+p1]"}</code>{", a permutation of "}<code>{"[xA+p0,xB+p1,xC+p2]"}</code>{". The equivariant encoder followed by mean pooling produces the same output. In (b), they are "}<code>{"[xC+p0,xA+p1,xB+p2]"}</code>{"; generally these are different vectors, so equality is not guaranteed. The model can still happen to predict the same class in (b), but the architectural guarantee concerns the full output function and applies to (a)."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A different rotary pair"}</H3>

<Prose>{"Use one pair with frequency 1, query q="}<code>{"[1,0]"}</code>{" at position 2 and key k="}<code>{"[0,1]"}</code>{" at position 5. Compute the unscaled dot product after rotation. Then shift both positions by 20. Finally move only the key one further position. Does the score necessarily decrease?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<InlineMath>{"q^\\top R_{n-m}k"}</InlineMath>{", and work out "}<InlineMath>{"R_\\phi[0,1]"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{""}<InlineMath>{"R_\\phi[0,1]=[-\\sin\\phi,\\cos\\phi]"}</InlineMath>{". The original score is "}<InlineMath>{"-\\sin3\\approx-0.141120"}</InlineMath>{". Shifting both positions to 22 and 25 leaves offset 3 and the score unchanged. Moving only the key to 6 gives offset 4 and score "}<InlineMath>{"-\\sin4\\approx0.756802"}</InlineMath>{", which is larger. RoPE encodes a relative phase; it does not require scores to fall with distance. If these are two-dimensional attention logits, divide the dot products by "}<InlineMath>{"\\sqrt2"}</InlineMath>{" before softmax."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. How much evidence overcomes the bias?"}</H3>

<Prose>{"A causal head uses ALiBi slope 0.25. Key A is 8 positions farther from the query than key B. How much larger must A's scaled content score be to tie B's final score? With equal content scores, what are their attention odds? Does that answer depend on how many other legal keys exist?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Subtract the final scores. Their difference controls the ratio of softmax probabilities."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A needs an extra "}<InlineMath>{"0.25\\times8=2"}</InlineMath>{" content-logit units to tie. With equal content scores, "}<InlineMath>{"A_A/A_B=e^{-2}\\approx0.135335"}</InlineMath>{". Other keys change both normalized probabilities but cancel from their ratio. Neither probability itself is 0.135335 unless the remaining normalization happens to make that so. A finite penalty does not prohibit A."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Construct and repair a cache bug"}</H3>

<Prose>{"In the three-key reference example, shift the key positions from "}<code>{"[7,8,9]"}</code>{" to "}<code>{"[0,1,2]"}</code>{" and the last query's position from 9 to 2, retaining the same content vectors and legal order. Run it and compare the last RoPE output with the original. Now return to the original key positions and reset "}<strong>{"only"}</strong>{" the last query's rotation to 0 while retaining key rotations for "}<code>{"[7,8,9]"}</code>{" and the original allowed-key mask. Explain why the two edits have different results. How would you separately expose a wrongly offset causal mask?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"A common shift preserves all pairwise offsets. The query's rotary angle and its legal-key relation are separate inputs in this transparent program."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The common shift preserves offsets, so the last output remains approximately "}<code>{"[1.035332,1.297160]"}</code>{". Resetting only the query's angle changes those offsets and gives "}<code>{"[0.658520,1.291697]"}</code>{". The latter experiment keeps the legal entries fixed to isolate the rotation error. To expose a mask error, keep rotations correct but use a local query index 0 to construct legality against key IDs 7–9: this falsely masks every key, and the reference must reject that empty legal set. In a full decoder, use both correct logical IDs and the correct valid/document relation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Design a directional encoder"}</H3>

<Prose>{"A model uses "}<InlineMath>{"-a|i-j|"}</InlineMath>{", shared rowwise blocks and mean pooling. You want it to distinguish a list from its reversal. Propose one change that can remove the symmetry and one change that cannot. Explain why increasing the number of identical-structure layers does not solve the issue by itself."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Check whether the entire pipeline commutes with the reversal permutation. Changing parameter values cannot break an equality that holds for all parameter values."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Adding distinct absolute position vectors, using signed relative categories with independently learned values, or introducing an appropriate directional mask can remove reversal symmetry. Increasing width or adding more shared blocks with the same symmetric-distance rule cannot: each block remains reversal-equivariant, and mean pooling remains invariant. Removing the symmetry creates the capacity to distinguish directions; it does not guarantee successful training or correct predictions on all movements. If order should be irrelevant in the application, breaking it may be undesirable."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A stretching rule is not a performance curve"}</H3>

<Prose>{"A width 8 RoPE head uses base 10000 and extends nominal length 64 to 256 by PI. Find the four original frequencies, the four new frequencies, the mapped value of position 255 and the original wavelength of the slowest pair. What happens under "}<InlineMath>{"s=1"}</InlineMath>{"? What evidence would still be missing before claiming good 256-token task performance?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<InlineMath>{"\\theta_r=10000^{-2r/8}"}</InlineMath>{", divide by 4 for PI, and calculate a full turn as "}<InlineMath>{"2\\pi/\\theta_r"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Original frequencies are "}<code>{"[1,0.1,0.01,0.001]"}</code>{"; PI gives "}<code>{"[0.25,0.025,0.0025,0.00025]"}</code>{". Position 255 maps to 63.75. The slowest original wavelength is "}<InlineMath>{"2000\\pi\\approx6283.1853"}</InlineMath>{" positions. With "}<InlineMath>{"s=1"}</InlineMath>{" the frequencies and positions are unchanged; a YaRN-style score multiplier also becomes 1. These calculations establish the geometric transformation. They provide no actual loss, retrieval or reasoning result from a trained model at length 256. That requires a declared evaluation protocol, representative held-out examples and controls for retained short-context behavior."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. A partial-rotation temperature trap"}</H3>

<Prose>{"An attention score has rotary contribution 2 and unrotated contribution 3, before the common head-width scaling. A developer multiplies only the rotary Q/K coordinates by "}<InlineMath>{"c=2"}</InlineMath>{" and claims to multiply the entire logit by 4. What actually happens? Give a way to achieve the claimed uniform factor."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each rotary dot product receives two factors of "}<InlineMath>{"c"}</InlineMath>{", but the unrotated dot product receives neither."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The original unscaled score is 2+3=5. Scaling only rotary coordinates gives "}<InlineMath>{"4\\times2+3=11"}</InlineMath>{", not 20. To get a uniform factor 4, multiply the completed dot-product score by 4, or scale "}<strong>{"all"}</strong>{" query and key coordinates by 2. The usual head-width division can remain separate. This is why matching a context-extension checkpoint requires its attention-scale placement as well as its frequency vector."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. A time unit changes the meaning"}</H3>

<Prose>{"A sensor produces three observations at 0, 1 and 20 seconds. A sinusoidal time encoding uses frequency 0.1 radians/second. Another programmer passes timestamps in milliseconds without changing the frequency. Calculate the phase of the last observation under each program. Give the correct frequency in radians/millisecond and explain why index positions 0, 1, 2 solve a different problem."}</Prose>

<details><summary>Hint</summary>

<Prose>{"An angle is timestamp multiplied by frequency. Convert both quantities consistently."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The intended phase is "}<InlineMath>{"20\\times0.1=2"}</InlineMath>{" radians. Passing 20,000 milliseconds with unchanged 0.1 gives 2000 radians. The corresponding frequency is 0.0001 radians/millisecond, restoring phase 2. Index positions 0, 1, 2 retain event order but discard the unequal temporal gaps. Neither is universally wrong: choose the coordinate whose relation matters, then state its units."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"What comes next?"}</H2>

<Prose>{"You can now locate position at the input, in Q/K geometry or in score biases; distinguish invariance from sensitivity; and verify that a cached computation uses the intended offsets. Continue in the planned sequence to "}<a href={"/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals"}>{"Grouped-Query Attention and Multi-Query Attention"}</a>{". That lesson asks how several query heads can share keys and values, and what this changes in cache storage and computation. Its position operations build directly on the conventions here."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"References and another way to learn"}</H2>

<Prose>{"Use these selectively according to the part you want to understand better. Formula definitions, our independently calculated fixtures and the real local experiment serve different purposes."}</Prose>

<ul><li><strong>A second course treatment:</strong> <a href="https://web.stanford.edu/class/cs224n/slides/cs224n-spr2024-lecture08-transformers.pdf">Stanford CS224N 2024, Lecture 8</a> connects positional representations to the complete Transformer. Compare its notation with the row-based arrays here.</li><li><strong>Current extension operators and search:</strong> <a href="https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/modeling_rope_utils.py">Transformers 5.17.0 frequency utilities</a> supplies the exact linear, YaRN, Llama 3.1 and LongRoPE operators used in the runnable comparison. <a href="https://arxiv.org/abs/2402.13753">LongRoPE</a> and <a href="https://arxiv.org/html/2502.20082v1">LongRoPE2</a> teach the additional search, adaptation and evaluation responsibilities.</li><li>{""}<strong>{"A visual refresher before the positional details:"}</strong>{" "}<a href={"https://www.3blue1brown.com/lessons/attention/"}>{"3Blue1Brown, Attention in transformers, step-by-step"}</a>{" includes its video and illustrated written adaptation. Its Q/K, dot-product, softmax and masking explanations help reconnect geometry to value mixing. Its diagrams use query columns rather than this lesson's query rows, which the notes explain. The adjective/noun behavior is explicitly hypothetical; this is a background attention resource, not a RoPE implementation tutorial. The written adaptation offers the same illustrated route alongside the video."}</li><li>{""}<strong>{"A compact comparison with diagrams:"}</strong>{" "}<a href={"https://sebastianraschka.com/faq/docs/rope-vs-absolute-positional-embeddings.html"}>{"Sebastian Raschka, RoPE versus absolute positional embeddings"}</a>{". The article traces the input-table versus Q/K-rotation distinction, partial RoPE and cache offsets. Use it after §3 for another concise explanation; follow this lesson's examples for the detailed calculations."}</li><li>{""}<strong>{"A book/notebook route:"}</strong>{" "}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/self-attention-and-positional-encoding.html"}>{"Dive into Deep Learning §11.6"}</a>{", especially 11.6.3–11.6.5. Its code, frequency visuals, absolute/relative subsections and exercises provide a second path through sinusoidal encodings. Its CNN/RNN comparison connects to earlier architecture lessons. A binary-counter analogy is about scales, not a claim that floating-point encodings always use fewer physical bits."}</li><li>{""}<strong>{"Learned position tables inside a complete GPT:"}</strong>{" "}<a href={"https://www.youtube.com/watch?v=kCc8FmEb1nY"}>{"Andrej Karpathy's Let's build GPT video"}</a>{", linked from the "}<a href={"https://karpathy.ai/zero-to-hero.html"}>{"creator's Zero to Hero course"}</a>{", is a longer code-first learning option. The "}<a href={"https://github.com/karpathy/nanoGPT/blob/master/model.py"}>{"nanoGPT implementation"}</a>{" shows "}<code>{"wpe"}</code>{", strict context checks and addition to token embeddings inside a real decoder. The same author’s code is a useful companion to the video. This option teaches the learned-input mechanism and surrounding model, not the RoPE/ALiBi extensions."}</li><li>{""}<strong>{"Original fixed encoding:"}</strong>{" "}<a href={"https://arxiv.org/pdf/1706.03762"}>{"Vaswani et al., Attention Is All You Need, §3.5"}</a>{". Read for the position formula, original comparison and the motivation behind its relative-shift identity."}</li><li>{""}<strong>{"Learned relations and buckets:"}</strong>{" "}<a href={"https://aclanthology.org/N18-2074.pdf"}>{"Shaw et al., §§3.1–3.3"}</a>{" defines relation vectors and their score/value roles; "}<a href={"https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/t5/modeling_t5.py"}>{"T5's maintained attention source"}</a>{" makes signed bucket conventions and cache offsets concrete. Code on a moving branch must be version-pinned for reproduction."}</li><li>{""}<strong>{"Rotary geometry:"}</strong>{" "}<a href={"https://arxiv.org/html/2104.09864v5"}>{"Su et al., RoFormer §§2–3"}</a>{" derives the rotation construction. Read its claims about distance behavior together with the explicit counterexample here and the "}<a href={"https://arxiv.org/html/2306.15595v2"}>{"PI analysis §2"}</a>{". A geometric identity and a broad empirical tendency are different statements."}</li><li>{""}<strong>{"Linear bias:"}</strong>{" "}<a href={"https://arxiv.org/html/2108.12409v2"}>{"Press et al., ALiBi §§2–3"}</a>{" supplies the causal mechanism and comparison context; the "}<a href={"https://github.com/ofirpress/attention_with_linear_biases/blob/master/fairseq/models/transformer.py"}>{"author's implementation"}</a>{" supplies the non-power-of-two schedule and row-constant optimization."}</li><li>{""}<strong>{"Extending a trained model:"}</strong>{" "}<a href={"https://arxiv.org/html/2306.15595v2"}>{"Position Interpolation"}</a>{", "}<a href={"https://arxiv.org/html/2309.00071v3"}>{"YaRN §§3–4 and appendices"}</a>{", and "}<a href={"https://arxiv.org/html/2407.21783v3#S3.S4.SS2"}>{"the Llama 3 training report §3.4.2"}</a>{". Use their methods, training and evaluation sections to separate frequency changes from the complete adaptation recipe. The reported results apply to their stated training and evaluation protocols."}</li><li>{""}<strong>{"Further geometric and evaluation depth:"}</strong>{" "}<a href={"https://arxiv.org/pdf/2212.10554"}>{"XPos/LEX"}</a>{" and its "}<a href={"https://github.com/microsoft/torchscale/blob/main/torchscale/component/xpos_relative_position.py"}>{"TorchScale code"}</a>{" explain reciprocal amplitude factors; "}<a href={"https://arxiv.org/pdf/2305.19466"}>{"Kazemnejad et al."}</a>{" tests length generalization in decoder-only models and motivates the causal NoPE distinction. The full appendix proof campaign is optional research depth, not required to start the next lesson."}</li><li>{""}<strong>{"Implementation reference:"}</strong>{" "}<a href={"https://huggingface.co/docs/transformers/main/en/internal/rope_utils"}>{"Transformers RoPE utilities"}</a>{" documents named variants and layer-specific configuration. Consult the version matching your model; changing a field is not proof of extended-context quality."}</li><li>{""}<strong>{"Real data and reproduction:"}</strong>{" "}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"UCI Libras Movement"}</a>{", "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/data-provenance.md"}>{"our provenance"}</a>{", "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/author-calculations.py"}>{"complete training program"}</a>{", "}<a href={"/learn-code/positional-encodings-sinusoidal-learned-rope-alibi/mechanism-calculations.py"}>{"independent mechanism calculations"}</a>{". These support the actual observations and editable examples in this lesson."}</li></ul></section>
  </div></PositionCaseProvider>,
};
