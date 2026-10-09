# Multi-Label & Multi-Output Learning

One message can need several answers. “I cannot sign in to pay my bill” concerns both account access and billing. One building configuration can also need several answers: a heating load and a cooling load. The answers share an input, but their meanings, errors and useful relationships differ. We will first make those output objects explicit, then build separate and coupled predictors, and finally follow an actual held-out experiment from source rows to saved predictions.

You can begin with fractions, arrays and a binary classifier. The first seven sections establish the main path. The visible deeper passages explain joint decisions, ranking, cross-fitting, shared regression and compression after their concrete examples. They refresh the required probability and matrix operations locally. The Learning compass supplies the single section index and prerequisite links. The common file index collects the complete sources. The last two sections provide changed-input practice and the next question.

## 1. One observation can need several answers

What should a system return for our message? Choosing only “Billing” would lose the access problem; choosing only “Access” would lose the billing problem. Give each question its own named answer slot.

<!-- diagram:D01 -->

Read the message once, extract the shown `sign_in=1` and `bill=1` features, then follow both paths to the output sockets. Billing is 1, Access is 1, and Urgent is 0. These are three binary questions about the same observation. **Multi-label classification** permits several 1s in one output row. The illustrated features and answers are constructed to expose the interface; they are not a claim about a deployed message classifier.

An **observation** is one input together with the outputs we know about it. A **label** is the identity of an output question, not the position where we happen to store its answer. Billing/A stays amber, Access/B blue and Urgent/C violet throughout the connected examples. A filled mark and literal 1 mean present; an open mark and 0 mean known absent. A hatched question mark means unobserved. A white selection outline changes which object we inspect without changing its identity.

<!-- diagram:D02 -->

The three collections `{Billing, Access}`, `{Urgent}` and `{}` become rows 110, 001 and 000 under the vocabulary `[Billing, Access, Urgent]`. The empty collection says that every listed question was checked and none was positive. It is different from a record whose Access answer was never checked. Reorder the vocabulary below the picture: the values move with their names, so a storage permutation cannot turn an access answer into a billing answer. Reset restores the original order and selected row.

For n observations and L labels, the complete binary target is Y∈{0,1}ⁿˣᴸ. The row sum |Y_i| is its **label cardinality**. Average cardinality is n⁻¹Σ_i|Y_i|; **label density** divides that mean by L. These three rows contain 2+1+0=3 positives, so average cardinality is 1 and density is 1/3. Low density is a storage opportunity, not a guarantee that every label has sufficient training support.

`schema.py` shows the fixed-vocabulary encoding. `encode_collections` in `masked-binary-heads.py` uses ordinary `MultiLabelBinarizer(classes=names)`, after checking that every name is in the declared schema. That check matters because an unfamiliar name is a schema error, not an observed negative. `sparse_output=True` stores the same positive cell identities economically; it does not change what zero means. Supply a list of collections: a bare string is a sequence of characters, not a one-label collection.

<!-- code:schema.py -->
<!-- code:masked-binary-heads.py -->

The known-empty row in the complete program is retained as 00. The unfamiliar-name example is rejected. Compare these outcomes before adapting the schema to a new vocabulary. An output contract must specify whether omitted names mean checked absence or merely incomplete annotation; a binarizer cannot infer that collection policy.

<!-- diagram:D03 -->

Now replace the sockets. Fruit has one member of `[apple, pear, orange]`; Condition has one member of `[fresh, damaged]`. Each is a separate **categorical output**, with its own class vocabulary. A building instead returns two real numbers, Heating and Cooling, in the supplied load units. That is **multi-output regression**. The common array shape does not make the tasks interchangeable: binary probabilities need not sum across labels, one categorical output's class probabilities do sum to one, and a numerical output requires a unit and an error scale. We will preserve each distinction rather than choosing a model from the word “multi-output” alone.

## 2. Keep observations together and unknown labels unknown

A correct target row is only the beginning. If two messages paraphrase the same source request, can one teach the model while the other claims to be an independent test?

<!-- diagram:D04 -->

The constructed text case has 32 deliberately constructed messages in 16 two-message groups. Training uses 8 groups/16 messages, validation 4 groups/8 messages and test 4 groups/8 messages. Follow both members of a selected group into the same partition. The comparison control shows what would go wrong if rows were split independently: familiar wording can cross the boundary. It illustrates an information path; it does not manufacture a new measured experiment. The text vocabulary is fitted on training messages and then frozen for every held message.

Split observations before fitting learned transformations. Fit input scaling, feature selection, output transforms and labelset vocabularies using training rows only. Validation can choose a stated recipe; the untouched test can assess the chosen recipe. Time or group boundaries take priority when they define the question. Ordinary `GroupShuffleSplit` and `GroupKFold` preserve groups; balancing each label in isolation and then assembling mismatched splits destroys observation identity.

<!-- code:masked-binary-heads.py -->

Rare labels make allocation harder. Six target rows 100,100,110,010,001,000 contain A three times, B twice and C once. Two equal-capacity folds would ideally receive [1.5,1,.5] positives each. Half an observation cannot be assigned.

<!-- diagram:D05 -->

Start with the least frequent remaining positive label, C. Choose its only row and put that whole row into an available fold with the greatest C deficit. Decrement the fold's capacity and the remaining counts of **every** positive label on that row. Continue with the next remaining rare label; place the all-negative row using remaining capacity. The step control exposes each row movement and deficit. A tie seed resolves only declared ties, never searches for a flattering model score.

`iterative_folds` implementation orders scarce labels, carries stable row IDs, updates the full selected row and handles empty-label rows. It is a greedy allocation procedure, not a proof that all desired supports can be met. With one C-positive and two folds, “C positive in every fold” is impossible. The program's separate three-fold fixture prints its exact memberships `[0,1,2,1,0,2]` and support table; that executed fixture is distinct from the two-fold picture. Scikit-learn supplies group splitters but no built-in iterative multilabel stratifier. Use the actual allocation function when that is the declared task, and check feasibility before interpreting a fold's missing class.

An annotation boundary is separate from a partition boundary. If an Access answer is unobserved, its input remains usable for known Billing answers. Its missing Access bit must not enter supervised loss as zero.

<!-- diagram:D06 -->

The mask M has the target's shape. M_ij=1 permits the loss term for an observed answer; M_ij=0 gates it out. Follow the surviving cells into each output's sum and count n_j=Σ_iM_ij. A zero n_j means that output has no observed training answers. It cannot support a supervised fit. Toggle a cell and inspect the changed denominator, then Reset to restore both mask and editor state.

Two reductions answer different weighting questions. A mean over all observed cells weights labels in proportion to their observed counts. A sum of per-output observed means weights each supported output equally: J=Σ_j[n_j⁻¹Σ_i M_ij ℓ_ij]. Our observed-head program uses the latter. Section 4 derives its gradient. A mask is bookkeeping for observed risk; it does not correct a biased observation process. If people annotate only obvious urgent cases, the observed Urgent sample differs from the population. Recovering population risk needs assumptions about that selection mechanism—for example, known nonzero observation probabilities for importance weighting—not merely multiplication by M.

## 3. Decide whether the error belongs to a cell, a row or a ranking

Once rows and masks are sound, what does “correct” mean? A response with two correct answers and one missing answer may be acceptable for one task and unusable for another.

<!-- diagram:D07 -->

The four rows use literal Code/Hardware/Energy questions rather than silently renaming them Billing/Access/Urgent. Their truth is 101,011,110,001 and predictions are 101,010,100,011. Trace every positive match into TP, every extra positive into FP and every missed positive into FN: TP=5, FP=1, FN=2. Three of twelve cells are wrong, so **Hamming loss** is 3/12=.25. Only the first complete row matches, so **exact-set accuracy** is 1/4=.25. Equal numbers here do not make the definitions equal.

Edit a binary prediction cell and watch the affected row and cell counters. Mark the designated Hardware answer unknown and it leaves observed-cell evaluation. A complete-vector score may use only fully observed rows; pretending an unknown vector is complete would invent an answer. State that row policy and denominator alongside the result.

<!-- diagram:D08 -->

**Precision** TP/(TP+FP) asks what fraction of predicted positives were correct. **Recall** TP/(TP+FN) asks what fraction of known positives were found. F1=2TP/(2TP+FP+FN) combines them when its denominator is nonzero. Micro F1 pools all cells first, yielding 10/13≈.769231. Macro F1 computes each named label's F1 and averages. A is [1,0,1,0] versus [1,0,1,0], so F1=1. B is [0,1,1,0] versus [0,1,0,1], giving F1=.5. C is [1,1,0,1] versus [1,0,0,1], so TP=2,FN=1,FP=0 and F1=4/5. The macro result is (1+.5+.8)/3=.766667. Follow the three separate column counters in the picture; the result depends on identity-aligned columns.

Samples F1 computes one F1 per row, then averages: 1,2/3,2/3,2/3 give .75. Micro is a pooled count ratio; macro gives each label equal weight; samples gives each observation equal weight. Support-weighted F1 is another choice, not macro. Both-empty rows have a zero denominator. The complete program and default evaluation use `zero_division=0`; changing it to 1 changes that particular convention and possibly an average, not any nonempty row's arithmetic.

<!-- code:metrics.py -->

The ordinary calls name the reduction explicitly: `f1_score(Y, prediction, average='micro', zero_division=0)`, or `'macro'` or `'samples'`. `accuracy_score` on complete multilabel rows means exact-set accuracy. The full program computes the direct counters first, then the API results. Storage dimensions and an apparently plausible metric value do not establish that the intended axis was used.

A second surprise comes from **Jaccard similarity**, |truth∩prediction|/|truth∪prediction|. For one nonempty row, F1=2J/(1+J), an increasing transformation. Does that make averaged rankings identical?

<!-- diagram:D09 -->

Two rows each contain five true labels. Candidate A predicts all five on the first and none on the second: mean J=.5 and mean F1=.5. Candidate B predicts two correct labels on both: each J=2/5=.4 but each F1=4/7≈.571429. J favors A, while averaged F1 favors B. The transformation is increasing per row and nonlinear. Transforming the mean is a different operation from averaging transformed row values.

Sometimes we want a useful order before choosing a set. Rank four labelled score objects A=.8, B=.8, C=.3, D=.1, with A/C relevant and B/D irrelevant.

<!-- diagram:D10 -->

There are 2×2=4 relevant–irrelevant pairs. A above D and C above D are correct; the A/B tie and C below B count as errors under the current API convention. **Ranking loss** is 2/4=.5. LRAP asks, for each relevant label, what fraction of all labels at least as high as it are relevant. A gets 1/2 at the top tie; C gets 2/3. Their mean is 7/12≈.583333. **Coverage** is the maximal rank needed to reach all relevant labels: 3, with the tied top group occupying ranks through 2. The score/truth controls expose ties, empty truth and all-positive truth rather than only the reference state.

For observation i with R_i relevant labels, ranking loss divides wrong pairs by R_i(L−R_i), with zero when there is no eligible pair. LRAP is 1 for empty or all-positive truth in the inspected API; coverage is 0 for empty truth and L for all-positive truth. These are declared conventions, not fractions with an unmentioned zero denominator.

<!-- code:ranking-and-calibrated-labels.py -->

`ranking_metrics` implements the pair comparisons and maximal tied ranks directly. It is compared with `label_ranking_loss`, `label_ranking_average_precision_score` and `coverage_error`. `step_average_precision` groups equal scores before updating precision and recall. Average precision over one label ranks **observations**; LRAP ranks **labels within each observation**. AP is Σ_g(Δrecall_g)precision_g at score-group thresholds, not trapezoidal precision–recall area. The ordinary empty-positive AP warning remains an actual outcome of the program, with the declared value zero.

Deeper: even an ideal probability ranking depends on the loss's normalization. In a four-label law, truth AC occurs with probability .55 and B alone with .45. Raw marginals rank A (.55) above B (.45). But AC rows have four eligible pairs while B-only rows have three. The relevant weights are .55/4=.1375 for A and .45/3=.15 for B. Swapping only A/B reduces expected normalized ranking loss from .3 to .275. It does not contradict the usefulness of marginal probabilities; it shows that an unnormalized pair objective and a row-normalized one assign different event weights. The program computes both complete outcomes and both expected losses instead of asserting a universal ordering theorem for raw marginals.

## 4. Build one binary head for each output

Cell-wise errors suggest a transparent first predictor: one binary head per named question. Does each head need to compete for probability mass?

<!-- diagram:D11 -->

The two input coordinates x=[1,−1] fan into three weight columns. W's rows are [1,−1,.5] and [.5,1,−.5], with biases [0,.5,−1]. Multiply and add for A: 1×1+(−1)×.5+0=.5. B gives −1−1+.5=−1.5; C gives .5+.5−1=0. The sigmoid p=1/(1+exp(−z)) yields [.622459,.182426,.5]. Change one selected bias: only that head's logit and probability change. No normalization across labels occurs.

For X∈ℝⁿˣᵈ and W∈ℝᵈˣᴸ, the matrix XW+b collects those dot products. A sigmoid probability is the head's model of one binary event. It is not one class in a mutually exclusive L-way softmax. With threshold ≥.5, the reference decisions are 101. The equality boundary is explicit; an ordinary estimator may use a different hard-label tie convention.

<!-- diagram:D12 -->

Take one logit z=0 and target y=1. Sigmoid gives .5, binary cross-entropy gives log 2, and the derivative with respect to z is p−y=−.5. Multiplying by x=[1,−1] sends slope gradients [−.5,.5] back along the two input paths. For the bias, the input is 1. Change target to zero and the residual becomes +.5; change z toward a very wrong extreme and inspect the stable loss rather than computing log of a rounded probability.

Write ℓ(z,y)=logaddexp(0,z)−yz. This is mathematically −y log p−(1−y)log(1−p) but evaluates the scalar logit form stably. The derivative follows because d log(1+exp z)/dz=σ(z). At z=100,y=0, the stable loss is approximately 100 even if σ(100) rounds to 1 in floating point. Stable loss does not claim that finite-precision probabilities never reach an endpoint.

The complete `numpyHeads.py` teaches one vectorized full-observation fit, with a mean over rows and a sum over labels. Its normalization is preserved. The observed-head route changes the task to separately observed subsets and therefore names its different denominators.

<!-- code:numpyHeads.py -->
<!-- diagram:D13 -->

The leading-intercept design has rows [1,−1],[1,0],[1,1],[1,2]. Targets are 01,00,11,10; mask rows are 11,10,11,01. At zero weights, A observes rows 0,1,2 and B observes rows 0,2,3, each with n_j=3. For A, residuals are [.5,.5,−.5]. Intercept gradient is (.5+.5−.5)/3=1/6 and slope gradient is (−.5+0−.5)/3=−1/3. For B, residuals [−.5,−.5,.5] give −1/6 and +1/3. Toggle a mask cell and follow the changed design rows, sums and count rather than multiplying by an unchanged denominator.

For supported column j, J_j(w_j)=n_j⁻¹Σ_observed ℓ(x̃_iᵀw_j,y_ij)+(λ/2)||w_j,slopes||². Here x̃ adds an intercept coordinate. Its gradient is x̃_jᵀ(p_j−y_j)/n_j+λw_j on slopes, and its Hessian is x̃_jᵀdiag [p_j(1−p_j)]x̃_j/n_j plus slope penalty. The intercept is unpenalized. We reuse the complete stable, damped Newton optimizer from [Linear & Logistic Regression](/learn/topic/linear-logistic-regression), supplied exactly as `multioutput_newton.py`; this program composes its import-safe functions and never runs its separate demonstration.

`fit_observed_heads` extracts only the known rows for each label and fits that supported subproblem. Ordinary `LogisticRegression` must receive the same rows and effective penalty. In the inspected library objective, C=1/(n_jλ) matches this mean-loss-plus-λ/2 convention. At n_j=3,λ=.1, C=10/3. In the fit's distinct eight-row constructed fixture, each column has seven observations, so C=10/7. The recorded probability difference between Newton and ordinary fits is about 1.11×10⁻⁹ under those matched settings.

<!-- code:multioutput_newton.py -->
<!-- code:masked-binary-heads.py -->

A one-class observed column uses the program's explicit constant baseline and ordinary `DummyClassifier`, not a fabricated finite maximum-likelihood logistic optimum. A completely unobserved column is rejected. Preserving feature width on constant branches prevents a query with the wrong input schema from looking valid. Known labels and observation masks are separate inputs throughout.

Deeper: minimizing expected additive binary loss requires each true marginal P(Y_j=1|X). It does not require that the entire vector factorize into independent labels. Separate estimators can be poor models of those marginals or inefficient with little data; that is different from a theorem claiming independent outputs. Nor does a shared hidden representation necessarily produce a complete joint law. We will separate these forms of sharing as we proceed.

## 5. The best answer changes when the loss changes

Suppose the probabilities are known. Is there one universally best answer vector? The answer must include the error we care about.

<!-- diagram:D14 -->

The A/B law counts 00 six times, 01 five, 10 once and 11 eight times, total 20. Divide to obtain masses [.3,.25,.05,.4]. A's positive marginal is (.05+.4)=.45; B's is .25+.4=.65. Edit a selected count and the normalized bars, marginal sums and connected decision views update together. Counts are nonnegative integers; all four zeros define no probability distribution, so dependent values become explicitly unavailable rather than reusing an old law.

<!-- diagram:D15 -->

For action a and outcome y, normalized Hamming loss counts differing bits and divides by two. Expected Hamming risks for actions 00,01,10,11 are .55,.4,.6,.45. For example, action 01 has loss .5 on 00,0 on 01,1 on 10,.5 on 11, giving .3×.5+.25×0+.05×1+.4×.5=.4. It chooses 01. Subset loss is 0 only for an exact vector match and 1 otherwise; its risks are .7,.75,.95,.6, choosing 11. The full matrix in the picture exposes every product before summing.

The **Bayes action** minimizes expected loss R(a|x)=Σ_y P(y|x)ℓ(a,y). Additive Hamming loss lets each coordinate minimize separately: choose 1 when p_j≥.5 under our positive tie rule. Subset loss instead chooses a joint mode, also called maximum a posteriori or MAP. An exact risk tie needs a declared action rule; the complete-law program returns its tie set and uses a named lexicographic or reverse-lexicographic order. A tie is a decision convention, not a new probability estimate.

<!-- code:joint.py -->

The complete `all_action_risks` route validates every vector/mass and evaluates every supported action. Exponential enumeration is useful for a small law because all terms remain inspectable. It cannot be treated as a scale-free solution when L grows. Its explicit operation/state budgets fail before oversized allocation; a hardware-independent label-count slogan would hide the actual work.

F1 asks a different question again. For one row with truth Y and predicted set A, F1=2|A∩Y|/(|A|+|Y|), except that an empty/empty pair needs its separately stated payoff. Can we choose the expected-F1 set without searching all 2ᴸ actions?

<!-- diagram:D16 -->

For predicted size k, write the expected reward as Σ_{j∈A}Δ_jk, where Δ_jk=Σ_s [2/(k+s)]P(Y_j=1,|Y|=s). At k=1, A's gain is 19/60 and B's 31/60, so choose B with reward .516667. At k=2, gains are A=7/30 and B=11/30, totaling .6. Predicting empty has reward .3 when empty/empty payoff is 1. Comparing sizes chooses AB, with expected F1 .6. Change the law to counts 18/1/0/1: empty mass .9 can make the empty prediction best. Change the empty payoff to zero and that candidate's reward changes; it does not alter nonempty set gains.

For each k, choose the k largest gains. Compare all k=1…L and the empty action. This is the generalized F-measure maximization construction. It needs cardinality-indexed joint moments, not marginals alone: P(Y_j=1,|Y|=s) carries how many other positives accompany j. Constructing the gains naively costs O(L³); sorting each size costs O(L² log L). Parameter estimation is additional work. The standalone moment route accepts consistent moments without materializing a full law, while the small-law route independently verifies every candidate by exhaustive expected reward.

This derivation optimizes **expected instance F1**. Pooled micro F1 across a collection is a ratio of combined counts, so its decisions need not decompose into independent per-observation expected-F1 optimizers. Fixed-size gains and exact complete-law arithmetic should not be advertised as a proof of optimal test micro F1. The [F-measure paper](https://jmlr.org/papers/v15/waegeman14a.html) explains the loss-dependent distinction and the additional information its optimizer needs.

<!-- code:joint-f1-decisions.py -->

## 6. Turn scores into decisions using development evidence

The preceding risks assumed a correct probability law. In practice a fitted head may return an imperfect probability, a margin or a vote. We need to state both its meaning and how a decision cutoff was chosen.

<!-- diagram:D17 -->

Six observation scores [.9,.8,.8,.55,.4,.2] have truth [0,1,0,1,1,0]. At threshold .5 with ≥, four observations are positive: TP=2,FP=2,FN=1, giving F1=4/7. Lowering to .4 includes the missed positive and gives TP=3,FP=2,FN=0,F1=.75. A cutoff just above .8 excludes both equal .8 scores together. No scalar threshold can separate their different truth bits. The editable domain ends at 1.01 so even a score of 1 can be excluded; a cutoff is not itself a probability.

Candidate decisions change only when a cutoff crosses a score. For a fixed validation set, search score breakpoints plus the declared none-positive endpoint instead of pretending every hundredth step yields a distinct set. Record the tie convention for scores exactly on the cutoff and the tie rule between equally scoring cutoffs. Those are parts of a recipe, not details to choose afterward from test truth.

<!-- diagram:D18 -->

The two-output illustration has truth 10,10,01,00 and scores [.9,.7],[.8,.6],[.4,.55],[.1,.45]. At both cutoffs .5, TP=3,FP=2,FN=0 and micro F1=.75. A and B feed either one pooled ratio or two separate per-label ratios. Moving a cutoff can therefore change the other label's influence on the pooled objective without changing its predictions. Optimizing each label's F1 individually does not generally optimize micro F1.

<!-- code:thresholds.py -->

The complete `thresholds.py` uses a separate six-row/two-column fixture and enumerates its score breakpoints. It compares a shared cutoff, independently chosen per-label F1 cutoffs and joint micro-F1 cutoff combinations. The product of candidate lists is exhaustive for that small fixture and grows rapidly for many labels; validation procedures at scale need their own stated search budget. Its recorded output describes that fixed fixture. Keep that fixture's results distinct from the live four-row illustration.

If scores are calibrated probabilities and false-positive cost is c_FP while false-negative cost is c_FN, choosing 1 has risk c_FP(1−p), and choosing 0 has risk c_FNp. The Bayes cutoff is p≥c_FP/(c_FP+c_FN), assuming positive total cost and our tie rule. This derivation concerns those costs and probabilities. Tuning a threshold on a margin to maximize validation F1 is a different decision rule.

<!-- diagram:D19 -->

Class weighting changes the learning objective before thresholding. With positive BCE multiplied by c, the idealized conditional optimum solves q=cp/(1−p+cp), or odds(q)=c·odds(p). For p=.2 and c=4, q=.5. The inverse is p=q/[c−(c−1)q]. Move p and c below the picture to follow both odds and probabilities. At p=0 or 1 the limiting result is the same endpoint; no infinite-odds computation is needed.

The formula follows by setting −cp/q+(1−p)/(1−q)=0. It assumes this exact weighted conditional-risk problem and a model able to represent its optimum. It does not undo arbitrary sampling, regularization, model misspecification or a different imbalance procedure. A weighted score q=.5 can correspond to original p=.2; calling it calibrated original probability would confuse the event scale. Calibration, class weighting and cost-driven thresholding each have a distinct operation and fitting boundary. Use held development evidence to assess the actual score when the idealized assumptions do not hold.

We now have output identities, honest rows, chosen losses and declared score-to-decision rules. The next question is whether earlier answers can help predict later ones without showing a serving model the unknown truth.

## 7. Let later classifiers use earlier answers

A Billing answer can be informative for Access. Can a later classifier use it when the true Billing answer is unavailable at serving time?

<!-- diagram:D20 -->

A **classifier chain** orders the output questions. During teacher-forced training, stage A receives the original d features, stage B receives those features plus true A, and stage C receives the features plus true A/B. At serving, A is predicted first; B receives predicted A; C receives the predicted prefix. Follow the distinct true-bit and predicted-bit ports. Changing order changes stage widths and information available to each stage, while the final inverse permutation restores each output to its original named column.

The probability chain rule writes a complete conditional law as P(y|x)=Π_j P(y_{π_j}|x,y_{π_1},…,y_{π_{j−1}}) for an order π. Every exact distribution has such a factorization. That algebra does not say one label causes another, nor that a fitted collection of restricted classifiers estimates every factor accurately. Hard sequential prediction uses one path through that law, not necessarily the best vector for the chosen loss.

<!-- diagram:D21 -->

Return to counts 6/5/1/8. A's branch masses are P(A=0)=11/20=.55 and P(A=1)=9/20=.45. On the A=0 branch, B=1 has probability 5/11, so B=0 has 6/11. Multiply .55×6/11=.3 for 00 and .55×5/11=.25 for 01. On A=1, B=1 is 8/9, producing .4 for 11 and .05 for 10. Both zero and one factors matter. Refactor BA and the same four leaves remain: order changes the factorization, not this supplied law. If a predecessor branch has mass zero, its conditional is undefined and unused; every descendant has zero mass without evaluating 0/0.

<!-- diagram:D22 -->

Greedy AB takes the larger first branch A=0, then B=0 because 6/11>5/11, ending at 00 with mass .3. Greedy BA takes B=1 because .65>.35, then A=1 because 8/13>5/13, ending at 11 with mass .4. Exact MAP compares all leaves and chooses 11. A locally best edge need not lead to the globally heaviest leaf. In this example only one order's greedy path reaches that leaf; editing the connected law can change both outcomes.

<!-- diagram:D23 -->

To obtain B's marginal, add the two B=1 leaves: P(B=1)=P(01)+P(11)=.25+.4=.65. It is neither B's 5/11 conditional on A=0 nor its 8/9 conditional on A=1. Whole-vector decoding, greedy decisions and marginalization are separate operations on the same law. If the goal is Hamming loss, use the integrated marginals; if the goal is subset loss, compare complete masses. If a different loss is declared, compute its expected risk.

<!-- code:chain-fit-and-decode.py -->
<!-- code:chain_core.py -->

The complete chain implementation fits every stage rather than supplying unexplained probability functions. `fit_chain` fits the original-input scaler on training X, assembles true predecessor columns and calls the exact Newton optimizer or the named supported constant branch. `serve_greedy` serves predicted bits with our ≥.5 convention. Exact inference batches all distinct prefixes at each depth: one stage call per depth, one probability calculation per prefix, then children multiply by p or 1−p. It does not recompute the same prefix independently for every completed leaf. After enumeration, the restore map carries π-ordered leaves back to the original output schema.

There are 2ᴸ leaves and 2ᴸ−1 internal prefixes, so exact inference still grows exponentially. The implementation estimates allocation and arithmetic work before materializing them; larger unsupported requests produce an actionable resource result. Marginalizing an enumerated law costs O(L2ᴸ) for its leaf sums. This is an inspectable bounded reference route, not an inference guarantee for arbitrary large chains.

The constructed fit uses 16 rows, two original features and three outputs, with all eight binary patterns appearing twice and order C,A,B. Its two shown queries produce greedy 001 and 110, while integrated marginals are approximately [.483480,.467281,.519104] and [.555862,.567643,.436046]. The program prints the training rows, stages, true-prefix inputs and full query laws, so an alternate action can be computed from the same fitted evidence. Its ordinary `ClassifierChain` recipe matches penalty, scaler and teacher-forced training before comparing probabilities; the recorded coefficient difference is about 1.65×10⁻⁹. The hard-label equality rule can differ at exactly .5, so comparisons away from that boundary do not erase it.

<!-- diagram:D24 -->

The separate recorded 240-row library example exposes a common API misunderstanding. `predict_proba` returns [.512477,.771639] in original output order. The first predicted predecessor feature is 1, so the second number comes from that chosen prefix. Integrating both predecessor branches instead yields B marginal .569133. Its saved rounded leaves are [.313837,.173685,.117030,.395447]. The picture labels their displayed precision; their rounded products are not reconstructed full-precision fitted parameters.

<!-- code:chainApi.py -->

In the inspected current API, use `estimator=...`, inspect `order_`, and restore original column identities when examining stages. `cv=None` trains later stages with true prior labels. `chain_method='predict'` uses hard predecessor features at serving; probability-valued features and stage-wise cross-validated training are separate declared recipes, not automatically the same teacher-forced model. A returned probability array is meaningful only after naming the features on which each entry was conditioned.

## 8. Separate representation, context, cross-fitting and chain averaging

A chain uses earlier answers as features. Before interpreting an improvement, ask what kind of information those features add to a restricted classifier and how they were obtained.

Consider the four raw input corners (a,b)=00,01,10,11. Their desired OR answers are 0,1,1,1; AND answers 0,0,0,1; XOR answers 0,1,1,0. A raw-input linear threshold cannot implement XOR with the declared ≥0 positive rule. The two positive opposite corners have the same midpoint as the two negative opposite corners, so a line cannot separate their convex hulls.

<!-- diagram:D25a -->

The first two heads create coordinates u=OR(a,b) and v=AND(a,b), using scores a+b−.5 and a+b−1.5. The third head thresholds u−v−.5. Trace 01: OR score .5 gives u=1, AND score −.5 gives v=0, and XOR score .5 gives 1. At 11 the transformed point is (1,1), so the last score is −.5 and XOR is 0. The raw square and transformed plane keep corner IDs visible: 01 and 10 coincide at (1,0), with both source IDs attached. The new representation makes the desired boundary linear in its displayed coordinates.

| Raw (a,b) | OR/A | AND/B | XOR/C | (u,v) | Last score |
| --- | ---: | ---: | ---: | --- | ---: |
| 00 | 0 | 0 | 0 | (0,0) | −.5 |
| 01 | 1 | 0 | 1 | (1,0) | .5 |
| 10 | 1 | 0 | 1 | (1,0) | .5 |
| 11 | 1 | 1 | 0 | (1,1) | −.5 |

This is a fixed representation witness, not evidence that a particular fit discovered these heads. It can be written as chain A→B→C: B ignores A, while C ignores the raw inputs and uses A/B. Training with true prefixes supplies the desired transformed bits; serving must obtain them from previous heads. At raw 11, flip the served AND bit from 1 to 0 below the picture. The last score becomes +.5 and the XOR decision becomes 1 although the desired answer remains 0. The operation clarifies both useful representation and error propagation.

The two controls select a raw corner and either no flip or one served OR/AND flip. Reset restores 01 with no flip. `gate_witness` in the complete chain dependency computes the scalar heads. The complete chain program compares them with an ordinary NumPy matrix route for every corner and changed prefix. Refresh the raw linear-boundary argument in [Perceptrons, §2](/learn/track/deep-learning-fundamentals/perceptrons-neurons-activation-functions#2-a-perceptron-learns-a-boundary-from-mistakes) and the transformed representation in [§3](/learn/track/deep-learning-fundamentals/perceptrons-neurons-activation-functions#3-hidden-neurons-change-what-the-model-can-express). The witness does not create new raw information, imply causality, or promise a gain for every learner class; it changes what the restricted downstream linear head can express.

<!-- code:chain_core.py -->

Observed context provides a different explanation for association. Imagine low and high contexts in which both A and B have positive probabilities .1 and .9 respectively, independently within each context.

<!-- diagram:D25 -->

Within the low context the joint 11 mass is .01; within the high it is .81. Mix them equally: joint masses become [.41,.09,.09,.41], marginals are both .5, but pooled P(B=1|A=1)=.41/.5=.82. A is informative about B in the pooled sample even though each conditional context law factorizes. The observed context belongs among input features, not as a causal arrow between labels. Move the mixture share to an endpoint: only one context remains. Make the two context rates equal and the mixture-induced association disappears.

<!-- code:association.py -->

The exact-fraction program computes those masses. Practice E changes the mixture share. Statistical association alone does not tell us whether the appropriate improvement is a label interaction, a better measured context variable or a more expressive model of existing inputs.

A shared multilabel tree also needs a declared criterion. Does adding marginal entropies assert a factorized joint distribution?

<!-- diagram:D26 -->

Four rows at x=0,1,2,3 have output vectors 00,00,11,11. Each label's positive fraction is .5 and binary entropy is 1 bit, so the summed marginal entropy is 2 bits. Only two joint vectors occur, equally, so joint entropy is 1 bit. A cut at 1.5 makes both children pure: gains are 2 and 1 respectively. Both are valid computed criteria; they measure different quantities. The sum of marginal entropies is at least joint entropy, with equality for independent coordinates. Using the sum as a split surrogate does not require actual independence. The native library's fixed-L mean marginal impurity rescales that sum by L, leaving the cut ordering unchanged in this setting.

`entropy_split` exposes parent and child probabilities before computing the weighted gain; the actual ordinary entropy-tree comparison chooses cut 1.5 and parent mean impurity 1. Different row weights, missing-output policies or label subsets would need a separately stated reduction, rather than borrowing this equivalence silently.

<!-- code:masked-binary-heads.py -->

An explicitly joint model makes a different commitment: it assigns one normalized mass to every complete answer vector.

<!-- diagram:D27 -->

Give A/B bits score λ_A A+λ_B B+λ_AB AB. With λ_A=λ_B=0 and λ_AB=log 4, unnormalized masses are 1,1,1,4. The one normalizer is Z=7, giving probabilities 1/7,1/7,1/7,4/7. For observed 11, the AB feature equals 1; its expectation is 4/7, so the negative-log-likelihood gradient for λ_AB is 4/7−1=−3/7 before any penalty. Increasing that parameter initially reduces this observation's loss. At interaction 0 the bare two-bit law factorizes.

With fixed features φ(x,y), write log P_θ(y|x)=θᵀφ(x,y)−logΣ_u exp [θᵀφ(x,u)]. The mean negative-log-likelihood gradient is average(model-expected φ−observed φ). Its Hessian is the average covariance of φ under the model; covariance is positive semidefinite. Adding positive L2 on a minimal identifiable feature basis makes the declared objective strictly convex. Changing or learning the feature map itself need not preserve that convexity statement.

<!-- code:joint-f1-decisions.py -->

The complete small fixed-feature fit uses φ=[A,xA,B,xB,AB], not a hidden arbitrary graphical solver. `log_linear_objective` computes stable log-sum-exp probabilities, expected features and the covariance Hessian. `fit_log_linear` performs a damped Newton solve and checks sufficient objective decrease; ordinary SciPy BFGS minimizes the exact same objective independently. On its declared context/count fixture, the final objective is 1.29026706 and the fitted coefficients are approximately [−.019288,−.022033,.214744,.361184,.471701]. The scratch gradient residual is near floating-point zero and the ordinary coefficient/gradient comparison is retained. This bounded normalization enumerates four states; general graph factorization, treewidth and message passing belong to [Conditional Random Fields](/learn/topic/conditional-random-fields-crfs).

Training features create another boundary. A later-stage model that consumes earlier predictions needs predictions obtained without using the held row's own answer. Is one globally generated out-of-fold column sufficient for every later stage?

<!-- diagram:D28 -->

For held fold h and a requested prefix of length j, fit **every** prefix stage and its original-input scaler on the complement of h, then serve that whole system into h. The held rows have no path into the fitted states used to construct their prefix. After assembling these fold-held prefixes, fit the final stage on its declared full training rows. The selected fold control exposes IDs on each fit and serve arrow; the stage-wise comparison shows a possible indirect path through globally generated upstream columns.

`fit_strict_prefix_chain` implements that stronger isolation explicitly. With K folds and L stages, generating all length-j teacher-forced prefixes for j=1…L−1 takes KΣ_j j fits, plus L final-stage fits. Preprocessing repeats on the same legal complements. This is not recursively cross-fitting every feature within each complement; it names the precise isolation property it guarantees. Ordinary `ClassifierChain(cv=...)` creates its documented stage-wise cross-validated predecessor features, which is a different recipe. The comparison does not accuse every such prediction of being numerically biased; it distinguishes information paths before a task chooses its required boundary.

<!-- code:chain_core.py -->

One chain order can still be unstable. What exactly do several chain systems average?

<!-- diagram:D29 -->

Three members have distinct bags, orders and restored output sockets. Bootstrap duplicates have unique draw IDs while retaining their repeated original source IDs. Fit all stages for each member, serve the same query, and restore A/B/C before pooling. A hard-vote mean averages decisions. A path-score mean averages probabilities conditioned on each member's served prefixes. A complete-joint mean averages full probability laws. Only the last directly yields an integrated ensemble joint law and its marginals.

The complete program trains those three member systems. On its first shown query, hard-vote decisions are 101 while the mean complete-law MAP is 100; on the second both produce 110. The program records every order, bag, stage and query law rather than presenting a hand vote table as fitted evidence. Averaging does not remove the need for validation-selected order/bag/decision settings. The [Ensemble lesson](/learn/topic/ensemble-methods-stacking) develops bootstrap identity and combining errors; here the distinct output objects determine what combining means.

<!-- code:chain-fit-and-decode.py -->

## 9. Treat a labelset as a category, then reduce the subproblem

A chain models a vector sequentially. Could we instead give each observed complete vector one categorical ID?

<!-- diagram:D30 -->

Training vectors 000,100,011,110 receive a train-only vocabulary. Encode them into categorical IDs, fit a multiclass classifier and decode its selected category back to named bits. The empty vector can be a legitimate class. A query vector 101 has no entry in this particular vocabulary: the fitted label-powerset classifier cannot produce it, regardless of how useful it might be. Reordering columns changes storage and the derived vocabulary consistently, while original label identities remain attached.

The **label powerset** method represents at most min(n,2ᴸ) observed categories, often with thin support for unusual vectors. This may capture interactions but makes sparse class support and unseen vectors concrete limitations. It is not an unrestricted probability distribution over all possible vectors. A one-category vocabulary uses an explicit constant model; unknown output names are schema errors before encoding.

<!-- code:powerset.py -->
<!-- code:trained-labelsets.py -->

`fit_powerset` constructs its vocabulary from training rows with `np.unique`, stores the mapping, and fits ordinary multiclass `LogisticRegression` or the named `DummyClassifier` branch. The alternative `LabelEncoder` route operates on complete string bitcodes and is checked for decoded equivalence. We implement the multioutput transformation and mapping here; the maintained library owns the multiclass optimizer. A labelset ID's numeric magnitude has no regression meaning.

Reducing each categorical subproblem to k labels can give it more repeated classes. Overlapping subproblems then compose answers across groups.

<!-- diagram:D31 -->

Follow original row 101001 through groups ABF, BCD and CEF. The projected bits are 101,010,101. E/cyan and F/cream remain distinct from A/B/C/D throughout: F is the third socket in ABF and CEF, not a new third-position label. Each group has its own projected training rows, categorical vocabulary, fit and decoded query. Its constant branch, if any, is shown as such. Selecting a group exposes that actual system rather than just its final vote.

`fit_labelset_ensemble` fits every supplied group and stores all mappings. Separate group constructors sample from schema and a seed. Disjoint groups permit a shorter last group; overlapping groups are distinct k-subsets without replacement. The coverage-first construction enforces m≤choose(L,k), rejects insufficient mk<L or an unsupported materialization size before fitting, and never consults test labels to search for attractive groups.

<!-- diagram:D32 -->

Each decoded local bit votes only for its original label. Count a label's votes, then divide by its **own coverage**, the number of groups containing it. The separate seven-group hand construction gives vote means [3/4,1/4,2/3,1/4,1/3,2/3], producing 101001 at a strict >.5 majority. The three-group projection anatomy is a separate object, not those seven groups disguised. The complete fitted 16-row/six-output example prints its actual groups, local vocabularies, coefficients and query contributions.

<!-- diagram:D33 -->

Remove a group below the picture and inspect the corresponding coverage changes. Zero coverage is unsupported, not a zero probability and not a default negative. A half vote is negative under the reproduced RAkEL strict >.5 rule. The transparent `powerset.py` toy uses ≥.5, so its boundary remains explicitly different. In the ABF/BCD/CEF identity check, changing F's third local vote can make its mean .5; the new rule chooses F=0 while preserving its identity and denominator 2.

Overlapping composition can produce a global vector absent from any one whole-label vocabulary, but it does not guarantee every desired vector or a coherent joint law. Its voting rule combines decoded local predictions. Cost includes m training problems, each with up to min(n,2ᵏ) observed categories, plus projection and decoding. The complete program checks trusted own serialization against the same saved query predictions; downloading numerical source is different from loading an untrusted Python pickle.

## 10. Learn from nearby labelsets or pairwise label preferences

Labelset groups share categorical structure. A different route asks what labelled neighbours imply about each answer, or which answers should outrank others.

<!-- diagram:D34 -->

Place six observations at positions 0,1,2,5,6,7 with A bits 111000 and B bits 010101. With k=2, collect each training row's two nearest **other** row IDs, then count positive A/B answers among them. A duplicate coordinate is still a distinct observation: self exclusion removes the selected row's identity, not every zero-distance point. The query at 1.2 has no training self and selects the rows at 1 and 2, producing positive counts [2,1].

`nearest_rows` and the ordinary `NearestNeighbors` comparison both retain all candidate rows and apply declared stable-ID ties. Asking the library for only k rows before reranking could discard a tied boundary candidate; the complete small route queries enough candidates to implement its tie contract. Euclidean distance and optional scales are learned from training inputs only. The inspected [KNN lesson](/learn/topic/k-nearest-neighbors-knn) refreshes distance and nearest-set selection; here training leave-self-out identity is the new operation.

<!-- diagram:D35 -->

ML-kNN turns the count into an empirical likelihood. For label j, collect C_jb(r): how many training rows have own bit b and neighbour count r. In the reference, A's negative histogram over r=0,1,2 is [3,0,0], positive histogram [0,0,3]. B's negative histogram is [0,2,1], positive [1,2,0]. Both classes have three rows. With smoothing s=1, prior P(Y_j=b)=(s+n_jb)/(n+2s)=1/2 and P(R_j=r|Y_j=b)=(s+C_jb(r))/[(k+1)s+n_jb]. Each likelihood histogram sums to one.

<!-- diagram:D36 -->

For query A count 2, the positive likelihood is 4/6 and negative 1/6. Multiply each by its prior .5: numerators 1/3 and 1/12; normalize to posterior .8. For B count 1, both likelihoods are 3/6 with equal priors, so posterior is .5. Our ≥.5 rule predicts 11. A two-neighbour raw vote is [1,.5]; its normalization and meaning differ from [.8,.5]. Move k, smoothing or query coordinates within the taught controls and inspect the actual count histograms and both Bayes branches together.

<!-- code:mlknn-count-posterior.py -->

The full scratch code constructs the leave-self-out counts, smoothed priors, both likelihoods and normalized posterior. `NearestNeighbors` supplies only the retrieval primitive; there is no fictional sklearn ML-kNN estimator. This reference requires both known classes for each label, rejects unsupported data and keeps row IDs. ML-kNN yields separate label posteriors, not a normalized law over all vectors. Brute-force neighbour distance costs O(n²d) for training and O(nd) per query before selection; practical large retrieval changes the implementation and potentially its approximate-neighbour contract.

Ranking learns a different relationship: relevant A should outrank irrelevant B for the same input.

<!-- diagram:D37 -->

With x=[1,−1] and truth {A,C}, there are two pairs A>B and C>B. For one pair, score difference s_A−s_B=.4 produces unit-margin hinge max(0,1−.4)=.6. Its active derivative sends −x into A's weight column and +x into B's. At margin 1 we choose the zero subgradient. The selected pair and margin control expose opposite updates on actual named columns, not one scalar error without its destinations.

An original RankSVM formulation normalizes each observation's slack sum by R_i(L−R_i). Our complete numerical reference deliberately uses a different global mean-pair **squared** hinge plus λ||w||²/2. It makes a transformed design row z with x̃ in the relevant label's block and −x̃ in the irrelevant block, then a signed reverse copy so the ordinary binary solver sees both directions. The intercept coordinate is explicitly regularized here, unlike section 4's logistic intercept.

`fit_pair_ranker` computes max(0,1−t zᵀw)² and its gradient, uses a spectral Lipschitz step, and checks stationarity/cap. Ordinary `LinearSVC(loss='squared_hinge', dual=False, fit_intercept=False, C=1/(mλ))` receives the identical signed design with m transformed rows. The actual constructed comparison has 24 rows,9 features and C=.208333; coefficient difference is about 3.72×10⁻⁹. This is objective parity for the declared variant, not a replication of original RankSVM. The pair count Σ_iR_i(L−R_i) and transformed block width control memory; the implementation checks its budget before allocation.

A kernel version replaces inner products with a kernel on pair-feature differences, changing the solver and its storage costs. General structured-margin inference is related to the [SVM lesson](/learn/topic/support-vector-machines-svm) and [CRF lesson](/learn/topic/conditional-random-fields-crfs), but neither link is passed off as a locally implemented full kernel RankSVM optimizer. BP-MLL instead trains a neural representation using relevant–irrelevant output differences; section 15 will trace the shared hidden pullback before naming that extension.

Ranking alone does not say how many labels to return. A virtual relevance label V can make that cutoff part of the learned comparisons.

<!-- diagram:D38 -->

Truth A/C yields pair incidences A>B,C>B,A>V,C>V,V>B. At a query, every learned pair comparison contributes a vote. The shown tournament gives C3,A2,V1,B0. Real labels with votes strictly greater than V are positive, so return A/C. Flip one comparison below the picture: ties or a cycle can appear. Stable label identity orders a displayed vote tie but cannot turn it into an acyclic latent order. A real label tied with V is excluded.

`fit_virtual_label_ranker` fits every supported discordant pair with ordinary `LinearSVC`; a constant direction or no discordant evidence has an explicit branch. The query code records pair outcomes and accumulates votes, including neutral half-votes under its stated missing-pair rule. Here **calibrated label ranking** names a learned relevance cutoff. It does not mean calibrated probabilities. The complete file prints fitted comparison support, scores and cutoff outputs, alongside the independent ranking-metric implementation.

<!-- code:ranking-and-calibrated-labels.py -->

## 11. Different categorical outputs and legal answer vectors

So far each label has been binary. What changes when each output column has its own set of alternatives, or some complete answers are forbidden?

<!-- diagram:D39 -->

Fruit's classes `[apple, orange, pear]` form one categorical probability row. Condition's `[damaged, fresh]` form another. Normalize within each output, then decode its own argmax with its own `classes_`. A single five-category softmax would incorrectly make a fruit name compete with a condition. The illustration establishes the interface; the complete program's numerical example uses explicitly different names low/middle/high and cool/warm.

<!-- code:categorical.py -->

`MultiOutputClassifier(LogisticRegression(...))` fits one categorical estimator per target column. For two query rows, `predict_proba` returns a list of arrays shaped (2,3) and (2,2), not one universal rectangular class tensor. Its first vocabulary is sorted `[high,low,middle]`; the second `[cool,warm]`. Inspect each estimator's actual classes before mapping columns to names, particularly when a training subset lacks a category. Compute per-output correctness and exact-vector correctness explicitly; generic metric support for multiclass-multioutput targets is limited, so a shape accepted by one estimator does not promise every scoring API accepts it.

Independent categorical predictions may also violate a task rule. A medical code hierarchy is a possible output-contract example: a specific child code may require its parent code. This is a logical requirement declared by a task, not evidence that our constructed message labels obey such a hierarchy.

<!-- diagram:D40 -->

The three-bit cube makes rule C⇒A concrete. Remove vertices 001 and 011 because C=1 while A=0; keep the other six. An exclusive A/B rule removes a different set. Evaluate the rule on the selected vertex before optimizing anything. A set of conflicting rules can leave no feasible answer: report that explicitly instead of inventing a valid output. Hard constraints restrict actions or support; they do not establish the learned probabilities.

<!-- diagram:D41 -->

Use masses in 000…111 order [.2,.15,.05,.3,.1,.05,.1,.05]. The unconstrained mode is 011 with probability .3, which violates C⇒A. Restrict MAP to legal vertices and choose 000 with mass .2. A deterministic repair “add A when C=1” instead turns 011 into 111, whose original mass is .05. These are different operations. The total original feasible mass is .55; conditioning the distribution on feasibility divides each legal mass by .55, whereas merely restricting the selected action does not renormalize the original law.

`constrained_map` validates the complete law and feasible set, then chooses among eligible vertices. The complete program also demonstrates the documented repair on the same illegal candidate. Repair changes a predictor and can worsen the declared loss. To decide a constrained Hamming or F1 action, minimize that constrained expected loss rather than assuming legal MAP solves every objective. General factor-graph scores and normalization extend this local cube in [CRF §§8–9](/learn/topic/conditional-random-fields-crfs); our explicit six-vertex example is complete before that destination.

<!-- code:joint-f1-decisions.py -->

The output contract now covers bits, categorical alternatives and feasibility. Numerical outputs will keep the same row identity but require a new conversation about units and what actually couples their fits.

## 12. Numerical outputs need units before a joint loss

Suppose one input returns temperature in °C and energy in Wh. How should an error of 1 compare across those two coordinates?

<!-- diagram:D42 -->

Follow a single observed and predicted value on each unit-labelled axis. Their residuals are prediction minus observation. Squaring gives °C² or Wh²; averaging and taking a root returns the original unit. Per-output RMSE_j=√[n⁻¹Σ_i(ŷ_ij−y_ij)²] remains interpretable. Simply adding unlike-unit errors without declared weights makes the numerical unit choice part of the objective accidentally.

The constructed regression example uses 120 rows,90 training and 30 held-out, with the stated synthetic temperature/energy units. Its mean baseline RMSE is [1.591947,14.119042], OLS [.180527,4.620232], Ridge [.177978,4.605764] and linear chain [.180527,4.620232]. These are results for that fixed construction, not field-meter performance. Its dimensionless squared-error report divides by each raw training target standard deviation. Energy's source metadata later use supplied load units; the illustrative physical units are not assigned to that dataset.

<!-- code:regression.py -->

Can a matrix-shaped fit itself couple numerical outputs?

<!-- diagram:D43 -->

Center X and Y on training means, solve for W and restore intercept b=ȳ−x̄W. For separable ridge objective ||Y−XW||²_F+λ||W||²_F, each output column minimizes ||y_j−Xw_j||²+λ||w_j||² independently. With λ>0, W=(XᵀX+λI)⁻¹XᵀY; implement a solve rather than explicitly forming the inverse. With λ=0, full column rank gives the unique OLS solution; deficient designs can have multiple coefficients with the same fitted projection. `np.linalg.lstsq` gives its numerical least-squares choice, not evidence that every coefficient has a uniquely identified interpretation.

`fit_ridge_matrix` implements centering, solve/lstsq and intercept reconstruction. Ordinary `LinearRegression`, `Ridge` and `MultiOutputRegressor` receive the same inputs/outputs. Reusing one factorization can reduce repeated computation; the loss still separates. Target-wise positive rescaling followed by inverse mapping leaves independent OLS/Ridge predictions unchanged under their matched separable penalties, while shared structure may change. These facts refer to the precise objective, not every library's parameter with the name “alpha.”

<!-- code:shared-regression.py -->

A linear true-label chain is particularly revealing. At training, B can consume true previous targets; at serving it consumes their linear predictions. Why did its shown OLS predictions match the independent fit?

<!-- diagram:D44 -->

Write a stage's original-feature slopes as β_x and predecessor slopes as β_p. If the previous stages' effective original-feature matrix is B_prev, serving produces effective slopes B=β_x+B_prevβ_p. In centered coordinates and with the same slope penalty λ, the original-feature normal equation is Aβ_x+XᵀY_prevβ_p=Xᵀy, where A=XᵀX+λI. Matching prior effective fits satisfy A B_prev=XᵀY_prev. Substitute that identity to obtain A(β_x+B_prevβ_p)=Xᵀy, exactly the independent ridge equation. Unique A therefore gives the independent coefficient column.

The proof requires matched preprocessing and unpenalized intercept treatment, true-label predecessor training, matching original-feature penalties and unique effective solves. For OLS use full column rank. For ridge, do **not** replace XᵀY_prev with XᵀX B_prev: penalized residuals are not generally orthogonal to X. The correctly substituted identity includes λ. Different penalties, OOF predecessor inputs, nonlinear stages or unmatched transforms can break this cancellation argument; a pseudoinverse extension has not been proved here.

The complete program fits the same declared correlated 24-row design using matrix ridge, separate ordinary fits and true-label chains. At matching λ=.7, effective coefficients and served predictions agree near floating-point tolerance. Changing the final stage's penalty to 4 while retaining the previous .7 yields coefficient difference about .19143 from the separate penalty 4 fit. The changed result locates the missing proof premise; it is not a generalization comparison favoring either method.

Reduction order introduces another subtle difference.

<!-- diagram:D45 -->

With per-output MSE values 1 and 9, roots first give 1 and 3, then their uniform mean is 2. Mean first gives 5, whose root is √5≈2.236068. The ordinary `root_mean_squared_error(..., multioutput='uniform_average')` follows per-output roots before averaging. `sqrt(mean_squared_error(...))` on an already uniformly averaged value follows the other operation. Use `multioutput='raw_values'` to report each coordinate before selecting a justified combined score.

A reversible training-only target transform stores each mean and scale, transforms training Y for fitting and inverts predictions before raw-unit reporting. `TransformedTargetRegressor` expresses that ordinary recipe. A dimensionless score such as mean_j RMSE_j/s_j uses frozen training scales s_j. A constant target has s_j=0, so define a different raw-error fallback for a general task or block that normalized objective. The specific Energy protocol blocks nonpositive scales before fits; it does not silently switch to the general fallback.

## 13. Couple numerical tasks through a partition or a feature row

The previous matrix solve did not couple outputs. A shared partition does: its threshold must compromise among multiple output losses.

<!-- diagram:D46 -->

Four x values 0,1,2,3 have temperature [0,0,2,2] and energy [0,100,100,100]. A stump tries cuts .5,1.5,2.5 and stores each child's two-output mean. At cut .5, temperature SSE is 8/3 and energy SSE 0. At 1.5, temperature SSE 0 and energy SSE 5000. At 2.5, temperature SSE 8/3 and energy SSE 20000/3. Raw summed SSE selects .5. Divide energy by 100 before the objective: candidate totals become 8/3,.5,10/3, selecting 1.5. Target scale changes which partition the two outputs share.

Inspect a cut's actual vector leaves, then change the continuous energy divisor. Tick labels 1/10/100 are convenient points, not the whole permitted domain. The original-unit errors remain available beside the scaled training objective. A changed scale is a modeling choice, not evidence that one output has become less important in the real world.

<!-- diagram:D47 -->

Separate stumps can choose temperature cut 1.5 and energy cut .5, both with zero training SSE at the reference. The shared stump must choose one cut for both. Edit the selected output's four target values and recompute every candidate's mean/SSE before interpreting its split. Invalid draft rows produce a labelled unsupported calculation; Reset restores all rows, mode and drafts.

`stump_candidates` directly sorts x, enumerates supported cuts and calculates vector leaf means and within-leaf squared errors. Ordinary `DecisionTreeRegressor(max_depth=1)` with matrix Y fits a native shared-output tree; `MultiOutputRegressor` fits distinct scalar trees. Their boundaries and leaf shapes, not merely identical-looking calls, identify the sharing. The small enumerator explains the operation. A maintained tree builder handles recursive split search and storage efficiently; we do not claim to rebuild that full engine. The complete `sharedSplit.py` file contains the ordinary shared/separate tree comparison on exactly these four rows.

<!-- code:sharedSplit.py -->
<!-- code:shared-regression.py -->

A penalty can also couple which input features participate in different outputs. Let W's row r contain one feature's coefficients across all tasks.

<!-- diagram:D48 -->

The row vector z=(3,4) has norm 5. The proximal operation for λ||w_r||₂ shrinks the **whole row** by max(1−λ/||z||₂,0). At λ=2, result is .6×(3,4)=(1.8,2.4). Separate coordinate soft thresholds instead give (1,2). The row operation preserves direction until the row reaches zero. A zero row or λ at least its norm produces exactly zero without computing 0/0. Edit z's two coordinates and λ to inspect this operation.

The joint objective is J(W)=||Y−XW||²_F/(2n)+αΣ_r||W_r||₂, with centered data for an unpenalized intercept. In an orthonormal design XᵀX/n=I, each row has this closed-form shrink around its least-squares sufficient statistic. A correlated design does not: the smooth gradient couples feature rows through XᵀX.

<!-- code:groupShrinkage.py -->
<!-- diagram:D49 -->

For X=Y=[[1,0],[1,1],[0,1]], W=0, α=.2 and step η=.5, the smooth gradient is−[[2/3,1/3],[1/3,2/3]]. The gradient step gives Z=[[1/3,1/6],[1/6,1/3]]. Each row has norm √5/6≈.372678 and proximal threshold ηα=.1, so its shrink factor is 1−.6/√5≈.731672. The result rows are approximately [.243891,.121945] and [.121945,.243891]. Follow gradient, Z and each norm gate in order. Iteration and α controls repeat this actual update, with objective and convergence/cap state.

General proximal gradient uses ∇smooth=Xᵀ(XW−Y)/n, then W_next=prox_{ηα}(W−η∇smooth). A safe η is at most 1/L with L=||X||²₂/n, or a checked backtracking step. The stationarity diagnostic ||W−prox(W−η∇smooth)||/η tests the composite optimum, not only the smooth gradient. `fit_group_regression` centers training data, uses the spectral step, records the objective trace and stops by this residual or its explicit cap. It does not shrink OLS once and call that the general solution.

Ordinary `MultiTaskLasso(alpha=α)` uses the same mean-squared-loss plus row-group norm, with `coef_` arranged outputs×features rather than our features×outputs. Transpose deliberately. The correlated fixture's fit converges in 240 iterations with proximal residual about 5.98×10⁻⁹ and coefficient difference about 6.59×10⁻⁹ from the ordinary coordinate-descent result. A shared row penalty encourages common support; it can hurt tasks that genuinely use different features. Similar coefficient arrays under a matched objective are not a test of prediction superiority.

<!-- code:shared-regression.py -->

## 14. Share a low-dimensional direction without hiding rare outputs

Instead of requiring the same feature rows, could several outputs share a smaller fitted response subspace? First distinguish the response variation the inputs can fit from variation they cannot.

<!-- diagram:D50 -->

Use centered X=[[-1,0],[1,0],[0,−1],[0,1]], with first target [−2,2,0,0] and second [10,10,−11,−9]. Reduced QR gives Q=X/√2 and R=√2I. Compute Z=QᵀY: its diagonal entries are 2√2 and √2. The second target contains large variation orthogonal to Q that no linear coefficient on this X can fit. Projecting before imposing rank separates that unfit component from the supervised directions.

<!-- diagram:D51 -->

For full-column-rank centered X=QR with orthonormal Q, ||Y−XW||²_F=||(I−QQᵀ)Y||²_F+||QᵀY−RW||²_F. The first term is fixed. Since invertible R preserves rank, a rank-r W corresponds to rank-r RW. Truncate the SVD of Z=QᵀY to Z_r, then solve R W_r=Z_r and restore the training intercept. This minimizes the rank-constrained training SSE under the stated assumptions. NumPy supplies QR/SVD and the linear solve; our implementation constructs and interprets their supervised problem.

At rank 1, retain the first fitted direction: first target fits exactly, second prediction is zero, SSE 402. Full rank 2 adds its fitted second direction and leaves only unfit SSE 400. Raw-target PCA rank 1 followed by regression selects the high-energy second target direction instead, giving SSE 408. Both routes carry the same 400 units of unfit squared variation; their rank constraints operate on different objects. The actual projected and raw singular values make the distinction visible rather than treating every SVD as the same reduction.

<!-- code:reduced-rank-regression.py -->

`fit_rrr` centers inputs/targets on training, checks full numerical column rank, optionally applies declared positive output weights or training target scales, computes Z and its truncation, solves for W, then restores original units. Rank 0 gives training means; full supported rank matches ordinary `LinearRegression`. It reports numerical and requested rank separately. The ordinary `PCA`→regression contrast is complete code, but there is no built-in sklearn RRR estimator invented here. Rank selection and output weighting belong to development evidence. Orthogonal output rotations preserve an unweighted squared-error problem; unequal units or nonorthogonal scaling alter it.

The cost follows the matrix shapes: reduced QR approximately O(nd²) for tall X, multiplying QᵀY O(ndq), SVD of d×q about O(dq min(d,q)), plus the solve. Deficient designs require another proved variant; this reference rejects that unsupported case rather than claiming a pseudoinverse rank theorem.

Compressing binary labels introduces another criterion. Does high retained energy guarantee that rare positive answers survive?

<!-- diagram:D52 -->

The 200-row construction repeats an alternating common binary column twice. Its third, rare label is positive only on rows 0 and 1, so its mean is .01. Centered common energy is 100, rare energy 1.98, with orthogonal centered variation. Rank 1 retains 100/(100+1.98)=.980584 but reconstructs the rare column constantly at .01. A .5 decision therefore has rare recall 0. Retained energy describes reconstruction variance, not per-label recall.

<!-- code:compression.py -->

This exact centered example is distinct from original uncentered PLST. Both reduce outputs, but centering, inverse mapping and the decision objective must be named. A retained-energy plot cannot certify a rare-event use case without inspecting support and output-specific errors.

Random measurements offer another compression route. Encode y with a measurement matrix A, fit a regressor for Ay, then decode its predicted measurement. What object is that regressor estimating?

<!-- diagram:D53 -->

The dictionary A=[[1,0,1/√2],[0,1,1/√2]] has three unit-length columns and two measurement coordinates. For z=[1,0], initial correlations Aᵀz=[1,0,1/√2] select the first atom. Solve least squares on that active column: coefficient 1, residual 0, decoded vector [1,0,0]. OMP repeats correlation selection, active-system solve and residual update until the declared residual tolerance or atom cap. Selecting the same atom twice is forbidden; a rank-deficient active system is unsupported.

<!-- code:compressed-label-recovery.py -->

`omp` keeps normalized dictionary columns, chooses the smallest original index at an exactly computed correlation tie and records every active solve. `ordinary_omp` calls `OrthogonalMatchingPursuit(fit_intercept=False, n_nonzero_coefs=...)` with A as its design: dictionary columns are candidate features, measurement coordinates are its rows. It preserves actual warnings. At changed z=[.6,.8] and cap 2, both routes have nearly zero residual but select different supports at a floating-point tie. Their reconstruction differs; a small residual alone does not establish unique recovery.

The full compressed regression uses a known 60-row binary construction with conditional means that vary linearly across the shown input. It trains ordinary `StandardScaler` and `Ridge` on training inputs and compressed targets. At query x=.5, desired mean is [.325,.2,0,0]. Both the explicit dictionary and declared Gaussian seed 71 reconstruct approximately [.3249875,.2,0,0] in their scoped runs. The code stores the actual normalized random draw, not an expectation over an undisclosed preferred seed. These are constructed mathematical experiments; the actual Energy report uses a different target and protocol.

<!-- diagram:D54 -->

Each of four equally likely outcomes has one positive label, yet E[Y|x]=[.25,.25,.25,.25]. Sparse observed rows therefore need not imply a sparse conditional mean. For the dictionary consisting of three coordinate atoms and (1,1,1)/√3, that dense mean shares its measurements with sparse vector [0,0,0,(1+√3)/4]. OMP gives the sparse vector with nearly zero measurement residual but original-mean squared error .375. With Gaussian seed 71, its sparse estimate instead has a nonzero measurement residual and mean squared error about .165. Both errors remain visible beside the successful sparse-mean example; a small measurement residual alone does not establish output recovery.

The [compressed prediction paper](https://arxiv.org/abs/0902.1283) connects regression error in measurements to output recovery under stated sparsity and measurement assumptions. O(k log L) measurement scaling belongs to specific recovery conditions; its OMP-specific sufficient conditions are stronger. Restricted isometry, coherence and noise bounds are properties/assumptions to verify, not badges conferred on every random draw. OMP requires correlation work across L atoms per step plus active least-squares solves; fitting the compressed regressor is additional work. It predicts E[AY|X]=A E[Y|X] when that conditional mean is the target, so the sparse-object assumption must concern the quantity being recovered.

## 15. Price label scale and distinguish frontier mechanisms

The small examples let us inspect every object. Which objects become expensive when label count grows, and which sharing changes the model rather than just the storage?

<!-- diagram:D55 -->

Dense binary targets have nL cells, heads have dL slopes and dense query scores have L values. Sparse target storage can use only observed positives plus row pointers, but it does not automatically make fitted scores sparse. A sequential chain has prefix widths d,d+1,…,d+L−1, totaling Ld+L(L−1)/2 feature coordinates per row across stages. One row with R positives produces R(L−R) pair constraints. Powerset has at most min(n,2ᴸ) occupied categories, while m groups of size k expose mk projected output memberships. The controls change L and n to show these arithmetic sizes, not invented runtime milliseconds.

Choose a representation based on the task, not a single complexity adjective. Dense heads can batch a matrix multiply; sequential hard chains need dependency-ordered stages; exact chains still enumerate exponentially; subset ensembles can train independent members; sparse retrieval trades a candidate boundary for a full score array. Hardware speed needs an actual measured implementation and shapes, not a bar chart labelled with asymptotic notation as if it were a benchmark.

<!-- diagram:D56 -->

A hierarchy or approximate retrieval index can first propose candidate labels, then score only those candidates. If one true label is omitted, the final scorer cannot recover it under this explicit output boundary. Candidate recall therefore caps final recall. The omitted slot is **unscored**, not a confident zero probability. Change the candidate set and inspect the numerator/denominator separately from final correctness. A hierarchy used for search is different from the hard implication rule in section 11, even when both draw a tree.

Changing vocabularies creates versioned output schemas; adding a label means new support, parameters and evaluation denominators. Missing annotations remain a mask/selection problem, not a negative-class expansion. Drift can change base rates, feature relationships or annotation policy, so validate the boundary that moved. Approximate neighbour retrieval in the [KNN lesson](/learn/topic/k-nearest-neighbors-knn) is a useful computational connection after these candidate semantics are clear.

Current experimental vector-tree implementations may sketch gradients to make split search cheaper while retaining full output values at leaves. That is different from compressing the final predictions.

<!-- diagram:D57 -->

The full four-row/three-output gradient grid is [1,0,1],[1,0,−1],[−1,0,1],[−1,0,−1]. Selecting coordinate A for split search exposes a strong cut after row 2: child sums are+2/−2. Coordinate C's sums there are 0/0; another cut can matter differently. Whichever coordinate supplies the search sketch, the leaf calculation still receives all three gradient columns. For this hand example, give every row/output Hessian value 1 and use leaf penalty λ=1. At the cut after row 2, full left/right gradient sums are [2,0,0] and [−2,0,0], Hessian sums are [2,2,2] on both sides, and the Newton leaf rule −G/(H+λ) gives [−2/3,0,0] and [2/3,0,0]. This specified diagonal-Hessian operation explains the full-output leaf ports; it is not an executed boosting model. Inspect the actual full and reduced ports before comparing this mechanism with output compression.

The [official XGBoost multi-output tutorial](https://xgboost.readthedocs.io/en/stable/tutorials/multioutput.html) marks support experimental and documents restrictions for its stated strategies. It is a scoped frontier resource, not an executed fit in this lesson. A reduced split-gradient sketch, a shared partition and a low-dimensional final answer are three different sharing choices. No benchmark or universal quality result is inferred from the hand gradient grid.

Neural shared features create another kind of coupling. Before naming a multi-label neural objective, trace how losses from several outputs reach the same hidden coordinate.

<!-- diagram:D58 -->

Shared hidden vector h=[1,2] feeds W rows [1,0,−1] and [0,1,1], bias 0, giving logits [1,2,1]. With truth [1,0,1] and mean over three BCE terms, δ=(σ(z)−y)/3≈[−.089647,.293599,−.089647]. The hidden pullback is δWᵀ: coordinate 1 gets δ_A−δ_C=0, coordinate 2 gets δ_B+δ_C≈.203952. Change C's truth bit to 0 and both hidden contributions change: approximately [−.333333,.537285]. Several separately named output losses reach shared parameters even though the sigmoid sockets do not form one softmax.

`shared_output_pullback` in the observed-head program implements the actual forward values and mean-cell pullback with NumPy and an ordinary functional `expit` reference. Its normalization differs from the summed-label observed means in section 4; the picture names the divisor 3. [Backpropagation & Automatic Differentiation](/learn/topic/backpropagation-automatic-differentiation) supplies full parameter training. BP-MLL's relevant–irrelevant objective connects to section 10's pair differences; a joined BCE pullback is not presented as a reproduced BP-MLL fit or full original-paper experiment.

<!-- code:masked-binary-heads.py -->

A probabilistic numerical model can share outputs through covariance rather than support or hidden features.

<!-- diagram:D59 -->

Input covariance K=[[1,.8],[.8,1]] and output covariance B=[[1,ρ],[ρ,1]] produce point-major K⊗B on coordinates (x0,A),(x0,B),(x1,A),(x1,B). Follow each 2×2 block: same-input cross-output covariance is ρ, cross-input cross-output covariance is .8ρ. At ρ=.5, observing noiseless value 1 at (x0,A) yields conditional mean .4 at (x1,B), and variance 1−.4²=.84. Negative ρ changes the mean's sign; B=I removes this cross-output covariance. These are actual covariance entries and conditional operations, not a correlation-shaped decoration.

B has eigenvalues 1±ρ, so |ρ|≤1 is needed for positive semidefiniteness. Endpoint semidefinite matrices do not authorize arbitrary inversion. Our one-observation conditioning divides only by its explicitly positive observed marginal variance. `output_kernel` validates symmetric PSD operands and point-major labels; `condition_one` implements μ=cross/variance×observed_value and Σ_cond=Σ−cross·crossᵀ/variance. Full multi-observation solves or operator-valued kernel fitting need additional assumptions and code beyond this bounded mechanism.

The inspected ordinary `GaussianProcessRegressor` multi-target API uses a shared scalar input kernel with independent output covariance slices; supplying two target columns does not inject this arbitrary B. The [Gaussian Processes lesson](/learn/topic/gaussian-processes-regression-classification) provides the output-index kernel connection. Here the local constructor and conditional result are complete before that extension, and a nonzero cross-covariance is not itself evidence of improved prediction.

<!-- code:shared-regression.py -->

## 16. Produce one honest real-data report and retain the text case

Hand mechanisms tell us what a model computes. A held-out dataset tells us how that declared recipe behaves under a specific transfer question. Which parts of a building configuration should the model see before predicting its two loads?

<!-- diagram:D60 -->

[UCI Energy Efficiency](https://archive.ics.uci.edu/dataset/242/energy%2Befficiency), contributed by Tsanas and Xifara in 2012, supplies 768 Ecotect simulation configurations and two numerical targets. X1 is relative compactness, X2 surface area, X3 wall area, X4 roof area, X5 height, X6 orientation, X7 glazing area and X8 glazing distribution. Heating/Y1 stays amber and Cooling/Y2 blue. The envelope, orientation arrow and window ports explain these metadata; the drawing does not reconstruct a physical building from an invented two-dimensional geometry.

The official metadata's unit fields are blank, so the report uses **supplied heating/cooling load units**. The rows are simulation configurations, not independent field residents or sensor-meter samples. [Tsanas and Xifara's article](https://doi.org/10.1016/j.enbuild.2012.03.003) describes the original scientific problem; its published performance is not our reproduced result. The dataset is CC BY 4.0 with attribution. The supplied CSV preserves the exact finite worksheet values; its provenance identifies the source ZIP/XLSX, worksheet, source row IDs and removal of only entirely blank trailing rows/columns and empty sheets.

<!-- diagram:D61 -->

Geometry tuple (X1…X5) has twelve distinct values, each with 64 source rows. Sort those tuples lexicographically into G00…G11. Training uses [0,2,3,4,6,7,9,11], validation [1,8] and test [5,10]:512/128/128 rows. The other orientations/glazing settings of a held geometry do not sneak into training. The question is transfer to held geometries **within this simulation regime**, not transfer to new weather, materials or actual metering. Select a group to inspect its actual original rows; no random re-split control changes this experiment.

The parser requires the declared ten-column finite schema, category codes orientation 2/3/4/5 and distribution 0…5, exact geometry support and no target/input column duplication. It audits duplicate rows and target ranges without discarding inconvenient observations. Numerical inputs X1–5/X7 pass through unchanged into feature assembly; X6/X8 use fixed-vocabulary dense one-hot encoding with unknown categories rejected. Every candidate fits a new training-only encoder. Linear/group models additionally scale the assembled input features; forests use unscaled encoded inputs. Every candidate standardizes its two training targets and inverts predictions before reporting.

Raw training target standard deviations are [10.8689724815,10.3022602180]. The combined validation objective is mean_j RMSE_j/s_j, with those frozen training scales. A nonpositive or nonfinite scale would block this particular protocol. The mean baseline predicts the two raw training means. It is distinct from every fitted candidate and remains part of the comparison.

<!-- diagram:D62 -->

The candidate table fixes all twelve settings before fitting. R1/R2/R3 are independent Ridge columns with α=.1/1/10 and solver `svd`. S1/S2/S3 are shared-output random forests with minimum leaf 1/4/12. I1/I2/I3 use separate forests via `MultiOutputRegressor` with the same leaf settings. All forests have 300 trees, unrestricted depth, all features eligible per split, bootstrap sampling, minimum split 2, `random_state=19` and `n_jobs=1`. G1/G2/G3 use `MultiTaskLasso` α=.01/.1/1, cyclic coordinate selection, tolerance 10⁻⁸ and cap 20000. These are four specific coupling contracts; a matrix Ridge call remains separable.

<!-- code:energy-multioutput-study.py -->

The portable `energy_multioutput_core.py` supplies `estimator`, which composes an ordinary `ColumnTransformer`, optional `StandardScaler`, base estimator and `TransformedTargetRegressor`. `error_report` returns both raw output RMSE/MAE, the dimensionless mean and group-wise residual summaries. Shared-row fits retain convergence warnings, iteration counts, dual gap and the declared objective check. A failed candidate remains an outcome with its cause; the program does not try another preferred fit until one wins.

<!-- code:energy_multioutput_core.py -->

Choose the global minimum validation score in each eligible selection set first, then the earliest table-order ID whose score is within absolute 10⁻¹² of that minimum. This minimum-first rule avoids a drifting chain of pairwise near-ties. Freeze the overall fitted candidate, each of four family winners, and the strongest independent candidate from all six R/I candidates. A family with no valid candidate blocks the test report. The mean baseline can beat the best fitted candidate; that would be reported explicitly. Validation selection among R/I supplies a meaningful independent comparator rather than an intentionally weak one.

<!-- diagram:D63 -->

After that immutable validation lock, report all candidates' descriptive test results without changing a selected ID, parameter, transform or split. There is no training+validation refit. The metric and selected-candidate controls inspect the saved per-output errors and locked roles. The strongest independent row, mean baseline, failed rows and sample/group counts remain visible alongside coupled candidates. A low test error for another row does not make it the validation-selected winner.

The completed fixed comparison below rounds displayed errors to six decimal places. Every candidate is valid and emitted no warning. Raw RMSE/MAE remain in supplied heating/cooling load units; only the two combined columns divide by the frozen training standard deviations. The mean baseline is a separate thirteenth report row, not a thirteenth fitted candidate.

| Recipe | Validation Heating RMSE | Validation Cooling RMSE | Validation combined | Test Heating RMSE | Test Cooling RMSE | Test combined | Locked role |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| R1 | 6.170138 | 6.540458 | 0.601270 | 1.623205 | 2.030487 | 0.173217 | Unselected |
| R2 | 6.052515 | 6.397514 | 0.588922 | 1.672395 | 2.057911 | 0.176811 | Unselected |
| R3 | 5.232803 | 5.515026 | 0.508383 | 1.712937 | 2.060046 | 0.178780 | R family |
| S1 | 4.944657 | 5.286681 | 0.484045 | 9.944048 | 9.453105 | 0.916239 | Unselected |
| S2 | 4.841239 | 5.271282 | 0.478540 | 9.772437 | 9.367920 | 0.904210 | S family |
| S3 | 4.947310 | 5.287823 | 0.484223 | 9.948256 | 9.465176 | 0.917019 | Unselected |
| I1 | 4.561078 | 6.026999 | 0.502330 | 8.512216 | 9.517260 | 0.853485 | Unselected |
| I2 | 4.488988 | 5.936031 | 0.494598 | 8.504204 | 9.525014 | 0.853493 | I family; strongest validation-selected independent |
| I3 | 4.797559 | 6.194194 | 0.521323 | 8.831856 | 9.588333 | 0.871638 | Unselected |
| G1 | 5.849496 | 5.901050 | 0.555487 | 1.846383 | 2.288049 | 0.195984 | Unselected |
| G2 | 4.336582 | 4.402579 | 0.413164 | 1.643396 | 1.950524 | 0.170265 | Unselected |
| G3 | 3.901285 | 2.856064 | 0.318082 | 8.358228 | 7.881490 | 0.767012 | Overall; G family |
| dummy | 5.486086 | 4.491020 | 0.470337 | 10.422045 | 9.889214 | 0.959394 | Mean baseline |

| Recipe | Validation Heating MAE | Validation Cooling MAE | Test Heating MAE | Test Cooling MAE |
| --- | ---: | ---: | ---: | ---: |
| R1 | 5.485628 | 6.195791 | 1.424748 | 1.411260 |
| R2 | 5.360749 | 6.042864 | 1.481165 | 1.497044 |
| R3 | 4.598695 | 5.187732 | 1.506374 | 1.668559 |
| S1 | 4.704005 | 5.203068 | 8.480469 | 8.105092 |
| S2 | 4.609130 | 5.101262 | 8.343950 | 8.017825 |
| S3 | 4.558311 | 5.077304 | 8.650426 | 8.159780 |
| I1 | 4.382851 | 5.854245 | 7.439253 | 8.180113 |
| I2 | 4.312843 | 5.715599 | 7.441375 | 8.139829 |
| I3 | 4.445314 | 5.899631 | 7.830177 | 8.264083 |
| G1 | 5.110817 | 5.508381 | 1.664840 | 1.911266 |
| G2 | 3.748310 | 4.117390 | 1.189122 | 1.411456 |
| G3 | 3.195781 | 2.388033 | 7.928273 | 7.444650 |
| dummy | 4.841563 | 4.029303 | 10.000938 | 9.505469 |

Validation selects G3 at .318082, with I2 at .494598 as the strongest validation-selected independent comparator; the mean baseline is .470337. G3's descriptive test combined error is .767012, I2's .853493 and the mean baseline's .959394. On that fixed comparison G3 is lower than I2 and the baseline, but it is far from a general coupling guarantee. Unselected G2 has test .170265 and R1 .173217; these much smaller errors stay descriptive. Switching to either after viewing them would replace the declared validation selection with test selection.

The group summaries locate the problem. G3's mean prediction-minus-truth residuals on G05 are [8.652450,7.849858] and on G10 [−6.668052,−6.938686]. I2's are [11.499037,12.842280] and [−3.383714,−3.426088]. A pooled RMSE alone hides opposite-signed geometry errors. There are only twelve geometry groups, two in each held partition. This split can favor a heavily shrunk model on its validation geometries while that same model makes larger errors on different test geometries. Inspect these actual conditions before transferring a recipe to a new design task; neither a source paper's benchmark nor one locked comparison establishes broad building-performance accuracy.

G1/G2/G3 converge in 145/20/5 iterations, with dual gaps about 9.065×10⁻⁹,1.975×10⁻¹⁰ and 1.110×10⁻¹⁶, below the declared 2×10⁻⁸ bound. Their objectives are .079702,.251251,.958315. The strongest penalty has the largest penalized objective but the smallest validation prediction error here: objectives with different α include different penalty terms and are not directly the selection metric. Full warnings/statuses and every train/validation/test prediction remain available with the report.


<!-- diagram:D64 -->

Inspect an original test row through the actual locked fitted encoder and target inverse mapping. A linear/group model exposes every encoded feature's coefficient contribution and intercept. A forest exposes one member's real split path and its scalar or vector leaf, then the 300-member mean. All eight original input coordinates participate even if a drawing shows only a few at once. Tree input comparisons cast encoded inputs to float32 before comparing to saved thresholds; that convention is preserved in reconstruction. The truth and residual belong after prediction, outside its feature route.

`serialize_model` saves full encoder/scaler and fitted linear matrices or tree children/features/thresholds/vector leaves. `predict_saved` reconstructs the same frozen model's predictions on every source row before the fitted estimator is discarded, with no refit. A model used for multiple locked roles is saved once and referenced by ID. The program also retains all candidate predictions, warnings, errors, lock and source identities. This makes the inspector actual saved inference, rather than a hand tree masquerading as the chosen model.

The default inspector is original CSV row 4 (zero-based), worksheet row 6, geometry G10. Its X1…X8 values are [.9,563.5,318.5,122.5,7,2,0,0]. The encoder creates six numeric features plus four orientation and six glazing-distribution indicators, for sixteen explicit columns. G3 has only one nonzero shared coefficient row: X5, height. Its training height mean/scale are 5.25/1.75, so this row's height 7 becomes 1. The standardized Heating/Cooling coefficients are [.203408608,.204925592], with intercepts numerically zero. Inverting the two training-target scales/means gives prediction [24.960854,26.882095], against truth [20.84,28.28], hence prediction-minus-truth residual [4.120854,−1.397905]. The other fifteen encoded columns are still shown and routed; their fitted coefficients are zero rather than missing or unscored. This actual sparse shared row explains the heavy shrinkage rather than hiding it behind a model name.

For a different saved model shape, inspect S2's actual member 0 on that same source row. The encoded path tests surface area 563.5≤686 (left), wall area 318.5≤318.5 (left), glazing area 0≤.17500000074505806 (left), then the glazing-distribution-0 indicator 1≤.5 (false, right). It reaches leaf node 11 with standardized vector [−.538383770,−.078710731], which in raw units is [16.898333,23.960000]. A single member's leaf is not the forest prediction: S2 averages all 300 members to [18.453863,23.917379] on this row. The equality at the wall-area threshold takes the documented left branch; inputs are float32 values compared to double-precision thresholds. The numerical state contains every member, so changing the inspected member reveals its real path without changing the selected model or averaging boundary.

The complete numerical-state reconstruction already agrees with the same frozen estimators on all 768 source rows for G3, I2, R3 and S2, with maximum absolute difference 0 in this recorded environment. That checks source-state correspondence, not improved generalization. Full data, predictions, fitted numerical state and the validation lock identify the fixed report a learner can inspect.

The ordinary learner entry is `energy-multioutput-learning.py`, with `energy_multioutput_core.py` beside it. The core contains the same complete preprocessing, estimator, metric, selection and saved-array operations; it imports no campaign entry point. Download the five Energy data files and `energy-recorded-assets.json` into that same directory, as enumerated in `MULTIOUTPUT-SETUP.md`. These listed files are the complete input set for report/query; those operations neither fit nor write recorded data. `load_bundle` verifies those files before `saved_report` returns every recorded outcome and the fixed selected roles. `query_saved` resolves a saved model/role, assembles one X1…X8 row and calls the complete saved encoder/base/target-inverse route without fitting or selecting anything.

```sh
python energy-multioutput-learning.py --report
python energy-multioutput-learning.py --query --model overall --row 4
python energy-multioutput-learning.py --query --model S2 --features .9,563.5,318.5,122.5,7,2,0,0
```

The first query prints G3 with Heating/Cooling approximately [24.960854,26.882095]; the S2 query prints [18.453863,23.917379]. These are saved-model operations on the same named row, not new experimental outcomes. Changing `--features` asks for a new computational query with finite numeric coordinates and supported orientation/distribution codes. It does not turn an implausible input into a measured building or change the original validation winner.

For fitting practice, the two supplied `own-multioutput-example.csv` and `own-multioutput-task.json` files define a **different constructed task**: twelve invented rows, six two-row groups, train 8/validation 2/test 2, and the declared R1/R2/R3 Ridge strengths. The affine toy outputs expose the workflow and have no physical-load interpretation. `declared_task` verifies the CSV identity, complete disjoint row ownership, whole geometry groups, positive training target scales and candidate order before `fit_own` can fit. Each candidate uses the ordinary pipeline just explained. Failed validation outcomes stay recorded; `choose` applies the minimum-first tie band, then an exclusive lock is written before any test error. The saved winning state retains those same training-only transforms and is not refitted on validation rows.

```sh
python energy-multioutput-learning.py --fit-own own-multioutput-task.json --output own-results
```

The output directory must be new. This complete independent recipe is supplied for the learner to run; no fitted outputs for the invented fixture are claimed here. A different data source, split or candidate order needs its own declaration and new output directory. `--fit-own` rejects the recorded Energy CSV, while report/query remain read-only. The complete archival `energy-multioutput-study.py` preserves the original once-only preparation and recording protocol; the ordinary entry does not call its guarded campaign main.

<!-- code:energy_multioutput_core.py -->
<!-- code:energy-multioutput-learning.py -->



Text decisions ask a different question, so the earlier text case remains a separate experiment rather than being merged into load errors.

<!-- diagram:D65 -->

Its 32 constructed repair messages form 16 two-paraphrase groups and the fixed 16/8/8 partition. Three model families crossed with five thresholds create 15 declared choices. Validation selects chain order 012 at cutoff .6, micro F1=10/11≈.909091. The frozen test gives the same micro F1, exact-set accuracy 7/8 and Hamming 2/24. All three test label supports are 4. Inspect the saved choices and vocabulary; these are recorded candidate outcomes, not a new fit from a threshold slider. Small, purpose-written messages expose information boundaries but do not establish quality on a collected repair corpus.

<!-- code:textReport.py -->
<!-- diagram:D66 -->

The separate changed cost report minimizes validation FP+3FN over the same stated candidate order/cutoffs. It selects the independent family at .5 with validation cost 3; its frozen test cost is 0 over 24 label decisions and micro F1=1. Those are recorded measured outcomes of the two constructed reports, not interpolated experiments for every cost setting. The changed objective can select a different family; the mechanism follows which counted errors are expensive, not a universal advantage of chains or independence.

<!-- code:changedReport.py -->

To transfer the workflow, name the output schema/units, legal information boundary and loss first. Compare a simple mean or prevalence baseline, a strong separate predictor and each precisely defined coupling. Keep every fixed candidate outcome, select with development rows and make one honest frozen report. Then diagnose where errors occur—geometry group, output, support or labelset—without relabelling test diagnostics as untouched evidence for another selection.

## 17. Practise on a changed observation, loss and coupling

Each task changes a condition rather than asking you to repeat a guided slider trace. Attempt its question before opening the hint or solution. Teaching and code above remain visible; only the independent attempts use disclosures.

### A. Repair an annotation and a split

**Question.** Each repair case has two messages. A reviewer marks only code tags; unreviewed hardware/energy cells are filled with 0. Paraphrases cross a random train/test split. Name the two separate errors and propose a first baseline.

**Hint.** One error changes target meaning; the other changes what the test can establish.

**Solution.** Unreviewed answers stay unknown, represented by a mask or per-label reviewed subsets. Filling zeros invents negative evidence. Both messages from one case belong to one split; use time boundaries as well if predicting future cases. Fit train-only code prevalence and an independent code model on the supported task. Hardware/energy evaluation is unavailable without known answers. Masking alone does not establish that reviewed cases represent the population.

### B. Recompute a changed error table

**Question.** Truth is [[1,0],[0,1],[1,1]], prediction [[1,1],[0,0],[1,1]]. Compute TP/FP/FN, Hamming loss, exact-set accuracy and micro F1. Then mark the second row's second annotation unknown.

**Hint.** Begin with six cells; after masking there are five known cells and two complete rows.

**Solution.** Initially TP=3,FP=1,FN=1,TN=1. Hamming is 2/6=1/3, exact-set accuracy 1/3 and micro F1=6/(6+1+1)=3/4. The unknown cell removes the missed positive: TP=3,FP=1,FN=0; observed Hamming 1/5 and micro F1=6/7. Complete rows 1 and 3 yield exact-set accuracy 1/2. The apparent improvement removed an error from observation; predictions did not change.

### C. Change the four probability masses

**Question.** Counts of 00,01,10,11 are [4,1,2,3] out of 10. Find marginal threshold action, joint mode and greedy answer in both orders. Select 1 at a.5 binary tie.

**Hint.** Marginals are .5 and .4; condition only after the first bit is fixed.

**Solution.** Marginal thresholding gives 10; the joint mode is 00 with mass .4. Greedy AB chooses A=1 at its tie, then B=1 because 3/(2+3)=.6, giving 11. Greedy BA chooses B=0 then A=0 because 2/(4+2)=1/3, giving 00. Both A values minimize its marginal error at the tie:00 and 10 both have Hamming risk .45 per label. The convention selects one optimal action without implying a unique optimum.

### D. A chain path is not a marginal

**Question.** P(A=1|x)=.4, P(B=1|A=0,x)=.2 and P(B=1|A=1,x)=.9. Find B's hard-path score, marginal and all four joint masses.

**Hint.** Greedy A is 0; a marginal averages both histories by their mass.

**Solution.** Path score is .2. Marginal is .6×.2+.4×.9=.48. Masses 00/01/10/11 are .48,.12,.04,.36, summing to 1. Feeding a continuous prior probability onward instead of a hard history creates a different feature recipe, which must be described before interpreting its score.

### E. A different mixture

**Question.** High context now has weight .25; within low/high contexts both labels are independent with positive probabilities .1/.9. Compute pooled P(A=1), P(A=1,B=1), P(B=1|A=1). Does association establish causation?

**Hint.** Weight each independent table by .75 or .25 before taking a conditional ratio.

**Solution.** Marginal is .75×.1+.25×.9=.3. Joint-positive mass is .75×.01+.25×.81=.21. Conditional is .21/.3=.7, exceeding B's pooled marginal .3. Within either observed context the labels remain independent. Neither the association nor an arbitrary chain order establishes a causal effect.

### F. A threshold cannot break a score tie

**Question.** Scores [.8,.8,.2], truth [1,0,1]. Compute F1 at cutoffs .2,.8,.81 with ≥. Can one cutoff select only the first .8 observation?

**Hint.** Equal-score groups move together. Use zero_division=0 for no predicted positives.

**Solution.** At .2, TP=2,FP=1,FN=0 and F1=4/5. At .8, TP=1,FP=1,FN=1 and F1=1/2. At .81 nothing is selected, so F1=0. A scalar cutoff cannot distinguish the equal scores. A feature-based or randomized tie-break changes the procedure and needs its own justification/validation.

### G. Recover score meaning before applying cost

**Question.** True p=.2; training uses positive weight 4 and negative weight 1. Find the ideal weighted score. Deployment FN costs 3 and FP costs 1. Decide using original p.

**Hint.** Weighted q has a different event scale; original-probability cutoff is 1/4.

**Solution.** q=.8/(.8+.8)=.5. Cost cutoff is .25, so p=.2 chooses 0: expected cost 3×.2=.6 versus 1×.8=.8 for choosing 1. Treating q as original p would reverse the comparison. The ideal mapping can be inverted under its assumptions; finite fitted score meaning still requires verification.

### H. An absent class and a vote denominator

**Question.** Powerset vocabulary {000,101,010}: can it decode 111? Separately, AB votes 10, BC 11, AC 01. What does overlapping voting produce with positive ties?

**Hint.** Powerset chooses an available category. Coverage counts only members containing a label.

**Solution.** Plain powerset cannot emit 111. Votes are A=1/2,B=1/2,C=2/2, so the stated positive-tie rule gives 111. These are different hypothesis spaces. The new strict-majority RAkEL route would produce 001 instead; this task retains its explicitly positive toy tie. Voting still does not enforce a domain constraint that could forbid 111.

### I. Change the measurement units

**Question.** Divide the four-row energy target by 10 instead of 100. Which shared cut wins? Do separate optimal cuts depend on positive rescaling?

**Hint.** Raw energy SSE at cuts .5/1.5/2.5 is 0/5000/(20000/3). Divide by 100 after squaring.

**Solution.** Combined losses are 8/3,50,8/3+200/3=208/3, so .5 wins. Temperature SSE at the last cut is 8/3. Separately, positive rescaling multiplies every candidate's output loss by the same positive constant, preserving its minimizing cuts and ties. A joint split responds to **relative** scales.

### J. A different grouped feature

**Question.** In an orthonormal design, one feature's unpenalized row is (−3,4), λ=1. Find grouped and separate solutions. Why does the formula not solve arbitrary correlated X?

**Hint.** Norm is 5; grouped shrink is radial, separate shrink subtracts 1 from each absolute coordinate.

**Solution.** Grouped factor .8 gives (−2.4,3.2); separate thresholds give (−2,3). The closed form used XᵀX/n=I. Correlated columns introduce cross terms between feature rows, so one shrink of arbitrary least-squares coefficients generally fails the full optimality conditions. Use the proximal iterations derived in section 13.

### K. Sparse observations versus a sparse mean

**Question.** Exactly one of ten labels is chosen uniformly independently of X. Are observed rows sparse? Is the conditional mean sparse? What does high retained reconstruction energy fail to guarantee?

**Hint.** Write all ten marginal probabilities before considering a recovery assumption.

**Solution.** Every sample has one nonzero, while the conditional mean has ten nonzeros, all .1. Sparse conditional-mean recovery does not follow from sparse samples. High retained energy also does not guarantee rare-label recall; report the decisions and support required by the task.

### L. Change a cost and submit a frozen report

**Question.** On the grouped text corpus, minimize validation FP+3FN with fixed candidate order/cutoffs. Must its selected family stay the same? Report frozen test cost, denominator and a limitation.

**Hint.** Choose only on validation, using the first minimum for ties, before consulting test truth.

**Solution.** The complete `changedReport.py` chooses independent/.5 with validation cost 3, while the original micro-F1 objective chose chain 012/.6. Its frozen test cost is 0 over 24 label decisions and micro F1=1. The denominator is 8 messages×3 labels. Two paraphrases per group stay together, but the 32-message constructed corpus is small and does not establish broad repair-message performance. The two reports answer different fixed objectives. Their full arrays show why changing the validation loss can change the selected recipe; choosing a story after consulting test errors would invalidate that comparison.

### M. Mask and fit support

**Question.** X rows are 0,1,2,3. A is observed positive only on rows 0 and 2; its other cells are unknown. Every B cell is unknown. What can the supported fit do? If A's known row 2 bit instead becomes 0, compute the zero-weight mean-loss gradient with a leading intercept. Which evaluation denominators exist?

**Hint.** Unknowns do not become zeros; a supported constant policy differs from a both-class Newton fit.

**Solution.** n_A=2,n_B=0. A can use the explicit known-positive constant baseline; without negative support the declared logistic fitting route is not used. B has no supervised fit/evaluation. Original A evaluation uses two known cells; there is no fully observed A/B row for exact-vector evaluation. With changed observed A truth [1,0] and design [[1,0],[1,2]], zero weights yield p=[.5,.5], residual [−.5,.5], gradient [0,.5]. Slope penalty contributes 0 at these weights. The changed two-class A fit is supported. Neither case establishes population prevalence without an annotation-process assumption.

### N. Rank ties after a changed score

**Question.** One row has truth [0,1,0,1], scores [.9,.6,.6,.2]. Compute ranking loss/LRAP/coverage, then change D's score to .6. Add a second empty-truth row with scores [.8,.7,.4,.1]. Does mean row AP equal macro label AP?

**Hint.** A positive–negative tie loses its pair; LRAP uses maximal tied ranks. AP over columns ranks observations.

**Solution.** Initially B>A is wrong,B=C tied wrong,D>A wrong,D<C wrong:4/4 ranking loss 1. LRAP for B is 1/3, for D2/4, mean 5/12; coverage 4. After D=.6, all four pairs are still wrong/tied, so ranking loss 1. Both relevant labels have 2/4 relevant items at least as high, LRAP .5 and coverage 4. The empty row has ranking loss 0,LRAP 1,coverage 0 under the stated API convention. For the initial two-row scores, row AP is(1/3+2/4)/2=5/12 then 0, so samples AP5/24. Column AP is 0 for A/C,1/2 for B because its negative observation outranks its positive, and 1 for D because its positive score .2 exceeds the negative .1. Macro AP is(0+.5+0+1)/4=3/8, different from 5/24. The axis, not just the formula's name, determines the result.

### O. Learn a changed count posterior

**Question.** Positions 0,1,2,5,6,7 have one label's bits [1,0,1,0,0,1]. Use k=2, self exclusion by row ID, s=1. Derive both count histograms, prior and the posterior for query 1.2. Compare raw voting and explain self inclusion's error.

**Hint.** Each three-point cluster supplies the other two points as training neighbours. The query chooses positions 1 and 2.

**Solution.** Own-positive rows at 0/2/7 have counts 1/1/0, so positive histogram [1,2,0]. Own-negative rows at 1/5/6 have counts 2/1/1, so negative histogram [0,2,1]. Priors are .5/.5. Query count 1 gives likelihood 3/6 in both classes, equal numerators .25, total .5, posterior .5 and positive under ≥.5. Raw neighbour mean is also .5 here but is computed differently. At changed query 5.2, the neighbours are 5 and 6, count 0: positive likelihood 2/6, negative 1/6, posterior 2/3 despite raw vote 0. Self inclusion would change the training count feature and its learned histograms, so it would fit a different, answer-contaminated count model.

### P. Choose an F1 set, not just a threshold

**Question.** Three-label law has P(000)=.2,P(100)=.3,P(011)=.5 and all other masses 0. Empty/empty payoff is 1. Find all fixed-size gains, the best expected-instance-F1 action and compare all eight action rewards.

**Hint.** A occurs only at truth size 1; B/C occur together at size 2.

**Solution.** For k=1, gains are [.3,1/3,1/3], best B or C reward 1/3. For k=2, gains [.2,.25,.25], best BC reward .5. For k=3, gains [.15,.2,.2], total .55, so ABC wins. Empty reward is .2. Every action reward in 000…111 order is [.2,1/3,1/3,.5,.3,.45,.45,.55]. For ABC, the 100 outcome contributes .3×(2/4)=.15 and 011 contributes .5×(4/5)=.4. Marginal thresholding chooses BC if .5 ties are positive and gives reward .5, which is lower. This explicitly optimizes instance F1 under the supplied law, not pooled micro F1 for arbitrary batches.

### Q. Distinguish a proximal step and a rank fit

**Question.** X=Y=[[1,0],[1,1],[0,1]], W=0, α=.3,η=.25. Compute one proximal step and explain why shrinking the OLS matrix I once is not generally optimal. Then use section 14's X with changed first target [−3,3,0,0] and second [8,8,−9,−7]. Compare rank 1 fitted-response RRR, raw-target PCA→regression and full rank SSE.

**Hint.** Smooth gradient is still −XᵀX/3. Project the changed Y through Q before truncation.

**Solution.** Z=[[1/6,1/12],[1/12,1/6]], row norm √5/12. Threshold ηα=.075 and shrink factor 1−.9/√5≈.597508 give rows approximately [.099585,.049792] and [.049792,.099585]. A single proximal operation solves a local quadratic step, while correlated X's optimum must satisfy its actual composite stationarity condition. Shrinking I by .3 gives .7I. Its smooth gradient has diagonal −.2/offdiagonal −.1; the active-row penalty gradient contributes .3 on the row's diagonal direction, leaving diagonal +.1 and offdiagonal −.1. It is not stationary. For the changed rank example, Z diagonal is 3√2,√2; unfit second-output SSE is 256. Rank 1 RRR retains first direction and has SSE 258, full rank 256. Raw Y's second energy 258 exceeds first 18, so rank 1 PCA→regression captures only the second fitted direction, leaving first SSE 18 plus unfit 256=274. The same decomposition explains the gap without an additional fitted campaign.

### R. Audit a changed real-study proposal

**Question.** A proposal rescales targets using all 768 rows, puts another orientation of a training geometry into test, and picks a coupling method by test RMSE. Repair all three boundaries and describe a frozen strongest-independent comparison.

**Hint.** Follow each information path: transform, membership, selection.

**Solution.** Fit every target transform on training Y only and retain its inverse/raw-unit errors; all-row scaling lets held labels influence the trained shared objective. Keep entire geometry tuples indivisible so an orientation of a training geometry cannot pose as held-geometry transfer. Fix all candidates/split/metric first, choose overall/family/best-R-or-I roles on validation, then retain one locked descriptive test report without refitting. Keep all failures and coupled/independent tradeoffs; do not compare against only a weak convenient separate setting. New weather/material data or a changed protocol would be a new study with separately declared inputs and evaluation, not a reason to replay this one until the conclusion changes.

## 18. Carry the output contract into a time-to-event question

Several output slots do not always mean several independent answer questions. The next topic supplies a particularly useful counterexample: follow-up time and whether an event was observed.

<!-- diagram:D67 -->

One person has an observed event at time 4, recorded (4,1). Another is followed until time 4 without an observed event, recorded (4,0); their timeline continues into an unknown future. That zero is a **censoring indicator**, not an ordinary negative multilabel target saying the event never happens. The observed time is an event time in the first row and a lower bound on an unobserved event time in the second. Treating both as identical regression answers or ordinary binary negatives would change their meaning.

[Survival Analysis: Cox Regression, Kaplan–Meier & Hazard Models](/learn/topic/survival-analysis-cox-regression-kaplan-meier-hazard-models) develops the survival function, risk sets and censor-aware likelihood. Our timeline establishes why the output contract requires that new loss before the link asks for new mathematics. Keep the habit from this lesson: name what every slot means, what was observed, what the model is allowed to know and which loss turns its evidence into an action.

Further learning follows those concrete questions. [Zhang and Zhou's multi-label survey](https://www.lamda.nju.edu.cn/publication/tkde13rev.pdf) is a broad technical treatment of metrics, transformations and adaptation methods; start with its problem/metric definitions, then read the methods corresponding to our sections 7–10. Its normalization/convention choices differ in places from the explicit sklearn-compatible ones here, so compare definitions instead of transferring names blindly. [Borchani et al.'s multi-output regression survey](https://cig.fi.upm.es/wp-content/uploads/2022/03/Borchani-A-survey-on-multi-output-regression.pdf) organizes regression sharing and includes the reduced-rank derivation/R implementation; sections 12–14 prepare its matrix notation. Both are freely accessible author/institutional PDFs.

[Jesse Read's Porto tutorial](https://jmread.github.io/talks/Tutorial-MLC-Porto.pdf) provides an alternate visual route through label objects, chains and powerset projection. Use it to redraw a factor tree or compare a restricted representation, while checking its abbreviated metric illustrations against the definitions above. It is a slide resource, not an unseen video claim. [The official sklearn multiclass/multioutput guide](https://scikit-learn.org/stable/modules/multiclass.html) explains supported target types and estimator interfaces. Read it alongside the complete local ordinary routes; documentation alone does not substitute for the transformations and fitting code.

Technical references connect specific mechanisms: [Read et al., classifier chains](https://researchcommons.waikato.ac.nz/bitstreams/902d767f-054f-493f-83f2-21d048effe0a/download) for ordered conditional features and hard-vote ensembles; [Dembczyński, Cheng and Hüllermeier, probabilistic classifier chains](https://icml.cc/Conferences/2010/papers/589.pdf) for complete-law rather than greedy decoding; [F-measure maximization](https://jmlr.org/papers/v15/waegeman14a.html) for loss-specific set-size gains; [compressed prediction](https://arxiv.org/abs/0902.1283) for measurement/recovery assumptions; [ML-kNN](https://www.lamda.nju.edu.cn/publication/pr07.pdf) for both neighbour-count likelihoods; and [calibrated label ranking](https://www.mathematik.uni-marburg.de/~eyke/publications/ml08.pdf) for discordant-pair training and the virtual cutoff. These primary author/institutional texts deepen the locally worked mechanisms. [Random k-labelsets](https://www.researchgate.net/publication/220073602_Random_k-Labelsets_for_Multilabel_Classification) explains overlapping local vocabularies and strict coverage-normalized voting; its author-upload access can vary. [PLST](https://www.csie.ntu.edu.tw/~htlin/paper/doc/wsmld10plst.pdf) uses an uncentered label-space convention, so compare that premise with our explicitly centered example before reusing its reconstruction. [Vector-valued kernels](https://arxiv.org/abs/1106.6251) develops the covariance block in section 15 beyond our single-observation conditional calculation. Historical paper benchmarks remain conditional on their own data and evaluation; they are not measurements of the present programs.

The common file index supplies all complete contextual programs and three full local dependencies, the Energy CSV/provenance/results/model-state/lock, the recorded-asset manifest, setup and independent toy-task inputs, and recorded text outputs. Focused code comes from those exact complete files; Copy/Download supplies the complete named source, with dependencies listed separately. Use `energy-multioutput-learning.py` for the fully specified offline report/query and own-task commands above. Its `energy_multioutput_core.py` dependency is a complete ordinary-library/saved-array implementation. The archival `energy-multioutput-study.py` retains the separate once-only Energy recorder and is not that learner CLI. Run Python 3.12 with NumPy/SciPy/scikit-learn available; the recorded snapshots use NumPy 2.3.5 and scikit-learn 1.9.1. The archival workbook parser additionally imports openpyxl. Put `multioutput_newton.py` beside `masked-binary-heads.py` and `chain_core.py`, and both existing dependencies beside `chain-fit-and-decode.py`. Their imported operations are explicit and import-safe. `MULTIOUTPUT-SETUP.md` lists the complete eight-file Energy report/query directory and two additional own-task inputs. Copy feedback reports the actual source copy outcome; every source filename identifies the complete program explained at its place in the reading flow.
