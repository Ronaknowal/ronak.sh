// Reading-flow revision 5; preserve the original programs, recorded fits and practice.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { ConvNeXtPurposeFigure, ConvNeXtSpatialChannelFigure, ConvNeXtBlockFigure, ConvNeXtGeluFigure, ConvNeXtWorkedBlockFigure, ConvNeXtHeadOrderFigure, ConvNeXtMaskFigure, ConvNeXtTargetFigure, ConvNeXtProbeFigure, ConvNeXtCommunicationFigure } from '../../components/lesson-labs/ConvNeXtDrawings.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import { ConvNeXtGenealogy, ConvNeXtNormalizationLab, ConvNeXtHierarchy, ConvNeXtBudgetLab, ConvNeXtResponseLab, ConvNeXtReconstructionLab, ConvNeXtPatchLab, ConvNeXtRecordedExperiment, ConvNeXtFusionLab, ConvNeXtNonlinearLab, ConvNeXtProgram, convnextAsset } from '../../components/lesson-labs/ConvNeXtLabs.jsx';
export default {
 title: 'ConvNeXt & Modern CNN Designs',
 readTime: '~70 min read + live investigations, implementation and practice',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson convnext-lesson lesson-flow"><LessonIntro prerequisites="Depthwise convolution, channel normalization, residual paths, tensor shapes and supervised training. The relevant axis and masking contracts are refreshed locally." sections={[["1-start-with-the-comparison-not-the-model-name","1. Start with the comparison, not the model name"],["2-read-one-block-from-the-input-outward","2. Read one block from the input outward"],["3-from-the-block-to-a-feature-hierarchy","3. From the block to a feature hierarchy"],["4-global-response-normalization-look-across-the-feature-map","4. Global response normalization: look across the feature map"],["5-learn-from-missing-pixels-without-giving-away-the-answer","5. Learn from missing pixels without giving away the answer"],["6-an-actual-masked-digit-experiment","6. An actual masked-digit experiment"],["7-deeper-routes-deploy-reparameterize-or-combine-mechanisms","7. Deeper routes: deploy, reparameterize, or combine mechanisms"],["match-the-block-you-built-to-the-maintained-implementation","Match the block you built to the maintained implementation"],["8-practice-reason-about-a-changed-design","8. Practice: reason about a changed design"],["9-readiness-connections-and-other-ways-to-learn","9. Readiness, connections and other ways to learn"]]}>Read a modern convolutional block, build its complete hierarchy, and investigate how a masked reconstruction model uses available evidence.</LessonIntro>
<Prose opening="exploration">Move one taught quantity at a time: a feature value, channel width, map response, image pixel or kernel coefficient. The controls sit under the drawing they change. The digit weights stay fixed; training is a separate runnable program.</Prose>

<Prose>You can already filter one image channel and mix several channels using the preceding lesson. How do we turn those operations into an entire recognizer—and how do we know which design choice helped it? Start with the image-to-label route; arrows carry forward values.</Prose>
<ConvNeXtPurposeFigure />
<Prose>The image starts as brightness values at positions. The stem converts small patches into several feature maps: one number per channel at each position. The body repeatedly changes those maps. The head summarizes the last maps into class scores. ConvNeXt is a family of networks built from a particularly simple repeated body block; its name does not describe an extra mysterious operation.</Prose>

<Prose>{"The preceding "}<a href={"/learn/path/full-curriculum/depthwise-separable-dilated-convolutions?module=deep-learning-fundamentals"}>{"Depthwise Separable & Dilated Convolutions"}</a>{" lesson explained inexpensive spatial filtering and its restrictions. Here we use those operations to read a complete modern network. We will also train a small model to reconstruct hidden parts of real handwritten digits, then test what its representation makes available to a separate classifier."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow §§1–6, run or inspect the small experiment, and attempt practice 1–5. You should be able to trace one block, identify which numbers a normalizer sees, prevent hidden-input leakage, and distinguish reconstruction from recognition. The deployment, kernel-fusion and hybrid-design branches in §7 and practice 6–8 deepen that understanding; they are not prerequisites for the next lesson."}</Prose>

<H2>{"1. Start with the comparison, not the model name"}</H2>

<Prose>{"Suppose one model gets more examples right than another. Before explaining the difference using their diagrams, ask whether they used the same images, labels, input resolution, training duration, augmentation, optimizer, regularization and evaluation procedure. Changing several of these changes the question."}</Prose>

<Prose>An architecture specifies the operations and trainable numbers; a training recipe specifies how those numbers are learned. A checkpoint is the resulting learned state. Keep that distinction in mind while reading this measured design history; top-1 accuracy means the fraction of images whose highest-scoring label is correct.</Prose>
<ConvNeXtGenealogy />
<Prose>The enhanced recipe improves the existing ResNet before any ConvNeXt architecture change. Later rows change the stage layout, spatial filtering and channel width. Some intermediate changes lower accuracy. The figure therefore records conditional experiments, not independent bonuses that can be added to any network. The small digit experiment in §6 will use the same separation between a design and the evidence that supports it.</Prose>

<Prose>{"The recipe included longer training, AdamW, image transformations, mixed training examples and regularization. You do not need to memorize their hyperparameters to understand the evidence: a newer architecture compared with an older training recipe does not isolate the value of the architecture."}</Prose>

<Prose>{"A practical comparison record can be short:"}</Prose>

<NeuralTable caption={"Record the conditions of a matched comparison"} headers={[<>{"Question"}</>,<>{"What must be written down"}</>]} rows={[[<>{"What is being predicted?"}</>,<>{"Label definition, unit of observation and decision metric"}</>],[<>{"What may differ?"}</>,<>{"The specific block or training change being investigated"}</>],[<>{"What is held fixed?"}</>,<>{"Data partition, preprocessing, training budget and paired seeds where possible"}</>],[<>{"What did it cost?"}</>,<>{"Parameters and defined operation counts; separately measured latency if available"}</>],[<>{"What supports the conclusion?"}</>,<>{"Counts/errors on reserved development data, variability and the actual comparison"}</>]]} />

<Prose>{"Our small experiment will use this structure. It will not use an ImageNet result to predict an accuracy gain on digits."}</Prose>

<H2>{"2. Read one block from the input outward"}</H2>
<Prose>The comparison asks what changed inside the network. Begin with one unchanged-size block: it should return the same grid and channel width so that it can add a learned correction to the original evidence. Follow spatial neighbours first, then the wires connecting channels at one location.</Prose>
<ConvNeXtSpatialChannelFigure />
<Prose>Channel A and channel B are separate maps of the same scene. White windows mark the spatial cells read by each learned filter. Each filter produces a new map without reading the other channel. The highlighted values at one matching location then meet through channel-mixing weights. The saved input follows the bypass into ⊕, the addition. This extends the earlier <a href="/learn/path/full-curriculum/depthwise-separable-dilated-convolutions?module=deep-learning-fundamentals">depthwise/pointwise construction</a> by making its output a residual correction.</Prose>
<Prose>Write an image batch as N × C × H × W: N specimens, C channels, H rows and W columns. At one location the C values form a channel vector. The full V1 block uses a 7 × 7 depthwise filter with padding 3, so filtering preserves H × W. Channel LayerNorm prepares each filtered vector before the channel transformations. We will add the rest of the block after seeing what those operations do.</Prose>
<H3>{"Which values does LayerNorm actually normalize?"}</H3>
<Prose>Recall <a href="/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals">Normalization</a>: a normalizer first chooses the values that share a mean and variance. Here there are two spatial locations, each with channels A and B. Channel LayerNorm groups each row separately; one GroupNorm group collects the whole specimen. In this comparison the learned scale is 1, shift is 0 and ε = 10⁻⁶ is fixed. Edit only location 1, channel A and watch which other values can change.</Prose>
<ConvNeXtNormalizationLab />
<Prose>At the initial state, [1, 3] has mean 2 and variance 1; [101, 103] has mean 102 and variance 1. Subtracting each row's mean removes its offset, leaving approximately [−1, 1] in both rows. The single larger group sees all four values, so its mean is 52 and variance 2,501. That route retains the contrast between locations. Equal output shapes do not mean equal computations.</Prose>
<Prose>For one specimen and one location, the formal channel-normalization rule is</Prose>
<div className="neural-equation"><MathBlock>{"\\mu=\\frac1C\\sum_c x_c,\\quad \\sigma^2=\\frac1C\\sum_c(x_c-\\mu)^2,\\quad \\widehat{x}_c=\\gamma_c\\frac{x_c-\\mu}{\\sqrt{\\sigma^2+\\epsilon}}+\\beta_c."}</MathBlock></div>
<Prose>Each location computes its own mean μ and population variance σ². Learned scales γ and shifts β are shared across locations. Both the drawing and code use ε = 10⁻⁶, unit scale and zero shift for this comparison; ε keeps a constant vector well-defined. ConvNeXt uses current-input statistics in training and evaluation, with no BatchNorm running averages. In code, move the channel axis last before <code>nn.LayerNorm(C)</code>: the API normalizes trailing dimensions, which need not be channels in an NCHW tensor.</Prose>
<H3>{"Expand, bend the response, then project"}</H3>
<Prose>A normalized vector now contains comparable channel evidence. The first learned linear map expands C values to 4C combinations. An activation changes each combination before a second linear map projects it back to C. Without that activation, two affine maps would collapse into one affine map and the wider middle would not add nonlinear decisions. V1 uses GELU, a smooth activation: its curve shows how one scalar score becomes an activation.</Prose>
<ConvNeXtGeluFigure />
<Prose>At score −1 the output is about −0.158655, rather than ReLU's zero. At score 1 it is about 0.841345; large positive scores increasingly pass through. GELU multiplies the score z by Φ(z), the fraction of a standard normal bell curve below z: GELU(z) = zΦ(z). This is a deterministic smooth function; it does not sample a random mask. The browser approximates the normal CDF numerically; the complete PyTorch program uses its exact-erf GELU route.</Prose>
<Prose>At one location, normalized inputs x̂ᵢ are combined with learned matrices W¹, W² and biases b¹, b². Each expanded index k gets its own weighted sum; each projected channel j mixes the activated sums:</Prose>
<div className="neural-equation"><MathBlock>{"v_j=\\sum_{k=1}^{4C}W^{(2)}_{jk}\\operatorname{GELU}\\left(\\sum_{i=1}^{C}W^{(1)}_{ki}\\widehat{x}_i+b^{(1)}_k\\right)+b^{(2)}_j."}</MathBlock></div>
<Prose>These maps are applied independently at every spatial location using shared weights, just like 1 × 1 convolutions. Moving NCHW to NHWC changes where an axis is indexed; it does not move evidence between locations.</Prose>
<H3>{"Scale the correction, then add the saved input"}</H3>
<Prose>The projected vector has the right size to meet the bypass. LayerScale learns one multiplier per projected channel; the official V1 implementation initializes these at 10⁻⁶, so the new correction starts small. During training, DropPath may discard the entire correction for one specimen, using one mask across all its channels and positions. The <a href="/learn/path/full-curriculum/dropout-droppath-stochastic-depth?module=deep-learning-fundamentals">DropPath lesson</a> explains its retained-branch division by 1 − p; evaluation keeps the whole branch. The expected correction is preserved, not an arbitrary nonlinear network's expected final prediction.</Prose>
<Prose>Now follow a complete two-channel block by hand. Centre-only spatial filters make the arithmetic readable while retaining the block's shape. The middle really has eight values; the six zeros are shown, not silently removed. A scale of 0.1 makes the correction visible here, replacing the reference's initial 10⁻⁶ only for this constructed example.</Prose>
<ConvNeXtWorkedBlockFigure />
<Prose>The filters pass [1, 3] through unchanged. Channel LayerNorm makes [−a, a], with a = 1/√(1 + 10⁻⁶). Expansion copies these into the first two slots and leaves six zeros; GELU bends the first two values. Projection selects those two activations. Multiplying by 0.1 gives corrections approximately [−0.015865529559, 0.084134420441], so addition produces [0.984134470441, 3.084134420441]. No DropPath is active. These are the same operation sequence as the full block, with hand-chosen weights.</Prose>
<Prose>Run the same weights through the complete block using the following program, saved beside <code>convnext-blocks.py</code>. It sets the spatial kernels to centre impulses, copies the first two channel inputs into the expansion, selects them on projection and fixes LayerScale at 0.1. An independent <code>math.erf</code> calculation checks the final values. This reuses the full implementation rather than hiding a second shortcut block.</Prose>
<ConvNeXtProgram file="convnext-worked-block.py" title="Run the exact two-channel block traced above" />
<Prose>The full V1 block below restores the 7 × 7 spatial filters and fourfold hidden width. Slab width encodes channel width C → 4C → C; spatial grid H × W is held fixed. Follow the saved x wire until it enters ⊕.</Prose>
<ConvNeXtBlockFigure />
<Prose>Filtering comes before expansion, so a 7 × 7 depthwise filter has 49C weights, rather than 196C if placed at the fourfold width. The two channel maps contain 8C² matrix weights. Biases, channel LayerNorm and LayerScale add smaller vectors. With all those parameters included,</Prose>
<div className="neural-equation"><MathBlock>{"(49C+C)+2C+(4C^2+4C)+(4C^2+C)+C=8C^2+58C."}</MathBlock></div>
<Prose>At C = 96 this gives 79,296 parameters; 73,728 are in the channel matrices, approximately 93%. One MAC means one product accumulated into a sum. Counting convolution/linear MACs alone gives HW(49C + 8C²) per specimen, excluding normalization, activations, biases and residual addition. Change C, kernel size or grid size to see these different dependencies; expansion stays fourfold in this lab, and practice 2 changes it to threefold in code.</Prose>
<ConvNeXtBudgetLab />
<Prose>Growing the grid multiplies computation without adding filter coefficients. Growing C makes the channel-matrix term quadratic. This arithmetic motivates a resource decision; actual latency also depends on memory traffic and available kernels. LayerScale may later learn any sign or magnitude. A small residual correction does not make the whole network an identity, because its stem, stage transitions and classifier still change shapes and values.</Prose>
<Prose>In the program, the correction is computed before DropPath masks it. Masking its contribution therefore does not save its convolution work. Across 18 blocks with drop probabilities linearly spanning 0 to 0.1, the expected number of retained contributions is 17.1 while all 18 branch computations still execute.</Prose>

<H2>{"3. From the block to a feature hierarchy"}</H2>

<Prose>One block preserves its shape. To collect broader evidence, repeat blocks inside stages and reduce the grid only between stages. We now switch from the hand-sized two-channel block to the reference Tiny classifier on 224 × 224 RGB images; the diagram shows where the same block sits.</Prose>
<ConvNeXtHierarchy />
<Prose>The stem is a 4 × 4 stride-4 convolution, followed by channel LayerNorm. Each first-stage location reads one non-overlapping pixel patch. Dividing 224 by 4 gives the 56 × 56 grid; the Tiny stem learns 96 channels. Between stages, LayerNorm precedes a 2 × 2 stride-2 convolution. Each transition halves both spatial dimensions and doubles channel width.</Prose>

<Prose>{"Four stages progressively reduce spatial resolution while increasing channel width:"}</Prose>

<NeuralTable caption={"Tiny feature stages"} headers={[<>{"Tiny stage"}</>,<>{"Grid"}</>,<>{"Channels"}</>,<>{"Repeated blocks"}</>,<>{"What becomes possible"}</>]} rows={[[<>{"1"}</>,<>{"56×56"}</>,<>{"96"}</>,<>{"3"}</>,<>{"Local detail represented at many positions"}</>],[<>{"2"}</>,<>{"28×28"}</>,<>{"192"}</>,<>{"3"}</>,<>{"Broader combinations at fewer positions"}</>],[<>{"3"}</>,<>{"14×14"}</>,<>{"384"}</>,<>{"9"}</>,<>{"More processing at a wider intermediate representation"}</>],[<>{"4"}</>,<>{"7×7"}</>,<>{"768"}</>,<>{"3"}</>,<>{"A compact, semantically useful feature map"}</>]]} />

<Prose>The classification head averages the final maps over locations, then normalizes the pooled vector. Could we normalize each location before averaging instead? Return briefly to two locations with two channels; the fork below holds their input values fixed.</Prose>
<ConvNeXtHeadOrderFigure />
<Prose>Pooling [1, 3] and [9, 5] first gives [5, 4]; channel normalization preserves which channel is stronger. Normalizing each location first turns their opposite contrasts into almost [−1, 1] and [1, −1], whose average nearly cancels. These operations have matching output size but lose different information. The Tiny head uses the pool-then-normalize route on its 768-channel final representation.</Prose>

<Prose>{"The hierarchy is useful beyond classification. A segmentation head can use fine-grid features to locate boundaries and coarse-grid features for context. A detector can attach heads to multiple scales. This explains why exposing stage outputs matters even when the original model's final head produces only one label."}</Prose>

<Prose>{"Increasing channels while decreasing area also explains stage cost. Doubling "}<InlineMath>{"C"}</InlineMath>{" and dividing "}<InlineMath>{"HW"}</InlineMath>{" by 4 leaves the leading "}<InlineMath>{"8HWC^2"}</InlineMath>{" term unchanged "}<strong>{"per block"}</strong>{". The depthwise term halves. Adding more blocks to the third stage concentrates work there. The Tiny stage depths are 3, 3, 9, 3: 18 blocks. Small, Base, Large and XLarge V1 configurations use 3, 3, 27, 3: 36 blocks."}</Prose>

<Prose>The complete architecture program below §4 builds the block, transitions and head, and checks large configurations using meta tensors: shape and parameter representations that need not allocate full model weights. The following V1 calculations use a 1,000-class head:</Prose>

<NeuralTable caption={"Calculated V1 topology costs"} headers={[<>{"V1 configuration"}</>,<>{"Initial width"}</>,<>{"Parameters"}</>,<>{"Conv/linear MACs at 224²"}</>]} rows={[[<>{"Tiny"}</>,<>{"96"}</>,<>{"28,589,128"}</>,<>{"4,455,531,264"}</>],[<>{"Small"}</>,<>{"96"}</>,<>{"50,223,688"}</>,<>{"8,683,712,256"}</>],[<>{"Base"}</>,<>{"128"}</>,<>{"88,591,464"}</>,<>{"15,354,729,472"}</>],[<>{"Large"}</>,<>{"192"}</>,<>{"197,767,336"}</>,<>{"34,361,433,600"}</>],[<>{"XLarge"}</>,<>{"256"}</>,<>{"350,196,968"}</>,<>{"60,921,030,656"}</>]]} />

<Prose>{"These are calculations for the stated topology, not training results. Input resolution changes activation sizes and work; it does not change a convolution's learned kernel count. Strided sampling also means shifting an image by one pixel need not simply shift its final features. Shared convolution weights do not make an entire downsampled classifier exactly translation invariant."}</Prose>

<Prose>{"The block and the hierarchy are also separable choices. An "}<strong>{"isotropic"}</strong>{" variant keeps the same grid size and channel width through its repeated blocks, using an initial projection to establish that grid. It gives up the native four-scale output hierarchy. The original study tested such configurations too; their result asks whether the block remains useful without staged downsampling, not whether all tasks should discard multiple resolutions."}</Prose>

<H2>{"4. Global response normalization: look across the feature map"}</H2>

<Prose>The hierarchy gives us a complete recognizer, but channel LayerNorm only compares channels at one location. What if we want each channel to respond to how active the other whole maps are? ConvNeXt V2 adds global response normalization, GRN, inside the expanded branch after GELU. For hand calculation we switch to two maps, A = [3, 4] and B = [0, 12], each containing two spatial values.</Prose>
<Prose>Measure each map by its Euclidean length G: square its entries, sum and take the square root. Divide each length by their shared mean plus ε to get relative response R. A learned scale γ sets how much that response changes the map; shift β is held at zero. The drawing traces both maps into the shared denominator and back into the map outputs. Initially γA = 0.5 and γB = −0.5; the controls change A's scale and B's second input, while β = 0 and ε = 10⁻⁶ stay fixed.</Prose>
<ConvNeXtResponseLab />
<Prose>A has length √(3² + 4²) = 5; B has length 12. Their mean is 8.5, so RA ≈ 0.588235 and RB ≈ 1.411765. With γA = 0.5 and γB = −0.5, each output equals its original value times (1 + γR): A becomes [3.882353, 5.176470] and B becomes [0, 3.529413]. Reducing B to zero raises A's relative response toward 2, making A approach [6, 8] although its input is unchanged.</Prose>
<Prose>{"For "}<InlineMath>{"X"}</InlineMath>{" with logical shape "}<InlineMath>{"N,H,W,C"}</InlineMath>{", define"}</Prose>

<div className="neural-equation"><MathBlock>{"G_{n,c}=\\sqrt{\\sum_{h,w}X_{n,h,w,c}^2},\\qquad\nR_{n,c}=\\frac{G_{n,c}}{\\frac1C\\sum_jG_{n,j}+\\epsilon},"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"Y_{n,h,w,c}=X_{n,h,w,c}\n+\\gamma_c X_{n,h,w,c}R_{n,c}+\\beta_c."}</MathBlock></div>

<Prose>{"The first reduction summarizes each whole channel map. The second compares these channel magnitudes. The result broadcasts back to every location. GRN does not subtract a spatial mean or force each channel to unit variance. The definition above matches the dense reference implementation: the map norm and channel mean are calculated separately for each specimen. The official sparse pretraining helper reduces its active-coordinate array differently; that code's batching and active-set contract must be inspected before treating it as the same per-specimen dense calculation. "}<a href={"https://github.com/facebookresearch/ConvNeXt-V2/blob/main/models/utils.py"}>{"Official GRN implementation"}</a>{""}</Prose>

<Prose>{"Initial identity does not mean the layer is absent from learning. For the same two maps and loss "}<InlineMath>{"L=\\frac12\\sum Y^2"}</InlineMath>{", at "}<InlineMath>{"\\gamma=\\beta=0"}</InlineMath>{","}</Prose>

<Prose>{"You can obtain the scale gradients without differentiating the norm yet. Holding the input fixed, a small change in "}<InlineMath>{"\\gamma_c"}</InlineMath>{" changes output location "}<InlineMath>{"h,w"}</InlineMath>{" by "}<InlineMath>{"X_{h,w,c}R_c"}</InlineMath>{". At identity, the upstream squared-loss derivative is "}<InlineMath>{"Y=X"}</InlineMath>{". Summing over locations therefore gives "}<InlineMath>{"\\partial L/\\partial\\gamma_c=R_c\\sum_{h,w}X_{h,w,c}^2"}</InlineMath>{": for A, multiply "}<InlineMath>{"5/(8.5+\\epsilon)"}</InlineMath>{" by "}<InlineMath>{"3^2+4^2=25"}</InlineMath>{"; for B, multiply "}<InlineMath>{"12/(8.5+\\epsilon)"}</InlineMath>{" by 144. The bias gradient sums the upstream values, giving 7 and 12. A zero parameter value does not imply a zero slope with respect to that parameter. Derivatives through the shared norm matter for the input path once its multiplier is nonzero."}</Prose>
<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial\\gamma_A}\\approx14.705881,\\quad\n\\frac{\\partial L}{\\partial\\gamma_B}\\approx203.294094,\\quad\n\\frac{\\partial L}{\\partial\\beta}=[7,12]."}</MathBlock></div>

<Prose>Those nonzero parameter gradients allow γ and β to change on the first optimizer update. At identity, the input derivative for this squared loss is X; after the scale changes, gradients also pass through the shared map lengths. The complete numerical check compares these derivatives with independent central differences.</Prose>

<Prose>Now place the new operation in the block you already traced. V2 inserts GRN after GELU at width 4C and removes V1's LayerScale. The original x bypass still enters the same final addition.</Prose>
<ConvNeXtBlockFigure version={2} />
<Prose>The two GRN vectors have 8C values in total; removing the C-value LayerScale adds a net 7C parameters. Thus V2 has 8C² + 65C parameters: 79,968 at C = 96, which is 672 more than V1. GRN begins as identity, but that identity does not make the whole V2 residual branch tiny. Its learned signs can increase or decrease a channel, so this mechanism is a shared response statistic rather than a guaranteed diversity or quality score.</Prose>
<Prose>With both versions now defined, read their complete composition. <code>ChannelNorm</code> moves channels last for normalization and restores NCHW; <code>ConvNeXtBlock</code> performs the spatial → channel → residual sequence. <code>ConvNeXt</code> creates the stem, stage transitions and pooled head, with independent block objects at each depth. Its initialization writes small truncated-normal convolution/linear weights and zero biases, while LayerScale or GRN retain their explicitly initialized vectors. <code>costs</code> counts only the convolution/linear work declared above. Run <code>python convnext-blocks.py</code> to check the complete topologies without allocating their full weights, then small real forward/backward cases. The hand-trace program invokes the same block class.</Prose>
<ConvNeXtProgram file="convnext-blocks.py" title="Read the complete V1/V2 block, hierarchy, initialization and shape checks" />

<H2>{"5. Learn from missing pixels without giving away the answer"}</H2>

<Prose>So far we have described blocks used for recognition. How can we train their features when class labels are scarce? Hide part of an image, supply only the visible pixels, and ask a decoder to reconstruct the missing pixels. This is self-supervised learning: original data supplies the training target. The fork below separates available input from the hidden target; we draw an 8 × 8 image partitioned into sixteen 2 × 2 patches, with six visible and ten hidden. Those ten patches contain forty target pixels. This is the same information boundary used by the digit experiment in §6.</Prose>
<ConvNeXtMaskFigure />
<Prose>The encoder reads available pixels and makes features. Missing sites are marked × and remain inactive there. Only after encoding do learned mask tokens provide placeholders to the decoder, which predicts pixels at all sites. A separate original-image route reaches the loss: it supplies hidden target values for squared-error scoring, never input to the encoder. A visible black pixel is an observed zero; an unavailable pixel is missing evidence.</Prose>

<Prose>{"The central constraint is informational. If the hidden pixels enter the encoder through a convolution, normalization statistic or another route, a good reconstruction may reflect access to the answer."}</Prose>

<H3>{"Separate what is visible from what is scored"}</H3>

<Prose>{"Let "}<InlineMath>{"M"}</InlineMath>{" be 1 at visible pixels and 0 at hidden pixels. An input-masking operation forms "}<InlineMath>{"M\\odot x"}</InlineMath>{", where "}<InlineMath>{"\\odot"}</InlineMath>{" is elementwise multiplication. A hidden-pixel loss is"}</Prose>

<div className="neural-equation"><MathBlock>{"L=\\frac{\\sum_{i:M_i=0}(\\widehat{x}_i-x_i)^2}\n{\\#\\{i:M_i=0\\}}."}</MathBlock></div>

<Prose>{"The encoder sees the visible values. The loss compares predictions with the original hidden targets. Editing a hidden target therefore can change the loss without changing the prediction. This is correct behavior, not a contradiction."}</Prose>

<Prose>{"In a multistage convolutional encoder, masking the raw input alone is not the same as maintaining a fixed set of active feature locations. Convolution can write features into inactive locations; biases and channel transformations can make zero inputs nonzero. A masked-dense implementation must keep its intended active set masked at the relevant operations. A sparse implementation explicitly represents and computes on active coordinates. Their runtime costs and normalization behavior must be checked separately."}</Prose>

<Prose>{"The published "}<strong>{"fully convolutional masked autoencoder"}</strong>{", FCMAE, masks 60% of 32×32 input patches, matching the final encoder-grid granularity, and propagates that mask through the hierarchy. Its lightweight decoder receives encoded visible features and mask tokens at missing positions. Its loss uses patch-normalized hidden targets. Our small experiment below preserves the visibility/target distinction while deliberately using smaller patches and a simpler loss. "}<a href={"https://arxiv.org/pdf/2301.00808"}>{"FCMAE construction"}</a>{""}</Prose>

<Prose>The reference implementation standardizes each target patch. What information does that ask the decoder to recover? We use two values per patch so the arithmetic fits on the page; real FCMAE RGB patches contain p² × 3 values. Compare these patches on the scoring route.</Prose>
<ConvNeXtTargetFigure />
<Prose>Both patches have deviations [−1, 1] from their own mean. The official FCMAE <code>target.var(dim=-1)</code> uses PyTorch's default correction 1: sum squared deviations and divide by m − 1 for m patch values. For these two-value examples the variance is 2, so dividing by √2 gives approximately [−0.707107, 0.707107] before ε. With a population divisor m it would instead give [−1, 1]; that is a different numerical convention. The <a href="https://github.com/facebookresearch/ConvNeXt-V2/blob/main/models/fcmae.py">official target-loss source</a> adds 10⁻⁶ before taking the square root. This normalized-target loss asks for within-patch contrast; raw-pixel loss also penalizes brightness differences. Sending a hidden patch's mean or scale into encoder preprocessing would cross the information boundary. Our digit experiment uses raw normalized-pixel targets so those brightness differences remain in its loss.</Prose>

<H3>{"Why a second evaluation is needed"}</H3>

<Prose>A low reconstruction error could come from good local interpolation while the features still fail to separate object categories. Freeze the encoder and train a linear classifier on its features to test what label information is accessible. This separate evaluation is called a linear probe; only the classifier is trained.</Prose>
<ConvNeXtProbeFigure />
<Prose>Clean images now enter the frozen encoder with all pixels available. Training labels fit the readout; reserved images test its predictions. Reconstruction and recognition are different measured tasks. Fine-tuning would update the encoder as well, as taught in <a href="/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies?module=deep-learning-fundamentals">Transfer Learning</a>.</Prose>

<Prose>{"Neither reconstruction error nor a channel-diversity statistic can substitute for that task evaluation. Even a successful probe on a small development split does not establish deployment performance."}</Prose>

<H2>{"6. An actual masked-digit experiment"}</H2>

<Prose>{"The "}<a href={"/learn-assets/convnext-modern-cnn-designs/digits-400.csv"}>{"offline CSV"}</a>{" contains 400 real 8×8 optical digit images,40 per class, drawn from UCI's Optical Recognition of Handwritten Digits dataset through scikit-learn's local copy. They are not MNIST images. Each integer pixel lies in 0–16; divide by 16 using the known scale. Preserve the "}<a href={"/learn-assets/convnext-modern-cnn-designs/data-provenance.md"}>{"dataset attribution, subset construction and split record"}</a>{"."}</Prose>

<Prose>{"The unit here is an image specimen. Before splitting, the program checks 400 unique source IDs and 400 distinct pixel vectors. Writer identifiers are unavailable, so this is not an independent-writer assessment. It reserves 120 stratified development images and trains on 280, using split seed 22. Development images are excluded even from unlabeled reconstruction training."}</Prose>

<H3>{"The small model and the controlled difference"}</H3>

<Prose>We now move from constructed maps to real 8 × 8 digit images, keeping the same spatial/channel block and visibility boundary. The small model uses a 2 × 2 stride-2 stem and twelve channels so that its full training and reconstruction can run on a CPU. Follow the encoder and decoder tensors before reading the training protocol.</Prose>
<ConvNeXtMaskFigure small />
<Prose>Six of sixteen 2 × 2 patches are visible and ten hidden: 62.5% hidden, rather than the paper's 60%. The stem makes a 4 × 4 grid with twelve channels. Two encoder blocks use 3 × 3 depthwise filtering and 12 → 48 → 12 mixing; the one-block decoder and four-value pixel head reconstruct the full 8 × 8 image. A missing-site token enters only the decoder route.</Prose>

<Prose>{"We compare two variants that differ only in whether the encoder expansion includes GRN. "}<strong>{"Neither has LayerScale"}</strong>{", and both use the same small decoder. These are paired GRN experiments, not miniature reproductions of every difference between official V1 and V2."}</Prose>

<Prose>{"The training program uses AdamW with learning rate 0.002, weight decay 0.01 and 600 full-batch updates. Weight decay applies to all parameters in this teaching experiment; this is not the paper's optimizer grouping. Each update generates a new six-visible-patch mask. Each paired seed uses identical initial shared tensors and the same mask sequence; GRN's additional scale/shift vectors start at zero."}</Prose>

<Prose>{"For evaluation, four fixed masks per specimen allow comparisons on the same missing pixels. The loss is raw normalized-pixel MSE on the 40 hidden pixels per image, not the paper's patch-normalized target loss. No augmentation, DropPath, checkpoint search or model selection is used. Steps 0,1,100,300,600 are recorded; only the declared final step supplies the comparison."}</Prose>

<H3>{"Run the complete program"}</H3>

<Prose>{"Download "}<a href={"/learn-assets/convnext-modern-cnn-designs/masked-reconstruction.py"}>{"masked-reconstruction.py"}</a>{" and "}<a href={"/learn-assets/convnext-modern-cnn-designs/digits-400.csv"}>{"digits-400.csv"}</a>{" into the same directory. In a Python environment with PyTorch, NumPy and scikit-learn installed, run:"}</Prose>

<CodeBlock language={"bash"}>{"python masked-reconstruction.py"}</CodeBlock>

<Prose>{"The script sets one PyTorch CPU thread and requires no network access or pretrained checkpoint. It contains the full model, mask generator, loss, train/development split, optimizer loop, fixed-mask evaluation and frozen-feature probe. It writes "}<a href={"/learn-assets/convnext-modern-cnn-designs/calculated-inputs.json"}>{"calculated-inputs.json"}</a>{"; the supplied copy contains the recorded run on Python 3.12.14, PyTorch 2.14.0+cpu, NumPy 2.3.5 and scikit-learn 1.9.1. Small numerical differences across library/platform versions are possible."}</Prose>

<ConvNeXtProgram file="masked-reconstruction.py" title="Read the complete masked learning, evaluation and probe program" /><Prose>To reproduce the recorded environment in a separate activated Python environment, run <code>python -m pip install torch==2.14.0 numpy==2.3.5 scipy scikit-learn==1.9.1</code>. For the separate native block bridge, also install <code>torchvision==0.29.0 pillow</code>. The full source loads automatically near its visible code view; the downloaded CSV runs offline.</Prose>

<Prose>{"The core masking/loss excerpt is worth reading before running the complete file:"}</Prose>

<CodeBlock language={"python"}>{"def masked_mse(predictions, targets, visible):\n    hidden_pixels = (1-visible).repeat_interleave(2,2).repeat_interleave(2,3)\n    return ((predictions-targets).square()*hidden_pixels).sum()/hidden_pixels.sum()"}</CodeBlock>

<Prose>{"Here "}<code>{"visible"}</code>{" has shape "}<InlineMath>{"N,1,4,4"}</InlineMath>{". Repeating each grid location twice along each spatial axis makes its 2×2 pixel patch share the same visibility. The numerator sums error only where the mask is hidden; the denominator is the number of those pixels. An all-visible mask would have denominator zero and is not an allowed reconstruction-loss input. All-visible images are valid for feature extraction, where this loss is not called."}</Prose>

<Prose>{"Inside the encoder, the input is masked before the stem; inactive feature positions are suppressed after spatial filtering, expansion and residual addition. The decoder can fill missing positions, as it must to predict them. "}<a href={"/learn-assets/convnext-modern-cnn-designs/author-checks.py"}>{"Independent scalar-loop checks"}</a>{" reproduce all four saved real examples to within "}<InlineMath>{"3.3\\times10^{-7}"}</InlineMath>{" of the stored outputs."}</Prose>

<H3>{"What actually happened"}</H3>

<Prose>{"A training-mean-image baseline predicts the same image regardless of visible content. Its development masked MSE is 0.071914. The learned models do better on this reconstruction criterion:"}</Prose>

<NeuralTable caption={"What actually happened"} headers={[<>{"Paired seed"}</>,<>{"GRN absent: masked MSE"}</>,<>{"GRN present: masked MSE"}</>,<>{"Frozen probe correct, absent / present"}</>]} rows={[[<>{"1"}</>,<>{".052188"}</>,<>{".052313"}</>,<>{"115/120 /116/120"}</>],[<>{"2"}</>,<>{".052336"}</>,<>{".051906"}</>,<>{"115/120 /116/120"}</>],[<>{"3"}</>,<>{".051670"}</>,<>{".051488"}</>,<>{"115/120 /116/120"}</>]]} />

<Prose>{"The probe standardizes each extracted feature using training statistics, then fits logistic regression with "}<InlineMath>{"C=1"}</InlineMath>{". It sees the clean image through a frozen encoder. A separate standardized logistic regression fitted directly to the 64 raw pixels gets 118/120 correct. All six feature probes fit the 280 training labels perfectly."}</Prose>

<ConvNeXtRecordedExperiment />

<Prose>{"Several conclusions now become possible, and several do not:"}</Prose>

<ul><li>{"The learned reconstructions beat this training-mean-image baseline on the specified missing-pixel task."}</li><li>{"GRN does not improve reconstruction in every seed. Its probe gets one extra image correct in each paired run on this one development split."}</li><li>{"The simpler raw-pixel classifier gets more development labels right than any frozen-feature probe here."}</li><li>{"We did not compare against a random untrained encoder, vary the label budget, fine-tune the encoder or reserve an untouched test. These results do not isolate the benefit of pretraining or establish a universal architecture ranking."}</li></ul>

<Prose>{"Repeated seeds vary initialization and training masks; they are not independent new datasets. The development data are now consumed by interpretation. If you use these findings to choose a model, obtain a separate appropriate final evaluation before making a deployment claim."}</Prose>

<H3>{"Look at a specimen, then intervene"}</H3>

<Prose>The saved states contain both seed-1 models and two development specimens: source 251, actual digit 4, and source 40, actual digit 9. The pixel lab below holds source 251, the GRN model and its original mask fixed, so a single edit has a clear cause. Select a target pixel in the grid, then move its intensity slider; the white outline marks the selected coordinate.</Prose>

<ConvNeXtReconstructionLab />

<Prose>{"For source 251 with GRN, flipping hidden pixel (row 0, column 0) from 0 to 1 leaves every prediction unchanged, while masked MSE changes from approximately 0.054047 to 0.080387. Flipping the visible pixel (0,2) instead changes the reconstruction, with maximum absolute output change about 0.506609 in native inference. The paired model without GRN has the same hidden-input invariance and a different visible-input response."}</Prose>

<Prose>Try the hidden pixel (row 0, column 0), then restore the image and select visible pixel (0, 2). A hidden edit changes the target error but leaves encoder input and reconstruction unchanged. A visible edit changes available evidence and can change the reconstruction. Browser inference approximates erf; the preserved native/model comparison checks its bounded outputs within 10⁻⁵.</Prose>
<Prose>Next hold every image pixel fixed and change which patches are available. Click one visible patch and one hidden patch to exchange them. This keeps six visible patches, so the number of scored pixels remains forty; only their location and available evidence change.</Prose>
<ConvNeXtPatchLab />
<Prose>This is a different intervention from changing one brightness value: the mask changes both the encoder's evidence and which targets are scored. Compare those two routes before assigning a loss change to a better representation.</Prose>

<H3>{"Inspect features without overinterpreting a diagnostic"}</H3>

<Prose>{"The program measures spatial cosine distance between distinct nonzero channel maps at the final encoder expansion. For maps "}<InlineMath>{"a,b"}</InlineMath>{", it uses "}<InlineMath>{"(1-\\cos(a,b))/2"}</InlineMath>{"; identical positive-direction maps have distance 0. Near-zero maps are counted separately instead of assigning an arbitrary cosine."}</Prose>

<Prose>{"Every run has zero near-zero-channel fraction under the declared threshold. Mean nonself distances with GRN are slightly higher in seed 1 and slightly lower in seeds 2–3. Thus “more active channels” does not explain the small probe difference, and this diagnostic is not a quality score. Inspect what a statistic measures before attaching an architectural story to it."}</Prose>

<H2>{"7. Deeper routes: deploy, reparameterize, or combine mechanisms"}</H2>

<H3>{"Use a checkpoint as a complete input/output contract"}</H3>

<Prose>{"For a practical pretrained model, record the exact library/version, architecture, weight identifier, input transforms, output classes and intended downstream evaluation. A weight file is not useful independently of this contract."}</Prose>

<Prose>{"The inspected "}<a href={"https://docs.pytorch.org/vision/main/models/generated/torchvision.models.convnext_tiny.html"}>{"Torchvision ConvNeXt Tiny documentation"}</a>{" exposes "}<code>{"ConvNeXt_Tiny_Weights.IMAGENET1K_V1"}</code>{" and its "}<code>{"transforms()"}</code>{". Its reported 82.52% ImageNet result belongs to Torchvision's modified recipe; it is not the original paper's 82.1% result. For those weights, use the provided resize/crop/normalization and category metadata. Replace the classifier and evaluate your task if the target classes differ; the ImageNet head does not acquire new classes by renaming its outputs."}</Prose>

<Prose>{"The attached architecture program offers "}<code>{"return_features=True"}</code>{" for the four stage maps. This is the useful interface for a downstream head: inspect its exact shapes and scale meaning before connecting it. Full transfer-learning training and split design belong to "}<a href={"/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies?module=deep-learning-fundamentals"}>{"Transfer Learning & Fine-Tuning Strategies"}</a>{"; no pretrained download is required for this lesson's executed experiment."}</Prose>

<Prose>{"Logical layout and memory layout are different. "}<code>{"permute(0,2,3,1)"}</code>{" makes a view whose dimension order is NHWC. "}<code>{"to(memory_format=torch.channels_last)"}</code>{" retains the logical NCHW shape while changing storage strides. A permutation itself does not copy values, but later operations may need to materialize a suitable layout. Measure the complete workload before promising a speedup. "}<a href={"https://docs.pytorch.org/tutorials/intermediate/memory_format_tutorial.html"}>{"PyTorch's channels-last tutorial"}</a>{""}</Prose>

<H3>{"Fold several training branches into one inference kernel"}</H3>

<Prose>The block's ordinary library route preserves its learned function. Can we also simplify a trained branch graph without changing that function? Structural reparameterization trains several branches and then replaces them with one equivalent inference operation. The drawing below combines a 3 × 3 branch, a centred 1 × 1 branch and identity. BatchNorm uses fixed evaluation statistics; kernel coefficients and the affine biases can therefore be aligned and added.</Prose>
<ConvNeXtFusionLab />
<Prose>The first grid already includes its fixed BatchNorm multiplier. The 1 × 1 contribution and identity coefficient 1 land only at the centre of that grid; they do not spread across neighbouring offsets. Adding each aligned coefficient forms the fused kernel, while adding branch biases gives the fused bias. Every output position sees the same affine map by either route.</Prose>
<Prose>For a convolution z = Wx + b, BatchNorm with fixed mean μ, variance v, learned scale γ and shift β gives</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{BN}(Wx+b)=\n\\left(\\frac{\\gamma}{\\sqrt{v+\\epsilon}}W\\right)x+\n\\left(\\frac{\\gamma(b-\\mu)}{\\sqrt{v+\\epsilon}}+\\beta\\right)."}</MathBlock></div>

<Prose>{"Each output channel gets its own multiplier and bias. Fold each linear branch this way. Pad a smaller odd-sized kernel with zeros so its center aligns with the larger kernel; represent an identity path as a center coefficient 1 for corresponding input/output channels. Add the aligned kernels and biases."}</Prose>

<Prose>{"This works only when the branches have compatible input/output shapes, stride, coordinate alignment and groups, and the normalization statistics are fixed. A shared activation "}<strong>{"after"}</strong>{" the summed branches can remain after the fused convolution. Separate nonlinear activations inside branches generally cannot be folded this way."}</Prose>

<Prose>With the original fixture, the separate and fused centre output is approximately 111.049826; differences across all positions are rounding-sized. The equality is algebraic when branch alignment and fixed statistics hold. Separate activations inside branches require a new check. For scalar input x, ReLU(x) keeps positive values and clips negatives to zero. The two routes below either activate x and −x separately before adding, or add them to zero before activating.</Prose>
<ConvNeXtNonlinearLab />
<Prose>For x = −2, ReLU(x) + ReLU(−x) is 2, while ReLU(x − x) is 0. At x = 0 both are zero; agreement at a single input does not justify replacing one function with the other.</Prose>

<Prose>{"Large-kernel models such as "}<a href={"https://arxiv.org/pdf/2203.06717"}>{"RepLKNet"}</a>{" use this idea to aid training while retaining a large spatial filter at inference. Its main blocks use a parallel 5×5 branch with the large kernel. "}<a href={"https://arxiv.org/pdf/2206.04040"}>{"MobileOne"}</a>{" applies related deployment-oriented reasoning to small blocks. A 31×31 depthwise kernel reads a broader dense stencil, but its coefficients remain shared learned values; they are not automatically input-dependent attention weights."}</Prose>

<H3>{"When a hybrid is a useful hypothesis"}</H3>

<Prose>{"Attention forms a weighted sum of value vectors, with weights obtained from the current input. A query describes what one output location seeks; keys describe the candidate locations, and values carry the content to combine. Convolution uses a learned spatial stencil shared across inputs. Both can mix spatial evidence, but attention layers also include channel projections, and their complete block topology differs from a ConvNeXt block."}</Prose>

<Prose>{"A hybrid can use local convolution where the grid is large and more global input-dependent interactions after the grid has shrunk. "}<a href={"https://arxiv.org/pdf/2106.04803"}>{"CoAtNet"}</a>{" studies such stage arrangements. "}<a href={"https://arxiv.org/pdf/2204.01697"}>{"MaxViT"}</a>{" alternates local block attention with a sparse grid arrangement that connects distant positions. These are concrete choices about which positions communicate, not evidence that adding attention anywhere must help."}</Prose>

<Prose>Why put global interactions later in a hybrid? Every fine-grid query has many possible keys. The drawing follows one selected query; only a small representative set of sites is drawn, while the labels count all locations in the stated grids.</Prose>
<ConvNeXtCommunicationFigure />
<Prose>A full 56 × 56 grid has 3,136 positions and 3,136 keys per query: 9,834,496 pairs per head. At 14 × 14, 196² = 38,416 pairs, 256 times fewer. A local 7 × 7 stencil reads at most 49 offsets per output. These count spatial connections; channel projections, boundaries and fused kernels determine additional runtime and memory costs. Downsampling makes broad communication cheaper but can discard detail needed to localize an object.</Prose>

<Prose>{"For a factory-defect application, local texture may matter alongside long-range alignment between repeated parts. A ConvNeXt feature hierarchy, a larger convolutional receptive field and a hybrid interaction pattern are competing hypotheses. Split by production unit or scene when multiple images share an origin, establish a simple baseline, then examine the errors that distinguish those hypotheses. A smaller-input label classifier and a high-resolution localization system need different evaluation and memory budgets."}</Prose>

<Prose>{"The later attention and vision-transformer lessons develop the weighted-sum mechanism in full. Here the useful connection is to ask "}<strong>{"which evidence can reach this output, through which operation, at what resolution and cost?"}</strong>{""}</Prose>

<H2>{"Match the block you built to the maintained implementation"}</H2>

<Prose>The complete <a href="/learn-assets/convnext-modern-cnn-designs/convnext-blocks.py">convnext-blocks.py</a> constructs V1 and V2 from convolution, array reductions, linear maps, activation and residual addition. It exposes the new composition rather than importing a hidden ConvNeXt model. Earlier lessons supply the primitives: <a href="/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals">Convolution &amp; Pooling</a> develops convolution indexing, and <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation</a> develops differentiation. The masked program adds this lesson's visibility, reconstruction and training contract.</Prose>

<Prose>{"The new "}<a href={"/learn-assets/convnext-modern-cnn-designs/convnext_library_bridge.py"}>{"convnext_library_bridge.py"}</a>{" connects the V1 block to Torchvision's "}<code>{"CNBlock"}</code>{". It copies the depthwise convolution, LayerNorm, two linear maps and channel scale before comparing anything. Torchvision stores LayerScale as "}<code>{"[C,1,1]"}</code>{"; our NHWC branch uses "}<code>{"[C]"}</code>{". The values mean the same per-channel factor only after this layout mapping. Both paths disable stochastic depth for the equality check, use float64, and compare outputs, input gradients and every trainable gradient on a rectangular 5 × 7 map. Random masks or mismatched normalization axes would make an otherwise plausible comparison invalid."}</Prose>

<Prose>Run <code>python convnext_library_bridge.py</code> beside <code>convnext-blocks.py</code> with compatible PyTorch/Torchvision. The offline comparison was executed with PyTorch 2.14.0+cpu and Torchvision 0.29.0: V1 outputs, input gradients and all trainable gradients agree under the program’s 1e−12 absolute/relative tolerances. It deliberately targets V1: Torchvision’s <code>CNBlock</code> does not become V2 merely because both are called ConvNeXt. The local <code>ResponseNorm</code> exposes the complete V2 operation, independently differentiated and checked against central differences. <a href="https://github.com/pytorch/vision/blob/v0.29.0/torchvision/models/convnext.py">Torchvision block source</a>.</Prose>

<Prose>{"The same program accepts "}<code>{"--image example.jpg"}</code>{". It selects "}<code>{"ConvNeXt_Tiny_Weights.IMAGENET1K_V1"}</code>{", applies that enum's RGB transform and reads category labels from its metadata. It downloads that checkpoint if absent, runs eval/inference mode, and reports a real photograph's top-five probabilities. This ordinary application is separate from the masked-digit training experiment, and has no prepared accuracy claim. Pillow and a local image are explicit inputs. Feature adaptation follows the implemented "}<a href={"/learn/path/full-curriculum/transfer-learning-fine-tuning-strategies#transfer-section-3"}>{"Transfer Learning section 3"}</a>{"; the imported model's training recipe is not re-created by this inference call."}</Prose>

<ConvNeXtProgram file="convnext_library_bridge.py" title="Read the matched-state library bridge and optional pretrained photograph route" /><Prose>The offline matched-state bridge was executed. The optional photograph route was not executed: it requires a learner-supplied image and the specified external checkpoint. Its complete source shows the ordinary transform/metadata/inference contract without assigning it an unmeasured accuracy.</Prose>

<Prose>{""}<strong>{"Modify the block deliberately:"}</strong>{" change expansion 4 to expansion 2 in the local block, retaining the depthwise width and residual output width. Rebuild both linear layers and, for V2, the response-normalization parameter vectors at 2C. The pointwise matrix weights fall from 8C² to 4C²; depthwise weights stay 49C. The original Torchvision block then ceases to be a direct same-shape counterpart, so compare your modified block to a separately assembled reference with the new dimensions rather than weakening the old assertions."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The hidden width belongs to every operation between expansion and projection, not only the first Linear."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"At C = 8 use "}<code>{"Linear(8,16)"}</code>{", a 16-channel GRN if V2, then "}<code>{"Linear(16,8)"}</code>{". Preserve the output shape, test finite input/weight gradients, and check that zero LayerScale or zero projection still gives the expected residual identity. The pointwise weights total 256 instead of 512; include biases separately. A 256-weight saving is an arithmetic result, not proof of better validation accuracy or latency."}</Prose>

</details>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"8. Practice: reason about a changed design"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Catch a shape-correct normalization error"}</H3>

<Prose>{"A tensor has shape "}<InlineMath>{"N,32,7,32"}</InlineMath>{". Someone applies "}<code>{"nn.LayerNorm(32)"}</code>{" directly and says it normalizes channels. Explain what it actually does and give a correct channel-normalization route."}</Prose>

<details><summary>Hint</summary>

<Prose>{"LayerNorm matches its normalized shape to the trailing dimensions; equal dimension sizes can conceal the wrong axis."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"It normalizes the final width axis of length 32, independently for each specimen/channel/row. Permute to "}<InlineMath>{"N,7,32,32"}</InlineMath>{" with the original channel axis last, apply LayerNorm(32), and permute back. Name the axes explicitly: both trailing dimensions happen to be 32 after the permutation, so shape inspection alone is insufficient. The unchanged intended output shape does not prove the operation is correct."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Change the expansion and count what changed"}</H3>

<Prose>{"Use a 5×5 depthwise kernel, input/output width 64 and expansion factor 3 in a V1-style block. Include all biases, channel LayerNorm and LayerScale. How many parameters and convolution/linear MACs does the block use on a 14×14 grid?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the two pointwise matrices and their different bias lengths before adding the small vectors."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Depthwise has "}<InlineMath>{"25C+C"}</InlineMath>{"; LayerNorm "}<InlineMath>{"2C"}</InlineMath>{"; the two linear layers "}<InlineMath>{"3C^2+3C"}</InlineMath>{" and "}<InlineMath>{"3C^2+C"}</InlineMath>{"; LayerScale "}<InlineMath>{"C"}</InlineMath>{". Total "}<InlineMath>{"6C^2+33C=26,688"}</InlineMath>{". Conv/linear MACs are "}<InlineMath>{"196(25\\cdot64+6\\cdot64^2)=5,130,496"}</InlineMath>{". Normalization, activations and additions are excluded from that declared operation count."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Predict a cross-channel effect"}</H3>

<Prose>{"For the GRN example, keep "}<InlineMath>{"\\gamma_A=.5"}</InlineMath>{", set "}<InlineMath>{"\\gamma_B=0"}</InlineMath>{", and change B's second value 12→24. Does A's first output rise or fall? Does setting both scales to zero make the statistics stop changing?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"A's norm stays 5; the denominator compares it with B's new norm 24."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A's relative response becomes "}<InlineMath>{"5/(14.5+\\epsilon)"}</InlineMath>{", smaller than before, so its first output falls to approximately "}<InlineMath>{"3(1+.5\\cdot5/14.5)=3.517241"}</InlineMath>{". Zero scales remove the response-dependent contribution from the output; the norms still change internally. GRN's identity initialization and its statistic computation are different facts."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Diagnose suspiciously good reconstruction"}</H3>

<Prose>{"The encoder masks pixel values, but first subtracts each full image's mean, calculated using visible and hidden pixels. A hidden-pixel edit changes the model's prediction. Is this necessarily a defect in the convolution code? Propose a repair and a direct check."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether the original hidden value can reach a visible input through preprocessing."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The full-image mean carries hidden information into the centered visible pixels. The convolution can be implemented correctly while the input contract leaks. Use a fixed permitted scale, training-set statistics learned without the evaluated image, or a clearly specified visible-only statistic. Change one hidden target while holding mask and visible values fixed; predictions should stay unchanged under the repaired contract. The hidden-target loss can still change. Target-only patch normalization is a separate path and must not be reused to normalize the encoder input."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Choose the conclusion supported by the experiment"}</H3>

<Prose>{"A colleague reports, “GRN learns more diverse channels, therefore it improves digit recognition and should replace the raw baseline.” Use the saved outcomes to rewrite the conclusion and name one additional experiment that would answer a genuinely missing question."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare paired reconstruction results, paired diversity results and the raw-pixel classifier separately."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"On this development split the GRN variants' probes get 116/120 versus 115/120, while the raw-pixel probe gets 118/120. GRN does not increase the measured diversity in all seeds and does not improve masked MSE in seed 1. This supports a small paired probe difference in this setting, not the proposed causal explanation or replacement decision. For a pretraining question, predeclare matched random-encoder and pretrained-encoder probes with the same architecture and label budget. For a deployment choice, select using development data and evaluate once on a new appropriately grouped final set."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Check a branch-fusion boundary"}</H3>

<Prose>{"For scalar input "}<InlineMath>{"x=-2"}</InlineMath>{", compare "}<InlineMath>{"\\operatorname{ReLU}(x)+\\operatorname{ReLU}(-x)"}</InlineMath>{" with "}<InlineMath>{"\\operatorname{ReLU}(x-x)"}</InlineMath>{". Can the separate branch activations be removed while preserving the function?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Apply each activation before summing in the first expression."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first gives "}<InlineMath>{"0+2=2"}</InlineMath>{"; the second gives 0. Linear branch kernels can be added only where the intermediate operations permit the algebra. Keeping one shared activation after an equivalent linear sum is valid; replacing separate nonlinear branches with that shared activation is a different model."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Budget a finer stem"}</H3>

<Prose>{"Replace a 4×4 stride 4 stem with a 2×2 stride 2 stem on 224×224 inputs while keeping all later stage widths and depths unchanged. What happens to the first grid, the block MACs and the head's parameter count?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Track spatial area through the later stride 2 transitions. The classification head receives an averaged channel vector."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first grid becomes 112×112 instead of 56×56. Every corresponding later grid has twice the side length, so block conv/linear MACs and transition MACs become four times larger. Stem MACs happen to remain equal here: four times as many outputs each use one quarter as many spatial weights. Stem parameters fall, but the global-average-pooling classifier's input width and head parameter count stay unchanged. Activation memory also grows; accuracy and latency cannot be deduced from this count alone."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Design an informative masked-learning extension"}</H3>

<Prose>{"You have 20 labeled specimens per class and many unlabeled images from repeated capture sessions. Propose a comparison to ask whether masked pretraining helps when labels are scarce. Include the split unit, baseline, preprocessing, model comparison and final evaluation."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Unlabeled access is still access to data. Keep the question of representation learning separate from the number of labels used by the readout."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Split capture sessions before training so related views do not cross partitions. Restrict both supervised and unlabeled pretraining inputs to training sessions. Fix the same labeled subset and feature-readout recipe for raw pixels, a random frozen encoder and the pretrained frozen encoder; optionally add a separately declared end-to-end supervised model. Fit preprocessing on training data, select any settings on development sessions, and report the chosen protocol once on held-out sessions. Record reconstruction and downstream task outcomes separately and repeat paired seeds. Do not call extra unlabeled access “the same data budget” unless that is explicitly the question."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"9. Readiness, connections and other ways to learn"}</H2>

<Prose>{"You are ready to move on when you can explain a block using spatial and channel operations, mark the inputs used by each normalization statistic, trace a masked target without leaking it into the encoder, and state what the actual experiment demonstrates. Memorizing every model size or reproducing ImageNet training is not required."}</Prose>

<Prose>{"Next in this module is "}<a href={"/learn/path/full-curriculum/capsule-networks?module=deep-learning-fundamentals"}>{"Capsule Networks"}</a>{". It asks a different representation question: instead of only scalar feature activations, can groups of values represent a part's properties and help parts agree on a whole? ConvNeXt does not become obsolete at that transition; the proposed inductive bias changes."}</Prose>

<div data-lesson-ending="further-learning"><Prose>Further learning: another explanation or visual second pass.</Prose>

<ul><li>{""}<a href={"https://github.com/facebookresearch/ConvNeXt/blob/main/models/convnext.py"}>{"Official ConvNeXt source"}</a>{": inspect the block, channel-first LayerNorm, stage transitions and initialization after working through §§2–3. Code reading is particularly useful for distinguishing logical axes from the diagram."}</li><li>{""}<a href={"https://arxiv.org/pdf/2201.03545"}>{"ConvNeXt V1 paper"}</a>{": read §2 as an experiment-design argument, then compare the small-regime roadmap in Appendix C with the final result table. The roadmap's roughly 82.0% average and final 82.1% checkpoint report are different records."}</li><li>{""}<a href={"https://arxiv.org/pdf/2301.00808"}>{"ConvNeXt V2 paper"}</a>{" and "}<a href={"https://cvpr.thecvf.com/media/cvpr-2023/Slides/22892_lw8881R.pdf"}>{"authors' CVPR slides"}</a>{": the paper supplies the mask/GRN details; the slides offer a visual second pass through masking, feature maps and co-design. Their full-scale experiments differ from our bounded dense-masked probe experiment."}</li><li>{""}<a href={"https://docs.pytorch.org/tutorials/intermediate/memory_format_tutorial.html"}>{"PyTorch channels-last tutorial"}</a>{": a hands-on storage-stride explanation. Its hardware results belong to the measured configurations; use the concepts to inspect your own workload."}</li><li>{""}<a href={"https://en.d2l.ai/chapter_convolutional-modern/cnn-design.html"}>{"Dive into Deep Learning: Designing Convolution Network Architectures"}</a>{": study the AnyNet→RegNet design-space argument as an alternative to memorizing model families. The chapter's broader historical rankings are time-specific; its distribution-of-designs perspective is the useful complement here."}</li><li>{""}<a href={"https://arxiv.org/pdf/2203.06717"}>{"RepLKNet"}</a>{", "}<a href={"https://arxiv.org/pdf/2206.04040"}>{"MobileOne"}</a>{", "}<a href={"https://arxiv.org/pdf/2106.04803"}>{"CoAtNet"}</a>{" and "}<a href={"https://arxiv.org/pdf/2204.01697"}>{"MaxViT"}</a>{": optional mechanism-focused extensions for large kernels, inference-time branch folding, stage ordering and local/global communication. Read the ablation conditions before generalizing a result."}</li></ul>

</div>
<div data-lesson-ending="references"><Prose>Technical references: the exact block and GRN definitions are in the <a href="https://github.com/facebookresearch/ConvNeXt/blob/main/models/convnext.py">official V1 source</a>, <a href="https://github.com/facebookresearch/ConvNeXt-V2/blob/main/models/utils.py">official V2 source</a> and the original papers linked above. <a href="https://cs231n.github.io/convolutional-networks/">CS231n's convolution chapter</a> explains feature volumes, spatial connectivity and whole-network composition; its older small-kernel recommendations are historical context for ConvNeXt's large-depthwise-kernel comparison.</Prose>
<Prose>All local experimental numbers come from the accompanying programs and retained results. Read the <a href={convnextAsset+"data-provenance.md"}>dataset provenance</a> and <a href={convnextAsset+"native-verification.json"}>recorded native verification record</a> for execution boundaries. The six original fits are conserved, with fresh native reconstruction and independent browser-model comparisons; no ImageNet training, pretrained photograph run or hardware timing is claimed.</Prose></div></section>
</div>
};
