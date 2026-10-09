// Generated from the complete prepared manuscript by scripts/generate-xlstm-lesson.mjs.
import {Prose,H2,H3,CodeBlock} from '../../components/content';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {LessonIntro} from '../../components/lesson-labs/LessonElements.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {XOpeningFigure,OrdinaryCellFigure,ScalarWorkedFigure,ScalarMixingFigure,ScalarScaleFigure,GateLearningFigure,OuterProductFigure,MatrixWorkedFigure,SignedReadFigure,MatrixFloorFigure,CausalWorkedFigure,ChunkWorkedFigure,ReaderBlockFigure,DigitScanFigure,RowDataRolesFigure,RowMetricsFigure,WorkedDigitTraceFigure,VersionBlocksFigure,StateAccountingFigure,ApplicationFlowsFigure,MatrixDerivativeFigure,SigmoidVariantFigure,ForecastApplicationFigure,MixerApplicationFigure,EpisodeApplicationFigure,MatrixAccumulationFigure} from '../../components/lesson-labs/XlstmFlowFigures.jsx';
import {XlstmMemoryProvider,ScalarFlowLab,MatrixFlowLab,ChunkFlowLab} from '../../components/lesson-labs/XlstmFlowLabs.jsx';
import {XlstmReaderProvider,RowReaderFlow,RowCurveFlow} from '../../components/lesson-labs/XlstmReaderFlow.jsx';
import {XlstmProgram} from '../../components/lesson-labs/XlstmStudy.jsx';
export default {title:"xLSTM (Extended LSTM)",readTime:"~75 min read + investigations and practice",hasIntegratedGuide:true,content:()=> <div className="neural-lesson neural-lesson-neutral xlstm-lesson lesson-flow"><XlstmMemoryProvider><XlstmReaderProvider><LessonIntro prerequisites="Weighted sums, vectors and basic neural networks; the cell mechanics and state invariants are developed here." sections={[["1-start-with-an-ordinary-memory-cell","1. Start with an ordinary memory cell"],["2-slstm-as-a-weighted-ledger","2. sLSTM as a weighted ledger"],["3-stabilization-changes-the-representation-not-the-answer","3. Stabilization changes the representation, not the answer"],["4-mlstm-gives-memory-an-address-space","4. mLSTM gives memory an address space"],["5-one-matrix-operation-several-execution-schedules","5. One matrix operation, several execution schedules"],["6-put-the-cell-inside-a-trainable-network","6. Put the cell inside a trainable network"],["7-read-real-handwritten-digits-one-row-at-a-time","7. Read real handwritten digits one row at a time"],["8-distinguish-a-cell-family-from-a-published-model","8. Distinguish a cell family from a published model"],["9-useful-applications-beyond-a-text-decoder","9. Useful applications beyond a text decoder"],["10-diagnose-the-failure-at-the-right-level","10. Diagnose the failure at the right level"],["11-practice-transfer-the-mechanism","11. Practice: transfer the mechanism"],["12-references-and-another-way-to-learn","12. References and another way to learn"]]}>Decide what a recurrent memory stores, how a query reads it, and which state a chunk must preserve.</LessonIntro>
<Prose>{"A handwritten digit is a small grid of brightness measurements. Imagine showing a model one horizontal row at a time, then taking that row away. After the eighth row, it must decide which digit it saw. How can it carry what it learned from earlier rows without storing every row separately?"}</Prose>

<Prose>{"The drawing follows one real image into a row, a carried numerical state and a final decision. Cyan marks supplied inputs; violet marks computed values; amber marks learned parameters. Grey arrows follow the calculation. Numeric grids use amber for positive entries, blue for negative entries and neutral grey for zero."}</Prose>

<XOpeningFigure />

<Prose>{"The image has eight rows of eight measurements. A row becomes eight numbers between zero and one by dividing the original counts by sixteen. The "}<strong>{"state"}</strong>{" is the set of numbers carried from one row to the next. It summarizes processed rows; it is not a copy of the whole image. At the final row, a learned classifier converts the resulting representation into ten scores, one for each digit. The largest score selects the class. The true digit label is used to teach or assess the model, never supplied as an input pixel."}</Prose>

<Prose>{"In "}<a href={"/learn/path/full-curriculum/modern-hopfield-networks?module=deep-learning-fundamentals"}>{"Modern Hopfield Networks"}</a>{", a query could inspect an explicit bank of stored patterns. Here we combine arriving information into one state. The previous "}<a href={"/learn/path/full-curriculum/rnns-lstms-grus?module=deep-learning-fundamentals"}>{"RNNs, LSTMs & GRUs"}</a>{" lesson taught how a recurrent cell updates a state. We briefly redraw its ordinary LSTM mechanism, then develop two different extensions and build a complete trainable reader."}</Prose>

<Prose>{""}<strong>{"xLSTM"}</strong>{" means *extended long short-term memory*. Its scalar extension keeps a weighted content total and its evidence mass. Its matrix extension stores associations that a query can address. We will develop those words using concrete numbers before using their equations. Keep the digit reader as the motivating task; the hand-chosen numbers below isolate individual memory operations before their gates are learned from pixels."}</Prose>

<Prose opening="route">{"This lesson starts with the cell and its gates, follows weighted scalar evidence and addressed matrix memory, then builds and inspects a complete trainable image reader. Deeper visible branches develop stability, gradients, parallel schedules and current model variants. Each investigation keeps your edits as the next question exposes another part of the same mechanism."}</Prose>

<H2>{"1. Start with an ordinary memory cell"}</H2>

<Prose>{"Start with the familiar cell: how much old content survives, and how much new content joins it? The two numerical paths meet before the exposed output is computed."}</Prose>

<OrdinaryCellFigure />

<Prose>{"The old-content path retains half of 0.8, leaving 0.4. The new-candidate path writes a quarter of −0.4, contributing −0.1. Their sum is the new content, 0.3. The separate output path first squashes that content with tanh, then scales it with the output gate. Thus the content carried forward and the output exposed to the rest of the network are different numbers. The input row and previous exposed output enter learned gate projections; their arrows do not mean that a hand-set gate is itself a learned parameter."}</Prose>

<Prose>{"A recurrent model receives an input vector "}<code>{"x_t"}</code>{" and a previous state. It produces a new state and an output. The index "}<code>{"t"}</code>{" can mean a text token, a sensor sample, or, in our experiment, an image row. It need not mean one second."}</Prose>

<Prose>{"A classical LSTM has a cell vector "}<code>{"c_t"}</code>{", which carries information, and a hidden vector "}<code>{"h_t"}</code>{", which is exposed to the surrounding network and used to compute later gates. Each learned gate projection has its own input weights W, recurrent weights R and bias b: it forms Wx + Rh + b. The drawing shows the four resulting fields. A "}<strong>{"sigmoid"}</strong>{", written σ, turns a real score into a number between zero and one; "}<strong>{"tanh"}</strong>{" turns a real score into a number between −1 and +1. The candidate uses tanh; the three gates use sigmoids. For one coordinate, suppressing its index:"}</Prose>

<div className="neural-equation"><MathBlock>{"c_t=f_t c_{t-1}+i_t z_t,\\qquad h_t=o_t\\tanh(c_t)."}</MathBlock></div>

<Prose>{"The forget gate scales old cell content; the input gate scales the candidate; the output gate scales the exposed hidden signal. This multiplication and addition mixes information numerically. A forget gate does not remove an entire old token from a stored list."}</Prose>

<Prose>{"These gates are learned from the task loss. We hand-set them first so that the mechanism is visible. Later, a neural network will produce them from pixels and state."}</Prose>

<Prose>{"A sigmoid can make a sharp decision: a write gate near one and a forget gate near zero can replace old information strongly. xLSTM is therefore not motivated by an inability of sigmoids to overwrite anything. The useful question is more specific: "}<strong>{"which parameterization of write weights, state normalization and associative storage makes a desired memory operation easier to learn and scale?"}</strong>{""}</Prose>

<H2>{"2. sLSTM as a weighted ledger"}</H2>

<Prose>{"The ordinary cell mixes content. What if we also track how much evidence supports that content? Follow three writes and their surviving weights."}</Prose>

<ScalarWorkedFigure />

<Prose>{"Each observation has a candidate and a positive write weight. Retention shrinks earlier contributions before the next write joins them. Content can be negative because a candidate can be negative; evidence mass stays positive. At the third observation the surviving weights are 0.25, 1.5 and 9. Dividing their signed weighted content by their total mass gives the estimate; a separate output gate controls how much of that estimate is exposed."}</Prose>

<Prose>{"Imagine that each observation contributes a signed estimate and a nonnegative amount of evidence. Keep two totals: a weighted content total "}<code>{"c"}</code>{", and the total weight "}<code>{"n"}</code>{". Their ratio is the current estimate. Forgetting scales both totals; a new write adds to both."}</Prose>

<Prose>{"For one scalar memory, begin with "}<code>{"c_0=n_0=0"}</code>{" and define"}</Prose>

<div className="neural-equation"><MathBlock>{"i_t=e^{a_t},\\qquad f_t=\\sigma(b_t),\\qquad\nc_t=f_t c_{t-1}+i_t z_t,\\qquad\nn_t=f_t n_{t-1}+i_t,\\qquad\nh_t=o_t\\frac{c_t}{n_t}."}</MathBlock></div>

<Prose>{"Here "}<code>{"a_t"}</code>{" is the write "}<strong>{"log-weight"}</strong>{", "}<code>{"b_t"}</code>{" is a forget preactivation, and "}<code>{"o_t"}</code>{" is an output gate. The original family also considers exponential forget gates. We use sigmoid forgetting in the worked core and executable model. It makes the raw retention factor lie between zero and one."}</Prose>

<Prose>{"The write weight can be larger than one. What matters to the normalized estimate is its size relative to the surviving old mass. With a tanh candidate and a sigmoid output gate, this scalar output remains bounded by the largest magnitude among the candidates written so far. Its internal totals need not be small."}</Prose>

<H3>{"Work through the same three observations"}</H3>

<Prose>{"Use candidates "}<code>{"[0.2, −0.6, 0.8]"}</code>{", write weights "}<code>{"[1, 3, 9]"}</code>{", retention "}<code>{"0.5"}</code>{" on every step, and output gate "}<code>{"0.75"}</code>{"."}</Prose>

<NeuralTable caption={"Work through the same three observations"} headers={[<>{"Step"}</>,<>{"Surviving old content"}</>,<>{"New content"}</>,<>{""}<code>{"c_t"}</code>{""}</>,<>{""}<code>{"n_t"}</code>{""}</>,<>{""}<code>{"h_t"}</code>{""}</>]} rows={[[<>{"1"}</>,<>{"0"}</>,<>{"0.2"}</>,<>{"0.2"}</>,<>{"1"}</>,<>{"0.150000"}</>],[<>{"2"}</>,<>{"0.1"}</>,<>{"−1.8"}</>,<>{"−1.7"}</>,<>{"3.5"}</>,<>{"−0.364286"}</>],[<>{"3"}</>,<>{"−0.85"}</>,<>{"7.2"}</>,<>{"6.35"}</>,<>{"10.75"}</>,<>{"0.443023"}</>]]} />

<Prose>{"At step three, the surviving weights on the original candidates are "}<code>{"[0.25, 1.5, 9]"}</code>{". Their sum is "}<code>{"10.75"}</code>{". The latest candidate supplies about "}<code>{"83.72%"}</code>{" of that mass. The estimate before the output gate is "}<code>{"6.35/10.75 ≈ 0.590698"}</code>{", between the smallest and largest candidates. The output gate then scales it to "}<code>{"0.443023"}</code>{"."}</Prose>

<Prose>{"This picture explains revision. A large new write can dominate surviving evidence without requiring the raw candidate itself to be large. It also explains interference: one scalar remembers a weighted aggregate, not a recoverable list of all individual observations."}</Prose>

<Prose>{"Expanding the recurrence makes the history explicit:"}</Prose>

<div className="neural-equation"><MathBlock>{"w_{t,j}=i_j\\prod_{\\ell=j+1}^{t}f_\\ell,\\qquad\n\\frac{c_t}{n_t}=\\frac{\\sum_{j=1}^{t}w_{t,j}z_j}{\\sum_{j=1}^{t}w_{t,j}}."}</MathBlock></div>

<Prose>{"The empty product for "}<code>{"j=t"}</code>{" equals one. A new write is not immediately multiplied by its own step's forget gate; that gate affects what was already stored. The nonnegative normalized weights sum to one. This convex-average interpretation applies to this scalar recurrence with empty initialization; it will not transfer unchanged to the signed matrix read."}</Prose>

<Prose>{"Change one candidate or its evidence weight and follow the retained contributions. Selecting an observation edits that complete record; it does not reset the history."}</Prose>

<ScalarFlowLab part="evidence" />

<Prose>{"The selected observation also has a retention factor; the output gate controls exposure after the estimate is formed. These controls use the same history you just edited."}</Prose>

<ScalarFlowLab part="exposure" />

<H3>{"Where learning enters"}</H3>

<Prose>{"We can calculate one coordinate now. How does the actual model choose the next write for many coordinates? Trace hidden outputs through learned connections into gates."}</Prose>

<ScalarMixingFigure />

<Prose>{"A channel is one numerical coordinate. Input coordinates and the previous hidden coordinates enter weighted sums that produce candidate and gate scores. Connections inside one head can cross between channels. A head is a group of channels with its own recurrent mixing; the diagram marks where another head has no cross-head recurrent connection. The later content and mass update remains coordinatewise. This distinguishes mixing while producing gates from multiplying already-produced gate values."}</Prose>

<Prose>{"For a vector of channels, each gate has input and recurrent weight matrices. Pointwise multiplication in the later state update does not imply that the whole cell treats every feature independently: the gate projections already mixed hidden coordinates inside their head."}</Prose>

<Prose>{"The next gates depend on a hidden state that depends on previous gates. That dependency matters when we discuss parallel training. It also enables input-conditioned state transitions beyond a fixed decay of past input projections."}</Prose>

<H2>{"3. Stabilization changes the representation, not the answer"}</H2>

<Prose>{"Those weighted totals may grow very large. Can we change their numerical scale while preserving their ratio? Both totals must move together."}</Prose>

<ScalarScaleFigure />

<Prose>{"The two rails carry the same content and mass under different units. At step two both raw totals are divided by three; at step three both are divided by nine. The ratio and exposed output remain unchanged. The scale has to be stored too, because the next old contribution and new write must be expressed in the same units. A log-scale records the multiplier without forming a huge exponential."}</Prose>

<Prose>{"Exponential write weights are convenient mathematically but dangerous to form directly when their log-weights are very large. We can preserve the answer while storing rescaled totals."}</Prose>

<Prose>{"Let "}<code>{"c'_t=e^(−m_t)c_t"}</code>{" and "}<code>{"n'_t=e^(−m_t)n_t"}</code>{". The shared scale cancels in "}<code>{"c'_t/n'_t"}</code>{". Choose a new log-scale"}</Prose>

<div className="neural-equation"><MathBlock>{"m_t=\\max\\{\\log f_t+m_{t-1},\\ a_t\\},"}</MathBlock></div>

<Prose>{"then compute"}</Prose>

<div className="neural-equation"><MathBlock>{"f'_t=e^{\\log f_t+m_{t-1}-m_t},\\qquad\ni'_t=e^{a_t-m_t},"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"c'_t=f'_t c'_{t-1}+i'_t z_t,\\qquad\nn'_t=f'_t n'_{t-1}+i'_t,\\qquad\nh_t=o_t c'_t/n'_t."}</MathBlock></div>

<Prose>{"Each exponent used for a stabilized gate is nonpositive. At least one of the two stabilized gate factors is one, except at limiting or invalid inputs. This avoids constructing a huge common multiplier. A stabilized write equal to one does not mean that the underlying raw write was one or that the model secretly replaced exponential gating with sigmoid gating."}</Prose>

<Prose>{"For the three-step example, the stabilized states are:"}</Prose>

<NeuralTable caption={"3. Stabilization changes the representation, not the answer"} headers={[<>{"Step"}</>,<>{""}<code>{"m_t"}</code>{""}</>,<>{""}<code>{"i'_t"}</code>{""}</>,<>{""}<code>{"f'_t"}</code>{""}</>,<>{""}<code>{"c'_t"}</code>{""}</>,<>{""}<code>{"n'_t"}</code>{""}</>,<>{"Output"}</>]} rows={[[<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0.5"}</>,<>{"0.2"}</>,<>{"1"}</>,<>{"0.150000"}</>],[<>{"2"}</>,<>{""}<code>{"ln 3"}</code>{""}</>,<>{"1"}</>,<>{""}<code>{"1/6"}</code>{""}</>,<>{"−0.566667"}</>,<>{"1.166667"}</>,<>{"−0.364286"}</>],[<>{"3"}</>,<>{""}<code>{"ln 9"}</code>{""}</>,<>{"1"}</>,<>{""}<code>{"1/6"}</code>{""}</>,<>{"0.705556"}</>,<>{"1.194444"}</>,<>{"0.443023"}</>]]} />

<Prose>{"At step two, divide both raw totals by three. At step three, divide both raw totals by nine. Comparing "}<code>{"i'_2"}</code>{" and "}<code>{"i'_3"}</code>{" directly would compare numbers expressed under different scales. Their equality does not erase the original write-weight ratio."}</Prose>

<Prose>{"The max state need not increase monotonically: sufficiently strong forgetting and a smaller new write can lower the relevant scale. It must travel with the memory across a sequence boundary. Resetting only "}<code>{"m"}</code>{", or only "}<code>{"n"}</code>{", produces a different state."}</Prose>

<Prose>{"Starting with "}<code>{"n_0=1"}</code>{" would insert a zero-valued unit of prior mass if "}<code>{"c_0=0"}</code>{". That can be an intentional model, but it is not the empty ledger. With finite positive first write, the empty ledger acquires a positive denominator immediately. An implementation still needs a defined response to nonfinite inputs; adding arbitrary epsilon to every formula is not a substitute for choosing the intended operator."}</Prose>

<H3>{"Change the evidence in the same memory"}</H3>

<Prose>{"As a second worked comparison, use candidates "}<code>{"[-0.4, 0.7, −0.2]"}</code>{", weights "}<code>{"[2,1,5]"}</code>{", retention "}<code>{"[0.8,0.6,0.4]"}</code>{" and output gate "}<code>{"0.8"}</code>{". Compare the final output before and after weakening the last write from five to "}<code>{"0.5"}</code>{"."}</Prose>

<Prose>{"The original final output is about "}<code>{"−0.124082"}</code>{"; after that edit it is about "}<code>{"−0.006957"}</code>{". Earlier positive content has more influence. Now set every candidate to "}<code>{"0.6"}</code>{". Changing positive write weights and retention does not change the normalized estimate; with output gate "}<code>{"0.8"}</code>{", every output is "}<code>{"0.48"}</code>{". This is a useful null experiment: the weights changed, but all the available evidence agreed."}</Prose>

<Prose>{"Return to the history you edited in the scalar investigations. The next view changes only its numerical representation: a common shift of every write log-weight rescales all raw weights together, leaving their normalized ratio unchanged. The displayed raw reference is omitted when forming its exponential would overflow; the stabilized answer remains inspectable."}</Prose>

<ScalarFlowLab part="scale" />

<Prose>{"The scale shift null is a property of this normalized scalar read from an empty ledger. It is not a blanket invariance of every downstream architecture or of the matrix read's fixed floor."}</Prose>

<Prose>{"How does the history change when a complete observation moves? Add, remove or reverse records together with their gates; these are operations on your current values."}</Prose>

<ScalarFlowLab part="history" />

<Prose>{"If every candidate agrees, positive evidence weights cannot change that estimate. Closing only the output gate suppresses exposure without erasing content."}</Prose>

<ScalarFlowLab part="null" />

<Prose>{"Keep a reference before changing more than one value; the pin retains every entered candidate, gate and common shift."}</Prose>

<ScalarFlowLab part="compare" />

<H3>{"A learned write, one gradient step at a time"}</H3>

<Prose>{"Rescaling preserves an answer. Learning changes it deliberately: how does the error tell a write weight which way to move? We now isolate a new two-candidate example, −0.2 and +0.8."}</Prose>

<GateLearningFigure />

<Prose>{"The old −0.2 candidate retains mass 0.5. The new +0.8 candidate receives write weight exp(θ). The quotient produces the prediction, then half squared error compares it with target 0.7. Orange dashed arrows trace the derivative backwards through those same operations. Increasing the newer weight moves the estimate toward +0.8. The loss curve shows the checked gradient step, not a newly trained digit model."}</Prose>

<Prose>{"Suppose the two candidates are "}<code>{"−0.2"}</code>{" and "}<code>{"0.8"}</code>{", the first write is one, retention at step two is "}<code>{"0.5"}</code>{", and the second write is "}<code>{"e^θ"}</code>{". Expose the normalized output directly and ask it to approach target "}<code>{"0.7"}</code>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"y(\\theta)=\\frac{-0.1+0.8e^\\theta}{0.5+e^\\theta},\\qquad\nL=\\tfrac12(y-0.7)^2."}</MathBlock></div>

<Prose>{"At "}<code>{"θ=0"}</code>{", "}<code>{"y=0.466667"}</code>{". Differentiating the quotient gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{dy}{d\\theta}=\\frac{0.5e^\\theta}{(0.5+e^\\theta)^2},\\qquad\n\\frac{dL}{d\\theta}=(y-0.7)\\frac{dy}{d\\theta}\\approx-0.051852."}</MathBlock></div>

<Prose>{"A gradient-descent step with learning rate "}<code>{"0.5"}</code>{" raises "}<code>{"θ"}</code>{" to "}<code>{"0.025926"}</code>{", raises the prediction to "}<code>{"0.472403"}</code>{", and lowers the loss from "}<code>{"0.027222"}</code>{" to "}<code>{"0.025900"}</code>{". The target has encouraged a stronger write of the second candidate. In a trained network the same chain rule reaches the matrices that produced the candidates and gates. Stabilization should preserve that calculation; it does not replace optimization or gradient clipping."}</Prose>

<H2>{"4. mLSTM gives memory an address space"}</H2>

<Prose>{"One scalar blends every observation into the same total. How can different addresses leave different associations? Multiply a key vector by a value vector to draw a matrix of products."}</Prose>

<OuterProductFigure />

<Prose>{"The key is the address description: its two coordinates label rows. The value is the content: its two coordinates label columns. Each cell multiplies its row key by its column value. The resulting four numbers are an outer product. Retention scales the old matrix; the write weight scales this new product; corresponding cells then add. The stored normalizer follows the same key/retention/write path without multiplying a value. Our key-by-value storage is the transpose of the original paper’s value-by-key notation, with the same operation."}</Prose>

<Prose>{"In a learned model, separate projections produce the key and value from the current input. A third projected vector, the "}<strong>{"query"}</strong>{", asks for values whose keys align with it. First inspect the write; then the next drawing will trace a query through the resulting memory."}</Prose>

<Prose>{"Use one matrix head. Keys and queries have "}<code>{"d_k"}</code>{" coordinates; values have "}<code>{"d_v"}</code>{". Throughout this lesson, "}<code>{"C"}</code>{" has "}<strong>{"key rows and value columns"}</strong>{", shape "}<code>{"d_k × d_v"}</code>{". Writing a key and value forms their outer product:"}</Prose>

<div className="neural-equation"><MathBlock>{"C_t=f_t C_{t-1}+i_t k_t v_t^\\top,\\qquad\nn_t=f_t n_{t-1}+i_t k_t."}</MathBlock></div>

<Prose>{"The outer product contains one product for every key-coordinate/value-coordinate pair. For key "}<code>{"[1,0]"}</code>{" and value "}<code>{"[2,−1]"}</code>{", it is "}<code>{"[[2,−1],[0,0]]"}</code>{". The write changes the first key row. For a general key, it spreads information across rows."}</Prose>

<Prose>{"Change the address coordinates and inspect which outer-product rows change. The value and all earlier writes stay as you entered them."}</Prose>

<MatrixFlowLab part="keys" />

<Prose>{"Now change its content while holding the same address. The two content coordinates label the matrix columns."}</Prose>

<MatrixFlowLab part="values" />

<H3>{"Three writes, then read an earlier address"}</H3>

<Prose>{"Now use that matrix for three writes, then ask for the first address again. Each grid is the actual state after its labelled step."}</Prose>

<MatrixWorkedFigure />

<Prose>{"The first key [1,0] writes [2,−1] into key row one. The second key [0,1] writes [0,3] into row two while retaining half of row one. The third key [1,0] writes twice [4,1] into row one after another half-retention. A query [1,0] selects row one in the matrix read; the normalizer follows the matching address accumulation. The picture displays the numerator vector, signed mass, one denominator and resulting read separately."}</Prose>

<Prose>{"Before output gating and the surrounding normalization layer, read"}</Prose>

<div className="neural-equation"><MathBlock>{"r_t=\\frac{C_t^\\top q_t}{\\max\\{|n_t^\\top q_t|,1\\}}."}</MathBlock></div>

<Prose>{"The numerator has "}<code>{"d_v"}</code>{" coordinates. The dot product in the denominator is a scalar. In a learned model we scale a projected query by "}<code>{"1/√d_k"}</code>{" before this formula, exactly once. The hand examples use already-scaled queries so that the arithmetic is transparent."}</Prose>

<Prose>{"Why does a query retrieve anything? Substituting the accumulated writes gives"}</Prose>

<div className="neural-equation"><MathBlock>{"C_t^\\top q_t=\\sum_{j\\le t}w_{t,j}v_j(k_j^\\top q_t)."}</MathBlock></div>

<Prose>{"The alignment "}<code>{"k_j^T q_t"}</code>{" multiplies the contribution of the associated value. An orthogonal key contributes zero to that query's numerator. Similar keys can interfere because their values contribute together. The matrix keeps an aggregate of outer products, not a slot for every original item."}</Prose>

<Prose>{"Start empty; let every retention factor be "}<code>{"0.5"}</code>{"."}</Prose>

<NeuralTable caption={"Three writes, then read an earlier address"} headers={[<>{"Step"}</>,<>{"Key"}</>,<>{"Value"}</>,<>{"Write weight"}</>,<>{"Query"}</>]} rows={[[<>{"1"}</>,<>{""}<code>{"[1,0]"}</code>{""}</>,<>{""}<code>{"[2,−1]"}</code>{""}</>,<>{"1"}</>,<>{""}<code>{"[1,0]"}</code>{""}</>],[<>{"2"}</>,<>{""}<code>{"[0,1]"}</code>{""}</>,<>{""}<code>{"[0,3]"}</code>{""}</>,<>{"1"}</>,<>{""}<code>{"[0,1]"}</code>{""}</>],[<>{"3"}</>,<>{""}<code>{"[1,0]"}</code>{""}</>,<>{""}<code>{"[4,1]"}</code>{""}</>,<>{"2"}</>,<>{""}<code>{"[1,0]"}</code>{""}</>]]} />

<MatrixAccumulationFigure />

<Prose>{"At the later third write the drawing retains half of step two’s grid, adds twice the [1,0]⊗[4,1] product and obtains the final grid. First check the earlier reads so that this accumulation has a history."}</Prose>

<Prose>{"The first read returns "}<code>{"[2,−1]"}</code>{". The second matrix is "}<code>{"[[1,−0.5],[0,3]]"}</code>{", with "}<code>{"n=[0.5,1]"}</code>{". Query "}<code>{"[0,1]"}</code>{" selects its second key row and returns "}<code>{"[0,3]"}</code>{"."}</Prose>

<Prose>{"At step three,"}</Prose>

<div className="neural-equation"><MathBlock>{"C_3=\\begin{bmatrix}8.5&1.75\\\\0&1.5\\end{bmatrix},\\qquad\nn_3=\\begin{bmatrix}2.25\\\\0.5\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The query reads the first row: numerator "}<code>{"[8.5,1.75]"}</code>{", denominator "}<code>{"2.25"}</code>{", output approximately "}<code>{"[3.777778,0.777778]"}</code>{". The newer "}<code>{"[4,1]"}</code>{" dominates, but the older value has not been deleted. Its surviving weight is "}<code>{"0.25"}</code>{"; the latest weight is two."}</Prose>

<Prose>{"This is an additive association update. It is not a dictionary assignment, and it is not a delta-rule update that explicitly subtracts the current prediction at an address before writing a correction. One scalar forget gate per head also scales every old association in that head together. It cannot retain one old key and erase another at that same step merely by changing this scalar."}</Prose>

<H3>{"Signed retrieval is not softmax attention"}</H3>

<Prose>{"The scalar estimate was a positive-weight average. Does a signed address match still obey that bound? Change to two opposite keys so their normalizing masses cancel."}</Prose>

<SignedReadFigure />

<Prose>{"Query +1 aligns positively with key +1 and negatively with key −1. The signed content contributions are 2 and +1, because the second value is −1. They sum to 3. The signed normalizing contributions are +1 and −1, which sum to zero. The denominator floor is one, so the returned value is 3, outside the written value interval [−1,2]. Address coefficients are not probabilities."}</Prose>

<Prose>{"A negative dot product reverses a value’s contribution. The signed coefficients in the drawing cannot be called attention probabilities: they neither stay nonnegative nor normalize to a sum of one."}</Prose>

<Prose>{"The denominator prevents division by a signed sum near zero, but it does not make the read universally bounded by the stored value magnitudes. An outer-product memory is sometimes called a covariance-style memory; it is not automatically an empirical centered covariance matrix. Learned projections and biases matter."}</Prose>

<H3>{"The stabilization detail that changes the answer"}</H3>

<Prose>{"We already rescaled a scalar quotient. Why does a matrix read need one extra correction? Switch explicitly to one write with key0.25, value4, query0.5 and write log-weight2. Draw its fixed denominator floor under the same change of units."}</Prose>

<MatrixFloorFigure />

<Prose>{"In this isolated one-write example, the raw numerator is 3.694528 and the signed mass is 0.923632. The raw unit floor controls the denominator. Dividing the stored numerator and mass by exp(2) gives 0.5 and 0.125; the floor must also become exp(−2), about 0.135335. The correct read stays 3.694528. Leaving the floor at one instead returns 0.5. This is a changed operator, not rounding error."}</Prose>

<Prose>{"For the exponential variant, use the same "}<code>{"m"}</code>{", "}<code>{"i'"}</code>{" and "}<code>{"f'"}</code>{" idea as before, storing "}<code>{"C'=e^(−m)C"}</code>{" and "}<code>{"n'=e^(−m)n"}</code>{". Now the correct read is"}</Prose>

<div className="neural-equation"><MathBlock>{"r=\\frac{C'^\\top q}{\\max\\{|n'^\\top q|,e^{-m}\\}}."}</MathBlock></div>

<Prose>{"Both the variable normalizer and the fixed raw floor must be represented in the new scale. Keeping a floor of one after rescaling changes the operator."}</Prose>

<Prose>{"This is why two implementations agreeing with each other is not sufficient if both copied the same formula error. Compare each to the intended mathematical operator on a case where the floor actually controls the answer."}</Prose>

<H3>{"Deeper branch: which part of the read receives the gradient?"}</H3>

<Prose>{"The matrix floor changed the forward answer. How does it change learning? Keep the same read circuit and send a small loss change backwards through it. We explicitly switch to C=[[2,−1],[0.5,3]], n=[0.5,0.2] and floor one so that both branches can be worked with small numbers."}</Prose>

<MatrixDerivativeFigure />

<Prose>{"The numerator is the vector u=Cᵀq. The signed mass is s=nᵀq. The denominator is d=max(|s|,α), where α is the positive floor, and the read is r=u/d. The "}<strong>{"upstream derivative"}</strong>{" p tells us how much the loss changes per coordinate of r; use p=[1,−0.5] in the worked example. It could come from a classifier or another layer. We are differentiating this read, not inventing a different learning objective."}</Prose>

<Prose>{"First divide p by d to get the numerator derivative. Then increasing d while holding u fixed changes the read by −u/d². This gives the two reverse rails:"}</Prose>

<div className="neural-equation"><MathBlock>{"g_u=p/d,\\qquad g_d=-p^Tu/d^2."}</MathBlock></div>

<Prose>{"If |s| is smaller than the floor, a small mass change leaves the denominator unchanged. Consequently g_s=0; the read still depends on the query through its numerator. With q=[0.2,0.1], s=0.12, d=1 and r=[0.45,0.1]. The query derivative is [2.5,−1]. A zero denominator-path derivative does "}<strong>{"not"}</strong>{" mean a zero query derivative."}</Prose>

<Prose>{"If |s| exceeds the floor, the derivative of the denominator is the sign of s. Then g_s=g_d sign(s). With q=[2,1], s=1.2 and r=[3.75,0.833333…]. Numerator and denominator paths both contribute to the query derivative [0.694444… ,−1.388889…]. Negative mass has a different sign on the denominator path; the implementation checks it separately."}</Prose>

<Prose>{"The remaining derivatives follow the same key-row/value-column picture:"}</Prose>

<div className="neural-equation"><MathBlock>{"g_C=qg_u^T,\\qquad g_n=qg_s,\\qquad g_q=Cg_u+ng_s."}</MathBlock></div>

<Prose>{"The first formula distributes each query coordinate across a row of the matrix. The second sends the scalar mass derivative back through the normalizer vector. The last adds the query's numerator and denominator routes. When the floor is active, g_α=g_d; otherwise it is zero. For a stored floor α=exp(−m), its own derivative with respect to m is −αg_α, before adding any other paths through a shared scale representation."}</Prose>

<Prose>{"At |s|=α the maximum has a branch tie. A unique classical derivative is not guaranteed. Automatic-differentiation tools choose a convention for that operation; a symmetric finite difference at the tie cannot certify both one-sided derivatives. The program checks ordinary points in both branches and explicitly rejects the tie as a unique-gradient case."}</Prose>

<CodeBlock language={"python"}>{"numerator_gradient = upstream / denominator\ndenominator_gradient = -float(upstream @ numerator) / denominator**2\nmass_gradient = (denominator_gradient * np.sign(mass)\n                 if abs(mass) > floor else 0.0)\nquery_gradient = cell @ numerator_gradient + normalizer * mass_gradient"}</CodeBlock>

<Prose>{""}<a href={"/learn-code/xlstm-extended-lstm/matrix_read_gradients.py"}>{"Read and download matrix_read_gradients.py"}</a>{". Its complete NumPy vector-Jacobian product computes all C/n/q/floor derivatives without calling autograd. The comparison route constructs the identical Torch quotient and calls backward. Twenty-seven independent coordinate perturbations cover floor-active, positive-alignment-active and negative-alignment-active cases, alongside the tie check. No recurrent fit or pretrained model is needed. Change the downstream derivative vector too: it changes which returned value coordinates the loss cares about, not which branch the forward denominator chooses."}</Prose>

<H3>{"Change an address without changing its value"}</H3>

<Prose>{"Return to the matrix records you edited beside the outer-product drawing. Reverse the last key while keeping its value unchanged and inspect the resulting read. Inspect both the numerator and the normalizer before interpreting the final read. You can edit a key, a value, a query or a write weight independently."}</Prose>

<Prose>{"Then zero every value. Reads must be zero although keys, normalizer and gate history can remain nonzero. Restore the values and try a zero query: its numerator is zero and its denominator is the floor. These null cases distinguish stored address geometry from the information it points to."}</Prose>

<MatrixFlowLab part="query" />

<Prose>{"How do write strength and retention affect those same addresses? Adjust just those two factors; raw and stabilized reads are compared without changing the operator."}</Prose>

<MatrixFlowLab part="gates" />

<Prose>{"Move whole records rather than separating keys from their values. The exact table keeps every entered coordinate inspectable."}</Prose>

<MatrixFlowLab part="history" />

<Prose>{"Test the signed address and zero-numerator cases using current edits. Negating the selected key leaves its value intact; zeroing its query makes that read zero; zeroing all values removes every content contribution."}</Prose>

<MatrixFlowLab part="null" />

<Prose>{"Save the entire matrix history, then compare changed final reads with that reference."}</Prose>

<MatrixFlowLab part="compare" />

<H2>{"5. One matrix operation, several execution schedules"}</H2>

<Prose>{"A query reads all surviving writes. Can we arrange those same coefficients in a time-by-time grid? We now use a seven-record fixture with three key coordinates and two value coordinates."}</Prose>

<CausalWorkedFigure />

<Prose>{"Rows label query time; columns label write time. Crossed-out future cells contribute nothing. A visible coefficient multiplies the current query/key alignment by the write weight and only the retention factors after that write. The diagonal uses an empty retention product of one: a write is not forgotten by its own step. Summing each row’s signed contributions produces the recurrent answer when initialization is empty."}</Prose>

<Prose>{""}<strong>{"Deeper branch."}</strong>{" You can proceed to the digit reader after understanding that a memory must be carried across chunks. This derivation explains why matrix-memory training can use large parallel operations while incremental inference updates a state."}</Prose>

<Prose>{"For a head whose keys, values, queries and gates have already been computed from the layer input, define the causal write influence"}</Prose>

<div className="neural-equation"><MathBlock>{"g_{t,j}=\\begin{cases}i_j\\prod_{\\ell=j+1}^{t}f_\\ell,&j\\le t,\\\\0,&j>t.\\end{cases}"}</MathBlock></div>

<Prose>{"Collect queries, keys and values into row matrices "}<code>{"Q"}</code>{", "}<code>{"K"}</code>{", "}<code>{"V"}</code>{". If "}<code>{"A=(QK^T)⊙G"}</code>{", row "}<code>{"t"}</code>{" of "}<code>{"AV"}</code>{" is the raw read numerator. The raw denominator for that row is "}<code>{"max(|Σ_j A_tj|,1)"}</code>{". A triangular causal mask prevents future writes from contributing. This is a dense sequence formulation of the same recurrence, not ordinary row-softmax attention."}</Prose>

<Prose>{"For stability, form logarithmic influences with prefix sums of log retention:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\log g_{t,j}=a_j+F_t-F_j,\\qquad F_t=\\sum_{\\ell=1}^{t}\\log f_\\ell."}</MathBlock></div>

<Prose>{"The diagonal has no retention factor because "}<code>{"F_t−F_t=0"}</code>{". Mask future entries to negative infinity, subtract the largest valid log influence in each row, and exponentiate. The denominator's unit floor becomes "}<code>{"exp(−row_scale)"}</code>{", just as in the recurrent formulation."}</Prose>

<Prose>{"This dense form materializes a "}<code>{"T×T"}</code>{" matrix. It is a useful mathematical reference, but defeats the memory goal for very long sequences. A third schedule uses chunks."}</Prose>

<H3>{"A chunk has old memory and new local writes"}</H3>

<Prose>{"The triangular grid assumed empty initialization. What crosses a chunk boundary when there is earlier memory? The next drawing switches explicitly to a nonzero3×2 incoming matrix and three-coordinate normalizer, then applies the first record from the same seven-record fixture. Follow old memory and new local writes on separate rails."}</Prose>

<ChunkWorkedFigure />

<Prose>{"The incoming matrix and normalizer contain the prehistory. Retention carries their contributions into each local output. The local triangle supplies writes from the current chunk. Add old and local numerators; independently add old and local signed masses; only then form one denominator and divide once. Boundary arrays preserve the resulting matrix and normalizer for the next chunk. A stabilized implementation carries the log-scale too. Logical chunks and smaller hardware tiles are different scheduling levels."}</Prose>

<Prose>{"Suppose a chunk begins after time "}<code>{"s"}</code>{". For a time "}<code>{"t"}</code>{" inside it, define incoming retention "}<code>{"p_t=∏_(ℓ=s+1)^t f_ℓ"}</code>{". The raw numerator is"}</Prose>

<div className="neural-equation"><MathBlock>{"C_s^\\top q_t\\,p_t+\\sum_{j=s+1}^{t}g_{t,j}v_j(k_j^\\top q_t)."}</MathBlock></div>

<Prose>{"The first term reads memory from before the chunk. The second performs a small causal comparison within the chunk. The signed normalizer combines the corresponding old and new contributions "}<strong>{"before"}</strong>{" applying the absolute value and floor. Normalizing each part separately and then adding would be a different operation."}</Prose>

<Prose>{"At the chunk's end, update its boundary state in one aggregate write:"}</Prose>

<div className="neural-equation"><MathBlock>{"C_{s+b}=\\left(\\prod_{\\ell=s+1}^{s+b}f_\\ell\\right)C_s\n+\\sum_{j=s+1}^{s+b}g_{s+b,j}k_jv_j^\\top,"}</MathBlock></div>

<Prose>{"with the analogous formula for "}<code>{"n"}</code>{". A final shorter chunk uses its actual length. Stabilized implementations align the scales of incoming and local quantities before combining them."}</Prose>

<Prose>{"The supplied "}<code>{"memory_mechanisms.py"}</code>{" includes a recurrent operator, a stabilized dense operator and an explicit chunk operator for moderate unscaled inputs. A seven-token checked example with key width three and value width two agrees across chunk sizes "}<code>{"1,2,3,4,7,9"}</code>{" to less than "}<code>{"3×10^−15"}</code>{". A nonzero incoming-state case also agrees. Editing the final three values leaves the first four outputs unchanged."}</Prose>

<Prose>{"The chunk program is a teaching reference for the decomposition. Its unscaled moderate-input arithmetic is not a safe replacement for a production stabilized kernel on arbitrary large log-weights."}</Prose>

<H3>{"Move a boundary while preserving its history"}</H3>

<Prose>{"Edit the seven-write sequence and compare whole-sequence, recurrent and chunk views with a boundary after the third write. Move the chunk size to two, four or larger than the sequence. Outputs should agree to rounding when state carry is correct."}</Prose>

<Prose>{"Now deliberately reset the state at a boundary. The later outputs can change; this is a changed input history, not a faster execution of the same history. Finally edit a future value and check an earlier output. That earlier output must remain unchanged."}</Prose>

<ChunkFlowLab part="schedule" />

<Prose>{"Why does sLSTM not get the same simple schedule? In sLSTM, this layer's gates depend on "}<code>{"h_(t−1)"}</code>{", which itself depends on the previous gates. Those gate values cannot all be precomputed from the layer input alone. This prevents the same direct input-precomputed affine scan. It does not prevent parallelism over batch, channels or heads, or efficient fused sequential kernels. In stacked mLSTM networks, layer inputs already contain learned context from earlier layers; precomputability within one layer does not mean the network is context-free."}</Prose>

<Prose>{"The boundary can be changed while inputs remain fixed. Conversely, change one input coordinate and keep the boundary: these next editors all share the same seven-record experiment. A coordinate selector only chooses which number you are editing; the tables and diagrams retain the others."}</Prose>

<ChunkFlowLab part="query" />

<Prose>{"A key changes where content is written."}</Prose>

<ChunkFlowLab part="key" />

<Prose>{"A value changes the content written at that address."}</Prose>

<ChunkFlowLab part="value" />

<Prose>{"Write and retention factors change the amount that survives."}</Prose>

<ChunkFlowLab part="gates" />

<Prose>{"An incoming state represents earlier observations outside this local sequence. Edit one key-row/value-column entry of that prehistory, then follow its contribution into the same chunked answer."}</Prose>

<ChunkFlowLab part="incoming" />

<Prose>{"Its normalizer must cross the boundary too; it is not reconstructed from the local writes."}</Prose>

<ChunkFlowLab part="normalizer" />

<Prose>{"Add or remove complete records. Restoring the example is an explicit reset of records, boundary and prehistory."}</Prose>

<ChunkFlowLab part="history" />

<Prose>{"A pin saves every input and incoming-state coordinate, chunk size and reset setting, so comparisons cannot silently use a different experiment."}</Prose>

<ChunkFlowLab part="compare" />

<H2>{"6. Put the cell inside a trainable network"}</H2>

<Prose>{"A correct memory operation does not yet classify an image. Where do projection, memory, residual paths and loss fit in the complete network? The arrays show their changing widths."}</Prose>

<ReaderBlockFigure />

<Prose>{"Eight input numbers are projected into sixteen learned features. RMS normalization prepares that vector for the chosen memory cell. Sixteen exposed outputs rejoin the unchanged embedding through the first residual addition. A second normalized branch expands sixteen features into two thirty-two-feature paths, applies SiLU to one, multiplies them, contracts back to sixteen and joins a second residual addition. The final ten-score projection and target-label branch meet at cross-entropy only after the eighth row. Dashed orange routes show how that loss trains the earlier parameters."}</Prose>

<Prose>{"A cell describes sequence mixing. A useful neural block also needs transformations around it. Our small experiment uses this complete path:"}</Prose>

<Prose>{""}<code>{"8 pixels in one row → learned 8-to-16 projection → RMS normalization → sequence cell → residual addition → RMS normalization → gated feed-forward network → residual addition → ten class logits"}</code>{"."}</Prose>

<Prose>{"A "}<strong>{"residual addition"}</strong>{" gives information a path around a transformation. "}<strong>{"RMS normalization"}</strong>{" divides a vector by the square root of its mean squared coordinate plus epsilon, then applies learned coordinate scales. Our feed-forward branch multiplies a SiLU-transformed projection by another projection before contracting back to width 16; this is a SwiGLU-style gated transformation. These operations are applied at each row. Only the final row's logits contribute to the training loss."}</Prose>

<Prose>{"A logit is an unconstrained class score. To turn the final vector "}<code>{"ℓ"}</code>{" into class probabilities, use "}<code>{"p_c=exp(ℓ_c)/Σ_j exp(ℓ_j)"}</code>{" with a stable softmax. For correct class "}<code>{"y"}</code>{", cross-entropy is "}<code>{"−log p_y"}</code>{". A high probability on the wrong digit incurs a large loss. Backpropagation differentiates this objective through the classifier, feed-forward block, every recurrent step and the learned projections. Adam updates the parameters."}</Prose>

<Prose>{"The scalar cell produces its four groups of preactivations from the current normalized input plus a learned transformation of the previous hidden vector. Its stored state is "}<code>{"(h,c,n,m)"}</code>{", each width 16. The matrix cell uses one key width of eight and a value width of 16. Its stored recurrent state is "}<code>{"(C,n,m)"}</code>{", with shapes "}<code>{"8×16"}</code>{", "}<code>{"8"}</code>{" and scalar. Its query is scaled once, and its read is normalized and output-gated. We cap its gate preactivations smoothly with "}<code>{"15 tanh(raw/15)"}</code>{" to bound the range in this instructional model."}</Prose>

<Prose>{"These are deliberately small one-head blocks. They expose the actual mechanisms without reproducing every projection, head arrangement, convolution or training recipe of a published large model."}</Prose>

<H3>{"Run the complete programs"}</H3>

<Prose>{"Download "}<a href={"/learn-code/xlstm-extended-lstm/row_sequence_models.py"}>{"row_sequence_models.py"}</a>{", "}<a href={"/learn-code/xlstm-extended-lstm/memory_mechanisms.py"}>{"memory_mechanisms.py"}</a>{", "}<a href={"/learn-code/xlstm-extended-lstm/author_calculations.py"}>{"author_calculations.py"}</a>{" and the attributed "}<a href={"/learn-code/xlstm-extended-lstm/optdigits.tra"}>{"optdigits.tra"}</a>{", "}<a href={"/learn-code/xlstm-extended-lstm/optdigits.tes"}>{"optdigits.tes"}</a>{", "}<a href={"/learn-code/xlstm-extended-lstm/optdigits.names"}>{"optdigits.names"}</a>{" files. "}<a href={"/learn-code/xlstm-extended-lstm/data-provenance.md"}>{"Data provenance"}</a>{" records the exact roles and attribution. Keep those files in one directory. Use a Python environment with NumPy and a CPU-capable PyTorch installation. The author run used Python 3.12.14, NumPy 2.3.5 and PyTorch 2.14.0+cpu; the bundle records those versions for reproduction."}</Prose>

<Prose>{"From that directory:"}</Prose>

<CodeBlock language={"bash"}>{"python memory_mechanisms.py\npython row_sequence_models.py\npython author_calculations.py\npython matrix_read_gradients.py"}</CodeBlock>

<Prose>{"The first command produces the exact cell traces and comparison checks. The second trains the six predeclared small models, writes per-epoch loss curves and confusion matrices to "}<code>{"row-sequence-results.json"}</code>{", and saves selected parameters and inspection arrays to "}<code>{"row-sequence-fits.npz"}</code>{". The third loads those saved fits to calculate edited-image investigation fixtures; it does not train again. The fourth independently differentiates the matrix read and checks both denominator branches against Torch autograd and coordinate finite differences. Everything uses the local data; no model download or network call occurs in these programs."}</Prose>

<Prose>{"Follow the code in the same order as the drawings. In "}<code>{"memory_mechanisms.py"}</code>{", scalar scans carry two totals and a shared log-scale; matrix scans add one outer product per write, then apply the scaled floor. Dense and chunk routines rearrange that same matrix operation. Their inputs are already-computed candidates, addresses and gates: these routines do not learn projections. The chunk routine deliberately uses moderate unscaled inputs; extreme log-weights belong in the stabilized recurrent routine."}</Prose>

<Prose>{""}<code>{"ScalarMemory.forward"}</code>{" receives a batch of sequences with shape batch×rows×16. At each row, two learned affine maps produce64 numbers: four width16 fields for write, forget, output and content. Splitting those fields, applying log-sigmoid/tanh, and rescaling the old and new contributions follows our scalar calculation coordinate by coordinate. The returned tuple "}<code>{"(h,c,n,m)"}</code>{" is the complete next input state; omitting h changes future gate calculations."}</Prose>

<Prose>{""}<code>{"MatrixMemory.forward"}</code>{" projects all input rows into queries and keys of width8 and values of width16. Query division by √8 occurs here, once. Its learned write/forget scores are smoothly capped, then the loop updates the batch×8×16 cell and batch×8 normalizer. "}<code>{"einsum(\"bkv,bk->bv\", cell, query)"}</code>{" contracts key rows, leaving one16-number value vector per batch item. The scalar denominator is broadcast across that vector. Read RMSNorm and the16 output gates then produce the cell’s exposed signal. Those learned surrounding operations are deliberately absent from the bare NumPy oracle."}</Prose>

<Prose>{""}<code>{"DigitReader.forward"}</code>{" first embeds eight pixel values, calls the selected cell on normalized embeddings, and adds the original embedding back. Two width32 feed-forward projections produce the SiLU and multiplicative branches; contraction restores width16 before the second residual addition. The classifier returns batch×rows×10 logits. "}<code>{"main"}</code>{" takes only the final row for cross-entropy, clears stale gradients, calls backward, clips the parameter-gradient norm and steps Adam. Validation runs with gradients disabled and selects the checkpoint; test labels assess the selected checkpoint rather than updating it. The ordinary LSTM comparison uses "}<code>{"torch.nn.LSTM"}</code>{" inside exactly the same surrounding reader."}</Prose>

<Prose>{"The complete source is included with this lesson. Read these functions beside their diagrams before changing dimensions or state boundaries. The explicit loops make state semantics visible; the reference operators vectorize key/value products and batch arithmetic, but are not presented as high-performance GPU kernels."}</Prose>

<XlstmProgram filename="memory_mechanisms.py" /><XlstmProgram filename="row_sequence_models.py" /><XlstmProgram filename="author_calculations.py" /><XlstmProgram filename="matrix_read_gradients.py" /><p>To inspect the retained experiment without refitting, download the <a href="/learn-code/xlstm-extended-lstm/row-sequence-fits.npz">six selected fits and inspection arrays</a> and <a href="/learn-code/xlstm-extended-lstm/row-sequence-results.json">complete measured curves and confusion matrices</a>. The calculation program reads the fit archive; the training program generates it.</p>

<Prose>{"Here is a small standalone scalar trace to reproduce the first calculation before running training:"}</Prose>

<CodeBlock language={"python"}>{"import math\n\nvalues = [0.2, -0.6, 0.8]\nwrite_logs = [math.log(weight) for weight in [1.0, 3.0, 9.0]]\ncell = normalizer = log_scale = 0.0\nfor value, write_log in zip(values, write_logs):\n    forget_log = math.log(0.5)\n    new_scale = max(forget_log + log_scale, write_log)\n    retain = math.exp(forget_log + log_scale - new_scale)\n    write = math.exp(write_log - new_scale)\n    cell = retain * cell + write * value\n    normalizer = retain * normalizer + write\n    hidden = 0.75 * cell / normalizer\n    log_scale = new_scale\n    print(f\"{hidden:.6f}\")"}</CodeBlock>

<Prose>{"Expected output:"}</Prose>

<CodeBlock language={"text"}>{"0.150000\n-0.364286\n0.443023"}</CodeBlock>

<Prose>{"This little program computes a mechanism with hand-chosen gates. The training program learns its gates from labeled examples. Keeping those two activities separate helps you identify whether a failure comes from the mathematics, an implementation, or a learned model's behavior."}</Prose>

<H2>{"7. Read real handwritten digits one row at a time"}</H2>

<Prose>{"The complete network needs actual examples. Return to the source3451 image from the opening and follow its measurements into the eight-row experiment."}</Prose>

<DigitScanFigure />

<Prose>{"The selected row contains original counts from zero to sixteen. Dividing by sixteen produces the input vector; this preprocessing applies to every row and every data role. The row order is a modeling choice about spatial input, not an acquisition timestamp."}</Prose>

<Prose>{"Which images may train the parameters, choose a checkpoint or assess the final result? The separate branches show different jobs, not interchangeable sample pools."}</Prose>

<RowDataRolesFigure />

<Prose>{"The original training file contains 3,823 images from thirty writers. Classwise selection assigns 1,000 to fitting, 300 to validation and leaves 2,523 unused. A separate file contains 1,797 images from thirteen other writers. Only fitting changes parameters; validation selects the epoch; the separate-writer file measures the selected model. Per-writer identities are not provided for auditing the internal classwise split."}</Prose>

<Prose>{"The UCI Optical Recognition of Handwritten Digits acquisition turns each4×4 region of a normalized bitmap into one0–16 count. The64 stored measurements are followed by the digit label. "}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"Dataset, acquisition and license"}</a>{"."}</Prose>

<Prose>{"The internal fitting/validation assignment uses a fixed random permutation within each class, selecting100 and30 images respectively. Full source IDs and file hashes are retained. All5,620 input vectors are distinct, but unavailable writer identities prevent a writer-level audit of that internal split."}</Prose>

<Prose>{"All three models use Adam at learning rate "}<code>{"0.003"}</code>{", 150 full-batch updates, and gradient-norm clipping at one. Each run saves the epoch with lowest clean validation cross-entropy. Seeds 19 and 43 were specified before evaluating their results. Every model is also assessed after reversing the order of its eight input rows, while retaining the same final digit label. This is a fixed stress test of order dependence; no model is trained on reversed images here."}</Prose>

<NeuralTable caption={"7. Read real handwritten digits one row at a time"} headers={[<>{"Model"}</>,<>{"Seed"}</>,<>{"Parameters"}</>,<>{"Selected epoch"}</>,<>{"Validation errors / 300"}</>,<>{"Clean test errors / 1,797"}</>,<>{"Reversed-row test errors / 1,797"}</>]} rows={[[<>{"LSTM"}</>,<>{"19"}</>,<>{"4,138"}</>,<>{"85"}</>,<>{"36"}</>,<>{"267"}</>,<>{"1,173"}</>],[<>{"LSTM"}</>,<>{"43"}</>,<>{"4,138"}</>,<>{"111"}</>,<>{"29"}</>,<>{"156"}</>,<>{"1,048"}</>],[<>{"sLSTM"}</>,<>{"19"}</>,<>{"4,074"}</>,<>{"138"}</>,<>{"22"}</>,<>{"123"}</>,<>{"1,136"}</>],[<>{"sLSTM"}</>,<>{"43"}</>,<>{"4,074"}</>,<>{"142"}</>,<>{"22"}</>,<>{"137"}</>,<>{"1,136"}</>],[<>{"mLSTM"}</>,<>{"19"}</>,<>{"2,828"}</>,<>{"104"}</>,<>{"67"}</>,<>{"419"}</>,<>{"921"}</>],[<>{"mLSTM"}</>,<>{"43"}</>,<>{"2,828"}</>,<>{"93"}</>,<>{"65"}</>,<>{"402"}</>,<>{"865"}</>]]} />

<Prose>{"These are executed CPU results for the supplied program, not values copied from a paper. In this setup the scalar variant performs well, while the narrow single-head matrix variant makes substantially more clean errors. The LSTM's two seeds also differ noticeably. The matrix model has fewer parameters, different state geometry and a particular initialization; this experiment does not isolate one universally superior cell design. Increasing its dimensions or changing training would be a new experiment with its own validation protocol."}</Prose>

<Prose>{"Reversing the rows hurts all three. In a causal reader, later evidence is processed after earlier evidence through learned transitions. Fixed-size state does not make the function invariant to order. The matrix model's smaller additional reverse penalty does not establish better overall robustness: its clean performance is already weaker."}</Prose>

<H3>{"Watch evidence arrive, and change it yourself"}</H3>

<Prose>{"The protocol defines what a comparison means. What did all six predeclared fits actually achieve? The dots show measured error counts on the same 1,797 test images."}</Prose>

<RowMetricsFigure /><RowCurveFlow />

<Prose>{"Clean and reversed-row measurements share the same denominator. The separation between each clean circle and reversed-order diamond shows the additional error count caused by changing row order. Each pair uses one fixed selected model; it is not a before-and-after training comparison."}</Prose>

<Prose>{"Aggregate error counts hide the mechanism. Where does the worked image first change the readout when later rows are erased? Follow its clean and edited prefixes."}</Prose>

<WorkedDigitTraceFigure />

<Prose>{"The unmodified source3451 image has label one. Its clean and bottom-three-rows-erased paths see identical first five rows, so those prefix outputs match. From the first erased row onward their states may diverge. The prefix readouts are inspectable computations, but the training loss supervised the final row only; an early winning class is not a calibrated early-exit policy."}</Prose>

<Prose>{"In the selected seed19 scalar model, source3451’s prefix classes are "}<code>{"[1,2,2,1,1,1,1,1]"}</code>{". It favors two after three rows and one after four. Erasing rows six through eight changes those last prefix classes to "}<code>{"[7,9,9]"}</code>{", so the final class becomes wrong. The unchanged first-five prefixes in the drawing are a direct causal check, not merely matching final labels."}</Prose>

<Prose>{"We now start a "}<strong>{"fresh image"}</strong>{", validation source187, rather than editing the worked source3451 above. Choose a pixel directly in the grid; arrow keys move selection and the intensity slider changes that pixel. All six saved fits are selectable. A model switch keeps your edited pixels."}</Prose>

<RowReaderFlow part="pixels" />

<Prose>{"How does each observed row change a class score? The current edited trace and original-image reference share the selected weights. Reversing whole row records deliberately changes the sequence, not the image acquisition process."}</Prose>

<RowReaderFlow part="decision" />

<Prose>{"What did the memory actually carry at that step? Select a channel, and a key row for matrix memory. The small learned matrix cell uses its own RMS-normalized read; this is not the released7B head norm."}</Prose>

<RowReaderFlow part="state" />

<Prose>{"How does that cell output move through the rest of the model? The full vector table follows the same selected prefix through projections, residuals, expansion, contraction and readout."}</Prose>

<RowReaderFlow part="block" />

<Prose>{"Does regrouping the same ordered rows change the result? Move the boundary and carry every state component; then deliberately reset all state. Compare every prefix logit and the complete final state, not just the winning class."}</Prose>

<RowReaderFlow part="boundary" />

<Prose>{"What if only the normalizer is reset? The exponential scalar and matrix cells depend on it; ordinary LSTM has no such state. This intervention preserves other edited settings."}</Prose>

<RowReaderFlow part="normalizer" />

<Prose>{"Erase later rows and check earlier prefixes, or blank the whole image. Learned biases still run on a blank input; a confident output is not evidence that an actual stroke was present."}</Prose>

<RowReaderFlow part="null" />

<Prose>{"Keep an exact image/model/execution reference before experimenting further. Only the explicitly labelled complete reset clears the entire investigation."}</Prose>

<RowReaderFlow part="compare" />

<Prose>{"A useful computational null is to process rows one through three, retain the complete recurrent state, and continue with rows four through eight. The logits should match processing all eight at once to floating-point tolerance. An intentional reset before row four can change them. A blank image need not produce uniform scores because the model has learned biases and its transitions still run; in seed 19, the scalar model predicts nine on the blank fixture. That is a model output without digit evidence, not a genuine recognition success."}</Prose>

<Prose>{"For a practical extension, define an occlusion or scan-order augmentation using fitting data, select any new settings with validation, and assess once on a reserved test protocol. Do not tune an augmentation on the test errors in the table and then call the same table an untouched final test."}</Prose>

<H3>{"Choose the implementation that owns the promised operation"}</H3>

<Prose>{"The scratch source "}<a href={"/learn-code/xlstm-extended-lstm/memory_mechanisms.py"}>{"memory_mechanisms.py"}</a>{" supplies scalar and matrix scans, the dense parallel form and an explicitly moderate-input chunk form. These are complete operators, not pseudocode pointing to an unspecified package. The practical tensor route is "}<a href={"/learn-code/xlstm-extended-lstm/row_sequence_models.py"}>{"row_sequence_models.py"}</a>{": "}<code>{"ScalarMemory"}</code>{" learns its input/recurrent gates; "}<code>{"MatrixMemory"}</code>{" learns Q/K/V and gates while carrying C, n and m; "}<code>{"DigitReader"}</code>{" supplies projections, normalization, residual/FFN composition, logits and the loss/optimizer loop. Autograd is reused from the earlier "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals"}>{"implemented differentiation lesson"}</a>{", whose actual engine and library bridge are available there. Rebuilding that engine inside a memory cell would obscure the new recurrence."}</Prose>

<Prose>{"Map the two sources before changing them. The NumPy C has key rows and value columns, so the batched Torch read is "}<code>{"einsum(\"bkv,bk->bv\", C, q)"}</code>{". Query scaling belongs in one place; the Torch network also applies an output gate and RMS normalization that the bare memory oracle does not. "}<code>{"MatrixMemory"}</code>{" bounds its learned gate preactivations with a tanh transform, a declared architectural choice for this experiment. The scalar model carries the previous hidden output as well as c/n/m because it affects later gates. Its full-versus-carried execution comparisons therefore need every state component and the same fitted weights."}</Prose>

<Prose>{"The output of a bare NumPy cell is not supposed to equal the full network's logits. First compare the matching cell equations, then carry those cell outputs through the same added projections and readout. The retained raw/stabilized, dense/recurrent, chunk-carry and gradient calculations in "}<code>{"memory_mechanisms.py"}</code>{" and "}<code>{"author_calculations.py"}</code>{" make these comparisons explicit. Recurrent matrix work is O(T d_k d_v), with O(d_k d_v+d_k) carried state per head. The dense form stores O(T²) coefficient information. Chunking balances retained matrix state and local chunk scores; the supplied unscaled chunk oracle is restricted to moderate log-gates, so use the stabilized recurrent route for the extreme-log investigation."}</Prose>

<Prose>{""}<strong>{"Control the state boundary."}</strong>{" Change the split of an eight-row input from 3/5 to 5/3 without changing weights. Compare every prefix logit and every returned state component with an unsplit pass. Then deliberately reset only n at the boundary."}</Prose>

<details><summary>Hint and reasoned solution</summary>

<Prose>{"For the valid continuation, pass the complete returned state into the suffix and concatenate outputs along time. In evaluation mode with fixed preprocessing this changes execution grouping, not the mathematical recurrence. Resetting n while retaining C/c changes normalization and therefore the read; it is not a harmless cache optimization. For the scalar cell retain h as well: resetting it can alter later gates even if c/n/m were preserved. Compare state tensors as well as class predictions, because a classifier can keep the same winning class despite a changed internal function. This construction is a complete small trainable sLSTM/mLSTM route; it is not a port of every released xLSTM block or checkpoint."}</Prose>

</details>

<H2>{"8. Distinguish a cell family from a published model"}</H2>

<Prose>{"Our small reader taught the operator. Is every published xLSTM built with that same block? Compare expansion placement and actual state shape before naming a release."}</Prose>

<VersionBlocksFigure />

<Prose>{"Original scalar blocks expand their feed-forward path after memory; original matrix blocks expand before the memory path and include causal convolution plus a separate value route. The later 7B model uses only matrix blocks with a separate post-memory feed-forward branch. Local arrows distinguish bypasses, gates and projections; array widths show where the work expands. Per-head LayerNorm inside its matrix module differs from the RMSNorms around the block."}</Prose>

<Prose>{"The original xLSTM family investigates two answers:"}</Prose>

<NeuralTable caption={"8. Distinguish a cell family from a published model"} headers={[<>{"Cell"}</>,<>{"Stored information"}</>,<>{"What determines the next gates?"}</>,<>{"Main mechanism to understand"}</>]} rows={[[<>{"sLSTM"}</>,<>{"Scalar content and normalization mass in each channel"}</>,<>{"Input and previous hidden state, with mixing within a head"}</>,<>{"Normalize a learned history of writes"}</>],[<>{"mLSTM"}</>,<>{"A key-by-value association matrix, plus normalization state in the exponential variant"}</>,<>{"Current layer input, without the same hidden-to-gate recurrence"}</>,<>{"Write outer products and read with a query"}</>]]} />

<Prose>{"A matrix head has a key width and a value width, which need not be equal."}</Prose>

<Prose>{""}<strong>{"Deeper branch."}</strong>{" The term xLSTM spans more than one architecture revision. Use the cell equations, block arrangement, gate choices and checkpoint configuration when identifying a model."}</Prose>

<Prose>{"The original 2024 work combines scalar and matrix blocks in different proportions. Its scalar block includes recurrent memory mixing and a feed-forward expansion after the sequence operation. Its original matrix block expands before the memory, with local convolution/projection details and gating around the matrix read. A notation such as "}<code>{"xLSTM[a:b]"}</code>{" describes the ratio of matrix to scalar blocks; it does not require both cell types inside every block. "}<a href={"https://arxiv.org/html/2405.04517v2"}>{"Original paper and cell/block diagrams"}</a>{"."}</Prose>

<Prose>{"The March 2025 xLSTM-7B release uses 32 matrix-memory blocks, not a mixed stack with a few scalar blocks. Its post-expansion block design uses RMS normalization around the memory and feed-forward branches, per-head LayerNorm inside matrix memory, and a SwiGLU feed-forward branch. The released configuration has embedding width 4,096, eight matrix heads, key width 256 and value width 512 per head. It uses a sigmoid forget gate and an exponential write gate, with other gate/normalization choices specified in the model. The paper reports pretraining on 2.3 trillion tokens at an 8,192-token context. These are characteristics of that release, not requirements for every xLSTM. "}<a href={"https://arxiv.org/html/2503.13427v1"}>{"xLSTM-7B paper"}</a>{", "}<a href={"https://huggingface.co/NX-AI/xLSTM-7b/blob/main/config.json"}>{"released configuration"}</a>{"."}</Prose>

<H3>{"Carry state through the released interface"}</H3>

<Prose>{"Our reader accepted pixel rows. A released language model instead accepts a batch of integer token IDs, produced by its own tokenizer. The same state-boundary question still applies: consume a prefix, preserve every layer’s state and then consume the suffix. The following adapter follows the inspected official "}<code>{"xLSTMLarge.forward"}</code>{" interface; it requires an already-loaded evaluation model configured with "}<code>{"return_last_states=True"}</code>{" and a compatible kernel backend. It was source-inspected, not executed against a downloaded checkpoint here."}</Prose>

<CodeBlock language={"python"}>{"import torch\n\n@torch.inference_mode()\ndef continue_token_sequence(model, token_ids, split):\n    if token_ids.ndim != 2 or not 0 < split < token_ids.shape[1]:\n        raise ValueError(\"Use a batch-by-time tensor and a nonempty prefix/suffix.\")\n    if not model.config.return_last_states:\n        raise ValueError(\"Construct the model with return_last_states=True.\")\n    model.eval()\n    prefix_logits, state = model(token_ids[:, :split], state=None)\n    prefix_snapshot = {\n        layer: tuple(tensor.clone() for tensor in tensors)\n        for layer, tensors in state.items()\n    }\n    suffix_logits, final_state = model(token_ids[:, split:], state=state)\n    return torch.cat((prefix_logits, suffix_logits), dim=1), prefix_snapshot, final_state"}</CodeBlock>

<Prose>{"The input slices change execution grouping, not token order. Outputs retain one vocabulary-score vector per token. The returned dictionary holds each layer’s C/n/m tensors. The implementation may update those tensors in place: cloning them preserves an actual prefix snapshot for comparison. A new independent sequence starts with "}<code>{"state=None"}</code>{". Kernel/device compatibility and checkpoint loading are separate requirements; the executed local Torch reader above remains the complete small-model reproduction. "}<a href={"https://github.com/NX-AI/xlstm/blob/main/xlstm/xlstm_large/model.py"}>{"Official forward/state implementation"}</a>{"."}</Prose>

<Prose>{"There is also a later sigmoid-input matrix variant. Start with its two differently activated write paths before comparing their resulting reads."}</Prose>

<SigmoidVariantFigure />

<Prose>{"It updates "}<code>{"C=σ(b)C_old+σ(a)kv^T"}</code>{", reads "}<code>{"C^T(q/√d_k)"}</code>{", and applies a normalization layer and output gate. It drops the exponential variant's "}<code>{"n"}</code>{" and "}<code>{"m"}</code>{" states. For very negative inputs, sigmoid and exponential write activations are close, but the two full operators are not universally identical. Normalization can reduce sensitivity to overall scale, while its epsilon matters for very small inputs. This is a purposeful architectural variant, not permission to silently substitute sigmoid into a checkpoint trained with different equations. "}<a href={"https://arxiv.org/html/2503.14376v2"}>{"Tiled Flash Linear Attention, §§4.1–4.2"}</a>{"."}</Prose>

<H3>{"Count state before claiming it is small"}</H3>

<Prose>{"The model keeps a fixed-size state. Fixed relative to what, and how large is it? Count one matrix, one normalizer vector and one log-scale per head first."}</Prose>

<StateAccountingFigure />

<Prose>{"One head stores key width times value width matrix entries, a key-width normalizer and one scalar scale. Heads and layers multiply those allocations; past sequence length does not. An attention cache instead retains key and value rows for each cached token. The comparison below uses the entered dimensions and float32 bytes, not measured device allocation or a universal crossover."}</Prose>

<Prose>{"For "}<code>{"L"}</code>{" layers, "}<code>{"H"}</code>{" heads and float32 state, the matrix storage is"}</Prose>

<div className="neural-equation"><MathBlock>{"4LHd_kd_v\\ \\text{bytes per sequence}."}</MathBlock></div>

<Prose>{"For the stated 7B configuration, that is "}<code>{"4×32×8×256×512 = 134,217,728"}</code>{" bytes, or "}<strong>{"128 MiB"}</strong>{". Adding one key-width normalizer and one scale value per head gives about "}<strong>{"128.251 MiB"}</strong>{". Model weights, surrounding activations, training gradients, batching and implementation workspaces are additional allocations."}</Prose>

<Prose>{"This state does not grow with the number of already-processed tokens. It can nevertheless be substantial, especially across many concurrent sequences. An attention key/value cache grows with cached length and its own head configuration. A comparison must specify both configurations and dtype; the word “constant” alone gives no crossover point."}</Prose>

<H3>{"Why chunks and kernels still matter"}</H3>

<Prose>{"For fixed head dimensions, recurrent matrix updates and reads cost on the order of "}<code>{"T d_k d_v"}</code>{" over a sequence. Dense causal comparison costs on the order of "}<code>{"T²(d_k+d_v)"}</code>{" and stores quadratic intermediates if materialized. A chunked schedule with chunk length "}<code>{"b"}</code>{" combines approximately "}<code>{"T b(d_k+d_v)"}</code>{" local comparison work with matrix-state read/write work on the order of "}<code>{"T d_k d_v"}</code>{". It does not divide every matrix-memory cost by the chunk size."}</Prose>

<Prose>{"Wall-clock speed also depends on where data live and which operations the hardware performs efficiently. Processing one token at a time provides little parallel sequence work. Chunking can use matrix multiplications, while storing too many boundary states consumes memory bandwidth. Tiled Flash Linear Attention separates larger logical chunks from smaller hardware tiles and handles rescaling as contributions are accumulated. Its reported speedups belong to its particular kernels, hardware and shapes; our CPU teaching loop measures none of them. "}<a href={"https://arxiv.org/html/2503.14376v2"}>{"TFLA algorithm and implementation"}</a>{", "}<a href={"https://github.com/NX-AI/mlstm_kernels"}>{"official kernels"}</a>{"."}</Prose>

<Prose>{"A cached attention decode step attends to "}<code>{"T"}</code>{" existing keys and is linear in that cached length for that step; full-sequence dense attention is quadratic in sequence length. These are different workloads. Fixed recurrent state gives an attractive decode memory pattern, but projections, feed-forward work, batching and kernel launch overhead still matter."}</Prose>

<Prose>{"A subsequent scaling-law study compares dense Llama-2-style models and xLSTM across a stated range of model sizes and token budgets. It fits both equal-compute profiles and a parametric loss surface, accounting for context-dependent sequence-mixing cost. Its reported favorable frontier for xLSTM is evidence for that controlled recipe and range. It does not prove superiority over every transformer variant, task or serving deployment, or guarantee that a fitted curve remains valid arbitrarily far beyond the experiments. "}<a href={"https://arxiv.org/html/2510.02228v2"}>{"Study methodology and released runs"}</a>{"."}</Prose>

<H2>{"9. Useful applications beyond a text decoder"}</H2>

<Prose>{"The digit experiment used image rows. How does a new task change the sequence axis and readout? Start with the complete image patch grid; then we will explicitly change the sequence axis for three other tasks."}</Prose>

<ApplicationFlowsFigure />

<Prose>{""}<strong>{"Image patches."}</strong>{" VisionLSTM groups pixels into patches, encodes each patch and traverses their spatial order. Odd blocks scan from top-left to bottom-right; even blocks reverse that path. The whole image exists before classification, so future spatial patches are not forbidden as they would be in online forecasting. The newer readout concatenates the first and last patch representations. The official implementation distinguishes that from the original average readout, and distinguishes spatial2D convolution from original causal1D convolution. Those details change the architecture; our eight-row digit reader is an isolated experiment, not an ImageNet VisionLSTM reproduction. "}<a href={"https://nx-ai.github.io/vision-lstm/"}>{"Author project"}</a>{" and "}<a href={"https://github.com/NX-AI/vision-lstm"}>{"official implementation"}</a>{"."}</Prose>

<Prose>{"The spatial patch sequence was fully observed. How do patches represent an unknown future instead? Presence must travel alongside values."}</Prose>

<ForecastApplicationFigure />

<Prose>{""}<strong>{"Time-series patches."}</strong>{" TiRex scales observations, concatenates a presence mask with each value patch, projects it into a token and processes scalar-memory blocks. An observed zero has mask1; an unknown value filled with zero has mask0. For multiple future patches, missing inputs continue the recurrent state rather than feeding back a point forecast. A readout returns nine quantiles per future time coordinate. Contiguous patch masking trains on the same kind of missing runs. This can carry uncertainty differently from median-feedback generation, but calibrated performance still requires task-specific assessment. "}<a href={"https://arxiv.org/html/2505.23719v2"}>{"TiRex §2"}</a>{"."}</Prose>

<Prose>{"That forecast scanned successive time patches. What if recurrence should connect different variables instead? First forecast each variable, then draw variables as rows and latent coordinates as columns."}</Prose>

<MixerApplicationFigure />

<Prose>{""}<strong>{"Variables rather than time steps."}</strong>{" Mixer first applies a shared linear forecast to each variable's normalized history. It embeds that forecast horizon into latent coordinates, prepends a learned prefix token and runs scalar recurrence across variable rows. Its second view reverses the latent dimensions, including the prefix representation; it does not reverse the original timestamps or the variable rows. Shared stacks process both views, then a learned projection combines them and reverses the instance normalization. This is a distinct forecasting architecture, not TiRex's missing-patch strategy. "}<a href={"https://arxiv.org/html/2410.16928v3"}>{"Mixer §§3.1–3.3"}</a>{"."}</Prose>

<Prose>{"A forecast predicts values. An agent chooses actions that influence later observations. Which information exists before each decision? Follow one chronological episode."}</Prose>

<EpisodeApplicationFigure />

<Prose>{""}<strong>{"Decisions in an episode."}</strong>{" LRAM encodes current observations and desired return, with earlier reward history, then predicts the current action. That action causes a reward that can enter only a later decision. Its sequence omits action-input tokens and its shared head predicts discretized action dimensions jointly. Complete recurrent state resets at an independent episode boundary. The reported offline benchmarks do not establish safe real-robot behavior in unfamiliar states. "}<a href={"https://arxiv.org/html/2410.22391v2"}>{"LRAM §3.2"}</a>{"."}</Prose>

<Prose>{"Each example changes representation, traversal, loss or readout deliberately. None establishes that one memory variant is best in every task."}</Prose>

<H2>{"10. Diagnose the failure at the right level"}</H2>

<Prose>{"When a result looks wrong, locate the layer of the problem before changing the model size."}</Prose>

<NeuralTable caption={"10. Diagnose the failure at the right level"} headers={[<>{"Symptom"}</>,<>{"First useful check"}</>,<>{"What the check distinguishes"}</>]} rows={[[<>{"Raw and stabilized scalar outputs differ"}</>,<>{"Rescale content and normalization together; check empty-state initialization"}</>,<>{"Representation error versus a different prior"}</>],[<>{"Matrix outputs differ only for small query alignment"}</>,<>{"Compare the raw unit floor with the scaled "}<code>{"exp(−m)"}</code>{" floor"}</>,<>{"An operator change hidden by ordinary examples"}</>],[<>{"A matrix is being displayed transposed"}</>,<>{"Label key and value dimensions and trace one outer product/read"}</>,<>{"Shape convention versus incorrect multiplication"}</>],[<>{"A future edit changes an earlier output"}</>,<>{"Check causal masks, input projections and sequence indexing"}</>,<>{"Leakage versus legitimate later-state change"}</>],[<>{"Splitting a sequence changes its answer"}</>,<>{"Carry every state component and preserve step order"}</>,<>{"A boundary reset versus the same computation"}</>],[<>{"Matrix training is worse than a scalar baseline"}</>,<>{"Inspect dimensions, normalization, gradients, fit/validation curves and objective"}</>,<>{"A poor configuration versus an architecture theorem"}</>],[<>{"A blank input gives a confident class"}</>,<>{"Inspect biases and the decision rule; assess calibration separately"}</>,<>{"A model preference versus actual input evidence"}</>],[<>{"A long input runs but retrieval fails"}</>,<>{"Measure the task at that length with controlled distractors"}</>,<>{"Executability versus usable memory"}</>]]} />

<Prose>{"Finite-precision arithmetic, denominator branches and bounded gates deserve targeted tests. They do not justify inventing universally safe numerical thresholds. The supplied programs use controlled float32 training and float64 mechanism checks; a mixed-precision GPU implementation needs its own affected numerical checks."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"11. Practice: transfer the mechanism"}</H2>

<Prose>{"Try each problem before opening its hint or solution. The first four check calculation and representation. The next three check model and sequence reasoning. The final three ask you to design or diagnose a realistic experiment."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A different scalar history"}</H3>

<Prose>{"Start with an empty ledger, candidates "}<code>{"[-0.5,0.25,1]"}</code>{", writes "}<code>{"[2,1,4]"}</code>{", retention "}<code>{"[0.5,0.5,0.25]"}</code>{", and output gate one. Calculate the final content, mass and output. Which candidate has the greatest final influence?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"At each step, multiply both old totals by that step's retention before adding the new content and weight. Alternatively compute each write's surviving weight at the final step."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"After the first write, "}<code>{"c=−1,n=2"}</code>{". After the second, "}<code>{"c=−0.25,n=2"}</code>{". After the third, "}<code>{"c=3.9375,n=4.5"}</code>{", so the output is "}<code>{"0.875"}</code>{". Final write weights are "}<code>{"[0.25,0.25,4]"}</code>{". The latest candidate supplies "}<code>{"4/4.5"}</code>{" of the mass and has the greatest influence. Its value is not multiplied by the step-three forget gate because it was not in the old state."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. A normalization prior"}</H3>

<Prose>{"For one candidate "}<code>{"0.8"}</code>{" with unit write, unit retention and output gate one, compare initialization "}<code>{"(c_0,n_0)=(0,0)"}</code>{" with "}<code>{"(0,1)"}</code>{". Are the different answers numerical errors?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Interpret the second initialization as an extra piece of zero-valued evidence."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The empty ledger returns "}<code>{"0.8/1=0.8"}</code>{". The second returns "}<code>{"0.8/2=0.4"}</code>{". Both follow their stated recurrences, but the second contains a zero-valued prior with unit mass. They implement different memory semantics. A programmer must not insert "}<code>{"n_0=1"}</code>{" while claiming exact equivalence to an empty ledger."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Stabilize a matrix floor"}</H3>

<Prose>{"A one-step memory has key "}<code>{"0.2"}</code>{", value three, query "}<code>{"0.5"}</code>{", and write log-weight "}<code>{"ln 5"}</code>{". Compute its raw read and its correctly stabilized read. What does a stabilized floor of one incorrectly produce?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The raw matrix equals three and its normalizer equals one. After rescaling by five, the fixed raw floor must be divided by five too."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Raw numerator is "}<code>{"3×0.5=1.5"}</code>{"; signed mass is "}<code>{"1×0.5=0.5"}</code>{"; denominator is one, giving "}<code>{"1.5"}</code>{". Scaled "}<code>{"C'=0.6,n'=0.2,m=ln 5"}</code>{" gives numerator "}<code>{"0.3"}</code>{" and denominator "}<code>{"max(0.1,0.2)=0.2"}</code>{", again "}<code>{"1.5"}</code>{". Keeping a floor of one would give "}<code>{"0.3"}</code>{". This case deliberately activates the floor, which a large-alignment test might miss."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Can a head forget only one address?"}</H3>

<Prose>{"A matrix head contains two orthogonal keys with useful values. At the next step you want to halve the old contribution for key A while leaving the old contribution for key B unchanged. Can the head's single scalar forget gate do this by itself? Propose a meaningful architectural or input change."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the old-state term as one scalar multiplying the entire matrix."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"No: "}<code>{"f C_old"}</code>{" scales both old contributions by the same factor. Separate heads could place them under different scalar gates if the learned representation supports that separation. A structured/vector forget operator or a targeted corrective write would be another mechanism, but changes the operation or relies on knowing the needed correction. The matrix's addressability at read time is not selective deletion at write time."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. A chunk-normalization trap"}</H3>

<Prose>{"At one output, the old-state numerator is two with signed mass two, and the local numerator is three with signed mass negative one. Compare normalizing the combined result with normalizing the two parts separately. Use a raw denominator floor of one."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Absolute value and the maximum are nonlinear. They cannot be distributed across a sum."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Correct combination gives numerator five, signed mass one and output five. Separate normalization gives "}<code>{"2/max(2,1)+3/max(1,1)=1+3=4"}</code>{". A chunk boundary must not change where normalization occurs. Align old/local scales, combine their numerator and signed mass, and then apply the shared denominator."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. What can an early prediction see?"}</H3>

<Prose>{"A digit reader has processed rows one through five. You edit row eight, rerun from the beginning, and see its row-three logits change. Name two possible implementation errors. Would reversing every input row be a valid null test for those logits?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Check both the recurrent computation and preprocessing that might combine rows before the recurrence."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A noncausal mixing operation or an incorrect future mask could leak row eight. Preprocessing that recomputes a per-image statistic using all eight rows could also change earlier inputs. Our fixed division by 16 avoids that particular dependency. Reversing all rows is not a null: it changes which evidence arrives in the first three steps. Editing only a future row under fixed causal preprocessing is the appropriate prefix-invariance check."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Count two different states"}</H3>

<Prose>{"A model has 12 matrix-memory layers, four heads per layer, key width 32, value width 64, and float32 state. Calculate matrix bytes per sequence and then add "}<code>{"n"}</code>{" and "}<code>{"m"}</code>{" for the exponential variant. Does processing twice as many tokens double this persistent state?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"There are "}<code>{"12×4"}</code>{" heads. Each stores "}<code>{"32×64"}</code>{" matrix values, 32 normalizer values and one scale value."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Matrix storage is "}<code>{"12×4×32×64×4=393,216"}</code>{" bytes, or "}<code>{"384 KiB"}</code>{". Adding normalization and scale gives "}<code>{"12×4×(2048+32+1)×4=399,552"}</code>{" bytes, or "}<code>{"390.1875 KiB"}</code>{". Persistent recurrent state does not double with processed length at fixed dimensions. Training activations and other execution buffers are separate and may depend on sequence length."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Improve the weak matrix digit model honestly"}</H3>

<Prose>{"You want to try a larger matrix head and row-order augmentation after reading the result table. Specify which data roles make decisions, which outcome you will optimize, and how you will avoid presenting this development process as an untouched new test."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Distinguish fitting parameters, selecting settings and estimating final performance. Previously inspected test outcomes cannot become unseen again."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Fit candidate models on fitting images, including augmentation generated only from those images. Choose the head sizes, augmentation policy and stopping epoch with a declared validation objective, such as clean validation cross-entropy plus a separately declared stress requirement. Keep all candidate and selection decisions recorded. Because the published test table has already informed this development, describe the result as follow-up analysis on that benchmark; use a genuinely new reserved assessment set or a predeclared external protocol for a fresh final generalization claim. Report parameter counts and clean/stress performance together."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Design a memory test instead of a speed claim"}</H3>

<Prose>{"Two models can process 100,000 tokens. One has fixed recurrent state and the other a growing cache. Design a small controlled retrieval task that tests useful memory without confusing it with execution success."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Vary one demand on memory at a time: delay, distractors, number of associations or updates to an address."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Generate sequences that introduce random key/value pairs and later query a specified key. Keep key/value distributions and output scoring fixed. Vary delay separately from the number of intervening unrelated pairs, then add a condition where a key receives a new value and the correct answer is its latest value. Prevent accidental answer cues in position or token frequency. Report retrieval accuracy by condition and length, alongside any measured memory/latency under explicit hardware and batch settings. A model finishing the input is not evidence that it retrieved the association correctly; a small random-key task is still not every long-context application."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. A forecast mask and an episode boundary"}</H3>

<Prose>{"A forecasting system inserts zeros for unknown future values but has no presence mask. A control system carries its recurrent state from one independent episode into the next. Explain the information problem in each, and propose a corrected contract."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether a zero was observed and whether previous state belongs to the same causal history."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Without a mask, a forecast model cannot directly distinguish an observed zero from an unknown value represented by zero. Provide presence information and train the model under the missing-input pattern used during forecasting, while fitting normalization on information available at forecast time. For independent control episodes, reset every required state component and any other cache at the episode boundary. Carrying state is appropriate only when the task explicitly defines a continuous history; otherwise it introduces irrelevant prior-episode information and can invalidate evaluation."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources" data-lesson-resource-list=""><H2>{"12. References and another way to learn"}</H2>

<Prose>{"Use these resources for their different teaching roles. The calculations and small experiments above are self-contained; no video is required to understand an equation."}</Prose>

<ul><li>{""}<a href={"https://colah.github.io/posts/2015-08-Understanding-LSTMs/"}>{"Olah’s illustrated LSTM anatomy"}</a>{" and "}<a href={"https://d2l.ai/chapter_recurrent-modern/lstm.html"}>{"D2L’s LSTM chapter"}</a>{". Two alternative foundations for gates, separate content/hidden states and scratch/tensor implementations; read these before the original xLSTM equations if ordinary recurrence still feels unfamiliar."}</li><li>{""}<a href={"https://arxiv.org/html/2405.04517v2"}>{"Original xLSTM paper, Beck and colleagues"}</a>{". Advanced primary reference for both cell families. After the scalar and matrix examples, inspect the main cell equations, then Appendix A's vector forms and block diagrams. Its benchmark settings and architecture variants should not be silently transferred to later releases."}</li><li>{""}<a href={"https://arxiv.org/html/2503.13427v1"}>{"xLSTM-7B paper"}</a>{". Read the architecture changes alongside the "}<a href={"https://huggingface.co/NX-AI/xLSTM-7b/blob/main/config.json"}>{"released configuration"}</a>{"; this is the best route for understanding why a family diagram and a specific checkpoint may differ."}</li><li>{""}<a href={"https://github.com/NX-AI/xlstm"}>{"Official xLSTM repository"}</a>{" and "}<a href={"https://huggingface.co/NX-AI/xLSTM-7b"}>{"7B model card"}</a>{". Practical integration references with current backend and loading instructions. The model card provides a Transformers loading route as checked in September 2026. Check the exact package revision and checkpoint license before using it; the released weights have the NXAI Community License. No pretrained-model execution is needed for this lesson's offline program."}</li><li>{""}<a href={"https://arxiv.org/html/2503.14376v2"}>{"Tiled Flash Linear Attention"}</a>{" and "}<a href={"https://github.com/NX-AI/mlstm_kernels"}>{"kernel repository"}</a>{". Read the recurrent/chunk equations first, then the two-level tiling and sigmoid-variant sections. GPU kernel details are an optional branch after the mathematical operator is clear."}</li><li>{""}<a href={"https://www.youtube.com/watch?v=KjvCtslDJv0"}>{"Maximilian Beck's author presentation"}</a>{", with "}<a href={"https://maxbeck.ai/resources/talks/2026-03-PhD_Defense_Beck_share_selected.pdf"}>{"selected 2026 defense slides"}</a>{" and "}<a href={"https://maxbeck.ai/talks/"}>{"author talks index"}</a>{". An alternate visual route through recurrent memories, kernels and the later work. The author-linked recording was identified and selected slide text was reviewed for this lesson; the recording was not watched and no unverified timestamps are supplied."}</li><li>{""}<a href={"https://arxiv.org/html/2510.02228v2"}>{"xLSTM scaling-law study"}</a>{" and "}<a href={"https://github.com/NX-AI/xlstm_scaling_laws"}>{"released analysis materials"}</a>{". Useful for practicing critical reading of equal-compute comparisons. Separate fitted curves, measured training runs and extrapolations; the notebooks are optional and were not run for this lesson."}</li><li>{""}<a href={"https://nx-ai.github.io/vision-lstm/"}>{"VisionLSTM author project"}</a>{", "}<a href={"https://arxiv.org/html/2505.23719v2"}>{"TiRex method"}</a>{", "}<a href={"https://arxiv.org/html/2410.16928v3"}>{"xLSTM-Mixer method"}</a>{", and "}<a href={"https://arxiv.org/html/2410.22391v2"}>{"LRAM method"}</a>{". These are application-specific readings. Focus on the sequence axis, what information is available at a step, the task loss and the readout before looking at benchmark tables."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits"}>{"UCI Optical Recognition of Handwritten Digits"}</a>{". Original source and attribution for the executable experiment. The lesson's row-scanning protocol, split assignments, trained models and stress results are its own derived work."}</li></ul>

<Prose>{"You are ready to move on when you can trace one scalar and one matrix update, explain the changed-scale denominator, distinguish a computational schedule from an architectural change, and interpret the real experiment's success and failure without overclaiming."}</Prose>

<Prose>{"The next topic in this module is "}<a href={"/learn/path/full-curriculum/hyena-long-convolution-models?module=deep-learning-fundamentals"}>{"Hyena: Long-Convolution Models"}</a>{". It asks how long filters and input-dependent gates can mix a sequence without either an explicit all-pairs attention matrix or this particular recurrent memory cell. For comparison, revisit the earlier "}<a href={"/learn/path/full-curriculum/rwkv-linear-attention-models?module=deep-learning-fundamentals"}>{"RWKV and linear-attention models"}</a>{" and "}<a href={"/learn/path/full-curriculum/state-space-models-s4-mamba-mamba-2?module=deep-learning-fundamentals"}>{"state-space models"}</a>{"; their state updates share some computational ideas while retaining different operators."}</Prose></section>
</XlstmReaderProvider></XlstmMemoryProvider></div>};
