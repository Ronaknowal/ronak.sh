// Generated from the complete Ring reading-flow manuscript; source-owned by scripts/generate-ring-attention-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {RingRotaryFlowFigure,RingTargetFigure,RingLossMassFigure,RingKVHeadConstraintFigure,RingHierarchyFigure,RingTokenBudgetFigure,RingContextAPIFlowFigure,RingBufferFlowFigure} from '../../components/lesson-labs/RingAttentionFlowFigures.jsx';
import {RingFlowProvider,RingWarmupLab,RingOwnershipFlowLab,RingScalarFlowLab,RingScalarActions,RingRecordsFlowLab,RingRecordsOwnershipFlowLab,RingGradientFlowLab,RingScalarGradientFlowLab,RingProjectionGradientFlowLab,RingDerivativeCheckFlowLab,RingRecordsActions} from '../../components/lesson-labs/RingAttentionFlowLabs.jsx';
import {RingSystemsProvider,RingMemoryFlowFigure,RingWorkFlowLab,RingTimelineFlowLab,RingCostFlowLab,RingScalingFlowLab,RingReshardFlowLab,RingMeshFlowLab,RingSystemsActions} from '../../components/lesson-labs/RingAttentionFlowSystems.jsx';
import {RingStudyProvider,RingMovementFlowLab,RingStudyActions,RingFlowProgram} from '../../components/lesson-labs/RingAttentionFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/ring-attention-flow.css';
export default {title:'Ring Attention & Sequence Parallelism',readTime:'~90 min read + investigations, programs and practice',hasIntegratedGuide:true,content:()=> <RingFlowProvider><RingSystemsProvider><RingStudyProvider><div className="neural-lesson neural-lesson-neutral lesson-flow ring-attention-flow">
<LessonIntro prerequisites="Weighted sums, array shapes and gradients; attention is refreshed here before it is distributed." sections={[["1-what-is-being-divided","1. What is being divided?"],["2-keep-the-queries-move-the-key-value-blocks","2. Keep the queries; move the key/value blocks"],["3-a-block-s-answer-is-not-enough","3. A block's answer is not enough"],["4-global-meaning-must-survive-local-storage","4. Global meaning must survive local storage"],["5-equal-token-counts-can-hide-unequal-work","5. Equal token counts can hide unequal work"],["6-communication-can-overlap-computation-but-it-takes-time","6. Communication can overlap computation, but it takes time"],["7-what-scales-when-we-add-devices","7. What scales when we add devices?"],["8-ulysses-and-the-overloaded-term-sequence-parallelism","8. Ulysses and the overloaded term “sequence parallelism”"],["9-training-gradients-must-get-home","9. Training: gradients must get home"],["10-a-real-attention-layer-under-a-different-execution-plan","10. A real attention layer under a different execution plan"],["11-from-a-cpu-reference-to-a-distributed-implementation","11. From a CPU reference to a distributed implementation"],["12-long-input-applications-and-one-token-decoding","12. Long-input applications and one-token decoding"],["13-diagnose-a-discrepancy-before-celebrating-a-speedup","13. Diagnose a discrepancy before celebrating a speedup"],["14-practice-repair-the-computation-not-just-the-labels","14. Practice: repair the computation, not just the labels"],["15-continue-learning","15. Continue learning"]]}>Trace a real attention read, keep its global identities, and follow both its forward information and returning derivatives.</LessonIntro>
<Prose opening="summary">{"Move blocks between devices while keeping the attention result the same. Change scores, values, logical positions and real trajectory points, then follow the contributions and communication they require. The comparisons separate a change to the model’s input from a change to its execution plan."}</Prose>

<Prose>{"Suppose four devices must read one long document. Giving each device a different quarter is easy. Letting a word near the end use information from the beginning is harder: that information now lives elsewhere."}</Prose>

<Prose>{""}<strong>{"Ring Attention keeps each device's questions in place and circulates the information those questions need."}</strong>{" Each device gradually builds the same attention result it would obtain if the entire sequence were available locally. The main change is where data lives and when it moves."}</Prose>

<Prose>{"In "}<a href={"/learn/path/full-curriculum/hyena-long-convolution-models?module=deep-learning-fundamentals"}>{"Hyena"}</a>{", the mixing operation changes. Here we preserve dense softmax attention and distribute its execution. That distinction matters: a systems optimization should first demonstrate equivalence, then establish its resource benefit."}</Prose>

<Prose opening="route">{"You need the idea of an attention-weighted average and basic array shapes. We refresh both below. On a first pass, follow the ownership picture, the four-value calculation, the causal-work grids and the real movement example. The backward derivation and communication model provide a deeper route for implementing or diagnosing a distributed system."}</Prose>

<H2>{"1. What is being divided?"}</H2>

<Prose>{"What must a position read before we decide where to store it? First refresh the actual operation from "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention"}</a>{": the same source row goes through three learned maps."}</Prose>

<RingWarmupLab view="projection"/>

<Prose>{"The cyan rows are two constructed input features: X has rows[1,0] and[0,1]. Amber cells are the learned maps, held fixed while you change a source coordinate. The violet result rows have different jobs. A query Q asks what information this position needs; a key K is the representation it compares against; a value V contains the channels it combines. These names describe a computation, not literal questions inside a computer."}</Prose>

<Prose>{"With row-vector convention, our tiny maps are Wq=I, Wk=[[1,1],[0,1]] and Wv=[[2,−1],[0,3]]. Multiplying X by each map gives Q=[[1,0],[0,1]], K=[[1,1],[0,1]] and V=[[2,−1],[0,3]]. For example, source row[1,0] selects each map's first row. Changing that source affects its query, key and value together; these are not unrelated manually supplied vectors."}</Prose>

<div className="neural-equation"><MathBlock>{"Q=XW_q,\\qquad K=XW_k,\\qquad V=XW_v."}</MathBlock></div>

<Prose>{"How does one query use those rows? Keep query0=[1,0] and let it compare with both keys; this refresh is bidirectional, so key1 is allowed even though its index is later."}</Prose>

<RingWarmupLab view="read"/>

<Prose>{"Follow the left drawing. Each dot product measures query/key agreement, then division by√2 sets the score scale for two channels. Scores are[1/√2,0]. Subtract their shared maximum, exponentiate and add the positive masses. Dividing each mass by their sum produces probabilities[.6697615493,.3302384507]. The shared divisor connects both scores: changing one score also changes the other probability."}</Prose>

<Prose>{"Follow the right drawing. Each probability multiplies the value row with the same record ID. Add the two resulting rows channel by channel. The first channel is.6697615493·2+.3302384507·0=1.3395230987. The second is.6697615493·(−1)+.3302384507·3=.3209538027. The read is a vector, not necessarily one of the source values."}</Prose>

<div className="neural-equation"><MathBlock>{"S=QK^T/\\sqrt d,\\qquad A=\\operatorname{softmax}(S+M),\\qquad O=AV."}</MathBlock></div>

<Prose>{"Here d is the query/key channel count. Softmax means the positive-mass normalization just traced, applied independently to each query row. The mask M is zero for allowed pairs and−∞ for forbidden pairs, whose mass is zero. A denotes attention probabilities; P will denote device count. Query/value widths can differ, although our first example uses equal widths."}</Prose>

<Prose>{"What becomes large with sequence length? The small score grid below separates every pair that must be evaluated from the tiles we choose to store temporarily."}</Prose>

<RingMemoryFlowFigure/>

<Prose>{"For L positions and one head, there are L² query/key comparisons. Increasing L from8 to16 makes four times as many pairs. Q/K/V/O are rows indexed by position and grow linearly; a full stored score grid grows quadratically. "}<strong>{"FlashAttention"}</strong>{" processes small tiles within a device and retains stable row summaries rather than the full grid. "}<strong>{"Ring Attention"}</strong>{" adds ownership across devices. They act at different levels of the memory hierarchy and can be combined. We next derive the summaries needed for either strategy. "}<a href={"https://arxiv.org/pdf/2205.14135"}>{"FlashAttention §3 and AppendixB"}</a>{""}</Prose>

<Prose>{"We use N for batch size, following this module's batch-first(N,L,D) feature convention. Inside attention, head separation gives Q shape(N,Hq,L,d) and K/V shape(N,Hkv,L,d) for this equal-width example. Hq counts query heads; Hkv counts stored key/value heads. Ordinary multi-head attention has Hkv=Hq. "}<a href={"/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals"}>{"GQA/MQA"}</a>{" teaches how query heads can share a KV head; fewer stored heads reduce payload without removing queries."}</Prose>

<Prose>{"A hypothetical float32 score matrix takes4NHqL²bytes. At N=1,L=1,000,000,Hq·d=8192 with MHA and two-byte Q/K/V/O elements, those four linear arrays alone take65,536,000,000bytes, or61.03515625GiB. A byte is a storage unit; GiB means2³⁰bytes. This named inventory excludes weights, optimizer state and other buffers. It is a calculation, not measured peak memory or a universal GPU context limit. Dividing positions does not automatically divide model state."}</Prose>

<H2>{"2. Keep the queries; move the key/value blocks"}</H2>

<Prose>{"We know what a query needs. Now let the input rows live on different devices while preserving that same read. Which rows stay, and which ones travel?"}</Prose>

<RingOwnershipFlowLab/>

<Prose>{"Use eight positions and four devices. Device 0 owns positions 0–1, device 1 owns 2–3, device 2 owns 4–5 and device 3 owns 6–7. Each has local Q, K and V for its positions."}</Prose>

<Prose>{"At round 0, every device combines its own queries with its own key/value block. It also prepares to send that block to its neighbor. At the next round, it combines the "}<strong>{"same queries"}</strong>{" with the incoming block. After four computations, it has visited every key/value block once."}</Prose>

<NeuralTable caption={"2. Keep the queries; move the key/value blocks"} headers={[<>{"Round"}</>,<>{"Device 0 uses KV from"}</>,<>{"Device 1 uses KV from"}</>,<>{"Device 2 uses KV from"}</>,<>{"Device 3 uses KV from"}</>]} rows={[[<>{"0"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2"}</>,<>{"3"}</>],[<>{"1"}</>,<>{"3"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2"}</>],[<>{"2"}</>,<>{"2"}</>,<>{"3"}</>,<>{"0"}</>,<>{"1"}</>],[<>{"3"}</>,<>{"1"}</>,<>{"2"}</>,<>{"3"}</>,<>{"0"}</>]]} />

<Prose>{"This table uses sends from rank i to rank (i+1) mod P. Rank means a process's index in the participating group. There are P block computations and P−1 necessary transfers to make every block available after its initial local use. Our forward schedule omits an unused final circulation. A library may circulate once more for convenient buffer ownership; account for the schedule actually implemented."}</Prose>

<Prose>{"Why circulate K and V together? A key identifies a value. If the two lose alignment, the weighting can be numerically valid while selecting the wrong information. Position IDs and document membership must travel with the records, too."}</Prose>

<Prose>{"Each query owner finally stores only its own output rows. Concatenating outputs in "}<strong>{"logical sequence order"}</strong>{", or keeping them sharded for a positionwise operation, preserves the next layer's meaning. Concatenating rank order is correct only when rank ownership is contiguous and ordered that way."}</Prose>

<Prose>{"The research design combines this circulation with blockwise computation and overlapping communication. Its empirical context-length and utilization results apply to its reported setups; “near-infinite” describes a scaling ambition, not unbounded resources or unlimited learned understanding. "}<a href={"https://arxiv.org/html/2310.01889v4"}>{"Liu, Zaharia and Abbeel, Ring Attention"}</a>{""}</Prose>

<Prose>{"Can we change transport order without changing the document? The current view keeps each global ID attached to its row."}</Prose>

<RingOwnershipFlowLab view="direction"/>

<Prose>{"Reversing circulation while preserving every record’s identity visits the same contributions in another order. In exact arithmetic, the answer is identical. Floating-point addition and rescaling can produce small rounding differences. Reversing the ring is not inherently a positional error; relabeling a received block as though it were local is."}</Prose>

<H2>{"3. A block's answer is not enough"}</H2>

<Prose>{"It is tempting to calculate attention separately within each KV block and average the resulting outputs. That loses how much probability mass each block should receive."}</Prose>

<Prose>{"We will switch from the two-channel projection example to four supplied scalar scores and values, so the next calculations isolate normalization. What goes wrong when each arriving block normalizes alone?"}</Prose>

<RingScalarFlowLab/>

<Prose>{"Consider one query with scores [0, ln2, ln4, 0] and scalar values [2, 8, 1, −2]. Its unnormalized weights are [1,2,4,1]. The correct weighted average is"}</Prose>

<div className="neural-equation"><MathBlock>{"o=\\frac{1(2)+2(8)+4(1)+1(-2)}{1+2+4+1}=\\frac{20}{8}=2.5."}</MathBlock></div>

<Prose>{"The first two records alone give 18/3=6. The last two alone give 2/5=0.4. Averaging those block outputs gives 3.2, which is wrong. Their denominators are 3 and 5, not equal. Combining them with those weights gives (3·6+5·0.4)/8=2.5."}</Prose>

<Prose>{"The correct answer keeps both numerator and mass. Can we store them without overflowing, and keep their scale consistent when a later score is larger? In the drawing, m is a block's largest score, ℓ is its positive mass and u its signed weighted-value sum, each using exponentials after subtracting m. The shared reference m* is the larger block maximum. Moving the block boundary changes which records contribute locally; reversing arrival changes only their visit order. A common offset adds the same number to every score."}</Prose>

<RingScalarFlowLab view="scale"/>

<Prose>{"Large scores introduce another problem: computing exp(1000) overflows ordinary floating point. Subtracting the same maximum from every score preserves softmax, because the common exponential factor cancels between numerator and denominator."}</Prose>

<Prose>{"We can apply that correction incrementally. For each query, retain just three quantities:"}</Prose>

<div className="neural-equation"><MathBlock>{"m=\\max_{j\\text{ visited}}s_j,\\quad\n\\ell=\\sum_{j\\text{ visited}} e^{s_j-m},\\quad\nu=\\sum_{j\\text{ visited}}e^{s_j-m}v_j."}</MathBlock></div>

<Prose>{"m is a scalar score, ℓ a scalar normalizer, and u a vector with the value width. The output is u/ℓ. These are summaries of all visited keys, not trainable model parameters."}</Prose>

<Prose>{"When a new block has maximum b, set m′=max(m,b). Convert the old summary to the new exponential reference with α=exp(m−m′), then add the new contributions:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell'=\\alpha\\ell+\\sum_{j\\in\\text{new}}e^{s_j-m'},\\qquad\nu'=\\alpha u+\\sum_{j\\in\\text{new}}e^{s_j-m'}v_j."}</MathBlock></div>

<Prose>{"The common scale matters for "}<strong>{"both"}</strong>{" accumulated quantities. It is not a correction for accidentally counting a token twice. The online-normalizer construction also admits associative merging of independently computed summaries. "}<a href={"https://arxiv.org/pdf/1805.02867"}>{"Milakov and Gimelshein, §3 and §3.1"}</a>{""}</Prose>

<Prose>{"Here is our calculation in the stable representation:"}</Prose>

<NeuralTable caption={"3. A block's answer is not enough"} headers={[<>{"State"}</>,<>{"m"}</>,<>{"ℓ"}</>,<>{"u"}</>,<>{"u/ℓ"}</>]} rows={[[<>{"After records 0–1"}</>,<>{"ln2"}</>,<>{"1.5"}</>,<>{"9"}</>,<>{"6"}</>],[<>{"Rescale old summary to ln4"}</>,<>{"ln4"}</>,<>{"0.75"}</>,<>{"4.5"}</>,<>{"6"}</>],[<>{"Add records 2–3"}</>,<>{"ln4"}</>,<>{"2"}</>,<>{"5"}</>,<>{"2.5"}</>]]} />

<Prose>{"The rescaling line changes the representation without changing its average. The second block contributes 1.25 to ℓ and 0.5 to u. If we neglect rescaling, we obtain 9.5/2.75≈3.4545 instead."}</Prose>

<Prose>{"What if an arriving block has no allowed record? It has nothing to add; it must not erase a valid earlier read."}</Prose>

<RingScalarFlowLab view="empty"/>

<Prose>{"Initialize m=−∞, ℓ=0, u=0. The first valid block gets α=0. A completely masked block contributes nothing. If a query has no valid key in any block, softmax is undefined as a probability distribution: explicitly return the chosen zero-output convention and mark the row invalid, rather than turn 0/0 into a meaningful prediction. The reference program uses zero output and log-normalizer −∞ for that case."}</Prose>

<Prose>{"The record, scale and permission views share the same four-record case. Try a different value, move the block boundary, reverse arrival or add1000 to every score. An offset/order change preserves the mathematical answer; an input or permission change may alter it. Pinning preserves every score/value/permission, block/order, offset and output; reset restores the worked case. Practice1 supplies the independent27/7 case."}</Prose>

<RingScalarActions/>

<H2>{"4. Global meaning must survive local storage"}</H2>

<Prose>{"The summary algebra assumes we have read the intended records. Storage movement must also preserve which records are allowed to interact."}</Prose>

<RingRecordsFlowLab/>

<Prose>{"A causal language model lets query position q attend only to keys k≤q. In distributed storage, a record's local array index is not its position in the document."}</Prose>

<Prose>{"Device 2's first query may be global position 4. When keys 0–1 arrive, both are allowed. Applying a fresh lower-triangular mask to the local 2×2 block would incorrectly forbid key 1 for that query. Instead evaluate the global condition on each pair."}</Prose>

<Prose>{"This distinction becomes even more important when records are deliberately interleaved to balance work. A useful record has at least a payload and its logical identity:"}</Prose>

<Prose>{""}<code>{"(document_id, global_position_within_document, key_vector, value_vector)"}</code>{""}</Prose>

<Prose>{"With packed documents, the allowed condition becomes "}<code>{"same_document AND key_position <= query_position"}</code>{". Padding adds another valid-record condition. Without document membership, the beginning of one document can attend into an unrelated previous document even when every numeric position comparison succeeds."}</Prose>

<Prose>{"A position label also affects the vectors themselves. What changes if a transferred row is assigned a new local phase?"}</Prose>

<RingRotaryFlowFigure/>

<Prose>{"Position encodings must use the same identities. With a two-dimensional rotary pair, unrotated vectors (1,0), angular frequency 1, query position 5 and key position 1, the unscaled rotated dot product is cos4≈−0.6536. Resetting those positions to local indices 0 and 1 changes it to cos1≈0.5403. Moving already correctly rotated Q/K records is safe; computing rotations from wrong indices changes the model. Review "}<a href={"/learn/path/full-curriculum/positional-encodings-sinusoidal-learned-rope-alibi?module=deep-learning-fundamentals"}>{"Positional Encodings"}</a>{" for why the relative phase appears."}</Prose>

<Prose>{"The phase must keep its global meaning; so must the next-token target. Which arrow crosses an owner boundary?"}</Prose>

<RingTargetFigure/>

<Prose>{"Training targets have an analogous boundary. Suppose input tokens are [10,11,12,13,14,15] and the task predicts the next token. The targets are [11,12,13,14,15,ignore]. Splitting first and shifting each half independently produces [11,12,ignore,14,15,ignore], silently losing the target across the partition boundary. Construct logical next-token targets before sharding, with document boundaries respected, or explicitly exchange boundary information."}</Prose>

<Prose>{"Targets survive the split. Now preserve their contribution to the same training objective: count valid items before dividing."}</Prose>

<RingLossMassFigure/>

<Prose>{"Finally, averaging local mean losses is wrong when ranks contribute different valid-token counts. If one rank has three valid tokens with mean loss 2 and another has one with mean loss 6, the global mean is (3·2+1·6)/4=3, not 4. Gradient normalization and the framework's sum/average collectives must implement that same global objective. The official DeepSpeed integration explains target shifting and valid-token-weighted loss aggregation. "}<a href={"https://www.deepspeed.ai/tutorials/ulysses-alst-sequence-parallelism/"}>{"DeepSpeed Ulysses integration, “Nuances” and “Loss averaging”"}</a>{""}</Prose>

<Prose>{"The small seven-position fixture now makes those conditions editable. It has twoheads, threechannels and uneven3/2/2owners; unlike the scalar example, its Q/K/V arrays are independently supplied diagnostic tensors. Its packed documents have IDs[0,0,0,1,1,1,1]. Keep the correct-mask output distinct from the ring execution's same-mask output: two implementations can agree perfectly on an incorrect mask."}</Prose>

<RingRecordsFlowLab view="metadata"/><RingRecordsOwnershipFlowLab/>

<Prose>{"Change the selected record's logical position, document membership or validity. Those edits alter the intended permission predicate. The same current metadata appears in both logical and stored-order views. Rearranging ownership alone must retain exact record IDs and output order."}</Prose>

<RingRecordsFlowLab view="tensors"/>

<Prose>{"The next view changes actual query/key/value channels. All live reads recompute from current arrays and metadata; changing an inspected head/key is only a view change. Keep the current case while exploring how content and permission affect different intermediate values."}</Prose>

<H2>{"5. Equal token counts can hide unequal work"}</H2>

<Prose>{"Correct IDs let us change storage order safely. Does giving each device the same number of positions also give it the same amount of work?"}</Prose>

<RingWorkFlowLab view="pairs"/>

<Prose>{"Consider causal attention over positions 0–15, split four ways. Query 0 has one allowed key; query 15 has sixteen. Four consecutive queries near the end therefore cost more than four near the beginning."}</Prose>

<Prose>{"With c=L/P positions per device, zero-based contiguous rank i has"}</Prose>

<div className="neural-equation"><MathBlock>{"W_i=ic^2+\\frac{c(c+1)}2"}</MathBlock></div>

<Prose>{"allowed query–key pairs. The first term counts all previous chunks; the second counts the local triangle. For c=4, totals are [10,26,42,58]. The busiest device has 5.8 times the first device's useful pair work."}</Prose>

<Prose>{"The individual block counts make the imbalance visible:"}</Prose>

<NeuralTable caption={"5. Equal token counts can hide unequal work"} headers={[<>{"Query owner \\ KV owner"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2"}</>,<>{"3"}</>,<>{"Total"}</>]} rows={[[<>{"0"}</>,<>{"10"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"10"}</>],[<>{"1"}</>,<>{"16"}</>,<>{"10"}</>,<>{"0"}</>,<>{"0"}</>,<>{"26"}</>],[<>{"2"}</>,<>{"16"}</>,<>{"16"}</>,<>{"10"}</>,<>{"0"}</>,<>{"42"}</>],[<>{"3"}</>,<>{"16"}</>,<>{"16"}</>,<>{"16"}</>,<>{"10"}</>,<>{"58"}</>]]} />

<Prose>{"A block whose every pair is masked can be skipped. A mixed block may still execute entire matrix tiles, so useful pairs are not automatically executed FLOPs."}</Prose>

<Prose>{""}<strong>{"Striping"}</strong>{" assigns rank i positions i, i+P, i+2P, and so on. For our example, rank 0 receives [0,4,8,12], rank 1 [1,5,9,13], and so forth. Each owner now has early and late queries. Its useful work is"}</Prose>

<div className="neural-equation"><MathBlock>{"W_i=c(i+1)+\\frac{Pc(c-1)}2."}</MathBlock></div>

<Prose>{"The totals become [28,32,36,40]. Each pair of owner blocks contains either c(c+1)/2 or c(c−1)/2 valid cells, depending on their rank relationship. The input sequence has not been semantically reordered; its records have different storage owners. The Striped Attention paper connects this arrangement to per-round work balance and explicitly discusses tile-granularity limits. "}<a href={"https://arxiv.org/html/2311.09431v1"}>{"Brandon et al., especially §2.2–§4"}</a>{""}</Prose>

<Prose>{"A "}<strong>{"zigzag"}</strong>{" arrangement divides the sequence into 2P consecutive pieces and pairs an early piece with its mirrored late piece. Here the four owners receive [0,1,14,15], [2,3,12,13], [4,5,10,11], and [6,7,8,9]. All four have 34 useful pairs. The paired-chunk approach appears in PyTorch's context-parallel implementation discussion. "}<a href={"https://discuss.pytorch.org/t/distributed-w-torchtitan-breaking-barriers-training-long-context-llms-with-1m-sequence-length-in-pytorch-using-context-parallel/215082"}>{"PyTorch authors, “Tensor Sharding”"}</a>{""}</Prose>

<Prose>{"Does exact pair balance guarantee the best kernel? No. In our deliberately simple cost calculation, sum the maximum work of any rank in each synchronized round. The resulting critical work is:"}</Prose>

<NeuralTable caption={"5. Equal token counts can hide unequal work"} headers={[<>{"Layout"}</>,<>{"One-cell tiles"}</>,<>{"2×2 tiles"}</>,<>{"4×4 tiles"}</>]} rows={[[<>{"Contiguous"}</>,<>{"58"}</>,<>{"60"}</>,<>{"64"}</>],[<>{"Striped"}</>,<>{"40"}</>,<>{"48"}</>,<>{"64"}</>],[<>{"Zigzag"}</>,<>{"34"}</>,<>{"36"}</>,<>{"64"}</>]]} />

<Prose>{"We count a whole tile whenever any cell is valid, with no special triangular kernel optimization. At 4×4 granularity, all layouts have the same critical executed-cell count. These numbers are exact for this defined toy scheduler. They are not GPU timings, and a production kernel's treatment of diagonal tiles may differ."}</Prose>

<Prose>{"Which positions belong together if each query still sees the same past?"}</Prose>

<RingWorkFlowLab view="ownership"/>

<Prose>{"The grid puts the same logical query–key pairs in the new storage order. Its row and column labels retain their global positions. Change the arrangement, then follow how each owner's useful total changes. No future cell becomes allowed merely because it moves to another column."}</Prose>

<Prose>{"Can a small custom change beat one of those standard arrangements?"}</Prose>

<RingWorkFlowLab view="swap"/>

<Prose>{"Choose two actual position IDs and exchange their storage owners. This preserves the set of pairs and the number of rows per owner. The round maximum can change even when the grand total stays fixed. Now change only the rank names:"}</Prose>

<RingWorkFlowLab view="rename"/>

<Prose>{"Renaming every owner cyclically preserves this symmetric ring's critical work. It is a useful null comparison; deleting global position labels would instead change the meaning of the mask."}</Prose>

<Prose>{"What useful work survives the kernel's tile granularity?"}</Prose>

<RingWorkFlowLab view="tiles"/>

<Prose>{"An outlined tile executes whenever any of its cells is allowed in this deliberately simple scheduler. The table separates useful pairs from executed cells for each synchronized round. If one cell in a4×4 block is allowed, the entire block is charged. This explains the64-cell null above without claiming a real GPU uses this exact rule."}</Prose>

<H2>{"6. Communication can overlap computation, but it takes time"}</H2>

<Prose>{"The tile picture separated mathematical work from executed work. Now ask when the next tile is actually ready: compute and transport are different dependencies."}</Prose>

<RingTimelineFlowLab/>

<Prose>{"Violet bars mark compute intervals; cyan bars mark key/value transport on the same microsecond axis. A solid dependency comes from the preceding compute; a dashed dependency comes from the receive completing. Follow both into the next compute start. With four owners, C=4µs and D=7µs, the serial schedule is37µs, ideal overlap is25µs and compute alone is16µs. There are three transfers, with none after the last useful read. Zero duration has zero drawn width."}</Prose>

<Prose>{"A device can multiply its queries by the current KV block while the next block is in transit. It must not read the receive buffer before the transfer completes or overwrite the send buffer while transport still needs it."}</Prose>

<Prose>{"This requires buffer ownership and dependencies, not merely an asynchronous function name. A useful timeline has a compute lane and a communication lane. The next compute block depends on both the current compute finishing and the incoming data becoming ready. An overly early wait serializes work; a missing wait can produce races."}</Prose>

<H3>{"Translate shapes into bytes and time"}</H3>

<Prose>{"The timing sliders changed durations directly. To explain where those durations could come from, start with local row count c, owner count P and the buffers already drawn in "}<strong>{"What is being divided?"}</strong>{""}</Prose>

<RingCostFlowLab/>

<Prose>{"Each bar's length is its share of the listed byte total, with the exact byte count beside it. Changing c changes the local tensor sizes; changing P changes global L=Pc and whether a next-packet buffer is needed. These are calculations, not measured allocations. The head geometry introduces three more quantities:"}</Prose>

<RingCostFlowLab view="heads"/>

<Prose>{"Hq is the number of queries' heads, Hkv the stored key/value heads and d their channel width. "}<a href={"/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals"}>{"GQA/MQA"}</a>{" explains the sharing. This calculator requires Hq divisible by Hkv; an invalid grouping produces a visible explanation instead of a stale inventory."}</Prose>

<Prose>{"What if several sequences are processed together, or an output buffer can be reused?"}</Prose>

<RingCostFlowLab view="batch"/>

<Prose>{"N multiplies these attention buffers and products. The existing systems program calls batch size B, so "}<strong>{"N=B"}</strong>{" in its formulas. Its alias option excludes a separate output allocation only under an explicitly valid storage-reuse assumption. The other allocations do not disappear. Two-byte and four-byte storage change bytes, not the number of attention pairs."}</Prose>

<Prose>{"For an explanatory model, let each rank own c positions, batch size be one, and count only the QKᵀ and AV matrix products. A dense block requires approximately"}</Prose>

<div className="neural-equation"><MathBlock>{"F_{\\text{block}}=4c^2H_qd"}</MathBlock></div>

<Prose>{"floating-point operations when one multiply and one add count separately. Softmax, projections, normalization, mask construction and other layer work are excluded. A key/value transfer sends"}</Prose>

<div className="neural-equation"><MathBlock>{"S_{\\text{KV}}=2cH_{kv}d\\,s"}</MathBlock></div>

<Prose>{"bytes, where s is bytes per stored element. K and V account for the leading 2. Sending and receiving the same-size payload are distinct network directions; do not add both and then divide by an already aggregate bandwidth without defining that bandwidth."}</Prose>

<Prose>{"What throughput, bandwidth and latency would turn those counts into a schedule?"}</Prose>

<RingCostFlowLab view="network"/>

<Prose>{"The three current hardware assumptions are explicitly hypothetical: effective TFLOP/s for these matrix products, one-direction GB/s for these messages and fixed message latency in microseconds. Every dimension comes from the same inventory above. The new timeline shows the resulting computed C and D. There is no real-device label or fabricated benchmark."}</Prose>

<Prose>{"Suppose effective compute throughput is F, effective one-direction link bandwidth is R and message latency is a. Then C=Fblock/F and D=a+SKV/R approximate one round's compute and transfer times. Under ideal independent overlap,"}</Prose>

<div className="neural-equation"><MathBlock>{"T_{\\text{serial}}=PC+(P-1)D,\\qquad\nT_{\\text{overlap}}=C+(P-1)\\max(C,D)."}</MathBlock></div>

<Prose>{"The final compute still has to finish. With C≥D this model hides transfer time; with C<D it exposes network waits. Contention, launch overhead, synchronization, nonuniform causal work and resource interference can all make the measured time worse."}</Prose>

<Prose>{"Here are "}<strong>{"calculated hypothetical values"}</strong>{", not specifications or measurements for any GPU: P=4, Hq=8, Hkv=2, d=64, s=2 bytes, F=100×10¹² FLOP/s, R=50×10⁹ bytes/s and a=2 microseconds."}</Prose>

<NeuralTable caption={"Translate shapes into bytes and time"} headers={[<>{"Positions per rank c"}</>,<>{"Compute C, µs"}</>,<>{"Transfer D, µs"}</>,<>{"Serial total, µs"}</>,<>{"Ideal overlap total, µs"}</>]} rows={[[<>{"128"}</>,<>{"0.336"}</>,<>{"3.311"}</>,<>{"11.274"}</>,<>{"10.268"}</>],[<>{"1024"}</>,<>{"21.475"}</>,<>{"12.486"}</>,<>{"123.357"}</>,<>{"85.899"}</>],[<>{"4096"}</>,<>{"343.597"}</>,<>{"43.943"}</>,<>{"1506.219"}</>,<>{"1374.390"}</>]]} />

<Prose>{"The rows have different "}<strong>{"global sequence lengths"}</strong>{". They show increasing arithmetic intensity, not a claim that a larger input runs faster. Compute grows quadratically in c while transfer payload grows linearly; small shards can leave too little computation to cover communication."}</Prose>

<Prose>{"Memory accounting needs equally explicit boundaries. For c=1024 in this example, Q is 1,048,576 bytes, one KV block is 524,288 bytes and a next-block receive buffer adds another 524,288. A float32 accumulated numerator is 2,097,152 bytes; two float32 row statistics add 65,536. If output is distinct it adds 1,048,576. An illustrative 128×128 float32 score tile for each of eight heads adds 524,288. These listed allocations total 5,832,704 bytes."}</Prose>

<Prose>{"That is a "}<strong>{"forward allocation model"}</strong>{". Aliasing or kernel fusion can change it; backward may retain owned K/V separately and requires gradients and saved/recomputed activations. The CPU reference stores entire arrays and whole local score blocks, so it does not achieve this modeled device footprint. Neither calculation is measured peak GPU memory."}</Prose>

<Prose>{"The next section changes which length is held fixed. Keep the current head and network assumptions while comparing those two distinct questions; selecting a more favorable assumed bandwidth does not establish an actual speedup."}</Prose>

<H2>{"7. What scales when we add devices?"}</H2>

<Prose>{"The preceding schedule used one specific size. Adding devices can mean dividing that same job or giving the system a larger job. Those are different experiments."}</Prose>

<Prose>{"How fast could the same total sequence run on more owners?"}</Prose>

<RingScalingFlowLab/>

<Prose>{"The horizontal owner counts are spaced by powers of two; the vertical values are calculated microseconds and are directly labelled. The table shows global L and local c beside every point. All points reuse the current assumptions above. Only owner counts that evenly divide the chosen L appear in this equal-size model."}</Prose>

<Prose>{"With "}<strong>{"fixed global L"}</strong>{", adding ranks gives each rank fewer queries. Dense attention matrix-product work per rank is about 4BL²Hq d/P. This is strong scaling. Eventually messages, synchronization and too-small kernels limit speedup. In our hypothetical model with L=4096, moving from P=4 to P=16 does not give a fourfold speedup: ideal overlap time moves from about 85.90 to 70.66 microseconds because the shards become communication-bound."}</Prose>

<Prose>{"How much longer a sequence can the same local shard size represent?"}</Prose>

<RingScalingFlowLab view="local"/>

<Prose>{"Now each owner retains c rows. Read the growing global length in the table before comparing duration: a higher P also means more incoming blocks. This is a larger job, not the preceding job with more devices."}</Prose>

<Prose>{"With "}<strong>{"fixed local c"}</strong>{" and L=Pc, activation capacity can grow with P. However, each query must now visit P KV blocks. Per-rank attention work grows with P; aggregate work grows with P². This weak-scaling setup does not keep step duration constant."}</Prose>

<Prose>{"What if the total number of dataset tokens is fixed instead?"}</Prose>

<RingTokenBudgetFigure/>

<Prose>{"Both pictures contain the same sixteen token IDs. Four length-four sequences need4×16=64 dense attention pairs; two length-eight sequences need2×64=128. The total token count stays16 while attention work doubles. The rectangles represent sequences; this constructed dataset comparison is separate from our seven-position gradient fixture."}</Prose>

<Prose>{"For a "}<strong>{"fixed dataset token budget"}</strong>{", doubling context length means processing half as many sequences. Attention work per sequence grows fourfold, so the attention portion of total dataset work doubles. Positionwise projection/MLP work per token is approximately unchanged. State which quantity is held fixed before interpreting a scaling curve."}</Prose>

<Prose>{"The distinction also prevents a learning mistake: fitting a million-token sequence in memory does not demonstrate that a model learned useful million-token dependencies. Position-encoding behavior, training lengths, data quality, optimization and task evaluation remain necessary. A retrieval test measures a particular ability, not end-to-end comprehension of every long document."}</Prose>

<H2>{"8. Ulysses and the overloaded term “sequence parallelism”"}</H2>

<Prose>{"The scaling calculation kept all query heads on each owner. Could moving head slices instead of circulating key/value blocks change the communication plan? "}<strong>{"Ulysses"}</strong>{" makes exactly that change."}</Prose>

<RingReshardFlowLab/>

<Prose>{"Every cell has a persistent token ID t and head ID h. The white outline follows the selected cell. Start with a board containing local tokens and all heads. The middle board holds all tokens but only local heads. The final board restores the original token partition. Read its cell identities, not only its dimensions."}</Prose>

<Prose>{"Start with L/P positions and all H heads per rank. An all-to-all operation routes head slices so each rank obtains all L positions for H/P heads. It computes attention on those heads, then another all-to-all restores the sequence partition. With L=8, H=4 and P=2:"}</Prose>

<NeuralTable caption={"8. Ulysses and the overloaded term “sequence parallelism”"} headers={[<>{"Stage"}</>,<>{"Rank 0"}</>,<>{"Rank 1"}</>,<>{"Elements per rank, per channel"}</>]} rows={[[<>{"Before resharding"}</>,<>{"Tokens 0–3, heads 0–3"}</>,<>{"Tokens 4–7, heads 0–3"}</>,<>{"16"}</>],[<>{"During attention"}</>,<>{"Tokens 0–7, heads 0–1"}</>,<>{"Tokens 0–7, heads 2–3"}</>,<>{"16"}</>],[<>{"After resharding"}</>,<>{"Tokens 0–3, heads 0–3"}</>,<>{"Tokens 4–7, heads 0–3"}</>,<>{"16"}</>]]} />

<Prose>{"Holding the whole sequence for "}<strong>{"fewer heads"}</strong>{" does not restore the original unsharded all-head payload. This is why Ulysses is not limited to the unchanged single-device context capacity. It can also use efficient local attention kernels. "}<a href={"https://arxiv.org/html/2309.14509v2"}>{"DeepSpeed-Ulysses, §3 and §4.1"}</a>{""}</Prose>

<Prose>{"For equal MHA heads and ideal even partitioning, the before/after per-rank payload for one tensor is BLHd/P elements. Each rank sends a fraction (P−1)/P of that to others in one reshard. Q, K, V and O together therefore send 4BLHd·s·(P−1)/P² bytes per rank for these two forward reshard stages. This arithmetic counts application-level nonlocal bytes, not physical network hops, switch contention or a collective's actual schedule."}</Prose>

<Prose>{"For our Ring schedule, forward sends per rank total 2(P−1)B(L/P)Hkv d·s bytes. Comparing these expressions helps identify a tradeoff, but it is not a universal speed ranking. Ring may fit a topology or head arrangement better; all-to-all may move less data but demand a different network pattern. Hybrid approaches can use multiple mesh dimensions."}</Prose>

<Prose>{"Can the same route work for different dimensions, and can an incorrect inverse hide behind a correct shape?"}</Prose>

<RingReshardFlowLab view="dimensions"/>

<Prose>{"Changing L, H and P changes the actual boards. This equal-partition construction requires L and H divisible by P; no previous board is presented as a current result when that contract fails. For a fresh example use12tokens,6heads and3owners."}</Prose>

<RingReshardFlowLab view="fault"/>

<Prose>{"Exchange two arbitrary transmitted cells. Element count stays the same, but the restored mismatch count exposes the incorrect identity. Use Reset exact reshard to remove that deliberate fault."}</Prose>

<Prose>{"What changes when several query heads share only two stored KV heads?"}</Prose>

<RingKVHeadConstraintFigure/>

<Prose>{"The eight query heads can split four ways. The two key/value heads cannot split into four nonempty disjoint sets. Empty outlined places denote the missing head partitions, not zero-valued key vectors."}</Prose>

<Prose>{"Head partitioning has practical constraints. H must be divisible by P for the simple equal Ulysses transformation above. GQA complicates matters: with Hq=8, Hkv=2 and P=4, four disjoint owners cannot each receive a nonempty separate KV-head subset. A capable implementation may replicate or specially route KV heads, use a hybrid partition, or limit that mesh dimension. “Impossible for every implementation” is too strong; “unchanged MHA resharding always works” is also wrong."}</Prose>

<Prose>{"Terminology depends on the framework. In Megatron, earlier "}<strong>{"sequence parallelism"}</strong>{" divides certain activations, such as normalization/dropout regions, in conjunction with tensor parallelism. "}<strong>{"Context parallelism"}</strong>{" extends partitioning across the sequence through the network, with additional attention communication. Inspect the implementation rather than assuming every "}<code>{"sequence_parallel"}</code>{" option means a KV ring. "}<a href={"https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/context_parallel.html"}>{"Megatron Core context parallelism overview"}</a>{""}</Prose>

<Prose>{"Other mesh dimensions answer different ownership questions:"}</Prose>

<NeuralTable caption={"8. Ulysses and the overloaded term “sequence parallelism”"} headers={[<>{"Strategy"}</>,<>{"What is divided?"}</>,<>{"What must still be coordinated?"}</>]} rows={[[<>{"Ordinary data parallelism"}</>,<>{"Different examples among model replicas"}</>,<>{"Parameter gradients"}</>],[<>{"Tensor parallelism"}</>,<>{"Parts of a layer's operations/weights"}</>,<>{"Partial layer results"}</>],[<>{"Pipeline parallelism"}</>,<>{"Different depth stages"}</>,<>{"Activations and gradients between stages"}</>],[<>{"Context parallelism"}</>,<>{"Positions of the same sequence"}</>,<>{"Cross-position operations and shared-weight gradients"}</>],[<>{"Expert parallelism"}</>,<>{"Different experts"}</>,<>{"Routed tokens and expert results"}</>],[<>{"FSDP/ZeRO"}</>,<>{"Model-state storage across a chosen group"}</>,<>{"Parameter availability and gradient/optimizer ownership"}</>]]} />

<Prose>{"How do those four independent ownership decisions identify a process?"}</Prose>

<RingMeshFlowLab/>

<Prose>{"Each tuple lists data, tensor, pipeline and context coordinates, in that order: (DP,TP,PP,CP). The white pair holds three coordinates fixed and varies only the selected dimension. Select CP to see two owners of positions in the same example; select DP to compare replicas handling different examples."}</Prose>

<Prose>{"A simple orthogonal DP2×TP2×PP2×CP2 mesh has 16 ranks. It does not mean sixteen independent examples. A CP group participates in the same sequence, and any replicated shared parameters require their contributions to be combined consistently. Real frameworks may overlap or combine groups for model-state sharding; that must be reflected in the actual communication plan."}</Prose>

<Prose>{"Could a machine cluster use both routes at different levels?"}</Prose>

<RingHierarchyFigure/><RingSystemsActions/>

<Prose>{"The within-group arrows redistribute head slices. Across groups, the arrows circulate labelled key/value packets while queries remain fixed. This is a constructed two-level topology: it explains a hybrid dependency graph, not the actual speed of a named cluster. A real implementation must also define process groups, head sharing, masks, buffer lifetimes and the backward reductions."}</Prose>

<H2>{"9. Training: gradients must get home"}</H2>

<Prose>{"The reshard pictures checked output identities. Training asks a stronger question: how much did each input and learned parameter contribute to the loss? A key on one rank may influence queries on several other ranks, so its derivative cannot come only from its local queries."}</Prose>

<H3>{"Start with the same four-value read"}</H3>

<Prose>{"Suppose the loss increases one unit when our scalar output increases one unit. This incoming derivative is G=∂Loss/∂o=1. What credit reaches a value, and what credit reaches a score?"}</Prose>

<RingScalarGradientFlowLab/>

<Prose>{"The first bars are value derivatives: moving a value changes the weighted mean by its probability. The second bars are score derivatives. Increasing one score moves weight toward that record's value and away from the "}<strong>{"complete weighted mean"}</strong>{". Each small drawing subtracts the same current mean from that record's value, then multiplies by its probability. Orange dashed arrows are backward derivative routes; orange numbers are derivatives, not probabilities."}</Prose>

<Prose>{"For our unchanged scores[0,ln2,ln4,0] and values[2,8,1,−2], o=2.5. The value derivatives are[1,2,4,1]/8. The score derivatives are[−0.0625,1.375,−0.75,−0.5625]. They sum to zero because a common score offset leaves the output unchanged. Try a different value in "}<strong>{"A block's answer is not enough"}</strong>{" and return here: the signed score credit changes with that same current read."}</Prose>

<H3>{"Reconstruct a probability tile and add every query's contribution"}</H3>

<Prose>{"To follow channel vectors and remote contributions, switch back to "}<strong>{"IDs survive storage"}</strong>{"'s seven-position, two-head, three-channel fixture. Its current mask and tensors are retained. The incoming derivative now has one entry for every output channel; call that full array G=∂Loss/∂O. It can be positive, negative or zero."}</Prose>

<RingGradientFlowLab view="upstream"/>

<Prose>{"The selected query's G row is used in every probability-gradient calculation for that query. The signed partials come from the query owners labelled beside them. Each plus node adds its owner's new contribution to the accumulating packet. The final arrow delivers the total to the original key/value owner. Local dQ stays with its query owner."}</Prose>

<Prose>{"What if the only queries counted were the ones on that key's original owner?"}</Prose>

<RingGradientFlowLab/>

<Prose>{"The live sentence compares the complete derivative with that deliberately incomplete local-only derivative. Initially key4 and query4 belong to document1; key4 can affect query4 on owner1 as well as queries5–6 on owner2. This avoids a misleading owner-local example in which dropping remote contributions happens to be a null. Select another key to inspect a different dependency, including a genuinely forbidden cross-document pair."}</Prose>

<Prose>{"In formal notation, A is the current row-normalized probability matrix, S the scaled scores and G the incoming output gradient. Backpropagation gives"}</Prose>

<div className="neural-equation"><MathBlock>{"dV=A^TG,\\qquad dA=GV^T,"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"dS_{ij}=A_{ij}\\left(dA_{ij}-\\sum_k A_{ik}dA_{ik}\\right),\n\\qquad dQ=dSK/\\sqrt d,\\quad dK=dS^TQ/\\sqrt d."}</MathBlock></div>

<Prose>{"The subtraction is the same competition we just traced in one scalar read. The sum for a query row is G_i·O_i, because O_i is already the weighted sum of its values. It is "}<strong>{"the same current G row"}</strong>{", not a derivative selected from another position."}</Prose>

<Prose>{"Forward saved the stable log-normalizer z_i=m_i+lnℓ_i. Recompute each small tile's scores from its labelled Q and K, then recover allowed probabilities as"}</Prose>

<div className="neural-equation"><MathBlock>{"A_{ij}=e^{S_{ij}-z_i}."}</MathBlock></div>

<Prose>{"Forbidden pairs contribute zero. If every pair for a query is forbidden, our explicit zero-output convention uses zero derivatives; it does not manufacture a normalized distribution. The reference guards z=−∞ before exponentiating. This lets backward reconstruct tiles instead of saving an L×L probability matrix."}</Prose>

<Prose>{"Can a numerical perturbation independently check the same derivative?"}</Prose>

<RingDerivativeCheckFlowLab/>

<Prose>{"Perturb the selected current Q, K or V coordinate by ±ε, compute J=sum G·O using the same mask and input elsewhere, and divide the objective difference by2ε. The analytic derivative and finite difference belong to that same objective. A smaller ε reduces truncation error only until floating-point cancellation dominates; the visible error is a useful diagnostic, not a guarantee that arbitrarily small ε is better."}</Prose>

<Prose>{"The preserved small reference comparisons against dense derivatives and Torch autograd had maximum differences below7×10⁻¹⁶; the selected finite differences were below1.9×10⁻¹¹. Deliberately omitting remote KV contributions differed by about0.865. Those numbers belong to the retained fixture and evidence; arbitrary live edits have their own current differences. These checks prove bounded CPU arithmetic, not an untested distributed GPU backend."}</Prose>

<H3>{"Carry gradients through the learned maps"}</H3>

<Prose>{"So far Q,K,V were already projected arrays. Return to "}<strong>{"What is being divided?"}</strong>{"'s two source rows and fixed learned2×2 maps. A researcher training those maps also needs their parameter gradients and the derivative of X."}</Prose>

<RingProjectionGradientFlowLab/>

<Prose>{"Each drawing multiplies the actual source transpose Xᵀ by the current projected derivative. This sums every position's contribution to a shared map. In the initial X=I example, the resulting dW equals the corresponding projected derivative; edit a source coordinate above to see why that equality is a special case, not a rule."}</Prose>

<div className="neural-equation"><MathBlock>{"dW_q=X^T dQ,\\quad dW_k=X^T dK,\\quad dW_v=X^T dV."}</MathBlock></div>

<Prose>{"What reaches a source row that fed all three projections?"}</Prose>

<RingProjectionGradientFlowLab view="source"/>

<Prose>{"The three actual row-gradient drawings are separate routes into the same source coordinates. Their sum is"}</Prose>

<div className="neural-equation"><MathBlock>{"dX=dQW_q^T+dKW_k^T+dVW_v^T."}</MathBlock></div>

<Prose>{"The initial incoming array is G=[[1,−0.5],[0.2,0.3]], and both rows contribute to J=sum G·O. Adjusting its entries changes the objective being differentiated; it does not change the forward attention function."}</Prose>

<Prose>{"Shared parameters add one more reduction issue. If one owner computes its part of XᵀdQ and another computes the remaining part, the required parameter gradient is their "}<strong>{"sum"}</strong>{". An all-reduce configured to average those two partials returns half the wanted result. A framework that averages over P context ranks must compensate by P at the appropriate loss/gradient boundary. Ordinary data-parallel replica averaging can still be intentional; identify the relevant group and the intended global objective before multiplying anything."}</Prose>

<Prose>{"For "}<strong>{"IDs survive storage"}</strong>{"'s unequal valid-target counts, the earlier global loss was (3·2+1·6)/4=3. Form local loss sums divided by the global valid count, then sum their derivatives. Equal averaging of local means gives4 and a different gradient. Correct attention derivatives cannot repair an objective that already lost boundary targets or changed their weights."}</Prose>

<Prose>{"The complete new composition below imports the exact scratch attention reference, projects X, propagates dQ/dK/dV through all maps and compares every source/parameter derivative with ordinary PyTorch SDPA plus autograd. It also checks central finite differences, all-forbidden rows, uneven ownership, both directions, permutations and invalid contracts."}</Prose>

<RingFlowProgram file="projected-ring-gradients.py" title="Complete projected forward, shared-map gradients and independent library checks"/>

<Prose>{"Run "}<code>{"python projected-ring-gradients.py"}</code>{" beside "}<code>{"ring-attention-reference.py"}</code>{" with NumPy and Torch. The executed CPU float64 comparison covered18 native cases and all92 source/parameter coordinates. Its maximum native difference was7.994×10⁻¹⁵; maximum finite-difference error was2.104×10⁻⁹. These are the new composition's results, separate from the preceding smaller fixture's retained checks. The learned maps here are row-vector matrices of shape(input,output); the ordinary Torch route implements the same contractions directly."}</Prose>

<Prose>{"Dropout needs an additional identity contract. Recomputed probability tiles must reproduce the same random mask for the same global batch/head/query/key identities. A rank-local random stream can change the computation when owner count changes. Our references disable dropout; adding it requires deliberate forward, backward and random-state changes."}</Prose>

<RingRecordsActions/>

<Prose>{"Pin a complete record/gradient case to retain its tensors, upstream, mask metadata, ownership, outputs and derivatives while trying a new case. Reset clears even an invalid draft that never changed the numerical input. The separate scalar and real-model families retain their own pins and resets."}</Prose>

<H2>{"10. A real attention layer under a different execution plan"}</H2>

<Prose>{"The small examples isolated correctness. Now keep the same attention and gradient ideas while replacing constructed arrays with a fully retained learned model from "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention"}</a>{". Its input is a Libras movement trajectory:45 recorded two-dimensional hand-centroid positions. The task chooses among15 movement classes; it is not full sign-language translation."}</Prose>

<Prose>{"Where are those45 points before any neural processing?"}</Prose>

<RingMovementFlowLab view="source"/>

<Prose>{"The connected path joins points in recorded sequence order on fixed[0,1] coordinate axes. Cyan is the current path; the dashed neutral path is the original. White selects the edited point; violet selects an attention query and the amber cross selects a donor when those roles are introduced below. Source77 has recorded class4; source20 has recorded class1. Those observed labels belong to the unchanged recordings."}</Prose>

<H3>{"Build a feature row from each coordinate pair"}</H3>

<Prose>{"What actually enters the first learned map?"}</Prose>

<RingMovementFlowLab view="input"/>

<Prose>{"The left matrix has45 rows and two raw coordinates per row. First center each coordinate with2x−1. The selected centered row touches the learned stem's24×2 matrix, then24 learned biases are added and tanh is applied. The full result is45×24: each point has a24-channel feature row. The small cells expose actual selected intermediates; brightness shows magnitude, cyan outlines negative cells, amber marks learned parameters and violet marks computed tensors. A white line always identifies the same selected row."}</Prose>

<Prose>{"This is a rowwise map, not a summary over time. In mathematical row-vector notation a24-channel feature is tanh(x_centered W_stem+b). The stored Python matrix is24×2, or(output,input), so its program computes x_centered@W_stem.T. This transpose changes the storage convention, not the function. Only the stem and final classifier have biases in this particular model."}</Prose>

<H3>{"Project, read and rejoin the two heads"}</H3>

<Prose>{"How does a24-channel feature become two attention heads?"}</Prose>

<RingMovementFlowLab view="projections"/>

<Prose>{"The same current45×24 features multiply three separate learned24×24 matrices for queries, keys and values. Each24-channel result splits into two12-channel heads. Follow the selected row into both45×12 matrices. No Q/K/V biases are present. These maps are the classifier's learned parameters, separate from our constructed2×2 warmup maps."}</Prose>

<Prose>{"Which recorded points contribute to a selected query's read?"}</Prose>

<RingMovementFlowLab view="query"/>

<Prose>{"Choose a head, query point and donor point. Donor disk "}<strong>{"area"}</strong>{" is proportional to that head/query's actual attention probability; zero probability has zero disk area. The selected donor's amber cross is an identity marker, not a probability. This model is bidirectional and has no explicit positional encoding, causal mask or dropout. Do not interpret its path drawing as a claim that its attention learned causality."}</Prose>

<Prose>{"Can we trace all twelve channel operations for that one donor?"}</Prose>

<RingMovementFlowLab view="donor"/>

<Prose>{"The current Q and K rows multiply channel by channel; their products sum and divide by√12 to give the score. Softmax normalizes over all45 donors. That donor's probability multiplies each of its V channels. The final twelve-channel row is the sum over "}<strong>{"all"}</strong>{" weighted donor values, not only the selected donor. Moving the donor selector changes inspection; changing a real input point changes Q,K,V and the read."}</Prose>

<Prose>{"Where do both heads' outputs go?"}</Prose>

<RingMovementFlowLab view="join"/>

<Prose>{"Concatenation joins two twelve-channel reads into one24-channel row, retaining its point ID. A learned bias-free24×24 output map transforms that row. The plus node adds the saved stem feature from the same row and channel: the residual path bypasses attention. Neither concatenation nor this addition averages the45 positions."}</Prose>

<H3>{"From45 feature rows to15 class probabilities"}</H3>

<Prose>{"How can one trajectory have one classification?"}</Prose>

<RingMovementFlowLab view="task"/>

<Prose>{"The first drawing sums the45 residual rows separately in each channel and divides by45, leaving a single24-channel mean. The next drawing multiplies that mean by the15×24 classifier matrix and adds its15 biases. The signed bars are the resulting logits. Softmax across these15 logits supplies class probabilities; the largest probability chooses the class. The recorded target is never an input to this computation."}</Prose>

<Prose>{"All2,751 parameters are retained:72 in the stem(24·2+24),1,728 in Q/K/V(3·24·24),576 in the output map and375 in the classifier(15·24+15). There are no hidden new normalization or position layers. "}<a href={"/learn-assets/ring-attention-sequence-parallelism/movement-attention-model.json"}>{"The complete frozen model"}</a>{" and "}<a href={"/learn-assets/ring-attention-sequence-parallelism/data-provenance.md"}>{"data/provenance"}</a>{" allow this exact route to run offline."}</Prose>

<Prose>{"The earlier duplicate-aware sequence split retained330 distinct trajectories:220 fitting,50 validation and60 assessment. Four declared variants each used three declared seeds and200 Adam epochs at0.01. Checkpoints were selected by validation macro-F1, then cross-entropy and earlier epoch. We reuse the predeclared seed101 two-head model; there is no new fit or model selection for a favorable systems result."}</Prose>

<H3>{"Change execution while holding the learned function fixed"}</H3>

<Prose>{"Does dividing those learned Q/K/V rows change the answer?"}</Prose>

<RingMovementFlowLab view="ownership"/>

<Prose>{"Initially45 positions split as12,11,11,11. Each arriving packet contributes to the same selected head/query; its point IDs are listed beside the current m,ℓ,u and read. Storage and direction alter arrival order, while the fixed weights, edited input and attention semantics stay the same. Both directions preserve the dense result within floating-point tolerance."}</Prose>

<Prose>{"What happened after one particular packet?"}</Prose>

<RingMovementFlowLab view="arrivals"/>

<Prose>{"Choose a round and output channel. The drawing sends accumulated numerator u into division and total mass ℓ into the denominator. The maximum m is a reference for exponentials, "}<strong>{"not the divisor"}</strong>{". The live sentence always compares the final current-input dense and ring outputs, even when an earlier partial round is selected."}</Prose>

<NeuralTable caption={"Change execution while holding the learned function fixed"} headers={[<>{"Source trajectory"}</>,<>{"Recorded class"}</>,<>{"Predicted class, both executions"}</>,<>{"Retained maximum attention-output difference"}</>]} rows={[[<>{"77"}</>,<>{"4"}</>,<>{"5"}</>,<>{"2.22×10⁻¹⁵"}</>],[<>{"20"}</>,<>{"1"}</>,<>{"2"}</>,<>{"1.78×10⁻¹⁵"}</>]]} />

<Prose>{"Both inherited classifications are wrong. A correct execution plan preserves a learned model's mistakes too. Source77's class5 probability is about0.8111; it does not certify correctness or calibration."}</Prose>

<H3>{"Change input and distinguish two different comparisons"}</H3>

<Prose>{"How does moving a real point change the learned function?"}</Prose>

<RingMovementFlowLab view="edit"/>

<Prose>{"The point selector uses zero-based IDs: point22 is frame23. For source77, add0.10 to that point's x coordinate within[0,1]. The largest probability change is about0.00960. Switch explicitly to source20 and subtract0.15 from point9's x coordinate(frame10); the corresponding retained change is about0.00394. Other edits may have small, large or null effects. An edited path has no newly certified movement label."}</Prose>

<RingMovementFlowLab view="probabilities"/>

<Prose>{"The fifteen-row table separates current dense probability minus original probability from current dense versus current ring probability. The first measures an input-induced change to the learned function; the second tests the execution plan on that same changed input. The signed bars show the first comparison with a true zero baseline. All fifteen probabilities remain visible, including classes that were not chosen."}</Prose>

<RingStudyActions/>

<Prose>{"Pin all45 points, execution settings and current probabilities, then make another edit or ownership change. The pin comparison is local to this frozen model. This CPU experiment tests the two supplied recordings and controlled edits, not every possible input; it makes no GPU timing or peak-memory claim."}</Prose>

<H2>{"11. From a CPU reference to a distributed implementation"}</H2>

<Prose>{"The classifier shows the full learned route. Implementation now separates two tasks: reproduce the arithmetic on one CPU, then move the actual buffers between processes. Start with the complete scratch program; its storage shortcuts are explicitly part of its teaching scope."}</Prose>

<Prose>{"The complete program below needs NumPy. It simulates labeled ownership on one CPU, including uneven shards, causal masks and backward accumulation. Run it as "}<code>{"python ring-attention-reference.py"}</code>{"; the author used Python 3.12.14 and NumPy 2.3.5. Its printed forward difference is approximately 2.22×10⁻¹⁶. The separate "}<a href={"/learn-assets/ring-attention-sequence-parallelism/attention-partition-study.py"}>{"partition study"}</a>{" also needs Torch and the local data/model files; it creates the real-input and derivative evidence in "}<a href={"/learn-assets/ring-attention-sequence-parallelism/partition-results.json"}>{"partition-results.json"}</a>{". The "}<a href={"/learn-assets/ring-attention-sequence-parallelism/systems-calculations.py"}>{"systems calculation"}</a>{" computes the ownership and cost tables without GPU dependencies."}</Prose>

<Prose>{"Read the loops as an ownership proof. "}<code>{"query_ids"}</code>{" stay fixed for an owner; "}<code>{"key_ids"}</code>{" change at every step. "}<code>{"allowed[np.ix_(query_ids,key_ids)]"}</code>{" preserves global mask meaning. The numerical guard handles empty rows, and the final assignment places output back at its logical positions."}</Prose>

<Prose>{"The program intentionally allocates a dense reference and all shards in one process. To turn this into an efficient GPU operation, replace global-array access with actual owned buffers, use tiled/fused attention kernels, transport labeled KV shards, implement backward reduction, and check the result under the chosen dtype and backend."}</Prose>

<RingFlowProgram file="ring-attention-reference.py" title="Complete scratch forward and recomputed backward"/><RingFlowProgram file="attention-partition-study.py" title="Complete retained real-input and derivative study"/><RingFlowProgram file="systems-calculations.py" title="Complete ownership, work and resource calculations"/>

<Prose>{"What must an ordinary library shard together?"}</Prose>

<RingContextAPIFlowFigure/>

<Prose>{"The two-rank drawing retains global row IDs across the Q,K,V sequence axis and the position-dependent buffer. The context makes supported SDPA calls communicate, then the unshard operation restores logical O rows. An attention call's ordinary shape is(N,H,L,d); position buffers can have another rank but must declare the same sequence split. This is an API-level dependency picture, not the following CPU transport program."}</Prose>

<Prose>{"For a real backend, begin with its maintained end-to-end example. The PyTorch context-parallel tutorial uses an "}<strong>{"experimental"}</strong>{" context that shards supplied buffers and replaces supported scaled-dot-product attention calls. Its example also restores logical output ordering for comparison. Declaring a "}<code>{"DTensor"}</code>{" shard alone does not automatically implement a correct KV ring. Position-dependent buffers must be included consistently. The author reviewed the 2.14 documentation; the GPU example was not executed here. "}<a href={"https://docs.pytorch.org/tutorials/unstable/context_parallel.html"}>{"PyTorch context-parallel tutorial"}</a>{""}</Prose>

<Prose>{"If writing lower-level communication, PyTorch 2.14's "}<code>{"batch_isend_irecv"}</code>{" takes a list of "}<code>{"P2POp"}</code>{" records and returns request objects; it does not take an "}<code>{"async_op=True"}</code>{" parameter. Requests, stream dependencies and buffer lifetimes must be respected. Blocking “send to next, then receive from previous” on every rank can deadlock in a cycle. Separate the correctness of a communication schedule from its hoped-for overlap. The installed API documentation was inspected for this lesson. "}<a href={"https://docs.pytorch.org/docs/stable/distributed.html"}>{"PyTorch distributed documentation"}</a>{""}</Prose>

<Prose>{"The independent ring-flash-attention project supplies several attention layouts and packed-sequence APIs, but its README also records numerical/buffer limitations and unsupported dropout/window settings. Read those restrictions and the actual version's tests before adoption; a method name does not prove that every mask, dtype or head configuration works. "}<a href={"https://github.com/zhuzilin/ring-flash-attention"}>{"Project README and tests"}</a>{""}</Prose>

<H3>{"Move the buffers between real processes"}</H3>

<Prose>{"The arithmetic reference above is deliberately single-process. "}<a href={"/learn-assets/ring-attention-sequence-parallelism/distributed_ring.py"}>{"distributed_ring.py"}</a>{" is the complete next implementation step: separate PyTorch processes keep local Q/K/V, send K/V to the next rank, receive from the previous rank, and return accumulated key/value gradients to their owners. It uses ordinary "}<code>{"torch.distributed"}</code>{" primitives; it does not import an opaque Ring Attention function. This small CPU/Gloo protocol is also the lowest useful abstraction for learning buffer ownership before a fused GPU backend."}</Prose>

<Prose>{"Why do real sends need a valid-length record and distinct receive storage?"}</Prose>

<RingBufferFlowFigure/>

<Prose>{"The packet drawing shows two constructed three-ID packets padded to four slots; the folded2×2 ID display is only a way to fit those four entries on screen. Crossed padding is storage, not a real key. The program uses the maximum actual shard length for its padded tensor shape, not this picture's illustrative capacity. Its backward packet contains K,V,dK,dV. A posted send keeps its source alive until completion; a receive becomes usable only after its request finishes."}</Prose>

<Prose>{"Use a PyTorch 2.14.0 environment with Gloo support and run "}<code>{"torchrun --standalone --nproc-per-node=3 distributed_ring.py"}</code>{" on one machine. The example uses two heads, equal Q/K/V width three, a single causal sequence and no dropout; the sequence length is "}<code>{"2*world_size+1"}</code>{", making ownership uneven. Each rank knows shard lengths from "}<code>{"all_gather"}</code>{"; global starts determine the causal mask. Padded packets have a common shape for transport, but only the owner's valid rows enter the attention calculation. The complete program has now run in separate CPU/Gloo processes with one, two and three ranks, including a fresh eight-position/three-rank case. Forward outputs and each owner’s Q/K/V gradients matched native scaled-dot-product attention and automatic differentiation at the stated float64 tolerances. The Windows verification launcher supplied the standard rank/master environment with "}<code>{"USE_LIBUV=0"}</code>{"; each rank used one CPU thread. These are correctness checks, not timings."}</Prose>

<Prose>{"Forward processing needs P block visits and P−1 transfers. Backward processing makes P visits "}<strong>{"and P transfers"}</strong>{": the packet contains K, V, dK and dV, and after a complete circuit its partial sums are back at the original owner. dQ stays with its query owner. This is the exact missing operation in a backward implementation that only passes forward parity. The externally supplied "}<code>{"upstream"}</code>{" is ∂L/∂O. "}<strong>{"Carry gradients through the learned maps"}</strong>{" and "}<code>{"projected-ring-gradients.py"}</code>{" supply the complete projection-weight and source-gradient step. The transport program isolates Q/K/V ownership so those two implementations can be understood and checked separately."}</Prose>

<RingFlowProgram file="distributed_ring.py" title="Complete ordinary PyTorch CPU/Gloo multi-process implementation"/>

<Prose>{"The local score tile uses O(H c c_max) memory, with O(H c d) local queries/output and O(H c_max d) circulating packet storage. Per-rank full-sequence arithmetic remains O(H c L d); distributing storage does not make dense attention subquadratic. Backward recomputes score tiles instead of retaining all probabilities. The tiny validator separately creates full arrays and uses "}<code>{"scaled_dot_product_attention"}</code>{" plus autograd as an independent oracle; those deliberately small validation allocations are not part of the ring routines' storage bound. The retained native run verifies those forward and owner-specific gradient comparisons; it does not measure this storage model on a GPU."}</Prose>

<Prose>{""}<code>{"rotate"}</code>{" submits paired send/receive requests together, waits for completion, and only then returns new storage. The immediate wait makes the schedule synchronous; calling an asynchronous API is not evidence of communication overlap. Gloo/CPU proves a different engineering claim from NCCL/CUDA streams, fused kernels or multi-node performance. Those remain specialized production extensions. The concrete transport API and request-lifetime contract are in "}<a href={"https://docs.pytorch.org/docs/2.14/distributed.html"}>{"PyTorch's distributed reference"}</a>{"."}</Prose>

<Prose>{""}<strong>{"Take control."}</strong>{" Run one, two and three ranks. Then change the validation sequence length to eight at three ranks and retain the uneven-shard checks. Finally remove only the last backward rotation to see which owner receives whose partial sums. Repair the error before introducing any faster kernel."}</Prose>

<details><summary>Hint and reasoned solution</summary>

<Prose>{"One rank requires no actual transfer but still computes a complete local forward/backward. The shard counts and offsets must change with eight positions; no rank may attend to padded positions. With P−1 backward transfers the packet at a rank is not its original packet after a full circuit, and it is missing the final return even when every query contribution was added. Matching a global gradient sum is insufficient: compare each owner's dK/dV against its exact logical indices, using nonuniform upstream gradients as supplied. A valid extension to packed documents carries document identities and combines a same-document condition with the global causal comparison; using a local triangle alone fails. This change requires explicit metadata transport, not just a new drawing."}</Prose>

</details>

<H2>{"12. Long-input applications and one-token decoding"}</H2>

<Prose>{"The same ownership problem appears outside a text document. A video clip may contribute a long sequence of patch tokens. A scientific instrument may produce a long sampled trajectory. A learning agent may consume multiple episodes represented by observations, actions and rewards. In each case, the design question is whether distant interactions are valuable enough to justify dense attention and its communication. These are application possibilities, not claims that every such workload should use Ring Attention."}</Prose>

<Prose>{"Our hand-trajectory example is a small version of this input/output contract. Expanding to a long video adds data encoding, training and task-evaluation problems that distributing the attention layer cannot solve. A long-context retrieval result should not be silently renamed a general reasoning result."}</Prose>

<Prose>{"Inference also contains two different phases. "}<strong>{"Prefill"}</strong>{" processes many query positions against the prompt, resembling the attention calculation we studied. "}<strong>{"Autoregressive decoding"}</strong>{" often adds one query per sequence at a time. With only one query, there may be little computation available to hide movement of a large KV cache."}</Prose>

<Prose>{"Could the small query move while the large cache stays put?"}</Prose>

<RingScalarFlowLab view="decode"/>

<Prose>{"Return explicitly to "}<strong>{"A block's answer is not enough"}</strong>{"'s same current four-record scalar case. The first drawing broadcasts q to two stationary KV shards and performs a MAX collective to agree on m*. The second rescales both local ℓ and u, performs their SUM collective, then divides. MAX and SUM have different jobs; averaging separately normalized shard outputs repeats the earlier3.2 error."}</Prose>

<Prose>{"One alternative is to keep KV shards stationary, distribute the new query, compute each shard's local summary (m,ℓ,u), and merge summaries. Choose global maximum m*, rescale each shard's denominator and numerator by exp(m−m*), sum them, and divide. This is the same stable-merge algebra with a different communication plan. The query and result are small relative to a long cache, though collective latency and batching still matter."}</Prose>

<Prose>{"If one shard has no allowed keys, it contributes zero after the finite common reference is chosen. If "}<strong>{"every"}</strong>{" shard is empty, the global maximum remains−∞: guard this before exp(m−m*) to avoid−∞−(−∞). No probability distribution exists. Our references choose zero output and zero derivatives, and label that convention instead of treating zero as normalized attention."}</Prose>

<Prose>{"Paged cache allocation solves another problem—how cache blocks are stored and reused. It can coexist with distributed ownership. Neither paging nor Ring Attention by itself specifies scheduling, cache eviction, beam reordering or multi-request batching. Those belong to serving-system design."}</Prose>

<Prose>{"The useful question is therefore “which information should move for this workload?” Full-prompt attention, a single new token and a training backward pass have different dependency graphs. Do not infer a proprietary model's architecture from its advertised context window or response latency."}</Prose>

<H2>{"13. Diagnose a discrepancy before celebrating a speedup"}</H2>

<Prose>{"The decoding route changed which object moved. Before optimizing any such route, locate a discrepancy in its identity, objective, arithmetic or synchronization contract. Use the following checks to turn a vague failure into a precise experiment."}</Prose>

<NeuralTable caption={"13. Diagnose a discrepancy before celebrating a speedup"} headers={[<>{"Symptom"}</>,<>{"A targeted investigation"}</>,<>{"What the result would establish"}</>]} rows={[[<>{"Outputs disagree only after a shard boundary"}</>,<>{"Compare global positions, document mask and target alignment"}</>,<>{"Whether sharding changed the intended sequence"}</>],[<>{"Forward agrees, training diverges immediately"}</>,<>{"Compare dQ/dK/dV and shared-weight gradient normalization"}</>,<>{"Whether all loss contributions reach their owners"}</>],[<>{"NaNs at early causal queries"}</>,<>{"Inspect a fully masked incoming block and empty-row convention"}</>,<>{"Whether stable summary updates handle no contribution"}</>],[<>{"More ranks make execution slower"}</>,<>{"Separate C, message latency, transfer time and waits"}</>,<>{"Whether smaller shards expose communication"}</>],[<>{"Memory greatly exceeds an O(L/P) estimate"}</>,<>{"Inventory saved activations, logits, buffers and aliasing"}</>,<>{"Which actual allocations the asymptotic slogan omitted"}</>],[<>{"Different layout appears fast but changes quality"}</>,<>{"Compare identical weights/input/masks and logical ordering first"}</>,<>{"Whether it is still the same attention operation"}</>],[<>{"Correctness differs with dropout or resume"}</>,<>{"Inspect global random identities and saved recomputation state"}</>,<>{"Whether the same stochastic computation is being compared"}</>]]} />

<Prose>{"For a meaningful real benchmark, fix model weights, input lengths/batch, attention semantics, dtype, backward setting and hardware topology. Include warmup and proper device synchronization, measure peak memory with defined allocator semantics, and report whether tokens/second means one long sequence or several shorter ones. Count end-to-end time as well as the attention kernel. Preserve failures and out-of-memory cases rather than plot guessed replacements. These requirements describe a separate performance experiment; the calculations here are not measured GPU benchmarks."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"14. Practice: repair the computation, not just the labels"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Merge a new pair of blocks"}</H3>

<Prose>{"Scores are [ln3,0,ln2,0] and values [4,−1,7,2]. The first two and last two entries arrive separately. Calculate the final output and explain why averaging the two local outputs is wrong."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the unnormalized weights [3,1,2,1]. Keep numerator and denominator separately for each block."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The block numerators are 11 and 16; denominators are 4 and 3. Output is 27/7≈3.85714. Local outputs are 11/4 and 16/3; their equal average is not weighted by their probability masses. In the stable maximum-ln3 representation, ℓ=7/3 and u=9, giving the same answer. Reversing arrival or adding a common score constant changes neither exact result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A valid shape, an invalid mask"}</H3>

<Prose>{"A query's global position is 5. An incoming block contains keys at positions [0,3,6] from the same document. Which entries are allowed under causal attention? What if key 3 belongs to a different packed document?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The local query index is irrelevant. There are two logical conditions to check."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Positions 0 and 3 are allowed; 6 is future. With different document membership, key 3 is forbidden too. Apply same-document and k≤q to the labeled records. A local triangle over array indices can miss both distinctions. An all-masked block contributes zero; it should not reset summaries from earlier valid blocks."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Rebalance a smaller sequence"}</H3>

<Prose>{"Take L=12 and P=3. Compare per-rank causal pair counts for contiguous chunks of four, striping, and paired early/late two-position pieces. What is invariant across the layouts?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Every global query q contributes q+1 allowed pairs. Sum these over each owner's actual positions."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Contiguous totals are [10,26,42]. Striped owners [0,3,6,9], [1,4,7,10], [2,5,8,11] yield [22,26,30]. Zigzag owners [0,1,10,11], [2,3,8,9], [4,5,6,7] each yield 26. All total 78=12·13/2, preserving the same allowed pairs. Only their ownership changes. Tile granularity and communication still determine executed time."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Diagnose an overlap claim"}</H3>

<Prose>{"Four ranks each require C=4µs per block; each transfer takes D=7µs. Compute serial and ideal-overlap totals. A slide says “communication is free because the calls are asynchronous.” Repair it."}</Prose>

<details><summary>Hint</summary>

<Prose>{"There are four compute rounds and three required transfers. The next round must wait for the slower prerequisite."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Serial time is 16+21=37µs. Ideal overlap is 4+3·7=25µs, compared with compute-only 16µs. Overlap helps but exposes 9µs beyond compute-only. Asynchronous submission permits overlap; it neither removes dependencies nor guarantees sufficient bandwidth or compute duration."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Check the bytes before choosing a mesh"}</H3>

<Prose>{"Use B=2, c=512, Hq=16, Hkv=4, d=64 and two-byte K/V elements. How many bytes does one KV transfer send per rank? For P=8, what is the forward total in our schedule? Would changing only Hq to 32 double these bytes?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count both K and V, batch size, stored head count, width and bytes. Forward sends happen P−1 times."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"One transfer is 2·2·512·4·64·2=1,048,576 bytes. Seven sends total 7,340,032 bytes. Changing only query heads does not alter stored KV payload; it changes query/output storage and attention computation. A backend that materializes repeated KV copies would have a different implementation cost and should be identified explicitly."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Forward passes; gradients fail"}</H3>

<Prose>{"A ring implementation produces correct outputs but accumulates dK only from queries on the key's original owner. Explain the missing dependency and propose a numerical test."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write dK as a sum over query rows. A key can influence more than its owner's rows."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"dK=dSᵀQ/√d includes all allowed queries. Remote query owners must contribute to each key's gradient, and their contributions must be reduced back to its owner. Use small asymmetric Q/K/V, a nonuniform upstream gradient and a mask with cross-owner valid pairs. Compare dense and distributed gradients, then perturb one remote key coordinate and estimate the loss derivative by a central finite difference. A test where every mask is strictly owner-local would miss the bug."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Preserve the objective at a boundary"}</H3>

<Prose>{"One rank has two valid prediction targets with mean loss 1; another has six with mean loss 3. What should the global mean be? Why does discarding one boundary target remain a bug even if both ranks' local code executes successfully?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Reconstruct the global loss sum and denominator. The objective is defined over logical tokens."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The correct mean is (2·1+6·3)/8=2.5. An equal average of local means gives 2. Losing a valid next-token target changes both the numerator and denominator of the training objective. Shift targets using logical sequence/document boundaries before partitioning, or exchange the needed boundary target. The gradient reduction must preserve the same weighted global mean."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Make a fresh real-input change"}</H3>

<Prose>{"Use the retained trajectory 20 with the frozen model. Choose a different point or coordinate edit from the worked case, then compute the model-output change and same-input dense/ring discrepancy separately. Explain what each comparison tests. Repeat using only a different owner assignment."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate the function's input from its execution plan. Recompute Q/K/V after a point edit."}</Prose>

</details>

<details><summary>Solution and acceptance criteria</summary>

<Prose>{"There is no fixed class answer for an arbitrary edit. Report the changed coordinates, model identity, before/after probabilities and maximum dense/ring difference. The input edit may change scores, values and classification; a small or null effect is valid evidence. Correct implementations should still agree within a justified floating-point tolerance. Ownership-only changes preserve the mathematical function, provided mask/position/record identities and output order remain correct. Explain any discrepancy instead of accepting a favorable class prediction as proof of systems correctness."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next" data-lesson-resource-list=""><H2>{"15. Continue learning"}</H2>

<Prose>{"You are ready to move on when you can explain why block softmax outputs need their normalizers, trace a global mask through a shard transfer, account for both compute and bytes, and describe how a remote query contributes to a key gradient. The next module-order topic is "}<a href={"/learn/path/full-curriculum/advanced-optimizers-lion-sophia-prodigy-schedule-free?module=deep-learning-fundamentals"}>{"Advanced Optimizers"}</a>{". It asks how gradients update parameters once the distributed computation has produced the intended gradient."}</Prose>

<Prose>{"For deeper GPU work, implement the maintained small distributed example first, then study fused kernels, network topology and profiling. For serving, revisit the one-query case and cache ownership. For model design, compare this exact execution strategy with the different approximations and state representations in sparse attention, Hyena and state-space models."}</Prose>

<Prose>{"Useful alternate routes and references:"}</Prose>

<ul><li>{""}<a href={"https://arxiv.org/html/2310.01889v4"}>{"Ring Attention paper"}</a>{": the primary algorithm, blockwise setup and experimental context. Read §3 with the ownership/merge example here, then distinguish §5's measured setups from extrapolation. Appendix A supplies its JAX forward/backward structure."}</li><li>{""}<a href={"https://arxiv.org/pdf/1805.02867"}>{"Online normalizer calculation"}</a>{": a short mathematical route to stable normalization and parallel summary merging. Useful before implementing custom attention arithmetic."}</li><li>{""}<a href={"https://arxiv.org/pdf/2205.14135"}>{"FlashAttention"}</a>{": §3 explains the memory hierarchy; Appendix B derives forward/backward tiling. This is an advanced kernel-oriented reference, not a prerequisite for the first pass."}</li><li>{""}<a href={"https://arxiv.org/html/2311.09431v1"}>{"Striped Attention"}</a>{": inspect its causal grids and §4 limitations. The paper's performance measurements are configuration-specific; our toy work grid is independently calculated."}</li><li>{""}<a href={"https://arxiv.org/html/2309.14509v2"}>{"DeepSpeed-Ulysses"}</a>{": a different tensor-ownership route. Follow Figure 2, then §3's communication analysis with the token/head puzzle."}</li><li>{""}<a href={"https://docs.pytorch.org/tutorials/unstable/context_parallel.html"}>{"PyTorch context-parallel tutorial"}</a>{": a maintained, executable GPU starting point after the CPU reference. Experimental APIs and supported backends require version checks; its multi-GPU program was read, not run here."}</li><li>{""}<a href={"https://cs336.stanford.edu/spring2025/"}>{"Stanford CS336 Spring 2025 course materials"}</a>{" and "}<a href={"https://www.youtube.com/watch?v=l1RJcDjzK8M"}>{"Stanford Online Lecture 7: Parallelism 1"}</a>{": broader distributed-training background to connect the mesh dimensions. Course schedule and official indexed video identity were verified; the complete video was not watched and no timestamp is claimed. This is supporting parallelism background, not a Ring-specific implementation walkthrough."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"UCI Libras Movement"}</a>{": source, attribution and schema for the real example. The "}<a href={"/learn-assets/ring-attention-sequence-parallelism/data-provenance.md"}>{"data/provenance record"}</a>{" and "}<a href={"/learn-assets/ring-attention-sequence-parallelism/movement-attention-model.json"}>{"complete frozen model"}</a>{" make the exact input-to-output path reproducible offline."}</li></ul>

<Prose>{"The investigations distinguish live mathematical calculations, frozen-model evidence and hypothetical resource models. The CPU/Gloo program tests actual transport correctness separately; GPU execution and performance benchmarks require their own measured setup."}</Prose></section>
</div></RingStudyProvider></RingSystemsProvider></RingFlowProvider>};
