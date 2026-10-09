// Dropout, DropPath & Stochastic Depth. Edited directly since the reading-flow revision:
// each section runs question → lead → figure → walk-through → equation → code → changed case.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { DropBlockFootprintFigure, DropConnectTopologyFigure, LocalNoiseFigure } from '../../components/lesson-labs/DropoutNoiseIntuition.jsx';
import { DropoutExpectationLab, DropoutGeometryLab, DropoutBranchLab, DropoutDepthLab, DropoutModeLab, DropoutMeasuredLab, DropoutMonteCarloLab, DropoutProgram, DigitSpecimensFigure } from '../../components/lesson-labs/DropoutLabs.jsx';
import { DropoutNetworkLab, DropoutGradientLab, ThinnedNetworksFigure, ReluForkFigure, VarianceShiftFigure, MonteCarloPassesFigure } from '../../components/lesson-labs/DropoutStructureFigures.jsx';

const perceptronsWiring = '/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#neuron-network-wiring';
const residualLesson = '/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals';

export default {
  title: 'Dropout, DropPath & Stochastic Depth',
  readTime: '~65 min read + experiments and practice',
  hasIntegratedGuide: true,
  content: () => <div className="neural-lesson dropout-lesson lesson-flow">
    <LessonIntro prerequisites="Activations, multiplication, means and a loss gradient. The previous residual-connections lesson explains the direct and correction paths; mask probabilities and tensor axes are introduced here." sections={[["learn-with-some-information-temporarily-missing","Learn with some information temporarily missing"],["1-a-mask-changes-values-then-changes-an-update","1. A mask changes values, then changes an update"],["2-why-divide-by-the-keep-probability","2. Why divide by the keep probability?"],["3-what-gets-hidden-geometry-matters","3. What gets hidden? Geometry matters"],["4-drop-the-correction-while-keeping-the-direct-path","4. Drop the correction while keeping the direct path"],["5-modes-state-and-a-normalization-trap","5. Modes, state and a normalization trap"],["use-the-mask-contract-in-a-library-without-changing-its-meaning","Use the mask contract in a library without changing its meaning"],["6-a-complete-experiment-does-masking-help-these-digits","6. A complete experiment: does masking help these digits?"],["7-optional-several-predictions-from-one-dropout-model","7. Optional: several predictions from one dropout model"],["8-optional-choose-a-noise-pattern-for-a-reason","8. Optional: choose a noise pattern for a reason"],["9-practice-with-changed-inputs","9. Practice with changed inputs"],["10-continue-and-read-another-explanation","10. Continue and read another explanation"]]}>Follow a mask through values, gradients, network geometry and real training evidence.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Every drawing that responds already shows its current result. Choose a mask or a mode in the row under a drawing, or select a cell or block to flip its random bit; the drawing, the numbers and the sentence beneath it change together. Nothing asks you to type a guess."}</Prose>

<H2>{"Learn with some information temporarily missing"}</H2>

<Prose>{"Imagine recognizing a handwritten 8. A model might use its upper loop, lower loop, central narrowing and stroke locations. If training makes one combination indispensable, the model may struggle when a new handwriting style changes part of that combination. One possible training intervention is to randomly hide some intermediate values and still ask for the correct digit."}</Prose>

<Prose>{"Srivastava and colleagues called that fragile reliance "}<strong>{"co-adaptation"}</strong>{": hidden units that are only useful in the presence of particular other units. "}<strong>{"Dropout"}</strong>{" discourages it by temporary hiding. The values return on another pass; parameters are not permanently deleted. "}<strong>{"DropPath"}</strong>{", commonly used for a form of "}<strong>{"stochastic depth"}</strong>{", hides an entire learned correction in a residual block. Both modify the training problem, so their usefulness must be checked on examples excluded from fitting."}</Prose>

<Prose>{"The "}<a href={residualLesson}>{"previous lesson on residual connections"}</a>{" showed that a direct path can preserve a representation while another path changes it. Here we ask what happens when values, and later whole corrections, are sometimes absent."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the masked network and its two-value example, mask geometry, residual branch calculation, train/evaluation mode distinction and real digit comparison; then try practice 1–5. Monte Carlo uncertainty and specialized noise families are optional deeper branches. You need multiplication, averages, a loss and its gradient; these are refreshed where used."}</Prose>

<H2>{"1. A mask changes values, then changes an update"}</H2>

<Prose>{"Start with where the hiding happens. Below is the kind of network you built in the "}<a href={perceptronsWiring}>{"Perceptrons lesson"}</a>{": two inputs, two hidden ReLU units and one output. Dropout adds a single new part, a "}<strong>{"mask gate"}</strong>{" between each hidden unit and the weight that carries its value onward."}</Prose>

<DropoutNetworkLab />

<Prose>{"Follow the arrows from the inputs. The cyan circles are the inputs "}<InlineMath>{"x=(1,1)"}</InlineMath>{". Each amber label is the weight on its arrow, exactly as in the Perceptrons lesson: the arrows into "}<InlineMath>{"h_1"}</InlineMath>{" carry weights 1 and 0, the arrows into "}<InlineMath>{"h_2"}</InlineMath>{" carry 1 and 1. The violet hidden units add their weighted inputs and apply ReLU, so "}<InlineMath>{"h_1=1"}</InlineMath>{" and "}<InlineMath>{"h_2=2"}</InlineMath>{", written "}<InlineMath>{"h=[1,2]"}</InlineMath>{"."}</Prose>

<Prose>{"The white boxes are the mask gates. Each holds one random "}<strong>{"bit"}</strong>{", labelled "}<InlineMath>{"m_1"}</InlineMath>{" and "}<InlineMath>{"m_2"}</InlineMath>{": 1 keeps the value, 0 replaces it with 0 for this one forward pass. Together the bits form the mask "}<InlineMath>{"m"}</InlineMath>{", and the values leaving the gates are written "}<InlineMath>{"\\widetilde h"}</InlineMath>{". With the mask "}<InlineMath>{"m=[1,0]"}</InlineMath>{", the first gate keeps "}<InlineMath>{"h_1"}</InlineMath>{" and the second drops "}<InlineMath>{"h_2"}</InlineMath>{": that unit is dashed and marked ×, and the arrow after its gate is dashed because it carries 0. The kept value leaves its gate doubled; §2 explains why. The weights are untouched: only the values passing through change."}</Prose>

<Prose>{"Now choose Evaluation. The gates stop being random: nothing is dropped and nothing is doubled, so the full network runs. Back in Training, try the other three masks; each routes a different subset of the hidden values to the output. The same gates can also sit on the inputs, usually with a much smaller drop probability: Srivastava et al. found the best input retention probability closer to 1 than to 0.5. A deeper network can have gates after every hidden layer. We keep one gated layer so every value stays visible."}</Prose>

<Prose>{"Write out the output step of that network. The hidden representation is "}<InlineMath>{"h=[1,2]"}</InlineMath>{", and the two amber weights on the arrows into ŷ are "}<InlineMath>{"w=[1,-0.5]"}</InlineMath>{". With no mask,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\hat y=w^\\top h=1(1)-0.5(2)=0."}</MathBlock></div>

<Prose>{"Let the target be 1. We use half-squared error "}<InlineMath>{"L=\\tfrac12(\\hat y-1)^2"}</InlineMath>{", so the unmasked loss is 0.5."}</Prose>

<Prose>{"Now name the gate's randomness. The "}<strong>{"drop probability"}</strong>{" "}<InlineMath>{"p"}</InlineMath>{" is the chance a gate's bit is 0; here "}<InlineMath>{"p=0.5"}</InlineMath>{". The "}<strong>{"keep probability"}</strong>{" is "}<InlineMath>{"q=1-p=0.5"}</InlineMath>{". Each gate draws its bit independently, like a biased coin: 1 with probability q, 0 with probability p. Such a bit is a "}<strong>{"Bernoulli random variable"}</strong>{". The vector of bits, one per hidden unit, is the "}<strong>{"mask"}</strong>{" "}<InlineMath>{"m"}</InlineMath>{"."}</Prose>

<Prose>{"Modern "}<strong>{"inverted dropout"}</strong>{" multiplies each value by its bit and divides survivors by the keep probability. That is the “× 2” written in each keeping gate:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widetilde h=\\frac{m\\odot h}{q}=[2,0],\\qquad\n\\hat y=w^\\top\\widetilde h=2."}</MathBlock></div>

<Prose>{"The symbol "}<InlineMath>{"\\odot"}</InlineMath>{" means coordinate-by-coordinate multiplication. The output moved from 0 to 2; it did not become the target. The sampled loss is again 0.5, now with error in the opposite direction. These are the numbers in the sentence under the drawing for mask [1, 0]."}</Prose>

<Prose>{"Training then asks how to change each weight. As in the "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals"}>{"Backpropagation lesson"}</a>{", "}<InlineMath>{"\\partial L/\\partial w_j"}</InlineMath>{" is the gradient: how fast the loss changes per small change in "}<InlineMath>{"w_j"}</InlineMath>{", with everything else, including this mask, held fixed. Here is the same network again, with each arrow now labelled in orange by its weight's gradient from this one example."}</Prose>

<DropoutGradientLab />

<Prose>{"With mask [1, 0], "}<InlineMath>{"\\partial L/\\partial\\hat y=\\hat y-1=1"}</InlineMath>{", and each output weight's gradient is that 1 times the value arriving on its arrow: 2 from the first gate and 0 from the second. The arrow out of the dropped unit carries gradient 0, and so do both arrows "}<em>{"into"}</em>{" it, because the backward signal reaching "}<InlineMath>{"h_2"}</InlineMath>{" is multiplied by the same zero bit. The kept unit's incoming weights receive gradient 2 each. In symbols:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial w}\n=(\\hat y-1)\\widetilde h=[2,0],\n\\qquad\n\\frac{\\partial L}{\\partial h}\n=(\\hat y-1)w\\odot m/q=[2,0]."}</MathBlock></div>

<Prose>{"A gradient-descent step of size 0.1 on the output weights gives "}<InlineMath>{"w_{\\mathrm{new}}=[0.8,-0.5]"}</InlineMath>{". With this same mask, the new output is 1.6 and the loss is 0.18, as the readout says."}</Prose>

<Prose>{"A zero gradient for the dropped unit's weights from this example is not a promise that those weights never change: other examples, other paths, momentum or weight decay can still contribute. A fresh mask belongs to the next forward pass. Backpropagation must use the mask from the forward computation it differentiates."}</Prose>

<Prose>{""}<strong>{"Try a different mask:"}</strong>{" choose [0, 1] in the gradient drawing. The masked representation becomes "}<InlineMath>{"[0,4]"}</InlineMath>{", output −2, error −3 and output-weight gradient "}<InlineMath>{"[0,-12]"}</InlineMath>{": now the weights around "}<InlineMath>{"h_2"}</InlineMath>{" learn and those around "}<InlineMath>{"h_1"}</InlineMath>{" rest. The two masks train different dependencies of the same model."}</Prose>

<H2>{"2. Why divide by the keep probability?"}</H2>

<Prose>{"Dropping values makes the next layer's input smaller on average. With half the units gone, the output unit would receive roughly half its usual total during training, then the full total at evaluation. Dividing survivors by q repairs that mismatch. To see why, list every network that training might sample. With two hidden units there are only four masks:"}</Prose>

<ThinnedNetworksFigure />

<Prose>{"Each panel keeps only the hidden units and output of the §1 drawing. Mask [0, 0] drops both units and ŷ = 0. Mask [0, 1] keeps only "}<InlineMath>{"h_2"}</InlineMath>{", doubled to 4, so ŷ = −0.5 · 4 = −2. Mask [1, 0] keeps "}<InlineMath>{"h_1"}</InlineMath>{", doubled to 2, so ŷ = 2. Mask [1, 1] keeps both, "}<InlineMath>{"\\widetilde h=[2,4]"}</InlineMath>{" and ŷ = 2 − 2 = 0. With p = 0.5 each mask has probability 0.25. Average the four "}<InlineMath>{"\\widetilde h"}</InlineMath>{" vectors with those weights: (0 + 0 + 2 + 2)/4 = 1 and (0 + 4 + 0 + 4)/4 = 2. The average is [1, 2], exactly the unmasked h."}</Prose>

<Prose>{"The same holds for any value and any keep probability. The notation "}<InlineMath>{"\\mathbb E[\\cdot\\mid h_i]"}</InlineMath>{" means the average over many random bits while "}<InlineMath>{"h_i"}</InlineMath>{" itself is held fixed. A kept value "}<InlineMath>{"h_i/q"}</InlineMath>{" occurs with probability q and a zero with probability p, so"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[\\widetilde h_i\\mid h_i]\n=q(h_i/q)+p(0)=h_i."}</MathBlock></div>

<Prose>{"The expectation is an average over repeated masks, not a statement about any one pass. Individual passes scatter around it. The coordinate variances of the four outcomes above are "}<InlineMath>{"[1,4]"}</InlineMath>{": the first coordinate is 0 or 2 with equal chance, so it sits 1 away from its mean of 1 every time. The general formula follows from the same two outcomes. The mean square is "}<InlineMath>{"\\mathbb E[\\widetilde h_i^2]=q(h_i/q)^2=h_i^2/q"}</InlineMath>{", and variance is mean square minus squared mean:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Var}(\\widetilde h_i\\mid h_i)=\\frac{h_i^2}{q}-h_i^2=\\frac{p}{1-p}h_i^2."}</MathBlock></div>

<Prose>{"The next drawing lists the same four outcomes for any drop probability. Move p and watch the probabilities and the surviving values change together, then switch the survivor rule."}</Prose>

<DropoutExpectationLab />

<Prose>{"At "}<InlineMath>{"p=0.25"}</InlineMath>{", the four probabilities are "}<InlineMath>{"0.0625,0.1875,0.1875,0.5625"}</InlineMath>{", in the same order as the panels. They are not uniform. The mean stays "}<InlineMath>{"[1,2]"}</InlineMath>{", while the variances become "}<InlineMath>{"[1/3,4/3]"}</InlineMath>{". Increasing "}<InlineMath>{"p"}</InlineMath>{" changes both how often information disappears and the amplitude of surviving values. Now choose “multiplied by q”: at p = 0.25 survivors become × 0.75 instead of × 4/3, and the average shrinks to [0.5625, 1.125]. That is the bug practice 1 asks you to repair."}</Prose>

<Prose>{"At ordinary evaluation, inverted dropout returns "}<InlineMath>{"h"}</InlineMath>{" directly. It applies neither a random mask nor an extra keep-probability multiplier. Historical implementations instead left training survivors unscaled and multiplied by "}<InlineMath>{"q"}</InlineMath>{" at evaluation. Figure 2 of the original paper draws exactly that: a unit present with probability p during training, and at test time always present with its outgoing weights multiplied by p. Their p is a keep probability, our q. Both conventions need internally consistent initialization and training scale; mixing their evaluation rules is an error. See the explicit current "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Dropout.html"}>{"PyTorch Dropout contract"}</a>{"."}</Prose>

<Prose>{"At "}<InlineMath>{"p=0"}</InlineMath>{", training also becomes identity. At "}<InlineMath>{"p=1"}</InlineMath>{", division by zero is invalid; the supplied implementation explicitly returns zeros during training and identity during evaluation. The expectation-preservation formula applies to "}<InlineMath>{"p<1"}</InlineMath>{"."}</Prose>

<H3>{"Preserved means do not imply an unchanged network"}</H3>

<Prose>{"The average survived because the output so far is a weighted sum. Put a nonlinearity after the mask and the average can change. Keep the four masks and p = 0.5, but let the two values be signed contributions "}<InlineMath>{"[1,-1]"}</InlineMath>{" that are summed and then passed through ReLU:"}</Prose>

<ReluForkFigure />

<Prose>{"Unmasked, the result is "}<InlineMath>{"\\max(0,1-1)=0"}</InlineMath>{". Across the four equally likely masks, the results are "}<InlineMath>{"0,0,2,0"}</InlineMath>{", whose mean is 0.5. The masked sums still average to 0; ReLU clips the negative one to 0 and leaves the positive one, so the average after clipping is not the clipped average. Writing "}<InlineMath>{"Z"}</InlineMath>{" for the masked sum:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[\\operatorname{ReLU}(Z)]\\ne\n\\operatorname{ReLU}(\\mathbb E[Z])."}</MathBlock></div>

<Prose>{"Even when a linear output preserves its mean, its expected loss can change: the four §1 masks give losses 0.5, 4.5, 0.5 and 0.5, averaging 1.5, against the unmasked 0.5. This is why the four thinned networks are often described as “an ensemble of thinned networks”. The description is apt in one way: training really does fit many sub-networks, and they all share one set of weights. Two things it does not mean: the sub-networks were never trained independently, and one evaluation pass through the full network averages their nonlinear outputs only approximately. The ReLU example above is exactly a case where that approximation differs."}</Prose>

<Prose>{"For a whole dataset, write "}<InlineMath>{"f_\\theta(x_i;m)"}</InlineMath>{" for the network's output on example "}<InlineMath>{"x_i"}</InlineMath>{" when its weights are "}<InlineMath>{"\\theta"}</InlineMath>{" and its gates hold mask "}<InlineMath>{"m"}</InlineMath>{". "}<InlineMath>{"\\mathbb E_m"}</InlineMath>{" averages over masks, as the four panels did. The training objective is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\min_\\theta\\frac1N\\sum_{i=1}^N\n\\mathbb E_m[\\ell(f_\\theta(x_i;m),y_i)]."}</MathBlock></div>

<Prose>{"Each sampled update estimates this noisy objective. The goal is to learn useful predictions under that perturbation, not to make each hidden unit a complete classifier. Overfitting means fitting sample-specific patterns that generalize poorly; it does not require a gap that widens forever, and parameter count alone does not diagnose it."}</Prose>

<H2>{"3. What gets hidden? Geometry matters"}</H2>

<Prose>{"So far each gate covered one hidden value. In image and sequence models a hidden layer holds many values arranged along several axes, and we must decide which values share one gate. A "}<strong>{"tensor"}</strong>{" is an array with named axes. For a batch of image representations shaped "}<InlineMath>{"[N,C,H,W]"}</InlineMath>{", "}<InlineMath>{"N"}</InlineMath>{" indexes examples, "}<InlineMath>{"C"}</InlineMath>{" feature channels, and "}<InlineMath>{"H,W"}</InlineMath>{" spatial positions. A "}<strong>{"channel"}</strong>{" is one feature map: a grid of values that responds to one learned pattern across the image. The next lesson, Convolution, explains how those maps are built; here we only need their arrangement. The drawing holds two examples, each with two channels of "}<InlineMath>{"2\\times2"}</InlineMath>{" values, filled with 1–16 in order."}</Prose>

<DropoutGeometryLab />

<Prose>{"Each cell shows its input → output and the number of the bit it uses. In the opening state one bit covers a whole channel. Example 1 keeps channel 1 and drops channel 2; example 2 drops channel 1 and keeps channel 2. With "}<InlineMath>{"p=0.5"}</InlineMath>{" the surviving maps contain "}<InlineMath>{"[[2,4],[6,8]]"}</InlineMath>{" and "}<InlineMath>{"[[26,28],[30,32]]"}</InlineMath>{", and the other two maps are entirely zero. Choose “Example”: both maps of an example now rise or fall together. Every bit starts at 1; select a cell of example 2 to drop its bit, and the mask "}<InlineMath>{"[1,0]"}</InlineMath>{" keeps both maps of example 1 and drops both of example 2. Choose “Element”: every value draws its own bit."}</Prose>

<Prose>{"The mask's shape names this choice. Dimensions of size 1 are "}<strong>{"broadcast"}</strong>{": the same bit is repeated along that axis."}</Prose>

<NeuralTable caption={"Mask shape for each masking scope on an [N, C, H, W] tensor"} headers={[<>{"Operation"}</>,<>{"Independent mask shape"}</>,<>{"What disappears together"}</>]} rows={[[<>{"Element dropout"}</>,<>{"[N,C,H,W]"}</>,<>{"One activation value"}</>],[<>{"Channel dropout"}</>,<>{"[N,C,1,1]"}</>,<>{"A whole feature map for one example"}</>],[<>{"Per-example dropout"}</>,<>{"[N,1,1,1]"}</>,<>{"Everything in one example (§4 uses this for a residual correction)"}</>],[<>{"Batchwise dropout"}</>,<>{"[1,1,1,1]"}</>,<>{"Everything in the batch at once"}</>]]} />

<Prose>{"This small shape choice defines the intervention. On a sequence shaped "}<InlineMath>{"[N,T,D]"}</InlineMath>{" (examples, time steps, features), a branch mask "}<InlineMath>{"[N,1,1]"}</InlineMath>{" is shared across tokens and features for an example. An element mask "}<InlineMath>{"[N,T,D]"}</InlineMath>{" makes separate decisions. Neither shape can be inferred from the word “dropout” alone."}</Prose>

<Prose>{""}<strong>{"Build the intervention:"}</strong>{" make an entire second channel disappear for example 1 while preserving its first channel and all channels of example 2. Choose what one bit covers, then select cells to flip their bits. Check that no spatial position inside a channel contradicts another."}</Prose>

<Prose>{"The difference is more than appearance. For fixed values "}<InlineMath>{"[1,2]"}</InlineMath>{" and "}<InlineMath>{"p=0.5"}</InlineMath>{", independent masks give covariance 0; one shared mask gives covariance 2. With a shared bit, both outputs equal "}<InlineMath>{"(m/q)\\,[1,2]"}</InlineMath>{": both large or both zero together. Since "}<InlineMath>{"m/q"}</InlineMath>{" is 0 or 2 with equal chance, its variance is 1, and the covariance is "}<InlineMath>{"1\\cdot2\\cdot1=2"}</InlineMath>{". Shared masking makes values move together. Spatial neighbors can carry redundant evidence, so removing isolated values may leave that evidence nearby. Channel or contiguous-region masking can challenge a different dependency. This motivates comparison, not a rule that element dropout after convolution is always useless. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Dropout2d.html"}>{"PyTorch Dropout2d"}</a>{" explicitly defines the channel operation; use a four-dimensional batched input here because its three-dimensional interpretation has a version-specific warning."}</Prose>

<H2>{"4. Drop the correction while keeping the direct path"}</H2>

<Prose>{"Recall the "}<a href={residualLesson + '#residual-block-anatomy'}>{"residual block"}</a>{" from the previous lesson. Its input "}<InlineMath>{"x"}</InlineMath>{" travels along two routes. The "}<strong>{"skip"}</strong>{" copies it unchanged; the "}<strong>{"branch"}</strong>{" passes it through some layers "}<InlineMath>{"F"}</InlineMath>{" that compute a learned correction. The two routes meet at an addition: "}<InlineMath>{"y=x+F(x)"}</InlineMath>{". DropPath puts one mask gate on the branch, just before the addition, and none on the skip. Here is that block with "}<InlineMath>{"x=[2,-1]"}</InlineMath>{", "}<InlineMath>{"F(x)=[0.5,1]"}</InlineMath>{" and "}<InlineMath>{"q=0.5"}</InlineMath>{":"}</Prose>

<DropoutBranchLab />

<Prose>{"Follow the arrows from the cyan circle x. The grey path that bypasses the branch is the skip, which copies x straight to the addition; the white box is the branch F, and the gate after it multiplies F(x) by m/q. With bit 0 the branch arrows go dashed and the block passes "}<InlineMath>{"x=[2,-1]"}</InlineMath>{" through untouched. With bit 1 the doubled correction [1, 2] is added and y = [3, 1]. Averaged over the two equally likely bits, y = [2.5, 0], the unmasked x + F(x) for this fixed input. In symbols, with inverted scaling,"}</Prose>

<div className="neural-equation"><MathBlock>{"y=x+\\frac{m}{q}F(x)."}</MathBlock></div>

<Prose>{"Now move the gate after the addition, masking the "}<strong>{"whole sum"}</strong>{". A dropped pass gives "}<InlineMath>{"[0,0]"}</InlineMath>{", removing the direct path too; a kept pass doubles the whole sum, skip included, giving [5, 0]. It is a different architecture."}</Prose>

<Prose>{"For a sampled branch bit, the local derivative is "}<InlineMath>{"I+(m/q)J_F"}</InlineMath>{". Here "}<InlineMath>{"I"}</InlineMath>{" is the identity, the skip passing each small input change straight through, and "}<InlineMath>{"J_F"}</InlineMath>{" describes how the correction changes with input. A dropped correction leaves only "}<InlineMath>{"I"}</InlineMath>{". A surviving correction can still cancel, shrink or amplify the total derivative, as the preceding residual lesson demonstrated. The preserved path is useful, not an unconditional gradient guarantee."}</Prose>

<Prose>{"Terminology varies. Modern libraries commonly call per-example residual-branch masking "}<strong>{"DropPath"}</strong>{", and also call it stochastic depth. Torchvision's "}<a href={"https://docs.pytorch.org/vision/main/_modules/torchvision/ops/stochastic_depth.html"}>{"stochastic-depth implementation"}</a>{" supports both row and batch modes. The "}<a href={"https://raw.githubusercontent.com/huggingface/pytorch-image-models/main/timm/layers/drop.py"}>{"timm implementation"}</a>{" uses one bit per example and has a keep-scaling option. Read the mask and scaling contract instead of assuming two names imply two incompatible algorithms."}</Prose>

<H3>{"Expected active branches are not measured runtime"}</H3>

<Prose>{"A real network stacks many such blocks, as in the previous lesson's "}<a href={residualLesson + '#residual-stack'}>{"stack of residual blocks"}</a>{". Put four of them in a row, each with its own skip and its own gated branch. On one training pass some branches are switched off and the signal takes only their skips, so the network the example sees is effectively shallower. That is why the method is called "}<strong>{"stochastic depth"}</strong>{"."}</Prose>

<Prose>{"Three quantities describe such a stack. Number the blocks "}<InlineMath>{"l=1,\\ldots,L"}</InlineMath>{"; here "}<InlineMath>{"L"}</InlineMath>{" counts blocks, not the loss of §1. Block "}<InlineMath>{"l"}</InlineMath>{" has its own drop rate "}<InlineMath>{"p_l"}</InlineMath>{". Write "}<InlineMath>{"A"}</InlineMath>{" for the number of blocks whose branch is active on one pass. Each block is active with probability "}<InlineMath>{"1-p_l"}</InlineMath>{", and the average of a sum is the sum of the averages, so the expected active count is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[A]=\\sum_{l=1}^L(1-p_l)."}</MathBlock></div>

<Prose>{"The rates usually rise with depth according to a "}<strong>{"schedule"}</strong>{" set by the last block's rate "}<InlineMath>{"p_{\\max}"}</InlineMath>{". The original stochastic-depth schedule is "}<InlineMath>{"p_l=p_{\\max}l/L"}</InlineMath>{"; a common "}<strong>{"zero-first"}</strong>{" variant spaces the rates evenly from 0 for the first block to "}<InlineMath>{"p_{\\max}"}</InlineMath>{" for the last, so the first block is never dropped. The drawing below has four blocks and adds up E[A] for whichever schedule you choose. It also counts the work: if the code computes every branch "}<InlineMath>{"F(x)"}</InlineMath>{" and only then multiplies by the bit, every branch function runs; if it checks the bit first, dropped branches are never called."}</Prose>

<DropoutDepthLab />

<Prose>{"Follow the chain from "}<InlineMath>{"H_0"}</InlineMath>{", the input to the first block. An active block adds its correction; a dropped block, dashed and marked ×, passes only its skip. Each block shows its own drop rate. With the opening bits, blocks 1 and 3 are active, so this example sees a network two blocks deep. Select a block to flip its bit, or move "}<InlineMath>{"p_{\\max}"}</InlineMath>{" and watch every rate follow the schedule."}</Prose>

<Prose>{"The original schedule, in our drop-probability notation "}<InlineMath>{"p_l=p_{\\max}l/L"}</InlineMath>{", drops deeper blocks more often, while the input "}<InlineMath>{"H_0"}</InlineMath>{" always passes. Because "}<InlineMath>{"1+2+\\cdots+L=L(L+1)/2"}</InlineMath>{", the total drop probability is "}<InlineMath>{"p_{\\max}(L+1)/2"}</InlineMath>{", and"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[A]=L-p_{\\max}(L+1)/2."}</MathBlock></div>

<Prose>{"Four blocks with "}<InlineMath>{"p_{\\max}=0.5"}</InlineMath>{" have rates "}<InlineMath>{"[0.125,0.25,0.375,0.5]"}</InlineMath>{", giving 2.75 expected active blocks, as the drawing reports. Switch to the zero-first schedule "}<InlineMath>{"[0,1/6,1/3,1/2]"}</InlineMath>{" and the expectation becomes 3; its first block, with rate 0, can never be dropped. These are different conventions, both explicit. For a one-block zero-first schedule, our code uses "}<InlineMath>{"[0]"}</InlineMath>{" rather than dividing by "}<InlineMath>{"L-1=0"}</InlineMath>{"."}</Prose>

<Prose>{"Also count "}<strong>{"blocks"}</strong>{", not every layer within them. Huang et al.'s 110-layer example has 54 residual blocks. Their original convention used unscaled surviving branches in training and survival-scaled branches in evaluation. Their speed results involved actually bypassing computation. "}<a href={"https://arxiv.org/pdf/1603.09382"}>{"Deep Networks with Stochastic Depth, §3"}</a>{"."}</Prose>

<Prose>{"The drawing's readout counts work two ways for a reason. If the code computes "}<code>{"F(x)"}</code>{" and then multiplies by the bit, Python has already evaluated "}<code>{"F(x)"}</code>{". Multiplication by zero cannot undo that work. Batchwise conditional execution can avoid a branch if the decision comes first; per-example skipping may need gathering, scattering and different batch-statistic treatment. Unequal block costs, random generation, memory traffic and hardware scheduling also matter. Expected active depth is a structural quantity, not a speedup benchmark."}</Prose>

<H2>{"5. Modes, state and a normalization trap"}</H2>

<Prose>{"So far a switch called “mode” decided whether the gates were random. In PyTorch that switch is "}<code>{"model.train()"}</code>{", which enables modules' training behavior, and "}<code>{"model.eval()"}</code>{", which selects evaluation behavior. A separate switch, "}<code>{"torch.no_grad()"}</code>{", controls whether gradients are recorded. It does "}<strong>{"not"}</strong>{" turn dropout off or stop BatchNorm running-statistic updates."}</Prose>

<Prose>{"Ordinary validation uses both evaluation behavior and no gradient recording. The complete experiment calls these explicitly before measuring either training or validation rows. Measuring training data with dropout enabled and validation data with it disabled mixes two forward procedures and can create a misleading “generalization gap.”"}</Prose>

<Prose>{"Modes matter most when dropout feeds a layer that keeps state. Recall from the "}<a href={"/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals"}>{"Normalization lesson"}</a>{" that BatchNorm subtracts a mean and divides by a standard deviation. In training it uses the current batch's statistics and also updates stored running estimates; in evaluation it uses only those stored estimates. The figure puts a dropout gate directly in front of it and follows one activation "}<InlineMath>{"X"}</InlineMath>{", equally likely to be 1 or 3, through both modes."}</Prose>

<VarianceShiftFigure />

<Prose>{"In the Training chain, BatchNorm sees the masked "}<InlineMath>{"\\widetilde X"}</InlineMath>{" rather than X. Its mean is still 2, but its spread grew. With independent inverted dropout at "}<InlineMath>{"q=0.5"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathbb E[\\widetilde X^2]=\\mathbb E[X^2]/q=5/0.5=10,\n\\quad \\operatorname{Var}(\\widetilde X)=10-2^2=6."}</MathBlock></div>

<Prose>{"So BatchNorm learns statistics of this noisier distribution. In the Evaluation chain, dropout is off and the clean X arrives with variance 1, yet BatchNorm still divides by the stored noisy spread, so the outputs come out narrower than the ±1 the clean values' own statistics would give. The mean was preserved; the variance was not. That is the variance-shift mechanism studied by "}<a href={"https://arxiv.org/abs/1801.05134"}>{"Li et al."}</a>{", whose Figure 1 draws the same train/test contrast."}</Prose>

<Prose>{"The next drawing runs that chain on one batch. Activations "}<InlineMath>{"X=[1,1,3,3]"}</InlineMath>{" with keep bits "}<InlineMath>{"[0,1,0,1]"}</InlineMath>{" become "}<InlineMath>{"\\widetilde X=[0,2,0,6]"}</InlineMath>{", which then passes through BatchNorm with momentum 1, ε = 10⁻⁵ and no learned scale or shift. The keep bits are one fixed draw, so every situation uses the same mask. Choose a situation and follow what reaches BatchNorm, what it divides by, and whether it writes its stored buffers."}</Prose>

<DropoutModeLab />

<Prose>{"In the training pass the batch variance uses divisor 4, giving 6; the stored running variance is the unbiased estimate with divisor 3, giving 8. Do not confuse population variance 6 with the stored finite-batch estimate 8. Evaluation then maps the clean inputs 1 and 3 to approximately "}<InlineMath>{"-0.353553"}</InlineMath>{" and "}<InlineMath>{"0.353553"}</InlineMath>{". Training inside "}<code>{"no_grad()"}</code>{" gives the same numbers and still writes the buffers, which is the trap in practice 4."}</Prose>

<Prose>{"Placing masking after a particular BatchNorm avoids directly masking that layer's input, but later normalization layers may still see altered distributions. LayerNorm and GroupNorm do not have the same running-statistic mismatch, yet they are not immune to masking. LayerNorm of "}<InlineMath>{"[1,3]"}</InlineMath>{" is approximately "}<InlineMath>{"[-1,1]"}</InlineMath>{"; after the mask produces "}<InlineMath>{"[2,0]"}</InlineMath>{", it is approximately "}<InlineMath>{"[1,-1]"}</InlineMath>{". The representation reversed."}</Prose>

<Prose>{"Our state probe verifies that "}<code>{"no_grad()"}</code>{" in training still increments a BatchNorm counter. For functional calls, pass "}<code>{"training=self.training"}</code>{" during ordinary operation; a hardcoded "}<code>{"True"}</code>{" deliberately ignores "}<code>{"eval()"}</code>{"."}</Prose>

<H2>{"Use the mask contract in a library without changing its meaning"}</H2>

<Prose>{"Everything so far fits in one function. Read "}<code>{"mask_values"}</code>{" in "}<a href={"/learn-assets/dropout-droppath-stochastic-depth/dropout-experiments.py"}>{"the complete program"}</a>{" before the model. It is the mask gate from §1, written once for a tensor of any shape: choose the broadcast shape from §3, draw Bernoulli bits once, multiply, divide by keep probability, and bypass sampling in evaluation. Its array work is O(number of activation values); the random mask contains only as many independent entries as its chosen shape. "}<code>{"fixtures"}</code>{" keeps masks fixed for forward/backward arithmetic, while "}<code>{"DigitModel"}</code>{" shows ordinary "}<code>{"nn.Dropout"}</code>{" training."}</Prose>

<DropoutProgram title="Read the scratch mask and its axis contract" start="def mask_values" end="def fixtures" />

<Prose>{"The usual library interfaces for the four scopes of §3 are:"}</Prose>

<CodeBlock language={"python"}>{"import torch\nfrom torch import nn\nfrom torchvision.ops import stochastic_depth\n\ntorch.manual_seed(9)\nfeatures = torch.arange(1., 17.).reshape(2, 2, 2, 2)\nelement = nn.Dropout(p=0.25)\nchannel = nn.Dropout2d(p=0.25)\nprint(element(features).shape, channel(features).shape)\nfor mode in (\"row\", \"batch\"):\n    branch = stochastic_depth(features, p=0.25, mode=mode, training=True)\n    print(mode, branch)\n    torch.testing.assert_close(\n        stochastic_depth(features, p=0.25, mode=mode, training=False), features)\nelement.eval()\nchannel.eval()\ntorch.testing.assert_close(element(features), features)\ntorch.testing.assert_close(channel(features), features)"}</CodeBlock>

<Prose>{"This standalone code needs compatible PyTorch/Torchvision versions. It requests the same mask geometry as the scratch implementation; its random draws differ. In "}<code>{"stochastic_depth"}</code>{", row means one bit per batch member, even when each member contains many tokens or pixels; batch means one bit for the entire supplied tensor. Both mask the supplied "}<strong>{"correction"}</strong>{", so the caller still adds the untouched residual input. The "}<a href={"https://docs.pytorch.org/vision/main/_modules/torchvision/ops/stochastic_depth.html"}>{"maintained implementation"}</a>{" makes that convention visible. Record the installed version when executing this newly prepared example."}</Prose>

<DropoutProgram file="dropout-library-checks.py" title="Read the matched library checks and locked-feature solution" />

<Prose>{""}<strong>{"Independent modification:"}</strong>{" add a "}<code>{"locked_features"}</code>{" case for a sequence "}<code>{"[N,T,D]"}</code>{", with independent bits shaped "}<code>{"[N,1,D]"}</code>{". Let the caller supply a fixed mask for a deterministic comparison. Return identity in eval, zeros at p1 in training, and "}<code>{"values * mask / (1-p)"}</code>{" otherwise. Then differentiate the sum of the output."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The forward bit belongs to a feature/example pair; every time step must use the same bit, including backward."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"For one example with time rows [1,2] and [3,4], p0.5 and mask [1,0], the result is [2,0] and [6,0]. The gradient of their total with respect to the input is [2,0] on both rows. A fresh backward mask or a "}<code>{"[N,T,D]"}</code>{" draw changes the contract. Test identity evaluation, p0 and p1 separately, and only then use random masks during training. A mask factory is a meaningful customization point; the loss, tensor gradients and optimizer can remain ordinary library operations."}</Prose>

</details>

<H2>{"6. A complete experiment: does masking help these digits?"}</H2>

<Prose>{"The mechanism is now complete; the remaining question is whether it helps on real data. The experiment uses 400 real "}<InlineMath>{"8\\times8"}</InlineMath>{" UCI digit images, not MNIST: 40 per class. Here are three of them:"}</Prose>

<DigitSpecimensFigure />

<Prose>{"A fixed stratified split uses 280 training and 120 validation examples, seed 22. Pixel values are divided by their known maximum 16. No fitted preprocessing uses validation data, and this small reused teaching split is not an official benchmark or final test. Download "}<a href={"/learn-assets/dropout-droppath-stochastic-depth/dropout-experiments.py"}>{"dropout-experiments.py"}</a>{", "}<a href={"/learn-assets/dropout-droppath-stochastic-depth/digits-400.csv"}>{"digits-400.csv"}</a>{" and the "}<a href={"/learn-assets/dropout-droppath-stochastic-depth/data-provenance.md"}>{"data provenance"}</a>{" into one directory. The program uses Python, PyTorch, NumPy and scikit-learn; run:"}</Prose>

<CodeBlock language={"sh"}>{"python -m pip install torch numpy scikit-learn\npython dropout-experiments.py"}</CodeBlock>

<Prose>{"The recorded run used Python 3.12.14, PyTorch 2.14.0 CPU, NumPy 2.3.5 and scikit-learn 1.9.1."}</Prose>

<DropoutProgram />

<Prose>{"The program contains two controlled comparisons:"}</Prose>

<ul><li>{"An MLP: "}<InlineMath>{"64\\to64\\to64\\to10"}</InlineMath>{", tanh hidden activations, element dropout after each hidden activation, "}<InlineMath>{"p\\in\\{0,0.2,0.5,0.8\\}"}</InlineMath>{"."}</li><li>{"A residual MLP: a "}<InlineMath>{"64\\to64"}</InlineMath>{" tanh stem, four corrections "}<InlineMath>{"F_l(h)=0.5\\tanh(W_lh+b_l)"}</InlineMath>{", and a "}<InlineMath>{"64\\to10"}</InlineMath>{" head. Compare no branch masking with row or batch masking using zero-first schedules ending at 0.2 or 0.5."}</li></ul>

<Prose>{"Each family uses the same initial learned parameters for its masking variants at a given seed. The two families have different parameter counts, 8,970 and 21,450, so comparisons between them are not a matched architecture ablation. Every configuration uses Adam at 0.003 for 400 full-batch updates, with three initialization/mask seeds. No augmentation, weight decay, normalization, early stopping or hidden pretrained dependency is included."}</Prose>

<Prose>{"The mask producer is implemented explicitly for element, channel, row and batch shapes. The model's forward method makes placement visible. Training minimizes cross-entropy of raw logits; reported losses are deterministic evaluation-mode cross-entropy in natural-log units per example. Saved points at steps 0, 1, 25, 100, 200 and 400 are actual measurements, available in "}<a href={"/learn-assets/dropout-droppath-stochastic-depth/calculated-inputs.json"}>{"calculated-inputs.json"}</a>{"."}</Prose>

<Prose>{""}<strong>{"Investigate:"}</strong>{" the next plot reads those saved runs; it does not train a model in your browser. White is the unmasked baseline and amber the selected masking variant, with the same family, seed and 400-update budget. The plot shows the shape of each fit; the final differences can be as small as 0.002, so read them from the table and the sentence beneath it. Compare the validation losses, then the correct counts and training losses. Explain why a smaller training–validation gap alone does not decide the winner."}</Prose>

<DropoutMeasuredLab />

<Prose>{"The complete seed-1 picture, from the same recorded runs:"}</Prose>

<NeuralTable caption={"Final validation results, seed 1, all nine recorded configurations"} headers={[<>{"Family"}</>,<>{"Mask configuration"}</>,<>{"CE"}</>,<>{"Correct / 120"}</>]} rows={[[<>{"MLP"}</>,<>{"none"}</>,<>{"0.088034"}</>,<>{"118"}</>],[<>{"MLP"}</>,<>{"element 0.2"}</>,<>{"0.090138"}</>,<>{"118"}</>],[<>{"MLP"}</>,<>{"element 0.5"}</>,<>{"0.111671"}</>,<>{"116"}</>],[<>{"MLP"}</>,<>{"element 0.8"}</>,<>{"0.144736"}</>,<>{"116"}</>],[<>{"Residual"}</>,<>{"none"}</>,<>{"0.136714"}</>,<>{"117"}</>],[<>{"Residual"}</>,<>{"row, endpoint 0.2"}</>,<>{"0.150095"}</>,<>{"117"}</>],[<>{"Residual"}</>,<>{"batch, endpoint 0.2"}</>,<>{"0.146876"}</>,<>{"117"}</>],[<>{"Residual"}</>,<>{"row, endpoint 0.5"}</>,<>{"0.157595"}</>,<>{"117"}</>],[<>{"Residual"}</>,<>{"batch, endpoint 0.5"}</>,<>{"0.167144"}</>,<>{"116"}</>]]} />

<Prose>{"All but the element-0.8 configuration classify all 280 training images correctly; that configuration gets 279. Even high dropout did not force chance-level training accuracy here."}</Prose>

<Prose>{"Across seeds, the MLP's no-dropout validation correct count is 117–118, compared with 118 for all three element-0.2 runs. Seed 2's loss improves from 0.071144 to 0.067003 with 0.2, while seeds 1 and 3 slightly worsen. All recorded residual masking variants have worse final validation CE than their corresponding unmasked residual baseline. These observations support a narrow conclusion: masking is not clearly needed for this setup. They do not establish that a different dataset, architecture, schedule or training budget cannot benefit. If you change a rate or budget in the program, keep the baseline, retain the new outputs and identify that as another validation experiment; a final generalization claim requires a separate evaluation plan."}</Prose>

<H2>{"7. Optional: several predictions from one dropout model"}</H2>

<Prose>{"Dropout so far was switched off at evaluation. Suppose instead we keep the trained dropout active at inference and repeat the forward pass several times on the same input. Each pass samples a different mask, so the same trained network can return different predictions:"}</Prose>

<MonteCarloPassesFigure />

<Prose>{"Each small network is one pass with its own mask. Its output π is a class-probability vector over two classes; we write π rather than p because p already names the drop probability. In “Masks disagree” the two passes give [0.9, 0.1] and [0.1, 0.9]; in “Each pass is unsure” both give [0.5, 0.5]. Averaging gives [0.5, 0.5] in both. This is "}<strong>{"Monte Carlo dropout"}</strong>{". For "}<InlineMath>{"T"}</InlineMath>{" passes with class-probability vectors "}<InlineMath>{"\\pi^{(t)}"}</InlineMath>{", the prediction is their average:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar\\pi=\\frac1T\\sum_{t=1}^T\\pi^{(t)}."}</MathBlock></div>

<Prose>{"Average probabilities, not class IDs. Softmax of average logits is generally a different calculation."}</Prose>

<Prose>{"The two cases in the figure have the same average but are different situations, and a single number can tell them apart. Define categorical "}<strong>{"entropy"}</strong>{" "}<InlineMath>{"H(\\pi)=-\\sum_k\\pi_k\\log \\pi_k"}</InlineMath>{", in nats: 0 for a certain prediction, larger when probability is spread out. Compare the entropy of the average with the average of the passes' own entropies:"}</Prose>

<div className="neural-equation"><MathBlock>{"D=H(\\bar\\pi)-\\frac1T\\sum_tH(\\pi^{(t)})."}</MathBlock></div>

<Prose>{"The first term is the uncertainty of the averaged prediction; the second is how uncertain the passes were on their own. Their difference "}<InlineMath>{"D"}</InlineMath>{" is large only when individual passes are confident but point in different directions. In “Masks disagree”, entropy of the mean is "}<InlineMath>{"\\ln 2=0.693147"}</InlineMath>{", each pass has entropy 0.325083, and "}<InlineMath>{"D=0.368064"}</InlineMath>{". In “Each pass is unsure”, both passes already give "}<InlineMath>{"[0.5,0.5]"}</InlineMath>{", so the two entropies are equal and "}<InlineMath>{"D=0"}</InlineMath>{". This arithmetic is illustrative, separate from the measured digit outputs below."}</Prose>

<Prose>{"To run MC dropout, put the model in evaluation mode first, then selectively enable its dropout modules, and keep BatchNorm in evaluation mode. With §5's batch, X̃ = [0, 2, 0, 6] then passes through BatchNorm's stored buffers (mean 2, variance 8), giving about [−0.707, 0, −0.707, 1.414], and BatchNorm writes nothing: our state probe verifies that selective dropout activation leaves its counter unchanged."}</Prose>

<Prose>{"Now the real model. The supplied "}<code>{"mc_measure"}</code>{" function uses the seed-1 MLP trained with "}<InlineMath>{"p=0.5"}</InlineMath>{", selected in advance for demonstration, and 100 fresh masks. It sets only "}<code>{"nn.Dropout"}</code>{" modules to training mode and restores evaluation afterward. Deterministic evaluation has CE 0.111671, Brier score 0.040718 and 116/120 correct. The actual MC mean has CE 0.113693, Brier score 0.042566 and the same correct count. Brier here is the mean over examples of the "}<strong>{"sum across ten classes"}</strong>{" of squared probability errors. Repeated inference did not improve these scores."}</Prose>

<Prose>{"Probability spread can still reveal sensitivity to learned-feature availability. In the actual run, validation specimen source ID 299 is a digit 1 but the mean predicts 6; predictive entropy is 1.216163 and disagreement 0.493401. Source ID 251 is correctly classified as 4, with entropy 0.061497 and disagreement 0.020239. They illustrate the two quantities; they do not set an error-detection threshold. The drawing below averages the first T of the 100 recorded passes for the three digits whose individual passes were saved; all three are correctly classified, low-disagreement cases, so source 299 is not among them."}</Prose>

<DropoutMonteCarloLab />

<Prose>{"Entropy need not decrease monotonically as more passes are included. With one pass, disagreement is zero by construction. A stable wrong answer can also have low disagreement."}</Prose>

<Prose>{""}<a href={"https://proceedings.mlr.press/v48/gal16.html"}>{"Gal and Ghahramani"}</a>{" give an approximate Bayesian interpretation under a specified variational family and prior/objective relationships. Arbitrary masks added to a model trained without them are not automatically posterior samples. Our experiment measures mask-induced prediction variability; it does not claim an exact Bayesian posterior, calibrated uncertainty or guaranteed detection of unfamiliar inputs."}</Prose>

<Prose>{"For regression, spread of sampled prediction means omits observation noise. In a model that explicitly assumes Gaussian observation variance "}<InlineMath>{"\\tau^{-1}"}</InlineMath>{", predictive variance includes that term plus variability of the means; "}<InlineMath>{"\\tau"}</InlineMath>{" is precision, and "}<InlineMath>{"\\tau^{-1}"}</InlineMath>{" is variance. Increasing "}<InlineMath>{"T"}</InlineMath>{" reduces Monte Carlo estimation noise, not model bias or all uncertainty."}</Prose>

<Prose>{"For a concrete regression mixture, let two equally weighted masks produce means 1 and 3, each with observation variance 0.25. The mean is 2. The variance of those two means is "}<InlineMath>{"[(1-2)^2+(3-2)^2]/2=1"}</InlineMath>{", so the mixture's predictive variance is "}<InlineMath>{"1+0.25=1.25"}</InlineMath>{". The divisor 2 describes this exact two-component mixture; it is not an unbiased sample-variance estimate. Dividing 1.25 by the number of passes would describe neither the future observation's spread nor this predictive mixture."}</Prose>

<Prose>{"A useful application is selecting examples for labeling: disagreement can suggest where another label might help. Another is routing ambiguous inputs for human review. Both require validating the acquisition/deferral policy on the deployment setting. They are possible uses of these quantities, not safety or coverage certificates."}</Prose>

<H2>{"8. Optional: choose a noise pattern for a reason"}</H2>

<Prose>{"Every method so far decided which values share one random bit. Several related methods answer the same question differently. Follow what is shared by each random decision before choosing a method."}</Prose>

<H3>{"Hide a neighborhood, or hide individual connections?"}</H3>

<Prose>{"Return to the feature maps of §3. Channel dropout removed a whole map; element dropout removed scattered values. "}<strong>{"DropBlock"}</strong>{" sits between them: it hides contiguous regions within a map. Here are two masks that each remove 9 of 25 positions:"}</Prose>

<DropBlockFootprintFigure />

<Prose>{"Neighboring activations can encode similar evidence, so a local detector can often use the retained neighbors around scattered gaps. A block removes an entire neighborhood and asks the network to use evidence elsewhere. DropBlock samples block centers and expands them into blocks. Overlap and boundaries mean the center probability is not the final fraction removed, and its normalization also accounts for retained positions. Read the "}<a href={"https://proceedings.neurips.cc/paper/2018/file/7edcfb2d8f6a659ef4cd1e6c9b6d7079-Paper.pdf"}>{"original paper, Figure 1 and Algorithm 1"}</a>{" for the full sampling recipe; the figure above shows only the footprint."}</Prose>

<Prose>{"The other direction is finer than a unit. "}<strong>{"DropConnect"}</strong>{" masks weights rather than activations. Compare the two on the same small layer: two hidden values feeding two recipients r₁ and r₂."}</Prose>

<DropConnectTopologyFigure />

<Prose>{"Dropping the activation "}<InlineMath>{"h_2"}</InlineMath>{" removes its contribution to every recipient: in the matrix, a whole column of the effective weights becomes 0. Masking individual weights can remove different connections to different recipients, so part of a column survives. This comparison applies our inverted convention to both operations; it does not assert that the original DropConnect paper used that convention. "}<a href={"https://proceedings.mlr.press/v28/wan13.pdf"}>{"Wan et al., section 2.2"}</a>{" develops the connection-mask model and its own inference approximation."}</Prose>

<H3>{"Preserve an old state, or perturb a branch mixture?"}</H3>

<Prose>{""}<strong>{"Zoneout"}</strong>{" carries selected previous recurrent-state values forward instead of replacing them with zero. If the old state is 0.7 and a proposed update is 0.2, a preserve decision returns 0.7. It is a memory-preserving intervention across time, not ordinary hidden dropout under another name. "}<a href={"https://arxiv.org/abs/1606.01305"}>{"Zoneout"}</a>{"."}</Prose>

<Prose>{""}<strong>{"Shake-Shake"}</strong>{" blends two residual branches with a random coefficient. For branch outputs 1 and 3 and forward coefficient 0.25, the correction is "}<InlineMath>{"0.25(1)+0.75(3)=2.5"}</InlineMath>{". Its original training procedure samples another coefficient for the backward pass: with 0.75 and upstream gradient 1, the branch gradients are 0.75 and 0.25. Those are deliberately different from differentiating the fixed forward mixture, which would give 0.25 and 0.75. Test-time coefficients are 0.5. This explains why simply adding a random multiplier with ordinary automatic differentiation does not reproduce the full procedure. "}<a href={"https://arxiv.org/pdf/1705.07485"}>{"Shake-Shake, sections 1.2–1.3"}</a>{"."}</Prose>

<Prose>{""}<strong>{"ShakeDrop"}</strong>{" develops a related residual regularizer with a different forward/backward recipe and stabilization behavior. It deserves its own implementation study; arbitrary branch noise is not interchangeable with it. "}<a href={"https://arxiv.org/abs/1802.02375"}>{"ShakeDrop"}</a>{"."}</Prose>

<H3>{"Replace binary noise with a distribution you can differentiate through"}</H3>

<Prose>{""}<strong>{"Gaussian dropout"}</strong>{" uses continuous multiplicative noise; "}<strong>{"variational dropout"}</strong>{" can learn noise parameters. Local reparameterization answers a computational question inside such models: must we draw every noisy weight separately for every example, or can we directly draw the activation those weights produce? For independent Gaussian weights, a linear combination is Gaussian, so the two routes below compute the same single-example distribution:"}</Prose>

<LocalNoiseFigure />

<Prose>{"In “Draw weights, then sum”, each noisy weight is drawn and the weighted sum formed. In “Compute moments, then draw z”, the sum's mean is the weighted sum of means and its variance is the sum of squared-input-weighted variances, so the activation itself can be drawn directly. Both give N(0, 0.08) for this example, not identical draws. Independent local draws across examples preserve the sum of expected per-example losses; they do not preserve the joint covariance produced by one shared weight draw, and batch-coupled computations need additional analysis. This is a way to estimate a factorized expected-loss objective efficiently. "}<a href={"https://arxiv.org/pdf/1506.02557"}>{"Kingma et al., section 2.3 and equation 6"}</a>{" derives the local moments and discusses gradient variance. "}<a href={"https://arxiv.org/abs/1701.05369"}>{"Molchanov et al.'s variational sparsification"}</a>{" is a distinct development. Parameter cost depends on whether noise parameters are shared or per weight; fixed Bernoulli dropout does not double model parameters."}</Prose>

<Prose>{"Attention probability dropout offers another instructive preview. A normalized row "}<InlineMath>{"[0.25,0.75]"}</InlineMath>{", mask "}<InlineMath>{"[1,0]"}</InlineMath>{" and "}<InlineMath>{"q=0.5"}</InlineMath>{" becomes "}<InlineMath>{"[0.5,0]"}</InlineMath>{", whose sum is 0.5. The operation preserves each weight's expectation, as in §2, not the row sum on every pass. Renormalizing afterward defines a different operation. The attention lesson will explain the values being mixed; the masking calculation already shows why a sampled result need not be a convex average."}</Prose>

<Prose>{"A practical choice starts with the unmasked baseline, the dependency you want to perturb, and a valid validation procedure. Compare a small set of rates and placement choices. Revisit learning rate or training duration if the noisy objective is difficult to fit. Do not copy an architecture's default as a theorem about your data, or assume massive datasets make memorization impossible."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practice with changed inputs"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Repair the scaling"}</H3>

<Prose>{"A value 3 survives with probability 0.75. A program multiplies survivors by 0.75. What are its expected output and the correct survivor value?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Distinguish the chance of survival from the value conditional on survival."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{"Its expectation is "}<InlineMath>{"0.75(3\\cdot0.75)=1.6875"}</InlineMath>{". Correct inverted scaling returns "}<InlineMath>{"3/0.75=4"}</InlineMath>{" when kept and 0 otherwise, giving expectation 3."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Follow a different update"}</H3>

<Prose>{"Let "}<InlineMath>{"h=[2,-1]"}</InlineMath>{", "}<InlineMath>{"w=[0.5,1]"}</InlineMath>{", target 0, "}<InlineMath>{"q=0.5"}</InlineMath>{", mask "}<InlineMath>{"[0,1]"}</InlineMath>{", half-squared loss. Find output, weight gradient and weights after an SGD step of 0.1."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Form the masked input before differentiating."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{"Masked input "}<InlineMath>{"[0,-2]"}</InlineMath>{", output −2, loss 2, gradient "}<InlineMath>{"[0,4]"}</InlineMath>{", new weights "}<InlineMath>{"[0.5,0.6]"}</InlineMath>{". With the same mask the new output is −1.2 and loss 0.72."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Design the mask axes"}</H3>

<Prose>{"For "}<InlineMath>{"[N,T,D]=[3,5,4]"}</InlineMath>{", hide a feature consistently over all time positions for each example, but allow different examples to keep different features. What mask shape is appropriate?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"List which axis must share a decision, and which axes need independent decisions."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{""}<InlineMath>{"[3,1,4]"}</InlineMath>{". A "}<InlineMath>{"[3,5,4]"}</InlineMath>{" mask varies over time; "}<InlineMath>{"[3,1,1]"}</InlineMath>{" hides the whole example's branch; "}<InlineMath>{"[1,1,4]"}</InlineMath>{" forces the same feature decisions across examples. Actual recurrent placement needs its own temporal-state reasoning."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Catch two validation bugs"}</H3>

<Prose>{"A model with dropout and BatchNorm is scored inside "}<code>{"no_grad()"}</code>{" after training. A second engineer “fixes” its randomness by resetting the random seed before each prediction."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Separate whether gradients are recorded, whether modules use training behavior, and whether a random draw is repeated."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{""}<code>{"no_grad()"}</code>{" alone leaves training behavior active. Resetting the seed repeats randomness rather than making the intended deterministic predictor; BatchNorm state can still change. Use "}<code>{"eval()"}</code>{" plus no gradient recording for ordinary validation. For an explicitly requested MC procedure, selectively enable dropout and draw fresh masks without modifying BatchNorm state."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Choose from evidence"}</H3>

<Prose>{"Model A scores training CE 0.01 and validation CE 0.20. Model B scores 0.30 on both. Which has the smaller gap, and which has the better observed validation loss?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compute the two gaps, then compare the validation objective independently of those gaps."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{"B has zero gap; A has lower validation loss. B's small gap is compatible with underfitting. These values are a hypothetical diagnostic, not the digit measurements. The gap alone is not the selection objective."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Count blocks and distinguish conventions"}</H3>

<Prose>{"Six blocks use a zero-first schedule ending at drop probability 0.4. Find the rates and expected active count. A programmer computes every correction before masking. Does your answer predict saved computation?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Write the endpoint schedule using block indices beginning at zero. Then distinguish contributing branches from executed branch functions."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{"Rates "}<InlineMath>{"[0,0.08,0.16,0.24,0.32,0.4]"}</InlineMath>{" sum to 1.2, so expected active count is 4.8. Every correction was computed; 20% fewer active contributions does not imply 20% less computation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Explain a zero uncertainty score"}</H3>

<Prose>{"Every MC pass assigns probability 0.99 to the same wrong class. What does low mask disagreement establish?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Ask what changes across the sampled predictions and what information about correctness the masks actually provide."}</Prose>

</details>

<details>

<summary>Worked solution</summary>

<Prose>{"The sampled masks agree, not that the prediction is correct or the input familiar. More passes estimate that agreement more precisely. Assess probability quality and any deferral policy against observed outcomes on relevant held-out data."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"10. Continue and read another explanation"}</H2>

<Prose>{"You can now trace a sampled mask through values, gradients and mode changes, distinguish masking units, and interpret an actual validation comparison. Next, "}<a href={"/learn/path/full-curriculum/convolution-pooling-receptive-fields?module=deep-learning-fundamentals"}>{"Convolution, Pooling & Receptive Fields"}</a>{" explains how spatially arranged features are created and combined—the structure that made channel and region masks meaningful here."}</Prose>

<Prose>{"For another learning route, "}<a href={"https://d2l.ai/chapter_multilayer-perceptrons/dropout.html"}>{"Dive into Deep Learning §5.6"}</a>{" offers a small network diagram and a from-scratch/built-in comparison. Its example uses Fashion-MNIST and a different experiment budget. Use it to connect the masked diagram to code, not as a substitute for checking this lesson's outcomes."}</Prose>

<Prose>{"The "}<a href={"https://jmlr.org/papers/v15/srivastava14a.html"}>{"2014 JMLR dropout paper"}</a>{" is the historical reference: §§4–5 formalize model/training, §7 studies rates and model averaging, and §9 explores marginalization. Its symbol "}<InlineMath>{"p"}</InlineMath>{" is a "}<strong>{"keep"}</strong>{" probability; this lesson uses "}<InlineMath>{"p"}</InlineMath>{" for "}<strong>{"drop"}</strong>{" probability. The exact input-dropout squared-loss penalty is taught in the "}<a href={"/learn/path/full-curriculum/regularization-l1-l2-elastic-net-dropout?module=classical-ml"}>{"Classical ML regularization lesson"}</a>{"; the deep nonlinear objective here should not be silently replaced by a generic L2 penalty. The paper's RBM and unsupervised-pretraining extensions are further probabilistic-model study, not prerequisites for this route."}</Prose></section>
  </div>,
};
