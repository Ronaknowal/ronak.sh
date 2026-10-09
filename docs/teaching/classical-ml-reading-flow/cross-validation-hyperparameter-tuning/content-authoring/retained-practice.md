<!-- Exact retained task T01; complete original JSX in retained-practice-source.jsx. -->

### 1. Unequal folds

Three folds assess 4, 3 and 3 rows and get 3, 1 and 2 correct. Find the unweighted mean fold accuracy and the pooled accuracy. Which gives each row equal weight?

<details><summary>Get a hint</summary>

Average the three fractions for one answer; add correct counts before dividing for the other.

</details>

<details><summary>Show the explained solution</summary>

The fold mean is $(3/4+1/3+2/3)/3=7/12\approx.5833$. Pooled accuracy is 6/10 = .6 and gives each row equal weight. Equal weighting of folds is a different declared summary.

</details>


<!-- Exact retained task T02; complete original JSX in retained-practice-source.jsx. -->

### 2. A remainder is still a learner's data

A splitter uses fold_size = n // k and slices exactly that many rows for each of k validation folds. What happens at n = 11, k = 3? How does the provided splitter repair it?

<details><summary>Show the explained solution</summary>

Only nine rows receive a validation turn; two are omitted. Depending on how training indices are constructed, those omitted rows may be permanently in training or dropped altogether. `np.array_split` creates folds 4, 4 and 3 so every row belongs to one validation fold and the remaining folds form its training set.

</details>


<!-- Exact retained task T03; complete original JSX in retained-practice-source.jsx. -->

### 3. New patient or known patient?

A wearable model will predict tomorrow's measurements for people who already provided a week of history. A second product must work on entirely new wearers. Describe an assessment boundary for each. What extra question arises if the second product also launches in a future season?

<details><summary>Show the explained solution</summary>

The first task can use each person’s available earlier history but must respect prediction time and target availability. The second needs held-out people. A future season introduces a time-distribution boundary as well, so a custom group-and-time assessment may be needed. A random visit split does not by itself establish either claimed setting.

</details>


<!-- Exact retained task T04; complete original JSX in retained-practice-source.jsx. -->

### 4. An impossible out-of-fold array

A forward plan trains on rows 0–3 and assesses 4–5, then trains 0–5 and assesses 6–7. Why can it be used for fold scoring but not passed directly to cross_val_predict on all eight rows? What should a manual prediction table contain at rows 0–3?

<details><summary>Show the explained solution</summary>

Rows 0–3 never appear in a held-out set, so the required exactly-once partition is missing. A manual table should retain their predictions as absent, not fit on them and label in-sample outputs out-of-fold. Score the valid held-out rows, or train a stacking stage only where legitimate predictions exist.

</details>


<!-- Exact retained task T05; complete original JSX in retained-practice-source.jsx. -->

### 5. A new candidate pattern

Validation labels are [0,1,0,1]. Initially the candidates predict all zeros or all ones. Add a candidate predicting [0,1,0,1]. Under the independent fair-label model, what changes in best validation accuracy and expected future accuracy? What if you add only another all-zero candidate?

<details><summary>Show the explained solution</summary>

The best validation score rises from .5 to 1. Every fixed prediction remains independent of future fair labels, so expected future accuracy remains .5. A duplicate all-zero candidate changes neither the original best validation score nor future accuracy. Candidate diversity, and how selection uses the labels, are what matter. Both cases are saved setups in the selection investigation above.

</details>


<!-- Exact retained task T06; complete original JSX in retained-practice-source.jsx. -->

### 6. Which rows selected the epoch?

An outer-fold model chooses its number of epochs using outer assessment loss, then reports accuracy on that same outer fold. Identify the violated boundary and give two repairs.

<details><summary>Show the explained solution</summary>

The assessed rows selected a training setting. Move stopping into the outer training data, either using a stopping subset inside each inner training partition or treating inner-validation-based stopping as part of the complete rule assessed by protected outer rows. Another valid design uses development data for all such choices and a genuinely separate final test set. Renaming the used assessment set does not restore independence.

</details>


<!-- Exact retained task T07; complete original JSX in retained-practice-source.jsx. -->

### 7. Probability mass is not score distance — deeper

A satisfactory parameter region has probability .02 under your sampler. How many independent draws give at least a 95% chance of hitting it? Would this guarantee a score within 2% of the global optimum?

<details><summary>Get a hint</summary>

Solve $(1-.02)^T\le.05$ and round upward.

</details>

<details><summary>Show the explained solution</summary>

$T\ge\log(.05)/\log(.98)\approx148.28$, so 149 draws suffice under the assumed independent sampling model. The 2% is sampling mass, not score proximity. The satisfactory region itself must be defined and its assumed mass justified for a practical guarantee.

</details>


<!-- Exact retained task T08; complete original JSX in retained-practice-source.jsx. -->

### 8. An unchanged acquisition value — deeper

The incumbent loss is .30. Candidate C has equal predicted probabilities of losses .10 and .50. Find EI. If only the worse outcome changes from .50 to .90, does EI change? Does expected loss change?

<details><summary>Show the explained solution</summary>

EI is $.5(.30-.10)=.10$. The worse outcome contributes zero improvement in both cases, so EI remains .10. Expected loss changes from .30 to .50. This does not prove the surrogate is calibrated; it distinguishes the summaries of its stated distribution.

</details>


<!-- Exact retained task T09; complete original JSX in retained-practice-source.jsx. -->

### 9. Account for the whole schedule — deeper

A halving plan starts 27 candidates with budgets 5, 15, 45 and 135 and retains one third after each stage. Find the nominal from-scratch resource cost, and compare it with giving every candidate 135. If each stage instead resumes genuine saved state, what is the incremental resource cost?

<details><summary>Show the explained solution</summary>

Candidate counts 27, 9, 3 and 1 each consume 135 nominal units per stage, totalling 540, versus 3,645 for all candidates at 135. Resuming costs $27\cdot5+9\cdot10+3\cdot30+1\cdot90=405$. Multiply appropriate evaluations by fold count and account separately for scoring and refits. Real time need not be linear in this resource.

</details>


<!-- Exact retained task T10; complete original JSX in retained-practice-source.jsx. -->

### 10. A fixed rule tests an overlap story — deeper

A classifier always predicts class 0 and ignores training. Labels on n observations are independent fair bits. What is the variance of its leave-one-out accuracy? Why does this contradict equating loss correlation with training overlap?

<details><summary>Show the explained solution</summary>

The correctness indicators are independent Bernoulli(.5), so their average has variance $(.5)(.5)/n=1/(4n)$. The leave-one-out training sets overlap heavily, but those sets do not influence this rule’s predictions. Thus overlap alone does not determine loss correlation or imply variance stays near 1/4.

</details>

