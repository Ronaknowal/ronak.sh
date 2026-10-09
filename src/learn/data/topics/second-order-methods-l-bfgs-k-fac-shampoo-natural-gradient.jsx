import { H2, H3, Prose, CodeBlock } from '../../components/content';
import { MathBlock, Math as InlineMath } from '../../components/content/Math.jsx';
import { LessonTable as NeuralTable } from '../../components/lesson-labs/LessonElements.jsx';
import { S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15 } from '../../components/lesson-labs/SecondOrderGeometryDrawings.jsx';
import { S16, S17, S18, S19, S20, S21, S22, S23, S24, S25 } from '../../components/lesson-labs/SecondOrderSecantDrawings.jsx';
import { S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36, S37 } from '../../components/lesson-labs/SecondOrderProbabilityDrawings.jsx';
import { S38, S39, S40, S41, S42, S43, S44, S45, S46, S47 } from '../../components/lesson-labs/SecondOrderLayerDrawings.jsx';
import { S48, S49, S50, S51, S52, S53, S54, S55, S56, S57, S58, S59, S60, S61 } from '../../components/lesson-labs/SecondOrderMatrixDrawings.jsx';
import { S62, S63, S64, S65, S66, S67 } from '../../components/lesson-labs/SecondOrderComputationDrawings.jsx';
export default {
 title: 'Second-Order Methods (L-BFGS, K-FAC, Shampoo, Natural Gradient)',
 readTime: '~110 min read + extended practice',
 hasIntegratedGuide: true,
 content: () => <div className="lesson-pilot second-order-methods-lesson second-order-reading-flow">
<Prose opening="summary">{"A gradient tells you which small changes raise a loss. Choosing a useful move also requires knowing how directions differ. Follow one parameter change through curvature, remembered gradient changes, probability geometry and matrix statistics, then check what each method actually computed."}</Prose>

<Prose opening="route">{"For a first reading, work through sections 1–3 and run the quadratic and decay-fit programmes. Continue through the two-outcome model and observed Iris fit in section 4. Sections 5–6 develop the matrix structure behind K-FAC and Shampoo; the visibly marked matrix-geometry branch adds Muon after those foundations. Section 7 connects the methods to computation and diagnosis. Attempt the section 8 tasks as their mechanisms become familiar. Keep derivations and complete programmes visible; hints and solutions are separate practice feedback."}</Prose>

<Prose opening="prerequisites">{"You need matrix-vector multiplication, a linear solve, symmetric eigenvalues and gradients. "}<a href={"/learn/path/full-curriculum/gradient-descent-variants-sgd-adam-adagrad-rmsprop-lamb-lars?module=math-foundations#1-choose-what-the-gradient-means"}>{"Gradient Descent"}</a>{" supplies the full-batch mean objective and the convention θₜ = θₜ₋₁ − ηgₜ. We retain that convention when subtracting a step, then explicitly distinguish a displacement that is added. "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations#5-svd-follow-independent-stretches"}>{"Matrix Decompositions, section 5"}</a>{" supplies input and output singular directions; we recap them before the matrix-geometry branch. "}<a href={"/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight"}>{"Tensor Algebra & Einsum, section 4"}</a>{" supplies unfolding and mode maps, recalled where Shampoo grows from a matrix to a tensor. Probability models and layer anatomy are introduced here."}</Prose>

<Prose opening="exploration">{"The controls explore bounded mathematical models and saved observations immediately. To change a full algorithm, use the Python programmes and their supplied files. The recorded environment is Python 3.12, NumPy 2.3.5 and CPU PyTorch 2.14.0. Install NumPy and a CPU PyTorch build appropriate to your environment, save a displayed programme with its stated filename, and run "}<code>{"python filename.py"}</code>{". Programmes using only NumPy need no PyTorch import. The Iris programme takes the supplied corrected CSV path as its argument. Outputs below are retained actual executions; last digits may vary with numerical libraries. The file index groups the complete programmes and data, with the changed-fit answer kept beside its practice solution."}</Prose>

<H2>{"1. One rate cannot fit every direction"}</H2>

<Prose>{"Suppose two adjustable settings, x and y, have loss f(x,y) = 100x² + y². We are at (1,1), and the best settings are (0,0). What does changing either setting do?"}</Prose>

<S01 />

<Prose>{"The point in the parameter plane represents both settings together. Its horizontal coordinate is x; its vertical coordinate is y. Curves join settings with equal loss. The aligned slices hold one coordinate fixed while changing the other. An x error of 1 contributes 100 to the loss, while the same y error contributes 1. Equal distances in the parameter plane can therefore have very different loss costs."}</Prose>

<Prose>{"The gradient collects the slopes with respect to the settings. Here g = (200x, 2y), so at (1,1) it is (200,2). A gradient-descent step subtracts a learning rate η times that vector. Follow its two coordinates before choosing a rate."}</Prose>

<S02 />

<Prose>{"At η = .1, the x update is 1 − .1 × 200 = −19; the y update is 1 − .1 × 2 = .8. The interrupted x scale keeps the actual large jump visible. The steep direction overshoots. Reducing η to .008 multiplies each x error by 1 − .008 × 200 = −.6 and each y error by 1 − .008 × 2 = .984. The x error alternates sign and shrinks rapidly; the y error retains most of its size. A rate suited to the steep direction leaves the shallow direction slow."}</Prose>

<Prose>{"To correct that imbalance, we need to describe how a parameter displacement changes the gradient itself. Compare the same small move along each coordinate."}</Prose>

<S03 />

<Prose>{"Moving by (.01,0) changes g by (2,0); moving by (0,.01) changes it by (0,.02). The parameter arrows and gradient arrows live in different spaces, so their lengths have different units. Each gradient change is one column of a matrix times .01. This matrix, the "}<strong>{"Hessian"}</strong>{", collects the second derivatives:"}</Prose>

<div className="neural-equation"><MathBlock>{"H=\\begin{pmatrix}200&0\\\\0&2\\end{pmatrix},\\qquad\n\\nabla f(\\theta+\\delta)-\\nabla f(\\theta)=H\\delta."}</MathBlock></div>

<Prose>{"For this quadratic, the relation is exact for every displacement. For a general smooth loss, it describes the first-order change in its gradient near the current point."}</Prose>

<Prose>{"Which directions does the Hessian scale without turning them?"}</Prose>

<S04 />

<Prose>{"The horizontal and vertical arrows stay on their respective lines, stretched by 200 and 2. These are eigenvectors; the stretch factors are eigenvalues. A circle of input displacements becomes an ellipse of gradient changes. Here every nonzero displacement has positive quadratic curvature vᵀHv. A symmetric matrix with this property is "}<strong>{"positive definite"}</strong>{". Its largest-to-smallest eigenvalue ratio is 200/2 = 100, the spectral condition number. A zero eigenvalue would leave one direction flat in this quadratic model; a negative one would bend downward along that direction."}</Prose>

<Prose>{"The coordinate axes happened to align with the valley. Rotate it and the same geometry requires coupled coordinates."}</Prose>

<S05 />

<Prose>{"Let R rotate vectors by 30 degrees and define H = R diag(200,2)Rᵀ. Its eigenaxes rotate with the valley, while their curvatures remain 200 and 2. Off-diagonal matrix entries now express how movement in one coordinate changes both gradient components. Dividing the two gradient coordinates by the diagonal entries would ignore that coupling."}</Prose>

<Prose>{"Instead, ask which displacement produced the current gradient. A linear solve answers the inverse question without explicitly constructing an inverse matrix."}</Prose>

<S06 />

<Prose>{"For the original point, H sends s = (1,1) to g = (200,2). Solving Hs = g recovers s; subtracting it reaches the optimum. The same full solve works in the rotated quadratic because g = Hθ. This is Newton's method on an exact quadratic. We delegate the numerical linear solve to "}<code>{"numpy.linalg.solve"}</code>{", while computing the objective, gradient and Hessian explicitly."}</Prose>

<Prose>{"The next view lets the two proposed moves share one coordinate plane. The curvature sets the steep eigenvalue; the shallow eigenvalue stays 2. The angle rotates the eigenaxes. “Rate × curvature” is the dimensionless product r = ηc, so the actual learning rate is η = r/c. Amber squares identify gradient-descent states; the cyan triangle marks Newton's separate one-step endpoint. A pale ring selects the state being inspected."}</Prose>

<S07 />

<Prose>{"The thin dashed path is a computed preview of all 24 gradient-descent updates. The solid prefix ends at the selected update; its parameter and loss readouts describe only that update. The first-update displacement is also visible, so changing the rate has an immediate consequence even at update 0. Change the rate while inspecting update 12: the index stays 12 and both the preview and selected values recompute. Rotate the valley to see why coordinatewise division is insufficient. Whole Reset restores curvature 200, angle 0, rate product 1.6 and update 0."}</Prose>

<Prose>{"The complete calculation below first solves the axis-aligned case and then rotates the quadratic. In the rotated case, the programme compares one Newton solve with twelve repeated gradient updates from the same point. The matrix multiplication constructs the coupled Hessian; the solve returns the step to subtract. No explicit inverse is needed."}</Prose>

<Prose>{""}<strong>{"An exact Newton solve, then a rotated valley."}</strong>{" Save as "}<code>{"quadraticSolve.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-01.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-01.py"} title={"An exact Newton solve, then a rotated valley"}>{"import numpy as np\n\npoint = np.array([1.0, 1.0])\ngradient = np.array([200.0, 2.0])\nhessian = np.diag([200.0, 2.0])\nstep_to_subtract = np.linalg.solve(hessian, gradient)\nprint(\"step to subtract:\", step_to_subtract)\nprint(\"new point:\", point - step_to_subtract)\n\nangle = np.pi / 6\nrotation = np.array([[np.cos(angle), -np.sin(angle)],\n                     [np.sin(angle), np.cos(angle)]])\nhessian = rotation @ hessian @ rotation.T\ngradient = hessian @ point\ndirection = np.linalg.solve(hessian, -gradient)\nrate = 1.6 / 200\niterate = point.copy()\nfor _ in range(12):\n    iterate -= rate * (hessian @ iterate)\nprint(\"rotated Newton direction:\", np.round(direction, 6))\nprint(\"solve residual:\", np.linalg.norm(hessian @ direction + gradient) < 1e-12)\nprint(\"GD after 12:\", np.round(iterate, 6))\nprint(\"condition number:\", round(np.linalg.cond(hessian), 6))\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-02.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-02.txt"} title={"An exact Newton solve, then a rotated valley: actual output"}>{"step to subtract: [1. 1.]\nnew point: [0. 0.]\nrotated Newton direction: [-1. -1.]\nsolve residual: True\nGD after 12: [-0.148232  0.262693]\ncondition number: 100.0\n"}</CodeBlock>

<Prose>{"Newton reaches the centered quadratic's minimum in one solve. The gradient-descent residual reflects its fixed rate and unequal directional contraction. The two results expose the geometry; their operations have different costs, addressed in section 7."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" If the Hessian is diag(2,2), does the unequal-curvature problem remain? Which fixed gradient rate solves its centered quadratic in one update?"}</Prose>

<details><summary>Worked answer</summary>

<Prose>{"No direction is steeper than another: the condition number is 1. Rate .5 makes I − ηH the zero matrix, so one update reaches the center. Newton is not automatically a useful expense when a cheap update already has the right scaling."}</Prose>

</details>

<Prose>{"We have corrected an exact quadratic using its complete curvature. Real losses usually agree with a quadratic only near the current point, so the next step is to separate the proposed model move from evidence that the actual loss accepts it."}</Prose>

<H2>{"2. Minimize a local model, then check the step"}</H2>

<Prose>{"For a nonlinear loss, curvature describes a neighborhood rather than the whole landscape. Let θ be the current parameter vector and d a proposed displacement. A local quadratic combines the present loss, its slope and its bending. First see what these pieces contribute at one concrete point."}</Prose>

<S08 />

<Prose>{"Here f(x,y) = ¼(x² − 1)² + ½y² and the current point is (.2,.5). Its loss is .3554, gradient g = (−.192,.5), and Hessian H = diag(−.88,1). Displacement d = 0 is the current point. The constant fixes its height; the tangent plane adds gᵀd; the quadratic part bends downward along x and upward along y. The local model is indefinite: it has no unconstrained minimum. With these roles established, the general second-order Taylor model is"}</Prose>

<div className="neural-equation"><MathBlock>{"m(d)=f(\\theta)+g^\\top d+\\tfrac12d^\\top Hd."}</MathBlock></div>

<Prose>{"Each term is a scalar. The vectors g and d have one entry per parameter; H is square. Differentiating with respect to d gives ∇m(d) = g + Hd. A stationary model point therefore solves Hd = −g."}</Prose>

<Prose>{"When does that stationary point become a useful minimum? Return briefly to the positive quadratic from section 1."}</Prose>

<S09 />

<Prose>{"With H = diag(200,2) and g = (200,2), the model contours close around d = (−1,−1). Scaling each eigencomponent of g by the reciprocal positive curvature and reversing its sign gives this displacement. Its initial slope is gᵀd = −202. More generally, for positive definite H and nonzero g,"}</Prose>

<div className="neural-equation"><MathBlock>{"d=-H^{-1}g,\\qquad g^\\top d=-g^\\top H^{-1}g<0."}</MathBlock></div>

<Prose>{"The inverse is positive definite, so the last quadratic form is positive before the minus sign. This establishes a descent direction: sufficiently short movement lowers a differentiable actual loss. If g = 0, the solve returns d = 0 and the strict inequality is replaced by equality. Our convention here is θ_new = θ + αd. Section 1's step to subtract was s = −d; the two conventions describe the same move."}</Prose>

<Prose>{"Positive definiteness matters because a stationary point need not be a minimum. The nonlinear example makes the failure visible."}</Prose>

<S10 />

<Prose>{"The double-well loss has minima at (−1,0) and (1,0). At (0,0), its gradient vanishes, but moving along x lowers the loss while moving along y raises it. The crossing slices reveal the opposite signs of curvature, −1 and 1. This point is a "}<strong>{"saddle"}</strong>{". A zero gradient alone cannot distinguish it from a minimum."}</Prose>

<Prose>{"At x = .2 the x curvature is still negative. Raw Newton moves toward the saddle. Whether the total loss nevertheless falls depends on the other coordinate."}</Prose>

<S11 />

<Prose>{"The x gradient is −.192 and curvature −.88, so solving −.88d_x = .192 gives d_x = −12/55. The new x is −1/55. Starting from (.2,0), this increases loss from .2304 to approximately .249835. Starting from (.2,.5), raw Newton also removes the y error, reducing total loss from .3554 to that same .249835. Removing y's contribution happens to outweigh the harmful x move. Indefiniteness removes the positive-definite descent argument; it does not assert that every resulting total loss must increase."}</Prose>

<Prose>{"We can repair the local model by shifting its curvature. The shift must make every eigenvalue positive."}</Prose>

<S12 />

<Prose>{""}<strong>{"Damping"}</strong>{" solves (H + λI)d = −g. At (.2,.5), λ = 1.2 changes eigenvalues −.88 and 1 to .32 and 2.2. The resulting direction is (.6, −.5/2.2), or approximately (.6,−.22727). It moves x toward the right-hand minimum. A shift of exactly .88 leaves zero curvature and a singular system. A merely positive shift can still leave negative curvature; the sufficient condition is λ > −λ_min(H), together with positive definiteness of all shifted directions."}</Prose>

<Prose>{"That repairs the direction, but a good local direction can still travel too far. Hold the direction fixed and compare proposed lengths against the actual loss."}</Prose>

<S13 />

<Prose>{"At (.6,.5), shifting by .01 gives positive eigenvalues .09 and 1.01. The x component of the direction is large because the curvature is small. The curve records actual loss along θ + αd; the descending line is the required decrease from the starting slope. Trials α = 1, .5 and .25 fail; .125 is accepted. The condition is"}</Prose>

<div className="neural-equation"><MathBlock>{"f(\\theta+\\alpha d)\\le f(\\theta)+c\\alpha g^\\top d,\n\\qquad 0<c<1."}</MathBlock></div>

<Prose>{"This is "}<strong>{"Armijo backtracking"}</strong>{". For gᵀd < 0 its right side lies below the starting loss. Differentiability gives f(θ + αd) = f(θ) + αgᵀd + o(α), so sufficiently small positive α passes in exact arithmetic when nearby points remain in the domain. The programme also needs finite evaluations, a bounded trial loop and a report of failure if a useful step is not found."}</Prose>

<Prose>{"In the investigation, initial x changes the point, while damping changes the model. Initial y remains .5. Read the current parameter arrow before the line-search curve: the first tells you the proposed direction; the second tells you which distance along it is accepted."}</Prose>

<S14 />

<Prose>{"The default (.2,.5) with damping 1.2 has a positive shifted model. The near-flat action selects x = .6 and damping .01, exposing the shorter accepted step. The indefinite action selects x = .2 and damping 0 so you can inspect raw Newton; the programme below rejects such a model. The singular action uses damping .88 and supplies no direction or fabricated search curve. Reset restores x = .2 and damping 1.2."}</Prose>

<Prose>{"The code separates "}<code>{"objective"}</code>{", the analytic derivatives, the shifted positive-curvature check, the solve and the Armijo trials. "}<code>{"numpy.linalg.eigvalsh"}</code>{" checks a symmetric matrix's eigenvalues; "}<code>{"numpy.linalg.solve"}</code>{" computes the direction. The loop reports the accepted multiplier and actual losses, so damping and shortening remain distinguishable operations."}</Prose>

<Prose>{""}<strong>{"Check the direction before accepting a Newton step."}</strong>{" Save as "}<code>{"safeguardedNewton.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-03.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-03.py"} title={"Check the direction before accepting a Newton step"}>{"import numpy as np\n\ndef objective(point):\n    x, y = point\n    return (x*x - 1)**2 / 4 + y*y / 2\n\ndef attempt(point, damping):\n    x, y = point\n    gradient = np.array([x * (x*x - 1), y])\n    hessian = np.diag([3*x*x - 1, 1.0])\n    system = hessian + damping * np.eye(2)\n    if np.min(np.linalg.eigvalsh(system)) <= 0:\n        raw = np.linalg.solve(system, -gradient)\n        return {\"status\": \"indefinite: reject as SPD model\", \"raw\": raw,\n                \"slope\": gradient @ raw, \"full_loss\": objective(point + raw)}\n    direction = np.linalg.solve(system, -gradient)\n    slope = gradient @ direction\n    if slope >= 0:\n        return {\"status\": \"no strict descent direction\"}\n    for reductions in range(20):\n        alpha = 0.5**reductions\n        candidate = point + alpha * direction\n        if objective(candidate) <= objective(point) + 1e-4 * alpha * slope:\n            return {\"status\": \"accepted\", \"alpha\": alpha, \"point\": candidate,\n                    \"loss\": objective(candidate), \"reductions\": reductions}\n    raise RuntimeError(\"Backtracking budget exhausted; inspect the model.\")\n\npoint = np.array([0.2, 0.5])\nraw = attempt(point, 0)\nprint(raw[\"status\"])\nprint(\"raw direction:\", np.round(raw[\"raw\"], 6))\nprint(\"raw full-step loss:\", round(raw[\"full_loss\"], 6))\nfor point, damping in [(point, 1.2), (np.array([0.6, 0.5]), 0.01)]:\n    result = attempt(point, damping)\n    print(\"start:\", point, \"damping:\", damping)\n    print(result[\"status\"], \"alpha:\", result[\"alpha\"],\n          \"point:\", np.round(result[\"point\"], 6), \"loss:\", round(result[\"loss\"], 6))\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-04.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-04.txt"} title={"Check the direction before accepting a Newton step: actual output"}>{"indefinite: reject as SPD model\nraw direction: [-0.218182 -0.5     ]\nraw full-step loss: 0.249835\nstart: [0.2 0.5] damping: 1.2\naccepted alpha: 1.0 point: [0.8      0.272727] loss: 0.06959\nstart: [0.6 0.5] damping: 0.01\naccepted alpha: 0.125 point: [1.133333 0.438119] loss: 0.116201\n"}</CodeBlock>

<Prose>{"The near-flat output accepts .125 despite positive shifted curvature. Damping made a descent model; evaluating the nonlinear objective selected a useful length."}</Prose>

<H3>{"Deeper: local convergence and a bounded model"}</H3>

<Prose>{"If the true Hessian is positive definite at a stationary minimum, Lipschitz continuous in a neighborhood, and the start is sufficiently close, exact full Newton steps converge quadratically: for some constant C, the next parameter error norm is at most C times the square of the current one. The locality, smoothness and accurate solve are conditions of the statement. They explain why Newton can become very fast after entering a well-behaved neighborhood."}</Prose>

<Prose>{"A "}<strong>{"trust region"}</strong>{" addresses a different question: how far should the local model be allowed to propose a move? Its constraint is on displacement itself."}</Prose>

<S15 />

<Prose>{"Take g = (−1,0), H = diag(2,1) and a disk of radius .25 around d = 0. The unrestricted model minimum is (.5,0), outside the disk. The constrained minimum is (.25,0), on its boundary. The method compares actual decrease with the decrease predicted by this constrained model and can then enlarge or shrink the radius. If the actual function is precisely this quadratic, those decreases agree and their ratio is 1. General trust-region subproblem solvers must also handle indefinite curvature; this picture establishes their geometric job."}</Prose>

<Prose>{"We can now distinguish three questions: is the model curved appropriately, is the direction descending, and does the actual proposed step earn its cost? Building the whole Hessian is one way to answer the first question. The next section asks what can be learned from changes we already observed."}</Prose>

<H2>{"3. Learn from displacements and gradient changes"}</H2>

<Prose>{"The previous section used a Hessian we could compute directly. When that matrix is too expensive, an accepted move supplies a smaller piece of curvature information for free: we already know the old and new parameters and their gradients. What relationship did that move reveal?"}</Prose>

<S16 />

<Prose>{"The parameter-space arrow is s = θ_new − θ. Its matching gradient-space arrow is y = g_new − g. These arrows connect corresponding evaluations but live in different spaces. For a fixed quadratic, y = Hs exactly. For a differentiable gradient along the whole segment,"}</Prose>

<div className="neural-equation"><MathBlock>{"y=\\int_0^1 H(\\theta+ts)s\\,dt."}</MathBlock></div>

<Prose>{"To obtain this identity, differentiate g(θ + ts) with respect to t, giving H(θ + ts)s, then integrate from the old endpoint to the new one. The observation averages curvature along this one displacement. It does not determine every entry of H."}</Prose>

<Prose>{"Instead of reconstructing H, we can maintain a matrix M intended to map gradient changes back to parameter changes. See what a single measured pair requires."}</Prose>

<S17 />

<Prose>{"For H = [[4,1],[1,2]], moving by s = (1,0) changes the gradient by y = (4,1). The inverse approximation must send this particular y back to s. This is the "}<strong>{"secant equation"}</strong>{", M_new y = s. It fixes the action on one direction; the view leaves the other directions unresolved. A "}<strong>{"quasi-Newton"}</strong>{" method combines the observation with a previous approximation rather than treating the pair as a full curvature measurement."}</Prose>

<Prose>{"The BFGS update, named for Broyden, Fletcher, Goldfarb and Shanno, uses two complementary terms. Watch their action on the measured y."}</Prose>

<S18 />

<Prose>{"Starting from M = I, use s = (1,0), y = (4,1) and ρ = 1/(sᵀy) = 1/4. The matrix V = I − ρsyᵀ is [[0,−1/4],[0,1]]. Its transpose annihilates y: Vᵀy = 0. Thus the first branch, VMVᵀ, contributes zero on that input. The second, ρssᵀ, contributes ρs(sᵀy) = s. Their sum has precisely the required new action:"}</Prose>

<div className="neural-equation"><MathBlock>{"V=I-\\rho sy^\\top,\\qquad\nM_{\\rm new}=VMV^\\top+\\rho ss^\\top."}</MathBlock></div>

<Prose>{"For this pair the resulting matrix is [[5/16,−1/4],[−1/4,1]]. Multiplying it by (4,1) gives (1,0). The old approximation still supplies information through the first branch in directions the new pair does not settle."}</Prose>

<Prose>{"Why insist on positive pair curvature sᵀy > 0? It preserves positive definiteness when the old M is positive definite."}</Prose>

<S19 />

<Prose>{"For any nonzero v, the new quadratic form is"}</Prose>

<div className="neural-equation"><MathBlock>{"v^\\top M_{\\rm new}v\n=(V^\\top v)^\\top M(V^\\top v)+\\rho(s^\\top v)^2."}</MathBlock></div>

<Prose>{"Both contributions are nonnegative. If sᵀv is nonzero, the second is positive. If sᵀv = 0, then Vᵀv = v, making the first positive. These cases cover every nonzero vector, so the whole form is positive. The drawing illustrates the alternatives; the argument establishes the property for all directions. Reversing the sign of y reverses the pair curvature and invalidates this reasoning."}</Prose>

<Prose>{"A line search can help produce a positive pair. In addition to sufficient decrease, it can require the directional slope to become less negative."}</Prose>

<S20 />

<Prose>{"On f(x) = x², start at x = −1 and move along d = 1 with α = .5. The slope changes from −2 to −1. With c₂ = .9, the new slope −1 is at least c₂ times the old slope, −1.8. The actual s = .5 and y = 1 have sᵀy = .5. In general, the weak Wolfe curvature condition gives"}</Prose>

<div className="neural-equation"><MathBlock>{"g_{\\rm new}^\\top d\\ge c_2 g^\\top d,\n\\quad 0<c_2<1,\\quad g^\\top d<0,"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"s^\\top y=\\alpha(g_{\\rm new}^\\top d-g^\\top d)\n\\ge\\alpha(c_2-1)g^\\top d>0."}</MathBlock></div>

<Prose>{"Armijo alone cannot provide this guarantee. On f(x) = −x²/2, start at x = 1, d = 1, α = 1. The loss decreases from −.5 to −2, satisfying Armijo with c = .0001 because −2 ≤ −.5001. But s = 1 and y = −1, giving negative pair curvature. A successful decrease and a useful positive-curvature observation are different requirements. Nonconvex or noisy optimization therefore needs an explicit pair policy, such as skipping or damping unsuitable pairs. Gradients from unrelated minibatches also change the objective underlying the secant measurement."}</Prose>

<H3>{"Limited memory applies the matrix indirectly"}</H3>

<Prose>{"A dense inverse approximation requires one entry for every pair of parameters. L-BFGS instead keeps a short chronological window of accepted displacement/gradient-change pairs. The newest pair enters while an old pair can leave."}</Prose>

<S21 />

<Prose>{"The paired lanes preserve which y belongs to which s. A budget of m pairs uses about 2md entries for d parameters. A simple positive starting matrix, often γI, fills in information absent from the window. The common scale γ = sᵀy/(yᵀy) uses the newest accepted pair; it is an inverse-curvature scale. With no history, a positive scaled identity still defines a valid starting action."}</Prose>

<Prose>{"To compute M g without forming M, the "}<strong>{"two-loop recursion"}</strong>{" first removes contributions in reverse chronological order, applies the base matrix, and then restores the remaining effects in forward order. Start q = g. For each pair from newest to oldest, save αᵢ = ρᵢsᵢᵀq and set q ← q − αᵢyᵢ. Set r = γq. Then, from oldest to newest, calculate βᵢ = ρᵢyᵢᵀr and set r ← r + sᵢ(αᵢ − βᵢ). The proposed direction is −r. The two traversals apply the two sides of the nested BFGS products."}</Prose>

<S22 />

<Prose>{"Each inspected frame is one algebraic transformation of the current q or r, not a training update. The diagram links the active pair to the saved α and current β. Change the pair budget or switch the initial scale to see the same gradient transformed with different retained information. Reversing the last pair makes its curvature invalid; that pair is visibly rejected and the older valid pairs remain. The dense two-dimensional calculation below serves as a small independent oracle for the implicit product."}</Prose>

<Prose>{"The programme stores the pairs, calculates their curvature reciprocals and implements both loops explicitly. NumPy supplies vector dot products and array operations; the dense BFGS matrix is constructed only for comparison, not used by the limited-memory application."}</Prose>

<Prose>{""}<strong>{"Apply an inverse without storing it: the two-loop recursion."}</strong>{" Save as "}<code>{"limitedMemory.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-05.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-05.py"} title={"Apply an inverse without storing it: the two-loop recursion"}>{"import numpy as np\n\ndef two_loop(gradient, pairs, gamma):\n    q = gradient.copy()\n    coefficients = []\n    for step, change in reversed(pairs):\n        curvature = step @ change\n        if curvature <= 1e-12:\n            raise ValueError(\"This teaching implementation requires positive curvature.\")\n        alpha = (step @ q) / curvature\n        coefficients.append(alpha)\n        q -= alpha * change\n    result = gamma * q\n    for (step, change), alpha in zip(pairs, reversed(coefficients)):\n        beta = (change @ result) / (step @ change)\n        result += step * (alpha - beta)\n    return result\n\ndef dense_reference(pairs, gamma, size):\n    inverse = gamma * np.eye(size)\n    for step, change in pairs:\n        rho = 1 / (step @ change)\n        correction = np.eye(size) - rho * np.outer(step, change)\n        inverse = correction @ inverse @ correction.T + rho * np.outer(step, step)\n    return inverse\n\nhessian = np.array([[4., 1.], [1., 2.]])\nsteps = [np.array(value, dtype=float) for value in [[1, 0], [0, 1], [1, -1]]]\nhistory = [(step, hessian @ step) for step in steps]\ngradient = np.array([3., 1.])\nfor memory in [1, 2, 3]:\n    pairs = history[-memory:]\n    step, change = pairs[-1]\n    gamma = (step @ change) / (change @ change)\n    transformed = two_loop(gradient, pairs, gamma)\n    inverse = dense_reference(pairs, gamma, 2)\n    assert np.allclose(transformed, inverse @ gradient, atol=1e-12)\n    assert np.allclose(inverse @ change, step, atol=1e-12)\n    print(\"memory:\", memory, \"direction:\", np.round(-transformed, 6))\nprint(\"exact Newton:\", np.round(np.linalg.solve(hessian, -gradient), 6))\ntry:\n    two_loop(gradient, [(steps[-1], -history[-1][1])], 1)\nexcept ValueError:\n    print(\"negative-curvature pair: rejected\")\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-06.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-06.txt"} title={"Apply an inverse without storing it: the two-loop recursion: actual output"}>{"memory: 1 direction: [-0.8 -0.4]\nmemory: 2 direction: [-0.725 -0.175]\nmemory: 3 direction: [-0.713281 -0.139844]\nexact Newton: [-0.714286 -0.142857]\nnegative-curvature pair: rejected\n"}</CodeBlock>

<Prose>{"Compare the resulting directions on one coordinate plane."}</Prose>

<S23 />

<Prose>{"For g = (3,1), one pair gives (−.8,−.4), two give (−.725,−.175), and three give approximately (−.713281,−.139844). The exact Newton direction is (−5/7,−1/7). The magnified endpoint detail distinguishes nearby arrows without changing their main-plane scale. More history helps this fixture; it is not a monotonic improvement theorem. Each BFGS update enforces its newest secant equation and need not retain every earlier one exactly."}</Prose>

<H3>{"A scientific fit: reevaluate the same objective"}</H3>

<Prose>{"The pair mechanism now has a practical setting. Suppose a decay model predicts a exp(−rt) + b at time t. Positive amplitude a and rate r are represented by exponentiating two unconstrained parameters; the third parameter is the offset b. The constructed observations are a reproducible optimization exercise. They let us inspect the objective before moving to measured plant data in section 4."}</Prose>

<S24 />

<Prose>{"Each fixed observation receives a prediction from the current three parameters. Its residual is predicted minus observed value; squaring and averaging the residuals gives the loss. During line search, proposed parameter values feed back into these predictions while the observations remain fixed. This repeated evaluation is the job of a "}<strong>{"closure"}</strong>{" supplied to PyTorch L-BFGS."}</Prose>

<Prose>{"The closure clears gradients, computes the current loss on those same data, computes fresh gradients and returns the loss. One optimizer call can invoke it many times. Changing the observations or stochastic model state between invocations changes the function being searched. Gradient buffers introduce another possible change unless they are cleared."}</Prose>

<S25 />

<Prose>{"For illustrative successive derivatives 2, −1 and 3, accumulation leaves buffers 2, 1 and 4. Clearing before each evaluation instead leaves 2, −1 and 3. These numbers trace the arithmetic of accumulation; the complete fit below supplies the actual PyTorch execution. "}<code>{"optimizer.zero_grad(set_to_none=True)"}</code>{" belongs inside the closure because every invocation needs a current derivative."}</Prose>

<Prose>{""}<strong>{"Fit a decay curve using an actual PyTorch L-BFGS closure."}</strong>{" Save as "}<code>{"lbfgsFit.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-07.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-07.py"} title={"Fit a decay curve using an actual PyTorch L-BFGS closure"}>{"import torch\n\ntorch.set_default_dtype(torch.float64)\ntimes = torch.linspace(0, 4, 21)\n# Deterministic small measurement perturbations, fixed for every closure call.\nnoise = 0.01 * torch.sin(3 * times)\nobservations = 2 * torch.exp(-0.7 * times) + 0.3 + noise\n# Positive amplitude/rate are represented by their logarithms.\nparameters = torch.tensor([0.0, 0.0, 0.0], requires_grad=True)\noptimizer = torch.optim.LBFGS([parameters], lr=1, max_iter=80,\n                            history_size=10, line_search_fn=\"strong_wolfe\",\n                            tolerance_grad=1e-10, tolerance_change=1e-14)\nevaluations = 0\n\ndef loss_value():\n    amplitude, rate = parameters[:2].exp()\n    prediction = amplitude * torch.exp(-rate * times) + parameters[2]\n    return ((prediction - observations)**2).mean()\n\ndef closure():\n    global evaluations\n    optimizer.zero_grad()\n    loss = loss_value()\n    loss.backward()\n    evaluations += 1\n    return loss\n\nreturned_loss = optimizer.step(closure)\nwith torch.no_grad():\n    fitted = torch.cat((parameters[:2].exp(), parameters[2:]))\n    final_loss = loss_value()\nprint(\"amplitude, rate, offset:\", [round(value, 6) for value in fitted.tolist()])\nprint(\"returned initial loss:\", round(returned_loss.item(), 6))\nprint(\"reevaluated final loss:\", round(final_loss.item(), 8))\nprint(\"closure evaluated more than once:\", evaluations > 1)\nprint(\"final mean squared error below 0.0001:\", final_loss.item() < 0.0001)\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-08.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-08.txt"} title={"Fit a decay curve using an actual PyTorch L-BFGS closure: actual output"}>{"amplitude, rate, offset: [2.009861, 0.698043, 0.295096]\nreturned initial loss: 0.612318\nreevaluated final loss: 4.328e-05\nclosure evaluated more than once: True\nfinal mean squared error below 0.0001: True\n"}</CodeBlock>

<Prose>{"The fit recovers amplitude about 2.0099, rate .6980 and offset .2951. The "}<code>{"step"}</code>{" return value is the initial closure loss in this executed API route. Reevaluate the final model to report its final loss. The returned parameters describe the fit to these perturbed observations; predictive validity on other observations is a separate question."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" A closure calls backward three times without clearing gradients. Are the later gradient buffers the derivatives of the current loss?"}</Prose>

<details><summary>Worked answer</summary>

<Prose>{"No. PyTorch accumulates into gradient buffers by default, so old evaluations contaminate the current derivative. Clear them inside each invocation, and keep observations and objective definition consistent across line-search trials."}</Prose>

</details>

<Prose>{"So far, curvature has meant how an objective's gradient changes. A probability model offers another useful notion of distance: how much the predicted distribution changes. That geometric distinction motivates natural gradient."}</Prose>

<H2>{"4. Measure how the distribution changes"}</H2>

<Prose>{"The decay fit used a loss to compare numerical predictions with observations. Suppose instead that our parameter describes probabilities. Moving the parameter by a fixed amount can change the distribution very differently depending on where we start. We will build that geometry from a model with only two outcomes, then use it in a fit to observed measurements."}</Prose>

<S26 />

<Prose>{"A "}<strong>{"Bernoulli model"}</strong>{" assigns probability p to success and 1 − p to failure, with 0 < p < 1. Amber squares identify success; cyan circles identify failure. At p = .2, the two branches carry .2 and .8 of the total mass. The observed success fraction q = .8 is shown separately. The observations determine what we want to fit; they do not replace the model's own probabilities when defining its geometry."}</Prose>

<Prose>{"The average negative log probability of those observations is f(p) = −q log p − (1 − q) log(1 − p). A correct outcome assigned a small probability contributes a large penalty. Differentiating gives f′(p) = (p − q)/(p(1 − p)). To relate parameter changes to distribution changes, first differentiate the model's log probability for each possible outcome. This derivative is called the "}<strong>{"score"}</strong>{"."}</Prose>

<S27 />

<Prose>{"For success the score is 1/p = 5; for failure it is −1/(1 − p) = −1.25. Their squared values are 25 and 1.5625. Weighting by the model masses gives .2 × 25 = 5 and .8 × 1.5625 = 1.25. The sum 6.25 is "}<strong>{"Fisher information"}</strong>{": the expected squared score under the model itself. In symbols,"}</Prose>

<div className="neural-equation"><MathBlock>{"F_p=p(1/p)^2+(1-p)(-1/(1-p))^2=\\frac1{p(1-p)}."}</MathBlock></div>

<Prose>{"Using observed frequencies instead produces .8 × 25 + .2 × 1.5625 = 20.3125. That observed-label score quantity is often called the "}<strong>{"empirical Fisher"}</strong>{". Both values are nonnegative, but they average under different distributions. This distinction will matter when we derive a layer's matrix in section 5."}</Prose>

<Prose>{"Why does the model expectation measure local changes in probability? Compare the old Bernoulli distribution with one at p + Δ."}</Prose>

<S28 />

<Prose>{"The "}<strong>{"KL divergence"}</strong>{" from old to proposed distribution is"}</Prose>

<div className="neural-equation"><MathBlock>{"D_{\\rm KL}(p\\|p+\\Delta)\n=p\\log\\frac p{p+\\Delta}+(1-p)\\log\\frac{1-p}{1-p-\\Delta}."}</MathBlock></div>

<Prose>{"At Δ = 0 it is zero. Differentiating with respect to Δ gives −p/(p + Δ) + (1 − p)/(1 − p − Δ), which is zero at the origin. Its second derivative there is 1/p + 1/(1 − p) = F_p. Thus the local quadratic is ½F_pΔ². The exact curve and quadratic touch in height, slope and curvature at zero; farther away they separate. The allowable interval keeps p + Δ between zero and one. As a boundary assigns zero probability to a possible old outcome, the divergence becomes unbounded. KL is directional rather than symmetric."}</Prose>

<Prose>{"For several parameters, the score is a vector and Fisher is its expected outer product. A local distribution-change budget has the form ½dᵀFd ≤ δ. To see how that budget changes a preferred direction, use a separate two-dimensional geometric example: F = diag(4,1), gradient g = (1,1), and δ = .5."}</Prose>

<S29 />

<Prose>{"The allowed displacements form an ellipse. Moving along its first coordinate costs four times as much quadratic budget per squared unit. Let u = F¹ᐟ²d: the ellipse becomes a unit circle, while the linear loss change gᵀd becomes (F⁻¹ᐟ²g)ᵀu. A linear function is smallest on the circle opposite its coefficient vector. Mapping that point back gives"}</Prose>

<div className="neural-equation"><MathBlock>{"d=-cF^{-1}g,\\qquad\nc=\\sqrt{\\frac{2\\delta}{g^\\top F^{-1}g}}."}</MathBlock></div>

<Prose>{"Here F⁻¹g = (.25,1), its dot product with g is 1.25, and c = √(1/1.25). The "}<strong>{"natural gradient"}</strong>{" is F⁻¹g: the negative direction accounts for the probability metric rather than treating every coordinate length as equally consequential. This derivation assumes positive definite F and nonzero g. A singular Fisher calls for identifiable-direction treatment or an explicitly regularized solve; a raw inverse is unavailable."}</Prose>

<H3>{"Coordinate invariance is local"}</H3>

<Prose>{"Return to the scalar Bernoulli model. Its negative natural direction is −F_p⁻¹f′(p) = q − p. The same distribution can be described by a different coordinate, its logit θ = log[p/(1 − p)]. The inverse map is p = sigmoid(θ) = 1/(1 + exp(−θ))."}</Prose>

<S30 />

<Prose>{"At p = .2, θ = log(.25), and the tangent slope dp/dθ = p(1 − p) = .16. The probability axis has finite endpoints; the logit approaches infinity in magnitude at them. The two coordinate arrows therefore have different units and lengths. The chain rule transforms the loss gradient to g_θ = p − q and Fisher to F_θ = p(1 − p)."}</Prose>

<Prose>{"The logit natural direction is (q − p)/(p(1 − p)). Multiplying it by dp/dθ maps it back to q − p. The local distribution change agrees in either coordinate. A finite addition tests a different question."}</Prose>

<S31 />

<Prose>{"At p = .2 and q = .8, the probability tangent is .6. The logit tangent is .6/.16 = 3.75, whose mapped tangent is again .6. With a step fraction .25, directly adding in p reaches .35. Adding .25 × 3.75 in θ and mapping back reaches approximately .389647. These are different finite Euler steps along coordinates related by a nonlinear function. As the fraction shrinks, their difference becomes second order in that fraction. Invariance of the tangent is not equality of every finite update."}</Prose>

<Prose>{"The investigation keeps q = .8 fixed and lets you change the starting p and step fraction. Read the probability masses together with the exact and quadratic KL values."}</Prose>

<S32 />

<Prose>{"At p = q, both directions vanish and the endpoint marks coincide without losing their identities. At small initial p with a large fraction, the logit endpoint can approach one closely; its complement remains visible rather than being rounded to an exact boundary. Reset restores p = .2 and fraction .25. The complete programme derives both score expectations and carries out the coordinate comparison using explicit sums and NumPy arithmetic."}</Prose>

<Prose>{""}<strong>{"Calculate Fisher from model outcomes, then compare coordinates."}</strong>{" Save as "}<code>{"probabilityGeometry.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-09.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-09.py"} title={"Calculate Fisher from model outcomes, then compare coordinates"}>{"import numpy as np\n\np, target, fraction = 0.2, 0.8, 0.25\noutcome_probabilities = np.array([1-p, p])\nscores = np.array([-1/(1-p), 1/p])\nfisher = outcome_probabilities @ scores**2\nempirical = np.array([1-target, target]) @ scores**2\ngradient = (p-target) / (p*(1-p))\nnatural_probability_direction = -gradient / fisher\nlogit = np.log(p/(1-p))\nnatural_logit_direction = (target-p) / (p*(1-p))\ndirect_next = p + fraction * natural_probability_direction\nlogit_next = 1 / (1 + np.exp(-(logit + fraction * natural_logit_direction)))\n\ndef kl(next_probability):\n    return p*np.log(p/next_probability) + (1-p)*np.log((1-p)/(1-next_probability))\n\nprint(\"Fisher, observed-label outer product:\", round(fisher, 6), round(empirical, 6))\nprint(\"probability tangent:\", round(natural_probability_direction, 6))\nprint(\"mapped logit tangent:\", round(p*(1-p)*natural_logit_direction, 6))\nprint(\"finite endpoints:\", round(direct_next, 6), round(logit_next, 6))\nprint(\"exact KLs:\", round(kl(direct_next), 6), round(kl(logit_next), 6))\nprint(\"local probability KL estimate:\", round(0.5*fisher*(direct_next-p)**2, 6))\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-10.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-10.txt"} title={"Calculate Fisher from model outcomes, then compare coordinates: actual output"}>{"Fisher, observed-label outer product: 6.25 20.3125\nprobability tangent: 0.6\nmapped logit tangent: 0.6\nfinite endpoints: 0.35 0.389647\nexact KLs: 0.054188 0.083075\nlocal probability KL estimate: 0.070312\n"}</CodeBlock>

<Prose>{"The direct and logit endpoints differ while their initial mapped tangents agree. Their exact KL values check the actual finite distribution changes; the local quadratic explains only the nearby geometry. A similar local KL budget can constrain changes in an action distribution, but a full policy-optimization algorithm also needs sampling and performance analysis. Trust Region Policy Optimization develops that application."}</Prose>

<H3>{"Use measured sepals to fit an observed label"}</H3>

<Prose>{"The two-outcome model becomes useful when its probability depends on measurements. The Iris observations record plant measurements and species. Earlier covariance work used measurements without fitting species labels. Here we deliberately ask a different question: among the recorded versicolor and virginica plants, how does sepal length and width change the fitted probability of virginica?"}</Prose>

<S33 />

<Prose>{"The scatter contains 100 observed plants, original rows 51–150 of the corrected Iris CSV. The horizontal and vertical axes are sepal length and width in centimetres. Cyan circles remain versicolor, encoded y = 0; amber squares remain virginica, encoded y = 1. Filled marks are training rows and hollow marks are held rows. These identities persist into the probability calculation. The data originate with Fisher's Iris work and are supplied through UCI, DOI 10.24432/C56C76, under CC BY 4.0. The file and its provenance are available with the programme, so the example runs offline."}</Prose>

<Prose>{"We hold out original IDs divisible by 5: 20 plants. The other 80 define both the fit and the coordinate transformation. See how one measurement row becomes the model's three features."}</Prose>

<S34 />

<Prose>{"The training means are (6.3, 2.87375) cm and population standard deviations approximately (.66951475, .33531468) cm. Subtract those means and divide by those scales for every plant, including held rows. Append a 1 for the intercept. Thus x_i = ((length_i − mean_length)/scale_length, (width_i − mean_width)/scale_width, 1). Held rows pass through the training transformation but do not help estimate it. This prevents their measurements from defining the fitting coordinates."}</Prose>

<Prose>{"The parameter vector θ has three coefficients. Their dot product with x_i is the logit z_i; sigmoid maps it to p_i. Follow one row through its loss, gradient and curvature contributions."}</Prose>

<S35 />

<Prose>{"The negative log probability can be written as log(1 + exp(z_i)) − y_i z_i. "}<code>{"logaddexp(0, z_i)"}</code>{" evaluates the first term stably without separately forming a potentially huge exponential. Its derivative with respect to z_i is p_i − y_i. Because z_i = x_iᵀθ is affine, its derivative is x_i and its second derivative is zero. The row therefore contributes (p_i − y_i)x_i to the gradient and p_i(1 − p_i)x_i x_iᵀ to the Hessian."}</Prose>

<Prose>{"We average the 80 likelihood contributions and add ridge .1 to all three coefficients, including the intercept:"}</Prose>

<div className="neural-equation"><MathBlock>{"L(\\theta)=\\frac1{80}\\sum_{i\\in\\mathrm{train}}\n\\left[\\log(1+e^{x_i^\\top\\theta})-y_i x_i^\\top\\theta\\right]\n+\\frac{.1}{2}\\|\\theta\\|^2,"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"g=\\frac1{80}\\sum_i(p_i-y_i)x_i+.1\\theta,\\qquad\nH=\\frac1{80}\\sum_i p_i(1-p_i)x_ix_i^\\top+.1I."}</MathBlock></div>

<Prose>{"The likelihood Hessian equals the model Fisher for this affine-logit Bernoulli likelihood: averaging (y − p)² over the model's two outcomes gives p(1 − p). The ridge contributes an additional .1I to the objective Hessian. This is a specific identity resulting from the affine logit, not a statement that every Hessian or observed-score outer product is Fisher. Section 4's probability-coordinate loss had different derivatives; the coordinate choice matters."}</Prose>

<Prose>{"The new programme uses the explicit formulas above, solves a Newton direction and checks Armijo decrease. Its library route uses the same mean-plus-ridge objective inside a real PyTorch L-BFGS closure. Compare the recorded outcomes without inventing intermediate library steps."}</Prose>

<S36 />

<Prose>{"There are five saved Newton states: the initial zero vector and four accepted updates. The final standardized coefficients are approximately (.64746536, .21736608, .00147169). The library coefficients agree within 2 × 10⁻⁷ in the recorded execution. Regularized training objective is .607193965. On the 20 held plants, the unregularized mean negative log likelihood is .531348969, and thresholding p ≥ .5 classifies 14 correctly. The held score answers a different question from the penalized training loss, so their labels and scales stay distinct. This small fixed split is a diagnostic, not a species-wide accuracy estimate."}</Prose>

<Prose>{"Inspect a held plant while moving among the saved Newton states. The measurement point, its three feature products, logit and probability remain connected."}</Prose>

<S37 />

<Prose>{"At checkpoint 0, all coefficients are zero and every point in the plane has probability .5. There is no unique half-probability line to draw. At later checkpoints the line solves xᵀθ = 0 in measurement coordinates. Selecting another held ID changes the inspected plant, not the fitted model. Reset returns to checkpoint 0 and original ID 55."}</Prose>

<Prose>{"Save "}<code>{"iris_curvature_fit.py"}</code>{" alongside "}<code>{"iris-corrected.csv"}</code>{", then run "}<code>{"python iris_curvature_fit.py iris-corrected.csv"}</code>{". "}<code>{"load_data"}</code>{" keeps the two species and original IDs, calculates the training transformation and returns the feature matrix and held mask. "}<code>{"value_gradient_hessian"}</code>{" exposes the loss and derivative construction. "}<code>{"newton_fit"}</code>{" records accepted states; "}<code>{"library_fit"}</code>{" clears and recomputes gradients for the same objective. The final evaluation uses held rows only after fitting."}</Prose>

<Prose>{""}<strong>{"Fit probabilities to observed Iris sepals."}</strong>{" Save as "}<code>{"iris_curvature_fit.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"iris_curvature_fit.py"} downloadUrl={"/learn-assets/second-order-methods/iris_curvature_fit.py"} title={"Fit probabilities to observed Iris sepals"}>{"\"\"\"Observed Iris probabilities: analytic Newton and PyTorch L-BFGS.\n\nSupply iris-corrected.csv (UCI Iris, Fisher1936, DOI10.24432/C56C76,\nCC BY4.0). Keep the original file beside this programme. Use only versicolor\nand virginica and their two measured sepal features. Original one-based IDs\ndivisible by5 are held out. Standardize from training rows only. The declared\nridge .1 penalizes all three coefficients, including the intercept. This\nfixture compares objective agreement; it is not an optimizer benchmark.\n\"\"\"\nfrom argparse import ArgumentParser\nimport csv\nimport json\nfrom pathlib import Path\nimport numpy as np\nimport torch\n\n\ndef load_data(path):\n    with Path(path).open(newline='', encoding='utf8') as stream:\n        rows = list(csv.DictReader(stream))\n    kept = [(i, row) for i, row in enumerate(rows, 1)\n            if row['species'] in ('Iris-versicolor', 'Iris-virginica')]\n    ids = np.array([i for i, _ in kept])\n    features = np.array([[float(r['sepal length']), float(r['sepal width'])]\n                         for _, r in kept])\n    labels = np.array([r['species'] == 'Iris-virginica' for _, r in kept], float)\n    train = ids % 5 != 0\n    mean, scale = features[train].mean(0), features[train].std(0)\n    design = np.column_stack(((features-mean)/scale, np.ones(len(ids))))\n    return design, labels, train, ids, features, mean, scale\n\n\ndef value_gradient_hessian(theta, x, y, ridge=.1):\n    logits = x @ theta\n    probability = np.exp(-np.logaddexp(0., -logits))\n    value = np.mean(np.logaddexp(0., logits)-y*logits) + ridge*(theta@theta)/2\n    gradient = x.T@(probability-y)/len(y) + ridge*theta\n    fisher = x.T@((probability*(1-probability))[:, None]*x)/len(y)\n    return value, gradient, fisher + ridge*np.eye(x.shape[1])\n\n\ndef newton_fit(x, y):\n    theta = np.zeros(x.shape[1])\n    trace = []\n    evaluations = 0\n    for iteration in range(40):\n        value, gradient, hessian = value_gradient_hessian(theta, x, y)\n        evaluations += 1\n        trace.append({'iteration':iteration, 'theta':theta.tolist(),\n                      'objective':float(value), 'gradientInf':float(abs(gradient).max())})\n        if abs(gradient).max() <= 1e-10:\n            return theta, trace, evaluations\n        direction = np.linalg.solve(hessian, -gradient)\n        for reductions in range(30):\n            alpha = .5**reductions\n            candidate = theta+alpha*direction\n            next_value = value_gradient_hessian(candidate, x, y)[0]\n            evaluations += 1\n            if next_value <= value+1e-4*alpha*(gradient@direction):\n                theta = candidate\n                trace[-1]['acceptedAlpha'] = alpha\n                break\n        else:\n            raise RuntimeError('No step passed the declared line-search budget')\n    raise RuntimeError('Newton iteration budget exhausted')\n\n\ndef library_fit(x, y):\n    inputs, labels = torch.tensor(x), torch.tensor(y)\n    theta = torch.nn.Parameter(torch.zeros(x.shape[1], dtype=torch.float64))\n    optimizer = torch.optim.LBFGS([theta], lr=1., history_size=10,\n        max_iter=80, line_search_fn='strong_wolfe', tolerance_grad=1e-10,\n        tolerance_change=1e-14)\n    calls = 0\n\n    def closure():\n        nonlocal calls\n        optimizer.zero_grad(set_to_none=True)\n        logits = inputs@theta\n        loss = (torch.logaddexp(torch.zeros_like(logits), logits)-labels*logits).mean()\n        loss = loss + .05*theta.square().sum()\n        loss.backward()\n        calls += 1\n        return loss\n\n    initial = optimizer.step(closure).item()\n    return theta.detach().numpy().copy(), calls, initial\n\n\ndef main():\n    parser = ArgumentParser()\n    parser.add_argument('data', nargs='?', default='iris-corrected.csv')\n    parser.add_argument('--report')\n    args = parser.parse_args()\n    x, y, train, ids, features, mean, scale = load_data(args.data)\n    scratch, trace, count = newton_fit(x[train], y[train])\n    library, calls, initial = library_fit(x[train], y[train])\n    assert len(y) == 100 and train.sum() == 80\n    assert np.allclose(scratch, library, atol=2e-7, rtol=0)\n    held_logits = x[~train]@scratch\n    held_nll = np.mean(np.logaddexp(0., held_logits)-y[~train]*held_logits)\n    correct = int(np.sum((held_logits >= 0) == y[~train]))\n    final, gradient, hessian = value_gradient_hessian(scratch, x[train], y[train])\n    print('training / held observations:', int(train.sum()), int((~train).sum()))\n    print('training means:', np.round(mean, 6))\n    print('training scales:', np.round(scale, 6))\n    print('Newton coefficients:', np.round(scratch, 6))\n    print('L-BFGS coefficients:', np.round(library, 6))\n    print('initial / final regularized objective:', round(initial, 9), round(final, 9))\n    print('Newton accepted updates / evaluations:', len(trace)-1, count)\n    print('L-BFGS closure evaluations:', calls)\n    print('final analytic gradient below 1e-9:', abs(gradient).max() < 1e-9)\n    print('held negative log likelihood / correct:', round(held_nll, 9), correct)\n    print('final Hessian eigenvalues:', np.round(np.linalg.eigvalsh(hessian), 6))\n    if args.report:\n        Path(args.report).write_text(json.dumps({'trace':trace,'newton':scratch.tolist(),\n            'library':library.tolist(),'newtonEvaluations':count,'libraryClosures':calls,\n            'mean':mean.tolist(),'scale':scale.tolist(),'ids':ids.tolist(),\n            'train':train.tolist(),'features':features.tolist(),'labels':y.tolist(),\n            'heldNll':float(held_nll),'heldCorrect':correct,\n            'versions':{'numpy':np.__version__,'torch':torch.__version__}},indent=2)+'\\n')\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"iris_curvature_fit.stdout.txt"} downloadUrl={"/learn-assets/second-order-methods/iris_curvature_fit.stdout.txt"} title={"Fit probabilities to observed Iris sepals: actual output"}>{"training / held observations: 80 20\r\ntraining means: [6.3     2.87375]\r\ntraining scales: [0.669515 0.335315]\r\nNewton coefficients: [0.647465 0.217366 0.001472]\r\nL-BFGS coefficients: [0.647465 0.217366 0.001472]\r\ninitial / final regularized objective: 0.693147181 0.607193965\r\nNewton accepted updates / evaluations: 4 9\r\nL-BFGS closure evaluations: 9\r\nfinal analytic gradient below 1e-9: True\r\nheld negative log likelihood / correct: 0.531348969 14\r\nfinal Hessian eigenvalues: [0.198543 0.320659 0.358288]\r\n"}</CodeBlock>

<Prose>{"The recorded nine analytic evaluations compute value, gradient and Hessian; the nine library closure calls perform different work. They are not equal costs or elapsed times. Dense derivatives for three coefficients are easy to inspect. For larger models, the probability metric can become the expensive object. The next section reduces that object by exploiting the anatomy of one layer."}</Prose>

<H2>{"5. Factor a layer's Fisher information"}</H2>

<Prose>{"We can now construct a probability metric from score vectors. A large model has too many parameter pairs to store the whole matrix. "}<strong>{"K-FAC"}</strong>{", Kronecker-factored Approximate Curvature, uses the structure of a layer to approximate a block with smaller factors. We will derive one two-input, two-output block before discussing what a larger model adds."}</Prose>

<S38 />

<Prose>{"The input a has two entries, and W has two rows and two columns. Each output z_j sums the incoming products w_jk a_k. The leading input a₁ = 1 makes the first column act as two biases. For a = (1,−1) and W = [[.8,−.5],[−.4,.6]], the logits are (1.3,−1). Applying sigmoid to each logit gives two Bernoulli probabilities; the outputs are independent conditional on this input. The second possible input is (1,2), equally likely, giving different logits and probabilities. We have drawn the complete layer rather than assuming an unintroduced neural network."}</Prose>

<Prose>{"Cyan circle a₁ and amber square a₂ identify the two input coordinates. Lavender diamond z₁ and rose triangle z₂ identify the output coordinates. These labels and shapes continue into matrix rows, columns and flattened weight names. Matrix-cell fill, where present, encodes signed magnitude separately from these identities."}</Prose>

<Prose>{"For an outcome y drawn from the current model, the log-probability derivative at each logit is u_j = y_j − p_j. Follow one such outcome into all four weight derivatives."}</Prose>

<S39 />

<Prose>{"Weight w_jk affects logit j by a_k, so its score is u_j a_k. The score matrix is uaᵀ: one output score multiplies each input coordinate. When differentiating negative log probability for fixed observed labels, the sign becomes p_j − y_j. The Fisher construction below uses model-generated outcomes and the score y − p; the supervised gradient later uses observed labels and p − y."}</Prose>

<Prose>{"To construct an outer product over weights, we need a consistent vector order. We stack columns, not rows."}</Prose>

<S40 />

<Prose>{"The four entries move into (w₁₁,w₂₁,w₁₂,w₂₂). The score vector is therefore (a₁u₁,a₁u₂,a₂u₁,a₂u₂), written a ⊗ u. The "}<strong>{"Kronecker product"}</strong>{" replaces each entry of its first operand by that entry times the second operand. Its ordering follows the same input-first, output-within-input grouping. Both axes of the resulting 4 × 4 score outer product use these paired identities."}</Prose>

<Prose>{"Now average over the actual possible outputs while keeping their input fixed."}</Prose>

<S41 />

<Prose>{"There are four binary output vectors: (0,0), (0,1), (1,0), (1,1). Conditional independence gives each branch the product of its two Bernoulli masses. Their expected u is zero. The score covariance is S(a) = diag(p₁(1 − p₁), p₂(1 − p₂)); the off-diagonal expectation is zero because the independent centered scores multiply. Average these conditional weight-score outer products over the two equally likely inputs to obtain true Fisher for this declared layer."}</Prose>

<Prose>{"Each input's outer product aaᵀ multiplies its corresponding S(a). The Kronecker form makes the block anatomy visible."}</Prose>

<S42 />

<Prose>{"Every entry of aaᵀ expands into a complete 2 × 2 scaled copy of S(a). For example, the block linking weights connected to inputs a₁ and a₂ is a₁a₂S(a). Trace a row/output identity and a column/output identity inside that block to locate one of the sixteen entries. This yields the exact expectation"}</Prose>

<div className="neural-equation"><MathBlock>{"F=\\mathbb E_a[(aa^\\top)\\otimes S(a)]."}</MathBlock></div>

<Prose>{"K-FAC's factorization keeps two separate averages, A = E[aaᵀ] and S = E[S(a)], then uses A ⊗ S. Which information disappears when those averages are separated?"}</Prose>

<S43 />

<Prose>{"The exact expectation keeps each input matrix paired with its own output-score covariance. The product of means includes cross-pair products as well. If the covariances differ with input, those artificial cross-pair combinations need not have the same average. In this fixture A = [[1,.5],[.5,2.5]]. At W = 0, both outputs have p = .5 for either input, so S(a) = .25I is constant and the factorization is exact. At the displayed nonzero W, the probabilities depend on input and the approximation has a measurable error."}</Prose>

<Prose>{"The investigation compares the exact, factored and difference matrices with shared scales when their entries are compared. Selecting an entry only outlines its correspondence; it never changes its identity or value. Layer strength scales W. The damping λ acts on the direction calculations, while the displayed undamped Fisher matrices retain their meanings."}</Prose>

<S44 />

<Prose>{"Set strength to zero to obtain the exact-factorization case. Return to strength one and inspect where the difference appears. The current supervised gradient is computed from the fixed observed labels, while the curvature averages the model's four possible outcomes. Keeping those roles separate is essential to reproducing the comparison."}</Prose>

<Prose>{"A factored system can be applied through two smaller solves. Let G be the 2 × 2 supervised gradient and D the matrix step to subtract. The undamped equation is SD A = G."}</Prose>

<S45 />

<Prose>{"First solve S T = G for T. Then solve A Dᵀ = Tᵀ and transpose the result. This computes D = S⁻¹GA⁻¹ without forming those inverses. Column stacking connects it to (A ⊗ S)vec(D) = vec(G), because vec(S D A) = (Aᵀ ⊗ S)vec(D) and A is symmetric. A layer with m outputs and n inputs stores m × m and n × n factors instead of one mn × mn block."}</Prose>

<Prose>{"The programme constructs scores by explicitly enumerating every binary output for each input, verifies the exact Fisher, constructs the approximation and applies the declared damped solves. NumPy supplies the small dense linear algebra; the expectation and factorization are explicit."}</Prose>

<Prose>{""}<strong>{"Enumerate a small layer's true Fisher and inspect its factorization."}</strong>{" Save as "}<code>{"fisherFactors.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-11.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-11.py"} title={"Enumerate a small layer's true Fisher and inspect its factorization"}>{"import itertools\nimport numpy as np\n\ninputs = np.array([[1., -1.], [1., 2.]])\nlabels = np.array([[1., 0.], [0., 1.]])\nweights = np.array([[0.8, -0.5], [-0.4, 0.6]])\ninput_factor = np.zeros((2, 2))\noutput_factor = np.zeros((2, 2))\nfisher = np.zeros((4, 4))\nenumerated = np.zeros_like(fisher)\ngradient = np.zeros_like(weights)\nfor input_vector, label in zip(inputs, labels):\n    probabilities = 1 / (1 + np.exp(-(weights @ input_vector)))\n    input_outer = np.outer(input_vector, input_vector)\n    covariance = np.diag(probabilities*(1-probabilities))\n    input_factor += input_outer / 2\n    output_factor += covariance / 2\n    fisher += np.kron(input_outer, covariance) / 2\n    gradient += np.outer(probabilities-label, input_vector) / 2\n    for outcome in itertools.product([0, 1], repeat=2):\n        outcome = np.array(outcome)\n        mass = np.prod(np.where(outcome, probabilities, 1-probabilities))\n        score = np.outer(outcome-probabilities, input_vector).ravel(order=\"F\")\n        enumerated += mass * np.outer(score, score) / 2\nfactored = np.kron(input_factor, output_factor)\nassert np.allclose(fisher, enumerated, atol=1e-14)\nflat_gradient = gradient.ravel(order=\"F\")\ndamping = 0.1\nexact_direction = np.linalg.solve(fisher + damping*np.eye(4), -flat_gradient)\nfactored_direction = np.linalg.solve(factored + damping*np.eye(4), -flat_gradient)\nfactor_damped = np.kron(input_factor + np.sqrt(damping)*np.eye(2),\n                       output_factor + np.sqrt(damping)*np.eye(2))\nprint(\"model-outcome enumeration agrees:\", np.allclose(fisher, enumerated))\nprint(\"factorization error:\", round(np.linalg.norm(factored-fisher), 6))\nprint(\"exact damped direction:\", np.round(exact_direction, 6))\nprint(\"factored damped direction:\", np.round(factored_direction, 6))\nprint(\"factor-damping is a different matrix:\", not np.allclose(factor_damped, factored+damping*np.eye(4)))\n# With no damping, factors can be applied by two smaller solves.\nleft_solved = np.linalg.solve(output_factor, gradient)\nmatrix_result = np.linalg.solve(input_factor, left_solved.T).T\nassert np.allclose(matrix_result.ravel(order=\"F\"), np.linalg.solve(factored, flat_gradient))\nprint(\"two factor solves agree with Kronecker solve:\", True)\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-12.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-12.txt"} title={"Enumerate a small layer's true Fisher and inspect its factorization: actual output"}>{"model-outcome enumeration agrees: True\nfactorization error: 0.105332\nexact damped direction: [ 0.059705 -0.216708 -0.834831  0.749927]\nfactored damped direction: [-0.08446  -0.186955 -0.884957  0.756229]\nfactor-damping is a different matrix: True\ntwo factor solves agree with Kronecker solve: True\n"}</CodeBlock>

<Prose>{"The Frobenius error—the square root of the sum of squared entry errors—is about .105332. It quantifies this fixture's lost dependence. The directions also depend on damping, so state the damping policy before comparing them."}</Prose>

<H3>{"Deeper: factor damping and omitted blocks"}</H3>

<Prose>{"Adding λI to A ⊗ S preserves a particular full-block shift. Adding √λI to both factors preserves the smaller-solve form, but produces a different matrix."}</Prose>

<S46 />

<Prose>{"Expanding the factor product gives"}</Prose>

<div className="neural-equation"><MathBlock>{"(A+\\sqrt\\lambda I)\\otimes(S+\\sqrt\\lambda I)\n=A\\otimes S+\\sqrt\\lambda(A\\otimes I+I\\otimes S)+\\lambda I."}</MathBlock></div>

<Prose>{"The two cross terms occupy the corresponding Kronecker blocks. They are generally more than a diagonal shift. The lab labels this third direction as factor-damped so its convenience is not confused with the full λI policy."}</Prose>

<Prose>{"A larger model introduces another approximation before or alongside factorization: restricting interactions among parameter blocks."}</Prose>

<S47 />

<Prose>{"The schematic full matrix has diagonal blocks for two layers and off-diagonal blocks coupling them. Keeping only the diagonal layer blocks discards those cross-layer interactions. There are no invented numerical entries in this schematic. A complete multilayer K-FAC implementation must also declare how it samples and averages statistics, balances damping and refreshes factors. The complete programme here owns one precisely specified block."}</Prose>

<Prose>{"This factorization came from a probabilistic layer's score. We can also construct useful smaller matrices directly from gradient arrays, without the same probabilistic interpretation. That distinction leads to Shampoo."}</Prose>

<H2>{"6. Precondition a matrix with gradient statistics"}</H2>

<Prose>{"K-FAC used a layer's input and output-score expectations. "}<strong>{"Shampoo"}</strong>{" instead accumulates products of gradient tensors. Begin with a parameter matrix W and a gradient G of the same shape. What do the two matrix products GGᵀ and GᵀG actually compare?"}</Prose>

<S48 />

<Prose>{"For G = [[1,2],[0,1]], GGᵀ compares rows by dot products across columns, giving [[5,2],[2,1]]. Its off-diagonal is 1 × 0 + 2 × 1 = 2. The product GᵀG compares columns across rows, giving [[1,2],[2,5]]; its off-diagonal is 1 × 2 + 0 × 1 = 2. The equal off-diagonal numbers arise from different contractions. Row and column labels keep those jobs separate."}</Prose>

<Prose>{"The original matrix algorithm retains a history of both products. Initialize L₀ = εI and R₀ = εI with ε > 0, then add each new gradient contribution."}</Prose>

<S49 />

<Prose>{"The replay supplies three gradients: [[1,2],[0,1]], [[2,0],[1,−1]], and [[.5,−1],[2,.5]]. Each feeds its paired row and column accumulator. With ε = .1, the first L and R are [[5.1,2],[2,1.1]] and [[1.1,2],[2,5.1]]. The initialization is a separate isotropic term, not an estimated variance. These fixed gradients isolate the state transition; they are not a claim that a changing loss generated a training trajectory."}</Prose>

<Prose>{"To turn these statistics into scaling operations, Shampoo uses fractional matrix powers. The power acts on independent eigen-directions, not on individual entries."}</Prose>

<S50 />

<Prose>{"For a symmetric positive definite L = Q diag(λ_i)Qᵀ, first rotate a vector into Q's eigenbasis. Multiply each coordinate by λ_i⁻¹ᐟ⁴, then rotate back. Thus L⁻¹ᐟ⁴ = Q diag(λ_i⁻¹ᐟ⁴)Qᵀ. Taking the fourth root of every matrix entry would ignore how its coordinates mix. The εI initialization keeps eigenvalues positive in exact arithmetic; a numerical implementation must still use appropriate precision and a symmetric eigensolver."}</Prose>

<Prose>{"The matrix direction is D_t = L_t⁻¹ᐟ⁴G_tR_t⁻¹ᐟ⁴, followed by W_{t+1} = W_t − ηD_t. Why use a quarter power on each side?"}</Prose>

<S51 />

<Prose>{"In the scalar case, both accumulators equal ε + Σg². Multiplying the two inverse-quarter factors gives the familiar inverse-square-root scale (ε + Σg²)⁻¹ᐟ². A matrix has two modes, so the original algorithm distributes that exponent between them. This check fixes the scalar reduction; it does not make a general matrix Shampoo update identical to full-matrix AdaGrad."}</Prose>

<Prose>{"Both-sided multiplication can mix a coordinate whose current gradient entry is zero with other coordinates. Trace that operation into the lower-left output entry."}</Prose>

<S52 />

<Prose>{"The first G₂₁ is zero, but D₂₁ is approximately −.533234. In D_ij = Σ_k Σ_l (L⁻¹ᐟ⁴)_ik G_kl (R⁻¹ᐟ⁴)_lj, other G entries can contribute to the same output. The signed contribution paths explain where the nonzero result comes from; it is not elementwise division or a rounding accident."}</Prose>

<Prose>{"The investigation changes how many of the three supplied gradients have entered the history, the positive initialization ε, and a common orthogonal rotation of the row basis."}</Prose>

<S53 />

<Prose>{"Inspect the current G, accumulated L/R, their root actions and D together. After a row-basis rotation U, each gradient becomes UG. Then L becomes ULUᵀ, R stays the same, and D becomes UD when initialization is isotropic. The coordinate numbers change consistently with the geometric object. Reset restores one recorded update, ε = .1 and rotation zero."}</Prose>

<Prose>{"The programme explicitly accumulates the products, uses "}<code>{"numpy.linalg.eigh"}</code>{" to obtain positive eigenvalues/eigenvectors, constructs the inverse-quarter roots and applies them. The independent rotated replay checks the stated correspondence."}</Prose>

<Prose>{""}<strong>{"Apply original matrix Shampoo to a declared gradient replay."}</strong>{" Save as "}<code>{"shampooReplay.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-13.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-13.py"} title={"Apply original matrix Shampoo to a declared gradient replay"}>{"import numpy as np\n\ngradients = [np.array(value, dtype=float) for value in\n             [[[1, 2], [0, 1]], [[2, 0], [1, -1]], [[0.5, -1], [2, 0.5]]]]\n\ndef inverse_quarter(matrix):\n    values, vectors = np.linalg.eigh(matrix)\n    if values.min() <= 0:\n        raise ValueError(\"Positive definite accumulators are required.\")\n    return (vectors * values**(-0.25)) @ vectors.T\n\ndef replay(sequence, epsilon=0.1):\n    rows, columns = sequence[0].shape\n    left, right = epsilon*np.eye(rows), epsilon*np.eye(columns)\n    parameter = np.zeros((rows, columns))\n    directions = []\n    for gradient in sequence:\n        left += gradient @ gradient.T\n        right += gradient.T @ gradient\n        direction = inverse_quarter(left) @ gradient @ inverse_quarter(right)\n        parameter -= 0.1 * direction\n        directions.append(direction)\n    return parameter, directions, left, right\n\nparameter, directions, left, right = replay(gradients)\nangle = np.pi / 5\nrotation = np.array([[np.cos(angle), -np.sin(angle)],\n                     [np.sin(angle), np.cos(angle)]])\nrotated_parameter, rotated_directions, _, _ = replay([rotation @ g for g in gradients])\nassert all(np.allclose(actual, rotation @ original, atol=1e-12)\n           for actual, original in zip(rotated_directions, directions))\nprint(\"first preconditioned gradient:\", np.round(directions[0], 6))\nprint(\"final left accumulator:\", np.round(left, 6))\nprint(\"final right accumulator:\", np.round(right, 6))\nprint(\"parameter after three replay updates:\", np.round(parameter, 6))\nprint(\"row rotation commutes with the update:\", np.allclose(rotated_parameter, rotation @ parameter))\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-14.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-14.txt"} title={"Apply original matrix Shampoo to a declared gradient replay: actual output"}>{"first preconditioned gradient: [[ 0.631578  0.729922]\n [-0.533234  0.631578]]\nfinal left accumulator: [[10.35  4.5 ]\n [ 4.5   7.35]]\nfinal right accumulator: [[10.35  1.5 ]\n [ 1.5   7.35]]\nparameter after three replay updates: [[-0.140974 -0.04254 ]\n [-0.05231  -0.02647 ]]\nrow rotation commutes with the update: True\n"}</CodeBlock>

<Prose>{"The zero-to-nonzero entry and row-rotation check reveal matrix mixing. To extend the rule to higher-order tensors, identify each mode's row space before computing its statistic."}</Prose>

<H3>{"Deeper: more tensor dimensions"}</H3>

<Prose>{"In "}<a href={"/learn/path/full-curriculum/tensor-algebra-einsum-notation?module=math-foundations#4-keep-batches-and-broadcast-groups-straight"}>{"Tensor Algebra & Einsum, section 4"}</a>{", unfolding was a bijection between tensor addresses and matrix addresses. It did not sum entries. For a 2 × 2 × 2 gradient tensor, keep the first index as a row and flatten the other two as column 2j + k."}</Prose>

<S54 />

<Prose>{"Every cube entry lands in exactly one of the 2 × 4 unfolding cells. Multiplying this unfolding by its transpose then sums over the other two indices, producing the first mode's 2 × 2 accumulator. Repeat for the other two modes with their own address maps. A mode product applies the resulting linear map along each fiber while leaving other addresses in place. The original order-k rule uses exponent −1/(2k) for each factor; three modes therefore use −1/6. The earlier feature-to-output convention stored W[D,F]; a standard mode matrix has the transposed orientation [F,D]. State the orientation whenever exchanging these representations."}</Prose>

<Prose>{"Practical variants can block large tensors, refresh roots less often, average rather than sum statistics, add momentum or rescale the final direction. Those choices change state and cost. Original convex online-optimization analysis has its own assumptions; it does not guarantee a global optimum for every deep-network variant."}</Prose>

<H3>{"Deeper: gradient-matrix geometry and Muon"}</H3>

<Prose>{"Shampoo has made the shape of a gradient array consequential. A further matrix-geometry approach changes the gradient's singular magnitudes directly. Before using it, separate the gradient matrix from the Hessian of a loss over its entries."}</Prose>

<S55 />

<Prose>{"Take four parameters arranged as W = [[1,.25],[.25,1]], with column-major vector w. Define f(w) = ½wᵀHw with H = diag(2,4,4,2). Its gradient reshapes to G = [[2,1],[1,2]]. G is 2 × 2 because it has one derivative per weight. H is 4 × 4 because it maps changes in all four weights to changes in all four derivatives. Newton solves this H and proposes displacement −W. Inverting the 2 × 2 G would perform a different operation on a different space."}</Prose>

<Prose>{"Now call the gradient matrix M = [[2,1],[1,2]] and inspect it as a map from a two-dimensional input to a two-dimensional output. "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations#5-svd-follow-independent-stretches"}>{"Matrix Decompositions, section 5"}</a>{" used [[3,1],[1,3]] with stretches 4 and 2. We have deliberately changed the matrix; its fixed plus direction (1,1)/√2 and minus direction (1,−1)/√2 have stretches 3 and 1."}</Prose>

<S56 />

<Prose>{"Entrywise sign turns M into an all-ones matrix. It sends the plus direction to twice itself and sends the minus direction to zero: subtraction between the two equal columns cancels. The cyan solid plus arrow and amber dashed minus arrow remain the same identities across the views. The collapsed minus arrow receives a labelled origin marker, so its disappearance is an observed action rather than a missing drawing."}</Prose>

<Prose>{"An ideal "}<strong>{"polar"}</strong>{" transform retains the input-to-output singular directions but replaces every strictly positive singular magnitude by one."}</Prose>

<S57 />

<Prose>{"Write M = UΣVᵀ. Input coordinates rotate by Vᵀ, stretch by Σ, and rotate to the output by U. Replacing positive stretches with one gives UVᵀ in the full-rank square case. Our symmetric positive definite M has polar factor I, preserving both fixed directions with gain one. Newton's step-to-subtract W from the separate four-parameter quadratic instead has gains 1.25 and .75 as a 2 × 2 map. Its origin is the 4 × 4 loss Hessian, so the two transformations answer different geometric questions."}</Prose>

<Prose>{"There is a precise limited connection to Shampoo. Remove accumulation and ε, and use a square full-rank current gradient only."}</Prose>

<S58 />

<Prose>{"Then GGᵀ = UΣ²Uᵀ and GᵀG = VΣ²Vᵀ. Their inverse-quarter powers give UΣ⁻¹ᐟ²Uᵀ and VΣ⁻¹ᐟ²Vᵀ. In the product around G, the middle singular factors cancel as Σ⁻¹ᐟ²ΣΣ⁻¹ᐟ² = I, leaving UVᵀ. The square full-rank, instantaneous and unregularized assumptions make this algebra valid. Accumulated ε-regularized Shampoo above is a different stateful operation; deficient factors need support or pseudoinverse treatment instead of ordinary inverse powers."}</Prose>

<Prose>{"Computing an SVD every time can be expensive. Muon uses a small fixed number of polynomial iterations to shape singular magnitudes. First normalize M by its Frobenius norm √10, then apply the finite iteration below."}</Prose>

<S59 />

<Prose>{"For X, form A = XXᵀ and update X ← 3.4445X + (−4.775A + 2.0315A²)X. In its fixed singular directions, a nonnegative magnitude s follows φ(s) = 3.4445s − 4.775s³ + 2.0315s⁵. Starting at 3/√10 and 1/√10, the two magnitudes pass through the same polynomial but can cross. After five float64 iterations their gains on the original plus and minus directions are approximately .753033 and 1.133706. A numerical SVD sorts magnitudes into descending order; that sorting must not swap the directions' colours or names. The finite result is not the exact polar I."}</Prose>

<Prose>{"The investigation keeps the larger original stretch at 3 and lets the smaller stretch range from 0 to 3. Its second control inspects the normalization and five finite iterations."}</Prose>

<S60 />

<Prose>{"At smaller stretch zero, the missing direction stays zero because every term of the odd polynomial contains that direction's magnitude. The positive-support polar is therefore partial. An arbitrary full orthogonal completion can act on the missing direction, but the input does not uniquely determine that action. At tied stretch 3, the chosen plus/minus basis remains a consistent inspection basis even though an SVD may choose a different one. Reset restores smaller stretch 1 and normalization frame 0."}</Prose>

<Prose>{"The actual optimizer adds persistent momentum, finite precision, shape scaling and decay. Read those state transitions separately from the float64 geometry."}</Prose>

<S61 />

<Prose>{"The executed CPU PyTorch 2.14 route starts from a gradient G and EMA buffer B. It updates B ← (1 − μ)G + μB. With Nesterov enabled, it forms (1 − μ)G + μB using the updated buffer; otherwise it uses B. The implementation converts to bfloat16, normalizes with a norm floor of 10⁻⁷, transposes tall arrays to work on the smaller side, and performs five iterations with the declared coefficients and fused primitive order. It transposes the result back before updating the parameter."}</Prose>

<Prose>{"With original rectangular scaling, the direction's rate is η√max(1, rows/columns). Decoupled decay separately multiplies the parameter by 1 − ηλ using the unadjusted η. In the replay, η = .02, μ = .9 and λ = .1. The programme compares explicit state transitions with "}<code>{"torch.optim.Muon"}</code>{" for 2 × 2, 3 × 2 and 2 × 3 parameters, each with Nesterov off and on, over three supplied gradients."}</Prose>

<Prose>{""}<strong>{"Compare matrix geometry and actual Muon state."}</strong>{" Save as "}<code>{"matrix_geometry_muon.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"matrix_geometry_muon.py"} downloadUrl={"/learn-assets/second-order-methods/matrix_geometry_muon.py"} title={"Compare matrix geometry and actual Muon state"}>{"\"\"\"Exact matrix geometry and the declared PyTorch2.14 Muon state rule.\n\nThe NumPy trace is float64 geometry. The matched PyTorch route uses bfloat16\nNS arithmetic, EMA momentum, original rectangular scaling, and decoupled\ndecay. Three supplied gradients isolate optimizer state, not training quality.\nThe parameter is one declared hidden-layer weight matrix. Biases, embeddings\nand output weights need a separately specified companion optimizer.\n\"\"\"\nfrom argparse import ArgumentParser\nimport json\nfrom pathlib import Path\nimport numpy as np\nimport torch\n\n\ndef polynomial_trace(matrix, steps=5):\n    value = np.array(matrix, dtype=float, copy=True)\n    value /= max(np.linalg.norm(value), 1e-7)\n    frames = [value.copy()]\n    for _ in range(steps):\n        gram = value@value.T\n        value = 3.4445*value + (-4.775*gram+2.0315*(gram@gram))@value\n        frames.append(value.copy())\n    return frames\n\n\ndef ns_bfloat16(update, steps=5):\n    value = update.to(torch.bfloat16)\n    transpose = value.shape[0] > value.shape[1]\n    if transpose:\n        value = value.T\n    value = value/value.norm().clamp(min=1e-7)\n    for _ in range(steps):\n        gram = value@value.T\n        polynomial = torch.addmm(gram, gram, gram, beta=-4.775, alpha=2.0315)\n        value = torch.addmm(value, polynomial, value, beta=3.4445)\n    return value.T if transpose else value\n\n\ndef reference_update(parameter, buffer, gradient, nesterov=True):\n    momentum, rate, decay = .9, .02, .1\n    buffer = torch.lerp(buffer, gradient, 1-momentum)\n    update = torch.lerp(gradient, buffer, momentum) if nesterov else buffer\n    direction = ns_bfloat16(update)\n    rows, columns = parameter.shape\n    adjusted_rate = rate*max(1., rows/columns)**.5\n    parameter = parameter*(1-rate*decay)\n    parameter = torch.add(parameter, direction, alpha=-adjusted_rate)\n    return parameter, buffer\n\n\ndef main():\n    parser = ArgumentParser()\n    parser.add_argument('--report')\n    args = parser.parse_args()\n    matrix = np.array([[2., 1.], [1., 2.]])\n    u, singular, vt = np.linalg.svd(matrix, full_matrices=False)\n    polar = u@vt\n    sign = np.sign(matrix)\n    directions = np.array([[1., 1.], [1., -1.]]).T\n    frames = polynomial_trace(matrix)\n    zero = polynomial_trace(np.zeros((2, 2)))[-1]\n    deficient = polynomial_trace(np.diag([2., 0.]))[-1]\n    assert np.allclose(polar, np.eye(2))\n    assert np.array_equal(zero, np.zeros((2, 2))) and deficient[1, 1] == 0\n    print('singular values:', singular)\n    print('entrywise sign applied to two columns:', sign@directions)\n    print('ideal polar applied to two columns:', np.round(polar@directions, 6))\n    print('finite NS singular values:', np.round(np.linalg.svd(frames[-1], compute_uv=False), 6))\n    print('finite NS equals ideal polar:', np.allclose(frames[-1], polar, atol=1e-6))\n    print('zero singular direction remains zero:', deficient[1, 1] == 0)\n    comparisons = []\n    for shape in [(2, 2), (3, 2), (2, 3)]:\n        for nesterov in [False, True]:\n            initial = torch.arange(np.prod(shape), dtype=torch.float32).reshape(shape)/10\n            actual = torch.nn.Parameter(initial.clone())\n            expected, buffer = initial.clone(), torch.zeros_like(initial)\n            optimizer = torch.optim.Muon([actual], lr=.02, momentum=.9,\n                weight_decay=.1, nesterov=nesterov, ns_steps=5,\n                ns_coefficients=(3.4445, -4.775, 2.0315), eps=1e-7,\n                adjust_lr_fn='original')\n            errors = []\n            for step in range(3):\n                gradient = torch.sin(torch.arange(np.prod(shape), dtype=torch.float32)\n                                     .reshape(shape)+step+.5)\n                expected, buffer = reference_update(expected, buffer, gradient, nesterov)\n                actual.grad = gradient.clone()\n                optimizer.step()\n                error = (actual.detach()-expected).abs().max().item()\n                errors.append(error)\n                assert error < 1e-6\n                assert torch.allclose(optimizer.state[actual]['momentum_buffer'], buffer,\n                                      atol=1e-7, rtol=0)\n            comparisons.append({'shape':shape,'nesterov':nesterov,'errors':errors,\n                                'parameter':actual.detach().tolist(),'buffer':buffer.tolist()})\n    print('matched three-step shape/momentum cases:', len(comparisons))\n    print('maximum parameter error:', max(max(item['errors']) for item in comparisons))\n    if args.report:\n        Path(args.report).write_text(json.dumps({'matrix':matrix.tolist(),\n            'frames':[v.tolist() for v in frames],\n            'singularFrames':[np.linalg.svd(v,compute_uv=False).tolist() for v in frames],\n            'rankDeficient':deficient.tolist(),'zero':zero.tolist(),\n            'libraryComparisons':comparisons,\n            'versions':{'numpy':np.__version__,'torch':torch.__version__}},indent=2)+'\\n')\n\n\nif __name__ == '__main__':\n    main()\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"matrix_geometry_muon.stdout.txt"} downloadUrl={"/learn-assets/second-order-methods/matrix_geometry_muon.stdout.txt"} title={"Compare matrix geometry and actual Muon state: actual output"}>{"singular values: [3. 1.]\r\nentrywise sign applied to two columns: [[2. 0.]\r\n [2. 0.]]\r\nideal polar applied to two columns: [[ 1.  1.]\r\n [ 1. -1.]]\r\nfinite NS singular values: [1.133706 0.753033]\r\nfinite NS equals ideal polar: False\r\nzero singular direction remains zero: True\r\nmatched three-step shape/momentum cases: 6\r\nmaximum parameter error: 0.0\r\n"}</CodeBlock>

<Prose>{"All six recorded cases have zero maximum parameter difference for this matched primitive order, and buffers agree within the declared tolerance. This bounded CPU state replay is distinct from training quality or arbitrary-device equivalence. The documentation's unnormalized momentum-buffer convention differs by a common positive factor from this installed EMA rule away from the normalization floor in exact arithmetic; stored buffers still differ, and finite precision prevents a universal bitwise-equivalence claim."}</Prose>

<Prose>{"Parameter role matters when assembling a model optimizer. A hidden linear weight matrix is the declared target here. Biases, embedding tables and output weights need a separately specified companion optimizer; two-dimensional shape alone does not identify a suitable role. This branch resolves the distinction between matrix-direction shaping and loss curvature. The next section asks how much information each choice costs and how to diagnose its result."}</Prose>

<H2>{"7. Spend computation on useful information"}</H2>

<Prose>{"Each method transforms a gradient, but the additional information has a different meaning. Newton uses the current objective Hessian. L-BFGS uses recent changes in parameters and gradients. Natural gradient uses a model-score expectation; K-FAC approximates structured blocks of it. Original Shampoo uses accumulated gradient contractions. The matrix-geometry branch shapes singular magnitudes and retains momentum under a declared state rule. These meanings determine which errors and costs we should inspect."}</Prose>

<Prose>{"Start by counting what a dense matrix and a short history actually retain."}</Prose>

<S62 />

<Prose>{"For d = 10,000 parameters, one dense d × d matrix has 100 million entries. At eight bytes per float64 entry, that is 800 MB in decimal units. Ten L-BFGS pairs store 2 × 10 × 10,000 = 200,000 entries, or 1.6 MB, plus work vectors. The magnified small region is labelled rather than drawn at a false common area. The pair product costs O(md) work for m pairs; a general dense factorization costs O(d³). These counts exclude objective evaluations, framework overhead and other model state."}</Prose>

<Prose>{"Factor methods change the shapes of the stored information. Their smaller matrices still have nontrivial costs."}</Prose>

<S63 />

<Prose>{"For an m × n parameter matrix, the factors have m × m and n × n entries, totaling m² + n². A full parameter block instead has (mn)² entries. Dense factor or root refreshes take O(m³ + n³) work. Applying the left factor to an m × n gradient costs O(m²n), and applying the right costs O(mn²). The dimensions in the drawing explain each product. Blocking or less frequent refreshes can save work while changing structure or freshness. These formulas are arithmetic models, not elapsed-time measurements."}</Prose>

<H3>{"Ask for Hv without storing H"}</H3>

<Prose>{"There is another way to reduce storage: request only the Hessian's action on a chosen vector. Recall from section 1 that H maps a small parameter displacement to a gradient change."}</Prose>

<S64 />

<Prose>{"With H = [[4,1],[1,2]] and v = (1,−1), the product is Hv = (3,−1). A directional derivative of the gradient obtains this same action without enumerating every Hessian entry. Automatic differentiation implements a "}<strong>{"Hessian-vector product"}</strong>{", or HVP. An iterative solver can use a callable that takes v and returns Hv; the solver never needs a stored H."}</Prose>

<Prose>{"For a positive definite H, "}<strong>{"conjugate gradient"}</strong>{" builds a direction from successive residuals and matrix-vector products. Its residual measures what remains unsatisfied in the linear equation. Follow the first two steps of our two-dimensional system Hd = b with b = −(3,1)."}</Prose>

<S65 />

<Prose>{"Start d₀ = 0, residual r₀ = b and search vector p₀ = r₀. Compute Hp₀ = (−13,−5). The step coefficient is α₀ = (r₀ᵀr₀)/(p₀ᵀHp₀) = 10/44 = 5/22. Thus d₁ = (−15/22,−5/22) and r₁ = b − Hd₁ = (−1/22,3/22). The next search vector is p₁ = r₁ + β₀p₀ with β₀ = (r₁ᵀr₁)/(r₀ᵀr₀) = 1/484. A second product and update give d₂ = (−5/7,−1/7), the exact solution in exact arithmetic. Successive searches span more of the system's relevant directions; this two-dimensional trace is separate from the six-parameter programme below."}</Prose>

<Prose>{"The complete programme defines a smooth six-parameter loss with positive quadratic curvature, nonnegative quartic curvature and neighbor-difference penalties. It requests products from "}<code>{"torch.autograd.functional.hvp"}</code>{". The scratch CG routine uses only that callable, a residual, a search vector and scalar dot products. It checks positive search curvature and stops at its declared residual tolerance or budget. A dense six-variable Hessian is constructed at the end solely as a small validation oracle."}</Prose>

<Prose>{""}<strong>{"Solve using Hessian-vector products, without building the Hessian."}</strong>{" Save as "}<code>{"hessianVector.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-15.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-15.py"} title={"Solve using Hessian-vector products, without building the Hessian"}>{"import torch\n\ntorch.set_default_dtype(torch.float64)\npoint = torch.linspace(-0.8, 1.2, 6, requires_grad=True)\n\ndef objective(value):\n    curvature = torch.arange(1, value.numel()+1, dtype=value.dtype)\n    return (0.5*curvature*value**2 + 0.05*value**4).sum() + 0.1*((value[1:]-value[:-1])**2).sum()\n\ngradient = torch.autograd.grad(objective(point), point)[0].detach()\n\ndef hessian_times(vector):\n    _, product = torch.autograd.functional.hvp(objective, point, vector)\n    return product.detach()\n\ndef conjugate_gradient(apply, right_hand_side, tolerance=1e-10, budget=30):\n    solution = torch.zeros_like(right_hand_side)\n    residual = right_hand_side.clone()\n    search = residual.clone()\n    for iteration in range(budget):\n        if torch.linalg.vector_norm(residual) <= tolerance:\n            return solution, iteration\n        product = apply(search)\n        curvature = torch.dot(search, product)\n        if curvature <= 0:\n            raise ValueError(\"This solver requires positive definite curvature.\")\n        old_norm_squared = torch.dot(residual, residual)\n        alpha = old_norm_squared / curvature\n        solution += alpha*search\n        residual -= alpha*product\n        beta = torch.dot(residual, residual) / old_norm_squared\n        search = residual + beta*search\n    raise RuntimeError(\"Residual tolerance was not reached within the budget.\")\n\ndirection, iterations = conjugate_gradient(hessian_times, -gradient)\nprint(\"CG iterations:\", iterations)\nprint(\"direction:\", [round(value, 6) for value in direction.tolist()])\nprint(\"relative solve residual below 1e-10:\",\n      (torch.linalg.vector_norm(hessian_times(direction)+gradient) / torch.linalg.vector_norm(gradient)).item() < 1e-10)\nprint(\"descent:\", torch.dot(gradient, direction).item() < 0)\n# A tiny independent check only: never build this matrix in the matrix-free solve above.\ndense_hessian = torch.autograd.functional.hessian(objective, point)\nprint(\"six-variable dense oracle agrees:\", torch.allclose(direction, torch.linalg.solve(dense_hessian, -gradient), atol=1e-10))\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-16.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-16.txt"} title={"Solve using Hessian-vector products, without building the Hessian: actual output"}>{"CG iterations: 6\ndirection: [0.668069, 0.379109, -0.000794, -0.392603, -0.760915, -1.101045]\nrelative solve residual below 1e-10: True\ndescent: True\nsix-variable dense oracle agrees: True\n"}</CodeBlock>

<Prose>{"The residual Hd + g checks the equation being solved, but its size does not directly equal parameter error. The weak-curvature example shows why."}</Prose>

<S66 />

<Prose>{"Let H = diag(1,.001), desired solution d* = (0,1), and candidate d = 0. The right side is Hd* = (0,.001). The residual norm is only .001, while the parameter error norm is 1. Multiplication by H shrinks error along the weak direction. In general error = H⁻¹ times the signed residual, so a poorly conditioned system can amplify it. CG's positive-curvature requirement also matters; indefinite systems need an appropriate damping, negative-curvature or trust-region strategy."}</Prose>

<H3>{"Diagnose before adding machinery"}</H3>

<Prose>{"First verify the objective and derivative: compare directional derivatives with finite differences over sensible step sizes, check mean versus sum reduction, and inspect finite values. Then check the linear algebra: symmetry, curvature signs, solve/root residuals and conditioning. Finally inspect state: whether pairs came from the same objective, which distribution supplied Fisher expectations, and how old the factors are. An optimizer cannot repair data leakage or an incorrect gradient."}</Prose>

<Prose>{"The changed-fit exercise supplies one actual comparison. Read its residual and evaluation count as different measurements."}</Prose>

<S67 />

<Prose>{"On that fixed generated decay problem, L-BFGS uses 15 objective/gradient evaluations including the final check and satisfies the declared gradient tolerance. Fixed-rate gradient descent reaches its 1,000-evaluation budget first; both final residuals are on the perturbation scale. One closure call and one gradient update are not equal units of work. The drawing therefore keeps residuals, counts and convergence flags separately labelled and adds no elapsed-time column."}</Prose>

<Prose>{"For a broader comparison, hold initialization, observations, reductions and stopping criteria fixed, state the tuning budget, and report objective/gradient evaluations alongside optimizer calls. Timing additionally requires disclosed hardware and repeated measurements; stochastic work needs multiple seeds and variation. The decision is whether the additional information helps on the declared workload."}</Prose>

<Prose>{"Use the complete two-loop routine when changing limited-memory application, the real L-BFGS closure when changing the fit, and the HVP/CG route when changing dimension or a matrix-free solve. The Bernoulli, K-FAC and Shampoo programmes expose their specific expectations and matrix powers. A multilayer K-FAC or distributed Shampoo experiment needs its own statistics, blocking, cadence, precision and synchronization contract. The next tasks let you change these ideas without hiding those distinctions."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"8. Practise the reasoning on new cases"}</H2>

<Prose>{"Try these before opening the solutions. Each changes matrices, constraints or conventions. Include intermediate quantities and explain why the tempting shortcut fails."}</Prose>

<Prose>{""}<strong>{"1. A shifted, coupled quadratic."}</strong>{" Let f(θ)=½(θ−a)ᵀH(θ−a), H=[[6,2],[2,2]], a=(1,−2) and θ=(3,1). Compute g, a Newton direction and the next point for α=1. Is dividing g by H's diagonal equivalent?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Start with the error θ−a. For a symmetric 2×2 matrix, a positive leading entry and determinant imply positive definiteness."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"Error=(2,3), g=(18,10), det(H)=8>0 and H₁₁=6>0. The solve gives d=(−2,−3), reaching a with zero loss. Diagonal division gives d=(−3,−5), reaching (0,−4), not the minimum. Check Hd+g=0; off-diagonal coupling matters."}</Prose>

</details>

<Prose>{""}<strong>{"2. An indefinite stationary-model direction."}</strong>{" Start at (.2,0) on the double-well objective. Find raw Newton's x direction, directional slope and full-step loss. Give a sufficient damping condition for positive definiteness."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The x gradient is −.192 and curvature −.88. Local descent requires negative gᵀd."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"The direction is −12/55≈−.218182, so gᵀd≈.041891>0. New x=−1/55 and loss≈.249835, above .2304 initially. Damping λ>.88 makes both shifted eigenvalues positive; equality leaves singular x curvature. The resulting descent direction still needs an actual nonlinear step check."}</Prose>

</details>

<Prose>{""}<strong>{"3. One secant observation."}</strong>{" Begin with M=I, s=(1,0), y=(2,1). Construct the BFGS inverse and verify its newest secant equation. Find its direction for g=(1,2). Why does reversing y invalidate the positivity argument?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use ρ=.5, V=I−ρsyᵀ and M_new=VVᵀ+ρssᵀ."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"V=[[0,−.5],[0,1]], so M_new=[[.75,−.5],[−.5,1]]. Multiplication by y gives s. Its determinant .5 and leading entry .75 prove positive definiteness. Mg=(−.25,1.5), so d=(.25,−1.5) and gᵀd=−2.75. Reversing y gives sᵀy=−2; the proof's second term is no longer nonnegative. Finite entries do not establish a safe pair."}</Prose>

</details>

<Prose>{""}<strong>{"4. A changed Bernoulli fit."}</strong>{" Set p=.5, q=.25 and step fraction .5. Find the natural directions in p and logit, the mapped tangent and both finite endpoints. Which expectation defines true Fisher?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"F_p=4, F_θ=.25 and θ=0. The observed fraction determines the objective gradient."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"The p direction is −.25 and logit direction −1. Mapping that tangent multiplies by .25, again giving −.25. The direct endpoint is .375; the logit endpoint is sigmoid(−.5)≈.377541. True Fisher averages scores under the model probability .5. Here the observed-label quantity happens to equal 4 as well because both squared scores are 4; that special equality does not make the definitions equivalent."}</Prose>

</details>

<Prose>{""}<strong>{"5. Expose lost dependence."}</strong>{" An equally likely scalar input is a=1 or 2, with corresponding output-score variance .25 or .16. Compute E[a²S(a)] and E[a²]E[S(a)]. Also expand separately damped Kronecker factors."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep each variance paired with its input before averaging. Expanding a product exposes the damping cross terms."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"The exact value is (.25+4×.16)/2=.445. The product is 2.5×.205=.5125, over by .0675. Separately damped factors add √λ(A⊗I+I⊗S) as well as λI; those cross terms generally remain. Convenient solves are a legitimate choice when their actual approximation is stated."}</Prose>

</details>

<Prose>{""}<strong>{"6. Matrix roots and a basis change."}</strong>{" Take one gradient G=diag(3,1), ε=1 and W₀=0. Find L, R, D and W after rate .2. How should an orthogonal row rotation affect D?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Both accumulators are diagonal. The two quarter roots combine to an inverse square root for each diagonal entry."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"L=R=diag(10,2), with inverse-quarter roots diag(10⁻¹ᐟ⁴,2⁻¹ᐟ⁴). D=diag(3/√10,1/√2)≈diag(.948683,.707107), so W≈diag(−.189737,−.141421). For gradients UG with orthogonal U and isotropic initialization, L becomes ULUᵀ, R stays unchanged and D becomes UD. Entrywise powering a rotated matrix does not preserve this relation and may be undefined on negative entries."}</Prose>

</details>

<Prose>{""}<strong>{"7. A comparison you could defend."}</strong>{" Generate decay data with a=1.5, r=.4, b=.2 on times 0 through 6 and the same .01 sin(3t) perturbation. Compare CPU L-BFGS with gradient descent from the same log-parameter initialization. Declare stopping rules and a maximum evaluation budget. Record the fit, independently evaluated residual and objective/gradient evaluation counts. Repeat under stated conditions if timing."}</Prose>

<details><summary>Hint</summary>

<Prose>{"One L-BFGS call and one gradient-descent update need not consume equal work. Use separate evaluation counters and the same positive-parameter representation."}</Prose>

</details>

<details><summary>Acceptance criteria and interpretation</summary>

<Prose>{""}<strong>{"One reproducible changed-data comparison."}</strong>{" Save as "}<code>{"changedFitComparison.py"}</code>{"."}</Prose>

<CodeBlock language={"python"} kind={"code"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-17.py"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-example-17.py"} title={"One reproducible changed-data comparison"}>{"import torch\n\ntorch.set_default_dtype(torch.float64)\ntimes = torch.linspace(0, 6, 21)\nobservations = 1.5*torch.exp(-0.4*times) + 0.2 + 0.01*torch.sin(3*times)\ntolerance = 1e-6\nmaximum_gradient_evaluations = 1000\n\ndef loss_value(parameters):\n    amplitude, rate = parameters[:2].exp()\n    predictions = amplitude*torch.exp(-rate*times) + parameters[2]\n    return ((predictions-observations)**2).mean()\n\nfor method in [\"L-BFGS\", \"gradient descent\"]:\n    parameters = torch.zeros(3, requires_grad=True)\n    gradient_evaluations = 0\n    if method == \"L-BFGS\":\n        optimizer = torch.optim.LBFGS(\n            [parameters], lr=1, max_iter=300,\n            max_eval=maximum_gradient_evaluations-1,\n            history_size=10, line_search_fn=\"strong_wolfe\",\n            tolerance_grad=tolerance, tolerance_change=1e-14)\n\n        def closure():\n            global gradient_evaluations\n            optimizer.zero_grad()\n            loss = loss_value(parameters)\n            loss.backward()\n            gradient_evaluations += 1\n            return loss\n\n        optimizer.step(closure)\n    else:\n        # One declared rate, without searching a grid against this fixture.\n        for _ in range(maximum_gradient_evaluations-1):\n            loss = loss_value(parameters)\n            gradient = torch.autograd.grad(loss, parameters)[0]\n            gradient_evaluations += 1\n            if gradient.abs().max().item() <= tolerance:\n                break\n            with torch.no_grad():\n                parameters -= 0.2*gradient\n    # Include the independent final objective/gradient evaluation in the count.\n    final_loss = loss_value(parameters)\n    final_gradient = torch.autograd.grad(final_loss, parameters)[0]\n    gradient_evaluations += 1\n    with torch.no_grad():\n        fit = torch.cat((parameters[:2].exp(), parameters[2:]))\n    print(method)\n    print(\"fit:\", [round(value, 6) for value in fit.tolist()])\n    print(\"final MSE:\", round(final_loss.item(), 8))\n    print(\"objective/gradient evaluations:\", gradient_evaluations)\n    print(\"gradient infinity norm:\", round(final_gradient.abs().max().item(), 8))\n    print(\"gradient tolerance reached:\", final_gradient.abs().max().item() <= tolerance)\n    assert gradient_evaluations <= maximum_gradient_evaluations\n    assert torch.isfinite(fit).all() and final_loss.item() < 0.0001\n"}</CodeBlock>

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"} kind={"output"} filename={"second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-18.txt"} downloadUrl={"/learn-assets/second-order-methods/second-order-methods-l-bfgs-k-fac-shampoo-natural-gradient-output-18.txt"} title={"One reproducible changed-data comparison: actual output"}>{"L-BFGS\nfit: [1.506372, 0.399816, 0.197327]\nfinal MSE: 4.71e-05\nobjective/gradient evaluations: 15\ngradient infinity norm: 6e-08\ngradient tolerance reached: True\ngradient descent\nfit: [1.503948, 0.402745, 0.201367]\nfinal MSE: 4.78e-05\nobjective/gradient evaluations: 1000\ngradient infinity norm: 0.00014212\ngradient tolerance reached: False\n"}</CodeBlock>

<Prose>{"This executed example counts the final objective/gradient check as well as training evaluations. L-BFGS uses 15 evaluations and reaches the declared gradient infinity-norm tolerance. Gradient descent with the declared rate .2 reaches its 1,000-evaluation budget first, though its residual is already close: .0000478 versus .0000471. This is evidence for this fixed fit and rate, not a universal speed or optimizer ranking. The observed evaluation count stays within the budget; a library maximum-evaluation setting should still be checked against actual calls."}</Prose>

<Prose>{"Supply complete changed-data code, fixed observations/initialization, a declared gradient-descent rate and tuning budget, actual counts and finite fitted parameters. Reevaluate final mean squared error rather than reporting L-BFGS's returned initial loss. A fit near the generating parameters with residual on the perturbation scale is a sanity check, not a requirement to recover noise-free parameters exactly. Explain failure through gradients, steps or budgets. Conclusions apply to this smooth three-parameter problem; no prescribed winner or invented elapsed time is required."}</Prose>

</details>

<Prose>{""}<strong>{"8. A finite matrix iteration on a deficient input."}</strong>{" Let M=diag(2,0). Normalize by its Frobenius norm and apply one quintic iteration from section 6. What is its rank? Compare its action with the positive-support polar and with a full orthogonal completion. Modify the supplied "}<code>{"polynomial_trace"}</code>{" input to a 3×2 matrix with only entry (0,0)=2; which property should the output check?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The nonzero normalized magnitude is 1. Every term of the polynomial has a factor of its input magnitude. A missing singular direction stays zero."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"Normalization gives diag(1,0). The first nonzero result is 3.4445−4.775+2.0315=.701, so the matrix becomes diag(.701,0) and remains rank one. Every finite odd-polynomial iterate maps the missing direction to zero. The positive-support polar is diag(1,0); full orthogonal completions diag(1,1) and diag(1,−1) differ in their arbitrary action on the missing direction. A library SVD may select one completion, so compare action on the supported direction and zero action of the polynomial, not a uniquely imagined complement."}</Prose>

<Prose>{"Reuse "}<code>{"polynomial_trace"}</code>{" from "}<code>{"matrix_geometry_muon.py"}</code>{": set "}<code>{"changed = np.zeros((3, 2)); changed[0, 0] = 2"}</code>{" and calculate "}<code>{"frames = polynomial_trace(changed, steps=1)"}</code>{". The first output column is (.701,0,0) and the second is zero. Check "}<code>{"frames[-1][:, 1] == 0"}</code>{" and rank one within an explicit numerical tolerance. These values follow directly from the same scalar polynomial; this exercise's modification is a derived case, not a newly recorded execution."}</Prose>

</details>

<Prose>{""}<strong>{"9. A gradient matrix is not a Hessian."}</strong>{" Use f(w)=½wᵀHw with H=diag(2,4,4,2), W=[[1,.25],[.25,1]], and column-major w=vec(W). Derive G, the Newton displacement, a unit-rate polar displacement, and a unit-rate entrywise-sign displacement. Compare resulting losses. Why is G⁻¹ not an inverse Hessian here?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The loss has four parameters. Multiply H by the four-vector before reshaping the gradient. Evaluate each proposal in the original four-parameter objective."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"The gradient vector is (2,1,1,2), so G=[[2,1],[1,2]]. Newton gives dW=−W. The positive-definite gradient matrix has polar I, giving proposal −I; its entrywise sign is all ones, giving proposal −ones. The original loss is ½(2+4/16+4/16+2)=2.25. Newton leaves W=0 and loss 0. The polar proposal leaves off-diagonal entries .25, producing loss .25. The sign proposal leaves off-diagonal entries −.75, producing loss 2.25. These are exact outcomes for this quadratic and these unit rates. G⁻¹ acts on two-dimensional vectors; the loss Hessian inverse acts on four parameter directions, so the former cannot replace the latter."}</Prose>

</details>

<Prose>{""}<strong>{"10. Change the real-data reduction deliberately."}</strong>{" Replace the 80-row Iris mean likelihood plus .05||θ||² by a sum likelihood plus 4||θ||². Explain which optimizer quantities stay equivalent, how stopping tolerance should change, and what happens if the ridge term remains .05||θ||² instead. Use the complete derivative function from section 4 to implement the modified value/gradient/Hessian without duplicating the likelihood formula."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Multiplying the whole objective by a positive constant scales its value, gradient and Hessian by the same constant. Check both sides of the Newton and Armijo equations."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"The new objective is exactly 80L, so its minimizer is unchanged. Its Newton system is (80H)d=−80g, giving the same direction. Both sides of the Armijo comparison scale by 80, so the inequality is equivalent. To preserve the gradient-infinity-norm stopping criterion, multiply its tolerance by 80 too. Other library stopping heuristics must be inspected separately; this does not promise identical L-BFGS closure counts with unchanged numeric options."}</Prose>

<Prose>{"With the supplied "}<code>{"value_gradient_hessian"}</code>{", the precise reusable implementation is:"}</Prose>

<CodeBlock language={"python"} filename="iris_mean_to_sum_fragment.py" title="Mean-to-sum derivative transformation fragment">{"def sum_value_gradient_hessian(theta, x, y, ridge=.1):\n    value, gradient, hessian = value_gradient_hessian(theta, x, y, ridge)\n    count = len(y)\n    return count * value, count * gradient, count * hessian"}</CodeBlock>

<Prose>{"Call this function wherever the Newton loop obtains its value, gradient and Hessian, and scale its stopping tolerance by "}<code>{"len(y)"}</code>{". Keep the same data, start and line-search constants. For the library closure, use likelihood "}<code>{".sum()"}</code>{" and penalty "}<code>{"4 * theta.square().sum()"}</code>{" on the declared 80-row training set. Check equality of the transformed objective/derivatives at several fixed θ before fitting. If the sum likelihood keeps penalty coefficient .05, dividing the new objective by 80 reveals effective ridge .1/80 instead of .1, changing the relative regularization and generally the optimum. These equivalences are algebraic; no changed fit execution is claimed."}</Prose>

</details>

<Prose>{""}<strong>{"11. Compare Fisher with the observed score outer product."}</strong>{" For one affine-logit row x=(1,2,1), p=.25 and observed label y=1, calculate the model-Fisher contribution and observed-score outer product. Change y to zero. What does ridge .1I add to the single-row likelihood Hessian?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The model expects (y−p)² to be p(1−p). A single observed label instead fixes that squared residual. The common outer product xxᵀ is [[1,2,1],[2,4,2],[1,2,1]]."}</Prose>

</details>

<details><summary>Worked solution and check</summary>

<Prose>{"Model Fisher is .25×.75 xxᵀ=.1875xxᵀ. At observed y=1, the squared score coefficient is .75²=.5625; at y=0 it is .25²=.0625. The likelihood Hessian stays .1875xxᵀ because the logit is affine and its second derivative vanishes. For the declared single-row negative-log-likelihood plus .05||θ||² objective, the full Hessian is .1875xxᵀ+.1I. The added diagonal comes from the penalty, not the score expectation. Changing an observed label changes the observed outer product without changing this likelihood curvature at the same p. This example explains both the special Hessian/Fisher identity and the empirical-Fisher distinction."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<Prose>{""}<a href={"https://see.stanford.edu/Course/EE364A/79"}>{"Stephen Boyd, Stanford EE364A Lecture 15"}</a>{" gives a spoken route into descent, Newton geometry and convergence after sections 1–2. The "}<a href={"https://see.stanford.edu/materials/lsocoee364a/transcripts/ConvexOptimizationI-Lecture15.pdf"}>{"official transcript"}</a>{" is searchable. The page, outline and relevant transcript text were inspected; full video playback was not."}</Prose>

<Prose>{""}<a href={"https://pages.cs.wisc.edu/~yudongchen/cs726_sp25/Lecture_23_L-BFGS.pdf"}>{"Yudong Chen's L-BFGS lecture notes"}</a>{" develop the two-loop formula after section 3. They assume fluency with matrix products and are useful for following the nested inverse update in more detail."}</Prose>

<Prose>{""}<a href={"https://kellerjordan.github.io/posts/muon/"}>{"Keller Jordan's Muon account"}</a>{" supplies the method author's code and matrix-direction motivation after the deeper branch in section 6. Read its finite polynomial alongside the lesson's rank-deficient qualification: an odd polynomial keeps a zero direction zero. Its training comparisons are the author's historical experiments; they are not measurements from this lesson. Text/code were inspected, not native figure pixels."}</Prose></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf"}>{"Boyd and Vandenberghe, *Convex Optimization*, chapter 9"}</a>{": descent, Newton and line-search derivations, with the hypotheses of local convergence results. Matrix algebra and multivariate derivatives are prerequisites."}</li><li>{""}<a href={"https://users.iems.northwestern.edu/~nocedal/lbfgs.html"}>{"Nocedal's L-BFGS author page"}</a>{": original references and unconstrained limited-memory context. Use it to distinguish the mathematical family from a particular library's stopping and line-search settings."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.LBFGS.html"}>{"PyTorch 2.14 L-BFGS"}</a>{": the actual closure, memory and line-search API used by the fits. The executed snapshot is CPU 2.14.0; check your installed version's constraints."}</li><li>{""}<a href={"https://arxiv.org/pdf/1412.1193"}>{"Martens, *New Insights and Perspectives on the Natural Gradient Method*"}</a>{": advanced probability geometry, empirical-Fisher distinctions and reparameterization caveats after section 4."}</li><li>{""}<a href={"https://proceedings.mlr.press/v37/martens15.pdf"}>{"Martens and Grosse, K-FAC"}</a>{": the original block-expectation approximation and practical damping choices. The lesson's enumerated one-layer block isolates those mechanisms."}</li><li>{""}<a href={"https://proceedings.mlr.press/v80/gupta18a/gupta18a.pdf"}>{"Gupta, Koren and Singer, Shampoo"}</a>{": original tensor accumulators, spectral exponents and the assumptions behind its convex analysis. Practical variants can change those update rules."}</li><li>{""}<a href={"https://arxiv.org/html/2409.20325v1"}>{"Bernstein and Newhouse, *Old Optimizer, New Norm*, Story II and Appendix A"}</a>{": matrix norms and the instantaneous Shampoo/polar relationship. The relevant square full-rank inverse-power argument is used here; deficient cases require a supported-subspace interpretation. Selected passages, not the entire paper or its native figures, were inspected for this revision."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.Muon.html"}>{"PyTorch 2.14 Muon"}</a>{": options, shape adjustment and parameter-role guidance for the state replay. The installed implementation determines the exact EMA and bfloat16 primitive order described in section 6; its buffer convention is distinguished from the documentation's unnormalized recurrence."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.autograd.functional.hvp.html"}>{"PyTorch 2.14 HVP"}</a>{": the callable automatic-differentiation operation used in section 7. CG's SPD assumption belongs to the solver, not to the HVP API."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI Iris dataset"}</a>{": Fisher's measurements, correction notes, citation, DOI and CC BY 4.0 licence. This lesson reuses the corrected local asset, selects two species and fits their labels; the earlier covariance example had a different use."}</li><li>{""}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.logaddexp.html"}>{"NumPy "}<code>{"logaddexp"}</code>{""}</a>{": stable log-sum-exponential primitive used by the Bernoulli loss. The inspected stable documentation was version 2.5; the recorded execution used NumPy 2.3.5."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Readiness and next study"}</H3>

<Prose>{"Explain what each matrix represents, derive a small update, check its assumptions and verify its result by an independent route. Can you distinguish loss curvature from a distribution metric and from matrix-direction shaping? Can you diagnose a rejected pair, a singular solve or a misleading evaluation count? Next in this module is "}<a href={"/learn/path/full-curriculum/non-convex-optimization-landscape?module=math-foundations"}>{"Non-Convex Optimization Landscape"}</a>{": use the distinction between zero gradient, positive curvature and useful global behavior to study the surfaces these methods encounter."}</Prose></section>
</div>
};
