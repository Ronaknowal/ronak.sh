<a id="10-practice-identify-the-decision-before-computing-the-score"></a>
<a id="practice"></a>
## 10. Practice: identify the decision before computing the score

For each task, name the permitted information and the quantity being computed before doing arithmetic. A successful answer should explain why a tempting alternative computes a different quantity. Hints and solutions are optional reading; the preceding investigations show their current outputs immediately and require no submitted prediction.

<!-- Retained practice: exact ten rendered tasks. -->

The first ten tasks check the original fold, boundary, selection, acquisition and resource arguments. The following tasks change a fitted state, sampling law or decision rule. Tasks 11–18 reinforce the working procedure; tasks 19–22 deepen uncertainty and resource allocation; task 23 asks for a complete transfer report. Each includes a concrete success criterion.

### 11. Keep the fitted state on its own side (N1)

Training numeric values are [0,2,missing,4]; held values are [10,missing]. Use training-median filling followed by population standardization. Find the fitted median, mean, variance and held coordinates. Then change only held 10 to 100. What may change, and what must remain fixed?

<details><summary>Get a hint</summary>

List the source IDs permitted to fit first. Fill the training gap before computing the mean and variance. A transform consumes saved state; it does not fit again.

</details>

<details><summary>Show the explained solution</summary>

Observed training values [0,2,4] have median 2. Filled training [0,2,2,4] has mean 2 and population variance (4+0+0+4)/4=2, so the divisor is √2. Held coordinates are [(10−2)/√2,(2−2)/√2]=[4√2,0]. Changing 10 to 100 changes the first coordinate to 98/√2=49√2; median 2, mean 2, variance 2 and the second coordinate stay fixed. Fitting on all six values would let held observations change every training coordinate and answer a different, leaky question. Success: provide the four state/coordinate values and identify the operation allowed to respond to the edit.

</details>

### 12. Pool counts before a nonlinear metric (N2)

Two equally sized held folds have confusion counts (TP,FN,FP,TN)=(1,1,0,0) and (0,0,1,1). With F1=2TP/(2TP+FP+FN), defining a zero denominator as zero, compare mean fold F1 and pooled F1. Does equal fold size make them equal?

<details><summary>Get a hint</summary>

Compute the ratio in each fold, then separately add the four count columns before taking the ratio.

</details>

<details><summary>Show the explained solution</summary>

The folds give 2/(2+0+1)=2/3 and 0/(0+1+0)=0, hence mean 1/3. Pooled counts (1,1,1,1) give 2/(2+1+1)=1/2. Neither calculation has a zero denominator here, but stating the convention matters for other inputs. Accuracy's equal-size averaging identity relies on additive correct counts with the same row denominator; this nonlinear ratio has another denominator. Success: state both fractions and explain why equal row counts do not make nonlinear aggregation commute.

</details>

### 13. Which unit gets one vote in the report? (N3)

Person A has four records, all predicted correctly. Person B has one record, predicted incorrectly. Compute row-weighted accuracy and equal-person accuracy. Which should you choose for a product intended to serve a uniformly selected new person?

<details><summary>Get a hint</summary>

Compute each person's record accuracy, then average people. Choose the reporting unit from the future request rather than from the larger score.

</details>

<details><summary>Show the explained solution</summary>

Row accuracy is 4/5=0.8. Person accuracies are 1 and 0, whose equal-person average is 1/2. For a uniformly selected person and this stated within-person summary, the second matches the requested weighting. An operational request that instead samples individual events could justify the first. New-person **splitting** is also needed; changing aggregation cannot repair a boundary that trained on the assessed person's history. Success: give both values and connect split unit and reporting weight to two distinct decisions.

</details>

### 14. Draw both event time and availability time (N4)

Source event times are [0,1,2,5,8,9]. At decision time 5, permit only strictly earlier events whose labels have arrived. Which source IDs train when each label arrives at event time+3? What changes at delay 4? Why is “drop one preceding row” insufficient here?

<details><summary>Get a hint</summary>

For each candidate row test both event<5 and event+delay≤5.

</details>

<details><summary>Show the explained solution</summary>

Delay 3 gives label times [3,4,5,8,11,12], so IDs 0,1,2 train. Delay 4 gives [4,5,6,9,12,13], so only 0,1 train. ID 2 is earlier but its label is unavailable under the changed delay. Irregular spacing makes a row count different from a calendar embargo; dropping an arbitrary preceding position neither defines the horizon nor checks arrival. If a new-person constraint also applies, intersect this mask with permitted subjects and refuse an empty training set. Success: show the two inequalities and exact ID sets.

</details>

### 15. Map local positions back to source identities (N5)

Outer training source IDs are [1,3,5,7,9,11,13,15]. An inner held splitter returns local positions [0,2,4,6]. Name the actual held source IDs and describe how to subset targets and groups. What if an inner position is 8?

<details><summary>Get a hint</summary>

The splitter indexes the eight-row outer subset, not the original sixteen-row table.

</details>

<details><summary>Show the explained solution</summary>

Indexing the outer list gives [1,5,9,13]. Features, targets and group metadata must all use these same original IDs, or first be identically subset to the outer list and then use the same local positions. Treating [0,2,4,6] as original IDs chooses other rows and can cross the outer boundary. Position 8 is outside local positions 0…7 and must refuse before fit. Success: provide the changed array, consistent metadata mapping and the bounds diagnosis.

</details>

### 16. Change the sampling law (N6)

Six unique recipe cards contain two acceptable cards. Find the probability of at least one acceptable recipe in three draws, first uniformly without replacement, then independently with replacement. Explain whether a particular missed draw contradicts either probability.

<details><summary>Get a hint</summary>

Without replacement count the all-unacceptable triples. With replacement multiply the three miss probabilities.

</details>

<details><summary>Show the explained solution</summary>

Without replacement gives 1−binomial(4,3)/binomial(6,3)=1−4/20=4/5. With replacement gives 1−(4/6)³=19/27. The draw lists are realizations; both laws assign positive probability to a miss. Using the independent formula for the without-replacement tool changes the experiment. Success: supply both exact fractions and distinguish probability from the observed sampled cards.

</details>

### 17. A branch prior is not a uniform union (N7)

Choose one of two conditional branches with equal probability. The first has two unique settings; the second has eight. Then choose uniformly inside the chosen branch. What is the mass of one setting in each branch? Compare uniform choice from all ten settings.

<details><summary>Get a hint</summary>

Multiply a branch probability by its conditional within-branch probability.

</details>

<details><summary>Show the explained solution</summary>

Masses are (1/2)(1/2)=1/4 and (1/2)(1/8)=1/16. Uniform union sampling would give every setting 1/10, hence branch masses 1/5 and 4/5. Neither distribution is intrinsically correct; they express different intended opportunities. Counting ten configurations and declaring equal mass ignores the sampling operation. Success: give all four masses and state what the branch-first sampler favours.

</details>

### 18. Select a row with failure and feasibility (N8)

Use the complete §6 table: A accuracy [0.80,0.90,0.70], cost [9,11,10]; B accuracy [0.85,0.80,0.90], cost [2,3,4]; C accuracy [0.95,0.94,failed], cost [1,1,1]. Require every fold to succeed and mean cost≤cap, then maximize mean accuracy with first-input ties. Find the decision at caps 5,2,10. At cap 10 change A's scores to [0.90,0.95,0.85]. What changes? How would you report a callable-refit search's selected score?

<details><summary>Get a hint</summary>

Filter complete feasible rows before ranking. A failed cell is neither a passing zero nor permission to omit a difficult fold.

</details>

<details><summary>Show the explained solution</summary>

A's mean accuracy/cost is 0.80/10; B's is 0.85/3. C is incomplete. Cap 5 chooses B, input index 1. Cap 2 refuses because no complete row is feasible. Cap 10 still chooses B. After the edit, A's mean is 0.90 at cost 10, so index 0 wins. For callable refit, read the selected index's explicitly named metric cells; `best_score_` is absent. Changing the objective after protected evaluation would create another adaptive rule. Success: give each decision and reason, preserve C's failure, and name the metric used in the report.

</details>

### 19. Keep the common shock in the mean (N9)

Let five centered scores be Z_k=aS+bE_k with independent fair signs, a²=1/5 and b²=4/5. Find each score's variance, each off-diagonal covariance and the mean's variance. Compare the falsely independent calculation.

<details><summary>Get a hint</summary>

The shared S survives averaging. Alternatively sum all 25 covariance cells.

</details>

<details><summary>Show the explained solution</summary>

Individual variance is 1; every off-diagonal covariance is 1/5. Mean variance is 1/5+(4/5)/5=9/25=0.36. Independence would give 1/5=0.20. The covariance sum confirms (5×1+20×1/5)/25=9/25. Training overlap alone does not identify a²; it was specified in this generative example. Success: connect the shared term to both the equation and the matrix calculation.

</details>

### 20. Subtract the noise of the comparison (N10)

Condition on training data with A=1/4 and true fitted-model error μ=1/2. Two independent fair binary holdout losses produce a mean H. Find E[(A−H)²], Var(H) and their difference. For the single outcome H=0, can the same subtraction be negative?

<details><summary>Get a hint</summary>

Enumerate H=0,1/2,1 with masses 1/4,1/2,1/4. The conditional cross-term vanishes because E[H−μ]=0.

</details>

<details><summary>Show the explained solution</summary>

Discrepancy is (1/4)(1/16)+(1/2)(1/16)+(1/4)(9/16)=3/16. Variance is (1/4)(1/4)+(1/2)0+(1/4)(1/4)=1/8. Difference 1/16 equals (A−μ)². At H=0, the observed subtraction is 1/16−1/8=−1/16. Nonnegative expected MSE does not force every finite subtraction to be nonnegative. Dependence would change Var(H), and a training-adaptive holdout would invalidate the conditional argument. Success: show the complete mass calculation and explain why this is not a universal confidence-interval algorithm.

</details>

### 21. Repeat the full bootstrap functional (N11)

For §7's x=[0,1,2,3], y=[0,0,1,1] and draw [0,0,2,2], diagnose an inner split that alternates occurrence positions and reports accuracy 1. What does the prescribed source-grouped selector score instead? Compute T for changed draw [0,1,2,3] at query 1.5. Explain what omitting all single-source draws does to the four-draw sampling law, and why bootstrapping a fixed previously selected candidate is another statistic.

<details><summary>Get a hint</summary>

Copies of one source must travel together. T is the final query's class-1 vote fraction after complete selection/refit, not inner or resubstitution accuracy.

</details>

<details><summary>Show the explained solution</summary>

Occurrence alternation puts one source-0 and one source-2 copy on both sides, letting validation reuse exact duplicated sources; accuracy 1 describes that wrong boundary. Source-grouped held folds train only on the opposite source/class, so both eligible candidates have pooled accuracy 0. First candidate k=1 wins, then all-resample refit yields T=1. On [0,1,2,3], k=1 gets 1/2 and 2/2 correct, pooled 3/4; k=2 gets 1/2 and 1/2, pooled 1/2. Refit k=1 with mean 1.5 and variance 1.25. Query 1.5 ties source 1/class0 and source 2/class1; source-ID tie gives T=0.

Of 256 equally likely ordered draws, the four constant-source draws cannot form two source-held folds. Undefined mass is 1/64. Omitting and renormalizing them describes a conditional law on 252 defined draws, which must be named; silently redrawing changes the recipe. Resample independent units appropriate to the scientific request, preserving all copies within each internal unit boundary. A group-unit bootstrap must sample complete groups. Freezing the previously selected candidate fails to repeat selection; it describes resampled refits of that fixed configuration rather than variation in the choice. Success: distinguish the three accuracies/statistics, give changed T and its tie path, and retain undefined probability explicitly.

</details>

### 22. Build every Hyperband bracket (N12)

Use original Hyperband integer rules at R=9,η=3. Derive smax and B, all bracket starts and evaluated rounds, fresh work, and conditional continuation work. Explain why a single nine-to-three-to-one tournament is not the whole algorithm.

<details><summary>Get a hint</summary>

Use ceilings for initial n and floors for round counts. Each bracket draws its own candidate pool. Continuation pays only increments if real saved state supports them.

</details>

<details><summary>Show the explained solution</summary>

smax=floor(log₃9)=2 and B=27. Bracket s=2 starts (9,1), then (3,3),(1,9), fresh 27 and conditional continuation 9+6+6=21. Bracket s=1 starts (5,3), then (1,9), fresh 15+9=24 and conditional continuation 15+6=21. Bracket s=0 evaluates (3,9), cost 27 under either interpretation. Totals are 78 and 69, with rounding preventing exactly equal bracket costs. One halving run lacks the other breadth/depth choices. A promised resume without retained sufficient state cannot claim 69. Success: list all paid rounds and both ledgers with their assumptions.

</details>

### 23. Transfer the report to a new deployment request (N13)

You have the familiar retained Penguins record. The product request changes to “classify birds on a new island next season.” Write a reproducible report of what the current record establishes and propose what additional data/protocol would be needed. Include source/metric units, baseline, ties, final refit and protected information. Do not invent a new score.

<details><summary>Get a hint</summary>

Retain 340/344 as the result of its actual row protocol. Ask whether island, season, availability and independent units in the supplied data can support the new request before selecting a splitter.

</details>

<details><summary>Show one acceptable reasoned answer</summary>

The retained 344-row experiment uses four measurements and sex, training-only imputation/scaling/encoding, three shuffled stratified outer folds (seed41), three inner folds (seed73), six k/scaler recipes and first-enumerated ties. It reports 340/344 pooled row accuracy and fold mean 0.9883549453, versus 152/344 for fitted majority baselines. Outer winners differ and include ties; final all-development reselection ties 3/Standard and 3/Robust at 0.9913043478, chooses the former and refits. That final number is selection evidence. Source, arrays, data roles and historical versions identify the result; no time or interval is inferred.

New-island next-season performance remains unestablished. We need representative island/season observations and a scientifically appropriate independent unit, with features available at prediction time and training labels available before fitting; protected outcomes can be collected later for assessment. A custom intersection can hold out islands and advance time if the resulting train/assessment sets, class coverage and number of independent units are feasible. The current island/year columns do not themselves guarantee that design or population coverage. If feasibility fails, collect suitable data rather than present random-row CV as certification. Fix all preparation, selection, stopping, metric/aggregation and failure rules in development, then assess on protected evidence matching the request. Success: preserve the old result's scope and provide an actionable data/boundary proposal without a fabricated deployment score. Other answers are acceptable if they justify the unit and information law equally clearly.

</details>

`practice_answers.py` is an optional answer asset, separate from the fifteen teaching programs. It calls the already displayed guarded helpers to reproduce the changed numerical tasks, uses exact fractions where appropriate and prints a short example report for the open task. It does not rerun the historical experiments or turn a capstone report into a measured generalization claim. Its input bounds and model assumptions are those of the referenced helpers.

<!-- Programme A01: insert practice_answers.py and actual full stdout here. -->
