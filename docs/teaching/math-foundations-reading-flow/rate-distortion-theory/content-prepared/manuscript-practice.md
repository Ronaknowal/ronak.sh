## 9. Practise the compression decision

Attempt each prompt before opening its hint or solution. A satisfactory answer identifies the source law, transmitted representation, distortion units and applicable limit. The final repair file collects all new small implementations and their focused changed examples; it imports only the already supplied guarded helpers.

### 1. A different four-word code

For fair three-bit inputs, use the codebook 000,001,110,111. Choose a nearest reconstruction, breaking ties by codebook order. Find the fixed rate, average distortion and worst distortion.

Implement the nearest-index calculation for all eight words, preserving the declared tie order. Report each assignment, not only the final average.

<details>
<summary>Hint</summary>

Four inputs are codewords. For each of the other four, determine whether one changed bit suffices.

</details>

<details>
<summary>Explained solution</summary>

Each index uses 2 bits, so the fixed rate is 2/3 bit per source bit. The four codewords have no error; each other word has a nearest codeword one bit away. Expected error is 4/(8×3)=1/6, and worst block error is 1/3. This is a finite operating point, not proof that its rate equals R(1/6).

`nearest_index` in the complete repair file below selects the first minimizing codebook index. In ascending source-word order the indices are[0,1,0,1,0,1,2,3] and changed-position counts[0,0,1,1,1,1,0,0]. Their weighted average is 1/6 per source bit. A geometric grouping picture must show these same assignments.

</details>

### 2. Repair a curve that rises again

Someone evaluates 1-Hb(D) for a fair source all the way to D=.9 and reports a positive required rate there. Identify the violated principle and supply the correct value.

Implement a validated general binary-rate helper. Include p=0 or 1, a budget beyond the zero-rate threshold and rejection of a negative or nonfinite budget.

<details>
<summary>Hint</summary>

Which reconstruction was already feasible at D=.5?

</details>

<details>
<summary>Explained solution</summary>

The feasible set only expands when D increases. A constant reconstruction with actual error .5 remains feasible at D=.9, so the minimum is 0. The entropy formula's curved branch ends at .5; applying it beyond that point violates monotonicity and ignores the constant-output feasible choice.

Test the branch before subtracting entropies. A deterministic source has threshold zero and therefore always returns zero at valid nonnegative budgets. Do not use a positive part of the curved branch beyond its domain.

```python
import math

def binary_entropy(p):
    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)


def binary_rate(p, budget):
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('source probability must be in [0,1]')
    if not math.isfinite(budget) or budget < 0:
        raise ValueError('budget must be finite and nonnegative')
    if budget >= min(p,1-p):
        return 0.
    return binary_entropy(p)-binary_entropy(budget)
```



</details>

### 3. Change the biased source

Use p=.3 and budget D=.1. Construct the attaining joint table, find both forward conditional error probabilities and calculate the information rate.

Verify the entire joint table before calculating its forward errors: both source marginals, both reconstruction marginals and total mismatch probability.

<details>
<summary>Hint</summary>

First obtain output probability r=(p-D)/(1-2D), then generate X backward by an independent error bit.

</details>

<details>
<summary>Explained solution</summary>

r=.25. The joint table, with input rows and output columns, is [[.675,.025],[.075,.225]]. Its rows sum to .7/.3 and its off-diagonal mass is .1. False-positive probability is .025/.7≈.035714; false-negative probability is .075/.3=.25. The rate is Hᵦ(.3)−Hᵦ(.1)≈.412295 bits. A forward channel that flips each source bit with probability .1 would be a different joint law.

The output marginal is(.75,.25). Multiplying the backward output probabilities by independent error probabilities produces the four joint entries. Dividing by(.7,.3) is a separate conditioning operation. Substituting symmetric forward errors .1/.1 would preserve total error but construct a different information cost.

</details>

### 4. Diagnose the exact-zero-error claim

For p=.1 and a fixed block length n=10, a designer says source entropy below 1 bit proves that a fixed-width exact zero-error code can use fewer than 10 bits per block. What went wrong?

State whether the error requirement is exact at this finite block length or only tends to zero over a sequence of increasing lengths.

<details>
<summary>Hint</summary>

How many length-ten strings have positive probability?

</details>

<details>
<summary>Explained solution</summary>

All 1024 strings have positive probability. Exact zero error requires 1024 distinct reconstructions, so a fixed-width index needs 10 bits. Source entropy constrains expected-length lossless coding and the asymptotic vanishing-error boundary, not this finite exact fixed-width requirement. Rare strings can be long in a variable-length code; a fixed-width code cannot hide their length in an average.

The finite requirement counts every positive-mass source string, including rare ones. An expected length can be lower because rare strings may receive longer descriptions; that is a different rate convention. A limiting vanishing-error statement also does not remove the finite exact requirement.

</details>

### 5. Convert the distortion units

A solver minimizes I+2D, with D in squared metres. You change the reported error to Dnew=100D but want exactly the same objective and optimizer. What weight should the new solver use?

Check the objective numerically on any one declared feasible channel, after changing the whole cost matrix to 100 times its old values.

<details>
<summary>Hint</summary>

Set the new weighted distortion term equal to2D.

</details>

<details>
<summary>Explained solution</summary>

Use λnew=.02, because .02×100D=2D. The multiplier has inverse distortion units. Keeping it at 2 would make the same physical error 100 times as expensive and generally select a different operating point.

The information term and channel remain unchanged. The changed distortion is 100D and the inverse weight preserves lambdaD. In the new weighted exercise below, .1 becomes .001 when costs are multiplied by 100. Bit-to-nat conversion is another rescaling: lambda in bits becomes s=lambda ln 2 inside natural-log Gibbs calculations.

</details>

### 6. A stationary but bad optimizer

The fair-binary solver at λ=2 starts with r=(1,0). After 100 iterations its conditional table is unchanged. Is it optimal? Give a feasible rule that improves its objective.

Name the diagnostic that must include absent reconstruction columns. Explain why its bound gap need not equal the difference from one chosen comparison encoder.

<details>
<summary>Hint</summary>

The zero column cannot reappear. Compare the actual zero-rate error with the binary operating point D=.2.

</details>

<details>
<summary>Explained solution</summary>

The constant output has I=0, D=.5 and objective 1. The valid binary channel with D=.2 has I=1−Hᵦ(.2)≈.278072 and objective≈.678072. Its improvement is about .321928. Positive initialization admits that channel; an unchanged support-limited table is insufficient evidence. The reported gap need not equal the actual improvement, because a lower bound can be loose.

The scores g_j include every column, even one with r_j=0. An inactive g_j>1 exposes a profitable direction. The all-column lower bound can be loose, so upper minus lower is a certificate gap for the combined objective, not the exact improvement from one candidate. A larger iteration count cannot revive an exactly excluded column.

</details>

### 7. Allocate a new Gaussian budget

Two independent Gaussian components have variances4 and1. Allocate total squared error1.5 and calculate the total rate. Then describe what happens when the budget reaches3.

Return component errors and component rates separately, and label the total as bits per vector.

<details>
<summary>Hint</summary>

Try a common error level and check whether either component would exceed its variance.

</details>

<details>
<summary>Explained solution</summary>

At total 1.5, θ=.75 lies below both variances, so the errors are (.75,.75). The component rates are about 1.207519 and .207519 bits, adding to 1.415037 bits per vector before rounding. At budget 3, the smaller component caps at 1 and the other gets 2; rate becomes .5 bit per vector. Dividing the total by 2 gives average rate per component, not either component's individual rate.

The complete `allocate` helper is already supplied above and can be reused safely without executing a demonstration. The unchanged numerical result is retained; no new optimizer run is needed to restate it. Zero variance requires no bits, whereas zero error on a positive-variance Gaussian requires infinite ideal rate.

</details>

### 8. A plausible output that is not faithful

With an unknown fair sign X∈{−1,+1}, compare reconstructing0 with sampling an independent fair sign. Can the second scheme prove that the original sign was preserved because its output histogram matches?

Add a source-copying decoder to the joint comparison and explain where its information comes from.

<details>
<summary>Hint</summary>

Enumerate the four equally likely input/output pairs of the random scheme.

</details>

<details>
<summary>Explained solution</summary>

No. Constant 0 has MSE 1. Independent signs agree on two pairs and differ by 2 on two pairs, giving MSE 2. The output marginal matches, but independence means I=0. Preserving the actual sign would require an input-dependent message or other informative side information. Marginal similarity and paired fidelity measure different properties.

Copying X has only the two matching pairs, each probability .5, so its MSE is 0 and I(X;Xhat)=1 bit. Unlike the other two schemes, it uses the source-dependent sign. Matching an output histogram alone neither produces that pairing nor supplies the missing message.

</details>

### 9. Build and validate a changed byte format

Adapt the complete serializer to the four-word codebook from task1, using two index bits per block and the same four-byte source-length header. Encode 001011101111. Define tests for partial blocks and malformed data.

Implement the whole revised encoder and decoder, including count header, two-bit indices, source padding, payload padding and truncation. Add focused empty, partial and malformed cases before any larger campaign.

<details>
<summary>Hint</summary>

Select the nearest codeword, emit its index as exactly two bits, concatenate indices, and pad only the final byte. The decoder derives the index count from the original length.

</details>

<details>
<summary>Explained solution</summary>

The indices are 1,1,1,3, so the payload bits are 01010111, hex 57. The complete five-byte message is hex 0000000c 57. Decoding reconstructs 001001001111, with two wrong positions out of 12. The padding and length protocol must state that a partial source block is zero-padded before encoding and truncated after reconstruction. Acceptance tests: exhaust all binary strings of lengths 0 through 10; preserve the original decoded length; emit only the declared index width; check the expected payload byte count; reject a truncated header, missing/extra payload bytes and nonzero unused bits. For full fair three-bit blocks, verify average error 1/6 and at most one changed bit per block. Report both payload and full-message bits per original bit; an empty input has a valid header but no meaningful per-symbol rate. These tests verify the declared toy protocol, not resilience to arbitrary bit corruption.

The functions below are the complete changed format. Nearest reconstruction uses ascending codebook order to break ties. The decoder derives the exact number of used index bits from the source length; all remaining payload bits must be zero. It requires neither the original source nor its errors.

```python
import struct

CODEBOOK = ('000', '001', '110', '111')

def nearest_index(word, codebook=CODEBOOK):
    if len(word) != 3 or any(bit not in '01' for bit in word):
        raise ValueError('one complete three-bit word required')
    return min(range(len(codebook)),
               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))


def compress_four(source):
    if any(bit not in '01' for bit in source) or len(source) >= 2**32:
        raise ValueError('binary source fitting the four-byte length required')
    padded = source+'0'*((-len(source))%3)
    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]
    bits = ''.join(f'{j:02b}' for j in indices)
    packed = bits+'0'*((-len(bits))%8)
    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))
    return struct.pack('>I',len(source))+payload


def decompress_four(message):
    if len(message)<4:
        raise ValueError('missing source-length header')
    count, = struct.unpack('>I',message[:4])
    blocks = (count+2)//3
    used = 2*blocks
    if len(message)!=4+(used+7)//8:
        raise ValueError('payload length disagrees with header')
    bits = ''.join(f'{byte:08b}' for byte in message[4:])
    if '1' in bits[used:]:
        raise ValueError('nonzero unused payload bits')
    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]
    return ''.join(CODEBOOK[j] for j in indices)[:count]
```

For 001011101111 the complete bytes are `0000000c57`, the reconstruction is 001001001111 and two of 12 positions differ. The new focused tests cover this changed protocol and several partial/error cases. The former 2,047-case campaign belongs to the original one-bit protocol; it is not claimed as fresh exhaustive evidence for these changed functions.

</details>

### 10. Choose a useful audio operating point

You must compress 30-second call recordings. Propose a cheap distortion check, a more task-relevant check and an evaluation process that does not let a good average conceal lost critical words.

Give one acceptable evaluation plan, including a decision threshold for critical content before selecting an operating point. Do not invent recordings, measured latency or a winning codec.

<details>
<summary>Hint</summary>

Distinguish paired waveform fidelity, intelligibility of words and the actual encoded bytes. State what would make a candidate fail.

</details>

<details>
<summary>Explained solution</summary>

One defensible starting answer uses aligned waveform MSE as a cheap paired signal check, while acknowledging its sensitivity to small timing changes and its incomplete relationship to intelligibility. A task-relevant evaluation uses blinded listening/transcription of held-out calls, checking important words or numbers separately. Include realistic noise and speaker conditions with category-level results. A specific intelligibility metric could supplement these checks if its validity for the conditions is established. Encode and decode every candidate setting through the real format; count complete bytes, measure latency on stated hardware and evaluate the same held-out recordings. Specify an acceptable error criterion before comparing settings, including a separate critical-word requirement. A candidate fails when it violates that requirement even if aggregate MSE improves. Document the chosen bitrate range and what source changes would trigger reevaluation. The theory organizes the tradeoff; it cannot decide which lost words are acceptable.

This is an open design task. An answer succeeds when its stated byte convention, held-out conditions, paired or task-specific loss, critical-event requirement and hardware timing procedure could be independently applied. A lower aggregate MSE cannot excuse a failed critical-word requirement.

</details>

### 11. Distinguish channel mixing from time-sharing

Mix two fair-binary channels with flip probabilities .1 and .3, choosing either with probability 1/2 independently for each source symbol. Calculate the mixed distortion and MI, and compare with the average of the two original MIs. Explain how a known schedule of finite block codes differs. Finish the converse’s Jensen step and bound exceptional error mass epsilon for bounded distortion dmax.

<details>
<summary>Hint</summary>

The mixed channel has flip probability .2. Conditional entropy is nonlinear in the error probability. A known block schedule adds lengths and errors.

</details>

<details>
<summary>Explained solution</summary>

The mixed channel has D=.2 and I=1−Hb(.2)=.278071905 bits. The mean of the two channel informations is .324856754 bits, strictly larger. Distortion mixes linearly, while MI is convex in the channel. Time-sharing actual block codes adds their actual transmitted lengths and distortions, giving their weighted rates rather than assigning that rate to the mixed channel’s MI. In the converse, convexity gives (1/n)sum R(Di)≥R((1/n)sum Di); monotonicity then gives R(Dbar)≥R(D) if Dbar≤D. Exceptional source mass epsilon contributes at most epsilon dmax. Without bounded cost or suitable tail control, small failure probability alone does not control expected distortion.

</details>

### 12. Repair one weighted BA step

Use source values and reconstructions 0,1,3, probabilities (.7,.2,.1), initial output law (.2,.3,.5), lambda .1 and squared cost with the source 3 row multiplied by 10. Implement one Gibbs row update, rebuild the induced marginal and calculate the all-column bound. Repair code that sums the wrong array axis or uses the old output law in the reported MI. Check a cost-unit change multiplying all costs by 100.

<details>
<summary>Hint</summary>

Costs are fixed for this step. Row normalization sums over reconstruction columns; the new output law averages rows using source probabilities. Distortion changes under a unit conversion, while lambdaD should not.

</details>

<details>
<summary>Explained solution</summary>

The first channel is [[.267432142,.374284517,.358283341],[.215596641,.346606138,.437797221],[.000752445,.036117381,.963130173]]. Its induced marginal is(.230397072,.334932128,.434670800), not the unweighted mean of rows or the old(.2,.3,.5). The scores g are(1.151985361,1.116440426,.869341600). The achieved distortion is 3.063782850 cost units, MI .110843557 bits and objective .417221842 bits; the lower bound .225545836 gives gap .191676005. The scalar and array solutions below expose different implementation routes to those same operations. Multiplying cost by 100 and changing lambda to .001 preserves q,r,I and both objective bounds; D itself multiplies by 100.

```python
import math
import numpy as np
from scipy.special import logsumexp

def one_ba_scalar(p, costs, weight, initial):
    # This task uses positive finite p and r and finite nonnegative costs.
    s = weight*math.log(2)
    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]
    normalizers=[]
    q=[]
    for row in logits:
        largest=max(row)
        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))
        normalizers.append(log_z)
        q.append([math.exp(v-log_z) for v in row])
    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]
    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)
                    for i in range(len(p)) for j in range(len(initial)))
    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))
    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))
       for j in range(len(initial))]
    f=-sum(pi*z for pi,z in zip(p,normalizers))
    lower=(f-math.log(max(g)))/math.log(2)
    upper=information+weight*distortion
    return q,marginal,[distortion,information,lower,upper,upper-lower],g


def one_ba_array(p, costs, weight, initial):
    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))
    scaled=weight*math.log(2)*d
    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)
    log_q=np.log(r)[None,:]-scaled-log_z[:,None]
    q=np.exp(log_q)
    induced=p@q
    joint=p[:,None]*q
    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))
    distortion=float((joint*d).sum())
    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)
    lower=float((-p@log_z-log_g.max())/math.log(2))
    upper=information+weight*distortion
    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)
```



</details>

### 13. Rotate, allocate and rotate back

For a jointly Gaussian source with covariance[[2.5,1.5],[1.5,2.5]], allocate total squared error 1.5. Implement the eigendecomposition, match eigenvalues and error variances, reconstruct the original-coordinate error covariance and check its trace. Separately compare a scalar sign quantizer at variance 4 with the one-bit Gaussian limit.

<details>
<summary>Hint</summary>

The covariance has eigenvalues 1 and 4. Orthogonal rotation preserves summed squared error; Gaussianity is what turns uncorrelated transformed coordinates into independent ones.

</details>

<details>
<summary>Explained solution</summary>

Both components receive error .75, so the rotated-back error covariance is .75 times the identity and its trace is 1.5. Total rate is 1.415037499 bits per vector. The scalar sign quantizer at variance 4 has MSE 4(1−2/pi)=1.453520911, above the one-bit long-block limit 4/4=1. The covariance calculation assumes a jointly Gaussian vector and ordinary summed squared error. The finite sign rule is a specified scalar codec, not the asymptotic optimizer. The complete implementation reuses the supplied active-set helper and validates the covariance before eigh.

```python
import math
import numpy as np
from rd_scalar_helpers import allocate

def rotated_error(covariance,budget):
    covariance=np.asarray(covariance,dtype=np.float64)
    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:
        raise ValueError('square covariance required')
    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):
        raise ValueError('finite symmetric covariance required')
    values,basis=np.linalg.eigh(covariance)
    if np.any(values<0):
        raise ValueError('nonnegative eigenvalues required')
    errors,rates=allocate(values.tolist(),budget)
    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)
```



</details>

### 14. Extend the measured-byte experiment

Use the same offline retained bill-length sequence and version 1 format at steps 7 and 15 tenths of a millimetre. Report paired MSE inmm², maximum error inmm, complete bytes and bits per retained value. Verify a new halfway case using step 14, reject a truncated payload, and state what information cannot be reconstructed from this message.

<details>
<summary>Hint</summary>

The quantizer’s step and input integers have the same tenth-millimetre unit. Reuse the actual guarded encoder/decoder; no model or original CSV is available to the decoder.

</details>

<details>
<summary>Explained solution</summary>

The new bounded run retains 342 values and omits original data rows 4 and 272. Step 7 gives MSE .041929825 mm², maximum .3 mm,339 complete bytes and 7.929824561 bits/value. Step 15 gives .178187135 mm², maximum .7 mm,265 complete bytes and 6.198830409 bits/value. At step 14, values 7 and 21 reconstruct to 14 and 28: exact ties go upward. Truncating the final stream is rejected. These bytes use the same zlib environment as the main example; they are observed results, not guaranteed monotone sizes for arbitrary steps. Original missing-row positions, species and other CSV fields are not transmitted. The complete repair file below contains the exact additional calls and assertions.

</details>

### 15. Audit ideal prices and complete bytes

For exact text AAAABBCD, use truthful Q1=(.5,.25,.125,.125) with codes A0/B10/C110/D111, and Q2=(.125,.125,.25,.5) with codes A110/B111/C10/D0. Calculate empirical entropy, the second model’s cross-entropy and mismatch excess. Encode both payloads with a four-byte original-symbol-count header and zero padding to a full byte. Explain why neither byte count is a noisy-latent variational MI upper bound.

<details>
<summary>Hint</summary>

These are dyadic probabilities, so each given prefix length equals its model’s negative base 2 log probability. The decoder is assumed to know which fixed book was chosen.

</details>

<details>
<summary>Explained solution</summary>

Counts(4,2,1,1) give H=1.75 bits/symbol. Under Q2 the average price is 2.625, so mismatch costs .875 bits/symbol. The first actual payload has 14 bits and complete hex `000000080adc`,6 bytes. The second has 21 bits and complete hex `00000008db6fe0`,7 bytes. The original count lets the decoder ignore final byte padding; the fixed codebook is shared by prior agreement, with no claim that a transmitted model is free. A variational encoder/reference KL concerns separately defined random variables and a surrogate objective. Converting it into a file requires a coding construction and its overheads.

The complete new exercise file follows. It includes the small functions shown above, the direct changed cases, and imports the already supplied `rd_scalar_helpers.py` and `penguins_quantization.py` without running their mains. Keep the pinned CSV beside those files.

```python
"""Complete small implementations for the independent rate-distortion tasks."""
import itertools
import math
import struct

import numpy as np
from scipy.special import logsumexp

from rd_scalar_helpers import allocate
from penguins_quantization import encode as encode_measurements
from penguins_quantization import decode as decode_measurements
from penguins_quantization import load_measurements

CODEBOOK = ('000', '001', '110', '111')


def binary_entropy(p):
    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)


def binary_rate(p, budget):
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('source probability must be in [0,1]')
    if not math.isfinite(budget) or budget < 0:
        raise ValueError('budget must be finite and nonnegative')
    if budget >= min(p,1-p):
        return 0.
    return binary_entropy(p)-binary_entropy(budget)


def nearest_index(word, codebook=CODEBOOK):
    if len(word) != 3 or any(bit not in '01' for bit in word):
        raise ValueError('one complete three-bit word required')
    return min(range(len(codebook)),
               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))


def compress_four(source):
    if any(bit not in '01' for bit in source) or len(source) >= 2**32:
        raise ValueError('binary source fitting the four-byte length required')
    padded = source+'0'*((-len(source))%3)
    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]
    bits = ''.join(f'{j:02b}' for j in indices)
    packed = bits+'0'*((-len(bits))%8)
    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))
    return struct.pack('>I',len(source))+payload


def decompress_four(message):
    if len(message)<4:
        raise ValueError('missing source-length header')
    count, = struct.unpack('>I',message[:4])
    blocks = (count+2)//3
    used = 2*blocks
    if len(message)!=4+(used+7)//8:
        raise ValueError('payload length disagrees with header')
    bits = ''.join(f'{byte:08b}' for byte in message[4:])
    if '1' in bits[used:]:
        raise ValueError('nonzero unused payload bits')
    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]
    return ''.join(CODEBOOK[j] for j in indices)[:count]


def one_ba_scalar(p, costs, weight, initial):
    # This task uses positive finite p and r and finite nonnegative costs.
    s = weight*math.log(2)
    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]
    normalizers=[]
    q=[]
    for row in logits:
        largest=max(row)
        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))
        normalizers.append(log_z)
        q.append([math.exp(v-log_z) for v in row])
    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]
    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)
                    for i in range(len(p)) for j in range(len(initial)))
    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))
    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))
       for j in range(len(initial))]
    f=-sum(pi*z for pi,z in zip(p,normalizers))
    lower=(f-math.log(max(g)))/math.log(2)
    upper=information+weight*distortion
    return q,marginal,[distortion,information,lower,upper,upper-lower],g


def one_ba_array(p, costs, weight, initial):
    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))
    scaled=weight*math.log(2)*d
    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)
    log_q=np.log(r)[None,:]-scaled-log_z[:,None]
    q=np.exp(log_q)
    induced=p@q
    joint=p[:,None]*q
    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))
    distortion=float((joint*d).sum())
    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)
    lower=float((-p@log_z-log_g.max())/math.log(2))
    upper=information+weight*distortion
    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)


def rotated_error(covariance,budget):
    covariance=np.asarray(covariance,dtype=np.float64)
    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:
        raise ValueError('square covariance required')
    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):
        raise ValueError('finite symmetric covariance required')
    values,basis=np.linalg.eigh(covariance)
    if np.any(values<0):
        raise ValueError('nonnegative eigenvalues required')
    errors,rates=allocate(values.tolist(),budget)
    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)


def prefix_message(text,codebook):
    # These tasks supply a fixed known prefix-free book, so no model is transmitted.
    if len(text)>=2**32:
        raise ValueError('source count exceeds header')
    bits=''.join(codebook[c] for c in text)
    padded=bits+'0'*((-len(bits))%8)
    payload=bytes(int(padded[i:i+8],2) for i in range(0,len(padded),8))
    return len(bits),struct.pack('>I',len(text))+payload


def main():
    words=[''.join(bits) for bits in itertools.product('01',repeat=3)]
    indices=[nearest_index(w) for w in words]
    errors=[sum(a!=b for a,b in zip(w,CODEBOOK[j])) for w,j in zip(words,indices)]
    assert sum(errors)==4 and max(errors)==1
    print('four-word indices / errors',indices,errors)
    print('binary rate p=.5,D=.9 / p=0,D=0',binary_rate(.5,.9),binary_rate(0,0))
    try:binary_rate(.5,-.1)
    except ValueError:pass
    else:raise AssertionError('negative budget accepted')
    source='001011101111'
    message=compress_four(source)
    assert message.hex()=='0000000c57'
    restored=decompress_four(message)
    assert restored=='001001001111'
    print('changed codec bytes / decoded / wrong positions',message.hex(),restored,
          sum(a!=b for a,b in zip(source,restored)))
    for sample in ('','0','1','01','0111','10101'):
        assert len(decompress_four(compress_four(sample)))==len(sample)
    partial=bytearray(compress_four('1'));partial[-1]|=1
    for malformed in (b'',message[:-1],message+b'\0',bytes(partial)):
        try:decompress_four(malformed)
        except ValueError:pass
        else:raise AssertionError('malformed changed codec accepted')
    mi_mixture=1-binary_entropy(.2)
    average=.5*(1-binary_entropy(.1))+.5*(1-binary_entropy(.3))
    assert mi_mixture<average
    print('channel-mixture MI / time-share mean MI',round(mi_mixture,9),round(average,9))
    p=[.7,.2,.1];values=[0,1,3];initial=[.2,.3,.5]
    costs=[[(x-y)**2*(10 if x==3 else 1) for y in values] for x in values]
    scalar=one_ba_scalar(p,costs,.1,initial)
    array=one_ba_array(p,costs,.1,initial)
    for a,b in zip(scalar,array):np.testing.assert_allclose(a,b,atol=1e-12,rtol=1e-12)
    scaled=one_ba_scalar(p,[[100*d for d in row] for row in costs],.001,initial)
    for i in (0,1,3):np.testing.assert_allclose(scalar[i],scaled[i],atol=1e-12,rtol=1e-12)
    np.testing.assert_allclose(scaled[2][0],100*scalar[2][0],rtol=1e-12)
    np.testing.assert_allclose(scalar[2][1:],scaled[2][1:],atol=1e-12,rtol=1e-12)
    print('weighted one-step channel',np.round(scalar[0],9).tolist())
    print('induced marginal / all-column g',np.round(scalar[1],9).tolist(),np.round(scalar[3],9).tolist())
    print('D / I / lower / upper / gap',np.round(scalar[2],9).tolist())
    values,errors,error_covariance,rate=rotated_error([[2.5,1.5],[1.5,2.5]],1.5)
    np.testing.assert_allclose(error_covariance,.75*np.eye(2),atol=1e-12)
    print('rotated eigenvalues / errors / trace / bits',values.tolist(),errors,
          round(float(np.trace(error_covariance)),9),round(rate,9))
    print('variance4 sign MSE / one-bit limit',round(4*(1-2/math.pi),9),1.)
    total,rows,units,omitted=load_measurements()
    print('changed observed steps retained / omitted',len(units),omitted)
    for step in (7,15):
        message=encode_measurements(units,step)
        recovered,recovered_step=decode_measurements(message)
        assert recovered_step==step
        expected=[((2*u+step)//(2*step))*step for u in units]
        assert recovered==expected
        residual=[a-b for a,b in zip(units,recovered)]
        print('step / MSE mm2 / max mm / complete bytes / bits per value',step,
              round(sum(d*d for d in residual)/(100*len(units)),9),max(map(abs,residual))/10,
              len(message),round(8*len(message)/len(units),9))
    assert decode_measurements(encode_measurements([7,21],14))[0]==[14,28]
    try:decode_measurements(message[:-1])
    except ValueError:pass
    else:raise AssertionError('truncated quantization stream accepted')
    for book in ({'A':'0','B':'10','C':'110','D':'111'},
                 {'A':'110','B':'111','C':'10','D':'0'}):
        count,message=prefix_message('AAAABBCD',book)
        print('prefix payload bits / complete bytes / hex',count,len(message),message.hex())


if __name__=='__main__':
    main()

```

Recorded output of this one bounded exercise run:

```text
four-word indices / errors [0, 1, 0, 1, 0, 1, 2, 3] [0, 0, 1, 1, 1, 1, 0, 0]
binary rate p=.5,D=.9 / p=0,D=0 0.0 0.0
changed codec bytes / decoded / wrong positions 0000000c57 001001001111 2
channel-mixture MI / time-share mean MI 0.278071905 0.324856754
weighted one-step channel [[0.267432142, 0.374284517, 0.358283341], [0.215596641, 0.346606138, 0.437797221], [0.000752445, 0.036117381, 0.963130173]]
induced marginal / all-column g [0.230397072, 0.334932128, 0.4346708] [1.151985361, 1.116440426, 0.8693416]
D / I / lower / upper / gap [3.06378285, 0.110843557, 0.225545836, 0.417221842, 0.191676005]
rotated eigenvalues / errors / trace / bits [1.0, 4.0] [0.75, 0.75] 1.5 1.415037499
variance4 sign MSE / one-bit limit 1.453520911 1.0
changed observed steps retained / omitted 342 [4, 272]
step / MSE mm2 / max mm / complete bytes / bits per value 7 0.041929825 0.3 339 7.929824561
step / MSE mm2 / max mm / complete bytes / bits per value 15 0.178187135 0.7 265 6.198830409
prefix payload bits / complete bytes / hex 14 6 000000080adc
prefix payload bits / complete bytes / hex 21 7 00000008db6fe0

```



</details>

You are ready to move on when you can construct a decodable code, state its full message cost, distinguish its finite result from a model-dependent information frontier, trace a stable Gibbs update, diagnose missing support, allocate Gaussian error and explain what the chosen distortion can miss. The next topic, [f-Divergences & Integral Probability Metrics](/learn/path/full-curriculum/f-divergences-integral-probability-metrics?module=math-foundations), compares probability laws in other ways. The independent-sign example shows why a distributional comparison and paired reconstruction fidelity answer different questions.
