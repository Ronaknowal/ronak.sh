<a id="4-selection-can-learn-the-validation-answers"></a>
## 4. Selection can learn the validation answers

### Four fair labels expose the mechanism

Suppose four validation labels are independent fair bits and features reveal none of them. Compare two fixed rules, all-zero and all-one. Enumerate every possible outcome before introducing an expectation.

<!-- Drawing D16: visual-specifications.md#d16. -->

Each of the sixteen four-bit rows has probability 1/16. The drawing shows both correct counts, the selected rule and the selected count. When labels are `[1,1,1,0]`, all-one scores 3/4 and wins. Its predictions on independent fresh fair labels still have expected accuracy 1/2. Choosing from observed validation labels changes which rule we report, but provides no information about independent future bits.

| Number of ones | Number of outcome patterns | Best correct count |
| --- | ---: | ---: |
| 0 or 4 | 2 | 4 |
| 1 or 3 | 8 | 3 |
| 2 | 6 | 2 |

Average the displayed selected scores: `(2×4+8×3+6×2)/(16×4)=11/16=0.6875`. The future expectation remains 0.5. If candidates include all sixteen prediction patterns, one matches every observed validation outcome perfectly, making selected score 1, still with fresh expectation 1/2. Adding a duplicate all-zero rule instead changes no maximum. Candidate dependence and flexibility matter; a raw trial count does not imply a fixed optimism penalty.

More formally, let Sⱼ be a candidate's observed validation accuracy. The comparison reports `maxⱼ Sⱼ`; expectation and maximization do not generally commute. For every j, `maxᵣ Sᵣ ≥ Sⱼ`, so `E[maxᵣ Sᵣ] ≥ maxⱼ E[Sⱼ]`. In this example the inequality is strict. This explains an average selection effect, not a promise that every selected score exceeds every later test score. The [Cawley–Talbot study](https://jmlr.org/papers/volume11/cawley10a/cawley10a.pdf) places criterion overfitting in broader model-selection settings.

The local investigation edits four validation labels and actual candidate bit patterns, with stable candidate-order ties. Current scores and winner appear immediately. A duplicate is a null; a newly matching pattern changes the observed maximum. The exact sixteen-case average stays separate from the current case and from analytically known fresh accuracy. No future labels enter the choice. The complete programme below enumerates the same outcomes using rational arithmetic. `selected_score` computes each count, then a stable maximum; `exact_mean` averages over all equally likely label rows; `fresh_accuracy` separately averages a fixed selected prediction against independent fresh labels.

<!-- Programme P06: insert finite_selection_optimism.py and actual full stdout here. -->

Its exact 11/16, duplicate 11/16 and saturated 1 are conditional on these defined candidate families and fair-bit model. The O(2ⁿ M n) enumeration deliberately supports the small proof example; a large search uses statistical assessment rather than enumerating every possible outcome. A grid helper can enumerate candidate configurations, but cannot by itself establish this probability argument.

### Protect the entire choice

Which object should an untouched score assess when the chosen recipe depends on data? Draw the whole select-and-refit operation inside the permitted region.

<!-- Drawing D17: visual-specifications.md#d17. -->

The reserved-test route keeps a test set outside all development decisions. Search, preparation choices and refit use development data; the chosen fitted object then predicts reserved inputs. The nested route repeats the complete choice inside each outer training set. Within one outer training bundle, inner held folds supply selection evidence; outside that bundle, the outer assessment targets have no path back into the choice. Threshold selection, feature selection and early stopping belong inside the selection enclosure whenever they adapt to outcomes.

For one outer fold: protect its assessment rows; construct inner split pairs on the outer training subset; fit each complete candidate freshly on each inner training set; compute its declared inner criterion; select by fixed tie order; **refit** the selected configuration on all outer training rows; predict the protected inputs once. Repeat with fresh state for each outer fold. The outer score assesses this select-and-fit procedure at the outer training size, under the split's sampling assumptions. It does not identify an oracle-best setting or exactly estimate the error of one all-data fitted object without further conditions.

What does that enclosure actually compute? Use the sixteen-row line, where every fit can be traced.

<!-- Drawing D18: visual-specifications.md#d18. -->

Features are x=0,…,15; targets are 0 below 8 and 1 from 8 upward. The first outer fold trains on odd original IDs `[1,3,5,7,9,11,13,15]` and assesses even IDs. Inner held sets alternate local positions in that outer training list. Candidates k=1 and k=3 each achieve pooled accuracy 7/8=0.875, so fixed order selects k=1. A fresh fit on all eight odd rows predicts `[0,0,0,0,0,1,1,1]` on even queries, yielding 7/8 protected accuracy. The inner scores and outer score happen to agree here, but arise from different fitted states and evidence.

Which edits may change which arrows? Follow one changed training label, then one changed protected label.

<!-- Drawing D19: visual-specifications.md#d19. -->

Changing source row 3's target from 0 to 1 changes this fold's inner scores to 0.5 and 0.625, selecting k=3. Its protected predictions remain the same list in this particular changed case, at 7/8. Changing source row 2's target instead leaves this fold's selected configuration, fit and predictions unchanged, while protected correctness falls to 6/8. Row 2 is held only **for this outer operation**; it can legitimately train the other outer fold. Do not claim global label invariance across all folds. The local investigation edits a selected row's x/y, displays all inner neighbour paths and the outer refit, and resets the full fixture. Fold inspection traces another operation without silently changing the experiment. Invalid splits or illegal k refuse before fitting.

### A configuration survives; an inner fitted state does not

Why not deploy the best inner-fold model directly? Its training set omits an inner held block. Draw its lifetime separately from the winner's configuration.

<!-- Drawing D20: visual-specifications.md#d20. -->

Every candidate/fold owns a fresh preparation and reference set. Those fitted states expire after their comparison; the selected **configuration** enters another fit on all outer training rows. After outer assessment, final deployment selection begins again on all development data, then refits there. Voting among outer winners or choosing the outer model with highest assessment would introduce a different undeclared procedure. The final search uses more rows and can reasonably select a different setting.

`nested_procedure_from_indices.py` reuses the **displayed** P04 primitives through a guarded import. Its new work is explicit orchestration: alternating inner positions, candidate score records, stable selection, fresh refit and protected prediction. It also returns the separate final all-development selection. The ordinary route wraps `GridSearchCV` inside an explicit outer loop; `cross_validate` can equivalently clone that composite search for the outer plan. Group-aware extension subsets `groups` first and maps local inner indices back to source IDs. Neither route moves preparation outside the candidate fit.

<!-- Programme P07: insert nested_procedure_from_indices.py and actual full stdout here. -->

The full lineage output identifies every train/held source ID, fitted mean/variance, neighbour identity, vote and prediction. The source-ID tie convention reproduces the hand cases; the ordinary route agrees on the shown default selections and predictions. A numerical distance implementation can resolve extremely close floating-point distances differently, so parity is established for these inputs rather than asserted for all ties. The code's cost is the sum of all complete candidate/fold fits and predictions, plus outer/final refits; training sizes vary, and retaining the audit grows memory beyond the fitted objects themselves.

### Choosing an epoch is still choosing

The same enclosure applies when a training loop offers many intermediate states. Put an epoch marker on its actual validation trajectory.

<!-- Drawing D21: visual-specifications.md#d21. -->

The epoch trajectory is explicitly illustrative, not a measured neural experiment. Its validation-loss minimum chooses a stopping policy inside permitted training/selection data. If outer assessment loss moves that marker, outer evidence has become selection evidence. One repair reserves a stopping subset inside each inner training partition, leaving inner validation for candidate comparison. Another treats inner-validation-based stopping as part of the complete adaptive rule, then assesses that rule on protected outer rows. A separately reserved final test is another valid route when all such choices occur in development. The stopping subset's learned preparation must respect the same boundary. Renaming a consulted set cannot remove its influence.

Protected evaluation encloses a declared choice rule. We next make the candidate space itself inspectable, because a search distribution decides which recipes ever receive evidence.
