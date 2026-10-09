// Authored continuous lesson; historical prepared manuscript and original sources remain preserved.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as SharedInlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { VisionImagePatchDrawing, VisionPatchProjectionDrawing } from '../../components/lesson-labs/VisionTransformerFlowFigures.jsx';
import { VisionRecordAssemblyDrawing, VisionConstructedHeadDrawing } from '../../components/lesson-labs/VisionTransformerEncoderFigures.jsx';
import { VisionEncoderAnatomyDrawing, VisionPositionResizeDrawing, VisionDistillationOwnershipDrawing } from '../../components/lesson-labs/VisionTransformerSystemFigures.jsx';
import { VisionLessonProvider, VisionPatchInvestigation, VisionResolutionInvestigation, VisionDinoInvestigation, VisionPrototypeBalancingInvestigation, VisionGramInvestigation, VisionCurrentGramMatrix, VisionWindowInvestigation, VisionBiasInvestigation, VisionImageInvestigation, VisionCurrentModelDrawing, VisionFullAssemblyTable, VisionHeadInvestigation, VisionFullHeadTable, VisionFeatureInvestigation, VisionFlowProgram as VisionProgram } from '../../components/lesson-labs/VisionTransformerFlowLabs.jsx';
import { VisionUniformTwoHopDrawing, VisionPatchMergeDrawing } from '../../components/lesson-labs/VisionTransformerSpatialFigures.jsx';
import { VisionNormPlacementDrawing, VisionCosineScaleDrawing, VisionContinuousBiasDrawing, VisionFusionDrawing } from '../../components/lesson-labs/VisionTransformerVariantFigures.jsx';
import { VisionCropPairDrawing, VisionMovingAveragesDrawing, VisionMaskedPatchTargetDrawing, VisionNeighborSpreadDrawing, VisionRegisterAnatomyDrawing, VisionAxialRotationDrawing } from '../../components/lesson-labs/VisionTransformerSelfSupervisionFigures.jsx';
import { VisionDatasetProtocolDrawing, VisionRecordedValidationInvestigation } from '../../components/lesson-labs/VisionTransformerStudyFigures.jsx';
import { VisionDenseHeadDrawing } from '../../components/lesson-labs/VisionTransformerTaskFigures.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
function MathBlock({children}) {
 return <div className="vision-equation-scroll" tabIndex={0} role="region" aria-label="Equation; scroll horizontally when wider than the page"><SharedMathBlock>{children}</SharedMathBlock></div>;
}
function InlineMath({children}) {
 return <span className="vision-inline-math"><SharedInlineMath>{children}</SharedInlineMath></span>;
}
export default {
 title: 'Vision Transformers: ViT, DeiT, Swin & DINOv2',
 readTime: '~100 min read + experiments and practice',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson neural-lesson-neutral vision-transformer-lesson lesson-flow"><VisionLessonProvider><LessonIntro prerequisites="Convolutions, attention weights, vector products and gradient descent; local examples refresh patch shapes, masking and probability normalization." sections={[["1-turn-an-image-into-a-sequence-without-losing-the-meaning-of-its-axes","1. Turn an image into a sequence without losing the meaning of its axes"],["2-let-regions-exchange-information-then-read-out-the-image","2. Let regions exchange information, then read out the image"],["3-change-resolution-deliberately","3. Change resolution deliberately"],["4-swin-change-the-neighborhoods-then-build-a-hierarchy","4. Swin: change the neighborhoods, then build a hierarchy"],["5-deit-use-a-teacher-s-decisions-as-another-learning-signal","5. DeiT: use a teacher's decisions as another learning signal"],["6-dino-and-dinov2-learn-features-before-assigning-task-labels","6. DINO and DINOv2: learn features before assigning task labels"],["7-run-a-small-image-study-and-interpret-every-result","7. Run a small image study and interpret every result"],["8-use-image-features-for-a-real-task","8. Use image features for a real task"],["9-practice-explain-calculate-intervene-and-choose","9. Practice: explain, calculate, intervene and choose"],["10-references-and-another-way-to-learn-it","10. References and another way to learn it"]]}>Keep the image visible while tracing patch projections, spatial communication, learning targets and actual frozen features.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Edit patch pixels/projection coefficients, patch-position swaps, window/shift geometry, teacher/student logits and feature angles. Update patch contributions, actual frozen-model logits/maps, spatial dependency sets, teacher targets/gradients and relational loss immediately. The labs show current results as you work; you do not enter or submit a guess. Use those comparisons to separate image edits from position changes, direct neighbors from multi-hop reach and target sharpening from learned quality."}</Prose>

<Prose>{"A handwritten digit is an arrangement of marks. A loop near the top and a loop near the bottom can suggest an eight; the same dark pixels rearranged across the page can suggest something else. An image model needs both the appearance of small regions and their relationships."}</Prose>

<Prose>{"A "}<strong>{"Vision Transformer"}</strong>{", or ViT, turns small image regions into vectors, lets those vectors exchange information, and uses the resulting representation to make a prediction. The Transformer machinery is familiar. The new questions are visual: how do pixels become tokens, how is location preserved, how can windows communicate, and what should a model learn before we have labels for a particular task?"}</Prose>

<Prose>{"We will build these ideas on an actual, small image problem: recognizing handwritten digits from 8×8 intensity arrays. We will also work through the mechanisms used in larger systems. The small study is fully reproducible; its accuracy is evidence about that study, not a substitute for evaluating a pretrained vision model on your own images."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" read §§1–2, the practical parts of §3, §§4–5, §6 through “What DINOv2 adds,” and §§7–8. Attempt the core exercises in §9. The marked deeper branches develop symmetry, operation counts, Gram geometry and model adaptation; they extend the same ideas without hiding a prerequisite for the first pass."}</Prose>

<Prose>{"You need vectors, a linear layer, softmax, cross-entropy and the residual Transformer block. "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention"}</a>{" and "}<a href={"/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals"}>{"Transformer Block Architecture"}</a>{" teach those mechanisms. We refresh their visual meaning here. The immediately preceding "}<a href={"/learn/path/full-curriculum/sparse-linear-attention-variants?module=deep-learning-fundamentals"}>{"Sparse and Linear Attention"}</a>{" explains why restricting who can communicate changes an operator; Swin makes that restriction follow an image grid."}</Prose>

<Prose>{"By the end, you should be able to track an image through a patch Transformer, explain what each special token does, calculate the cost of a resolution change, trace a shifted-window connection, distinguish supervised distillation from self-distillation, and design an honest evaluation of image features."}</Prose>

<H2>{"1. Turn an image into a sequence without losing the meaning of its axes"}</H2>
<Prose>How can a model compare distant parts of an image without treating every pixel as a separate message? Start with a small region that stays visible while we turn its pixels into a vector.</Prose>
<VisionImagePatchDrawing/>
<Prose>The top picture is a constructed one-channel 4×4 image. Its numbers are brightness values; its row and column coordinates tell us where those values occur. Each white outline encloses one 2×2 patch. Read the four patches across the top row, then across the bottom row. Inside each patch, read the top row before the bottom row. The four resulting pixel vectors are <code>[0,1,4,5]</code>, <code>[2,3,6,7]</code>, <code>[8,9,12,13]</code> and <code>[10,11,14,15]</code>. We have changed the arrangement used to store the image, not its measured values.</Prose>
<Prose>A <strong>patch</strong> is this small image region. A <strong>token</strong> is the vector that the model uses to describe that region. It is not a word, an object label or a claim that the entire patch contains one object. We will first build two-coordinate tokens by hand; later the actual digit model uses 32 coordinates per token.</Prose>
<Prose>What should those coordinates measure? Use the same two rules on every patch: add the first and last pixels plus 0.5; subtract the third pixel from the second and add 1. The amber coefficients below are the rules, and the violet products show each pixel's contribution.</Prose>
<VisionPatchProjectionDrawing pixels={[0,1,4,5]} weights={[[1,0,0,1],[0,1,-1,0]]} biases={[.5,1]}/>
<Prose>Follow the first route: <code>0×1 + 1×0 + 4×0 + 5×1 + 0.5 = 5.5</code>. Follow the second: <code>0×0 + 1×1 + 4×(−1) + 5×0 + 1 = −2</code>. The first patch becomes <code>[5.5,−2]</code>. Applying this same map to the other patches produces <code>[9.5,−2]</code>, <code>[21.5,−2]</code> and <code>[25.5,−2]</code>. A negative feature is valid: here it represents a difference between positions, not negative brightness.</Prose>
<Prose>Now name the rule. A linear map multiplies each input coordinate by a coefficient and sums the products. An <strong>affine map</strong> also adds a bias. We use the PyTorch convention: the learned weight matrix <InlineMath>W</InlineMath> has one row per output feature and one column per input value. For a column-form patch <InlineMath>x_j</InlineMath>, our example is</Prose>
<MathBlock>{String.raw`e_j=Wx_j+b,\qquad W=\begin{bmatrix}1&0&0&1\\0&1&-1&0\end{bmatrix},\quad b=\begin{bmatrix}0.5\\1\end{bmatrix}.`}</MathBlock>
<Prose>Real models learn the coefficients from data. They may detect combinations that have no simple human-readable name. A shared map means the same pixel arrangement has the same initial description wherever it occurs; we will supply location separately in §2.</Prose>
<H3>Change a pixel, then change the rule</H3>
<Prose>Switch to a fresh patch <code>[2,1,4,0]</code> so that a change in one pixel is easy to trace. It starts at <code>[2.5,−2]</code> under the same map. Choose a pixel coordinate and change its value; both routes show exactly which product changes.</Prose>
<VisionPatchInvestigation/>
<Prose>The two following questions keep that same edited patch. First choose an output feature and a pixel coordinate, then change just their learned coefficient. A zero coefficient disconnects that input from that feature.</Prose>
<VisionPatchInvestigation question="coefficients"/>
<Prose>Which part of the feature comes from a learned offset rather than a pixel? Choose a feature and edit its bias.</Prose>
<VisionPatchInvestigation question="bias"/>
<Prose>Keep the current outputs, make further edits above and compare the live differences. Restore returns both the pixels and the map to this question's original case.</Prose>
<VisionPatchInvestigation question="compare"/>
<H3>Carry the same calculation into tensor code</H3>
<Prose>Our four pixel vectors are rows in a batch. A row-vector implementation therefore uses <code>patches @ W.T + b</code>. PyTorch's <code>unfold</code> extracts patches in a specified order; a convolution with kernel side 2 and stride 2 can perform the same shared projection. The following complete example copies the same weights and bias into both routes rather than comparing unrelated layers.</Prose>
<CodeBlock language="python">{`import torch
from torch.nn import functional as F

image = torch.arange(16, dtype=torch.float64).reshape(1, 1, 4, 4)
weight = torch.tensor([[1., 0., 0., 1.], [0., 1., -1., 0.]], dtype=torch.float64)
bias = torch.tensor([.5, 1.], dtype=torch.float64)
patches = F.unfold(image, kernel_size=2, stride=2).transpose(1, 2)
explicit = patches @ weight.T + bias
convolution = F.conv2d(image, weight.reshape(2, 1, 2, 2), bias, stride=2)
convolution = convolution.flatten(2).transpose(1, 2)
print(explicit)
print(torch.equal(explicit, convolution))`}</CodeBlock>
<Prose>The four output rows are the vectors we calculated, and the comparison returns <code>True</code>. A shape match would not establish numerical equality. For RGB, <code>unfold</code> orders patch coordinates by channel, then row and column inside that channel. The reshape must preserve that order. The complete <code>vision-mechanisms.py</code> in §4 and <code>vision-study.py</code> in §7 carry this operation into trainable models; we do not need to invent a second patch extractor later.</Prose>
<H3>Scale the picture without confusing pixels and channels</H3>
<Prose>Keep the same patch construction, but imagine an RGB image of height 224 and width 224. There are 50,176 spatial pixel positions, each carrying three channel values: 150,528 scalars. Making each RGB pixel one token gives 50,176 tokens, not 150,528. One attention head would consider 2,517,630,976 query–key pairs. With 16×16 patches there are 14×14 = 196 region tokens instead. Each region supplies 16×16×3 = 768 input scalars to its shared projection.</Prose>
<Prose>For image height <InlineMath>H</InlineMath>, width <InlineMath>{String.raw`W_{\mathrm{img}}`}</InlineMath>, channel count <InlineMath>C</InlineMath>, patch side <InlineMath>P</InlineMath> and token width <InlineMath>d</InlineMath>, use</Prose>
<MathBlock>{String.raw`N=\frac{H}{P}\frac{W_{\mathrm{img}}}{P},\qquad x_j\in\mathbb R^{P^2C},\quad W\in\mathbb R^{d\times P^2C},\quad e_j\in\mathbb R^d.`}</MathBlock>
<Prose>These dimensions assume divisibility by the patch side. If a last strip does not fit, choose and document resizing, cropping or padding. Silently throwing the strip away changes the observed image. Reducing the patch side preserves finer distinctions but increases the number of communicating records: halving it quadruples the count and multiplies the number of full-attention pairs by sixteen.</Prose>
<H3>Deeper: what can the patch map preserve, and how does it learn?</H3>
<Prose>The little map has four inputs and only two outputs. It cannot preserve every possible change to the four pixels. For example, change them by <code>[−1,0,0,1]</code>: both output coordinates stay fixed, because the diagonal sum and middle difference stay fixed. This is a <strong>null direction</strong> of the map. More generally, <InlineMath>{String.raw`\operatorname{rank}(W)\le\min(d,P^2C)`}</InlineMath>; the null-space dimension is <InlineMath>{String.raw`P^2C-\operatorname{rank}(W)`}</InlineMath>. A smaller output width can remove information, while a larger one cannot manufacture newly measured pixels. Lossy projections can still be useful when they preserve distinctions needed for the task.</Prose>
<Prose>Learning changes the rules using the loss gradient, meaning the sensitivity of the loss to each output. Suppose the fresh patch has output credit <code>g=[1,−2]</code>. The input credit is <code>W.T @ g=[1,−2,2,1]</code>; the weight credit is the outer product of that credit with the input, giving rows <code>[2,1,4,0]</code> and <code>[−4,−2,−8,0]</code>. The bias credit is <code>[1,−2]</code>. Every patch uses the same map, so its parameter credits add across the batch and patch positions.</Prose>
<MathBlock>{String.raw`\nabla_x\ell=W^Tg,\qquad \nabla_W\ell=gx^T,\qquad \nabla_b\ell=g.`}</MathBlock>
<Prose>These are the same affine-layer derivatives taught in <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation</a>; the changed detail is which pixel coordinates occupy the input. Nonoverlapping patches are a choice. Overlapping projections, convolutional stems and learned grouping provide other balances of locality and cost. The <a href="https://arxiv.org/html/2010.11929v2#S3">original ViT method</a> includes a convolutional hybrid, and <a href="/learn/path/full-curriculum/convnext-modern-cnn-designs?module=deep-learning-fundamentals">ConvNeXt</a> explains why contemporary convolutional systems remain serious alternatives.</Prose>

<H2>{"2. Let regions exchange information, then read out the image"}</H2>
<Prose>The patch map can describe a small region, but it cannot tell whether that region forms the upper or lower loop of a digit. How do we attach location and combine evidence from multiple regions? Add a location vector to each patch and give the image one learned place to collect information.</Prose>
<VisionRecordAssemblyDrawing/>
<Prose>Keep the four two-coordinate patches from §1. The amber location vectors in this hand example are stipulated small numbers. Add each vector to its own patch description: patch 0 stays <code>[5.5,−2]</code>, patch 1 becomes <code>[9.7,−2]</code>, patch 2 becomes <code>[21.5,−1.8]</code>, and patch 3 becomes <code>[25.7,−1.8]</code>. Location and appearance now travel together in a record.</Prose>
<Prose>The first row is different: <strong>CLS</strong>, the class token, is a learned image-summary workspace. It starts from the same learned vector for every image; this example uses <code>[0,0]</code> plus a learned CLS-position vector <code>[0.1,0.1]</code>. Its output becomes image-dependent when it reads the patch rows. CLS is not an extra observed pixel, and a patch's learned position is not its row-number treated as a numeric feature.</Prose>
<Prose>Write the learned CLS vector as <InlineMath>c</InlineMath>, stack the patch vectors underneath it, and call the complete position table <InlineMath>{String.raw`P_{\mathrm{pos}}`}</InlineMath>. The initial workspace is</Prose>
<MathBlock>{String.raw`Z_0=[c;e_1;\ldots;e_N]+P_{\mathrm{pos}}\in\mathbb R^{(N+1)\times d}.`}</MathBlock>
<H3>What does one region actually read?</H3>
<Prose>Attention makes a weighted read of information from other records. To see every multiplication, switch from the five-row assembly to a separate three-source, two-coordinate example. The receiver's <strong>query</strong> is <code>[1,0]</code>; source <strong>keys</strong> are <code>[1,0]</code>, <code>[0,1]</code> and <code>[−1,0]</code>. Their <strong>values</strong>, the information available to return, are <code>[2,0]</code>, <code>[0,2]</code> and <code>[1,1]</code>. We stipulate these already-projected vectors solely to make the read small enough to calculate.</Prose>
<VisionConstructedHeadDrawing/>
<Prose>At the top, multiply the query by each key coordinate and sum. The dot products are 1, 0 and −1. Divide by the square root of the two-coordinate head width to get scores approximately <code>[0.707107,0,−0.707107]</code>. A high score means a stronger match to this query; it does not yet give a probability.</Prose>
<Prose>The next route turns scores into positive exponential amounts. Subtract the largest score first, producing exponentials <code>[1,0.493069,0.243117]</code>. Their shared sum is approximately 1.736185. Divide every amount by that same sum. The resulting weights are approximately <code>[0.575975,0.283995,0.140029]</code>, adding to one. This is <strong>softmax</strong>; subtracting a common maximum preserves the weights while avoiding unnecessary exponential overflow.</Prose>
<Prose>At the bottom, each weight multiplies its own source value. Sum those three contribution vectors to get approximately <code>[1.291980,0.708020]</code>. Keys decided how much to read; values decided what was transmitted. A large weight attached to a zero value still transmits zero.</Prose>
<MathBlock>{String.raw`s_{ij}=\frac{q_i^Tk_j}{\sqrt{d_h}},\qquad a_{ij}=\frac{\exp(s_{ij}-\max_m s_{im})}{\sum_m\exp(s_{im}-\max_n s_{in})},\qquad o_i=\sum_j a_{ij}v_j.`}</MathBlock>
<Prose>Here <InlineMath>i</InlineMath> names the receiver, <InlineMath>j</InlineMath> a source, and <InlineMath>{String.raw`d_h`}</InlineMath> the head width. In a real block, learned maps obtain Q, K and V from normalized token vectors; all receivers use those shared maps. <a href="/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals">Self-Attention</a> derives their gradients, the scaling assumption, convex-hull constraint and masking contracts. This image read uses the same operator. Ordinary image classification reads CLS and all patches: there is no temporal future requiring a causal triangle. Padding and intentionally restricted windows provide different reasons to exclude sources.</Prose>
<H3>Where does that read sit in the whole network?</H3>
<Prose>Return to the eventual 8×8 digit model. Its 2×2 patches make sixteen region records; adding CLS gives a 17×32 workspace. The picture below is a labelled shape cutaway, not invented trained feature values. Follow both saved bypasses as well as the transformed branches.</Prose>
<VisionEncoderAnatomyDrawing/>
<Prose>First normalize each complete 32-coordinate row. Four attention heads each form an eight-coordinate read of all seventeen rows. Concatenate their four outputs into 32 coordinates and apply a learned output map. This is an <strong>attention write</strong>, added back to the saved input. A second normalization feeds a shared per-row network: a 64×32 up-map, GELU activation, then a 32×64 down-map. Add that write to the saved row from the first addition. This <strong>feed-forward network</strong> changes each row's description; unlike attention, it does not read another spatial row.</Prose>
<Prose>That pair of updates is one pre-normalized <strong>Transformer block</strong>. The retained model applies two blocks, then normalizes the final rows. Its classifier takes the final CLS vector and uses a learned 10×32 map plus ten biases to produce one <strong>logit</strong>, or real-valued class score, for each digit. Softmax converts those ten scores into a distribution. All these learned objects change during training; §7 exposes their actual retained arrays and the complete training code.</Prose>
<MathBlock>{String.raw`U=Z+\operatorname{MHA}(\operatorname{LN}(Z)),\qquad Z_{\mathrm{next}}=U+\operatorname{FFN}(\operatorname{LN}(U)),\qquad \ell_{\mathrm{class}}=W_{\mathrm{class}}\operatorname{LN}(Z_{\mathrm{final}})_0+b_{\mathrm{class}}.`}</MathBlock>
<Prose>Layer normalization computes statistics across a row's features, not across patch positions. Its learned gain and offset remain part of the model. The block drawings and scratch/library implementation in <a href="/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals">Transformer Block Architecture</a> establish the residual and normalization mechanisms; the actual image-specific wiring here will stay visible as we inspect it in §7.</Prose>
<H3>Why locations must enter somewhere</H3>
<Prose>A dark upper region and a light lower region describe a different arrangement from the opposite layout. There are nevertheless two different operations that are easy to confuse: swapping content while positions stay fixed changes the located image description; listing the same content-and-position records in another order leaves that description intact. The full fitted-image controls in §7 let you test both while holding current pixels and other settings fixed.</Prose>
<Prose>In the retained plain ViT, swapping original patches 5 and 6 of the first test image while keeping positions fixed changes logits by as much as 7.8398. Moving their positional vectors with their content changes logits by less than 0.000001. These are two interventions on the same weights, not separate training runs. Reordering records is not the same as moving objects in image space.</Prose>
<Prose><strong>Deeper: prove the listing invariance.</strong> Let <InlineMath>R</InlineMath> be a permutation matrix fixing CLS. Shared per-row projections produce <InlineMath>{String.raw`Q'=RQ,\ K'=RK,\ V'=RV`}</InlineMath>. The score matrix becomes <InlineMath>{String.raw`R(QK^T)R^T`}</InlineMath>; row softmax therefore gives <InlineMath>{String.raw`A'=RAR^T`}</InlineMath> and <InlineMath>{String.raw`A'V'=RAV`}</InlineMath>. Shared row normalization, FFNs and residual additions preserve this equivariance: patch outputs permute and CLS stays unchanged. Move any mask and positional structure consistently too. Independently resampled dropout can break a literal numerical equality even when the operator has the symmetry.</Prose>
<H3>CLS is a choice of readout</H3>
<Prose>An alternative model can average its patch representations and train a classifier on that pooled vector. Earlier attention has already mixed information, so pooling is not simply averaging raw pixels. CLS is a learned accumulation site; mean pooling is a prescribed aggregation rule. Neither universally dominates. Replacing the pooling rule in a trained checkpoint without adapting its head supplies a different representation to that head.</Prose>
<Prose>ViT also has inductive biases: a patch grid, shared projection, shared per-row maps, position conventions and augmentations. Compared with small convolutional neighborhoods, full attention imposes less local spatial structure. “Less image-specific bias” is useful; “no inductive bias” is false. Its effectiveness depends on the complete architecture, data and training protocol, which we now make explicit when changing resolution and communication.</Prose>
<H2>{"3. Change resolution deliberately"}</H2>
<Prose>We now have region records with location vectors. What changes when a larger image creates more regions? A prefix is a special sequence row that is not an observed image patch, such as CLS. Keep such rows separate from the spatial grid; the hand example below stipulates two unnamed prefixes.</Prose>
<VisionPositionResizeDrawing/>
<Prose>The picture switches to a rectangular hand case: six patch positions on a 2×3 grid become twelve on a 3×4 grid. Each cell holds a full position vector. Two nonspatial prefix vectors bypass interpolation unchanged; six plus two rows become twelve plus two rows. This is a coordinate-table adaptation, not a pixel-image resize.</Prose>

<Prose>{"At 224×224 with 16×16 patches, the patch grid is 14×14. At 384×384, it is 24×24. The patch projection still consumes 768 values per patch, so its weights can remain unchanged. The learned table of spatial positions, however, needs 576 patch slots rather than 196."}</Prose>

<Prose>{"Treat the old patch-position vectors as a 14×14 grid with "}<InlineMath>{"d"}</InlineMath>{" channels. Interpolate that grid to 24×24, flatten it back to a sequence, and keep the CLS position separate. This adapts the representation's coordinates. It does not recover image detail that was already lost in a low-resolution source image, and it does not guarantee that a model trained at one resolution has equal accuracy at another."}</Prose>

<Prose>{"For a rectangular image, retain both grid dimensions. A sequence of 192 patches could come from 12×16 or 8×24; the square root of 192 cannot recover either layout. Some models add another summary row for teacher supervision (DIST, taught in §5) or nonspatial working rows (registers, taught in §6). Those are also prefix slots; follow the checkpoint's exact token-construction convention rather than reshaping every token into a square."}</Prose>

<Prose>{"The complete "}<code>{"resize_positions"}</code>{" function in "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/vision-mechanisms.py"}>{"vision-mechanisms.py"}</a>{" takes explicit old and new grid shapes and a prefix count. It uses bicubic interpolation with "}<code>{"align_corners=False"}</code>{", preserves prefixes exactly, and returns an exact copy for an unchanged grid. Those settings are part of the method. Bicubic interpolation can overshoot; it is not always a convex average that reduces feature norms. Some checkpoints use different interpolation details or position schemes."}</Prose>



<Prose>{"Changing the patch side from 16 to 14 is a different operation: the projection's input width changes from 768 to 588 for RGB. Resizing only the position table cannot fix that mismatch. Methods designed to adapt patch embeddings can address it, but they change more than a position lookup."}</Prose>

<H3>{"Deeper: count work without inventing a speed measurement"}</H3>

<Prose>{"Use "}<strong>{"one multiply–accumulate (MAC)"}</strong>{" as our matrix-operation counting unit. If a report counts multiplication and addition as separate floating-point operations, its corresponding dense matmul count is roughly twice this number. Neither convention includes all execution costs."}</Prose>

<Prose>How much work comes from matching regions rather than transforming their features? Switch to a ViT-B/16 counting example: RGB patches of side 16, width 768, twelve blocks, a 4× FFN and a 1,000-class head. Change only square image side below.</Prose>
<VisionResolutionInvestigation/>
<Prose>The bars separate the patch map and class map, each used once, from three repeated block costs. Pair products multiply every query by every key and then every read weight by a value. The full model counts all twelve blocks; it is not just the square attention table.</Prose>
<Prose>{"Let "}<InlineMath>{"S=N+1"}</InlineMath>{", width "}<InlineMath>{"d"}</InlineMath>{", and FFN expansion ratio 4. Per block:"}</Prose>

<NeuralTable caption={"Deeper: count work without inventing a speed measurement"} headers={[<>{"Operation"}</>,<>{"MACs"}</>,<>{"Why"}</>]} rows={[[<>{"Q, K, V and attention output projections"}</>,<>{""}<InlineMath>{"4Sd^2"}</InlineMath>{""}</>,<>{"Four width-to-width linear maps"}</>],[<>{"FFN's two linear maps"}</>,<>{""}<InlineMath>{"8Sd^2"}</InlineMath>{""}</>,<>{""}<InlineMath>{"d\\to4d\\to d"}</InlineMath>{" at each token"}</>],[<>{"Scores and weighted values"}</>,<>{""}<InlineMath>{"2S^2d"}</InlineMath>{""}</>,<>{""}<InlineMath>{"QK^T"}</InlineMath>{" and "}<InlineMath>{"AV"}</InlineMath>{" across all heads"}</>]]} />

<Prose>{"Splitting a fixed width into more heads does not multiply these leading totals by the head count: "}<InlineMath>{"h d_h=d"}</InlineMath>{". Biases, normalization, softmax, activation, residuals, memory traffic and kernel overhead are excluded here."}</Prose>

<Prose>{"For a 12-block ViT-B-width model, "}<InlineMath>{"d=768"}</InlineMath>{", RGB patches 16, one CLS and a 1,000-class head, the calculated counts are:"}</Prose>

<NeuralTable caption={"Deeper: count work without inventing a speed measurement"} headers={[<>{"Input"}</>,<>{"Tokens "}<InlineMath>{"S"}</InlineMath>{""}</>,<>{"FFN MACs per block"}</>,<>{"Pair MACs per block"}</>,<>{"Pair fraction of block matmul MACs"}</>,<>{"Whole-model matmul MACs"}</>]} rows={[[<>{"224×224"}</>,<>{"197"}</>,<>{"0.930 billion"}</>,<>{"0.0596 billion"}</>,<>{"4.10%"}</>,<>{"17.56 billion"}</>],[<>{"384×384"}</>,<>{"577"}</>,<>{"2.723 billion"}</>,<>{"0.5114 billion"}</>,<>{"11.13%"}</>,<>{"55.48 billion"}</>],[<>{"512×512"}</>,<>{"1,025"}</>,<>{"4.837 billion"}</>,<>{"1.6138 billion"}</>,<>{"18.20%"}</>,<>{"107.03 billion"}</>],[<>{"1,024×1,024"}</>,<>{"4,097"}</>,<>{"19.332 billion"}</>,<>{"25.7824 billion"}</>,<>{"47.06%"}</>,<>{"659.78 billion"}</>]]} />

<Prose>{"The whole-model sum includes patch projection and the classifier, with the same exclusions. Doubling image height and width approximately quadruples tokenwise work and multiplies dense pair work by sixteen. The FFN remains linear in token count, not quadratic."}</Prose>



<Prose>{"At 224, optimizing pair attention alone cannot eliminate the much larger projection/FFN work. At larger resolutions, pair work and attention intermediates become more significant. Fused exact attention can reduce intermediate memory without changing the dense mathematical pair count. Local windows change the allowed pairs. That is our next mechanism."}</Prose>

<H2>{"4. Swin: change the neighborhoods, then build a hierarchy"}</H2>
<Prose>Full attention makes every patch available to every receiver. Can we communicate locally first, then carry information across those boundaries? A window is a square room of neighboring region records. Shift the room boundaries in the next layer so previously separate rooms can exchange information.</Prose>



<H3>{"Follow one two-layer connection"}</H3>
<Prose>Switch to a hand-only 4×4 grid with 2×2 windows. To isolate connectivity, each allowed read averages its legal sources uniformly. This is not a claim that learned Swin weights are uniform. Follow interior receiver (2,2) through an unshifted read and then a shift of one cell.</Prose>
<VisionUniformTwoHopDrawing/>
<Prose>In the first read, each of four windows averages its four records. The shifted receiver then averages one intermediate from each original window. Each original source contributes (1/4)×(1/4)=1/16, so all sixteen can reach this interior receiver. The two stages change who can communicate; they do not just move a rectangle over unchanged values.</Prose>

<Prose>{"Window side is measured in patch tokens, not original pixels. With an "}<InlineMath>{"M\\times M"}</InlineMath>{" window, each query attends to at most "}<InlineMath>{"M^2"}</InlineMath>{" keys. For an "}<InlineMath>{"h\\times w"}</InlineMath>{" token grid, window pair work is "}<InlineMath>{"2hwM^2d"}</InlineMath>{" MACs instead of "}<InlineMath>{"2(hw)^2d"}</InlineMath>{". This is linear in the number of tokens when "}<InlineMath>{"M"}</InlineMath>{" is fixed. Projections and FFNs still need to be calculated."}</Prose>
<Prose>This is a path through two completed reads, not the union of two direct neighbor lists. A corner such as (0,0) remains in a clipped shifted room and has only four original contributors at this depth. Receptive fields depend on receiver, boundary, room size and depth; there is no universal “13×13 after two blocks” rule.</Prose>

<Prose>{"A stack with permanently fixed windows is restricted, but not incapable of every global classification: a final pooling or other cross-window operation can combine separate features. The precise limitation is the absence of cross-window *contextual interaction within those attention layers*."}</Prose>

<H3>{"Why rolling needs a mask"}</H3>

<Prose>{"Directly cutting shifted windows produces partial rooms at image boundaries. For batching, an implementation can cyclically roll the feature grid, partition it into equal-size windows, compute attention and reverse the roll. Rolling moves a top-edge token beside a bottom-edge token in memory. That does not make them spatial neighbors."}</Prose>

<Prose>{"An attention mask blocks those artificial wrap-around pairs. On a 6×6 grid with 2×2 windows and shift 1, the rolled corner window can contain original coordinates "}<code>{"(5,5)"}</code>{", "}<code>{"(5,0)"}</code>{", "}<code>{"(0,5)"}</code>{" and "}<code>{"(0,0)"}</code>{". These belong to four different boundary regions. If values are zero except a value 16 at "}<code>{"(5,5)"}</code>{", an *unmasked* averaging window incorrectly gives "}<code>{"(0,0)"}</code>{" the value 4. With the boundary mask, its value stays 0."}</Prose>

<Prose>{"When the feature dimensions are not divisible by the window size, padding is an additional issue. The complete educational implementation in "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/vision-mechanisms.py"}>{"vision-mechanisms.py"}</a>{" marks padded keys unavailable, handles padded query rows without an undefined all-masked softmax, reverses the shift and removes padding. Other implementations can use different documented padding conventions. A general instruction to resize every image to a multiple of 224 is not a substitute for inspecting that contract."}</Prose>

<Prose>Keep that mechanism, but switch to a 6×6 grid so room boundaries and edge effects are visible. Every grid entry is a scalar source value. Initially source (0,0) has value 16, other sources have 0, the receiver is (2,2), window side 2 and shift 1. The final coefficient grid shows how each original source reaches that receiver. Change only the room side and shift first.</Prose>
<VisionWindowInvestigation/>
<Prose>Now choose any original source coordinate and edit its value. The selected source's coefficient multiplies that value before the final sum. These edits persist in the following questions.</Prose>
<VisionWindowInvestigation question="source"/>
<Prose>Choose a receiver and whether to inspect the input, one unshifted read or both completed reads. The coefficient grid is the actual composed linear operator for that number of reads, not only a list of neighbors.</Prose>
<VisionWindowInvestigation question="receiver"/>
<Prose>Which intermediate records carry a particular source to a receiver? Choose the endpoints below. This question always traces both reads, independently of the completed-read selector above; multiply each pair of path shares, then add every nonzero path.</Prose>
<VisionWindowInvestigation question="path"/>
<Prose>The roll used by an efficient window implementation can bring opposite image edges together. Compare an unmasked cyclic read with the boundary-respecting shifted read below, holding the current source values fixed. This question displays one shifted read directly, rather than composing it with the preceding unshifted read.</Prose>
<VisionWindowInvestigation question="wrap"/>
<Prose>Restore the values, endpoints, window side, shift and boundary policy when you want the original spatial case.</Prose>
<VisionWindowInvestigation question="restore"/>
<H3>{"Relative position belongs in the actual score"}</H3>
<Prose>The previous operator gave equal weight to every allowed key. A learned relative-position bias can favor an offset even when content scores are equal. The offset is query row minus key row, and query column minus key column; it selects one learned number from a 3×3 table for a 2×2 window. Use a separate 6×6 case: source (1,1) starts at 10, receiver (2,2), window 2 and shift 1.</Prose>
<VisionBiasInvestigation/>
<Prose>Select an offset and change its bias. The output updates only if legal query–key pairs actually use that offset. Every allowed source still shares one normalization denominator, so increasing one pair's score changes the relative weights of other legal pairs.</Prose>
<Prose>Choose any original source and change its returned value, keeping the edited bias table. This separates a matching preference from the information it reads.</Prose>
<VisionBiasInvestigation question="value"/>
<Prose>Change the receiver or cyclic edge policy in that same case; the bias does not authorize a boundary-blocked pair.</Prose>
<VisionBiasInvestigation question="receiver"/>
<Prose>Restore this separate bias case to zero biases and its original values.</Prose>
<VisionBiasInvestigation question="restore"/>
<Prose>Now write the actual matching rule, including both content and permission.</Prose>


<Prose>{"Within one window, a head uses"}</Prose>

<div className="neural-equation"><MathBlock>{"a_{ij}=\\operatorname{softmax}_j\\left(q_i^Tk_j/\\sqrt{d_h}+b_{\\Delta r,\\Delta c}+m_{ij}\\right),"}</MathBlock></div>

<Prose>{"where "}<InlineMath>{"m_{ij}=0"}</InlineMath>{" for allowed pairs and "}<InlineMath>{"-\\infty"}</InlineMath>{" for blocked pairs. The learned bias is indexed by the row and column displacement from key to query. Each displacement lies between "}<InlineMath>{"-(M-1)"}</InlineMath>{" and "}<InlineMath>{"M-1"}</InlineMath>{", giving "}<InlineMath>{"(2M-1)^2"}</InlineMath>{" learned entries per head. Many pairs share an entry because they share a relative displacement."}</Prose>

<Prose>{"For a 2×2 window, query "}<code>{"(0,0)"}</code>{" and key "}<code>{"(1,1)"}</code>{" have displacement "}<code>{"(-1,-1)"}</code>{". If content scores are all equal and that displacement's bias increases, this pair receives more weight, with the other legal weights decreasing through the shared softmax denominator. A bias table that is allocated but never added to the scores has no effect."}</Prose>



<H3>{"A hierarchy changes resolution and width"}</H3>
<Prose>Communication can span rooms while the grid stays the same size. How do we deliberately make fewer, wider records? Switch to four neighboring two-coordinate records, concatenate in top-left, bottom-left, top-right, bottom-right order, and apply an eight-coordinate normalization followed by a 4×8 learned reduction.</Prose>
<VisionPatchMergeDrawing/>
<Prose>The four vectors [1,2], [5,6], [3,4], [7,8] form one row [1,2,5,6,3,4,7,8]. Normalize all eight with unit gains, zero offsets and ε=0.00001, then apply the stipulated map shown. The output has four coordinates: the spatial cell count quarters while width doubles. The pictured coefficients are a hand example, not a trained Swin checkpoint.</Prose>

<Prose>{"Swin starts with smaller patches, commonly 4×4 image pixels. A patch-merging layer groups 2×2 neighboring token vectors, concatenates them into a "}<InlineMath>{"4d"}</InlineMath>{"-wide vector, normalizes, and projects to width "}<InlineMath>{"2d"}</InlineMath>{" in the original Swin V1 convention. Spatial resolution halves along each axis, token count quarters, and channel width doubles. This is a learned reduction, not merely averaging four cells."}</Prose>

<Prose>{"For an input 224×224 and initial width 96, stage shapes are:"}</Prose>

<CodeBlock language={"text"}>{"56×56×96 → 28×28×192 → 14×14×384 → 7×7×768"}</CodeBlock>

<Prose>{"The small, medium and coarse grids can feed different parts of a detection or segmentation system. A tiny object may need finer spatial features; broader context can use coarser features. A head must still learn how to turn those features into boxes, masks or labels. A plain ViT's single-resolution features can also support dense prediction through appropriate adapters; “hierarchical features are convenient” does not mean other backbones cannot work."}</Prose>



<Prose>{"The source paper's "}<a href={"https://arxiv.org/html/2103.14030v2#S3"}>{"method section"}</a>{" is the reference for windows, shifting, relative bias and merging. Swin V2 changes details such as attention and normalization; do not silently combine its rules with this V1 derivation."}</Prose>

<H3>{"Carry the window and merge into torchvision"}</H3>
<Prose>The full scratch program implements projected Q/K/V window reads, explicit legal-source masks, learned relative biases, patch merging and rectangular position resizing. Its DINO loss/update functions will be used in §6. Read each operation alongside the figures above.</Prose>
<VisionProgram file="vision-mechanisms.py" title="Complete scratch windows, merging, resizing and detached objectives"/>

<Prose>{"The "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/vision_library_bridge.py"}>{"complete library bridge"}</a>{" reuses "}<code>{"ShiftedWindowAttention"}</code>{" and "}<code>{"PatchMerge"}</code>{" from "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/vision-mechanisms.py"}>{"the supplied mechanism file"}</a>{". It copies QKV/output projections and transposes the relative-bias table into torchvision's offset-by-head layout, then checks output, feature gradients and all parameter gradients. The merge comparison copies LayerNorm and reduction weights and includes an odd 5×7 grid. Install a matched Torch 2.14/torchvision 0.29 environment and run "}<code>{"python vision_library_bridge.py"}</code>{" beside the mechanism file. The native implementation check ran this bridge with PyTorch 2.14.0 and torchvision 0.29.0: maximum output difference was 1.67×10⁻¹⁶, input and parameter gradients matched, and the odd-grid merge returned shape (1,3,4,8). A fresh divisible 9×12 case agreed within 2.23×10⁻¹⁶."}</Prose>

<Prose>{"The comparison deliberately uses divisible 6×9 dimensions for window attention. Our teaching operator excludes padded donor positions; torchvision's documented implementation pads values and uses a finite -100 boundary penalty rather than our negative-infinity mask. Therefore arbitrary padded shapes and extremely large logits are not claimed equivalent. Window size, shift, boundary policy, projection bias, relative offsets, dropout and V1/V2 normalization ordering all belong to the model. "}<a href={"https://docs.pytorch.org/vision/0.29/_modules/torchvision/models/swin_transformer.html"}>{"Torchvision Swin source"}</a>{"."}</Prose>

<VisionProgram file="vision_library_bridge.py" title="Read the complete executed torchvision bridge" />

<Prose>{""}<strong>{"Take control:"}</strong>{" change to a 9×12 grid and compare again, then try a 5×7 grid and inspect the padding-policy difference rather than silently loosening the tolerance. "}<strong>{"Hint:"}</strong>{" first separate an index/layout bug from an intentionally different set of permitted keys. "}<strong>{"Solution:"}</strong>{" matched divisible shapes should agree; padded differences require aligning the masks if exact equivalence is the goal. The DINOv2 application in §8 separately supplies normal checkpoint feature extraction, while DeiT/DINO objectives below own their visible custom loss and teacher updates."}</Prose>

<H3>Deeper: Swin V2 changes the operator, not only the model size</H3>
<Prose>The V1 route above normalizes a branch's input before attention or the FFN. Swin V2's residual post-normalization instead normalizes the branch output before adding it to the saved row. Switch to a constructed four-coordinate affine branch with identity weights and bias <code>[0.5,−1,2,0]</code>, input <code>[1,2,3,4]</code>, unit normalization gains, zero offsets and ε=0.00001. This deliberately simple branch exposes the order; it is not a substitute for learned attention.</Prose>
<VisionNormPlacementDrawing/>
<Prose>In the first route, normalize the incoming row, apply the affine branch, then add the untouched input. In the second, apply the affine branch to the original row, normalize that result, then add the same untouched input. The saved bypass is identical; the writes differ because normalization and an arbitrary affine map do not commute.</Prose>
<MathBlock>{String.raw`\text{pre: }x+F(\operatorname{LN}(x)),\qquad \text{residual post: }x+\operatorname{LN}(F(x)).`}</MathBlock>
<Prose>This is also distinct from <code>LN(x + F(x))</code>, which would normalize the complete sum. The exact location of normalization affects activation and gradient routes; <a href="/learn/path/full-curriculum/transformer-block-architecture?module=deep-learning-fundamentals">Transformer Block Architecture</a> develops those Jacobians. Swin V2 also changes patch merging to reduction followed by normalization, whereas the V1 merge we calculated normalizes before its reduction.</Prose>
<Prose>How can attention depend on direction while separately controlling score scale? V2 uses cosine similarity. In a new two-coordinate example, query <code>[3,4]</code> has length 5 and key <code>[0,2]</code> has length 2. Divide each by its own length, take their dot product, and multiply a learned positive scale.</Prose>
<VisionCosineScaleDrawing/>
<Prose>The normalized vectors are <code>[0.6,0.8]</code> and <code>[0,1]</code>, giving cosine 0.8. At log-scale <InlineMath>{String.raw`\log 10`}</InlineMath>, exponentiation gives 10 and the score is 8. The released implementation caps the log-scale at <InlineMath>{String.raw`\log 100`}</InlineMath> before exponentiation, avoiding an unbounded learned scale. Its epsilon normalization defines behavior for a zero vector, and its key-bias handling is part of the actual V2 forward route.</Prose>
<MathBlock>{String.raw`s_{ij}=\exp(\min(\alpha,\log100))\,\frac{q_i^Tk_j}{\lVert q_i\rVert_2\lVert k_j\rVert_2}+b(\Delta r,\Delta c)`}</MathBlock>
<Prose>The fraction describes nonzero vectors; apply the declared epsilon normalization for zero or tiny vectors. Multiplying a query by a positive magnitude does not change its ideal cosine, but changing the learned scale changes the relative softmax sharpness. This is a different policy from the V1 <InlineMath>{String.raw`1/\sqrt{d_h}`}</InlineMath> factor.</Prose>
<Prose>A finite table also ties offsets to the window size. V2 learns a continuous bias function from transformed relative coordinates. Follow a separate stipulated miniature MLP with offset <code>[2,−1]</code>, window side 4, the released normalized coordinate transform, two hidden units and one output.</Prose>
<VisionContinuousBiasDrawing/>
<Prose>Divide the offsets by side minus one and multiply by 8: <code>[16/3,−8/3]</code>. The current Torchvision-style transform is <InlineMath>{String.raw`\operatorname{sign}(x)\log_2(1+|x|)/3`}</InlineMath>. The pictured learned maps are only a hand example; their first map and ReLU produce two hidden coordinates, and the second map followed by <code>16×sigmoid</code> supplies a bounded relative bias. The original paper's logarithmic description and an implementation's exact normalization/constants must not be silently interchanged.</Prose>
<Prose>The complete <code>vision-operator-contracts.py</code> in §6 implements the coordinate transform and cosine scale with explicit input/boundary checks. For an actual V2 block, preserve residual-post-normalization, cosine normalization, scale cap, relative-bias MLP, key-bias convention and merge order together. <a href="https://arxiv.org/html/2111.09883v2#S3">The Swin V2 method</a> and <a href="https://docs.pytorch.org/vision/main/_modules/torchvision/models/swin_transformer.html">current official Torchvision source</a> show these distinctions; this current-source comparison does not claim a fresh V2 checkpoint execution.</Prose>

<H2>{"5. DeiT: use a teacher's decisions as another learning signal"}</H2>
<Prose>So far we have changed the image encoder. How can an already trained teacher help train this student? Add a second learned workspace, DIST, whose output head learns the teacher's detached decision, while CLS learns the dataset label. Neither target is inserted into the input.</Prose>
<VisionDistillationOwnershipDrawing/>
<Prose>The picture follows the same image into two separate models. Inside the student, CLS and DIST communicate with patches in the shared encoder. Two heads produce two score vectors. The dataset target enters only the CLS loss; the teacher's decision enters only the DIST loss. Orange credit trains the student, and deployment no longer needs the teacher.</Prose>

<Prose>{"A Transformer architecture does not specify the entire training recipe. Data selection, augmentation, optimization, regularization and supervision all affect the result. DeiT demonstrated that a carefully trained image Transformer could be effective using ImageNet-1k alone, and introduced a particularly visual way to distill a teacher into a student."}</Prose>

<H3>{"Hard and soft targets solve related but different problems"}</H3>

<Prose>{"With hard distillation, let "}<InlineMath>{"y"}</InlineMath>{" be the true label and "}<InlineMath>{"\\hat y_t=\\arg\\max_c z_{t,c}"}</InlineMath>{" the teacher's predicted class. For student logits "}<InlineMath>{"z_c"}</InlineMath>{" at CLS and "}<InlineMath>{"z_d"}</InlineMath>{" at DIST:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathcal L=\\tfrac12\\operatorname{CE}(z_c,y)+\\tfrac12\\operatorname{CE}(z_d,\\hat y_t)."}</MathBlock></div>

<Prose>{"The cross-entropy implementation takes logits and applies its own log-softmax. If the true class is 2 and the teacher predicts 7, the heads receive different targets. This disagreement can carry a teacher error or reflect a crop whose visible content no longer matches the original image label. Inspect the image and protocol before deciding which."}</Prose>

<Prose>{"Soft distillation instead retains a distribution "}<InlineMath>{"p_t=\\operatorname{softmax}(z_t/T)"}</InlineMath>{". A common objective is "}<InlineMath>{"T^2\\operatorname{KL}(p_t\\|p_s)"}</InlineMath>{" with "}<InlineMath>{"p_s=\\operatorname{softmax}(z_d/T)"}</InlineMath>{", mixed with the label loss. The temperature "}<InlineMath>{"T"}</InlineMath>{" changes the target's sharpness; the "}<InlineMath>{"T^2"}</InlineMath>{" factor is a conventional gradient-scale compensation. State the KL direction explicitly. The term means "}<InlineMath>{"\\sum_c p_{t,c}\\log(p_{t,c}/p_{s,c})"}</InlineMath>{", so the teacher supplies the weighting distribution."}</Prose>

<Prose>{"For a teacher distribution "}<code>{"[0.6,0.3,0.1]"}</code>{", the hard target retains only class 0. A student assigning probability 0.3 to class 1 receives no information from the hard target about whether the teacher considered class 1 a plausible alternative. The soft target retains that relation, but it can also transmit poorly calibrated similarities. Neither target form is a universal winner."}</Prose>

<Prose>{"The original DeiT paper's Table 3 reports 83.4% ImageNet top-1 for the distilled base model at 224 resolution after its 300-epoch training setting; the corresponding non-distilled base row is 81.8%. These are specific published comparisons, not expected scores for a new dataset or our small program. "}<a href={"https://proceedings.mlr.press/v139/touvron21a/touvron21a.pdf"}>{"DeiT paper, §4 and Table 3"}</a>{"."}</Prose>

<H3>{"Be precise about combining the heads"}</H3>
<Prose>Training two heads leaves a deployment decision: do we average their logits or their probabilities? Switch to a hand-only three-class counterexample with heads [-3,−2,0] and [2,3,0], and follow the two complete routes.</Prose>
<VisionFusionDrawing/>

<Prose>{"The paper describes fusion of the two softmax outputs. The official released "}<code>{"DistilledVisionTransformer.forward"}</code>{" instead returns the mean of the two "}<strong>{"logit"}</strong>{" vectors at evaluation. Our teaching program follows that released-code convention:"}</Prose>

<CodeBlock language={"python"}>{"cls_logits, dist_logits = student(images, return_heads=True)\nloss = 0.5 * F.cross_entropy(cls_logits, true_labels)\nloss += 0.5 * F.cross_entropy(dist_logits, frozen_teacher_labels)\ninference_logits = (cls_logits + dist_logits) / 2"}</CodeBlock>

<Prose>{"The methods are not generally interchangeable. For two three-class heads with logits "}<code>{"[-3,−2,0]"}</code>{" and "}<code>{"[2,3,0]"}</code>{", mean logits are "}<code>{"[-0.5,0.5,0]"}</code>{", choosing class 1. Mean probabilities are approximately "}<code>{"[0.1508,0.4098,0.4395]"}</code>{", choosing class 2. Averaging happens on different sides of a nonlinear transformation. This is a concrete reason to inspect a checkpoint's forward method rather than infer its rule from the word “fusion.” "}<a href={"https://github.com/facebookresearch/deit/blob/main/models.py"}>{"Official DeiT implementation"}</a>{"."}</Prose>

<Prose>{"Our small experiment in §7 deliberately records which rule it uses, how teacher targets were obtained and which weights are shared at initialization. It does not claim that adding DIST reproduces the entire DeiT training recipe."}</Prose>

<H2>{"6. DINO and DINOv2: learn features before assigning task labels"}</H2>
<Prose>DeiT's teacher already predicts named classes. What could a teacher supply when there are no human labels? DINO asks different views of one image to agree on a learned description. We now switch from supervised digit recognition to a representation-learning mechanism; the local examples below do not train a DINO checkpoint.</Prose>
<Prose>Imagine two larger, global views and a smaller, local crop. The teacher sees the global views; the student sees all of them. Each head returns a distribution over <strong>prototypes</strong>, learned output coordinates that need not correspond to named classes. Call the teacher distributions <code>qA, qB</code> and the student distributions <code>pA, pB, pC</code>.</Prose>
<VisionCropPairDrawing/>
<Prose>At the top, Global A keeps the whole constructed image, Global B reflects it, and Local C contains its upper-left region. A real augmentation pipeline also controls resizing, brightness and other transforms. In this three-view example the loss uses four pairs: teacher A with student B and C; teacher B with student A and C. It excludes teacher A with student A and teacher B with student B. The student must relate different observations, not simply copy a target computed from the same view.</Prose>
<Prose>This can help a local region acquire information supported by the larger image. It also depends on the crop being useful: a blank crop or an unrelated object can create an inappropriate target. Agreement alone says nothing about whether the resulting representation distinguishes the tasks we care about.</Prose>
<H3>Build one teacher target before writing the loss</H3>
<Prose>For one cross-view pair, use three prototypes. A <strong>logit</strong> is a real-valued score before softmax, as in the classifier in §2. The teacher has logits <code>t=[0.4,0.1,−0.2]</code>. Its running per-prototype <strong>center</strong> is <code>c=[0.1,0,−0.1]</code>. Subtract that center and divide by a positive <strong>temperature</strong>, here 0.2, before applying softmax. Smaller temperature makes unequal scores more decisive.</Prose>
<VisionDinoInvestigation/>
<Prose>Follow the teacher route in its original state: subtraction gives <code>[0.3,0.1,−0.1]</code>; division gives <code>[1.5,0.5,−0.5]</code>; normalization gives approximately <code>[0.66524,0.24473,0.09003]</code>. Centering counters a prototype that tends to dominate across images. Temperature changes sharpness within a target. They act on different objects, and neither alone guarantees successful training.</Prose>
<Prose>The editor keeps this one running case. Choose teacher logits or the running center; choose the prototype coordinate; then change its value. Teacher-target changes are interventions on the target, not gradient updates to the teacher.</Prose>
<MathBlock>{String.raw`q=\operatorname{softmax}((t-c)/\tau_t),\qquad \tau_t>0.`}</MathBlock>
<H3>What does the student change?</H3>
<Prose>Return to the original worked values, or restore them below. Student logits <code>s=[0.1,0.2,−0.1]</code> divided by student temperature 0.5 give <code>[0.2,0.4,−0.2]</code>. The teacher target is <strong>detached</strong>: it supplies the objective but receives no gradient from this loss.</Prose>
<VisionDinoInvestigation question="student"/>
<Prose>Choose a student prototype coordinate and edit its logit below the picture. The teacher and center keep their current values from the preceding question. In the original worked state, the student probabilities are approximately <code>[0.34581,0.42238,0.23181]</code>. For each prototype, multiply its teacher probability by the negative logarithm of its student probability, then add the three contributions. This cross-entropy is 1.048919 nats. Orange credit returns to the student logits. Prototype 0 has less student probability than its target, so its negative logit gradient tells gradient descent to increase that logit.</Prose>
<MathBlock>{String.raw`p=\operatorname{softmax}(s/\tau_s),\quad \tau_s>0,\qquad \ell=-\sum_k q_k\log p_k,\qquad \frac{\partial\ell}{\partial s_k}=\frac{p_k-q_k}{\tau_s}\approx[-0.63885,0.35530,0.28355].`}</MathBlock>
<Prose>The gradient sums to zero because a common shift of every student logit leaves softmax unchanged. Derive it by differentiating log-softmax: <InlineMath>{String.raw`\partial\log p_j/\partial s_k=(\delta_{jk}-p_k)/\tau_s`}</InlineMath>, then use <InlineMath>{String.raw`\sum_jq_j=1`}</InlineMath>. This is a fixed-target derivative. Backpropagation through the student head and backbone continues using their ordinary chain rule; it does not differentiate through the teacher target.</Prose>
<Prose>How do the two temperatures affect different parts of that route? Keep every currently edited logit and center, and vary the teacher and student temperatures separately.</Prose>
<VisionDinoInvestigation question="temperature"/>
<Prose>The teacher temperature changes the target that the student tries to match. The student temperature changes its own distribution and appears in the gradient denominator. A sharper target is not evidence of a better representation. Now add exactly the same offset to every teacher logit: its target is unchanged because the common offset cancels in softmax.</Prose>
<VisionDinoInvestigation question="offset"/>
<Prose>Take one small gradient step on the student logits themselves: <code>s ← s − rate×credit</code>. This is a local loss demonstration, not a model-training step; a real network updates parameters and may couple multiple examples.</Prose>
<VisionDinoInvestigation question="update"/>
<Prose>Restore returns this entire worked case—teacher, center, student, temperatures and rate—to its original state, including unfinished invalid numeric drafts.</Prose>
<VisionDinoInvestigation question="restore"/>
<Prose>A change of target can even reverse the direction of a student update. Switch explicitly to a separate fresh case: <code>t=[0.2,−0.1,0.4]</code>, <code>c=[0.1,0.1,0]</code>, <code>s=[0,0.2,−0.2]</code>, with temperatures 0.25 and 0.5. Hold the student fixed and change only teacher prototype 2.</Prose>
<VisionDinoInvestigation direction/>
<Prose>Moving that teacher logit from 0.4 to 0 changes the student prototype-0 credit from approximately +0.199705 to −0.381967. Cross-entropy changes from 1.412555 to 1.226142 even though the student did not learn. The target moved. This is why a declining self-distillation loss is not by itself a fixed-target accuracy score.</Prose>
<H3>Two moving averages, two different jobs</H3>
<Prose>If the teacher receives no direct loss gradient, how does it change? Average its parameters with the updated student's parameters. Separately, update the running center from the batch's mean teacher logits. The next pair of pictures keeps these two averages separate.</Prose>
<VisionMovingAveragesDrawing/>
<Prose>In the parameter route, keeping 90% of teacher value 2 and taking 10% of updated student value 4 gives 2.2. This is an <strong>exponential moving average</strong> (EMA) of weights over training steps, not an average of stored image features. In the center route, old center <code>[0.1,0]</code> and batch-mean logits <code>[0.5,−0.5]</code> give <code>[0.14,−0.05]</code> at momentum 0.9. The teacher-weight momentum and center momentum are separate hyperparameters in a real implementation.</Prose>
<MathBlock>{String.raw`\theta_t\leftarrow m\theta_t+(1-m)\theta_s,\qquad c\leftarrow\mu c+(1-\mu)\overline t_{\mathrm{batch}}.`}</MathBlock>
<Prose>The complete two-view loss, detached targets and update functions are in <code>vision-mechanisms.py</code>, shown in §4. The <a href="https://arxiv.org/html/2104.14294v2#S3">original DINO method and algorithm</a> connect these local operations to the multi-crop training recipe.</Prose>
<H3>Agreement alone is not enough</H3>
<Prose>If every image produces the same distribution, the views can agree while the representation carries no useful image distinctions. With three zero teacher and student logits, both distributions are uniform, the cross-entropy is <InlineMath>{String.raw`\log3`}</InlineMath> and the student gradient is zero. A zero center and a lower temperature do not break equal-logit symmetry. This stationary case explains why data, augmentations, schedules and representation evaluation matter; it is not a claim that actual DINO training necessarily reaches it.</Prose>
<H3>What DINOv2 adds: retain local information as well as a summary</H3>
<Prose>The image-level objective asks global and local views to agree through a summary. How can the system also learn which information belongs at a particular spatial position? Add a separate masked-patch objective, often called <strong>iBOT</strong>. The student replaces selected patch inputs with a learned mask vector, and an unmasked teacher supplies targets for those spatial positions. CLS and patch outputs use separate heads.</Prose>
<VisionMaskedPatchTargetDrawing/>
<Prose>Follow original patch 5. The student can no longer read its original patch vector directly; it must use visible context to produce that row's output. Its patch head predicts the teacher's detached prototype distribution for patch 5. The image head has its own CLS target. The teacher distribution is a learned feature target, not an assertion that the system has recovered the exact hidden RGB pixels. Unmasked spatial rows can supply context without entering the masked-patch loss.</Prose>
<NeuralTable caption="DINOv2 ingredients and their distinct jobs" headers={['Ingredient','What it acts on','Teaching consequence']} rows={[
 ['Image-level DINO','Cross-view CLS distributions','Global agreement does not replace spatial targets'],
 ['Masked-patch iBOT','Masked student rows and unmasked teacher rows','Local context learns to predict a feature target'],
 ['Separate image/patch heads','Two learned prototype spaces','Do not silently share head weights'],
 ['Assignment balancing','Prototype use across a batch','Different from normalizing one sample'],
 ['KoLeo feature spread','Normalized image feature directions','Different from balancing prototypes'],
 ['Curated data and high resolution','Coverage, duplicates and patch grids','Objectives cannot replace good data'],
 ['Large fixed-teacher distillation','Smaller released backbones','Not the same stage as an EMA teacher'],
 ]}/>
<H3>Deeper: alternate two balancing constraints</H3>
<Prose>Softmax normalizes one sample's prototype scores. <strong>Sinkhorn–Knopp balancing</strong> also asks a batch not to put nearly all assignment mass into a few prototypes. In a separate two-sample, three-prototype example, start with positive masses <code>[[1,2,3],[3,1,1]]</code>. Rows are samples and columns are prototypes. Normalize their total mass to one; then alternate column rescaling toward one-third each and row rescaling toward one-half each.</Prose>
<VisionPrototypeBalancingInvestigation/>
<Prose>Each pass uses the actual preceding matrix. A prototype pass divides each column by three times its current column sum, making its column mass one-third. A sample pass divides each row by twice its current row sum, making its row mass one-half. Enforcing the latest constraint can disturb the other. After three complete column/row rounds, turning the row masses into sample probabilities yields prototype totals approximately <code>[0.668224,0.666127,0.665649]</code>, close to the target <code>[2/3,2/3,2/3]</code> but not exactly equal. This asymmetric example exposes finite-iteration error; a symmetric example can accidentally hide it.</Prose>
<Prose>Real implementations start from scores, manage exponentials and distributed batch statistics, and use a specified number of iterations. The DINOv2 official Sinkhorn implementation and this row-oriented local calculation must be compared with their matrix orientations and target masses aligned. Zero or unrepresentable mass needs an explicit policy; the supplied local operator requires strictly positive finite mass rather than silently normalizing an empty row.</Prose>
<Prose><strong>Why rescaling works.</strong> With a fixed strictly positive kernel matrix <InlineMath>K</InlineMath> and positive desired sample/prototype masses <InlineMath>r,c</InlineMath> with the same total, balancing finds a nonnegative matrix close to that kernel while satisfying both marginals. One precise formulation minimizes generalized KL divergence, not Euclidean distance:</Prose>
<MathBlock>{String.raw`\min_{Q\ge0}\sum_{i,k}\left[Q_{ik}\log\frac{Q_{ik}}{K_{ik}}-Q_{ik}+K_{ik}\right]\quad\text{subject to}\quad \sum_kQ_{ik}=r_i,\quad \sum_iQ_{ik}=c_k.`}</MathBlock>
<Prose>Lagrange multipliers give <InlineMath>{String.raw`\log(Q_{ik}/K_{ik})+\alpha_i+\beta_k=0`}</InlineMath>, so the solution has the form <InlineMath>{String.raw`Q=\operatorname{diag}(u)K\operatorname{diag}(v)`}</InlineMath>. Fix column factors and choose row factors to meet their targets; then reverse those jobs. For these positive inputs and matching masses, alternating rescaling converges to the unique KL projection. Three rounds approximate that limit. Zeros can remove required support; underflow can introduce such zeros accidentally. Real log-domain updates and distributed batch contracts need their own implementation. <a href="https://colab.research.google.com/github/gpeyre/ot4ml/blob/main/notebooks/2-sinkhorn.ipynb">Peyré's Sinkhorn notebook</a> develops the projection and scaling derivation.</Prose>
<H3>Deeper: spread directions without pretending to assign classes</H3>
<Prose>Balanced prototype assignments can still coexist with crowded feature directions. KoLeo instead acts on nonzero, normalized feature vectors. Consider three directions <code>A=[1,0]</code>, <code>B=[0,1]</code> and <code>C=[−1,0]</code>. Find each one's nearest other direction.</Prose>
<VisionNeighborSpreadDrawing/>
<Prose>A and C are both nearest to B; B has an A/C tie. Each selected distance is <InlineMath>{String.raw`\sqrt2`}</InlineMath>. The mean negative logarithm is approximately −0.346574: a negative loss value is valid. As two directions approach coincidence, the distance approaches zero and this idealized penalty grows without bound.</Prose>
<MathBlock>{String.raw`u_i=x_i/\lVert x_i\rVert_2,\qquad \mathcal L_{\mathrm{KoLeo}}=-\frac1n\sum_i\log\min_{j\ne i}\lVert u_i-u_j\rVert_2.`}</MathBlock>
<Prose>Numerical conventions matter at coincidence and zero raw feature length. The complete local operator below adds its named scalar epsilon inside the logarithm and rejects zero raw vectors. DINOv2's released implementation uses its own pairwise-distance/epsilon convention; it is not numerically identical at every boundary. Spreading directions neither assigns semantic names nor proves fair representation of rare categories. The <a href="https://arxiv.org/html/2304.07193v2#S4">DINOv2 objectives and implementation details</a> explain how these terms are combined with curation, high-resolution adaptation and teacher distillation.</Prose>
<Prose><strong>Why it can repel a neighbor.</strong> Away from a nearest-neighbor tie, the selected pair's negative log-distance differentiates to a force opposing their difference vector. Both ends of the pair receive credit, and a feature can also be the selected neighbor of other features. Unit normalization removes the radial component of that credit, so merely increasing raw feature magnitude cannot improve a direction-only loss. A nearest-neighbor identity change makes the ideal objective piecewise differentiable; an exact tie needs the implementation's declared selection/subgradient convention. At coincidence the ideal logarithm is undefined, which is why the numerical convention cannot be omitted.</Prose>
<H3>Deeper and current: give internal computation its own records</H3>
<Prose>Spatial patch rows are associated with image positions, but attention can also use them as workspace. The registers study observed high-norm outlier features in some patch rows. Additional learned <strong>register records</strong> provide nonspatial working locations. They communicate in the sequence but are excluded from the returned spatial grid.</Prose>
<VisionRegisterAnatomyDrawing/>
<Prose>The picture explicitly separates CLS, two illustrative registers and two pictured patch records. All five can communicate. Only the two PATCH outputs go back to their pictured grid cells. A register is not an extra measured image patch, an output class or a hardware register. The <a href="https://arxiv.org/html/2309.16588v2">registers study</a> does not establish a universal requirement for exactly four such tokens. Adding untrained records to an unrelated checkpoint is not the trained method.</Prose>
<H3>Deeper and current: encode two spatial axes in the attention match</H3>
<Prose>DINOv3, a later family, changes more than a checkpoint name. Its positional construction uses two-dimensional rotary positions. A query/key coordinate pair can turn according to row position; another pair can turn according to column position. We use one hand-only quarter-turn frequency below to expose that ownership, not to reproduce a released frequency schedule.</Prose>
<VisionAxialRotationDrawing/>
<Prose>For selected patch row 1, column 0, multiplying each axis by frequency <InlineMath>{String.raw`\pi/2`}</InlineMath> gives phases <InlineMath>{String.raw`[\pi/2,0]`}</InlineMath>. Query <code>[1,0,1,0]</code> becomes <code>[0,1,1,0]</code>: its first adjacent pair turns while its second stays fixed. A key turns by its own patch coordinates; the value does not receive this position turn. Actual implementations define patch-center coordinates, axis assignment, periods and optional training transforms. The <a href="https://github.com/facebookresearch/dinov3/blob/main/dinov3/layers/rope_position_encoding.py">official rotary-position implementation</a> owns those exact conventions. <a href="/learn/path/full-curriculum/positional-encodings-sinusoidal-learned-rope-alibi?module=deep-learning-fundamentals">Positional Encodings</a> derives the pair rotation and relative-match identity.</Prose>
<H3>Deeper and current: preserve relationships, not absolute coordinates</H3>
<Prose>DINOv3's <strong>Gram anchoring</strong> targets dense-feature deterioration during prolonged training. It compares pairwise feature relationships with those of a separate earlier teacher snapshot. This snapshot has a distinct role from an EMA teacher. A <strong>Gram matrix</strong> contains every pairwise dot product; for unit vectors those entries are cosines. Switch to four reference directions at 0°, 90°, 180° and 270°.</Prose>
<VisionGramInvestigation/>
<Prose>Turn one current direction while keeping the reference fixed. The same edited directions feed the full matrix below. Turning the last from 270° to 0° makes it coincide with the first: the sum of all sixteen squared entry differences becomes 6, and their mean is 6/16 = 0.375. Both symmetric off-diagonal entries count. Change no direction independently, and a common rotation preserves every pairwise relationship.</Prose>
<Prose>Does that null remain after an individual edit? Rotate every current direction together while holding the original reference relationships fixed.</Prose>
<VisionGramInvestigation question="rotation"/>
<Prose>The current discrepancy is unchanged by that common rotation. Restore all four reference directions when you want a fresh zero-loss comparison.</Prose>
<VisionGramInvestigation question="restore"/>
<Prose>Each cell below is one actual pair of directions. The student and reference matrices, their difference and squared difference show exactly what enters the sum and average.</Prose>
<VisionCurrentGramMatrix/>
<MathBlock>{String.raw`U_i=x_i/\lVert x_i\rVert_2,\quad G=UU^T,\quad \mathcal L=\frac1{n^2}\lVert G-G_*\rVert_F^2.`}</MathBlock>
<Prose>Here <InlineMath>{String.raw`G_*`}</InlineMath> is the fixed reference Gram matrix and the Frobenius norm squares and sums all matrix entries. With <InlineMath>{String.raw`D=UU^T-G_*`}</InlineMath> symmetric, the unit-coordinate gradient is <InlineMath>{String.raw`4DU/n^2`}</InlineMath>. To return it to a raw nonzero feature, remove its radial component and divide by raw length:</Prose>
<MathBlock>{String.raw`\nabla_{x_i}\mathcal L=\frac{(I-u_i u_i^T)(\nabla_U\mathcal L)_i}{\lVert x_i\rVert_2}.`}</MathBlock>
<Prose>This derivative cannot change raw feature length to first order; it changes direction. A common orthogonal transform leaves the Gram matrix fixed, so the objective is not a unique coordinate-system identifier. Zero raw features need a declared normalization contract, and preserving relationships does not itself establish task accuracy. The <a href="https://arxiv.org/html/2508.10104v1#S4">DINOv3 Gram objective</a> gives the actual training motivation; its full training comparison belongs with <a href="/learn/path/full-curriculum/self-distillation-byol-dino-dinov2?module=self-supervised-learning">Self-Distillation</a>.</Prose>
<H3>Implement the local objectives and compare ordinary library derivatives</H3>
<Prose>The complete no-writing program below implements the normalized Gram loss and raw-feature derivative, detached-target DINO loss and credit, alternating balancing, a stated KoLeo epsilon convention, pair rotation and the Swin V2 coordinate/cosine contracts. Its main compares matched inputs with PyTorch autograd and separately calculated finite differences. It uses float64 for tight small-case checks; these are operator checks, not a large-model training recipe.</Prose>
<VisionProgram file="vision-operator-contracts.py" title="Complete local vision objectives and same-input library checks"/>
<Prose>Save it as <code>vision-operator-contracts.py</code> and run <code>python vision-operator-contracts.py</code> in an environment with NumPy and PyTorch. It does not download weights, write receipts or change the retained digit study. Invalid real/complex inputs, undefined normalization and unrepresentable extreme intermediates are rejected instead of clipped into a different objective. The full network and training recipe in §7 are the next layer of implementation.</Prose>

<H2>{"7. Run a small image study and interpret every result"}</H2>
<Prose>The mechanisms now have enough detail to build and evaluate a complete system. Return to the supervised 8×8 digit task: each cell is a count from 0 to 16, scaled by 16. Before inspecting trained weights, trace which images may influence fitting, checkpoint selection and the final reported test result.</Prose>
<VisionDatasetProtocolDrawing/>
<Prose>The original training file is partitioned into 1,200 fit images, 300 validation images and 2,323 unused images. The test file remains separate. Training proposes checkpoints; only validation loss chooses one. The final test result must not choose another checkpoint afterward.</Prose>

<Prose>{"The "}<strong>{"Optical Recognition of Handwritten Digits"}</strong>{" collection was designed to investigate handwritten-digit recognition. The supplied 8×8 images were obtained by counting marked pixels in 4×4 blocks of normalized 32×32 bitmaps. Each cell is an integer from 0 to 16. Our input divides by 16, using the published bound rather than a statistic fitted across the data. This is not MNIST and not a collection of natural RGB photographs. "}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"UCI dataset and CC BY 4.0 attribution"}</a>{"."}</Prose>

<Prose>{"The original files contain 3,823 images from 30 writers and 1,797 images from 13 different writers. We retain the original test pool and choose 120 training plus 30 validation images per digit from the original training file, using NumPy generator seed 173. That gives 1,200 training,300 validation and 1,797 test images. The other training-file rows remain unused. All pixel vectors were checked: no exact duplicates within either file or across files. Individual writer IDs are unavailable, so our internal validation subdivision is not a writer-disjoint validation split; the original final test pool is separate by the collectors' protocol."}</Prose>

<H3>{"What is held fixed, and what changes?"}</H3>

<Prose>{"The complete "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/vision-study.py"}>{"vision-study.py"}</a>{" contains data loading, model definitions, losses, checkpoint selection, feature readouts and JSON export. Run it beside the three supplied "}<code>{"optdigits"}</code>{" files:"}</Prose>

<CodeBlock language={"text"}>{"python vision-study.py"}</CodeBlock>

<Prose>{"The recorded run used Python 3.12.14, NumPy 2.3.5, PyTorch 2.14.0+cpu and scikit-learn 1.9.1, one CPU thread. It does not need a network connection or a GPU. The "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/experiment-contract.md"}>{"declared protocol"}</a>{" was saved before fitting."}</Prose>

<VisionProgram file="vision-study.py" title="Read the complete trainable image models, data split and retained study" />

<Prose>{"The CNN has two small convolutions and a 32-wide feature layer. The ViT has sixteen 2×2 patch tokens, a 32-wide CLS representation, two pre-normalization blocks, four heads of width 8, and FFNs of width 64. The distilled student adds DIST and its head. Its common tensors are copied from the plain ViT's initial state; the extra token/position start at zero and its head starts as a copy of the CLS head."}</Prose>

<Prose>{"Each model receives 600 AdamW updates, learning rate 0.002, weight decay 0.01 on all parameters, and batches of 128 sampled with replacement from the same seed 301 index stream. There is no augmentation, learning-rate schedule, dropout or stochastic depth. Every 50 updates, validation cross-entropy is measured; the smallest value selects the checkpoint, with ties going to the earliest. The fixed test pool is evaluated afterward. This is deliberately a modest training recipe, not a DeiT or DINO reproduction."}</Prose>

<Prose>{"The selected teacher is frozen. Its hard labels disagree with 8 of the 1,200 training labels. Even where the teacher agrees, the student differs from plain ViT through an extra token, extra head and two loss paths. The comparison therefore does not isolate only “teacher information” or match parameter counts exactly."}</Prose>

<Prose>Why does the selected checkpoint not always have the largest correct-count? Inspect the actual thirteen validation measurements. Each dot is a recorded evaluation at an update multiple of 50; connecting lines are visual guides, not additional observations. Change the recorded run, keeping the vertical axis fixed.</Prose>
<VisionRecordedValidationInvestigation/>
<Prose>The white ring marks the minimum observed validation cross-entropy, with earliest ties. No test-loss curve or repeated-seed uncertainty was measured. The selected classifier results were:</Prose>

<NeuralTable caption={"What is held fixed, and what changes?"} headers={[<>{"Model"}</>,<>{"Parameters"}</>,<>{"Selected update"}</>,<>{"Validation correct/300"}</>,<>{"Test correct/1,797"}</>,<>{"Test cross-entropy, nats"}</>]} rows={[[<>{"Small CNN teacher"}</>,<>{"15,386"}</>,<>{"550"}</>,<>{"293"}</>,<>{"1,723"}</>,<>{"0.13587"}</>],[<>{"Plain patch ViT"}</>,<>{"18,218"}</>,<>{"350"}</>,<>{"285"}</>,<>{"1,630"}</>,<>{"0.38152"}</>],[<>{"Student with DIST"}</>,<>{"18,612"}</>,<>{"600"}</>,<>{"283"}</>,<>{"1,658"}</>,<>{"0.30758"}</>]]} />

<Prose>{"Distillation improves this student's test count and cross-entropy, but the CNN remains stronger. The distilled student's selected validation *count* is lower than the plain student's, even though its validation cross-entropy is lower. That is possible because checkpoint selection minimizes a probability-sensitive loss, not simply the number of correct argmax decisions. A few confident mistakes can matter substantially to cross-entropy."}</Prose>

<Prose>{"These are one-seed results with different architectures and a fixed small budget. They do not estimate seed uncertainty or establish a universal ordering. Keeping an unfavorable result is useful: the experiment teaches that a successful mechanism and a good final model choice are different questions."}</Prose>



<H3>{"A frozen representation and its classifier are separate components"}</H3>

<Prose>{"For each selected model, freeze the feature extractor. Fit a training-only "}<code>{"StandardScaler"}</code>{" followed by "}<code>{"LogisticRegression(C=1,max_iter=2000)"}</code>{" on its 32-wide features. Also fit the same readout on the 64 raw pixels. Validation and test rows are only transformed and predicted."}</Prose>

<NeuralTable caption={"A frozen representation and its classifier are separate components"} headers={[<>{"Input to the newly fitted linear readout"}</>,<>{"Test correct/1,797"}</>,<>{"Test cross-entropy"}</>]} rows={[[<>{"Raw 64-pixel vector"}</>,<>{"1,695"}</>,<>{"0.16831"}</>],[<>{"Frozen CNN feature"}</>,<>{"1,725"}</>,<>{"0.12642"}</>],[<>{"Frozen plain ViT CLS"}</>,<>{"1,637"}</>,<>{"0.41823"}</>],[<>{"Frozen distilled student's CLS"}</>,<>{"1,648"}</>,<>{"0.34947"}</>]]} />

<Prose>{"The raw-pixel baseline is strong on these already normalized small images. The distilled CLS readout uses only CLS, whereas that network's original classifier fuses CLS and DIST. Its score need not match the two-head score. A linear readout can improve the count but worsen cross-entropy, as happens for plain ViT here. It fits a different decision surface with a different regularizer."}</Prose>

<Prose>{"These feature extractors were trained with labels. Their readouts demonstrate the mechanics of frozen-feature evaluation; they are not evidence that self-supervised DINO was trained. A real DINO evaluation must identify its actual pretrained checkpoint, data boundary, feature definition and fitted readout."}</Prose>

<H3>Follow the actual edited image through every branch</H3>
<Prose>The retained results summarize whole test pools. Can we see the same computations on one real image? The three available images are the first three test-file rows, selected by order. Start with the third, a digit 2 that this plain ViT misclassifies. Each cell below is a published count from 0 to 16, divided by 16 for the model. White outlines identify the currently selected pixel and original 2×2 patch.</Prose>
<VisionImageInvestigation resourceOwner/>
<Prose>The complete ten-class distribution stays visible. Choose another original image for comparison; this starts from that image's pixels and original content listing. The weights stay frozen. Next choose any pixel coordinate and change its count. This changes the input rather than training a coefficient.</Prose>
<VisionImageInvestigation question="pixel"/>
<Prose>The third original image assigns only 0.01899 probability to digit 2. Changing pixel (row 2,column 3) from count 13 to count 3 changes that probability to approximately 0.996705 in the retained port. This establishes sensitivity to that specific edit, not a universal rule for recognizing a 2. The first original image is a correctly recognized 0, with probability 0.99787; editing its (row 2,column 4) count 0 to 16 gives 0.99665 for 0. Both useful and failed examples belong in the same investigation.</Prose>
<Prose>Before following deeper updates, inspect the learned patch map. The picture below uses original patch 5 by default, its four actual pixels and the retained 32×4 map. It draws the first two output rows and their first three input products; the omitted fourth product is included in each complete sum. The full dimensions are stated where the cutaway occurs.</Prose>
<VisionCurrentModelDrawing stage="stem"/>
<Prose>This is the affine route from §1 with trained numbers and a larger output width. The selected original patch's current pixels determine its projected vector. Parameter entries are amber, observed pixels cyan and computed features violet. A negative activation is not an invalid pixel.</Prose>
<Prose>How does that vector acquire its current location? The next picture selects the learned position associated with the current slot, adds it to the actual projected content, and separately constructs CLS from its learned workspace and position.</Prose>
<VisionCurrentModelDrawing stage="assembly"/>
<Prose>Each full row has 32 coordinates; sixteen positioned patch rows plus CLS make seventeen records. The complete current table retains every coordinate and explicitly names the original patch and current position. It is a numeric table, so horizontal scrolling is local and intentional.</Prose>
<VisionFullAssemblyTable/>
<H3>Choose a receiver and head, then trace its actual read</H3>
<Prose>The default is block 1, head 0, receiver 0 (CLS). A block contains four heads, each with eight coordinates, and all seventeen records are available. Select another block, head or receiver below. The score/amount/weight table draws all seventeen source rows in sequence order; CLS is source 0 and patch slots are sources 1–16.</Prose>
<VisionHeadInvestigation/>
<Prose>For each row the scaled dot product enters an exponential after subtracting the common maximum. Every resulting amount shares the denominator shown. A source's weight is not its class probability; it is the share of this one head's value read. The source contribution investigation below supplies the matching value coordinates rather than treating the weight alone as the transmitted information.</Prose>
<Prose>Where do this receiver's query and the source keys/values come from? Start with the receiver's actual first normalization. Its32-coordinate mean and variance determine one divisor, then learned gains and offsets transform the standardized row.</Prose>
<VisionCurrentModelDrawing stage="norm1"/>
<Prose>The cutaway shows three coordinates but the statistics use all 32. The divisor is <InlineMath>{String.raw`\sqrt{\operatorname{Var}(x)+10^{-5}}`}</InlineMath>, not standard deviation plus epsilon. The real gains and offsets are trained. This row enters three separate affine maps for the selected head.</Prose>
<VisionCurrentModelDrawing stage="query"/>
<Prose>The query map has 8 output rows and 32 input columns. Each pictured product belongs to the selected receiver; all remaining input products are included in its full query coordinate. A separate 8×32 map constructs its key:</Prose>
<VisionCurrentModelDrawing stage="key"/>
<Prose>The same key map is applied to every source row. The pictured receiver's own key is one of those seventeen sources, not the entire memory. A third 8×32 map produces its value:</Prose>
<VisionCurrentModelDrawing stage="value"/>
<Prose>Again, every source uses this shared value map. Choose a source row below to compare its actual key/value with the selected receiver's query. The score includes all eight dot-product terms, while the cutaway displays three; its share uses all seventeen legal scores.</Prose>
<VisionHeadInvestigation question="contribution"/>
<Prose>The source's weight multiplies each of its eight value coordinates. Summing the corresponding coordinates across all seventeen sources produces the head output. Here is the complete current numeric route, including every source's eight key coordinates, eight value coordinates, eight products and weighted contribution.</Prose>
<VisionFullHeadTable/>
<H3>Write that information back, without losing the saved row</H3>
<Prose>One head outputs eight coordinates. Concatenating all four heads yields 32; it does not average them or throw three away. The retained 32×32 output map and bias transform that concatenated row into an attention write.</Prose>
<VisionCurrentModelDrawing stage="output"/>
<Prose>The output coordinate in this cutaway includes all 32 products and its actual bias. Its input comes from four complete head outputs, not directly from a table of matching weights. Add this write to the saved incoming row:</Prose>
<VisionCurrentModelDrawing stage="attention-residual"/>
<Prose>The residual sum carries the original row forward as well as the newly read information. The next branch saves this sum and normalizes it again using the block's separately learned second gain and offset.</Prose>
<VisionCurrentModelDrawing stage="norm2"/>
<Prose>The feed-forward up-map expands each complete normalized row from 32 to 64 coordinates. It has 64 output rows and 32 input columns, plus 64 biases.</Prose>
<VisionCurrentModelDrawing stage="up"/>
<Prose>Apply GELU to each of those 64 coordinates. This smooth nonlinearity is <InlineMath>{String.raw`\operatorname{GELU}(x)=x\Phi(x)`}</InlineMath>, where <InlineMath>{String.raw`\Phi`}</InlineMath> is the standard-normal cumulative distribution function. The retained model uses the exact-error-function route, not the optional tanh approximation.</Prose>
<VisionCurrentModelDrawing stage="gelu"/>
<Prose>A 32×64 down-map brings the 64-wide hidden row back to 32 coordinates, with 32 biases. The complete down-map can combine hidden features; it is not an inverse of the up-map.</Prose>
<VisionCurrentModelDrawing stage="down"/>
<Prose>Add this feed-forward write to the saved row from the attention addition.</Prose>
<VisionCurrentModelDrawing stage="ffn-residual"/>
<Prose>These two branches apply to every record. This row-wise FFN contains no extra cross-record read. The second block repeats the same architecture with its own learned parameters. At the end, the final normalization below always shows CLS, because the classifier consumes CLS even when the earlier head inspection selects a patch receiver.</Prose>
<VisionCurrentModelDrawing stage="final-norm"/>
<Prose>The final CLS vector enters the 10×32 classifier map plus ten biases. The pictured first two score coordinates are a cutaway of the complete ten-class vector; the probability display above uses all ten.</Prose>
<VisionCurrentModelDrawing stage="class-head"/>
<Prose>Softmax, cross-entropy and the classifier's parameter gradients use the ordinary rules already taught in <a href="/learn/path/full-curriculum/loss-functions-ce-mse-focal-contrastive-triplet?module=deep-learning-fundamentals">Loss Functions</a>. The full <code>vision-study.py</code> earlier in this section defines these trainable layers and runs their complete optimizer/data/validation route. The live investigation evaluates the same fixed weights, so these image edits do not refit the model.</Prose>
<H3>Separate moving content from relisting located records</H3>
<Prose>Use the current image and edits. Choose two current slots and swap the original content rows occupying them. The little slot grid explicitly marks C as original content identity and P as learned position identity; those IDs are metadata, not Q/K/V coordinates.</Prose>
<VisionImageInvestigation question="permutation"/>
<Prose>With positions tied to slots, that swap changes the located content. The paired live sentence compares one further selected swap while holding current pixels and position policy fixed. The separate original-source difference includes all prior edits; it must not be read as the effect of this one control.</Prose>
<Prose>Now change only position ownership: let positions travel with original content. Switching this policy on an already swapped listing can change its located content and class result; the paired sentence measures that policy change. Once positions travel, further swaps merely relist complete located records, keeping CLS fixed. Those further swaps preserve the class result up to roundoff under the symmetry proved in §2. Keep the currently edited pixels rather than resetting them.</Prose>
<VisionImageInvestigation question="position"/>
<Prose>Restore returns the selected-source/pixels/listing/position policy and display selections to the third original fitted case.</Prose>
<VisionImageInvestigation question="restore"/>
<Prose>The retained model exports reproduce all 1,797 recorded test predictions. Existing native and browser-port comparisons cover original images, pixel edits and both listing policies. Their maximum port differences were 0.00000714 for logits, 0.00000385 for features and 0.000000443 for selected attention weights. These are finite-precision implementation comparisons, not a confidence interval for model accuracy.</Prose>
<H3>Reproduce a saved forward pass without running another fit</H3>
<Prose>The saved-state verifier below reloads <code>vision-models.json</code> and <code>study-results.json</code> beside <code>vision-study.py</code> and <code>vision-mechanisms.py</code>. It checks a separate NumPy forward route and fresh small mechanism cases, then writes <code>author-results.json</code> in that local directory. It does not train another model. Use a copied study directory if you want to preserve an existing result file; the no-writing local operator program in §6 serves a different purpose.</Prose>
<VisionProgram file="author-checks.py" title="Complete saved-state forward and mechanism verifier; writes its named result file"/>

<H2>{"8. Use image features for a real task"}</H2>
<Prose>The classifier used only the final CLS vector. What can we do with the final spatial patch vectors themselves? Keep the same currently edited image and weights, and inspect its spatial features before assigning a new task to them.</Prose>

<H3>{"A spatial feature map is not a segmentation mask"}</H3>

<Prose>The sixteen patch rows form a 4×4 grid of 32-coordinate vectors. To view three coordinates without refitting the network, principal component analysis (PCA) chooses directions that capture training-feature variance. Call those ordered directions PC1, PC2 and PC3. We center a current patch feature by the fixed training mean, project onto those three directions, then use fixed ranges to encode PC1 as red, PC2 as green and PC3 as blue. Those colors encode data, not semantic classes.</Prose>
<VisionFeatureInvestigation/>
<Prose>Follow the selected original patch to its current sequence row, then through the full 32-coordinate centering and projection. The cutaway shows three products, but all 32 enter each complete PC coordinate. The grid places the result by original physical patch identity even when the sequence was relisted. Choose an original patch and which PC coordinate to read; the current image edits and trained weights persist from §7.</Prose>
<MathBlock>{String.raw`z=(h-\mu_{\mathrm{train}})B_{\mathrm{train}},\qquad h\in\mathbb R^{32},\quad B_{\mathrm{train}}\in\mathbb R^{32	imes3}.`}</MathBlock>
<Prose>The training mean and basis were fitted on 1,200×16=19,200 training patch vectors, after freezing the selected backbone. Neither changes with the displayed image. Fixed range clipping only limits the RGB color encoding; it does not clip the actual PC coordinate. <a href="/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml">PCA and Dimensionality Reduction</a> derives those axes and their ambiguity.</Prose>
<Prose>{"In this study the first three PCA directions explain approximately 22.72%,16.76% and 10.50% of training patch-feature variance. Together that is about 49.98%, not the entire representation. The axes are fitted only on the training patch features and reused for all displayed test images. Refitting PCA independently on each image would make colors incomparable; sign flips of equally valid PCA directions can also reverse a color axis."}</Prose>



<Prose>Can a current patch feature find a similar region in another image? Divide each nonzero vector by its own length, multiply corresponding coordinates and sum: this is cosine similarity. The candidate image below remains an original saved image, while the query is the current edited image. Choose its original query patch and the fixed candidate image.</Prose>
<VisionFeatureInvestigation question="matching"/>
<Prose>The diagram exposes normalization, coordinate products, the complete 32-term sum and the largest candidate scores. The table includes all sixteen candidates. A maximum is returned whenever a defined comparison exists; zero-length directions are explicitly undefined. Ranking is not evidence of a correct correspondence.</Prose>
<Prose>{"For a separate original-image calculation, patch 5 of test image 1 compared with all 16 patch vectors of test image 2 has top matches patch 10, patch 2 and patch 14 with cosines 0.3620,0.2958 and 0.2895. The algorithm always returns a maximum when candidates exist. That maximum is not automatically a meaningful correspondence: these are different digits, the scores are modest, and the features were trained for image classification rather than matching parts."}</Prose>

<Prose>{"The mechanism nevertheless explains a useful application: "}<strong>{"copy detection and image retrieval"}</strong>{". A global image embedding can find similar images despite some appearance changes; local patch matching can inspect whether corresponding regions agree. Distinguishing a cropped copy from two different but similar products requires labeled evaluation pairs and geometric verification. Similarity by itself cannot establish identity, ownership or authenticity. DINO's paper explicitly studies retrieval and copy detection; the later vision lessons can develop the full evaluation. "}<a href={"https://arxiv.org/html/2104.14294v2#S4.SS2"}>{"DINO §4.2.1"}</a>{"."}</Prose>

<Prose>Similarity is not the only downstream operation. For dense prediction, attach a shared task head to every spatial feature and then resize its output scores. Switch to a constructed 2×2 grid of two-coordinate features and one scalar head, W=[2,−1] with bias 0.5. The four scores are computed from actual coordinates before any resizing.</Prose>
<VisionDenseHeadDrawing/>
<Prose>The four coarse scores are 2.5,−0.5,1.5 and 0.5. Bilinear interpolation with align_corners=False produces the pictured 4×4 score grid. An output lies between nearby coarse scores, with boundary behavior defined by the library. Sixteen output values do not provide sixteen independent feature measurements. For segmentation, interpolate class scores then take a class decision; interpolating numeric class IDs would mix arbitrary label numbers.</Prose>
<Prose>The complete program below implements the head's shared matrix multiplication and bias, retains its gradients, and carries the result to the documented interpolation operator. It copies the same parameters into nn.Linear and compares every input/weight/bias gradient under a nonuniform probe. Its separate hand 4×4 grid checks the output geometry. No task-specific head is trained by that local calculation.</Prose>
<VisionProgram file="dense-feature-head.py" title="Complete explicit dense feature head and copied-parameter library comparison"/>
<Prose>{"For "}<strong>{"dense prediction"}</strong>{", a head can map each patch feature to class scores or a continuous target, then a decoder or interpolation can produce a finer grid. Patch 14 features on a 518-pixel side give 37 positions per axis. Enlarging the output grid does not create additional independent feature measurements or guarantee sharp boundaries. A head trained on masks or depth labels supplies task-specific supervision even if the backbone remains frozen."}</Prose>

<Prose>{"This makes a less obvious application easy to interpret: a remote-sensing encoder may supply patch features to a canopy-height estimator. The features encode image patterns; a regressor learns the relationship to measured heights. Pixel size, geographic split, acquisition conditions and target units become part of the evaluation. The DINOv3 report explores this domain, but there is no reason to assume a generic natural-image checkpoint gives calibrated heights without that task-specific work. "}<a href={"https://arxiv.org/html/2508.10104v1#S8"}>{"DINOv3 geospatial study, §8"}</a>{"."}</Prose>

<H3>{"Attention is one internal quantity, not the entire explanation"}</H3>

<Prose>{"A CLS-to-patch row shows how one head mixes its values at one layer. It omits other heads, the value projection, earlier layers, residual streams and the classifier. With 16 patches plus CLS, uniform attention has weight "}<InlineMath>{"1/17"}</InlineMath>{" at every token. If a display excludes CLS and renormalizes the remaining weights, it must label that conditional normalization rather than silently implying the original row sums to one across patches."}</Prose>

<Prose>{"Attention rollout composes attention matrices, often with a residual approximation. It can be an informative visualization but still does not replace the network's actual value/FFN computation. Perturbation gives an actual input–output contrast for the chosen edit, with its own limit: masking a region can create an out-of-distribution image. Use maps to pose a testable question, then measure the effect relevant to that question."}</Prose>

<H3>{"Checkpoint preparation is part of the model"}</H3>

<Prose>{"For a pretrained system, record the exact checkpoint and its model configuration. Then preserve its expected color channels, pixel range, resize/crop policy, interpolation, normalization, patch size, special tokens and output layout."}</Prose>

<Prose>{"A PIL RGB image usually supplies byte-range input to a processor that rescales and normalizes. An already rescaled float image may require disabling the processor's rescaling; otherwise it can be divided twice. “All ViTs use mean 0.5” is false: normalization belongs to a checkpoint's training pipeline."}</Prose>

<Prose>{"In "}<code>{"timm"}</code>{", resolve the data configuration before creating a transform:"}</Prose>

<CodeBlock language={"python"}>{"import timm\nfrom PIL import Image\n\nmodel = timm.create_model(\"vit_base_patch16_224\", pretrained=True).eval()\ndata_config = timm.data.resolve_data_config(model.pretrained_cfg)\ntransform = timm.data.create_transform(**data_config, is_training=False)\nimage = Image.open(\"example.png\").convert(\"RGB\")\nimage_tensor = transform(image).unsqueeze(0)"}</CodeBlock>

<Prose>{"This optional API example requires the selected pretrained weights; no checkpoint prediction is shown here. Preparing "}<code>{"num_classes=8"}</code>{" creates an 8-class head; it does not train that head. A frozen-feature setup must freeze the backbone, create/train the intended head, and verify which parameters and state buffers can change. "}<code>{"eval()"}</code>{", disabling gradients and freezing parameters serve different purposes. "}<a href={"https://huggingface.co/docs/timm/quickstart"}>{"Current timm quickstart"}</a>{"."}</Prose>

<Prose>{"The complete optional "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/inspect-pretrained-features.py"}>{"inspect-pretrained-features.py"}</a>{" reads a locally prepared official "}<code>{"facebook/dinov2-small"}</code>{" checkpoint, its processor and local image files. It performs inference, extracts CLS and spatial patch features, and saves a cosine matrix. It makes no network requests. Prepare the checkpoint and the PyTorch/Transformers/Pillow dependencies first, then run:"}</Prose>

<CodeBlock language={"text"}>{"python inspect-pretrained-features.py --checkpoint ./dinov2-small --output features.npz image-a.png image-b.png"}</CodeBlock>

<Prose>{"This optional program targets the documented non-register DINOv2 interface. Its local-checkpoint inference is not demonstrated here. For that model family the expected token count is one CLS plus the processor's patch grid, with hidden width given by the configuration. The program checks those relationships. A register variant or DINOv3 needs its own documented interface. Official DINOv2's native "}<code>{"forward_features"}</code>{" dictionary and Transformers' "}<code>{"last_hidden_state"}</code>{" tensor are different APIs. "}<a href={"https://huggingface.co/docs/transformers/model_doc/dinov2"}>{"Transformers DINOv2 documentation"}</a>{", "}<a href={"https://github.com/facebookresearch/dinov2/blob/main/dinov2/models/vision_transformer.py"}>{"native feature interface"}</a>{"."}</Prose>

<VisionProgram file="inspect-pretrained-features.py" title="Read the optional local-checkpoint feature extractor (not executed here)" />

<H3>{"Choose an experiment before choosing a fashionable model"}</H3>

<Prose>{"For a new catalog classifier, begin with an explicit label set, grouped image/product split and a held-out evaluation. Fit a modest baseline and a frozen readout from an appropriate available checkpoint. Inspect errors by category, crop size and image source. Measure latency and memory on the actual deployment device with the intended batch, dtype and preprocessing."}</Prose>

<Prose>{"If the frozen representation cannot support the distinctions, compare partial or full fine-tuning under a validation protocol. If there is useful unlabeled in-domain data, continued representation learning is another experiment, with data contamination, compute and forgetting to assess. There is no universal “fine-tune only when the gap exceeds 3%” or guaranteed ranking between those choices."}</Prose>

<Prose>{"Text-defined zero-shot labels require an image–text alignment mechanism. CLIP and SigLIP are examples, and DINO-based systems can add text alignment too; a bare visual feature vector does not acquire that ability simply by calling softmax. The planned "}<a href={"/learn/path/full-curriculum/vision-language-models-clip-siglip-blip-2?module=nlp-cv-multimodal"}>{"Vision-Language Models"}</a>{" lesson owns that objective. Promptable masks require a prompt encoder and mask-prediction system, developed in "}<a href={"/learn/path/full-curriculum/foundation-models-for-segmentation-sam-sam-2?module=nlp-cv-multimodal"}>{"Foundation Models for Segmentation"}</a>{". Pixel reconstruction objectives belong in "}<a href={"/learn/path/full-curriculum/masked-autoencoders-mae-beit-data2vec?module=self-supervised-learning"}>{"Masked Autoencoders"}</a>{". These are distinct uses of learned visual representations, not interchangeable promises attached to “ViT.”"}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practice: explain, calculate, intervene and choose"}</H2>

<Prose>{"The core finish line is Exercises 1–4 and 7–8. Exercises 5–6 and 9 develop the deeper branches. Attempt each before opening its hint or solution; their inputs differ from the worked demonstrations."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A rectangular camera image"}</H3>

<Prose>{"An RGB image is 96×160. Use 8×8 patches and width 64, with one learned CLS and a learned absolute position for every token. How many pixel positions, patches and sequence tokens are there? What is the input width of the patch projection? Count all patch-projection weights and biases, the CLS parameter and the position table. What changes if DIST and its position are added, before counting its classifier?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep channel values separate from pixel positions. The grid is rectangular. Count the special token parameter independently from its positional vector."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"There are 15,360 pixel positions and 46,080 RGB scalars. The patch grid is 12×20, so "}<InlineMath>{"N=240"}</InlineMath>{" and "}<InlineMath>{"S=241"}</InlineMath>{". Each patch has "}<InlineMath>{"8^2\\cdot3=192"}</InlineMath>{" scalars. The stem parameters are "}<InlineMath>{"192\\cdot64+64+64+241\\cdot64=27,840"}</InlineMath>{". Adding DIST adds one 64-wide token and one 64-wide position, so the subtotal becomes 27,968 and the sequence has 242 tokens. Its head adds further parameters. Treating every RGB scalar as a token or forgetting one special-token parameter gives a different, incorrect count."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Change the image while preserving a token"}</H3>

<Prose>{"Use the two projection features from §1 on a patch "}<code>{"[1,4,2,3]"}</code>{". Calculate the embedding. Find a different patch with the same embedding, then explain why a classifier receiving only this projected patch cannot distinguish those two inputs from that patch alone."}</Prose>

<details><summary>Hint</summary>

<Prose>{"One feature depends on the first-plus-fourth sum. Try adding to one of those entries and subtracting from the other."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The embedding is "}<code>{"[4.5,3]"}</code>{". The patch "}<code>{"[2,4,2,2]"}</code>{" has the same first-plus-fourth sum and unchanged second-minus-third difference, so it gives the same embedding. The difference "}<code>{"[1,0,0,−1]"}</code>{" lies in the projection's nullspace. Later processing cannot reconstruct which input was used if every other input and position is identical. This example shows loss caused by this particular projection; it does not prove every learned patch projection loses the same distinctions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Two steps through shifted rooms"}</H3>

<Prose>{"On an 8×8 token grid, apply 2×2 regular windows, followed by windows shifted by 1 along both axes, with correct boundary masks. Can an original signal at "}<code>{"(1,1)"}</code>{" affect destination "}<code>{"(3,3)"}</code>{" after those two layers? What about a signal at "}<code>{"(2,2)"}</code>{"? For uniform averaging, find the nonzero source coefficients at that destination."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Trace backward from the destination through the *second* layer, then through each selected first-layer state."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The shifted window for "}<code>{"(3,3)"}</code>{" contains rows 3–4 and columns 3–4. Their original regular windows cover rows 2–3 or 4–5, and columns 2–3 or 4–5. The full dependency set is rows 2–5 by columns 2–5. Thus "}<code>{"(1,1)"}</code>{" cannot contribute at this depth, while "}<code>{"(2,2)"}</code>{" can. Each of the 16 source tokens has coefficient 1/16 in the two-layer averaging model. Learned attention and nonlinear processing change the coefficients and response, but do not create an unavailable path. A third layer can extend reach, so the conclusion is depth-specific."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. A teacher makes a different decision"}</H3>

<Prose>{"The true class is 2. A frozen teacher predicts class 0. The student's CLS probabilities are "}<code>{"[0.2,0.5,0.3]"}</code>{", and its DIST probabilities are "}<code>{"[0.6,0.1,0.3]"}</code>{". Compute the half-and-half hard distillation loss. Which head is trained toward which class? Does the teacher need to run when deploying the student?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each cross-entropy selects the probability assigned by its own head to its own target. Class indices are zero-based."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The loss is "}<InlineMath>{"-\\tfrac12\\log0.3-\\tfrac12\\log0.6\\approx0.85740"}</InlineMath>{" nats. CLS is trained toward class 2, DIST toward class 0. The teacher gets no gradient and is unnecessary for the student's deployed forward pass. The two targets conflict for this image; distillation does not make the teacher automatically correct. The final prediction additionally depends on the declared head-fusion rule, which is separate from these two training targets."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Resize positions, preserve identity"}</H3>

<Prose>{"A checkpoint has a 2×4 patch grid, embedding width 3 and two nonspatial prefix positions. You want a 4×4 grid with the same patch size. What are the old and new position-table shapes? Which entries must be kept outside spatial interpolation? Why does resizing this table fail to solve a change from 8×8 patches to 4×4 patches?"}</Prose>

<details><summary>Solution</summary>

<Prose>{"The shapes are "}<code>{"(1,10,3)"}</code>{" and "}<code>{"(1,18,3)"}</code>{": two prefixes plus 8 or 16 patches. Preserve the two prefix entries and interpolate only the 2×4 spatial grid to 4×4. Halving patch size changes the patch projection's input width by a factor of four, as well as changing the number of patches at a fixed image size. Position-table interpolation cannot reshape or train that different projection. Both changes require a specified checkpoint-adaptation method."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A self-distillation gradient"}</H3>

<Prose>{"A teacher has two equal centered logits, hence target "}<code>{"[0.5,0.5]"}</code>{". Student temperature is 0.5 and student logits are "}<code>{"[0,0.5 log3]"}</code>{". Calculate the student probabilities and logit gradient. Does sharpening equal teacher logits make one prototype win? What happens when teacher and student both become uniform for every image?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Dividing the second student logit by 0.5 gives "}<code>{"log3"}</code>{". Apply the gradient formula from §6."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The student probabilities are "}<code>{"[0.25,0.75]"}</code>{". Its logit gradient is "}<code>{"[(0.25−0.5)/0.5,(0.75−0.5)/0.5]=[−0.5,0.5]"}</code>{". Gradient descent raises the first logit and lowers the second. Equal teacher logits remain equal under any positive temperature. If both distributions are uniform for every image, the student gradient is zero even though the representation may be useless. The existence of this stationary case is why agreement is not a sufficient feature-quality test."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Diagnose a weak validation result"}</H3>

<Prose>{"You prepare a pretrained image Transformer for an eight-class task. Training accuracy is high, validation accuracy is close to 12.5%, and the model runs without a shape error. Propose four plausible checks. Each must inspect an actual mechanism; avoid saying that a single symptom proves a particular cause."}</Prose>

<details><summary>Possible solution</summary>

<Prose>{"Check that train and validation use the same class-to-index mapping by inspecting filenames and decoded labels from both loaders. Inspect the actual transformed image tensors and the checkpoint processor configuration for double rescaling, color order, cropping or normalization errors. Check which head/backbone parameters require gradients, which are in the optimizer, and whether they actually change after one step; a frozen random head and a supposedly trained head are different situations. Audit product/writer/source groups, duplicates and split distribution so that validation reflects the intended task rather than an accidental domain or label shift."}</Prose>

<Prose>{"Also inspect the position-table/token shapes at the actual input size and any explicit adaptation code. A missing interpolation usually produces a shape mismatch in a straightforward implementation; do not assume silent zero-padding occurred just because validation is poor. Different train/validation augmentations are normal by design, so a visual difference alone does not prove a bug. The useful diagnostic is whether the difference matches the intended training and evaluation policies."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. A representation experiment for product search"}</H3>

<Prose>{"You have images of repeated product instances from several shops, including crops and near-duplicate photographs. Design a comparison between a simple image baseline and frozen vision features for finding the same product. Specify the split unit, candidates, metric, one visual inspection and a failure you expect. Would a linear classification probe answer exactly the same question?"}</Prose>

<details><summary>Possible solution and criteria</summary>

<Prose>{"Group related captures and product identities deliberately. For generalization to unseen products, split by identity; if testing new captures of known identities, keep the intended identity overlap but separate capture/source groups and declare that different goal. Fit any transforms only on training data, deduplicate across boundaries and define a fixed retrieval gallery containing distractors. Report recall at chosen ranks and the distribution of same-instance versus different-instance similarities, with a policy for queries having no correct gallery item."}</Prose>

<Prose>{"Inspect a mistaken query, its top matches and patch correspondences. Similar packaging or a large shared background can dominate the embedding while a small identifying mark is missed. A classification probe tests labeled decision boundaries on its class set; retrieval tests the ranking among candidate images and does not require a closed label set in the same way. A good answer makes the task and error costs concrete, rather than assuming a high ImageNet score guarantees product identity matching."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Preserve relationships while features move"}</H3>

<Prose>{"Three unit patch features are "}<code>{"[1,0]"}</code>{", "}<code>{"[0,1]"}</code>{", and "}<code>{"[−1,0]"}</code>{". Write their Gram matrix. Rotate all three by 90 degrees. Then instead change only the third feature to "}<code>{"[0,−1]"}</code>{". Which operation preserves the matrix? Calculate the unnormalized squared Frobenius difference for the other."}</Prose>

<details><summary>Solution</summary>

<Prose>{"The original Gram matrix is "}<code>{"[[1,0,−1],[0,1,0],[−1,0,1]]"}</code>{". A common orthogonal rotation preserves every dot product. Changing only the third feature makes its dot products with the first and second become 0 and −1 instead of −1 and 0. Four off-diagonal entries change in magnitude by 1, so the squared Frobenius difference is 4. If an implementation divides by the number of entries or uses a different loss reduction, its scalar will differ by that declared normalization. Gram equality preserves pairwise geometry; it does not force the feature coordinates themselves to be equal."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"A compact capstone"}</H3>

<Prose>{"Use the provided study without changing its frozen test decisions. Read one successful and one failed image through patch extraction, positions, two blocks and the head. Run a new intervention and compare its result with the unchanged input. Explain whether the outcome supports a claim about projection, spatial arrangement, attention reach, or only this model's decision. Then propose a *new, separately evaluated* training experiment justified by the error analysis; do not keep tuning against the already inspected test pool."}</Prose>

<Prose>{"A successful explanation names the actual input, the operation being changed, what remains fixed, the output being measured and a limit. You are ready to continue when you can connect those decisions to the shapes and learning objectives, rather than only recall the four architecture names."}</Prose>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/mixture-of-experts-transformers-moe?module=deep-learning-fundamentals"}>{"Mixture-of-Experts Transformers"}</a>{". It changes which feedforward experts process a token. Keep that separate from Swin's restriction on which tokens exchange information through attention."}</Prose></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"10. References and another way to learn it"}</H2>

<Prose>{"The lesson is self-contained. These resources offer a different explanation, original evidence or a concrete implementation to inspect. The architecture and current implementation distinctions were checked through 5 October 2026. Older papers describe their own experiments rather than a universal model ranking."}</Prose>

<ul><li>{""}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/vision-transformer.html"}>{"Dive into Deep Learning, §11.8: Transformers for Vision"}</a>{": a free, code-oriented route through patch embedding, the encoder, model assembly and training. Its convolutional patch implementation and exercises are particularly useful; the discussion's broad scaling language should be read alongside the conditions in the original experiments."}</li><li>{""}<a href={"https://cs231n.stanford.edu/slides/2025/lecture_8.pdf"}>{"Stanford CS231n Lecture 8 slides, 2025"}</a>{" and "}<a href={"https://www.youtube.com/watch?v=RQowiOF_FvQ"}>{"Stanford Online's accompanying lecture video"}</a>{": another visual explanation for learners who benefit from a spoken progression. Slides 100–109 trace image→patch→projection→attention→pooling. The slides illustrate mean pooling, a useful contrast with CLS; the recording offers a separate spoken route."}</li><li>{""}<a href={"https://arxiv.org/html/2010.11929v2"}>{"Dosovitskiy et al., An Image Is Worth 16×16 Words"}</a>{": original ViT architecture, resolution adaptation, data/compute comparisons and attention analyses. Read §3 before interpreting the particular benchmark protocols in §4."}</li><li>{""}<a href={"https://proceedings.mlr.press/v139/touvron21a/touvron21a.pdf"}>{"Touvron et al., Training Data-Efficient Image Transformers and Distillation Through Attention"}</a>{", with "}<a href={"https://github.com/facebookresearch/deit/blob/main/models.py"}>{"official model code"}</a>{": supervised hard/soft distillation and the second token. Compare the paper's fusion wording with the released forward method, as developed in §5 here."}</li><li>{""}<a href={"https://arxiv.org/html/2103.14030v2"}>{"Liu et al., Swin Transformer"}</a>{": §3 and Figures 2–4 explain the spatial hierarchy and shifted windows. Trace original coordinates through the roll before reading its throughput comparisons."}</li><li><a href="https://arxiv.org/html/2111.09883v2#S3">Swin V2 method</a> and <a href="https://docs.pytorch.org/vision/main/_modules/torchvision/models/swin_transformer.html">official Torchvision implementation</a>: compare residual-post-normalization, cosine scale, continuous relative bias and merge order with the V1 route in §4.</li><li><a href="https://colab.research.google.com/github/gpeyre/ot4ml/blob/main/notebooks/2-sinkhorn.ipynb">Gabriel Peyré’s Sinkhorn notebook</a>: a separate worked route through entropic regularization, diagonal scaling and alternating constraints. Connect its positive-kernel construction with the finite-round prototype balancing in §6.</li><li>{""}<a href={"https://arxiv.org/html/2104.14294v2"}>{"Caron et al., Emerging Properties in Self-Supervised Vision Transformers"}</a>{": DINO's cross-view objective, EMA teacher, centering/sharpening and representation evaluations. Its algorithm and collapse discussion complement the worked gradient here."}</li><li>{""}<a href={"https://arxiv.org/html/2304.07193v2"}>{"Oquab et al., DINOv2"}</a>{": §4–5 explain the combined objectives and implementation, with the evaluation protocol distinguishing a frozen backbone from a trained downstream head."}</li><li>{""}<a href={"https://arxiv.org/html/2309.16588v2"}>{"Darcet et al., Vision Transformers Need Registers"}</a>{" and "}<a href={"https://arxiv.org/html/2508.10104v1"}>{"Siméoni et al., DINOv3"}</a>{": deeper reading about nonspatial tokens, dense-feature behavior and relational regularization. DINOv3 §3.2 and §4.2–4.3 develop its architecture and relational objective; its full training and deployment are beyond this lesson's small experiment."}</li><li>{""}<a href={"https://huggingface.co/docs/timm/quickstart"}>{"timm quickstart"}</a>{", "}<a href={"https://huggingface.co/docs/transformers/model_doc/dinov2"}>{"Transformers DINOv2 interface"}</a>{", and "}<a href={"https://github.com/facebookresearch/dinov3"}>{"official DINOv3 repository"}</a>{": use the interface and preprocessing for the actual checkpoint. DINOv3's access/license terms differ from DINOv2's; inspect the version you intend to use."}</li><li>{""}<a href={"https://doi.org/10.24432/C50P49"}>{"UCI Optical Recognition of Handwritten Digits"}</a>{": E. Alpaydin and C. Kaynak, 1998, CC BY 4.0. The supplied files and the "}<a href={"/learn-code/vision-transformers-vit-deit-swin-dinov2/provenance.md"}>{"provenance record"}</a>{" make our numerical study available offline."}</li></ul></section>
 </VisionLessonProvider></div>,
};
