import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {MathBlock,Math as InlineMath} from '../../components/content/Math.jsx';
import {LessonIntro,LessonTable as NeuralTable} from '../../components/lesson-labs/LessonElements.jsx';
import {ReadingState,Equation} from '../../components/lesson-labs/gbt-reading-flow/Common.jsx';
import GbtDrawing from '../../components/lesson-labs/gbt-reading-flow/Drawings.jsx';
import {GbtProgram,GbtNewProgram,SupportingFiles} from '../../components/lesson-labs/gbt-reading-flow/Programs.jsx';
export default { title:'Gradient Boosted Trees (XGBoost, LightGBM, CatBoost)',readTime:'~100 min read + 2–3 hours practice',hasIntegratedGuide:true,content:()=> <ReadingState><div className="lesson-pilot lesson-flow gbt-reading-flow">
<Prose>{""}<strong>{"Explore as you read."}</strong>{" Change an actual feature, target, split or eligible row and follow its effect through the calculation. Each investigation shows its current answer immediately. Number controls report their exact stored floating-point input beneath the field; diagram decimals are rounded for reading, and small nonzero quantities use exponential notation. A changed input may leave an answer unchanged; use the visible operation to explain that null."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the saved tree paths and residual updates in §§1–2, then binary loss and leaf/split costs in §§3–4. Read candidate search in §5, selection in §8 and the measured application in §9. The deeper branches add robust losses, coupled class scores, weighted cuts, sampling, category histories and interpretation. Practice in §11 changes both numbers and conditions. Read and experiment in separate sessions if useful."}</Prose>

<LessonIntro prerequisites={<>{"You need arithmetic means and a regression tree's predicate/branch/leaf. "}<a href={"/learn/path/full-curriculum/decision-trees-random-forests?module=classical-machine-learning"}>{"Decision Trees & Random Forests"}</a>{" supplies the actual sorted mean-leaf implementation used below. "}<a href={"/learn/path/full-curriculum/linear-logistic-regression?module=classical-machine-learning"}>{"Linear & Logistic Regression"}</a>{" supplies objective and probability ideas; each local derivative is refreshed here. Python code has its own explicit dependencies beside the program."}</>}>{"Can ingredient amounts and age predict the recorded strength of a held-out concrete composition better than a training mean or a linear model? The supplied UCI Concrete Strength observations contain seven ingredient quantities in kg/m³, age in days and measured strength in MPa. We will return to that question with a predeclared, validation-selected experiment in §9. First, use small invented observations whose tree calculations can be checked by hand. Their numbers are not concrete measurements."}</LessonIntro>

<SupportingFiles />

<Prose>{"In "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-machine-learning"}>{"KNN"}</a>{", a query selects stored observations and combines their targets. Here, training saves conditional rules. A new query follows those rules without supplying its target or looking up training labels. A hypothetical machine-energy example makes the distinction useful: a linear baseline may miss a cooling threshold that only matters in one operating mode. A tree can express the condition; successive trees can repair different remaining errors. This example motivates the mechanism without claiming measured machine performance."}</Prose>

<H2>{"1. Predict with a sequence of corrections"}</H2>

<Prose>{"A "}<strong>{"row"}</strong>{" is one prediction case. Its features x are available when predicting; its target y is the observed outcome. A regression tree tests a feature, follows one of two branches and returns the value in the reached leaf. Its saved nodes, thresholds and leaf values are sufficient for inference."}</Prose>

<GbtDrawing id="D01" />

<Prose>{"Follow x=4.5 into the predicate x≤3.5. It takes the no branch, marked x>3.5, to a raw correction leaf +8/3. Follow x=2.5 along the yes branch to −8/3. Equality follows the ≤ branch. The input is the feature, the threshold is a saved rule and the leaf is a saved numerical response. A new target is absent from this path."}</Prose>

<Prose>{"The six illustrative training cases are x=[1,2,3,4,5,6] and y=[2,2,3,7,8,8]. Their mean is 5. Start with the constant predictor F0(x)=5. The tree above does not directly predict these targets: its raw leaves are corrections to 5. With learning rate η=.5, the first applied correction is half the raw leaf value."}</Prose>

<GbtDrawing id="D02" />

<Prose>{"For x=4.5, the first saved path contributes .5×8/3=4/3, so F1=5+4/3=19/3. For x=2.5, F1=5−4/3=11/3. Moving x=4.5 to 4.75 stays in the same leaf and leaves the prediction fixed. Moving it to 2.5 changes the path and the answer. Neither edit trains a tree."}</Prose>

<GbtDrawing id="D03" />

<Prose>{"The second saved tree has the same 3.5 threshold and raw leaves −4/3,+4/3. Its right-side contribution is .5×4/3=2/3. The two-tree prediction at 4.5 is therefore 5+4/3+2/3=7. The connected sum includes the intercept once and the learning rate once per raw leaf. If a storage format already stores scaled leaves, multiplying them by η again would be wrong; this lesson stores raw leaves."}</Prose>

<Prose>{"For M saved trees, write"}</Prose>

<Equation><MathBlock>{"F_M(x)=F_0(x)+\\eta\\sum_{m=1}^{M}f_m(x)."}</MathBlock></Equation>

<Prose>{"Here f_m(x) is the raw reached leaf in tree m. A forest averages separately constructed tree predictions. Boosting instead adds trees constructed in sequence from the current predictor's remaining error. The shared tree shape does not make those training rules the same."}</Prose>

<H3>{"The complete original three-stump trace"}</H3>

<GbtProgram name="residual-corrections" />

<Prose>{"The program first finds the mean intercept, enumerates legal cuts, computes each side's mean residual and chooses a strictly better split. "}<code>{"predict"}</code>{" follows the saved stump. After fitting each stump, it adds "}<code>{"rate * raw_leaf"}</code>{" to every current score. The last statement predicts x=4.5 using saved trees alone."}</Prose>

<Prose>{"Its output includes three fitted stumps and predicts 7.25 after the third. That agrees with the two-tree prediction 7 above: the third stump adds.25 at that query. Follow every saved response rather than using just the final tree. The five historical standalone examples and their preserved output text are linked at the end of §10 and collected in the file index; their limitations are explained there."}</Prose>

<Prose>{"The small exhaustive stump code makes the operation transparent. Repeatedly slicing every threshold is not the efficient final tree search. The sorted recursive primitive and efficient ensemble come next."}</Prose>

<H2>{"2. Fit the errors before adding the tree"}</H2>

<Prose>{"Inference only needs saved rules. Training needs to decide which correction to save. For squared error, each target asks for the difference between its observed value and current score: r_i=y_i−F(x_i). A leaf has to give the same answer to every row assigned to it, so it cannot independently satisfy all those requests."}</Prose>

<GbtDrawing id="D04" />

<Prose>{"At the initial score 5, the six residuals are [−3,−3,−2,2,3,3]. The cut 3.5 places the first three together and the last three together. Their residual sums are −8 and+8; each count is 3. The two mean requests are −8/3 and+8/3. Applying half-strength corrections gives scores [11/3,11/3,11/3,19/3,19/3,19/3]. Keep the same row IDs through target, current score, residual, leaf assignment and updated score."}</Prose>

<Prose>{"Targets are editable observations used for this calculation; a rate changes how much of a learned correction is applied. Selecting a row only emphasizes its route. Applying a valid target vector or changing the rate restarts the sequence rather than mixing old trees with new targets. Empty, nonfinite or out-of-range drafts retain the last valid model and state the error. Arbitrary finite decimal/exponent entries inside the stated domain are accepted; navigation steps do not round them."}</Prose>

<GbtDrawing id="D05" />

<Prose>{"Why the mean? In one fixed leaf L, choose its scalar answer c to minimize the squared residual objective"}</Prose>

<Equation><MathBlock>{"\\sum_{i\\in L}(r_i-c)^2."}</MathBlock></Equation>

<Prose>{"Differentiating gives 2∑(c−r_i)=0, hence c=∑r_i/|L|. The second derivative 2|L| is positive for a nonempty leaf. Equivalently, writing each residual as its leaf mean r̄ plus a deviation gives "}<code>{"Σ(rᵢ−c)²=Σ(rᵢ−r̄)²+|L|(c−r̄)²"}</code>{": the cross term vanishes because the deviations sum to0. The first term is unavoidable within-leaf variation; the second is smallest at the mean. On the left,−8/3 is the shared answer closest to all three requests; it does not erase their differences. A tree fits one repeated answer per region, not one arbitrary answer per observation."}</Prose>

<Prose>{"Let f be this mean-leaf fit across a fixed partition. In ordinary unweighted squared loss, its residual orthogonality is ∑_i(r_i−f_i)f_i=0. Expand the error after a rate η step:"}</Prose>

<Equation><MathBlock>{"\\sum_i(r_i-\\eta f_i)^2\n=\\sum_i r_i^2-\\eta(2-\\eta)\\sum_i f_i^2."}</MathBlock></Equation>

<Prose>{"Thus a nonzero fitted response decreases this training SSE for 0<η<2. η=0 leaves the predictor unchanged. At η=2 the SSE is unchanged even though a nonzero response changes predictions; beyond2 it increases. At η=1, each leaf's mean request is applied, yet within-leaf deviations remain. The statement concerns this loss, full rows and mean-leaf partition; it is not a theorem about penalized Newton updates, subsampling, another loss or unseen targets. Smaller steps leave more error for later trees and may require more rounds."}</Prose>

<Prose>{"For the six rows, initial SSE 44/MSE 22/3 becomes SSE 12/MSE 2 after the half step. Fit the "}<strong>{"new"}</strong>{" residuals for the next tree: the left mean is now −4/3 and right mean+4/3. The second half step gives scores [3,3,3,7,7,7] and MSE 2/3. Reusing the original residuals would be a different algorithm."}</Prose>

<GbtDrawing id="D06" />

<Prose>{"There are five legal cuts between the six distinct x values. At2.5, for example, the left residual mean is −3 and the right mean 1.5. Add the four right squared deviations and compare its residual SSE with 3.5. A prefix scan sorts feature values once, moves rows across a candidate boundary and reuses accumulated moments. Equal feature values cannot be separated by a numerical threshold. An empty side is not a valid leaf."}</Prose>

<H3>{"The complete recursive tree trace"}</H3>

<GbtProgram name="recursive-regression" />

<Prose>{"The recursive program grows a tree by considering legal feature/cut pairs, selecting a reduction in residual error and repeating inside each child. A depth bound limits nesting; a minimum-leaf rule limits how few observations support one shared response. Its numerical synthetic output belongs to its declared 100-row fixture, rather than the six arithmetic rows. The next implementation replaces repeated slicing with the efficient sorted-tree primitive."}</Prose>

<H3>{"Capacity and what greedy search discovers"}</H3>

<GbtDrawing id="D07" />

<Prose>{"At the four corners of a square, label the off-diagonal points (0,1) and (1,0) 1 and the diagonal points (0,0) and (1,1) 0. A manually constructed depth-two tree can test x1≤.5 and then x2≤.5, producing the four required regions. A sum of stumps that test one coordinate at a time has the form a(x1)+b(x2); its opposite-corner sums must match and cannot equal the XOR pattern's 0+0 versus 1+1."}</Prose>

<Prose>{"Representability still does not guarantee greedy discovery. On balanced XOR, either first coordinate cut has zero SSE improvement. A strict-positive-gain greedy learner stops at the root even when depth 2 is allowed. The diagram is an explicit capacity construction beside a search failure, not a claimed fit result. A different fixture with a positive root gain permits actual recursive discovery; follow that operation rather than inferring training from allowed depth."}</Prose>

<H3>{"Compose the efficient published tree into a saved ensemble"}</H3>

<GbtDrawing id="D08" />

<Prose>{"The efficient program supplies Decision Trees' "}<code>{"regression-tree.py"}</code>{" dependency beside "}<code>{"residual-ensemble.py"}</code>{". Importing it does not execute its guarded demonstration. Its per-feature sorted prefix/suffix moments evaluate distinct boundaries, use an adjacent-float-safe ≤ threshold and create a mean leaf when no positive improvement exists. "}<code>{"max_features=None"}</code>{" uses every feature; this route does not bootstrap rows or sample columns."}</Prose>

<GbtNewProgram name="residual-ensemble.py" />

<Prose>{""}<code>{"fit"}</code>{" computes one mean intercept and starts every training score there. Each round fits a new "}<code>{"RegressionTree"}</code>{" to "}<code>{"y-current"}</code>{", updates the current scores and appends that tree to a "}<strong>{"local"}</strong>{" list. A successful fit replaces the stored list/intercept; calling fit again does not append a second experiment's trees. "}<code>{"predict(prefix=0)"}</code>{" returns the intercept; other prefixes add the requested number of saved raw responses. Incremental addition avoids allocating an M-by-query prediction table."}</Prose>

<Prose>{"The two-round, unique-best-cut fixture agrees with ordinary sklearn "}<code>{"GradientBoostingRegressor(loss='squared_error', n_estimators=2, learning_rate=.5, max_depth=1)"}</code>{": queries [−2,2.5,4.5,8] return [3,3,7,7], and the training MSE sequence is[7.333333,2,.666667]. The mean initialization and fixed unique split make this a meaningful mapped comparison. It does not claim every tied split or library growth detail is identical."}</Prose>

<Prose>{"For d features and n_v rows at a visited node, sorting costs O(d n_v log n_v). Sum that work over visited nodes and rounds; a universal O(n log n) claim would conceal depth and the repeated fits. Predictions follow one path per saved tree. More rounds and deeper trees increase both capacity and work, while the held-out benefit still needs evaluation."}</Prose>

<Prose>{"Change the targets to[0,0,4,4] at x[1,2,3,4] and use η=.25. The mean is 2; the cut 2.5 has raw leaves −2,+2. One step produces [1.5,1.5,2.5,2.5] and MSE 2.25. If every x were equal, no cut could separate those requests: the shared residual mean at the mean intercept is 0, so the predictor would remain 2. These are different reasons for a small or null update; the row/leaf route identifies which one occurred."}</Prose>

<H2>{"3. Change the loss without changing the question"}</H2>

<Prose>{"Squared residuals gave each row a request for its desired change. Classification, asymmetric costs and robustness need different requests. Keep the same additive score and tree routes; change the loss that tells training which errors matter."}</Prose>

<GbtDrawing id="D09" />

<Prose>{"Think of the six current predictions as six coordinates of a vector F. For a differentiable row loss L(y,F), the negative gradient "}<code>{"rᵢ=−∂L(yᵢ,Fᵢ)/∂Fᵢ"}</code>{" points toward locally lower loss. Under half squared error, this is exactly yᵢ−Fᵢ. The drawn residual vector has six independently requested values, while the tree can answer only with repeated leaf values. Fitting the tree by least squares finds the closest permitted response vector for that selected partition."}</Prose>

<Prose>{"That restriction is the point of "}<strong>{"functional gradient boosting"}</strong>{": improve a function by adding a fitted function, rather than moving one unrestricted coefficient for every observation. A raw inner product with the gradient would be driven arbitrarily far by rescaling a direction. Specifying a least-squares tree fit and then an actual-loss step or leaf search makes the procedure concrete. Tree growth is still greedy; it does not find the best function over every possible tree."}</Prose>

<Prose>{"After a partition is found, its leaf values may be refined for the actual loss. A line search chooses a shared step along a direction; a leaf search chooses a value in each fixed region. Shrinkage multiplies the resulting response by η. These are different decisions. Squared loss collapses them to familiar residual means; other losses do not."}</Prose>

<H3>{"Binary classification adds scores before probabilities"}</H3>

<GbtDrawing id="D10" />

<Prose>{"Use F as a "}<strong>{"logit"}</strong>{", an unrestricted real score. Convert its total to a probability only after adding the saved tree contributions: "}<code>{"p=1/(1+exp(−F))"}</code>{". At F=0, p=.5. A positive contribution makes class 1 more probable; a negative one makes it less probable. Adding probabilities from separate trees would not implement this model."}</Prose>

<Prose>{"For labels y=0 or y=1, binary log loss is "}<code>{"L(y,F)=log(1+exp(F))−yF"}</code>{". Differentiate once to get "}<code>{"g=p−y"}</code>{", and again to get "}<code>{"h=p(1−p)"}</code>{". The requested first-order correction is −g. At F=0, y=1 requests +.5 and y=0 requests −.5; both have curvature .25. Far into a confident prediction, curvature is much smaller. It measures how quickly the gradient changes locally, rather than how many rows a leaf contains."}</Prose>

<Prose>{"The loss-minimizing constant has odds equal to the class-frequency odds: "}<code>{"F₀=log(ȳ/(1−ȳ))"}</code>{" when 0<ȳ<1. All-one or all-zero data have an infinite constant optimum; a practical finite initialization needs an explicit convention. The new binary program clips that initial frequency to[10⁻⁶,1−10⁻⁶]. It is a numerical starting choice, not evidence that the population probability lies in that interval. Stable "}<code>{"expit"}</code>{" and "}<code>{"logaddexp(0,F)−yF"}</code>{" avoid overflow for ordinary extreme scores; floating-point saturation does not prove a mathematically exact zero probability."}</Prose>

<GbtProgram name="loss-derivatives" />

<Prose>{"The derivative program connects squared and binary gradients to finite differences. Its row y, score F and loss convention must match the calculation. A derivative with respect to a probability would have a different scale from the derivative with respect to a logit used here."}</Prose>

<H3>{"Deeper: robust directions still need robust leaf values"}</H3>

<GbtDrawing id="D11" />

<Prose>{"Put three residual requests −2,−1,10 into the same leaf. Squared error's minimizer is their mean 7/3, so the large request pulls the shared response upward. Absolute error's minimizer is a median, here −1. Its negative subgradient at the current score can be chosen as sign(residual), with 0 at a zero residual. Fitting those signs identifies a direction; their mean is not the residual location that minimizes the actual absolute loss."}</Prose>

<Prose>{"For a fixed Huber threshold δ=2, small residuals use half squared error and large ones use "}<code>{"δ(|r|−δ/2)"}</code>{". Its requested change clips a residual to[−δ,δ]. To minimize the actual loss inside the leaf, choose w so "}<code>{"Σ clip(w−rᵢ,−δ,δ)=0"}</code>{". At w=−.5, the three terms are 1.5,.5,−2, whose sum is 0. Thus the fixed-Huber leaf is −.5, between the mean and median for this fixture."}</Prose>

<GbtNewProgram name="loss-specific-leaves.py" />

<Prose>{""}<code>{"absolute_leaf"}</code>{" delegates the sorted order statistic to NumPy's median. "}<code>{"huber_leaf"}</code>{" brackets the root between the smallest and largest residual; its monotone derivative sum permits bisection. The program independently minimizes the same scalar objective with SciPy. Change the residuals to[−4,0,7], keeping δ=2: the mean is 1, and both the median and a Huber minimizer are 0."}</Prose>

<Prose>{"There need not be one Huber minimizer. For residuals [−4,4] and δ=1, every w in[−3,3] has objective 7 and derivative 0. Two optimizers may return different locations and still solve the same problem. Compare objective and stationarity, rather than demanding equal floating-point w. An even-size absolute-loss leaf can likewise have a whole median interval."}</Prose>

<Prose>{"The ordinary sklearn "}<code>{"GradientBoostingRegressor"}</code>{" routes in this program use "}<code>{"loss='absolute_error'"}</code>{" or "}<code>{"loss='huber'"}</code>{", with two saved trees and shrinkage. The native Huber route adapts its threshold using "}<code>{"alpha=.9"}</code>{"; it is not the same fixed δ=2 objective used for the three-point derivation. The declared six-row native predictions are actual program output. Neither a nonsmooth absolute loss nor the linear tail of Huber supplies a universally positive scalar Hessian; blindly applying the next section's Newton denominator would be a different and sometimes undefined operation."}</Prose>

<H3>{"Asymmetric costs choose a quantile"}</H3>

<GbtDrawing id="D12" />

<Prose>{"Suppose stocking too little costs four times as much per unit as stocking too much. Let demand be y and stock be F. Pinball loss charges τ(y−F) for positive residuals and(1−τ)(F−y) for negative ones. The cost ratio τ/(1−τ)=4 gives τ=.8. Below a demand value, increasing stock lowers its shortage cost; above it, increasing stock raises excess cost. At the optimum, these slopes balance."}</Prose>

<Prose>{"For the five equally weighted demands [0,1,1,2,8], four of five observations are at or below 2. Every stock level between 2 and 8 minimizes the empirical τ=.8 objective: no observations lie strictly inside that interval, and the net slope there is 0. At τ=.6, the minimizing interval is[1,2]. The distribution condition is "}<code>{"C(F−)≤τ≤C(F)"}</code>{", where C(F−) excludes mass exactly at F and C(F) includes it. Writing only “take the percentile” conceals ties and flat intervals."}</Prose>

<GbtProgram name="quantile-planning" />

<Prose>{"The exact Fraction program enumerates costs and interval boundaries without Monte Carlo error. Production quantile boosting fits these asymmetric requests to conditional regions; the ordinary sklearn route is "}<code>{"GradientBoostingRegressor(loss='quantile',alpha=τ)"}</code>{". A single fitted quantile is a decision under the stated costs. Two independently fitted quantiles can cross, and neither automatically certifies predictive-interval coverage."}</Prose>

<H3>{"Deeper: multiclass curvature couples classes"}</H3>

<GbtDrawing id="D13" />

<Prose>{"With three classes, each row carries three raw scores. Subtract their maximum, exponentiate and divide by the sum to obtain stable softmax probabilities. At three zero scores, each probability is 1/3. For one-hot target t, cross-entropy has gradient p−t and Hessian "}<code>{"diag(p)−ppᵀ"}</code>{": its diagonal entries are 2/9 and off-diagonal entries −1/9 at this starting point."}</Prose>

<Prose>{"Changing class 1's score affects all three probabilities. The off-diagonal terms record that coupling. Adding the same constant to every score changes no probability; the Hessian's rows sum to 0 and its all-ones direction is singular. A diagonal approximation can make computation easier, but it is not the full scalar-independent Newton solution."}</Prose>

<GbtNewProgram name="multiclass-curvature.py" />

<Prose>{"The curvature program calculates the full matrix, finite-difference correspondence and common-shift null. It intentionally does not implement a complete multiclass boosting engine. Native multiclass APIs use class-aware objectives, and a boosting round need not mean one physical tree."}</Prose>

<H2>{"4. Price a leaf and a split"}</H2>

<Prose>{"The first-order direction says which way to move. Curvature also says how quickly that advice changes. A quadratic approximation makes the cost of one leaf's shared response easy to compute from two sums. This is the core bridge to regularized second-order tree boosting."}</Prose>

<GbtDrawing id="D14" />

<Prose>{"Start with the five targets [1,2,3,4,5] and a deliberately chosen current squared-loss score 2.5. It is not their mean 3. Gradients are [1.5,.5,−.5,−1.5,−2.5] and every Hessian is 1. The proposed split puts the first two rows left: G_L=2,H_L=2; the right three give G_R=−4.5,H_R=3. The parent has G=−2.5,H=5. Counts and curvature happen to agree here; binary log loss breaks that coincidence."}</Prose>

<Prose>{"Taylor-expand each row's loss for a proposed increment w: its changing part is "}<code>{"gᵢw+hᵢw²/2"}</code>{". A leaf gives all its rows the same w, so aggregation leaves "}<code>{"Gw+Hw²/2"}</code>{". Include L2 leaf regularization λw²/2, L1α|w| and γ per leaf. The local objective becomes "}<code>{"Gw+(H+λ)w²/2+α|w|+γ"}</code>{"."}</Prose>

<GbtDrawing id="D15" />

<Prose>{"Without L1, differentiate the curve: "}<code>{"G+(H+λ)w=0"}</code>{", giving "}<code>{"w*=−G/(H+λ)"}</code>{". Substitution improves the quadratic part by "}<code>{"G²/[2(H+λ)]"}</code>{" relative to w=0. For the same G=−2 and λ=1, H=1 gives w=1, while H=3 gives w=.5. More curvature makes the same gradient advice less aggressive. λ adds further curvature; it continuously shrinks a fixed-gradient leaf toward 0."}</Prose>

<Prose>{"The formula requires H+λ>0. A negative-curvature custom objective can make this a maximum rather than a minimum. In the live calculation, the named numerical curvature guard is 10⁻¹⁰; a smaller denominator is rejected as numerically unsupported, rather than silently divided or described as exact zero. The scratch implementation accepts nonnegative row Hessians and nonnegative penalties. Those are its explicit surrogate assumptions."}</Prose>

<GbtDrawing id="D16" />

<Prose>{"L1 changes the derivative by α to the right of 0 and −α to the left. If |G|≤α,0 is optimal. Otherwise soften G toward 0 by α, then divide by curvature: "}<code>{"soft(G,α)=sign(G) max(|G|−α,0)"}</code>{" and "}<code>{"w*=−soft(G,α)/(H+λ)"}</code>{". The improvement is "}<code>{"S(G,H)=soft(G,α)²/[2(H+λ)]"}</code>{". The drawing shows the actual dead zone and the remaining signed numerator; L1 is not merely another number added to the denominator."}</Prose>

<GbtDrawing id="D17" />

<Prose>{"A split replaces one leaf by two. Its net surrogate improvement is "}<code>{"S_L+S_R−S_parent−γ"}</code>{": two leaf charges replace one, so exactly one extra γ remains. With the five squared-loss rows,λ=1,α=0 and γ=0, the left weight is −2/3, the right 1.125 and the parent 5/12. Their improvements 2/3,2.53125 and 25/48 give net gain 2.677083333…. Setting γ=3 rejects this candidate. Equality to 0 is rejected by the strict-positive-gain rule."}</Prose>

<GbtProgram name="regularized-split" />

<Prose>{"The program exposes those operands and then multiplies accepted raw weights by η=.3. The current score 2.5 becomes 2.3 on the first two rows and 2.8375 on the others. Those are shrunken responses; do not multiply a stored already-scaled production leaf twice. Candidate drawing controls continue to show the proposed left/right responses even when penalties reject the split, while the accepted predictor retains the parent decision."}</Prose>

<H3>{"Deeper: the local promise is about a surrogate"}</H3>

<GbtDrawing id="D18" />

<Prose>{"At current binary logit −4, the probability is about.017986. Take labels [0,0,1,1,1] and the "}<strong>{"specified"}</strong>{" split after row 3. Its left leaf mixes two negatives and one positive; its right leaf contains two positives. With λ=0, the very small curvatures produce large raw Newton weights. A full step overshoots the mixed leaf's actual logistic optimum and increases total actual log loss, despite improving the local quadratic surrogate. A step.1 lowers it. The plotted two curves share the same w-axis and current score; the Taylor curve is a local approximation, not a second measured loss."}</Prose>

<Prose>{"This example evaluates a chosen mixed-label candidate. A greedy fit free to choose a different split can select the pure boundary after row 2 and behave differently. Shrinkage and validation help manage such effects; they do not turn every local quadratic gain into a theorem about generalization."}</Prose>

<GbtDrawing id="D19" />

<Prose>{"When each hᵢ>0, complete the square: "}<code>{"gᵢw+hᵢw²/2 = hᵢ(w−zᵢ)²/2 − gᵢ²/(2hᵢ)"}</code>{", with "}<code>{"zᵢ=−gᵢ/hᵢ"}</code>{". Thus an unregularized Newton leaf is a curvature-weighted fit to the pseudo-targets z. This connects to the square-root row weighting taught in "}<a href={"/learn/path/full-curriculum/linear-logistic-regression?module=classical-machine-learning#3-derive-a-fit-and-understand-its-geometry"}>{"weighted least squares"}</a>{". Here the weights come from the changing loss curvature. Ordinary observation weights instead multiply both g and h; they represent the training importance assigned to observations."}</Prose>

<Prose>{"Zero h cannot define z; the aggregate quadratic may still be usable when H+λ is positive. Multiplying the entire loss by c also multiplies G and H by c. With fixed λ,α,γ this changes effective regularization. To preserve the same responses and split decision, scale those penalties by c too. This is why half squared loss and an unhalved squared loss need explicitly mapped derivative/penalty conventions."}</Prose>

<H3>{"Implement the greedy second-order learner"}</H3>

<GbtNewProgram name="newton-tree.py" />

<Prose>{""}<code>{"NewtonTree.fit(X,g,h)"}</code>{" sorts each feature's nonmissing rows, scans only unequal-value boundaries, accumulates prefix G/H and obtains the right statistics by subtraction. For each boundary it evaluates missing rows on both sides. Minimum row count, curvature mass, depth and positive net gain constrain the accepted children. Feature order, ascending boundary and then missing-left order resolve exact ties. The saved node stores feature, ≤ threshold and default missing direction; prediction uses those values, not a new search."}</Prose>

<Prose>{"The threshold is the midpoint when representable. If adjacent floating-point values have no interior midpoint, use the lower value with ≤ routing so the two observed values remain separated. NaN denotes missing; infinity is rejected. This reference enumerates boundaries between distinct finite values; a standalone missing-versus-known predicate is outside its candidate set. Sorting costs O(d n_v log n_v) at a visited node and the subsequent candidate scan O(d n_v); sum over visited nodes and rounds. Prediction follows one saved path per tree. This exact candidate search is greedy and is not globally exact optimization over all tree topologies."}</Prose>

<Prose>{""}<code>{"NewtonEnsemble"}</code>{" recomputes gradients and Hessians at the current total score, fits a fresh tree, and adds its shrunken response. Fit replaces state, prefix 0 returns the saved intercept, and binary probabilities transform the whole score once. The new one-tree half-squared-loss example uses mean intercept 5,λ=1,α=0,γ=0,depth 1 and η=.3. Its cut 3.5 has G/H pairs(8,3),(−8,3), raw leaves −2,+2 and gain 16. Training scores become [4.4,4.4,4.4,5.6,5.6,5.6]."}</Prose>

<Prose>{"Ordinary "}<code>{"XGBRegressor(tree_method='exact',objective='reg:squarederror')"}</code>{" is configured with the same one round, base score 5, rate, penalties, full rows/features and minimum curvature 0. Its raw-margin predictions agree on these observed x values to within 10⁻⁶, reflecting float32 native output. This mapped, unique-cut comparison does not certify every tie, growth policy, missing fixture or production optimizer as identical. Extend the supplied learner by recording node membership/gain, changing an observation weight or imposing a curvature bound; then explain why the saved route changes or stays null."}</Prose>

<H2>{"5. Search fewer boundaries with clear tradeoffs"}</H2>

<Prose>{"The gain formula does not require recomputing every row sum at every boundary. The next question is which boundaries to represent, and how to reuse their statistics without changing their meaning."}</Prose>

<GbtDrawing id="D20" />

<Prose>{"Sort one feature's nonmissing rows and move a boundary from left to right. Add the moved row's g and h into G_L,H_L, then obtain G_R,H_R from parent totals minus the left. Equal feature values move together; a threshold cannot put two identical measured values on different sides. Evaluate the leaf/split formula only after a legal boundary with nonempty children. This is the prefix scan used by the new Newton learner."}</Prose>

<H3>{"Quantization removes candidates as well as work"}</H3>

<GbtDrawing id="D21" />

<Prose>{"Use x[1,2,3,4,5,6] with targets [1,1,1,9,9,9]. A cut 3.5 perfectly separates the two target groups. Now quantize x using only boundaries 2.5 and 4.5. Values 3 and 4 share the middle bin, so3.5 is no longer a candidate. The bin's single G/H pair cannot tell a splitter how to put those two rows on opposite sides. A device that computes these same coarse bins faster still cannot recover the removed cut."}</Prose>

<Prose>{"A histogram adds the current row gradients and Hessians into bins, then scans their prefixes. With B bins it offers at most B−1 represented boundaries, instead of up to n−1 raw boundaries. Finer bins can recover useful distinctions, at greater storage and scan cost. Which distinctions matter depends on the data and current loss; there is no universal guarantee of no accuracy loss."}</Prose>

<H3>{"A missing route is a saved part of the tree"}</H3>

<GbtDrawing id="D22" />

<Prose>{"Add a seventh row with missing x and target 8. Its g/h mass is kept separate from every finite bin. For each represented boundary, add that mass to the proposed left side and then to the proposed right side; compare both gains. On the fine fixture the best cut remains 3.5 and missing goes right. Change only its training target to 2 and the preferred default becomes left. The new prediction row follows the saved default without supplying an unknown target."}</Prose>

<GbtProgram name="histogram-missing" />

<GbtNewProgram name="histogram-operations.py" />

<Prose>{""}<code>{"histogram"}</code>{" uses "}<code>{"searchsorted(...,side='left')"}</code>{" so equality follows ≤, and "}<code>{"bincount"}</code>{" aggregates rows rather than repeatedly filtering them at each cut. "}<code>{"candidates"}</code>{" scans cumulative count/G/H arrays and evaluates both missing placements. On target 8, the fine best gain is 51.482143 at 3.5/missing-right; coarse gain 27.523810 at 4.5/missing-right. On target 2, the fine gain is unchanged but its default goes left, and the coarse best cut becomes 2.5. These are half-squared unpenalized gains for the declared seven rows, not native library benchmark measurements."}</Prose>

<Prose>{"The raw scan and histogram scan agree when they represent the "}<strong>{"same"}</strong>{" legal cuts and derivative mass. That conditional conservation claim is different from saying coarse bins preserve every raw optimum. Minimum-leaf or curvature constraints also travel with the scan, not just its final maximum."}</Prose>

<H3>{"Deeper: allocate cut resolution by mass"}</H3>

<GbtDrawing id="D23" />

<Prose>{"Some training values carry more useful cut mass than others. For values [0,1,2,3] with masses [1,1,6,2], the normalized cumulative masses are [.1,.2,.8,1]. Most of the mass lies at 2. Group equal values before accumulating; duplicating a value into several rows should not create fake gaps between them. A chosen cumulative level points to a legal neighborhood for a cut, while the actual derivative histogram still decides split gain."}</Prose>

<Prose>{"The supplied "}<code>{"weighted_cdf"}</code>{" sorts values, groups tied positions with "}<code>{"add.reduceat"}</code>{", then returns their cumulative mass. It teaches the exact empirical object. It does not implement a production mergeable/pruned quantile sketch. In XGBoost, "}<code>{"approx"}</code>{" uses Hessian-weighted sketching during tree construction, while "}<code>{"hist"}</code>{" generally uses a global sketch based on user weights before gradients are accumulated. Check the declared tree method and version; the word “approximate” alone does not specify where information was compressed."}</Prose>

<H3>{"Deeper: one child histogram comes from subtraction"}</H3>

<GbtDrawing id="D24" />

<Prose>{"Every parent's admitted row belongs to exactly one child, so its per-bin statistics equal the sum of the two child histograms. With parent G[3,−1,4],H[2,1,3] and one child G[1,0,2],H[1,0,1], the sibling is G[2,−1,2],H[1,1,2]. Build the smaller child's histogram by visiting its rows, then derive its sibling by parent-minus-child. The saved bin definitions must be identical. Different rebinning would make cellwise subtraction meaningless."}</Prose>

<Prose>{"The supplied operation rejects a child's materially larger curvature mass and clamps only tiny negative cancellation within 10⁻¹⁰ to 0. Gradient totals can be negative; curvature mass under these assumptions cannot. This saves row accumulation work without promising exact arithmetic cancellation for every floating-point scale."}</Prose>

<H3>{"Sparse absence is not always a printed zero"}</H3>

<GbtDrawing id="D25" />

<Prose>{"Compare a dense row's explicit 0, a sparse row with a stored 0 and a sparse row with no stored entry. They can have identical printed nonzero values but different missingness semantics. XGBoost's sparsity-aware tree route can treat absent sparse entries as missing while stored zeros are values. LightGBM normally treats absent sparse entries as 0; "}<code>{"zero_as_missing"}</code>{" changes that policy. CatBoost numeric missing-value modes are separately configured. An imputer or dense-to-sparse conversion can change the route even before a tree sees the row."}</Prose>

<Prose>{"Keep feature order, categorical type, sparse format and missing-value policy with the saved predictor. Test one explicit zero and one absent value through the actual deployment pipeline. A finite result confirms that chosen path, not that every format conversion preserves predictions."}</Prose>

<H3>{"A leaf budget does not imply a balanced tree"}</H3>

<GbtDrawing id="D26" />

<Prose>{"Consider an explicitly hypothetical frontier: splitting the root gives gain 10; its left and right leaves offer 6 and 2. After splitting the left, its left child offers 5. With a three-split budget, depth-wise growth uses root,left,right. Best-first growth instead uses root,left,left-left because the available gain 5 exceeds 2. The drawn trees expose the different visited leaves. These supplied local gains explain a policy; they are not fitted validation measurements."}</Prose>

<GbtDrawing id="D27" />

<Prose>{"A symmetric, or oblivious, depth-two tree shares one test at every node of each depth: x1≤.5 first, then x2≤.5 on both sides. Let a right branch be bit 1 and left bit 0. Input(.75,.25) has path bits 10 and leaf index "}<code>{"2b₀+b₁=2"}</code>{". Sharing tests permits compact indexing; ordinary depth-wise growth need not use the same second test on both branches."}</Prose>

<Prose>{"Maximum depth D implies at most 2ᴰ leaves, while L leaves can form a chain of depth L −1. Thus a 31-leaf budget does not imply a depth near 5. XGBoost exposes depthwise/lossguide growth, LightGBM commonly uses leaf-wise growth, and CatBoost offers symmetric and other policies. Inspect the configured policy rather than inferring topology from the package name. Local gain, tree capacity and held-out benefit remain separate questions."}</Prose>

<H3>{"Count work and memory separately"}</H3>

<GbtDrawing id="D28" />

<Prose>{"At one visited node with n_v rows and d features, dense histogram accumulation is roughly O(d n_v), followed by O(dB) boundary work. Add binning setup and sum this work across all visited nodes and M rounds. New gradients every round still need new accumulation even when bin assignments are cached. For roughly level-wise depth D trees, a crude accumulation model is O(MndD); optimized subtraction and sparsity can reduce parts of it."}</Prose>

<Prose>{"Inference visits one saved path per tree, roughly O(MD) comparisons per row for depth D, plus aggregation. Stored nodes are only part of memory: training also holds data, gradients, quantized bins and active histograms. These rectangles count work and storage, not seconds. GPU arithmetic, fused kernels and distributed reduction can improve particular operations, while a poorly chosen bin representation or deep tree can still be the limiting factor."}</Prose>

<H2>{"6. Sample rows and bundle exclusive features"}</H2>

<Prose>{"Histogram search still visits rows and columns. LightGBM introduced two distinct ways to reduce that work: focus a row sample on strong current gradients, and share storage among columns that never activate together. Their information contracts are different."}</Prose>

<GbtDrawing id="D29" />

<Prose>{"With gradients [8,−6,3,−2,1,−1], keep the two largest absolute values: rows 1 and 2 contribute 8−6=2 exactly. Of the four remaining rows, draw two uniformly without replacement. Each small row's inclusion probability is 2/4; multiply its retained gradient and Hessian by 4/2=2. A retained small row is a weighted observation, an excluded one contributes 0, and the kept large rows retain weight 1."}</Prose>

<Prose>{"For n rows, k always-kept rows, r=n−k remaining and s sampled small rows, the inclusion indicator I gives "}<code>{"E[I(r/s)gᵢ]=gᵢ"}</code>{". Adding contributions proves the conditional gradient-total estimator is unbiased under that sampling law. If a and b denote fractions of "}<strong>{"all n"}</strong>{" kept and drawn, the factor is(1−a)/b. If b denotes the fraction of the remainder drawn, it is 1/b. The probability determines the factor, not a letter's name."}</Prose>

<GbtDrawing id="D30" />

<Prose>{"The six equally likely small-row pairs produce estimated totals [4,10,6,0,−4,2]. Their mean is 3, the full gradient sum. Their mean square is 86/3 rather than 3²=9; variance is 59/3. Squaring an unbiased estimate rewards fluctuations as well as its mean. The split score squares gradient totals and may also use random denominator totals. Maximizing over candidate splits adds another nonlinear operation."}</Prose>

<GbtProgram name="goss-expectation" />

<Prose>{"This exact finite enumeration separates an unbiased sum from an unbiased gain or winning split. Gradient-based one-side sampling, "}<strong>{"GOSS"}</strong>{", offers a work/statistical tradeoff, not a guarantee that sampling leaves the model unchanged. Changing the number kept or drawn changes both the sample space and weight; when all remaining rows are drawn, the total is an exact null comparison. The sample index only selects one finite outcome; it does not refit a production package."}</Prose>

<Prose>{"Random row bagging and feature sampling are separate options that need not prioritize |g|. Current LightGBM explicitly enables GOSS with "}<code>{"data_sample_strategy='goss'"}</code>{"; it is not active in every LightGBM model. The synthetic recipe in §9 uses ordinary bagging with its enabling frequency. The new Concrete study uses neither GOSS nor row/feature sampling. Compare their actual declared settings before attributing a result to a mechanism."}</Prose>

<H3>{"Bundle columns only when their bins can be decoded"}</H3>

<GbtDrawing id="D31" />

<Prose>{"Three sparse features A,B,C have bins 0,1,2, with 0 inactive. Reserve codes 1–2 for A,3–4 for B and 5–6 for C, leaving 0 for all-inactive. Rows [0,0,0],[2,0,0],[0,1,0],[0,0,2] encode as[0,2,3,6]. Code 3 identifies B's first active bin because it lies in B's reserved interval; subtract its offset 2 to recover 1. The feature identity is carried by the range, rather than thrown away."}</Prose>

<GbtProgram name="exclusive-bundles" />

<GbtDrawing id="D32" />

<Prose>{"Now add row [1,1,0]. A and B activate together, creating a conflict edge in the feature graph. Adding their codes would collide with another legitimate single-feature code; the one-slot reversible representation is no longer valid. Keep A and B in different bundles, or adopt a clearly approximate collision policy. Exact decoding cannot quietly overwrite one active feature."}</Prose>

<Prose>{"The bundling half of the new program computes co-activation conflicts, orders features by descending degree with deterministic ties, and greedily puts each feature into the first compatible group. Encoding checks at most one nonzero per admitted row and uses declared feature-bin maxima to compute offsets; decoding reverses those ranges. With the changed colliding row, the groups are [A,C] and [B]. The later categorical partition half uses the same file but solves a different problem, explained next."}</Prose>

<Prose>{"Minimum compatible grouping is related to minimum graph coloring and is NP-hard in general; a greedy heuristic does not promise the fewest bundles. That complexity result does not prove P≠NP. The supplied dense conflict construction stores a d×d graph and costs roughly O(nd²); for very many sparse columns, build co-occurrence lists from active entries instead. Production EFB uses system-specific heuristics and may allow bounded approximate conflicts. Its benefit concerns column representation and histogram work, not a universal measured speedup or a reduction in rows."}</Prose>

<H2>{"7. Categorical features and whose target is allowed"}</H2>

<Prose>{"Bundling preserved feature identity. Categories raise a different issue: whether a label is an ordered measurement, a subset membership or an outcome-based statistic—and which outcomes are allowed to create that statistic."}</Prose>

<GbtDrawing id="D33" />

<Prose>{"Modes “idle,” “cooling” and “heating” are names. Codes 0,1,2 do not imply a numerical distance between them. One-hot tests ask membership in one named category; a native categorical split can ask whether the category belongs to a subset. In the new squared-loss example, categories A,C have lower target means than B,D. Their G/H aggregates can be sorted by their fitted responses −G/H, then scanned in contiguous prefixes. The winning subset{A,C} has half-squared gain 22.5625 and leaf means.75 and 5.5."}</Prose>

<Prose>{"The sorted-prefix theorem here assumes a two-child, positive weighted squared-error objective with unpenalized category means. The small exhaustive oracle enumerates unordered category partitions and confirms the gain. With k categories, sorting and prefix accumulation take O(k log k), instead of an exponential partition search. Arbitrary "}<strong>{"input"}</strong>{" numeric codes are not that response order. Production regularization, constraints and other losses change the optimization problem; do not promote this admissible result into a theorem that every categorical splitter is globally optimal for every objective."}</Prose>

<GbtNewProgram name="categorical-partitions.py" />

<Prose>{"The program's ordinary sklearn comparison explicitly maps the derived response order into ranks and fits a one-split numerical tree on those ranks. It confirms the admitted squared operation, not general native categorical parity. The XGBoost categorical program in §9 uses declared categorical dtypes and its own native route."}</Prose>

<H3>{"Training-row statistics must not read their own unknown answer"}</H3>

<GbtDrawing id="D34" />

<Prose>{"A target statistic replaces a category by an estimated target average. It can share information among categories, but a singleton's unregularized full-training average is its own y. Reading that feature is then reading the answer used to judge the row. For training encodings, use eligible other labels: separate folds, or preceding rows of a permutation."}</Prose>

<Prose>{"In the ordered miniature, categories are [A,B,A,C,B,A] with targets [0,1,1,1,0,1]. At row 3's A, only row 1's A precedes it. Keep an externally fixed prior p=.5 and strength a 1. The statistic is "}<code>{"(earlier matching sum+a p)/(earlier matching count+a)=(0+.5)/(1+1)=.25"}</code>{". Emit the statistic before adding row 3's own label to the running sums. Flipping its own target leaves.25 unchanged; flipping row 1's eligible target changes it to .75. Row 3's label can legitimately change later A encodings."}</Prose>

<GbtProgram name="ordered-categories" />

<Prose>{"The prior matters to the information claim. A prior estimated using row 3's own target would introduce another own-label path, even if the category sum excluded it. Out-of-fold encoding likewise needs the right allowed folds. For forecasting, eligible information is governed by time, not just a shuffled order. A random permutation does not legalize a feature observed after the outcome."}</Prose>

<GbtDrawing id="D35" />

<Prose>{"At inference, a fresh prediction row has no known target. The miniature can use all eligible training A labels, producing(2+.5)/(3+1)=.625. An unseen category has no matching training count and falls back to .5. Flipping row 3 changes this full-training A statistic while preserving its earlier-prefix.25. These are different roles, not a contradiction. The actual saved transform and inference schema must travel with the model."}</Prose>

<H3>{"Deeper: ordered boosting closes another influence path"}</H3>

<GbtDrawing id="D36" />

<Prose>{"Even without a category transform, a training target can influence the model used to predict that same row. If the fitted model has learned part of its noise, its residual can differ systematically from a fresh observation's residual under an independently trained predictor. CatBoost calls this conditional difference "}<strong>{"prediction shift"}</strong>{". Ordinary residual training is intentional and not automatically invalid; the issue is the train-versus-fresh-data information distribution. Away from an optimum, a useful expected gradient need not be0."}</Prose>

<Prose>{"The ideal ordered construction maintains M₀,…,Mₙ, where M_k has trained only on the first k permutation rows. Row j's gradient is evaluated with M_{j−1}, which excludes that row's target. Each prefix is then updated using its eligible rows. The full prefix Mₙ predicts future data. This distinguishes the row's judging model from the final inference model."}</Prose>

<GbtProgram name="ordered-prefix-models" />

<Prose>{"Trace targets [1,3,2,6], starting every prefix at 0 and using constant learners with η=.5. Round 1's prefix values are [0,.5,1,1,1.5]. At round 2, row 4 is judged using M₃=1, so its requested change is 6−1=5, rather than 6−M₄=4.5. The eligible residuals are [1,2.5,1,5]; the full-prefix update gives M₄=1.5+.5×(9.5/4)=43/16=2.6875. Its nonzero earlier-prefix residual is exactly what the construction allows."}</Prose>

<GbtDrawing id="D37" />

<Prose>{"Keeping a completely separate general ensemble per prefix would be expensive. Production CatBoost compresses the ideal information discipline with shared structures, multiple permutations and specialized leaf computations. Ordered target statistics and Ordered boosting address "}<strong>{"different"}</strong>{" paths. Plain mode can still use ordered statistics; Ordered mode also changes judging predictions/gradients. Symmetric tree topology is another independent setting. Coordinated orderings are needed for the combined theoretical boundary; three labels on one diagram do not make three algorithms interchangeable."}</Prose>

<Prose>{"The synthetic regression recipe explicitly requests Ordered. The new Concrete numeric-only study explicitly requests Plain, SymmetricTree, "}<code>{"bootstrap_type='No'"}</code>{", "}<code>{"rsm=1"}</code>{" and "}<code>{"random_strength=0"}</code>{"; it compares declared workflows, not the causal effect of Ordered alone. None of these mechanisms repairs validation labels entering a transform, repeated people's rows crossing an inappropriate split or an unavailable-at-prediction-time feature. Establish the row/group/time protocol before fitting anything learned from those observations."}</Prose>

<H2>{"8. Choose a model without peeking at the test"}</H2>

<Prose>{"The next correction can fit useful structure or noise. A smaller rate delays changes but can underfit within a fixed round budget. Depth, leaf constraints, penalties, sampling and number of rounds work together. The ability to reduce training error alone does not tell us which saved predictor to use on new observations."}</Prose>

<GbtDrawing id="D38" />

<Prose>{"Training labels may determine splits, leaf responses, initial score and learned transforms. Validation may choose settings, stopping and workflow. Test reports the locked workflow's performance. The visible arrows draw those permitted influences; there is no arrow from a test target back to a selected tree. Split before estimating imputation values, category statistics or any learned transform. A known per-row unit conversion is different from learning a mean from all rows."}</Prose>

<NeuralTable caption={"8. Choose a model without peeking at the test"} headers={[<>{"Role"}</>,<>{"Permitted influence"}</>,<>{"What its score does not supply"}</>]} rows={[[<>{"Training"}</>,<>{"Fit transforms, rules, scores"}</>,<>{"An independent generalization estimate"}</>],[<>{"Validation"}</>,<>{"Select settings and prefix"}</>,<>{"An untouched final test after repeated tuning"}</>],[<>{"Test"}</>,<>{"Report the locked workflow"}</>,<>{"Another opportunity to select the best configuration"}</>]]} />

<Prose>{"Dependent records need appropriate group or time splits. A randomly generated independent synthetic fixture can justify a random row split; a patient's repeated visits or a composition's aging measurements need another rationale. Repeatedly comparing configurations on one validation set spends its information too. Cross-validation, nested selection and uncertainty analysis deepen that question in their evaluation lessons; this chapter establishes the explicit boundary."}</Prose>

<GbtDrawing id="D39" />

<Prose>{"The small curve investigation retains its declared 18 training and 17 noiseless validation observations and computes 60 successive prefixes. Adjust rate or depth to learn a new sequence; select a cursor to inspect an already learned prefix. The selected validation minimum, currently displayed prefix and patience stop are three separate markers. The mean-only prefix 0 remains an honest baseline rather than being mislabeled as one tree."}</Prose>

<Prose>{""}<strong>{"Early stopping"}</strong>{" records the best validation value so far and stops after a declared number of nonimproving rounds. In the lab patience is 6. With the illustrative trace [.50,.42,.44,.43,.45] and patience 3, round 2 is selected and round 5 stops: rounds 3–5 supply three nonimprovements. The stop is later than the selected prefix. It does not prove no still-later round could improve; patience is a finite decision rule."}</Prose>

<GbtDrawing id="D40" />

<Prose>{"The saved step predictor below the curve uses the selected or displayed prefix's actual rules. Move a query across a threshold to see the path change; move it farther within the same terminal regions and the answer can stay constant. Looking at prefix 12 does not refit the twelfth tree or supply a new target. Rate/depth changes restart the fit, while a cursor only changes which saved function is drawn."}</Prose>

<Prose>{"Compare both training and validation in the same loss units. If a workflow cannot beat an honest baseline under the chosen validation protocol, its extra complexity is not a success. Choosing a later prefix because it has a better test score would redefine the selection procedure; its evaluation would need fresh independent data. This is the same influence discipline that categorical training statistics needed, applied to model choice."}</Prose>

<H2>{"9. Run the three libraries with explicit contracts"}</H2>

<Prose>{"You can now state what is being fitted and what is allowed to choose it. Ordinary packages implement much more than the supplied learners: quantization, specialized leaf updates, cache layouts and model formats. Make that delegation deliberate by preserving the objective, feature schema and selected prefix at inference."}</Prose>

<Prose>{"The following synthetic recipes were executed with Python 3.12.14, NumPy 2.3.5, scikit-learn 1.9.1, XGBoost 3.4.1, LightGBM 4.7.0 and CatBoost 1.2.10. Their regression generator has 1,000 rows,10 informative features, noise 20 and seed 42, with 700 training,150 validation and 150 test rows. These saved measurements describe that fixture; current documentation versions do not relabel its executed package versions. No test target enters training or early stopping."}</Prose>

<CodeBlock language={"bash"}>{"python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1 xgboost==3.4.1 lightgbm==4.7.0 catboost==1.2.10 joblib\n# Needed for the native categorical DataFrame example:\npython -m pip install pandas==3.0.1"}</CodeBlock>

<Prose>{"Compatible wheels and Python requirements depend on the local environment. These examples request one CPU thread for modest, reproducible work; they do not measure each engine's fastest mode. The efficient residual example also supplies its exact "}<code>{"regression-tree.py"}</code>{" dependency. Keep that file beside the new script when running it offline. Each program's source and output are visible here, with Copy/Download and the reader's file index."}</Prose>

<H3>{"Keep an index, a count and a stored ensemble distinct"}</H3>

<GbtDrawing id="D41" />

<Prose>{"XGBoost's best iteration 197 is a zero-based round index, so the selected scalar regression prefix contains 198 rounds. Its native object stores 200. Native "}<code>{"Booster.predict"}</code>{" otherwise uses the stored ensemble; the half-open "}<code>{"iteration_range=(0,best_iteration+1)"}</code>{" selects the intended prefix. The sklearn wrapper normally uses its best iteration automatically. Multiclass rounds can contain multiple physical trees, so a raw tree count is not universally a round count."}</Prose>

<GbtProgram name="xgboost-workflow" />

<Prose>{"The saved synthetic run's selected test RMSE 33.363680 improves on its training-mean baseline 126.813333 under the declared split. Save/reload preserves the prediction with the same iteration range. Its monotone slice demonstration checks a specified input slice separately; it is not a second round-selection exercise driven by test results."}</Prose>

<Prose>{"LightGBM's best iteration 157 is already a count for "}<code>{"num_iteration"}</code>{"; use history entry 156 if indexing a Python list. "}<code>{"num_leaves"}</code>{" supplies a leaf budget and "}<code>{"max_depth"}</code>{" a separate depth cap. The synthetic recipe uses ordinary bagging with an enabling nonzero frequency and fraction below 1. GOSS is another explicitly selected strategy. Early-stopping callbacks have mode limitations, including DART; do not assume an identical stopping contract for every booster."}</Prose>

<GbtProgram name="lightgbm-workflow" />

<Prose>{"Feature 0's split count 235 and summed gain 3,083,143.015 are different quantities, in different units. The observed magnitudes do not become comparable with another package's percentage merely by placing them in adjacent bars. Inspect the definition before comparing importance."}</Prose>

<Prose>{"The synthetic CatBoost regression route requests "}<code>{"boosting_type='Ordered'"}</code>{". With "}<code>{"use_best_model=True"}</code>{" and no extra minimum-tree constraint, saved count is the best zero-based iteration plus 1. Here all 200 requested rounds remain. That does not prove a 201st round would not help. The three synthetic workflows differ in topology and settings, so their test ordering does not isolate Ordered boosting as its cause. "}<code>{"allow_writing_files=False"}</code>{" prevents training-log directories for the small example."}</Prose>

<GbtProgram name="catboost-workflow" />

<H3>{"Preserve types and shapes when serving categories"}</H3>

<GbtDrawing id="D42" />

<Prose>{"A category code carries a schema: “A” can map to 0 in one encoder and 2 in another. Independently recoding validation or serving data can change the meaning without changing the number's dtype. XGBoost can receive categorical DataFrame dtypes with "}<code>{"enable_categorical=True"}</code>{" and a supported tree method; LightGBM can receive explicitly declared categorical columns; CatBoost Pools declare category columns at every role. A native subset question is different from treating arbitrary codes as an ordered measurement."}</Prose>

<GbtProgram name="native-categorical-splits" />

<Prose>{"This program fixes the training dtype/category vocabulary and passes declared categories to both XGBoost and LightGBM. It verifies finite predictions on its admitted named categories. It does not validate every unseen-category or schema-changing pipeline, nor imply those packages implement CatBoost's ordered prefix models."}</Prose>

<GbtProgram name="catboost-categories" />

<Prose>{"The categorical classification program declares its categorical column in each Pool and uses only validation for stopping. Its executed class array is one-dimensional. Normalizing and asserting matching shapes protects the comparison: a predicted(n,1) array against truth(n,) broadcasts to(n,n), comparing every prediction with every label. The intentional wrong 100×100 comparison produces accuracy.5012 instead of .99. This is a shape hazard, not a claim that every CatBoost version returns a column. Never flatten a class-probability matrix and call it labels. A finite prediction for“NEW” demonstrates the admitted fallback, not reliable prediction for every future category."}</Prose>

<H3>{"Answer the opening Concrete Strength question"}</H3>

<GbtDrawing id="D43" />

<Prose>{"The supplied "}<a href={"https://archive.ics.uci.edu/dataset/165/concrete+compressive+strength"}>{"UCI Concrete Compressive Strength dataset"}</a>{", collected by I-Cheng Yeh, records 1,030 cases with seven ingredient quantities in kg/m³, age in days and compressive strength in MPa. The offline CSV has the same digest and schema used by the runnable study. Its "}<a href={"https://creativecommons.org/licenses/by/4.0/"}>{"CC BY 4.0 license"}</a>{" permits reuse with attribution. One row is an observed mixture/age/strength; the illustrative six-row targets above were invented arithmetic."}</Prose>

<Prose>{"Repeated ages of the same ingredient composition are related records. Group the seven ingredient fields by exact Decimal value, excluding age. There are 427 derived groups:274 training,68 validation and 85 test after sorting group keys and permuting with seed 73. Their actual row counts are 675,157,198. Every age variant in one exact composition stays in one role. These are derived composition IDs, not supplied batch or site IDs. Rounded-nearby recipes can remain related, so this test asks about held-out "}<strong>{"recorded"}</strong>{" compositions; it does not establish new-site generalization or construction safety."}</Prose>

<GbtNewProgram name="concrete-strength-workflow.py" />

<Prose>{"Run it with the supplied "}<code>{"concrete-data.csv"}</code>{" and a new empty output directory. It writes its protocol before fitting, including versions, units, group IDs, actual configuration and source/data digests. Training fits a mean, a training-only StandardScaler+LinearRegression baseline, and six predeclared tree candidates: each engine at depth 3 or 4, rate.05, at most 300 rounds, one CPU thread, seed 73 and L2=1. XGBoost uses hist; LightGBM uses gbdt with both depth cap and 2ᴰ leaf budget. CatBoost explicitly uses Plain, SymmetricTree, "}<code>{"bootstrap_type='No'"}</code>{", "}<code>{"rsm=1"}</code>{" and "}<code>{"random_strength=0"}</code>{": no bootstrap or feature sampling. These are distinct workflows, not equal compute budgets or an ablation isolating one algorithmic difference."}</Prose>

<Prose>{"Validation RMSE chooses the first best prefix with strict improvement and patience 20. Across model scores within 10⁻¹⁰, the declared priority is mean, linear, lower depth, then XGBoost, LightGBM, CatBoost. No test label is supplied to fitting or selection. The program writes "}<code>{"selection-lock.json"}</code>{" before constructing the test target vector, then evaluates every predeclared comparator descriptively. It saves the selected model, schema, versions, all validation histories and actual test prediction/residual rows. An existing nonempty output directory is rejected so a later run cannot silently overwrite this study."}</Prose>

<GbtDrawing id="D44" />

<NeuralTable caption={"Answer the opening Concrete Strength question"} headers={[<>{"Declared workflow"}</>,<>{"Selected / stored rounds"}</>,<>{"Validation RMSE MPa"}</>,<>{"Test RMSE MPa"}</>,<>{"Test MAE MPa"}</>]} rows={[[<>{"Training mean"}</>,<>{"— /0"}</>,<>{"14.861824"}</>,<>{"17.311287"}</>,<>{"14.377064"}</>],[<>{"Scaled linear regression"}</>,<>{"— /0"}</>,<>{"9.369776"}</>,<>{"10.502296"}</>,<>{"8.455562"}</>],[<>{"XGBoost depth 3"}</>,<>{"76 /96"}</>,<>{"6.569905"}</>,<>{"7.589833"}</>,<>{"6.069500"}</>],[<>{"LightGBM depth 3"}</>,<>{"300 /300"}</>,<>{"5.701876"}</>,<>{"6.972178"}</>,<>{"5.328658"}</>],[<>{"CatBoost depth 3"}</>,<>{"82 /102"}</>,<>{"6.414178"}</>,<>{"7.662875"}</>,<>{"6.043086"}</>],[<>{"XGBoost depth 4"}</>,<>{"56 /76"}</>,<>{"6.497728"}</>,<>{"7.418684"}</>,<>{"5.905265"}</>],[<>{""}<strong>{"Selected: LightGBM depth 4"}</strong>{""}</>,<>{""}<strong>{"294 /294"}</strong>{""}</>,<>{""}<strong>{"5.586519"}</strong>{""}</>,<>{""}<strong>{"7.058475"}</strong>{""}</>,<>{""}<strong>{"5.427592"}</strong>{""}</>],[<>{"CatBoost depth 4"}</>,<>{"80 /100"}</>,<>{"6.283673"}</>,<>{"7.401944"}</>,<>{"5.863870"}</>]]} />

<Prose>{"LightGBM depth 4 has the lowest validation RMSE and is the locked selection. LightGBM depth 3 has a slightly lower descriptive "}<strong>{"test"}</strong>{" RMSE; switching to it after seeing this table would violate the declared protocol. LightGBM's current saved object has 294 rounds even though its validation history evaluated 300; record evaluated rounds, saved rounds and chosen prefix separately. Tested LightGBM 4.7.0 emits an "}<code>{"eval_set"}</code>{" deprecation warning: consult its documented "}<code>{"eval_X"}</code>{"/"}<code>{"eval_y"}</code>{" route when adapting the program for a new environment. These measurements correspond to the supplied executed source."}</Prose>

<GbtDrawing id="D45" />

<Prose>{"Follow the first actual test row: cement 540, slag 0, fly ash 0, water 162, superplasticizer 2.5, coarse aggregate 1055 and fine aggregate 676 kg/m³, aged 28 days. Its observed strength is 61.89 MPa and the selected model predicts 74.553087 MPa, leaving residual −12.663087 MPa. That one miss is substantially larger than the test MAE; an average score does not make every case accurate. All 198 actual error rows are supplied for inspection. Ingredient values and strength units close the original question with measured evidence, while the group and site limits explain what that evidence supports."}</Prose>

<H2>{"10. Diagnose the model you actually built"}</H2>

<Prose>{"The recorded result asks what to investigate next. Start with objective, feature availability, missingness, selection and serving schema, then inspect what the specific predictor does. A package's name is not a diagnosis or a universal ranking."}</Prose>

<NeuralTable caption={"10. Diagnose the model you actually built"} headers={[<>{"Choice"}</>,<>{"Mechanisms useful here"}</>,<>{"Contracts to inspect"}</>]} rows={[[<>{"XGBoost"}</>,<>{"Regularized Newton-style scores, exact/hist/approx search, default missing routes, native categorical questions, growth/device/distributed options"}</>,<>{"Objective/device support, category serialization and recoding, native prefix, sparse absence versus 0"}</>],[<>{"LightGBM"}</>,<>{"Histograms, leaf-wise growth, categorical partitions, optional GOSS/EFB, bagging and distributed routes"}</>,<>{"Leaf budget and depth, actual sample mode, category/zero flags, callback and GPU build"}</>],[<>{"CatBoost"}</>,<>{"Ordered statistics, Plain/Ordered modes, symmetric and other topology, Pool categories, CPU/GPU/Spark routes"}</>,<>{"Task/device defaults, tree-policy restrictions, category types, best-model selection and Spark limitations"}</>]]} />

<H3>{"Ask which importance operation produced the number"}</H3>

<GbtDrawing id="D46" />

<Prose>{"Count each actual split in the same saved two-tree example: feature 0 is used once and feature 1 once. Their unshrunken half-squared training gains are 64/3 and 16/3, so normalized gains are.8 and .2 despite equal split counts. Gain aggregates a training-objective improvement; count aggregates uses. Neither is a direct causal effect or a held-out error difference."}</Prose>

<Prose>{"Permutation importance instead shuffles one feature for an already fitted model and compares a declared evaluation metric. The changed row values pass through the same saved rules; no new tree is fitted. A correlated twin may supply redundant signal, reducing one column's individual contribution, or shuffling may create off-support combinations. State the model, data, metric and permutation when interpreting the difference."}</Prose>

<GbtNewProgram name="diagnostic-operations.py" />

<Prose>{"The supplied saved predictor has two six-row trees and two identical feature columns. Its count/gain arrays and actual shuffled predictions are printed. The one-repeat random-state convention is explicitly matched to sklearn 1.9.1 "}<code>{"permutation_importance(...,scoring='neg_mean_squared_error')"}</code>{", so the program compares the same permutation rather than two different random experiments. More repeats quantify permutation variation; they do not resolve all dependence or causal questions."}</Prose>

<H3>{"Deeper: substitute actual rows before averaging a partial dependence"}</H3>

<GbtDrawing id="D47" />

<Prose>{"For a chosen feature value z, replace that feature in every background row, predict each modified row, then average. This is a partial-dependence operation, "}<strong>{"PDP"}</strong>{". An individual conditional-expectation curve, "}<strong>{"ICE"}</strong>{", retains one row's predictions rather than averaging. In the supplied two-tree predictor, setting feature 0 to 2 gives first-tree response −8/3 while the unchanged feature 1 background has mean second-tree response 0. The average is 5−4/3=11/3. Setting feature 0 to 4.5 gives 19/3."}</Prose>

<Prose>{""}<code>{"pdp"}</code>{" reuses one background copy and loops through the small grid. It returns both averages and ICE columns and matches ordinary "}<code>{"partial_dependence(method='brute',custom_values=...)"}</code>{" on the same background. The two original columns were identical, so replacing one while keeping the other creates combinations the original data did not contain. This marginal substitution average is not a conditional observational expectation or a causal intervention estimate. Dependence-aware explanations and SHAP are developed in "}<a href={"/learn/path/full-curriculum/feature-selection-importance-shap-permutation-mutual-info?module=classical-machine-learning"}>{"Feature Selection & Importance"}</a>{"; here the visible row substitutions identify the question actually answered."}</Prose>

<H3>{"Monotonicity and extrapolation are different promises"}</H3>

<GbtDrawing id="D48" />

<Prose>{"Outside all saved split thresholds along a feature direction, a constant-leaf ensemble keeps reaching the same leaves. Its prediction flattens. A monotone constraint can forbid a decreasing response as a feature increases with all others fixed; it can still produce a nondecreasing step function that becomes constant beyond training data. “Monotone” does not mean linear extrapolation, a causal effect, calibration or guaranteed lower validation error."}</Prose>

<Prose>{"Use a constraint when the task justifies its direction, then evaluate the declared workflow. If reliable extrapolation is essential, compare a justified parametric or hybrid model, transformed target or specifically supported nonconstant-leaf method. The synthetic XGBoost slice test demonstrates the configured constraint on its admitted range; it is not a new out-of-domain performance measurement."}</Prose>

<H3>{"Class weighting changes the fitted probability target"}</H3>

<GbtDrawing id="D49" />

<Prose>{"At an input with original probability p, give positives weight a and negatives 1. The conditional weighted log loss is "}<code>{"−ap log q−(1−p)log(1−q)"}</code>{". Differentiating gives "}<code>{"−ap/q+(1−p)/(1−q)=0"}</code>{", so "}<code>{"q*=ap/[ap+1−p]"}</code>{". For p=.1,a=9, q=.5. At a=1 the operation returns the original p, a useful null comparison."}</Prose>

<Prose>{"Weighting changes the statistical objective; changing a classification threshold chooses a decision from fixed probabilities. They are not interchangeable. Rare positives do not automatically make proper unweighted log loss inappropriate, while an asymmetric decision can make threshold.5 inappropriate. Evaluate prevalence, log loss, precision/recall and decision costs. A weighted score should not be called the original-population probability without justified correction or calibration using allowed information."}</Prose>

<H3>{"Deeper: reduce worker statistics before a shared split"}</H3>

<GbtDrawing id="D50" />

<Prose>{"Two workers own disjoint row partitions. Each accumulates bin G/H arrays using the same bin definitions; their cellwise sums give the global histogram. The shared candidate scan must use those combined statistics, not average two locally chosen thresholds. Communication occurs at the required node/level exchanges across rounds. More features, bins and active nodes increase payload and work; this is not one exchange for a whole model."}</Prose>

<Prose>{"CPU histogram construction, cache reuse, sparse traversal, out-of-core processing and data-parallel reduction affect training resources. XGBoost's CUDA route commonly uses "}<code>{"tree_method='hist',device='cuda'"}</code>{". LightGBM distinguishes OpenCL "}<code>{"device_type='gpu'"}</code>{" from its CUDA implementation; installation/build support matters. CatBoost uses "}<code>{"task_type='GPU'"}</code>{" with task-dependent support, while Spark has its own limitations. None of these GPU/distributed routes was executed for the CPU examples here."}</Prose>

<Prose>{"To investigate a speed target, fix representative data/split, objective, stopping/quality condition and measurement boundary. Record hardware, versions, threads, transfer/quantization, train/inference times, peak memory and repeated-run variation. Compare one change before combining devices, sampling and topology. A paper's speedup on other data does not establish a five-fold gain here. There is no universal row/cardinality threshold at which a package or GPU wins."}</Prose>

<NeuralTable caption={"Deeper: reduce worker statistics before a shared split"} headers={[<>{"Observation"}</>,<>{"Discriminating check"}</>,<>{"Reasoned response"}</>]} rows={[[<>{"Training good, validation poor"}</>,<>{"Same-metric curves, allowed feature information, group/time split, shift and capacity"}</>,<>{"Repair invalid information first, then compare depth/leaves, penalties, sampling and stopping under the same protocol"}</>],[<>{"Both training and validation poor"}</>,<>{"Honest baseline, loss/link, available signal, round budget and restrictive leaves"}</>,<>{"Fix representation or add justified capacity; stronger regularization is not a universal repair"}</>],[<>{"High accuracy with rare positives"}</>,<>{"Prevalence, confusion matrix, log loss and decision costs"}</>,<>{"Use appropriate metrics/thresholds and assess weighting's probability change"}</>],[<>{"Unexpected missing/new-category result"}</>,<>{"Serving dtype, mapping, sentinel and sparse representation"}</>,<>{"Persist schema and test admitted edge states rather than independently recoding"}</>],[<>{"Nonfinite output or CPU/GPU disagreement"}</>,<>{"Inputs, derivatives, curvature, weights, logs, versions and a minimal reproducer"}</>,<>{"Isolate the numerical issue; feature rescaling alone may not fix it"}</>],[<>{"Importance looks different"}</>,<>{"Definition, fitted model, loss units, feature correlation and evaluation data"}</>,<>{"Compare the explicitly defined question, not arbitrary normalized bars"}</>]]} />

<Prose>{"These are tabular function learners. Images, sequences, language and graphs can supply extracted features or embeddings, but a table alone does not supply the relevant invariance or temporal context. Ranking requires query-group labels and ranking evaluation; Poisson, Gamma and Tweedie objectives require their response/link/domain conventions. DART additionally changes tree weights and prediction contracts. Follow their objective-specific documentation rather than applying the scalar binary derivation unchanged. "}<a href={"/learn/path/full-curriculum/ensemble-methods-stacking?module=classical-machine-learning"}>{"Ensemble Methods"}</a>{" develops AdaBoost's distinct reweighting route; the correction-function logic here prepares that comparison."}</Prose>

<Prose>{"The five historical standalone examples remain available for comparison: "}<a href={"/learn-assets/gbt-reading-flow/archive/original-program-1.py"}>{"scratch ensemble"}</a>{" and its "}<a href={"/learn-assets/gbt-reading-flow/archive/original-output-1.txt"}>{"preserved output"}</a>{"; "}<a href={"/learn-assets/gbt-reading-flow/archive/original-program-2.py"}>{"Newton update"}</a>{" and "}<a href={"/learn-assets/gbt-reading-flow/archive/original-output-2.txt"}>{"output"}</a>{"; "}<a href={"/learn-assets/gbt-reading-flow/archive/original-program-3.py"}>{"XGBoost APIs"}</a>{" and "}<a href={"/learn-assets/gbt-reading-flow/archive/original-output-3.txt"}>{"output"}</a>{"; "}<a href={"/learn-assets/gbt-reading-flow/archive/original-program-4.py"}>{"LightGBM API"}</a>{" and "}<a href={"/learn-assets/gbt-reading-flow/archive/original-output-4.txt"}>{"output"}</a>{"; "}<a href={"/learn-assets/gbt-reading-flow/archive/original-program-5.py"}>{"CatBoost APIs"}</a>{" and "}<a href={"/learn-assets/gbt-reading-flow/archive/original-output-5.txt"}>{"output"}</a>{". These exact historical outputs are reproduced, not newly measured or a controlled engine ranking. The scratch example calls a depth-2 tree a stump, omits an unsplittable-node guard and does not clear trees on repeated fitting. The Newton example's F=2.5 is a chosen score, not the mean of its five labels, which is 3; its g,h use half-squared loss. The native API examples use the set named test for stopping/selection, so their printed scores do not constitute untouched-test evidence. Use the explained current scratch implementation and validation-only protocol for new work; the old files show precisely what changed."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"11. Practise transfer and choose the next question"}</H2>

<Prose>{"Use these tasks independently of the live controls. A successful explanation follows actual rows and operations, states the information boundary and distinguishes a local calculation from new-data evidence."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Apply a saved path without its target"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" After the first half-strength tree, what does x=2.5 receive? If its eventual target is 4, is 4 needed to make that prediction?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Follow the left leaf and add half of −8/3 to 5 before comparing with an observation."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Prediction is 5−4/3=11/3. The later residual is 4−11/3=1/3. The target evaluates an error; it is absent from saved-rule inference."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Change targets and then remove separability"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Keep x[1,2,3,4], change y to[0,0,4,4], and use one stump with η=.25. Calculate baseline, corrections and MSE. What happens when all four x become identical?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Mean 2 gives two residual requests −2 and two+2. Identical features cannot create two threshold children."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Cut 2.5 has leaves −2,+2; predictions [1.5,1.5,2.5,2.5], MSE 2.25 instead of 4. With equal x, the only mean residual is 0; score stays 2 and MSE 4. Targets do not manufacture a separating feature."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Find the exact regularization boundary"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Parent G=0,H=4 has children(2,2),(−2,2), with λ=0,α=0. At which γ is net gain 0? What are the weights at α=2?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compare children's improvements with the parent before charging one additional leaf."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Each child improvement is 1, parent 0, so gain 2−γ and equality γ=2 is rejected. At α=2 both softened gradients and weights are 0; a positive γ then makes the split worse."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Recover information before accelerating it"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Keep only cuts 2.5 and 4.5 on targets [1,1,1,9,9,9]. Can either reproduce 3.5's zero within-leaf error? Does a GPU restore the missing candidate?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Draw the mixed target group on each allowed side."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Both coarse candidates mix low and high targets in a leaf, so SSE is positive. A GPU computing those same represented boundaries cannot choose 3.5. Change bin resolution/representation first, then measure its cost."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Separate prefix, full and validation statistics"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" A category occurs once in training, label 1. With fixed p=.5,a 1, compare its first-prefix statistic to its smoothed full-training statistic. What if it occurs only in validation?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Count eligible matching labels for each role."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Prefix.5 excludes the singleton's own label; full training(1+.5)/(1+1)=.75 includes it. Validation-only has no eligible training labels and falls back to .5. Constructing.75 from its validation label leaks the judged outcome."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Distinguish best from stopped"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Validation trace [.50,.42,.44,.43,.45], patience 3, strict improvement. Which prefix is chosen, when does training stop, and may a better round 5 test score replace the choice?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Count nonimprovements after.42."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Choose round 2; rounds 3–5 trigger stop at 5. Switching on test would use it for selection and require fresh independent evaluation of that revised procedure."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Diagnose a locally attractive overshoot"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" In the binary Newton calculation, use score −4, three rows left,λ=0,α=0,η=1. Explain how positive surrogate gain can accompany worse actual loss, then compare η=.1."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The mixed left leaf has two negatives and one positive, with small curvature at the current score."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"The large positive response makes its two negatives confidently wrong. The quadratic approximation is local and misprices this large movement. Rate.1 improves this fixture by staying closer to the expansion point; it is not a universal safety theorem. The supplied candidate is fixed, rather than inferred to be the greedy winner."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Decode a sampling description"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Keep 20% of all rows, then sample 10% of the remainder. What weight should sampled small rows receive? Is(1−.2)/.1 correct?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Use their conditional inclusion probability."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Probability.1 means weight 10. Weight 8 would apply if the sample were 10% of "}<strong>{"all"}</strong>{" rows, or 12.5% of the remaining 80%. These are different experiments; neither makes a nonlinear selected gain unbiased."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Convert a round index into an inference range"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" A native XGBoost model has best_iteration=12 and stores 18 rounds. Which range selects its regression prefix, and why is(0,12) wrong?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The upper end is excluded."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Use(0,13), including indices 0–12. Range(0,12) includes only 12 rounds and omits the best indexed round. Native prediction without an appropriate range uses its stored ensemble unless deliberately sliced. Persist the convention."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Catch a plausible shape error"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Predictions(n,1) compare with truth(n,). Why can the returned mean look plausible while being wrong? Give a repair and invariant."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Align trailing dimensions."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Broadcasting creates(n,n) pairwise agreements. Normalize intended label arrays to(n,) and assert identical shapes before rowwise comparison. A multiclass probability matrix cannot be flattened into labels."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Interpret a weighted probability"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Positive probability.1 receives weight 9. Which q minimizes weighted log loss, and is it the original p?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Substitute in ap/(ap+1−p)."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"q=.9/(.9+.9)=.5, different from .1. It serves the weighted objective; original-population interpretation needs justified correction/calibration and allowed validation evidence."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Design a performance investigation"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" A team asks for at least five times faster with no quality loss after switching libraries and enabling a GPU. What can you promise before measuring, and how would you investigate?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Separate the candidate optimization, acceptance target and experiment."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Promise the protocol. Fix representative split/objective/quality criteria; record versions/hardware, preprocessing/transfer boundaries, train/inference times, memory and repeated variation. Compare an appropriate histogram baseline, then the change at comparable quality. Reject a faster candidate that fails the quality condition. No package name or external paper proves the target achievable."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Transfer from a direction to a loss-minimizing leaf"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" For residuals [−4,0,7], calculate square, absolute and fixed δ=2 Huber leaves. For [−4,4],δ=1, explain why two different Huber optimizer outputs can both pass."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compare mean, median and the clipped derivative sum; check an objective, not only a coordinate."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Leaves are 1,0,0 in the first case. The second has the whole minimizer interval [−3,3], objective 7. Equal minimized objectives and zero derivative support agreement even if locations differ. Implement a stationarity check with the supplied program."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Extend a conserved operation"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Parent-bin G[.3,−1.1,4.7],H[.3,.8,1.9] and child G[.1,−.4,2.1],H[.1,.3,.7] are given. Derive the sibling and add a minimum-curvature option to a proposed Newton split."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Subtract like-defined cells, then enforce the bound on each candidate child before maximizing gain."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Sibling G[.2,−.7,2.6],H[.2,.5,1.2]. Recomposition recovers the parent. The new bound can reject a formerly positive candidate even with the same row count; changing bins between arrays would invalidate subtraction. Test both missing routes and a refit after the new constraint."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Test influence and loss scaling"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" At row 3's ordered A statistic, flip its own label and then row 1's. What changes? Multiply a Newton loss by 3.7: which penalties must scale to preserve the fitted responses and split decision?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Follow the numerator's eligible rows and the dimensions of G,H,λ,α,γ."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"Own-label flip leaves.25 unchanged; eligible earlier-label flip makes.75. A learned prior could break this strict null. Multiply λ,α,γ by 3.7 along with G,H: weights remain the same and all net gains scale by 3.7. Leaving penalties fixed changes effective regularization."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Report a grouped workflow honestly"}</H3>

<Prose>{""}<strong>{"Task:"}</strong>{" Two concrete rows have identical ingredient quantities but ages 7 and 28 days. Should this protocol assign different roles? Why is the lower depth 3 test RMSE insufficient to replace the selected depth 4 workflow? State one stronger future generalization question."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Use the actual group definition and selection lock."}</Prose>

</details>

<details>

<summary>Explained solution</summary>

<Prose>{"They share one composition group regardless of age. Validation selected depth 4; replacing it after reading test would spend test information. A new-site or supplied-batch holdout would ask a stronger question, requiring those identifiers and an appropriate study. Rounded-nearby compositions remain a limitation of these exact derived groups."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Independent report: a changed data-generating process"}</H3>

<Prose>{"Choose one synthetic regression recipe. Change generator noise 20 to 50 while preserving its fixed split procedure and record the new mean baseline. Use only validation to compare depth 3 with a smaller or larger justified tree and choose rounds. Lock the workflow, evaluate test RMSE once and write: prediction question/data unit; split rationale; package/version/seed; baseline; selected settings and iteration convention; training/validation behavior; test result; timing boundaries if measuring performance; one failure deliberately checked."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The target becomes noisier, not a new feature. More capacity can fit more noise. Keep validation labels outside learned preprocessing and loss units consistent. Report the changed result rather than trying to reproduce the old numeric winner."}</Prose>

</details>

<Prose>{""}<strong>{"Acceptance and limits:"}</strong>{" A successful report may prefer the simpler model or find neither reliably beats a baseline under another valid setup. Calculations must reproduce, arrays align, prefix match inference and test remain outside selection. One seed is a finite experiment, not a precise population ranking. Later repeated splits or justified uncertainty analysis can strengthen it; do not invent an expected test score for this task."}</Prose></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Readiness and the next question"}</H3>

<Prose>{"Explain one new row's complete saved path and sum; derive its next tree's training requests; implement a legal split scan and regularized leaf; distinguish a bin, missing route, sample weight and category statistic; and interpret a locked held-out report. If any step is unclear, return to its actual rows/ports before memorizing an engine parameter name."}</Prose>

<Prose>{"The next catalogue topic is "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm?module=classical-machine-learning"}>{"Support Vector Machines"}</a>{". It studies margin-based prediction and kernels rather than a sequence of threshold corrections. The common questions are function class, objective, available prediction-time information and evidence on new data."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://trevorhastie.github.io/ISLR/ISLR%20Seventh%20Printing.pdf"}>{"ISLR §8.2.3"}</a>{", printed pp321–323, gives a compact residual-fitting algorithm and the shrinkage/tree-capacity comparison. Translate its rate symbol λ to η here because λ already denotes L2. Its zero initialization differs from our mean intercept."}</li><li>{""}<a href={"https://hastie.su.domains/ElemStatLearn/printings/ESLII_print12_toc.pdf"}>{"ESL §§10.9–10.13"}</a>{", printed pp356–370, develops functional gradients, leaf search, interactions, regularization and partial dependence. Read it after §§3–4 and 10; historical empirical rate preferences are not universal settings."}</li><li>{""}<a href={"https://www.cs.cornell.edu/courses/cs4780/2018fa/lectures/lecturenote19.html"}>{"Cornell CS4780 lecture 19 notes"}</a>{" offers another written function-space descent route. Compare its prediction-vector geometry with D09 and keep the independently derived loss signs here. "}</li><li>{""}<a href={"https://xgboost.readthedocs.io/en/stable/tutorials/model.html"}>{"XGBoost's boosted-tree tutorial"}</a>{" provides accessible objective/tree pictures after §4. Keep gross versus already-penalized net gain distinct; charge the extra γ once."}</li><li>{""}<a href={"https://doi.org/10.1214/aos/1013203451"}>{"Friedman (2001)"}</a>{", with an accessible "}<a href={"https://www.cse.iitb.ac.in/~soumen/readings/papers/Friedman1999GreedyFuncApprox.pdf"}>{"1999 manuscript"}</a>{", develops gradient boosting and loss-specific leaf updates. Its mechanism/derivation is distinct from modern Python signatures."}</li><li>{""}<a href={"https://arxiv.org/pdf/1603.02754"}>{"Chen and Guestrin (2016), XGBoost"}</a>{", §§2–4, connects regularized scores, sparsity-aware search and systems. The weighted sketch appendix is deeper than our exact CDF miniature; old benchmarks do not establish today's package ordering."}</li><li>{""}<a href={"https://papers.nips.cc/paper_files/paper/2017/file/6449f44a102fde848669bdd9eb6b76fa-Paper.pdf"}>{"Ke and colleagues (2017), LightGBM"}</a>{", Algorithms 1–2 and §§3–4, supplies GOSS/EFB. Translate fractions into actual inclusion probabilities before reusing a formula."}</li><li>{""}<a href={"https://papers.nips.cc/paper_files/paper/2018/file/14491b756b3a51daac41c24863285549-Paper.pdf"}>{"Prokhorenkova and colleagues (2018), CatBoost"}</a>{", §§3–5, separates target statistics, prediction shift and practical histories. Its theorem has specified assumptions/remainders; it does not claim every expected gradient is 0."}</li><li>{""}<a href={"https://xgboost.readthedocs.io/en/stable/treemethod.html"}>{"XGBoost tree methods"}</a>{", "}<a href={"https://xgboost.readthedocs.io/en/stable/prediction.html"}>{"prediction"}</a>{", "}<a href={"https://xgboost.readthedocs.io/en/stable/tutorials/categorical.html"}>{"categorical schemas"}</a>{" and "}<a href={"https://xgboost.readthedocs.io/en/stable/tutorials/monotonic.html"}>{"monotone constraints"}</a>{" support search and serving decisions. The "}<a href={"https://xgboost.readthedocs.io/en/stable/tutorials/dart.html"}>{"DART tutorial"}</a>{" explains its distinct dropout/reweighting contract."}</li><li>{""}<a href={"https://lightgbm.readthedocs.io/en/stable/Parameters.html"}>{"LightGBM parameters"}</a>{", "}<a href={"https://lightgbm.readthedocs.io/en/stable/Advanced-Topics.html"}>{"advanced topics"}</a>{" and "}<a href={"https://lightgbm.readthedocs.io/en/stable/pythonapi/lightgbm.early_stopping.html"}>{"early stopping"}</a>{" specify active sampling, categorical/missing routes and callback limitations."}</li><li>{""}<a href={"https://catboost.ai/docs/en/references/training-parameters/common"}>{"CatBoost parameters"}</a>{" and "}<a href={"https://catboost.ai/docs/en/concepts/spark-known-limitations"}>{"Spark limitations"}</a>{" distinguish locally tested CPU settings from other devices/deployment routes."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/partial_dependence.html"}>{"sklearn PDP/ICE"}</a>{" develops the exact substitution operation and support assumptions from §10. Return here before treating an averaged curve as a causal claim."}</li><li>{""}<a href={"https://statquest.org/video-index/"}>{"StatQuest's creator-maintained index"}</a>{" links its four-part Gradient Boost series and XGBoost derivations. The "}<a href={"https://www.youtube.com/watch?v=3CC4N4z3GJc"}>{"regression main ideas"}</a>{" and "}<a href={"https://www.youtube.com/watch?v=2xudPOBz-vs"}>{"details"}</a>{" are optional visual companions to residual fitting; the creator's listed main-ideas chapters place first tree at 5:50, second at 10:37 and new-row prediction at 13:50. "}</li><li>{""}<a href={"https://catboost.ai/docs/en/concepts/educational-materials-videos"}>{"CatBoost's official educational videos"}</a>{" offer an ordered-boosting/category overview and Python/Spark talks after §7. Use current matched documentation for device and parameter support. "}</li></ul></section>
</div></ReadingState>};
