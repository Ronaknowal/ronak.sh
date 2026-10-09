// Production source (reading-flow revision: figures before their walk-through, no card chrome,
// minimal lab controls; earlier beginner and foundational-visual revisions preserved). Edit directly.
// The revision-4 manuscript under docs/teaching/drafts/ and its generator are historical inputs.
import { DenseFeatureReuseFigure, RegNetStageFigure, FrozenFeatureGradientFigure } from '../../components/lesson-labs/LandmarkFamilyIntuition.jsx';
import { DiagramKey, SmallNetworkAnatomy, LeNetAnatomy, AlexNetFigure, VggFigure, InceptionModuleFigure, ResidualBlockFigure, MbConvFigure, SqueezeExciteFigure, CompoundScalingFigure, RouteFamiliesFigure, DepthwiseFigure } from '../../components/lesson-labs/LandmarkAnatomyFigures.jsx';
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { LandmarkStrideFigure, LandmarkCompositionFigure, LandmarkBranchFigure, LandmarkHeadLab, LandmarkComparisonLab, LandmarkScoreLab, LandmarkRecordedMaps, LandmarkProgram, landmarkAsset } from '../../components/lesson-labs/LandmarkArchitectureLabs.jsx';
const convolutionLesson = '/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals';
const residualLesson = '/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals';
function CheckWithHint({ prompt, hint, answerLabel = 'Show the answer', children }) {
  return <div className="flow-check"><p><strong>Check:</strong> {prompt}</p><details><summary>Hint</summary>{hint}</details><details><summary>{answerLabel}</summary>{children}</details></div>;
}
export default {
 title: 'Landmark Architectures: LeNet, AlexNet, VGG, ResNet & EfficientNet',
 readTime: '~80 min read + code, investigations and practice; optional historical branches',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson landmark-lesson lesson-flow"><LessonIntro prerequisites="Convolution shapes and receptive fields, residual paths, normalization, dropout, initialization and the training loop. Each architectural mechanism and evidence boundary is refreshed where used." sections={[["1-learn-to-read-the-diagram-before-learning-the-names","1. Learn to read the diagram before learning the names"],["2-lenet-learn-local-features-and-combine-them","2. LeNet: learn local features and combine them"],["3-alexnet-and-vgg-make-richer-features-practical","3. AlexNet and VGG: make richer features practical"],["4-inception-and-resnet-change-the-routes-information-can-take","4. Inception and ResNet: change the routes information can take"],["5-efficientnet-separate-the-block-from-the-scaling-rule","5. EfficientNet: separate the block from the scaling rule"],["turn-the-architecture-diagram-into-a-complete-model","Turn the architecture diagram into a complete model"],["6-read-an-architecture-comparison-as-evidence","6. Read an architecture comparison as evidence"],["7-optional-additional-branches-in-the-architecture-family","7. Optional: additional branches in the architecture family"],["8-a-complete-small-architecture-investigation","8. A complete, small architecture investigation"],["9-how-can-a-class-score-become-a-spatial-map","9. How can a class score become a spatial map?"],["10-practice-and-diagnosis","10. Practice and diagnosis"],["11-what-you-should-now-be-able-to-do","11. What you should now be able to do"],["references-another-way-to-learn-it","References & another way to learn it"]]}>Read architectures as design decisions, build their complete compositions, then compare actual outcomes under explicit resource and data contracts.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Every family is drawn as an actual block: operation boxes, the tensor shape after each one, and where routes split and merge. Where a drawing has controls, they sit directly under it and change only what the paragraph above it discusses; the sentence under the controls reports what changed. The recorded comparison and saved feature maps in §§8–9 show existing evidence immediately."}</Prose>

<Prose>{"You can recognize a handwritten "}<strong>{"8"}</strong>{" even when one loop is wider than the other. A program receives a grid of numbers. How should its computation be arranged so that it can learn useful visual patterns, combine them, and make a decision within a resource budget?"}</Prose>

<Prose>{"An "}<strong>{"architecture"}</strong>{" is that arrangement: which operations run, the shapes they accept, and the connections through which information travels. Its weights are the numbers learned inside the arrangement. Changing the architecture changes what the model can express, how gradients reach its parameters, and what computation it requires. Changing the training recipe can also change its performance—even when the architecture stays identical."}</Prose>

<Prose>{"Building on "}<a href={convolutionLesson}>{"Convolution, Pooling & Receptive Fields"}</a>{", we will read famous networks as answers to concrete design questions. Then we will compare four small, fully specified networks on actual handwritten digits and inspect how their spatial features produce a class score."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" learn the diagram conventions in §1 and use them on every block in §§2–5; you should be able to point to each block's convolutions, activations, pooling, normalization, skip and classifier and follow one tensor through it. Read §6 on how to judge an architecture comparison, then run §8's investigation and work §§9–11. The detailed historical fidelity notes, the library-construction section and §7's additional families are deeper branches to return to. You need not memorize publication years or reproduce ImageNet training to become ready for the next topic."}</Prose>

<H2>{"1. Learn to read the diagram before learning the names"}</H2>

<Prose>{"For one image, a feature tensor has shape "}<strong>{"channels × height × width"}</strong>{", written "}<code>{"C × H × W"}</code>{". A channel is a learned map of responses, not necessarily a named concept such as “eye.” With several images, the leading batch axis gives "}<code>{"N × C × H × W"}</code>{"."}</Prose>

<Prose>{"Every famous network on this page is built from the same few operations you already know. A "}<a href={convolutionLesson}>{"convolution"}</a>{" slides one small learned filter over every position; a 1×1 convolution is the special case that only mixes channels at each position. An activation such as ReLU makes the computation nonlinear. Pooling or a strided convolution reduces the number of positions. "}<a href={"/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals"}>{"Normalization"}</a>{" rescales values; "}<a href={"/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals"}>{"dropout"}</a>{" zeroes random values during training. A final dense (linear) layer gives "}<strong>{"logits"}</strong>{", one unrestricted score per class. What distinguishes the landmark networks is how they arrange these operations. So before meeting any names, fix one way of drawing an arrangement. The "}<a href={convolutionLesson + '#cnn-pipeline'}>{"Convolution lesson's digit CNN"}</a>{" drew each tensor as a stack of squares and each operation as the arrow between two stacks. The key starts from that picture and zooms out:"}</Prose>

<DiagramKey />

<Prose>{"Read the key from the top. Its first row draws the same step twice: DigitCNN's first convolution as the Convolution lesson drew it, and the same step with this page's box and chips. The colours follow the rest of this module: cyan for supplied data, violet for computed values, amber for learned parameters, and a thick white outline for whatever you have selected. Below that are the four conventions every later drawing uses, then the tags that name each kind of operation box."}</Prose>

<Prose>{"Now a complete classifier drawn with those conventions. It is the small digit model we train in §8, so every number in it is real. Follow one image down the page: a single 8×8 grayscale digit becomes 12 response maps, is pooled to 4×4, passes through a body that keeps its 12 × 4 × 4 shape, becomes 16 maps of 2×2, is averaged to 16 numbers, and ends as 10 logits."}</Prose>

<SmallNetworkAnatomy />

<Prose>{"If you have just finished the Convolution lesson, this is a close cousin of its DigitCNN. That model went 1 → 8 channels, pooled, went 8 → 16 channels, pooled, then flattened 16 × 2 × 2 into 64 numbers for a linear layer (1,898 parameters). Here the stem makes 12 maps, a "}<strong>{"body"}</strong>{" slot sits between the two pooled stages, and the head averages each map instead of flattening it. Averaging is the global-average head §3 compares with VGG's flattening head."}</Prose>

<Prose>{"The labelled bands name the roles that every architecture on this page has. The "}<strong>{"stem"}</strong>{" receives pixels and makes the first local maps. The "}<strong>{"body"}</strong>{" is the part that differs between families; in a large network it is several "}<strong>{"stages"}</strong>{", each working at one spatial resolution, with a boundary that shrinks the grid and usually increases channels. Stem and stages together are the "}<strong>{"backbone"}</strong>{", the feature-producing portion. The "}<strong>{"tail"}</strong>{" is simply this small model's last feature stage: one more convolution and pool before the summary. The "}<strong>{"head"}</strong>{" turns the backbone's output into the answer the task needs: here a summary and a linear layer produce class scores; a detector's head would produce boxes. None of these operations knows what an “8” is before training. Softmax turns the ten logits into probabilities, cross-entropy penalizes giving little probability to the correct digit, and backpropagating that loss through every box is what shapes the weights."}</Prose>

<Prose>{""}<strong>{"Positions and channels are separate axes."}</strong>{" In the drawing, pooling halves height and width while leaving the channel count alone; the tail convolution changes channels from 12 to 16 while keeping 4×4 positions. Reading a chip as “channels × height × width” is what lets you predict a shape change from an operation's name. The same diagram will later hold AlexNet's 96 × 55 × 55 maps or EfficientNet's 1280 × 7 × 7 ones."}</Prose>

<H3>{"Count what one layer costs"}</H3>

<Prose>{"Each box in the drawing reports its learned parameters. That is only one of the costs an architecture choice changes. To see where the others come from, trace one output value of a convolution. The Convolution lesson's "}<a href={convolutionLesson + '#convolution-channels-stack'}>{"channel figure"}</a>{" drew one output reading a small window in every input channel; here is the same count at a realistic size."}</Prose>

<Prose>{"Take "}<code>{"64 → 128"}</code>{" channels, a 3×3 kernel and a 14×14 output grid. One output value, for one output channel at one position, reads a 3 × 3 window in each of the 64 input channels: "}<strong>{"576"}</strong>{" products added together. That output channel's filter is exactly those 576 weights, so 128 output channels need 576 × 128 = "}<strong>{"73,728"}</strong>{" bias-free weights. Every one of the 128 × 196 output values repeats its 576 products, so the layer performs 576 × 128 × 196 = "}<strong>{"14,450,688 MACs"}</strong>{" (multiply-accumulates). Each learned weight is reused at all 196 positions. That is why a parameter count cannot stand in for computation, and why pooling early makes later layers cheaper without touching their weights."}</Prose>

<Prose>{"Written generally, a dense "}<code>{"k × k"}</code>{" convolution with "}<code>{"C_in"}</code>{" input and "}<code>{"C_out"}</code>{" output channels stores"}</Prose>

<div className="neural-equation"><MathBlock>{"P=k^2C_{\\mathrm{in}}C_{\\mathrm{out}}+C_{\\mathrm{out}}"}</MathBlock></div>

<Prose>{"parameters when each output channel has a bias; omitting biases removes the final term. At "}<code>{"H_out × W_out"}</code>{" output positions, one image requires"}</Prose>

<div className="neural-equation"><MathBlock>{"M=H_{\\mathrm{out}}W_{\\mathrm{out}}k^2C_{\\mathrm{in}}C_{\\mathrm{out}}"}</MathBlock></div>

<Prose>{"convolution MACs. These counts omit bias addition, activation, normalization, pooling and other operations. Some reports count a multiply and add as two FLOPs; others report one combined operation. State the convention before comparing numbers. Three budgets are easily confused:"}</Prose>

<NeuralTable caption={"Three different budgets"} headers={[<>{"Quantity"}</>,<>{"What it counts"}</>,<>{"What changes it"}</>]} rows={[[<>{"Parameters"}</>,<>{"Stored learned scalar values"}</>,<>{"Width, kernels, connectivity, classifier dimensions"}</>],[<>{"Multiply-accumulates (MACs)"}</>,<>{"Products accumulated in convolution/linear outputs"}</>,<>{"Parameters "}<strong>{"and"}</strong>{" how many positions reuse them"}</>],[<>{"Runtime memory and elapsed time"}</>,<>{"What the actual execution needs"}</>,<>{"Shapes, batch, precision, activations, optimizer, operator implementations, device"}</>]]} />

<CheckWithHint prompt={"Double both channel counts of that layer while leaving the spatial grid unchanged. What happens to the bias-free weights, the convolution MACs and the number of output-map elements?"} hint={<Prose>{"Weights and MACs contain both channel dimensions. The output tensor contains only the output-channel dimension."}</Prose>} answerLabel="Worked reasoning">
<Prose>{"The weight and convolution-MAC counts multiply by four; the number of output-map elements only doubles. These quantities have different scaling laws."}</Prose>
</CheckWithHint>

<H2>{"2. LeNet: learn local features and combine them"}</H2>

<Prose>{"Start with the digit task. A small patch might contain a short stroke, a curve, or background. Convolution lets one detector inspect many possible locations. A later layer combines several learned response maps, so it can respond to a configuration of earlier patterns. Subsampling reduces the spatial representation before another round of processing."}</Prose>

<Prose>{"The 1998 LeNet-5 paper names its layers by role: "}<strong>{"C"}</strong>{" for convolution, "}<strong>{"S"}</strong>{" for subsampling (its version of pooling), "}<strong>{"F"}</strong>{" for fully connected. Drawn with this page's conventions, the whole network is one downward chain. Each box is a button: select it to open its arithmetic under it."}</Prose>

<LeNetAnatomy />

<Prose>{"Trace the first two steps. C1 slides six 5×5 filters over the 32×32 image. A filter fits in "}<code>{"32 − 5 + 1 = 28"}</code>{" positions along each axis without padding (“valid” placements), so each filter produces a 28×28 map. The six filters need "}<code>{"6 × (25 + 1) = 156"}</code>{" parameters, including biases, because one filter is shared by all 784 positions rather than learned separately for each patch. S2 then sums each non-overlapping 2×2 block, so every map halves to 14×14 while the six channels stay six."}</Prose>

<Prose>{"Notice C5: a 5×5 convolution applied to a 5×5 map has one output location. On this input size, it behaves like a fully connected operation over that map. The operation still has spatial meaning: on a larger incoming map, the same convolution would slide over multiple locations. A shape can make two implementations coincide without making them interchangeable for every input."}</Prose>

<Prose>{"The historical model used learned subsampling coefficients, partially connected C3 channels, scaled tanh activations, and an output based on distances to class templates. Many modern “LeNet” tutorials replace these with average pooling, fully connected channel mixing and a linear classifier. Those adaptations are useful if labeled as adaptations. The architecture figure and historical details come from "}<a href={"https://gwern.net/doc/ai/nn/cnn/1998-lecun.pdf"}>{"LeCun and colleagues, §II.B"}</a>{"."}</Prose>

<Prose>{""}<strong>{"What to carry forward:"}</strong>{" the network learns a hierarchy of spatial features, and the classification loss trains that hierarchy jointly. “Early edges, later objects” can be an intuition for some learned networks; it is not a guarantee that every channel has a clean human label."}</Prose>

<Prose>{""}<strong>{"Optional historical connection."}</strong>{" The same paper connects character recognition to a larger document-reading system. A good isolated digit recognizer still needs field extraction, segmentation and contextual decisions to read a complete check. This distinction returns in modern systems: a backbone is a component, while the deployed task is an entire pipeline."}</Prose>

<H2>{"3. AlexNet and VGG: make richer features practical"}</H2>

<H3>{"AlexNet: architecture and training work together"}</H3>

<Prose>{"Recognizing varied color photographs needs more representational capacity than recognizing centered digits. AlexNet combined five convolutional and three fully connected learned layers with ReLU, augmentation, dropout and GPU training. ReLU preserves positive inputs and sets negative ones to zero; its positive-side derivative avoids the saturation of a large positive tanh input. Negative ReLU inputs still have zero derivative."}</Prose>

<Prose>{"Start with the first layer, because its picture holds two different grids. A simplified, explicit geometry example uses a 227×227 RGB input and 96 filters of size 11, stride 4, no padding, followed by a size 3, stride 2 max pool:"}</Prose>

<LandmarkStrideFigure />

<Prose>{"The top row shows two neighbouring windows of the first convolution. Each reads 11 image pixels along an axis, and the next one starts four pixels later. Counting how many starts fit gives the output size:"}</Prose>

<div className="neural-equation"><MathBlock>{"H_{\\mathrm{out}}=\\left\\lfloor\\frac{227-11}{4}\\right\\rfloor+1=55."}</MathBlock></div>

<Prose>{"The bottom row is a different grid: it counts convolution outputs, not pixels. The pool groups 3×3 convolution responses and steps two at a time, giving 27 positions. The pool reduces the number of positions; it does not turn 96 channels into 27 channels."}</Prose>

<Prose>{"Now the whole network. The stack below follows the paper's §3.5 description with the 227-pixel geometry, which is the familiar teaching variant in the "}<a href={"https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture9.pdf"}>{"Stanford architecture lecture"}</a>{" (the paper says 224, which does not divide evenly under stride 4). Read it as three phases: two convolutions that each shrink the grid and are followed by normalization and pooling, three 3×3 convolutions at 13×13 with no pooling between them, then three dense layers."}</Prose>

<AlexNetFigure />

<Prose>{"Three parts of the drawing are new relative to LeNet. "}<strong>{"Local response normalization"}</strong>{" divides each value by a quantity computed from the same position in a few neighbouring channels, so strongly responding channels damp their neighbours; the paper applies it after the first two convolutions, and modern variants usually omit it. "}<strong>{"Dropout"}</strong>{" sits only in the first two dense layers, which hold 54.5 million of the parameters. The "}<strong>{"two-GPU split"}</strong>{" was a memory workaround: each GPU held half the filters, and only conv3 and the dense layers read both halves. That grouping is why counting the paper's kernel shapes gives 60,965,224 parameters, while Torchvision's single-device variant with 64/192/384/256/256 filters has 61,100,840. A model called “AlexNet” is therefore not a sufficient implementation specification."}</Prose>

<Prose>{"The historical result also illustrates a measurement trap. In the original paper's ILSVRC 2012 table, one CNN has 18.2% validation top-5 error; five CNNs have 16.4%; the seven-network submission involving extra pretraining has 15.3% test error. These are different evaluation setups. Do not place 16.4 on a graph labeled “the winning single model.” "}<a href={"https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks.pdf"}>{"Krizhevsky, Sutskever and Hinton, §§3–6 and Table 2"}</a>{"."}</Prose>

<H3>{"VGG: compose small filters"}</H3>

<Prose>{"AlexNet chose a different kernel for almost every layer. VGG asks whether one small kernel, repeated, can do the same job. Stack two 3×3 convolutions at stride 1 and select any intermediate position to see which input cells it reads:"}</Prose>

<LandmarkCompositionFigure />

<Prose>{"Why do two 3×3 layers reach a 5×5 input region? The first layer reaches one pixel either side of its output center. The second reaches one first-layer position either side; each of those already depends on a 3×3 input region. The radius becomes 2. Three 3×3 layers give radius 3 and a 7×7 support."}</Prose>

<Prose>{"Now count weights. Suppose every layer keeps "}<code>{"C"}</code>{" channels, stride 1 and the spatial grid. One 5×5 convolution has 25C² weights. Two 3×3 convolutions have 18C² weights, with an activation between them."}</Prose>

<Prose>{"The same support does "}<strong>{"not"}</strong>{" mean the same function. The intermediate representation and activation create a different computation. Nor is the saving automatic when the intermediate width changes: "}<code>{"9 C_in C_mid + 9 C_mid C_out"}</code>{" must be compared with "}<code>{"25 C_in C_out"}</code>{"."}</Prose>

<NeuralTable caption="Equal support does not imply equal computation" headers={['Route', 'Bias-free weights', 'Interior support']} rows={[['One 5 × 5, C → C', '25C²', '5 × 5'], ['Two 3 × 3, C → C → C', '18C²', '5 × 5'], ['Two 3 × 3, C → 2C → C', '36C²', '5 × 5']]} />

<Prose>{"VGG-16 builds a whole network from that one 3×3 block, repeated in five stages and followed by three dense layers. Follow the grid down the drawing:"}</Prose>

<VggFigure />

<Prose>{"Read the stages from the top. They repeat the block "}<strong>{"2, 2, 3, 3, 3"}</strong>{" times with channel widths "}<strong>{"64, 128, 256, 512, 512"}</strong>{", 13 convolutional layers in all; the three dense layers make 16 learned layers. Inside a stage every convolution uses padding 1, so the grid is unchanged until the stage's 2×2 max pool halves it: 224 → 112 → 56 → 28 → 14 → 7. Compared with AlexNet's drawing above, the individually designed layers are replaced by one block and a repetition count; the table under the drawing lines the two up. "}<a href={"https://arxiv.org/pdf/1409.1556"}>{"VGG paper, §2 and Table 1"}</a>{"."}</Prose>

<Prose>{"This regular layout is easy to reason about, but the stage counts in the drawing already show where the cost moves. Stage 5 holds 7,079,424 convolution parameters at only 14×14 positions, and the head after it is larger than the entire trunk:"}</Prose>

<NeuralTable caption={"VGG-16 parameters by part"} headers={[<>{"Part"}</>,<>{"Exact parameters"}</>]} rows={[[<>{"Convolutional trunk"}</>,<>{"14,714,688"}</>],[<>{""}<code>{"7×7×512 → 4096"}</code>{""}</>,<>{"102,764,544"}</>],[<>{""}<code>{"4096 → 4096"}</code>{""}</>,<>{"16,781,312"}</>],[<>{""}<code>{"4096 → 1000"}</code>{""}</>,<>{"4,097,000"}</>],[<>{"Total"}</>,<>{"138,357,544"}</>]]} />

<Prose>{"The first dense layer alone has over 102 million parameters. The "}<strong>{"whole head"}</strong>{", not that one layer, has 123,642,856. The total agrees with the "}<a href={"https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.vgg16.html"}>{"Torchvision VGG-16 model specification"}</a>{"."}</Prose>

<Prose>{"Why is the head so large, and what would a different head cost? The bars below compare the original head, a head you choose, and a global-average head on the same 512 final channels and 1,000 classes. Choose a head and change the final grid size:"}</Prose>

<LandmarkHeadLab />

<Prose>{"The flattened heads read every position of every channel, so their first layer grows with the grid area: at 7×7 the input is 49 times wider than the channel count. The global-average alternative has "}<strong>{"513,000"}</strong>{" head parameters at any grid size. It keeps one average per channel and discards within-channel spatial arrangement at this boundary, while a flattened head can weight different positions differently. Averaging has no learned parameters; the following classifier still learns combinations of channels. At a 1×1 grid the flattened and averaged heads read the same 512 numbers and have the same count. The arithmetic alone cannot tell which head will learn the better classifier."}</Prose>

<Prose>{"For scale, storing VGG's first dense layer as float32 weights, gradients and two float32 Adam moment arrays requires 1,644,232,704 bytes for those four arrays. Activations, other layers and execution buffers are additional. This is an exact storage estimate under the stated representation, not a claim that a particular GPU will run out of memory."}</Prose>

<H2>{"4. Inception and ResNet: change the routes information can take"}</H2>

<H3>{"Inception: parallel views, then concatenate"}</H3>

<Prose>{"VGG chose one filter size for every layer. But a stroke detail and the arrangement of a whole loop live at different scales, and a designer cannot know in advance which size each layer needs. GoogLeNet's answer is to run several sizes "}<strong>{"side by side"}</strong>{" on the same input and let training decide how to use them. Its inception module sends the previous layer's output down four branches (a 1×1, a 3×3 and a 5×5 convolution, and a 3×3 max pool) and then "}<strong>{"concatenates"}</strong>{" their outputs: it stacks them as separate channel ranges, without averaging or adding them."}</Prose>

<Prose>{"The drawing is the actual first module of GoogLeNet, inception (3a), from the paper's Table 1. Its input has 192 channels on a 28×28 grid. It opens on the "}<strong>{"naive"}</strong>{" version, the paper's Figure 2(a): read the weight count under each box. Then switch to the version with 1×1 reductions, Figure 2(b), with the control under the drawing."}</Prose>

<InceptionModuleFigure />

<Prose>{"Why the naive version fails: its 3×3 and 5×5 branches read all 192 input channels, so the 5×5 branch alone needs "}<code>{"25 × 192 × 32 = 153,600"}</code>{" weights. Its pool branch has no weights but passes all 192 channels through, so the module's output widens to 64 + 128 + 32 + 192 = 416 channels, and the next module's branches would read even more. The fix is the "}<a href={convolutionLesson}>{"1×1 convolution"}</a>{", which mixes channels at each position without looking at neighbours. Placed first, it squeezes 192 channels to 16 before the 5×5 filter, so that branch costs "}<code>{"192 × 16 + 25 × 16 × 32 = 15,872"}</code>{" weights. After the pool it projects 192 channels down to 32. The whole module drops from 387,072 to 163,328 weights, and its output is a fixed 256 channels."}</Prose>

<Prose>{"Two constraints make the merge work. Every branch keeps the 28×28 grid (padding for the 3×3 and 5×5 convolutions, stride 1 for the pool), because concatenation along channels requires matching positions. And the reduction is not free: squeezing to 16 channels limits what the 5×5 filter can see. “Cheaper” is established arithmetic; whether enough useful information survives is what training on the task decides. The paper also applies ReLU after every convolution, including the reductions."}</Prose>

<Prose>{"Two numbers in other sources will not match the drawing exactly. The paper's Table 1 prints 159K parameters for this module, while its 128M operations match 784 positions × 163,328 weights, the count of the filter shapes it lists. Torchvision's "}<code>{"googlenet"}</code>{" uses a 3×3 convolution in the “5×5” branch, so its "}<code>{"inception3a"}</code>{" has 155,136 convolution weights."}</Prose>

<Prose>{"GoogLeNet combined these branches with other design and training choices. The paper acknowledges earlier work on 1×1 channel networks; it did not invent that operation in isolation. "}<a href={"https://arxiv.org/pdf/1409.4842"}>{"Szegedy and colleagues, §§4–5"}</a>{"."}</Prose>

<H3>{"ResNet: refine a representation through addition"}</H3>

<Prose>{"Inception widened a module sideways. ResNet changes a different route: it lets a block's input skip around the block's layers and be added back to their output. Here is ResNet-18's basic block, drawn with the conventions of the "}<a href={residualLesson + '#residual-block-anatomy'}>{"Residual Connections lesson's block anatomy"}</a>{": the same branch of layers, identity skip and addition. That lesson draws the skip on the left; here the branch is the column of boxes and the skip is the dashed rail beside it, which the key introduced."}</Prose>

<ResidualBlockFigure />

<Prose>{"Follow x through it. The branch applies two 3×3 convolutions, each followed by BatchNorm, with a ReLU between them. The skip carries x around both. The ⊕ adds the two 64 × 56 × 56 tensors entry by entry, and one more ReLU follows the addition. This is the original “post-activation” order."}</Prose>

<Prose>{"Switch the drawing to the block that changes shape. At a stage boundary the branch's first convolution uses stride 2 and doubles the channels, so F(x) is 128 × 28 × 28 while x is still 64 × 56 × 56. They cannot be added. The skip therefore becomes a learned 1×1 convolution with stride 2 (a "}<strong>{"projection"}</strong>{"), costing 8,448 of the block's 230,144 parameters. Only a few blocks per network need it; every other block keeps the free identity skip."}</Prose>

<Prose>{"Now switch to the bottleneck. ResNet-50 reuses Inception's trick inside the branch: a 1×1 reduction, 3×3 processing at the narrow width, then a 1×1 expansion back to the width of x so the addition still matches. For 256→64→64→256, the convolutions use"}</Prose>

<div className="neural-equation"><MathBlock>{"256(64)+9(64)(64)+64(256)=69{,}632"}</MathBlock></div>

<Prose>{"weights. Two dense 3×3 convolutions at 256 channels use 1,179,648. Both return 256 channels, but their internal capacities differ. The figure's 70,400 for the whole block adds the BatchNorm scales and shifts, 2 × (64 + 64 + 256) = 768, to those 69,632 convolution weights."}</Prose>

<Prose>{"Whichever variant you choose, the block computes the same rule. Written as an equation,"}</Prose>

<div className="neural-equation"><MathBlock>{"y=x+F(x)."}</MathBlock></div>

<Prose>{"The branch "}<code>{"F"}</code>{" learns a change to the incoming representation. If the desired transformation is close to identity, a small branch output can supply it. Backpropagation also gets a direct contribution through the identity path:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial y}{\\partial x}=I+\\frac{\\partial F}{\\partial x}."}</MathBlock></div>

<Prose>{"This helps explain the design; it does not guarantee that gradients cannot cancel or that any depth trains successfully. The preceding "}<a href={residualLesson}>{"Residual Connections lesson"}</a>{" examines those limits."}</Prose>

<Prose>{"Inception and ResNet now use the two different merges from the diagram key. Both merges need the same batch and spatial positions; they differ in what happens to the channel axis. Compare them on the smallest possible example:"}</Prose>

<LandmarkBranchFigure />

<Prose>{"Addition combines corresponding entries, so the width stays the same and the two sources can no longer be told apart. Concatenation keeps both sources in separate channel ranges, so the width grows and a later layer can weight them differently."}</Prose>

<Prose>{"ResNet's motivating "}<strong>{"degradation"}</strong>{" observation was increased "}<strong>{"training"}</strong>{" error in deeper plain networks. Calling it merely overfitting misses the optimization issue. The paper compares matched plain and residual variants; a record score also depends on its training and evaluation recipe. "}<a href={"https://arxiv.org/pdf/1512.03385"}>{"He and colleagues, introduction and §3"}</a>{"."}</Prose>

<H2>{"5. EfficientNet: separate the block from the scaling rule"}</H2>

<Prose>{"Two questions are involved: "}<strong>{"what should one block do"}</strong>{", and "}<strong>{"how should a good base network grow"}</strong>{"?"}</Prose>

<H3>{"Spatial filtering and channel mixing"}</H3>

<Prose>{"Every convolution so far reads all its input channels at every position of its window. A "}<strong>{"depthwise"}</strong>{" convolution gives each channel its own spatial filter and never mixes channels; a pointwise 1×1 convolution then does the mixing. Compare which inputs each output reads:"}</Prose>

<DepthwiseFigure />

<Prose>{"With one spatial filter per input channel, the bias-free 3×3 depthwise-plus-pointwise pair uses"}</Prose>

<div className="neural-equation"><MathBlock>{"9C_{\\mathrm{in}}+C_{\\mathrm{in}}C_{\\mathrm{out}}"}</MathBlock></div>

<Prose>{"weights. For 64→128 this is 8,768, compared with 73,728 for a dense 3×3 convolution. At 14×14 it uses 1,718,528 convolution MACs. That is about 8.41 times fewer, not a measured 8.41 times lower latency. The factorization imposes a restriction on the spatial filters that each output can use. The next topic develops that restriction explicitly. "}<a href={"https://arxiv.org/pdf/1704.04861"}>{"MobileNet V1, §3"}</a>{"."}</Prose>

<H3>{"Squeeze-and-excitation: use the image's context to gate channels"}</H3>

<Prose>{"Every convolution so far applies the same learned weights to every image. Yet whether a channel is useful can depend on the whole image: a channel that responds to a fine repeated texture may matter more when the whole image is covered in that texture. An "}<strong>{"SE gate"}</strong>{" (squeeze-and-excitation) lets each image adjust its own channels. It summarizes each channel by one number, feeds those summaries to a tiny learned network, and multiplies each channel by the resulting gate. The paper's Figure 1 draws this as a squeeze to one value per channel, an excitation to one weight per channel, and a scaling of the original maps. Here are the same four steps on a two-channel example you can check by hand. Its cells are value grids, coloured by sign like every value grid in this module (amber positive, blue negative, every cell numbered); the controls under it change channel B's values and rearrange channel A's cells:"}</Prose>

<SqueezeExciteFigure />

<Prose>{"Now the same steps as formulas. For maps "}<code>{"U[c,h,w]"}</code>{", the squeeze averages each channel:"}</Prose>

<div className="neural-equation"><MathBlock>{"s_c=\\frac{1}{HW}\\sum_{h,w}U_{c,h,w}."}</MathBlock></div>

<Prose>{"The excitation passes that summary through a small learned network, and the scale step multiplies each channel by its gate:"}</Prose>

<div className="neural-equation"><MathBlock>{"g=\\operatorname{sigmoid}\\!\\left(W_2\\operatorname{ReLU}(W_1s+b_1)+b_2\\right),\n\\qquad V_{c,h,w}=g_cU_{c,h,w}."}</MathBlock></div>

<Prose>{"Match the symbols to the figure: "}<code>{"s"}</code>{" is step 2's list of channel averages; "}<code>{"W₁, b₁, W₂, b₂"}</code>{" are the tiny network of step 3; "}<code>{"g"}</code>{" is its vector of gates; "}<code>{"V"}</code>{" is step 4's scaled maps. "}<code>{"W₁"}</code>{" usually narrows the C summaries to C/r hidden units, with r = 16 in the SE paper. EfficientNet-B0 instead narrows to a quarter of the block's input width, which is why the MBConv block in the next subsection uses 144 → 6 → 144 for a 24-channel block."}</Prose>

<Prose>{"The gate is constant across positions within a channel but can differ between images. Sigmoid multipliers lie between 0 and 1, so they change the relative contribution of channels. A conventional convolution already mixes channels with unequal learned weights. What SE adds is "}<strong>{"input-dependent"}</strong>{" modulation. "}<a href={"https://arxiv.org/pdf/1709.01507"}>{"SE paper, §3"}</a>{"."}</Prose>

<Prose>{"In the figure's example, the hidden unit is "}<code>{"h = max(a − b, 0)"}</code>{" with gate logits "}<code>{"[h, −h]"}</code>{". Set every cell of channel B to 3: the hidden unit becomes 0 and both gates become 0.5. Changing one channel's global content changed "}<em>{"another"}</em>{" channel's multiplier. Now switch channel A's cells to 0, 4, 2, 2: its mean is still 2, so neither gate moves. The gate sees each channel only through its average."}</Prose>

<H3>{"MBConv: a narrow skip around a wide block"}</H3>

<Prose>{"Now put depthwise filtering and the SE gate into one block. Depthwise filtering is cheap per channel, which suggests a different block shape: keep the representation narrow between blocks and widen it only inside. The drawing is one real block from EfficientNet-B0's third stage, which works on 24 channels at 56×56 and expands them six-fold to 144. Its control switches to the ResNet bottleneck from §4 for comparison."}</Prose>

<MbConvFigure />

<Prose>{"This is the "}<strong>{"inverted bottleneck"}</strong>{" (MobileNet V2's MBConv, EfficientNet's main block). Read the branch down: a 1×1 convolution expands 24 channels to 144, a depthwise 3×3 filters each expanded channel on its own, and another 1×1 projects back to 24; the skip joins the narrow input to the narrow output. The bar under each box shows its output width relative to the widest channel count in the block, like the layer thickness in MobileNet V2's Figure 3. Trace the widths: 24 → 144 → 144 → 144 → 24. Switch to the ResNet bottleneck and the pattern reverses, 256 → 64 → 64 → 256, with the skip joining the wide ends."}</Prose>

<Prose>{"Two details in the MBConv drawing are deliberate. The squeeze-and-excitation gate from the previous subsection sits between the depthwise filter and the projection; here it squeezes 144 channels to 6, a quarter of the block's 24-channel input. The final 1×1 projection has "}<strong>{"no activation"}</strong>{" after it (a “linear bottleneck”): a ReLU applied to only 24 channels would zero every negative coordinate, and with so few channels that can destroy information the next block needs. The whole block is still nonlinear because of the two SiLUs inside it. SiLU, x × sigmoid(x), is a smooth relative of ReLU: close to x for large positive inputs, close to 0 for large negative ones, with a small dip in between. MobileNet V2's §3 and Figure 3 motivate this choice and evaluate it. "}<a href={"https://arxiv.org/pdf/1801.04381"}>{"MobileNet V2, §3"}</a>{"."}</Prose>

<H3>{"Compound scaling: spend additional resources deliberately"}</H3>

<Prose>{"EfficientNet-B0 combines mobile inverted bottlenecks with SE in a staged backbone. Its base-network search optimizes accuracy and FLOPs; the paper explicitly distinguishes this from targeting a particular device's latency. Its other central idea is to scale depth, width and input resolution together. "}<a href={"https://proceedings.mlr.press/v97/tan19a/tan19a.pdf"}>{"EfficientNet, §§3–4"}</a>{"."}</Prose>

<Prose>{"Given a good base network and more compute, there are three dials, drawn below the way the paper's Figure 2 draws them. "}<strong>{"Width"}</strong>{" makes every layer's bar longer (more channels). "}<strong>{"Depth"}</strong>{" adds layers. "}<strong>{"Resolution"}</strong>{" feeds a larger image. With the controls under the drawing, turn one dial at a time, then all three. The paper's intuition for turning them together: a larger image needs more layers to give each output a wide enough receptive field, and more channels to capture its finer patterns."}</Prose>

<CompoundScalingFigure />

<Prose>{"To count what each dial costs, imagine a family dominated by same-width dense convolutions. If depth is multiplied by "}<code>{"d"}</code>{", both channel dimensions by "}<code>{"w"}</code>{", and both spatial dimensions by "}<code>{"r"}</code>{", then"}</Prose>

<div className="neural-equation"><MathBlock>{"\\text{parameters}\\ \\propto dw^2,\\qquad\n\\text{convolution MACs}\\ \\propto dw^2r^2."}</MathBlock></div>

<Prose>{"Increasing resolution gives more input positions to analyze; increasing depth supplies more successive transformations; increasing width supplies more features at each stage. None alone guarantees better development performance. The same twofold MAC budget can be spent three ways, with different parameter costs:"}</Prose>

<NeuralTable caption="Same idealized twofold MAC budget, different parameter allocation" headers={['Allocation', 'd', 'w', 'r', 'Parameters', 'MACs']} rows={[['Depth', 2, 1, 1, 2, 2], ['Width', 1, '√2', 1, 2, 2], ['Resolution', 1, 1, '√2', 1, 2]]} />

<Prose>{"Check the width row by hand: with d = r = 1, doubling MACs needs w² = 2, so w = √2 ≈ 1.414, and parameters, which scale as d·w², also double. The resolution row doubles MACs without adding a single parameter."}</Prose>

<Prose>{"Compound scaling writes "}<code>{"d=α^φ, w=β^φ, r=γ^φ"}</code>{". Choosing "}<code>{"αβ²γ²≈2"}</code>{" makes one increment of "}<code>{"φ"}</code>{" approximately double this model's convolution work. The paper reports coefficients 1.2, 1.1, 1.15 from a search around B0. Their actual product is "}<strong>{"1.92027"}</strong>{", not exactly 2. At "}<code>{"φ=2"}</code>{", the idealized parameter multiplier is 2.108304 and the MAC multiplier is approximately 3.687437."}</Prose>

<Prose>{"Do not identify every named B-index with that integer "}<code>{"φ"}</code>{" and then present the approximation as an exact model count. Implementations round channels and repeat counts; depthwise, pointwise, SE, stem and classifier terms do not all scale with the same exponents. Input resolution changes MACs without directly changing stored convolution weights."}</Prose>

<Prose>{""}<strong>{"Looking back over §§2–5."}</strong>{" Each family kept most of what came before and changed one thing about the route information takes. Drawn with the same conventions, the six moves are:"}</Prose>

<RouteFamiliesFigure />

<Prose>{"These are design moves, not a strict ladder: EfficientNet still uses convolutions and a skip, and a VGG-style chain remains a sound baseline."}</Prose>

<H2>{"Turn the architecture diagram into a complete model"}</H2>

<Prose>{"The small digit comparison later in this page isolates routing decisions. To also build the named families, "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/landmark_builders.py"}>{"landmark_builders.py"}</a>{" supplies complete model constructors from ordinary "}<code>{"nn.Conv2d"}</code>{", normalization, activation, pooling and linear primitives. Their internal operations have already been opened in the preceding convolution, normalization, residual and dropout lessons. Here the new mechanism is "}<strong>{"composition"}</strong>{": stage widths, repetition counts, downsampling locations, parallel channel gating and the final head."}</Prose>

<NeuralTable caption={"The five explicit builders"} headers={[<>{"Builder"}</>,<>{"Exact declared construction"}</>]} rows={[[<>{""}<code>{"lenet"}</code>{""}</>,<>{"32×32 single-channel dense-convolution/tanh/average-pool model with 6 and 16 maps, followed by a 120 → 84 → class head; the modern variant contrasted with original LeNet-5 above"}</>],[<>{""}<code>{"alexnet"}</code>{""}</>,<>{"Torchvision-style 64/192/384/256/256 feature widths, 11/5/3/3/3 kernels and 6×6 adaptive head grid; not the historical two-device grouping/LRN recipe"}</>],[<>{""}<code>{"vgg16"}</code>{""}</>,<>{"2/2/3/3/3 convolution repetitions and the complete 7×7×512 → 4096 → 4096 → class head"}</>],[<>{""}<code>{"resnet18"}</code>{""}</>,<>{"Explicit two-convolution post-activation blocks; stride/projection on each changing stage; global pooling and class head"}</>],[<>{""}<code>{"efficientnet_b0"}</code>{""}</>,<>{"All seven B0 stage configurations, expansion/depthwise/SE/projection, per-example branch dropping and 1280-channel head"}</>]]} />

<Prose>{""}<strong>{"Deeper branch: the complete named models."}</strong>{" Every builder returns a trainable "}<code>{"nn.Module"}</code>{", not a call to a hidden model factory. Read "}<code>{"ResidualBlock"}</code>{" beside §4's ResNet block drawing and "}<code>{"MobileBlock"}</code>{" beside §5's MBConv drawing: each "}<code>{"nn.Conv2d"}</code>{", "}<code>{"nn.BatchNorm2d"}</code>{" and activation in "}<code>{"forward"}</code>{" corresponds to one box, and the "}<code>{"+"}</code>{" to the ⊕. The B0 squeeze width is based on the block's "}<strong>{"incoming"}</strong>{" width, rather than blindly reducing the expanded tensor by four. Its SE activation is SiLU. Those are concrete differences from the earlier deliberately smaller illustrative gate. Keeping both examples is useful because the comparison now identifies their different contracts instead of calling them the same model."}</Prose>

<Prose>{""}<code>{"python landmark_builders.py --family vgg16"}</code>{" uses "}<strong>{"meta tensors"}</strong>{" to inspect the full shape and parameter count without allocating 138 million weights. It should report the specified parameter budget and "}<code>{"[1,1000]"}</code>{" output; this checks a construction, not a fit. Changing the classifier requires its output label count to match the task, and does not preserve pretrained category semantics."}</Prose>

<Prose>With <code>torchvision==0.29.0</code> paired with <code>torch==2.14.0</code>, run <code>python landmark_builders.py --family resnet18 --compare</code>. It constructs the ordinary <code>get_model(..., weights=None)</code> route too. <code>copy_components</code> copies every convolution, linear layer and BatchNorm state in semantic order, refusing a component count/type/shape mismatch. Both models are in evaluation mode and receive the same input. Actual separate CPU comparisons for ResNet-18, EfficientNet-B0, VGG-16 and AlexNet each produced maximum absolute logit difference 0 in the recorded environment. This compares matched random weights, not trained quality. The VGG/AlexNet commands allocate both full models; run those families individually when memory permits, never in the browser.</Prose>

<Prose>{"The model source is intentionally a readable composition, not a reproduction of historical hardware kernels or each paper's training recipe. A Torchvision update can change a component layout: the comparison should fail visibly so the mapping can be inspected. "}<a href={"https://docs.pytorch.org/vision/stable/models.html"}>{"The model API"}</a>{" and "}<a href={"https://raw.githubusercontent.com/pytorch/vision/main/torchvision/models/efficientnet.py"}>{"EfficientNet implementation"}</a>{" were checked for this bridge on 22 September 2026. Pin the compatible tested release when running it."}</Prose>

<LandmarkProgram file="landmark_builders.py" title="Read all five explicit architecture builders and the library comparison" /><Prose>The reusable mobile block accepts branch-drop probability from 0 through 1. At 1 it keeps only the identity path during training without dividing by zero; out-of-range values are rejected. Default B0 probabilities remain below 1. <a href={landmarkAsset + "native-verification.json"}>Executed construction, boundary and environment checks</a>.</Prose>

<Prose>{""}<strong>{"Use the ordinary pretrained route."}</strong>{" Select an explicit weight enum, obtain its input transform, run the matching model in eval/inference mode and interpret outputs using that enum's categories. The following complete example deliberately requires a local photograph; it downloads model weights if uncached:"}</Prose>

<CodeBlock language={"python"}>{"import torch\nfrom PIL import Image\nfrom torchvision.models import ResNet18_Weights, resnet18\n\nweights = ResNet18_Weights.IMAGENET1K_V1\nmodel = resnet18(weights=weights).eval()\nwith Image.open(\"example.jpg\") as image:\n    inputs = weights.transforms()(image.convert(\"RGB\")).unsqueeze(0)\nwith torch.inference_mode():\n    probabilities = model(inputs).softmax(-1)[0]\nfor index in probabilities.topk(5).indices:\n    print(weights.meta[\"categories\"][int(index)], float(probabilities[index]))"}</CodeBlock>

<Prose>{"This does not turn a random local model into pretrained ResNet by assigning the same name. For fine-tuning, reuse the already implemented "}<a href={"/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies#transfer-section-3"}>{"Transfer Learning pipeline, section 3"}</a>{", whose "}<code>{"transfer-experiments.py"}</code>{" owns split roles, changed heads, freeze policies and optimizer groups. Apply those policies to the chosen architecture; do not rerun a second transfer lesson here."}</Prose>

<Prose>The photograph/IMAGENET1K_V1 download example is a complete usage route, but it was not executed here: no external photograph or pretrained weights were downloaded. The offline matched-state construction comparisons above were executed. To reproduce this environment, create and activate a separate Python environment, then install <code>torch==2.14.0 torchvision==0.29.0 numpy==2.3.5 scikit-learn==1.9.1 pillow</code> with <code>python -m pip install</code>.</Prose>

<CheckWithHint prompt={"Construction exercise: replace VGG's original head with global averaging and a seven-class linear layer. Which code and tensor contracts change?"} hint={<Prose>{"The trunk still returns 512 channels; the head no longer receives 49 positions per channel."}</Prose>} answerLabel="Solution and success criteria">
<Prose>{"Keep the feature stages, set the pool to "}<code>{"nn.AdaptiveAvgPool2d(1)"}</code>{", and use "}<code>{"nn.Linear(512, 7)"}</code>{". Its 3,591 head parameters replace the three large dense layers. Test two legal image sizes and assert "}<code>{"[batch, 7]"}</code>{"; train using labels 0–6. The unchanged trunk can receive copied pretrained state, but the replaced head must learn its new label meanings. Successful shape and parameter checks do not prove equal accuracy or equal functions."}</Prose>
</CheckWithHint>

<H2>{"6. Read an architecture comparison as evidence"}</H2>

<Prose>{"The drawings so far count what an architecture stores and computes. Whether it is the better choice is a different question, answered by measurements. A useful comparison tells you "}<strong>{"which model, which weights, which data and split, which preprocessing, which metric, and which execution conditions"}</strong>{"."}</Prose>

<Prose>{"Top-1 accuracy asks whether the largest score selects the label. Top-5 accuracy asks whether the label appears among the five largest scores. Error is one minus accuracy. A multi-network ensemble is a different deployed computation from a single model. A model trained with extra data or a newer recipe is a different experiment even if its diagram looks familiar."}</Prose>

<Prose>{"For example, Torchvision documents "}<strong>{"76.130%"}</strong>{" ImageNet-1K top-1 for ResNet-50's "}<code>{"IMAGENET1K_V1"}</code>{" weights and "}<strong>{"80.858%"}</strong>{" for "}<code>{"IMAGENET1K_V2"}</code>{". The architecture and 25,557,032 parameter count are the same. The difference is evidence that the trained-weight package and recipe matter, not a new residual-connection discovery. The V2 inference transform resizes to 232 before a 224 center crop; it is not simply “every image model takes 224.” "}<a href={"https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.resnet50.html"}>{"ResNet-50 weights and transforms"}</a>{"."}</Prose>

<Prose>{"Use this separation when selecting candidates:"}</Prose>

<NeuralTable caption={"Deployment questions and the evidence they need"} headers={[<>{"Deployment question"}</>,<>{"Evidence to obtain"}</>]} rows={[[<>{"Can this recognize the target classes?"}</>,<>{"Task-specific development metric, baseline, error examples and important slices"}</>],[<>{"Can this preserve small details?"}</>,<>{"Input resolution and stage geometry; inspect what preprocessing discards"}</>],[<>{"Does it fit the device?"}</>,<>{"Export/operator support, measured latency at the intended batch and precision, peak memory"}</>],[<>{"Can it reuse a pretrained model?"}</>,<>{"Exact weight identifier, preprocessing, class/head contract and appropriate adaptation"}</>],[<>{"Will its features feed another task?"}</>,<>{"Required stage resolutions, channel dimensions and output meanings"}</>]]} />

<Prose>{"A "}<strong>{"Pareto"}</strong>{" comparison concerns competing objectives: a candidate is dominated if another is at least as good on all declared objectives and strictly better on one. You cannot declare one architecture family universally Pareto-optimal from unrelated runs. A faster model on one CPU may be slower on another accelerator because operator efficiency and memory traffic change."}</Prose>

<Prose>{"Keep fine-tuning decisions with the preceding "}<a href={"/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies?module=deep-learning-fundamentals"}>{"Transfer Learning lesson"}</a>{": freezing parameters and choosing BatchNorm behavior are separate decisions. A small target dataset does not establish a universal transfer gain or require full fine-tuning in every case."}</Prose>

<H2>{"7. Optional: additional branches in the architecture family"}</H2>

<Prose>{"These ideas complete the useful historical context without making every named family a prerequisite for the next lesson."}</Prose>

<Prose>{""}<strong>{"DenseNet retains earlier maps by concatenation."}</strong>{" Each layer reads every group of channels produced before it and appends a few new ones. Here is a constructed block that starts with 8 channels and adds 3 per layer:"}</Prose>

<DenseFeatureReuseFigure />

<Prose>{"A layer receives "}<code>{"[x₀,x₁,…,xₗ₋₁]"}</code>{" and produces a small set of new channels, so the widths run 8, 11, 14, 17, 20. Reusing prior maps can support feature and gradient access, while the widening inputs and retained activations affect computation and memory. Transition layers can compress channels and downsample. This is a different connectivity contract from residual addition, which §4's merge comparison already showed. "}<a href={"https://arxiv.org/pdf/1608.06993"}>{"DenseNet, §3"}</a>{"."}</Prose>

<Prose>{""}<strong>{"RegNet asks about a family of designs."}</strong>{" Start with proposed block widths "}<InlineMath>{"u_j=w_0+w_a j"}</InlineMath>{", quantize them into repeated widths, and group consecutive equal-width blocks into stages. The result is a small set of design parameters controlling an entire network. Evaluating distributions of sampled designs asks whether a design space reliably produces good candidates, rather than celebrating one searched winner. Its empirical conclusions depend on its search and evaluation protocol. "}<a href={"https://arxiv.org/pdf/2003.13678"}>{"RegNet, §3"}</a>{"."}</Prose>

<Prose>{"To see how that width rule becomes stages, round the exponent of a multiplicative width grid, not each proposed width to the nearest arbitrary integer. For base width 16 and multiplier 2, allowed widths are 16, 32, 64, … . The figure follows all six block proposals through that conversion. "}<a href={"https://arxiv.org/pdf/2003.13678"}>{"RegNet, equations 2–4"}</a>{"."}</Prose>

<RegNetStageFigure />

<Prose>{""}<strong>{"NFNet separates normalization from the requirements it helps satisfy."}</strong>{" Its construction combines scaled weight standardization, controlled residual-branch scales and adaptive gradient clipping. The clipping threshold depends on a gradient norm relative to a parameter norm; it is not the same operation as multiplying a residual branch by a constant. This illustrates a general lesson: removing BatchNorm responsibly requires addressing training behavior, not simply deleting a module and expecting the old recipe to work. "}<a href={"https://arxiv.org/pdf/2102.06171"}>{"NFNet, §§3–4"}</a>{"."}</Prose>

<Prose>{"For one AGC unit, take weights [3,4] with norm 5 and gradient [6,8] with norm 10. A chosen ratio limit 0.1 permits gradient norm 0.5, so multiply the gradient by 0.5/10 to obtain [0.3,0.4]. Its direction is preserved while its size is capped relative to that unit's weights. With plain SGD at learning rate 0.01, the relative update norm is 0.001. Momentum or an adaptive optimizer changes that direct update interpretation. The paper floors the parameter norm by a small positive value to avoid forcing every zero-initialized unit's gradient to zero. This clipping example is one ingredient, not an implementation of the full NFNet recipe. "}<a href={"https://arxiv.org/pdf/2102.06171"}>{"NFNet, section 3 and equation 3"}</a>{"."}</Prose>

<Prose>{""}<strong>{"Learned features can define another model's loss."}</strong>{" In perceptual-loss work, an image transformation network produces an image "}<code>{"ŷ"}</code>{". A separately pretrained, frozen feature network "}<code>{"φ"}</code>{" maps "}<code>{"ŷ"}</code>{" and a target image "}<code>{"y"}</code>{" into features. A loss such as"}</Prose>

<div className="neural-equation"><MathBlock>{"L_{\\mathrm{feature}}=\\frac{1}{CHW}\\|\\phi_j(\\hat y)-\\phi_j(y)\\|_2^2"}</MathBlock></div>

<Prose>{"compares one layer's representation. Gradients pass through the frozen feature computation to the generated image, even though the feature network's weights are not being updated. A deeper layer can tolerate pixel changes that a pixelwise loss heavily penalizes, but the chosen features can also overlook changes that matter to a human. This is a useful application of VGG's intermediate maps, not a guarantee of perceptual correctness. "}<a href={"https://arxiv.org/pdf/1603.08155"}>{"Johnson, Alahi and Fei-Fei, §3.2"}</a>{"."}</Prose>

<Prose>{"The two-pixel example below separates two easily confused facts: a parameter can remain unchanged while its computation still participates in backpropagation, and equal features need not imply equal inputs. Follow the derivative back to the generated image before deciding which branch can safely disable gradient tracking."}</Prose>

<FrozenFeatureGradientFigure />

<Prose>{"MobileNet refinements and ConvNeXt follow in their own lessons. Wide residual networks change channel capacity; grouped ResNeXt branches change the transformation grouping. Stochastic-depth training already has a "}<a href={"/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals"}>{"separate home"}</a>{". These are combinations of design choices, not steps on a ladder where every later name makes every earlier one obsolete."}</Prose>

<H2>{"8. A complete, small architecture investigation"}</H2>

<H3>{"The question and the observations"}</H3>

<Prose>{"Sections 2–5 described each family's idea; §6 said what evidence a comparison needs. Now run a comparison small enough to inspect completely. Can different feature-processing blocks learn to recognize actual digits, and what do they cost? Use 400 real 8×8 images from the "}<strong>{"UCI Optical Recognition of Handwritten Digits"}</strong>{" data: 40 images of each digit 0–9. The original collection supports studying handwritten-digit recognition. Each pixel is an integer intensity 0–16; this dataset is different from MNIST. The supplied subset, source-row identifiers and attribution are in "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/digits-400.csv"}>{"digits-400.csv"}</a>{" and "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/data-provenance.md"}>{"data provenance"}</a>{". The UCI record distributes this dataset under CC BY 4.0. "}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"Dataset and collectors"}</a>{"."}</Prose>

<Prose>{"All 400 source IDs and pixel vectors are distinct. We use a stratified 280/120 training/development split with seed 22 and divide pixels by the known bound 16. No fitted preprocessing consumes development rows. The source copy does not provide writer identities for these rows, so this does not establish performance on unseen writers. Development results are available for inspection and model choice; there is no untouched final test in this teaching experiment."}</Prose>

<Prose>{"This is the classifier you met in §1. The stem, tail and head are identical in every candidate, and only the body in the middle changes. Each body is a miniature of one §§3–5 idea: a plain two-convolution chain (VGG-style), the same chain with a skip (ResNet-style), four parallel branches concatenated (Inception-style), and an inverted block with a channel gate (MBConv-style). Choose each body with the control under the drawing and compare its drawing and cost with the ones before:"}</Prose>

<SmallNetworkAnatomy selectable />

<Prose>{"These are "}<strong>{"not miniature benchmark reproductions"}</strong>{" of VGG, GoogLeNet, ResNet or EfficientNet. We omit BatchNorm and use fixed small stages so the bodies are readable. The inverted block uses SiLU, the smooth activation "}<code>{"x × sigmoid(x)"}</code>{", in expansion/spatial operations; the others use ReLU. The comparisons between different body families change several properties at once."}</Prose>

<Prose>{"Within a seed, stem, tail and head start with matching tensors in all four models. Plain and residual also share the same initial branch weights: their only forward-rule difference is the skip addition. They are trained separately, so their weights can subsequently diverge."}</Prose>

<H3>{"Run it offline and follow one update"}</H3>

<Prose>{"Download "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/architecture-experiments.py"}>{"architecture-experiments.py"}</a>{" beside the CSV. In a Python environment with PyTorch, NumPy and scikit-learn installed, run:"}</Prose>

<CodeBlock language={"text"}>{"python architecture-experiments.py"}</CodeBlock>

<Prose>{"The complete program defines every body, loads the supplied data, checks the split inputs, runs 12 small fits, prints final numerical summaries, and writes "}<code>{"calculated-inputs.json"}</code>{". It needs no pretrained download or image folder. The recorded run used Python 3.12.14, PyTorch 2.14.0+cpu, NumPy 2.3.5 and scikit-learn 1.9.1 with one CPU thread. Exact low-order values can vary with numerical libraries."}</Prose>

<LandmarkProgram /><p><a href={landmarkAsset + "calculated-inputs.json"}>Complete measured experiment record</a> · <a href={landmarkAsset + "native-verification.json"}>Execution evidence and limits</a></p>

<Prose>{"Read its two-convolution body first; it is the plain and residual bodies from the drawing above. The complete program supplies "}<code>{"torch"}</code>{", "}<code>{"nn"}</code>{" and "}<code>{"F"}</code>{" imports and calls this inside the classifier:"}</Prose>

<CodeBlock language={"python"}>{"class PlainOrResidual(nn.Module):\n    def __init__(self, channels=12, residual=False):\n        super().__init__()\n        self.first = nn.Conv2d(channels, channels, 3, padding=1)\n        self.second = nn.Conv2d(channels, channels, 3, padding=1)\n        self.residual = residual\n\n    def forward(self, x):\n        branch = self.second(F.relu(self.first(x)))\n        return F.relu(branch + x if self.residual else branch)"}</CodeBlock>

<Prose>{"Padding 1 preserves the 4×4 grid. Both convolutions preserve 12 channels, so addition is shape-compatible. The last ReLU belongs after the merge in this example. Moving it into only the branch changes the function."}</Prose>

<Prose>{"The training mechanism is compact:"}</Prose>

<CodeBlock language={"python"}>{"optimizer = torch.optim.Adam(model.parameters(), lr=.003)\nfor step in range(400):\n    model.train()\n    optimizer.zero_grad()\n    loss = F.cross_entropy(model(x[train]), y[train])\n    loss.backward()\n    optimizer.step()"}</CodeBlock>

<Prose>{"This excerpt is the update loop from the complete supplied program, not a standalone script. Each step uses all 280 training images. The logits select neither labels nor probabilities in advance: cross-entropy performs the needed log-softmax internally. Clearing gradients prevents the previous step's gradients from being added accidentally. Backpropagation reaches the head, tail, selected body and stem. Adam then updates their learned parameters."}</Prose>

<Prose>{"There are no augmentations, dropout, weight decay, early stopping or development-selected epochs. Every model receives 400 updates at learning rate 0.003 with seeds 1, 2, 3. We record training/development cross-entropy and correct counts at steps 0, 1, 25, 100, 200 and 400. This fixed recipe is a comparison condition, not a promise that it is optimal for all four architectures."}</Prose>

<H3>{"Inspect the result, including the baseline"}</H3>

<Prose>{"All 12 final models correctly classify all 280 training images. Their development behavior differs:"}</Prose>

<NeuralTable caption={"Final development results for the four bodies"} headers={[<>{"Body"}</>,<>{"Parameters"}</>,<>{"Conv/linear MACs per image"}</>,<>{"Development correct, seeds 1/2/3, out of 120"}</>,<>{"Development CE, seeds 1/2/3"}</>]} rows={[[<>{"Plain"}</>,<>{"4,650"}</>,<>{"76,192"}</>,<>{"116 /115 /112"}</>,<>{"0.1180 /0.2325 /0.3061"}</>],[<>{"Residual"}</>,<>{"4,650"}</>,<>{"76,192"}</>,<>{"112 /115 /114"}</>,<>{"0.2065 /0.2074 /0.3737"}</>],[<>{"Parallel"}</>,<>{"2,502"}</>,<>{"41,920"}</>,<>{"119 /117 /115"}</>,<>{"0.0367 /0.1056 /0.2091"}</>],[<>{"Inverted with gate"}</>,<>{"3,999"}</>,<>{"54,376"}</>,<>{"116 /112 /117"}</>,<>{"0.1971 /0.3331 /0.0928"}</>]]} />

<Prose>{"The MACs follow §1's convention, so plain and residual have equal counted MACs even though the residual addition still performs work."}</Prose>

<Prose>{"What can we conclude? All four small constructions learn the training set. The parallel candidate has fewer counted parameters and MACs here, and its three development counts are promising. The residual path does not consistently beat the plain model in this shallow fixed-recipe setting. A result about helping train very deep networks is not a guarantee that a skip improves every small model."}</Prose>

<Prose>{"Notice the inverted candidate's seed 1 score: 116 correct, the same as plain, but higher cross-entropy. Correct counts discard confidence information. Cross-entropy also reacts to probability assigned to wrong labels and to the confidence of correct predictions."}</Prose>

<Prose>{"The table shows only the end of training. To see how plain and another body got there, follow their recorded development checkpoints. Choose a seed, the body to compare with plain, and whether to plot correct counts or cross-entropy; a difference can improve, tie or reverse from one seed to the next:"}</Prose>

<LandmarkComparisonLab />

<Prose>{"The three seeds show initialization variation on one shared split. They do not provide independent samples from a deployment population. Choosing a candidate from this table uses the development split described above."}</Prose>

<H2>{"9. How can a class score become a spatial map?"}</H2>

<Prose>{"The final representation in our classifier is 16 maps of size 2×2. The head averages each map, then linearly combines those 16 averages. Because averaging and a weighted sum are linear, we can reverse their order: weight the maps first, add them into one map per class, and average that map last. Take a constructed head with two 2×2 feature maps, class weights 2 and −1, and bias 0.5, and follow it down:"}</Prose>

<LandmarkScoreLab />

<Prose>{"Each feature map is multiplied by its class weight, the two weighted maps are added cell by cell into one "}<strong>{"class activation map"}</strong>{", and the mean of that map plus the bias is the class score. The readout computes the same score the original way, averaging first, and the two always agree."}</Prose>

<Prose>{"The second channel has a negative class weight. Raise feature B's bottom-left cell from 2 to 6 with the first slider: that location's class-map value changes from −2 to −6 and the score falls from 2.5 to 1.5. More activation can mean less evidence for this particular class. Then flip the class weight for B to a positive value and the same increase raises the score instead."}</Prose>

<Prose>{"Now write it generally. Let "}<code>{"A_c(h,w)"}</code>{" be the final map in channel "}<code>{"c"}</code>{", and let "}<code>{"w_kc,b_k"}</code>{" be the weights and bias for class "}<code>{"k"}</code>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"z_k=b_k+\\sum_c w_{kc}\\left(\\frac{1}{HW}\\sum_{h,w}A_c(h,w)\\right)."}</MathBlock></div>

<Prose>{"Define the "}<strong>{"class activation map"}</strong>{""}</Prose>

<div className="neural-equation"><MathBlock>{"M_k(h,w)=\\sum_c w_{kc}A_c(h,w)."}</MathBlock></div>

<Prose>{"Then "}<code>{"z_k=b_k+mean(M_k)"}</code>{". The mean of the map, plus the bias, recovers the class logit exactly in real arithmetic for this head. A map is not itself a probability map, and a negative contribution can reduce the class score. This correspondence is the mechanism behind "}<a href={"https://arxiv.org/pdf/1512.04150"}>{"class activation mapping"}</a>{"; our definition explicitly uses an average and keeps the bias."}</Prose>

<Prose>{"Here is the same hand-sized computation as a program you can run independently:"}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\n\nmaps = np.array([[[1., 2.], [0., 3.]],\n                 [[0., 1.], [2., 1.]]])\nweights = np.array([2., -1.])\nbias = .5\nclass_map = np.einsum(\"c,chw->hw\", weights, maps)\nvia_features = weights @ maps.mean(axis=(1, 2)) + bias\nvia_map = class_map.mean() + bias\nprint(class_map)\nprint(via_features, via_map)"}</CodeBlock>

<Prose>{"Output:"}</Prose>

<CodeBlock language={"text"}>{"[[ 2.  3.]\n [-2.  5.]]\n2.5 2.5"}</CodeBlock>

<Prose>{"Then inspect real saved examples from seed 1 of the parallel model. Source 251, an actual 4, is correctly classified by all four models. The first misclassified development specimen for the parallel model is source 379: an 8 predicted as 5. Choose either one below; the drawing shows the saved digit and two of its class maps:"}</Prose>

<LandmarkRecordedMaps />

<Prose>{"For source 379, the class 5 and class 8 maps come from the "}<strong>{"same"}</strong>{" feature tensor with different head weights. Looking only at a vivid predicted-class map would hide the competing explanation. The saved features, all ten class maps, head weights, biases, logits and probabilities support the correspondence. Float32 reconstructions differ by at most approximately 5.73×10⁻⁶ across the saved cases. That is numerical ordering error in an algebraic identity. These are fixed saved features and head weights: no backbone runs in the browser, so changing an original image would require the downloadable program and its trained model."}</Prose>

<Prose>{"Use the original 2×2 cells alongside any enlarged overlay. Upsampling does not create extra spatial detail. A large positive cell describes a contribution from learned features whose receptive field can extend beyond that cell's displayed location. It does not prove a causal explanation, a precise object boundary, or that editing the corresponding input pixels will have the predicted effect. Editing intermediate features in the hand calculation is explicitly a different intervention from rerunning an image through the whole trained backbone."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice and diagnosis"}</H2>

<Prose>{"Attempt each task before opening its hint or solution."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A new head budget"}</H3>

<Prose>{"A backbone returns 128 channels of size 7×7. Compare a direct flattened linear head for 7 classes with global averaging followed by a linear head. Include biases. Which spatial information can only the first head use?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"One head receives 6,272 scalars; the other receives 128. Both return 7 logits."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Flattened: "}<code>{"(7×7×128+1)×7=43,911"}</code>{" parameters. Averaged: "}<code>{"(128+1)×7=903"}</code>{". The flattened head can assign different weights to different positions within a channel. The averaged head cannot distinguish permutations of those positions at its input. This does not establish which trained model has better task performance."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A bottleneck that is no longer cheap"}</H3>

<Prose>{"Compare one 5×5 convolution from 32 to 32 channels with two 3×3 convolutions, first 32→64 then 64→32. Ignore biases, use the same spatial grid, and put an activation between the small convolutions. Is “two small kernels use fewer weights” true here?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write both channel dimensions of both 3×3 layers. The intermediate width is 64, not 32."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The 5×5 layer has "}<code>{"25×32²=25,600"}</code>{" weights. The pair has "}<code>{"9×32×64+9×64×32=36,864"}</code>{". Their interior receptive-field support is 5×5, but the pair is larger and has an intermediate nonlinearity. The familiar 18C² comparison assumes the intermediate width is C."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Repair the merge"}</H3>

<Prose>{"An input has shape "}<code>{"N×24×16×16"}</code>{". A strided branch returns "}<code>{"N×48×8×8"}</code>{". Give a shape-compatible learned skip for addition. If another design concatenates two "}<code>{"N×24×8×8"}</code>{" branches, what is its output shape? Explain why these are different computations despite one matching final shape."}</Prose>

<details><summary>Hint</summary>

<Prose>{"An addition needs both summands to match. A 1×1 convolution can change channels and use a stride."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A 1×1 skip convolution 24→48 with stride 2 returns "}<code>{"N×48×8×8"}</code>{". The branch and projected skip can then be added. Concatenating two 24-channel branches also returns "}<code>{"N×48×8×8"}</code>{", but retains their outputs in separate channel ranges. Addition combines corresponding entries. With no bias, the projection has 24×48=1,152 weights; its 8×8 outputs require 73,728 convolution MACs per image."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Change the class-map question"}</H3>

<Prose>{"Use the two maps in §9 with new class weights "}<code>{"[−1,2]"}</code>{" and bias −0.5. Compute the map and score. Increase the first map's top-left cell from 1 to 5. Calculate the new score and explain its direction."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first map now has negative weight. A change at one of four positions changes the spatial average by one quarter of the weighted change."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The original class map is "}<code>{"[[-1,0],[4,-1]]"}</code>{". Its mean is 0.5, so the score is 0. The edit reduces the top-left contribution by 4; the map's mean falls by 1 and the score becomes −1. The other class from §9 can respond differently to exactly the same features."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Can you draw this benchmark curve?"}</H3>

<Prose>{"A draft has a point for an old model's single-crop validation accuracy, another for a later seven-network test ensemble with extra pretraining, and invented points filling missing years. Its caption says “architecture progress.” Describe a defensible replacement."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate what is known, what is comparable, and what was not measured."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Remove invented points. Either select a genuinely matched protocol or show discrete reported results with explicit weights, data, split, inference and source labels. A historical table can preserve the milestones without implying a controlled causal comparison. For this lesson's architecture budgets, use exact shape/parameter calculations separately from the recorded small-data results. Connecting points is an additional claim about what the line means."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Diagnose a failed adaptation"}</H3>

<Prose>{"A team freezes all parameters whose name lacks the text "}<code>{"\"classifier\""}</code>{" or "}<code>{"\"fc\""}</code>{". Its supposedly frozen backbone contains SE layers named "}<code>{"fc1"}</code>{" and "}<code>{"fc2"}</code>{". It also calls "}<code>{"model.train()"}</code>{" globally. Why might this fail to implement a linear probe? Propose direct checks."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Module identity is stronger than a substring. Learned tensors and running-state buffers need separate inspection."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The substring rule can leave backbone SE weights trainable. Global train mode can update BatchNorm running statistics even for parameters with "}<code>{"requires_grad=False"}</code>{". Freeze the backbone module's actual parameters, explicitly make only the intended head trainable, and set the chosen backbone evaluation policy after any global mode change. List optimizer parameter identities and compare backbone parameters/buffers before and after a step. A chosen fine-tuning policy may deliberately update some of these; label that policy accurately."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Design a next experiment"}</H3>

<Prose>{"You have a 5,000-parameter limit and a 60,000-convolution/linear-MAC limit for the small task. Which recorded candidates qualify? Choose one development question to investigate next and state what would remain unknown."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Eligibility is arithmetic. Choosing a model and estimating its final deployment performance require different evidence."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Parallel and inverted-with-gate qualify; plain/residual exceed the MAC limit. One reasonable next question is whether the parallel model's errors concentrate in a particular pair of digits, inspected on development rows with denominators. Another is measured device latency, since counted MACs omit important work. More than one next experiment can be sensible if its question and decision rule are explicit."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Count a different MBConv block"}</H3>

<Prose>{"EfficientNet-B0's fourth stage uses blocks with 40 input and output channels on a 28×28 grid, expansion 6, a "}<strong>{"5×5"}</strong>{" depthwise filter and an SE squeeze to a quarter of the input width. Draw the block with §5's conventions, giving the tensor shape after each operation. Then count its learned parameters, including BatchNorm scales and shifts and the SE layers' biases. Which part is largest? Check your total against "}<code>{"sum(p.numel() for p in torchvision.models.efficientnet_b0().features[3][1].parameters())"}</code>{"."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Expanded width is 6 × 40 = 240 and the squeeze width is 40 / 4 = 10. A depthwise 5×5 filter has 25 weights per channel. Each BatchNorm has two parameters per channel; the SE layers are 1×1 convolutions with biases."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Shapes: 40 × 28 × 28 → expand → 240 × 28 × 28 → depthwise 5×5 (padding 2) → 240 × 28 × 28 → SE gate (240 → 10 → 240) → 240 × 28 × 28 → project → 40 × 28 × 28 → ⊕ with the input. Counts: expand 40 × 240 + 2 × 240 = 10,080; depthwise 25 × 240 + 2 × 240 = 6,480; SE 240 × 10 + 10 + 10 × 240 + 240 = 5,050; project 240 × 40 + 2 × 40 = 9,680. Total "}<strong>{"31,290"}</strong>{", nearly three times §5's 10,710-parameter block. The two 1×1 convolutions are largest because they scale with 40 × 240. The 5×5 depthwise filter costs only 6,000 weights despite its larger window, because it never mixes channels."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"11. What you should now be able to do"}</H2>

<Prose>{"Draw any of these families as a flow of tensors and operations, and point to where its convolutions, activations, pooling, normalization, skip and classifier sit. Predict the shape and budget consequences of a new layer. Distinguish stacking small kernels, concatenating branches, adding a residual, gating channels and scaling a family. Follow data through a complete training/evaluation example and explain why a compelling architectural idea can still lose a particular comparison. Reconstruct a class score from its maps and identify the interpretation's limits."}</Prose>

<Prose>{"You are ready to continue when you can repair the mismatched merge in practice 3, derive the changed map in practice 4, count the changed block in practice 8, and propose a defensible comparison in practice 7 without copying an architecture recommendation."}</Prose>

<Prose>{"The next topic is "}<a href={"/learn/path/full-curriculum/depthwise-separable-dilated-convolutions?module=deep-learning-fundamentals"}>{"Depthwise Separable & Dilated Convolutions"}</a>{". We have used a factorized convolution as a building block; next we examine exactly which channel/spatial interactions it can express, how dilation changes the positions a filter samples, and when those choices help or fail."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"References & another way to learn it"}</H2>

<Prose>{""}<strong>{"Alternate explanations and practice"}</strong>{""}</Prose>

<ul><li>{""}<a href={"https://www.youtube.com/watch?v=DAOcjicFr1Y"}>{"Stanford CS231n, Lecture 9: CNN Architectures"}</a>{", video, with "}<a href={"https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture9.pdf"}>{"companion slides"}</a>{". Useful after §3 for shape questions and visual comparisons of AlexNet, VGG, GoogLeNet and ResNet. It assumes basic convolution and predates EfficientNet. The relevant slide content and the creator's video description were reviewed; no claim of watching the complete video or verifying timestamps is made. Historical variants and current APIs still need the distinctions in this lesson."}</li><li>{""}<a href={"https://d2l.ai/chapter_convolutional-modern/index.html"}>{"Dive into Deep Learning, chapter 8: Modern Convolutional Neural Networks"}</a>{", free textbook with runnable code. Its side-by-side drawings “LeNet versus AlexNet” and “From AlexNet to VGG”, and its ResNet block with and without the 1×1 projection, are the same comparisons as §§3–4 here, drawn differently. Read its AlexNet, VGG and ResNet sections after §4. Their code uses a smaller dataset and different recipes; the AlexNet, VGG and ResNet pages were read for this revision."}</li><li>{""}<a href={"https://docs.pytorch.org/vision/stable/models.html"}>{"Torchvision's model and weight guide"}</a>{", official documentation. Use after §6 to connect a model builder with its weight identifier, transformations and output categories. It is an API guide rather than a beginner explanation of the architecture."}</li><li>{""}<a href={"https://arxiv.org/pdf/1603.08155"}>{"Perceptual Losses for Real-Time Style Transfer and Super-Resolution"}</a>{", Johnson, Alahi and Fei-Fei, paper. Optional after §7:§3.2 and its reconstruction figures make intermediate-feature losses concrete. Basic backpropagation is useful; its historical feature loss is not a universal human-similarity metric."}</li></ul>

<Prose>{""}<strong>{"Precise technical and historical sources"}</strong>{""}</Prose>

<ul><li>{""}<a href={"https://gwern.net/doc/ai/nn/cnn/1998-lecun.pdf"}>{"LeNet and document recognition"}</a>{", LeCun and colleagues, 1998, original paper mirrored as a PDF; §II.B for the actual layer contract."}</li><li>{""}<a href={"https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks.pdf"}>{"AlexNet"}</a>{", 2012, §§3–6 and Table 2; "}<a href={"https://arxiv.org/pdf/1409.1556"}>{"VGG"}</a>{", §2 and Table 1; "}<a href={"https://arxiv.org/pdf/1409.4842"}>{"GoogLeNet/Inception"}</a>{", §§4–5, Figure 2 and Table 1 (the inception (3a) row drawn in §4); "}<a href={"https://arxiv.org/pdf/1512.03385"}>{"ResNet"}</a>{", §3. Read a model's experimental conditions together with its diagram."}</li><li>{""}<a href={"https://arxiv.org/pdf/1704.04861"}>{"MobileNet V1"}</a>{", §3; "}<a href={"https://arxiv.org/pdf/1801.04381"}>{"MobileNet V2"}</a>{", §3; "}<a href={"https://arxiv.org/pdf/1709.01507"}>{"SE"}</a>{", §3; "}<a href={"https://proceedings.mlr.press/v97/tan19a/tan19a.pdf"}>{"EfficientNet"}</a>{", §§3–4, Figure 2 and Table 1. MobileNet V2's Figure 3 (layer thickness = channels) and EfficientNet's Figure 2 (width, depth, resolution panels) are the canonical pictures behind §5's MBConv and scaling drawings. These supply the efficient-block and scaling definitions."}</li><li>{""}<a href={"https://arxiv.org/pdf/1608.06993"}>{"DenseNet"}</a>{", §3; "}<a href={"https://arxiv.org/pdf/2003.13678"}>{"RegNet"}</a>{", §3; "}<a href={"https://arxiv.org/pdf/2102.06171"}>{"NFNet"}</a>{", §§3–4. Optional family branches rather than required extra reading."}</li><li>{""}<a href={"https://arxiv.org/pdf/1512.04150"}>{"Class activation mapping"}</a>{", Zhou and colleagues, §2. Compare its pooled-feature convention with the explicit mean and bias kept here."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"UCI optical digits"}</a>{", E. Alpaydin and C. Kaynak, 1998, "}<a href={"https://doi.org/10.24432/C50P49"}>{"DOI10.24432/C50P49"}</a>{", CC BY 4.0; "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/architecture-experiments.py"}>{"complete program"}</a>{", "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/calculated-inputs.json"}>{"retained numerical outputs"}</a>{", "}<a href={"/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/data-provenance.md"}>{"data provenance and limits"}</a>{"."}</li></ul></section>
</div>
};
