// Unpublished reading-flow candidate from the complete current topic manuscript.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {CrossFlowProvider} from '../../components/lesson-labs/CrossAttentionFlowState.jsx';
import {CrossReadAnatomy,CrossReadTrace,CrossPermissionRead,CrossDonorPairing,CrossSourceProjection,CrossRectangularShapes,CrossHeadAssembly,CrossResidualDrawing,CrossCreditDrawing,CrossMaskConvention} from '../../components/lesson-labs/CrossAttentionFlowRead.jsx';
import {CrossArrivalRoutes,CrossFusionDepth,CrossIndirectRoute,CrossSourceDependencies,CrossAnswerShift,CrossSlotResampler,CrossCompressionCollision,CrossGateForward,CrossGateCredit,CrossFrozenCredit} from '../../components/lesson-labs/CrossAttentionFlowConnectors.jsx';
import {CrossFlamingoDrawing,CrossBlipObjectives,CrossBlipHandoff,CrossPrefixChoices} from '../../components/lesson-labs/CrossAttentionFlowArchitectures.jsx';
import {CrossStudyProvider,CrossTwoQuestions,CrossGroupSplit,CrossClassifierDrawing,CrossAllFits,CrossPairingControls,CrossRecordedReads,CrossOriginalMaps,CrossSavedInitial,CrossSavedImage,CrossFlowProgram,CrossFlowFiles} from '../../components/lesson-labs/CrossAttentionFlowStudy.jsx';
import {CrossCacheProvider,CrossPairCosts,CrossCachePayload,CrossProjectedCache,CrossCacheInvalidation,CrossCausalMemory,CrossYocoSharing,CrossBrokenRoute} from '../../components/lesson-labs/CrossAttentionFlowCache.jsx';
import '../../components/lesson-labs/neural-lesson-neutral.css';
export default {title:'Interleaved / Cross-Attention Architectures',readTime:'Reading,live calculations and independent practice',hasIntegratedGuide:true,content:()=> <div className="neural-lesson neural-lesson-neutral cross-flow lesson-flow"><CrossFlowProvider><CrossStudyProvider><CrossCacheProvider>
<LessonIntro prerequisites="Dot products,softmax and residual learning; the linked prerequisite operations are refreshed locally.">Follow which separate memory a question may read,what it returns,and which information remains available for the next question.</LessonIntro>
<Prose opening="exploration">{""}<strong>{"Explore as you read."}</strong>{" Edit a request, a donor's matching feature or its carried value. Follow the actual mixture, then ask which information survives compression and which projected memory a new question may reuse."}</Prose>

<Prose>{"An image is one observation; a question asks for a particular use of it. “Which digit?” and “Even or odd?” need the same pixels but different answers. We will begin with those two classroom requests, build a separate-source read, place it in larger architectures, and inspect a complete small experiment. These templates are not a natural-language visual question-answering benchmark."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the core reads in §§1–4, the small experiment in §6 and the basic cache accounting in §7, then try the core practice. The visible deeper derivation in §2, named architectures in §5 and language-only cache application in §7 are useful second passes."}</Prose>

<Prose opening="prerequisites">{"You need vector dot products, softmax and the idea of fitting a loss. The "}<a href={"/learn/path/full-curriculum/self-attention-multi-head-attention?module=deep-learning-fundamentals"}>{"Self-Attention & Multi-Head Attention lesson"}</a>{" supplies the projected attention primitive; "}<a href={"/learn/path/full-curriculum/residual-connections-skip-connections?module=deep-learning-fundamentals"}>{"Residual Connections"}</a>{" explains the unchanged bypass; "}<a href={"/learn/path/full-curriculum/batch-layer-group-rms-normalization?module=deep-learning-fundamentals"}>{"Normalization"}</a>{" explains feature normalization. The local drawings refresh these operations where they are needed. "}<a href={"/learn/path/full-curriculum/vision-transformers-vit-deit-swin-dinov2?module=deep-learning-fundamentals"}>{"Vision Transformers"}</a>{" explains the image-token setting."}</Prose>

<Prose>{"By the end, you should be able to calculate one rectangular read, implement its projections and derivatives, distinguish time order from fusion and layer placement, interpret a recorded result without inventing a causal explanation, and keep a valid cache as questions change."}</Prose>

<H2>{"1. A query reads a memory"}</H2>

<Prose>{"Start with the actual pixels and two requests. Arrows below move from the shared image to the answers defined by its annotation; no model has been asked to predict them yet."}</Prose>

<CrossTwoQuestions/>

<Prose>{"The source annotation identifies the digit. Parity is a different function of that same annotation. A useful model must connect the current request to image information rather than answer from the request alone. An image collection can supply many feature vectors; a request can choose a mixture of them."}</Prose>

<Prose>{"The next drawing makes that read small enough to calculate. Each "}<strong>{"query"}</strong>{" describes what one reader seeks. Each donor has a "}<strong>{"key"}</strong>{", describing what it matches, and a "}<strong>{"value"}</strong>{", carrying the information to contribute. These are numeric learned feature roles, not literal English tags. We use a constructed pair of requests and three donors, with two coordinates apiece."}</Prose>

<CrossReadAnatomy/>

<Prose>{"The requests supply Q; the separate memory supplies K and V. Two request rows return two answer rows, even though there are three donors. The operation leaves the donor memory unchanged. Updating it would require another operation. In self-attention the same stream instead supplies all three roles; cross-attention can use separate streams of the same modality, as in translation."}</Prose>

<Prose>{"Follow reader 0 from coordinate products to its returned value. Click a request or matching cell to edit that coordinate; choose the reader whose computation you want to trace."}</Prose>

<CrossReadTrace/>

<Prose>{"Initially the request is (√2,0). Its dot products with the keys are (√2 ln 2,0,0); dividing by √2 gives scores (ln 2,0,0). Exponentials are (2,1,1), whose sum is 4. Shares are therefore (1/2,1/4,1/4). The three carried contributions are (1,0), (0,1) and (.5,.5), returning (1.5,1.5). Reader 1 instead returns (1,2.5)."}</Prose>

<Prose>{"Scaling by the square root of matching width keeps the dot product's typical magnitude from growing merely because more coordinates are summed. Softmax turns the scores into nonnegative shares that sum to one. For numerical stability, subtract the same largest legal score from every legal score before exponentiating. This changes every exponential by the same factor, so normalization cancels it; here stable masses are (1,.5,.5), sum 2, with the same shares."}</Prose>

<div className="neural-equation"><MathBlock>{"S=\\frac{QK^\\top}{\\sqrt{d_k}},\\qquad\nA_{ij}=\\frac{\\exp(S_{ij})}{\\sum_{u\\in\\mathcal A_i}\\exp(S_{iu})}\n\\quad(j\\in\\mathcal A_i),\\qquad O=AV."}</MathBlock></div>

<Prose>{"Here dₖ is matching width, and the allowed donor set for reader i is "}<InlineMath>{"\\mathcal A_i"}</InlineMath>{". We have so far allowed every donor. A high score controls *how much* a donor contributes; its value controls *what* it contributes. Editing V alone does not change the shares in this operation."}</Prose>

<Prose>{"Now put a permission grid before normalization. Click reader 0/donor 2 to block it, then select and edit the third donor's carried coordinates."}</Prose>

<CrossPermissionRead/>

<Prose>{"With donor 2 blocked for reader 0, masses become (2,1,0), shares (2/3,1/3,0) and the returned row is (4/3,4/3). Changing the forbidden value to (100,−100) leaves this row unchanged. Reader 1 may still use it, so its output becomes (25.5,−23). A permission is an information boundary, not merely a dimmer colour."}</Prose>

<Prose>{"Every row needs at least one permitted donor to define a probability distribution. An empty legal set has no attention mixture. Applications may skip a visual residual or provide a valid empty-context token; they must choose that policy explicitly. Showing fabricated zero weights or a zero answer would conceal the missing context."}</Prose>

<Prose>{"The "}<a href={"/learn-code/self-attention-multi-head-attention/author-calculations.py"}>{"complete prerequisite attention program"}</a>{" accepts already projected Q/K/V and a True-means-permitted grid. It scales by matching width and rejects an empty legal row. We will now add the maps that turn two raw source arrays into those three projected arrays."}</Prose>

<H2>{"2. Shapes reveal the architecture"}</H2>

<Prose>{"The previous read already had Q, K, V. A learned model needs to create them. Below, two reader rows pass through one learned map, while three memory rows pass through two different maps. Amber marks parameters; cyan marks source inputs; violet marks computed features."}</Prose>

<CrossSourceProjection/>

<Prose>{"Reader source X is the 2×2 identity and memory M is the 3×3 identity. WQ is √2 times the 2×2 identity. WK has output rows (ln 2,0,0) and (0, ln 2,0); WV has rows (2,0,2) and (0,4,2). Multiplying these exact maps recreates the first read's Q, K, V. Zero biases keep this example simple. A memory row can learn different features for matching and carrying because WK and WV are distinct parameters."}</Prose>

<Prose>{"We store each map as "}<strong>{"output coordinates × input coordinates"}</strong>{", matching "}<code>{"nn.Linear.weight"}</code>{". Source entries occupy rows, so the row-array equation transposes the map:"}</Prose>

<div className="neural-equation"><MathBlock>{"Q=XW_Q^\\top+b_Q,\\quad K=MW_K^\\top+b_K,\\quad V=MW_V^\\top+b_V."}</MathBlock></div>

<Prose>{"Let T count readers and S count donors. Reader input width dᵣ and memory input width dₘ can differ. Each head projects matching width dₖ and carried width dᵥ. Change counts before widths in the next view; it shows shapes without allocating large learned tensors."}</Prose>

<CrossRectangularShapes/>

<Prose>{"One head has Q shape T×dₖ, K shape S×dₖ, V shape S×dᵥ, shares T×S and read T×dᵥ. The same matching width is essential for the dot product. The value width need not match it. With H heads, concatenate the H returned coordinate groups to shape T×Hdᵥ, then map Hdᵥ back to dᵣ for a reader residual. N denotes an outer batch of examples, so shares have shape N×H×T×S."}</Prose>

<Prose>{"For T=7, S=11, H=4, dₖ=12, dᵥ=8, dᵣ=48, dₘ=80, shares are 4×7×11 per example. Each head returns 7×8; concatenation is 7×32; the output map has stored shape 48×32 and returns 7×48. No operation needs to replace eleven donors with seven donors. The earlier feature editor separately preserves its supported 2–4 reader and 2–6 donor domains; resizing retains surviving edits and permissions."}</Prose>

<Prose>{"Changing storage order is another operation. Reverse each donor's K/V pair together with its permissions, then compare with reversing only V. The current row indices below describe storage positions; the actual paired features move together."}</Prose>

<CrossDonorPairing/>

<Prose>{"A consistent permutation reorders matching columns but preserves the sum. Positional information must travel with its source row too; this does not mean an image model ignores physical position. Reversing values alone changes which content a key retrieves. Equal queries and equal permission rows produce equal mixtures over the same memory, a useful null comparison."}</Prose>

<Prose>{"Heads are more than repeated labels. The following actual two-head state projects eight coordinates, splits them into two groups of four, computes two distributions, joins their returned coordinates and applies a learned output map."}</Prose>

<CrossHeadAssembly/>

<Prose>{"Each head has its own matching and carrying subspace. Joining them does not average their answers. The output map can mix coordinates from both heads. The selected product table exposes every donor contribution to the selected head, so a large share and a large carried coordinate can be inspected separately. Training need not give every head a neat human interpretation."}</Prose>

<Prose>{"A projected read can update its reader through an unchanged bypass. This example uses an identity output map, preserving the first calculation's numbers."}</Prose>

<CrossResidualDrawing/>

<Prose>{"The first row adds reader (1,0) to read (1.5,1.5), returning (2.5,1.5). The second returns (1,3.5). The weighted V mixture lies in the convex hull of permitted value rows. A learned output map and residual addition can move the final state outside that hull. Normalization placement is another explicit operation; this simple block does not insert it silently."}</Prose>

<div className="neural-equation"><MathBlock>{"Y=X+\\operatorname{Concat}(O_1,\\ldots,O_H)W_O^\\top+b_O."}</MathBlock></div>

<H3>{"Deeper: matching credit and carried-value credit"}</H3>

<Prose>{"To fit the block, a loss must tell its parameters what to change. Call that reverse information "}<strong>{"loss credit"}</strong>{": a small positive derivative says increasing the associated quantity increases the loss locally. The next example gives only reader 0 a half-square target (.5,2.5); reader 1 contributes no loss."}</Prose>

<CrossCreditDrawing/>

<Prose>{"Initially the output error is (1,−1), loss 1. V receives credit (.5,−.5),(.25,−.25),(.25,−.25). K receives (1,0),(−1,0),(0,0). The third key receives zero matching credit even though its value receives nonzero carried credit. Its carried vector (2,2) has equal agreement with the positive and negative error coordinates, so its share credit equals the share-weighted row average. Editing that vector can remove the cancellation."}</Prose>

<Prose>{"Write G for output credit and dA for share credit. A small change in V affects the weighted sum directly; a change in a score changes the normalized distribution. The latter includes the subtraction of its row average:"}</Prose>

<div className="neural-equation"><MathBlock>{"dV=A^\\top G,\\qquad dA=GV^\\top,\n\\qquad dS_{ij}=A_{ij}\\left(dA_{ij}-\\sum_u A_{iu}dA_{iu}\\right)."}</MathBlock></div>

<Prose>{"Blocked entries have zero score credit. Continuing through the scaled dot product gives"}</Prose>

<div className="neural-equation"><MathBlock>{"dQ=\\frac{dS K}{\\sqrt{d_k}},\\qquad dK=\\frac{dS^\\top Q}{\\sqrt{d_k}}."}</MathBlock></div>

<Prose>{"The initial request 0 credit is (ln 2/√2,−ln 2/√2). If a head passes through WO, first multiply its incoming output credit by WO, then split coordinate groups before these head pullbacks. For the source maps, row-array differentiation gives"}</Prose>

<div className="neural-equation"><MathBlock>{"dX=dQW_Q,\\qquad dM=dKW_K+dVW_V,\n\\qquad dW_Q=dQ^\\top X,\\quad dW_K=dK^\\top M,\\quad dW_V=dV^\\top M."}</MathBlock></div>

<Prose>{"Bias credit is the sum over source rows. WO credit is incoming credit transposed times the joined read; its bias again sums rows. Memory gets the sum of matching and carrying routes. These are derivatives of this explicit local block, with its fixed permissions; adding dropout, normalization or other residuals adds their own graph operations."}</Prose>

<H3>{"Use an ordinary library without changing the contract"}</H3>

<Prose>{"PyTorch's "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html"}>{"scaled dot-product attention"}</a>{" takes projected heads. Our explicit block uses it with Q shape N×H×T×dₖ, K shape N×H×S×dₖ, V shape N×H×S×dᵥ and "}<code>{"dropout_p=0"}</code>{". That route supports different matching and value widths. "}<code>{"nn.MultiheadAttention"}</code>{" instead uses common projected "}<code>{"embed_dim"}</code>{", split evenly across heads. Its "}<code>{"kdim"}</code>{" and "}<code>{"vdim"}</code>{" describe raw source input widths, not arbitrary per-head carried widths."}</Prose>

<Prose>{"The Boolean mask conventions differ. The next drawing uses one intended permission grid under each API and shows the result of forgetting the complement."}</Prose>

<CrossMaskConvention/>

<Prose>{"For SDPA, True means permitted. For MHA's Boolean "}<code>{"attn_mask"}</code>{", True means blocked, so pass the complement. Ask MHA for "}<code>{"need_weights=True, average_attn_weights=False"}</code>{" to inspect separate heads. "}<code>{"is_causal=True"}</code>{" has a specific upper-left convention for a non-square grid; it cannot infer an application's availability counts 2/4/5. Supply that explicit grid instead."}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\nfrom cross_attention_mechanisms import head, head_pullback\n\nq = np.sqrt(2) * np.eye(2)\nk = np.array([[np.log(2), 0], [0, np.log(2)], [0, 0]])\nv = np.array([[2., 0], [0, 4], [2, 2]])\nallowed = np.array([[True, True, False], [True, True, True]])\nanswer, trace = head(q, k, v, allowed)\ncredit = np.array([[1., -1.], [0., 0.]])\nback = head_pullback(trace['tape'], credit)\nprint(answer, back['key'], back['value'])"}</CodeBlock>

<Prose>{"This is a complete small caller for the local mechanisms program shown in §4. The program validates raw/projected shapes and permissions, provides the full source-and-parameter pullback, and checks a same-state explicit torch/SDPA route and MHA bridge. The scratch derivative uses array algebra; ordinary torch autograd provides a separate check rather than a second hand-written autograd engine."}</Prose>

<H2>{"3. Three choices that are easy to confuse"}</H2>

<Prose>{"Knowing which stream supplies Q does not tell us whether a donor has arrived. Start with six named events. Move an event earlier or later, then inspect direct donor access under a most-recent or all-earlier policy."}</Prose>

<CrossArrivalRoutes/>

<Prose>{""}<strong>{"Input arrangement"}</strong>{" says where images and text occur in time. It can be interleaved without deciding how information crosses between representations. ImageA→questionA→answerA→imageB→questionB→answerB is an arrangement; a visual read is an operation. A reader with no earlier image needs the explicit empty-context policy from §1."}</Prose>

<Prose>{""}<strong>{"Fusion"}</strong>{" chooses whether projected image entries join a shared text stream or remain a separate memory. "}<strong>{"Placement"}</strong>{" chooses which layer depths perform that operation. Both choices are visible below, separately from the arrival ribbon."}</Prose>

<CrossFusionDepth/>

<Prose>{"A shared causal stream updates visual and text positions according to its stream mask. A separate-memory design keeps causal text self-attention and adds rectangular visual reads. Inserting the visual read every two layers is different from having two images. An architecture can consume interleaved inputs and contain cross-attention; Flamingo does both."}</Prose>

<Prose>{"The direct visual mask may expose only the most recent image. Earlier text states can still carry earlier image information, but a route needs actual operations in the right order. Follow the scalar example before assuming every structurally possible influence has already occurred."}</Prose>

<CrossIndirectRoute/>

<Prose>{"In layer 1, self-attention runs before the visual read. Earlier text then reads imageA and later text reads imageB. Only a later self-attention operation can transfer the earlier text's newly acquired imageA information. At one layer there is no such operation. At two layers with carry coefficient 1 there is an indirect contribution 1; carry 0 is a meaningful null even though the operation exists. Reachability is a possibility, not a guarantee that learned weights use the route."}</Prose>

<Prose>{"Source encoding creates a second information boundary. An image state may already contain another image before text reads it. The next dependency grid is upstream of the final text mask."}</Prose>

<CrossSourceDependencies/>

<Prose>{"Independent image encoding keeps each source separate. Causal encoding over arrivals can contain earlier images. Bidirectional whole-clip encoding can contain future images; an allowed earlier donor can therefore leak an unavailable future frame. A causal text mask cannot unmix that donor. A completed translation source may legitimately be bidirectional because all source words are already available. State availability at the task's data boundary."}</Prose>

<H3>{"Shift the answer, then choose supervised positions"}</H3>

<Prose>{"So far a question selected a classification task. Deliberately switch now to a language answer, “red bicycle”. Teacher forcing supplies earlier correct answer tokens during fitting. The current state must predict its next target without receiving that target as current input."}</Prose>

<CrossAnswerShift/>

<Prose>{"Input[start, red] predicts target[red, bicycle]. The first position can read image, question, start; the next can additionally read red. Using input[red, bicycle] while grading those same targets exposes the answer on the causal diagonal. A loss mask may exclude question positions from supervision while keeping question information available. Loss participation and information access are different purposes."}</Prose>

<div className="neural-equation"><MathBlock>{"L=-\\sum_{r=1}^{R}\\log p(a_r\\mid\\text{image},\\text{question},a_{<r})."}</MathBlock></div>

<Prose>{"The conditioning statement, input shift and permitted graph must agree. Packed examples and upstream encoders also need that agreement; a tiny training loss is not evidence that a model learned the intended task."}</Prose>

<H2>{"4. Compressing a memory and opening a gate"}</H2>

<Prose>{"An available memory can still be too large. Instead of question-dependent requests, train a fixed bank of "}<strong>{"latent slots"}</strong>{" that read the source and pass their returned rows onward. Below, four slot requests read sixteen donors. The constructed parameter values make every intermediate inspectable; they are not a fitted image resampler."}</Prose>

<CrossSlotResampler/>

<Prose>{"The share grid is 4×16 and its output has four rows. These slots can become a visual prefix or a smaller memory for subsequent text reads. Their row identities are learned roles, not necessarily four spatial quadrants. Width projection changes coordinates; learned-slot resampling changes how many rows pass onward. The "}<a href={"/learn/path/full-curriculum/long-context-sequence-models-transformer-xl-griffin-perceiver?module=deep-learning-fundamentals"}>{"Perceiver explanation"}</a>{" develops repeated input reads and output queries further."}</Prose>

<Prose>{"A smaller memory may erase a distinction. Compare the two original scalar memories below, then switch the declared compressor from a uniform mean to two ordered identity slots."}</Prose>

<CrossCompressionCollision/>

<Prose>{"Memories (1,3) and (2,2) both store mean 2, but their maxima are 3 and 2 and their spreads are 2 and 0. A deterministic reader receiving only the equal compressed states must answer identically. Extra downstream depth cannot reconstruct information absent from its only input. A learned compressor may preserve the distinctions needed by its training tasks, but a fixed token budget is not a promise about every future question."}</Prose>

<H3>{"Start an inserted adapter at the old network's function"}</H3>

<Prose>{"A new visual adapter can initially disturb an existing language network. Give its update a scalar gate and retain an unchanged input bypass. The next circuit shows X, F, α, gate, multiply, merge and loss separately."}</Prose>

<CrossGateForward/>

<Prose>{"The operation is"}</Prose>

<div className="neural-equation"><MathBlock>{"Y=X+\\tanh(\\alpha)F_\\theta(X,M)."}</MathBlock></div>

<Prose>{"At α=0, the inserted residual is the identity in ideal arithmetic. The whole network initially matches the old one only for the same inputs, unchanged surrounding parameters and matching evaluation behavior. This initializes a function; it does not guarantee future language retention after learning."}</Prose>

<Prose>{"Zero output update does not mean every parameter gets zero loss credit. Follow the two reverse branches before applying one exact gate step."}</Prose>

<CrossGateCredit/>

<Prose>{"With X=1, F=2, target 3, α=0, Y=1 and loss 2. Adapter-output credit is 0, but α credit is−4. Rate.1 updates α to.4, producing Y≈1.759898 and loss≈.768927 while F is fixed. F=0 makes this gate route's first derivative zero; rate 0 makes the step a null. A proposed α outside the supported−4…4 editor domain is shown and refused rather than silently clipped."}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial L}{\\partial\\theta}=\\tanh(\\alpha)\n\\frac{\\partial L}{\\partial Y}\\frac{\\partial F_\\theta}{\\partial\\theta},\\qquad\n\\frac{\\partial L}{\\partial\\alpha}=(1-\\tanh^2\\alpha)\n\\left\\langle\\frac{\\partial L}{\\partial Y},F_\\theta\\right\\rangle."}</MathBlock></div>

<Prose>{"At zero the adapter's weights receive no credit through this branch, but the gate can move. Later steps can then teach the adapter. Shared parameters or other losses can provide additional routes; inspect the actual graph rather than assuming this local derivation describes the whole training system."}</Prose>

<H3>{"Keep the needed derivative through frozen parameters"}</H3>

<Prose>{"Freezing a layer excludes its weights from updates. It does not imply cutting its input derivative. The following trainable scalar feeds a frozen multiplier; compare graph recording with detaching the route."}</Prose>

<CrossFrozenCredit/>

<Prose>{"At a=1, w=2, target 3, output 2 has loss.5. The derivative to a is (2−3)×2=−2 even though w stays unchanged. "}<code>{"requires_grad_(False)"}</code>{" on the layer parameters preserves this needed route to a trainable upstream adapter. Putting that forward inside "}<code>{"no_grad()"}</code>{" or detaching its output cuts the route instead."}</Prose>

<Prose>{"A frozen vision encoder can often be precomputed if neither its inputs nor upstream trainable preprocessing require derivatives, and if inputs/preprocessing/state are fixed. Dropout, augmentation, stateful normalization and parameter revisions matter. "}<code>{"eval()"}</code>{" controls behaviors such as dropout; it does not by itself freeze parameters or turn off differentiation."}</Prose>

<H3>{"Complete scratch and library mechanisms"}</H3>

<Prose>{"The following program includes imports, finite-shape and mask validation, the rectangular head, all source/weight/bias pullbacks, a general torch block, learned-slot and zero-gated modules, and deterministic changed examples. It uses NumPy arrays for explicit algebra and CPU PyTorch for the ordinary library comparison."}</Prose>

<CrossFlowProgram file="cross_attention_mechanisms.py" title="Complete rectangular read, pullback, resampler and library bridge"/>

<Prose>{""}<code>{"cross_block"}</code>{" first projects X/M with out-by-in maps, then splits projected coordinates across heads. Each head normalizes only legal donor scores, multiplies V, and returns its own carried width. Concatenation precedes WO. "}<code>{"cross_pullback"}</code>{" reverses exactly that sequence; memory sums its WK and WV routes. "}<code>{"CrossBlock.forward(..., library=True)"}</code>{" replaces the explicit share×V product with actual SDPA using the same projected state. The MHA example separately respects common projected width and complements the Boolean permission grid. The final frozen-weight example tests the needed input derivative."}</Prose>

<Prose>{"Install NumPy and a CPU PyTorch build in a virtual environment, save the file, and run "}<code>{"python -B cross_attention_mechanisms.py"}</code>{". It performs small deterministic calculations and comparisons; no historical classifier fitting is required to learn these mechanisms. To implement a full pretrained connector, also reproduce its preprocessing, normalization, masking, loss and checkpoint conventions—the local block alone does not supply them."}</Prose>

<H2>{"5. Read named models as design choices"}</H2>

<Prose>{"We can now locate these operations in four dated recipes. A model name is useful only when it points to its actual memory, queries, permissions, parameters and training choices. The following drawings show mechanisms and counts, not architecture rankings or unknown checkpoint values."}</Prose>

<H3>{"Flamingo: a resampler and two gated residual branches"}</H3>

<Prose>{""}<a href={"https://arxiv.org/html/2204.14198"}>{"Flamingo(2022)"}</a>{" freezes its vision/language backbones, uses 64 learned visual resampler entries, and adds trained gated cross-attention and dense branches between language blocks. Trace the common image memory bus and the two gated additions."}</Prose>

<CrossFlamingoDrawing/>

<Prose>{"The resampler's queries can read image features together with latent entries as K/V; it is not just four isolated quadrant averages. Direct visual masks choose the most recent preceding image, while earlier text can carry older image information through the finite-depth route from §3. Resampling, gating, availability and insertion frequency are separate recipe choices. Latent maps need a supported source correspondence before being described as spatial regions."}</Prose>

<H3>{"BLIP-2: the objective changes access"}</H3>

<Prose>{""}<a href={"https://proceedings.mlr.press/v202/li23q/li23q.pdf"}>{"BLIP-2(2023)"}</a>{" trains a Q-Former between frozen image and language models. Its 32 learned queries have width 768; the 188 M-parameter Q-Former is a substantial trainable component. First inspect how the representation-stage objective changes query/text self-attention permissions."}</Prose>

<CrossBlipObjectives/>

<Prose>{"Image-text contrastive (ITC) keeps query and text blocks separate. Image-text matching (ITM) allows their interaction to judge agreement. Image-grounded generation (ITG) lets text read queries and causal text history while queries cannot read text. Query-to-image cross-attention is another route, not an entry in this query/text self grid. Using matching's unrestricted text access for generation would expose information the current position should predict."}</Prose>

<Prose>{"The later language stage projects query outputs to the selected language model's width. An internal cross read can therefore produce prefix entries for a downstream language model."}</Prose>

<CrossBlipHandoff/>

<Prose>{"The OPT decoder-only route uses visual-prefix entries in a decoder stream. The Flan-T5 route sends visual and text-prefix information through an encoder, then predicts a text suffix with a decoder. Their text placement and training objectives differ. A frozen language model can still transmit loss credit to the prefix generator, as in the frozen multiplier example; freezing does not logically force a cross-attention-only connector."}</Prose>

<H3>{"Original LLaVA and Idefics2: two prefix choices"}</H3>

<Prose>{""}<a href={"https://arxiv.org/pdf/2304.08485"}>{"Original LLaVA(2023)"}</a>{" uses a linear CLIP-feature projection into the language stream. "}<a href={"https://arxiv.org/pdf/2405.02246"}>{"Idefics2(2024)"}</a>{" uses a fully autoregressive multimodal stream with projection and learned pooling. Follow row count and width separately below."}</Prose>

<CrossPrefixChoices/>

<Prose>{"Original LLaVA's first alignment stage learns the projection with frozen backbones; instruction tuning then updates the projection and language model while vision stays frozen. A later MLP-projector variant is a different recipe. Feature-layer choice, answer-loss masking and data matter alongside connector shape."}</Prose>

<Prose>{"Idefics2 commonly supplies 64 pooled visual entries per image view. With optional original-plus-four-crop processing, the prefix can contain 5×64=320 entries. One image count therefore need not mean one token budget. Its architecture study also varies training choices; pooling alone does not identify a separate visual-memory architecture. Compare learned prefixes, resamplers and inserted adapters under actual data, budget and evaluation constraints."}</Prose>

<H2>{"6. A complete small image-and-question experiment"}</H2>

<Prose>{"The named systems are large. Return deliberately to a fully inspectable classroom study:real handwritten source images with the two supplied digit/parity templates. The "}<a href={"/learn-code/interleaved-cross-attention-architectures/digits-400.csv"}>{"400-row offline CSV"}</a>{" comes from UCI Optical Recognition of Handwritten Digits, credited to E.Alpaydin and C.Kaynak under CC BY 4.0. Its 64 block-count intensities lie in 0–16. It includes the digit label and original one-based scikit-learn source ID; this is not MNIST. See the "}<a href={"/learn-code/interleaved-cross-attention-architectures/data-provenance.md"}>{"data provenance"}</a>{"."}</Prose>

<Prose>{"Split source images before creating question siblings. The arrows below show image groups branching into paired tasks only after the group is fixed."}</Prose>

<CrossGroupSplit/>

<Prose>{"The stratified groups contain 240 fit,80 development and 80 assessment images, then 480/160/160 question rows. Both questions for an image stay together. Splitting question rows first could expose the same image during fitting and supposed held-out assessment. The program retains source IDs and duplicate checks. Writer identities are unavailable, so this is not new-writer evaluation. Earlier classroom lessons use the same subset; it is not an untouched external benchmark."}</Prose>

<Prose>{"Pixels divide by the known bound 16. Row-block then column-block slicing makes sixteen 2×2 patches, each with four normalized coordinates. Learned patch 4→24 and position 16×24 maps create the image memory. A learned 24-coordinate question embedding supplies one reader. Trace the full cross classifier before reading its code."}</Prose>

<CrossClassifierDrawing/>

<Prose>{"Three heads each use matching/value width 8. Their joined read passes through a 24→24 output map and adds the question bypass. The next branch performs LayerNorm 24, linear 24→48, GELU, and linear 48→24, then adds a second residual. A 24→12 head produces class logits:digits 0–9 and even/odd 10–11. Stable softmax turns logits into probabilities; negative log of the supplied target probability is cross-entropy. Autograd computes gradients and AdamW updates the fitted parameters."}</Prose>

<Prose>{"The gated classifier multiplies the cross update by its scalar tanh gate before the first residual addition. It is a mechanism comparison, not a frozen pretrained Flamingo. The flat image-plus-question MLP is the simple baseline. Parameter counts differ:flat 4,908, cross 5,676, gated 5,677. All three were trained from scratch under the fixed study settings."}</Prose>

<H3>{"Read the complete program before interpreting scores"}</H3>

<Prose>{"The historical program remains complete below. It loads the offline data, constructs group splits, creates the paired rows, defines all three classifiers, fits each fixed seed, and records all outcomes and input controls. Its saved results are retained; selecting a browser record does not retrain any model."}</Prose>

<CrossFlowProgram file="cross-attention-study.py" title="Complete historical CPU study: data, all three classifiers and every fixed fit"/>

<Prose>{"The source-image split precedes task expansion. The patch reshape separates row blocks and within-block rows; the permutation then groups row/column blocks before flattening each 2×2 patch. The query embedding chooses one of two task vectors. MHA receives the question as query and the image memory as both key and value. Its returned read is question-dependent; image-memory construction is not. Cross-entropy uses the full 12-class space, so the classifier learns which answer space each question requests."}</Prose>

<Prose>{"The fixed seeds 11,29,47 all use the declared settings; the retained final assessment is not selected from the loss curves. The program records fitting/development losses at epochs 1,10,40,80,160 and evaluates all final models. It also computes image-mismatch controls with original targets retained. Running this historical study performs nine fits and writes a result file. For inspecting the existing evidence, use the recorded JSON and the forward-only program below; fitting again is unnecessary."}</Prose>

<Prose>{"Before comparing complexity, calculate a question-only baseline. Eight of the 80 assessment images have each digit label. Guessing one digit gets 8 digit questions right; guessing one parity gets 40 parity questions right. Thus 48/160=30% requires no image features."}</Prose>

<CrossAllFits/>

<Prose>{"All flat final counts are 156,156,155; ordinary cross counts 140,140,142; gated counts 135,140,137, out of 160. In this fixed small setup, the simple flat model performs best. A more elaborate read is not automatically useful at this task and budget. The gated models learn after zero initialization; their final tanh gates are approximately−.413,.583,.423. These are observations from these fits, not recommended universal gates."}</Prose>

<NeuralTable caption={"Read the complete program before interpreting scores"} headers={[<>{"Model"}</>,<>{"Seed"}</>,<>{"Correct /160"}</>,<>{"Digit /80"}</>,<>{"Parity /80"}</>,<>{"Shuffled image /160"}</>]} rows={[[<>{"flat"}</>,<>{"11"}</>,<>{"156"}</>,<>{"79"}</>,<>{"77"}</>,<>{"46"}</>],[<>{"flat"}</>,<>{"29"}</>,<>{"156"}</>,<>{"78"}</>,<>{"78"}</>,<>{"47"}</>],[<>{"flat"}</>,<>{"47"}</>,<>{"155"}</>,<>{"78"}</>,<>{"77"}</>,<>{"46"}</>],[<>{"cross"}</>,<>{"11"}</>,<>{"140"}</>,<>{"67"}</>,<>{"73"}</>,<>{"48"}</>],[<>{"cross"}</>,<>{"29"}</>,<>{"140"}</>,<>{"67"}</>,<>{"73"}</>,<>{"45"}</>],[<>{"cross"}</>,<>{"47"}</>,<>{"142"}</>,<>{"67"}</>,<>{"75"}</>,<>{"48"}</>],[<>{"gated"}</>,<>{"11"}</>,<>{"135"}</>,<>{"63"}</>,<>{"72"}</>,<>{"45"}</>],[<>{"gated"}</>,<>{"29"}</>,<>{"140"}</>,<>{"70"}</>,<>{"70"}</>,<>{"47"}</>],[<>{"gated"}</>,<>{"47"}</>,<>{"137"}</>,<>{"68"}</>,<>{"69"}</>,<>{"45"}</>]]} />

<H3>{"Ask what the input control actually changed"}</H3>

<Prose>{"Moving each assessment image one place cyclically is a weak control because the images are ordered in digit groups. Compare it with a fixed-seed whole-image shuffle while keeping the original questions/targets."}</Prose>

<CrossPairingControls/>

<Prose>{"The cyclic move preserves 70/80 digit targets and 70/80 parity targets, so flat scores remain 138–139/160. A small score change therefore does not prove image independence. The stronger shuffle preserves only 9/80 digit and 40/80 parity targets, and the table's scores fall accordingly. This supports reliance on the image-target relationship in this study; it does not establish compositional reasoning or causal faithfulness of a heatmap. The perturbation is a diagnostic, not a natural deployment distribution."}</Prose>

<H3>{"Inspect a recorded read at its actual spatial address"}</H3>

<Prose>{"The complete-probability inspector has six recorded cross/gated models, ten source images per model and two questions:120 observations. The ten sources were chosen as the first assessment source of each digit independently of model correctness. Choose model, source, question; then inspect a head and a patch."}</Prose>

<CrossRecordedReads/>

<Prose>{"Each weight cell maps to a real 2×2 patch of the 8×8 input. The exact shares use a fixed 0–1 violet scale; switching heads does not independently stretch the colour range. A large share describes value mixing in that head. Value directions, output maps, residuals and the classifier also affect the answer; a sharp map is not a causal object annotation."}</Prose>

<Prose>{"The original four-source maps are retained separately. Three source IDs 127,131,210 occur only in that original-map set, not in the ten-source complete-probability set. Use the actual fields below rather than inventing a missing probability vector."}</Prose>

<CrossOriginalMaps/>

<Prose>{"These original map records provide their available target, prediction and per-head shares. The 13-image union describes retained input images, not six models×thirteen complete probability observations."}</Prose>

<H3>{"Compute an edited image with one complete saved state"}</H3>

<Prose>{"For cross/seed 11, the complete 5,676-parameter state is available. This supports a genuine forward calculation on any of the 13 retained images and copied pixel edits. It does not turn the other five observed models into editable models. Choose an initial copied source and restore it if needed before editing pixels below."}</Prose>

<CrossSavedInitial/>

<Prose>{"The new drawing selects any of 64 counts and permits arbitrary finite values 0–16. A pixel edit changes its normalized patch, projected memory, all three head reads, residual/dense states, logits and probabilities immediately. The original digit label remains source provenance after edits; it is not a new edited-image ground truth."}</Prose>

<CrossSavedImage/>

<Prose>{"The saved state loads only near this view. This browser calculation uses float64 arithmetic and the exact GELU formula with numerically integrated erf; its intermediates and probabilities are compared with native float32 using tolerance 1e−5. The complete state reproduces the retained batched native observations; singleton float32 operation order can introduce tiny rounding differences. Computed outputs are labelled as calculations rather than added saved observations or an edited-image accuracy study."}</Prose>

<Prose>{"The complete forward-only program makes the same operations explicit and loads the complete state strictly into the native classifier. Download the program,"}<code>{"cross-11-state.json"}</code>{" and "}<code>{"observed-reads.json"}</code>{" into one directory."}</Prose>

<CrossFlowProgram file="saved_cross_image.py" title="Complete saved cross/seed 11 NumPy and native forward, with genuine pixel edits"/>

<Prose>{"Run "}<code>{"python -B saved_cross_image.py --source 127 --question 1 --pixel 9 --value 15.375"}</code>{". The explicit path normalizes patches, applies every saved affine map, splits heads, normalizes scores, reads values, applies output/residual/LayerNorm/GELU/dense operations and normalizes 12 logits. The native path uses the same saved state with MHA and compares shares/probabilities. It performs inference only: no fit, checkpoint export or historical result rewrite. Changing "}<code>{"--question"}</code>{" selects the other learned question embedding; it does not change the pixels."}</Prose>

<H2>{"7. Count the work and the cache you actually keep"}</H2>

<Prose>{"A complete forward makes costs countable. Start with pairs of reader/donor positions. The small grids below compare two visual and three text positions; the general controls calculate large counts without allocating millions of cells."}</Prose>

<CrossPairCosts/>

<Prose>{"Dense shared-stream attention has (T+S)² candidate pairs per head. Text self-attention plus a cross read has T²+TS. At T=S the ratio is 2, not 4. For strictly causal shared positions, permitted pairs are (T+S)(T+S+1)/2; causal text plus unrestricted completed visual memory has T (T+1)/2+TS. The small grids show 15 versus 12 permitted pairs, and 25 versus 15 dense candidates. A dense kernel may still calculate masked entries; pair counts do not establish latency or full-model cost."}</Prose>

<Prose>{"One cross head's two products cost TSdₖ+TSdᵥ multiply-accumulate operations. Projection work depends on the raw/projected widths; feed-forward work is additional. Counting one multiplication and one addition separately gives roughly two FLOPs per MAC. R repeated resampler reads over S source entries and M latent entries contribute RMS pairs; D latent self-attention blocks contribute DM², before widths and other operations. Input length still matters at every repeated read; specialized attention kernels need not materialize the full share tensor."}</Prose>

<H3>{"Count retained tensors, not only image features"}</H3>

<Prose>{"During autoregressive decoding, a visual prefix commonly has projected K/V at each language layer. A separate visual memory also needs its projected K/V at each layer that reads it, unless projections are recomputed. Follow the replica stacks and optional raw-feature tensor below."}</Prose>

<CrossCachePayload/>

<Prose>{"With batch N, prefix cache layers P, visual entries S, total cached key/value width d and bytes b per scalar, the visual prefix payload is 2 NPSdb. A separate memory used at J layers with S′ entries and width d′ has projected payload 2 NJS′d′b. The leading 2 counts K and V. Raw encoder features, if retained, are a distinct N×S×feature-width tensor."}</Prose>

<Prose>{"For N 1, P 32, J 8, S 576, S′64, d=d′1024, b 2, the prefix costs 75,497,472 bytes=72 MiB; projected cross cache costs 2,097,152 bytes=2 MiB. Keeping 576 entries in the cross cache instead costs 18 MiB. The difference combines layer count and row compression. Matching all those counts removes that declared advantage. Text K/V, weights, activations, temporary kernels and overhead are outside this payload. GQA or MLA change cached-width conventions and may add positional state; use their own cache contracts rather than equating cached width with model width."}</Prose>

<H3>{"Project the memory once; do not cache the question's answer"}</H3>

<Prose>{"The supplied native cache example has five memory rows, eight coordinates, two heads and three readers. Its declared availability grows from 2 to 4 to 5 donors. Select any reader/memory coordinate or permission bit, and compare fresh versus cached reads."}</Prose>

<CrossProjectedCache/>

<Prose>{"Follow the selected native coordinate from source to return. The stacked WQ/WK/WV rows are the actual retained map rows, with eight input columns. Multiply each supplied coordinate by its weight, add the eight products, then add its retained bias. The resulting Q is computed for the new reader; K and V belong to the memory projection. The worked current coordinate, fresh cache coordinate and stored coordinate are shown separately with their identities. Select a reader, head and coordinate within that head to inspect all eight projected coordinates. Selecting a memory cell chooses the donor in the worked route; while editing a query, donor 0 supplies the comparison."}</Prose>

<Prose>{"The next stages expose each fresh score, allowed share, carried-coordinate product and sum. Join the two head reads in the same order as "}<a href={"#2-shapes-reveal-the-architecture"}>{"§2's two-head join"}</a>{", multiply by the actual WO row and add its bias to recover the displayed returned coordinate. Query edits keep the stored K/V reusable; donor edits change the current projection and require rebuilding the stored identity. The full operation is the native counterpart of "}<a href={"#2-shapes-reveal-the-architecture"}>{"§2's small affine maps"}</a>{", not a new fitted model."}</Prose>

<Prose>{"Memory supplies unchanged K/V for a fixed source/model state. Every new reader still projects Q, computes scores, normalizes its allowed donors, reads V and applies WO. Thus projected memory can be reused without reusing a question-specific answer. Storage is O (NHS (dₖ+dᵥ)); each question still reads its allowed donors."}</Prose>

<Prose>{"A cache needs explicit identity. The caller must advance source/preprocessing and parameter revisions whenever they change; this contract is not automatic proof by hashing tensors. A query-only edit keeps identity valid, but a memory edit invalidates it even if one fresh answer stays unchanged."}</Prose>

<CrossCacheInvalidation/>

<Prose>{"In the default grid, donor 4 is forbidden to readers 0/1. Editing it leaves those fresh outputs unchanged but changes reader 2 and invalidates the stored projection identity. Rebuild before using the cache. Under this declared whole-model revision contract, even a changed output map rejects the old model identity. Reversing donor rows together with their mask columns, IDs and encoded positional information preserves the read; reversing only one association can change the result."}</Prose>

<Prose>{"The complete cache program preserves the actual same-state MHA comparison, full versus streamed outputs, forbidden-edit contrast and version rejection. It is inference caching under "}<code>{"no_grad()"}</code>{", not a substitute for training's needed derivatives."}</Prose>

<CrossFlowProgram file="cross_attention_cache.py" title="Complete native memory-cache bridge and invalidation example"/>

<Prose>{""}<code>{"project_memory"}</code>{" produces K/V once from the supplied maps. "}<code>{"read_memory"}</code>{" validates current identity, projects the new Q and applies the current permissions. The retained original CPU comparison matched the full MHA call within 5.56 e−17. Reusing raw image features across layers does not imply reusing projected K/V when the layer maps differ. Paired-permutation tests belong beside full/streamed equality when adding batching or a cache layout."}</Prose>

<H3>{"Deeper:source dependencies precede projected-cache ownership"}</H3>

<Prose>{"The same boundary applies when the memory is produced by a causal language encoder. Trace its source-state dependency grid before following layer-owned projections."}</Prose>

<CrossCausalMemory/>

<Prose>{"A causal source state j depends only on the source prefix through j. A bidirectional state may contain later inputs, legitimate for a completed translation source but unsuitable for a streaming future-exclusion promise. Sharing source states across layers is valid only under the architecture, availability and version contract; different WK/WV maps still need different projected ownership. Selective replay and shared-index optimization in particular sparse systems are separate mechanisms, not consequences of this generic identity check. The "}<a href={"/learn/path/full-curriculum/long-context-sequence-models-transformer-xl-griffin-perceiver?module=deep-learning-fundamentals"}>{"Long-Context/Perceiver lesson"}</a>{" owns its full latent/repeated-read treatment."}</Prose>

<H3>{"Deeper:a deliberate common cache in YOCO"}</H3>

<Prose>{"Switch explicitly now from image memory to language-only token memory. "}<a href={"https://arxiv.org/html/2405.05254"}>{"YOCO"}</a>{" uses RMSNorm and causal permission boundaries in both the self-decoder and cross-decoder. A cross reader at token position p may read only memory states j ≤ p; the upstream encoder being causal does not permit an early reader to inspect a later state. Common WK/WV projection ownership lets cross layers share a global projected K/V cache, while each layer supplies its own queries and remaining computation."}</Prose>

<CrossYocoSharing/>

<Prose>{"The constructed numerical example now follows that RMSNorm operation: square the two coordinates, average them, add epsilon 1e−5, take the square root and divide the original coordinates; gain is fixed to 1. Unlike the constructed LayerNorm example earlier, it does not subtract the row mean. Both independent layer queries use the declared current token position; blocked later tokens receive zero share. At position 0, changing token 3 cannot change either read. At position 3, that token is available and its changed coordinate can change the reads. This is a causal ownership illustration, not a reproduced YOCO checkpoint. Its separate payload example uses one request, four entries, width 8, two-byte scalars and two cross layers:one projected K/V pair is 128 bytes; two layer-owned pairs are 256 bytes. The sharing condition is identical projection ownership and fixed valid memory, not merely the words “cross-attention”. The self-decoder's bounded-window or recurrent local caches remain separate."}</Prose>

<Prose>{"With fixed local-memory assumptions, total cache scales as O ((sequence+layers)×width), instead of a global sequence-sized projected cache per cross layer. Changing the local mechanism or retaining additional states changes the accounting. The diagram neither reproduces a YOCO checkpoint nor transfers its GPU timings to this classroom calculation. Final normalization, the shared maps, and layer-local query/residual/dense routes all belong in an implementation of the actual recipe."}</Prose>

<H2>{"8. Choose a design through its failure cases"}</H2>

<Prose>{"Start from the model's decision and available information. Reading fine text in a scanned form may need local high-resolution features; answering a broad question about a clip may tolerate stronger compression. These needs define errors and budgets to measure. First diagnose one concrete wrong route rather than rank model families."}</Prose>

<CrossBrokenRoute/>

<Prose>{"The final mask blocks the future donor, but the permitted donor already contains its source. Repairing the upstream encoder removes the future dependency. The same habit—trace data, operation, loss and state lifetime—guides the remaining checks."}</Prose>

<NeuralTable caption={"8. Choose a design through its failure cases"} headers={[<>{"Symptom"}</>,<>{"First useful check"}</>,<>{"Reason"}</>]} rows={[[<>{"Answers barely change with images"}</>,<>{"Compare a question-only baseline and meaningful image mismatches"}</>,<>{"A weak cyclic control can preserve targets"}</>],[<>{"Suspiciously tiny fitting loss"}</>,<>{"Trace shifted inputs, permitted information and supervised targets"}</>,<>{"Target leakage can look like learning"}</>],[<>{"Fine details disappear"}</>,<>{"Compare task-specific errors at controlled latent/crop budgets"}</>,<>{"Equal compressed states cannot answer different questions"}</>],[<>{"Adapter never changes"}</>,<>{"Inspect α credit and adapter credit separately"}</>,<>{"Zero initialization can block one route while permitting another"}</>],[<>{"Frozen-backbone input gets no credit"}</>,<>{"Check detach/no_grad separately from frozen weights and eval mode"}</>,<>{"Upstream trainable parameters need a recorded derivative"}</>],[<>{"Cached outputs are inconsistent"}</>,<>{"Check source/model identity, mask columns and paired positions"}</>,<>{"A fresh null effect does not validate stale projections"}</>],[<>{"Memory estimate seems too small"}</>,<>{"Count projected K/V replicas, raw features, text cache and transient buffers"}</>,<>{"One image or one feature bank is not the whole serving state"}</>],[<>{"Replaced image encoder breaks answers"}</>,<>{"Check normalization, selected layer, width and learned feature semantics"}</>,<>{"Equal shapes do not establish representation compatibility"}</>],[<>{"Sharp heatmap is called an explanation"}</>,<>{"Inspect values, residual routes and actual interventions"}</>,<>{"Mixing shares alone do not prove causal attribution"}</>]]} />

<Prose>{"Query-based output construction also appears in set-prediction detectors:learned object queries request a fixed collection of candidate outputs from image memory. Structured decoders can use location queries for outputs at particular coordinates. Query count sets the output slots, not source count. Learning distinct useful queries and matching outputs to targets are separate training problems; matrix multiplication does not grant either automatically."}</Prose>

<Prose>{"For video, ask how frames are sampled, time is represented, which frames are available, and whether one latent bank summarizes each frame or the whole clip. For documents, several crops may represent one page. For repeated questions about a fixed image, unchanged visual projections can be reused; question-conditioned resampling, preprocessing changes and model changes require their own invalidation."}</Prose>

<Prose>{"Begin production evaluation with a fully inspected example:exact preprocessing, image-token counts, permissions, supervised positions and forward/backward shapes. Then test representative held-out tasks, corruption/mismatch behavior, and actual memory/latency on the intended device and batch. Quantization, batching and kernels require their own measurements. None of the tiny digit scores identifies a universally best production vision-language architecture."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"9. Practice, hints and solutions"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A changed rectangular read — core"}</H3>

<Prose>{"Use first-query weights (1/2,1/4,1/4), but change the values to (4,0),(0,2),(2,6). Compute the output. Then forbid the first donor (row0) and recompute from the original scores, not by retaining weights that sum to 1/2."}</Prose>

<details><summary>Hint</summary>

<Prose>{"After forbidding the score log 2, the two remaining scores are both zero."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The original output is (2.5,2). After masking donor 0, donors 1 and 2 each receive 1/2, giving (1,4). Dropping a term without renormalizing would incorrectly give (.5,2)."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Repair the shape contract — core"}</H3>

<Prose>{"A reader has 7 positions of width 48, memory has 11 positions of width 80, and there are 4 heads each with key width 12 and value width 8. State the weight shape per example, concatenated output shape, and final projection needed for a residual addition."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The value width determines a head’s output width; the query count determines its length."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Weights 4×7×11; head outputs 7×8; concatenation 7×32; an output projection 32→48 gives 7×48 to add to the reader. Project memory 80→12 for keys and 80→8 for values per head. Nothing requires replacing the 11 memory positions by 7."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Two masks, two purposes — core"}</H3>

<Prose>{"An answer is “three birds”. Draw the information available when predicting “three” and “birds”. A colleague removes the question from the loss but uses bidirectional attention over the entire answer. Explain the remaining error and repair it."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether a prediction can already read its target or future answer."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The first target uses image, question and answer-start state; the second additionally uses “three”. Excluding question positions from supervision does not hide future answer tokens. Shift inputs/targets and use the appropriate causal answer access mask while keeping image/question context available. Verify the encoder or packed examples do not introduce another leakage route."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. A gate that can and cannot start — core"}</H3>

<Prose>{"Set X=2, F=−1, target 0 and squared loss ½Y². At α=0 find the loss and gate gradient. What happens after one gradient step of size.1? What would change if F=0?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"At zero, sech²α=1; the gate derivative is residual error times F."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Y=2, loss 2, gate gradient−2. The update gives α=.2, so Y=2−tanh (.2)≈1.8026 and loss≈1.6247. If F=0, the gate gradient is zero and this route does not open on that step. A separate training path could still update F; do not assume one exists."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Design a valid image-use test — core"}</H3>

<Prose>{"Your model scores 92% on questions derived from images, but the training split was made after creating multiple questions per image. Design the corrected split, two baselines or diagnostics, and the conclusion you would avoid even if the model still scores 92%."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The unit that must stay together is the underlying observation, not the question row."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Group all variants of an image before splitting; also group known near-duplicates or shared acquisition units when required. Fit all learned preprocessing only on fitting data. Compare question-only and a simple image-plus-question model; inspect mismatched images as a diagnostic. Report question-type counts and errors. High accuracy on this task does not establish general visual reasoning, new-writer generalization or a faithful attention explanation."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. A cache comparison — deeper"}</H3>

<Prose>{"One request has 256 visual tokens,24 language layers,6 visual-read layers, cached K/V width 512 and 2-byte scalars. Compare visual prefix storage with cross-attention storage when both keep all 256 tokens, and when cross-attention uses 32 latents. Exclude raw features and text caches explicitly."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count both K and V at every layer where they are stored."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Prefix:2×24×256×512×2=12,582,912 bytes=12 MiB. Cross with 256:3 MiB. Cross with 32:.375 MiB. The first ratio comes from layer count; the second adds 8-fold compression. This arithmetic does not say which architecture gives adequate answers or faster wall-clock execution."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Can later attention recover a missing detail? — deeper"}</H3>

<Prose>{"Two memories contain scalar values (0,4) and (1,3). A compressor stores only their unweighted mean. Construct a question for which the compressed memories are insufficient, and describe one modification that preserves the needed information."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask for a statistic that differs despite equal means."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"“What is the maximum?” distinguishes 4 from 3; both stored means are 2. Any deterministic downstream reader receiving only that identical state must give the same answer. Preserve the two slots, or store a sufficient representation for the specified question, such as maximum as an additional feature. Increasing downstream depth alone cannot reconstruct a distinction erased from its only input."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Read a model claim critically — deeper"}</H3>

<Prose>{"A report says “our model uses interleaved inputs, so it contains no cross-attention; its gate starts at zero, so it cannot forget language; its heatmap proves which image object caused the answer.” Rewrite those three claims into testable statements."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate input format, initialization and attribution evidence."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Specify the actual fusion blocks and masks independently of input ordering. Zero initialization makes the inserted residual identity under the stated conditions at initialization; later language retention needs measurement. Attention weights describe mixing in one operation; causal attribution requires additional interventions and analysis of alternative paths. Neither a model name nor a visually sharp row settles those questions."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. A silent key and an active value — deeper"}</H3>

<Prose>{"Return to reader 0 of the constructed read with half-square target (.5,2.5). Explain why donor 2 has zero key credit but value credit (.25,−.25). Then change its value from (2,2) to (3,2). Does the same cancellation survive?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the donor's share credit G·V, then subtract the share-weighted row average before multiplying by its share."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Initially G=(1,−1). Donor share credits are 2,−4,0, whose share-weighted average is 0. Donor 2 therefore has zero score/key credit, while its nonzero share.25 sends.25 G to V. After changing V 2 to (3,2), the answer becomes (1.75,1.5), so G=(1.25,−1). Share credits are 2.5,−4,1.75; their weighted average is.6875. Donor 2 score credit becomes.25(1.75−.6875)=.265625, and its key credit is (.265625,0). Value credit is now (.3125,−.25). Matching and carrying derivatives serve different jobs."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Bridge two Boolean mask APIs — deeper"}</H3>

<Prose>{"Use the intended 2×3 allowed grid[[True, True, False],[True, True, True]]. State the Boolean mask passed to SDPA and to MHA. What happens if the allowed grid is passed directly as MHA's blocked mask?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Read each API's True meaning; do not infer it from the word mask."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"SDPA receives the allowed grid. MHA receives[[False, False, True],[False, False, False]]. Wrong polarity makes reader 0 use only donor 2 and reader 1 block every donor. The latter has no defined mixture under the program's explicit nonempty-row contract. Match the same state and dropout/evaluation behavior when comparing outputs, not merely equal tensor shapes."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"10. What to read or watch next"}</H2>

<ul><li>{""}<a href={"https://arxiv.org/html/2204.14198"}>{"Flamingo’s primary paper"}</a>{": read §2 and AppendixA.1 for visual processing, gated insertion and image masking. Its experiments are historical results under the paper’s training setup. The appendix is particularly useful for seeing how the resampler differs from an ordinary cross-attention block."}</li><li>{""}<a href={"https://proceedings.mlr.press/v202/li23q/li23q.pdf"}>{"BLIP-2’s primary paper"}</a>{": start with §§3.1–3.3 and Figures 2–3 to follow mask choices and the two-stage connection. Use it when the training objective is the confusing part of the architecture."}</li><li>{""}<a href={"https://arxiv.org/pdf/2304.08485"}>{"Visual Instruction Tuning"}</a>{": §§4.1–4.2 connect an intentionally simple projection to supervised response tokens. Useful alongside the answer-shift exercise."}</li><li>{""}<a href={"https://arxiv.org/pdf/2405.02246"}>{"What matters when building vision-language models?"}</a>{": §§2–3 distinguish input fusion, pooling, backbone adaptation and evaluation. Read the experimental controls before interpreting an architecture ranking."}</li><li>{""}<a href={"https://samuelalbanie.com/digests/2022-05-flamingo/"}>{"Samuel Albanie’s Flamingo video digest and slides"}</a>{": an alternate spoken/visual route into the architecture. Compare the illustrated routes with the paper after completing §3."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.MultiheadAttention.html"}>{"PyTorch2.14 MultiheadAttention documentation"}</a>{": consult query/key/value shapes, batch conventions, masks and returned head weights when modifying the program. API mask conventions must be checked rather than inferred from the word “mask”."}</li></ul>

<ul><li>{""}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html"}>{"D2L: Bahdanau attention"}</a>{" and "}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html"}>{"Transformer"}</a>{": an alternative written route from a fixed summary to a requested context, then encoder/decoder composition. The additive scoring form differs from the scaled dot product here; identify the shared reader/memory roles."}</li><li>{""}<a href={"https://nlp.seas.harvard.edu/2018/04/03/attention.html"}>{"Harvard's Annotated Transformer"}</a>{": trace projections, head assembly and decoder memory calls in runnable historical code. Its code uses pre-normalization while its architecture prose describes post-normalization; choose one explicit placement. Adapt dated masks/APIs deliberately."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html"}>{"PyTorch2.14 SDPA documentation"}</a>{": check projected dimensions, Boolean allowed masks, dropout and non-square causal alignment alongside the same-state MHA bridge."}</li><li>{""}<a href={"https://arxiv.org/html/2405.05254"}>{"YOCO primary paper"}</a>{": §§2.1–2.3 explain final normalized self-decoder memory, shared K/V ownership and local/global cache distinctions. Read its assumptions and experiments separately from the small payload arithmetic here."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H3>{"Implementation files"}</H3>

<CrossFlowFiles/>

<Prose>{"The two new programs use NumPy and CPU PyTorch. For saved inference, put "}<code>{"saved_cross_image.py"}</code>{", "}<code>{"cross-11-state.json"}</code>{" and "}<code>{"observed-reads.json"}</code>{" in the same directory. For the historical fitting study, keep "}<code>{"digits-400.csv"}</code>{" beside "}<code>{"cross-attention-study.py"}</code>{". "}<code>{"calculated-inputs.json"}</code>{" retains all old fixed outcomes and settings; "}<code>{"cross_attention_cache.py"}</code>{" supplies the native cache example. Copy/Download controls accompany each visible program; data/state links above supply their companions."}</Prose></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Check readiness and continue"}</H3>

<Prose>{"You are ready to continue when you can follow a query through scores, masking, values, residual update and supervised target, and explain one failure that each step can introduce. The next module topic is "}<a href={"/learn/path/full-curriculum/message-passing-graph-convolutions-gcn-gat-graphsage?module=deep-learning-fundamentals"}>{"Message Passing & Graph Convolutions"}</a>{". It extends the idea of gathering information from selected neighbors: the neighbor structure becomes an explicit graph, and the questions become which edges are available, how messages are combined and what should stay unchanged when nodes are relabeled."}</Prose></section>
</CrossCacheProvider></CrossStudyProvider></CrossFlowProvider></div>};
