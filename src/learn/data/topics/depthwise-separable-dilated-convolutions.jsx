// Reading-flow revision 5. Edit this production lesson directly; the earlier manuscript and generator are preserved historical inputs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { DenseChannelFigure, GradientRouteFigure, DilationIntervalFigure, ExpansionSignFigure, HardSwishFigure, DigitPipelineFigure } from '../../components/lesson-labs/DepthwiseFlowFigures.jsx';
import { TensorAnatomyFigure, GroupWiringFigure, ChannelShuffleFigure, DilatedKernelsFigure, GriddingFigure, BlockShapesFigure, OutputStrideFigure, AsppBranchesFigure, AsppFootprintFigure, SvdMatrixFigure, SvdSpectrumFigure } from '../../components/lesson-labs/DepthwiseDrawings.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import { DepthwiseChannelLab, DepthwiseGradientLab, DepthwiseBoundaryLab, DepthwiseRankLab, DepthwiseStencilLab, DepthwiseCoverageLab, DepthwiseContextLab, DepthwiseDigitLab, DepthwiseProgram, DepthwiseSupportingFigure } from '../../components/lesson-labs/DepthwiseConvolutionLabs.jsx';
export default {
  title: 'Depthwise Separable & Dilated Convolutions',
  readTime: '~65 min read + experiments and practice',
  hasIntegratedGuide: true,
  content: () => <div className="neural-lesson depthwise-lesson lesson-flow"><LessonIntro prerequisites="Weighted sums and the preceding convolution lesson; spatial and channel axes, rank and receptive-field units are refreshed locally." sections={[["1-separate-the-spatial-and-channel-questions","1. Separate the spatial and channel questions"],["2-what-is-saved-and-what-is-restricted","2. What is saved—and what is restricted?"],["3-dilation-changes-positions-not-the-number-of-learned-taps","3. Dilation changes positions, not the number of learned taps"],["4-implement-the-operator-you-actually-mean","4. Implement the operator you actually mean"],["5-put-the-two-mechanisms-into-useful-architectures","5. Put the two mechanisms into useful architectures"],["6-a-real-experiment-compress-a-trained-layer-then-inspect-the-damage","6. A real experiment: compress a trained layer, then inspect the damage"],["build-on-the-convolution-code-then-write-the-factorization","Build on the convolution code, then write the factorization"],["7-diagnose-before-adding-another-architectural-feature","7. Diagnose before adding another architectural feature"],["8-practice-on-changed-problems","8. Practice on changed problems"],["9-readiness-and-the-next-design-question","9. Readiness and the next design question"]]}>Separate spatial filtering, channel mixing and sampling reach; inspect their costs and an actual compressed model.</LessonIntro>
<Prose opening="exploration">Every drawing labels its own parts. As in the rest of the module, cyan marks supplied inputs, amber learned weights, violet computed values and orange backward sensitivities, and a thick white outline marks the entry being traced. Each investigation sits directly under the picture it changes.</Prose>

<Prose>{"A convolution usually answers two questions at once: "}<strong>{"what pattern appears nearby, and how should evidence from different channels be combined?"}</strong>{" A depthwise separable layer separates those jobs. A dilated layer changes a different choice: "}<strong>{"how far apart should the sampled positions be?"}</strong>{""}</Prose>

<Prose>{"These choices matter when a camera model must fit a device budget, when a segmentation model needs both local boundaries and distant context, or when you want to understand why a seemingly cheaper replacement changes predictions. The previous "}<a href={"/learn/path/full-curriculum/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet?module=deep-learning-fundamentals"}>{"Landmark Architectures lesson"}</a>{" compared complete CNN designs. Here we open two of their building blocks and follow the actual numbers."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" read sections 1–7 in order, following the operators into mobile models and segmentation, then a practical compression experiment and diagnosis. Attempt practice 1–5 and 8–10 next. The rank proof, gradient derivation and interval-coverage argument deepen the explanation; you can return to them without delaying the basic investigations. You need weighted sums and the idea that training changes weights to reduce a loss. Shapes, channel mixing and sampling geometry are refreshed here."}</Prose>

<H2>{"1. Separate the spatial and channel questions"}</H2>

<Prose>{"Zoom into one convolution: what does one output read, and which part of that work can be shared? Recall from Convolution, Pooling & Receptive Fields that a channel is a whole spatial map. RGB has three supplied color maps; a hidden layer has learned response maps. In PyTorch a batch has axes N × C × H × W: images, channels, rows and columns."}</Prose>

<Prose>{"Start with the full picture: two input channels, A and B, each a 5 × 5 map, and two output channels. In a standard convolution, each output channel owns one 3 × 3 kernel slice for every input channel. Follow the drawing from left to right:"}</Prose>

<TensorAnatomyFigure kind="standard" />

<Prose>{"The white outline marks the same 3 × 3 window in both channels, and each window is wired to both kernels. Output channel 0’s kernel multiplies window A by its slice A and window B by its slice B, and Σ adds all 18 products into one number: the top-left cell of a 3 × 3 output map (a 5 × 5 input has 3 × 3 complete window positions). Sliding the window fills the other eight cells. Output channel 1 does the same with two different slices, so the drawing holds four slices: two inputs times two outputs. In general each output channel has k × k × C_in weights, and the layer has k × k × C_in × C_out. This is the channel stack you traced in the "}<a href={"/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals"}>{"Convolution lesson"}</a>{"."}</Prose>

<Prose>{"To make every product readable, zoom into a single row of each map and use two-tap filters instead of 3 × 3 ones: channel A = [1, 2, 3] and channel B = [2, 0, 1]. A two-tap filter reads adjacent pairs, starting at indices 0 and 1. We omit bias and activation for now. Look first at how a standard convolution computes two output channels from the first pair of both maps. Under each outlined cell, the amber “× w” is that output channel’s own weight for it."}</Prose>

<DenseChannelFigure />

<Prose>{"The supplied cyan patches are A [1, 2] and B [2, 0]. For output channel 0 at spatial position 0, its amber A filter [2, −2] makes −2, and its B filter [−0.5, −1] makes −1. Adding those two contributions makes the violet result −3. Output channel 1 reads the same patches through different filters and makes 1. Each output can choose its own spatial pattern for each input channel. For a 3×3 kernel, that means nine weights for every input/output channel pair."}</Prose>

<Prose>{"Can we do the spatial work once per input map, then combine its results? Call a filter applied separately to one channel depthwise, and name it D: D_A filters channel A. Call the following weighted combination at each single location pointwise, or 1×1 convolution, and name its weights P. Here are the same two 5 × 5 channels and two outputs, processed in two stages:"}</Prose>

<TensorAnatomyFigure kind="separable" />

<Prose>{"Left of the dashed line, each window meets only its own filter: D_A never sees channel B. The depthwise stage therefore makes one filtered map per input channel, z_A and z_B, and nothing has crossed channels yet. Right of the line, the 1×1 step reads one position in both filtered maps (the white-outlined cells) and mixes them twice: output 0 with its own pair of amber weights P₀, output 1 with a different pair P₁. Each pair holds one weight per input channel; for output 0 we will write them as P_A and P_B. A 1×1 kernel reads a single position in every channel: the opposite of a depthwise filter, which reads many positions in one channel. Both outputs reuse the same two spatial filters. That sharing is the saving: the spatial weights total 3 × 3 × C_in however many outputs there are, and each extra output channel costs only C_in mixing weights."}</Prose>

<Prose>{"Now return to the one-row strips and follow only output channel 0, at both spatial positions. Use spatial filters D_A = [1, −1] and D_B = [0.5, 1], then mixing weights P_A = 2 and P_B = −1. The next drawing follows these two lanes; its controls change B’s first input and B’s mixing weight, while both spatial filters stay fixed."}</Prose>

<DepthwiseChannelLab />

<Prose>{"Follow channel A: its first pair gives 1×1 + 2×(−1) = −1. Its second pair gives 2×1 + 3×(−1) = −1. Channel B gives 2×0.5 + 0×1 = 1, then 0×0.5 + 1×1 = 1. These spatial summaries have not yet crossed channels. The pointwise operation combines values at the same location: 2×(−1) + (−1)×1 = −3. Thus the starting output strip is [−3, −3]. A negative mixing weight subtracts evidence; a 1×1 kernel can connect every input channel even though it reads only one spatial position."}</Prose>

<Prose>{"Move B’s first value from 2 to 4. Its first summary becomes 2, so spatial position 0 becomes −4. Position 1 of that same output channel stays −3: that first input is outside its patch. Return to 2, then set B’s pointwise weight to 0. Both outputs become −2 because only A contributes. These changes isolate spatial locality from channel mixing. The separable construction reproduces dense output channel 0’s filters [2, −2] and [−0.5, −1]; it cannot produce every possible second output from those same two spatial patterns. Section 2 will explain that restriction."}</Prose>

<Prose>{"In two dimensions, the same operations read a patch in each channel. Let x_c(i,j) be input channel c at row i, column j; z_c its filtered value; and y_o output channel o. D_c(u,v) is the spatial weight at tap (u,v), P_o,c mixes channel c into output o, and b_o adds an output bias. The two-step calculation is:"}</Prose>

<div className="neural-equation"><MathBlock>{"z_c(i,j)=\\sum_{u,v}D_c(u,v)x_c(i+u,j+v),\\qquad y_o(i,j)=b_o+\\sum_c P_{o,c}z_c(i,j)."}</MathBlock></div>

<Prose>{"The first sum runs over spatial taps; the second runs over channels. Here offsets suppress padding and dilation, which section 3 restores. Frameworks use cross-correlation: weights are read in stored order, as in our hand products. Mathematical convolution reverses the filter. Keep the convention consistent when checking a program. No activation sits between these two operations yet; adding one changes the algebra."}</Prose>

<H3>{"How its weights learn"}</H3>

<Prose>{"We can now trace both forward steps. How do both sets of weights learn? Recall the Loss Functions lesson’s half squared error: it measures how far an output lies from a supplied target. Set the desired first output to 1. The next drawing runs top to bottom, from the two patches to the loss. Then read it backward along the orange dashed arrows: as in Backpropagation, a sensitivity says how a small change affects that loss."}</Prose>

<GradientRouteFigure />

<Prose>{"Training differentiates through both steps. For the first output above, target 1 and loss "}<InlineMath>{"L=\\frac12(y-1)^2"}</InlineMath>{", we have "}<InlineMath>{"y=-3"}</InlineMath>{", "}<InlineMath>{"L=8"}</InlineMath>{" and "}<InlineMath>{"\\partial L/\\partial y=-4"}</InlineMath>{"."}</Prose>

<Prose>{"The mixing gradient is "}<InlineMath>{"(-4)[-1,1]=[4,-4]"}</InlineMath>{". The gradient reaching filtered channels is "}<InlineMath>{"(-4)[2,-1]=[-8,4]"}</InlineMath>{". Multiplying these by the input patches gives spatial gradients A "}<InlineMath>{"[-8,-16]"}</InlineMath>{" and B "}<InlineMath>{"[8,0]"}</InlineMath>{"."}</Prose>

<Prose>{"A simultaneous gradient step of size 0.01 changes the mixing weights to "}<InlineMath>{"[1.96,-0.96]"}</InlineMath>{" and the spatial filters to "}<InlineMath>{"[1.08,-0.84]"}</InlineMath>{", "}<InlineMath>{"[0.42,1]"}</InlineMath>{". The new filtered values are −0.6 and 0.84; the output is −1.9824 and the loss is 4.44735488. Both sets of weights contribute to the improvement; section 4's program reproduces every one of these numbers. Larger steps need not reduce loss: a gradient describes a local direction, not a promise for every step size."}</Prose>

<Prose>{"Now vary the desired output or the step size. This investigation always starts from the original A/B inputs and weights, independently of the edits above. Bias remains fixed at zero. Every proposed weight uses the same old-state derivatives; the slider does not run repeated training."}</Prose>

<DepthwiseGradientLab />

<Prose>{"Deeper: write the same chain for every output. Let g_o = ∂L/∂y_o at one position. Then the sensitivity reaching spatial summary c is the sum of all output sensitivities weighted by P_o,c; each spatial weight receives that sensitivity times the input it read:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial z_c}=\\sum_o P_{o,c}g_o,\\qquad \\frac{\\partial L}{\\partial P_{o,c}}=g_o z_c,\\qquad \\frac{\\partial L}{\\partial D_c(u,v)}=\\frac{\\partial L}{\\partial z_c}x_c(i+u,j+v)."}</MathBlock></div>

<Prose>{"The bias derivative is g_o. If we also train bias with the same 0.01 step, it becomes 0.04 and our first updated output is −1.9424 instead of −1.9824. This is a changed parameter policy, not disagreement between implementations. Section 4’s scratch program demonstrates both."}</Prose>

<Prose>{"With many locations, the gradient for a shared filter sums contributions from all its uses. With nonlinear activations, their derivatives also enter this chain."}</Prose>

<H2>{"2. What is saved—and what is restricted?"}</H2>

<Prose>{"Section 1 separated spatial work from channel mixing. Does that separation save work, and what freedom does it give up? Return to the previous lesson’s 64-input, 128-output, 3×3 layer on a 14×14 output grid. Compare the number of learned weights before counting repeated uses at each position."}</Prose>

<DepthwiseSupportingFigure kind="cost" />

<Prose>{"At one output location, standard convolution uses "}<InlineMath>{"k^2C_{\\rm in}C_{\\rm out}"}</InlineMath>{" multiply-accumulates, or "}<strong>{"MACs"}</strong>{". One MAC multiplies two numbers and accumulates their product. Our convention counts it as one MAC; a convention counting separate floating-point operations often counts it as two FLOPs."}</Prose>

<Prose>{"With one depthwise filter per input channel, the depthwise and pointwise counts are:"}</Prose>

<div className="neural-equation"><MathBlock>{"k^2C_{\\rm in}+C_{\\rm in}C_{\\rm out}."}</MathBlock></div>

<Prose>{"Multiply either expression by "}<InlineMath>{"H_{\\rm out}W_{\\rm out}"}</InlineMath>{" for one image. These counts exclude bias additions, activation, normalization and memory movement. They equal the number of weights before multiplying by spatial area."}</Prose>

<Prose>{"For a "}<InlineMath>{"14\\times14"}</InlineMath>{" output, 64 input channels, 128 output channels and "}<InlineMath>{"3\\times3"}</InlineMath>{" filters:"}</Prose>

<NeuralTable caption={"Weights and MACs for a 64→128, 3×3 layer on a 14×14 output"} headers={[<>{"Layer"}</>,<>{"Spatial weights"}</>,<>{"Mixing weights"}</>,<>{"Total weights"}</>,<>{"MACs/image"}</>]} rows={[[<>{"Standard"}</>,<>{"73,728"}</>,<>{"Included"}</>,<>{"73,728"}</>,<>{"14,450,688"}</>],[<>{"Depthwise + pointwise"}</>,<>{"576"}</>,<>{"8,192"}</>,<>{"8,768"}</>,<>{"1,718,528"}</>]]} />

<Prose>{"The separable-to-standard ratio is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{1}{C_{\\rm out}}+\\frac{1}{k^2}."}</MathBlock></div>

<Prose>{"Here it is about 0.119. The pointwise operation now owns most arithmetic. The ratio approaches "}<InlineMath>{"1/9"}</InlineMath>{" for a "}<InlineMath>{"3\\times3"}</InlineMath>{" filter with very many output channels; it does not become exactly "}<InlineMath>{"1/9"}</InlineMath>{" at some magic channel threshold. For one output channel the ratio is "}<InlineMath>{"1+1/9"}</InlineMath>{": a separable factorization can cost "}<strong>{"more"}</strong>{"."}</Prose>

<Prose>{"These are exact operation counts under stated shapes, not measured speed. A runtime must read tensors, schedule kernels and exploit a particular processor's parallelism. A fast dense kernel can outperform an inefficiently implemented depthwise pipeline. Measure the actual deployment shape, batch, dtype and device before making a latency claim."}</Prose>

<Prose>{"Why can fewer MACs still run slower? Count the work done for each value read from memory. In the table's dense layer, each output value takes "}<InlineMath>{"9\\times64=576"}</InlineMath>{" MACs, and each loaded input value is reused by all 128 output channels. A depthwise output value takes only 9 MACs, and each loaded input value is reused by just its own channel's filters. The ratio of arithmetic to memory traffic is called "}<strong>{"arithmetic intensity"}</strong>{". This count assumes the weights stay in fast memory and are reused at every position, so the activations are what must be moved. Depthwise layers then have low intensity, and on many processors they are limited by moving data rather than by multiplying: they are "}<strong>{"memory-bound"}</strong>{". The pointwise layer, an ordinary matrix multiplication, usually has much higher intensity."}</Prose>



<H3>{"Why one filter per channel cannot represent every standard layer"}</H3>

<Prose>{"The cheaper pair reuses one spatial pattern for each input channel. Can it still produce two independent patterns from one channel? Switch to a single two-value patch [a, b] so we can isolate this question: require output 1 to be a and output 2 to be b. The target filters [1, 0] and [0, 1] need two independent spatial patterns. Rank is the number of independent patterns needed to express such a matrix; this target has rank two."}</Prose>

<Prose>{"A depth multiplier m allocates m spatial filters per input channel, then the pointwise layer mixes all mC_in intermediate channels. Here two patterns are allocated: [1, t] and [0, 1]. Output 1 takes the first pattern; output 2 takes s times the second. The controls change the first pattern’s second tap t and the second route’s mixing weight s. Compare two independent probes, not just one favorable input."}</Prose>

<DepthwiseRankLab />

<Prose>{"With t = 0 and s = 0, the outputs are [a, 0]. The probe [2, 0] matches perfectly, but [0, 3] loses its second value. Setting s = 1 recovers [a, b] on both probes. Changing t to 1 then mixes b into output 1: enough capacity does not mean the current weights implement the desired operation. The lab always allocates two patterns; zeroing a coefficient lowers its current effective rank without reducing its allocated cost. A physically one-filter layer has the same rank-one restriction but fewer stored factors."}</Prose>

<Prose>{"For a linear depthwise/pointwise pair, substitute the spatial sum into the channel sum. Each dense filter becomes a scaled copy of the shared spatial pattern. With m patterns, it is a sum of m such copies:"}</Prose>

<div className="neural-equation"><MathBlock>{"W_{o,c,u,v}=P_{o,c}D_{c,u,v}\\quad(m=1),\\qquad W_{o,c,u,v}=\\sum_{r=1}^{m}P_{o,c,r}D_{c,r,u,v}."}</MathBlock></div>

<Prose>{"Fix input channel c and flatten its k² tap positions. Its dense filters form a C_out × k² matrix, equal to a C_out × m mixing matrix times an m × k² pattern matrix. Every row is a combination of those m rows, so rank cannot exceed m. Conversely, a rank-r matrix can be decomposed into r independent patterns and their coefficients; SVD provides that construction in section 6. Every dense kernel is representable once m reaches the largest per-input rank, at most min(C_out, k²)."}</Prose>

<Prose>{"The weight count is mC_in(k² + C_out). The general separable-to-dense ratio is m(1/C_out + 1/k²). Thus adding independent patterns spends the saving; cost is lower only when m < k²C_out/(k²+C_out), for the same output grid and bias-free linear operations. Full rank can restore the function while costing more than dense convolution. Training a constrained architecture and approximating an already trained one are different tasks."}</Prose>

<span id="two-important-distinctions" aria-hidden="true" />
<H3>{"Related distinctions, and the range between dense and depthwise"}</H3>

<Prose>{"A "}<InlineMath>{"3\\times1"}</InlineMath>{" filter followed by a "}<InlineMath>{"1\\times3"}</InlineMath>{" filter factors the "}<strong>{"spatial axes"}</strong>{". Depthwise followed by pointwise factors "}<strong>{"spatial treatment and channel mixing"}</strong>{". They are different restrictions and may be combined."}</Prose>

<Prose>{"An activation between the two operations changes the function. Even the scalar mapping "}<InlineMath>{"x\\mapsto\\max(0,x)"}</InlineMath>{" cannot be replaced by a fixed linear weight for both positive and negative inputs. The effective-kernel and rank equations above describe the linear pair, not a whole nonlinear MobileNet block. "}<a href={"https://arxiv.org/abs/1704.04861"}>{"MobileNet V1"}</a>{" places normalization and ReLU after both operations; "}<a href={"https://arxiv.org/abs/1610.02357"}>{"Xception's activation experiment"}</a>{" studies a different placement and finds an intermediate activation harmful in that setting. Architecture-specific evidence does not establish a universal activation rule."}</Prose>

<Prose>{"Dense and depthwise are also the two ends of one range, which the Convolution lesson met as the groups setting. Four input channels (cyan, top) are wired to four output channels (violet, bottom) in three ways; each amber line is one k × k kernel slice:"}</Prose>

<GroupWiringFigure />

<Prose>{"A "}<strong>{"grouped convolution"}</strong>{" with g groups splits the input channels into g equal groups, and each output channel reads only its own group: the dashed boxes in the middle drawing. Its weight count is "}<InlineMath>{"k^2C_{\\rm in}C_{\\rm out}/g"}</InlineMath>{": with g = 1 it is the dense layer, and with g = C_in it is depthwise. Our 64→128 layer with g = 4 keeps 18,432 of the 73,728 weights. "}<a href={"https://arxiv.org/abs/1611.05431"}>{"ResNeXt"}</a>{" builds its blocks from grouped 3×3 convolutions."}</Prose>

<Prose>{"Stacked grouped layers with unchanged group assignments have a blind spot: information never crosses from one group to another. Follow input channel 0’s white paths through two grouped layers with two groups each:"}</Prose>

<ChannelShuffleFigure />

<Prose>{"Without a shuffle, channel 0 reaches only outputs 0 and 1. With channels reordered 0, 2, 1, 3 between the layers, its paths enter both groups of the second layer and reach all four outputs. There are two common fixes. A dense 1×1 layer mixes every channel, as in depthwise separable blocks; "}<a href={"https://arxiv.org/abs/1707.01083"}>{"ShuffleNet"}</a>{" instead uses cheap grouped 1×1 layers and permutes (shuffles) channels between them so the next grouped layer can combine channels from different previous groups. The connections depend on the channel counts and the permutation; shuffling does not always connect each receiving group to every previous group. For example, split channels 0–7 into four pairs: (0,1), (2,3), (4,5), (6,7). Reshape into four rows of two, transpose, and flatten: 0,2,4,6,1,3,5,7. The next layer’s first pair (0,2) combines two previous groups, not all four."}</Prose>

<H2>{"3. Dilation changes positions, not the number of learned taps"}</H2>

<Prose>{"So far we changed which channels share spatial filters. A separate question remains: how far apart should a filter’s input positions be? On an image, a 3 × 3 kernel normally reads a 3 × 3 block. Dilation spreads the same nine taps apart:"}</Prose>

<DilatedKernelsFigure />

<Prose>{"Each grid is a 9 × 9 input. The amber squares are the nine positions one output reads, and the white outline marks the position of that output. At dilation 1 the taps touch. At dilation 2 one unread cell separates neighbouring taps, so the dashed span grows to 5 × 5; at dilation 4 three cells separate them and the span covers all 9 × 9. The kernel has nine weights every time: dilation changes where they read, not how many there are."}</Prose>

<Prose>{"To follow actual numbers, switch from the two-channel example to one nine-cell strip [1, 2, 3, 4, 5, 6, 7, 8, 9], a single row of such a grid. Its zero-based index 4 contains 5. Three unit weights read a center and two neighbors, spaced by the dilation; outside the strip, zero padding supplies 0. The controls change spacing, output center and the value at index 6. White outlines show the addresses actually read."}</Prose>

<DepthwiseStencilLab />

<Prose>{"In index terms, a three-tap filter centred at position i normally reads "}<InlineMath>{"i-1,i,i+1"}</InlineMath>{"; at "}<strong>{"dilation two"}</strong>{" it reads "}<InlineMath>{"i-2,i,i+2"}</InlineMath>{"."}</Prose>

<Prose>{"With signal "}<InlineMath>{"[1,2,3,4,5,6,7,8,9]"}</InlineMath>{", center index 4 and filter "}<InlineMath>{"[1,1,1]"}</InlineMath>{":"}</Prose>

<NeuralTable caption={"Three unit taps around index 4 at three dilations"} headers={[<>{"Dilation"}</>,<>{"Sampled indices"}</>,<>{"Sampled values"}</>,<>{"Sum"}</>]} rows={[[<>{"1"}</>,<>{"3, 4, 5"}</>,<>{"4, 5, 6"}</>,<>{"15"}</>],[<>{"2"}</>,<>{"2, 4, 6"}</>,<>{"3, 5, 7"}</>,<>{"15"}</>],[<>{"8, with zero padding"}</>,<>{"−4, 4, 12"}</>,<>{"0, 5, 0"}</>,<>{"5"}</>]]} />

<Prose>{"The first two sums agree because this particular signal is an arithmetic progression and the symmetric weights balance around the center. Their sampling patterns are still different. Change index 6 from 7 to 20: dilation two's sum becomes 28, while dilation one's sum stays 15. Change index 5 from 6 to 20 instead: dilation two stays 15, while dilation one becomes 29."}</Prose>



<Prose>{"The movable stencil shows one output. How many outputs can a whole layer produce? Name input length H, kernel tap count k, dilation d, padding p on each side and stride s between successive output centers. The padded strip has H+2p positions; a k-tap stencil occupies a bounding span of 1+d(k−1). Count its complete placements along one spatial axis, advancing s positions each time:"}</Prose>

<div className="neural-equation"><MathBlock>{"H_{\\rm out}=\\left\\lfloor\\frac{H+2p-d(k-1)-1}{s}\\right\\rfloor+1."}</MathBlock></div>

<Prose>{"The kernel's "}<strong>{"bounding span"}</strong>{" is "}<InlineMath>{"k_{\\rm eff}=1+d(k-1)"}</InlineMath>{". A "}<InlineMath>{"3\\times3"}</InlineMath>{" kernel at dilation two spans a "}<InlineMath>{"5\\times5"}</InlineMath>{" box but directly reads only nine sites. At stride one, an odd kernel preserves size with "}<InlineMath>{"p=d(k-1)/2"}</InlineMath>{". For a "}<InlineMath>{"3\\times3"}</InlineMath>{" kernel, that is simply "}<InlineMath>{"p=d"}</InlineMath>{"."}</Prose>

<Prose>{"Stride moves the "}<strong>{"output centers"}</strong>{"; dilation spaces the "}<strong>{"taps within each output's stencil"}</strong>{". Zero padding supplies values outside the input. A dilated layer can also be depthwise: one choice concerns channel connectivity, the other concerns spatial sampling."}</Prose>

<Prose>{"The output-size formula counts where the whole stencil fits in the padded array. For input length 8, one padded position on each side, three taps, dilation 2 and stride 2, the padded length is 10 and the stencil spans 5 positions. Its leftmost index may be 0, 2 or 4: three placements. The next start, 6, would end at index 10, outside indices 0–9. Thus "}<InlineMath>{"\\lfloor(10-5)/2\\rfloor+1=3"}</InlineMath>{". This explains both the floor (a partial final placement does not count) and the final one (the start at zero counts)."}</Prose>

<Prose>{"At fixed output dimensions, changing dilation does not change the number of kernel weights or MAC terms. With no padding, larger dilation shrinks the output, so even the operation count changes. Always state the shape policy before comparing cost."}</Prose>

<H3>{"Receptive field, jump and actual coverage"}</H3>

<Prose>{"One stencil’s span is only the beginning: each incoming feature may already summarize a wider piece of the original image. Recall the Convolution lesson’s receptive field (the input region with a structural path to one output) and jump (spacing between feature centers in original-input units). Take an incoming width 7 and jump 2. A three-tap layer with dilation 3 reads incoming centers six original positions apart; follow the intervals before writing the recurrence."}</Prose>

<DepthwiseSupportingFigure kind="field" />

<Prose>{"The three incoming intervals center at −6, 0 and +6 and each extend three positions in either direction. Their combined extreme bounds run −9 through +9, width 19. A new stride 2 makes neighboring output centers four original positions apart. These are different measurements. In general, suppose incoming features have receptive-field bounding width "}<InlineMath>{"r"}</InlineMath>{" and neighboring centers are "}<InlineMath>{"j"}</InlineMath>{" original-input positions apart. The example had r = 7 and j = 2. Adding a layer gives"}</Prose>

<div className="neural-equation"><MathBlock>{"r_{\\rm new}=r+(k-1)dj,\\qquad j_{\\rm new}=sj."}</MathBlock></div>

<Prose>{"Starting at "}<InlineMath>{"r=j=1"}</InlineMath>{", two "}<InlineMath>{"3\\times3"}</InlineMath>{" stride-one layers with dilations 1 and 2 produce width "}<InlineMath>{"1+2+4=7"}</InlineMath>{". A stride-two layer increases the jump for later layers; that is why simply adding all kernel spans fails after downsampling."}</Prose>



<Prose>{"The bounding width says how far apart the extreme reachable positions are. It does not prove that every enclosed position is reachable, that learned weights are nonzero, or that a particular input has a nonzero gradient through every path. Those are different questions."}</Prose>

<Prose>{"So which positions can actually reach one output? Follow three serial stride-one layers on an unbounded line. Each new row below is formed by adding −d, 0 and +d to every offset in the previous row. The three controls are the rates of those three layers, not three parallel branches."}</Prose>

<DepthwiseCoverageLab />

<Prose>{"Changing all three rates to 2 reaches only even offsets, leaving holes despite a large bounding width. Return to 1, 2, 4 and every offset from −7 to 7 is reachable. On an image the holes form a regular grid:"}</Prose>

<GriddingFigure />

<Prose>{"Each small square is one input position relative to the output, which is outlined in white at the centre. With rates 2, 2, 2 only positions whose row and column offsets are both even are reached: 49 of the 169 positions inside the dashed bounding box. Rates 1, 2, 4 reach all 225. This checkerboard of holes is called gridding."}</Prose>

<Prose>{"The rows follow one general rule: start with "}<InlineMath>{"\\{0\\}"}</InlineMath>{" and repeatedly add each layer's set "}<InlineMath>{"\\{-d,0,d\\}"}</InlineMath>{". In two dimensions with full "}<InlineMath>{"3\\times3"}</InlineMath>{" stencils, the reachable sites are the Cartesian product of the one-dimensional set with itself, so their count is the square of the 1D count. The following exact comparisons also include two-layer and other three-layer schedules:"}</Prose>

<NeuralTable caption={"Bounding width versus reachable sites for serial dilation schedules"} headers={[<>{"Serial dilation rates"}</>,<>{"Bounding width"}</>,<>{"Reachable 1D sites"}</>,<>{"Reachable 2D sites / box"}</>]} rows={[[<>{"2, 2, 2"}</>,<>{"13"}</>,<>{"7"}</>,<>{"49 / 169"}</>],[<>{"1, 2, 4"}</>,<>{"15"}</>,<>{"15"}</>,<>{"225 / 225"}</>],[<>{"1, 4"}</>,<>{"11"}</>,<>{"9"}</>,<>{"81 / 121"}</>],[<>{"1, 2, 5"}</>,<>{"17"}</>,<>{"17"}</>,<>{"289 / 289"}</>],[<>{"1, 2, 9"}</>,<>{"25"}</>,<>{"21"}</>,<>{"441 / 625"}</>]]} />

<Prose>{"Repeated even rates never connect an output to odd offsets: that is the gridding drawn above. But “the rates have greatest common divisor one” is not enough to remove all holes: rates 1 and 4 miss offsets −2 and 2. Their gcd is one. Check the reachable set instead of replacing geometry with a slogan. The original "}<a href={"https://arxiv.org/abs/1702.08502"}>{"hybrid dilated convolution paper"}</a>{" also imposes a gap condition; a warning against shared factors is not its complete construction rule."}</Prose>



<section data-lesson-teaching="" className="lesson-teaching-section">

<h3 className="lesson-teaching-section__title">Deeper: construct a gap-free schedule and see its limit</h3>

<Prose>{"Can we deliberately make the shifted sets meet without holes? Begin with the reached offsets −1, 0, 1 from rate 1. Compare shifting that set by a new rate 3 versus a new rate 4; these discrete copies are drawn before the general argument."}</Prose>

<DilationIntervalFigure />

<Prose>{"Read the three copies above each number line. With rate 3, the copies end at −2 and begin at −1, then end at 1 and begin at 2: consecutive integers, so nothing is missed. With rate 4, the copies end at −3 and begin at −1, skipping −2, and likewise skip 2. The test is about discrete sites, so immediately adjacent integer endpoints are enough; the copies need not overlap."}</Prose>

<Prose>{"Now state the same check in general. Suppose all offsets from "}<InlineMath>{"-S"}</InlineMath>{" through "}<InlineMath>{"S"}</InlineMath>{" are reachable (above, S = 1). A new three-tap layer of rate "}<InlineMath>{"d"}</InlineMath>{" makes three shifted copies centered at "}<InlineMath>{"-d,0,d"}</InlineMath>{". The middle copy ends at S and the right copy begins at d − S, so they join without a missing integer when "}<InlineMath>{"d-S\\leq S+1"}</InlineMath>{", that is "}<InlineMath>{"d\\leq2S+1"}</InlineMath>{". With S = 1 this allows rate 3 but not rate 4, as drawn. The new covered interval is "}<InlineMath>{"[-S-d,S+d]"}</InlineMath>{"."}</Prose>



<Prose>{"Starting with "}<InlineMath>{"S=0"}</InlineMath>{" forces the first rate to be 1 for this construction. Choosing the largest permitted rate each time gives rates "}<InlineMath>{"1,3,9,27,\\ldots"}</InlineMath>{" and bounding widths "}<InlineMath>{"3,9,27,81,\\ldots"}</InlineMath>{". This is the same place-value idea as representing offsets with digits −1, 0 and 1 in powers of three."}</Prose>

<Prose>{"This is an exact sufficient construction for the stated unbounded, stride-one setting. It is not a recommendation to use enormous rates on tiny images. On a finite map, boundary padding can consume almost all the outer taps. Nor does complete structural coverage imply equal influence or better accuracy."}</Prose>

</section>

<Prose>{"The interval construction assumes an unbounded lattice. On an 8×8 feature map, a distant address can instead land in padding. Inspect one 3×3 stencil: the controls choose its dilation and output row/column. White outlines mark real input sites, while taps outside the grid contribute zero."}</Prose>

<DepthwiseBoundaryLab />

<Prose>{"At dilation 1, a corner reads four real sites whereas an interior point reads nine. At dilation 8 every output reads only its center. Large span, reachable sites on an infinite lattice, actual data on a finite map, and nonzero learned influence answer four different questions."}</Prose>

<Prose>{"Deeper: dilation does not itself destroy translation equivariance. On an unbounded stride-one signal, translating the input by one site translates the output by one site, because the same spaced offsets are used everywhere. A strided layer only has this exact correspondence for input shifts aligned with its stride. Finite zero padding introduces an edge exception: an all-ones strip with a three-tap unit filter gives 2 at a boundary but 3 in the interior. Moving a pattern across that boundary changes which neighbors exist. Keep the domain and boundary policy in an equivariance claim."}</Prose>

<H2>{"4. Implement the operator you actually mean"}</H2>

<Prose>{"Sections 1–3 taught the factorized calculation and its address rules. We can now turn them into an implementation without letting an API hide either operation. First build depthwise filtering and pointwise mixing from NumPy array operations; then map exactly the same factors to PyTorch’s grouped convolution."}</Prose>

<H3>{"From scratch: batch the products, then add overlapping derivatives"}</H3>

<Prose>{"The runnable file uses x with shape (N,C,H,W), spatial filters D with shape (C,m,kh,kw), mixing P with shape (O,C,m), and output bias b with shape (O,). Its patch view adds output-row, output-column and tap axes without copying a large matrix of flattened patches (often called im2col). Multiply each channel’s patches by its own m filters and sum their tap axes; then multiply by P and sum the channel/pattern axes at each position. A contraction is precisely this multiply-and-sum over shared axes. These contractions perform the sums we worked by hand."}</Prose>

<Prose>{"Two NumPy tools do this work. "}<code>{"sliding_window_view"}</code>{" lists every window as a new axis without copying: for channel A = [1, 2, 3] and window length 2 it gives [[1, 2], [2, 3]], exactly the two patches traced in section 1. "}<code>{"np.einsum"}</code>{" then multiplies and sums along named axes. In "}<code>{"np.einsum(\"pt,t->p\", windows, D_A)"}</code>{", each letter names an axis: p is the patch and t the tap. A letter that appears in the inputs but not after the arrow is summed over. So the call computes, for each patch, the sum over taps of window × weight: [1×1 + 2×(−1), 2×1 + 3×(−1)] = [−1, −1], the filtered strip from section 1. The program uses the same two tools with batch, channel, row and column axes added."}</Prose>

<DepthwiseProgram file="separable-convolution.py" title="NumPy separable forward, backward and simultaneous update" />

<Prose>{"Read forward first: sliding_window_view identifies bounding windows; ::stride chooses output starts and ::dilation chooses actual taps inside each window. The n,c,h,w,i,j and c,m,i,j indices in the first einsum share the input-channel and tap axes, producing filtered[n,c,m,h,w]. The second einsum combines c,m with P[o,c,m], producing y[n,o,h,w]. A window view saves patch storage; it does not remove the multiplication work."}</Prose>

<Prose>{"Read backward next: sum sensitivities over batch and positions for db, combine them with filtered values for dP, and send them through P to each spatial lane. Combining lane sensitivities with input patches gives dD. Finally each tap scatters its contribution back into the input positions it read. Overlapping uses must add, rather than overwrite. The cache snapshots the old factors so derivatives remain tied to the forward pass even if the caller later updates parameters."}</Prose>

<Prose>{"Run python separable-convolution.py with NumPy installed. It reproduces filtered strips [−1,−1] and [1,1], outputs [−3,−3], the hand gradients and the 0.01 simultaneous update. With bias held at zero the first new output is −1.9824; training bias too gives −1.9424. Only the first output contributes to this demonstration’s loss. Changing that objective changes which positions contribute gradients."}</Prose>

<Prose>{"For K=kh×kw taps and O outputs, forward and backward arithmetic scale as O(NH_outW_out C m(K+O)). Padded input, filtered activations and gradients need storage; patch windows are views, though contractions may use temporary workspace. This is an efficient batched reference with explicit sums and overlap handling. A deployed library can fuse kernels and exploit hardware-specific layouts; arithmetic counts alone do not establish which implementation is fastest."}</Prose>

<H3>{"Use the ordinary library with the same factor layout"}</H3>

<Prose>{"In PyTorch, grouped convolution partitions input and output channels into separate groups. Both channel counts must be divisible by the group count. Depthwise convolution uses one group per input channel. With multiplier "}<InlineMath>{"m"}</InlineMath>{", it produces "}<InlineMath>{"mC_{\\rm in}"}</InlineMath>{" channels; a following ordinary "}<InlineMath>{"1\\times1"}</InlineMath>{" layer mixes them."}</Prose>

<Prose>The scratch program made every sum and derivative visible. Match its exact state in the ordinary library: reshape D from (C,m,kh,kw) to (Cm,1,kh,kw) for a Conv2d with groups=C; reshape P from (O,C,m) to (O,Cm,1,1) for the pointwise Conv2d. Copy b to the latter. Input channel c's filters occupy indices c*m through c*m+m−1. The following runnable bridge imports the adjacent scratch file and compares the same first-output loss, every input/parameter derivative and one simultaneous update.</Prose>

<DepthwiseProgram file="separable-library-parity.py" title="Same-state NumPy and grouped PyTorch comparison" />

<Prose>Save both files together and run python separable-library-parity.py with NumPy and PyTorch installed. Both routes give output −3 and loss 8; all forward/gradient maximum differences were zero for this fixture, and the all-parameter update differs by about 2.22×10⁻¹⁶. Both give −1.9424 when bias is trained. The separate numerical check covers multipliers, stride, dilation, padding, overlapping patches and finite differences; matching this one fixture alone would not verify all those cases.</Prose>


<Prose>{"Now change fixtures to test the equivalence on a larger tensor: three input channels, five output channels, multiplier two and a 7×7 random image. Random values exercise every route rather than continuing the hand calculation. This complete program constructs the pair’s effective standard kernel and checks the two forward results:"}</Prose>

<CodeBlock language={"python"}>{"import torch\nfrom torch import nn\nfrom torch.nn import functional as F\n\ntorch.manual_seed(4)\ntorch.set_num_threads(1)\ninputs, outputs, multiplier, dilation = 3, 5, 2, 2\nimage = torch.randn(1, inputs, 7, 7, dtype=torch.float64)\ndepthwise = nn.Conv2d(\n    inputs, inputs * multiplier, 3, padding=dilation,\n    dilation=dilation, groups=inputs, bias=False\n).double()\npointwise = nn.Conv2d(inputs * multiplier, outputs, 1).double()\n\nfiltered = depthwise(image)\nseparated = pointwise(filtered)\nspatial = depthwise.weight[:, 0].reshape(inputs, multiplier, 3, 3)\nmixing = pointwise.weight[:, :, 0, 0].reshape(outputs, inputs, multiplier)\neffective = torch.einsum(\"ocm,cmuv->ocuv\", mixing, spatial)\nstandard = F.conv2d(image, effective, pointwise.bias,\n                    padding=dilation, dilation=dilation)\nprint(filtered.shape, separated.shape)\nprint(torch.allclose(separated, standard, atol=1e-12, rtol=1e-12))"}</CodeBlock>

<Prose>{"The intermediate shape is "}<InlineMath>{"1\\times6\\times7\\times7"}</InlineMath>{", the output is "}<InlineMath>{"1\\times5\\times7\\times7"}</InlineMath>{", and the equality check is true within floating-point tolerance. The construction sums the "}<InlineMath>{"m"}</InlineMath>{" shared spatial patterns for each input/output channel pair; it does not train or approximate anything."}</Prose>

<Prose>{"The complete "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/author-checks.py"}>{"direct-loop reference and checks"}</a>{" also implement grouping, padding, dilation and stride without calling a convolution library inside the reference. Nine float64 comparisons against PyTorch, across groups 1/2/4 and several dilation/stride settings, had maximum absolute error "}<InlineMath>{"5.33\\times10^{-15}"}</InlineMath>{". That validates these fixtures, rather than claiming every future dtype/device/input is tested. The stable "}<a href={"https://docs.pytorch.org/docs/2.12/generated/torch.nn.Conv2d.html"}>{"PyTorch Conv2d API reference"}</a>{" defines the same group and output-shape conventions."}</Prose>

<DepthwiseProgram file="author-checks.py" title="Read the direct-loop spatial operator and verification program" />

<H3>{"Biases, normalization and small batches"}</H3>

<Prose>{"The linear equivalence check used a bias-free depthwise stage and a pointwise output bias. What changes if either stage has a bias, or normalization follows it? Recall Batch/Layer/Group/RMS Normalization: evaluation BatchNorm applies a fixed per-channel gain and shift. First distinguish that fixed affine operation from training-time batch statistics."}</Prose>

<Prose>{"Start with biases. If the depthwise operation has bias "}<InlineMath>{"b_D"}</InlineMath>{" and the pointwise operation bias "}<InlineMath>{"b_P"}</InlineMath>{", combining the linear pair produces bias "}<InlineMath>{"Pb_D+b_P"}</InlineMath>{". Ignoring the first bias changes the function."}</Prose>

<Prose>{"Now normalization. The "}<a href={"/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals"}>{"Convolution lesson’s folding drawing"}</a>{" computed one output channel both ways and showed that evaluation-mode BatchNorm, with its stored statistics fixed, multiplies a channel by one fixed gain and then shifts it. The convolution before it can therefore absorb it:"}</Prose>

<Prose>{"With stored mean "}<InlineMath>{"\\mu"}</InlineMath>{", variance "}<InlineMath>{"v"}</InlineMath>{", scale "}<InlineMath>{"\\gamma"}</InlineMath>{" and shift "}<InlineMath>{"\\beta"}</InlineMath>{", a preceding convolution with weights "}<InlineMath>{"W"}</InlineMath>{" and bias "}<InlineMath>{"b"}</InlineMath>{" becomes:"}</Prose>

<div className="neural-equation"><MathBlock>{"W'=\\frac{\\gamma W}{\\sqrt{v+\\epsilon}},\\qquad\nb'=\\beta+\\frac{\\gamma(b-\\mu)}{\\sqrt{v+\\epsilon}}."}</MathBlock></div>

<Prose>{"This is inference folding, and it requires all those quantities to stay fixed. Training-mode BatchNorm normalizes with the current batch's statistics, which change from batch to batch, so the same folding argument does not apply during training."}</Prose>

<Prose>{"For a separable pair, fold each BatchNorm into the layer directly before it: the one after the depthwise step into D and b_D, one gain per depthwise channel, and the one after the pointwise step into P and b_P. When no activation sits between the two stages, the folded biases then combine as P b_D + b_P, as above."}</Prose>

<H2>{"5. Put the two mechanisms into useful architectures"}</H2>

<Prose>{"We now have two independently controllable building blocks and matching implementation routes. How do real networks arrange them? Return to the Landmark Architectures lesson’s mobile blocks: use the factorization to save spatial work, then deliberately spend some of that saving on channel capacity. After that we will reuse dilation for a different task, predicting a label at every pixel."}</Prose>

<H3>{"Mobile networks: spend channel mixing carefully"}</H3>

<Prose>{"MobileNet V1 repeatedly applies depthwise spatial filtering followed by pointwise mixing. Reducing every internal channel width by a factor "}<InlineMath>{"\\alpha"}</InlineMath>{" reduces the depthwise term linearly and the pointwise term quadratically:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\text{MACs}\\approx H_{\\rm out}W_{\\rm out}\n\\left(k^2\\alpha C_{\\rm in}+\\alpha^2C_{\\rm in}C_{\\rm out}\\right)."}</MathBlock></div>

<Prose>{"Reducing both spatial dimensions by "}<InlineMath>{"\\rho"}</InlineMath>{" multiplies this by approximately "}<InlineMath>{"\\rho^2"}</InlineMath>{", subject to integer rounding and boundary stages. Width and resolution are different choices: narrowing removes feature capacity, whereas downsampling can remove fine spatial evidence. The broad architecture comparison in the previous lesson now has a mechanistic explanation."}</Prose>

<Prose>{"V1 filters channels and then mixes them. V2 asks a different question: can nonlinear processing use a wide intermediate representation while the stored endpoints stay narrow? The drawing sets the ResNet bottleneck from the Landmark Architectures lesson beside MobileNet V2’s block. Each slab’s width is proportional to its channel count; in the MobileNet column the shorter slabs mark where stride 2 halves the grid. Read each column downward:"}</Prose>

<BlockShapesFigure />

<Prose>{"The bottleneck narrows 256 channels to 64, does its expensive dense 3 × 3 work on the narrow tensor, widens back to 256 and adds the input through the ⊕ skip. The inverted residual does the opposite. It widens 32 channels to 192 with a cheap 1×1, does its 3 × 3 work depthwise in the wide space (affordable, because depthwise costs only k² weights per channel), and projects back to 32. This stride-2 example also halves the grid at the depthwise step, so its last two slabs are shorter, and since its input and output shapes differ it has no skip. At stride one with equal widths, a skip adds the narrow endpoints."}</Prose>

<Prose>{"Each 1×1 and the depthwise step are followed by the BatchNorm already taught. The first two are also followed by ReLU6, which clips responses to [0, 6]; the final projection deliberately has no clipping activation. "}<a href={"https://arxiv.org/abs/1801.04381"}>{"MobileNet V2"}</a>{" calls this a linear bottleneck: expansion provides several nonlinear features before compression, and the linear projection avoids zeroing every negative projected value."}</Prose>

<Prose>{"Why expand before a clipping activation? Switch briefly from image maps to a scalar x to isolate information loss. The two learned expansion weights [1,−1] put its sign in separate channels; the drawing follows both negative and positive inputs through ordinary ReLU and a linear projection."}</Prose>

<ExpansionSignFigure />

<Prose>{"The expanded representation retains the sign in which channel is active. A final ReLU on the narrow output would map every negative x to zero and lose those distinctions in this branch. This illustrates why extra channels before a nonlinearity can preserve useful information; it does not guarantee every learned expansion is invertible. The residual path, when present, provides a separate route for the input."}</Prose>

<Prose>{"For equal input/output width "}<InlineMath>{"C"}</InlineMath>{", expansion factor "}<InlineMath>{"t"}</InlineMath>{", stride one and a "}<InlineMath>{"k\\times k"}</InlineMath>{" spatial operation, branch weights before biases/normalization are"}</Prose>

<div className="neural-equation"><MathBlock>{"tC^2+k^2tC+tC^2."}</MathBlock></div>

<Prose>{"Expansion is not free. At "}<InlineMath>{"C=32,t=6,k=3"}</InlineMath>{" there are 14,016 weights and 2,747,136 MACs on a "}<InlineMath>{"14\\times14"}</InlineMath>{" map. If the depthwise operation downsamples to "}<InlineMath>{"7\\times7"}</InlineMath>{", expansion still runs on "}<InlineMath>{"14\\times14"}</InlineMath>{", while spatial filtering and projection run on "}<InlineMath>{"7\\times7"}</InlineMath>{"; the count becomes 1,589,952. Multiplying every operation by the smaller area would undercount the block."}</Prose>

<Prose>{"The sign example explains why activation placement matters. Another design decision changes the activation itself. Hard-swish multiplies x by a clipped linear gate that rises from 0 to 1 over inputs −3 to 3. Look at its exact input/output curve, especially the negative part that ReLU would erase."}</Prose>

<HardSwishFigure />

<Prose>{"MobileNet V3 adds design choices including channel gates, architecture search and hard-swish. Its gate approximation "}<InlineMath>{"\\operatorname{clip}(x+3,0,6)/6"}</InlineMath>{" is piecewise linear; multiplying by "}<InlineMath>{"x"}</InlineMath>{" gives "}<strong>{"hard-swish"}</strong>{", which is piecewise quadratic in the middle:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{hswish}(x)=\n\\begin{cases}\n0 & x\\leq-3,\\\\\nx(x+3)/6 & -3<x<3,\\\\\nx & x\\geq3.\n\\end{cases}"}</MathBlock></div>

<Prose>{"For example, hard-swish(−2) = −2(−2+3)/6 = −1/3. It preserves some negative responses, unlike ReLU. Deployment benefit depends on an implementation and processor, not merely on avoiding a sigmoid. The exact design and measured platform belong to the "}<a href={"https://arxiv.org/abs/1905.02244"}>{"MobileNet V3 paper"}</a>{", not a universal speed rule."}</Prose>



<H3>{"Segmentation: ask for context at every location"}</H3>

<Prose>{"Mobile classification spends less work on each image and returns one label per image. Now change the task: "}<strong>{"semantic segmentation"}</strong>{" assigns a class to each pixel. A patch may resemble road or roof locally; its surroundings help distinguish them. But repeated downsampling can erase a thin pole before the final prediction. This motivates using the spacing mechanism from section 3 to reach distant context without shrinking the grid."}</Prose>

<Prose>{"Dilation lets later layers sample more distant context while keeping their output grid dense. "}<strong>{"Output stride"}</strong>{" is the spacing between output-feature centers in original-image coordinates. If it is 16, a feature-map dilation of 6 spaces adjacent taps "}<InlineMath>{"6\\times16=96"}</InlineMath>{" input pixels apart. If output stride changes to 8, dilation 12 keeps that spacing. The complete receptive-field size still depends on the backbone's incoming field; tap spacing alone does not specify it."}</Prose>

<Prose>{"Where does an output stride of 16 or 8 come from? A classification backbone such as ResNet-50 halves its grid at the start of each stage and ends at output stride 32. The drawing shows how its last stages are changed:"}</Prose>

<OutputStrideFigure />

<Prose>{"For output stride 16, DeepLab removes the stride of the last stage, so it keeps a 14 × 14 grid, and dilates that stage’s 3 × 3 convolutions by 2. Each pretrained filter then still reads inputs as far apart as it did during pretraining, now on a finer grid. For output stride 8, the last two stages keep 28 × 28 and use dilations 2 and 4. The price is computation: each changed stage processes 4 times as many positions, so going from output stride 16 to 8 makes those stages cost about 4 times as many MACs."}</Prose>

<Prose>{"One dilation gives one context scale. To keep several scales at once, run parallel routes on the same map and merge them. Read the drawing downward:"}</Prose>

<AsppBranchesFigure />

<Prose>{""}<a href={"https://arxiv.org/abs/1706.05587"}>{"DeepLab V3"}</a>{"'s "}<strong>{"atrous spatial pyramid pooling"}</strong>{", or ASPP, sends one map through five parallel branches: a 1×1 branch, three dilated "}<InlineMath>{"3\\times3"}</InlineMath>{" branches, and an image-pooling branch that averages the whole map to 1 × 1, projects it and resizes the result back to H × W. Each branch makes B channels; B is a branch width, not the batch size N. Concatenation keeps the five results side by side along the channel axis, and a learned 1×1 projection mixes the 5B channels back to B. The original V3 setting uses rates 6/12/18 at output stride 16, with doubled rates at output stride 8. These are "}<strong>{"parallel"}</strong>{" branches, so applying the serial gridding formula to the list 6/12/18 is a category error. “Atrous” comes from the French "}<em>{"à trous"}</em>{", “with holes”. It is borrowed from the "}<em>{"algorithme à trous"}</em>{" for the undecimated wavelet transform, which spaces filter taps the same way; atrous convolution and dilated convolution are the same operation."}</Prose>



<Prose>{"To see what those routes contribute, return to section 3’s nine-cell strip. All five routes read this same strip at center 4: center only, three unit-tap sums at dilations 1/2/4, and the whole-strip mean. Their concatenated five values are mixed with weights [0,0.1,0.2,0.3,1]. Change the far input at index 8 or the dilation-4 route’s projection weight; the other weights stay fixed."}</Prose>

<DepthwiseContextLab />

<Prose>{"The image-summary branch averages each channel over space, projects the vector and broadcasts/upsamples it back. It brings global context, but discards where that context occurred. Two spatial arrangements with the same channel means give the same image-summary vector."}</Prose>

<Prose>{"The averaged map is 1×1, which matters for the BatchNorm in that branch. During training with one image, each channel has a single value, and training-mode BatchNorm cannot estimate a channel variance from one value. Train with more than one image per batch, use the trained inference statistics, or choose a different normalization for that branch. Turning off gradient tracking does not switch a module to evaluation mode."}</Prose>

<Prose>{"How large can a rate usefully be? A 513 × 513 training crop at output stride 16 gives a 33 × 33 feature map. Here is where each dilated branch’s nine taps land when the output sits at the centre of that map:"}</Prose>

<AsppFootprintFigure />

<Prose>{"Rate 6 (circles) and rate 12 (squares) keep all nine taps inside the map. At rate 18 (diamonds) the outer taps sit 18 cells from the centre, two cells beyond the edge, so they read zero padding; only the centre tap reads real data. Positions nearer the border lose taps at smaller rates too, as the 8 × 8 grid in section 3 showed, where dilation 8 leaves only the centre tap at every position. Such a branch is still a learned operation, but it has lost the distant context it was meant to supply. DeepLab V3 describes this degeneration as the rate approaches the map size, and its image-pooling branch is one response."}</Prose>

<Prose>{""}<a href={"https://arxiv.org/abs/1802.02611"}>{"DeepLab V3+"}</a>{" adds a decoder that combines coarse semantic features with higher-resolution features and refines boundaries. Its use of atrous separable convolutions combines our two independent choices. The decoder does not magically reconstruct all information lost during downsampling; its skip features provide additional spatial evidence."}</Prose>

<Prose>{"These ideas also transfer to other domains. In an audio feature map, an axis may represent time and another frequency; dilation rates should reflect the corresponding units. For real-time sequence prediction a centered temporal stencil reads future samples. A causal version uses only current and earlier positions, with left padding; the recurrent and sequence lessons will develop that decision further. A large mathematical field is useful only when the sampled information is available and relevant."}</Prose>

<Prose>{"For a complete building-block program, run "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/context-blocks.py"}>{"context-blocks.py"}</a>{" beside the supplied CSV. It defines an inverted residual block and an ASPP-style parallel context module, processes two real digit images through randomly initialized layers, and differentiates a scalar probe back to the stem. The mobile output is "}<InlineMath>{"2\\times8\\times8\\times8"}</InlineMath>{" and the context output "}<InlineMath>{"2\\times4\\times8\\times8"}</InlineMath>{". This demonstrates shape correspondence and gradient connectivity, not fitted segmentation accuracy. It uses rates 1 and 2 on the small map, four channels per context branch, and a projection input width derived from the actual number of branches. Two images keep the global branch's training-mode BatchNorm from receiving a singleton channel sample. The full segmentation system would additionally need an appropriate backbone, pixel labels, a supervised pixel loss and evaluation."}</Prose>

<DepthwiseProgram file="context-blocks.py" title="Read the inverted residual and parallel-context program" />

<H3>{"Deeper: what current mobile designs still ask"}</H3>

<Prose>{"These mechanisms remain design ingredients, not a finished universal recipe. MobileNetV4’s universal inverted bottleneck adds choices about where depthwise spatial operations sit around expansion/projection, so blocks can trade early downsampling, local mixing and memory traffic. Its paper also introduces a mobile-oriented attention block. The lesson to transfer is to draw the actual operation order and tensor areas before counting cost, then benchmark on the target device; a family name does not decide those quantities. Attention’s full mechanism belongs to its later lesson, and ConvNeXt next develops modern spatial/channel mixing choices."}</Prose>

<Prose><a href="https://arxiv.org/abs/2404.10518">MobileNetV4 (Qin et al., 2024)</a> is a concrete research extension of the inverted bottleneck; its architecture and deployment results should be read with their reported hardware and training conditions.</Prose>

<H2>{"6. A real experiment: compress a trained layer, then inspect the damage"}</H2>

<Prose>{"Section 5 built architectures designed around these operations. Now switch from hand-constructed strips to real handwritten digits to test a different question: what happens when we replace one already-trained dense layer by a constrained approximation? The small real images let us inspect both learned filters and actual class scores without inventing a performance curve. This is a model-compression question, different from training a new mobile architecture from scratch."}</Prose>

<Prose>{"We use 400 real optical digit images, 40 per label, from the UCI dataset distributed with scikit-learn. Each image is "}<InlineMath>{"8\\times8"}</InlineMath>{" with intensities 0–16; divide by 16. The "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/digits-400.csv"}>{"attributed offline CSV"}</a>{" and "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/data-provenance.md"}>{"provenance"}</a>{" make the experiment reproducible without a download. All 400 pixel vectors and source IDs were checked for exact duplicates before splitting. Writer IDs are unavailable, so this does not establish recognition of independent writers."}</Prose>

<Prose>{"The stratified split uses 280 training and 120 development images, seed 22. It is a teaching split inside a selected subset, not the original benchmark protocol and not an untouched final test. We inspect all candidates on development; a deployment claim would need a subsequent frozen evaluation."}</Prose>

<Prose>{"The model is deliberately small:"}</Prose>

<DigitPipelineFigure />

<Prose>{"The cyan image becomes eight learned stem maps. Only the next 8→12 spatial layer changes; its output grid and following ReLU remain fixed. Average pooling reduces each map to 4×4, flattening yields 192 values, and the unchanged linear head gives ten logits (unrestricted class scores). This is the exact model we compare, not the preceding lesson’s different architecture. In symbols:"}</Prose>

<div className="neural-equation"><MathBlock>{"1\\times8\\times8\n\\xrightarrow{\\;3\\times3,\\ 8;\\ \\mathrm{ReLU}\\;}\n8\\times8\\times8\n\\xrightarrow{\\;3\\times3,\\ 12;\\ \\mathrm{ReLU}\\;}\n12\\times8\\times8\n\\xrightarrow{\\;\\mathrm{average\\ pool}\\ 2\\;}\n12\\times4\\times4\n\\xrightarrow{\\;\\mathrm{flatten,\\ linear}\\;}\n10\\ \\text{logits}."}</MathBlock></div>

<Prose>{"We train it separately with dilation 1 or 2 in the second convolution, always padding by the dilation to preserve shape. Within each of seeds 1/2/3, weights initially match across the two models. Both have 2,886 parameters and 61,824 convolution/linear MACs per image. Adam, learning rate 0.003, runs 400 full-batch updates with no augmentation, dropout, normalization, weight decay or early stopping. All six final models classify all 280 training images correctly."}</Prose>

<H3>{"Factor only the trained second layer"}</H3>

<Prose>{"Section 2 showed why one pattern may be insufficient. To choose the best m patterns for a trained layer, collect the 12 output filters for one input channel into the rows of a 12 × 9 matrix. Here is that matrix for input channel 0 of the trained seed-1, dilation-1 model:"}</Prose>

<SvdMatrixFigure />

<Prose>{"Each row is one output channel’s 3 × 3 kernel for this input, flattened row by row into nine taps; amber cells are positive and blue negative. Section 2 showed that a depthwise pair with m patterns can produce such a matrix only if its rank is at most m. These twelve rows are not multiples of one another, so the question becomes which m patterns approximate them best. The same procedure is repeated independently for each of the eight input channels."}</Prose>

<Prose>{""}<strong>{"Singular value decomposition"}</strong>{", or SVD, writes such a matrix as a sum of independent rank-one patterns, ordered by strength. Keeping the first "}<InlineMath>{"m"}</InlineMath>{" patterns gives the smallest squared error between original and reconstructed weights among rank-at-most-"}<InlineMath>{"m"}</InlineMath>{" matrices. This statement concerns the weights; it does not minimize classification loss or guarantee better predictions as "}<InlineMath>{"m"}</InlineMath>{" increases."}</Prose>

<Prose>{"The singular values measure how much of the matrix each pattern carries. Here they are for this matrix, with the factor shapes for m = 2:"}</Prose>

<SvdSpectrumFigure kept={2} />

<Prose>{"The bars fall steadily but never reach zero: σ1 = 1.41 belongs to the strongest pattern and σ9 = 0.08 to the weakest. A pattern’s share of the weight energy (the sum of squared entries) is its σ², divided by the sum of all nine σ². Keeping two patterns retains 68% of it; one pattern keeps only 40%, and four keep 91%. In the factor drawing, the 12 × 9 matrix is approximated by P (12 × 2) times D (2 × 9). Each row of D, reshaped to 3 × 3, is one depthwise filter. Its signs are arbitrary: flipping a pattern and its mixing column together changes nothing."}</Prose>

<Prose>{"In terms of vectors, a right singular vector is a unit-length nine-tap spatial pattern vᵣ. Multiplying a patch by vᵣ measures how much of that pattern the patch contains. Its left singular vector uᵣ is a unit-length list of 12 output-channel coefficients. The singular value σᵣ scales that route: its contribution is σᵣuᵣ(vᵣᵀx). Thus set depthwise row Dᵣ=vᵣᵀ and mixing column Pᵣ=σᵣuᵣ. Summing these routes reconstructs W=Σᵣσᵣuᵣvᵣᵀ; keeping m routes gives P with shape 12×m and D with shape m×9. Left and right name their sides of the matrix product, not spatial directions on the image."}</Prose>

<Prose>{"The saved program puts the retained right singular vectors into depthwise filters and the scaled left vectors into pointwise mixing weights. It copies the old output bias to the pointwise layer, adds no activation between the factors, and retains the original ReLU after them. Everything else stays fixed. Multipliers 1, 2, 4 and 9 are declared before observing results. No compressed model is retrained."}</Prose>

<Prose>{"Why can a mathematically best weight approximation damage useful outputs? Consider a two-tap matrix "}<InlineMath>{"W=\\operatorname{diag}(4,3)"}</InlineMath>{". Its best rank-one approximation under squared weight-entry error keeps "}<InlineMath>{"\\operatorname{diag}(4,0)"}</InlineMath>{", discarding squared weight energy 9. Patch (100,0) is reproduced exactly as (400,0), but patch (0,10) changes from (0,30) to (0,0). The same discarded weights matter very differently for the two inputs. Frobenius error gives each weight entry equal importance; actual output error depends on which patches occur, and classification further depends on later layers and decision margins. Inspect input-dependent effects as well as the singular-value budget."}</Prose>

<Prose>{"Deeper: if the matrix has singular values σ₁≥σ₂≥…, truncation leaves squared Frobenius error Σ_{r>m}σ_r², the sum of σ² over the dashed bars. The Frobenius norm is the square root of the sum of squared entries."}</Prose>

<Prose>{"Why is this a best approximation? Orthonormal singular vectors have unit length and perpendicular directions, so squared route energies add without cross terms. A rank-at-most-m approximation can preserve at most m independent directions. The maximum energy any m-dimensional output subspace can capture is the sum of the largest m squared singular values; projecting onto their left singular vectors achieves it. Subtract that captured energy from Σᵣσᵣ² to obtain the unavoidable discarded sum. This is the Eckart–Young best low-rank approximation theorem."}</Prose>

<Prose>{"Tied singular values can give several equally good factors; singular-vector signs can flip without changing their product. Compare reconstructed kernels and outputs, not the factor signs."}</Prose>

<Prose>{"In the next statement, the vector 2-norm is Euclidean length (square root of summed squared coordinates); the matrix 2-norm is its largest amplification of a unit-length vector."}</Prose>

<div className="neural-equation"><MathBlock>{"\\lVert W_c-P_cD_c\\rVert_F^2=\\sum_{r>m}\\sigma_r^2,\\qquad \\lVert (W_c-P_cD_c)x_c\\rVert_2\\leq\\lVert W_c-P_cD_c\\rVert_2\\lVert x_c\\rVert_2."}</MathBlock></div>

<Prose>{"Here x_c is a flattened patch. The inequality follows because the matrix norm bounds amplification in every direction. It bounds one channel’s output error; add channel contributions for a full layer, then account for later operations. A classifier can change its chosen class when two logits were already close even if weight error is small. Data-aware compression instead weights errors by the patches that actually occur; fine-tuning can adapt downstream layers. Use training/calibration data for that adaptation, not a repeatedly inspected final test."}</Prose>

<Prose>{"Download "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/convolution-factorization.py"}>{"the complete training and factorization program"}</a>{" beside the CSV. In a Python environment with NumPy, scikit-learn and PyTorch:"}</Prose>

<CodeBlock language={"text"}>{"python convolution-factorization.py"}</CodeBlock>

<Prose>{"The program contains all imports, model definitions, split, training loop, SVD conversion, evaluation and result writing. It produces "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/calculated-inputs.json"}>{"calculated-inputs.json"}</a>{", including all six runs, development predictions, exact model costs and two saved seed-one dense states. The following is the key factor construction explained in isolation; it is an excerpt from that complete program:"}</Prose>

<DepthwiseProgram file="convolution-factorization.py" title="Read the complete training and SVD factorization program" />

<CodeBlock language={"python"}>{"matrix = layer.weight[:, channel].reshape(outputs, -1)\nleft, values, right = torch.linalg.svd(matrix, full_matrices=False)\ndepthwise.weight[start:start + multiplier, 0] = (\n    right[:multiplier].reshape(multiplier, height, width)\n)\npointwise.weight[:, start:start + multiplier, 0, 0] = (\n    left[:, :multiplier] * values[:multiplier]\n)"}</CodeBlock>

<Prose>{"There is one such assignment per input channel. The intermediate channels are ordered as all retained filters for input channel 0, then channel 1, and so forth. Grouped convolution and the reshape must agree on that ordering."}</Prose>

<H3>{"Results from the actual CPU run"}</H3>

<Prose>{"Each entry below is the number correct out of the "}<strong>{"same 120 development images"}</strong>{":"}</Prose>

<NeuralTable caption={"Development images correct (of 120) before and after SVD compression"} headers={[<>{"Seed"}</>,<>{"Dilation"}</>,<>{"Original dense"}</>,<>{""}<InlineMath>{"m=1"}</InlineMath>{""}</>,<>{""}<InlineMath>{"m=2"}</InlineMath>{""}</>,<>{""}<InlineMath>{"m=4"}</InlineMath>{""}</>,<>{""}<InlineMath>{"m=9"}</InlineMath>{""}</>]} rows={[[<>{"1"}</>,<>{"1"}</>,<>{"117"}</>,<>{"112"}</>,<>{"115"}</>,<>{"117"}</>,<>{"117"}</>],[<>{"1"}</>,<>{"2"}</>,<>{"115"}</>,<>{"95"}</>,<>{"110"}</>,<>{"113"}</>,<>{"115"}</>],[<>{"2"}</>,<>{"1"}</>,<>{"116"}</>,<>{"90"}</>,<>{"112"}</>,<>{"116"}</>,<>{"116"}</>],[<>{"2"}</>,<>{"2"}</>,<>{"116"}</>,<>{"56"}</>,<>{"96"}</>,<>{"112"}</>,<>{"116"}</>],[<>{"3"}</>,<>{"1"}</>,<>{"115"}</>,<>{"107"}</>,<>{"114"}</>,<>{"115"}</>,<>{"115"}</>],[<>{"3"}</>,<>{"2"}</>,<>{"115"}</>,<>{"98"}</>,<>{"106"}</>,<>{"114"}</>,<>{"115"}</>]]} />

<NeuralTable caption={"Whole-model parameters and MACs per image for each form"} headers={[<>{"Whole-model form"}</>,<>{"Parameters"}</>,<>{"Convolution/linear MACs/image"}</>]} rows={[[<>{"Original dense"}</>,<>{"2,886"}</>,<>{"61,824"}</>],[<>{""}<InlineMath>{"m=1"}</InlineMath>{""}</>,<>{"2,190"}</>,<>{"17,280"}</>],[<>{""}<InlineMath>{"m=2"}</InlineMath>{""}</>,<>{"2,358"}</>,<>{"28,032"}</>],[<>{""}<InlineMath>{"m=4"}</InlineMath>{""}</>,<>{"2,694"}</>,<>{"49,536"}</>],[<>{""}<InlineMath>{"m=9"}</InlineMath>{""}</>,<>{"3,534"}</>,<>{"103,296"}</>]]} />

<Prose>{"Rank one can make a drastic difference: seed 2 with dilation two drops from 116 to 56 correct. That is evidence against treating arbitrary depthwise replacement as function-preserving compression. It is not evidence that trained depthwise networks are inherently poor classifiers; we did not train these compressed networks for their new constraint."}</Prose>

<Prose>{"Rank nine recovers every per-channel "}<InlineMath>{"12\\times9"}</InlineMath>{" matrix, up to numerical error, and therefore recovers predictions. Its maximum absolute logit difference across all six runs is about "}<InlineMath>{"1.72\\times10^{-5}"}</InlineMath>{" in this float32 execution. It also costs more than the original layer. Exact reconstruction and worthwhile compression are distinct goals."}</Prose>

<Prose>{"Even equal accuracy can hide different confidence. Seed 1, dilation one has development cross-entropy 0.128695 before compression and 0.137114 at rank four, although both have 117 correct. Cross-entropy penalizes assigning low probability to the actual label; the count correct only records the largest logit. Inspect both."}</Prose>

<Prose>{"Inspect one diagnostic image from the saved seed-1, dilation-1 model: source 299, originally digit 1, whose dense and rank-one predictions disagree. This deliberate selection reveals a compression failure; the six-run table above retains both dilation settings and all seeds. Select a pixel in the image and change its normalized intensity, or compare the recorded multipliers. The weights stay fixed and inference updates live; no model is trained in the browser."}</Prose>

<DepthwiseDigitLab />

<Prose>{"The score bars distinguish dense and compressed results on the same input; their numeric table preserves all signs and differences. Now inspect the weight approximation itself. This second investigation uses the same seed-1, dilation-1 model but independent controls: choose one input/output channel pair and the number of retained patterns. Its multiplier does not change the image investigation above."}</Prose>

<DepthwiseDigitLab kind="kernel" />

<Prose>{"A sensible next experiment would fine-tune the compressed model using training data only, predeclare its update budget, then use development to assess the trade-off. Another would compare training the separable architecture from scratch. Neither experiment was run here, so the page does not supply imagined recovery curves. The six fits show a bounded mechanism and its variability, not a hardware benchmark or a general ranking of dilation rates."}</Prose>

<span id="reuse-the-spatial-operator-and-own-the-factorization" aria-hidden="true" />
<H2>{"Build on the convolution code, then write the factorization"}</H2>

<Prose>{"There are two different implementation tasks here. The spatial operator itself was built in the "}<a href={"/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals"}>{"Convolution, Pooling & Receptive Fields lesson"}</a>{": its "}<a href={"/learn-code/convolution-pooling-receptive-fields/convolution-experiments.py"}>{"convolution program, "}<code>{"direct_conv2d"}</code>{""}</a>{" computes the addresses for grouped and dilated filtering, and its "}<a href={"/learn-code/convolution-pooling-receptive-fields/convolution_pullbacks.py"}>{"pullback program"}</a>{" derives the batched dense derivatives. Reuse those operators rather than rewriting them; this lesson adds the factorization and sampling choices."}</Prose>

<Prose>{"The new piece is the decomposition. In "}<a href={"/learn-code/depthwise-separable-dilated-convolutions/convolution-factorization.py"}>{"convolution-factorization.py"}</a>{", "}<code>{"factor_spatial"}</code>{" takes an existing kernel, performs one truncated SVD per input channel, writes the depthwise and pointwise weights, and preserves the output bias. "}<code>{"reconstructed_weight"}</code>{" independently contracts the factors back into the dense tensor. The "}<code>{"nn.Conv2d(groups=in_channels)"}</code>{" route is the normal tool implementation, with intermediate channel order fixed as "}<code>{"input_channel * multiplier + component"}</code>{". The script compares reconstructed weights, outputs and the unchanged full model before interpreting prediction changes. "}<code>{"context-blocks.py"}</code>{" separately composes the inverted residual and parallel-context mechanisms already explained above."}</Prose>

<Prose>{"For I inputs, O outputs and K spatial taps, factoring all full O×K matrices costs O(I·min(O,K)²·max(O,K)) for a dense SVD; storing factors costs O(Im(K+O)). The multiplication benefit depends on m; raising m to full rank can remove approximation error while costing more than the original layer. How SVD itself is computed is taught in the "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu"}>{"Matrix Decompositions lesson"}</a>{"; here we call the library routine and check its result."}</Prose>

<Prose>{""}<strong>{"Take control:"}</strong>{" add a relative discarded-energy report before replacing a layer. For each input matrix, divide the sum of squares of discarded singular values by the sum of squares of all singular values; define the all-zero matrix's relative error as zero. Select the smallest per-input m meeting an energy budget, then decide whether to pad all groups to a common m or implement heterogeneous groups separately. A fixed grouped Conv2d expects equal intermediate multiplicity, so silently assigning variable ranks to its regular tensor layout is wrong."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The singular values already exist during factorization; use their squares, not their sum, for Frobenius reconstruction energy."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"For singular values [4, 3, 0], rank 1 leaves 9/25 = 0.36 relative squared error; rank 2 leaves zero. A 0.1 budget therefore needs rank 2. If two input channels need ranks 1 and 2, a regular multiplier-2 representation keeps the second slot of the first channel zero, or a custom grouped implementation must explicitly carry different slices. Verify reconstructed-weight error against the spectral sum, preserve bias/dilation/padding, and measure task outcomes separately from weight energy."}</Prose>

</details>

<H2>{"7. Diagnose before adding another architectural feature"}</H2>

<Prose>{"If a separable replacement changes predictions, first check whether it was intended to be an exact algebraic rewrite or an approximation. Confirm intermediate activations, bias transfer and channel ordering. Then inspect rank error, calibration/error slices and the opportunity for training adaptation."}</Prose>

<Prose>{"If a dilation change seems ineffective, inspect actual sampled positions on the actual map. A linear ramp can hide the difference; oversized rates can sample mostly padding; repeated rates can leave unreachable offsets. The receptive-field outline alone cannot distinguish these cases."}</Prose>

<Prose>{"If inference is slow despite fewer MACs, profile the deployed graph. Separate measured elapsed time from operation estimates, and include normalization, activation, memory transfers and kernel overhead. Warm up the actual implementation; synchronize asynchronous devices before timing; report shape, batch, dtype, device and software. This lesson supplies no latency ranking."}</Prose>

<Prose>{"If grouping fails, inspect divisibility. A 96-input, 128-output layer with 32 groups is valid: each group has 3 inputs and 4 outputs. Changing 128 outputs to 130 is invalid. Rounding widths to multiples of 8 for a hardware convention does not automatically make them divisible by every chosen group count."}</Prose>

<Prose>{"If RGB handling worries you, remember that pointwise mixing can combine color-channel responses. The real restriction is the spatial/channel factorization, not an inability to use colors. Whether that restriction is appropriate in an input stem is an empirical design question, not a universal prohibition."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"8. Practice on changed problems"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Follow a changed channel through the layer"}</H3>

<Prose>{"Use input channels A "}<InlineMath>{"[2,1,0]"}</InlineMath>{", B "}<InlineMath>{"[1,3,2]"}</InlineMath>{", spatial filters A "}<InlineMath>{"[1,2]"}</InlineMath>{", B "}<InlineMath>{"[-1,1]"}</InlineMath>{", and pointwise weights "}<InlineMath>{"[0.5,2]"}</InlineMath>{". Find both outputs. Then change A's final value from 0 to 4: which output changes, and by how much?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compute the two valid two-value patches in each channel before mixing. The final A value participates only in the second patch."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"A filters to "}<InlineMath>{"[4,1]"}</InlineMath>{" and B to "}<InlineMath>{"[2,-1]"}</InlineMath>{". Outputs are "}<InlineMath>{"[6,-1.5]"}</InlineMath>{". Editing A's last value changes its second filtered value from 1 to 9, so the second output increases by "}<InlineMath>{"0.5(8)=4"}</InlineMath>{" to 2.5. The first remains 6."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Budget expressiveness"}</H3>

<Prose>{"A "}<InlineMath>{"3\\times3"}</InlineMath>{" layer has 16 inputs and 24 outputs. Compare a dense layer with a separable pair using multiplier two. Ignore biases. Does a smaller parameter count prove equivalence or faster inference?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The multiplier repeats spatial filters and increases the input width of the pointwise layer. Count both."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Dense: "}<InlineMath>{"9(16)(24)=3456"}</InlineMath>{" weights. Separable: "}<InlineMath>{"16(2)(9+24)=1056"}</InlineMath>{". The effective per-input-channel rank is at most two, so an arbitrary dense layer need not be representable. Hardware execution and all other operations determine elapsed time."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Repair a misleading receptive field"}</H3>

<Prose>{"Two three-tap layers use rates 1 and 4. List reachable offsets, identify the gaps, and choose a replacement second rate that reaches every offset in a seven-position span."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Shift the first layer's set "}<InlineMath>{"\\{-1,0,1\\}"}</InlineMath>{" left, nowhere and right by the second rate."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Rates 1 and 4 reach "}<InlineMath>{"\\{-5,-4,-3,-1,0,1,3,4,5\\}"}</InlineMath>{" and miss −2,2 inside their eleven-position bound. Second rate 2 produces every offset −3 through 3, a seven-position span. The repaired field is smaller but fully covered."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Respect original-image units"}</H3>

<Prose>{"Incoming features have receptive-field width 7 and jump 2 input pixels. Add a kernel of size 3, dilation 3 and stride 2. Find the new field width and jump. Explain why "}<InlineMath>{"2(2\\cdot3+1)"}</InlineMath>{" is not the field width."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The new extreme taps enlarge an existing field; each incoming feature already summarizes several original pixels."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{""}<InlineMath>{"r'=7+(3-1)(3)(2)=19"}</InlineMath>{", and "}<InlineMath>{"j'=2(2)=4"}</InlineMath>{". Multiplying a seven-tap-span outline by the old jump gives 14, which ignores the incoming field width and conflates center spacing with the coverage of one feature."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Design the next compression experiment"}</H3>

<Prose>{"A rank-two replacement has worse development accuracy than the original, but fewer MACs. Propose an experiment that answers whether training adaptation can recover useful accuracy. Identify which data may drive updates and what evidence is still needed before a latency claim."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Fix what stays constant, predeclare what training changes, and separate the role of training examples from development examples."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Start from the same saved dense model and the declared rank-two conversion. Predeclare an optimizer, update budget and which layers may change. Fine-tune only on training images; retain the original and unadapted compressed models as baselines. Compare development counts, cross-entropy and relevant slices after the fixed run, and report all chosen seeds. Selecting a strategy on development consumes that evidence; later reporting needs a frozen evaluation. MAC reduction still requires a measured deployment timing comparison with documented device, software and input contract."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A spatial summary can miss a rearrangement"}</H3>

<Prose>{"An ASPP image-summary branch averages a channel whose "}<InlineMath>{"2\\times2"}</InlineMath>{" values are "}<InlineMath>{"[1,3;5,7]"}</InlineMath>{". Swap the top-left and bottom-right values. Can this branch alone identify the swap? Could a local branch respond differently?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The global branch sees a channel mean, while a local stencil sees values at particular offsets."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The mean remains 4, so the pooled vector and its deterministic projection remain identical. A local branch may change because the values at its sampled positions changed. A particular symmetric filter or location could still give the same result; dependency permits a change but does not guarantee one."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. An advanced construction challenge"}</H3>

<Prose>{"Using four serial three-tap, stride-one layers on an unbounded line, construct a gap-free schedule with the largest possible number of distinct reachable positions. State why the result is a structural upper bound, and why it may be unsuitable for an "}<InlineMath>{"8\\times8"}</InlineMath>{" feature map."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Each layer offers three tap choices per path. Use the interval construction to make those paths reach distinct offsets."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"There are "}<InlineMath>{"3^4=81"}</InlineMath>{" tap-choice paths, so at most 81 distinct positions can be reached. Rates 1,3,9,27 reach every integer from −40 to 40, attaining that bound. Finite maps invalidate the unbounded-input premise: many taps address padding, and the nominal span does not create new image information."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Count a grouped layer"}</H3>

<Prose>{"A 3×3 layer maps 64 channels to 64. Count its weights with groups 1, 8 and 64, ignoring biases. Which setting is depthwise? If you stack several layers with groups 8 and the same group assignment, what must you add so channels from different groups can interact?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Each output channel reads only the C_in/g input channels of its own group, through one 3×3 slice per input channel."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Groups 1: 9 × 64 × 64 = 36,864. Groups 8: 36,864 / 8 = 4,608. Groups 64: 576, and this is depthwise, because each output reads exactly one input channel. Stacked layers with the same assignment never mix groups. Add a dense 1×1 layer, or a channel shuffle between the grouped layers; how far a shuffle spreads information depends on the channel counts and the permutation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Why fewer MACs can still be slow"}</H3>

<Prose>{"At one output position, a 3×3 layer maps 64 channels to 64. Count the multiply-accumulates and the input values read for the dense layer and for a depthwise layer. How many MACs does each perform per input value read, and why might the depthwise layer not run 64 times faster?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Both layers read the same 3×3 window in every input channel. They differ in how many outputs reuse each value."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Both read 9 × 64 = 576 input values. Dense performs 9 × 64 × 64 = 36,864 MACs, 64 per value read; depthwise performs 576, one per value read. Depthwise does 64 times less arithmetic on the same data, so on many processors its time is dominated by moving data, not by multiplying: it is memory-bound, and its speed-up is far below 64. (This assumes the weights stay cached and are reused at every position; reuse of inputs across neighbouring positions changes the exact ratio but not the conclusion.)"}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Fit a rate to the map"}</H3>

<Prose>{"A 257 × 257 crop at output stride 16 gives a 17 × 17 feature map. A 3×3 branch with rate 12 runs on it. At the centre position (index 8), how many of the nine taps read real data? What is the largest rate that keeps all nine taps inside the map at the centre?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The taps sit at 8 − r, 8 and 8 + r along each axis; the map runs from index 0 to 16."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"With rate 12 the outer taps are at −4 and 20, outside 0–16 on both axes, so only the centre tap reads data: 1 of 9. The outer taps stay inside while 8 + r ≤ 16, so the largest such rate is 8. This is why output stride and crop size must be considered when choosing rates."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"9. Readiness and the next design question"}</H2>

<Prose>{"You are ready to continue when you can trace spatial filtering and channel mixing separately; state the rank restriction of a linear separable pair; calculate weights and MACs with the correct output shapes; count grouped weights and say why a layer with few MACs can still be memory-bound; distinguish dilation from stride; test sampled-site coverage instead of trusting a bounding rectangle; and check a dilation rate against the size of the map it runs on. In practice, you should also be able to identify whether an architectural change was retrained, whether its evaluation data was already used for selection, and whether a speed claim was actually measured."}</Prose>

<Prose>{"Next in the module is "}<strong>{""}<a href={"/learn/path/full-curriculum/convnext-modern-cnn-designs?module=deep-learning-fundamentals"}>{"ConvNeXt & Modern CNN Designs"}</a>{""}</strong>{". It builds on this distinction between spatial mixing and channel mixing, then changes normalization, activation placement, stage design and training. We will ask what evidence supports those changes rather than assuming a newer name explains the improvement."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning"><H3>Further learning</H3><ul><li>{""}<a href={"https://d2l.ai/chapter_convolutional-neural-networks/channels.html"}>{"Dive into Deep Learning: Multiple Input and Multiple Output Channels"}</a>{": an alternate visual and code route for the local channel operations and "}<InlineMath>{"1\\times1"}</InlineMath>{" mixing. Its full standard-convolution examples are especially useful before the factorization proof; the book's own environment setup differs from our self-contained files."}</li><li>{""}<a href={"https://distill.pub/2019/computing-receptive-fields/"}>{"Distill: Computing Receptive Fields"}</a>{": an interactive geometry explanation with derivations for size, location and multi-path networks. Pair the outline diagrams with this lesson's explicit sampled-site sets."}</li><li><a href="https://cs231n.github.io/convolutional-networks/">Stanford CS231n: Convolutional Neural Networks</a> — course notes with local connectivity, channel depth, output-size arithmetic and dilation. Use the geometry explanations alongside sections 1–3; its baseline notation and examples differ from our NCHW factorization. Its older dilation numbers count inserted gaps (0 for adjacent taps), whereas PyTorch and this page use tap spacing d (1 for adjacent taps): add one to that note’s gap count.</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://arxiv.org/abs/1704.04861"}>{"MobileNets V1, Howard et al."}</a>{": sections 3.1–3.4 explain separable filtering and width/resolution choices. Read after sections 1–2; its historical model and reported costs have a specific shape/training context."}</li><li>{""}<a href={"https://arxiv.org/abs/1610.02357"}>{"Xception, Chollet"}</a>{": section 4.7 is a useful contrasting activation-placement experiment. Its conclusion is about the tested architecture."}</li><li>{""}<a href={"https://arxiv.org/abs/1611.05431"}>{"ResNeXt, Xie et al."}</a>{" and "}<a href={"https://arxiv.org/abs/1707.01083"}>{"ShuffleNet, Zhang et al."}</a>{": grouped convolutions as the range between dense and depthwise layers, and channel shuffle as a cheap way to let groups exchange information. Read after section 2."}</li><li>{""}<a href={"https://arxiv.org/abs/1801.04381"}>{"MobileNet V2, Sandler et al."}</a>{": sections 3.2–3.4 and the block table explain linear bottlenecks and inverted residuals. Its geometric motivation needs more linear algebra than the first-pass route."}</li><li>{""}<a href={"https://arxiv.org/abs/1905.02244"}>{"Searching for MobileNet V3, Howard et al."}</a>{": section 5 distinguishes the hard gate from hard-swish and documents architecture-specific deployment decisions."}</li><li>{""}<a href={"https://arxiv.org/abs/1511.07122"}>{"Multi-Scale Context Aggregation by Dilated Convolutions, Yu and Koltun"}</a>{": sections 2–3 introduce the operator and a context module; later sections separate the front end and evaluation. Useful after drawing exact tap positions."}</li><li>{""}<a href={"https://arxiv.org/abs/1702.08502"}>{"Understanding Convolution for Semantic Segmentation, Wang et al."}</a>{": section 3.2 explains hybrid dilation and gap conditions. Use it with explicit support enumeration rather than reading its common-factor warning as a sufficient theorem."}</li><li>{""}<a href={"https://arxiv.org/abs/1706.05587"}>{"DeepLab V3"}</a>{" and "}<a href={"https://arxiv.org/abs/1802.02611"}>{"V3+"}</a>{": respectively, parallel context branches and a boundary-refining decoder. Keep versions, output stride and training protocol distinct."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.12/generated/torch.nn.Conv2d.html"}>{"PyTorch Conv2d reference"}</a>{" and "}<a href={"https://docs.pytorch.org/vision/main/_modules/torchvision/models/segmentation/deeplabv3.html"}>{"Torchvision ASPP source"}</a>{": API and implementation references, not substitutes for the mechanism. The former is versioned 2.12 documentation; the latter is a changing main-branch view. Their grouping, dilation and ASPP contracts were checked on 4 October 2026. Our saved calculations ran with PyTorch 2.14.0+cpu."}</li></ul></section>
  </div>,
};
