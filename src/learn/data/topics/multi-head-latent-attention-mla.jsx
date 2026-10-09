import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as ContentMathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { MlaOpeningDownDrawing, MlaOpeningProjectionsDrawing, MlaContentReadDrawing, MlaNormalizationDrawing, MlaKeyAbsorptionDrawing, MlaValueRoutesDrawing, MlaOutputWriteDrawing, MlaRotationOrderDrawing, MlaRotaryReadDrawing, MlaRmsDrawing, MlaQueryProjectionDrawing, MlaBasisDrawing, MlaNonlinearDrawing, MlaCompactRecordDrawing, MlaSdpaDrawing, MlaPinnedRecordDrawing, MlaSoftmaxRankDrawing, MlaBackwardDrawing, MlaGvaDrawing } from '../../components/lesson-labs/LatentAttentionFlowFigures.jsx';
import { MlaJointFactorDrawing, MlaSvdFactorDrawing, MlaPartialRotaryDrawing, MlaScalarNonlinearDrawing } from '../../components/lesson-labs/LatentAttentionFactorFigures.jsx';
import { LatentCaseProvider, MlaManualLab, MlaRotaryLab, MlaHistoryLab, MlaRotationLab, MlaBasisLab, MlaNonlinearLab, MlaBudgetLab, MlaBudgetResults, MlaRankLab, MlaMergeLab, MlaModelProvider, MlaMovementLab, MlaMovementResults, MlaHeadInspection, MlaNetworkPaths, MlaModelMap, MlaModelRowInspector, MlaModelResidual, MlaModelNonlinear, MlaModelNormalization, MlaTaskBacktransform, MlaProgram } from '../../components/lesson-labs/LatentAttentionFlowLabs.jsx';
import { latentManualCase, latentCaseRead } from '../latent-attention-reading-fixtures.js';
import '../../components/lesson-labs/neural-lesson-neutral.css';
function MathBlock({children,caption}) {
  return <div className="mla-equation-scroll" tabIndex={0} role="region" aria-label="Equation; scroll horizontally to read its complete expression"><ContentMathBlock caption={caption}>{children}</ContentMathBlock></div>;
}
const lesson = { title: 'Multi-Head Latent Attention (MLA)', readTime: 'In-depth lesson + hands-on practice', content: () => <div className="mla-lesson neural-lesson neural-lesson-neutral lesson-flow"><LatentCaseProvider>
<Prose>Imagine remembering a long conversation. Your next question may need a person's name, a number or a relationship mentioned much earlier. An attention head reads that history by comparing its current <em>query</em> with each stored <em>key</em>, then mixing the associated <em>values</em>. More history means more records to keep. This lesson changes what one record contains.</Prose>
<Prose>The <a href="/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals">GQA/MQA lesson</a> shared keys and values between query heads. <strong>Multi-head latent attention, or MLA, stores one learned internal description from which different heads can generate their own keys and values.</strong> We will first build that description, read it by hand and show why two execution routes give the same answer. Then we will add position, write a compact cache and inspect a complete trained model.</Prose>
<Prose opening="route">Follow the small three-record example through Sections 1–5. Section 6 turns the same mechanisms into a complete coordinate forecaster; Section 7 explains rank, derivatives, conversion and current research. The <a href="/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals">Transformer Block</a> and <a href="/learn/path/full-curriculum/positional-encodings-sinusoidal-learned-rope-alibi?module=deep-learning-fundamentals">Positional Encodings</a> lessons supply the surrounding network and rotary rotation. Each deeper step remains visible and starts from a concrete operation.</Prose>

<H2>1. What should a decoder remember?</H2>
<H3>Can different heads use the same compact description?</H3>
<Prose>Start with an invented record A containing three numbers, [1,0,2]. The learned map below writes two numbers; follow one row of its multiplication.</Prose>
<MlaOpeningDownDrawing/>
<Prose>The cyan row is the input. Each amber map row multiplies the three input coordinates and adds its products. The first row computes 1×1 + 0×0 + 0×2 = 1. The second computes 0×1 + 1×0 + 0×2 = 0. The violet result is [1,0]. We call this internal description <strong>c</strong>, a <strong>latent vector</strong>. A vector is simply an ordered group of coordinates; “latent” identifies a representation inside the model.</Prose>
<Prose>Nothing in these coordinates promises a human label such as “name” or “emotion.” Their values can be negative or greater than one; they are not probabilities. In this constructed example the map ignores the third input coordinate. That deliberately exposes the tradeoff: two inputs that differ only there produce the same c. A model trained with a bottleneck must learn which distinctions its later computations need.</Prose>
<MathBlock>{String.raw`c_A=W^{DKV}x_A=\begin{bmatrix}1&0&0\\0&1&0\end{bmatrix}\begin{bmatrix}1\\0\\2\end{bmatrix}=\begin{bmatrix}1\\0\end{bmatrix}.`}</MathBlock>
<Prose>Here W names a learned map, DKV identifies the down-projection used for keys and values, and the superscript is a name rather than an exponent. Equations use column vectors. Code will store many records as rows and apply the transposed map; we will make that bridge explicit before implementing it.</Prose>
<H3>Does sharing c force the heads to agree?</H3>
<Prose>It does not: each head can transform the same [1,0] using a different key map and a different value map.</Prose>
<MlaOpeningProjectionsDrawing/>
<Prose>Follow c_A down both branches of each picture. A <strong>key up-map</strong> writes the numbers a query will compare with. A <strong>value up-map</strong> writes the numbers a head will deliver after reading. For head 0 the key is [1,0] and the value is [1,0]. Head 1's key is [1,1] and its value is [2,1]. The shared item is the description c_A; the reconstructed items differ. “Up” names the role of mapping out of the common representation, not a promise that every example has a larger width.</Prose>
<MathBlock>{String.raw`k_h^C=U_{K,h}c,\qquad v_h=U_{V,h}c.`}</MathBlock>
<Prose>The subscript h selects a head; K and V name key and value maps. The C superscript marks the content-key branch. Later a separate positional branch will carry location. We intentionally start without it so the shared-description idea can be understood first.</Prose>
<Prose>GQA shares a key/value representation directly within each group. MLA shares the coordinates used to construct those representations. A <strong>causal</strong> model reads only current and earlier records. During generation, adding a future input therefore cannot change an earlier hidden state, so each layer can retain its old representations and append the new one. That persistent history is the <strong>KV cache</strong>; current queries are readers rather than an additional cached field.</Prose>
<H3>Which claim are we making?</H3>
<Prose>Three questions will guide the rest of the lesson. <strong>Representation:</strong> what information can this learned bottleneck carry? <strong>Exact execution:</strong> can we read one fixed MLA model without reconstructing every head's historical keys and values? <strong>Workload:</strong> when does that execution save useful memory traffic or time? An exact answer to the second question proves neither unchanged quality after removing coordinates nor a universal speedup.</Prose>
<Prose>The dense, separate-rotary design taught here comes from <a href="https://arxiv.org/html/2405.04434v5">DeepSeek-V2</a> and is retained in V3. A model-family name alone does not fix every later positional or sparse-kernel variant. We will state the stored fields, maps and scale each time a computation changes.</Prose>

<H2>2. Build the representations and keep their shapes visible</H2>
<H3>What does a head actually compare?</H3>
<Prose>Add records B=[0,1,−1] and C=[1,1,0.5]. The same down-map produces c_B=[0,1] and c_C=[1,1]. Keep the two heads' maps from Section 1, and give head 0 query [1,0] and head 1 query [1,1]. The next drawing shows head 0 multiplying each query coordinate by its matching key coordinate, then adding the products.</Prose>
<MlaContentReadDrawing/>
<Prose>The three source records stay in their own rows. Head 0's reconstructed keys are [1,0], [0,2] and [1,2]. Multiplying by q=[1,0] gives [1,0], [0,0] and [1,0], so the three content dot products are [1,0,1]. A dot product says how this particular query aligns with each key. It is a signed comparison, not yet a probability.</Prose>
<Prose>The keys and queries each contain two coordinates in this first <strong>content-only</strong> computation. Divide their dot products by √2, as in scaled attention, to obtain [0.707107,0,0.707107]. This invented intermediate operator omits position. When we add a two-coordinate positional branch in Section 3, the original dot-product width will become four and its scale will change explicitly.</Prose>
<MathBlock>{String.raw`\ell_s=\frac{q^Tk_s}{\sqrt{d_k}},\qquad d_k=2\text{ in this content-only example}.`}</MathBlock>
<H3>How do comparisons become amounts to read?</H3>
<Prose>Give every record a positive amount proportional to the exponential of its score, then divide all amounts by their total. Subtracting the same largest score first keeps these exponentials in a safe range without changing their ratios.</Prose>
<MlaNormalizationDrawing read={latentCaseRead(latentManualCase(),{positioned:false})}/>
<Prose>Read the stages vertically. Subtracting 0.707107 gives shifted scores [0,−0.707107,0]. Their exponentials are approximately [1,0.493069,1], with total 2.493069. Dividing by that common total gives weights [0.401112,0.197776,0.401112]. Each weight belongs to its source record, and the weights sum to one. This exponential-and-total operation is <strong>softmax</strong>.</Prose>
<MathBlock>{String.raw`a_s=\frac{\exp(\ell_s-M)}{\sum_j\exp(\ell_j-M)},\qquad M=\max_j\ell_j.`}</MathBlock>
<Prose>Subtracting M multiplies all numerator and denominator terms by the same exp(−M), which cancels. A common score offset therefore does not change the distribution. A scale change usually does: it changes the ratios between different scores. We have not introduced permission masks yet; all three records are allowed in this first read.</Prose>
<H3>Can we avoid reconstructing every content key?</H3>
<Prose>The dot product has a second exact route: transform the current query by the transposed key map once, then compare that effective query directly with every stored c.</Prose>
<MlaKeyAbsorptionDrawing/>
<Prose>The amber map is the same U_K as before, with rows and columns exchanged. Multiplying U_Kᵀ by q=[1,0] yields [1,0]. Comparing that effective query with c_A, c_B and c_C gives [1,0,1], exactly the three reconstructed-key dots. Head 1's effective query is [2,0], giving [2,0,2]. The two heads still make different comparisons.</Prose>
<MathBlock>{String.raw`q^T(U_Kc)=(U_K^Tq)^Tc,\qquad \widetilde q=U_K^Tq.`}</MathBlock>
<Prose>The tilde identifies the <strong>effective query</strong>, the transformed reader in latent coordinates. Expanding the left side gives ∑ᵢ∑ⱼqᵢ(U_K)ᵢⱼcⱼ. Gathering the terms for each j gives ∑ⱼ[∑ᵢ(U_K)ᵢⱼqᵢ]cⱼ, the right side. We changed the order of sums and products, not the information or the weights. In row-array code this becomes <code>effective_query = query @ key_up</code> when the map has output rows and input columns.</Prose>
<H3>What changes when a stored coordinate or query changes?</H3>
<Prose>The next two questions edit already-computed c and q. Such an edit is a local intervention; an edited c no longer has to equal the fixed opening down-map output. The maps and all other edits persist between questions.</Prose>
<MlaManualLab investigation="latent"/>
<Prose>Now hold those records fixed and change what one head asks for.</Prose>
<MlaManualLab investigation="query"/>
<Prose>Finally change one key-map coefficient. Its row says which reconstructed key coordinate is written; its column says which latent coordinate supplies it. All eight coefficients across the two heads remain accessible through this small editor.</Prose>
<MlaManualLab investigation="key"/>
<H3>Can we also avoid reconstructing every value?</H3>
<Prose>Yes, if the value map is linear and the same map applies to every source record in that head. Compare mixing the reconstructed values with mixing c first and applying U_V once.</Prose>
<MlaValueRoutesDrawing read={latentCaseRead(latentManualCase(),{positioned:false})}/>
<Prose>On the left each weight multiplies both coordinates of its reconstructed value; sum each output column. On the right the very same weights multiply the stored latents; their sum is a <strong>latent mixture</strong>. Applying the head's value map to that mixture gives the same written vector. Head 0 uses the identity map, so its mixture [0.802224,0.598888] is already its output.</Prose>
<MathBlock>{String.raw`o_h=\sum_sa_{s,h}(U_{V,h}c_s)=U_{V,h}\underbrace{\left(\sum_sa_{s,h}c_s\right)}_{z_h}.`}</MathBlock>
<Prose>To see why, expand one coordinate: ∑ₛaₛ∑ⱼUᵢⱼcₛⱼ = ∑ⱼUᵢⱼ∑ₛaₛcₛⱼ. The map's coefficient is independent of s, so it moves outside that sum. Every head has its own distribution and its own mixture z_h even though the stored c records are shared. A normalized mixture lies in the convex hull of the stored latent vectors; the mapped output lies in the mapped hull, not necessarily the original coordinate range.</Prose>
<Prose>The value-map editor changes what is delivered, after matching. Its coefficients do not enter the scores or weights.</Prose>
<MlaManualLab investigation="value"/>
<H3>How do the heads write back to the block?</H3>
<Prose>Place head 0's two outputs followed by head 1's two outputs in one four-coordinate row, then apply a separate output map W_O.</Prose>
<MlaOutputWriteDrawing/>
<Prose>At the unedited content-only defaults, head 0 writes [0.802224,0.598888] and head 1 writes approximately [1.783233,0.337425]. The first W_O row uses the first coordinate of head 0 plus half the first coordinate of head 1; the second uses their second coordinates in the same way. The final attention write is [1.693841,0.767600]. This writes to the surrounding network; it is not a complete model's task prediction.</Prose>
<MathBlock>{String.raw`y=W_O\operatorname{concat}(o_0,o_1)=\sum_hW_{O,h}U_{V,h}z_h.`}</MathBlock>
<Prose><InlineMath>{String.raw`W_{O,h}`}</InlineMath> means the columns of W_O belonging to head h. With fixed weights, <InlineMath>{String.raw`W_{O,h}U_{V,h}`}</InlineMath> could be precomputed. It can also remain two maps: a larger merged map may use more storage or arithmetic. During training a detached precomputed product must be refreshed when either learned factor changes; treating it as an unrelated parameter does not preserve the same optimization.</Prose>
<MlaManualLab investigation="output"/>
<H3>Which dimensions have we introduced?</H3>
<Prose>Our original record has D=3 input coordinates; each head has d_k=2 key/query coordinates and d_v=2 written value coordinates; the common description has d_c=2 coordinates; H=2 is the number of heads. The running cache currently contains L=3 records. T will count the new query rows when we implement batched reads. A map's shape follows its output width first and input width second.</Prose>
<NeuralTable caption="Shapes of the content-only objects just drawn" headers={['Object','General shape','This example']} rows={[
 ['Input down-map W_DKV','[d_c,D]','[2,3]'],['One head key map U_K','[d_k,d_c]','[2,2]'],['One head value map U_V','[d_v,d_c]','[2,2]'],['All stored c rows','[L,d_c]','[3,2]'],['Current query rows','[H,d_k]','[2,2]'],['Output map W_O','[D_out,Hd_v]','[2,4]']
]}/>
<Prose>For this hand calculation the written output width D_out=2 was chosen independently of D=3. A usual residual block writes back to its input width D; the complete trained block in Section 6 does so. A latent is compared with all heads' stored coordinates, not necessarily one head's width: a published V2-style d_c=512 is wider than one 128-coordinate content key yet much smaller than 128 heads' combined historical representation.</Prose>

<H2>3. Preserve position without rebuilding every key</H2>
<H3>Why not rotate every reconstructed key?</H3>
<Prose>Section 2 moved one fixed U_K into the query. A position-dependent operation can obstruct that move. Recall that RoPE turns coordinate pairs by their logical position. First isolate the order question with a new geometric example: x=[1,0], U stretches the first coordinate by two, and R turns a quarter circle.</Prose>
<MlaRotationOrderDrawing/>
<Prose>The first plane maps [1,0] to [2,0], then turns it to [0,2]. The second turns [1,0] to [0,1], then U leaves that second coordinate unchanged. Its final point is [0,1]. The endpoint labels connect directly to the arrows, including coincident points. Both planes use the same unit length in both directions; the difference is operation order.</Prose>
<MathBlock>{String.raw`U=\begin{bmatrix}2&0\\0&1\end{bmatrix},\quad R=\begin{bmatrix}0&-1\\1&0\end{bmatrix},\quad RU-UR=\begin{bmatrix}0&1\\1&0\end{bmatrix}.`}</MathBlock>
<Prose>RU−UR is the <strong>commutator</strong>, the matrix measuring whether these two operations can exchange order for every input. Zero angle or an isotropic scale U=αI gives a zero commutator. A special input can give equal outputs even when the matrix is nonzero, so test the operator separately from one fortunate vector.</Prose>
<MlaRotationLab investigation="input"/>
<Prose>Keep that input and angle while changing any of U's four entries. This extends the stretch example to a general learned map.</Prose>
<MlaRotationLab investigation="matrix"/>
<Prose>For a query at logical position t and a key at s, a normally rotated reconstructed key would produce the following score. R_t and R_s denote the turns at those positions, not two new learned maps.</Prose>
<MathBlock>{String.raw`(R_tq)^T(R_sU_Kc_s)=q^TR_t^TR_sU_Kc_s.`}</MathBlock>
<Prose>Moving everything beside c_s into an effective query now depends on which s is read. With q=[1,0] and our quarter-turn map, the unturned key needs effective query [2,0], while a quarter-turned key needs [0,−1]. There is no one such query valid for arbitrary key positions and arbitrary U_K. Rotating reconstructed keys remains valid attention; it just loses this particular fixed-map shortcut unless additional structure is supplied.</Prose>
<H3>Which part carries position instead?</H3>
<Prose>Return to the three content records and maps of Section 2. We now extend them with a <strong>separate positional pair</strong>: raw key pair [1,0] for each record, raw query pairs [1,0] and [0,1], key IDs 0,1,2, query ID 2, and pair frequency π/2 radians per ID. These are stipulated intermediate vectors for the hand example, not outputs of an unstated map acting on its original inputs.</Prose>
<MlaRotaryReadDrawing/>
<Prose>The left branch turns the raw query by query ID×frequency; the right turns each raw shared key by its own key ID×frequency. “Shared” means one positional key per source record, read by every head; it does not mean every record has the same turned pair. The pictured raw key [1,0] becomes [1,0], [0,1] and [−1,0] at IDs 0,1,2. Head 0's query becomes [−1,0], giving positional dots [−1,0,1].</Prose>
<Prose>Content and positional comparisons add before scaling. Each original query/key now has two content and two positional coordinates, so its intended scale is 1/√4 = 1/2. Head 0 adds [1,0,1] and [−1,0,1], yielding scaled scores [0,0,1]. Head 1's positional dots are [0,−1,0], yielding [1,−0.5,1]. This is explicitly a different operator from the content-only read.</Prose>
<MathBlock>{String.raw`q^R_{t,h}=R_t\bar q^R_{t,h},\quad k_s^R=R_s\bar k_s^R,\quad \ell_{t,s,h}=\frac{(q^C_{t,h})^TU_{K,h}c_s+(q^R_{t,h})^Tk_s^R}{\sqrt{d_k+d_r}}.`}</MathBlock>
<Prose>A bar denotes a raw, unturned pair; R applies the position turn. The new width d_r counts positional coordinates and is even because rotation acts on pairs. The positional key can depend on the source input through its own learned map in a full model. Crucially, it bypasses the content-key up-map: only the content U_K moves into the effective query. The separate rotated key pair is retained alongside c.</Prose>
<MlaRotaryLab investigation="raw"/>
<H3>What makes a record legal?</H3>
<Prose>A causal read may use a key whose logical ID is no later than the query ID. This permission comes from IDs, not the order in which rows happen to sit in storage. Set the key and query IDs below while retaining the raw vectors and all earlier content edits.</Prose>
<MlaRotaryLab investigation="permission"/>
<Prose>A forbidden score contributes no exponential amount and no weight. Subtract the maximum over the <em>allowed</em> scores only. If every key is forbidden, there is no mass to divide by: the normalized read is undefined. The lab identifies that state and retains your inputs so changing an ID recovers immediately.</Prose>
<MathBlock>{String.raw`a_{t,s,h}=\begin{cases}\exp(\ell_{t,s,h}-M)/\sum_{j:\,j\le t}\exp(\ell_{t,j,h}-M),&s\le t,\\0,&s>t,\end{cases}\quad M=\max_{j:\,j\le t}\ell_{t,j,h}.`}</MathBlock>
<Prose>Here s and j denote logical positions. An implementation whose records carry a separate validity flag must also exclude invalid keys. A library's chosen zero output for an empty row does not manufacture a normalized distribution with weights summing to one.</Prose>
<H3>How does changing the turn rate affect the read?</H3>
<Prose>The frequency sets how far a coordinate pair turns for one ID step. Changing it retains the content vectors and logical permissions, but changes the positional dots.</Prose>
<MlaRotaryLab investigation="frequency"/>
<Prose>Append or remove complete records next. An appended record starts with c=[0,0], raw positional pair [1,0] and the next bounded ID. You can then edit each of its fields in the preceding questions. The query may initially forbid it; being present in storage is different from being allowed to contribute.</Prose>
<MlaHistoryLab/>
<H3>Can we finish the extended example by hand?</H3>
<Prose>Use the unedited three-record defaults to finish the positioned read; live edits remain your separate investigation.</Prose>
<MlaOutputWriteDrawing read={latentCaseRead(latentManualCase())}/>
<Prose>Head 0's [0,0,1] scores have exponential proportions [1,1,e], so its weights are [0.211942,0.211942,0.576117]. Its weighted latent and identity-mapped output are [0.788058,0.788058]. Head 1's [1,−0.5,1] scores give weights [0.449816,0.100368,0.449816], latent mixture [0.899632,0.550184] and value output [1.799265,0.349449].</Prose>
<Prose>The same W_O from Section 2 combines those head outputs into [1.687691,0.962783]. The output changes when positional matching changes; the expanded and absorbed implementations of this <em>same positioned operator</em> still agree. The drawing lists the actual coordinate products rather than treating “combine heads” as an unexplained arrow.</Prose>

<H2>4. Keep the rearrangement valid in a real model</H2>
<H3>What happens before a practical model stores c?</H3>
<Prose>We have read supplied c vectors exactly. A practical model often normalizes the output of its down-map before storing it. To see this step without silently changing our hand-example outputs, switch to a separate two-coordinate raw vector z=[3,4] with learned gain [1,2].</Prose>
<MlaRmsDrawing/>
<Prose>Square the raw coordinates to obtain [9,16]; their mean is 12.5. Add ε=10⁻⁶, take the square root, and divide both original coordinates by that same approximately 3.535534 divisor. This gives [0.848528,1.131371]. The learned gain then writes c=[0.848528,2.262742]. The gain can treat coordinates differently; the root statistic is shared.</Prose>
<MathBlock>{String.raw`z=W^{DKV}h,\qquad c=\gamma\odot\frac{z}{\sqrt{d_c^{-1}\sum_a z_a^2+\epsilon}}.`}</MathBlock>
<Prose>The symbol ⊙ means coordinate-by-coordinate multiplication. This is <strong>RMSNorm</strong>: it does not subtract a mean. Epsilon keeps the divisor defined at an all-zero raw vector; a nearly zero vector's scale depends on that chosen epsilon. Replacing this step with LayerNorm or moving it outside a later weighted sum changes the model. In all subsequent attention equations c denotes the already-computed normalized latent when this normalization is present. The hand example remains a supplied-c fixture.</Prose>
<H3>Where does a practical query come from?</H3>
<Prose>A current input can produce its query directly, or pass through a separate query down-map, RMSNorm and per-head up-maps. The query latent is not the persistent KV cache.</Prose>
<MlaQueryProjectionDrawing/>
<Prose>This is another explicitly separate practical projection example, with input [1,0,2] and the maps drawn in full. The query down-map writes [1,2]. Its RMS divisor is approximately 1.581139; unit gains give [0.632455,1.264911]. The identity content up-map keeps those coordinates; the positional up-map exchanges them. The direct shared-key map instead writes [1,0] from its own input branch. It never passes through the query or KV latent normalization. The raw positional outputs are turned by their respective IDs as taught in Section 3.</Prose>
<MathBlock>{String.raw`c_t^Q=\operatorname{RMSNorm}(W^{DQ}h_t),\qquad q^C_{t,h}=U_{Q,h}c_t^Q,\qquad \bar q^R_{t,h}=U_{QR,h}c_t^Q.`}</MathBlock>
<Prose>The new width d_q counts query-latent coordinates; DQ names its down-map. The practical <a href="https://huggingface.co/deepseek-ai/DeepSeek-V2/raw/main/config.json">V2 configuration</a> uses d_q=1536 and d_c=512, a three-to-one choice rather than a required ratio. A direct-query variant changes this factorization. During training, which expanded tensors autograd stores or recomputes still determines activation memory; splitting a map into two factors does not make every large intermediate disappear. We will draw both full normalized paths and the shared-key bypass in the actual model in Section 6.</Prose>
<H3>Why must the score retain its original scale?</H3>
<Prose>Section 2's effective query changed coordinate width but not its dot product. Adding position likewise leaves the original content-plus-positional width d_k+d_r as the scale's meaning.</Prose>
<MathBlock>{String.raw`\ell=\frac{\widetilde q^Tc+(q^R)^Tk^R}{\sqrt{d_k+d_r}},\qquad\text{not generally }\frac{\widetilde q^Tc+(q^R)^Tk^R}{\sqrt{d_c+d_r}}.`}</MathBlock>
<Prose>A generic attention API sees the new d_c+d_r coordinates and may choose that width by default. When d_c differs from d_k, this produces valid shapes but a different score concentration. The actual model later has d_k=4, d_c=8 and d_r=2: its intended divisor is √6, while that accidental default is √10. A rank-four cache happens to make the widths equal, so testing only that case would hide the bug.</Prose>
<H3>Can c's coordinates change without losing information?</H3>
<Prose>Yes: apply an invertible matrix S to the already-normalized c, and compensate both up-maps with its inverse. The next drawing begins with the [2,0.5] diagonal basis change.</Prose>
<MlaBasisDrawing/>
<Prose>The changed c′=Sc has different numbers. The changed up-map U′=US⁻¹ removes exactly that coordinate change before writing its key or value. Thus U′c′=Uc. This is why one latent coordinate need not have a unique semantic name. The compensation occurs <em>after</em> the original normalization; it does not claim that S commutes through RMSNorm.</Prose>
<MathBlock>{String.raw`c'=Sc,\quad U'=US^{-1},\quad U'c'=US^{-1}Sc=Uc.`}</MathBlock>
<Prose>An inverse exists exactly when the determinant is nonzero. For S=[[a,b],[c,d]], the determinant is ad−bc. A small determinant alone is not a universal instability test: a uniformly tiny but well-conditioned scale can still be invertible. The investigation scales the matrix before testing its determinant, reports its infinity-norm condition estimate, and identifies inverses unresolved at floating precision rather than silently substituting another basis.</Prose>
<MlaBasisLab investigation="apply"/>
<Prose>Change any of S's four coefficients next. Earlier c, query and key/value-map edits persist; a singular choice has no inverse, so the compensated read is explicitly unavailable until you repair it.</Prose>
<MlaBasisLab investigation="entries"/>
<Prose>A noninvertible projection is a different operation: discarded coordinates cannot be recovered for every c. Section 6 measures that loss in a fitted model, and Section 7 explains which approximation objective the selected directions optimize.</Prose>
<H3>Which operations cannot move past the mixture?</H3>
<Prose>The value-map equality in Section 2 used linearity. Isolate a new scalar example with values −1 and 1, each receiving weight one-half, to compare the two placements of ReLU.</Prose>
<MlaScalarNonlinearDrawing/>
<Prose>ReLU clips negatives to zero. The first route clips each value to [0,1] before multiplying by the weights, so its sum is 0.5. The second multiplies the original values to [−0.5,0.5] and sums to 0; clipping that sum leaves 0. The operation order changed the function.</Prose>
<MathBlock>{String.raw`\tfrac12\operatorname{ReLU}(-1)+\tfrac12\operatorname{ReLU}(1)=0.5\ne\operatorname{ReLU}\!\left(\tfrac12(-1)+\tfrac12(1)\right)=0.`}</MathBlock>
<Prose>Return to your arbitrary edited hand case below to compare those same two placements with its current maps and weights. A null for a particular input does not prove general interchangeability.</Prose>
<MlaNonlinearLab/>
<Prose>An affine map Uc+b can move with its bias accounted for: normalized weights contribute b once because they sum to one. Attention dropout or another unnormalized mixture instead contributes b∑ₛaₛ. Position-dependent maps, data-dependent routing and quantization need their own contracts; naming an operation an “up-projection” does not make it linear.</Prose>
<H2>{"5. Implement it, then count the right things"}</H2>

<H3>{"A transparent executable reference"}</H3>

<Prose>This complete NumPy program restores the unedited positioned three-record hand example from Section 3. K/V are reconstructed only in the expanded branch. The rotary vectors are already rotated, making the matrix reassociation visible without hiding it inside a larger model.</Prose>

<CodeBlock language={"python"}>{"import numpy as np\n\n\ndef mla_read(query, latent, key_up, value_up, query_rope, key_rope,\n             scale, expanded=False):\n    # query [H,dk], latent [L,dc], up-maps [H,output_width,dc].\n    if expanded:\n        keys = np.einsum(\"lc,hpc->hlp\", latent, key_up)\n        values = np.einsum(\"lc,hvc->hlv\", latent, value_up)\n        content = np.einsum(\"hp,hlp->hl\", query, keys)\n    else:\n        effective_query = np.einsum(\"hp,hpc->hc\", query, key_up)\n        content = effective_query @ latent.T\n    logits = (content + query_rope @ key_rope.T) * scale\n    # All three keys are legal for this final-position hand example.\n    weights = np.exp(logits - logits.max(axis=-1, keepdims=True))\n    weights /= weights.sum(axis=-1, keepdims=True)\n    if expanded:\n        output = np.einsum(\"hl,hlv->hv\", weights, values)\n    else:\n        mixed_latent = weights @ latent\n        output = np.einsum(\"hc,hvc->hv\", mixed_latent, value_up)\n    return output, weights\n\n\nq = np.array([[1., 0.], [1., 1.]])\nc = np.array([[1., 0.], [0., 1.], [1., 1.]])\nuk = np.array([[[1., 0.], [0., 2.]], [[1., 1.], [1., -1.]]])\nuv = np.array([np.eye(2), [[2., 0.], [1., -1.]]])\nqr = np.array([[-1., 0.], [0., -1.]])\nkr = np.array([[1., 0.], [0., 1.], [-1., 0.]])\nwo = np.array([[1., 0., .5, 0.], [0., 1., 0., .5]])\nexpanded, first_weights = mla_read(q, c, uk, uv, qr, kr, .5, True)\nabsorbed, second_weights = mla_read(q, c, uk, uv, qr, kr, .5, False)\nprint(\"head outputs:\", np.round(absorbed, 6))\nprint(\"final output:\", np.round(wo @ absorbed.reshape(-1), 6))\nprint(\"same output:\", np.allclose(expanded, absorbed, atol=1e-12))\nprint(\"same weights:\", np.allclose(first_weights, second_weights, atol=1e-12))"}</CodeBlock>

<Prose>{"It produces the two head outputs and final output calculated above, and both checks print "}<code>{"True"}</code>{". The "}<a href={"/learn-assets/multi-head-latent-attention-mla/mechanism-calculations.py"}>{"complete independent fixture program"}</a>{" additionally supplies editable latent/map inputs, rotations, a consistent basis change, broken-position and nonlinear-map contrasts, and exact byte/work counts. The full neural program in §6 adds normalized learned projections, actual causal masks, incremental cache state and task predictions."}</Prose>

<MlaProgram file="mechanism-calculations.py"/>

<H3>{"What exactly is in the compact cache?"}</H3>

<Prose>{"For B requests, L_layers uniform layers, L occupied positions and s bytes per stored number, the unquantized compact payload is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\boxed{\\operatorname{bytes}=B L_{\\mathrm{layers}} L(d_c+d_r)s.}"}</MathBlock></div>

<Prose>{"There is one c and one shared rotated key per position/layer. Do not multiply c by H or count it twice because it participates in both the key and value calculations. Queries, score tiles, weighted latents and output vectors are transient work, not additional copies of the persistent history."}</Prose>

<Prose>{"At fixed "}<InlineMath>{"d_c,d_r"}</InlineMath>{", increasing H leaves this formula unchanged. It still increases the number of comparisons and head outputs, as well as relevant parameters and transient tensors. This is a storage property, not free additional heads."}</Prose>

<Prose>{"Different baselines require different denominators. The following are "}<strong>{"calculated representations"}</strong>{", all using H=128, content width 128, value width 128, rotary width 64 and latent width 512 where applicable:"}</Prose>

<NeuralTable caption={"What exactly is in the compact cache?"} headers={[<>{"Representation"}</>,<>{"Stored numbers per token/layer"}</>,<>{"Meaning"}</>]} rows={[[<>{"Plain MHA, 128-wide keys and values"}</>,<>{"32,768"}</>,<>{"RoPE can rotate within its existing key width; this is a different parameterization"}</>],[<>{"GQA with 8 such KV heads"}</>,<>{"2,048"}</>,<>{"Shared heads with those stated widths"}</>],[<>{"MQA with one such KV head"}</>,<>{"256"}</>,<>{"Smallest payload in this particular table"}</>],[<>{"Same MLA function, literal expanded K/V cache"}</>,<>{"40,960"}</>,<>{"128 heads each store a 192-wide key and 128-wide value"}</>],[<>{"Same MLA function, expanded content plus one shared rotary key"}</>,<>{"32,832"}</>,<>{"Avoids duplicating the 64-wide rotary key across heads"}</>],[<>{"Compact MLA"}</>,<>{"576"}</>,<>{"One 512-wide latent plus one 64-wide rotary key"}</>]]} />

<Prose>{"The compact payload is about 56.89 times smaller than the first plain-MHA count and 71.11 times smaller than the literal expanded representation of the "}<strong>{"same MLA function"}</strong>{". These answer different comparisons. It is 2.25 times the MQA payload in this table, not smaller than every alternative. A memory table alone contains no quality ranking."}</Prose>

<Prose>{"For 60 layers, 32,768 positions, one request and two-byte numbers, compact MLA needs 2,264,924,160 bytes, or 2.109375 GiB. The plain-MHA row needs 120 GiB; GQA-8 needs 7.5 GiB. A GiB is "}<InlineMath>{"2^{30}"}</InlineMath>{" bytes. These are payload calculations, not measured allocator memory or statements that a whole model fits on a device."}</Prose>

<Prose>{"The V2 report's headline 93.3% cache reduction compares "}<strong>{"different complete models"}</strong>{", DeepSeek-V2 and the earlier DeepSeek 67B. It is not the rounded value of our 56.89-fold, same-head-width calculation. Keep the stated comparison attached to any percentage. "}<a href={"https://arxiv.org/html/2405.04434v5"}>{"Original report"}</a>{"."}</Prose>

<Prose>{"Actual allocation may include page rounding, reserved slots, position metadata, quantization scales, distributed replicas and cache layouts that materialize expanded heads. The "}<a href={"https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py"}>{"official V3 reference"}</a>{" visibly allocates different buffers for its "}<code>{"naive"}</code>{" and absorbed branches. An architecture supports a compact representation; an implementation must actually store it to realize that payload."}</Prose>

<Prose>Which part of a record changes its footprint? Start with d_c, d_r and the bytes per coordinate. These are the fields already taught, not a model-quality selector.</Prose><MlaBudgetLab investigation="record"/>
<Prose>How does one record become a whole history? B counts requests, L_layers counts layers, and L counts occupied records. Change those three multipliers below. All cost questions share this same dimension case.</Prose><MlaBudgetLab investigation="history"/>
<Prose>What happens when more heads read the same record? Change H and each head's content/value widths. The latent payload is still shared; head work and the alternative MHA payload change.</Prose><MlaBudgetLab investigation="heads"/>
<Prose>GQA stores G distinct key/value heads, so choose a G that divides H. This changes the comparison, not MLA's latent record.</Prose><MlaBudgetLab investigation="groups"/>

<H3>{"Why less data movement can involve more arithmetic"}</H3>

<Prose>{"At fixed H, T, L and widths, the expanded attention core uses approximately"}</Prose>

<div className="neural-equation"><MathBlock>{"2BHTL(d_k+d_r+d_v)"}</MathBlock></div>

<Prose>{"operations for scores and weighted values, counting a multiply-add as two. The absorbed core uses approximately"}</Prose>

<div className="neural-equation"><MathBlock>{"2BHTL(2d_c+d_r)."}</MathBlock></div>

<Prose>{"It compares with a "}<InlineMath>{"d_c"}</InlineMath>{"-wide latent and also sums a "}<InlineMath>{"d_c"}</InlineMath>{"-wide latent. When "}<InlineMath>{"d_c"}</InlineMath>{" is larger than "}<InlineMath>{"d_k"}</InlineMath>{" and "}<InlineMath>{"d_v"}</InlineMath>{", these core arithmetic terms increase. For the widths in the table, the ratio is "}<InlineMath>{"1088/320=3.4"}</InlineMath>{"."}</Prose>

<Prose>{"For one query and 32,768 memory positions, our formula gives about 2.684 billion expanded-core operations versus 9.127 billion absorbed-core operations. The absorbed representation can nevertheless reduce persistent storage and repeated memory traffic by sharing the latent across heads. Effective hardware reuse, tiling, bandwidth and occupancy determine how these facts translate into time."}</Prose>

<Prose>{"There is another comparison: rebuilding "}<strong>{"all"}</strong>{" historical expanded K/V from a compact cache for every new query costs roughly"}</Prose>

<div className="neural-equation"><MathBlock>{"2BLH d_c(d_k+d_v)"}</MathBlock></div>

<Prose>{"additional operations. Absorption avoids that repeated reconstruction. Instead, it transforms each new query and the resulting weighted latent once per head. In our numerical configuration, full-prefix reconstruction is about "}<InlineMath>{"1.10\\times10^{12}"}</InlineMath>{" operations; each of those two per-query transformations is about 16.78 million. Avoiding reconstruction is useful, but it is not evidence that absorbed dense attention has 57 times fewer operations than an already-expanded-cache attention core."}</Prose>

<Prose>{"Prefill has many known query rows; decode often has one new row per request. A compute-friendly expanded path can be attractive during prefill, with bounded temporary reconstruction, while a compact path can suit decode. "}<a href={"https://docs.vllm.ai/en/v0.20.0/api/vllm/model_executor/layers/attention/mla_attention/"}>{"vLLM's MLA implementation notes"}</a>{" explain both forms and chunked prefill. Use the actual dimensions: "}<InlineMath>{"T/L"}</InlineMath>{" is near 1 for an uncached full prefill and small for one-query decode. For an uncached full prefill, many query rows read the same known sequence; single-step decode has one new query row per request."}</Prose>

<H3>{"Parameter counts are also dimension-dependent"}</H3>

<Prose>{"Ignoring biases and normalization parameters, the factorized design described here has"}</Prose>

<div className="neural-equation"><MathBlock>{"D(d_c+d_q+d_r)\n+Hd_c(d_k+d_v)\n+Hd_q(d_k+d_r)\n+DHd_v"}</MathBlock></div>

<Prose>{"projection parameters. The four terms account for input/down maps, KV up maps, query up maps and the output map. A direct-query design changes the query terms. Learned latent normalization adds its scales."}</Prose>

<Prose>{"There is no universal “only a few percent more than MHA” answer. In particular, the convenient MHA expression "}<InlineMath>{"4D^2"}</InlineMath>{" assumes the usual total head widths equal D. A configuration with "}<InlineMath>{"Hd_k\\ne D"}</InlineMath>{" does not satisfy that assumption. Count the actual maps before comparing architectures or optimizer-state memory."}</Prose>

<Prose>Now vary T, the number of new query rows, holding the cache dimensions fixed. More queries increase work without adding duplicate history in this calculation. Restore the stated dimensions after trying a coupled case.</Prose><MlaBudgetLab investigation="queries"/>
<Prose>The following complete tables summarize the one current dimension case; changing an earlier field updates every row here.</Prose><MlaBudgetResults/>
<H3>{"Use the absorbed representation with an ordinary attention primitive"}</H3>
<Prose>How can a library compute the same two score terms? This schematic uses the unedited positioned three-record fixture: its Q/K arguments join the effective content vector and the already-turned positional pair; its V argument reads the same stored c.</Prose><MlaSdpaDrawing/>

<Prose>{"The "}<a href={"/learn-assets/multi-head-latent-attention-mla/mla_sdpa_bridge.py"}>{"complete SDPA bridge"}</a>{" supplies a practical tensor API route. Concatenate the absorbed query "}<code>{"q_content @ U_K"}</code>{" and positioned rotary query; concatenate each cached latent and positioned shared rotary key. Use the cached latent as the value. SDPA then returns a latent mixture, which each head's value-up map turns into its output."}</Prose>

<Prose>{"Pass "}<code>{"scale=1/sqrt(P+R)"}</code>{" explicitly. SDPA's default would use the concatenated width C+R, changing the function whenever C differs from P. "}<code>{"enable_gqa=True"}</code>{" makes all query heads read the one-head shared memory. The boolean mask means allowed and uses the logical positions; dropout is zero. The complete program compares direct/API output, all six input/factor gradients and one equal update. Run "}<code>{"python mla_sdpa_bridge.py"}</code>{" with PyTorch. A CPU execution on Torch 2.14.0 gave output discrepancy 4.44e-16 and largest gradient discrepancy 3.33e-16."}</Prose>

<MlaProgram file="mla_sdpa_bridge.py"/>

<Prose>{"This uses the "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html"}>{"PyTorch SDPA contract"}</a>{"; it is not a specialized DeepSeek kernel. Device/backend support and physical allocation for grouped queries with unequal value width need separate measurement. The original tensor path remains a useful fallback. The whole model also has projections, latent normalization, residuals, positions and cache identity; those remain explicit in "}<code>{"LatentForecaster"}</code>{", rather than being inferred from operator agreement."}</Prose>

<Prose>{""}<strong>{"Change the constraint:"}</strong>{" use latent width 7 with P=3 and R=2. Change the latent and both up-projection shapes together. "}<strong>{"Hint:"}</strong>{" absorption changes representation width, not the intended temperature. "}<strong>{"Solution:"}</strong>{" preserve "}<code>{"1/sqrt(5)"}</code>{" in both routes; the equality checks should still pass. Deliberately using "}<code>{"1/sqrt(9)"}</code>{" in only one route creates a shape-valid semantic mismatch."}</Prose>


<H3>How does a real cache append a record safely?</H3>
<Prose>The NumPy read above recomputes from supplied arrays. A reusable cache must also manage which slots are occupied and which logical positions those slots represent.</Prose>
<MlaCompactRecordDrawing/>
<Prose>Each occupied slot contains c, its already-turned positional key, a logical ID and a validity flag. The two numeric fields are the MLA payload; the ID and validity flag are separate metadata. Reserved capacity is allocation, not occupied history. A slot's physical array index need not equal its logical ID. Queries are computed for the current input and are never stored as history.</Prose>
<Prose>Appending should be one atomic change: validate every request row, field shape, finite number, ID, validity flag and capacity first; only then copy the new fields and advance the occupied count. Otherwise an invalid row late in the batch could leave earlier requests partially changed. A causal read keeps only valid records whose logical ID is no greater than the query's ID. With no legal records there is no normalized read; the program rejects that case rather than asking an API to choose a policy for it.</Prose>
<Prose>The complete program below implements that preallocated cache with NumPy, a direct expanded reference, and ordinary PyTorch SDPA. Its matrix products use broadcast batch axes, so it never builds all historical per-head K/V during the compact read. C and the positional field remain one shared memory group; SDPA's output is the latent mixture. The per-head value map and W_O then complete the write.</Prose>
<MlaProgram file="latent-attention-cache.py" newCache/>
<Prose>Read <code>CompactMLACache.__init__</code> for fixed maps and buffer allocation, <code>append</code> for all-before-mutation validation, and <code>read</code> for effective queries, the two score terms, legal support, stable softmax and value expansion. <code>numpy_reference</code> reconstructs keys/values explicitly. The independent tensor route retains all seven differentiable factors; the inference cache itself copies fixed maps and does not retain autograd history.</Prose>
<Prose>Save the file as <code>latent-attention-cache.py</code> and run <code>python latent-attention-cache.py</code> with NumPy and PyTorch installed. The fixed seed-73 example has two requests, three heads, four stored records, a five-coordinate latent and a two-coordinate positional pair. Its two appended chunks occupy 448 bytes of numeric payload in an 896-byte allocation. This intentionally uses d_c=5 and d_k=3 so the accidental API scale cannot hide behind equal widths.</Prose>
<Prose>In Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, expanded/compact output discrepancy was 1.83186799×10⁻¹⁵; native output and the largest of the seven factor-gradient discrepancies were 1.77635684×10⁻¹⁵. Seven invalid appends left both occupied state and every allocated byte unchanged. Whole-query and single-row all-masked reads were rejected, and reset cleared occupied metadata. These are correctness checks, not speed measurements.</Prose>
<Prose>Reuse requires the same model/maps, basis, normalization, prefix and positional rule, or a proved transformation of those fields. The constructor copies its fixed maps to protect the stored interpretation. Read-only occupied views still refer to the allocation: copy a snapshot if it must survive reset or slot reuse. A reset marks old numeric cells unoccupied; it does not need to erase their values before a later validated append overwrites them.</Prose>
<H2>6. A real model: exact execution and a lossy intervention</H2><MlaModelProvider>

<H3>What can a compact memory learn about motion?</H3>
<Prose>We now switch from invented vectors to a real task: given an observed hand movement, predict the next two-coordinate point. The source curve below is available before the saved model loads; the withheld next point is a reference, never an input.</Prose><MlaMovementLab investigation="length"/>
<Prose>The cyan line connects observed points in their sequence. White identifies the selected observation; a violet circle marks the current forecast and a dashed neutral circle the original full model on those same observations. The labelled cross is the actual next point. Both axes use equal units so the drawing preserves the movement's shape. Prefix length changes how much history the model can read.</Prose>

<Prose>{"The task is causal coordinate forecasting using "}<a href={"https://archive.ics.uci.edu/dataset/181/libras%2Bmovement"}>{"UCI Libras Movement"}</a>{", an openly licensed set of normalized hand-centroid trajectories. Each row contains 45 ordered x/y pairs. At positions 0–43, predict the next coordinate pair at positions 1–44, without reading future points."}</Prose>

<Prose>{"The source has 360 rows, including 30 extra copies of exact trajectories. After checking duplicate labels agree, retain the first occurrence of each distinct trajectory. Reuse the declared seed-73 classwise row split: 220 training, 50 validation and 60 test trajectories. Keep entire trajectories together. Labels determine stratification only; they are not forecast inputs or targets."}</Prose>

<Prose>{"Use fixed "}<InlineMath>{"2x-1"}</InlineMath>{" scaling and convert RMSE back to the original coordinate unit. The source does not provide reliable per-row performer/session IDs, so this is a row-level diagnostic, not a test on a new signer. Its coordinates have already been processed by the dataset creators; the study does not validate an online camera pipeline. "}<a href={"/learn-assets/multi-head-latent-attention-mla/data-provenance.md"}>{"Full source/protocol provenance"}</a>{" accompanies the original offline files."}</Prose>

<Prose>{"Persistence predicts the latest point unchanged. A six-parameter affine map predicts the next two coordinates from the current two, fitted only on training transitions. Smooth trajectories make these meaningful baselines."}</Prose>

<H3>Where do those two input coordinates enter the network?</H3>
<Prose>The fixed input scaling sends [x,y] to [2x−1,2y−1]. A learned stem then writes a 24-coordinate workspace. Follow an actual current selected frame, not the opening hand-example maps.</Prose><MlaModelMap stage="stem"/>
<Prose>The cyan input row multiplies the amber stem map. Each displayed product contributes to a complete input-row sum, then the learned bias is added. The drawing explicitly marks omitted output rows; the row inspector below can expose every coefficient. These 24 coordinates are also saved for the first residual bypass.</Prose>
<Prose>Before attention, LayerNorm centers the complete 24-coordinate row and divides by its standard deviation with epsilon. Learned gains and offsets finish the result.</Prose><MlaModelNormalization stage="attention"/>
<Prose>Only four coordinates are displayed, but the mean and variance use all 24. This is the LayerNorm taught in <a href="/learn/path/full-curriculum/batch-layer-instance-group-normalization?module=deep-learning-fundamentals">Normalization</a>; it is distinct from the latent RMSNorm, which does not center. The normalized workspace now splits into the three attention branches.</Prose><MlaNetworkPaths/>
<Prose>Follow the content down-map to eight raw coordinates and RMSNorm, the query down-map to twelve raw coordinates and its own RMSNorm, and the direct two-coordinate shared positional-key map. The last branch bypasses both latent norms. The query's two up-maps write four content coordinates and a positional pair for each of four heads. The cache stores one content description and one turned positional pair per observed frame. The whole diagram and the individual maps below use your current edited case.</Prose>
<Prose>For the content branch, inspect the full input ownership before its eight-coordinate normalization.</Prose><MlaModelMap stage="content"/><MlaModelNormalization stage="content"/>
<Prose>The mean square includes all eight raw coordinates; the learned eight gains are applied before any cache-basis projection. A rank intervention later retains selected directions of this already-normalized vector.</Prose>
<Prose>For the current query, the separate twelve-coordinate branch has its own map and gains.</Prose><MlaModelMap stage="query"/><MlaModelNormalization stage="query"/>
<Prose>Its normalized row produces the content queries and raw positional queries. Each head's pair is turned by the current logical ID. The shared raw positional key instead comes directly from the normalized 24-coordinate workspace.</Prose><MlaModelMap stage="queryContent"/><MlaModelMap stage="queryRotary"/><MlaModelMap stage="rotaryKey"/>
<H3>The complete small architecture and declared training</H3>

<Prose>{"Our model has a 2-to-24 stem and one pre-normalized Transformer block. There are four heads with content width 4, rotary width 2 and value width 4. The KV latent has eight coordinates; the query latent has twelve. Both use RMSNorm with epsilon "}<InlineMath>{"10^{-6}"}</InlineMath>{" and learned scales. Residual/final LayerNorm uses epsilon "}<InlineMath>{"10^{-5}"}</InlineMath>{". The FFN has width 48 with GELU; the final prediction has two unconstrained coordinates."}</Prose>

<Prose>{"Attention maps have no biases. Stem, FFN and forecast maps have biases. Ordinary adjacent-pair RoPE uses base 10000, with the correct logical positions; there is no YaRN or dropout. This is a small dense model designed to expose MLA's mechanism, not a reproduction of DeepSeek's expert network."}</Prose>

<Prose>{"Train once with seed 131 for 200 full-batch Adam updates at learning rate 0.003, no weight decay. Choose the lowest validation MSE, taking the earliest exact tie. The selected checkpoint is update 200, the budget boundary. That is the recorded selection, not a claim that optimization has converged. The model has 4,118 trainable parameters."}</Prose>

<H3>How does the current read become a next-point forecast?</H3>
<Prose>Choose a head and a stored record in the actual current case. The last observed frame supplies the query. The selected record supplies c and the turned shared key. The drawing traces their coordinate products into the score, then shows how its weight participates in the full-history latent mixture.</Prose><MlaHeadInspection/>
<Prose>Every displayed selected-record score is normalized against all legal records, not just the chosen one. The contribution cutaway names omitted records and still uses their complete sum. The key up-map is transposed onto the content query; the value up-map writes four coordinates from that head's mixture. The complete weight table lets you inspect every record rather than interpreting one weight in isolation.</Prose>
<Prose>Four head writes concatenate into sixteen coordinates. The learned 24×16 output map writes the attention branch, which is added to the saved stem row.</Prose><MlaModelMap stage="output"/><MlaModelResidual/>
<Prose>The first residual gives the original per-frame information a direct route around the attention update. The next LayerNorm prepares that row for the feedforward network.</Prose><MlaModelNormalization stage="feedforward"/>
<Prose>The FFN expands 24 coordinates to 48, adds its bias, applies GELU separately, then maps back to 24 and adds another bias.</Prose><MlaModelMap stage="expand"/><MlaModelNonlinear/>
<Prose>GELU is the smooth nonlinear activation taught in <a href="/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals">Neurons and Activation Functions</a>. Its placement matters: it stays between the two FFN maps and cannot be absorbed into one linear map. The contraction writes the second residual branch.</Prose><MlaModelMap stage="contract"/><MlaModelResidual second/>
<Prose>Final LayerNorm and a biased two-output task map finish the model. Convert each scaled result u back with (u+1)/2; there is no clipping that would hide an out-of-range forecast.</Prose><MlaModelNormalization stage="final"/><MlaModelMap stage="task"/><MlaTaskBacktransform/>
<Prose>For any map cutaway above, choose its name and an output row to see every actual learned coefficient. This is inspection, not a fitted-weight editor; changing observations still changes all of these intermediate computations.</Prose><MlaModelRowInspector/>
<H3>Check the same function before changing its information</H3>

<Prose>{"Use the "}<strong>{"same weights and inputs"}</strong>{" for reconstructed and absorbed paths. In a float64 check on a small real prefix, their complete model outputs differ by at most "}<InlineMath>{"3.89\\times10^{-16}"}</InlineMath>{". Backpropagating the same squared-output objective through both paths gives corresponding gradients for "}<strong>{"every parameter"}</strong>{", with maximum difference "}<InlineMath>{"7.11\\times10^{-15}"}</InlineMath>{"."}</Prose>

<Prose>{"This directly contradicts the idea that absorbed attention must have unstable gradients because its normalization statistics somehow change. Both paths normalize the same vector and define the same differentiable function. Floating-point order and a kernel's implementation can affect numerical behavior; they do not change the algebraic identity. An exported, detached product must of course be refreshed if its underlying trainable weights change."}</Prose>

<Prose>{"For the 32-point visible prefix, ordinary float32 expanded/absorbed forecasts agree within "}<InlineMath>{"1.79\\times10^{-7}"}</InlineMath>{" in transformed coordinates. Processing the same prefix one point at a time with the compact cache agrees with the full causal pass within "}<InlineMath>{"3.58\\times10^{-7}"}</InlineMath>{". This checks projection, rotary positions, masks, residual computation and forecasts—not just concatenating already computed arrays."}</Prose>

<H3>What changes if the cache loses useful directions?</H3>
<Prose>The original eight-coordinate representation now becomes a choice in the same model, not a second training run. A singular direction is an orthogonal input direction of a linear map, paired with an output direction and a scale called its singular value. A singular value decomposition, or SVD, orders these directions by that scale. Section 7 works the approximation out on a small matrix.</Prose>
<Prose>Choose the original cache, one to eight retained directions, or the full eight-direction basis. The current edited observations, IDs and score-scale setting persist.</Prose><MlaMovementLab investigation="rank"/>

<Prose>{"Now ask a different question. Stack the trained content-key and value up-projections into a joint output-by-latent matrix M. Its singular value decomposition identifies orthogonal latent directions and their contribution to those linear maps. Let P contain the four right singular vectors with the largest singular values."}</Prose>

<Prose>{"For each new input, first compute the original normalized eight-coordinate c, then cache only"}</Prose>

<div className="neural-equation"><MathBlock>{"c'=P^Tc\\in\\mathbb R^4."}</MathBlock></div>

<Prose>{"Replace each up-projection U by UP. The reconstructed representation is now "}<InlineMath>{"UPP^Tc"}</InlineMath>{", which discards the other four directions. The rotary key and query paths stay unchanged. There is "}<strong>{"no additional training"}</strong>{" and no test-driven choice of rank."}</Prose>

<Prose>{"This intervention reduces persistent content coordinates. It still computes the original eight-coordinate RMSNorm before projection; it is not a separately trained four-coordinate latent architecture. The distinction matters both for arithmetic and for interpreting the result."}</Prose>

<Prose>{"The discarded squared singular values sum to about 2.862722. That matches the squared Frobenius error of the rank-4 joint up-projection. This is the optimum for that specified "}<strong>{"parameter-space reconstruction objective"}</strong>{", not a guarantee of minimal attention error or forecast loss."}</Prose>

<Prose>{"Use all eight singular directions as a control. The complete orthogonal basis changes coordinates but loses none, so the outputs should agree. Across the validation set, the actual maximum difference is "}<InlineMath>{"3.58\\times10^{-7}"}</InlineMath>{" in transformed coordinates. We have separately checked a basis change and a truncation, instead of calling both “compression.”"}</Prose>

<H3>{"Actual outcomes"}</H3>

<Prose>{"RMSE is per original normalized coordinate over all 44 output slots of each trajectory. The held-out set contains 60 whole trajectories."}</Prose>

<NeuralTable caption={"Actual outcomes"} headers={[<>{"Method"}</>,<>{"Validation RMSE"}</>,<>{"Test RMSE"}</>,<>{"Float32 compact payload for one 32-point prefix"}</>]} rows={[[<>{"Selected MLA, 8 content coordinates + 2 rotary"}</>,<>{"0.025576"}</>,<>{"0.024946"}</>,<>{"1,280 bytes"}</>],[<>{"Same model, rank-4 cache intervention + 2 rotary"}</>,<>{"0.095481"}</>,<>{"0.091934"}</>,<>{"768 bytes"}</>],[<>{"Persistence baseline"}</>,<>{"—"}</>,<>{"0.026458"}</>,<>{"Not an MLA cache"}</>],[<>{"Training-fitted affine baseline"}</>,<>{"—"}</>,<>{"0.026222"}</>,<>{"Not an MLA cache"}</>]]} />

<Prose>{"The selected small MLA is only modestly better than these simple baselines. The unadapted rank reduction substantially damages its forecasts. Both findings belong in the lesson. A lower parameter reconstruction error than another factorization would not prove good task performance; an important direction can have a modest singular value."}</Prose>

<Prose>{"The table does not compare this model directly with preceding lessons' differently shaped attention models. It also does not establish that a model trained from scratch at rank four could not learn well, or that further adaptation would never help. Those are different experiments requiring their own declared protocols."}</Prose>

<H3>Which observations and settings change this prediction?</H3>
<Prose>Edit a past observation. It changes that frame's learned representation and later causal reads, while preceding outputs remain independent of the future edit. The observation selector and two coordinates change only the chosen frame.</Prose><MlaMovementLab investigation="point"/>

<Prose>{"The visible input was chosen before training: source row 77, with its first 32 points observed. The actual next point is approximately "}<code>{"[0.593810,0.250000]"}</code>{"."}</Prose>

<Prose>{"The full model predicts "}<code>{"[0.599737,0.263627]"}</code>{"; the rank-4 intervention predicts "}<code>{"[0.613758,0.260927]"}</code>{". The compact tensors have shapes "}<code>{"[1,32,8]"}</code>{" and "}<code>{"[1,32,2]"}</code>{" in the first case, versus "}<code>{"[1,32,4]"}</code>{" and "}<code>{"[1,32,2]"}</code>{" in the second. The two cache fields have different meanings; the rotary field is not a second copy of the latent."}</Prose>

<Prose>{"Reflect observed point 23's x coordinate with "}<InlineMath>{"x\\mapsto1-x"}</InlineMath>{" and recompute the prefix. The full model's final prediction becomes "}<code>{"[0.600519,0.263407]"}</code>{". All outputs before the edited point remain "}<strong>{"exactly unchanged"}</strong>{" in the checked computation. A changed past observation can affect subsequent forecasts, so the cache for the old prefix cannot silently be reused."}</Prose>

<Prose>{"Shift all logical positions by 100 under the same ordinary RoPE rule. Full-model outputs agree within "}<InlineMath>{"1.79\\times10^{-7}"}</InlineMath>{". Moving only queries while retaining old rotated keys is a different operation and generally changes scores. A consistent global position transformation can be a valid equivalence; “a cache can never be reused at another absolute position” is too strong. Reuse must preserve or correctly transform all relevant state and positional conventions."}</Prose>

<Prose>{"The wrong scale "}<InlineMath>{"1/\\sqrt{10}"}</InlineMath>{" changes this full model's final prediction only slightly, to "}<code>{"[0.599745,0.263674]"}</code>{". The small effect is still a changed function. Do not magnify it into a dramatic failure. For the rank-4 intervention, its latent width happens to equal the content-head width, so the accidental default equals the intended scale and gives a null result. A test that covers only equal widths can therefore miss the bug."}</Prose>

<Prose>Now change the common logical-ID offset of this same edited prefix. Ordinary RoPE depends on relative turns; shifting all IDs consistently preserves its mathematical dot products. The comparison holds your points, rank and scale fixed.</Prose><MlaMovementLab investigation="shift"/>
<Prose>Finally compare the accidental latent-width default with the original content-plus-positional scale. This toggle changes only the divisor, with your current points, basis and IDs held fixed.</Prose><MlaMovementLab investigation="scale"/>
<Prose>These are linked questions about one running case. This table collects its exact current outputs once; the withheld point remains a reference.</Prose><MlaMovementResults/>
<Prose>Restore the stated source prefix, original cache and correct scale when you want to compare with the static study values above.</Prose><MlaMovementLab investigation="reset"/>

<H3>{"Reproduce the entire study"}</H3>

<Prose>{"Place "}<a href={"/learn-assets/multi-head-latent-attention-mla/author-calculations.py"}>{"the full CPU program"}</a>{", "}<a href={"/learn-assets/multi-head-latent-attention-mla/movement_libras.data"}>{"original data"}</a>{" and "}<a href={"/learn-assets/multi-head-latent-attention-mla/movement_libras.names"}>{"original metadata"}</a>{" together. With Python, NumPy and PyTorch installed, run:"}</Prose>

<CodeBlock language={"bash"}>{"python author-calculations.py"}</CodeBlock>

<Prose>{"The recorded environment is Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, with one CPU thread and deterministic algorithms. The complete program implements preprocessing, duplicate-aware splitting, both baselines, training/selection, both MLA paths, normalized cache truncation, full-parameter derivative checks and actual forecast/cache interventions. It requires no network or GPU. "}<a href={"/learn-assets/multi-head-latent-attention-mla/author-results.json"}>{"Recorded results"}</a>{" and "}<a href={"/learn-assets/multi-head-latent-attention-mla/forecast-model.json"}>{"saved weights/traces"}</a>{" make the observations inspectable; different numerical environments can change last digits."}</Prose>

<Prose>{"Read "}<code>{"LatentForecaster.forward"}</code>{" in the same order as the diagram: normalize the input state, compute content/query latents and rotary branches, append compact fields and logical IDs, calculate the two score terms with the original scale, mask and normalize, mix latents, expand the current head outputs, then complete the residual/FFN/task path."}</Prose>

<MlaProgram file="author-calculations.py"/>

<Prose>The live investigation evaluates one frozen model on the current prefix. It recomputes representations after input edits; it does not refit weights or evaluate the whole dataset. The full study and its results remain downloadable for a separate reproducibility run.</Prose></MlaModelProvider>

<H2>{"7. Deeper connections and practical boundaries"}</H2>

<H3>{"What is low rank, and what is not?"}</H3>

<Prose>The rank-four experiment lost prediction quality even though it reduced storage. To understand what the removed directions optimize, first return to the opening two-head map. Stack its actual key and value rows.</Prose><MlaJointFactorDrawing/>
<Prose>The eight output coordinates pass through only two intermediate coordinates c. Multiplying M by the down-map cannot create a third independent input direction. Before nonlinear normalization, the full effective linear map therefore factors as follows.</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{bmatrix}k^C\\\\v\\end{bmatrix}\n=\\underbrace{\\begin{bmatrix}U_K\\\\U_V\\end{bmatrix}}_M\nW^{DKV}h."}</MathBlock></div>

<Prose>{"The effective linear map has rank at most "}<InlineMath>{"d_c"}</InlineMath>{". With a nonlinear normalization before the up-map, the entire h-to-output map is no longer one fixed linear matrix. Nevertheless, the stacked outputs still lie in the column space of M, whose dimension is at most "}<InlineMath>{"d_c"}</InlineMath>{". These are related but different rank statements."}</Prose>

<Prose>{"This restriction explains why a smaller latent can lose useful distinctions. If two cached content vectors are identical, all their reconstructed content keys and values are identical. Their rotary keys can still differ, and the full model has other paths, so do not turn this into a claim that the complete inputs or predictions must be indistinguishable in every setting."}</Prose>

<Prose>Does a low-rank logit matrix force low-rank attention weights? Use this separate three-position example to see what row-softmax changes.</Prose><MlaSoftmaxRankDrawing/>
<Prose>{"For one head, the unnormalized content-score matrix factors through the latent coordinates. But row-softmax is nonlinear and does not preserve matrix rank. For example, the three-by-three logit matrix with entries "}<InlineMath>{"\\ell_{ij}=ij"}</InlineMath>{" for i,j in "}<code>{"{0,1,2}"}</code>{" has rank one. Its row-softmax matrix has rank three; the independently computed determinant is about 0.024431."}</Prose>



<Prose>{"MLA therefore does not make the full softmax attention matrix low rank merely by using low-rank projection parameters. Dense full-sequence attention still compares query/key positions; its usual score work grows quadratically with sequence length. The "}<a href={"/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals"}>{"next Sparse and Linear Attention lesson"}</a>{" changes which comparisons happen or which operator is computed. Latent-coordinate compression and sequence-level approximation are separate ideas."}</Prose>

<H3>{"Why a good matrix approximation can be a poor predictor"}</H3>

<Prose>{"For a matrix M with singular values "}<InlineMath>{"\\sigma_1\\ge\\cdots\\ge\\sigma_r"}</InlineMath>{", a rank-k truncated SVD minimizes the squared Frobenius reconstruction error, with error "}<InlineMath>{"\\sum_{j>k}\\sigma_j^2"}</InlineMath>{". One way to understand this is to use orthogonal singular coordinates: each retained direction preserves one independent squared-energy contribution, so retaining the largest contributions minimizes the discarded sum. The full theorem covers all rank-k matrices, not only a particular coordinate deletion."}</Prose>

<Prose>{"This objective weights matrix entries uniformly. Actual inputs need not visit every direction uniformly, and task outputs need not value all errors equally. Take "}<InlineMath>{"M=\\operatorname{diag}(10,1)"}</InlineMath>{". Its best rank-one Frobenius approximation is "}<InlineMath>{"\\operatorname{diag}(10,0)"}</InlineMath>{", with squared error 1. For input "}<code>{"[0,10]"}</code>{", however, the original output is "}<code>{"[0,10]"}</code>{" and the approximation gives "}<code>{"[0,0]"}</code>{". The discarded direction contains the entire useful signal for this input."}</Prose>

<Prose>{"In attention, the consequences can be even less direct: key errors alter normalized weights, value errors alter what those weights mix, and later layers transform the result. A data-aware reconstruction objective might weight directions using input covariance; a task-aware adaptation can optimize prediction loss. Neither is automatically equivalent to minimizing projection-weight distance. Our rank-4 result is a concrete example of the distinction."}</Prose>

<Prose>Explore a separate two-coordinate matrix and input, starting with M=[[3,1],[0,2]] and x=[2,−3]. The leading singular direction and both original/reduced outputs are drawn on equal-unit planes. Change the input and whether one or both directions are kept.</Prose><MlaRankLab investigation="input"/>
<Prose>Then edit any matrix coefficient. All input edits persist, so you can distinguish a small map error from a small output error in the direction you actually use. A tied leading singular value has no uniquely preferred direction.</Prose><MlaRankLab investigation="matrix"/>
<Prose>For input random vector x and error map E=M−M_k, the expected squared output error is tr(E C_x Eᵀ), where C_x=E[xxᵀ] is the second-moment matrix. It is the covariance only when x has zero mean; otherwise C_x=Cov(x)+μμᵀ. Thus uniform parameter error corresponds to an isotropic second moment, not every data distribution.</Prose><MathBlock>{String.raw`\mathbb E\lVert Ex\rVert_2^2=\mathbb E\operatorname{tr}(Exx^TE^T)=\operatorname{tr}(E\,\mathbb E[xx^T]\,E^T).`}</MathBlock>

<H3>{"Converting an existing checkpoint is possible, but not a configuration edit"}</H3>

<Prose>{"An arbitrary trained MHA/GQA checkpoint does not already have the required joint latent factorization and shared rotary design. Changing a head-count or rank field cannot create compatible weights. It is also incorrect to claim that useful conversion is impossible."}</Prose>

<Prose>A positional complication remains: ordinary rotary turns can obstruct the fixed factorization, as Section 3 showed. A conversion can select which coordinate pairs retain rotary position and which remain content. This four-coordinate schematic shows that separation; its quarter turn is illustrative, not the paper's selection policy.</Prose><MlaPartialRotaryDrawing/>
<Prose>{""}<a href={"https://aclanthology.org/2025.acl-long.1597.pdf"}>{"MHA2MLA, published at ACL 2025"}</a>{", investigates partial-RoPE adaptation and joint low-rank factorization, followed by continued training. Its methods explicitly assess retained rotary subspaces and factorize the relevant key/value maps. This is a studied conversion route with measured tradeoffs, not proof that every checkpoint converts losslessly. A converted variant's retained rotary components and cache accounting must be read from that variant, rather than assumed identical to the original shared-key V2 design."}</Prose>

<Prose>How can a joint matrix become a down-map and an up-map? Use a separate diagonal M=diag(3,2): retaining its first singular direction gives two factors containing √3.</Prose><MlaSvdFactorDrawing/>
<Prose>The 1×2 down-map writes one latent coordinate; the 2×1 up-map writes two outputs from it. Their product is diag(3,0). The second input direction is gone, and its discarded squared singular value is 4. In the general construction, split the square-root singular values across the two factors.</Prose>
<Prose>{"A bounded conceptual initialization is straightforward when the relevant K/V maps are linear and no incompatible positional operation intervenes. Stack their output-by-input weights into M, compute a truncated SVD "}<InlineMath>{"M\\approx U_k\\Sigma_kV_k^T"}</InlineMath>{", choose down-map "}<InlineMath>{"\\Sigma_k^{1/2}V_k^T"}</InlineMath>{" and joint up-map "}<InlineMath>{"U_k\\Sigma_k^{1/2}"}</InlineMath>{", then split the up-map into key and value parts. These factors approximate the original parameter matrix. They do not automatically preserve task outputs, compensate for changed rotary dimensions or supply the proper normalization/adaptation recipe."}</Prose>

<Prose>{"Our small study starts from a model already trained with MLA and reduces its post-normalization cache. It is not a reproduction of MHA2MLA's full-to-partial-RoPE checkpoint conversion. The original normalization remains part of the declared model, so the two experiments should not be conflated."}</Prose>

<Prose>The linear, affine and nonlinear order contracts from Section 4 still apply to these factorized maps. The matrix's name does not waive those contracts: quantization, position-dependent maps and routing need separate analysis.</Prose>
<H3>Where does a cached vector receive learning credit?</H3><Prose>So far c supplied both key matching and value information. Its gradient must follow both paths. Let J be the scalar training loss, distinct from a matching score ℓ. The following backward circuit uses the same effective query and weighted latent mechanism from Section 2; dashed orange wires carry reverse derivatives.</Prose><MlaBackwardDrawing/>
<Prose>Follow the output derivative back through U_V into the mixture m. Each c receives a direct value contribution through its weight a, and another contribution when its key score changes a. The latter passes through row-softmax and the effective query. Parameter derivatives also land on the actual key/value maps; they are not derivatives of a separately trained approximation.</Prose>

<Prose>{"For an output "}<InlineMath>{"o=Uz"}</InlineMath>{", the gradient with respect to U is the outer product of the upstream output derivative with z; the gradient with respect to z is "}<InlineMath>{"U^T"}</InlineMath>{" times that derivative. For "}<InlineMath>{"z=\\sum_s a_sc_s"}</InlineMath>{", c receives both a direct value-mixture contribution and an indirect contribution through attention weights when c also influences keys."}</Prose>

<Prose>{"The same dependencies exist in the expanded graph. The chain rule combines them in a different order; it does not create a different intended derivative. Our full-parameter check compares those derivatives rather than relying on a loss curve as evidence that attention is correct."}</Prose>
<Prose>Work one head all the way through. Write its weighted latent as m=∑ₛaₛcₛ (the z from Section 2) and its output as o=U_Vm. If g=∂J/∂o is the downstream derivative, then β=U_Vᵀg is the derivative of the loss with respect to m. A record's weight derivative is βᵀcₛ. Row-softmax subtracts the weighted average of those derivatives, giving the score derivative δₛ below.</Prose>
<MathBlock>{String.raw`\beta=U_V^Tg,\qquad \frac{\partial J}{\partial a_s}=\beta^Tc_s,\qquad \delta_s=\frac{\partial J}{\partial\ell_s}=a_s\beta^T(c_s-m).`}</MathBlock>
<Prose>Because ℓₛ=(q̃ᵀcₛ+(qᴿ)ᵀkᴿₛ)/√(d_k+d_r), the cached vector receives its direct mixture derivative plus its score derivative. This local calculation holds the separately drawn positional branch fixed; the complete input gradient also follows that branch and the learned down-map/normalization.</Prose>
<MathBlock>{String.raw`\frac{\partial J}{\partial c_s}=a_s\beta+\frac{\delta_s\widetilde q}{\sqrt{d_k+d_r}},\quad \frac{\partial J}{\partial U_V}=gm^T,\quad \frac{\partial J}{\partial q}=U_K\frac{\sum_s\delta_sc_s}{\sqrt{d_k+d_r}},\quad \frac{\partial J}{\partial U_K}=\frac{q(\sum_s\delta_sc_s)^T}{\sqrt{d_k+d_r}}.`}</MathBlock>
<Prose>The score derivatives sum to zero: adding one constant to every legal score cannot change normalized weights. That is a useful diagnostic independent of the expanded/absorbed comparison. The complete scratch/native programs also check gradients through the rotary, latent, query, output and normalization paths rather than stopping at this local head.</Prose>

<Prose>{"Floating-point multiplication and summation are not perfectly associative. Different intermediate precision, softmax accumulation, kernel reductions or quantization can produce different numerical errors. Compare outputs and gradients with a clear tolerance and inspect which operation changes. Exact algebra does not promise bitwise equality across GPU kernels."}</Prose>

<Prose>Precision also affects the stored record's actual bytes. The following is a pinned older sparse FlashMLA format, not the unquantized record drawn in Section 5.</Prose><MlaPinnedRecordDrawing/>
<Prose>{"Nor does “FP8 model” mean every tensor, operation and cache field is FP8. The "}<a href={"https://arxiv.org/html/2412.19437v2#S3.SS3"}>{"V3 mixed-precision report"}</a>{" retains higher precision for selected operations, including attention and normalization. Cache storage is a separate serving choice. A V3.2 sparse FlashMLA format pinned at commit ba89a346 has 512 one-byte latent values, 16 scale bytes and 128 bytes for 64 BF16 rotary coordinates: "}<strong>{"656 bytes per token"}</strong>{", not simply 576 or 512. This is that specific format, not a universal MLA layout. "}<a href={"https://github.com/deepseek-ai/FlashMLA/blob/ba89a3466e9470ad08ab39738d4e7bb66989e1e7/README.md"}>{"Official FlashMLA cache-format documentation"}</a>{"."}</Prose>


<H3>How can two chunks produce the same normalized read?</H3>
<Prose>Section 2 subtracted a row maximum before exponentiating. A chunked implementation applies the same idea to parts of history. Each block needs its local maximum, shifted exponential mass and weighted latent numerator; it cannot merely average two separately normalized outputs.</Prose><MlaMergeLab/>
<Prose>Align both blocks to their common maximum before adding their masses and numerators. The drawing uses your current positioned hand case, including all record edits. If a block has no legal keys, it contributes zero mass and numerator. If the whole read has no legal keys, it stays undefined.</Prose>
<MathBlock>{"m_b=\\max_{s\\in A_b}\\ell_s,\\quad Z_b=\\sum_{s\\in A_b}e^{\\ell_s-m_b},\\quad n_b=\\sum_{s\\in A_b}e^{\\ell_s-m_b}c_s.\\\\m=\\max_b m_b,\\quad Z=\\sum_b e^{m_b-m}Z_b,\\quad n=\\sum_b e^{m_b-m}n_b,\\quad \\bar c=n/Z."}</MathBlock>
<Prose>A_b is the legal-key set in block b. Substitute each definition: multiplying by exp(m_b−m) changes every local exponential into exp(ℓ_s−m). Summing blocks therefore gives the same global numerator and denominator. This proves the merge independent of block size. A naive mean of block outputs gives equal block weights rather than their actual exponential masses.</Prose>
<H3>Can values themselves be the shared memory?</H3>
<Prose>MLA stored c and expanded its mixed value through U_V. The <a href="https://arxiv.org/html/2609.13285v2">Grouped Value Attention proposal, version 2</a> explores a different factorization: store a grouped value vector and generate head-specific keys from it. This is a research comparison, not a replacement of our fitted model.</Prose><MlaGvaDrawing/>
<Prose>The illustration reuses our three two-coordinate records, [1,0], [0,1] and [1,1], but now stipulates them as the stored values. Each learned head map turns those values into its keys. The query compares with those keys; normalizing the resulting scores gives weights that mix the original values directly. Head 0 writes approximately [0.802224,0.598888] and head 1 [0.891617,0.554192]. There is no MLA-style post-mixture U_V in this route. The positional branch remains separate when required.</Prose>
<MathBlock>{"k_h=v_{g(h)}M_h,\\quad q_h k_h^T=(q_h M_h^T)v_{g(h)}^T,\\quad o_h=\\sum_s a_{h,s}v_{g(h),s}."}</MathBlock>
<Prose>These equations use row vectors: g(h) identifies the value group a query head reads. In column notation the equivalent map is transposed. The effective query absorbs the key map just as Section 2 did, but the cached object and write route differ. A group has d_v coordinates, so G groups plus one shared positional field use Gd_v+d_r coordinates per record. That can be smaller or larger than a chosen MLA d_c+d_r; compare the stated widths and task, not the architecture name.</Prose>
<Prose>The paper also matches initialization scale. If each key coordinate sums d_v independent, zero-mean value/map products with value variance σ_v², then its variance is d_v σ_v² Var(M_ij). Matching a target query variance σ_q² gives Var(M_ij)=σ_q²/(d_v σ_v²). This is a fan-in argument under those initialization assumptions; correlations, nonzero means or trained features change the calculation. It is not a universal optimum or a guarantee of equal task quality.</Prose>
<Prose>The original paper's experiments and released operator contract matter separately from this algebra. This lesson does not infer deployment adoption, a latency advantage or superior quality from the factorization. Its value here is a new question you can now answer: which shared representation generates keys, which representation is mixed as values, and which maps can move across that mixture?</Prose>
<H3>{"Read empirical claims with their actual comparison"}</H3>

<Prose>{"The original attention ablations are in "}<strong>{"Appendix D"}</strong>{", not the overall model comparison in Table 2. Table 9's small-MoE comparison reports MMLU 48.7 versus 50.0 for MHA/MLA, but C-Eval 51.6 versus 50.9. Its large-MoE comparison uses a different training scale. These are useful scoped results; even this one table does not justify “MLA never loses quality.” "}<a href={"https://arxiv.org/html/2405.04434v5#A4"}>{"DeepSeek-V2 attention ablations"}</a>{"."}</Prose>

<Prose>{"A quality-versus-cache plot needs comparable models, tasks, training budgets and measurements. Combining an MMLU number from one model family with a task-average score from another paper does not create a measured frontier. Our figures instead show exact formula-derived storage, actual operator differences and actual local forecasting outcomes, with their evidence types labelled."}</Prose>

<Prose>{"The "}<a href={"https://huggingface.co/deepseek-ai/DeepSeek-V2/raw/main/config.json"}>{"V2"}</a>{" and "}<a href={"https://huggingface.co/deepseek-ai/DeepSeek-V3/raw/main/config.json"}>{"V3"}</a>{" configurations share several MLA widths, but differ in model width, layer count and other settings. A supported buffer length in a configuration also need not equal a demonstrated effective context length on every task. Use the full positional configuration and training/evaluation evidence before extending an inference length."}</Prose>

<H3>{"Applications and interactions worth recognizing"}</H3>

<Prose><strong>Cached cross-attention.</strong> If encoder outputs are fixed while a decoder generates, their latent content and positional representations can be cached and reused. Source positions and decoder positions need an appropriate cross-attention convention; blindly reusing the self-attention rotary relation may be inappropriate. If the source changes, its cached representation changes. <a href="/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals">Transformer Block Architecture</a> drew the separate source and target boundaries; <a href="/learn/path/full-curriculum/interleaved-cross-attention-architectures">Interleaved / Cross-Attention Architectures</a> develops the larger alignment choices.</Prose>

<Prose>{""}<strong>{"Movement, sensor and event streams."}</strong>{" Our forecast demonstrates an actual non-language use. Compact per-observation state can help when many positions are retained. A dense cache still grows with stream length; a window, reset or another architecture is needed for bounded indefinite memory. Sensor calibration or corrected historical observations also require invalidation policies."}</Prose>

<Prose>{""}<strong>{"MoE and sparse attention."}</strong>{" Expert routing usually changes the feedforward part of a Transformer; MLA changes attention representation. They can coexist without expert count multiplying every attention-cache field. Likewise, selecting fewer legal/retrieved positions can coexist with a latent representation for those positions. The current "}<a href={"https://github.com/deepseek-ai/FlashMLA"}>{"FlashMLA repository"}</a>{" distinguishes dense and sparse kernels and version-specific formats. The next variants lesson and "}<a href={"/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals"}>{"MoE lesson"}</a>{" develop these separate mechanisms."}</Prose>

<Prose>{""}<strong>{"Encoders and short inputs."}</strong>{" The operator can be used without an autoregressive cache. Its main persistent-history saving then may not apply, but representation/parameter choices can still be studied. There is no mathematical ban on encoder use or universal one-billion-parameter cutoff. Compare the actual task, temporary activation requirements and implementation support."}</Prose>

<H3>{"Choose the implementation for the workload"}</H3>

<Prose>{"Start with an explicit reference for masks, shapes, scale, normalization, rotary layout and cache lifetime. Then select an implementation that supports those dimensions and dtypes. Check whether the kernel expects expanded heads or an MQA-like latent layout; that API label can describe how the same MLA computation is executed, rather than a different trained architecture."}</Prose>

<Prose>{"For performance, measure prefill and decode separately at stated lengths, batches, dtypes and hardware, including cache allocation and synchronization. Consider total weights, temporary workspace, communication and scheduling. A cache ratio alone cannot explain a commercial API price or establish how many GPUs serve a complete model under a latency target."}</Prose>

<Prose><a href="https://docs.flashinfer.ai/api/attention.html#flashinfer.mla.BatchMLAPagedAttentionWrapper">FlashInfer's MLA API</a> separates planning from execution and defines its own cache-layout and scaling arguments. The 0.7.0.post1 contract and PyTorch 2.14 SDPA are different APIs; the numerical reference is the comparison target, not a guarantee that a GPU backend supports every shape. No GPU timing is supplied by our CPU programs.</Prose>
<Prose>As checked on 5 October 2026, <a href="https://github.com/deepseek-ai/FlashMLA">FlashMLA's current main branch</a> has moved to V4.1/SM100–SM103 formats and removed older V3/V3.2/V4.0 and Hopper paths. Its newer 528/288-byte layouts are different contracts. Reproduce the 656-byte drawing with its pinned older commit, and select current serving code from the actual model/version documentation.</Prose>
<Prose>{"The published "}<a href={"https://arxiv.org/html/2412.19437v2#S3.SS4"}>{"V3 deployment discussion"}</a>{" describes substantial distributed, workload-specific arrangements. It is not evidence for a universal single-server fit rule. Current kernels may support formats and variants newer than this lesson's V2/V3 core; pin the actual source/version when reproducing them. Our CPU programs teach correctness and the effects of a declared intervention, with no claim of a production latency crossover."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"8. Practice: preserve a computation or change it deliberately"}</H2>

<Prose>{"Use a fresh calculation or prediction before opening the optional help. Exercises 1–5 cover the first-pass route; 6–9 extend the deeper branches."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Read one head through a different latent basis"}</H3>

<Prose>{"A head has content query "}<code>{"[1,2]"}</code>{", latent records "}<code>{"[1,0]"}</code>{" and "}<code>{"[0,1]"}</code>{", key up-map "}<code>{"[[2,0],[0,1]]"}</code>{", value up-map equal to the identity, and no positional contribution. The defined scale is "}<InlineMath>{"1/\\sqrt2"}</InlineMath>{". Compute its effective query, weights and output. Then use basis change "}<InlineMath>{"S=\\operatorname{diag}(2,0.5)"}</InlineMath>{". What must happen to the latent records and up-maps to preserve the output?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compute "}<InlineMath>{"U_K^Tq"}</InlineMath>{" first. A consistent basis change uses "}<InlineMath>{"c'=Sc"}</InlineMath>{" and "}<InlineMath>{"U'=US^{-1}"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The effective query is "}<code>{"[2,2]"}</code>{"; both scaled scores are "}<InlineMath>{"\\sqrt2"}</InlineMath>{", so weights are "}<code>{"[0.5,0.5]"}</code>{" and the output is "}<code>{"[0.5,0.5]"}</code>{". The new latent records are "}<code>{"[2,0]"}</code>{" and "}<code>{"[0,0.5]"}</code>{". Right-multiply both up-maps by "}<InlineMath>{"S^{-1}=\\operatorname{diag}(0.5,2)"}</InlineMath>{". Their reconstructed keys and values then equal the originals, so scores, weights and output are preserved. Changing only the stored coordinates would generally change the function."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Preserve the temperature after absorption"}</H3>

<Prose>{"A model has content-head width 4, rotary width 4 and latent width 12. Its concatenated latent/rotary query has width 16. A library uses its default inverse-square-root feature-width scale. What scale should the model use, what scale did the library choose, and how were the logits changed? Why can a test with latent width 4 miss this mistake?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The algebra preserves the old dot product, so compare the original content-plus-rotary width with the new representation width."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The intended scale is "}<InlineMath>{"1/\\sqrt8"}</InlineMath>{"; the default is "}<InlineMath>{"1/\\sqrt{16}=1/4"}</InlineMath>{". Every finite unmasked logit is multiplied by "}<InlineMath>{"\\sqrt{8/16}=1/\\sqrt2"}</InlineMath>{" relative to the intended value, making unequal logits less separated before softmax. This generally changes weights, although equal-score or other special cases can be unchanged. If latent width also equals 4, both total widths equal 8 and the scales coincide, concealing the bug."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Build the compact payload"}</H3>

<Prose>{"Two requests each retain 2,048 positions at 12 layers. The content latent has 24 coordinates and the shared rotary key has 8, stored at two bytes each. Compute the compact payload in bytes and MiB. If the model doubles its query-head count while preserving these cache widths, what changes in this count and what can still become more expensive?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Multiply requests, layers, occupied positions, coordinates per record and bytes per coordinate. A MiB is "}<InlineMath>{"2^{20}"}</InlineMath>{" bytes."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The payload is "}<InlineMath>{"2\\times12\\times2048\\times32\\times2=3,145,728"}</InlineMath>{" bytes, or 3 MiB. It stays unchanged when only query-head count doubles. Query/head projections, score/value-mixture work and transient tensors can grow, as can communication or kernel overhead. The payload excludes reserved capacity, metadata, replicated copies and other model state."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Distinguish three “compression” operations"}</H3>

<Prose>{"A programmer proposes: A, rearrange the same MLA weights from reconstructed to absorbed execution; B, change to an invertible latent basis and compensate every up-map; C, retain only the first half of some latent coordinates. Which are algebraically function-preserving under the stated conditions? Does an observed agreement on one input prove C is lossless?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether information or an operation was discarded, rather than whether a tensor has a new name."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A is exact when masking, scale, positions and all other operations remain equivalent. B is exact for the defined cached vector with the compensating inverse maps. C is generally lossy; it is exact only if the discarded directions have no relevant effect for the domain being claimed. Agreement on one input may mean that input has no discarded component or that effects cancel. It does not prove equality for every possible input. A basis change before an uncompensated nonlinear normalization is a different operation from B."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Diagnose a cache that forgot its positional field"}</H3>

<Prose>{"A developer caches only the normalized content latent, then reconstructs every shared rotary key as if its position were zero. Shapes still match, and next-token outputs look plausible. What information is wrong? Why is a successful one-position test insufficient? Give a useful controlled comparison."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Trace the two additive score terms. Think about both different relative distances and a consistent common shift."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The content term can be correct while the rotary term compares queries with keys rotated at the wrong logical positions. A one-position test can have only one legal key, making softmax equal to one regardless of the score; it therefore cannot establish positional correctness. Compare an explicit multi-position reference with the cache path, using unequal vectors and distances. Also shift all positions consistently under fixed ordinary RoPE as a preservation control, then shift only queries or only cached-key positions as a contrasting operation. Retain or correctly reconstruct each required rotary key and its positional contract."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Find the nonlinear obstruction"}</H3>

<Prose>{"Two cached scalar latents are −2 and 1 with weights 1/3 and 2/3. Values are obtained with ReLU. Compare mixing the values with applying ReLU after mixing latents. Would the rearrangement become valid for a fixed linear value map instead?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Evaluate ReLU on each value first in the original expression. In the second expression, add before applying it."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Mixing ReLU values gives "}<InlineMath>{"(1/3)0+(2/3)1=2/3"}</InlineMath>{". Mixing latents gives "}<InlineMath>{"(1/3)(-2)+(2/3)1=0"}</InlineMath>{", whose ReLU is zero. The two computations differ. A fixed linear map distributes over the weighted sum, so its rearrangement is exact. A position-dependent map, normalization or nonlinear activation needs separate analysis."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Explain why the smaller cache did more arithmetic"}</H3>

<Prose>{"A single-query attention call has H=8, L=1,024, content width 8, rotary width 4, value width 8 and latent width 32. Ignore projection work and count a multiply-add as two operations. Compute expanded-core and absorbed-core operations. Does the larger arithmetic number decide which is faster?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<InlineMath>{"2HL(d_k+d_r+d_v)"}</InlineMath>{" and "}<InlineMath>{"2HL(2d_c+d_r)"}</InlineMath>{" for B=T=1."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Expanded core uses "}<InlineMath>{"2\\times8\\times1024\\times20=327,680"}</InlineMath>{" operations. Absorbed core uses "}<InlineMath>{"2\\times8\\times1024\\times68=1,114,112"}</InlineMath>{", or 3.4 times as many. The absorbed cache can still require much less stored data and support reuse across heads. Hardware bandwidth, arithmetic throughput, kernel layout and other overheads determine latency; neither the FLOP ratio nor the cache ratio alone is a timing result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Challenge the rank interpretation"}</H3>

<Prose>{"Someone says, “The content logits have rank at most two, so the softmax weights also have rank at most two and the entire attention is linear in sequence length.” Identify the two unsupported steps. What would a genuine linear-attention method need to specify?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate a rank bound on a matrix product from the effect of a nonlinear elementwise transformation and normalization."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Softmax need not preserve matrix rank; the lesson gives rank-one logits whose three-by-three probability matrix has full rank. Also, a latent feature factorization does not by itself remove the pairwise softmax computation over query and memory positions. A linear-attention method must specify its actual kernel/operator, normalization and associative accumulation or approximation, including causal-state behavior and its relationship to ordinary softmax. Those are the next topic's mechanisms."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Design the next experiment honestly"}</H3>

<Prose>{"Our trained rank-eight model worsened after a rank-four cache intervention. A colleague concludes that rank-four MLA can never work. Another concludes that ten more epochs would certainly recover it. What do the recorded results actually establish, and what protocol would investigate either possibility without choosing a result after looking at the test set?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Identify which model was trained, which operation happened afterward, and which data chose the checkpoint."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The result establishes the effect of one predeclared, unadapted post-normalization truncation on one selected small model and this row-level task. It does not test a rank-four model trained from scratch or a declared adaptation schedule. Define that new architecture/intervention, training budget, seeds, simple baselines and validation criterion in advance; preserve group/duplicate boundaries and keep test data outside selection. Report all declared outcomes, including failure to recover. A selected checkpoint at the budget endpoint is not evidence of eventual convergence or certain recovery."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"What comes next?"}</H2>

<Prose>{"You can now identify the actual cache fields, calculate both equivalent MLA paths, preserve scale and position, and distinguish representation loss from computational rearrangement. Continue to "}<a href={"/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals"}>{"Sparse and Linear Attention Variants"}</a>{", which changes the sequence comparisons or attention operator itself. Carry the same questions forward: what function is defined, what information is retained, what approximation is introduced, and what was actually measured?"}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>References and another way to learn</H2>
<ul>
<li><strong>Original architecture and evidence.</strong> <a href="https://arxiv.org/html/2405.04434v5">DeepSeek-V2</a>, Section 2.1 and Appendix C, define the compact memory and decoupled rotary branch. Appendix D contains attention ablations; it also shows that quality differences depend on task and training scale. Read those before attributing full-model system savings to MLA alone.</li>
<li><strong>A second complete model treatment.</strong> <a href="https://arxiv.org/html/2412.19437v2">DeepSeek-V3</a> explains architecture, mixed precision and deployment. The <a href="https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py">official inference code</a> exposes RMSNorm, rotary coordinates and both MLA routes. Match its configuration and pin a source revision before reproducing a mutable branch.</li>
<li><strong>Another approachable explanation.</strong> <a href="https://sebastianraschka.com/llms-from-scratch/ch04/05_mla/">Sebastian Raschka's MLA chapter guide</a> connects the preceding GQA idea to the compressed memory. Use it as a second explanation, then work the exact scale, mask and value-reassociation examples here.</li>
<li><strong>Visual attention background.</strong> <a href="https://www.3blue1brown.com/lessons/attention/">3Blue1Brown's illustrated attention article and accompanying video</a> develops the query/key/softmax/value read. It is a helpful alternate view of the operation MLA rearranges, rather than an MLA cache implementation.</li>
<li><strong>Real execution choices.</strong> <a href="https://docs.vllm.ai/en/v0.20.0/api/vllm/model_executor/layers/attention/mla_attention/">vLLM 0.20.0 MLA notes</a> explain prefill, decode and chunked histories. <a href="https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html">PyTorch 2.14 SDPA</a> defines explicit scale, masks, dropout and grouped-query behavior. <a href="https://docs.flashinfer.ai/api/attention.html#flashinfer.mla.BatchMLAPagedAttentionWrapper">FlashInfer MLA</a> supplies a specialized plan/run contract; read its supported layout before changing backends.</li>
<li><strong>Checkpoint conversion.</strong> <a href="https://aclanthology.org/2025.acl-long.1597/">MHA2MLA, ACL 2025</a> and its <a href="https://aclanthology.org/2025.acl-long.1597.pdf">full paper</a> connect partial-RoPE selection, joint SVD and continued training. These are conversion choices with measured tradeoffs, not a lossless configuration edit.</li>
<li><strong>A related factorization to investigate.</strong> <a href="https://arxiv.org/html/2609.13285v2">Grouped Value Attention, version 2</a> makes grouped values the stored representation and generates keys from them. Compare its actual operand flow, initialization assumptions and experimental protocol with MLA.</li>
<li><strong>Precision and version-specific layouts.</strong> <a href="https://github.com/deepseek-ai/FlashMLA/blob/ba89a3466e9470ad08ab39738d4e7bb66989e1e7/README.md">Pinned older FlashMLA documentation</a> defines the illustrated 656-byte sparse V3.2 record. <a href="https://github.com/deepseek-ai/FlashMLA">Current FlashMLA</a> has different model/hardware contracts. Neither record width alone measures speed.</li>
<li><strong>Practical configuration.</strong> <a href="https://huggingface.co/deepseek-ai/DeepSeek-V2/raw/main/config.json">V2 configuration</a> and <a href="https://huggingface.co/deepseek-ai/DeepSeek-V3/raw/main/config.json">V3 configuration</a> identify the actual dimensions, epsilon and positional settings. A supported buffer length is not a demonstration of useful context on every task.</li>
<li><strong>Reproduce the local study.</strong> <a href="/learn-assets/multi-head-latent-attention-mla/data-provenance.md">Data/protocol provenance</a>, <a href="/learn-assets/multi-head-latent-attention-mla/author-results.json">recorded outcomes</a>, <a href="/learn-assets/multi-head-latent-attention-mla/forecast-model.json">saved model and traces</a>, and <a href="/learn-assets/multi-head-latent-attention-mla/mechanism-fixtures.json">hand-fixture values</a> accompany the complete programs below. The frozen forecaster makes representation loss visible without requiring a large pretrained model download.</li>
</ul></section>

</LatentCaseProvider></div> };
export default lesson;
