export default {
  "summary": "Two uncertain measurement corrections move together. A downstream system needs their sum for one decision and their difference for another. An approximation can preserve both means yet give those decisions quite different uncertainties. We will fit distributions, expose the operations that fit them, and check the answer the decision actually needs.",
  "prerequisites": "Bayesian Inference supplies the target posterior; Monte Carlo and MCMC supply expectations, sampling precision and exploration checks. Here the central operation is optimization over distributions. Ordinary derivatives are enough to begin. KL, entropy, factor updates and natural coordinates are introduced where they are used. All Normal notation is N(mean, variance); s always denotes a positive standard deviation. Logs are natural logs, so log ratios and objectives are in nats.",
  "manuscript": "## 1. Choose a distribution\n\n[VI_DRAW_V01]\n\nThe horizontal coordinate is a possible unknown correction θ. The curve assigns a density to each possible value; an interval's probability is the area under it. The marker at zero is the mean of N(0,1), not a claim that θ must equal zero. The shaded region θ>1 has probability about .158655. Returning only the marker would throw that question away. MLE and MAP choose points; **variational inference**, or VI, chooses an approximate distribution q for a target p(θ|D).\n\n[VI_DRAW_V02]\n\nThe second plane has different coordinates: m and log s are settings of the approximation. Its point (0,0) selects N(0,1); (1,log 2) selects N(1,4). Each point on this parameter plane selects a whole curve on the θ axis. θ is what remains uncertain, while λ=(m,log s) is what the optimizer changes. Writing s=exp(log s) makes positivity automatic. Moving these settings still cannot make one Gaussian have two peaks.\n\nChoose the data model, the family, and the objective separately. The model determines the target. The family decides which distributions are available. The objective and optimizer select an available member. A convenient family may make later sampling and expectations cheap, but evaluating a difficult target can still dominate the work. VI has no universal speed or accuracy advantage over MCMC.\n\n[VI_DRAW_V03]\n\nWe can see all three choices without an unknown integral. The possible states are A, B and C, each with prior mass 1/3. An observed event has likelihood .24, .60 and .36 at those states. Multiply each likelihood by its own prior mass: the joint weights are .08, .20 and .12. Their sum .40 is the **evidence**, the model's probability of that observed event. Divide each joint weight by .40 to obtain the posterior p=(.20,.50,.30). Keep state identity through every multiplication and normalization; a taller likelihood is not itself a posterior probability.\n\n[VI_DRAW_V04]\n\nA density height behaves differently from a finite probability mass. If θ'=2θ, then θ∈[0,1] and θ'∈[0,2] represent the same event. The new density is half as tall because the interval is twice as wide: p'(θ')=p(θ'/2)/2. Both shaded areas equal approximately .341345. Continuous density can exceed one without an invalid probability; its units are inverse units of θ. This distinction matters when an objective compares log densities or changes coordinates.\n\n## 2. Build an objective without the evidence\n\n[VI_DRAW_V05]\n\nFirst check **support**, the states or regions with positive probability. At p=(.4,.6,0), q=(.4,.5,.1) invents mass on impossible C. Its reverse KL is infinite. In contrast, q=(1,0,0) ignores B but has finite KL log(1/.4). Reverse KL averages where q visits; it does not impose an automatic infinite penalty on every target region q omits. A zero-q term contributes zero by the limit x log x→0. Positive q divided by zero p cannot be treated by that limit. We require normalized q and a positive finite evidence.\n\n[VI_DRAW_V06]\n\nThe finite investigation puts p and q on the same three states and keeps each operation visible. Adjust q_A; in the restricted family, divide the remaining mass equally between B and C. In the free family, the B share controls how that remainder is divided. Reset returns q_A=.2, share=.5 and the restricted family. Endpoints q_A=0 and 1 use the zero-mass limit, rather than taking log zero directly.\n\nFor any valid finite q, the row contribution q_i log(q_i/p_i) measures its weighted log ratio. Their sum is **Kullback–Leibler divergence**, KL(q‖p). In a continuous model the sum becomes an integral against q. The direction matters: this **reverse KL** averages under the proposed approximation. It is nonnegative and zero exactly for matching distributions, up to probability-zero differences, but is neither symmetric nor an ordinary metric.\n\n[VI_DRAW_V07]\n\nWith uniform q, state A has q_A>p_A and a positive log-ratio contribution; B has q_B<p_B and a negative one. Negative individual contributions are allowed. Their total is about .070240. Replacing q by p makes each ratio one and every contribution zero. Do not turn signed contributions into positive mass bars: they describe a discrepancy calculation, not another probability distribution.\n\nBayes' rule says log p(θ|D)=log p(D,θ)−log p(D). Substitute it into KL and rearrange:\n\nKL(q‖p)=E_q log q−E_q log p(D,θ)+log p(D).\n\nDefine the **evidence lower bound**, or ELBO, L(q)=E_q log p(D,θ)−E_q log q. The identity is log p(D)=L(q)+KL(q‖p). For this fixed model and data, maximizing L minimizes reverse KL. The evidence does not depend on λ, so an unavailable evidence integral does not prevent optimizing the equivalent objective. Expectations inside L may still need numerical work.\n\n[VI_DRAW_V08]\n\nAll candidates meet the same log-evidence line −.916291. Uniform q starts at ELBO −.986531 with gap .070240. The best restricted q has ELBO −.942022 with gap .025732. Exact q reaches −.916291 with zero gap. The objective and discrepancy share one signed number axis; neither is probability mass. A higher ELBO within this same target means a smaller KL, including when both objective values are negative.\n\n[VI_DRAW_V09]\n\nWhy is this a lower bound? When q covers the required target support, write evidence as E_q[p(D,θ)/q(θ)]. Concavity of log gives E_q log ratio≤log E_q ratio. For two positive ratios .5 and 1.5 with equal weights, their mean is one, log of that mean is zero, while their mean log is about −.143841. The chord lies below the log curve. If q omits some positive joint mass, the expectation covers only the included part of the evidence; the bound still holds, but the naive equality to the whole evidence is unavailable. The KL identity remains the direct support-aware explanation.\n\n[VI_DRAW_V10]\n\nThe entropy term −Σq_i log q_i rewards allocation across states. Uniform mass has three equal contributions and entropy log 3; a point mass has entropy zero. The expected log joint rewards allocation to model-supported, plausible states. Balancing both determines the optimum. Continuous **differential entropy** can be negative and changes under coordinate transformations. It is not, alone, a coordinate-independent measure of posterior accuracy.\n\n[VI_DRAW_V11]\n\nThe probability simplex contains all nonnegative triples that sum to one. Requiring B=C cuts out a line q=(a,(1−a)/2,(1−a)/2). Our target (.2,.5,.3) lies off that line. Differentiate KL along it: its derivative is log(a/p_A) minus the average of log((1−a)/(2p_B)) and log((1−a)/(2p_C)). Setting it to zero gives a/(1−a)=p_A/(2√(p_Bp_C)), hence a*=p_A/(p_A+2√(p_Bp_C))≈.205213. The second derivative 1/a+1/(1−a)>0 proves a unique interior minimum; endpoint limits complete the check.\n\n[VI_DRAW_V12]\n\nOn the restricted objective curve, the current a=.2 is close to a* but not identical. The vertical gap from the achieved objective to the best restricted objective is **optimization error**. The remaining gap from that best objective to log evidence is **family error**. Releasing B=C permits the target itself. More accurate arithmetic or more optimizer steps can improve the first gap; they cannot move the best restricted point off its line. Neither gap here is Monte Carlo noise.\n\n[VI_FILE_finite_elbo.py]\n\nThe complete program constructs posterior weights from the joint, calculates both sums, solves the restricted optimum, and asserts ELBO+KL=log evidence for all three candidates. It needs only Python's standard-library math module. The zero-q guard skips terms whose mathematical limit is zero. Changing the joint weights requires changing every target-dependent calculation together; the printed contract includes all three distributions and both objectives. Work is linear in the number of states per inspection, with constant storage here.\n\n[VI_DRAW_V13]\n\nSeparate log p(D,θ) into log likelihood plus log prior. Then L(q)=E_q log p(D|θ)−KL(q‖p(θ)), where the p in the KL is now the **prior**. The same three state rows reproduce the identical ELBO. The penalty is a specific prior discrepancy, not an unexplained complexity charge. Data fit, the chosen prior, and entropy must all refer to the same normalized q.\n\n[VI_DRAW_V14]\n\nExact family objectives are comparable when their model, data and retained constants match. Define a second binary observation model in which the observed event has half the original conditional probability: its likelihoods are (.12,.30,.18). With the same uniform prior, joint event masses become (.04,.10,.06) and evidence .20. Each likelihood remains a valid probability; the complementary event receives the remaining probability. The posterior remains (.2,.5,.3), so each fixed q has unchanged posterior KL, while its ELBO and log evidence both fall by log 2. The original evidence .40 and the new .20 refer to different observation models. Removing a constant during one model's optimization can leave its best q unchanged, but comparing raw objectives with different retained constants does not compare posterior accuracy. A noisy objective difference also needs its numerical precision; a reported lower bound is not automatically an exact model-ranking evidence.\n\n## 3. Inspect what a family loses\n\n[VI_DRAW_V15]\n\n**Mean-field** q factors into independent distributions over coordinates or blocks. Independence is a restriction on q, not a finding about p. Here p is a two-dimensional Gaussian with unit marginal variances and correlation ρ. Its covariance is Σ=[[1,ρ],[ρ,1]]. On equal-unit axes, positive correlation tilts its contour toward simultaneous positive deviations; negative correlation favors opposing ones. The contour marks Mahalanobis radius one, not a probability at an exact point. Its enclosed mass in two dimensions is 1−exp(−1/2)≈.393469.\n\nThe live investigation starts at ρ=.8 and independent reverse-KL factors. Compare their round contour with the target tilt, the product of true marginals, and a full-covariance Gaussian. Setting ρ=0 supplies a null dependency case; negative ρ reverses the tilt. Reset restores the complete default. Equal-axis units matter: unequal plot scales could manufacture or conceal a tilt.\n\n[VI_DRAW_V16]\n\nThe **precision** matrix P=Σ⁻¹ enters the negative log-density quadratic. Fix θ₂ and complete the square in θ₁: its conditional center is ρθ₂ and variance 1−ρ². At ρ=.8 that variance is .36. A section through the joint ellipse is narrower than its full marginal projection. For an independent Gaussian q with variances v_j, the variance-dependent part of reverse KL is ½Σ(P_jj v_j−log v_j). Differentiating gives v_j=1/P_jj, which is .36 here.\n\n[VI_DRAW_V17]\n\nReverse KL therefore chooses diag(.36,.36), whereas forward KL(p‖q) chooses the product of true marginals, diag(1,1). To see the latter, split log q into its factor logs and average each against the corresponding true marginal. Matching each marginal minimizes that factor's cross entropy. Both products lose the covariance, but they are solutions to different optimization questions. Reversing the KL direction is a substantive change.\n\nFor q=N(m,C), p=N(μ,Σ), dimension d and δ=m−μ,\n\n2 KL=tr(Σ⁻¹C)+δᵀΣ⁻¹δ−d+log(det Σ/det C).\n\nThis follows by averaging the quadratic difference: E_q[(θ−μ)(θ−μ)ᵀ]=C+δδᵀ. Both covariances must be positive definite. Matching means and covariance makes the trace d and all remaining terms zero. The best independent gap here is −½log(1−ρ²)=.510826 at ρ=.8; a full Gaussian removes it for this Gaussian target.\n\n[VI_DRAW_V18]\n\nProject the joint onto the sum and difference directions. For any fixed weights w, Var(wᵀθ)=wᵀΣw. Target sum variance is 2+2ρ=3.6 and difference variance is 2−2ρ=.4. The reverse-KL product gives .72 for both. The sum is too certain, while the difference is too uncertain. Underestimated marginal variances do not imply that every reported quantity is too certain. Negative correlation changes which decision is harmed.\n\n[VI_FILE_gaussian_decisions.py]\n\nThe complete standard-library program evaluates the double sum wᵀΣw, rather than merely adding two marginal variances. It prints both decisions, the exact family discrepancy, and the radius-one enclosed mass. Edit ρ and recompute all covariance-dependent quantities; the practice uses −.6. Each dense linear variance calculation takes O(d²) arithmetic in d dimensions. The two-dimensional contour represents actual covariance, while the programme gives the numerical decision reference.\n\n[VI_DRAW_V19]\n\nRotate to the orthogonal eigen-directions (θ₁+θ₂)/√2 and (θ₁−θ₂)/√2. Their covariance is diagonal with eigenvalues 1+ρ and 1−ρ. The Gaussian coordinates are then independent, so independent factors in those coordinates can represent this target exactly. The rotation has absolute Jacobian determinant one. Independence is coordinate-specific under a mixing transformation; a nonlinear or multimodal target need not be fixed by rotation. Defining the family after a transformation changes which physical distributions are available.\n\n## 4. Optimize one whole factor at a time\n\n[VI_DRAW_V20]\n\nA product q₁(θ₁)q₂(θ₂) fills the two-dimensional plane from two density factors. **Coordinate-ascent variational inference**, or CAVI, replaces one whole factor, holding the other fixed. It is not a move of one posterior sample. To expose the arithmetic, shift our target mean to (1,−1), keep ρ=.8, and start factor means at (−2,2) with variances .36. The family remains independent throughout.\n\n[VI_DRAW_V21]\n\nAverage the log joint over all factors except q_j. Call the remaining function f_j(θ_j)=E_{q_−j} log p(D,θ). Exponentiate and normalize it: q_j^new∝exp f_j. In the shifted Gaussian, square completion gives mean m₁^new=1+ρ(m₂+1) and variance 1−ρ². The current m₂=2 therefore gives m₁^new=3.4. Averaging the joint first would give a different function; the update uses the expected **log** joint.\n\nThe relevant objective terms are E_qj f_j−E_qj log q_j. If r_j is the normalized exponential, they equal log∫exp f_j−KL(q_j‖r_j). Replacing q_j by r_j removes a nonnegative discrepancy. This proves nondecrease of the exact ELBO when the normalizer is finite and r_j is in the allowed factor family. Additional parametric restrictions may require an inner optimizer; noisy or approximate updates do not inherit exact monotonicity automatically.\n\n[VI_DRAW_V22]\n\nNow update factor two with the newly changed first mean: m₂^new=−1+ρ(m₁^new−1)=.92. The live path joins actual states on the plane of **variational means**, with the factor densities beside them. Choose 0–24 individual updates; odd updates replace factor one and even updates replace factor two. Changing ρ restarts the trace so states are not mixed across targets. At ρ=0 each factor reaches its target mean independently. Reset restores ρ=.8, zero updates and the stated start.\n\n[VI_DRAW_V23]\n\nEach individual update reduces KL in this example. The fixed line .510826 is the irreducible family discrepancy; the moving curve includes the current mean error. After 24 updates, means are approximately (1.017709,−.985833) and total KL .510982. More updates approach the line without making the contour tilt. One full sweep multiplies the remaining second-mean error by ρ²; near |ρ|=1 that contraction is slow even though the algebraic update is exact.\n\n[VI_FILE_gaussian_cavi.py]\n\nThe complete program alternates the coordinate index, uses the other coordinate's current value, and evaluates the full KL after every update. Its monotonicity assertion checks each step, not only the printed milestones 1, 2, 4 and 24. The output also prints the limiting family gap. Storage is constant here; a dense general update needs the factor expectations and target structure. Larger budgets remove optimization error in this example, while a richer family or a suitable coordinate change addresses family error.\n\n[VI_DRAW_V24]\n\nOrder is observable. At ρ=.5 and start (0,0), an ordered sweep gives first m₁=1.5 and then m₂=−.75. Simultaneously using both old means gives (1.5,−1.5). Draw the operands and both arrows before comparing endpoints. Simultaneous updates are a different algorithm; this example does not prove their universal convergence or failure. The exact coordinate proof applied when the other factor was held fixed during each replacement.\n\n## 5. Keep separate explanations separate\n\n[VI_DRAW_V25]\n\nThe Gaussian target made the best family easy to calculate. A model can instead leave two different explanations plausible. Use p(θ)=½N(θ;−3,1)+½N(θ;3,1). Each term is a density over the same θ; sum the weighted densities at each point. A single q=N(m,s²) can cover both peaks broadly or concentrate near one, but cannot reproduce both peaks and their low valley. The live investigation starts at m=0,s=3 and separation d=3, and includes the two narrow candidates. Changing d to zero merges the target components; changing m's sign swaps which explanation q favors. Reset restores the complete default.\n\nReverse KL averages log(q/p) under q. A broad q repeatedly visits the low-density valley and pays for that allocation. A narrow q near one peak gives the other peak little weight in its own average. This can favor one-mode concentration, the usual “mode-seeking” tendency. It is not a theorem that every target or family has a one-mode optimum. The finite plotting window is a display, while the KL calculation accounts for the stated Gaussian-noise integration domain and its numerical refinement.\n\n[VI_DRAW_V26]\n\nTo calculate the discrepancy, change the integration coordinate to ε~N(0,1) and θ=m+sε. The actual quadrature nodes and Normal weights multiply the log-ratio contribution at their transformed θ positions. Sum those weighted contributions. Stable log-sum-exp calculates the mixture log density without first creating an underflowed tiny density. The complete program uses composite Simpson integration on ε∈[−9,9] and checks the same result after halving the spacing. That is controlled numerical integration, not a closed-form exact KL or random sampling precision estimate.\n\n[VI_FILE_mixture_projection.py]\n\nThe complete standard-library program preserves all three candidate results: KL approximately .877 for N(0,9), and .689 for N(3,1) and N(−3,1). The second printed parameter is standard deviation, while our N notation names variance. These are comparisons among declared candidates, not a proof that ±3 with variance one are the exact global minimizers. The interval budget controls quadrature cost, O(number of intervals) evaluations per candidate; refinement checks the printed precision, and the noise tails beyond nine standard deviations are negligible at this scale.\n\n[VI_DRAW_V27]\n\nThe target has Pr(θ>0)=.5 by symmetry. The right-peak Gaussian reports .998650, the left-peak one .001350, and N(0,9) reports .5. The probability axis therefore exposes a difference that a similar ELBO hides. If sign chooses a control direction, report the unresolved ambiguity instead of whichever initialization selected one peak. The broad candidate's correct sign probability does not make its entire density accurate either.\n\n[VI_DRAW_V28]\n\nCombining distributions means combining densities or selecting a component before sampling. Equal mixing of N(−3,1) and N(3,1) has mean zero and variance 1+9=10. Averaging the two means gives only the point zero; fitting a Gaussian to those moments gives N(0,10), still a different shape with no low valley. A mixture family can represent the two modes but introduces component fitting and identifiability questions. MCMC is a convincing reference only after demonstrating exploration of both regions and adequate precision for the sign probability; one stuck chain can reproduce the same false certainty.\n\n## 6. Differentiate an expectation\n\n[VI_DRAW_V29]\n\nSome factor expectations or normalizers lack closed forms. We can estimate an ELBO gradient and optimize λ instead. Keep draws from q separate from later data minibatches. For Gaussian q, independent base noise ε~N(0,1) becomes θ=m+sε. Holding a draw ε fixed while moving m or a=log s exposes the derivative of that transform: ∂θ/∂m=1 and ∂θ/∂a=sε. Repeated use of one fixed noise set is useful for parameter comparisons; fresh noise is required for the intended stochastic optimization experiment below.\n\nWhen differentiation can pass through expectation,\n\nL(m,a)=E_ε log p(D,m+exp(a)ε)+a+½log(2πe).\n\nThe last two terms are exact Gaussian entropy. For g(θ)=∂_θ log p(D,θ), the **pathwise** ELBO contributions are g(θ) for m and 1+sεg(θ) for a. The +1 is the entropy derivative; omitting it would encourage fitting by squeezing away uncertainty.\n\n[VI_DRAW_V31]\n\nThe **score** differentiates log q with θ held fixed. For a Gaussian, its components are (θ−m)/s² and (θ−m)²/s²−1. Writing ∇q=q∇log q converts the ELBO derivative into E_q[(log p(D,θ)−log q(θ))∇log q(θ)]. The extra derivative of −log q averages to zero for a normalized fixed-support q with valid differentiation exchange. The row table multiplies the same log ratio by each score component. Unlike the pathwise route, this estimator need not differentiate the target with respect to θ; differentiably parameterized discrete q can use it too. Existence of the needed moments and valid exchanges remain requirements.\n\n[VI_DRAW_V30]\n\nWith both estimators now defined, the live investigation compares them on the distinct target N(1.5,.7²). Its slope is g(θ)=(1.5−θ)/.49. Exact expected ELBO gradients are (1.5−m)/.49 and 1−s²/.49. Default m=0,s=1.2,count=100,seed=7 and selected draw=1 expose every draw and its contribution, plus their means and analytic references. Counts 10,100 and 1000 change the expectation budget; choosing a row changes which existing draw is explained. Match q sets m=1.5,s=.7. Invalid seed drafts retain the last valid result; Reset restores numeric settings, draft, selection and alert together. A realized contribution can point away from the expected gradient. Unbiasedness concerns repeated draws, not correctness of each arrow.\n\n[VI_DRAW_V32]\n\nA deterministic constant baseline b subtracts b times the zero-mean score, leaving the expected gradient unchanged. For a scalar component s_λ, a variance-minimizing constant under suitable finite moments is E[f s_λ²]/E[s_λ²], with f the log ratio. Estimating b from an independent pilot and conditioning on that pilot preserves the gradient expectation. Fitting and applying it on the same draws needs a bias-aware construction; it is not automatically unbiased. The pilot and gradient rows are separate objects in the drawing. More draws, control variates and Rao–Blackwellization can change cost and variance; none removes a family restriction by itself.\n\n[VI_DRAW_V33]\n\n“Pathwise always has lower variance” fails even for Gaussians. For this separate normalized target p=q=N(2,1), log p−log q is zero at every θ, so this specified score estimator is identically zero. The pathwise log-scale contribution is 1−ε² and remains random, with variance two. Its mean component is −ε, also random. Both expectations are zero. An unknown joint-normalization constant would add constant times score and alter the raw-score result unless a suitable baseline removed it. Estimator formula and retained constants are part of a variance claim.\n\n[VI_DRAW_V34]\n\nChanging a in Uniform(0,a) changes the support endpoint. Eθ=a/2 and its derivative is 1/2. Leibniz differentiation of ∫₀ᵃ θ/a dθ gives the boundary term a/a=1 and the interior derivative −1/2, summing to 1/2. Looking only at the unchanged integrand θ, or dropping the moving boundary in a score argument, misses the result. A discrete random sample is likewise not made ordinarily differentiable by automatic differentiation. Choose an estimator whose regularity and support conditions match the distribution.\n\n[VI_DRAW_V35]\n\nTwo fixed noise sets define two sampled objective surfaces; the expected objective is another object. Sharing noise between nearby parameter evaluations helps isolate a parameter effect, but optimizing forever against a small fixed set can overfit that numerical approximation. Independent higher-precision evaluation after a fit assesses expectation error. In the lab, fixed noise makes changed parameters comparable; in the complete optimizer, every iteration obtains fresh draws.\n\n[VI_DRAW_V36]\n\nThe actual seeded optimizer reports states after 100,500 and 2000 updates. It takes 64 fresh noise draws per update, averages both pathwise contributions, and uses Adam **ascent**, with its positive update sign, moment bias corrections and decreasing rate .03/√(1+t/200). It represents scale by log s to preserve positivity. The independent exact Gaussian KL is evaluated from each reported m,s, without final posterior sampling.\n\n[VI_FILE_stochastic_vi.py]\n\nRead the complete standard-library source in order: initialize seed7 and both optimizer moment arrays, form fresh ε, transform θ, calculate target slope, average the two gradients, correct Adam's moments, update m and log s, then check finite parameters. The printed rows are 100:(1.4879,.7133,KL .000507), 500:(1.514,.7122,.000500), and 2000:(1.468,.6858,.001462). The later state is worse than the 500-update state. Finite stochastic optimization is not monotone; a fixed budget does not certify convergence. The work is 2000×64 target-slope evaluations with constant optimizer state, not a general speed claim. Changing seed or rate changes the finite result and should be followed by independent objective and decision checks.\n\n[VI_DRAW_V37]\n\nFor a deeper comparison, switch explicitly to the loss KL(q‖p), so gradient signs reverse. Let p=N(a,b²), q=N(m,s²) and ρ=log s. The pathwise loss-scale contribution is ((m−a)+sε)sε/b²−1. Its expectation is s²/b²−1; its variance is (m−a)²s²/b⁴+2s⁴/b⁴. Expand into a linear ε term and a quadratic ε²−1 term; Eε=Eε³=0, Eε²=1 and Eε⁴=3 give that variance.\n\nPrice's Gaussian differentiation identity gives ∂_ρ E U(X)=s² E U''(X) for U=−log p, under valid differentiation and integrability conditions. Here U''=1/b² is constant, so the Price loss-scale contribution s²/b²−1 is deterministic. Its mean-coordinate contribution U'(X) is still noisy. A general target requires a second derivative or Hessian information and does not give this constant-curvature result or a universal variance ranking. Gaussian mean and covariance derivative conventions must agree with the objective being minimized.\n\n[VI_FILE_gaussian_scale_estimators.py]\n\nThis complete new NumPy program uses a separate target N(0,1), means 0,1,−2 and scales .5,1,2. It calculates exact moment fractions first, then compares seeded empirical means and sample variances using 10,000 independent Normal draws per case, seed51. There are 90,000 draws altogether, with both scale-estimator operations evaluated for each draw. For m=0,s=.5, exact path variance is 1/8 and the observed sample variance .12939477; for m=−2,s=2, they are 48 and 47.83726077. Exact Price variance is zero throughout. The empirical discrepancy is finite-sample variation, not a failure of the exact identity. NumPy supplies the ordinary RNG and array variance route; the exact Fraction arithmetic supplies the separate algebraic reference. No runtime timing or universal efficiency advantage is inferred.\n\n## 7. Scale data work\n\n[VI_DRAW_V38]\n\nNow change the randomness source to observation selection. With one global θ and N conditionally independent observations, the joint has one prior term and N likelihood terms. A uniform size-b batch estimates the likelihood sum by N/b times its batch sum. The prior and entropy still appear once. Every row has inclusion probability b/N for uniform sampling without replacement. Nonuniform selection needs appropriate inclusion weights; dependent data need the correct likelihood structure.\n\nFor the original simple model θ~N(0,1), x_i|θ~N(θ,1), x=[1,2,4,5], q mean1 and sd.5, the full likelihood mean-gradient is eight and prior contribution −1, totaling seven. This simple shared-θ model is distinct from the hierarchy introduced below.\n\n[VI_DRAW_V39]\n\nAll six size-two subsets produce gradients [1,5,7,7,9,13]. Their average is seven, exactly the full gradient. Scaling the prior by two as well produces average six. More batches converge toward that biased six; noise reduction cannot repair the wrong weighting.\n\n[VI_FILE_minibatch_vi.py]\n\nThe complete standard-library program enumerates combinations instead of approximating their average by sampling. Its mean-gradient expression scales only the likelihood, and the deliberately wrong comparator scales the prior too. It also prints the full log-scale gradient −.25 and exact posterior mean2.4,variance.2. This model has one shared θ observed four times. The next model adds a distinct local unknown per observation, so its posterior numbers will differ. In a real large dataset a batch reduces per-step data work; enumerating every subset is only a small-model correctness oracle, with combinatorial cost as N grows.\n\n[VI_DRAW_V40]\n\nDraw one global μ~N(0,1). Each of four separate local unknowns z_i|μ~N(μ,1) generates its own observed y_i|z_i~N(z_i,1), with synthetic y=[1,2,4,5]. Every displayed variance is one. The plate repeats the local/observation pair; it does not repeat the global prior. Approximate the joint posterior with q(μ)∏q_i(z_i). This factorization removes the posterior coupling even though the generative model connects μ to every z_i.\n\n[VI_DRAW_V41]\n\nAt current Eμ=m, the z_i-dependent expected log joint is −½[(z_i−m)²+(y_i−z_i)²], up to constants in z_i. Completing the square gives local mean (y_i+m)/2 and variance .5. At m=1 the four local means are [1,1.5,2.5,3]. Optimize these local factors before using their sufficient-statistic contributions in a global proposal. A selected batch supplies its own optimized locals; the full table shows all four for this small reference calculation.\n\n[VI_DRAW_V42]\n\nThe global expected log joint has precision J=1+4=5 and linear coefficient h=ΣE z_i. A Normal's natural coordinates are (h,−J/2), since log q contains hμ−Jμ²/2 plus its normalizer. The proposed global mean is h/J and variance 1/J. For a size-two batch, estimate h with 2Σ_{i in batch}E z_i, giving all six proposals [5,7,8,8,9,11]. Their average eight equals the full local sum, while the prior precision contributes once.\n\nThe live default current m=1 means current h=Jm=5. Selected indices [0,2] give h_hat=7, proposed mean1.4. A quarter natural step produces h_new=.75×5+.25×7=5.5, hence mean1.1. The separately labeled full-data/mean-over-batches reference has h_hat=8, h_new=5.75 and mean1.15. The first batch [0,1] proposes h=5, so that selected step is null at m=1; step fraction zero is null for any batch. Step fraction one takes the complete selected proposal. Reset restores m=1, batch[0,2] and fraction.25. Each displayed proposal names its batch rather than borrowing the full-reference number.\n\n[VI_DRAW_V43]\n\nFull ordered CAVI first updates all local means, then m_new=(Σy_i+4m)/10=1.2+.4m. Its fixed point is m=2; local means become [1.5,2,3,3.5]. Integrating out each z_i gives y_i|μ~N(μ,2), so the true global precision is 1+4/2=3 and true variance1/3. The product q uses global variance1/5 and local variances1/2. The full five-dimensional target precision has diagonal [5,2,2,2,2] and four global/local off-diagonals −1. Its determinant is 48; the product covariance determinant is (1/5)(1/2)^4=1/80. The exact joint family gap is ½log((1/48)/(1/80))=½log(5/3)≈.255413. It is a full joint KL, not only the μ-marginal KL.\n\n[VI_FILE_hierarchical_svi.py]\n\nThe complete new programme uses Fraction arithmetic for all local means, batch proposals and weighted steps. SciPy's positive-definite solve independently obtains the full joint mean and covariance from the five-dimensional precision matrix; the Gaussian KL uses trace, mean error and log determinants. It prints every batch, the selected step, the full reference, the first-batch null case, and ten complete ordered CAVI sweeps. μ_n=2+(1−2)(.4)^n approaches the fixed point; each finite row remains a finite row. Local factors at the end of a sweep reflect the preceding μ before its update, so they must be used as printed when checking the full joint KL. Four local updates are needed per full sweep and two per selected proposal; the small dense reference solve is a validation cost, not part of scalable batch inference.\n\n[VI_DRAW_V44]\n\nIn the (h,J) plane, a step η_new=(1−ρ)η+ρη_hat averages **natural parameters**. It does not average arbitrary posterior draws or distribution moments. Here J stays five, so mean happens to move linearly too; if J changes, averaging means alone generally disagrees. Positive J defines the valid Normal domain. The Fisher-information matrix averages products of score components and measures how a small parameter move changes the distribution. A natural gradient rescales the ordinary gradient by its inverse. On this fixed-J Normal path, the score for h is μ−m, so Fisher information is E(μ−m)²=1/J. With optimized locals held fixed, the ELBO derivative in h is (h_hat−h)/J. Multiplying by the inverse Fisher information J gives the natural direction h_hat−h, exactly the proposal-minus-current direction in the drawing. The full conditionally conjugate local/global construction applies this distribution-based scaling in all natural coordinates. The next Exponential Families lesson develops these coordinates and sufficient statistics in general. Classical stochastic schedules use Σρ_t=∞ and Σρ_t²<∞ along with appropriate regularity, noise and stability assumptions; the schedule alone is not a universal convergence proof. Generic noisy-gradient VI and this structured construction share a broad aim but have different algorithmic requirements.\n\n## 8. Share inference across cases\n\n[VI_DRAW_V45]\n\nPreviously λ was fitted for one dataset. **Amortized inference** fits a shared rule λ(x)=f_φ(x) for many inference cases. Each of three separate cases has its own θ~N(0,1) and one measurement x|θ~N(θ,1). Square completion gives posterior N(x/2,.5). The same encoder rule sends x=−2,0,2 to three different means −1,0,1 with the same variance .5. These are separate unknowns, not three sequential measurements of the same θ.\n\n[VI_DRAW_V46]\n\nA new measurement of a case's same θ adds independent measurement noise. Its predictive variance is Var_q θ+Var(noise)=.5+1=1.5. Using only the fitted mean would retain variance one and discard latent uncertainty. If observation variance changes to four, prior precision1 and likelihood precision1/4 give posterior mean x/5,variance.8 and predictive variance4.8. The inference rule must match that changed model.\n\n[VI_FILE_amortized_normal.py]\n\nThe complete standard-library program exposes the shared encoder and prints each case's posterior and predictive variance. It also evaluates the fixed mean-zero encoder at x=2: KL=(0−1)²/(2×.5)=1. Sharing a rule does not mean sharing one posterior value. Evaluation after training is constant work per case in this simple linear rule; training a general encoder has its own costs. The VAE & ELBO topic later learns an encoder and a generative decoder together, while the examples here hold the data model fixed.\n\n[VI_DRAW_V47]\n\nIf the per-case family can represent N(x/2,.5) but the shared rule forces mean zero, the family is adequate and the mapping is not. The extra restriction is an **amortization gap**. Failure to optimize that mapping fully adds an optimization gap. Numerical expectations add a third kind of error. Our unrestricted linear encoder represents the exact rule and has no necessary amortization gap. A changed observation process can make a formerly exact rule systematically wrong without any optimizer or Monte Carlo defect.\n\n## 9. Transform constrained unknowns\n\n[VI_DRAW_V48]\n\nNow let the unknown variance be v>0 and introduce τ=log σ, where v=σ²=exp(2τ). An interval on τ maps to a positive-v interval with different width. The transformed joint density must multiply by |dv/dτ|=2exp(2τ), so p(μ,τ,D)=p(μ,exp(2τ),D)2exp(2τ). Mapping q back divides by that Jacobian. For a simpler positive unknown θ=exp u, the corresponding factor is exp u and q_θ(θ)=q_u(log θ)/θ. Omitting a Jacobian changes the probability law rather than merely the optimizer.\n\n[VI_DRAW_V49]\n\nA product Normal(μ)×Normal(τ) maps to Normal(μ)×Lognormal(v). A product Normal(μ)×Inverse-Gamma(v) is a different physical family. The componentwise monotone transformation preserves product independence: it changes only the second coordinate, not its dependence on μ. Do not attribute this family difference to newly induced dependence. The mixing rotation in section3 can instead induce or remove coordinate dependence. A library's “mean-field” label therefore needs its actual working coordinates and parametric factors before it can be compared to another mean-field approximation.\n\n## 10. Approximate an observed-data posterior\n\n[VI_DRAW_V50]\n\nThe paired sleep dataset from Bayesian Inference and MCMC gives ten measurements under each of two drugs, matched by subject ID. Read both values on each subject's connector before subtracting drug1 from drug2. The differences, in extra hours, are [1.2,2.4,1.3,1.3,0,1,1.8,.8,4.6,1.4]. Keep all ten pairs, including the zero; treating twenty rows as independent measurements would change the model. The downloadable canonical [paired CSV](/learn-assets/monte-carlo-mcmc/sleep-pairs.csv), [source metadata](/learn-assets/monte-carlo-mcmc/sleep-provenance.json) and [R documentation](/learn-assets/monte-carlo-mcmc/sleep.Rd) retain the dataset source and license. This model-based paired comparison does not, by itself, establish a causal effect or the validity of an IID Normal model.\n\nLet the differences d_i|μ,v be IID N(μ,v). Use the same prerequisite prior v~Inverse-Gamma(2,2), μ|v~N(0,v). We define IG(α,β) by density β^α/Γ(α) v^(−α−1)exp(−β/v), so β is a scale in this inverse-variance expression. Completing the square gives the Normal–Inverse-Gamma posterior v~IG(α,β), μ|v~N(m,v/κ), with κ=11, m=79/55, α=7 and β=10937/1100. Specifically κ=1+n, m=Σd_i/κ, α=2+n/2 and β=2+½Σd_i²−½κm². The same raw data, prior and parameter convention are necessary for this comparison.\n\n[VI_DRAW_V51]\n\nThe joint contour widens in μ as v grows, because conditional variance is v/κ. Even though the conditional center m stays fixed, μ and v are not independent. The exact μ marginal is Student-t with 2α=14 degrees of freedom, location m and squared scale β/(ακ). Squared scale is not the Student-t variance: the latter is β/((α−1)κ)≈.150647383 because α>1. The joint drawing uses the initial window μ∈[−1,4],v∈[.1,5] and the true unrenormalized density. This display window neither truncates the positive-v family nor replaces the full marginal integral.\n\n[VI_DRAW_V52]\n\nChoose independent factors q_μ=N(u,x) and q_v=IG(a,b), where x is variance. The reciprocal Y=1/v has Gamma density proportional to Y^(a−1)exp(−bY). Its mean a/b is the expected precision E(1/v), which controls the Normal factor’s width. Differentiating that Gamma normalizer gives E log Y=ψ(a)−log b, hence E log v=log b−ψ(a), with ψ(a)=d log Γ(a)/da the digamma function. These are expectations over the whole current variance factor, not substituting its mean variance into a conditional formula. The μ-dependent expected quadratic gives u_new=m and x_new=1/(κ E_qv(1/v))=b/(aκ). Then the v-factor expected log joint gives a_new=α+½ and b_new=β+½κ[x_new+(u_new−m)²]. Use the newly updated μ factor when calculating b; this is ordered CAVI.\n\nThe live start is u=0,x=1,a=7.5,b=12. A complete first sweep gives u=1.436363636364,x=.145454545455,a=7.5,b=10.742727272727 and KL .038713111181, down from 9.148599716421. Choose 0–20 complete sweeps and inspect the expectation operands, before/after factors and full KL ledger. Reset restores the exact start. The analytic optimum is a separate reference: x*=β/(ακ)=.129126328217, a*=7.5 and b*=β(α+.5)/α=10.652922077922. Twenty sweeps agree to the printed precision but remain a finite algorithm endpoint.\n\nWhy is this a global family optimum? At any fixed Normal mean u and variance x>0, the exact optimal v factor is IG(A,B), with A=α+.5 and B=β+κ[x+(u−m)²]/2. Substituting that normalized factor into the ELBO leaves, up to constants,\n\nF(u,x)=½log x−A log(β+κ[x+(u−m)²]/2).\n\nFor every x, the unique best u is m because B is minimized there. At u=m, the derivative in x has the sign of β−ακx: explicitly F'(x)=(β−ακx)/(2x(β+κx/2)). It is positive before x* and negative after. F tends to −∞ as x→0 and as x→∞ since α>0. Thus the interior solution is the unique global optimum, not merely a stationary point found by iteration. The profile also optimizes the entire permitted IG factor, whose optimal normalized form is available for every u,x.\n\n[VI_DRAW_V53]\n\nNow choose q_μ=N(u,x), q_τ=N(t,w) in τ=log σ. The physical variance factor is lognormal, so this is a different family. With C=α log β−log Γ(α)+½log(κ/(2π)), the transformed target log density is C+log2−(2α+1)τ−[β+κ(μ−m)²/2]exp(−2τ). The log2+2τ Jacobian has changed the coefficient of τ. For product factors, E exp(−2τ)=exp(−2t+2w).\n\nThe ELBO is the two Normal entropies plus C+log2−(2α+1)t−B exp(−2t+2w), with B=β+κ[x+(u−m)²]/2. Again u=m is best. At fixed x,w, optimize t to get exp(−2t+2w)=A/B, A=α+.5, and t=w−½log(A/B). The remaining profile separates into the same x-dependent term ½log x−Alog B, plus ½log w−(2α+1)w. The latter is strictly concave for w>0 and tends to −∞ at both endpoints; its unique maximum is w*=1/(4α+2)=1/30. The x proof above gives the same x*=β/(ακ). Hence E(1/v)=α/β and t*=w*−½log(α/β)=.208798937080. This proves the global optimum in this Normal/Normal working family. It is not a finite ADVI fit.\n\n[VI_FILE_sleep_variational_families.py]\n\nSave the complete paired CSV beside the script, then run `python sleep_variational_families.py`; alternatively pass `--data PATH`. Python, NumPy and SciPy are required. The script checks the complete supplied file's SHA256 and IDs1–10 before computing decimal differences as exact Fractions. It calculates posterior parameters independently of rounded display values. `product_ig_kl` uses the closed Normal and IG entropies, E log v and E(1/v) in the normalized target log density. `transformed_kl` instead includes the full τ Jacobian and Normal entropy. All twenty ordered CAVI sweeps are printed and checked for nonincreasing KL, followed by the two analytic family optima, exact marginal variance and decision tails.\n\nThe ordinary SciPy route supplies `digamma`, `gammaln`, Student-t survival probability and Normal survival probability. `sf` evaluates a tail directly instead of subtracting a rounded CDF from one. The exact-data pass is linear in ten pairs, while each of twenty sweeps is constant-size work. This example performs no posterior sampling or numerical optimizer fit, so the final comparisons have no Monte Carlo error. Floating-point and special-function precision still exist; the analytic profile proof supplies globality, not agreement between rounded outputs.\n\n[VI_DRAW_V54]\n\nFor the model-based question Pr(μ>2), the exact t14 tail is .069539013187. Both optimal product families have the same Normal μ factor and report .058379263447. The two joint family KLs differ: .035288585931 for Normal/IG and .046393145689 for Normal/logσ. Here the smaller joint discrepancy does not distinguish their identical μ-tail answers. Their μ variance .129126328217 is smaller than the exact .150647382920. A good global objective is useful evidence about its stated discrepancy; the decision still needs a function-specific check. This is a posterior statement under the paired Normal model and prior, not a causal treatment-effect estimate.\n\n## 11. Check the answer you will report\n\n[VI_DRAW_V55]\n\nAn importance ratio can expose a mismatch between the target and approximation. Return to normalized finite p=(.2,.5,.3), with proposal q. At each state w_i=p_i/q_i. If q_i>0 wherever p_i>0, then a target expectation I=Σp_i f_i also equals Σq_i w_i f_i. The live investigation enumerates the three states exactly; its reported I has **zero Monte Carlo error**. Choose uniform, exact, skewed or missing-B q and a function indicator-A, indicator-B or state value0,1,2. Reset returns uniform q and indicator-B.\n\nTwo possible sampled estimators have different precision. With n independent draws from q and known normalized p, the raw-IS estimate is the mean of w f. Its single-draw variance is V_raw=Σp_i²f_i²/q_i−I², so its mean variance is exactly V_raw/n. The self-normalized estimate divides Σw f by Σw. Its large-n variance coefficient is V_SN=Σp_i²(f_i−I)²/q_i, giving asymptotic variance V_SN/n under the needed conditions. The ratio estimate can be biased at finite n; the coefficient is not its exact finite-n variance. Centering f is essential in that coefficient.\n\nUniform q and indicator-B give I=.5, ratio second moment Σp_i²/q_i=1.14, V_raw=.5 and V_SN=.285. These are distinct quantities. Exact q=p has all ratios one; the indicator still has ordinary Bernoulli variance .25. Flat ratios do not make random function draws deterministic. A skewed q=(.1,.8,.1) gives raw indicator-B variance .0625 but SN coefficient .403125: one ratio-only quality number does not settle every function's precision. Missing-B q has q_B=0<p_B=.5 and violates target support, so the investigation reports invalid support and does not fabricate a finite full-target answer. Our finite full-support moments are finite; continuous importance ratios can instead have heavy or undefined moments.\n\n[VI_FILE_finite_vi_importance.py]\n\nThe complete programme enumerates every preset and function using exact Fraction sums, then checks corresponding NumPy array calculations. Support is checked before dividing. It prints I, ratio second moment, raw single-draw variance and SN asymptotic coefficient with their full names. There is no random count, fitted Pareto parameter or PSIS claim. Each supported function needs only three rows, constant-size work here. Changing a proposal may improve one reported function and harm another. A finite Monte Carlo ratio estimate would be a different object from this exact enumeration.\n\n[VI_DRAW_V56]\n\nEven apparently benign sampled ratios can miss a target mode. The selected q-centered points lie near one of the two target peaks; the unsampled distant peak has no ratio in that sample window. These selected points are an explanatory construction, not a representative random benchmark. PSIS uses sampled weight-tail behavior to diagnose and stabilize certain importance calculations, but a sample that never sees an important region cannot prove that the region is absent. Check target support, exploration and the function you need. A finite-state exact enumeration cannot validate a full continuous PSIS implementation.\n\n[VI_DRAW_V57]\n\nValidation can also repeat the generative experiment: draw a latent θ from the model prior, simulate data, fit the posterior, then evaluate its CDF at the true simulated θ. In the exact Normal example θ~N(0,1), x|θ~N(θ,1), posterior CDF is Φ((θ−x/2)/√.5). Conditional on x, θ has exactly that continuous posterior, so the probability integral transform makes this rank Uniform(0,1); averaging over x preserves it. The fitted median is x/2 and is marked separately from the true θ. This explains the reference law without an invented histogram.\n\nBroader **variational simulation-based calibration**, or VSBC, uses repeated generative calculations to assess properties of approximate inference; a symmetry check can illuminate bias of central estimates. Symmetry alone does not certify correct spread, joint dependence, or fidelity on one fixed observed dataset. Model simulation can also be internally consistent while the model misdescribes real observations. Use calibration alongside observed-data, model and decision checks, not as a replacement for them.\n\n[VI_DRAW_V58]\n\nThe maintained PyMC route fits the same controlled target from CAVI: normalized N((1,−1),Σ), unit marginals and ρ=.8, without observations. This isolates inference error from learning a model from data. `pm.MvNormal` defines the target and `pm.fit(method=\"advi\")` selects independent Normal factors in unconstrained coordinates. θ already lies in ℝ², so this case requires no coordinate Jacobian. The complete script specifies PyMC6.3.2, NumPy2.3.5 and SciPy1.18.1; use its installation command and run `python pymc_variational.py`.\n\n[VI_FILE_pymc_variational.py]\n\nThe fixed run uses seed51,15,000 Adam updates,rate.01 and20 Monte Carlo samples per objective gradient. Those samples are a gradient budget, not20 retained posterior samples for the final discrepancy. The recorded fitted means [.9865,−.9703] and variances [.3666,.3600] yield achieved exact Gaussian KL .513277. Its decomposition is family gap .510826 plus optimization gap .002451. The verifier uses a Cholesky solve and log determinant from fitted parameters, so this final comparison has no q-sampling error. PyMC's noisy running “Average Loss” is a different statistic and need not equal achieved KL. A fixed budget and a small declared tolerance are not convergence proofs.\n\nThe recorded changed-ρ=0 run uses means [1.0026,−.9687],variances [1.0063,.9869] and achieved KL .000547. Its independent family can represent the target, so its family gap is zero and the residual is optimization error. Mean-field state requires O(d) parameters; full covariance requires O(d²) and extra matrix work. A dense target can still cost quadratic work per draw after factorization. In a constrained real model, read the engine's transforms, factor family, finite-domain behavior and stopping settings before interpreting its uncertainty.\n\n[VI_DRAW_V59]\n\nStart with the reported quantity. The correlated-Gaussian sum and difference need different covariance information; the mixture sign needs both modes and their weights; the sleep tail needs an adequate marginal tail. The actual examples trace each target, allowed family, achieved state and probability or variance. If q* exists, achieved KL decomposes algebraically into best-family KL plus the excess achieved KL; numerical estimates of either add their own error. More draws from a fixed q reduce expectation uncertainty without tilting its contour or restoring a missing mode. Multiple starts, better gradients and stopping rules address optimization; transformations or richer families address representation. A q-based predictive check draws θ from q and then observations from the likelihood, but good predictions alone need not identify the correct latent posterior.\n\n[VI_DRAW_V60]\n\nA full Gaussian can represent the tilted Gaussian here, using a positive-definite parameterization C=LLᵀ. A mixture combines actual density components and can represent separated explanations. Structured blocks retain selected dependencies. An invertible normalizing flow transforms a base density with a tractable Jacobian to represent more flexible shapes. These alternatives change memory, evaluation, sampling and fitting costs, and none guarantees accurate finite inference on arbitrary targets. Pathfinder supplies a different approximate-Gaussian route from optimization paths; it has its own geometry, path selection and importance-resampling choices. The focused resources below explain how to choose and evaluate those different representations.\n\n## 12. Practise under changed conditions\n\n[VI_PRACTICE_OLD]\n\n[VI_PRACTICE_NEW]\n\nThese changed cases test whether a family, support assumption, update order or estimator construction still answers the intended question. When a result changes, name which assumption or operation changed before choosing more computation.\n\nYou can now construct an objective, fit factors or stochastic parameters, distinguish what the fitted family can express, and inspect the quantity an action needs. **Exponential Families & Sufficient Statistics** next explains the distribution coordinates and compact data summaries that made the conjugate local/global updates simple. Entropy/KL, VAE and Normalizing Flows later develop their broader objectives and architectures.\n\n[VI_FILES_ALL]\n\nThe file index includes all twelve complete programmes, their setup, and the paired CSV and source documentation needed by the observed-data example. Use the complete source at its first appearance to trace an operation; the index supplies Copy and Download for reuse. Seven scratch programmes need only Python's standard library. The four new investigations use NumPy or SciPy as specified in each file. The maintained ADVI file gives its pinned PyMC installation command. Read each output alongside its inputs and assumptions; an objective value alone does not identify the quality of a decision.\n\n[VI_RESOURCES_ALL]\n",
  "programmes": {
    "finite_elbo.py": {
      "filename": "finite_elbo.py",
      "key": "finite",
      "title": "Calculate an ELBO and the best member of a restricted family",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/finite_elbo.py",
      "sourceSha256": "8f2bcba9ac3d6d91a907bd8399ebcb288c724bb219e4753cede6397c44934835",
      "code": "import math\n\njoint = [0.08, 0.20, 0.12]\nevidence = sum(joint)\nposterior = [weight / evidence for weight in joint]\n\ndef inspect(q):\n    elbo = sum(prob * (math.log(weight) - math.log(prob))\n               for prob, weight in zip(q, joint) if prob > 0)\n    kl = sum(prob * math.log(prob / target)\n             for prob, target in zip(q, posterior) if prob > 0)\n    return elbo, kl\n\n# Under qB=qC, differentiate the one-variable KL and solve for qA.\nscale = posterior[0] + 2 * math.sqrt(posterior[1] * posterior[2])\nfirst = posterior[0] / scale\nrestricted = [first, (1 - first) / 2, (1 - first) / 2]\nprint(\"posterior\", [round(p, 6) for p in posterior])\nfor label, q in [(\"uniform\", [1/3] * 3),\n                 (\"restricted\", restricted), (\"exact\", posterior)]:\n    elbo, kl = inspect(q)\n    print(label, [round(p, 6) for p in q],\n          round(elbo, 6), round(kl, 6))\n    assert math.isclose(elbo + kl, math.log(evidence), abs_tol=1e-12)\n",
      "output": "posterior [0.2, 0.5, 0.3]\nuniform [0.333333, 0.333333, 0.333333] -0.986531 0.07024\nrestricted [0.205213, 0.397393, 0.397393] -0.942022 0.025732\nexact [0.2, 0.5, 0.3] -0.916291 0.0",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/finite_elbo.py.display.txt",
      "outputSha256": "60acc5d02fa68ca7733bef0a6eb7a51c3f001560fa6749d990b56a0eafcdf7a5",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/finite_elbo.py"
    },
    "gaussian_decisions.py": {
      "filename": "gaussian_decisions.py",
      "key": "covariance",
      "title": "Check the uncertainty of two different decisions",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/gaussian_decisions.py",
      "sourceSha256": "7526dd008bc770f9674fff6841fa3d4db6903e10dd350b80301337f24469e14d",
      "code": "import math\n\nrho = 0.8\nvariance = 1 - rho * rho\ntarget = [[1.0, rho], [rho, 1.0]]\nmean_field = [[variance, 0.0], [0.0, variance]]\n\ndef linear_variance(weights, covariance):\n    return sum(weights[i] * covariance[i][j] * weights[j]\n               for i in range(2) for j in range(2))\n\nprint(\"marginal variances\", target[0][0], round(variance, 3))\nfor label, weights in [(\"sum\", [1, 1]), (\"difference\", [1, -1])]:\n    print(label, round(linear_variance(weights, target), 3),\n          round(linear_variance(weights, mean_field), 3))\nprint(\"best mean-field KL\", round(-0.5 * math.log(variance), 6))\nprint(\"radius-one mass in 2D\", round(1 - math.exp(-0.5), 6))\n",
      "output": "marginal variances 1.0 0.36\nsum 3.6 0.72\ndifference 0.4 0.72\nbest mean-field KL 0.510826\nradius-one mass in 2D 0.393469",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/gaussian_decisions.py.display.txt",
      "outputSha256": "48e01d2a88e68da08112fbc27866804f2a1f5a957e1f0c4dbd8e8b03876fe036",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/gaussian_decisions.py"
    },
    "gaussian_cavi.py": {
      "filename": "gaussian_cavi.py",
      "key": "coordinates",
      "title": "Run exact factor updates and retain the family gap",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/gaussian_cavi.py",
      "sourceSha256": "f1d5f5d86233dcc339db6e38ff7931f24052299643a65b6d4a5f861feb8af021",
      "code": "import math\n\nrho = 0.8\ntarget_mean = [1.0, -1.0]\nmean = [-2.0, 2.0]\nvariance = 1 - rho * rho\nfamily_gap = -0.5 * math.log(variance)\n\ndef kl(values):\n    dx, dy = [values[i] - target_mean[i] for i in range(2)]\n    return family_gap + (dx*dx - 2*rho*dx*dy + dy*dy) / (2*variance)\n\nprevious = kl(mean)\nfor update in range(1, 25):\n    coordinate = (update - 1) % 2\n    other = 1 - coordinate\n    mean[coordinate] = (target_mean[coordinate]\n                        + rho * (mean[other] - target_mean[other]))\n    current = kl(mean)\n    assert current <= previous + 1e-12\n    previous = current\n    if update in [1, 2, 4, 24]:\n        print(update, [round(value, 6) for value in mean],\n              round(current, 6))\nprint(\"limit KL\", round(family_gap, 6))\n",
      "output": "1 [3.4, 2.0] 5.010826\n2 [3.4, 0.92] 3.390826\n4 [2.536, 0.2288] 1.690474\n24 [1.017709, -0.985833] 0.510982\nlimit KL 0.510826",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/gaussian_cavi.py.display.txt",
      "outputSha256": "d5a658a4777d774396fa18226db9583ccc7f5506e51edfb08fff10cfab252249",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/gaussian_cavi.py"
    },
    "mixture_projection.py": {
      "filename": "mixture_projection.py",
      "key": "mixture",
      "title": "Preserve the two-mode comparison with stable log-density integration",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/mixture_projection.py",
      "sourceSha256": "267d22b7417b88b5529c3c91388c3feaf4e6fec2fc94fcfddade6282aadf87b1",
      "code": "import math\n\ndef log_normal(x, mean=0.0, sd=1.0):\n    return -math.log(sd) - 0.5*math.log(2*math.pi) - 0.5*((x-mean)/sd)**2\n\ndef log_target(x):\n    first, second = log_normal(x, -3), log_normal(x, 3)\n    top = max(first, second)\n    return top + math.log(math.exp(first-top) + math.exp(second-top)) - math.log(2)\n\ndef reverse_kl(mean, sd, intervals=1440):\n    # E under q becomes integration against standard-normal noise.\n    step = 18 / intervals\n    total = 0.0\n    for index in range(intervals + 1):\n        noise = -9 + index * step\n        value = mean + sd * noise\n        weight = 1 if index in (0, intervals) else (4 if index % 2 else 2)\n        total += weight * math.exp(log_normal(noise)) * (\n            log_normal(value, mean, sd) - log_target(value))\n    return total * step / 3\n\nfor mean, sd in [(0, 3), (3, 1), (-3, 1)]:\n    kl = reverse_kl(mean, sd)\n    assert abs(kl - reverse_kl(mean, sd, 2880)) < 1e-8\n    right = 0.5 * (1 + math.erf(mean / (sd * math.sqrt(2))))\n    print(mean, sd, round(kl, 3), round(right, 6))\nprint(\"target probability of positive value\", 0.5)\n",
      "output": "0 3 0.877 0.5\n3 1 0.689 0.99865\n-3 1 0.689 0.00135\ntarget probability of positive value 0.5",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/mixture_projection.py.display.txt",
      "outputSha256": "fadd98abd5fcd1ff25a9a85342a3d1f4e9dc91f726d1bf2db94c84592e9c43da",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/mixture_projection.py"
    },
    "stochastic_vi.py": {
      "filename": "stochastic_vi.py",
      "key": "optimizer",
      "title": "Fit a Gaussian using actual reparameterized stochastic gradients",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/stochastic_vi.py",
      "sourceSha256": "844a08ce9bf4450e768e66d433026e2eb6a6f63301eb8a6bd335697f95723fdc",
      "code": "import math\nimport random\n\n# The target is known here so we can validate inference independently.\ntarget_mean, target_sd = 1.5, 0.7\nmean, log_sd = 0.0, math.log(1.2)\nrng = random.Random(7)\nfirst_moment, second_moment = [0.0, 0.0], [0.0, 0.0]\n\ndef exact_kl(mean, log_sd):\n    sd = math.exp(log_sd)\n    return (math.log(target_sd/sd)\n            + (sd*sd + (mean-target_mean)**2)/(2*target_sd**2) - 0.5)\n\nfor iteration in range(1, 2001):\n    sd = math.exp(log_sd)\n    gradients = [0.0, 0.0]\n    for _ in range(64):\n        noise = rng.gauss(0, 1)\n        value = mean + sd * noise\n        slope = (target_mean - value) / target_sd**2\n        gradients[0] += slope / 64\n        gradients[1] += (1 + sd * noise * slope) / 64\n    # Adam ascent: maximize ELBO, hence the plus sign.\n    parameters = [mean, log_sd]\n    rate = 0.03 / math.sqrt(1 + iteration / 200)\n    for i, gradient in enumerate(gradients):\n        first_moment[i] = 0.9*first_moment[i] + 0.1*gradient\n        second_moment[i] = 0.999*second_moment[i] + 0.001*gradient**2\n        corrected_first = first_moment[i] / (1 - 0.9**iteration)\n        corrected_second = second_moment[i] / (1 - 0.999**iteration)\n        parameters[i] += rate * corrected_first / (math.sqrt(corrected_second) + 1e-8)\n    mean, log_sd = parameters\n    assert math.isfinite(mean) and math.isfinite(log_sd)\n    if iteration in [100, 500, 2000]:\n        print(iteration, round(mean, 4), round(math.exp(log_sd), 4),\n              round(exact_kl(mean, log_sd), 6))\nprint(\"exact mean and sd\", target_mean, target_sd)\n",
      "output": "100 1.4879 0.7133 0.000507\n500 1.514 0.7122 0.0005\n2000 1.468 0.6858 0.001462\nexact mean and sd 1.5 0.7",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/stochastic_vi.py.display.txt",
      "outputSha256": "4750aef669fa60b117b7670304cac8b879a9a62d2f35ea044c8ef9195b557db9",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/stochastic_vi.py"
    },
    "minibatch_vi.py": {
      "filename": "minibatch_vi.py",
      "key": "minibatches",
      "title": "Prove a minibatch gradient is unbiased by checking every possible batch",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/minibatch_vi.py",
      "sourceSha256": "fdcba6bcc01404b6b1279d34017afd10bdc24c062e0f93e2d16cf3e2e6a98a99",
      "code": "from itertools import combinations\nfrom statistics import mean\n\ndata = [1.0, 2.0, 4.0, 5.0]\nq_mean, q_sd = 1.0, 0.5\nsize, batch_size = len(data), 2\n# Prior N(0,1), observations independent N(theta,1).\nfull_mean_gradient = sum(x - q_mean for x in data) - q_mean\nfull_log_sd_gradient = 1 - q_sd**2 * (1 + size)\nestimates, wrong_estimates = [], []\nfor indices in combinations(range(size), batch_size):\n    likelihood_gradient = sum(data[i] - q_mean for i in indices)\n    estimates.append(size/batch_size * likelihood_gradient - q_mean)\n    # Wrong: the prior is counted too many times as well.\n    wrong_estimates.append(size/batch_size * (likelihood_gradient - q_mean))\nprint(\"all batch mean-gradients\", estimates)\nprint(\"full and mean batch\", full_mean_gradient, mean(estimates))\nprint(\"wrong mean batch\", mean(wrong_estimates))\nprint(\"full log-sd gradient\", full_log_sd_gradient)\nprint(\"exact posterior mean and variance\", sum(data)/(1+size), 1/(1+size))\n",
      "output": "all batch mean-gradients [1.0, 5.0, 7.0, 7.0, 9.0, 13.0]\nfull and mean batch 7.0 7.0\nwrong mean batch 6.0\nfull log-sd gradient -0.25\nexact posterior mean and variance 2.4 0.2",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/minibatch_vi.py.display.txt",
      "outputSha256": "2b2d3ea0e9886eeacd962f70dda0bcd165a72bc72745441085b0120ad1968252",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/minibatch_vi.py"
    },
    "amortized_normal.py": {
      "filename": "amortized_normal.py",
      "key": "amortization",
      "title": "A shared inference rule can output different posteriors and predictions",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/amortized_normal.py",
      "sourceSha256": "e776c4011eb7e942f552e7c366c140b2cbbb6dfefe5f00d69c1573da40211469",
      "code": "from math import sqrt\n\n# Independent cases: theta ~ N(0,1); one observation x | theta ~ N(theta,1).\ndef encoder(x):\n    return x / 2, sqrt(0.5)\n\nfor observed in [-2, 0, 2]:\n    mean, sd = encoder(observed)\n    posterior_variance = sd * sd\n    # A new measurement of the same latent theta adds unit observation variance.\n    predictive_variance = 1 + posterior_variance\n    print(observed, mean, round(posterior_variance, 3),\n          round(predictive_variance, 3))\n\n# These three observations are separate cases, not three updates of one theta.\n# A fixed mean-zero encoder misses the conditional means for +/-2.\nprint(\"restricted mean-zero encoder KL for x=2\", (0-1)**2 / (2*0.5))\n",
      "output": "-2 -1.0 0.5 1.5\n0 0.0 0.5 1.5\n2 1.0 0.5 1.5\nrestricted mean-zero encoder KL for x=2 1.0",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/amortized_normal.py.display.txt",
      "outputSha256": "ff39653034abc5be272e58922d532a55e40df285fcea54712bd411f150f580f7",
      "outputRole": "Preserved full original expected contract; attributed historical execution, not fresh raw stdout",
      "originalModule": "src/learn/data/variational-inference-examples.js",
      "originalModuleSha256": "cb1308c6ea5e4d73743f3459a262686fa99d8bccf8040154b02d35837a6cabd4",
      "newExecution": false,
      "downloadUrl": "/learn-assets/variational-inference/amortized_normal.py"
    },
    "gaussian_scale_estimators.py": {
      "filename": "gaussian_scale_estimators.py",
      "title": "Compare pathwise and Price scale contributions",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/gaussian_scale_estimators.py",
      "sourceSha256": "96b38cbb76e23322d91a62080a465ee6a4d971d94d5699ed7b5be17a9de7bbbd",
      "code": "\"\"\"Pathwise and Price scale gradients for a separate quadratic target N(0,1).\n\nRequires NumPy. rho=log(s); gradients minimize KL (negative ELBO).\nSeed51 supplies10,000 independent standard-Normal diagnostic draws per case.\n\"\"\"\nfrom fractions import Fraction as F\nimport numpy as np\n\nrng = np.random.default_rng(51)\ndraw_count = 10000\nprint(\"target mean0 variance1; seed51; independent draw count per case\", draw_count)\nprint(\"m s exact-scale-mean exact-path-variance empirical-path-mean empirical-path-variance price-mean price-variance empirical-mean-component-variance\")\nfor mean in [F(0), F(1), F(-2)]:\n    for sd in [F(1,2), F(1), F(2)]:\n        exact_mean = sd*sd-1\n        exact_variance = mean*mean*sd*sd+2*sd**4\n        epsilon = rng.standard_normal(draw_count)\n        x = float(mean)+float(sd)*epsilon\n        pathwise_scale = x*float(sd)*epsilon-1\n        price_scale = np.full(draw_count, float(exact_mean))\n        mean_component = x\n        assert np.isfinite(pathwise_scale).all()\n        assert np.all(price_scale == float(exact_mean))\n        print(float(mean), float(sd), str(exact_mean), str(exact_variance),\n              format(pathwise_scale.mean(),\".8f\"), format(pathwise_scale.var(ddof=1),\".8f\"),\n              format(price_scale.mean(),\".8f\"), format(price_scale.var(ddof=1),\".8f\"),\n              format(mean_component.var(ddof=1),\".8f\"))\n",
      "output": "target mean0 variance1; seed51; independent draw count per case 10000\nm s exact-scale-mean exact-path-variance empirical-path-mean empirical-path-variance price-mean price-variance empirical-mean-component-variance\n0.0 0.5 -3/4 1/8 -0.74844860 0.12939477 -0.75000000 0.00000000 0.25153241\n0.0 1.0 0 2 -0.01531996 1.84304629 0.00000000 0.00000000 0.98469472\n0.0 2.0 3 32 2.93937697 29.89260986 3.00000000 0.00000000 3.93960928\n1.0 0.5 -3/4 3/8 -0.76061123 0.36223418 -0.75000000 0.00000000 0.24395083\n1.0 1.0 0 3 -0.01507203 2.95640219 0.00000000 0.00000000 0.99858858\n1.0 2.0 3 36 2.98541788 37.83619321 3.00000000 0.00000000 3.99919724\n-2.0 0.5 -3/4 9/8 -0.73894865 1.16250157 -0.75000000 0.00000000 0.25669456\n-2.0 1.0 0 6 -0.02412422 5.72041038 0.00000000 0.00000000 0.99008443\n-2.0 2.0 3 48 2.96431241 47.83726077 3.00000000 0.00000000 3.96347703",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/gaussian_scale_estimators.py.display.txt",
      "outputSha256": "0509d1b37539938767c028f5bac22e6d949df6ea7f4a5100f59b88074a421373",
      "stderrPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/gaussian_scale_estimators.py.r2.stderr.txt",
      "stderrSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "outputRole": "Presentation-only derivative of the retained recorded output, removing exactly mapped explanation sentences; no successor scientific main or fit replay.",
      "newExecution": false,
      "executionReceipt": "docs/teaching/math-foundations-reading-flow/variational-inference/content-new-gaussian-programme-repair-r2.json",
      "executionSourceSha256": "d79d1b2d2908b2f90adfcf21b25ccee502ad7d02c711663442c8d4d82f13717d",
      "executionOutputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/gaussian_scale_estimators.py.r2.stdout.txt",
      "executionOutputSha256": "0324e187b231db6006bf73994e0e54a383611f43a0c883f73b86b7b59b6b7acf",
      "downloadUrl": "/learn-assets/variational-inference/gaussian_scale_estimators.py"
    },
    "hierarchical_svi.py": {
      "filename": "hierarchical_svi.py",
      "title": "Enumerate stochastic local/global updates",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/hierarchical_svi.py",
      "sourceSha256": "5354e932ed70fcea503ab4554ccd5b7fcb724d1dcf1e3dcc5576faeb7204c3e3",
      "code": "\"\"\"Local/global Gaussian VI with exact finite minibatch proposals.\n\nRequires Python 3, NumPy and SciPy. All Normal parameters use variance.\nThe four observations are synthetic; no observational dataset is implied.\n\"\"\"\nfrom fractions import Fraction as F\nfrom itertools import combinations\nimport math\nimport numpy as np\nfrom scipy.linalg import solve\n\ny = [F(1), F(2), F(4), F(5)]\nn = len(y)\nprecision = F(n + 1)\nrho = F(1, 4)\ninitial_mean = F(1)\nselected_ids = (0, 2)\n\n# mu~N(0,1), zi|mu~N(mu,1), yi|zi~N(zi,1).\ndef optimize_locals(mean):\n    return [(value + mean) / 2 for value in y]\n\nlocals_initial = optimize_locals(initial_mean)\nbatches = list(combinations(range(n), 2))\nproposals = [F(n, 2) * sum(locals_initial[i] for i in ids)\n             for ids in batches]\nfull_h = sum(locals_initial)\ninitial_h = precision * initial_mean\n\nprint(\"synthetic observed y\", [float(value) for value in y])\nprint(\"initial optimized local means\", [float(v) for v in locals_initial])\nprint(\"local variance\", .5, \"global product variance\", float(1 / precision))\nfor ids, h in zip(batches, proposals):\n    stepped = (1-rho)*initial_h + rho*h\n    print(\"batch\", list(ids), \"h\", float(h), \"proposed mean\",\n          float(h/precision), \"quarter-step mean\", float(stepped/precision))\nassert sum(proposals) / len(proposals) == full_h\nselected_h = proposals[batches.index(selected_ids)]\nassert selected_h == 7\nassert ((1-rho)*initial_h+rho*selected_h)/precision == F(11, 10)\nassert ((1-rho)*initial_h+rho*full_h)/precision == F(23, 20)\nprint(\"full-data/mean-batch reference h\", float(full_h), \"proposed mean\",\n      float(full_h/precision), \"quarter-step mean\",\n      float(((1-rho)*initial_h+rho*full_h)/precision))\nprint(\"selected default IDs\", list(selected_ids))\nprint(\"global prior precision once\", float(precision),\n      \"incorrect scaled-prior precision\", float(F(n, 2)*(1+2)))\n\n# Independent library reference for the full five-dimensional Gaussian.\nP = np.diag([float(precision)] + [2.] * n)\nP[0, 1:] = -1\nP[1:, 0] = -1\nnatural = np.array([0.] + [float(value) for value in y])\nexact_mean = solve(P, natural, assume_a=\"pos\")\nexact_covariance = solve(P, np.eye(n+1), assume_a=\"pos\")\nproduct_covariance = np.diag([float(1/precision)] + [.5]*n)\nlogdet_exact = np.linalg.slogdet(exact_covariance)[1]\nlogdet_product = np.linalg.slogdet(product_covariance)[1]\n\ndef joint_kl(mean, local_means):\n    delta = np.array([float(mean)] + [float(v) for v in local_means])-exact_mean\n    return .5*(np.trace(P@product_covariance) + delta@P@delta\n               -(n+1) + logdet_exact-logdet_product)\n\nfamily_gap = .5*math.log(5/3)\nassert np.allclose(exact_mean, [2, 1.5, 2, 3, 3.5])\nassert math.isclose(exact_covariance[0, 0], 1/3, abs_tol=1e-14)\nassert math.isclose(joint_kl(F(2), optimize_locals(F(2))), family_gap,\n                    abs_tol=1e-14)\nprint(\"true joint mean\", exact_mean.tolist())\nprint(\"true global variance\", format(exact_covariance[0, 0], \".12f\"),\n      \"product global variance\", .2, \"family KL\", format(family_gap, \".12f\"))\n\n# Ordered CAVI: optimize all locals, then the global factor. This is separate\n# from the single selected stochastic natural-parameter step printed above.\nmean = initial_mean\nlocal_means = locals_initial\nprevious_kl = joint_kl(mean, local_means)\nprint(\"CAVI\", 0, \"mu\", float(mean), \"locals\", [float(v) for v in local_means],\n      \"joint KL\", format(previous_kl, \".12f\"))\nfor sweep in range(1, 11):\n    local_means = optimize_locals(mean)\n    mean = sum(local_means)/precision\n    assert mean == 2 + (initial_mean-2)*F(2, 5)**sweep\n    kl = joint_kl(mean, local_means)\n    assert kl <= previous_kl + 1e-12\n    print(\"CAVI\", sweep, \"mu\", float(mean), \"locals\",\n          [float(v) for v in local_means], \"joint KL\", format(kl, \".12f\"))\n    previous_kl = kl\n",
      "output": "synthetic observed y [1.0, 2.0, 4.0, 5.0]\ninitial optimized local means [1.0, 1.5, 2.5, 3.0]\nlocal variance 0.5 global product variance 0.2\nbatch [0, 1] h 5.0 proposed mean 1.0 quarter-step mean 1.0\nbatch [0, 2] h 7.0 proposed mean 1.4 quarter-step mean 1.1\nbatch [0, 3] h 8.0 proposed mean 1.6 quarter-step mean 1.15\nbatch [1, 2] h 8.0 proposed mean 1.6 quarter-step mean 1.15\nbatch [1, 3] h 9.0 proposed mean 1.8 quarter-step mean 1.2\nbatch [2, 3] h 11.0 proposed mean 2.2 quarter-step mean 1.3\nfull-data/mean-batch reference h 8.0 proposed mean 1.6 quarter-step mean 1.15\nselected default IDs [0, 2]\nglobal prior precision once 5.0 incorrect scaled-prior precision 6.0\ntrue joint mean [1.9999999999999996, 1.5, 2.0, 2.9999999999999996, 3.4999999999999996]\ntrue global variance 0.333333333333 product global variance 0.2 family KL 0.255412811883\nCAVI 0 mu 1.0 locals [1.0, 1.5, 2.5, 3.0] joint KL 1.755412811883\nCAVI 1 mu 1.6 locals [1.0, 1.5, 2.5, 3.0] joint KL 0.855412811883\nCAVI 2 mu 1.84 locals [1.3, 1.8, 2.8, 3.3] joint KL 0.351412811883\nCAVI 3 mu 1.936 locals [1.42, 1.92, 2.92, 3.42] joint KL 0.270772811883\nCAVI 4 mu 1.9744 locals [1.468, 1.968, 2.968, 3.468] joint KL 0.257870411883\nCAVI 5 mu 1.98976 locals [1.4872, 1.9872, 2.9872, 3.4872] joint KL 0.255806027883\nCAVI 6 mu 1.995904 locals [1.49488, 1.99488, 2.99488, 3.49488] joint KL 0.255475726443\nCAVI 7 mu 1.9983616 locals [1.497952, 1.997952, 2.997952, 3.497952] joint KL 0.255422878213\nCAVI 8 mu 1.99934464 locals [1.4991808, 1.9991808, 2.9991808, 3.4991808] joint KL 0.255414422496\nCAVI 9 mu 1.999737856 locals [1.49967232, 1.99967232, 2.99967232, 3.49967232] joint KL 0.255413069581\nCAVI 10 mu 1.9998951424 locals [1.499868928, 1.999868928, 2.999868928, 3.499868928] joint KL 0.255412853115",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/hierarchical_svi.py.display.txt",
      "outputSha256": "aa675431f2ba9424e1014b711671f990d5f5cbac52132bc42513a417505cd86a",
      "stderrPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/hierarchical_svi.py.stderr.txt",
      "stderrSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "outputRole": "Presentation-only derivative of the retained recorded output, removing exactly mapped explanation sentences; no successor scientific main or fit replay.",
      "newExecution": false,
      "executionReceipt": "docs/teaching/math-foundations-reading-flow/variational-inference/content-new-programme-execution-r1.json",
      "executionSourceSha256": "977183a500dbd2117e33db5a26e5579eecbb686779fda450904f9a75a6e42df4",
      "executionOutputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/hierarchical_svi.py.stdout.txt",
      "executionOutputSha256": "b8e7ae1da91c934dbb7ad60fc2dd96a5d389a8e27ec6134fa071b410131b780d",
      "downloadUrl": "/learn-assets/variational-inference/hierarchical_svi.py"
    },
    "sleep_variational_families.py": {
      "filename": "sleep_variational_families.py",
      "title": "Compare two product families on paired sleep differences",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/sleep_variational_families.py",
      "sourceSha256": "cebaa1dbd2187f60d1236e3c59387580e6e69e2551a13f41430583e4995f571a",
      "code": "\"\"\"Two product VI families for the exact paired-sleep NIG posterior.\n\nRequires NumPy/SciPy. Place the supplied sleep-pairs.csv beside this file,\nor pass --data PATH. Normal parameters use variance; IG density is proportional\nto v**(-shape-1)*exp(-scale/v). There is no fit, RNG or posterior sampling.\n\"\"\"\nimport argparse\nimport csv\nfrom fractions import Fraction as F\nimport hashlib\nimport math\nfrom pathlib import Path\nimport numpy as np\nfrom scipy.special import digamma, gammaln\nfrom scipy.stats import norm, t\n\nparser = argparse.ArgumentParser()\nparser.add_argument(\"--data\", type=Path, default=Path(__file__).with_name(\"sleep-pairs.csv\"))\ndata_path = parser.parse_args().data\nraw = data_path.read_bytes()\nexpected_hash = \"3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6\"\nassert hashlib.sha256(raw).hexdigest() == expected_hash, \"Use the complete supplied canonical CSV\"\nrows = list(csv.DictReader(raw.decode(\"utf-8\").splitlines()))\nassert [int(row[\"id\"]) for row in rows] == list(range(1, 11))\ndifferences = [F(row[\"drug2_extra_hours\"])-F(row[\"drug1_extra_hours\"])\n               for row in rows]\nassert differences == [F(v) for v in [\"1.2\",\"2.4\",\"1.3\",\"1.3\",\"0\",\"1\",\"1.8\",\".8\",\"4.6\",\"1.4\"]]\nfor row, value in zip(rows, differences):\n    print(\"pair\", row[\"id\"], \"drug2 minus drug1\", str(value))\n\n# Prior: v~IG(2,2), mu|v~N(0,v). The model treats differences as IID Normal.\nn = len(differences)\nkappa = F(n+1)\nposterior_mean = sum(differences)/kappa\nalpha = F(2)+F(n, 2)\nbeta = F(2)+sum(value*value for value in differences)/2-kappa*posterior_mean**2/2\nassert (kappa, posterior_mean, alpha, beta) == (11, F(79,55), 7, F(10937,1100))\nK, M, A, B = map(float, (kappa, posterior_mean, alpha, beta))\nprint(\"posterior kappa, m, alpha, beta\", str(kappa), str(posterior_mean), str(alpha), str(beta))\nlog_constant = A*math.log(B)-gammaln(A)+.5*math.log(K/(2*math.pi))\n\ndef normal_entropy(variance):\n    return .5*math.log(2*math.pi*math.e*variance)\n\ndef product_ig_kl(mean, variance, shape, scale):\n    elogv = math.log(scale)-digamma(shape)\n    einvv = shape/scale\n    elogp = log_constant-(A+1.5)*elogv-(B+.5*K*(variance+(mean-M)**2))*einvv\n    entropy_v = shape+math.log(scale)+gammaln(shape)-(1+shape)*digamma(shape)\n    return -normal_entropy(variance)-entropy_v-elogp\n\ndef transformed_kl(mean, variance, tau_mean, tau_variance):\n    einvv = math.exp(-2*tau_mean+2*tau_variance)\n    # v=exp(2*tau): log inverse-transform Jacobian is log(2)+2*tau.\n    elogp = log_constant+math.log(2)-(2*A+1)*tau_mean-(B+.5*K*(variance+(mean-M)**2))*einvv\n    return -normal_entropy(variance)-normal_entropy(tau_variance)-elogp\n\nmean, variance, shape, scale = 0., 1., A+.5, 12.\nkl = product_ig_kl(mean, variance, shape, scale)\nprint(\"CAVI\", 0, \"m,var,a,b,KL\", *[format(v,\".12f\") for v in [mean,variance,shape,scale,kl]])\nfor sweep in range(1, 21):\n    mean = M\n    variance = scale/(shape*K)\n    scale = B+.5*K*(variance+(mean-M)**2)\n    updated_kl = product_ig_kl(mean, variance, shape, scale)\n    assert updated_kl <= kl+1e-12\n    kl = updated_kl\n    print(\"CAVI\", sweep, \"m,var,a,b,KL\", *[format(v,\".12f\") for v in [mean,variance,shape,scale,kl]])\n\n# Analytic global optima from the separately derived family profiles.\noptimal_variance = B/(A*K)\noptimal_shape = A+.5\noptimal_scale = B*optimal_shape/A\ntau_variance = 1/(4*A+2)\ntau_mean = tau_variance-.5*math.log(A/B)\nig_gap = product_ig_kl(M, optimal_variance, optimal_shape, optimal_scale)\ntau_gap = transformed_kl(M, optimal_variance, tau_mean, tau_variance)\nassert np.isclose(optimal_variance, optimal_scale/(optimal_shape*K))\nassert np.isclose(math.exp(-2*tau_mean+2*tau_variance), A/B)\nprint(\"Normal/IG analytic optimum m,var,a,b,KL\", *[format(v,\".12f\") for v in [M,optimal_variance,optimal_shape,optimal_scale,ig_gap]])\nprint(\"Normal/log-sigma analytic optimum m,var,tau-mean,tau-var,KL\", *[format(v,\".12f\") for v in [M,optimal_variance,tau_mean,tau_variance,tau_gap]])\nexact_variance = B/((A-1)*K)\nexact_tail = t.sf((2-M)/math.sqrt(B/(A*K)), 2*A)\nproduct_tail = norm.sf((2-M)/math.sqrt(optimal_variance))\nprint(\"exact mu variance\", format(exact_variance,\".12f\"), \"product mu variance\", format(optimal_variance,\".12f\"))\nprint(\"P(mu>2): exact t14\", format(exact_tail,\".12f\"), \"both product families\", format(product_tail,\".12f\"))\n",
      "output": "pair 1 drug2 minus drug1 6/5\npair 2 drug2 minus drug1 12/5\npair 3 drug2 minus drug1 13/10\npair 4 drug2 minus drug1 13/10\npair 5 drug2 minus drug1 0\npair 6 drug2 minus drug1 1\npair 7 drug2 minus drug1 9/5\npair 8 drug2 minus drug1 4/5\npair 9 drug2 minus drug1 23/5\npair 10 drug2 minus drug1 7/5\nposterior kappa, m, alpha, beta 11 79/55 7 10937/1100\nCAVI 0 m,var,a,b,KL 0.000000000000 1.000000000000 7.500000000000 12.000000000000 9.148599716421\nCAVI 1 m,var,a,b,KL 1.436363636364 0.145454545455 7.500000000000 10.742727272727 0.038713111181\nCAVI 2 m,var,a,b,KL 1.436363636364 0.130214876033 7.500000000000 10.658909090909 0.035305069354\nCAVI 3 m,var,a,b,KL 1.436363636364 0.129198898072 7.500000000000 10.653321212121 0.035288659600\nCAVI 4 m,var,a,b,KL 1.436363636364 0.129131166208 7.500000000000 10.652948686869 0.035288586259\nCAVI 5 m,var,a,b,KL 1.436363636364 0.129126650750 7.500000000000 10.652923851852 0.035288585933\nCAVI 6 m,var,a,b,KL 1.436363636364 0.129126349719 7.500000000000 10.652922196184 0.035288585931\nCAVI 7 m,var,a,b,KL 1.436363636364 0.129126329651 7.500000000000 10.652922085806 0.035288585931\nCAVI 8 m,var,a,b,KL 1.436363636364 0.129126328313 7.500000000000 10.652922078448 0.035288585931\nCAVI 9 m,var,a,b,KL 1.436363636364 0.129126328224 7.500000000000 10.652922077957 0.035288585931\nCAVI 10 m,var,a,b,KL 1.436363636364 0.129126328218 7.500000000000 10.652922077924 0.035288585931\nCAVI 11 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 12 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 13 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 14 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 15 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 16 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 17 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 18 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 19 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nCAVI 20 m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nNormal/IG analytic optimum m,var,a,b,KL 1.436363636364 0.129126328217 7.500000000000 10.652922077922 0.035288585931\nNormal/log-sigma analytic optimum m,var,tau-mean,tau-var,KL 1.436363636364 0.129126328217 0.208798937080 0.033333333333 0.046393145689\nexact mu variance 0.150647382920 product mu variance 0.129126328217\nP(mu>2): exact t14 0.069539013187 both product families 0.058379263447",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/sleep_variational_families.py.display.txt",
      "outputSha256": "3df46276bddd507ef19739dbe1a87c93a0a3553bb56252a28ab7ff2220613d7b",
      "stderrPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/sleep_variational_families.py.stderr.txt",
      "stderrSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "outputRole": "Presentation-only derivative of the retained recorded output, removing exactly mapped explanation sentences; no successor scientific main or fit replay.",
      "newExecution": false,
      "executionReceipt": "docs/teaching/math-foundations-reading-flow/variational-inference/content-new-programme-execution-r1.json",
      "executionSourceSha256": "292f8a32c45b81703f4cb5ff8dff881c6ae8e3b970660dca5a64728f230e6618",
      "executionOutputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/sleep_variational_families.py.stdout.txt",
      "executionOutputSha256": "8f9fead714f667b27aeec4293edcb81cf00056969d6f43380db09f55841568fe",
      "downloadUrl": "/learn-assets/variational-inference/sleep_variational_families.py"
    },
    "finite_vi_importance.py": {
      "filename": "finite_vi_importance.py",
      "title": "Compute exact function-specific importance precision",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/finite_vi_importance.py",
      "sourceSha256": "2244d7fc43c0b15b68a4c485d96f97725f71099b2d484eaf4371e8216b62e0fc",
      "code": "\"\"\"Exact finite importance arithmetic, not a sampled importance estimate.\n\nPython3 and NumPy. p and q are normalized; comparisons require q_i>0\nwherever p_i>0. Raw-IS variance/n is exact for independent samples;\nSN coefficient/n is asymptotic and does not assert finite-n unbiasedness.\n\"\"\"\nfrom fractions import Fraction as F\nimport numpy as np\n\ntarget = [F(1,5), F(1,2), F(3,10)]\nproposals = {\n    \"uniform\": [F(1,3)]*3,\n    \"exact\": target.copy(),\n    \"skewed\": [F(1,10), F(4,5), F(1,10)],\n    \"missingB\": [F(2,5), F(0), F(3,5)],\n}\nfunctions = {\"indicatorA\":[F(1),F(0),F(0)],\n             \"indicatorB\":[F(0),F(1),F(0)],\n             \"state-value\":[F(0),F(1),F(2)]}\nassert sum(target) == 1\nfor name, proposal in proposals.items():\n    assert sum(proposal) == 1 and all(v >= 0 for v in proposal)\n    missing = [state for state,p,q in zip(\"ABC\",target,proposal) if p > 0 and q == 0]\n    if missing:\n        print(name, \"invalid target support\", missing)\n        continue\n    weights = [p/q for p,q in zip(target,proposal)]\n    ratio_second = sum(p*p/q for p,q in zip(target,proposal))\n    assert sum(q*w for q,w in zip(proposal,weights)) == 1\n    print(name, \"q\", [str(v) for v in proposal], \"ratios\", [str(v) for v in weights],\n          \"ratio second moment\", str(ratio_second))\n    for function_name, values in functions.items():\n        I = sum(p*f for p,f in zip(target,values))\n        enumeration = sum(q*w*f for q,w,f in zip(proposal,weights,values))\n        raw_variance = sum(p*p*f*f/q for p,q,f in zip(target,proposal,values))-I*I\n        sn_coefficient = sum(p*p*(f-I)**2/q for p,q,f in zip(target,proposal,values))\n        assert enumeration == I and raw_variance >= 0 and sn_coefficient >= 0\n        p,q,f = map(lambda a:np.array([float(v) for v in a]),(target,proposal,values))\n        assert np.allclose([p@f,np.sum(p*p*f*f/q)-(p@f)**2,np.sum(p*p*(f-p@f)**2/q)],\n                           [float(I),float(raw_variance),float(sn_coefficient)])\n        print(function_name, \"exact I\", str(I), \"raw-IS single-draw variance\", str(raw_variance),\n              \"SN asymptotic coefficient\", str(sn_coefficient))\n        if name == \"uniform\" and function_name == \"indicatorB\":\n            assert (I,ratio_second,raw_variance,sn_coefficient) == (F(1,2),F(57,50),F(1,2),F(57,200))\n",
      "output": "uniform q ['1/3', '1/3', '1/3'] ratios ['3/5', '3/2', '9/10'] ratio second moment 57/50\nindicatorA exact I 1/5 raw-IS single-draw variance 2/25 SN asymptotic coefficient 147/1250\nindicatorB exact I 1/2 raw-IS single-draw variance 1/2 SN asymptotic coefficient 57/200\nstate-value exact I 11/10 raw-IS single-draw variance 31/50 SN asymptotic coefficient 1857/5000\nexact q ['1/5', '1/2', '3/10'] ratios ['1', '1', '1'] ratio second moment 1\nindicatorA exact I 1/5 raw-IS single-draw variance 4/25 SN asymptotic coefficient 4/25\nindicatorB exact I 1/2 raw-IS single-draw variance 1/4 SN asymptotic coefficient 1/4\nstate-value exact I 11/10 raw-IS single-draw variance 49/100 SN asymptotic coefficient 49/100\nskewed q ['1/10', '4/5', '1/10'] ratios ['2', '5/8', '3'] ratio second moment 129/80\nindicatorA exact I 1/5 raw-IS single-draw variance 9/25 SN asymptotic coefficient 609/2000\nindicatorB exact I 1/2 raw-IS single-draw variance 1/16 SN asymptotic coefficient 129/320\nstate-value exact I 11/10 raw-IS single-draw variance 1081/400 SN asymptotic coefficient 9729/8000\nmissingB invalid target support ['B']",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/finite_vi_importance.py.display.txt",
      "outputSha256": "6dd7a75b6e1ffbcc55a6fc4da32e5d8ad7962a5eafb5910c07256599c8e3fa06",
      "stderrPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/finite_vi_importance.py.stderr.txt",
      "stderrSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "outputRole": "Presentation-only derivative of the retained recorded output, removing exactly mapped explanation sentences; no successor scientific main or fit replay.",
      "newExecution": false,
      "executionReceipt": "docs/teaching/math-foundations-reading-flow/variational-inference/content-new-programme-execution-r1.json",
      "executionSourceSha256": "a01c8b45da4b59ed14598a8ee88bc87072078d75e85d2ffcad1bc520ba080d04",
      "executionOutputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/finite_vi_importance.py.stdout.txt",
      "executionOutputSha256": "da5b7204150efaea078a3dbd400bd45ab2ca07866e7c2119330ad4a20e4408fb",
      "downloadUrl": "/learn-assets/variational-inference/finite_vi_importance.py"
    },
    "pymc_variational.py": {
      "filename": "pymc_variational.py",
      "title": "Use maintained PyMC ADVI and evaluate exact fitted KL",
      "source": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/programmes/pymc_variational.py",
      "sourceSha256": "13652c36751242b5f0782993f9ef2b71a622ae1e809e2161f94a2ca3099fa059",
      "code": "\"\"\"Mean-field ADVI against an exact correlated Gaussian target.\nInstall: python -m pip install pymc==6.3.2 numpy==2.3.5 scipy==1.18.1\nRun: python pymc_variational.py\nNormalized target with no observations: isolates inference error from modeling.\nThe fixed optimization budget is explicit; it is not a convergence certificate.\n\"\"\"\nimport numpy as np\nimport pymc as pm\nfrom scipy.linalg import cho_factor, cho_solve\n\n\ndef gaussian_kl(mean, variance, target_mean, covariance):\n    factor = cho_factor(covariance, lower=True)\n    delta = mean - target_mean\n    precision_diagonal = np.diag(cho_solve(factor, np.eye(len(mean))))\n    logdet = 2 * np.log(np.diag(factor[0])).sum()\n    return .5 * (precision_diagonal @ variance + delta @ cho_solve(factor, delta)\n                 - len(mean) + logdet - np.log(variance).sum())\n\n\ndef fit_case(correlation):\n    target_mean = np.array([1., -1.])\n    covariance = np.array([[1., correlation], [correlation, 1.]])\n    with pm.Model():\n        pm.MvNormal(\"theta\", mu=target_mean, cov=covariance, shape=2)\n        approximation = pm.fit(n=15000, method=\"advi\", random_seed=51,\n                               obj_n_mc=20, obj_optimizer=pm.adam(learning_rate=.01),\n                               progressbar=False)\n    mean = np.asarray(approximation.mean.eval())\n    variance = np.asarray(approximation.std.eval())**2\n    assert np.isfinite(mean).all() and np.all(np.isfinite(variance) & (variance > 0))\n    optimal_variance = np.full(2, 1 - correlation**2)\n    family_gap = gaussian_kl(target_mean, optimal_variance, target_mean, covariance)\n    achieved_kl = gaussian_kl(mean, variance, target_mean, covariance)\n    optimization_gap = achieved_kl - family_gap\n    assert optimization_gap >= -1e-10\n    assert optimization_gap < .03  # declared finite-budget tolerance, not fitted after the run\n    assert np.max(np.abs(mean - target_mean)) < .15\n    assert np.max(np.abs(variance - optimal_variance)) < .15\n    print(f\"rho={correlation:.1f}; fitted mean {np.round(mean, 4).tolist()}; fitted variances {np.round(variance, 4).tolist()}\")\n    print(f\"  exact mean-field variances {np.round(optimal_variance, 4).tolist()}; true marginal variances [1, 1]\")\n    print(f\"  achieved KL {achieved_kl:.6f} = family gap {family_gap:.6f} + optimization gap {optimization_gap:.6f}\")\n\n\ndef main():\n    # Identity target supplies an exact zero-KL edge for the analytic oracle.\n    assert abs(gaussian_kl(np.zeros(2), np.ones(2), np.zeros(2), np.eye(2))) < 1e-12\n    for correlation in (.8, 0.):\n        fit_case(correlation)\n\n\nif __name__ == \"__main__\":\n    main()\n",
      "output": "rho=0.8; fitted mean [0.9865, -0.9703]; fitted variances [0.3666, 0.36]\n  exact mean-field variances [0.36, 0.36]; true marginal variances [1, 1]\n  achieved KL 0.513277 = family gap 0.510826 + optimization gap 0.002451\nrho=0.0; fitted mean [1.0026, -0.9687]; fitted variances [1.0063, 0.9869]\n  exact mean-field variances [1.0, 1.0]; true marginal variances [1, 1]\n  achieved KL 0.000547 = family gap 0.000000 + optimization gap 0.000547",
      "outputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-private-r2/outputs/pymc_variational.py.display.txt",
      "outputSha256": "24e8ce524c0b808d16c3f9637b17f18c046f827908178501134f433d473df255",
      "outputRole": "Presentation-only derivative of the retained recorded output, removing exactly mapped explanation sentences; no successor scientific main or fit replay.",
      "canonicalSource": "public/learn-assets/variational-inference/pymc_variational.py",
      "canonicalSourceSha256": "3bc8d6a9800cd145e575ebf4f476321a007731641fa8967698f838f91bd6cb1d",
      "newExecution": false,
      "executionSourceSha256": "3bc8d6a9800cd145e575ebf4f476321a007731641fa8967698f838f91bd6cb1d",
      "executionOutputPath": "docs/teaching/math-foundations-reading-flow/variational-inference/content-prepared-r1/outputs/pymc_variational.py.recorded.txt",
      "executionOutputSha256": "fd415cefc6c5859dd7c13051950fdddacb400b07afc2a014df9d0a8c866d872c",
      "downloadUrl": "/learn-assets/variational-inference/pymc_variational.py"
    }
  },
  "practices": [
    {
      "id": 1,
      "prompt": "Change the finite joint weights to(.1,.3,.1). Find the posterior, the best restricted q with B=C, and explain why its A mass differs from the exact posterior. Verify the ELBO identity.",
      "hint": "Evidence is.5. Use a*=pA/(pA+2√(pBpC)); compute the other masses from normalization. You can adapt the first complete program, but change all target-dependent values.",
      "solution": "The target is(.2,.6,.2). The denominator is.2+2√.12≈.892820, so q≈(.224009,.387995,.387995). Its KL is−log(.2+2√.12)≈.113370, and ELBO=log(.5)−KL≈−.806517. Reverse KL selects all masses jointly; simply preserving pA=.2 is not the constrained optimum. Independently sum q log(q/p) and the ELBO terms to check the identity.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"Change the finite joint weights to(.1,.3,.1). Find the posterior, the best restricted q with B=C, and explain why its A mass differs from the exact posterior. Verify the ELBO identity.\" hint={<Prose>Evidence is.5. Use a*=pA/(pA+2√(pBpC)); compute the other masses from normalization. You can adapt the first complete program, but change all target-dependent values.</Prose>}><Prose>The target is(.2,.6,.2). The denominator is.2+2√.12≈.892820, so q≈(.224009,.387995,.387995). Its KL is−log(.2+2√.12)≈.113370, and ELBO=log(.5)−KL≈−.806517. Reverse KL selects all masses jointly; simply preserving pA=.2 is not the constrained optimum. Independently sum q log(q/p) and the ELBO terms to check the identity.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 2,
      "prompt": "A target puts probability(.4,.6,0) on A,B,C. Compare q=(.5,.5,0), q=(.4,.5,.1), and q=(1,0,0). Which KLs are infinite?",
      "hint": "Ask where q has positive mass but p has none. A missing target region behaves differently from an invented impossible one.",
      "solution": "Only(.4,.5,.1) has infinite reverse KL because it assigns positive mass to impossible C. The first has finite KL .5log(.5/.4)+.5log(.5/.6)≈.020411. The last has finite KL log(1/.4)≈.916291 even though it ignores B. Reverse KL is sensitive to omitted mass through normalization and the remaining density ratios; it does not impose an automatic infinite penalty for every omitted target region.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"A target puts probability(.4,.6,0) on A,B,C. Compare q=(.5,.5,0), q=(.4,.5,.1), and q=(1,0,0). Which KLs are infinite?\" hint={<Prose>Ask where q has positive mass but p has none. A missing target region behaves differently from an invented impossible one.</Prose>}><Prose>Only(.4,.5,.1) has infinite reverse KL because it assigns positive mass to impossible C. The first has finite KL .5log(.5/.4)+.5log(.5/.6)≈.020411. The last has finite KL log(1/.4)≈.916291 even though it ignores B. Reverse KL is sensitive to omitted mass through normalization and the remaining density ratios; it does not impose an automatic infinite penalty for every omitted target region.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 3,
      "prompt": "Change the Gaussian correlation to−.6. Find the best mean-field marginal variance and the variances of sum and difference under p and q. Which decision is too certain?",
      "hint": "Mean-field variance is 1−ρ². The target sum and difference variances are 2±2ρ.",
      "solution": "The independent variance is.64. Target sum variance is.8 and difference variance 3.2; q gives 1.28 for both. The difference is too certain, while the sum is too uncertain. KL=−.5log(.64)≈.223144. A description of “underestimated uncertainty” without naming the reported quantity would hide this reversal.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"Change the Gaussian correlation to−.6. Find the best mean-field marginal variance and the variances of sum and difference under p and q. Which decision is too certain?\" hint={<Prose>Mean-field variance is 1−ρ². The target sum and difference variances are 2±2ρ.</Prose>}><Prose>The independent variance is.64. Target sum variance is.8 and difference variance 3.2; q gives 1.28 for both. The difference is too certain, while the sum is too uncertain. KL=−.5log(.64)≈.223144. A description of “underestimated uncertainty” without naming the reported quantity would hide this reversal.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 4,
      "prompt": "Use the shifted target mean(1,−1), correlation.5 and initial means(0,0). Do one complete CAVI sweep. Then state which part of the remaining discrepancy more iterations can remove.",
      "hint": "Update m₁ first using the old m₂; update m₂ using the newly changed m₁. The variance is.75.",
      "solution": "The first mean becomes 1+.5×1=1.5; the second becomes−1+.5×.5=−.75. Total KL is−.5log(.75)+.125≈.268841. The .125 optimization gap can shrink. The best family gap−.5log(.75)≈.143841 remains until the family can express covariance.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"Use the shifted target mean(1,−1), correlation.5 and initial means(0,0). Do one complete CAVI sweep. Then state which part of the remaining discrepancy more iterations can remove.\" hint={<Prose>Update m₁ first using the old m₂; update m₂ using the newly changed m₁. The variance is.75.</Prose>}><Prose>The first mean becomes 1+.5×1=1.5; the second becomes−1+.5×.5=−.75. Total KL is−.5log(.75)+.125≈.268841. The .125 optimization gap can shrink. The best family gap−.5log(.75)≈.143841 remains until the family can express covariance.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 5,
      "prompt": "A two-mode target gives θ>0 probability.5. Two runs produce Gaussian fits centered near opposite modes, each with a similar ELBO. What should a sign-based controller receive, and what comparison would actually be convincing?",
      "hint": "Averaging the two reported means creates a point in the valley. A single stuck MCMC run can reproduce the same failure.",
      "solution": "Report the unresolved sign ambiguity, rather than whichever initialization happened to win. A mixture giving both modes suitable weight can express it; validate those weights and the sign probability against a trustworthy reference or a sampler that demonstrably explores both regions with adequate precision. Merely averaging parameter means does not produce that mixture. When mixing distributions, combine their densities or sample from the mixture explicitly.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"A two-mode target gives θ>0 probability.5. Two runs produce Gaussian fits centered near opposite modes, each with a similar ELBO. What should a sign-based controller receive, and what comparison would actually be convincing?\" hint={<Prose>Averaging the two reported means creates a point in the valley. A single stuck MCMC run can reproduce the same failure.</Prose>}><Prose>Report the unresolved sign ambiguity, rather than whichever initialization happened to win. A mixture giving both modes suitable weight can express it; validate those weights and the sign probability against a trustworthy reference or a sampler that demonstrably explores both regions with adequate precision. Merely averaging parameter means does not produce that mixture. When mixing distributions, combine their densities or sample from the mixture explicitly.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 6,
      "prompt": "For target N(2,1), take q=N(0,4) and noise ε=.5. Compute the draw and the pathwise contributions for m and a=log s. Compare with the exact expected gradients.",
      "hint": "s=2, θ=m+sε, target slope is 2−θ. The entropy contribution to the log-scale gradient is 1.",
      "solution": "The draw is 1 and target slope 1. The single-draw contributions are 1 for m and 1+2×.5×1=2 for a. Their exact expectations are 2 and 1−4=−3. One draw even points the scale in the opposite direction; unbiasedness concerns the average over repeated draws, not correctness of every realized direction. Averaging more independent draws improves typical precision, while a suitable optimizer still needs a step-size policy.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"For target N(2,1), take q=N(0,4) and noise ε=.5. Compute the draw and the pathwise contributions for m and a=log s. Compare with the exact expected gradients.\" hint={<Prose>s=2, θ=m+sε, target slope is 2−θ. The entropy contribution to the log-scale gradient is 1.</Prose>}><Prose>The draw is 1 and target slope 1. The single-draw contributions are 1 for m and 1+2×.5×1=2 for a. Their exact expectations are 2 and 1−4=−3. One draw even points the scale in the opposite direction; unbiasedness concerns the average over repeated draws, not correctness of every realized direction. Averaging more independent draws improves typical precision, while a suitable optimizer still needs a step-size policy.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 7,
      "prompt": "For the minibatch example, change batch size from2 to1. Explain the weighting and calculate the expected wrong mean-gradient if you multiply the prior term by4 as well.",
      "hint": "The full likelihood mean-gradient is 8 and the one prior contribution is−1. Uniformly average all four one-row estimators.",
      "solution": "The correct estimator is 4(x_i−1)−1, with values−1,3,11,15 and average 7. The wrong estimator is 4[(x_i−1)−1], with average 8−4=4. More repetitions converge toward that biased 4, not toward 7. The data scaling factor belongs to the data sum.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"For the minibatch example, change batch size from2 to1. Explain the weighting and calculate the expected wrong mean-gradient if you multiply the prior term by4 as well.\" hint={<Prose>The full likelihood mean-gradient is 8 and the one prior contribution is−1. Uniformly average all four one-row estimators.</Prose>}><Prose>The correct estimator is 4(x_i−1)−1, with values−1,3,11,15 and average 7. The wrong estimator is 4[(x_i−1)−1], with average 8−4=4. More repetitions converge toward that biased 4, not toward 7. The data scaling factor belongs to the data sum.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 8,
      "prompt": "In the amortized Normal example, change observation-noise variance to4 while keeping prior variance1. Derive the shared posterior rule and the variance of a new measurement. What if the encoder keeps using the old rule?",
      "hint": "Add prior precision 1 and data precision 1/4. The posterior precision is their sum; weight x by its observation precision before dividing.",
      "solution": "The posterior variance is 1/(1+1/4)=.8 and mean is(x/4)/(1.25)=x/5. A new measurement has variance 4+.8=4.8. The old encoder m=x/2,variance.5 is now systematically wrong, even if it was exact for the old model. This is a changed-model failure, not an optimizer or Monte Carlo problem. The inference rule must match the observation process.",
      "originalJsx": "<div className=\"lesson-exercise\" data-lesson-exercise=\"\"><Practice prompt=\"In the amortized Normal example, change observation-noise variance to4 while keeping prior variance1. Derive the shared posterior rule and the variance of a new measurement. What if the encoder keeps using the old rule?\" hint={<Prose>Add prior precision 1 and data precision 1/4. The posterior precision is their sum; weight x by its observation precision before dividing.</Prose>}><Prose>The posterior variance is 1/(1+1/4)=.8 and mean is(x/4)/(1.25)=x/5. A new measurement has variance 4+.8=4.8. The old encoder m=x/2,variance.5 is now systematically wrong, even if it was exact for the old model. This is a changed-model failure, not an optimizer or Monte Carlo problem. The inference rule must match the observation process.</Prose></Practice></div>",
      "preservedOriginalContext": true
    },
    {
      "id": 9,
      "prompt": "Keep the hierarchical model but change synthetic observations to [0,1,1,2] and current E(mu) to -1. Optimize the locals, calculate every size-two natural proposal, and compare the selected batch [0,2] quarter step with the full-data quarter step. Find the full-CAVI fixed point and name the family restriction that remains.",
      "hint": "Each local mean is (y_i+m)/2. Global precision stays five and current h=5m. Scale a selected local sum by two, then average natural parameters with rho=1/4. Solve m=(sum(y)+4m)/10 for the full fixed point.",
      "solution": "The local means are [-1/2,0,0,1/2], each with variance1/2. The six h proposals, in lexicographic batch order, are [-1,-1,0,0,1,1], averaging zero, the full local sum. Selected [0,2] gives h_hat=-1 and proposed mean=-1/5. The quarter step is h_new=(3/4)(-5)+(1/4)(-1)=-4, mean=-4/5. The full-reference quarter step is h_new=-15/4, mean=-3/4, a different value. Full CAVI maps m to2/5+(2/5)m, so the fixed point is2/3. Integrating each local gives observation variance2, hence exact global variance1/3 while the product factor has variance1/5. The same precision matrix gives joint family KL (1/2)log(5/3); changing observations changes means, not this covariance restriction. The proposal enumeration is unbiased at this frozen current mean, but one selected proposal need not equal its average."
    },
    {
      "id": 10,
      "prompt": "For the same paired-sleep posterior, start the product Normal/IG family at u=0, mu variance1, shape15/2 and scale15. Carry out one complete ordered sweep. Is that endpoint the global family optimum? Show how the profile, not iteration agreement, establishes the optimum.",
      "hint": "Update the Normal first using E(1/v)=a/b. Then use its new mean and variance in the IG scale. Write the profile derivative as a positive denominator times beta-alpha*kappa*x.",
      "solution": "The new mean is79/55. The new variance is15/((15/2)*11)=2/11. The new shape remains15/2 and new scale is10937/1100+(11/2)(2/11)=12037/1100, approximately10.9427272727. The global variance is beta/(alpha*kappa)=10937/84700, approximately.129126328217, and global scale is10.652922077922, so the first endpoint is not the optimum. After optimizing the complete v factor and the mean, F(x)=constant+(1/2)log x-(alpha+1/2)log(beta+kappa*x/2). Its derivative has the sign of beta-alpha*kappa*x, with a unique sign change at beta/(alpha*kappa). F tends to negative infinity at zero and infinity. Those facts prove the unique global maximum in this family. Even there, joint KL is.035288585931 and the tail above2 remains.058379263447 versus the exact.069539013187; iteration cannot remove the product-family error."
    },
    {
      "id": 11,
      "prompt": "For target p=N(2,4) and q=N(0,1), derive the loss log-scale pathwise contribution, its exact mean and variance, and the Price contribution. Does deterministic scale imply that the entire gradient is deterministic? State the additional information Price needs.",
      "hint": "Here a=2,b=2,m=0,s=1. Expand ((m-a)+s*epsilon)*s*epsilon/b^2-1 and use Normal moments0,1,0,3.",
      "solution": "The pathwise loss-scale contribution is(-2*epsilon+epsilon^2)/4-1. Its expectation is1/4-1=-3/4. The linear term has variance1/4 and the centered quadratic term variance2/16=1/8; their covariance is zero because E(epsilon^3)=0, so total variance3/8. Price uses the target potential's second derivative U''=1/4 and returns s^2/4-1=-3/4 for every draw, with zero scale variance. Its loss-mean component U'(X)=(epsilon-2)/4 still has mean-1/2 and variance1/16. Computing second derivatives or Hessian information has a cost and requires valid Gaussian differentiation/integrability conditions. This scalar constant-curvature example proves no universal ranking on nonquadratic targets; changing to ELBO ascent reverses gradient signs but not variances."
    },
    {
      "id": 12,
      "prompt": "Use p=(.2,.5,.3) and q=(.1,.8,.1). For indicator-B calculate the exact expectation, raw-IS single-draw variance and SN asymptotic coefficient. Repeat for indicator-A. Then explain why q_B=0 invalidates a complete-target calculation even if a finite sample shows ordinary ratios elsewhere.",
      "hint": "Use sum p*f, sum p^2*f^2/q minus I^2, and sum p^2*(f-I)^2/q as three distinct expressions. Keep the zero values of the indicator in the SN sum.",
      "solution": "Indicator-B has exact I=1/2, raw variance(1/4)/(4/5)-1/4=1/16=.0625. The SN coefficient includes all three states and is129/320=.403125. Indicator-A has I=1/5, raw variance(1/25)/(1/10)-1/25=9/25=.36, and SN coefficient609/2000=.3045. The same proposal can therefore affect functions and estimator constructions differently. These exact enumerated expectations have zero Monte Carlo error. For n independent proposal draws, raw mean variance is the raw single-draw variance/n exactly; the SN coefficient/n is asymptotic and does not remove finite-n ratio bias. Setting q_B=0 with p_B>0 violates target support, so B cannot be recovered by ratios from q draws. Report invalid full-target support instead of a manufactured finite answer or a reassurance from unvisited ratios."
    }
  ],
  "resources": "## Continue with a focused source\n\n- [Blei, Kucukelbir and McAuliffe — Variational Inference: A Review for Statisticians](https://arxiv.org/html/1601.00670v9). Work through sections2.2–2.4 after the finite objective and CAVI examples; they derive the ELBO, factor update and optimization distinctions. Section4 then connects local factors to stochastic global updates. The arXiv revision extends the 2017 review; compare its general descriptions with the concrete decision-specific counterexamples here.\n- [Jordan et al. — An Introduction to Variational Methods for Graphical Models](https://people.eecs.berkeley.edu/~jordan/papers/variational-intro.pdf). Read the opening graphical-model examples to see why exact sums become expensive, then the KL/Jensen and block-factor material for a second mathematical route. Its broader variational bounds include methods beyond this lesson's reverse-KL posterior families.\n- [Ranganath, Gerrish and Blei — Black Box Variational Inference](https://proceedings.mlr.press/v33/ranganath14.html). Follow the score-gradient derivation and variance-reduction construction after section6. Pay particular attention to the separate pilot for a control coefficient and the regularity assumptions; a same-batch fitted baseline needs its own argument.\n- [Hoffman et al. — Stochastic Variational Inference](https://www.jmlr.org/papers/v14/hoffman13a.html). Sections2.3–2.4 explain the conditionally conjugate local/global construction and natural-gradient weighted update. Use the four-observation hierarchy here to trace each sufficient-statistic term before attempting its larger models. Exponential-family prerequisites are developed in the next lesson.\n- [Kingma and Welling — Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114). Sections2–3 connect reparameterized gradients and shared inference mappings to learned generative models. Track inference parameters and generative parameters separately; joint model learning differs from our fixed-target comparisons. Continue in the dedicated VAE lesson.\n- [Kucukelbir et al. — Automatic Differentiation Variational Inference](https://jmlr.org/papers/volume18/16-107/16-107.pdf). Start with its transformations and Gaussian working-family construction after section9. Write the Jacobian and mapped-back family yourself before interpreting a fit on constrained unknowns.\n- [Stan2.40 — Variational Inference](https://mc-stan.org/docs/2_40/reference-manual/variational.html). Compare gradient-draw count, objective-evaluation count, adaptation and approximate-ELBO stopping. These controls answer different computational questions; stopping does not establish accurate posterior uncertainty.\n- [PyMC — ADVI](https://www.pymc.io/projects/docs/en/stable/api/generated/pymc.ADVI.html), [fit](https://www.pymc.io/projects/docs/en/stable/api/generated/pymc.fit.html) and [FullRankADVI](https://www.pymc.io/projects/docs/en/stable/api/generated/pymc.FullRankADVI.html). Use the complete programme's pinned6.3.2 installation and explicit optimizer settings, then inspect the ordinary diagonal versus full-rank family APIs. Distinguish objective-gradient samples from later approximate-posterior samples; online documentation may describe a newer release than a pinned script.\n- [Yao et al. — Yes, but Did It Work?: Evaluating Variational Inference](https://proceedings.mlr.press/v80/yao18a.html). Read the joint/marginal importance-diagnostic discussion and generative calibration section after section11. Ask which quantity each diagnostic assesses and what an unvisited mode or a symmetry check can conceal.\n- [Vehtari et al. — Pareto Smoothed Importance Sampling](https://jmlr.org/papers/v25/19-556.html). Study the weight-tail mechanism and estimator-specific assumptions before using a sampled importance diagnostic. Our exact three-state example explains ratios and two precision quantities; it does not implement the fitted-tail method.\n- [Stan2.40 — Pathfinder](https://mc-stan.org/docs/2_40/reference-manual/pathfinder.html). Follow how local Gaussian approximations along optimization paths are selected and combined using importance resampling. Compare its path, initialization and reliability choices with the single-family optimizer; check the reported function even when an overall diagnostic seems acceptable.\n- [Price-gradient study, 2026 revised main text](https://arxiv.org/html/2602.18718v2). After deriving the scalar quadratic example, compare the pathwise and Hessian-informed Gaussian estimator operations. Its convexity, smoothness and schedule assumptions limit the iteration claims; the scale component's constant curvature result does not extend to every component or target.\n- [Importance-weighted variational inference asymptotics, 2025](https://arxiv.org/html/2501.08477v1). Optional deeper reading on expected objectives as data and importance budgets grow together. Keep its limiting, regularity and optimization assumptions separate from a finite noisy fit or a fixed-posterior importance correction.\n- [Gaussian interacting-particle optimization, 2026 revised main text](https://arxiv.org/html/2601.00632v2). Optional research direction: a particle is a candidate Gaussian distribution, while the resulting approximation remains Gaussian. Separate optimizer exploration from posterior sampling and from family expressiveness.\n- [Stanford CS3302022, lecture11: Variational Inference and Generative Models](https://www.youtube.com/watch?v=iL1c1KmYPM0) and [official lecture slides](https://cs330.stanford.edu/fall2022/lecture_slides/cs330_variational_inference_2022.pdf). An alternate visual route through latent models and amortization with deep-learning context. Use the slide derivations alongside sections6 and8, then the VAE lesson for the larger architecture.\n",
  "assets": [
    {
      "filename": "sleep-pairs.csv",
      "source": "public/learn-assets/monte-carlo-mcmc/sleep-pairs.csv",
      "url": "/learn-assets/monte-carlo-mcmc/sleep-pairs.csv",
      "sha256": "3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6",
      "role": "complete canonical paired data"
    },
    {
      "filename": "sleep-provenance.json",
      "source": "public/learn-assets/monte-carlo-mcmc/sleep-provenance.json",
      "url": "/learn-assets/monte-carlo-mcmc/sleep-provenance.json",
      "sha256": "6a6aef362881154d939a27e5de125f74a2614f028b15447fb6e93d04b337f8d6",
      "role": "source/provenance/full upstream license"
    },
    {
      "filename": "sleep.R",
      "source": "public/learn-assets/monte-carlo-mcmc/sleep.R",
      "url": "/learn-assets/monte-carlo-mcmc/sleep.R",
      "sha256": "998f363abb36342a6e5cd1d508d2ac2d044146832b617b18649b5b8ce21ab7f2",
      "role": "source/provenance/full upstream license"
    },
    {
      "filename": "sleep.Rd",
      "source": "public/learn-assets/monte-carlo-mcmc/sleep.Rd",
      "url": "/learn-assets/monte-carlo-mcmc/sleep.Rd",
      "sha256": "f17781ff555f1c5791ae1c8c07bb2ca990aef04d0df461770605dca85e8d3975",
      "role": "source/provenance/full upstream license"
    },
    {
      "filename": "R-datasets-DESCRIPTION.in",
      "source": "public/learn-assets/monte-carlo-mcmc/R-datasets-DESCRIPTION.in",
      "url": "/learn-assets/monte-carlo-mcmc/R-datasets-DESCRIPTION.in",
      "sha256": "e58b793cb90e167d9f4c9a23b7b63a2344bbdab6b7d36049fd9fd84190daf99d",
      "role": "source/provenance/full upstream license"
    },
    {
      "filename": "R-COPYING",
      "source": "public/learn-assets/monte-carlo-mcmc/R-COPYING",
      "url": "/learn-assets/monte-carlo-mcmc/R-COPYING",
      "sha256": "e6d6a009505e345fe949e1310334fcb0747f28dae2856759de102ab66b722cb4",
      "role": "source/provenance/full upstream license"
    }
  ],
  "contracts": [
    {
      "id": "V01",
      "placement": "§1",
      "wholeAcceptedObjectContract": "Same θ axis carrying an uncertain Gaussian, its mean marker and a tail region.",
      "wholeAcceptedDefaultChangedCheckContract": "N(0,1); point versus distribution and Pr(θ>1) distinguish outcomes. Density integration and Normal CDF.",
      "manuscriptLine": 9,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V02",
      "placement": "§1",
      "wholeAcceptedObjectContract": "Variational parameter plane (m,log s) maps two actual points to two labeled Gaussian densities on a common θ axis.",
      "wholeAcceptedDefaultChangedCheckContract": "(0,0), (1,log2); equal axes, positive s and normalization.",
      "manuscriptLine": 14,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V03",
      "placement": "§1",
      "wholeAcceptedObjectContract": "Three prior masses multiply their three likelihood heights to actual joint weights, then normalize on the same state IDs.",
      "wholeAcceptedDefaultChangedCheckContract": "Prior1/3, likelihood(.24,.60,.36), joint(.08,.20,.12), evidence.4 and posterior(.2,.5,.3); finite arithmetic.",
      "manuscriptLine": 21,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V04",
      "placement": "§1",
      "wholeAcceptedObjectContract": "Equal-probability continuous intervals versus their density heights at different scales.",
      "wholeAcceptedDefaultChangedCheckContract": "N(0,1) and its θ'=2θ image; interval mass conserved, density halved. Change-of-variable integral.",
      "manuscriptLine": 26,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V05",
      "placement": "§2",
      "wholeAcceptedObjectContract": "q/p support masks on A,B,C with actual positive/zero heights and highlighted impossible mass.",
      "wholeAcceptedDefaultChangedCheckContract": "p=(.4,.6,0), three existing practice q cases; finite versus infinite KL and limiting0log0.",
      "manuscriptLine": 33,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V06",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Live finite p/q masses, each state's log-joint/entropy/KL contribution, summed ELBO and true log evidence.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing first=.2/share=.5/restricted default; free family and qA=0/1. Exact sum identity and complete table; controls below.",
      "manuscriptLine": 38,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V07",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Log-density ratio is an operation on the same sampled state: q weight times log q−log p, with signed contributions.",
      "wholeAcceptedDefaultChangedCheckContract": "Uniform and exact q on(.2,.5,.3); direct finite sums.",
      "manuscriptLine": 45,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V08",
      "placement": "§2",
      "wholeAcceptedObjectContract": "ELBO+KL meets the same fixed log-evidence line on one signed number axis.",
      "wholeAcceptedDefaultChangedCheckContract": "Three existing finite candidates; values−.986531/−.942022/−.916291 with exact computed gaps, not stacked positive lengths pretending signed quantities are masses.",
      "manuscriptLine": 56,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V09",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Concave log curve, its chord and actual Jensen average for two positive ratios.",
      "wholeAcceptedDefaultChangedCheckContract": "Ratios .5 and1.5 with equal weights; Elog ratio≤log E ratio. Direct log arithmetic, same axes.",
      "manuscriptLine": 61,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V10",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Entropy from literal −q_i log q_i contributions with uniform and concentrated masses.",
      "wholeAcceptedDefaultChangedCheckContract": "Three states, q=(1/3,1/3,1/3) and(1,0,0); limiting zeros, no differential-entropy sign claim.",
      "manuscriptLine": 66,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V11",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Restricted B=C family as an actual line in the probability simplex, exact optimum and target point.",
      "wholeAcceptedDefaultChangedCheckContract": "qA*=.205213…; independently differentiate/solve and full finite program.",
      "manuscriptLine": 71,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V12",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Exact restricted-objective curve over qA with marked current, family optimum and true posterior outside that family.",
      "wholeAcceptedDefaultChangedCheckContract": "qA=.2 and optimum; family/optimization gaps computed separately. Endpoint limits.",
      "manuscriptLine": 76,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V13",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Expected likelihood and prior-ratio terms on the same states combine into the identical ELBO.",
      "wholeAcceptedDefaultChangedCheckContract": "Known finite prior/likelihood; direct log decomposition.",
      "manuscriptLine": 86,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V14",
      "placement": "§2",
      "wholeAcceptedObjectContract": "Two fixed candidate q objectives and log evidence for the original event model and a half-likelihood binary observation model; both valid model events share the same posterior.",
      "wholeAcceptedDefaultChangedCheckContract": "Original likelihood(.24,.60,.36),joint(.08,.20,.12),evidence.40 versus half likelihood(.12,.30,.18),joint(.04,.10,.06),evidence.20; same posterior/KL, all ELBO/log-evidence values shift by−log2. Same-model comparisons retain constants.",
      "manuscriptLine": 91,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V15",
      "placement": "§3",
      "wholeAcceptedObjectContract": "Live covariance ellipses, true samples' mathematical contours and q contour on one equal-unit latent plane.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing rho=.8, mean-field; rho0/−.6/full covariance/product marginals. Radius1 is39.35% in2D; matrix KL/Cholesky oracle.",
      "manuscriptLine": 98,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V16",
      "placement": "§3",
      "wholeAcceptedObjectContract": "Precision quadratic: fix θ2 then expose the conditional θ1 density and its narrower variance.",
      "wholeAcceptedDefaultChangedCheckContract": "Sigma=[[1,.8],[.8,1]], conditional variance.36; direct square completion.",
      "manuscriptLine": 105,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V17",
      "placement": "§3",
      "wholeAcceptedObjectContract": "Exact reverse-KL diagonal covariance and forward-KL product of true marginals on common equal-unit axes.",
      "wholeAcceptedDefaultChangedCheckContract": "diag.36 versus diag1; compute both KL directions, do not substitute one projection for another.",
      "manuscriptLine": 110,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V18",
      "placement": "§3",
      "wholeAcceptedObjectContract": "Project the joint ellipse onto sum and difference directions, with four actual variance lengths.",
      "wholeAcceptedDefaultChangedCheckContract": "Target sum3.6/difference.4, MF .72/.72; negative correlation reverses which quantity is too certain. wᵀSigmaw.",
      "manuscriptLine": 121,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V19",
      "placement": "§3",
      "wholeAcceptedObjectContract": "Rotate by the true orthogonal eigenbasis; coupled axes become independent Gaussian axes.",
      "wholeAcceptedDefaultChangedCheckContract": "Eigenvalues1±rho, rho=.8; exact transformed covariance and Jacobian1. Coordinate-specific family statement.",
      "manuscriptLine": 131,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V20",
      "placement": "§4",
      "wholeAcceptedObjectContract": "Product of two density factors shown as a 2D density surface/contour grid, with one whole factor replaced.",
      "wholeAcceptedDefaultChangedCheckContract": "Shifted Gaussian target mean(1,−1); q means(−2,2), variances.36. Actual products, not sentence nodes.",
      "manuscriptLine": 138,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V21",
      "placement": "§4",
      "wholeAcceptedObjectContract": "Expected log-joint quadratic in θ1 is exponentiated and normalized into its new factor density.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing CAVI first update; direct square completion and normalized Gaussian.",
      "manuscriptLine": 143,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V22",
      "placement": "§4",
      "wholeAcceptedObjectContract": "Live ordered coordinate path on the plane of variational means, with current factor curves.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing rho=.8/start(−2,2),0–24updates; rho0 and−.6, Reset. CAVI equations and independent first-sweep math.",
      "manuscriptLine": 150,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V23",
      "placement": "§4",
      "wholeAcceptedObjectContract": "Actual KL after each individual update and fixed family-gap line.",
      "wholeAcceptedDefaultChangedCheckContract": "Same full ordered trace; every nonincrease checked, gap .510826 at rho.8 retained.",
      "manuscriptLine": 155,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V24",
      "placement": "§4",
      "wholeAcceptedObjectContract": "Old/new operands for ordered and simultaneous updates plotted as different mean-plane arrows.",
      "wholeAcceptedDefaultChangedCheckContract": "Target rho=.5,start(0,0); ordered(1.5,−.75) versus simultaneous(1.5,−1.5). Do not claim universal simultaneous convergence or failure.",
      "manuscriptLine": 165,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V25",
      "placement": "§5",
      "wholeAcceptedObjectContract": "Live two-component posterior density and one Gaussian approximation on one θ axis.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing d3,m0,s3; d0/d4 and positive/negative m. Stable logsumexp, finite display interval and independent adaptive quadrature.",
      "manuscriptLine": 172,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V26",
      "placement": "§5",
      "wholeAcceptedObjectContract": "Quadrature noise nodes transform to θ=m+sε; each weighted log ratio contributes to KL.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing preserved three candidates; display selected real nodes/weights and full numerical law, integration refinement.",
      "manuscriptLine": 179,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V27",
      "placement": "§5",
      "wholeAcceptedObjectContract": "Both-mode sign mass versus the three Gaussian sign probabilities, with actual colored tail areas.",
      "wholeAcceptedDefaultChangedCheckContract": "True.5, q=N(±3,1) nearly0/1, N(0,9).5; Normal CDF. Similar ELBO does not settle sign.",
      "manuscriptLine": 189,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V28",
      "placement": "§5",
      "wholeAcceptedObjectContract": "A distribution mixture combines two densities, while averaging their means gives one point/different Gaussian.",
      "wholeAcceptedDefaultChangedCheckContract": "Equal N(−3,1),N(3,1), weight1/2; full density sum and variance10 versus mean0 point.",
      "manuscriptLine": 194,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V29",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Actual independent base-noise draws transform through m+sε to θ; two coordinate derivatives follow the numeric transform.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing m0,s1.2,seed7; exactly selected draw, and m1.5,s.7 target match. Seed/MC versus target roles labeled.",
      "manuscriptLine": 201,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V31",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Score multiplies actual log-joint−log-q values by the Gaussian score vector.",
      "wholeAcceptedDefaultChangedCheckContract": "Same noise and target as V30; each column and complete table show the chosen estimator.",
      "manuscriptLine": 212,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V30",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Live per-draw pathwise/score gradient contributions with their current mean and analytic target arrows.",
      "wholeAcceptedDefaultChangedCheckContract": "Preserve existing model states/budgets/seed/index; analytic gradients and finite difference/independent integration. No universal variance ranking.",
      "manuscriptLine": 217,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V32",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Fixed baseline subtracts a multiple of zero-mean score, with pilot values separate from gradient draws.",
      "wholeAcceptedDefaultChangedCheckContract": "Explicit deterministic coefficient versus separately sampled pilot; covariance identity, no same-batch unbiasedness assumption.",
      "manuscriptLine": 222,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V33",
      "placement": "§6",
      "wholeAcceptedObjectContract": "At p=q, normalized score contributions are zero while the specified pathwise scale contributions vary.",
      "wholeAcceptedDefaultChangedCheckContract": "N(2,1),ε sequence from fixed declared seed; literal estimator formulas and analytic variances.",
      "manuscriptLine": 227,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V34",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Moving-support Uniform(0,a) interval changes its endpoint; boundary contribution completes derivative of Eθ=a/2.",
      "wholeAcceptedDefaultChangedCheckContract": "a1 and2; incorrect interior-only derivative0 versus correct1/2. Direct integration.",
      "manuscriptLine": 232,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V35",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Fixed-noise objective and fresh-noise expected objective use identical θ transform but different noise ownership.",
      "wholeAcceptedDefaultChangedCheckContract": "Two explicit draw sets and analytic Normal ELBO; distinguish a sampled surface from expected objective, not a benchmark.",
      "manuscriptLine": 237,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V36",
      "placement": "§6",
      "wholeAcceptedObjectContract": "Complete seeded optimizer's actual reported100/500/2000 states and exact KL values, without invented intermediate lines.",
      "wholeAcceptedDefaultChangedCheckContract": "Preserve exact program outputs, later iterate may be worse; state/entropy/ascent operations exposed beside code.",
      "manuscriptLine": 242,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V37",
      "placement": "§6 deeper",
      "wholeAcceptedObjectContract": "Price scale-gradient operation versus pathwise scale-gradient operation for a scalar quadratic target.",
      "wholeAcceptedDefaultChangedCheckContract": "qN(m,s²), targetN(a,b²); price constant s²/b²−1, pathwise noise terms, nine existing exact-moment prototype cases. Loss-gradient convention explicit, mean remains noisy and Hessian cost stated.",
      "manuscriptLine": 252,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V38",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Full likelihood contributions and one prior contribution are separately weighted before addition.",
      "wholeAcceptedDefaultChangedCheckContract": "Existing data[1,2,4,5],m1,s.5,N4,b2; exact total mean-gradient7, wrong prior-scaled6.",
      "manuscriptLine": 266,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V39",
      "placement": "§7",
      "wholeAcceptedObjectContract": "All six actual size2 batches and their mean-gradient distribution.",
      "wholeAcceptedDefaultChangedCheckContract": "[1,5,7,7,9,13], average7; b1 changed practice, original program conserved.",
      "manuscriptLine": 273,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V40",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Hierarchical model plate drawn as one global μ, four distinct latent z_i and four actual observed y_i.",
      "wholeAcceptedDefaultChangedCheckContract": "μ~N(0,1),z_i|μ~N(μ,1),y_i|z_i~N(z_i,1),y=[1,2,4,5]; all variances1, separate parameter/factor graph ownership.",
      "manuscriptLine": 283,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V41",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Every local factor combines its y_i and current Eμ into its own mean and variance.",
      "wholeAcceptedDefaultChangedCheckContract": "Eμ1 gives local means[1,1.5,2.5,3],variance.5; square completion, all four full rows.",
      "manuscriptLine": 288,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V42",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Live natural sufficient-statistic proposals from all six batches join a single global prior and precision5.",
      "wholeAcceptedDefaultChangedCheckContract": "At current Eμ1/currenth5, proposals h=[5,7,8,8,9,11]. Default selected batch indices[0,2] has h7; rho.25 yields steppedh5.5 and mean1.1. Full-data/mean-over-batches h8 is a separate reference yielding steppedh5.75/mean1.15. First batch[0,1] and rho0 supply labeled null steps. Batch/current Eμ/rho/Reset; exact deterministic CAVI reference.",
      "manuscriptLine": 293,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V43",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Global optimum and true coupled Gaussian marginal shown with same μ axis and local coupling.",
      "wholeAcceptedDefaultChangedCheckContract": "True variance1/3, MF1/5, mean2; independent Schur complement and familyKL.2554128. Prior counted once.",
      "manuscriptLine": 300,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V44",
      "placement": "§7",
      "wholeAcceptedObjectContract": "Natural-parameter weighted step on the (h,J) plane with positive precision domain.",
      "wholeAcceptedDefaultChangedCheckContract": "Above h/J values; η=(h,−J/2), cannot average arbitrary draws/moments interchangeably. Algebra, Fisher local metric explanation and schedule assumptions.",
      "manuscriptLine": 310,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V45",
      "placement": "§8",
      "wholeAcceptedObjectContract": "Three independent observed cases each map to a different posterior density through the same encoder rule.",
      "wholeAcceptedDefaultChangedCheckContract": "Current x=−2,0,2,meanx/2,var.5; full preserved programme and no sequential-update confusion.",
      "manuscriptLine": 317,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V46",
      "placement": "§8",
      "wholeAcceptedObjectContract": "Posterior predictive variance is two actual independent contributions, latent.5 plus measurement1.",
      "wholeAcceptedDefaultChangedCheckContract": "Total1.5; means-onlyplug-in1 discards uncertainty. Changed observationvariance4 gives latent.8,total4.8.",
      "manuscriptLine": 322,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V47",
      "placement": "§8",
      "wholeAcceptedObjectContract": "Shared restricted mean-zero encoder versus per-case correct means shown on the same case axes.",
      "wholeAcceptedDefaultChangedCheckContract": "x2 gives KL1; family/amortization versus finite optimizer error distinguished.",
      "manuscriptLine": 332,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V48",
      "placement": "§9",
      "wholeAcceptedObjectContract": "Physical variance v>0 maps to τ=logσ with v=exp(2τ), density intervals and Jacobian2exp(2τ).",
      "wholeAcceptedDefaultChangedCheckContract": "τ0/±1, actual transformed interval masses; qτNormal induces lognormal v. Numerical change-of-variable integral.",
      "manuscriptLine": 339,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V49",
      "placement": "§9",
      "wholeAcceptedObjectContract": "Independence grids in (μ,v) and (μ,τ) map into different physical density contours.",
      "wholeAcceptedDefaultChangedCheckContract": "ProductNormal/IG versus productNormal/Normalτ: independence is preserved by the componentwise monotone v=exp(2τ) transform, while the parametric physical families differ. Mixing-coordinate transforms such as V19 can instead induce or remove dependence.",
      "manuscriptLine": 344,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V50",
      "placement": "§10",
      "wholeAcceptedObjectContract": "All ten actual paired sleep observations linked by subject ID and exact signed difference.",
      "wholeAcceptedDefaultChangedCheckContract": "Current immutable raw CSV3b2736…; difference list[1.2,2.4,1.3,1.3,0,1,1.8,.8,4.6,1.4]. Full pairing/provenance/license/observational limits retained from prerequisite.",
      "manuscriptLine": 351,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V51",
      "placement": "§10",
      "wholeAcceptedObjectContract": "Exact NIG joint contour has μ conditional width increasing with v; its true marginal μ density stays distinct.",
      "wholeAcceptedDefaultChangedCheckContract": "κ11,m79/55,α7,β10937/1100; initial display μ∈[−1,4],v∈[.1,5], exact unrenormalized density and t14 reference. This finite display window does not replace the complete positive-v family or exact tail integral.",
      "manuscriptLine": 358,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V52",
      "placement": "§10",
      "wholeAcceptedObjectContract": "Live product Normal/IG factor updates expose E1/v and Elogv, updated μ variance and IG scale.",
      "wholeAcceptedDefaultChangedCheckContract": "Start m0,Varμ1,shape7.5,scale12;0–20 complete sweeps, Reset; optimumVarμ.1291263282,IGscale10.6529221,KL.03528858593. Closed factor equations and global profile proof.",
      "manuscriptLine": 363,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V53",
      "placement": "§10",
      "wholeAcceptedObjectContract": "Normal/logσ product family profile and exact optimum mapped back to v alongside V52's family.",
      "wholeAcceptedDefaultChangedCheckContract": "τvar1/30,τmean.2087989371,KL.04639314569; full Jacobian, strict one-dimensional profile signs and boundary limits. A different family, not a finite ADVI result.",
      "manuscriptLine": 376,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V54",
      "placement": "§10",
      "wholeAcceptedObjectContract": "Exact μ tail above2 versus both product families' tail on common density and probability axes.",
      "wholeAcceptedDefaultChangedCheckContract": "Exact.06953901319,approx.05837926345; exactμvar.15064738 versus.12912633, CDF oracle. No causal treatment-effect claim.",
      "manuscriptLine": 390,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V55",
      "placement": "§11",
      "wholeAcceptedObjectContract": "Live finite importance ratios on A,B,C and two explicitly named estimator-precision quantities.",
      "wholeAcceptedDefaultChangedCheckContract": "Normalized target p=(.2,.5,.3), default uniform q/indicatorB gives exact I=.5 with no sampling error; raw-IS single-draw variance .5, SN asymptotic variance coefficient .285 and ratio second moment1.14. Exact q=p has flat ratio1; qB0 lacks target support. Full three-state enumeration and independent exact arithmetic; no fitted Pareto diagnostic.",
      "manuscriptLine": 397,
      "contentPlacementBeforeWalkthrough": true,
      "live": true,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V56",
      "placement": "§11",
      "wholeAcceptedObjectContract": "A small q-centered sample window misses a separate target mode; all sampled ratios can look benign.",
      "wholeAcceptedDefaultChangedCheckContract": "Two-mode target from V25; actual deterministic selected points explicitly not a representative random benchmark. Missing-support/mode warning has a real density object.",
      "manuscriptLine": 411,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V57",
      "placement": "§11",
      "wholeAcceptedObjectContract": "VSBC repeated-generative structure has model draws, simulated observations, fitted centre and calibration ranks.",
      "wholeAcceptedDefaultChangedCheckContract": "Exact Normal generative example: evaluate the fitted posterior CDF at the simulated true latent value, with the fitted median marked. This rank is uniform for the exact conditional posterior; the broader VSBC symmetry check alone does not certify spread or fixed observed-data fidelity. No invented histogram.",
      "manuscriptLine": 416,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V58",
      "placement": "§11",
      "wholeAcceptedObjectContract": "Preserved actual PyMC fitted means/variances overlay analytic mean-field optimum and true target contour.",
      "wholeAcceptedDefaultChangedCheckContract": "rho.8 and0, exact recorded achieved/family/optimization KL fields; no new fit, all actual rows conserved.",
      "manuscriptLine": 423,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V59",
      "placement": "§11",
      "wholeAcceptedObjectContract": "Function-specific answer path joins target definition, family capability, achieved optimization and reported quantity uncertainty.",
      "wholeAcceptedDefaultChangedCheckContract": "Gaussian sum/difference, mixture sign and sleep tail each trace their actual quantities; concrete pictures/values rather than a generic boxed checklist.",
      "manuscriptLine": 435,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    },
    {
      "id": "V60",
      "placement": "§11",
      "wholeAcceptedObjectContract": "Richer-family alternatives use actual Gaussian/full-covariance and two-density mixture shapes.",
      "wholeAcceptedDefaultChangedCheckContract": "Full Gaussian fixes the Gaussian dependency; mixture can represent separate modes; neither promises universal fidelity. Flow/Pathfinder ownership bridge with scoped resource, no new programme.",
      "manuscriptLine": 440,
      "contentPlacementBeforeWalkthrough": true,
      "live": false,
      "runtimeDrawingImplemented": false
    }
  ],
  "acceptedSourcePacketSha256": "c5ef6f4c1f11dbb3480618d4a7d23bafd11990c3be13d1c2d7215a590b256050",
  "wholeAcceptedReadingSha256": "78460c3de1f754b287117f70b956581d0bfb45f2ab08519e7bee6039c3422031"
};
