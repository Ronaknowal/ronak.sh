## 18. Keep extra axes and recognize what is missing

**What if one row has more structure than a list of bins?** Preserve the named axes before deciding how to compress them. [Update as rows arrive](#17-update-as-rows-arrive) changed training order while retaining a row-by-feature table. A subject measured at several times has a third axis; treating time and feature as interchangeable can hide the question we meant to answer. We now switch to one exact three-axis array, then a separate two-sample Fourier example to distinguish information we reorganize from information we discard.

**What is one nonnegative component with three axes?** One amount from each axis multiplies into each addressed cell.

<!-- figure:D64 -->

The picture's axes are observation `i`, feature `j`, and time `t`, each with positions 0 and 1. The observation vector is `a=[1,2]`, the feature vector is `b=[1,0]`, and the time vector is `c=[1,3]`. Choose address `(i,j,t)=(1,0,1)`: the marked entries are `a1=2`, `b0=1`, and `c1=3`, so the cell is 6. No sum over components is needed because this is one component.

At time 0 the observation-by-feature slice is `[[1,0],[2,0]]`; at time 1 it is `[[3,0],[6,0]]`. The second feature is zero at both times for both observations because its factor entry `b1=0`. A zero entry erases the slice associated with that axis position; an entire zero factor would erase the whole tensor. A **tensor** here simply means a multidimensional array with named axes. Its order is three, meaning three indices, not matrix rank three.

This three-vector outer product is written

\[
T=a\otimes b\otimes c,\qquad T_{ijt}=a_i b_j c_t.
\]

The outer-product symbol is used here for this entrywise three-axis construction; it is not a flattened matrix product whose axes are implicit. We call a nonzero outer product **rank one** in the CP sense because it needs one such separable component. “Separable” means the dependence on `i`, `j` and `t` factors into independent multipliers, not statistical independence of random variables. A general array may need several terms.

**Does flattening destroy the measurements?** Not when the column address map is retained—but an unconstrained matrix factorization can forget separable structure.

<!-- figure:D65 -->

The same eight cells now form the matrix `[[1,3,0,0],[2,6,0,0]]`. Its rows are observations; its columns are the ordered pairs `(feature,time)=(0,0),(0,1),(1,0),(1,1)`. Time changes fastest within each feature, so column address is `2*j+t`. Our marked tensor cell `(1,0,1)` maps to matrix row 1, column 1 and still equals 6. This is **unfolding**. It reorders cells without deleting them. Without that pair-to-column map, a “feature 1” in the matrix could ambiguously mean a time or an original feature.

For this one-term example the flattened pattern is `[b0*c0,b0*c1,b1*c0,b1*c1]=[1,3,0,0]` and observation amounts are `[1,2]`. It can be represented by rank-one NMF. But a general four-entry matrix pattern need not equal the outer product of a two-entry feature vector and a two-entry time vector. Flattening followed by ordinary NMF allows a broader pattern class than enforcing a shared feature/time factorization. It is the **model constraint**, not the mere rearrangement of cells, that changes the assumption.

The first branch of the picture extends the outer product by adding several components. In a **CP decomposition**—CANDECOMP/PARAFAC—the same component index `r` chooses one observation vector, one feature vector and one time vector, whose outer product is added to the others:

\[
\widehat T_{ijt}=\sum_{r=1}^{R} A_{ir}B_{jr}C_{tr}.
\]

`A` is observation-by-component, `B` feature-by-component and `C` time-by-component. Requiring every entry nonnegative makes each term additive. For `I` observations, `J` features and `T` times, the factors use `R(I+J+T)` numbers, instead of the dense array's `IJT`, before optional scaling weights or metadata. That is a potential saving when rank is small, not a guarantee for every array or rank. Positive factor rescaling and component permutation remain possible, and CP identifiability has its own conditions; the matrix support proof in §14 cannot simply be renamed a tensor proof.

The other branch permits different component counts on each axis and an intervening **core** array. In a **Tucker decomposition**, a core cell `G_pqr` weights the interaction of observation component `p`, feature component `q`, and time component `r`:

\[
\widehat T_{ijt}=\sum_{p=1}^{P}\sum_{q=1}^{Q}\sum_{r=1}^{R}
G_{pqr}A_{ip}B_{jq}C_{tr}.
\]

Our same rank-one array uses `P=Q=R=1`, core `[1]`, and the original vectors as the single factor columns. Its factor/core multiplication therefore reproduces exactly `a_i*b_j*c_t`. The separate inset deliberately changes examples: its three factor matrices are `I2`, the 2×2 identity, and its core has the sole nonzero `G[0,1,0]=2`. Its reconstructed tensor has the sole nonzero cell `T[0,1,0]=2`. It is **not** another fitted explanation of our original `T`. It shows that a core can connect different latent positions on different axes, rather than always tying position `r` to position `r` to position `r`.

Tucker storage is `IP+JQ+TR+PQR`; an oversized core can erase a compression advantage. A superdiagonal core with equal axis ranks recovers CP as a special structural case. Neither shape choice supplies missing observations, physical identities or a global optimum. The [Kolda–Bader survey's CP/Tucker definitions](https://www.kolda.net/publication/TensorReview.pdf) distinguish those forms and their axis ranks. [Tensor Algebra §4](https://ronak.sh/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight) provides the local unfolding, mode-product and outer-product foundations.

The small complete program later in this section constructs every cell with loops and checks the ordinary `np.einsum` route for the same contractions. It does **not** fit CP or Tucker factors. General nonnegative tensor fitting needs dedicated initialization, masked/sparse objectives, convergence/degeneracy analysis and model selection beyond this matrix lesson. For that next investigation, [TensorLy's nonnegative CP](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html) and [nonnegative Tucker](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html) document actual public optimizer interfaces and returned factor/core shapes. Those are specialist extension resources, not a promise that a general optimizer has already been derived here or in the prerequisite.

**Does sparse storage tell us which values were observed?** No: storage and missingness are separate contracts. A word-count zero can be an observed absence stored implicitly in a sparse matrix. A missing spectral measurement can be absent from the objective using the mask from [Control penalties and incomplete observations](#11-control-penalties-and-incomplete-observations). Discarding unstored zeros would change the first objective; inserting measured zeros would change the second. More axes make the same distinction important at a larger scale. Describe the observation set and error denominator explicitly before selecting sparse or tensor software.

**Can a nonnegative time-frequency picture reconstruct sound by itself?** Magnitude omits the direction of a complex coefficient.

<!-- figure:D66 -->

We switch from the constructed tensor to a separate, exact two-sample Fourier calculation. Each Fourier coefficient is an arrow in the complex plane: its length is **magnitude**, and its angle is **phase**. The coefficient lists are `[0,1]` and `[0,-1]`. Both have magnitudes `[0,1]`, but the second arrow points right in the first list (phase 0) and left in the second (phase `pi`). A magnitude bar keeps the length and throws away that direction. The zero-frequency coefficient is zero; its angle has no signal-bearing meaning here.

For two samples, the inverse DFT with the convention used here divides by 2. The first sample adds the coefficients; the second subtracts the second coefficient because its rotating factor is `exp(i*pi)=-1`. Thus `[0,1]` gives `[0.5,-0.5]`, whereas `[0,-1]` gives `[-0.5,0.5]`:

\[
x_n=\frac12\sum_{k=0}^{1}X_k e^{2\pi i kn/2}.
\]

`i` in this equation is the imaginary unit, not our earlier observation index; we have changed to the standard finite-Fourier notation for this separate example. The two real waveforms differ even though their magnitude arrays agree exactly. Their equal magnitudes therefore cannot specify a unique waveform. [Fourier §2](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#2-describe-an-oscillation-with-a-rotating-arrow) explains the rotating arrow; [Fourier §6](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#6-transform-a-finite-list-exactly) derives the finite transform and normalization.

The **short-time Fourier transform**, or STFT, applies a windowed Fourier transform to overlapping short signal segments. Its columns index time frames and its rows index frequency bins. A magnitude spectrogram is the nonnegative array of coefficient lengths. If `S` is that complex array, `|S|` is magnitude and `|S|²` is power; they are different numerical representations and lead to different losses/rulers. To match this lesson's rows-as-observations convention, transpose a frequency-by-time magnitude array before using row-oriented NMF, or deliberately state an alternative factor orientation. A factor called a “spectral template” should then have named frequency bins, while its time amounts name frames.

A learned additive approximation to magnitude does not restore the missing phase. Reusing mixture phase is an extra approximation; reconstructing a waveform also requires the matching window, overlap, transform size and inverse convention. An iterative magnitude-to-waveform method searches for a signal compatible with a target magnitude but does not establish a unique original phase or auditory source identity. [librosa STFT](https://librosa.org/doc/main/api/generated/librosa.stft.html) documents the complex array, magnitude and phase interface; [Griffin–Lim](https://librosa.org/doc/main/api/generated/librosa.griffinlim.html) is an optional reconstruction route. These inspected links are the development 1.0.0 documentation, so check your installed stable version before using its parameters. No audio experiment or quality comparison is being inferred from our two-sample proof.

**How can we verify the anatomy without an unexplained optimizer?** The complete `nmf_axis_phase.py` below uses explicit addressed multiplication, explicit unfolding and direct inverse sums, then compares them with `np.einsum` and `np.fft.ifft`. Every tensor cell is supplied by the three vectors; no training data, random start or fitting step is hidden. Direct complex exponentials leave a tiny imaginary roundoff term for `sin(pi)`; the output preserves it rather than presenting it as measured signal.


```python
"""Exact constructed tensor addresses and finite Fourier phase counterexample."""
import json
import numpy as np


def main():
    a=np.array([1.,2.]);b=np.array([1.,0.]);c=np.array([1.,3.])
    tensor=np.empty((2,2,2))
    for i in range(2):
        for j in range(2):
            for t in range(2):tensor[i,j,t]=a[i]*b[j]*c[t]
    ordinary=np.einsum('i,j,t->ijt',a,b,c)
    unfolded=np.empty((2,4))
    for i in range(2):
        for j in range(2):
            for t in range(2):unfolded[i,2*j+t]=tensor[i,j,t]
    # Tucker(1,1,1) has one core entry; this equals the same rank-one tensor.
    core=np.ones((1,1,1))
    tucker=np.einsum('pqr,ip,jq,tr->ijt',core,a[:,None],b[:,None],c[:,None])
    other_core=np.zeros((2,2,2));other_core[0,1,0]=2
    identity=np.eye(2)
    other=np.einsum('pqr,ip,jq,tr->ijt',other_core,identity,identity,identity)
    waves=[]
    for coefficients in [[0.,1.],[0.,-1.]]:
        coefficients=np.array(coefficients,dtype=complex)
        samples=[]
        for n in range(2):
            samples.append(sum(coefficients[k]*np.exp(2j*np.pi*k*n/2) for k in range(2))/2)
        ordinary_inverse=np.fft.ifft(coefficients)
        waves.append({'coefficients':coefficients.real.tolist(),'magnitude':np.abs(coefficients).tolist(),
                      'second_bin_phase':float(np.angle(coefficients[1])),
                      'direct_inverse_real':np.array(samples).real.tolist(),
                      'direct_roundoff_imaginary':np.array(samples).imag.tolist(),
                      'ordinary_ifft_real':ordinary_inverse.real.tolist()})
    print(json.dumps({'scope':'New exact anatomy only, no tensor optimizer/audio experiment',
        'factors':{'observation':a.tolist(),'feature':b.tolist(),'time':c.tolist()},
        'tensor_ijt':tensor.tolist(),'time_slices':[tensor[:,:,t].tolist() for t in range(2)],
        'address_1_0_1':float(tensor[1,0,1]),'unfolded_j_major_t_minor':unfolded.tolist(),
        'einsum_equal':bool(np.array_equal(tensor,ordinary)),'tucker111_equal':bool(np.array_equal(tensor,tucker)),
        'different_tucker_core':other_core.tolist(),'different_tucker_tensor':other.tolist(),
        'waves':waves},indent=2,allow_nan=False))


if __name__=='__main__':main()
```


Here is its full new finite output. The loops, contractions, exact address and unfolding agree; both inverses share magnitude and differ in sign. The work is deliberately only the promised anatomy. Materializing a dense outer product needs `O(IJT)` cells; retaining its three factors needs `O(I+J+T)` values. Production contractions should avoid materializing an array when only selected cells or a contracted result are required. This two-sample inverse is a direct definition check, not a performance recommendation to replace an FFT by nested loops.


```json
{
  "scope": "New exact anatomy only, no tensor optimizer/audio experiment",
  "factors": {
    "observation": [
      1.0,
      2.0
    ],
    "feature": [
      1.0,
      0.0
    ],
    "time": [
      1.0,
      3.0
    ]
  },
  "tensor_ijt": [
    [
      [
        1.0,
        3.0
      ],
      [
        0.0,
        0.0
      ]
    ],
    [
      [
        2.0,
        6.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "time_slices": [
    [
      [
        1.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        3.0,
        0.0
      ],
      [
        6.0,
        0.0
      ]
    ]
  ],
  "address_1_0_1": 6.0,
  "unfolded_j_major_t_minor": [
    [
      1.0,
      3.0,
      0.0,
      0.0
    ],
    [
      2.0,
      6.0,
      0.0,
      0.0
    ]
  ],
  "einsum_equal": true,
  "tucker111_equal": true,
  "different_tucker_core": [
    [
      [
        0.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        0.0,
        0.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "different_tucker_tensor": [
    [
      [
        0.0,
        0.0
      ],
      [
        2.0,
        0.0
      ]
    ],
    [
      [
        0.0,
        0.0
      ],
      [
        0.0,
        0.0
      ]
    ]
  ],
  "waves": [
    {
      "coefficients": [
        0.0,
        1.0
      ],
      "magnitude": [
        0.0,
        1.0
      ],
      "second_bin_phase": 0.0,
      "direct_inverse_real": [
        0.5,
        -0.5
      ],
      "direct_roundoff_imaginary": [
        0.0,
        6.123233995736766e-17
      ],
      "ordinary_ifft_real": [
        0.5,
        -0.5
      ]
    },
    {
      "coefficients": [
        0.0,
        -1.0
      ],
      "magnitude": [
        0.0,
        1.0
      ],
      "second_bin_phase": 3.141592653589793,
      "direct_inverse_real": [
        -0.5,
        0.5
      ],
      "direct_roundoff_imaginary": [
        0.0,
        -6.123233995736766e-17
      ],
      "ordinary_ifft_real": [
        -0.5,
        0.5
      ]
    }
  ]
}
```


We can now name three different boundaries accurately: flattening with an address map **reorganizes** information, imposing CP/Tucker **restricts** a model class, and keeping magnitude alone **discards** phase. The final changed tasks ask you to make those distinctions yourself, alongside the optimization, state and interpretation decisions from the rest of the lesson.
