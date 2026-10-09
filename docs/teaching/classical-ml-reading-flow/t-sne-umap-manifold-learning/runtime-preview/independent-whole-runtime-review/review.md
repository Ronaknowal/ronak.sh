# Independent whole-runtime review: t-SNE / UMAP / manifold learning

Reviewer: `/root/ica_normal_integration_review`. This reviewer authored none of the lesson/runtime being reviewed. Disposition: **required presentation/correspondence corrections remain; native acceptance pending Root's separately attributed observations**. This is one consolidated whole-lesson review, not a request for another scientific campaign or another whole rewrite.

## Exact scope and evidence

The selected current packet is `source-contract-correction/author-ready-source.json`, 36,740 bytes, SHA-256 `a2e5da3e493543312c1d648f0388e30b95140cb74987e295688b2cfb309270e8`. The corrected private reader is port **5194**, not its preserved 5193 predecessor. No canonical lesson, public payload, shared consumer, ledger, manuscript, or original evidence was modified by this reviewer.

I read the complete accepted current manuscript, setup, assessment/continuity design, manifold/API amendments and research/program/practice design, visual/investigation contracts, author whole readback and correction delta, and the actual current 25 private owners. The generated reader was checked in full against the accepted manuscript/setup by intercepting the generator's output in memory: the complete LF-normalized composition agrees. This is stronger than merely counting headings, but is not a claim that every rendered pixel was personally read. Full metadata binding arrays were parsed and verified; printing an earlier large JSON batch truncated its output, so that truncated dump is not cited as a complete personal reading of every metadata entry.

The whole source pass covers 13 sections, 45 registered drawings, 12 investigations, 15 complete Python programs and their 15 retained streams, five support files, and all 19 practice hints/solutions. The complete underlying program bodies and mathematical explanations were read. `current-source-http.json` records **183 passing source/delivery conditions and 39 exact served files**: current HTML, linked entry script/style, selected dynamic reader bundle, and all 35 payloads. It also binds the 59 recorded build inputs to current disk bytes. This reviewer did not run a build. The parent's corrected private build and warning remain separately attributed.

My one task-start CUA inventory returned `apps: []` and `browsers: []`. I acquired no t-SNE native windows, screenshots, pointer/keyboard observations, clipboard writes or OS downloads. Root has a different browser scope and can provide the native complement. Source, server rendering, HTTP identity and the selected actual JS evaluations below do not certify native readability or event behavior.

## Required consolidated corrections

### R1 — Small Gaussian weights become an unexplained displayed 0/0 (P2)

`ManifoldInvestigations.jsx:138–148` displays raw exponentials and their sum with `number(value, 9)`. `ManifoldDrawing.jsx:3` delegates to shared `flowNumber`, whose decimal rounding (`LessonFlow.jsx:9–11`) turns sufficiently small positive numbers into literal `0`. The Gaussian model correctly computes normalized probabilities from shifted exponents, but the visual never explains that different numerical calculation.

Two newly selected, bounded actual model/display evaluations are retained in `current-source-http.json`:

- L4's allowed distances `[1,2,3]`, width `0.1`: raw sum is approximately `1.9287498479639315e-22`; every displayed raw weight and the displayed denominator is `0`, while the first probability is `1`.
- L5's allowed distances `[4,2,3]`, width `0.1`: the first raw exponential actually underflows to zero; the raw sum is approximately `1.3838965267367769e-87`, but every displayed raw weight/denominator is `0`, while the second probability is `1`.

Thus a learner sees an apparent division by zero while valid probabilities appear. This is a numeric representation defect, not evidence that the shifted probability algorithm is wrong.

**Close it by** using a topic-local adaptive/scientific representation for tiny nonzero values, explicitly distinguishing mathematical zero from numerical underflow, and drawing/showing the shifted/log-weight normalizer actually used for stable probabilities. Explain the common factor cancellation immediately beside that operation; do not silently relabel shifted weights as raw exponentials. Keep exact zero self-probability distinct. Check default, narrow-width and edited-distance states with the current model and actual native L4/L5, including a narrow view. Preserve the accepted scientific sources/streams; no full campaign rerun is needed.

### R2 — Identity colours change inside connected operations and force arrows lack pair ownership (P2)

In `GaussianView`, the input ruler gives A/B/C/D colours `hues[0..3]`; the generic probability bars restart at `hues[0..2]`, while the probability interval uses `hues[1..3]`. The same B is therefore blue, then amber, then blue in one connected explanation. The interval has no local printed B/C/D segment key. The generic `Bars` implementation at `ManifoldDrawing.jsx:108–122` has no caller colour mapping.

`AffinityFigures.jsx:127–137` similarly colours AB/AC/AD force arrows with `hues[0..2]`, although the target B/C/D points use `hues[1..3]`; the actual separated arrows have neither AB/AC/AD labels beside their lanes nor a local arrow key. A later numeric table does not establish which coloured arrow is which. `DensityRadius` at lines 219–223 changes B/C colours between the distance ruler and their weighted products as well.

**Close it by** supplying explicit stable identity colours to connected bars/intervals/force contributions, naming B/C/D at the interval segments or a directly adjacent key (retain the true narrow interval length), and putting AB/AC/AD ownership beside the signed arrows. If a colour instead denotes an operation role, declare that role locally and do not reuse it as an unexplained identity cue. Recheck the affected connected views, including narrow widths and near-zero probability. The arithmetic need not change.

### R3 — D01 calls the saved PCA result “jointly chosen” (P2)

`GeometryFigures.jsx:10` calls the actual saved PCA pair “two jointly chosen map coordinates”; `ManifoldObjects.jsx:44` labels the same saved PCA plot “jointly chosen map”. Its own following text correctly identifies it as saved PCA output. Section 1 then teaches the distinction between a fitted common linear ruler and nonlinear coordinates chosen to preserve graph relationships. These two labels muddy that first foundational distinction.

**Close it by** naming the result “saved PCA coordinates” / “fitted PCA projection” at those two locations. Preserve the source-ID trace, actual data and subsequent distinction. This is a local runtime-label correction, not a reason to alter saved coordinates or accepted scientific evidence.

### R4 — Three foundational operation drawings stop short of their accepted explanatory job (P2)

These are concrete contract/implementation gaps, not a demand that every figure use an identical visual style:

- **D10 / GaussianView:** the accepted spec at `visual-and-investigation-specifications.md:55–57` connects each candidate through its raw weight to its normalized branch, preserving a complete labelled selection interval and self-zero. The implementation gives a ruler, independent bars, an unlabelled interval and a table; it never draws that raw-weight → normalized-branch correspondence. Address it together with R1/R2 so the denominator mechanism is visible rather than inferred from a table.
- **D12 / ConditionalDirections:** spec lines 63–65 calls for two complete separate conditional branch domains and the two chosen opposite branches merging through division by eight into AB and BA. Current `AffinityFigures.jsx:20–38` substitutes row bars, two isolated A/B arrows and separate result bars. The complete row domains exist numerically, but the specific branches are not visually connected through the operation. Draw the separate A and B conditioning objects and link the selected arrows to both joint cells without suggesting the illustrative rows are the next fitted matrix.
- **D43 / OrderedDerivative:** spec lines 187–189 calls for the squared-distance derivative, kernel derivative, the two ordered contributions, and all-pair dependence through Z and `∂log Z`. Current `AffinityFigures.jsx:226–236` shows opposite AB/BA arrows, a kernel table and a result table. The arrows depict pair orientation, not the promised derivative dependency or signed contributions. Draw that operation chain with actual labelled AB/BA contributions and the common Z dependency, preserving the existing correct derivation and fixed-P scope. A new abstract formula box would not close the gap.

**Close it by** completing these three mechanism correspondences with the existing exact examples and signs, following picture → labelled walkthrough → equation → code. Each changed diagram needs a bounded native desktop/narrow read. There is no reason to recreate the 45 drawings or repeat unchanged scientific runs.

## Other bounded observations and publication guards

D31 includes the optional supervised-label-to-training-graph distinction only as a table row; D33 depicts interpolation onto the grid but describes convolution/interpolation back in one sentence. Their accepted contracts contain those additional branches/operations. An author should either complete the corresponding concrete local arrows/objects when touching these figures or record a deliberate, justified contract amendment; do not call source/table presence a completed drawing. These are lower-priority representation completeness observations, not newly discovered algorithm defects.

D07 is a useful six-way comparison, but some internal walkthrough terminology (Gram/affine/P/Q) arrives before its later formal treatment. Keep the early comparison in the plain-language vocabulary already available and explicitly signpost where the later formal terms will be taught. This is a local sequencing improvement; the accepted manuscript's later definitions and specialist depth should stay intact.

All nine learner-internal href occurrences have the normal `/learn/path/<track>/<topic>` shape; inspected target source headings support their destination fragments. Nevertheless the private BrowserRouter always selects this one reader, so clicking those links in this harness cannot prove arrival in the real destination lesson. Root's normal integration must check actual destination headings/fragments/Back and module Previous/Next sequence. Preserve query/module context and section IDs when installing.

Before canonical installation, scope the private `:root`, `body` and universal CSS rules appropriately so they do not leak into the normal application, retain selected-topic loading and lazy code delivery, and keep the exact 35 payload descriptors. These are integration guards, not current private-browser defects. Do not equate an isolated 88-module private build with a normal full-application build.

## Whole correctness and learning-experience disposition

No additional scientific correctness defect was found in the intended supplied fixtures during this whole source read. The lesson's strongest parts are its persistent source identities, explicit distinction between measured distances and map coordinates, worked four-point normalization, carefully separated UMAP ideal objective/event schedule, held-out/reference placement boundaries, and connected MDS/LLE/spectral/topology alternatives. Specialist derivations and complete scratch/library routes are present rather than replaced by API imports. The 19 solutions develop the actual taught objects and do not rely on a prediction gate.

In particular, the mathematical/source read supports the six-edge U-route versus chord/no-path distinction; Gaussian feasibility and current solver status; ordered P/Q normalization and factor-four fixed-P derivative; qualified sampled head-only UMAP events; weighted radius arithmetic; held-out mapping/reference/encoder distinction; double-centred Gram versus stress/disparity; signed LLE affine reconstruction; periodic diffusion modes; and the finite Rips filling convention. These are review conclusions from the complete source and retained evidence, not new executions of the original scientific proofs/program campaigns.

The retained qualifications remain essential: the Gaussian current-return correction has its separate callable evidence, while original streams belong to their stated predecessors; the classical-MDS ordinary-return completion remains source-only; optional openTSNE/densMAP/supervised/global variants have no newly installed/fitted parity; the ten saved 300-row maps and 90 historical metrics were not regenerated; current source-ID collection audits exist for only the three recorded k10 maps; other selections explicitly remain unrecorded; no empirical timing curve, additional paper pixels, inaccessible proof, watched video, new fitted map or biomedical claim was invented. The current local live audit does not fit models.

After R1–R4, closure should reuse this whole review and unchanged scientific evidence, inspect the actual changed source/delta, repeat only affected source/served checks, and acquire Root's bounded actual native coverage. Required native coverage is the whole reading flow/section links; all investigations' default and meaningful edit/reset behavior as appropriate to the retained observations; narrow/enlarged-text representative figures; actual code loading/copy feedback/download descriptor delivery; and real normal-route arrival once installed. Record what was actually observed and what remains unobserved. No “perfect”, universal novice/specialist mastery, all-state, OS-save or clipboard-success claim is justified by this receipt.

## Reviewer harness qualifications

The independent guard initially addressed a nonexistent packet key, then used an overbroad import-removal regular expression that also removed import lines from the generator's output template. Those reviewer assumptions produced failed attempts, not product content loss. The guard was corrected to use `currentSourceBindings`, strip only the actual generator preamble, and compare LF-normalized complete compositions. The final recorded run passed all 183 conditions. A subsequent PowerShell search used unsupported brace expansion and one search used the wrong specification filename; both were corrected as read-only searches. No source/evidence changes resulted from these attempts.

The two fresh Gaussian evaluations are the only new mathematical risk executions in this pass. No original mains, fitted campaigns, full private source checker, scientific witness campaign or Vite build was replayed.
