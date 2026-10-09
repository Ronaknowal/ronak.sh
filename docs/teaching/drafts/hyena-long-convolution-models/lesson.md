# Hyena & Long Convolution Models

**Explore as you read.** Change a signal, filter or gate and follow its delayed contributions. Compare causal and circular outputs, carry recurrent state across a new chunk boundary, and edit real DNA symbols to inspect a fixed classifier. Use the resulting paths, states and scores to distinguish future leakage, lost history and deliberate approximation.


A short convolution asks what happened nearby. A long convolution lets a distant event still contribute to what happens now. Hyena adds a further choice: the input controls what gets transmitted through that long filter and how the receiver uses it.

Imagine a sensor that produces a sharp pulse. A filter can make that pulse leave a fading echo. Now imagine a sequence of symbols in which some events are useful and others should be suppressed. A fixed echo pattern cannot make that decision by itself. Gates derived from the symbols supply the missing input dependence. Hyena combines these operations into a sequence mixer that can process a whole sequence with fast convolution algorithms.

The preceding [xLSTM lesson](/learn/path/full-curriculum/xlstm-extended-lstm?module=deep-learning-fundamentals) built a memory state and asked how to read it. Here we start from the **influence of an earlier position on a later position**. This change in viewpoint reveals both the appeal of long convolutions and a subtle problem: a fast whole-sequence computation does not automatically provide cheap one-token-at-a-time generation.

**Your first pass:** follow §§1–7, then try practice 1–6. You should be able to compute a causal convolution, identify circular wraparound, explain a gate-filter-gate block, and interpret the real sequence experiment. §8 develops streaming and recurrence extraction; §9 connects modern variants. Those branches and practice 7–10 provide the deeper route. You need weighted sums, matrix shapes and the idea of training by reducing a loss. We introduce the Fourier and signal-processing vocabulary locally.

## 1. Three questions about a long sequence

What does remembering mean here? Compare copying a known offset with finding a matching key.

**Figure H01 — Two kinds of “remember.”** Show a fixed-delay conveyor carrying `4,7,2` into three predetermined output slots beside a key-addressed request with rearrangeable `A→7, B→2` pairs. Highlight that changing pair order changes the relevant distance in the second task. This is a task diagram, not a measured model result.

In the fixed-delay drawing each input has a predetermined destination. The query B selects B:2 even if its position changes. Circles hold values; rounded rectangles perform operations. Cyan marks supplied inputs, amber learned parameters, violet computed values, grey forward arrows and dashed orange backward paths. Numeric grids use amber for positive, blue for negative and neutral for zero; white outlines mark a traced element.

Suppose a model sees `A 7 B 2 … B` and should answer `2`. The last symbol must identify which earlier association matters. Contrast that with copying `4 7 2` after exactly three time steps: a fixed delay is sufficient for the latter. Both involve distant information, but only the first requires choosing an address from the content.

Sequence mixers make different tradeoffs among three questions:

| Question | What it means | A concrete diagnostic |
| --- | --- | --- |
| Can information travel far? | An old input has a computational path to a new output. | Place a nonzero input far back and inspect its contribution. |
| Can the input change which information matters? | The mixing weights depend on the sequence being processed. | Change a key or a gate while keeping distance fixed. |
| Can the computation be evaluated efficiently? | The algorithm avoids unnecessary work or storage. | Derive the operations actually performed, then measure a specified implementation. |

Hyena’s design joins long filters, input-dependent gates and fast convolution. These are properties of its mechanism; whether training learns a useful solution is a separate empirical question. [The original paper](https://arxiv.org/html/2302.10866v2) used associative recall and other small controlled tasks to guide its design before studying language and vision.

## 2. A convolution is a ledger of delayed contributions

The key example separated distance from selection. First build the distance rule.

How can an old number contribute to a new output? A lag is the number of positions between sender and receiver.

**Figure H02 — Echo ribbons.** Put input pulses on a horizontal position axis; each pulse emits a scaled copy of the filter. At output position 2, stack the three signed contributions, with labels `3`, `1`, `0.25`. An aligned table supplies the exact values. A pulse ribbon should not imply a physical time unit: these are sequence positions and dimensionless values.

A unit pulse at0 creates four echoes: 1 now, .5 one position later, .25 two later and .125 three later. The second drawing follows our running input `[1,2,3,4]` into receiver2. Its incoming products .25,1,3 add to4.25. Positions before the input begins supply zero. These are dimensionless sequence values, not seconds.

Let $u_t$ be the input at position $t$, starting at zero. Let $h_r$ be the filter coefficient for a **lag** of $r$ positions. The causal output is

\[
y_t=\sum_{j=0}^{t}h_{t-j}u_j
    =h_0u_t+h_1u_{t-1}+\cdots+h_tu_0.
\]

“Causal” means the output at $t$ uses no input after $t$. “Filter” means the collection of coefficients. The name **impulse response** describes the same object from a useful experiment: put a single unit pulse at $u_0=1$, followed by zeros, and the output is $h_0,h_1,h_2,\ldots$. The filter is the echo of that pulse.

Take $u=[1,2,3,4]$ and $h=[1,0.5,0.25,0.125]$. At position 2, the current input contributes 3, the previous input contributes $0.5\times2=1$, and the oldest input contributes $0.25\times1=0.25$. The total is 4.25.

| Position $t$ | Current-to-oldest contributions | $y_t$ |
| --- | --- | ---: |
| 0 | $1\times1$ | 1 |
| 1 | $1\times2+0.5\times1$ | 2.5 |
| 2 | $1\times3+0.5\times2+0.25\times1$ | 4.25 |
| 3 | $1\times4+0.5\times3+0.25\times2+0.125\times1$ | 6.125 |

Can the same rule be written as a matrix? Read one receiving row across sender columns.

**Figure H03 — Distance becomes a diagonal.** Label matrix rows as receiving positions and columns as sending positions. Use one pattern per lag, show the upper triangle as forbidden future access, and trace the lag-2 diagonal back to its filter coefficient. Keep signed values visible when later examples use negative coefficients.

Row0 can see only sender0. Row2 has coefficients .25,.5,1, then a forbidden future cell. Equal distances repeat along diagonals: receivers2 and3 weight senders0 and1 by the same .25. The grid makes causality and weight sharing visible.

The equivalent matrix is

\[
\begin{bmatrix}1&0&0&0\\.5&1&0&0\\.25&.5&1&0\\.125&.25&.5&1\end{bmatrix}
\begin{bmatrix}1\\2\\3\\4\end{bmatrix}
=\begin{bmatrix}1\\2.5\\4.25\\6.125\end{bmatrix}.
\]

This is a **lower-triangular Toeplitz matrix**: “lower triangular” encodes causality; “Toeplitz” says each diagonal uses the same lag coefficient. Every pair of positions at distance 2 receives $h_2$. A length-$K$ finite impulse response, or FIR, filter additionally sets $h_r=0$ for $r\ge K$.

How does this relate to [Convolution & Pooling](/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals)? Neural libraries commonly store a cross-correlation kernel: tap0 multiplies the oldest item in a causal three-item window, tap2 the current item. Our lag array stores current first, so $h=[h_0,h_1,h_2]$ corresponds to library weight `[h2,h1,h0]`. Left-pad by2 and use no right-hand samples. For `[1,2,3]` with lag coefficients `[1,.5,.25]`, receiver2 is $.25(1)+.5(2)+1(3)=4.25$ in either representation. A flipped kernel or centered crop changes the operation; naming it convolution does not fix orientation.

For a length-$L$ filter applied to $L$ inputs, direct causal evaluation has $L(L+1)/2$ coefficient-input products per channel. With many channels and long sequences, that work matters. Yet the matrix contains extensive repetition. The FFT exploits this structure.

## 3. Why an FFT can compute the same sum faster

The matrix repeated one distance rule many times. Can a change of coordinates avoid repeating all those products? Begin with four samples; frequency labels describe patterns across them, not four token addresses.

**Figure H21 — The real four-sample Fourier basis.** Draw DC `[1,1,1,1]`, cosine `[1,0,-1,0]`, sine `[0,1,0,-1]` and Nyquist `[1,-1,1,-1]` with explicit sample indices.

DC gives a constant offset. Cosine and sine together describe amplitude and phase of one cycle; Nyquist alternates every sample. These four real patterns reconstruct `[1,2,3,4]` as `2.5 DC − cosine − sine − .5 Nyquist`. At the first position, `2.5−1−.5=1`; at the second, `2.5−1+.5=2`. Complex Fourier coordinates package that same information as `[10,−2+2i,−2,−2−2i]`, where $i^2=-1$. The conjugate entries represent one sine/cosine pair, not two independent real waves.

The discrete Fourier transform represents a finite signal using oscillating basis patterns. Think of changing coordinates: we can describe a sound by its samples over time or by the amplitudes and phases of its frequencies. We have not yet removed information.

What happens to the filter in these coordinates? Follow both arrays into matching frequency bins and then back to samples.

**Figure H22 — Transform, multiply and reconstruct.** Draw two forward transforms, a complex product at each shared frequency, inverse transform and causal crop.

Let P be the number of padded sample slots and m the frequency-bin index. For bins $a+ib$ and $c+id$, the product is $(ac-bd)+i(ad+bc)$. Multiplying only real parts is wrong. Under backward normalization, the forward DFT is $U_m=\sum_{t=0}^{P-1}u_t e^{-2\pi i mt/P}$ and the inverse divides by P. Substitute both forward sums into the inverse: the frequency sum vanishes unless $j+r=t$ modulo P, when it equals P. This leaves exactly modulo-indexed convolution. The theorem is algebra; FFT is the algorithm that reuses smaller transforms to compute those coordinates.

For two arrays padded to length $P$, the Fourier convolution theorem gives

\[
\operatorname{IFFT}\left(\operatorname{FFT}(u)\odot\operatorname{FFT}(h)\right).
\]

Here $\odot$ is elementwise multiplication. The forward transforms separate the oscillating components; multiplication applies the filter to those components; the inverse transform reconstructs samples. The FFT is an efficient algorithm for that coordinate change, with work proportional to $P\log P$.

Why would an exact coordinate change read the future? A finite Fourier transform joins the ends of its index range.

**Figure H04 — Make room for the tail.** Show an unpadded ring beside a padded straight strip. For the four-input example, ordinary convolution has seven output slots; using eight FFT slots is convenient. Color wrapped tail contributions separately. Do not draw Fourier bins as if they were token positions.

The straight drawing has seven independent positions. The circle has only four: tail4 is added to0, tail5 to1, tail6 to2. Cropping after that addition cannot undo the mix. Padding first gives the tail somewhere else to go.

There is a catch. A length-$P$ transform treats indices modulo $P$: values that run past the right edge wrap to the left. It naturally computes **circular convolution**. To recover ordinary linear convolution of lengths $L$ and $K$, choose $P\ge L+K-1$, pad both arrays with zeros, and keep the desired outputs. For causal sequence mixing, keep the first $L$.

The wrong $P=4$ computation for our example produces `[4, 3.875, 4.75, 6.125]`. Its first output is

\[
1\times1+0.5\times4+0.25\times3+0.125\times2=4.
\]

That first output already contains the future input 4. Changing only the final input from 4 to 8 changes the wrong first output from 4 to 6. In the correctly padded computation the first three outputs remain `[1,2.5,4.25]`.

### A complete numerical program

Install NumPy in your own environment with `python -m pip install numpy`, save this as `causal_fft.py`, and run `python causal_fft.py`. Both inputs and expected outputs are included.

```python
import numpy as np

def causal_fft(values, kernel):
    length = len(values)
    full_length = length + len(kernel) - 1
    fft_length = 1 << (full_length - 1).bit_length()
    product = np.fft.rfft(values, fft_length) * np.fft.rfft(kernel, fft_length)
    return np.fft.irfft(product, fft_length)[:length]

values = np.array([1., 2., 3., 4.])
kernel = np.array([1., .5, .25, .125])
direct = np.convolve(values, kernel)[:len(values)]
fast = causal_fft(values, kernel)
print(np.round(direct, 6))
print(np.round(fast, 6))
print(np.allclose(direct, fast, atol=1e-12))
```

The arrays both display `[1. 2.5 4.25 6.125]`, followed by `True`. The underlying floating-point arrays need not be bit-for-bit identical. In the saved calculation the first FFT output is `0.9999999999999996`. That numerical roundoff is distinct from the large semantic wraparound error above. Always pass the intended inverse-transform length, especially for odd sizes; make normalization conventions agree. The [PyTorch FFT documentation](https://docs.pytorch.org/docs/main/generated/torch.fft.rfft.html) explains normalization and device/dtype restrictions.

The four-position example is now complete. Try a fresh signed case `[2,-1,3,0,1]` with `[.5,1,-.25]`; comma-separated valid edits also change lengths.

**Investigation HA — Find the future leak.** Start with a fresh editable signal `[2,-1,3,0,1]` and filter `[0.5,1,-0.25]`. Edit the final input and compare which outputs actually change under direct, correctly padded FFT and intentionally circular computation. Repair the padding, then construct a different signed filter for which the circular result happens to agree at one output. Explain why one matching number does not establish causality. Enter a unit impulse, `[1]` identity filter or all-zero filter to test lag direction, identity and the null case.

**Investigation HA-padding — Compare the same signal in three computations.** Keep the edited state above; compare direct, padded FFT and circular outputs simultaneously, then pin the complete vectors before changing the last input.

## 4. Gates make the mixing depend on the input

A distance-only filter treats equally distant senders alike. How can a sender close its own route? Multiply its value before filtering, then let a receiver multiply what arrives.

**Figure H05 — The gate-filter-gate signal path.** Three parallel rails begin at the same input: `q`, `k`, `v`. Only `k×v` enters the long filter. The receiver multiplies by `q`. Show the short causal preprocessing separately from the long filter so that the number and role of each convolution remain visible.

The strips contain values v and sender coefficients k. The first ⊗ means coordinatewise multiplication, written $\odot$ below: a zero sender contributes nothing; a negative sender reverses sign. Σh adds delayed contributions. The second ⊗ uses receiver coefficient q. Follow the circuit downward; it is one channel, not yet the full network.

A useful basic Hyena block has three projected streams: $q$, $k$ and $v$, each shaped $L\times D$. Here $D$ is the channel width. These letters resemble attention’s query, key and value names, but the computation below contains no softmax and no pairwise query-key dot product.

For one channel,

\[
z_j=k_jv_j,\qquad r_t=\sum_{j\le t}h_{t-j}z_j,
\qquad y_t=q_tr_t.
\]

The sending gate $k_j$ changes what enters the filter. The receiving gate $q_t$ changes how the result is used. Gates can amplify or reverse sign; they are not automatically probabilities in $[0,1]$. A neural implementation derives them from the input using learned projections and small causal depthwise convolutions. “Depthwise” means each channel has its own short filter rather than mixing channels at that operation. Dense projections before and after it handle channel mixing.

Use the earlier $v=[1,2,3,4]$, filter $h$, sending gates $k=[1,0,-1,2]$, and receiving gates $q=[1,2,-1,0.5]$. Then

\[
kv=[1,0,-3,8],\quad h*(kv)=[1,.5,-2.75,6.625],
\quad y=[1,1,2.75,3.3125].
\]

At the last position the contributions before the receiving gate are $0.125+0-1.5+8=6.625$. The final factor 0.5 gives 3.3125. The zero gate suppresses the second value along this path; the negative gate reverses the third.

Which input contributes to a particular receiver? Hold the current gates fixed and trace a matrix cell.

**Figure H06 — A coefficient is three factors.** For each selected matrix cell, show receiving gate × distance coefficient × sending gate. One gate edit changes a row or column of this conditional matrix. Use a diverging signed scale, a numeric cell label and a contribution ledger. Row totals need not equal one.

For receiver3/sender2 the coefficient is $.5	imes.5	imes(-1)=-.25$. Multiply value3 to get−.75. Editing a receiver scales a row; editing a sender scales a column. Entries can be negative and need not sum to1.

We can expose every pairwise coefficient without using a dense matrix to run the block:

\[
H(q,k)=\operatorname{diag}(q)\,T_h\,\operatorname{diag}(k),
\qquad H_{tj}=q_t h_{t-j}k_j\quad(j\le t).
\]

For fixed $q,k,h$, this is linear in $v$. A complete block is nonlinear in its original input because the same input also changes its gates. Consequently the displayed matrix is neither the full input-output Jacobian nor a guaranteed causal explanation of the network’s final prediction. It describes a specific internal path with gates held fixed.

The following signed transfer case uses one shared state across its sender, receiver and matrix views, so combined edits remain meaningful.

**Investigation HB-sender — Change sending gates and values.** Edit the complete taught vectors; changing value length resizes all streams.

**Investigation HB-receiver — Change receiving gates and filter coefficients.** Follow the same transmitted values through the new final read.

**Investigation HB-matrix — Read one receiver and sender.** Select a row/column of the conditional grid and pin its complete state/output.

### Why “hierarchy” matters

What changes when another filter precedes the sending gate? An input can reach that gate through several intermediate positions.

**Figure H07 — Paths through an intermediate gate.** Trace two possible routes from source $j$ through intermediate $m$ to receiver $t$, then show the summed coefficient. Compare with the single-filter sandwich; do not present the two matrices as identical.

Each row is a path $j	o m	o t$. Multiply first filter φ, intermediate gate k, second filter h and receiver gate q along the row; add complete paths. A future sender has no legal rows. The picture uses φ and h; the general equation below calls the second filter ψ.

The general construction alternates filters and gates:

\[
z^{(0)}=v,\qquad z^{(n)}=x^{(n)}\odot(h^{(n)}*z^{(n-1)}),
\quad n=1,\ldots,N.
\]

The associated product is $D_{x^{(N)}}T_{h^{(N)}}\cdots D_{x^{(1)}}T_{h^{(1)}}$. Each additional stage introduces intermediate positions through which information can pass. With two stages,

\[
y_t=q_t\sum_{m\le t}\psi_{t-m}k_m\sum_{j\le m}\varphi_{m-j}v_j,
\quad
H_{tj}=q_t\sum_{m=j}^{t}\psi_{t-m}k_m\varphi_{m-j}.
\]

The sum over $m$ is the new feature: an input can reach the receiver through several intervening gates. Every path still goes forward in sequence order, proving causality if the gate-generating operations are also causal.

Terminology differs across descriptions. The original paper’s formal $N$-stage hierarchy counts alternating filter/gate stages. HyenaDNA’s common `order=2` implementation has three projected streams, two gates and one long convolution after their short preprocessing. In this lesson the practical model is explicitly a **one-long-filter Hyena-style block**, stacked twice. Inspect the actual equation or code rather than infer the computation from “order two.” [HyenaDNA’s method](https://arxiv.org/html/2306.15794v2) and [the authors’ standalone code](https://github.com/HazyResearch/hyena-dna/blob/main/standalone_hyenadna.py) show this convention.

**Investigation HB-hierarchy — Compare one filter with two.** You receive editable values `[2,-1,3,1]`, sending gates `[0.5,1,0,-1]`, receiving gates `[1,-0.5,2,1]`, and a signed filter `[1,-0.25,0.5,0]`. Inspect which outputs respond when the zero sending gate becomes one. Inspect the signed matrix and create a different arrangement that suppresses one sender while preserving another. Compare a preceding filter `[1,-0.5,0,0]` and reason about the new intermediate paths. Pin a complete baseline to compare later edits.

## 5. Generate the filter from position

Gates decide what to transmit. Their filter still needs a coefficient for every lag.

Could one small network describe many lag coefficients? Give each lag a coordinate and reuse the same weights. One learned decay number a per channel will be converted to a positive rate for its envelope.

**Figure H08 — A function becomes a strip of coefficients.** Feed lag coordinates `0,1,…,59` into one shared network and place its outputs along channel strips. Select one channel to show its raw network curve, positive decay envelope and product. Label whether these are initialized or fitted coefficients; use the saved actual fit for the latter.

Read the fixed ruler first. Nine features describe a lag; learned edges map them through32 sine units to16 raw channel values. A positive envelope multiplies each signed raw value. Its positive rate is $\operatorname{softplus}(a)=\log(1+e^a)$; any finite learned a gives a positive rate. The code evaluates this transform stably instead of overflowing for large a. The plot uses actual saved coefficients; block/channel selectors pick one fitted filter rather than edit a gate. Two such filters belong to the later two-block example.

An explicit length-$L$, $D$-channel filter stores $LD$ learned coefficients. An **implicit filter** instead learns a function whose input is lag and whose output is a vector of channel coefficients:

\[
h_r=\gamma_\theta(\operatorname{pos}(r))\odot w(r).
\]

The small neural network $\gamma_\theta$ shares parameters across positions. The window $w(r)$, often an exponential envelope, biases the filter’s range. A position representation may include the lag itself and sine/cosine features at several frequencies. A sine activation in the filter network makes oscillating and sharply varying filters easier to represent than an overly smooth initialization would suggest.

Our experiment fixes a reference length $L_{\rm ref}=60$, sets $s_r=r/59$, and uses

\[
\operatorname{pos}(r)=[s_r;(\sin(2\pi f s_r))_{f\in F};(\cos(2\pi f s_r))_{f\in F}],\quad F=\{1,2,4,8\},
\quad
h_r=W_2\sin(W_1\operatorname{pos}(r)+b_1)+b_2,
\]

followed by multiplication by $\exp[-s_r\operatorname{softplus}(a)]$, one decay rate per channel. The position vector has nine features. The network uses 32 hidden units and 16 outputs. Its learned count is $9\times32+32+32\times16+16+16=864$, including the 16 decay parameters. Producing all 60 coefficient vectors still requires evaluating 60 positions and storing their outputs; fewer learned parameters do not make that work disappear.

### A less obvious causality bug: moving the coordinate system

What breaks if that ruler stretches when an input grows? Compare the same old lag positions before changing the formula.

**Figure H09 — A ruler that must not stretch mid-read.** Align the same first four lag positions under the two coordinate conventions. Show the coefficient change at each shared lag, with a stable-reference ruler above both sequence lengths. A separate dashed region past the trained support marks a new extrapolation question, not a free extension.

The fixed curve always uses r/7. The rescaled curve uses r/3 for four positions, changing old coefficients. A growing prefix should reveal more coefficients on the same ruler, not rewrite earlier coordinates.

If a four-token prefix uses coordinates $r/3$, then the same prefix inside an eight-token sequence uses $r/7$, its filter changes when later tokens arrive. Correct FFT padding cannot repair that problem. A causal model must use the same lag interpretation for the same prefix.

For the illustrative function $h_r=e^{-s_r}\cos(2\pi s_r)$, using reference length 8 gives initial coefficients `[1,0.54049,-0.16722,-0.58693]`. Recomputing them with active length 4 gives `[1,-0.35827,-0.25671,0.36788]`. The first four coefficients differ by as much as 0.95481. Our implementation stores a fixed position grid and slices it for shorter inputs.

A filter function may be mathematically evaluable at longer lags, but those values were not necessarily trained. Extending a position buffer, changing frequency scales and continuing training are separate choices. Some official configurations also learn positional embeddings, adding length-dependent parameters. Read the chosen configuration before claiming that *all* parameters are independent of maximum length.

The exponential window is an inductive bias, not a proof that every fitted coefficient decreases monotonically. The network can oscillate or grow inside the envelope; some implementations add a nonzero envelope floor. A finite filter without decay is perfectly well-defined. The practical question is which initialization and parameterization let the model learn useful filters stably.

## 6. How the block learns

The fixed ruler made forward computation well-defined. A loss can now teach its parameters how to change.

How do coefficients learn? Switch briefly to two inputs so every gradient is visible by hand.

**Figure H10 — Follow one gradient to two coefficients.** Trace `loss → prediction error → weighted inputs → coefficient updates`, using the exact values above. The arrow labels distinguish the learning rate from a gate and a filter coefficient.

Current input2 is weighted by .5; previous input1 by .25. Their sum1.25 is below target2. The same error travels backward, multiplied by each coefficient’s own input. Dashed orange paths are gradients, not additional forward inputs. We return to the four-position gates afterward.

Start with one trainable filter and a transparent loss. For inputs `[1,2]`, filter `[0.5,0.25]`, and desired final output 2, the prediction is $2h_0+h_1=1.25$. Use half squared error:

\[
\mathcal L=\tfrac12(2h_0+h_1-2)^2=0.28125.
\]

The prediction error is $-0.75$. Each coefficient’s gradient is this error multiplied by the input it weights: $\nabla_h\mathcal L=[-1.5,-0.75]$. One gradient step with learning rate 0.1 gives `[0.65,0.325]`, prediction 1.625 and loss 0.0703125. A coefficient grows because doing so moves this prediction toward its target.

In a neural Hyena block, backpropagation follows the same chain through receiving gates, convolution, sending gates and the filter-generating network. FFT convolution is differentiable. A direct implementation and a correctly normalized FFT implementation must agree on the operation’s derivatives within numerical tolerance. The saved double-precision probe checks both outputs and gradients against an independently indexed direct sum.

### Follow every branch, not only the filter

The two-coefficient update explained one path. In the earlier gate example a loss reaches q,k,v and h separately. The labels dq,dk,dv,dh name derivatives with respect to receiver, sender, value and filter.

**Figure H23 — Four branches of the gated derivative.** Draw every forward multiply/sum and reverse path into receiver, sender, value and kernel.

Follow the orange arrows upward. The receiver multiply has two inputs, so its derivative must return to both. The filter sum returns one derivative for every transmitted value and one for every shared lag coefficient. The sender multiply then separates that transmitted derivative into value and sender-gate branches. Keeping just the value-mixing matrix discards two routes through the learned gates.

Let upstream derivative be $d_t=\partial\mathcal L/\partial y_t$, and define $g_t=d_tq_t$. The receiver derivative is $d_t r_t$. The transmitted derivative is $\partial\mathcal L/\partial z_j=\sum_{t\ge j}g_t h_{t-j}$; the filter derivative is $\partial\mathcal L/\partial h_r=\sum_{t\ge r}g_t z_{t-r}$. These correlations can be computed using reversed arrays and correctly aligned FFT convolution slices. Then $\partial\mathcal L/\partial k_j=(\partial\mathcal L/\partial z_j)v_j$ and $\partial\mathcal L/\partial v_j=(\partial\mathcal L/\partial z_j)k_j$. A local skip adds $b_{\rm skip}g$ to the transmitted derivative and contributes $\sum_t g_tz_t$ to its own derivative. Shared parameters sum contributions across examples as well as positions.

Return to `v=[1,2,3,4]`, `k=[1,0,-1,2]`, `q=[1,2,-1,.5]`, `h=[1,.5,.25,.125]`. Desired outputs `[0,0,0,2]` give half-sum squared loss5.642578125. The derivatives are dq=`[1,.5,-7.5625,8.6953125]`, dk=`[1.39453125,1.578125,-7.265625,2.625]`, dv=`[1.39453125,0,2.421875,1.3125]`, dh=`[14.5,.03125,-2.75,.65625]`. Sender1 is closed: dv1 is zero, yet dk1 is not. Changing its gate could open a useful path, so it still needs a gradient.

**Program gradient — Complete FFT VJP and ordinary autograd.** Show gated_convolution_gradients.py with Copy/Download; include all validation and native comparisons.

The complete program uses batch-first `(N,L,D)`, with sequence axis1 streams, `(K,D)` shared kernel and `(D,)` skip. It never forms a pairwise L×L grid. Forward snapshots own their arrays so caller edits cannot corrupt backward. Reverse the kernel to align the transmitted correlation at K−1; reverse the transmitted sequence to align the kernel correlation at L−1. If K>L, never-observed taps keep zero gradients without shrinking the parameter shape. The ordinary Torch route uses the same explicit FFT length and crop; autograd computes all reverse branches. Independent direct sums and central differences check signed gates, different lengths, null kernels and a closed sender. This float64 CPU implementation prioritizes a clear, efficient reference contract; a production dtype/device policy needs its own checks.

Where do those three stream derivatives meet? Trace one shared input through three small projections.

**Figure H30 — Shared input receives three gradient branches.** Draw X with two features, three2×2 learned matrices and the sum of the three returned input derivatives.

The amber grids are separate learned weights. Each forward projection creates a different stream; each orange path returns a derivative through its own weights. A conditional value-only map keeps only the v branch, while learned gates require all three.

If the streams share input X, $q=XW_q^T$, $k=XW_k^T$, $v=XW_v^T$ imply $dX=dqW_q+dkW_k+dvW_v$, before adding normalization, short-filter and residual derivatives. The runnable program checks this three-branch chain too. Reuse the graph accumulation already taught in [Backpropagation & Automatic Differentiation](/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals) and channelwise short-filter derivatives in [Depthwise Separable & Dilated Convolutions](/learn/path/full-curriculum/depthwise-separable-dilated-convolutions?module=deep-learning-fundamentals); the conditional matrix is not a substitute for that full graph.

## 7. A real sequence task: identify a splice boundary

What could we train the operator to decide? Switch from constructed numbers to an observed DNA window; first learn what the label means.

**Figure H11 — A DNA window around a boundary.** Show all 60 positions with the central divider, observed characters, and the three possible class directions. A compact ambiguity key appears where needed. Selecting a base must identify both its array index and its biological relative-position label.

EI marks entering an intron; IE marks leaving one. RNA processing removes the RNA intron and joins exons; it does not delete DNA. The observed window places its boundary between array29 and30. Output N means neither boundary, distinct from the input ambiguity N explained next.

A gene can be transcribed into an RNA molecule containing regions called introns and exons. RNA splicing removes introns and joins retained exons; alternative splicing can produce different mature RNAs from one gene. The DNA itself is not cut up by this RNA-processing operation, and introns need not be biologically useless. The [NHGRI RNA explanation](https://www.genome.gov/about-genomics/educational-resources/fact-sheets/ribonucleic-acid-fact-sheet) gives the biological background.

The historical [UCI Splice-Junction dataset](https://archive.ics.uci.edu/dataset/69/molecular%2Bbiology%2Bsplice%2Bjunction%2Bgene%2Bsequences) asks whether the central boundary in a 60-character DNA window is `EI` (exon to intron), `IE` (intron to exon), or `N` (neither). We use those explicit boundary directions. Some original metadata reverses the donor/acceptor names; we do not use the conflicting names to define the labels. The central boundary sits between array indices 29 and 30. Display positions as −30…−1 and +1…+30, with no fictitious middle base at zero.

The input alphabet is `A,C,G,T,D,N,R,S`. The last four symbols describe uncertainty among bases: `D` means A/G/T, `N` any of the four, `R` A/G, `S` C/G. They are not four extra chemical bases. We keep them as separate input symbols rather than invent a measured probability for the alternatives. A sequence symbol `N` is also distinct from the *output class* `N`.

### Separate the data roles before fitting

Before fitting, which records may influence the same evaluation? Duplicates and source prefixes can connect examples.

**Figure H12 — Keep connected records on one side.** Draw a source-prefix node joined to its windows, and a duplicate-sequence edge joining two source prefixes. Move the entire connected component into one of the three role lanes. Separately place the two conflicting records in a disclosed exclusion tray.

A and B are source-prefix groups. Their equal sequence a joins them. A row-only split could distribute related records across roles; the connected group must move as a unit. Exclude the stated conflict before assigning retained roles.

The source contains 3,190 rows and 3,005 distinct sequence strings. Two identical-input rows, source IDs 1022 and 1969, have conflicting labels; we exclude both from this exercise and disclose the decision. We keep the first occurrence of every other sequence, leaving 3,004 examples. Before splitting, we join source-record prefixes connected by an identical sequence, then keep every resulting group within one data role. This also keeps different windows from each observed source-record prefix together.

| Role | Rows | Source/duplicate-connected groups | Use |
| --- | ---: | ---: | --- |
| Fit | 2,128 | 1,008 | Update parameters. |
| Validation | 460 | 216 | Choose an epoch for each predeclared model. |
| Assessment | 416 | 216 | Report the selected models once. |

Exact source IDs, group assignments and class counts accompany the downloadable data. Distinct record names can still describe homologous biological sequences. This grouping addresses the relationships visible in the file; it does not establish independence across species, gene families or new patients. The assessment is a modest historical-data exercise, not a biological validation study or evidence of million-token performance.

### Train a model you can inspect

Where do gates and filters sit in an actual model? Follow its tensor widths and residual paths from token lookup to final class.

**Figure H24 — The complete two-block classifier.** Draw the eight-symbol lookup, changing widths, three short causal streams, gate/filter/skip operations and both residual paths.

Each symbol selects one row of an8×16 learned embedding table: sixty IDs become sixty16-feature vectors. For N examples the stream is `(N,60,16)`. The older code calls this axis `batch`; B below denotes an input FFT block size. LayerNorm prepares each position; a16→48 projection creates q,k,v, each width16. Three-tap causal filters process each channel independently. Multiply k and v, apply the generated long filter and a learned current-position skip, add these results, then multiply by q. A16→16 projection feeds the first residual add. A second LayerNorm branch expands16→32, applies exact GELU, contracts32→16 and adds another residual. Repeat this block twice and read position59 through a three-logit head.

The branch expression is $q\odot\{h*(k\odot v)+b_{\rm skip}\odot(k\odot v)\}$. The skip is immediate, not future access; only final softmax creates probabilities. The positional linear baseline instead uses60×8 one-hot features directly. Reuse the earlier [Normalization](/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals) and [Residual Connections](/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals) computations for the already taught layer updates; this program implements their composition with the new mixer.

Download [the complete training program](splice_models.py), [the data](splice.data) and [its original metadata](splice.names) into one directory. The program needs Python, NumPy, PyTorch and scikit-learn. In a fresh environment run:

```text
python -m pip install numpy torch scikit-learn
python splice_models.py
```

The retained run used Python 3.12.14, NumPy 2.3.5, PyTorch 2.14.0+cpu and scikit-learn 1.9.1, with two CPU threads. It trains four predeclared fits: a positional one-hot linear classifier with seed 29, gated sequence models with seeds 29 and 71, and an ungated sequence model with seed 29. All use Adam at learning rate 0.003, batches of 128, 80 epochs and gradient norm clipping at 1. The epoch with smallest validation cross-entropy is retained, with the earliest exact tie. The assessment data does not choose the epoch.

The positional linear classifier is a meaningful baseline: the target boundary is always at the same location, so a coefficient for “G at index 30” can be informative. The ungated model retains its nonlinear feed-forward blocks but sets the two mixing gates to one; it is **not a purely linear network**. Its otherwise retained projections include unused gate branches, so its nominal parameter count should not be read as equal effective capacity.

The training program contains data grouping, encoding, the filter network, FFT convolution, residual blocks, loss, optimizer, epoch selection, confusion matrices and saved weights. This is the core mixing function used there:

```python
def causal_convolution(values, kernel):
    # values: batch, length, channels; kernel: length, channels
    length = values.shape[1]
    size = 1 << (2 * length - 2).bit_length()
    spectrum = torch.fft.rfft(values, n=size, dim=1)
    filter_spectrum = torch.fft.rfft(kernel, n=size, dim=0)
    return torch.fft.irfft(
        spectrum * filter_spectrum[None], n=size, dim=1
    )[:, :length]
```

Padding is along the sequence axis, not the channel axis. The filter broadcasts across the batch. The full source imports `torch`; this excerpt belongs to that runnable program. It produces `splice-results.json` and `splice-fits.npz`, containing role IDs, validation histories, selected weights and logits. You can reproduce the experiment without downloading a large pretrained model.

### Read the actual outcome

Did this operator help on this task? Read the measured validation curves before comparing selected outcomes.

**Figure H13 — Learning curves with a decision point.** Plot the actual 80 validation cross-entropies for each predeclared fit, with the selected epoch marked. Use a common vertical axis with an optional detailed view; the assessment outcome is a separate table. Do not synthesize a smooth training curve or display assessment scores at every epoch.

All eighty validation losses appear for each fit. Its marked minimum selects an epoch; assessment never selects it. A larger model can do worse on a small fixed-location task, so keep the positional baseline.

| Model | Selected epoch | Validation errors / 460 | Assessment errors / 416 |
| --- | ---: | ---: | ---: |
| Positional linear, seed 29 | 42 | 32 | 30 |
| Gated Hyena-style, seed 29 | 11 | 45 | 40 |
| Ungated sequence model, seed 29 | 25 | 82 | 86 |
| Gated Hyena-style, seed 71 | 11 | 50 | 57 |

The positional baseline makes fewer errors than either small gated fit. That is an informative result: a fixed-location motif task can reward a direct representation. Gating helps relative to this ungated comparison, but changing seed also changes outcomes. These fits are not a universal ranking of linear classifiers, Hyena or other architectures.

For the gated seed-29 model, the assessment confusion matrix is:

| True \ Predicted | EI | IE | N |
| --- | ---: | ---: | ---: |
| EI | 76 | 3 | 6 |
| IE | 1 | 74 | 8 |
| N | 13 | 9 | 226 |

Rows reveal different errors: 9 of 85 EI examples, 9 of 83 IE examples and 22 of 248 N examples are misclassified. A single overall accuracy hides those denominators. A confidence value alone also does not establish calibration.

### Change a sequence and observe a hypothesis

What did a fixed model use? Change two observed symbols and compare all three probabilities.

**Figure H14 — An observed sequence and a model counterfactual.** Align the original and edited 60-character strings, mark exactly the two changed bases and show three aligned probability bars before/after. Keep the original observed label on the original row only. A text table contains the logits and probabilities.

Only GT at array30–31 becomes AA. White markers retain original probabilities; violet bars show the synthetic edit. Keep observed EI on the original, because an input edit does not measure a new biological label.

Validation source row 3 is an EI example whose two bases immediately after the central divider are `GT`. The gated seed-29 fit assigns class probabilities approximately `[0.99284,0.00648,0.00068]` in EI/IE/N order. Replacing those two input bases by `AA`, without refitting, produces `[0.08177,0.28564,0.63259]`: the prediction changes to N.

This establishes that the fitted model is sensitive to that edit. It does not provide a newly measured biological label for the edited sequence. The original label belongs to the observed record. Sequence perturbation is a way to investigate a model’s behavior; a biological claim requires separate evidence.

**Investigation HC — Edit a fresh observed window.** Start from the different validation source row 4. Edit a chosen base or short span and inspect the resulting class scores. Every valid change to the 60-character sequence is evaluated by the fixed saved model. Compare an edit near the boundary with an equally sized distant edit. You can also restrict the learned long filter to lags 0–4 or turn off its gates to investigate the internal route. Those controls modify the fitted computation; they do not retrain an alternative architecture. Restore the exact original to check that its result returns. An all-`N` input is a useful uncertainty probe: this model still strongly predicts class N, about 0.95478, illustrating why absence of informative input need not produce uniform probabilities.

Inspect one position, a span, saved fits and internal paths through these shared views. Fit changes preserve the validated string and settings. Pins include the actual model identity and frozen scores.

**Investigation HC-position — Edit one supported symbol.** Show selected index/symbol controls beneath its complete observed window.

**Investigation HC-span — Edit an inclusive span.** Fill a declared range; invalid ranges do not apply.

**Investigation HC-fit — Compare fits and pin exact results.** Show all class probabilities/logits, then saved-fit and full-result pin controls.

**Investigation HC-ablation — Change the computation without refitting.** Tap retention and gate override change fixed weights’ computation; the linear baseline has neither route and unit-gate override is a no-op for the trained ungated fit.

**Investigation HC-trace — Follow an actual block and channel.** Show sender product, lag coefficient and receiver read before block/channel controls; retain all intermediate vectors.

What changes for next-token training? Read shifted targets before reusing the classifier loss.

**Figure H25 — A next-symbol target sits one position later.** Draw A,C,G,T and the shifted target for each causal output.

Output at A predicts C; output at C predicts G. Teacher forcing supplies preceding true symbols; free-running generation feeds each chosen symbol back. Neither is final-window classification. A continuation loss mask selects predictions of intended next symbols, not an unshifted input mask.

A causal network can classify this *whole observed window* using its final position because that position has access to all 60 bases. It does not forecast a central boundary before the right-hand context arrives. If an application must decide before the right-hand context arrives, train and evaluate it using only the context available at that decision.

## 8. Deeper route: long filters, streaming and compact state

The classifier observed its whole window. Generation must respect when each input becomes available.

FFT convolution is attractive when the input segment is already available. Autoregressive generation presents a different workload: produce one new token, feed it back, then produce the next. Re-running a full FFT for each token wastes earlier work. But “therefore Hyena must re-run a full FFT” is too strong. There are several computational representations.

| Representation | What is retained | Work for an additional output, per channel | Appropriate question |
| --- | --- | --- | --- |
| Direct FIR, length $K$ | A buffer of the latest $K$ inputs | $O(K)$ | Is the filter short enough for a simple exact streaming implementation? |
| Whole-sequence FFT | A segment and transform workspaces | $O(P\log P)$ for the segment | Are enough input samples available to exploit parallel batch computation? |
| Blocked convolution | Input blocks and overlap/history | Depends on block and filter sizes | Can we trade buffering latency against throughput? |
| $d$-mode recurrent filter | $d$ state values | $O(d)$ | Does this filter have, or admit a good approximation by, a compact recurrence? |

These counts exclude projections, gates and feed-forward layers. A fixed-$K$ buffer is constant in the *total stream duration*, yet can still be large in $K$. An unrestricted implicit filter whose support grows with context does not automatically have a fixed small state.

### Blocks must include the overlapping tail

What survives when the input is split? Align each block at its original positions, including the tail.

**Figure H15 — Overlap is information.** Put the full convolutions of the two blocks on separate rows, aligned to their original starts. Shade the overlap region and sum its contributions into the output strip. Contrast with an explicitly crossed-out reset-at-boundary result. When used for an autoregressive model, note that future input blocks cannot be computed before their tokens exist.

Block0 creates outputs beyond its two inputs. Block1 begins at global2, where earlier contributions still arrive. Amber tail entries add into occupied positions; discarding them loses history. Future autoregressive blocks are unavailable until their tokens exist.

Split inputs `[1,2,3,4]` into `[1,2]` and `[3,4]`. Convolve each block with the filter, shift the second result by two positions, then **add the overlapping outputs**. This overlap-add construction gives the same linear convolution. If each chunk is filtered independently and only its first two outputs are retained, contributions crossing the chunk boundary vanish.

### Complete the blocked FFT route before choosing a package

The preceding `overlap_add` oracle uses direct convolution in each block. It makes the overlap ledger clear but does not acquire FFT complexity just because the blocks are small. [blocked_convolution.py](blocked_convolution.py) supplies the corresponding efficient transform route: transform the kernel once, zero-pad each input block to prevent circular wraparound, multiply spectra, inverse-transform, and add the entire valid tail into its correct global positions. It never constructs a dense Toeplitz matrix.

Keep it beside [convolution_mechanisms.py](convolution_mechanisms.py), then run `python blocked_convolution.py` with NumPy 2.3.5 and SciPy 1.18.1. The ordinary comparison uses `scipy.signal.oaconvolve(values, kernel, mode="full")[:len(values)]`. The `same` mode is centered, so replacing the causal slice by `mode="same"` changes alignment. [SciPy's mode and overlap-add contract](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.oaconvolve.html).

```python
"""Bounded FFT blocks, a reusable filter spectrum, and the ordinary SciPy route.

NumPy 2.3.5 and SciPy 1.18.1 targets. Real, finite, nonempty 1-D arrays.
The output is the first len(values) samples of linear causal convolution.
"""
import numpy as np
from scipy.signal import oaconvolve
from convolution_mechanisms import direct, overlap_add


def overlap_add_fft(values, kernel, block_size):
    values, kernel = np.asarray(values, dtype=float), np.asarray(kernel, dtype=float)
    if values.ndim != 1 or kernel.ndim != 1 or min(len(values), len(kernel)) == 0:
        raise ValueError("Need two nonempty vectors")
    if block_size < 1:
        raise ValueError("block_size must be positive")
    size = 1 << (block_size + len(kernel)-2).bit_length()
    filter_spectrum = np.fft.rfft(kernel, n=size)
    # All requested output samples must be retained; no all-pairs Toeplitz matrix.
    output = np.zeros(len(values))
    for start in range(0, len(values), block_size):
        block = values[start:start+block_size]
        transformed = np.fft.rfft(block, n=size)
        convolved = np.fft.irfft(transformed*filter_spectrum, n=size)
        count = min(len(block)+len(kernel)-1, len(values)-start)
        output[start:start+count] += convolved[:count]
    return output


def main():
    values = np.array([2., -1., 3., 0., 1., 2., -.5])
    kernel = np.array([.5, 1., -.25, .125])
    expected = direct(values, kernel)
    library = oaconvolve(values, kernel, mode="full")[:len(values)]
    np.testing.assert_allclose(library, expected, atol=1e-12)
    for block_size in (1, 2, 3, 8):
        actual = overlap_add_fft(values, kernel, block_size)
        np.testing.assert_allclose(actual, expected, atol=1e-12)
        np.testing.assert_allclose(actual, overlap_add(values, kernel, block_size), atol=1e-12)
        print("block", block_size, "output", actual, "maximum error", abs(actual-expected).max())


if __name__ == "__main__":
    main()
```

For input length N, filter length M, block size B and transform length F≥B+M−1, work is O(F log F + ceil(N/B) F log F). Retained workspace beyond the O(N) returned output is O(F); the transformed kernel is reused. This bound describes this program, not a measured speed victory. Very short kernels can favor direct convolution; unsuitable B can waste work. The independent seven-sample calculation gives `[1, 1.5, 0, 3.5, −.375, 2.375, 1.5]` at B=1,2,3,8, with maximum observed float64 difference 4.45×10⁻¹⁶ from the direct oracle. These are numerical agreement checks, not speed measurements.

**Investigation blocked — Carry actual FFT tails.** Use the program’s fresh seven-sample input/four-tap filter; edit vectors and B.

**Investigation blocked-workspace — Inspect one block and two mistakes.** Compare carry, reset/crop and centered same simultaneously; inspect exact inverse terms and frequency products.

The trainable ordinary workflow remains `splice_models.py::causal_convolution`, `ImplicitFilter` and `SequenceBlock`: Torch FFT operations preserve the gradient path into the filter-generating network and both input-dependent gates. NumPy/SciPy are useful numeric references, not differentiable replacements inside that Torch training graph. The two-gate block is an explicitly scoped Hyena-style operation; StripedHyena's other filters/attention layers and pretrained checkpoints remain distinct family examples.

**Change the contract.** Use a ten-sample signal, a five-tap signed filter and B=3; compare the whole output including the incomplete last block. Then change a future input only.

<details><summary>Hint and reasoned solution</summary>

Choose F≥7, hence F=8 for this power-of-two implementation. The final input block contains one real sample; its convolution still has up to five valid terms, of which only positions inside the requested ten-sample output are returned. Add tails rather than overwrite them. A changed input at index j must leave output indices below j unchanged to rounding precision. A centered `same` slice or an undersized transform can violate that causality. The all-zero kernel is a useful null; B>N must still match the direct oracle. To stream output instead of retaining N samples, emit only a block's finalized prefix and carry the overlapping tail, taking care when M−1 exceeds B.

</details>

### Some long filters are exactly recurrent

Can a whole tail fit into one or two numbers? Switch to an exponential-mode filter with a recursive structure.

**Figure H16 — Two modes, one long echo.** Draw one fading positive mode and one alternating mode; their weighted sum forms the filter. Below, a two-register state machine shows the update and read at each input. The mode curves and state values are exact calculations, not fitted experimental results.

A register stores old contributions. Its pole multiplies that state, then the current input is added. A residue weights the new state in the read. The feedback path carries it forward. Two registers combine positive and alternating decays; arbitrary learned filters need not be two-state.

For $h_r=a^r$, define $s_t=a s_{t-1}+u_t$, with $s_{-1}=0$. Expanding the recurrence gives $s_t=u_t+a u_{t-1}+a^2u_{t-2}+\cdots$. That is exactly convolution with the exponential filter. The past has been compressed into one number because this particular filter has algebraic structure.

A sum of exponentials uses several modes:

\[
h_r=\sum_{n=1}^{d}R_n\lambda_n^r,\qquad
s_{n,t}=\lambda_n s_{n,t-1}+u_t,\qquad
y_t=\sum_n R_n s_{n,t}.
\]

Each $\lambda_n$ determines a mode’s retention and oscillation; $R_n$ determines its contribution. A negative real pole alternates sign. Complex-conjugate pairs can produce real decaying oscillations. For an indefinitely sustained stable filter, poles inside the unit circle give decaying modes; a finite FIR remains well-defined without that infinite-horizon requirement.

Take $R=[0.6,0.4]$, $\lambda=[0.5,-0.25]$. The first six coefficients are `[1,0.2,0.175,0.06875,0.0390625,0.018359375]`. For inputs `[1,-2,0.5,3,-1,2]`, the output is `[1,-1.8,0.275,2.81875,-0.4109375,2.299609375]`.

This complete NumPy program computes the recurrent output and independently checks convolution:

```python
import numpy as np

values = np.array([1., -2., .5, 3., -1., 2.])
residues = np.array([.6, .4])
poles = np.array([.5, -.25])
state = np.zeros(2)
outputs = []
for value in values:
    state = poles * state + value
    outputs.append(residues @ state)
kernel = (residues[:, None] * poles[:, None] ** np.arange(len(values))).sum(0)
reference = np.convolve(values, kernel)[:len(values)]
print(np.round(outputs, 9))
print(np.allclose(outputs, reference, atol=1e-12))
```

After the first three inputs, the state is `[-0.25,1.0625]`. Carry that state into the remaining inputs to obtain the same continuation. Resetting it gives the different suffix `[3,-0.4,2.325]`. State must travel across chunks just as convolution tails must travel across blocks.

Inside a gated block, these modes accumulate the **gated value** $k_t v_t$; $q_t$ multiplies the read afterward. Cache the short-convolution history as well. An attention layer elsewhere in a hybrid does not execute these updates on behalf of the convolution layers.

The fresh input `[2,0,-1,3,1,-.5]` tests transfer across chunk boundaries. Its input/mode edits carry into later comparisons.

**Investigation HD-registers — Change the mode and its input.** Follow current states, then edit inputs, residues and stable toy poles.

**Investigation HD-carry — Move the boundary without losing state.** Show carried and reset outputs together; inspect a step and pin complete state.

### When the recurrence is an approximation

A general filter network need not output a small sum of exponentials. [Laughing Hyena Distillery](https://proceedings.neurips.cc/paper_files/paper/2023/file/371355cd42caaf83412c3fbef4688979-Paper-Conference.pdf) studies converting trained long filters into compact state-space approximations. The teaching idea is: choose a target state size, fit a recurrent filter to the original coefficients or transfer function, then check both the approximation and the model using it.

If the filter is not exactly recurrent, what does replacing it lose? Compare identical lag positions and separate observed error from a bound.

**Figure H17 — Approximation error has units and a route.** Align original and truncated coefficient stems, shade the omitted absolute mass, then show observed output error and the bound on one numeric axis. Label this finite six-position calculation; do not imply that it bounds an unmeasured infinite tail.

White reference markers retain the original six taps. Shortening the filter omits absolute coefficient mass. Signed cancellation can make output error smaller than the bound. This is finite-horizon, fixed-path analysis, not a guarantee for every later network.

An elementary error bound explains what must be controlled. If $e=h-\hat h$ is the filter error, then

\[
|y_t-\hat y_t|
 =\left|\sum_{j\le t}e_{t-j}u_j\right|
 \le\|u\|_\infty\sum_{r\ge0}|e_r|
 =\|u\|_\infty\|e\|_1.
\]

For one fixed-gate sandwich, multiply this bound by $\|q\|_\infty\|k\|_\infty$. Later nonlinear layers and changing internal inputs require additional analysis; a small filter error alone is not a universal guarantee of unchanged predictions.

Truncate our six-coefficient example after lag 1. Its omitted coefficient sum is 0.301171875 and the input’s largest magnitude is 3, so the bound is 0.903515625. The observed maximum output change is 0.499609375. The bound is deliberately conservative and the truncation is deliberately visible. Both filters can run quickly, but they do not compute the same result.

**Investigation HD-truncate — Choose a finite approximation.** Keep shared inputs/modes and vary retained taps.

What structure suggests a small state? Read coefficient anti-diagonals.

**Figure H26 — Hankel anti-diagonals encode sums of lags.** Draw the6×6 grid from the known analytic filter through lag10.

Anti-diagonals repeat lag i+j, unlike the earlier Toeplitz diagonals using receiver minus sender. Extra coefficients come from stated analytic modes; a saved finite vector does not authorize inventing unknown later samples.

For a deeper connection, extend this known analytic two-mode filter through lag 10 and arrange its coefficients into a **Hankel matrix**, whose entries are constant on anti-diagonals: $A_{ij}=h_{i+j}$. For a sum of $d$ exponential modes, $A_{ij}=\sum_n R_n\lambda_n^i\lambda_n^j$, so it is a sum of at most $d$ rank-one matrices. Our 6×6 example has two substantive singular values, about 1.08698 and 0.13949; the others are numerical roundoff below $10^{-16}$. A rapidly decaying Hankel spectrum suggests that a smaller state may approximate a filter. It does not say that every neural filter has low rank or that one finite matrix certifies all future lags. The full system-realization theory refines the indexing, assumptions and minimal-state statement.

**Practice before continuing.** Use fresh inputs `[2,0,-1,3,1,-0.5]` with the two-mode filter. Change a chunk boundary, reset the state or truncate the filter and compare their actual outputs. Edit inputs, residues and poles; compare direct convolution, full recurrence and carried chunks. Now choose a shorter finite approximation and compare its observed error with the finite-horizon bound. Design a nonzero example with zero truncation error at a chosen position, and explain why that does not establish equality everywhere.

### From a learned filter to a deployed recurrence

The finite bound gives an approximation target. How could we find modal states rather than just cut taps? First make the immediate coefficient and delayed states agree on time indexing.

**Figure H27 — Immediate h0 and delayed modes are separate paths.** Draw h0's current-input path and a read of OLD states before the next update.

Our toy updates state and then reads, giving $h_r=\sum_nR_n\lambda_n^r$, including lag0. The [Distillery paper](https://arxiv.org/html/2310.18780v1) instead retains a direct h0 and models delayed coefficients by $h_r=\sum_n\widetilde R_n\lambda_n^{r-1}$ for r≥1. Its output is $h_0u_t+\sum_n\widetilde R_ns_{n,t-1}$, then states update. Convert our toy by keeping $h_0=\sum_nR_n$ and $\widetilde R_n=R_n\lambda_n$. For R=`[.6,.4]`, λ=`[.5,-.25]`, this gives h0=1 and delayed residues `[.3,-.1]`; lag1 is .2, lag2 .175. A zero pole contributes only to the immediate term. Moving the read without changing residues shifts the impulse response; either convention is valid if its indexing is explicit.

For a learned filter, sample coefficients using their existing coordinate ruler. Pick candidate state orders, initialize poles/residues and minimize a declared discrepancy such as $\sum_{r=1}^{K-1}|h_r-\sum_n\widetilde R_n\lambda_n^{r-1}|^2$. For fixed poles, fitting residues is linear least squares; optimizing poles is nonlinear. Pair complex poles with conjugates to produce real outputs. Compare reconstructed coefficients, full-model logits and task performance. A small filter discrepancy alone does not promise unchanged decisions.

A transfer function collects delays into $H(z)=h_0+\sum_{r\ge1}h_rz^{-r}$. Geometric modes make it rational, motivating rational interpolation and state realization. Polynomial-coefficient methods such as Prony and Padé can be ill-conditioned: close poles, tiny singular values and noise magnify errors. Hankel singular values suggest candidate orders; they do not guarantee an optimal state size. Evaluate each candidate on the stated reconstruction and deployment workload.

Finite-window fitting and infinite-horizon stability differ. The paper's finite-horizon fits can use poles outside the unit circle; imposing stable poles can worsen finite fit. Indefinite deployment needs separately justified stability and extension assumptions. Our lab's ±.95 pole range is a stable toy choice, not a universal distillation constraint. A finite Hankel sample cannot alone certify unseen future lags.

Parallel prompt prefill must leave precisely the states incremental decoding will use. Specialized rational-filter prefill uses its own algebra; an arbitrary neural filter does not get compact-state prefill merely by applying an FFT. Carry each channel's modal registers, short-filter buffer and each attention layer's KV records separately. The saved splice filters here have not been distilled: the runnable toy derives an exact analytic recurrence; this branch explains the research workflow and required comparisons.

## 9. Deeper route: what the family adds

### Different ways to specify a filter

Which part of the mechanism differs? Compare retained objects and which input can change coefficients.

**Figure H18 — Mechanism map, not a leaderboard.** Compare a lag-only kernel, gate-filter-gate sandwich, input-selective state update and normalized attention. Each row displays the equation and retained object, with no fabricated “quality,” “speed” or “best for everything” score.

A lag-only filter shares its distance rule. Surrounding gates change transmitted and received values. A selective transition changes the state update itself; attention computes normalized coefficients over allowed keys. A shared long-context goal does not make these operations identical.

The [S4/Mamba lesson](/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals) showed how a time-invariant state-space system yields a convolution kernel. Hyena often starts with a direct neural function of lag. These parameterizations impose different structure. Once a model makes its state transition or input maps depend on the current token, the overall operator need not be one fixed convolution. Mamba’s selectivity and Hyena’s surrounding gates should be described by their actual equations rather than called interchangeable implementations.

Continuous kernel convolution, or CKConv, developed the idea of evaluating a learned kernel function at relative positions. S4 supplied a structured state-space route to long kernels. H3 combined short shifts, longer state-space filters and multiplicative paths to support content-dependent mechanisms. SaShiMi explored multiscale state-space sequence modeling for audio. Hyena belongs to this set of ideas; the architectural differences concern which filters, gates, resolutions and states are used. [CKConv](https://arxiv.org/abs/2102.02611), [H3](https://arxiv.org/abs/2212.14052) and [SaShiMi](https://arxiv.org/abs/2202.09729) are useful primary pointers for those branches.

For ordinary row-softmax attention, $A_{tj}\propto\exp(q_t^\top k_j/\sqrt{d_k})$ over allowed positions. Its coefficients are nonnegative and normalized. Hyena’s signed distance-and-gate coefficients generally compute a different operator. [Sparse and linear attention](/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals) distinguishes changing an operator from finding a different algorithm for the same one.

### Why genomics is an interesting application

Single DNA-base resolution and long context can both matter: a local change and a distant regulatory region may affect what a model should infer. HyenaDNA pretrained a causal decoder on the human reference genome, using individual nucleotide symbols and special tokens, then adapted it to downstream tasks. Its method includes length warm-up, task-specific supervised adaptation and learned soft prompts. AppendixA3 places learned prompt vectors before embedded DNA and SEP; optimizing these vectors while freezing the backbone is learned adaptation, not an untrained prompt’s guaranteed classifier. Soft prompts are trainable input vectors; they are not newly observed DNA bases. The paper also studied a separately implemented bidirectional ablation. Its main pretrained architecture was not bidirectional. [HyenaDNA](https://arxiv.org/html/2306.15794v2)

The practical workflow is to distinguish the pretraining task from your labeled downstream question, preserve the chosen tokenizer and positional conventions, train or validate the downstream head, and establish an appropriate biological split. A pretrained backbone does not arrive with a valid classifier for every possible new label. Our 60-base experiment demonstrates the trainable mechanism and model inspection; it does not reproduce the paper’s long-context experiments.

### StripedHyena and StripedHyena 2

Which history belongs to each layer of a hybrid? Follow the different ranges and storage.

**Figure H19 — A striped architecture with different ranges.** Use a repeating operator strip: short, medium, long and occasional attention. Under each type, show its filter representation and decode-state object. It is a conceptual architecture map; the caption must not present it as an exact official layer schedule unless a particular verified configuration is selected.

Finite short/medium filters keep recent values, modal filters keep registers, attention keeps keys and values. Each layer owns its history. Repeating one filter across a channel group does not itself mix channels. This conceptual range map is not an exact checkpoint schedule.

StripedHyena’s 2023 release combined attention, gated convolutions and feed-forward layers. Its recurrent convolution representation and its attention KV cache coexist during generation. The [original release article](https://www.together.ai/blog/stripedhyena-7b) describes the architecture and the measured workloads of that release; its historical timing claims are not timings for the small program here.

The 2025 StripedHyena 2 work takes a more specific mixture: short explicit filters for local mixing, medium explicit filters with decay regularization, and long implicit filters expressed using exponential modes, interleaved with attention. The long modal filters permit recurrent evaluation; finite short/medium filters retain bounded input history. Filter sharing across channel groups helps organize hardware-efficient computation. These are deliberate choices of memory range and algorithm, rather than an assertion that every layer should use the longest possible filter. The work supports the Evo 2 genomic model family. [StripedHyena 2 methods](https://arxiv.org/html/2503.01868v1)

### Complexity is a guide to what to measure

How much work might these routes need? Count operations before treating a curve as a speed measurement.

**Figure H20 — From an equation to a benchmark protocol.** Separate three columns: asymptotic mixing work, actual tensor/storage inventory, and measured workload. A learner fills the workload card with sequence length, width, batch, precision, implementation/version, device, forward/backward/prefill/decode scope and warm-up. Leave timing cells empty until there is an actual measurement.

Cyan marks count L² pairwise work; violet marks L log₂L transform work on an arbitrary common scale. Projections, precision and memory traffic also affect runtime. No elapsed seconds are assigned here.

For $D$ channels and a fixed small number of long-filter stages, convolution mixing has $O(DL\log L)$ work, while dense input/output projections and feed-forward updates add $O(LD^2)$. Filter generation also costs work at every evaluated position. Attention’s pairwise mixing has $O(L^2D)$ work, but optimized exact attention need not materialize an $L\times L$ score array in main device memory. A memory-efficient attention algorithm and a different sequence operator answer different questions.

**Investigation work-count — Specify the workload.** Set sequence length, channel width and batch count; inspect operation scales without claiming latency.

**Investigation work-storage — Specify scalar storage.** Use the same workload, choose bytes/scalar and compare one activation with an explicitly materialized pairwise array.

An operation-count sketch such as $L^2/(L\log_2 L)=L/\log_2 L$ is not a speedup measurement. FFT workspaces, complex arithmetic, dtype, kernel fusion, hardware utilization, batch size and projections all affect wall time. [FlashFFTConv](https://arxiv.org/abs/2311.05908) investigates why FFT-based sequence convolutions need hardware-aware algorithms; later multi-hybrid work also uses blocked direct convolution for selected filter lengths.

### Hardware-aware convolution still needs a shape contract

The FFT count does not reveal whether a GPU computes efficiently or waits for memory. Read a small factorized transform before interpreting [FlashFFTConv](https://arxiv.org/pdf/2311.05908).

**Figure H28 — Reshape and factor the transform.** Draw a4×4 grid, column/row transforms and twiddle factors, separating reused on-chip tiles from global memory.

Reshaping a sixteen-point transform reorganizes it into smaller transforms. Complex phase factors called twiddles join subproblems; output ordering must restore the intended frequency indices. Tensor-core matrix operations can perform those subtransforms. Fusion can combine input gates, transforms, products and output gates without repeatedly moving intermediates to global high-bandwidth memory. A tiled algorithm may recompute values to save storage: fewer transfers and fewer scalar operations are different objectives. More factorization does not always mean faster execution.

The [official package](https://github.com/HazyResearch/flash-fft-conv) expects contiguous `(N,D,L)` input and `(D,L)` kernel, unlike our batch-first (N,L,D) streams with sequence axis1. Explicitly transpose and make contiguous, then check transform support, dtype and channel constraints. As checked5October2026, its README documents selected power-of-two transform sizes256…4194304, FP16/BF16 long convolution, channel divisibility by16 above32768 and input-length divisibility conditions. The short-depthwise interface has separate restrictions and a documented BF16-backward limitation. Consult the installed release. The complete Torch/SciPy CPU routes above were executed; this GPU route is source-reviewed, not GPU-tested. Sparsifying frequencies or shortening support changes the operator unless equivalence is established; fusing an unchanged operator does not.

### Block matrices: derive support before dropping history

Medium filters can use blocked matrix products instead of full FFTs. Read the already taught Toeplitz object in B×B blocks before assuming just the previous block matters.

**Figure H29 — A second earlier block still contributes.** Show B2/K4 and H2[0,1] at global receiver4/sender1/lag3.

For within-block indices i,k from0…B−1, $H_j[i,k]=h[jB+i-k]$, with coefficients outside0…K−1 zero. H0 uses within-block history; H1 uses the previous block. H2's smallest possible lag is B+1, so H0/H1 alone suffice for a general kernel only when K≤B+1. For B=2,K=4, H2[0,1]=h3 is nonzero. The [StripedHyena2 paper](https://arxiv.org/html/2503.01868v1) describes a two-stage GEMM route, but nearby K≤2B prose does not guarantee this general support claim. Its matrices show why indices must be checked. More support needs more history blocks or a different valid decomposition.

An exact causal FIR across device shards needs up to K−1 preceding input values. If that halo exceeds a shard, several earlier shards may contribute. This is a convolution-history dependency, not an attention KV cache; Ring Attention next teaches another exact communication problem. StripedHyena2's short/medium/long mixture and context-extension training are architecture/training choices, not free outcomes of a long-filter formula.

When diagnosing a model, distinguish an operator bug from a modeling problem. Padding, lag direction, shifted targets, short-filter causality and moving position coordinates can change the intended computation. A correct model can still underfit, overfit, exploit a shortcut or fail on a new context length. Inspect the data roles, learning curves and changed-input behavior before attributing a result to the architecture family.

The next topic in this module is [Ring Attention & Sequence Parallelism](/learn/path/full-curriculum/ring-attention-sequence-parallelism?module=deep-learning-fundamentals). It changes how attention work is distributed across devices. Keep that distinction: Hyena changes the sequence mixer; Ring Attention distributes an attention computation. Later, [Hybrid SSM–Transformer Architectures](/learn/path/full-curriculum/hybrid-ssm-transformer-architectures-jamba?module=deep-learning-fundamentals) combines state and attention paths in one model.

## 10. Practice: reason, calculate and transfer

Try each task before opening its hint. The first six establish the core route. The final four develop architecture and streaming reasoning. A successful answer explains which computation or information boundary produced its result.

### 1. A filter with a negative echo

For input `[2,0,-1,3]` and filter `[1,-0.5,0.25]`, compute the first four causal outputs. Which lag is absent at position 1, and why?

<details><summary>Hint</summary>
Write current, one-step-old and two-step-old contributions separately. Inputs before the sequence start are zero.
</details>

<details><summary>Solution</summary>
The outputs are `[2,-1,-0.5,3.5]`. At position 1 there is no two-step-old input, so the lag-2 term contributes zero. At position 3 the contributions are $3+(-0.5)(-1)+0.25(0)=3.5$. A negative filter coefficient can increase the output when the input it multiplies is also negative.
</details>

### 2. Padding is part of the mathematics

A length-6 signal is convolved with a length-4 filter. What is the smallest sufficient transform length? What convenient power-of-two length could you choose? Does keeping only the first six results make an unpadded length-6 transform causal?

<details><summary>Hint</summary>
Count the support of the full linear convolution before deciding what to crop.
</details>

<details><summary>Solution</summary>
The full length is $6+4-1=9$. Any supported FFT length at least 9 suffices; 16 is a convenient power of two. Cropping a circular convolution does not remove tail contributions that have already wrapped into the first six positions. Padding must prevent that aliasing before the transform-domain product is inverted.
</details>

### 3. Change the sender, then the receiver

For $v=[2,1,-1]$, $h=[1,0.5,0.25]$, $k=[1,0,2]$, and $q=[1,-1,0.5]$, calculate the output. If $k_1$ becomes 1, which outputs change? What happens if instead only $q_2$ becomes zero?

<details><summary>Hint</summary>
First compute $kv$; only then convolve and multiply by $q$.
</details>

<details><summary>Solution</summary>
$kv=[2,0,-2]$, the convolution is `[2,1,-1.5]`, and the output is `[2,-1,-0.75]`. Opening $k_1$ gives `[2,-2,-0.5]`: positions 1 and 2 change, while position 0 is unaffected. Setting only $q_2=0$ erases only this block’s final output, giving `[2,-1,0]`. In a full residual network other paths can still carry information.
</details>

### 4. Is the matrix an explanation of everything?

An author plots $H(q(u),k(u))$ and says its entry $H_{tj}$ is the derivative of the final network output with respect to input $u_j$. Identify the missing terms and propose an accurate caption.

<details><summary>Hint</summary>
The input affects more than the value stream. Consider the product rule and later layers.
</details>

<details><summary>Solution</summary>
Changing $u_j$ can change $q$, $k$, $v$, normalization and later updates. The full derivative includes these dependencies and all paths to the final output. A suitable caption is: “Conditional mixing coefficients of this channel with its current gates held fixed.” To study final sensitivity, compute or perturb the full model separately and state what that analysis measures.
</details>

### 5. A classifier has learned something—but what?

A positional linear baseline beats a gated sequence model on a centered splice task. Give two reasonable explanations and one additional evaluation that would answer a different, clearly stated question. Why should you not keep trying variants against the same assessment labels?

<details><summary>Hint</summary>
Use the fixed boundary, optimization and data-role definitions. A larger model is not the only possible change.
</details>

<details><summary>Solution</summary>
The baseline can directly weight each known motif position; the sequence model must learn a useful transformation and may overfit or optimize less effectively with this data budget. A separate, appropriately constructed gene-family-held-out dataset could ask about transfer beyond related biological sequences. Alternatively a newly designed variable-boundary task could ask whether a model locates an unknown site, with labels and input availability defined accordingly. Repeatedly choosing variants based on assessment performance turns that set into validation data, so its original evaluation role is lost.
</details>

### 6. An unchanged prefix should stay unchanged

A model uses a causal FFT and recalculates position features as $r/(L-1)$ for every input length. Appending tokens changes early outputs. Explain the bug and give two checks that distinguish it from ordinary float roundoff.

<details><summary>Hint</summary>
Compare the actual coefficient vectors used for a prefix alone and for that prefix inside a longer sequence.
</details>

<details><summary>Solution</summary>
The lag coordinate changes with active length, so the filter is different even at old lags. Fix a reference coordinate system and slice it consistently. Check that the old filter coefficients agree across prefix lengths, then compare full-network prefix outputs against a direct causal implementation at an appropriate numerical tolerance. Also alter only future token values at a fixed length. This separates a moving-coordinate bug from future-value leakage and small arithmetic differences.
</details>

### 7. A long filter with one state

For $h_r=0.75^r$ and input `[2,-1,0,1]`, compute the recurrent state/output. Continue after the second input using the saved state; compare with resetting it.

<details><summary>Hint</summary>
Apply $s_t=0.75s_{t-1}+u_t$, starting from zero.
</details>

<details><summary>Solution</summary>
The outputs are `[2,0.5,0.375,1.28125]`. The state after the second input is 0.5. Carrying it gives the correct suffix `[0.375,1.28125]`; resetting gives `[0,1]`. A state is not optional bookkeeping: it encodes earlier contributions to later outputs.
</details>

### 8. A finite approximation bound

Over the horizon of interest, an original filter is `[1,0.4,0.2,0.1]` and an approximation is `[1,0.4,0,0]`. Inputs are bounded by magnitude 2. Bound the maximum convolution-output error. How does the bound change for fixed sending gates of magnitude at most 3 and receiving gates at most 0.5?

<details><summary>Hint</summary>
Use the absolute omitted coefficient mass. Keep gates separate from inputs.
</details>

<details><summary>Solution</summary>
The omitted mass is 0.3, so the convolution bound is $2\times0.3=0.6$. The fixed-gate bound is $0.5\times3\times0.6=0.9$. Cancellation can make the observed error smaller. This is a bound for the stated finite filter and fixed path, not for an unmeasured infinite extension or arbitrary downstream network.
</details>

### 9. A copy-task shortcut

An experiment always asks the model to copy each input token exactly five positions later. Construct a filter that solves it without content-dependent gates. Redesign the task to test content-dependent addressing instead.

<details><summary>Hint</summary>
An impulse response can be a pure delay. A key-value query can require different delays in different examples.
</details>

<details><summary>Solution</summary>
Set $h_5=1$ and every other coefficient to zero; then $y_t=u_{t-5}$, channel by channel. Use zero initial history. For addressing, sample new key-value associations per example, vary their order and distances, and query one of the keys at the end. Hold out newly generated examples and compare controlled baselines. Fixed-delay success alone cannot establish the harder capability; conversely this construction does not prove that every ungated deep network must fail the redesigned task.
</details>

### 10. Plan an honest efficiency comparison

You have an FFT sequence mixer and an optimized attention implementation. Design separate experiments for full-sequence training and autoregressive decoding. What changes when the convolution is replaced by a modal approximation?

<details><summary>Hint</summary>
Separate the mathematical operator, the workload and the implementation. Include prediction quality in an approximation study.
</details>

<details><summary>Solution</summary>
Fix model dimensions, input lengths, batch, dtype, device and implementation versions. For training, measure the specified forward/backward/update scope with warm-up and synchronization, recording peak storage and excluding setup consistently. For decoding, separate prompt prefill from incremental steps, specify generated length and cache/state handling, and record latency or throughput with its batch. A modal approximation changes the filter unless exact equivalence is established; report filter error and relevant output/task differences as well as runtime and memory. Do not divide asymptotic expressions and label the result a measured speedup.
</details>

## 11. References and another way to learn

These links supplement the self-contained route above. Read a resource for a particular question rather than treating every linked model as a prerequisite.

- [Dive into Deep Learning, convolution layers](https://d2l.ai/chapter_convolutional-neural-networks/conv-layer.html): canonical pictures and hand sums for cross-correlation, padding and shared filters. Map its orientation to our lag coefficients.
- [JuliusO.Smith, DFT convolution](https://ccrma.stanford.edu/~jos/mdft/Convolution.html) and [graphical convolution](https://ccrma.stanford.edu/~jos/mdft/Graphical_Convolution.html): another standard treatment of shifted contributions and the cyclic domain; follow it after the four-sample basis.
- [NumPy rfft](https://numpy.org/doc/stable/reference/generated/numpy.fft.rfft.html) and [irfft](https://numpy.org/doc/stable/reference/generated/numpy.fft.irfft.html): explicit length, normalization and odd/even reconstruction; executed code records its installed version.
- [Complete all-branch gradient program](gated_convolution_gradients.py): FFT forward/VJP, direct oracle, ordinary Torch autograd, central differences and the learned-input chain.

- [Hyena Hierarchy — original paper](https://arxiv.org/html/2302.10866v2): the formal hierarchy, synthetic task design, filter parameterization and matrix interpretation. Read §3 after the gate example; Appendix B derives the conditional matrix, and Appendix D explains frequency-rich initialization.
- [Hazy Research’s illustrated Hyena introduction](https://hazyresearch.stanford.edu/blog/2023-03-07-hyena): a more informal creator explanation of why gating and long filters were combined. Its reported comparisons describe the 2023 experiments.
- [ICML 2023 Hyena presentation page](https://icml.cc/virtual/2023/poster/24143): the conference page identifies the paper, authors, poster and a video section. It offers a presentation route alongside the article. The page and identity were verified; the recording was not watched for this manuscript and playback availability may depend on the host.
- [HyenaDNA paper](https://arxiv.org/html/2306.15794v2) and [standalone author implementation](https://github.com/HazyResearch/hyena-dna/blob/main/standalone_hyenadna.py): read method §3 for the practical gate-filter-gate operator, tokenization, length warm-up and adaptation. In code, inspect `fftconv`, `PositionalEmbedding`, `HyenaFilter` and `HyenaOperator` with the actual maximum-length contract.
- [Laughing Hyena Distillery](https://proceedings.neurips.cc/paper_files/paper/2023/file/371355cd42caaf83412c3fbef4688979-Paper-Conference.pdf): the deeper path from a trained convolution to a compact recurrence, including approximation objectives, modal interpolation, Hankel spectra and deployment. Our two-mode example supplies the prerequisite intuition.
- [StripedHyena release](https://www.together.ai/blog/stripedhyena-7b) and [StripedHyena 2 methods](https://arxiv.org/html/2503.01868v1): read the architectural design and storage contracts before the dated benchmark tables. The second paper explains short, medium and long filters plus blocked/context-parallel algorithms.
- [FlashFFTConv](https://arxiv.org/abs/2311.05908): an advanced systems branch about tensor-core use and memory traffic in sequence convolutions. This is a primary pointer, not a reproduced benchmark here.
- [PyTorch real FFT reference](https://docs.pytorch.org/docs/main/generated/torch.fft.rfft.html): normalization, dimensions, padding/trim behavior and supported device/dtype combinations. Consult the documentation matching your installed version.
- [UCI splice data and license](https://archive.ics.uci.edu/dataset/69/molecular%2Bbiology%2Bsplice%2Bjunction%2Bgene%2Bsequences), [NHGRI RNA background](https://www.genome.gov/about-genomics/educational-resources/fact-sheets/ribonucleic-acid-fact-sheet), and [this packet’s provenance](data-provenance.md): distinguish biological meaning, historical data and our exact experimental split.
- [Complete experiment](splice_models.py), [mechanism calculations](convolution_mechanisms.py), and [saved-fit inspection program](author_calculations.py): runnable companions for reproducing the numbers and investigating your own inputs. After running the training program, place these companions beside it and run `python convolution_mechanisms.py` or `python author_calculations.py`; the mechanism companion also needs SciPy (`python -m pip install scipy`). They contain the complete procedures, not pseudocode for unreported model training.
