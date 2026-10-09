// Generated from immutable content by scripts/render-soft-prompt-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { SoftTable as NeuralTable } from '../../components/lesson-labs/SoftPromptShared.jsx';
import { SoftSharedBase, SoftThreeChoices, SoftVectors, SoftPositions, SoftProjection, SoftReadout, SoftBackward, SoftFullDecoder, SoftTrainingGeneration } from '../../components/lesson-labs/SoftPromptFoundations.jsx';
import { SoftLayerMemory, SoftMemoryMask, SoftZeroMemory, SoftWorkCounts } from '../../components/lesson-labs/SoftPromptMemory.jsx';
import { SoftMlpEncoder, SoftLstmEncoder, SoftMaterialization, SoftInfix, SoftTokenHead, SoftHeadGradient } from '../../components/lesson-labs/SoftPromptEncoders.jsx';
import { SoftNativeRoutes, SoftCache, SoftExperiment, SoftSelection, SoftOutcomes, SoftPredictions, SoftArtifactRouting } from '../../components/lesson-labs/SoftPromptEvidence.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="soft-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/p-tuning/' + file}
    language="python" title={file} filename={file} />
);
function SoftPromptLesson() {
  return <div className="lesson-flow soft-flow">
    <section>
    <Prose opening="summary">{
      "Suppose one language model must support several tasks. One task labels a verse's sentiment; " +
      "another extracts names. Keeping a full model copy for every task can repeat millions of " +
      "identical numbers. Can we keep those shared weights fixed and learn a much smaller " +
      "task-specific input instead?"
    }</Prose>
    
    <Prose opening="route">{
      "We will trace an answer loss back to a continuous prompt, implement both input prompts and " +
      "per-layer attention memory, and examine how the parameter-efficient fine-tuning library, " +
      "PEFT, saves adapters and generates outputs. A real experiment adapts a public pretrained " +
      "model to the same three-label verse problem used in "
    }<a href={"/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models"}>{"Supervised Fine-Tuning"}</a>{
      ". Its outcome is instructive: every selected adapter learns a valid label format, but " +
      "predicts the majority class for every test example. Smaller trainable state is a useful " +
      "engineering choice; it is not itself evidence of useful task learning."
    }</Prose>
    
    <Prose opening="prerequisites">{"The "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"causal language-modeling lesson"}</a>{
      " supplies the complete decoder reused here. We refresh attention and target alignment before " +
      "modifying it. Read sections 1–6 for the core mechanism, then 10–13 for ordinary use and " +
      "evidence. Sections 7–9 explain encoder, placement and token-classification variants in the " +
      "same visible reading flow."
    }</Prose>
    
    <span id="1-start-with-the-problem" aria-hidden="true" />
    <H2>{"1. Freeze the weights, keep the derivative path"}</H2>
    
    <Prose>{"A sentiment demonstration supplies a prompt containing a verse and an answer such as "}<code>{" positive"}</code>{
      ", followed by an end-of-sequence token, EOS. In full-model SFT, the answer loss can update " +
      "the model's attention, feed-forward, embedding and output parameters. Here we keep those " +
      "values fixed and add trainable task state. Choosing a different trainable subset does not " +
      "change which answer is the target or which prefix the model may see."
    }</Prose>
    
    <SoftSharedBase />
    
    <Prose>{
      "Call the fixed base parameters θ and the new task parameters φ. The model's answer " +
      "distribution is πθ,φ. We minimize the selected response loss with respect to φ while holding " +
      "θ constant:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\mathcal L(\\phi)=-\\frac1N\\sum_{t\\in\\mathcal T}\n" +
      "\\log\\pi_{\\theta,\\phi}(y_t\\mid x,y_{<t}),\\qquad \\theta\\text{ fixed}."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The set of target positions is 𝒯 and N is its positive size. A response-only loss includes " +
      "the answer and its genuine EOS; it does not supervise the input instruction. The instruction " +
      "still affects the answer through attention. This is the same supervision distinction as SFT, " +
      "with a different optimizer parameter list."
    }</Prose>
    
    <SoftThreeChoices />
    
    <Prose>{
      "Freezing a matrix is not the same as refusing to differentiate through its operation. For a " +
      "simple row vector p and fixed matrix W, h=pW still has ∂ℒ/∂p=(∂ℒ/∂h)Wᵀ. We do not need ∂ℒ/∂W " +
      "to compute that expression. PyTorch's "
    }<code>{"requires_grad_(False)"}</code>{
      " on base parameters expresses the first choice. Wrapping the entire prompt-dependent forward " +
      "pass in "
    }<code>{"torch.no_grad()"}</code>{" makes the second choice and prevents this training path."}</Prose>
    
    <Prose>{"Likewise, "}<code>{"eval()"}</code>{
      " controls modules such as dropout; it does not switch autograd off. Our deterministic CPU " +
      "study uses evaluation mode with gradients enabled. At inference, no gradients are needed, so "
    }<code>{"no_grad()"}</code>{
      " is appropriate. Keep these three questions separate: which targets count, which context is " +
      "visible, and which parameter values may change."
    }</Prose>
    
    <span id="2-build-the-intuition" aria-hidden="true" />
    <H2>{"2. Store a vector without choosing a vocabulary token"}</H2>
    
    <Prose>{
      "A discrete prompt contains token IDs. Each ID selects one row of the model's existing " +
      "vocabulary embedding table. A soft prompt instead stores new vectors directly. With m " +
      "virtual positions and hidden width d, its matrix P has shape m×d. A row of P need not equal " +
      "any vocabulary embedding and need not decode to a natural-language word."
    }</Prose>
    
    <SoftVectors />
    
    <Prose>{"For a prefix input prompt, concatenate P before the real token embeddings:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"H^{(0)}=[P;E(x_0);\\ldots;E(x_{n-1})]+\\text{position information}."}</MathBlock>
    </div>
    
    <Prose>{
      "The result contains m+n rows. The base processes the virtual rows as part of its input " +
      "sequence. A learned positional-embedding decoder uses expanded indices; a rotary-position " +
      "decoder has its own position/cache convention. Neither permits us to insert rows and forget " +
      "their effect on positions."
    }</Prose>
    
    <Prose>{"Consider two virtual rows followed by real IDs "}<code>{"BOS Q A EOS"}</code>{". Expanded input positions are "}<code>{"P0 P1 BOS Q A EOS"}</code>{
      ", indexed 0 through 5. The row for Q at index 3 predicts A at index 4; A at index 4 predicts " +
      "EOS at index 5. Only those two target terms are selected. P0, P1, BOS and Q have ignored " +
      "target labels."
    }</Prose>
    
    <SoftPositions />
    
    <Prose>{
      "The phrase “ignore a prompt position” must therefore name what is ignored. Its target loss " +
      "is ignored; its embedding and hidden states can still influence later predictions. A causal " +
      "mask permits earlier virtual positions to affect later real rows. It blocks future real " +
      "targets just as in ordinary causal LM training. The input prompt is shared across examples " +
      "of a task; it is not a separate learned answer vector for every training row."
    }</Prose>
    
    <Prose>{
      "Changing a soft row can change the answer distribution while the vocabulary table remains " +
      "byte-for-byte fixed. Finding that row's nearest vocabulary token does not explain the " +
      "complete behavior: its position, other prompt rows and interactions across layers all " +
      "matter. Learned vectors are an interface to the model, not a recovered human-readable " +
      "instruction."
    }</Prose>
    
    <Prose>{
      "Those vectors need an initial value before gradient descent. Random rows, copied vocabulary " +
      "embeddings and encoder-generated rows start at different functions. Copying meaningful token " +
      "embeddings may supply a useful starting scale or content in some settings; it does not " +
      "constrain later rows to stay on vocabulary entries. The original prompt-tuning experiments " +
      "studied these choices with T5 and its stated pretraining/task conditions. Our comparison " +
      "declares its own initialization and tests equal starting vectors where that equality is part " +
      "of the question."
    }</Prose>
    
    <span id="3-make-the-idea-precise" aria-hidden="true" />
    <H2>{"3. Follow one attention calculation all the way backward"}</H2>
    
    <Prose>{
      "Before adapting a full Transformer, isolate one real query that can read two prompt rows and " +
      "two real context rows. This small calculation uses fixed numbers, not a trained sentiment " +
      "model. Row vectors have two coordinates. The real query is q=[0.6,−0.2]; the prompt rows are " +
      "[0.2,−0.4] and [0.5, 0.1]. The real rows are [0.4, 0.7] and [−0.3, 0.5]."
    }</Prose>
    
    <SoftProjection />
    
    <Prose>{"Use fixed projection matrices"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"W_K=\\begin{bmatrix}.8&-.3\\\\.2&.6\\end{bmatrix},\\quad\nW_V=\\begin{bmatrix}.7&.1\\\\-.4&.9\\end{bmatrix}."}</MathBlock>
    </div>
    
    <Prose>{
      "For the first prompt row, pW_K=[0.08,−0.30] and pW_V=[0.30,−0.34]. The same p changes both " +
      "the key used to decide attention weight and the value returned when that row receives " +
      "weight. A control that changed those two objects independently would be a different " +
      "parameterization."
    }</Prose>
    
    <Prose>{
      "Concatenate prompt and real keys into K, and their values into V. Compute s=qKᵀ/√2, " +
      "a=softmax(s), and o=aV. The four scores are approximately [0.076368, 0.190919, " +
      "0.152735,−0.114551]. Their normalized weights are [0.248328, 0.278468, 0.268035, 0.205169], " +
      "summing to one. The output vector is [0.076704, 0.220308]. Every output coordinate is a " +
      "weighted sum of the corresponding value coordinate."
    }</Prose>
    
    <SoftReadout />
    
    <Prose>{
      "For this mechanism fixture, project o through C=[[0.9,−0.5],[0.3, 0.8]]. Its two class " +
      "logits are approximately [0.135126, 0.137895], yielding probabilities [0.499308, 0.500692]. " +
      "If class 0 is the target, cross-entropy is −log(0.499308)=0.694532. The classifier is a " +
      "small way to finish the attention-to-loss chain; it is not the full vocabulary head of the " +
      "later language model."
    }</Prose>
    
    <Prose>{
      "Let a bar over a quantity denote its derivative from the loss. Softmax followed by " +
      "cross-entropy gives z̄=softmax(z)−onehot(target), so for class 0 the logit derivative is " +
      "[−0.500692, 0.500692]. Then ō=z̄Cᵀ. The attention backward pass is"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\bar V=a^\\top\\bar o,\\quad \\bar a=\\bar oV^\\top,\\quad\n" +
      "\\bar s=a\\odot\\left(\\bar a-\\sum_j a_j\\bar a_j\\right),\\quad\n" +
      "\\bar K=\\bar s^\\top q/\\sqrt2."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The subtraction in the softmax derivative matters: increasing one score also reduces the " +
      "other weights because they share a denominator. Each value gets its attention weight times " +
      "the output derivative. Each key gets its score derivative times the fixed query. For prompt " +
      "rows, add the two paths:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\bar P=\\bar K_PW_K^\\top+\\bar V_PW_V^\\top."}</MathBlock>
    </div>
    
    <SoftBackward />
    
    <Prose>{
      "For the first prompt row, the key path contributes approximately [−0.028142, 0] and the " +
      "value path [−0.115632, 0.125579]. Their sum is [−0.143775, 0.125579]. The second row's " +
      "derivative is [−0.149193, 0.140821]. A step P←P−0.2 P̄ produces rows [0.228755,−0.425116] " +
      "and [0.529839, 0.071836]; the new class 0 loss is 0.678875. A zero learning rate preserves P " +
      "and its loss exactly. Changing the target to class 1 reverses the direction of this " +
      "two-class error, while the original forward calculation remains the same."
    }</Prose>
    
    <Prose>{
      "This derivation has one real, fixed query. Its selected loss has no prompt-query path. A " +
      "full Transformer does: virtual rows can produce queries, later layers can use their changed " +
      "hidden states, and multiple positions can contribute loss. The next program's autograd " +
      "follows all those dependencies rather than pretending this one-row derivative is the entire " +
      "network backward pass."
    }</Prose>
    
    <Prose>{"To run the complete programs, extract the "}<a href={"/learn-code/p-tuning/p-tuning.zip"}>{"source and observation packet"}</a>{" into a fresh directory and follow the "}<a href={"/learn-code/p-tuning/README.md"}>{"setup README"}</a>{
      ". The mechanism uses Python 3.12, NumPy 2.3.5 and Torch 2.14.0; the native routes also use " +
      "Transformers 5.19.0, PEFT 0.21.2, Tokenizers 0.23.2, Accelerate 1.15.0 and Safetensors " +
      "0.8.0. A CPU is sufficient."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python -m venv .venv\n" +
      "# Activate .venv with your platform's activation command before continuing.\n" +
      "python -m pip install numpy==2.3.5 torch==2.14.0 transformers==5.19.0 peft==0.21.2 " +
      "tokenizers==0.23.2 accelerate==1.15.0 safetensors==0.8.0\n" +
      "python soft_attention.py --output attention.json"
    }</CodeBlock>
    
    <Prose>{""}<code>{"soft_attention.py"}</code>{
      " implements the forward and backward equations in NumPy. The input route projects P into " +
      "K/V; the direct-memory route accepts K/V as separate parameters. It compares every prompt " +
      "and direct-K/V derivative with central finite differences and Torch autograd for both target " +
      "classes: 24 coordinate checks in total. Inspect "
    }<code>{"d_prompt_key_path"}</code>{" and "}<code>{"d_prompt_value_path"}</code>{
      " to see why the input-row gradient is a sum. Stable softmax subtracts the largest score " +
      "before exponentiating without changing the distribution. The output file records the " +
      "complete intermediate arrays."
    }</Prose>
    
    <Program file="soft_attention.py" />
    
    <span id="4-from-scratch-implementation" aria-hidden="true" />
    <H2>{"4. Put the prompt inside a complete decoder"}</H2>
    
    <Prose>{"An attention calculation alone cannot demonstrate language-model adaptation. The complete "}<code>{"SoftDecoder"}</code>{
      " wraps the exact TinyLM used in the causal-LM lesson. It reuses its embeddings, two " +
      "pre-normalized residual blocks, attention output projections, feed-forward networks, final " +
      "normalization and vocabulary head. Only the added prompt or prefix state is trainable."
    }</Prose>
    
    <SoftFullDecoder />
    
    <Prose>{
      "The input route inserts m learned rows into the embedding tensor, expands the valid-key " +
      "mask, assigns position embeddings, then performs every block. In a pre-normalized block, " +
      "normalized states form Q/K/V; the attention output is added to the old states, and the " +
      "feed-forward output is added through a second residual path. Both residual branches are " +
      "needed for the prompt's actual effect. The wrapper gathers only real-position logits before " +
      "returning them."
    }</Prose>
    
    <Prose>{"That return convention differs from a library wrapper that returns all virtual and real rows. Here "}<code>{"selected_loss"}</code>{
      " receives labels already aligned to real predictor positions. For real inputs [1, 2, 3, 4], " +
      "labels [−100,−100, 4, 5] select the row seeing [1, 2, 3] to predict 4 and the row seeing [1, " +
      "2, 3, 4] to predict 5. Do not shift those labels again. In an ordinary language-model API, " +
      "labels instead sit at target positions and the model shifts internally. Both can be correct; " +
      "mixing them is an off-by-one training bug."
    }</Prose>
    
    <SoftTrainingGeneration />
    
    <Prose>{
      "During teacher forcing, the true earlier answer tokens are context for later targets. During " +
      "generation, append the model's selected next ID and recompute from the growing prefix; the " +
      "supplied answer is absent. The program's simple "
    }<code>{"greedy"}</code>{
      " is a small same-length mechanism helper. The later study uses the complete length-aware " +
      "evaluator for EOS and per-example stopping."
    }</Prose>
    
    <Prose>{"Run "}<code>{"python soft_decoder.py --output decoder.json"}</code>{
      ". Its random width 8, two-head, two-layer model has vocabulary 11 and context 24. Two input " +
      "rows add 16 trainable numbers. One SGD step of 0.01 changes selected loss from 1.6085210054 " +
      "to 1.6085169762, with gradient norm 0.0200727. This small decrease proves an executed " +
      "differentiable update; it does not measure pretrained task quality."
    }</Prose>
    
    <Prose>{
      "The program verifies the base tensors stay exact, their gradients stay absent, future-token " +
      "edits do not affect earlier outputs, right-padding does not change real outputs, and m=0 " +
      "exactly recovers the base. These tests distinguish a prompt mechanism from an accidental " +
      "full-model update or a leaking mask."
    }</Prose>
    
    <Program file="soft_decoder.py" />
    
    <Prose>{"The bundled "}<code>{"tiny_causal_lm.py"}</code>{
      " is the complete unchanged prerequisite file. Importing its model does not run its training " +
      "experiment. The wrapper exposes every changed forward operation so that its altered masks " +
      "and positions remain inspectable rather than hidden behind an incomplete example."
    }</Prose>
    
    <Program file="tiny_causal_lm.py" />
    
    <span id="6-visual-walkthrough" aria-hidden="true" />
    <H2>{"5. Give each layer its own attention memory"}</H2>
    
    <Prose>{
      "Input prompts must travel through the lower frozen blocks before they can influence deeper " +
      "attention. Another interface supplies learned keys and values directly to each layer. For " +
      "layer ℓ, let Kᵖℓ and Vᵖℓ contain m memory rows. The real token states still produce their " +
      "ordinary Qℓ, Kℓ, Vℓ."
    }</Prose>
    
    <SoftLayerMemory />
    
    <Prose>{"The attention operation becomes"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "A_\\ell=\\operatorname{softmax}\\left(\n" +
      "Q_\\ell[K^p_\\ell;K_\\ell]^\\top/\\sqrt{d_h}+M_\\ell\\right),\\quad\n" +
      "O_\\ell=A_\\ell[V^p_\\ell;V_\\ell]."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The head width is d_h. The mask M permits every declared prefix key and only causally " +
      "available, valid real keys. With n real queries, the score matrix has n rows and m+n " +
      "columns. Attention still returns n output rows. Added memory changes what a real query can " +
      "read; it does not create m additional real predictions or require a feed-forward update for " +
      "virtual query rows. In the additive mask, an allowed entry is zero and a blocked entry is " +
      "−∞, which gives it zero softmax weight. Every real query must retain a visible key."
    }</Prose>
    
    <SoftMemoryMask />
    
    <Prose>{
      "For three real rows and two prefix rows, query 0 can read both prefix rows and real row 0. " +
      "It cannot read real rows 1 or 2. Query 2 can read all five columns if the three real rows " +
      "are valid. Prefix vectors have no future answer content unless the application improperly " +
      "supplies it; they are task parameters learned from training examples, not per-example copies " +
      "of the desired answer."
    }</Prose>
    
    <Prose>{"In "}<code>{"SoftDecoder"}</code>{", the "}<code>{"kv"}</code>{
      " route stores one tensor with shape [layers, 2, m, width]. The size 2 axis distinguishes K " +
      "from V. It reshapes width into heads×head_width and concatenates on the key-position axis. " +
      "The normalized real states, residuals and feed-forward networks remain the original blocks. " +
      "With two layers, width 8 and m=2, the route trains 64 numbers. Its separate random fixture " +
      "step changes loss 2.0184533875 to 2.0184246665. This different initial function should not " +
      "be ranked against the input fixture's loss."
    }</Prose>
    
    <SoftZeroMemory />
    
    <Prose>{
      "Zero memory is not absent memory. If Kᵖ=0, each added score is zero and contributes exp(0)=1 " +
      "to the softmax denominator. If Vᵖ=0 too, those rows return zero values but still take " +
      "attention mass from real rows. In section 3's class 1 fixture, removing the prefix gives " +
      "output [−0.177765, 0.561607] and loss 0.462977. Keeping two zero K/V rows gives [−0.090127, " +
      "0.284734] and loss 0.567863. The two extra weights are each 0.246501."
    }</Prose>
    
    <Prose>{
      "The key and value derivatives remain separate trainable paths. Direct K/V does not multiply " +
      "them back through W_K/W_V to a shared P row. A prefix encoder can introduce such coupling " +
      "through a different network, which we will examine after counting the state and work this " +
      "interface requires."
    }</Prose>
    
    <Prose>{
      "The explicit decoder keeps real learned-position indices unchanged on its KV route and " +
      "prepends memory after real Q/K/V projection. A native decoder can instead incorporate prefix " +
      "length into position or cache handling. The attention-memory idea does not force those " +
      "conventions to be identical. Likewise, an encoder-decoder model has encoder attention, " +
      "decoder self-attention and cross-attention interfaces; the original prefix-tuning paper and " +
      "a particular library may support different subsets. Check the actual module and position " +
      "contract instead of treating every “prefix” API as the same architecture."
    }</Prose>
    
    <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
    <H2>{"6. Count parameters, positions and work separately"}</H2>
    
    <Prose>{
      "For a flat input prompt, the trainable count is md. For direct attention memory at L layers, " +
      "with h_kv key/value heads each of width d_h, it is 2Lmh_kv d_h. Ordinary multi-head " +
      "attention has h_kv d_h=d, giving 2Lmd. Grouped-query attention can have fewer KV heads than " +
      "query heads; count the stored KV width, not the number of queries reading it."
    }</Prose>
    
    <SoftWorkCounts />
    
    <Prose>{
      "With d=128, L=6, m=8 and four ordinary heads, flat input has 1024 numbers and direct K/V has " +
      "12288. At four bytes per float32 value their raw tensor payloads are 4096 and 49152 bytes. A " +
      "serialized artifact also stores names, shapes and metadata; its on-disk size is not exactly " +
      "that arithmetic. An encoder used during training can have many more parameters than its " +
      "materialized prompt. In the completed study, each flat or materialized-MLP "
    }<code>{"adapter_model.safetensors"}</code>{
      " file occupies 4,216 bytes; each direct-KV tensor file occupies 49,272 bytes. These measured " +
      "file sizes exclude the separate configuration, model card, training checkpoint and shared " +
      "base."
    }</Prose>
    
    <Prose>{
      "Input prompts create n+m query rows as well as keys/values. A dense attention matrix " +
      "contains (n+m)² entries per head per layer. Direct K/V has n(m+n) entries, because only real " +
      "queries are evaluated. At n=32, m=8 these are 1600 and 1280, compared with 1024 without " +
      "either prompt. The masks determine which entries contribute, and an implementation may " +
      "exploit them differently."
    }</Prose>
    
    <Prose>{
      "These counts explain one source of work; they are not timing predictions. Input rows also " +
      "incur layer normalization, projections and feed-forward work. Training retains activations " +
      "needed to differentiate into the prompt even when base weight gradients are absent. " +
      "Optimizer state for trainable parameters, batch size, attention kernels, precision and " +
      "recomputation affect memory and time. Serving caches retain prefix keys/values too. Sharing " +
      "a frozen base saves repeated task weight copies; it does not make the base or backward " +
      "computation disappear."
    }</Prose>
    
    <H2>{"7. Optimize an encoder that produces the prompt"}</H2>
    
    <Prose>{
      "So far each entry of P is a parameter. We can instead optimize latent rows Eφ and a small " +
      "network gφ, with P=gφ(Eφ). The answer loss still receives the materialized prompt P; the " +
      "optimizer now moves the encoder and latent rows. The chain rule multiplies the prompt " +
      "derivative by the encoder's Jacobian. Two parameterizations can therefore start with " +
      "identical P and identical predictions yet take different updates."
    }</Prose>
    
    <SoftMlpEncoder />
    
    <Prose>{
      "The native MLP used here applies three linear maps with ReLU after the first two: " +
      "128→32→32→128. ReLU keeps a positive coordinate and replaces a negative one with zero. It " +
      "uses the same weights on every virtual row, but each output row depends only on that row's " +
      "latent vector during the forward pass. Changing latent row 1 while holding encoder weights " +
      "fixed cannot directly change output row 0. Updating shared encoder weights can change both. " +
      "Shared weights and direct cross-row dependence are different properties."
    }</Prose>
    
    <Prose>{
      "A recurrent prompt encoder provides a different dependency. An LSTM processes one virtual " +
      "position at a time while carrying a hidden state h and cell state c. For input eᵢ, affine " +
      "maps of eᵢ and hᵢ₋₁ produce four vectors:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "i=\\sigma(a_i),\\quad f=\\sigma(a_f),\\quad g=\\tanh(a_g),\\quad\n" +
      "o=\\sigma(a_o),\\qquad c_i=f\\odot c_{i-1}+i\\odot g,\\quad\n" +
      "h_i=o\\odot\\tanh(c_i)."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The input gate i chooses how much proposal g enters the cell; the forget gate f scales its " +
      "previous contents; the output gate o controls how much transformed cell state becomes h. " +
      "These are coordinatewise operations, not scalar switches. A bidirectional encoder runs one " +
      "chain left-to-right and another right-to-left, then concatenates their hidden states at each " +
      "original position. Here σ is the coordinatewise logistic sigmoid, producing values between " +
      "zero and one; tanh produces values between −1 and 1. Both directions start with zero cell " +
      "and hidden state in this program."
    }</Prose>
    
    <SoftLstmEncoder />
    
    <Prose>{
      "The backward chain must restore outputs to original position order before that " +
      "concatenation. Otherwise the result at position 0 can accidentally pair the forward state " +
      "for 0 with the backward state for the last position. The second LSTM layer consumes both " +
      "directions' outputs from the first. A final projection returns the width expected by the " +
      "base model."
    }</Prose>
    
    <Prose>{""}<code>{"soft_encoders.py"}</code>{
      " writes those gates and both directions explicitly, then compares complete outputs and every " +
      "parameter gradient with "
    }<code>{"torch.nn.LSTM"}</code>{
      " using copied parameters. The native gate order is i, f, g, o. Distinct weights on each " +
      "output coordinate make the gradient test more informative than a symmetric sum. Its small " +
      "float64 fixture perturbs one latent row: only that MLP output row changes, whereas all three " +
      "BiLSTM output rows change. These observations test the dependency structure, not an " +
      "empirical claim that recurrence wins."
    }</Prose>
    
    <CodeBlock language={"bash"}>{"python soft_encoders.py --output encoders.json"}</CodeBlock>
    
    <Program file="soft_encoders.py" />
    
    <Prose>{
      "Once training finishes, evaluate gφ once and store its output P. If the same base receives " +
      "the same materialized tensor under the same inference operations, it does not need the " +
      "prompt encoder to regenerate P on every request. This is "
    }<strong>{"materialization"}</strong>{": exporting the values consumed by the base, rather than every parameter that produced them."}</Prose>
    
    <SoftMaterialization />
    
    <Prose>{
      "An eight-row, width 128 MLP prompt has 10,432 training parameters but only 1,024 " +
      "materialized input numbers. The corresponding BiLSTM recipe has 80,064 training parameters. " +
      "This does not mean the MLP optimizer has the same memory or update geometry as optimizing " +
      "1,024 flat numbers. An inference prompt also does not contain the original encoder weights, " +
      "Adam moments or RNG state needed to resume its training. Preserve a separate training " +
      "checkpoint for that purpose."
    }</Prose>
    
    <Prose>{
      "The original P-Tuning work motivated an encoder parameterization and explored different " +
      "prompt placements. It does not establish that an encoder avoids all local minima. " +
      "Initialization, task, backbone and optimization settings matter; the controlled flat/MLP " +
      "comparison later keeps the initial materialized prompt exactly equal so that this " +
      "distinction is observable."
    }</Prose>
    
    <H2>{"8. Place learned rows where the task supplies a gap"}</H2>
    
    <Prose>{
      "An input prefix is one placement. Original P-Tuning also used continuous spans among " +
      "discrete context and anchor tokens. For example, an input can contain real text, then soft " +
      "rows, then an anchor and a position whose prediction is supervised. The exact order " +
      "determines which information can reach that prediction."
    }</Prose>
    
    <SoftInfix />
    
    <Prose>{
      "In a causal model, a soft row inserted strictly after a selected predictor cannot influence " +
      "that predictor. "
    }<code>{"SoftDecoder"}</code>{
      " makes the original-to-expanded position map explicit. Its fixture inserts two rows after " +
      "real position 2 and backpropagates from real predictor 1; the prompt gradient is exactly " +
      "zero. Inserting before that predictor produces a nonzero gradient. This is a causal mask " +
      "consequence, not evidence that the later prompt is badly initialized."
    }</Prose>
    
    <Prose>{
      "The fixture deliberately attaches targets to selected real predictor rows. If an infix is " +
      "placed between a real predictor and the token it normally predicts, ordinary " +
      "expanded-sequence next-token labeling would instead use the last intervening virtual row. " +
      "Decide which operation the task requires and build its target map explicitly; do not blindly " +
      "prepend ignored labels to an arbitrary infix sequence."
    }</Prose>
    
    <Prose>{
      "Bidirectional masked-language-model tasks have different visibility. Their prediction " +
      "position can use context on both sides, so the causal zero-gradient argument does not " +
      "automatically apply. The inspected revised original P-Tuning paper includes frozen-base LAMA " +
      "experiments and jointly tuned SuperGLUE settings. Calling every original result “a frozen " +
      "model plus a prefix” would erase both the placement and trainable-parameter distinctions."
    }</Prose>
    
    <Prose>{"PEFT's current "}<code>{"P_TUNING"}</code>{
      " causal wrapper prepends the encoder-generated rows. Its name does not promise arbitrary " +
      "original-v1 infix placement. Use the explicit construction when the task calls for an " +
      "internal span, and verify positions, visibility and target ownership before treating it as " +
      "equivalent."
    }</Prose>
    
    <H2>{"9. Predict one label per real token"}</H2>
    
    <Prose>{
      "Some tasks tag each input token instead of generating a label string. A named- entity " +
      "tagger, for example, needs one class distribution per selected real position. Deep prompt " +
      "state can influence a frozen bidirectional encoder, while a trainable task head maps each " +
      "final token vector to class logits."
    }</Prose>
    
    <SoftTokenHead />
    
    <Prose>{
      "The constructed fixture has two rows of five IDs. Labels are [−100, 0, 1, 2,−100] and [−100, " +
      "2, 1,−100,−100], so exactly five token targets contribute. The last position in the second " +
      "row is padding; the other ignored positions are special tokens. Ignored labels do not remove " +
      "valid context, while padded keys must be hidden from attention."
    }</Prose>
    
    <Prose>{
      "For a token hidden vector hᵢ of width 16, the classifier computes hᵢW+b with three outputs. " +
      "Its parameters total 16×3+3=51. Two layers of three KV prefix positions at width 16 add " +
      "2×2×3×16=192 numbers, for 243 trainable parameters. The pretrained-style encoder is frozen, " +
      "but the classifier is explicitly trainable. “The base is frozen” should not conceal a moving " +
      "head."
    }</Prose>
    
    <SoftHeadGradient />
    
    <Prose>{""}<code>{"soft_token_head.py"}</code>{" provides both a complete explicit two-layer bidirectional attention encoder and an ordinary "}<code>{"BertForTokenClassification"}</code>{" plus PEFT "}<code>{"PrefixTuningConfig(task_type=\"TOKEN_CLS\")"}</code>{
      ". Both start randomly and fit this five-target fixture for 30 updates. The explicit model " +
      "reaches loss 0.01324659; the native model reaches 0.01131616. Their architectures differ, so " +
      "this is an execution demonstration, not an accuracy comparison or a reproduction of an NLU " +
      "benchmark."
    }</Prose>
    
    <Prose>{
      "The source checks selected-target count, finite gradients on the declared groups, unchanged " +
      "frozen weights, invariant selected outputs when a padded ID changes, and native save/reload. " +
      "The native route restores the same random base state before loading the adapter; loading " +
      "onto a fresh different random base would not be a valid reload test."
    }</Prose>
    
    <CodeBlock language={"bash"}>{"python soft_token_head.py --output token-head-check"}</CodeBlock>
    
    <Program file="soft_token_head.py" />
    
    <Prose>{
      "P-Tuning v2 studied deep prompt tuning across several NLU tasks and model sizes, including " +
      "sequence tagging with task heads. Its useful prompt lengths and encoder choices varied by " +
      "setting. Deep state plus a head is a mechanism we can implement; the paper's empirical " +
      "competitiveness is a claim about its tested models, tasks and optimization choices, not a " +
      "universal guarantee."
    }</Prose>
    
    <span id="5-production-implementation" aria-hidden="true" />
    <H2>{"10. Preserve the contract in ordinary PEFT code"}</H2>
    
    <Prose>{
      "The library route uses a pinned Pythia-14M base with six layers, width 128 and four " +
      "attention heads. Load a fresh unchanged base for each configuration. "
    }<code>{"PromptTuningConfig"}</code>{" learns flat input rows; "}<code>{"PromptEncoderConfig"}</code>{" selects the MLP or LSTM encoder; "}<code>{"PrefixTuningConfig"}</code>{
      " adds per-layer KV state. Setting an encoder hidden size alone does not enable prefix " +
      "projection: the projected route explicitly sets "
    }<code>{"prefix_projection=True"}</code>{"."}</Prose>
    
    <SoftNativeRoutes />
    
    <NeuralTable caption={"10. Preserve the contract in ordinary PEFT code"} headers={[<>{"Native method"}</>,<>{"Trainable numbers in this configuration"}</>,<>{"Where the materialized state enters"}</>]} rows={[[<>{"Flat input"}</>,<>{"1,024"}</>,<>{"Eight input embedding rows"}</>],[<>{"MLP input"}</>,<>{"10,432"}</>,<>{"Eight input rows produced by a rowwise encoder"}</>],[<>{"BiLSTM input"}</>,<>{"80,064"}</>,<>{"Eight input rows produced by a recurrent encoder"}</>],[<>{"Direct prefix"}</>,<>{"12,288"}</>,<>{"K/V rows at each of six layers"}</>],[<>{"Projected prefix"}</>,<>{"55,840"}</>,<>{"An MLP produces the per-layer K/V rows"}</>]]} />
    
    <Prose>{
      "For the actual two-example diagnostic batch, input routes return logits with shape [2, 41, " +
      "50304]: 33 real positions plus eight virtual positions. Prefix routes return [2, 33, 50304], " +
      "because their extra state is memory rather than query positions. The labels remain " +
      "real-position labels supplied to PEFT; the wrapper handles its training convention. The " +
      "separate evaluator must remove virtual output rows only for the input routes."
    }</Prose>
    
    <Prose>{
      "Acquire the exact model and data, then run the diagnostic in a fresh output directory. The " +
      "downloader checks pinned file identities; it does not silently replace a mismatching local " +
      "model. The selected dataset contains no private input or credentials."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python acquire_model.py --output pythia-14m\n" +
      "python sft_data.py --data poems --model pythia-14m --download --output data-audit.json\n" +
      "python soft_peft.py --model pythia-14m --data poems --output native-check"
    }</CodeBlock>
    
    <Prose>{""}<code>{"soft_peft.py"}</code>{
      " performs one diagnostic SGD update per route, checks that every base tensor remains exact, " +
      "saves the resulting prompt and verifies reload. These are interface checks on two training " +
      "records. They are separate from the nine scientific fits below and do not select their " +
      "hyperparameters."
    }</Prose>
    
    <Program file="soft_peft.py" />
    
    <Prose>{
      "Autoregressive generation introduces a second contract: cached attention memory. During " +
      "prefill, the cache contains the real prompt and virtual prefix. Each subsequent evaluated " +
      "token appends one row. The native wrapper must not prepend all eight virtual rows again at " +
      "every step."
    }</Prose>
    
    <SoftCache />
    
    <Prose>{
      "In the diagnostic, 31 real prompt positions plus 8 virtual positions give 39 prefill cache " +
      "rows. Emitting three new IDs evaluates only the first two emitted tokens after prefill; the " +
      "last selected token has not yet been fed back. The final cache length is therefore " +
      "31+8+3−1=41, with each layer's keys shaped [1, 4, 41, 32]. The observed shape and selected " +
      "IDs agree with the intended flow."
    }</Prose>
    
    <Prose>{
      "The program also compares native cached logits with full recomputation. FP32 execution is " +
      "not bitwise identical: the flat-input route records maximum absolute differences about " +
      "0.00000668, 0.00126076 and 0.00304818 across its three steps. The recorded greedy IDs agree " +
      "for this fixture. A separate float64 comparison uses a much tighter numerical tolerance. " +
      "Different kernel and matrix shapes can change rounding; close scores do not guarantee " +
      "identical argmax near a tie in every possible input."
    }</Prose>
    
    <Prose>{
      "Materialization needs the same care. The BiLSTM's CPU inference and gradient- enabled paths " +
      "differed by roughly 2.98×10⁻⁸ in prompt entries in an initial diagnosis. Exporting under " +
      "evaluation/no-gradient conditions aligns it with the inference route. A projected-KV batch " +
      "of two versus a materialized single prompt also showed batch-dependent FP32 rounding, " +
      "amplified to about 0.005280 in logits. The program preserves that discrepancy, checks the " +
      "stored prompt tensor exactly, and verifies matched single-record reload separately."
    }</Prose>
    
    <Prose>{
      "These are reasons to test the actual saved artifact and decoding path. They are not " +
      "permission to change the scientific recipe after seeing task scores. The projected and " +
      "recurrent routes are diagnostic examples; the fixed study uses flat input, MLP input and " +
      "direct K/V with full recomputation."
    }</Prose>
    
    <H2>{"11. Compare three fixed recipes on one pretrained task"}</H2>
    
    <Prose>{
      "Now ask a measured question: with the same small pretrained base, records and update budget, " +
      "what happens when we optimize flat input rows, MLP-generated input rows or direct layerwise " +
      "K/V? This compares three recipes. The direct prefix changes parameter count, initialization " +
      "and access to layers at once; it cannot isolate a universal effect of “depth.”"
    }</Prose>
    
    <Prose>{"The base is Pythia-14M revision "}<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{", containing 14,067,712 parameters. Poem Sentiment revision "}<code>{"612e9a1f86799126c68f0c5d9c3f1fc28f88068f"}</code>{
      " supplies verse labels. We keep the existing source splits and declared mixed-label " +
      "exclusion: 843 training, 105 development and 104 test examples. The literal prompt template, " +
      "leading answer space, label spellings and EOS are the same as in SFT. The SFT data helper is " +
      "bundled unchanged."
    }</Prose>
    
    <Prose>{
      "For test example 1 the model receives the literal prompt below; the target is the separately " +
      "supplied leading-space string "
    }<code>{" positive"}</code>{" and EOS."}</Prose>
    
    <CodeBlock language={"text"}>{
      "Classify the verse sentiment as negative, no impact, or positive.\n" +
      "Verse: and be glad in the summer morning when the kindred ride on their way;\n" +
      "Answer:"
    }</CodeBlock>
    
    <Prose>{
      "At generation time only that prompt is supplied. This verse is a held-out illustration; it " +
      "is not among the training records."
    }</Prose>
    
    <Prose>{
      "Joint prompt/answer tokenization must preserve the prompt prefix, and each complete real " +
      "sequence must fit the declared 64-token limit. Virtual input rows additionally consume " +
      "positions in the model's context. These runs use a new package/optimizer route and a fresh " +
      "declared baseline; historical full-model SFT scores are not folded into a paired comparison."
    }</Prose>
    
    <SoftExperiment />
    
    <Prose>{
      "All methods use eight virtual positions and seeds 17, 29, 43. For a given seed, first " +
      "initialize the MLP encoder and materialize its 8×128 prompt. Copy that exact tensor into the " +
      "corresponding flat prompt. Their initial logits are bitwise equal in all three preflights. " +
      "Direct K/V uses independent entries from Normal(0, 0.02²) under the declared seed; it is not " +
      "initialized to the same function as either input route."
    }</Prose>
    
    <Prose>{
      "Each run uses 200 updates, batch size 8, float32 CPU, two threads, evaluation mode with " +
      "gradients enabled, and AdamW learning rate 0.03. Its betas are (0.9, 0.999), epsilon 10⁻⁸, " +
      "weight decay 0 and global gradient clipping norm 1; the learning rate stays constant. These " +
      "are fixed instructional settings, not recommended optimal hyperparameters. No outcome " +
      "selects a new rate or seed."
    }</Prose>
    
    <Prose>{
      "The seeded record order matches across methods. A complete pass over 843 rows has 105 full " +
      "batches plus a final batch of 3. The 200-step plan preserves that short batch and processes " +
      "1,595 examples per run. Equal examples and updates do not equate adapter count, attention " +
      "work or optimizer geometry. Every completed run verifies all frozen base weights are " +
      "unchanged."
    }</Prose>
    
    <SoftSelection />
    
    <Prose>{
      "Development response NLL is evaluated at steps 0, 50, 100, 150, 200. Select the smallest " +
      "value, choosing the earliest step on a tie, including step 0. All nine runs still finish 200 " +
      "updates. Only after all selections are sealed does the test evaluator read the held-out " +
      "outcomes. Thus an early selected checkpoint is a legitimate development decision, not an " +
      "interrupted fit disguised as a complete result."
    }</Prose>
    
    <Prose>{""}<code>{"soft_study.py"}</code>{
      " freezes sources, package versions, base/data file hashes, initialization rules and every " +
      "batch list before fitting. The optimizer receives only parameters whose "
    }<code>{"requires_grad"}</code>{
      " is true. Every 50 steps it preserves the training encoder/adapter, optimizer and RNG state " +
      "for exact continuation. Selected PEFT inference artifacts are saved separately. Completed " +
      "runs and test records are conserved rather than silently replaced."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python soft_study.py preflight --model pythia-14m --data poems --work study-preflight\n" +
      "python soft_study.py freeze --model pythia-14m --data poems --work study\n" +
      "python soft_study.py train --model pythia-14m --data poems --work study\n" +
      "python soft_study.py evaluate --model pythia-14m --data poems --work study"
    }</CodeBlock>
    
    <Program file="soft_study.py" />
    
    <Prose>{
      "Three evaluations remain separate. Response NLL averages negative log probability over all " +
      "genuine answer/EOS targets. Free generation greedily chooses from the complete vocabulary " +
      "for at most eight emitted tokens; exact label validity and EOS stopping are measured " +
      "independently. Candidate scoring compares the summed log probability of each of three " +
      "complete answer strings, including EOS, without length normalization. Candidate scoring " +
      "supplies the possible answers and is therefore a different decision rule."
    }</Prose>
    
    <Prose>{""}<code>{"RealLogits"}</code>{" in "}<code>{"soft_evaluate.py"}</code>{
      " checks the returned sequence length and strips exactly m leading output rows for input " +
      "prompts. Prefix-tuning output already contains only real rows, so it strips none. Then the " +
      "unchanged SFT evaluator uses its normal real-position shift, target mask and pooled " +
      "denominator. The wrapper explicitly rejects cache use because this route recomputes the full " +
      "prefix. Its tests use deliberately distinct virtual logits to expose wrong alignment, and " +
      "unequal-length batches to test pooling."
    }</Prose>
    
    <Program file="soft_evaluate.py" />
    
    <Prose>{"The complete reusable "}<code>{"sft_data.py"}</code>{" constructs and audits targets and "}<code>{"sft_evaluate.py"}</code>{
      " implements all three metrics. Their full source is included; the new wrapper does not " +
      "silently change their label or EOS conventions. An emitted token ID is interpreted using its " +
      "recorded emitted length, so it cannot vanish merely because the same ID also appears in " +
      "padding storage."
    }</Prose>
    
    <Program file="sft_data.py" />
    
    <Program file="sft_evaluate.py" />
    
    <H2>{"12. Read the outcome that the experiment actually produced"}</H2>
    
    <Prose>{
      "The once-run study completed all nine fits and their declared test evaluations. The " +
      "bare-base baseline was evaluated separately under this study's package route. Its response " +
      "NLL is 7.052725, free-generation accuracy 0/104 and candidate accuracy 38/104. None of its " +
      "generated strings is a valid label, and none stops at EOS within the eight-token horizon. " +
      "That makes it important to compare adapters with the training-majority baseline as well as " +
      "the base."
    }</Prose>
    
    <SoftOutcomes />
    
    <NeuralTable caption={"12. Read the outcome that the experiment actually produced"} headers={[<>{"Recipe"}</>,<>{"Seed"}</>,<>{"Selected step"}</>,<>{"Test response NLL"}</>,<>{"Free accuracy"}</>,<>{"Candidate accuracy"}</>]} rows={[[<>{"Flat input"}</>,<>{"17"}</>,<>{"200"}</>,<>{"0.357548"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"Flat input"}</>,<>{"29"}</>,<>{"100"}</>,<>{"0.371220"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"Flat input"}</>,<>{"43"}</>,<>{"150"}</>,<>{"0.349952"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"MLP input"}</>,<>{"17"}</>,<>{"200"}</>,<>{"0.358464"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"MLP input"}</>,<>{"29"}</>,<>{"100"}</>,<>{"0.376151"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"MLP input"}</>,<>{"43"}</>,<>{"200"}</>,<>{"0.350995"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"Direct K/V"}</>,<>{"17"}</>,<>{"100"}</>,<>{"0.350000"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"Direct K/V"}</>,<>{"29"}</>,<>{"50"}</>,<>{"0.359504"}</>,<>{"69/104"}</>,<>{"69/104"}</>],[<>{"Direct K/V"}</>,<>{"43"}</>,<>{"200"}</>,<>{"0.357209"}</>,<>{"69/104"}</>,<>{"69/104"}</>]]} />
    
    <Prose>{"All nine selected adapters generate "}<code>{" no impact"}</code>{
      " followed by EOS for every test verse. Every output is a valid label and EOS-stopped, but " +
      "every negative and positive example is wrong. Candidate scoring also selects "
    }<code>{"no impact"}</code>{
      " every time. This is exactly the training-majority predictor's classification behavior, not " +
      "a new class-discrimination success."
    }</Prose>
    
    <Prose>{
      "The shared confusion matrix has gold rows negative/no-impact/positive and prediction columns " +
      "negative/no-impact/positive/invalid:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\begin{bmatrix}0&19&0&0\\\\0&69&0&0\\\\0&16&0&0\\end{bmatrix}."}</MathBlock>
    </div>
    
    <Prose>{"The accuracy is 69/104≈0.663462. Negative and positive F1 are zero. For no-impact, "}{"F1="}<wbr />{"2×69/"}<wbr />{"(2×69+35)="}<wbr />{"138/"}<wbr />{"173≈"}<wbr />{"0.797688"}{
      ". Macro F1 averages all three classes, giving 0.265896. Accuracy alone would conceal this " +
      "collapse to the largest class. The confusion matrix exposes it immediately."
    }</Prose>
    
    <SoftPredictions />
    
    <Prose>{"For example, flat-input seed 17 on test ID 1 has gold "}<code>{"positive"}</code>{", but emits IDs [642, 3486, 0], decoding to "}<code>{" no impact"}</code>{
      " followed by EOS. The three candidate log scores in negative/no-impact/positive order are " +
      "approximately "
    }{"[−2.146790,"}<wbr />{"−0.350367,"}<wbr />{"−2.176789]"}{
      ". The generated choice and candidate winner agree on the wrong label. On negative ID 5 the " +
      "candidate scores are "
    }{"[−1.539870,"}<wbr />{"−0.588555,"}<wbr />{"−1.744815]"}{
      ", again favoring no-impact. The selected six examples were fixed from source labels before " +
      "outcomes, not chosen to flatter or embarrass a method."
    }</Prose>
    
    <Prose>{
      "Why can NLL fall so much while this happens? It rewards probability on gold answer tokens, " +
      "including easy shared structure and termination, and responds continuously to probability " +
      "changes. Argmax can remain on no-impact while the probability of another label changes. " +
      "Candidate ranking and free generation are discrete decisions. Learning a reliable label/EOS " +
      "format can improve both NLL and validity without learning enough about verse sentiment to " +
      "change the winning label."
    }</Prose>
    
    <Prose>{
      "Development curves also show why the final update is not automatically best. For direct-K/V " +
      "seed 29, dev NLL is 0.346656 at step 50 but 0.578804 at step 200; step 50 is selected. MLP " +
      "seed 29 selects 100 rather than its worse final value. No extra fitting was used to repair " +
      "these outcomes. The result supports a narrow conclusion: these three fixed small-model " +
      "recipes learned output form and changed likelihoods, but none beat the majority decision " +
      "rule on this test split."
    }</Prose>
    
    <Prose>{
      "It does not establish that soft prompts cannot learn sentiment, that small models " +
      "universally fail, or that K/V is inherently better because one NLL is smaller. Learning " +
      "rate, initialization, data balance, model pretraining and task representation are plausible " +
      "follow-up variables. A new comparison would declare those changes, retain all outcomes and " +
      "keep test data out of selection. Three seeds on one fixed test set do not provide three " +
      "independent samples of the deployment population. Dataset and pretraining provenance also do " +
      "not prove the base has never encountered related text."
    }</Prose>
    
    <span id="7-decision-matrix" aria-hidden="true" />
    <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
    <H2>{"13. Route the right artifact to the right base"}</H2>
    
    <Prose>{
      "A prompt artifact is small partly because it relies on a large external base. Its meaning " +
      "depends on that base's learned feature coordinates, tokenizer, position convention and " +
      "injection points. A tensor with the right dimensions can still be wrong for another " +
      "checkpoint. Shape compatibility alone is not semantic compatibility."
    }</Prose>
    
    <SoftArtifactRouting />
    
    <Prose>{
      "Store the base revision and file identity, tokenizer/source template, PEFT configuration, " +
      "materialized tensor shapes and task identifier with each artifact. Validate them before " +
      "loading. Keep training encoder/optimizer state separate if training must resume. A serving " +
      "router can choose a sentiment prompt or another task's prompt while sharing the base, but it " +
      "must choose the matching output interpretation too."
    }</Prose>
    
    <Prose>{
      "Concatenating two prompts is not the sum of their independent behaviors. Queries now attend " +
      "to both sets of keys through one denominator, input positions may move, and later layers " +
      "interact nonlinearly. Even the simple zero-memory case already showed that adding rows " +
      "changes attention. Composition and transfer therefore require evaluation, not a conclusion " +
      "from small file size."
    }</Prose>
    
    <Prose>{
      "When an adapter fails, locate the earliest broken contract. Wrong logit rows suggest " +
      "virtual/real alignment. Unchanged trainable tensors despite an expected nonzero update " +
      "suggest a missing optimizer parameter or blocked gradient; unchanged argmax outputs alone " +
      "can be legitimate, as the study shows. Moving base tensors suggest the optimizer included " +
      "frozen weights. Correct teacher-forced loss but bad generation suggests a decoding, " +
      "termination, format or learned-decision problem. Incorrect cache growth suggests repeated " +
      "prefix injection. A reload failure calls for checking the base and materialized tensor " +
      "before changing task hyperparameters. Those checks explain what happened without turning " +
      "every negative scientific result into a reason to rerun it."
    }</Prose>
    <span id="11-self-check-exercises" aria-hidden="true" />
    <H2>{"14. Practice the distinctions on changed cases"}</H2>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"A. Repair a target map"}</H3>
    
    <Prose>{"Three virtual input rows precede real tokens "}<code>{"BOS Q R A EOS"}</code>{
      ". Only A and EOS are answer targets. Give their expanded target/predictor positions and the " +
      "two indices selected after removing virtual output rows."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Write the eight input positions before assigning labels. A target is predicted by its " +
      "preceding row."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Expanded targets A/EOS are 6/7 and predictors are 5/6. Removing the first three output rows " +
      "gives real predictor indices 2/3. Expanded target-style labels ignore positions 0–5 and " +
      "select 6/7. A real-logit evaluator then shifts real target-style labels once. Shifting the " +
      "already selected predictor indices again would be wrong."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"B. Add two derivative paths"}</H3>
    
    <Prose>{
      "A prompt row has key derivative [0.3,−0.2] and value derivative [−0.4, 0.1]. Use W_K=[[1, " +
      "0],[0, 2]] and W_V=[[0, 1],[1, 0]]. Find its prompt derivative and the result of a 0.1 SGD " +
      "step from p=[0.2, 0.5]."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Multiply each row derivative by the corresponding transpose, then add."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The key path is [0.3,−0.4], the value path [0.1,−0.4], so p̄=[0.4,−0.8]. The new p is " +
      "[0.16, 0.58]. Updating with only the value path would miss the effect of changing attention " +
      "weights. The fixed projection matrices are used in the derivative without being updated."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"C. Is zero memory a no-op?"}</H3>
    
    <Prose>{
      "A query has one real key with score 0 and value 6. Add two prefix keys with score 0 and " +
      "value 0. What output results, and which operation restores 6?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Include every visible key in the softmax denominator."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " All three weights are 1/3, so output is 2. Removing or masking the extra columns restores " +
      "the single weight 1 and output 6. Zeroing their values does not remove their two denominator " +
      "contributions. This conclusion needs no training or model-quality assumption."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"D. Count a grouped-query prefix"}</H3>
    
    <Prose>{
      "A model has 12 layers, 8 query heads, 2 KV heads, head width 64 and 10 prefix positions. " +
      "Count direct KV parameters and compare with a width 512 input prompt."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Every KV head stores both K and V at every layer."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Direct KV uses 2×12×10×2×64=30,720 numbers. Flat input uses 10×512=5,120. Multiplying by " +
      "eight query heads would overcount the stored KV width by four. Different counts do not " +
      "determine quality or latency."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"E. Translate an attention-area claim"}</H3>
    
    <Prose>{
      "For 64 real positions and 16 virtual positions, compute dense input-prompt and direct-KV " +
      "attention entries per head. A report calls their ratio the measured speedup. Repair that " +
      "sentence."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Count queries as well as keys, then list one missing operation."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Input prompts use 80²=6,400 entries; direct KV uses 64×80=5,120. The ratio is 1.25 for " +
      "these matrix-entry counts. It is not a measured speedup: projections, FFNs, backward work, " +
      "kernels and hardware also matter. A valid sentence is “This configuration has 25% more dense " +
      "attention entries in the input route; wall-clock differences require an actual matched " +
      "measurement.”"
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"F. Find the row-coupling mistake"}</H3>
    
    <Prose>{
      "A shared rowwise MLP produces four virtual rows. Someone claims that editing latent row 2 " +
      "must immediately change all four outputs because weights are shared. Give a counterexample " +
      "and distinguish an optimizer update."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Hold the network weights fixed during the input edit."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Let the MLP be the identity on positive inputs. Editing only row 2 changes only output 2; " +
      "all other rows receive unchanged inputs through unchanged operations. Even a non-identity " +
      "pointwise MLP has that independence. A loss-driven update to a shared matrix can " +
      "subsequently change all outputs. The latter does not create cross-row input dependence in " +
      "the former forward pass."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"G. Trace a backward recurrent influence"}</H3>
    
    <Prose>{
      "Three latent positions feed a bidirectional LSTM. Explain a path by which editing position 2 " +
      "affects output 0, and why the same path is absent in a forward-only chain. Must every such " +
      "derivative be nonzero?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Trace the direction that visits 2 before 1 before 0."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The backward state from 2 enters the recurrence at 1, then 0; output 0 includes that " +
      "backward hidden state. A forward-only state at 0 has not visited 2. This is a possible " +
      "dependency, not a guaranteed nonzero value: weights, saturating gates or downstream " +
      "projections can make a derivative zero. The explicit fixture observed nonzero coupling under " +
      "its stated weights."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"H. Move an infix across a causal boundary"}</H3>
    
    <Prose>{
      "A selected real predictor is at expanded position 4. Two trainable rows sit at positions 6 " +
      "and 7. Can the loss on that predictor train them? What changes if the model is " +
      "bidirectional?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Differentiate only along allowed attention paths."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " In the causal decoder the rows are in the predictor's future, so their derivative from that " +
      "loss is zero at every causal layer. Moving them before position 4 can create a path, subject " +
      "to the actual operations. Bidirectional visibility can permit later rows to affect position " +
      "4; check its mask rather than reuse the causal answer. Target maps must be updated when " +
      "inserting or moving rows."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"I. Distinguish export from resume"}</H3>
    
    <Prose>{
      "An encoder with 50,000 parameters produces a 20×64 prompt. How many float32 payload bytes " +
      "can its materialized input tensor occupy? Can that artifact resume the exact encoder " +
      "optimization after an interruption?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Count the exported values, then identify information lost by gφ."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " It has 1,280 values or 5,120 raw payload bytes, plus serialization metadata. The tensor " +
      "generally does not determine the encoder parameters that produced it and contains no Adam " +
      "moments or RNG state. It can reproduce the specified inference input on the matching base; " +
      "exact training resume requires the separate encoder and optimizer checkpoint."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"J. Name every trainable group"}</H3>
    
    <Prose>{
      "A token classifier has width 24, 5 classes, 3 layers and 4 direct prefix positions per layer " +
      "with ordinary multi-head attention. Count prefix and head parameters, then state which " +
      "targets should ignore padded positions."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The head includes a bias; the prefix includes K and V."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Prefix count is 2×3×4×24=576; the head has 24×5+5=125, total 701. The selected token labels " +
      "exclude padding and any ignored special positions. Attention separately masks padded keys. " +
      "Freezing the encoder does not imply freezing this head; both trainable groups belong in the " +
      "optimizer and report."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"K. Diagnose a cache and reload report"}</H3>
    
    <Prose>{
      "With 20 real and 4 virtual prefill positions, generation emits 5 tokens but does not " +
      "evaluate the last emitted token. What cache length is expected? A reload uses a different " +
      "base checkpoint of the same shape; what does equal shape prove?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Count prefill plus the new IDs actually passed through the model."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Expected length is 20+4+5−1=28. A jump of four extra rows at every decoding step suggests " +
      "repeated prefix insertion. Equal base shape proves only dimensional compatibility. Validate " +
      "the base/tokenizer identity, materialized state and matched input/output contract before " +
      "treating changed logits as an adapter serialization defect."
    }</Prose>
    </details>
    </section>
    <section className="soft-practice" data-lesson-exercise>
    <H3>{"L. Design the next honest comparison"}</H3>
    
    <Prose>{
      "All three recipes achieve 70% accuracy on a split with 70% majority-class examples. Their " +
      "NLLs differ. Specify evidence that would distinguish useful classification from majority " +
      "prediction, and a follow-up that does not tune on these test outcomes."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Start with each class's predictions, then separate a new hypothesis from a new selection rule."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Retain full predictions, confusion matrices, per-class and macro F1, valid-label/EOS rates " +
      "and the training-majority baseline. If every output is majority class, the accuracy does not " +
      "establish discrimination. One valid follow-up declares a class-balanced training sampler and " +
      "an unchanged response objective before fitting, with matched record budgets/initialization " +
      "controls, dev-only selection and a separately held-out evaluation plan. Keep all seeds and " +
      "failed outcomes. Do not choose the best test NLL and call it a prospective winner, or " +
      "quietly repeat the old study until accuracy improves."
    }</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="takeaways">
    <H2>{"15. Keep the mechanism and the evidence separate"}</H2>
    
    <Prose>{
      "A frozen model can transmit a useful gradient into a continuous prompt. Input rows, " +
      "per-layer K/V and encoder-generated state create different dependencies, parameter counts " +
      "and computation. Correct masks, positions, output alignment, cache growth and artifact " +
      "identities make those mechanisms reproducible."
    }</Prose>
    
    <Prose>{
      "The measured study teaches a separate lesson: valid output and much lower NLL can coexist " +
      "with majority-only decisions. A small adapter is a storage and optimization choice; " +
      "usefulness remains a property to measure for the task."
    }</Prose>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"16. Learn the idea from another angle"}</H2>
    
    <ul>
    <li>{""}<a href={"https://web.stanford.edu/class/cs224n/slides_w26/cs224n-2026-lecture09-peft.pdf"}>{"Stanford CS224N, Winter 2026 parameter-efficient fine-tuning slides"}</a>{
      " give a broad picture of where task parameters can enter a shared model. Use the " +
      "prompt/prefix diagrams after sections 2 and 5, then add the masks and gradient paths that " +
      "the local programs make explicit. Their scale comparison needs the original model/task " +
      "context; no lecture-video viewing is assumed."
    }</li>
    <li>{""}<a href={"https://web.stanford.edu/~jurafsky/slp3/8.pdf"}>{"Speech and Language Processing, chapter 8"}</a>{
      " connects fine-tuning objectives with trainable parameter subsets. It helps distinguish the " +
      "objective from the adaptation interface before comparing soft prompts with other " +
      "parameter-efficient methods."
    }</li>
    <li>{""}<a href={"https://huggingface.co/docs/peft/conceptual_guides/prompting"}>{"PEFT conceptual guide to soft prompts"}</a>{
      " provides a practical map of the prompt families. Pair it with the exact versioned code and " +
      "local shape checks when selecting an ordinary API."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <span id="10-primary-sources" aria-hidden="true" />
    <H2>{"17. Technical references and reproducible files"}</H2>
    
    <ul>
    <li>{""}<a href={"https://aclanthology.org/2021.emnlp-main.243/"}>{"Lester, Al-Rfou and Constant: The Power of Scale for Parameter-Efficient Prompt Tuning"}</a>{
      " defines learned input prompts and studies initialization, transfer and scale in its T5 " +
      "settings. It does not establish a universal minimum viable size."
    }</li>
    <li>{""}<a href={"https://aclanthology.org/2021.acl-long.353/"}>{"Li and Liang: Prefix-Tuning"}</a>{
      " develops per-layer prefix state and training-time reparameterization for generation. Its " +
      "encoder/decoder settings and materialization choices matter."
    }</li>
    <li>{""}<a href={"https://arxiv.org/html/2103.10385v2"}>{"Liu et al.: GPT Understands, Too, revised original P-Tuning"}</a>{
      " supplies the encoder/infix/anchor distinctions and the different frozen versus jointly " +
      "tuned task settings. The inspected revision is later than its 2021 initial proposal."
    }</li>
    <li>{""}<a href={"https://aclanthology.org/2022.acl-short.8/"}>{"Liu et al.: P-Tuning v2"}</a>{
      " studies deep prompt tuning and task heads across its stated NLU tasks, model sizes and " +
      "configurations; the local token fixture implements the interface without claiming to " +
      "reproduce those quality results."
    }</li>
    <li>{""}<a href={"https://github.com/huggingface/peft/tree/v0.21.2/src/peft"}>{"PEFT 0.21.2 source"}</a>{
      " is the versioned implementation used for prompt encoders, prefix projection, causal " +
      "wrappers, caching and materialized saving."
    }</li>
    <li>{""}<a href={"https://huggingface.co/EleutherAI/pythia-14m"}>{"Pythia-14M model"}</a>{" and "}<a href={"https://huggingface.co/datasets/google-research-datasets/poem_sentiment"}>{"Poem Sentiment"}</a>{
      " provide the actual pretrained base and labeled task. The packet preserves exact revisions, " +
      "file identities and attribution: Pythia is Apache 2.0 and Poem Sentiment is CC BY 4.0, Sheng " +
      "and Uthus 2020."
    }</li>
    </ul>
    
    <Prose>{"The "}<a href={"/learn-code/p-tuning/README.md"}>{"full file index and commands"}</a>{" and "}<a href={"/learn-code/p-tuning/p-tuning.zip"}>{"complete downloadable packet"}</a>{" include seven new programs, the exact "}{"prerequisite/"}<wbr />{"data/"}<wbr />{"evaluation"}{
      " helpers, observed outputs, selected adapters and the prospective protocol. Large base " +
      "weights are acquired by the pinned downloader; they are not duplicated into every task " +
      "artifact."
    }</Prose>
    
    <Program file="acquire_model.py" />
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"18. What you can now do"}</H2>
    
    <Prose>{
      "You can construct a soft input or deep-K/V interface, derive its gradient, distinguish " +
      "rowwise and recurrent prompt encoders, place an infix deliberately, and expose every " +
      "trainable group in a token task. You can check actual native cache/reload behavior and read " +
      "a negative adaptation result without replacing it with a better-looking run. Carry those " +
      "contracts into other parameter-efficient methods. Next, the "
    }<a href={"/learn/path/full-curriculum/grpo-rloo-kto-advanced-preference-methods?module=large-language-models"}>{"GRPO, RLOO and KTO"}</a>{" lesson changes how preference or reward evidence supplies an update. Later, in "}<a href={
      "/learn/path/full-curriculum/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation?module=large-language-models"
    }>{"LLM distillation"}</a>{
      ", the question changes from which parameters move to which teacher information becomes the " +
      "student's training target."
    }</Prose>
    </section>
  </div>;
}
export default {
  title: 'P-Tuning and Soft Prompt Methods', slug: 'p-tuning-soft-prompt-methods',
  readTime: '~65 min read + 90 min practice', content: SoftPromptLesson,
};
