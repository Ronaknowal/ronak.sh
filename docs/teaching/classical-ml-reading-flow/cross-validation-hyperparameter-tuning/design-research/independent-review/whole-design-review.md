# Classical21 — independent whole-design review

9 October 2026. Reviewer: `/root/ml_successor_independent_review`, DIFFERENT from the original partial-design author and Root's design continuation. I authored none of this design, the retained lesson or its scientific programmes. This review concerns the complete design proposal, not a manuscript, implementation or writing release.

Target: `design-research/author-ready-design.json`, 37,052 bytes, SHA256 `0b36c78f55dd683938b73bd1fd695254a5c5e0424b7a646f9e14924d57068809`. All 60 bound inputs match. The review finds two bounded material design omissions, consolidated below. Resolve their concrete policies and fixtures before calling the entire design ready for writing; the rest of the proposed route is supported. Root owns disposition and release. No learner, author-design, central, canonical, shared or public file was edited.

## One consolidated required set

### F1 — Define the resampled selection statistic and duplicate identity/split policy

Priority P2. Locations: `programmes-practice-and-resources.md:19` (P11), `visual-and-investigation-contracts.md:50` (D34) and `:74` (L10), `design-fixtures.md:66` (L10 decomposition), and the N11 practice contract. These correctly distinguish sampled positions from distinct observations and promise preservation of repeated original IDs. P11 also promises to rerun preparation/selection using P04/P07 legal helpers. The design does not yet define how those helpers receive repeated identities, how inner folds are constructed inside the resample, or precisely which selection/refit statistic is returned.

This is consequential, rather than a request to prewrite the programme. For the proposed resample `[0,0,2,2]`, take source 0 at x=0/y=0 and source 2 at x=2/y=1. The four occurrences have positions 0–3. Two folds holding occurrence positions `[0,2]` and `[1,3]` put copies of both measured source rows on both sides. A uniform 1NN obtains accuracy 1 by finding the identical copy. Folds holding `[0,1]` and `[2,3]` exclude each source identity completely and obtain accuracy 0. Both use the same resampled multiset, with the same simple mean. They define different internal selection statistics. Calling both merely a rerun of selection obscures which functional is being bootstrapped. The fresh standard-library counterexample is in `whole-design-check.json`; it is not execution of P11 or any retained scientific programme.

Choose and record one complete local construction:

- Keep an occurrence position and original source ID separately, and state the stable distance/tie identity. Multiplicities must still influence every fitted median, scale, objective and refit as intended.
- Name the actual statistic, its tiny source fixture/candidates and the fixed split rule on each resample. State whether duplicate copies may cross inner fit/validation boundaries. A bootstrap of an explicitly defined empirical selection functional can allow this; then explain the resulting copy-driven internal scores and do not describe them as new-observation assessment. If the intended statistic instead excludes original identities across folds, make that grouping part of its definition. Grouping is not an automatic universal bootstrap repair.
- Define what happens with too few distinct identities, an empty training/held side, an illegal k, or an absent class. An explicit undefined/refusal result is acceptable. Silently redrawing until valid changes the bootstrap law and must not be introduced as an implementation convenience.
- Give the default and one changed/null trace for the whole-statistic view, and align D34/L10/P11/N11. The simple mean/multiplicity view and its existing `[0,0,2,2]` arithmetic can stay unchanged. Preserve the qualification that the resample distribution is descriptive and validity depends on the statistic, unit and data-generating model.

This finding does not assert that every ordinary bootstrap with duplicates is leakage, or that a descriptive bootstrap distribution must be a confidence interval. It asks the design to identify the operation its new whole-procedure programme and view will actually perform.

### F2 — Make the finite history-driven SMBO reference reproducible at design level

Priority P2. Locations: `programmes-practice-and-resources.md:21` (P13), `visual-and-investigation-contracts.md:53` (D37) and `:76` (L12), and `design-fixtures.md`'s reverse-conditioning and L12 sections. The corrected static A/B/C example is complete and correct: both supplied conditional mass vectors normalize, the mixture is `[.175,.35,.475]`, and proportional acquisition is `[16/7,4/7,16/19]`. Its explicit separation from history-fitted densities resolves the earlier false-fit risk. Do not change that example merely to close this finding.

The separate new P13/L12 operation currently promises a declared startup, quantile/tie/nonempty partition, categorical smoothing, fixed proposal support and deterministic tie, but does not give their actual rules or a concrete starting history/constructed evaluator. These rules determine the displayed membership, masses and next proposal. For example, with ordered observations `(A,.1),(B,.2),(C,.2),(C,.4)`, keeping the best two observations versus including all observations tied at the boundary creates better groups of size 2 versus 3. Add-one categorical smoothing over A/B/C then gives `[.4,.4,.2]` versus `[1/3,1/3,1/3]`. Neither can be recovered from the word quantile alone. This is a new bounded design example, not a criticism of the supplied D37 arithmetic or modern Optuna.

Record a small complete finite reference contract, without implementing a continuous Parzen estimator:

- Finite ordered support, initial history or startup proposal sequence/count, and the actual constructed loss table evaluated when a proposal is accepted. Repeated-setting observations need a declared treatment.
- Exact better-group count/threshold, loss ties and small/empty/all-equal-history behavior. Explain whether the mixture weight is the requested gamma, an effective finite partition fraction, or a separately declared modelling prior; do not silently use two meanings of gamma.
- The categorical smoothing formula and supported smoothing domain. Define zero/empty density and zero-mixture handling if zero smoothing is allowed; otherwise constrain it explicitly. State next-proposal and acquisition ties.
- One numeric default history → partition → l/g → acquisition → proposal → newly observed loss → updated history, plus the promised null/changed cases. These need only a short exact design trace, not new learner code, scientific fits, research or a browser.

Compose these choices into P13/L12 and the fixture owner. Retain the separation among this educational finite SMBO, the original continuous/tree Parzen algorithm, and the exact retained Optuna programme. The already promised one-to-three local controls remain history/gamma/smoothing; completing fixed policies does not require another control panel.

## Entire review scope and attribution

I read the complete current `reading-flow-design.md`, all 41 drawing contracts and all 14 investigation ownership groups in `visual-and-investigation-contracts.md`, all 15 programme and 23 practice contracts in `programmes-practice-and-resources.md`, the entire research/access ledger, annotated resources/ownership decisions, concrete design fixtures and author-design review. I also read the complete current freezer, complete arithmetic checker and density supplement checker to distinguish actual observations from future promises. I did not run any author checker.

I personally read all 898 lines of the actual original JSX lesson, recovering its prose, equations, ten full task prompts/solutions and ending resources across bounded reads. I read all three complete decoded source/stdout bodies in `validation-examples.js` and the entire current blueprint. I read the whole incoming ensemble note and its historical dispositions. I checked the current vocabulary, actual KNN §§4–5, ensemble §§7/9, Regularization path/information-criterion passages, AutoML opening/evidence-loop/fidelity ownership and its scoped blueprint. This is not a new whole review of those neighbouring lessons or of the original CV runtime's figures/labs/native evidence.

Feature20's accepted revision5 is my earlier whole-content review plus SAME F1/F2 closure; I reuse that reading honestly. The current acceptance binds the same `cabb07a5…` manuscript and `fac6974a…` specifications. Its runtime remains in progress, so the proposed local fit/freeze/transform refresher is essential. No reader is required to find an unpublished Feature20 runtime. Historical native/scientific CV and ensemble receipts remain attributed inputs, not observations I personally reran or witnessed.

For the new uncertainty claim I independently reopened the primary Bates–Hastie–Tibshirani v4 paper, specifically Theorem1 and Lemma3. The conditional-independence result is restricted to the homoskedastic Gaussian linear/OLS squared-loss and linearly invariant estimator setting, conditional on X. The design's bounded use and separate holdout identity respect that restriction. Its local finite identity is not the paper's entire nested inference procedure. [Primary paper](https://arxiv.org/pdf/2104.00673). No full new paper-reading or research campaign is claimed.

## Beginner flow and preserved content

The title/stable topic identity and eleven main sections are retained. The first-pass route through §§1–6, practical §9 and practice/readiness is coherent: which rows teach a model; fresh folds and preprocessing; matching the future use; noise-sensitive selection and protected assessment; selecting a candidate space; then reading the real retained protocol. Sections7/8 remain visible deeper branches rather than prerequisites for starting. The shared compass and recognizable ending roles avoid another custom table of contents.

The proposed problem remains concrete species classification on the same offline 344-row Penguins data, with four numerical measurements and sex as features. IDs, island/year and target roles are separated. Missing entries remain in the experiment and training-only imputation is explained rather than erased. The design does not convert a random-row demonstration into evidence for new islands or seasons. Data creators, CC0 provenance and scientific versus instructional questions remain distinct.

The exact historical bodies and displayed streams are conserved: `cv_tiny.py` 988/106 bytes, `cv_penguins.py` 3279/291 bytes, `cv_optuna.py` 984/112 bytes. Fresh decoding checks match the retained hashes and stdout values. Original ten tasks remain within the exact unchanged JSX, including optional hints where originally authored. Display strings omit the terminal process newline; Optuna trial INFO stderr/full history were not retained. Neither a full raw process-stream claim nor invented omitted trial records is allowed. The CRLF current CSV versus historical LF-normalized data identity remains explicit. There is no scientific replay.

The new thirteen practice contracts meaningfully extend the ten originals: fitted state, nonlinear metric aggregation, row/person weighting, label arrival, index mapping, finite replacement sampling, conditional branch priors, a complete score/cost/failure selector, shared covariance, the conditional holdout identity, bootstrap diagnosis, integer Hyperband and a changed deployment report. N8 is now sufficiently concrete to solve: complete finite scores, failed C, declared cost cap and stable ties produce B/refusal/changed-A cases. N11 must inherit F1's chosen statistic. Solutions, hints and open-task criteria are still content work, not claimed complete now.

## Drawing and investigation assessment

Every current drawing contract has been assessed; this table records their teaching roles rather than claiming paint quality.

| Drawing contracts | Assessment |
| --- | --- |
| D01–D03 | Actual feature/target/row anatomy, inner/outer dependencies and three risk targets establish what changes and what remains fixed. A score arrow cannot flow backward from protected assessment. |
| D04–D08 | Remainder-safe folds, visible source-row nearest-neighbour predictions, row/fold weighting, fitted preprocessing state and nonlinear F1 expose distinct operations. D07's median2/filled mean2/population variance2 and held transformation are consistent. |
| D09–D15 | Rare-class support, new-person versus known-person futures, irregular event/arrival timing, joint masks, coverage, warm-up absence and source/local index mapping preserve actual information boundaries. A splitter name is not used as a guarantee. |
| D16–D21 | Finite candidate selection optimism precedes notation; protected assessment, exact nested dependencies, changed train versus held labels, fresh refit and early stopping have separate responsibilities. Assessment invariance is stage-specific, not falsely universal across every outer fold. |
| D22–D26 | Conditional candidate cards, important-coordinate projections, log-uniform mass and finite replacement distinctions show what search actually samples. Neither random search nor a probability-mass calculation becomes a score-optimality theorem. |
| D27–D29 | The real candidate/state/split/prediction record remains inspectable; outer assessment, final development selection and tie order are different objects despite coincident printed digits. No new optimum or scaler superiority is inferred. |
| D30–D35 | Different training sizes/conditional targets, mean-predictor optimism, shared shocks, fixed-rule LOO, bootstrap multiplicities and holdout MSE provide specialist depth with explicit assumptions. F1 completes the new whole-bootstrap branch; the existing absence/distinct arithmetic is sound. |
| D36–D38 | Belief distributions and EI expose contributions, reverse conditioning has full supplied support, and retained Optuna output demonstrates one budgeted search. F2 completes the separate history-driven operation, without pretending its masses are D37's supplied beliefs. |
| D39–D41 | Paid versus hindsight entries, genuine state continuation versus restart, rounded multi-bracket Hyperband and complete fit counts are differentiated. Fit counts do not become measured speedups. |

The proposed figures use rows, matrices, state objects, candidates, histogram masses, loss contributions, masks and dependency arrows rather than sentence cards. Colour roles are blue T/train, rose V/validation and violet A/assessment, with labels/masks carrying the same meaning; amber focus is separate. Role colours may change when a row changes role. Metric geometry gets named axes/scales, and grouping/layout are not silently numerical distance. The proposal explicitly requires local wrapping/scrolling, keyboard equivalents, visible exact values, label clearance and desktop/phone inspection. Those are implementation requirements, not current native acceptance.

L01–L04 separately expose editable row lineage, two-column fitted-state cause, the three information questions and coverage/source mapping. L05/L06 expose actual candidate patterns and the selected nested state. L07/L08 directly edit finite acceptable support, distribution endpoints and score/cost cells instead of selecting descriptions. L09 has exactly a,b,K. L10's separated mean and procedure views need F1. L11 has incumbent plus two mass tables. L12's history/gamma/smoothing needs F2. L13 separates loss trajectories from allocation and conditional continuation cost. L14 separates exact fit accounting from the declared concurrency/memory illustration. The current decompositions supersede earlier longer control wording, keep one-to-three changing quantities per adjacent view, and preserve reset/invalid-state/null requirements. Fourteen IDs are ownership groups, not a lab-count quota or permission to hide unrelated questions behind modes.

## Whole programme ownership and specialist checks

| Contract | Assessment |
| --- | --- |
| P01 | Retained splitter is a complete hand baseline. Its broadcast/tie convention is explained; no optimized general KNN claim. |
| P02 | Complete ordinary Pipeline/ColumnTransformer/GridSearchCV route owns the real experiment. Train-only state, exact candidate order, outer/final ties, majority baselines and complete saved record are preserved. |
| P03 | Complete original guarded dependency is supplied; its larger search space and retained development-only result are qualified. No silently improved substitute or missing INFO invention. |
| P04 | Transparent mixed fit/freeze/transform/KNN/evaluator is appropriate local scratch ownership. Unknown categories, constant scale, class/source ties and all-missing-column refusal are explicit. Ordinary parity is restricted to legal matched/nonambiguous fixtures; differing conventions must be explained. |
| P05 | Explicit indices own availability, joint masks, coverage and alignment. Different named splitters are compared under their actual contracts; metadata routing is optional. |
| P06 | Exhaustive candidate/outcome enumeration is a complete statistical mechanism; no fake need for a separate estimator API. Exponential cost is disclosed. |
| P07 | Fresh nested orchestration reuses the named displayed guarded P04 primitive. Ordinary composite search is matched; outer refit and final all-development reselection remain separate. F1 must specify any bootstrap extension. |
| P08 | Actual enumeration, conditional mass, RNG and stable endpoint-aware hit arithmetic own the scratch route. Ordinary sampling semantics and list/distribution differences are explicit. |
| P09 | Scratch selector plus a new ordinary callable-refit/failure audit closes a useful API gap. `best_score_` absence, scoring direction, refusal and full truthful diagnostics require later execution, not this design check. |
| P10 | Exact finite proof models and covariance comparisons are honest alternatives to a library estimator. Centered shocks and nonnegative losses are distinguished. |
| P11 | Appropriate deeper mechanism, but the resampled functional/duplicate split contract needs F1. No universal bootstrap confidence claim is made. |
| P12 | The finite conditional holdout identity is complete at its stated boundary and includes a potentially negative individual subtraction. It is not a full inference algorithm. |
| P13 | Appropriate finite educational SMBO scope, with full original P03 as the ordinary route; needs F2's fixed policies/trace before being a reproducible complete design. |
| P14 | Scheduler owns paid observations, deterministic cuts, hindsight isolation and exact original integer brackets. Resumption requires stored state. |
| P15 | Bounded new ordinary experimental halving audit is appropriate, with eligible resource separate from search, explicit folds and actual result/resource logging. It does not promise resumed training or method rankings. |

The design correctly separates algorithmic costs from measurements. P04's naive full sort and P01's broadcast are disclosed rather than called optimal. Mixed dense one-hot cost includes vocabulary/output width; the actual implementation must refine its cost if its representation differs. P07 counts complete fits with varying training sizes. Finite enumeration trades scale for transparency. Hyperband fresh totals78 versus genuine-continuation69 follow rounded original brackets; no universal budget or speed ratio is implied. Original76 pipeline fits plus3 baselines remain distinct.

The uncertainty branch has useful depth without imposing an outside statistics course on the first pass. Covariance is about losses, not training overlap; descriptive fold spread is not an independent-fold standard error; the always-zero LOO counterexample remains. Repeated partitions do not create new independent people. Conditional fitted-model error, recipe risk at training size m and selected-procedure risk are differentiated, and the Gaussian OLS theorem is not generalized to every learner. A negative finite holdout-MSE subtraction is not clipped into a confidence claim.

## Sources, continuity and exclusions

The access ledger distinguishes complete ISLP Chapter5 notebook intake, scoped official CV/search/API treatment, original paper sections and failed full-ESL access. The front-matter section map is not represented as chapter derivations. Reuse of applicable inspected source roles is preferable to another broad research campaign. Version-sensitive ordinary routes still require their eventual actual programme/library checks; this review does not establish those executions.

Further learning is distinct from technical references. The annotated ISLP notebook, nested-Iris example and halving example have concrete reading activities and prerequisite/access scopes. Official lecture playlists are described as authors' companions checked via the official course page and accompanying notebook, with no watched-video, verified-timestamp or per-video technical endorsement claim. That is an honest limited role, rather than a metadata-based correctness certification; the written notebook supplies the direct accessible chapter route. Core learning does not depend on a video.

The incoming ensemble findings were already repaired in the published CV lesson. The design properly preserves their historical status while extending index alignment. KNN's earlier complete estimator, held-out objective and tie conventions are actual inspected prerequisite teaching. Regularization already owns paths/AIC/BIC/MDL; the design bridges their different assumptions and avoids another solver. AutoML already applies conditional spaces/fidelity to broader choices, including Hyperband; local CV scheduler ownership is justified as transparent general resource accounting rather than a claim that the neighbour lacks it. No duplicate destination queue is needed. More complete inference, spatial/causal transport, GP kernels, BOHB/ASHA and NAS remain named further study with stated scope reasons.

## Evidence boundary and next action

`check-whole-design.py` ran once, actual command result `b5d363`, exit0. Its new `whole-design-check.json` has119 conditions and61 target/input bindings: all60 frozen inputs, protected28 original/six supplemental copies, exact three decoded code/streams, unique contract sets and the two new narrow counterexamples. Identity/count checks support conservation; they do not substitute for the full reading recorded above. The author's164-condition arithmetic and five-condition density observations are reused with their actual source scopes and later wording composition. They were not rerun or inflated into runtime evidence.

Keep the previous NMF whole review SHA309461dd… immutable; its final guard still matches. This review created only its independent-owner evidence. No manuscript, new learner programme/stream, scientific main, library fit, old verifier, Vite build, HTTP/native review, normal integration or phase action occurred.

Next: author one bounded F1/F2 design correction with explicit fixtures/policies, preserve this frozen proposal/review and all original bodies, then return its exact successor for SAME bounded closure. Root decides whether and when to release writing. No new whole-review campaign is required for a correction confined to this set.
