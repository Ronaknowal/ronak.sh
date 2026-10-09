# Hyena & Long Convolution Models — current visual and lab contract

Reading-flow revision4,5October2026. This complete packet supersedes the earlier prepared presentation instructions, preserved exactly under deep-learning-beginner/original/hyena-before-reading-flow. Current manuscript is lesson.md; generator reproduces it with --check. Its thirty explicit figure markers and nineteen live-view markers map to the semantic owners below. The current design/research/independent review lives at ../../deep-learning-beginner/hyena-long-convolution-models/. This is an implementation specification, not a completion claim.

## Reading order and foundational objects

Each new object follows question → one-line lead → figure → labelled walkthrough → worked mechanism → equation → code → changed case. Details taught in one section are reused by name; figures are above the explanation, not below it. Preserve all eleven main sections, all ten solved practice tasks, four actual saved fits, their histories/data roles/counterfactuals and all four original complete numerical programs. The new fifth program teaches the complete gate/filter VJP and ordinary Torch autograd. No beginner summary replaces specialist depth. The new DFT, full-input derivative, distillation/time-index, hardware/block-support branches are visible teaching.

Root lesson-flow and LessonFlow.jsx make drawings/labs unframed parts of prose. No widget banners, card frames, or teaching disclosures. Main figures use HyenaFlowFigures.jsx and hyena-flow.css; mathematical value plots/grids use HyenaPrimitives.jsx. Operation rectangles are actual circuit nodes, not sentences in cards. Circles are values, rectangles operations. Cyan inputs, amber parameters, violet computations, neutral operation outlines/forward arrows, dashed orange reverse gradients. Numeric grids: positive amber, negative blue, zero neutral; white trace. Plot curves have directly connected labels and exact visible tables. All class probabilities violet. Arrows must land on the actual objects they connect.

| Marker | Actual drawing and its conservation requirement |
| --- | --- |
| H01 DelayAddressFigure | Fixed three-position copy alongside queryB reading associationB:2; distinguish distance and content without measured task accuracy. |
| H02 EchoFigure | Unit pulse and lag arrows; per-product sender→receiver2 diagram for `[1,2,3,4]` and `[1,.5,.25,.125]`; sum4.25. |
| H03 ToeplitzFigure | Sender columns/receiver rows, lower triangular grid, repeated equal-lag diagonal and white traced cell. |
| H04 PaddingFigure | Full support7/padded8 versus circular4; real tail4→0,5→1,6→2; no frequency bins drawn as positions. |
| H05 GateRailsFigure | Actual k and v strips, first ⊗, long-filter sum, receiverq second ⊗ and explicit final output. Signed gates have no probability interpretation. |
| H06 CoefficientFigure | Exact conditional matrix and coefficient−.25 multiplying value3 to contribution−.75. |
| H07 HierarchyFigure | Actual paths j→m→t, each edge and gate factor, sum of routes. OriginalN-stage counts distinguish HyenaDNA order2 convention. |
| H08 LearnedFilterFigure | Fixed r/59 ruler; ninefeatures→32sineunits→16rawvalues; positive learned envelope product and all sixty actual fitted coefficients. Cutaways label omitted units; no fabricated curves. |
| H09 CoordinateFigure | Same old lags under fixed r/7 versus changing r/3; numerical discrepancy. Mathematical extension is not trained extension. |
| H10 GradientFigure | Actual two-coefficient forward sum, target/error, backwards input factors, exact learning step. |
| H11 DnaWindowFigure | Exon/intron spans and RNA removal/join; sixty observed source3 symbols, central29|30 and biological−1|+1. InputN ambiguity differs from classN. |
| H12 DataRolesFigure | Connected prefix/duplicate groups, conflict exclusion, actual2128/460/416 split and row/group counts. |
| H13 LearningCurvesFigure | All eighty validation losses of four saved fits, directly labelled curves and selected-epoch points. Assessment stays separate. |
| H14 CounterfactualFigure | Exact GT→AA source3 edit, observed label only on original, exact same-fit probabilities/logits. |
| H15 OverlapFigure | Full block tails aligned by global offset, explicit overlap-add and final full output; no history discarded. |
| H16 ModesFigure | Positive and alternating coefficient modes plus separate feedback registers, new input and residue-weighted read. Feedback returns to next old-state input. |
| H17 ApproximationFigure | Same-lag original/truncated taps, omitted absolute mass, observed error and finite bound. |
| H18 MechanismMapFigure | Actual fixed delayed input paths and selective recurrent state update/feedback. Gate and attention contrasts remain in prose with equations. |
| H19 StripedFigure | Conceptual short/medium/long/attention ranges and distinct buffers, registers and KV storage; no claim of exact layer schedule or throughput. |
| H20 BenchmarkFigure | L² and Llog₂L operation sketches; no invented wall-clock coordinates. Retain interactive specified workload/storage counts. |
| H21 FourierBasisFigure | Correct four-real-sample DC/Nyquist/cosine/sine basis and reconstructing weights; conjugate complex pair is not two independent real waves. |
| H22 FourierPipelineFigure | Two transforms, per-bin complex product and explicit inverse/crop; length/padding and normalization agree with code. |
| H23 GatedBackwardFigure | Four actual branches into q,k,v,h before VJP formulas; complete new code includes local skip and batch sums. |
| H24 SequenceBlockFigure | Actual8×16 learned lookup and `(N,60,16)` stream; connected16→48 split/causal short streams/gates/long+local/residual branch; actual16→32GELU→16 FFN and second residual; two blocks/final position/three-logit head. Cutaways explicitly label missing units/cells and correct rows. |
| H25 NextTokenFigure | Causal A,C,G,T inputs and one-position-shifted targets; classifier target is separate. |
| H26 HankelFigure | Analytic coefficients through lag10,6×6 anti-diagonals i+j, contrast with Toeplitz t−j; never invent learned unseen lags. |
| H27 DistillationFigure | Immediate h0 current input independently joins OLD state read; next update separately consumes both current input and old state. Delayed residuesRλ convert indexing. |
| H28 FlashFactorizationFigure | Reshape index pair, column transforms, actual twiddle multiply, row transform and output-bin ordering; tiled memory/fusion explanation follows. GPU route is source-reviewed only. |
| H29 BlockToeplitzFigure | Actual B2 grid partitionsH0/H1/H2; white H2[0,1] =h3=.125; derive general K≤B+1 instead of blindly copying K≤2B. |
| H30 InputGradientChainFigure | Shared two-feature X, three separate2×2 parameter grids/streams and all three reversed input derivatives recombining. Conditional value matrix omits two branches. |

## Live investigation contract

HyenaFlowLabs.jsx owns HyenaReaderFlow family state and composes HyenaStudyProvider. Each view draws the object before one-to-three local controls and a live result sentence. There are no model-mode walls, presets or learner prediction/reveal gates. Shared vectors preserve combined edits. Controls act on concepts taught immediately above; invalid edits retain the last valid computation with an explicit error. Resets and external resize synchronize drafts. Null cases are created by arbitrary vector edits, not a preset requirement.

Convolution sum: input vector, lag vector, selected receiver (3). Padding view: same input, complete pin, reset (3). It simultaneously compares direct/FFT/circular, with K>L circular unavailable rather than truncated. Input2–12 values and filter1–12, all finite/bounded, editable signed values; exact padded arrays and complex bins remain visible. Pins preserve original vectors/output and differing lengths honestly.

Gate sender view: full k and v (2); v length2–8 atomically resizes all streams, new gates1/new taps0. Receiver view: full q and h (2). Matrix view: receiver, sender, complete pin (3). Hierarchy view: precedingφ, reset, clearpin (3), with one/two-filter outputs shown together, all intermediate paths and all pinned arrays/outputs preserved. No pin recursively retains its older pins. Matrix is conditional with gates held fixed, not the learned-input Jacobian.

Blocked tails: full input, full kernel, B (3); signal2–12, kernel1–12, B1–16, including B>N and K>B. Workspace: selected input block and reset (2); exact full inverse tail, global accumulation, complex products and reset/centered alignment mistakes. One filter transform is reused.

Modal registers: full input, residues, stable toy poles (3); inputs2–12, modes1–4, residues±2,poles±.95. Pole bounds are only the toy's stable choice. Changing residue length preserves existing modes and supplies .2 for a new pole. Carry: boundary, locally drawn inspected-step registers, full pin (3). Show carried and reset outputs together, preserve exact pin input/residues/poles/split/keep/output. Truncation: retained taps/reset/clearpin (3), observed errors and finite bound. Chunk state accumulates gated values in a real Hyena block and short-filter history remains distinct.

Fitted views in HyenaStudy.jsx share a sixty-symbol string/settings. Edit: complete supported string and validation-row index (2). Position: selected index/symbol/exact restore (3). Span: inclusive index-pair/symbol/apply (3). Fit: saved fit/pin/clearpin (3), all exact logits/probabilities. Pin includes its actual modelId, exact string, gate/tap settings and frozen output, never silently recomputed through a new model. Ablation: taps and gate override (2), with exact linear/ungated no-op explanations. Trace: block/channel (2), complete actual sender→k×v→lag product→sum/local skip→receiver→output and all hidden/intermediate arrays. Selected sender comes from the preceding position view. Prefix hidden differences and final-observed-window semantics remain explicit. AllN uses supported ambiguity inputs and may strongly predict classN; never promise uniform output.

Workload counts: L,D,N (3). Storage: scalar bytes (1), same shared workload. Exact integer tensor byte counts exclude other live allocations; operation scales are not measured timings. Device/version/precision, forward/backward/prefill/decode and warm-up must be declared for a real benchmark, as independently practiced at the end.

## Resource, code and verification contract

Use one successful JSON promise per asset, evict failures, ignore stale resolved promises, retry with edits preserved. Fitted data/code load near their dependent section, no eager NPZ or fits. Input-only views do not fetch the network. Forward filter preparation and bounded recent forward results are shared by model; do not recompute identical sixty-position passes in each view. Model changes apply atomically when their requested data is available. The reader loads only the current topic body. RemoteCodeBlock supplies Copy with visible feedback, Download, near-viewport loading and genuine errors/retry; no unconditional failure text, duplicate readers or unthemed buttons.

Teach complete explained scratch code and normal NumPy/SciPy/Torch routes. Reuse exact earlier gradient, normalization and residual contracts without repeating whole implementation. Preserve original four programs and data; new gated_convolution_gradients.py checks all five derivatives against direct sums, Torch and central differences plus learned-input chain. Source-only FlashFFTConv adapter advice declares interface/version/device limits; no claimed GPU run or reproduction of foundation training.

Before closing: raw/LF-qualified old science bindings; all newly printed values and six independent arithmetic groups; generator --check complete-body equality; all TeX/links/code files; scoped native new gradient checks/complete main; independent whole-source closure; actual isolated production source identity and interactions/retry/cache/pin/reset/copy; painted1366,768,768@200%roottext,390,320 anatomy/gates/model/FFT/tails/state/deeper diagrams; final shared production/loading integration. Local scrolling is allowed for intrinsic numeric tables/tail grids, not as a substitute for recomposed basic diagrams. Do not overwrite historical receipts. Each central content/implementation phase closes against current files separately, and user acceptance is separate.
