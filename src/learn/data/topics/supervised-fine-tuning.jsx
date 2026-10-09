// Generated from frozen content by scripts/render-sft-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { SftTable as NeuralTable } from '../../components/lesson-labs/SftFlowShared.jsx';
import { SftUpdate, SftChoices, SftSerialization, SftFamilies, SftShift, SftLoss, SftPromptCredit, SftHistories, SftRoles, SftBoundary } from '../../components/lesson-labs/SftFoundations.jsx';
import { SftPadding, SftDenominator, SftPackedMask, SftPositions, SftPipeline, SftNativeTrainer, SftExperiment, SftCapstone } from '../../components/lesson-labs/SftBatching.jsx';
import { SftResults, SftConfusion, SftDiagnosis } from '../../components/lesson-labs/SftStudy.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="sft-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/supervised-fine-tuning/' + file}
    language="python" title={file} filename={file} />
);
function SftLesson() {
  return <div className="lesson-flow sft-flow">
    <section>
    <Prose opening="summary">{
      "A language model can continue text without reliably doing what a person asks. How does a " +
      "collection of desired responses become an update that changes that behavior? Follow one " +
      "demonstration all the way from its source record to the predictions that count, the " +
      "gradients that move the model, and an output generated without access to the answer."
    }</Prose>
    
    <Prose opening="route">{
      "You will implement the objective and its backward pass, preserve it while batching and " +
      "packing examples, check an ordinary trainer against the explicit computation, and examine a " +
      "real adaptation experiment. The experiment starts from a public pretrained model and " +
      "predicts three labels for held-out verses. Its limited task is useful precisely because we " +
      "can inspect the complete data and evaluation path. It does not stand in for a general " +
      "instruction-following benchmark."
    }</Prose>
    
    <Prose opening="prerequisites">{"The "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"causal language-modeling lesson"}</a>{
      " supplies next-token prediction, causal attention and the small decoder reused here. We " +
      "refresh the needed shift before changing which predictions receive loss. For a first pass, " +
      "read sections 1–6, then 8–12. Section 7 is a visible deeper branch on preserving the same " +
      "computation when examples share storage."
    }</Prose>
    
    <H2>{"1. Continue the model toward desired responses"}</H2>
    
    <Prose>{
      "Suppose a prompt asks for the sentiment of a verse. A base model assigns probabilities to " +
      "continuations such as "
    }<code>{" positive"}</code>{", "}<code>{" no impact"}</code>{
      ", and a paragraph about poetry. A demonstration pairs that prompt with the desired " +
      "continuation. Training increases its conditional probability by adjusting the model's " +
      "parameters. The architecture can remain exactly the same."
    }</Prose>
    
    <SftUpdate />
    
    <Prose>{""}<strong>{"Supervised fine-tuning"}</strong>{
      ", or SFT, means continuing training from an existing checkpoint using supplied target " +
      "outputs. The checkpoint contains learned parameters; the demonstrations specify which " +
      "behavior the new updates reward. Starting the same architecture from random weights is " +
      "training from scratch. Putting chat-looking labels on random-model training does not make it " +
      "a fine-tune."
    }</Prose>
    
    <Prose>{
      "The supervision may come from people, a program, an existing annotated dataset, or another " +
      "model. Its origin does not determine the loss automatically. Likewise, the choice to update " +
      "every parameter or only adapters does not determine which tokens receive loss. Keep four " +
      "choices separate."
    }</Prose>
    
    <SftChoices />
    
    <NeuralTable caption={"1. Continue the model toward desired responses"} headers={[<>{"Choice"}</>,<>{"This lesson's real experiment"}</>,<>{"What can change independently?"}</>]} rows={[[<>{"Source of targets"}</>,<>{"Released human sentiment annotations"}</>,<>{"Generated responses or executable task answers"}</>],[<>{"Objective"}</>,<>{"Response-only or full-sequence next-token cross-entropy"}</>,<>{"Preference or reward objectives require a different contract"}</>],[<>{"Trainable parameters"}</>,<>{"All parameters of one pretrained model"}</>,<>{"LoRA adapters or soft prompts can restrict the updated subset"}</>],[<>{"Inference format"}</>,<>{"The same literal sentiment prompt used in training"}</>,<>{"A different template may change the model's conditioning"}</>]]} />
    
    <Prose>{
      "SFT is often one stage of post-training. That is a description of a pipeline, not evidence " +
      "that SFT alone guarantees helpfulness, factuality or safety. Its immediate mathematical goal " +
      "is imitation of the selected targets. Whether that imitation produces useful behavior is an " +
      "evaluation question."
    }</Prose>
    
    <H2>{"2. Build a demonstration you can defend"}</H2>
    
    <Prose>{
      "An annotation row is not yet a model input. Consider the constructed verse “The storm is " +
      "gone; the lamps are warm,” with a supplied "
    }<code>{"positive"}</code>{
      " label. A template can turn it into an instruction and response. The template tells us which " +
      "text is context, how labels are spelled, and where generation should begin."
    }</Prose>
    
    <SftSerialization />
    
    <Prose>{"Our real data is "}<a href={"https://github.com/google-research-datasets/poem-sentiment"}>{"Poem Sentiment"}</a>{
      ", released with Sheng and Uthus's study of poetry generation. One actual training record has " +
      "ID 0, verse "
    }<code>{"with pale blue berries. in these peaceful shades--"}</code>{", and raw label "}<code>{"1"}</code>{
      ". That is a released annotation, not a judgment inferred here from the words. The original " +
      "raw labels are "
    }<code>{"−1"}</code>{" for negative, "}<code>{"0"}</code>{" for no impact, "}<code>{"1"}</code>{" for positive, and "}<code>{"2"}</code>{" for mixed. Do not substitute the integer ordering of a different dataset wrapper."}</Prose>
    
    <Prose>{"The complete serialization is:"}</Prose>
    
    <CodeBlock language={"text"}>{
      "Classify the verse sentiment as negative, no impact, or positive.\n" +
      "Verse: with pale blue berries. in these peaceful shades--\n" +
      "Answer: positive"
    }</CodeBlock>
    
    <Prose>{"The prompt ends immediately after "}<code>{"Answer:"}</code>{
      ". The completion begins with one ASCII space, contains the exact lowercase label, and ends " +
      "with the tokenizer's actual end-of-sequence token, "
    }<strong>{"EOS"}</strong>{". That special token is a vocabulary entry that can be predicted. It is not the literal letters "}<code>{"EOS"}</code>{" appended to the verse."}</Prose>
    
    <Prose>{
      "The source files are physical TSV lines: split each UTF-8 line on TAB into ID, verse and " +
      "label. Quote marks in a verse are ordinary characters. A generic CSV parser that treats an " +
      "opening quote as the start of a multi-line field can join unrelated records. "
    }<code>{"sft_data.py"}</code>{
      " checks the exact downloaded bytes before parsing, keeps original IDs, and implements the " +
      "declared label map."
    }</Prose>
    
    <Prose>{
      "We exclude the 49 mixed training rows before fitting, leaving 843 training, 105 development " +
      "and 104 test records. This narrows the task to three classes; it does not resolve every " +
      "ambiguity in a human sentiment annotation. A label may describe a line differently from its " +
      "larger poem, and agreement among annotators is a property of the collection process, not a " +
      "consequence of our training loss."
    }</Prose>
    
    <Prose>{
      "Before transforming records, ask what must stay together when splitting data. If two turns " +
      "come from one conversation, randomly splitting turns can expose nearly the same context in " +
      "training and evaluation. Paraphrases or translations of one source can create the same " +
      "problem."
    }</Prose>
    
    <SftFamilies />
    
    <Prose>{
      "Our experiment preserves the official file splits. It finds no duplicate verse under " +
      "whitespace collapse and case folding, but the TSVs lack source-poem IDs. The absence of " +
      "exact duplicates does not prove poem-level or semantic independence. A further limit comes " +
      "from the base checkpoint: its pretraining corpus includes Project Gutenberg, so a held-out " +
      "annotation need not accompany text the base model has never seen. The measured question is " +
      "adaptation to held-out labels under this source contract."
    }</Prose>
    
    <Prose>{
      "These distinctions suggest a useful data review before fitting: inspect a real record, " +
      "verify the raw-label map, render the exact text, check lengths and duplicates, and identify " +
      "the grouping information the release actually provides. Do not silently repair uncertain " +
      "labels after looking at a model's test errors."
    }</Prose>
    
    <H2>{"3. Choose the predictions that count"}</H2>
    
    <Prose>{
      "Now the demonstration is text. Tokenization makes it a sequence of vocabulary IDs. A causal " +
      "decoder produces one vector of next-token logits at every input position. A "
    }<strong>{"logit"}</strong>{" is a real-valued score; softmax turns the scores into probabilities over the output vocabulary."}</Prose>
    
    <Prose>{"For a small constructed example, use six distinct tokens:"}</Prose>
    
    <CodeBlock language={"text"}>{
      "position:       0       1       2          3           4       5\n" +
      "input:         BOS     user      q      assistant      yes     EOS\n" +
      "aligned label:  —       —       —          —           yes     EOS"
    }</CodeBlock>
    
    <Prose>{"Here BOS is a beginning marker, "}<code>{"user"}</code>{" and "}<code>{"assistant"}</code>{" are role markers, "}<code>{"q"}</code>{" is the question, and "}<code>{"yes"}</code>{
      " is the response. These are teaching tokens, not a claim about the Pythia tokenizer. The " +
      "response convention includes answer content and EOS, while treating the assistant role " +
      "marker as context."
    }</Prose>
    
    <SftShift />
    
    <Prose>{"The logit row at position 3 predicts "}<code>{"yes"}</code>{
      " at position 4. The row at position 4 predicts EOS at position 5. The first answer is " +
      "therefore predicted from the last prompt position. Training with "
    }<code>{"logits[:,4]"}</code>{" against "}<code>{"yes"}</code>{" would show the model the very token it is supposed to predict."}</Prose>
    
    <Prose>{
      "Many causal-model APIs expect labels aligned with input positions and perform the shift " +
      "internally. The explicit implementation here performs it once: "
    }<code>{"logits[:, :-1]"}</code>{" pairs with "}<code>{"labels[:, 1:]"}</code>{". The ignored-label sentinel "}<code>{"−100"}</code>{
      " means “this target contributes no loss.” It is never placed in the model's input IDs and is " +
      "not a vocabulary token. Do not manually shift labels and then pass them to an API that " +
      "shifts again."
    }</Prose>
    
    <Prose>{"Let "}<InlineMath>{"x_j"}</InlineMath>{" be the token at position "}<InlineMath>{"j"}</InlineMath>{", and let "}<InlineMath>{"s_j"}</InlineMath>{" be 1 when that token is an owned target and 0 otherwise. We select only positions "}<InlineMath>{"j\\geq1"}</InlineMath>{", because this input has no preceding logit for its first token. With "}<InlineMath>{"N=\\sum_j s_j"}</InlineMath>{","}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"L=-\\frac{1}{N}\\sum_{j\\geq1}s_j\\log p_\\theta(x_j\\mid x_{<j})."}</MathBlock>
    </div>
    
    <Prose>{"The parameter vector "}<InlineMath>{"\\theta"}</InlineMath>{" is the model being updated. The history "}<InlineMath>{"x_{<j}"}</InlineMath>{
      " contains earlier tokens, including the prompt and earlier answer tokens. The logarithm is " +
      "natural, so this negative log-likelihood, or "
    }<strong>{"NLL"}</strong>{", is measured in nats per selected target. For a batch, both the sum and "}<InlineMath>{"N"}</InlineMath>{" extend over all its selected targets."}</Prose>
    
    <SftLoss />
    
    <Prose>{"If the model assigns probability .5 to the demonstrated "}<code>{"yes"}</code>{
      " and .25 to its EOS, the two losses are approximately .693147 and 1.386294. Their mean is " +
      "1.039721. Improving both to probability 1 would drive this example's loss to zero. With a " +
      "uniform vocabulary of size "
    }<InlineMath>{"V"}</InlineMath>{", each target has loss "}<InlineMath>{"\\log V"}</InlineMath>{". Zero logits produce that uniform distribution; arbitrary random logits do not."}</Prose>
    
    <Prose>{"When no targets survive masking or truncation, "}<InlineMath>{"N=0"}</InlineMath>{". There is no mean target loss to optimize. "}<code>{"masked_ce"}</code>{
      " raises an explicit error before backward rather than reporting a reassuring zero or " +
      "propagating NaN."
    }</Prose>
    
    <Prose>{
      "Response-only supervision is a common SFT choice. A full-sequence objective instead selects " +
      "every available next token, including prompt tokens. That is still supervised adaptation of " +
      "the same model on demonstrations, but it spends gradient budget on predicting the " +
      "instruction and verse as well as the answer. The scientific experiment later compares these " +
      "declared objectives with the same records and optimizer-update budget. Equal records will " +
      "not mean equal selected-target counts."
    }</Prose>
    
    <H2>{"4. Follow the gradient through the prompt"}</H2>
    
    <Prose>{
      "Masking a prompt target removes its direct output loss. It does not remove the prompt from " +
      "the computation of later answers. A supervised answer can depend on a prompt embedding " +
      "through attention and every subsequent layer."
    }</Prose>
    
    <SftPromptCredit />
    
    <Prose>{"At a selected prediction row, write its softmax probabilities as "}<InlineMath>{"p_v"}</InlineMath>{", with correct target ID "}<InlineMath>{"y"}</InlineMath>{". For token-mean loss over "}<InlineMath>{"N"}</InlineMath>{" targets,"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\frac{\\partial L}{\\partial z_v}\n=\\frac{p_v-\\mathbf1[v=y]}{N}."}</MathBlock>
    </div>
    
    <Prose>{
      "The correct token's logit receives a negative derivative unless its probability is already " +
      "1; gradient descent therefore tends to raise it. Other logits receive positive derivatives. " +
      "An ignored prediction row has zero direct logit derivative. All those output derivatives " +
      "then travel backward through the actual context graph. A zero derivative at one output is " +
      "not a promise of zero derivative at every earlier input used elsewhere."
    }</Prose>
    
    <Prose>{"To inspect that graph without hiding it in a large decoder, "}<code>{"sft_objective.py"}</code>{
      " uses a deliberately small mean-context model. For each logit position, average the " +
      "embeddings of explicitly allowed current/past tokens, then apply a learned linear output " +
      "map. If "
    }<InlineMath>{"E"}</InlineMath>{" stores token embeddings, "}<InlineMath>{"A"}</InlineMath>{" stores the normalized visibility weights, and "}<InlineMath>{"W"}</InlineMath>{" is the output map, its operations are"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"H=A E[x],\\qquad Z=HW."}</MathBlock>
    </div>
    
    <Prose>{"The rows of "}<InlineMath>{"A"}</InlineMath>{
      " sum to one and contain no future-context edges. This is an explanatory context model, not " +
      "an attention mechanism or a capability benchmark. Its backward pass computes "
    }<InlineMath>{"dW=H^\\top dZ"}</InlineMath>{", "}<InlineMath>{"dH=dZ W^\\top"}</InlineMath>{", and token-row credit "}<InlineMath>{"A^\\top dH"}</InlineMath>{". Repeated token IDs must add their contributions into the same embedding row; "}<code>{"np.add.at"}</code>{" performs that accumulation."}</Prose>
    
    <Prose>{
      "In the executable fixture, a prompt token with no direct supervised target has embedding " +
      "gradient approximately "
    }<code>{"[0.019054, −0.030655, −0.041704]"}</code>{
      ". A complete SGD step reduces that same fixture's loss from 1.891815 to 1.887540. Central " +
      "finite differences for every embedding and output-map entry agree with the manual derivative " +
      "within "
    }<InlineMath>{"1.49\\times10^{-10}"}</InlineMath>{". Those are executed mechanism checks, not a claim that every training step lowers unseen-data loss."}</Prose>
    
    <Prose>{
      "An optimizer uses such gradients to move parameters. Simple SGD subtracts the learning rate " +
      "times the gradient. The real experiment uses AdamW, whose running first and second gradient " +
      "moments rescale updates. Gradient clipping caps the combined gradient norm before the " +
      "optimizer step. These operations act after we have chosen the objective; they cannot repair " +
      "a target mask that trained on the wrong tokens."
    }</Prose>
    
    <Prose>{"Training and generation also supply different histories."}</Prose>
    
    <SftHistories />
    
    <Prose>{"During "}<strong>{"teacher forcing"}</strong>{
      ", the sequence contains the demonstrated answer prefix. The EOS prediction in our example is " +
      "conditioned on the gold "
    }<code>{"yes"}</code>{
      ", even if the model would have generated something else from the prompt. At inference, the " +
      "model conditions on its own emitted tokens. An early mistake can create a history not " +
      "represented by that demonstration. Low teacher-forced NLL therefore does not by itself " +
      "establish good free generation. We will measure both rather than rename one as the other."
    }</Prose>
    
    <H2>{"5. Keep roles and boundaries consistent"}</H2>
    
    <Prose>{
      "The six-token example has one response. A conversation can contain several assistant turns, " +
      "system/user messages and tool results. It must be clear which positions are demonstrations " +
      "to imitate and which only supply context."
    }</Prose>
    
    <SftRoles />
    
    <Prose>{"Under this lesson's convention, "}<strong>{"all-assistant"}</strong>{" loss selects each assistant's content and genuine EOS, while "}<strong>{"last-assistant"}</strong>{
      " selects only the final assistant response. User, tool and role-prefix tokens remain " +
      "context. A system may legitimately adopt a different role-prefix convention; inspect it " +
      "instead of assuming every template means the same thing. The function "
    }<code>{"assistant_labels(ids, spans, policy)"}</code>{
      " expects real positional spans with an exclusive end index. It does not search for the word " +
      "“assistant” inside text."
    }</Prose>
    
    <Prose>{
      "The distinction matters because those words may appear in ordinary content, and a tokenizer " +
      "does not preserve arbitrary string boundaries. Subword tokenization can merge across the " +
      "join between prompt and completion."
    }</Prose>
    
    <SftBoundary />
    
    <Prose>{"A minimal actual BPE tokenizer in "}<code>{"sft_data.py"}</code>{" gives separate "}<code>{"a"}</code>{" and "}<code>{"b"}</code>{" fragments two IDs, but joins "}<code>{"ab"}</code>{
      " into one token. Adding the lengths of separately tokenized fragments would put the boundary " +
      "in the wrong place. In the real experiment we tokenize prompt plus completion jointly, then " +
      "assert that the separately tokenized prompt is an exact prefix. That assertion holds for all " +
      "1,052 retained poem records; maximum complete length, including EOS, is 47. If it fails on " +
      "new data, stop and inspect the actual spans instead of silently pretending the prompt was " +
      "unchanged."
    }</Prose>
    
    <Prose>{
      "Chat templates add another layer: they turn structured role/content messages into a " +
      "particular sequence of text and special tokens. Training usually renders completed messages. " +
      "Generation renders the intended unfinished assistant prefix, or an explicit continuation of " +
      "a prefilled message. Adding a second BOS/EOS outside a template that already inserted it " +
      "changes the sequence."
    }</Prose>
    
    <Prose>{
      "The native trainer example uses an explicit, small generation-aware template. Its assistant " +
      "span ends immediately after the EOS token; separating whitespace sits outside the span. This " +
      "detail was tested, not inferred from attractive rendered text. With the tested " +
      "tokenizer/library combination, ending that span in untokenized whitespace incorrectly " +
      "extended the first assistant mask through later tool and role tokens. Moving the whitespace " +
      "outside restored the exact selected IDs "
    }<code>{"[negative, EOS, positive, EOS]"}</code>{
      ". The general lesson is to inspect the prepared token IDs and target labels that reach the " +
      "loss. A template string containing a generation marker is not, by itself, a correctness " +
      "check."
    }</Prose>
    
    <H2>{"6. Batch without changing the intended objective"}</H2>
    
    <Prose>{
      "Examples have different lengths. Padding makes rectangular tensors possible, but padded " +
      "storage is not part of the demonstration. Keep input validity and target ownership as two " +
      "separate arrays."
    }</Prose>
    
    <SftPadding />
    
    <Prose>{
      "The real tokenizer has EOS ID 0 and no configured padding token. We use 0 as padding storage " +
      "while marking valid positions by length. The genuine EOS at the end of a response remains a " +
      "selected target; only positions beyond the actual length are padding. The shortcut "
    }<code>{"labels[input_ids == pad_id] = -100"}</code>{
      " would erase the genuine EOS too. A model trained without a stopping target may still stop " +
      "for other reasons, but this shortcut has changed the requested objective."
    }</Prose>
    
    <Prose>{"For a right-padded batch, "}<code>{"attention_mask"}</code>{
      " records which input positions are real. The label array separately marks response " +
      "ownership. It is quite normal for a prompt position to be valid input and have an ignored " +
      "target label. Setting every ignored-label position to invisible attention would also remove " +
      "the context needed to predict the response."
    }</Prose>
    
    <Prose>{
      "Truncation is another selection operation. Cutting a sequence can remove its entire answer, " +
      "omit EOS, or leave an incomplete demonstration. Our study rejects sequences longer than 64 " +
      "tokens; none of its retained rows exceeds that limit. This choice is explicit, not a " +
      "universal recommendation. A different task may need bounded context trimming, response " +
      "splitting or a longer model, followed by new mask and denominator checks."
    }</Prose>
    
    <Prose>{"Now consider two examples with two and four selected targets. Let their summed losses be "}<InlineMath>{"S_1"}</InlineMath>{" and "}<InlineMath>{"S_2"}</InlineMath>{", and their means "}<InlineMath>{"L_1=S_1/2"}</InlineMath>{" and "}<InlineMath>{"L_2=S_2/4"}</InlineMath>{". Token-mean loss is"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"L_{\\mathrm{token}}=\\frac{S_1+S_2}{6}\n=\\frac{2}{6}L_1+\\frac{4}{6}L_2."}</MathBlock>
    </div>
    
    <Prose>{"An example-mean objective is "}<InlineMath>{"(L_1+L_2)/2"}</InlineMath>{
      ". Both are definable objectives; they weight the examples differently. If the first mean is " +
      "1 and the second 3, the token mean is "
    }<InlineMath>{"7/3\\approx2.333333"}</InlineMath>{", while the example mean is 2."}</Prose>
    
    <SftDenominator />
    
    <Prose>{""}<strong>{"Gradient accumulation"}</strong>{
      " processes smaller microbatches before one optimizer step. To reproduce the token mean of a " +
      "larger batch, divide each microbatch's summed loss by the total selected-target count for " +
      "that complete accumulated batch. Equivalently, multiply each microbatch mean by its " +
      "target-count fraction. Zero gradients once before those backward passes, and clip and update " +
      "once after all of them. Dividing every microbatch mean by the number of microbatches only " +
      "works for this objective when their selected-target counts are equal."
    }</Prose>
    
    <Prose>{""}<code>{"sft_batching.py"}</code>{
      " checks two- and four-target microbatches against one combined batch. Every parameter " +
      "gradient agrees within "
    }<InlineMath>{"5.56\\times10^{-17}"}</InlineMath>{
      " in its float64 fixture, and the SGD updates agree. The naive mean-of-means produces a " +
      "maximum gradient difference about .138330. That is a changed objective, not floating-point " +
      "noise. In distributed training, the same reasoning applies to global selected counts and the " +
      "backend's gradient-reduction convention; dividing by an already averaged quantity twice " +
      "would introduce another scaling error."
    }</Prose>
    
    <H2>{"7. Pack examples while preserving isolation"}</H2>
    
    <Prose>{"Padding spends computation on unused positions. "}<strong>{"Packing"}</strong>{
      " stores several examples together. It is deeper than deleting PAD tokens: the packed model " +
      "must still receive the intended attention edges, positions and target boundaries."
    }</Prose>
    
    <SftPackedMask />
    
    <Prose>{
      "For independent examples, a token in record B must not attend to record A just because A " +
      "happens to occupy earlier storage. Ordinary lower-triangular causal attention permits " +
      "exactly that. The correct packed visibility matrix contains one causal triangle per record " +
      "and zeros in cross-record blocks. Rows are queries, columns are the keys they may use."
    }</Prose>
    
    <Prose>{"In this program the boolean array is named "}<code>{"allowed"}</code>{": "}<code>{"True"}</code>{
      " permits an edge. The explicit attention path converts forbidden entries to negative " +
      "infinity before softmax; an equivalent additive mask has zero on allowed entries and " +
      "negative infinity on forbidden entries. Native scaled-dot-product attention uses the " +
      "demonstrated boolean convention. Other APIs may name a boolean mask after the entries to " +
      "block, reversing its meaning. Check the called operation instead of assuming every 0/1 array " +
      "has the same semantics."
    }</Prose>
    
    <Prose>{
      "The first token of record B is also not a target predicted by A's final logit. Mark that " +
      "boundary target ignored. Response-only labels already ignore the prompt at B's start in our " +
      "fixture, but the boundary rule must remain explicit when changing objectives. Padding, if " +
      "present, needs a harmless valid computation for its unused query rows so an all-masked " +
      "softmax does not create NaN; those rows still have no selected loss."
    }</Prose>
    
    <SftPositions />
    
    <Prose>{
      "The reused TinyLM has learned absolute position embeddings. Separate examples each start at " +
      "position 0. If B instead starts at position 5 after packing, it receives different position " +
      "vectors, even with correct attention isolation. Reset its position IDs to reproduce the " +
      "separate computation. Other positional schemes may have different invariances; they need " +
      "their own backend contract."
    }</Prose>
    
    <Prose>{""}<code>{"ExplicitDecoder"}</code>{
      " reuses the complete causal lesson's parameters and layers, adding explicit allowed edges " +
      "and position IDs to the forward path. It does not pretend the original "
    }<code>{"TinyLM.forward(ids)"}</code>{
      " already accepts those arguments. The float64 comparison checks every valid logit, the " +
      "token-mean loss, every parameter gradient and a full SGD step. Maximum gradient error is "
    }<InlineMath>{"1.12\\times10^{-16}"}</InlineMath>{", and maximum update error "}<InlineMath>{"2.78\\times10^{-17}"}</InlineMath>{". Native scaled-dot-product attention with the same explicit mask also agrees."}</Prose>
    
    <Prose>{
      "Two independent negative controls establish why both inputs matter. Replacing the block mask " +
      "by an ordinary causal triangle changes a second-record logit by up to .305546. Keeping the " +
      "block mask but using global positions changes one by up to 1.669420. These are executed " +
      "local differences, not estimates of production accuracy loss."
    }</Prose>
    
    <Prose>{
      "Practical packers may bin examples, split long examples or wrap a continuous stream. Those " +
      "choices need not preserve the independent-example objective we just verified. Position " +
      "resets alone do not guarantee an attention kernel uses separate sequence lengths. The CPU " +
      "example uses an explicit dense matrix; it does not certify a FlashAttention or distributed " +
      "packing configuration. The real six-fit study uses ordinary padded batches so this separate " +
      "mechanism comparison remains distinct from its objective experiment."
    }</Prose>
    
    <H2>{"8. Implement the complete SFT path"}</H2>
    
    <Prose>{
      "The masks now have concrete meanings. Connect them to a complete run rather than treating " +
      "each notebook cell as an independent recipe."
    }</Prose>
    
    <SftPipeline />
    
    <Prose>{"Start with the complete "}<a href={"/learn-code/supervised-fine-tuning/sft_objective.py"}>{"sft_objective.py"}</a>{". "}<code>{"masked_ce"}</code>{
      " accepts logits with shape B×L×V and aligned integer labels B×L. It checks shapes, " +
      "vocabulary bounds, finite logits and selected counts; subtracts the maximum logit before " +
      "exponentiation; gathers only owned next-token terms; and returns the loss plus every logit " +
      "derivative. "
    }<code>{"context_forward"}</code>{", "}<code>{"context_backward"}</code>{" and "}<code>{"context_step"}</code>{
      " connect those derivatives to actual embedding/head updates. The verification compares " +
      "token, example and summed reductions against Torch, checks every parameter by finite " +
      "differences and executes a complete update. Run "
    }<code>{"python sft_objective.py --output objective.json"}</code>{"."}</Prose>
    
    <Program file="sft_objective.py" />
    
    <Prose>{
      "Stable softmax prevents avoidable exponential overflow. It does not make an incorrect target " +
      "shift correct. The manual implementation requires finite inputs and reports undefined " +
      "zero-target batches as errors. With full B×L×V logits, the objective uses time and storage " +
      "proportional to that tensor's size. The pedagogical mean-context model additionally " +
      "materializes an L×L visibility matrix; it is intentionally inspectable rather than a " +
      "production long-context training engine."
    }</Prose>
    
    <Prose>{"Next read "}<a href={"/learn-code/supervised-fine-tuning/sft_data.py"}>{"sft_data.py"}</a>{". "}<code>{"load_source"}</code>{" checks pinned TSV hashes and maps raw annotations. "}<code>{"encode_record"}</code>{" jointly tokenizes the literal prompt/completion, verifies its prefix boundary and appends EOS. "}<code>{"collate"}</code>{" fills rectangular input storage, positional validity and aligned labels independently. "}<code>{"assistant_labels"}</code>{
      " demonstrates all/final assistant-span ownership. The actual BPE counterexample and every " +
      "real row's boundary are checked in the same executable program."
    }</Prose>
    
    <Program file="sft_data.py" />
    
    <Prose>{"The source downloader fetches the immutable dataset revision only when "}<code>{"--download"}</code>{
      " is requested, then verifies bytes before accepting them. It does not silently switch to a " +
      "newer release. The public dataset is licensed CC BY 4.0; preserve the source attribution " +
      "when sharing the examples. The model checkpoint has its own Apache-2.0 license and " +
      "provenance."
    }</Prose>
    
    <Prose>{"The complete "}<a href={"/learn-code/supervised-fine-tuning/sft_batching.py"}>{"sft_batching.py"}</a>{" imports the earlier "}<a href={"/learn-code/causal-language-modeling/tiny_causal_lm.py"}>{"tiny_causal_lm.py"}</a>{
      ". Its explicit extension reads the existing embedding, layer-normalization, attention, MLP " +
      "and head parameters. It introduces the new edge and position arguments visibly, then " +
      "compares separate/packed and combined/accumulated computations. The downloadable packet " +
      "keeps the prerequisite helper beside the program; its original training routine is not rerun " +
      "by an import."
    }</Prose>
    
    <Program file="sft_batching.py" />
    
    <Prose>{
      "Dense packing here still allocates a quadratic attention matrix. It establishes semantics, " +
      "not a speedup claim. A faster implementation may exploit the block structure without " +
      "allocating the zeros, but it must preserve the same edges and target denominator before its " +
      "performance is relevant."
    }</Prose>
    
    <Prose>{"The last part of the data path is evaluation. The complete "}<a href={"/learn-code/supervised-fine-tuning/sft_evaluate.py"}>{"sft_evaluate.py"}</a>{" has separate functions for response NLL, greedy output and three-candidate classification. "}<code>{"response_nll"}</code>{" adds per-target losses and counts across batches; it does not average unequal batch means. "}<code>{"greedy_completions"}</code>{
      " gathers the last real position for each padded prompt, appends the chosen token, and stops " +
      "that row at EOS. The full model output vocabulary is eligible. If a padded vocabulary entry " +
      "has no tokenizer mapping, it is retained in the emitted IDs and classified invalid rather " +
      "than silently discarded to make the remaining text look correct."
    }</Prose>
    
    <Program file="sft_evaluate.py" />
    
    <Prose>{
      "This explicit greedy loop recomputes the prefix each step, with caching disabled. That is " +
      "slower than a correct KV-cache implementation, but makes the length and padding contract " +
      "straightforward to audit. The eight-token cap bounds the local experiment. Teacher-forced " +
      "loss, unconstrained generation and constrained label scores remain three different results " +
      "throughout the code and reader."
    }</Prose>
    
    <H2>{"9. Verify the ordinary trainer"}</H2>
    
    <Prose>{
      "A library trainer can prepare datasets, batch examples, compute loss, update parameters and " +
      "save artifacts. Those conveniences do not make the chosen data schema or template " +
      "irrelevant. Inspect the prepared labels, not only the public constructor arguments."
    }</Prose>
    
    <SftNativeTrainer />
    
    <Prose>{"The complete "}<a href={"/learn-code/supervised-fine-tuning/sft_trl.py"}>{"sft_trl.py"}</a>{
      " executes TRL 1.14.2 with Transformers 5.19, datasets 5.1, accelerate 1.15 and Torch 2.14 on " +
      "CPU. It constructs a small random GPT-2 and WordLevel tokenizer locally, so the native " +
      "mechanism comparison downloads no weights and does not claim to fine-tune a pretrained " +
      "assistant. The scientific Pythia experiment remains separate."
    }</Prose>
    
    <Program file="sft_trl.py" />
    
    <Prose>{"Its first dataset preserves "}<code>{"prompt"}</code>{" and "}<code>{"completion"}</code>{" fields and explicitly sets "}<code>{"completion_only_loss=True"}</code>{". After preparation and collation, two actual rows are:"}</Prose>
    
    <CodeBlock language={"text"}>{
      "input IDs: [2,3,4,5,0,0]             [2,3,6,8,9,0]\n" +
      "validity:  [1,1,1,1,1,0]             [1,1,1,1,1,1]\n" +
      "labels:    [-100,-100,-100,5,0,-100]  [-100,-100,-100,8,9,0]"
    }</CodeBlock>
    
    <Prose>{
      "The zero in the first row's fifth position is genuine EOS and remains selected. The sixth " +
      "zero is padding and is ignored. Together the rows have five selected shifted targets. " +
      "Flattening the same examples into a "
    }<code>{"text"}</code>{
      " field removes the prompt/completion structure; under the demonstrated full-text default " +
      "there are nine shifted targets. The text strings alone cannot tell the trainer which tokens " +
      "you intended to imitate."
    }</Prose>
    
    <Prose>{
      "The comparison starts two independently constructed models from identical state, evaluates " +
      "an explicit shifted cross-entropy and the native trainer loss, then compares every parameter " +
      "gradient. The gradients match exactly in the executed fixture. One actual native trainer SGD " +
      "step agrees with the explicit update within "
    }<InlineMath>{"1.87\\times10^{-9}"}</InlineMath>{
      ". Reloading the saved model reproduces its logits exactly for that batch. These checks " +
      "exercise ordinary library behavior; they do not certify all trainer configurations or GPU " +
      "kernels."
    }</Prose>
    
    <Prose>{"For multi-turn data, the second schema keeps structured messages and enables "}<code>{"assistant_only_loss=True"}</code>{
      " with the tested generation-aware template. Its prepared labels select the two assistant " +
      "answers and their EOS tokens, while ignoring user/tool contents and role prefixes. The exact " +
      "masked IDs are part of the receipt. If your tokenizer/template changes, repeat that " +
      "inspection."
    }</Prose>
    
    <Prose>{
      "The installed trainer performs preparation before its current collator. Its collator " +
      "consumes prepared labels and pads them with "
    }<code>{"−100"}</code>{
      "; passing a mask column to a skipped preparation stage is not the same contract. The example " +
      "uses ordinary padded CPU batching, no packing and explicit NLL loss. It does not copy a " +
      "removed completion-only collator from an older tutorial or infer semantics from a " +
      "version-agnostic name."
    }</Prose>
    
    <Prose>{
      "A manual trainer-loss probe can also contribute to the trainer's metric queues. Here the " +
      "parity probe runs in evaluation mode and flushes its metrics before actual training, so its " +
      "tokens do not inflate the recorded training count. The real native step contains eleven " +
      "valid input positions and five selected targets. Metric bookkeeping and optimization are " +
      "distinct computations worth checking separately."
    }</Prose>
    
    <H2>{"10. Run a controlled adaptation experiment"}</H2>
    
    <Prose>{
      "The earlier local models establish mechanics. Now use an actual pretrained checkpoint to ask " +
      "a narrower empirical question: under a fixed record/update budget, how do response-only and " +
      "full-sequence supervision change this verse classification task?"
    }</Prose>
    
    <SftExperiment />
    
    <Prose>{"The base is "}<a href={"https://huggingface.co/EleutherAI/pythia-14m"}>{"EleutherAI Pythia-14M"}</a>{" at revision "}<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{
      ": 14,067,712 parameters, six layers, width 128, four attention heads and 50,304 output " +
      "entries. The checkpoint name has changed contents historically, so the immutable revision " +
      "and downloaded-file hashes matter. It is a pretrained research model, not an " +
      "instruction-tuned assistant."
    }</Prose>
    
    <Prose>{
      "All six runs start from its exact weights. The literal template, joint tokenization, EOS ID " +
      "0, positional padding and maximum length 64 were checked before training. Both policies use " +
      "all model parameters in FP 32 on CPU with two threads, zero dropout, batch size eight and " +
      "200 optimizer updates. Seeds 17, 29 and 43 determine record order; each response/full pair " +
      "receives the same order. The final short batch of an epoch is retained."
    }</Prose>
    
    <NeuralTable caption={"10. Run a controlled adaptation experiment"} headers={[<>{"Protocol choice"}</>,<>{"Fixed setting and reason"}</>]} rows={[[<>{"Training data"}</>,<>{"843 official training rows after predeclared mixed-label exclusion"}</>],[<>{"Development/test"}</>,<>{"105/104 official rows; no inferred poem-family independence"}</>],[<>{"Optimizer"}</>,<>{"AdamW, learning rate .0001, beta .9/.999, epsilon 10⁻⁸, weight decay 0"}</>],[<>{"Gradient handling"}</>,<>{"Token mean within each batch, clip global norm at 1, no scientific accumulation"}</>],[<>{"Schedule"}</>,<>{"Constant learning rate; no hyperparameter search"}</>],[<>{"Development evaluations"}</>,<>{"Updates 0, 50, 100, 150, 200; response-only NLL for both policies"}</>],[<>{"Checkpoint selection"}</>,<>{"Lowest pooled development response NLL; earlier step on a tie, including the base at step 0"}</>],[<>{"Test evaluation"}</>,<>{"All six selected outcomes after all fits finish; base once and training-majority baseline"}</>],[<>{"Free generation"}</>,<>{"Full-vocabulary greedy, at most eight new tokens, first EOS stops"}</>],[<>{"Constrained classifier"}</>,<>{"Sum each exact label-plus-EOS log probability; no length normalization"}</>]]} />
    
    <Prose>{
      "Each schedule presents 1,595 records: one complete 843-record pass and 94 additional full " +
      "batches. Equal records and updates isolate a useful budget comparison, but they do not " +
      "equalize selected-target counts, objective gradients or wall time. Full-sequence supervision " +
      "includes prompt/verse prediction, so its raw training loss cannot be compared to " +
      "response-only training loss as if the denominators and targets were identical. Development " +
      "uses the same conditional response objective for both policies."
    }</Prose>
    
    <Prose>{
      "The experiment was specified and its six program/model/data hashes frozen before the first " +
      "scientific optimizer update. Preflight compared both real model objectives and checked " +
      "finite gradients without updating weights. No threshold, seed or learning rate is chosen " +
      "from test results. Fixed display examples are the first two numeric test IDs in each gold " +
      "class: negative 5/6, no impact 0/2, and positive 1/10."
    }</Prose>
    
    <Prose>{"The complete "}<a href={"/learn-code/supervised-fine-tuning/sft_study.py"}>{"sft_study.py"}</a>{
      " freezes a prospective protocol, checks it before every run, saves all checkpoints' " +
      "development measurements, and preserves the selected model locally. Completed fits are " +
      "reused. An interrupted fit resumes an incomplete checkpoint; it is not quietly replaced by " +
      "an extra run with more appealing results. The driver refuses test evaluation while any of " +
      "the six fits is missing."
    }</Prose>
    
    <Program file="sft_study.py" />
    
    <Prose>{"To reproduce, use the "}<a href={"/learn-code/supervised-fine-tuning/README.md"}>{"complete setup instructions"}</a>{" and "}<a href={"/learn-code/supervised-fine-tuning/supervised-fine-tuning.zip"}>{"downloadable packet"}</a>{
      ". The packet contains all programs, the exact prerequisite helper, source TSVs and their " +
      "attribution. Its standard-library model downloader checks all six pinned " +
      "model/tokenizer/card files. Then freeze and train with explicit paths. The six "
    }<code>{"train"}</code>{
      " invocations cover both policies and all three seeds; never select a seed merely because its " +
      "score is highest."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python acquire_model.py --output pythia-14m\n" +
      "python sft_data.py --data poems --model pythia-14m --download --output data-check.json\n" +
      "python sft_study.py freeze --data poems --model pythia-14m --work study\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy response " +
      "--seed 17\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy response " +
      "--seed 29\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy response " +
      "--seed 43\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy full --seed " +
      "17\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy full --seed " +
      "29\n" +
      "python sft_study.py train --data poems --model pythia-14m --work study --policy full --seed " +
      "43\n" +
      "python sft_study.py evaluate --data poems --model pythia-14m --work study"
    }</CodeBlock>
    
    <Prose>{
      "Scientific execution uses Transformers 5.17 with Torch 2.14. The separately verified native " +
      "trainer uses its documented 5.19/TRL environment. Those are explicitly separate routes, not " +
      "a claim that one package set executed both. Keep their environments separate if their " +
      "declared dependencies differ."
    }</Prose>
    
    <H2>{"11. Read results without overstating them"}</H2>
    
    <Prose>{"Three evaluations answer three questions. "}<strong>{"Response NLL"}</strong>{
      " asks how much probability the model assigns to the demonstrated answer sequence under its " +
      "gold history. "
    }<strong>{"Free-generation accuracy"}</strong>{" asks whether the model emits the right exact label. "}<strong>{"Constrained accuracy"}</strong>{
      " asks which of three complete candidate strings has the largest conditional probability. " +
      "Their rankings may disagree because they use different decision rules."
    }</Prose>
    
    <SftResults />
    
    <Prose>{"A generated completion is valid only when stripping its outer whitespace leaves exactly "}<code>{"negative"}</code>{", "}<code>{"no impact"}</code>{", or "}<code>{"positive"}</code>{
      ". Extra explanations, capitalization changes, empty text and unmapped output IDs are invalid " +
      "for this task. Invalid predictions occupy a fourth confusion-matrix column and count as " +
      "errors. A model that says the correct word but continues into extra text has not obeyed this " +
      "declared output contract."
    }</Prose>
    
    <Prose>{"EOS stopping is measured separately from valid-label output. A capped run can emit exactly "}<code>{"negative"}</code>{
      " without EOS, or emit EOS immediately with an empty, invalid response. The evaluator's " +
      "constructed tests exercise both distinctions. Neither metric should be inferred from the " +
      "other."
    }</Prose>
    
    <Prose>{
      "For class-specific F1, true positives are correct predictions of that class; false positives " +
      "are other gold classes predicted as it; false negatives include its examples sent to any " +
      "other class or the invalid column. The formula is 2TP/(2TP+FP+FN). A zero denominator gives " +
      "zero under our declared convention. Macro F1 averages the three gold-class F1 values " +
      "equally, preventing the larger no-impact class from dominating that particular summary. It " +
      "still does not repair a biased or dependent evaluation set."
    }</Prose>
    
    <SftConfusion />
    
    <Prose>{
      "The majority baseline predicts the most frequent training label for every test row. It gets " +
      "no test labels when choosing that class. Comparing only with a poorly formatted base model " +
      "can exaggerate an adaptation gain; the class prior is another useful reference. Likewise, a " +
      "small difference between three seed results on the same test rows is not three independent " +
      "samples of the task population. Report each outcome before summarizing it."
    }</Prose>
    
    <Prose>{
      "All six scheduled fits completed. The table reports their development-selected checkpoints " +
      "on the same 104 test records. NLL is nats per selected response token; accuracy is a " +
      "fraction of test records and macro F1 a fraction from zero to one. The selected step is " +
      "distinct from the 200 steps actually executed."
    }</Prose>
    
    <NeuralTable caption={"11. Read results without overstating them"} headers={[<>{"Objective / seed"}</>,<>{"Selected step"}</>,<>{"Development NLL"}</>,<>{"Test response NLL"}</>,<>{"Free accuracy"}</>,<>{"Free macro F1"}</>,<>{"Constrained accuracy"}</>]} rows={[[<>{"Pretrained base"}</>,<>{"0"}</>,<>{"—"}</>,<>{"7.052725"}</>,<>{".000000"}</>,<>{".000000"}</>,<>{".365385"}</>],[<>{"Training-majority label"}</>,<>{"—"}</>,<>{"—"}</>,<>{"—"}</>,<>{".663462"}</>,<>{".265896"}</>,<>{"—"}</>],[<>{"Response / 17"}</>,<>{"200"}</>,<>{".261543"}</>,<>{".260335"}</>,<>{".740385"}</>,<>{".620514"}</>,<>{".740385"}</>],[<>{"Response / 29"}</>,<>{"150"}</>,<>{".266238"}</>,<>{".311177"}</>,<>{".740385"}</>,<>{".554834"}</>,<>{".740385"}</>],[<>{"Response / 43"}</>,<>{"200"}</>,<>{".269652"}</>,<>{".302642"}</>,<>{".682692"}</>,<>{".517401"}</>,<>{".682692"}</>],[<>{"Full text / 17"}</>,<>{"200"}</>,<>{".304800"}</>,<>{".308565"}</>,<>{".663462"}</>,<>{".328071"}</>,<>{".663462"}</>],[<>{"Full text / 29"}</>,<>{"100"}</>,<>{".339927"}</>,<>{".338234"}</>,<>{".663462"}</>,<>{".265896"}</>,<>{".663462"}</>],[<>{"Full text / 43"}</>,<>{"200"}</>,<>{".312839"}</>,<>{".311034"}</>,<>{".644231"}</>,<>{".477477"}</>,<>{".644231"}</>]]} />
    
    <Prose>{
      "The base generated no valid label and never reached EOS within the eight-token cap. " +
      "Nevertheless, its three-candidate accuracy was .365385, with macro F1 .300252. Giving a " +
      "model a fixed candidate set can expose information that its free output does not express in " +
      "the required format. That does not turn a constrained classifier into an " +
      "instruction-following assistant."
    }</Prose>
    
    <Prose>{
      "All six adapted checkpoints had valid-label rate 1 and EOS-stop rate 1. In this particular " +
      "experiment their free and constrained predictions agreed on every test record, so their " +
      "constrained macro F1 values also equal the free values in the table. This is an observed " +
      "equality, not an equivalence between the decision rules. The complete per-example log scores " +
      "and generated token IDs remain available to check it."
    }</Prose>
    
    <Prose>{
      "Across the three response-only runs, mean free accuracy was .721154, ranging from .682692 to " +
      ".740385; mean macro F1 was .564249, ranging from .517401 to .620514. Full-text runs had mean " +
      "accuracy .657051, range .644231–.663462, and mean macro F1 .357148, range .265896–.477477. " +
      "Mean test response NLL was .291384 versus .319278. Those seed summaries describe repeated " +
      "optimizations of the same task, not population confidence intervals."
    }</Prose>
    
    <Prose>{
      "Changing the objective also changes how many target terms each update averages. Both " +
      "policies saw exactly the same 1,595 record presentations within a seed. The total valid " +
      "input positions were 53,178, 53,256 and 53,242 for seeds 17, 29 and 43. Response-only " +
      "training selected 4,242, 4,251 and 4,240 target terms over the 200 updates; full-text " +
      "training selected 51,583, 51,661 and 51,647. These are cumulative "
    }<strong>{"executed"}</strong>{
      " budgets, including steps after a selected checkpoint. Full text spends many terms " +
      "predicting the fixed instruction and verse prefix. We held record order, updates and " +
      "optimizer settings fixed, not the number of supervised terms or the magnitude of every " +
      "resulting update."
    }</Prose>
    
    <Prose>{
      "Development histories also matter. Response/29 improved to .266238 at step 150, then " +
      "worsened to .480069 at step 200. Full-text/29 was selected at step 100 with .339927 and " +
      "ended at .576564. Their later checkpoints were not substituted because of test results. The " +
      "recorded selection rule used development only and retained the less favorable histories " +
      "alongside the selected outcomes."
    }</Prose>
    
    <Prose>{"Look inside the confusion matrix before calling the improvement broad. Full-text/29 predicts "}<code>{"no impact"}</code>{
      " for all 104 records. Its .663462 accuracy exactly matches the training-majority baseline: " +
      "69 correct no-impact records, 19 missed negatives and 16 missed positives. Format and " +
      "termination are perfect under this contract, while minority-class recall is zero."
    }</Prose>
    
    <Prose>{"Response/17 has rows "}<code>{"[10,5,4,0]"}</code>{", "}<code>{"[2,61,6,0]"}</code>{" and "}<code>{"[0,10,6,0]"}</code>{
      " in gold order negative/no impact/positive and predicted order negative/no impact/positive/ " +
      "invalid. It gets 77 of 104 correct. Positive recall is still only 6/16=.375; its positive F1 " +
      "is .375. The accuracy gain does not remove class-specific weaknesses."
    }</Prose>
    
    <Prose>{
      "The following six test IDs were fixed by the protocol before the fits: the first two source " +
      "IDs of each retained class. They are not a showcase selected after reading outputs. For " +
      "compactness, "
    }<code>{"neg"}</code>{", "}<code>{"none"}</code>{" and "}<code>{"pos"}</code>{" below stand for the complete strings "}<code>{"negative"}</code>{", "}<code>{"no impact"}</code>{" and "}<code>{"positive"}</code>{". Every adapted entry terminated with EOS."}</Prose>
    
    <NeuralTable caption={"11. Read results without overstating them"} headers={[<>{"Source ID / gold"}</>,<>{"Verse"}</>,<>{"Response17"}</>,<>{"Response29"}</>,<>{"Response43"}</>,<>{"Full17"}</>,<>{"Full29"}</>,<>{"Full43"}</>]} rows={[[<>{"5 / neg"}</>,<>{"indignantly i hurled the cry:"}</>,<>{"neg"}</>,<>{"neg"}</>,<>{"neg"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>],[<>{"6 / neg"}</>,<>{"with which his house is haunted;"}</>,<>{"neg"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"neg"}</>],[<>{"0 / none"}</>,<>{"my canoe to make more steady,"}</>,<>{"pos"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"pos"}</>],[<>{"2 / none"}</>,<>{"and when they reached the strait symplegades"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>],[<>{"1 / pos"}</>,<>{"and be glad in the summer morning when the kindred ride on their way;"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>,<>{"none"}</>],[<>{"10 / pos"}</>,<>{"on thine own bird the sweet enthusiasm"}</>,<>{"pos"}</>,<>{"pos"}</>,<>{"pos"}</>,<>{"none"}</>,<>{"none"}</>,<>{"pos"}</>]]} />
    
    <Prose>{"For ID0, response/17 emitted "}<code>{"[2762,0]"}</code>{", decoded as "}<code>{" positive"}</code>{
      " followed by EOS, although the supplied label is no impact. Its complete negative/no-impact/ " +
      "positive candidate log probabilities are −6.201137, −2.871139 and −.064857. The model is " +
      "strongly confident in this wrong label under its own scores. Confidence is not correctness, " +
      "and fluent formatting would not repair it."
    }</Prose>
    
    <Prose>{"On ID5, the base emitted "}<code>{"\\nAnswer:\\nAnswer:\\nAnswer"}</code>{
      " and hit the cap. Its constrained classifier still selected negative because −18.097748 " +
      "exceeded the other complete candidates' −18.907178 and −18.473688. Response/17 instead " +
      "emitted "
    }<code>{"[4016,0]"}</code>{", "}<code>{" negative"}</code>{
      " and EOS. These records make the difference between a candidate decision and actual " +
      "generation visible."
    }</Prose>
    
    <Prose>{"The "}<a href={"/learn-code/supervised-fine-tuning/study-evaluation.json"}>{"recorded complete evaluation"}</a>{
      " contains all development histories, 1,200 executed update records, the base evaluation and " +
      "all six selected test evaluations. The "
    }<a href={"/learn-code/supervised-fine-tuning/study-summary.json"}>{"compact summary"}</a>{
      " exposes the exact aggregates and all predeclared examples. They are observations from the " +
      "frozen run; changing a browser control only inspects them."
    }</Prose>
    
    <Prose>{
      "The local experiment cannot tell us whether SFT improved general reasoning, factuality, " +
      "safety or retained pretraining ability. Its template is one task, its target strings are " +
      "short, and its held-out annotations share a collection process. To test retention, choose " +
      "separate pretraining-like or previously supported tasks and evaluate the base and adapted " +
      "checkpoints under the same protocol. A changed poem score alone is not evidence of either " +
      "broad forgetting or broad preservation."
    }</Prose>
    
    <H2>{"12. Choose data, parameters and next steps"}</H2>
    
    <Prose>{
      "Suppose loss decreases but outputs still fail. Inspect the earliest violated contract before " +
      "adding more training. If the model learns an unwanted role prefix, check target ownership. " +
      "If it fails to stop, inspect EOS labels and decoding. If exact labels improve but " +
      "minority-class recall remains poor, inspect the confusion matrix and source composition. If " +
      "development degrades late, use the predeclared selection rule and examine overfitting; do " +
      "not pick a test checkpoint to hide the degradation."
    }</Prose>
    
    <SftDiagnosis />
    
    <Prose>{
      "Data quality is not one scalar. Correctness, coverage, consistency of format, source " +
      "independence and representativeness can matter differently. A clean answer to a narrow task " +
      "may teach format well without covering new requests. Many paraphrases of one answer increase " +
      "the number of strings without creating independent factual supervision. Human review should " +
      "record what was checked and why it matters, rather than label every fluent response “high " +
      "quality.”"
    }</Prose>
    
    <Prose>{"Three influential studies help frame the choices, provided we keep their conditions attached. "}<a href={"https://arxiv.org/abs/2203.02155"}>{"InstructGPT"}</a>{
      " used demonstrations as one stage alongside reward modeling and reinforcement learning. Its " +
      "final preference comparisons do not isolate SFT's contribution. Its user-level data boundary " +
      "and held-out selection are useful examples of matching splits and decisions to the " +
      "collection process."
    }</Prose>
    
    <Prose>{""}<a href={"https://arxiv.org/abs/2210.11416"}>{"Scaling Instruction-Finetuned Language Models"}</a>{
      " studied broader task mixtures and model scales, with held-out evaluations. That is the kind " +
      "of evidence needed for a claim about transfer to new tasks. One task's held-out rows " +
      "establish a narrower form of generalization. "
    }<a href={"https://arxiv.org/abs/2305.11206"}>{"LIMA"}</a>{
      " showed that a curated small set could work with a strong base in its measured setup. Its " +
      "model, data construction, checkpoint selection and comparison protocol matter; “one thousand " +
      "examples are always enough” does not follow. Nor do those results prove SFT can only expose " +
      "existing knowledge and never learn a new fact."
    }</Prose>
    
    <Prose>{
      "Changing the trainable subset is another decision. LoRA learns low-rank weight updates; soft " +
      "prompts optimize continuous input or internal prefix parameters. Both can use a supervised " +
      "objective, but a frozen backbone still participates in the forward and gradient paths needed " +
      "to train the added parameters. They save some forms of parameter/optimizer storage without " +
      "making every activation or token-processing cost disappear. The dedicated " +
      "parameter-efficient lessons own their derivations."
    }</Prose>
    
    <Prose>{
      "If the feedback is a preferred response over another rather than a single demonstration, " +
      "RLHF and direct preference methods define different objectives. If a teacher supplies " +
      "examples or probability targets, distillation must identify exactly what is transferred. " +
      "These are neighboring tools for different evidence and constraints, not automatic upgrades " +
      "selected by a slogan."
    }</Prose>
    <H2>{"13. Independent practice"}</H2>
    <Prose>{
      "These tasks change a record, mask, denominator or interpretation. Use the complete programs " +
      "to check the numerical parts, then explain why the result follows. Hints and worked " +
      "solutions are separate from the live investigations."
    }</Prose>
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"A. Identify the missing checkpoint"}</H3>
    
    <Prose>{
      "A team initializes a decoder randomly, renders 500 examples as chat messages, and calls its " +
      "run “supervised fine-tuning.” What information is missing, and what would make the " +
      "description accurate?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The data's appearance and the parameter initialization are independent."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The described run has supervised targets but starts from random parameters, so it is " +
      "training from scratch. To describe fine-tuning, identify an existing learned checkpoint and " +
      "show that its parameters initialize the run. Model name, immutable revision and file hashes " +
      "make that lineage checkable. Chat delimiters do not establish a pretrained starting point."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"B. Repair a label map and split"}</H3>
    
    <Prose>{"A loader maps raw label "}<code>{"−1"}</code>{" to positive and raw "}<code>{"1"}</code>{
      " to negative. It puts a verse in training and a paraphrase from the same poem in test. " +
      "Explain the two independent problems and a defensible repair."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" One error changes the target; the other changes what a held-out result means."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The original release maps −1 to negative and 1 to positive, so the loader reverses " +
      "supervision. Correct the explicit mapping and inspect known raw rows. A source-family split " +
      "should keep the verse and derived paraphrase together before transformations are made. If " +
      "poem IDs are absent, do not claim poem independence from a string-duplicate check. Retain " +
      "the official split or collect the missing grouping evidence, and state the limit."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"C. Shift a two-token answer"}</H3>
    
    <Prose>{"Use "}<code>{"[BOS,user,q,assistant,not,sure,EOS]"}</code>{
      ", with answer content and EOS selected. Write aligned labels, the selected logit positions " +
      "and the target count."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The first answer token is predicted from the final prompt position."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Aligned labels are "}<code>{"[-100,-100,-100,-100,not,sure,EOS]"}</code>{
      ". Logit rows 3,4,5 predict token positions 4,5,6 respectively, giving three selected " +
      "targets. The last logit at position 6 has no next token in this record. Pass aligned labels " +
      "to an internally shifting API, or explicitly pair "
    }<code>{"logits[:,:-1]"}</code>{" with "}<code>{"labels[:,1:]"}</code>{"; do not apply both shifts."}</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"D. Change the probabilities and ownership"}</H3>
    
    <Prose>{
      "For that answer, the correct-token probabilities are .5,.5,.25. Compute the token mean. Then " +
      "select only EOS. What happens if every label is ignored?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Change the denominator whenever you change which terms exist."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The sum is twice log2 plus log4, or 4log2. Dividing by 3 gives .924196 nats. EOS alone " +
      "gives log4≈1.386294, with count 1, not the old denominator 3. With zero targets the mean is " +
      "undefined; the program rejects the batch. A zero reported training loss would falsely " +
      "describe the absence of supervision as perfect prediction."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"E. Trace prompt credit"}</H3>
    
    <Prose>{
      "An ignored prompt output has zero direct logit derivative. A later selected answer depends " +
      "on the prompt embedding through a nonzero context edge and output map. Must the embedding " +
      "gradient be zero?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Follow all paths from the embedding to selected loss terms."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " No. The later loss supplies a path through the output map and context operation back to " +
      "that embedding. In the mean-context program the path is "
    }<code>{"dZ → dH=dZ Wᵀ → AᵀdH → repeated-ID sum"}</code>{
      ". Ignoring the earlier output removes its direct branch only. The total embedding gradient " +
      "can still be zero for particular parameter values or cancellation, so “prompt gradients are " +
      "always nonzero” would also be too strong. The recorded fixture demonstrates a nonzero case; " +
      "finite differences check the exact implemented paths."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"F. Separate teacher forcing from generation"}</H3>
    
    <Prose>{"The gold response is "}<code>{"yes EOS"}</code>{", but greedy decoding emits "}<code>{"maybe"}</code>{
      " first. Which prefix is used to score the gold EOS during training, and which prefix is used " +
      "for the model's next generated token?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Identify who supplies the previous answer token in each computation."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Teacher-forced EOS loss conditions on the demonstrated "}<code>{"yes"}</code>{". The second generation step conditions on the emitted "}<code>{"maybe"}</code>{
      ". They share parameters but receive different histories. Report response NLL and generated " +
      "output separately. Replacing "
    }<code>{"maybe"}</code>{" with "}<code>{"yes"}</code>{" during a claimed free-generation evaluation would feed the answer back into that evaluation."}</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"G. Mark assistant ownership"}</H3>
    
    <Prose>{
      "A conversation has user content, assistant answer A/EOS, tool content, then assistant answer " +
      "B/EOS. Compare all-assistant and final-assistant supervision. Should the word “assistant” " +
      "inside tool text start a new span?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Use structured roles and actual template spans, not substring matches."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " All-assistant selects A/EOS and B/EOS. Final-assistant selects B/EOS only. Under the " +
      "declared convention, tool/user contents and role prefixes remain context in both cases. A " +
      "word inside tool text has no structural authority to change its role. Inspect the template's " +
      "token-level generation mask, including end positions, and verify that the prepared labels " +
      "match those spans before training."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"H. Preserve genuine EOS"}</H3>
    
    <Prose>{"One right-padded row stores "}<code>{"[BOS,q,answer,EOS,EOS]"}</code>{
      ", where the last position is padding and EOS=PAD. Give the positional validity and " +
      "answer/EOS label arrays. Explain why ID-based masking fails."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" There are two equal stored IDs with different positional roles."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Validity is "}<code>{"[1,1,1,1,0]"}</code>{", labels are "}<code>{"[-100,-100,answer,EOS,-100]"}</code>{
      ", and the selected count is 2 after shifting. Masking all EOS-valued positions erases both " +
      "the last padding entry and the genuine termination target. If truncation cuts before "
    }<code>{"answer"}</code>{", reject or apply a declared alternative policy; do not pass a zero-target batch to backward."}</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"I. Weight unequal microbatches"}</H3>
    
    <Prose>{
      "Microbatch A has one selected target with probability .5. B has three with probabilities " +
      ".5,.5,.25. Compute the global token mean and the naive mean of the two microbatch means. " +
      "Give the correct backward weights."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The two batches contribute one and three terms to a four-term mean."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " A's sum/mean is log2. B's sum is 4log2 and mean4log2/3. The global mean is 5log2/4≈.866434. " +
      "The naive mean is 7log2/6≈.808672. Weight A's mean by 1/4 and B's by 3/4, or divide each " +
      "summed loss by 4 before backward. Clip/update once after both passes. These different values " +
      "are a consequence of different example weights, not a numerical precision problem."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"J. Repair two packing errors"}</H3>
    
    <Prose>{
      "Pack independent records of lengths 3 and 4. A developer uses a single causal triangle and " +
      "positions "
    }<code>{"[0,1,2,3,4,5,6]"}</code>{". What changes are required to match separate examples under learned absolute position embeddings?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Storage location is neither an attention permission nor a within-record position."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Use a 3×3 lower triangle and a 4×4 lower triangle as separate diagonal blocks, with zero " +
      "cross-record edges. Positions become "
    }<code>{"[0,1,2,0,1,2,3]"}</code>{
      ". Ignore the first token of the second record as a cross-boundary target. The block matrix " +
      "has 6+10=16 allowed edges. Verify all valid logits, loss, gradients and one update; fixing " +
      "only the position IDs still permits context leakage, while fixing only the mask still " +
      "changes position vectors."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"K. Diagnose a trainer schema"}</H3>
    
    <Prose>{"Two prompt/completion examples have five selected answer/EOS targets. After combining each into a "}<code>{"text"}</code>{
      " field, a trainer selects nine next-token targets. Is the trainer necessarily broken? What " +
      "should be checked?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Dataset fields and explicit loss flags define different contracts."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " A full-text language-modeling default can correctly select nine targets under that schema. " +
      "The bug is expecting response-only behavior without preserving or rebuilding its boundary. " +
      "Keep prompt/completion fields and set the intended flag, or provide explicit prepared labels " +
      "under a supported API. Inspect actual IDs, validity, EOS and labels from the collator. Then " +
      "compare the scalar loss and all gradients to the explicit objective, not just one matching " +
      "loss value."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"L. Interpret invalid outputs and selection"}</H3>
    
    <Prose>{
      "Four gold examples are negative, negative, no impact and positive. Predictions are negative, " +
      "invalid, negative and positive. Compute accuracy and macro F1. A later checkpoint has better " +
      "test accuracy but worse development response NLL; may it replace the predeclared selected " +
      "checkpoint?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The invalid column is a false negative for its gold class."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Accuracy is 2/4=.5. Negative has TP 1, FP 1, FN 1 and F1=.5; no impact has F1=0; positive " +
      "has F1=1. Macro F1=(.5+0+1)/3=.5. Valid-label rate is 3/4=.75, a different metric. The later " +
      "checkpoint cannot replace the selected one under the frozen development-NLL rule. Doing so " +
      "tunes on test. A new selection rule needs a new prospectively specified experiment and " +
      "independent evaluation, not a relabeling of the current results."
    }</Prose>
    </details>
    </section>
    
    <section className="sft-practice" data-lesson-exercise>
    <H3>{"M. Complete a changed-data update"}</H3>
    
    <SftCapstone />
    
    <Prose>{
      "Use vocabulary IDs BOS=0, user=1, q=2, assistant=3, yes=4, no=5, EOS=6; padding also stores " +
      "6. Record A is "
    }<code>{"[0,1,2,3,4,6]"}</code>{" and record B "}<code>{"[0,1,2,3,5,4,6]"}</code>{
      ". Select answer content plus EOS. Construct padded masks, the packed graph and the global " +
      "mean. Then use the manual mean-context model with identity embeddings, a zero 7×7 head and " +
      "SGD rate .1 to compute one head entry's update. Explain what a separate test would need to " +
      "establish."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " A has two targets, B has three. The initial distribution is uniform. For head entry " +
      "W[q,yes], sum q's context weight times the yes-logit derivative over all five selected " +
      "predictions."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" A's padded validity is "}<code>{"[1,1,1,1,1,1,0]"}</code>{" and labels "}<code>{"[-100,-100,-100,-100,4,6,-100]"}</code>{"; B's validity is all ones and labels "}<code>{"[-100,-100,-100,-100,5,4,6]"}</code>{
      ". Count 2+3=5, so each selected non-target logit has derivative 1/35 and each selected " +
      "target logit−6/35. The initial mean is log7≈1.945910. Accumulated example means require " +
      "weights 2/5 and 3/5."
    }</Prose>
    
    <Prose>{
      "The packed attention matrix has independent 6×6 and 7×7 causal blocks, with 21+28=49 allowed " +
      "edges. Reset B's positions to 0…6 and ignore its first token as a boundary target. In the " +
      "mean-context fixture, q appears once in each relevant prefix. The five prefix lengths are " +
      "4,5 for A and 4,5,6 for B; yes is the target at A's first and B's second selected " +
      "prediction. Thus"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "\\frac{\\partial L}{\\partial W_{q,yes}}\n" +
      "=\\frac15\\left[-\\frac6{7\\cdot4}+\\frac1{7\\cdot5}\n" +
      "+\\frac1{7\\cdot4}-\\frac6{7\\cdot5}+\\frac1{7\\cdot6}\\right]\n" +
      "=-\\frac5{84}."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The first update makes this entry 0−.1(−5/84)=1/168≈.00595238. Since the initial head is " +
      "zero, the embedding gradient is zero on this first step; that does not invalidate the " +
      "earlier nonzero-prompt example with a nonzero head. Check the whole gradient/update with "
    }<code>{"context_backward"}</code>{
      ", then compare the packed decoder only against its own separate-example computation. These " +
      "are different models. A separate test needs an untouched source/group boundary, the same " +
      "inference format, declared output validity and comparison baselines. One lower training loss " +
      "does not establish general instruction following."
    }</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="takeaways">
    <H2>{"Key takeaways"}</H2>
    
    <ul>
    <li>{
      "SFT continues from learned weights toward supplied targets. Data origin, objective, " +
      "trainable subset and inference format are separate choices."
    }</li>
    <li>{
      "Shift next-token targets once. Ignored output loss does not remove prompt context or all " +
      "gradient paths through it."
    }</li>
    <li>{
      "Token validity, target ownership, attention edges and position IDs have distinct meanings. " +
      "Padding or packing must preserve the intended computation."
    }</li>
    <li>{
      "Average selected targets deliberately. Unequal microbatch means need weights if they are to " +
      "reproduce one global token mean."
    }</li>
    <li>{
      "Inspect ordinary trainer outputs and saved artifacts. Prepared labels and actual masked IDs " +
      "are stronger evidence than a plausible configuration name."
    }</li>
    <li>{
      "Use development for the declared selection rule and retain every outcome. Conditional NLL, " +
      "free generation and constrained classification answer different questions."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"Further learning"}</H2>
    
    <Prose>{"Jurafsky and Martin's "}<a href={"https://web.stanford.edu/~jurafsky/slp3/8.pdf"}>{"Speech and Language Processing, chapter 8, §8.1"}</a>{
      " gives another explanation of conditional supervised adaptation and converting labeled tasks " +
      "into instructions. Read it after tracing the shift here; compare its high-level data diagram " +
      "with the explicit masks and denominators above."
    }</Prose>
    
    <Prose>{"The "}<a href={
      "https://github.com/stanford-cs336/spring2025-lectures/blob/61eddac004df975466cff0329b615f2d24230069/nonexecutable/2025%20Lecture%2015%20-%20RLHF%20Alignment.pdf"
    }>{"Stanford CS336 2025 alignment lecture slides"}</a>{
      " provide the broader data and evaluation perspective: style, correctness, knowledge, safety " +
      "and imitation are related questions with different evidence. The slides' SFT discussion " +
      "extends this lesson; the later preference/RL material belongs to the following topics. No " +
      "lecture-video viewing is implied."
    }</Prose>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <H2>{"Technical references and reproducible files"}</H2>
    
    <Prose>{"The primary research is "}<a href={"https://arxiv.org/abs/2203.02155"}>{"InstructGPT"}</a>{", "}<a href={"https://arxiv.org/abs/2210.11416"}>{"Scaling Instruction-Finetuned Language Models"}</a>{", "}<a href={"https://arxiv.org/abs/2305.11206"}>{"LIMA"}</a>{", and the "}<a href={"https://arxiv.org/abs/2011.02686"}>{"Poem Sentiment collection paper"}</a>{". Read each claim with its model, data, split and evaluation conditions. The "}<a href={"https://huggingface.co/docs/trl/sft_trainer"}>{"TRL SFT trainer documentation"}</a>{" and "}<a href={"https://huggingface.co/docs/transformers/chat_templating"}>{"Transformers chat-template guide"}</a>{
      " explain the ordinary interfaces; the executed files above pin their tested versions and " +
      "inspect the actual prepared batch."
    }</Prose>
    
    <Prose>{
      "The six complete programs cover objective/backward, data, batching, study, native trainer " +
      "and evaluation. The downloadable prerequisite decoder remains the causal lesson's exact " +
      "implementation. Large selected pretrained weights are local outputs of the reproducible " +
      "study, not hidden browser training or silently bundled public assets. Recorded metrics and " +
      "examples carry source, model, template and program identities."
    }</Prose>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"Related topics and readiness"}</H2>
    
    <Prose>{"Return to "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"Causal Language Modeling"}</a>{" for the decoder's forward/backward context. Continue to "}<a href={
      "/learn/path/full-curriculum/rlhf-reinforcement-learning-from-human-feedback?module=large-language-models"
    }>{"RLHF"}</a>{
      " when the supervision is preference feedback and a learned reward model. Soft prompting and " +
      "distillation later change, respectively, the optimized parameters and the teacher " +
      "information being transferred."
    }</Prose>
    
    <Prose>{
      "You are ready to move on when you can take a new demonstration, identify the actual target " +
      "for each logit row, preserve EOS while padding, reproduce a global mean across unequal " +
      "microbatches, and explain an error using the prepared data and generated output. Use the " +
      "capstone's changed case to make those explanations concrete; completing a control or " +
      "checking a box is not a substitute for them."
    }</Prose>
    </section>
  </div>;
}
export default {
  title: 'Supervised Fine-Tuning (SFT)', slug: 'supervised-fine-tuning-sft',
  readTime: '~65 min read + 90 min practice', content: SftLesson,
};
