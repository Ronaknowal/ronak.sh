<a id="3-choose-splits-that-match-the-future-use"></a>
## 3. Choose splits that match the future use

### Independent examples and rare classes

The seven-row example establishes the mechanics. Its class-sorted order also changes what each training set contains. When observations can reasonably be treated as independent draws from a common population, shuffled K-fold is a useful baseline. **Exchangeability** means that permuting these observations does not change the joint sampling description relevant to our question. A temporal sequence or repeated records from one person can violate the assumption that an ordinary row permutation preserves the task.

What does stratification actually preserve? Count the rare-class rows before assigning them.

<!-- Drawing D09: visual-specifications.md#d09. -->

With twelve rows and three positives, three folds can each receive one positive. With two positives and five folds, at least three held sets must lack positives: two rows cannot occupy five disjoint sets. **Stratified K-fold** approximately preserves class proportions, helping avoid missing-class model or metric failures. It cannot create observations or independent subjects. Homogeneous folds can also hide rare-class allocation variability; stratification is an engineering allocation choice rather than a universal uncertainty correction. The [official CV guide](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators-with-stratification-based-on-class-labels) explains these limits.

Five or ten folds are common starting choices, with no universal optimum. Increasing K increases the training fraction and number of fits. Leave-one-out (LOO) takes K=n, holding one row per fit; its variance depends on the learning procedure and distribution, not only on overlapping training sets. Section 7 demonstrates a counterexample to that overlap shortcut. Leave-P-out holds every size-P subset, requiring `choose(n,P)` fits; at n=5,P=2 there are ten. Repeated K-fold changes partitions of the **same** dataset, exposing split sensitivity without collecting new people. Repeated random holdout, often called Monte Carlo cross-validation, can vary training fraction independently of repetition count; some rows receive multiple held turns and others none. These methods change the sampling plan, rather than forming a ladder of progressively stronger guarantees.

### New people and later records are different tasks

A patient ID is not an ordinary coordinate to shuffle away. First say whether the new prediction concerns a new person or another record from someone already known.

<!-- Drawing D10: visual-specifications.md#d10. -->

In the new-person panel, every observation from held subject A stays outside that fit; training receives B and C. In the known-person future panel, A's available earlier records may train a prediction for A's later record. The first panel tests unseen-subject transfer; the second tests future use with that person's history. Using history in the second is legitimate under its availability rule. Reporting its score as new-person evidence changes the question.

`GroupKFold` and `LeaveOneGroupOut` express subject-disjoint held boundaries. `StratifiedGroupKFold` additionally tries to distribute class proportions, but indivisible groups can make exact balance impossible. Inspect the actual class/group membership of each emitted fold, especially when a class exists in only one group. A named splitter cannot guarantee enough training examples for every estimator or metric.

### A feature timestamp is not a label-availability timestamp

For a future prediction, what information would actually exist at decision time? Draw both clocks.

<!-- Drawing D11: visual-specifications.md#d11. -->

The six constructed records have source IDs 0–5 and event times `[0,1,2,5,8,9]` days. Labels arrive three days after each event, at `[3,4,5,8,11,12]`. At decision time 5, require training events strictly earlier than 5 and labels available **at or before** 5. IDs 0,1,2 qualify. ID 3's event at 5 is the assessed event, not an earlier donor. Increase delay to four days: ID 2's label arrives at 6 and leaves the legal training set, while IDs 0,1 remain. Inclusive availability at the decision time is an explicit convention here. The protected target may arrive later: assessment waits for that outcome, while the prediction itself uses only information available at the decision.

An expanding window accumulates permitted history; a sliding window can discard older history. A gap can account for delayed labels, overlapping feature windows or operational delay. `TimeSeriesSplit(gap=...)` counts rows, not elapsed days, so an index gap of one has no fixed calendar duration on these irregular dates. Explicit date logic is needed for a clock embargo or outcome horizon. Any rolling feature must also respect permitted past information. Equal-duration test windows and comparable sampling assumptions matter when comparing fold scores across time. A timestamp column alone does not make every retrospective question a forecasting task; choose the boundary from the intended use. [Time-Series Validation & Forecasting Baselines](/learn/path/full-curriculum/time-series-validation-forecasting-baselines?module=classical-ml) develops the complete forecasting protocol.

What if a product must serve new people **and** a future period? Intersect the two rules on the actual records.

<!-- Drawing D12: visual-specifications.md#d12. -->

Assign subjects `[A,B,A,A,B,C]` to the six records above and hold subject A's event at day 5. Under delay 3, time alone permits IDs 0,1,2. Subject disjointness removes A's IDs 0 and 2, leaving only B's ID 1. The drawing retains each excluded row and its reasons, rather than shrinking the table to a mysterious final count. Such an intersection can be empty; then the declared fit is infeasible. Group-disjoint random folds can still use future records, and forward folds can still share people. Neither named plan automatically implements both restrictions.

Three small adjacent investigations make these differences actionable: one edits the subject records/held subject, one edits events, decision time and delay, and one traces their joint intersection. They update permitted IDs and rejection reasons immediately. Targets on already excluded rows cannot change an information mask. The joint view refuses an empty legal training set, and reset restores the six-record fixture. No task selector hides these different prediction questions behind one label.

### A score table is not automatically a one-prediction-per-row table

Count held turns before attaching the name “out of fold” to an array.

<!-- Drawing D13: visual-specifications.md#d13. -->

K-fold partitions give coverage count 1 for every row. Repeated partitions give more than one held turn; random repeated holdouts may give zero, one or several. A forward plan retains a warm-up prefix. Each split can still produce a meaningful score under its own assumptions; producing one aligned prediction for **every supplied row** requires an additional contract.

<!-- Drawing D14: visual-specifications.md#d14. -->

The explicit forward plan trains on IDs 0–3 to assess 4–5, then trains 0–5 to assess 6–7. Coverage is `[0,0,0,0,1,1,1,1]`. The first four predictions stay absent. A table showing `0` there would falsely turn no prediction into a class-0 prediction. Filling them from a model fitted on those same rows would falsely relabel in-sample predictions as held-out evidence.

`cross_val_score` evaluates supplied split pairs. `cross_val_predict` additionally requires an exactly-once held partition of its supplied rows, as its [API contract](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_predict.html) states. A manual partial forward table can legitimately keep only covered rows for a downstream operation, provided it subsets **features, targets and predictions by the same original IDs**. The [Ensemble lesson's forward stacking construction](/learn/path/full-curriculum/ensemble-methods-stacking?module=classical-ml#forward-group-oof) owns the complete meta-model; here we expose coverage and alignment. We reuse the recorded library limitation without executing its known failure again.

The local coverage investigation edits actual train/held index lists. It displays counts, prediction absence and the computed exactly-once diagnostic; it never repairs coverage by inventing predictions. Repeated held IDs, out-of-bounds indices or train/held overlap receive explicit feedback. A predefined benchmark partition can also be expressed as index lists or `PredefinedSplit`; respect the question it was designed to assess instead of reshuffling for a better score.

### Local positions need a return map

Once an outer split selects a subset, position 0 means the first row of that subset. Which original observation is it?

<!-- Drawing D15: visual-specifications.md#d15. -->

Outer training source IDs are `[1,3,5,7,9,11,13,15]`, occupying local positions 0–7. Inner held positions `[0,2,4,6]` map to original IDs `[1,5,9,13]`. Applying them directly to the full source table instead selects `[0,2,4,6]`, a different experiment that can even reach protected rows. Group IDs, targets and weights must be subset in the same order. The adjacent mapping investigation edits both rulers and immediately shows the correspondence; duplicate/out-of-range positions refuse.

The next whole programme builds source-group held splits, explicit event/arrival masks, coverage and aligned partial rows. `available_split` records every exclusion reason. `source_positions` applies the outer-to-inner map. `aligned_partial_oof` keeps absent rows absent and refuses repeated coverage for a single-column prediction table. The ordinary examples deliberately have different contracts: GroupKFold preserves groups; TimeSeriesSplit applies index order/gap; PredefinedSplit represents a supplied partition; RepeatedKFold gives each row two turns in its two-repeat example. Agreement is assessed on their actual invariants, not on identical index output from differently defined algorithms.

<!-- Programme P05: insert split_information_contracts.py and actual full stdout here. -->

The output's time-3, time-4 and joint permitted lists are `[0,1,2]`, `[0,1]` and `[1]`. Its aligned forward rows are IDs 4,5,6,7, with the same four feature, target and prediction entries. That particular prediction column is supplied illustrative alignment data, not a newly fitted forward model or an assessment score; the index editor recomputes coverage and alignment without pretending its old supplied values came from changed fits. Group-aware nested code later passes `groups[outer_train]` into its inner splitter and maps returned local positions through `outer_train`. Optional experimental metadata routing can express consumer requests, but a group splitter, weighted estimator and weighted scorer consume different metadata. Explicit subset propagation remains the core route; enabling routing alone does not establish a correct boundary. Consult the [current routing guide](https://scikit-learn.org/stable/metadata_routing.html) when using that version-sensitive extension.

Legal information masks answer which rows a model may learn from. Another kind of learning remains: repeatedly comparing recipes can learn the quirks of the score itself. We can isolate that mechanism without any uncertain real-world optimum.
