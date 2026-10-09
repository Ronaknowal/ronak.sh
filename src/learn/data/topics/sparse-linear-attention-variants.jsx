// Reading-flow lesson; historical prepared renderer is guarded against overwriting this source.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as ContentMathBlock } from '../../components/content/Math.jsx';
function MathBlock({ children, caption }) { return <div className="sparse-equation-scroll" tabIndex={0} role="region" aria-label="Equation; scroll horizontally to read its full expression"><ContentMathBlock caption={caption}>{children}</ContentMathBlock></div>; }
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { SparseOpeningDrawing, SparseDeletionDrawing, SparseLayerDrawing, SparseHubDrawing, SparseMemoryWritesDrawing, SparseOuterProductDrawing, SparseDefinedFeatureDrawing, SparseDeterministicFeatureDrawing, SparseCollisionDrawing, SparseGaussianSampleDrawing, SparseRatioDrawing, SparseCommonScaleDrawing, SparseEvictionDrawing, SparseNystromDrawing } from '../../components/lesson-labs/SparseAttentionFlowFigures.jsx';
import { SparsePairsDrawing, SparseReformerDrawing, SparseRoutingDrawing, SparseOrthogonalSamplesDrawing, SparseVarianceDrawing, SparseFixedRadiusDrawing, SparseLengthMapDrawing, SparseLandmarkDrawing, SparseUnevenSegmentsDrawing, SparseFlexDrawing, SparseNsaDrawing, SparseDsaDrawing, SparseCsaDrawing, SparseHierarchicalSelectionDrawing, SparseDeltaDrawing, SparsePackingDrawing } from '../../components/lesson-labs/SparseAttentionSystemsFigures.jsx';
import { SparseCaseProvider, SparseGraphInvestigation, SparseReadInvestigation, SparseReadConstantQuestion, SparseMemoryInvestigation, SparseMemoryRecords, SparseProjectionInvestigation, SparseTileInvestigation, SparseRandomInvestigation, SparseRandomOutputs, SparseForecastInvestigation, SparseForecastComparison, SparseForecastHeadInvestigation, SparseFittedRoute, SparseRecordedStudy, SparseBudgetInvestigation, SparseGradientInvestigation } from '../../components/lesson-labs/SparseAttentionFlowLabs.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
export default {
 title: 'Sparse & Linear Attention Variants',
 readTime: '~100 min read + experiments and practice',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson neural-lesson-neutral sparse-attention-lesson lesson-flow"><SparseCaseProvider><LessonIntro prerequisites="Attention weights, vector products, matrix multiplication and a recurrent update; the local examples refresh the required shapes and normalization." sections={[["1-locate-the-cost-before-choosing-a-shortcut","1. Locate the cost before choosing a shortcut"],["2-sparse-attention-choose-which-connections-exist","2. Sparse attention: choose which connections exist"],["3-linear-attention-change-the-question-the-memory-can-answer","3. Linear attention: change the question the memory can answer"],["4-approximate-softmax-with-random-features","4. Approximate softmax with random features"],["5-compress-the-sequence-instead-of-its-feature-sums","5. Compress the sequence instead of its feature sums"],["6-make-the-graph-efficient-on-the-actual-machine","6. Make the graph efficient on the actual machine"],["7-compare-three-operators-on-observed-hand-trajectories","7. Compare three operators on observed hand trajectories"],["8-deeper-connections-and-practical-judgment","8. Deeper connections and practical judgment"],["9-practice-and-transfer","9. Practice and transfer"],["10-another-way-to-learn-and-what-comes-next","10. Another way to learn, and what comes next"]]}>Trace what reaches a query, what a memory retains, and which work an implementation actually avoids.</LessonIntro>
<Prose>As you read, change the record that is available, the message it carries or the way the memory is formed. Each investigation keeps its current result visible. Related questions share the same edited case, so you can follow an effect through the mechanism instead of starting again.</Prose>

<Prose>{"A long conversation contains many earlier tokens, but the next token may need only a few of them. A stream of hand movements has the opposite possibility: many earlier observations may matter collectively, without needing to retrieve any single observation exactly. These suggest two different ways to reduce attention's work: "}<strong>{"read fewer individual records"}</strong>{", or "}<strong>{"maintain a smaller summary that can answer a particular kind of query"}</strong>{"."}</Prose>

<Prose>{"The distinction matters. Removing connections, approximating a similarity function, compressing the sequence, and executing the same calculation more carefully can all reduce a resource cost. They preserve different things. This lesson gives you a way to inspect those choices rather than memorize a ranking of model names."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow §§1–3 and the opening of §4, the worked sequence-compression example in §5, and the real trajectory experiment in §7. Try the graph and memory investigations, then practice 1–5. You should be able to explain what information an operator can use, calculate a small output, and distinguish work from retained state. "}<strong>{"Deeper pass:"}</strong>{" study the random-feature derivation, approximation families, gradients and current sparse systems in §§4–6 and §8, then the remaining practice. Those branches develop implementation and research judgment; they are not hidden requirements for understanding the core story."}</Prose>

<Prose>{"We build on "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention & Multi-Head Attention"}</a>{", "}<a href={"/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals"}>{"Transformer Block Architecture"}</a>{", and the immediately preceding "}<a href={"/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals"}>{"Multi-Head Latent Attention"}</a>{". The refreshers below supply the particular mathematics we need."}</Prose>

<H2>{"1. Locate the cost before choosing a shortcut"}</H2>
<H3>What does one attention read actually do?</H3>
<Prose>Start with one question and three available records. A <strong>query</strong> describes what the receiver wants; a <strong>key</strong> describes each source record; its <strong>value</strong> is the message to return. Our first invented case uses one coordinate, so multiplication is visible without a large matrix.</Prose>
<SparseOpeningDrawing/>
<Prose>Follow the cyan query 1 into the three source keys. Their products are log(2), 0 and 0. Here log means the natural logarithm: exponentiating those scores gives amounts 2, 1 and 1. Dividing each amount by their total, 4, gives weights 1/2, 1/4 and 1/4. Finally multiply those weights by the messages 2, −1 and 4; the products 1, −1/4 and 1 add to <strong>1.75</strong>. Violet coordinates are computed results; amber will identify learned maps when we reach the network.</Prose>
<Prose>This exponential-then-normalize operation is <strong>softmax</strong>. A weight states how much of that source message enters this read; it is not a probability that the message is factually correct. With several key coordinates, add their coordinate products to form a <strong>dot product</strong>, then divide by the square root of key width. The one-coordinate example divides by one.</Prose>
<MathBlock>{"s_{tj}=q_t^Tk_j/\\sqrt{d_k},\\qquad p_{tj}=\\frac{e^{s_{tj}}}{\\sum_{u\\in J_t}e^{s_{tu}}},\\qquad o_t=\\sum_{j\\in J_t}p_{tj}v_j."}</MathBlock>
<Prose>Here t selects the receiver, j selects a source, d_k counts key coordinates, and J_t is the set of sources this receiver is allowed to read. The superscript T turns a column into a row for the dot product. A <strong>causal</strong> reader permits only current and earlier positions: J_t = 0 through t. These are the same operations taught in <a href="/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals">Self-Attention</a>; our question is which part of their work can be reduced.</Prose>
<H3>Why does a longer sequence create so much work?</H3>
<Prose>For six causal positions, draw every permitted receiver–source pair before generalizing to a long sequence.</Prose>
<SparsePairsDrawing/>
<Prose>Rows are receivers and columns are sources. Receiver 0 can read one record; receiver 1 can read two, and the last can read six. The lower triangle contains 1+2+3+4+5+6 = 21 pairs. Each pair needs a key comparison and a contribution from its value. The stored records on the other side are a different resource: they remain available for future queries.</Prose>
<MathBlock>{"\\#\\text{causal pairs}=L(L+1)/2,\\qquad \\text{pair arithmetic}=O(L^2(d_k+d_v))."}</MathBlock>
<Prose>L is sequence length and d_v is value width. The order notation describes growth while the widths are held fixed; it is not a wall-clock measurement. A simple reference allocates the entire L×L score matrix, including cells later masked. At batch one, 32 heads and two bytes per score, that tensor alone is 4 GiB at L = 8192 and 64 GiB at L = 32768: 32L²×2 bytes, with 1 GiB = 2³⁰ bytes. These are allocation calculations, not peak GPU-memory measurements.</Prose>
<NeuralTable caption="Separate the resources before choosing a shortcut" headers={['Resource','What it pays for','What changes it']} rows={[
['Attention arithmetic','Key comparisons and value accumulation','Fewer edges, fewer summary slots, or a factorable kernel'],
['Temporary storage','Scores, probabilities and backward intermediates','Tiling, recomputation and fused kernels'],
['Persistent inference state','Information retained for future tokens','KV sharing, compression, eviction and recurrent summaries'],
['Whole-model work','Projections, FFNs, routing and communication','Architecture and implementation beyond the read'],
]}/>
<Prose><strong>Exact attention need not allocate that square tensor.</strong> <a href="https://arxiv.org/abs/2205.14135">FlashAttention</a> tiles the same softmax calculation and accumulates stable running statistics. It reduces transfers and intermediates while retaining dense pair arithmetic. A proposed approximation should therefore be compared with a strong exact implementation. The preceding GQA and MLA lessons reduce stored fields per past token; sparse attention chooses which records to read, while feature attention changes the representation of the past.</Prose>
<Prose>Why not simply move softmax through the multiplication? Its denominator depends on all legal scores in a row. In general the following two orders do different calculations:</Prose>
<MathBlock>{"\\operatorname{softmax}(QK^T)V\\ne\\operatorname{softmax}(Q)(K^TV)."}</MathBlock>

<H2>{"2. Sparse attention: choose which connections exist"}</H2>
<H3>What changes when we remove one source?</H3>
<Prose>Keep the three messages from the opening example, but do not let the receiver read the final record.</Prose>
<SparseDeletionDrawing/>
<Prose>The source with message 4 is now excluded. Its amount no longer enters the total, so the two remaining weights become 2/3 and 1/3. Their weighted messages return <strong>1</strong>. Simply deleting the old contribution would give 0.75; that misses the renormalization of the remaining messages. This is <strong>sparse attention</strong>: ordinary attention over a selected set of individual records.</Prose>
<MathBlock>{"S_t\\subseteq J_t,\\quad S_t\\ne\\varnothing,\\qquad\\tilde o_t=\\sum_{j\\in S_t}\\frac{e^{s_{tj}}}{\\sum_{u\\in S_t}e^{s_{tu}}}v_j."}</MathBlock>
<Prose>S_t here names the retained source positions; later the memory matrix S is a different object, introduced explicitly. This read is exact for its specified sparse graph, but generally differs from the dense graph. In the example, removing probability mass δ = 1/4 changes the output by 3/4. Probability mass and output error have different units.</Prose>
<Prose>To see the relationship, call the normalized retained-message average μ_keep and the removed-message average μ_drop. For 0 &lt; δ &lt; 1, split the original sum into those two groups:</Prose>
<MathBlock>{"o=(1-\\delta)\\mu_{\\rm keep}+\\delta\\mu_{\\rm drop},\\qquad o-\\tilde o=\\delta(\\mu_{\\rm drop}-\\mu_{\\rm keep})."}</MathBlock>
<Prose>If every value has norm at most R, the triangle inequality gives an error bound 2Rδ. The values here have R = 4, so the bound is 2, while the actual error is 0.75. This is a useful diagnostic, but computing exact omitted mass can itself require comparing the omitted sources; it is not a free selection rule.</Prose>
<H3>Can a mask, a score or a message change the result differently?</H3>
<Prose>Switch to a four-record, two-message-coordinate case so each kind of intervention can be separated. The source selector chooses which record to edit; the permission switch changes whether it is included.</Prose>
<SparseReadInvestigation question="support"/>
<Prose>The crossed record is excluded from both the numerator and normalization. An empty permitted set has no normalized read. Now retain the same edited case and change one finite comparison score; a score changes its relative amount, not its permission.</Prose>
<SparseReadInvestigation question="score"/>
<Prose>Next change one message coordinate. This changes what a source sends while leaving matching and weights fixed.</Prose>
<SparseReadInvestigation question="message"/>
<Prose>Adding the same offset to every score multiplies all exponential amounts equally, so it cancels from their normalized weights. Subtracting the largest permitted score is the usual stable implementation. Try that invariance with a shared offset:</Prose>
<SparseReadInvestigation question="offset"/>
<Prose>If every permitted source sends the same message, every defined normalized read returns that message, regardless of its weights. Apply the constant-message change or restore the shared four-record case:</Prose>
<SparseReadConstantQuestion/>
<H3>How far can a local window carry information?</H3>
<Prose>A <strong>window</strong> retains nearby source positions. Here W counts total keys including the current record. The following 12-position example uses W = 3; trace a source through two successive layers.</Prose>
<SparseLayerDrawing mask={Array.from({length:12}, (_, receiver) => Array.from({length:12}, (_, source) => source <= receiver && receiver-source < 3))} source={2} target={6} layers={2}/>
<Prose>In one layer, position 7 reads 5, 6 and 7. A second layer reads the first layer's representations, so information can travel through another edge. Parallel heads in one layer do not turn a two-edge route into two successive layers. A residual bypass preserves information already reachable; it does not create access to a missing source.</Prose>
<MathBlock>{"S_t=\\{j:0\\le j\\le t,\\ t-j<W\\},\\qquad\\text{maximum past distance after D layers}=D(W-1)."}</MathBlock>
<Prose>D is the number of successive attention layers, with only tokenwise operations between them. For L = 12 and W = 3, the first two rows have one and two keys, and the next ten have three, totaling 33. In general, with m = min(L,W), the edge count is:</Prose>
<MathBlock>{"m(m+1)/2+(L-m)m."}</MathBlock>
<Prose>A path makes dependence possible; it does not guarantee that learned weights preserve useful information along it. A missing path gives an exact inability to depend on that source under the stated architecture. Switch to a ten-position live graph, initially W = 2, and inspect the available connections.</Prose>
<SparseGraphInvestigation question="window"/>
<Prose>The source and receiver select the dependency to inspect; the layer count tells how many successive moves are allowed.</Prose>
<SparseGraphInvestigation question="path"/>
<H3>Can one global record connect distant regions?</H3>
<Prose>A <strong>global token</strong> gathers and redistributes information. Compare an encoder's two-way hub with a decoder's strictly causal hub.</Prose>
<SparseHubDrawing/>
<Prose>In a bidirectional encoder, the hub can read all inputs and other records can read that representation in a later layer. In a causal decoder, a hub at position 0 cannot gather position 2. In the illustrated 12-position case a hub at 6 creates 2→6→11; a hub at 0 cannot. Every arrow, including a pooling or routing operation, must respect its direction in time.</Prose>
<Prose><a href="https://arxiv.org/html/2004.05150v2">Longformer, §3</a> combines local and global connections, with separate projections for global attention. Dilated windows sample offsets farther apart. In the current ten-position live graph, choosing a hub rebuilds the window-plus-hub pattern; it deliberately replaces manual edge edits.</Prose>
<SparseGraphInvestigation question="hub"/>
<Prose>Alternatively, edit one receiver–source permission directly. A source after the receiver is a future record and cannot be enabled in this causal graph.</Prose>
<SparseGraphInvestigation question="edge"/>
<Prose>Alternating local and strided layers gives another route. With stride s around √L, spans of order s locally and L/s along the stride cost order L√L. Offsets and layer order determine the actual paths. <a href="https://arxiv.org/html/1904.10509v1">Sparse Transformer, §4–5</a> developed these factorizations for sequences including images and audio.</Prose>
<Prose><a href="https://arxiv.org/html/2007.14062v2">BigBird, §2–3</a> combines local, global and random edges. Fixed counts give linear edge growth. Its universality result is an existence theorem for sufficiently expressive networks on a fixed-length compact domain using an appropriate graph containing a global star; it does not guarantee dense-model accuracy for a fixed small architecture. Genomic applications illustrate why distant context can matter alongside local motifs.</Prose>
<H3>Deeper: can content help select the candidates?</H3>
<Prose>A fixed window cannot know that an old variable definition is relevant now. Content routing groups similar representations before computing the main comparisons. Start with an invented six-record two-coordinate case and an identity random projection, so the routing arithmetic is visible.</Prose>
<SparseReformerDrawing/>
<Prose>Each source is projected onto signed directions, and the index of its largest coordinate selects a <strong>bucket</strong>, a candidate group. Sorting gathers equal buckets but preserves original position IDs for the causal mask. The illustrated gather excludes a future record even when its bucket matches. <a href="https://arxiv.org/html/2001.04451v2">Reformer, §2</a> uses h(x) = argmax[xR;−xR], shared query/key representations, normalized keys, bounded chunks and multiple hash rounds. It is not a hash made by independently taking every sign. Its neighboring-chunk and repeated-match rules are additional parts of the real algorithm.</Prose>
<Prose>A bounded chunk can miss a large bucket's members, while an uncapped all-pairs bucket can cost quadratically. Sorting, repeated candidates and gathers are part of the bill. A second approach learns clusters rather than fixing random partitions:</Prose>
<SparseRoutingDrawing/>
<Prose>The input is centered and divided by its square root of its population variance plus ε inside that square root before distances to two stipulated centroids are compared. Affine-free LayerNorm is not exactly unit-length normalization; the centroid assignment here is a small local illustration. <a href="https://aclanthology.org/2021.tacl-1.4.pdf">Routing Transformer, §4.1</a> uses online clustering with balanced candidate budgets. With c clusters, assignment costs roughly Lcd and balanced comparisons L²d/c; c around √L balances them at order L³ᐟ²d. Original position masks, balancing and sorting still matter.</Prose>
<Prose>Both methods can miss a relevant key. Computing every dense score and only then zeroing small probabilities has already paid the dense comparison cost; sparse weights alone do not establish sparse execution.</Prose>

<H2>{"3. Linear attention: change the question the memory can answer"}</H2>
<H3>Can we write a record into a small summary?</H3>
<Prose>Sparse attention keeps individual records and skips reads. Now keep all three records but combine their information before the query arrives. A <strong>feature map</strong> writes new coordinates from a query or key; for this first case, stipulate the two key features and scalar messages directly. Call the weighted-message array S and the accumulated key-feature array z; both start at zero.</Prose>
<SparseMemoryWritesDrawing/>
<Prose>Source 0 has features [1,0] and message 2; its two row contributions are [2,0]. Source 1 writes [0,−1], and source 2 writes [3,3]. Adding gives S = [5,2]ᵀ. Separately add the features to obtain z = [2,2]ᵀ. S stores feature-weighted messages; z stores their matching amounts. A query [2,1] reads 2×5 + 1×2 = 12 from S and 2×2 + 1×2 = 6 from z, returning 2.</Prose>
<Prose>The same answer comes from matching that query against each key: similarities [2,1,3] become weights [1/3,1/6,1/2], and the weighted messages sum to 2. The new calculation changes the order of operations; it does not approximate this chosen similarity.</Prose>
<Prose>For messages with several coordinates, one key feature scales the entire message row. This multiplication is an <strong>outer product</strong>, a small matrix rather than one dot-product scalar.</Prose>
<SparseOuterProductDrawing/>
<Prose>Follow each key component into every value coordinate. Summing those small write matrices forms the memory S. If the feature map φ has m coordinates and messages have d_v coordinates, S has m rows and d_v columns. z has m coordinates. Their exact algebra is:</Prose>
<MathBlock>{"\\kappa(q,k)=\\phi(q)^T\\phi(k),\\qquad S_t=\\sum_{j\\le t}\\phi(k_j)v_j^T,\\qquad z_t=\\sum_{j\\le t}\\phi(k_j)."}</MathBlock>
<MathBlock>{"o_t^T=\\frac{\\phi(q_t)^TS_t}{\\phi(q_t)^Tz_t}=\\frac{\\sum_{j\\le t}\\phi(q_t)^T\\phi(k_j)v_j^T}{\\sum_{j\\le t}\\phi(q_t)^T\\phi(k_j)}."}</MathBlock>
<Prose>The symbol κ names this <strong>kernel</strong>, meaning a similarity formed by the feature dot product. We choose nonnegative similarities and require a positive denominator for a normalized read. S here is a memory matrix, distinct from the retained-position set S_t in Section 2. <a href="https://proceedings.mlr.press/v119/katharopoulos20a/katharopoulos20a.pdf">Transformers are RNNs, §3</a> develops this causal recurrence.</Prose>
<H3>Which edit changes the stored memory, and which only reads it differently?</H3>
<Prose>Switch explicitly to three records with two-coordinate messages: keys [1,2], [2,1], [1,1]; values [1,−1], [0,2], [3,1]; query [1,3]. The initial matrix is [[4,4],[5,1]], z is [4,4], and the read is [19/16,7/16]. First change only the query features; the stored arrays stay fixed.</Prose>
<SparseMemoryInvestigation question="query"/>
<Prose>Now choose a source and change its key features. This changes both the weighted-message matrix and the normalizer. The record selector names the write being edited.</Prose>
<SparseMemoryInvestigation question="keys"/>
<Prose>A message edit changes the write to S but does not change z; matching amounts are unchanged.</Prose>
<SparseMemoryInvestigation question="values"/>
<H3>How do prefixes and eviction change the state?</H3>
<Prose>A prefix includes the first specified number of records. Writing more records adds their contributions; an empty prefix has a zero state and no normalized read. Eviction removes an earlier write. Start from the unedited three-record state and remove its known first write:</Prose>
<SparseEvictionDrawing/>
<Prose>Subtract its exact outer product [[1,−1],[2,−2]] from S and [1,2] from z. The result is S = [[3,5],[3,3]], z = [3,2]. The same query [1,3] now gives numerator [12,14], denominator 9 and output [4/3,14/9]. S and z alone cannot tell whether an arbitrary proposed write was previously included: the caller must retain that membership information when eviction is allowed.</Prose>
<Prose>In the shared live case, vary how many available records are included. Append inserts one new write at that prefix boundary, keeping every later available record excluded. Eviction removes only the oldest included write. Evicting the sole included record leaves an empty prefix; it does not silently admit the next record.</Prose>
<SparseMemoryInvestigation question="chronology"/>
<Prose>Compare the edited read with a pinned earlier result, or set all messages equal. Every defined normalized read then returns the common message. Reset restores this whole connected case.</Prose>
<SparseMemoryInvestigation question="compare"/>
<SparseMemoryRecords/>
<H3>What does “linear” mean here?</H3>
<Prose>For fixed m, d_k and d_v, each write and read costs order md_v plus feature-map work. Across L positions the core work is O(Lmd_v); the streaming state has m(d_v+1) scalars per head. Its size does not grow with the number of received records, but feature width and value width still matter. The output is generally nonlinear in the inputs because of feature maps, normalization and the surrounding network.</Prose>
<H3>Does any positive map reproduce softmax?</H3>
<Prose>No. A useful defined kernel maps each scaled coordinate through ELU+1: a negative number is exponentiated, while a nonnegative number has one added. Here three signed projected coordinates illustrate the transformation used by our later eight-wide model.</Prose>
<SparseDefinedFeatureDrawing/>
<Prose>The signed input coordinates are divided by 8¹ᐟ⁴, then transformed independently. This produces positive coordinates but does not establish the exponential dot-product similarity used by softmax. The key uses the same transformation as the query.</Prose>
<MathBlock>{"\\phi(x)=\\operatorname{ELU}(x)+1=\\begin{cases}x+1&x\\ge0\\\\e^x&x<0.\\end{cases}"}</MathBlock>
<Prose>Strictly positive finite features give positive overlap on a nonempty prefix in exact arithmetic. Merely nonnegative features can have zero overlap; floating-point exponentials can underflow. A zero write is valid and contributes nothing, but it does not create a defined read. A denominator floor changes the operator where it is active; the later measured model remains far above its stated floor.</Prose>
<H3>What distinction can a summary forget?</H3>
<Prose>To isolate information loss, switch to a one-feature case: every key feature is 1, and the query is 1. Compare two different two-message histories.</Prose>
<SparseCollisionDrawing/>
<Prose>[1,3] and [2,2] both end at S = 4 and z = 2, returning 2. Their first-prefix reads were 1 and 2, but the final summary cannot recover which first message was written. More expressive features distinguish other histories; this collision shows why retrieval needs must be tested rather than inferred from a small average error.</Prose>
<Prose>Permuting already formed feature/message pairs leaves a pure additive final state unchanged. A whole causal network can still depend on order: its earlier prefixes differ, and positional features change the pairs themselves. Gates and later selective updates change the write rule; Section 8 will draw that distinction.</Prose>

<H3>Deeper: can a deterministic map create more distinguishable addresses?</H3>
<Prose>The collision above asks what a feature space can distinguish. We can enlarge that space without drawing random numbers. Switch to four two-coordinate keys, one in each sign quadrant. A <strong>rectifier</strong> r(a) = max(a,0) keeps a positive coordinate and replaces a negative one by zero; multiplying rectified coordinate pairs will give each quadrant a separate direction.</Prose>
<SparseDeterministicFeatureDrawing/>
<Prose>Trace the white-marked key [−1,1]. First concatenate its coordinates and their negatives: [−1,1,1,−1]. Rectifying gives u = [0,1,1,0]. Pair each entry with the next entry, wrapping the last back to the first: [0×1,1×1,1×0,0×0] = [0,1,0,0]. The four product coordinates have sign-pair order (++), (−+), (−−), (+−). The other three displayed keys activate different coordinates. Their feature vectors are perpendicular: their mutual dot products are zero, while each displayed key's self-product is one.</Prose>
<Prose>This is the two-coordinate, one-cyclic-shift example of <strong>deterministic parameter-free projection (DPFP)</strong>, from <a href="https://proceedings.mlr.press/v139/schlag21a/schlag21a.pdf">Schlag, Irie and Schmidhuber, §5.4</a>. “Parameter-free” describes this feature expansion; the surrounding query/key projections can still be learned. With zero-based indices, define the concatenated nonnegative vector u and the new feature map as follows:</Prose>
<MathBlock>{String.raw`u=(r(k_1),r(k_2),r(-k_1),r(-k_2)),\qquad \phi_{\rm DPFP}(k)_i=u_i u_{(i+1)\bmod 4},\quad i=0,1,2,3.`}</MathBlock>
<Prose>The modulo notation implements the cyclic wrap: the neighbor of entry 3 is entry 0. This defines a four-coordinate nonnegative kernel through the same feature dot product and S,z recurrence already taught. It does <em>not</em> estimate the exponential kernel. The small implementation below follows the pictured ordering, supports batches along any leading dimensions, and rejects nonfinite input or overflowing products. Its checks also read four different scalar messages through the resulting memory.</Prose>
<RemoteCodeBlock source="/learn-code/sparse-linear-attention-variants/deterministic-product-features.py" language="python" title="Deterministic four-coordinate features and checked reads"/>
<Prose>Why does greater width not settle retrieval? The two keys [2,0.5] and [1,1] both produce [1,0,0,0], so their messages still combine at one address. If they carry 2 and 6, either identical feature query returns their mean, 4. The axis key [1,0] produces all zeros; a query with those features has zero overlap even with a nonempty memory, so its normalized read is undefined. These are constructed geometry checks, not a task benchmark or a promise of universal capacity. The general DPFP concatenates more cyclic pair-product groups, controlled by an expansion parameter; its full construction is in the paper and differs from this deliberately complete one-shift implementation.</Prose>
<Prose>Keep normalization separate from expansion. The paper also studies dividing a nonzero feature vector by the sum of its coordinates for its corrective-memory rule. That is different from dividing an attention numerator by total query/key overlap. A feature vector whose coordinates sum to one need not have squared length one: [0.5,0.5] sums to one but its squared length is 0.5. We have not changed the existing live memory or silently applied that convention to Section 8's unit-length delta example.</Prose>

<H2>{"4. Approximate softmax with random features"}</H2>

<Prose><em>The sampled feature mechanism is the core of this section. Its expectation, variance and sampling distribution are a deeper branch, developed from the same read.</em></Prose>

<Prose>{"We can choose a different kernel deliberately, or approximate the existing exponential kernel. These are different experiments."}</Prose>

<Prose>One random feature is one positive number derived from a projected vector. To see every operation, first use x = [0.5,−0.25] and a fixed sampled direction ω = [0.3,0.8]; these are already scaled coordinates.</Prose>
<SparseGaussianSampleDrawing/>
<Prose>Multiply corresponding coordinates and add them: 0.3×0.5 + 0.8×(−0.25) = −0.05. Half the squared input length is (0.25+0.0625)/2 = 0.15625. Subtracting gives −0.20625; exponentiating makes the feature positive. Repeating this with sampled directions gives multiple feature coordinates. In the derivation below the directions follow a standard Gaussian distribution; this single displayed direction is a worked draw, not a complete estimator.</Prose>

<Prose>A <strong>standard Gaussian</strong>, or standard normal, coordinate has mean zero and variance one: most draws are near zero, with progressively less frequent large magnitudes. Here the coordinates of the sampled vector are independent. The identity below averages over that distribution, not over the source records in one sequence.</Prose>

<Prose>{"Set "}<InlineMath>{"x=q/d_k^{1/4}"}</InlineMath>{", "}<InlineMath>{"y=k/d_k^{1/4}"}</InlineMath>{", so "}<InlineMath>{"x^Ty=q^Tk/\\sqrt{d_k}"}</InlineMath>{". Draw a fixed random vector "}<InlineMath>{"\\omega\\sim\\mathcal N(0,I)"}</InlineMath>{", and define"}</Prose>

<MathBlock>{"f_\\omega(x)=\\exp(\\omega^Tx-\\|x\\|^2/2)."}</MathBlock>

<Prose>Why does averaging these features reproduce an exponential dot product? For any fixed vector a, combine the Gaussian density's exponent with the extra dot product by completing the square:</Prose>
<MathBlock>{String.raw`-\|\omega\|^2/2+\omega^Ta=-\|\omega-a\|^2/2+\|a\|^2/2.`}</MathBlock>
<Prose>The first term is the exponent of the same normalized Gaussian density shifted to a. Its integral remains one. The other term does not depend on the sampled vector, so it factors out of the average as exp(‖a‖²/2).</Prose>

<Prose>The completed square gives the identity below. Then use a = x+y in the product of the two features:</Prose>
<MathBlock>{String.raw`\mathbb E[e^{\omega^Ta}]=e^{\|a\|^2/2}.`}</MathBlock>

<MathBlock>{"\\mathbb E[f_\\omega(x)f_\\omega(y)]\n=e^{-\\|x\\|^2/2-\\|y\\|^2/2}e^{\\|x+y\\|^2/2}\n=e^{x^Ty}."}</MathBlock>

<Prose>{"With "}<InlineMath>{"m"}</InlineMath>{" sampled vectors, place "}<InlineMath>{"f_{\\omega_r}(x)/\\sqrt m"}</InlineMath>{" in feature coordinate "}<InlineMath>{"r"}</InlineMath>{". The feature dot product estimates the unnormalized exponential similarity. It can then use the same "}<InlineMath>{"S,z"}</InlineMath>{" recurrence. Positive random features and orthogonal constructions are central to "}<a href={"https://arxiv.org/html/2009.14794v4"}>{"Performer and FAVOR+"}</a>{"."}</Prose>

<Prose>{"The result is exact for the "}<strong>{"sampled feature operator"}</strong>{", approximate for the original softmax operator. Keep the projections fixed during a sequence. A state constructed under one set of random features cannot be read as though it had been constructed under another."}</Prose>

<H3>{"Unbiased similarities do not give an unbiased normalized output"}</H3>

<Prose>An estimate is <strong>unbiased</strong> when its average over repeated independent draws equals the quantity being estimated. A single draw can still differ substantially. The Gaussian identity establishes this equality for the unnormalized similarity, before dividing by the random total.</Prose>

<Prose>The sampled amounts are random. Compare two equally likely rows of similarities, (1,1) and (3,1): normalize each draw on the left, or average their amounts first on the right.</Prose><SparseRatioDrawing/>

<Prose>{"The expectation of a ratio is not generally the ratio of expectations. For a small counterexample, suppose two estimated similarities are equally likely to be "}<InlineMath>{"(1,1)"}</InlineMath>{" or "}<InlineMath>{"(3,1)"}</InlineMath>{". Their means are "}<InlineMath>{"(2,1)"}</InlineMath>{". The expected normalized first weight is"}</Prose>

<MathBlock>{"\\tfrac12(1/2+3/4)=5/8,"}</MathBlock>

<Prose>{"while normalizing the mean similarities gives "}<InlineMath>{"2/3"}</InlineMath>{". An unbiased kernel estimator therefore does not automatically make a finite-feature attention row or output unbiased."}</Prose>

<Prose>How can norms make that variability large? For the scalar case x = y = a, the next curve computes the exact variance of the independent Gaussian pair estimator with 64 features. It is an analytic curve, not a measured error of the trained network.</Prose><SparseVarianceDrawing/>

<Prose>{"For the independent Gaussian construction, a single pair has variance"}</Prose>

<MathBlock>{"\\operatorname{Var}(\\widehat\\kappa_m(x,y))\n=\\frac{e^{2x^Ty}}{m}\\left(e^{\\|x+y\\|^2}-1\\right)."}</MathBlock>

<Prose>{"You can derive this by applying the same Gaussian identity to the square of "}<InlineMath>{"f_\\omega(x)f_\\omega(y)"}</InlineMath>{", then subtracting the squared mean. It explains both the "}<InlineMath>{"1/m"}</InlineMath>{" variance reduction and sensitivity to vector norms. It is a variance of the unnormalized pair estimator, not an identical formula for task loss or the normalized ratio. Increasing "}<InlineMath>{"m"}</InlineMath>{" improves this expectation-level quantity; one nested random draw can still become less accurate."}</Prose>

<H3>{"Orthogonal directions still need the right radii"}</H3>

<Prose><strong>Orthogonal</strong> directions meet at a right angle. A radius is the sampled vector's length; its direction and length are separate choices.</Prose>

<Prose>Random directions can cover the space unevenly. Compare two sampled directions in a plane with two orthogonal directions. The displayed radii 2 and 1.5 are constructed to expose the lengths; the real algorithm samples its radii.</Prose><SparseOrthogonalSamplesDrawing/>

<Prose>{"Using mutually orthogonal directions within a block can reduce redundant sampling. To preserve a standard Gaussian marginal for each row, combine a uniformly random orthogonal direction with an independent radius distributed as the length of a "}<InlineMath>{"d_k"}</InlineMath>{"-dimensional standard Gaussian vector. The supplied program obtains directions using a sign-corrected QR decomposition, then samples those independent radii. Independent blocks allow "}<InlineMath>{"m>d_k"}</InlineMath>{"."}</Prose>

<Prose>Keeping every radius fixed changes the estimator. In a separate one-dimensional example, x = y = 1 and the direction is equally likely to be +1 or −1.</Prose><SparseFixedRadiusDrawing/>

<Prose>{"Multiplying every unit direction by the fixed number "}<InlineMath>{"\\sqrt{d_k}"}</InlineMath>{" is a different distribution. In one dimension, take "}<InlineMath>{"x=y=1"}</InlineMath>{". A fixed-radius vector is "}<InlineMath>{"+1"}</InlineMath>{" or "}<InlineMath>{"-1"}</InlineMath>{", so the expected feature product is "}<InlineMath>{"e^{-1}\\cosh2\\approx1.384"}</InlineMath>{"; the Gaussian construction gives "}<InlineMath>{"e\\approx2.718"}</InlineMath>{". Both are valid things to compute, but only the latter follows the Gaussian identity above. The Performer paper also studies a fixed-radius regularized kernel; it should be named as such, not described as an unchanged Gaussian estimator."}</Prose>

<H3>{"Keep the numerical stabilization consistent"}</H3>

<Prose>Stabilization must preserve the relative units of old and new writes. In this scalar example, the old S = 6 and z = 3 use log scale 0; a new key raises the common log scale to 2.</Prose><SparseCommonScaleDrawing/>

<Prose>{"Exponentials may overflow. Multiplying all feature coordinates for one query by a common scalar cancels between that query's numerator and denominator. Multiplying every key-feature vector in the whole memory by the "}<strong>{"same"}</strong>{" scalar also cancels. Multiplying each key by its own unrelated scalar usually changes their relative importance."}</Prose>

<Prose>{"For streaming exponential features, if a newly arrived key requires changing the common key scale, rescale the existing "}<InlineMath>{"S"}</InlineMath>{" and "}<InlineMath>{"z"}</InlineMath>{" by the same factor before adding the new write. Otherwise old and new records use different units. Padding, state reset, query/key feature scaling, and causal prefix boundaries must agree between training and inference."}</Prose>

<H3>How much does one fixed random draw change the read?</H3>
<Prose>Switch to four already-scaled, two-coordinate query/key records and two-coordinate messages. The Gaussian projection bank is fixed at seed 5. Changing feature count takes a longer prefix of that same bank; it does not redraw it. The displayed receiver reads only its causal prefix.</Prose>
<SparseRandomInvestigation question="approximation"/>
<Prose>Now edit one query coordinate in this same case. A query changes which memory coordinates are read, without rewriting the sources.</Prose><SparseRandomInvestigation question="query"/>
<Prose>A key edit changes the approximate similarities and the memory writes. Choose its source record and coordinate before changing the value.</Prose><SparseRandomInvestigation question="key"/>
<Prose>A message edit keeps matching fixed and changes the weighted contributions. Follow the shares into the actual multiplication and sum:</Prose><SparseRandomInvestigation question="message"/>
<Prose>Finally make every source message equal or restore this case. A defined exact and sampled normalized read must agree on the constant message.</Prose><SparseRandomInvestigation question="constant"/>
<SparseRandomOutputs/>

<H2>{"5. Compress the sequence instead of its feature sums"}</H2>

<Prose>{"Another strategy replaces many keys and values with fewer summary slots before attention. It deserves its own picture because it is not the same operation as skipping keys or accumulating "}<InlineMath>{"\\phi(k)v^T"}</InlineMath>{"."}</Prose>

<H3>{"Linformer: learned combinations along the length axis"}</H3>

<Prose>A learned length-axis map combines complete source rows into fewer rows. In this constructed four-record example, compare the original keys and values with two weighted summary slots.</Prose><SparseLengthMapDrawing/>
<Prose>Amber coefficients act along the position axis, producing violet summary keys and messages. The query matches those summaries rather than the original records. A coefficient can be negative or larger than one: these learned maps are not themselves probability distributions.</Prose>

<Prose>{"Let "}<InlineMath>{"K\\in\\mathbb R^{L\\times d_k}"}</InlineMath>{", "}<InlineMath>{"V\\in\\mathbb R^{L\\times d_v}"}</InlineMath>{". Define learned sequence projections "}<InlineMath>{"E,F\\in\\mathbb R^{r\\times L}"}</InlineMath>{":"}</Prose>

<MathBlock>{"\\bar K=EK,\\quad\\bar V=FV,\\quad\nO=\\operatorname{softmax}(Q\\bar K^T/\\sqrt{d_k})\\bar V."}</MathBlock>

<Prose>{"Each row of "}<InlineMath>{"E"}</InlineMath>{" combines positions into a key summary; each row of "}<InlineMath>{"F"}</InlineMath>{" combines positions into a value summary. Learned coefficients need not be nonnegative or sum to one. The model attends over "}<InlineMath>{"r"}</InlineMath>{" summaries. With fixed "}<InlineMath>{"r\\ll L"}</InlineMath>{", projection and attention cost order "}<InlineMath>{"Lr(d_k+d_v)"}</InlineMath>{". The original work motivates this using empirical low-rank behavior of attention maps and approximation arguments; it does not establish that every query/key matrix or task has a universally small useful rank. "}<a href={"https://arxiv.org/html/2006.04768v3"}>{"Linformer, §3–4"}</a>{""}</Prose>

<Prose>{"Now inspect causality. With one value-summary row "}<InlineMath>{"F=[0.5,0,0.5]"}</InlineMath>{" and values "}<InlineMath>{"[1,2,9]"}</InlineMath>{", the summary is "}<InlineMath>{"5"}</InlineMath>{". There is only one summary slot, so its softmax weight is one. A query at position 0 would receive "}<InlineMath>{"5"}</InlineMath>{", containing future value 9. Changing that future value to 1 changes the supposedly earlier output to 1. Applying a triangular mask to the single summary slot cannot remove the particular future contribution already mixed into it."}</Prose>



<Prose>{"A causal variant can be constructed, but must define a different prefix-dependent operator. For fixed projection columns "}<InlineMath>{"e_j,f_j\\in\\mathbb R^r"}</InlineMath>{", maintain"}</Prose>

<MathBlock>{"\\bar K_t=\\bar K_{t-1}+e_tk_t^T,\\qquad\n\\bar V_t=\\bar V_{t-1}+f_tv_t^T."}</MathBlock>

<Prose>{"The current query attends only to these summaries of positions through "}<InlineMath>{"t"}</InlineMath>{". In the one-slot example, position 0 sees "}<InlineMath>{"0.5"}</InlineMath>{", not the full-sequence 5. The coefficient has not automatically become a prefix-normalized average. Define how unused summary rows participate, how columns are generated beyond the trained length, and whether coefficients depend on future inputs. This construction shows why “the usual full-sequence projection leaks” is precise, while “sequence projection can never be causal” is too strong."}</Prose>

<Prose>Switch to the editable four-message case [4,−2,3,8] with coefficients [0.25,0.5,0,0.25]. There is one summary slot, so the full-summary read is 2. Choose a source and change its message; compare that full read with the prefix-limited read.</Prose><SparseProjectionInvestigation question="message"/>
<Prose>Now edit a signed coefficient in the same summary. It changes the write, and need not preserve any average.</Prose><SparseProjectionInvestigation question="coefficient"/>
<Prose>The query-position control sets which source columns are allowed in the prefix-only construction; the full-sequence construction continues to contain future columns.</Prose><SparseProjectionInvestigation question="prefix"/>
<Prose>Vary the number of available source records or restore the original coefficients and records. These actions extend or shorten the same available source list; they do not pin a comparison.</Prose><SparseProjectionInvestigation question="length"/>

<H3>{"Nyströmformer: use landmark queries and keys"}</H3>

<Prose>The next construction needs a small middle comparison to connect its landmark reads. An ordinary inverse undoes an invertible map; a <strong>pseudoinverse</strong> retains recoverable directions when some directions cannot be distinguished. It is computed from singular values, as developed in <a href="/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations">Matrix Decompositions</a>. We will first draw which arrays it acts on.</Prose>

<Prose>Length projection learns arbitrary combinations. A <strong>landmark</strong> instead represents a group of query/key rows. Start with four two-coordinate rows and form two segment means.</Prose><SparseLandmarkDrawing/>
<Prose>The means become two representative queries and keys. Three comparisons are needed: original queries against landmark keys, landmark queries against landmark keys, and landmark queries against original keys. Each comparison gets its own row normalization; the smaller middle factor connects the other two.</Prose>

<Prose>{"Nyströmformer selects a smaller set of representative query/key vectors, called "}<strong>{"landmarks"}</strong>{". One option takes means of contiguous segments. Here "}<InlineMath>{"d=d_k"}</InlineMath>{" is query/key width, and the symbols "}<InlineMath>{"F,A,B"}</InlineMath>{" name new factors local to this construction. Define row-softmax matrices"}</Prose>

<MathBlock>{"F=\\operatorname{softmax}(Q\\tilde K^T/\\sqrt d),\\quad\nA=\\operatorname{softmax}(\\tilde Q\\tilde K^T/\\sqrt d),\\quad\nB=\\operatorname{softmax}(\\tilde QK^T/\\sqrt d)."}</MathBlock>

<Prose>{"Approximate the attention output by "}<InlineMath>{"FA^+BV"}</InlineMath>{", where "}<InlineMath>{"A^+"}</InlineMath>{" is the Moore–Penrose pseudoinverse. Compute from the right to avoid forming an "}<InlineMath>{"L\\times L"}</InlineMath>{" matrix. The paper uses an iterative inverse approximation; the teaching fixture uses a direct numerical pseudoinverse. Pseudoinverse coefficients can be negative, so the approximate full matrix is not automatically a nonnegative probability matrix. Full-sequence landmarks also need a separate causal design before use in autoregressive prediction. "}<a href={"https://arxiv.org/html/2102.03902v3"}>{"Nyströmformer, §3"}</a>{""}</Prose>



<Prose>How do we apply those factors without recreating the full attention matrix? The following numerical factor example uses a nonsingular 2×2 middle factor, so its ordinary inverse equals its pseudoinverse. Start on the value side.</Prose><SparseNystromDrawing/>
<Prose>First B combines the source messages into two landmark reads. A⁺ compensates for the middle landmark comparison; F writes the compensated results back to original receivers. The compensation can be signed, so the product need not be a nonnegative probability matrix.</Prose>
<Prose>For uneven segments, seven positions split into groups of three, two and two. Retain the trailing records rather than silently dropping them:</Prose><SparseUnevenSegmentsDrawing/>

<Prose>{"For "}<InlineMath>{"r"}</InlineMath>{" landmarks, a straightforward implementation pays order "}<InlineMath>{"Lrd_k+Lrd_v+r^2d_v+r^3"}</InlineMath>{", including an SVD-based pseudoinverse. “Linear in "}<InlineMath>{"L"}</InlineMath>{"” assumes "}<InlineMath>{"r"}</InlineMath>{" is held fixed; increasing landmarks to preserve quality changes that tradeoff. Singular values near zero make the pseudoinverse sensitive, so approximation and numerical error must be examined together."}</Prose>

<H2>{"6. Make the graph efficient on the actual machine"}</H2>

<Prose><em>This section connects the permitted graph to execution work. Section 7 then uses the same three operator families inside complete trained forecasters.</em></Prose>

<H3>{"Eight edges can occupy very different amounts of work"}</H3>

<Prose>A <strong>tile</strong> is a small rectangular block of receiver–source cells processed together. The next mask draws eight-by-eight cells before counting how many blocks contain work.</Prose><SparseTileInvestigation question="size"/>

<Prose>{"A hardware kernel often processes tiles instead of individual matrix cells. In an "}<InlineMath>{"8\\times8"}</InlineMath>{" mask with "}<InlineMath>{"2\\times2"}</InlineMath>{" tiles, eight diagonal edges occupy four tiles: 16 candidate cell positions inside those tiles. Place one edge per row at columns "}<InlineMath>{"2i\\bmod8"}</InlineMath>{", and the same eight edges occupy eight tiles: 32 candidate positions. Both masks have 12.5% token-edge density. They have different tile occupancy and memory access patterns. This example is a bidirectional layout exercise, not a causal mask."}</Prose>

<Prose>{"An occupied tile may still contain masked cells; a fully empty tile can be skipped. Neither count alone predicts seconds. Gather overhead, head dimensions, precision, hardware, compilation and other layers matter. A dense implementation of a sparse mask still computes the dense scores if it forms "}<code>{"Q @ K.T"}</code>{" first."}</Prose>

<Prose>Inspect the eight-by-eight mask directly. Choose receiver and source, then change that cell's permission; each visible occupied tile is a group of candidate cell positions.</Prose><SparseTileInvestigation question="edge"/>
<Prose>The block-width control above groups the current edited edges differently; it does not change their permissions.</Prose>
<Prose>Compare diagonal and scattered eight-edge layouts or restore the mask. These are bidirectional layout examples, not causal reads.</Prose><SparseTileInvestigation question="layout"/>

<Prose>A compiled tool must keep permission separate from a score change. In this constructed two-source read, a partially occupied block includes one forbidden cell; it must still be masked inside the block.</Prose><SparseFlexDrawing/>
<Prose>The query and both keys form scores, while the permission branch excludes source 1 before row normalization. The allowed message 2 returns with weight one. A score modifier can alter a finite score; a permission mask decides whether that score enters the read at all.</Prose>

<Prose>{"PyTorch's FlexAttention provides a way to express custom score modifications and block masks and compile suitable attention kernels. Its "}<code>{"mask_mod"}</code>{" receives batch, head, query index and key index and returns whether that pair is allowed. A block mask can skip fully masked blocks. This does not mean every arbitrary mask is equally fast, or that an unsupported device will execute the same compiled path. "}<a href={"https://pytorch.org/blog/flexattention/"}>{"FlexAttention introduction and examples"}</a>{", "}<a href={"https://docs.pytorch.org/docs/main/nn.attention.flex_attention.html"}>{"current API"}</a>{""}</Prose>

<H3>{"Modern sparse systems also pay to choose the reads"}</H3>

<Prose>{"The field has continued beyond the early fixed patterns. The following mechanisms use the cited paper versions. Current serving-library formats are a separate dated contract, described below; these are not a leaderboard."}</Prose>

<Prose>The early methods chose fixed or routed records. Modern designs combine several sources. First draw NSA's three distinct reads; this is an architectural cutaway with illustrative records, not a newly trained model.</Prose><SparseNsaDrawing/>
<Prose>Compressed block messages, selected original messages and recent window messages each get their own normalization. Input-derived MLP-plus-sigmoid gates multiply the three completed outputs before they are added. The first picture aligns compressed-read shares to fine-grained selection blocks, adds their importance within the grouped query heads, chooses top blocks and gathers matching original key/value coordinates. The illustrated two-record selection blocks differ from the three-record compressed blocks, so overlap alignment is a real step. The second picture mixes the three completed reads; its gates are derived from the input representation, rather than directly from the final projected query. Each branch has separate key/value maps. For the symbolic selection illustration, suppose blocks 0 and 2 have the largest group importance; their ranking is stipulated, not computed from measured scores. These records explain the route; the complete paper specifies additional block, projection and training details.</Prose>

<Prose>{""}<strong>{"Native Sparse Attention (NSA)"}</strong>{" combines three separately normalized branches: compressed blocks, selected fine-grained blocks, and a local window. Compressed-attention scores help select important blocks, with selection shared across grouped heads. Learned sigmoid gates combine branch outputs; their sum is not required to be one. The three-branch design preserves local access while learning coarser and selected long-range reads. With a fixed compression stride, the compressed branch still grows with the number of compressed positions, so a fixed selection budget alone does not establish linear total work. "}<a href={"https://arxiv.org/html/2502.11089v1"}>{"NSA, §3"}</a>{""}</Prose>

<Prose>Instead of three gated reads, DSA first uses a cheaper indexer to choose the individual records for a main MLA read. Keep the small indexer projections distinct from the main learned query and cached representation.</Prose><SparseDsaDrawing/>
<Prose>The indexer compares its query/key coordinates, applies ReLU and weighted head aggregation, then chooses the largest scores. Those integer IDs gather matching main latent and positional records. The main query performs a fresh normalized read over the gathered records; the indexer's scores are not substituted for the main attention weights.</Prose>

<Prose>{""}<strong>{"DeepSeek-V3.2-Exp's DSA"}</strong>{" uses a small lightning indexer to select past positions for its main MLA read. The indexer aggregates query-head scores of the form "}<InlineMath>{"w_{tj}\\operatorname{ReLU}((q^I_{tj})^Tk^I_s)"}</InlineMath>{". It is first trained against a dense attention-derived target, then the main sparse model is adapted. Top-"}<InlineMath>{"k"}</InlineMath>{" indices are discrete; ordinary backpropagation through their integer selection is not the indexer's training method. The report explicitly distinguishes order "}<InlineMath>{"Lk"}</InlineMath>{" main attention from the indexer's still-quadratic sequence comparison, albeit with a smaller cost. "}<a href={"https://raw.githubusercontent.com/deepseek-ai/DeepSeek-V3.2-Exp/main/DeepSeek_V3_2.pdf"}>{"V3.2-Exp technical report, §1–3"}</a>{""}</Prose>

<Prose>CSA2 adds a second distinction: a layer may reuse global memory, selected IDs, or both. Compare the three actual routes; every lane still has a fresh main query and local sliding-window records.</Prose><SparseCsaDrawing/>
<Prose>Full builds and indexes new compressed memory. Reindex uses matching memory but forms new indexer queries and new selected IDs. Reuse keeps matching earlier memory and IDs while making the current main read. Reusing a cache from a different sequence, model or memory identity would mix unrelated operands.</Prose>
<Prose>Within hierarchical selection, the initial full scan first forms a candidate pool. A later layer searches that pool rather than every global record.</Prose><SparseHierarchicalSelectionDrawing/>
<Prose>The illustrated eight scores choose two blocks, retaining original IDs 2–5. A later query rescans those matching candidate records. The first scan still exists; reduced later search does not make its cost disappear.</Prose>

<Prose>{""}<strong>{"DeepSeek-V4.1's CSA2"}</strong>{" distinguishes layers that build and index new compressed memory, layers that reuse memory but issue fresh index queries, and layers that reuse both memory and selected indices. Its hierarchical decoder indexer obtains a candidate pool from an initial full scan; later reindexing searches that pool. Local sliding-window memory remains a separate source. The architecture's causal encoder–decoder division changes which layer supplies the global memory, so memory reuse and selection reuse must not be conflated. These are separate mechanisms from NSA's three gated outputs. "}<a href={"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf"}>{"V4.1 report, §2.2–2.3"}</a>{""}</Prose>

<Prose>{""}<strong>{"Candidate discovery"}</strong>{", "}<strong>{"main selected reads"}</strong>{", "}<strong>{"local reads"}</strong>{", and "}<strong>{"cross-layer reuse"}</strong>{" incur separate costs, as the connected paths below show. It does not invent a speedup from an edge count. Current "}<a href={"https://github.com/deepseek-ai/FlashMLA"}>{"FlashMLA source documentation"}</a>{" provides concrete examples of dense and sparse kernels with architecture-specific formats; a cache format or benchmark cannot be transplanted unchanged between model versions."}</Prose>

<Prose><strong>Serving-version boundary, checked 5 October 2026.</strong> Current FlashMLA removed its earlier Hopper and V3/V3.2/V4.0 paths in a 30 September interface change. Its current V4.1 paths target SM100–SM103 and use architecture-specific 528/288-byte stored-record contracts. Those layouts are not the historical V3 dense educational cache from the <a href="/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals">MLA lesson</a>. Match the exact model, kernel revision, device and stored fields; the <a href="https://github.com/deepseek-ai/FlashMLA">current repository</a> states the supported paths. No GPU kernel is executed by this browser lesson.</Prose>



<H2>{"7. Compare three operators on observed hand trajectories"}</H2>

<Prose>{"An abstract graph tells us whether an effect is possible. A trained example tells us what a particular learned system actually does. We will forecast the next two-dimensional point of an observed hand movement using the openly licensed "}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"UCI Libras Movement dataset"}</a>{", credited to Dias, Peres and Bíscaro, under CC BY 4.0."}</Prose>

<Prose>{"The source has 360 trajectories of 45 points and 15 movement labels. Exact coordinate duplicates reduce it to 330 unique trajectories; duplicate labels agree. We retain the first row in each exact-duplicate group "}<strong>{"before splitting"}</strong>{", so identical trajectories do not appear on both sides of the evaluation. A fixed classwise seed-73 split gives 220 training, 50 validation and 60 test trajectories. Movement labels are used only for stratification, not as model inputs. Positions 0–43 predict 1–44, using fixed input scaling "}<InlineMath>{"2x-1"}</InlineMath>{"."}</Prose>

<Prose>{"The source describes four performers and two recording sessions but does not supply row-level performer/session identifiers. This split tests held-out trajectories, not new-person or new-session generalization. The processed coordinate records also do not validate a live image-to-coordinate pipeline. This familiar dataset is intentionally reused from earlier lessons; the new test comparison is not an independent new benchmark across those lessons."}</Prose>

<H3>{"Hold the experiment fixed"}</H3>

<Prose>A next-point error has two coordinates. Square each coordinate error and average them across the evaluated pairs to obtain <strong>mean squared error (MSE)</strong>; its square root is <strong>root mean squared error (RMSE)</strong>. Training uses scaled coordinates, while the reported RMSE is converted back to the source coordinate units. The validation set selects an update; the untouched test set measures that selected model.</Prose>

<Prose>{"Each model has 4,946 learned parameters: a 2→24 input map, fixed sinusoidal position addition, one pre-norm block with three 8-wide heads, a 24→48→24 GELU FFN, final normalization and a two-coordinate output. There is no dropout or weight decay. The only operator change is dense causal softmax, a five-key causal softmax window, or normalized ELU+1 feature attention. Identical seed-137 initialization and 160 full-batch Adam updates at learning rate 0.003 give an equal-budget local comparison."}</Prose>

<Prose>{"Each model selects its lowest validation MSE, taking the earliest exact tie. All selected update 160, the budget endpoint. We did not extend the run to make a preferred outcome emerge, and this result does not establish convergence. A persistence baseline predicts the current point as the next; a six-parameter affine baseline is fitted using training pairs only. RMSE pools both coordinates and all next-point errors in each split, in the source's original coordinate units."}</Prose>

<NeuralTable caption={"Hold the experiment fixed"} headers={[<>{"Predictor"}</>,<>{"Training RMSE"}</>,<>{"Validation RMSE"}</>,<>{"Test RMSE"}</>]} rows={[[<>{"Persistence"}</>,<>{"0.027529"}</>,<>{"0.026304"}</>,<>{"0.026458"}</>],[<>{"Training-fitted affine"}</>,<>{"0.027334"}</>,<>{"0.026154"}</>,<>{"0.026222"}</>],[<>{"Dense causal softmax"}</>,<>{"0.024152"}</>,<>{"0.023358"}</>,<>{"0.023219"}</>],[<>{"Five-key causal window"}</>,<>{"0.025147"}</>,<>{"0.023907"}</>,<>{"0.024684"}</>],[<>{"ELU+1 feature kernel"}</>,<>{"0.026106"}</>,<>{"0.025327"}</>,<>{"0.024680"}</>]]} />

<Prose>{"All three learned operators improve on these simple baselines in this run. Dense attention has the lowest test RMSE here. The window and kernel test results differ by only about "}<InlineMath>{"0.0000041"}</InlineMath>{", far too little to promote into an architectural verdict from a single split and seed. There is no measured GPU timing comparison in this table."}</Prose>

<H3>{"Look at one actual prefix and a controlled edit"}</H3>

<Prose>{"The worked example uses source row 77, first 32 observed points. The true next point is approximately "}<InlineMath>{"(0.593810,0.250000)"}</InlineMath>{". Keep the weights fixed and reflect the x coordinate at zero-based frame 23 around 0.5: "}<InlineMath>{"x\\mapsto1-x"}</InlineMath>{". This is an artificial sensitivity intervention on a real recorded trajectory, not another observed movement."}</Prose>

<NeuralTable caption={"Look at one actual prefix and a controlled edit"} headers={[<>{"Operator"}</>,<>{"Original next-point forecast"}</>,<>{"Forecast after editing frame 23"}</>]} rows={[[<>{"Dense"}</>,<>{""}<InlineMath>{"(0.598713,0.250658)"}</InlineMath>{""}</>,<>{""}<InlineMath>{"(0.601801,0.252266)"}</InlineMath>{""}</>],[<>{"Window"}</>,<>{""}<InlineMath>{"(0.609244,0.247768)"}</InlineMath>{""}</>,<>{""}<InlineMath>{"(0.609244,0.247768)"}</InlineMath>{""}</>],[<>{"Feature kernel"}</>,<>{""}<InlineMath>{"(0.601817,0.248507)"}</InlineMath>{""}</>,<>{""}<InlineMath>{"(0.603256,0.248870)"}</InlineMath>{""}</>]]} />

<Prose>{"The window result is an exact null in this model: at final input position 31, its single attention layer reads positions 27–31, and all other operations are tokenwise. Frame 23 has no route to that output. The other two models change modestly; a global path does not require a dramatic response. In all three models, outputs before the edited position remain exactly unchanged, as causality requires."}</Prose>



<Prose>{"At this 32-point prefix, float32 numeric attention payloads are 6,144 bytes for dense K/V, 960 for window K/V, and 864 for kernel "}<InlineMath>{"S,z"}</InlineMath>{". These exclude weights, outputs, position counters, index metadata and allocator overhead. They are not peak memory measurements. Dense and window incremental forecasts agree with their full-prefix computation to below "}<InlineMath>{"2.4\\times10^{-7}"}</InlineMath>{" maximum absolute error in transformed output coordinates. The kernel's recurrent and explicit pairwise implementations agree below "}<InlineMath>{"2.7\\times10^{-7}"}</InlineMath>{". Separate float64 checks give whole-network gradient agreement below "}<InlineMath>{"3.6\\times10^{-15}"}</InlineMath>{" for this small checked input."}</Prose>

<H3>Follow the complete fitted calculation, then change the prefix</H3>
<Prose>The live case deliberately switches to the first 27 points of the same recorded source row 77. The chosen initial frame is 19, and reflection changes y to 1−y; these differ from the 32-point x-reflection worked table above. All three frozen models evaluate the same live edits, without browser training. Start by choosing how many observed points are supplied.</Prose><SparseForecastInvestigation question="prefix"/>
<Prose>Where do the taught read operators sit inside the actual forecaster? Follow the complete current-prefix route below.</Prose><SparseFittedRoute stage="network"/><Prose>Each source point is scaled to [2x−1,2y−1], transformed into 24 coordinates and given its fixed sinusoidal position. The pre-normalized attention update is added to its saved bypass; a second normalized 24→48→24 feed-forward update is added next. A final norm and two-coordinate map forecast the next point.</Prose>
<Prose>This drawing shows actual current arrays. Its first six coordinates are an explicitly labelled cutaway, while the model still uses all 24 or 48. Follow one complete learned multiply-and-bias route at a time:</Prose><SparseFittedRoute stage="stem"/>
<Prose>The next operation normalizes the full row before any attention projection. Inspect its actual mean, variance, divisor and learned affine correction.</Prose><SparseFittedRoute stage="norm-attention"/><Prose>The stem's amber weights multiply the two scaled input coordinates and add its learned bias. After position addition, normalization first centers the 24-coordinate row, computes its population variance, divides by √(variance+10⁻⁵), and applies learned gain and offset.</Prose>
<Prose>How does the normalized row become each head's query, key and value? Inspect one output coordinate from each learned map.</Prose><SparseFittedRoute stage="query"/><SparseFittedRoute stage="key"/><SparseFittedRoute stage="value"/><Prose>The normalized row supplies separate query, key and value maps; each eight-coordinate head has its own slices. Inspect their actual product terms and biases:</Prose>
<Prose>How does the combined read write into the next branch? Inspect the learned output map and then the feed-forward input normalization.</Prose><SparseFittedRoute stage="output"/><SparseFittedRoute stage="norm-feedforward"/><Prose>The completed head reads are concatenated before the learned output map writes the attention update. Its saved input is added back; the next norm prepares the feed-forward branch.</Prose>
<Prose>The next three operations expand, transform and contract the row. The middle GELU operation multiplies a coordinate by a smooth factor; its labelled curve probability is the standard-normal cumulative distribution.</Prose><SparseFittedRoute stage="expand"/><SparseFittedRoute stage="gelu"/><SparseFittedRoute stage="contract"/><Prose>The feed-forward up-map expands 24 coordinates to 48. Exact GELU multiplies each coordinate by its standard-normal cumulative probability, and the down-map writes 24 coordinates for the second bypass addition.</Prose>
<Prose>Which final maps turn the hidden row into a next-point forecast? Inspect normalization and the two-coordinate learned write.</Prose><SparseFittedRoute stage="norm-final"/><SparseFittedRoute stage="forecast"/><Prose>Finally the full row is normalized and mapped to two scaled forecast coordinates; undoing the input scaling returns the source coordinate units.</Prose>
<Prose>Now choose one observed point and edit its x or y coordinate. All learned maps stay fixed. The unedited next-point truth is shown only while the recorded prefix is unchanged; an artificial edit has no observed new target.</Prose><SparseForecastInvestigation question="point"/>
<Prose>Reflection around 0.5 gives a convenient held-point comparison. The first action reflects the selected frame's y coordinate to 1−y. The second chooses the second-last input and reflects its y, placing the edit inside the final window. Restore returns all coordinates to the recording. The five-key window can respond only when the edited frame lies in the final read's window.</Prose><SparseForecastInvestigation question="reflect"/>
<Prose>This shared output view compares all current forecasts, the original recorded-case forecasts and their coordinate differences. Numeric payloads count only the attention state, excluding parameters, metadata and temporary arrays.</Prose><SparseForecastComparison/>
<Prose>Select one of the current models and one of its three heads. The inspection uses the edited prefix from above, including its current length, points and reflection; it does not revert to a fresh baseline.</Prose><SparseForecastHeadInvestigation/>
<Prose>Restore the recorded prefix and all connected edits here, including an invalid draft field that already has the same last-valid value as its default.</Prose><SparseForecastInvestigation question="reset"/>

<H3>{"Approximate one trained dense head without retraining it"}</H3>

<Prose>{"Take the selected dense model's actual head-0 queries, keys and values from the worked prefix. Compare exact softmax output against positive independent Gaussian features, using seeds 0–7 and nested feature counts 16, 64 and 256. For each run, measure"}</Prose>

<Prose>The subscript F denotes the <strong>Frobenius norm</strong>: square every matrix entry, add those squares and take the square root. The numerator measures the whole head-output difference; dividing by the exact output's norm makes it relative to the size of that output.</Prose>

<MathBlock>{"\\text{relative output error}=\\frac{\\|\\widehat O-O\\|_F}{\\|O\\|_F}."}</MathBlock>

<Prose>{"The denominator is nonzero for this saved head. The metric compares the whole prefix's head outputs, not model RMSE or probabilities of a downstream label."}</Prose>

<NeuralTable caption={"Approximate one trained dense head without retraining it"} headers={[<>{"Features"}</>,<>{"Mean error over eight seeds"}</>,<>{"Smallest–largest observed error"}</>]} rows={[[<>{"16"}</>,<>{"0.043293"}</>,<>{"0.021708–0.077060"}</>],[<>{"64"}</>,<>{"0.031098"}</>,<>{"0.016960–0.042411"}</>],[<>{"256"}</>,<>{"0.017026"}</>,<>{"0.011095–0.022679"}</>]]} />

<Prose>The following plot and full table retain all 24 measured trials. They use the saved 32-point head-0 fixture above, not the edited 27-point live case. Selecting a seed highlights its nested sequence without resampling.</Prose><SparseRecordedStudy/>

<Prose>{"The average falls, but individual nested draws do not all improve at every step. Seed 5 worsens from about 0.02171 to 0.02813 when going from 16 to 64 features. Seed 6 worsens slightly from 64 to 256. Keep those outcomes in the plot. These are operator approximations of a fixed dense head, not results from training a Performer, and not a worst-case guarantee."}</Prose>

<H3>{"Run the complete teaching programs"}</H3>

<Prose>{"The packet includes the original small data files, "}<a href={"/learn-code/sparse-linear-attention-variants/provenance.md"}>{"data attribution and provenance"}</a>{", "}<a href={"/learn-code/sparse-linear-attention-variants/author-calculations.py"}>{"the complete CPU training and evaluation program"}</a>{", "}<a href={"/learn-code/sparse-linear-attention-variants/mechanism-calculations.py"}>{"mechanism calculations"}</a>{", and the actual saved models/results. Use Python with NumPy and PyTorch in your own environment; the recorded execution used Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, one CPU thread."}</Prose>

<CodeBlock language={"bash"}>{"python -m venv .venv\n# Activate .venv using your shell's normal activation command.\npython -m pip install numpy==2.3.5 torch==2.14.0\npython mechanism-calculations.py\npython author-calculations.py"}</CodeBlock>

<Prose>{"Run from the downloaded packet directory. The programs use local data and perform no network access. The mechanism program checks sparse gathered/masked equality, graph reach, feature-state reads and the fresh numerical cases. The training program supplies data loading, duplicate handling, split construction, all model layers, training, validation selection, baselines, incremental evaluation, gradient checks, saved forecasts and the 24 random-feature trials. Every named helper is included in the downloadable source."}</Prose>

<Prose>The training program reads <a href="/learn-code/sparse-linear-attention-variants/movement_libras.data" download>movement_libras.data</a> from the same directory. For the optional saved-model check, also download <a href="/learn-code/sparse-linear-attention-variants/forecast-models.json" download>forecast-models.json</a>. The retained <a href="/learn-code/sparse-linear-attention-variants/author-results.json" download>experiment results</a> and <a href="/learn-code/sparse-linear-attention-variants/random-feature-results.json" download>all random-feature trials</a> let you inspect the numerical evidence without rerunning training. Running the training program writes new result/model files in your local directory; keep those separate from these retained results.</Prose>

<RemoteCodeBlock source="/learn-code/sparse-linear-attention-variants/author-calculations.py" language="python" title="Complete trainable forecasters and retained study"/>
<RemoteCodeBlock source="/learn-code/sparse-linear-attention-variants/mechanism-calculations.py" language="python" title="Sparse graphs, feature reads and random samplers"/>

<Prose>{"Expected recorded model lines are dense/window/kernel selecting update 160 with the RMSE values above; each program ends with a named PASS line. Different supported software or hardware can change last digits. If you alter the data, seed or protocol, label the new result as a new experiment. Training here computes small dense reference masks and, for kernel attention, stores prefix states for automatic differentiation. The code teaches the operator and verifies its recurrence; it is not a high-performance sparse GPU kernel or a constant-memory training implementation."}</Prose>

<Prose>{"For a minimal streaming implementation you can inspect the following complete NumPy example. Inputs are already feature vectors, so it cleanly separates the recurrence from the choice of feature map."}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\n\ndef causal_feature_attention(query_features, key_features, values):\n    q = np.asarray(query_features, dtype=float)\n    k = np.asarray(key_features, dtype=float)\n    v = np.asarray(values, dtype=float)\n    if q.ndim != 2 or k.shape != q.shape or v.ndim != 2 or len(v) != len(q):\n        raise ValueError(\"Expected matching (length, features) Q/K and (length, values) V.\")\n    if not all(np.isfinite(x).all() for x in (q, k, v)) or (q < 0).any() or (k < 0).any():\n        raise ValueError(\"Use finite nonnegative features and finite values.\")\n    memory = np.zeros((k.shape[1], v.shape[1]))\n    normalizer = np.zeros(k.shape[1])\n    outputs = []\n    for query, key, value in zip(q, k, v):\n        memory += np.outer(key, value)\n        normalizer += key\n        denominator = query @ normalizer\n        if denominator <= 0:\n            raise ValueError(\"No positive overlap with this prefix.\")\n        outputs.append(query @ memory / denominator)\n    return np.asarray(outputs)\n\nq = [[2, 1], [2, 1], [2, 1]]\nk = [[1, 0], [0, 1], [1, 1]]\nv = [[2], [-1], [3]]\nprint(causal_feature_attention(q, k, v).ravel())\n# [2. 1. 2.]"}</CodeBlock>

<H3>Write a compact streaming memory and test its contract</H3>
<Prose>The short recurrence above isolates the algebra. The next complete program adds finite and shape validation, fixed feature-map identity, known-write eviction, reset, explicit empty-read errors and atomic append-and-read. It also implements stabilized Gaussian memory and a genuinely gathered window, then compares them with independent NumPy and ordinary PyTorch routes.</Prose>
<RemoteCodeBlock source="/learn-code/sparse-linear-attention-variants/sparse-feature-memory.py" language="python" title="Validated compact feature memory, gradients and library comparisons"/>
<Prose>Run <code>python sparse-feature-memory.py</code> with NumPy and PyTorch. Its default checks do not train, download data or write files. Optionally run <code>python sparse-feature-memory.py --saved-models</code> beside <code>author-calculations.py</code>, <code>forecast-models.json</code> and <code>movement_libras.data</code> to reload the three saved models without refitting them.</Prose>
<Prose><code>FeatureMemory.append</code> accepts a nonnegative key and finite message; a zero key is a valid zero contribution. <code>read</code> requires positive overlap. <code>append_and_read</code> stages the prospective state and validates the result before committing; a failed read leaves the old state unchanged. <code>remove_known</code> requires the caller to know that write was included: the compact arrays cannot authenticate arbitrary historical membership.</Prose>
<Prose><code>GaussianFeatureMemory</code> fixes the projection matrix for the memory's lifetime. It stores a common key log scale; if a new key raises it, both old arrays are rescaled before the new write. Query scaling is local and cancels from its own normalized read. A cache belongs to one feature map, model, sequence and positional convention; substituting any of them requires rebuilding the relevant state.</Prose>
<Prose>The streaming inference state contains S and z. The independent pair reference constructs each causal read directly; the training gradient function keeps the prefix states needed for its reverse scan. <code>causal_gradients</code> differentiates supplied <strong>feature-coordinate</strong> queries, keys and values. It does not claim to backpropagate through the Gaussian map, learned projections or adaptive inference-cache rescaling. The saved trainable forecasters separately use PyTorch autodiff through their defined ELU+1 map and whole network.</Prose>
<Prose>The no-writer program checks invalid appends without state corruption, empty and zero-support reads, eviction, reset, chunk/stream equality, Gaussian rescaling, all feature-coordinate gradients and gathered-window equality with SDPA. The historical <code>author-checks.py</code> is a manuscript verifier that expects an extra <code>lesson.md</code> and writes a receipt; it is not presented as a standalone learner script. The runnable checks above need no manuscript file.</Prose>

<H3>{"Implement the other compression choices, not just name them"}</H3>

<Prose>{"The first program implements the trained causal dense/window/kernel comparison. The additional "}<a href={"/learn-code/sparse-linear-attention-variants/attention_compression_bridges.py"}>{"sequence-compression program"}</a>{" opens the bidirectional Linformer and Nyström operations from §5 and supplies an actual gathered-window route. It requires only PyTorch; run "}<code>{"python attention_compression_bridges.py"}</code>{"."}</Prose>

<RemoteCodeBlock source="/learn-code/sparse-linear-attention-variants/attention_compression_bridges.py" language="python" title="Learned and landmark summaries; gathered window and SDPA"/>

<Prose>{""}<code>{"linformer"}</code>{" contains two learned length-axis matrices E and F. It computes EK and FV first, then runs attention over those compressed slots. Its normal tool route calls SDPA on the same compressed arrays. E/F receive gradients alongside Q/K/V; a learned summary is not a fixed downsampling label. The program compares values and all five gradients under identical initial arrays. It intentionally has "}<strong>{"no causal mask"}</strong>{": making a full-sequence summary and applying a later triangle cannot remove future information already mixed into the summary."}</Prose>

<Prose>{""}<code>{"nystrom"}</code>{" forms segment-mean query/key landmarks. Seven positions split into three segments retain the trailing positions. It constructs the three softmax factors, uses a tolerance-controlled pseudoinverse for the small middle matrix, and multiplies from the value side: "}<code>{"front @ (pinv(middle) @ (back @ V))"}</code>{". It never materializes the L×L approximate weight matrix. The cost includes O(L r d) pair/factor work and O(r³) pseudoinversion, with O(Lr+r²) factor storage, in addition to the feature/value widths. A pseudoinverse is a well-defined tool here; implementing SVD again would repeat "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations"}>{"Matrix Decompositions"}</a>{". Near a rank threshold, derivatives can be sensitive: changing "}<code>{"rtol"}</code>{" changes which directions are retained and must be treated as a model/numerical decision."}</Prose>

<Prose>{""}<code>{"gathered_window"}</code>{" only scores the keys actually in a causal window: O(L W (d_k+d_v)) arithmetic and O(W) temporary scores per query, beyond inputs and outputs. Its SDPA comparison deliberately uses a dense mask as an independent semantic reference, "}<strong>{"not"}</strong>{" as evidence of sparse execution. The maintained tool takes responsibility for backend selection; a genuinely sparse accelerator path needs a kernel supporting the chosen block pattern."}</Prose>

<Prose>{"Recorded small CPU float64 probes gave the following checks: Linformer and gathered-window maximum API differences were each 1.11e-16; using every position as a Nyström landmark reproduced the dense result to 1.45e-15. Three landmarks gave maximum output error 0.25091 for this declared random fixture. That last number is a single approximation example, not a general error guarantee or a trained accuracy result. The random-feature Gaussian-marginal sampling and stabilizations remain owned by "}<code>{"mechanism-calculations.py"}</code>{"; they are different approximations from these learned/landmark summaries."}</Prose>

<Prose>{""}<strong>{"Take control."}</strong>{" Change sequence length to 11, use four landmarks and a window of width 1. Inspect both output and gradient checks. Then reduce "}<code>{"rtol"}</code>{" for nearly duplicate landmarks."}</Prose>

<details><summary>Hint</summary>Width one must return each position's own V. Unequal segment lengths are allowed; the inverse problem remains small.</details>

<details><summary>Solution and success criteria</summary>The window output equals V and has zero Q/K derivative. Linformer's manual/API equality should remain, while approximation quality is a separate measured quantity. Nyström with fewer landmarks need not improve monotonically for each input as count increases. Near duplicate landmarks, record singular values and chosen tolerance before interpreting a large gradient; smaller tolerance is not automatically a better model.</details>

<H2>{"8. Deeper connections and practical judgment"}</H2>

<H3>{"Backpropagation through a recurrent summary"}</H3>

<Prose>The stored state is also a route for learning credit. Use the shared manual memory from Section 3: a read divides its message numerator by its matching amount. A gradient is an arriving direction that says how a small output change would affect the loss.</Prose><SparseGradientInvestigation/>
<Prose>The solid wires carry the forward numerator and denominator. Orange dashed arrows carry credit back to the query, matrix and key sum. A message write affects later reads through S, while a key-feature write affects both S and z. Changing the two arriving output-credit coordinates isolates these routes without changing the stored case.</Prose>

<Prose>{"Forward equivalence is not enough if the two training paths differentiate different calculations. For a local read, write "}<InlineMath>{"a=\\phi(q)"}</InlineMath>{", numerator "}<InlineMath>{"n=S^Ta"}</InlineMath>{", denominator "}<InlineMath>{"b=a^Tz>0"}</InlineMath>{", and "}<InlineMath>{"o=n/b"}</InlineMath>{". If the arriving output gradient is "}<InlineMath>{"g=\\partial\\mathcal L/\\partial o"}</InlineMath>{", ordinary quotient differentiation gives"}</Prose>

<MathBlock>{"\\frac{\\partial\\mathcal L}{\\partial S}=\\frac{ag^T}{b},\\qquad\n\\frac{\\partial\\mathcal L}{\\partial z}=-\\frac{a(g^To)}{b},\\qquad\n\\frac{\\partial\\mathcal L}{\\partial a}=\\frac{Sg-z(g^To)}{b}."}</MathBlock>

<Prose>{"In a causal sequence, a write at position "}<InlineMath>{"j"}</InlineMath>{" influences every later state. Its gradient therefore collects contributions from reads "}<InlineMath>{"t\\ge j"}</InlineMath>{", which can be accumulated by a reverse scan. For its direct outer-product contribution, if the accumulated matrix gradient is "}<InlineMath>{"G_j"}</InlineMath>{", then the value gradient includes "}<InlineMath>{"G_j^T\\phi(k_j)"}</InlineMath>{"; the key-feature gradient includes "}<InlineMath>{"G_jv_j"}</InlineMath>{" plus the normalizer contribution. The chain rule then differentiates the feature map and input projections."}</Prose>

<Prose>{"You can parallelize prefix operations or process chunks, but the memory layout and backward strategy still matter. A naive "}<code>{"cumsum"}</code>{" over all outer products stores an "}<InlineMath>{"L\\times m\\times d_v"}</InlineMath>{" tensor. A custom scan/recomputation method can trade storage for work. Our saved all-parameter gradient comparison checks the defined small model, including surrounding normalization and FFN, rather than checking only one isolated final sum."}</Prose>

<H3>{"Gates and delta updates change the memory, not just its speed"}</H3>

<Prose>An additive state accumulates writes. A <strong>delta update</strong> instead reads its current prediction at a key and writes a correction toward the new message. The following separate two-feature case uses unit key [1,0], a full-strength correction β = 1 and no decay γ = 1.</Prose><SparseDeltaDrawing/>
<Prose>The old read is [1,−0.5] and the new message [3,2], so the error is [2,2.5]. The key's outer product with that error adds to the first state row, making its new read exactly [3,2]. The other row is retained. A decay γ scales old state before a write; a correction strength β scales the error write.</Prose>

<Prose>{"The additive update "}<InlineMath>{"S_t=S_{t-1}+k_tv_t^T"}</InlineMath>{" retains every write with equal temporal persistence. A decay changes it to "}<InlineMath>{"S_t=\\gamma_tS_{t-1}+k_tv_t^T"}</InlineMath>{", so earlier contributions are multiplied by later decay factors. Featurewise gates allow different parts of memory to forget differently."}</Prose>

<Prose>{"A delta-style write instead uses the current prediction error for the key, for example"}</Prose>

<MathBlock>{"S_t=S_{t-1}+\\beta_t k_t(v_t-S_{t-1}^Tk_t)^T."}</MathBlock>

<Prose>{"For a unit key and "}<InlineMath>{"\\beta_t=1"}</InlineMath>{", the new read at that key is exactly "}<InlineMath>{"v_t"}</InlineMath>{": multiplying by "}<InlineMath>{"k_t^T"}</InlineMath>{" cancels the old prediction error. It behaves like correcting a stored association, not merely adding another copy. With a nonunit key, the same conclusion does not follow without adjusting the update. This explains why a family can have linear sequence scaling but different overwrite, normalization and retrieval behavior."}</Prose>

<Prose>{"The earlier "}<a href={"/learn/path/full-curriculum/rwkv-linear-attention-models?module=deep-learning-fundamentals"}>{"RWKV & Linear Attention Models"}</a>{" and "}<a href={"/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals"}>{"State Space Models"}</a>{" own the versioned recurrent mechanisms and selective dynamics. A signed recurrence or an mLSTM normalization is not automatically a positive normalized feature kernel, and none becomes exact row-softmax merely because matrix products can be reassociated. Use the update, read and normalization equations to classify a new model."}</Prose>

<H3>{"Position and masking are algebraic constraints"}</H3>

<Prose>{"A feature recurrence works when each write can be computed from the current/past information and each read uses the appropriate state. An arbitrary pairwise relative-position bias need not factor into a fixed-size query/key state. Some distance factors do: a scalar exponential decay corresponds to the recurrent weighting above. Other position schemes require extra features or a changed kernel. Rotating vectors before a nonlinear feature map does not establish the same relative-position identity as rotating the dot-product vectors; check the resulting similarity explicitly."}</Prose>

<Prose>Two independent documents must not share one prefix memory. The following packing picture attaches local IDs and an explicit state boundary to each document.</Prose><SparsePackingDrawing/>

<Prose>{"Packed documents need state resets or segmented scans at document boundaries. A single global sum over an entire batch of packed text leaks information across samples. During decoding, state updates must match whether the current token is included, the prompt prefix already processed, and the attention layer's positional convention. These are part of the operator, not cosmetic bookkeeping."}</Prose>

<H3>Separate state size from comparison work</H3>
<Prose>For an analytic budget example, fix three heads, eight key and value coordinates, and float32 fields. Sequence length L changes retained individual records and dense pair count; window W bounds local records; feature width m changes S and z. These are allocation and arithmetic counts, not measured latency or accuracy.</Prose><SparseBudgetInvestigation/>

<H3>{"Choose an experiment that can disprove your idea"}</H3>

<NeuralTable caption={"Choose an experiment that can disprove your idea"} headers={[<>{"Task need"}</>,<>{"Candidate to investigate"}</>,<>{"A revealing failure test"}</>]} rows={[[<>{"Predict a locally smooth signal"}</>,<>{"Window or recurrent summary, alongside simple baselines"}</>,<>{"Insert a relevant remote change; test new entities, not duplicate rows"}</>],[<>{"Retrieve an earlier exact identifier"}</>,<>{"Individual-key access, possibly selected or hybrid"}</>,<>{"Move the target, add distractors, vary delay and compare missed candidates"}</>],[<>{"Classify a complete structured document"}</>,<>{"Local/global graph or summaries"}</>,<>{"Remove structure labels; vary document length and cross-section dependencies"}</>],[<>{"Compress an existing softmax model"}</>,<>{"Approximation plus adaptation, with exact reference"}</>,<>{"Compare operator error, final task loss and required retraining separately"}</>],[<>{"Serve a long causal prompt"}</>,<>{"Measure prefill, decode, cache and selection costs"}</>,<>{"Include routing/indexing and batch/concurrency effects, not only kernel arithmetic"}</>]]} />

<Prose>{"An interesting scientific use follows from the graph picture. In a DNA sequence, a local motif and a distant regulatory context may both matter. A sparse graph can preserve cheap local comparisons while adding routes between distant regions. But graph connectivity alone does not establish biological relevance; evaluation must preserve meaningful held-out sequence/entity boundaries. Similarly, a protein's amino-acid sequence is one-dimensional while its interactions can be distant along that sequence. Efficient attention offers a way to examine longer contexts; a token-level prediction score is not itself a validated three-dimensional structure or function prediction. The research examples in the references are motivations for careful task design, not permission to infer such downstream capabilities from our hand-motion experiment."}</Prose>

<Prose>{"Retrieval before the model can reduce how much context enters it; efficient attention changes how the supplied context is processed. Neither universally replaces the other. A useful system may use both, and its evaluation should include evidence that retrieval did not discard the needed information."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practice and transfer"}</H2>

<Prose>{"Work these problems before opening the optional hints or solutions. They use different values and positions from both the worked explanations and the initial investigations."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Count the real connections"}</H3>

<Prose>{"A causal sequence has 20 positions and a window of four total keys including self. How many legal query/key pairs exist in one head? What is the farthest possible input distance after three such layers, assuming all other operations are tokenwise? Does reaching that distance guarantee a useful learned dependence?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count the growing first rows separately. A single layer moves information at most three positions."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first four rows contribute "}<InlineMath>{"1+2+3+4=10"}</InlineMath>{"; the next 16 contribute 64, totaling "}<strong>{"74"}</strong>{". Three layers can span at most "}<strong>{"9"}</strong>{" positions. This is possible information flow, not a guarantee that the learned weights preserve or use the information."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Compute a summary read"}</H3>

<Prose>{"Two key-feature vectors are "}<InlineMath>{"[1,2]"}</InlineMath>{" and "}<InlineMath>{"[3,1]"}</InlineMath>{", with scalar values "}<InlineMath>{"-2"}</InlineMath>{" and "}<InlineMath>{"4"}</InlineMath>{". The query features are "}<InlineMath>{"[2,1]"}</InlineMath>{". Compute "}<InlineMath>{"S,z"}</InlineMath>{", the two normalized weights and the output. Then change the second value to "}<InlineMath>{"-2"}</InlineMath>{" without changing any key or query."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The unnormalized key similarities are 4 and 7. A value edit changes the numerator, not the denominator."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{""}<InlineMath>{"S=[10,0]^T,z=[4,3]^T"}</InlineMath>{". The denominator is 11, weights are "}<InlineMath>{"4/11,7/11"}</InlineMath>{", and output is "}<strong>{""}<InlineMath>{"20/11\\approx1.81818"}</InlineMath>{""}</strong>{". With both values "}<InlineMath>{"-2"}</InlineMath>{", every normalized weighted average equals "}<strong>{""}<InlineMath>{"-2"}</InlineMath>{""}</strong>{". This is a useful null even if you later change the query."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Diagnose a misleading speed claim"}</H3>

<Prose>{"An implementation forms a "}<InlineMath>{"4096\\times4096"}</InlineMath>{" score matrix, then masks all but 64 keys per row and calls softmax. Its author says “only 64 keys are visible, so the matrix multiplication is linear in sequence length.” Identify the error and propose a correctness check for a genuinely gathered implementation."}</Prose>

<details><summary>Solution</summary>

<Prose>{"The full matrix multiplication has already computed all pairs; a later mask does not undo that work. Gather the legal key/value rows before comparison or use a kernel that skips masked blocks. For small fixed Q/K/V and a nonempty mask per row, compare the gathered outputs to a dense reference with illegal scores set to negative infinity. Test causal boundaries and a mask with uneven row lengths. Matching output establishes the specified sparse operator, not a speedup; timing requires the actual target implementation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. A future value inside a summary"}</H3>

<Prose>{"One sequence-summary row has coefficients "}<InlineMath>{"[0.2,0.3,0.5]"}</InlineMath>{", values "}<InlineMath>{"[5,0,6]"}</InlineMath>{", and only one attention slot. At query position 1, compare the full-sequence summary with the prefix-only summary. Change the last value to "}<InlineMath>{"-2"}</InlineMath>{". Which earlier output should remain invariant in a causal implementation?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"The full summary is "}<strong>{"4"}</strong>{", then becomes "}<strong>{"0"}</strong>{" after the future edit. The prefix-only summary is "}<strong>{"1"}</strong>{" before and after. These coefficients are not renormalized over the prefix. The full summary leaks; masking its sole slot cannot selectively remove the future component."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Compare the right memory quantities"}</H3>

<Prose>{"For batch one, four heads, "}<InlineMath>{"d_k=d_v=16"}</InlineMath>{", "}<InlineMath>{"L=2048"}</InlineMath>{" and float32 state, calculate dense K/V payload, a 32-key window payload, and feature state with "}<InlineMath>{"m=24"}</InlineMath>{". Exclude metadata and weights. Which calculation tells you peak training memory?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"Dense: "}<InlineMath>{"4\\times2048\\times(16+16)\\times4=\\mathbf{1,048,576}"}</InlineMath>{" bytes. Window: "}<InlineMath>{"4\\times32\\times32\\times4=\\mathbf{16,384}"}</InlineMath>{" bytes. Kernel state: "}<InlineMath>{"4\\times24\\times(16+1)\\times4=\\mathbf{6,528}"}</InlineMath>{" bytes. "}<strong>{"None"}</strong>{" gives peak training memory; gradients, saved activations, optimizer state and temporary computations are additional quantities."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Test a random-feature claim"}</H3>

<Prose>{"Someone reports that their kernel similarities are unbiased, so “the average normalized attention output must be exactly the original output.” Construct a two-outcome counterexample different from the one in §4. What else should be recorded when showing an error-versus-feature-count plot?"}</Prose>

<details><summary>One solution</summary>

<Prose>{"Let similarity estimates be equally likely "}<InlineMath>{"(2,1)"}</InlineMath>{" or "}<InlineMath>{"(6,1)"}</InlineMath>{", with values 1 and 0. The expected output is:"}</Prose><MathBlock>{String.raw`(2/3+6/7)/2=\mathbf{16/21}.`}</MathBlock><Prose>{"Normalizing mean similarities "}<InlineMath>{"(4,1)"}</InlineMath>{" yields "}<strong>{""}<InlineMath>{"4/5"}</InlineMath>{""}</strong>{", a different result. Record the fixed Q/K/V, scale, feature distribution, seeds, counts, whether draws are nested, normalization, error metric and all declared outcomes. Do not discard seeds that worsen as features are added."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Repair a streaming feature bug"}</H3>

<Prose>{"A program computes exponential key features, subtracting each key's own largest log-feature value before writing it into memory. Queries are similarly centered per row. It claims the result is unchanged because “softmax ignores additive constants.” Which centering is safe, and what state repair is needed when the common key scale changes?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"A scalar multiplier shared by all features of one query cancels in that query's numerator and denominator. A scalar shared by "}<strong>{"all keys"}</strong>{" also cancels. Different per-key scalars change relative key contributions. Maintain a common key scale and, when it changes, multiply the existing "}<InlineMath>{"S,z"}</InlineMath>{" by the corresponding conversion factor before adding the new write. The usual row-softmax invariance does not justify unrelated rescaling of separate keys."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Explain an exact local null"}</H3>

<Prose>{"A model has two causal attention layers, each with a three-key window, and tokenwise FFNs. Its last input is at position 14. Can changing raw input position 8 affect output 14? What about position 10? How would you distinguish a missing path from a learned near-zero response?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"The maximum distance is "}<InlineMath>{"2(3-1)=4"}</InlineMath>{". Position 8 is six positions away, so it cannot affect output 14 under these assumptions. Position 10 is reachable, so a dependence is possible but may be weak or absent for particular weights and values. Check graph reach independently of numerical sensitivity; a small observed change cannot prove a missing path. Cross-position normalization, convolution or another global operation would change the assumptions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Design a fair comparison"}</H3>

<Prose>{"You want to replace dense attention in a code-assistance model. A window model wins on next-token loss averaged over short files. Specify a test that could reveal a meaningful weakness, and separate an operator-level comparison from a trained-model comparison."}</Prose>

<details><summary>One solution</summary>

<Prose>{"Create held-out files or repositories requiring earlier definitions, renamed identifiers and distractors at varied distances; prevent near-duplicate leakage. Compare exact correctness on those dependencies and behavior on ordinary code. For an operator test, hold Q/K/V and weights fixed and measure output differences caused by the replacement. For a model comparison, permit declared adaptation/training and report its budget, validation selection and untouched test results. Measure prefill, decoding, cache and total latency on the target device separately. A short-file average alone does not establish long-range retrieval ability."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Interpret a modern indexer's complexity"}</H3>

<Prose>{"A sparse main attention layer reads a fixed 512 selected keys per query, but its indexer compares each query with every earlier key. Is the complete sequence computation linear in "}<InlineMath>{"L"}</InlineMath>{"? If a later layer reuses a candidate pool, does that erase the first layer's cost?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"The main read is order "}<InlineMath>{"512L"}</InlineMath>{" times its per-pair cost, but the all-prefix indexer contributes order "}<InlineMath>{"L^2"}</InlineMath>{" comparisons. A smaller indexer dimension or precision can make that term practically cheaper without changing its order. Reusing a bounded candidate pool can reduce later selection work; the initial scan still belongs in the total. The selected memory representations, selected indices and fresh queries must each be accounted for."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"10. Another way to learn, and what comes next"}</H2>

<Prose>{"For a visual explanation of graph connectivity, read Google Research's "}<a href={"https://research.google/blog/constructing-transformers-for-longer-sequences-with-sparse-attention-methods/"}>{"Constructing Transformers for Longer Sequences with Sparse Attention Methods"}</a>{". Its graph, sentence/paragraph and blockification explanations are useful companions to §2 and §6. The 2021 hardware limits and broad performance wording describe that historical setting; use this lesson's explicit causal and cost distinctions when interpreting them."}</Prose>

<Prose>{"For a different view of feature factorization, read the authors' "}<a href={"https://research.google/blog/rethinking-attention-with-performers/"}>{"Rethinking Attention with Performers"}</a>{". Its matrix-association and prefix-sum visuals accompany §3–4, and its protein example provides another application. Read its “unbiased attention” shorthand with the kernel-versus-normalized-ratio distinction developed here. Both articles offer a useful visual companion to the self-contained derivations here."}</Prose>

<Prose>{"For implementation practice, the "}<a href={"https://pytorch.org/blog/flexattention/"}>{"FlexAttention tutorial"}</a>{" shows how score modifications and block masks connect to compiled kernels. The current "}<a href={"https://docs.pytorch.org/docs/main/nn.attention.flex_attention.html"}>{"API reference"}</a>{" is the version-sensitive companion. GPU execution and latency comparisons are separate from the CPU programs supplied here."}</Prose>

<Prose>For a second window explanation, <a href="https://sebastianraschka.com/faq/docs/sliding-window-attention.html">Raschka's sliding-window treatment</a> contrasts a moving window with disjoint chunks and discusses which old cache records can be evicted. Check its boundary convention against this lesson's W, which includes the current key. It complements the successive-layer path drawings rather than replacing the causal graph.</Prose>

<Prose>{"Primary reading, by the question it answers:"}</Prose>

<ul><li>{""}<a href={"https://arxiv.org/html/1904.10509v1"}>{"Sparse Transformer"}</a>{": how alternating spatial patterns create routes through layers."}</li><li>{""}<a href={"https://arxiv.org/html/2004.05150v2"}>{"Longformer"}</a>{" and "}<a href={"https://arxiv.org/html/2007.14062v2"}>{"BigBird"}</a>{": local/global graph design and the limits of expressivity claims."}</li><li>{""}<a href={"https://arxiv.org/html/2001.04451v2"}>{"Reformer"}</a>{" and "}<a href={"https://aclanthology.org/2021.tacl-1.4.pdf"}>{"Routing Transformer"}</a>{": candidate discovery by hashing or clustering."}</li><li>{""}<a href={"https://proceedings.mlr.press/v119/katharopoulos20a/katharopoulos20a.pdf"}>{"Transformers are RNNs"}</a>{": feature-state recurrence and causal differentiation."}</li><li><a href="https://proceedings.mlr.press/v139/schlag21a/schlag21a.pdf">Linear Transformers Are Secretly Fast Weight Programmers</a>: deterministic product features, finite-address interference and the distinction between additive and corrective writes.</li><li>{""}<a href={"https://arxiv.org/html/2009.14794v4"}>{"Performer"}</a>{": positive random features, Gaussian versus fixed-radius constructions, and approximation analysis."}</li><li>{""}<a href={"https://arxiv.org/html/2006.04768v3"}>{"Linformer"}</a>{" and "}<a href={"https://arxiv.org/html/2102.03902v3"}>{"Nyströmformer"}</a>{": two distinct routes through a small intermediate dimension."}</li><li>{""}<a href={"https://arxiv.org/html/2502.11089v1"}>{"NSA"}</a>{", "}<a href={"https://raw.githubusercontent.com/deepseek-ai/DeepSeek-V3.2-Exp/main/DeepSeek_V3_2.pdf"}>{"V3.2-Exp report"}</a>{", and "}<a href={"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf"}>{"V4.1 report"}</a>{": current examples where selection, compression and reuse have separate mechanisms and costs."}</li><li>{""}<a href={"https://arxiv.org/html/2009.06732v3"}>{"Efficient Transformers survey"}</a>{": a historical map of families and evaluation issues, not a current exhaustive ranking."}</li></ul>

<Prose>{"You are ready for the next lesson when you can identify the legal input path, explain the stored state, calculate one sparse and one feature-kernel read, and propose a control that would expose a misleading efficiency claim. You do not need to memorize every architecture's acronym."}</Prose>

<Prose>{"The next topic in the module is "}<a href={"/learn/path/full-curriculum/vision-transformers-vit-deit-swin-dinov2?module=deep-learning-fundamentals"}>{"Vision Transformers: ViT, DeiT, Swin and DINOv2"}</a>{". Image patches give the sparse graph a two-dimensional geometry; shifted windows and learned image representations will make the connection concrete. Later "}<a href={"/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals"}>{"Mixture-of-Experts Transformers"}</a>{" sparsify which expert computations run, a different axis from selecting attention edges."}</Prose></section>
 </SparseCaseProvider></div>,
};
