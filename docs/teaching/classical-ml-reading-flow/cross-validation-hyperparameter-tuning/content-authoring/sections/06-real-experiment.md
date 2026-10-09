<a id="6-a-complete-nested-experiment-with-real-observations"></a>
<a id="penguins"></a>
## 6. Read a complete experiment, from rows to final refit

The small examples made every dependency visible. Our real example retains all 344 Palmer Penguins records and asks how a six-configuration preparation-plus-KNN selection procedure predicts species under the declared shuffled, stratified row-sampling protocol. It does not establish performance on a new island or a future season. Those requests would change the information boundary, and the available island/year fields alone do not establish a feasible representative assessment for every such request.

One actual row is Adelie, Torgersen, bill length 39.1 mm, bill depth 18.7 mm, flipper length 181 mm, body mass 3750 g, male, year 2007. The predictor uses the four measurements and sex; species is the target. Island and year remain available for examining scope but are not model inputs in this programme. Each numeric column has two missing values; sex has eleven. The loader retains these rows. Dropping all incomplete rows would define a different population and experiment.

The complete ordinary route is `cv_penguins.py`. Read its three functions as data loading, construction of one unfitted recipe, and the entire assessment/deployment procedure. Numeric preparation fills with training medians and applies a candidate StandardScaler or RobustScaler; categorical preparation fills a missing marker and one-hot encodes observed training categories, ignoring unknown categories at transform time. KNN uses the resulting mixed feature space. Robust scaling uses training medians and interquartile ranges; choosing it is a recipe choice, not a declaration that every outlier has been removed.

### Follow the first outer fold

Start with the source-ID table, not the aggregate score.

<!-- Drawing D27: visual-specifications.md#d27. -->

The first outer operation permits 229 training rows and protects 115 assessment rows. Its first inner assessment has 77 rows, leaving 152 for fitting; the other two inner assessments have 76 rows each, leaving 153. The stored inner ID lists are already mapped to original source IDs. An inner local position is never used as though it named that original row.

Read across a single candidate row: k=11 with StandardScaler receives inner accuracies 0.9740259740, 1 and 0.9868421053. Their equal-fold mean is 0.9869560264. It exceeds the other five candidate means in this outer operation, so its **configuration** wins. Refit that recipe from scratch on all 229 permitted rows, then predict the 115 protected rows once. The saved result has 114 correct. The drawing lets a reader inspect actual source memberships and table cells; inspection does not fabricate a new fitted experiment or causal edit of this retained record.

For comparison, k=3 Standard has mean 0.9782410572 and k=3 Robust has 0.9826270221 in this operation. These are selection evidence from the inner folds. Their difference is not an independently assessed advantage of scaling rules. The candidates share observations and their comparisons are correlated. The outer result belongs to the selected procedure, including its candidate space, tie rule and fitted preparation.

### Read all assessment denominators

<!-- Drawing D28: visual-specifications.md#d28. -->

The three selected outer recipes are 11/Standard, 3/Standard and 3/Robust. Their correct counts are 114/115, 114/115 and 112/114. Summing counts yields 340/344=0.9883720930. Equal weighting of the three fold accuracies gives 0.9883549453. The difference is small here because fold sizes differ by only one; its mathematical cause is the same as the seven-row example. Report the aggregation rule even when the numerical difference is easy to miss.

The majority baseline is also fitted inside each outer training set. It gets 51, 51 and 50 protected rows correct, respectively. This makes the comparison specific: a trivial training-majority rule correctly predicts 152 of the same 344 assessed rows. It does not turn the KNN estimate into a guarantee, and a nontrivial baseline could be more informative for another task.

The second outer search has a three-way best-mean tie: 3/Standard, 3/Robust and 5/Robust all score 0.9825700615. The first enumerated candidate wins. In the third outer search, five candidates share 0.9870129870; the first of those is 3/Robust. A deterministic tie is part of the procedure. Reporting the winner alone as evidence that its scaler or k was uniquely superior would discard the saved comparison.

### Deployment selection begins again

<!-- Drawing D29: visual-specifications.md#d29. -->

For the final fitted object, run the same six-card selector on all 344 development rows. The best final inner mean is 0.9913043478, tied by 3/Standard and 3/Robust; enumeration selects 3/Standard, then refits it on all 344 rows. The k=5 means are 0.9884057971; k=11 means are 0.9854818205. The final selection score is not a fourth outer assessment. No protected future rows have appeared merely because the final object used more development data. Nor do the three outer winners vote on the final recipe: that would be a different rule.

The nested pipeline workload contains 3×(6×3+1)=57 fits for outer search/refit, plus 6×3+1=19 final selection/refit fits: 76 complete pipeline fits. Three majority-baseline fits bring the listed total to 79. Fit counts say neither elapsed time nor equal work per fit; the inner, outer and final objects train on different row counts.

<!-- Programme P02: insert cv_penguins.py and exact retained displayed stdout here. -->

These are the exact retained source and displayed stdout from the original execution. The source's default outer seed is 41 and inner seed 73. All six candidates use k in {3,5,11}, standard then robust scaling in the saved enumeration. Three outer folds assess the complete six-card, three-inner-fold selector. We inspect its saved arrays in `nested-experiment.json`; none of these original fits has been repeated for this lesson.

### A result table is also a decision interface

The historical experiment uses one metric and a fixed first-best rule. In practice, a procedure may constrain cost or choose among several metrics. Make that rule explicit before protected evaluation. In a separate constructed table, candidates A/B/C have fold costs (9,11,10)/(2,3,4)/(1,1,1), so their mean costs are 10/3/1. Their three accuracy cells are A=(0.80,0.90,0.70), B=(0.85,0.80,0.90), C=(0.95,0.94,failed). The complete means are 0.80 and 0.85; a mean-cost cap of 5 permits B and refuses C because a required fold failed. B wins at index 1. Cap 2 leaves no eligible candidate. Raising the cap to 10 admits A but B still has the larger score. Changing A's cells to (0.90,0.95,0.85) makes A's mean 0.90 and selects A at that cap. Equal eligible scores use the first input candidate; cost is a feasibility rule, not a secondary ranking rule.

The local table investigation edits actual score, failure and cost cells, then displays eligibility and the reason for its decision. A failed cell remains failed; it is neither an accurate zero nor an invitation to average only successful folds. C’s supplied cost cells are known, but this selector withholds both audited means for an incomplete row; the output’s absent summaries are not zero cost or a successful score. The actual ordinary experiment below is a **different**, newly constructed 24-row classification task. It demonstrates the API and prints its own metrics; do not substitute its values into the abstract table or the Penguins record.

<!-- Programme P09: insert search_results_and_refit.py and actual full stdout and stderr here. -->

`select_table` first checks complete finite evidence and feasibility, then applies the declared tie order. The ordinary route supplies a scoring dictionary and callable `refit` to `GridSearchCV`. That callable returns the chosen row index; `best_index_`, `best_params_` and `best_estimator_` exist, while `best_score_` does not. Read the named metric cells explicitly. The deliberately invalid k=0 candidate fails three fits, yielding NaNs and the complete captured diagnostics above. `error_score` controls candidate-fit failure handling; final refit can still raise. The repaired call removes that invalid candidate and uses `error_score='raise'`. These are actual observed behaviors in the stated environment, consistent with the [GridSearchCV documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GridSearchCV.html).

The constructed run makes ten attempted fits including the three failed fits and final refit; its repair makes seven. The protected score is computed from explicit protected predictions after the rule is fixed. Choosing a different cost cap, metric or feasibility rule after seeing that protected score would extend adaptation and require fresh assessment. A metric name also carries direction: search maximizes scores; negative MSE is larger when squared error is smaller. Undo its sign when reporting MSE in squared target units.

We have separated rows, configuration choice, fitted states and assessment. The next difficulty survives even when all those boundaries are correct: what random quantity does the reported error estimate, and how much uncertainty can the same data support?
