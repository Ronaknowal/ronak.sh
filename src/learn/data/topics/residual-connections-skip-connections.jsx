import { Prose, H2, H3, Code, CodeBlock } from '../../components/content';
import { HighwayGateFigure } from '../../components/lesson-labs/ResidualGateIntuition.jsx';
import { Math, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import { ResidualBlockAnatomy, IdentityRequirementFigure, ResidualStackFigure, ResidualPlacementFigure, ResidualProjectionDiagram, DigitNetworkDiagram, AddConcatFigure, HighwayBlockDiagram, DegradationTable, ShortcutVariantsTable, ResidualZeroBranchFigure } from '../../components/lesson-labs/ResidualBuildupFigures.jsx';
import { ResidualTable, ResidualDiagnosticsFigure, ResidualCorrectionLab, ResidualDepthLab, ResidualOrderLab, ResidualProjectionLab, ResidualOpeningLab, ResidualDigitSpecimens, ResidualEvidenceLab, ResidualAblationLab, ResidualPathsFigure, ResidualDenoisingFigure, ResidualEulerLab, ResidualMemoryFigure, ResidualProgram } from '../../components/lesson-labs/ResidualConnectionsLabs.jsx';
function MathBlock({children}) { return <div className="res-equation" role="region" tabIndex={0} aria-label="Equation; scroll horizontally when needed"><SharedMathBlock>{children}</SharedMathBlock></div>; }
export default {
  title: 'Residual Connections & Skip Connections: Keep a Path, Learn a Correction',
  readTime: '60–80 min + live exploration and practice',
  hasIntegratedGuide: true,
  content: () => <div className="residual-lesson lesson-flow">
<Prose opening="exploration"><strong>{"Explore as you read."}</strong>{" Each figure opens with its result already computed, and its few controls sit directly underneath it; change a value and every number beside it updates at once. Colours mean the same thing in every diagram: cyan is the input and the skip route that carries it unchanged, amber the learned weights inside the branch, violet a value the block computes, and orange a derivative travelling backward."}</Prose>

<Prose>{"Suppose a network has already formed a useful description of an image, stored as a list of numbers. The next group of layers has two options. It can compute a completely new list and throw the old one away, or it can keep the old list and compute only a "}<em>{"correction"}</em>{" to add to it."}</Prose>

<Prose>{"A "}<strong>{"residual connection"}</strong>{" implements the second choice:"}</Prose>

<MathBlock>{"\\text{new representation}=\\text{current representation}+\\text{learned correction}."}</MathBlock>

<Prose>{"Why would that matter? In 2015, researchers noticed that simply stacking more ordinary layers made some image networks "}<em>{"worse"}</em>{", even on the data they were trained on. A block whose best move is to change almost nothing still had to learn how to pass its input through. This lesson builds the residual block part by part, shows why keeping the old values makes “change nothing” easy and gives learning signals a route that does not depend on the branch weights, and then tests where that help stops."}</Prose>

<Prose opening="route"><strong>{"First pass:"}</strong>{" read the block's anatomy and its worked numbers, then see why a plain block struggles to change nothing and how a stack of blocks carries values and derivatives. Next, compare where normalization sits and what happens when shapes differ, then run the small digit experiment. Practices 1–4, 8 and 9 check those ideas. Scaled and gated residuals, path expansions, architecture families and the differential-equation connection are deeper branches to revisit after the core."}</Prose>

<Prose opening="summary">Before you start: vectors and matrix–vector products, a loss and its gradient, and the chain rule from the <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation</a> lesson. LayerNorm appears as a named step; recall its internals from the <a href="/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals">Normalization</a> lesson.</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/weight-initialization-xavier-kaiming-p?module=deep-learning-fundamentals"}>{"previous initialization lesson"}</a>{" asked how transformations should start. This lesson asks how to connect them. We will use vectors and small MLPs first, so convolution and attention are not prerequisites."}</Prose>

<H2>{"One block, with numbers you can follow"}</H2>

<Prose>{"Start with the smallest possible residual block, applied to one example described by two numbers. Here it is with every value filled in; read it from top to bottom."}</Prose>

<ResidualBlockAnatomy id="residual-block-anatomy" allowBackward={false} />

<Prose>{"At the top is the "}<strong>{"input"}</strong>{" "}<Math>{"x=[2,-1]"}</Math>{", the data arriving at the block. From there the values travel along two routes at once. On the left, the "}<strong>{"skip"}</strong>{" (also called the shortcut or identity route) carries "}<Math>{"x"}</Math>{" around unchanged: it has no weights and computes nothing. On the right, the "}<strong>{"branch"}</strong>{" "}<Math>{"F"}</Math>{" is an ordinary layer with learned weights "}<Math>{"W"}</Math>{". It computes the "}<strong>{"correction"}</strong>{" "}<Math>{"F(x)=Wx"}</Math>{": the first coordinate is "}<Math>{"0.1(2)+0.2(-1)=0"}</Math>{" and the second "}<Math>{"0(2)+(-0.5)(-1)=0.5"}</Math>{". The two routes meet at an "}<strong>{"addition"}</strong>{" "}<Math>{"\\oplus"}</Math>{", which adds matching coordinates, and that sum is the block's "}<strong>{"output"}</strong>{" "}<Math>{"y"}</Math>{". In symbols, with the numbers from the diagram:"}</Prose>

<MathBlock>{"x=\\begin{bmatrix}2\\\\-1\\end{bmatrix},\\quad\nW=\\begin{bmatrix}0.1&0.2\\\\0&-0.5\\end{bmatrix},\\quad\ny=x+F(x)=x+Wx=\\begin{bmatrix}2\\\\-1\\end{bmatrix}+\\begin{bmatrix}0\\\\0.5\\end{bmatrix}=\\begin{bmatrix}2\\\\-0.5\\end{bmatrix}."}</MathBlock>

<Prose>{"The first coordinate stayed unchanged; the second moved up by 0.5. A correction may be positive or negative, so a block can remove part of a feature as well as add to it. The name “skip” can mislead: both routes run in every forward pass, and the skip only bypasses the branch's layers."}</Prose>

<Prose>{"Now choose “All zero” under the diagram. The correction becomes "}<Math>{"[0,0]"}</Math>{" and the output equals the input exactly. Keep that setting in mind: a residual block changes nothing when its branch weights are zero, and the next section shows why that matters."}</Prose>

<H3>{"Training the correction"}</H3>

<Prose>{"So far the weights were given. Suppose this example should produce the output "}<Math>{"t=[1,0]"}</Math>{". The correction has not finished the job. Measure the miss with half the squared distance:"}</Prose>

<MathBlock>{"\\mathcal L=\\tfrac12\\|y-t\\|^2\n=\\tfrac12(1^2+(-0.5)^2)=0.625."}</MathBlock>

<Prose>{"The derivative with respect to "}<Math>{"y"}</Math>{" is "}<Math>{"g=y-t=[1,-0.5]"}</Math>{". Which weights should change? Weight "}<Math>{"W_{ij}"}</Math>{" multiplies input "}<Math>{"x_j"}</Math>{" and feeds output "}<Math>{"y_i"}</Math>{", so nudging it by a small amount moves "}<Math>{"y_i"}</Math>{" by "}<Math>{"x_j"}</Math>{" times that amount, and the loss by "}<Math>{"g_ix_j"}</Math>{" times it. Collecting "}<Math>{"g_ix_j"}</Math>{" for every "}<Math>{"i,j"}</Math>{" gives the "}<strong>{"outer product"}</strong>{" "}<Math>{"gx^\\top"}</Math>{":"}</Prose>

<MathBlock>{"\\nabla_W\\mathcal L=\n\\begin{bmatrix}2&-1\\\\-1&0.5\\end{bmatrix}."}</MathBlock>

<Prose>{"Gradient descent subtracts a small multiple of this gradient from the weights. Below, the same block is written as one line per stage, in the diagram's colours. Press the step button to apply "}<Math>{"W\\leftarrow W-\\eta\\nabla_W\\mathcal L"}</Math>{" with learning rate "}<Math>{"\\eta=0.1"}</Math>{" and watch the loss fall."}</Prose>

<ResidualCorrectionLab />

<Prose>{"The first step gives"}</Prose>

<MathBlock>{"W_{\\mathrm{new}}=W-0.1\\nabla_W\\mathcal L\n=\\begin{bmatrix}-0.1&0.3\\\\0.1&-0.55\\end{bmatrix},"}</MathBlock>

<Prose>{"so the new correction is "}<Math>{"[-0.5,0.75]"}</Math>{", the new output is "}<Math>{"[1.5,-0.25]"}</Math>{", and the loss is 0.15625. Notice what did not change: the skip has no weight, so it never learns. It changes the function the block computes and therefore the error used to train the correction. Further steps keep reducing the loss; a larger "}<Math>{"\\eta"}</Math>{" moves farther per step."}</Prose>

<Prose>{"This linear example exists for tracing arithmetic, not to suggest that one linear residual layer is more expressive than a general linear layer. Since "}<Math>{"x+Wx=(I+W)x"}</Math>{", both can represent the same linear maps. A practical residual branch usually includes a nonlinearity, as the next section shows."}</Prose>

<H2>{"Why a direct path helps optimization"}</H2>

<Prose>{"A deeper model can represent more functions, but training still has to find good parameters. The "}<strong>{"degradation problem"}</strong>{" was the observation that adding layers to certain plain networks "}<em>{"increased"}</em>{" their training error. That cannot be blamed on memorizing the training data, because the deeper network fit that same data worse. Here is the measurement that started it:"}</Prose>

<DegradationTable />

<Prose>{"Going from 18 to 34 layers, the plain net got worse (27.94 → 28.54) while the same layers with identity skips improved (27.88 → 25.03). The paper's Fig. 4 shows the 34-layer plain net with higher "}<em>{"training"}</em>{" error throughout training. The ResNets add no parameters: their skips are identities, and where a stage widens the number of features (image “channels”, met in §5), the extra coordinates are filled with zeros. “10-crop” means each test image was scored on ten crops and the results averaged."}</Prose>

<Prose><strong>{"What the degradation was not."}</strong>{" It is tempting to blame vanishing gradients. He et al. checked and argued otherwise: their plain networks used BatchNorm, forward signals kept nonzero variance, and backward gradients had healthy norms. They called it an optimization difficulty whose cause was still open. So the case for residual connections below is not “plain networks lose their gradient”; it is that a residual block makes “change nothing” and small refinements easy to represent and to reach, and that it adds a gradient route that does not depend on the branch weights. "}<a href={"https://arxiv.org/pdf/1512.03385"}>{"He et al. 2015, §4.1"}</a></Prose>

<Prose>{"Here is the puzzle. Take a network that works and append extra layers. If the extra layers learned to pass their input through unchanged, the deeper network would compute exactly what the shallower one did, so it could never be worse. He et al. reasoned that the optimizer had trouble finding that “change nothing” setting when it had to be built from several nonlinear layers. Their fix was to ask the layers for the difference "}<Math>{"F(x)=H(x)-x"}</Math>{" between the desired output "}<Math>{"H(x)"}</Math>{" and the input, and add "}<Math>{"x"}</Math>{" back. Then “change nothing” is simply "}<Math>{"F=0"}</Math>{", which the solver can approach by driving weights toward zero. "}<a href={"https://arxiv.org/pdf/1512.03385"}>{"He et al. 2015, §§1 and 3.1"}</a></Prose>

<Prose>{"The difference is easiest to see on a single block. Below, a "}<strong>{"plain"}</strong>{" block "}<Math>{"y=F(x)"}</Math>{" and a residual block "}<Math>{"y=x+F(x)"}</Math>{" share the same branch and the same input "}<Math>{"x=[2,-1]"}</Math>{". Choose the branch, then set its weights to zero or to the identity."}</Prose>

<IdentityRequirementFigure />

<Prose>{"With one linear matrix, both forms can express “change nothing”: the plain block needs "}<Math>{"W=I"}</Math>{", the residual block "}<Math>{"W=0"}</Math>{". The difference is which setting is the easy, all-zero one. Now choose the two-layer tanh branch. The residual block still changes nothing when "}<Math>{"W_2=0"}</Math>{". The plain block would need "}<Math>{"W_2\\tanh(W_1x)=x"}</Math>{" for every input, but tanh never leaves "}<Math>{"(-1,1)"}</Math>{", so this branch's output stays bounded while "}<Math>{"x"}</Math>{" does not: no setting of the two matrices does it exactly for every input. On a bounded range it can come close, by using small "}<Math>{"W_1"}</Math>{" to stay in tanh's nearly straight middle and large "}<Math>{"W_2"}</Math>{" to undo the shrinking, which is a much harder target than "}<Math>{"W_2=0"}</Math>{"."}</Prose>

<Prose>{"This shows that “change nothing” is available and easy to reach, not that an optimizer will find the best weights. A randomly initialized branch also does not start at zero; later sections show how to start close to it on purpose."}</Prose>

<H3>{"A stack of blocks keeps one route open all the way through"}</H3>

<Prose>{"Now chain several blocks. Each block's output is the next block's input, so the skips line up into one continuous route from the first input to the last output; this route is often called the "}<strong>{"residual stream"}</strong>{". To see what the skips themselves contribute, give every branch the simplest possible form: it multiplies its input by a slope "}<Math>{"a"}</Math>{". The figure follows a scalar input "}<Math>{"x_0=1"}</Math>{" down three blocks. In each row the skip is on the left and the branch on the right; the orange number at the end of each row says how much the final value moves per unit change at that stage, "}<Math>{"\\partial x_3/\\partial x_k"}</Math>{", computed from the output back."}</Prose>

<ResidualStackFigure id="residual-stack" />

<Prose>{"With the skips on and small branches, "}<Math>{"a=0.1"}</Math>{", each block multiplies by "}<Math>{"1+a=1.1"}</Math>{", so the end-to-end derivative is "}<Math>{"1.1^3=1.331"}</Math>{". The forward value also telescopes into the input plus every correction:"}</Prose>

<MathBlock>{"x_3=x_2+F_2(x_2)=x_0+F_0(x_0)+F_1(x_1)+F_2(x_2)."}</MathBlock>

<Prose>{"Now choose “Remove the skips”. The same branches give "}<Math>{"0.1^3=0.001"}</Math>{". But a plain layer with gain 0.1 is simply a badly scaled network: the "}<a href={"/learn/path/full-curriculum/weight-initialization-xavier-kaiming-p?module=deep-learning-fundamentals"}>{"Weight Initialization"}</a>{" lesson chose scales to keep each layer's gain near 1. Move the slope to "}<Math>{"a=1"}</Math>{" with the skips still removed: this well-scaled plain stack keeps derivative 1 with no skips at all. Finally keep the skips and set "}<Math>{"a=-1"}</Math>{": every branch cancels its skip and the derivative is 0, even though every skip is in place."}</Prose>

<Prose>{"So what do the skips add? Two things. First, the derivative stays near 1 "}<em>{"because"}</em>{" the branches are small, and small branches are exactly what makes “change nothing” "}<Math>{"(F=0)"}</Math>{" reachable. In this scalar toy stack, the well-scaled plain version keeps its gain only by making every layer copy its input exactly, a precise setting it must find and keep. Second, the skip's contribution of 1 per block does not depend on the branch weights, so it is present when the branches are zero-initialized or when many imperfect per-block gains are multiplied together. To see that second point inside one block, run the anatomy diagram backward."}</Prose>

<Prose>{"The loss "}<Math>{"\\mathcal L=\\tfrac12\\|y-t\\|^2"}</Math>{" with target "}<Math>{"t=[1,0]"}</Math>{" sends "}<Math>{"g=\\partial\\mathcal L/\\partial y=y-t=[1,-0.5]"}</Math>{" into the block from below. Read this diagram from the bottom up; the orange values are derivatives."}</Prose>

<ResidualBlockAnatomy initialDirection="backward" />

<Prose>{"An addition passes its incoming derivative unchanged to both of its inputs, because each input moves the sum one-for-one. So the skip carries "}<Math>{"g"}</Math>{" straight back to "}<Math>{"x"}</Math>{", the branch sends back "}<Math>{"W^\\top g"}</Math>{", and the two contributions add at the input:"}</Prose>

<MathBlock>{"\\nabla_x\\mathcal L=\\underbrace{g}_{\\text{skip}}+\\underbrace{J_F(x)^\\top g}_{\\text{branch}}."}</MathBlock>

<Prose>{"Here "}<Math>{"J_F(x)"}</Math>{" is the branch's "}<strong>{"Jacobian"}</strong>{": the matrix whose entry "}<Math>{"(i,j)"}</Math>{" says how much output coordinate "}<Math>{"i"}</Math>{" of "}<Math>{"F"}</Math>{" moves per unit change in input coordinate "}<Math>{"j"}</Math>{". For "}<Math>{"F(x)=Wx"}</Math>{" it is "}<Math>{"W"}</Math>{" itself. We write gradients as columns, which is why the transpose appears. With the lesson's numbers the skip contributes "}<Math>{"[1,-0.5]"}</Math>{", the branch "}<Math>{"W^\\top g=[0.1,0.45]"}</Math>{", total "}<Math>{"[1.1,-0.05]"}</Math>{"."}</Prose>

<Prose>{"Notice the second coordinate: after the two routes combine, its gradient is "}<strong>{"smaller"}</strong>{" than the skip's own contribution. The skip guarantees an undiminished contribution, not an undiminished total; the branch can add or subtract."}</Prose>

<H2>{"The skip cannot promise a nonvanishing total gradient"}</H2>

<Prose>{"The stack figure already hinted at a limit: at slope "}<Math>{"a=-1"}</Math>{" the derivative became 0 with every skip in place. How far does that go? With "}<Math>{"F(x)=ax"}</Math>{" a block is "}<Math>{"y=(1+a)x"}</Math>{", with derivative "}<Math>{"1+a"}</Math>{", so "}<Math>{"n"}</Math>{" blocks give "}<Math>{"(1+a)^n"}</Math>{". The row of values below shows the derivative after each block for ten blocks; it opens at "}<Math>{"a=0"}</Math>{", the exact identity. Move the slope to "}<Math>{"-0.5"}</Math>{"."}</Prose>

<ResidualDepthLab />

<Prose>{"With "}<Math>{"a=-0.5"}</Math>{" the derivative halves at every block: ten blocks give "}<Math>{"0.5^{10}=0.0009765625"}</Math>{" despite a skip in each. At "}<Math>{"a=-1"}</Math>{" the learned branch cancels the identity exactly and the derivative is 0 after the first block. At "}<Math>{"a=0"}</Math>{" the route is an exact identity; at "}<Math>{"a=0.1"}</Math>{" ten blocks give about 2.59374; at "}<Math>{"a=1"}</Math>{" they give 1024. Find the negative slope at which ten blocks first fall below 0.001, even though every skip is still there."}</Prose>

<Prose>{"For vector blocks "}<Math>{"x_{k+1}=x_k+F_k(x_k)"}</Math>{", the full Jacobian is the ordered product"}</Prose>

<MathBlock>{"J_{\\mathrm{total}}=(I+J_{F_{L-1}})\\cdots(I+J_{F_0})."}</MathBlock>

<Prose>{"The identity term offers a direct contribution. Other terms can reinforce or cancel it, and matrices generally cannot be reordered. A matrix's "}<strong>{"operator norm"}</strong>{" is the largest factor by which it can stretch the length of any vector. If each residual Jacobian has operator norm at most "}<Math>{"\\epsilon<1"}</Math>{", one-block directional gains lie between "}<Math>{"1-\\epsilon"}</Math>{" and "}<Math>{"1+\\epsilon"}</Math>{". Across "}<Math>{"L"}</Math>{" blocks, even the bound "}<Math>{"(1-\\epsilon)^L"}</Math>{" can become small. Small per-block changes and depth must be considered together."}</Prose>

<Prose>{"He et al. write this product for a whole stack as "}<Math>{"\\partial\\mathcal L/\\partial x_l=\\partial\\mathcal L/\\partial x_L\\,(1+\\partial\\textstyle\\sum_i F_i/\\partial x_l)"}</Math>{" and argue that cancellation is "}<em>{"unlikely"}</em>{" in practice: the branch term would have to equal −1 for every example in a mini-batch at once. The slope −1 case above is exactly that situation, built on purpose. Real branches depend on the input, so exact cancellation is rare, but strong contraction or growth over many blocks remains possible. "}<a href={"https://arxiv.org/pdf/1603.05027"}>{"He et al. 2016, §§2–4"}</a></Prose>

<Prose><strong>{"Why an unscaled identity, rather than just some direct path?"}</strong>{" The same paper replaces the skip by "}<Math>{"x_{l+1}=\\lambda x_l+F(x_l)"}</Math>{" (its Eq. 6). Here is the same three-block stack with a skip multiplier "}<Math>{"\\lambda"}</Math>{"; it starts at "}<Math>{"\\lambda=0.5"}</Math>{" with zero branches, so only the skips act."}</Prose>

<ResidualStackFigure mode="lambda" />

<Prose>{"Unrolled, the purely direct term becomes "}<Math>{"\\prod\\lambda_i"}</Math>{" (Eqs. 7–8): below 1 it shrinks with every block, above 1 it grows. Three blocks at "}<Math>{"\\lambda=0.5"}</Math>{" already give 0.125, and a 110-layer network's 54 residual units would give about "}<Math>{"5.6\\times10^{-17}"}</Math>{". In their ResNet-110 experiments every modified skip trained worse than the identity, and λ = 0.5 with an unscaled branch failed to converge well:"}</Prose>

<ShortcutVariantsTable />

<Prose>{"Two rows use tools from later lessons: a “1×1 convolution” shortcut replaces the skip by a learned linear map applied at every image position (the Convolution lesson), and a “dropout” shortcut randomly zeroes skip values during training (the next lesson). Both are no longer identities. The paper's table also reports gated shortcuts. Their results range from failing to 6.91% for the best one, a shortcut-only gate "}<Math>{"g(x)"}</Math>{" whose bias started at −6: "}<Math>{"g"}</Math>{" began near 0, so the shortcut multiplier "}<Math>{"1-g"}</Math>{" began near 1, almost an identity. Every modification of the skip in the table did worse than the plain identity's 6.61%."}</Prose>

<Prose>{"Do not confuse this with scaling the "}<em>{"branch"}</em>{". The experiment later in this lesson includes a “fixed scaled” model, "}<Math>{"h+F(h)/\\sqrt L"}</Math>{": its skip is still an exact identity, so the direct term stays 1, and only the corrections are made smaller."}</Prose>

<H2>{"Operation order changes what is preserved"}</H2>

<Prose>{"Real blocks contain more than a matrix: normalization and an activation such as ReLU. Where should those go? Inside the branch, where they shape only the correction, or after the addition, where every value, including the skip's, must pass through them? Here are four well-known designs drawn in the same layout. Two come from Transformers, a later topic; read their “attention or MLP” as just another same-shape branch."}</Prose>

<ResidualPlacementFigure />

<Prose>{"In the first and third designs an operation sits after the join (marked “on the direct path”), so it changes what the skip delivers. In the second and fourth, every operation is inside the branch and the skip value reaches the output untouched; He et al. 2016 call that a “clean” path. Both arrangements train well in many settings; the placement changes what is preserved exactly."}</Prose>

<Prose>{"To isolate what an operation after the join does, set the correction to zero, so the skip value is all that reaches it. The lab starts from "}<Math>{"x=[-2,1]"}</Math>{" with ReLU after the join; switch the operation, then add a common shift to both inputs."}</Prose>

<ResidualOrderLab />

<Prose>{"With a zero correction the three choices compute"}</Prose>

<MathBlock>{"x+F(x)=x,\\qquad \\operatorname{ReLU}(x+F(x))=\\operatorname{ReLU}(x),\\qquad \\operatorname{LN}(x+F(x))=\\operatorname{LN}(x)."}</MathBlock>

<Prose>{"For "}<Math>{"x=[-2,1]"}</Math>{", nothing after the join gives "}<Math>{"[-2,1]"}</Math>{" and ReLU gives "}<Math>{"[0,1]"}</Math>{". ReLU's local Jacobian here is "}<Math>{"\\operatorname{diag}(0,1)"}</Math>{": its negative coordinate cannot pass through unchanged. LayerNorm across the two features gives approximately "}<Math>{"[-0.999998,0.999998]"}</Math>{" using epsilon "}<Math>{"10^{-5}"}</Math>{", unit affine scale and zero bias. Adding the same constant to both input coordinates leaves that output unchanged, so LayerNorm's Jacobian removes the common-shift direction even though the output magnitude looks well controlled."}</Prose>

<Prose>{"In "}<strong>{"pre-activation"}</strong>{" residual designs, normalization and activation live inside the correction path, and the addition has no trailing activation. In "}<strong>{"pre-norm"}</strong>{" designs, a common form is "}<Math>{"x+F(\\operatorname{LN}(x))"}</Math>{". With zero correction, both preserve the raw skip value. The normalization still affects the branch and its derivative."}</Prose>

<Prose>{"Moving an operation is not just relabeling a block. A post-activation ResNet can work well; Torchvision's standard BasicBlock and Bottleneck still apply ReLU after addition. The correct conclusion is to understand the chosen design, not to treat every post-activation block as a bug. "}<a href={"https://docs.pytorch.org/vision/0.26/_modules/torchvision/models/resnet.html"}>{"Torchvision 0.26 ResNet source"}</a></Prose>

<Prose>{"For a future Transformer lesson, the two patterns are:"}</Prose>

<MathBlock>{"\\begin{aligned}\n\\text{pre-norm: }&u=x+\\operatorname{Attention}(\\operatorname{LN}(x)),\\\\\n&y=u+\\operatorname{MLP}(\\operatorname{LN}(u));\\\\\n\\text{post-norm: }&u=\\operatorname{LN}(x+\\operatorname{Attention}(x)),\\\\\n&y=\\operatorname{LN}(u+\\operatorname{MLP}(u)).\n\\end{aligned}"}</MathBlock>

<Prose>{"Treat Attention here as another same-shape transformation; its mechanism comes later. Pre-norm keeps normalization off the direct route. It does not force the accumulated residual stream to have constant variance, or eliminate every need for learning-rate warmup (starting training with a small, gradually increasing learning rate). Xiong et al. study expected initialization gradients under a particular model and demonstrate useful pre-norm training results; that is narrower than stability at any depth and any learning rate. "}<a href={"https://arxiv.org/abs/2002.04745"}>{"On Layer Normalization in the Transformer Architecture"}</a></Prose>

<H2>{"Shape agreement also needs coordinate agreement"}</H2>

<Prose>{"Every block so far added two vectors of the same length. Addition combines corresponding entries, so for a batch of N vectors a residual output with shape [N, 32] should be added to another [N, 32] representation with the intended feature correspondence. An [N, 1] output may broadcast without a runtime error while performing a quite different operation."}</Prose>

<Prose>{"When dimensions do change, the skip needs its own matrix "}<Math>{"P"}</Math>{". Here the branch must produce three features from two, so the skip projects "}<Math>{"x=[2,-1]"}</Math>{" to three coordinates:"}</Prose>

<ResidualProjectionDiagram />

<Prose>{"The skip computes "}<Math>{"Px"}</Math>{" with "}<Math>{"P=[[1,0],[0,1],[1,1]]"}</Math>{", giving "}<Math>{"[2,-1,1]"}</Math>{": the third row defines a new feature, "}<Math>{"x_1+x_2"}</Math>{". The correction also has three coordinates, and the addition gives "}<Math>{"[2.1,-1.2,1.3]"}</Math>{". In symbols,"}</Prose>

<MathBlock>{"y=P x+F(x),\\qquad\nP=\\begin{bmatrix}1&0\\\\0&1\\\\1&1\\end{bmatrix}\n\\quad\\text{maps}\\quad [2,-1]\\ \\text{to}\\ [2,-1,1]."}</MathBlock>

<Prose>{"This is no longer an identity shortcut. An upstream gradient "}<Math>{"[1,2,3]"}</Math>{" returns through the skip as "}<Math>{"P^\\top[1,2,3]=[4,5]"}</Math>{": a projection changes both the forward representation and the backward sensitivity. The original ResNet's headline 18- and 34-layer comparison padded the extra channels with zeros (option A, no parameters). Its deeper 50-, 101- and 152-layer models used learned projections like this one, only where dimensions change (option B)."}</Prose>

<Prose>{"For an image tensor [N, C, H, W] (examples, channels, height, width), a future convolutional block may change channels and spatial resolution. A 1×1 convolution can mix channels at each position; stride can select a coarser grid. Both branches must agree on output shape "}<strong>{"and spatial alignment"}</strong>{", including padding choices. A projection is one solution; pooling or deliberate padding may fit other designs. Do not insert a learned projection where an identity already expresses the intended connection without considering its effects."}</Prose>

<Prose>{"The lab below asks what the skip's third coordinate means. Switch the skip back to the identity, change the third row of "}<Math>{"P"}</Math>{", or replace the three corrections by one broadcast value."}</Prose>

<ResidualProjectionLab />

<Prose>{"An identity cannot be added to three corrections: the shapes disagree, so there is no output and no backward result. With third row "}<Math>{"[1,1]"}</Math>{" the third coordinate means “sum of the original two”; "}<Math>{"[1,-1]"}</Math>{" means their difference; "}<Math>{"[0,0]"}</Math>{" has the right dimensions but carries no information. Broadcasting one value makes the shapes agree but cannot create three independent corrections. A permuted feature order would also need a matching permutation before the addition."}</Prose>

<H2>{"Start near identity while leaving something able to learn"}</H2>

<Prose><strong>{"Deeper branch."}</strong>{" The zero-weight setting from the first section is a natural place to start training, but there are different ways to begin with a small correction, and they do not all leave the branch able to learn."}</Prose>

<Prose>{"A two-layer branch can use "}<Math>{"F(x)=W_2\\phi(W_1x)"}</Math>{", with random "}<Math>{"W_1"}</Math>{" and zero "}<Math>{"W_2"}</Math>{". The initial correction is zero. The first gradient into "}<Math>{"W_1"}</Math>{" is zero, but "}<Math>{"W_2"}</Math>{" can receive a gradient from the nonzero hidden features. After "}<Math>{"W_2"}</Math>{" moves, the earlier layer can start learning. The figure shows the program's check, "}<Math>{"x=[1,2]"}</Math>{", "}<Math>{"W_1=I"}</Math>{", "}<Math>{"W_2=0"}</Math>{" and loss "}<Math>{"\\tfrac12\\|y\\|^2"}</Math>{"; switch the branch's last operation."}</Prose>

<ResidualZeroBranchFigure />

<Prose>{"Compare this with "}<Math>{"F(x)=\\operatorname{ReLU}(W_2\\phi(W_1x))"}</Math>{", again with "}<Math>{"W_2=0"}</Math>{". Using PyTorch's zero derivative for ReLU at zero blocks the gradient into "}<Math>{"W_2"}</Math>{" as well. A graph that passes the input through beautifully may have a correction branch that never learns."}</Prose>

<Prose>{"With the final linear output, "}<Math>{"\\nabla_{W_2}\\mathcal L=[[1,2],[2,4]]"}</Math>{". With the extra final ReLU, both weight gradients are zero."}</Prose>

<Prose><strong>{"ReZero"}</strong>{" instead uses a trainable scalar gate on the branch:"}</Prose>

<MathBlock>{"y=x+\\alpha F(x),\\qquad \\alpha_{\\mathrm{initial}}=0."}</MathBlock>

<Prose>{"At initialization, the block's input-output map is identity. For upstream gradient "}<Math>{"g"}</Math>{","}</Prose>

<MathBlock>{"\\frac{\\partial\\mathcal L}{\\partial\\alpha}=g^\\top F(x),\n\\qquad\n\\nabla_W\\mathcal L=\\alpha J_{F,W}^\\top g."}</MathBlock>

<Prose>{"Here "}<Math>{"J_{F,W}"}</Math>{" is the Jacobian of the branch output with respect to its own weights, rather than its input. The scalar may move before the branch parameters do. It is a weight, not a probability, and may become negative. With "}<Math>{"x=[1,2]"}</Math>{", "}<Math>{"F(x)=[0,0.7]"}</Math>{", target zero, and half squared loss, the scalar gradient is 1.4. SGD at 0.1 moves "}<Math>{"\\alpha"}</Math>{" from zero to −0.14. A later update can reach the branch weights. If the scalar gradient is also zero, that first movement is not guaranteed. "}<a href={"https://arxiv.org/pdf/2003.04887"}>{"ReZero paper, mechanism and scalar example"}</a></Prose>

<Prose>{"The lab traces this example. It starts at "}<Math>{"\\alpha=0"}</Math>{"; move the gate away from zero, switch to one gate per feature, or give the first feature a nonzero correction."}</Prose>

<ResidualOpeningLab />

<Prose>{"At "}<Math>{"\\alpha=0"}</Math>{" the output is exactly "}<Math>{"x"}</Math>{" and the branch weights receive zero gradient, yet the gate's own gradient is 1.4. With one gate per feature, the gradients are "}<Math>{"[0,1.4]"}</Math>{": the first gate stays put while its correction is zero. Give the first feature a nonzero correction and the two gates move differently."}</Prose>

<Prose><strong>{"LayerScale"}</strong>{" uses a separate learned scalar for each output feature, collected in a vector "}<Math>{"\\mathbf s"}</Math>{": "}<Math>{"x+\\mathbf s\\odot F(x)"}</Math>{". (The paper writes these scales as λ; here λ already names the skip multiplier of §3, so we use "}<Math>{"\\mathbf s"}</Math>{".) This gives channels separate update scales. Small nonzero values can allow small branch gradients immediately. Zero per-channel values remain per-channel parameters; they do not lose that flexibility just because their initial values coincide. The CaiT study tested particular small initial values and training recipes, not a universal “all networks above 24 layers need "}<Math>{"10^{-6}"}</Math>{"” law. "}<a href={"https://arxiv.org/pdf/2103.17239"}>{"LayerScale mechanism and initialization study"}</a></Prose>

<Prose>{"A fixed factor such as "}<Math>{"1/\\sqrt L"}</Math>{" is another possible design experiment. Its rationale often assumes approximately comparable residual contributions. In general,"}</Prose>

<MathBlock>{"E\\|x+F(x)\\|^2=E\\|x\\|^2+E\\|F(x)\\|^2+2E[x^\\top F(x)],"}</MathBlock>

<Prose>{"where the expectations average over the input distribution under study. Correlations can change the growth. Scaling, initialization, normalization, and optimizer choices work together; none can be inferred from depth alone."}</Prose>

<H2>{"A complete comparison on real handwritten digits"}</H2>

<Prose>{"Do these ideas matter on real data? The lesson's experiment classifies 400 real 8×8 digit images from the UCI optical-digits dataset, with pixel values 0–16. Three of the recorded training specimens look like this:"}</Prose>

<ResidualDigitSpecimens />

<Prose>{"Each image is divided by 16 and flattened to 64 inputs, and the network predicts one of the digits 0–9. Here is the whole classifier, with the shape of every tensor; the residual block from the first section sits in the middle, repeated "}<Math>{"L"}</Math>{" times."}</Prose>

<DigitNetworkDiagram />

<Prose>{"Every model starts with a 64→32 linear stem and tanh, and ends with a 32→10 logit head. The stem-only baseline connects those two directly. Other models insert 2, 6, or 12 blocks, each with the branch"}</Prose>

<MathBlock>{"F(h)=W_2\\tanh(W_1\\operatorname{LN}(h)+b_1)+b_2."}</MathBlock>

<Prose>{"LayerNorm operates across each row's 32 features with its standard affine parameters. The final branch output is linear, so its correction may have either sign. Only the join changes across the four connection modes; stem, head, branch layers, data and optimizer are the same, which is what makes the comparison about the connection:"}</Prose>

<ResidualTable caption="Four block return expressions" headers={[<>{"Mode"}</>,<>{"Block output"}</>]} rows={[[<>{"Plain"}</>,<><Math>{"F(h)"}</Math></>],[<>{"Residual"}</>,<><Math>{"h+F(h)"}</Math></>],[<>{"Fixed scaled"}</>,<><Math>{"h+F(h)/\\sqrt L"}</Math></>],[<>{"Learned zero gate"}</>,<><Math>{"h+\\alpha F(h)"}</Math>{", each block's "}<Math>{"\\alpha"}</Math>{" starts at zero"}</>]]} />

<Prose>{"Both scaled modes multiply the branch, never the skip, so every residual mode keeps the exact identity route discussed above. The learned-gate model retains LayerNorm to keep this comparison matched. It is a ReZero-style gate experiment, not a reproduction of the paper's complete normalization-free recipe."}</Prose>

<Prose>{"Each ordinary block has 2,176 trainable parameters: two 32×32 weights and two 32 biases, plus 32 LayerNorm scales and 32 offsets. The stem/head have 2,410 total. Thus a 12-block plain, residual, or fixed-scaled model has 28,522 parameters; the learned-gate model has 12 extra scalars. Parameter equality does not imply equal runtime, and deeper configurations do more work per update."}</Prose>

<Prose>{"To run it yourself, download "}<a href={"/learn-assets/residual-connections/residual-experiments.py"}>{"residual-experiments.py"}</a>{" and "}<a href={"/learn-assets/residual-connections/digits-400.csv"}>{"digits-400.csv"}</a>{" into one directory. The "}<a href={"/learn-assets/residual-connections/data-provenance.md"}>{"provenance"}</a>{" gives attribution and the exact split. With PyTorch, NumPy, and scikit-learn installed:"}</Prose>

<CodeBlock language="text">{"python residual-experiments.py"}</CodeBlock>

<Prose>{"The program contains all data loading, initialization, models, training, diagnostics, and evaluation. It was executed on CPU with PyTorch 2.14.0+cpu, NumPy 2.3.5 and scikit-learn 1.9.1. It downloads no model or data. In "}<Code>{"Refinement.forward"}</Code>{", the important architectural difference is the return expression. "}<Code>{"DigitNetwork"}</Code>{" constructs the same branch weights for a given seed/block index and the same stem/head for a given seed, across modes and depths. All models use the same stratified 280/120 training/validation split. Each trains for 250 full-batch Adam updates at learning rate 0.003. The three seeds were declared before examining results."}</Prose>

<ResidualProgram />

<Prose>{"Actual final seed-1 results:"}</Prose>

<ResidualTable caption="Selected actual seed-1 final results" headers={[<>{"Blocks"}</>,<>{"Mode"}</>,<>{"Training CE"}</>,<>{"Validation CE"}</>,<>{"Correct / 120"}</>]} rows={[[<>{"0"}</>,<>{"Stem only"}</>,<>{"0.027306"}</>,<>{"0.107264"}</>,<>{"117"}</>],[<>{"2"}</>,<>{"Plain"}</>,<>{"0.000968"}</>,<>{"0.195945"}</>,<>{"115"}</>],[<>{"2"}</>,<>{"Residual"}</>,<>{"0.001076"}</>,<>{"0.112114"}</>,<>{"115"}</>],[<>{"6"}</>,<>{"Plain"}</>,<>{"0.000702"}</>,<>{"0.254232"}</>,<>{"116"}</>],[<>{"6"}</>,<>{"Residual"}</>,<>{"0.000664"}</>,<>{"0.221809"}</>,<>{"116"}</>],[<>{"12"}</>,<>{"Plain"}</>,<>{"0.002000"}</>,<>{"0.599136"}</>,<>{"110"}</>],[<>{"12"}</>,<>{"Residual"}</>,<>{"0.000389"}</>,<>{"0.303736"}</>,<>{"111"}</>],[<>{"12"}</>,<>{"Fixed scaled"}</>,<>{"0.000405"}</>,<>{"0.144360"}</>,<>{"113"}</>],[<>{"12"}</>,<>{"Learned zero gate"}</>,<>{"0.000184"}</>,<>{"0.161761"}</>,<>{"116"}</>]]} />

<Prose>{"These results do "}<strong>{"not"}</strong>{" reproduce the exact historical degradation experiment. All these plain networks fit the training set well at this budget. Their deeper validation results can still worsen. Across seeds, the 12-block residual model scores 111–116 correct; the scaled model 113–116; and the learned-gate model 115–117. The much smaller stem-only baseline scores 117–118. More depth is not necessary for every dataset."}</Prose>

<Prose>{"The lab replays any recorded fit: choose a connection, a depth and a seed and read its training and validation curves. The vertical axis is logarithmic and fixed for every record, so small training losses stay visible and switching records never rescales it; the faint line is the same seed's stem-only model. It opens on 12 residual blocks for seed 1."}</Prose>

<ResidualEvidenceLab />

<Prose>{"The program records CE and correct counts at updates 0, 1, 25, 100, and 250. It also records layer activation mean squares and gradients of the loss on a fixed 32-example training subset, plus how far each branch matrix moved from its initialization; the complete values are in the measurements download. The diagnostics answer a local question: at a given update, how strongly does the loss gradient reach each layer, and did the branches actually train? Here are three of those records, for seed 1:"}</Prose>

<ResidualDiagnosticsFigure />

<Prose>{"In these runs, the loss gradient reached every layer at update 0 in both 12-block models, and it was larger at the stem than at the last block, not smaller. That matches the kind of check described in “What the degradation was not” above; it describes these two recorded starts, not the cause of any later difference. The learned-gate model ends with gates of both signs, each between 0.127 and 0.142 in size, and its branch weight matrices moved 2.8 to 3.3 from their initialization (Frobenius norm): zero gates at the start did not leave the branches untrained. A larger gradient norm is not automatically more useful; these records answer only the questions above."}</Prose>

<Prose><strong>{"Try a controlled change:"}</strong>{" first choose one seed and compare plain versus residual at the same depth. Then compare residual versus scaled. Identify which variables are held fixed and which change. For a new experiment, alter one branch placement or initialization, explain the observed effect, and keep the resulting record separate. These are validation comparisons; this packet has no final test estimate."}</Prose>

<H2>{"Own the addition; reuse the layers and differentiation"}</H2>

<Prose>{"The scratch operation here is the routing equation, not a replacement for every linear layer. In "}<a href={"/learn-assets/residual-connections/residual-experiments.py"}>{"residual-experiments.py"}</a>{", "}<Code>{"Refinement.forward"}</Code>{" computes a correction, checks its exact shape and returns "}<Code>{"inputs + scale * correction"}</Code>{". "}<Code>{"scale"}</Code>{" is a buffer for a fixed choice and an "}<Code>{"nn.Parameter"}</Code>{" for ReZero. That distinction determines whether it is saved as model state and whether an optimizer updates it. The complete "}<Code>{"DigitNetwork"}</Code>{" and fitting loop are also the ordinary PyTorch route; PyTorch has no mandatory opaque “residual layer” that a researcher must import."}</Prose>

<Prose>{"Exact excerpt from residual-experiments.py, lines 15–62: the block and the network that stacks it. The rest of the complete program above is data loading, fitting, scoring, diagnostics and the saved mechanism checks. Read it against the anatomy diagram: "}<Code>{"self.norm"}</Code>{", "}<Code>{"self.lower"}</Code>{", "}<Code>{"torch.tanh"}</Code>{" and "}<Code>{"self.upper"}</Code>{" are the branch; reusing the variable "}<Code>{"inputs"}</Code>{" is the cyan skip; the final "}<Code>{"return"}</Code>{" is the addition. "}<Code>{"DigitNetwork.states"}</Code>{" is the stack: each block's output becomes the next block's "}<Code>{"inputs"}</Code>{"."}</Prose>

<CodeBlock language="python">{"class Refinement(nn.Module):\n    def __init__(self, width, mode, depth, seed):\n        super().__init__()\n        self.norm = nn.LayerNorm(width)\n        self.lower = nn.Linear(width, width)\n        self.upper = nn.Linear(width, width)\n        generator = torch.Generator().manual_seed(seed)\n        for layer in (self.lower, self.upper):\n            nn.init.xavier_normal_(layer.weight, generator=generator)\n            nn.init.zeros_(layer.bias)\n        self.mode = mode\n        if mode == \"rezero\":\n            self.scale = nn.Parameter(torch.zeros(()))\n        else:\n            self.register_buffer(\"scale\", torch.tensor(1/math.sqrt(depth) if mode == \"scaled\" else 1.))\n\n    def forward(self, inputs):\n        correction = self.upper(torch.tanh(self.lower(self.norm(inputs))))\n        if self.mode == \"plain\":\n            return correction\n        if correction.shape != inputs.shape:\n            raise ValueError(\"residual addition requires the same shape and coordinate meaning\")\n        return inputs + self.scale*correction\n\n\nclass DigitNetwork(nn.Module):\n    def __init__(self, depth, mode, seed):\n        super().__init__()\n        self.stem = nn.Linear(64, 32)\n        self.blocks = nn.ModuleList([Refinement(32, mode, depth, seed*1000+i)\n                                    for i in range(depth)])\n        self.head = nn.Linear(32, 10)\n        for offset, layer in ((100, self.stem), (200, self.head)):\n            nn.init.xavier_normal_(layer.weight, generator=torch.Generator().manual_seed(seed+offset))\n            nn.init.zeros_(layer.bias)\n\n    def states(self, pixels, omit=None):\n        value = torch.tanh(self.stem(pixels))\n        outputs = [value]\n        for index, block in enumerate(self.blocks):\n            if index != omit:\n                value = block(value)\n            outputs.append(value)\n        return self.head(value), outputs\n\n    def forward(self, pixels):\n        return self.states(pixels)[0]"}</CodeBlock>

<Prose>The branch normalizes only its own input, creates hidden features, and produces a signed correction with a final linear map. The plain case returns that correction directly. The residual case first rejects accidental broadcasting, then adds the original input. This shape check cannot inspect feature meaning; preserving coordinate semantics remains part of the architecture design. There is no special residual operator hidden behind this return statement.</Prose>

<Prose>{"The function "}<Code>{"mechanisms"}</Code>{" pairs the hand-derived input/weight derivatives with "}<Code>{"torch.autograd.grad"}</Code>{", traces a zero last layer and a zero gate separately, and checks that addition itself saves no values for its derivative. Reuse the implemented "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation"}>{"Backpropagation lesson"}</a>{" for the differentiation engine, and "}<a href={"/learn/path/full-curriculum/batch-layer-group-rms-normalization"}>{"Normalization"}</a>{" for the "}<Code>{"LayerNorm"}</Code>{" primitive. These are actual implementation owners. Reuse the previous "}<a href={"/learn/path/full-curriculum/weight-initialization-xavier-kaiming-p"}>{"Initialization lesson"}</a>{" for scaling choices; those recipes complement the routing implemented here."}</Prose>

<Prose>In the fitting loop, <Code>model.train()</Code> selects training behavior, <Code>optimizer.zero_grad(set_to_none=True)</Code> clears the previous derivative, and cross-entropy receives logits rather than already-normalized probabilities. After checking that loss is finite, <Code>loss.backward()</Code> traverses both routes and <Code>optimizer.step()</Code> updates the parameters. Evaluation uses <Code>model.eval()</Code> with <Code>torch.no_grad()</Code>; these control different things. Fixed scales are saved buffers, while trainable gates enter the optimizer through <Code>model.parameters()</Code>. Match these details before attributing a changed result to the shortcut. The <a href="https://docs.pytorch.org/docs/2.14/generated/torch.nn.Module.html">Module API</a> documents mode, buffer and parameter behavior.</Prose>

<Prose>{"For a concrete code modification, replace the scalar gate with a width-sized "}<Code>{"nn.Parameter(torch.zeros(width))"}</Code>{" and leave the return expression unchanged. Broadcasting then applies one gate per feature. For upstream gradient g and branch output F, each new gate gradient is "}<Code>{"g[j] * F[j]"}</Code>{", summed over batch rows if there are several. A scalar gate instead sums across features too. Check the changed gradient using the same input, target and weights, then perform one SGD step and confirm that both gates can move differently. The residual addition costs O(Nd) work for N rows of width d and adds no d×d matrix; the branch usually dominates arithmetic. This changes the model class, so a trained scalar checkpoint cannot be called equivalent merely by repeating its scale across channels."}</Prose>

<details><summary>{"Extension hint"}</summary>

<Prose>{"Use the existing "}<Code>{"gates"}</Code>{" fixture and retain the branch while changing only the gate's shape."}</Prose>

</details>

<details><summary>{"Worked extension"}</summary>

<Prose>{"For input [1,2], branch [0,0.7], zero gate, and half squared error to zero, the vector gate gradient is [0,1.4]. At rate 0.1 it becomes [0,−0.14], whereas the scalar gate becomes −0.14 for both coordinates. The first coordinate happens to have zero correction in this fixture; edit the first branch row to make the representational difference observable. Success requires matching the separate gate gradients and subsequent outputs, not just a nonzero loss decrease."}</Prose>

</details>

<H2>{"Many routes are useful, but they are not independent models"}</H2>

<Prose><strong>{"Deeper branch."}</strong>{" The telescoping sum from the stack section suggests another way to look at a residual network: as many routes from input to output, added together. For linear blocks the expansion is exact; for nonlinear ones it is not. Compare the two cases:"}</Prose>

<ResidualPathsFigure />

<Prose>{"For two linear residual blocks, multiplying out gives"}</Prose>

<MathBlock>{"(I+W_1)(I+W_0)x=x+W_0x+W_1x+W_1W_0x."}</MathBlock>

<Prose>{"You can identify four paths. With "}<Math>{"L"}</Math>{" linear blocks there are "}<Math>{"2^L"}</Math>{" such products. They share weights and are summed, not independently trained and averaged."}</Prose>

<Prose>{"For nonlinear blocks, do not distribute a function over addition. With "}<Math>{"F_0(x)=F_1(x)=x^2"}</Math>{" and "}<Math>{"x=1"}</Math>{", the actual result is"}</Prose>

<MathBlock>{"x_1=1+1=2,\\qquad x_2=2+2^2=6."}</MathBlock>

<Prose>{"The tempting expression "}<Math>{"x+F_0(x)+F_1(x)+F_1(F_0(x))"}</Math>{" gives 4 instead. The valid telescoping form is "}<Math>{"x_L=x_0+\\sum_kF_k(x_k)"}</Math>{"; each "}<Math>{"x_k"}</Math>{" already depends on earlier corrections. (At "}<Math>{"x=0"}</Math>{" both expressions happen to give zero; one agreeing input cannot validate a general identity.)"}</Prose>

<Prose>{"The ensemble-of-paths interpretation is useful for thinking about multiple gradient routes and testing robustness, but it is not a theorem that deleting any block is harmless. "}<a href={"https://arxiv.org/abs/1605.06431"}>{"Veit et al."}</a>{" The digit experiment can test that directly. After fitting, it omitted one residual block at a time from each six-block model and measured validation again without retraining. Each value in the row is one recorded deletion; select it to read the result."}</Prose>

<ResidualAblationLab />

<Prose>{"For seed 1 with six unscaled residual blocks, the full model gets 116/120 correct. Single-block omissions range from 28 to 114 correct. That is a direct counterexample to promising deletion robustness from architecture alone. Different scaled/gated runs can be less sensitive, but those outcomes also depend on training."}</Prose>

<Prose>{"These ablations inspect the fitted model. If you use them to choose a pruned architecture, validation information has guided a new selection; a later final evaluation must account for that workflow."}</Prose>

<H2>{"Connections that solve different problems"}</H2>

<Prose><strong>{"Addition versus concatenation."}</strong>{" The residual join adds. Another way to combine the same two routes is to place them side by side. With "}<Math>{"x=[2,-1]"}</Math>{" and "}<Math>{"F(x)=[0,0.5]"}</Math>{":"}</Prose>

<AddConcatFigure />

<Prose>{"Addition mixes aligned coordinates into one vector, "}<Math>{"[2,-0.5]"}</Math>{"; concatenation keeps them in separate positions, "}<Math>{"[2,-1,0,0.5]"}</Math>{". DenseNet supplies each layer with earlier feature maps by concatenation. Starting with "}<Math>{"c_0"}</Math>{" channels and adding "}<Math>{"k"}</Math>{" channels per layer gives "}<Math>{"c_0+Lk"}</Math>{" channels after "}<Math>{"L"}</Math>{" additions of features. Later layers receive more inputs, so stored activations and arithmetic must be assessed with the actual architecture. It is not automatically a more expensive or more accurate substitute at every budget. "}<a href={"https://arxiv.org/abs/1608.06993"}>{"DenseNet"}</a></Prose>

<Prose><strong>{"Gated carry."}</strong>{" A Highway-style block replaces the fixed skip by a learned gate "}<Math>{"T(x)"}</Math>{" between 0 and 1 that splits each feature between a carry route and a transform route. Here is a scalar block with "}<Math>{"H(x)=2x"}</Math>{" at "}<Math>{"x=1"}</Math>{":"}</Prose>

<HighwayBlockDiagram />

<Prose>{"The block computes "}<Math>{"T(x)\\odot H(x)+(1-T(x))\\odot x"}</Math>{": with gate value 0.7311 the carry route delivers 0.2689 and the transform route 1.4621, total 1.7311. Compare the residual block, whose skip has no multiplier at all. Here the gate can close the carry route (T near 1), so a nearly closed carry route is not an identity. Srivastava et al. start the gate bias negative (for example −1 or −3) so each block begins mostly carrying its input: the gated version of “start near identity”. "}<a href={"https://arxiv.org/abs/1505.00387"}>{"Highway Networks"}</a></Prose>

<Prose>{"Because the gate depends on the input, it also changes derivatives. The coupled expression can be written "}<Math>{"x+T(x)\\odot(H(x)-x)"}</Math>{": it interpolates toward a replacement "}<Math>{"H(x)"}</Math>{", with effective correction "}<Math>{"H(x)-x"}</Math>{". Changing the input changes both route values and their mixture. At "}<Math>{"x=1"}</Math>{" the three contributions to the derivative are:"}</Prose>

<HighwayGateFigure />

<Prose>{"In the scalar case the derivative is"}</Prose>

<MathBlock>{"y'(x)=(1-T(x))+T(x)H'(x)+T'(x)(H(x)-x)."}</MathBlock>

<Prose>{"The first two terms differentiate the routes while temporarily holding the gate fixed. The third differentiates the gate. It is easy to omit that third path when reading a diagram as a fixed weighted average."}</Prose>

<Prose><strong>{"Parallel corrections."}</strong>{" ResNeXt instead aggregates several related transformations inside a residual branch. Its "}<strong>{"cardinality"}</strong>{" counts those transformations. Grouped convolution is a later implementation tool for such structured channel computations. "}<a href={"https://arxiv.org/abs/1611.05431"}>{"ResNeXt"}</a></Prose>

<Prose><strong>{"Different spatial scales inside a block."}</strong>{" Res2Net organizes smaller channel groups with hierarchical residual-like connections, allowing different groups to accumulate different spatial contexts. Revisit its diagram after learning receptive fields; for now, recognize that an outer residual connection and the internal design of its correction are separate choices. "}<a href={"https://arxiv.org/abs/1904.01169"}>{"Res2Net"}</a></Prose>

<Prose><strong>{"Remove noise by learning what to subtract."}</strong>{" A residual target can also apply to a whole model. If a noisy observation is "}<Math>{"z=s+n"}</Math>{", a network can estimate the noise "}<Math>{"\\hat n(z)"}</Math>{" and return "}<Math>{"z-\\hat n(z)"}</Math>{". For an illustrative three-value signal:"}</Prose>

<ResidualDenoisingFigure />

<Prose>{"The second entry rises because its estimated noise is negative. That arithmetic does not show the estimated noise was correct; clean/noisy examples are needed to train and evaluate the estimator. DnCNN uses residual learning of this kind. It illustrates a residual target at the whole-model level, which need not mean every internal block has a ResNet shortcut. "}<a href={"https://arxiv.org/pdf/1608.03981"}>{"DnCNN, §III-B"}</a></Prose>

<Prose><strong>{"Refinement as a time step."}</strong>{" A differential equation "}<Math>{"dx/dt=f(x)"}</Math>{" says how fast a quantity "}<Math>{"x"}</Math>{" changes at its current value; "}<Math>{"f"}</Math>{" is that rate. Take "}<Math>{"f(x)=-x"}</Math>{": the exact solution from "}<Math>{"x(0)=1"}</Math>{" is "}<Math>{"x(t)=e^{-t}"}</Math>{", which decays smoothly to zero. The forward-Euler method approximates it in steps of size "}<Math>{"\\Delta t"}</Math>{": "}<Math>{"x_{k+1}=x_k+\\Delta t\\,f(x_k)"}</Math>{", which has exactly the residual form, input plus a correction. For "}<Math>{"f(x)=-x"}</Math>{" it becomes "}<Math>{"x_{k+1}=(1-\\Delta t)x_k"}</Math>{". The plot follows ten steps from "}<Math>{"x_0=1"}</Math>{"; change the step size."}</Prose>

<ResidualEulerLab />

<Prose>{"A step of 0.1 contracts by 0.9; a step of 2.5 alternates sign and grows by 1.5 per step. The differential equation decays smoothly, yet an overly large discrete step is unstable. This offers another reason that an identity route alone cannot ensure stability. Neural ODEs build a deeper connection by learning a derivative and using a differential-equation solver; an arbitrary residual network is not automatically a convergent solver. "}<a href={"https://arxiv.org/abs/1806.07366"}>{"Neural ODEs"}</a></Prose>

<H2>{"What really costs memory and computation"}</H2>

<Prose>{"An identity shortcut has no learned weights. Adding two equal-sized tensors performs one addition per entry and requires access to both values at that moment. The shortcut does not require a physical copy just because a diagram shows two lanes. Here is what each part needs to keep:"}</Prose>

<ResidualMemoryFigure />

<Prose>{"Backward through a pure addition only needs to route the upstream derivative; it does not need to save the input values to differentiate the addition itself. The program's saved-tensor hook records nothing for an addition and sum. Other operations in "}<Math>{"F"}</Math>{", their parameter gradients, and the lifetime of values across the branch do require storage. Memory therefore depends on the actual saved tensors and execution schedule, not simply “one saved input per plus sign.”"}</Prose>

<Prose>{"Activation checkpointing trades some saved intermediates for recomputation. In a simplified equal-cost chain, grouping "}<Math>{"L"}</Math>{" layers into chunks of size "}<Math>{"k"}</Math>{" suggests storage on the order of "}<Math>{"L/k+k"}</Math>{", minimized near "}<Math>{"k=\\sqrt L"}</Math>{". Real networks have unequal tensor sizes, workspaces, parameter/optimizer storage, and implementation choices."}</Prose>

<Prose>{"The two storage terms count different lifetimes. Keep roughly "}<Math>{"L/k"}</Math>{" chunk boundaries from the forward pass. During backward, rebuild at most "}<Math>{"k"}</Math>{" layers' intermediates inside the current chunk, use them, then release them before rebuilding the preceding chunk. For 16 equal-size layers, chunk size 4 gives the rough count "}<Math>{"4+4=8"}</Math>{", whereas sizes 1 or 16 each give "}<Math>{"16+1=17"}</Math>{". These omit endpoint constants and other allocations; they explain the balance behind the square-root choice, not a measured memory saving."}</Prose>

<Prose>{"PyTorch's current checkpoint documentation recommends an explicit "}<Code>{"use_reentrant=False"}</Code>{" and warns that recomputation must agree with the original forward behavior. Random masks and mutable state deserve particular care. "}<a href={"https://docs.pytorch.org/docs/2.14/checkpoint.html"}>{"PyTorch checkpoint contract"}</a></Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals"}>{"next lesson"}</a>{" will randomly mask residual branches. If code first computes "}<Code>{"F(x)"}</Code>{" and then multiplies it by zero, that branch's forward work has already happened. Avoid translating a masked-path diagram into an invented speedup."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"Practice"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Change the correction"}</H3>

<Prose>{"For the opening "}<Math>{"x,W,t"}</Math>{", change only "}<Math>{"W_{11}"}</Math>{" from 0.1 to −0.1, keeping the other three entries fixed. Calculate output and loss before looking at the solution."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"only the first correction coordinate changes."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"the correction becomes "}<Math>{"[-0.4,0.5]"}</Math>{", output "}<Math>{"[1.6,-0.5]"}</Math>{", and loss "}<Math>{"\\tfrac12(0.6^2+(-0.5)^2)=0.305"}</Math>{". This improves the initial 0.625, but differs from updating all weights with the gradient."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A skip in every block, almost no sensitivity"}</H3>

<Prose>{"Ten blocks use "}<Math>{"F(x)=-0.5x"}</Math>{". Find total derivative. Then choose a branch slope that gives total derivative exactly 1."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Multiply the local derivatives. A final gain can conceal sign changes along the way."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose><Math>{"0.5^{10}=0.0009765625"}</Math>{". Slope 0 gives each block derivative 1, hence total 1. Slope −2 also gives total 1 for an even ten blocks but reverses sign at each block; it is a useful reminder that a final gain alone does not describe intermediate behavior."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. A projection is not identity"}</H3>

<Prose>{"Use the 3×2 projection above with input "}<Math>{"[1,3]"}</Math>{" and upstream gradient "}<Math>{"[2,-1,4]"}</Math>{". Find skip output and skip contribution to input gradient."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Apply the projection in the forward direction and its transpose to the upstream gradient, coordinate by coordinate."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"output "}<Math>{"[1,3,4]"}</Math>{"; gradient "}<Math>{"[2+4,-1+4]=[6,3]"}</Math>{". The two-dimensional input receives contributions from three output coordinates."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Find the branch that cannot begin learning"}</H3>

<Prose>{"Both proposed blocks initially output their input. One ends its zero-initialized correction with a linear map; the other adds a ReLU after that map. Which parameter gradient should you inspect to distinguish them?"}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Identical forward outputs can still put a different final operation on the backward path."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"inspect the final correction weight's gradient under the same input and loss. In our fixture the linear case gets [[1,2],[2,4]], while the extra-ReLU case gets zero. Check later displacement too; the identity output by itself does not show that a correction will learn."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Count features"}</H3>

<Prose>{"A dense concatenation group starts with 16 channels and adds 8 channels in each of four layers. How many channels does the fourth layer receive, and how many exist afterward? Contrast addition with a fixed 16-channel residual stream."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Count the outputs of preceding layers before including the fourth layer itself."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"the fourth layer receives "}<Math>{"16+3(8)=40"}</Math>{" channels; afterward there are 48. A shape-preserving additive stream remains 16 channels. Its correction must output 16, even if it uses a different internal width."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Interpret a disappointing ablation"}</H3>

<Prose>{"A residual classifier loses accuracy when you remove a block. Does this refute the useful direct-gradient route, prove that the block must never be pruned, or justify another experiment?"}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Separate an algebraic property of the graph from the measured intervention on these trained parameters."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"it shows that this trained model depends on the block under the measured intervention. The derivative identity remains true. Retraining or a different regularization method may change the outcome, but that is another experiment with its own development and final-evaluation protocol. The ablation alone cannot guarantee successful pruning."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. An optional stability calculation"}</H3>

<Prose>{"For "}<Math>{"x_{k+1}=(1-\\Delta t)x_k"}</Math>{", find positive step sizes that strictly contract magnitude. Explain what happens at "}<Math>{"\\Delta t=2"}</Math>{"."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"require "}<Math>{"|1-\\Delta t|<1"}</Math>{"."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose><Math>{"0<\\Delta t<2"}</Math>{". At 2, each step changes the sign without shrinking magnitude. For larger positive steps, magnitude grows. This is a scalar discretization calculation, not a bound for every trained residual network."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Trace a block whose branch is nonlinear"}</H3>

<Prose>{"A block uses "}<Math>{"F(x)=W_2\\tanh(W_1x)"}</Math>{" with "}<Math>{"W_1=I"}</Math>{", "}<Math>{"W_2=\\begin{bmatrix}0.5&0\\\\0&0.5\\end{bmatrix}"}</Math>{" and no biases. (a) For "}<Math>{"x=[1,0]"}</Math>{", give the correction, the residual output and what a plain block "}<Math>{"y=F(x)"}</Math>{" would output. (b) Which "}<Math>{"W_2"}</Math>{" makes the residual block return its input exactly? (c) For "}<Math>{"x=[1,-1]"}</Math>{", compare "}<Math>{"x+F(x)"}</Math>{" with "}<Math>{"\\operatorname{ReLU}(x+F(x))"}</Math>{"."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"Work through the branch lane first: "}<Math>{"\\tanh(1)\\approx0.761594"}</Math>{", "}<Math>{"\\tanh(0)=0"}</Math>{", then multiply by "}<Math>{"W_2"}</Math>{". The skip lane is just "}<Math>{"x"}</Math>{"."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"(a) The hidden values are "}<Math>{"[0.761594,0]"}</Math>{", so the correction is "}<Math>{"[0.380797,0]"}</Math>{" and the residual output "}<Math>{"[1.380797,0]"}</Math>{". A plain block outputs only the correction, "}<Math>{"[0.380797,0]"}</Math>{": most of the input is lost. (b) "}<Math>{"W_2=0"}</Math>{", for every input. (c) The correction is "}<Math>{"[0.380797,-0.380797]"}</Math>{", so "}<Math>{"x+F(x)=[1.380797,-1.380797]"}</Math>{"; a ReLU after the addition returns "}<Math>{"[1.380797,0]"}</Math>{", so the negative coordinate does not survive the direct path. That is the difference between the first two designs in the placement figure."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Remove the skips from a stack"}</H3>

<Prose>{"Four scalar blocks each have branch "}<Math>{"F(x)=0.2x"}</Math>{", starting from "}<Math>{"x_0=1"}</Math>{". Find the final value and the end-to-end derivative with skips and without them. Then give every branch slope that makes the with-skips derivative exactly 1."}</Prose>

<details><summary>{"Hint"}</summary>

<Prose>{"With skips each block multiplies by "}<Math>{"1+a"}</Math>{"; without them by "}<Math>{"a"}</Math>{". For a linear chain the final value and the derivative coincide when "}<Math>{"x_0=1"}</Math>{"."}</Prose>

</details>

<details><summary>{"Worked solution"}</summary>

<Prose>{"With skips: "}<Math>{"1.2^4=2.0736"}</Math>{" for both the value and the derivative. Without: "}<Math>{"0.2^4=0.0016"}</Math>{". The with-skips derivative "}<Math>{"(1+a)^4"}</Math>{" equals 1 when "}<Math>{"1+a=\\pm1"}</Math>{", so "}<Math>{"a=0"}</Math>{" or "}<Math>{"a=-2"}</Math>{"; the second flips the sign at every block and only returns to +1 because four is even. Set the stack figure to 0.2 with and without skips to check the three-block version, "}<Math>{"1.728"}</Math>{" and "}<Math>{"0.008"}</Math>{"."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"Another way to learn"}</H2>

<ul><li><a href={"https://arxiv.org/abs/1512.03385"}>{"Deep Residual Learning for Image Recognition"}</a>{" (He et al., 2015) is the original paper. Its Fig. 2 is the block drawn in this lesson's anatomy diagram (two weight layers, an identity shortcut, addition, then ReLU), §3.1 gives the “push the residual to zero” argument, and Fig. 1 shows the degradation curves that motivated it."}</li><li><a href={"https://arxiv.org/abs/1605.06431"}>{"Residual Networks Behave Like Ensembles of Relatively Shallow Networks"}</a>{" (Veit et al., 2016) draws a three-block network “unraveled” into its eight paths and measures what deleting blocks does. Read it after this lesson's paths section; our six-block ablation is a small counterpoint, not a replication."}</li><li><a href={"https://d2l.ai/chapter_convolutional-modern/resnet.html"}>{"Dive into Deep Learning: ResNet and ResNeXt"}</a>{" offers diagrams and a convolutional implementation. Read its function-class argument after the local arithmetic; revisit its image model after the convolution lesson. Operation-count reductions should not be read as measured wall-clock speedups."}</li><li><a href={"https://arxiv.org/pdf/1603.05027"}>{"Identity Mappings in Deep Residual Networks"}</a>{" is the detailed route through the two path conditions and activation-placement experiments. Distinguish its empirical observations from the exact algebra."}</li><li><a href={"https://docs.pytorch.org/vision/0.26/_modules/torchvision/models/resnet.html"}>{"Torchvision's ResNet source"}</a>{" lets you identify actual addition, projection, and post-activation lines in a maintained implementation."}</li><li><a href={"https://arxiv.org/pdf/2003.04887"}>{"ReZero"}</a>{" and "}<a href={"https://arxiv.org/pdf/2103.17239"}>{"LayerScale"}</a>{" are useful next readings for the optional learned-scale branch."}</li></ul>

<Prose>{"The next module topic is "}<a href={"/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals"}>{"Dropout, DropPath & Stochastic Depth"}</a>{". You now know exactly where a residual correction sits. The next question is what the model learns when some contributions are deliberately removed during training."}</Prose></section>
</div>,
};
