# Ensemble Methods & Stacking

Several fitted rules can forecast the same event. Combining them is useful when their errors leave something to cancel, and when we learn the combination without showing it the answers it is supposed to predict. We will follow the numbers through saved models, then follow the rows through fitting, selection and evaluation.

The core route passes through all thirteen sections: forecast and vote, error cancellation, bootstrap membership, one boosting update, honest combiner fitting, and saved inference. The visible deeper passages derive covariance, exponential loss, constrained optimization, nested selection, calibration and context products. You can return to those derivations after tracing the corresponding picture. The common Learning compass supplies section navigation, prerequisites and the full program index.

## 1. Several forecasts, one outcome

Suppose we want to forecast a shipment's elapsed delivery time in hours. A **feature** is information available when we forecast; a **target** is the outcome we eventually observe. Here x is a deliberately simplified numerical shipment descriptor. The following coefficients and tree leaves are already saved. This is a small illustration, not collected shipment data.

<!-- diagram:D01 -->

At x=2, the saved line multiplies 2 by its slope 2 and adds its intercept 3: its forecast is 7 hours. The saved one-split tree, or **stump**, asks whether x is below 1.5. This query takes the right branch and reads the saved leaf value 9 hours. Multiply each forecast by .5 and add: .5×7+.5×9=8 hours. The later observed delivery time 8.5 belongs beside an error calculation, outside this prediction route.

An **ensemble** is a collection of predictors together with a rule for combining their outputs. The line and stump are its **base learners** or members. Their parameters have different meanings: a slope is not a tree threshold. We combine comparable forecasts rather than averaging unrelated parameter arrays. At prediction time, a new feature row goes through the saved members and combiner; it does not supply its unknown target.

<!-- diagram:D02 -->

The six schematic identities A–F separate permissions. A/B/C may fit parameters, D/E may choose among already specified candidate rules, and F may assess the selected rule afterward. These roles explain what a fit can read; six rows do not produce an experimental conclusion. If we use F's outcome to improve a weight, F has become choice data and can no longer provide the same untouched assessment. Later examples use different, explicitly named row sets.

This lesson assumes the line's multiply/add and the tree's branch/leaf are familiar, but the picture refreshes both. [Linear & Logistic Regression, §2](/learn/topic/linear-logistic-regression#2-make-every-residual-visible) develops residuals; [Trees, §7](/learn/topic/decision-trees-random-forests#7-build-the-mechanism-in-complete-code) develops actual split fitting. Our new job is to understand what combining their saved outputs changes.

Explain the route without using the word “ensemble”: the feature reaches both saved rules, their forecasts are multiplied by named weights, and those products are added. Apply it at x=1: the line gives 5, the stump takes its left leaf 6, and their equal mean is 5.5. Diagnose an error: inserting the later target into either base's query input changes the task from forecasting to using its answer.

## 2. Decide what to combine

<!-- diagram:D03 -->

For forecasts 7 and 9 hours, assign member A weight .25 and B weight .75. Their contributions are 1.75 and 6.75 hours; the sum is 8.5. A weight tells us how much of a comparable output enters the combination. With nonnegative weights summing to one, the combination stays between the smallest and largest member forecasts. Such weights form a **convex combination**. Change either forecast or weight below the picture and watch the endpoints and sum together. Identical forecasts remain identical under every permitted weight.

For B members, write their forecasts f_b(x) and normalized weights w_b. The rule is f̄(x)=Σ_b w_b f_b(x), with w_b≥0 and Σ_b w_b=1. The bar names the combined forecast; it does not mean that model parameters have been averaged. Nonnegative unnormalized quantities a_b can be converted into w_b=a_b/Σ_c a_c when the total is positive. All-zero quantities define no mean. They must produce an unavailable result rather than an invented equal mean.

A classification task changes the output type. Define class 1 as “delivery exceeds the stated deadline” and class 0 as “it does not.” This event is different from elapsed hours. A probability vector has one explicitly named column per possible class and nonnegative entries summing to one. A **hard vote** first selects each member's most likely class and combines ballots. A **soft vote** first combines the aligned probability mass and then selects a class.

<!-- diagram:D04 -->

Three members assign class-1 probabilities .51,.51,.01. Their class-0 probabilities are .49,.49,.99. With equal weights, two ballots favor class 1, so the hard vote chooses 1. Soft class-1 mass is (.51+.51+.01)/3=103/300≈.343333; class-0 mass is 197/300≈.656667, so the soft vote chooses 0. The confident third forecast matters to mass, while each hard ballot contributes only its weight. Our declared tie rule selects class 0. Neither rule is universally superior; they answer different numerical questions.

<!-- diagram:D05 -->

The separate weight view shares those same three probability rows. Edit three nonnegative member quantities and inspect their normalization. Multiplying every quantity by the same positive factor leaves the normalized weights unchanged. Making all of them zero makes both weighted results unavailable. A very small positive total still defines a combination: the implementation divides by the largest quantity first to avoid losing that domain through underflow. Weight identity follows the member through the probability and ballot views.

<!-- diagram:D06 -->

Class identity follows its name, not its column position. If one member returns [silver,amber,blue] with [.1,.6,.3], the output order [amber,blue,silver] requires [.6,.3,.1]. Adding the original arrays by position would combine different events. A member fitted without one class can contribute zero probability to that named class under an explicitly declared alignment rule; a missing decision margin does not automatically have an equivalent recovery rule.

The separate copied-error picture asks why multiple ballots sometimes help. If three binary errors are independent with probability .3 each, majority error is 3(.3)²(.7)+(.3)³=.216. Three copies of one predictor have the same error indicator, so their majority error remains .3. Distinct model names do not imply independent errors. [Naive Bayes, §6](/learn/topic/naive-bayes-probabilistic-classifiers#6-test-the-independence-assumption) develops a related copied-evidence failure, although multiplying likelihood factors and averaging prediction probabilities are different operations.

The complete retained `combination-arithmetic` program computes the small identity with exact fractions. New `ensemble-combination-core.py` supplies arbitrary named-class alignment, positive-total normalization, numeric means and weighted ballots. Its functions validate the input type separately from the arithmetic. `align_probabilities` builds columns by class name; `convex_mean` multiplies a row-by-member matrix by its normalized weight vector; `weighted_ballot` accumulates each member's ballot into the named class's mass. The printed hard and soft results reproduce the picture without fitting any base model.

## 3. Find errors that can cancel

<!-- diagram:D07 -->

A residual is forecast minus observed target. Use a separate four-row residual illustration: member A's residuals are [−3,−1,2,2] and B's are [1,1,−1,−3]. The signs tell us which side of the target each forecast lies on. With A weight w and B weight 1−w, the combined residual on every row is w e_A+(1−w)e_B. At w=4/9 the four combined residuals are [−7/9,1/9,1/3,−7/9], whose mean square is 1/3. Looking only at the member names or separate average losses would hide this cancellation. In this connected comparison, A retains its teal identity, B its periwinkle identity and the mixture its amber identity through residuals, squares and loss curves; labels and line/mark styles also distinguish them.

### A finite identity before probability assumptions

<!-- diagram:D08 -->

For one target y, let f̄=Σ_b w_b f_b and define e_b=f_b−y and ē=f̄−y. A squared side length represents squared residual; every square in the picture uses the same physical scale. Zero residual has zero area. The weighted member loss is Σ_b w_b e_b². The weighted disagreement is Σ_b w_b(f_b−f̄)². Expand e_b=(f_b−f̄)+ē:

Σ_b w_b e_b² = Σ_b w_b(f_b−f̄)² + 2 ē Σ_b w_b(f_b−f̄) + ē² Σ_b w_b.

The middle sum is zero because Σ_b w_b f_b=f̄ and Σ_b w_b=1. The final sum is one. Therefore

ē² = Σ_b w_b e_b² − Σ_b w_b(f_b−f̄)².

This is an exact finite identity, often called the **ambiguity decomposition**. Average it over the same finite rows to obtain the corresponding mean-square identity. In our worked case, weighted member loss is 11/3 and weighted disagreement is 10/3, leaving combined loss 1/3. Its nonnegative disagreement term proves that a convex mean's squared loss is no greater than the weighted average member loss. It does not prove that the mean beats the best member. A perfect member averaged with a bad one can become worse.

The arbitrary residual editors preserve this identity beyond the default fixture. They share the current weight with the cancellation and loss-curve views. Changing the residuals changes both member quality and disagreement, so “increase diversity” alone is not an optimization prescription. [Krogh & Vedelsby, §2](https://proceedings.neurips.cc/paper_files/paper/1994/file/b8c37e33defde51cf91e1e03e51657da-Paper.pdf) develops the normalized squared-error relation; this lesson derives its finite version directly before discussing random training sets.

<!-- diagram:D09 -->

For two residual vectors a and b, put d=a−b. The row loss is L(w)=mean((b+w d)²). Its derivative is L′(w)=2 mean(d(b+w d)); the second derivative is 2 mean(d²)≥0. When d is nonzero, the unrestricted optimum is w*=−mean(bd)/mean(d²). For a convex two-member rule, clamp that optimum to [0,1]. In the default vectors, Σ bd=−24 and Σ d²=54, giving w*=4/9. The parabola's lowest point is inside the allowed segment. If every pair of residuals is identical, d=0 and every weight gives the same loss; there is no unique optimum to label. The exact program reports that flat state explicitly.

### Deeper: learn several weights under a stated constraint

<!-- diagram:D10 -->

With three or more members, a candidate coefficient vector can fall outside the allowed simplex. The simplex is the triangle of nonnegative weights summing to one; its corners select a single member. For v=[.8,.3,−.1], Euclidean projection subtracts the same threshold .05 from the active first two coordinates and sets the third to zero: [.75,.25,0]. Clipping and renormalizing would give [8/11,3/11,0], a different point. Projection finds the closest permitted point in squared Euclidean distance.

In general, sort v into u₁≥⋯≥u_B. For each prefix j, compute τ_j=(Σ_{i≤j}u_i−1)/j. Choose the largest prefix with u_j>τ_j and return w_b=max(v_b−τ_j,0). These coordinates satisfy nonnegativity and sum one. The active-prefix test explains why simply dividing positive coordinates by their total solves a different problem.

Let P be an n-by-B matrix of member forecasts and y the n targets for those same rows. A **design matrix** stores the inputs to a fitted combining rule; its columns are member outputs here. We minimize

J(w)=||Pw−y||²/(2n)+λ||w||²/2.

The first term is half the mean squared residual. λ≥0 controls an L2 penalty on coefficients. Differentiate each row's squared residual, then sum:

∇J=Pᵀ(Pw−y)/n+λw; H=PᵀP/n+λI.

The transpose sends row residual contributions back to their member coefficients. H is the curvature matrix, called the **Hessian**. At λ>0 it is positive definite, making this weight objective strictly convex. That makes a fitted solution unique under our convex constraints; it makes no statement about future predictive risk.

For P=[[1,2,4],[3,2,1],[2,5,0]], y=[2,1,3] and λ=.2, begin with w=[1/3,1/3,1/3]. The three row forecasts are [7/3,2,7/3], so their residuals are [1/3,1,−2/3]. Member A's derivative contribution is (1×1/3+3×1+2×(−2/3))/3+.2/3=33/45. The corresponding B and C components are −7/45 and 38/45. A small step η=.02 gives candidate v≈[.318667,.336444,.316444]. Its sum is below one; projection adds the same .009481 to each active coordinate, giving approximately [.328148,.345926,.325926]. This is one update, not the final fitted answer. The program repeats the same multiply, sum, step and projection operations.

New `ensemble-combination-core.py` writes those operations explicitly. Starting with permitted weights, it takes a gradient step and projects it back to the specified set. Its step uses a bound on curvature: an **eigendirection** v of H satisfies Hv=ℓv, meaning that this direction is preserved while H scales it by ℓ, its **eigenvalue**. Along a unit eigendirection, the quadratic objective has second derivative ℓ. For the simple H=diag(2,4), the coordinate directions have curvatures 2 and 4; the largest, L=4, bounds curvature along every unit direction. Our actual H is formed from P and the penalty, and the code computes its largest eigenvalue L before choosing η=1/L. This ties the numerical step to this fitting problem's curvature rather than a guessed learning rate.

It stops when the infinity norm of the **gradient mapping**, (w−project(w−η∇J))/η, and feasibility error are small. At a constrained optimum, the ordinary gradient need not be zero: a simplex's equality constraint can leave equal nonzero gradient coordinates. Our default simplex fit has all gradient coordinates ≈1.014807 while its gradient mapping is below 1e−10. The mapping is the appropriate stopping residual. A step limit is an explicit failure, not permission to print unfinished coefficients as fitted weights.

The independently computed ordinary route uses SciPy SLSQP with the same objective, nonnegative bounds and a sum-one equality. On P=[[1,2,4],[3,2,1],[2,5,0]], y=[2,1,3], λ=.2, the projected fit gives weights approximately [.128718226,.551469263,.319812511], forecasts [2.510906796,1.808905715,3.014782765] and J≈.194892134. Its prediction difference from SLSQP is below 8.3e−8 in this declared execution.

The same program also solves two distinct problems. Nonnegative least squares keeps w≥0 but drops the sum constraint; its weights are approximately [0,.569032888,.188049495], summing to .757082384. The ordinary `nnls` reference uses augmented rows P/√n and √λI to represent the same penalized objective. Unrestricted ridge allows negative coefficients and gives approximately [−.117114474,.627857075,.201206282]. Neither route earns the convex interval or ambiguity guarantee by borrowing the simplex's name. Duplicate member columns at λ=0 can leave weights unidentified while their combined predictions coincide; we report that possibility explicitly.

A dense objective and gradient cost O(nB); forming the Gram matrix costs O(nB²), projection costs O(B log B), and dense storage is O(nB+B²). These are arithmetic and memory counts, not measured wall-clock latency. The row-by-member and target editors later expose this same general model rather than restricting its native capability to one three-member fixture.

A deeper test asks when a best single member is already the optimal simplex combination. Let E contain the shared-row residual columns and R=EᵀE/n, so the unpenalized simplex mean-square loss is wᵀRw. At vertex e_k, moving a small amount t toward member i gives w=e_k+t(e_i−e_k). The loss derivative at t=0 is 2(R_ik−R_kk). Thus a necessary condition for that vertex to be optimal is R_ik≥R_kk for every i. It is sufficient too: every simplex displacement is a nonnegative combination of those vertex directions, and the quadratic is convex because R is a Gram matrix. These are the first-order constrained optimality, or **KKT**, conditions in this particular geometry.

For R=[[1,2],[2,4]], member A has the smaller individual mean square 1 and cross-product 2≥1, so the best permitted mixture is A alone. Disagreement need not make a mixture better. For the valid Gram example R=[[1,−.5],[−.5,4]], the cross-product is below 1; moving away from A initially reduces loss. The two-member optimum has A weight .75 and mean square .625, below 1. With the additional ridge penalty, the corresponding gradient uses R+λI and the vertex condition changes; it cannot borrow the unpenalized criterion unchanged. These finite-row calculations illuminate [Breiman's §2 analysis](https://statistics.berkeley.edu/sites/default/files/tech-reports/367.pdf), while estimated R still provides no population guarantee.

### Deeper: separate uncertainty over fitting from disagreement across members

<!-- diagram:D11 -->

Now fix one query x and imagine repeatedly drawing training data and fitting the procedure. The predictions F_b(x) are random under that experiment. For any fixed weights, variance of the combination is wᵀΣw, where Σ_{bc}=Cov(F_b,F_c) is the matrix of prediction covariances. It measures how the fitted forecasts co-vary across repeated fits, not the spread of one fitted model's errors across different test rows.

For equal weights, equal member variance σ² and common pairwise correlation ρ, expand the B diagonal and B(B−1) off-diagonal terms:

Var(B⁻¹Σ_b F_b)=σ²[1/B+(B−1)ρ/B]=σ²[ρ+(1−ρ)/B].

At σ²=4 and ρ=.25, B=4 gives 1.75 and B=20 gives 1.15. The residual limit is σ²ρ=1 under those assumptions. At ρ=1, copying predictors gives no variance reduction. For the common-correlation matrix to be a possible covariance, −1/(B−1)≤ρ≤1 when B>1; we cannot independently keep a strongly negative ρ while increasing B indefinitely. This schematic calculation does not estimate a covariance from our four residual rows.

<!-- diagram:D12 -->

For an independent future target Y=f*(x)+ε with mean-zero noise and variance σ_noise², the expected squared error of a random fitted rule separates into squared bias, fitting variance and irreducible noise. Bias is the difference between the average fitted forecast and f*(x); variance is spread around that average. Averaging can reduce the latter under suitable covariance, while shared systematic errors and target noise remain. Resampling and training may also change bias, so unchanged bias is not a universal bagging promise.

A population-optimal combination can include a best single member among its choices. That is a statement about minimizing true expected risk over the declared class. Estimated finite-row weights can overfit, so their future risk need not satisfy the same inequality. [ESL §8.8](https://hastie.su.domains/ElemStatLearn/) separates combining predictors from estimating their weights. Bayesian model averaging is another distinct route: it integrates model predictions using posterior model probabilities derived from prior probabilities and data evidence. Our fitted empirical square-loss weights are not posterior probabilities merely because they sum to one.

The next mechanism creates different fitted members by changing which training rows they receive. Its accounting starts with repeated row identities, not a claim that every resampled fit helps.

## 4. Follow the bootstrap rows

Start a separate six-row **all-training fixture**, again named A–F, with feature values x=[0,1,2,3,4,5] and numerical targets y=[1,2,2,6,7,8]. These invented observations check the mechanism; their reused letters do not retain the opening's fit/choice/assessment permissions. Here F is a training row, and the later OOF example keeps these six training identities. A **bootstrap sample** draws row identities with replacement, so it can contain repeated copies of one observation and omit another. **Bagging**, short for bootstrap aggregating, fits a member to each such sample and combines the resulting predictions.

<!-- diagram:D13 -->

The first bag draws A,A,C,D,D,F. Those six tokens have counts [2,0,1,2,0,1] against the original six identities. They are not six distinct observations. The repeated A and D tokens reach the fitted rule twice; B and E reach it zero times. Their original identities remain visible through the draw and fit, so a duplicate cannot silently disappear through set deduplication.

<!-- diagram:D14 -->

Fit a mean-leaf regression stump to the actual multiset. At threshold 2.5, the left targets [1,1,2] have mean 4/3 and SSE 2/3; the right targets [6,6,8] have mean 20/3 and SSE 8/3. The total squared residual sum is 10/3. Candidate splits compare the total from both children, rather than picking a visually striking boundary. A leaf's mean minimizes its own squared error because SSE(a)=SSE(ȳ)+m(a−ȳ)²; the centered residuals sum to zero. That is the same mean identity used in [Linear & Logistic Regression](https://ronak.sh/learn/topic/linear-logistic-regression#2-make-every-residual-visible).

The draw editor admits repeated A–F identities and a changed length, rather than only the initial preset bags. The fitted threshold, leaf values and prediction must follow the current multiset. If all drawn feature values are identical, there is no legal distinct-value split: the fitted rule is one constant mean leaf. More copies can change a fitted mean or which split wins even though no original feature/target value changed.

<!-- diagram:D15 -->

For a particular original row, a bag that omitted it is **out of bag**, or OOB, for that row. The eligibility mask is row-specific. The second bag draws B,C,C,E,E,F and the third draws A,B,B,D,E,E. At A's x=0, the three fitted predictions are 4/3,2,5/3. Their all-bag average is 5/3. A appears in bags 1 and 3, so only bag 2 may supply A's OOB forecast: that answer is 2. Averaging all bags and calling it A's OOB result would include fits that used A's target.

Inspect other rows with the selector; the mask and eligible mean change together. A row with no eligible bag has no OOB forecast. It is unavailable, not zero. OOB estimates can help assess a bagged fitting procedure under appropriate row sampling, but if we repeatedly choose settings by those outcomes, they become selection evidence. Group/time dependence also requires different eligibility rules; a bootstrap of rows alone does not establish a new-entity or future-time assessment.

<!-- diagram:D16 -->

For n original rows and m independent replacement draws, a named row is absent with probability q=(1−1/n)^m. On our n=6,m=6 sample, q=(5/6)^6=15625/46656≈.334898. Expected distinct identities are n(1−q)≈3.990612. With B independently generated bags, probability of no OOB-eligible bag for a named row is (1−q)^B. These are separate quantities: absence in one bag, expected distinct rows in one sample, and lack of an eligible forecast across bags. The live drawing changes draw count and bag count while retaining their different meanings. The familiar e⁻¹ approximation applies as n grows with m=n, not to every chosen draw length.

The retained `bootstrap-oob` program computes the tiny sampling probabilities exactly, and the original numerical helpers fit the current draw's actual multiset. [Breiman's Bagging Predictors](https://www.stat.berkeley.edu/~breiman/bagging.pdf) motivates aggregation of resampled fits through sensitivity to training-set perturbations. A small data change can alter a tree's selected branch structure substantially; averaging those changes can help. A stable procedure can change little and gain little, or even become worse. Random forests additionally randomize candidate features; [Trees §§8–9](/learn/topic/decision-trees-random-forests#8-track-bootstrap-membership-and-out-of-bag-evidence) owns that extension and its probability conventions.

Explain a duplicate's role: it is a second training contribution from the same row, not new independent evidence. Apply the OOB mask before averaging. Diagnose a row with no eligible member by keeping it unavailable and reporting which masks caused that state. Sequential fitting now changes the row contributions deliberately instead of drawing bags independently.

## 5. Make the next fit listen to different rows

<!-- diagram:D17 -->

Bagging fits can run in parallel after samples are chosen. **Boosting** fits the next member using information from the current rule's loss, so the sequence has a dependency. **Stacking**, which we will build in §7, constructs unseen-row member predictions and fits a second combining model. These graphs describe different fitting mechanisms, not a ranking or a measured speed comparison.

For signed binary AdaBoost, introduce a new, explicitly labeled fixture x=[0,1,2,3,4,5], y=[−1,−1,+1,+1,−1,+1]. These signs are class labels for this illustration. They are not shipment hours, and they do not reuse the WDBC class meanings introduced later. A member h_t(x) returns −1 or +1. A **distribution of row weights** D_t(i) assigns nonnegative mass summing to one to training row i. It determines which mistakes count most when fitting round t.

<!-- diagram:D18 -->

A weighted stump chooses its feature, threshold and polarity using the current masses. Evaluate a candidate by summing D_t(i) over its wrong rows. This is weighted error ε_t, not the unweighted fraction of wrong rows. With six initial weights 1/6, the first selected stump misses only the row at x=4, giving ε₁=1/6. The saved stump's branch and signed leaves are the actual classifier, while the mass row explains its fitting inputs. The displayed stage distinguishes the masses available before a fit from the updated masses produced afterward.

### Work the first update by hand

<!-- diagram:D19 -->

AdaBoost gives this stump vote coefficient α₁=½log((1−ε₁)/ε₁)=½log 5≈.804719. For each row, form its unnormalized next mass

u_i=D₁(i)exp(−α₁ y_i h₁(x_i)).

On a correct row, y_i h₁(x_i)=+1, so u_i=(1/6)/√5. On the wrong row it is −1, so u_i=(1/6)√5. Their sum is Z₁=√5/3≈.745356. Divide each u_i by Z₁. The five correct rows receive .1 each and the wrong row .5. The final sum is one. This means half the next distribution's mass lies on the wrong subset; it does not mean half the rows were wrong.

The next weighted fit now listens strongly to x=4. In the retained three-round trace the following errors are .2 and .1875, with coefficients .693147 and .733169. The next distributions are [.0625,.0625,.25,.25,.3125,.0625] and approximately [.166667,.166667,.153846,.153846,.192308,.166667]. They remain distributions over the same six identities. Changing a fixture or stepping the declared round limit recomputes the entire current trace; a training-stage view must never show old weights beside a new stump.

<!-- diagram:D20 -->

Inference needs the saved stumps and their α values. At a new query, evaluate each branch, multiply the returned sign by its α, then add to obtain F(x)=Σ_t α_t h_t(x). This retained `signed-adaboost` route predicts +1 for F≥0 and −1 for F<0: an exact zero vote chooses +1, matching its original program and helper, including a no-vote state. At queries [.5,2.5,4.5], the retained three-round rule predicts [−1,+1,−1]. No training distribution D_t enters this inference graph. Row weights teach a member; vote weights combine saved member outputs. Interchanging those arrays confuses two different fits and shapes.

The complete retained `signed-adaboost` program writes exhaustive weighted-stump scoring, the update and saved inference. Its finite traces remain unchanged. [Gradient-Boosted Trees §1](/learn/topic/gradient-boosted-trees-xgboost-lightgbm-catboost#1-predict-with-a-sequence-of-corrections) connects a different sequential correction mechanism, and [its loss discussion](/learn/topic/gradient-boosted-trees-xgboost-lightgbm-catboost#3-change-the-loss-without-changing-the-question) explains why a changed loss changes the fitting signal. Signed AdaBoost's exact exponential update is derived locally next; it is not the same tree engine as squared-residual or Newton boosting.

## 6. Derive the vote and its limits

### Why this logarithm appears

<!-- diagram:D21 -->

Keep the current distribution D and a fixed signed stump h. Giving that stump coefficient α multiplies correct mass 1−ε by e⁻ᵅ and wrong mass ε by eᵅ. The sum is

Z(α)=(1−ε)e⁻ᵅ+εeᵅ.

Differentiate: Z′=−(1−ε)e⁻ᵅ+εeᵅ. At a finite minimum, εeᵅ=(1−ε)e⁻ᵅ, so e²ᵅ=(1−ε)/ε and α*=½log((1−ε)/ε). The second derivative is Z itself, positive in the nondegenerate case. The curve shows these correct and wrong contributions and their sum before the derivative formula. Change α or ε to see which mass the candidate step increases or decreases.

At α*, Z*=2√(ε(1−ε)). For 0<ε<.5, α*>0 and Z*<1. At ε=.5, the optimum coefficient is zero and there is no positive edge. At ε=0, there is no finite minimizing α; a perfect member can dominate the earlier finite votes under the explicitly declared stopping policy. Clipping ε to a small positive number is a numerical convention, not this mathematical optimum. The original NumPy comparison uses clipping for its own finite implementation; the new signed sweep instead records a perfect dominating member separately. If a permitted hypothesis has error above .5, reversing its sign gives error 1−ε; our search checks both polarities.

The **exponential training loss** is L_t=(1/n)Σ_i exp(−y_i F_t(x_i)). At round t, D_t is proportional to those current exponential terms. Adding α_t h_t changes L_{t−1} by the weighted factor Z_t, giving L_t=L_{t−1}Z_t and, from F₀=0, L_T=Π_t Z_t. This identifies the normalizer's meaning beyond “make the weights sum one.” [Duchi's boosting notes](https://cs229.stanford.edu/extra-notes/boosting.pdf) derive the same coordinate-wise exponential objective and show how to implement stump search.

<!-- diagram:D22 -->

A training mistake has y_i F_T(x_i)≤0, so 1[wrong]≤exp(−y_i F_T(x_i)). Average and substitute the product to get training error≤Π_t 2√(ε_t(1−ε_t)). Writing the round's edge γ_t=.5−ε_t gives Z_t=√(1−4γ_t²)≤exp(−2γ_t²), hence training error≤exp(−2Σ_t γ_t²). If a fixed γ>0 lower-bounds every round's edge, this becomes exp(−2Tγ²). Errors merely remaining below .5 do not supply such a uniform γ: edges can shrink so that their squared sum grows slowly or stays bounded. None of these training bounds gives the same bound on future error.

A learning-rate factor ν∈(0,1] uses α=να* and changes the actual normalizer to (1−ε)e⁻ᵛᵅ*+εeᵛᵅ*. It no longer equals the optimal 2√(ε(1−ε)) unless ν=1. Shrinkage changes the path and may need more rounds; it is a hyperparameter to choose without test outcomes, not an algebraic guarantee of improved generalization. Label noise or a restricted weak learner can also frustrate the assumptions behind a sustained edge.

<!-- diagram:D23 -->

The **normalized margin** of training row i is m_i=y_i F_T(x_i)/Σ_t α_t when that denominator is positive. It lies in [−1,1] for positive signed-vote coefficients. A positive margin supports the correct class; its magnitude measures how much signed voting mass supports that choice. The cumulative margin curve at θ counts the fraction of rows with m_i≤θ. It displays the actual finite row margins for the selected retained trace, with shared labels where values coincide. With no positive vote mass the normalized margin is unavailable, not an all-zero distribution fabricated by division.

[Schapire's Explaining AdaBoost](https://www.schapire.net/papers/explaining-adaboost.pdf) uses margin distributions to expose changes after training error has already reached zero. Its historical curves are those experiments' observations; our picture uses this lesson's own saved finite trace. Generalization arguments require data and weak-hypothesis complexity assumptions as well as margins. A larger minimum margin or more rounds alone is not a universal criterion for choosing a future rule.

### Search the same weighted stump more efficiently

New `ensemble-stump-sweep.py` keeps a separate eight-row constructed fixture x=[−2,−1,0,0,1,2,3,4], y=[−1,−1,+1,−1,+1,+1,−1,+1]. This N7 implementation deliberately uses a different inference tie: +1 for F>0 and −1 for F≤0, so an exact zero or no-vote state chooses −1. It does not change §5/D20's retained zero→+1 rule; identify the implementation before comparing boundary predictions. The repeated x=0 rows have different labels, so an implementation cannot split them by moving a threshold between identical values. Sort each feature once with a stable row order and identify the ends of equal-value blocks. Candidate thresholds lie in distinct-value gaps, together with exterior choices representing constant signed predictions.

Maintain cumulative positive and negative mass on the left. For polarity +1, wrong mass is positive-left plus negative-right. For polarity −1 it is negative-left plus positive-right. Moving past one whole block updates these totals, so a feature's candidates can be scored in O(n) after sorting. With d features, sorting costs O(dn log n); each later round's sweep costs O(dn). The cache binds feature values, row identities and label convention. Changing only the masses can reuse it; changing its bound training context requires rebuilding it. Feature, threshold and polarity supply deterministic tie ordering, with tiny floating-sum comparisons identified separately from an exact real-arithmetic equality.

The program compares every selected round's achieved weighted minimum with an exhaustive oracle over those same threshold/polarity candidates. It updates log weights using log-sum-exp so a large finite vote does not require multiplying raw exponentials into overflow. The five new errors are [.25,.25,1/3,.375,.3], with signed α approximately [.549306,.549306,.346574,.255413,.423649]. The loss is retained as a log quantity; it is not relabeled as test performance. The changed query output contains each stump's signed contribution, their sum and the final tie policy. Its separate perfect and no-edge fixtures exercise both stopping boundaries.

### Binary signed votes and the ordinary library route

In the inspected scikit-learn 1.9.1 `AdaBoostClassifier`, discrete SAMME stores α_API=log((1−ε)/ε)+log(K−1). At K=2 that is twice our signed coefficient. Scaling all signed coefficients by two leaves a hard-vote sign unchanged, but the API's decision-function normalization and probability mapping are distinct operations. Tree threshold equality, leaf-label ties and perfect-estimator stopping are also explicit library conventions. On the new fixture, ordinary five-round errors match the signed errors, while the query at the selected threshold 2.5 gives a different class under the library tree's branch convention. We retain that difference instead of claiming arbitrary-query parity from matching round errors.

The original `api-conventions` program reports the retained three-round library weights [1.609438,1.386294,1.466337], twice the signed values. The original complete `full-numpy-comparison` is a separate 300-row circles experiment: its 225/75 split, 50 depth-three hard-vote bags and 50 clipped-error stump boosts report .7600 and .9333 accuracy on that one test. A hard aggregation of tree classes differs from averaging current tree probability vectors. These stored outputs are preserved observations, not an instruction to rerun the fits or a claim that boosting will generally beat bagging.

Explain why α depends on weighted error rather than raw wrong-row count. Apply one multiply/sum/divide update to a changed ε and keep its before/after distributions distinct. Diagnose a promised rapid training bound when every edge is positive but tends toward zero. The next section changes the way the combining rule is learned: it needs a matrix of member predictions made without fitting each row's target.

## 7. Teach a combiner with unseen-row predictions

An equal mean chooses weights in advance. **Stacking** fits a second model, often called the meta learner, using base outputs as its inputs. The danger is immediate: a base can look excellent on rows whose targets it already fitted. A combiner trained on those in-sample outputs learns from an unrealistically favorable picture of its members.

<!-- diagram:D24 -->

Our six A–F observations now produce a row-by-member matrix P. The two columns are a one-nearest-neighbor regression forecast and a line forecast. The completed **out-of-fold**, or OOF, matrix is

| Row | Target | Neighbor OOF | Line OOF |
| --- | ---: | ---: | ---: |
| A | 1 | 2 | −.35 |
| B | 2 | 1 | 2 |
| C | 2 | 2 | 4 |
| D | 6 | 2 | 4.75 |
| E | 7 | 6 | 6.5 |
| F | 8 | 7 | 8.8 |

The target is beside the row to teach the combiner. It was unavailable to the base fit that generated that row's two cells. The drawing exposes the complete matrix before we trace its construction; a trace's incomplete state must not replace the independent completed result.

<!-- diagram:D25 -->

Hold out A and D together. Fit fresh base copies only on B,C,E,F. Then read A's feature to obtain [2,−.35] and D's feature to obtain [2,4.75]. Write these forecasts into their original row positions. Repeat with held pairs B/E and C/F. Every row must receive one prediction from each base, and every prediction must have a fit that excluded that row's target. A row identity is not lost when fit order or held order changes. The construction trace can show zero, one, two or all three completed folds; its unavailable cells remain visibly unavailable.

<!-- diagram:D26 -->

Fit the convex two-member weight using the completed honest P and the corresponding targets. The retained program gets neighbor weight ≈.228273. If we instead ask a full-data one-neighbor model to predict its own training features, it returns the targets [1,2,2,6,7,8]. That leaked column has zero fitted error, and the weight fit chooses it alone: weight 1. It has seen precisely the answers it is supposed to forecast. Compare the two provenance modes, rather than interpreting the leaked weight as evidence that neighbors are universally best.

<!-- diagram:D27 -->

After fitting the combiner, refit each base on all six available training rows. Preserve the already learned weight. At the new query x=2.5, the saved full neighbor returns 2 under its declared tie convention and the full line returns 13/3. The complete rule computes .228273×2+(1−.228273)×13/3≈3.800695. This is a saved inference route; neither the query's eventual target nor the partially built OOF trace is an input.

The retained `manual-oof` program contains all fold cloning, coverage checks, weight fitting, full-data refits and query inference. Its changed observed outcomes [1.5,4,7.5] yield stack MSE .055445 versus nearest MSE 1.5 on those three worked rows. That small check explains the mechanism. It is not a broad statistical guarantee. OOF members trained on fewer rows can have a different prediction distribution from the full-refit members, so the weight's transfer to refitted bases is an explicit assumption to assess.

<!-- diagram:D28 -->

The general matrix editor extends the same combining problem beyond two members. Every row supplies B member forecasts and one target. The picture multiplies each row's B entries by the current learned coefficient vector, sums the products, forms that row's residual and sends its derivative contribution back to the B coefficients. Choose simplex, nonnegative-only or unrestricted coefficients and a ridge strength. P=[[1,2,4],[3,2,1],[2,5,0]], y=[2,1,3], λ=.2 starts the view; arbitrary finite edited rows and member columns remain supported in its declared domains. A different constraint produces a different fitted rule and does not inherit another constraint's forecast interval guarantee.

New `ensemble-oof-state.py` exposes an ensemble's row orchestration. `build_oof` accepts named base prototypes and explicit fit/held indices, validates exactly-once coverage before fitting, clones the entire estimator for every fold, builds named typed columns, and records fit and held IDs. Learned preprocessing belongs inside each cloned pipeline. `full_refit_state` separately creates bases trained on all legal training rows. `full_refit_columns` reads those saved bases for new features and checks the resulting meta-column order; it accepts no targets.

The binary meta learner uses a logistic score rather than a convex probability mean. For P with B probability columns, D=[1,P] has B+1 columns including the intercept. Its score is z=Dθ and its class-1 probability is σ(z)=1/(1+e⁻ᶻ), evaluated with a stable positive/negative-score branch. A slope's units are score per unit of its named meta-feature. Coefficients can be negative and need not sum to one.

We reuse the exact guarded `newton-logistic.py` from the published Linear & Logistic Regression code; importing its functions does not execute its old main. The local objective is mean(logaddexp(0,(1−2y)z))+λ||θ_slopes||²/2, with an unpenalized intercept. If p=σ(Dθ), its gradient is Dᵀ(p−y)/n plus the slope penalty, and its Hessian is Dᵀdiag(p(1−p))D/n plus the same penalty diagonal. Damped Newton steps solve the curvature system and reduce the objective with a checked line search. It returns only when the gradient infinity norm meets tolerance. Complete code, exact dependency identity and setup are in the common file index.

On the new 24-row constructed binary fixture, the fitted meta coefficients are printed together with actual OOF rows, coverage, fold audit, derivatives and saved query outputs. The ordinary `StackingClassifier` route uses the same base pipelines and explicit folds, with L2 logistic C=1/(nλ), matching the mean-loss penalty scaling. Its probability difference is about 1.14e−10 in this execution. This is a binary optimizer comparison. Multiclass final-estimator fitting remains the ordinary library route rather than pretending that this binary Newton routine handles a multiclass softmax.

[Breiman's Stacked Regressions](https://statistics.berkeley.edu/sites/default/files/tech-reports/367.pdf) explains honest level-one predictions and nonnegative coefficient fitting. Its principal NNLS recipe does not require sum one; its later simplex analysis has that additional constraint. **Stacked generalization** is attributed to [Wolpert](https://doi.org/10.1016/S0893-6080(05)80023-1); the inspected Breiman, ESL and API material supplies the concrete algorithm used here, without attributing an unread theorem to the publisher abstract.

Explain why a target may teach the combiner while being forbidden to the base that produced that same row's input. Apply the saved full-state route to a changed query. Diagnose an OOF matrix assembled from full-data predictions: row coverage alone can be perfect while provenance is wrong.

## 8. Use the actual library contract

<!-- diagram:D29 -->

The final estimator's inputs are columns with meanings, not just a mysterious rectangular array. In binary probability stacking, each member's two class probabilities sum to one. Keeping both alongside a meta intercept creates redundant information, so inspected `StackingClassifier` drops the first binary probability column. Three such bases yield three class-1 columns. In multiclass probability stacking, all K class columns are retained per member. With two three-class bases, the new fixture gives six probability columns; passthrough adds its two raw features for eight total.

The API's `stack_method='auto'` tries `predict_proba`, then `decision_function`, then `predict`. A margin classifier can therefore contribute a signed decision score beside another member's probability. The selected column names in the mixed fixture are `line:P(class=1)`, `margin:margin(toward class=1)`, and two explicitly named raw feature columns. That margin is not a probability. A hard predicted label is yet another possible output; our orchestration encodes it using the declared class-index mapping and names the resulting type. Class permutations are aligned by identity throughout.

A multiclass margin column also needs a declared meaning. [SVC's output contract](https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html) specifies that `decision_function_shape='ovr'` returns one score per class; `'ovo'` returns one score per class pair. With K=3, both have three columns because K(K−1)/2=3. Equal width therefore cannot justify naming pair scores as class scores. Our typed-column route rejects explicitly declared multiclass OVO outputs, including a pipeline's final estimator, rather than inventing a pair-to-class mapping. Supported per-class outputs are reordered by `classes_`; binary scores keep their sign toward the named second class. A missing class still fails explicitly. A custom estimator must supply a genuine per-class contract before using that alignment; shape alone is not a semantic guarantee.

`passthrough=True` gives raw features to the final estimator in addition to base outputs. That permits the meta learner to learn effects beyond a pure rule on member predictions. It increases the input dimension and fitting work. It does not automatically give a linear meta learner context-dependent slopes; §12 derives the product features required for that.

In the ordinary API, `fit` generates the internal OOF predictions used for final-estimator training and also fits bases on all supplied training rows. `transform(X)` subsequently reads those full-fit bases. It does not return the earlier OOF matrix. In the new binary fixture, full-fit transform and saved OOF entries differ by as much as .208007457. Store the OOF matrix separately when you need its provenance; do not rebuild it by calling transform on the training features. The old `api-conventions` program's 8-by-2 transform is likewise the full-refit object, not its hidden meta-training matrix.

Integer or absent CV uses the API's default non-shuffled fold setup; an explicitly shuffled splitter declares a different construction. CV here builds predictions for the final estimator. It is not outer performance assessment of the whole selection-and-fitting workflow. `cv='prefit'` is another distinct path: the supplied bases remain fitted, and the final estimator trains on their predictions for the supplied rows, without OOF generation. §9 uses it legitimately with separate meta rows.

### Learned preprocessing is part of the fold

<!-- diagram:D30 -->

A learned scaler stores training means and scales. If we fit it globally before generating OOF columns, each held row has entered those learned statistics, even if the later base coefficients exclude its target. The legal route clones and fits the scaler inside the same base fold, then applies its saved statistics to held features. A fixed, externally defined conversion such as hours to minutes learns nothing from these rows and has different permissions. The diagram keeps those two operations visibly separate.

### Deeper: a held row can leak through a chosen setting

<!-- diagram:D31 -->

Excluding a held row from coefficient fitting is insufficient if its target helped choose the hyperparameter used by that fit. A globally chosen neighbor count, regularization strength or feature set can carry that target's information into every apparently held-out prediction. Trace both arrows: coefficient-fit rows and setting-selection labels. In the small named illustration, predicting A legally requires the entire base choice-and-fit procedure to use only its permitted B,C,E,F subset.

New `ensemble-nested-selection.py` works the full distinction on a separate twelve-row regression construction. Outer three-fold splits with seed 107 reserve assessment rows. Inside each outer fit, three OOF folds with seed 109 generate the meta matrix. Each OOF base's ridge strength is selected from [.1,1] with two inner folds, seed 113, using only that base fit's allowed rows. The line is the second base; Ridge(alpha=1) is the final estimator. Every search logs label access separately from each coefficient fit and selected refit. Assertions check both against the OOF held IDs and outer assessment IDs.

The ordinary route places `GridSearchCV(Pipeline(StandardScaler,Ridge))` inside the stack's base list. The stack clones that search inside each OOF fit; `cross_validate` surrounds the entire stack with the outer folds. Manual and ordinary outer MSEs are [.027461059,.031784566,.052058248] in this declared execution, with zero difference. One inner OOF choice selects α=1 while the others select .1; the source prints all choices rather than hiding this variation. A separately labeled global search selects .1 using all twelve labels, and its access audit rejects that setting as honest outer evidence. It contributes to none of the reported outer scores.

This is **nested selection**: an assessment boundary encloses the complete procedure we would fit and serve, including internal setting selection. Selecting among many settings on one criterion can overfit that criterion; [Cawley & Talbot](https://jmlr.org/papers/v11/cawley10a.html) studies that problem, and the [official nested-CV example](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html) shows the enclosing evaluation structure. Our twelve constructed rows demonstrate ownership and matched operations, not a statistical superiority claim.

A separate multiclass idea, **error-correcting output codes**, trains binary tasks defined by a class-code matrix and decodes their outputs into an original class. Those binary columns refer to different groupings of classes; they are not several aligned forecasts of one shared class vector. [ESL §16.1](https://hastie.su.domains/ElemStatLearn/) introduces that contrast. Full code-matrix design belongs with multiclass/multi-label learning rather than silently entering this stack's probability columns.

## 9. Preserve groups and time

Random row folds assume the intended assessment units can be separated that way. If several rows belong to one person, machine or other entity, holding out one row while fitting on a sibling can reveal entity-specific information. If predictions will be made in the future, a fit on later outcomes can be impossible at the intended prediction time. The row permissions must describe the actual task.

<!-- diagram:D32 -->

For twelve time-ordered rows, the retained expanding-window construction fits rows 0–2 to predict 3–5, then 0–5 to predict 6–8, then 0–8 to predict 9–11. The initial prefix 0–2 has no earlier training history under this protocol and remains uncovered. The selected prediction origin and label-delay control further test availability: a feature time before an origin does not make its later outcome known. A label with availability time after the fit origin cannot be used. Delaying labels can remove otherwise tempting rows from a fit.

<!-- diagram:D33 -->

The separate six-group construction has two rows per entity. A held group excludes both rows from every base's fit and setting search. Inspect a group and follow the two identities through the mask. A row-wise split that leaves its sibling in training breaks the new-entity assessment boundary, even if every individual row has one nominal held prediction. Depending on the deployment task, time and groups can require a combined split rather than one of these simple illustrations.

<!-- diagram:D34 -->

`cross_val_predict` requires held indices to form a partition: concatenating the held lists must include every input row exactly once. Standard expanding windows leave the earliest prefix absent, so passing those splits into a partition-based stacking API is not a way to obtain valid full OOF coverage. Write an explicit forward loop, retain its eligibility mask, and fit a combiner on covered legal rows only. The retained `forward-group-oof` program does that with visible prefix omissions and separate group-safe coverage; its reported next forward forecast is 6.546651 under its declared construction.

### Blending keeps a different set of fitted bases

<!-- diagram:D35 -->

A disjoint **holdout blend** reserves separate base-fit and meta-fit rows. Fit the bases on the first block, read their predictions on the meta block, then fit the combiner there. Save those same bases for inference. Unlike OOF stacking, no training row is recycled into a later full-data base refit. Refitting those bases on the union changes the workflow and the distribution of its meta inputs; it needs a new declared comparison rather than a silent upgrade of the old measured blend.

New `ensemble-blend-calibrate.py` makes every role concrete on 96 constructed rows: 36 base-fit, 24 meta-fit, 12 calibration and 24 evaluation. Both classes occur in each disjoint role. A scaled logistic and GaussianNB are the two reused base primitives. The binary meta objective uses slope penalty .1, while the ordinary prefit stack uses C=1/(24×.1). It reads the already fitted bases on the separate meta rows and agrees with the scratch meta route on its saved query probabilities. The printed ownership IDs stay with this 36-row base state.

Calibration fits another function of the frozen whole rule's score, so it gets a separate set of rows. A base being frozen does not make its calibration targets harmless for later assessment. Likewise, choosing an action threshold uses outcomes and requires a choice boundary distinct from final evaluation. We will compute both probability quality and decisions next.

## 10. Inspect probabilities and real fitted rules

A calibrated probability .7 means that among events receiving that forecast, the event occurs with frequency .7 under the distribution being discussed. A probability is not calibrated merely because it lies in [0,1] or was returned by a method named `predict_proba`. Finite grouped observations can provide evidence about calibration, with sampling uncertainty; an exact constructed probability law can demonstrate a counterexample without estimating anything.

<!-- diagram:D36 -->

Consider four equally likely signal states. Member A and B give forecasts (.25,.25),(.25,.75),(.75,.25),(.75,.75). Their true conditional event probabilities are respectively 0,.5,.5,1. A's .25 forecast groups the first two states: their mean event chance is .25. Its .75 forecast groups the last two and has mean chance .75. B has the corresponding same property. Each member is calibrated in this exact law.

Their equal average instead groups states by forecasts .25,.5,.75. The .25 group has actual chance 0, the .5 group actual chance .5, and the .75 group actual chance 1. The mean is not calibrated. The grouped mass picture shows which states contribute to each forecast before this calculation; “equally likely” is probability mass, not a claim about four observed patients or shipments. In the retained `calibrated-average` program, each member's expected Brier risk is 3/16=.1875, while the mean's is 5/32=.15625. Improved proper-score risk and calibration are distinct properties.

Squared-error convexity still bounds a convex average's loss by the weighted member loss. For class probability vectors, convexity of −log p_true also gives −log(Σ_b w_b p_b,true)≤Σ_b w_b(−log p_b,true) when the true-class probabilities are positive. Neither statement implies calibration or superiority to the best member. Extreme wrong forecasts can have a large log loss even if their hard accuracy looks respectable.

<!-- diagram:D37 -->

The retained circles map shows five actual saved grids: line, tree, neighbor, soft mean and stack. All use the same x₁/x₂ coordinates, fixed class-1 color scale 0,.25,.5,.75,1 and 72 held-out marks. Hollow marks identify class 0, filled marks class 1, and the query cross marks the selected grid coordinate. Choose a model and an x/y index; the displayed number is the saved probability at that observed cell. The 25-by-25 grid has 625 probabilities per model,3125 total. It is not a continuously callable saved estimator: that historical asset contains grid observations and test marks, not complete fitted base state. A between-grid slider or retraining control would fabricate a capability the evidence does not support.

The map can reveal disagreements and extreme regions, but a view of the selected grid cell does not become an out-of-sample performance estimate. Read the retained validation/test results beside it. The common magnitude scale permits comparison between models; independently normalizing each panel's colors would hide that probability meaning. The new WDBC bundle in §11 supplies the distinct complete state needed for genuine arbitrary query computation.

### Fit a calibration function to the whole frozen rule

New `ensemble-blend-calibrate.py` takes the actual binary blend's saved score s on its twelve separate calibration rows. The scratch calibrator forms D=[1,s], score z=Dθ, probability σ(z), and minimizes mean hard-label log loss plus .01||θ||²/2. Here both the intercept and slope are penalized, unlike the meta learner's free intercept. The gradient is Dᵀ(p−y)/n+.01θ; the Hessian is Dᵀdiag(p(1−p))D/n+.01I. Its written Newton and damping operations return coefficients, objective, derivatives and stopping residual. A separate SciPy optimizer checks that same objective.

The ordinary public route is `CalibratedClassifierCV(FrozenEstimator(rule), method='sigmoid')` fitted on the calibration block. In inspected 1.9.1 it prefers the whole rule's `decision_function` when available, uses smoothed targets n₊+1 over n₊+2 for positives and 1/(n₋+2) for negatives, and fits its own unpenalized sigmoid convention σ(−(a s+b)). It is therefore not solving our hard-label ridge objective. The program prints both conventions and both actual coefficient sets rather than treating their expected difference as a hidden parity failure.

On the untouched 24-row constructed evaluation block, uncalibrated blend Brier/log loss are approximately .126188/.430598; scratch calibration gives .069600/.218131; the ordinary smoothed-target sigmoid gives .071600/.263518. Four fixed probability bins retain counts, mean forecast and observed event fraction; empty bins remain empty. These are outcomes of this fixed construction, not a guarantee that either calibration will improve a future distribution. Complete forecasts are visible in the saved program output.

<!-- diagram:D38 -->

A decision threshold is another operation. In the small score list p=[.1,.3,.3,.9], y=[0,1,0,1], act positive when p≥t. At t=.3 both equal .3 forecasts are positive: one is a true positive and the other a false positive. At t just above .3, both become negative, introducing a false negative instead. With false-positive cost 1 and chosen false-negative cost c_FN, compute FP+c_FN×FN. The two controls change threshold and the illustrative cost while the confusion counts and total follow the actual decisions. They do not refit or calibrate a probability function.

[Linear & Logistic Regression §7](/learn/topic/linear-logistic-regression#7-choose-a-decision-without-refitting-the-score) develops the distinction between a score and an action. Choose thresholds on choice data and assess the frozen choice later. A calibrator has fitted parameters and its own fit rows; a threshold has a selection criterion and choice rows. Neither can borrow final test labels merely because the base model is already fixed.

## 11. Run a complete comparison

The retained complete circles comparison has 360 observations split 216/72/72 into training, validation and test. It declares line, tree and neighbor bases, equal soft voting, a stack and a prior baseline. Validation selects neighbor by log loss .133590, ahead of stack .143809. On test, neighbor log loss is .181329 versus stack .198805, while stack's Brier .055232 is below neighbor's .056927. Different losses measure different aspects of the same forecasts. The tree's .875 test accuracy coexists with log loss 2.227753; confident errors can matter strongly to probability loss.

Its cost-selected threshold is .555556, test confusion [[31,5],[0,36]] and cost 5. The complete retained `held-out-comparison` program and all candidate output lines stay accessible. The independently declared changed `changed-protocol` program uses seed 83, noise .20 and omits the tree. It still selects neighbor by validation (.271679 versus stack .301336), but test log loss reverses sharply: neighbor 1.243178, stack .329349, soft .462221. Neighbor and stack test accuracy are both .888889. Its selected threshold .333333 gives confusion [[21,15],[1,35]], cost 19. The changed test ranking is not permission to replace the already selected winner and call that same test untouched.

### Count the fitting and serving dependencies

<!-- diagram:D39 -->

For B bases and K ordinary OOF folds, constructing the meta matrix needs B×K base fits, followed by B full-data refits and a final-estimator fit. With unequal folds, a row-work total counts the actual rows each fit receives: each training row appears in K−1 base folds, yielding B n(K−1) fold-training row uses plus Bn full-refit uses. Nested searches add their own fits. The count view changes B,K,n within its declared K≤n domain and distinguishes fit count from row work. It does not convert either count into elapsed seconds.

<!-- diagram:D40 -->

Serving one stack requires every required base output before its meta operation. Under hypothetical member latencies 1,8,15 and meta latency 1, sequential execution is 1+8+15+1=25 units; ideal parallel bases give max(1,8,15)+1=16. The budget comparison uses these declared numbers, not benchmark measurements. Real scheduling, transfer overhead and contention can change the total. A coefficient near zero does not automatically remove a base from the served rule; removal requires an explicitly changed model and evaluation boundary.

### One fixed real-data experiment

The new complete `ensemble-real-comparison.py` uses UCI's 569-row, 30-feature Breast Cancer Wisconsin Diagnostic data. Features describe nuclei in digitized fine-needle-aspirate images; the identifier is not a predictor. Its offline scikit-learn 1.9.1 CSV and attribution/license accompany the program. UCI reports no missing values and [CC BY 4.0](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic). Original labels 0 malignant/1 benign are explicitly inverted so this study's positive class 1 is malignant. Those class meanings are different from the earlier late-delivery and signed fixtures.

Before fitting, the program checks CSV, matrix, transformed-label and exact split identities. Stratified seeds 83/89 give 341 training, 114 validation and 114 test rows. Training has 214 benign/127 malignant; validation 72/42 and test 71/43. These metadata checks establish row/schema roles. They do not fit or select using test outcomes. No known entity/time groups are supplied, so the declared assessment is a fixed random-row split.

Three bases have fixed settings: StandardScaler plus logistic regression C=1; raw GaussianNB with variance smoothing 1e−9; StandardScaler plus uniform 9-neighbor classification using brute search. Scalers learn inside each fit. Three training OOF folds shuffled with seed 97 feed a simplex probability blend minimizing half mean binary Brier plus ridge .01, and a binary logistic meta learner with slope penalty .1. Full-data base refits stay on 341 rows. The holdout blend uses a separate seed 101 base/meta split of those training rows: 204 fit its bases and 137 fit its logistic combiner. It keeps those 204-row bases afterward.

Eight candidates are retained: prior, line, bayes, neighbor, equal soft mean, simplex blend, OOF logistic stack and disjoint logistic blend. There is no real-data hyperparameter search or repeated-seed campaign. Validation selects minimum log loss with a candidate-ID tie rule. Then unique thresholds from {0,validation probabilities,1} minimize FP+4FN, with a tie selecting the smaller threshold and p≥t positive. The rule and threshold are serialized before test predictions and metrics are calculated.

| Candidate | Validation log loss | Test log loss | Test Brier | Test accuracy at .5 |
| --- | ---: | ---: | ---: | ---: |
| Prior | .658144 | .662722 | .234941 | .622807 |
| Line | .116468 | .087961 | .024358 | .982456 |
| Bayes | .657426 | .745263 | .070430 | .921053 |
| Neighbor | .417226 | .723609 | .046134 | .938596 |
| Equal soft | .148025 | .128852 | .037270 | .956140 |
| Simplex | .127435 | .103117 | .028189 | .973684 |
| OOF stack | .288538 | .293699 | .071524 | .947368 |
| Holdout blend | .293417 | .300034 | .074037 | .929825 |

The single line is both strongest member and validation winner. The fitted simplex weights are approximately [.67801544,.11977750,.20220705] for line,bayes,neighbor. OOF logistic parameters are approximately [−1.59510685,.97390151,.85589630,.85293098], and the holdout blend parameters [−1.55497145,.98301349,.82034733,.87598533]. Their intercept/coefficients are scores, not normalized member shares. A slope penalty .1 and the actual fitted input geometry give these relatively restrained probability outputs; the complete Hessians, derivative residuals and all validation/test forecasts are retained for inspecting that fitted behavior. No outcome is hidden to make an ensemble win.

Validation chooses line threshold .29624271447535583 with cost 8. On test it gives confusion [[68,3],[2,41]] and cost 3+4×2=11. The .5 decision has confusion [[71,0],[2,41]]; the threshold's different test cost does not authorize retrospective threshold selection. These are illustrative costs and finite model-comparison outcomes, not an established decision policy for new hospitals or populations.

The test arrays preserve 26 exact-one Gaussian forecasts and 63 exact-zero/28 exact-one neighbor forecasts. For finite log loss, inspected sklearn uses float64 epsilon≈2.22e−16 when clipping probabilities. The saved forecasts themselves remain 0 or 1; clipping identifies how the loss is computed rather than quietly changing the served probability. Actual solver residuals meet their declared tolerances and the execution captured no warnings. The once-run receipt contains all fit IDs, OOF cells/coverage, dependencies, prediction arrays, all 8 confusion matrices and actual changed-query checks. There are no uncertainty intervals or repeated-seed claims from this single split.

<!-- diagram:D41 -->

The saved WDBC query view supports a complete edited 30-feature vector, with a focused feature control below the actual forward picture. A feature name follows its position through the saved scaler and base arrays. Logistic inference subtracts means, divides by scales, forms a weighted score and applies the sigmoid. Gaussian inference forms both class joint log scores with fitted smoothed variances, then normalizes by log-sum-exp. Neighbor inference uses the saved standardized training rows, distance ordering and nine selected original row identities. Their aligned class-1 probabilities enter the selected mean/weight/score-link operation. The selected candidate is visible alongside all eight available saved forwards.

JSON stores the needed arrays and identities; NPZ stores the full prediction evidence. Reload and five queries—including a changed feature, zero vector and ±1e6 vectors—were checked against the actual ordinary saved bases. All three portable base probability differences were zero on those checked queries. The portable neighbor convention sorts squared distance then original row ID; an arbitrary exact distance tie can differ from the library backend, and any such portable forecast is a computed query output rather than a replacement for the original measured library arrays. Restored ordinary Voting/Stacking prediction/transform methods also checked the stored combination contract without additional real-data refits. §7's constructed program separately demonstrates actual ordinary fitting.

Edited feature vectors are computations, not new measured or necessarily plausible specimens. Changing fitted parameters, a base family or preprocessing requires a new complete version and evaluation boundary. The final section examines what context-dependent weights change inside that state.

## 12. Go beyond constant combination weights

### A context column does not automatically change a slope

<!-- diagram:D42 -->

Let p_A,p_B be two forecasts and z∈[0,1] a context value. A desired route is (1−z)p_A+z p_B: at z=0 use A, at z=1 use B. For p_A=.2,p_B=.8,z=.25, its products are .15 and .20 and the sum .35. The drawing exposes those products before the general formula. A linear combiner β₀+β_A p_A+β_B p_B+β_z z has constant slopes β_A and β_B. Adding z changes an additive offset; it does not let those slopes switch with z.

The retained eight-row `context-interactions` example fits plain additive columns and obtains coefficients [0,.5,.5,−0] with MSE .125. Adding the explicitly intended product columns [(1−z)p_A,z p_B] gives coefficients [1,1] and zero fitted residual for that constructed target. At the same [.2,.8] query it produces .2,.8,.35 for z=0,1,.25. This demonstrates representation, not a collected recommendation gain or future guarantee.

New `ensemble-context-gradients.py` supplies a different 12-row construction and a penalized fit. Its design is [1,(1−z)a,z b], with a=(i mod4)/3, b=((2i+1)mod5)/4, z=floor(i/4)/2 and y=.1+.7(1−z)a+1.3z b. Nine named rows fit the rule; three are held for a changed-case check. The objective is half mean squared residual plus .1 times half squared slope norm, with free intercept. Its gradient and Hessian use the design exactly as in §3, with penalty diagonal [0,.1,.1]. Rank-aware least squares makes an unregularized singular system's minimum-norm convention explicit.

The fitted coefficients are approximately [.443800441,.052026707,.528274900], design rank 3, objective .036158803. Analytic gradients and finite-difference checks are printed. Ordinary `PolynomialFeatures` constructs the candidate columns, but we select exactly a−a z and b z rather than silently adding all quadratic terms. `Ridge(alpha=n×.1)` uses the same penalty convention and matches coefficients and query forecasts. The new changed queries produce about .454206,.866420,.557259; they differ from the old exact [1,1] rule because the data and penalized fitting problem differ. They do not overwrite the original eight-row evidence.

More generally, **feature-weighted linear stacking** writes effective member coefficient w_b(x)=Σ_j v_bj c_j(x) for context features c_j. Then the prediction is Σ_bj v_bj c_j(x)f_b(x), linear in fitted parameters v despite products in its inputs. [Sill et al., §2.1](https://arxiv.org/pdf/0911.0460) develops that operation. Its coefficient functions need not be nonnegative or sum to one, so FWLS is not automatically a convex gate or a Bayesian posterior weighting rule. Product columns can become correlated or rank-deficient; ridge stabilizes that fitting problem but does not guarantee extrapolation or honesty. Learned context features must follow the same fold and time permissions as base predictions.

<!-- diagram:D43 -->

A binary score combiner can mix typed inputs too. With probability .8, margin 2 and coefficients [−1,2,.5], its score is −1+2×.8+.5×2=1.6 and sigmoid probability≈.832018. The input margin 2 remains a margin through its multiply, even though the final output is a probability. This is a fixed forward calculation, not a fitted performance result. Learned parameters must correspond to the same ordered columns used during training.

### Keep the entire serving rule together

<!-- diagram:D44 -->

A complete saved bundle includes feature names/order, class names/order, every learned scaler, base coefficients or Gaussian variances or neighbor training rows, typed meta-column order, combiner parameters, output link, chosen threshold and version/source/data identities. The diagram follows those arrays through the actual input ports. A whole-state checksum binds them together. Swapping two feature names while retaining old parameters is a stale schema, even if dimensions still match. The invalid-bundle control fails closed and explains which boundary failed; it does not keep presenting an old measured forecast as if the new schema were valid.

The native loader checks shapes, finite values, positive scales/variances, class/member/meta order and a separately bound feature-schema identity. Reloading correct state restores the same computation. Correcting a stale bundle requires restoring or recomputing the matching full state. Merely refreshing a checksum cannot establish that old arrays fit new feature meanings or inherit old evaluation results. No unsafe pickle is needed for the portable reader.

Context can be useful when recommendation reliability changes with available user/item history, but the context must exist at prediction time. A cold user with no history is different from a warm user; a product feature's explanatory label should state which available quantity it uses. Choosing suitable recommenders and evaluation units belongs to the next topic, Recommender Systems. Similarly, unanimous models can share a wrong assumption; disagreement can flag review candidates without serving as a calibrated uncertainty certificate or a complete active-learning policy.

Sparse ensembles learn a dictionary of functions or rules and penalize combination coefficients, possibly removing unused members from serving. That differs from simply averaging independent pretrained models. [ESL §16.3.1](https://hastie.su.domains/ElemStatLearn/) separates dictionary generation and post-processing; its illustrated test paths are not our selection protocol. Full rule extraction and lasso engines remain with their own model owners. **Bumping** uses resampled fits to search for one model instead of serving a mean, another useful mechanism contrast. **Distillation** fits a student to imitate an ensemble's outputs; limited student features/capacity can prevent replication. Assess a changed sparse or distilled rule against teacher and baseline on an honest new boundary, including probability quality and actual serving work. None promises a fixed accuracy loss or automatic latency win.

## 13. Practise with changed data

Work from each changed input before opening its hint or explained solution. These sixteen tasks preserve the original A–L routes and add four transfers. The full program index supplies complete code and saved stdout beside the relevant explanation; the last reporting task uses its retained independently declared reference run.

### A. A weighted vote and its tie

**Question.** Three aligned class-1 probabilities are .8,.4,.3 with relative member weights 1,1,2. Calculate hard-vote share, mean probability and decisions. Then change A to .9.

**Hint.** Normalize by total 4. An exact final tie chooses class 0.

**Explained solution.** Only A votes 1, so the weighted hard share is 1/4 and the hard decision 0. The soft mean is (.8+.4+2×.3)/4=.45, also class 0. Changing A to .9 gives .475 without changing the hard ballot. A soft tie would require A=1: (1+.4+.6)/4=.5, still class 0 under the declared tie. The observed target has not been supplied, so none of these decisions establishes correctness.

### B. Fit a changed cancellation weight

**Question.** A has residuals [−2,2] hours and B[1,1] on two permitted combination rows. Find the best convex A weight and combined MSE. Would adding B help an A with residuals [0,0]?

**Hint.** The combined residuals are 1−3w and 1+w.

**Explained solution.** Their mean square is [(1−3w)²+(1+w)²]/2=1−2w+5w². Derivative−2+10w vanishes at w=.2, inside [0,1]. Residuals are [.4,1.2], MSE .8 hours²; member MSEs are 4 and 1. If A is exact, w=1 gives zero. Forcing an equal mean with B creates .25 hours² loss. The identity bounds the weighted member average, not the best member; fitted weights still need untouched assessment.

### C. Separate correlation and copying

**Question.** At a fixed query, four random fitted forecasts each have variance 9 and every pair correlation 1/3. Find average variance. Could their common correlation instead be−.5?

**Hint.** Count 4 variance terms and 12 ordered covariance terms.

**Explained solution.** Average variance is 9[1/3+(2/3)/4]=4.5. Correlation−.5 would give 9[−.5+1.5/4]=−1.125, impossible. For B=4 the lower common-correlation bound is−1/3. This concerns a joint law over repeated fitting experiments, not a prediction correlation measured across unrelated test inputs.

### D. A smaller bag and missing votes

**Question.** Five original rows are sampled with replacement using three draws per bag. Find one named row's absence probability, expected distinct count and probability neither of two independent bags can supply its OOB forecast.

**Hint.** First compute q=(4/5)³; a bag is ineligible when it contains the row.

**Explained solution.** q=64/125=.512. Expected distinct count is 5(1−q)=61/25=2.44. No eligible bag has probability(1−q)²=(61/125)²=3721/15625=.238144. In that state OOB prediction is unavailable. Replacing it with the all-model fitted prediction changes the evaluated quantity and permissions.

### E. Update different weak errors

**Question.** Compute signed AdaBoost α for ε=.3 and .45. After each optimal normalized update, what mass lies on this stump's wrong rows? What happens at .5 and 0?

**Hint.** Wrong mass is εeᵅ/Z, with Z=2√(ε(1−ε)).

**Explained solution.** Coefficients are ½log(7/3)≈.423649 and ½log(11/9)≈.100335. Substitution gives wrong mass .5 in either nondegenerate case. It is half the distribution's mass, not half the rows or the accumulated ensemble's error. At .5 the coefficient is zero, with no positive edge. At zero no finite minimizing α exists; use the declared perfect-member stopping policy instead of disguising clipping as an exact optimum.

### F. A bound with shrinking edges

**Question.** Accepted rounds have γ_t=1/[4(t+1)] for t≥1. Does the derived bound guarantee uniform exponential decrease to zero?

**Hint.** The exponent is−2Σγ_t².

**Explained solution.** Every edge is positive but no positive constant lower-bounds them all. Σγ_t²=(1/16)Σ_{t≥1}1/(t+1)² is finite, so exp(−2Σγ_t²) tends to a positive value. This upper bound therefore does not establish convergence to zero. That absence of a guarantee is not proof that actual training error fails to improve.

### G. Repair an OOF row

**Question.** Eight rows have held folds{A,C},{B,D},{E,G},{F,H}. A base predicts A after fitting A,B,D,E,F,G,H. What is wrong, which rows are legal, and what is the completed matrix shape for three scalar-output bases?

**Hint.** Exclude every destination of the held fold.

**Explained solution.** A's target entered its own prediction. The fold's legal fit rows are B,D,E,F,G,H, excluding both A and C. Predict both held rows with those freshly fitted bases. The completed matrix is 8×3, not 6×3. Fit the combiner on all completed rows and corresponding targets, then refit bases on all 8 training rows for serving. Subsequent full-refit `transform` values are not the saved OOF matrix.

### H. Time and entity ownership

**Question.** A machine contributes hourly rows; the task is a previously unseen machine next month. A shuffled row split holds some hours from every machine, and a globally fitted scaler precedes stacking. Identify the problems and propose an assessment boundary.

**Hint.** Separate entity, time and preprocessing permissions.

**Explained solution.** Sibling machine information crosses fit/test, later times can influence earlier fits, and the scaler learns from evaluation features. Reserve later observations from machines absent from training as the outer test. Inside outer training, generate meta predictions respecting the corresponding entity/time/label-availability restrictions and fit preprocessing only within each permitted fit. Early rows without legal predictions remain masked out of meta fitting. The exact policy must match how new machines arrive; GroupKFold alone does not enforce chronology.

### I. Calibration is not preserved by an average

**Question.** In the fair-signal law, condition on mean forecast .75 and .5. What are the event rates? Why can the mean nevertheless have lower Brier risk?

**Hint.** List signal pairs producing the same forecast.

**Explained solution.** Mean .75 occurs only when both high signals occur, with true rate 1. Mean .5 occurs in the two cross-signal states, each with true rate .5. The .75 group is uncalibrated. The pointwise squared-loss identity still reduces loss relative to average member loss, and averaging over the exact law gives mean risk 5/32 versus member 3/16. Calibration and this proper-risk comparison answer different questions.

### J. Make context affect a slope

**Question.** For A=4,B=10,z=.3, calculate(1−z)A+zB. Can β₀+β_A A+β_B B+γz express that target for every A,B,z?

**Hint.** Compare A's required coefficient at z=0 and 1.

**Explained solution.** .7×4+.3×10=5.8. No fixed β_A can equal 1 at z=0 and 0 at z=1 for every A. Product features or suitable nonlinear structure are needed. Approximate fit on a correlated sample does not establish the all-input relation; changed rows expose the difference.

### K. Account for training and serving

**Question.** Four bases, five folds and 1000 rows: count base fits, rows per fold fit and row processing under linear fit cost. Member serving times are 3,8,2,5 ms, meta 1 ms. Give ideal sequential and parallel totals.

**Hint.** Include fold fits and final full-data refits.

**Explained solution.** 20 fold fits plus 4 full-data fits; each fold fit receives 800 rows. Row work is 20×800+4×1000=20000, plus meta fitting. Sequential serving totals 3+8+2+5+1=19 ms; ideal parallel branches plus meta max(3,8,2,5)+1=9 ms. The served collection has 4 bases and 1 meta learner, not 20 fold models. Actual overhead, batching, contention and tail latency require separate measurement.

### L. Complete a changed experimental report

**Question.** Run the complete comparison with seed 83, noise .20 and tree omitted from both ensemble candidates. Keep declared split, validation selection and cost rules. Report baselines, selected rule, test losses and action cost; explain the limits.

**Hint.** Validation chooses first. A surprising test ranking does not create permission to choose another winner.

**Explained solution.** The complete `changed-protocol` source and its retained output are supplied. It selects neighbor by validation log loss .271679 versus stack .301336. Test losses are neighbor 1.243178, stack .329349, equal soft .462221 and prior .693147. Neighbor and stack both have test accuracy .888889, so different confidence errors explain why hard accuracy alone misses this reversal. Threshold .333333 gives confusion [[21,15],[1,35]], cost 15+4×1=19. All line and ensemble candidate outputs remain in the complete reference run rather than only the highlighted comparison.

A finite validation winner can lose on a finite test. That does not establish universal stack superiority, invalidate the test or prove calibration. Retain the result, inspect the confidently wrong cases and declare a new valid boundary for additional model choices. State changed costs or split policy before observing the new test outcomes.

### M. Align named classes

**Question.** A member returns class order [silver,amber,blue] and probabilities [.1,.6,.3]. The combiner expects [amber,blue,silver]. What vector should enter it, and what goes wrong if positions are simply added?

**Hint.** Follow each event's name through the permutation.

**Explained solution.** The aligned vector is [.6,.3,.1]. Amber receives its .6 even though its new column is first. Adding [.1,.6,.3] by position would call silver mass amber, amber mass blue and blue mass silver. A valid row sum cannot detect that semantic error; named schema alignment is required before combining.

### N. Project a changed coefficient vector

**Question.** Project [.8,.3,−.1] onto the simplex. Compare with clip-and-normalize and explain why they differ.

**Hint.** Test the active first two sorted coordinates and their common threshold.

**Explained solution.** Their threshold is (.8+.3−1)/2=.05. Subtract it from the two active values and floor the third at zero, giving [.75,.25,0]. Clipping first gives [.8,.3,0], then dividing by 1.1 gives [8/11,3/11,0]. Both are permitted simplex points, but only the common-threshold point is the Euclidean closest vector. The distinct distances and derivative/KKT conditions identify the actual projection, not mere feasibility.

### O. Find indirect selection leakage

**Question.** A base predicts held rows A/D after fitting its coefficients only on B,C,E,F. Its regularization setting was chosen using targets from all A–F. Is its OOF cell honest? Repair the procedure.

**Hint.** Trace selection-label access as well as coefficient-fit access.

**Explained solution.** It is not honest: A and D influenced the selected setting used by their supposed held prediction. Perform setting selection within the permitted B,C,E,F subset, fit the selected rule there, then predict A/D. Repeat that complete choice-and-fit workflow for every OOF fold. If assessing the whole stack, surround all of it with an outer boundary whose labels teach none of those decisions. The nested program logs both kinds of access; a clean coefficient-fit list alone misses this fault.

### P. Repair stale serving state

**Question.** A saved bundle's first two feature names are swapped, but scaler arrays, base parameters, meta weights and old metrics are retained. Can updating only its checksum make it a valid new measured rule?

**Hint.** A checksum binds bytes; ask whether those bytes still mean the fitted columns.

**Explained solution.** No. The arrays now read different inputs than their fitted schema specifies. Restore the correct feature order or transform every affected parameter/preprocessing mapping consistently as a declared equivalent state, with a forward correspondence check. If the transformation changes the rule rather than preserving it, fit/version/evaluate that changed workflow under a new boundary. A recomputed checksum does not establish semantic correspondence or allow borrowing old test metrics. The live saved-state view rejects the stale feature mapping and preserves explicit invalid-state feedback.

**Ready to continue.** You can name each contributed quantity, trace the rows that produced a fitted prediction, derive one combination/update, apply the complete saved rule to changed inputs, and distinguish a finite result from a guarantee. Next, **Recommender Systems** develops collaborative and content-based scores. Their different available information makes combination useful to investigate, with cold-start, time and entity boundaries kept explicit.

## Further learning

Choose an alternate explanation that matches the point you want to revisit; these supplement the local complete derivations and programs.

- [Herman Kamper: Bagging](https://youtu.be/pvZ3ZhlmDCE), [AdaBoost step by step](https://youtu.be/Vixw2DOUGec) and [update details](https://youtu.be/wbmuqXbUFGM), with the [written ensemble notes](https://www.kamperh.com/data414/notes/17_ensemble_methods_notes.pdf): instructor-led alternatives for resampling and signed updates. The relevant written formulas/algorithms were inspected; the recordings were not watched. Compare his signed coefficient with our derivation, then use the separate API section for SAMME conventions.
- [John Duchi's CS229 boosting notes](https://cs229.stanford.edu/extra-notes/boosting.pdf), §§1–3.1: a mathematical second route through exponential loss, a uniform weak edge and sorted stump fitting. Use after §§5–6; the operand trace here supplies a concrete starting point.
- [Cosma Shalizi's Model Averaging lecture](https://www.stat.cmu.edu/~cshalizi/sml/21/lectures/17/lecture-17.html): a written alternative for output combination, disagreement and uncertainty in selecting one best-looking fit. Use after §3; its applications are distinct from this lesson's constructed shipment and measured WDBC examples.

## Technical references

- [Hastie, Tibshirani & Friedman, The Elements of Statistical Learning](https://hastie.su.domains/ElemStatLearn/), §8.8 and selected §§16.1/16.3.1: canonical stacking, population versus estimated weight roles, ensemble generation and post-processing. The selected pages inform our distinctions; the entire book is not a required prerequisite.
- [Breiman, Bagging Predictors](https://www.stat.berkeley.edu/~breiman/bagging.pdf), introduction: original bootstrap aggregation and stability motivation. Its historical results are not measurements on our later examples.
- [Krogh & Vedelsby, Neural Network Ensembles, Cross Validation, and Active Learning](https://proceedings.neurips.cc/paper_files/paper/1994/file/b8c37e33defde51cf91e1e03e51657da-Paper.pdf), §2 and Figure 1: normalized squared-error/disagreement decomposition. Our finite derivation retains its weight assumptions and separates the target from member disagreement.
- [Freund & Schapire, A Short Introduction to Boosting](https://www.schapire.net/papers/FreundSc99.pdf), algorithm and training-error discussion; [Schapire, Explaining AdaBoost](https://www.schapire.net/papers/explaining-adaboost.pdf), algorithm and margin discussion: signed updates, weak-edge conditions and generalization qualifications. Paper experiment curves remain those papers' evidence.
- [Breiman, Stacked Regressions](https://statistics.berkeley.edu/sites/default/files/tech-reports/367.pdf), §§1–2: honest level-one predictions and NNLS. Its main nonnegative route differs from its later sum-one analysis and our explicit penalized simplex fit.
- [Wolpert, Stacked Generalization](https://doi.org/10.1016/S0893-6080(05)80023-1): original attribution. A complete accessible primary copy was not obtained; the local algorithm is supported by inspected Breiman/ESL/API material rather than an unseen theorem.
- [Sill et al., Feature-Weighted Linear Stacking](https://arxiv.org/pdf/0911.0460), §§2.1–2.2 and Figure 1: context-prediction products and coefficient fitting. The local eight- and twelve-row constructions isolate representation/derivatives rather than adopting competition results.
- [Cawley & Talbot, On Over-fitting in Model Selection](https://jmlr.org/papers/v11/cawley10a.html), abstract, and the [official nested-CV example](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html): selection and assessment need separate boundaries. We use a declared twelve-row ownership construction, not a replay of the official Iris example.
- Current [ensemble guide](https://scikit-learn.org/stable/modules/ensemble.html), [StackingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.StackingClassifier.html), [VotingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.VotingClassifier.html), [cross_val_predict](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_predict.html) and [AdaBoostClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.AdaBoostClassifier.html): output methods, column handling, cloning, partition coverage and discrete SAMME. Inspected installed 1.9.1 source and the declared programs bind this lesson's conventions; future versions can change defaults.
- [CalibratedClassifierCV](https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV.html) and [FrozenEstimator](https://scikit-learn.org/stable/modules/generated/sklearn.frozen.FrozenEstimator.html): calibration of an already fitted whole rule on separate data, with the distinct sigmoid target/score convention explained in §10.
- [UCI WDBC](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic), [DOI](https://doi.org/10.24432/C5DW2B) and the supplied `DATA.md`: dataset meaning, provenance and attribution for the once-executed study. Its label conversion and offline bytes are explicit.

The common file index owns complete programs, dependency/setup lists, Copy/Download feedback and actual saved stdout. Original 11 programs remain byte-exact. The seven new groups contain eight files because the binary orchestration distributes the exact guarded Newton dependency. Downloading the real study also supplies its offline CSV, protocol and data attribution; it is not advertised as a dependency-free single file. The index's scopes distinguish retained observations, new constructed computations and the one new real-data campaign.
