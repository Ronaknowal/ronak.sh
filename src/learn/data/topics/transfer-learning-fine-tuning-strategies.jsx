import { Prose, H2, H3, Code, CodeBlock } from '../../components/content';
import { Math, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import { LessonTable } from '../../components/lesson-labs/LessonElements.jsx';
import MechanismProgram from '../../components/lesson-labs/MechanismProgram.jsx';
import mechanismProgram from '../transfer-learning-mechanism-program.js';
import { ProbeInformationFigure, LowRankDirectionFigure, AdapterCorrectionFigure } from '../../components/lesson-labs/TransferIntuitionFigures.jsx';
import { TransferNetworkFigure, FrozenGradientFigure, LoraLocationFigure, NearestMeanToyFigure, CoAdaptationFigure, BatchNormPolicyFigure, FeatureVectorFigure, FeatureTestFigure, SourceVotesFigure, OuterProductFigure, TransferStrategyMap, FeatureInspectionProgram, featureProgramUrl } from '../../components/lesson-labs/TransferBuildupFigures.jsx';
import { TransferReuseLab, TransferRunningStatsLab, TransferFreezeSwitchesLab, TransferPartitionsFigure, TransferProgram, TransferLoraLab, TransferLoraCountLab, TransferAdapterCountLab, TransferEvidenceLab, TransferBudgetRuleLab, TransferCheckpointLab, TransferScheduleFigure, programUrl, dataUrl } from '../../components/lesson-labs/TransferLearningLabs.jsx';

function MathBlock({children}) { return <div className="transfer-equation" role="region" tabIndex={0} aria-label="Equation; scroll horizontally if needed"><SharedMathBlock>{children}</SharedMathBlock></div>; }

const perceptronsLink = '/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals';
const backpropLink = '/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals';

export default {
 title: 'Transfer Learning & Fine-Tuning: Reuse, Adapt, and Verify',
 readTime: '~70 min read + 60–90 min exploration and practice; optional deeper branches ~30 min',
 hasIntegratedGuide: true,
 content: () => <div className="transfer-lesson lesson-flow">
<Prose opening="summary">Take a trained digit model apart into a backbone and a head, test what its features actually give a new task, decide which parts may change, build a low-rank update by hand, and choose a method from measured evidence. Before starting: forward/backward passes, cross-entropy, matrix–vector multiplication, and the preceding normalization lesson.</Prose>

<Prose>{"A model has learned to recognize handwritten digits 0–4. You now need a model for digits 5–9, with only eight labeled examples of each new digit. Can the first model help?"}</Prose>

<Prose>{"It might. Whatever the first model learned about strokes, loops and corners was learned from images, not from the labels 0–4 alone. But it only ever had to tell 0–4 apart, so it may also have thrown away differences that the new task needs. "}<strong>{"Transfer learning means reusing something learned on one problem to help with another."}</strong>{" This lesson treats “does it help, and which part should we reuse?” as a question to answer with measurements."}</Prose>

<Prose>{"You will open the first model, look at the numbers it computes for a new digit, test whether those numbers keep the new digits apart, choose which parts may change, build two small add-on modules by hand, and then run a complete offline comparison. In this experiment a model trained from scratch beats every transferred model, and by the end you will be able to explain why from evidence gathered in the first section."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow sections 1–5, inspect the experiment in section 7, and solve practice 1–3 and 7. You should be able to say what was transferred, what was frozen, and which evidence justified the choice of model. Sections 6 and 9 are deeper branches on low-rank derivatives, schedules and larger-model methods; practice 4–6 checks them. You do not need convolution or Transformer attention for the first pass."}</Prose>

<div id="transfer-section-1" className="transfer-section-anchor" /><H2>{"1. What exactly moves from one problem to another?"}</H2>

<H3>{"Take the trained model apart"}</H3>

<Prose>{"Our source model is a small network of the kind drawn in the "}<a href={perceptronsLink + '#neuron-network-wiring'}>{"perceptron lesson's network figure"}</a>{": ordinary weighted-sum-and-activation neurons, arranged in layers. Here it is, drawn so that the part we might keep is separate from the part we must replace."}</Prose>

<TransferNetworkFigure />

<Prose>{"Follow one image along the arrows. The 8×8 image arrives as 64 numbers. A lower layer of 32 tanh neurons turns them into 32 numbers; an upper layer of 16 tanh neurons turns those into 16. Each of those neurons performs the weighted-sum-and-activation operation from the first lesson, and the shape written under each layer is its weight matrix, outputs × inputs. Training on digits 0–4 set every one of those weights. The 16 resulting numbers go to a final layer of 5 neurons, which turns them into five scores, one per digit."}</Prose>

<Prose>{"The outline marks where we split the network. Everything inside it is the "}<strong>{"backbone"}</strong>{": it converts an image into a "}<strong>{"feature vector"}</strong>{", 16 numbers that describe the image in the network's own learned terms. The last layer is the "}<strong>{"head"}</strong>{": it reads the feature vector and produces the class scores, called logits. The five head neurons have no tanh, so cross-entropy can compare their relative scores with the target label. These new words name groups of familiar operations; a backbone is not a different kind of neuron. As symbols, the figure reads"}</Prose>

<MathBlock>{"x \\;\\xrightarrow{\\;g_\\psi\\;}\\; h \\;\\xrightarrow{\\;f_\\theta\\;}\\; z,"}</MathBlock>

<Prose>{"where "}<Math>{"x"}</Math>{" is the 64-pixel input, "}<Math>{"g_\\psi"}</Math>{" is the backbone with weights "}<Math>{"\\psi"}</Math>{", "}<Math>{"h"}</Math>{" is the 16-value feature vector, and "}<Math>{"f_\\theta"}</Math>{" is the head with weights "}<Math>{"\\theta"}</Math>{" producing five logits "}<Math>{"z"}</Math>{". Cross-entropy compares logits with a label; backpropagation says how each trainable weight should change. Copying "}<Math>{"\\psi"}</Math>{" transfers learned weights, not an image's feature values: "}<Math>{"h"}</Math>{" is recomputed for every new image, which is what makes a copied backbone useful."}</Prose>

<Prose>{"The split tells us what could be reused. The head cannot be: its five outputs mean “0, 1, 2, 3, 4,” and the new task needs outputs meaning “5, 6, 7, 8, 9.” Both heads have five outputs, but a matching shape does not give the old scores new meanings. The backbone is the candidate: it knows nothing about labels directly; it only maps images to 16 numbers. Below, a real 5 from the new task passes through the copied backbone; choose which head reads its features."}</Prose>

<TransferReuseLab />

<Prose>{"Now some names for what we can do with that backbone. "}<strong>{"Pretraining"}</strong>{" is the earlier learning on the source task, here digits 0–4. "}<strong>{"Fine-tuning"}</strong>{" means continuing to train a pretrained model on the target task. A "}<strong>{"linear probe"}</strong>{" keeps the backbone fixed and trains only a new linear head on its features: it asks whether the existing features already suffice. A "}<strong>{"domain"}</strong>{" describes the inputs and where they come from, such as scans from particular writers and equipment; a "}<strong>{"task"}</strong>{" describes the output wanted from them, such as digit identity. Either can change on its own: new labels for the same kind of scans, or the same digit task on scans from new writers or equipment. Our experiment changes the task (new label set) and keeps the domain (scans from the same collection). It says nothing about transfer across hospitals, languages or sensors."}</Prose>

<H3>{"Look at the numbers the backbone passes on"}</H3>

<Prose>{"Before training anything for the new task, look at what the backbone actually hands a head for a new digit. Here is the same handwritten 5, passed through two copies of the backbone: the random weights it started with, and the weights after source training. Each row shows the 16 numbers a head would receive."}</Prose>

<FeatureVectorFigure />

<Prose>{"Source training did change something: the learned features are large and decisive, many of them pinned near +1 or −1, while the random features are small and graded. Near ±1 the tanh curve is almost flat, so such a unit barely responds to small input changes: it has "}<em>{"saturated"}</em>{". Large decisive values are useful for the source task, where a crisp code for “this looks like a 3” helps the head; the unchanged source head reads this learned vector and answers “3”. They are not obviously useful for us. We need to know whether a 5 and a 9 get "}<em>{"different"}</em>{" codes, and a single image cannot tell us."}</Prose>

<H3>{"Test the features before training a new head"}</H3>

<Prose>{"Here is a test that needs no training at all: average each class's codes, then assign a new image to the nearest average. Start with a tiny version in which every image is described by just two numbers."}</Prose>

<NearestMeanToyFigure />

<Prose>{"Class P has training codes (1, 3) and (3, 1), so its average code is (2, 2); class Q has (5, 5) and (7, 7), average (6, 6). A new image with code (2, 4) is at ordinary straight-line distance 2 from (2, 2) and "}<Math>{"\\sqrt{4^2+2^2}\\approx4.47"}</Math>{" from (6, 6), so the rule calls it P. That is the whole method, and nothing in it is trained: the averages come straight from the training codes."}</Prose>

<Prose>{"Our version does exactly this with 16 numbers instead of two. For each new digit, average the feature vectors of its 8 training images; then classify each of the 60 validation images by the nearest of the five averages. No weights are trained, so this looks only at how the representation arranges the images. If a representation keeps the new digits apart, images of the same digit sit near their own average and this rule does well. Raw pixels and the random backbone give two reference points, and the same test applied straight after the lower layer shows where the change happens."}</Prose>

<FeatureTestFigure />

<Prose>{"Read the counts first. The learned backbone arranges the new digits "}<strong>{"worse"}</strong>{" than an untrained random one, in every seed, and the gap already appears after the lower layer (47–49 against 58–59 correct), so source training changed the first layer's features too, not only the second's. The confusion tables say where the learned features mislead the nearest-mean rule. Fives and nines land nearer each other's mean in every seed (5→9: 4, 5, 4; 9→5: 4, 3, 3); in seed 1, sevens nearer the 6 mean and eights nearer the 7 mean are common too (5 each), smaller in seeds 2 and 3. Raw pixels also do well here: their five averages already separate these digits, and the backbone's 16 numbers kept less of what does. Why does the untrained backbone do better? With small random weights each tanh stays near its straight middle section, so this backbone behaves much like a fixed random mixing of the pixels; the counts show that it kept most of the differences this test uses."}</Prose>

<Prose>{"This is the main risk of transfer, stated with our own numbers: "}<strong>{"features learned for one task keep the distinctions that task rewarded and may lose ones a new task needs."}</strong>{" Yosinski and colleagues called this the "}<em>{"specialization"}</em>{" of features, and in their large ImageNet networks it mainly affected the top layers. In their setting even features from a dissimilar task beat random frozen weights; earlier work on small networks had found random features nearly as good as learned ones. Our source model is tiny, trained on five classes, and squeezes everything through 16 units, and here the lower-layer row shows the change starting in the first layer. "}<a href="https://arxiv.org/abs/1411.1792">{"Yosinski et al., "}<em>{"How transferable are features in deep neural networks?"}</em></a></Prose>

<Prose>{"The same study found a second, less obvious cause of failure. Here is its setup, sketched on their eight-layer network: copy the first layers of a trained network into a new one, lock them, and retrain the remaining layers from random weights "}<em>{"on the same task"}</em>{"."}</Prose>

<CoAdaptationFigure />

<Prose>{"Read the rows top to bottom. Row baseB is the original network. In row B4B, layers 1–4 are copied and locked and layers 5–8 restart from random weights, all on the same task B; performance still dropped when the cut fell in the middle of the network. Neighbouring middle layers had learned to work as a pair, each relying on the other's particular coding, and freshly initialized upper layers could not rediscover that partnership by training alone. They called this "}<strong>{"co-adaptation"}</strong>{". In row B4B+ the copied layers fine-tune as well, and the drop disappeared. So a frozen cut can fail even when the copied features are perfectly relevant. The strategy choices in section 2 cannot show this case, because they never restart upper layers from random weights."}</Prose>

<Prose>{"There is a second view of the same validation images: ask the unchanged source model what it calls them. Its answer is only a summary of the 16 features, squeezed into one of five old labels, so on its own it cannot show that two digits have similar codes. It does show which old digit each new one resembles to that model."}</Prose>

<SourceVotesFigure />

<Prose>{"Sharing one old label does not by itself mean two digits share features; the nearest-mean table above is the direct test. A weak result like ours has more than one possible explanation: the head may be too simple to use information that is present, or the information may be gone. Four constructed points separate the two cases."}</Prose>

<ProbeInformationFigure />

<Prose>{"In panel A the information is all there, and only the straight-line head is too restricted. In panel B, two different labels share one feature value, so it is lost. Only "}<em>{"identical"}</em>{" codes are impossible to separate. Codes that are close but distinct can in principle be separated by a flexible enough head; with 8 training images per digit, doing so reliably is the hard part. Nearest-mean is itself a very simple head, so its failure is a warning about the representation, not a verdict. Poor optimization or regularization can also weaken a trained probe, so a probe's score alone does not identify the cause."}</Prose>

<div id="transfer-section-2" className="transfer-section-anchor" /><H2>{"2. Choose what the target task may change"}</H2>

<Prose>{"Section 1 split the source model into a reusable backbone and a head, and measured a risk: the learned features arrange the new digits worse than random ones. Given that risk, the central decision is how much of the backbone the new task may change. The options range from “nothing” (keep the backbone exactly as learned) through “some layers” to “everything, starting from random weights.” Each option is a choice about which weights the optimizer is allowed to update. Starting from random weights, "}<strong>{"training from scratch"}</strong>{", ignores the source model entirely; it is the comparison that tells you whether transfer helped. Here are the four options on our actual network; the sentence under the diagram counts exactly how many values each option trains and says whether the old model's answers on digits 0–4 are guaranteed to survive."}</Prose>

<TransferStrategyMap />

<Prose>{"Notice what the options expose. The probe trains 85 values and leaves the old model's behavior on 0–4 exactly intact, because the features never change. Full fine-tuning trains all 2,693 and makes no such promise. Scratch trains the same 2,693 values from a random start. Partial fine-tuning sits between them. Sections 4 and 5 add two further options that train small new pieces beside or after a frozen backbone, and section 7 returns to this same network with those options and every measured result. The table collects the strategies with the question each one asks."}</Prose>

<LessonTable caption="Adaptation strategies and their restrictions" headers={["Strategy","Trainable parts","What it asks"]} rows={[[<>{"Train from scratch"}</>,<>{"Backbone and new head, starting from random weights"}</>,<>{"Can target data support learning these features directly?"}</>],[<>{"Linear probe"}</>,<>{"New linear head"}</>,<>{"Are fixed source features already useful for this decision?"}</>],[<>{"Partial fine-tuning"}</>,<>{"New head and selected backbone layers"}</>,<>{"Can a limited part of the representation adapt enough?"}</>],[<>{"Full fine-tuning"}</>,<>{"New head and all backbone layers"}</>,<>{"Does adapting the entire representation help?"}</>],[<>{"Parameter-efficient fine-tuning, or PEFT"}</>,<>{"Small added parameters, often plus a head"}</>,<>{"Can a restricted update adapt the model using fewer trainable values?"}</>]]} />

<H3>{"Different parts can learn at different speeds"}</H3>

<Prose>{"“Full” says which parameters may change, not that they must change equally fast. The new head starts random and must learn what its five outputs mean, so it needs large steps. The backbone already computes something useful, so smaller steps change it gently. Giving layer groups different learning rates is called "}<strong>{"discriminative fine-tuning"}</strong>{". In PyTorch you pass the optimizer a list of parameter groups, each with its own rate; this is equivalent to how the experiment builds its discriminative candidate:"}</Prose>

<div className="transfer-code" role="region" tabIndex={0} aria-label="Parameter groups with separate learning rates"><CodeBlock language="python">{"optimizer = torch.optim.Adam([\n    {\"params\": model.head.parameters(), \"lr\": 0.01},              # new head: learn meanings\n    {\"params\": model.backbone.upper.parameters(), \"lr\": 0.001},   # upper layer: adapt gently\n    {\"params\": model.backbone.lower.parameters(), \"lr\": 0.0001},  # lower layer: barely move\n])"}</CodeBlock></div>

<Prose>{"Any parameter left out of every group is never updated by this optimizer. The "}<a href="https://docs.pytorch.org/docs/2.14/optim.html">{"optimizer documentation"}</a>{" describes per-group options; settings a group does not name fall back to the optimizer's defaults."}</Prose>

<Prose>{"How do you choose among the strategies? Start with a simple baseline and, when available, a probe. If the probe cannot even fit the training examples, the features lack something, and letting the representation change is the next thing to try. If it fits training examples well but validates poorly, more trainable capacity may make overfitting worse. Check the split, preprocessing and labels before reading every failure as “not enough fine-tuning.”"}</Prose>

<Prose>{""}<strong>{"Negative transfer"}</strong>{" means reuse performs worse than an appropriate target-only comparison, such as training from scratch, on the same target rows under the same evaluation rule. It is a comparison, not merely a low score: a target-only model might do even worse. Report any difference in optimization budget between the two, and remember that one experiment shows harm for one source model and procedure, not that a source domain is harmful in general. Section 1's feature test already warns that our experiment may show negative transfer."}</Prose>

<H3>{"A freeze has three separate meanings to check"}</H3>

<Prose>{"Choosing “frozen” for a layer above is a decision; making it true in code takes care. Training changes a parameter "}<Math>{"w"}</Math>{" by the familiar step "}<Math>{"w\\leftarrow w-\\eta g"}</Math>{", where "}<Math>{"g"}</Math>{" is its gradient. To “freeze” a parameter is to make sure this step never changes it. In PyTorch three different pieces of machinery are involved, and a freeze policy must get all three right:"}</Prose>

<ol><li>{""}<strong>{"Parameter gradients:"}</strong>{" "}<Code>{"requires_grad_(False)"}</Code>{" stops backpropagation from computing "}<Math>{"g"}</Math>{" for those parameters."}</li><li>{""}<strong>{"Optimizer membership:"}</strong>{" the optimizer applies the step only to the parameters it was given. Build it from the intended trainable parameters, as in the groups above, and clear stale gradients when you change a freeze policy."}</li><li>{""}<strong>{"Model state:"}</strong>{" some layers change without any gradient step. In training mode BatchNorm updates its running statistics, and dropout randomizes its output, even when every weight is frozen."}</li></ol>

<Prose>{"The preceding "}<a href="/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals">{"normalization lesson"}</a>{" showed that BatchNorm's running mean and variance are buffers, updated by the forward pass itself, and that "}<Code>{"eval()"}</Code>{" and "}<Code>{"no_grad()"}</Code>{" are independent switches. That matters here: a “frozen” pretrained backbone left in training mode silently keeps rewriting its running statistics with target-batch statistics, and its features change. Our backbone uses linear layers and tanh, so it has no running statistics or dropout. For a frozen pretrained backbone that does, a common policy puts the backbone and the head in different modes:"}</Prose>

<BatchNormPolicyFigure />

<Prose>{"Call both lines at the start of each training epoch: "}<Code>{"model.train()"}</Code>{" sets every module to training mode, then "}<Code>{"model.backbone.eval()"}</Code>{" switches the backbone back, so the head trains while the backbone normalizes with its stored statistics. Adapting BatchNorm statistics to the target data is a different policy; declare and validate it separately."}</Prose>

<Prose>{"The next lab isolates the third piece, model state, in one BatchNorm channel. Its batch is the two values (1, 3), its stored running mean and variance start at 0 and 1, and nothing in it is trainable. Apply a forward pass in training mode: the stored running mean moves although no weight changed. Then switch to evaluation mode and apply another."}</Prose>

<TransferRunningStatsLab />

<Prose>{"The first two pieces concern parameters. Put the same channel inside a frozen backbone, so by the policy above it runs in evaluation mode and normalizes the batch (1, 3) with the stored buffers from the lab you just used, mean 0 and variance 1: the batch passes through almost unchanged. (In training mode a batch of only two values always normalizes to ±1, whatever they are, so it would hide the gradient this lab is about.) The channel's learned scale "}<Math>{"\\gamma"}</Math>{" and shift "}<Math>{"\\beta"}</Math>{" start at 1 and 0, and the loss is the mean squared difference between the output and the target (0, 2). Choose how "}<Math>{"\\gamma"}</Math>{" and "}<Math>{"\\beta"}</Math>{" are set up, then apply an SGD step: only one of the three set-ups actually changes them."}</Prose>

<TransferFreezeSwitchesLab />

<Prose>{"The frozen set-up still reports an input gradient, about (1, 1): each output's error reaches the input it came from, scaled by "}<Math>{"\\gamma"}</Math>{". That points to one more distinction the add-on methods depend on: a frozen weight still passes gradients "}<em>{"through"}</em>{" itself to whatever came before it, just as "}<a href={backpropLink}>{"backpropagation"}</a>{" sends a signal through every operation on the path. Here is the smallest case, then the opposite case where nothing needs to pass."}</Prose>

<FrozenGradientFigure />

<Prose>{"In rows 1 and 2 a trainable module upstream produces "}<Math>{"u"}</Math>{" and a frozen matrix computes "}<Math>{"Wu"}</Math>{". With "}<Math>{"W=I_2"}</Math>{", input "}<Math>{"(2,1)"}</Math>{" and mean squared error against zero, the input still receives gradient "}<Math>{"(2,1)"}</Math>{" while "}<Math>{"W"}</Math>{" stores none. Freezing "}<Math>{"W"}</Math>{" prevents its parameter update; it does not remove the operation "}<Math>{"y=Wu"}</Math>{", and wrapping that operation in "}<Code>{"no_grad()"}</Code>{" would cut the route back to "}<Math>{"u"}</Math>{". Our network meets this case in section 4, where a small trainable module sits beside the frozen lower layer and its learning signal has to cross the frozen upper layer and its tanh. Row 3 is the opposite: when only a head after the frozen part trains, the backward pass stops at the head, so features can be computed once without a graph, or cached."}</Prose>

<div id="transfer-section-3" className="transfer-section-anchor" /><H2>{"3. A complete small transfer pipeline"}</H2>

<Prose>{"Sections 1 and 2 quoted results from an experiment without showing how it was run. Here is its data and protocol. We use 400 real 8×8 handwritten scans from the UCI Optical Recognition of Handwritten Digits collection: 40 per digit. The values are integers from 0 through 16. Divide by the known feature-range maximum 16; do not estimate a new scale using the holdout. This collection is distinct from MNIST."}</Prose>

<Prose>{"The downloadable data include "}<Code>{"source_id"}</Code>{", 64 row-major pixels, and "}<Code>{"digit"}</Code>{"; the provenance file identifies the extraction and license. Both are linked with the program below. The rows are divided into five groups, each with one job:"}</Prose>

<TransferPartitionsFigure />

<Prose>{"Two of those jobs need names. "}<strong>{"Retention"}</strong>{" asks whether the adapted model can still do the old task: plug its possibly changed backbone back into the original source head and count how many held-out 0–4 digits it still names correctly. A loss of that ability is called "}<strong>{"forgetting"}</strong>{". The target test group, by contrast, is used exactly once, to report the single model chosen with validation data."}</Prose>

<Prose><strong>{"What this experiment can support."}</strong>{" The groups are fixed, disjoint row blocks within the extract, not random writer groups; writer identifiers are unavailable, so nothing here measures generalization to unseen writers, and row order can make groups differ in difficulty. The six candidates each use one declared training procedure rather than their individually best settings. With 40 target training rows and 60 validation rows, differences of a few images are within what reordering rows could change. The experiment teaches the protocol and the mechanisms; it is not a benchmark or a ranking of methods in general. The rest of the lesson refers back to this paragraph rather than repeating it."}</Prose>

<Prose>{"The complete "}<a href={programUrl} download="transfer-experiments.py">{"CPU program"}</a>{" defines every model, optimizer, split, training loop and calculation. Put it beside the "}<a href={dataUrl} download="digits-400.csv">{"CSV"}</a>{". One setup for a separate learner environment is:"}</Prose>

<div className="transfer-code" role="region" tabIndex={0} aria-label="Setup commands"><CodeBlock language="bash">{"python -m venv .venv\n# Activate .venv using your operating system's activation command.\npython -m pip install torch==2.14.0 numpy==2.3.5\npython transfer-experiments.py"}</CodeBlock></div>

<TransferProgram />

<Prose>{"The recorded run used Python 3.12.14 and PyTorch 2.14.0+cpu. It needs no pretrained download, account or GPU. The program performs all 18 target fits, all source fits, the predeclared selection and the one test report. It limits PyTorch to one CPU thread, writes "}<Code>{"calculated-inputs.json"}</Code>{" and prints validation results followed by the selected test result. Browser labs on this page use its saved observations or exact small arithmetic; they do not run these fits. Exact floating-point last digits may vary across environments."}</Prose>

<Prose>{"Follow its data flow before changing settings:"}</Prose>

<ol><li>{"Initialize a 64→32→16 tanh backbone and a five-output source head. Train on the 150 source training rows for 400 full-batch Adam updates, learning rate 0.01."}</li><li>{"Save both the original random backbone and the learned backbone. Initialize one new five-output target head. Every method in that seed receives an identical copy of this head."}</li><li>{"Construct six candidates: scratch, probe, full fine-tuning, discriminative rates, rank-2 LoRA and a width-4 adapter. The program's LowRankLinear and BottleneckAdapter classes implement the last two, which sections 4 and 5 build by hand. Train each for 300 full-batch updates on the same 40 target rows."}</li><li>{"Compare their final validation cross-entropies. Seed 1 is the predeclared selection seed. Choose its lowest validation loss; exact ties use the listed method order."}</li><li>{"Seeds 2 and 3 provide sensitivity comparisons on validation only. They do not change the selection rule. Freeze the exact selected seed-1 weights, with no refit, and evaluate that model on the 100 target test rows."}</li></ol>

<Prose>{"The head rate is 0.01 throughout. Scratch and full fine-tuning use 0.001 for both backbone layers. Discriminative fine-tuning uses 0.0001 for the lower layer and 0.001 for the upper layer. LoRA factors and adapter weights use 0.01."}</Prose>

<Prose>{"The section-1 feature test comes from a separate, smaller "}<a href={featureProgramUrl} download="feature-inspection.py">{"inspection program"}</a>{". Keep it beside the main program and CSV: it imports the main program's backbone, training loop and seeds, retrains the same three source backbones, and reads only target training and validation rows. As a check that it rebuilds the same models, its seed-1 source holdout result (49/50, cross-entropy 0.029455) and its three learned-backbone probes reproduce the main experiment's recorded values exactly. Run "}<Code>{"python feature-inspection.py"}</Code>{"; it writes "}<Code>{"feature-inspection.json"}</Code>{". The nearest-mean rule is the short function near the top; the rest rebuilds the same models and records what the figures show."}</Prose>

<FeatureInspectionProgram />

<div id="transfer-section-4" className="transfer-section-anchor" /><H2>{"4. Make an update without replacing the whole weight matrix"}</H2>

<Prose>{"Section 2's options either freeze a layer completely or let every entry of its weight matrix move independently. Our lower layer alone has 2,048 weights, and a large language model has billions. Storing a complete changed copy for each new task is expensive, and training all of them on a few examples invites overfitting. Is there a way to let a layer change in a useful but restricted way, with far fewer numbers?"}</Prose>

<H3>{"A weight change is itself a matrix"}</H3>

<Prose>{"Write the fine-tuned weight as the old one plus a change: "}<Math>{"W+\\Delta W"}</Math>{". Full fine-tuning can choose any "}<Math>{"\\Delta W"}</Math>{". Now restrict it: build the change from two short vectors. A row "}<Math>{"a"}</Math>{" says which combination of the inputs to measure, here "}<Math>{"a=[1,-1]"}</Math>{", “first input minus second”. A column "}<Math>{"b"}</Math>{" says how much of that one measurement to add to each output, here "}<Math>{"b=[1,2]^T"}</Math>{", once to output 1 and twice to output 2. Their product "}<Math>{"\\Delta W=ba"}</Math>{" fills every cell of a full-sized matrix:"}</Prose>

<OuterProductFigure />

<Prose>{"Both routes give the same change, but route 2 never builds the grid. Every row of "}<Math>{"\\Delta W"}</Math>{" is a multiple of "}<Math>{"a"}</Math>{", so the input enters only through the one number "}<Math>{"a\\cdot x"}</Math>{"; every column is a multiple of "}<Math>{"b"}</Math>{", so "}<Math>{"\\Delta W x=b\\,(a\\cdot x)"}</Math>{" always points along "}<Math>{"b"}</Math>{". That is what “rank one” means here. In this 2 × 2 grid the two vectors also hold 4 numbers, so nothing is saved; for a 32 × 64 layer, one pair holds 96 numbers instead of 2,048."}</Prose>

<Prose>{"Route 2 is the whole idea: take one measurement "}<Math>{"a\\cdot x"}</Math>{", then add that number times "}<Math>{"b"}</Math>{" to the output. However the input varies, the change it receives always points along "}<Math>{"b"}</Math>{"; only its size and sign vary. The next figure keeps these same "}<Math>{"a"}</Math>{" and "}<Math>{"b"}</Math>{" and tries three inputs."}</Prose>

<LowRankDirectionFigure />

<Prose>{"All three corrections lie on the line through "}<Math>{"b"}</Math>{": "}<Math>{"x=(0,2)"}</Math>{" gives the negative correction (−2, −4), and "}<Math>{"x=(3,3)"}</Math>{" gives no correction at all. Only the added correction is restricted; the base "}<Math>{"W"}</Math>{" can still produce outputs off this line. Learning can change "}<Math>{"b"}</Math>{" and so move the line, but a rank-one update still offers one correction direction at a time."}</Prose>

<Prose>{"One measurement–direction pair allows changes in only one output direction. To allow more, add several pairs. Stack "}<Math>{"r"}</Math>{" measurement rows into a matrix "}<Math>{"A"}</Math>{" and the matching "}<Math>{"r"}</Math>{" direction columns into a matrix "}<Math>{"B"}</Math>{" (with a single pair, "}<Math>{"A"}</Math>{" is just the row "}<Math>{"a"}</Math>{" and "}<Math>{"B"}</Math>{" the column "}<Math>{"b"}</Math>{"; LoRA writes its factors with capitals); then "}<Math>{"\\Delta W=BA"}</Math>{" is the sum of "}<Math>{"r"}</Math>{" such pieces. The number "}<Math>{"r"}</Math>{" is the "}<strong>{"rank"}</strong>{" budget: the changes this update can make span at most "}<Math>{"r"}</Math>{" independent output directions. "}<strong>{"Low-rank adaptation"}</strong>{", or LoRA, freezes "}<Math>{"W"}</Math>{" and trains only "}<Math>{"A"}</Math>{" and "}<Math>{"B"}</Math>{". Here is where those two factors sit inside one backbone layer:"}</Prose>

<LoraLocationFigure />

<Prose>{"Read the drawing top to bottom. The layer has "}<Math>{"k"}</Math>{" inputs and "}<Math>{"d"}</Math>{" outputs, so its frozen "}<Math>{"W"}</Math>{" is "}<Math>{"d\\times k"}</Math>{". The same input "}<Math>{"x"}</Math>{" enters both routes. On the correction route, "}<Math>{"A"}</Math>{" takes "}<Math>{"r"}</Math>{" measurements of the input; then "}<Math>{"B"}</Math>{" distributes them across the outputs, and the fixed number "}<Math>{"s=\\alpha/r"}</Math>{" scales the result. "}<Math>{"\\alpha"}</Math>{" is a chosen constant; dividing it by "}<Math>{"r"}</Math>{" keeps the correction from growing simply because more pairs were added. The two routes rejoin at ⊕ before the layer's tanh, and the table under the drawing gives our network's actual shapes. Without the unchanged bias, the layer computes"}</Prose>

<MathBlock>{"y=Wx+sB(Ax),\\quad\nA\\in\\mathbb R^{r\\times k},\\quad\nB\\in\\mathbb R^{d\\times r},\\quad\ns=\\alpha/r."}</MathBlock>

<Prose>{"The rank restriction applies to the update "}<Math>{"BA"}</Math>{", not to the pretrained matrix "}<Math>{"W"}</Math>{", which can still produce any output it could before. The added correction is linear in "}<Math>{"x"}</Math>{": the tanh belongs to the surrounding backbone layer."}</Prose>

<Prose>{"Why would a restricted change be enough? The LoRA authors hypothesized that the weight changes needed during adaptation have a low “intrinsic rank,” building on earlier evidence that pretrained language models can be fine-tuned well inside small random subspaces. That is a hypothesis about large pretrained models, tested by their experiments, not a guarantee for every layer. "}<a href="https://arxiv.org/abs/2106.09685">{"Hu et al., "}<em>{"LoRA"}</em>{", §4.1"}</a></Prose>

<Prose>{"Count the saving. For a 4×6 matrix, rank 2 needs "}<Math>{"2(6+4)=20"}</Math>{" factor weights instead of 24. Rank 3 needs 30, more than the matrix itself, so low rank saves parameters only when "}<Math>{"r(d+k)<dk"}</Math>{". In our network, rank-2 factors beside both backbone layers add 192 + 96 = 288 trainable values instead of 2,608 layer parameters; with the 85-value head, the LoRA candidate trains 373. Slide the rank for our lower layer to see where the saving ends:"}</Prose>

<TransferLoraCountLab />

<Prose>{"The original method initializes one factor randomly and the other to zero, so "}<Math>{"BA=0"}</Math>{" and training begins from exactly the pretrained function. Our program follows that: Gaussian standard deviation 0.1 for "}<Math>{"A"}</Math>{", zero "}<Math>{"B"}</Math>{", "}<Math>{"r=2"}</Math>{", "}<Math>{"\\alpha=2"}</Math>{", adapters on both backbone matrices. The scale "}<Math>{"s=\\alpha/r"}</Math>{" multiplies the correction; the LoRA paper notes that, with Adam and a suitably scaled initialization, tuning "}<Math>{"\\alpha"}</Math>{" acts roughly like tuning the learning rate. It does not make different ranks behave identically, because rank also changes the number of factors, their directions and their gradients. When comparing ranks, keep the data fixed."}</Prose>

<H3>{"Watch the first update"}</H3>

<Prose>{"If "}<Math>{"B"}</Math>{" starts at zero, can anything learn? Take the smallest case: "}<Math>{"W=I_2"}</Math>{", one measurement row "}<Math>{"A=[1,-1]"}</Math>{", "}<Math>{"B=[0,0]^T"}</Math>{", "}<Math>{"s=1"}</Math>{", input "}<Math>{"x=[2,1]^T"}</Math>{" and target "}<Math>{"[0,0]^T"}</Math>{". The lab draws the two routes of section 4's figure with these numbers, and the backward signal under them; follow it as you read."}</Prose>

<TransferLoraLab />

<Prose>{"Because "}<Math>{"B=0"}</Math>{", the correction is zero and the output is just "}<Math>{"Wx=[2,1]^T"}</Math>{". With mean squared error over the two outputs, the loss is "}<Math>{"(2^2+1^2)/2=2.5"}</Math>{". The measurement is "}<Math>{"Ax=2-1=1"}</Math>{". For the mean of two squares against a zero target, the loss's derivative with respect to the output is the output itself: "}<Math>{"\\partial L/\\partial y=[2,1]^T"}</Math>{". Each output's error pushes on "}<Math>{"B"}</Math>{" in proportion to that measurement, so "}<Math>{"B"}</Math>{"'s gradient is "}<Math>{"[2,1]^T"}</Math>{". "}<Math>{"A"}</Math>{"'s gradient is zero, because any change in the measurement is multiplied by "}<Math>{"B=0"}</Math>{" before it reaches the output. After one SGD step of size 0.1, "}<Math>{"B=[-0.2,-0.1]^T"}</Math>{", the output becomes "}<Math>{"[1.8,0.9]^T"}</Math>{", and the loss falls to "}<Math>{"2.025"}</Math>{"."}</Prose>

<Prose>{"So a zero starting update does not mean zero learning: the random factor already produces a measurement, and the zero factor can learn to use it. In the lab, choose "}<Math>{"x=[1,3]"}</Math>{": the measurement becomes −2 and "}<Math>{"B"}</Math>{"'s gradient changes direction. Choose "}<Math>{"x=[1,1]"}</Math>{": the measurement is 0, so neither factor receives a gradient although the loss is positive. Start both factors at zero and both gradients vanish for every input. After a step, the new "}<Math>{"B"}</Math>{" is the direction along which corrections will be added, as in the direction figure above."}</Prose>

<section id="transfer-code-route">
<H3>Implement the factor update without autograd</H3>
<Prose>The full experiment's <Code>LowRankLinear</Code> and <Code>BottleneckAdapter</Code> already define the adaptable paths using ordinary PyTorch layers and operations. For a closer view of what autograd computes, the next standalone program implements the LoRA forward pass and its three pullbacks in NumPy, then matches them to <Code>nn.Linear</Code>, <Code>nn.Parameter</Code>, <Code>F.linear</Code>, mean MSE and plain SGD. It needs Python 3.12, NumPy 2.3.5 and PyTorch 2.14.0, with no data file or pretrained download. Run <Code>python lora-mechanism-bridge.py</Code>.</Prose>
<Prose>In the reusable <Code>forward_and_gradients</Code> routine, rows are examples: X has shape N-by-k, W is d-by-k, A is r-by-k and B is d-by-r. First form <Code>hidden = X @ A.T</Code>, the r measurements for every row; then add <Code>scale * hidden @ B.T</Code> to the frozen base output. For mean MSE across all N×d output entries, <Code>incoming = 2 * residual / residual.size</Code>. Multiplying this incoming derivative backward gives gradients for B, A and X. Section 6 derives those same paths algebraically; Backpropagation owns the general autodiff engine, so this lesson does not build another one.</Prose>
<Prose>The program reproduces loss 2.5→2.025 with B initially zero. It separately runs both-zero factors, zero bottleneck measurement and zero learning rate: each explains a different unchanged result. A changed two-row case starts with nonzero B, so A's derivative is exercised too; its loss moves from 2.375 to 1.517758789. The frozen base has no gradient buffer or parameter change, while the input gradient still includes the base path. Every comparison copies the same values and uses the same float64 reduction and simultaneous update. The merged and separate forward paths agree to floating-point tolerance.</Prose>
<MechanismProgram {...mechanismProgram} title="Read and run the manual / autograd LoRA comparison" />
<Prose>The factor path costs O(Nkr + Nrd) arithmetic and stores O(Nr) bottleneck values, in addition to O(Nd) outputs, O(Nk) input-gradient storage and the base O(Nkd) matrix product. Trainable factor storage is O(r(k + d)); the frozen O(kd) base still occupies memory. Training keeps the two thin projections rather than constructing a dense BA each step, which is route 2 of the outer-product figure. Merging deliberately materializes that d-by-k update once for compatible inference. The routine supports ordinary dense, finite real batches with a fixed linear base; dropout, quantization, mixed precision and distributed state are separate implementation contracts.</Prose>
<Prose><strong>Change the implementation:</strong> duplicate every row and target in the two-row case, then compare the loss, A/B gradients and each copied input gradient. Repeat after replacing mean MSE by summed squared error. Use this to diagnose an accidental batch-size multiplier.</Prose>
<details><summary>Implementation exercise solution</summary><Prose>With a mean reduction, duplicating the batch preserves the loss and A/B gradients. Each copied input row receives half its former derivative because the denominator doubles. With a summed reduction, the objective and parameter gradients double while each individual copied input row keeps its original derivative. The frozen base remains unchanged under either objective because it is excluded from the update.</Prose></details>
</section>

<H3>{"Fold the update back into one matrix"}</H3>

<Prose>{"During training the two routes stay separate. After training, route 1 of the outer-product figure becomes useful again: compute the full change once and add it to the base, "}<Math>{"W_{\\text{merged}}=W+sBA"}</Math>{". For a plain linear layer this gives the same outputs as the separate paths, now with a single ordinary layer and no extra computation at inference. Floating-point multiplication orders differ, so compare with a tolerance: our float64 hand example differs by about "}<Math>{"1.1\\times10^{-16}"}</Math>{"; the seed-1 float32 digit model differs by about "}<Math>{"1.9\\times10^{-6}"}</Math>{" in validation logits."}</Prose>

<Prose>{"Merging suits one fixed task. Keeping factors separate lets one base serve several tasks by swapping small factor pairs. Quantized weights, active adapter dropout or other module types need their own merging rules. Keep the original checkpoint and configuration either way."}</Prose>

<div id="transfer-section-5" className="transfer-section-anchor" /><H2>{"5. Change features through a bottleneck adapter"}</H2>

<Prose>{"LoRA changes what a frozen layer computes by adding a restricted weight change. An "}<strong>{"adapter"}</strong>{" leaves every existing layer alone and instead inserts a small new module that edits the feature vector as it passes. In our network it sits after the 16 backbone features, before the head. Follow one small feature vector through such a module before reading its formula."}</Prose>

<AdapterCorrectionFigure />

<Prose>{"The detour squeezes the features through a narrow middle, here one number "}<Math>{"Dh=-1"}</Math>{", applies tanh, and expands back to two values; the direct route carries "}<Math>{"h"}</Math>{" unchanged, and the two meet at the addition. Even though the bottleneck holds one number, the up-projection can change both output coordinates. Doubling "}<Math>{"h"}</Math>{" does not generally double the correction, because tanh is nonlinear. Written generally,"}</Prose>

<MathBlock>{"h'=h+U\\,\\tanh(Dh+b_D)+b_U,\n\\quad D\\in\\mathbb R^{m\\times d},\\quad U\\in\\mathbb R^{d\\times m}."}</MathBlock>

<Prose>{"Here "}<Math>{"d"}</Math>{" is the feature width, 16 in our network; in the LoRA formula "}<Math>{"d"}</Math>{" was one layer's output width. The down-projection "}<Math>{"D"}</Math>{" takes "}<Math>{"m"}</Math>{" measurements of the "}<Math>{"d"}</Math>{" features, like LoRA's "}<Math>{"A"}</Math>{"; tanh bends them; the up-projection "}<Math>{"U"}</Math>{" distributes them back, like "}<Math>{"B"}</Math>{". The direct "}<Math>{"h"}</Math>{" path keeps the original features available, so the module only has to learn a correction. This is a first look at a skip connection; the "}<a href="/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals">{"later residual lesson"}</a>{" develops its gradient and architecture consequences."}</Prose>

<Prose>{"Our "}<Math>{"d=16,m=4"}</Math>{" adapter has "}<Math>{"64+4+64+16=148"}</Math>{" parameters. With the 85-parameter target head, 233 parameters train. The up-projection weight and bias start at zero, so the correction is zero and the adapter is exactly the identity at first, the same trick as LoRA's zero "}<Math>{"B"}</Math>{". The down-projection starts random; once the up-projection moves, gradients reach the down-projection too."}</Prose>

<Prose>{"Because of the tanh in the middle, the correction is not a fixed matrix times "}<Math>{"h"}</Math>{", so an adapter generally cannot be merged into one weight the way LoRA can. It is a small fully specified version of the bottleneck idea, not a reproduction of every detail of the original Transformer adapter architecture. "}<a href="https://arxiv.org/abs/1902.00751">{"Houlsby et al., "}<em>{"Parameter-Efficient Transfer Learning for NLP"}</em></a></Prose>

<Prose>{"Before trusting a “parameter-efficient” label, count. Slide the bottleneck width of our "}<Math>{"d=16"}</Math>{" adapter; the count includes the new head, and the bytes are what training must keep for each trainable value."}</Prose>

<TransferAdapterCountLab />

<div id="transfer-section-6" className="transfer-section-anchor" /><H2>{"6. Deeper: derivatives tell you what “frozen” actually preserves"}</H2>

<Prose>{"This deeper branch writes section 4's one-step reasoning as general formulas. For a single input let "}<Math>{"\\delta=\\partial L/\\partial y"}</Math>{", the loss gradient arriving at the layer's output. LoRA's derivatives are"}</Prose>

<MathBlock>{"\\frac{\\partial L}{\\partial B}=s\\,\\delta(Ax)^T,\\qquad\n\\frac{\\partial L}{\\partial A}=s\\,B^T\\delta x^T,\\qquad\n\\frac{\\partial L}{\\partial x}=W^T\\delta+sA^TB^T\\delta."}</MathBlock>

<Prose>{"Read them against the worked example. "}<Math>{"B"}</Math>{"'s gradient is the output error times the measurement "}<Math>{"Ax"}</Math>{": with "}<Math>{"\\delta=[2,1]^T"}</Math>{" and "}<Math>{"Ax=1"}</Math>{" it is "}<Math>{"[2,1]^T"}</Math>{". "}<Math>{"A"}</Math>{"'s gradient first sends the error back through "}<Math>{"B"}</Math>{", so it vanishes while "}<Math>{"B=0"}</Math>{". The input gradient has two routes, and the frozen base contributes "}<Math>{"W^T\\delta"}</Math>{" although "}<Math>{"W"}</Math>{" itself is never updated: in our saved fixture, a frozen identity matrix transmits input gradient "}<Math>{"[2,1]^T"}</Math>{" while its weight has no stored gradient."}</Prose>

<Prose>{"These formulas explain the first step; they do not say that equal learning rates for the two factors are best. "}<a href="https://arxiv.org/abs/2402.12354">{"LoRA+"}</a>{" studies different rates for the two factors using width-scaling arguments and experiments; its findings do not supply a rate ratio for our small network."}</Prose>

<Prose>{""}<strong>{"Freezing parameters preserves their stored values. It does not preserve the adapted model's old behavior."}</strong>{" LoRA's base weights never change, yet the layer's output does, because the factor path is added to it; everything downstream, including the original source head, then sees different features. That is why retention must be measured. Disabling an unmerged adapter restores the base function when the same base weights, buffers, preprocessing and original head are restored. Keeping a full pre-fine-tuning checkpoint makes full fine-tuning reversible too."}</Prose>

<div id="transfer-section-7" className="transfer-section-anchor" /><H2>{"7. Read the evidence before choosing the method"}</H2>

<Prose>{"Return to the section-2 network, now with every option the lesson has built: discriminative rates, LoRA and the adapter join the probe, full fine-tuning and scratch. These are the six candidates the experiment actually ran. Choose one to see its parts, its trainable count and its measured seed-1 result, including how many of the 50 source holdout images the old head still names correctly afterwards."}</Prose>

<TransferStrategyMap stage="all" />

<Prose>{"These are actual results after 300 target updates. Cross-entropy is the mean loss in natural-log units; lower is better. Accuracy is shown as a count so the size of the evidence remains visible. The table puts all six side by side."}</Prose>

<LessonTable caption="All seed-1 final candidate measurements" headers={["Seed-1 method","Trainable values","Target train correct / 40","Validation CE","Validation correct / 60","Source holdout correct / 50 after adaptation"]} rows={[[<>{"Scratch"}</>,<>{"2,693"}</>,<>{"40"}</>,<>{"0.123143"}</>,<>{"58"}</>,<>{"Not applicable"}</>],[<>{"Probe"}</>,<>{"85"}</>,<>{"37"}</>,<>{"0.738785"}</>,<>{"44"}</>,<>{"49"}</>],[<>{"Full fine-tuning"}</>,<>{"2,693"}</>,<>{"40"}</>,<>{"0.346375"}</>,<>{"53"}</>,<>{"49"}</>],[<>{"Discriminative rates"}</>,<>{"2,693"}</>,<>{"40"}</>,<>{"0.568471"}</>,<>{"48"}</>,<>{"49"}</>],[<>{"LoRA rank 2"}</>,<>{"373"}</>,<>{"40"}</>,<>{"0.369318"}</>,<>{"53"}</>,<>{"44"}</>],[<>{"Adapter width 4"}</>,<>{"233"}</>,<>{"40"}</>,<>{"3.353089"}</>,<>{"39"}</>,<>{"49"}</>]]} />

<Prose>{"Read the table against section 1's feature test. The two methods that must use the learned features as they are, the probe and the adapter, validate worst. The adapter can only add a correction to features that already give fives and nines similar codes, and it fits all 40 training images while getting 21 of 60 validation images wrong, some with very confident wrong probabilities: hence its high cross-entropy. The probe cannot even fit all 40 training images. Methods that may change the backbone recover much of the gap; discriminative rates, which barely move the lower layer, recover less than full fine-tuning. Scratch, which never inherits the specialized features, does best."}</Prose>

<Prose>{"The feature-inspection program points the same way with a trained head. A linear probe trained with the identical protocol on the "}<em>{"random"}</em>{" backbone reaches 58, 51 and 52 correct out of 60 in seeds 1–3, against 44, 42 and 46 on the learned backbone (seed-1 cross-entropy 0.542671 against 0.738785). These runs came after the predeclared seed-1 selection (section 3), used validation rows only, and do not alter it."}</Prose>

<Prose>{"Before target adaptation, the source model got 49/50 source holdout rows correct. The probe preserves that exactly because its backbone and original head are unchanged."}</Prose>

<Prose>{"Scratch has the lowest seed-1 validation CE, so the predeclared rule selects it. The other seeds also favor scratch under these settings:"}</Prose>

<LessonTable caption="Validation-only seed sensitivity" headers={["Method","Seed 2 validation CE; correct / 60","Seed 3 validation CE; correct / 60"]} rows={[[<>{"Scratch"}</>,<>{"0.158462; 58"}</>,<>{"0.082299; 59"}</>],[<>{"Probe"}</>,<>{"0.781923; 42"}</>,<>{"0.785892; 46"}</>],[<>{"Full"}</>,<>{"0.341880; 54"}</>,<>{"0.362536; 51"}</>],[<>{"Discriminative"}</>,<>{"0.423951; 50"}</>,<>{"0.677043; 49"}</>],[<>{"LoRA rank 2"}</>,<>{"0.417762; 52"}</>,<>{"0.333299; 56"}</>],[<>{"Adapter width 4"}</>,<>{"2.350006; 40"}</>,<>{"3.027634; 35"}</>]]} />

<Prose>{"The choice follows from the declared rule."}</Prose>

<Prose>{"So the answer to the opening question, for this source model and these settings, is no: this is negative transfer. The verdict does not rest on a gap of a few images, which section 3 warned is within noise here; it rests on validation cross-entropy margins (0.12 for scratch against at least 0.34 for every transfer method in seed 1) that repeat in all three seeds. The explanation best supported by the lesson's evidence is specialization: frozen learned features arrange the new digits worse than random ones under both the nearest-mean test and a trained probe, in every seed. It is not the only possible contributor, and none of the others was tested here. Co-adaptation could make partial changes harder. Saturated tanh units respond weakly to their inputs, which can slow how quickly full fine-tuning at learning rate 0.001 reshapes the backbone in 300 steps. And each method used one declared procedure rather than its own best settings. Transfer tends to help when the source task needed the distinctions the target needs, typically a broad source task with many classes and much data, as in the "}<a href="https://d2l.ai/chapter_computer-vision/fine-tuning.html">{"ImageNet fine-tuning example in Dive into Deep Learning"}</a>{"."}</Prose>

<Prose>{"The selected seed-1 scratch model then gets "}<strong>{"77/100 target test rows correct"}</strong>{", with CE "}<strong>{"0.757101"}</strong>{". This is substantially worse than its validation result. Small fixed row blocks need not represent equally difficult populations, and choosing by validation can favor a candidate on that validation set; these data alone cannot separate the two causes. The correct response is to report the gap. Trying alternatives on the same test labels would turn the test into more development data. A stronger study would predeclare a split with writer information and more examples, and would need new final evidence for a fresh performance claim."}</Prose>

<Prose>{"Forgetting needs the same care. Seed-1 LoRA lowers original-head source accuracy from 49/50 to 44/50, although its base weights are frozen, which is section 6's point in measured form. Full fine-tuning retains 49/50 here, so a frozen base is no guarantee of retention and full fine-tuning does not always forget more. Accuracy can also stay the same while probabilities move: the source cross-entropies show it."}</Prose>

<Prose>{"A different declared rule can choose differently from the same evidence. Suppose the rule had also capped the number of trainable values, as a memory-limited project might. The lab applies such a cap to the same saved seed-1 records; no model is trained or tested again. At 400, LoRA wins; at 250, the probe beats the eligible adapter; at 84, nothing fits."}</Prose>

<TransferBudgetRuleLab />

<Prose>{"To see how each candidate got there, the lab plots its training and validation loss at the saved steps 0, 1, 10, 100 and 300, with bars for what it did to the old task. The lines only join those five samples."}</Prose>

<TransferEvidenceLab />

<div id="transfer-section-8" className="transfer-section-anchor" /><H2>{"8. A usable checkpoint includes meaning, not only tensors"}</H2>

<Prose>{"Section 1 found that the source head's outputs meant “0–4” and could not be reused for “5–9.” The same lesson applies to anything you save: numbers alone do not say what they mean. To reproduce a prediction, preserve the architecture, weight values, buffers, preprocessing, output-label order and adaptation configuration. For our target task that includes the 64-pixel ordering, division by 16, hidden widths 32 and 16, tanh, and output labels [5, 6, 7, 8, 9]."}</Prose>

<Prose>{"A LoRA checkpoint additionally needs the base identity, targeted layers, factor rank, "}<Math>{"\\alpha"}</Math>{", scaling convention, biases, and any separately trained head. A file containing only "}<Math>{"A,B"}</Math>{" does not identify the function. The same issue appears with image transforms and language tokenizers: a compatible tensor shape does not establish the same input or label meaning."}</Prose>

<Prose>{"Our program checks a state-dictionary round trip through ordinary lists with the model configuration held fixed; the selected probabilities match exactly in that run. That is a local replay check. When saving a reusable artifact, save a machine-readable configuration alongside it and a small input/output fixture."}</Prose>

<Prose>{"A probe allows a practical shortcut: compute the fixed features once and train several heads on the cached values. This is exact only for the preprocessing and backbone state used to produce the cache. Random image augmentation creates different inputs, and adapting BatchNorm statistics changes the feature function; either makes a stale cache wrong. Name cache entries by source row, preprocessing version and backbone checkpoint, not merely “features.”"}</Prose>

<Prose>{"A service hosting many related tasks can keep one base and several small adapters instead of many full copies. Each task still needs evaluation, correct routing and compatible preprocessing. Merging one adapter favors a fixed serving path; keeping adapters separate favors switching. Neither choice guarantees lower end-to-end latency; measure the actual service."}</Prose>

<Prose>{"The lab replays the selected scratch model's saved test probabilities. Pick any of the 100 test rows, including its mistakes; then reverse the declared label order or change the preprocessing version: the stored probabilities stay identical, but what they mean does not."}</Prose>

<TransferCheckpointLab />

<div id="transfer-section-9" className="transfer-section-anchor" /><H2>{"9. Further choices once the basic comparison is sound"}</H2>

<Prose>{"This deeper branch covers choices that matter once a baseline comparison like section 7 exists."}</Prose>

<H3>{"Unfreeze gradually; make the schedule explicit"}</H3>

<Prose>{"Partial fine-tuning can begin with the head, then release the upper backbone layer, then lower layers, which in section 2's diagram means switching layers from frozen to trains one at a time over the course of training. When releasing a layer, include its parameters in the optimizer and decide whether to preserve existing optimizer state. Rebuilding the optimizer resets its moments unless you deliberately transfer them."}</Prose>

<Prose>{"ULMFiT combined language-model pretraining, adaptation to target-domain text, and classifier fine-tuning. It used layer-dependent learning rates, a rise-and-decay schedule, and gradual unfreezing. Its empirically chosen layer-rate divisor 2.6 belongs to that study, not a law of neural networks. "}<a href="https://aclanthology.org/P18-1031/">{"Howard and Ruder, "}<em>{"ULMFiT"}</em>{", §3"}</a></Prose>

<Prose>{"A schedule changes the learning rate over time. Here is a simple rise-and-decay triangle, used only as a teaching example:"}</Prose>

<TransferScheduleFigure />

<Prose>{"The rate climbs for the first 10 steps and falls back by step 100, never reaching zero. Name its pieces: total duration "}<Math>{"T=100"}</Math>{", peak time "}<Math>{"c=10"}</Math>{", floor fraction "}<Math>{"\\rho=1/32"}</Math>{", and peak rate "}<Math>{"\\eta_{\\max}=0.01"}</Math>{". The fraction "}<Math>{"q(t)"}</Math>{" climbs from 0 to 1 over the first 10 steps and falls back to 0 by step 100; the rate mixes that fraction with the floor:"}</Prose>

<MathBlock>{"q(t)=\n\\begin{cases}t/c&0\\le t\\le c,\\\\(T-t)/(T-c)&c<t\\le T,\\end{cases}\n\\qquad \\eta(t)=\\eta_{\\max}\\,[\\rho+(1-\\rho)q(t)]."}</MathBlock>

<Prose>{"It starts and ends at 0.0003125 and peaks at 0.01. This triangle is a transparent teaching variant, not ULMFiT's printed schedule formula. A scheduler must define whether the rate is sampled before or after each update. Warmup keeps early steps small while a new head's gradients are large and uninformative; it does not guarantee that features are preserved."}</Prose>

<H3>{"Know which part each efficient method changes"}</H3>

<Prose>{"LoRA restricts a weight change to few directions; the adapter adds a small nonlinear feature correction. Other methods restrict different things. These are optional entry points; language-model-specific mechanisms are developed after attention and token representations later in the curriculum."}</Prose>

<LessonTable caption="Parameter-efficient method families" headers={["Method","Distinct mechanism","What to investigate before adopting it"]} rows={[[<>{"LoRA"}</>,<>{"Factorized additive weight updates"}</>,<>{"Rank, target layers, initialization, scaling and task head"}</>],[<>{"DoRA"}</>,<>{"Separates weight magnitude and direction, with low-rank directional adaptation"}</>,<>{"Additional state and the evaluated architecture; not an automatic upgrade"}</>],[<>{"QLoRA"}</>,<>{"Trains adapters through a frozen quantized base"}</>,<>{"Quantization format, dequantization computation, memory overhead and supported hardware"}</>],[<>{"Bottleneck adapters"}</>,<>{"Add small feature transformations"}</>,<>{"Placement, nonlinearity and serving overhead"}</>],[<>{"Soft prompt tuning"}</>,<>{"Learns continuous input vectors while the model is frozen"}</>,<>{"Requires differentiable access to the input representation"}</>],[<>{"Prefix tuning"}</>,<>{"Learns continuous conditioning that later tokens can attend to"}</>,<>{"Layer placement, extra sequence/state cost and task fit"}</>]]} />

<Prose>{"DoRA's magnitude/direction split and QLoRA's quantized-base training solve different problems. QLoRA includes NF4 quantization, quantization of scaling information and paged optimizers; its reported 65-billion-parameter experiment on a 48 GB GPU is a particular setup, not a general memory-fit promise. "}<a href="https://arxiv.org/abs/2402.09353">{"DoRA paper"}</a>{", "}<a href="https://arxiv.org/abs/2305.14314">{"QLoRA paper"}</a></Prose>

<Prose>{"Soft prompts are learned numerical vectors, not human-readable instructions. A hosted text-generation endpoint does not necessarily expose the gradients or embeddings required to train them. Prefix methods condition internal generation differently from merely adding the same number of input vectors. "}<a href="https://arxiv.org/abs/2104.08691">{"Prompt tuning"}</a>{", "}<a href="https://arxiv.org/abs/2101.00190">{"Prefix tuning"}</a></Prose>

<Prose>{"AdaLoRA allocates an update budget across weight matrices using importance estimates and a singular-value-style parameterization, which differs from pruning whichever raw LoRA factor entries happen to be small. IA³ learns multiplicative activation scales: it restricts changes to rescaling selected features rather than adding a matrix update. Which restriction suits a task is an empirical question; a catalogue of names is not a selection procedure. "}<a href="https://arxiv.org/abs/2303.10512">{"AdaLoRA"}</a>{", "}<a href="https://arxiv.org/abs/2205.05638">{"IA³"}</a></Prose>

<Prose>These restrictions become easier to compare with a tiny feature vector. Multiplicative scales [.5, 3] turn h = [2, −1] into [1, −3]: each output still depends only on its matching coordinate at that scaling operation. A low-rank matrix correction can mix coordinates instead, and the bottleneck adapter above can change its response nonlinearly. A frozen quantized base changes another part of the problem: its stored weights are approximate, while gradients still pass through the resulting forward computation into trainable adapters. Fewer stored bits, fewer trainable parameters and fewer allowed update directions describe different constraints.</Prose>

<H3>{"Account for memory in units"}</H3>

<Prose>{"For "}<Math>{"P"}</Math>{" parameters, 16-bit weights alone require "}<Math>{"2P"}</Math>{" bytes. Seven billion such weights require 14 GB in decimal units. Raw 4-bit storage would require "}<Math>{"P/2"}</Math>{" bytes, or 3.5 GB, before scale metadata and other overhead."}</Prose>

<Prose>{"Training also stores, for each trainable value, a gradient and, with Adam, two running moments. With FP32 gradients and two FP32 moments that adds "}<Math>{"4+8=12"}</Math>{" bytes per trainable value, excluding weights and any master copy; the moments alone are 8 bytes. This is the same 12 bytes the adapter count in section 5 used. Actual implementations may use different precision, allocation or sharding."}</Prose>

<Prose>{"This is where PEFT saves most: gradients and optimizer state exist only for the few trainable values. The base model's weights must still be stored, and activation memory, which depends on sequence length, batch size, where trainable modules sit and checkpointing, remains substantial. Parameter count is an exact calculation, not a measurement of speed or total training memory."}</Prose>

<div id="transfer-section-10" className="transfer-section-anchor" /><section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice and transfer"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A head that fits but means the wrong thing"}</H3>

<Prose>{"The old head outputs three scores for [cat, dog, horse]. Your new task is [healthy, scratched, broken], also three classes. A colleague loads the old head unchanged because the dimensions match. What should change, and what must be saved for inference?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Distinguish a vector's length from its meaning."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Normally initialize and train a new three-output head for the new task. Assess whether the backbone is useful; shape compatibility is insufficient. Preserve the new class order, input preprocessing, architecture and corresponding weights. Keeping the old head is a candidate initialization only if deliberately tested, not a completed transfer."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Decide from a new validation table"}</H3>

<Prose>{"All candidates use the same 80 validation rows. The rule was declared as lowest validation CE, with a maximum of 500 trainable parameters. Scratch uses 2,000 parameters and CE 0.30. Probe uses 120 and CE 0.55. LoRA uses 480 and CE 0.42. Adapter uses 360 and CE 0.47. Which is eligible and selected? Can you evaluate all four on the final test to reconsider?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Apply the constraint before minimizing."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Probe, LoRA and adapter are eligible; LoRA wins among them. Scratch's lower loss does not satisfy the declared resource constraint. Evaluate the selected artifact on the final test to report its performance. Using test outcomes to change the choice consumes that holdout for development; it no longer supports the original untouched-test claim."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. A freeze that still changes predictions"}</H3>

<Prose>{"A probe's backbone parameters stay bit-for-bit unchanged, but its feature vector for the same original image changes between epochs. Name two state or input mechanisms worth checking. When could feature caching be invalid?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Look beyond trainable parameters: what else is read or updated during a forward pass?"}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Check whether BatchNorm running statistics update in training mode, and whether dropout or random augmentation changes the forward computation. A cache is invalid when its preprocessing or backbone function differs from the active one. "}<Code>{"no_grad()"}</Code>{" alone prevents none of those training-mode behaviors."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Change the LoRA example"}</H3>

<Prose>{"Keep "}<Math>{"W=I_2,A=[1,-1],B=0,s=1"}</Math>{", zero target and mean squared loss, but use "}<Math>{"x=[1,3]^T"}</Math>{". Find the first "}<Math>{"B"}</Math>{" gradient and output after one step of size 0.1. Then choose a nonzero input for which this first update vanishes."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Calculate the measurement "}<Math>{"Ax"}</Math>{" before any matrix gradient."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{""}<Math>{"Ax=-2"}</Math>{", output gradient is "}<Math>{"[1,3]^T"}</Math>{", so "}<Math>{"\\nabla_B=[-2,-6]^T"}</Math>{". The updated "}<Math>{"B=[0.2,0.6]^T"}</Math>{" adds "}<Math>{"[-0.4,-1.2]^T"}</Math>{", yielding "}<Math>{"[0.6,1.8]^T"}</Math>{". The new loss is 1.8. For "}<Math>{"x=[1,1]^T"}</Math>{", "}<Math>{"Ax=0"}</Math>{" and "}<Math>{"B=0"}</Math>{", so both factor gradients vanish despite positive loss. Changing the input can remove the learning signal without changing the optimizer."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Count, then question the count"}</H3>

<Prose>{"A layer has 1,024 inputs and 256 outputs. Find the LoRA factor count at rank 8, excluding bias, and compare with full weight tuning. With 4-byte gradients and two 4-byte moments, how many bytes do those trainable states need? Does that predict total memory?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the shapes of both factors, then count gradients and the two optimizer moments separately."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Full tuning has "}<Math>{"1024\\times256=262{,}144"}</Math>{" weights. LoRA has "}<Math>{"8(1024+256)=10{,}240"}</Math>{", or 3.90625% as many. The stated trainable states require 3,145,728 bytes versus 122,880 bytes. Base weights, any master weights, activations and temporary buffers remain outside that calculation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Design a rank investigation that can answer its question"}</H3>

<Prose>{"A script creates a fresh random target dataset for ranks 1, 2, 4 and 8, then plots accuracy against rank. Redesign it. What can a flat result establish?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Identify which quantities besides rank change across runs, and which behavior a flat correct-count metric might conceal."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Keep target rows, splits, base checkpoint, label mapping, training budget and evaluation rule fixed. State initialization and scaling policies, use controlled seed repetitions, and count head parameters as well. Compare development results; select before using final evidence. Flat accuracy means those settings did not change that discrete metric detectably. Check loss and uncertainty. It does not reveal the true rank of the ideal update or prove higher rank can never help."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Test a representation by hand before training"}</H3>

<Prose>{"A frozen backbone gives two-number features. Target class P has training features (0, 2) and (2, 0); class Q has (4, 4) and (6, 6). Compute both class means and classify the validation point (1, 3) by the nearer mean, using ordinary distance. Then suppose a different source model collapses every feature vector to its first coordinate only. Recompute the means and classify the point (5, −1) from class P. What does the second result say about that backbone for this task?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Average coordinate by coordinate. For the collapsed case, each image becomes one number, so each mean is one number too."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The means are P = (1, 1) and Q = (5, 5). The point (1, 3) is at distance 2 from P and "}<Math>{"\\sqrt{16+4}\\approx4.47"}</Math>{" from Q, so it is classified P. Keeping only the first coordinate gives P values 0 and 2 (mean 1) and Q values 4 and 6 (mean 5). The P point (5, −1) becomes the single number 5, exactly Q's mean, so it is classified Q, although in two dimensions it was nearer P (about 4.47 against 6). After the collapse, nearest-mean cannot tell this P point from a typical Q image: the coordinate that separated them was discarded. It is not strictly impossible to recover here, because 5 matches Q's average but no actual Q training value (4 and 6); a head using intervals on the single number could still call it P. Information is truly gone only when a P image and a Q image collapse to the same value. For codes that are merely close, a failed nearest-mean test is a warning: a more flexible head might still separate them, if the few training examples allow it. This is the same distinction section 1 draws."}</Prose>

</details>

<div id="transfer-section-11" className="transfer-section-anchor" /></div></section><section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Where to go next"}</H2>

<Prose>{"On the first-pass route, you are ready when you can split a network into backbone and head, test what its features keep before training, construct a deliberate freeze policy, compare transfer with a target-only baseline, and keep selection separate from final reporting. The deeper route adds factor gradients, memory accounting and controlled adaptation experiments."}</Prose>

<Prose>{"The next module topic is "}<a href="/learn/path/full-curriculum/weight-initialization-xavier-kaiming-p?module=deep-learning-fundamentals">{"Weight Initialization: Xavier, Kaiming & μP"}</a>{". Transfer starts from learned weights, but a new head, an adapter's random factor or a scratch baseline still needs an initial state. Section 1 already hinted at why that state matters: small random weights kept the pixel differences largely intact. The next lesson asks how the scale of initial weights decides whether signals and gradients survive a deep network before training has learned anything."}</Prose>

<div id="transfer-section-12" className="transfer-section-anchor" /></section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"References and other ways to learn"}</H2>

<ul><li>{""}<a href="https://d2l.ai/chapter_computer-vision/fine-tuning.html">{"Dive into Deep Learning, §14.2 Fine-Tuning"}</a>{" — a clear four-step description (pretrain, copy all but the output layer, add a new output layer, train) with a hot-dog dataset where fine-tuning a pretrained ResNet-18 clearly beats training from scratch. Read it as the successful counterpart to this lesson's negative-transfer case: its source was 1,000-class ImageNet. It also uses a 10× larger learning rate for the new output layer. The text was read for this revision; its code needs downloaded weights and data."}</li><li>{""}<a href="https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html">{"PyTorch: Transfer Learning for Computer Vision"}</a>{" — an alternate practical route with pretrained ResNet18 and ants/bees images. Read the data transforms, head replacement, optimizer construction and custom-image inference. It requires external weights/data and knowledge of convolution. Its shared training loop puts the entire model in training mode, so its “fixed feature extractor” freezes weights while BatchNorm buffers can still update. Apply the explicit state policy taught here. Tutorial updated January 2025; documentation served as 2.14 in the author review."}</li><li>{""}<a href="https://www.youtube.com/watch?v=_JB0AO7QxSA">{"Stanford CS231n 2017, Lecture 7: Training Neural Networks II"}</a>{" — official course video covering optimization and transfer, useful after the first-pass experiment for another explanation of adapting image models. It predates LoRA and current library APIs. The author verified the official title, description and syllabus association, not the full recording."}</li><li>{""}<a href="https://arxiv.org/abs/1411.1792">{"Yosinski et al."}</a>{" — the specialization and co-adaptation experiments summarized in section 1; read the setup (an eight-layer ImageNet network split into two class halves) before generalizing its layer conclusions."}</li><li>{""}<a href="https://aclanthology.org/P18-1031/">{"ULMFiT, §3"}</a>{" — source for the three-stage language-model adaptation strategy and its schedule/unfreezing choices."}</li><li>{""}<a href="https://arxiv.org/abs/2106.09685">{"LoRA, §4"}</a>{" and "}<a href="https://huggingface.co/docs/peft/v0.20.0/en/package_reference/lora">{"PEFT 0.20.0 LoRA documentation"}</a>{" — separate the mathematical mechanism and its low-intrinsic-rank hypothesis from a library's initialization, target-module and merge behavior. The documentation has many model-specific snippets; the self-contained CPU program here does not require that package."}</li><li>{""}<a href="https://arxiv.org/abs/1902.00751">{"Adapter paper"}</a>{", "}<a href="https://arxiv.org/abs/2402.09353">{"DoRA"}</a>{", "}<a href="https://arxiv.org/abs/2305.14314">{"QLoRA"}</a>{", and "}<a href="https://arxiv.org/abs/2402.12354">{"LoRA+"}</a>{" — optional method families with different restrictions and resource goals. Their reported benchmark improvements are evidence for their settings, not predictions for this lesson's data."}</li><li>{""}<a href="https://arxiv.org/abs/2104.08691">{"Prompt tuning"}</a>{" and "}<a href="https://arxiv.org/abs/2101.00190">{"Prefix tuning"}</a>{" — optional bridges after learning token embeddings and attention."}</li></ul></section>
</div>
};
