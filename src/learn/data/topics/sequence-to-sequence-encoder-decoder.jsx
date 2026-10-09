// A continuous encoder–decoder lesson; numerical assets retain their declared offline protocol.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { ScheduledPrefixFigure } from '../../components/lesson-labs/Seq2SeqIntuitionFigures.jsx';
import { Seq2SeqEvidenceFigure, Seq2SeqProgram, seq2seqAsset } from '../../components/lesson-labs/Seq2SeqLabs.jsx';
import { scalarBridge } from '../seq2seq-models.js';
import { SeqAnatomyFigure, SeqLookupFigure, SeqStepFigure, SeqScalarFigure, SeqProbabilityTreeFigure, SeqPackingFigure, SeqInterfacesFigure, SeqReversalFigure, SeqSmoothingFigure, SeqStateTransferFigure, SeqRewardFigure, SeqCreditFigure, SeqGroupSplitFigure } from '../../components/lesson-labs/Seq2SeqDrawings.jsx';
import { SeqScalarProvider, SeqTreeProvider, SeqFittedProvider, SeqShiftLab, SeqMaskLab, SeqForwardLab, SeqCreditLab, SeqTreeLab, SeqFrontierLab, SeqLengthLab, SeqFittedQueryLab, SeqFittedStateLab, SeqPrefixLab, SeqContextLab, SeqFittedBeamLab } from '../../components/lesson-labs/Seq2SeqFlowLabs.jsx';
export default {
 title: 'Sequence-to-Sequence & Encoder-Decoder',
 readTime: '~65 min read + experiments and practice',
 hasIntegratedGuide: true,
 content: () => <div className="neural-lesson seq2seq-lesson lesson-flow"><SeqScalarProvider><SeqTreeProvider><SeqFittedProvider><LessonIntro prerequisites="Recurrent state updates and cross-entropy. Source/target tokens, shapes, context and loss normalization are refreshed before composing the model." sections={[["1-two-timelines-one-conditional-task","1. Two timelines, one conditional task"],["2-give-every-token-and-tensor-a-job","2. Give every token and tensor a job"],["3-how-the-encoder-and-decoder-communicate","3. How the encoder and decoder communicate"],["4-train-the-probability-of-the-whole-answer","4. Train the probability of the whole answer"],["5-generate-an-answer-then-search-more-than-one-route","5. Generate an answer, then search more than one route"],["6-a-real-experiment-learning-a-function-is-harder-than-remembering-pairs","6. A real experiment: learning a function is harder than remembering pairs"],["7-run-the-complete-small-model","7. Run the complete small model"],["8-diagnose-the-model-by-separating-four-questions","8. Diagnose the model by separating four questions"],["reuse-the-cell-implement-the-encoder-decoder-protocol","Reuse the cell; implement the encoder–decoder protocol"],["9-deeper-connections-and-practical-extensions","9. Deeper connections and practical extensions"],["10-practice-build-diagnose-and-change-the-problem","10. Practice: build, diagnose and change the problem"],["11-references-another-way-to-learn-and-the-next-step","11. References, another way to learn, and the next step"]]}>Read an input, learn a conditional output and inspect the difference between memorizing examples, generating an answer and finding a better route.</LessonIntro>
<Prose>A recurrent classifier ends with one decision: which digit is this pen trace? Now ask for an answer whose length is not known in advance. Read <code>walk</code> and write <code>walked</code>, or read <code>eat</code> and write <code>ate</code>. The new problem has two parts: decide what to write next, then decide when to stop.</Prose>

<H2>{"1. Two timelines, one conditional task"}</H2>
<Prose>How can one network read four letters and another produce six? An <strong>encoder</strong> reads the input into a carried state, labelled h; its final context is labelled v. A <strong>decoder</strong> starts from that vector and writes its own sequence using states labelled s.</Prose>
<SeqAnatomyFigure />
<Prose>Start on the encoder side. Each cyan item is a <strong>token</strong>, one item processed at a time: the request <code>past</code>, the four letters of <code>walk</code>, and an end marker, <strong>EOS</strong>. Each GRU box is the recurrent update taught in <a href="/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals">RNNs, LSTMs and GRUs</a>: combine the current input with the previous state to make a new state. The violet circles are updated states, not copied letters. The encoder begins with a zero state and reuses one set of learned weights across its six updates.</Prose>
<Prose>The final state, called the <strong>context</strong> and labelled v in the drawing, crosses to the decoder. It is a vector of 64 learned coordinates in our model; the strip draws only eight of them. It is not a prewritten English summary. The decoder begins with this vector and <strong>BOS</strong>, the begin-output token. Its first update produces a state from which a readout chooses <code>w</code>. That chosen letter becomes the next input. The right-hand lane carries state; the left-hand lane feeds back tokens. Steps 3–6 repeat the operation, and step 7 chooses output EOS.</Prose>
<Prose>Source EOS says “the input is finished”; output EOS says “this answer is finished.” They share an ID in this small program but occur on different timelines. There are six input positions and seven output decisions here. The drawing does not connect source position 4 to output position 4: this is generation, rather than assigning one label to every input item.</Prose>
<Prose>A <strong>sequence-to-sequence model</strong> learns a mapping between ordered inputs and ordered outputs. <strong>Encoder–decoder</strong> describes this way of organizing the computation; recurrent cells are one implementation, with Transformers and other alternatives possible. Translation, spelling normalization, structured text generation, and speech transcription with an autoregressive decoder share the broad contract, while their token choices and valid answers differ.</Prose>
<Prose>In a language tool the dictionary form, or <strong>lemma</strong>, can require different answers: <code>try + past → tried</code>, <code>make + participle → making</code>, and <code>walk + third_person → walks</code>. The grammatical request therefore belongs in the input. A dictionary assistant may need hundreds of forms for a lemma; a learned system can share patterns, while explicit rules directly encode regular changes. Neither makes exceptions disappear.</Prose>
<Prose>We now switch from the introductory <code>walk</code> drawing to <code>lactate + past → lactated</code>, a real record in the provided UniMorph extract, so the worked model and saved code use the same example. Its source has nine tokens: <code>past,l,a,c,t,a,t,e,EOS</code>. Its output has nine too: <code>l,a,c,t,a,t,e,d,EOS</code>. That equal count is incidental; the earlier <code>walk</code> example shows why alignment cannot be assumed.</Prose>

<H2>{"2. Give every token and tensor a job"}</H2>
<Prose>The encoder can now receive a token, but how does a character become numbers? A token ID selects a row from a learned <strong>embedding table</strong>.</Prose>
<SeqLookupFigure />
<Prose>Read the cyan <code>l</code>, follow its ID 17 to row 17, then follow the selected row to its output vector. The amber table is learned; its 32 rows correspond to 26 letters, three request tokens, PAD, BOS and EOS. Every row has 24 coordinates. The cutaway shows a few rows and columns, so the row count and coordinate count are written beside it. The integer 17 is an address, not a magnitude or an ordinal meaning of the letter.</Prose>
<Prose>The source and output use the same letters, so this model shares its embedding table. The encoder and decoder GRUs have separate weights: the same kind of update does not mean the same parameters. Other modalities or vocabularies can use separate embeddings. Lowercase a–z is this experiment’s input contract, not a requirement of encoder–decoders; other scripts, case, punctuation, unknown tokens and normalization require deliberate choices. Word, subword and byte tokenization are separate decisions and do not require this model to use BPE.</Prose>
<Prose>What turns the decoder state into the next letter? The readout computes one score per vocabulary entry, removes impossible output classes, then converts the allowed scores into probabilities.</Prose>
<SeqStepFigure />
<Prose>The left branch supplies a 24-coordinate embedding of the <em>previous</em> output token; the right supplies the 64-coordinate carried state. The GRU produces another 64-coordinate state. The learned linear readout produces 32 <strong>logits</strong>, scores before normalization. This task can emit only letters or EOS: PAD, BOS and request-token scores are set to negative infinity before <strong>softmax</strong>. They receive probability zero, while the 27 allowed probabilities sum to one. The same output support is used for training and generation.</Prose>
<Prose>A <strong>batch</strong> stores several examples together. Write its size as <InlineMath>{"N"}</InlineMath>; the supplied program calls the same axis <code>B</code>. Let <InlineMath>{"S"}</InlineMath> be the longest stored source length and <InlineMath>{"T"}</InlineMath> the longest stored output length, including EOS. These are lengths of different timelines.</Prose>
<NeuralTable caption="Tensor axes through the encoder–decoder" headers={['Object','Shape','Meaning']} rows={[
['Source IDs','N × S','Request, letters, source EOS, then PAD'],['Source embeddings','N × S × 24','One learned vector per stored source token'],['Native encoder final state','1 × N × 64','One layer, batch, state coordinates'],['Decoder input IDs','N × T','BOS and previous output tokens'],['Decoder states','N × T × 64','One state per output decision'],['Output logits','N × T × 32','One score per vocabulary class'],['Target IDs','N × T','Reference letters, output EOS, then PAD']]} />
<Prose><strong>PAD</strong> fills unused storage when lengths differ; it does not mean “finish this answer.” Source lengths tell the packed encoder where real input ends. A target mask tells the loss which output positions are real. We will calculate that mask after defining loss in section 4. An embedding’s <code>padding_idx</code> holds its PAD row gradient at zero; it does not stop a GRU’s bias or carried-state update, so source lengths still matter.</Prose>
<Prose>Where does the reference answer go while learning? It supplies the <em>previous</em> token to the next update and the desired <em>current</em> token only to the loss, which scores a distribution against its correct outcome.</Prose>
<SeqShiftLab />
<Prose>The white outline marks the inspected position in both tracks. For <code>cared</code>, inputs are <code>BOS,c,a,r,e,d</code> and targets are <code>c,a,r,e,d,EOS</code>. Position 4 receives <code>r</code> and is scored against <code>e</code>. Feeding <code>e</code> at that same position reveals the answer being scored. For another concrete check, <code>ate</code> uses <code>BOS,a,t,e</code> against <code>a,t,e,EOS</code>; forgetting the shift changes the task.</Prose>
<Prose>Change <code>cared</code> to <code>carts</code>. The first four inputs remain <code>BOS,c,a,r</code>, so their distributions stay fixed for the same model and source. The fourth target changes from <code>e</code> to <code>t</code>, so its score against the correct label can change. The fifth update now receives <code>t</code>, and its state and distribution can change. A changed reference never reruns the encoder; a changed source must.</Prose>

<H2>{"3. How the encoder and decoder communicate"}</H2>
<Prose>The pictures give each object a job. How can we write the same computation without hiding the state handoff? First define the symbols, then read the recurrence in timeline order.</Prose>
<Prose><InlineMath>{"x_i"}</InlineMath> is source token ID at position <InlineMath>{"i"}</InlineMath>; <InlineMath>{"E[x_i]"}</InlineMath> is its embedding. The encoder state after that token is <InlineMath>{"h_i"}</InlineMath>, starting from <InlineMath>{"h_0=0"}</InlineMath>. For this single-example recurrence, S now denotes its real source length, including source EOS and excluding PAD; its final context is <InlineMath>{"v=h_S"}</InlineMath>. In a padded batch use each row’s own real length, not the longest stored S. We use <InlineMath>{"v"}</InlineMath> for context to keep it distinct from an LSTM cell state <InlineMath>{"c"}</InlineMath>. On the separate output timeline, <InlineMath>{"y_t"}</InlineMath> is an output token and <InlineMath>{"s_t"}</InlineMath> its decoder state; <InlineMath>{"y_0=\\mathrm{BOS}"}</InlineMath>.</Prose>
<MathBlock>{"h_i=\\operatorname{GRU}_{enc}(E[x_i],h_{i-1}),\\qquad v=h_S,\\qquad s_0=v."}</MathBlock>
<MathBlock>{"s_t=\\operatorname{GRU}_{dec}(E[y_{t-1}],s_{t-1}),\\qquad z_t=W_{out}s_t+b_{out},\\qquad \\widetilde z_{t,k}=\\begin{cases}z_{t,k}&k\\text{ allowed}\\\\-\\infty&k\\text{ forbidden}\\end{cases},\\qquad p_t=\\operatorname{softmax}(\\widetilde z_t)."}</MathBlock>
<Prose><InlineMath>{"W_{out}"}</InlineMath> and <InlineMath>{"b_{out}"}</InlineMath> are readout parameters, <InlineMath>{"z_t"}</InlineMath> the raw score vector, with its masked version denoted by a tilde, and <InlineMath>{"p_t"}</InlineMath> the allowed probability vector. The decoder does not read the raw source again in this initial-state design. All its source influence travels through its evolving state. Replacing only <InlineMath>{"v"}</InlineMath> later tests that precise dependency; it does not reveal a human meaning for every coordinate.</Prose>
<H3>A small complete forward calculation</H3>
<Prose>Can we follow every number by hand? Temporarily replace the 64-coordinate GRUs with one-coordinate tanh updates. This constructed example teaches the same handoff, without pretending its scalars are fitted linguistic coordinates.</Prose>
<SeqForwardLab />
<Prose>In the encoder drawing each input is multiplied by the shared weight <InlineMath>{"w=0.7"}</InlineMath>, added to <InlineMath>{"0.4"}</InlineMath> times the old state and bias <InlineMath>{"0.1"}</InlineMath>, then passed through tanh. Inputs are <InlineMath>{"[0.2,0.8]"}</InlineMath>. The first weighted sum is <InlineMath>{"0.24"}</InlineMath>, giving <InlineMath>{"h_1=0.235496"}</InlineMath>. The second weighted sum is <InlineMath>{"0.7(0.8)+0.4(0.235496)+0.1"}</InlineMath>, giving final context <InlineMath>{"v=h_2=0.637647"}</InlineMath>.</Prose>
<MathBlock>{"h_i=\\tanh(wx_i+0.4h_{i-1}+0.1),\\quad h_0=0,\\quad x=[0.2,0.8]."}</MathBlock>
<Prose>In the decoder, BOS has embedding <InlineMath>{"0.1"}</InlineMath> and A has embedding <InlineMath>{"0.4"}</InlineMath>. The first update combines BOS with <InlineMath>{"v"}</InlineMath>; the second combines A with the new first decoder state. The two scores are <InlineMath>{"[s_t,-s_t]"}</InlineMath>, for A and EOS. Their softmax gives the sigmoid of <InlineMath>{"2s_t"}</InlineMath>. The factor two comes from subtracting the EOS score <InlineMath>{"-s_t"}</InlineMath> from the A score <InlineMath>{"s_t"}</InlineMath>.</Prose>
<MathBlock>{"s_t=\\tanh(0.6e_{t-1}+0.5s_{t-1}+0.05),\\qquad p_t(A)=\\frac{e^{s_t}}{e^{s_t}+e^{-s_t}}=\\frac{1}{1+e^{-2s_t}}."}</MathBlock>
<NeuralTable caption="Default hand calculation; reference A then EOS" headers={['Step','Previous input','New state','P(A)','P(EOS)']} rows={[[1,'BOS: .1','0.404338','0.691827','0.308173'],[2,'A: .4','0.455936','0.713383','0.286617']]} />
<Prose>The first decision gives A reasonable probability, but the second gives EOS too little. A smooth state trajectory or a large vector norm is not evidence of a correct answer. Now define a loss that can teach the model both the letter and the stopping decision.</Prose>

<H2>{"4. Train the probability of the whole answer"}</H2>
<Prose>What does it mean to assign probability to an entire answer? Multiply the conditional probability at each step, including the probability of ending it.</Prose>
<SeqProbabilityTreeFigure />
<Prose>This new constructed example has tokens A, B, C and EOS so the full tree fits on a page. Every arrow’s number is conditional on the path above it. A has probability <InlineMath>{"0.60"}</InlineMath>; after A, EOS has conditional probability <InlineMath>{"0.51"}</InlineMath>, so the complete A,EOS route has probability <InlineMath>{"0.60\\times0.51=0.306"}</InlineMath>. B,EOS instead gets <InlineMath>{"0.40\\times0.90=0.360"}</InlineMath>. C must then end, with conditional EOS probability 1. The symbolic state labels belong to consumed prefixes; these are not fabricated 64-coordinate model states.</Prose>
<Prose><strong>Autoregressive</strong> means each next-token distribution can depend on previous output tokens. For the particular answer <InlineMath>{"y_1,\\ldots,y_T"}</InlineMath>, including its final EOS, the probability follows the chain rule. Model parameters are denoted <InlineMath>{"\\theta"}</InlineMath>; <InlineMath>{"y_{<t}"}</InlineMath> means the output prefix before position <InlineMath>{"t"}</InlineMath>.</Prose>
<MathBlock>{"P_\\theta(y\\mid x)=\\prod_{t=1}^{T}P_\\theta(y_t\\mid y_{<t},x),\\qquad \\mathcal L_{\\rm sequence}=-\\sum_{t=1}^{T}\\log p_t(y_t)."}</MathBlock>
<Prose>The <strong>negative log-likelihood</strong>, or NLL, turns that product into added costs: a less probable correct token costs more. Natural logarithms give units called <strong>nats</strong>. Return to the scalar A,EOS example: costs are <InlineMath>{"0.368419"}</InlineMath> and <InlineMath>{"1.249609"}</InlineMath>, mean <InlineMath>{"0.809014"}</InlineMath> nats per valid output token. EOS contributes most of the error. Omitting its target removes the direct lesson “finish after A.”</Prose>
<Prose>Which storage positions count? The mask puts weight 1 on real targets, including EOS, and 0 on PAD; only the ones enter the denominator.</Prose>
<SeqMaskLab />
<Prose>Both constructed answers have six valid targets. Adding storage cells does not add reference events. For a batch, <InlineMath>{"m_{nt}"}</InlineMath> is that binary mask at example <InlineMath>{"n"}</InlineMath> and output position <InlineMath>{"t"}</InlineMath>. Divide the total valid cost by the number of valid targets.</Prose>
<MathBlock>{"\\mathcal L=\\frac{\\sum_{n,t}m_{nt}[-\\log p_{nt}(y_{nt})]}{\\sum_{n,t}m_{nt}},\\qquad m_{nt}=\\mathbf1[y_{nt}\\ne\\mathrm{PAD}]."}</MathBlock>
<Prose>Equal token weighting is a choice, not the only objective. Suppose a two-token answer costs 1 nat per token and a six-token answer costs 3. Token mean is <InlineMath>{"(2\\times1+6\\times3)/8=2.5"}</InlineMath>; averaging the two sequence means gives <InlineMath>{"(1+3)/2=2"}</InlineMath>. Token weights are respectively <InlineMath>{"1/8"}</InlineMath> each, or <InlineMath>{"1/4"}</InlineMath> for a short-answer token and <InlineMath>{"1/12"}</InlineMath> for a long-answer token. Under either choice PAD has zero weight. The fitted model’s native cared/tried check measured <InlineMath>{"1.074011445"}</InlineMath> nats over 12 valid targets before and after extra padding; that is separate from the editable equal-probability illustration.</Prose>
<H3>Teacher forcing supplies a known prefix</H3>
<Prose>We already built shifted reference tracks in section 2. Using those known previous tokens while fitting is called <strong>teacher forcing</strong>. It directly evaluates the conditional factors of the data likelihood; it is coherent maximum-likelihood training, not a shortcut that invalidates the loss. Supplying known inputs permits one batched <code>nn.GRU</code> call, but states still depend on earlier states: later input availability does not make time steps independent.</Prose>
<Prose>During free generation there is no reference answer, so the chosen or sampled output supplies the next input. A wrong choice can lead to a prefix weakly represented during training. This is a reason to evaluate generated answers as well as known-prefix NLL; it does not mean every first mistake is irrecoverable.</Prose>
<H3>One gradient teaches both networks</H3>
<Prose>How can a wrong output teach the encoder? Loss credit travels backward through the decoder’s initial state and context bridge into both uses of the shared encoder weight.</Prose>
<SeqCreditFigure result={scalarBridge([.2,.8])} />
<Prose>The orange dashed arrows reverse the forward dependency. At step 1 the correct class is A; at step 2 it is EOS. For two logits <InlineMath>{"[s,-s]"}</InlineMath>, the derivative of the correct-token negative log probability with respect to <InlineMath>{"s"}</InlineMath> is <InlineMath>{"2[p(A)-q]"}</InlineMath>, where <InlineMath>{"q=1"}</InlineMath> for A and <InlineMath>{"q=0"}</InlineMath> for EOS. The factor two is the score difference derived in section 3. Our loss averages two tokens, multiplying each direct derivative by <InlineMath>{"1/2"}</InlineMath>; these factors cancel.</Prose>
<Prose>Step 2 also depends on step 1 through its carried state. The tanh derivative is <InlineMath>{"1-s_2^2"}</InlineMath> and the carried-state weight is <InlineMath>{"0.5"}</InlineMath>, so add this future contribution to the direct step-1 derivative:</Prose>
<MathBlock>{"\\frac{\\partial\\mathcal L}{\\partial s_1}=(p_1(A)-1)+p_2(A)\\,0.5(1-s_2^2),\\qquad \\frac{\\partial\\mathcal L}{\\partial v}=\\frac{\\partial\\mathcal L}{\\partial s_1}\\,0.5(1-s_1^2)."}</MathBlock>
<Prose>To cross the encoder, differentiate both positions using the same weight <InlineMath>{"w"}</InlineMath>. The direct second-position term is <InlineMath>{"x_2"}</InlineMath>; the earlier contribution goes through <InlineMath>{"h_1"}</InlineMath> and carried-state weight <InlineMath>{"0.4"}</InlineMath>.</Prose>
<MathBlock>{"\\frac{\\partial v}{\\partial w}=(1-h_2^2)[x_2+0.4(1-h_1^2)x_1],\\qquad \\frac{\\partial\\mathcal L}{\\partial w}=\\frac{\\partial\\mathcal L}{\\partial v}\\frac{\\partial v}{\\partial w}=-0.00556958."}</MathBlock>
<Prose>A gradient-descent update subtracts rate times derivative. With rate <InlineMath>{"0.1"}</InlineMath>, weight <InlineMath>{"0.7"}</InlineMath> becomes <InlineMath>{"0.70055696"}</InlineMath> and mean NLL becomes <InlineMath>{"0.80901091"}</InlineMath>. The full mechanics program checks this chain against a central finite difference. The real four-example batch has encoder input-weight gradient norm <InlineMath>{"0.169993"}</InlineMath>. <strong>Detaching</strong> the context preserves forward values but prevents decoder loss from training the encoder; that needs a deliberate separate objective rather than an accidental graph break.</Prose>
<SeqCreditLab />
<Prose>The earlier forward controls also change this gradient calculation, so the two investigations share one fixture. Its proposed update is a comparison, not accumulated training. Zero update rate and detached context are exact nulls for the weight change. <a href="/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals">Backpropagation and Automatic Differentiation</a> explains the graph mechanics; the new connection here is the bridge between two networks.</Prose>

<H2>{"5. Generate an answer, then search more than one route"}</H2>
<Prose>The likelihood tree tells us how to score a route. How should we choose one? <strong>Greedy decoding</strong> picks the largest next-token probability, feeds that choice back and repeats until EOS or an explicit output cap.</Prose>
<SeqTreeLab />
<Prose>At the default values, greedy chooses A first, then EOS, for probability <InlineMath>{"0.306"}</InlineMath>. The complete B,EOS path has <InlineMath>{"0.360"}</InlineMath>. The locally best first choice loses because its continuation is less likely. Changing the three conditional rows above updates their complements and all four complete products; it does not change a fitted network.</Prose>
<Prose><strong>Beam search</strong> keeps several partial routes instead of committing to one. Its <strong>width</strong> is the maximum number retained. With width two, keep A and B, expand each live prefix by its possible next tokens, add next-token log probability to accumulated log probability, and keep the two best candidates. A finished candidate remains available without consuming more EOS tokens.</Prose>
<SeqFrontierLab />
<Prose>The frontier is the retained list at that step; the table makes pruning explicit. The first default frontier holds A at <InlineMath>{"0.6"}</InlineMath> and B at <InlineMath>{"0.4"}</InlineMath>; the second holds B,EOS at <InlineMath>{"0.36"}</InlineMath> and A,EOS at <InlineMath>{"0.306"}</InlineMath>. A candidate carries its prefix, score, end status and decoder state together. In the neural version, siblings emitted from one parent share that parent step’s immutable new state until their different emitted tokens are consumed next. They cannot borrow a different route’s state.</Prose>
<Prose>Our exact contract puts live and completed candidates in the same width-limited list, breaks tied neural scores by token IDs, and stops when every retained candidate is complete or the cap is reached. Width one matches greedy under those same rules. Beam search remains approximate: pruning can discard an eventually good route. A larger beam improves search of the model’s score, not necessarily task correctness when the model is wrong.</Prose>
<Prose>The real saved seed-one model generates <code>lactated</code> and EOS from <code>lactate + past</code>. With a cap of three it emits <code>lac</code> without EOS. The cap means “we stopped generation,” not “the model decided to finish.” A route probability is the model’s conditional probability for that string, not the probability that its spelling is linguistically correct.</Prose>
<H3>Length normalization changes what search prefers</H3>
<Prose>Raw log probability is a sum of nonpositive terms, so extending one prefix cannot improve its raw score. Comparing complete answers with different lengths may call for a deliberate length policy; changing the denominator can reverse their ranking.</Prose>
<SeqLengthLab />
<Prose>Each branch keeps its raw log probability fixed and divides by a positive length-dependent number. Let <InlineMath>{"L"}</InlineMath> count generated tokens, including EOS and excluding BOS, and let <InlineMath>{"\\alpha"}</InlineMath> be the length exponent. The displayed score uses the length term from the GNMT family:</Prose>
<MathBlock>{"\\operatorname{score}(y)=\\frac{\\log P(y\\mid x)}{((5+L)/6)^\\alpha}."}</MathBlock>
<Prose>The exponent is applied once. At <InlineMath>{"\\alpha=0"}</InlineMath>, length 3 with raw log score <InlineMath>{"-1.5"}</InlineMath> beats length 6 with <InlineMath>{"-1.8"}</InlineMath>. At <InlineMath>{"\\alpha=1"}</InlineMath>, scores are <InlineMath>{"-1.125"}</InlineMath> and <InlineMath>{"-0.981818"}</InlineMath>, so the longer answer wins. Dividing a negative number by a larger positive denominator makes it less negative; calling this universally a penalty against long answers gets the effect backward. It is a ranking heuristic, not a normalized probability. GNMT’s separate coverage term requires attention and is absent here (<a href="https://arxiv.org/abs/1609.08144">GNMT section 7</a>).</Prose>
<Prose>The recorded inflection experiment fixes <InlineMath>{"\\alpha=0"}</InlineMath>. Tune a different policy on development data and report its length convention; a parameter name or translation-paper setting is not a universal spelling-model rule.</Prose>

<H2>{"6. A real experiment: learning a function is harder than remembering pairs"}</H2>

<Prose>{"The offline extract comes from the "}<a href={"https://github.com/unimorph/eng"}>{"UniMorph English repository"}</a>{", pinned to a specific source revision. It contains 600 lowercase lemma spellings, each with a past, present-participle and third-person-singular-present form. The source includes uncommon and historical spellings; it is a lexicon sample, not the frequency distribution of everyday English. Its data license and attribution travel with the extract."}</Prose>

<Prose>{"The intended question is: "}<strong>{"can this model inflect a spelling absent from training?"}</strong>{" All three requests for one lemma stay together. We also group selected lemmas linked by a shared output form: "}<code>{"worke"}</code>{" and "}<code>{"work"}</code>{" share "}<code>{"worked"}</code>{" and "}<code>{"working"}</code>{". Treating their strings as unrelated would give a misleadingly clean “no overlap” report. This conservative grouping can merge genuine homographs; it is an operational split policy, not a complete linguistic identity system."}</Prose>

<Prose>Which records must stay together? Link lemma variants by a shared target, then assign the whole connected group to one partition.</Prose>
<SeqGroupSplitFigure />
<Prose>{"The final split has 451 training lemmas/1,353 examples and 149 development lemmas/447 examples. There is no shared lemma string or target form across these partitions. No unseen final test is claimed: we inspect development outcomes to learn about the system. Future tuning would consume more development information and require a separately protected evaluation for a final performance claim."}</Prose>

<Prose>{"The experiment fixes a 24-coordinate embedding, one 64-coordinate GRU encoder, one 64-coordinate GRU decoder and a 32-score output head: 37,408 trainable parameters. Each of three seeds receives 1,200 Adam updates at learning rate 0.003, batches of 64 sampled training rows, global gradient clipping at 1, teacher forcing and the same token/split rules. We show the final predeclared update, not the best-looking development checkpoint."}</Prose>

<Prose>{"The comparison includes two non-neural systems. "}<strong>{"Copy"}</strong>{" returns the lemma unchanged. "}<strong>{"Predeclared suffix rules"}</strong>{" append or replace endings such as "}<code>{"y→ied"}</code>{" and "}<code>{"e→ing"}</code>{"; the exact rules are in the program. They omit irregular dictionaries and some spelling conditions, including consonant doubling. Their prior knowledge is explicit."}</Prose>

<Prose>{"For generated strings, "}<strong>{"exact match"}</strong>{" requires the reference spelling and natural EOS termination. "}<strong>{"Character error rate"}</strong>{" is total Levenshtein insertions, deletions and substitutions divided by total reference characters. A rate above 1 is possible when a generator inserts many characters. Teacher-forced NLL is measured separately, including EOS and excluding PAD."}</Prose>

<Prose>What did the fixed protocol learn? First inspect every measured development checkpoint, then compare the final outputs and baselines. The lines connect recorded points; they do not invent intermediate training measurements.</Prose>
<Seq2SeqEvidenceFigure />
<NeuralTable caption={"Recorded systems under one grouped split"} headers={[<>{"System"}</>,<>{"Training exact / 1,353"}</>,<>{"Development exact / 447"}</>,<>{"Development character error rate"}</>,<>{"Development teacher-forced NLL"}</>]} rows={[[<>{"Copy lemma"}</>,<>{"3"}</>,<>{"1"}</>,<>{"0.255014"}</>,<>{"Not a probabilistic model"}</>],[<>{"Predeclared suffix rules"}</>,<>{"1206"}</>,<>{"407"}</>,<>{"0.016332"}</>,<>{"Not a probabilistic model"}</>],[<>{"GRU encoder–decoder, seed 1"}</>,<>{"1328"}</>,<>{"53"}</>,<>{"0.434670"}</>,<>{"1.285388"}</>],[<>{"GRU encoder–decoder, seed 2"}</>,<>{"1323"}</>,<>{"41"}</>,<>{"0.439255"}</>,<>{"1.455556"}</>],[<>{"GRU encoder–decoder, seed 3"}</>,<>{"1287"}</>,<>{"52"}</>,<>{"0.422636"}</>,<>{"1.232162"}</>]]} />

<Prose>{"All final neural development generations ended with EOS within the limit. These are actual CPU measurements on the declared grouped split."}</Prose>

<Prose>{"The neural system can memorize training pairs yet fail badly on new lemmas. Most of this task's characters should be copied from the input. A fixed context forces the model to learn a representation and a decoder that preserve this detail; the hand-written rules already preserve it by construction. The comparison is informative even though the neural model loses."}</Prose>

<Prose>{"Do not conclude that all encoder–decoders are poor inflectors. This experiment has a small training lexicon, a particular architecture, initialization, optimizer and budget. It establishes this result for this protocol. Increasing capacity alone might improve memorization without solving the held-out problem."}</Prose>

<Prose>{"Seed 1's development slices are 44/168 exact for lemma lengths 3–5 and 9/279 for lengths 6–8. Longer spellings are harder here, but length is entangled with which words occur, spelling patterns and number of required copy operations. This is not a causal experiment proving that a fixed context has a universal character limit."}</Prose>

<Prose>{"The same seed's beam 3 search returns 56/447 exact rather than greedy's 53/447; character error rate changes from 0.434670 to 0.410888. No additional training occurred. Search recovers some better-scoring routes, but it cannot supply missing linguistic knowledge or undo the large generalization gap."}</Prose>



<H2>{"7. Run the complete small model"}</H2>

<Prose>{"Save "}<code>{"english-inflections.csv"}</code>{" beside "}<code>{"inflection-seq2seq.py"}</code>{". A CPU Python environment with NumPy and PyTorch is sufficient; no pretrained model or runtime data download is used. The recorded run used Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu. If those packages are absent, create a local virtual environment and install NumPy and the CPU build of PyTorch appropriate to your operating system from its official installer."}</Prose>

<Prose>Download the <a href={seq2seqAsset + "english-inflections.csv"}>offline inflection CSV</a>, <a href={seq2seqAsset + "inflection-seq2seq.py"}>complete program</a> and <a href={seq2seqAsset + "data-provenance.md"}>attribution and split provenance</a>. Preserve the UniMorph English contributors, source revision, adaptation and CC BY-SA 3.0 license when sharing the extract. To inspect the fixed model without rerunning training, also save <a href={seq2seqAsset + "calculated-inputs.json"}>the measured record and weights</a> plus <a href={seq2seqAsset + "saved-inflection.py"}>the standalone inference example</a>.</Prose>

<Prose>{"Run "}<code>{"python inflection-seq2seq.py"}</code>{". The program prints checkpoint and final metrics and writes "}<code>{"calculated-inputs.json"}</code>{" with predictions, weights and the protocol. Seeds make the experiment reproducible in the recorded environment; another backend/version may produce small numerical differences."}</Prose>

<Prose>{"Read the program in this order: "}<code>{"batch"}</code>{" constructs the shifted tracks; "}<code>{"Inflector"}</code>{" connects the states; "}<code>{"greedy"}</code>{" performs free generation; "}<code>{"beam"}</code>{" owns each candidate state; "}<code>{"summarize"}</code>{" separates exact match, edits and termination; "}<code>{"main"}</code>{" applies the fixed training protocol. "}<code>{"assess"}</code>{" uses no gradients. "}<code>{"model.eval()"}</code>{" chooses evaluation behavior, whereas "}<code>{"no_grad()"}</code>{" suppresses gradient recording."}</Prose>

<Seq2SeqProgram file="inflection-seq2seq.py" title="Read the complete runnable inflection model" />

<Prose>{"The decoder's previous token is selected with "}<code>{"argmax"}</code>{" only during generation. The training graph uses the known target prefix and differentiable logits. We do not backpropagate through the discrete greedy choices to fit this maximum-likelihood model."}</Prose>

<Prose>{"The fixed learned model also supports inference without fitting. After the first run, save this next block beside the program and JSON and run it. It loads seed 1's saved parameters, asks only for the lemma and grammatical request, and prints both the string and whether EOS ended it. No reference answer is supplied to generation."}</Prose>

<Prose>This inference excerpt is also the complete downloadable <a href={seq2seqAsset + "saved-inflection.py"}>saved-inflection.py</a>; keep its program and JSON dependencies beside it.</Prose>
<CodeBlock language={"python"} filename="saved-inflection.py" downloadUrl={seq2seqAsset + "saved-inflection.py"}>{"from pathlib import Path\nimport json\nimport runpy\nimport torch\n\nfolder = Path(__file__).resolve().parent\napi = runpy.run_path(str(folder / \"inflection-seq2seq.py\"))\nsaved = json.loads((folder / \"calculated-inputs.json\").read_text())\nmodel = api[\"Inflector\"]().eval()\nweights = saved[\"runs\"][0][\"weights\"]\nmodel.load_state_dict({\n    key: torch.tensor(value, dtype=torch.bool if key == \"invalid_output\" else torch.float32)\n    for key, value in weights.items()\n})\nquery = {\"lemma\": \"lactate\", \"feature\": \"past\"}\nfor limit in (3, 16):\n    result = api[\"greedy\"](model, [query], max_output=limit)[0]\n    print(limit, result[\"prediction\"], result[\"ended_with_eos\"])"}</CodeBlock>

<Prose>{"The recorded output is "}<code>{"3 lac False"}</code>{" followed by "}<code>{"16 lactated True"}</code>{" for the worked training example. The investigations use those fixed weights to recompute short inference traces; they do not run training in the page."}</Prose>

<H2>{"8. Diagnose the model by separating four questions"}</H2>

<Prose>{""}<strong>{"Did we ask and encode the right task?"}</strong>{" Inspect the request token, source lengths, target shift, EOS and output vocabulary. Swapping a row's reference form must not change the encoder input. If a source spelling is edited, rerun the encoder; do not keep its old context. A typo or unsupported character needs an explicit input decision."}</Prose>

<Prose>{""}<strong>{"Can the network fit the supplied examples?"}</strong>{" Low training loss and many exact training outputs show optimization has learned something about those pairs. If even a small training batch cannot be learned, inspect gradients, state detachment, masking, data pairing and parameter updates before adding decoding restrictions."}</Prose>

<Prose>{""}<strong>{"Does the learned rule transfer?"}</strong>{" Compare the same fixed model on grouped development examples and the simple baseline. Examine actual outputs, not only a scalar average. A grammatically plausible suffix attached to the wrong copied stem is still an error. A reference may itself contain an unusual lexicon entry; inspect provenance before “correcting” it to your expectation."}</Prose>

<Prose>{""}<strong>{"Is search failing to find a good route the model already scores well?"}</strong>{" Compare greedy and beam under a fixed model and declared scoring rule. An increase in model score with a decrease in exact match is possible. Beam size is an inference choice; training updates are a model change. Mixing them in one unexplained curve hides what caused the result."}</Prose>

<Prose>What changes when the source changes? Follow freshly encoded source tokens and generated output tokens with fixed seed-one weights. This is free generation: no reference target enters it.</Prose>
<SeqFittedQueryLab />
<Prose>Each source edit reruns its encoder. The default development query <code>emmove + past</code> has reference <code>emmoved</code>, but the saved model generates <code>emoves</code>; changing to <code>emmode</code> gives <code>ememmis</code>. The first P(e) changes from <InlineMath>{"0.607604163"}</InlineMath> to <InlineMath>{"0.874140168"}</InlineMath>. Changing the request to participle for emmove instead gives <code>emomming</code> and first P(e) <InlineMath>{"0.812601928"}</InlineMath>. Edited inputs need not have a verified reference.</Prose>
<Prose>Where did that decision come from? Inspect one learned coordinate across the actual recurrent trajectories, then read the full next-token probability table at that step.</Prose>
<SeqFittedStateLab />
<Prose>Both trajectories use a fixed vertical range from −1 to 1, which is valid for these GRU states starting in that interval. The coordinate picker exposes all 64 coordinates; the table exposes all 32 vocabulary probabilities, including the five forbidden zeros. A coordinate is not assigned a linguistic label such as “past tense.” The first state is computed before its selected output token becomes the next input.</Prose>
<Prose>Does a changed chosen prefix affect earlier distributions? Force up to six previous choices after their probabilities have been computed, then observe the resulting continuation with the current source’s own context.</Prose>
<SeqPrefixLab />
<Prose>With the default query, forcing the first character to <code>a</code> gives <code>amves</code>. The first distribution is unchanged because it still receives BOS; the following P(m) changes from <InlineMath>{"0.968971867"}</InlineMath> to <InlineMath>{"0.547885999"}</InlineMath>. Replaying the same first two greedy characters is an exact continuation null. Prefix forcing does not claim the forced characters were likely.</Prose>
<Prose>How much does the source summary influence the decoder? Keep the current query, prefix, cap and all weights fixed, and change only the vector supplied as its initial state. “Mix” interpolates toward the fixed context of lactate + past; “gain” scales the entire mixed vector.</Prose>
<SeqContextLab />
<Prose>The two incoming strips are cutaways of 64-coordinate contexts. The selected coordinate value and complete 64-row table below make the actual incoming and edited values inspectable. At mix zero, the edited context is gain times the current source vector. At gain one and mix zero, it is exactly the original vector. At gain zero, every coordinate is zero; at gain one and mix one it is exactly lactate’s context. Intermediate vectors are constructed interventions, not verified inputs. The baseline is always the current query with its current forced prefix and cap, so an earlier source edit cannot silently change what is being compared.</Prose>
<MathBlock>{"v_{used}=g[(1-a)v_{query}+a v_{lactate}]."}</MathBlock>
<Prose>Here <InlineMath>{"g"}</InlineMath> is gain and <InlineMath>{"a"}</InlineMath> the mixing fraction. With default emmove + past and no forced prefix, zero context generates <code>pled</code> and lactate context generates <code>lactated</code>. This locates a causal dependency in this fixed computation; it does not prove the small model has learned a general spelling rule.</Prose>
<Prose>Finally separate search from those interventions. These are actual candidate-owned 64-coordinate states from a fresh own-context beam, using the current source but no forced prefix or edited initialization.</Prose>
<SeqFittedBeamLab />
<Prose>Each cutaway belongs to its own token prefix and raw log score. As in section 5, newly emitted siblings can share the immutable parent-step state until their different tokens enter the next update. Increasing beam width does not update any model parameter. The separate beam cap counts EOS and leaves capped candidates explicitly unfinished.</Prose>

<Prose>{"A useful null experiment replaces the context with an exact copy of itself: nothing should change. Replaying an already generated prefix should recover the same continuation. Replacing it with a different source's context should use that context's information. Changing only an on-screen label should affect none of the numbers."}</Prose>

<Prose>{"Do not ban repeated characters merely because a model repeats. "}<code>{"letter"}</code>{" and "}<code>{"unsubbed"}</code>{" legitimately contain repeats. Diagnose data and generation first; use a constraint only when the task itself rules out the affected outputs."}</Prose>

<H2>{"Reuse the cell; implement the encoder–decoder protocol"}</H2>

<Prose>We have already implemented GRU’s gates in <a href="/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals">RNNs, LSTMs and GRUs</a>. The new from-scratch task is joining two of those differentiable recurrences with correct token shifting, length handling, shared embedding gradients and candidate ownership. We reuse the exact <a href="/learn-assets/rnns-lstms-grus/recurrent-cells.py">recurrent-cells.py</a> rather than recopying a subtly different gate convention.</Prose>
<Prose>Where does a different-length batch get its context? Select each row’s last real source state, including source EOS; storage padding is never its context.</Prose>
<SeqPackingFigure />
<Prose>The cyan cells are real source positions and dashed cells are PAD storage. The lower violet cells are states after those positions; a white outline selects index length minus one in each row. The native program uses packing to skip PAD recurrence. The explicit program computes the dense history, then gathers each selected state. Because this encoder is unidirectional and causal, later PAD work cannot change earlier valid states or their gradients, but it does consume extra compute. This is a transparent small reference implementation, with no claim to beat optimized native kernels.</Prose>
<Prose>The explicit cell takes states shaped <code>N × 64</code>; the one-layer native protocol takes <code>1 × N × 64</code>. <code>ExplicitGRU</code> removes that layer axis before the cell and adds it afterward. Both biases and PyTorch’s reset-after candidate convention remain intact. Shared embedding and linear readout are the already taught row lookup and matrix multiplication; the recurrent calculation and protocol are explicit.</Prose>
<Prose>Save <code>explicit-inflector.py</code>, <code>recurrent-cells.py</code>, <code>inflection-seq2seq.py</code> and <code>seed-one-inference.json</code> together, then run <code>python explicit-inflector.py</code>. Its imports load those local files by name. It demonstrates teacher-forced loss/backward with a matched random model, then runs fixed saved weights source-only; it does not fit a new model. The protocol base supplies batching, output support and search already explained above. Its recurrent modules are explicit cells, not hidden calls to native GRU.</Prose>
<Seq2SeqProgram file="explicit-inflector.py" title="Compose the differentiable scratch cells into the complete conditional protocol" />
<Prose>The matched float64 check compares all valid encoder states, context, decoder logits, loss and gradients of all 11 trainable parameter tensors with the native model, including both recurrent biases and the shared embedding. Unsorted lengths, changed PAD cells, nonzero initial decoder state, chunks of 3 + 3 + 1, detached encoder gradients, causal target edits, capped/ended batches and width-one/two/three search are checked. The maximum observed absolute discrepancy was <InlineMath>{"8.881784197001252\\times10^{-16}"}</InlineMath>. That agreement certifies these tested equations and cases, not a latency claim. Native batch generation may continue computing hidden values for rows already ended; compare their valid active outputs and scores rather than treating those unscored later states as part of the answer.</Prose>
<Prose>For the scalar derivative and the exact constructed search, <code>sequence-mechanics.py</code> gives separate small calculations and assertions. It checks the mechanism without requiring a trained lexicon.</Prose>
<Seq2SeqProgram file="sequence-mechanics.py" title="Read the scalar joint derivative, manual GRU protocol and exact search checks" />

<Prose>{"The ordinary implementation uses embeddings and "}<code>{"nn.GRU"}</code>{" for encoding/decoding, and explicit code for shifting targets, carrying context and deciding when to end. There is no requirement to replace this small research model with a downloaded language-model wrapper. The supplied beam function owns candidate state: token IDs, accumulated log probability, end status and decoder state must travel together. A batched decoder can share the encoder memory, but its beam-specific hidden states cannot be accidentally shared and mutated."}</Prose>

<Prose>{"The hand-search tree and trained inflector answer different questions. The tree checks search arithmetic exactly; the trained model checks whether learned conditional distributions support useful outputs. Width 1 beam should match greedy under the same tie/termination rule. An ended hypothesis is retained without repeatedly consuming EOS, while a hypothesis that reaches the step cap is reported as capped. Length normalization changes ranking; it is not a harmless numerical rescaling."}</Prose>

<Prose>{""}<strong>{"Changed-code task:"}</strong>{" add a second source to a batched decoding routine, one ending after 2 tokens and another after 5. Keep an explicit ended mask and original source IDs. After an example ends, preserve its final sequence and stop assigning it new scored tokens; continue the other example. Test that decoding this batch gives the same two results as separate calls in eval mode. For beam search additionally reorder decoder states with the same parent indices used to gather candidate tokens."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A batch is a collection of independent sequence states, not one common EOS event."}</Prose>

</details>

<details>

<summary>Solution and success criteria</summary>

<Prose>{"Initialize one hidden state and ended flag per source. On each step form candidate logits only for active rows, append their chosen tokens, mark newly emitted EOS and gather any beam parents consistently. Already-ended output strings remain unchanged. Compare complete token sequences and log probabilities, including the case where one row is capped and the other genuinely ended. Padding is storage, not another generated token. Correct source-to-state ownership matters more than saving a few Python lines."}</Prose>

</details>

<H2>{"9. Deeper connections and practical extensions"}</H2>

<section data-lesson-teaching="" className="lesson-teaching-section">

<h3 className="lesson-teaching-section__title">Different context interfaces: GRU, LSTM, stacks and attention</h3>

<Prose>What changes if the decoder needs more than one carried state? Hidden and cell memory are different paths; projections must match the receiver’s width and layer count.</Prose>
<SeqStateTransferFigure />
<Prose>{"Our decoder initializes from one GRU state. An LSTM has both hidden state "}<InlineMath>{"h"}</InlineMath>{" and cell state "}<InlineMath>{"c"}</InlineMath>{"; a complete handoff must say what happens to both. With several layers, state has a layer axis. A bidirectional encoder has two directional states per layer. “Pass the final hidden vector” is insufficient when the decoder expects a different shape or a missing cell state."}</Prose>

<Prose>{"If encoder and decoder widths differ, a learned projection can map a concatenated encoder representation into the required decoder state. For example, two encoder directions of 64 coordinates can be concatenated into 128 and projected to a 64-coordinate decoder state. An LSTM may need separate projections for hidden and cell states. A deliberate zero initialization with a separately supplied context is another design."}</Prose>

<Prose>Does source information enter once or remain available at every output step? Compare the three access paths before choosing an interface. In the attention sketch, a query means the previous decoder state used to decide what source information to read; each step has its own query and read.</Prose>
<SeqInterfacesFigure />
<Prose>{"Context can also be concatenated to the decoder input at every step. That repeatedly supplies the same source summary, whereas attention supplies a "}<strong>{"different weighted combination of source states"}</strong>{" for each decoding step. The next lesson derives that mechanism. The difference is access to information, not a guarantee that the weights perfectly explain language or that generation becomes factual."}</Prose>

<Prose>{"The 2014 Sutskever system demonstrated large recurrent encoder–decoder translation with word vocabularies and unknown-word tokens. Its reported 34.81 BLEU result used an ensemble of five models and beam 12. Source reversal shortened some important dependency paths; it did not reverse the target language or eliminate recurrent computation. The paper actually reported good performance on long sentences in that setting, so a universal “fails after 30 words” claim would misrepresent it. "}<a href={"https://arxiv.org/abs/1409.3215"}>{"Sequence to Sequence Learning with Neural Networks"}</a>{"."}</Prose>

<Prose>Can a source-order change shorten a dependency without changing the requested answer? Trace the same A→X, B→Y, C→Z alignment through both chains.</Prose>
<SeqReversalFigure />
<Prose>{"Use a constructed alignment A→X, B→Y, C→Z to see what reversal changes. Count state-to-state edges from the source token's encoder state to its aligned decoder output, in a single-summary recurrent chain:"}</Prose>

<NeuralTable caption={"Source reversal changes individual path lengths"} headers={[<>{"Aligned information"}</>,<>{"Encode A B C, then decode X Y Z"}</>,<>{"Encode C B A, then decode X Y Z"}</>]} rows={[[<>{"A needed for X"}</>,<>{"A→B→C→X: 3 edges"}</>,<>{"A→X: 1 edge"}</>],[<>{"B needed for Y"}</>,<>{"B→C→X→Y: 3 edges"}</>,<>{"B→A→X→Y: 3 edges"}</>],[<>{"C needed for Z"}</>,<>{"C→X→Y→Z: 3 edges"}</>,<>{"C→B→A→X→Y→Z: 5 edges"}</>]]} />

<Prose>{"Some early output dependencies become shorter while later ones become longer; the average in this small construction stays 3. Real language alignments are more complicated. Reversal is an ordering choice that changes credit paths, not a way to remove the source-summary bottleneck or a universal preprocessing rule."}</Prose>

</section>

<section data-lesson-teaching="" className="lesson-teaching-section">

<h3 className="lesson-teaching-section__title">Teacher forcing, scheduled sampling and sequence objectives</h3>

<Prose>{"Maximum likelihood scores observed prefixes. Deployment uses generated prefixes. That mismatch can expose weaknesses in an imperfect model, but the likelihood objective remains mathematically coherent. A generated-prefix intervention measures a particular response; it does not prove a universal account of every sequence error."}</Prose>

<Prose>{"Scheduled sampling mixes reference and generated previous tokens during training, typically changing the mixing probability over time. The targets can remain the original next tokens even when the prefix has changed. That means it is no longer simply evaluating the original data likelihood. The original proposal reported useful results, while an analysis of the sampling objective showed an inconsistency even in a two-symbol setting: replacing the first symbol independently can encourage prediction of the second marginal rather than the correct conditional relationship. It is not an automatic required upgrade. "}<a href={"https://arxiv.org/abs/1506.03099"}>{"Bengio et al."}</a>{", "}<a href={"https://arxiv.org/abs/1511.05101"}>{"Huszár's analysis, section 4"}</a>{"."}</Prose>

<Prose>What relationship does a replaced prefix teach? The following constructed joint distributions show exactly where contradictory pairs come from.</Prose>
<ScheduledPrefixFigure />
<Prose>{"The replacement can change the relationship being taught. Suppose the only true two-symbol sequences are 00 and 11, equally common. The second symbol should copy the first. If the first symbol is always replaced by an independent fair generated bit while the second target is kept, all four shown-prefix/target pairs become equally common. Half the examples now tell the model to contradict the shown bit. Predicting the target marginal 50/50 is optimal for that corrupted pair distribution. The figure isolates this limiting mechanism; partial replacement and real models require their own analysis."}</Prose>



<Prose>{"Sequence-level objectives can optimize a reward or risk attached to the complete answer. They introduce their own estimation, optimization and evaluation questions. Label smoothing changes target distributions at the loss; it does not itself train on the model's wrong prefixes. Keep these mechanisms distinct when interpreting an experiment."}</Prose>

<Prose>What if success belongs to the whole answer? Weight a complete-answer reward by that answer’s probability rather than differentiating an argmax string.</Prose>
<SeqRewardFigure />
<Prose>{"For an inspectable sequence-level objective, let a tiny model choose between two complete answers A and B with probabilities .6 and .4, and assign task rewards 0 and 1. Expected reward is .4. If B's probability is a sigmoid of a logit difference, increasing that difference has reward derivative .4×.6=.24. The gradient acts on probability assigned to complete outcomes, not on a differentiable argmax string. Large output spaces cannot usually be enumerated like these two routes: sampling-based estimators or restricted candidate approximations introduce variance or bias, and the reward must actually reflect the task. Label smoothing instead redistributes a per-token training target; it does not perform this expected-reward calculation."}</Prose>

</section>

<section data-lesson-teaching="" className="lesson-teaching-section">

<h3 className="lesson-teaching-section__title">Search costs, stopping and model deployment</h3>

<Prose>How should smoothing interact with a hard output mask? A forbidden class must receive no target mass; an ignored PAD position is a different kind of exclusion.</Prose>
<SeqSmoothingFigure />
<Prose>In the three-score illustration, two allowed logits are zero and one forbidden logit is negative infinity. Without smoothing, correct class 0 costs log 2. PyTorch’s ordinary smoothing of 0.1 mixes with a uniform distribution over all three classes: target masses are 0.933333, 0.033333, 0.033333. The impossible class gets nonzero mass, so loss is infinite. Restrict to the two allowed logits and remap target IDs before calling cross-entropy; masses become 0.95 and 0.05 and loss stays log 2. Do not form a manual zero-times-negative-infinity product, which can give NaN. This addition explains a modification; the recorded fits used smoothing zero.</Prose>
<CodeBlock language="python" filename="allowed-support-loss-snippet.py">{"# Snippet: adapt the loss in inflection-seq2seq.py.\n# logits: (N, T, 32); target: (N, T), PAD=0.\nallowed = torch.tensor([2, *range(6, 32)], device=logits.device)\nvalid = target.ne(0)\nremap = torch.full((32,), -1, dtype=torch.long, device=target.device)\nremap[allowed] = torch.arange(27, device=target.device)\nloss = torch.nn.functional.cross_entropy(\n    logits[valid][:, allowed], remap[target[valid]],\n    label_smoothing=0.1,\n)"}</CodeBlock>
<Prose>This downloadable block is a loss-adaptation snippet, not a standalone program. Its complete context is <a href={seq2seqAsset + "inflection-seq2seq.py"}>inflection-seq2seq.py</a>. Ignore whole PAD positions before smoothing; restrict class support inside each remaining position. Verify finite loss and finite gradients before using a different training objective (<a href="https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html">PyTorch cross-entropy documentation</a>).</Prose>
<Prose>{"With output vocabulary size "}<InlineMath>{"V"}</InlineMath>{", limit "}<InlineMath>{"T"}</InlineMath>{" and beam width "}<InlineMath>{"K"}</InlineMath>{", exhaustive enumeration has exponentially many possible paths, whereas beam expansion considers roughly "}<InlineMath>{"KVT"}</InlineMath>{" token extensions. This count omits the cost of each neural state update, embedding lookup, projection and sorting. It is an algorithmic description, not a measured latency claim."}</Prose>

<Prose>{"For raw log scores, extending a particular live path cannot improve its score. A completed candidate that already beats every live prefix cannot be beaten by descendants of those retained prefixes. This does not recover routes already pruned. Length-normalized scores need a compatible bound because their denominator changes; borrowing a raw-score stopping proof would be invalid."}</Prose>

<Prose>{"For example, a completed raw score −.8 beats a live prefix at −1.0; every descendant adds nonpositive log terms, so none of that prefix's completions can win. With the earlier length normalization at α=1, a length-1 prefix with raw score −1.0 has normalized score −1.0, but a length-5 completion with raw score −1.1 has normalized score −.66. It can overtake a completed candidate whose normalized score is −.8. A stopping bound must account for the allowed remaining lengths as well as possible log-score additions. This is why a stop rule and a scoring rule must be designed together."}</Prose>

<Prose>{"In a deployed model, record the exact tokenizer and vocabulary, source normalization, checkpoint revision, input limit, decoder-start and EOS IDs, padding side, precision/device, beam or sampling settings, score definition, output limit and termination reason. For multilingual models a language token is checkpoint-specific, not a universal string format. Keep model and tokenizer versions paired."}</Prose>

<Prose>{"An off-the-shelf "}<code>{"generate"}</code>{" API can manage these steps but does not remove their meaning. For example, current Transformers distinguishes beam stopping based on enough completed candidates, a heuristic, or a stricter search condition. Its length-penalty convention need not be the exact GNMT denominator used above. Inspect the actual configuration and documentation instead of assuming a familiar parameter name has one universal definition. "}<a href={"https://huggingface.co/docs/transformers/en/main_classes/text_generation"}>{"Transformers generation configuration"}</a>{"."}</Prose>

<Prose>{"Translation evaluation usually needs more than exact string match because multiple translations can be acceptable. BLEU measures a form of reference n-gram agreement with length handling; it is not a probability of truth. Report tokenization and metric configuration and include appropriate human/task checks. For short word forms here, exact match, character edits, accepted-reference policy and termination are easier to interpret. Speech and structured-output tasks need their own units and validity checks."}</Prose>

<Prose>{"An encoder–decoder can use source context and still invent unsupported content. A decoder-only model can also condition on an input prefix. Architecture family alone establishes neither faithfulness nor a universal speed ranking."}</Prose>

</section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice: build, diagnose and change the problem"}</H2>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Repair a shifted target"}</H3>

<Prose>{"For "}<code>{"try + past → tried"}</code>{", write the six decoder inputs and six target tokens. Which target position is lost if you train only on the five letters?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The first input starts generation, and the final output teaches termination. Each other input is the immediately preceding target."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Inputs: BOS,t,r,i,e,d. Targets: t,r,i,e,d,EOS. Omitting the sixth target removes the supervised instruction to stop after "}<code>{"d"}</code>{". EOS is not padding."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Compute a fresh likelihood and loss mask"}</H3>

<Prose>{"An answer "}<code>{"go"}</code>{" followed by EOS receives correct-token probabilities 0.8,0.5,0.25. Compute its sequence probability and mean token NLL. Two padded storage positions are appended. Should the valid-token mean change?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Multiply probabilities for the route; add their negative natural logarithms for the loss. Count EOS but do not count storage padding."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The probability is 0.1. The total NLL is "}<InlineMath>{"-\\log(0.1)=2.302585"}</InlineMath>{", so the three-token mean is 0.767528. Correctly ignored padding leaves it unchanged. Dividing the same loss sum by five instead gives 0.460517 and silently changes the scale."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Separate a source edit from an answer edit"}</H3>

<Prose>{"In teacher-forced training, change only the last character of a reference form. Must the encoder state change? Must the distribution predicting that changed target position change? What about the following decoder step?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Trace which array each component reads. A target being scored is not yet the previous token supplied to the decoder."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"The encoder state stays fixed because its source is unchanged. The distribution at the edited target position stays fixed if the preceding prefix is unchanged; the correct label and loss can change. The following step receives the edited character as input and can have a different state and distribution."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Make greedy lose, then make it win"}</H3>

<Prose>{"Use a new tree: first A 0.55/B 0.45; after A choose EOS 0.60/C 0.40; after B choose EOS 0.85/C 0.15; after C emit EOS with probability 1. Enumerate all complete paths and compare greedy with beam 2. Then change only P(EOS|A) to 0.90 and its complement accordingly."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The first token's probability alone does not rank complete paths. Keep each conditional row normalized after the edit."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Initially A,EOS=.33; A,C,EOS=.22; B,EOS=.3825; B,C,EOS=.0675. Greedy returns A,EOS, while beam 2 finds B,EOS. After the edit A,EOS=.495 and A,C,EOS=.055, so both return A,EOS. Improving search does not require it to return a different answer on every input."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Spot the leaked evaluation unit"}</H3>

<Prose>{"A dataset contains "}<code>{"worke→worked"}</code>{" in training and "}<code>{"work→worked"}</code>{" in development. A report says “all lemma strings are distinct, therefore this measures completely new lexical items.” What is wrong, and what did this lesson do?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A string identity check is useful but narrower than a claim about linguistic identity. Inspect related variants and shared forms."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Distinct spellings can represent closely related variants and share targets. The report overstates what its check proves. This extract conservatively links selected lemma spellings sharing a target, keeps the connected group in one partition and records the policy. It still does not claim to have solved all linguistic alias detection."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Explain a smaller loss but worse product"}</H3>

<Prose>{"Suppose model A has lower teacher-forced NLL, model B has better generated exact match, and a rule system beats both on this task. Which should you report? Does the discrepancy mean the NLL calculation is broken?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Each measurement asks a different question: probability on known-prefix targets, success of a generation procedure, and utility of a specific alternative."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Report all relevant measurements with the same data split and protocol. Lower NLL can improve average probabilities without changing argmax decisions in the same way, and generated prefixes can differ from reference prefixes. The discrepancy does not itself show a broken loss. Choose according to the deployment requirements and reliable evaluation; the rule system remains a legitimate candidate."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Investigate a cap without pretending the answer ended"}</H3>

<Prose>{"Use the saved seed 1 model on a development input. Set the generation limit to 3 tokens and compare with 16. Record the emitted tokens, EOS flag and log score. Explain why the three-token prefix can have a higher raw score but be an incomplete answer."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A prefix probability sums over possible future continuations; it has not yet paid the probability cost of choosing one of them and ending."}</Prose>

</details>

<details>

<summary>Solution and expected check</summary>

<Prose>{"On "}<code>{"emmove + past"}</code>{" the limit 3 output is "}<code>{"emo"}</code>{" with EOS=false and log score −0.833265. The limit 16 run continues to "}<code>{"emoves"}</code>{" and EOS in this saved model. A prefix can have a larger probability than any single complete extension. The cap flag must remain visible; do not relabel "}<code>{"emo"}</code>{" as a natural completed prediction."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Design the next controlled comparison"}</H3>

<Prose>{"You want to replace the single context with access to all encoder states. Name what you would keep fixed, what you would measure, and one reason an improvement would not prove that attention alone caused every difference."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Think about data groups, token support, training budget, parameter counts, decoding, seeds and what information has already been inspected."}</Prose>

</details>

<details>

<summary>Solution</summary>

<Prose>{"Keep the exact data/split, tokenization, target masking, training and evaluation definitions, decoding convention and declared seeds fixed where possible. Report parameter-count and compute changes, generated exact match, edits, termination and teacher-forced loss. Compare failures and source-length slices without selecting only favorable examples. Adding attention changes parameters and optimization as well as information access; a small controlled example is evidence for its protocol, not a universal causal ranking. The same development set remains development."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"11. References, another way to learn, and the next step"}</H2>

<ul><li><a href="https://docs.pytorch.org/docs/2.14/generated/torch.nn.GRU.html">PyTorch GRU</a> and <a href="https://docs.pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html">the official translation tutorial</a>. Compare the exact recurrent gate convention, state axes, source/target construction and the native encoder–decoder route. This lesson’s small grouped inflection experiment is separate from that tutorial’s translation data.</li><li><a href="https://d2l.ai/chapter_recurrent-modern/beam-search.html">D2L beam search</a> and <a href="https://huggingface.co/docs/transformers/en/main_classes/text_generation">Transformers generation configuration</a>. Compare the score and stop contracts rather than treating beam width, length penalty or early stopping as universal definitions.</li><li>{""}<a href={"https://d2l.ai/chapter_recurrent-modern/seq2seq.html"}>{"Dive into Deep Learning 1.0.3: encoder–decoder, seq2seq and beam search"}</a>{". A useful second implementation route, especially the shifted-target and masking sections. Read the beam chapter with its exact score convention in view; increasing the denominator of a negative log score does not universally penalize longer outputs."}</li><li>{""}<a href={"https://arxiv.org/abs/1409.3215"}>{"Sutskever, Vinyals and Le 2014"}</a>{". Read section 2 for the original model contract and sections 3.2–3.3 for search and source reversal. Its large translation experiment is historical evidence, not the setup of our small character model."}</li><li>{""}<a href={"https://arxiv.org/abs/1406.1078"}>{"Cho et al. 2014: RNN Encoder–Decoder"}</a>{". A complementary formulation in which source context enters the conditional decoder. Useful after you can trace our simpler initial-state interface."}</li><li>{""}<a href={"https://www.youtube.com/playlist?list=PLoROMvodv4rOaMFbaqxPDoLWjDaRAdP9D"}>{"Stanford CS224N Spring 2024 public lecture playlist"}</a>{", with "}<a href={"https://web.stanford.edu/class/cs224n/readings/cs224n-2019-notes06-NMT_seq2seq_attention.pdf"}>{"companion notes"}</a>{". A lecture-based alternative covering the motivation and the transition to attention. The basic encoder–decoder portions fit this lesson; return to the attention portion after the next one. The resource's age matters for “current standard” statements and framework code."}</li><li>{""}<a href={"https://unimorph.github.io/"}>{"UniMorph schema and data project"}</a>{", "}<a href={"https://aclanthology.org/2022.lrec-1.89/"}>{"UniMorph 4.0 paper"}</a>{", and "}<a href={"https://github.com/unimorph/eng/tree/66e0e9e8e2dcd196da081a25a48e5c1fe3d8b49b"}>{"the pinned English source"}</a>{". These explain what the real lexical records mean. The supplied extract retains source row numbers, filtering, grouping and CC BY-SA 3.0 attribution."}</li><li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html"}>{"PyTorch 2.14 CrossEntropyLoss"}</a>{". Use this to verify raw-logit input, class indices, "}<code>{"ignore_index"}</code>{" and reduction when adapting the program."}</li></ul>

<Prose>{"You can now connect source tokens, encoder state, decoder state, next-token probabilities, sequence loss and a complete generation procedure. Next, "}<a href={"/learn/path/full-curriculum/attention-mechanism-bahdanau-luong?module=deep-learning-fundamentals"}>{"Attention Mechanisms: Bahdanau and Luong"}</a>{" lets the decoder consult the sequence of encoder states at each output step. We will test that change on this same bounded task rather than assume it solves every failure."}</Prose></section>
 </SeqFittedProvider></SeqTreeProvider></SeqScalarProvider></div>,
};
