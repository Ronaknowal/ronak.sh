# Cross-Validation: consolidated F1/F2 design correction

This is a bounded successor to the complete proposal `author-ready-design.json` (0b36c78f…) and DIFFERENT whole-design review `independent-review/whole-design-review.md` (d0ca0d56…). It changes only the incomplete policies below. The original proposal, review, scientific sources/streams and prior arithmetic receipts remain immutable. This is design, not the new manuscript, learner programs, runtime or a writing release.

The following **replaces** the underspecified policies in P11/D34/L10/N11 and P13/L12; read those original rows with these exact contracts. Other content/visual jobs and the static D37 A/B/C calculation remain unchanged. The frozen proposal is not silently rehashed as if it had contained these choices.

## F1: which functional does the whole-procedure bootstrap repeat?

The mean/multiplicity picture stays as designed: resampled source IDs `[0,0,2,2]`, weights `[2,0,2,0]`, distinct IDs0/2 and out-of-bag IDs1/3. It has a different purpose from the adjacent complete selection/refit picture. Draw their actual inputs separately before introducing their statistics.

### Define the entire tiny recipe, including the output

Use this **constructed**, numerical-only source table, independent of Penguins and the original mean-statistic example:

| Original source ID | x | Binary target y |
| --- | --- | --- |
| 0 | 0 | 0 |
| 1 | 1 | 0 |
| 2 | 2 | 1 |
| 3 | 3 | 1 |

The procedure statistic is **the class-1 vote fraction at the fixed future query x=1.5, after choosing and refitting a uniform Euclidean KNN recipe on the resampled development multiset**. Call it T(D*). The internal pooled accuracy chooses the recipe; it is not T, an external test score or a confidence level. Return T alongside candidate eligibility, inner predictions/scores, selected k and final fitted preparation state. This makes the distinction visible instead of returning an unexplained “bootstrap score.”

Candidates have fixed order k1 then k2. Each candidate uses the already taught local training-only numerical preparation: median imputation and population standardization; a constant filled column has scale1. No entries are missing in this four-source fixture, but the P04 helper's missing/schema policies remain unchanged. Every occurrence, including a duplicate, contributes to fitted medians, means, variances, neighbour voting, pooled validation accuracy and the final refit. Do not deduplicate the data or normalize each distinct source to equal mass.

### Keep occurrence and source identities distinct

Retain (a) each displayed resample position, (b) its original source ID, and (c) a copy ordinal0…multiplicity−1 within that original ID. Distances tie by original source ID then copy ordinal; class-vote ties choose class0. Reordering the same input multiset changes displayed positions but not the fitted result. Source ID/copy ordinal are metadata, never numerical features or independent-subject claims.

For this **defined functional**, sort the distinct original IDs and assign them alternately to two held folds: sorted positions0,2,… in fold0 and1,3,… in fold1. All copies of an original source belong to its one held fold. The other fold's occurrences are training data. Fit fresh preparation for each candidate/fold, predict held occurrences and pool correct counts over the complete resampled multiset. This is intentionally **source-grouped internal selection**; it defines which empirical functional is resampled. It is not a universal correction for bootstrap validity, and it does not turn copied measurements into independent new observations.

A candidate is structurally eligible only if k does not exceed the training-occurrence count in **either** fold. Exclude ineligible candidates explicitly; never silently change k. Choose maximum pooled accuracy, breaking ties by fixed candidate order, then fit fresh preparation and the selected KNN on **all** resampled occurrences and evaluate x=1.5. Single-class training sides are allowed for this binary accuracy/vote calculation; no ROC, probability calibration or stratification guarantee is inferred. The fixed class vocabulary stays0/1, even when one is absent.

### Default, changed and refusal traces

- Default `[0,0,2,2]`: fold0 holds both source0 copies, fold1 both source2 copies. Each candidate trains on two identical opposite-class rows, so both pooled accuracies are0. k1 wins the declared tie. Final mean1, variance1, query standardized .5; source2 is nearest, so **T=1**. Final resubstitution accuracy1 is a separate diagnostic and does not replace the internal score0.
- Changed `[0,1,2,3]`: fold0 holds sources0/2, fold1 sources1/3. k1's held correctness counts are1/2 then2/2; pooled accuracy3/4. k2's counts are1/2 then1/2; accuracy1/2. Choose k1. Final mean3/2, variance5/4. Query1.5 is equidistant from sources1/2, so original source-ID tie chooses source1/class0: **T=0**. This traces the complete input→preparation→selection→refit→query operation, including the changed result.
- Permuting the default multiset is a null case: weights, source-grouped folds, scores, final state and T remain the same. Changing a multiplicity can change preparation, selection or the query even if the distinct identities stay fixed.
- `[0,0,0,0]` has one distinct identity: **undefined whole-procedure statistic** because two nonempty source-grouped folds cannot be formed. Retain that result; do not redraw. `[0,0,0,2]` has two folds but k2 is ineligible on the training side containing only source2 once; k1 remains eligible. This is a useful visible eligibility change.
- Reject unknown source IDs, noninteger/negative counts, mismatched occurrence/target identities and an empty sample with a labelled refusal. Do not silently impute invalid IDs or create absent independent observations.

The sampling law remains four independent draws with replacement from the four original IDs:256 equally likely ordered resamples. Exactly four constant-ID resamples are undefined under this functional, probability1/64. Report undefined mass separately; a distribution conditional on defined draws must say so. No hidden rejection sampling or unqualified bootstrap confidence interval is permitted. Descriptive resample variability is not by itself new-person generalization evidence.

P11 implements this complete tiny functional using the named P04 preparation/prediction primitives and explicit local orchestration; it does not call P07's ordinary distinct-index validator with duplicated IDs. Its adapter validates unique **occurrence** positions, separately enforces source-group membership, and keeps original IDs in prediction records. Include both the mean and this complete functional in the same explained learner file with guarded main, not a new general-purpose bootstrap framework. The group-unit extension separately replaces the sampling unit by an original group ID, includes all of its rows for each group copy, and holds all copies of an original group together in internal folds; too few distinct groups returns undefined. Its validity still needs the stated scientific unit/model.

D34/L10 draw the four source rows, occurrence arrows/multiplicities, the two source-grouped held masks, actual candidate neighbour/prediction paths, selected final preparation state and query vote. One occurrence-list/weight editor is enough for the whole-procedure view. Mean-statistic inspection remains adjacent, not a mode switch. N11 asks learners to diagnose the occurrence-position split counterexample from the review (accuracy1 versus source-grouped0), compute the changed T, and explain why omitting undefined draws changes the reported law. Its eventual manuscript must supply hints, reasoned solution and success criteria; they are not claimed written by this design.

## F2: a complete finite history-driven SMBO operation

P13/L12 remains an **educational categorical SMBO reference**, separate from continuous/tree Parzen estimation and modern Optuna. The original Optuna program/stdout is unchanged. D37's supplied l/g masses `[.4,.2,.4]`/`[.1,.4,.5]`, γ.25 and acquisition `[16/7,4/7,16/19]` also remain unchanged: those are a separate, normalized arithmetic example, not the following history fit.

### Fixed support, history, startup and evaluator

Support and proposal-tie order are A,B,C. The constructed deterministic evaluator returns losses **A=.1, B=.2, C=.4**, lower is better. These are invented hand-example values, never measured benchmarks. Repeated proposals are allowed and return that same setting's stated loss. Every observation remains one trial in the history; do not silently collapse repeated settings or call repeated deterministic evaluations new evidence about noise.

Each history row has a unique immutable trial ID, supported setting and finite nonnegative loss. Editing a row preserves its ID; appending assigns the next ID. Unsupported settings, duplicate trial IDs or nonfinite/negative losses produce an explicit error and no appended trial. The history editor may change observed losses for diagnosis; the **next newly evaluated** proposal still uses the stated fixed evaluator. Say so when an edited observation differs from that evaluator.

For fewer than four observations, propose the next entry of fixed startup sequence `[A,B,C,C]`, indexed by current history length; display this as startup, with the uniform prior over A/B/C, not a fitted better/other split. Reset restores the complete four-row default history `(0,A,.1),(1,B,.2),(2,C,.4),(3,C,.4)`. Empty history is therefore supported: successive acceptance of the four startup proposals creates that default. Accept/Step is an action on the already taught proposal, not another model-quantity control or a learner prediction gate.

For n≥4, if all losses are identical, use an explicitly labelled **uninformative uniform-prior state**: no better/other membership is claimed, both masses are1/3 and proportional acquisition1, proposal A by support order. γ and smoothing are null in this state. It avoids assigning evidence to a wholly arbitrary loss tie. A nonuniform proposal from a continuous TPE implementation is outside this reference's contract.

### Partition, smoothing and finite mixture

For the ordinary n≥4, not-all-equal case, sort trials by (loss, immutable trial ID). Requested better fraction γ lies in `[.1,.9]`; define **m=max(1,min(n−1,floor(γn)))**. The first m observations are better, even when a boundary loss is tied; the remainder are other. Do not include all boundary ties: explain that this fixed-count convention is one declared educational choice. Both groups remain nonempty.

The actual mixture weight is **π=m/n**, the effective finite partition fraction. γ is the requested quantile fraction, not silently reused as π when rounding differs. Display both in the same live sentence; formal notation must name the distinction before using it.

With positive smoothing α in `[.25,2]`, let c_l(s)/c_g(s) be the trial counts for setting s in each group. Define `l(s)=(c_l(s)+α)/(m+3α)` and `g(s)=(c_g(s)+α)/(n−m+3α)`. All three support masses are present, normalize and are strictly positive. Define marginal `p(s)=πl(s)+(1−π)g(s)` and proportional acquisition `a(s)=l(s)/p(s)`. No zero-mixture division exists in this supported domain; zero smoothing is refused rather than silently assigned a fallback. Enumerate all three settings and propose maximum acquisition, ties by A,B,C. The acquisition is not a probability and may exceed1.

### Exact default update and changed/null cases

At default n4, γ=.5, α1, m2 and π=.5:

| Setting | Better count | Other count | l | g | p | l/p |
| --- | --- | --- | --- | --- | --- | --- |
| A | 1 | 0 | 2/5 | 1/5 | 3/10 | 4/3 |
| B | 1 | 0 | 2/5 | 1/5 | 3/10 | 4/3 |
| C | 0 | 2 | 1/5 | 3/5 | 2/5 | 1/2 |

Choose **A** by the declared acquisition tie. Accept it once: evaluator loss.1 appends `(4,A,.1)`. Now n5, requested γ=.5 still gives m2 but effective **π=2/5**. Better trials are the two A observations; other trials are B,C,C. New l=`[3/5,1/5,1/5]`, g=`[1/6,1/3,1/2]`, p=`[17/50,7/25,19/50]`, acquisition=`[30/17,5/7,10/19]`; propose A again. Repeating a deterministic setting illustrates this reference's limitation; do not claim exploration or global optimization.

Changed original history A loss.5 (other rows unchanged) gives better B and the earlier C, other the later C and A: l=`[1/5,2/5,2/5]`, g=`[2/5,1/5,2/5]`, p=`[3/10,3/10,2/5]`, acquisition=`[2/3,4/3,1]`; proposal **B**. The accepted next loss is.2 from the unchanged constructed evaluator.

Changing default B loss.2→.25 does not cross membership or tie order, so densities/acquisition/proposal are unchanged: a genuine null case. Changing requested γ=.5→.25 on the original history yields m1, π1/4, l=`[1/2,1/4,1/4]`, g=`[1/6,1/3,1/2]`, p=`[1/4,5/16,7/16]`, acquisition=`[2,4/5,4/7]`. Show these actual values, not the separate static D37 fixture. Balanced histories with equal l/g give acquisition1 across support. All-equal losses and short histories have the separately declared computed states above, with no hidden division or invented observation.

L12 has only history, requested γ and smoothing α as changing quantities. Draw trial IDs and actual better/other row membership, the three support columns and counts, normalization denominators, effective π, per-setting mixture/division paths, proposed card and its newly appended observed loss. The picture precedes the hand table and equation. Startup/uninformative states are computed consequences of the history, not a mode selector. Include reset and keyboard-accessible edits, keep all current values visible and retain invalid-history feedback. P13 implements exactly these rules and reports their limits; its eventual content must explain every intermediate operation and provide its complete scratch code/output. The EI mass-table helper stays separate with its original declared inputs.

## Review boundary

The correction arithmetic checker evaluates only these constructed hand fixtures, finite counts and rational probabilities. It does not run old programs/checkers, load Penguins, train library estimators, create manuscript/runtime content, or validate native interaction. Author reading must check the source/occurrence distinction, each complete default/changed trace and the γ/π distinction in this composed design. Return this exact successor to the SAME independent reviewer for bounded closure before Root releases writing.
