<a id="2-build-cross-validation-one-held-out-prediction-at-a-time"></a>
## 2. Build cross-validation one held-out prediction at a time

### A fold is a role assignment

Rather than call a scoring helper first, lay out the rows it will assign. This constructed line has seven observations, with feature `x=0,…,6` and targets `0,0,0,1,1,1,1`. The IDs match their positions for this example; that convenient equality will stop being true inside a nested subset.

<!-- Drawing D04: visual-specifications.md#d04. -->

| Held fold | Held IDs | Training IDs | Fresh fitted state |
| --- | --- | --- | --- |
| 0 | 0,1,2 | 3,4,5,6 | fit 0 |
| 1 | 3,4 | 0,1,2,5,6 | fit 1 |
| 2 | 5,6 | 0,1,2,3,4 | fit 2 |

Each row gets exactly one held-out turn. Fold sizes 3,2,2 keep the remainder instead of silently discarding an observation. **K-fold cross-validation** partitions the supplied development rows into K nonoverlapping held sets; each fit uses the complement of its held set. A fresh copy includes every learned imputer, scaler, selector and estimator. Carrying a trained object from the previous fold would carry information from rows that may now be held out.

What exactly predicts row 0? Put the actual training sources on the same feature ruler.

<!-- Drawing D05: visual-specifications.md#d05. -->

In fold 0, training points sit at x=3,4,5,6, all labelled 1. Query x=0 connects to source ID 3, its nearest permitted point, and receives label 1. Its own target 0 enters only the correctness cell, which becomes false. Queries 1 and 2 also receive 1. In fold 1, query 3 connects to source 2 and is wrong; query 4 connects to source 5 and is correct. Fold 2 predicts both remaining cases correctly. Equal feature distances in this hand trace use smaller original source ID. [KNN's voting section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#3-turn-neighbors-into-a-prediction) supplies the estimator background; here the new operation controls which reference rows may exist for each query.

| Held IDs | Nearest source IDs | Predictions | Correct / assessed |
| --- | --- | --- | ---: |
| 0,1,2 | 3,3,3 | 1,1,1 | 0/3 |
| 3,4 | 2,5 | 0,1 | 1/2 |
| 5,6 | 4,4 | 1,1 | 2/2 |

The local row investigation keeps this fold plan fixed while you edit one row's feature or target. Its current neighbour, prediction and correctness are immediately visible. Editing a held row's target can change correctness without changing the model that predicted it. Editing a training feature can move a nearest-source edge. A separate adjacent splitter investigation varies K, shuffle and seed with the data fixed; it shows the complete held masks and all predictions after each valid edit. Reset restores the seven original rows and folds. A coincident-feature tie exposes the declared smaller-ID rule. Nonfinite observations or an empty/illegal fold produce a refusal instead of a stale current score. These are two local questions, without a learner answer gate. The ordered example also explains why blindly retaining class-sorted order can produce an unrepresentative random-row assessment; section 3 decides when exchangeability is justified.

### An average over folds is not always an average over rows

Which units should receive equal weight: three folds or seven observations? Follow the same correctness cells into both sums.

<!-- Drawing D06: visual-specifications.md#d06. -->

The three equal fold tiles contribute `0`, `1/2`, `1`, giving mean `1/2`. The seven equal row tiles contain three correct predictions, giving `3/7 ≈ 0.4285714`. A fold tile in the first calculation has weight 1/3 despite covering three rows; each row in the second has weight 1/7.

Write Vₖ for held IDs in fold k, f̂₋ₖ for the procedure fitted without them, and ℓᵢ=L(yᵢ,f̂₋ₖ(xᵢ)) for row i's held loss. For a loss additive over rows,

\[
\widehat R_{\mathrm{rows}}=\frac1n\sum_i\ell_i
=\sum_{k=1}^{K}\frac{|V_k|}{n}\widehat R_k,
\qquad \widehat R_k=\frac1{|V_k|}\sum_{i\in V_k}\ell_i.
\]

This is a rearrangement of the same sum, not an independence theorem. Equal fold sizes make this additive row-weighted summary equal to the unweighted fold mean. If person A supplies four correct visits and person B supplies one incorrect visit, row accuracy is 4/5, while equal-person accuracy is `(1+0)/2=1/2`. Decide from the intended reporting unit, rather than from the more appealing value.

Does equal fold size also settle a nonlinear metric? Start by drawing what F1 counts.

<!-- Drawing D08: visual-specifications.md#d08. -->

A true positive (TP) predicts 1 when the target is 1. A false negative (FN) predicts 0 for target 1; a false positive (FP) predicts 1 for target 0. A true negative (TN) predicts 0 for target 0. Define `F1=2TP/(2TP+FP+FN)`, with value 0 when the denominator is 0. The first two-row table has `(TP,FN,FP,TN)=(1,1,0,0)`, so F1=2/3. The second has `(0,0,1,1)`, so F1=0. Their mean is 1/3. Adding the counts first gives `(1,1,1,1)`, so pooled F1=1/2. Counts add; applying a ratio and then averaging need not commute. Pooled area under the ROC curve (AUC), a ranking summary based on positive/negative score pairs, also compares scores from different fitted models, creating cross-model pairs absent within each fold. Equal sizes alone do not make all metrics interchangeable.

### Keep every row in a complete splitter

The first full programme uses NumPy arrays to construct the exact three folds. `np.array_split` distributes the remainder; concatenating the other folds constructs permitted training positions. `x[validation,None] − x[train]` broadcasts a held-by-training distance matrix, and `argmin` chooses the first minimum in sorted training order. With q held and m training rows it allocates q×m distances; this is a transparent one-dimensional reference, rather than an optimized general neighbour engine. The output below is the exact retained displayed stdout from the original execution; its terminal process newline was not retained. We have preserved the source and output without running them again.

<!-- Programme P01: insert cv_tiny.py and its exact retained stdout here. -->

`shuffle=False` makes the constructed row order inspectable. A seeded permutation changes the plan reproducibly when shuffling is appropriate; it cannot decide whether time or subject dependencies may be ignored. The resulting 0.5 fold mean and 3/7 pooled accuracy are summaries of the stored row predictions, rather than interchangeable estimates by name alone.

### Fit preparation inside each training boundary

The first programme has no learned coordinate preparation. What must change when a recipe learns a median and ruler? Freeze one fitted state before passing held values through it.

<!-- Drawing D07: visual-specifications.md#d07. -->

Training numeric values are `[0,2,NA,4]`; held values are `[10,NA]`. The observed training median is 2. Filling training gives `[0,2,2,4]`, mean 2 and population variance `(4+0+0+4)/4=2`, hence scale √2. Frozen filling and scaling transforms the held values to `[(10−2)/√2,(2−2)/√2]=[4√2,0]`. Preserve the original missing masks beside the filled cells: a supplied 2 is not a newly measured 2. The adjacent investigation edits the training and held columns with roles and missing masks fixed. Held `10→100` changes its transformed value to `49√2` while the fitted state stays unchanged. Training `4→6` changes mean to 5/2 and variance to 19/4. Translating every observed training and held value by the same constant preserves their standardized coordinates. All-training-missing refuses this recipe's numeric fit.

For training-filled numeric column j, the scratch implementation stores

\[
m_j=\operatorname{median}(\text{observed training values}),\quad
\mu_j=\frac1m\sum_{i\in T}\widetilde x_{ij},\quad
s_j^2=\frac1m\sum_{i\in T}(\widetilde x_{ij}-\mu_j)^2.
\]

It uses divisor sⱼ when positive and 1 for a constant column. A held missing value receives mⱼ, then `(filled−μⱼ)/sⱼ`; none of these stored values is recomputed from held inputs. Categorical missing values receive a reserved `__missing__` marker, and each observed training category becomes one indicator column. An unknown held category maps to all zeros. A missing marker absent from training is also unknown to that fitted vocabulary. This is an explicit policy; it does not mean the unseen category resembles every known category biologically.

The complete next programme owns `fit_prepare`, `transform`, `fit_knn`, `predict` and `evaluate_folds`. `Preparation` contains immutable scalar/vocabulary tuples. `Neighbours` stores transformed features, filled numeric reference values, targets and separate source/copy identities. At prediction, the common numeric mean cancels from distances, so it subtracts filled values **before** dividing by the saved scale. This avoids creating unequal rounded distances from two separately centered integer-line points. Categorical indicator differences are then added. It sorts by squared distance, source ID, copy ordinal; uniform votes tie by declared class order. Its returned records expose neighbour IDs, distances, votes and predictions. Source/copy metadata never enters a coordinate.

<!-- Programme P04: insert fold_fitted_pipeline.py, actual complete stdout, and empty-stderr role here. -->

In `main`, the mixed training table combines the numeric fixture with categories `a,b,a,missing`. Its saved vocabulary is `__missing__,a,b`; the held rows are `a,new`. Both scratch and ordinary routes produce `[5.6568542495,0,1,0]` and `[0,0,0,0]` to the shown precision. `ColumnTransformer` assigns numeric/category branches, `SimpleImputer` learns the median, `StandardScaler` stores population moments, and `OneHotEncoder(handle_unknown='ignore')` fixes the vocabulary. `Pipeline` fits all those objects inside each fold. The seven-row comparison then reproduces all three prediction lists and the separate two aggregations. Library tie behavior need not equal this explicitly sorted source/copy convention on every tied input; compare matched nonambiguous inputs or report a convention difference.

This reference processes queries separately, costing O(q[m d+m log m]) for q queries, m training occurrences and d prepared coordinates when sorting every distance list. Fitted dense storage is O(m d); transformed query/output storage and returned audit records are additional. Sorting each numeric column for a median and categorical vocabulary costs up to O(m dₙ log m+m c log m), followed by dense indicator allocation O(m v), where dₙ is numeric width, c categorical width and v total vocabulary width. A large real system can delegate neighbour indexing and sparse encoding to maintained libraries; the local reference keeps each new fit/transform boundary inspectable. All-missing numeric training columns, changed schemas, duplicate ordinary source IDs, nonfinite observed numbers and k larger than training size are explicit refusals. Bootstrap copies later have their own occurrence adapter, rather than weakening ordinary distinct-index checks.

A correct fresh fit still cannot make an unsuitable split answer the desired future-use question. Next we decide which people, times and available labels may cross each boundary.
