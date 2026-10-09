// Generated from accepted immutable content by scripts/render-distillation-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/DistillationShared.jsx';
import { DistillNetworks, DistillDeployment, DistillSignals, DistillCompletion, DistillDivergence, DistillVocabulary, DistillTemperature, DistillUpdate, DistillHighTemperature, DistillConstraint, DistillDirections } from '../../components/lesson-labs/DistillationFoundations.jsx';
import { DistillSequenceTree, DistillSequenceSample, DistillResponseMask, DistillReduction, DistillPrefixWeights, DistillVisitationGradient, DistillStudentPrefix } from '../../components/lesson-labs/DistillationSequences.jsx';
import { DistillTrace, DistillFiltering, DistillR1Recipe, DistillExperiment, DistillSavedTargets, DistillLayerCopy, DistillChunks, DistillOutcomes, DistillCosts, DistillRoute } from '../../components/lesson-labs/DistillationEvidence.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="distill-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/llm-distillation/' + file} language="python" title={file} filename={file} />
);
function DistillationLesson() {
  return <div className="lesson-flow distill-flow">
    <section>
    <Prose>{"Suppose a language model answers "}<code>{"(2+3)*4"}</code>{" with "}<code>{"sum 5 ; product 20 ; answer 20"}</code>{
      ". We want another model to answer the same kind of question, perhaps using less memory or " +
      "less computation. What exactly can we transfer: the teacher's words, its probabilities, or " +
      "its ability to reach a correct answer on a new question? Those are different targets, and " +
      "copying one does not establish the others."
    }</Prose>
    
    <Prose opening="route">{
      "We will construct a teacher/student loss from individual token probabilities, follow its " +
      "gradient, train actual smaller autoregressive models on saved neural teacher outputs, and " +
      "use an ordinary pretrained distillation trainer. The small arithmetic experiment has a " +
      "deliberately honest outcome: its teacher is very accurate on its training prompts but gets " +
      "none of the held-out questions right. The students mostly fail too. That outcome helps " +
      "separate a working transfer mechanism from useful generalization."
    }</Prose>
    
    <Prose opening="prerequisites">{"The "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"causal language-modeling lesson"}</a>{" supplies the complete decoder used here. "}<a href={"/learn/path/full-curriculum/supervised-fine-tuning-sft?module=large-language-models"}>{"Supervised Fine-Tuning"}</a>{" establishes response masks, EOS and the difference between conditional loss and free generation. "}<a href={"/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models"}>{"Synthetic Data Generation"}</a>{" explains why filtering changes the data distribution; "}<a href={
      "/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models"
    }>{"PRM versus ORM"}</a>{
      " separates step checks from final-answer checks. We refresh each distinction when it becomes " +
      "necessary. Work through sections 1–14 in order; the full visitation derivative in section 8 " +
      "is a visible deeper branch after its ordinary prefix intuition. Every program is complete " +
      "and downloadable. The mathematical examples are constructed calculations; the experiment " +
      "tables identify actual saved runs."
    }</Prose>
    
    <span id="1-why-it-exists" aria-hidden="true" />
    <H2>{"1. Two networks, one deployment"}</H2>
    
    <DistillNetworks />
    
    <Prose>{"A language model maps the already visible tokens, its "}<strong>{"prefix"}</strong>{", to one real number per possible next token. These numbers are "}<strong>{"logits"}</strong>{
      ". Softmax converts them into positive probabilities that sum to one. A teacher is the model " +
      "that supplies training information; a student is the model whose parameters we change to " +
      "match that information. They may differ in depth, width or even architecture. Distillation " +
      "transfers behavior through examples and an objective; it does not require copying every " +
      "teacher weight."
    }</Prose>
    
    <Prose>{
      "Our ordinary pretrained example keeps the student's embedding width and vocabulary but " +
      "retains only base-model blocks 0, 2 and 4 from a six-block Pythia model. The teacher is a " +
      "separately fine-tuned six-block model. Keeping alternate blocks is a concrete initialization " +
      "choice, not a theorem that alternate layers are sufficient. The retained embeddings and " +
      "output head dominate this particular model's parameter count: 14,067,712 teacher parameters " +
      "become 13,472,896 student parameters, about 4.23% fewer. Half the blocks does not mean half " +
      "the parameters."
    }</Prose>
    
    <DistillDeployment />
    
    <Prose>{
      "During training, teacher probabilities or teacher-generated text enter a loss. The loss " +
      "derivative reaches the student parameters. We hold the teacher fixed: the student cannot " +
      "reduce the discrepancy by moving its target. During deployment, the student receives a " +
      "prompt and generates its own continuation. The teacher need not be loaded. If the student " +
      "still requires a teacher call to choose every next token, we have built a different serving " +
      "system, not this standalone student."
    }</Prose>
    
    <Prose>{
      "Parameter count, stored bytes, activation memory and elapsed time measure different costs. " +
      "Removing blocks changes several operations, but kernel choices, sequence lengths and " +
      "vocabulary projection can dominate latency. We will report counts and observed training work " +
      "separately from any hypothetical serving saving."
    }</Prose>
    
    <span id="2-core-intuition" aria-hidden="true" />
    <H2>{"2. What survives a teacher call"}</H2>
    
    <DistillSignals />
    
    <Prose>{"Imagine that the next-token events are "}<code>{"5"}</code>{", "}<code>{"6"}</code>{", "}<code>{"20"}</code>{" and "}<code>{"other"}</code>{". A teacher gives them probabilities "}<code>{"[0.60, 0.20, 0.15, 0.05]"}</code>{". Copying its most likely token retains only "}<code>{"5"}</code>{
      ". A hard target assigns all training mass to that token. Keeping the full vector also " +
      "communicates that "
    }<code>{"6"}</code>{" was more plausible than "}<code>{"other"}</code>{". This extra information is often called a "}<strong>{"soft target"}</strong>{
      ". It is information about the teacher's beliefs, including its mistakes, not a replacement " +
      "for independent task truth."
    }</Prose>
    
    <Prose>{
      "An API may provide only generated text, top-k scores, or a full vocabulary vector. Those " +
      "interfaces support different objectives. A top-k list generally omits probability mass; " +
      "renormalizing that list changes the target distribution. The full-vector objectives below " +
      "assume that every vocabulary event is represented. Text-only distillation instead uses the " +
      "exact generated completion as an ordinary supervised target. Hidden-state matching is " +
      "another family: it requires access to internal activations and an explicit correspondence " +
      "between representations. We do not need it for the output-transfer routes developed here."
    }</Prose>
    
    <DistillCompletion />
    
    <Prose>{
      "Sampling selects a token according to the teacher's probability mass. With the four-event " +
      "vector above, a uniform number in "
    }<code>{"[0,0.6)"}</code>{" selects "}<code>{"5"}</code>{", and one in "}<code>{"[0.6,0.8)"}</code>{" selects "}<code>{"6"}</code>{
      ". The completion then becomes part of the prefix for the next teacher call. A complete " +
      "sampled sentence preserves one path through a large tree of possibilities, not every " +
      "conditional distribution in that tree. Greedy generation always chooses the largest current " +
      "probability. It is useful for a deterministic target, but it is not an unbiased sample from " +
      "the teacher."
    }</Prose>
    
    <Prose>{
      "Our categorical sampler forms a cumulative distribution only over positive-mass events and " +
      "maps the chosen position back to its original token ID. This matters at an endpoint such as " +
      "uniform zero: a zero-probability leading token must never be returned just because its " +
      "cumulative mass equals zero. Neural softmax is positive mathematically, but finite " +
      "calculations and constructed fixtures can contain exact zeros."
    }</Prose>
    
    <span id="3-mathematical-foundation" aria-hidden="true" />
    <H2>{"3. Compare probabilities on the same events"}</H2>
    
    <DistillDivergence />
    
    <Prose>{"Write "}<code>{"q(v)"}</code>{" for the teacher probability of token "}<code>{"v"}</code>{" and "}<code>{"p(v)"}</code>{
      " for the student's. Both rows refer to the same prefix and the same possible token events. " +
      "The teacher's "
    }<strong>{"entropy"}</strong>{", "}<code>{"H(q)"}</code>{", is its average surprise under its own probabilities. The "}<strong>{"cross-entropy"}</strong>{", "}<code>{"H(q,p)"}</code>{
      ", measures that same teacher-weighted average using the student's probabilities. Their " +
      "difference is forward Kullback–Leibler divergence, or "
    }<strong>{"forward KL"}</strong>{". We use natural logarithms, so the unit is a *nat*."}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"H(q)=-\\sum_v q(v)\\log q(v),\\qquad H(q,p)=-\\sum_v q(v)\\log p(v)."}</MathBlock>
    </div>
    
    <div className="neural-equation">
    <MathBlock>{"D_{\\mathrm{KL}}(q\\Vert p)=\\sum_v q(v)\\log\\frac{q(v)}{p(v)}=H(q,p)-H(q)."}</MathBlock>
    </div>
    
    <Prose>{"For "}<code>{"q=[0.6,0.2,0.15,0.05]"}</code>{" and "}<code>{"p=[0.4,0.3,0.2,0.1]"}</code>{
      ", entropy is 1.062738 nats, cross-entropy is 1.147114 and KL is 0.084376. The four KL terms " +
      "are approximately "
    }<code>{"[0.243279,−0.081093,−0.043152,−0.034657]"}</code>{
      ". Individual terms can be negative: the student can assign one event more probability than " +
      "the teacher. The sum is nonnegative for valid distributions. If "
    }<code>{"p=q"}</code>{", KL is zero while cross-entropy equals the teacher's generally nonzero entropy."}</Prose>
    
    <Prose>{
      "Because the fixed teacher's entropy does not depend on student parameters, minimizing this " +
      "soft cross-entropy and minimizing forward KL give the same student gradient. Their printed " +
      "loss values still differ. Comparing an unadjusted CE number from one run to a KL number from " +
      "another would be misleading."
    }</Prose>
    
    <Prose>{"If "}<code>{"q(v)>0"}</code>{" but "}<code>{"p(v)=0"}</code>{
      ", forward KL is infinite. We use finite logits and stable log-softmax rather than creating " +
      "zeros by separately exponentiating very large negative numbers. Subtracting the maximum " +
      "logit before exponentiation preserves the probabilities and avoids overflow. An all-masked " +
      "minibatch returns a connected zero loss and zero gradient; it is not evidence of a " +
      "successful match."
    }</Prose>
    
    <DistillVocabulary />
    
    <Prose>{"Equal vector widths are not sufficient. Suppose teacher ID 0 means "}<code>{"cat"}</code>{" and student ID 0 means "}<code>{"dog"}</code>{
      ". Comparing column 0 directly transfers the probability of one event to another. A known " +
      "one-to-one vocabulary permutation can be undone before computing KL. Different tokenizers " +
      "often split the same text into different numbers of pieces; a column permutation cannot " +
      "repair that mismatch. Text transfer can still work: tokenize the literal completion with the " +
      "student's tokenizer and train its corresponding sequence. That is a different event space " +
      "and a different objective, not a direct per-token KL approximation."
    }</Prose>
    
    <Prose>{
      "In the native program both models use the same explicitly loaded tokenizer. We also check " +
      "that the teacher's saved vocabulary and EOS identity agree, and that all task prompts and " +
      "complete candidate-label encodings match. Byte-identical JSON is stronger than necessary and " +
      "can fail after harmless serialization normalization; both original file identities remain " +
      "recorded in the protocol. Semantic checks must establish the required event correspondence " +
      "rather than silently accepting a mismatch."
    }</Prose>
    
    <span id="4-from-scratch-implementation" aria-hidden="true" />
    <H2>{"4. Soften a target and follow its gradient"}</H2>
    
    <DistillTemperature />
    
    <Prose>{"A very confident teacher may place almost all its probability on one event. "}<strong>{"Temperature"}</strong>{" "}<code>{"T>0"}</code>{" changes how logits become probabilities: divide each logit by "}<code>{"T"}</code>{
      " before softmax. A larger temperature flattens differences. A smaller temperature sharpens " +
      "them. It changes both the target and the student's comparison distribution; it does not " +
      "merely multiply the existing loss."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"q_T(v)=\\frac{\\exp(t_v/T)}{\\sum_j\\exp(t_j/T)},\\qquad p_T(v)=\\frac{\\exp(z_v/T)}{\\sum_j\\exp(z_j/T)}."}</MathBlock>
    </div>
    
    <Prose>{"Here "}<code>{"t"}</code>{" is the fixed teacher logit vector and "}<code>{"z"}</code>{" is the student's. Try teacher logits "}<code>{"[2,0,−1,−3]"}</code>{" and student logits "}<code>{"[0.7,0.2,−0.1,−0.8]"}</code>{
      ". Temperature 2 exposes more teacher mass on the lower-ranked events than temperature 1. " +
      "Adding the same constant to every teacher logit changes neither distribution: only " +
      "within-row differences matter. As temperature approaches zero, a unique maximum receives " +
      "mass approaching one; tied maxima instead share the mass. The often-heard “temperature zero " +
      "gives one hot” statement needs that uniqueness condition."
    }</Prose>
    
    <DistillUpdate />
    
    <Prose>{"Let the soft loss be "}<code>{"T² KL(qT || pT)"}</code>{". Differentiate log-softmax first: "}<code>{"∂ log pT(v)/∂ zj = (1[v=j]−pT(j))/T"}</code>{". The fixed teacher row sums to one, so the derivative of its cross-entropy is "}<code>{"(pT(j)−qT(j))/T"}</code>{". Multiplying by "}<code>{"T²"}</code>{" gives"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial [T^2D_{\\mathrm{KL}}(q_T\\Vert p_T)]}{\\partial z_j}=T\\,[p_T(j)-q_T(j)]."}</MathBlock>
    </div>
    
    <Prose>{
      "A student event with too little probability has a negative logit derivative. Gradient " +
      "descent subtracts that derivative and raises the logit. Normalization couples all events; " +
      "the gradient entries sum to zero. For a pooled minibatch, divide this vector by the number " +
      "of valid target positions and set masked rows to zero. Teacher logits are detached, so they " +
      "receive no derivative."
    }</Prose>
    
    <Prose>{"An optional gold-label term remains at temperature 1:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "L=(1-\\alpha)\\,\\operatorname{CE}(y,p_1)+\\alpha T^2D_{\\mathrm{KL}}(q_T\\Vert p_T),\\qquad " +
      "0\\leq\\alpha\\leq1."
    }</MathBlock>
    </div>
    
    <Prose>{""}<code>{"α"}</code>{
      " decides how much the two sources influence this objective. It is distinct from the " +
      "divergence selector "
    }<code>{"β"}</code>{" used later. At "}<code>{"α=0"}</code>{" the teacher supplies no gradient; at "}<code>{"α=1"}</code>{
      " the hard-label term supplies none. A wrong, confident teacher can conflict with correct " +
      "labels. Matching it more closely is not automatically better task performance."
    }</Prose>
    
    <Prose>{
      "The core NumPy route returns both the scalar and the manually calculated student gradient. " +
      "For forward KL its essential calculation is:"
    }</Prose>
    
    <CodeBlock language={"python"}>{
      "lp = log_softmax(student, temperature)\n" +
      "lq = log_softmax(teacher, temperature)\n" +
      "p, q = np.exp(lp), np.exp(lq)\n" +
      "per_position = (q * (lq - lp)).sum(axis=-1)\n" +
      "gradient = temperature * (p - q)\n" +
      "gradient *= valid[..., None] / max(int(valid.sum()), 1)"
    }</CodeBlock>
    
    <Prose>{
      "The complete program checks this against Torch autograd, finite differences and one SGD " +
      "update for forward, reverse and interior JSD objectives. It includes empty masks, repeated " +
      "rows, changed temperatures and a separate hard/soft mixture. This is a derivative test on " +
      "constructed arrays, not a trained language-model result. An arbitrarily large SGD step need " +
      "not reduce loss; the lab exposes the actual before/after calculation rather than promising " +
      "it."
    }</Prose>
    
    <Prose>{""}<strong>{"Run the finite examples."}</strong>{" Download and extract the "}<a href={"/learn-code/llm-distillation/llm-distillation.zip"}>{"complete program bundle"}</a>{", then open a terminal in its folder containing "}<code>{"distillation_loss.py"}</code>{". The "}<a href={"/learn-code/llm-distillation/README.md"}>{"README"}</a>{
      " gives the full file order, recorded results and separate pretrained-model setup. The " +
      "examples here need Python 3.12, NumPy and PyTorch; a CPU is sufficient."
    }</Prose>
    
    <Prose>{"Create an isolated environment:"}</Prose>
    
    <CodeBlock language={"sh"}>{"python -m venv .venv"}</CodeBlock>
    
    <Prose>{"Activate it with "}<code>{".venv\\Scripts\\Activate.ps1"}</code>{" in Windows PowerShell, or "}<code>{"source .venv/bin/activate"}</code>{
      " on macOS/Linux. With that environment active, install the two dependencies and run the " +
      "current loss check and the sequence check introduced in section 6:"
    }</Prose>
    
    <CodeBlock language={"sh"}>{
      "python -m pip install numpy==2.3.5 torch==2.14.0\n" +
      "python distillation_loss.py --output loss-results.json\n" +
      "python distillation_sequences.py --output sequence-results.json"
    }</CodeBlock>
    
    <Prose>{
      "The recorded environment used NumPy 2.3.5 and PyTorch 2.14.0+cpu; select a " +
      "platform-appropriate PyTorch build if necessary. Both commands compare manual derivatives " +
      "with autograd on finite examples and save their checks as JSON. They do not download a model " +
      "or fit the arithmetic study. Keep the extracted programs together for their local imports. " +
      "Section 12 adds the Transformers, TRL and checkpoint requirements when we reach the ordinary " +
      "pretrained route."
    }</Prose>
    
    <Program file="distillation_loss.py" />
    
    <DistillHighTemperature />
    
    <Prose>{"Why multiply by "}<code>{"T²"}</code>{"? At high temperature, a softmax row with "}<code>{"V"}</code>{" events is approximately "}<code>{"1/V + (zj−mean(z))/(VT)"}</code>{". Its teacher/student probability difference is therefore of order "}<code>{"1/T"}</code>{". The unscaled logit gradient divides by another "}<code>{"T"}</code>{". Multiplication by "}<code>{"T²"}</code>{" offsets that high-temperature shrinkage. It does "}<strong>{"not"}</strong>{" make the gradients identical at every temperature."}</Prose>
    
    <Prose>{"Subtract each row's own mean and call the centered vectors "}<code>{"z̃"}</code>{" and "}<code>{"t̃"}</code>{". Then"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\lim_{T\\to\\infty} T^2D_{\\mathrm{KL}}(q_T\\Vert p_T)=\\frac{1}{2V}\\sum_j(\\widetilde " +
      "z_j-\\widetilde t_j)^2."
    }</MathBlock>
    </div>
    
    <Prose>{
      "For the four-logit example the limit is 0.7975. Centering is essential because softmax " +
      "cannot identify a shared logit offset. The approximation is useful for understanding scale; " +
      "it is not a reason to choose extremely high temperature without checking whether that target " +
      "is useful for the task."
    }</Prose>
    
    <H2>{"5. Direction matters when the student is constrained"}</H2>
    
    <DistillConstraint />
    
    <Prose>{"Reverse KL swaps which distribution weights the discrepancy:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"D_{\\mathrm{KL}}(p\\Vert q)=\\sum_v p(v)\\log\\frac{p(v)}{q(v)}."}</MathBlock>
    </div>
    
    <Prose>{
      "Forward KL weights events according to the teacher. Reverse KL weights them according to the " +
      "student. If the student can represent every categorical row, both objectives have the same " +
      "best answer "
    }<code>{"p=q"}</code>{
      ". “Forward covers modes; reverse chooses a mode” is therefore not an unconditional property " +
      "of arbitrary softmax vectors. It becomes a useful description under particular restrictions."
    }</Prose>
    
    <Prose>{"Consider "}<code>{"q=[0.49,0.02,0.49]"}</code>{", which has two large separated events. Restrict the student to "}<code>{"p(u)=[u²,2u(1−u),(1−u)²]"}</code>{" with "}<code>{"0<u<1"}</code>{". At "}<code>{"u=0.5"}</code>{", it assigns "}<code>{"[0.25,0.5,0.25]"}</code>{
      ": covering both extremes forces much more middle mass than the teacher wants. Forward KL is " +
      "minimized at "
    }<code>{"u=0.5"}</code>{". Reverse KL has symmetric minima near the endpoints, close to "}<code>{"u=0.024"}</code>{" and "}<code>{"u=0.976"}</code>{
      ", accepting a missed teacher mode to avoid the middle. Those are properties of this family " +
      "and this target. They do not establish which objective wins on language tasks."
    }</Prose>
    
    <Prose>{"For one finite-logit row, write "}<code>{"D=KL(pT||qT)"}</code>{". The unscaled reverse-KL gradient is "}<code>{"pj[log(pj/qj)−D]/T"}</code>{". The subtraction of "}<code>{"D"}</code>{
      " again makes the logit derivatives sum to zero. The probability weighting is now itself " +
      "differentiated. If the teacher assigns exact zero probability where the student has positive " +
      "mass, reverse KL is infinite; forward and reverse thus penalize different support failures. " +
      "Stable finite-logit fixtures avoid accidental numerical zeros."
    }</Prose>
    
    <DistillDirections />
    
    <Prose>{"An interior generalized Jensen–Shannon divergence uses a mixture "}<code>{"m=βq+(1−β)p"}</code>{":"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"J_\\beta(q,p)=\\beta D_{\\mathrm{KL}}(q\\Vert m)+(1-\\beta)D_{\\mathrm{KL}}(p\\Vert m),\\qquad 0<\\beta<1."}</MathBlock>
    </div>
    
    <Prose>{"At "}<code>{"β=0.5"}</code>{
      " both distributions contribute equally. The unnormalized expression approaches zero as " +
      "either mixture coefficient approaches an endpoint. The inspected TRL interface separately " +
      "defines "
    }<code>{"β=0"}</code>{" as pure forward KL and "}<code>{"β=1"}</code>{
      " as pure reverse KL. These replacements are an API convention, not the continuous limits of " +
      "the displayed interior expression. Our scratch function requires an explicit named KL at the " +
      "endpoints so that the convention cannot be missed."
    }</Prose>
    
    <span id="6-visual-walkthrough" aria-hidden="true" />
    <H2>{"6. A sequence chooses the next context"}</H2>
    
    <DistillSequenceTree />
    
    <Prose>{
      "A language model assigns a sequence probability by multiplying conditional next-token " +
      "probabilities. For two binary positions, the possible completions are "
    }<code>{"AA"}</code>{", "}<code>{"AB"}</code>{", "}<code>{"BA"}</code>{" and "}<code>{"BB"}</code>{
      ". There is one first-position row and two second- position rows: the second row depends on " +
      "whether the first token was A or B."
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"p(y_1,y_2\\mid x)=p(y_1\\mid x)\\,p(y_2\\mid x,y_1)."}</MathBlock>
    </div>
    
    <Prose>{
      "The full sequence cross-entropy is the teacher-weighted sum of the negative log student " +
      "probability over all four leaves. Longer sequences make exhaustive enumeration exponential. " +
      "Sampling a complete sequence from the teacher and training its ordinary token CE gives an " +
      "unbiased estimate of that sequence cross-entropy under the same distribution and " +
      "length/stopping convention. The sample's token losses are summed; choosing another length " +
      "normalization changes the objective."
    }</Prose>
    
    <DistillSequenceSample />
    
    <Prose>{
      "If instead we always copy one greedy or beam-decoded completion, we optimize the likelihood " +
      "of that selected target. It is no longer an unbiased estimate of the whole teacher " +
      "expectation. Kim and Rush's original sequence-level work used a high-probability sequence " +
      "approximated with beam search. That can be a useful training choice without pretending it " +
      "preserves the complete teacher distribution."
    }</Prose>
    
    <Prose>{
      "Token-distribution training and sequence-text training also differ in which prefixes they " +
      "inspect. A stored human answer supplies human prefixes. A copied teacher answer supplies " +
      "teacher-generated prefixes. A sampled student answer supplies student-generated prefixes. " +
      "Even with the same divergence formula, these methods ask the teacher different conditional " +
      "questions."
    }</Prose>
    
    <Prose>{
      "The complete finite program computes all four leaf masses, exact CE and both KL directions. " +
      "Its 10,000 seeded categorical samples are a reproducible observation of a sample mean, " +
      "alongside the exact expectation; no single finite sample is treated as the expectation " +
      "itself. It also verifies the deeper derivative in section 8 with Torch and finite " +
      "differences."
    }</Prose>
    
    <Program file="distillation_sequences.py" />
    
    <H2>{"7. Copy a completion without losing its boundary"}</H2>
    
    <DistillResponseMask />
    
    <Prose>{"The prompt "}<code>{"(2+3)*4"}</code>{" is serialized by the small experiment as nine IDs: "}<code>{"[BOS, (, 2, +, 3, ), *, 4, =]"}</code>{". Its response is also nine IDs: "}<code>{"[sum, 5, ;, product, 20, ;, answer, 20, EOS]"}</code>{
      ". Numbers are single tokens in this explicit finite vocabulary. This is a task-specific " +
      "tokenizer, not a claim about how Pythia splits the same string."
    }</Prose>
    
    <Prose>{"The predictor at input index 8 sees the final "}<code>{"="}</code>{
      " and predicts the response's first token at index 9. Each later predictor sees the preceding " +
      "response tokens. Prompt positions are context, but their next-token targets are ignored " +
      "until the first response token. The real EOS target remains supervised. Padding after EOS is " +
      "ignored. The scratch collator stores labels already aligned to predictor rows; the ordinary " +
      "Transformers helper stores target-position labels and lets the model shift once. Applying " +
      "both shifts would skip a target."
    }</Prose>
    
    <Prose>{"An answer-only student instead learns "}<code>{"[20, EOS]"}</code>{
      ". The label content, length and conditioning all change: it cannot condition its final " +
      "answer on a generated intermediate trace that is absent. A comparison between these recipes " +
      "is not a controlled test of only one property of rationales."
    }</Prose>
    
    <DistillReduction />
    
    <Prose>{
      "For a batch with one response of two tokens and another of nine, a pooled token mean gives " +
      "the second response more total weight. If their negative-log- probability sums are 4 and 9 " +
      "nats, the pooled mean is "
    }<code>{"13/11≈1.1818"}</code>{", while the mean of their own means is "}<code>{"(4/2+9/9)/2=1.5"}</code>{
      ". Neither denominator can be inferred from the word “average.” Our loops use the pooled " +
      "count of actual supervised positions. Across evaluation batches, we add sums and counts " +
      "before dividing."
    }</Prose>
    
    <Prose>{
      "Generation uses lengths to distinguish active positions from stored padding. This is " +
      "especially important when a library uses EOS's ID as the padding value. An emitted BOS or " +
      "PAD-like token is still a real generated action, even when it makes the output invalid; " +
      "silently removing it could turn a bad completion into a valid label. A completion that hits " +
      "its horizon without EOS is retained as such. The offline pretrained route excludes that " +
      "whole nonterminated completion from training rather than adding a made-up EOS or " +
      "substituting the correct label."
    }</Prose>
    
    <H2>{"8. Learn at prefixes the student visits"}</H2>
    
    <DistillPrefixWeights />
    
    <Prose>{
      "Suppose the teacher usually starts with A but the student often starts with B. Training only " +
      "on teacher prefixes rarely asks what to do after B. During the student's own generation, B " +
      "may be common. "
    }<strong>{"On-policy distillation"}</strong>{" asks for teacher feedback at prefixes generated by the current student. "}<strong>{"Offline"}</strong>{
      " training reuses a fixed corpus. Prefix source is separate from whether the local loss is " +
      "forward KL, reverse KL or another divergence."
    }</Prose>
    
    <DistillStudentPrefix />
    
    <Prose>{
      "The ordinary route is: sample a student continuation, keep those sampled IDs fixed, evaluate " +
      "both models on each resulting prefix, then update the student using the teacher's full " +
      "next-token vector. Even a mistaken prefix can receive dense feedback. The teacher is not " +
      "necessarily supplying a new corrected sentence. The GKD paper uses this stop-gradient " +
      "treatment of sampled prefixes; our ordinary TRL example follows the same local-update " +
      "distinction."
    }</Prose>
    
    <Prose>{
      "“Keep sampled IDs fixed” is a computational instruction. The sample came from the student, " +
      "so the distribution of prefixes depends on its parameters across training. A derivative " +
      "taken only through the local token distributions need not equal the derivative of the " +
      "complete expected sequence objective. You can use that local update deliberately, but should " +
      "know which gradient it computes."
    }</Prose>
    
    <H3>{"Deeper: the missing visitation derivative"}</H3>
    
    <DistillVisitationGradient />
    
    <Prose>{"Let "}<code>{"p0"}</code>{" be the student's first-token row, "}<code>{"pA,pB"}</code>{" its two conditional rows and "}<code>{"q0,qA,qB"}</code>{" the teacher's. The full reverse KL over complete two-token sequences expands exactly as"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "D_{\\mathrm{KL}}(p_{\\mathrm{seq}}\\Vert q_{\\mathrm{seq}})=D_{\\mathrm{KL}}(p_0\\Vert " +
      "q_0)+\\sum_{a\\in\\{A,B\\}}p_0(a)D_{\\mathrm{KL}}(p_a\\Vert q_a)."
    }</MathBlock>
    </div>
    
    <Prose>{"Call the two continuation KLs "}<code>{"KA,KB"}</code>{" and their weighted average "}<code>{"K̄"}</code>{". When differentiating first-position logit "}<code>{"zj"}</code>{", the second term contributes "}<code>{"p0(j)[Kj−K̄]"}</code>{". This is the "}<strong>{"visitation term"}</strong>{
      ": changing the first decision changes how often each future discrepancy is encountered. " +
      "Detaching the prefix weight removes this contribution while leaving the forward numerical " +
      "loss unchanged. Derivatives of the second-position rows still include their current prefix " +
      "weights."
    }</Prose>
    
    <Prose>{
      "The finite program's default rows give sequence reverse KL about 0.044675, with root KL " +
      "about 0.027955 and weighted continuation KL about 0.016720. Its first-row visitation " +
      "derivative is approximately "
    }<code>{"[−0.007618,+0.007618]"}</code>{
      ". Torch differentiating the full graph matches the manually added term and finite " +
      "differences. Detaching only the prefix weights matches the separate local gradient. If both " +
      "continuation KLs are equal, this term vanishes: shifting visits between equal-cost futures " +
      "does not change their average cost."
    }</Prose>
    
    <Prose>{
      "MiniLLM develops a sequence reverse-KL policy-gradient approach and adds practical " +
      "stabilization mechanisms. This exact four-leaf derivation explains one reason its gradient " +
      "is different from a detached-prefix update; it does not reproduce the whole MiniLLM training " +
      "system. "
    }<a href={"/learn/path/full-curriculum/rl-for-reasoning-deepseek-r1-style?module=large-language-models"}>{"RL for Reasoning"}</a>{" develops the broader sequential-policy calculation."}</Prose>
    
    <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
    <H2>{"9. Transfer a trace and check what it asserts"}</H2>
    
    <DistillTrace />
    
    <Prose>{"A generated intermediate explanation is often called a "}<strong>{"rationale"}</strong>{
      " or reasoning trace. Training on such text can teach patterns that answer-only supervision " +
      "does not expose. It can also teach wrong steps, persuasive filler or an answer that happens " +
      "to be right for the wrong reason. The existence of a written trace does not prove that it " +
      "faithfully describes the teacher's internal computation."
    }</Prose>
    
    <Prose>{"Our finite grammar makes the distinction testable. For "}<code>{"(2+3)*4"}</code>{", compare:"}</Prose>
    
    <NeuralTable caption={"9. Transfer a trace and check what it asserts"} headers={[<>{"Literal trace before EOS"}</>,<>{"Final answer correct?"}</>,<>{"Every arithmetic step correct?"}</>]} rows={[[<>{""}<code>{"sum 5 ; product 20 ; answer 20"}</code>{""}</>,<>{"Yes"}</>,<>{"Yes"}</>],[<>{""}<code>{"sum 6 ; product 20 ; answer 20"}</code>{""}</>,<>{"Yes"}</>,<>{"No: the sum is wrong and the product does not follow it"}</>],[<>{""}<code>{"sum 6 ; product 24 ; answer 24"}</code>{""}</>,<>{"No"}</>,<>{"No: later steps follow the generated sum, but that sum is wrong"}</>]]} />
    
    <Prose>{
      "The parser first checks the literal nine-token structure, integer ranges and terminal EOS. " +
      "It never executes generated text as Python. Separate predicates then ask whether the " +
      "reported sum equals "
    }<code>{"a+b"}</code>{", whether the product follows the reported sum times "}<code>{"c"}</code>{
      ", whether the answer equals the reported product, and whether that final answer equals the " +
      "independently calculated task answer. The full-step predicate requires all of them. A " +
      "malformed trace has no parsed answer and fails these checks; no parser repair invents one " +
      "for it."
    }</Prose>
    
    <DistillFiltering />
    
    <Prose>{
      "Filtering with a checker changes the training distribution. Some parents may contribute two " +
      "candidates, others one or none. An accepted corpus can appear very accurate partly because " +
      "difficult or malformed cases were removed. Report the original candidate count, retained " +
      "count and parent coverage along with any accuracy among accepted items. A perfect accepted " +
      "fraction on an empty set is undefined, not 100%."
    }</Prose>
    
    <Prose>{
      "There are also multiple ways to train with rationales. Our full-trace student predicts the " +
      "rationale tokens followed by the answer in one autoregressive sequence. Its answer-only " +
      "counterpart predicts only the final integer and EOS. Hsieh and colleagues' *Distilling " +
      "Step-by-Step* instead used separate label and rationale tasks with task prefixes in their " +
      "encoder-decoder setup. Those are different conditioning structures. Calling any rationale " +
      "dataset that named method would erase an important implementation choice."
    }</Prose>
    
    <Prose>{
      "The exact arithmetic schema is small enough to check mechanically. The same checker cannot " +
      "certify a natural-language proof, medical explanation or open-ended argument. For those " +
      "tasks, verification needs its own explicit evidence and failure analysis. The general lesson " +
      "is to separate the supervision source from the independent criterion used to call an answer " +
      "correct."
    }</Prose>
    
    <Program file="distillation_traces.py" />
    
    <H2>{"10. What DeepSeek-R1-Distill actually did"}</H2>
    
    <DistillR1Recipe />
    
    <Prose>{
      "DeepSeek-R1 provides a large-scale example of transferring generated responses to other " +
      "models. Read the recipe at the correct level: the released distilled models were " +
      "supervised-fine-tuned on selected text, rather than trained by directly matching every " +
      "teacher vocabulary logit. The teacher model itself had a different upstream training " +
      "history. Teacher RL and student SFT are separate operations in the pipeline."
    }</Prose>
    
    <Prose>{
      "The inspected second paper version, dated 4 January 2026, describes approximately 600,000 " +
      "reasoning examples and 200,000 other examples; its detailed Table 5 totals 804,745. " +
      "Reasoning selection uses rule-based checks and DeepSeek-V3 judgment. Other data includes " +
      "reused V3 supervised data and generated responses. This is more than “sample 800,000 " +
      "arbitrary answers”: selection, prompt coverage and supervision mixture are part of the " +
      "method."
    }</Prose>
    
    <NeuralTable caption={"10. What DeepSeek-R1-Distill actually did"} headers={[<>{"Distilled release size"}</>,<>{"Starting dense base reported in the recipe"}</>]} rows={[[<>{"1.5B"}</>,<>{"Qwen2.5-Math-1.5B"}</>],[<>{"7B"}</>,<>{"Qwen2.5-Math-7B"}</>],[<>{"14B"}</>,<>{"Qwen2.5-14B"}</>],[<>{"32B"}</>,<>{"Qwen2.5-32B"}</>],[<>{"8B"}</>,<>{"Llama-3.1-8B"}</>],[<>{"70B"}</>,<>{"Llama-3.3-70B-Instruct"}</>]]} />
    
    <Prose>{
      "These six distilled routes use SFT only in the reported recipe, with 2–3 epochs, context " +
      "length 32,768 and batch size 64. Their result is evidence about particular base models, data " +
      "and evaluations. The paper's 32B distillation-versus-direct-RL comparison does not establish " +
      "that all smaller models are incapable of learning from reinforcement learning, nor that " +
      "distillation always beats it."
    }</Prose>
    
    <Prose>{
      "Our local experiment does not reproduce R1 training, its scale, its data mixture or its " +
      "benchmark scores. It isolates the transferable mechanics: freeze a neural teacher, preserve " +
      "its actual outputs and selection decisions, train another autoregressive model, then " +
      "evaluate against independent answers. The retained negative result is as important as that " +
      "mechanical correspondence."
    }</Prose>
    
    <H2>{"11. Build and freeze a neural transfer experiment"}</H2>
    
    <DistillExperiment />
    
    <Prose>{"Our task is "}<code>{"(a+b)*c"}</code>{", with "}<code>{"1≤a≤b≤9"}</code>{" and training-range multipliers "}<code>{"c=1…4"}</code>{". There are 45 unordered "}<code>{"(a,b)"}</code>{
      " families. We sort them by a predeclared SHA256 rule: the first 32 supply 128 training " +
      "prompts, the next 6 supply 24 development prompts, and the last 7 supply 28 test prompts. " +
      "Keeping a whole family together prevents a copied candidate or another multiplier variant of " +
      "that family from crossing the split. The distribution-shift test uses those same seven test " +
      "families at "
    }<code>{"c=5,6"}</code>{
      ", giving 14 additional questions. Some target integers may be unseen in training; that is " +
      "part of this declared shift, not a matched in-range test."
    }</Prose>
    
    <Prose>{
      "The vocabulary is fixed by the schema before splitting: PAD/BOS/EOS, integer tokens 0 " +
      "through 108, and the nine operator/marker tokens. There are 121 tokens in total. Defining " +
      "the possible integer symbols does not train the model to perform arithmetic with them. In " +
      "particular, it does not supply frequencies or answers from the held-out examples."
    }</Prose>
    
    <Prose>{
      "We reuse the causal lesson's complete TinyLM architecture byte-for-byte. It has learned " +
      "embeddings and positions, explicit causal attention, residual feed-forward blocks, " +
      "normalization and a vocabulary head. The teacher uses width 64, four heads and two blocks: " +
      "117,120 parameters. The student uses width 32, two heads and one block: 21,408 parameters. " +
      "Context length 32 contains the nine-token prompt and the predeclared generation horizon of " +
      "twelve new tokens."
    }</Prose>
    
    <Prose>{
      "The prospective protocol is written before the first teacher update or corpus generation. It " +
      "binds source bytes, versions, splits, vocabulary, seeds, objective, optimizer, selection and " +
      "evaluation rules. A completed artifact is reused on resume; a source mismatch stops the " +
      "driver. A held-out result is not permission to add another seed or choose a different " +
      "training duration."
    }</Prose>
    
    <Prose>{
      "The teacher receives correct arithmetic traces for 1,200 AdamW updates, seed 11, batch 16, " +
      "learning rate 0.003, zero weight decay and gradient clipping at norm 1. Development response " +
      "NLL is checked at 0, 300, 600, 900 and 1,200 updates. The minimum wins, with the earliest " +
      "step breaking ties. The selected teacher is step 300, development NLL 1.341476. Later " +
      "development losses are worse; the complete teacher still performs all 1,200 declared " +
      "updates."
    }</Prose>
    
    <Prose>{
      "The selected teacher generates exactly two candidates for each of the 128 training prompts: " +
      "one greedy and one temperature-1 full-vocabulary sample. Sampling seeds are tied to " +
      "parent/candidate identity, so a change in batch grouping does not change their random " +
      "stream. Generation stops at the first EOS or twelve-token horizon. Every candidate retains " +
      "its parent, emitted IDs, literal decoded text, probability vectors at its visited prefixes " +
      "and checker outcome. We do not regenerate a bad candidate."
    }</Prose>
    
    <Program file="tiny_causal_lm.py" />
    
    <Program file="distillation_teacher.py" />
    
    <DistillSavedTargets />
    
    <Prose>{
      "The actual corpus contains 256 candidates and 2,304 emitted tokens. Of those candidates, 255 " +
      "match the grammar, 253 have a correct final answer, and 252 pass every step check. All 128 " +
      "parents retain at least one full-step-correct candidate. The small differences are concrete " +
      "rather than theoretical:"
    }</Prose>
    
    <NeuralTable caption={"11. Build and freeze a neural transfer experiment"} headers={[<>{"Saved candidate"}</>,<>{"Literal generated text, before EOS"}</>,<>{"What fails"}</>]} rows={[[<>{""}<code>{"3:3:3/sample"}</code>{""}</>,<>{""}<code>{"sum 6 ; product 9 ; answer 18"}</code>{""}</>,<>{"Final answer is right, but the product and its connection to the answer are wrong"}</>],[<>{""}<code>{"3:4:3/sample"}</code>{""}</>,<>{""}<code>{"sum ; ; product 16 ; answer 24"}</code>{""}</>,<>{"Grammar: the sum field is not an integer"}</>]]} />
    
    <Prose>{
      "The first two wrong or malformed IDs in sorted order were predeclared as displayed examples; " +
      "these two satisfy that rule. Their contents are actual neural outputs, not handwritten " +
      "illustrations. The separate three-row table in section 9 is explicitly constructed to teach " +
      "the checker."
    }</Prose>
    
    <Prose>{"We train five recipes for each seed 17, 29 and 43:"}</Prose>
    
    <NeuralTable caption={"11. Build and freeze a neural transfer experiment"} headers={[<>{"Recipe"}</>,<>{"Targets and prefixes"}</>,<>{"Retained candidate rows"}</>]} rows={[[<>{"Gold trace"}</>,<>{"Correct trace for each eligible candidate's parent"}</>,<>{"255"}</>],[<>{"Copied hard trace"}</>,<>{"Literal teacher response tokens"}</>,<>{"255"}</>],[<>{"Soft teacher"}</>,<>{"Full teacher distribution at each exact copied-trace prefix"}</>,<>{"255"}</>],[<>{"Answer only"}</>,<>{"Copied final integer and EOS"}</>,<>{"255"}</>],[<>{"Verified trace"}</>,<>{"Copied traces that pass every step check"}</>,<>{"252"}</>]]} />
    
    <Prose>{
      "The gold recipe repeats a parent's gold trace as many times as that parent has eligible " +
      "candidates. It therefore matches the hard/soft/answer exposure weights, rather than quietly " +
      "using one row per parent. Hard and soft use the same copied prefixes and lengths, so their " +
      "controlled distinction is the target information. The verified recipe changes support and " +
      "weights; the answer-only recipe changes length and conditioning. Those comparisons concern " +
      "whole recipes."
    }</Prose>
    
    <Prose>{
      "Every arm starts from exactly the same saved initial weights within a seed. All perform 600 " +
      "AdamW updates at learning rate 0.003, batch 16, zero weight decay and clipping at 1. The " +
      "four unfiltered arms share the same eligible-ID shuffle plan. The verified arm shuffles its " +
      "retained support under its predeclared plan. We retain the last short batch rather than " +
      "dropping it. A pooled token mean is computed within each batch."
    }</Prose>
    
    <Prose>{"The soft route's core is the same explicit objective already tested on arrays:"}</Prose>
    
    <CodeBlock language={"python"}>{
      "logits = model(batch['input_ids'])\n" +
      "if arm == 'soft':\n" +
      "    loss = torch_divergence(\n" +
      "        logits, batch['teacher_logits'], batch['mask'], temperature=1.\n" +
      "    )\n" +
      "else:\n" +
      "    loss = F.cross_entropy(\n" +
      "        logits.reshape(-1, VOCABULARY),\n" +
      "        batch['labels'].reshape(-1),\n" +
      "        ignore_index=-100,\n" +
      "    )\n" +
      "optimizer.zero_grad(set_to_none=True)\n" +
      "loss.backward()\n" +
      "torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)\n" +
      "optimizer.step()"
    }</CodeBlock>
    
    <Prose>{"Here "}<code>{"teacher_logits"}</code>{
      " stores saved teacher log probabilities. Log-softmax at temperature 1 returns the same " +
      "normalized target up to numerical precision. It is not a teacher trainable parameter. The " +
      "response mask aligns the first distribution with the predictor of the first response token. " +
      "Prompt and padding rows receive no distillation loss."
    }</Prose>
    
    <Prose>{
      "At steps 0, 200, 400 and 600, development free-generation final-answer accuracy chooses each " +
      "student's checkpoint, with the earliest step winning every tie. No NLL tiebreaker is added " +
      "after seeing the results. All arms still finish 600 updates. Only after all fifteen terminal " +
      "outcomes are recorded does the driver seal selections and evaluate test and shift questions. " +
      "Model, optimizer, RNG, batch plans and histories are retained for interrupted-run recovery."
    }</Prose>
    
    <Program file="distillation_student.py" />
    
    <Program file="distillation_study.py" />
    
    <span id="5-production-implementation" aria-hidden="true" />
    <H2>{"12. Use a pretrained teacher with ordinary tooling"}</H2>
    
    <Prose>{
      "The arithmetic models make the complete mechanism inspectable. We can also use a pretrained " +
      "tokenizer, a saved task teacher and a maintained trainer. The interface contract matters as " +
      "much as the class name: two vectors of the same length are comparable only when each " +
      "coordinate denotes the same next-token event at the same prefix."
    }</Prose>
    
    <DistillLayerCopy />
    
    <Prose>{
      "Our teacher is the exact response-only SFT checkpoint for seed 17 from the earlier lesson. " +
      "Choosing that identity in advance avoids selecting whichever teacher happens to make this " +
      "experiment look best. The student starts from the original Pythia-14M base with only blocks " +
      "0, 2 and 4 retained. It copies base embeddings, final normalization and vocabulary head, " +
      "rather than copying the teacher's fine-tuned blocks. The complete code checks the teacher " +
      "weight identity, both parameter counts and the selected layers before training."
    }</Prose>
    
    <CodeBlock language={"python"}>{
      "teacher = AutoModelForCausalLM.from_pretrained(teacher_path).float().eval()\n" +
      "teacher.requires_grad_(False)\n" +
      "student = AutoModelForCausalLM.from_pretrained(base_path).float().eval()\n" +
      "student.gpt_neox.layers = torch.nn.ModuleList(\n" +
      "    [student.gpt_neox.layers[i] for i in (0, 2, 4)]\n" +
      ")\n" +
      "student.config.num_hidden_layers = 3\n" +
      "for index, block in enumerate(student.gpt_neox.layers):\n" +
      "    block.attention.layer_idx = index"
    }</CodeBlock>
    
    <Prose>{
      "The last two lines repair the cache addresses carried by copied modules. Original block 4 is " +
      "now student block 2, so it must write to cache slot 2. Changing the module list and " +
      "configuration alone leaves the original 0/2/4 addresses behind. Our first native generation " +
      "attempt exposed this mismatch before its first output batch or optimizer step. Renumbering " +
      "this metadata preserves every parameter tensor; a fixed-token cached-versus-full forward " +
      "check verifies the correction. The completed offline corpus and fit are reused."
    }</Prose>
    
    <Prose>{
      "The downloaded tokenizer and the teacher's saved tokenizer have different JSON " +
      "serialization. A hash mismatch therefore prompted a semantic check, not an assumption that " +
      "their token events matched. We verified exact vocabulary and EOS identity and the actual " +
      "prompt/full-response encodings of all 1,052 source records for each of the three sentiment " +
      "candidates. Both original file identities remain recorded. Training uses one tokenizer for " +
      "both models. This check establishes the actual data interface used here; it is not a " +
      "universal equivalence proof for arbitrary Unicode strings."
    }</Prose>
    
    <DistillChunks />
    
    <Prose>{
      "The teacher and student each project hidden vectors into 50,304 vocabulary logits. Holding " +
      "both full batch-by-time-by-vocabulary tensors can cost much more memory than the final " +
      "scalar loss suggests. TRL's "
    }<code>{"DistillationTrainer"}</code>{
      " obtains the relevant hidden vectors, projects valid completion positions in chunks, and " +
      "accumulates the divergence. With chunk size C and vocabulary V, the two main logit tiles " +
      "contain about 2CV entries instead of 2BLV. This describes the projection tiles, not all " +
      "model memory: hidden activations, gradients, model weights and optimizer states still exist. " +
      "Smaller chunks can trade memory for additional launches or repeated work. Chunking must not " +
      "change which positions count or change the denominator for a short last chunk."
    }</Prose>
    
    <Prose>{
      "We checked the actual full models before any native generation or optimizer step. Six cases " +
      "combine beta 0, 0.5 and 1 with temperature 1 and 2. The native loss and a full-logit " +
      "reference agree; all 40 student parameter tensors receive finite gradients and the frozen " +
      "teacher receives none. In FP32, the whole gradient's relative L2 difference is at most " +
      "0.00004511. Repeating these diagnostic forwards/backwards with FP64 projection/backbone " +
      "arithmetic, while retaining the native FP32 softmax, reduces the difference below 9e-14. " +
      "This distinguishes numerical reduction-order sensitivity from a changed objective. The " +
      "reference uses the native stack/log-sum-exp mixture primitive for beta 0.5; an algebraically " +
      "equivalent "
    }<code>{"logaddexp"}</code>{" has different FP32 rounding."}</Prose>
    
    <Prose>{
      "Unequal left-padded prompts, real EOS ID 0 beside ignored pad storage ID 0, an all-masked " +
      "zero-loss/zero-gradient case, exact unchanged initial weights and exact save/reload logits " +
      "are checked separately. These are interface and derivative checks, not evidence of task " +
      "quality."
    }</Prose>
    
    <Prose>{"The maintained API in the executed version, TRL 1.14.2, is:"}</Prose>
    
    <CodeBlock language={"python"}>{
      "settings = DistillationConfig(\n" +
      "    output_dir=\"on-policy\", use_cpu=True, bf16=False, fp16=False,\n" +
      "    max_steps=24, per_device_train_batch_size=4,\n" +
      "    learning_rate=1e-4, lr_scheduler_type=\"constant\",\n" +
      "    weight_decay=0., max_grad_norm=1., optim=\"adamw_torch\",\n" +
      "    beta=0., temperature=1., top_k=0, top_p=1.,\n" +
      "    max_completion_length=8, disable_dropout=True,\n" +
      "    seed=17, data_seed=17, report_to=\"none\",\n" +
      ")\n" +
      "trainer = DistillationTrainer(\n" +
      "    model=student, teacher_model=teacher, args=settings,\n" +
      "    processing_class=tokenizer,\n" +
      "    train_dataset=Dataset.from_dict({\"prompt\": training_prompts}),\n" +
      ")\n" +
      "trainer.train()"
    }</CodeBlock>
    
    <Prose>{
      "The dataset contains prompts. The student samples continuations; the teacher provides " +
      "full-vocabulary feedback at those student-visited prefixes. Sampled token IDs are detached " +
      "choices, so this performs the local objective described in section 8, not the full " +
      "visitation derivative. Beta 0 selects forward KL; beta 1 selects reverse KL; interior beta " +
      "selects the weighted JSD convention already derived. The native temperature rescales logits " +
      "without the T² multiplier from section 4. Do not silently import that multiplier or its " +
      "learning-rate interpretation into this API."
    }</Prose>
    
    <Prose>{
      "There are two prospectively specified routes on the first 64 training poems in original-ID " +
      "order. The offline route generates one greedy teacher response per prompt, retains only " +
      "responses ending in EOS within eight tokens, and trains response-only hard CE. The on-policy " +
      "route uses the native trainer above. Both start from the exact same three-block student, use " +
      "seed 17 and perform 24 updates with batch four, constant learning rate 1e-4, no weight decay " +
      "and gradient clipping at one. Every final short offline batch is retained. The routes change " +
      "both target information and prefix source; their comparison does not isolate either choice."
    }</Prose>
    
    <Prose>{
      "The native on-policy route retains the sampled valid positions even when a continuation " +
      "reaches the eight-token horizon without EOS. This differs from the offline route's " +
      "whole-sequence termination filter: local teacher vectors are still available at those " +
      "visited positions. In the actual 24 generated batches, 96 student continuations provide 390 " +
      "valid target positions. The saved position masks, rather than the token value used for " +
      "padding, define those counts."
    }</Prose>
    
    <Prose>{
      "The source, pretrained files, selected teacher, data, library versions and successful " +
      "preflight are frozen before either route generates a target or updates a parameter. The " +
      "complete program records teacher candidates, actual on-policy IDs and masks, losses, " +
      "optimizer checkpoints and final states. It preserves terminal stages on rerun. Only after " +
      "both routes terminate are the teacher, initial student and final students evaluated on all " +
      "105 development and 104 test poems. No checkpoint or hyperparameter is selected on these " +
      "outcomes. The downloadable result packet contains every result, including invalid " +
      "completions."
    }</Prose>
    
    <Prose>{"The older experimental "}<code>{"GKDTrainer"}</code>{" is a different API. In the inspected version, its "}<code>{"seq_kd=True"}</code>{
      " option changes where the sequence comes from but still uses a distribution loss; it does " +
      "not implement hard sequence CE merely because its name contains “sequence.” Its inspected " +
      "loss path also does not forward the configured temperature into the loss helper. Read the " +
      "pinned implementation when reproducing a paper; a similarly named flag is not a mathematical " +
      "contract. The complete program here uses "
    }<code>{"DistillationTrainer"}</code>{"."}</Prose>
    
    <Program file="distillation_native.py" />
    
    <Prose>{"The input downloader verifies the pinned base-file hashes before loading. "}<code>{"sft_data.py"}</code>{" reuses the previously taught literal prompt and response boundary; "}<code>{"sft_evaluate.py"}</code>{
      " separately reports free greedy generation, complete candidate label probability and pooled " +
      "reference-token NLL. Reusing these implementations keeps the evaluation definition " +
      "consistent across SFT and distillation. The complete setup and commands are in the " +
      "accompanying README."
    }</Prose>
    
    <Program file="acquire_model.py" />
    
    <Program file="sft_data.py" />
    
    <Program file="sft_evaluate.py" />
    
    <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
    <H2>{"13. Measure transfer and account for its cost"}</H2>
    
    <Prose>{
      "A student may assign higher probability to a correct reference continuation without " +
      "selecting it during free generation. It may also copy a teacher's wrong answer very " +
      "accurately. We therefore keep three questions separate: How well does the model predict " +
      "reference tokens? What does it actually generate? How closely does it imitate the teacher?"
    }</Prose>
    
    <DistillOutcomes />
    
    <Prose>{
      "In the arithmetic study, the selected teacher answers 0 of 28 test questions and 0 of 14 " +
      "shifted questions correctly. All 28 test outputs are structurally valid and end in EOS, with " +
      "mean response length nine. Its test reference NLL is 1.350635 nats per target. The model " +
      "learned the output grammar much better than it learned the held-out arithmetic mapping."
    }</Prose>
    
    <Prose>{
      "These are the first two held-out families in the predeclared display order, including all " +
      "four multipliers. Every shown teacher response ends in a real EOS. The repeated wrong sums " +
      "make the generalization failure concrete."
    }</Prose>
    
    <NeuralTable caption={"13. Measure transfer and account for its cost"} headers={[<>{"Prompt (a:b:c)"}</>,<>{"Correct answer"}</>,<>{"Literal selected-teacher response before EOS"}</>]} rows={[[<>{"2:5:1"}</>,<>{"7"}</>,<>{""}<code>{"sum 5 ; product 5 ; answer 5"}</code>{""}</>],[<>{"2:5:2"}</>,<>{"14"}</>,<>{""}<code>{"sum 10 ; product 20 ; answer 20"}</code>{""}</>],[<>{"2:5:3"}</>,<>{"21"}</>,<>{""}<code>{"sum 5 ; product 15 ; answer 15"}</code>{""}</>],[<>{"2:5:4"}</>,<>{"28"}</>,<>{""}<code>{"sum 5 ; product 20 ; answer 20"}</code>{""}</>],[<>{"4:5:1"}</>,<>{"9"}</>,<>{""}<code>{"sum 12 ; product 12 ; answer 12"}</code>{""}</>],[<>{"4:5:2"}</>,<>{"18"}</>,<>{""}<code>{"sum 12 ; product 24 ; answer 24"}</code>{""}</>],[<>{"4:5:3"}</>,<>{"27"}</>,<>{""}<code>{"sum 12 ; product 36 ; answer 36"}</code>{""}</>],[<>{"4:5:4"}</>,<>{"36"}</>,<>{""}<code>{"sum 12 ; product 48 ; answer 48"}</code>{""}</>]]} />
    
    <Prose>{
      "Every selected student outcome is below. “Invalid” means the complete emitted sequence fails " +
      "that arm's declared grammar. NLL uses full gold traces for trace arms and gold " +
      "integer-plus-EOS responses for answer-only, so comparing those two NLL columns as if they " +
      "were the same prediction task would be misleading."
    }</Prose>
    
    <NeuralTable caption={"13. Measure transfer and account for its cost"} headers={[<>{"Recipe / seed"}</>,<>{"Selected update"}</>,<>{"Test correct / 28"}</>,<>{"Invalid / 28"}</>,<>{"Reference NLL"}</>,<>{"Shift correct / 14"}</>,<>{"Shift invalid / 14"}</>]} rows={[[<>{"Gold / 17"}</>,<>{"200"}</>,<>{"2"}</>,<>{"0"}</>,<>{"1.297169"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Hard / 17"}</>,<>{"200"}</>,<>{"2"}</>,<>{"0"}</>,<>{"1.326949"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Soft / 17"}</>,<>{"200"}</>,<>{"2"}</>,<>{"0"}</>,<>{"1.339035"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Answer / 17"}</>,<>{"400"}</>,<>{"1"}</>,<>{"0"}</>,<>{"2.893883"}</>,<>{"0"}</>,<>{"1"}</>],[<>{"Verified / 17"}</>,<>{"200"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1.294130"}</>,<>{"1"}</>,<>{"0"}</>],[<>{"Gold / 29"}</>,<>{"200"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1.058484"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Hard / 29"}</>,<>{"200"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1.055674"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Soft / 29"}</>,<>{"200"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1.055729"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Answer / 29"}</>,<>{"400"}</>,<>{"0"}</>,<>{"0"}</>,<>{"3.505814"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Verified / 29"}</>,<>{"200"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1.060689"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"Gold / 43"}</>,<>{"0"}</>,<>{"0"}</>,<>{"28"}</>,<>{"4.998623"}</>,<>{"0"}</>,<>{"14"}</>],[<>{"Hard / 43"}</>,<>{"0"}</>,<>{"0"}</>,<>{"28"}</>,<>{"4.998623"}</>,<>{"0"}</>,<>{"14"}</>],[<>{"Soft / 43"}</>,<>{"0"}</>,<>{"0"}</>,<>{"28"}</>,<>{"4.998623"}</>,<>{"0"}</>,<>{"14"}</>],[<>{"Answer / 43"}</>,<>{"0"}</>,<>{"0"}</>,<>{"27"}</>,<>{"4.899971"}</>,<>{"0"}</>,<>{"14"}</>],[<>{"Verified / 43"}</>,<>{"200"}</>,<>{"1"}</>,<>{"3"}</>,<>{"1.080616"}</>,<>{"0"}</>,<>{"1"}</>]]} />
    
    <Prose>{
      "The untrained seed-43 checkpoint wins four earliest-tie selections because development " +
      "final-answer accuracy never improves above its initial value at the prescribed checkpoints. " +
      "Replacing that checkpoint with a later one after examining the test set would change the " +
      "experiment. All fifteen arms still completed 600 updates. These selections reveal a weakness " +
      "of the chosen development signal for this tiny task; they are not missing fits."
    }</Prose>
    
    <Prose>{
      "Hard and soft have the same test correct counts for all three seeds here. That is not " +
      "evidence that full distributions never help. Conversely, the verified seed-17 student's one " +
      "shifted success does not establish a robust advantage. The samples are small, four prompts " +
      "share each held-out (a,b) family, and all shifted cases reuse those families. Treating the " +
      "28 prompts as 28 independent arithmetic families would understate uncertainty. The download " +
      "includes the paired outputs so a difference can be inspected by family, rather than inferred " +
      "from a mean-only ranking."
    }</Prose>
    
    <Prose>{
      "The pretrained poem experiment also retains every planned outcome. Its offline teacher " +
      "collection produces 64 responses, of which 63 end in EOS within eight tokens and become hard " +
      "training targets. Both student routes complete 24 updates. Their final free generations " +
      "choose "
    }<code>{"no impact"}</code>{" for every development and test poem: the original training-majority decision."}</Prose>
    
    <NeuralTable caption={"13. Measure transfer and account for its cost"} headers={[<>{"Model / split"}</>,<>{"Free correct"}</>,<>{"Macro F1"}</>,<>{"Invalid"}</>,<>{"Candidate correct"}</>,<>{"Reference NLL"}</>,<>{"Exact teacher-ID agreement"}</>]} rows={[[<>{"Teacher / dev"}</>,<>{"78/105"}</>,<>{"0.646732"}</>,<>{"0/105"}</>,<>{"78/105"}</>,<>{"0.261543"}</>,<>{"—"}</>],[<>{"Teacher / test"}</>,<>{"77/104"}</>,<>{"0.620514"}</>,<>{"0/104"}</>,<>{"77/104"}</>,<>{"0.260335"}</>,<>{"—"}</>],[<>{"Initial student / dev"}</>,<>{"0/105"}</>,<>{"0"}</>,<>{"105/105"}</>,<>{"17/105"}</>,<>{"13.802400"}</>,<>{"0/105"}</>],[<>{"Initial student / test"}</>,<>{"0/104"}</>,<>{"0"}</>,<>{"104/104"}</>,<>{"16/104"}</>,<>{"13.837628"}</>,<>{"0/104"}</>],[<>{"Offline CE / dev"}</>,<>{"69/105"}</>,<>{"0.264368"}</>,<>{"0/105"}</>,<>{"69/105"}</>,<>{"0.630983"}</>,<>{"77/105"}</>],[<>{"Offline CE / test"}</>,<>{"69/104"}</>,<>{"0.265896"}</>,<>{"0/104"}</>,<>{"69/104"}</>,<>{"0.640743"}</>,<>{"76/104"}</>],[<>{"On-policy KL / dev"}</>,<>{"69/105"}</>,<>{"0.264368"}</>,<>{"0/105"}</>,<>{"69/105"}</>,<>{"0.348979"}</>,<>{"77/105"}</>],[<>{"On-policy KL / test"}</>,<>{"69/104"}</>,<>{"0.265896"}</>,<>{"0/104"}</>,<>{"69/104"}</>,<>{"0.351303"}</>,<>{"76/104"}</>]]} />
    
    <Prose>{
      "Every teacher/final-student output reaches EOS; none of the initial student's free outputs " +
      "does. Candidate scoring still returns a label for that initial student because it compares " +
      "three complete allowed responses, whereas free generation is allowed to leave the label set. " +
      "After training, on-policy KL has lower gold-response NLL than offline CE but the same " +
      "majority-only free decisions and macro F1. These measurements show probability transfer and " +
      "a working native update, without establishing a better classifier than the majority " +
      "baseline. Their high agreement with a teacher that often says "
    }<code>{"no impact"}</code>{" does not reproduce its minority-class performance."}</Prose>
    
    <DistillCosts />
    
    <Prose>{
      "The arithmetic teacher has 117,120 parameters and each student 21,408, about 81.72% fewer. " +
      "Teacher fitting processes 19,200 examples and 172,800 target positions. Once-generation " +
      "produces 256 candidates and 2,304 emitted tokens; these include rejected outputs because " +
      "generation cost is paid before filtering. The four unfiltered student recipes each process " +
      "9,563 examples. Gold, hard and soft each use 86,067 target positions, while answer-only uses " +
      "19,126. Verified uses 9,452 examples and 85,068 target positions. Equal update counts do not " +
      "equalize target exposure. Full-vocabulary teacher evaluation and soft-target storage " +
      "introduce additional costs that a token count alone does not capture."
    }</Prose>
    
    <Prose>{
      "The retained teacher fitting wall time is about 38.5 seconds in this CPU run, and its " +
      "candidate generation takes about 2.58 seconds. These are observations of this run with its " +
      "small models and environment, not comparative serving benchmarks. We did not measure " +
      "end-to-end deployed latency, throughput or GPU memory, so the parameter reduction cannot be " +
      "presented as a measured speedup. In the native example, dropping half the blocks removes " +
      "only 594,816 parameters: the 50,304-by-128 embedding and vocabulary matrices remain large."
    }</Prose>
    
    <Prose>{
      "For a deployment decision, put costs in the same unit. If preparation costs C₀, a teacher " +
      "query costs cₜ and a student query costs cₛ, the student system costs C₀+Ncₛ for N queries. " +
      "It is cheaper than Ncₜ when"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"N>\\frac{C_0}{c_t-c_s},\\qquad c_t>c_s."}</MathBlock>
    </div>
    
    <Prose>{
      "For a constructed example with C₀=60 cost units, cₜ=0.03 and cₛ=0.01, the systems tie at " +
      "3,000 queries and the student becomes cheaper above that. If cₛ≥cₜ and C₀>0, there is no " +
      "positive break-even point. The cost model must also include required quality: a cheaper " +
      "model that fails the intended task does not become suitable merely by crossing a financial " +
      "threshold."
    }</Prose>
    
    <Program file="distillation_evaluate.py" />
    
    <span id="7-decision-matrix" aria-hidden="true" />
    <H2>{"14. Choose a route from the information available"}</H2>
    
    <Prose>{
      "The experiments bring us back to the opening question. We can transfer an accessible signal, " +
      "then test whether the transferred behavior serves the task. Neither model size nor teacher " +
      "confidence supplies that second conclusion."
    }</Prose>
    
    <DistillRoute />
    
    <Prose>{
      "If the teacher exposes full probabilities and the two vocabularies denote the same events, " +
      "use the aligned token objective and an explicit mask. Decide whether prefixes come from " +
      "saved completions or student rollouts independently of the choice of forward KL, reverse KL " +
      "or interior JSD. If only literal text is available, tokenize it with the student tokenizer " +
      "and train sequence CE; this route can cross tokenizers because it transfers strings rather " +
      "than assuming coordinate correspondence. If no usable teacher output is available, there is " +
      "no teacher target to distill."
    }</Prose>
    
    <Prose>{
      "Hidden-state or attention matching is another possibility when internal representations are " +
      "accessible. Different widths or layer counts require an explicit mapping and its own " +
      "objective. Those methods are not implemented by the output-distribution loss here. " +
      "Similarly, quantization changes numerical representation, and pruning removes selected model " +
      "structure. They can be combined with distillation but answer different questions."
    }</Prose>
    
    <Prose>{
      "A teacher is not a mathematical ceiling on a student's external accuracy. For a constructed " +
      "four-question example, suppose a teacher gets three correct. An independent arithmetic " +
      "checker supplies a correction for the fourth, and the student learns all four answers. The " +
      "student reaches 4/4 while the teacher remains at 3/4, but the correction brought additional " +
      "information; pure copying did not create it. Regularization, different data, ensembles or a " +
      "different evaluation distribution can also change external accuracy. Conversely, exactly " +
      "matching a fixed teacher on the evaluated inputs means matching its errors on those inputs " +
      "as well."
    }</Prose>
    
    <Prose>{"In "}<strong>{"self-distillation"}</strong>{
      ", a model supplies targets for another training instance with the same architecture, often a " +
      "later student trained from a fixed earlier checkpoint. The two parameter sets still have " +
      "different roles. If the very same model at the very same input supplies a detached target " +
      "equal to its current output, token KL and its student gradient are zero. To obtain a " +
      "learning signal, a self-distillation recipe must introduce a meaningful difference, such as " +
      "a fixed earlier teacher, different views, other data or an additional supervised objective. " +
      "“Same architecture” does not imply “identical current distribution.”"
    }</Prose>
    
    <Prose>{"Distillation asks how to learn from an available teacher signal. The next "}<a href={"/learn/path/full-curriculum/rl-for-reasoning-deepseek-r1-style?module=large-language-models"}>{"RL for Reasoning lesson"}</a>{
      " asks how to improve a policy using feedback about sampled reasoning outcomes. Keep the " +
      "distinction precise: a scalar checker reward evaluates a sampled answer, whereas a teacher " +
      "distribution provides a target for every vocabulary coordinate at an inspected prefix."
    }</Prose>
    </section>
    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
    <span id="11-self-check-exercises" aria-hidden="true" />
    <H2>{"Practice"}</H2>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"A. Find the moving target"}</H3>
    
    <Prose>{
      "A training loop includes both teacher and student parameters in AdamW, and the teacher " +
      "forward runs with gradient tracking. Its loss is KL(qθ∥pφ). Explain why a falling loss does " +
      "not demonstrate that the student learned the original teacher. Repair the parameter and " +
      "graph ownership without using "
    }<code>{"no_grad()"}</code>{" around the student."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" There are two different ways to move two probability vectors closer."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" The optimizer can move q as well as p; agreement may improve because the target changes. Set "}<code>{"teacher.requires_grad_(False)"}</code>{
      ", evaluate the teacher without a gradient graph, and pass only student parameters to the " +
      "optimizer. The student forward must retain its graph so the loss can reach φ. Record the " +
      "teacher state before and after an update and require exact equality. Also require nonzero " +
      "finite student gradients on a mismatched fixture: an unchanged teacher alone does not prove " +
      "a functioning learning path."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"B. What does an argmax discard?"}</H3>
    
    <Prose>{
      "Two teachers assign probabilities [0.7, 0.2, 0.1] and [0.7, 0.1, 0.2] to tokens A, B and C. " +
      "A dataset saves only the greedy token. Can a student recover which teacher produced a row? " +
      "What changes if the dataset contains many independent samples from the same fixed teacher?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Separate a deterministic transformation from a random observation."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Both greedy transformations save A, so that stored row cannot distinguish the two " +
      "distributions. Independent teacher samples can reveal different B/C frequencies across " +
      "repeated draws, with sampling uncertainty. One sampled A still does not identify either " +
      "vector. Exact full probabilities preserve information about alternatives that this hard " +
      "target discards."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"C. Equal-width vectors, different events"}</H3>
    
    <Prose>{
      "Teacher IDs are [red, blue, EOS], student IDs [EOS, red, blue]. Teacher q is [0.5, 0.3, " +
      "0.2]; student probabilities in its own ID order are [0.2, 0.5, 0.3]. Should KL be zero? " +
      "Modify the vocabulary-alignment fixture to show both the incorrect direct-index calculation " +
      "and the repaired result."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Construct the student index for each teacher event before comparing."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The teacher-to-student index mapping is [1, 2, 0]. Reindexing student p gives [0.5, 0.3, " +
      "0.2], exactly q, so KL and its aligned gradient are zero up to numerical tolerance. Direct " +
      "index subtraction compares red with EOS and produces a positive discrepancy. Assert the " +
      "repaired zero, unchanged normalization and correct token strings for each matched " +
      "coordinate. If one tokenizer splits “blue” into multiple tokens, this permutation repair is " +
      "no longer sufficient; use a string-transfer route or a separately defined cross-tokenizer " +
      "objective."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"D. Keep track of temperature factors"}</H3>
    
    <Prose>{
      "At T=2, teacher logits [2 ln 4, 0] give q=[0.8,0.2], and student logits [0,0] give " +
      "p=[0.5,0.5]. Compute the student-logit gradient for KL(q∥p) and for T²KL(q∥p). Then take an " +
      "SGD step of size 0.1 for the scaled objective."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Differentiating the divided logits introduces a factor 1/T."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Unscaled gradient is (p−q)/T=[−0.15,0.15]. Multiplying the objective by T²=4 gives " +
      "[−0.6,0.6]. Subtracting 0.1 times this gradient gives new logits [0.06,−0.06]. Their sum " +
      "remains zero. The target is detached: no derivative is propagated through q. These gradients " +
      "differ by a factor four at this fixed T; that does not mean changing T leaves scaled " +
      "gradients fixed."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"E. Center before taking the high-temperature limit"}</H3>
    
    <Prose>{
      "Teacher logits are [2,0] and student logits [0,0]. Compute the limiting value of T²KL(qT∥pT) " +
      "as T grows. Does adding 100 to both teacher logits change it?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Subtract each vector's own mean, then use the squared centered gap divided by twice the " +
      "vocabulary size."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Centered teacher logits are [1,−1] and centered student logits [0,0]. The squared gap sums " +
      "to 2, so the limit is 2/(2×2)=0.5. Adding 100 does not change centered logits or softmax at " +
      "any finite T. Comparing raw uncentered squares instead would assign a loss to an " +
      "unidentifiable common offset, contradicting the probability model."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"F. Remove the capacity restriction"}</H3>
    
    <Prose>{
      "Section 5 uses p(u)=[u²,2u(1−u),(1−u)²] and q=[0.49,0.02,0.49]. Suppose instead the student " +
      "can choose any strictly positive categorical vector. Where are the global minima of both KL " +
      "directions? Why is this not a contradiction of the restricted-family example?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Ask whether q itself is an allowed student distribution."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Both divergences are nonnegative and zero at p=q, so that distribution is a common global " +
      "minimum. The one-parameter family cannot represent q: equal first/third masses force u=0.5, " +
      "giving a middle mass of 0.5 rather than 0.02. Different projections onto that restricted " +
      "family produce the earlier contrast. “Reverse KL always drops a mode” is therefore too " +
      "broad; the model family and optimization situation matter."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"G. A two-step sequence distribution"}</H3>
    
    <Prose>{
      "Teacher first-token probabilities are [0.6,0.4]. After A its second-token probabilities are " +
      "[0.8,0.2]; after B they are [0.25,0.75]. Compute all four joint probabilities. A student " +
      "assigns [0.25,0.25,0.1,0.4] to those same leaves. Write the teacher-expected sequence CE. " +
      "Would always copying the most likely teacher sequence estimate that expectation?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Multiply along each path, then weight every leaf's student log loss."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " For AA, AB, BA and BB the teacher masses are [0.48,0.12,0.1,0.3], which sum to one. CE is " +
      "−0.6 ln(0.25)−0.1 ln(0.1)−0.3 ln(0.4), approximately 1.336922 nats. Greedy copying selects " +
      "AA and yields −ln(0.25)=1.386294 nats for this student; it is a different deterministic " +
      "objective. Independent teacher sampling provides an unbiased Monte Carlo estimate of the " +
      "complete expectation, while any finite sample can deviate from it."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"H. EOS shares an ID with pad storage"}</H3>
    
    <Prose>{
      "Two responses have valid target masks [1,1,0,0] and [1,1,1,1]. Both last valid targets are " +
      "EOS ID 0; unused storage also contains ID 0. Their total negative log likelihoods are 2 and " +
      "12 nats. Compute the pooled token mean and the mean of per-response means. State the correct " +
      "ID/mask behavior."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Count six valid positions, not the number of nonzero token IDs."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The pooled mean is 14/6=2.333333 nats per target. Equal response weighting gives " +
      "(2/2+12/4)/2=2. The first objective weights the longer response twice as heavily. Both EOS " +
      "targets remain selected; only the two storage positions are ignored. Masking every ID 0 " +
      "would remove real termination supervision. In the full program, vary the amount of " +
      "right-padding and assert unchanged loss and valid-position gradients, with zero padding " +
      "gradients."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"I. Find the omitted visitation gradient"}</H3>
    
    <Prose>{
      "A binary first-token softmax currently has probabilities [0.5,0.5]. The two continuation " +
      "costs are C₀=0.1 and C₁=0.3, held fixed for this calculation. For J=p₀C₀+p₁C₁, compute the " +
      "derivative with respect to the two first-token logits. What happens when C₀=C₁ or when the " +
      "prefix probabilities are detached?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The first coordinate is p₀p₁(C₀−C₁)."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The derivative is [−0.05,0.05]. Increasing the first logit shifts visitation toward the " +
      "lower-cost continuation. Equal costs make both coordinates zero because redistributing " +
      "probability cannot change the expectation. Detaching p also gives zero from this path, even " +
      "when the costs differ. Local divergence losses may supply other gradients, but they do not " +
      "restore this missing path. Extend "
    }<code>{"distillation_sequences.py"}</code>{
      " with a new pair of continuation rows and require the full finite-difference gradient to " +
      "match local plus visitation terms; require only the detached autograd calculation to match " +
      "the local-only derivative."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"J. A right answer with an invalid step"}</H3>
    
    <Prose>{"For "}<code>{"(4+2)*3"}</code>{", a teacher prints "}<code>{"sum 6 ; product 15 ; answer 18"}</code>{
      " followed by EOS. Decide structural validity, final correctness, sum correctness, product " +
      "correctness and answer-to-product consistency. Would a final-only filter keep it?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Parsing and evaluating an assertion are separate operations."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The grammar is valid and the final answer 18 is correct. The sum 6 is correct, but 6×3 is " +
      "18 rather than the claimed product 15. The answer also disagrees with the displayed product. " +
      "A final-only filter keeps it; the full-step checker rejects it. This does not show what " +
      "internally caused the model's answer, only that its emitted explanation contains a false " +
      "claim."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"K. Read a distillation result with its conditions"}</H3>
    
    <Prose>{
      "A summary says: “R1-Distill proves that all small models should use distillation instead of " +
      "RL, and its released six models were RL-trained.” Repair both claims using the specific " +
      "experiment described in section 10."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Separate how the teacher obtained its behavior from how each released student was trained, " +
      "and keep the comparison's model size."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The six distilled releases use SFT on the selected data; the teacher's preceding RL does " +
      "not make each student's optimization RL. The reported direct-RL versus distillation " +
      "comparison is a particular 32B setup and its benchmark results. It supports that comparison, " +
      "not a universal impossibility of improvement from RL at smaller scales or in other settings. " +
      "The relevant data mixture and starting checkpoints also remain part of the recipe; the model " +
      "name alone does not specify them."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"L. Split the underlying family"}</H3>
    
    <Prose>{"A dataset contains "}<code>{"(2+5)*1"}</code>{", "}<code>{"(2+5)*2"}</code>{", "}<code>{"(2+5)*3"}</code>{" and "}<code>{"(2+5)*4"}</code>{
      ". A random row split puts the first three in training and the last in test. What does that " +
      "test measure that an unseen-(a,b)-family split does not? What grouping should handle "
    }<code>{"(5+2)*4"}</code>{" if commutative duplicates can occur?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" A shared intermediate sum links the four rows."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The test assesses a new multiplier within a seen addend family, where learning or " +
      "memorizing the intermediate sum can help. It does not establish transfer to unseen addend " +
      "families. Use a canonical group key "
    }<code>{"(min(a,b),max(a,b))"}</code>{
      " so commutative forms and all multiplier variants stay in one split. Our separate " +
      "shifted-multiplier set deliberately asks another question; its relationship to test families " +
      "must remain explicit."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"M. Check a short final chunk"}</H3>
    
    <Prose>{
      "There are seven valid completion positions, vocabulary size five and chunk size three. Give " +
      "the three chunk shapes and the global loss denominator. Describe a parity check that would " +
      "catch accidentally averaging chunk means."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The last tile has one row, not three."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Each model projects tiles [3,5], [3,5] and [1,5]. Sum all seven per-position divergences " +
      "and divide by seven. Averaging the three chunk means would give the single final position " +
      "one third of the total weight. Use unequal per-position losses, compare against full logits " +
      "at chunk sizes 1, 3 and larger than seven, and compare every student gradient as well as the " +
      "scalar loss. Require no teacher gradients and exact zero for an all-masked batch. Identical " +
      "per-position losses alone would hide the weighting bug."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"N. Cost and quality use different denominators"}</H3>
    
    <Prose>{
      "Preparation costs 120 units. Teacher and student calls cost 0.05 and 0.02 units. Find the " +
      "break-even query count. A student gets 3 of 20 test questions correct, emits structurally " +
      "valid answers on 12, and matches the teacher on 15. Report accuracy, validity and agreement " +
      "without replacing one with another."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Use all 20 questions for the three stated task-level proportions."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The systems tie at 120/(0.05−0.02)=4,000 queries; student serving is cheaper above that " +
      "under this cost model. Accuracy is 15%, validity 60% and agreement 75%. Dividing 3 by 12 " +
      "would instead report accuracy conditional on validity and would conceal eight invalid " +
      "outputs. Agreement does not establish correctness unless the teacher is an independently " +
      "perfect reference."
    }</Prose>
    </details>
    </section>
    <section className="distill-practice" data-lesson-exercise>
    <H3>{"O. Pick the available transfer signal"}</H3>
    
    <Prose>{
      "A remote teacher returns text but no logits. Its tokenizer differs from your student's. A " +
      "colleague proposes padding its token-ID sequence to the student's vocabulary width and " +
      "minimizing token KL. Propose a working route and name the information it cannot recover."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Text is a shared object even when vocabulary coordinates are not."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Save the literal completion with prompt/provenance, apply a declared quality and " +
      "termination policy, tokenize the text with the student tokenizer, and train EOS-inclusive " +
      "response-only CE. Padding token IDs does not create a probability distribution or align " +
      "next-token events. The hard text route cannot recover the teacher's unreturned probabilities " +
      "for alternatives. If later full distributions become available, event alignment still needs " +
      "a separate check before direct KL becomes valid."
    }</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="takeaways">
    <H2>{"Key takeaways"}</H2>
    
    <ul>
    <li>{
      "Distillation transfers an available supervision signal. Full distributions, hard tokens and " +
      "complete responses preserve different information."
    }</li>
    <li>{
      "Compare probabilities at the same prefix over the same events. Temperature, divergence " +
      "direction, masks, denominators and prefix source each change the mathematical objective."
    }</li>
    <li>{
      "Student-visited prefixes give useful local teacher feedback, but detached generation does " +
      "not differentiate the full visitation distribution."
    }</li>
    <li>{
      "A generated trace is a set of emitted claims. Parsing, final correctness, step correctness " +
      "and faithful internal reasoning are distinct questions."
    }</li>
    <li>{
      "Working loss code is not a task-quality result. Retain poor seeds, invalid outputs, all " +
      "selection rules, actual token costs and the teacher's own errors."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"Further reading"}</H2>
    
    <ul>
    <li>{""}<a href={"https://rlhfbook.com/c/12-synthetic-data"}>{"RLHF Book, Synthetic Data and Distillation"}</a>{
      " develops the transition from generated datasets to on-policy supervision. Read its " +
      "prefix-source discussion alongside section 8's explicit derivative."
    }</li>
    <li>{""}<a href={"https://harvard-iacs.github.io/2020-AC295/lectures/lecture7/notebook/"}>{"Harvard AC295 distillation notebook"}</a>{
      " gives a smaller classification setting for softened targets and deployment motivation. Use " +
      "stable log-softmax when adapting its implementation."
    }</li>
    <li>{""}<a href={"https://huggingface.co/docs/trl/distillation_trainer"}>{"TRL DistillationTrainer documentation"}</a>{
      " describes the ordinary API and memory strategy. This lesson's executed contract is version " +
      "1.14.2; verify the installed version before reproducing it."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <span id="10-primary-sources" aria-hidden="true" />
    <H2>{"References"}</H2>
    
    <ul>
    <li>{""}<a href={"https://arxiv.org/abs/1503.02531"}>{"Hinton, Vinyals and Dean, Distilling the Knowledge in a Neural Network (2015)"}</a>{": softened targets, mixed hard/soft supervision and the centered-logit limit."}</li>
    <li>{""}<a href={"https://arxiv.org/abs/1606.07947"}>{"Kim and Rush, Sequence-Level Knowledge Distillation (2016)"}</a>{": sequence objectives and practical high-probability sequence approximation."}</li>
    <li>{""}<a href={"https://arxiv.org/html/2306.13649v3"}>{
      "Agarwal et al., On-Policy Distillation of Language Models: Learning from Self-Generated " +
      "Mistakes (v3, 2024)"
    }</a>{": teacher feedback on student-generated prefixes and detached sampling."}</li>
    <li>{""}<a href={"https://arxiv.org/html/2306.08543v3"}>{"Gu et al., MiniLLM (v3, 2024)"}</a>{
      ": sequence reverse KL and a practical optimization method beyond this lesson's exact " +
      "two-step derivative demonstration."
    }</li>
    <li>{""}<a href={"https://arxiv.org/html/2305.02301v2"}>{"Hsieh et al., Distilling Step-by-Step (2023)"}</a>{
      ": separate rationale/label multitask supervision, distinct from concatenated autoregressive " +
      "trace training."
    }</li>
    <li>{""}<a href={"https://arxiv.org/html/2501.12948v2"}>{"DeepSeek-R1 (v2, 4 January 2026)"}</a>{
      ": Appendix B.3.3/B.4.3, F/F.1 and Tables 5, 6, 15 and 16 for the data, student recipes and " +
      "the specific RL comparison discussed here."
    }</li>
    <li>{""}<a href={"https://github.com/huggingface/trl/blob/v1.14.2/trl/trainer/distillation_trainer.py"}>{"TRL 1.14.2 DistillationTrainer source"}</a>{": chunked hidden-state projections, masking, mixture convention and generation."}</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"What's next"}</H2>
    
    <Prose>{
      "Run the finite probability and sequence programs first, then inspect the saved candidate " +
      "ledger and all held-out outputs before deciding whether a new fit is worth its cost. The "
    }<a href={"/learn/path/full-curriculum/rl-for-reasoning-deepseek-r1-style?module=large-language-models"}>{"RL for Reasoning lesson"}</a>{
      " continues from imitation to outcome-driven policy updates. The distillation programs remain " +
      "useful there as a way to package a stronger model's behavior into another student, with the " +
      "same requirements for target quality and independent evaluation."
    }</Prose>
    </section>
  </div>;
}
export default {
  title: 'Knowledge Distillation for LLMs (DeepSeek-R1-Distill, CoT Distillation)',
  slug: 'knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation',
  readTime: '~75 min read + 90 min practice', content: DistillationLesson,
};
