# Feature20 revision5 — DIFFERENT entire content review

Reviewer: `/root/ml_successor_independent_review`, 9 October 2026. I authored none of this manuscript, its programme bodies or its visual specifications. I am a successor independent reviewer, not the unavailable original design reviewer. Root owns release and phase decisions.

**Disposition: changes required for F1.** The entire content otherwise supplies a coherent beginner-to-specialist route with complete local implementations and declared ordinary-tool boundaries. F2 is a bounded reading-flow recommendation. This is one consolidated finding set after whole reading, not acceptance inferred from counts or hashes. No runtime review or learner study is claimed.

## Exact reviewed content and evidence

- Frozen handoff: `whole-review-handoff.json`, 5864 bytes, SHA-256 `9bed8c091c950fd69288404afe844861823728dc1a68e9a94350019293a42c29`.
- Entire manuscript: `lesson.md`, 215385 bytes, SHA-256 `ee185895e6290560d24e94b87fa3a62126f86d950d7761f6b84638abd8884f95`.
- Entire specifications: `visual-specifications.md`, 40722 bytes, SHA-256 `10bd71d406940166828d804cb3f5d756c1822b95980ef2f06011e6a73aa8c61e`.
- Composition: 33780 bytes, `c3816f6da872cfe6222e7d32616cff664adfc23855099936e99e715575d6c4fb`; source roles: 16412 bytes, `302cf9f974721663dd799e719633f7a1a3e6fc5b2a77d75e7c0869a71ceb7b68`.
- Own source/arithmetic receipt: `whole-content-check.json`, 87346 bytes, `4571c66fd7b1834a933fa1d81c2aa8b97a63dd779b4a586a3a8145bff2eb1bad`; actual checker exit 0, 354 conditions, 179 distinct bound inputs.

I read the full eleven-section literal manuscript in reading order, including all sixteen complete teaching programme bodies and their full displayed stdout, the separate actual binning diagnostic, complete optional R source, complete answer source/stdout, all twenty-six questions/hints/solutions, setup, file index and endings. I recovered a truncated ending read through the final file-index rows and final paragraph. I read every D01–D41 specification, every one of the sixteen lab contracts, and the full numerical/control-domain refinement appendix. I read the complete source-role and setup records, actual-attempt roles including both spline failures, the composition placements/checks/author-input bindings, current accepted design ladder and original design-finding dispositions. The author review was supporting attributed evidence, not my whole reading.

The independent checker only reads sources and computes small independent arithmetic. It confirms full source/output fences rather than abbreviated excerpts; exact three historical code/output pairs against original exported literals and historical native hashes; all nine exact original practice blocks; section identity; programme/stream selection from actual successful attempts; all 42 indexed files; protected source pairs; and the exact current-CRLF to historical-LF CSV relationship. It guards all 18 actual-attempt snapshots/streams, retaining failures 9 and 14. It does not rerun the author's checker, Python mains, fits, scientific tests, build or browser campaign. Its passing conditions deliberately include detection of F1; they do not mean the manuscript passes review.

## Consolidated findings

### F1 — required: correct the iterative example's initialized median and stale-value explanation

At manuscript line 2034, the original table is `[[1,2],[2,4],[3,NA],[NA,8],[5,10]]`. The observed a values are `[1,2,3,5]`, so their median is `(2+3)/2 = 2.5`; observed b values `[2,4,8,10]` have median 6. The current text says the medians are 3 and 6 and initializes row 3 to `[3,8]`. The actual P14 source line 51 uses `np.nanmedian(X, axis=0)`, hence initializes that row to `[2.5,8]`. This is a false intermediate state in the first complete conditional-cycle example, where the learner is explicitly asked to keep state and mask correspondence.

Correct all corresponding authored homes together:

- `lesson.md:2034` / `sections/deeper.md:215`: medians `[2.5,6]`, missing-a row 3 `[2.5,8]`. Row 2 `[3,6]` is already correct because its a=3 is observed; do not change it.
- `lesson.md:2042` / `sections/deeper.md:223`: the stale initialized a for row 3 is **2.5**, not 3. The separate phrase “missing row-2 b at a=3” is correct and must remain 3.
- `lesson.md:2634` / `sections/practice.md:128`: T23's initialization hint must use `[2.5,6]`.
- `visual-specifications.md:461–462` / `visual-refinements.md:43–44`: D37's numerical initialization must use `[2.5,6]` and the actual initialized matrix.

The correct initialized matrix is `[[1,2],[2,4],[3,6],[2.5,8],[5,10]]`. My independent median calculation is saved in the receipt. The first a regression fits only observed-a rows 0,1,2,4 and therefore does not use initialized row-3 a as its response. Its missing prediction remains 3.9652777778; the next b regression uses that newly updated value and still gives 6.0158266415. Thus this correction does **not** justify changing P14, its retained output, the T23 final solution, or replaying its main. The initialized D37/L13 view and stale-state prose need correspondence with the existing code.

Closure should bind the corrected complete manuscript/specifications and source composition inputs, verify these exact operands and preservation of the correct first/second-turn values, and preserve the original review/frozen packet. A bounded SAME successor check suffices; no new entire review or scientific run is needed for this correction alone.

### F2 — recommended: remove authoring-history interruptions from learner prose

The lesson occasionally makes the learner interpret private revision history during an otherwise continuous mathematical explanation:

- Line 66 adds a predecessor-cap audit and “successor specification” after the changed-distance example. Keep the uncapped-geometry rule and the actual distance calculation; retain the historical 108.95<124 guard disposition in design/review evidence.
- Line 284 tells the learner that category names are “not instructions to paint the page green.” This site-author palette instruction interrupts the nominal-versus-ordered explanation. Simply introduce the constructed vocabulary and continue to its unjustified numerical ordering.
- Line 893 describes a “mixed successor” satisfying a “previously requested” extension. Name the complete mixed preparation and its numeric/category/mask blocks directly.

The opening practice-map paragraph at line 2457 also foregrounds which historical activities were preserved. A learner-facing explanation of activity IDs may be useful, but the preservation audit belongs in composition/review records. Preserve the exact original nine practice blocks and stable task anchors; this is not a request to rewrite those protected blocks.

Version qualifications, historical-versus-current data identities, unexecuted R status, the actual supported spline comparator domain and model-dependent MI limitations have a real interpretive purpose and should stay. The further-learning annotations already explain each resource's use; access/readback bookkeeping can be shortened where it adds no learning decision, while retaining material version/access limits in the research record. This recommendation does not require another research campaign or expansion of scope.

## Whole learning-path assessment

This is a heuristic beginner reading review using stated prerequisites, not an observation of novice mastery. At each major mechanism I followed an explanation, a changed application and a diagnosis from the page itself:

| Mechanism | Concrete reading trace, changed application and failure diagnosis |
| --- | --- |
| Table, output schema and model domain | Source row309 separates measured features, species target, sex and numeric mask. Its altered missing-mass copy preserves observed sex. The NMF bridge explains why a signed centred coordinate can violate a nonnegative input domain without implying negative physical mass. |
| Coordinate rulers | Q/A/B differences precede weighted squared distance. Changing divisors or A's mass changes the actual contributions/ranking; shared translation cancels. The five-point fit shows population spread, min/range and linear quartiles before saved-state application to 150, constants and outliers. |
| Row direction, sparse storage and penalties | `[3,4]` and `[6,8]` become the same direction; the zero-row policy is explicit. Sparse zero support changes under centring. An equal-prediction coefficient comparison exposes units in regularization rather than asserting scaling is universally beneficial. |
| Nominal and ordered categories | Full one-hot coordinates precede dropped-reference distances and intercept rank dependence. Fitted rare/unknown/missing policy is separate from supplied ordinal meaning; changed counts/novel values exercise schema stability. |
| Missingness and simple fills | Original masks remain beside estimated values. MCAR/MAR/MNAR are conditional recording claims, not diagnoses from a pattern or a universal percentage rule. Changed absence after fitting exposes why fit-missing-only indicators can lose a bit. |
| Nan-aware donors | The query's observed overlap determines q and the d/q distance factor; only donors with the target are eligible. Removing a target, changing a donated value, ties and no-overlap fallback each have a locally explained result. Multi-cell queries use the original query, not filled feedback. |
| Fitted composition and real application | P1's three numeric plus three categorical coordinates precede the explicit real-data four-plus-three switch. The actual held-out row and saved experiment support a controlled 38/67/84/85/85 comparison, while one extra correct row is not a general winner. |
| Power and quantile maps | Equal-ratio spacing motivates power maps, then signed branches, limiting cases, inverse domains and profile-Jacobian fitting are explained. Fitted landmark interpolation handles ties/endpoints; it is explicitly different from sorting today's query batch. |
| Bins, products, splines and cycles | Actual edges/membership and polynomial exponent products precede increased capacity. Cox–de Boor local support, full knot extension and boundary policy lead to complete rows and weighted sums. Sine/cosine jointly resolve same-sine angles; period is an input contract. |
| Target-dependent encoding | Counts/sums and fold-specific priors explain smoothing versus own-target exclusion. The full-coverage OOF map differs from full-fit inference. Group/time restrictions and retained target alignment are explicit; warm-up rows are not filled using the future. |
| Signed hashing | Declared constructed bucket/sign maps expose an actual collision before the ordinary FeatureHasher route. Editing a count/sign can separate this pair but proves no expected-bias theorem for a deterministic map and does not make hashing invertible. |
| Iterative completion | The observation mask determines regression-response rows, current estimates determine predictors, and an ordered saved sequence transforms a later row. The first two regression turns and cap-versus-convergence are explained. F1 is the one false intermediate initializer in that trace. |
| Multiple completion and sensitivity | Actual completed tables lead to their own analyses, then variance pooling. A square counterexample shows why table averaging differs. Posterior completion assumptions, within/between/simulation variance and an assumed delta shift have separate meanings; more draws do not identify MNAR. |

The route is sustained through the middle and deeper sections: new fixtures are announced, local questions precede notation, code follows an operation already explained, and later task solutions reuse the declared input contract. The body does not silently require the next CV lesson. I inspected the actual KNN section2 owner and `units-cosine` location, current NMF opening/domain context and CV opening/sequence for the named bridges; this is not a new whole-neighbor review.

All 26 solved tasks were read, including original T2–T6/T8/T9/T10/T24 blocks and the new state/mask, source-role, penalty/storage, rare-category, donor-feedback, feature-only leakage, reporting, inverse-domain, landmark/bin, basis/cycle, alpha-zero, group/time, collision, conditional-cycle, sensitivity and sensor-transfer work. The answer asset is complete and imports the already displayed mechanisms. F1 affects the T23 hint, not its resulting coefficients or saved-query solution.

## Specialist and scratch/ordinary-tool assessment

The complete programme ownership is meaningful rather than a list of imports: P1 retains full fitted mixed preparation; P2 implements fitted rulers and separate row normalization; P3 implements category/ordinal policies; P4 implements masked simple fills and full mixed indicator/robust extension; P5 implements target-specific nan-aware donor selection; P6 retains the whole real experiment; P7 owns fitted forward/inverse power maps; P8 owns fitted landmark transformation; P9 owns smoothing/OOF/partial chronological alignment; P10 owns learned bins, products and cycles; P11 owns spline recurrence/design/extrapolation; P12 preserves the valid bounded historical OOF example; P13 implements the declared hash construction; P14 owns conditional cycling and saved inference; P15 owns scalar pooling; P16 owns posterior-update/completion/sensitivity flow using a declared ordinary distribution primitive. Optional mice R is complete but unexecuted; it is not a seventeenth checked teaching programme. Complete setup and separate answer source/output are present.

Ordinary APIs are paired with declared domains and conventions instead of blanket parity. Particularly:

- Target aggregation really scans n rows for each of v categories, so the current `O(nv)` plus sorting statement is correct, repeated across splits. The accepted design's more efficient aspiration is not misreported as implemented dictionary complexity.
- P9's chronological path manually fits/transforms each past-only window and returns retained rows `[2,3,4,5]`, matching targets `[0,0,1,0]` and encodings `[1,1,.5,.5]`. My independent finite aggregation confirms those codes. Full-coverage TargetEncoder CV and partial TimeSeriesSplit warm-up are not falsely equated. Both group and time validation can be required; neither is inferred from category identity.
- P11 explicitly limits the ordinary degree-zero constant comparison to the supported interior after the recorded library shape failure. Scratch constant extrapolation is distinct. Positive-degree linear extrapolation uses the interior derivative at the right boundary; the source's `nextafter` choice matches that stated side. The degree-one extension at 2.5 is `[0,-.5,1.5]`, not the derivative from the next piece. Missing input is not a zero row. Higher declared scratch degrees do not acquire an exhaustive ordinary-library acceptance claim from the shown degree0/1/2 checks.
- D40 uses the first three actual P16 simulated matrices with their own Q/U. D41 separately uses **supplied** Q=`[9,10,11]`, U=`[4,4,4]`; those values are not attributed to the matrices. Its B=1 and T=16/3 are independently checked. Within variance uses squared units; standard error has a separate scale. The posterior normal model and compatibility/analysis assumptions remain conditions, not a general validity theorem for arbitrary completions or a coverage certification.
- Supplied centres belong to the actual KMeans comparison; KBinsDiscretizer owns its own bin-learning policies. Power limits and inverse domain refusals, quantile tie/finite endpoint conventions, sparse centring, reference-code geometry, original query versus conditional-cycle feedback, and immutable fit/inference state are all addressed explicitly.

Original design findings remain closed at content level apart from the new F1: R1's six-coordinate constructed composition explicitly switches to the real seven-coordinate schema; R2 retains all nine exact old practice blocks, including Yeo–Johnson lambda1/±3; R3 assigns supplied-centre initialization to KMeans. The old radius guard is still honestly described as unreachable for the bounded predecessor formula, not a demonstrated clipping defect. F2 only recommends moving that process explanation out of learner prose; it does not reopen its scientific disposition or rewrite frozen evidence.

## Visual and lab source assessment, limits and next action

The complete D01–D41 jobs specify actual tables/coordinates/masks, ruler reductions, sparse support, category membership/reference geometry, conditional missingness, overlap/donor sets, fitted arrays/branch joins, actual split and transformed rows, nonlinear curves/landmarks, bins/products/banded spline rows/circle, target numerator/dependency/fold states, collisions, iterative matrices/models and completion-to-analysis/variance objects. The sixteen lab contracts expose initial results, direct-entity edits, numeric companions, declared domain/refusal/reset behavior and stable identity independent of selection. Their drawings occur with the corresponding worked operations; figures are not substitutes for missing derivations. F1 must be corrected before D37/L13 implementation takes its initialized matrix from prose/specification.

The content specifies narrow/keyboard/accessibility behavior and colour correspondence; I have not seen its implementation or paint. No optimal-diagram, native keyboard, downloadable-OS payload, novice comprehension, broad prediction superiority or deployment claim follows. No manuscript, programme, source, public asset, shared ledger or phase field was changed by me. The only new files are this independent report, its source-only checker and receipt.

Return the finite F1 correction for bounded SAME review against these exact identities; F2 can be addressed in the same prose-only correction if Root adopts it. Preserve the frozen original packet/review and all failed actual-attempt evidence. Root decides content acceptance and any later runtime release.
