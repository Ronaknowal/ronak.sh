// Convolution lesson: one continuous reading flow (picture → walk-through → equation → code → changed case).
import { AdaptivePoolingBinsLab, BatchNormFoldingFigure } from '../../components/lesson-labs/ConvolutionOperatorIntuition.jsx';
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { FlowCheck } from '../../components/lesson-labs/LessonFlow.jsx';
import { ConvolutionAnatomyFigure, EdgeMapsFigure, DenseVersusConvolutionFigure, ChannelStackFigure, ChannelMixFigure, GroupsFigure, SharedUpdateFigure, PaddingStrideFigure, PoolingWindowsFigure, ReceptiveGrowthFigure, CnnPipelineFigure } from '../../components/lesson-labs/ConvolutionFoundationFigures.jsx';
import { DilationRulerLab, PoolingRoutesLab, ReceptiveTraceLab, DilationHolesLab, ConvolutionInfluenceLab, ShiftBoundaryLab, SamplingPhaseLab, ScatterLab, CoverageLab, ConvolutionPatchMatrixFigure, RecordedRunsLab, SavedMapsLab, ConvolutionProgram } from '../../components/lesson-labs/ConvolutionLabs.jsx';
export default {
  title: 'Convolution, Pooling & Receptive Fields',
  readTime: '~75 min read + experiments and practice; optional implementation branches ~30 min',
  hasIntegratedGuide: true,
  content: () => <div className="neural-lesson convolution-lesson lesson-flow">
    <LessonIntro prerequisites={<>Multiplication, sums and array indexing. A neuron's weighted sum plus bias from <a href="/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#neuron-anatomy">Perceptrons</a> and the gradient accumulation of <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation</a> are refreshed where they are used.</>} sections={[["1-a-small-rule-that-travels","1. A small rule that travels"],["2-channels-are-several-measurements-at-each-location","2. Channels are several measurements at each location"],["3-how-a-shared-filter-learns","3. How a shared filter learns"],["4-plan-the-geometry-before-stacking-layers","4. Plan the geometry before stacking layers"],["5-pooling-summarize-then-notice-what-disappeared","5. Pooling: summarize, then notice what disappeared"],["6-receptive-fields-where-can-this-number-get-information","6. Receptive fields: where can this number get information?"],["7-build-and-inspect-a-real-digit-classifier","7. Build and inspect a real digit classifier"],["8-optional-reach-influence-and-shifts","8. Optional: reach, influence and shifts"],["9-optional-the-reverse-operation-is-a-scatter-not-an-undo","9. Optional: the reverse operation is a scatter, not an undo"],["10-optional-implement-the-same-math-efficiently","10. Optional: implement the same math efficiently"],["implement-the-pullback-and-batch-the-arithmetic","Implement the pullback and batch the arithmetic"],["11-practice-construct-diagnose-transfer","11. Practice: construct, diagnose, transfer"],["references-and-other-ways-to-learn","References and other ways to learn"]]}>Follow one patch, one shared update and a complete digit classifier before the deeper influence, transpose and implementation branches.</LessonIntro>
<Prose opening="exploration"><strong>Explore as you read.</strong> Each interactive figure opens with a worked result. Select an output cell to see which input cells and weights produced it, or move a slider; the numbers and the drawing update together. The paragraphs around each figure say what to select or move and what to look for.</Prose>

<Prose>A handwritten 7 can move a little to the right and still be a 7. Its strokes are local, but their arrangement matters: a short horizontal stroke and a long diagonal belong together. How can a neural network use those facts instead of learning a separate detector for every possible pixel position?</Prose>

<Prose>Convolution reuses one small weighted sum at every position of a grid. Pooling summarizes nearby values. A receptive field tells us which part of the image a result can depend on. Together, these ideas let us read an image model as a sequence of visible operations.</Prose>

<Prose opening="route"><strong>First pass:</strong> follow one patch through a filter, learn how that filter changes, plan the sizes, and train the small digit classifier in sections 1–7. You should then be able to build and diagnose a basic CNN. Sections 8–10 are optional deeper routes into influence, reconstruction and efficient execution. The practice separates core readiness from those extensions.</Prose>

<Prose>You need multiplication, sums and array indexing. Neural terms are refreshed as they appear: a <em>parameter</em> is a learned number, an <em>activation</em> is a computed value, and a <em>gradient</em> says how a small change affects a chosen result. Our running task is to predict one of ten digit labels from an 8×8 intensity image. A dense network is the baseline; convolution is a different useful constraint, not a promise to beat it.</Prose>

<H2>{"1. A small rule that travels"}</H2>

<Prose>Start with the smallest complete case: a 3×3 image, a 2×2 grid of weights and one output number. The figure computes that number; the paragraphs after it name each part.</Prose>

<ConvolutionAnatomyFigure />

<Prose>Read the figure in order: input, kernel, output. The <strong>input</strong> <InlineMath>{"x"}</InlineMath> (cyan) is a 3×3 image: nine pixel values supplied by the data. The <strong>kernel</strong> <InlineMath>{"W"}</InlineMath>, also called a <strong>filter</strong> (amber), is a 2×2 grid of four learned weights, w₀₀ to w₁₁, and the <strong>bias</strong> <InlineMath>{"b"}</InlineMath> is one more learned number. The white outline marks the current <strong>window</strong>: the 2×2 patch of the image the kernel sits on. Each pixel inside it is labelled with the weight that multiplies it. Multiply, add the four products, add the bias: the result is the traced output (violet).</Prose>

<Prose>For the top-left window, with bias 0:</Prose>

<div className="neural-equation"><MathBlock>{"1(1)+2(-1)+0(0)+1(1)+0=0."}</MathBlock></div>

<Prose>Now select the next output cell in the same row, <InlineMath>{"y_{0,1}"}</InlineMath>. The window moves one column, but the <strong>same four weights and bias</strong> are used:</Prose>

<div className="neural-equation"><MathBlock>{"2(1)+0(-1)+1(0)+3(1)+0=5."}</MathBlock></div>

<Prose>Doing this at all four window positions fills the output grid <InlineMath>{"\\begin{bmatrix}0&5\\\\0&-2\\end{bmatrix}"}</InlineMath>. That grid is a <strong>feature map</strong>: one number per window position, laid out in the same row and column order as the windows. A large positive value means the patch there matches the kernel's pattern of signs, bright pixels under positive weights and dark pixels under negative ones. It is not yet a probability or a named feature.</Prose>

<Prose>For any output cell <InlineMath>{"(u,v)"}</InlineMath>, the figure's recipe is</Prose>

<div className="neural-equation"><MathBlock>{"y_{u,v}=b+\\sum_{i=0}^{1}\\sum_{j=0}^{1}W_{i,j}\\,x_{u+i,\\,v+j}."}</MathBlock></div>

<Prose><InlineMath>{"u,v"}</InlineMath> choose the output cell and therefore the window's top-left corner; <InlineMath>{"i,j"}</InlineMath> walk through the kernel's rows and columns. In NumPy the same line is <code>{"y[u, v] = b + np.sum(W * x[u:u+2, v:v+2])"}</code>.</Prose>

<Prose>Now try the two sliders under the figure. The centre pixel <InlineMath>{"x_{1,1}"}</InlineMath> sits inside all four windows, so changing it can change all four outputs, each through a different weight. The bias moves every output by the same amount, because the same <InlineMath>{"b"}</InlineMath> is added at every position.</Prose>

<FlowCheck prompt="Set the centre pixel to 3 and keep the bias at 0. Which outputs change, and by how much?"><Prose>The map becomes <InlineMath>{"\\begin{bmatrix}2&5\\\\-2&0\\end{bmatrix}"}</InlineMath>. The centre rose by 2, and it meets a different weight in each window: w₁₁ = 1 in window (0, 0), so that output rises by 2; w₁₀ = 0 in window (0, 1), so that output stays 5; w₀₁ = −1 in window (1, 0), so it falls by 2; w₀₀ = 1 in window (1, 1), so it rises by 2. A connection with a zero weight exists but contributes nothing.</Prose></FlowCheck>

<Prose>One naming detail: deep-learning libraries call this operation convolution, but mathematically it is <strong>cross-correlation</strong>, because the kernel is used in the orientation it is drawn. True convolution first flips the kernel on both axes: flipping <InlineMath>{"\\begin{bmatrix}1&-1\\\\0&1\\end{bmatrix}"}</InlineMath> gives <InlineMath>{"\\begin{bmatrix}1&0\\\\-1&1\\end{bmatrix}"}</InlineMath>, and true convolution with one equals cross-correlation with the other. Because training learns the weights, either convention describes the same family of layers; copying a fixed, hand-made filter between tools requires knowing which one a tool uses. <a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Conv2d.html"}>{"PyTorch Conv2d contract"}</a>.</Prose>

<Prose>What does a feature map say about an actual image? Think first in one dimension: the filter [−1, 1] subtracts each value from the next one, so a flat stretch gives 0 and a step gives a response. In two dimensions, the kernel <InlineMath>{"\\begin{bmatrix}-1&1\\\\-1&1\\end{bmatrix}"}</InlineMath> subtracts a window's left column from its right column, and <InlineMath>{"\\begin{bmatrix}-1&-1\\\\1&1\\end{bmatrix}"}</InlineMath> subtracts its top row from its bottom row. Here are both, applied to a real handwritten 7 from the lesson's digit file:</Prose>

<EdgeMapsFigure />

<Prose>The input grid is 8×8 ink counts from 0 (blank) to 16 (dark). Each map is the §1 operation slid over the digit with bias 0, giving 7×7 values; amber cells are positive, blue negative, and every cell shows its number. Read each map as “where does brightness change in this direction?” The horizontal-edge map is strongly positive along the top of the crossbar (+23 in row 2) and strongly negative along its bottom (−32 in row 4): going down, ink appears and then disappears. The vertical-edge map pairs amber on the left side of the diagonal stroke with blue on its right. Flat regions, blank or solid, give 0. A stroke therefore shows up as a pair of opposite-signed bands, and the size of each value says how sharp the change is.</Prose>

<Prose>These two kernels were set by hand to show what a map means. A trained network learns its own kernels from the labels; §7 shows the first-layer maps of a trained model, which you can read the same way.</Prose>

<Prose>How does this relate to the neurons you already know? Each output value is a neuron: a weighted sum of some inputs plus a bias, as in the <a href="/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#neuron-network-wiring">Perceptrons network diagram</a>. Only the wiring differs. Below, five inputs in a row stand for pixels and three outputs for map values:</Prose>

<DenseVersusConvolutionFigure />

<Prose>In the dense-layer panel, every input (cyan) connects to every output (violet), and every thin amber line is its own learned weight: 15 weights. In the convolution panel, each output connects only to its three neighbouring inputs, so the connections are <strong>local</strong>, and the solid, dashed and dotted lines carry the same three weights w₀, w₁, w₂ at every position, so the weights are <strong>shared</strong>. A convolution is a dense layer with most weights forced to zero and the rest tied together.</Prose>

<Prose>Why impose those two constraints? A stroke that matters at one position probably matters at another, so one detector can serve the whole image; and nearby pixels usually carry related evidence. The saving grows with image size. A dense layer connecting 64 input pixels to 512 outputs (the same 8 × 8 × 8 values as eight 8×8 maps) has 32,768 weights before biases. Eight 3×3 filters on a one-channel image have 72 weights, yet produce those eight whole 8×8 maps. Dense layers can learn such patterns too; they simply do not build locality and sharing into the model. The many windows of one image overlap and are correlated, so they are not hundreds of independent extra training examples.</Prose>

<H2>{"2. Channels are several measurements at each location"}</H2>

<Prose>An RGB image has three numbers at every pixel position: red, green and blue. Each of those grids is a <strong>channel</strong>. The feature map from §1 is one channel too, and a layer with eight kernels produces eight channels. So after the first layer every position holds several measurements, and the next layer must decide how to combine them.</Prose>

<Prose>The rule: a kernel for one output channel has one 2-D slice <strong>per input channel</strong>. The figure shows two input channels, the §1 image as channel 0 and a second grid as channel 1, and a layer with two output channels, A and B:</Prose>

<ChannelStackFigure />

<Prose>Each row pairs one input channel (cyan) with the kernel slice that reads it (amber), and computes a §1-style slice sum inside the same window (white outline). For output channel A at the top-left window, slice 0 gives 0, exactly §1's calculation, and slice 1 gives 3. The slice sums are added, and then channel A's one bias, 1, is added once: 0 + 3 + 1 = 4. Switch to output channel B: the same input with a different kernel gives a different map. Select any output cell to trace it.</Prose>

<Prose>Written for any output channel <InlineMath>{"o"}</InlineMath> at location <InlineMath>{"(u,v)"}</InlineMath>, with stride one and no padding:</Prose>

<div className="neural-equation"><MathBlock>{"y_{o,u,v}=b_o+\\sum_{c=0}^{C_{\\rm in}-1}\n\\sum_{i=0}^{k_h-1}\\sum_{j=0}^{k_w-1}\nW_{o,c,i,j}\\,x_{c,u+i,v+j}."}</MathBlock></div>

<Prose>Read each index against the figure: <InlineMath>{"o"}</InlineMath> selects the output channel (A or B), <InlineMath>{"c"}</InlineMath> an input channel (one row of the figure), and <InlineMath>{"i,j"}</InlineMath> a cell inside the window, as in §1. The two inner sums are one row's slice sum; the sum over <InlineMath>{"c"}</InlineMath> adds the rows; <InlineMath>{"b_o"}</InlineMath> is added once at the end.</Prose>

<Prose>A kernel can also be just 1×1. Then each output reads a single position from every channel: it mixes the measurements at that position without looking at neighbours. The figure shows one position with two input channels and two output channels; each wire carries one learned weight.</Prose>

<ChannelMixFigure />

<Prose>With channel values 2 and 3, output A computes <InlineMath>{"4(2)-1(3)+1=6"}</InlineMath> and output B computes <InlineMath>{"2(2)+1(3)+0=7"}</InlineMath>: two different weighted mixes of the same two numbers. Move either input and both outputs change, each in proportion to its own weight on that wire.</Prose>

<Prose>For a batch, PyTorch uses logical shape <InlineMath>{"[N,C,H,W]"}</InlineMath>: examples, channels, height, width. These are the same axes the <a href="/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals">Dropout lesson</a> used when its channel and spatial masks chose which values share one gate. A weight tensor has shape <InlineMath>{"[C_{\\rm out},C_{\\rm in},k_h,k_w]"}</InlineMath> when groups=1: in the channel figure, [2, 2, 2, 2]. It has no batch or output-position axis, because every example and every window reuses the same values.</Prose>

<H3>{"Implement the layer from scratch"}</H3>

<Prose>The figure's recipe translates directly into code. For each output position, cut the window out of every channel at once (a <InlineMath>{"[C_{\\rm in},k_h,k_w]"}</InlineMath> patch), multiply it by every output channel's kernel and sum, then add each channel's bias. <code>{"np.tensordot(weight, patch, axes=3)"}</code> performs that multiply-and-sum over the last three axes of the weight, giving one value per output channel. The <code>{"stride"}</code> and <code>{"padding"}</code> arguments default to what §1 did: move one cell at a time and add no border. Leave them at their defaults for now; §4 explains them and returns to this function.</Prose>

<CodeBlock language={"python"} filename={"conv2d_from_scratch.py"} title={"Complete program: a convolution layer in NumPy, checked against PyTorch"}>{"import numpy as np\nimport torch\nfrom torch.nn import functional as F\n\n\ndef conv2d(x, weight, bias, stride=1, padding=0):\n    \"\"\"Cross-correlation for one image. x: [C_in, H, W]; weight: [C_out, C_in, k_h, k_w]; bias: [C_out].\"\"\"\n    c_out, c_in, k_h, k_w = weight.shape\n    x = np.pad(x, ((0, 0), (padding, padding), (padding, padding)))  # zero ring around each channel\n    h_out = (x.shape[1] - k_h) // stride + 1\n    w_out = (x.shape[2] - k_w) // stride + 1\n    y = np.empty((c_out, h_out, w_out))\n    for u in range(h_out):\n        for v in range(w_out):\n            top, left = u * stride, v * stride\n            patch = x[:, top:top + k_h, left:left + k_w]            # [C_in, k_h, k_w]\n            # every output channel multiplies the whole patch, sums, then adds its own bias\n            y[:, u, v] = np.tensordot(weight, patch, axes=3) + bias\n    return y\n\n\nimage = np.array([[[1, 2, 0], [0, 1, 3], [2, 1, 0]],               # channel 0\n                  [[0, 1, 1], [2, 0, 1], [1, 1, 0]]], dtype=float)  # channel 1\nweight = np.array([[[[1, -1], [0, 1]], [[0, 1], [1, 0]]],          # output channel A\n                   [[[1, 0], [0, 0]], [[0, 0], [1, 1]]]], dtype=float)  # output channel B\nbias = np.array([1.0, 0.0])\n\nours = conv2d(image, weight, bias)\nlibrary = F.conv2d(torch.tensor(image)[None], torch.tensor(weight), torch.tensor(bias))[0]\nprint(\"output shape:\", ours.shape)\nprint(\"channel A:\", ours[0].tolist())\nprint(\"channel B:\", ours[1].tolist())\nprint(\"matches F.conv2d:\", np.allclose(ours, library.numpy()))\n"}</CodeBlock>

<CodeBlock language={"text"} kind={"output"} filename={"conv2d_from_scratch-output.txt"} title={"Output (Python 3.12, NumPy 2.3.5, PyTorch 2.14.0 CPU)"}>{"output shape: (2, 2, 2)\nchannel A: [[4.0, 7.0], [2.0, 1.0]]\nchannel B: [[3.0, 3.0], [2.0, 2.0]]\nmatches F.conv2d: True"}</CodeBlock>

<Prose>The first two printed maps are the channel figure's output channels A and B. The library call adds a leading batch axis (<code>{"[None]"}</code> makes the shape <InlineMath>{"[1,C,H,W]"}</InlineMath>) and takes the same weight layout, so the correspondence is exact: <code>{"nn.Conv2d(in_channels=2, out_channels=2, kernel_size=2)"}</code> stores a <code>{".weight"}</code> of shape [2, 2, 2, 2] and a <code>{".bias"}</code> of shape [2], which <code>{"F.conv2d"}</code> uses in the same arithmetic.</Prose>

<Prose>Cost: the two position loops run <InlineMath>{"H_{\\rm out}W_{\\rm out}"}</InlineMath> times, and each <code>{"tensordot"}</code> does <InlineMath>{"C_{\\rm out}C_{\\rm in}k_hk_w"}</InlineMath> multiply-adds, so the arithmetic is the product of those counts and the extra memory is one patch. That is the right total work; it is slow in Python only because the position loop is interpreted. §10 opens the general routine with groups and dilation, a patch-matrix formulation, and a vectorized version whose loops run over kernel taps instead of positions. In a real model, use <code>{"nn.Conv2d"}</code>; its backends choose efficient algorithms for the hardware.</Prose>

<Prose>So far every output channel has read every input channel. <strong>Grouped convolution</strong> restricts those connections. Here four input channels and six output channels are split into two groups:</Prose>

<GroupsFigure />

<Prose>Each half of the outputs sees only its corresponding half of the inputs, so each output channel's kernel has two slices instead of four, and both channel counts must be divisible by the number of groups. A <strong>depthwise</strong> convolution uses one group per input channel, optionally producing several outputs per input channel; the multiplier need not be one. A later 1×1 layer, as in the channel-mix figure, can then mix those separate channels. We will study this design properly after the landmark architectures.</Prose>

<H2>{"3. How a shared filter learns"}</H2>

<Prose>A shared weight is used at many windows. When training adjusts it, what does each window contribute? Use a one-dimensional example small enough to calculate completely: input <InlineMath>{"x=[1,3,2]"}</InlineMath>, filter <InlineMath>{"w=[1,-1]"}</InlineMath>, no bias. The figure shows the two windows: each output reads two neighbouring inputs through the same two weights.</Prose>

<SharedUpdateFigure />

<Prose>Forward, the outputs are <InlineMath>{"y=[-2,1]"}</InlineMath>: <InlineMath>{"y_0=1(1)+(-1)(3)"}</InlineMath> and <InlineMath>{"y_1=1(3)+(-1)(2)"}</InlineMath>. Suppose the desired output is <InlineMath>{"[0,0]"}</InlineMath>, and use half the <strong>sum</strong> of squared errors:</Prose>

<div className="neural-equation"><MathBlock>{"L=\\tfrac12((-2)^2+1^2)=2.5."}</MathBlock></div>

<Prose>Now switch the figure to <em>Backward</em>. Each output's gradient is <InlineMath>{"\\partial L/\\partial y_i=y_i-t_i"}</InlineMath>, its error; with targets 0 that is just the output, <InlineMath>{"[-2,1]"}</InlineMath>. Each error travels back along both wires of its window, multiplied by the input on that wire (orange). Weight w₀ sits on two wires, one per window, so its gradient adds both contributions:</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial w_0}=(-2)(1)+(1)(3)=1,\\qquad\n\\frac{\\partial L}{\\partial w_1}=(-2)(3)+(1)(2)=-4."}</MathBlock></div>

<Prose>Why add? A shared weight is one number used in several places, exactly the “reused value” case from <a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals#2-shared-computations-need-a-sum-of-contributions"}>{"Backpropagation §2"}</a>: nudging it moves every output that uses it, so its derivative is the sum of each use's contribution. In the dense-versus-convolution figure, this is why all lines of the same style feed one gradient.</Prose>

<Prose>Gradient descent with step size 0.1 gives <InlineMath>{"w'=[0.9,-0.6]"}</InlineMath>. The new outputs are <InlineMath>{"[-0.9,1.5]"}</InlineMath>, and the new loss is 1.53. One output became worse, but the total objective improved: a shared filter negotiates all its uses rather than fixing each location separately. Raise the step size in the figure to see where a single step starts to overshoot.</Prose>

<Prose>Gradients also add where windows overlap on the input side. The middle input feeds both windows, with weight −1 in the first and 1 in the second:</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial x_1}=(-2)(-1)+(1)(1)=3."}</MathBlock></div>

<Prose>The full input gradient, shown above the inputs in the backward view, is <InlineMath>{"[-2,3,-1]"}</InlineMath>. With mean squared error the loss's denominator would scale these gradients. Weight sharing itself asks us to <strong>sum</strong> contributions; averaging comes only from the chosen loss reduction.</Prose>

<Prose>This complete program runs the same calculation. <code>{"F.conv1d"}</code> expects shape [N, C, L] (examples, channels, length), so <code>{"x[None, None]"}</code> adds a batch axis and a channel axis of size 1, and <code>{"w[None, None]"}</code> makes the weight [C_out, C_in, k] = [1, 1, 2]:</Prose>

<CodeBlock language={"python"}>{"import torch\nfrom torch.nn import functional as F\n\nx = torch.tensor([1., 3., 2.], dtype=torch.float64, requires_grad=True)\nw = torch.tensor([1., -1.], dtype=torch.float64, requires_grad=True)\ny = F.conv1d(x[None, None], w[None, None]).flatten()\nloss = 0.5 * y.square().sum()\nloss.backward()\nnew_w = w.detach() - 0.1 * w.grad\nnew_y = F.conv1d(x.detach()[None, None], new_w[None, None]).flatten()\nprint(\"output:\", y.detach().tolist(), \"loss:\", loss.item())\nprint(\"weight gradient:\", w.grad.tolist(), \"input gradient:\", x.grad.tolist())\nprint(\"updated:\", new_w.tolist(), \"new loss:\", (0.5 * new_y.square().sum()).item())"}</CodeBlock>

<Prose>For classification, hidden convolutions feed activations such as ReLU, <InlineMath>{"a=\\max(0,z)"}</InlineMath>, and a final layer produces one logit per class. Cross-entropy compares those logits with the actual digit. Backpropagation performs the same accumulation through the larger graph; there is no special second optimizer for filters.</Prose>

<H2>{"4. Plan the geometry before stacking layers"}</H2>

<Prose>In §1 the 2×2 window moved one cell at a time and never left the image, so a 3×3 input gave a 2×2 map: the output shrinks because the kernel needs room. Two settings change that. The figure uses a 5×5 input and a 3×3 kernel:</Prose>

<PaddingStrideFigure />

<Prose><strong>Padding</strong> adds a border of supplied values, usually zeros: the dashed cells, which are not image pixels. It lets windows sit at the edges too. <strong>Stride</strong> is how many cells the window jumps between outputs; the corner triangles mark where windows start. With padding 1 and stride 1 the output stays 5×5 (“same” size). Stride 2 skips every other start, so padding 1 gives 3×3 and padding 0 gives 2×2. Select an output cell to see the window that produced it.</Prose>

<Prose>The output size counts how many window starts fit, separately for height and width. The floor in the rule matters when the jumps do not land evenly: a 6×6 input with padding 0 and stride 2 would also give 2×2 and leave its last row and column unused.</Prose>

<Prose>A third setting, <strong>dilation</strong>, spaces out the positions a kernel samples: three taps with dilation 2 touch offsets 0, 2 and 4, three learned values spanning five positions. Dilation and asymmetric padding are easiest to see on one axis. The ruler below is a width-8 input with its padding (dashed P cells); the white outlines are the taps of one window, each labelled with its tap number:</Prose>

<DilationRulerLab />

<Prose>Choose “3 taps, dilation 2” and the outlined taps spread out with a gap between each pair. Then choose “4 taps” and compare padding (1, 2) with (2, 1): both give eight outputs, but the first window's centre moves by a whole pixel. The readout measures centres with pixel centres at 0.5, 1.5, 2.5, …, so a window covering pixels 0–2 is centred at 1.5.</Prose>

<Prose>For one dimension, let input size be <InlineMath>{"n"}</InlineMath>, kernel size <InlineMath>{"k"}</InlineMath>, dilation <InlineMath>{"d"}</InlineMath>, stride <InlineMath>{"s"}</InlineMath>, and left/right padding <InlineMath>{"p_l,p_r"}</InlineMath>. The sampled span is <InlineMath>{"k_{\\rm eff}=d(k-1)+1"}</InlineMath>. Counting the window starts that fit gives</Prose>

<div className="neural-equation"><MathBlock>{"n_{\\rm out}=\\left\\lfloor\\frac{n+p_l+p_r-k_{\\rm eff}}{s}\\right\\rfloor+1."}</MathBlock></div>

<Prose>Apply this independently to height and width. The floor means a leftover strip can be unused. A nonpositive result means the requested operation does not fit; it is not a valid zero-sized feature map. Some worked cases:</Prose>

<NeuralTable caption={"Output sizes from the window-count rule"} headers={[<>{"Input"}</>,<>{"Kernel / dilation"}</>,<>{"Padding left,right"}</>,<>{"Stride"}</>,<>{"Output"}</>]} rows={[[<>{"8"}</>,<>{"3 / 1"}</>,<>{"1,1"}</>,<>{"1"}</>,<>{"8"}</>],[<>{"8"}</>,<>{"3 / 1"}</>,<>{"1,1"}</>,<>{"2"}</>,<>{"4"}</>],[<>{"8"}</>,<>{"4 / 1"}</>,<>{"1,2"}</>,<>{"1"}</>,<>{"8"}</>],[<>{"8"}</>,<>{"3 / 2"}</>,<>{"2,2"}</>,<>{"1"}</>,<>{"8"}</>],[<>{"7"}</>,<>{"3 / 1"}</>,<>{"0,0"}</>,<>{"2"}</>,<>{"3"}</>]]} />

<Prose>“Same” describes an output-size policy, not a universal padding number. For stride one, total required padding is <InlineMath>{"d(k-1)"}</InlineMath>. With an even effective kernel this may need unequal sides, as the ruler showed: a four-wide kernel can use left 1/right 2 or left 2/right 1; both preserve width but align outputs differently. In PyTorch 2.14, <code>{"padding=\"same\""}</code> supports stride one. Explicit <code>{"F.pad"}</code> handles a chosen asymmetric policy.</Prose>

<Prose>Two other names describe useful boundary choices. With stride and dilation one, <strong>valid</strong> uses no padding and produces <InlineMath>{"n-k+1"}</InlineMath> outputs. <strong>Full</strong> uses <InlineMath>{"k-1"}</InlineMath> padding on each side and produces <InlineMath>{"n+k-1"}</InlineMath>, including windows with only a partial overlap with the original input. Both follow the same window-count formula.</Prose>

<Prose>Zero padding assumes an outside value of zero. Reflection, replication and circular padding impose different boundary conditions; choose them based on what the data means. A periodic signal can justify wrapping. An ordinary photograph does not automatically continue from its right edge to its left.</Prose>

<H3>{"Return to your conv2d: padding, stride and dilation"}</H3>

<Prose>The §2 function already contains the first two settings. <code>{"np.pad"}</code> adds a zero ring of width <code>{"padding"}</code> around every channel, <code>{"u * stride"}</code> places each window start, and <code>{"h_out"}</code> is the window-count formula above with <InlineMath>{"p_l=p_r"}</InlineMath> and dilation 1. Append this check to <code>{"conv2d_from_scratch.py"}</code>; it uses the same 5×5, 3×3, padding 1, stride 2 case as the 2-D figure, with three input channels and random values:</Prose>

<CodeBlock language={"python"} filename={"conv2d_from_scratch-geometry.py"} title={"Append to conv2d_from_scratch.py: check padding and stride"}>{"rng = np.random.default_rng(0)\nx, w, b = rng.normal(size=(3, 5, 5)), rng.normal(size=(2, 3, 3, 3)), rng.normal(size=2)\nours = conv2d(x, w, b, stride=2, padding=1)\nlibrary = F.conv2d(torch.tensor(x)[None], torch.tensor(w), torch.tensor(b), stride=2, padding=1)[0]\nprint(\"5x5 input, 3x3 kernel, stride 2, padding 1 -> shape\", ours.shape,\n      \"max difference\", float(np.abs(ours - library.numpy()).max()))\n"}</CodeBlock>

<CodeBlock language={"text"} kind={"output"} filename={"conv2d_from_scratch-geometry-output.txt"} title={"Output"}>{"5x5 input, 3x3 kernel, stride 2, padding 1 -> shape (2, 3, 3) max difference 4.440892098500626e-16"}</CodeBlock>

<Prose>The shape (2, 3, 3) is the figure's 3×3 output for each of two output channels, and <InlineMath>{"\\lfloor(5+2-3)/2\\rfloor+1=3"}</InlineMath>. The tiny difference is floating-point summation order, not a disagreement.</Prose>

<Prose><strong>Change the implementation:</strong> add a <code>{"dilation"}</code> argument that samples every <InlineMath>{"d"}</InlineMath>-th pixel inside the window, and check it against <code>{"F.conv2d(..., dilation=2)"}</code> on a 7×7 input.</Prose>

<details><summary>Hint and solution</summary><Prose>The window spans <InlineMath>{"k_{\\rm eff}=d(k-1)+1"}</InlineMath> pixels, so compute <code>{"h_out = (x.shape[1] - (dilation*(k_h-1)+1)) // stride + 1"}</code> (and likewise for width), then cut the patch with a step: <code>{"x[:, top:top + dilation*(k_h-1)+1:dilation, left:left + dilation*(k_w-1)+1:dilation]"}</code>. The patch still has shape <InlineMath>{"[C_{\\rm in},k_h,k_w]"}</InlineMath>, so the <code>{"tensordot"}</code> line is unchanged. A 7×7 input with a 3×3 kernel, dilation 2, stride 1 and no padding gives 3×3 outputs. Success means <code>{"np.allclose"}</code> is true for several random inputs, not just one.</Prose></details>

<Prose>Geometry also decides how far information travels when layers are stacked. Two stride-one 3×3 layers let one output depend on a five-wide input region, and three reach seven; §6 draws this. Because a nonlinearity sits between them, the stack is a different function family from a single 5×5 linear filter; whether it also has fewer parameters depends on the channel counts being compared.</Prose>

<H2>{"5. Pooling: summarize, then notice what disappeared"}</H2>

<Prose>After a convolution, neighbouring map values often say nearly the same thing. <strong>Pooling</strong> shrinks a map by replacing each small window with one summary number. The figure pools one 4×4 channel with 2×2 windows and stride 2; because each window starts two cells after the last, the four windows do not overlap:</Prose>

<PoolingWindowsFigure />

<Prose>Each cell's small letter names its window, A to D, and the output cell with the same letter summarizes that window. <strong>Max pooling</strong> keeps the largest value, marked “max” with a double underline; <strong>average pooling</strong> keeps the mean. Window A holds 1, 3, 4 and 2: max 4, average 2.5. Pooling uses the same window-and-stride geometry as §4 but has no weights to learn, and it works on each channel separately, so the channel count stays the same while height and width halve.</Prose>

<Prose>Max pooling asks for the strongest response in the window; average pooling asks for its mean level. Neither is universally better, and both lose information. Max keeps window A's 4 and forgets where it was; the other three values could change, up to 4, without changing the output. Average keeps every value's contribution but blends them. Many different windows share the same maximum or mean. A decoder may learn a plausible reconstruction using other evidence, but that does not make pooling invertible.</Prose>

<Prose>How does a gradient pass back through pooling? Use one dimension: size-2 windows with stride 1 on three values, so the two windows overlap at the middle value. The lab shows both pooling rules side by side:</Prose>

<PoolingRoutesLab />

<Prose>With inputs [1, 4, 3], both max-pool outputs are 4, and the gradient of their sum is <InlineMath>{"[0,2,0]"}</InlineMath>: the middle value wins both windows, so it receives both routes, and the losers receive nothing. Average pooling instead splits each window's gradient equally, giving <InlineMath>{"[0.5,1,0.5]"}</InlineMath>. At a tie the mathematical maximum has several valid subgradients and the implementation chooses an index. Our CPU fixture on <InlineMath>{"[2,2,1]"}</InlineMath> yields gradient <InlineMath>{"[1,1,0]"}</InlineMath>; do not build an argument that depends on a universal tie winner across backends.</Prose>

<Prose>Padding needs care with negative values. Max-pool padding behaves like negative infinity, so an invented zero cannot beat a real negative input. Average pooling can include or exclude padded zeros from the denominator. With <InlineMath>{"[-2,-3]"}</InlineMath>, kernel three and one padded cell on each side, the two averages are both <InlineMath>{"-5/3"}</InlineMath> when padding counts, versus <InlineMath>{"-5/2"}</InlineMath> when it does not. These policies change numbers despite matching output shapes. <a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.MaxPool2d.html"}>{"MaxPool2d"}</a>, <a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.AvgPool2d.html"}>{"AvgPool2d"}</a>.</Prose>

<Prose><strong>Adaptive average pooling</strong> specifies the output size instead of a fixed stride, and computes each bin's boundaries from it. The figure averages the fixed input [1, 2, 3, 4, 5] into a chosen number of bins; each row is one bin, and its fractions show how much each input contributes to that bin's mean:</Prose>

<AdaptivePoolingBinsLab />

<Prose>For three bins the boundaries are <InlineMath>{"[0,2)"}</InlineMath>, <InlineMath>{"[1,4)"}</InlineMath>, <InlineMath>{"[3,5)"}</InlineMath>, giving means <InlineMath>{"[1.5,3,4.5]"}</InlineMath>. Indices 1 and 3 each belong to two bins, so for a sum of the three outputs their gradients collect two shares: the input gradient is <InlineMath>{"[1/2,5/6,1/3,5/6,1/2]"}</InlineMath>. Bins can overlap; “adaptive” does not mean an exact, equal, disjoint partition for every size. With more bins than inputs, bins repeat values: this is averaging existing values, not interpolating a new signal. <a href={"https://github.com/pytorch/pytorch/blob/v2.14.0/aten/src/ATen/native/AdaptivePooling.h"}>{"PyTorch's bin-boundary implementation"}</a>.</Prose>

<Prose><strong>Global average pooling</strong> averages an entire spatial map into one value per channel. It lets a classifier head receive the same number of features at different spatial sizes. It discards location in that final map, which can be useful or harmful depending on the task, and it does not make the earlier maps unaffected by cropping or shifting.</Prose>

<Prose>This connects to dropout: dropping responses before max pooling changes which value wins, and a sampled zero can exceed a negative activation. That is a particular noisy objective, not an algebraically forbidden ordering. Our comparison in §7 omits dropout so we can inspect the pooling choice clearly.</Prose>

<H2>{"6. Receptive fields: where can this number get information?"}</H2>

<Prose>A first-layer 3×3 output sees a 3×3 patch of pixels. A second-layer output sees a 3×3 block of first-layer outputs, and each of those saw its own patch. The <strong>receptive field</strong> of a value is the input region it can depend on, found by tracing those connections backwards. The figure stacks two 3×3, stride-1 layers without padding on a 7×7 input:</Prose>

<ReceptiveGrowthFigure />

<Prose>The traced layer-2 value (white outline, in the Layer 2 grid) reads a 3×3 block of layer 1 (violet). Each of those nine values reads its own 3×3 input patch, shifted by one pixel from its neighbour's; select a layer-1 cell to outline one of those patches. Together the patches cover a 5×5 input region (cyan): 3 + (3 − 1) = 5 pixels wide. A third layer would reach 7.</Prose>

<Prose>Counting by hand works for two layers. Real networks mix kernel sizes, strides, pooling and padding, and a stride-2 layer makes every later step reach twice as far in pixels. A small bookkeeping recurrence handles all of these. Track three values per spatial axis:</Prose>

<ul><li><InlineMath>{"r"}</InlineMath>: width of the theoretical bounding region in input coordinates.</li><li><InlineMath>{"j"}</InlineMath>, the <strong>jump</strong>: spacing between adjacent output centres, measured in input pixels.</li><li><InlineMath>{"a"}</InlineMath>: centre of the first output, with input pixel centres at <InlineMath>{"0.5,1.5,\\ldots"}</InlineMath>.</li></ul>

<Prose>Start with <InlineMath>{"r=1,j=1,a=0.5"}</InlineMath>. A layer with <InlineMath>{"k,d,s,p_l"}</InlineMath> changes them by:</Prose>

<div className="neural-equation"><MathBlock>{"r'=r+d(k-1)j,\\qquad j'=sj,\\qquad\na'=a+\\left(\\frac{d(k-1)}2-p_l\\right)j."}</MathBlock></div>

<Prose>The old <InlineMath>{"j"}</InlineMath> belongs on the right side of all three equations. A filter spans <InlineMath>{"d(k-1)"}</InlineMath> gaps on the previous grid, and each gap is already <InlineMath>{"j"}</InlineMath> input pixels wide: this adds <InlineMath>{"d(k-1)j"}</InlineMath> to the bounding width. Moving the filter by stride <InlineMath>{"s"}</InlineMath> moves its centre by <InlineMath>{"sj"}</InlineMath>. Padding shifts that first centre toward the boundary without changing the distance between centres. A pooling window expands the region too.</Prose>

<Prose>Check the recurrence on the figure above: two 3×3, stride-1 layers with no padding give <InlineMath>{"r=1\\to 1+2(1)=3\\to 3+2(1)=5"}</InlineMath>, with <InlineMath>{"j"}</InlineMath> staying 1, exactly the 5×5 region drawn. Insert a stride-2 pool between them and the second convolution's two gaps are each 2 pixels wide, so the field grows faster. For a 32-wide input and a small architecture:</Prose>

<NeuralTable caption={"Receptive-field bookkeeping for a 32-wide input"} headers={[<>{"Operation"}</>,<>{"Output width"}</>,<>{""}<InlineMath>{"r"}</InlineMath>{""}</>,<>{""}<InlineMath>{"j"}</InlineMath>{""}</>,<>{"First centre "}<InlineMath>{"a"}</InlineMath>{""}</>]} rows={[[<>{"3-wide convolution, pad 1"}</>,<>{"32"}</>,<>{"3"}</>,<>{"1"}</>,<>{"0.5"}</>],[<>{"2-wide pooling, stride 2"}</>,<>{"16"}</>,<>{"4"}</>,<>{"2"}</>,<>{"1"}</>],[<>{"3-wide convolution, pad 1"}</>,<>{"16"}</>,<>{"8"}</>,<>{"2"}</>,<>{"1"}</>],[<>{"2-wide pooling, stride 2"}</>,<>{"8"}</>,<>{"10"}</>,<>{"4"}</>,<>{"2"}</>],[<>{"3-wide convolution, pad 1"}</>,<>{"8"}</>,<>{"18"}</>,<>{"4"}</>,<>{"2"}</>],[<>{"Average over all 8 positions"}</>,<>{"1"}</>,<>{"46"}</>,<>{"4"}</>,<>{"16"}</>]]} />

<Prose>A bounding width counts coordinates, not pixels. To see which actual pixels lie inside one bounding interval, trace a single output back through the same layers; the outlined cells are the input pixels that reach it:</Prose>

<ReceptiveTraceLab />

<Prose>A width of 46 on a 32-wide input includes padded coordinates; it does not mean 46 observed pixels or wraparound. For output index <InlineMath>{"u"}</InlineMath>, the centre is <InlineMath>{"a+uj"}</InlineMath> and the bounding endpoints are that centre plus or minus <InlineMath>{"(r-1)/2"}</InlineMath>. Intersect that interval with the actual input coordinates to separate observed pixels from padding.</Prose>

<Prose>The region can also have holes. Two three-tap layers with dilation two reach only some of the offsets inside their bounding width:</Prose>

<DilationHolesLab />

<Prose>With dilations 2 and 2 the reachable offsets are <InlineMath>{"\\{-4,-2,0,2,4\\}"}</InlineMath>: bounding width nine, only five positions. Dilation one followed by two reaches all seven offsets from −3 to 3. A bounding width is not a count of connected pixels.</Prose>

<Prose>For residual additions or concatenated branches, take the union of contributing input regions. Equal tensor shapes do not prove equal spatial alignment: branches with different centre offsets may add features that refer to different image locations, as the asymmetric-padding ruler in §4 showed. The <a href={"https://distill.pub/2019/computing-receptive-fields/"}>{"receptive-field coordinate derivation"}</a> gives a useful deeper treatment of alignment.</Prose>

<H2>{"7. Build and inspect a real digit classifier"}</H2>

<Prose>Now assemble every piece into one classifier. Follow a single 8×8 digit through it, one operation at a time:</Prose>

<CnnPipelineFigure />

<Prose>Each part does one job you have now seen. The convolutions compute local weighted sums (§1–2); ReLU, <InlineMath>{"a=\\max(0,z)"}</InlineMath>, makes the stack nonlinear; pooling halves the spatial size (§5); and the final linear layer, an ordinary dense layer, turns the 64 remaining numbers into one score (logit) per digit. By the last 2×2 map, §6's recurrence gives a receptive field 10 positions wide (3, 4, 8, 10). Part of that span is padding: each final value can depend on 7 of the 8 pixel rows and 7 of the 8 columns, so together the four values cover the whole digit. The second convolution's weights have shape <InlineMath>{"[16,8,3,3]"}</InlineMath>, not <InlineMath>{"[16,1,3,3]"}</InlineMath>, because its input already has 8 channels. The program builds exactly this model:</Prose>

<CodeBlock language={"python"} filename={"convolution-experiments-DigitCNN-excerpt.py"} title={"Excerpt from convolution-experiments.py: the DigitCNN class"}>{"class DigitCNN(nn.Module):\n    def __init__(self,pooling=\"max\",global_average=False):\n        super().__init__()\n        self.conv1 = nn.Conv2d(1,8,3,padding=1)\n        self.conv2 = nn.Conv2d(8,16,3,padding=1)\n        self.pooling = pooling\n        self.global_average = global_average\n        self.head = nn.Linear(16 if global_average else 64,10)\n\n    def features(self,x):\n        pool = F.max_pool2d if self.pooling == \"max\" else F.avg_pool2d\n        first = F.relu(self.conv1(x))\n        second = F.relu(self.conv2(pool(first,2)))\n        final = pool(second,2)\n        return first,second,final\n\n    def forward(self,x):\n        final = self.features(x)[-1]\n        features = final.mean((2,3)) if self.global_average else final.flatten(1)\n        return self.head(features)"}</CodeBlock>

<Prose>Read it against the figure: <code>{"nn.Conv2d(1,8,3,padding=1)"}</code> is the first arrow (1 input channel, 8 kernels of size 3×3, padding 1 keeps 8×8); <code>{"pool(first,2)"}</code> is the first pooling arrow; <code>{"final.flatten(1)"}</code> keeps the batch axis and flattens 16 × 2 × 2 into 64. The <code>{"global_average"}</code> option replaces flattening with an average over the 2×2 positions, leaving 16 numbers; the experiment below compares it.</Prose>

<Prose>The data is a CSV file of 400 actual UCI optical-digit images, the same file the §1 edge maps came from: the first 40 examples of each digit from scikit-learn's 1,797-row copy of the historical UCI test partition. Values are integers from 0 to 16, divided by 16 using the documented measurement range. A fixed stratified split, seed 22, uses 280 rows to fit and 120 for development comparisons. This is a small educational split, not the official dataset evaluation or evidence about unseen writers. <a href={"/learn-code/convolution-pooling-receptive-fields/data-provenance.md"}>{"Data provenance"}</a>.</Prose>

<Prose>Our complete <a href={"/learn-code/convolution-pooling-receptive-fields/convolution-experiments.py"}>{"CPU experiment"}</a> includes the direct NumPy operation, tensor fixtures, twelve training runs and saved intermediate maps. Keep <a href={"/learn-code/convolution-pooling-receptive-fields/digits-400.csv"}>{"the attributed CSV"}</a> next to it. Setup from that folder, on Windows PowerShell:</Prose>

<CodeBlock language={"powershell"}>{"python -m venv .venv\n.\\.venv\\Scripts\\python.exe -m pip install numpy==2.3.5 scikit-learn==1.9.1 torch==2.14.0\n.\\.venv\\Scripts\\python.exe convolution-experiments.py"}</CodeBlock>

<Prose>On macOS/Linux, use <code>{"python3 -m venv .venv"}</code>, then replace each <code>{".\\.venv\\Scripts\\python.exe"}</code> above with <code>{".venv/bin/python"}</code>. Calling the environment's interpreter directly avoids depending on shell activation. The program needs no GPU, network-loaded model or unspecified image folder; installation needs network access, and afterwards the data and experiment run offline. The author executed it on Python 3.12.14, PyTorch 2.14.0+cpu, one CPU thread.</Prose>

<ConvolutionProgram file="convolution-experiments.py" title="Read the complete convolution and digit experiment program" />

<Prose>We compare four declared configurations: dense 64→32 tanh→10; CNN with max pooling; the same CNN with average pooling; and the max-pool CNN whose final 2×2 map is globally averaged before a smaller head. The max and average CNNs start with identical weights for each seed. The global-average model shares the initial convolution tensors but has a differently sized head; the dense baseline is a different architecture. All use Adam, learning rate 0.003, 400 full-batch updates, no augmentation, dropout or weight decay. Seeds 1, 2 and 3 were chosen in advance.</Prose>

<NeuralTable caption={"Development results after 400 updates (120 rows)"} headers={[<>{"Model"}</>,<>{"Parameters"}</>,<>{"Seed 1: CE / correct of 120"}</>,<>{"Seed 2"}</>,<>{"Seed 3"}</>]} rows={[[<>{"Dense baseline"}</>,<>{"2,410"}</>,<>{"0.07949 / 117"}</>,<>{"0.08647 / 118"}</>,<>{"0.09342 / 116"}</>],[<>{"CNN, max pooling"}</>,<>{"1,898"}</>,<>{"0.08332 / 118"}</>,<>{"0.10153 / 116"}</>,<>{"0.05194 / 119"}</>],[<>{"CNN, average pooling"}</>,<>{"1,898"}</>,<>{"0.10358 / 116"}</>,<>{"0.11126 / 118"}</>,<>{"0.13594 / 115"}</>],[<>{"CNN, global-average head"}</>,<>{"1,418"}</>,<>{"0.08249 / 117"}</>,<>{"0.13742 / 113"}</>,<>{"0.17901 / 113"}</>]]} />

<Prose>These are actual final-update measurements, and every run fits all 280 training labels. The CNN uses fewer parameters than this dense baseline, but it does not win every seed or metric. Accuracy counts and cross-entropy measure different things: a few confident mistakes can raise cross-entropy even with similar counts. Choose a model and seed below to see its loss at each saved checkpoint, against the dense baseline (dashed); switch the data to training to see each run fit its 280 training labels. The loss axis is logarithmic so the small late differences stay visible. These are the downloadable program's recorded results; nothing is trained in your browser:</Prose>

<RecordedRunsLab />

<Prose>The readout also reports a deliberately difficult stress check: each development image is shifted one pixel right or down, the exposed edge is filled with zeros, and the original label is kept. This tests a changed input condition; it can also clip meaningful strokes, so it is not a clean proof of translation behaviour on an unlimited canvas.</Prose>

<Prose>For seed 1, the dense model gets 57/120 right-shifted images correct and the max-pool CNN 72/120; their unshifted counts were 117 and 118. Down-shift counts are 71 and 75. Even the global-average CNN falls from 117 to 63 right-shifted. Weight sharing helps organize the model, but it does not remove the need to define and validate the variation a deployed model will meet.</Prose>

<Prose>Now look inside a saved model. The viewer below shows the max-pool CNN from the pipeline figure, seed 1, after 400 updates: a digit, one of its feature maps, a learned first-layer kernel and the local gradient of the predicted logit.</Prose>

<SavedMapsLab />

<Prose>The input digit is drawn as ink, like §1's handwritten 7, with each pixel's 0–16 count printed (the network itself reads the count divided by 16); the other grids follow §1's value-grid rule: amber positive, blue negative, every cell numbered. The viewer opens on first-layer channel 3, whose learned kernel is a horizontal-edge detector: its top two rows are positive apart from one near-zero weight (−0.04), and its bottom row is negative. Read the first-layer maps the way you read §1's hand-set edge maps, with one difference: they are saved after ReLU, so negative responses have become 0 and only the amber, positive side of each learned pattern remains. The learned kernel is the trained counterpart of §1's hand-set kernels. The gradient panel says how the predicted logit would change for a small change in each pixel of this exact image: a local sensitivity, not a causal explanation of the digit.</Prose>

<Prose><strong>Before changing the experiment</strong>, name the single change and the metric. An augmentation trial should transform training data only and assess the predeclared development views consistently. Once their outcomes guide choices, these rows remain development data; a final performance claim needs a separate untouched evaluation protocol.</Prose>

<H2>{"8. Optional: reach, influence and shifts"}</H2>

<Prose>§6's receptive field says which paths exist. An input gradient <InlineMath>{"\\partial z/\\partial x_{u,v}"}</InlineMath> says how much a particular output changes locally for a small change in one input, with the current parameters. The two can differ: a ReLU can close a route, and two contributions can cancel. A zero gradient does not erase an architectural connection.</Prose>

<Prose>How strongly does each input reach the centre when many paths exist? An exact linear example shows the pattern: repeatedly apply the averaging filter [1, 1, 1]/3, with no nonlinearities. The bars are each input offset's coefficient in the central output:</Prose>

<ConvolutionInfluenceLab />

<Prose>At depth two the central output's input weights are <InlineMath>{"[1,2,3,2,1]/9"}</InlineMath>: more paths reach central positions. The support width is <InlineMath>{"2L+1"}</InlineMath>, while the distribution's variance is <InlineMath>{"2L/3"}</InlineMath>: it behaves like a sum of <InlineMath>{"L"}</InlineMath> independent offsets chosen from −1, 0, 1. At depth 20 the support is 41 positions wide, but positions with at least 1% of the peak span only 21. That threshold is a chosen display rule, not a universal definition of an effective receptive field. Learned filters, input-dependent gates and averaging across examples change the profile. The <a href={"https://arxiv.org/pdf/1701.04128"}>{"effective receptive field paper"}</a> develops Gaussian-like behaviour under stated assumptions and empirical settings; it does not make every individual trained gradient a Gaussian, and a completely closed ReLU route should show “zero gradient” rather than a misleading normalized heatmap.</Prose>

<Prose>Next, distinguish <strong>equivariance</strong>, where shifting the input shifts the output map correspondingly, from <strong>invariance</strong>, where the output stays identical. Test equivariance on an impulse with the filter [1, 0, −1]: shift then filter, or filter then shift, and compare:</Prose>

<ShiftBoundaryLab />

<Prose>Stride-one correlation with circular boundaries commutes with circular shifts: the difference is zero. Switch the boundary to zeros outside, and the value that wrapped around is lost, giving a maximum difference of one.</Prose>

<Prose>Downsampling introduces a grid phase. Sampling every second element of <InlineMath>{"[1,-1,1,-1,1,-1]"}</InlineMath> gives <InlineMath>{"[1,1,1]"}</InlineMath>; shift the input one position first and it gives <InlineMath>{"[-1,-1,-1]"}</InlineMath>. Filtering with two weights before sampling changes this:</Prose>

<SamplingPhaseLab />

<Prose>At α = 1 the filter does nothing and the two phases disagree. At α = 0.5 each pair is averaged before sampling, and both phases give zeros. This is a simple illustration of aliasing and low-pass filtering, not a claim that blurring makes every classifier invariant.</Prose>

<Prose>Max pooling can tolerate some motion within a window, yet moving a response across a window boundary moves its pooled result. Global averaging is invariant to a permutation of an already-computed map, but input shifts need not produce only a permutation of that map. <a href={"https://proceedings.mlr.press/v97/zhang19a.html"}>{"Zhang's anti-aliasing study"}</a> investigates this distinction in trained networks.</Prose>

<H2>{"9. Optional: the reverse operation is a scatter, not an undo"}</H2>

<Prose>§3's filter maps three inputs to two outputs. Generative and segmentation models often need the opposite direction: from a small map back to a larger one. The natural candidate sends each output-side value <InlineMath>{"g_i"}</InlineMath> back along the same connections, scaled by the same weights, and adds wherever footprints meet:</Prose>

<ScatterLab />

<Prose>Written as a matrix, our one-dimensional filter is</Prose>

<div className="neural-equation"><MathBlock>{"C=\\begin{bmatrix}1&-1&0\\\\0&1&-1\\end{bmatrix},\\qquad y=Cx."}</MathBlock></div>

<Prose>Scattering and adding is exactly multiplication by the transpose <InlineMath>{"C^\\top"}</InlineMath>. It obeys <InlineMath>{"\\langle Cx,g\\rangle=\\langle x,C^\\top g\\rangle"}</InlineMath>: for <InlineMath>{"x=[1,3,2]"}</InlineMath> and <InlineMath>{"g=[2,-3]"}</InlineMath>, both sides are −7, and <InlineMath>{"C^\\top g=[2,-5,3]"}</InlineMath>. This is the same scatter-and-add that §3's input gradient performed.</Prose>

<Prose>But <InlineMath>{"C^\\top Cx=[-2,3,-1]"}</InlineMath>, not the original input. <strong>Transposed convolution</strong> is this structured transpose operation, not an inverse. A constant added to every element of <InlineMath>{"x"}</InlineMath> disappears under this difference filter, so exact recovery from its output alone is impossible.</Prose>

<Prose>With a stride, footprints can overlap unevenly. Three input ones scattered through an all-ones kernel with stride two give coverage counts:</Prose>

<CoverageLab />

<Prose>Kernel three with stride two produces coverage <InlineMath>{"[1,1,2,1,2,1,1]"}</InlineMath>; in two dimensions the uneven overlap multiplies into a checkerboard. A kernel divisible by the stride can equalize interior coverage, yet learned weights can still make artifacts. Resizing followed by an ordinary convolution offers a different constraint; it is not an unconditional artifact cure. <a href={"https://distill.pub/2016/deconv-checkerboard/"}>{"Visual explanation of checkerboard artifacts"}</a>.</Prose>

<Prose>For symmetric padding <InlineMath>{"p"}</InlineMath>, the transposed output size is</Prose>

<div className="neural-equation"><MathBlock>{"n_{\\rm out}=(n_{\\rm in}-1)s-2p+d(k-1)+{\\rm output\\_padding}+1."}</MathBlock></div>

<Prose>With kernel three, stride two and padding one, input lengths five and six both produce forward length three. The transpose formula starts at length five; <code>{"output_padding"}</code> zero chooses five and one chooses six. That extra argument selects a compatible output size; it does not append zero-valued cells, and it cannot recover information the forward operation lost. <a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.ConvTranspose2d.html"}>{"ConvTranspose2d"}</a>.</Prose>

<H2>{"10. Optional: implement the same math efficiently"}</H2>

<Prose>The retained program's <code>{"direct_conv2d"}</code> follows the nested sums explicitly, including groups, symmetric padding, stride and dilation. Five float64 cases compare it with PyTorch, including rectangular kernels and depthwise multiplier two, with maximum absolute discrepancy below <InlineMath>{"10^{-12}"}</InlineMath> in CPU float64 arithmetic.</Prose>

<Prose>An alternative turns the whole convolution into one matrix multiplication by copying each window into a column. For the §1 image:</Prose>

<ConvolutionPatchMatrixFigure />

<Prose>The first grid, “Unfolded”, is the column matrix</Prose>

<div className="neural-equation"><MathBlock>{"P=\\begin{bmatrix}\n1&2&0&1\\\\2&0&1&3\\\\0&1&2&1\\\\1&3&1&0\n\\end{bmatrix}."}</MathBlock></div>

<Prose>Each column is one window read row by row, so multiplying <InlineMath>{"[1,-1,0,1]P"}</InlineMath> yields <InlineMath>{"[0,5,0,-2]"}</InlineMath>, which reshapes to §1's 2×2 map. This is often called im2col. It exposes matrix multiplication, but explicitly copying overlapping patches can use substantial memory.</Prose>

<Prose>Folding those columns back adds the overlaps, as the second grid, “Fold overlap counts”, shows: the centre input appears four times, an edge-middle twice, a corner once. <code>{"Fold(Unfold(x))"}</code> therefore equals that overlap-count grid times <code>{"x"}</code>. Dividing by the grid recovers covered positions; an uncovered position with count zero cannot be recovered this way. <a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Fold.html"}>{"Fold contract"}</a>.</Prose>

<Prose>Implicit matrix-multiplication algorithms generate patch addresses without materializing the whole expanded matrix. Transform methods such as FFT or Winograd change how the arithmetic is organized. Shape, datatype, hardware and workspace constraints affect the useful choice. These are implementation strategies for the operator, not new learned representations. <a href={"https://docs.nvidia.com/deeplearning/performance/dl-performance-convolutional/index.html"}>{"NVIDIA convolution algorithm guide, sections 3–4.2"}</a>.</Prose>

<Prose>For groups <InlineMath>{"g"}</InlineMath>, a <InlineMath>{"k_h\\times k_w"}</InlineMath> layer has</Prose>

<div className="neural-equation"><MathBlock>{"C_{\\rm out}(C_{\\rm in}/g)k_hk_w"}</MathBlock></div>

<Prose>weights, plus <InlineMath>{"C_{\\rm out}"}</InlineMath> biases if used. Forward multiply-accumulates (MACs) per example are that weight count times <InlineMath>{"H_{\\rm out}W_{\\rm out}"}</InlineMath>. If counting one multiplication and addition separately, use two FLOPs per MAC, state that convention, and account for other operators separately.</Prose>

<Prose>Our first convolution has 72 weights, 80 parameters including biases, and <InlineMath>{"8\\cdot8\\cdot72=4{,}608"}</InlineMath> MACs. The second has 1,152 weights, 1,168 parameters and <InlineMath>{"4\\cdot4\\cdot1{,}152=18{,}432"}</InlineMath> MACs. The head adds 650 parameters and 640 MACs: in total 1,898 parameters and 23,680 MACs for these affine operations, with additional work in pooling and activations. The dense baseline has 2,368 MACs despite more parameters. A parameter comparison is not a latency comparison.</Prose>

<Prose>A 3×3 depthwise-plus-pointwise pair with multiplier one uses <InlineMath>{"9C_{\\rm in}+C_{\\rm in}C_{\\rm out}"}</InlineMath> weights, versus <InlineMath>{"9C_{\\rm in}C_{\\rm out}"}</InlineMath> for a dense 3×3 layer. The dense-to-separable weight ratio is <InlineMath>{"9C_{\\rm out}/(9+C_{\\rm out})"}</InlineMath>, before biases. It also constrains the computation differently; fewer arithmetic operations do not guarantee proportional wall-clock savings.</Prose>

<Prose>Memory format is another independent choice. PyTorch channels-last storage can preserve the logical <InlineMath>{"[N,C,H,W]"}</InlineMath> shape while changing strides in memory. It is not the same operation as permuting the tensor's logical axes. <a href={"https://docs.pytorch.org/tutorials/intermediate/memory_format_tutorial.html"}>{"Channels-last tutorial"}</a>.</Prose>

<Prose>An evaluation-mode convolution followed by BatchNorm with fixed running statistics can be combined into one convolution. Here is one output channel computed both ways:</Prose>

<BatchNormFoldingFigure />

<Prose>In general, for output channel <InlineMath>{"o"}</InlineMath>, set</Prose>

<div className="neural-equation"><MathBlock>{"\\alpha_o=\\frac{\\gamma_o}{\\sqrt{v_o+\\epsilon}},\\qquad\nW'_o=\\alpha_o W_o,\\qquad b'_o=\\beta_o+\\alpha_o(b_o-\\mu_o)."}</MathBlock></div>

<Prose>The scale multiplies every tap for that output channel; a negative <InlineMath>{"\\gamma_o"}</InlineMath> would also reverse their signs. The <a href={"https://docs.pytorch.org/tutorials/intermediate/torch_compile_conv_bn_fuser.html"}>{"PyTorch folding tutorial"}</a> shows the corresponding weight and bias transformation, and our float64 fixture matches within <InlineMath>{"3.4\\times10^{-16}"}</InlineMath>. Training-mode BatchNorm depends on the current batch, so this fixed folding does not apply there. ReLU remains nonlinear even if a backend executes it in the same kernel. Memory layout changes, algebraic folding and actual kernel fusion should be evaluated separately when performance becomes the task.</Prose>

<Prose>One useful connection goes beyond recognizing images. A fixed grid stencil <InlineMath>{"\\begin{bmatrix}0&1&0\\\\1&-4&1\\\\0&1&0\\end{bmatrix}"}</InlineMath> computes a discrete Laplacian numerator. With centre temperature 30 and four neighbours at 20, it gives −40: local curvature toward cooler surroundings. For grid spacing <InlineMath>{"h"}</InlineMath>, divide by <InlineMath>{"h^2"}</InlineMath>; a diffusion equation also needs diffusivity, a time discretization and boundary conditions. This is the same local weighted-sum mechanism, but the weights represent a specified numerical operator rather than parameters learned from labels.</Prose>

<H2>{"Implement the pullback and batch the arithmetic"}</H2>

<Prose>{""}<strong>{"Optional deeper branch."}</strong>{" The direct "}<code>{"direct_conv2d"}</code>{" routine in "}<a href={"/learn-code/convolution-pooling-receptive-fields/convolution-experiments.py"}>{"convolution-experiments.py"}</a>{" is a transparent indexing oracle: every output, input group and tap is visible. Its scalar Python loops are not the final recommendation for processing images. The companion "}<a href={"/learn-code/convolution-pooling-receptive-fields/convolution_pullbacks.py"}>{"convolution_pullbacks.py"}</a>{" retains the spatial-tap loops but performs all examples, channels and output locations together using "}<code>{"einsum"}</code>{". This opens the operation without allocating a full expanded patch matrix."}</Prose>

<Prose>{"For valid dense NCHW cross-correlation, one tap contributes "}<code>{"images[:, :, row:row+OH, col:col+OW]"}</code>{" contracted with "}<code>{"weights[:, :, row, col]"}</code>{". The forward contraction is "}<code>{"bihw,oi->bohw"}</code>{". Given upstream derivative "}<code>{"bohw"}</code>{", the weight gradient contracts "}<code>{"bohw,bihw->oi"}</code>{"; the input gradient contracts "}<code>{"bohw,oi->bihw"}</code>{" and "}<strong>{"adds"}</strong>{" it into the corresponding input slice. Overlapping windows write to the same input, so assignment would lose contributions. Bias gradients sum batch and spatial axes."}</Prose>

<Prose>{"The complete program contains all forward/backward functions and a same-input "}<code>{"F.conv2d"}</code>{" comparison for every derivative. It has the deliberately stated boundary of dense, stride-one, unpadded valid convolution; the earlier general routine still owns grouped, dilated and strided address calculation. Extending this pullback means applying exactly those same addresses in reverse. Autograd can perform that composition in the real classifier, so there is no need to reimplement its engine."}</Prose>

<Prose>{"For N examples, I input channels, O outputs, K spatial taps and P output positions, the arithmetic is O(NIOKP), with activation/parameter/output storage plus a tap-sized contraction temporary; there is no explicit O(NIKP) im2col buffer. The maintained backend can use different kernels and layouts."}</Prose>

<Prose>{"The same companion implements valid one-dimensional max/average pooling and their pullbacks. "}<code>{"sliding_window_view"}</code>{" exposes windows without copying each one. Maximum routing saves the first maximizing index per window; average routing distributes an upstream value over the window. "}<code>{"np.add.at"}</code>{" accumulates when maxima or average windows share an input. This is the implementation of the overlap diagrams, not an import of an opaque pooling operation. The script checks both with native PyTorch pooling. Padding, adaptive-window geometry and two-dimensional indexing follow the explicit conventions taught earlier; the real model continues to use native pooling."}</Prose>

<Prose>{"Run "}<code>{"python convolution_pullbacks.py"}</code>{" with NumPy and PyTorch. The declared result is equality within float64 tolerances, not a new accuracy measurement. These code paths are separate from the saved digit fits."}</Prose>

<ConvolutionProgram file="convolution_pullbacks.py" title="Read the complete vectorized convolution and pooling pullbacks" />

<Prose>{""}<strong>{"Change the implementation:"}</strong>{" replace the upstream all-ones pooling vector by "}<code>{"[2,−1,3]"}</code>{" for values "}<code>{"[1,4,3,2,−1]"}</code>{", size 3, stride 1. Then extend the convolution pullback to stride 2 by using the original forward sampling slice in both directions."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Max pooling sends each upstream value to one saved winner; mean pooling sends one third to each covered value. A stride changes selected input addresses, not the summation rule."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"The max winners are input indices 1, 1, 2, so the derivative is "}<code>{"[0,1,3,0,0]"}</code>{". Mean pooling gives "}<code>{"[2/3,1/3,4/3,2/3,1]"}</code>{". For strided convolution select "}<code>{"row:row+stride*OH:stride"}</code>{" and its analogous column slice; accumulate the input derivative into that same strided slice. Match forward, input, weight and bias derivatives to "}<code>{"F.conv2d(..., stride=2)"}</code>{" on a rectangular image. Equality of outputs alone does not catch a mistaken overlapping scatter."}</Prose>

</details>

<H3>{"Adaptive pooling without a hidden implementation"}</H3>

<Prose>{"The same program implements "}<code>{"adaptive_average1d"}</code>{" and its explicit pullback. For output bin "}<code>{"i"}</code>{", use "}<code>{"start = floor(i*n/m)"}</code>{" and "}<code>{"end = ceil((i+1)*n/m)"}</code>{", then average the half-open input range "}<code>{"[start, end)"}</code>{". These bins can overlap; they are not necessarily a disjoint partition. A prefix sum makes each bin sum a subtraction, for O(n+m) time and storage. The pullback adds "}<code>{"upstream[i] / (end-start)"}</code>{" to every member of that bin; a range-add difference array accumulates this in O(n+m), including overlapping bins. Prefix subtraction can lose relative precision when subtracting two large, almost equal cumulative sums; this float64 teaching implementation is not a guarantee of identical summation error to a native kernel."}</Prose>

<Prose>{"The program compares values and input gradients with "}<code>{"torch.nn.functional.adaptive_avg_pool1d"}</code>{" for 5→3, 3→5 and global 5→1 pooling. The upsampling-shaped case is intentional: adaptive average pooling can create overlapping repeated bins even though no interpolation rule is being applied. "}<strong>{"Changed-input task:"}</strong>{" pool "}<code>{"[1, 2, 3, 4, 5]"}</code>{" into three bins with output cotangent "}<code>{"[1, 2, 3]"}</code>{". The bins are "}<code>{"[0,2)"}</code>{", "}<code>{"[1,4)"}</code>{" and "}<code>{"[3,5)"}</code>{", giving values "}<code>{"[1.5, 3, 4.5]"}</code>{" and input gradient "}<code>{"[1/2, 7/6, 2/3, 13/6, 3/2]"}</code>{". Verify the middle inputs collect all their participating bins, then extend the same construction along both axes for adaptive 2-D average pooling."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"11. Practice: construct, diagnose, transfer"}</H2>

<Prose>{"Try the questions before opening the solutions. A correct number without explaining which cells and parameters participated is incomplete. To check a numeric answer, run it through the §2 conv2d program with your own image and kernel."}</Prose>

<ol start={1}><li>{""}<strong>{"Changed filter."}</strong>{" On the first 3×3 image, replace the filter by "}<InlineMath>{"\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix}"}</InlineMath>{". Calculate all outputs. Then increase only the central pixel from 1 to 2 and identify every changed output."}</li><li>{""}<strong>{"Mix channels."}</strong>{" Two input channels have single-cell values 2 and 3. Build two output channels with a 1×1 convolution: first equals their sum, second equals their difference. Supply the complete weight and bias arrays. Which output changes if only channel two increases by one?"}</li><li>{""}<strong>{"Two channels by hand, then plan a layer."}</strong>{" In the §2 channel figure, raise channel 1's centre pixel from 0 to 2. Which cells of output channels A and B change, and to what? Then a layer takes a 3-channel 32×32 image to 4 channels with 5×5 kernels, padding 2, stride 1. Give the weight and bias shapes, the parameter count, the output shape and the multiply-accumulates per image."}</li><li>{""}<strong>{"A shape is not a coordinate."}</strong>{" Input width 10, kernel four, stride one, dilation one. Choose padding that preserves width. Give both asymmetric choices nearest to symmetry and their first output centers. Explain why equal-sized branches may still be misaligned."}</li><li>{""}<strong>{"Pooling ambiguity."}</strong>{" Give two different 2×2 windows with max four and average two. Can their pooled outputs reconstruct the original window? Then calculate the gradient of the sum of stride-one, size-two max pools on "}<InlineMath>{"[3,1,4]"}</InlineMath>{"."}</li><li>{""}<strong>{"A new receptive field."}</strong>{" Start with a 20-wide input. Apply kernel three/stride two/pad one, then kernel three/dilation two/stride one/pad two. Find output width, "}<InlineMath>{"r,j,a"}</InlineMath>{". Does a bounding width alone establish that all enclosed coordinates connect?"}</li><li>{""}<strong>{"Experiment diagnosis."}</strong>{" A model changes from 118 correct and CE 0.08 to 118 correct and CE 0.16. A colleague says nothing changed because accuracy is identical. Explain what else to inspect. Propose one controlled training change to investigate the observed shift failures, including what data can inform selection."}</li><li>{""}<strong>{"Optional adjoint problem."}</strong>{" Use "}<InlineMath>{"C"}</InlineMath>{" above and output-side values "}<InlineMath>{"[1,1]"}</InlineMath>{". Compute "}<InlineMath>{"C^\\top[1,1]"}</InlineMath>{", and name two distinct inputs with the same forward output."}</li><li>{""}<strong>{"Optional cost problem."}</strong>{" For 16 input and 32 output channels, compare weights in a dense 3×3 convolution with multiplier-one depthwise 3×3 followed by pointwise 1×1. Explain what measurement is still missing before claiming a speedup."}</li></ol>

<details><summary>Hints</summary>

<ol start={1}><li>{"Name each window by its top-left coordinate; a pixel can occupy different filter positions. 2. Each output has its own row of input-channel weights. 3. The centre pixel sits under a different kernel tap in each window; find the windows whose slice has a nonzero weight at that tap. For the layer, the weight's axes are output channel, input channel, height, width. 4. Total padding must equal "}<InlineMath>{"k-1"}</InlineMath>{"; use the center recurrence. 5. A window's sum must be eight. Overlapping gradients add. 6. Update "}<InlineMath>{"r"}</InlineMath>{" using the jump from before the layer. 7. CE depends on confidence in the true label, not just the largest logit. 8. Think about the difference filter acting on a constant. 9. Count separately before dividing; do not equate arithmetic and elapsed time."}</li></ol>

</details>

<details><summary>Worked solutions</summary>

<ol start={1}><li>{"Outputs are "}<InlineMath>{"\\begin{bmatrix}0&-1\\\\-1&1\\end{bmatrix}"}</InlineMath>{". After editing the center, they become "}<InlineMath>{"\\begin{bmatrix}-1&-1\\\\-1&2\\end{bmatrix}"}</InlineMath>{". The other windows contain that pixel but multiply it by a zero coefficient, so they stay unchanged."}</li><li>{"Weights, in output/input/spatial order, are "}<InlineMath>{"[[[[1]],[[1]]],[[[1]],[[-1]]]]"}</InlineMath>{", biases "}<InlineMath>{"[0,0]"}</InlineMath>{". Outputs are "}<InlineMath>{"[5,-1]"}</InlineMath>{". Changing the second input to four gives "}<InlineMath>{"[6,-2]"}</InlineMath>{": both change, in opposite directions."}</li><li>{"Output A's slice for channel 1 is "}<InlineMath>{"\\begin{bmatrix}0&1\\\\1&0\\end{bmatrix}"}</InlineMath>{", so window (u, v) reads channel-1 pixels (u, v+1) and (u+1, v). The centre (1, 1) is one of those only for windows (1, 0) and (0, 1), each with weight 1, so those outputs rise by 2: A becomes "}<InlineMath>{"\\begin{bmatrix}4&9\\\\4&1\\end{bmatrix}"}</InlineMath>{". B's channel-1 slice reads (u+1, v) and (u+1, v+1), which include the centre for windows (0, 1) and (0, 0): B becomes "}<InlineMath>{"\\begin{bmatrix}5&5\\\\2&2\\end{bmatrix}"}</InlineMath>{". Windows whose slice puts a zero on the centre are unchanged. For the layer: weight [4, 3, 5, 5], bias [4], so 4·3·25 + 4 = 304 parameters; output [4, 32, 32] because (32 + 4 − 5)/1 + 1 = 32; multiply-accumulates 32·32·300 = 307,200 per image."}</li><li>{"Padding "}<InlineMath>{"(1,2)"}</InlineMath>{" gives first center 1; "}<InlineMath>{"(2,1)"}</InlineMath>{" gives center 0, using input centers "}<InlineMath>{"0.5,1.5,\\ldots"}</InlineMath>{". Both output widths are ten. Their center grids differ by one input pixel, so elementwise addition would combine different locations."}</li><li>{"Examples are "}<InlineMath>{"\\begin{bmatrix}4&2\\\\1&1\\end{bmatrix}"}</InlineMath>{" and "}<InlineMath>{"\\begin{bmatrix}4&0\\\\2&2\\end{bmatrix}"}</InlineMath>{". Both summaries match although the windows differ. The one-dimensional max outputs are "}<InlineMath>{"[3,4]"}</InlineMath>{"; gradient is "}<InlineMath>{"[1,0,1]"}</InlineMath>{"."}</li><li>{"First layer produces width ten, "}<InlineMath>{"r=3,j=2,a=0.5"}</InlineMath>{". Second preserves width ten and produces "}<InlineMath>{"r=11,j=2,a=0.5"}</InlineMath>{". Bounding widths alone are insufficient in general. Here the first layer's contiguous offsets plus the second layer's spaced offsets reach "}<InlineMath>{"\\{-5,-4,-3,-1,0,1,3,4,5\\}"}</InlineMath>{", leaving holes at −2 and 2 before boundary clipping."}</li><li>{"Inspect per-row true-class probabilities, especially incorrect and nearly tied examples; equal accuracy can hide worse confidence. One controlled trial adds small label-preserving translations to training images while keeping architecture, seed protocol and learning budget fixed. Inspect whether crops remain interpretable, then compare the same declared development conditions. These comparisons cannot be relabeled as untouched final-test evidence."}</li><li>{"The transpose result is "}<InlineMath>{"[1,0,-1]"}</InlineMath>{". Inputs "}<InlineMath>{"[1,3,2]"}</InlineMath>{" and "}<InlineMath>{"[2,4,3]"}</InlineMath>{" both produce "}<InlineMath>{"[-2,1]"}</InlineMath>{", because adding a constant leaves adjacent differences unchanged."}</li><li>{"Dense: "}<InlineMath>{"9(16)(32)=4,608"}</InlineMath>{" weights. Separable: "}<InlineMath>{"9(16)+16(32)=656"}</InlineMath>{", a ratio of about 7.02, excluding biases. Actual latency needs measurement for the target input/output sizes, batch, dtype, layout, backend, device and memory behavior; predictive quality also needs validation."}</li></ol>

</details>

<Prose>{"Core readiness means you can trace one output and update, implement a layer and match it to nn.Conv2d, connect channels correctly, plan spatial sizes and input regions, explain information lost by pooling, and interpret the controlled digit comparison. The optional questions extend that understanding; they are not a hidden requirement to begin the next lesson."}</Prose>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet?module=deep-learning-fundamentals"}>{"Landmark Architectures: LeNet through EfficientNet"}</a>{". It will use these operators to explain architectural choices. Depthwise/dilated designs follow that topic; the route does not skip over an unprepared lesson."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"References and other ways to learn"}</H2>

<ul><li>{""}<a href={"https://cs231n.github.io/convolutional-networks/"}>{"Stanford CS231n notes: Convolutional Networks"}</a>{": a text route with a live demo of a 5×5×3 input, two 3×3×3 filters, stride 2 and padding 1, showing each output as a highlighted patch times a filter plus bias. Read it after §2 for the depth-column picture of local-but-full-depth connectivity and the layer-pattern summary INPUT → [CONV → RELU → POOL] → FC. Some of its architecture recommendations are historical rather than current practice."}</li><li>{""}<a href={"https://d2l.ai/chapter_convolutional-neural-networks/index.html"}>{"Dive into Deep Learning, chapter 7"}</a>{": sections 7.2 and 7.4 give shaded worked grids for single- and multi-channel cross-correlation and a small learned edge kernel; sections 7.3 and 7.5 cover padding, stride and pooling. Its code is runnable in PyTorch and is a good second set of worked numbers."}</li><li>{""}<a href={"https://arxiv.org/pdf/1603.07285"}>{"Dumoulin and Visin, A Guide to Convolution Arithmetic for Deep Learning"}</a>{", v2: a visual reference for padding, stride and transposed operations. Use sections 2–3 after the geometry ruler, section 4 after the scatter example. Its operator arithmetic is durable; library-specific policies are checked separately here."}</li><li>{""}<a href={"https://www.youtube.com/watch?v=bNb2fEVKeEo"}>{"Stanford CS231n, Lecture 5: Convolutional Neural Networks"}</a>{": an alternate spoken introduction to convolution, pooling and the transition from dense layers. The official 2017 syllabus and video description were checked; the full video was not watched for this draft. Historical architecture examples are context, not current performance recommendations."}</li><li>{""}<a href={"https://distill.pub/2019/computing-receptive-fields/"}>{"Araujo, Norris and Sim, Computing Receptive Fields"}</a>{": interactive coordinate and multi-path diagrams, useful after calculating "}<InlineMath>{"r,j,a"}</InlineMath>{". Historical model comparisons do not prove that increasing receptive field alone causes better accuracy."}</li><li>{""}<a href={"https://arxiv.org/pdf/1701.04128"}>{"Luo and colleagues, Understanding the Effective Receptive Field"}</a>{": the advanced analytical and empirical source for distinguishing possible reach from concentration of input gradients. Read the assumptions before generalizing its profile shapes."}</li><li>{""}<a href={"https://distill.pub/2016/deconv-checkerboard/"}>{"Odena, Dumoulin and Olah, Deconvolution and Checkerboard Artifacts"}</a>{": an especially useful visual alternate route through overlap patterns and decoder choices."}</li><li>{""}<a href={"https://proceedings.mlr.press/v97/zhang19a.html"}>{"Zhang, Making Convolutional Networks Shift-Invariant Again"}</a>{": primary research motivating anti-aliasing around downsampling. The abstract was reviewed; the specific experiment results here come from our retained calculation and digit program."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Conv2d.html"}>{"PyTorch 2.14 Conv2d"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.MaxPool2d.html"}>{"MaxPool2d"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.AvgPool2d.html"}>{"AvgPool2d"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.ConvTranspose2d.html"}>{"ConvTranspose2d"}</a>{", and "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Fold.html"}>{"Fold"}</a>{": exact API policies, especially groups, padding, pooling denominators and overlap accumulation."}</li><li>{""}<a href={"https://docs.pytorch.org/tutorials/intermediate/memory_format_tutorial.html"}>{"Channels-last tutorial"}</a>{" and "}<a href={"https://docs.nvidia.com/deeplearning/performance/dl-performance-convolutional/index.html"}>{"NVIDIA convolution guide"}</a>{": optional engineering references for storage and algorithm choices. The NVIDIA examples include older device/software benchmarks; no timings from them are presented as our measurements."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"UCI Optical Recognition of Handwritten Digits"}</a>{": original data source, authors and license. Our subset, source IDs and exact split are documented in the adjacent provenance file."}</li></ul></section>
  </div>,
};
