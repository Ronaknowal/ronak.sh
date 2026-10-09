<a id="7-deeper-branch-what-cross-validation-uncertainty-does-and-does-not-mean"></a>
<a id="risk-and-uncertainty"></a>
## 7. What error is random, and what can its variation tell us?

A correct information boundary prevents one source of optimism. It does not make every error estimate unbiased for every target, nor make fold scores independent. Begin by deciding which object stays fixed when we imagine repetition.

<!-- Drawing D30: visual-specifications.md#d30. -->

On the left, fix the actual training table D and the fitted predictor f_D. Draw a fresh future pair (X,Y), apply that fixed predictor and average its loss. This is the conditional error of this fitted object,

\[
\operatorname{Err}(D)=\mathbb E_{(X,Y)\text{ fresh}}[\ell(Y,f_D(X))\mid D].
\]

On the right, draw a new training table D of size n, rerun the whole declared fitting or selection recipe, and then draw a fresh pair. Averaging again gives the recipe's expected error, \(\operatorname{Err}_n=\mathbb E_D[\operatorname{Err}(D)]\). A particular fitted object can be better or worse than that recipe average. The second expectation cannot tell us which one happened without further information. If the recipe includes candidate selection, the function D→f_D includes that selection.

Cross-validation trains on fewer than n rows and shares training observations across operations. Its interpretation depends on both the target and assumptions about those observations. “Unbiased” without naming the target, training size and randomness is incomplete. A separately sampled test set assesses the particular fixed fitted object conditionally on its training data, provided test observations really follow the intended future law and have not influenced adaptation. Its own finite test uncertainty remains.

### Derive a training-size effect without leakage

<!-- Drawing D31: visual-specifications.md#d31. -->

Take independent targets Y=μ+ε with mean-zero noise of variance σ². There are no useful features. The recipe predicts the training sample mean \(\bar Y_m\). A fresh Y is independent of that sample mean. Expand its squared error:

\[
\mathbb E[(Y-\bar Y_m)^2]
=\mathbb E[(Y-\mu)^2]+\mathbb E[(\bar Y_m-\mu)^2]
=\sigma^2+\frac{\sigma^2}{m}.
\]

The cross-term vanishes because the two centered terms are independent with mean zero. In contrast, each training Y_i helped form \(\bar Y_m\). Since \(\operatorname{Cov}(Y_i,\bar Y_m)=\sigma^2/m\), its expected training squared error is

\[
\sigma^2+\frac{\sigma^2}{m}-2\frac{\sigma^2}{m}
=\sigma^2(1-1/m).
\]

Read the two analytic curves around the irreducible σ² line. At σ²=4 and m=8, training error averages 7/2 and fresh error 9/2. At n=12, they are 11/3 and 13/3. A valid assessment of the eight-row recipe can therefore be pessimistic for the twelve-row recipe by 9/2−13/3=1/6, even with no information leak. This is an exact property of the mean predictor, not a universal learning-curve shape. Other algorithms can have nonmonotone risk. LOO uses nearly n training rows; larger K can reduce this particular training-size discrepancy while changing computation and dependence. It cannot be chosen solely by repeating “more folds is more accurate.”

### The variance of a mean includes its covariances

<!-- Drawing D32: visual-specifications.md#d32. -->

Let Z_1,…,Z_K be random fold scores or centered fluctuations. Expand the square of their mean around its expectation:

\[
\operatorname{Var}\!\left(\frac1K\sum_k Z_k\right)
=\frac1{K^2}\sum_{j,k}\operatorname{Cov}(Z_j,Z_k).
\]

The diagonal terms are individual variances; the off-diagonal terms describe joint movement. Only under an appropriate zero-covariance assumption does this reduce to a sum of variances divided by K². A standard deviation across the K observed fold numbers does not identify all those covariances.

To see the missing part, construct independent fair signs S,E_1,…,E_K, each ±1, and set Z_k=aS+bE_k. S is a common shock; E_k belongs only to fold k. They have mean zero, so each variance is a²+b², each off-diagonal covariance is a², and

\[
\operatorname{Var}(\bar Z)=a^2+b^2/K.
\]

At a²=b²=1/2 and K=4, the matrix has diagonal 1 and every off-diagonal cell 1/2. The mean variance is 1/2+1/8=5/8. An independence calculation with the same individual variance would give 1/4. The common shock moves every fold together and disappears when subtracting the observed fold mean to compute an across-fold spread. It therefore cannot be recovered from that spread alone. These are centered mathematical shocks; negative values are not claims of negative classification loss.

The local investigation edits a, b and K and shows the actual covariance cells and common/individual contributions. Setting a=0 removes the common term; setting b=0 makes averaging unable to reduce variance. At a²=0.2,b²=0.8,K=5, the mean variance is 0.36 rather than the independence value 0.20. This is a model with declared dependence, not a method for estimating a² from the visual amount of training overlap.

### Overlap does not itself specify a covariance

Consider a recipe that always predicts class 0 and ignores all training data. Give it independent fair binary labels. Each LOO correctness indicator is 1 exactly when that held label is 0. The training sets overlap almost completely, yet their fitted predictions have no training dependency at all.

<!-- Drawing D33: visual-specifications.md#d33. -->

The mean LOO accuracy is the average of n independent Bernoulli(1/2) indicators: expectation 1/2 and variance 1/(4n). Increasing n decreases that variance in this example. “LOO always has high variance because its training sets overlap” cannot be a universal law. An algorithm that responds strongly to shared training rows can behave very differently. Bengio–Grandvalet's impossibility result concerns a universally unbiased variance estimator for the usual K-fold setting across the distributions in their theorem; it does not rule out useful inference under extra structural assumptions. [Original paper](https://jmlr.org/papers/volume5/grandvalet04a/grandvalet04a.pdf).

`risk_and_covariance_exact.py` puts the mean-predictor formulas, common-shock covariance and always-zero counterexample in one complete executable reference. Fractions retain the exact proof values; NumPy's population-normalized covariance is an arithmetic comparison. Enumeration is intentionally bounded to small finite examples. It trades scalability for inspectability rather than claiming that exhaustive signs are a practical uncertainty estimator.

<!-- Programme P10: insert risk_and_covariance_exact.py and actual full stdout here. -->

Repeated folds give more views of the same finite sample, not new independent people. Report their variability descriptively when appropriate; an interval for future error needs a justified inferential method and sampling model. The same distinction will matter when we manufacture new training tables by resampling.

### Bootstrap the statistic you actually mean

<!-- Drawing D34: visual-specifications.md#d34. -->

A bootstrap draw samples n positions with replacement from the n observed units. The result is a multiset: repeats count. For four source rows, [0,0,2,2] has occurrence positions 0,1,2,3 but source IDs 0,0,2,2. Its source multiplicities are [2,0,2,0]; only source IDs 0 and 2 appear, and IDs 1 and 3 are out of bag.

Follow the source-to-copy arrows. Two copies of a row contribute twice to the empirical fitted distribution, including medians, means and neighbour votes. They do not become two independently observed people. A given original row is absent with probability (1−1/n)^n; expected distinct count is n[1−(1−1/n)^n]. For n=4 this is 175/64≈2.734375. The familiar limiting distinct share 1−e⁻¹≈0.632 is an asymptotic expectation, not the number every draw must contain.

The bootstrap statistic must be named as a function T(D). Resampling a simple sample mean and resampling an adaptive select-and-refit rule are different computations. Holding the chosen candidate fixed omits selection variability and describes a different statistic. In either case, whether the resulting bootstrap law approximates the desired sampling law requires assumptions; non-smooth selection, dependent observations and changing data distributions can defeat a naive interpretation. We use the following tiny procedure to expose what rerunning **the whole statistic** actually does, without claiming a confidence interval.

The source table is x=[0,1,2,3], y=[0,0,1,1]. T(D*) is the fraction of class-1 votes at a fixed future query x=1.5 after a declared inner selector and fresh refit. It is not out-of-bag accuracy, resubstitution accuracy or the selected inner score. Three distinct quantities need three distinct labels.

To define the inner selector on a multiset, sort its distinct source IDs and alternate them into two held groups. All copies of a source travel together. For each candidate k=1 then k=2, freshly fit the numeric median and population standard deviation on each permitted inner training multiset, predict held occurrences, and pool correct counts over held occurrences. A candidate is eligible only if k does not exceed the training occurrence count in either fold. Tied scores select the first candidate. Then refit its preparation and KNN reference set on the entire resample and predict the fixed query. Distances tie by source ID then copy ordinal; class vote ties choose class 0. These conventions make the finite statistic reproducible.

For [0,0,2,2], holding source 0 leaves two source-2 copies for training and vice versa. Both eligible candidates score zero across those opposite-label held groups, so k=1 wins. The all-resample refit has mean 1 and population variance 1; the query becomes 0.5 and its nearest source is 2, class 1. Thus T=1. Its resubstitution accuracy is 1, a different value from the grouped inner score 0. Splitting occurrence positions alternately would put a copy of each source into training and validation, producing the misleading inner accuracy 1 for this duplicated-source fixture.

Change the draw to [0,1,2,3]. The grouped k=1 score is 3/4 and k=2 score 1/2, so k=1 wins again. The final mean is 1.5 and variance 1.25. Query 1.5 ties sources 1 and 2 at squared standardized distance 1/5; source-ID order selects 1, class 0, so T=0. Permuting the same multiset changes neither fitted values nor T. The local investigation exposes occurrences, source groups, both inner fits and the final query path while editing the actual source-ID list or equivalent multiplicities.

The draw [0,0,0,2] leaves only one training occurrence in one fold, making k=2 ineligible while k=1 remains defined. A draw containing only one distinct source cannot form the required two nonempty source-held folds: T is undefined for this declared recipe. Do not silently redraw it. Of the 4⁴=256 ordered four-draw samples, the four constant-source draws are undefined, mass 4/256=1/64. Report that mass before optionally describing the conditional law on the remaining 252. This recipe's exact finite enumeration has T=0 on 188 draws and T=1 on 64. Renormalizing without naming the conditioning would conceal a procedure failure.

If the sampling unit is a person with several records, sample whole persons and keep all their source rows/copies together at an inner person boundary. The group extension in the code illustrates that bookkeeping. It does not establish bootstrap validity for every clustered population. Unknown IDs, negative or noninteger multiplicities, misaligned sampling-unit identities and an empty draw refuse explicitly.

<!-- Programme P11: insert bootstrap_the_whole_statistic.py and actual full stdout here. -->

The complete source imports the already displayed guarded P04 fitted primitive. Its local occurrence-aware adapter keeps multiplicities and group identities; it does not pass repeated IDs through the distinct-index fold validator. `whole_statistic` also refuses assigning different sampling units to copies of the same original source. Read it from eligibility through both inner operations to the final refit. The ordinary `sklearn.utils.resample` comparison checks index multiplicities, and NumPy checks the separate sample-mean statistic. Neither ordinary helper implements the whole adaptive statistic automatically. The short 256-draw enumeration is a new exact teaching computation, separate from every historical Penguins fit.

### A deeper identity for uncertainty about an error estimate

Nested tuning protects an adaptive choice. Bates–Hastie–Tibshirani also study a different use of nested resampling: estimating the mean squared error of an error estimate. 

<!-- Drawing D35: visual-specifications.md#d35. -->

Begin with a probability identity rather than equating the two meanings of “nested.” Let A be a training-only error estimate; let μ be the true conditional error of the fixed trained object; let \(\bar H\) average independent holdout losses. Conditional on training information, A and μ are fixed, \(\mathbb E[\bar H]=\mu\), and the centered holdout term has mean zero. Expand:

\[
\begin{aligned}
\mathbb E[(A-\bar H)^2\mid D]
&=(A-\mu)^2+\operatorname{Var}(\bar H\mid D),\\
\mathbb E[(A-\bar H)^2\mid D]-\operatorname{Var}(\bar H\mid D)
&=(A-\mu)^2.
\end{aligned}
\]

The cross-term is \(-2(A-\mu)\mathbb E[\bar H-\mu\mid D]=0\). With h conditionally independent identically distributed holdout losses of variance v, the variance term is v/h. Dependence requires its actual covariance sum instead.

Take A=1/4 and μ=1/2, with two independent fair zero-one holdout losses. Their mean is 0,1/2,1 with probabilities 1/4,1/2,1/4. The expected squared discrepancy from A is 3/16; holdout-mean variance is 1/8; subtract to obtain 1/16, exactly (1/4−1/2)². The larger discrepancy includes holdout noise, so subtracting it targets uncertainty in A rather than all variation in the comparison. For one observed holdout mean 0, however, (A−0)²−1/8=−1/16. A finite subtraction can be negative even when the target expectation is nonnegative. Clipping it and calling it a valid confidence interval would add an unjustified inference rule.

<!-- Programme P12: insert holdout_mse_identity.py and actual full stdout here. -->

`holdout_mse_identity.py` checks finite probability masses and expectations directly and compares NumPy weighted sums. Its perfect-dependence example has holdout-mean variance 1/4, exposing why the independence-based subtraction cannot simply be reused. This is the local identity, **not** the paper's full nested uncertainty estimator or interval algorithm.

The paper also distinguishes conditional fitted-model error from recipe-average error. Its particular conditional-independence theorem uses iid Gaussian homoskedastic ordinary least squares, squared loss and the stated linear-invariance setting; it is not a theorem that every CV estimate is independent of every fitted model's error. Read those assumptions with the result, and consult the full method before implementing its inference. The cited July 2022 version develops these risk definitions and the nested-MSE method; the resources identify that version and the later-version access limit. [Bates, Hastie and Tibshirani](https://arxiv.org/pdf/2104.00673).

Dependence and finite selection noise explain why evaluating more configurations cannot remove uncertainty automatically. We next let a search use its previous observations, while keeping every proposal, belief and paid resource distinct from fresh assessment evidence.
