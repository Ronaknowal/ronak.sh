// Staged complete accepted manuscript. Root alone chooses publication.
import { Prose, H2, H3, CodeBlock } from "../../components/content/index.js";
import { SvmReadingFlowMathBlock as MathBlock, SvmReadingFlowInlineMath as InlineMath } from "../../components/lesson-labs/SvmReadingFlowDrawing.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import { SvmReadingFlowProvider, SvmReadingFlowFigure } from "../../components/lesson-labs/SvmReadingFlow.jsx";
export function SvmReadingFlowLesson() { return <SvmReadingFlowProvider><div className="lesson-flow svm-reading-flow">
<Prose opening="summary">{"Many lines can separate the same observations. Which leaves the widest room around its decision, and how should we respond when observations conflict? We will build the score, perpendicular distance and paid shortfall, derive a checked optimizer, change similarity through kernels and choose a complete procedure using held-out evidence."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the worked picture and calculation at the start of each section. The visible deeper branches then explain certificates, complete optimization and feature approximations; return to those derivations after tracing the local example. Read the constraint-price introduction in §4 before using its coefficients in the kernel prediction. The prerequisites are the earlier "}<a href={"/learn/path/full-curriculum/linear-logistic-regression#5-model-a-binary-outcome"}>{"binary affine-score and logistic-loss explanation"}</a>{" and "}<a href={"/learn/path/full-curriculum/vectors-matrices-tensor-operations#3-a-dot-product-and-its-geometric-meaning"}>{"dot product/projection explanation"}</a>{"; we rebuild the changed geometry and loss here."}</Prose>

<Prose>{"Imagine classifying a machine's operating state using vibration and temperature. A boundary close to an observation is easy to cross after a small measurement change. We first use constructed observations so every geometric step is visible, then keep the earlier generated studies and add one observed Wine classification task. Those three sources of evidence have different purposes: hand calculation, recorded controlled experiment and a small real-data comparison."}</Prose>

<Prose opening="exploration">{"Save complete programs with their shown filenames and run "}<code>{"python filename.py"}</code>{" in the compatible environment. Keep "}<code>{"svm_core.py"}</code>{" beside its driver "}<code>{"svm_mechanisms.py"}</code>{"; the driver uses an ordinary Python import. The other new programs are standalone. The earlier programs retain their recorded Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1 outputs; the new calculations also use NumPy2.3.5/sklearn1.9.1. Install the packages with "}<code>{"python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1"}</code>{". The browser investigations consume their declared numerical state without installation. Different solver tolerances/versions can change final digits and support counts; exact saved evidence stays identifiable."}</Prose>

<H2>{"1. A score, a boundary and a real distance"}</H2>

<H3>{"How do measurements become a signed score?"}</H3>

<Prose>{"Follow the two measurements into matching weight products and the one bias addition."}</Prose>

<SvmReadingFlowFigure job="D01" />

<Prose>{"A "}<strong>{"feature vector"}</strong>{" "}<code>{"x"}</code>{" lists one observation's measurements. A "}<strong>{"weight vector"}</strong>{" "}<code>{"w"}</code>{" says how each measurement contributes, and the "}<strong>{"bias"}</strong>{" "}<code>{"b"}</code>{" shifts the score. In this calculation, "}<code>{"x=(2,1)"}</code>{", "}<code>{"w=(1,2)"}</code>{" and "}<code>{"b=−1"}</code>{": the two products are2 and2, then the bias makes the total3. The "}<a href={"/learn/path/full-curriculum/linear-logistic-regression#5-model-a-binary-outcome"}>{"earlier binary affine-score explanation"}</a>{" used this same multiply-and-add operation. Here we encode the two labels as "}<code>{"y=−1"}</code>{" and "}<code>{"y=+1"}</code>{"."}</Prose>

<Prose>{"Writing a dot for the sum of matching coordinate products gives "}<code>{"f(x)=w·x+b"}</code>{". A positive score predicts+1 and a negative score predicts−1. Our scratch solver assigns exact zero to+1; an ordinary library's exact-tie rule is a separate contract. These labels identify sides, not probabilities."}</Prose>

<H3>{"Where does a score change its sign?"}</H3>

<Prose>{"Locate each observation, the zero-score line and its perpendicular normal in the same coordinate plane."}</Prose>

<SvmReadingFlowFigure job="D02" />

<Prose>{"The six observations above keep their names and labels when we move the boundary. With the initial "}<code>{"w=(1,0),b=0"}</code>{", A/B/C lie on the negative side and D/E/F on the positive side. The set "}<code>{"f(x)=0"}</code>{" is a line in two dimensions and a "}<strong>{"hyperplane"}</strong>{" in more dimensions. Displacements along that line have zero dot product with "}<code>{"w"}</code>{", so "}<code>{"w"}</code>{" is perpendicular to it. Changing the angle rotates that normal; changing the offset shifts where the zero-score line crosses it."}</Prose>

<H3>{"What is the shortest move to the boundary?"}</H3>

<Prose>{"Trace the point, perpendicular segment, true foot and right-angle marker before reading the formula."}</Prose>

<SvmReadingFlowFigure job="D03" />

<Prose>{"We temporarily return to the two-product score from the first picture so the projection can be checked by hand. The "}<a href={"/learn/path/full-curriculum/vectors-matrices-tensor-operations#3-a-dot-product-and-its-geometric-meaning"}>{"earlier dot product and projection explanation"}</a>{" projects onto a line through the origin. Our boundary has an added bias, so we solve for its actual foot locally. Moving parallel to "}<code>{"w"}</code>{" reaches "}<code>{"(2,1)−.6(1,2)=(1.4,−.2)"}</code>{". Its score is "}<code>{"1.4+2(−.2)−1=0"}</code>{", and the moved segment has length "}<code>{"sqrt(.6²+1.2²)=3/sqrt5"}</code>{"."}</Prose>

<Prose>{"The vector w points perpendicular to the boundary. Its length is ‖w‖. To reach the boundary from x by the shortest route, move along w: write the destination as x−t w and solve w·(x−t w)+b=0. This gives t=f(x)/‖w‖². Consequently:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}x_{\\rm projected}&=x-\\frac{f(x)}{\\|w\\|^2}w,\\\\d_{\\rm signed}(x)&=\\frac{f(x)}{\\|w\\|},\\\\d_{\\rm label}(x,y)&=\\frac{y f(x)}{\\|w\\|}.\\end{aligned}"}</MathBlock></div>

<Prose>{"Signed distance tells which side contains "}<code>{"x"}</code>{". "}<strong>{"Label-signed distance"}</strong>{" multiplies that sign by its observed label: it is positive when the side agrees and negative when it does not. These distances require "}<code>{"w≠0"}</code>{"; a constant score has no normal or geometric corridor. A raw score equals signed distance only when the weight length is one."}</Prose>

<H3>{"Can a larger score describe the same boundary?"}</H3>

<Prose>{"Compare the same point and foot with two score rulers and weight lengths."}</Prose>

<SvmReadingFlowFigure job="D04" />

<Prose>{"Multiplying "}<code>{"w"}</code>{" and "}<code>{"b"}</code>{" by3 changes the score3 to9 and the norm "}<code>{"sqrt5"}</code>{" to "}<code>{"3sqrt5"}</code>{". Their ratio is unchanged, and the projected point remains "}<code>{"(1.4,−.2)"}</code>{". Any strictly positive common multiplier preserves the boundary and predictions; a negative multiplier reverses the label sides. In the six-point scene, change scale first, then rotate the boundary: a signed distance can become negative when the observation crosses to the wrong labelled side."}</Prose>

<Prose>{"The following complete earlier program retains its original inputs and output. Compute the dot product, norm, residual and foot in the order shown; no optimizer is needed for this geometry."}</Prose>

<Prose>{"If every weight and the bias are multiplied by three, which printed quantities should change?"}</Prose>

<Prose>{""}<strong>{"margin-projection.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/margin-projection.py" filename="margin-projection.py" title="The score changes; the perpendicular distance does not" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="margin-projection-output.txt" title="Recorded output">{"scale=1 score=3.0 distance=1.341641\nprojection: [1.4, -0.2]\nboundary residual=0.000000\nscale=3 score=9.0 distance=1.341641\nprojection: [1.4, -0.2]\nboundary residual=-0.000000"}</CodeBlock>

<H3>{"Which score scale makes corridor widths comparable?"}</H3>

<Prose>{"Follow the least signed observation into a canonical score of1, then read both perpendicular width brackets."}</Prose>

<SvmReadingFlowFigure job="D05" />

<Prose>{"For a finite strictly separated training set, the smallest label-signed "}<strong>{"score"}</strong>{" "}<code>{"m=min yᵢf(xᵢ)"}</code>{" is positive. Divide "}<code>{"w"}</code>{" and "}<code>{"b"}</code>{" by "}<code>{"m"}</code>{". The same boundary now satisfies "}<code>{"yᵢf(xᵢ)≥1"}</code>{", with at least one equality. This fixes the arbitrary score scale. The two parallel levels "}<code>{"f=−1"}</code>{" and "}<code>{"f=+1"}</code>{" are each "}<code>{"1/‖w‖"}</code>{" from the central boundary: the "}<strong>{"one-sided margin"}</strong>{" is "}<code>{"1/‖w‖"}</code>{", and the "}<strong>{"full corridor"}</strong>{" is "}<code>{"2/‖w‖"}</code>{". In the initial six-point scene, B and D attain1; both widths can therefore be compared directly with the norm."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{gathered}\\min_{w,b}\\frac12\\|w\\|^2\\\\\\text{subject to}\\quad y_i(w\\cdot x_i+b)\\ge1.\\end{gathered}"}</MathBlock></div>

<Prose>{"Minimizing the squared weight length maximizes this normalized corridor. The half simplifies its derivative. "}<strong>{"Hard margin"}</strong>{" means requiring all these constraints; opposite labels at the same feature vector make them impossible. A separable dataset can also contain outliers that make its widest training corridor unhelpful elsewhere. We will first see which observations constrain it, then allow paid shortfalls for conflicts."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 1."}</strong>{" For w=(2,0), b=−2 and x=(3,4), calculate the score, perpendicular distance and projected point. What changes if you multiply w and b by five?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The weight length is two. The boundary equation is 2x₁−2=0."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The score is 4, the signed distance is 2, and the projection is (1,4). After rescaling, the score is 20 and the weight length is 10, so the distance and projection are unchanged. Calling the original score a distance would overstate it by a factor of two."}</Prose>

</details></div></section>

<H2>{"2. Which observations hold the boundary?"}</H2>

<H3>{"Which moved observation forces a new corridor?"}</H3>

<Prose>{"Compare old and moved points on a real coordinate line, then compare the old and refitted margins."}</Prose>

<SvmReadingFlowFigure job="D06" />

<Prose>{"To isolate the nearest-point calculation, simplify the six two-dimensional observations to four one-dimensional coordinates. The labels and signed-score rule stay the same; there is now only one weight."}</Prose>

<Prose>{"Consider one-dimensional negatives at −2 and −1, and positives at 1 and 2. The nearest opposing points, −1 and 1, constrain the maximum corridor. Its central boundary is zero, w=1 and b=0. Move the positive point at 2 to 3: its constraint remains satisfied, and the old solution remains optimal. Move it to 0.5 instead: the old score is only 0.5, so its normalized constraint fails."}</Prose>

<Prose>{"If the moved positive point is z>0, let r=min(1,z), the nearest positive location. The two binding equations are −(−w+b)=1 and wr+b=1. Solving them gives w=2/(1+r), b=(1−r)/(1+r), and central boundary (r−1)/2. At z=0.5, these become 4/3, 1/3 and −1/4."}</Prose>

<Prose>{"The nearest opposing pair constrains how wide the corridor can be. The ring follows this constraining role while the point moves. At z1, two positive observations share the same position: they express the same geometric restriction, so a unique assignment of “which one holds it” need not exist. In §4 we will give "}<strong>{"support vector"}</strong>{" its precise optimization meaning and check which moves preserve an optimality certificate. For now, compare whether the old normalized constraints remain satisfied: moving the outer positive point to3 leaves them intact; moving it to.5 does not."}</Prose>

<Prose>{"The motion calculation is complete by hand here. After deriving constraint prices in §4, we will check this same support-motion example with its full retained program."}</Prose>

<H3>{"How far can a fixed input move without crossing the decision?"}</H3>

<Prose>{"Compare a perturbation vector with the signed point-to-boundary distance along the current normal."}</Prose>

<SvmReadingFlowFigure job="D07" />

<Prose>{"There is also an inference statement that does not involve retraining. For an input perturbation δ, Cauchy–Schwarz gives "}<code>{"|f(x+δ)−f(x)|≤‖w‖‖δ‖"}</code>{". If "}<code>{"‖δ‖"}</code>{" is strictly smaller than "}<code>{"|f(x)|/‖w‖"}</code>{", the sign cannot change. For a correctly classified point this radius is its positive label-signed distance; for a wrongly classified point the same bound preserves its wrong decision. At the original "}<code>{"(2,1)"}</code>{" point the radius is "}<code>{"3/sqrt5"}</code>{". A perturbation parallel to the boundary changes the features without changing the score; a perturbation directly against the normal uses the budget most quickly. This assumes Euclidean distance in the current feature coordinates and a fixed classifier. Changing feature units changes that geometry; permissible measurements and a shifted population are separate questions."}</Prose>

<Prose>{"We can measure and move the corridor. Next consider observations that prevent every normalized constraint from being satisfied at once."}</Prose>

<H2>{"3. Pay for margin shortfalls"}</H2>

<H3>{"How much shortfall does each observation have?"}</H3>

<Prose>{"Compare five labelled signed scores with the requested margin of1 and their nonnegative shortfall segments."}</Prose>

<SvmReadingFlowFigure job="D08" />

<Prose>{"Introduce a nonnegative slack ξᵢ for each observation. Instead of requiring a margin of one, allow yᵢf(xᵢ)≥1−ξᵢ, and charge Cξᵢ. For fixed w,b, the cheapest permitted slack is max(0,1−yᵢf(xᵢ)). This is "}<strong>{"hinge loss"}</strong>{": a correctly classified point inside the corridor still pays; a point beyond its labeled margin pays nothing."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}P(w,b)&=\\frac12\\|w\\|^2+C\\sum_i\\ell_i,\\\\\\ell_i&=\\max(0,1-y_i f(x_i)).\\end{aligned}"}</MathBlock></div>

<Prose>{"Classification and margin shortfall are different questions"}</Prose>

<NeuralTable caption={"How much shortfall does each observation have?"} headers={[<>{"Label-signed score y f"}</>,<>{"Hinge loss"}</>,<>{"Interpretation"}</>]} rows={[[<>{"1.7"}</>,<>{"0"}</>,<>{"Correct, beyond the margin"}</>],[<>{"1"}</>,<>{"0"}</>,<>{"Exactly on the margin"}</>],[<>{"0.6"}</>,<>{"0.4"}</>,<>{"Correct, inside the corridor"}</>],[<>{"0"}</>,<>{"1"}</>,<>{"On the decision boundary"}</>],[<>{"-0.2"}</>,<>{"1.2"}</>,<>{"On the wrong side"}</>]]} />

<H3>{"Why is this called a hinge, and how does it differ from a smooth loss?"}</H3>

<Prose>{"Trace each loss curve at the same signed score before comparing its derivative."}</Prose>

<SvmReadingFlowFigure job="D09" />

<Prose>{"Plot the loss against the "}<strong>{"signed score"}</strong>{" "}<code>{"m=yf(x)"}</code>{". The hinge has slope−1 below1 and is flat above1; at1 it has a corner. Its valid loss subgradients there form "}<code>{"[−1,0]"}</code>{", representing slopes of supporting lines; an ordinary derivative is unavailable. Squaring the nonnegative shortfall gives "}<strong>{"squared hinge"}</strong>{": at m.6 the loss is "}<code>{".4²=.16"}</code>{" and slope−.8, while at1 its derivative is0. The "}<a href={"/learn/path/full-curriculum/linear-logistic-regression#6-derive-and-compute-log-loss"}>{"earlier logistic-loss and gradient explanation"}</a>{" gives "}<code>{"log(1+exp(−m))"}</code>{", whose slope is "}<code>{"−1/(1+exp(m))"}</code>{". Unlike the hinge it still decreases beyond1. A shared score formula does not make these training losses interchangeable."}</Prose>

<H3>{"How does a shortfall become a training cost?"}</H3>

<Prose>{"Follow weight squares and row shortfalls into their two costs and final addition."}</Prose>

<SvmReadingFlowFigure job="D10" />

<Prose>{"C>0 is the price of training shortfall relative to weight size. A larger C puts more pressure on the training margins; a smaller C tolerates more shortfall. It does not prescribe a particular test accuracy, number of support vectors or geometric width for every dataset. As C grows, a separable dataset can reach a hard-margin solution; conflicting constraints remain conflicting however large C becomes."}</Prose>

<Prose>{"A two-point example makes both C and the intercept visible. Put the negative at −1 and positive at +1. Symmetry permits an optimal b=0. For 0≤w≤1, both hinges sum to 2−2w, so differentiating ½w²+C(2−2w) gives w=2C. Beyond w=1 the hinge is zero and increasing w only costs more. Thus w*=min(2C,1). When w<1, every b between w−1 and 1−w gives the same total hinge; the intercept need not be unique."}</Prose>

<Prose>{"Follow how the two individual losses exchange cost while the allowed bias moves."}</Prose>

<SvmReadingFlowFigure job="D11" />

<Prose>{"At C=0.25, w=0.5 and any b in [−0.5,0.5] is optimal. At b.25, the negative/positive signed scores are.25/.75, the losses are.75/.25 and the objective is "}<code>{".5(.5²)+.25(1)=.375"}</code>{". The individual losses change as the bias moves, but their sum and objective do not. If both opposite labels occur at x=0, the optimum is w=0 and any b in [−1,1]. There is then no normal vector defining a distance corridor. In §4 the optimization coefficients will explain why both a separated and a conflicting example can involve every observation."}</Prose>

<Prose>{"The full retained two-point program appears in §4 after its coefficient variable has been derived; the present weight/bias/loss calculation already explains its objective."}</Prose>

<Prose>{"Compare objective conventions before transferring hyperparameters. Dividing the sum-loss objective by Cn gives an equivalent average-loss objective (λ/2)‖w‖²+(1/n)Σℓᵢ with λ=1/(Cn). Repeating every training observation r times preserves the original sum-loss optimization only if C is divided by r. This is one reason an SGD regularization parameter is not simply 1/C without a sample-size convention. Logistic regression uses a smooth logistic loss instead of hinge loss; similarity of the score formula does not make the objectives identical."}</Prose>

<H3>{"How does one shortfall push the weights?"}</H3>

<Prose>{"Trace each row's loss slope backwards through its label and feature coordinates, then add the norm derivative."}</Prose>

<SvmReadingFlowFigure job="D12" />

<Prose>{"Use the equivalent average-loss objective "}<code>{"J=lambda*||w||²/2+mean hinge"}</code>{". Rows with margin below1 have loss slope−1. Since margin is "}<code>{"y*(x·w+b)"}</code>{", a row's weight derivative is "}<code>{"−y*x"}</code>{", and its bias derivative is "}<code>{"−y"}</code>{". Average over "}<strong>{"all n rows"}</strong>{", counting inactive rows as zero, then add "}<code>{"lambda*w"}</code>{" to the weight derivative. The bias is unpenalized. At margin1 this implementation chooses the valid zero loss subgradient."}</Prose>

<div className="neural-equation"><MathBlock>{"\\nabla_w J=\\lambda w-\\frac1n X_{active}^{\\top}y_{active},\\qquad\n\\partial_bJ=-\\frac1n\\sum_{i: y_i f_i<1}y_i."}</MathBlock></div>

<Prose>{"For the three shown rows, the scores are"}<code>{"[-.1,.2,.6]"}</code>{", signed margins"}<code>{"[.1,.2,.6]"}</code>{", and shortfalls"}<code>{"[.9,.8,.4]"}</code>{". Their mean is.7. The penalty is"}<code>{".5*(.2²+.1²)/2=.0125"}</code>{", so J=.7125. All three rows are active. Their signed feature sum is"}<code>{"[4,0]"}</code>{", yielding weight derivative"}<code>{"[-37/30,-.05]"}</code>{" and bias derivative"}<code>{"-1/3"}</code>{". With step size eta.1, update both from the "}<strong>{"old"}</strong>{" state: "}<code>{"w=[97/300,-.095]"}</code>{" and "}<code>{"b=2/15"}</code>{". The executed new objective is.5528368055555555. Changing eta makes the resulting step visible immediately; a very large step need not reduce a nonsmooth objective."}</Prose>

<Prose>{"For squared hinge multiply each active row's loss slope by"}<code>{"2*(1-margin)"}</code>{". The norm term is unchanged. Its derivative is0 at margin1. This is a change of loss, not a retuning of C for the identical optimization problem."}</Prose>

<Prose>{""}<strong>{"Deeper implementation: a complete batch optimizer and the ordinary row route."}</strong>{" The following file uses array products and reductions to implement those derivatives. The bounded batch loop has a diminishing "}<code>{"eta/sqrt(step)"}</code>{" schedule, retains its best objective state and states whether it stopped at its cap, a small/stationary step or a numerical limit. If a large permitted step overflows finite arithmetic, it keeps the best finite snapshot and reports the failure rather than publishing nonfinite weights. These local stopping observations are distinct from the primal–dual certificate we will derive next."}</Prose>

<Prose>{""}<strong>{"hinge-primal.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/hinge-primal.py" filename="hinge-primal.py" title="Hinge pullback and ordinary row update" />

<Prose>{"Recorded output for the complete example above:"}</Prose>

<CodeBlock language="text" kind="output" filename="hinge-primal-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"hand_before\": {\n    \"objective\": 0.7125,\n    \"gradient_w\": [\n      -1.2333333333333332,\n      -0.05\n    ],\n    \"gradient_b\": -0.3333333333333333,\n    \"scores\": [\n      -0.1,\n      0.2,\n      0.6\n    ],\n    \"margins\": [\n      0.1,\n      0.2,\n      0.6\n    ],\n    \"shortfalls\": [\n      0.9,\n      0.8,\n      0.4\n    ]\n  },\n  \"hand_after\": {\n    \"w\": [\n      0.32333333333333336,\n      -0.095\n    ],\n    \"b\": 0.13333333333333333,\n    \"objective\": 0.5528368055555555\n  },\n  \"row_bridges\": [\n    {\n      \"row\": 1,\n      \"margin_before\": 0.2,\n      \"w\": [\n        0.29,\n        0.005000000000000002\n      ],\n      \"b\": 0.2,\n      \"counter_before\": 2.0,\n      \"counter_after\": 3.0,\n      \"loss\": \"hinge\"\n    },\n    {\n      \"row\": 1,\n      \"margin_before\": 0.2,\n      \"w\": [\n        0.35000000000000003,\n        0.06500000000000004\n      ],\n      \"b\": 0.26,\n      \"counter_before\": 2.0,\n      \"counter_after\": 3.0,\n      \"loss\": \"squared_hinge\"\n    }\n  ],\n  \"bounded_optimizations\": {\n    \"hinge\": {\n      \"w\": [\n        0.8052331630430355,\n        0.3895275303008924\n      ],\n      \"b\": -0.19476684759711396,\n      \"objective\": 0.2000350873493798,\n      \"steps\": 2000,\n      \"status\": \"iteration cap\",\n      \"trace\": [\n        {\n          \"step\": 0,\n          \"objective\": 1.0\n        },\n        {\n          \"step\": 1,\n          \"objective\": 0.8155555555555557,\n          \"rate\": 0.1\n        },\n        {\n          \"step\": 2,\n          \"objective\": 0.6962530144275523,\n          \"rate\": 0.07071067811865475\n        },\n        {\n          \"step\": 3,\n          \"objective\": 0.6048838599962506,\n          \"rate\": 0.05773502691896258\n        },\n        {\n          \"step\": 100,\n          \"objective\": 0.23069211428321731,\n          \"rate\": 0.01\n        },\n        {\n          \"step\": 200,\n          \"objective\": 0.2052439948893251,\n          \"rate\": 0.007071067811865475\n        },\n        {\n          \"step\": 300,\n          \"objective\": 0.20285643559501973,\n          \"rate\": 0.005773502691896257\n        },\n        {\n          \"step\": 400,\n          \"objective\": 0.20204013220609268,\n          \"rate\": 0.005\n        },\n        {\n          \"step\": 500,\n          \"objective\": 0.20142752866264202,\n          \"rate\": 0.00447213595499958\n        },\n        {\n          \"step\": 600,\n          \"objective\": 0.20120393800583727,\n          \"rate\": 0.004082482904638631\n        },\n        {\n          \"step\": 700,\n          \"objective\": 0.20101600449312326,\n          \"rate\": 0.0037796447300922726\n        },\n        {\n          \"step\": 800,\n          \"objective\": 0.20069950456743155,\n          \"rate\": 0.0035355339059327377\n        },\n        {\n          \"step\": 900,\n          \"objective\": 0.20071027440282688,\n          \"rate\": 0.0033333333333333335\n        },\n        {\n          \"step\": 1000,\n          \"objective\": 0.20058680275738977,\n          \"rate\": 0.0031622776601683794\n        },\n        {\n          \"step\": 1100,\n          \"objective\": 0.2003583368651907,\n          \"rate\": 0.003015113445777636\n        },\n        {\n          \"step\": 1200,\n          \"objective\": 0.20045745674171225,\n          \"rate\": 0.0028867513459481286\n        },\n        {\n          \"step\": 1300,\n          \"objective\": 0.20025837109455683,\n          \"rate\": 0.002773500981126146\n        },\n        {\n          \"step\": 1400,\n          \"objective\": 0.2002482959596381,\n          \"rate\": 0.002672612419124244\n        },\n        {\n          \"step\": 1500,\n          \"objective\": 0.20021824472568328,\n          \"rate\": 0.0025819888974716113\n        },\n        {\n          \"step\": 1600,\n          \"objective\": 0.2003043883369363,\n          \"rate\": 0.0025\n        },\n        {\n          \"step\": 1700,\n          \"objective\": 0.20023478453886556,\n          \"rate\": 0.00242535625036333\n        },\n        {\n          \"step\": 1800,\n          \"objective\": 0.20010469958649862,\n          \"rate\": 0.0023570226039551583\n        },\n        {\n          \"step\": 1900,\n          \"objective\": 0.20030947031033827,\n          \"rate\": 0.0022941573387056176\n        },\n        {\n          \"step\": 2000,\n          \"objective\": 0.20016770313565832,\n          \"rate\": 0.00223606797749979\n        }\n      ]\n    },\n    \"squared_hinge\": {\n      \"w\": [\n        0.6596662504301501,\n        0.23987537466573328\n      ],\n      \"b\": -0.10643963824262079,\n      \"objective\": 0.15592203903658156,\n      \"steps\": 2000,\n      \"status\": \"iteration cap\",\n      \"trace\": [\n        {\n          \"step\": 0,\n          \"objective\": 1.0\n        },\n        {\n          \"step\": 1,\n          \"objective\": 0.43259259259259275,\n          \"rate\": 0.1\n        },\n        {\n          \"step\": 2,\n          \"objective\": 0.31636980403919507,\n          \"rate\": 0.07071067811865475\n        },\n        {\n          \"step\": 3,\n          \"objective\": 0.2698015438074646,\n          \"rate\": 0.05773502691896258\n        },\n        {\n          \"step\": 100,\n          \"objective\": 0.15849102732795084,\n          \"rate\": 0.01\n        },\n        {\n          \"step\": 200,\n          \"objective\": 0.15627874598935565,\n          \"rate\": 0.007071067811865475\n        },\n        {\n          \"step\": 300,\n          \"objective\": 0.15598858251498438,\n          \"rate\": 0.005773502691896257\n        },\n        {\n          \"step\": 400,\n          \"objective\": 0.15593877614238755,\n          \"rate\": 0.005\n        },\n        {\n          \"step\": 500,\n          \"objective\": 0.15592703038761693,\n          \"rate\": 0.00447213595499958\n        },\n        {\n          \"step\": 600,\n          \"objective\": 0.1559237153846917,\n          \"rate\": 0.004082482904638631\n        },\n        {\n          \"step\": 700,\n          \"objective\": 0.15592265452026502,\n          \"rate\": 0.0037796447300922726\n        },\n        {\n          \"step\": 800,\n          \"objective\": 0.1559222814185949,\n          \"rate\": 0.0035355339059327377\n        },\n        {\n          \"step\": 900,\n          \"objective\": 0.15592214007948751,\n          \"rate\": 0.0033333333333333335\n        },\n        {\n          \"step\": 1000,\n          \"objective\": 0.15592208319877426,\n          \"rate\": 0.0031622776601683794\n        },\n        {\n          \"step\": 1100,\n          \"objective\": 0.15592205912210613,\n          \"rate\": 0.003015113445777636\n        },\n        {\n          \"step\": 1200,\n          \"objective\": 0.15592204848319988,\n          \"rate\": 0.0028867513459481286\n        },\n        {\n          \"step\": 1300,\n          \"objective\": 0.15592204360405523,\n          \"rate\": 0.002773500981126146\n        },\n        {\n          \"step\": 1400,\n          \"objective\": 0.15592204129233425,\n          \"rate\": 0.002672612419124244\n        },\n        {\n          \"step\": 1500,\n          \"objective\": 0.1559220401649991,\n          \"rate\": 0.0025819888974716113\n        },\n        {\n          \"step\": 1600,\n          \"objective\": 0.1559220396008884,\n          \"rate\": 0.0025\n        },\n        {\n          \"step\": 1700,\n          \"objective\": 0.15592203931198179,\n          \"rate\": 0.00242535625036333\n        },\n        {\n          \"step\": 1800,\n          \"objective\": 0.15592203916087188,\n          \"rate\": 0.0023570226039551583\n        },\n        {\n          \"step\": 1900,\n          \"objective\": 0.15592203908030278,\n          \"rate\": 0.0022941573387056176\n        },\n        {\n          \"step\": 2000,\n          \"objective\": 0.15592203903658156,\n          \"rate\": 0.00223606797749979\n        }\n      ]\n    }\n  }\n}"}</CodeBlock>

<Prose>{"The supplied constant-rate "}<code>{"SGDClassifier"}</code>{" comparison maps "}<code>{"lambda"}</code>{" to the library's "}<code>{"alpha"}</code>{", chooses dense inputs, disables shuffling/averaging, declares classes and copies one specified weight/bias state after estimator initialization. It then takes "}<strong>{"one row update"}</strong>{" and compares that row's derivatives. Its row1 hinge update gives "}<code>{"w=[.29,.005],b=.2"}</code>{"; squared hinge gives "}<code>{"[.35,.065],b=.26"}</code>{". The ordinary counter advances2→3. "}<code>{"partial_fit"}</code>{" retains its state/counter; a fresh ordinary "}<code>{"fit"}</code>{" starts a new fitting sequence. Constant rate avoids a counter-dependent schedule in this comparison."}</Prose>

<Prose>{"A library pass updates after each row, so later rows read changed weights. The batch step above averages derivatives evaluated at one common old state. They are different procedures. The exact matched row demonstration also uses "}<code>{"eta*lambda<=1"}</code>{", because the library clips its multiplicative shrink at zero; it does not reproduce a negative shrink factor from an arbitrarily large scratch step."}</Prose>

<Prose>{"The two declared2000-step scratch runs finish at their iteration caps. Best objectives are.2000350873493798 for hinge and.15592203903658156 for squared hinge on this fixture. Those values concern two different losses. To take control, change one row or the loss, recompute the derivatives, inspect a kink with one-sided slopes and compare the appropriate ordinary row update. Practice13 revisits that transfer independently."}</Prose>

<Prose>{"We can now change a loss and compute a step. A falling training objective still leaves a question: how much improvement could remain?"}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 2."}</strong>{" There are 12 observations and C=3. Find the equivalent average-loss λ. If every row is repeated four times, which C preserves the original objective?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare coefficients after multiplying the whole objective by one positive constant."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"λ=1/(12×3)=1/36. Set C to 3/4 for the repeated dataset, because its hinge sum is four times larger. The new n is 48 and 1/(48×0.75) remains 1/36. Repeating rows supplies no new independent evidence about generalization."}</Prose>

</details></div></section>

<H2>{"4. Derive a checkable optimization certificate"}</H2>

<Prose>{"We have a cost for any proposed classifier. What we still lack is a way to tell whether some unseen choice of weights could do better."}</Prose>

<SvmReadingFlowFigure job="D13" />

<Prose>{"Take the two separated observations x=−1,y=−1 and x=1,y=+1 from §3, with C=.25. A proposed weight w=0,b=0 pays .5; it gives an upper bound on the best possible cost. At w=.2,b=0 the cost falls to .42. At w=.5,b=0 it is .375. A lower bound will rule out every cheaper alternative at once. The diagram pairs these weights with lower bounds0,.18,.375. When both endpoints reach .375, the unknown optimum has nowhere else to be."}</Prose>

<Prose>{"The primal chooses weights, bias and slack. The "}<strong>{"dual"}</strong>{" assigns a nonnegative price αᵢ to each margin constraint. A feasible dual value will be a lower bound on the smallest primal objective. Comparing the two gives a checkable optimization gap, not a claim about test error."}</Prose>

<Prose>{"The algebra below constructs the lower endpoint while keeping its direction explicit. A bound with the opposite inequality would not rule out a cheaper classifier."}</Prose>

<Prose>{"Imagine paying a nonnegative price for violating each row's required margin. Price zero means the constraint contributes nothing to this accounting; a positive price makes the corresponding feature vector appear in the weight expansion. These are optimization coefficients, not observation probabilities."}</Prose>

<SvmReadingFlowFigure job="D14" />

<Prose>{"For the pictured price .1 on each row, multiplying price, label and coordinate gives .1·(−1)·(−1)=.1 and .1·1·1=.1. Their sum is .2, the weight in the preceding bracket. The two signed prices −.1 and +.1 cancel. The remaining slack price .25−.1=.15 is nonnegative. Each of those three observations becomes an exact condition when we minimize the accounting expression."}</Prose>

<Prose>{"Write the constraints as 1−ξᵢ−yᵢf(xᵢ)≤0 and −ξᵢ≤0. Multiply them by αᵢ≥0 and βᵢ≥0 and add them to the objective. On any feasible primal point, the added terms are nonpositive. Minimizing this expression over unrestricted w,b,ξ therefore provides a lower bound:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}L={}&\\frac12\\|w\\|^2+C\\sum_i\\xi_i\\\\&+\\sum_i\\alpha_i(1-\\xi_i-y_i f_i)\\\\&-\\sum_i\\beta_i\\xi_i.\\end{aligned}"}</MathBlock></div>

<Prose>{"The weight terms can be written as ½‖w−a‖²−½‖a‖², where a=Σαᵢyᵢxᵢ. Their minimum occurs at w=a. The unrestricted bias and slack variables are different: a nonzero linear coefficient lets us send its variable toward one infinity and the expression toward −∞. Such a useless lower bound is excluded by setting those coefficients to zero."}</Prose>

<Prose>{"The coefficient of b must vanish: Σαᵢyᵢ=0, otherwise the infimum over b is −∞. The coefficient of each ξᵢ must vanish: C−αᵢ−βᵢ=0, which requires 0≤αᵢ≤C. Completing the square in w gives its minimizer w=Σαᵢyᵢxᵢ. Substitution leaves:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{gathered}\\text{Maximize}\\\\D(\\alpha)=\\sum_i\\alpha_i-\\tfrac12\\alpha^\\top Q\\alpha,\\\\Q_{ij}=y_i y_jK_{ij},\\quad K_{ij}=x_i\\cdot x_j,\\\\0\\le\\alpha_i\\le C,\\qquad\\sum_i\\alpha_i y_i=0.\\end{gathered}"}</MathBlock></div>

<Prose>{"For feasible α and any w,b with slack set to its hinge, D(α)≤P(w,b). Thus P−D is an optimization certificate. In floating-point code, feasibility residuals, roundoff and the declared stopping tolerance matter. A small gap does not mean the statistical model is appropriate. For this convex finite soft-margin problem, strict feasibility is easy: w=b=0 and every ξ=2. Strong duality then makes the best primal and dual values equal. The general convex argument is developed in "}<a href={"/learn/path/full-curriculum/convex-duality-lagrangian-methods-kkt-conditions"}>{"Convex Duality & KKT Conditions"}</a>{"."}</Prose>

<SvmReadingFlowFigure job="D15" />

<Prose>{"Complementary slackness translates the algebra back into the picture. A constraint with spare room has no need to push on the solution, so its price is zero. A constraint at its limit may push. The word “may” matters: redundant constraints can sit at their limits without receiving a positive price. The following equations make those one-way implications precise."}</Prose>

<Prose>{"Together, stationarity, primal/dual feasibility and complementary slackness are the "}<strong>{"Karush–Kuhn–Tucker"}</strong>{", KKT, conditions. At an optimum, complementary slackness gives αᵢ(1−ξᵢ−yᵢfᵢ)=0 and (C−αᵢ)ξᵢ=0. Combine those equations with primal feasibility:"}</Prose>

<Prose>{"KKT cases for C-SVC with hinge loss"}</Prose>

<NeuralTable caption={"4. Derive a checkable optimization certificate"} headers={[<>{"Coefficient"}</>,<>{"Necessary optimal margin condition"}</>,<>{"What it means"}</>]} rows={[[<>{"α=0"}</>,<>{"y f ≥ 1"}</>,<>{"May be strictly outside or exactly tight"}</>],[<>{"0 < α < C"}</>,<>{"y f = 1"}</>,<>{"A free support vector lies on its labeled margin"}</>],[<>{"α=C"}</>,<>{"y f ≤ 1"}</>,<>{"May be tight, inside, or misclassified"}</>]]} />

<Prose>{"A free coefficient gives b=yᵢ−ΣⱼαⱼyⱼK(xⱼ,xᵢ). If there is no free coefficient, the other inequalities can define a whole interval of valid biases. Arbitrarily averaging only an empty set of free points is not a bias algorithm. Our complete solver later minimizes the hinge over b and checks the resulting primal value."}</Prose>

<Prose>{"For the same fixed training problem, the optimal feature-space weight vector is unique: if two different weights were optimal, their midpoint would strictly reduce the squared norm while convexity could not increase the loss beyond the average. The intercept is not strictly penalized, and coefficients can represent the same weight in several ways. Hence neither b nor α is guaranteed unique. Duplicate observations supply an immediate coefficient example."}</Prose>

<H3>{"Why the training span is enough"}</H3>

<Prose>{"The expansion is more than a convenient storage formula. Decompose any linear weight into w∥ in the span of the training vectors and w⊥ perpendicular to that span. Every training dot product uses only w∥, because w⊥·xᵢ=0. Dropping w⊥ leaves every training loss unchanged while reducing the squared norm by ‖w⊥‖². A minimizer therefore needs no perpendicular component. After we construct feature vectors in §5, the same argument applies to their span. This is the squared-norm representer argument used here; broader representer theorems have conditions on the penalty and evaluation functionals."}</Prose>

<Prose>{"Prediction is now f(x)=Σᵢαᵢyᵢ(xᵢ·x)+b. The letter K still refers to the ordinary training dot products in this section; §5 will replace them with a general feature similarity. Only positive coefficients contribute algebraically. With a linear kernel we can collapse the sum into one saved weight vector. A numerical threshold used to display “support count” should not silently drop small coefficients from a gap calculation or change the saved predictor."}</Prose>

<H3>{"Revisit the two corridor examples with their constraint prices"}</H3>

<Prose>{"We now have the coefficient vocabulary used by the two complete earlier programs. A "}<strong>{"support vector"}</strong>{" in the optimization representation has positive "}<code>{"alpha"}</code>{"; at duplicate positions several assignments can describe the same weight. A tight row can have coefficient0. Therefore being on the margin is not equivalent to having a positive coefficient."}</Prose>

<SvmReadingFlowFigure job="D16" />

<Prose>{"The first program keeps the old feasible classifier and coefficient assignment when a zero-coefficient row moves while preserving its old constraint. The old primal and dual values still meet, so the old solution remains optimal. Removing that row's constraint also retains the certificate. Moving it into the corridor may destroy primal feasibility; being unused previously is not immunity to arbitrary retraining."}</Prose>

<Prose>{""}<strong>{"support-certificates.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/support-certificates.py" filename="support-certificates.py" title="Check a moved point and a duplicate coefficient family" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="support-certificates-output.txt" title="Recorded output">{"moved=3.0 old feasible=True\nw=1.000000 b=0.000000 boundary=-0.000000 gap=0.000000\nmoved=0.5 old feasible=False\nw=1.333333 b=0.333333 boundary=-0.250000 gap=0.000000\nalpha: [0.5, 0.0, 0.5] w=1.0 dual=0.5\nalpha: [0.5, 0.2, 0.3] w=1.0 dual=0.5\nalpha: [0.5, 0.5, 0.0] w=1.0 dual=0.5"}</CodeBlock>

<Prose>{"The second program uses the derived identical pair coefficients to check both the separated and conflicting cases from §3. It keeps the entire optimal bias interval rather than infer uniqueness from one displayed bias. Both rows can have positive coefficients in either type of example."}</Prose>

<Prose>{""}<strong>{"soft-margin-bias.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/soft-margin-bias.py" filename="soft-margin-bias.py" title="Calculate the loss, dual value and admissible bias" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="soft-margin-bias-output.txt" title="Recorded output">{"conflicting=False C=0.25 w=0.50 b interval=[-0.50,0.50]\nhinge: [0.75, 0.25] primal=0.375 dual=0.375\nconflicting=False C=1.00 w=1.00 b interval=[-0.00,0.00]\nhinge: [0.0, 0.0] primal=0.500 dual=0.500\nconflicting=True C=1.00 w=0.00 b interval=[-1.00,1.00]\nhinge: [1.5, 0.5] primal=2.000 dual=2.000\nlambda=0.0625; duplicated-data C=0.666667"}</CodeBlock>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 3."}</strong>{" At an optimum, can an observation with y f=1 have α=0? What must be true if its margin is 1.2?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the full implications in the KKT table; do not reverse a one-way implication."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"A tight observation can have α=0, a free coefficient or α=C, depending on the complete solution. Margin 1.2 forces α=0. Conversely, α=0 only guarantees margin at least one. These are mathematical optimality conditions; a finite solver tolerance can blur exact numerical equalities."}</Prose>

</details></div></section>

<H2>{"5. Change similarity with a valid kernel"}</H2>

<Prose>{"The certificate used input dot products in two places: in the training quadratic and in each query score. We can keep that machinery while changing the features those dot products describe."}</Prose>

<SvmReadingFlowFigure job="D17" />

<Prose>{"Sometimes the labels cannot be separated by a line in the original coordinates. For XOR, the four points (±1,±1) have positive labels when the signs agree and negative labels otherwise. Their label is the sign of x₁x₂. Add this product as a feature and a linear classifier in the new coordinates can separate them."}</Prose>

<Prose>{"The original corners have two positive labels on one diagonal and two negative labels on the other. A line cannot put both diagonals on their respective sides: the midpoint of each diagonal is the same origin. In the displayed transformation, only the middle coordinate separates these four rows. The other two coordinates are constant1 here; dropping them would not describe a general input. For example (2,1) maps to (4,2√2,1), not to the corner's constant coordinates."}</Prose>

<Prose>{"For this transformation, expand a square:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}k(x,z)&=(x\\cdot z)^2,\\\\\\phi(x)&=(x_1^2,\\sqrt2 x_1x_2,x_2^2),\\\\\\phi(x)\\cdot\\phi(z)&=k(x,z).\\end{aligned}"}</MathBlock></div>

<Prose>{"The √2 is essential: the cross term in the expanded square has coefficient two. For XOR, the weight (0,1/√2,0) in this feature space produces f(x)=x₁x₂. The boundary is linear in φ(x), but curved when viewed through the original input coordinates."}</Prose>

<SvmReadingFlowFigure job="D18" />

<Prose>{"Collect the four transformed rows and take every pairwise dot product. The resulting "}<strong>{"Gram matrix"}</strong>{" is square because both its axes name the same training rows. Opposite corners have identical degree-two features, hence the repeated rows. In the selected corner pair, the feature products sum to1+2+1=4; directly squaring the input dot product gives (−2)²=4. A kernel is a function k that computes these feature dot products using the inputs. This identity is the "}<strong>{"kernel trick"}</strong>{": the optimization and score need dot products, so an explicit long feature vector can sometimes be avoided."}</Prose>

<H3>{"Which similarity functions are legal?"}</H3>

<Prose>{"Calling two inputs “similar” is not enough to make a kernel. We need similarities that behave as dot products in some common feature space. Any weighted combination of those feature vectors must have a nonnegative squared length. The Gram-matrix condition below is exactly that requirement written using similarities, without first constructing the features."}</Prose>

<SvmReadingFlowFigure job="D19" />

<Prose>{"The duplicate matrix [[1,1],[1,1]] gives squared length0 for the combination (1,−1): two identical feature vectors cancel. The proposed matrix [[2,3],[3,2]] instead gives2−3−3+2=−2 for the same combination. A real squared length cannot do that. This is the concrete test underlying the general condition."}</Prose>

<Prose>{"For any finite list of points, a real feature kernel forms a symmetric positive semidefinite Gram matrix K. Indeed, for any real coefficients a, aᵀKa=‖Σaᵢφ(xᵢ)‖²≥0. One negative quadratic witness disproves validity. Checking one finite matrix without finding a negative value does not prove validity on every possible input list."}</Prose>

<Prose>{"Here is the matrix operation behind the next term. Multiplying K by a column v takes the dot product of each matrix row with that same column, producing one output coordinate per row. For the duplicate matrix W, v=(1,−1) gives "}<code>{"Wv=(1−1,1−1)=(0,0)"}</code>{". With v=(1,1), it gives "}<code>{"Wv=(1+1,1+1)=(2,2)=2v"}</code>{". These v coordinates weight the named training rows; they are not an input's original measurement coordinates."}</Prose>

<Prose>{"A nonzero v satisfying "}<strong>{"Kv=λ_K v"}</strong>{" is an "}<strong>{"eigenvector"}</strong>{": the output stays on the same line as v, multiplied by the "}<strong>{"eigenvalue"}</strong>{" λ_K and possibly reduced to zero. Thus the duplicate matrix has eigenvalues0 along the difference direction and2 along the common direction. λ_K here describes a matrix direction, unlike the regularization λ in §3. For such a direction, "}<code>{"vᵀKv=λ_K‖v‖²"}</code>{". A positive semidefinite Gram cannot have a negative eigenvalue, but a zero eigenvalue is allowed: duplicate features cancel in their difference direction. The invalid matrix above sends (1,−1) to (−1,1)=−(1,−1), so its eigenvalue−1 gives the already computed squared-length contradiction−2."}</Prose>

<Prose>{"Conversely, a symmetric positive semidefinite kernel on every finite list admits a Hilbert-space feature construction: take formal finite combinations of symbols k(x,·), define their inner product by the kernel sum, identify vectors of zero length and complete the space. This is the useful kernel condition here. A particular Mercer eigenfunction expansion has additional domain, measure and regularity assumptions; those belong in "}<a href={"/learn/path/full-curriculum/functional-analysis-rkhs"}>{"Functional Analysis & RKHS"}</a>{"."}</Prose>

<Prose>{"Nonnegative weighted sums of valid kernels remain valid by concatenating scaled feature vectors. Products remain valid by taking tensor-product features. This proves familiar polynomial constructions such as (γx·z+r)ᵈ when γ,r≥0 and d is a nonnegative integer. A sigmoid similarity is not positive semidefinite for every parameter choice. With finite C, even an indefinite dual quadratic is bounded on its compact feasible box; the lost guarantee is convex/concave optimization structure, not automatically boundedness."}</Prose>

<H3>{"The Gaussian RBF kernel and its scale"}</H3>

<Prose>{"The polynomial above measures matching coordinate products. Another valid choice starts with how far apart the inputs are."}</Prose>

<SvmReadingFlowFigure job="D21" />

<Prose>{"At γ=.5, a displacement of length √2 gives exponent−1 and similarity e⁻¹≈.367879. At twice that distance the exponent is−4, giving approximately.018316. The distance is squared before it is multiplied by γ: doubling distance does not merely double the exponent."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{gathered}k(x,z)=\\exp(-\\gamma\\|x-z\\|^2),\\\\\\gamma>0.\\end{gathered}"}</MathBlock></div>

<Prose>{"The Gaussian radial basis function, RBF, depends only on distance. Similarity falls to e⁻¹ at distance 1/√γ. Expand it as e⁻ᵞ‖ˣ‖²e⁻ᵞ‖ᶻ‖²e²ᵞˣ·ᶻ. The last exponential is a convergent sum of nonnegative multiples of the valid polynomial kernels (x·z)ᵐ. Multiplying by one factor for x and one for z preserves the Gram quadratic form; finite partial sums are positive semidefinite, and their entrywise limit retains that property. This gives a local validity proof without treating a plotted heatmap as evidence."}</Prose>

<Prose>{"Small γ makes similarities decay slowly; large γ makes them local. C still controls how much training shortfall is paid, so both affect the fit. We can derive this lab's exact fit using the matrix operation just worked, instead of treating its coefficients as supplied answers."}</Prose>

<Prose>{"Keep XOR row order "}<code>{"(-1,-1),(-1,1),(1,-1),(1,1)"}</code>{" and labels "}<code>{"y=(1,−1,−1,1)"}</code>{". Write "}<code>{"r=exp(−4γ)"}</code>{": neighboring corners have squared distance4 and similarity r; opposite corners have squared distance8 and similarity r². The RBF Gram and its first row applied to y are"}</Prose>

<div className="neural-equation"><MathBlock>{"K=\\begin{pmatrix}1&r&r&r^2\\\\r&1&r^2&r\\\\r&r^2&1&r\\\\r^2&r&r&1\\end{pmatrix},\\qquad\n(Ky)_1=1-r-r+r^2=(1-r)^2."}</MathBlock></div>

<Prose>{"The other three row dot products are "}<code>{"−(1−r)²,−(1−r)²,+(1−r)²"}</code>{". Hence "}<code>{"Ky=λ_K y"}</code>{" with "}<code>{"λ_K=(1−r)²"}</code>{": the label column is an eigenvector, and the alternating-label direction is rescaled by this number."}</Prose>

<Prose>{"Give all four coefficients a common value a. Their box constraints require "}<code>{"0≤a≤C"}</code>{", and label balance holds because "}<code>{"a(1−1−1+1)=0"}</code>{". In the dual from §4, "}<code>{"α=a*1"}</code>{" and "}<code>{"αᵀQα=(a y)ᵀK(a y)=a²λ_K(yᵀy)=4a²λ_K"}</code>{". Consequently"}</Prose>

<div className="neural-equation"><MathBlock>{"D(a)=4a-2\\lambda_K a^2,\\qquad\nD'(a)=4-4\\lambda_K a,\\qquad\na^*=\\min(C,1/\\lambda_K)\\quad(\\lambda_K>0)."}</MathBlock></div>

<Prose>{"The downward quadratic peaks at "}<code>{"1/λ_K"}</code>{"; if C lies below that peak, the best permitted value is the upper endpoint C. This one-dimensional calculation also gives a global certificate here: with b=0 every signed training margin is "}<code>{"yᵢfᵢ=aλ_K"}</code>{". At the unconstrained optimum it is1, satisfying the free/tight KKT case. At a=C below that optimum it is at most1, satisfying the bounded-coefficient case. The corresponding hinge slacks satisfy the other KKT conditions, so this feasible candidate solves the full XOR dual, not just its common-coefficient slice."}</Prose>

<Prose>{"For the degree-two polynomial Gram already drawn, each row gives "}<code>{"Ky=8y"}</code>{", so "}<code>{"a*=min(C,1/8)"}</code>{". The linear Gram instead gives "}<code>{"Ky=0"}</code>{": the signed corner sum is zero, its weight is zero, and "}<code>{"D(a)=4a"}</code>{" is maximized at a=C. There is no division by zero in that branch; b=0 gives signed margins0 and the bounded-coefficient certificate. These exact special-case formulas power this lab; they are not a general training algorithm."}</Prose>

<Prose>{"For a fixed finite RBF model, as a query moves far from every support point, all its similarities approach zero and the score approaches b. The model has not learned a meaningful rule for every remote region merely because it returns a class there. Kernel-space distance to a margin uses the feature weight length √(αᵀYKYα); it is generally not Euclidean distance to a curved boundary in input space."}</Prose>

<SvmReadingFlowFigure job="D20" />

<Prose>{"We have now defined all three similarity choices used by the shared model view. Change the kernel first, then move only the query point. The fit view changes kernel, C and γ; the separate query view changes only x₁/x₂ and names the same current fit state. γ matters only for RBF. Returning to the fit view does not discard the query. Each signed contribution is αᵢyᵢk(xᵢ,x), so a positive similarity can support either class depending on its training label. The four contributions add to the score. The color field samples the saved analytic predictor at finite cell centers; it is not a probability plot or a proof about all points between cells."}</Prose>

<Prose>{"Which kernel can distinguish the XOR labels, and does a zero Gram eigenvalue mean the kernel is invalid?"}</Prose>

<Prose>{""}<strong>{"kernel-xor.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/kernel-xor.py" filename="kernel-xor.py" title="Compare explicit features with kernel scores" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="kernel-xor-output.txt" title="Recorded output">{"linear train accuracy: 0.50 query scores: [-0.0, -0.0]\npoly train accuracy: 1.00 query scores: [0.25, -0.25]\nrbf train accuracy: 1.00 query scores: [0.31119, -0.31119]\ninvalid Gram witness: -2.0\nduplicate Gram eigenvalues: [0.0, 2.0]"}</CodeBlock>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 4."}</strong>{" A proposed two-point Gram matrix is [[2,3],[3,2]]. Find a short validity counterexample. Would adding duplicate rows to a valid dataset invalidate its kernel?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Try the coefficient vector (1,−1). Distinguish a negative quadratic form from a zero one."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The quadratic form is 2+2−6=−2, so this matrix cannot come from real feature dot products. Duplicating valid features can create zero eigenvalues, which are permitted. Singularity may cause nonunique coefficients; it does not by itself invalidate the kernel."}</Prose>

</details></div></section>

<H2>{"6. Move two coefficients without breaking the constraints"}</H2>

<Prose>{"We now know how to construct the quadratic and how to check a feasible set of coefficients. We still need a move that improves them without invalidating the lower bound."}</Prose>

<SvmReadingFlowFigure job="D22" />

<Prose>{"A dual optimizer cannot independently change one coefficient while preserving Σαᵢyᵢ=0. Choose two indices i,j and let αⱼ increase by δ. Then αᵢ must decrease by sδ, where s=yᵢyⱼ. Opposite labels move together; same labels move in opposite directions. Intersect the two box constraints to find the legal interval [L,H]."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\\alpha'_j&=\\alpha_j+\\delta,\\\\\\alpha'_i&=\\alpha_i-s\\delta,\\quad s=y_i y_j,\\\\0\\le\\alpha'_i,\\alpha'_j&\\le C.\\end{aligned}"}</MathBlock></div>

<Prose>{"The change must also stay inside each coefficient's box. The j-coordinate requires −αⱼ≤δ≤C−αⱼ. For opposite labels, the i-coordinate requires −αᵢ≤δ≤C−αᵢ. For equal labels, it instead requires αᵢ−C≤δ≤αᵢ. Take the larger lower endpoint and smaller upper endpoint. Feasible old state guarantees that δ=0 remains in this intersection."}</Prose>

<SvmReadingFlowFigure job="D23" />

<Prose>{"Let Qᵢⱼ=yᵢyⱼKᵢⱼ and u=1−Qα be the current dual gradient. Along this feasible line, expand the quadratic exactly. Its gain is gδ−½qδ², where g=uⱼ−suᵢ and q=Kᵢᵢ+Kⱼⱼ−2Kᵢⱼ. For a valid kernel, q is the squared feature distance between the two points and cannot be negative in exact arithmetic."}</Prose>

<Prose>{"When q>0, choose δ=clip(g/q,L,H). When q=0, the gain is linear: choose whichever endpoint improves it most, or leave it unchanged if tied. Opposite labels at an identical input make this case useful, not ignorable. Compute both updated coefficients before committing either one; a one-sided mutation followed by an early return can break the equality constraint."}</Prose>

<Prose>{"The selected pair's improvement is exact for that pair's feasible line; it need not solve the entire training problem. The old manual investigation below lets you commit one such move at a time. Its point editor and pair choice refer to the same current coefficient state. An invalid edited state must preserve the last feasible snapshot, including label balance."}</Prose>

<Prose>{"The deeper editor preserves the same mathematical state for arbitrary2–8 two-dimensional rows, not only the displayed three-row fixture. Work through one question at a time: choose the number of rows; select one row and edit its two coordinates; select one row and its label; select one row and its coefficient. Coordinates lie in [−6,6], labels are−1/+1, and coefficients must lie in [0,C]. The pair question chooses two distinct row identities and C in [.05,4]. Each view has at most three controls and shows the same current rows, labels, coefficients and balance residual."}</Prose>

<Prose>{"An isolated coefficient or label edit can break Σαᵢyᵢ=0. Such drafts remain visibly invalid without changing the current predictor; prepare the matching row edits and apply the complete feasible state atomically. The optional numeric state import follows the same shape, box and balance checks. A permitted pair move then uses the saved old values of both coefficients. Reset restores the original fixture and clears invalid draft fields even when the committed state already equals that default. The duplicate-input example is a deliberate zero-curvature case, not a substitute for arbitrary editing."}</Prose>

<Prose>{"Why does a same-label pair follow a different diagonal, and what should happen when pair curvature is zero?"}</Prose>

<Prose>{""}<strong>{"pair-move.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/pair-move.py" filename="pair-move.py" title="Move two coefficients while preserving label balance" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="pair-move-output.txt" title="Recorded output">{"pair=(0,1) delta interval=[-0.100,1.000] q=3.250\nafter: [0.638462, 0.538462, 0.1] balance=0.000000 gain=0.312404\npair=(1,2) delta interval=[-0.100,0.100] q=2.500\nafter: [0.2, 0.14, 0.06] balance=0.000000 gain=0.002000\nzero-curvature after: [1.2, 1.2] gain=2.4"}</CodeBlock>

<H3>{"A complete small solver, with a stopping certificate"}</H3>

<Prose>{"The next program revisits the original lesson's Gaussian blobs and nonlinear XOR data. It implements bounded exhaustive pair-coordinate ascent for a linear or RBF kernel. It uses the same two-variable mechanism as sequential minimal optimization, SMO, but does not reproduce Platt's full working-set selection, cache, shrinking or production engineering. At each step it evaluates every pair's best feasible gain, commits the largest and recomputes a primal certificate."}</Prose>

<Prose>{"For fixed w, write the margin breakpoints as tᵢ=yᵢ−w·φ(xᵢ). Each negative-label hinge begins increasing at its breakpoint; each positive-label hinge stops decreasing at its breakpoint. The total derivative increases by one at every sorted breakpoint and starts at minus the number of positive labels. Therefore, with both labels present and a common C, any b between the two breakpoints where this derivative reaches zero minimizes the hinge. The program uses their midpoint. This works even when no coefficient is strictly between zero and C."}</Prose>

<Prose>{"Stopping is based on a small relative primal–dual gap after verifying box and label-balance feasibility. The step cap and a numerical stall are separate statuses. A random counter that saw no recent update would not certify convergence. The implementation clears old state on each fit, handles duplicate opposite labels, bounds its accepted numeric inputs, and sums every coefficient at prediction time. Its support count uses a reporting threshold only."}</Prose>

<Prose>{"Will the solver pass its objective-gap criterion on both datasets and on opposite labels at an identical input?"}</Prose>

<Prose>{""}<strong>{"pair-coordinate-solver.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/pair-coordinate-solver.py" filename="pair-coordinate-solver.py" title="Fit the original Gaussian and XOR examples with a checked gap" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="pair-coordinate-solver-output.txt" title="Recorded output">{"blobs: gap passed; train accuracy=1.000\nprimal=4.017906 dual=4.017906 gap=0.000000\npositive coefficients: 20\nXOR: gap passed; train accuracy=0.925\nprimal=16.684101 dual=16.684099 gap=0.000001\npositive coefficients: 32\nopposite duplicate: gap passed alpha= [1.0, 1.0]"}</CodeBlock>

<Prose>{"The original Gaussian run reaches training accuracy 1.000 with 20 reported support vectors; the XOR run reaches 0.925 with 32 in this environment. These are training demonstrations, not held-out estimates. The printed primal and dual values assess the optimization of those particular objectives. A small residual gap can coexist with statistically poor predictions."}</Prose>

<Prose>{"For n observations with d dense features, this teaching solver stores a full n×n Gram matrix and examines all pairs. Building the kernel costs O(n²d), each exhaustive step costs O(n²), and memory is O(n²+nd). These are its implementation costs. LIBSVM uses decomposition and a bounded kernel cache; it need not allocate an entire dense Gram matrix. A linear model can use quite different algorithms and storage."}</Prose>

<H3>{"Keep the gradient instead of rebuilding it"}</H3>

<Prose>{"The old complete solver above demonstrates the mathematics with a fresh certificate at every step. The next pair of files separates the model from its driver and keeps a reusable gradient. This is a different small implementation, with a newly declared six-row comparison; it does not rerun the old Gaussian or XOR fits."}</Prose>

<SvmReadingFlowFigure job="D24" />

<Prose>{"The maintained vector G=1−Qα is the same dual gradient called u in the pair derivation. In this new three-row example, G=[.596,.732,.610]. For pair0,2 the labels differ, so both coefficients increase by the same δ. Their slope is .610+.596=1.206; their curvature is2.9. The unconstrained choice1.206/2.9≈.415862 lies inside [−.2,.6]. It changes α to approximately [.715862,.1,.615862] and improves the dual by .250764827586."}</Prose>

<Prose>{"Every gradient entry must then change, even the coefficient that was not edited. For row1, subtracting the two column contributions gives .732−.53δ−.22δ≈.420103448276. In matrix form:"}</Prose>

<div className="neural-equation"><MathBlock>{"G_{\\rm new}=G_{\\rm old}-Q_{:,i}\\Delta\\alpha_i-Q_{:,j}\\Delta\\alpha_j."}</MathBlock></div>

<Prose>{"This update costs O(n), whereas computing Qα afresh costs O(n²). The code checks the final maintained vector against a fresh computation. RBF pair curvature uses −2expm1(−γ‖xᵢ−xⱼ‖²) rather than subtracting two almost equal numbers2−2k. Direct coordinate differences also avoid subtracting large squared norms of nearby inputs. The kernel constructor processes16 left rows at a time, so its largest displacement temporary has shape16×n×d rather than n×n×d."}</Prose>

<SvmReadingFlowFigure job="D25" />

<Prose>{"Periodic certificates reduce repeated global work; they do not replace the final global check. The exhaustive pair search is still O(n²) per iteration and stores Q and the Gram in O(n²) space. The new bounds are2–100 rows and1–20 features, with finite magnitudes≤1000. They make the example inspectable; production LIBSVM's working-set rules, bounded cache and shrinking solve a different engineering problem."}</Prose>

<Prose>{"The helper below owns copied training rows, feature and row identities, coefficients and its stop state. "}<code>{"decision_function"}</code>{" accepts any number of correctly shaped query rows, including a rectangular batch, and uses every coefficient. "}<code>{"export_state"}</code>{" returns independent numeric lists. "}<code>{"from_state"}</code>{" validates the schema, dimensions, class/tie convention, box/balance constraints and reconstructed objective; it does not train or trust an arbitrary pickle. Feature identities matter: two same-shaped feature columns can still mean different measurements."}</Prose>

<Prose>{"Save "}<strong>{"both"}</strong>{" complete files in the same directory and launch "}<code>{"python svm_mechanisms.py"}</code>{". The import "}<code>{"from svm_core import PairSVM"}</code>{" resolves the neighboring helper. Importing the helper alone performs no fit."}</Prose>

<Prose>{""}<strong>{"svm_core.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/svm_core.py" filename="svm_core.py" title="Maintained-gradient model and saved state" />

<Prose>{""}<strong>{"svm_mechanisms.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/svm_mechanisms.py" filename="svm_mechanisms.py" title="Maintained-gradient demonstrations — requires adjacent svm_core.py" />

<Prose>{"Recorded output for the complete example above:"}</Prose>

<CodeBlock language="text" kind="output" filename="svm_mechanisms-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"fit_inputs\": {\n    \"x\": [\n      [\n        -1.3,\n        0.2\n      ],\n      [\n        -0.6,\n        -0.4\n      ],\n      [\n        0.4,\n        0.7\n      ],\n      [\n        1.1,\n        -0.3\n      ],\n      [\n        -0.2,\n        1.3\n      ],\n      [\n        0.8,\n        1.2\n      ]\n    ],\n    \"y\": [\n      -1.0,\n      -1.0,\n      1.0,\n      1.0,\n      -1.0,\n      1.0\n    ],\n    \"C\": 0.8,\n    \"gamma\": 0.7\n  },\n  \"fits\": [\n    {\n      \"kernel\": \"linear\",\n      \"status\": \"stalled before gap criterion\",\n      \"steps\": 10,\n      \"primal\": 1.8565711336692083,\n      \"dual\": 1.8565711195240668,\n      \"gap\": 1.414514150255286e-08,\n      \"alpha\": [\n        0.0,\n        0.4798269313343522,\n        0.8,\n        0.036776651140958905,\n        0.8,\n        0.4430502801933933\n      ],\n      \"bias\": -0.20930231529044818,\n      \"queries\": [\n        [\n          0.15,\n          -0.8\n        ],\n        [\n          -0.7,\n          0.6\n        ],\n        [\n          1.4,\n          0.25\n        ]\n      ],\n      \"scores\": [\n        -0.22093020114771117,\n        -0.8837209366835996,\n        1.4767441919599662\n      ],\n      \"ordinary_scores\": [\n        -0.22093028118690702,\n        -0.8837209221944172,\n        1.4767442002793796\n      ],\n      \"ordinary_fit_status\": 0,\n      \"ordinary_iterations\": [\n        20\n      ],\n      \"max_score_difference\": 8.003919585441999e-08,\n      \"trace\": [\n        {\n          \"step\": 0,\n          \"primal\": 4.800000000000001,\n          \"dual\": 0.0,\n          \"gap\": 4.800000000000001\n        },\n        {\n          \"step\": 10,\n          \"primal\": 1.8565711336692083,\n          \"dual\": 1.8565711195240668,\n          \"gap\": 1.414514150255286e-08\n        }\n      ]\n    },\n    {\n      \"kernel\": \"rbf\",\n      \"status\": \"stalled before gap criterion\",\n      \"steps\": 22,\n      \"primal\": 2.6235557320008183,\n      \"dual\": 2.623555712293491,\n      \"gap\": 1.9707327325590995e-08,\n      \"alpha\": [\n        0.5665488286349352,\n        0.8,\n        0.8,\n        0.7029442820545673,\n        0.8,\n        0.6636045465803679\n      ],\n      \"bias\": 0.040498072919396666,\n      \"queries\": [\n        [\n          0.15,\n          -0.8\n        ],\n        [\n          -0.7,\n          0.6\n        ],\n        [\n          1.4,\n          0.25\n        ]\n      ],\n      \"scores\": [\n        -0.037761551784420394,\n        -0.7356436108327726,\n        1.0923116677309306\n      ],\n      \"ordinary_scores\": [\n        -0.03776153364150414,\n        -0.7356435880179112,\n        1.092311685763549\n      ],\n      \"ordinary_fit_status\": 0,\n      \"ordinary_iterations\": [\n        30\n      ],\n      \"max_score_difference\": 2.281486144450895e-08,\n      \"trace\": [\n        {\n          \"step\": 0,\n          \"primal\": 4.800000000000001,\n          \"dual\": 0.0,\n          \"gap\": 4.800000000000001\n        },\n        {\n          \"step\": 10,\n          \"primal\": 2.623844835113486,\n          \"dual\": 2.6235556288488793,\n          \"gap\": 0.0002892062646067117\n        },\n        {\n          \"step\": 20,\n          \"primal\": 2.623555809796043,\n          \"dual\": 2.6235557122934807,\n          \"gap\": 9.750256246832123e-08\n        },\n        {\n          \"step\": 22,\n          \"primal\": 2.6235557320008183,\n          \"dual\": 2.623555712293491,\n          \"gap\": 1.9707327325590995e-08\n        }\n      ]\n    }\n  ],\n  \"changed_pair\": {\n    \"Q\": [\n      [\n        0.7300000000000001,\n        0.53,\n        0.66\n      ],\n      [\n        0.53,\n        0.65,\n        0.22000000000000006\n      ],\n      [\n        0.66,\n        0.22000000000000006,\n        0.8500000000000001\n      ]\n    ],\n    \"alpha_before\": [\n      0.3,\n      0.1,\n      0.2\n    ],\n    \"G_before\": [\n      0.596,\n      0.732,\n      0.61\n    ],\n    \"pair\": [\n      0,\n      2\n    ],\n    \"slope\": 1.206,\n    \"curvature\": 2.9000000000000004,\n    \"interval\": [\n      -0.2,\n      0.6000000000000001\n    ],\n    \"delta\": 0.4158620689655172,\n    \"gain\": 0.25076482758620694,\n    \"alpha_after\": [\n      0.7158620689655172,\n      0.1,\n      0.6158620689655172\n    ],\n    \"G_after\": [\n      0.017951724137931002,\n      0.4201034482758621,\n      -0.017951724137931058\n    ]\n  }\n}"}</CodeBlock>

<Prose>{"The driver compares the same newly declared data, C=.8 and γ=.7 with ordinary "}<code>{"SVC"}</code>{", using linear and RBF kernels. Different working-set schedules can yield different coefficient distributions; query scores and the objective certificate are the meaningful comparisons. JSON roundtrip preserves scores, and changing the exported lists cannot mutate the fitted arrays."}</Prose>

<NeuralTable caption={"Keep the gradient instead of rebuilding it"} headers={[<>{"Newly executed model"}</>,<>{"Steps"}</>,<>{"Primal"}</>,<>{"Dual"}</>,<>{"Gap"}</>,<>{"Largest query-score difference from ordinary SVC"}</>]} rows={[[<>{"Linear"}</>,<>{"10"}</>,<>{"1.8565711336692083"}</>,<>{"1.8565711195240668"}</>,<>{"1.414514150255286e−8"}</>,<>{"8.003919585441999e−8"}</>],[<>{"RBF"}</>,<>{"22"}</>,<>{"2.6235557320008183"}</>,<>{"2.623555712293491"}</>,<>{"1.9707327325590995e−8"}</>,<>{"2.281486144450895e−8"}</>]]} />

<Prose>{"Both runs stop "}<strong>{"stalled before gap criterion"}</strong>{": their best pair gain falls below the implementation's1e−15 threshold while the remaining gap exceeds the requested1e−9 relative criterion. Ordinary SVC reports fit status0 in both comparisons. Small score differences do not upgrade the scratch stop status. The complete saved traces include the initial objective4.8 and every recorded checkpoint."}</Prose>

<Prose>{"To make a changed case, set a smaller "}<code>{"max_steps"}</code>{" on a fresh model and inspect its status and gap; changing the cap must not reuse a prior fitted state. For duplicated opposite-label rows, verify the linear pair solution rather than skip zero curvature. To change class/sample penalties, use the weighted library route in §8: this core's bias breakpoint rule assumes one common C and is not a weighted implementation."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 5."}</strong>{" Two observations have opposite labels at the identical zero vector, C=0.7 and both coefficients initially zero. What does the best pair step do, and why is skipping q=0 wrong?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The legal increment interval is [0,0.7]. The gain has no quadratic term."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Here q=0 and g=2, so the best increment is 0.7. Both coefficients become 0.7 and the dual increases to 1.4. At w=b=0, the two hinges are one each, giving primal 1.4 as well. The gap is zero despite inseparable data. Skipping the zero-curvature pair would leave an objective gap of 1.4."}</Prose>

</details></div></section>

<H2>{"7. Select the model using held-out evidence"}</H2>

<Prose>{"Optimization answers “how well did we minimize this training objective?” Model selection asks a different question: “which complete prediction procedure works on observations excluded from its fit?” We now create 200 noisy moon-shaped observations and split their identities before fitting anything: 120 training, 40 validation and 40 final test cases. The scaler learns its means and standard deviations only from the training set."}</Prose>

<SvmReadingFlowFigure job="D26" />

<Prose>{"A transformed query coordinate is (xⱼ−μⱼ)/sⱼ, using the training mean μⱼ and population standard deviation sⱼ. Constant training coordinates use the scaler's unit-scale convention rather than division by zero. These saved numbers are part of the predictor. Recomputing them from a query batch changes the model."}</Prose>

<SvmReadingFlowFigure job="D27" />

<Prose>{"Each cell is an actual fitted RBF SVC, not a hand-painted accuracy surface. Select a cell to see its saved support-point predictor and switch between training and validation observations. The grid deliberately includes a model with better training accuracy but worse validation accuracy. A finite background grid approximates its decision display; the reported accuracies are evaluated at the actual observation coordinates."}</Prose>

<Prose>{"Will the model with the highest training accuracy also be the first winner on validation data?"}</Prose>

<Prose>{""}<strong>{"moons-validation.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/moons-validation.py" filename="moons-validation.py" title="Select C and gamma using observations outside training" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="moons-validation-output.txt" title="Recorded output">{"rows: train=120, validation=40, test=40\nC= 0.1 gamma= 0.1 train=0.833 valid=0.900 SV=93\nC= 0.1 gamma= 1.0 train=0.925 valid=0.950 SV=93\nC= 0.1 gamma=10.0 train=0.975 valid=0.950 SV=120\nC= 1.0 gamma= 0.1 train=0.825 valid=0.900 SV=53\nC= 1.0 gamma= 1.0 train=0.975 valid=0.975 SV=40\nC= 1.0 gamma=10.0 train=0.975 valid=0.950 SV=80\nC=10.0 gamma= 0.1 train=0.900 valid=0.925 SV=45\nC=10.0 gamma= 1.0 train=0.983 valid=0.950 SV=21\nC=10.0 gamma=10.0 train=0.992 valid=0.925 SV=76\nselected C=1, gamma=1; one test score=1.000"}</CodeBlock>

<Prose>{"The first validation winner in the declared ordering is C=1, γ=1: 39/40 validation cases and 40/40 test cases in this generated split. The test result is not a zero population error guarantee. Repeatedly trying new grids after inspecting that test set would turn it into selection data. A larger study would report uncertainty and stability across an appropriate resampling design; grouped or time-ordered observations need a split respecting those dependencies."}</Prose>

<Prose>{"Scaling matters because feature distances enter both the norm penalty and RBF similarities. A measurement in milliseconds can numerically dominate another in seconds without being more useful. During cross-validation, imputation, scaling, feature selection and target-dependent transforms must be fitted inside each training fold. A pipeline enforces that boundary. Dense examples here use standard scaling; for sparse matrices, centering can destroy sparsity, so choose a sparse-compatible transformation such as "}<code>{"StandardScaler(with_mean=False)"}</code>{" when appropriate. Categories need a deliberate numerical representation; arbitrary integer codes impose arbitrary distances."}</Prose>

<Prose>{"Where is each scaler fitted during cross-validation, and how does the selected model compare with a majority baseline?"}</Prose>

<Prose>{""}<strong>{"heldout-classification.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/heldout-classification.py" filename="heldout-classification.py" title="Fit and compare complete classification pipelines" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="heldout-classification-output.txt" title="Recorded output">{"train=350, test=150; majority test accuracy=0.507\nRBF {'svc__C': 10.0, 'svc__gamma': 0.1}\nCV=0.926 held-out accuracy=0.920\nlinear squared hinge {'linearsvc__C': 1.0}\nCV=0.843 held-out accuracy=0.807\nRBF support counts by class: [117, 123]\nRBF decision shape: (3,)\nSelection/CV and these held-out comparisons do not establish a universal winner."}</CodeBlock>

<Prose>{"This complete 500-row example uses 350 training and 150 held-out test observations. Its cross-validated RBF pipeline obtains test accuracy 0.920; the linear pipeline obtains 0.807 and the majority baseline 0.507 in this run. The generator, split, search grids and versions are all in the program. These values do not establish that RBF always wins, or that one raw C value gives equivalent regularization in both implementations."}</Prose>

<H3>{"A declared comparison on measured wine chemistry"}</H3>

<Prose>{"The moons example controlled a synthetic geometry. To test the workflow on measured inputs, the next study uses178 wines described by13 chemical measurements and three cultivar classes. This is the bundled "}<code>{"load_wine"}</code>{" dataset from UCI, with original row identities and source attribution retained. A cultivar label is a categorical outcome; it is not a wine quality score."}</Prose>

<Prose>{"The question is whether added kernel flexibility earns better held-out classification under one fixed protocol. Original data attribution is Aeberhard and Forina, UCI DOI10.24432/C5PC7J under CC BY4.0; the dataset source describes wines from one Italian region, and does not supply producer/vintage grouping identities for this comparison. Before fitting, original row IDs are split into106 training,36 validation and36 test cases. The first stratified split holds out36 test IDs using seed61; the second takes36 validation IDs from the remaining142 using seed67. The class counts are [35,43,28] in training and [12,14,10] in each holdout."}</Prose>

<Prose>{"Each candidate fits its own "}<code>{"StandardScaler"}</code>{" on those106 training rows. The linear candidates are ordinary "}<code>{"SVC(kernel='linear')"}</code>{", so their hinge and unpenalized-intercept contract matches C-SVC. They are followed by RBF candidates. Selection uses "}<strong>{"balanced accuracy"}</strong>{", the arithmetic mean of the three class recalls. A recall is the correctly predicted count in one true class divided by that class's observed count. Ordinary accuracy instead divides all correct predictions by all rows. The first listed candidate wins an exact balanced-accuracy tie; accuracy is reported but does not break ties."}</Prose>

<SvmReadingFlowFigure job="D28" />

<NeuralTable caption={"A declared comparison on measured wine chemistry"} headers={[<>{"Index"}</>,<>{"Kernel"}</>,<>{"C"}</>,<>{"γ"}</>,<>{"Training balanced accuracy"}</>,<>{"Validation balanced accuracy"}</>,<>{"Validation accuracy"}</>,<>{"Support count"}</>]} rows={[[<>{"0"}</>,<>{"Linear"}</>,<>{".1"}</>,<>{"—"}</>,<>{"1.000000"}</>,<>{".952381"}</>,<>{".944444"}</>,<>{"34"}</>],[<>{"1"}</>,<>{"Linear"}</>,<>{"1"}</>,<>{"—"}</>,<>{"1.000000"}</>,<>{".952381"}</>,<>{".944444"}</>,<>{"24"}</>],[<>{"2"}</>,<>{"Linear"}</>,<>{"10"}</>,<>{"—"}</>,<>{"1.000000"}</>,<>{".952381"}</>,<>{".944444"}</>,<>{"24"}</>],[<>{"3"}</>,<>{"RBF"}</>,<>{".1"}</>,<>{".01"}</>,<>{".352381"}</>,<>{".333333"}</>,<>{".388889"}</>,<>{"104"}</>],[<>{"4"}</>,<>{"RBF"}</>,<>{".1"}</>,<>{".1"}</>,<>{".954762"}</>,<>{".966667"}</>,<>{".972222"}</>,<>{"100"}</>],[<>{"5"}</>,<>{"RBF"}</>,<>{".1"}</>,<>{"1"}</>,<>{".333333"}</>,<>{".333333"}</>,<>{".388889"}</>,<>{"106"}</>],[<>{"6"}</>,<>{"RBF"}</>,<>{"1"}</>,<>{".01"}</>,<>{"1.000000"}</>,<>{".976190"}</>,<>{".972222"}</>,<>{"60"}</>],[<>{"7"}</>,<>{"RBF"}</>,<>{"1"}</>,<>{".1"}</>,<>{"1.000000"}</>,<>{".976190"}</>,<>{".972222"}</>,<>{"54"}</>],[<>{"8"}</>,<>{"RBF"}</>,<>{"1"}</>,<>{"1"}</>,<>{"1.000000"}</>,<>{".561111"}</>,<>{".611111"}</>,<>{"106"}</>],[<>{"9"}</>,<>{"RBF"}</>,<>{"10"}</>,<>{".01"}</>,<>{"1.000000"}</>,<>{".952381"}</>,<>{".944444"}</>,<>{"30"}</>],[<>{"10"}</>,<>{"RBF"}</>,<>{"10"}</>,<>{".1"}</>,<>{"1.000000"}</>,<>{".976190"}</>,<>{".972222"}</>,<>{"52"}</>],[<>{"11"}</>,<>{"RBF"}</>,<>{"10"}</>,<>{"1"}</>,<>{"1.000000"}</>,<>{".650000"}</>,<>{".694444"}</>,<>{"106"}</>]]} />

<Prose>{"The table is rounded for reading; the complete output retains full precision, predictions, confusion matrices and each class's recall. All twelve fits report convergence under the declared100,000-iteration cap. Index6 is the first exact winner, with validation balanced accuracy .9761904761904763. It misclassifies one validation observation: validation accuracy is35/36. Several more flexible fits classify every training row while performing much worse on validation. High training accuracy therefore cannot substitute for the held-out comparison."}</Prose>

<Prose>{"The selected "}<strong>{"training-only"}</strong>{" pipeline is frozen before test evaluation; it is not refitted on training plus validation. It correctly classifies all36 test rows. Its confusion matrix has true-class rows and predicted-class columns:"}</Prose>

<NeuralTable caption={"A declared comparison on measured wine chemistry"} headers={[<>{"True / predicted"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2"}</>]} rows={[[<>{"0"}</>,<>{"12"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"1"}</>,<>{"0"}</>,<>{"14"}</>,<>{"0"}</>],[<>{"2"}</>,<>{"0"}</>,<>{"0"}</>,<>{"10"}</>]]} />

<Prose>{"The training-most-frequent baseline always chooses class1. It gets14/36 correct, accuracy .388889 and balanced accuracy1/3, with all12 class0 and all10 class2 rows missed. Both models were evaluated once on this test set. The perfect selected-model count describes these36 observations, not all future wines. Unknown producer, vintage or measurement-batch dependencies would require group-aware splitting; a convenient small historical dataset is not evidence for operational deployment."}</Prose>

<Prose>{"The complete program below records every candidate outcome before comparing it with the provisional best, refuses to overwrite its output, records the source description and actual data/target hashes, and keeps the numeric selected state. A failed candidate cap is retained as protocol failure and stops the test stage; it does not silently increase the cap or omit a weak result. "}<code>{"--output wine-svm-study-results.json"}</code>{" selects a new output path. To modify the comparison, declare a fresh split/grid and untouched evaluation set before running it; do not tune this stored test result."}</Prose>

<Prose>{""}<strong>{"wine-svm-study.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/wine-svm-study.py" filename="wine-svm-study.py" title="Declared measured-data comparison; saved result records all twelve outcomes" />

<Prose>{"The selected multiclass support coefficients use SVC's packed pairwise layout. They are stored for reproducibility; the live report displays observed outcomes and does not treat this layout as a single binary coefficient vector. The next section explains why those prediction contracts differ."}</Prose>

<H2>{"8. Scores, probabilities, classes and data contracts"}</H2>

<H3>{"A margin score is not a probability"}</H3>

<Prose>{"A score has a sign and an arbitrary optimization scale. To see why its magnitude cannot simply mean confidence, consider many possible labels at the same input. Let p be the true probability of label+1 there and let t be the score we choose. The expected hinge cost is"}</Prose>

<div className="neural-equation"><MathBlock>{"R_p(t)=p\\max(0,1-t)+(1-p)\\max(0,1+t)."}</MathBlock></div>

<Prose>{"For −1≤t≤1 this becomes1+(1−2p)t. If .5<p<1 its minimum is at t=1; if0<p<.5 it is at t=−1. Thus p=.6 and p=.99 have the same minimizing score1. At p=.5 every t in [−1,1] minimizes the risk. At the endpoints p=1 all t≥1 minimize; at p=0 all t≤−1 minimize. The unregularized conditional calculation is an explanation of what hinge asks for, not a formula for the fitted regularized model's conditional probabilities."}</Prose>

<Prose>{"A large signed score describes a position relative to the fitted margin scale. It is not a calibrated probability. A separate sigmoid calibration fits a map such as 1/(1+exp(Af+B)) using labeled scores not produced by a model trained on those same observations. The sign of A is learned; the class ordering must be checked rather than inferred from a column number."}</Prose>

<Prose>{""}<strong>{"Version contract:"}</strong>{" in scikit-learn 1.9.1, "}<code>{"SVC(probability=...)"}</code>{" is deprecated and scheduled for removal in 1.11. The current API recommends an explicit "}<code>{"CalibratedClassifierCV"}</code>{" wrapper. The older lesson's implicit probability program is preserved in its source archive; the executed workflow below calibrates the complete scaling-and-SVC pipeline."}</Prose>

<SvmReadingFlowFigure job="D29" />

<Prose>{"Each pictured fold fits a whole pipeline on the other folds and produces scores for its excluded rows. Concatenating these "}<strong>{"out-of-fold"}</strong>{", OOF, scores gives one score per supplied training observation from a base model that excluded it. Their labels fit the probability map. Then a fresh base pipeline fits all supplied training data for future queries. This is the explicit "}<code>{"ensemble=False"}</code>{" route."}</Prose>

<Prose>{"Each fold's scaler must remain inside that pipeline. An ensemble configuration instead retains fold-specific calibrated models and averages their probabilities. A frozen previously fitted estimator requires separate calibration observations. If hyperparameters were selected using all the same training labels before this out-of-fold step, those scores are not a clean account of the entire selection procedure; nested selection or an independent calibration split addresses that additional dependence."}</Prose>

<Prose>{"To assess probabilities, temporarily encode the positive-class event by an indicator z=1, with z=0 for the other class; these are not the signed margin labels−1/+1. For positive-class probability p, binary "}<strong>{"Brier loss"}</strong>{" is (p−z)² and log loss is −[z log p+(1−z)log(1−p)]. Average each over the held-out rows. Lower is better on the same target population. For example z=1,p=.8 gives Brier .04 and log loss −log(.8)≈.223144. Binary Brier is this one-event convention; summing both class-coordinate squares would give twice that value."}</Prose>

<Prose>{"Which observations fit each scaler and classifier, and what does a held-out Brier score establish?"}</Prose>

<Prose>{""}<strong>{"calibrated-pipeline.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/calibrated-pipeline.py" filename="calibrated-pipeline.py" title="Calibrate the entire pipeline on out-of-fold scores" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="calibrated-pipeline-output.txt" title="Recorded output">{"classes: [0, 1] probability shape: (150, 2)\nfirst three positive probabilities: [0.0944, 0.0914, 0.1411]\nprior Brier=0.2500; calibrated Brier=0.0742\nheld-out log loss=0.2328\nrows sum to one: True\nA finite held-out proper score is an assessment, not proof of perfect calibration."}</CodeBlock>

<Prose>{"The program prints both scores, verifies probability normalization and looks up the positive class through "}<code>{"classes_"}</code>{". An aggregate Brier improvement does not prove calibration within every subgroup or after distribution shift. Probability argmax and the original uncalibrated class rule can disagree. "}<a href={"/learn/path/full-curriculum/calibration-conformal-prediction"}>{"Calibration & Conformal Prediction"}</a>{" develops reliability, uncertainty and separate guarantees."}</Prose>

<H3>{"Weights, multiclass scores and interchangeable-looking APIs"}</H3>

<SvmReadingFlowFigure job="D30" />

<Prose>{"Class and sample weights replace the uniform hinge price by Cᵢ=C×class_weight[yᵢ]×sample_weight[i], and the dual upper bound becomes αᵢ≤Cᵢ. They change the objective, not the number of independent minority examples. For balanced class weighting, scikit-learn uses n/(K nₖ); a 95-to-5 binary split gives the minority class 19 times the majority's per-example weight. Whether that tradeoff is useful depends on errors, costs and held-out metrics. In the full binary library example below, a deliberate modification is to construct "}<code>{"SVC(C=.65, kernel='linear', class_weight={'left': 1., 'right': 2.})"}</code>{" and call "}<code>{".fit(x.copy(), y, sample_weight=np.ones(len(y)))"}</code>{" on its defined six-row data. This assigns price .65 to a left row and1.3 to a right row. Changing a single sample weight to .5 halves that row's price only. Keep weights finite and nonnegative, and select any cost policy using the permitted training/validation evidence. The displayed unweighted result remains the original execution; this modification defines a new fit, not a reinterpretation of its saved coefficients."}</Prose>

<Prose>{"SVC trains one binary model for each class pair: K(K−1)/2 models. Its default one-versus-rest-shaped decision output transforms that pairwise information; it does not mean the training procedure became one-versus-rest. Four classes produce six pairwise scores, or four presented class scores. LinearSVC normally fits one-versus-rest models instead."}</Prose>

<Prose>{"How many binary models are trained for four classes, and does switching output presentation retrain them?"}</Prose>

<Prose>{""}<strong>{"multiclass-and-gram.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/multiclass-and-gram.py" filename="multiclass-and-gram.py" title="Inspect multiclass scores and precomputed kernel shapes" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="multiclass-and-gram-output.txt" title="Recorded output">{"classes: [0, 1, 2, 3] binary pairs: 6\nOVO score shape: (3, 6)\nOVR score shape: (3, 4)\nlabels unchanged: True\ntrain/query Gram shapes: (120, 120) (40, 120)\nprecomputed labels agree: True"}</CodeBlock>

<Prose>{"A precomputed kernel passed to fit has shape training-by-training. At prediction it has query-by-training shape, with columns in the exact original training order. A square query-by-query matrix answers a different question and cannot replace it. The complete program verifies agreement between the ordinary linear kernel and this explicitly constructed matrix."}</Prose>

<SvmReadingFlowFigure job="D31" />

<Prose>{"Take training rows A=(−1,0) and B=(1,0), signed coefficients [−.5,.5] and bias0. Three query rows (.4,.2),(−.7,1),(1.2,−.3) produce rows [−.4,.4],[.7,−.7],[−1.2,1.2] in a3×2 Gram. Multiplying by the matching coefficients returns [.4,−.7,1.2]. Swapping only A/B columns negates every score. Swapping their coefficients and identities together preserves every score. Equal dimensions do not establish equal meaning."}</Prose>

<H3>{"Reconstruct an ordinary library model without fitting again"}</H3>

<Prose>{"The next complete binary program fits six new observations with string labels. It saves numeric copies of the rows, feature identities, signed coefficients, bias and "}<code>{"classes_"}</code>{". SVC's binary "}<code>{"dual_coef_"}</code>{" is already signed; multiplying it by labels a second time changes the score. A nonnegative score here maps to the second class, with an explicit score-zero tie convention. This local convention is not a promise about every multiclass or exact library tie."}</Prose>

<Prose>{""}<strong>{"library-state-and-gram.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/library-state-and-gram.py" filename="library-state-and-gram.py" title="Ordinary binary state and named rectangular Gram" />

<Prose>{"Recorded output for the complete example above:"}</Prose>

<CodeBlock language="text" kind="output" filename="library-state-and-gram-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"inputs\": {\n    \"training\": [\n      [\n        -1.4,\n        -0.2\n      ],\n      [\n        -0.7,\n        0.9\n      ],\n      [\n        -0.3,\n        -0.8\n      ],\n      [\n        0.45,\n        0.4\n      ],\n      [\n        1.2,\n        -0.6\n      ],\n      [\n        0.8,\n        1.1\n      ]\n    ],\n    \"labels\": [\n      \"left\",\n      \"left\",\n      \"left\",\n      \"right\",\n      \"right\",\n      \"right\"\n    ],\n    \"queries\": [\n      [\n        -0.25,\n        0.7\n      ],\n      [\n        0.35,\n        -0.9\n      ],\n      [\n        1.7,\n        0.2\n      ]\n    ],\n    \"C\": 0.65\n  },\n  \"state\": {\n    \"schema\": 1,\n    \"kernel\": \"linear\",\n    \"classes\": [\n      \"left\",\n      \"right\"\n    ],\n    \"training\": [\n      [\n        -1.4,\n        -0.2\n      ],\n      [\n        -0.7,\n        0.9\n      ],\n      [\n        -0.3,\n        -0.8\n      ],\n      [\n        0.45,\n        0.4\n      ],\n      [\n        1.2,\n        -0.6\n      ],\n      [\n        0.8,\n        1.1\n      ]\n    ],\n    \"train_ids\": [\n      \"train-0\",\n      \"train-1\",\n      \"train-2\",\n      \"train-3\",\n      \"train-4\",\n      \"train-5\"\n    ],\n    \"feature_order\": [\n      \"first\",\n      \"second\"\n    ],\n    \"signed_coefficients\": [\n      0.0,\n      -0.4485446937339855,\n      -0.6496080151363256,\n      0.65,\n      0.3322245125671377,\n      0.11592819630307906\n    ],\n    \"bias\": -0.36882128983777335,\n    \"tie_column\": 1\n  },\n  \"query_gram_shape\": [\n    3,\n    6\n  ],\n  \"scores\": [\n    -0.47908745810809783,\n    -0.190114054567993,\n    1.8897338352626591\n  ],\n  \"ordinary_fit_status\": 1,\n  \"ordinary_iterations\": [\n    100000\n  ],\n  \"support_count\": [\n    2,\n    3\n  ],\n  \"wrong_column_scores\": [\n    -0.6054690684049484,\n    -0.0640693712426007,\n    -0.4060246223110818\n  ],\n  \"wrong_named_columns_rejected\": true,\n  \"callable_copy_scores\": [\n    -0.47908744417652055,\n    -0.19011405373995985,\n    1.8897338197984375\n  ],\n  \"precomputed_scores\": [\n    -0.47908744417652055,\n    -0.19011405373995985,\n    1.8897338197984375\n  ],\n  \"capped\": {\n    \"fit_status\": 1,\n    \"iterations\": [\n      1\n    ],\n    \"warnings\": [\n      \"Solver terminated early (max_iter=1).  Consider pre-processing your data with StandardScaler or MinMaxScaler.\"\n    ]\n  }\n}"}</CodeBlock>

<Prose>{"The program checks three-query predictions against ordinary "}<code>{"decision_function"}</code>{", including a new precomputed-kernel fit. It then permutes rows, coefficients and identities together and checks invariance. Moving columns alone deliberately fails the agreement. The callable-kernel estimator receives its own copied training array because an estimator may keep a reference for later kernel evaluation; mutating someone else's original array must not redefine the saved predictor."}</Prose>

<Prose>{"The primary ordinary fit also reaches its100,000-iteration cap: status1 is retained, and its score reconstruction is an inference agreement check rather than a convergence certificate. Its "}<code>{"max_iter=1"}</code>{" example records an additional explicit cap warning and status1. A capped fit may still return scores; that does not mean its optimization converged. The returned numeric state is for this binary linear route. The complete earlier four-class example retains the documented multiclass behavior; extending a binary formula to its packed coefficients requires a separate derivation."}</Prose>

<Prose>{"Similar interfaces, different training contracts"}</Prose>

<NeuralTable caption={"Reconstruct an ordinary library model without fitting again"} headers={[<>{"Estimator"}</>,<>{"Loss / intercept convention"}</>,<>{"Practical consequence"}</>]} rows={[[<>{"SVC(kernel=\"linear\")"}</>,<>{"C-SVC hinge; unpenalized intercept"}</>,<>{"Kernel/decomposition implementation, pairwise multiclass"}</>],[<>{"LinearSVC (default loss)"}</>,<>{"Squared hinge; synthetic intercept feature is regularized"}</>,<>{"Different objective and solver; default one-versus-rest"}</>],[<>{"SGDClassifier(loss=\"hinge\")"}</>,<>{"Averaged hinge with declared regularization α"}</>,<>{"Iterative optimization; relate α to C using sample count and the exact objective"}</>]]} />

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 6."}</strong>{" A team scales all rows before cross-validation, then calibrates an SVC. Deployment has a different class mixture. Identify two separate problems and their remedies."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate leakage during fitting from a change in the population where probabilities are used."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"First, validation folds influenced the shared scaler: put scaling inside every fitted pipeline, including calibration folds. Second, changed deployment populations can invalidate calibration and decision thresholds even after leakage is repaired. Evaluate and, where justified, recalibrate on representative data; do not claim that a leakage-free wrapper guarantees robustness to arbitrary shift."}</Prose>

</details></div></section>

<H2>{"9. Regression replaces the margin with a tolerance"}</H2>

<Prose>{"The preceding sections predicted a class. We now change the target itself: each observed y is a number, so a sign decision no longer describes the task."}</Prose>

<SvmReadingFlowFigure job="D32" />

<Prose>{"For a numerical target, being “on the correct side” makes no sense. Support vector regression, SVR, instead ignores vertical residuals within a chosen tolerance ε≥0. Outside the tube, it pays only for the excess. If a prediction is 10 and ε=2, targets from 8 through 12 have zero ε-insensitive loss. A target of 15 pays 3, not 5. The tube is not a confidence interval or a coverage guarantee."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\\ell_\\epsilon(y,f)&=\\max(0,|y-f|-\\epsilon),\\\\P(w,b)&=\\tfrac12\\|w\\|^2\\\\&\\quad+C\\sum_i\\ell_\\epsilon(y_i,f_i).\\end{aligned}"}</MathBlock></div>

<Prose>{"Consider x=−1,0,+1 and targets −a,0,+a with a≥0. Reflecting any fitted line and averaging it with its reflection preserves its slope, sets b=0 and cannot increase the convex objective, so an optimum with b=0 exists. Negative slopes are worse than zero, and slopes above a cost more than slope a without reducing loss. On 0≤w≤a, the objective is ½w²+2C max(0,a−w−ε), giving w*=min(2C,max(a−ε,0)). This special fixture makes the entire tube calculation visible."}</Prose>

<Prose>{"Increase ε first: the region where error is free grows. Then change C: the optimizer may accept more excess in exchange for a smaller slope. The display expands its target axis from the actual permitted tube and observations, so a large tolerance does not silently clip the geometry."}</Prose>

<Prose>{"A point above the tube asks the predictor to rise; a point below it asks the predictor to fall. We therefore need two nonnegative constraint prices per row, one for each direction. Their difference becomes the signed contribution to the predictor. Inside the tube neither direction requires a correction. This is the classification dual's price interpretation applied to two inequalities instead of one."}</Prose>

<Prose>{"To derive the dual, introduce separate nonnegative slacks for yᵢ−fᵢ−ε and fᵢ−yᵢ−ε. Their multipliers are αᵢ and αᵢ*. Write the first margin expression as yᵢ−w·φᵢ−b−ε−ξᵢ and the second as w·φᵢ+b−yᵢ−ε−ξᵢ*. In the Lagrangian their weight coefficient is −Σ(αᵢ−αᵢ*)φᵢ. Completing its square gives w=Σ(αᵢ−αᵢ*)φᵢ. The unrestricted bias requires Σ(αᵢ−αᵢ*)=0. Each slack has coefficient C−its price−its nonnegativity multiplier, hence both prices lie in [0,C]. Substituting leaves the target-weighted linear term, two epsilon charges and the negative half squared feature norm:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}d_i&=\\alpha_i-\\alpha_i^*,\\\\D&=\\sum_i y_i d_i\\\\&\\quad-\\epsilon\\sum_i(\\alpha_i+\\alpha_i^*)\\\\&\\quad-\\frac12\\sum_{i,j}d_i d_j K_{ij},\\\\0\\le\\alpha_i,\\alpha_i^*&\\le C,\\\\\\sum_i d_i&=0,\\\\f(x)&=\\sum_i d_i k(x_i,x)+b.\\end{aligned}"}</MathBlock></div>

<Prose>{"A point strictly inside the tube has both multipliers zero. On the tube, a multiplier can be zero, free or bounded; outside it, the relevant multiplier reaches C. For a free αᵢ, b=yᵢ−ε−ΣdⱼKⱼᵢ; for a free αᵢ*, b=yᵢ+ε−ΣdⱼKⱼᵢ. When ε=0 or data are duplicated, coefficient representations may be degenerate. An exact edge of the tube does not force a nonzero coefficient."}</Prose>

<Prose>{"If targets are divided by ten, how must C and epsilon change for the predictions to agree after converting back?"}</Prose>

<Prose>{""}<strong>{"regression-tube-units.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/regression-tube-units.py" filename="regression-tube-units.py" title="Convert the regression target units without changing the fit" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="regression-tube-units-output.txt" title="Recorded output">{"slope=1.0; excess=[0.5, 0.0, 0.5]; objective=1.00\noriginal predictions: [-1.0, 0.0, 1.0]\nconverted back: [-1.0, 0.0, 1.0]\nsigned dual coefficients: [[-0.5, 0.5]]"}</CodeBlock>

<H3>{"The unit of the target changes the objective"}</H3>

<SvmReadingFlowFigure job="D34" />

<Prose>{"Suppose y'=(y−μ)/s with s>0. To preserve the same predictor after converting back, set w'=w/s, b'=(b−μ)/s, ε'=ε/s and C'=C/s. The transformed loss is the old loss divided by s and the transformed squared norm is divided by s²; these parameter changes therefore multiply the whole objective by 1/s². Keeping C numerically unchanged instead selects a different tradeoff."}</Prose>

<Prose>{"What is the epsilon tolerance in original target units, and how does held-out error compare with predicting the training mean?"}</Prose>

<Prose>{""}<strong>{"heldout-regression.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/heldout-regression.py" filename="heldout-regression.py" title="Fit a regression pipeline in training-estimated target units" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="heldout-regression-output.txt" title="Recorded output">{"mean baseline: MAE=68.852 RMSE=96.146\nSVR: MAE=18.859 RMSE=33.531\ntraining target SD=95.917; epsilon in original units=9.592\nsupport rows: 59"}</CodeBlock>

<Prose>{"The regression pipeline estimates both feature scaling and target scaling on its training set. Its chosen ε=0.1 in standardized target units is about 9.592 original units in this run, because the training target standard deviation is about 95.917. The held-out MAE is 18.859 versus a training-mean baseline of 68.852. The standardized C=10 describes its declared new objective; it is not an equivalent re-expression of the older raw-target C=10 fit. The example demonstrates a complete unit-aware workflow, not a causal claim that scaling alone explains all performance differences."}</Prose>

<H3>{"Pull the epsilon loss back through the prediction"}</H3>

<Prose>{"The tube's two directions also determine a scratch gradient. Define rᵢ=yᵢ−fᵢ. Outside the tube, increasing f reduces the loss by sign(rᵢ); inside it the loss is locally zero. At a boundary a whole interval of subgradients is allowed; this program selects zero. "}</Prose>

<SvmReadingFlowFigure job="D33" />

<Prose>{"For the objective λ‖w‖²/2+CΣℓε, the selected pullback is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}g_w&=\\lambda w-C\\sum_{|r_i|>\\epsilon}\\operatorname{sign}(r_i)x_i,\\\\\ng_b&=-C\\sum_{|r_i|>\\epsilon}\\operatorname{sign}(r_i).\n\\end{aligned}"}</MathBlock></div>

<Prose>{"Compute both from the same old weights and bias before taking the atomic step. This is an approximate primal optimizer with a diminishing rate, finite cap and best-objective snapshot. It does not claim to reproduce LIBSVM's dual trajectory. Its ordinary linear SVR comparison instead reconstructs the library's query scores from signed dual coefficients and support rows."}</Prose>

<Prose>{"For this new four-row fixture, the old predictions are approximately [−.270,.135,.665,.281] and residuals [−.130,.465,.635,−.081]. Only the two middle rows exceed ε=.2. Their signed feature sum is [2,.5], so g_w=[.35,−.12]−.7[2,.5]=[−1.05,−.47] and g_b=−.7·2=−1.4. At η=.02, the atomic result is w'=[.371,−.1106], b'=.108, reducing the objective .55845 to .49304668."}</Prose>

<Prose>{""}<strong>{"epsilon-primal.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/epsilon-primal.py" filename="epsilon-primal.py" title="Epsilon pullback and consistent target units" />

<Prose>{"Recorded output for the complete example above:"}</Prose>

<CodeBlock language="text" kind="output" filename="epsilon-primal-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"inputs\": {\n    \"x\": [\n      [\n        -1.0,\n        0.0\n      ],\n      [\n        0.5,\n        1.0\n      ],\n      [\n        1.5,\n        -0.5\n      ],\n      [\n        0.3,\n        -0.8\n      ]\n    ],\n    \"y\": [\n      -0.4,\n      0.6,\n      1.3,\n      0.2\n    ],\n    \"C\": 0.7,\n    \"epsilon\": 0.2\n  },\n  \"before\": {\n    \"objective\": 0.55845,\n    \"gradient_w\": [\n      -1.0499999999999998,\n      -0.47\n    ],\n    \"gradient_b\": -1.4,\n    \"prediction\": [\n      -0.26999999999999996,\n      0.135,\n      0.6649999999999999,\n      0.28099999999999997\n    ],\n    \"residual\": [\n      -0.13000000000000006,\n      0.46499999999999997,\n      0.6350000000000001,\n      -0.08099999999999996\n    ],\n    \"excess\": [\n      0.0,\n      0.26499999999999996,\n      0.4350000000000001,\n      0.0\n    ]\n  },\n  \"after\": {\n    \"w\": [\n      0.371,\n      -0.11059999999999999\n    ],\n    \"b\": 0.108,\n    \"objective\": 0.4930466799999999\n  },\n  \"scratch\": {\n    \"w\": [\n      0.5561928276016418,\n      0.10853395709835734\n    ],\n    \"b\": 0.31997685102367635,\n    \"objective\": 0.16057093448343482,\n    \"steps\": 4000,\n    \"status\": \"iteration cap\"\n  },\n  \"library\": {\n    \"queries\": [\n      [\n        -0.3,\n        0.9\n      ],\n      [\n        1.1,\n        -0.7\n      ],\n      [\n        0.6,\n        0.2\n      ]\n    ],\n    \"predictions\": [\n      0.30392156464922493,\n      0.8529411827587524,\n      0.7019607877786322\n    ],\n    \"signed_coefficients\": [\n      0.4575163484246063,\n      -0.4575163484246063\n    ],\n    \"intercept\": 0.3450980360074394,\n    \"fit_status\": 0,\n    \"iterations\": 2\n  },\n  \"unit_conversion\": {\n    \"offset\": -0.3,\n    \"scale\": 10.0,\n    \"C_new\": 0.06999999999999999,\n    \"epsilon_new\": 0.02,\n    \"objective_before\": 0.55845,\n    \"objective_scaled\": 0.005584499999999999,\n    \"restored_predictions\": [\n      0.3039215646492251,\n      0.8529411827587527,\n      0.7019607877786325\n    ]\n  }\n}"}</CodeBlock>

<Prose>{"The scratch4000-step run stops at its "}<strong>{"iteration cap"}</strong>{", retaining objective .16057093448343482; the ordinary linear SVR reports status0 after2 iterations. The scratch best state and library's dual state are not asserted identical."}</Prose>

<Prose>{"The newly executed program also divides targets and the matching parameters by10 and restores the ordinary predictions to their original units. The algebraic unit identity applies to any positive finite scale while finite arithmetic permits it. The scratch optimizer has a separately declared tuning/data box; a transformed C outside [.001,100] or a transformed target outside magnitude1000 is not silently clipped into that box. The conversion still defines the mathematical corresponding problem, which a different numerical configuration may be needed to solve."}</Prose>

<Prose>{"A constant target can be represented by zero weights and its constant bias with zero loss. At ε=0 the loss becomes absolute residual; a zero residual selects zero from its valid subgradient set. Neither case justifies dividing by a zero target standard deviation. For a changed example, move one target outside its old tube, inspect the sign of its contribution, and compare the scratch status rather than insist on identical final weights."}</Prose>

<H3>{"Choose which residual behavior the task needs"}</H3>

<Prose>{"Epsilon loss deliberately treats every residual inside its tube equally. If small errors should still influence fitting, a "}<strong>{"Huber"}</strong>{" loss changes the near-zero behavior: it uses r²/2 for |r|≤δ and δ(|r|−δ/2) outside. At r=.1 with ε=.2, tube loss is0; Huber with δ=.2 pays.005. The large-error slope is bounded, while the small-error branch stays smooth. This changes the objective rather than smooths an optimizer for the identical tube problem."}</Prose>

<Prose>{"If underprediction and overprediction have different costs, "}<strong>{"quantile"}</strong>{", or pinball, loss uses τr for r≥0 and (τ−1)r for r<0, with0<τ<1. At τ=.8, residual+1 pays.8 and residual−1 pays.2. Its asymmetric prices seek a conditional quantile under suitable population assumptions; they do not give an epsilon-tube coverage guarantee."}</Prose>

<Prose>{"The current "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.svm.LinearSVR.html"}>{"LinearSVR API"}</a>{" offers epsilon-insensitive or squared epsilon-insensitive loss using LIBLINEAR. Its fitted intercept is a regularized synthetic feature, unlike the unpenalized intercept in our SVR derivation. Its default epsilon is0. For a deliberate alternative to the full regression program, choose the loss, epsilon, intercept scaling and cap explicitly, then compare original-unit held-out metrics. Identical C numbers alone do not establish identical objectives or fits."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 7."}</strong>{" Targets are divided by four. The original SVR uses ε=2 and C=6. Which transformed parameters preserve the same objective up to a positive factor?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Both the error tolerance and the tradeoff coefficient carry the target rescaling."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Use ε'=0.5 and C'=1.5. Scale weights and bias by one quarter, then multiply predictions by four to return to the original units. Changing ε alone does not compensate for the different scaling of squared weight size and absolute excess loss."}</Prose>

</details></div></section>

<H2>{"10. Structured features and the cost of a kernel"}</H2>

<H3>{"A sequence kernel with an inspectable meaning"}</H3>

<Prose>{"A kernel need not start with a fixed-length numeric measurement vector. Count the overlapping pieces of length k in a sequence, assigning one coordinate to each possible piece. The dot product between two count vectors is a valid kernel: sequences are similar when they share many of the same local pieces. This is the spectrum-kernel idea, used in the original research for protein-sequence classification."}</Prose>

<SvmReadingFlowFigure job="D35" />

<Prose>{"For ACACA at k=2, the overlapping windows start at positions0,1,2,3: AC,CA,AC,CA. In coordinate order [AA,AC,CA,CC], the vector is [0,2,2,0]. The count coordinates describe the pieces themselves, not their original positions; the same AC coordinate collects both AC windows. AACCA instead gives [1,1,1,1]. Their dot product is0·1+2·1+2·1+0·1=4."}</Prose>

<Prose>{"Can two different sequences become indistinguishable after counting their two-character pieces?"}</Prose>

<Prose>{""}<strong>{"sequence-kernel.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/sequence-kernel.py" filename="sequence-kernel.py" title="Turn overlapping sequence pieces into a valid kernel" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="sequence-kernel-output.txt" title="Recorded output">{"coordinates: ['AA', 'AC', 'CA', 'CC']\nfeatures: [[0, 2, 2, 0], [0, 2, 2, 0], [1, 1, 1, 1]]\nGram: [[8, 8, 4], [8, 8, 4], [4, 4, 4]]\ndot products agree: True\nDifferent positions can have the same two-mer counts: True"}</CodeBlock>

<Prose>{"With two-character pieces, ACACA and CACAC both contain two AC pieces and two CA pieces. Their representations are identical despite different order and endpoints. No classifier using only this representation can distinguish them. Raising C or choosing a more accurate optimizer cannot recover information discarded by the features. Increasing k, adding position information or changing the representation is a different modeling decision that needs validation."}</Prose>

<Prose>{"Normalized similarity k(x,z)/√(k(x,x)k(z,z)) is another valid feature inner product for nonzero feature vectors. A sequence shorter than k has a zero count vector and needs an explicit policy; division by zero is not a normalization convention. Our small program uses raw counts and a declared alphabet. It demonstrates the mechanism without claiming biological performance."}</Prose>

<H3>{"When explicit finite features are useful"}</H3>

<SvmReadingFlowFigure job="D36" />

<Prose>{"A dense float64 Gram matrix has 8n² bytes before overhead: n=10,000 already means 800 million bytes. That describes a full matrix, not an unavoidable allocation by every SVM library. LIBSVM's cache trades recomputation against memory. At inference, a general kernel predictor evaluates the kernel against its saved support points; a linear predictor can collapse them into one weight vector. Neither an arbitrary sample-count cutoff nor a fixed speedup is universal."}</Prose>

<Prose>{"Costs depend on the representation and implementation"}</Prose>

<NeuralTable caption={"When explicit finite features are useful"} headers={[<>{"Method"}</>,<>{"Typical relevant work"}</>,<>{"What the bound leaves visible"}</>]} rows={[[<>{"This exhaustive pair solver"}</>,<>{"O(n²d + Tn²); O(n²+nd) memory"}</>,<>{"Full dense Gram and T all-pair steps"}</>],[<>{"Saved kernel prediction"}</>,<>{"O(nSV × cost of one kernel)"}</>,<>{"Support count and feature dimension matter"}</>],[<>{"Collapsed linear prediction"}</>,<>{"O(d)"}</>,<>{"A kernel expansion is unnecessary"}</>],[<>{"SGD over D explicit features"}</>,<>{"O(nD) per dense epoch"}</>,<>{"Constructing those D features has its own cost"}</>]]} />

<Prose>{"Until now the model has compared a query with saved training observations. A finite feature approximation changes where that work happens: transform every observation into a fixed list of coordinates, then use a linear learner on those coordinates. One route chooses random oscillating measurements; another uses similarities to selected training landmarks. Both approximate a desired kernel, but they obtain their coordinates differently."}</Prose>

<SvmReadingFlowFigure job="D37" />

<Prose>{"With two illustrative frequencies (1,0),(0,1) and phases0,π/2, the input (.5,−.25) produces cos(.5) and cos(−.25+π/2)=sin(.25), approximately [.877583,.247404]. Those hand-picked frequencies make the operations visible; they are not a random RBF sample. The distribution below determines which kernel the average construction approximates."}</Prose>

<Prose>{""}<strong>{"Random Fourier features"}</strong>{" approximate the RBF kernel explicitly. Draw ω from a zero-mean Gaussian with covariance 2γI and a phase b uniformly from [0,2π]. Use D coordinates √(2/D) cos(ωⱼ·x+bⱼ). The identity2cos(a+b)cos(c+b)=cos(a−c)+cos(a+c+2b) explains the phase step: a uniform full-period phase makes the second term's average zero. The remaining term is cos(ω·(x−z)). A Gaussian frequency with covariance2γI has characteristic function exp(−½(x−z)ᵀ2γI(x−z))=e⁻ᵞ‖ˣ⁻ᶻ‖². Summing D independent coordinates with scale√(2/D) therefore gives that kernel in expectation. The finite sum still fluctuates around it."}</Prose>

<Prose>{"Every realized finite feature map gives a positive semidefinite Gram matrix, but a finite draw is only an approximation to the desired kernel. The expectation identity is not a guarantee that one seed improves accuracy. Constructing D dense features costs O(ndD) straightforwardly; a subsequent dense linear training epoch costs O(nD). Storage can be batched, but the construction cost does not disappear."}</Prose>

<Prose>{"For the landmark route, imagine describing a location by its distances to a few known stations. Here the coordinates are similarities to selected training rows. Those reference rows can be redundant, so their own similarity matrix tells us how to rescale and combine the raw coordinates without counting the same direction repeatedly. First work the redundant case by hand using the matrix operation from §5."}</Prose>

<SvmReadingFlowFigure job="D38" />

<Prose>{"Choose the two distinct training identities0 and1 at the same landmark position "}<code>{"(.6,−.4)"}</code>{", as in the saved duplicate example below. Each RBF self-similarity is1 and the cross-similarity is also1, so their landmark Gram is "}<code>{"W=[[1,1],[1,1]]"}</code>{". Two unit-length directions make its action explicit:"}</Prose>

<div className="neural-equation"><MathBlock>{"u_+=\\frac1{\\sqrt2}\\begin{pmatrix}1\\\\1\\end{pmatrix},\\quad\nu_-=\\frac1{\\sqrt2}\\begin{pmatrix}1\\\\-1\\end{pmatrix},\\qquad\nWu_+=2u_+,\\quad Wu_-=0."}</MathBlock></div>

<Prose>{"Each vector has squared length "}<code>{"(1²+1²)/2=1"}</code>{", and their dot product is "}<code>{"(1−1)/2=0"}</code>{": they provide perpendicular coefficient directions. The common direction represents the repeated reference; the difference direction cancels. Only one independent direction has a positive eigenvalue, so the retained "}<strong>{"rank"}</strong>{" is1. With the program's relative cutoff1e−12, the threshold is "}<code>{"1e−12*max(1,2)=2e−12"}</code>{": eigenvalue2 is retained and0 is discarded."}</Prose>

<Prose>{"Any new row has the same similarity k to both copies, giving raw row "}<code>{"B=(k,k)"}</code>{". Projecting it onto the unit directions gives "}<code>{"B u+=(k+k)/sqrt2=sqrt2*k"}</code>{" and "}<code>{"B u−=(k−k)/sqrt2=0"}</code>{". Divide the retained common coordinate by the square root of its eigenvalue2: "}<code>{"(sqrt2*k)/sqrt2=k"}</code>{". This inverse-root step prevents the two copies from counting as two independent references. We discard the zero direction rather than divide by its square root; "}<code>{"1/sqrt0"}</code>{" is undefined."}</Prose>

<Prose>{"At either landmark, k=1, so the feature is1. For the saved third row "}<code>{"(-.7,.2)"}</code>{", squared distance to the landmark is "}<code>{"(-1.3)²+.6²=2.05"}</code>{". At γ=.45 its feature is "}<code>{"k=exp(−.45*2.05)≈.397523987817"}</code>{", agreeing with the saved output. Its feature dot product with the landmark is "}<code>{"k*1=k"}</code>{". If a changed query has similarity k=.3 to both copies, the same projection/scaling gives the feature.3; two such query coordinates have dot product.09. These are actual hand operations before the general notation, not new fitted experiments."}</Prose>

<Prose>{""}<strong>{"Nyström features"}</strong>{" generalize that construction to m selected training landmarks Z. For n input rows with d measurements, "}<code>{"B=K(X,Z)"}</code>{" is n×m and "}<code>{"W=K(Z,Z)"}</code>{" is m×m. An "}<strong>{"orthonormal eigenbasis"}</strong>{" of the symmetric W means unit-length, mutually perpendicular eigenvectors; the duplicate vectors above are its two-column example. Retain r directions with positive eigenvalues above the chosen cutoff. "}<code>{"Uᵣ"}</code>{" is the m×r matrix whose columns are those retained directions, and "}<code>{"Λᵣ"}</code>{" is the r×r diagonal matrix of their eigenvalues. Its inverse square root has diagonal entries "}<code>{"1/sqrt(λ_j)"}</code>{". First "}<code>{"B Uᵣ"}</code>{" projects each similarity row onto the r directions; then multiplication by "}<code>{"Λᵣ⁻¹ᐟ²"}</code>{" rescales each projected coordinate. The n×r feature matrix and its n×n Gram are"}</Prose>

<div className="neural-equation"><MathBlock>{"F=B U_r\\Lambda_r^{-1/2},\\qquad\nFF^\\top=B U_r\\Lambda_r^{-1}U_r^\\top B^\\top."}</MathBlock></div>

<Prose>{"The "}<strong>{"pseudoinverse convention"}</strong>{" here inverts only retained positive eigenvalues and gives discarded directions zero weight; zero eigenvalues are not inverted. Very small positive eigenvalues require numerical care or truncation. Fit landmark selection inside the training boundary. Dense construction involves kernel work O(nmd), projection O(nmr), and an O(m³) landmark eigendecomposition, followed by training on r features."}</Prose>

<Prose>{"Does a smaller Gram approximation error necessarily imply a better held-out classification result in this one run?"}</Prose>

<Prose>{""}<strong>{"kernel-approximations.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/kernel-approximations.py" filename="kernel-approximations.py" title="Compare finite kernel features with the original kernel" />

<Prose>{"Recorded output from the earlier execution:"}</Prose>

<CodeBlock language="text" kind="output" filename="kernel-approximations-output.txt" title="Recorded output">{"exact RBF held-out accuracy=0.967\nrandom features: shape=(210, 60), Gram RMSE=0.1271, held-out accuracy=0.889\nNystrom: shape=(210, 60), Gram RMSE=0.0235, held-out accuracy=0.956\nThis is a finite approximation comparison, not a training-speed benchmark."}</CodeBlock>

<Prose>{"The program uses 60 explicit features or landmarks and compares their Gram errors and held-out classifications with a fixed exact RBF model. It deliberately uses linear-kernel SVC on these small transformed datasets so the loss and intercept conventions remain comparable. It is not a speed benchmark. Using LinearSVC or SGD for a large problem is useful, but then declare their objective and stopping differences instead of attributing every change solely to the approximation. "}<a href={"/learn/path/full-curriculum/randomized-linear-algebra"}>{"Randomized Linear Algebra"}</a>{" develops approximation error and low-rank structure further."}</Prose>

<H3>{"Build and inspect both approximations"}</H3>

<Prose>{"The next complete program constructs spectrum counts, RFF and rank-aware Nyström features. Its RFF random-number generator and draw order deliberately match the inspected "}<code>{"RBFSampler"}</code>{" implementation: draw the full normal frequency matrix, then uniform phases. Without those details, comparing coordinates elementwise would test different random states. The program checks both training and a new rectangular query batch against the ordinary transform."}</Prose>

<Prose>{"Nyström eigenvectors may differ by signs or rotations inside a repeated eigenspace, so the meaningful comparisons are realized training Gram and query-to-training cross-Gram, not raw coordinates. The scratch code retains eigenvalues above "}<code>{"relative_cutoff * max(1,largest_eigenvalue)"}</code>{" and rejects materially negative ones. The ordinary library's SVD floor is a separate convention; the nonsingular comparison agrees, while the deliberate duplicate case teaches the scratch rank convention."}</Prose>

<Prose>{""}<strong>{"kernel-feature-mechanisms.py"}</strong>{""}</Prose>

<RemoteCodeBlock source="/learn-code/support-vector-machines-svm/kernel-feature-mechanisms.py" filename="kernel-feature-mechanisms.py" title="Explicit features and retained-rank convention" />

<Prose>{"Recorded output for the complete example above:"}</Prose>

<CodeBlock language="text" kind="output" filename="kernel-feature-mechanisms-output.txt" title="Recorded output">{"{\n  \"versions\": {\n    \"numpy\": \"2.3.5\",\n    \"sklearn\": \"1.9.1\"\n  },\n  \"spectrum\": {\n    \"strings\": [\n      \"CAACAC\",\n      \"ACCAAA\",\n      \"\"\n    ],\n    \"words\": [\n      \"AA\",\n      \"AC\",\n      \"CA\",\n      \"CC\"\n    ],\n    \"counts\": [\n      [\n        1.0,\n        2.0,\n        2.0,\n        0.0\n      ],\n      [\n        2.0,\n        1.0,\n        1.0,\n        1.0\n      ],\n      [\n        0.0,\n        0.0,\n        0.0,\n        0.0\n      ]\n    ],\n    \"gram\": [\n      [\n        9.0,\n        6.0,\n        0.0\n      ],\n      [\n        6.0,\n        7.0,\n        0.0\n      ],\n      [\n        0.0,\n        0.0,\n        0.0\n      ]\n    ]\n  },\n  \"inputs\": {\n    \"x\": [\n      [\n        -0.9,\n        0.4\n      ],\n      [\n        0.2,\n        -0.6\n      ],\n      [\n        0.8,\n        0.5\n      ],\n      [\n        -0.3,\n        1.1\n      ],\n      [\n        1.2,\n        -0.2\n      ]\n    ],\n    \"queries\": [\n      [\n        0.15,\n        0.35\n      ],\n      [\n        -0.6,\n        -0.1\n      ],\n      [\n        1.4,\n        0.8\n      ]\n    ],\n    \"gamma\": 0.45\n  },\n  \"rff\": {\n    \"seed\": 17,\n    \"omega\": [\n      [\n        0.2620888356842852,\n        -1.7594546824592434,\n        0.5918845639504684,\n        1.0865376914857376,\n        0.9839652741049845,\n        1.7898228421357072,\n        -0.10596630226596103,\n        -0.3435194919409144,\n        0.1410455320713307,\n        -0.41531756495853245,\n        2.0598352493098577,\n        1.0931774889390624\n      ],\n      [\n        -1.725476888584778,\n        -0.13096510397093755,\n        0.5121368252928148,\n        -1.68418065510456,\n        1.2474014085882235,\n        -0.44915225475378795,\n        -1.0361802644512514,\n        -0.23719685803090246,\n        -0.9318861995787435,\n        0.9783477638306263,\n        0.4661201465984335,\n        -0.4237261735382245\n      ]\n    ],\n    \"phase\": [\n      3.5687934580622827,\n      0.5173559024487111,\n      3.42432703215533,\n      0.9987672483128179,\n      4.252223478300645,\n      0.7443831939965014,\n      2.795992744398332,\n      5.579358183330077,\n      5.009380886994954,\n      0.42712294662677097,\n      6.036807514750099,\n      4.141909635790574\n    ],\n    \"features\": [\n      [\n        -0.358492539639911,\n        -0.18768094392999887,\n        -0.4078330414520544,\n        0.3243095346083981,\n        -0.3058380577707396,\n        0.2045056112719365,\n        -0.3213324018180807,\n        0.3602995455276877,\n        -0.08218783652590521,\n        0.15087717435332862,\n        -0.13729383829018257,\n        -0.4034771948530207\n      ],\n      [\n        -0.022805781089212582,\n        0.39615138682391554,\n        -0.4064525162835856,\n        -0.24894289454749616,\n        -0.3461108067082715,\n        0.08068914001673871,\n        -0.39505563910641395,\n        0.3298246335138557,\n        0.3157768852957751,\n        0.3962591457954558,\n        0.40559451680277353,\n        -0.03978511264966942\n      ],\n      [\n        -0.397878948622545,\n        0.23557765147361012,\n        -0.21633189072392048,\n        0.21160463559346693,\n        0.33224339833962835,\n        -0.15175705572399845,\n        -0.23798121858606938,\n        0.18618289953948358,\n        -0.022896737030937277,\n        0.34057716897678475,\n        -0.026009895890432972,\n        0.03758700679036718\n      ],\n      [\n        -0.008713766687046199,\n        0.25340945836713213,\n        -0.32036883107057434,\n        0.15559012418845303,\n        0.23613764451455846,\n        0.39159248255442863,\n        -0.04773238075143495,\n        0.2658339107022406,\n        -0.28431222853433563,\n        -0.0233001176282978,\n        0.3832733668794901,\n        -0.3995945290224509\n      ],\n      [\n        -0.18996516987851692,\n        0.001224592426729904,\n        -0.25677599550414176,\n        -0.3578511151122512,\n        0.18529488281476256,\n        -0.4030603801519425,\n        -0.3939413435945435,\n        0.19650707802681164,\n        0.24791819387767017,\n        0.39379051599702436,\n        -0.21734132557233252,\n        0.3001765719445497\n      ]\n    ],\n    \"queries\": [\n      [\n        -0.4044005830012493,\n        0.39948255425372803,\n        -0.3478783467186876,\n        0.34320041503689125,\n        0.05050117234999914,\n        0.2676987674549158,\n        -0.30580146492708327,\n        0.27298451579464605,\n        -0.0032706190159597745,\n        0.3103313584117429,\n        0.3978905590050749,\n        -0.21505669123536977\n      ],\n      [\n        -0.36892828385618803,\n        -0.006257750317469177,\n        -0.4051333565468926,\n        0.35524268123791003,\n        -0.37673136190460993,\n        0.3918266509582756,\n        -0.40176878088959167,\n        0.36323955269385017,\n        0.12280957911313724,\n        0.3418244097163936,\n        0.017102789099467768,\n        -0.3780898860966146\n      ],\n      [\n        -0.34007804374827555,\n        -0.18846856084502836,\n        -0.020287336636237135,\n        0.1583101166357244,\n        0.38425995802644425,\n        -0.3954780101995366,\n        -0.10017110771647046,\n        0.07961921876184715,\n        -0.10141883055799225,\n        0.3302706774563744,\n        -0.4047340400004981,\n        0.23753483924406116\n      ]\n    ],\n    \"finite_gram_eigenvalues\": [\n      0.09884166916234251,\n      0.49840349438736475,\n      0.6851705880999419,\n      1.341999355724955,\n      2.0734322141507584\n    ],\n    \"max_exact_kernel_difference\": 0.4672221055524906\n  },\n  \"nystrom\": {\n    \"indices\": [\n      4,\n      1,\n      0\n    ],\n    \"rank\": 3,\n    \"cutoff\": 1.755297545170794e-12,\n    \"features\": [\n      [\n        -0.18041451473681278,\n        0.8064052588423815,\n        -0.5631706325649728\n      ],\n      [\n        0.43154163330260564,\n        -0.07268759893098739,\n        -0.899159792077119\n      ],\n      [\n        -0.30203682936674514,\n        -0.2042031594906833,\n        -0.6771503815662357\n      ],\n      [\n        -0.227253402861251,\n        0.5015357251646483,\n        -0.42032204560940173\n      ],\n      [\n        -0.36095703745775487,\n        -0.48996118724928145,\n        -0.7935036560085877\n      ]\n    ]\n  },\n  \"duplicate_landmarks\": {\n    \"rank\": 1,\n    \"all_eigenvalues\": [\n      0.0,\n      2.0\n    ],\n    \"cutoff\": 2e-12,\n    \"features\": [\n      [\n        0.9999999999999999\n      ],\n      [\n        0.9999999999999999\n      ],\n      [\n        0.39752398781664455\n      ]\n    ]\n  }\n}"}</CodeBlock>

<Prose>{"In this newly executed example, twelve RFF coordinates have maximum absolute training-kernel difference .4672221055524906 from the exact RBF. Their realized Gram eigenvalues are all positive in this fixture; that does not make the approximation exact. Three chosen landmark rows have rank3. Duplicating the landmark position produces eigenvalues [0,2] and retained rank1 with cutoff2e−12. The feature rows at the duplicate location are1; the remaining row has coordinate approximately .397523987817."}</Prose>

<Prose>{"When all landmarks are distinct and W is invertible, multiplying the feature matrix by its transpose gives BW⁻¹Bᵀ. With rank truncation it instead gives BWᵣ†Bᵀ, where † means invert only retained positive eigenvalues. This notation describes exactly which directions the implementation discards. Store the selected training rows, their order, basis, eigenvalues and cutoff; selecting new landmarks from each query batch would change the predictor."}</Prose>

<Prose>{"To modify the example, choose a different declared seed or number of features and inspect both kernel error and the eventual held-out task. Do not choose a seed by repeatedly reading final test accuracy. For sequences, a length shorter than k has no windows and returns a zero vector. Changing k changes the coordinate schema, so both training and query representations must use the same k and word order."}</Prose>

<H3>{"What wider feature spaces do and do not buy"}</H3>

<Prose>{"In a kernel feature space, minimizing the squared weight norm still favors a large normalized training margin. Generalization arguments also depend on the feature radius, the sample and the assumptions under which future observations are drawn. Adding irrelevant dimensions can increase distances or hide useful structure; an infinite-dimensional kernel is not an escape from sample limitations. The held-out protocol remains necessary."}</Prose>

<Prose>{"The two-point optimum already gives a small "}<strong>{"regularization path"}</strong>{": w(C)=2C until C=.5, then w(C)=1. Below that breakpoint both coefficients are at their upper bounds; above it they are free and the margin reaches1. More general paths follow changing active constraints and can have many segments. This program solves one specified C at a time; it does not implement a general path-following algorithm."}</Prose>

<Prose>{"A deeper alternative, ν-SVC, makes a different tradeoff parameter explicit. One common formulation minimizes ½‖w‖²−νρ+(1/n)Σξᵢ subject to yᵢfᵢ≥ρ−ξᵢ, ξᵢ≥0 and ρ≥0. Here ρ is a learned margin level. For a valid feature kernel and an optimal KKT solution with positiveρ, ν bounds the margin-error fraction from above and the positive-coefficient support-vector fraction from below. To see why, stationarity in ρ gives Σαᵢ=ν and each slack price limits αᵢ≤1/n. A positive slack, hence a margin error, forces αᵢ=1/n, so the error count divided by n cannot exceedν. Conversely, collecting total massν with at most1/n per positive coefficient requires at leastνn such coefficients. Numerical display thresholds are separate from these exact mathematical counts. A "}<strong>{"margin error"}</strong>{" means yᵢfᵢ<ρ; it need not be a wrong sign classification. These bounds are not an accuracy guarantee."}</Prose>

<Prose>{"Both signs must supply enough coefficient mass to satisfy balance. For n₊ positive and n₋ negative labels, feasibility requires ν≤2min(n₊,n₋)/n in the usual ν-SVC dual. Thus a95:5 split cannot use ν=.5; its class-count limit is .1. Boundary equalities, duplicate features and a zeroρ need care in applying support/error-fraction statements. The original "}<a href={"https://www.stat.purdue.edu/~yuzhu/stat598m3/Papers/NewSVM.pdf"}>{"New Support Vector Algorithms"}</a>{" and current library documentation give these conditions; do not interpret ν as the fraction of wrong labels."}</Prose>

<Prose>{"One-class SVM solves a related but different support-estimation problem using mostly unlabeled observations. Its ν parameter and anomaly decision do not follow by relabeling the C-SVC examples above. That mechanism is owned by "}<a href={"/learn/path/full-curriculum/anomaly-outlier-detection-isolation-forest-one-class-svm-lof"}>{"Anomaly & Outlier Detection"}</a>{"."}</Prose>

<H2>{"11. Diagnose, transfer and continue"}</H2>

<Prose>{"A symptom should trigger a specific investigation"}</Prose>

<NeuralTable caption={"11. Diagnose, transfer and continue"} headers={[<>{"Observed issue"}</>,<>{"Inspect first"}</>,<>{"Avoid concluding"}</>]} rows={[[<>{"Training excellent, validation weak"}</>,<>{"Split integrity, C/γ, representation, data shift"}</>,<>{"That optimization failed merely because test error is high"}</>],[<>{"Many support vectors"}</>,<>{"Margin distribution, C, overlap and actual prediction cost"}</>,<>{"That all support vectors automatically means underfitting"}</>],[<>{"LinearSVC differs from SVC linear"}</>,<>{"Loss, intercept penalty, multiclass and tolerance"}</>,<>{"That one library is wrong from predictions alone"}</>],[<>{"Unexpected probabilities"}</>,<>{"Class columns, calibration folds and deployment population"}</>,<>{"That a score magnitude is a probability"}</>],[<>{"SVR tube seems meaningless"}</>,<>{"Target units, ε, C and baseline error"}</>,<>{"That a default tolerance has universal significance"}</>],[<>{"Optimization stalls"}</>,<>{"Feasibility, gap, zero curvature and step status"}</>,<>{"That an inactivity counter proves optimality"}</>]]} />

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 8."}</strong>{" All training observations have positive support coefficients. Give two incompatible explanations consistent with that fact, and say what additional evidence you need."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Revisit the separated two-point example and the conflicting-label example."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"A perfectly separated tiny dataset can have every observation on the binding margins. An overlapping or low-C fit can also give every observation a positive coefficient. Inspect training margins, losses and objective conditions, then use held-out performance and the application baseline to assess usefulness. Support count alone diagnoses neither fit quality nor generalization."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 9."}</strong>{" Every input coordinate is multiplied by ten, with no standardization. Which RBF γ preserves all pairwise similarities? Would the same adjustment work if only one coordinate changed?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Square the Euclidean distance scaling before comparing exponents."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"All squared distances grow by 100, so γ must be divided by 100. Scaling only one coordinate changes relative directional geometry; a single scalar γ cannot generally undo it. Use a feature transformation or an explicitly chosen anisotropic metric, fitted within the data-role boundary."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 10."}</strong>{" A precomputed-kernel model trained on 40 observations receives five new queries. What shape must its prediction matrix have, and why is a 5×5 matrix insufficient?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each column supplies similarity to one original training observation."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Use 5×40, with the 40 columns in training order. Query-to-query similarities omit the support contributions that the trained model needs. Even a 5×40 matrix with permuted columns changes the mathematical predictor unless the coefficients are permuted consistently."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 11."}</strong>{" Two sequences have the same spectrum-count vector but opposite labels. Can changing C, a polynomial degree on those vectors, or the optimizer make both classifications correct?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"A deterministic classifier receives identical feature inputs."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"No. Every deterministic function of those identical vectors returns the same score for both. A different kernel applied only to the same count vectors cannot restore the missing information. Change the representation or acknowledge irreducible ambiguity under that feature contract; validate any proposed replacement."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 12."}</strong>{" Complete an independent report using a changed noise level or a new generated seed. Declare your classification or regression target, split, baseline, preprocessing, search and final evaluation before reading test results. If reporting probabilities or target tolerances, document their units and data roles."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Reuse the structure of a complete program, but do not reuse its selected score as an acceptance threshold. Keep test observations outside every selection and calibration decision."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"A successful report reproduces its dataset and identities; fits all learned transforms on permitted rows; compares with a meaningful baseline; states the exact objective, library version and stopping status; chooses hyperparameters using training/validation evidence; and evaluates the locked procedure on untouched test data. It explains support counts and errors without treating them as universal diagnostics. Calibration requires a separate data-role account, and SVR requires an original-unit interpretation of ε and C. There is no predetermined correct accuracy: the changed experiment is supposed to supply new evidence."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 13."}</strong>{" In the three-row hinge update from §3, change only λ from .5 to1 and keep η=.1. Compute both new weights and bias from the old snapshot. Then put a separate row exactly at signed margin1: can an ordinary central finite difference establish differentiability there? What changes for squared hinge?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The data pullback stays [4/3,0]; only λw changes. At the hinge kink, inspect one-sided slopes rather than their average."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The old w=[.2,−.1] and b=.1 give all three rows active. The gradient becomes [.2−4/3,−.1]=[−17/15,−.1] and the bias gradient remains−1/3. The simultaneous step gives w'=[47/150,−.09] and b'=2/15. Using a changed weight to calculate the bias update would no longer be this specified atomic step."}</Prose>

<Prose>{"Hinge's left loss slope at m=1 is−1 and its right slope is0. There is no ordinary derivative; any value in [−1,0] is a valid subgradient. This implementation selects0 for that row's loss contribution. A symmetric difference can average the two one-sided slopes, which does not prove differentiability. Squared hinge has slope−2(1−m) below1 and0 above, so both one-sided slopes reach0 at1. Its active-row data pullback must include the factor2(1−m), rather than reuse the hinge's indicator."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 14."}</strong>{" A saved binary state names training columns [A,B,C] and signed coefficients [−.4,.1,.3]. A new query arrives with Gram row [2,1,−1] whose columns are named [C,A,B]. Bias is .2. Repair the mismatch and give the score. Would permuting only the coefficients of the saved training state repair arbitrary future matrices?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the names to reorder one representation consistently; matching matrix dimensions is insufficient."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"Reorder this query row to [A,B,C]=[1,−1,2]. Its score is (−.4)·1+.1·(−1)+.3·2+.2=.3. Equivalently, keep the incoming [C,A,B] row and use coefficients [.3,−.4,.1], explicitly declaring that same order. Blindly applying the saved [A,B,C] coefficients gives−.4·2+.1·1+.3·(−1)+.2=−.8, a different prediction. A permanent state permutation must move training rows, identities and coefficients together; it cannot repair future matrices whose column schemas have not been checked."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><div className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice 15."}</strong>{" A colleague wants to report the Wine study but sees its perfect36-row test count and proposes trying γ=.03 next “just to improve confidence.” Explain a valid report and a valid changed study. What if one candidate reaches its iteration cap? May you omit it and keep the rest of this protocol?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate the frozen evidence, the first exact validation tie rule and the previously declared failure policy from a new question."}</Prose>

</details>

<details><summary>Explained solution</summary>

<Prose>{"The current report names the106/36/36 row split, training-only scaler, all twelve ordered candidates, primary mean-class-recall metric, first exact tie rule, baseline and declared cap. It retains weak models such as C=.1,γ=1, whose validation balanced accuracy is1/3. Index6 wins before the test stage; its selected training-only state is frozen without refitting. The test result is36/36 versus baseline14/36 and does not imply universal performance or precise uncertainty."}</Prose>

<Prose>{"Trying another γ after inspecting that test set makes it part of selection. A new comparison needs a question, grid and fresh independent evaluation plan declared before reading its final results. It may report an unfavorable outcome. Under this program's declared policy, any capped candidate is saved as protocol failure, all observed outcomes remain, and the test stage stops; silently dropping it or increasing the cap changes the experiment. A revised protocol may choose a different eligibility/failure policy in advance, but cannot relabel this saved study as if that policy had been used."}</Prose>

</details></div></section>

<H3>{"Complete files and reproducible starting points"}</H3>

<Prose>{"The fourteen earlier standalone programs remain available with their recorded outputs. The six new program groups add seven files. Every program group below includes its required imports and numeric examples; "}<code>{"svm_mechanisms.py"}</code>{" alone requires its neighboring "}<code>{"svm_core.py"}</code>{". The Wine program loads the bundled dataset through the declared scikit-learn version and writes to a new path; the saved result contains the dataset description, numeric inputs, row split, every outcome and selected state."}</Prose>

<Prose><a href="/learn-code/support-vector-machines-svm/wine-svm-study-results.json" download="wine-svm-study-results.json">Saved Wine provenance, inputs, all twelve outcomes and locked state</a></Prose>

<Prose>{"The new executions use NumPy2.3.5 and scikit-learn1.9.1. Original outputs retain their original executed environments as shown. Floating tolerances and different solver schedules can change the last digits; interpret the objective, status and data-role contract before comparing numbers."}</Prose>

<Prose>{"Wine data attribution: "}<a href={"https://archive.ics.uci.edu/dataset/109/wine"}>{"Aeberhard and Forina, UCI Wine, DOI10.24432/C5PC7J"}</a>{", licensed "}<a href={"https://creativecommons.org/licenses/by/4.0/"}>{"CC BY4.0"}</a>{". The saved bundled source description and feature names are retained; undocumented feature units are not invented here."}</Prose>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/naive-bayes-probabilistic-classifiers?module=classical-ml"}>{"Naive Bayes & Probabilistic Classifiers"}</a>{". It approaches classification by modeling class-conditional evidence under explicit probabilistic assumptions. Compare that route with the margin objective you can now derive, optimize, validate and question."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://www.statlearning.com/"}>{"An Introduction to Statistical Learning, second edition"}</a>{" — chapter9 gives another geometry-to-classifier route, including its R laboratory. Its slack-budget parameter called C differs from this lesson's hinge penalty C; compare the objectives rather than reuse the numeral."}</li></ul>

<ul><li>{""}<a href={"https://hastie.su.domains/ElemStatLearn/download.html"}>{"The Elements of Statistical Learning, second edition"}</a>{" — chapter12 connects margins, penalization and kernel feature spaces, with regression and regularization paths. Read after the local dual derivation; its broader LDA extensions are a separate method family."}</li></ul>

<Prose>{""}<a href={"https://www.cs.cornell.edu/courses/cs4780/2018fa/lectures/lecturenote09.html"}>{"Cornell CS4780: Support Vector Machines"}</a>{" gives a compact written geometry-to-margin derivation. Use it after the first investigation; its algebra is easier once score scale and distance are separate."}</Prose>

<Prose>{""}<a href={"https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/resources/lecture-16-learning-support-vector-machines/"}>{"MIT OpenCourseWare: Patrick Winston, Learning—Support Vector Machines"}</a>{" is an alternate video explanation of the normal vector and margin “street.” The official transcript's geometry and normalization discussion was reviewed for this lesson; the full video was not watched. It is a conceptual lecture from 2010, not current library API guidance."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://homepages.math.uic.edu/~lreyzin/papers/cortes95.pdf"}>{"Cortes and Vapnik, Support-Vector Networks"}</a>{" — the original classifier formulation and support-weighted feature-space mechanism. Historical experimental results are not current deployment comparisons."}</li></ul>

<ul><li>{""}<a href={"https://alex.smola.org/papers/2004/SmoSch04.pdf"}>{"Smola and Schölkopf, A Tutorial on Support Vector Regression"}</a>{" — the two-slack tube derivation and the interpretation of signed coefficients. Match its residual/intercept conventions before transferring formulas."}</li></ul>

<ul><li>{""}<a href={"https://papers.nips.cc/paper/3182-random-features-for-large-scale-kernel-machines.pdf"}>{"Rahimi and Recht, Random Features for Large-Scale Kernel Machines"}</a>{" — frequency sampling and the expectation behind RFF. One finite feature draw has approximation error; the paper does not validate this lesson's particular seed as optimal."}</li></ul>

<ul><li>{""}<a href={"https://www.microsoft.com/en-us/research/wp-content/uploads/1998/04/sequential-minimal-optimization.pdf"}>{"Platt, Sequential Minimal Optimization"}</a>{"—the original two-variable update, feasible bounds and endpoint handling. Our exhaustive working-set policy is intentionally different from its complete heuristic implementation."}</li></ul>

<ul><li>{""}<a href={"https://www.csie.ntu.edu.tw/~cjlin/papers/libsvm.pdf"}>{"Chang and Lin, LIBSVM"}</a>{"—C-SVC, SVR, decomposition, multiclass and implementation contracts. Read the formulation and solver sections when comparing the teaching solver with a mature implementation."}</li></ul>

<ul><li>{""}<a href={"https://www.csie.ntu.edu.tw/~cjlin/papers/guide/guide.pdf"}>{"Hsu, Chang and Lin, A Practical Guide to Support Vector Classification"}</a>{"—scaling and parameter selection with useful modeling context. Our pipelines make fold-local fitting explicit."}</li></ul>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html"}>{"scikit-learn SVC API"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/svm.html"}>{"SVM user guide"}</a>{"—current parameter, precomputed-kernel, class-weight, score-shape and cache contracts. The executed version here is 1.9.1; check the API's deprecation notice before copying an older probability example."}</li></ul>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV.html"}>{"CalibratedClassifierCV API"}</a>{"—out-of-fold versus ensemble behavior, whole-estimator fitting and prefit/frozen data separation. This supplements the explicit calibration pipeline above."}</li></ul>

<ul><li>{""}<a href={"https://cseweb.ucsd.edu/~eeskin/papers/spectrum-psb02.pdf"}>{"Leslie, Eskin and Noble, The Spectrum Kernel"}</a>{"—the count-feature construction and original protein-sequence application. The tiny alphabet example exposes the representation's information loss without reproducing the paper's experimental claims."}</li></ul>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/kernel_approximation.html"}>{"scikit-learn kernel approximation guide"}</a>{"—RBF sampling and Nyström feature APIs. Read with the feature-construction and training-cost distinctions above; the measured comparison is one reproducible finite run."}</li></ul></section>
</div></SvmReadingFlowProvider>; }
export default {
  title: "Support Vector Machines (SVM)",
  readTime: "~85 min read + 1–2 hours investigation and practice",
  hasIntegratedGuide: true,
  content: SvmReadingFlowLesson
};
