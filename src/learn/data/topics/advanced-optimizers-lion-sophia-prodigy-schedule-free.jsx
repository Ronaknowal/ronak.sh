// Generated from the complete optimizer manuscript; authoring renderer owns this source.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {AdamCorrectionDrawing,AdamHistoriesDrawing,AdamImpulseDrawing,AdamUpdateDrawing,CurvatureBowlsDrawing,GGNChainDrawing,GGNScalarDrawing,HessianAutogradDrawing,HessianProbeDrawing,MuonPolarDrawing,OptimizerFactorDrawing,OptimizerMemoryDrawing,OptimizerObjectiveDrawing,OptimizerProbabilityDrawing,OptimizerScoresDrawing,OptimizerWorkDrawing,ProdigyDisplacementDrawing,ProdigyStateDrawing,SampledBatchDrawing,SampledLabelDrawing,ScheduleFreeAdamDrawing,ScheduleFreeConvexDrawing,ScheduleFreeHistoryDrawing,ScheduleFreePointsDrawing,ScheduleFreeStorageDrawing,SophiaRefreshDrawing} from '../../components/lesson-labs/AdvancedOptimizerFlowFigures.jsx';
import {AdvancedOptimizerFlowProvider,HessianProbeFlowActions,HessianProbeFlowLab,LionFlowActions,LionFlowLab,LionWorkedFlowFigure,OptimizerAdaptationFlowProvider,OptimizerAveragingFlowProvider,OptimizerMemoryFlowActions,OptimizerMemoryFlowLab,OptimizerMemoryFlowProvider,OptimizerOpeningFlowLab,ProdigyFlowActions,ProdigyFlowLab,ProdigyWorkedFlowFigure,SampledCurvatureFlowActions,SampledCurvatureFlowLab,ScheduleFreeFlowActions,ScheduleFreeFlowLab,ScheduleFreeWorkedFlowFigure,SophiaClipFlowActions,SophiaClipFlowLab,SophiaFlowProvider} from '../../components/lesson-labs/AdvancedOptimizerFlowLabs.jsx';
import {AdvancedOptimizerStudyFlowProvider,OptimizerHistoryFlowProvider,OptimizerWorkedStudyFlow,OptimizerDataRolesDrawing,OptimizerDigitFlowLab,OptimizerHistoryFlow,OptimizerStudyFlowActions,OptimizerFlowProgram,OptimizerFlowSupportingFiles} from '../../components/lesson-labs/AdvancedOptimizerFlowStudy.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/advanced-optimizer-flow.css';
export default {title:'Advanced Optimizers: Lion, Sophia, Prodigy and Schedule-Free',readTime:'~90 min read + investigations and practice',hasIntegratedGuide:true,content:()=> <AdvancedOptimizerFlowProvider><SophiaFlowProvider><OptimizerAdaptationFlowProvider><OptimizerAveragingFlowProvider><OptimizerMemoryFlowProvider><AdvancedOptimizerStudyFlowProvider><OptimizerHistoryFlowProvider><div className="neural-lesson neural-lesson-neutral lesson-flow advanced-optimizer-flow">
<LessonIntro prerequisites="Weighted sums and gradients; the small classifier and update are refreshed here before optimizer state is introduced." sections={[["1-what-lies-between-an-input-and-the-next-learned-prediction","1. What lies between an input and the next learned prediction?"],["2-adamw-smooth-direction-and-magnitude-separately","2. AdamW: smooth direction and magnitude separately"],["3-lion-keep-a-directional-memory-then-take-its-sign","3. Lion: keep a directional memory, then take its sign"],["4-sophia-distinguish-a-large-slope-from-rapidly-changing-slope","4. Sophia: distinguish a large slope from rapidly changing slope"],["5-prodigy-use-observed-movement-to-adapt-a-shared-scale","5. Prodigy: use observed movement to adapt a shared scale"],["6-schedule-free-take-a-gradient-here-update-there-evaluate-the-average","6. Schedule-Free: take a gradient here, update there, evaluate the average"],["7-train-the-same-real-classifier-with-different-update-rules","7. Train the same real classifier with different update rules"],["8-count-the-resources-you-actually-need","8. Count the resources you actually need"],["9-choose-a-method-by-a-question-you-can-test","9. Choose a method by a question you can test"],["10-practice-and-transfer","10. Practice and transfer"],["11-reproduce-the-calculations","11. Reproduce the calculations"],["12-references-and-other-ways-to-learn","12. References and other ways to learn"],["13-what-to-learn-next","13. What to learn next"]]}>Understand how an optimizer turns a gradient and its retained state into a parameter change, then test each mechanism on an actual classifier.</LessonIntro>
<Prose>{"The preceding "}<a href={"/learn/path/full-curriculum/ring-attention-sequence-parallelism?module=deep-learning-fundamentals"}>{"Ring Attention lesson"}</a>{" moved a model's calculation between devices while keeping its answer the same. We now ask a different question: "}<strong>{"how should the model's numbers change when it learns?"}</strong>{" That choice can change the whole training journey, even when the data, model and loss remain fixed."}</Prose>

<Prose>{"An "}<strong>{"optimizer"}</strong>{" is the rule that turns a gradient and stored history into the next parameter values. We will first draw exactly where that rule sits, then follow AdamW, Lion, Sophia, Prodigy and Schedule-Free through their actual calculations. Their different kinds of memory, curvature estimates, scale adaptation and averaging solve different problems. None is a universal winner."}</Prose>

<Prose>{"The first example is deliberately small enough to calculate by hand. Later we explicitly move to quadratic objectives to isolate state transitions, and finally to a real handwritten-digit classifier with all its saved parameters and optimizer state. The real study, complete scratch programs, ordinary library implementations, deeper theory and independent practice remain part of the route."}</Prose>

<H2>{"1. What lies between an input and the next learned prediction?"}</H2>

<H3>{"First locate the numbers that will change"}</H3>

<Prose>{"Before discussing an update, what does this small classifier actually compute? Two supplied features meet four learned weights and produce two class scores."}</Prose>

<OptimizerScoresDrawing/>

<Prose>{"Read the cyan input cells from top to bottom: their values are 1 and 2. A "}<strong>{"feature"}</strong>{" is one supplied measurement; we have chosen these simple numbers rather than a real image for this first cutaway. The amber grid contains the "}<strong>{"weights"}</strong>{", the numbers learning will change. Each column belongs to one possible class. Class 0 uses weights .4 and .1; class 1 uses −.2 and .3. The connecting lines show that each input participates in both scores. The gray multiplication and addition marks describe operations; the violet output cells contain their results."}</Prose>

<Prose>{"Class 0's score is 1(.4)+2(.1)=.6. Class 1's score is 1(−.2)+2(.3)=.4. A "}<strong>{"score"}</strong>{", also called a "}<strong>{"logit"}</strong>{", is a model's unrestricted numerical evidence for a class. A score is not yet a probability: scores can be negative and need not sum to one. This two-feature cutaway has no bias or hidden layer. The later digit classifier will include a separately drawn bias feature."}</Prose>

<Prose>{"Write the feature row as x=[1,2] and the weight matrix as W=[[.4,−.2],[.1,.3]]. Then the score row is z=xW=[.6,.4]. Its two entries always follow the same class order, 0 then 1. This is the weighted-sum operation introduced in "}<a href={"/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals"}>{"Perceptrons, Neurons & Activation Functions"}</a>{"; we have drawn it here rather than assuming the name supplies the mechanism."}</Prose>

<H3>{"Turn the scores into a comparable probability allocation"}</H3>

<Prose>{"How much probability should each score receive? Make positive masses from the scores, then divide each mass by their shared total."}</Prose>

<OptimizerProbabilityDrawing/>

<Prose>{"Both score wires first subtract the same largest score, .6. They become 0 and −.2. Subtracting a common number does not change the probability allocation; it keeps the subsequent exponentials from overflowing when scores are large. The gray exp operation turns these adjusted scores into positive masses: exp(0)=1 and exp(−.2)≈.818731. The addition node makes the shared total, 1.818731. Both division paths use that same total. Their violet outputs are approximately .549834 and .450166, which sum to one."}</Prose>

<Prose>{"This transformation is "}<strong>{"softmax"}</strong>{": p_j=exp(z_j−max(z))/Σ_k exp(z_k−max(z)). Here j identifies the class whose probability we want, while k visits every class in the denominator. The model prefers class 0, but the allocation is close. Larger score differences create more uneven allocations. Increasing both scores by the same number leaves them unchanged. "}<a href={"/learn/path/full-curriculum/loss-functions-ce-mse-focal-contrastive-triplet?module=deep-learning-fundamentals"}>{"Loss Functions"}</a>{" explains this normalization and its gradient in more depth."}</Prose>

<H3>{"A target makes the learning question precise"}</H3>

<Prose>{"What should improve on this example? The supplied target is class 0, so the loss penalizes assigning too little probability to that class."}</Prose>

<OptimizerObjectiveDrawing/>

<Prose>{"The target enters on its own cyan path. It is supplied information for learning; it did not help compute the model's scores or probabilities. Its one-hot form y=[1,0] means “class 0 is the desired answer.” Select p_0=.549834 and apply the negative natural logarithm. The resulting "}<strong>{"cross-entropy loss"}</strong>{" is L=−ln(p_0)≈.598139. Loss is a number to minimize, rather than a parameter that the optimizer can overwrite."}</Prose>

<Prose>{"The dashed orange return paths represent derivatives: how sensitively this loss responds to each upstream number. For this softmax/cross-entropy combination, the derivatives with respect to the scores are p−y=[−.450166,+.450166]. The first negative sign says that increasing class 0's score slightly would lower the loss. The second positive sign says that increasing class 1's score would raise it. This is the "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals"}>{"Backpropagation & Automatic Differentiation"}</a>{" chain rule applied to the actual route we just drew."}</Prose>

<Prose>{"Each weight multiplies its corresponding input, so its derivative is that input times its score derivative. The complete weight "}<strong>{"gradient"}</strong>{", a matrix in the same shape as W, is"}</Prose>

<Prose>{"g=∂L/∂W=[[−.450166,+.450166],[−.900332,+.900332]]."}</Prose>

<Prose>{"The second row has twice the magnitude because its input was 2, not because the optimizer has already chosen a larger step. A gradient component describes a local sensitivity. It is not itself an instruction about a safe distance to travel. The exact relation is g_ij=x_i(p_j−y_j), with i naming the input feature and j naming the output class."}</Prose>

<H3>{"Now the optimizer has a job"}</H3>

<Prose>{"Where can learning act? A descent update subtracts a scaled gradient from the actual weight grid, and the next forward pass uses that changed grid."}</Prose>

<OptimizerOpeningFlowLab/>

<Prose>{"The old amber grid enters one side of the subtraction nodes. The gradient enters the other side after multiplication by a "}<strong>{"learning rate"}</strong>{", η. This is the chosen scale of the update. With η=.1, subtracting the negative class-0 gradients increases its two weights; subtracting the positive class-1 gradients decreases theirs. The complete new matrix is approximately [[.445017,−.245017],[.190033,.209967]]. Send the same input through it: the new scores are [.825083,.174917], and the new class-0 probability is .657048."}</Prose>

<Prose>{"The rule we just used is ordinary gradient descent, W_next=W−ηg. The live control changes η while keeping this example and its initial gradient fixed. At η=0, the grid and prediction remain unchanged. Try a larger value and compare the changed weights and probability. An improvement on this one example is not evidence that this rate improves an entire dataset. A large step can cross a minimum; a minibatch gradient also contains information from only the examples in that batch."}</Prose>

<Prose>{"In the rest of the lesson, θ means all model parameters arranged as one mathematical vector, g means their gradient, and η means the step scale. Our small W could be flattened into θ without changing the rule. A subscript t counts optimizer updates, not examples or epochs. Equally shaped arrays multiply, divide and square element by element unless we explicitly write a dot product or matrix multiplication. These conventions make the later implementations unambiguous."}</Prose>

<H3>{"Why transform the gradient at all?"}</H3>

<Prose>{"The gradient supplies local slope; history and curvature can help decide how to use it. Compare what each method remembers before following its calculation."}</Prose>

<NeuralTable caption={"Why transform the gradient at all?"} headers={[<>{"Method"}</>,<>{"Question it addresses"}</>,<>{"Persistent information"}</>]} rows={[[<>{"AdamW"}</>,<>{"How large is a recent signed gradient compared with recent squared magnitudes?"}</>,<>{"Signed and squared-gradient averages"}</>],[<>{"Lion"}</>,<>{"Which direction wins when old history meets the current gradient?"}</>,<>{"One signed momentum average"}</>],[<>{"Sophia"}</>,<>{"Is a coordinate's large slope accompanied by high curvature?"}</>,<>{"Momentum and an estimated curvature diagonal"}</>],[<>{"Prodigy"}</>,<>{"Can observed movement help adapt a shared step scale?"}</>,<>{"Scaled moments, displacement histories and initial parameters"}</>],[<>{"Schedule-Free"}</>,<>{"Where should gradients be taken, and which parameters should be evaluated?"}</>,<>{"Fast and averaged trajectories, plus the base method's scaling state"}</>]]} />

<Prose>{"“Adaptive,” “second-order,” “parameter-free” and “schedule-free” describe different properties. They do not remove the need for data choices, validation or a precisely identified implementation. A faster update kernel and fewer updates to useful quality are also different advantages. We begin with AdamW because its two histories make a concrete reference for the other choices."}</Prose>

<H2>{"2. AdamW: smooth direction and magnitude separately"}</H2>

<H3>{"Why do two histories carry different information?"}</H3>

<Prose>{"Our gradient matrix contained signs and sizes. AdamW preserves those two kinds of information in separate moving averages."}</Prose>

<AdamHistoriesDrawing/>

<Prose>{"The signed gradient feeds the signed-history addition path. Its old history, m, retains a fraction β_1; the current gradient contributes the remaining fraction, 1−β_1. This is an "}<strong>{"exponential moving average"}</strong>{": older values keep influencing later states, with successively smaller weights. The squared-history path squares the gradient before averaging it into v, with its own retention fraction β_2. Squares are nonnegative, so opposite signs cannot cancel in v as they can in m."}</Prose>

<Prose>{"The two recurrences are m_t=β_1m_(t−1)+(1−β_1)g_t and v_t=β_2v_(t−1)+(1−β_2)g_t². Both buffers initially contain zero. A "}<strong>{"buffer"}</strong>{" here is a persistent array of computed state, not another learned weight. The gradient, m and v all have the parameter array's shape. "}<a href={"/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations"}>{"Gradient Descent Variants"}</a>{" offers the wider optimizer route; both averaging paths are refreshed here."}</Prose>

<Prose>{"For a new two-coordinate example, let g=[2,−4], β_1=.9 and β_2=.999. The first history becomes [.2,−.4]; the second becomes [.004,.016]. This example isolates the optimizer, so it deliberately replaces the earlier classifier gradient. The computed v is a "}<strong>{"raw second moment"}</strong>{", an average of squared gradients. It is not a variance. A variance would subtract a mean squared, and different weighting schemes require care even with that subtraction."}</Prose>

<H3>{"Why divide away the initial zero?"}</H3>

<Prose>{"If a constant gradient keeps arriving, why does its moving average start too small? Some of the average's total weight still belongs to the initial zero."}</Prose>

<AdamCorrectionDrawing/>

<Prose>{"The chronological strip tracks those contributions. Its drawn example is t=3 and β_1=.9: initial zero retains .729, while the three gradient contributions have weights .081, .09 and .1, totaling .271. After one update, m=(1−β_1)g. After two, m=(1−β_1)(1+β_1)g. After t updates, the sum of the gradient weights is 1−β_1^t, leaving β_1^t on the initial zero. Dividing by 1−β_1^t removes that initialization effect. It does not remove minibatch noise or make the gradient an unbiased estimate of every future slope."}</Prose>

<Prose>{"Thus m_hat=m_t/(1−β_1^t) and v_hat=v_t/(1−β_2^t). At our first update they equal [2,−4] and [4,16]. Adam's direction divides m_hat by sqrt(v_hat)+ε, where ε is a small positive stabilizer. Ignoring only that tiny ε for hand arithmetic, the direction is [1,−1]. The raw gradient's second coordinate was twice as large, but its first normalized update is not twice as large."}</Prose>

<H3>{"Two changes reach the actual parameter"}</H3>

<Prose>{"How does this normalized direction meet the model? AdamW applies decoupled shrinkage and the gradient-driven subtraction as separate changes."}</Prose>

<AdamUpdateDrawing/>

<Prose>{"Read the two number lines in parameter units. The old values [.5,−.7] first multiply by 1−ηλ, with η=.03 and a "}<strong>{"weight-decay coefficient"}</strong>{" λ=.1. They become [.4985,−.6979]. Subtract η[1,−1] and they become approximately [.4685,−.6679]. The diagram keeps shrinkage separate from the signed gradient step; neither changes the input or target."}</Prose>

<Prose>{"The complete rule is θ_next=(1−η_tλ)θ_t−η_t m_hat/(sqrt(v_hat)+ε). The position of ε outside the square root is part of this rule. The "}<a href={"https://arxiv.org/abs/1711.05101"}>{"AdamW paper"}</a>{" explains the decoupling, and "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html"}>{"PyTorch's versioned AdamW rule"}</a>{" identifies the ordinary implementation contract. Our retained complete float64 scratch implementation was compared with native PyTorch over four unequal gradients, including a zero gradient; maximum parameter differences were zero in that particular run. The complete code and its scope appear later."}</Prose>

<Prose>{"Why not add λθ to g instead? That is the derivative of an L2 penalty, and an adaptive optimizer would also feed it into m and v before scaling. Direct multiplication by 1−ηλ takes a separate path. Those operations generally differ, although particular simple cases can coincide."}</Prose>

<H3>{"A zero gradient and a bounded direction are different claims"}</H3>

<Prose>{"Our first normalized direction had magnitude one. Does Adam always keep that bound? A delayed impulse exposes why its two histories cannot be treated as one common average."}</Prose>

<AdamImpulseDrawing/>

<Prose>{"After 999 zero gradients, a nonzero gradient arrives at update 1000. The signed history responds with retention .9, while the squared history responds with retention .999. With the same bias corrections, the absolute normalized direction is approximately 2.51457 before ε. This is a calculation of that history, not a measured training speed or a universal worst case. The first-step result [1,−1] did not establish a bound."}</Prose>

<Prose>{"A zero current gradient can also leave a nonzero m, so the gradient-driven update can continue. Separately, if the gradient contribution is absent and ηλ=.01, ten decay steps multiply a parameter by .99^10≈.904382. With varying rates, the cumulative factor is Π_t(1−η_tλ). A new rate schedule therefore changes cumulative shrinkage even when λ stays fixed. With both histories and decay zero, a zero gradient gives the true stationary case. Keep these cases distinct when debugging."}</Prose>

<H2>{"3. Lion: keep a directional memory, then take its sign"}</H2>

<H3>{"Can old evidence outweigh the present gradient?"}</H3>

<Prose>{"Adam used two histories and a denominator. Lion asks a smaller question first: does the blend of history and this gradient point left or right?"}</Prose>

<LionWorkedFlowFigure/>

<Prose>{"The worked number line places .9(.2)=.18 and .1(−1)=−.10 on the same signed scale. Their sum is .08. The "}<strong>{"sign"}</strong>{" operation returns +1 for a positive sum, −1 for a negative sum, and 0 for an exactly zero sum. It discards the final magnitude of .08, but only after the two magnitudes have competed. A negative present gradient did not win this time."}</Prose>

<Prose>{"Use θ=.5, old momentum m=.2, current gradient g=−1, learning rate η=.01 and decay λ=.2. Decay changes .5 to .499; subtracting η(+1) gives .489. The lower, separate memory route uses .99(.2)+.01(−1)=.188. The direction used the old memory .2, not the newly written .188. A momentum buffer is the stored signed average, not a history of one-bit directions."}</Prose>

<Prose>{"The two roles are explicit in the rule: u_t=sign(β_1 m_old+(1−β_1)g_t), θ_next=(1−η_tλ)θ_t−η_tu_t, and m_next=β_2 m_old+(1−β_2)g_t. Lion's original defaults are β_1=.9 and β_2=.99. There is no second-moment denominator or Adam-style bias correction in this rule. Using one coefficient or calculating the direction from the new memory would define a different algorithm. "}<a href={"https://github.com/google/automl/blob/master/lion/lion_pytorch.py"}>{"Google's official Lion source"}</a>{" makes the order inspectable."}</Prose>

<H3>{"Try the same calculation with conflicting evidence"}</H3>

<Prose>{"What changes if we start from a negative history instead? The next live case uses θ=−.4, m=−.3 and a current positive gradient 2 so that the threshold becomes visible."}</Prose>

<LionFlowLab view="evidence"/>

<Prose>{"The old-history contribution is −.27 and the new-gradient contribution is +.20. Their sum, −.07, still has a negative sign. Increase the selected gradient from 2 to 4: its contribution becomes .40, the sum becomes .13, and the signed step reverses. Both current gradients were positive. Their magnitude was essential before the sign operation. The chronological selector inspects a real update from the sequence, whose preceding gradients have already changed the stored history. Each signed ruler shares the same zero and units; its directly printed value remains visible when two marks coincide."}</Prose>

<H3>{"Where does the signed direction move the weight?"}</H3>

<Prose>{"The direction alone is not the complete parameter change. The same live case sends its current weight through decay and then the signed subtraction."}</Prose>

<LionFlowLab view="update"/>

<Prose>{"With the fresh default rate .02 and decay .1, the first old weight −.4 shrinks to −.3992. The negative direction subtracts −.02, so the new value is −.3792. Edit the initial weight, rate or decay and follow both displacements. Changing η to zero stops parameter movement but does not stop the separate memory recurrence. Decay can make the total change larger or smaller than η; the bounded sign step is only one part of it."}</Prose>

<H3>{"The memory keeps more than a sign"}</H3>

<Prose>{"How does this step affect the next decision? Its gradient and old memory also meet on the second, independently weighted path."}</Prose>

<LionFlowLab view="memory"/>

<Prose>{"The fresh first update gives .99(−.3)+.01(2)=−.277. This is stored for the next update, while β_1=.9 chose the current direction. Changing β_1 changes that current balance; changing β_2 changes what later balances inherit. Both coefficients remain editable here after their roles have been taught. Compare sequences [2,2,2] and [4,4,4]: they share signs but leave different memories. Replacing this buffer by a sign bit cannot reproduce the algorithm."}</Prose>

<H3>{"Inspect the full chronology, then change its length"}</H3>

<Prose>{"How do several decisions connect? The chronological strip follows every actual weight and memory from the same declared initial state."}</Prose>

<LionFlowLab view="sequence"/>

<Prose>{"Each entry supplies one gradient to the rule; append or remove an entry here, then inspect any update in the earlier views. Edits restart the calculation from the same initial state rather than quietly adding a new optimizer onto its ending state. The full table distinguishes old weight, old memory, gradient, blend, sign, decay result, new weight and new memory. Pin the entire case to compare complete inputs and results, or reset its controls and sequence together."}</Prose>

<LionFlowActions/>

<Prose>{"For a stationary check, set initial memory to zero, every gradient to zero and decay to zero. The weight remains exactly unchanged. An exactly zero blend has sign zero; a decimal cancellation near zero can instead expose floating-point rounding. The sign threshold can make small numerical differences matter, so precision, gradient accumulation and loss scaling belong in a real implementation's assessment."}</Prose>

<H3>{"Why this method exists, and when it helps"}</H3>

<Prose>{"The "}<a href={"https://arxiv.org/html/2302.06675v4"}>{"Lion paper"}</a>{" describes an unusual discovery route: optimizer programs were mutated, screened on cheaper tasks, tested on harder tasks and simplified. The two blend coefficients survived that search. The result is an inspectable program, rather than a neural network secretly choosing each update. Proxy tasks can still select behavior that transfers poorly; wider evaluations and ablations matter."}</Prose>

<Prose>{"The paper suggests beginning with a learning rate roughly three to ten times smaller than its AdamW comparator and a correspondingly larger λ to retain a similar ηλ product. This is empirical tuning guidance, not an equivalence theorem or a rule to multiply every decay by 100. A smaller persistent state can help when optimizer storage limits training. It does not halve model weights, activations or gradient communication. Later we count those arrays by name rather than equating fewer buffers with a universal memory or speed improvement."}</Prose>

<H2>{"4. Sophia: distinguish a large slope from rapidly changing slope"}</H2>

<H3>{"Why can the same-sized gradient require a different step?"}</H3>

<Prose>{"Lion simplified the final direction, while Adam scaled it using squared-gradient history. Neither history directly measures how quickly the slope changes as a weight moves. That change in slope is "}<strong>{"curvature"}</strong>{"."}</Prose>

<CurvatureBowlsDrawing/>

<Prose>{"We have now switched from the two-class classifier to a declared quadratic objective so that the geometry can be inspected without data noise. Both contour panels use the same two parameter axes and start at [2,−1]. A contour joins locations with equal loss. In the axis-aligned panel the bowl's shallow and sharp directions align with the axes. In the rotated panel the whole bowl rotates by π/6, so moving either parameter also affects the slope in the other. The marked destination [0,0] minimizes both bowls. The three arrows compare a gradient step with rate .08, a diagonal-curvature step, and a full Newton step."}</Prose>

<Prose>{"First inspect one dimension. For L(θ)=½h(θ−a)², a is the minimizing location and positive h is its curvature. Its gradient is h(θ−a): the same large gradient could mean a large displacement from a, a sharp bowl, or both. The slope changes by h times the parameter change. Dividing the gradient by h recovers the displacement θ−a. Subtracting that displacement reaches a in one update on this exact quadratic. This is the simplest "}<strong>{"Newton step"}</strong>{"; it is a geometry example, not Sophia's complete rule."}</Prose>

<Prose>{"For several parameters, the "}<strong>{"Hessian"}</strong>{" H is the matrix of second derivatives. Entry H_ij says how the gradient in coordinate i changes when coordinate j moves. The off-diagonal entries describe coupling. On our axis-aligned bowl, H=diag(1,20); its diagonal captures every coupling because the other entries are zero. On the rotated bowl, those entries are nonzero. The diagonal step therefore differs from the full Newton result, even though every retained diagonal entry is exact. Keeping only the diagonal saves space but discards information."}</Prose>

<Prose>{"In notation, a quadratic is L(θ)=½θᵀHθ, its gradient is Hθ, and the full Newton step subtracts H^(-1)g when that inverse exists. A diagonal approximation instead subtracts g_i/H_ii coordinate by coordinate. A general neural loss need not be quadratic or convex, and an estimated Hessian need not be positive. The "}<a href={"/learn/path/full-curriculum/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient?module=math-foundations"}>{"Second-Order Methods"}</a>{" lesson develops those conditions and alternative approximations. Here the drawing exposes exactly what a diagonal loses."}</Prose>

<H3>{"How does Sophia limit a curvature-scaled update?"}</H3>

<Prose>{"An estimated denominator can be tiny or negative. Sophia protects the division and clips each transformed coordinate before it changes a parameter."}</Prose>

<SophiaClipFlowLab view="coordinates"/>

<Prose>{"The three lanes begin with momentum m=[.2,−.3,0] and a smoothed diagonal estimate h=[5,.1,0]. These are supplied states for a worked update, not Hessians claimed from the previous bowl. A positive scale ρ=.5 multiplies h. The denominator takes the larger of ρh and a small positive ε; this is a "}<strong>{"floor"}</strong>{" that prevents nonpositive denominators. Divide momentum by the denominator. The first two ratios are .08 and −6, while zero momentum makes the third zero. The next operation "}<strong>{"clips"}</strong>{" each ratio to the interval [−1,1]: anything above 1 becomes 1, and anything below −1 becomes −1. The resulting direction is [.08,−1,0]."}</Prose>

<Prose>{"Only the middle lane reaches the clipping limit. The other two are not artificially enlarged to a full step. This protects the gradient-driven coordinate change from exceeding η in absolute value, but does not bound the complete change when decay also acts, nor guarantee a lower loss. A floor makes a bad curvature estimate numerically usable; it does not make the estimate true."}</Prose>

<H3>{"Follow the direction all the way into the weight"}</H3>

<Prose>{"What changes in the actual parameter vector? Apply shrinkage and then subtract the clipped direction, just as we separated both paths in AdamW."}</Prose>

<SophiaClipFlowLab view="scale"/>

<Prose>{"With old θ=[1,2,3], rate η=.1 and decay λ=.2, shrinkage gives [.98,1.96,2.94]. Subtract .1[.08,−1,0] to obtain [.972,2.06,2.94]. The third parameter moves only because of decay. The live views let you edit one coordinate's m and h, then ρ, η and λ in their separate taught places; all lanes use the same current state."}</Prose>

<Prose>{"The complete classroom rule averages gradients as m_t=β_1m_old+(1−β_1)g_t, averages curvature as h_t=β_2h_old+(1−β_2)h_estimate on refresh updates, and otherwise keeps h fixed. It updates θ_next=(1−ηλ)θ−η clip(m/max(ρh,ε),−1,1). Maximum, division and clipping act elementwise. Curvature refreshes can be less frequent than gradient updates, so the current gradient and its denominator need not be equally recent. The "}<a href={"https://arxiv.org/html/2305.14342v4"}>{"Sophia paper"}</a>{" specifies both the rule and the two distinct estimators we now examine."}</Prose>

<SophiaClipFlowActions/>

<H3>{"A Hessian-vector product exposes coupling without storing the Hessian"}</H3>

<Prose>{"How could we estimate H's diagonal without constructing a huge square matrix? Multiply it by a random probe and then multiply that result elementwise by the same probe."}</Prose>

<HessianProbeDrawing/>

<Prose>{"The supplied probe is u=[1,1], and the drawn Hessian is H=[[2,3],[3,1]]. Matrix multiplication gives Hu=[5,4]. The final elementwise multiplication u⊙Hu leaves [5,4]. With u=[1,−1], Hu=[−1,2], and u⊙Hu=[−1,−2]. These are estimates of the diagonal [2,1], not two alternative true diagonals. The arrow between the two multiplications matters: multiplying matching entries of H and u is not a Hessian-vector product."}</Prose>

<Prose>{"For independent random signs, each u_i is ±1 with equal probability. Its square is always 1, and different signs have E[u_i u_j]=0. Coordinate i of the estimate is H_ii u_i²+Σ_(j≠i)H_ij u_i u_j. Taking the expectation keeps H_ii and removes the other terms. This is the "}<strong>{"Hutchinson diagonal estimator"}</strong>{", E[u⊙(Hu)]=diag(H). The paper uses Gaussian probes, which also satisfy E[uuᵀ]=I; independent sign probes make this small example exhaustive. An unbiased estimator has the right average over repeated draws, not necessarily the correct value on one draw."}</Prose>

<H3>{"One negative estimate is not a negative-curvature certificate"}</H3>

<Prose>{"Can a positive-semidefinite Hessian still give a negative sampled entry? A fresh symmetric matrix makes that possibility concrete."}</Prose>

<HessianProbeFlowLab view="matrix"/>

<Prose>{"The live matrix starts at [[4,−2],[−2,1]]. Its eigenvalues, 0 and 5, are nonnegative, so it is "}<strong>{"positive semidefinite"}</strong>{": every direction has uᵀHu≥0. Edit its three independent entries; symmetry means changing H_12 also changes H_21. The picture shows the full actual matrix, so those coupled entries cannot quietly diverge."}</Prose>

<HessianProbeFlowLab view="probe"/>

<Prose>{"For u=[1,1], the elementwise estimate is [2,−1]. For u=[1,−1], it is [6,3]. The other two sign probes duplicate those outcomes. Their equal-weight average is [4,1], exactly the diagonal, even though one individual sampled entry was negative. This is different from the directional curvature uᵀHu; do not infer its sign from one coordinate of u⊙Hu. Remove off-diagonal coupling and every sign probe gives the same diagonal. Set the whole H to zero for a genuine null."}</Prose>

<HessianProbeFlowActions/>

<H3>{"Deeper: obtain Hu by differentiating the actual loss"}</H3>

<Prose>{"Does computing Hu require writing H first? Differentiate a scalar inner product instead, keeping the probe fixed."}</Prose>

<HessianAutogradDrawing/>

<Prose>{"The first return path differentiates the loss L into its gradient vector g. The dot-product node multiplies each g_i by supplied u_i and sums into one scalar, gᵀu. The second return path differentiates that scalar with respect to the same parameters. With a twice-differentiable scalar loss, it gives Hᵀu=Hu. Automatic differentiation must preserve the first gradient's computation graph; otherwise the second derivative has no route back. The probe is treated as constant, and each new loss evaluation uses a fresh graph."}</Prose>

<Prose>{"The complete supplemental "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/optimizer-curvature-instruments.py"}>{"optimizer-curvature-instruments.py"}</a>{" implements this operation with ordinary PyTorch differentiable primitives. Its finite-difference check instead evaluates fresh gradients at θ+δu and θ−δu, subtracts them and divides by 2δ. That checks the product without assembling H or using the same second-derivative route. The program handles a linear loss's zero Hessian, rejects incompatible/nonfinite probes and checks nonlinear classifiers as well as independent quadratic matrices. This is an actual CPU float64 operator study; it neither implements a GPU training kernel nor runs a Sophia-H training campaign."}</Prose>

<H3>{"Model-sampled labels measure a different object"}</H3>

<Prose>{"Sophia-H used second derivatives directly. Sophia-G instead draws labels from the model's current probabilities and differentiates their loss; those instrument labels must remain separate from the labels used to train."}</Prose>

<SampledLabelDrawing/>

<Prose>{"We now switch to a one-feature binary classifier to isolate the estimator. Its feature is x=2, its current probability for class 1 is p=.8, and its real training label is 1. Its real-label derivative in the scalar weight is x(p−1)=−.4, with square .16. That branch describes the observed residual. It does not measure the entire curvature. The other branch draws a new label: 1 with probability .8, or 0 with probability .2. Those possibilities produce derivatives −.4 and 1.6, respectively. Weight their squares by their sampling probabilities: .8(.16)+.2(2.56)=.64."}</Prose>

<Prose>{"The scalar logistic-loss curvature is x²p(1−p)=4(.8)(.2)=.64. The agreement comes from the "}<strong>{"model-sampled"}</strong>{" residual, whose expectation is zero at these fixed parameters. Squaring the ordinary true-label derivative gave .16 instead. True labels are never discarded from the training-gradient path; sampled labels are an additional curvature instrument."}</Prose>

<H3>{"Why does a batch need its size multiplier?"}</H3>

<Prose>{"What happens when loss is averaged across examples? Square the sampled mean gradient, then multiply by the number of independent examples."}</Prose>

<SampledBatchDrawing/>

<Prose>{"For two examples, x=[2,1] and p=[.8,.3], the tree has four possible sampled-label pairs. A path's probability multiplies its two independent sampling probabilities. Each leaf first averages its two derivatives, then computes 2 times the square of that mean. The weighted sum across all four leaves is .425, which is also the mean of the two exact curvature diagonals. Omitting the factor 2 gives .2125, half the desired result."}</Prose>

<Prose>{"Write N for batch size and g_sample=(1/N)Σ_b g_b for the gradient of the mean sampled-label loss. At fixed parameters, independent model-sampled labels make each g_b have expectation zero, so the cross terms in E[(Σ_b g_b)²] vanish. Then E[N g_sample²]=(1/N)Σ_b E[g_b²]. The original paper and retained code use B for this same example count; here B=N. It counts examples, not classes or parameter coordinates. The independence, current model probabilities and mean-loss convention are part of the claim. A correlated label draw or stale probability vector needs a different argument."}</Prose>

<H3>{"Change the examples without changing the instrument's meaning"}</H3>

<Prose>{"Will real-label squares and model-sampled squares coincide on every dataset? The next case starts from different features and probabilities so we can compare them directly."}</Prose>

<SampledCurvatureFlowLab view="example"/>

<Prose>{"The fresh defaults are x=[3,1], p=[.25,.6], and real labels [1,0]. The selected example's feature and probability affect every leaf and its analytic diagonal; selecting another example only changes which one is edited. The expected batch-scaled estimate is .96375. Squaring the real-label mean gradient gives .680625, while omitting N gives .481875. These are three different calculations, each labelled as such."}</Prose>

<SampledCurvatureFlowLab view="target"/>

<Prose>{"Change only a real label: its training-gradient lane changes, while the model-sampled expectation remains fixed at the same x and p. Set both features to zero and both lanes give zero. The complete four-outcome table shows current probabilities, means, estimates and weighted contributions; no finite random sample is presented as an exact expectation."}</Prose>

<SampledCurvatureFlowLab view="enumeration"/>

<SampledCurvatureFlowActions/>

<H3>{"Deeper: why this is Gauss–Newton curvature, not always the full Hessian"}</H3>

<Prose>{"Where does the model's nonlinearity enter? Separate how parameters change the logits from how logits change the loss."}</Prose>

<GGNChainDrawing/>

<Prose>{"The learned model produces a logit vector f(θ). Its "}<strong>{"Jacobian"}</strong>{" J contains first derivatives of those logits: one row per class and one column per parameter. At the logit level, softmax cross-entropy has curvature C=diag(p)−ppᵀ, where diag(p) places probabilities on a matrix's diagonal and ppᵀ contains every pairwise probability product. The central branch sends parameter changes through J, through C, and back through Jᵀ. Its result G=JᵀCJ is the "}<strong>{"generalized Gauss–Newton matrix"}</strong>{". Sophia-G's sampling construction estimates its diagonal."}</Prose>

<Prose>{"The lower branch has another contribution. A nonlinear model's logits can themselves curve with θ. Applying the chain rule twice gives H=G+Σ_j(p_j−y_j)∇²f_j(θ). The residual p_j−y_j multiplies each logit's own Hessian. In a linear softmax classifier those second derivatives are zero, so G=H. In a nonlinear network they need not be zero. Sophia-G is consequently not generally an unbiased estimator of the full loss-Hessian diagonal, even with infinitely many sampled labels."}</Prose>

<H3>{"A one-parameter counterexample keeps every term visible"}</H3>

<Prose>{"How large can the missing term be? Use f(θ)=θ² as the logit of class 1, a constant zero logit for class 0, and a real class-1 target."}</Prose>

<GGNScalarDrawing/>

<Prose>{"At θ=1, p_1=sigmoid(1)≈.731059. The first derivative of the changing logit is 2θ=2, so G=(2θ)²p_1(1−p_1)≈.786448. Its second derivative is 2. The true-label residual is p_1−1≈−.268941, so the additional curvature is 2(p_1−1)≈−.537883. Adding both gives the full loss Hessian .248565. All three are actual values at the same parameter and target; G's positive-semidefinite form did not make it equal to H."}</Prose>

<Prose>{"The complete HVP supplement checks this identity with a separate three-logit nonlinear example and autograd/finite differences. Across 18 quadratic and 27 nonlinear comparisons, author and independent CPU executions agreed with maximum finite-difference error 4.8345×10^−10 and chain-rule reconstruction error 4.4409×10^−16. Those checks substantiate the operator and example, not Sophia's universal training effectiveness."}</Prose>

<H3>{"Refresh at a coherent state and identify the stored convention"}</H3>

<Prose>{"When should both gradient paths read the model? They must use the same current parameters, with separate fresh gradient buffers."}</Prose>

<SophiaRefreshDrawing/>

<Prose>{"The true-label mean loss supplies the training gradient. On a refresh update, model-sampled labels supply a separate gradient at those same parameters. Clear gradient buffers between paths so they do not add together accidentally. Multiply the sampled mean-gradient square by the actual batch size once, average it into h, then update using the saved true-label gradient. Never step the parameters between the two reads while claiming this same-state estimator."}</Prose>

<Prose>{"Storage conventions differ in ordinary implementations. Our classroom rule stores the batch-scaled estimate in h and floors max(ρh,ε). The pinned official Sophia source stores an unscaled square and includes batch size in its denominator; its small additive epsilon is also a different denominator convention. Passing an already scaled estimate and applying the multiplier again would double-count N. The later complete API bridge shows its explicit mapping, batch size and independent gradient paths. Larger steps, infrequent refreshes and clipping can work on some tasks and fail on others; inspect the measured loss, clipping fraction, refresh frequency and extra gradient cost rather than treating “second-order” as a guarantee."}</Prose>

<H2>{"5. Prodigy: use observed movement to adapt a shared scale"}</H2>

<H3>{"Can progress tell us something about the size of a step?"}</H3>

<Prose>{"Sophia asked how sharply the slope changes. Prodigy addresses another difficulty: a useful step scale can be unknown before training begins. It keeps evidence about gradients and movement from the initial parameters, then adapts a shared positive scalar d."}</Prose>

<ProdigyDisplacementDrawing/>

<Prose>{"We continue with a declared scalar quadratic, L(θ)=½(θ−3)², to make the trajectory visible. The target location 3 defines the objective, so the gradient is θ−3. The initial parameter is θ_0=0. At a later update, the algorithm can compare its current parameter θ with that known initialization. The displacement θ_0−θ is an observed difference; it is not the unknown distance to the objective's optimum. The dot-product instrument receives g and this displacement, never the target location as an oracle."}</Prose>

<Prose>{"For many parameters, both g and displacement are vectors. Multiply corresponding entries, then sum to one scalar ⟨g,θ_0−θ⟩. This "}<strong>{"dot product"}</strong>{" can be positive, negative or zero. It is global: one coordinate's favorable contribution can cancel another's unfavorable contribution. The scalar d is shared by the whole parameter array, rather than estimated independently for each cell."}</Prose>

<H3>{"Why are two weighted histories needed?"}</H3>

<Prose>{"How does Prodigy retain that evidence? The displacement dot product feeds a scalar numerator, while the gradient feeds a vector history used to normalize it."}</Prose>

<ProdigyFlowLab view="global"/>

<Prose>{"The pictured signed dot product feeds the numerator history r. A second history s accumulates weighted gradient coordinates; these two accumulated quantities are shown in the state diagram below. Take the absolute value of each current s coordinate and sum them: ||s||_1 is its "}<strong>{"L1 norm"}</strong>{". Dividing r by that norm produces a candidate scale. The max operation keeps whichever is larger: the current d or that candidate. A zero denominator retains the current d. A negative candidate also cannot force this positive, nondecreasing d downward."}</Prose>

<Prose>{"A small two-coordinate instrument isolates the cancellation: g=[−1,2] and displacement=[−.5,−.25] give coordinate products [.5,−.5] and dot product zero. Looking at only the first coordinate would falsely report positive global progress. Edit either coordinate after its role has been taught and follow the full sum. This vector instrument explains the scale evidence; it is not a newly trained model."}</Prose>

<H3>{"Current d and next d must take different paths"}</H3>

<Prose>{"Which scale changes the present parameter? The current d belongs to this update's moments and subtraction; the newly estimated d is saved for a later update."}</Prose>

<ProdigyStateDrawing/>

<Prose>{"We use the Adam-style "}<strong>{"Algorithm 4 from the Prodigy paper"}</strong>{", not an unnamed mixture of its practical package options. At each update, let b=sqrt(β_2). The diagram's current-d wire enters both moment paths and the current subtraction. Its other wire enters the two progress histories. The next-d wire leaves the max operation into stored state for the following update. These distinct destinations prevent an off-by-one scale change."}</Prose>

<Prose>{"The complete recurrences, with old states on the right, are"}</Prose>

<Prose>{"m_next=β_1m_old+(1−β_1)d g,"}</Prose>

<Prose>{"v_next=β_2v_old+(1−β_2)d² g²,"}</Prose>

<Prose>{"r_next=b r_old+(1−b)γd²⟨g,θ_0−θ⟩,"}</Prose>

<Prose>{"s_next=b s_old+(1−b)γd²g,"}</Prose>

<Prose>{"d_next=max(d,r_next/||s_next||_1) when the norm is positive; otherwise d_next=d,"}</Prose>

<Prose>{"θ_next=θ−γd m_next/(sqrt(v_next)+d ε)."}</Prose>

<Prose>{"The symbol γ is the supplied rate "}<strong>{"multiplier"}</strong>{", distinct from the adapting scale d. Here β_1=.9, β_2=.999 and ε=10^−8. All histories start at zero and θ_0 is retained as its own fixed array. This paper rule has no bias correction or weight decay. The numerator may be signed; replacing it by its absolute value changes the rule. Plain Adam moments do not match these scaled moments. In particular, d is accumulated into m and d² into v, not merely multiplied onto an ordinary Adam update at the end."}</Prose>

<H3>{"Follow the scale before celebrating its adaptation"}</H3>

<Prose>{"Does a growing scale imply steadily better loss? The whole scalar trace shows both movement and overshoot."}</Prose>

<ProdigyWorkedFlowFigure/>

<Prose>{"On the worked objective with initial θ=0, d=.01 and γ=1, the first three parameters are approximately .0316228, .0741064 and .1514404. The scale used on those updates is .01, .01 and .0157316, respectively. A retained estimate affects the following update according to the diagram's state convention. By update 7, θ≈7.11008, well past the minimizing location 3. The resulting loss increase remains in the trace; adapting the scale did not make the objective convexity a guarantee of monotone progress for this practical Adam-style recurrence."}</Prose>

<H3>{"Change the objective and starting scale"}</H3>

<Prose>{"What happens on a genuinely different case? The live scalar problem starts at θ=1 with target −2, d=.01 and γ=.3."}</Prose>

<ProdigyFlowLab view="objective"/>

<Prose>{"This announced switch keeps the same algorithm and makes its direction change visible. The first three parameters are .990513168, .977765462 and .962918671. Its d first increases after update 3, so that increase is used at update 4. After 12 updates it has overshot to −3.41631850. All displayed losses come from the declared current quadratic, not a fabricated convergence curve."}</Prose>

<ProdigyFlowLab view="scale"/>

<Prose>{"Increase γ to 1 at the same starting point and target. The first retained d increase now occurs after update 2, and the parameter reaches approximately −6.11008139 at update 7. The live controls keep the initial scale and multiplier distinct. A higher multiplier can alter the evidence history as well as the size of the current step."}</Prose>

<ProdigyFlowLab view="chronology"/>

<Prose>{"Inspect any update's current weight, gradient, r, ||s||_1, scaled moments, d used and d retained next. Changing the objective or initial state restarts the full chronology with zero histories; it does not continue an old trace under a new objective. Pin the complete inputs and outputs to compare cases. If a calculation becomes nonfinite, keep its last finite states and report the first failed update rather than hiding the divergence behind a cap. At initial θ equal to the target and zero history, every gradient is zero: θ and d remain unchanged."}</Prose>

<ProdigyFlowActions/>

<H3>{"What “parameter-free” leaves for the practitioner"}</H3>

<Prose>{"Prodigy aims to reduce the need to supply a carefully tuned problem-scale rate. It still has an initial d, coefficients, ε, a multiplier and implementation choices. The paper's proofs concern the stated convex algorithms and assumptions; they do not establish that this Adam-style variant solves every nonconvex model without tuning. Our overshoot is consistent with that boundary."}</Prose>

<Prose>{"The "}<a href={"https://github.com/konstmish/prodigy"}>{"official package"}</a>{" recommends starting at "}<code>{"lr=1"}</code>{" and provides "}<code>{"d_coef"}</code>{", optional bias correction, sliced adaptation statistics and constant or cosine schedules. Its warmup safeguard changes estimator normalization; it is not just a fixed waiting period before growth. Numerical rescaling and update details can also differ from compact paper arithmetic. State the exact version and variant before comparing trajectories. The complete ordinary-library bridge later checks practical API and checkpoint behavior without claiming that its path is identical to our paper Algorithm 4."}</Prose>

<Prose>{"This can be useful when many small models or objectives have different scales, as in architecture search. Reducing a per-model rate sweep could save work. A fair experiment must still count tuning and reruns, record failures and compare validation quality; one favorable run cannot establish that a sweep was unnecessary. The real study later retains both candidate multipliers and both seeds."}</Prose>

<H2>{"6. Schedule-Free: take a gradient here, update there, evaluate the average"}</H2>

<H3>{"Why keep more than one parameter location?"}</H3>

<Prose>{"Prodigy adapted a shared scale; Schedule-Free changes where the training gradient and evaluation occur. Rather than prescribing a decay endpoint for a known run length, it maintains a fast trajectory and an averaged trajectory, then reads the gradient between them."}</Prose>

<ScheduleFreePointsDrawing/>

<Prose>{"The first number line shows three named mathematical parameter arrays as points. The "}<strong>{"fast point z"}</strong>{" is updated directly by the gradient. The "}<strong>{"average x"}</strong>{" combines earlier fast points and is the model used for evaluation. The "}<strong>{"training point y"}</strong>{" lies between them: y=βx+(1−β)z. With β=.9, it lies closer to x. This is parameter interpolation, not averaging the two models' output probabilities. In a nonlinear model those operations need not agree."}</Prose>

<Prose>{"We first use the simplest mathematical SGD recurrence so we can trace every arrow without a second-moment denominator. Its coefficients and update indexing are explicit; the later AdamW/library form has additional state. Our local one-based update t averages "}<strong>{"post-update"}</strong>{" fast points: form y from the old x,z; calculate g=∇L(y); set z_next=z−ηg; then set x_next=(1−1/t)x+(1/t)z_next. The paper can index the same recurrence differently, so compare actual arrays rather than shifting a formula by name."}</Prose>

<H3>{"Follow a gradient from its read location to its destination"}</H3>

<Prose>{"Where does the gradient arrow start, and which point does it move? It starts at y, but its scaled value is subtracted from z."}</Prose>

<ScheduleFreeWorkedFlowFigure/>

<Prose>{"Use the quadratic ½θ², initial x=z=2, β=.9 and η=.2. To make variation explicit, add the declared gradient perturbations [1,−1,.5,−.5]; these are arithmetic inputs, not measured noise. At update 1, y=2 and g=3, so z_next=1.4. Since the first averaging coefficient is 1, x_next also becomes 1.4."}</Prose>

<Prose>{"At update 2, y=1.4, g=.4 and z_next=1.32. The coefficient 1/2 averages the first two post-update fast points into x_next=1.36. At update 3, the gradient is read at .9(1.36)+.1(1.32)=1.356, neither old z nor old x. Adding .5 gives g=1.856; subtracting .2g from z gives .9488, then averaging gives x=1.222933. This distinction affects all later states."}</Prose>

<NeuralTable caption={"Follow a gradient from its read location to its destination"} headers={[<>{"Update"}</>,<>{"Training point y"}</>,<>{"Perturbed gradient"}</>,<>{"New fast point z"}</>,<>{"New average x"}</>]} rows={[[<>{"1"}</>,<>{"2"}</>,<>{"3"}</>,<>{"1.4"}</>,<>{"1.4"}</>],[<>{"2"}</>,<>{"1.4"}</>,<>{".4"}</>,<>{"1.32"}</>,<>{"1.36"}</>],[<>{"3"}</>,<>{"1.356"}</>,<>{"1.856"}</>,<>{".9488"}</>,<>{"1.222933"}</>],[<>{"4"}</>,<>{"1.19552"}</>,<>{".69552"}</>,<>{".809696"}</>,<>{"1.119624"}</>]]} />

<Prose>{"The final reported loss belongs at x=1.119624, not whichever point looks best. A default framework validation loop can quietly inspect the wrong representation if it never performs the optimizer's mode conversion."}</Prose>

<H3>{"Which past points still contribute?"}</H3>

<Prose>{"Is an insertion coefficient the same as its final influence? The full averaging circuit shows older points being diluted as new ones arrive."}</Prose>

<ScheduleFreeHistoryDrawing/>

<Prose>{"After t updates, each of the t post-update fast points has final coefficient 1/t in the equal-weight average. The newest point enters with coefficient 1/t, but subsequent averages dilute it too. Earlier insertion coefficients 1,1/2,1/3 do not remain the final weights of the first three points. After three updates those three final weights are all 1/3."}</Prose>

<Prose>{"This is different from the momentum EMA used by Lion and Adam, whose past weights decay geometrically. It is also different from setting the gradient's learning rate to 1/t: each earlier gradient can influence many later fast points before averaging. The actual recurrence defines those effects; there is no universal “effective schedule” that makes all three procedures identical."}</Prose>

<H3>{"Change the problem without confusing its three points"}</H3>

<Prose>{"What if the target and perturbations change? The next live case starts x=z=−1 with target 1, rate .2 and perturbations [−.5,.5,1,−1]."}</Prose>

<ScheduleFreeFlowLab view="objective"/>

<Prose>{"The geometry now follows a new quadratic, ½(θ−1)². After update 2, z=−.3 and x=−.4; next y=.9(−.4)+.1(−.3)=−.39. The third perturbation is +1, so its gradient is −.39−1+1=−.39. Each picture and live sentence uses this same current sequence."}</Prose>

<ScheduleFreeFlowLab view="mixing"/>

<Prose>{"Edit β and η locally after tracing their roles. For unchanged default inputs, the final x is about −.19456 at β=.9, −.208 at β=0 and −.193 at β=1. The mathematical recurrence permits both endpoints: at β=0 gradients are read at z; at β=1 they are read at x. That does not imply that an optimized library's parameter-reconstruction formula supports both endpoints."}</Prose>

<ScheduleFreeFlowLab view="perturbation"/>

<Prose>{"Change a selected perturbation or inspect another chronological update. A perturbation adds to the current objective gradient before the fast update; it does not teleport a parameter point. The complete table preserves every old and new state. A separate length control adds/removes a perturbation without hiding other controls inside a disclosure."}</Prose>

<ScheduleFreeFlowLab view="length"/>

<Prose>{"Pin the complete case, or reset its objective, interpolation, rate, sequence and selected update together. Start at the target with all perturbations zero to check the stationary null; all three points remain there. With rate zero, the fast parameters do not move. These unchanged cases remain explicit rather than manufacturing an animation."}</Prose>

<ScheduleFreeFlowActions/>

<H3>{"The AdamW form changes scaling and averaging weights"}</H3>

<Prose>{"How does the same placement idea use adaptive scaling? Schedule-Free AdamW keeps a second-moment history but, in the base form used here, no ordinary first-moment EMA."}</Prose>

<ScheduleFreeAdamDrawing/>

<Prose>{"For the pictured first update, switch to x=y=z=2, target0, no perturbation, rate.1 and no decay. Its gradient2 squares to4; v=.004 becomes corrected v̂=4, so its scaled direction is approximately1 and the new fast point is approximately1.9. The first averaging coefficient1 makes x equal that new z. In the general rule the gradient is still evaluated at y. Squared gradients update v; its bias-corrected square root plus ε scales g before z moves. Decay can also be evaluated at y, as in the paper's algorithm. Interpolation provides the momentum-like behavior rather than the usual Adam first-moment average. These differences are algorithmic, not just names for three copies of ordinary Adam."}</Prose>

<Prose>{"Warmup remains possible. Under the paper's weighting, assign w_t=η_t² and insert the new fast point with c_t=w_t/Σ_(i≤t)w_i. The average now weights fast points by their rate-squared contributions rather than always equally. We next separate those physical quantities visually."}</Prose>

<ScheduleFreeFlowLab view="weights"/>

<Prose>{"Rates [.1,.2,.3] have squared weights [.01,.04,.09]. After three updates, their final normalized weights are [1,4,9]/14. Their historical insertion coefficients were instead 1,4/5 and 9/14. Each displayed update labels those different quantities explicitly; confusing them would misstate which model is evaluated. Our study's increasing warmup then constant rate agrees with the current library's maximum-rate weighting for this schedule. Arbitrary nonmonotone schedules require identifying which weighting rule an implementation actually uses."}</Prose>

<H3>{"A mode change swaps the parameter representation"}</H3>

<Prose>{"What does "}<code>{"optimizer.eval()"}</code>{" mean here? It makes the parameter buffer represent x, while "}<code>{"optimizer.train()"}</code>{" restores y for gradients."}</Prose>

<ScheduleFreeStorageDrawing/>

<Prose>{"The literal-reference drawing shows the separate arrays. Our readable scratch class stores average x and fast z, keeps the training representation in its parameter array, and has a second-moment array. These are physical arrays to count, not a theorem that any three mathematical points require three extra buffers. The efficient library keeps the needed fast state and second moment and reconstructs representations in the main parameter buffer. Its conversion can divide by β; the mathematical endpoint examples above do not waive that implementation restriction."}</Prose>

<Prose>{"Optimizer mode is separate from "}<code>{"model.eval()"}</code>{" and "}<code>{"model.train()"}</code>{", which affect layers such as Dropout and BatchNorm. Use both sets of hooks deliberately. For a BatchNorm model, running statistics gathered at y may not match evaluation at x. The method's guidance recomputes appropriate statistics from training inputs at evaluation weights, without fitting on validation inputs or labels. Save the documented representation together with optimizer state and RNG state if training will resume. The complete library bridge later checks uninterrupted versus resumed next steps, not just that a checkpoint file can be opened."}</Prose>

<Prose>{"The actual handwritten study retains validation measurements at both x and y. In seed 29, y happens to score lower. Evaluation at x remains the declared method, not a claim that x wins every minibatch. Do not choose whichever representation looks better only after inspecting assessment outcomes."}</Prose>

<H3>{"Deeper: a theorem needs its assumptions and its rate choice"}</H3>

<Prose>{"Does having an evaluation iterate at every step prove optimal convergence at any stopping time? The bound's assumptions and its chosen rate matter."}</Prose>

<ScheduleFreeConvexDrawing/>

<Prose>{"The drawing first shows convexity on the constructed objective f(θ)=½θ² restricted to [−1,1]: the mean of points−1 and1 is0, whose loss0 lies below their mean loss.5. This local example does not prove a training theorem. The Schedule-Free paper's introductory SGD bound assumes convex, Lipschitz stochastic losses with independent samples. Here convex means that a line between parameter points lies above the objective graph; Lipschitz means a finite bound G controls loss change per distance. The quantity D bounds the relevant distance to a comparator, and T is the number of updates in that bound. Its displayed rate η=D/(G sqrt(T)) contains the horizon T. The update can use a constant chosen rate, but that introductory choice is not a proof that every constant rate is optimal at every stopping time for a nonlinear neural loss."}</Prose>

<Prose>{"The broader online-to-batch result and the paper's larger-rate discussion explain more of the practical connection. "}<a href={"https://arxiv.org/html/2405.15682v2"}>{"The Road Less Scheduled"}</a>{" and its "}<a href={"https://github.com/facebookresearch/schedule_free"}>{"official implementation"}</a>{" distinguish those claims. Constant-rate SGD, other schedules and restarts also exist; Schedule-Free is not the only way to extend a run. Its useful practical property is an evaluation average without a prescribed decay endpoint. If the data distribution changes, averaging the full earlier history may be inappropriate. That is a different learning problem whose answer is not supplied by stationary convex analysis."}</Prose>

<H2>{"7. Train the same real classifier with different update rules"}</H2>

<H3>{"What does a real example contain?"}</H3>

<Prose>{"The previous cases isolated updates with constructed objectives. We now switch explicitly to actual handwritten-digit images, keeping one small classifier so optimizer effects are not confused with architecture changes."}</Prose>

<OptimizerWorkedStudyFlow view="image"/>

<Prose>{"Each example has an 8×8 grid of block-count intensities from the UCI Optical Digits data distributed through scikit-learn. These are not MNIST images. The raw values range from 0 to 16; darker and lighter cells represent those supplied intensities, with row/column labels and a selected pixel's raw value printed directly. Our retained extract contains 400 images, forty per digit. A source identifier connects an image to its role and saved state. Source truth is separate from the learner's temporary diagnostic target."}</Prose>

<H3>{"How does the image enter all ten score columns?"}</H3>

<Prose>{"Where is the full model, rather than only a selected pixel? Flatten all 64 pixels, divide them by 16, append a constant 1 and multiply by the complete learned map."}</Prose>

<OptimizerWorkedStudyFlow view="model"/>

<Prose>{"The cyan feature row now has 65 entries: 64 normalized intensities followed by the separate constant-one "}<strong>{"bias feature"}</strong>{". Its learned parameter matrix Θ has 65 rows and 10 columns, so it contains 650 parameters. Each class's score sums all 65 feature–weight products. The bias row contributes its learned weight even when every pixel is zero. This is a larger version of the opening two-feature classifier, with an explicit bias and ten classes rather than two. There is no hidden activation layer in this model."}</Prose>

<Prose>{"The ten scores undergo the same stable softmax we already traced: subtract the row maximum, exponentiate, sum and divide every mass by that total. Every class probability remains visible, not just the largest one. Selecting a particular weight is a cutaway into this full computation; it never replaces the model with one pixel times one weight."}</Prose>

<H3>{"What learning signal belongs to a selected pixel?"}</H3>

<Prose>{"The model's complete probability row meets a target, and its class residuals return through the feature multiplications."}</Prose>

<OptimizerWorkedStudyFlow view="gradient"/>

<Prose>{"For a selected diagnostic class, the one-hot target Y has a 1 in that column and zero elsewhere. Subtract it from the full probability row P. The selected normalized pixel multiplies each residual, producing ten derivatives in that parameter row. If the pixel is zero, all ten of its weight derivatives are zero for this example. The bias derivative uses feature 1, so it need not vanish in that case. Changing a target does not change the pre-update scores or probabilities; it changes the residuals and hence the gradient."}</Prose>

<Prose>{"For a batch, stack the feature rows into X of shape N×65 and probabilities/targets into P,Y of shape N×10. The complete mean-loss gradient is ∇ΘL=Xᵀ(P−Y)/N. The transpose and matrix product sum each input's residual contributions across all N examples; division by N matches the mean loss. The retained programs use B for this same batch count, so B=N here. Our fitted batches have 64 examples; the live diagnostic later uses one. Nonlinear networks obtain corresponding parameter arrays through backpropagation, after which the optimizer still consumes gradients in the parameter shapes."}</Prose>

<H3>{"Which data may change parameters, choose a setting or assess it?"}</H3>

<Prose>{"Before reading results, follow the experiment's three separate roles. Only fitting examples supply update gradients; validation chooses a declared scale; assessment reports the chosen setting."}</Prose>

<OptimizerDataRolesDrawing/>

<Prose>{"The split contains 240 fitting images, 80 validation images and 80 assessment images. Source identifiers and complete pixel signatures are distinct across these roles. The arrows from fitting reach parameter updates; the arrows from validation reach scale selection; assessment produces a report without returning a tuning arrow. The subset originally came from UCI's historical test file, so this classroom partition is not the official UCI train/test benchmark. Writer identities are unavailable, and related data have appeared in earlier lessons. These boundaries make it useful mechanism evidence, not a new untouched recognition benchmark."}</Prose>

<Prose>{"The declared grid has two scales and two seeds for each of six recipes: constant AdamW, warmup/cosine AdamW, Lion, Sophia-G, paper Prodigy and Schedule-Free AdamW. Six recipes × two scales × two seeds give all 24 retained fits. A given seed uses the same initial parameters and minibatch sequence across recipes. Every candidate runs 400 updates, with batches of 64 fitting examples sampled with replacement, no early stopping, augmentation or decay. Seeds are 11 and 29."}</Prose>

<NeuralTable caption={"Which data may change parameters, choose a setting or assess it?"} headers={[<>{"Recipe"}</>,<>{"Two declared candidate scales"}</>,<>{"Other declared behavior"}</>]} rows={[[<>{"Constant AdamW"}</>,<>{".01, .03"}</>,<>{"Constant supplied rate"}</>],[<>{"Warmup/cosine AdamW"}</>,<>{".01, .03"}</>,<>{"20-update warmup; cosine reaches zero at 400"}</>],[<>{"Lion"}</>,<>{".003, .01"}</>,<>{"Constant supplied rate; original blend coefficients"}</>],[<>{"Sophia-G"}</>,<>{".01, .03"}</>,<>{"Batch-scaled sampled estimator refreshed at 1,11,…,391"}</>],[<>{"Paper Prodigy"}</>,<>{".3, 1"}</>,<>{"Rate multiplier γ; complete adapting-scale state"}</>],[<>{"Schedule-Free AdamW"}</>,<>{".01, .03"}</>,<>{"20-update warmup; evaluate at averaged x"}</>]]} />

<Prose>{"Sophia performs forty additional model-sampled gradient evaluations per fit, at the same parameters as each corresponding true-label gradient. Equal updates therefore do not mean equal gradient work. There are no CPU/GPU timing measurements in this experiment. Two candidate values per recipe are equally numerous, but not necessarily equally effective tuning grids."}</Prose>

<Prose>{"Select one scale per recipe by its "}<strong>{"mean final validation cross-entropy across the two seeds"}</strong>{", then report both selected runs on assessment. All candidate curves and all twelve selected states remain available, including unfavorable outcomes. Do not choose a different scale after looking at assessment or erase a difficult seed."}</Prose>

<H3>{"What did the recorded curves show?"}</H3>

<Prose>{"Which differences belong to loss, and which to decisions? The measured histories and selected outcomes use separate, explicitly labelled quantities."}</Prose>

<OptimizerHistoryFlow/>

<Prose>{"The curve joins connect recorded loss values at their actual optimizer updates. They are not additional measurements or a smoothed claim of continuous improvement. The candidate selector keeps both scales available; the axis states whether it is linear or logarithmic. A different selected curve changes the evidence being inspected, not the browser's training state. Below, the table records assessment loss and correct decisions for the twelve chosen runs."}</Prose>

<NeuralTable caption={"What did the recorded curves show?"} headers={[<>{"Selected method"}</>,<>{"Scale"}</>,<>{"Assessment cross-entropy, seeds 11 / 29"}</>,<>{"Correct out of 80, seeds 11 / 29"}</>]} rows={[[<>{"AdamW, constant"}</>,<>{".03"}</>,<>{".06075 / .05581"}</>,<>{"80 / 80"}</>],[<>{"AdamW, warmup + cosine"}</>,<>{".03"}</>,<>{".09489 / .09190"}</>,<>{"79 / 80"}</>],[<>{"Lion"}</>,<>{".003"}</>,<>{".09008 / .08580"}</>,<>{"78 / 78"}</>],[<>{"Sophia-G, paper-scaled estimator"}</>,<>{".01"}</>,<>{".02786 / .02523"}</>,<>{"79 / 79"}</>],[<>{"Prodigy, paper Algorithm 4"}</>,<>{"1"}</>,<>{".03591 / .04906"}</>,<>{"79 / 79"}</>],[<>{"Schedule-Free AdamW, evaluated at x"}</>,<>{".03"}</>,<>{".07985 / .08085"}</>,<>{"79 / 80"}</>]]} />

<Prose>{"A constant-class decision gives 8/80 correct, and a uniform probability allocation gives loss ln(10)≈2.30259. All chosen models learned useful structure on this partition. Constant AdamW gets all these labels right, while Sophia's probabilities produce lower mean cross-entropy despite one wrong decision per seed. Accuracy counts which decision crossed a boundary; cross-entropy also cares about the probability allocation. The practice section supplies changed examples to calculate that distinction."}</Prose>

<Prose>{"The eighty assessment images cannot establish a universal optimizer winner. The validation partitions also expose different cases: Prodigy's final validation losses are .41470 and .49441, while Schedule-Free's are .19111 and .19220. Good assessment values do not authorize returning to tune on that partition."}</Prose>

<H3>{"Inspect the state quantity that each method actually controls"}</H3>

<Prose>{"Do all curves called “scale” mean the same thing? Read Prodigy's retained d, Sophia's clipping fraction and Schedule-Free's representation separately."}</Prose>

<OptimizerHistoryFlow view="state"/>

<Prose>{"Prodigy's final selected d values are .07640 and .09739. These are not ordinary AdamW learning rates; they enter the scaled histories and update we already traced. Sophia's final clipped fractions are about .03385 and .06, measuring how many transformed coordinate ratios exceeded the clipping limit, not how many examples were classified correctly. Schedule-Free's validation loss at x versus y is .19111 versus .19281 for seed 11 and .19220 versus .18660 for seed 29. The training representation y happens to win the second diagnostic. We still report x as the declared evaluation model."}</Prose>

<Prose>{"As a separate calculation on the earlier source 277, setting pixel 28 (row 3, column 4) from raw 0 to 16 and retaining its class-0 target gives AdamW class-0 probability approximately .97019 before the diagnostic update and .97777 afterward. Every other pixel and all saved parameters still contribute. The following investigation switches to source 312 so that the learner can explore a fresh input; one diagnostic update alone is not evidence of improved generalization."}</Prose>

<H3>{"What happens when one actual input changes?"}</H3>

<Prose>{"Can the saved model expose a current learning decision without another fit? The live picture starts with source 312 and its pixel 28 changed from the recorded raw 0 to 16, using the complete saved AdamW seed11 state; all other pixels keep their recorded values."}</Prose>

<OptimizerDigitFlowLab view="image"/>

<Prose>{"The fresh live case instead uses source 312. At pixel 28=16, its retained AdamW class-0 probability changes from .9959764253640799 to .9961295551626631. The difference is small, so the main probabilities stay on [0,1] and a separately labelled enlarged delta axis exposes the change honestly. Select any of the twelve snapshots or any of the 64 pixels; current inference uses the actual complete map, never an invented confidence formula."}</Prose>

<H3>{"The diagnostic target changes the objective, not source truth"}</H3>

<Prose>{"What changes if we choose another class to learn toward? Hold the input and initial snapshot fixed, change the temporary target and inspect all ten residuals."}</Prose>

<OptimizerDigitFlowLab view="target"/>

<Prose>{"The initial probabilities stay fixed because their forward route does not read the target. The gradient changes, and the optimizer's stored history can affect which after-update probabilities rise or fall. No rule forces the selected target probability to increase for every retained state and rate. Keep the source's recorded truth labelled separately; a temporary diagnostic target is not a relabelled dataset or another reported fit."}</Prose>

<H3>{"The copied optimizer state matters as much as its name"}</H3>

<Prose>{"Which histories enter the next update? Follow the selected coordinate through its actual current state and the complete resulting parameter array."}</Prose>

<OptimizerDigitFlowLab view="coordinate"/>

<Prose>{"Adam uses its current m,v and update count. Lion uses its stored signed memory. Sophia reads a smoothed curvature estimate; this one-example "}<strong>{"linear"}</strong>{" diagnostic refresh uses the exact expected-label diagonal, explicitly distinct from the sampled refresh in the fits. Prodigy keeps d, θ_0, m,v,s,r and the update count; attaching a fresh optimizer to old parameters would change its algorithmic state. Each coordinate display is a cutaway into the same complete 65×10 update."}</Prose>

<OptimizerDigitFlowLab view="representation"/>

<Prose>{"For Schedule-Free, the gradient is evaluated at y and the before/after reported inference uses x. Its interpolation and second moment remain in the copied state. Changing a displayed representation must not silently swap the method's gradient route. Cosine AdamW is already at its frozen horizon 400: its next rate is zero. At update 401, parameters and predictions stay unchanged even though internal moments can still update. Preserve that informative null instead of restarting the schedule to make something move."}</Prose>

<OptimizerDigitFlowLab view="probabilities"/>

<Prose>{"The complete ten-class table contains initial probabilities, after-update probabilities and signed deltas. Pin the full input, temporary target, snapshot identity, state and result to compare another case. Reset restores the declared fresh case and all current views together. A download/loading failure retains edits and offers retry; a later successful load must compute the latest input rather than overwrite it with defaults. These calculations operate on a temporary copy and never alter the frozen fit, validation or assessment evidence."}</Prose>

<OptimizerStudyFlowActions/>

<H3>{"Build the same mechanism from complete scratch code"}</H3>

<Prose>{"How do the equations become an experiment we can reproduce? The complete NumPy update-rule file owns the state transitions; the study file supplies the actual model, data roles and training loop."}</Prose>

<OptimizerFlowProgram file="optimizer_rules.py" title="Complete runnable optimizer_rules.py"/>

<Prose>{""}<code>{"Optimizer"}</code>{" copies the initial float64 parameter array and allocates only the histories required by the chosen rule. Its "}<code>{"step"}</code>{" method accepts a parameter-shaped gradient and, for Sophia refreshes, a separately computed curvature estimate. The method returns diagnostics while retaining its persistent state. "}<code>{"evaluation_parameters()"}</code>{" returns x for Schedule-Free and the actual parameter array otherwise. The vectorized arithmetic is O(P) per ordinary update for P parameters; it does not construct a full P×P Hessian. The explicit class favors inspectability over fused GPU kernels or framework parameter-group features."}</Prose>

<Prose>{"The same file's stable softmax, gradient and metric functions implement the full linear classifier. The metrics compute cross-entropy from log-sum-exp instead of taking the logarithm of a probability that might underflow to zero. The mean-gradient reduction matches the mean loss. Preserving those conventions matters when replacing the model or increasing its batch size."}</Prose>

<OptimizerFlowProgram file="optimizer_study.py" title="Complete runnable optimizer_study.py"/>

<Prose>{"The study imports those exact update rules. It reads "}<code>{"digits-400.csv"}</code>{", separates declared roles, generates common initial arrays/minibatches by seed, performs all 24 fits and selects scales only from validation. Its JSON snapshots retain full parameters and histories, rather than a method name plus an accuracy. This is the reusable boundary: change the experiment around a documented optimizer interface; do not copy subtly different recurrences into each training loop."}</Prose>

<Prose>{"To reproduce in a separate local working directory, download the data and complete programs from the file index. Create and activate an environment using its platform's normal activation command, install NumPy, then run the study:"}</Prose>

<CodeBlock language={"text"}>{"python -m venv .venv\npython -m pip install numpy==2.3.5\npython optimizer_study.py"}</CodeBlock>

<Prose>{"The recorded environment was Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu. The study prints twelve selected assessment records and writes all candidate histories to "}<code>{"study-results.json"}</code>{" plus complete selected states to "}<code>{"fitted-optimizer-states.json"}</code>{". The provenance documents attribution, source identifiers and transformations. Those output files are experiments to generate in your own working directory, not instructions to overwrite the retained site's evidence."}</Prose>

<OptimizerFlowProgram file="optimizer_calculations.py" title="Complete runnable optimizer_calculations.py"/>

<Prose>{"The complete calculation program checks the worked and fresh trajectories, curvature enumeration, retained model edits and native AdamW comparison. It needs the saved study files and PyTorch as well as NumPy. The newer HVP supplement supplies an independent operator route for the deeper curvature branch:"}</Prose>

<OptimizerFlowProgram file="optimizer-curvature-instruments.py" title="Complete runnable optimizer-curvature-instruments.py"/>

<Prose>{"Its "}<code>{"hessian_vector"}</code>{" returns a numerical product from a fresh differentiable loss; "}<code>{"finite_difference_product"}</code>{" obtains a separate gradient-difference estimate. The nonlinear classifier function returns the analytic Gauss–Newton and residual contributions. Run the complete file to inspect the labelled comparisons. Its checks include arbitrary non-sign probes and an exactly zero Hessian, not just the same hand case transcribed into two functions. This supplement uses autograd as a differentiable primitive, while implementing the HVP construction and analytic decomposition explicitly; it is not importing an unexplained optimizer as its scratch solution."}</Prose>

<H3>{"Use all four optimizer APIs, then resume the same process"}</H3>

<Prose>{""}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/optimizer_rules.py"}>{"optimizer_rules.py"}</a>{" owns the complete scratch update for each named method, including its persistent arrays. The real digit experiment above uses those rules. The next program provides a second capability: taking control of the ordinary optimizer objects people put into a PyTorch loop. It keeps the objective and initial weight matrix fixed across methods, but it is an eight-update API study, not a ranking of optimizer quality."}</Prose>

<Prose>{"Use "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/optimizer_library_bridge.py"}>{"optimizer_library_bridge.py"}</a>{" beside "}<code>{"optimizer_rules.py"}</code>{". Its version targets are PyTorch 2.14.0, "}<code>{"prodigyopt==1.1.2"}</code>{" and "}<code>{"schedulefree==1.4.1"}</code>{". Install those packages in the lesson environment. For the other two, the exact original licensed author files are provided as "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/lion_pytorch.py"}>{"lion_pytorch.py"}</a>{" and "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/sophia.py"}>{"sophia.py"}</a>{", with their "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/LICENSE-lion.txt"}>{"Apache license"}</a>{" and "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/LICENSE-sophia.txt"}>{"MIT license"}</a>{". Place them beside the bridge. Their pinned upstream sources are: "}<a href={"https://raw.githubusercontent.com/google/automl/b21d6ced9bc9b748e1c8ab9fdebf2c44c57e63ae/lion/lion_pytorch.py"}>{"Google's pinned Lion source"}</a>{" as "}<code>{"lion_pytorch.py"}</code>{", and "}<a href={"https://raw.githubusercontent.com/Liuhong99/Sophia/2fc52f24d4bc008658111b0237a70953ada22398/sophia.py"}>{"the pinned Sophia source"}</a>{" as "}<code>{"sophia.py"}</code>{". Preserve their license notices. These are explicit imported dependencies, not unnamed implementations the learner has to invent. Run the program with "}<code>{"--method lion"}</code>{", "}<code>{"--method sophia"}</code>{", "}<code>{"--method prodigy"}</code>{", or "}<code>{"--method schedule_free"}</code>{"."}</Prose>

<Prose>{"The state map explains which equivalence we can legitimately claim:"}</Prose>

<NeuralTable caption={"Use all four optimizer APIs, then resume the same process"} headers={[<>{"Scratch quantity"}</>,<>{"Package quantity/control"}</>,<>{"Comparison boundary"}</>]} rows={[[<>{"Lion m and two β values"}</>,<>{""}<code>{"exp_avg"}</code>{", "}<code>{"betas=(.9,.99)"}</code>{""}</>,<>{"Same gradient, initialization, decay and rate give matched parameters and momentum; the program checks every update"}</>],[<>{"Sophia sampled curvature EMA of B times squared mean gradient"}</>,<>{""}<code>{"hessian"}</code>{" stores the unscaled squared-gradient EMA; "}<code>{"step(bs=B)"}</code>{" supplies B"}</>,<>{"Multiply once. "}<code>{"bs"}</code>{" counts terms in this mean cross-entropy, not the number of loader batches"}</>],[<>{"Prodigy d, initial weights, displacement history and moments"}</>,<>{"Group "}<code>{"d"}</code>{", "}<code>{"d0"}</code>{", "}<code>{"d_numerator"}</code>{", parameter "}<code>{"p0"}</code>{", "}<code>{"s"}</code>{", "}<code>{"exp_avg"}</code>{", "}<code>{"exp_avg_sq"}</code>{""}</>,<>{"The original package has implementation conventions beyond paper Algorithm 4; matching names does not imply identical trajectories"}</>],[<>{"Schedule-Free training y, evaluation x and fast z"}</>,<>{"Parameter buffer changes under "}<code>{"optimizer.train()"}</code>{"/"}<code>{".eval()"}</code>{"; z and second moment persist"}</>,<>{""}<code>{"model.eval()"}</code>{" alone does not select x. Evaluate and save the intended iterate"}</>]]} />

<Prose>{"For Sophia we refresh the estimate at the current parameters every second update, clear those sampled-label gradients, and calculate a fresh real-label gradient before "}<code>{"step"}</code>{". There is no accidental reuse of curvature-probe gradients as the training gradient. The package denominator adds an epsilon; the scratch rule uses a denominator floor. The difference matters near zero and is another reason not to promise bitwise identity. The scaling and method calls come from "}<a href={"https://github.com/Liuhong99/Sophia"}>{"the original Sophia implementation"}</a>{"."}</Prose>

<Prose>{"Prodigy settings deliberately expose bias correction, safeguard behavior, the initial distance and statistic subsampling. This route uses full statistics ("}<code>{"slice_p=1"}</code>{") and turns the first two options off, but still identifies its output as package behavior rather than relabeling it paper-Algorithm-4 parity. "}<a href={"https://github.com/konstmish/prodigy"}>{"Original Prodigy implementation"}</a>{". Schedule-Free 1.4.1 includes the post-1.3 warmup/decay behavior; the reference paper variant is a distinct class. Weight decay is zero in this small comparison. "}<a href={"https://github.com/facebookresearch/schedule_free"}>{"Author usage and release notes"}</a>{"."}</Prose>

<OptimizerFlowProgram file="optimizer_library_bridge.py" title="Complete runnable optimizer_library_bridge.py"/><OptimizerFlowProgram file="lion_pytorch.py" title="Complete pinned Lion library implementation"/><OptimizerFlowProgram file="sophia.py" title="Complete pinned Sophia library implementation"/>

<Prose>{"Each run saves model state, optimizer state, the next update index and CPU random state after update four, in the evaluation representation. It resumes from those states and checks the eighth evaluation against uninterrupted execution. The call to "}<code>{"optimizer.train()"}</code>{" then restores the training representation before computing a new gradient. Sophia's sampled labels make the random state part of the process. The code uses an in-memory checkpoint to keep the mechanism visible; the final diagnostics lesson supplies actual serialization and more complex data-order/scheduler restoration. The four routes were executed on CPU with PyTorch 2.14.0, Prodigy 1.1.2 and Schedule-Free 1.4.1, using the pinned Lion and Sophia sources above. Every uninterrupted/resumed pair had maximum final-logit difference 0. The final evaluation losses were .8761122277 (Lion), .8761122277 (Sophia), .9517085309 (Prodigy) and .9106840650 (Schedule-Free). These are the tiny bridge fixture’s eight-update outputs, separate from the measured digit study; they establish API/state behavior rather than an optimizer ranking."}</Prose>

<Prose>{"Updates for these dense single-model examples take O(P) optimizer arithmetic per update and method-specific O(P) persistent state for P parameters, as counted next. Sophia adds a forward/backward curvature pass on refresh updates. Prodigy's adaptation adds reductions, so an equivalent distributed implementation needs globally coherent statistics. This tiny program establishes neither GPU throughput nor distributed equivalence."}</Prose>

<Prose>{""}<strong>{"Take control."}</strong>{" Change the constructed objective to a class-weighted mean cross-entropy. Explain why passing the row count as Sophia's "}<code>{"bs"}</code>{" is no longer automatically a valid estimator correction. Separately remove only Schedule-Free's optimizer mode switch, and locate the first semantic error even if accuracy stays the same."}</Prose>

<details><summary>Hint and reasoned solution</summary>

<Prose>{"The B correction assumed B equally weighted independent sampled-label contributions averaged by B. Class weights alter both contributions and the denominator; reproducing the intended curvature requires deriving the estimator for that weighted objective, not substituting an arbitrary count. Keep the unweighted route as the checked baseline until that derivation is implemented. Without "}<code>{"optimizer.eval()"}</code>{", reported logits come from y rather than x; model dropout mode is a separate switch. A checkpoint saved in the wrong representation may also resume with inconsistent optimizer metadata. Compare logits, parameter buffers and optimizer state, not only rounded accuracy. For an independent implementation exercise, add an omission flag that removes only RNG restoration in the Sophia route; the expected failure is a changed subsequent sampled-label curvature history, not an obligatory accuracy decrease."}</Prose>

</details>

<H2>{"8. Count the resources you actually need"}</H2>

<Prose>{"The fitted models showed different update histories, but their loss curves did not measure memory or time. Now follow the arrays that must remain available between updates. This is a separate resource calculation, with hypothetical model size and explicit storage assumptions."}</Prose>

<H3>{"Which arrays persist after the gradient has been consumed?"}</H3>

<Prose>{"Can a smaller history make a model fit? Count complete parameter-sized arrays first, then identify who stores each one."}</Prose>

<OptimizerMemoryDrawing global ranks={1} allocations={[{name:'weights',total:140e9},{name:'gradients',total:280e9},{name:'optimizer buffers',total:560e9}]}/>

<Prose>{"Amber denotes the model's weights, orange its gradients and violet its optimizer buffers in this allocation drawing. These are distinct payloads. The hypothetical weights use BF16, two bytes per entry; the gradients use FP32, four bytes per entry. The third allocation uses the buffer count and entry width you choose. The bar's segments represent the calculated listed byte counts, not measured GPU memory or a guessed activation size."}</Prose>

<Prose>{"For P parameters and b bytes per entry, one full buffer contains Pb payload bytes. Two FP32 AdamW moments for 70 billion parameters therefore contain 70×10^9×2×4=560×10^9 bytes, or 560 decimal GB. One FP32 Lion moment contains 280 GB. BF16 weights separately contain 140 GB. Decimal GB divides bytes by 10^9; GiB divides by 2^30. Neither unit changes the number of saved entries."}</Prose>

<NeuralTable caption={"Which arrays persist after the gradient has been consumed?"} headers={[<>{"Method / stated implementation"}</>,<>{"Additional parameter-sized arrays beyond the current parameter buffer"}</>]} rows={[[<>{"AdamW without AMSGrad"}</>,<>{"Signed history m and second moment v: 2"}</>],[<>{"Lion"}</>,<>{"Signed history m: 1"}</>],[<>{"Sophia"}</>,<>{"Signed history m and curvature history h: 2"}</>],[<>{"Paper Prodigy reference here"}</>,<>{"m, v, displacement history s and initial parameters θ_0: 4"}</>],[<>{"Literal Schedule-Free teaching code"}</>,<>{"Average x, fast point z and second moment v: 3; current y is the main buffer"}</>],[<>{"Efficient Schedule-Free base implementation"}</>,<>{"z and v: 2; the main buffer changes between x and y"}</>]]} />

<Prose>{"The three mathematical Schedule-Free locations are not three *additional* arrays in every implementation. The literal code keeps their roles inspectable; the compact implementation reconstructs one representation in the main parameter buffer. Scalar counters are excluded from this table. AMSGrad, optional inner momentum, sliced Prodigy statistics, master weights or a redundant reference copy need their own accounting. Our saved NumPy arrays are float64: calling a method “AdamW” does not change their dtype to FP32."}</Prose>

<Prose>{"Change the parameter count, buffer count or entry width independently. The following controls recalculate these global payloads; their values do not specify activation memory."}</Prose>

<OptimizerMemoryFlowLab view="payload"/>

<H3>{"Who owns the payload on one device?"}</H3>

<Prose>{"Does doubling the device count halve every allocation? A rank is one participant that owns arrays in the distributed calculation. An array is replicated when every rank keeps it whole, and sharded when ranks keep different portions. Doubling the rank count halves only the evenly sharded arrays."}</Prose>

<OptimizerMemoryFlowLab view="ownership"/>

<Prose>{"Read each allocation's ownership label. With eight ranks and only optimizer buffers sharded, a rank retains the full 140 GB weight payload and 280 GB gradient payload, plus 560/8=70 GB of moment payload: 490 GB of these listed arrays. If all three allocations are evenly sharded, the sum is 980/8=122.5 GB. If all are replicated, each rank owns 980 GB. These simple counts deliberately omit padding, alignment and other allocations; they are not claims that a particular training strategy can use those exact per-rank totals."}</Prose>

<Prose>{"Activations, temporary workspaces, allocator behavior and possible master copies remain unspecified. Real peak memory requires measuring their lifetimes together. Optimizer arithmetic is usually O(P) for these elementwise rules, but Sophia's refresh adds a forward/backward pass and Prodigy's adaptation adds global reductions. A count of saved arrays alone cannot establish throughput."}</Prose>

<H3>{"Which detail does a factored history discard?"}</H3>

<Prose>{"Can two vectors stand in for a whole matrix? Inspect the original cells and the reconstruction before counting the saving."}</Prose>

<OptimizerFactorDrawing/>

<Prose>{"Switch from the 650-parameter classifier to this explicitly constructed 2×2 second-moment matrix V=[[1,3],[5,7]]. Its row means are [2,6], column means [3,5] and global mean 4. A separable reconstruction uses Ṽ_ij=row_i×column_j/global_mean. The four reconstructed cells are [[1.5,2.5],[4.5,7.5]]. Their row and column means match V's; individual cells do not. This is a rank-one approximation to the stored second moment, not an exact factorization of every matrix."}</Prose>

<Prose>{"The equivalent sum notation is Ṽ_ij=R_i C_j/Σ_i R_i, with row sums R and column sums C. Do not combine a row-*mean* formula with a column-*sum* formula: the normalizing factor belongs to the convention. For an all-zero nonnegative matrix the mathematical zero reconstruction is well defined by continuity, while practical optimizer implementations use their documented floors. This local reconstruction is only Adafactor's factorization branch; it does not implement its update clipping, changing decay or parameter-relative step size."}</Prose>

<OptimizerMemoryFlowLab view="shape"/>

<Prose>{"The violet rectangle keeps the actual n:m aspect ratio; its separators are schematic, and its dimension labels give the full count. The violet row and column strips each store one computed statistic per row or column; their orientation distinguishes the factors from the full matrix. A dense FP32 second moment uses 4nm bytes; those two factors use 4(n+m). At n=m=4096, the counts are 67,108,864 and 32,768 bytes. A one-row matrix does not automatically benefit: its two factors would store m+1 values versus m dense values. Vector/scalar parameters and optional first moments require separate decisions in the full method."}</Prose>

<OptimizerMemoryFlowActions/>

<Prose>{"The "}<a href={"https://proceedings.mlr.press/v80/shazeer18a.html"}>{"Adafactor paper"}</a>{" teaches the rest of that algorithm. Count the actual implementation's state and verify quality when using it; the factor formula establishes neither a universal accuracy cost nor a universal speed advantage."}</Prose>

<H3>{"Updates, work, traffic and elapsed time answer different questions"}</H3>

<Prose>{"What does “fewer steps” buy? Multiply steps by measured work or time before deciding."}</Prose>

<OptimizerWorkDrawing/>

<Prose>{"This constructed comparison has one method taking 600 updates at 1.1 time units each: total 660. Another takes 1000 at 1 unit: total 1000. Their total-time ratio is 1000/660≈1.515, while the first method's individual updates are slower. The numbers are a stated arithmetic example, not recorded optimizer timing. Tuning trials, failures, preprocessing and quality targets belong in the actual project-cost comparison too."}</Prose>

<Prose>{"Smaller optimizer state also does not automatically mean proportionally less communication. Data-parallel gradient reduction moves gradients; parameter all-gathers move parameter shards. Moments can remain local to their owner. Prodigy's shared adaptation statistics may themselves need reductions. Return to "}<a href={"/learn/path/full-curriculum/ring-attention-sequence-parallelism?module=deep-learning-fundamentals"}>{"Ring Attention & Sequence Parallelism"}</a>{" for the distinction between buffer size, ownership, transfers and overlap. For actual timing, use a representative workload, warmup, device-appropriate synchronization, repeated measurements and recorded hardware/software versions."}</Prose>

<H2>{"9. Choose a method by a question you can test"}</H2>

<Prose>{"We now know both the update mechanisms and the evidence their classroom experiment supplies. Choose a candidate by a diagnosed limitation, then collect evidence that could show the choice was wrong."}</Prose>

<NeuralTable caption={"9. Choose a method by a question you can test"} headers={[<>{"Observation"}</>,<>{"Candidate experiment"}</>,<>{"Evidence to collect"}</>]} rows={[[<>{"Persistent moment arrays dominate"}</>,<>{"Lion or a factored-state method"}</>,<>{"Actual steady/peak memory, matched quality, total tuning budget"}</>],[<>{"Coordinates require very different scales"}</>,<>{"Sophia or a suitable preconditioner"}</>,<>{"Curvature/clipping diagnostics and quality versus total work"}</>],[<>{"Repeated model scales make rate searches expensive"}</>,<>{"Prodigy with its exact implementation declared"}</>,<>{"All trials, d traces, failures and validation"}</>],[<>{"Useful stopping time is uncertain"}</>,<>{"Schedule-Free with explicit evaluation modes"}</>,<>{"Quality at predefined horizons, x/y handling, normalization statistics"}</>],[<>{"The baseline already trains well"}</>,<>{"Keep it as the paired reference"}</>,<>{"Same task and batches, useful comparisons and honest tradeoffs"}</>]]} />

<H3>{"Deeper: a matrix has directions that its entries alone conceal"}</H3>

<Prose>{"Why isn't an entrywise sign the only way to flatten scale? Compare how two actual matrix transformations act on the same vectors."}</Prose>

<MuonPolarDrawing/>

<Prose>{"Switch to the constructed matrix M=[[2,1],[1,2]]. Its two singular directions are proportional to [1,1] and [1,−1], with singular values 3 and 1. In a singular-value decomposition M=UΣVᵀ, Σ lists these magnitudes; U and V give the associated output and input directions. The ideal polar factor UVᵀ preserves those directions while flattening the nonzero singular values to 1. Here M is symmetric positive definite, so that polar factor is the identity."}</Prose>

<Prose>{"The other displayed transformation takes each entry's sign. All entries of M are positive, so it becomes [[1,1],[1,1]]. It sends [1,1] to [2,2] and [1,−1] to [0,0], erasing the latter direction entirely. The identity instead returns both vectors unchanged. The two plots use the same axes; concentric origin marks keep the zero vector visible. This comparison concerns matrix geometry, without taking a Hessian."}</Prose>

<Prose>{""}<strong>{"Muon"}</strong>{" applies a matrix-valued momentum transformation using finite approximate orthogonalization, commonly implemented through Newton–Schulz iterations. The exact SVD polar factor drawn here is an intuition for that branch, not the claimed output of a particular finite iteration or a complete Muon implementation. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.Muon.html"}>{"PyTorch 2.14's Muon API"}</a>{" specifies iteration coefficients, matrix-shape requirements and rate adjustment. A suitable companion update handles other parameter groups. Being two-dimensional does not by itself mean that a recipe treats embeddings like hidden weight matrices. Study the exact recipe, shapes, scaling and grouping before substituting the optimizer."}</Prose>

<H3>{"Diagnose the first changed operation, then design the comparison"}</H3>

<Prose>{"If loss jumps after switching optimizers, which observation narrows the cause? Begin with the actual objective and parameter change, rather than an optimizer's reputation."}</Prose>

<Prose>{"Keep the batch and loss reduction visible. Record gradient norm, update norm, parameter norm, rate, decay and current state at the first problematic update. A familiar rate may be inappropriate for the new transformation; a failure at one update alone does not identify why. For Lion, inspect the signed blend and ηλ. For Sophia, inspect refresh coherence and batch scaling before blaming curvature. For Prodigy, inspect r,s,d and overshoot before calling a slow start convergence. For Schedule-Free, identify which parameter representation produced the reported metric. Use the exercises next to transfer these diagnoses to changed examples."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice and transfer"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A different AdamW first step"}</H3>

<Prose>{"Use θ=[1,−2], g=[−3,6], η=.02, λ=.5, β₁=.9 and β₂=.999. Ignore ε only for this hand calculation. Find the corrected moments and next parameters. Would adding λθ to g first give the same rule?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first corrected moments recover g and g². Apply shrinkage independently of the normalized direction."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"m̂=[−3,6], v̂=[9,36], so the direction is [−1,1]. Shrink to [.99,−1.98], then obtain [1.01,−2]. Adding λθ to g would contaminate the moment calculation with the regularizer; it is not decoupled AdamW even if a particular first-step sign happens to agree."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Lion follows history"}</H3>

<Prose>{"Use θ=−.4, old m=−.3, g=2, β₁=.9, β₂=.99, η=.02 and λ=.1. Find the update and new momentum. What current g would make the blend zero in exact arithmetic?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Solve −.27+.1g=0 separately from the β₂ memory update."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The blend is −.07, so θ_next=−.4(.998)+.02=−.3792. New m=−.297+.02=−.277. The zero threshold is g=2.7. This threshold depends on the magnitude of the old memory; knowing only its sign is insufficient. Finite-precision implementations may place a mathematically exact decimal tie just to one side, which is why the worked zero-state null uses exact zero inputs."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Curvature is not the real-label gradient squared"}</H3>

<Prose>{"For a scalar logistic weight, x=3 and p=.25. Calculate the gradient squared for real label 1 and the expected squared gradient under a model-sampled label. Explain why the results differ."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The gradient is x(p−y). Enumerate y=0 and y=1 with their model probabilities."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"For label 1 the gradient is −2.25 and its square is 5.0625. The sampled expectation is .25(5.0625)+.75(.5625)=1.6875, equal to 9(.25)(.75). The first quantity reflects one observed residual; the second averages over the model's possible labels and isolates the logistic curvature."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. A curvature probe can disagree with the diagonal"}</H3>

<Prose>{"For H=[[4,−2],[−2,1]], calculate u⊙Hu for u=[1,1] and u=[1,−1]. What is their average? Does the negative sample prove H has a negative eigenvalue?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Multiply by H before multiplying elementwise by u. The two remaining sign probes duplicate these results."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The estimates are [2,−1] and [6,3]; their mean is [4,1]. H has eigenvalues 5 and 0, so it is positive semidefinite despite that negative sampled entry. An estimator's individual signs do not determine the matrix's eigenvalues."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Find the wrong Prodigy implementation"}</H3>

<Prose>{"An implementation computes ordinary Adam moments, estimates d from only the current displacement dot product, caps d at .003, and multiplies the ordinary Adam update by d. Is this paper Algorithm 4? Identify three repairs needed before presenting a comparison under that name."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Look at the histories, where d enters and which quantities persist across updates."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"No. The moments must accumulate dg and d²g²; numerator and vector denominator statistics have their own weighted histories; the stated paper rule takes a nondecreasing maximum without that arbitrary cap. The update's d/ε convention and old-versus-next state also need matching. A useful alternative algorithm can be studied, but it must be named and evaluated as that alternative."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Compute the model that will be evaluated"}</H3>

<Prose>{"Run the simple Schedule-Free SGD rule with x=z=−1, target 1, η=.2, β=.9 and perturbations [−.5,.5,1,−1]. Find x, z and the next training point after update 2; then find the gradient at update 3. How do the final averages differ for β=0 and β=1?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first update gives x=z=−.5. Remember that the gradient is evaluated at an interpolation, not necessarily at z."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"After update 2, z=−.3 and x=−.4. The next y is −.39 and the next gradient is −.39−1+1=−.39. After all four updates, x≈−.19456 for β=.9, −.208 for β=0 and −.193 for β=1. This tiny noise sequence does not make the commonly chosen .9 universally optimal."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Which resource saving did you measure?"}</H3>

<Prose>{"A matrix has shape 2048×1024. Compare a float32 dense second moment with two float32 row/column factors. Separately, a model has eight billion parameters and two float32 moments sharded evenly over eight ranks. How many decimal GB of moments belong to each rank? Does replacing two moments with one halve a gradient all-reduce?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use nm entries for the dense matrix and n+m for the factors. State payload and communicated payload are different objects."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The dense moment is 8,388,608 bytes; factors require 12,288 bytes. For the model, global moments occupy 64 GB and each ideal equal shard occupies 8 GB. One float32 moment would give 4 GB per rank under the same sharding. The gradient array is unchanged, so its all-reduce is not automatically halved. Account for the actual algorithm's collectives and other allocations."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Accuracy and loss disagree"}</H3>

<Prose>{"Classifier A assigns correct-label probabilities [.51,.99,.99,.99]; B assigns [.49,.999,.999,.999] on four binary examples. Which has more correct decisions, and which has lower mean cross-entropy? Why must optimizer selection state its objective?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use a .5 decision threshold and average the four negative logarithms."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A gets 4/4 correct, B gets 3/4. A's loss is about .17587; B's is about .17909, so A wins both for these inputs. Now replace A's three .99 probabilities by .90: its decisions remain 4/4 but its loss rises to about .24736, and B has the lower loss. The changed case shows the tradeoff; do not assume the first probability list must demonstrate it. Accuracy counts boundary decisions, while cross-entropy measures allocated probability throughout the set."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Design a comparison that can answer your question"}</H3>

<Prose>{"You can afford twelve small training runs and care about useful quality at both 200 and 400 updates. Compare a baseline with two alternatives. Specify data roles, tuning allocation, seeds, evaluation iterates, additional curvature work, reported metrics and a rule for failures. What would you refuse to infer from the result?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Three methods × two declared scales × two seeds use all twelve runs. Intermediate evaluation does not require a new fit."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"One defensible design fixes three disjoint data roles, two candidate scales and two seeds per method; uses common batches at each seed; reports both horizons; and selects scales by a prespecified validation criterion. It reports the defined evaluation iterate, actual extra gradient work and any failed run rather than replacing it after assessment. Assessment is reserved for selected settings. Twelve small runs cannot establish universal superiority, broad hardware speedups or robust performance on an unrelated large model. Different learning-rate grids or a different quality target may answer a different question."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"11. Reproduce the calculations"}</H2>

<Prose>{"The complete programs remain visible at the mechanisms they implement. Their Copy and Download controls carry the same code; the shared Code & supporting files index at the end collects the complete code catalogue. These contextual links supply the saved data, results, attribution and licenses. The pinned upstream source files retain their original licenses."}</Prose>

<OptimizerFlowSupportingFiles/>

<Prose>{"To run the digit study, keep "}<code>{"optimizer_rules.py"}</code>{", "}<code>{"optimizer_study.py"}</code>{" and "}<code>{"digits-400.csv"}</code>{" together in your own working directory. The study creates its own results and complete state files. The calculations then read those outputs. The library bridge needs the exact scratch rules, the pinned Lion/Sophia files and the versioned packages named above. The HVP supplement is independent of the saved digit fits. Data attribution and transformations are in the provenance document."}</Prose></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H2>{"12. References and other ways to learn"}</H2>

<Prose>{"These links support different parts of the lesson. The papers and executable local calculations carry the technical claims; external learning resources offer another presentation."}</Prose>

<ul><li>{""}<a href={"https://arxiv.org/abs/1711.05101"}>{"Loshchilov and Hutter: Decoupled Weight Decay Regularization"}</a>{", plus "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html"}>{"the versioned PyTorch AdamW documentation"}</a>{". Read for the regularization distinction and an exact implementation contract."}</li><li>{""}<a href={"https://arxiv.org/html/2302.06675v4"}>{"Chen et al.: Symbolic Discovery of Optimization Algorithms"}</a>{", especially the algorithm, tuning and limitations, with "}<a href={"https://github.com/google/automl/blob/master/lion/lion_pytorch.py"}>{"Google's Lion source"}</a>{". Useful after the one-coordinate trace; the paper also explains the search process and evaluated tasks."}</li><li>{""}<a href={"https://arxiv.org/html/2305.14342v4"}>{"Liu et al.: Sophia"}</a>{", method and estimator sections, with "}<a href={"https://github.com/Liuhong99/Sophia"}>{"the official implementation"}</a>{". Use the paper to check the sampled-label normalization; do not treat a package's batch default as a universal value."}</li><li>{""}<a href={"https://arxiv.org/html/2306.06101v3"}>{"Mishchenko and Defazio: Prodigy"}</a>{", especially Algorithm 4 and its distinction from the proved convex variants; "}<a href={"https://github.com/konstmish/prodigy"}>{"official package guidance"}</a>{" explains practical options and schedules. The executable classroom rule explicitly identifies its paper version."}</li><li>{""}<a href={"https://arxiv.org/html/2405.15682v2"}>{"Defazio et al.: The Road Less Scheduled"}</a>{", method, large-rate discussion and implementation concerns; "}<a href={"https://github.com/facebookresearch/schedule_free"}>{"official Schedule-Free repository"}</a>{" for current modes and options. The paper's theorem conditions deserve the same attention as its curves."}</li><li>{""}<a href={"https://slideslive.com/39024867/the-road-less-scheduled"}>{"The Road Less Scheduled, NeurIPS 2024 author presentation"}</a>{". An alternate video route after the x/y/z diagram. The recording page, title and conference attribution were checked; the recording was not watched or transcribed for this manuscript."}</li><li>{""}<a href={"https://en.d2l.ai/chapter_optimization/adam.html"}>{"Dive into Deep Learning: Adam"}</a>{". A ground-up article with algebra and code for the prerequisite averages. Its notation differs, and some surrounding “variance” wording is loose; distinguish the raw second moment as taught here. The article was read; its remote notebooks were not executed."}</li><li>{""}<a href={"https://proceedings.mlr.press/v80/shazeer18a.html"}>{"Shazeer and Stern: Adafactor"}</a>{". Follow the factored-state mechanism beyond a memory slogan. Optional momentum and tensor shapes change storage."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.Muon.html"}>{"PyTorch 2.14 Muon"}</a>{". A current matrix-update branch; inspect parameter groups, finite iterations and scaling before adapting a recipe. This lesson did not benchmark Muon."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"UCI Optical Recognition of Handwritten Digits"}</a>{", E. Alpaydin and C. Kaynak, "}<a href={"https://doi.org/10.24432/C50P49"}>{"dataset DOI"}</a>{", CC BY 4.0. The retained extract and classroom transformations are described in "}<a href={"/learn-assets/advanced-optimizers-lion-sophia-prodigy-schedule-free/data-provenance.md"}>{"data provenance"}</a>{"."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"13. What to learn next"}</H2>

<Prose>{"You can now locate a model's input, loss, gradient, parameter arrays and optimizer state; trace five update rules; identify their library conventions; and design a comparison whose results answer its stated question. Keep those boundaries when changing the model or hardware."}</Prose>

<Prose>{"The next "}<a href={"/learn/path/full-curriculum/neural-ode-continuous-depth-models?module=deep-learning-fundamentals"}>{"Neural ODEs & Continuous-Depth Models"}</a>{" lesson changes how model state evolves through depth. Our optimizer trajectories live in *parameter space during training*; a neural ODE evolves a model state during its forward computation. Both involve trajectories, but they are different objects with different derivatives and numerical decisions."}</Prose></section>
</div></OptimizerHistoryFlowProvider></AdvancedOptimizerStudyFlowProvider></OptimizerMemoryFlowProvider></OptimizerAveragingFlowProvider></OptimizerAdaptationFlowProvider></SophiaFlowProvider></AdvancedOptimizerFlowProvider>};
