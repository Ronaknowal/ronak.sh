# Hybrid SSM–Transformer Architectures: Jamba and Complementary Memory

**What you will understand.** Follow information through a model that keeps a compact evolving state and separately addressable records. Build its selective update and attention read, calculate its actual request storage, distinguish expert selection from memory selection, and inspect a complete trained example through its input, layers, classifier and resumed requests.

**Before starting.** Review the [state-space model's retain/write/read update](/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals), [causal attention and projected query/key/value vectors](/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals), and [both residual additions](/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals). We rebuild the small objects here before composing them. The [MoE lesson](/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals) owns full trainable expert dispatch.

**Read and investigate.** Work through the records, state cells and stored keys before counting their bytes. Each small investigation changes a quantity just explained. Shared records, budget dimensions and stroke inputs remain the same across their later views; reset and pin controls preserve complete cases. Deeper derivations and complete programs stay visible.

The preceding [Neural ODE lesson](/learn/path/full-curriculum/neural-ode-continuous-depth-models?module=deep-learning-fundamentals) made depth a continuous trajectory. Here depth is a discrete sequence of different operations. A document assistant may need both the evolving argument and the exact amount beside an earlier invoice identifier. Those needs motivate two information routes inside one network. A hybrid does not mean a vote between separately trained answers: it can mean a single learned representation passing through different kinds of memory operation.

## 1. Which information should survive the next input?

Imagine three labelled measurements arriving. What recent level do they describe, and which measurement belongs to A?

The same supplied records can answer two different questions through two different reads.

[Visual H01 records]

The cyan fields are supplied information. A key is the label used to address a record; its value is the measurement. Arrival order is separate from the label. A recent-level question can compress the measurements into a summary. An A-specific question needs some representation that distinguishes A's value from B's value. Neither question has yet required a neural network.

### Keep two running numbers

How could a summary remember recent measurements without retaining the entire list?

Maintain a weighted numerator and its matching normalizer; update both when each record arrives.

[Visual H02 summary]

Follow the two vertical routes. Their old registers are violet computed state. The supplied multiplier λ scales both registers. The left addition inserts the new measurement; the right addition inserts one unit of normalizing mass. Dividing their new values gives the current weighted average. Keeping only the numerator would let the scale change when the number or weights of records change.

With the original records and λ=1/2, the first update is (2,1), the second is (8,1.5), and the third is (8,1.75). The final ratio is 32/7, approximately 4.571429. The newer record contributes 4, the middle record contributes 3.5, and the oldest contributes 0.5 to the numerator. Their normalizing weights are 1,0.5,0.25 respectively.

\[
s_t=\lambda s_{t-1}+v_t,\quad n_t=\lambda n_{t-1}+1,\quad r_t=s_t/n_t.
\]

Here t counts arrivals and v is the arriving value. Starting with both registers zero gives a positive normalizer after the first input even when λ=0. At λ=0 the read is the newest value; at λ=1 it is the ordinary average. Between them it is a recency-weighted average. Relabelling a key cannot change this particular rule because no key enters its update.

Unrolling the update makes its memory explicit:

\[
r_T=\frac{\sum_{j=1}^{T}\lambda^{T-j}v_j}{\sum_{j=1}^{T}\lambda^{T-j}}.
\]

The persistent state is still just two numbers. This rule is linear in values before normalization; a learned selective model will make its coefficients depend on the input. We will draw that change in §3.

### Read by an address instead

What changes when the question names A instead of asking for a recent level?

Score the keys against the query, then use normalized scores to combine the separately retained values.

[Visual H03 addressed]

Follow the first connected drawing downward: each score passes through exp to become a positive mass. All mass arrows meet at Σ, giving one shared sum. That same sum reaches every division, while each division also receives its own mass. The repeated mass circles carry the original computed values; they do not apply exp again. Then read across the table: key/value → compatibility score → positive exponential mass → normalized weight → signed value contribution. A matching A receives score log 9, the natural logarithm of 9; the other keys receive score 0. Exponentiation turns that score back into 9, while exp(0)=1. Their masses are 9,1,1, whose sum is 11. Dividing each mass by 11 makes the weights sum to one. Summing the final column yields 29/11, approximately 2.636364.

\[
\alpha_j=\frac{e^{s_j}}{\sum_r e^{s_r}},\qquad o=\sum_j\alpha_jv_j.
\]

The calculation is exact softmax arithmetic for these inputs, but the answer is a mixture rather than A's original value 2. Larger positive score gaps concentrate more probability on matching keys; they do not create a separate absence detector. Repeated matching keys share the mass. No matching key gives a uniform mixture here. A negative matching score can even make a matching record less influential. These distinctions matter when using attention for retrieval.

The controls above edit one shared record list. Change B's label to A: only the key-sensitive read changes. Change a value: both reads can change. Changing the query or score gap keeps the summary fixed. With all values equal, either weighted read returns that common value even when the weights change.

### A collision shows precisely what was lost

Could later computation recover every old value from those two summary registers?

Two different streams can leave identical registers while preserving different separately addressed values.

[Visual H04 collision]

The original values 2,7,4 and changed values 6,5,4 both leave s=8 and n=1.75 under this rule. Any later function receiving only those two numbers must return the same answer for both. Their query-A reads are 29/11 and 63/11 because their retained value lists differ. This counterexample concerns this two-register summary. It does not prove that every recurrent network has the same copying limitation: a larger state, a selective write, training or a different representation can preserve different information.

Does changing arrival order change both reads equally?

Move an unchanged record and follow the already taught routes.

[Visual H05 order]

The recency weights depend on arrival order. The key-sensitive sum here does not: the same key/value/score terms are merely permuted. Later attention over contextualized, order-dependent representations need not have that invariance.

What storage grows when more records arrive?

The summary keeps its two registers while an addressable bank keeps each added record.

[Visual H06 memory-case]

Pin a complete case before changing it: the pin includes fields, order, query, λ and score gap. Newly added records begin as A:0 and can be edited above. A hybrid can carry both kinds of information into a later vector; it does not have to average the two displayed answers together.

The following `memory_read` function calculates the two-register recurrence and addressed read just drawn. Subtracting the largest score before exponentiation preserves the normalized weights while avoiding avoidable exponential overflow. Its returned states and weights expose the intermediate calculations instead of hiding them behind a hybrid-model library.

```python
import math
import numpy as np

def memory_read(values,keys,query,decay=.5,beta=math.log(9)):
    values=np.asarray(values,dtype=float);keys=np.asarray(keys)
    scores=np.array([beta if key==query else 0 for key in keys])
    weights=np.exp(scores-scores.max());weights/=weights.sum()
    numerator=normalizer=0.;states=[]
    for value in values:
        numerator=decay*numerator+value;normalizer=decay*normalizer+1
        states.append([numerator,normalizer,numerator/normalizer])
    return {'states':states,'weights':weights.tolist(),'attention':float(weights@values),
            'summary':states[-1][-1]}
```

`values` and `keys` describe the same ordered records. The loop carries only the numerator and normalizer; the separately constructed `weights` retain one term per key. `weights @ values` is the sum of those weighted measurements. The full program appears after the storage and expert calculations in §7, once those operations have also been explained.

## 2. Where do the different operations sit in one network?

We now have a compact update and an addressable read. How can both participate in one learned computation?

Separate input positions across the drawing from depth layers down the drawing.

[Visual H07 depth]

Each column follows a particular arriving position through the stack. Each row is a different learned layer, with its own memory. Horizontal arrows carry that row's state between positions; vertical arrows carry the current position's computed representation into the next layer. An attention layer's stored keys and values are projections of its own inputs, which already include lower layers' computations. Thirty-two depth layers do not mean thirty-two input tokens.

A **sequence mixer** lets one position depend on other permitted positions. Both the recurrent update and causal attention are mixers. A feed-forward network, or FFN, transforms one position's current vector; it uses context already mixed into that vector but does not independently visit other positions.

### Preserve both residual routes

How does a mixer change a representation without discarding its direct input path?

The complete layer adds the mixer output, then separately adds the FFN output to that new intermediate.

[Visual H08 residual]

The first bypass carries the original input x into the first addition. Norm rescales the complete vector before the mixer. Its output 3 is a constructed scalar cutaway, not the result of applying every real matrix to scalar 2. The first intermediate is u=2+3=5. The second bypass starts at u, not at the original x. Adding the constructed FFN output 4 therefore gives 9. Adding 4 to x instead would give 6 and remove the mixer's direct residual contribution.

\[
u^\ell=x^\ell+\operatorname{Mixer}_\ell(\operatorname{RMSNorm}(x^\ell)),\qquad
x^{\ell+1}=u^\ell+\operatorname{FFN}_\ell(\operatorname{RMSNorm}(u^\ell)).
\]

The superscript ℓ selects a depth layer. RMSNorm multiplies each coordinate by the inverse root-mean-square magnitude and a learned gain; it does not subtract the mean. With gains g and small positive ε,

\[
\operatorname{RMSNorm}(x)_i=g_i x_i\big/\sqrt{\tfrac1d\sum_j x_j^2+\epsilon}.
\]

The later real trace shows every normalized coordinate and both additions. Keeping an original path supports information and gradient flow; it does not guarantee that arbitrary training is stable.

### Read the actual original release pattern

Which layer chooses a state update, which chooses attention, and which chooses experts?

Mixer choice and FFN choice are separate columns in the released eight-layer cycle.

[Visual H09 original-cycle]

The zero-based depth index 4 uses attention. The seven other mixer positions use Mamba selective updates. Odd indices use top-2 of 16 FFN experts; even indices use a dense FFN. Repeating four cycles gives 32 layers, attention at 4,12,20,28 and 28 selective layers. Those attention positions have dense FFNs in this release. Every token passes through every depth layer; this cycle is not a rule to attend only to every eighth token.

The [Jamba-v0.1 configuration](https://huggingface.co/ai21labs/Jamba-v0.1/blob/main/config.json) and [original report](https://arxiv.org/html/2403.19887v1) own this pattern. The paper's 1.3B models trained on 250B tokens compared 1:3 and 1:7 ratios with similar reported results in that experiment. That observation motivated the tested cheaper pattern; it is not a theorem that every task should use one attention layer per eight layers. Early attention can already read available input representations, and late attention can still directly influence the head. Placement needs an actual comparison.

## 3. What exactly does a selective state layer update?

The two-register summary was key-blind and used one fixed λ. What would a learned mixer need to decide what to retain, write and read for this input?

Start with the full input, projection, short history and old state rather than a box labelled “Mamba.”

[Visual H10 selective-objects]

This is an explicitly new constructed two-channel cutaway, chosen so every coefficient fits on the page. The numerical walk-through uses the default supplied mixer input [2,−1], already downstream of the enclosing layer's normalization. The input controls in all four selective views share that same current vector; editing one updates the displayed projection, coefficients, state and output everywhere. The four rows of the learned input matrix produce two projected channel values and two separate output-gate precursors. All biases are zero. At the default they give projected [2,−1] and gate [1,1]. Gate values modulate the later read; they are not additional persistent state cells.

In each projection circuit, match input 0 to coefficient 0 and input 1 to coefficient 1. Each × produces one product; both products and the zero bias enter Σ + b. The separate gate circuit follows the same arithmetic with a different learned matrix row. Circles in these connected cutaways round to two decimal places; the adjacent ledgers retain more digits, and every operation uses the unrounded values.

Each channel's projected input joins its own two previous projected inputs. The first causal window [1,0,2] meets kernel [0.25,0.5,1], producing 2.25. The second window [−1,0,−1] meets [0.5,−0.25,1], producing−1.5. Each channel has its own kernel; there is no cross-channel sum in this depthwise convolution. Applying SiLU, defined as a times sigmoid(a), gives transformed inputs approximately 2.035463704 and−0.273638286. After the step, the history retains the final two projected window entries. Retaining H alone would lose these distinct convolution operands.

### Choose the current write, read and elapsed step

How can these transformed inputs choose how strongly the old state decays and where new information goes?

Separate learned projections from the current computed timestep, write and read coefficients.

[Visual H11 selective-coefficients]

Follow the first weighted-sum circuit from the transformed input to the timestep precursor, including the learned bias. Its next arrow passes through softplus. Follow the second weighted sum to the write precursor. In the RMS drawing, square both write coordinates, add them, divide by their count of two, add ε and take a square root. This computes one shared divisor. Both original precursor coordinates—not their squares—are divided by it, then multiplied by their individual learned gains.

The complete Δ matrix and biases produce two precursors. Softplus converts them to positive steps without requiring them to mean seconds. The write matrix produces two coordinates that are shared across the channels' state-coordinate axis; the read matrix produces two coefficients used after the new state has been assembled. The read vector follows the same projection-and-RMS arithmetic just drawn for the write vector, using the distinct learned read matrix shown below it. Each vector uses the shown unit RMS gains and ε=0.000001. These normalized B and C vectors can have either sign. They are input-dependent computed quantities, not themselves fixed parameter matrices.

Original Jamba additionally normalizes the low-rank timestep features before the later timestep projection and softplus. This cutaway and the real small study deliberately use a complete small timestep projection instead of that low-rank factorization. Normalizing the residual output instead would not reproduce the official placement. Check [the official callable source](https://github.com/huggingface/transformers/blob/main/src/transformers/models/jamba/modeling_jamba.py) when implementing a particular checkpoint.

### Work one retain–write–read step

Which old cells survive and how do they become an output vector?

Every state cell receives a retained old term and a new write term; the completed state is then read, skipped, gated and projected.

[Visual H12 selective-state]

Start at old H [0,0] in the first connected drawing. The current Δ₀ and learned A [0,0] meet at ×, then exp computes retention. Multiplying that retention by the old cell gives the retained term. The separate three-input product computes the current write from Δ₀, u₀ and B₀. Only the final + joins these two terms into new H [0,0]. The full labelled matrices below extend that same operation to every cell: H has a channel row and a state-coordinate column. The continuous coefficients are negative, represented by A=−exp(a); our rows are [−1,−2]. Exponentiating ΔA yields a cellwise retention factor strictly between zero and one for finite positive Δ. Multiply it by the carried H cell. Add Δ times the current channel input times the corresponding B coefficient. The old row and the new outer write remain separate until their addition.

In the next circuit, each new state cell meets its corresponding C coefficient. Their products enter one sum; the direct skip D₀ × u₀ enters that same sum as a separate current-input contribution. It is not an additional learned bias. The following gate drawing takes this completed read-plus-skip value and multiplies it by SiLU of the separately projected gate. The two gated channels enter the displayed learned output matrix. No gate arrow feeds back into stored H.

For a channel i and state coordinate n, the computed transition and read are

\[
H_{t,i,n}=e^{-\Delta_{t,i}e^{a_{i,n}}}H_{t-1,i,n}+\Delta_{t,i}B_{t,n}u_{t,i},\qquad
y_{t,i}=\sum_n C_{t,n}H_{t,i,n}+D_i u_{t,i}.
\]

The read contracts across state coordinates, not channels. Its direct D×u path bypasses that stored-state read. The separate projected gate enters through SiLU(gate)×y. The output matrix then mixes channels back into the residual vector. The complete constructed output is approximately [3.312887417,−1.013090770]. All state cells, coefficients, direct-skip terms and output-matrix entries are displayed; these are not learned values from a released foundation model.

Change a supplied mixer input only after following that path once.

[Visual H13 selective-live]

The live result recomputes the projection, causal convolution, selective coefficients, state and gated output under those same constructed learned weights and old buffers. The upcoming saved-model trace exposes analogous actual 16×4 states and learned matrices instead of replacing them with fabricated heatmaps.

### Deeper: a discrete update is a modelling choice

Does the write ΔBu equal exact integration of every continuous-time state equation?

Compare the same old state, decay and constant input under the two different write coefficients.

[Visual H14 discretization]

For the scalar equation dh/ds=Ah+f with constant f over an interval Δ, the exact zero-order-hold update is

\[
h_{\mathrm{new}}=e^{A\Delta}h_{\mathrm{old}}+\frac{e^{A\Delta}-1}{A}f.
\]

The fraction has limit Δ at A=0. A stable implementation uses `expm1(A*Δ)/A`, with that explicit zero-rate branch, rather than subtracting nearly equal numbers carelessly. Mamba's common input discretization uses Δf for its write while retaining the exponential decay. At A=−1, Δ=1, old state 1 and f=2, exact integration gives 2−e^(−1), approximately 1.632121; the common write gives 2+e^(−1), approximately 2.367879. At Δ=0 both leave the old state unchanged. This distinction is developed with its full derivation in the earlier [state-space lesson](/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals).

### Deeper: why a scan can replace a sequential loop

How can a state dependency be computed in parallel without pretending the dependency disappeared?

Compose the actual affine maps in arrival order before applying them to the starting state.

[Visual H15 affine-scan]

A scalar state update is h↦ah+b after the current coefficients are fixed. If a left map runs before a right map, their composition has a=a_right×a_left and b=a_right×b_left+b_right. Our first two maps(0.5,2) and(0.25,−1) combine into(0.125,−0.5); adding the third(0.8,0.2) gives(0.1,−0.2). Applying each in sequence or the combined map to the same initial h gives the same answer in exact arithmetic.

\[
(a_L,b_L)\star(a_R,b_R)=(a_Ra_L,\;a_Rb_L+b_R).
\]

Function composition is associative, so a parallel prefix tree can compute every ordered prefix. It is not commutative: exchanging arrival order usually changes b. Floating-point reduction order can change small rounding errors. Once all input-dependent coefficients have been computed, this is an affine scan over the state; the projections, input-dependent coefficients and nonlinear gates still make the complete input-to-output model nonlinear.

At fixed expanded-channel and state dimensions the state update costs a fixed amount per input, giving work proportional to sequence length T for that operation. Training needs gradients and intermediate information; a compact inference cache does not promise that training stores only one state. The derivative along the old-state route multiplies retention coefficients, which can attenuate distant credit. Input-dependent Δ/B/C routes and skip/residual paths add further derivatives. Negative A ensures decay of the homogeneous frozen-coefficient step, not unconditional boundedness of arbitrary learned writes or gradients. Optimized scans, recomputation and fused kernels address these engineering costs. The explanatory loop is a computational reference, not an optimized-kernel timing forecast.

## 4. What does an attention layer keep instead?

We have unpacked a state that is updated in place. What changes when a layer keeps a separately addressable representation of every permitted position?

Draw the query and the stored key/value operands before drawing attention's formula.

[Visual H16 attention-anatomy]

This new vector cutaway reproduces §1's scores exactly. Each label is a three-coordinate one-hot key. The supplied query has coordinate√3log9 along A and zeros along B/C. Dividing its dot product with each key by√3 produces log 9,0,0. Values remain 2,7,4. The table carries every score, exponential mass, probability and weighted value to the same 29/11 sum.

In a learned head, q=Wq x, k=Wk x and v=Wv x are projections of the layer's current input vectors, with their defined biases if present. Keys and values from older positions are stored; the newest key and value are appended before the newest query reads them. The read is then projected back to the residual stream. Unlike the compact H, the bank preserves a separate row for each retained position.

\[
\alpha_{t,j}=\frac{\exp(q_t^\top k_j/\sqrt{d_h})}{\sum_{r\le t}\exp(q_t^\top k_r/\sqrt{d_h})},\qquad o_t=\sum_{j\le t}\alpha_{t,j}v_j.
\]

The causal convention includes j=t, so a position may read itself; future positions are excluded. Cached K/V avoids recomputing old projections, but the new query still compares with and combines retained rows. Masking, correct offsets and actual head grouping remain part of the function.

### Shared stored heads still answer distinct queries

Does storing fewer K/V heads mean computing fewer queries?

Four distinct query heads can read one shared stored K/V head.

[Visual H17 grouped-heads]

The four violet query circles have separate q values. Follow one query arrow into its own read junction, then into its own output circle. The two other arrows into that junction come from the shared K and V banks. Repeat that path for the other three query rows: no query arrow merges with another query arrow. The single key bank and single value bank provide operands to all four reads; they are not four duplicated banks. Original Jamba has 32 query heads sharing 8 K/V heads, each width 128. Its stored head count is 8; its score calculations still serve 32 queries. The [GQA/MQA lesson](/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=deep-learning-fundamentals) explains the grouping and its full implementation.

### Where can order enter a no-RoPE hybrid?

The simple position-free record read in §1 was invariant to record permutation. The state update was not. A later attention layer reading outputs of lower recurrent/causal-convolution layers can therefore receive already order-dependent vectors. Original Jamba does not add RoPE or another explicit positional embedding; the original report compared variants with and without RoPE. Its result does not imply that raw unordered token embeddings already encode order or that every hybrid can safely remove positional mechanisms.

Our upcoming small comparison explicitly adds the same global position tags to every neural candidate, including the all-attention baseline. It is therefore a controlled teaching experiment, not a replica of the release's no-RoPE architecture.

## 5. What storage grows with the sequence?

We can now name what survives the next input. How many bytes does that request really need?

Separate persistent H, short projected history and K/V rows before multiplying tensor dimensions.

[Visual H18 cache-anatomy]

H has expanded channels down one axis and state coordinates across the other. Short history has a different slot axis. K and V have growing position rows. Each layer and request owns its own bundle. Model weights are shared across requests, and temporary activations/workspaces have a separate lifetime. A small K/V bank alone does not show that the weights or peak training allocations fit on a device.

For batch B, attention depth count L_A, retained length T, stored heads H_KV, head width d_h and K/V scalar bytes b_KV,

\[
M_{KV}=B L_A T\,2H_{KV}d_hb_{KV}.
\]

The 2 is the K/V pair. With L_M selective layers, expanded channels I, state width N, reserved history slots C and separately stated dtypes,

\[
M_H=B L_M I N b_H,\qquad M_{\mathrm{history}}=B L_M I C b_{\mathrm{history}}.
\]

GiB divides integer bytes by 2^30; GB divides by 10^9. The displayed counts use exact integer arithmetic before conversion. A reserved width-C implementation can allocate C slots even though only C−1 previous inputs are mathematically necessary. The later native study stores the minimal previous-two buffer for its width 3 kernel.

Which dimensions are replicated when requests or input positions increase?

[Visual H19 budget-request]

Increasing batch multiplies all request tensors. Increasing length grows K/V only; changing attention-layer count exchanges the two kinds of layer allocation at fixed depth. Setting no attention layers gives zero K/V; all-attention depth gives zero selective state/history. At zero input positions the counted preallocated selective buffers can remain nonzero even while K/V has no rows.

Which dimensions belong to the selective state rather than attention?

[Visual H20 budget-state]

Width times expansion gives I. Increasing state-coordinate count multiplies H but not the short history's slot count. Width influences both persistent channels and learned projection work, so a storage edit alone is not a quality or timing comparison.

Which stored-head dimensions remain separate from depth?

[Visual H21 budget-heads]

Head count and coordinates per stored head multiply K/V. If total depth is reduced below its attention count, that count is reduced too and remains visible in the earlier controls; a configuration cannot have more attention layers than layers.

Which dtype belongs to which object?

[Visual H22 budget-history]

The state and history can have different dtypes. A byte-count choice describes storage scalar size, not whether a particular backend supports that precision or whether it preserves numerical accuracy. Changing reserved convolution slots does not change N.

### The original-shape calculation

Use B=1,32 layers with 4 attention/28 selective, d=4096, expansion 2, I=8192, N=16, C=4,8 K/V heads of width 128, two-byte K/V/history and four-byte H. One attention layer stores 4096 bytes per token; all four together store 16,384 bytes per token. H takes 14 MiB; history takes 1.75 MiB. At 262,144 positions K/V is 4 GiB and total counted request storage is 4.015380859375 GiB. A hypothetical 32-layer all-attention K/V bank with the same stored-head shape is 32 GiB.

| Context positions | Hypothetical all-attention K/V (GiB) | Hybrid K/V (GiB) | Hybrid H + history (GiB) | Hybrid counted total (GiB) |
|---:|---:|---:|---:|---:|
| 1024 | 0.125 | 0.015625 | 0.015380859375 | 0.031005859375 |
| 4096 | 0.5 | 0.0625 | 0.015380859375 | 0.077880859375 |
| 16384 | 2 | 0.25 | 0.015380859375 | 0.265380859375 |
| 65536 | 8 | 1 | 0.015380859375 | 1.015380859375 |
| 262144 | 32 | 4 | 0.015380859375 | 4.015380859375 |

K/V is exactly eight times smaller in this shape comparison. Total counted request storage is not, because the hybrid also carries H and history. This is calculated tensor size, not measured allocator memory, equal-capacity model quality or latency.

Could a fixed attention window bound the remaining growing bank?

[Visual H23 window]

Retained length becomes min(T,W). The last actual integer positions are drawn; crossed positions are outside the directly addressable window. Removing their rows changes the attention operator. Distant information might survive through recurrent state or later contextualized vectors, but the storage bound alone does not guarantee recovery of arbitrary old identifiers.

Keep a complete budget before comparing changed cases.

[Visual H24 budget-case]

## 6. Why are prompt processing and one-token decoding different jobs?

The bank's growth does not directly tell us its arithmetic. Which query/key pairs are actually evaluated?

The prompt forms a causal triangle; a new decoding token adds one query row.

[Visual H25 causal-pairs]

The violet cells show all permitted pairs for a prompt of T=5:1+2+3+4+5=15. Its next query reads those five stored positions and itself, adding 6 white-outlined pairs. The small triangle is an exact counting example, not a latency plot.

For learned Q/K/V/output matrices, query and output widths d give two d×d projections; key and value widths k=H_KV d_h give two k×d projections. Counting a multiplication and addition as two operations gives projection work 4BTd(d+k). Score dot products and value accumulation each use d coordinates across query heads. The ideal causal pair-product work is

\[
4Bd\frac{T(T+1)}2=2BdT(T+1).
\]

After T retained positions, one new query's pair products cost 4Bd(T+1), plus its projections. The history-dependent work is linear for that new query but sums quadratically across full-attention prefill. Actual kernels may process padded tiles or additional masked products.

At T=32768, d=4096, k=1024 and B=1, one layer's prompt projections use 2,748,779,069,440 operations; ideal pair products use 8,796,361,457,664. These are per prompt, not per token. Biases, normalization, softmax, recurrence, FFNs and implementation overhead were excluded. Fused attention and selective scan libraries may change utilization and data movement without changing these equations. Measure time-to-first-token, decoding, peak memory and concurrency on the actual backend rather than converting operation counts into invented seconds.

## 7. Why are experts a separate choice from memory?

Attention selected information from earlier positions. What does selecting an expert select instead?

Begin with one complete gated FFN before drawing a router or a bank of experts.

[Visual H26 swiglu]

The supplied normalized vector [1,2] is an explicitly new constructed FFN example. The two input coordinates fork into both projection branches. The actual Wg and Wu matrices produce gate [1,−2] and up [3,1]. Only the gate branch passes through SiLU; follow each of its two outputs into the × that also receives the matching up coordinate. These products are the hidden vector. The actual Wd matrix combines both hidden coordinates into each output coordinate. The matrix tables below retain all operands and more decimal places than the connected cutaway. No history is stored by this operation. In the residual layer of §2, its output is added to u.

\[
F_e(x)=W_{\mathrm{down},e}\left[\operatorname{SiLU}(W_{\mathrm{gate},e}x)\odot W_{\mathrm{up},e}x\right].
\]

For model width d and hidden width f, gate and up are f×d, down is d×f. Ignoring biases, three matrices contribute 3df entries per expert. Counting just two matrices misses the gating branch.

### Trace every router probability

Which experts execute for this current token vector?

[Visual H27 router-scores]

The first drawing repeats the score → exp → shared sum → individual division route from §1, now for four expert scores rather than three stored records. A router produces these four compatibility scores. The original constructed scores log 4,log 2,0,0 have masses 4,2,1,1 and full probabilities 0.5,0.25,0.125,0.125. Top-2 selects E0 and E1; the white marks indicate selection while violet bar length indicates probability. The four output vectors are [2,−1],[0,3],[−2,0],[1,1]. Their selected contributions sum to [1,0.25].

\[
p=\operatorname{softmax}(r(x)),\qquad z(x)=\sum_{e\in\operatorname{TopK}(p)}p_eF_e(x).
\]

The inspected Jamba implementation retains these full-softmax probabilities after selection. Changing an unselected score changes the denominator and can therefore change selected weights before the selected set changes. Top-k ties use the explicitly stated lower-ID convention in this teaching implementation; another device's `topk` need not choose the same tied order.

Does changing an unselected expert's output have the same effect?

[Visual H28 router-values]

It is a genuine null when scores and selection stay fixed, because that output does not enter the sum. Selected vector coordinates can also cancel, so a zero output does not by itself imply that no expert executed.

What happens if selected probabilities are renormalized?

[Visual H29 router-convention]

Dividing selected probabilities by selected mass 0.75 instead gives [4/3,1/3]. This is a deliberately different operator, not a repair inferred from the words “top-2.” Selecting all four makes their mass 1 and the two conventions coincide. Match the actual checkpoint's rule. Pinning preserves scores, all output vectors and k; resetting restores the original case.

### Deeper: stored capacity is different from active work

Where are the unselected experts' weights during this token's computation?

[Visual H30 expert-bank]

Their gate/up/down matrices remain stored even when they do not execute for this token. Other tokens in the batch can activate them. Routing may require dispatch, weight movement or communication; expert balancing, capacity and training gradients are developed in the [complete MoE program](/learn-code/mixture-of-experts-transformers-moe/moe_study.py).

Using d=4096,f=14336,16 dense FFNs and 16 expert FFNs with 16 experts each gives:

| FFN quantity, excluding biases/routers/mixers | Calculation | Parameters |
|---|---|---:|
| One SwiGLU expert | 3df | 176160768 |
| All stored FFN matrices | (16+16×16)3df | 47915728896 |
| FFN matrices active for one token | (16+16×2)3df | 8455716864 |
| Hypothetical 32 dense FFNs | 32×3df | 5637144576 |

Stored FFN entries are 8.5 times the hypothetical all-dense pool; active entries are 1.5 times it. These scoped counts help explain approximately 52B total/12B active original model parameters. Sparse selection limits executed work while retaining a larger parameter pool; it does not erase unselected weights or make the capacity free.

The complete scalar mechanisms program now brings together the already taught memory read, byte accounting, stable softmax and selected-expert mixture. `route` returns the full probabilities, selected indices, retained weights and vector sum separately; its `renormalize` argument explicitly changes the convention. The byte calculation uses integer products and separately counts K/V, recurrent state and short history. Its direct entry point writes an example-results file in the program's directory; importing its functions does not run that writer.

```python
"""Independent, exact small examples for the hybrid architecture manuscript."""
from pathlib import Path
import json, math
import numpy as np

HERE=Path(__file__).resolve().parent

def memory_read(values,keys,query,decay=.5,beta=math.log(9)):
    values=np.asarray(values,dtype=float);keys=np.asarray(keys)
    scores=np.array([beta if key==query else 0 for key in keys])
    weights=np.exp(scores-scores.max());weights/=weights.sum()
    numerator=normalizer=0.;states=[]
    for value in values:
        numerator=decay*numerator+value;normalizer=decay*normalizer+1
        states.append([numerator,normalizer,numerator/normalizer])
    return {'states':states,'weights':weights.tolist(),'attention':float(weights@values),
            'summary':states[-1][-1]}

def cache_bytes(length,batch=1,layers=32,attention_layers=4,width=4096,
                kv_heads=8,head_width=128,state_size=16,expand=2,
                conv_width=4,kv_bytes=2,state_bytes=4,conv_bytes=2,window=None):
    retained=length if window is None else min(length,window)
    kv=batch*attention_layers*2*kv_heads*head_width*retained*kv_bytes
    recurrent=batch*(layers-attention_layers)*width*expand*state_size*state_bytes
    convolution=batch*(layers-attention_layers)*width*expand*conv_width*conv_bytes
    return {'kv':kv,'recurrent':recurrent,'convolution':convolution,
            'total':kv+recurrent+convolution,'total_GiB':(kv+recurrent+convolution)/2**30}

def route(logits,expert_values,k=2,renormalize=False):
    logits=np.asarray(logits);p=np.exp(logits-logits.max());p/=p.sum()
    indices=sorted(range(len(p)),key=lambda i:(-p[i],i))[:k]
    weights=p[indices].copy()
    if renormalize:weights/=weights.sum()
    return {'probabilities':p.tolist(),'selected':indices,'weights':weights.tolist(),
            'selected_mass':float(p[indices].sum()),
            'output':(weights@np.asarray(expert_values)[indices]).tolist(),
            'boundary_tie':bool(k<len(p) and p[indices[-1]]==sorted(p,reverse=True)[k])}

def run():
    keys=['A','B','C']
    expert_values=[[2,-1],[0,3],[-2,0],[1,1]]
    logits=[math.log(4),math.log(2),0,0]
    record={'reads':{
        'worked':memory_read([2,7,4],keys,'A'),
        'collision':memory_read([6,5,4],keys,'A'),
        'uniform_query':memory_read([2,7,4],keys,'absent'),
        'constant_null':memory_read([4,4,4],keys,'A'),
        'fresh':memory_read([3,8,1,5],['A','B','A','C'],'A',.75,math.log(4)),
        'fresh_changed_key':memory_read([3,8,1,5],['A','A','A','C'],'A',.75,math.log(4))},
        'memory':[], 'routing':{
        'worked':route(logits,expert_values),
        'renormalized':route(logits,expert_values,renormalize=True),
        'changed_selected':route([math.log(4),math.log(2),math.log(8),0],expert_values),
        'fresh':route([0,math.log(3),math.log(6),math.log(2)],[[1,2],[3,0],[-1,4],[2,-2]]),
        'fresh_changed_unselected':route([math.log(2),math.log(3),math.log(6),math.log(2)],[[1,2],[3,0],[-1,4],[2,-2]]),
        'zero_outputs_null':route(logits,[[0,0]]*4),
        'ties':route([0,0,0,0],expert_values)}}
    for length in [0,1024,4096,16384,65536,262144]:
        record['memory'].append({'length':length,'hybrid':cache_bytes(length),
            'attention':cache_bytes(length,attention_layers=32),
            'ssm':cache_bytes(length,attention_layers=0),
            'window_hybrid':cache_bytes(length,window=4096)})
    record['fresh_memory']=cache_bytes(2048,batch=3,layers=12,attention_layers=3,width=512,
        kv_heads=2,head_width=64,state_size=8,expand=2,conv_width=4)
    record['fresh_memory_double']=cache_bytes(4096,batch=3,layers=12,attention_layers=3,width=512,
        kv_heads=2,head_width=64,state_size=8,expand=2,conv_width=4)
    one=3*4096*14336
    record['ffn']={'one_expert':one,'total':(16+16*16)*one,'active':(16+16*2)*one,
                   'baseline_dense':32*one,'full_bf16_weight_bytes_using_rounded_52B':104_000_000_000}
    record['attention_arithmetic']=[{'length':length,
        'projection_flops':4*length*4096*(4096+1024),
        'ideal_causal_pair_flops':2*4096*length*(length+1),
        'one_new_token_pair_flops':4*4096*(length+1)} for length in [1024,32768,262144]]
    (HERE/'mechanism-results.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record,indent=2))

if __name__=='__main__':run()
```

## 8. What changes when the release or numerical format changes?

We have separated request state and active FFN work. Which of those facts may be reused for a different checkpoint?

Keep the release's actual dimensions separate from its family's name.

| Release | Approximately total / active parameters | Depth and width | Architectural scope |
|---|---|---|---|
| Jamba-v0.1 | 52B /12B | 32 layers, width 4096 | Original base release;4 attention layers |
| Jamba-1.5 Mini | 52B /12B | Same size family | Updated instruction-tuned successor |
| Jamba-1.5 Large | 398B /94B | 72 layers, width 8192 | 9 attention layers;64 query heads and 8 K/V heads |

The larger model is not the 32-layer budget with a new name. [Jamba-1.5 §2](https://arxiv.org/html/2408.12570v1#S2) describes its configurations and the authors' tested retention of Mamba-1 after comparing Mamba-2 hybrids. A newer mixer was not automatically better in that combination.

### Weight-storage precision and activation range solve different problems

Does storing expert weights in int8 make every computation and request buffer int8?

[Visual H31 precision]

The first route stores selected FFN weight tiles as integers and reconstructs their scaled values inside the compute kernel. ExpertsInt8 uses dequantization for BF16 computation; it does not make the entire model a uniform-int8 network. Approximately 52B weights at two bytes each already mean 104 billion bytes before caches and workspaces. A discussion of fitting such a model in a single 80GB device depends on the actual quantization/allocation method, not only the active-parameter count.

The second route concerns activations. FP16's largest finite magnitude is 65504; BF16 has a much wider exponent range but fewer fraction bits. Switching activation dtype can therefore overflow a computation that was finite in BF16. The [1.5 report §3.2](https://arxiv.org/html/2408.12570v1#S3.SS2) describes a small mean-squared activation penalty to adapt training to the serving constraint. For α times the average of n squared activation entries, its local derivative is 2αu/n. The complete training derivative includes how u depends on parameters. This is a source-scoped engineering choice, not a universal coefficient or clipping rule for every hybrid.

Pretraining → a stage emphasizing long documents → mixed-skill/long-context post-training changes what the model learns. A maximum context field or enough memory to allocate its cache does not establish reliable reasoning across the entire context. Current model-card identifiers, parameter layouts, normalization placement, routing convention and kernel support must be checked against the exact chosen revision.

The [Mini1.7 card](https://huggingface.co/ai21labs/AI21-Jamba-Mini-1.7) describes 256K context and instruction/grounding updates. Its repository title and example identifier order differ, so resolve the actual ID before copying a deployment command. Its stated BF16 multi-GPU requirements and reported capabilities are model-card claims, not results from the small experiment we now turn to.

## 9. Can we follow an actual learned hybrid from its input to a prediction?

The preceding coefficients were constructed. We now explicitly switch to a real measured handwriting study whose saved weights and complete results can be inspected.

An eight-point spatial pen path supplies every model input.

[Visual H32 study-selection]

The [UCI PenDigits dataset](https://archive.ics.uci.edu/dataset/81/pen+based+recognition+of+handwritten+digits) contains traces from 44 writers, released as eight spatially resampled(x,y) points and a digit label. The samples are approximately regular along distance travelled, not regular time intervals. Direction arrows show point order; neither elapsed seconds, pressure nor pen lifts were supplied. Its 7494 development rows come from 30 writers; its 3498 assessment rows come from 14 different writers.

All 10992 released coordinate sequences are distinct. Seed 181 selects 1000 fitting and 300 validation rows, balanced across ten labels, from the development file;6194 development rows remain unused. All 3498 official assessment rows remain. Fit/validation are row selections from the development writers, not a new writer-disjoint split; the official assessment writer separation is distinct.

### Turn the actual coordinates into model features

What does changing one point change before any memory operation runs?

[Visual H33 study-edit]

The dashed original remains as a reference while the current path changes. The original row 2970 is labelled 1; an edited path receives no invented new ground-truth label. The same edited coordinates flow into every subsequent saved-model and cache view.

How does a point become an embedding vector?

[Visual H34 embedding]

Divide x and y by 50 and subtract 1, putting them in [−1,1]. Add the global zero-based position tag t/7 and its square. This fixed transformation learns nothing from held-out rows. Each learned embedding row multiplies all four features and adds its bias; the view shows the complete chosen row and all contributions, not just a highlighted coefficient.

\[
f_t=[x_t/50-1,\;y_t/50-1,\;t/7,\;(t/7)^2],\qquad h_t=W_{\mathrm{embed}}f_t+b_{\mathrm{embed}}.
\]

The position denominator stays 7 for a partial prefix or resumed suffix. Restarting t at a chunk boundary changes the input basis even when all caches were correctly preserved.

### Compose the complete small network

Where do those sixteen embedding coordinates go next?

[Visual H35 trained-stack]

Every neural candidate has three causal layers, each with the two residual additions of §2, a final RMSNorm, and a ten-row classifier at the last position. M is a selective mixer with 16 channels, state width 4 and causal convolution width 3; A is one 16-coordinate attention head. Every layer's dense SwiGLU has hidden width 32. M0 and M2 in MAM each own their H and projected history; A1 owns growing K/V. The default model has no trained experts: routing in §7 was a separate controlled scalar/vector investigation.

The tiny mixer omits Jamba's expansion and low-rank timestep factorization; the tiny attention has one head rather than GQA. All candidates use the same supplied global position tags. These deliberate choices make each operation inspectable. They prevent this model from being a miniature performance benchmark for a released language model.

Which values actually enter the two residual additions?

[Visual H36 layer-trace]

The selected coordinate is shown before normalization, after normalization, after mixing, at u=x+mixed, after the second normalization, after the FFN and at u+FFN. A normalized coordinate depends on the whole vector's RMS. An FFN coordinate also depends on all its incoming vector terms; showing one coordinate does not turn the layer into sixteen independent scalar classifiers.

How is one real selective cell assembled?

[Visual H37 state-cell]

The current projected input joins its actual previous-two history slots. The view then exposes u,Δ,B,C, the old cell, retention factor, retained term, new write and new cell. The full four-cell row and each C product remain visible for the read contraction. The skip and gate apply afterwards. Select an M layer in the earlier layer view. An A layer has no H cell, so irrelevant state controls are removed and its distinct representation is explained rather than displaying fake zeros.

What can a real attention query read at this point?

[Visual H38 attention-cell]

For an A layer, every permitted stored key row contributes a full 16-coordinate dot product divided by√16=4, then a normalized weight and selected value-coordinate contribution. The current point is included; a future point is absent. The highlighted coordinate is one product in the full score, not the whole score. The complete selected stored K/V row remains inspectable through the prefix-cache view in §10.

How do these contextualized coordinates become a digit decision?

[Visual H39 classifier]

The final normalized 16-coordinate vector meets every coefficient in the selected classifier row and its learned bias. This produces one logit: a real-valued score, not yet a probability. All ten scores participate in one softmax denominator. Selecting a different row does not retrain the model. Earlier-point logits show its intermediate computation, but training supervised only point 8, so they are not calibrated guarantees about partial-stroke recognition.

### Implement the composition from scratch, using ordinary tensor tools

The complete `stroke_models.py` uses `nn.Linear` and registered parameters for learned projections, a per-channel convolution kernel, explicit selective tensor updates, explicit masked attention, RMSNorm and both residual additions. `SelectiveMixer.step` follows the retain/write/read/gate operands drawn in §3. Its returned pair is(state,projected history). `AttentionMixer.step` returns(K,V); `Layer.step` composes a mixer with the correctly retained u+FFN path. `StrokeModel.positioned` creates the four-feature input basis, and its classifier reads the final normalized vector.

```python
"""Small causal mixer comparison on UCI PenDigits. No Jamba weights or CUDA kernels.

Run this file with --train to reproduce all predeclared fits. With no arguments,
print the saved report without training. Requires numpy and torch.
"""
from pathlib import Path
import argparse, copy, hashlib, json
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F

HERE=Path(__file__).resolve().parent
WIDTH=16
STATE=4

def data_split():
    arrays=[np.loadtxt(HERE/name,delimiter=',',dtype=np.int64)
            for name in ['pendigits.tra','pendigits.tes']]
    groups={}
    for file_index,rows in enumerate(arrays):
        for row_index,row in enumerate(rows):
            groups.setdefault(tuple(row[:-1]),[]).append((file_index,row_index,int(row[-1])))
    conflict=[members for members in groups.values() if len({m[2] for m in members})>1]
    cross=[members for members in groups.values() if len({m[0] for m in members})>1]
    eligible=[[],[]]
    for members in groups.values():
        if len({m[2] for m in members})>1 or len({m[0] for m in members})>1:
            continue
        file_index,row_index,_=members[0]
        eligible[file_index].append(row_index)
    eligible=[np.array(sorted(ids)) for ids in eligible]
    generator=np.random.default_rng(181)
    fit=[];validation=[]
    for label in range(10):
        ids=eligible[0][arrays[0][eligible[0],-1]==label].copy()
        generator.shuffle(ids)
        fit.extend(ids[:100]);validation.extend(ids[100:130])
    ids={'fit':np.array(fit),'validation':np.array(validation),'assessment':eligible[1]}
    selected={}
    for role,indices in ids.items():
        rows=arrays[1 if role=='assessment' else 0][indices]
        selected[role]=(torch.tensor(rows[:,:16].reshape(-1,8,2)/50-1,dtype=torch.float32),
                        torch.tensor(rows[:,-1],dtype=torch.long))
    record={'source_rows':[len(a) for a in arrays], 'unique_feature_groups':len(groups),
            'repeated_feature_groups':[m for m in groups.values() if len(m)>1],
            'conflicting_groups':conflict,'cross_official_split_groups':cross,
            'eligible_counts':[len(e) for e in eligible],
            'ids_1_based':{k:(v+1).tolist() for k,v in ids.items()},
            'class_counts':{k:torch.bincount(v[1],minlength=10).tolist() for k,v in selected.items()}}
    return selected,record

class RMS(nn.Module):
    def __init__(self,width):
        super().__init__();self.weight=nn.Parameter(torch.ones(width))
    def forward(self,x):
        return x*torch.rsqrt(x.square().mean(-1,keepdim=True)+1e-6)*self.weight

class SelectiveMixer(nn.Module):
    def __init__(self):
        super().__init__()
        self.input=nn.Linear(WIDTH,2*WIDTH)
        self.convolution=nn.Conv1d(WIDTH,WIDTH,3,groups=WIDTH)
        self.delta=nn.Linear(WIDTH,WIDTH)
        self.write=nn.Linear(WIDTH,STATE,bias=False)
        self.read=nn.Linear(WIDTH,STATE,bias=False)
        self.write_norm=RMS(STATE);self.read_norm=RMS(STATE)
        self.log_rates=nn.Parameter(torch.arange(1,STATE+1).float().log().repeat(WIDTH,1))
        self.skip=nn.Parameter(torch.ones(WIDTH))
        self.output=nn.Linear(WIDTH,WIDTH)
    def step(self,x,cache=None):
        projected,gate=self.input(x).chunk(2,-1)
        if cache is None:
            state=x.new_zeros(x.shape[0],WIDTH,STATE)
            history=x.new_zeros(x.shape[0],WIDTH,2)
        else: state,history=cache
        window=torch.cat([history,projected.unsqueeze(-1)],-1)
        u=F.silu((window*self.convolution.weight[:,0,:]).sum(-1)+self.convolution.bias)
        delta=F.softplus(self.delta(u))
        write=self.write_norm(self.write(u));read=self.read_norm(self.read(u))
        decay=torch.exp(-delta.unsqueeze(-1)*self.log_rates.exp())
        state=decay*state+delta.unsqueeze(-1)*write.unsqueeze(1)*u.unsqueeze(-1)
        value=(state*read.unsqueeze(1)).sum(-1)+self.skip*u
        return self.output(value*F.silu(gate)),(state,window[:,:,1:])
    def forward(self,x):
        cache=None;outputs=[]
        for token in x.unbind(1):
            output,cache=self.step(token,cache);outputs.append(output)
        return torch.stack(outputs,1)

class AttentionMixer(nn.Module):
    def __init__(self):
        super().__init__();self.qkv=nn.Linear(WIDTH,3*WIDTH);self.output=nn.Linear(WIDTH,WIDTH)
    def forward(self,x):
        q,k,v=self.qkv(x).chunk(3,-1)
        scores=q@k.transpose(-1,-2)/WIDTH**0.5
        mask=torch.ones(x.shape[1],x.shape[1],dtype=torch.bool,device=x.device).triu(1)
        scores=scores.masked_fill(mask,float('-inf'))
        return self.output(scores.softmax(-1)@v)
    def step(self,x,cache=None):
        q,k,v=self.qkv(x).chunk(3,-1)
        keys=k[:,None,:] if cache is None else torch.cat([cache[0],k[:,None,:]],1)
        values=v[:,None,:] if cache is None else torch.cat([cache[1],v[:,None,:]],1)
        scores=(q[:,None,:]@keys.transpose(-1,-2))/WIDTH**0.5
        output=(scores.softmax(-1)@values).squeeze(1)
        return self.output(output),(keys,values)

class Layer(nn.Module):
    def __init__(self,kind):
        super().__init__();self.norm1=RMS(WIDTH);self.norm2=RMS(WIDTH)
        self.mixer=SelectiveMixer() if kind=='M' else AttentionMixer()
        self.gate_up=nn.Linear(WIDTH,2*WIDTH*2);self.down=nn.Linear(WIDTH*2,WIDTH)
    def channel(self,x):
        gate,up=self.gate_up(self.norm2(x)).chunk(2,-1)
        return self.down(F.silu(gate)*up)
    def forward(self,x):
        x=x+self.mixer(self.norm1(x));return x+self.channel(x)
    def step(self,x,cache):
        mixed,cache=self.mixer.step(self.norm1(x),cache)
        x=x+mixed;return x+self.channel(x),cache

class StrokeModel(nn.Module):
    def __init__(self,pattern):
        super().__init__();self.pattern=pattern
        if pattern=='linear': self.classifier=nn.Linear(16,10);return
        self.embed=nn.Linear(4,WIDTH)
        self.layers=nn.ModuleList([Layer(kind) for kind in pattern])
        self.norm=RMS(WIDTH);self.classifier=nn.Linear(WIDTH,10)
    def positioned(self,x,offset=0):
        position=torch.arange(offset,offset+x.shape[1],device=x.device,dtype=x.dtype)/7
        tags=torch.stack([position,position.square()],-1).expand(x.shape[0],-1,-1)
        return self.embed(torch.cat([x,tags],-1))
    def forward(self,x,all_positions=False):
        if self.pattern=='linear': return self.classifier(x.flatten(1))
        h=self.positioned(x)
        for layer in self.layers: h=layer(h)
        logits=self.classifier(self.norm(h))
        return logits if all_positions else logits[:,-1]
    def stream(self,x,cache=None,offset=0):
        if self.pattern=='linear': raise ValueError('Flat baseline has no prefix model.')
        caches=[None]*len(self.layers) if cache is None else cache
        outputs=[]
        h=self.positioned(x,offset)
        for token in h.unbind(1):
            for index,layer in enumerate(self.layers):
                token,caches[index]=layer.step(token,caches[index])
            outputs.append(self.classifier(self.norm(token)))
        return torch.stack(outputs,1),caches

def metrics(logits,labels):
    predicted=logits.argmax(-1)
    confusion=torch.bincount(labels*10+predicted,minlength=100).reshape(10,10)
    return {'n':len(labels),'errors':int((predicted!=labels).sum()),
            'cross_entropy':float(F.cross_entropy(logits,labels)),
            'confusion':confusion.tolist()}

def train():
    torch.set_num_threads(1);torch.use_deterministic_algorithms(True)
    data,record=data_split();report={'data':record,'torch':torch.__version__,'fits':[]};weights={}
    for pattern,seed in [('linear',37),('MMM',37),('AAA',37),('MAM',37),('AMM',37),('MAM',73)]:
        torch.manual_seed(seed);model=StrokeModel(pattern)
        optimizer=torch.optim.Adam(model.parameters(),lr=.003)
        batch_generator=torch.Generator().manual_seed(491)
        best_loss=float('inf');best_state=None;history=[]
        for epoch in range(1,81):
            model.train();order=torch.randperm(len(data['fit'][0]),generator=batch_generator)
            for indices in order.split(100):
                loss=F.cross_entropy(model(data['fit'][0][indices]),data['fit'][1][indices])
                optimizer.zero_grad();loss.backward();nn.utils.clip_grad_norm_(model.parameters(),1)
                optimizer.step()
            model.eval()
            with torch.no_grad(): val=metrics(model(data['validation'][0]),data['validation'][1])
            history.append({'epoch':epoch,'validation':val['cross_entropy'],'errors':val['errors']})
            if val['cross_entropy']<best_loss:
                best_loss=val['cross_entropy'];best_state=copy.deepcopy(model.state_dict());best_epoch=epoch
        model.load_state_dict(best_state);model.eval()
        with torch.no_grad():
            entry={'key':f'{pattern}-{seed}','pattern':pattern,'seed':seed,'selected_epoch':best_epoch,
                   'parameters':sum(p.numel() for p in model.parameters()),'history':history,
                   'metrics':{role:metrics(model(x),y) for role,(x,y) in data.items()},
                   'validation_logits':model(data['validation'][0]).tolist()}
            if pattern!='linear':
                full=model(data['validation'][0],True);stream,_=model.stream(data['validation'][0])
                left,cache=model.stream(data['validation'][0][:,:3])
                right,_=model.stream(data['validation'][0][:,3:],cache,offset=3)
                reset,_=model.stream(data['validation'][0][:,3:],offset=3)
                entry['checks']={'stream_max_difference':float((full-stream).abs().max()),
                    'carried_chunk_max_difference':float((full-torch.cat([left,right],1)).abs().max()),
                    'reset_chunk_max_difference':float((full[:,3:]-reset).abs().max())}
                entry['validation_prefix_logits']=full.tolist()
        for name,array in best_state.items():weights[f"{entry['key']}::{name}"]=array.numpy()
        report['fits'].append(entry)
        print(entry['key'],best_epoch,{k:v['errors'] for k,v in entry['metrics'].items()},flush=True)
    np.savez_compressed(HERE/'stroke-fits.npz',**weights)
    (HERE/'stroke-results.json').write_text(json.dumps(report,indent=2)+'\n')

def load_fit(key):
    pattern=key.rsplit('-',1)[0];model=StrokeModel(pattern)
    with np.load(HERE/'stroke-fits.npz') as saved:
        state={name:torch.tensor(saved[f'{key}::{name}']) for name in model.state_dict()}
    model.load_state_dict(state);return model.eval()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--train',action='store_true');args=parser.parse_args()
    if args.train:train()
    else:
        report=json.loads((HERE/'stroke-results.json').read_text())
        for fit in report['fits']:
            print(fit['key'],fit['selected_epoch'],{k:v['errors'] for k,v in fit['metrics'].items()})
```

`SelectiveMixer.forward` deliberately loops over positions to expose the state contract; an optimized scan can compute the same affine dependencies with a different schedule. `AttentionMixer.forward` uses a triangular future mask; `step` appends K/V and reads the complete permitted prefix. This small reference uses repeated concatenation for the attention bank, which can copy old data. A production cache may preallocate or page memory while preserving the same model/position/request identity contract. Changing allocation must preserve the same step outputs and owned prefix-cache values.

The dense channel route first computes its second RMSNorm, projects 64 coordinates split into 32 gate and 32 up values, multiplies SiLU(gate)×up, and projects those 32 hidden values back to 16. Its output is added to the intermediate u. The learned projections and parameters remain ordinary PyTorch objects, so autograd, state dictionaries and Adam can operate on the explicitly implemented mechanism.

All six predeclared runs used 80 epochs, batches 100, Adam learning rate 0.003, gradient-norm clipping 1 and the same batch-permutation sequence from seed 491. Each fit chooses its earliest lowest-validation-cross-entropy epoch, not lowest validation error count. Four neural patterns at seed 37, the second MAM seed 73 and a 170-parameter flattened linear model are all retained. Matching depth is not matching capacity.

\[
\mathcal L=-\frac1m\sum_{i=1}^{m}\log\operatorname{softmax}(z_i)_{y_i}.
\]

In a directory containing the companion data, arrays and programs, run `python stroke_models.py` to read the saved report without training. `python stroke_models.py --train` explicitly reproduces all six declared fits. The retained study used CPU PyTorch 2.14.0 and NumPy 2.3.5; no foundation-model weights or CUDA kernels were required. The raw files, saved NPZ arrays and provenance are supplied for that actual reproduction dependency, not arbitrary “save this” naming.

### Keep the measured results, including the reversals

Did the hybrid actually win this comparison?

[Visual H40 histories]

The plots use all 480 measured validation-history rows with no smoothing. Outlined points mark the selected epochs; the table retains every fit/error result. MMM has the fewest validation classification errors, while AAA has the fewest assessment errors. MAM is not the overall winner. Its two seeds differ. MAM and AMM also differ despite equal parameter count, showing that arrangement can change fitted behavior.

These measured runs support a limited conclusion: the learned sequence models can recognize these eight-point paths, and mixer arrangement affects this controlled study. They do not establish language-model retrieval capacity, long-context inference throughput or a universally superior hybrid ratio. Validation cross-entropy can improve through confidence changes without changing error count. A few confident mistakes can also increase it sharply; keep both measures.

The complete inspection program uses the same saved weights and exposes the intermediate arrays, full logits, class probabilities and cache interventions. It explicitly maps raw data rows to the native trace instead of importing a ready-made hybrid network.

```python
"""Inspect saved model predictions and deliberately damage a request's caches.

Example: python inspect_stroke.py --row 1 --break-at 3 --mode recurrent-reset
Rows refer to 1-based original pendigits.tra lines; assessment labels are not tuned here.
"""
from pathlib import Path
import argparse, copy, json
import numpy as np
import torch
from stroke_models import HERE, load_fit

def run_trace(coordinates,key='MAM-37',break_at=3,mode='carry'):
    model=load_fit(key)
    points=torch.tensor(np.asarray(coordinates)/50-1,dtype=torch.float32)[None,:,:]
    with torch.no_grad():
        full=model(points,True)
        if break_at==0:
            left=full[:,:0];cache=[None]*len(model.layers)
        else:left,cache=model.stream(points[:,:break_at])
        snapshots=[]
        for kind,state in zip(model.pattern,cache):
            if state is None:snapshots.append({'kind':kind,'empty':True});continue
            snapshots.append({'kind':kind,'shapes':[list(v.shape) for v in state],
                              'norms':[float(v.norm()) for v in state]})
        if mode in ['recurrent-reset','kv-reset','convolution-reset']:
            for index,kind in enumerate(model.pattern):
                if mode=='recurrent-reset' and kind=='M':cache[index]=None
                if mode=='kv-reset' and kind=='A':cache[index]=None
                if mode=='convolution-reset' and kind=='M' and cache[index] is not None:
                    cache[index]=(cache[index][0],torch.zeros_like(cache[index][1]))
        if break_at<8:
            offset=0 if mode=='position-reset' else break_at
            right,_=model.stream(points[:,break_at:],cache,offset=offset)
            branch=torch.cat([left,right],1)
        else:branch=left
        return {'key':key,'coordinates':np.asarray(coordinates).tolist(),'break_at':break_at,
                'mode':mode,'cache_at_boundary':snapshots,
                'full_logits':full[0].tolist(),'branch_logits':branch[0].tolist(),
                'full_probabilities':full[0,-1].softmax(-1).tolist(),
                'branch_probabilities':branch[0,-1].softmax(-1).tolist(),
                'full_prediction':int(full[0,-1].argmax()),
                'branch_prediction':int(branch[0,-1].argmax()),
                'maximum_logit_difference':float((full-branch).abs().max())}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--row',type=int,default=1)
    parser.add_argument('--break-at',type=int,default=3)
    parser.add_argument('--mode',choices=['carry','recurrent-reset','kv-reset','convolution-reset','position-reset'],default='carry')
    parser.add_argument('--key',choices=['MMM-37','AAA-37','MAM-37','AMM-37','MAM-73'],default='MAM-37')
    args=parser.parse_args()
    if not 1<=args.row<=7494 or not 0<=args.break_at<=8:parser.error('Row or boundary out of range.')
    row=np.loadtxt(HERE/'pendigits.tra',delimiter=',')[args.row-1]
    print(json.dumps(run_trace(row[:16].reshape(8,2),args.key,args.break_at,args.mode),indent=2))
```

For the original validation row 2452, run `python inspect_stroke.py --row 2452 --break-at 3 --mode carry`, then use `--mode convolution-reset`. This is a deliberate switch from our edited row 2970 back to the stated original digit 0 example. The uninterrupted probability for 0 is approximately 0.997078. Clearing its history changes intermediate logits by about 9.0302877 while its final class remains 0. We now use that difference to study request correctness rather than equating a correct label with an equivalent computation.

## 10. What must survive when a request resumes or branches?

The complete model has now produced a real prefix. Which objects must accompany its next point?

Inspect the original prefix bundle before applying any intervention.

[Visual H41 prefix-cache]

At boundary 3, each M layer stores 16×4=64 H values and 16×2=32 previous projected inputs. The A layer stores three 16-coordinate keys and three 16-coordinate values,96 values. MAM therefore carries 288 values in these tensors. This is the program's actual minimal previous-two history layout, different from §5's reserved-four original-release accounting.

A request state comprises every layer's required tensors and the next logical position. Those tensors depend on the prefix, model weights, layer and input basis. They are not a global scratch buffer interchangeable between users.

Does complete carried execution reproduce the original function?

[Visual H42 boundary-continuation]

The full and current branch probability vectors are both drawn. Each point's maximum absolute logit difference is shown; comparing only the final winning class would miss numeric changes. An empty prefix before point 1 and an empty suffix after point 8 are true null boundaries: an intervention cannot affect already-produced outputs without recomputation.

The original five neural models'300 validation sequences had a maximum full-versus-stream output discrepancy of approximately 1.26×10^(−5) in float32. The retained two-sequence float64 MAM check gave output discrepancy 1.42×10^(−14) and parameter-gradient discrepancy below 3.1×10^(−15). These are the unchanged small-model scientific checks, not a precision promise for arbitrary release kernels.

Which past object caused a changed computation?

[Visual H43 separate-cache-faults]

The default unedited row 2970 with MAM-37, boundary 3 and only K/V cleared changes its uninterrupted class 1 to branch class 2. Clearing only short history leaves H in place but changes the next transformed input. Clearing the recurrent pair removes both H and its history. Fault flags are independent and remain visible: later controls do not silently switch off earlier interventions.

Can correct tensors still give a wrong continuation if the supplied position is restarted?

[Visual H44 position-fault]

The fourth point must use global index 3, producing tags 3/7 and 9/49. Restarting its index at 0 changes its embedding. The local input basis, not just tensor shape, belongs to the request contract.

### Own a request, then fork its prefix

What happens if two users arrive interleaved or a single prefix produces two continuations?

[Visual H45 request-fork]

Each branch owns independent H/history/K/V tensor storage while sharing frozen model weights. Appending to one branch must not mutate the other's starting point. Explicitly keeping a prefix snapshot also enables rewind. K/V appends can be reversed by truncating appended rows; recurrent updates can lose information through selective writes, decay and finite precision, so their rewind uses a saved state or prefix recomputation.

What does a deliberately wrong request identity do to this same input?

[Visual H46 donor-fault]

The donor is the other stated validation row's prefix at the same boundary. The current request keeps its own suffix. Compatible shapes do not make that donor the same prefix. This intervention is a diagnostic identity error, not a cache optimization.

### Add an explicit request-state adapter

The existing native `StrokeModel.stream` updates its supplied cache list and assumes a nonempty chunk. A safe caller must own that list, validate inputs and avoid calling its stack operation with an empty suffix. The following additional program composes that same unchanged model into request continuation, snapshot, fork and restore operations.

```python
"""Validated request snapshots around the already explained tiny StrokeModel.

Put this beside stroke_models.py and its saved stroke-fits.npz. This file imports
the same fitted model; it never trains or rewrites a scientific artifact. The
adapter is specific to eight normalized PenDigits points and the taught fixed
global-position basis, not a serving implementation for released Jamba models.
"""
from dataclasses import dataclass
import hashlib
import torch
from stroke_models import WIDTH, STATE, load_fit

BASIS = 'pendigits-fixed-xy/global-index-over-7/v1'


def model_identity(model):
    """Bind the architecture and actual parameter bytes, not a friendly name."""
    digest = hashlib.sha256(model.pattern.encode())
    for name, value in model.state_dict().items():
        digest.update(name.encode())
        digest.update(str((tuple(value.shape), value.dtype)).encode())
        digest.update(value.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def clone_cache(cache):
    """Clone both tensors of every nonempty layer; keep no mutable aliases."""
    return tuple(None if entry is None else tuple(value.detach().clone() for value in entry)
                 for entry in cache)


@dataclass(frozen=True)
class Snapshot:
    request_id: str
    model_id: str
    basis: str
    batch: int
    offset: int
    prefix_digest: str
    _cache: tuple

    @property
    def cache(self):
        # A caller may inspect or edit this returned copy, never the snapshot's
        # own tensor storage. Frozen metadata alone would not freeze a tensor.
        return clone_cache(self._cache)


class StrokeRequest:
    """One request's owned prefix, with atomic validation before continuation."""

    def __init__(self, model, request_id, batch=1, basis=BASIS):
        if model.pattern not in {'MMM', 'AAA', 'MAM', 'AMM'} or model.training:
            raise ValueError('Use an evaluated causal model, not the flattened baseline.')
        if not isinstance(request_id, str) or not request_id:
            raise ValueError('Give the request a nonempty identity.')
        if isinstance(batch, bool) or not isinstance(batch, int) or batch < 1:
            raise ValueError('Batch size must be a positive integer.')
        if basis != BASIS:
            raise ValueError('This adapter teaches the fixed eight-point position basis.')
        self.model = model
        self.request_id = request_id
        self.batch = batch
        self.basis = basis
        self.model_id = model_identity(model)
        self._offset = 0
        self._cache = tuple(None for _ in model.layers)
        self._points = None

    @property
    def offset(self):
        return self._offset

    @property
    def cache(self):
        return clone_cache(self._cache)

    def _check_model(self):
        if self.model.training or model_identity(self.model) != self.model_id:
            raise ValueError('The model weights or evaluation state changed during this request.')

    def _validate_cache(self, cache, offset):
        parameter = next(self.model.parameters())
        if not isinstance(cache, tuple) or len(cache) != len(self.model.layers):
            raise ValueError('The cache must have one entry per depth layer.')
        for kind, entry in zip(self.model.pattern, cache):
            if offset == 0:
                if entry is not None:
                    raise ValueError('An empty prefix cannot carry another request\'s tensors.')
                continue
            shapes = ((self.batch, WIDTH, STATE), (self.batch, WIDTH, 2)) if kind == 'M' else (
                (self.batch, offset, WIDTH), (self.batch, offset, WIDTH))
            if not isinstance(entry, tuple) or len(entry) != 2:
                raise ValueError('Every nonempty layer needs exactly two cache tensors.')
            for tensor, shape in zip(entry, shapes):
                if (not isinstance(tensor, torch.Tensor) or tuple(tensor.shape) != shape
                        or tensor.dtype != parameter.dtype or tensor.device != parameter.device
                        or not bool(torch.isfinite(tensor).all())):
                    raise ValueError('A cache tensor has the wrong shape, dtype, device or finite values.')

    def _validate_input(self, points):
        parameter = next(self.model.parameters())
        if (not isinstance(points, torch.Tensor) or points.ndim != 3
                or points.shape[0] != self.batch or points.shape[2] != 2
                or points.dtype != parameter.dtype or points.device != parameter.device
                or not points.is_floating_point() or points.is_complex()
                or not bool(torch.isfinite(points).all())
                or bool((points.abs() > 1).any())
                or self.offset + points.shape[1] > 8):
            raise ValueError('Supply finite normalized B×T×2 points with matching dtype/device and at most eight global positions.')

    def append(self, points):
        """Return this chunk's logits, including B×0×10 for an empty chunk.

        Check identities, shapes and every batch row first. Stream into cloned
        state. Commit only after all produced logits and caches are finite.
        """
        self._check_model()
        self._validate_input(points)
        self._validate_cache(self._cache, self.offset)
        if points.shape[1] == 0:
            return points.new_empty((self.batch, 0, 10))
        with torch.inference_mode():
            logits, cache = self.model.stream(points, list(clone_cache(self._cache)), offset=self.offset)
        new_offset = self.offset + points.shape[1]
        new_cache = clone_cache(cache)
        self._validate_cache(new_cache, new_offset)
        if not bool(torch.isfinite(logits).all()):
            raise ValueError('The model produced non-finite logits; request state was not committed.')
        new_points = points.detach().clone() if self._points is None else torch.cat((self._points, points.detach()), 1)
        self._cache, self._offset, self._points = new_cache, new_offset, new_points
        return logits

    def snapshot(self):
        self._check_model()
        self._validate_cache(self._cache, self.offset)
        digest = hashlib.sha256(b'' if self._points is None else self._points.cpu().contiguous().numpy().tobytes()).hexdigest()
        return Snapshot(self.request_id, self.model_id, self.basis, self.batch, self.offset,
                        digest, clone_cache(self._cache))

    def restore(self, snapshot):
        """Restore this request's genuine prefix; reject a donor before mutation."""
        self._check_model()
        if (not isinstance(snapshot, Snapshot) or snapshot.request_id != self.request_id
                or snapshot.model_id != self.model_id or snapshot.basis != self.basis
                or snapshot.batch != self.batch or isinstance(snapshot.offset, bool)
                or not isinstance(snapshot.offset, int) or not 0 <= snapshot.offset <= self.offset):
            raise ValueError('Snapshot request/model/basis/batch/offset identity does not match.')
        points = None if snapshot.offset == 0 else self._points[:, :snapshot.offset].detach().clone()
        digest = hashlib.sha256(b'' if points is None else points.cpu().contiguous().numpy().tobytes()).hexdigest()
        if digest != snapshot.prefix_digest:
            raise ValueError('The requested snapshot belongs to a different input prefix.')
        self._validate_cache(snapshot._cache, snapshot.offset)
        cache = clone_cache(snapshot._cache)
        self._cache, self._offset, self._points = cache, snapshot.offset, points

    def fork(self, branch_id):
        """The two branches share frozen weights and own distinct tensor storage."""
        self._check_model()
        self._validate_cache(self._cache, self.offset)
        branch = StrokeRequest(self.model, branch_id, self.batch, self.basis)
        if branch_id == self.request_id:
            raise ValueError('A fork needs a distinct branch identity.')
        branch._cache = clone_cache(self._cache)
        branch._offset = self.offset
        branch._points = None if self._points is None else self._points.detach().clone()
        return branch


def main():
    """A real saved model, two request lanes, a branch, and snapshot rewind."""
    torch.set_num_threads(1)
    model = load_fit('MAM-37')
    raw = torch.tensor([[38,100],[100,92],[88,77],[75,62],[50,46],[25,30],[12,15],[0,0]], dtype=torch.float32)
    points = (raw / 50 - 1).unsqueeze(0)
    request = StrokeRequest(model, 'handwriting-R')
    prefix = request.append(points[:, :3])
    saved = request.snapshot()
    branch = request.fork('handwriting-R-alternative')
    suffix = request.append(points[:, 3:])
    branch_suffix = branch.append(points[:, 3:])
    with torch.inference_mode():
        full = model(points, all_positions=True)
    continued = torch.cat((prefix, suffix), 1)
    torch.testing.assert_close(continued, full, atol=2e-5, rtol=2e-5)
    torch.testing.assert_close(branch_suffix, suffix, atol=0, rtol=0)
    request.restore(saved)
    torch.testing.assert_close(request.append(points[:, 3:]), suffix, atol=0, rtol=0)
    assert request.append(points[:, :0]).shape == (1, 0, 10)
    print('Maximum full/continued difference:', float((continued-full).abs().max()))
    print('Same-input branch and snapshot restore agree; empty suffix is safe.')


if __name__ == '__main__':
    main()
```

`StrokeRequest` binds actual architecture/parameter bytes, a nonempty request ID, batch size and the fixed eight-point feature basis. Before appending, it checks every batch row's finite normalized coordinates, dtype/device, shape and remaining global positions. It validates every cache pair against the current layer kind and offset. It then streams into deep-cloned state and commits only if both output and new state are finite. A failed input or failed computation leaves the original request untouched. An empty chunk returns a B×0×10 tensor and preserves its offset, instead of reaching `torch.stack([])`.

`snapshot` clones each tensor and records a prefix digest. Its public cache property returns another copy: frozen metadata alone would not make tensor storage immutable. `restore` validates request/model/basis/batch/offset, checks the actual prefix and clones the stored tensors before replacing the request's state. `fork` deep-copies state and prefix points into a distinct branch identity. Both branches share evaluated weights. Changing those weights or evaluation state mid-request is rejected.

This is a validated sequential adapter for the taught small 8-point model, not a concurrent multi-user serving manager, an authentication scheme or a format for any released Jamba cache class. Its snapshots are trusted in-process objects; editing private storage or constructing forged snapshots is outside the public returned-copy contract. The identity fingerprint binds pattern and parameter bytes; backend/source revisions must be recorded separately when that distinction affects the serving contract.

Running the program's no-training main demonstrates same-input full/chunk agreement, branch isolation, rewind and an empty suffix. Complementary checks cover all five saved causal models, two simultaneous rows, boundary 0/8, wrong identities/shapes/dtypes and atomic failures. For a production service, paging, allocation groups, scheduling, precision and prefix-reuse rules need their own implementation. The [vLLM design](https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/) explains those distinctions and marks some Mamba prefix support as work in progress; check actual installed support rather than assuming a design document means the optimization is available.

Keep one complete edited study case when comparing interventions.

[Visual H47 study-case]

Reset restores the entire stated default, including coordinate edits, selections, boundary and all flags. Restore-source changes only coordinates. A pin deep-copies every chosen input and intervention; further edits cannot alter it. The selected neural array loads only when the study is reached, stays bound to its requested identity and is validated before inference. Loading failure and retry preserve the current input rather than substituting an old model.

## 11. How do other hybrids change the information routes?

We have now distinguished state updates, addressing, routing and request ownership. A different hybrid family can change one of these routes rather than merely changing Jamba's name.

[Visual H48 alternative-routes]

### Reuse parameters at several depth positions: Zamba and Zamba2

[Zamba](https://arxiv.org/html/2405.16712v1) repeatedly invokes a shared attention/MLP module along a Mamba backbone. The module receives the current residual representation concatenated with the original input embedding. “Shared” describes reused parameters across depth; it does not mean attention sees only every sixth input token. Every invocation still performs its operation.

Could shared projection weights alone justify sharing its computed keys?

[Visual H49 shared-weight-counterexample]

The displayed identity projection sends [1,0] to [1,0] and [0,1] to [0,1]. Those are different keys despite identical weights. Reusing one invocation's bank for the other changes the function unless the architecture explicitly defines that sharing during training and inference. The [Zamba2 card](https://huggingface.co/Zyphra/Zamba2-7B) adds Mamba-2, two alternating shared blocks, depth-specific low-rank adapters and RoPE in shared attention. Check which parameter and cache contracts are actually tied.

### Bound direct reads with a window: Griffin and Samba

The already taught fixed-window view in §5 shows why [Griffin](/learn/path/full-curriculum/long-context-sequence-models-transformer-xl-griffin-perceiver?module=deep-learning-fundamentals) and [Samba](https://arxiv.org/html/2406.07522v1) can limit direct attention storage. Griffin combines a gated linear recurrence with local attention; Samba combines Mamba, sliding-window attention and separate FFNs. Outside the window, information must be carried through state or later representations. “Can continue processing” differs from “can recover every arbitrary distant detail.” Their reported generalization/passkey experiments have specific data and training conditions.

### Fuse branches within a layer: Hymba

Serial composition feeds a first operation's transformed representation into a later operation. [Hymba](https://arxiv.org/html/2411.13676v1) instead sends the same layer input to parallel attention and SSM branches, normalizes/rescales the results, then combines them. It also explicitly uses local/global attention, cross-layer K/V sharing and learned prefix meta tokens. Those tokens provide learned initialization, not newly retrieved external facts. Parallel fusion, weight tying and explicit cache sharing are three separate choices.

### Deeper: a different memory update can change the hybrid itself

Recent significant examples extend the information-route vocabulary. [Nemotron-H](https://research.nvidia.com/labs/adlr/nemotronh/) uses Mamba-2/attention/MLP layouts. The [Qwen3-Next80B-A3B card](https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct) specifies Gated DeltaNet, gated attention and MoE; its linear/full-attention layout and active expert counts belong to that release, not the original Jamba configuration. [Kimi Linear](https://arxiv.org/html/2510.26692v1) combines three KDA layers with an MLA layer in its described repeating layout. Our stored Mamba arrays are not numerical oracles for any of these different operators.

Why does a fine-grained forgetting gate need a precise position in a matrix-memory update?

[Visual H50 diagonal-order]

S has key-feature rows and value-coordinate columns. A unit key k reads kᵀS; a rank-one correction changes the state toward a supplied message v. A diagonal forgetting gate scales feature rows unequally. In the displayed example, k=[1/√2,1/√2], v=[2,−1], β=0.5 and gate coefficients [0.25,0.75]. Applying the correction to the forgotten state gives a different old-state transition from forgetting after the correction. Both comparison paths add the exact same new write βkvᵀ; the maximum cell difference is 0.5.

\[
S_{\mathrm{new}}=(I-\beta kk^\top)\operatorname{diag}(\alpha)S+\beta kv^\top.
\]

A scalar gate αI commutes with the correction, while a general unequal diagonal gate does not. Changing the order in code can therefore silently implement a different model. This is the specific old-state order in the inspected KDA treatment, not an instruction to replace every earlier DeltaNet implementation. The [linear-attention update lesson](/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals) teaches the underlying associative/delta memory; [MLA](/learn/path/full-curriculum/multi-head-latent-attention-mla?module=deep-learning-fundamentals) owns the distinct remaining attention branch.

[Granite4.0 documentation](https://www.ibm.com/granite/docs/models/granite4-0) also distinguishes hybrid dense, hybrid MoE and traditional models. Organization/family names do not determine every member's mixer. The useful research question is which information update and read each concrete architecture defines, followed by matched actual evaluation conditions—not a family-name quality ranking.

## 12. How would you decide whether a hybrid helps your workload?

The real classifier and differing architectures give us mechanisms, not a universal deployment winner. Which experiment would test the information your application needs?

[Visual H51 application-interventions]

For incident reports, hold the symptom narrative fixed and change only a part number; ask for that component and its evidence location. Then keep identifiers fixed and change the order of a diagnosis and later correction; ask for the currently supported conclusion. Add near-matching distractors and absent-evidence questions. These isolate address-sensitive retrieval, evidence integration and an appropriate no-evidence response rather than treating all long-document questions as one task.

For scientific notebooks, distinguish an early parameter setting from the later superseding value and cite the relevant record. Include unrelated experiments that reuse the same parameter name. For handwriting, compare changes to an early turn with changes to the closing stroke under fixed frozen weights. These are applications to investigate: the small digit study did not measure language-model notebook reasoning. Exact auditable identifiers and quantities may be better served by external structured retrieval or a database rather than unaided neural regeneration.

Define answer correctness, citation accuracy, conflicts and absence before evaluating. Independently vary prompt length, evidence position, number of relevant records and distractor similarity. A verbatim passkey is one useful ability, not a complete document-reasoning evaluation. Compare with a simpler model or retrieval baseline under the resource constraint you actually care about.

### Use the ordinary released-model library route deliberately

The complete deployment program handles the checkpoint/model revision, tokenizer, prompt, generated-token accounting and CUDA resource assumptions separately from the scratch model.

```python
"""Optional large-model example, not executed by the lesson author.

Requires a compatible CUDA/PyTorch/Transformers/Accelerate installation and the
Mamba and causal-convolution kernels appropriate to it. Provision all model
weights, request caches and workspaces before attempting this program.

Example after resolving an actual revision:
  python deployment_example.py --model ai21labs/Jamba-v0.1 --revision COMMIT_HASH \
      --prompt-file prompt.txt

Replace COMMIT_HASH with the exact model repository revision you inspected.
Use --chat only for an instruction model whose tokenizer has a chat template.
"""
from pathlib import Path
import argparse
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--model',required=True)
    parser.add_argument('--revision',required=True)
    parser.add_argument('--prompt-file',type=Path,required=True)
    parser.add_argument('--chat',action='store_true')
    parser.add_argument('--max-new-tokens',type=int,default=64)
    args=parser.parse_args()
    if args.max_new_tokens<1:parser.error('Output token budget must be positive.')
    if not torch.cuda.is_available():parser.error('This example requires provisioned CUDA devices.')
    prompt=args.prompt_file.read_text(encoding='utf-8')
    tokenizer=AutoTokenizer.from_pretrained(args.model,revision=args.revision,trust_remote_code=False)
    if args.chat:
        if not tokenizer.chat_template:parser.error('This tokenizer has no chat template.')
        prompt=tokenizer.apply_chat_template([{'role':'user','content':prompt}],
            add_generation_prompt=True,tokenize=False)
    inputs=tokenizer(prompt,return_tensors='pt',add_special_tokens=not args.chat)
    model=AutoModelForCausalLM.from_pretrained(args.model,revision=args.revision,
        trust_remote_code=False,dtype=torch.bfloat16,device_map='auto',use_mamba_kernels=True)
    limit=getattr(model.config,'max_position_embeddings',None)
    input_tokens=inputs['input_ids'].shape[1]
    if limit is not None and input_tokens+args.max_new_tokens>limit:
        parser.error(f'Input plus output budget exceeds the configured {limit} token limit.')
    device=model.get_input_embeddings().weight.device
    inputs={name:tensor.to(device) for name,tensor in inputs.items()}
    model.eval()
    padding_id=tokenizer.pad_token_id
    if padding_id is None:padding_id=tokenizer.eos_token_id
    with torch.inference_mode():
        generated=model.generate(**inputs,max_new_tokens=args.max_new_tokens,
            do_sample=False,use_cache=True,pad_token_id=padding_id)
    continuation=generated[0,input_tokens:]
    print(f'Input tokens: {input_tokens}; generated tokens: {len(continuation)}')
    print(tokenizer.decode(continuation,skip_special_tokens=True))

if __name__=='__main__':main()
```

Its `AutoTokenizer` and model/generation calls select the release's implemented normalization, expert dispatch and cache classes. The scratch PenDigits network uses ordinary tensor tools to expose its own mechanism; it cannot validate arbitrary foundation-model outputs. The large-model program remains unexecuted here and requires suitable model storage, CUDA and kernels. Verify a resolvable exact ID/revision, actual optional kernel path, chosen dtypes/quantization and backend support before interpreting it as a working deployment for your hardware.

Record GPU model/count, software revisions, precision, batching, cold versus warm load, input/output lengths and sampling settings. Measure time to first token, per-token decoding time, total latency, peak memory and concurrent requests while meeting a latency limit. Equal total parameters, active parameters, training tokens and serving cost are different comparisons. No invented relative-compute curve replaces those measurements.

For fine-tuning, inspect the actual module names before selecting adapter targets. Attention projections, recurrent input/timestep/output projections and FFNs offer different adaptation routes. Attention-only adaptation is a valid restricted experiment; broader targets cost more and need held-out comparisons, including long-context retention. There is no universal rule that a recurrent branch needs twice the learning rate or a special clipping threshold. The useful decision sequence is: what information must survive → which operation exposes its route → which allocation/work grows → whether the serving state is correct → whether task improvement justifies the total cost.

## 13. Practice, independent reproduction and the next question

Attempt the changed cases below before opening their hints or solutions. They test whether you can carry the mechanism to new inputs instead of memorizing the examples. Questions 1–6 emphasize the core computation;7–10 extend the architectural and engineering decisions.

### 1. An identical summary, a different answer

With \(\lambda=1/2\), do \([1,4,2]\) and \([5,2,2]\) end at the same summary state? The labels are A, B, C. For query A, use attention weights proportional to \([4,1,1]\). Compute both attention reads and explain what this proves.

<details><summary>Hint</summary>
Unroll the numerator to \(\frac14v_1+\frac12v_2+v_3\). The normalizer is the same for equal sequence lengths.
</details>
<details><summary>Solution</summary>
Both numerators are 4.25 and both normalizers are 1.75, giving 17/7. Attention gives \((4+4+2)/6=5/3\) for the first sequence and \((20+2+2)/6=4\) for the second. This summary cannot distinguish these histories; separate keyed values can. Neither attention result is guaranteed to equal its label-A value, and the example does not prove that all recurrent states have this collision.
</details>

### 2. A different cache budget

A model has 24 layers, six using full attention. Batch size is two, with four KV heads of width 64 and two-byte K/V storage. At 8,192 tokens, calculate K/V bytes. Then double only the sequence length. Which other model information would be needed to calculate total request state?

<details><summary>Hint</summary>
Multiply batch, attention layers, tokens, two banks, KV heads, head width and bytes per scalar.
</details>
<details><summary>Solution</summary>
The count is \(2\cdot6\cdot8192\cdot2\cdot4\cdot64\cdot2=100,663,296\) bytes, or 96 MiB. Doubling context gives 192 MiB. Recurrent-layer count, expanded/state dimensions, convolution history layout and their dtypes are needed for the remaining persistent state. Allocator overhead, weights and temporary memory are additional concerns.
</details>

### 3. Repair the residual

An implementation uses \(x_{\mathrm{next}}=x+\mathrm{FFN}(\mathrm{Norm}(x+\mathrm{Mix}(\mathrm{Norm}(x))))\). Explain the missing path. In a scalar example with \(x=2\), mixer output 3 and FFN output 4, compare it with the intended two-residual layer.

<details><summary>Hint</summary>
Name the intermediate value after the mixer addition before writing the second addition.
</details>
<details><summary>Solution</summary>
The first intermediate value is \(u=2+3=5\). The intended result is \(u+4=9\). The displayed implementation returns \(2+4=6\), so the mixer contribution lacks its direct residual path into the final output. The FFN still depends on it, but that is a different function.
</details>

### 4. Where did the missing probability mass go?

Four router probabilities are \([0.4,0.3,0.2,0.1]\). Top-2 outputs are \([5,0]\) and \([0,5]\). Compute the retained-probability mixture and the renormalized mixture. If only the third expert's output changes, which mixture changes?

<details><summary>Hint</summary>
The selected mass is 0.7. Selection and score computation are held fixed.
</details>
<details><summary>Solution</summary>
Retained mixing gives \([2,1.5]\). Renormalized mixing gives \([20/7,15/7]\). Neither changes when only an unselected expert's output changes, since that output is not evaluated in the mixture. Changing its router score is different and can affect the retained weights even before selection changes.
</details>

### 5. A correct final label hides a cache bug

The model returns digit zero both before and after its convolution history is cleared mid-request. A teammate concludes that convolution history can be discarded. Give a concrete verification strategy and a null case where clearing state really has no effect.

<details><summary>Hint</summary>
Compare numeric outputs at every position under the same weights and inputs, not just an argmax.
</details>
<details><summary>Solution</summary>
Compare full-sequence logits with correctly carried streaming logits, then compare the damaged branch. Check more than one input and inspect the point immediately after the boundary. Intermediate differences or probability changes refute equivalence even when the final class stays zero. Clearing an already-empty cache before the first token is a true null; clearing after the last token cannot alter already-produced outputs. These nulls do not justify clearing a nonempty midstream cache.
</details>

### 6. Choose without looking at the assessment answers

Two candidate models have validation cross-entropies 0.12 and 0.15; their assessment error counts are 50 and 30. Your declared selection rule was lowest validation cross-entropy. Which candidate is selected, and what do you do with the second candidate's better assessment count?

<details><summary>Hint</summary>
Separate an honest report from a new selection decision.
</details>
<details><summary>Solution</summary>
Select the first candidate under the declared rule. Report both assessment results as part of the planned comparison, including the reversal. Do not relabel the second as the validation-selected winner. If the reversal motivates a new selection rule or training experiment, develop it using development evidence and evaluate the resulting decision with an independent assessment protocol.
</details>

### 7. Shared weights do not guarantee shared keys

A shared key projection is the identity. It is called at two depths with vectors \([1,0]\) and \([0,1]\) for the same token. Can the two invocations use the same stored key without changing either computation? What extra design would make cache sharing legitimate?

<details><summary>Hint</summary>
Apply the projection before arguing from parameter identity.
</details>
<details><summary>Solution</summary>
The keys are \([1,0]\) and \([0,1]\), so replacing one with the other changes its attention scores. Explicit architectural sharing could define both layers to consume a key bank generated by a designated layer, with that rule used during training and inference. That is a different contract from merely tying projection weights.
</details>

### 8. Active weights and stored weights

A toy network has eight FFN positions. Four are dense; four have four experts and select two. Each SwiGLU expert has model width 16 and intermediate width 32. Calculate total FFN parameters, active FFN parameters for one token, and the corresponding all-dense total.

<details><summary>Hint</summary>
One expert has three matrices, each with \(16\cdot32\) entries.
</details>
<details><summary>Solution</summary>
One expert has 1,536 parameters. Stored FFN parameters are \((4+4\cdot4)1536=30,720\). Active FFN parameters are \((4+4\cdot2)1536=18,432\). Eight dense FFNs have 12,288. Sparse selection increases the parameter pool while limiting, rather than eliminating, extra work. Router and mixer parameters are excluded.
</details>

### 9. Window the attention

Replace every full-attention layer by a window of 512 positions. A query asks for an identifier introduced 10,000 positions earlier. Explain what information routes remain and why the cache can be bounded without proving the answer will be correct.

<details><summary>Hint</summary>
Direct access to a key is different from information carried forward in hidden representations.
</details>
<details><summary>Solution</summary>
The old identifier's original key lies outside every individual attention window. Its information could persist through recurrent state or be copied into later representations and relayed through layers. Those routes may or may not preserve enough detail. With fixed width and state size, each layer's window cache and recurrent buffers have bounded size, but that storage bound is not a guarantee of arbitrary exact recall.
</details>

### 10. Design a useful hybrid experiment

You want to answer questions about a laboratory notebook. Design two interventions that distinguish identifier retrieval from combining evidence across a sequence, and name the measurements required to decide whether a hybrid is useful.

<details><summary>Hint</summary>
Change one explanatory factor at a time. Include questions whose answers are absent.
</details>
<details><summary>Solution</summary>
For retrieval, change one experiment's identifier or final parameter value while preserving the surrounding narrative and add near-matching distractor identifiers. For sequence integration, reorder a superseded setting and its correction, or move the relevant evidence across several separated entries while holding identifier vocabulary fixed. Score correct answers, evidence citations and appropriate no-evidence responses. Measure TTFT, decode time, total latency, peak memory and concurrency at a recorded model/software/hardware configuration. Compare with a simpler model or structured retrieval baseline under the same task and resource constraints.
</details>

### 11. Branch a request without aliasing its state

Snapshot a MAM prefix after point three. Fork two distinct request IDs, append a different fourth point to each, and then restore the original request to its snapshot. Explain which tensors must have distinct storage, which objects may be shared, and how you would detect a changed model or wrong prefix before any mutation.

<details><summary>Hint</summary>
Separate the evaluated parameter tensors from each request's H, projected convolution history, K, V and processed input prefix. An assignment of a tensor reference is not a clone of its storage.
</details>
<details><summary>Solution</summary>
The two M layers each need independent H and projected-history tensors; the A layer needs independent K and V banks. Each branch also retains independent processed points and offset metadata. Frozen evaluated model weights may be shared. Appending to branch one must leave branch two's full tensor values and prefix unchanged; compare snapshots and tensor storage addresses. The adapter validates its parameter identity, request ID, fixed input basis, batch, offset and actual prefix digest before restore, validates every cache shape/dtype/device, and commits a cloned append only after finite output and state are produced. The third-point snapshot restores recurrent state; merely truncating K/V is insufficient. A wrong prefix, changed parameters, ninth point or nonfinite later batch row must be rejected with the original state unchanged. Use the returned-copy public snapshot contract; this is not an adversarial serialization format.
</details>

### Foundations: two complementary explanations

- [Dive into Deep Learning: queries, keys and values](https://d2l.ai/chapter_attention-mechanisms-and-transformers/queries-keys-values.html). Read the record/query example, then map its weighted read to §1. It offers a second route to the intuition behind addressing before the matrix equation.
- [Aurélien Géron: state-space models appendix](https://ageron.github.io/homlp/HOMLP_Appendix_E.pdf). The author-hosted appendix builds the linear state-space foundation and explains the selective Mamba components near pages29–33. Pair it with §3's actual state cells and with the linked full SSM lesson. This free appendix complements the attention treatment; it does not validate the local handwriting experiment.

### References and other ways to learn


- **Architecture and evidence:** [Lieber et al., Jamba](https://arxiv.org/html/2403.19887v1). Start with §2 and the actual release shape in §3; then read the ratio, format-following and normalization investigations in §6. The authors distinguish measured behavior from their induction-head hypothesis.
- **Scale and serving:** [Jamba-1.5 technical report](https://arxiv.org/html/2408.12570v1). §§2–3 explain the larger configuration, ExpertsInt8 and activation-range issue; §§5–6 explain training stages and evaluation. Read the hardware and output-length conditions beside throughput figures.
- **Implementation reference:** [Hugging Face Jamba documentation](https://huggingface.co/docs/transformers/model_doc/jamba) and [model source](https://github.com/huggingface/transformers/blob/main/src/transformers/models/jamba/modeling_jamba.py). Follow the two residual additions, normalized timestep/B/C features, selected router weights and distinct cache operations. Names and kernel APIs can change between revisions.
- **Data and independent reproduction:** [UCI PenDigits](https://archive.ics.uci.edu/dataset/81/pen+based+recognition+of+handwritten+digits), by E. Alpaydin and F. Alimoglu, [DOI](https://doi.org/10.24432/C5MG6K). The original names file explains spatial resampling and the writer-disjoint official assessment set. The accompanying files retain attribution and the CC BY 4.0 source license.
- **A guided video course:** [Build Long-Context AI Apps with Jamba](https://www.deeplearning.ai/courses/build-long-context-ai-apps-with-jamba/), DeepLearning.AI with AI21, taught by Chen Wang and Chen Almagor. The verified course listing describes nine video lessons, architecture, document prompting, tool calling and context/RAG applications. Its listing was reviewed; the videos and notebooks were not watched or executed for this lesson. Use it for an application-oriented second explanation; access and hosted APIs may require an account.
- **Alternative design explanations:** [Zyphra's training cookbook](https://www.zyphra.com/our-work/the-zyphra-training-cookbook) explains the rationale for shared blocks; pair it with [Zamba](https://arxiv.org/html/2405.16712v1) and the [Zamba2 card](https://huggingface.co/Zyphra/Zamba2-7B). [Samba](https://arxiv.org/html/2406.07522v1) and [Hymba](https://arxiv.org/html/2411.13676v1) expose different choices of locality and within-layer fusion.
- **Serving-state design:** [vLLM hybrid KV cache manager](https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/). Useful after the cache investigation; it shows why allocator groups, padding and prefix-reuse rules cannot all be copied from a homogeneous attention stack.
- **Significant later architecture examples:** [Nemotron-H's official report](https://research.nvidia.com/labs/adlr/nemotronh/) gives actual layout and evaluation conditions; [Qwen3-Next's official card](https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct) specifies its released Gated DeltaNet/gated-attention/MoE design; [Kimi Linear](https://arxiv.org/html/2510.26692v1), especially its architecture/update sections, gives the fine-grained KDA forgetting order. Read these after §11, keeping their operators and reported evidence separate from Jamba and the local arrays. [Granite4.0's architecture table](https://www.ibm.com/granite/docs/models/granite4-0) illustrates why one family label is insufficient to infer every member's architecture.

### Build and reproduce

Keep the five complete programs together for the stated imports. `hybrid_mechanisms.py` runs the scalar memory/storage/router calculations without training. `stroke_models.py` defines the scratch model, data loader and optional training entry point; `inspect_stroke.py` reads its saved fits without refitting. The additional `hybrid_cache_tools.py` imports that same model and validates same-input continuation, snapshot, fork and restore. `deployment_example.py` is the separate, unexecuted large-model library route.

Use the retained `pendigits.tra`, `pendigits.tes` and `pendigits.names` with `data-provenance.md` for data attribution and selection details. `stroke-fits.npz` contains all six saved fits; `stroke-results.json` contains complete outcomes and histories. Their original bytes, epochs and error counts are retained. The selected browser model arrays are derived representations of the five neural fits, not replacements for the reproducible native checkpoint. Read the files and measured-output claims before invoking a training entry point; training again is a new experiment.

[Download index hybrid-files]

### What to learn next

The next topic in this module is [Titans: Multi-Memory Architecture](/learn/path/full-curriculum/titans-multi-memory-architecture?module=deep-learning-fundamentals). Carry forward the questions learned here: what each memory stores, what updates it, how a read is performed, and what must be preserved when processing the next part of a sequence.

