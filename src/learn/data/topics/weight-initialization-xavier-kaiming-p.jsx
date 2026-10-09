// Production source, edited directly (reading-flow revision; full-mode content checkpoint).
// Do not regenerate from the revision-3 packet: scripts/generate-weight-initialization-lesson.mjs refuses to overwrite it.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import '../../components/lesson-labs/LessonFlow.jsx';
import { CorrelatedUpdateFigure } from '../../components/lesson-labs/InitializationUpdateIntuition.jsx';
import { LayerAnatomyFigure, LayerScaleFigure, ManyDrawsFigure, LayerBackwardFigure, StackChainFigure, HalfMassFigure, ProbePredictionTable, FanShapeFigure, EllipseFigure, ReluJacobianFigure, OrthogonalStepsFigure, DigitArchitectureStrip, WidthShapesFigure, AdamUnitFigure, AdamWidthTable, InitialLogitTable } from '../../components/lesson-labs/InitializationBuildupFigures.jsx';
import { InitializationSignalLab, InitializationMomentsLab, InitializationGeometryLab, InitializationSpectrumFigure, InitializationSymmetryLab, InitializationTrainingLab, WidthRecipeLab, CoordinateCheckLab, TruncationFigure, TruncationTable, PrecisionTable, InitializationProgram, initializationAsset } from '../../components/lesson-labs/WeightInitializationLabs.jsx';
const perceptronsLink = '/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals';
const backpropLink = '/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals';
const adamLink = '/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations';
const jacobianLink = '/learn/path/full-curriculum/matrix-calculus-jacobians?module=math-foundations';
export default {
 title: 'Weight Initialization: Xavier, Kaiming, Orthogonal Methods & μP',
 readTime: '~70 min read + experiments and practice; optional μP route ~35 min',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson initialization-lesson lesson-flow"><LessonIntro prerequisites={<>The neuron and network wiring from <a href={perceptronsLink + '#neuron-anatomy'}>Perceptrons</a>, and how <a href={backpropLink}>backpropagation</a> sends gradients back through the same weights. Mean, variance and singular directions are refreshed where they are used.</>} sections={[["a-signal-can-disappear-before-learning-starts","A signal can disappear before learning starts"],["what-the-scale-calculation-actually-preserves","What the scale calculation actually preserves"],["choose-a-recipe-for-the-operation-it-initializes","Choose a recipe for the operation it initializes"],["average-preservation-can-hide-a-collapsed-direction","Average preservation can hide a collapsed direction"],["construct-an-orthogonal-draw-then-match-a-width-aware-optimizer","Construct an orthogonal draw, then match a width-aware optimizer"],["why-equal-hidden-units-can-stay-equal","Why equal hidden units can stay equal"],["run-a-complete-initialization-comparison-on-real-inputs","Run a complete initialization comparison on real inputs"],["p-changing-width-changes-more-than-parameter-count","μP: changing width changes more than parameter count"],["deeper-tools-and-practical-failure-checks","Deeper tools and practical failure checks"],["practice-use-the-mechanism-on-a-changed-case","Practice: use the mechanism on a changed case"],["another-way-to-learn-and-what-comes-next","Another way to learn, and what comes next"]]}>Choose a starting state by the signals, directions and updates it preserves. Follow the core route first; μP adds a separate width-scaling route.</LessonIntro>
<Prose opening="exploration"><strong>Explore as you read.</strong> Every figure opens with a computed result, and its controls sit directly under it: which output or input of a layer to follow, the weight scale, an initialization, a direction, a width. Training curves come from saved runs; nothing is trained in your browser.</Prose>

<Prose>{"A network begins making predictions before it has learned anything. Its initial weights determine whether useful differences between inputs survive the journey through its layers—and whether a change in an early weight can still affect the loss."}</Prose>

<Prose>{"Think of passing a sound through twenty amplifiers. A small gain error repeated twenty times can make the signal nearly inaudible or enormously loud. A neural network adds another complication: nonlinear gates can remove parts of the signal. Choosing a starting scale is therefore a problem about a whole sequence of transformations, not simply drawing “small random numbers.” The analogy stops at one point: a network's “gain” is not one dial but a matrix, so it can amplify some directions while shrinking others. Section 4 returns to that."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the drawn layer and the stacked-layer measurements, the second-moment calculation and its check against those measurements, the initialization recipes, the geometry counterexample, the symmetry network and the complete digit experiment. Then solve practice problems 1–3 and 7. The μP section is a second route for changing network width while keeping a meaningful training procedure; practice 5 and 8 belong to it. LSUV, Fixup and precision details are reference branches, not prerequisites for the next lesson."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies?module=deep-learning-fundamentals"}>{"previous lesson on transfer learning"}</a>{" reused learned weights. Here we study fresh initialization: the numbers a layer holds before any training. Later, "}<strong>{"μTransfer"}</strong>{" will mean transferring selected hyperparameters across widths, which is a different operation."}</Prose>

<H2>{"A signal can disappear before learning starts"}</H2>

<Prose>{"Start with the object being initialized: one fully connected layer. This one has 4 inputs and 4 outputs, so 16 connections, each carrying one weight. Below, the layer is drawn as circles joined by lines, and the same 16 weights are stored as a table beside it (below it on a narrow screen). The highlighted lines are the four weights that feed output "}<InlineMath>{"h_1"}</InlineMath>{"."}</Prose>

<LayerAnatomyFigure />

<Prose>{"Follow the drawing from left to right. Each cyan circle is an input value "}<InlineMath>{"x"}</InlineMath>{", supplied data. Each line is a connection, and the amber number on it is that connection's "}<strong>{"weight"}</strong>{". Each violet circle on the right is an output, and each one is the neuron from "}<a href={perceptronsLink + '#neuron-anatomy'}>{"Perceptrons"}</a>{": it multiplies every arriving input by the weight on its line, adds the four products, and applies ReLU. For "}<InlineMath>{"h_1"}</InlineMath>{" that is "}<InlineMath>{"(0.32)(1.2)+(0.1)(-0.4)+(-0.225)(0.8)+(0.545)(-1.5)=-0.654"}</InlineMath>{"; ReLU turns the negative score into 0, so the circle reads 0 and is marked “ReLU off.”"}</Prose>

<Prose>{"The table holds the same sixteen weights as a matrix "}<InlineMath>{"W"}</InlineMath>{": row "}<InlineMath>{"j"}</InlineMath>{" lists the four weights into output "}<InlineMath>{"h_j"}</InlineMath>{", and column "}<InlineMath>{"i"}</InlineMath>{" the weights leaving input "}<InlineMath>{"x_i"}</InlineMath>{". That is why following a different output underlines a different row. The number of inputs feeding one output, here 4, is that output's "}<strong>{"fan-in"}</strong>{"."}</Prose>

<Prose>{"To "}<strong>{"initialize"}</strong>{" the layer is to choose those 16 numbers before training. The common way is to draw each one independently from a bell-shaped standard normal distribution centred on zero, then multiply by a chosen "}<strong>{"weight scale"}</strong>{" "}<InlineMath>{"s"}</InlineMath>{", the weights' standard deviation. The figure used "}<InlineMath>{"s=0.5"}</InlineMath>{" and one fixed draw, called A. The shape of the draw is fixed; "}<InlineMath>{"s"}</InlineMath>{" is the one number we pick, and every recipe in this lesson is, at heart, a rule for choosing it."}</Prose>

<Prose>{"Now vary "}<InlineMath>{"s"}</InlineMath>{". The next figure is the same layer with every output shown; move the scale and switch between three fixed draws."}</Prose>

<LayerScaleFigure />

<Prose>{"Every weight is "}<InlineMath>{"s"}</InlineMath>{" times its drawn number, so every score scales with "}<InlineMath>{"s"}</InlineMath>{". Near "}<InlineMath>{"s=0"}</InlineMath>{" the outputs are tiny; at 1.5 they are large. To compare output with input we use one statistic, the "}<strong>{"mean square"}</strong>{": the average of the squared values. The input's mean square is 1.1225. The ratio of output to input mean square is this layer's "}<strong>{"multiplier"}</strong>{". For a fixed draw it is a constant times "}<InlineMath>{"s^2"}</InlineMath>{", because doubling "}<InlineMath>{"s"}</InlineMath>{" doubles every score and quadruples every square; the readout's “× s²” number is that constant, and it stays put while you move the scale. Set "}<InlineMath>{"s"}</InlineMath>{" to 0.71 and switch draws: it reads about 0.41, 0.65 and 1.27. The three draws disagree because four random weights per output are a small sample."}</Prose>

<Prose>{"How typical are those three? Drawing the layer 1,000 times and recording each draw's multiplier ÷ "}<InlineMath>{"s^2"}</InlineMath>{" gives this spread:"}</Prose>

<ManyDrawsFigure />

<Prose>{"The dashed amber line is the average over draws, 2. The median single draw is only about 1.24, because a few draws land far to the right. A, B and C sit below, near and above the middle: typical draws, not extremes. So one draw shows the mechanism exactly—which weights meet which inputs, and that the multiplier grows as "}<InlineMath>{"s^2"}</InlineMath>{"—but not the right "}<InlineMath>{"s"}</InlineMath>{". The right scale is a statement about the average, which appears only over many draws or, as the next measurement shows, in a wide layer whose many terms average the noise away. Because the average multiplier is "}<InlineMath>{"2s^2"}</InlineMath>{", choosing "}<InlineMath>{"s^2=1/2"}</InlineMath>{", about "}<InlineMath>{"s=0.71"}</InlineMath>{", makes it one on average. Section 2 derives that rule for any number of inputs."}</Prose>

<H3>{"Stack the layer twenty times"}</H3>

<Prose>{"A deep network feeds each layer's output to the next layer as its input. The lesson's program builds twenty layers like the one above, but with 64 inputs and 64 outputs each, zero bias and ReLU, and sends the same 128 input vectors through all of them. The inputs are random Gaussian vectors chosen for diagnosis, not digit images."}</Prose>

<StackChainFigure />

<Prose>{"Read the chain in order: data enters, passes through twenty layers, and the last layer's activations "}<InlineMath>{"h_{20}"}</InlineMath>{" are reduced to one number at the end, explained below. At every layer the program records"}</Prose>

<div className="neural-equation"><MathBlock>{"q=\\operatorname{mean}(h^2),"}</MathBlock></div>

<Prose>{"the mean square you just met, now pooled over all 128 rows and 64 coordinates of that layer. It compares three weight scales:"}</Prose>

<NeuralTable caption={"Three weight scales and the question each tests"} headers={[<>{"Weight scale s"}</>,<>{"Intended question"}</>]} rows={[[<>{"0.01"}</>,<>{"Are small values automatically safe?"}</>],[<>{""}<InlineMath>{"\\sqrt{2/64}\\approx0.177"}</InlineMath>{""}</>,<>{"Does accounting for the number of inputs and the ReLU help?"}</>],[<>{"0.5"}</>,<>{"What happens when repeated layers amplify too much?"}</>]]} />

<Prose>{"A useful signal does not have to keep exactly the same "}<InlineMath>{"q"}</InlineMath>{", but changes by dozens of orders of magnitude deserve investigation. Actual float64 results for seed 1:"}</Prose>

<NeuralTable caption={"Seed 1: pooled mean square q at layers 1, 5, 10 and 20 (input q = 0.970)"} headers={[<>{"Initialization"}</>,<>{"Layer 1 "}<InlineMath>{"q"}</InlineMath>{""}</>,<>{"Layer 5 "}<InlineMath>{"q"}</InlineMath>{""}</>,<>{"Layer 10 "}<InlineMath>{"q"}</InlineMath>{""}</>,<>{"Layer 20 "}<InlineMath>{"q"}</InlineMath>{""}</>]} rows={[[<>{"Normal, std 0.01"}</>,<>{"0.00294"}</>,<>{""}<InlineMath>{"3.61\\times10^{-13}"}</InlineMath>{""}</>,<>{""}<InlineMath>{"1.36\\times10^{-25}"}</InlineMath>{""}</>,<>{""}<InlineMath>{"9.06\\times10^{-51}"}</InlineMath>{""}</>],[<>{"Xavier, gain 1"}</>,<>{"0.459"}</>,<>{"0.0337"}</>,<>{"0.00118"}</>,<>{""}<InlineMath>{"6.81\\times10^{-7}"}</InlineMath>{""}</>],[<>{"Kaiming, ReLU"}</>,<>{"0.918"}</>,<>{"1.077"}</>,<>{"1.207"}</>,<>{"0.714"}</>],[<>{"Orthogonal, gain "}<InlineMath>{"\\sqrt2"}</InlineMath>{""}</>,<>{"0.976"}</>,<>{"0.682"}</>,<>{"0.630"}</>,<>{"0.232"}</>],[<>{"Normal, std 0.5"}</>,<>{"7.343"}</>,<>{"35,302"}</>,<>{""}<InlineMath>{"1.30\\times10^9"}</InlineMath>{""}</>,<>{""}<InlineMath>{"8.24\\times10^{17}"}</InlineMath>{""}</>]]} />

<Prose>{"The table also names recipes derived later in this lesson: Kaiming in section 2, Xavier and orthogonal in section 3. For now read each as one concrete choice: the Kaiming row is the "}<InlineMath>{"\\sqrt{2/64}"}</InlineMath>{" scale, the 64-input version of the 0.71 the four-input layer suggested; Xavier here is the smaller scale "}<InlineMath>{"s=\\sqrt{1/64}=0.125"}</InlineMath>{"; orthogonal is not a scale but a matrix built so that it keeps every vector's length, then multiplied by "}<InlineMath>{"\\sqrt2"}</InlineMath>{" (section 4 shows what that means); and all-zero sets every weight to 0. Why do the other rows run away so fast? Each layer multiplies the mean square by roughly the same multiplier, and twenty repeated multiplications compound."}</Prose>

<Prose>{"The forward signal is half the story. Training needs a gradient to reach the early weights, and gradients travel backward through the same layers. To see one backward step, return to the four-input layer and suppose later layers send back the gradients "}<InlineMath>{"g=(1,-0.5,0.8,-1.2)"}</InlineMath>{" of some final loss "}<InlineMath>{"L"}</InlineMath>{" to its four outputs: how much "}<InlineMath>{"L"}</InlineMath>{" changes per unit nudge of each output."}</Prose>

<LayerBackwardFigure />

<Prose>{"Backward flow runs from right to left, drawn as dashed orange lines. An input's gradient collects one term along each of its outgoing lines: that line's weight, times the output's ReLU gate (1 if its ReLU was on in the forward pass, 0 if off), times the gradient arriving at that output. An output whose ReLU was off passes nothing back. The number of outgoing lines, here 4, is the input's "}<strong>{"fan-out"}</strong>{"."}</Prose>

<Prose>{"The program does the same through all twenty layers. First it reduces the final activations to one number, a stand-in for a loss: it multiplies them by a fixed random array "}<InlineMath>{"c"}</InlineMath>{" (the "}<strong>{"cotangent"}</strong>{", the backward signal that starts at the output) and sums, "}<InlineMath>{"\\text{score}=\\sum h_{20}\\odot c"}</InlineMath>{". That is the probe score at the end of the chain. Backpropagation then gives "}<InlineMath>{"\\partial\\,\\text{score}/\\partial h"}</InlineMath>{" at every layer, each step multiplying by the transposed weight matrix and by ReLU's on/off pattern exactly as in the figure above. To summarize a layer's gradients by one size, the program reports their "}<strong>{"RMS"}</strong>{", root mean square: "}<InlineMath>{"\\sqrt{\\operatorname{mean}(g^2)}"}</InlineMath>{", the square root of the gradient's own mean square. Both records, for any initialization and seed:"}</Prose>

<InitializationSignalLab />

<Prose>{"With seed 1 the gradient RMS at the input is "}<InlineMath>{"9.54\\times10^{-26}"}</InlineMath>{" for the small initialization, 0.848 for Kaiming and "}<InlineMath>{"9.10\\times10^8"}</InlineMath>{" for the large one. A gradient of "}<InlineMath>{"10^{-25}"}</InlineMath>{" means changing an early weight has essentially no effect on the score, so gradient descent cannot move it. Even an activation that is zero can have a nonzero gradient with respect to the score; the ReLU gates decide whether that gradient reaches the input. This measures sensitivity along the one output direction "}<InlineMath>{"c"}</InlineMath>{"; section 4 shows why one direction is not the whole picture."}</Prose>

<Prose>{"These are observations of finite networks, not theoretical curves. Switch seeds and the “right” recipes wander by a factor of a few in either direction: seed 1's orthogonal run fell to 0.24 while seed 2's rose to 3.0. A recipe's name does not guarantee a flat line after nonlinearities. Notice also what the probes measure: the network's starting state. Whether training then succeeds is a separate question, tested by the digit experiment later in this lesson."}</Prose>

<H2>{"What the scale calculation actually preserves"}</H2>

<Prose>{"Section 1 measured multipliers; now we derive them, so that a scale can be chosen on purpose. Three statistics will appear. A "}<strong>{"mean"}</strong>{" describes location. A "}<strong>{"variance"}</strong>{" measures squared spread around that mean. A "}<strong>{"second moment"}</strong>{", the mean square "}<InlineMath>{"q"}</InlineMath>{" we measured, measures squared distance from zero:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Var}(z)=E[z^2]-(E[z])^2."}</MathBlock></div>

<Prose>{"They coincide when the mean is zero. After ReLU, that is usually no longer true. Four values make the difference visible:"}</Prose>

<InitializationMomentsLab />

<Prose>{"Each panel places the four values A–D on a number line, with zero (grey dashed) and their mean (amber dashed); the bars below show each value's squared distance from zero or, if you switch, from the mean. Start with −2, −1, 1, 2 and ReLU. Before ReLU the mean is 0, so mean square and variance are both 2.5. After ReLU the values are 0, 0, 1, 2: the mean square halves to 1.25, but the mean moves to 0.75 and the variance becomes 0.6875, not 1.25. The second moment halved; the variance did "}<strong>{"not"}</strong>{" halve, because the output also moved away from zero. Switch the bars to “the mean” to see that the distances from the new mean are smaller. Now choose −1, 0, 2, 3, which are not symmetric about zero: ReLU removes less than half their mean square, 3.5 → 3.25. With no activation, the null case, nothing changes."}</Prose>

<Prose>{"Now return to one output of the "}<a href="#layer-anatomy">{"drawn layer"}</a>{". Its preactivation, the score before ReLU, is"}</Prose>

<div className="neural-equation"><MathBlock>{"z=\\sum_{i=1}^{n}w_i x_i."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"n"}</InlineMath>{" is the fan-in: the highlighted lines in the first layer figure. Assume independent, zero-mean weights with variance "}<InlineMath>{"s^2"}</InlineMath>{", drawn without looking at the input. For a fixed input, cross terms vanish when averaging over those random weights:"}</Prose>

<div className="neural-equation"><MathBlock>{"E_w[z^2\\mid x]=s^2\\sum_i x_i^2."}</MathBlock></div>

<Prose>{"For two inputs the missing algebra is visible: "}<InlineMath>{"(w_1x_1+w_2x_2)^2=w_1^2x_1^2+w_2^2x_2^2+2w_1w_2x_1x_2"}</InlineMath>{". The last term averages to zero because "}<InlineMath>{"E[w_1w_2]=E[w_1]E[w_2]=0"}</InlineMath>{", even if both fixed inputs are positive. For example, "}<InlineMath>{"x=[1,2]"}</InlineMath>{" gives "}<InlineMath>{"E_w[z^2]=5s^2"}</InlineMath>{". This is an average over weight draws; an individual draw still contains its cross terms, which is why the three draws in the layer figure disagree. The figure's input has "}<InlineMath>{"\\sum x_i^2=4.49"}</InlineMath>{", so averaged over draws each score has mean square "}<InlineMath>{"4.49s^2"}</InlineMath>{"."}</Prose>

<Prose>{"If the input coordinates share second moment "}<InlineMath>{"q"}</InlineMath>{", averaging over inputs gives "}<InlineMath>{"E[z^2]=ns^2q"}</InlineMath>{". Input coordinates do not have to have zero mean for this calculation; the independence of the weights removes the cross terms. After training, weights depend on the data and this independence is no longer a reliable description."}</Prose>

<Prose>{"Then ReLU acts. For a score that is as likely to be negative as positive, it keeps exactly half the mean square, and the picture shows why:"}</Prose>

<HalfMassFigure />

<Prose>{"The shaded humps plot "}<InlineMath>{"z^2"}</InlineMath>{" × how likely "}<InlineMath>{"z"}</InlineMath>{" is: the area under them is "}<InlineMath>{"E[z^2]"}</InlineMath>{", the mean square. The dashed bell is how likely each score is by itself. A weighted sum of many inputs, with weights symmetric around zero, is as likely to be −1.3 as +1.3, so the two humps are mirror images with equal area. ReLU replaces every negative score with zero and keeps every positive one, so exactly the right hump remains: "}<InlineMath>{"E[\\operatorname{ReLU}(z)^2]=\\tfrac12E[z^2]"}</InlineMath>{". It keeps half the probability too, but that is not what halves the mean square. The drawing uses a standard-normal shape; the argument needs only symmetry about zero. A bias that shifts the scores breaks the symmetry, as the shifted values in the four-value figure showed."}</Prose>

<Prose>{"Combining the weighted sum with ReLU's half gives"}</Prose>

<div className="neural-equation"><MathBlock>{"q_{\\mathrm{next}}=\\tfrac12 ns^2q."}</MathBlock></div>

<Prose>{"The factor "}<InlineMath>{"\\tfrac12ns^2"}</InlineMath>{" is the layer multiplier. In the four-input layer, "}<InlineMath>{"n=4"}</InlineMath>{", so the average-over-draws multiplier is "}<InlineMath>{"2s^2"}</InlineMath>{", exactly the average the histogram showed; choosing "}<InlineMath>{"s^2=2/4"}</InlineMath>{" makes it one. In general, choosing "}<InlineMath>{"s^2=2/n"}</InlineMath>{" makes the average layer-to-layer factor one. This is the ReLU "}<strong>{"Kaiming"}</strong>{", or "}<strong>{"He"}</strong>{", rule. The symmetry condition matters; a substantial bias can change how much of the distribution is removed. "}<a href={"https://arxiv.org/pdf/1502.01852"}>{"He et al., §2.2"}</a>{""}</Prose>

<Prose>{"The backward pass has the same shape, as the backward layer figure showed. A layer's gradient with respect to one of its inputs collects one term along each of that input's outgoing connections: "}<InlineMath>{"\\partial L/\\partial x_i=\\sum_j W_{ji}\\,g_j"}</InlineMath>{", where "}<InlineMath>{"g_j"}</InlineMath>{" is the gradient arriving at output "}<InlineMath>{"j"}</InlineMath>{" after ReLU's gate. There are "}<InlineMath>{"m"}</InlineMath>{" such terms, the fan-out, and on average half the gates are open. He et al.'s backward calculation assumes the incoming gradients "}<InlineMath>{"g_j"}</InlineMath>{" are independent of the weights and of the gates, as they roughly are when averaged over many examples and a random head. Under that assumption the same averaging multiplies the gradient's mean square by "}<InlineMath>{"\\tfrac12ms^2"}</InlineMath>{". The four-input layer shows the assumption is not exact: there one fixed gradient meets gates computed from the same rows of weights, and over the histogram's 1,000 draws the backward multiplier averages about 1.87 "}<InlineMath>{"s^2"}</InlineMath>{" rather than 2 "}<InlineMath>{"s^2"}</InlineMath>{"; the exact value for that input and gradient is 1.84 "}<InlineMath>{"s^2"}</InlineMath>{". The probe's layers are square, "}<InlineMath>{"m=n=64"}</InlineMath>{", so one factor governs both directions, and the gradient RMS changes by its square root per layer."}</Prose>

<Prose>{"The derivation now makes a checkable prediction for section 1: "}<InlineMath>{"q_{20}=q_0\\,(64s^2/2)^{20}"}</InlineMath>{", and an input-gradient RMS of "}<InlineMath>{"\\text{RMS}(c)\\,(64s^2/2)^{10}"}</InlineMath>{"."}</Prose>

<ProbePredictionTable />

<Prose>{"Across more than sixty orders of magnitude, the formula predicts the scale of every row. Seed 1's Gaussian rows all miss by the same factor, 1.358 forward and 1.173 backward. That is the layer figure's “× s²” observation at full scale: within a seed the program draws the same standard-normal numbers for every Gaussian recipe and only multiplies them by a different "}<InlineMath>{"s"}</InlineMath>{", so the four rows are one realization rescaled, not four tests. Std 0.01 gives a per-layer factor of 0.0032, and std 0.5 gives 8. Xavier's variance 1/64 gives exactly 0.5: section 3's Xavier recipe was derived for activations that do not discard half the signal, so behind ReLU it halves the mean square at every layer. Kaiming's factor is exactly one. Zero weights give factor zero, and the measured signal is exactly zero. "}<a href="#circle-to-ellipse">{"Orthogonal"}</a>{" weights scale every vector's squared length by exactly two before ReLU; ReLU then removes half on average, so the predicted factor is one. The measured 0.232 is about four times below the prediction."}</Prose>

<NeuralTable caption={"Prediction divided by measurement for q₂₀, by seed (1 = exact)"} headers={[<>{"Recipe"}</>,<>{"Seed 1"}</>,<>{"Seed 2"}</>,<>{"Seed 3"}</>]} rows={[[<>{"Every Gaussian recipe (one draw, rescaled)"}</>,<>{"1.36"}</>,<>{"5.02"}</>,<>{"0.69"}</>],[<>{"Orthogonal, gain "}<InlineMath>{"\\sqrt2"}</InlineMath>{""}</>,<>{"4.19"}</>,<>{"0.33"}</>,<>{"1.20"}</>]]} />

<Prose>{"Read the seeds together. The derivation predicts the typical scale; one random twenty-layer network lands within a few-fold of it, above in some seeds and below in others. Seed 1 made orthogonal look worse, seed 2 made the Gaussian recipes look worse, and seed 3 has them close. Three seeds support no ranking between Gaussian and orthogonal initialization for this probe. They do support the size of the effect: a correct average scale keeps twenty layers within a few-fold of one, while a wrong one moves them by dozens of orders of magnitude."}</Prose>

<Prose>{"There are several different averages here. The derivation averages over random weight draws and input assumptions. The program measures one realized tensor per layer. A mean of individual coordinates' variances across examples would be yet another statistic. The chart reports pooled second moment explicitly, so it does not disguise those differences."}</Prose>

<H2>{"Choose a recipe for the operation it initializes"}</H2>

<Prose>{"For a linear layer stored as an "}<InlineMath>{"m\\times n"}</InlineMath>{" matrix, fan-in is "}<InlineMath>{"n"}</InlineMath>{" and fan-out is "}<InlineMath>{"m"}</InlineMath>{". In section 1's square layer both were 4. They differ whenever a layer changes width, as in this layer with six inputs and three outputs:"}</Prose>

<FanShapeFigure />

<Prose>{"Its matrix "}<InlineMath>{"W"}</InlineMath>{" is 3 × 6. The amber lines are the six weights into "}<InlineMath>{"h_2"}</InlineMath>{": its fan-in, "}<InlineMath>{"n=6"}</InlineMath>{", one row of "}<InlineMath>{"W"}</InlineMath>{". The dashed orange lines are the three weights leaving "}<InlineMath>{"x_3"}</InlineMath>{": its fan-out, "}<InlineMath>{"m=3"}</InlineMath>{", one column. Forward signals collect "}<InlineMath>{"n"}</InlineMath>{" terms; backward gradients collect "}<InlineMath>{"m"}</InlineMath>{" terms. When "}<InlineMath>{"m\\ne n"}</InlineMath>{", one "}<InlineMath>{"s"}</InlineMath>{" cannot make both factors one, and recipes differ in which they favour."}</Prose>

<NeuralTable caption={"Initialization recipes: variance or construction, and what each is meant to preserve"} headers={[<>{"Method"}</>,<>{"Listed variance or construction"}</>,<>{"Starting use"}</>]} rows={[[<>{"LeCun normal"}</>,<>{""}<InlineMath>{"1/n"}</InlineMath>{""}</>,<>{"Preserve a linear forward second moment under the assumptions above; also part of particular self-normalizing recipes"}</>],[<>{"Xavier/Glorot normal"}</>,<>{""}<InlineMath>{"2/(n+m)"}</InlineMath>{""}</>,<>{"Balance forward and backward scale for approximately linear, centered activations"}</>],[<>{"Kaiming normal, fan-in"}</>,<>{""}<InlineMath>{"2/n"}</InlineMath>{" for ReLU"}</>,<>{"Preserve the forward second-moment scale through ReLU"}</>],[<>{"Kaiming normal, fan-out"}</>,<>{""}<InlineMath>{"2/m"}</InlineMath>{" for ReLU"}</>,<>{"Prioritize the corresponding backward scale"}</>],[<>{"Orthogonal"}</>,<>{"Construct orthogonal rows or columns, then multiply by a gain"}</>,<>{"Control the linear map's geometry, with attention to dimensions and later nonlinearities"}</>]]} />

<Prose>{"For a normal draw with variance "}<InlineMath>{"v"}</InlineMath>{", the standard deviation is "}<InlineMath>{"\\sqrt v"}</InlineMath>{". For a uniform draw on "}<InlineMath>{"[-a,a]"}</InlineMath>{", the variance is "}<InlineMath>{"a^2/3"}</InlineMath>{", so use "}<InlineMath>{"a=\\sqrt{3v}"}</InlineMath>{". A gain "}<InlineMath>{"g"}</InlineMath>{" multiplies the weights and therefore multiplies variance by "}<InlineMath>{"g^2"}</InlineMath>{". The listed Kaiming variances already include the ReLU gain; do not apply it twice."}</Prose>

<Prose>{"For example, a 100-input, 25-output linear layer has Xavier variance "}<InlineMath>{"2/125=0.016"}</InlineMath>{". Its normal standard deviation is about 0.1265 and its uniform bound is about 0.2191. The idealized linear forward factor is "}<InlineMath>{"100(0.016)=1.6"}</InlineMath>{", while the backward factor is "}<InlineMath>{"25(0.016)=0.4"}</InlineMath>{". Xavier compromises; it cannot preserve both exactly when dimensions differ. In extreme aspect ratios one of those factors can be arbitrarily small."}</Prose>

<Prose>{"For leaky ReLU with negative slope "}<InlineMath>{"a"}</InlineMath>{", the squared multiplier under symmetry is "}<InlineMath>{"(1+a^2)/2"}</InlineMath>{": the positive half keeps its square, the negative half keeps "}<InlineMath>{"a^2"}</InlineMath>{" of its square. This gives variance "}<InlineMath>{"2/[(1+a^2)n]"}</InlineMath>{". Setting "}<InlineMath>{"a=0"}</InlineMath>{" recovers ReLU. For tanh, a variance calculation near zero is only a local approximation because tanh saturates. A library's suggested tanh gain is a starting convention, not proof of constant moments at all depths. GELU and SiLU similarly deserve measurement in the actual architecture."}</Prose>

<Prose>{"Xavier's original study connects activation saturation, initialization and observed training behaviour, and motivates a diagnostic approach rather than a universal promise. "}<a href={"https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf"}>{"Glorot and Bengio, §§3–5"}</a>{""}</Prose>

<Prose>{"Here is a complete small API example:"}</Prose>

<CodeBlock language={"python"}>{"import torch\nfrom torch import nn\n\ntorch.manual_seed(7)\nhidden = nn.Linear(100, 25)\nhead = nn.Linear(25, 3)\nnn.init.kaiming_normal_(hidden.weight, mode=\"fan_in\", nonlinearity=\"relu\")\nnn.init.zeros_(hidden.bias)\nnn.init.xavier_normal_(head.weight)\nnn.init.zeros_(head.bias)\nx = torch.ones(2, 100)\nlogits = head(torch.relu(hidden(x)))\nprint(logits.shape)  # torch.Size([2, 3])"}</CodeBlock>

<Prose>{"Read it against the fan figure. "}<code>{"hidden.weight"}</code>{" is the 25 × 100 matrix: 25 rows, one per output, and 100 columns, one per input. "}<code>{"kaiming_normal_"}</code>{" fills it in place with draws of std "}<InlineMath>{"\\sqrt{2/100}"}</InlineMath>{" because "}<code>{"mode=\"fan_in\""}</code>{" counts the columns. These functions change the supplied tensor without recording the initialization in the autograd graph. PyTorch assumes the matrix will be used as "}<code>{"x @ weight.T"}</code>{", with shape "}<code>{"[fan_out, fan_in]"}</code>{". If your custom matrix is stored for "}<code>{"x @ weight"}</code>{" instead, initialize its transpose so the fan calculation corresponds to the operation. "}<a href={"https://docs.pytorch.org/docs/2.14/nn.init.html"}>{"PyTorch initialization API and orientation note"}</a>{""}</Prose>

<H2>{"Average preservation can hide a collapsed direction"}</H2>

<Prose>{"Everything so far averaged over coordinates and draws. A matrix can keep the average right while treating directions very differently. Take every small change of length 1 to a two-dimensional input—together they form a circle—and multiply each by a matrix "}<InlineMath>{"M"}</InlineMath>{":"}</Prose>

<EllipseFigure />

<Prose>{"The circle becomes an ellipse. Its longest and shortest radii are the matrix's "}<strong>{"singular values"}</strong>{": its strongest and weakest directional gains. Here"}</Prose>

<div className="neural-equation"><MathBlock>{"M=\\begin{bmatrix}\\sqrt{1.9}&0\\\\0&\\sqrt{0.1}\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The mean of its squared singular values is "}<InlineMath>{"(1.9+0.1)/2=1"}</InlineMath>{", exactly the average factor Kaiming aims for. Nevertheless, it stretches the horizontal direction by about 1.378 and shrinks the vertical one to about 0.316. Repeating the same matrix makes the discrepancy much larger:"}</Prose>

<InitializationGeometryLab />

<Prose>{"Shrink the weaker gain or add layers: the vertical input fades geometrically while the average squared gain stays one, and the diagonal input turns toward the strong axis. An average scale is not a guarantee about every direction."}</Prose>

<Prose>{"There is also a distinction between averaging over draws and inspecting one draw. For a square "}<InlineMath>{"d\\times d"}</InlineMath>{" matrix with independent, zero-mean entries of variance "}<InlineMath>{"1/d"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"E_W\\|Wx\\|^2=\\|x\\|^2"}</MathBlock></div>

<Prose>{"for each fixed "}<InlineMath>{"x"}</InlineMath>{". A particular sampled matrix need not preserve that norm. Here are the 64 singular values of our saved 64-by-64 Gaussian draw:"}</Prose>

<InitializationSpectrumFigure />

<Prose>{"They run from approximately 0.00374 to 1.936: some directions are nearly erased, others nearly doubled. An orthogonal 64-by-64 matrix with gain "}<InlineMath>{"\\sqrt2"}</InlineMath>{" has all 64 singular values exactly "}<InlineMath>{"\\sqrt2\\approx1.414"}</InlineMath>{", the dashed line, so its histogram would be one bar. This is a different 64-dimensional map, not the ellipse above."}</Prose>

<Prose>{"A square orthogonal "}<InlineMath>{"Q"}</InlineMath>{" satisfies "}<InlineMath>{"Q^\\top Q=I"}</InlineMath>{", so "}<InlineMath>{"\\|Qx\\|=\\|x\\|"}</InlineMath>{" for every "}<InlineMath>{"x"}</InlineMath>{": it rotates or reflects the circle without stretching it, so all its singular values are one. The program's QR construction, built in "}<a href="#orthogonal-construction">{"the next section"}</a>{", checks this identity to maximum absolute error "}<InlineMath>{"8.9\\times10^{-16}"}</InlineMath>{" in float64. For a tall matrix, orthonormal columns can preserve input norms. For a wide matrix mapping to fewer dimensions, some input directions must be lost."}</Prose>

<Prose>{"The next operation still matters. To follow a small change through a nonlinear step we need its "}<strong>{"Jacobian"}</strong>{" ("}<a href={jacobianLink}>{"Matrix Calculus"}</a>{" owns the full treatment): the matrix whose entry in row "}<InlineMath>{"j"}</InlineMath>{", column "}<InlineMath>{"i"}</InlineMath>{" says how much output "}<InlineMath>{"j"}</InlineMath>{" moves per unit nudge of input "}<InlineMath>{"i"}</InlineMath>{", at the current point. For a linear map the Jacobian is the matrix itself. For ReLU it is diagonal: 1 where a unit is on, 0 where it is off. Here is "}<InlineMath>{"f(x)=\\operatorname{ReLU}(\\sqrt2x)"}</InlineMath>{" around "}<InlineMath>{"x=(-1,1)"}</InlineMath>{":"}</Prose>

<ReluJacobianFigure />

<Prose>{"At this point the first coordinate's unit is off, so every horizontal nudge maps to zero, while the vertical one is stretched by "}<InlineMath>{"\\sqrt2"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"J_f=\\begin{bmatrix}0&0\\\\0&\\sqrt2\\end{bmatrix}."}</MathBlock></div>

<Prose>{"One local direction is completely blocked: nudging the first coordinate changes nothing while its unit is off. The total input and output norms happen to agree at that particular point, which makes it a useful counterexample to judging the Jacobian from a single norm. At a coordinate exactly zero the derivative is not unique; PyTorch uses 0 there."}</Prose>

<Prose>{"Keeping the singular values of a network's full input-output Jacobian close to one is the idea of "}<strong>{"dynamical isometry"}</strong>{". The linear and nonlinear cases require different conditions. Orthogonal initialization is useful evidence about an individual linear map, not a certificate that an entire ReLU network has this property. "}<a href={"https://arxiv.org/pdf/1312.6120"}>{"Saxe et al., dynamical-isometry discussion"}</a>{""}</Prose>

<H2>{"Construct an orthogonal draw, then match a width-aware optimizer"}</H2>

<Prose>{"The scale formula tells us what to sample; an orthogonal initializer instead constrains a whole matrix. This section builds that matrix; the width-aware optimizer in the heading is taken up in the μP section, which reuses the same bridge program. The construction takes four steps:"}</Prose>

<OrthogonalStepsFigure />

<Prose>{"For a matrix with more rows than columns, sample a Gaussian matrix, take reduced QR, and multiply each column of Q by the sign of the matching diagonal of R. The sign choice removes the QR routine's arbitrary sign convention. For more columns than rows, construct the tall counterpart and transpose it. Multiply by the requested gain last. The complete "}<a href={"/learn-assets/weight-initialization-xavier-kaiming-p/initialization_library_bridge.py"}>{"initialization bridge"}</a>{" exposes both cases:"}</Prose>

<CodeBlock language={"python"}>{"def orthogonal_matrix(rows, columns, gain=1.0, generator=None):\n    tall = torch.randn(max(rows, columns), min(rows, columns),\n                       dtype=torch.float64, generator=generator)\n    basis, triangular = torch.linalg.qr(tall, mode=\"reduced\")\n    signs = torch.where(triangular.diagonal() < 0, -1.0, 1.0)\n    basis = basis * signs\n    return gain * (basis if rows >= columns else basis.T)"}</CodeBlock>

<Prose>{"This uses the QR factorization already taught in "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu"}>{"Matrix Decompositions"}</a>{"; it does not hide initialization inside "}<code>{"orthogonal_"}</code>{". With gain g, test "}<code>{"Q.T @ Q = g²I"}</code>{" for tall matrices and "}<code>{"Q @ Q.T = g²I"}</code>{" for wide ones. Testing the wrong identity would claim preservation in a dimension the map cannot preserve. Reduced QR costs O(max(m,n) min(m,n)²) arithmetic and O(mn) storage. This is a dense matrix construction, not a special accelerator kernel."}</Prose>

<Prose>{"Run "}<code>{"python initialization_library_bridge.py"}</code>{" with PyTorch. It compares rectangular Gram contracts against "}<code>{"nn.init.orthogonal_"}</code>{". Identical seeds need not yield identical wide matrices when routines draw arrays in different shapes; the meaningful comparison here is the distribution/construction contract and Gram identity. The same file also contains the μP library comparison, explained after the μP derivation."}</Prose>

<InitializationProgram file="initialization_library_bridge.py" title="Read the complete orthogonal and μP library bridge" />

<Prose>{""}<strong>{"Implement a changed case."}</strong>{" Use a 3×7 orthogonal draw with gain 0.5. Which identity should the comparison check, and which directions can it preserve?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Distinguish output-row orthogonality from preserving every seven-dimensional input direction."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"The matrix is wide, so the Gram check is "}<code>{"Q @ Q.T = 0.25 I₃"}</code>{"; "}<code>{"Q.T @ Q"}</code>{" has rank at most three and cannot equal a multiple of "}<InlineMath>{"I_7"}</InlineMath>{". Only a three-dimensional subspace of inputs keeps its length, scaled by 0.5; the other four input directions map to zero. A passing shape check alone does not establish the identity."}</Prose>

</details>

<H2>{"Why equal hidden units can stay equal"}</H2>

<Prose>{"Suppose two hidden units have identical incoming weights and biases, the same activation, and identical outgoing weights. Interchanging the units changes nothing, so on the same example they receive the same gradients, and an identical update preserves their equality: two slots have learned one feature twice. Here is that network—one input, two tanh units, one output—with input 1, target 1 and loss half squared error:"}</Prose>

<InitializationSymmetryLab />

<Prose>{"The amber labels are the weights: "}<InlineMath>{"w_1,w_2"}</InlineMath>{" into the units and "}<InlineMath>{"v_1,v_2"}</InlineMath>{" out of them; the violet circles are computed values. With "}<InlineMath>{"w=0.2"}</InlineMath>{" and "}<InlineMath>{"v=0.3"}</InlineMath>{" for both units, both incoming gradients are −0.25417. Choose “distinct units” to change the incoming weights to 0.1 and 0.3: the gradients become −0.26218 and −0.24234. Deliberately different deterministic values already break this symmetry; randomness is convenient, not logically necessary."}</Prose>

<Prose>{"“Never initialize anything to zero” is too broad. Choose “distinct, zero head”: with distinct tanh features and zero outgoing weights, the first incoming gradients are zero, but the outgoing gradients are −0.09967 and −0.29131. The head can move first and open a later gradient route into the features. Apply one step and watch the incoming gradients become nonzero. This is related to the zero-initialized LoRA output factor from the preceding lesson."}</Prose>

<Prose>{"An all-zero hidden ReLU network is a different case. Its features are zero, and PyTorch's ReLU derivative at zero is zero. The digit experiment below leaves such a model predicting equal classes. The useful question is which paths can learn on the first and subsequent updates."}</Prose>

<H2>{"Run a complete initialization comparison on real inputs"}</H2>

<Prose>{"Now test these recipes where training happens. The experiment trains this small digit classifier:"}</Prose>

<DigitArchitectureStrip />

<Prose>{"Each input is an 8-by-8 image of a real handwritten digit, flattened to 64 pixels and divided by the known feature-range maximum, 16. Four hidden layers of 32 ReLU units follow, then a ten-logit head. The six initialization choices change only the four amber hidden matrices, through "}<code>{"fill_weight"}</code>{", the same function the twenty-layer probe uses. The 280 training and 120 validation samples are identical across choices. The optimizer is "}<a href={adamLink}>{"Adam"}</a>{", which divides each weight's gradient by a running estimate of its own size; it uses learning rate 0.003 for 300 full-batch updates."}</Prose>

<Prose>{""}<a href={"/learn-assets/weight-initialization-xavier-kaiming-p/./initialization-experiments.py"}>{"Download the complete CPU program"}</a>{" together with "}<a href={"/learn-assets/weight-initialization-xavier-kaiming-p/./digits-400.csv"}>{"digits-400.csv"}</a>{". The "}<a href={"/learn-assets/weight-initialization-xavier-kaiming-p/./data-provenance.md"}>{"provenance and protocol"}</a>{" describe the real handwritten digits and exact split. The file contains 400 samples from UCI's optical digit dataset, not MNIST. In an environment containing PyTorch, NumPy, and scikit-learn:"}</Prose>

<CodeBlock language={"text"}>{"python initialization-experiments.py"}</CodeBlock>

<Prose>{"The program includes imports, data loading, all model definitions, deterministic splits and initialization generators, optimization, metric calculations, and output recording. It needs no pretrained download. The prepared outputs were executed with Python 3.12, PyTorch 2.14.0+cpu, NumPy 2.3.5, and scikit-learn 1.9.1. Reproduction in another version can differ slightly."}</Prose>

<InitializationProgram /><div className="init-code-links"><a href={initializationAsset + "calculated-inputs.json"}>Complete measured record</a><a href={initializationAsset + "native-verification.json"}>Execution checks and environment</a></div>

<Prose>{"In the program, "}<code>{"DigitMLP"}</code>{" is the model drawn above, and "}<code>{"digit_fits"}</code>{" records cross-entropy and correct counts before training and after 1, 10, 100, and 300 updates. Cross-entropy measures assigned probability, while the correct count uses the largest logit. Neither alone describes every error. Actual seed-1 final results:"}</Prose>

<NeuralTable caption={"Seed 1 digit fits after 300 updates: training and validation cross-entropy, validation correct"} headers={[<>{"Hidden initialization"}</>,<>{"Training CE"}</>,<>{"Validation CE"}</>,<>{"Validation correct / 120"}</>]} rows={[[<>{"Zero"}</>,<>{"2.302586"}</>,<>{"2.302585"}</>,<>{"12"}</>],[<>{"Normal, std 0.01"}</>,<>{"0.002644"}</>,<>{"0.933934"}</>,<>{"106"}</>],[<>{"Xavier"}</>,<>{"0.000274"}</>,<>{"0.220745"}</>,<>{"116"}</>],[<>{"Kaiming"}</>,<>{"0.000303"}</>,<>{"0.175867"}</>,<>{"117"}</>],[<>{"Orthogonal, gain "}<InlineMath>{"\\sqrt2"}</InlineMath>{""}</>,<>{"0.000298"}</>,<>{"0.124550"}</>,<>{"117"}</>],[<>{"Normal, std 0.5"}</>,<>{"0.001471"}</>,<>{"0.778704"}</>,<>{"105"}</>]]} />

<Prose>{"Zero initialization's cross-entropy 2.3026 is "}<InlineMath>{"\\ln 10"}</InlineMath>{": equal probability for all ten digits, so it never left its start. Across three seeds, Kaiming gives 116–117 correct and orthogonal gives 116–118; Xavier gives 113–117. These small differences are not evidence for a universal winner. The much poorer small/large validation CE shows that fitting the training set is not the same as assigning good probabilities on other examples. Each fit's recorded checkpoints:"}</Prose>

<InitializationTrainingLab />

<Prose>{"The tiny initialization eventually learns in this four-hidden-layer model: the per-layer factor 0.0032 compounds over four layers, not twenty, and Adam rescales small gradients. That does not contradict the twenty-layer probe; the depths and questions differ."}</Prose>

<Prose>{""}<strong>{"Try a changed experiment:"}</strong>{" keep the split and seed fixed, change only the number of hidden layers, and record the initial signal statistics before training. Inspect how the changed depth alters the measured forward and backward statistics. Inspect both early optimization and final validation, and record your change as a new experiment rather than replacing the prepared observations. Repeated validation comparisons consume development information; this packet does not provide a final test estimate."}</Prose>

<H2>{"μP: changing width changes more than parameter count"}</H2>

<Prose>{"Suppose a learning rate worked well in a 32-unit network. Can you tune cheaply there and reuse it in a 128-unit network? Kaiming already keeps the forward signal steady as width grows, because "}<InlineMath>{"s^2=2/n"}</InlineMath>{" shrinks exactly as the number of terms grows. The trouble is the first training step."}</Prose>

<Prose>{"A forward sum of independent zero-mean random terms tends to grow like the square root of their count. A learning update is different: it is correlated with the inputs that produced its gradient. Summing those correlated changes can grow like the count itself. Four ±1 inputs make this concrete; the gradient contributions add even though the inputs alternate signs:"}</Prose>

<CorrelatedUpdateFigure />

<Prose>{"In general, if "}<InlineMath>{"z=\\sum_iw_ix_i"}</InlineMath>{", "}<InlineMath>{"w=0"}</InlineMath>{", "}<InlineMath>{"y=1"}</InlineMath>{" and every "}<InlineMath>{"x_i"}</InlineMath>{" is ±1, squared-loss gradients are "}<InlineMath>{"-x_i"}</InlineMath>{". Updating gives "}<InlineMath>{"\\Delta w_i=\\eta x_i"}</InlineMath>{" and therefore "}<InlineMath>{"\\Delta z=\\eta\\sum_i x_i^2=\\eta n"}</InlineMath>{". There is no sign cancellation. Independent zero-mean changes of magnitude "}<InlineMath>{"\\eta"}</InlineMath>{" would instead have output RMS "}<InlineMath>{"\\eta\\sqrt n"}</InlineMath>{". This is the missing link between an initialization calculation and an update calculation: the update reuses the inputs that determined the change. So an initialization that controls the first forward pass is not enough to control the size of the first learned feature change."}</Prose>

<Prose>{""}<strong>{"Maximal update parametrization"}</strong>{", written μP, coordinates initialization, forward multipliers and optimizer scaling as width changes. Its associated μTransfer procedure tunes a smaller model and transfers eligible settings under the matching parametrization. It does not mean that every finite model has exactly the same best learning rate, nor that a rule derived for Adam can simply be copied into SGD. "}<a href={"https://arxiv.org/abs/2203.03466"}>{"μTransfer paper"}</a>{", "}<a href={"https://github.com/microsoft/mup"}>{"Microsoft's implementation and coordinate-check guide"}</a>{""}</Prose>

<Prose>{"Here is the exact restricted case in "}<code>{"WidthMLP"}</code>{": a bias-free 64→"}<InlineMath>{"n"}</InlineMath>{"→"}<InlineMath>{"n"}</InlineMath>{"→10 MLP with two ReLUs, fixed input/output sizes, base width "}<InlineMath>{"n_0=32"}</InlineMath>{", and width multiplier "}<InlineMath>{"m=n/n_0"}</InlineMath>{". From here on, "}<InlineMath>{"n"}</InlineMath>{" and "}<InlineMath>{"m"}</InlineMath>{" no longer mean fan-in and fan-out: "}<InlineMath>{"n"}</InlineMath>{" is the hidden width and "}<InlineMath>{"m"}</InlineMath>{" its ratio to 32. Before the rules, look at what grows when "}<InlineMath>{"n"}</InlineMath>{" grows:"}</Prose>

<WidthShapesFigure />

<Prose>{"Each rectangle is one weight matrix drawn to scale: rows are outputs, columns are the inputs each output sums, marked Σ. An amber edge is an axis that grows with width; a grey edge is fixed at 64 input pixels or 10 digit classes. The input matrix sums 64 pixels for every hidden unit, whatever the width; only its number of rows grows. The hidden matrix sums "}<InlineMath>{"n"}</InlineMath>{" inputs per unit and has "}<InlineMath>{"n"}</InlineMath>{" units. The readout sums "}<InlineMath>{"n"}</InlineMath>{" inputs for each of 10 fixed logits. Any sum over a growing axis is where a correlated update can grow with width."}</Prose>

<Prose>{"The optimizer here is Adam, and it enters the argument in a specific way. Here is one hidden unit after Adam's first step:"}</Prose>

<AdamUnitFigure />

<Prose>{"Adam divides each weight's gradient by a running estimate of that gradient's own size. On its first step this makes the move "}<InlineMath>{"-\\eta\\,g/(|g|+\\epsilon)"}</InlineMath>{", which is "}<InlineMath>{"\\eta"}</InlineMath>{" in the helpful direction for every entry whose gradient is much larger than "}<InlineMath>{"\\epsilon"}</InlineMath>{". For one hidden unit the gradient of the weight on input "}<InlineMath>{"i"}</InlineMath>{" is "}<InlineMath>{"g=\\delta\\,h_i"}</InlineMath>{": every active input's weight moves the same way, the +η labels, and inactive inputs move nothing. The unit's score therefore changes by "}<InlineMath>{"\\eta"}</InlineMath>{" times the number of active inputs, "}<InlineMath>{"4\\eta"}</InlineMath>{" in the drawing; no sign cancels. With half of "}<InlineMath>{"n"}</InlineMath>{" inputs active, standard training changes it by "}<InlineMath>{"\\eta n/2"}</InlineMath>{":"}</Prose>

<AdamWidthTable />

<Prose>{"A unit at width 128 moves four times as much as at width 32, although every individual weight moved by the same "}<InlineMath>{"\\eta"}</InlineMath>{". Dividing the hidden rate by "}<InlineMath>{"m"}</InlineMath>{", and dividing the readout's input by "}<InlineMath>{"m"}</InlineMath>{", keeps both first changes at 0.048 at every width. The rules in the table below follow from that picture:"}</Prose>

<NeuralTable caption={"Standard and μP conventions for the restricted width model"} headers={[<>{"Component"}</>,<>{"Standard comparison"}</>,<>{"μP convention used here"}</>]} rows={[[<>{"Input weight std"}</>,<>{""}<InlineMath>{"\\sqrt{2/64}"}</InlineMath>{""}</>,<>{"same"}</>],[<>{"Hidden-to-hidden weight std"}</>,<>{""}<InlineMath>{"\\sqrt{2/n}"}</InlineMath>{""}</>,<>{"same"}</>],[<>{"Raw readout weight std"}</>,<>{""}<InlineMath>{"1/\\sqrt n"}</InlineMath>{""}</>,<>{""}<InlineMath>{"1/\\sqrt{n_0}"}</InlineMath>{""}</>],[<>{"Readout input"}</>,<>{""}<InlineMath>{"h"}</InlineMath>{""}</>,<>{""}<InlineMath>{"h/m"}</InlineMath>{""}</>],[<>{"Adam input learning rate"}</>,<>{""}<InlineMath>{"\\eta"}</InlineMath>{""}</>,<>{""}<InlineMath>{"\\eta"}</InlineMath>{""}</>],[<>{"Adam hidden learning rate"}</>,<>{""}<InlineMath>{"\\eta"}</InlineMath>{""}</>,<>{""}<InlineMath>{"\\eta/m"}</InlineMath>{""}</>],[<>{"Adam raw-readout learning rate"}</>,<>{""}<InlineMath>{"\\eta"}</InlineMath>{""}</>,<>{""}<InlineMath>{"\\eta"}</InlineMath>{""}</>]]} />

<Prose>{"Row by row: the input matrix's sum never grows, so nothing changes. The hidden matrix's sum grows, so its Adam rate is divided by "}<InlineMath>{"m"}</InlineMath>{". The readout's sum grows too, but μP handles it in the forward pass instead, by dividing the readout's input by "}<InlineMath>{"m"}</InlineMath>{"; its raw weights keep the base-width std so that division does not shrink them twice. The raw μP readout is deliberately distinguished from its "}<strong>{"effective"}</strong>{" multiplication by "}<InlineMath>{"1/m"}</InlineMath>{": leaving out that multiplier changes the model. At the base width "}<InlineMath>{"m=1"}</InlineMath>{", both columns describe exactly the same training procedure. To apply the table at any width, for example to check practice 5, choose a width here:"}</Prose>

<WidthRecipeLab />

<Prose>{"A readout has one dimension that grows with width; the middle matrix has two. The package calls these its infinite dimensions because it tracks what happens as width grows. This table follows the corresponding readout and hidden-matrix conventions of "}<code>{"MuReadout"}</code>{" and "}<code>{"MuAdam"}</code>{" for this architecture; the package's README states the hidden Adam rate as the global rate divided by "}<code>{"fan_in / base_fan_in"}</code>{", our "}<InlineMath>{"m"}</InlineMath>{". The program makes the rules explicit to keep the example runnable without another dependency. For tied parameters, multiple changing dimensions, biases, attention, a different optimizer, or an existing architecture, use and inspect the package's base-shape machinery rather than treating this class as a generic replacement. "}<a href={"https://github.com/microsoft/mup/blob/main/mup/layer.py"}>{"Readout implementation"}</a>{", "}<a href={"https://github.com/microsoft/mup/blob/main/mup/optim.py"}>{"optimizer implementation"}</a>{""}</Prose>

<Prose>{"The complete experiment fits widths 32, 64, and 128 with learning rates 0.001, 0.003, and 0.01, for both parametrizations and three seeds. Each fit uses 150 full-batch updates on the same digit split. These are 54 small CPU fits. Mean final validation cross-entropy across the three seeds:"}</Prose>

<NeuralTable caption={"Mean final validation cross-entropy over three seeds, by width and learning rate"} headers={[<>{"Parametrization"}</>,<>{"Width"}</>,<>{"LR 0.001"}</>,<>{"LR 0.003"}</>,<>{"LR 0.01"}</>]} rows={[[<>{"Standard"}</>,<>{"32"}</>,<>{"0.25880"}</>,<>{""}<strong>{"0.10939"}</strong>{""}</>,<>{"0.11739"}</>],[<>{"Standard"}</>,<>{"64"}</>,<>{"0.12406"}</>,<>{""}<strong>{"0.10485"}</strong>{""}</>,<>{"0.12290"}</>],[<>{"Standard"}</>,<>{"128"}</>,<>{""}<strong>{"0.08466"}</strong>{""}</>,<>{"0.08567"}</>,<>{"0.12092"}</>],[<>{"μP"}</>,<>{"32"}</>,<>{"0.25880"}</>,<>{""}<strong>{"0.10939"}</strong>{""}</>,<>{"0.11739"}</>],[<>{"μP"}</>,<>{"64"}</>,<>{"0.20471"}</>,<>{""}<strong>{"0.09638"}</strong>{""}</>,<>{"0.11020"}</>],[<>{"μP"}</>,<>{"128"}</>,<>{"0.19483"}</>,<>{""}<strong>{"0.08208"}</strong>{""}</>,<>{"0.09354"}</>]]} />

<Prose>{"The narrow-model choice, 0.003, remains best among these three candidates at the larger μP widths. In the standard width-128 run, 0.001 has slightly lower average CE than 0.003; the difference is only about 0.00101. This is an illustrative local experiment over three candidate rates: it neither proves exact transfer nor finds the global optimum, and it does not measure a compute or memory speedup."}</Prose>

<Prose>{"A "}<strong>{"coordinate check"}</strong>{" inspects activation magnitudes as width changes, before spending a long run on tuning. The program records mean absolute values of five corresponding tensors at steps 0, 1, 2, 5, and 150 on the same 32 training examples. The question is whether a tensor keeps a similar typical size as width grows, once training has had time to act. The lab opens after 150 updates on the output logits, where the two parametrizations differ most:"}</Prose>

<CoordinateCheckLab />

<Prose>{"Now choose update 0 in the lab to see the starting point. For seed 1 and learning rate 0.01, the μP mean absolute output at initialization is 0.381, 0.308, and 0.170 for widths 32, 64, and 128. It is not flat, and the Adam calculation above explains why: the readout's division by "}<InlineMath>{"m"}</InlineMath>{" shrinks the random initial logits by about "}<InlineMath>{"1/\\sqrt m"}</InlineMath>{" before correlated updates develop. A sum of "}<InlineMath>{"n"}</InlineMath>{" terms with fixed-std weights has RMS proportional to "}<InlineMath>{"\\sqrt n"}</InlineMath>{", and dividing by "}<InlineMath>{"m"}</InlineMath>{" leaves "}<InlineMath>{"1/\\sqrt m"}</InlineMath>{" of the base value; the random draws make the measured shrinkage uneven between widths:"}</Prose>

<InitialLogitTable />

<Prose>{"The official guide's “curves stay horizontal” criterion is about coordinates after training steps, and it names this exception: the output can shrink at initialization at a 1/√width rate. Demanding exact equality at step zero would reject a valid behaviour. The package also offers "}<code>{"readout_zero_init=True"}</code>{", which starts the readout at zero and removes the step-0 difference altogether; the lesson's experiment keeps the random readout so the shrinkage stays visible."}</Prose>

<Prose>{"The training steps are where the check is decided. After 150 updates the μP output logits are 6.906, 7.368 and 6.694 at widths 32, 64 and 128: roughly flat. The standard logits are 6.906, 9.729 and 12.254: they grow with width, nearly doubling from 32 to 128. The same split is already visible after 5 updates (μP 0.421, 0.376, 0.288; standard 0.421, 0.625, 1.069). Now choose “second ReLU”: after 150 updates both parametrizations stay comparable (μP 3.355, 3.058, 2.970; standard 3.355, 2.933, 2.836), because the hidden activations were never the problem. The logits are the tensor whose sum over a growing width receives correlated updates, which is why they are the row to watch. So μP passes this coordinate check, and the step-0 shrinkage is the intended initial scaling, not a failure."}</Prose>

<H3>{"Compare with Microsoft's mup package"}</H3>

<Prose>{"Continue with "}<code>{"python initialization_library_bridge.py --mup"}</code>{" in an environment containing Microsoft's "}<code>{"mup"}</code>{" package. That optional branch reuses "}<code>{"WidthMLP"}</code>{" directly from the adjacent experiment file without rerunning its training sweep. Its ordinary model substitutes "}<code>{"MuReadout"}</code>{", calls "}<code>{"set_base_shapes"}</code>{" with widths 32 and 64 to identify changing axes, copies the scratch model's already-parametrized weights using "}<code>{"rescale_params=False"}</code>{", and constructs "}<code>{"MuAdam"}</code>{". The input matrix has one changing axis, the hidden matrix two, and the readout one, as in the matrix figure. Those annotations determine which optimizer group receives the width-divided rate. The readout performs the forward division."}</Prose>

<Prose>The supplied comparison uses widths 32 and 96, identical inputs and targets, zero initial optimizer state and two Adam updates. The executed run with PyTorch 2.14.0+cpu and Microsoft’s <code>mup==1.0.0</code> passes output, every parameter-gradient and updated-weight agreement at absolute/relative tolerances 1e−12. Turning parameter rescaling back on <strong>after</strong> copying the custom μP weights changes the experiment. <a href="https://github.com/microsoft/mup/blob/main/mup/layer.py">Readout</a>, <a href="https://github.com/microsoft/mup/blob/main/mup/shape.py">shape registration</a> and <a href="https://github.com/microsoft/mup/blob/main/mup/optim.py">optimizer source</a> expose the mapping. <a href={initializationAsset + 'native-verification.json'}>Executed environment and comparison record</a>.</Prose><Prose>Set up a separate environment with <code>python -m venv .venv</code>, activate it using your operating system’s command, then install <code>torch==2.14.0 numpy==2.3.5 scikit-learn==1.9.1 mup==1.0.0</code> with <code>python -m pip install</code>. Keep both Python files beside the CSV; the bridge imports <code>WidthMLP</code> without launching its training sweep.</Prose>

<Prose>The Microsoft repository was marked archived on 21 September 2026. The pinned <code>mup==1.0.0</code> API is verified for this comparison; the reference link does not imply ongoing package maintenance. Preserve the tested environment and check compatibility before using a different version.</Prose>

<Prose>{""}<strong>{"Implement a changed case."}</strong>{" Change the μP target width to 160 with base Adam rate 0.003. Which rates and forward divisor should the comparison check?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The width ratio is measured against 32; count each matrix's growing axes."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"The width ratio is five. Input and readout rates remain 0.003, the hidden matrix rate becomes 0.0006, and the raw readout divides its input by five. Preserve the same copied state and compare two updates against "}<code>{"MuAdam"}</code>{". A passing shape check alone does not establish those identities."}</Prose>

</details>

<H2>{"Deeper tools and practical failure checks"}</H2>

<Prose>{""}<strong>{"Data-dependent initialization."}</strong>{" LSUV starts with orthogonal weights, sends a calibration batch through successive layers, and rescales each layer toward a chosen output variance. This adapts to an observed distribution rather than only an assumed one. The procedure is bounded by a tolerance and maximum iteration count. A zero or tiny variance needs a diagnostic stop, not division by zero. Calibration on training inputs is legitimate; using a held-out evaluation distribution to fit those scales consumes that information. The chosen measurement point—before or after an activation—must be explicit. "}<a href={"https://arxiv.org/pdf/1511.06422"}>{"LSUV, Algorithm 1"}</a>{""}</Prose>

<Prose>{"For the simplest rescaling arithmetic, a linear output with measured variance 9 can be divided by 3 to reach variance 1. Dividing weights by 9 would instead reduce variance to 1/9. With intervening nonlinearities or nonzero biases, measure the actual next pass rather than assume this linear calculation still describes it. Once an earlier layer changes, recompute the later layer's input before calibrating that later layer."}</Prose>

<Prose>{""}<strong>{"Residual initialization."}</strong>{" A residual block computes "}<InlineMath>{"x+F(x)"}</InlineMath>{": a learned correction "}<InlineMath>{"F"}</InlineMath>{" added to its unchanged input. Making "}<InlineMath>{"F"}</InlineMath>{" initially small can begin near a usable identity map. Fixup uses a coordinated recipe including depth-scaled earlier branch weights, zero final branch/classification layers, and specified scalar multipliers and biases. For a branch containing "}<InlineMath>{"r"}</InlineMath>{" weight layers, its earlier branch weights use a factor "}<InlineMath>{"L^{-1/(2r-2)}"}</InlineMath>{", where "}<InlineMath>{"L"}</InlineMath>{" is the number of residual branches. For example, with "}<InlineMath>{"r=2"}</InlineMath>{" weight layers per branch and "}<InlineMath>{"L=16"}</InlineMath>{" branches, the factor is "}<InlineMath>{"16^{-1/2}=0.25"}</InlineMath>{": the first branch layer starts at its He initialization times 0.25, the second branch layer starts at zero, each scalar multiplier starts at 1 and each added bias at 0. With "}<InlineMath>{"r=3"}</InlineMath>{" the factor becomes "}<InlineMath>{"16^{-1/4}=0.5"}</InlineMath>{", so the exponent depends on the branch's depth. The next lesson draws that block and its two paths. "}<a href={"https://arxiv.org/pdf/1901.09321"}>{"Fixup, §3"}</a>{""}</Prose>

<Prose>{""}<strong>{"Truncated normal is not clipping."}</strong>{" Draws outside the interval are redrawn; they do not pile up at the endpoints:"}</Prose>

<TruncationFigure />

<Prose>{"In "}<code>{"trunc_normal_"}</code>{", bounds are absolute values. With "}<code>{"std=0.02"}</code>{", the default bounds −2 and 2 are one hundred standard deviations away. To truncate at two standard deviations, specify −0.04 and 0.04. In the program's 100,000-value float64 sample, these choices produce standard deviations about 0.02000 and 0.01758 respectively. The truncated distribution has less variance; the function does not silently restore 0.02 afterward. "}<a href={"https://docs.pytorch.org/docs/2.14/nn.init.html#torch.nn.init.trunc_normal_"}>{"PyTorch truncated-normal contract"}</a>{""}</Prose>

<TruncationTable />

<Prose>{""}<strong>{"Small numbers and precision."}</strong>{" BF16's reduced precision does not mean every number below 0.001 becomes zero. It has a broad exponent range. In our conversion fixture, "}<InlineMath>{"10^{-5}"}</InlineMath>{", "}<InlineMath>{"10^{-6}"}</InlineMath>{", and "}<InlineMath>{"10^{-8}"}</InlineMath>{" all remain nonzero in BF16. The last becomes zero in float16. Loss of a small update when added to a much larger weight is a different issue from representing the small value by itself. Measure the operation you are concerned about."}</Prose>

<PrecisionTable />

<Prose>{""}<strong>{"Normalization and defaults."}</strong>{" Normalization can change activation scale, but its axes, epsilon, affine parameters, and Jacobian still matter. It does not certify that all initial gradients or update sizes are useful. Inspect the actual module rather than relying on a catalogue of alleged architecture defaults: for example, PyTorch's LSTM documents a hidden-size-based uniform initialization for all its weights and biases. It does not promise a default orthogonal recurrent matrix. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.LSTM.html"}>{"LSTM initialization note"}</a>{""}</Prose>

<Prose>{"When a model fails, inspect initial preactivations, post-activation mean square, zero/saturated fractions, gradient magnitudes, and actual update-to-weight magnitudes. Check inputs, loss, and labels too. Large logits do not automatically make a stable cross-entropy implementation overflow; large finite losses, saturation elsewhere, and excessive parameter updates are separate diagnoses."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"Practice: use the mechanism on a changed case"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Initialize a wider-input layer"}</H3>

<Prose>{"A ReLU layer has 200 inputs and 50 outputs. Find the fan-in Kaiming normal standard deviation and uniform bounds. Then calculate Xavier's idealized linear forward and backward factors."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Square the standard deviation to obtain variance; uniform variance is bound squared divided by three."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Kaiming variance is "}<InlineMath>{"2/200=0.01"}</InlineMath>{", so std is 0.1 and bounds are "}<InlineMath>{"\\pm\\sqrt{0.03}\\approx\\pm0.1732"}</InlineMath>{". Xavier variance is "}<InlineMath>{"2/250=0.008"}</InlineMath>{", giving forward factor 1.6 and backward factor 0.4. Fan-out Kaiming would be a different priority, with variance "}<InlineMath>{"2/50=0.04"}</InlineMath>{"."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Repair a misleading statistic"}</H3>

<Prose>{"A layer's pooled mean square stays at 1, while its pooled mean changes from 0 to 0.8. Someone reports “the variance stayed at 1.” Correct the report."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Subtract the squared mean."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The final variance is "}<InlineMath>{"1-0.8^2=0.36"}</InlineMath>{". The second moment stayed constant. We also need to know whether the samples and coordinates were pooled consistently before comparing those measurements."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Keep average gain, lose a direction"}</H3>

<Prose>{"Construct a diagonal 2-by-2 matrix whose average squared singular value is 1 but whose smaller singular value is 0.2. Find the larger singular value and the gain after five repetitions along the smaller direction."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The two squared singular values must sum to 2."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The larger is "}<InlineMath>{"\\sqrt{1.96}=1.4"}</InlineMath>{". The smaller direction has gain "}<InlineMath>{"0.2^5=0.00032"}</InlineMath>{". Preserving the average does not protect this direction."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Follow the first update"}</H3>

<Prose>{"Two tanh hidden units have different incoming weights, but their outgoing weights are both zero. Is there no learning signal anywhere? Contrast this with an all-zero hidden ReLU network."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Trace the chain rule from the output backward, using the actual hidden features at each parameter."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The output weights can have nonzero gradients because the hidden features differ and are nonzero; earlier weights receive no gradient through the zero output weights on that first step. After the output moves, that route can open. In the all-zero ReLU case used here, the features and their chosen derivatives at zero block the relevant paths. Zero initialization must be assessed by location."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Transfer a base learning rate carefully"}</H3>

<Prose>{"For the exact bias-free μP model above, base width is 32, target width is 256, and base Adam learning rate is 0.004. Specify the three group rates, raw readout std, and forward divisor."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Find the width ratio, then follow the separate input, hidden-matrix and readout conventions."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{""}<InlineMath>{"m=8"}</InlineMath>{". Input and raw-readout rates are 0.004; the hidden matrix rate is 0.0005. Raw readout std remains "}<InlineMath>{"1/\\sqrt{32}"}</InlineMath>{"; divide its input by 8. These answers depend on the stated Adam parametrization, not a general rule for all optimizers."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Plan a useful failure investigation"}</H3>

<Prose>{"You observe a roughly constant forward mean square but a tiny gradient in an early layer. Propose two checks that distinguish explanations."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether an average scale conceals different directions, and whether the current activations pass the incoming gradient."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Inspect the local Jacobian or directional sensitivities to test whether some directions are blocked despite average scale preservation. Separately inspect activation gates/saturation and the backward signal arriving from the head. Record which scalar output or loss supplied that gradient. A single final norm cannot distinguish all these cases."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Predict a stack before running it"}</H3>

<Prose>{"A stack of ten square ReLU layers has width 64 and weights with standard deviation 0.1. The input mean square is 1. Predict the per-layer multiplier, the final mean square, and the Kaiming standard deviation that would make the multiplier one. Then say how the answer changes if the width is 256 but the standard deviation stays 0.1."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<InlineMath>{"q_{\\text{next}}=\\tfrac12ns^2q"}</InlineMath>{" and repeat it ten times."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The multiplier is "}<InlineMath>{"64(0.01)/2=0.32"}</InlineMath>{", so after ten layers "}<InlineMath>{"q\\approx0.32^{10}\\approx1.13\\times10^{-5}"}</InlineMath>{". Kaiming needs "}<InlineMath>{"s=\\sqrt{2/64}\\approx0.177"}</InlineMath>{". At width 256 the same std gives multiplier "}<InlineMath>{"256(0.01)/2=1.28"}</InlineMath>{" and "}<InlineMath>{"q\\approx1.28^{10}\\approx11.8"}</InlineMath>{": a fixed std that fades a narrow network amplifies a wide one. This is an average-over-draws prediction; a measured stack will scatter around it, as section 2's comparison showed."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Size one Adam step at two widths"}</H3>

<Prose>{"A hidden unit in the μP model receives 256 inputs, of which 96 are active with value 1 and the rest are 0. The base Adam rate is 0.002 and the base width is 32. Assuming every active weight's gradient has the same sign, find the unit's first-step score change under standard training and under μP. Repeat for 64 inputs with 24 active."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Adam's first step moves each weight with a nonzero gradient by about the rate; inactive inputs contribute nothing to the score change."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Standard, width 256: "}<InlineMath>{"0.002\\times96=0.192"}</InlineMath>{". μP divides the hidden rate by "}<InlineMath>{"m=8"}</InlineMath>{": "}<InlineMath>{"0.00025\\times96=0.024"}</InlineMath>{". Width 64, "}<InlineMath>{"m=2"}</InlineMath>{": standard "}<InlineMath>{"0.002\\times24=0.048"}</InlineMath>{", μP "}<InlineMath>{"0.001\\times24=0.024"}</InlineMath>{". With the same active fraction, μP's change is width-independent while standard training's grows fourfold. If the active fraction changed with width, the two widths would no longer match exactly; the rule controls the scaling, not every input pattern."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"Another way to learn, and what comes next"}</H2>

<ul><li>{""}<a href={"https://www.deeplearning.ai/ai-notes/initialization/"}>{"deeplearning.ai AI Notes: Initializing neural networks"}</a>{" — an interactive article whose network demo switches between zero, too-small, appropriate and too-large initializations while training, with a short derivation of keeping layer variance constant. Its derivation assumes centered, roughly linear activations (the 1/n rule); compare it with this lesson's ReLU factor of ½. The page and its derivation were read; its demos were not rerun here."}</li><li>{""}<a href={"https://d2l.ai/chapter_multilayer-perceptrons/numerical-stability-and-init.html"}>{"Dive into Deep Learning, §5.4 Numerical Stability and Initialization"}</a>{" — a textbook route through vanishing and exploding products, symmetry breaking and the Xavier compromise between fan-in and fan-out. Read it after section 3."}</li><li>{""}<a href={"https://www.youtube.com/watch?v=P6sfmUTpUmc"}>{"Andrej Karpathy, Building makemore Part 3: Activations & Gradients, BatchNorm"}</a>{" — a code-along video that inspects forward activations and backward gradients layer by layer in a small MLP, including initialization scale, tanh saturation and Kaiming-style fixes, then motivates normalization. Identified from its official listing and description; not watched for this revision."}</li><li>{""}<a href={"https://www.youtube.com/watch?v=wEoyxE0GP2M"}>{"Stanford CS231n, Lecture 6: Training Neural Networks I"}</a>{" offers a lecture-based route through activation, initialization, and normalization. The official "}<a href={"https://cs231n.stanford.edu/2017/syllabus"}>{"2017 syllabus"}</a>{" identifies its scope. Use it for intuition; this lesson's μP material and versioned API checks go beyond that lecture."}</li><li>{""}<a href={"https://www.microsoft.com/en-us/research/blog/%C2%B5transfer-a-technique-for-hyperparameter-tuning-of-enormous-neural-networks/"}>{"Microsoft Research's μTransfer article"}</a>{" explains why random forward sums and correlated training updates require different reasoning. It is a historical 2022 introduction, not a current catalogue of every supported model."}</li><li>{""}<a href={"https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf"}>{"The original Xavier paper"}</a>{" is useful after the local calculation: read the assumptions and compare its activation diagnostics with the measurements here."}</li><li>{""}<a href={"https://github.com/microsoft/mup"}>{"The μP repository"}</a>{" is the implementation route after the restricted example. Study base shapes, readout layers, optimizer choice, and coordinate checks together."}</li></ul>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals"}>{"Residual Connections & Skip Connections"}</a>{". Initialization chooses how each transformation starts. A residual connection changes how the transformations are wired: each block adds a learned correction to a direct copy of its input, so the stacked multipliers you met here no longer have to hold the whole signal by themselves."}</Prose></section>
</div>
};
