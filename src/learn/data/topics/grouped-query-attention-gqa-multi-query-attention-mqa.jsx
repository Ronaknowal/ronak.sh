import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { GqaLessonProvider, GqaGroupingInvestigation, GqaProjectedInvestigation, GqaRoutingInvestigation, GqaReadResults, GqaPermissionInvestigation, GqaRecordInvestigation, GqaBudgetInvestigation, GqaAmdahlInvestigation, GqaConversionInvestigation, GqaSharedGradientInvestigation, GqaAffineFoldingInvestigation, GqaForecastZone, GqaForecastInvestigation, GqaForecastResults, GqaForecastHeadInvestigation, GqaForecastAnatomy } from '../../components/lesson-labs/GroupedQueryFlowLabs.jsx';
import { GqaProjectionDrawing, GqaOpeningReadDrawing, GqaCacheContentsDrawing, GqaPromptAvailabilityDrawing, GqaConstructedMemoryDrawing, GqaOutputMapDrawing, GqaGroupedLayoutDrawing, GqaCompactAppendDrawing, GqaContinuationHistoryDrawing, GqaPublishedTradeoffDrawing, GqaPhysicalReplicationDrawing, GqaCacheOwnershipDrawing, GqaAffineFoldingDrawing } from '../../components/lesson-labs/GroupedQueryFlowFigures.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/neural-lesson-neutral.css';
const lesson = { title: 'Grouped-Query Attention (GQA) & Multi-Query Attention (MQA)', readTime: '~65 min read + 90 min practice', content: () => <div className="gqa-lesson lesson-flow neural-lesson neural-lesson-neutral"><GqaLessonProvider>

<Prose opening="exploration">Move one quantity after it has been explained and follow its effect through the picture. Related questions retain your edits. Later, compare three actual saved forecasters on the same hand movement, inspect their internal reads and generate their next points.</Prose>
<Prose>A model has seen a hand move through several positions. To guess the next position, it needs to read the history. Different readers may look for different clues in that same history. Must every reader keep its own copy of the information?</Prose>
<Prose>The <a href="/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals">Self-Attention lesson</a> showed how one numerical question matches stored descriptions and mixes their information. <a href="/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals">Transformer Block Architecture</a> put those reads inside a complete network; <a href="/learn/path/full-curriculum/positional-encodings-sinusoidal-learned-rope-alibi?module=deep-learning-fundamentals">Positional Encodings</a> explained attached positions. We will recover the small attention calculation first, then share its stored descriptions without forcing its readers to ask the same question.</Prose>
<Prose opening="route">The core route follows one read, several readers, a compact cache, implementation and a real conversion study in §§1–6. The visible deeper route in §7 develops gradients, representational limits, alternative conversion and deployment. The nine independent exercises transfer these ideas to changed dimensions, masks and models.</Prose>
<H2>{"1. The growing memory behind one prediction"}</H2>
<H3>{"What information does one reader actually use?"}</H3>
<Prose>{"Start with two deliberately constructed feature rows, [1,0] and [0,1]. A feature is simply one numerical coordinate describing an input. These tiny rows let us show every operation; they are not the learned hand-movement features we will use later. A projection is a matrix multiplication that makes a new numerical description. Three separate maps make a query (the current question), a key (a description used for matching) and a value (the information a match will write)."}</Prose>
<Prose>{"Cyan outlines identify supplied inputs, amber outlines identify learned maps, and violet outlines identify computed quantities. Inside number grids, amber fill means positive, blue fill means negative, and an unfilled cell is zero. Arrows connect the actual fields that participate in each calculation. In this constructed example, the query and key maps are identities; the value map has a different second row."}</Prose>
<GqaProjectionDrawing/>
<Prose>{"Follow the last input row [0,1]. Multiplying by the identity query map keeps its current question [0,1]. The two key rows are [1,0] and [0,1]. The value map instead produces [1,1] for the first input and [1,−1] for the second. The maps are drawn in output-coordinate-by-input-coordinate orientation, so each map row computes one dot product with the input. Biases are zero here; ordinary learned maps may also add a bias."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"q_t=W_Qx_t,\\quad k_j=W_Kx_j,\\quad v_j=W_Vx_j.\\qquad W_V=\\begin{bmatrix}1&1\\\\1&-1\\end{bmatrix}."}</MathBlock></div>
<H3>{"How does the question choose information?"}</H3>
<Prose>{"Compare the current query with each key, divide by the square root of the two-coordinate width, turn the scores into positive matching weights with softmax, then multiply each value by its weight and add the writes. Softmax exponentiates each score and divides by the sum of all allowed exponentials; its weights therefore add to one."}</Prose>
<GqaOpeningReadDrawing/>
<Prose>{"The coordinate products are 0×1+1×0=0 for the first key and 0×0+1×1=1 for the second. Dividing by √2 gives scores [0,0.70710678]. Their normalized exponentials give [0.33023845,0.66976155]. The written values are [0.33023845,0.33023845] and [0.66976155,−0.66976155]. Adding them gives [1,−0.33952310]. This is a mixed feature row, not yet a next-point prediction: the surrounding network must interpret it."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"a_j=\\frac{\\exp(s_j)}{\\sum_\\ell\\exp(s_\\ell)},\\qquad s_j=\\frac{q^\\top k_j}{\\sqrt{d_k}},\\qquad o=\\sum_j a_jv_j."}</MathBlock></div>
<Prose>{"Here j labels a stored record, d_k is its query/key coordinate width and o is the output of one reader. For numerical stability, subtract the largest legal score from every legal score before exponentiating. Both numerator and denominator acquire the same factor, so the mathematical weights stay unchanged while avoidable exponential overflow is removed. The already computed dot products must themselves be finite."}</Prose>
<H3>{"Why keep the history after this question has been answered?"}</H3>
<Prose>{"The next input will make a new query, but it can still read these old keys and values. Retaining those projected records is a key/value cache, usually shortened to KV cache. Each record keeps its attached logical position as well as its matching key and information value."}</Prose>
<GqaCacheContentsDrawing/>
<Prose>{"The key columns determine matching; the value columns determine the information written. Old queries have already performed their reads and are not needed for this ordinary next-step calculation. Each attention layer has its own cache, because its projections come from that layer’s own input states."}</Prose>
<Prose>{"Suppose a causal decoder has processed positions 0–31 and input 32 arrives. “Causal” means a position can use only itself and earlier inputs. Under fixed weights, input history and position rules, earlier hidden states cannot depend on the new future input. Project the new row once, append its K/V, then let its query read records 0–32. If you correct an old observation or change the model or position rule, those dependency assumptions no longer hold: recompute the affected states rather than reuse a cache belonging to a different history."}</Prose>
<H3>{"Why are the known prefix and generated future different workloads?"}</H3>
<Prose>{"Known input rows can be processed together with a causal permission mask. This initial processing is called prefill. A generated next word or point becomes a new input only after the model produces it; this sequential phase is decode. The two scenes show information availability, rather than a measured timing comparison."}</Prose>
<GqaPromptAvailabilityDrawing/>
<Prose>{"In the first scene, every supplied input is already available, but a lower row still cannot read a future row. In the second, the model’s output feeds the next input; that input was not known before the preceding prediction. Independent requests can still be batched, and speculative systems can verify proposed chunks while respecting their dependencies."}</Prose>
<Prose>{"Many known queries may reuse a K/V block while it stays near the arithmetic units. One new query per request instead repeatedly reads a growing history. Moving those records can be expensive relative to the work on them, which motivates reducing what each position stores. That is a workload-dependent bandwidth argument: weights, feedforward work, communication and scheduling also cost time. Sharing heads will change the stored head axis, without deleting historical positions or turning the sequence into fixed-size recurrent memory."}</Prose>
<H2>{"2. Several questions, fewer stored descriptions"}</H2>
<H3>{"Can several readers use the same description?"}</H3>
<Prose>{"The cache from §1 stores one key and value description per position for each memory head. A head is one separately projected numerical reader. Give four readers different queries while deciding whether each reader needs its own stored K/V head, two readers share each head, or all four share one."}</Prose>
<GqaGroupingInvestigation/>
<Prose>{"All four query readers remain in every setting. Four distinct K/V heads is ordinary multi-head attention (MHA). Two shared memory heads for four query readers is grouped-query attention (GQA). One shared K/V head for all query readers is multi-query attention (MQA). Sharing the descriptions does not share the questions: different queries can produce different scores, weights and answers from the same records."}</Prose>
<Prose>{"Use Hq for query-head count, Hkv for both key- and value-head count, and R=Hq/Hkv for readers per group. Standard equal groups require positive counts and Hq divisible by Hkv. A query and key both have width dk so their dot product is defined; a value has width dv, which can differ. D is the surrounding model’s input/output width. The common dk=dv=D/Hq choice is an architecture convention, not a requirement of the grouped operator."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"R=H_q/H_{kv},\\qquad g(h)=\\lfloor h/R\\rfloor."}</MathBlock></div>
<Prose>{"The function g names which stored head query head h reads. Four queries and two K/V heads give mapping [0,0,1,1]; eight queries and two K/V heads give [0,0,0,0,1,1,1,1]. In the original GQA paper, “GQA-8” names eight K/V groups. It does not name eight readers per group: 32 queries with eight groups have R=4, while 64 queries with eight groups have R=8."}</Prose>
<Prose>{"Contiguous groups make tensor reshaping simple. A different fixed assignment can also define a valid architecture if training, weights and inference agree. Changing the assignment under an unchanged checkpoint generally changes its function. Consistently renaming the groups and moving their stored arrays together preserves it; changing only a connection does not."}</Prose>
<H2>{"3. Calculate the grouped operation"}</H2>
<H3>{"What does a complete shared read look like?"}</H3>
<Prose>{"The two-record opening cannot show several readers, so switch explicitly to four already-projected queries and two K/V groups, each with three stored positions 0,1,2. The current query is at position 2, so all three are initially legal. Every query/key and value vector has two coordinates. These are constructed numerical inputs, rather than activations of the later fitted forecaster."}</Prose>
<GqaConstructedMemoryDrawing/>
<Prose>{"Read the left query rows as √2 times [1,0], [0,1], [−1,0], [0,−1]. On the right, group 0 keeps keys [1,0], [0,1], [1,1] and values [2,0], [0,4], [2,2]. Group 1 keeps keys [1,1], [−1,0], [0,−1] and values [1,3], [−1,2], [3,0]. Queries 0 and 1 use group 0; queries 2 and 3 use group 1."}</Prose>
<Prose>{"Follow one query’s coordinate products, legal scores, normalized weights and written-value sum. The selected-head control chooses a reader to inspect; its x/y sliders are local interventions on an already-projected query. They do not claim that changing one underlying input would leave all other projections or cached states unchanged."}</Prose>
<GqaProjectedInvestigation question="query"/>
<Prose>{"At the original setting, head 0’s scores are [1,0,1]: the chosen √2 in its query cancels the √2 scale. Softmax turns [e,1,e] into [0.422319,0.155362,0.422319]. Its two-coordinate output is the sum of three weighted value rows. Select head 1 to see different weights and a different output while both readers use precisely the same stored group."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"o_0=\\frac{e[2,0]+[0,4]+e[2,2]}{2e+1}\\approx[1.689275,1.466087]."}</MathBlock></div>
<Prose>{"For reference, all four original reads are below. This fixed table describes the original constructed fixture; the later current-output table follows all your accumulated edits."}</Prose>
<NeuralTable caption={"A four-query, two-memory example"} headers={[<>{"Query head"}</>,<>{"KV group"}</>,<>{"Scaled scores"}</>,<>{"Weights over positions 0,1,2"}</>,<>{"Mixed output"}</>]} rows={[[<>{"0"}</>,<>{"0"}</>,<>{"[1,0,1]"}</>,<>{"[0.422319,0.155362,0.422319]"}</>,<>{"[1.689275,1.466087]"}</>],[<>{"1"}</>,<>{"0"}</>,<>{"[0,1,1]"}</>,<>{"[0.155362,0.422319,0.422319]"}</>,<>{"[1.155362,2.533913]"}</>],[<>{"2"}</>,<>{"1"}</>,<>{"[−1,1,0]"}</>,<>{"[0.090031,0.665241,0.244728]"}</>,<>{"[0.158975,1.600574]"}</>],[<>{"3"}</>,<>{"1"}</>,<>{"[−1,0,1]"}</>,<>{"[0.090031,0.244728,0.665241]"}</>,<>{"[1.841025,0.759549]"}</>]]} />


<H3>{"Which part of a read changes when a key changes?"}</H3>
<Prose>{"Keys participate in matching. Change one key record and compare every currently connected reader. Each row has its own query, so the same key edit can change one reader while leaving an orthogonal query’s match unchanged."}</Prose>
<GqaProjectedInvestigation question="key"/>
<Prose>{"In the original fixture, changing group 0’s first key from [1,0] to [2,0] increases head 0’s first score. Head 1’s score is unchanged because its query has zero x component. Heads connected to group 1 cannot read this edited key. These are genuine unchanged cases, rather than a rule that every shared edit affects every reader."}</Prose>
<H3>{"Which part changes when a value changes?"}</H3>
<Prose>{"Values provide the information after matching. Their weighted writes form a vector sum, so a two-coordinate picture can show both the individual contributions and the final answer. With nonnegative weights that sum to one, the answer lies inside the convex hull: the set of all weighted averages of the legal value points. If the points lie on a line, that set is a segment; if all coincide, it is one point."}</Prose>
<GqaProjectedInvestigation question="value"/>
<Prose>{"Changing group 0’s first value from [2,0] to [3,−1] leaves every matching score and weight unchanged. Each connected output changes by its mass on that record times [1,−1]. Other-group readers stay unchanged. The amber/blue cell fills show signs of coordinates; the violet head-to-tail arrows show computed weighted writes, whose sum reaches the white final point."}</Prose>
<H3>{"What if a reader uses a different stored group?"}</H3>
<Prose>{"A connection chooses the K/V head before any matching weights are calculated. Here you can change one connection while keeping all numerical fields fixed; this is a different intervention from changing a key or value."}</Prose>
<GqaRoutingInvestigation/>
<GqaReadResults/>
<Prose>{"For arbitrary current routing, the per-head operation remains “use the head named by the connection.” The standard compact reshape below returns to the original contiguous equal-group convention. Custom unbalanced routing is a legitimate separate function, but that reshape and standard GQA API do not implement an arbitrary routing list."}</Prose>
<H3>{"How does the notation describe the pictured operation?"}</H3>
<Prose>{"Let B be independent examples or requests—the example count called N in earlier module lessons. Let T be current query rows and S be stored memory rows. In a full pass they can refer to the same input; a decode step often has T=1 and S equal to the observed prefix. The pictured two-coordinate heads generalize to dk key coordinates and dv value coordinates."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"Q\\in\\mathbb R^{B\\times H_q\\times T\\times d_k},\\quad K\\in\\mathbb R^{B\\times H_{kv}\\times S\\times d_k},\\quad V\\in\\mathbb R^{B\\times H_{kv}\\times S\\times d_v}."}</MathBlock></div>
<Prose>{"With contiguous equal groups, h selects g(h)=floor(h/R). A score bias b can represent an appropriate positional bias; this constructed example uses zero bias. Normalize only the allowed records. A forbidden record is conventionally given negative infinity before softmax: assigning score zero would still give it exponential mass one."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"s_{h,t,j}=q_{h,t}^{\\top}k_{g(h),j}/\\sqrt{d_k}+b_{h,t,j},\\quad a_{h,t,:}=\\operatorname{softmax}_{\\rm legal}(s_{h,t,:}),\\quad o_{h,t}=\\sum_j a_{h,t,j}v_{g(h),j}."}</MathBlock></div>
<H3>{"How do several reads become one model update?"}</H3>
<Prose>{"Concatenation places the head outputs next to each other; a separately learned output map combines that wider row into the surrounding model width. The small drawing uses a declared 2×8 output map, rather than the task head of the later trained model."}</Prose>
<GqaOutputMapDrawing/>
<Prose>{"Four two-coordinate head writes concatenate into eight coordinates. The map’s first row reads head 0’s first coordinate plus half head 2’s first coordinate; its second row reads head 1’s second coordinate plus half head 3’s second coordinate. In general the concatenated width is Hq×dv and the output width is D. The block then adds its bypass and performs feedforward processing as taught in Transformer Block Architecture. Thus changing the K/V head count can leave the block’s external row width unchanged."}</Prose>
<H3>{"Can a compact tensor avoid physically repeating stored heads?"}</H3>
<Prose>{"Yes. For the original contiguous mapping [0,0,1,1], reshape the query-head axis into two groups of two readers. The drawing shows actual head indices and the separate score matrices they produce; the K/V group axis broadcasts across readers."}</Prose>
<GqaGroupedLayoutDrawing/>
<Prose>{"A repeated tied-MHA representation computes the same function, but explicit repeat_interleave allocates duplicated tensors. Its backward pass correctly adds the contributions from those copies; correctness does not make the forward allocation free. A grouped reference instead keeps Q as [B,Hkv,R,T,dk], K as [B,Hkv,S,dk] and V as [B,Hkv,S,dv]."}</Prose>
<CodeBlock language="python">{"scores = torch.einsum(\"bgrtd,bgud->bgrtu\", grouped_query, keys) / math.sqrt(dk)\n# Apply the taught allowed-key mask before softmax.\nweights = scores.masked_fill(~allowed[:, None, None], -torch.inf).softmax(-1)\noutputs = torch.einsum(\"bgrtu,bgue->bgrte\", weights, values)"}</CodeBlock>
<Prose>{"The letters name batch b, group g, reader r, query t, memory u, key coordinate d and value coordinate e. Summing d makes scores; summing u mixes values. The distinct d/e labels allow unequal key and value widths. A dense reference still creates B×Hq×T×S score entries. Fused kernels can tile the same computation and reuse a memory tile without materializing every score; a high-level einsum alone does not establish physical traffic or measured speed."}</Prose>
<H2>{"4. Build the cache and count the savings honestly"}</H2>

<H3>{"Store compact K/V, retain the position contract"}</H3>

<Prose>{"The separate readers from §3 can now read a compact growing cache. Keep the original four-reader/two-KV fixture for this drawing: input position 2 produces four queries but only two unique keys and two unique values. The rotary position rule taught in Positional Encodings turns each query and unique key at its attached ID; values stay unrotated. The lower part draws three occupied records inside a five-record reserved allocation."}</Prose>
<GqaCompactAppendDrawing/>
<Prose>{"Follow each query’s rotary branch into a transient read. Follow each unique key’s rotary branch and unchanged value into the new compact cache record. Append after the two old records, then use the fixed mapping [0,0,1,1] to read the occupied cache. The unused capacity is allocated space, not a legal position. This static drawing restores the declared original fixture; the projected-array editors retain their current case in the later permission questions."}</Prose>

<Prose>{"If all copies receive the same position and frequency rule, “rotate then repeat” and “repeat then rotate” are mathematically equivalent. Rotating the unique keys avoids redundant work. Cache correctness depends on retaining a consistent rotated/unrotated convention and logical IDs; the mere ordering of two equivalent operations does not force an expanded cache or a position bug."}</Prose>

<Prose>{"A one-position query tensor can correspond to logical position 32. The legal keys are positions 0–32, not only position 0. More generally, a new chunk at positions 3 and 4 against keys 0–4 needs"}</Prose>

<CodeBlock language={"text"}>{"query 3: 1 1 1 1 0\nquery 4: 1 1 1 1 1"}</CodeBlock>

<Prose>{"This is a logical-position relation. A generic upper-left triangle on a 2-by-5 tensor would instead permit only the first one and first two keys. Both arrays have valid shapes; only one describes this cached computation."}</Prose>

<GqaPermissionInvestigation question="key-id"/>
<Prose>{"Keep the same edited projected Q/K/V case across these questions. The two displayed query rows copy its four current query vectors at different attached IDs; they are not activations claimed to come from two different learned input positions. Changing an ID changes permission, while it does not recompute these already-projected vectors or apply a new rotary transformation."}</Prose>
<GqaPermissionInvestigation question="query-id"/>
<GqaPermissionInvestigation question="triangle"/>
<Prose>{"A mathematical all-masked read has no normalized distribution. It is displayed as undefined; move a query or key ID to restore a legal record. Physical row order is separate from attached logical ID. Reversing complete K/V records with their IDs preserves the logical read, whereas a triangle tied to physical row indices need not."}</Prose>
<GqaRecordInvestigation question="renaming"/>
<Prose>{"Now append or remove whole initialized records. Each appended group receives key [1,1] and value [4,−4]; its attached ID is the current maximum plus one, capped at 256. The physical editor allows one to eight records. At the cap, duplicate IDs are possible; “last stored row” does not imply “future.” Legality always follows the explicit attached-ID relation."}</Prose>
<GqaRecordInvestigation question="append"/>

<H3>{"Bytes come from actual tensor dimensions"}</H3>

<Prose>{"To count storage, start with one request, 80 layers, 32,768 occupied positions, 64 query readers and eight distinct K/V heads. Each key and each value has 128 coordinates, stored using two bytes per coordinate. A stored record repeats along the position, head, layer and request axes; none of these axes is a query-history cache."}</Prose>
<GqaBudgetInvestigation question="population"/>
<Prose>{"The live total counts requests × layers × occupied positions × distinct K/V heads × (key coordinates + value coordinates) × bytes. The two width controls now let keys and values differ, while their supplied byte count describes coordinate payload alone. One-byte storage or quantized packing needs its own numeric-format and metadata contract; this count is not a quality claim."}</Prose>
<GqaBudgetInvestigation question="widths"/>
<Prose>{"Keep those dimensions and change how many query readers and distinct K/V heads the model uses. Divisor choices retain standard equal-sized groups. Query count alone does not multiply the compact stored record count."}</Prose>
<GqaBudgetInvestigation question="heads"/>
<Prose>{"For a uniform unquantized cache with batch size "}<InlineMath>{"B"}</InlineMath>{", "}<InlineMath>{"L_{\\mathrm{layers}}"}</InlineMath>{" layers, prefix length "}<InlineMath>{"L"}</InlineMath>{", equal K/V head count "}<InlineMath>{"H_{kv}"}</InlineMath>{" and bytes per stored number "}<InlineMath>{"s"}</InlineMath>{", the K/V tensor payload is"}</Prose>

<div className="neural-equation"><MathBlock>{"C=B L_{\\mathrm{layers}} L H_{kv}(d_k+d_v)s."}</MathBlock></div>

<Prose>{"When "}<InlineMath>{"d_k=d_v=d_h"}</InlineMath>{", this becomes "}<InlineMath>{"2B L_{\\mathrm{layers}} L H_{kv}d_hs"}</InlineMath>{". One factor 2 means “key plus value”; another factor may come from using two-byte FP16/BF16 numbers. Do not merge them and accidentally halve the answer."}</Prose>

<Prose>{"For an illustrative architecture with 80 layers, 64 query heads, width 128 per K/V head and two-byte cache entries:"}</Prose>

<NeuralTable caption={"Bytes come from actual tensor dimensions"} headers={[<>{"Distinct KV heads"}</>,<>{"Cache bytes per token, one sequence"}</>,<>{"Payload at 32,768 tokens"}</>,<>{"Same payload in decimal GB"}</>]} rows={[[<>{"64, MHA"}</>,<>{"2,621,440"}</>,<>{"80 GiB"}</>,<>{"85.899 GB"}</>],[<>{"8, GQA"}</>,<>{"327,680"}</>,<>{"10 GiB"}</>,<>{"10.737 GB"}</>],[<>{"1, MQA"}</>,<>{"40,960"}</>,<>{"1.25 GiB"}</>,<>{"1.342 GB"}</>]]} />

<Prose>{"A GiB is "}<InlineMath>{"2^{30}"}</InlineMath>{" bytes; a decimal GB is "}<InlineMath>{"10^9"}</InlineMath>{" bytes. These are calculated tensor sizes for the stated configuration. They do not claim that a named checkpoint was trained for this context length or that the complete model fits a particular device."}</Prose>

<Prose>{"The reduction from 64 KV heads to 8 is eightfold; from 8 to 1 is another eightfold; from 64 to 1 is sixty-fourfold. Group size, head count and the chosen comparison determine the ratio."}</Prose>

<Prose>{"For variable request lengths and different attention layer types, sum the actual per-request, per-layer terms. An allocated cache may reserve maximum lengths or rounded pages instead of exactly the occupied tokens. Quantized caches also have scales, packing and other metadata; four-bit values do not imply that every stored quantity occupies exactly half a byte. Prefix sharing and distributed replication further distinguish logical tensor payload from physical allocation."}</Prose>

<H3>{"Parameter arithmetic changes too"}</H3>

<Prose>{"The same architecture also has four learned maps. In output-by-input orientation, their shapes are Hq×dk by D for Q, Hkv×dk by D for K, Hkv×dv by D for V, and D by Hq×dv for O. The drawn w entries denote independent unknown learned weights, not equal numerical values. Change D while holding the already specified head widths fixed."}</Prose>
<GqaBudgetInvestigation question="model-width"/>
<Prose>{"The grid cutaways mark omitted rows and columns. Count each whole rectangle by its dimensions: shared K/V maps have fewer output rows, while Q and the concatenated-output map retain the query-head axis. The resulting counts describe attention weights, rather than all the surrounding block’s parameters."}</Prose>
<Prose>{"Without biases, projections have parameter counts"}</Prose>

<div className="neural-equation"><MathBlock>{"P_Q=DH_qd_k,\\quad P_K=DH_{kv}d_k,\\quad\nP_V=DH_{kv}d_v,\\quad P_O=DH_qd_v."}</MathBlock></div>

<Prose>{"Their sum is "}<InlineMath>{"D(H_q+H_{kv})(d_k+d_v)"}</InlineMath>{". For the common "}<InlineMath>{"d_k=d_v=D/H_q"}</InlineMath>{" case:"}</Prose>

<div className="neural-equation"><MathBlock>{"P_{\\rm attention}=2D^2\\left(1+\\frac{H_{kv}}{H_q}\\right)."}</MathBlock></div>

<Prose>{"With "}<InlineMath>{"D=512,H_q=8"}</InlineMath>{", MHA has 1,048,576 attention-projection parameters; two-KV-head GQA has 655,360; MQA has 589,824. Biases, norms, feedforward layers and embeddings add their own parameters. The percentage saved in the "}<strong>{"whole model"}</strong>{" depends on that full architecture. It is not always 5%, and optimizer-state memory can also decrease when trainable parameter count decreases."}</Prose>

<H3>{"Which arithmetic remains?"}</H3>

<Prose>{"Ignoring small overheads and counting a multiply-add as two operations, one attention application needs approximately"}</Prose>

<div className="neural-equation"><MathBlock>{"2BH_qTSd_k\\quad\\text{for QK scores},\\qquad\n2BH_qTSd_v\\quad\\text{for mixing values}."}</MathBlock></div>

<Prose>{"These terms retain "}<InlineMath>{"H_q"}</InlineMath>{", even when K/V are shared. Different queries still form different weighted sums. The K/V "}<strong>{"projection"}</strong>{" arithmetic does decrease with "}<InlineMath>{"H_{kv}"}</InlineMath>{". Thus “all FLOPs stay identical” is too broad; “the dense score and value-mixing arithmetic is unchanged at fixed query heads, widths and lengths” is the useful precise statement."}</Prose>

<Prose>{"For one decode query with equal widths, these attention operations total about "}<InlineMath>{"4BH_qLd_h"}</InlineMath>{". An idealized read-once compact K/V payload is "}<InlineMath>{"2BH_{kv}Ld_hs"}</InlineMath>{", suggesting arithmetic per byte of "}<InlineMath>{"2R/s"}</InlineMath>{". With two-byte elements this is "}<InlineMath>{"R"}</InlineMath>{" operations per byte. This model assumes effective reuse and omits weights, writes, cache hierarchy and other work; it explains why sharing can help a bandwidth-limited kernel without predicting its measured speed."}</Prose>

<Prose>{"Fewer moved bytes help only the portion of time that those bytes actually constrain. Separate an assumed reducible traffic fraction from unchanged work, then change the reduction factor while holding that other work fixed. The rail is a cost model, not a benchmark."}</Prose>
<GqaAmdahlInvestigation/>
<Prose>{"A baseline cost of one splits into unchanged 1−f and reducible f. If that latter component is divided by r, the new cost is 1−f+f/r. The modeled speed factor is its reciprocal. This gives a decision rule: a large storage ratio cannot yield that same speed ratio when substantial work stays unchanged."}</Prose>
<Prose>{"If 60% of a step's time were reducible by a factor of 8 and everything else stayed fixed, the total speedup would be"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{1}{0.4+0.6/8}\\approx2.105,"}</MathBlock></div>

<Prose>{"not 8. This is an illustrative Amdahl calculation, not an observed decoder timing. Real group counts may also change kernel occupancy, parallelism, batching and communication. Measure the workload before turning a storage ratio into a latency claim."}</Prose>



<H2>{"5. Implement the mechanism and verify a real API contract"}</H2>

<H3>{"A complete transparent NumPy reference"}</H3>

<Prose>{"This program loops over query heads so the assignment is easy to inspect. It does not repeat the stored K/V array. Python and NumPy are sufficient; no trained weights or GPU are needed. The displayed arrays are the hand example from §3."}</Prose>

<CodeBlock language={"python"}>{"import math\nimport numpy as np\n\n\ndef grouped_attention(query, keys, values, query_positions, key_positions,\n                      mapping=None, causal=True):\n    # Q: [B,Hq,T,dk], K: [B,Hkv,S,dk], V: [B,Hkv,S,dv].\n    batch, query_heads, query_length, key_width = query.shape\n    kv_heads = keys.shape[1]\n    if query_heads % kv_heads or keys.shape[:3] != values.shape[:3]:\n        raise ValueError(\"Use equal-size groups and matching K/V head/slot counts.\")\n    if keys.shape[0] != batch or keys.shape[-1] != key_width:\n        raise ValueError(\"Batch and Q/K coordinate widths must agree.\")\n    if mapping is None:\n        mapping = np.arange(query_heads) // (query_heads // kv_heads)\n    mapping = np.asarray(mapping)\n    if (mapping.shape != (query_heads,) or np.any(mapping < 0)\n            or np.any(mapping >= kv_heads)):\n        raise ValueError(\"Each query head must name a valid KV head.\")\n    legal = np.ones((query_length, keys.shape[2]), dtype=bool)\n    if causal:\n        legal = np.asarray(key_positions)[None, :] <= np.asarray(query_positions)[:, None]\n    if not legal.any(-1).all():\n        raise ValueError(\"A query has no legal key.\")\n    outputs, weights = [], []\n    for head, memory_head in enumerate(mapping):\n        scores = query[:, head] @ keys[:, memory_head].swapaxes(-1, -2)\n        scores /= math.sqrt(key_width)\n        scores = np.where(legal, scores, -np.inf)\n        probabilities = np.exp(scores - scores.max(-1, keepdims=True))\n        probabilities /= probabilities.sum(-1, keepdims=True)\n        outputs.append(probabilities @ values[:, memory_head])\n        weights.append(probabilities)\n    return np.stack(outputs, 1), np.stack(weights, 1)\n\n\nq = np.array([[1,0], [0,1], [-1,0], [0,-1]], dtype=float)[None,:,None,:] * math.sqrt(2)\nk = np.array([[[1,0], [0,1], [1,1]], [[1,1], [-1,0], [0,-1]]], dtype=float)[None]\nv = np.array([[[2,0], [0,4], [2,2]], [[1,3], [-1,2], [3,0]]], dtype=float)[None]\noutput, weights = grouped_attention(q, k, v, [2], [0,1,2])\nprint(\"weights:\", np.round(weights[0,:,0], 6))\nprint(\"head outputs:\", np.round(output[0,:,0], 6))\n\n# The same function represented as MHA with tied/repeated K/V heads.\ntied, _ = grouped_attention(q, np.repeat(k, 2, axis=1),\n                           np.repeat(v, 2, axis=1), [2], [0,1,2])\nprint(\"tied MHA agrees:\", np.allclose(output, tied, atol=1e-12))\n\n# For one query at the last slot, a compact prefix plus the new entry agrees.\ncached_keys = np.concatenate((k[:,:,:2], k[:,:,2:]), axis=2)\ncached_values = np.concatenate((v[:,:,:2], v[:,:,2:]), axis=2)\ncached, _ = grouped_attention(q, cached_keys, cached_values, [2], [0,1,2])\nprint(\"compact cache agrees:\", np.allclose(output, cached, atol=1e-12))"}</CodeBlock>

<Prose>{"The head outputs are "}<code>{"[1.689275,1.466087]"}</code>{", "}<code>{"[1.155362,2.533913]"}</code>{", "}<code>{"[0.158975,1.600574]"}</code>{" and "}<code>{"[1.841025,0.759549]"}</code>{", and both checks print "}<code>{"True"}</code>{". The compact-cache check here verifies the "}<strong>{"projected-array assembly"}</strong>{". The full neural program in §6 additionally verifies that projecting and processing an observed sequence incrementally reproduces all full-pass causal predictions."}</Prose>

<Prose>{"This reference rejects an all-masked query instead of normalizing an empty set. A production kernel may specify another policy, such as a zero output, but the application must still distinguish “there is no legal evidence” from an ordinary attention distribution. Validate head counts, widths, masks and finite data at the actual input boundary."}</Prose>

<H3>{"A vectorized reference and a bounded append buffer"}</H3>
<Prose>{"The head loop makes each reader easy to inspect. For larger arrays, use the grouped axes from §3 to broadcast compact K/V across their readers. The complete program below supports different value width, per-request attached IDs and independent key validity. It uses stable legal-row softmax and rejects an empty allowed set."}</Prose>
<RemoteCodeBlock source="/learn-code/grouped-query-attention-gqa-multi-query-attention-mqa/grouped-attention-cache.py"/>
<Prose>{"Read grouped_attention as the same two operations drawn earlier: reshape Q into groups/readers; multiply by each compact transposed K; normalize allowed scores; multiply by compact V; reshape back to query heads. The NumPy implementation does not allocate repeated K/V heads, but does materialize dense score and weight arrays. It raises on nonfinite supplied data or overflowing score arithmetic; subtracting a softmax maximum cannot rescue an already infinite dot product."}</Prose>
<Prose>{"ProjectedKVCache allocates a bounded K/V buffer once. Its append method checks capacity, shapes, shared dtype, finite data, logical integer IDs and key-validity fields before changing occupied state. It then writes only the new slice and advances length. “Occupied” counts the valid prefix; “reserved” counts the full capacity. Both byte properties count K/V coordinates only, excluding IDs, masks and headers. It is an inference buffer, not a training autograd cache."}</Prose>
<Prose>{"Its keys must already follow the model’s projection and rotation convention, while its values remain unrotated for the ordinary RoPE model here. A caller must keep the weights, original history and positional rule fixed when reusing it. reset discards the occupied length without claiming to erase reserved storage. Read-only active views prevent accidental changes through a returned view; appending overwrites the next free slice under explicit capacity control."}</Prose>
<Prose>{"The executable comparison uses two requests, six query heads, two K/V heads, two query rows, five memory rows, key width three and value width four. It compares a grouped Torch autograd route, ordinary native SDPA and NumPy, including every Q/K/V derivative against allocated repeated-head reference arrays. It also checks two-chunk append, failed-append preservation, record permutations, reset and the mathematical empty-mask versus native API output policy. The fixed constructed arrays are not RoPE vectors; the complete trained forecaster below separately exercises rotated keys."}</Prose>
<H3>{"Calling PyTorch SDPA is an explicit choice"}</H3>

<Prose>{"The "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html"}>{"PyTorch 2.14 SDPA contract"}</a>{" exposes "}<code>{"enable_gqa=True"}</code>{". It is false by default. Do not assume that fewer K/V heads automatically select the intended grouped operation in every API or backend. MQA can also happen to broadcast in some lower-level operations; that does not replace an explicit grouping contract."}</Prose>

<Prose>{"For existing tensors Q/K/V with the shapes above, the relevant call is:"}</Prose>

<CodeBlock language={"python"}>{"result = torch.nn.functional.scaled_dot_product_attention(\n    query, keys, values,\n    attn_mask=legal_mask,       # True means this key participates.\n    is_causal=False,           # The explicit mask already includes causal legality.\n    dropout_p=0.0,\n    enable_gqa=True,\n)"}</CodeBlock>

<Prose>{"This is a call-site fragment; "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/mechanism-calculations.py"}>{"the complete operator-check program"}</a>{" supplies the tensors and executes it. Its CPU float64 output agreed with the direct grouped calculation to "}<InlineMath>{"2.23\\times10^{-16}"}</InlineMath>{" in the recorded PyTorch 2.14.0 environment. That observation is not evidence about CUDA dispatch, throughput or every supported shape."}</Prose>

<RemoteCodeBlock source="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/mechanism-calculations.py"/>

<Prose>{"Pay attention to two particularly easy API mismatches. SDPA's boolean mask uses "}<code>{"True"}</code>{" for "}<strong>{"allowed"}</strong>{", whereas "}<code>{"MultiheadAttention"}</code>{"'s key-padding mask uses "}<code>{"True"}</code>{" for "}<strong>{"excluded padding"}</strong>{". Also, SDPA's documented non-square "}<code>{"is_causal=True"}</code>{" aligns a triangle at the "}<strong>{"upper left"}</strong>{". A cached query at the last position needs the offset relation from §4. In our one-query/three-key fixture, the upper-left mask allows only the first key, returning its value in each group instead of the correct three-key mixture."}</Prose>

<Prose>{"The "}<a href={"https://github.com/Dao-AILab/flash-attention#how-to-use-flashattention"}>{"FlashAttention interface documentation"}</a>{" describes a bottom-right-aligned causal convention for its current unequal-length operation. These are different API contracts, despite similar parameter names. Compare each call with an explicit logical-position reference rather than transplanting a mask assumption between libraries. Backend support and fused-kernel constraints are version-specific; the recorded native checks do not require installing FlashAttention."}</Prose>

<Prose>{"SDPA also applies dropout according to the "}<code>{"dropout_p"}</code>{" argument. Setting a surrounding module to evaluation mode does not automatically override a nonzero argument passed to the functional call. Use zero for deterministic cached inference unless the application deliberately defines another behavior."}</Prose>

<Prose>{"The "}<a href={"https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/llama/modeling_llama.py"}>{"maintained Llama source"}</a>{" provides a useful production reading exercise: inspect smaller K/V projections, native-head RoPE, compact cache update, then attention-backend dispatch. Its eager "}<code>{"repeat_kv"}</code>{" helper is a readable reference; it is not proof that an expand-plus-reshape path always avoids allocation. Inspect the actual storage and backend when that distinction matters."}</Prose>

<Prose>{"In the versioned PyTorch 2.14 documentation, GQA support includes the CUDA Flash, cuDNN, math and memory-efficient paths, with stated grouping and NestedTensor constraints. The small checks here execute the CPU float64 route, not those CUDA kernels. Native fused dispatch and speed must be checked for the actual installed build, dtype, device, mask and dimensions; the transparent reference is a correctness target, not a universally optimal scheduler."}</Prose>
<H3>{"Make sharing visible to the optimizer"}</H3>

<Prose>{"The complete "}<code>{"mechanism-calculations.py"}</code>{" also checks the derivative that sharing creates: reshape per-reader value gradients into "}<code>{"[B,Hkv,readers,S,dv]"}</code>{" and sum the readers axis. That result must equal the compact shared V gradient. This is the bridge from a storage choice to actual fitting, not a claim that averaging separately updated MHA weights implements the same update."}</Prose>

<Prose>{"For an independent variation, use six query heads and two KV heads, with value width different from key width. Change the group reshape and output merge consistently; keep the true Q/K scale. "}<strong>{"Hint:"}</strong>{" each KV parameter now receives contributions from three readers. "}<strong>{"Solution:"}</strong>{" SDPA and the direct grouped operator should agree, and three per-reader gradients sum into each shared gradient. The real forecast program already owns projection, optimizer, conversion/uptraining and full-versus-cached state. Reuse it for this extension; do not rebuild the attention derivation or compare unrelated random fits."}</Prose>

<H2>{"6. Convert a trained model and observe what survives"}</H2>


<H3>{"Can separate learned descriptions be merged?"}</H3>
<Prose>{"The compact implementation from §5 assumes the model already has shared K/V maps. To adapt an existing MHA checkpoint, first decide which original heads will form each group. Keep its query and output maps, then replace each group’s key maps and value maps with their coordinatewise means, including biases. The mean is an initialization that lets further training start near the old parameters; it is not a theorem of unchanged predictions."}</Prose>
<Prose>{"First see how averaging two affine maps works. This separate arithmetic illustration uses input [2,−1], map 0 [[1,0],[0,2]] with bias [1,0], and map 1 [[0,1],[−1,0]] with bias [−1,2]. Put coefficient one half on each map and bias. These are generic projection maps, not the later trained forecaster’s K/V parameters."}</Prose>
<GqaAffineFoldingDrawing first={.5} second={.5}/>
<Prose>{"The original projected rows are [3,−2] and [−2,0]. Their mean is [0.5,−1]. The averaged map [[0.5,0.5],[−0.5,1]] with averaged bias [0,1] gives that same mean projection from the same input. Linearity establishes equality of the averaged projected coordinates; it does not establish equality of the complete attention outputs, which also normalize scores and mix values."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"\\overline W_K^{(g)}=\\frac1R\\sum_{h:g(h)=g}W_K^{(h)},\\quad \\overline b_K^{(g)}=\\frac1R\\sum_{h:g(h)=g} b_K^{(h)};\\qquad \\overline W_V^{(g)},\\overline b_V^{(g)}\\text{ likewise.}"}</MathBlock></div>
<H3>{"Why can the averaged attention answer change?"}</H3>
<Prose>{"Switch to two scalar query heads so every exponential is easy to inspect. Their queries are 1 and 2. The first head’s two keys are [2,0] and values [1,3]; the second head’s keys are [0,2] and values [5,−1]. Scalar width is one, so the dot-product scale is also one. Each pictured route shows its old read and its read from one candidate shared memory."}</Prose>
<GqaConversionInvestigation question="query"/>
<Prose>{"At the original setting, head 0 has softmax scores [2,0], giving output 1.238406; head 1 has scores [0,4], giving −0.892083. Mean keys [1,1] give each retained query equal scores over the two positions, hence weights [0.5,0.5]. Mean values [3,1] then give output 2 for both queries. Neither original answer, nor their average, is preserved. The drawing’s original and converted paths distinguish projection averaging from function averaging."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"o_0=\\frac{e^2+3}{e^2+1},\\qquad o_1=\\frac{5-e^4}{1+e^4},\\qquad \\overline o_0=\\overline o_1=\\tfrac12(3+1)=2."}</MathBlock></div>
<Prose>{"Keep your scalar query edits and change one original key coordinate. The candidate mean updates from the same original heads; each output still depends on its own query, not on an averaged query."}</Prose>
<GqaConversionInvestigation question="key"/>
<Prose>{"Next change one original value coordinate while retaining the key edits. Averaging coordinates commutes with a fixed linear map, but softmax and the query-specific matching route introduce nonlinear differences."}</Prose>
<GqaConversionInvestigation question="value"/>
<H3>{"What exactly does the mean optimize?"}</H3>
<Prose>{"The mean minimizes squared coordinate distance to the original arrays. Choose a candidate key or value coordinate and move it away from the mean. The lower diagram shows the original parameter-coordinate points, their mean and the current candidate; it does not plot forecast error."}</Prose>
<GqaConversionInvestigation question="candidate"/>
<Prose>{"Write W_h for each original map (or stack a map and bias into one array), M for a proposed shared map and W̄ for the group mean. Split W_h−M into (W_h−W̄)+(W̄−M). The cross terms add to zero because the deviations from the mean sum to zero. What remains is the minimum distance plus R times the squared distance from the candidate to the mean."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"\\sum_h\\|W_h-M\\|_F^2=\\sum_h\\|W_h-\\overline W\\|_F^2+R\\|M-\\overline W\\|_F^2."}</MathBlock></div>
<Prose>{"The Frobenius squared norm sums squared coordinates. At the original scalar fixture, the key minimum is 4 and the value minimum is 16. Moving the shared keys from [1,1] to [2,0] increases key distance to 8; moving values from [3,1] to [2,4] increases value distance to 36. Those extra distances are 2×2 and 2×10 respectively. Minimizing this parameter distance does not minimize task loss or average old attention outputs. For a fixed query, its dot product with the mean key is the mean of its dot products with the original keys; original heads themselves generally use different queries."}</Prose>
<Prose>{"For an exact unchanged case, make both original K/V heads identical and clear the candidate offsets. Equal maps, biases and compatible masks and positions make each retained query read precisely its original memory."}</Prose>
<GqaConversionInvestigation question="tied"/>
<Prose>{"Further training lets the network adapt to the changed structure. Ainslie et al. call continued pretraining after conversion uptraining, followed by task fine-tuning in their T5 study. That recipe does not promise that every checkpoint can be merged without loss or adapted in a fixed number of updates. We will now switch from arithmetic examples to an actual small recorded forecasting study, preserving an unchanged-MHA continuation control."}</Prose>
<H3>{"A real causal forecasting task"}</H3>

<Prose>{"We use the same licensed "}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"Libras Movement recordings"}</a>{" as the preceding positional lesson, but ask a new question: "}<strong>{"given the observed points so far, where will the next point be?"}</strong>{" Each record has 45 normalized x/y coordinates. Inputs 0–43 predict targets 1–44. The causal mask ensures a prediction cannot read its target or later points. Movement-class labels are used only to preserve the declared split, not as model inputs or forecast targets."}</Prose>

<Prose>{"The source has 360 rows but 330 distinct trajectories. Remove the 30 additional exact duplicates after checking that duplicate labels agree, retain the first occurrence and use the existing seed-73 classwise split: 220 training, 50 validation and 60 test trajectories. Keep whole trajectories together. Fixed scaling "}<InlineMath>{"2x-1"}</InlineMath>{" supplies model inputs and targets; output RMSE is converted back to the original coordinate unit. The source lacks reliable per-row performer/session identifiers, so this is a row-level diagnostic, not evidence of generalization to a new signer or a deployable movement system. "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/data-provenance.md"}>{"Original data, metadata and attribution"}</a>{" accompany the program."}</Prose>

<Prose>{"A persistence baseline predicts the latest observed point unchanged. An affine baseline fits "}<InlineMath>{"\\widehat x_{t+1}=A x_t+b"}</InlineMath>{" to training transitions only. These simple models make it harder to mistake smooth motion for impressive architectural learning."}</Prose>

<H3>{"A controlled conversion protocol"}</H3>

<Prose>{"The neural model has a 2-to-24 coordinate projection, one pre-normalized Transformer block, four query heads of width 6, FFN width 48 with GELU, a final LayerNorm and a two-coordinate prediction at every row. It uses full Q/K RoPE with base 10000 and logical positions 0–43, biased maps, epsilon "}<InlineMath>{"10^{-5}"}</InlineMath>{" and no dropout. It predicts coordinates rather than classes or token probabilities."}</Prose>

<Prose>{"First train the four-KV-head MHA parent using seed 101, 180 full-batch Adam updates at learning rate 0.003. Select the lowest validation MSE, taking the earliest exact tie. The selected parent is update 171."}</Prose>

<Prose>{"From that one checkpoint, create three branches: continue MHA unchanged, convert to two-KV-head GQA by group means, and convert to one-KV-head MQA. Each branch then gets exactly 45 additional full-batch Adam updates at learning rate 0.001 with a fresh optimizer. Select by validation MSE, including the zero-update state as a candidate. The continued MHA branch controls for the benefit of simply doing more optimization. All shared weights are copied from the parent; no branch is retuned after seeing test performance."}</Prose>

<Prose>{"This is a small conversion study, not a comparison of fully optimized architectures trained from scratch. Different branches have different parameter counts and may require different adaptation schedules. The fraction 45/180 is a count of these local updates, not a claim to reproduce the original paper's pretraining-compute fraction."}</Prose>

<H3>{"The actual outcomes"}</H3>

<Prose>{"RMSE below is per coordinate, in the original normalized coordinate units. Each neural test result averages errors over all 44 prediction slots of the same 60 held-out trajectories."}</Prose>

<NeuralTable caption={"The actual outcomes"} headers={[<>{"Model/branch"}</>,<>{"Parameters"}</>,<>{"Selected extra update"}</>,<>{"Test RMSE before extra training"}</>,<>{"Test RMSE after selection"}</>]} rows={[[<>{"MHA continuation, 4 KV heads"}</>,<>{"5,042"}</>,<>{"41"}</>,<>{"0.015789"}</>,<>{"0.015617"}</>],[<>{"Converted GQA, 2 KV heads"}</>,<>{"4,442"}</>,<>{"45"}</>,<>{"0.077182"}</>,<>{"0.018268"}</>],[<>{"Converted MQA, 1 KV head"}</>,<>{"4,142"}</>,<>{"42"}</>,<>{"0.115174"}</>,<>{"0.025224"}</>],[<>{"Persistence baseline"}</>,<>{"0"}</>,<>{"—"}</>,<>{"—"}</>,<>{"0.026458"}</>],[<>{"Training-fitted affine baseline"}</>,<>{"6"}</>,<>{"—"}</>,<>{"—"}</>,<>{"0.026222"}</>]]} />

<Prose>{"Averaging sharply worsens both converted models initially. Further training recovers much of that loss. GQA remains worse than the MHA control in this run; MQA is only slightly better than the simple baselines. These are informative outcomes, not failures to obtain the intended lesson. Cache size reductions are exact consequences of shape; quality recovery is an empirical question."}</Prose>

<Prose>{"Validation RMSE after selection is 0.015260, 0.018438 and 0.025090 for MHA/GQA/MQA respectively. The GQA selection lands on the last allowed update, so this protocol does not establish its eventual converged quality. More adaptation might change the result; do not extend the schedule solely to improve a displayed test score. A new training question would need a newly declared protocol and appropriate evaluation boundary."}</Prose>

<Prose>{"To see why the selected update matters, inspect all 45 validation-MSE continuation measurements rather than only the endpoint. Each plot uses a logarithmic MSE axis and marks the selected checkpoint; it does not show the held-out test curve."}</Prose>
<GqaContinuationHistoryDrawing/>
<Prose>{"MHA and MQA select interior checkpoints, while the GQA minimum lands at update 45, the protocol’s endpoint. These actual histories help distinguish observed recovery from a claim of convergence. Test results were evaluated only after selecting by validation."}</Prose>

<H3>{"Inspect one real forecast, including the cache"}</H3>

<Prose>{"The visible example was chosen before fitting: source row 77. Observe its first 32 points, then predict point 32 under zero-based numbering. The actual next point is approximately "}<code>{"[0.593810,0.250000]"}</code>{"."}</Prose>

<NeuralTable caption={"Inspect one real forecast, including the cache"} headers={[<>{"Selected branch"}</>,<>{"Next predicted point"}</>,<>{"Compact float32 K/V payload for this 32-point prefix"}</>]} rows={[[<>{"MHA"}</>,<>{"[0.600976,0.258456]"}</>,<>{"6,144 bytes"}</>],[<>{"GQA"}</>,<>{"[0.597412,0.259018]"}</>,<>{"3,072 bytes"}</>],[<>{"MQA"}</>,<>{"[0.607105,0.253203]"}</>,<>{"1,536 bytes"}</>]]} />

<Prose>{"These are actual saved model outputs. The bytes are also checked against the actual K/V tensors: "}<code>{"[1,Hkv,32,6]"}</code>{" for each of K and V. They exclude position metadata and all other model state."}</Prose>

<Prose>{"Feeding those same 32 observed points one at a time with the compact cache reproduced "}<strong>{"every"}</strong>{" full-pass causal forecast within "}<InlineMath>{"2.7\\times10^{-7}"}</InlineMath>{" in transformed coordinates. Shifting all logical IDs by 100 preserved the outputs within "}<InlineMath>{"2.4\\times10^{-7}"}</InlineMath>{" under this fixed RoPE model. Neither check means a new unseen input can be ignored; it verifies equivalence of two computations of the same specified function."}</Prose>

<Prose>{"Reflect observed point 23's x coordinate using "}<InlineMath>{"x\\mapsto1-x"}</InlineMath>{". The final GQA next-point forecast changes from "}<code>{"[0.597412,0.259018]"}</code>{" to "}<code>{"[0.597468,0.258925]"}</code>{"; its earlier per-row predictions can change much more. Causality requires outputs "}<strong>{"before"}</strong>{" the edited point to stay unchanged. Attention to a changed old point can affect later queries even though we use a compact cache. Because the old observation changed, recompute the affected cached states rather than silently reusing a cache for a different prefix."}</Prose>

<GqaForecastZone>
<Prose>{"The following linked questions evaluate all three selected checkpoints on one current observed prefix. Its boundary says how many recorded points are supplied; its x/y sliders edit only a selected observed frame. Grey future points remain a visual reference and never enter the input."}</Prose>
<GqaForecastInvestigation question="boundary"/>
<GqaForecastInvestigation question="points"/>
<Prose>{"Shift every query and key’s logical ID by the same amount under this model’s fixed RoPE rule. Relative offsets stay fixed, providing an invariant comparison on the same edited points."}</Prose>
<GqaForecastInvestigation question="shift"/>
<GqaForecastInvestigation question="reset"/>
<GqaForecastResults/>
<Prose>{"To see what produced the selected branch’s answer, choose its model and query head. The picture follows its actual projected query, rotary key records, matching distribution and six-coordinate value write. Every row of the complete selected-head calculation follows the drawing."}</Prose>
<GqaForecastHeadInvestigation/>
<Prose>{"Now put that read back into the actual learned block: saved stem, attention update, first residual, expanded feedforward work, second residual and task map. The drawn arrays explicitly mark omitted coordinates; the complete carried rows remain inspectable below."}</Prose>
<GqaForecastAnatomy/>
</GqaForecastZone>

<H3>{"One-step evaluation is not a generated rollout"}</H3>

<Prose>{"In the table, each prediction receives the real preceding observations. This is teacher-forced evaluation. To forecast several future points, feed the model's own output back as its next input. Errors can change subsequent inputs and accumulate."}</Prose>

<Prose>{"The one-step table used true preceding observations. Now feed each next predicted point back as the newest input, retaining all current prefix edits and the same selected model. The generated-count control changes only how many self-fed steps follow that boundary."}</Prose>
<GqaForecastInvestigation question="rollout"/>
<Prose>{"The amber path is generated; the grey recorded future is a reference. Each later input comes from the prior output, so an early error can change the rest of the path. All three saved models retain the same initial edited prefix; selecting a head changes which branch’s path is inspected, rather than starting new training."}</Prose>
<Prose>{"Starting from the same 32-point prefix, the GQA model's five generated points are approximately"}</Prose>

<CodeBlock language={"text"}>{"[0.597412,0.259018]\n[0.590012,0.261214]\n[0.583480,0.265978]\n[0.577641,0.272512]\n[0.571721,0.279467]"}</CodeBlock>

<Prose>{"Only the first prediction used the last true observed point as its newest input; each later prediction used the prior prediction. The grey recorded future is visible for inspection but never enters the rollout. Edited trajectories have no newly established ground truth. Also, the linear output is not constrained to 0–1; do not silently clip out-of-range predictions and describe the clipped path as the model's actual output."}</Prose>

<Prose>{"This distinction connects the earlier sequence-model lessons to serving: caching removes repeated computation of an unchanged history; it does not remove the uncertainty or feedback loop of generation."}</Prose>

<H3>{"Reproduce the complete study"}</H3>

<Prose>{"Download "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/author-calculations.py"}>{"the complete CPU program"}</a>{", "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/movement_libras.data"}>{"the data"}</a>{", "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/movement_libras.names"}>{"original metadata"}</a>{" and "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/author-results.json"}>{"the recorded results"}</a>{" into one directory. With Python, NumPy and PyTorch installed:"}</Prose>

<CodeBlock language={"bash"}>{"python author-calculations.py"}</CodeBlock>

<Prose>{"The recorded environment was Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, one CPU thread and deterministic algorithms. The program includes the complete model, causal/RoPE/grouped operator, mean-weight/bias conversion, both baselines, all fitting and checkpoint selection, split/duplicate checks, actual weight export and full/cached interventions. It does not rely on a hidden notebook, pretrained download or a GPU. Numerical environments can change last digits."}</Prose>

<Prose>{"Read "}<code>{"CausalForecaster.forward"}</code>{" alongside the diagram: normalize the carried state; project native Q/K/V counts; rotate; append compact K/V and logical IDs; reshape the query-head axis into groups/readers; score and mask; mix values; combine heads; complete the residual/FFN path; forecast the next coordinate. The "}<code>{"convert"}</code>{" function shows exactly which parameters are averaged and which are copied."}</Prose>

<RemoteCodeBlock source="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/author-calculations.py"/>

<Prose>The <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/forecast-models.json">complete model/trace file</a> is an optional reproduction download. The live investigations load three compact saved weight files near the fitted example, evaluate the same edits through all three models, and run no training in the browser. The displayed JavaScript calculation uses numerical approximations and can differ in final digits from recorded native float32 outputs.</Prose>

<H2>{"7. Deeper connections: capacity, optimization and deployment"}</H2>

<H3>{"Sharing ties parameters and accumulates gradients"}</H3>

<Prose>{"For a fixed group, several query heads depend on the same K/V parameters. During training, the shared parameters receive contributions from every use. This is the same chain-rule principle as reusing a function or sharing a convolution kernel across image positions."}</Prose>

<Prose>{"A shared value coordinate sends information into several reader products. To isolate its backward route, switch to two constructed reader masses 0.2 and 0.7 on this one record, with upstream loss derivatives 3 and −1. Those masses belong to different readers; they do not have to add to one together. The dashed orange arrows carry derivative contributions backward to the same stored coordinate."}</Prose>
<GqaSharedGradientInvestigation question="weights"/>
<Prose>{"Each product contributes its mass times its upstream derivative. The original contributions are 0.6 and −0.7, whose sum is −0.1. Changing the weights holds the upstream derivatives fixed; the next question changes those derivatives while keeping the same weights."}</Prose>
<GqaSharedGradientInvestigation question="upstream"/>
<Prose>{"The shared coordinate receives the sum over all its uses. Cancellation is possible: two readers can push it in opposite directions. There is no extra average merely because its parameter is shared."}</Prose>
<Prose>{"If the loss is "}<InlineMath>{"\\mathcal L"}</InlineMath>{" and group g's value at position j is "}<InlineMath>{"v_{g,j}"}</InlineMath>{", its direct value-path derivative is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial\\mathcal L}{\\partial v_{g,j}}\n=\\sum_{h:g(h)=g}\\sum_t\na_{h,t,j}\\frac{\\partial\\mathcal L}{\\partial o_{h,t}}."}</MathBlock></div>

<Prose>{"Each reader contributes according to how much it used that value and how its output affected the loss. There is no extra automatic average over group size. If the loss itself is averaged across examples or positions, that normalization is already inside the upstream derivatives."}</Prose>

<Prose>{"Keys have a more coupled effect because they alter softmax weights. For one reader/query, the derivative with respect to its scaled score is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial\\mathcal L}{\\partial s_{h,t,j}}\n=a_{h,t,j}\\left(\\frac{\\partial\\mathcal L}{\\partial o_{h,t}}\\right)^\\top\n(v_{g,j}-o_{h,t})."}</MathBlock></div>

<Prose>{"Multiplying by "}<InlineMath>{"q_{h,t}/\\sqrt{d_k}"}</InlineMath>{" and summing over that group's readers/positions gives the shared key's gradient when the key enters scores through this dot product. The subtraction of the current mixture appears because increasing one key's weight decreases other normalized weights. Position transforms add their own chain-rule factors."}</Prose>

<Prose>{"The "}<a href={"/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/mechanism-calculations.py"}>{"operator-check program"}</a>{" differentiates a squared-output loss through direct grouped attention and separately through independent repeated value copies. Summing the per-copy gradients exactly recovers the shared-value gradient within float64 tolerance. This is a substantive check of the sharing mechanism, not merely “a gradient exists.”"}</Prose>



<H3>{"What capacity is being restricted?"}</H3>

<Prose>{"At fixed head counts and widths, a grouped model can be represented as an MHA model whose K/V parameters are tied inside each group. MHA allows that tied choice and also permits separate K/V maps. GQA restricts this part of the parameterization while retaining query and output-head diversity."}</Prose>

<Prose>{"This explains a capacity tradeoff, not a theorem that a finite trained MHA model must generalize better. Optimization, data volume, inductive bias and training budgets matter. A restriction can help some tasks, hurt others or make little practical difference. The local forecasting table and published studies are evidence under their own protocols."}</Prose>

<Prose>{"Shared values also do not force all head outputs to be equal: different distributions form different combinations of the same value rows. Before output projection, each head's mixture is in the convex hull of its legal value vectors when attention is ordinary nonnegative row-softmax without dropout. Distinct heads may choose different points in that hull, and their output projections combine them differently. This geometric interpretation does not impose the same convex-hull restriction on the final residual state or forecast."}</Prose>

<Prose>{"If an MHA checkpoint's heads use different feature bases, naive averaging can be a poor functional merge. Even a function-preserving head permutation changes which heads fall into contiguous groups unless grouping is transformed too. Group selection or learned conversion procedures are meaningful research choices. The mean-initialization recipe is a practical baseline, not a proof that the original order yields optimal groups."}</Prose>

<H3>{"What the original studies actually establish"}</H3>

<Prose>{"The "}<a href={"https://arxiv.org/html/2305.13245v3#S3"}>{"GQA paper's Table 1"}</a>{" reports this T5-XXL comparison after its specified 5% uptraining and task fine-tuning:"}</Prose>

<GqaPublishedTradeoffDrawing/>
<Prose>{"The three categorical points show precisely the task-score/time pairs reported in Table 1. Each label connects to its own point; there is no invented smooth head-count curve between them. The vertical axis is an average of development-task metrics, not an accuracy percentage; the horizontal axis uses the source’s TPUv4 protocol."}</Prose>
<NeuralTable caption={"What the original studies actually establish"} headers={[<>{"Attention"}</>,<>{"Average development-task score"}</>,<>{"Reported inference time, seconds per sample per TPUv4 chip"}</>]} rows={[[<>{"MHA"}</>,<>{"47.2"}</>,<>{"1.51"}</>],[<>{"MQA"}</>,<>{"46.6"}</>,<>{"0.24"}</>],[<>{"GQA with 8 KV groups"}</>,<>{"47.1"}</>,<>{"0.28"}</>]]} />

<Prose>{"The average combines the paper's summarization, translation and question-answering metrics; it is not accuracy on one dataset. The authors optimized parallelization separately and used their stated batching/timing protocol. These rows illustrate their quality/time tradeoff, not a universal GPU speed multiplier. Their Figure 5 varies "}<strong>{"uptraining proportion"}</strong>{"; Figure 6 varies groups and reports "}<strong>{"time"}</strong>{". Neither is a measured seven-point quality curve proving that eight groups are always optimal. The limitations also identify encoder-decoder-only evaluation and the absence of a from-scratch XXL GQA comparison."}</Prose>

<Prose>{"The "}<a href={"https://arxiv.org/pdf/1911.02150"}>{"MQA paper's model-quality section"}</a>{" likewise reports task- and metric-specific differences, including a beam-search translation score where MQA slightly exceeds its MHA baseline. Its comparison widens feedforward layers to match total parameter counts. There is no universal “MQA loses exactly 1%” law. The practical questions are which quality measures matter, what adaptations were performed, and what serving workload was measured."}</Prose>

<H3>{"Five separate ways to reduce attention cost"}</H3>

<NeuralTable caption={"Five separate ways to reduce attention cost"} headers={[<>{"Technique"}</>,<>{"What it changes"}</>,<>{"What it does not automatically establish"}</>]} rows={[[<>{"GQA/MQA"}</>,<>{"Number of distinct K/V heads"}</>,<>{"Fewer legal token positions or fixed-size sequence state"}</>],[<>{"Sliding/local attention"}</>,<>{"Which positions each query can read"}</>,<>{"Identical full-attention function or unlimited direct access to old tokens"}</>],[<>{"Tiled exact attention"}</>,<>{"How the same score/softmax/value calculation is scheduled and stored"}</>,<>{"A different mathematical attention operator or a smaller logical KV cache by itself"}</>],[<>{"Paged cache allocation"}</>,<>{"Where physical cache blocks are stored and shared"}</>,<>{"A change to learned projection widths or a universal throughput multiplier"}</>],[<>{"KV quantization"}</>,<>{"Representation precision and payload packing"}</>,<>{"Exact original floating-point outputs or zero metadata overhead"}</>]]} />

<Prose>{"These can be combined when their implementation contracts agree. "}<a href={"https://arxiv.org/html/2310.06825v1#S2"}>{"Mistral 7B's architecture table"}</a>{" gives a concrete published example with 32 query heads and 8 KV heads, combined with sliding-window attention. That is group size 4, not four KV heads. The window and shared heads act on different axes. Its original context/window choices describe that checkpoint, not a recommendation that every new model use those settings."}</Prose>

<Prose>{"Paged allocation rounds token storage into blocks and can support sharing identical prefix blocks with appropriate reference management. It does not guarantee that a logical eightfold GQA reduction multiplies another claimed fourfold saving into thirty-twofold throughput. Allocation efficiency, bandwidth, scheduling and computation interact. Treat the "}<a href={"https://arxiv.org/abs/2309.06180"}>{"original PagedAttention paper"}</a>{" as further systems reading; the local plots here contain no unmeasured serving numbers."}</Prose>

<Prose>{"Speculative decoding has another role: a draft proposes several tokens and the target verifies them. GQA can supply the target's attention implementation, but its cache layout must support accepted/rejected prefix updates. The benefit depends on acceptance, batch/length and hardware. Do not assign a fixed extra multiplier just because both techniques are present."}</Prose>

<H3>{"Logical sharing can be replicated across devices"}</H3>
<Prose>{"Does logical sharing also mean one physical copy? Switch to 32 query heads, two KV heads and eight devices: each device reads four query heads, while each KV group is replicated on four devices."}</Prose>
<GqaPhysicalReplicationDrawing/>
<Prose>{"Follow the two coloured group routes to their four assigned devices. The model still has only two distinct K/V groups, but the eight devices collectively store eight group copies. This drawn case illustrates the same replication issue as the one-group comparison below."}</Prose>

<Prose>{"Suppose tensor parallelism partitions query heads across eight devices. A simple implementation may replicate a single MQA KV head on all eight devices so each can perform its local reads. The model logically has one KV head, but aggregate physical storage contains eight copies. With eight GQA KV heads, a suitable one-group-per-device partition can avoid that particular replication."}</Prose>

<Prose>{"For this simplified equal partition, aggregate stored-head copies can be "}<InlineMath>{"\\max(H_{kv},P)"}</InlineMath>{" when head counts and the "}<InlineMath>{"P"}</InlineMath>{" partitions are compatible and smaller counts are replicated. This is an example strategy, not a universal distributed-cache formula. A different algorithm might communicate or partition the state differently. Count actual per-device storage and communications; do not divide every cache estimate by the device count automatically. The "}<a href={"https://arxiv.org/html/2305.13245v3#S2.SS2"}>{"GQA method discussion"}</a>{" explicitly motivates grouped heads partly through this sharding issue."}</Prose>


<H3>{"When is this useful beyond chat?"}</H3>
<Prose>{"Which unchanged information can a new decoder query reuse? Switch from the fitted trajectory to two small architectural examples: a fixed encoder source with three two-coordinate records, and the original three-record constructed decoder memory."}</Prose>
<GqaCacheOwnershipDrawing/>
<Prose>{"In the first scene, encoder representations enter the K/V maps; their attached position IDs identify the records without replacing their features. A new decoder query reads these unchanged source projections. In the second scene, the new decoder query reads both old prefix memory and its new record, before the output and feedforward routes. These two memory owners explain the applications below."}</Prose>

<Prose>{""}<strong>{"Streaming trajectories and sensor prediction."}</strong>{" Our point predictor is a small causal example. A long stream would keep adding cached records unless the architecture or application defines a window, reset or another memory mechanism. Shared heads reduce each stored record's width; they do not make indefinite storage finite. A reliable streaming application also needs a policy for missing observations, changed calibration and corrected historical inputs."}</Prose>

<Prose>{""}<strong>{"Encoder-decoder systems."}</strong>{" A decoder can use GQA for self-attention over generated tokens and for cross-attention over fixed encoder outputs. The cross-attention K/V can be projected once from those encoder outputs and reused while decoding. Its source length can differ from the generated-prefix length. If encoder outputs change, their cached projections must be refreshed. GQA is not restricted to decoder-only language models, although its incremental motivation is strongest in particular workloads."}</Prose>

<Prose>{""}<strong>{"Multimodal prefixes."}</strong>{" Image patches or audio features can contribute many positions to an autoregressive model's context. Shared K/V heads can reduce the representation stored for each such position, but positional coordinates, modality boundaries and legal cross-stream attention remain separate decisions. The later vision and cross-attention lessons own those representations."}</Prose>

<Prose>{""}<strong>{"Mixture-of-experts models."}</strong>{" A Transformer may route feedforward computation to experts while keeping a shared attention layer. In that arrangement, expert count does not multiply the attention KV-head count. Read the actual block definition; the phrase “eight experts” does not mean eight independent copies of every attention cache. "}<a href={"/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals"}>{"Mixture-of-Experts Transformers"}</a>{" develops that distinction."}</Prose>


<H3>{"Can query width and model width be chosen separately?"}</H3>
<Prose>{"The cache count depends on K/V heads and their widths, while each read and concatenation depends on query heads and value width. The output map can take an Hq×dv row back to D even when Hq×dv differs from D. Thus expanding query diversity need not expand the stored K/V width by the same factor. The independent D control in §4 deliberately exposes this distinction; it did not enforce the common dk=dv=D/Hq setting."}</Prose>
<Prose>{"For example, D=512, Hq=64 and dk=dv=128 produce an 8,192-coordinate concatenated row. With Hkv=8, the four attention maps have 9,437,184 weights without biases, and one request with 80 layers and 32,768 positions still has a 10-GiB K/V payload. A wider query/output route adds parameters and arithmetic despite leaving that fixed cache unchanged. Whether it improves quality or total inference cost is a new experiment, not a consequence of the byte equation."}</Prose>
<Prose><a href="https://arxiv.org/html/2503.09579v1">Cost-Optimal GQA</a> studies query-head, value-dimension and width choices under its declared training and inference budgets. Its search supports treating these as separate design axes; its fitted budget regimes and simplified parameter-based compute proxy do not constitute a universal optimal head count or a prediction for long-context attention work.</Prose>
<H3>{"Can learned map mixing still yield one compact stored head?"}</H3>
<Prose>{"The conversion mean used fixed equal coefficients. A richer initialization or training rule can learn static coefficients over original maps. “Static” means one trained coefficient is reused across input positions, rather than being computed anew for each token. A linear combination of affine maps can be folded into one affine map, including its bias. Return to the two explicit maps introduced before the scalar counterexample and change their coefficients."}</Prose>
<GqaAffineFoldingInvestigation/>
<Prose>{"At coefficients 0.25 and 0.75, the explicit projected-row sum and the folded-map route both give [−0.75,−0.5]. The folded map is [[0.25,0.75],[−0.75,0.5]] and bias [−0.5,1.5]. The coefficients need not be positive or sum to one: these are map-combination parameters, not the normalized probabilities over token records."}</Prose>
<div className="neural-equation" tabIndex={0} role="region" aria-label="Mathematical statement; scroll horizontally when needed"><MathBlock>{"\\sum_h\\alpha_h(W_hx+b_h)=\\left(\\sum_h\\alpha_hW_h\\right)x+\\sum_h\\alpha_hb_h."}</MathBlock></div>
<Prose><a href="https://arxiv.org/html/2407.10855v1">Weighted GQA</a> develops learned scalar or coordinate-weighted combinations under its T5 conversion experiments. Scalar coefficients fold as above; static coordinate weights also fold into the corresponding map rows and biases. Input-dependent coefficients generally cannot be replaced by one fixed map. This algebra establishes an inference representation, not lossless old-model behavior or a benchmark advantage in our local forecaster.</Prose>
<H3>{"Choosing or reproducing a configuration"}</H3>

<Prose>{"For a pretrained checkpoint, reproduce its query/KV counts, grouping, widths, positional convention and weights. Changing a configuration field alone is not a conversion. A changed projection shape needs transformed or newly learned parameters and an evaluated adaptation plan."}</Prose>

<Prose>{"For a new model, compare reasonable head counts using the actual task, training budget and serving constraints. A short parallel encoder workload has a different performance profile from long autoregressive decode. Small models can benefit from sharing under suitable contexts, and large models do not all require the same eight groups. Quality, cache capacity, kernel availability and distributed layout jointly determine the choice."}</Prose>

<Prose>{"Measure prefill and decode separately, with stated batch size, sequence lengths, dtype, device, kernels and synchronization. Distinguish latency per request from aggregate tokens per second and account for total model state, not only K/V payload. The transparent NumPy/PyTorch programs here teach correctness. Their Python loops and cache concatenation are not production scheduling advice; repeated concatenation copies existing storage, whereas a bounded or paged implementation can manage append positions directly."}</Prose>

<Prose>{"Finally, the "}<a href={"/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals"}>{"next topic, Multi-Head Latent Attention"}</a>{", changes a different representation choice: it compresses cache content into a latent representation and carefully handles positional components. Its actual computation cannot be inferred solely from a smaller-looking parameter count. The head/group/cache distinctions here are the prerequisite for understanding that design."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"8. Practice: reason about new inputs and constraints"}</H2>

<Prose>{"Try each question before opening its hint or solution. Exercises 1–5 check the first-pass route; 6–9 use deeper reasoning. The downloadable programs can verify your calculations, but calculate or explain the mechanism."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Count readers and stored representations"}</H3>

<Prose>{"A model has 12 query heads and 3 KV heads, using contiguous equal groups. Which KV head does query head 9 read? How many distinct attention distributions does one query position produce? If the key at one memory position in group 2 changes, which query heads can be affected? Must all of them change numerically?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compute the number of readers per group, then apply integer division to the zero-based query-head index."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Group size is "}<InlineMath>{"R=12/3=4"}</InlineMath>{". Head 9 reads group "}<InlineMath>{"\\lfloor9/4\\rfloor=2"}</InlineMath>{". There are 12 attention distributions, one per query head. The changed group-2 key can affect heads 8,9,10,11. A particular score can remain unchanged if its query is orthogonal to the key edit; later output effects can also cancel. Heads outside that group are unaffected by this isolated projected-key change at this operation. A changed original input may influence other projections too, so that is a different intervention."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Sharing does not mean agreement"}</H3>

<Prose>{"Two queries q0="}<code>{"[1,0]"}</code>{" and q1="}<code>{"[0,1]"}</code>{" share keys "}<code>{"[[2,0],[0,2]]"}</code>{" and values "}<code>{"[[1,0],[0,3]]"}</code>{", with head width 2. Compute each distribution and output. Then change the second value to "}<code>{"[2,3]"}</code>{". Which weights change, and by how much do the output x coordinates change?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The nonzero scaled logit is "}<InlineMath>{"2/\\sqrt2=\\sqrt2"}</InlineMath>{". Let "}<InlineMath>{"p=e^{\\sqrt2}/(1+e^{\\sqrt2})"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{""}<InlineMath>{"p\\approx0.804430"}</InlineMath>{". The weights are "}<code>{"[p,1−p]"}</code>{" and "}<code>{"[1−p,p]"}</code>{"; outputs are approximately "}<code>{"[0.804430,0.586711]"}</code>{" and "}<code>{"[0.195570,2.413289]"}</code>{". Changing a value leaves weights unchanged. The x-coordinate increases are "}<InlineMath>{"2(1-p)\\approx0.391141"}</InlineMath>{" and "}<InlineMath>{"2p\\approx1.608859"}</InlineMath>{". Distinct queries read the same value edit in different proportions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Count bytes without confusing units"}</H3>

<Prose>{"There are two independent requests, 12 layers, 3 KV heads, prefix length 1024, key width 64, value width 32 and two bytes per stored number. Calculate the K/V payload in bytes and MiB. The model has 12 query heads: what would the payload be under MHA with those widths? Name two reasons the measured physical allocation might exceed the compact payload."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<InlineMath>{"B L_{\\mathrm{layers}} L H_{kv}(d_k+d_v)s"}</InlineMath>{". A MiB is "}<InlineMath>{"2^{20}"}</InlineMath>{" bytes. The value width does not have to equal the key width."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The payload is "}<InlineMath>{"2\\times12\\times1024\\times3\\times96\\times2=14,155,776"}</InlineMath>{" bytes, or 13.5 MiB. MHA has four times as many K/V heads, so it needs 54 MiB for these tensors. Reserved/padded capacity, page rounding, quantization metadata, duplicated prefixes or replication across devices can add physical storage; position/cache bookkeeping and other model state also need memory. Do not label this payload as the entire application's memory usage."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Repair a non-square causal mask"}</H3>

<Prose>{"A decode chunk has query positions "}<code>{"[5,6]"}</code>{" and stored key positions "}<code>{"[0,1,2,3,4,5,6]"}</code>{". Write its legal mask. A developer passes only "}<code>{"is_causal=True"}</code>{" to an API documented to use an upper-left triangle for non-square inputs. What relation does that represent instead? Would GQA head sharing fix the error?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare actual logical positions, then separately consider local row indices 0 and 1."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The correct rows are "}<code>{"[1,1,1,1,1,1,0]"}</code>{" and "}<code>{"[1,1,1,1,1,1,1]"}</code>{". An upper-left triangle gives "}<code>{"[1,0,0,0,0,0,0]"}</code>{" and "}<code>{"[1,1,0,0,0,0,0]"}</code>{", as if queries were at local positions 0 and 1. Supply the intended explicit mask or an API-specific offset-aware causal bias. The head axis and causal-position axis are independent; fewer KV heads cannot repair the wrong legal set."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Design a fair conversion check"}</H3>

<Prose>{"After mean-pooling an MHA checkpoint, a researcher trains only the converted model for 100 more updates, then compares it with the original checkpoint. What extra control would help separate conversion recovery from additional training? Which data can select the checkpoint? Under what special condition is mean conversion exactly function-preserving before any further update?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Match the continuation budget, keep test data outside selection, and think about already-tied projection heads."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Continue an unchanged MHA branch for the same declared additional-update protocol, and report both models' before/after states. Use validation data for checkpoint selection and held-out test data for final assessment, with group/duplicate boundaries appropriate to the task. Mean conversion preserves the function if original K/V maps, including biases, are identical inside each target group and all relevant positional, mask and output conventions remain consistent. General group averaging is not lossless. Equal update counts also do not necessarily mean equal FLOPs, so state the comparison budget honestly."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Accumulate a shared value gradient"}</H3>

<Prose>{"Two readers attend to one shared scalar value with weights 0.2 and 0.7 at the selected memory position. Their upstream output derivatives are 3 and −1. There is one query position per reader, and the loss already contains any intended averaging. What is the shared value gradient from these two uses? Would dividing by group size be correct?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each use contributes attention weight times its upstream derivative. Add the contributions."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The gradient is "}<InlineMath>{"0.2\\times3+0.7\\times(-1)=-0.1"}</InlineMath>{". The contributions partly cancel. An extra division by two would change the defined objective's gradient; sharing sums uses. Any averaging desired by the loss must be specified in that loss and propagated normally."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. A cache ratio is not a timing result"}</H3>

<Prose>{"In an explicitly assumed timing model, 40% of a step is work that would become four times faster, while the remaining 60% is unchanged. Calculate the total speedup. If compact KV storage also falls fourfold, may you report the calculated time as measured GPU performance?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Normalize the original time to 1 and add the new times of the two parts."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"New time is "}<InlineMath>{"0.6+0.4/4=0.7"}</InlineMath>{", so speedup is "}<InlineMath>{"1/0.7\\approx1.429"}</InlineMath>{". It is a consequence of the assumed decomposition, not a measurement. Real kernels may change reuse, occupancy and communication, and the fourfold storage reduction does not establish that the affected time portion accelerates fourfold. Label modeled and measured quantities separately."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Account for distributed replicas"}</H3>

<Prose>{"A model has 32 query heads, 2 KV heads and 8 tensor-parallel devices. Under a simple layout that puts four queries on each device and replicates each KV head on the four devices reading it, how many physical KV-head copies exist in aggregate? How does that compare with its logical head count? Give another layout choice whose cost would need separate analysis."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each of the two logical KV heads has four physical copies. Avoid assuming that model parallelism always divides every tensor evenly."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"There are "}<InlineMath>{"2\\times4=8"}</InlineMath>{" physical KV-head copies, four times the logical count. The local query computations remain distinct, but the shared memory has been replicated. A communicating or differently sharded cache could reduce replication while adding communication or another scheduling constraint. The correct accounting depends on that algorithm, not on head count alone."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Interpret a forecast without leaking its future"}</H3>

<Prose>{"An observed prefix ends at point 19. You want five future predictions. A program computes the first forecast, then feeds the true point 20 before computing its second forecast. Has it performed a five-step generated rollout? If a learner edits observed point 7, can the old cache safely be reused unchanged? Explain both dependency errors."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Identify what information is available at the observation boundary, then what the cache's old states were functions of."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Feeding true point 20 makes the later calculation teacher-forced, not an autonomous rollout from the original boundary. A generated rollout feeds the model's own forecast as the next input. Editing point 7 changes projections and, in a multilayer causal network, can affect later hidden states and caches. Recompute the affected prefix states or use a correctly designed invalidation strategy; an old cache is valid for its original prefix, model and position convention. Caching accelerates an unchanged computation, not a changed history."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"What comes next?"}</H2>

<Prose>{"You can now distinguish query diversity from stored-head diversity, trace exact grouping and masks, count compact cache payload and evaluate what conversion actually preserves. Continue to "}<a href={"/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals"}>{"Multi-Head Latent Attention"}</a>{". It compresses the cached representation through learned latent coordinates, so its score/value reconstruction and rotary components need a new derivation rather than a relabeled head-count diagram."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"References and another way to learn"}</H2>

<H3>Another way to learn</H3>
<ul>
<li><a href="https://sebastianraschka.com/llms-from-scratch/ch04/04_gqa/">Raschka’s illustrated GQA guide</a> and <a href="https://github.com/rasbt/LLMs-from-scratch/tree/main/ch04/04_gqa">complete code chapter</a>: a compact alternate route from shared heads to decoder cache code. Inspect the dynamic append and transient repeated-K/V allocation rather than assuming they are preallocated production storage.</li>
<li><a href="https://www.3blue1brown.com/lessons/attention/">3Blue1Brown’s attention lesson, with video and written adaptation</a>: recover the query/key/softmax/value mechanism visually. Its matrix orientation can use query columns, whereas this lesson uses query rows.</li>
<li><a href="https://aclanthology.org/2023.emnlp-main.298.mp4">The authors’ EMNLP GQA presentation</a>, linked from the <a href="https://aclanthology.org/2023.emnlp-main.298/">ACL paper record</a>: an optional talk alongside the full written conversion and experimental protocol.</li>
</ul>
<H3>Technical references and deeper work</H3>
<ul>
<li><a href="https://arxiv.org/pdf/1911.02150">Shazeer, Fast Transformer Decoding: One Write-Head Is All You Need</a>: original MQA computation, batched/incremental bandwidth analysis and task-specific quality comparisons. The equal-total-parameter comparison changes FFN width.</li>
<li><a href="https://arxiv.org/html/2305.13245v3">Ainslie et al., GQA</a>: group construction, mean conversion, uptraining, T5 task results, timing, sharding motivation and limitations.</li>
<li><a href="https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html">PyTorch 2.14 SDPA</a>: exact shapes, GQA grouping, boolean masks, dropout, rectangular causal alignment and backend constraints.</li>
<li><a href="https://github.com/huggingface/transformers/blob/v5.17.0/src/transformers/models/llama/modeling_llama.py">Transformers v5.17.0 Llama source</a>: separately inspect native projections, RoPE, cache update, eager repeat and attention-backend dispatch.</li>
<li><a href="https://github.com/Dao-AILab/flash-attention#how-to-use-flashattention">FlashAttention usage/cache documentation</a>: contiguous grouped heads, rotary layout, explicit cache update and bottom-right unequal-length masking. Its in-place inference cache and backward support have separate contracts.</li>
<li><a href="https://developer.nvidia.com/blog/?p=120729">NVIDIA’s GQA hardware/software co-design discussion</a> and <a href="https://developer.nvidia.com/blog/tuning-flash-attention-for-peak-performance-in-nvidia-cuda-tile/">CUDA Tile FlashAttention implementation</a>: concrete group reuse, tiled reads and hardware-dependent occupancy. Their measured workloads are not timings of our CPU programs.</li>
<li><a href="https://arxiv.org/html/2310.06825v1#S2">Mistral 7B §2</a>: original 32-query/eight-KV configuration combined with a local attention window; the two mechanisms change different axes.</li>
<li><a href="https://arxiv.org/html/2309.06180v1">PagedAttention</a>: logical-to-physical block mapping and partially occupied allocation, distinct from reducing K/V projection width.</li>
<li><a href="https://arxiv.org/html/2503.09579v1">Cost-Optimal GQA</a>: separate query/value-width design decisions under declared resource assumptions.</li>
<li><a href="https://arxiv.org/html/2407.10855v1">Weighted GQA</a>: learned static map combinations and evaluated conversion protocols, with folding distinguished from token-dependent matching.</li>
</ul>
<H3>Programs, data and measured results</H3>
<ul>
<li><a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/mechanism-calculations.py" download>mechanism-calculations.py</a>: complete transparent operator, native SDPA and shared-gradient checks.</li>
<li><a href="/learn-code/grouped-query-attention-gqa-multi-query-attention-mqa/grouped-attention-cache.py" download>grouped-attention-cache.py</a>: vectorized compact reference, validated preallocated append and Q/K/V gradient comparisons.</li>
<li><a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/author-calculations.py" download>author-calculations.py</a>: complete learned forecaster, all fits, conversion, selection and cached/rollout checks.</li>
<li><a href="https://archive.ics.uci.edu/dataset/181/libras%2Bmovement">UCI Libras Movement</a>, <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/movement_libras.data" download>recordings</a>, <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/movement_libras.names" download>original metadata</a> and <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/data-provenance.md">attribution/split protocol</a>: source boundaries, duplicate handling and row-level limitations.</li>
<li><a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/author-results.json">Recorded outcomes</a>, <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/mechanism-fixtures.json">operator fixtures</a> and <a href="/learn-assets/grouped-query-attention-gqa-multi-query-attention-mqa/forecast-models.json">complete model/trace evidence</a>: reproduce or inspect the stated study; an edited interactive example is not a new held-out evaluation.</li>
</ul></section>
</GqaLessonProvider></div> };
export default lesson;
