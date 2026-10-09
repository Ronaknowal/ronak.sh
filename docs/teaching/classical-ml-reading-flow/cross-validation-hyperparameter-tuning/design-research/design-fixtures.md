# New exact design fixtures

These are constructed hand-calculation inputs for the Cross-Validation design. `check-design-arithmetic.py` verifies the stated arithmetic with the Python standard library and writes `design-arithmetic.json`. They are not learner programmes, library runs, empirical results or browser checks. Retained scientific programmes and their recorded outputs are not executed.

## Fitted state, metrics and information boundaries

For D07/L02/N1 use training values `[0,2,missing,4]`. The observed median is2; filled training is `[0,2,2,4]`, population mean2 and variance2. Held-out `[10,missing]` becomes `[4√2,0]`. Changing the held value10 to100 changes its transformed value to49√2 while leaving the fitted state unchanged. Changing training4 to6 changes the training variance to19/4 and mean to5/2; this is a different fitted state. Define missing masks before filling and do not include source IDs as features.

For D08/N2 the confusion tables in `(TP,FN,FP,TN)` order are `(1,1,0,0)` and `(0,0,1,1)`, each on two observations. With zero-denominator F1 defined as0, the fold values are2/3 and0, their mean1/3. Pooling counts gives `(1,1,1,1)` and F1=1/2. Equal fold size alone does not make nonlinear aggregation commute. N3's four correct records for personA and one incorrect record for personB give row accuracy4/5 and equal-person accuracy1/2; the estimand chooses the reporting unit.

For D11/N4 use original IDs0–5, event times `[0,1,2,5,8,9]`, decision time5, strictly earlier training events and inclusive arrived-label boundary. At delay3 the permitted IDs are `[0,1,2]`; at delay4 they are `[0,1]`. Event5 is never a training event at this decision time. For D15/N5 the outer-training source IDs are `[1,3,5,7,9,11,13,15]`; inner positions `[0,2,4,6]` map to `[1,5,9,13]`. Keep source identity, local index and target aligned.

## Finite sampling and predeclared refit

For D26/L07/N6 use six distinct candidate IDs, two acceptable and three draws. Among20 unordered three-card samples without replacement, four miss, giving4/5 hit probability. Among216 equally likely ordered replacement samples,64 miss, giving19/27. At no draws the hit probability is0; with all six distinct cards drawn and at least one acceptable it is1. N7 chooses either a two-setting or eight-setting branch with probability1/2, then uniformly within that branch: each setting has mass1/4 or1/16. These are sampling probabilities, not probabilities of model correctness.

For P09/L08/N8 use the following **constructed selection table**, separate from all retained penguin results. Accuracy is higher-is-better; costs are declared abstract units, not measured time. The eligibility rule is fixed before observing the protected assessment: all three accuracy cells must be present/finite and mean cost must not exceed5. Select highest mean accuracy among eligible rows, breaking ties by original candidate order. Do not replace a failed cell with0 or average only successful folds.

| Candidate | Three fold accuracies | Three costs | Mean accuracy / cost | Initial decision |
| --- | --- | --- | --- | --- |
| A | .80, .90, .70 | 9,11,10 | .80 /10 | Ineligible on cost |
| B | .85, .80, .90 | 2,3,4 | .85 /3 | Selected, index1 |
| C | .95, .94, failed | 1,1,1 | Undefined /1 | Ineligible on failure |

At cap2 there is no eligible candidate: return an explicit refusal. At cap10 B still wins. At cap10 after changing A's scores to`.90,.95,.85`, A wins with mean.90. Editing a separately recorded recall column has no effect on this fixed accuracy/cost rule. Under callable-refit GridSearchCV, teach `best_index_` and explicitly read the selected metric; absence of `best_score_` is an API contract to verify in the new ordinary-route execution, not a result from this design checker.

## Covariance and the deeper holdout identity

For D32/L09 use independent fair signsS,E1,…,EK and centered shocksZk=aS+bEk. The common part of their mean is unchanged by averaging. At a²=b²=1/2,K4, per-fold variance is1, mean variance5/8 and the falsely independent comparison1/4. N9 changes a²=1/5,b²=4/5,K5: mean variance9/25=.36 versus1/5 under independence. These are centered illustrative statistics, not negative observed errors. Enumerate the two shock components separately to verify the variance formula without introducing floating-point square roots.

For D35/P12/N10 condition on the training data. The training-only estimateA=1/4 and true fitted-model errorμ=1/2 are fixed; two independent held losses are fair0/1. Their mean has support0,1/2,1 with masses1/4,1/2,1/4. Expected squared discrepancy is3/16, variance of the held mean1/8, and `(A−μ)²=1/16`. On the particular outcome held mean0, the discrepancy is1/16; subtracting the **known conditional variance**1/8 gives−1/16. A nonnegative expectation does not imply every individual subtraction is nonnegative. Do not silently clip it or call it a complete confidence interval algorithm. Dependence changes the variance term; it is not repaired by the word nested.

## Reverse conditioning with complete finite support

For D37's static arithmetic example, explicitly supply settingsA/B/C with better-conditioned massesl=`[.4,.2,.4]` and other-conditioned massesg=`[.1,.4,.5]`, and γ=.25. Each conditional distribution sums to1; the marginal setting masses areγl+(1−γ)g=`[.175,.35,.475]`. Dividingl by that mixture gives`[16/7,4/7,16/19]`. These proportional acquisition values may exceed1; they are not setting probabilities. Preserve the retained A/B values while showing C so a finite mass picture is actually normalized. This supplied belief is separate from P13's history-derived, smoothed categorical model and is not a claim of fitting those distributions to an unrelated history. Its new three-support normalization is checked separately from the earlier immutable arithmetic receipt.

## Hyperband integer rounds and paid work

Use original Algorithm1's floors/ceilings, not scikit-learn's distinct scheduling policy. With maximum resourceR9 and factorη3, smax2 and nominal bracket allowanceB27:

| Bracket | Initial candidates/resource | Evaluated candidates by round | Resource per surviving candidate | Fresh total | Genuine continuation total |
| --- | --- | --- | --- | --- | --- |
| s2 | 9 /1 | 9,3,1 | 1,3,9 | 27 | 21 |
| s1 | 5 /3 | 5,1 | 3,9 | 24 | 21 |
| s0 | 3 /9 | 3 | 9 | 27 | 27 |

Totals are78 for fresh evaluations or69 only if the evaluator actually retains and extends surviving state. Rounding makes bracket work unequal. Distinct brackets draw their own configurations; do not falsely describe them as one shared candidate pool. The no-early-elimination comparison must match the specified initial candidate set and final resource; this table is not a measured runtime comparison. D39's separate nine-candidate10/30/90 tournament retains fresh270, genuine continuation210 and all-nine-at90 cost810.

Changed R27,η3 gives smax3,B108 and starts `(27,1),(12,3),(6,9),(4,27)`. The checker enumerates every rounded round and both paid-work conventions. A slow starter A with losses`.30,.25,.24` and B with`.40,.20,.10` reverses ranking despite both improving; B's later loss is hindsight if it was eliminated at the first rung. Keep eliminated future cells absent in the decision view.

## Simple local control ownership

The fourteen existing investigation IDs name teaching questions, not fourteen dashboards. Their final implementation may contain adjacent small subinvestigations where necessary. Each local view has one to three changing quantities, already explained, directly below its picture; no mode selector conceals a second question. Selecting a row/mark is inspection, not a licence to add an unbounded parameter panel.

| Existing owner | Concrete small-view decomposition |
| --- | --- |
| L01 row lineage / splitting | First keep folds fixed and edit a selected observation's x and y. Then a separate adjacent fold-construction view varies K, shuffle and seed with the data fixed. Both preserve row IDs and expose current predictions. |
| L02 fitted-state boundary | Edit the training numeric column and held-out numeric column; fixed masks/schema and inspected-row focus. Do not mix fold assignment or estimator selection into this view. |
| L03 legal future information | Separate adjacent new-person, forward-time and joint-boundary views after teaching each task. Each exposes the relevant record table, held subject or decision time, and delay as needed. Do not hide the task distinction in an unexplained scenario mode. |
| L04 coverage / local positions | One explicit split-index editor with immediate coverage/absence. A separate adjacent source-ID mapping view edits outer source IDs and inner local positions. Full-OOF validity is a computed diagnostic, not a mode that fills absent predictions. |
| L05 criterion selection | Edit the four validation labels and actual candidate prediction patterns; use fixed declared tie order, with an independently taught tie-order extension only if useful. |
| L06 nested dependency | Fix candidate order and the illustrated outer fold; edit one observed x/y row and display selected state. A separate fold-inspection view traces other original indices without changing the experiment. |
| L07 finite draws / distributions | Finite view edits acceptable-card membership, draw budget and seed; display both replacement probabilities side by side. A separate log-uniform view edits the two positive endpoints. Neither is a display-mode switch. |
| L08 refit decision | Edit the score/cost table and cost cap; fixed declared tie order/criterion. Additional metric columns stay visible but do not silently become the objective. |
| L09 covariance | a,b,K are the three controls; all covariance cells and both compared variances derive from them. |
| L10 resampling | Edit the resampled source-ID list/weights for a stated statistic. A separate whole-procedure view repeats selection/refit; group resampling is a separately explained extension with its actual unit visible. |
| L11 acquisition | Incumbent and the two actual predictive mass tables are the three changing quantities. All means and EI contributions stay visible. |
| L12 reverse conditioning | Edit observed setting/loss history, γ and smoothing; proposal support and tie policy fixed. Initial supplied density arithmetic is a separate static worked example, not a purported fit to an unrelated edited history. |
| L13 paid resource | One small view edits trajectory table with schedule/tie order fixed; the adjacent allocation view edits initial count, maximum resource and factor. A separately explained fresh-versus-continuation cost comparison is shown simultaneously, conditional on actual retained state. |
| L14 fit count / concurrency | Fit-count view varies candidate count, inner folds and outer folds; final refit and baseline terms remain explicit. A separate schedule view varies workers with the job ledger and declared memory model fixed. Never imply measured speedup. |

These decompositions preserve all promised operations while keeping each causal question readable. They supersede any longer combined control list in the earlier L01–L14 row wording; the final visual contracts link here explicitly. They do not prescribe a lab-count quota or remove reset/keyboard/exact-value/error requirements.
