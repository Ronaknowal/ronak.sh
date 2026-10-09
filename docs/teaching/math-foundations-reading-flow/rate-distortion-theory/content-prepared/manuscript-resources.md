## Further learning

- [Cover and Thomas, chapter 13](https://static.ias.edu/pitp/archive/2012files/Cover_and_Thomas_Chptr13.pdf) develops the binary and Gaussian constructions, converse, achievability and finite computation in one canonical treatment. The chapter numbering here is from the 1991 edition. Start with its backward-channel example after tracing the joint table in section 3.
- [MIT 6.441, chapter 23](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/resources/mit6_441s16_chapter_23/) connects scalar and vector quantization with rate-distortion theory. It is useful for seeing why a finite quantizer and an asymptotic information bound are different objects. [Chapter 24](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/aaa8d18ddecde45f97134d3f3dcee4a3_MIT6_441S16_chapter_24.pdf), especially theorem 24.2, supplies a formal continuation of the random-codebook argument and its assumptions.
- [CMU 10-704, lecture 16, sections 16.3–16.4](https://www.cs.cmu.edu/~aarti/Class/10704_Spring15/lecs/lec16.pdf) is a compact supplementary route through the Gaussian result and finite BA calculation. These are course scribe notes; use the explicit source, multiplier and logarithm conventions when comparing equations.
- For a lecture-based second pass, [S. N. Merchant's NPTEL lecture 31: Introduction to Rate-Distortion Theory](https://www.youtube.com/watch?v=qmCTnAoMSc8), from [IIT Bombay's Information Theory and Coding course](https://nptel.ac.in/courses/117101053), is an older foundational alternative after entropy and mutual information. The creator and title were verified, but this revision did not review full playback or a transcript.

## Technical references

- [Shannon, Coding Theorems for a Discrete Source With a Fidelity Criterion](https://gwern.net/doc/cs/algorithm/information/1959-shannon.pdf) introduces the fidelity-criterion formulation. Its distinction between error frequency and application consequences is relevant to the alarm example; the local numerical weights are illustrative, not measurements from that paper.
- [Blahut's original algorithm paper](https://doi.org/10.1109/TIT.1972.1054855) is the historical computational reference. [Pearlman's lecture notes](https://sites.ecse.rpi.edu/~pearlman/lec_notes/blahut_2.pdf) provide an accessible auxiliary-optimization derivation. Multiplier signs and log bases vary between treatments; the complete derivation and all-column bound in section 5 state the conventions used here. The original Blahut full text was not retrieved for this revision.
- [Ballé, Laparra and Simoncelli, End-to-End Optimized Image Compression](https://www.cns.nyu.edu/pub/lcv/balle17a-final.pdf), sections 2–3 and the entropy-code appendix, connects transform learning, the continuous training relaxation and actual encoded rates. It is a mechanism reference, not a current performance recommendation.
- [Blau and Michaeli, Rethinking Lossy Compression](https://proceedings.mlr.press/v97/blau19a.html) formulates paired distortion and output-distribution discrepancy as different constraints. Read its operational qualifications: an information formulation alone does not establish general coding achievability. [Qian and colleagues, Gaussian Vector Rate-Distortion-Perception](https://www.comm.utoronto.ca/~weiyu/2024_ISITW_Sadaf.pdf), section III, reviews classical reverse water-filling before a more advanced extension with additional assumptions.
- The ordinary numerical contracts are documented by [SciPy logsumexp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.logsumexp.html), [SLSQP](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html), [brentq](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html) and [NumPy eigh](https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html). The local programmes expose array axes, tolerances, constraints and eigenvector ordering so those tools can be used deliberately.
- [Python zlib](https://docs.python.org/3.12/library/zlib.html) documents the stream format controls and decompression checks. [Palmer penguins](https://allisonhorst.github.io/palmerpenguins/) documents the CC0 dataset, and [Gorman, Williams and Fraser](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) describes the field study. The storage exercise compares recorded measurements with their reconstructions; it does not reproduce the ecological analysis.

## Files and setup

The original small examples use Python's standard library. The array and root-finding comparisons use NumPy 2.3.5 and SciPy 1.18.1; their recorded environment used Python 3.12.14. The measurement codec uses standard-library `Decimal`, `struct` and zlib, with NumPy as a separate quantization check. Exact compressed sizes refer to the stated zlib build/runtime 1.3.2.

| File | Purpose and required companion |
| --- | --- |
| `rd_blockCode.py` | Enumerate the complete three-bit code and its errors. |
| `rd_biasedChannel.py` | Construct the fixed interior binary joint law and forward errors. |
| `rd_originalBinary.py` | Evaluate the original fair curved branch within its declared domain. |
| `rd_finiteOptimizer.py` | Stable scalar BA calculation and all-column objective bounds. |
| `rd_scalar_helpers.py` | Importable exact scalar function definitions, with no demonstration loop. |
| `finite_rd_library.py` | Same-fixture array comparison and constrained solver; keep the scalar helper beside it. |
| `rd_gaussianAllocation.py` | Scalar Gaussian rate and capped active-set allocation. |
| `gaussian_rd_library.py` | Root finding and covariance rotation; keep the scalar helper beside it. |
| `rd_fidelity.py` | Enumerate paired errors for constant and independent reconstructions. |
| `rd_bitstream.py` | The original complete one-bit-index protocol. |
| `penguins_quantization.py` | Quantize and store the retained numeric sequence; requires `penguins.csv`. |
| `rd_practice.py` | Complete new exercise functions and changed cases; requires both guarded numerical/codec helpers and the data. |
| `penguins.csv` and `DATA-PROVENANCE.md` | Exact offline measurements and their attribution/selection rule. |

Save the complete sources under their shown filenames and keep companions together. Each main example runs with `python filename.py`; importing the helper files does not execute the original demonstrations. The common file controls provide the whole source, including imports and checks.
