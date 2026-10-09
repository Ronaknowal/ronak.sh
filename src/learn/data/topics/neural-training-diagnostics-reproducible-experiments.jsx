// Complete accepted eleven-section reading-flow design; current authored candidate.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {DiagnosticsCaseProviders} from '../../components/lesson-labs/DiagnosticsFlowState.jsx';
import {DiagnosticsRowView,DiagnosticsMeanView,DiagnosticsMovementView,DiagnosticsRateView,DiagnosticsSplitView,DiagnosticsScalerView,DiagnosticsNetworkView,DiagnosticsTinyView,DiagnosticsInterpolationView,DiagnosticsDependencyView,DiagnosticsActivationView,DiagnosticsQuantileView,DiagnosticsFiniteView,DiagnosticsJacobianView,DiagnosticsBatchView,DiagnosticsBufferView,DiagnosticsGraphView,DiagnosticsLinearView,DiagnosticsAggregationView,DiagnosticsVarianceView,DiagnosticsSavedView,DiagnosticsResumeView,DiagnosticsCpuView,DiagnosticsOmissionView,DiagnosticsRngView,DiagnosticsGroupView,DiagnosticsFloatingView,DiagnosticsStateView,DiagnosticsPinnedView,DiagnosticsFreshPairsView,DiagnosticsFreshSpreadView} from '../../components/lesson-labs/DiagnosticsFlowViews.jsx';
import {DiagnosticsRecordedProviders,DiagnosticsWineLossView,DiagnosticsWineAccuracyView,DiagnosticsWineRowView,DiagnosticsRecordedPairsView,DiagnosticsRecordedSpreadView} from '../../components/lesson-labs/DiagnosticsFlowRecorded.jsx';
export default {title:'Neural Training Diagnostics & Reproducible Experiments',readTime:'~85 min read + investigations, programs and practice',hasIntegratedGuide:true,content:()=> <div className="neural-lesson neural-lesson-neutral diagnostics-lesson lesson-flow"><DiagnosticsCaseProviders><DiagnosticsRecordedProviders>
<LessonIntro prerequisites={<>{"You should be able to follow a forward pass, a mean loss, a gradient and an optimizer update. The preceding "}<a href={"/learn/path/full-curriculum/mini-batches-training-loops-gradient-accumulation?module=deep-learning-fundamentals"}>{"Mini-Batches, Training Loops & Gradient Accumulation"}</a>{" develops that computation. "}<a href={"/learn/path/full-curriculum/bias-variance-tradeoff-learning-curves?module=classical-ml"}>{"Bias-Variance Tradeoff & Learning Curves"}</a>{" explains training versus held-out error. We refresh the particular pieces used here."}</>}>{""}<strong>{"Explore as you read."}</strong>{" Change a tiny training case, inspect gradients and actual parameter movement, then compare evaluation modes and checkpoint continuations. Later investigations use measured Wine runs to test what a selected comparison can establish."}</LessonIntro>
<Prose>{"A network has finished training. Its loss fell, its training accuracy reached 100%, and its predictions on new examples are disappointing. You can make it wider, change the learning rate or train longer. But which change would answer the question that matters: "}<strong>{"what is preventing useful learning?"}</strong>{""}</Prose>

<Prose>{"This lesson develops a way to answer that question with evidence. We will train a small classifier on real chemical measurements of wine, deliberately alter one part of its training, and inspect what changes. We will also interrupt training and reconstruct its next update. The goal is to make the next experiment informative before making it expensive."}</Prose>

<Prose opening="route">{"On a first pass, follow sections 1–4, read the main comparisons in sections 5–7, and finish sections 8–11, including the independent case file. The numerical gradient check and full checkpoint program are marked deeper branches: their examples are useful now, while their implementation detail can wait for a second reading. The complete offline programs and data are supplied with this lesson."}</Prose>

<H2>{"1. Start with the question and a known computation"}</H2>

<Prose>{"The preceding lesson traced this same three-row half-square computation in "}<a href={"/learn/path/full-curriculum/mini-batches-training-loops-gradient-accumulation?module=deep-learning-fundamentals#what-does-one-example-ask-the-parameter-to-change"}>{"What does one example ask the parameter to change?"}</a>{". If a loss stays unchanged, which of those operations should we inspect? Start with a computation small enough to know what should happen."}</Prose>

<Prose>{"Follow one row: input x=1 and target y=2 enter the prediction at weight w=0. The forward path and its backward contribution separate at the residual."}</Prose>

<DiagnosticsRowView/>

<Prose>{"Multiplying w by x gives prediction 0. Subtracting the target gives residual −2. Squaring and halving gives this row's loss 2. The orange dashed branch multiplies the residual by x, producing raw derivative contribution −2. Cyan denotes supplied values, amber the learned weight, violet computed values and orange the derivative path. In plots, colors distinguish the named series. Select another stable row ID and edit its actual x/y; the same operations update immediately."}</Prose>

<Prose>{"How do three rows become one objective and one derivative? Keep the two reductions separate: all row losses enter one sum, and all raw derivative contributions enter another."}</Prose>

<DiagnosticsMeanView/>

<Prose>{"At w=0 the three raw contributions are −2,0,−3. Their sum −5 divided by row count 3 gives gradient −5/3. The losses 2,0,.5 instead sum to 2.5, giving mean loss 5/6. Adding or removing the selected row changes both the contents and denominator. A zero contribution is still a row in the mean."}</Prose>

<Prose>{"For scalar prediction "}<InlineMath>{"\\hat y_i=wx_i"}</InlineMath>{", the mean half-squared objective and derivative are"}</Prose>

<div className="neural-equation"><MathBlock>{"L(w)=\\frac1N\\sum_i\\frac{(wx_i-y_i)^2}{2},\\qquad\ng=\\frac1N\\sum_i(wx_i-y_i)x_i."}</MathBlock></div>

<Prose>{"The Loss Functions lesson's ordinary MSE has derivative 2 times the residual. Halving that objective halves its derivative too. The denominator defines the objective, as in "}<a href={"/learn/path/full-curriculum/mini-batches-training-loops-gradient-accumulation?module=deep-learning-fundamentals#what-is-one-unit-of-influence"}>{"What is one unit of influence?"}</a>{". The fixed prose numbers trace the initial case; edited drawings and live readouts trace your current values. Reset returns to that initial computation."}</Prose>

<Prose>{"Does having a derivative establish that the parameter moved? The called and omitted branches receive the same w, g and supplied learning rate η=.1."}</Prose>

<DiagnosticsMovementView/>

<Prose>{"The called branch multiplies .1 by −5/3 and subtracts that signed step from 0, giving wafter=1/6. The omitted branch has no update operation, leaving 0. Backward fills a derivative; SGD performs the movement. At a stationary point or rate 0, a correctly called step can also leave the weight unchanged. Construct a known nonstationary case before treating unchanged movement as evidence of an omitted step. Pin a complete baseline, then change rows/weight/rate; its copied inputs and result remain fixed until restored or cleared."}</Prose>

<DiagnosticsPinnedView/>

<Prose>{"A diagnostic observation names a measured quantity and where it was taken. A diagnosis explains it. Here nonzero gradient with unchanged weight suggests inspecting actual step execution, optimizer parameter identities and rate. Those hypotheses make different predictions, so the next check can discriminate them."}</Prose>

<Prose>{"Use observation → competing hypotheses → minimal intervention → measurement, including nulls → bounded inference. Minimal means the question is isolated, not that every experiment has only two lines. Numeric scales depend on objective, reduction, parameterization, dtype and data units; there is no universal good-loss or bad-gradient threshold."}</Prose>

<Prose>{"The scratch source computes row predictions, residuals, half-square losses and raw contributions, then two separate means. Its work is O(N). Retaining all row operands costs O(N) space for teaching; aggregate sums alone can stream in O(1) extra space. Parameter measurements copy before-values rather than comparing two aliases. Intended −ηg and represented after−before are reported separately: a tiny represented nonzero movement is not declared mathematically zero by an arbitrary display threshold."}</Prose>

<Prose>{"Deeper branch: why can a changed rate preserve or increase loss? The curve is the exact calculated scalar objective, with the current and next parameter positions shown."}</Prose>

<DiagnosticsRateView/>

<Prose>{"For these three rows, expanding the half-squares gives L(w)=(14w²−10w+5)/6. Its curvature A=14/3 and optimum w*=5/14. A step scales the distance from the optimum by 1−ηA. Starting at 0, rate .1 gives 1/6 and loss 67/108, below 5/6. Rate 0 leaves the point; rate 3/7=2/A moves to the opposite side with the same loss; rate .5 increases it. These are properties of this quadratic, not a universal network-rate rule."}</Prose>

<div className="neural-equation"><MathBlock>{"L(w-\\eta g)-L(w)=-\\eta g^2+\\tfrac12\\eta^2Ag^2."}</MathBlock></div>

<Prose>{"For g≠0 this quadratic descends when 0<η<2/A. At g=0 every rate produces the same mathematical point. A stationary null and a zero-rate null therefore have different causes."}</Prose>

<H2>{"2. Inspect what each row and each split means"}</H2>

<Prose>{"The real-data question is whether 13 chemical measurements distinguish wines derived from three cultivars. The "}<a href={"https://archive.ics.uci.edu/dataset/109/wine"}>{"UCI Wine dataset"}</a>{" contains 178 observations from one Italian region; Aeberhard and Forina provide the dataset under CC BY 4.0. This is a cultivar classification exercise, not a prediction of quality or a general claim about future wine production. Our "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv"}>{"offline CSV"}</a>{" is the scikit-learn 1.9.1 copy, with an explicit original row ID and target labels changed from 1–3 to 0–2. "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/data-provenance.md"}>{"Provenance"}</a>{" records the transformation and attribution."}</Prose>

<Prose>{"Can shape alone establish a valid learning example? Inspect an actual row and its information permissions before trusting the training computation."}</Prose>

<DiagnosticsSplitView/>

<Prose>{"The ID and target sit outside the 13-feature input bracket. Actual row IDs occupy disjoint 72/36/70 role groups. Only training rows feed scaler fitting and weight fitting; the fixed training-derived transform is applied to other roles. Validation informs development; the reserved test has no score here. Follow an ID and target together rather than inferring alignment from a matrix shape."}</Prose>

<Prose>{"One CSV row begins "}<code>{"0,0,14.23,1.71,..."}</code>{": row ID 0, target class 0, then chemical features. Row ID is an audit key, not a model input. The target is also excluded from the 13 input columns. Before fitting, inspect actual rows together with their targets, shapes, feature ranges and class counts. A shape such as "}<code>{"[72, 13]"}</code>{" tells you how many entries exist; it cannot tell you whether the label beside a row belongs to that row."}</Prose>

<Prose>{"Our fixed "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/split.json"}>{"split file"}</a>{" has 72 training rows, 36 validation rows and 70 reserved test rows. Within each class, a seeded permutation selects 24 training rows and 12 validation rows; the rest are reserved. The training and validation sets therefore each have equal class counts. This intentionally small training set makes failure inspection manageable. The split ID lists, rather than just a seed, identify membership unambiguously."}</Prose>

<Prose>{"The sets have different jobs:"}</Prose>

<NeuralTable caption={"2. Inspect what each row and each split means"} headers={[<>{"Set"}</>,<>{"Information it supplies"}</>,<>{"What we do with it here"}</>]} rows={[[<>{"Training"}</>,<>{"Examples the optimizer is allowed to learn from"}</>,<>{"Fit feature scaling and weights; run small-data diagnostics"}</>],[<>{"Validation"}</>,<>{"Feedback for development decisions"}</>,<>{"Compare fixed interventions and inspect curves"}</>],[<>{"Test"}</>,<>{"A final evaluation after the development procedure is fixed"}</>,<>{"Reserve all 70 rows; report no test score in this lesson"}</>]]} />

<Prose>{"What operation turns a raw chemical measurement into the model input? Trace row 5 through the training-fitted mean and population standard deviation."}</Prose>

<DiagnosticsScalerView/>

<Prose>{"Subtract the training-only feature mean, then divide by its population standard deviation. The same fitted constants transform training and validation. Each of the 13 feature coordinates has its own constants. Refitting a matching scaler after changing raw units differs from multiplying an already standardized input by 100; the latter changes the model input scale. For row 5 alcohol, raw 14.2 minus training mean 13.1204166667 gives 1.0795833333; dividing by population SD .8253121253 gives 1.3080909637. These values come from the retained CSV and training IDs. The other twelve coordinates follow the same operation with their own constants."}</Prose>

<Prose>{"For feature "}<InlineMath>{"j"}</InlineMath>{", compute the training mean "}<InlineMath>{"\\mu_j"}</InlineMath>{" and population standard deviation "}<InlineMath>{"s_j"}</InlineMath>{", then transform every split by "}<InlineMath>{"(x_j-\\mu_j)/s_j"}</InlineMath>{". Validation does not fit a separate scaler. If deployed inputs will arrive from a new producer, time period or instrument, that deployment boundary should determine the split; the supplied random split lacks those grouping and time identifiers."}</Prose>

<Prose>{"Check the data interface before diagnosing optimization. Do transformations preserve row/target alignment? Do missing values, units and target encodings match the loss? Are augmentations label-preserving for this task? Do the same person, image, recording or source object appear on both sides of a split? Can a training-only feature accidentally reveal the answer? These checks inspect the meaning of the inputs, not merely whether the library accepts them."}</Prose>

<Prose>{"Where do those 13 features go? The measured model has 13 inputs,32 tanh units and 3 logits; a separate constructed neuron reveals one operation."}</Prose>

<DiagnosticsNetworkView/>

<Prose>{"The architecture widths describe known shapes, without inventing retained hidden activations. In the constructed neuron, inputs [1,2], weights [.5,−1] and bias .25 give products .5/−2, sum −1.5 and preactivation −1.25; tanh produces approximately −.848284. Every hidden unit has 13 input connections; each of 3 outputs has 32 hidden connections. Repeated wires are omitted explicitly. Ordinary nn.Linear stores output-by-input weights. The Loss Functions lesson explains how softmax probabilities sum to 1 and the target index selects−log probability."}</Prose>

<Prose>{"For our three-class cross-entropy, a deliberately uniform prediction has loss "}<InlineMath>{"-\\log(1/3)=\\log 3\\approx 1.098612"}</InlineMath>{" nats per example. The natural logarithm fixes the unit. This is a reference for uniform logits with hard labels and no extra loss terms; our randomly initialized network need not predict exactly uniformly. A constant prediction of any one class gets 12/36 validation examples correct because this validation set is balanced. These explicit references are more useful than calling an unexplained initial loss “too high.”"}</Prose>

<H2>{"3. Make a small case learn before interpreting a large run"}</H2>

<Prose>{"The small-data check asks a precise question: can the defined model and loop fit a few fixed, inspected training examples under conditions that make fitting feasible?"}</Prose>

<Prose>{"Select examples with stable row IDs, disable stochastic augmentation and dropout, set explicit loss reduction, and temporarily remove regularization that intentionally resists memorization. Start from a recorded initialization and repeatedly use the same inputs. Include the classes relevant to the check. Inspect predictions as well as the scalar objective."}</Prose>

<Prose>{"Our tiny subset contains rows "}<code>{"17, 5, 18, 43, 124, 75, 103, 125, 143, 158, 173, 171"}</code>{": four examples per class. It uses the training-set transform above, a "}<code>{"13 → 32 → 3"}</code>{" network with tanh between the linear layers, and mean cross-entropy. We fixed SGD learning rate 0.05, momentum 0.9 and 120 updates before running it."}</Prose>

<Prose>{"Does a feasible inspected subset fit when the intended operation runs? Compare every recorded tiny-run checkpoint on the same loss axes."}</Prose>

<DiagnosticsTinyView/>

<Prose>{"The two runs begin with the same loss and derivative norm. Only the called run has first movement .06554148273831496. Its 121 retained points descend to .0007944487170047379 and 12/12; omitted step stays at 1.0620815286917848 and 6/12. The first recorded gradient 1.3108296547662988 is not a fabricated constant history. A passing tiny fit isolates this fitting problem; it does not establish useful held-out predictions."}</Prose>

<NeuralTable caption={"3. Make a small case learn before interpreting a large run"} headers={[<>{"Measured seed-7 run"}</>,<>{"Initial training loss"}</>,<>{"Loss after 120 attempts"}</>,<>{"Final training accuracy"}</>,<>{"First gradient norm"}</>,<>{"First parameter-change norm"}</>]} rows={[[<>{"Correct update"}</>,<>{"1.062082"}</>,<>{"0.000794"}</>,<>{"12/12"}</>,<>{"1.310830"}</>,<>{"0.065541"}</>],[<>{"Deliberately omit "}<code>{"optimizer.step()"}</code>{""}</>,<>{"1.062082"}</>,<>{"1.062082"}</>,<>{"6/12"}</>,<>{"1.310830"}</>,<>{"0"}</>]]} />

<Prose>{"Losses are evaluation-mode means on the same 12 examples; norms combine all parameter entries by the Euclidean norm. The correct run has already reached 12/12 at update 20, with loss 0.015172. Accuracy can stop changing while cross-entropy keeps rewarding more probability on the correct class."}</Prose>

<Prose>{"The omitted-step run is a complete controlled example of a broken learning process. It has a valid forward computation and nonzero derivatives. The measurements focus the next check on the transition from gradients to parameters: confirm the intended optimizer is called, its groups contain these parameter objects, and its learning rate permits movement. Increasing model size would not repair the omitted call."}</Prose>

<Prose>{"A failed small-data check calls for closer inspection, not a declaration that every network must reach zero loss. Identical inputs with contradictory hard targets, a model too restricted for the selected examples, deliberate regularization or a finite update budget can prevent exact fitting. A passed check establishes that this small fitting problem worked. Section 6 will show why its data meaning still needs inspection."}</Prose>

<Prose>{"Deeper branch: what makes finite interpolation possible? Draw two ReLU ramps and their response at the two distinct observed inputs."}</Prose>

<DiagnosticsInterpolationView/>

<Prose>{"At inputs 0 and 2, thresholds −1 and 1 give response rows [1,0] and [3,1]. Coefficients 2 and −7 produce 2 and −1. The triangular matrix has nonzero diagonal and determinant 1, so these two coefficients can solve any two targets at these distinct inputs. With duplicate input 0 and targets 2/−1 the response rows coincide, so a deterministic function cannot satisfy both. Existence of a representation is separate from convergence under the chosen optimization, regularization and finite budget."}</Prose>

<Prose>{"The same triangular idea extends to finitely many distinct scalar inputs sorted as t1<…<tn. Choose each ReLU threshold between the previous input and its own input, with the first threshold below t1. Earlier rows have zero response in later columns, and each diagonal response is positive. Solve the first coefficient from the first row, then each next coefficient after subtracting the contributions already determined. This is forward substitution through a lower triangular matrix with nonzero diagonal. For several feature dimensions, the construction first needs a projection that keeps the finite inputs distinct. It does not apply to contradictory targets on identical feature vectors, and it says nothing about unobserved targets."}</Prose>

<Prose>{"Use the shared scalar case from section 1 and its copied pinned baseline. Edit its rows or initial weight. Show correct and omitted updates side by side, including both the derivative and parameter change. Find a nonzero-gradient case, then construct a zero-gradient null. The immediate comparison explains why observing a gradient alone cannot establish that an optimizer step ran."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A missing update and a correct update at a stationary point can both leave the weight unchanged. Change the inputs so the reference gradient is known to be nonzero."}</Prose>

</details>

<details><summary>Explanation after trying</summary>

<Prose>{"With "}<InlineMath>{"x=[1,2]"}</InlineMath>{", "}<InlineMath>{"y=[1,0]"}</InlineMath>{", "}<InlineMath>{"w=0.5"}</InlineMath>{", the mean gradient is "}<InlineMath>{"(-0.5+2)/2=0.75"}</InlineMath>{". SGD at 0.1 changes the weight to 0.425. An omitted step leaves it at 0.5, although both runs can calculate gradient 0.75. With "}<InlineMath>{"x=[1,2]"}</InlineMath>{", "}<InlineMath>{"y=[1,2]"}</InlineMath>{", "}<InlineMath>{"w=1"}</InlineMath>{", the gradient is zero, so weight movement fails to distinguish the two. Choose a discriminating fixture before interpreting a null observation."}</Prose>

</details>

<H2>{"4. Follow the signals through the network"}</H2>

<Prose>{"Where does a discrepancy first enter the network? Follow the forward dependencies, then the separate accumulated-gradient and optimizer-identity path."}</Prose>

<DiagnosticsDependencyView/>

<Prose>{"A parameter participates in an executed weighted operation, which can connect through activation/logits/objective to backward. None is an absent slot; zero is a computed tensor; nonzero is another tensor value. A detached edge removes a dependency, an unused parameter has no executed route, and an optimizer holding an old parameter identity updates a different object. Copy values around the step and inspect which object the optimizer actually owns. A symptom table becomes useful after these paths are visible."}</Prose>

<Prose>{"The loss is the end of a chain. Instrument the earliest point where a comparison begins to disagree: decoded input, transformed features, pre-activations, activations, logits, per-item losses, gradients, then actual parameter changes. A *pre-activation* is the weighted sum before the nonlinear function; an *activation* is the output after it. Logging a small selected batch and layer is usually easier to reason about than collecting every tensor throughout a long run."}</Prose>

<Prose>{"At an update boundary, ask different questions of different quantities:"}</Prose>

<NeuralTable caption={"4. Follow the signals through the network"} headers={[<>{"Evidence"}</>,<>{"A useful next check"}</>]} rows={[[<>{""}<code>{"parameter.grad is None"}</code>{" after backward"}</>,<>{"Is this parameter meant to participate? Inspect "}<code>{"requires_grad"}</code>{", a detached intermediate, the executed branch and whether gradients were just cleared."}</>],[<>{"A gradient tensor exists but is all zero"}</>,<>{"Inspect the input and derivative along that path; compare a fresh known-nonzero case. A zero tensor is a computed value, unlike an absent buffer."}</>],[<>{"Gradients are finite and nonzero but parameters do not move"}</>,<>{"Compare parameter identities, optimizer groups, actual step execution, learning rate and update precision."}</>],[<>{"Loss or a gradient first becomes nonfinite"}</>,<>{"Find the first invalid intermediate and its operands, such as a zero denominator or an overflow; reproduce it on that batch."}</>],[<>{"One layer has a very different scale from its reference"}</>,<>{"Inspect the layer's role, feature units, initialization, nonlinear derivative and normalization state before changing all layers."}</>]]} />

<Prose>{"For a layer with weight vector "}<InlineMath>{"\\theta"}</InlineMath>{", record both "}<InlineMath>{"\\|g\\|_2"}</InlineMath>{" and "}<InlineMath>{"\\|\\Delta\\theta\\|_2"}</InlineMath>{". Plain SGD gives "}<InlineMath>{"\\Delta\\theta=-\\eta g"}</InlineMath>{"; momentum and adaptive optimizers use additional state. The ratio "}<InlineMath>{"\\|\\Delta\\theta\\|_2/\\|\\theta\\|_2"}</InlineMath>{", when the denominator is nonzero, describes change relative to that layer's current scale. Report the absolute change too; a zero or tiny denominator makes the ratio misleading. Compare layers and successive measurements in their context."}</Prose>

<Prose>{"Why can a local activation weaken a reverse contribution? Align tanh(z) with its local slope and draw the reverse multiplication."}</Prose>

<DiagnosticsActivationView/>

<Prose>{"At z 0, tanh 0=0 and slope 1, so an incoming derivative passes unchanged. At large absolute z, tanh approaches an endpoint and 1−tanh²(z) approaches 0. This local factor multiplies the incoming contribution. It does not by itself determine the full network gradient; earlier weights, paths and reductions still matter, as in Initialization and Backpropagation."}</Prose>

<Prose>{"Did a particular input-scale change move this actual layer toward those endpoints? Compare the retained absolute-tanh quantiles and mean local slopes."}</Prose>

<DiagnosticsQuantileView/>

<Prose>{"Both quantile strips use absolute activation 0..1. Seed 7 multiplier 1 has 10/50/90 quantiles .084979119/.403426374/.779463469; multiplier 100 has .999999798/1/1. Coincident endpoint labels remain separate. These are retained quantiles, not a histogram or full-network derivative measurement. The mean local slopes are .759643003 and .012283096."}</Prose>

<Prose>{"Consider a scale mismatch that multiplies already standardized inputs by 100. With the same initial seed-7 weights, the median absolute tanh activation changes from 0.403426 to 1.000000. Since"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{d\\tanh z}{dz}=1-\\tanh^2 z,"}</MathBlock></div>

<Prose>{"values near either endpoint transmit little derivative through the nonlinearity. The measured mean derivative across this first layer falls from 0.759643 to 0.012283. That supports a specific scale hypothesis: this input intervention drives many of these units into saturation. Input scaling, initialization and normalization are places to inspect because they determine the values entering that function."}</Prose>

<Prose>{"For ReLU, inspect which units are zero across the relevant examples and whether changing the examples activates them. A useful sparse representation can also contain many zeros. For normalization, inspect the statistics used in this execution: training-batch statistics or stored statistics, their axes, and whether evaluation data is updating them. An observation about one layer becomes useful when tied to its actual operation."}</Prose>

<H3>{"Deeper branch: check a derivative independently"}</H3>

<Prose>{"How can we obtain a derivative without trusting the same backward program? Two independently perturbed weights enter two fixed-state losses."}</Prose>

<DiagnosticsFiniteView/>

<Prose>{"For x [1,2], y [1,0], w .5, the loss is .3125 and derivative .75. Evaluate L(w+h) and L(w−h), subtract those two outputs and divide by 2h. The secant approaches the tangent locally. For this quadratic, the centered secant and tangent have the same slope .75. At h=.01 the secant sits .000125 higher; the lines are visually unresolved at the plotted scale. The centered derivative cancels the truncation terms exactly in real arithmetic; finite evaluation can still round. At displacement 1e−20 both represented weights can equal .5, yielding a false zero estimate. Near a ReLU kink at w=1e−5, displacement .001 gives symmetric slope .505 rather than the local right-hand slope 1."}</Prose>

<Prose>{"Automatic differentiation computes the derivative of the program you executed. If the program implements the wrong objective, an internally correct derivative can still optimize the wrong thing. For a custom loss or suspicious derivative, compare a tiny deterministic smooth calculation with a centered finite difference:"}</Prose>

<div className="neural-equation"><MathBlock>{"g_{\\mathrm{FD}}(w;h)=\\frac{L(w+h)-L(w-h)}{2h}."}</MathBlock></div>

<Prose>{"Take "}<InlineMath>{"x=[1,2]"}</InlineMath>{", "}<InlineMath>{"y=[1,0]"}</InlineMath>{", "}<InlineMath>{"w=0.5"}</InlineMath>{". The residuals are "}<InlineMath>{"[-0.5,1]"}</InlineMath>{", the mean half-squared loss is "}<InlineMath>{"(0.25+1)/4=0.3125"}</InlineMath>{", and its derivative is 0.75. This complete program checks the calculation:"}</Prose>

<CodeBlock language={"python"}>{"import torch\n\ntorch.set_default_dtype(torch.float64)\nx = torch.tensor([1.0, 2.0])\ny = torch.tensor([1.0, 0.0])\nw = torch.tensor(0.5, requires_grad=True)\n\ndef objective(weight):\n    return ((weight * x - y).square() / 2).mean()\n\nloss = objective(w)\nloss.backward()\nprint(f\"loss={loss.item():.6f}, gradient={w.grad.item():.6f}\")\nfor h in [0.01, 0.0001, 0.000001]:\n    estimate = (objective(w.detach() + h) - objective(w.detach() - h)) / (2 * h)\n    print(f\"h={h:g}, finite_difference={estimate.item():.9f}\")"}</CodeBlock>

<CodeBlock language={"text"}>{"loss=0.312500, gradient=0.750000\nh=0.01, finite_difference=0.750000000\nh=0.0001, finite_difference=0.750000000\nh=1e-06, finite_difference=0.750000000"}</CodeBlock>

<Prose>{"The "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/calculation-results.json"}>{"calculation record"}</a>{" retains unrounded estimates. The loss is quadratic, so centered differences are exact in real arithmetic here; the tiny discrepancies come from floating-point evaluation. For a general smooth function, truncation and rounding compete as "}<InlineMath>{"h"}</InlineMath>{" changes. Compare several meaningful step sizes in float64, keep the random draws and model state fixed, and inspect absolute as well as relative differences. At a ReLU kink there need not be a unique derivative for the symmetric difference to match. A small deterministic check is therefore a local diagnostic, with its points and conditions recorded."}</Prose>

<RemoteCodeBlock source={"/learn-assets/neural-training-diagnostics-reproducible-experiments/calculations.py"} language="python" filename="calculations.py" title="Complete runnable source: calculations.py"/>

<Prose>{" "}<a href={"https://cs231n.github.io/neural-networks-3/#gradcheck"}>{"CS231n's gradient-check notes"}</a>{" give a more detailed treatment of these pitfalls."}</Prose>

<Prose>{"Deeper branch: what does one direction omit? First derive the full two-input/two-output Jacobian of f(a,b)=(a²+3b,ab) at (1,2)."}</Prose>

<DiagnosticsJacobianView/>

<Prose>{"The outputs are (7,2). Differentiating each output gives rows (2,3) and (2,1), so J=[[2,3],[2,1]] with output rows/input columns. The first input column is (2,2); the first output reverse seed gives row (2,3). Input direction u=(1,−1) gives Ju=(−1,1); output seed v=(2,−1) gives vᵀJ=(2,5) and vᵀJu=−3. Adding the wrong matrix [[1,1],[0,0]] changes the full derivative but leaves that direction unchanged because 1−1=0. A fast two-evaluation directional agreement is useful evidence with a blind spot, not a certificate."}</Prose>

<Prose>{"For a sufficiently smooth objective, expand the two losses at the same point:"}</Prose>

<div className="neural-equation"><MathBlock>{"L(w\\pm h)=L(w)\\pm hL'(w)+\\frac{h^2}{2}L''(w)\n\\pm\\frac{h^3}{6}L'''(w)+\\frac{h^4}{24}L^{(4)}(w)+O(h^5)."}</MathBlock></div>

<Prose>{"Subtracting cancels the constant and even terms. Dividing by2h leaves L′(w)+h²L‴(w)/6+O(h⁴). The quadratic has no third or higher derivatives, so this truncation term vanishes there. Finite evaluation still subtracts nearby represented losses; rounding can be amplified as the denominator shrinks. Compare several displacements and both absolute and relative scale, rather than assuming the smallest h is best. Fixed random draws and copied state ensure that the two evaluations differ in the intended input only."}</Prose>

<Prose>{"The new scratch functions explicitly compute centered and directional differences. The ordinary bridge uses fixed-state float64 gradcheck on independently allocated smooth inputs and shows the full autograd Jacobian. A Tensor hook records a cloned gradient and is removed in finally; its return does not alter the gradient. Scoped anomaly detection helps locate invalid backward operations; an explicit first-nonfinite probe checks the supplied forward operands. Neither catches every incorrect finite objective."}</Prose>

<Prose>{"For the same two-layer initial arrays, the bridge reuses the earlier teaching-autodiff engine and compares logits, class-index loss, every parameter gradient and one SGD update with Torch. The earlier engine's weights are input-by-output; transpose them for F.linear and transpose their gradients back. This is one identical-state comparison, with no unrelated fitting or import of the eager Iris training program."}</Prose>

<H2>{"5. Evaluation behavior has two independent switches"}</H2>

<Prose>{"Can a forward pass change future behavior without an optimizer step? Start with the actual two-input normalization arithmetic."}</Prose>

<DiagnosticsBatchView/>

<Prose>{"Inputs 1/3 have mean 2, deviations −1/1 and squares 1/1. Divide their sum 2 by count 2 for population variance 1. Add epsilon 1e−5, take the square root, divide each deviation and apply learned γ1/β0. Outputs are approximately −.9999950000374997/.9999950000374997. The earlier Normalization lesson distinguishes these operations from updating remembered statistics."}</Prose>

<Prose>{"Suppose validation uses "}<code>{"with torch.no_grad():"}</code>{" but the model is still in training mode. Gradients are disabled. Dropout can still draw masks, and BatchNorm can still use the incoming batch and update its running statistics. This makes the evaluation procedure different from the intended one."}</Prose>

<Prose>{""}<code>{"model.eval()"}</code>{" selects module evaluation behavior. "}<code>{"torch.no_grad()"}</code>{" disables graph recording in its scope. Neither replaces the other. Standard validation usually uses both, followed by "}<code>{"model.train()"}</code>{" when training resumes. Evaluation with gradients enabled is useful for some analyses, so these controls are deliberately separate. "}<a href={"https://docs.pytorch.org/docs/2.9/notes/autograd.html#evaluation-mode-nn-module-eval"}>{"PyTorch's autograd notes"}</a>{" specify this distinction."}</Prose>

<Prose>{"Which statistics does the next forward use? Separate the saved-buffer branch from the current normalization branch."}</Prose>

<DiagnosticsBufferView/>

<Prose>{"Training forwards normalize by population variance 1 but the running-variance update uses sample variance 2, obtained by dividing the squared-deviation sum by count minus 1. Supplied momentum .1 combines old saved mean 0/variance 1 into new .2/1.1. Evaluation instead reads saved mean/variance and leaves them unchanged. Carrying returned buffers into the next starting state is an explicit process-state change, not a learned gradient update."}</Prose>

<Prose>{"For the depicted fresh saved state, the population-forward and sample-buffer branches are summarized by these running-statistic equations:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu_{\\mathrm{run,new}}=0.9(0)+0.1(2)=0.2,\\qquad\ns^2_{\\mathrm{run,new}}=0.9(1)+0.1(2)=1.1."}</MathBlock></div>

<Prose>{"These buffer updates occur even inside no-grad. Starting a fresh layer in evaluation mode instead uses the stored mean 0 and variance 1, and preserves them. The distinction between the two variance conventions is part of "}<a href={"https://docs.pytorch.org/docs/2.9/generated/torch.nn.BatchNorm1d.html"}>{"PyTorch's BatchNorm contract"}</a>{"."}</Prose>

<Prose>{"Does graph recording choose those statistics? Draw the derivative-recording path independently of the forward buffer branch."}</Prose>

<DiagnosticsGraphView/>

<Prose>{"Training/evaluation chooses the forward rule; graph enabled/no-grad chooses whether the result records a derivative route. Train plus no-grad still changes saved statistics. Eval plus graph enabled can still differentiate trainable γ/β. All four combinations below start from a fresh declared saved state, so previous rows do not silently mutate later rows."}</Prose>

<NeuralTable caption={"5. Evaluation behavior has two independent switches"} headers={[<>{"Fresh layer, same inputs"}</>,<>{"Output approximately"}</>,<>{"Stored mean after forward"}</>,<>{"Autograd graph with default trainable affine parameters"}</>]} rows={[[<>{""}<code>{"train()"}</code>{", gradients enabled"}</>,<>{"−0.999995, 0.999995"}</>,<>{"0.2"}</>,<>{"Recorded"}</>],[<>{""}<code>{"train()"}</code>{", no-grad"}</>,<>{"−0.999995, 0.999995"}</>,<>{"0.2"}</>,<>{"Not recorded"}</>],[<>{""}<code>{"eval()"}</code>{", gradients enabled"}</>,<>{"0.999995, 2.999985"}</>,<>{"0"}</>,<>{"Recorded"}</>],[<>{""}<code>{"eval()"}</code>{", no-grad"}</>,<>{"0.999995, 2.999985"}</>,<>{"0"}</>,<>{"Not recorded"}</>]]} />

<Prose>{"Why can a simpler model hide this defect? Send the same two inputs through a linear layer with weight 2 and bias 1."}</Prose>

<DiagnosticsLinearView/>

<Prose>{"Products 2/6 plus bias 1 give 3/7. There is no normalization buffer and no module-mode-dependent forward branch, so train/eval gives identical values here. Graph recording remains independent. Equal BN inputs yield zero normalized outputs in training; matching saved statistics can also produce matching numerical outputs without proving that modes were selected correctly."}</Prose>

<Prose>{"The table uses epsilon "}<InlineMath>{"10^{-5}"}</InlineMath>{" and the declared default trainable affine parameters. Change the two inputs, then independently inspect saved statistics, module mode and graph recording. Carry returned BN buffers as an explicit new starting state; a changed buffer is not silently clamped to its original control range."}</Prose>

<H2>{"6. Compare losses measured on comparable terms"}</H2>

<Prose>{"Are the joined scores means over the same units at the same time? Draw the sum/count reduction and the update timeline first."}</Prose>

<DiagnosticsAggregationView/>

<Prose>{"For supplied per-row CE values 1,3,8 nats, the whole-set sum 12 divided by 3 gives 4. Group means 2 and 8 averaged equally give 5, because the one-row group receives the same weight as the two-row group. Weighting them by counts gives(2×2+1×8)/3=4. CE selects−log probability of the supplied class, as taught in Loss Functions. An incoming batch loss before the update and a fixed-set evaluation after it sit at different timeline positions."}</Prose>

<Prose>{"A training-loop log often reports the loss of each incoming batch *before* its update, possibly with augmentation and dropout. A validation curve often uses the whole held-out set, *after* an update, without augmentation and in evaluation mode. Putting those values on one plot does not make the measurement protocols equal."}</Prose>

<Prose>{"For diagnosis, it helps to add a fixed training evaluation set and evaluate it with the same objective, reduction, transforms and module mode as validation. Keep the optimization loss separately when it includes regularization, class weighting, token masks or other terms. Label the horizontal axis: optimizer updates, examples or tokens processed, epochs, or measured time answer different comparison questions. Our curves use completed full-batch optimizer updates. Every measured point evaluates a fixed set in evaluation mode with no-grad and mean cross-entropy."}</Prose>

<Prose>{"Now return to the Wine classifier. Before executing, we fixed 400 updates for every full-data run and initialization seeds 3, 7 and 19. One treatment trains on the original 72 targets. The other permutes those targets once with a separately fixed seed, preserving their counts but disrupting correspondence with the chemical measurements. All other settings, features, split membership and validation targets remain the same."}</Prose>

<Prose>{"What does the actual fixed-set loss comparison show? Keep all 401 points and common axes for both treatments, with seed/update/scale directly below."}</Prose>

<DiagnosticsWineLossView/>

<Prose>{"Training supplied-target and original-validation CE have distinct labels. The clean late changes are visible on the common log range .0005..4; the common linear 0..4 view answers a different display question without changing the measurements. The ln 3 uniform-prediction line is a reference, not a claim that every random initial model is uniform. The selected update table reports values from the selected seed file."}</Prose>

<Prose>{"For seed 7, these recorded checkpoints tell the story:"}</Prose>

<NeuralTable caption={"6. Compare losses measured on comparable terms"} headers={[<>{"Completed updates"}</>,<>{"Clean training loss"}</>,<>{"Clean validation loss"}</>,<>{"Shuffled-target training loss"}</>,<>{"Shuffled-target validation loss"}</>]} rows={[[<>{"0"}</>,<>{"0.996250"}</>,<>{"0.982391"}</>,<>{"1.151504"}</>,<>{"0.982391"}</>],[<>{"20"}</>,<>{"0.034856"}</>,<>{"0.054630"}</>,<>{"1.010659"}</>,<>{"1.108418"}</>],[<>{"120"}</>,<>{"0.002550"}</>,<>{"0.016154"}</>,<>{"0.436862"}</>,<>{"1.285335"}</>],[<>{"400"}</>,<>{"0.000875"}</>,<>{"0.011259"}</>,<>{"0.029348"}</>,<>{"2.526364"}</>]]} />

<Prose>{"Which target does accuracy count? Compare supplied training targets and original validation targets on the same 0..1 fraction axis."}</Prose>

<DiagnosticsWineAccuracyView/>

<Prose>{"At 400 both treatments fit 72/72 supplied labels. Across seeds 3/7/19, shuffled validation is 11/15/14 correct of 36; the clean comparisons are 36/36. The separately controlled original-target training overlay asks another question about the same shuffled model. The constant-class baseline 12/36 uses balanced validation, not a general baseline for arbitrary class frequencies."}</Prose>

<Prose>{"At update 400 both models classify all 72 of their *supplied training labels* correctly. The clean model gets 36/36 validation rows correct. The shuffled-target model gets 15/36 correct. On the original labels of its training rows, that shuffled-target model gets only 22/72 correct. The meaning of “training accuracy” therefore depends on which target column you compare against."}</Prose>

<Prose>{"This is why looking at the examples and targets is part of training diagnosis. The shuffled run learns the supplied association very effectively. Inspecting row-to-target provenance and restoring the intended labels is the relevant intervention in this controlled case. Adding capacity could help it memorize the wrong associations even more readily."}</Prose>

<Prose>{"Which actual example contributes to that distinction? Inspect the selected final row with all 13 features, original/supplied targets and measured probabilities."}</Prose>

<DiagnosticsWineRowView/>

<Prose>{"The probabilities and predicted class belong only to retained update 400, even when the curve cursor is elsewhere. Target-index loss reads the probability at the named target coordinate. Sorting the complete table changes order without dropping correct or adverse examples; selection follows stable CSV ID. Treatment/role/row controls operate this final-row view, while seed/update/scale operate the curve question."}</Prose>

<Prose>{"Inspect one actual row rather than stopping at the aggregate. Training row 5 has original class 0, but the shuffled array supplies class 1. At update 400 the seed-7 shuffled model predicts class 1 with output probabilities "}<code>{"[0.094173, 0.861313, 0.044514]"}</code>{". The model has learned the label it was given. On validation row 120, whose class remains 1, it instead predicts class 0 with probability 0.999170; the probability assigned to class 1 is only 0.000155. A highly confident wrong answer directs attention to this example and its provenance. The "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine-results.json"}>{"retained row predictions"}</a>{" include every final training/validation row so you can inspect other errors without a cherry-picked example defining the conclusion."}</Prose>

<Prose>{"For an unfamiliar run, consider the following as competing questions rather than a lookup table:"}</Prose>

<NeuralTable caption={"6. Compare losses measured on comparable terms"} headers={[<>{"Observation under a specified evaluation protocol"}</>,<>{"Questions worth distinguishing"}</>]} rows={[[<>{"Both training and validation remain poor"}</>,<>{"Does the small case fit? Is the target meaningful? Are gradients and updates connected? Is the chosen representation sufficient?"}</>],[<>{"Training improves while validation worsens"}</>,<>{"Is the model fitting idiosyncrasies, corrupt labels, a different distribution or a mismatched evaluation procedure? Which inspection/intervention separates these?"}</>],[<>{"Validation looks better than training"}</>,<>{"Are training examples augmented, the training objective penalized, or dropout active only there? Are the sets equally difficult and metrics equally weighted?"}</>],[<>{"Both scores appear exceptionally strong"}</>,<>{"Are the split identities disjoint and the inputs free of target information? Do inspected errors and predictions support the reported score?"}</>]]} />

<Prose>{"Within this budget, the clean Wine runs show no late validation-loss rise. The shuffled-label treatment supplies the observed contrasting failure. The comparison is useful precisely because the diagnosis follows the recorded evidence: there is no reason to repair an overfitting pattern that the clean run did not exhibit."}</Prose>

<H3>{"The complete offline program"}</H3>

<Prose>{"Download "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine_diagnostics.py"}>{"wine_diagnostics.py"}</a>{", "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv"}>{"wine.csv"}</a>{" and "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/split.json"}>{"split.json"}</a>{" into the same directory, together with "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/experiment-protocol.md"}>{"experiment-protocol.md"}</a>{", which the program hashes as part of its record. With Python, NumPy and PyTorch installed, run:"}</Prose>

<CodeBlock language={"text"}>{"python -B wine_diagnostics.py"}</CodeBlock>

<Prose>{"The supplied program has all imports and inputs. "}<code>{"load_inputs"}</code>{" reads the CSV, keeps row identities separate and fits scaling only on training rows. "}<code>{"make_model"}</code>{" initializes the same architecture from the requested seed. "}<code>{"scores"}</code>{" selects evaluation mode and no-grad for each fixed-set measurement. "}<code>{"fit"}</code>{" chooses the training IDs and supplied labels, then records the current scores before performing another update. It stores the gradient norm after backward and the actual parameter-change norm around "}<code>{"optimizer.step()"}</code>{". "}<code>{"main"}</code>{" executes all eight predeclared runs and writes "}<code>{"wine-results.json"}</code>{" beside the program."}</Prose>

<RemoteCodeBlock source={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine_diagnostics.py"} language="python" filename="wine_diagnostics.py" title="Complete runnable source: wine_diagnostics.py"/>

<Prose>{"The central update is deliberately ordinary:"}</Prose>

<CodeBlock language={"python"}>{"model.train()\noptimizer.zero_grad(set_to_none=True)\nlogits = model(training_features)\nloss = nn.functional.cross_entropy(logits, supplied_targets)\nloss.backward()\nif treatment != \"omitted_update\":\n    optimizer.step()"}</CodeBlock>

<Prose>{"This excerpt is the fitted computation from the complete file; the surrounding record collection lets us test it. Full-batch updates keep data-order randomness out of this particular comparison. The next experiment introduces order deliberately."}</Prose>

<Prose>{"The programs were actually run with Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu, float64, one CPU thread and deterministic algorithms enabled. These are the recorded environment versions, not an instruction to seek a particular newest release. All eight result rows, all intermediate points and the environment are retained. Changing the program produces a new experiment; preserve the original record when comparing it."}</Prose>

<H2>{"7. Turn a promising observation into a controlled comparison"}</H2>

<Prose>{"Before trying a change, write a short experiment record. For the label experiment it reads:"}</Prose>

<Prose>{""}<strong>{"Observation:"}</strong>{" a falling training loss can coexist with poor held-out predictions. "}<strong>{"Hypothesis:"}</strong>{" broken feature–target correspondence allows memorization but removes the intended predictive relationship. "}<strong>{"Intervention:"}</strong>{" permute only training targets once; preserve class counts, split, features, model, budget and paired initialization seeds. "}<strong>{"Measure:"}</strong>{" training loss/accuracy against supplied and original targets, and validation loss/accuracy against original targets at fixed updates. "}<strong>{"Decision:"}</strong>{" if the shuffled run fits its supplied labels but loses validation performance, inspect label provenance before expanding the model."}</Prose>

<Prose>{"The prediction is made before looking at the outcome. The result is now available for all planned seeds:"}</Prose>

<Prose>{"What makes two observations one pair? Connect corresponding A/B values for each included initialization to its own B−A difference."}</Prose>

<DiagnosticsRecordedPairsView/>

<Prose>{"The correspondence and held-fixed split/budget are part of the comparison. A negative difference favors B for a smaller-is-better quantity, but favors A for larger-is-better. Same-run comparison gives exact zeros with unchanged identity. A one-seed subset still has a difference, but cannot supply a sample standard deviation."}</Prose>

<NeuralTable caption={"7. Turn a promising observation into a controlled comparison"} headers={[<>{"Initialization seed"}</>,<>{"Clean validation loss / correct rows"}</>,<>{"Shuffled validation loss / correct rows"}</>]} rows={[[<>{"3"}</>,<>{"0.019079 / 36 of 36"}</>,<>{"2.476567 / 11 of 36"}</>],[<>{"7"}</>,<>{"0.011259 / 36 of 36"}</>,<>{"2.526364 / 15 of 36"}</>],[<>{"19"}</>,<>{"0.031687 / 36 of 36"}</>,<>{"2.575072 / 14 of 36"}</>]]} />

<Prose>{"These repeats vary initialization on one fixed split and one fixed target permutation. They do not measure variation from choosing another dataset, split or corruption. Pairing the same initializations is useful for isolating this intervention. In a broader evaluation, vary the sources of variation relevant to the claim, give competing methods comparable selection budgets and keep the final test protocol separate from development. Bouthillier and colleagues' "}<a href={"https://proceedings.mlsys.org/paper_files/paper/2021/file/0184b0cd3cfb185989f858a1d9f5c1eb-Paper.pdf"}>{"benchmark-variance study"}</a>{", especially sections 2 and 5, explains why initialization repeats alone miss parts of benchmark uncertainty."}</Prose>

<Prose>{"How much do the included differences vary? Subtract their mean, square each deviation, sum, divide by n minus 1 and take the root."}</Prose>

<DiagnosticsRecordedSpreadView/>

<Prose>{"For constructed differences −.03,.01,.05, mean .01 leaves deviations −.04/0/.04. Squares sum .0032; divide by 2 for variance .0016 and take the root for SD .04. This describes the included differences, not a significance test or every future deployment. Editable scores share this arithmetic and their units/direction/provenance; a unit change never silently clamps previous values."}</Prose>

<Prose>{"All runs fit their supplied training labels exactly in accuracy. The shuffled validation accuracy has mean 0.370370 and sample standard deviation 0.057824 across the three initializations. Clean validation accuracy has mean 1 and sample standard deviation 0, while its validation loss still varies. Report the individual observations; a zero spread in coarse accuracy over three runs has a very narrow meaning."}</Prose>

<Prose>{"For a new numerical comparison, calculate paired differences "}<InlineMath>{"d_s=m_{B,s}-m_{A,s}"}</InlineMath>{", state whether larger or smaller is better, and inspect their distribution. A claimed improvement should be meaningful for the task as well as larger than plausible variation under the intended evaluation. More repetitions of the same fixed source do not resolve an untested source of uncertainty."}</Prose>

<Prose>For editable score observations, keep corresponding A/B values together and declare their meaning before interpreting the arithmetic.</Prose><DiagnosticsFreshPairsView/><DiagnosticsFreshSpreadView/>

<Prose>{"Deeper branch: why can many repeated seeds still miss variability? Draw a shared offset U feeding every score and separate private offsets εi."}</Prose>

<DiagnosticsVarianceView/>

<Prose>{"Under the constructed independent model scoreᵢ=U+εᵢ, the average retains U while averaging the private terms. With common variance .4 and private variance .6, mean variance is .4+.6/k: .6 at 3 repeats and .406 at 100. This is not an estimated Wine variance decomposition. A genuinely shared additive offset cancels in a paired difference; an unmatched or negatively covarying pairing need not help."}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathrm{Var}(\\bar m)=\\mathrm{Var}(U)+\\mathrm{Var}(\\epsilon)/k,\n\\qquad \\mathrm{Var}(B-A)=\\mathrm{Var}(B)+\\mathrm{Var}(A)-2\\mathrm{Cov}(A,B)."}</MathBlock></div>

<Prose>{"Change common variance or repeat count while private variance .6 stays fixed. The shared floor remains visible. Review "}<a href="/learn/path/full-curriculum/sampling-measurement-experimental-design?module=math-foundations#6-separate-units-from-repeated-readings">Sampling &amp; Experimental Design: shared errors and pairing</a>{" for how independent units differ from repeated readings. Correspondence is an experimental-design decision; increasing initialization repeats cannot sample a split/tuning source held fixed. Hypothesis Testing's paired interval has additional sampling assumptions, which these three conditional Wine seeds do not establish."}</Prose>

<details><summary>Changed-score practice and hint</summary>

<Prose>{"You have paired validation accuracies for a new task: method A "}<code>{"[0.80, 0.83, 0.79]"}</code>{", method B "}<code>{"[0.81, 0.80, 0.84]"}</code>{". Compute each paired difference and its mean before arguing which method to choose. Also name one source of variation the three numbers do not identify."}</Prose>

<Prose>{"Hint: the pair, rather than the best B run, is the unit of the comparison."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The differences B minus A are "}<code>{"[0.01, −0.03, 0.05]"}</code>{", with mean 0.01, or one percentage point. Their sample standard deviation is 0.04. B wins in two pairs and loses in one. An acceptable decision could be to collect more appropriately designed evidence before changing a system whose costs matter; the small observed advantage is inconsistent across these pairs. If the runs use one fixed data split, they leave data-sampling variation unmeasured. The standard deviation describes these paired differences, not uncertainty over every future deployment."}</Prose>

</details>

<H2>{"8. A checkpoint preserves a process, not just its weights"}</H2>

<Prose>{"Imagine pausing a bicycle on a hill. Its location matters, but restarting with a different velocity changes what happens next. Momentum has a similar hidden-state consequence, which we can compute without an analogy."}</Prose>

<Prose>{"What state makes the next momentum operation determinate? Draw the gradient, saved velocity, supplied momentum and rate before naming a checkpoint."}</Prose>

<DiagnosticsSavedView/>

<Prose>{"Starting target 3/weight 1/velocity 0, the gradient is −2; multiply old velocity by .5 and add the gradient to get −2. Subtract rate .1 times that result from 1 to get 1.2. The saved package contains both weight 1.2 and velocity −2, time-labelled after completed step 1. Weight and velocity have different roles."}</Prose>

<Prose>{"Use "}<InlineMath>{"L(w)=(w-3)^2/2"}</InlineMath>{", gradient "}<InlineMath>{"g=w-3"}</InlineMath>{", momentum coefficient "}<InlineMath>{"\\mu=0.5"}</InlineMath>{", learning rate "}<InlineMath>{"\\eta=0.1"}</InlineMath>{", and the recurrence"}</Prose>

<div className="neural-equation"><MathBlock>{"v_{t+1}=\\mu v_t+g_t,\\qquad w_{t+1}=w_t-\\eta v_{t+1}."}</MathBlock></div>

<Prose>{"Can identical restored weights still produce different next updates? Trace the full-state and reset-velocity branches side by side."}</Prose>

<DiagnosticsResumeView/>

<Prose>{"Both begin at 1.2 and compute the same next gradient −1.8. Full restore multiplies .5×−2 then adds −1.8 for velocity −2.8, giving next weight 1.48. Reset velocity gives −1.8 and 1.38. Inspect every bounded prefix/continuation state, not just the last weight. Momentum 0 removes history influence; rate 0 can keep weights equal despite distinct velocities."}</Prose>

<Prose>{"Both branches first evaluate the same saved weight, so comparing only the first resumed loss misses their different velocity updates. The recurrence explains that timing; the current shared trace exposes each prefix and continuation step."}</Prose>

<Prose>{"Save at a documented completed-update boundary when possible: optimizer and schedule have advanced, gradients are cleared, and the next data position is known. That removes unfinished accumulation from the example. Multiworker prefetch, distributed samplers and external streaming sources need their own resume contract; an epoch number alone cannot reconstruct their in-flight state."}</Prose>

<Prose>{""}<code>{"state_dict()"}</code>{" is useful for model and optimizer state. When retaining an in-memory “best model” while training continues, deep-copy the state or serialize it at that moment; a live reference to state is not an immutable checkpoint. "}<a href={"https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html#saving-loading-a-general-checkpoint-for-inference-and-or-resuming-training"}>{"PyTorch's saving/loading tutorial"}</a>{" distinguishes a general training checkpoint from saved model weights."}</Prose>

<H3>{"Deeper branch: an actual uninterrupted-versus-resumed comparison"}</H3>

<Prose>{"The complete "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/checkpoint_replay.py"}>{"checkpoint_replay.py"}</a>{" uses the same training data and imports the supplied "}<code>{"load_inputs"}</code>{" helper from "}<code>{"wine_diagnostics.py"}</code>{". It changes the architecture to "}<code>{"13 → 8 → tanh → dropout(0.25) → 3"}</code>{", uses batches of 12, and saves after completed update 5. The active permutation has 72 positions and its cursor is 60, so one batch remains before a new permutation is drawn. SGD momentum is 0.9; the schedule halves the learning rate after every three updates."}</Prose>

<Prose>{"Which inputs determine the next operation in the real CPU continuation? Show the known model shape and actual process state at its completed-update boundary."}</Prose>

<DiagnosticsCpuView/>

<Prose>{"The 13→8 tanh→dropout .25→3 forward receives dropout draws from the global generator and next row IDs from the active order/cursor. A generator is a deterministic number stream whose saved current state determines its next draw; constructing a model consumes some of those draws too. SGD momentum .9 and StepLR determine the update and future rate. After 5 completed updates the cursor is 60/72; one batch of 12 remains. The declared step→scheduler→clear boundary has no unfinished gradient. Generator state is input to future draws, not optimizer output."}</Prose>

<Prose>{"Run it from the directory containing the supplied files:"}</Prose>

<CodeBlock language={"text"}>{"python -B checkpoint_replay.py"}</CodeBlock>

<Prose>{""}<code>{"fresh_training_state"}</code>{" creates the model, optimizer, scheduler and separate sample-order generator. "}<code>{"train_until"}</code>{" consumes batch positions, records the learning rate actually used, and performs "}<code>{"step → scheduler.step → zero_grad"}</code>{". "}<code>{"snapshot"}</code>{" deep-copies all process state. The program serializes that tensor/plain-container checkpoint through an in-memory buffer, loads it with "}<code>{"weights_only=True"}</code>{", and compares continuations through update 12. It restores the global Torch RNG after constructing the new model because construction itself consumes random draws. The scheduler is created before loading optimizer state, consistent with the "}<a href={"https://docs.pytorch.org/docs/2.9/generated/torch.optim.Optimizer.load_state_dict.html"}>{"optimizer loading API"}</a>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/neural-training-diagnostics-reproducible-experiments/checkpoint_replay.py"} language="python" filename="checkpoint_replay.py" title="Complete runnable source: checkpoint_replay.py"/>

<Prose>{"The reference continuation uses learning rate 0.015 at update 6 and 0.0075 at update 7. Here is the actual result of changing only the named state category:"}</Prose>

<Prose>{"Which retained observable first changes after an omitted category? Align actual update 6..12 batches, pre-update losses and used rates."}</Prose>

<DiagnosticsOmissionView/>

<Prose>{"Full restore is the exact null. Clearing optimizer buffers changes update 6, whose first retained symptom is loss 7. Global RNG omission changes loss 6; active order/cursor omission changes batch 6; scheduler omission changes used rate 7. The final maximum parameter difference is separately reported. No per-step parameter arrays were retained, so do not infer a measured intermediate distance."}</Prose>

<NeuralTable caption={"Deeper branch: an actual uninterrupted-versus-resumed comparison"} headers={[<>{"Restore treatment"}</>,<>{"Exact continuation trace and final parameters?"}</>,<>{"Largest absolute final parameter difference"}</>]} rows={[[<>{"Restore all recorded state"}</>,<>{"Yes"}</>,<>{"0"}</>],[<>{"Clear optimizer momentum buffers; retain its parameter groups and current learning rate"}</>,<>{"No"}</>,<>{"0.030061553"}</>],[<>{"Leave global Torch RNG at its reconstructed initial position"}</>,<>{"No"}</>,<>{"0.008614809"}</>],[<>{"Regenerate order and reset cursor instead of restoring the active order/cursor"}</>,<>{"No"}</>,<>{"0.008778305"}</>],[<>{"Leave scheduler at its new initial state"}</>,<>{"No"}</>,<>{"0.023764836"}</>]]} />

<Prose>{"The last column is a diagnostic distance under this run's parameterization, not a ranking of practical harm. The "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/checkpoint-results.json"}>{"full record"}</a>{" includes batch positions, pre-update loss and learning rate at every continued step."}</Prose>

<Prose>{"The first retained difference narrows the next inspection to the corresponding consumer shown above. For scheduler omission, update 6 remains intact but update 7 uses .015 where the reference uses .0075. Interpret final distance in the declared parameterization; it does not rank practical harm."}</Prose>

<H3>{"Which machinery the diagnosis opens—and which it reuses"}</H3>

<Prose>{"The diagnostic implementation is the measurement-and-intervention procedure, not a replacement neural-network library. "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/wine_diagnostics.py"}>{"wine_diagnostics.py"}</a>{" implements train-only scaling, declared treatments and data roles, gradient norm, before/after parameter differences and actual per-row outputs. "}<code>{"fit"}</code>{" records the model before and after the intended update; it cannot mistake “a gradient exists” for “the parameters moved.” "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/calculations.py"}>{"calculations.py"}</a>{" supplies exact scalar arithmetic and an independent finite-difference route, providing a known reference when a larger run fails."}</Prose>

<Prose>{"For the model and derivative mechanisms, use the implemented "}<a href={"/learn-assets/backpropagation/teaching-autodiff.py"}>{"Backpropagation engine"}</a>{", "}<a href={"/learn-assets/loss-functions-ce-mse-focal-contrastive-triplet/loss-mechanisms.py"}>{"loss implementations"}</a>{", and "}<a href={"/learn-assets/gradient-variants/optimizer_library_bridge.py"}>{"optimizer recurrence/library comparisons"}</a>{". The preceding "}<a href={"/learn-assets/mini-batches-training-loops-gradient-accumulation/train_iris.py"}>{"complete training-loop source"}</a>{" implements effective-group accumulation, explained in "}<a href={"/learn/path/full-curriculum/mini-batches-training-loops-gradient-accumulation?module=deep-learning-fundamentals#how-does-this-become-an-actual-training-loop"}>{"How does this become an actual training loop?"}</a>{". The present full-batch diagnostic program is independently runnable."}</Prose>

<Prose>{"For continuation, "}<a href={"/learn-assets/neural-training-diagnostics-reproducible-experiments/checkpoint_replay.py"}>{"checkpoint_replay.py"}</a>{" preserves the process state: "}<code>{"snapshot"}</code>{" records model, optimizer, scheduler, CPU/dropout RNG, ordering RNG, the current permutation/cursor and update count. "}<code>{"restore"}</code>{" reconstructs the same objects and loads their ordinary "}<code>{"state_dict"}</code>{" APIs. The in-memory "}<code>{"torch.save"}</code>{"/"}<code>{"torch.load(weights_only=True)"}</code>{" round trip tests real serialization semantics; saved arrays are copied rather than aliased to parameters that training will subsequently mutate. Individual omission cases hold the other fields fixed, so their divergence has a meaningful cause."}</Prose>

<Prose>{""}<strong>{"Extend the checkpoint boundary."}</strong>{" The current program checkpoints after a completed update. Move the checkpoint between two accumulation chunks and specify the additional state needed before implementing that continuation."}</Prose>

<details><summary>Hint and reasoned solution</summary>

<Prose>{"At a completed update, gradients have been cleared and the next group can start from model/optimizer/data state. Mid-group, preserve accumulated gradient tensors, the effective group's full denominator, which rows/chunks have already contributed, the remaining order/cursor and any stochastic or AMP scaling state. Restoring weights alone and recomputing only the suffix loses the earlier derivative contributions; recomputing the whole group while retaining old gradients counts them twice. An acceptable implementation either restores this exact mid-group state or deliberately checkpoints only at completed-update boundaries and states that contract. Validate the first resumed derivative and next update, not just final rounded loss. Data-worker prefetch and distributed ownership need additional state beyond this single-process example."}</Prose>

</details>

<H2>{"9. Repeating a run and reproducing a conclusion"}</H2>

<Prose>{"What does a saved seed omit? Mark the start of a fixed stream, its saved current position, and the already sampled active-order suffix."}</Prose>

<DiagnosticsRngView/>

<Prose>{"Reinitializing the stream returns to its start; restoring current generator position resumes its next draw. Even that position does not reconstruct the unconsumed entries in an order already generated earlier. Save both order and cursor. A new permutation and continuing the current suffix are different operations. The opaque generator bytes need not be decoded to state their consumer."}</Prose>

<Prose>{"Use separate named generators when independent processes should have independently controlled streams, such as the sample permutation and label corruption here. Record generator states actually used by Python, NumPy and Torch, including relevant device generators. NumPy's "}<code>{"default_rng"}</code>{" objects have their own states; setting the older global NumPy seed does not reset an existing generator object. Dataset code and worker libraries may consume other random streams."}</Prose>

<Prose>{"What changes if interruption occurs inside a gradient group? Draw the consumed raw contributions, saved accumulator and full denominator before the remaining row."}</Prose>

<DiagnosticsGroupView/>

<Prose>{"After raw contributions −2/0, save sum −2, denominator 3 and cursor 2. Suffix −3 gives total −5 and gradient −5/3, then SGD .1 gives 1/6. Dropping the prefix gives −1 and next weight .1; replaying it with the retained sum gives −7/3 and 7/30. The framework bridge stores the already divided prefix −2/3 in cloned .grad, and likewise divides the suffix by full count 3. Raw-sum and mean-gradient storage are two explicit conventions, not conflicting values."}</Prose>

<Prose>{"Can mathematically equal reductions have different represented results? Expose the actual binary64 intermediate sums rather than claiming any grouping must differ."}</Prose>

<DiagnosticsFloatingView/>

<Prose>{"Both (1e16+1)+(−1e16) and 1e16+(1+(−1e16)) evaluate to 0: each loses the small unit. Reordering as (1e16+(−1e16))+1 yields 1. The first two groupings agree; cancellation-first ordering differs. An absolute/relative comparison states its scale and tolerance, while the retained same-environment exact replay still requires exact equality."}</Prose>

<Prose>{"Exact replay also depends on execution. Floating-point addition is not associative; changing reduction order, kernel selection or device can change results even with the same random draws. PyTorch provides deterministic-algorithm controls and documents worker seeding, CUDA benchmarking and device-specific requirements. Those controls can trade speed for repeatability and can raise an error when a requested deterministic implementation is unavailable. "}<a href={"https://docs.pytorch.org/docs/2.9/notes/randomness.html"}>{"PyTorch's reproducibility note"}</a>{" explicitly limits guarantees across releases, platforms and CPU/GPU execution."}</Prose>

<Prose>{"Distinguish three useful claims:"}</Prose>

<NeuralTable caption={"9. Repeating a run and reproducing a conclusion"} headers={[<>{"Claim"}</>,<>{"Evidence needed"}</>]} rows={[[<>{"“This exact continuation replays in this environment.”"}</>,<>{"Compare the resumed state and trace to uninterrupted execution under a recorded contract."}</>],[<>{"“This procedure gives similar results across relevant random choices.”"}</>,<>{"Repeat those choices, retain all planned runs and report variability."}</>],[<>{"“Another person can reproduce the experimental conclusion.”"}</>,<>{"Supply code, data/provenance, configuration, selection procedure, measurements and enough environmental detail to test the claim."}</>]]} />

<Prose>{"The exact CPU replay in section 8 supports the first claim for that program. The Wine initialization repeats support a restricted version of the second. Sharing the code, data and settings makes the procedure inspectable and repeatable; evaluating it on a new platform is a new check."}</Prose>

<Prose>{"Which saved field has a next consumer? Connect each process-state field to the operation it determines."}</Prose>

<DiagnosticsStateView/>

<Prose>{"Model parameters/buffers feed forward; optimizer groups/history feed step; scheduler/counters feed the used/future rate; each generator feeds its draws; active order/cursor feeds the next examples; modes/preprocessing feed the executed objective. Mid-group also preserve gradients/denominator and AMP state if used. Clone or serialize snapshot-owned state, construct objects before loads, and restore RNG after constructors. A container inventory is now meaningful because each dependency has been traced."}</Prose>

<Prose>{"For a real run, list every state that determines the next computation:"}</Prose>

<NeuralTable caption={"9. Repeating a run and reproducing a conclusion"} headers={[<>{"State category"}</>,<>{"Why it matters"}</>]} rows={[[<>{"Model parameters "}<strong>{"and buffers"}</strong>{""}</>,<>{"Weights and normalization statistics determine the forward computation."}</>],[<>{"Optimizer state and parameter groups"}</>,<>{"Momentum or adaptive moments, learning rates and parameter membership determine the update."}</>],[<>{"Scheduler state and completed-update count"}</>,<>{"The same current learning rate can conceal a different future decay time."}</>],[<>{"RNG state of every used generator"}</>,<>{"The current positions in initialization, dropout, augmentation and sampling streams determine the next draws."}</>],[<>{"Active sample order and cursor"}</>,<>{"A generator state alone does not identify which entries remain in an already generated permutation."}</>],[<>{"Training/evaluation configuration and preprocessing"}</>,<>{"Module modes, fitted transforms, target mapping and masks define the computation being resumed."}</>],[<>{"Any unfinished update state"}</>,<>{"Accumulated gradients, normalization denominator and mixed-precision scaler matter if saving mid-update."}</>]]} />

<Prose>{"Deeper tools extend ownership rather than guaranteeing universal trajectory equality. StatefulDataLoader saves iterator/worker state; rank ownership remains a separate concern. Distributed Checkpoint loads into preallocated/stateful objects and can reshard compatible stored state, but a changed world size/reduction schedule need not reproduce the trajectory. The planned Hardware Systems topic Distributed GPU Checkpointing & Failure Recovery is future study, not a published prerequisite. The official loader/DCP contracts provide this local overview; no untested universal distributed script is promised. A useful experiment record answers: What was predicted? Which source revision ran? Which input hashes, split IDs and fitted transformations were used? Which model/loss/reduction, optimizer, schedule, batch/update budget and seed streams were fixed? What hardware, precision, versions and determinism settings were used? What quantity was measured, at what checkpoint, and by what selection rule? Where are failed attempts and the actual results? Which inference followed?"}</Prose>

<Prose>{"Do not overwrite that history with only the best validation run. If you change the budget after seeing a result, record the new decision and keep the old result. Test performance becomes a development signal if repeatedly consulted to choose settings; preserve a final evaluation procedure appropriate to the claim."}</Prose>

<H3>{"Complete measurement and ordinary-library sources, after the state contract"}</H3>

<Prose>{"The first source uses explicit NumPy/standard-library arithmetic and copied state. The second uses ordinary Torch on identical fixed examples; download both together. To call its exact earlier-engine comparison, also supply the linked teaching-autodiff.py path. Neither new main fits Wine or writes a record."}</Prose>

<RemoteCodeBlock source={"/learn-assets/neural-training-diagnostics-reproducible-experiments/diagnostic-measurements.py"} language="python" filename="diagnostic-measurements.py" title="Complete runnable source: diagnostic-measurements.py"/>

<RemoteCodeBlock source={"/learn-assets/neural-training-diagnostics-reproducible-experiments/diagnostic-library-bridge.py"} language="python" filename="diagnostic-library-bridge.py" title="Complete runnable source: diagnostic-library-bridge.py"/>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Independent case file"}</H2>

<Prose>{"Try the cases before opening the hints or solutions. A strong response cites an observation, competing explanations, a minimal discriminating check, its predicted outcomes and a bounded conclusion."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Case A: the silent training run"}</H3>

<Prose>{"A new scalar regression diagnostic uses "}<InlineMath>{"x=[2,3]"}</InlineMath>{", "}<InlineMath>{"y=[1,2]"}</InlineMath>{", initial "}<InlineMath>{"w=0.25"}</InlineMath>{", mean half-squared error and SGD at 0.2. After backward the gradient is −2.375. After the reported update the weight is still 0.25. Compute the reference weight and give two plausible explanations plus a check that separates them."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The derivative has already been independently checked. Inspect the optimizer's actual operation and the parameter object it owns."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The reference gradient is "}<InlineMath>{"((-0.5)(2)+(-1.25)(3))/2=-2.375"}</InlineMath>{", and the next weight is "}<InlineMath>{"0.25-0.2(-2.375)=0.725"}</InlineMath>{". One explanation is that "}<code>{"step()"}</code>{" was never called. Another is that it was called on an optimizer containing an old parameter object after the model was replaced. Capture the executed step and compare the identities of model parameters with optimizer-group entries; record before/after values for both. A zero learning rate is another viable hypothesis whose direct inspection is inexpensive. Nonzero gradients rule out neither explanation. The repaired run must reproduce 0.725 for this changed contract."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Case B: a convincing training curve"}</H3>

<Prose>{"A three-class classifier fits all its training labels. Validation accuracy is about one third. Your colleague concludes the learning rate must be too small and wants a wider model with a larger learning rate. Design a more informative first investigation. Name an outcome that would favor a data problem and an outcome that would favor further optimization investigation."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Training accuracy is measured against a supplied target array. Reconstruct a few row-to-target paths from original input to loss."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Inspect stable row IDs through preprocessing, batching and target construction, compare them with original labels, and verify evaluation uses the same target mapping. Refit a small inspected subset under the correct loop. Discovering a permutation or inconsistent class mapping and improving the controlled run after repairing only that mapping favors a data-interface cause. If alignment and evaluation are correct but a feasible deterministic subset still fails to fit, inspect derivatives and actual updates before widening the model. A valid answer may choose a different cheap test if it states how the outcomes separate plausible hypotheses. The original accuracy observation alone does not choose the learning rate."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Case C: validation changes the future"}</H3>

<Prose>{"A BatchNorm model runs validation between training updates inside no-grad. Its parameters remain unchanged, but its running mean changes. Explain the mechanism and repair the procedure. Then say why running the same test on a linear-only model could conceal the defect."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The state dict contains more than trainable parameters. Identify which switch controls the forward behavior."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The model is still in training mode, so BatchNorm consumes validation-batch statistics and updates buffers during forward. Select evaluation mode before validation, use no-grad for graph control, and select training mode before the next training batch. Verify both buffer preservation and evaluation outputs on a saved copy of the model. A linear-only model has no BatchNorm buffer updates or dropout behavior, so its unchanged values cannot test this mode-sensitive mechanism."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Case D: a changed restart calculation"}</H3>

<Prose>{"For "}<InlineMath>{"L(w)=(w-4)^2/2"}</InlineMath>{", start at "}<InlineMath>{"w_0=2,v_0=0"}</InlineMath>{", use "}<InlineMath>{"\\eta=0.25"}</InlineMath>{" and "}<InlineMath>{"\\mu=0.75"}</InlineMath>{". Save after the first update. Calculate the second weight with full state and with reset velocity. Then construct a momentum setting where resetting velocity has no effect."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the saved pair "}<InlineMath>{"(w_1,v_1)"}</InlineMath>{" before continuing. The loss gradient is "}<InlineMath>{"w-4"}</InlineMath>{"."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first gradient is −2, so "}<InlineMath>{"v_1=-2"}</InlineMath>{" and "}<InlineMath>{"w_1=2.5"}</InlineMath>{". Next "}<InlineMath>{"g_1=-1.5"}</InlineMath>{". Full restore gives "}<InlineMath>{"v_2=0.75(-2)-1.5=-3"}</InlineMath>{", so "}<InlineMath>{"w_2=3.25"}</InlineMath>{". Reset velocity gives "}<InlineMath>{"v_2=-1.5"}</InlineMath>{", so "}<InlineMath>{"w_2=2.875"}</InlineMath>{". With momentum zero, the previous velocity is multiplied by zero, and both continuations agree. That null case tests why the state matters, rather than merely memorizing that all saved values always matter."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Practical synthesis: write a reproducible diagnosis"}</H3>

<Prose>{"Use the supplied offline Wine files. Select one inspected training row and trace its features and class through the split, transform and loss input. Reproduce the seed-7 clean and shuffled-label results. Then propose and run one new diagnostic intervention of your own, such as a different declared target permutation or a changed feasible tiny subset. State your prediction before execution and keep the original settings and outputs. Use training/validation only."}</Prose>

<Prose>{"Your report should make another reader able to repeat the intervention: exact input IDs, changed field, held-fixed settings, source/configuration record, expected contrast, observed measurements and interpretation. It should identify an alternative explanation left unresolved. Success is a defensible experiment, including a well-explained null result, rather than beating the supplied validation score. The initial reproduction targets are the section-6 seed-7 values to the displayed precision in the recorded environment; new interventions have no invented answer key."}</Prose>

<details><summary>Example acceptable report structure</summary>

<Prose>{"“I changed the fixed 12-example subset and retained the transform fitted on the same 72 training rows, initialization seed 7 and 120-update budget. I predicted the inspected subset would fit because it has no duplicated contradictory examples and the same architecture already fitted the original subset. Here are the exact selected row IDs, the initial/final losses and predictions, and the unchanged reference record. The outcome supports or weakens that local fitting hypothesis. It leaves performance on other distributions unmeasured.” Supply actual numbers from your run in the report; this example supplies a reasoning structure, not a fictional result."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Changed transfer: representation and a false alarm"}</H3>

<Prose>{"For the two-ReLU response matrix [[1,0],[3,1]], change the targets to −3/4. Solve the coefficients, then explain why duplicate input 0 with unequal targets is impossible. Separately explain why unchanged weight at a stationary point or rate 0 does not identify an omitted step."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first response fixes the first coefficient. Solve the second equation after substituting it. A diagnostic null needs a changed case whose competing explanations predict different outputs."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first equation gives c₁=−3. The second is 3(−3)+c₂=4, hence c₂=13. Duplicate responses give the same output for both rows and cannot equal unequal targets. A stationary objective has g=0, and rate 0 multiplies even a nonzero gradient to 0; either can leave a correctly updated weight unchanged. Use a known nonstationary gradient and a nonzero rate, then inspect actual step and parameter identity."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Changed transfer: what repetition can average"}</H3>

<Prose>{"Under the explicitly independent common/private model, let common variance .2, private variance .9 and repeatcount 9. Compute mean variance, then decide what infinitely many private repetitions leave unmeasured about a fixed data split."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The common offset appears once in the average; only the independent private terms shrink with count."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Variance is .2+.9/9=.3. As count increases without bound the private term tends to 0 and the common floor remains .2. These are constructed model quantities. Varying initialization on one fixed split cannot establish uncertainty over other split choices or deployment populations."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"11. Readiness and next study"}</H2>

<Prose>{"You have reached the end of "}<strong>{"Deep Learning Fundamentals & Architectures"}</strong>{". The module has introduced many architectures; this final lesson supplies a way to decide whether your computation and evidence justify using any of them."}</Prose>

<Prose>{"Before marking your own study complete, retrieve these ideas without looking back: why can a nonzero gradient coexist with unchanged weights? Why can fitting shuffled labels succeed? What must be equal when comparing training and validation loss? Which BatchNorm state can change in no-grad? Why can a resumed forward loss match even though the next update will differ? What does repeating one seed or several initializations actually establish?"}</Prose>

<Prose>{"You are ready to continue when you can diagnose a changed case with a discriminating experiment, reproduce a small forward/update calculation, explain the train/validation/test roles, identify the first diverging checkpoint state and write a record that someone else can run. If one skill is weak, revisit the relevant worked case and solve its changed practice before trying a larger model."}</Prose>

<Prose>{"Choose your next study by the work you want to do: revisit the preceding training-mechanics lesson for batching and accumulation; revisit normalization or initialization in this module if layer statistics are difficult; revisit the "}<a href={"/learn/path/full-curriculum/end-to-end-supervised-learning-error-analysis?module=classical-ml"}>{"end-to-end supervised learning and error-analysis lesson"}</a>{" for a broader project decision process; or run a small reproduction of an architecture from this module with your own explicit hypothesis. These review and extension choices let your next question guide further study."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://www.deeplearningbook.org/contents/guidelines.html"}>{"Goodfellow, Bengio and Courville, *Deep Learning*, chapter 11: Practical Methodology"}</a>{". Free textbook chapter connecting metrics, baselines, data decisions and debugging. Best for consolidating the whole process after the first pass, especially its experiment planning and debugging discussion. Its architecture-era examples supplement the current runnable API examples here."}</li><li>{""}<a href={"https://cs231n.github.io/neural-networks-3/"}>{"Stanford CS231n notes: Learning"}</a>{". A visual, practical article on gradient checks, small-data checks and monitoring. Treat its numeric rules of thumb as historical heuristics to investigate in context; this lesson uses defined computations and controlled evidence."}</li><li>{""}<a href={"https://docs.pytorch.org/tutorials/beginner/basics/intro.html"}>{"PyTorch Learn the Basics"}</a>{". An official beginner tutorial route through data, networks, differentiation, optimization and saving/loading. Use it alongside the supplied programs if the API is unfamiliar. Its optimization and saving/loading chapters provide ordinary API examples; those external dataset exercises are separate from this lesson's offline runs."}</li></ul>

<ul><li>{""}<a href={"https://cs231n.stanford.edu/2017/syllabus"}>{"Stanford CS231n 2017 course syllabus"}</a>{", especially its linked Training Neural Networks lectures. A video/course alternative for revisiting the broader optimization and regularization mechanisms. The written notes above provide a searchable companion."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://docs.pytorch.org/docs/2.9/notes/autograd.html"}>{"PyTorch: Autograd mechanics"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.9/notes/randomness.html"}>{"Reproducibility"}</a>{", and "}<a href={"https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html"}>{"Saving and Loading Models"}</a>{". Precise API references for graph control, random streams and checkpoints. The first two links identify versioned API documentation; the executable examples use the environment recorded above."}</li><li>{""}<a href={"https://proceedings.mlsys.org/paper_files/paper/2021/file/0184b0cd3cfb185989f858a1d9f5c1eb-Paper.pdf"}>{"Bouthillier et al., *Accounting for Variance in Machine Learning Benchmarks*"}</a>{". An advanced research branch on what repeated benchmarking actually measures. Focus on its variance model and recommendations; reproducing the paper's benchmark suite is a separate project."}</li></ul>

<ul><li>{""}<a href={"https://arxiv.org/pdf/1611.03530"}>{"Zhang et al., Understanding deep learning requires rethinking generalization"}</a>{". Advanced original finite-sample expressivity and randomization research. Section 4 and Appendix C explain the triangular ReLU construction; existence is separate from convergence and useful prediction. The two-point construction here uses its mechanism rather than adopting its corruption protocol as Wine evidence."}</li><li>{""}<a href={"https://www.jmlr.org/papers/volume22/20-303/20-303.pdf"}>{"Pineau et al., Improving Reproducibility in Machine Learning Research"}</a>{". Research discussion of reproducibility and reporting. Use the code/data/procedure questions to make a conclusion challengeable; observed checklist associations do not establish causation."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.autograd.gradcheck.gradcheck.html"}>{"PyTorch 2.14 gradcheck"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.Tensor.register_hook.html"}>{"Tensor hook"}</a>{" and "}<a href={"https://docs.pytorch.org/docs/2.14/autograd.html#debugging-and-anomaly-detection"}>{"anomaly detection"}</a>{". Exact APIs for the new fixed-state probes. Float64/smooth-point/storage conditions and observational hook ownership are part of the code contract."}</li><li>{""}<a href={"https://meta-pytorch.org/data/main/torchdata.stateful_dataloader.html"}>{"StatefulDataLoader"}</a>{" and "}<a href={"https://docs.pytorch.org/docs/2.14/distributed.checkpoint.html"}>{"PyTorch 2.14 Distributed Checkpoint"}</a>{". Deeper official process-state tools. Iterator/worker versus rank state, preallocation and resharding are different responsibilities; the CPU replay here does not demonstrate distributed/GPU execution."}</li><li>{""}<a href={"https://nips.cc/public/guides/PaperChecklist"}>{"NeurIPS paper checklist"}</a>{". A current reporting route for reproducibility, access, varied quantities and uncertainty. Describe what a spread measures and retain failed attempts; do not invent historical compute measurements to fill a form."}</li></ul>

<Prose>{"The saved scientific measurements identify their 13 September 2026 environment and protocol; the constructed probes use the versions documented with their executable examples."}</Prose>

<></></section>
</DiagnosticsRecordedProviders></DiagnosticsCaseProviders></div>};
