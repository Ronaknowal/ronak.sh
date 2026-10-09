# Exact NMF prerequisite, section and destination contracts

This proposed design changes only this lesson's future reading flow. Existing topic ID, title, module order, progress identity and original public files are conserved. No prerequisite body is edited or newly accepted here. File hashes in `source-identity.json` bind the actual inspected sources; links below name actual canonical headings rather than guessed topic titles.

## Actual earlier explanations and reusable interface

| Role | Exact public destination | Actual source/support and local bridge |
|---|---|---|
|Arrays and reconstruction; reusable numerical validation|[PCA §4](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python)|`src/learn/data/topics/pca-dimensionality-reduction.jsx`, `public/learn-code/pca-dimensionality-reduction/centered_pca.py`. `real_table(values, features=None)` is reused unchanged as a supplied sibling; NumPy/dataclasses are its top-level dependencies. First teach NMF's row/component/feature cells and uncentred product locally. PCA centering/orthogonal projection differs from a positive cone. Never call PCA.fit to initialize NMF.|
|Optional matrix-gradient derivation|[Matrix Calculus §6](https://ronak.sh/learn/path/full-curriculum/matrix-calculus-jacobians?module=math-foundations#6-differentiate-a-whole-matrix-program)|`src/learn/data/topics/matrix-calculus-jacobians.jsx` actual shaped scalar-gradient/Frobenius pairing. NMF first derives one scalar coordinate slope, then `(WH-X)H.T` and `W.T(WH-X)` with shapes. No giant Jacobian or imported autodiff main is needed.|
|Preceding assumption contrast|[ICA §1](https://ronak.sh/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml#1-follow-one-sample-through-a-mixture), [ICA §2](https://ronak.sh/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml#2-zero-correlation-can-hide-complete-dependence)|Actual canonical mixing and independence/dependence explanation in `src/learn/data/topics/independent-component-analysis-ica.jsx`. Its observed signed mixture is transposed explicitly when comparing with row-oriented NMF. Independence and nonnegativity are different assumptions; neither follows from low reconstruction error. ICA's proposed successor packet is not a runtime dependency or accepted implementation.|
|Later preparation/pipeline exploration|[Feature Preparation §5](https://ronak.sh/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml#5-learn-the-preparation-rule-without-looking-ahead)|Actual canonical train/transform explanation in `src/learn/data/topics/feature-scaling-encoding-imputation.jsx`. It is the next Classical owner, so cannot be required for this lesson's first pass. Locally teach finite nonnegative input, immutable order, training-only vocabulary/IDF/dictionary and fixed `/16` ruler before linking for further practice. No unrequested rewrite.|
|Optional named-axis extension foundation|[Tensor Algebra §4](https://ronak.sh/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight)|Actual §4 deeper branch draws unfolding, mode products and a rank-one tensor, with complete `preparedEinsumExamples.modes` route in `src/learn/data/einsum-reading-flow-examples.js`. NMF locally repeats its own address `(1,0,1)` and declared j-major/t-minor map before the CP/Tucker overview. It reuses explanation only; no scratch-einsum file dependency is implied. General decomposition is explicitly beyond that prerequisite.|
|Optional phase/Fourier foundation|[Fourier §2](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#2-describe-an-oscillation-with-a-rotating-arrow), [Fourier §6](https://ronak.sh/learn/path/full-curriculum/complex-numbers-fourier-laplace-transforms?module=math-foundations#6-transform-a-finite-list-exactly)|Actual canonical phasor and finite-DFT explanations. NMF uses DFT coefficients `[0,1]`/`[0,-1]`, inverse normalization1/2 and explicit phases before discussing STFT magnitude. A phasor amplitude is not silently a two-sided DFT coefficient. No imported FFT main or audio experiment.|

These are selected source-role reads, not fresh entire acceptance of neighboring lessons. The parent assessment/research record remains the whole NMF baseline intake. Actual anchors are author-side source-inspected; native navigation verification belongs to subsequent implementation review.

## Complete proposed section index

Use one shared opening/compass immediately below title/metadata. All actual main teaching sections appear once in this order. New headings generate the following stable fragments; do not invent a second partial contents list. Deeper branches remain visible. A first pass follows §§1–10,12–13,19; §§11,14–18 extend the same mechanism deliberately.

| § | Exact proposed heading / fragment | Drawing jobs | Computational/transfer home |
|---|---|---|---|
|1|Build one observation from positive amounts / `1-build-one-observation-from-positive-amounts`|D01–D04|N1; A/B/X|
|2|Amount is not probability or identity / `2-amount-is-not-probability-or-identity`|D05–D08|N8; A/M/O|
|3|Measure the disagreement before choosing a loss / `3-measure-the-disagreement-before-choosing-a-loss`|D09–D12|N1; G/K/W|
|4|Encode a new row with the dictionary held fixed / `4-encode-a-new-row-with-the-dictionary-held-fixed`|D13–D15|N2/N3; J/V|
|5|Change one coordinate, then reuse the arithmetic / `5-change-one-coordinate-then-reuse-the-arithmetic`|D16–D19|N2; H/I/J|
|6|Fit both factors and decide when to stop / `6-fit-both-factors-and-decide-when-to-stop`|D20–D23|N1/N2; F/H/I/L/V|
|7|Explain the multiplicative route / `7-explain-the-multiplicative-route`|D24–D27|N4/original nmf_step.py; B/H|
|8|Why the upper bound gives a safe step / `8-why-the-upper-bound-gives-a-safe-step`|D28–D30|N5; G/Q/W|
|9|Initialize without silently importing PCA centering / `9-initialize-without-silently-importing-pca-centering`|D31–D34|N6; P|
|10|Use the ordinary tools deliberately / `10-use-the-ordinary-tools-deliberately`|D35–D37|N2/N3 and library/state setup; V|
|11|Control penalties and incomplete observations / `11-control-penalties-and-incomplete-observations`|D38–D41|N7; K/R|
|12|Inspect an actual digit dictionary and contribution / `12-inspect-an-actual-digit-dictionary-and-contribution`|D42–D45|N8/N9/original nmf_digits.py; C/D|
|13|Separate a representation decision from its evaluation / `13-separate-a-representation-decision-from-its-evaluation`|D46–D49|N9/original data/report; C/D/E|
|14|Decide what a factorization can identify / `14-decide-what-a-factorization-can-identify`|D50–D52|Exact proofs; M/N|
|15|When anchors help recover the dictionary / `15-when-anchors-help-recover-the-dictionary`|D53–D56|N11; S|
|16|Change application assumptions explicitly / `16-change-application-assumptions-explicitly`|D57–D60|N10/original nmf_words.py; E/T|
|17|Update as rows arrive / `17-update-as-rows-arrive`|D61–D63|N12; U/V|
|18|Keep extra axes and recognize what is missing / `18-keep-extra-axes-and-recognize-what-is-missing`|D64–D66|Constructed anatomy and external routes; X|
|19|Solve changed tasks, use files and follow useful next questions / `19-solve-changed-tasks-use-files-and-follow-useful-next-questions`|Reuse answer traces|A–X, complete shared endings/file index|

## Historical-fragment compatibility

The canonical source's actual ten heading strings were inspected. Preserve their generated fragments as one nonheading alias at the appropriate new destination; aliases do not enter the new compass or change lesson progress identity. Implementation must verify unique IDs and real keyboard destinations; this design is not a native check.

| Existing fragment | New destination and conserved question |
|---|---|
|`1-a-component-is-a-pattern-and-an-activation-is-an-amount`|§1 patterns/amounts|
|`2-what-gets-optimized`|§3 disagreement/loss|
|`3-learn-one-factor-while-holding-the-other-still`|§5 coordinate learning, onward §7 original MU|
|`4-the-same-observations-can-have-different-explanations`|§2 scale/shear; onward §14 exact identifiability|
|`5-fit-real-digits-and-inspect-the-result`|§12 actual saved dictionary; onward §13 evaluation|
|`6-practical-choices-that-change-the-model`|§10 public controls; nearby §9 init/§11 penalty|
|`7-deeper-geometry-optimization-and-the-limits-of-factorization`|§14 rank/ambiguity; explicit back links to §8 MM and §15 anchors|
|`8-deeper-applications-words-spectra-and-streams`|§16 text/spectra; onward §17 streaming/§18 tensor/audio|
|`9-practice-explain-change-diagnose`|§19 conserved A–H and new I–X|
|`10-readiness-and-the-next-step`|§19 readiness/further learning|

## Extension disposition without fictitious prerequisites

General nonnegative CP/Tucker optimizers are not fully taught by current Tensor Algebra. NMF owns one complete constructed rank-one/core/flattening explanation; [TensorLy non_negative_parafac](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_parafac.html) and [non_negative_tucker](https://tensorly.org/stable/modules/generated/tensorly.decomposition.non_negative_tucker.html) are maintained specialist implementation exploration after named-axis foundations. The general optimizer/identifiability curriculum gap is saved here as a destination requiring a future dedicated tensor-decomposition scope. No other topic file is changed.

STFT/phase reconstruction is not a full local NMF outcome. NMF owns the finite magnitude-loss counterexample; Fourier supplies actual phase/DFT foundations. [librosa STFT](https://librosa.org/doc/main/api/generated/librosa.stft.html) and [Griffin–Lim](https://librosa.org/doc/main/api/generated/librosa.griffinlim.html) are optional maintained external routes. The inspected main documentation is development1.0.0; parameters/output may differ from an installed stable version. Iterative magnitude-to-waveform reconstruction is approximate and cannot recover unique phase from the magnitude alone. Audio quality, source identity and experiment are unclaimed.

LDA posterior inference is separate from nonnegative document weights, and physical hyperspectral interpretation requires calibration, endmember/source validation and application-specific constraints. NMF supplies the exact count/TF-IDF and constructed cone/simplex calculations; a future physical validation or probabilistic-topic scope must reassess real data/assumptions. This durable scoped disposition preserves useful connections without claiming those algorithms were taught, executed or assigned to a nonexistent accepted local owner.
